from flask import jsonify, request
from services.parser import get_document_text
from services.chunker import chunk_text
from services.embeddings import embedding_service
from services.vector_store import get_vector_store
from services.action_extractor import extract_action_candidates

def handle_ingest():
    data = request.json
    user_id = data.get('userId')
    file_path = data.get('filePath')
    doc_id = data.get('docId')
    file_type = data.get('fileType')
    chunk_size = data.get('chunkSize')
    chunk_overlap = data.get('chunkOverlap')
    embedding_provider = data.get('embeddingProvider')
    vector_provider = data.get('vectorProvider')
    metadata = {
        'source_type': data.get('sourceType', 'local'),
        'source_name': data.get('sourceName', ''),
        'external_url': data.get('externalUrl', ''),
        'mime_type': data.get('mimeType', ''),
    }
    
    if not all([user_id, file_path, doc_id, file_type]):
        return jsonify({"error": "Missing required parameters"}), 400
        
    try:
        # 1. Parse
        print(f"Parsing document: {file_path} ({file_type})")
        text = get_document_text(file_path, file_type)
        if not text:
            print(f"Parsing failed or returned empty text for {file_path}")
            return jsonify({"status": "error", "message": "Failed to parse document or document is empty"}), 400
            
        # 2. Chunk
        print(f"Chunking document, length: {len(text)}, size: {chunk_size}, overlap: {chunk_overlap}")
        chunks = chunk_text(text, chunk_size=chunk_size, chunk_overlap=chunk_overlap)
        if not chunks:
            print(f"Chunking failed for {file_path}")
            return jsonify({"status": "error", "message": "Failed to chunk document"}), 400
            
        # 3. Embed
        print(f"Embedding {len(chunks)} chunks")
        embeddings = embedding_service.embed_text(chunks, provider=embedding_provider)
        
        # 4. Store in Vector Store
        print(f"Storing in FAISS index for user {user_id}")
        vs = get_vector_store(user_id, provider=vector_provider)
        count = vs.add_chunks(doc_id, chunks, embeddings, metadata=metadata)
        action_candidates = extract_action_candidates(text)
        print(f"Ingest successful: {count} chunks added")
        
        return jsonify({
            "status": "success",
            "chunkCount": count,
            "actionCandidates": action_candidates,
        })
    except Exception as e:
        print(f"Ingest error: {e}")
        return jsonify({"status": "error", "message": str(e)}), 500
