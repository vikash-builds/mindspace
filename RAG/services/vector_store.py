import faiss
import numpy as np
import os
import pickle
import config

class VectorStore:
    def __init__(self, user_id):
        self.user_id = str(user_id)
        self.index_path = os.path.join(config.INDEX_DIR, f"{self.user_id}.index")
        self.map_path = os.path.join(config.MAP_DIR, f"{self.user_id}.pkl")
        
        self.dimension = config.VECTOR_DIMENSION
        
        if os.path.exists(self.index_path):
            self.index = faiss.read_index(self.index_path)
            with open(self.map_path, 'rb') as f:
                self.chunk_map = pickle.load(f)
        else:
            self.index = faiss.IndexFlatL2(self.dimension)
            self.chunk_map = [] # List of dicts: {"doc_id": id, "text": text}
            
    def add_chunks(self, doc_id, texts, embeddings):
        embeddings = np.array(embeddings).astype('float32')
        self.index.add(embeddings)
        
        for text in texts:
            self.chunk_map.append({
                "doc_id": doc_id,
                "text": text
            })
            
        self._save()
        return len(texts)
        
    def search(self, query_embedding, k=5):
        query_embedding = np.array([query_embedding]).astype('float32')
        distances, indices = self.index.search(query_embedding, k)
        
        results = []
        for i, idx in enumerate(indices[0]):
            if idx != -1 and idx < len(self.chunk_map):
                results.append({
                    "text": self.chunk_map[idx]["text"],
                    "doc_id": self.chunk_map[idx]["doc_id"],
                    "score": float(distances[0][i])
                })
        return results
        
    def delete_document(self, doc_id):
        # FAISS IndexFlatL2 doesn't support easy deletion by ID.
        # Since we use per-user indexes and the index is small, we rebuild it.
        # For a local-first simple app, this is acceptable.
        new_chunk_map = [c for c in self.chunk_map if c["doc_id"] != doc_id]
        
        if len(new_chunk_map) == len(self.chunk_map):
            return False # Nothing changed
            
        # Rebuild index
        from services.embeddings import embedding_service
        self.index = faiss.IndexFlatL2(self.dimension)
        self.chunk_map = []
        
        if new_chunk_map:
            texts = [c["text"] for c in new_chunk_map]
            embeddings = embedding_service.embed_text(texts)
            self.add_chunks(doc_id, texts, embeddings) # Re-add with original text
            # Wait, add_chunks uses doc_id for all. This is wrong for rebuild.
            # Let's fix this.
            
            # Rebuild logic:
            self.index = faiss.IndexFlatL2(self.dimension)
            self.chunk_map = []
            
            # Group by doc_id to re-add correctly (though for retrieval, only text matters)
            # Actually, let's just re-embed everything.
            embeddings = embedding_service.embed_text(texts)
            self.index.add(np.array(embeddings).astype('float32'))
            self.chunk_map = new_chunk_map
            
        self._save()
        return True

    def _save(self):
        faiss.write_index(self.index, self.index_path)
        with open(self.map_path, 'wb') as f:
            pickle.dump(self.chunk_map, f)

def get_vector_store(user_id):
    return VectorStore(user_id)
