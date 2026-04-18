from services.embeddings import embedding_service
from services.vector_store import get_vector_store
from services.llm import llm_service


def _normalize_score(raw_score):
    if raw_score is None:
        return 0.0
    if raw_score > 1:
        return round(1 / (1 + raw_score), 4)
    return round(float(raw_score), 4)


def _prepare_search_results(search_results, similarity_threshold):
    threshold = float(similarity_threshold or 0)
    filtered = []
    seen = set()

    for result in search_results:
        normalized_score = _normalize_score(result.get('score'))
        if threshold and normalized_score < threshold:
            continue

        key = (result.get('doc_id'), result.get('chunk_index'))
        if key in seen:
            continue
        seen.add(key)

        filtered.append({
            **result,
            'score': normalized_score,
        })

    return filtered


def rag_query(
    user_id,
    question,
    chat_history=None,
    top_k=5,
    temperature=0.7,
    similarity_threshold=0.5,
    embedding_provider=None,
    llm_provider=None,
    vector_provider=None,
):
    if chat_history is None:
        chat_history = []

    query_embedding = embedding_service.embed_text(question, provider=embedding_provider)
    vector_store = get_vector_store(user_id, provider=vector_provider)
    raw_results = vector_store.search(query_embedding, k=top_k or 5)
    search_results = _prepare_search_results(raw_results, similarity_threshold)

    if not search_results:
        return {
            'answer': "I couldn't find enough grounded information in your library to answer that confidently.",
            'sourceChunks': [],
            'providers': {
                'embedding': embedding_provider,
                'llm': llm_provider,
                'vector': vector_provider,
            },
        }

    context = "\n\n".join([
        (
            f"--- Source {index + 1} ---\n"
            f"Document: {result.get('source_name') or 'Unknown source'}\n"
            f"Chunk: {result.get('chunk_index', index)}\n"
            f"Confidence: {result.get('score', 0):.2f}\n"
            f"Content: {result['text']}"
        )
        for index, result in enumerate(search_results)
    ])

    history_str = ""
    for message in chat_history[-6:]:
        role = "User" if message['role'] == 'user' else "Assistant"
        history_str += f"{role}: {message['content']}\n"

    system_prompt = (
        "You are MindSpace, a personal AI assistant. Use the provided context to answer the user's question accurately. "
        "If the answer isn't in the context, tell the user you don't have that information. "
        "Be concise and professional. Use formatting when it improves clarity. "
        "When you rely on sources, cite them inline using [1], [2], etc. matching the provided source order. "
        "Do not invent citations or facts that are not present in the context."
    )

    prompt = f"Context:\n{context}\n\nRecent History:\n{history_str}\n\nUser Question: {question}\n\nAnswer:"
    answer = llm_service.generate_response(
        prompt,
        system_prompt,
        temperature=temperature,
        provider=llm_provider,
    )

    return {
        'answer': answer,
        'sourceChunks': search_results,
        'providers': {
            'embedding': embedding_provider,
            'llm': llm_provider,
            'vector': vector_provider,
        },
    }
