import os
import tempfile

import requests

from parsers.pdf_parser import parse_pdf
from parsers.docx_parser import parse_docx
from parsers.xlsx_parser import parse_xlsx
from parsers.pptx_parser import parse_pptx
from parsers.txt_parser import parse_txt
from parsers.image_parser import parse_image

def _resolve_local_path(file_path, file_type):
    if not file_path.startswith('http://') and not file_path.startswith('https://'):
        return file_path, False

    suffix = f'.{file_type.lower()}'
    with requests.get(file_path, stream=True, timeout=120) as response:
        response.raise_for_status()
        temp_file = tempfile.NamedTemporaryFile(delete=False, suffix=suffix)
        try:
            for chunk in response.iter_content(chunk_size=1024 * 64):
                if chunk:
                    temp_file.write(chunk)
        finally:
            temp_file.close()
    return temp_file.name, True

def get_document_text(file_path, file_type):
    file_type = file_type.lower()
    local_path, is_temp = _resolve_local_path(file_path, file_type)
    
    try:
        if file_type == 'pdf':
            return parse_pdf(local_path)
        elif file_type == 'docx':
            return parse_docx(local_path)
        elif file_type in ['xlsx', 'xls']:
            return parse_xlsx(local_path)
        elif file_type in ['pptx', 'ppt']:
            return parse_pptx(local_path)
        elif file_type == 'txt':
            return parse_txt(local_path)
        elif file_type in ['jpg', 'jpeg', 'png', 'webp']:
            return parse_image(local_path)
        else:
            return ""
    finally:
        if is_temp and os.path.exists(local_path):
            os.remove(local_path)
