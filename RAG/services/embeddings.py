from sentence_transformers import SentenceTransformer
import config

class EmbeddingService:
    def __init__(self):
        self.model = SentenceTransformer(config.EMBEDDING_MODEL)
        
    def embed_text(self, texts):
        is_single = isinstance(texts, str)
        if is_single:
            texts = [texts]
        
        embeddings = self.model.encode(texts)
        
        return embeddings[0] if is_single else embeddings

embedding_service = EmbeddingService()
