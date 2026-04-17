import openpyxl

def parse_xlsx(file_path):
    text = ""
    try:
        wb = openpyxl.load_workbook(file_path, data_only=True)
        for sheet_name in wb.sheetnames:
            sheet = wb[sheet_name]
            text += f"--- Sheet: {sheet_name} ---\n"
            rows = list(sheet.rows)
            if not rows:
                continue
            
            headers = [str(cell.value) if cell.value else "" for cell in rows[0]]
            
            for row in rows[1:]:
                row_text = []
                for i, cell in enumerate(row):
                    header = headers[i] if i < len(headers) else f"Col_{i}"
                    val = str(cell.value) if cell.value is not None else ""
                    if val:
                        row_text.append(f"{header}: {val}")
                if row_text:
                    text += " | ".join(row_text) + "\n"
            text += "\n"
    except Exception as e:
        print(f"Error parsing XLSX: {e}")
    return text
