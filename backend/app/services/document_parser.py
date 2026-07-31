import io
from typing import Tuple

def extract_text_from_bytes(content: bytes, filename: str) -> Tuple[str, int]:
    """
    Extract text and page count from raw file bytes (PDF, DOCX, TXT, EML).
    """
    ext = filename.split(".")[-1].lower() if "." in filename else "txt"

    if ext == "pdf":
        try:
            import pypdf
            reader = pypdf.PdfReader(io.BytesIO(content))
            pages = len(reader.pages)
            text_parts = [page.extract_text() or "" for page in reader.pages]
            full_text = "\n".join(text_parts).strip()
            if full_text:
                return full_text, max(1, pages)
        except Exception as e:
            print(f"pypdf extraction error: {e}")

    elif ext in ["eml", "msg"]:
        try:
            text = content.decode("utf-8", errors="ignore")
            return text, 1
        except Exception:
            pass

    # Fallback to UTF-8 text parsing
    try:
        text = content.decode("utf-8", errors="ignore").strip()
        return text, 1
    except Exception:
        return "", 1
