import os
from dotenv import load_dotenv

load_dotenv()

# App settings
PORT = int(os.getenv('PORT', 5001))
STORAGE_DIR = os.path.join(os.path.dirname(__file__), 'storage')
INDEX_DIR = os.path.join(STORAGE_DIR, 'faiss_indexes')
MAP_DIR = os.path.join(STORAGE_DIR, 'chunk_maps')

# Ensure directories exist
for d in [STORAGE_DIR, INDEX_DIR, MAP_DIR]:
    os.makedirs(d, exist_ok=True)

# Embedding settings
EMBEDDING_MODEL = 'all-MiniLM-L6-v2'
VECTOR_DIMENSION = 384

# LLM settings (Ollama)
OLLAMA_BASE_URL = os.getenv('OLLAMA_BASE_URL', 'http://localhost:11434')
OLLAMA_MODEL = os.getenv('OLLAMA_MODEL', 'llama3.2')

# Chunking settings
CHUNK_SIZE = 2000
CHUNK_OVERLAP = 400
