"""Enterprise AI Safety Guardrail for IntelliHire.

Provides deterministic prompt injection defense, PII scanning,
and integration with nvidia/llama-3.1-nemotron-safety-guard-8b-v3.
"""

import os
import re
from typing import Dict, List, Optional, Tuple


class NemotronSafetyGuard:
    """Enterprise safety evaluator ensuring candidate submissions, prompts,
    and evaluator outputs comply with HR safety and AI governance invariants.
    """

    INJECTION_PATTERNS = [
        re.compile(r"ignore\s+(all\s+)?previous\s+instructions", re.IGNORECASE),
        re.compile(r"system\s+override", re.IGNORECASE),
        re.compile(r"you\s+are\s+now\s+in\s+developer\s+mode", re.IGNORECASE),
        re.compile(r"reveal\s+system\s+prompt", re.IGNORECASE),
        re.compile(r"bypass\s+safety", re.IGNORECASE),
        re.compile(r"jailbreak", re.IGNORECASE),
        re.compile(r"as\s+an\s+unfiltered\s+ai", re.IGNORECASE),
    ]

    PII_EMAIL = re.compile(r"[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}")
    PII_PHONE = re.compile(r"(\+?\d{1,3}[\s\-]?)?(\(?\d{3}\)?[\s\-]?\d{3}[\s\-]?\d{4})")
    PII_SSN = re.compile(r"\b\d{3}[\-\s]?\d{2}[\-\s]?\d{4}\b")

    def __init__(self, api_key: Optional[str] = None):
        self.api_key = api_key or os.getenv("NVIDIA_API_KEY", "")

    def inspect_prompt(self, text: str) -> Dict[str, object]:
        """Inspect a prompt or candidate input against deterministic safety rules."""
        if not text:
            return {"safe": True, "violations": []}

        violations = []
        for pat in self.INJECTION_PATTERNS:
            if pat.search(text):
                violations.append("PROMPT_INJECTION")
                break

        return {
            "safe": len(violations) == 0,
            "violations": violations,
            "reason": "Deterministic guardrail detected disallowed instruction override." if violations else None,
        }

    def redact_pii(self, text: str) -> Tuple[str, List[str]]:
        """Identify and redact common PII categories from raw text."""
        pii_found = []
        redacted = text

        if self.PII_EMAIL.search(redacted):
            pii_found.append("email")
            redacted = self.PII_EMAIL.sub("[EMAIL_REDACTED]", redacted)

        if self.PII_PHONE.search(redacted):
            pii_found.append("phone")
            redacted = self.PII_PHONE.sub("[PHONE_REDACTED]", redacted)

        if self.PII_SSN.search(redacted):
            pii_found.append("ssn")
            redacted = self.PII_SSN.sub("[SSN_REDACTED]", redacted)

        return redacted, pii_found
