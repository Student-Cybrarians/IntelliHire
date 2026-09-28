from js import Response, URL
import json
import zipfile
import xml.etree.ElementTree as ET
import io

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

        if format_param in ["tex", "txt"]:
            text = await request.text()
            metadata["page_count"] = 1
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
            for page in reader.pages:
                extracted_pages.append(page.extract_text() or "")
            text = "\n".join(extracted_pages)
            
        elif format_param == "docx":
            from js import Uint8Array
            array_buffer = await request.arrayBuffer()
            js_bytes = Uint8Array.new(array_buffer)
            body_bytes = js_bytes.to_py()

            docx_file = io.BytesIO(body_bytes)
            with zipfile.ZipFile(docx_file) as zf:
                xml_content = zf.read("word/document.xml")
                tree = ET.fromstring(xml_content)
                namespaces = {'w': 'http://schemas.openxmlformats.org/wordprocessingml/2006/main'}
                paragraphs = []
                for paragraph in tree.findall('.//w:p', namespaces):
                    texts = [node.text for node in paragraph.findall('.//w:t', namespaces) if node.text]
                    if texts:
                        paragraphs.append(''.join(texts))
                text = '\n'.join(paragraphs)
            metadata["page_count"] = 1
            
        else:
            return Response.new(json.dumps({"error": "Unsupported format"}), status=400)

        result = {
            "text": text,
            "metadata": metadata
        }
        
        from js import Headers
        headers = Headers.new({"Content-Type": "application/json"}.items())
        return Response.new(json.dumps(result), headers=headers)
        
    except Exception as e:
        return Response.new(json.dumps({"error": str(e)}), status=500)
