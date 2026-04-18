from flask import jsonify, request
from services.rag_engine import rag_query

def handle_query():
    data = request.json
    user_id = data.get('userId')
    question = data.get('question')
    chat_history = data.get('chatHistory', [])
    top_k = data.get('topK')
    temperature = data.get('temperature')
    similarity_threshold = data.get('similarityThreshold')
    embedding_provider = data.get('embeddingProvider')
    llm_provider = data.get('llmProvider')
    vector_provider = data.get('vectorProvider')
    
    if not user_id or not question:
        return jsonify({"error": "userId and question are required"}), 400
        
    try:
        result = rag_query(
            user_id,
            question,
            chat_history,
            top_k,
            temperature,
            similarity_threshold,
            embedding_provider=embedding_provider,
            llm_provider=llm_provider,
            vector_provider=vector_provider,
        )
        return jsonify(result)
    except Exception as e:
        print(f"Query error: {e}")
        return jsonify({"error": str(e)}), 500
