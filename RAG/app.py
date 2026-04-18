from flask import Flask, jsonify, request
from flask_cors import CORS
import config
import os

app = Flask(__name__)
CORS(app)

from routes.ingest import handle_ingest
from routes.query import handle_query
from services.action_extractor import extract_action_candidates
from services.parser import get_document_text

# Health check
@app.route('/health', methods=['GET'])
def health():
    if config.EMBEDDING_PROVIDER == 'gemini':
        embedding_model = config.GEMINI_EMBEDDING_MODEL
    elif config.EMBEDDING_PROVIDER == 'openai':
        embedding_model = config.OPENAI_EMBEDDING_MODEL
    else:
        embedding_model = config.LOCAL_EMBEDDING_MODEL

    if config.LLM_PROVIDER == 'gemini':
        llm_model = config.GEMINI_CHAT_MODEL
    elif config.LLM_PROVIDER == 'openai':
        llm_model = config.OPENAI_CHAT_MODEL
    else:
        llm_model = config.OLLAMA_MODEL

    return jsonify({
        "status": "online",
        "deployment_mode": config.DEPLOYMENT_MODE,
        "embedding_provider": config.EMBEDDING_PROVIDER,
        "vector_provider": config.VECTOR_DB_PROVIDER,
        "llm_provider": config.LLM_PROVIDER,
        "embedding_model": embedding_model,
        "llm_model": llm_model,
    })

# Ingest route
@app.route('/ingest', methods=['POST'])
def ingest():
    return handle_ingest()

# Query route
@app.route('/query', methods=['POST'])
def query():
    return handle_query()

# Delete document route
@app.route('/documents/<int:doc_id>', methods=['DELETE'])
def delete_document(doc_id):
    from services.vector_store import get_vector_store
    data = request.json
    user_id = data.get('userId')
    vector_provider = data.get('vectorProvider')
    if not user_id:
        return jsonify({"error": "userId required"}), 400
    vs = get_vector_store(user_id, provider=vector_provider)
    vs.delete_document(doc_id)
    return jsonify({"status": "success", "message": f"Document {doc_id} deleted from vector store"})


@app.route('/extract-actions', methods=['POST'])
def extract_actions():
    data = request.json or {}
    text = data.get('text')
    file_path = data.get('filePath')
    file_type = data.get('fileType')

    if not text and not (file_path and file_type):
        return jsonify({"error": "text or filePath/fileType is required"}), 400

    if not text:
        text = get_document_text(file_path, file_type)

    return jsonify(extract_action_candidates(text))

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=config.PORT, debug=True)
