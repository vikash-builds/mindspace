import os
import pickle

import faiss
import numpy as np

import config


def _normalize_metadata(doc_id, texts, metadata=None):
    base = metadata or {}
    source_type = base.get('source_type') or 'local'
    source_name = base.get('source_name') or ''
    external_url = base.get('external_url') or ''
    mime_type = base.get('mime_type') or ''

    chunk_records = []
    for index, text in enumerate(texts):
        chunk_records.append({
            'doc_id': str(doc_id),
            'text': text,
            'source_type': source_type,
            'source_name': source_name,
            'external_url': external_url,
            'mime_type': mime_type,
            'chunk_index': index,
        })
    return chunk_records


class LocalVectorStore:
    def __init__(self, user_id):
        self.user_id = str(user_id)
        self.dimension = config.get_embedding_dimension('local')
        self.index_path = os.path.join(config.INDEX_DIR, f'{self.user_id}_{self.dimension}.index')
        self.map_path = os.path.join(config.MAP_DIR, f'{self.user_id}_{self.dimension}.pkl')

        if os.path.exists(self.index_path) and os.path.exists(self.map_path):
            self.index = faiss.read_index(self.index_path)
            with open(self.map_path, 'rb') as handle:
                self.chunk_map = pickle.load(handle)
        else:
            self.index = faiss.IndexFlatL2(self.dimension)
            self.chunk_map = []

    def add_chunks(self, doc_id, texts, embeddings, metadata=None):
        records = _normalize_metadata(doc_id, texts, metadata)
        vectors = np.array(embeddings).astype('float32')
        self.index.add(vectors)
        self.chunk_map.extend(records)
        self._save()
        return len(records)

    def search(self, query_embedding, k=5):
        if not self.chunk_map:
            return []

        query_vector = np.array([query_embedding]).astype('float32')
        limit = min(k, len(self.chunk_map))
        distances, indices = self.index.search(query_vector, limit)

        results = []
        for rank, idx in enumerate(indices[0]):
            if idx == -1 or idx >= len(self.chunk_map):
                continue
            metadata = self.chunk_map[idx]
            results.append({
                'text': metadata['text'],
                'doc_id': metadata['doc_id'],
                'source_type': metadata.get('source_type', 'local'),
                'source_name': metadata.get('source_name', ''),
                'external_url': metadata.get('external_url', ''),
                'mime_type': metadata.get('mime_type', ''),
                'chunk_index': metadata.get('chunk_index', rank),
                'score': float(distances[0][rank]),
            })
        return results

    def delete_document(self, doc_id):
        doc_id = str(doc_id)
        remaining = [chunk for chunk in self.chunk_map if str(chunk.get('doc_id')) != doc_id]
        if len(remaining) == len(self.chunk_map):
            return False

        self.chunk_map = remaining
        self.index = faiss.IndexFlatL2(self.dimension)

        if remaining:
            from services.embeddings import embedding_service

            texts = [chunk['text'] for chunk in remaining]
            embeddings = embedding_service.embed_text(texts, provider='local')
            self.index.add(np.array(embeddings).astype('float32'))

        self._save()
        return True

    def _save(self):
        faiss.write_index(self.index, self.index_path)
        with open(self.map_path, 'wb') as handle:
            pickle.dump(self.chunk_map, handle)


class PineconeVectorStore:
    def __init__(self, user_id):
        self.user_id = str(user_id)
        self.namespace = f'{config.PINECONE_NAMESPACE_PREFIX}-{self.user_id}'
        self.index = self._get_index()

    def _get_index(self):
        if not config.PINECONE_API_KEY or not config.PINECONE_INDEX_NAME:
            raise ValueError('PINECONE_API_KEY and PINECONE_INDEX_NAME are required for hosted vector storage')

        from pinecone import Pinecone

        client = Pinecone(api_key=config.PINECONE_API_KEY)
        if config.PINECONE_INDEX_HOST:
            return client.Index(host=config.PINECONE_INDEX_HOST)

        try:
            index_names = set()
            if hasattr(client, 'list_indexes'):
                listed = client.list_indexes()
                if hasattr(listed, 'names'):
                    index_names = set(listed.names())
                elif isinstance(listed, dict):
                    index_names = set(listed.get('indexes', []))
                else:
                    try:
                        index_names = {item.get('name') for item in listed if item.get('name')}
                    except TypeError:
                        index_names = set()

            if index_names and config.PINECONE_INDEX_NAME not in index_names:
                raise ValueError(
                    f"Pinecone index '{config.PINECONE_INDEX_NAME}' was not found for the configured API key. "
                    f"Available indexes: {', '.join(sorted(index_names))}"
                )
        except ValueError:
            raise
        except Exception:
            pass

        try:
            return client.Index(config.PINECONE_INDEX_NAME)
        except Exception as exc:
            raise ValueError(
                f"Failed to connect to Pinecone index '{config.PINECONE_INDEX_NAME}'. "
                "Check that the index name is correct, the API key matches the same Pinecone project, "
                "or set PINECONE_INDEX_HOST explicitly from the Pinecone Connect dialog."
            ) from exc

    def add_chunks(self, doc_id, texts, embeddings, metadata=None):
        chunk_records = _normalize_metadata(doc_id, texts, metadata)
        vectors = []
        for record, embedding in zip(chunk_records, embeddings):
            vectors.append({
                'id': f"{record['doc_id']}:{record['chunk_index']}",
                'values': list(embedding),
                'metadata': {
                    **record,
                    'user_id': self.user_id,
                },
            })

        if vectors:
            self.index.upsert(vectors=vectors, namespace=self.namespace)
        return len(vectors)

    def search(self, query_embedding, k=5):
        response = self.index.query(
            namespace=self.namespace,
            vector=list(query_embedding),
            top_k=k,
            include_metadata=True,
        )
        matches = getattr(response, 'matches', None)
        if matches is None and isinstance(response, dict):
            matches = response.get('matches', [])
        matches = matches or []

        results = []
        for match in matches:
            metadata = getattr(match, 'metadata', None)
            if metadata is None and isinstance(match, dict):
                metadata = match.get('metadata', {})
            metadata = metadata or {}

            score = getattr(match, 'score', None)
            if score is None and isinstance(match, dict):
                score = match.get('score', 0)

            results.append({
                'text': metadata.get('text', ''),
                'doc_id': metadata.get('doc_id'),
                'source_type': metadata.get('source_type', 'local'),
                'source_name': metadata.get('source_name', ''),
                'external_url': metadata.get('external_url', ''),
                'mime_type': metadata.get('mime_type', ''),
                'chunk_index': metadata.get('chunk_index', 0),
                'score': float(score or 0),
            })
        return results

    def delete_document(self, doc_id):
        self.index.delete(
            namespace=self.namespace,
            filter={'doc_id': {'$eq': str(doc_id)}},
        )
        return True


def get_vector_store(user_id, provider=None):
    active_provider = config.get_vector_provider(provider)
    if active_provider == 'pinecone':
        return PineconeVectorStore(user_id)
    return LocalVectorStore(user_id)
