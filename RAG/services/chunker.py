import config

def chunk_text(text, chunk_size=None, chunk_overlap=None):
    if chunk_size is None:
        chunk_size = config.CHUNK_SIZE
    if chunk_overlap is None:
        chunk_overlap = config.CHUNK_OVERLAP

    # Prevent infinite loops if overlap is >= size
    if chunk_overlap >= chunk_size:
        chunk_overlap = int(chunk_size * 0.1)

    if not text:
        return []
        
    chunks = []
    start = 0
    while start < len(text):
        end = start + chunk_size
        chunk = text[start:end]
        chunks.append(chunk)
        if end >= len(text):
            break
        start += (chunk_size - chunk_overlap)
        
    return chunks
