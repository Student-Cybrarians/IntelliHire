"""Minimal NVIDIA API client for the Riva Translate model."""

import os

import requests


NVIDIA_API_KEY = os.getenv("NVIDIA_API_KEY", "")
NVIDIA_API_URL = os.getenv(
    "NVIDIA_API_URL",
    "https://integrate.api.nvidia.com/v1/chat/completions",
)
MODEL = "riva-translate-4b-instruct-v2"


def translate(text: str, source_language: str, target_language: str) -> str:
    """Translate text through NVIDIA's hosted API."""
    if not NVIDIA_API_KEY:
        raise RuntimeError("Set the NVIDIA_API_KEY environment variable.")

    response = requests.post(
        NVIDIA_API_URL,
        headers={
            "Authorization": f"Bearer {NVIDIA_API_KEY}",
            "Content-Type": "application/json",
            "Accept": "application/json",
        },
        json={
            "model": MODEL,
            "messages": [
                {
                    "role": "user",
                    "content": (
                        f"Translate from {source_language} to {target_language}. "
                        f"Return only the translation:\n{text}"
                    ),
                }
            ],
            "temperature": 0.2,
            "max_tokens": 1024,
        },
        timeout=60,
    )
    response.raise_for_status()
    return response.json()["choices"][0]["message"]["content"]