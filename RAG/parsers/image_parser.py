import pytesseract
from PIL import Image
import os

# Ensure tesseract is found on Apple Silicon Homebrew paths
if os.path.exists('/opt/homebrew/bin/tesseract'):
    pytesseract.pytesseract.tesseract_cmd = '/opt/homebrew/bin/tesseract'

def parse_image(file_path):
    try:
        image = Image.open(file_path)
        # Perform OCR
        text = pytesseract.image_to_string(image)
        return text.strip()
    except Exception as e:
        print(f"Error parsing image {file_path}: {e}")
        raise Exception(f"Image OCR failed: {str(e)}")
