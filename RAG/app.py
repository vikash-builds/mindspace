from flask import Flask, jsonify, request
from flask_cors import CORS
import config
import os

app = Flask(__name__)
CORS(app)

from routes.ingest import handle_ingest
from routes.query import handle_query

# Health check
@app.route('/health', methods=['GET'])
def health():
    return jsonify({
        "status": "online",
        "embedding_model": config.EMBEDDING_MODEL,
        "llm_model": config.OLLAMA_MODEL
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
    if not user_id:
        return jsonify({"error": "userId required"}), 400
    vs = get_vector_store(user_id)
    vs.delete_document(doc_id)
    return jsonify({"status": "success", "message": f"Document {doc_id} deleted from vector store"})

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=config.PORT, debug=True)
