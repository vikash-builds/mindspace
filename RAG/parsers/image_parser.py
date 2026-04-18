import pytesseract
from PIL import Image
import os
import base64

import requests

import config

# Ensure tesseract is found on Apple Silicon Homebrew paths
if os.path.exists('/opt/homebrew/bin/tesseract'):
    pytesseract.pytesseract.tesseract_cmd = '/opt/homebrew/bin/tesseract'

def _gemini_vision_parse(file_path):
    if not config.GEMINI_API_KEY:
        return ''

    mime_type = 'image/png'
    if file_path.lower().endswith(('.jpg', '.jpeg')):
        mime_type = 'image/jpeg'
    elif file_path.lower().endswith('.webp'):
        mime_type = 'image/webp'

    with open(file_path, 'rb') as handle:
      encoded = base64.b64encode(handle.read()).decode('utf-8')

    response = requests.post(
        f"{config.GEMINI_BASE_URL.rstrip('/')}/models/{config.GEMINI_CHAT_MODEL}:generateContent",
        headers={
            'x-goog-api-key': config.GEMINI_API_KEY,
            'Content-Type': 'application/json',
        },
        json={
            'contents': [{
                'role': 'user',
                'parts': [
                    {'text': 'Extract all useful text from this image and briefly describe any important visual context that affects meaning. Return concise plain text only.'},
                    {'inlineData': {'mimeType': mime_type, 'data': encoded}},
                ],
            }],
            'generationConfig': {
                'temperature': 0.1,
                'responseMimeType': 'text/plain',
            },
        },
        timeout=180,
    )
    response.raise_for_status()
    candidates = response.json().get('candidates', [])
    if not candidates:
        return ''
    parts = (candidates[0].get('content') or {}).get('parts', [])
    return '\n'.join(part.get('text', '') for part in parts if part.get('text')).strip()

def parse_image(file_path):
    try:
        image = Image.open(file_path)
        vision_text = ''
        if config.LLM_PROVIDER == 'gemini' or config.EMBEDDING_PROVIDER == 'gemini':
            try:
                vision_text = _gemini_vision_parse(file_path)
            except Exception as vision_error:
                print(f"Gemini vision parse failed, falling back to OCR: {vision_error}")

        ocr_text = pytesseract.image_to_string(image).strip()
        combined = '\n\n'.join(part for part in [vision_text, ocr_text] if part)
        return combined.strip()
    except Exception as e:
        print(f"Error parsing image {file_path}: {e}")
        raise Exception(f"Image OCR failed: {str(e)}")
