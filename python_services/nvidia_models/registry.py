"""NVIDIA Model Registry for Python Services in IntelliHire.

Provides structured metadata, endpoint mapping, default parameters,
and module associations across the 17 imported NVIDIA models.
"""

from dataclasses import dataclass
from typing import Dict, List, Optional


@dataclass
class NvidiaModelSpec:
    model_id: str
    name: str
    category: str
    default_endpoint: str
    max_tokens: int
    recommended_temperature: float
    supports_streaming: bool
    intellihire_module: str
    description: str


NVIDIA_MODEL_CATALOG: Dict[str, NvidiaModelSpec] = {
    "google/paligemma": NvidiaModelSpec(
        model_id="google/paligemma",
        name="PaliGemma Vision-Language",
        category="vlm",
        default_endpoint="https://ai.api.nvidia.com/v1/vlm/google/paligemma",
        max_tokens=512,
        recommended_temperature=1.0,
        supports_streaming=True,
        intellihire_module="M01",
        description="Vision-Language model for document layout understanding and visual portfolio inspection.",
    ),
    "nvidia/chatterbox-multilingual-tts": NvidiaModelSpec(
        model_id="nvidia/chatterbox-multilingual-tts",
        name="Chatterbox Multilingual TTS",
        category="tts",
        default_endpoint="https://integrate.api.nvidia.com/v1/audio/speech",
        max_tokens=1000,
        recommended_temperature=1.0,
        supports_streaming=False,
        intellihire_module="M04",
        description="Neural text-to-speech for conversational interview question voicing.",
    ),
    "deepseek-ai/deepseek-v4.1-flash": NvidiaModelSpec(
        model_id="deepseek-ai/deepseek-v4.1-flash",
        name="DeepSeek v4.1 Flash",
        category="llm",
        default_endpoint="https://integrate.api.nvidia.com/v1/chat/completions",
        max_tokens=16384,
        recommended_temperature=1.0,
        supports_streaming=True,
        intellihire_module="M03",
        description="High-speed multimodal code evaluation and work-round execution verification.",
    ),
    "google/diffusiongemma-26b-a4b-it": NvidiaModelSpec(
        model_id="google/diffusiongemma-26b-a4b-it",
        name="DiffusionGemma 26B A4B IT",
        category="reasoning",
        default_endpoint="https://integrate.api.nvidia.com/v1/chat/completions",
        max_tokens=4096,
        recommended_temperature=1.0,
        supports_streaming=True,
        intellihire_module="M03",
        description="Multimodal instruction model with thinking trace for architecture diagram reviews.",
    ),
    "google/gemma-4-31b-it": NvidiaModelSpec(
        model_id="google/gemma-4-31b-it",
        name="Gemma 4 31B IT",
        category="llm",
        default_endpoint="https://integrate.api.nvidia.com/v1/chat/completions",
        max_tokens=1024,
        recommended_temperature=0.5,
        supports_streaming=True,
        intellihire_module="M02",
        description="Instruction-following LLM for deterministic rubric scoring and assessment items.",
    ),
    "moonshotai/kimi-k3": NvidiaModelSpec(
        model_id="moonshotai/kimi-k3",
        name="Kimi K3 Reasoning",
        category="reasoning",
        default_endpoint="https://integrate.api.nvidia.com/v1/chat/completions",
        max_tokens=16384,
        recommended_temperature=1.0,
        supports_streaming=True,
        intellihire_module="M03",
        description="Deep cognitive reasoning model with max reasoning effort for complex algorithmic proofs.",
    ),
    "meta/llama-3.1-8b-instruct": NvidiaModelSpec(
        model_id="meta/llama-3.1-8b-instruct",
        name="Llama 3.1 8B Instruct (Tabular)",
        category="llm",
        default_endpoint="https://integrate.api.nvidia.com/v1/chat/completions",
        max_tokens=2048,
        recommended_temperature=0.2,
        supports_streaming=False,
        intellihire_module="M01",
        description="Fast instruction model for tabular scorecard aggregation and ATS dimension weighting.",
    ),
    "nvidia/llama-3.1-nemotron-safety-guard-8b-v3": NvidiaModelSpec(
        model_id="nvidia/llama-3.1-nemotron-safety-guard-8b-v3",
        name="Nemotron Safety Guard 8B v3",
        category="guardrail",
        default_endpoint="https://integrate.api.nvidia.com/v1/chat/completions",
        max_tokens=1024,
        recommended_temperature=0.0,
        supports_streaming=False,
        intellihire_module="CROSS_CUTTING",
        description="Enterprise AI safety guardrail for prompt injection and content policy moderation.",
    ),
    "meta/muse-glimmer-30b": NvidiaModelSpec(
        model_id="meta/muse-glimmer-30b",
        name="Muse Glimmer 30B",
        category="llm",
        default_endpoint="https://integrate.api.nvidia.com/v1/chat/completions",
        max_tokens=2048,
        recommended_temperature=0.0,
        supports_streaming=False,
        intellihire_module="M01",
        description="Primary structured JSON extraction engine for resume parsing and rubric evaluation.",
    ),
    "nvidia/nemotron-3-embed-1b": NvidiaModelSpec(
        model_id="nvidia/nemotron-3-embed-1b",
        name="Nemotron 3 Embed 1B",
        category="embeddings",
        default_endpoint="https://integrate.api.nvidia.com/v1/embeddings",
        max_tokens=8192,
        recommended_temperature=0.0,
        supports_streaming=False,
        intellihire_module="M01",
        description="Dense vector embedding model for semantic skills matching against job taxonomies.",
    ),
    "nvidia/nemotron-3-nano-omni-30b-a3b-reasoning": NvidiaModelSpec(
        model_id="nvidia/nemotron-3-nano-omni-30b-a3b-reasoning",
        name="Nemotron 3 Nano Omni 30B Reasoning",
        category="reasoning",
        default_endpoint="https://integrate.api.nvidia.com/v1/chat/completions",
        max_tokens=65536,
        recommended_temperature=0.6,
        supports_streaming=True,
        intellihire_module="M03",
        description="Core engine for adaptive work-round debriefs, misconception explanation, and logic gaps.",
    ),
    "nvidia/nemotron-3-ultra-550b-a55b": NvidiaModelSpec(
        model_id="nvidia/nemotron-3-ultra-550b-a55b",
        name="Nemotron 3 Ultra 550B MoE",
        category="reasoning",
        default_endpoint="https://integrate.api.nvidia.com/v1/chat/completions",
        max_tokens=16384,
        recommended_temperature=1.0,
        supports_streaming=True,
        intellihire_module="M05",
        description="Frontier 550B MoE model with reasoning delta streaming for complex architectural evaluation.",
    ),
    "nvidia/nemotron-3.5-lightning-30b-a3b": NvidiaModelSpec(
        model_id="nvidia/nemotron-3.5-lightning-30b-a3b",
        name="Nemotron 3.5 Lightning 30B MoE",
        category="reasoning",
        default_endpoint="https://integrate.api.nvidia.com/v1/chat/completions",
        max_tokens=16384,
        recommended_temperature=1.0,
        supports_streaming=True,
        intellihire_module="M03",
        description="Low-latency interactive MoE model for real-time candidate tutoring and syntax debriefs.",
    ),
    "nvidia/nemotron-ocr-v2": NvidiaModelSpec(
        model_id="nvidia/nemotron-ocr-v2",
        name="Nemotron OCR v2",
        category="ocr",
        default_endpoint="https://ai.api.nvidia.com/v1/cv/nvidia/nemotron-ocr-v2",
        max_tokens=2048,
        recommended_temperature=0.0,
        supports_streaming=False,
        intellihire_module="M01",
        description="Optical character recognition for scanned document attachments and credential certificates.",
    ),
    "nvidia/nemotron-parse-2.0": NvidiaModelSpec(
        model_id="nvidia/nemotron-parse-2.0",
        name="Nemotron Parse 2.0",
        category="vlm",
        default_endpoint="https://integrate.api.nvidia.com/v1/chat/completions",
        max_tokens=1024,
        recommended_temperature=0.0,
        supports_streaming=False,
        intellihire_module="M01",
        description="Specialized document parser producing Markdown with bounding box classes for complex resumes.",
    ),
    "nvidia/parakeet-tdt-0.6b": NvidiaModelSpec(
        model_id="nvidia/parakeet-tdt-0.6b",
        name="Parakeet TDT 0.6B ASR",
        category="asr",
        default_endpoint="https://integrate.api.nvidia.com/v1/audio/transcriptions",
        max_tokens=4096,
        recommended_temperature=0.0,
        supports_streaming=False,
        intellihire_module="M04",
        description="High-accuracy verbatim speech recognition for candidate interviews (NO affect/emotion scoring).",
    ),
    "riva-translate-4b-instruct-v2": NvidiaModelSpec(
        model_id="riva-translate-4b-instruct-v2",
        name="Riva Translate 4B Instruct v2",
        category="translation",
        default_endpoint="https://integrate.api.nvidia.com/v1/chat/completions",
        max_tokens=1024,
        recommended_temperature=0.2,
        supports_streaming=False,
        intellihire_module="CROSS_CUTTING",
        description="Technical and domain-preserving multilingual translation across 50+ international languages.",
    ),
}


def get_model_spec(model_id: str) -> Optional[NvidiaModelSpec]:
    """Retrieve model specification by ID."""
    return NVIDIA_MODEL_CATALOG.get(model_id)


def list_models_by_module(module_code: str) -> List[NvidiaModelSpec]:
    """Filter models assigned to a specific IntelliHire module (M01-M05)."""
    return [
        m for m in NVIDIA_MODEL_CATALOG.values()
        if m.intellihire_module == module_code or m.intellihire_module == "CROSS_CUTTING"
    ]
