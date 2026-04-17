from services.embeddings import embedding_service
from services.vector_store import get_vector_store
from services.llm import llm_service

def rag_query(user_id, question, chat_history=None, top_k=5, temperature=0.7, similarity_threshold=0.5):
    if chat_history is None:
        chat_history = []
        
    # 1. Embed question
    query_embedding = embedding_service.embed_text(question)
    
    # 2. Search FAISS
    vs = get_vector_store(user_id)
    search_results = vs.search(query_embedding, k=top_k or 5)
    
    # 3. Filter by similarity threshold (optional, for simple L2 index, distance is closer to 0 for better match)
    # FAISS IndexFlatL2 returns squared L2 distance. Smaller is better.
    # threshold = similarity_threshold or 0.5
    
    # 4. Build Prompt
    context = "\n\n".join([f"--- Source {i+1} ---\n{res['text']}" for i, res in enumerate(search_results)])
    
    # Format chat history
    history_str = ""
    for msg in chat_history[-6:]: # Last 3 turns
        role = "User" if msg['role'] == 'user' else "Assistant"
        history_str += f"{role}: {msg['content']}\n"
        
    system_prompt = (
        "You are MindSpace, a personal AI assistant. Use the provided context to answer the user's question accurately. "
        "If the answer isn't in the context, tell the user you don't have that information. "
        "Be concise and professional. Use formatting (bullet points, bold text) where appropriate."
    )
    
    prompt = f"Context:\n{context}\n\nRecent History:\n{history_str}\n\nUser Question: {question}\n\nAnswer:"
    
    # 5. Generate Response
    answer = llm_service.generate_response(prompt, system_prompt, temperature=temperature)
    
    return {
        "answer": answer,
        "sourceChunks": search_results
    }
