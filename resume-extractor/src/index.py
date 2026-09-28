from js import Response, URL
import json
import zipfile
import xml.etree.ElementTree as ET
import io

MAX_TEXT_SIZE = 2 * 1024 * 1024  # 2MB
MAX_DOCX_XML_SIZE = 10 * 1024 * 1024  # 10MB
MAX_DOCX_ENTRIES = 500

async def on_fetch(request, env):
    if request.method != "POST":
        return Response.new("Method not allowed", status=405)

    url = URL.new(request.url)
    format_param = url.searchParams.get("format")
    
    if not format_param:
        return Response.new(json.dumps({"error": "Missing format parameter"}), status=400)

    try:
        text = ""
        metadata = {}
        status = "SUCCESS"

        if format_param in ["tex", "txt"]:
            raw_text = await request.text()
            text = raw_text[:MAX_TEXT_SIZE]
            metadata["page_count"] = 1
            status = "TEXT_DECODING_ONLY"
            
        elif format_param == "pdf":
            import pypdf
            from js import Uint8Array
            array_buffer = await request.arrayBuffer()
            js_bytes = Uint8Array.new(array_buffer)
            body_bytes = js_bytes.to_py()
            
            pdf_file = io.BytesIO(body_bytes)
            reader = pypdf.PdfReader(pdf_file)
            metadata["page_count"] = len(reader.pages)
            extracted_pages = []
            
            total_extracted_length = 0
            for page in reader.pages:
                page_text = page.extract_text() or ""
                if total_extracted_length + len(page_text) > MAX_TEXT_SIZE:
                    extracted_pages.append(page_text[:(MAX_TEXT_SIZE - total_extracted_length)])
                    break
                extracted_pages.append(page_text)
                total_extracted_length += len(page_text)
                
            text = "\n".join(extracted_pages).strip()
            if not text:
                status = "NO_OCR"
            
        elif format_param == "docx":
            from js import Uint8Array
            array_buffer = await request.arrayBuffer()
            js_bytes = Uint8Array.new(array_buffer)
            body_bytes = js_bytes.to_py()

            docx_file = io.BytesIO(body_bytes)
            try:
                with zipfile.ZipFile(docx_file) as zf:
                    # Enforce limits against archive bombs
                    infolist = zf.infolist()
                    if len(infolist) > MAX_DOCX_ENTRIES:
                        return Response.new(json.dumps({"error": "Archive bomb detected: Too many entries"}), status=400)
                    
                    cumulative_uncompressed_size = 0
                    for info in infolist:
                        # Path traversal protection
                        if ".." in info.filename or info.filename.startswith("/"):
                             return Response.new(json.dumps({"error": "Malicious archive path detected"}), status=400)
                        
                        cumulative_uncompressed_size += info.file_size
                        if cumulative_uncompressed_size > MAX_DOCX_XML_SIZE * 2: # e.g. 20MB total uncompressed limit
                            return Response.new(json.dumps({"error": "Archive bomb detected: Cumulative size too large"}), status=400)
                            
                        # Also check individual entry sizes
                        if info.file_size > MAX_DOCX_XML_SIZE:
                            return Response.new(json.dumps({"error": "Archive bomb detected: Oversized entry"}), status=400)
                    
                    xml_info = zf.getinfo("word/document.xml")
                    xml_content = zf.read("word/document.xml")
                    tree = ET.fromstring(xml_content)
                    namespaces = {'w': 'http://schemas.openxmlformats.org/wordprocessingml/2006/main'}
                    paragraphs = []
                    total_len = 0
                    
                    for paragraph in tree.findall('.//w:p', namespaces):
                        texts = [node.text for node in paragraph.findall('.//w:t', namespaces) if node.text]
                        if texts:
                            joined = ''.join(texts)
                            if total_len + len(joined) > MAX_TEXT_SIZE:
                                paragraphs.append(joined[:(MAX_TEXT_SIZE - total_len)])
                                break
                            paragraphs.append(joined)
                            total_len += len(joined)
                    text = '\n'.join(paragraphs).strip()
                metadata["page_count"] = 1
            except zipfile.BadZipFile:
                return Response.new(json.dumps({"error": "Malformed DOCX/ZIP file"}), status=400)
        else:
            return Response.new(json.dumps({"error": "Unsupported format"}), status=400)

        result = {
            "text": text,
            "metadata": metadata,
            "status": status
        }
        
        from js import Headers
        headers = Headers.new({"Content-Type": "application/json"}.items())
        return Response.new(json.dumps(result), headers=headers)
        
    except Exception as e:
        # Generic error handler to prevent internal secrets leak
        return Response.new(json.dumps({"error": "Extraction failure", "details": str(e)[:100]}), status=500)
