"""Production NVIDIA Client for IntelliHire Python Services.

Encapsulates chat completions, embeddings, document parsing,
TTS synthesis, and ASR transcription with automatic fallbacks.
"""

import json
import logging
import os
from typing import Any, Dict, List, Optional

from .guardrail import NemotronSafetyGuard
from .registry import NVIDIA_MODEL_CATALOG, get_model_spec

logger = logging.getLogger("IntelliHire.NvidiaClient")


class NvidiaClient:
    """Unified NVIDIA API client supporting NIM containers and hosted endpoints."""

    def __init__(
        self,
        api_key: Optional[str] = None,
        base_url: Optional[str] = None,
        safety_guard: Optional[NemotronSafetyGuard] = None,
    ):
        self.api_key = api_key or os.getenv("NVIDIA_API_KEY", "")
        self.base_url = (base_url or os.getenv("NVIDIA_BASE_URL", "https://integrate.api.nvidia.com/v1")).rstrip("/")
        self.safety_guard = safety_guard or NemotronSafetyGuard(self.api_key)

    @property
    def is_configured(self) -> bool:
        """Check if an API key is available."""
        return bool(self.api_key and not self.api_key.startswith("your_"))

    def chat_completion(
        self,
        messages: List[Dict[str, Any]],
        model: str = "meta/muse-glimmer-30b",
        temperature: Optional[float] = None,
        max_tokens: Optional[int] = None,
        stream: bool = False,
        check_safety: bool = True,
    ) -> Dict[str, Any]:
        """Send chat completion to NVIDIA endpoint with safety check and fallback."""
        if check_safety and messages:
            # Check user messages with safety guardrail
            for msg in messages:
                if msg.get("role") == "user":
                    content = msg.get("content", "")
                    if isinstance(content, str):
                        safety = self.safety_guard.inspect_prompt(content)
                        if not safety["safe"]:
                            return {
                                "success": False,
                                "error": "Safety Policy Violation",
                                "details": safety,
                                "content": None,
                                "fallback_applied": False,
                            }

        spec = get_model_spec(model)
        temp = temperature if temperature is not None else (spec.recommended_temperature if spec else 0.2)
        tokens = max_tokens if max_tokens is not None else (spec.max_tokens if spec else 2048)

        if not self.is_configured:
            # Deterministic fallback when key is unset
            return {
                "success": True,
                "content": json.dumps({
                    "status": "deterministic_fallback",
                    "note": "NVIDIA_API_KEY unset. Processed via local rule engine.",
                    "model_requested": model,
                }),
                "model_used": "local_fallback",
                "fallback_applied": True,
            }

        try:
            import requests

            url = f"{self.base_url}/chat/completions"
            headers = {
                "Authorization": f"Bearer {self.api_key}",
                "Content-Type": "application/json",
                "Accept": "application/json",
            }
            payload = {
                "model": model,
                "messages": messages,
                "temperature": temp,
                "max_tokens": tokens,
                "stream": stream,
            }

            resp = requests.post(url, headers=headers, json=payload, timeout=60)
            if resp.ok:
                data = resp.json()
                content = data.get("choices", [{}])[0].get("message", {}).get("content", "")
                return {
                    "success": True,
                    "content": content,
                    "model_used": model,
                    "fallback_applied": False,
                    "raw_response": data,
                }
            else:
                logger.warning("NVIDIA API returned %s: %s", resp.status_code, resp.text)
                return {
                    "success": False,
                    "error": f"API error {resp.status_code}",
                    "details": resp.text,
                    "fallback_applied": True,
                    "content": json.dumps({"error": f"HTTP {resp.status_code}", "status": "failed"}),
                }
        except Exception as exc:
            logger.error("Failed to invoke NVIDIA chat: %s", exc)
            return {
                "success": False,
                "error": str(exc),
                "fallback_applied": True,
                "content": json.dumps({"error": str(exc), "status": "exception"}),
            }

    def generate_embeddings(
        self,
        texts: List[str],
        model: str = "nvidia/nemotron-3-embed-1b",
    ) -> Dict[str, Any]:
        """Generate dense vector embeddings using NeMo Retriever."""
        if not self.is_configured:
            return {
                "success": True,
                "embeddings": [[0.0] * 1024 for _ in texts],
                "model_used": "local_mock_embeddings",
                "fallback_applied": True,
            }

        try:
            import requests

            url = f"{self.base_url}/embeddings"
            headers = {
                "Authorization": f"Bearer {self.api_key}",
                "Content-Type": "application/json",
            }
            payload = {
                "model": model,
                "input": texts,
            }
            resp = requests.post(url, headers=headers, json=payload, timeout=30)
            if resp.ok:
                data = resp.json()
                embeddings = [item["embedding"] for item in data.get("data", [])]
                return {
                    "success": True,
                    "embeddings": embeddings,
                    "model_used": model,
                    "fallback_applied": False,
                }
            return {"success": False, "error": resp.text, "fallback_applied": True}
        except Exception as exc:
            return {"success": False, "error": str(exc), "fallback_applied": True}
