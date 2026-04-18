import os
from dotenv import load_dotenv

load_dotenv()


def _normalize_provider(value, default):
    return (value or default).strip().lower()


BASE_DIR = os.path.dirname(__file__)

# App settings
PORT = int(os.getenv('PORT', 5001))
STORAGE_DIR = os.path.join(BASE_DIR, 'storage')
INDEX_DIR = os.path.join(STORAGE_DIR, 'faiss_indexes')
MAP_DIR = os.path.join(STORAGE_DIR, 'chunk_maps')

for directory in [STORAGE_DIR, INDEX_DIR, MAP_DIR]:
    os.makedirs(directory, exist_ok=True)

# Deployment and provider settings
DEPLOYMENT_MODE = _normalize_provider(os.getenv('DEPLOYMENT_MODE'), 'local')
LLM_PROVIDER = _normalize_provider(
    os.getenv('LLM_PROVIDER'),
    'ollama' if DEPLOYMENT_MODE == 'local' else 'gemini',
)
EMBEDDING_PROVIDER = _normalize_provider(
    os.getenv('EMBEDDING_PROVIDER'),
    'local' if DEPLOYMENT_MODE == 'local' else 'gemini',
)
VECTOR_DB_PROVIDER = _normalize_provider(
    os.getenv('VECTOR_DB_PROVIDER'),
    'faiss' if DEPLOYMENT_MODE == 'local' else 'pinecone',
)

# Local embedding settings
LOCAL_EMBEDDING_MODEL = os.getenv('LOCAL_EMBEDDING_MODEL', 'all-MiniLM-L6-v2')
LOCAL_VECTOR_DIMENSION = int(os.getenv('LOCAL_VECTOR_DIMENSION', 384))

# Hosted embedding settings
OPENAI_API_KEY = os.getenv('OPENAI_API_KEY', '')
OPENAI_BASE_URL = os.getenv('OPENAI_BASE_URL', 'https://api.openai.com/v1')
OPENAI_CHAT_MODEL = os.getenv('OPENAI_CHAT_MODEL', 'gpt-4o-mini')
OPENAI_EMBEDDING_MODEL = os.getenv('OPENAI_EMBEDDING_MODEL', 'text-embedding-3-large')
OPENAI_VECTOR_DIMENSION = int(os.getenv('OPENAI_VECTOR_DIMENSION', 3072))

# Gemini settings
GEMINI_API_KEY = os.getenv('GEMINI_API_KEY', '')
GEMINI_BASE_URL = os.getenv('GEMINI_BASE_URL', 'https://generativelanguage.googleapis.com/v1beta')
GEMINI_CHAT_MODEL = os.getenv('GEMINI_CHAT_MODEL', 'gemini-2.5-flash')
GEMINI_EMBEDDING_MODEL = os.getenv('GEMINI_EMBEDDING_MODEL', 'gemini-embedding-001')
GEMINI_VECTOR_DIMENSION = int(os.getenv('GEMINI_VECTOR_DIMENSION', 1536))

# Pinecone settings
PINECONE_API_KEY = os.getenv('PINECONE_API_KEY', '')
PINECONE_INDEX_NAME = os.getenv('PINECONE_INDEX_NAME', '')
PINECONE_INDEX_HOST = os.getenv('PINECONE_INDEX_HOST', '')
PINECONE_NAMESPACE_PREFIX = os.getenv('PINECONE_NAMESPACE_PREFIX', 'mindspace')

# LLM settings (Ollama)
OLLAMA_BASE_URL = os.getenv('OLLAMA_BASE_URL', 'http://localhost:11434')
OLLAMA_MODEL = os.getenv('OLLAMA_MODEL', 'llama3.2')

# Chunking settings
CHUNK_SIZE = int(os.getenv('CHUNK_SIZE', 2000))
CHUNK_OVERLAP = int(os.getenv('CHUNK_OVERLAP', 400))


def get_embedding_dimension(provider=None):
    active_provider = _normalize_provider(provider, EMBEDDING_PROVIDER)
    if active_provider == 'gemini':
        return GEMINI_VECTOR_DIMENSION
    if active_provider == 'openai':
        return OPENAI_VECTOR_DIMENSION
    return LOCAL_VECTOR_DIMENSION


def get_vector_provider(provider=None):
    return _normalize_provider(provider, VECTOR_DB_PROVIDER)


def get_embedding_provider(provider=None):
    return _normalize_provider(provider, EMBEDDING_PROVIDER)


def get_llm_provider(provider=None):
    return _normalize_provider(provider, LLM_PROVIDER)
