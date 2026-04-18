from functools import lru_cache

import requests

import config


class LocalEmbeddingService:
    def __init__(self):
        from sentence_transformers import SentenceTransformer

        self.model = SentenceTransformer(config.LOCAL_EMBEDDING_MODEL)

    def embed_text(self, texts):
        is_single = isinstance(texts, str)
        payload = [texts] if is_single else texts
        embeddings = self.model.encode(payload)
        return embeddings[0] if is_single else embeddings


class OpenAIEmbeddingService:
    def __init__(self):
        self.base_url = config.OPENAI_BASE_URL.rstrip('/')
        self.model = config.OPENAI_EMBEDDING_MODEL
        self.api_key = config.OPENAI_API_KEY

    def embed_text(self, texts):
        if not self.api_key:
            raise ValueError('OPENAI_API_KEY is required for hosted embeddings')

        is_single = isinstance(texts, str)
        payload = [texts] if is_single else texts
        response = requests.post(
            f'{self.base_url}/embeddings',
            headers={
                'Authorization': f'Bearer {self.api_key}',
                'Content-Type': 'application/json',
            },
            json={
                'model': self.model,
                'input': payload,
            },
            timeout=60,
        )
        response.raise_for_status()
        embeddings = [item['embedding'] for item in response.json().get('data', [])]
        if not embeddings:
            raise ValueError('No embeddings returned from OpenAI')
        return embeddings[0] if is_single else embeddings


class GeminiEmbeddingService:
    def __init__(self):
        self.base_url = config.GEMINI_BASE_URL.rstrip('/')
        self.model = config.GEMINI_EMBEDDING_MODEL
        self.api_key = config.GEMINI_API_KEY
        self.output_dimensionality = config.GEMINI_VECTOR_DIMENSION

    def embed_text(self, texts):
        if not self.api_key:
            raise ValueError('GEMINI_API_KEY is required for Gemini embeddings')

        is_single = isinstance(texts, str)
        payload = [texts] if is_single else list(texts)

        if is_single:
            response = requests.post(
                f'{self.base_url}/models/{self.model}:embedContent',
                headers={
                    'x-goog-api-key': self.api_key,
                    'Content-Type': 'application/json',
                },
                json={
                    'model': f'models/{self.model}',
                    'content': {
                        'parts': [
                            {'text': payload[0]},
                        ],
                    },
                    'taskType': 'RETRIEVAL_QUERY',
                    'outputDimensionality': self.output_dimensionality,
                },
                timeout=120,
            )
            response.raise_for_status()
            embedding = (response.json().get('embedding') or {}).get('values')
            if not embedding:
                raise ValueError('No embedding returned from Gemini')
            return embedding

        requests_payload = []
        for text in payload:
            requests_payload.append({
                'model': f'models/{self.model}',
                'content': {
                    'parts': [
                        {'text': text},
                    ],
                },
                'taskType': 'RETRIEVAL_DOCUMENT',
                'outputDimensionality': self.output_dimensionality,
            })

        response = requests.post(
            f'{self.base_url}/models/{self.model}:batchEmbedContents',
            headers={
                'x-goog-api-key': self.api_key,
                'Content-Type': 'application/json',
            },
            json={'requests': requests_payload},
            timeout=180,
        )
        response.raise_for_status()
        embeddings = [
            item.get('values', [])
            for item in response.json().get('embeddings', [])
        ]
        if not embeddings:
            raise ValueError('No embeddings returned from Gemini')
        return embeddings


@lru_cache(maxsize=4)
def _get_service(provider):
    if provider == 'gemini':
        return GeminiEmbeddingService()
    if provider == 'openai':
        return OpenAIEmbeddingService()
    return LocalEmbeddingService()


class EmbeddingService:
    def embed_text(self, texts, provider=None):
        active_provider = config.get_embedding_provider(provider)
        return _get_service(active_provider).embed_text(texts)


embedding_service = EmbeddingService()
