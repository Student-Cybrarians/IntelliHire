"""NVIDIA Models & Skills Integration Package for IntelliHire.

Provides production clients, enterprise safety guardrails, model registries,
and module adapters for M01-M05.
"""

from .client import NvidiaClient
from .guardrail import NemotronSafetyGuard
from .registry import NVIDIA_MODEL_CATALOG, NvidiaModelSpec, get_model_spec, list_models_by_module

__all__ = [
    "NvidiaClient",
    "NemotronSafetyGuard",
    "NVIDIA_MODEL_CATALOG",
    "NvidiaModelSpec",
    "get_model_spec",
    "list_models_by_module",
]
