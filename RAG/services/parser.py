from parsers.pdf_parser import parse_pdf
from parsers.docx_parser import parse_docx
from parsers.xlsx_parser import parse_xlsx
from parsers.pptx_parser import parse_pptx
from parsers.txt_parser import parse_txt

def get_document_text(file_path, file_type):
    file_type = file_type.lower()
    
    if file_type == 'pdf':
        return parse_pdf(file_path)
    elif file_type == 'docx':
        return parse_docx(file_path)
    elif file_type in ['xlsx', 'xls']:
        return parse_xlsx(file_path)
    elif file_type in ['pptx', 'ppt']:
        return parse_pptx(file_path)
    elif file_type == 'txt':
        return parse_txt(file_path)
    else:
        return ""
