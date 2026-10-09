"""Module M01 Adapter: Resume & Document Parsing with NVIDIA Models.

Leverages nvidia/nemotron-parse-2.0 and nvidia/nemotron-ocr-v2
for structured document markdown extraction and OCR ingestion.
"""

from typing import Any, Dict, Optional
from ..client import NvidiaClient


class M01DocumentParserAdapter:
    """Adapter for parsing complex resumes, tables, and scanned documents."""

    def __init__(self, client: Optional[NvidiaClient] = None):
        self.client = client or NvidiaClient()

    def parse_resume_structure(self, raw_text_or_markdown: str) -> Dict[str, Any]:
        """Convert unstructured or OCR text into structured sections using Nemotron Parse / Muse."""
        system_prompt = (
            "You are an ATS resume structure parser. Segment the input into standard sections:\n"
            "Summary, Experience, Education, Skills, Certifications, Projects.\n"
            "Return valid JSON with key 'sections': [{'name': str, 'content': str}]."
        )
        messages = [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": raw_text_or_markdown[:16000]},
        ]
        res = self.client.chat_completion(
            messages=messages,
            model="nvidia/nemotron-parse-2.0" if self.client.is_configured else "meta/muse-glimmer-30b",
            temperature=0.0,
        )
        return {
            "success": res.get("success", False),
            "content": res.get("content"),
            "model_used": res.get("model_used"),
            "fallback_applied": res.get("fallback_applied", False),
        }
