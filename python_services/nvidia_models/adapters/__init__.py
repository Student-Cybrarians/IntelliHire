"""IntelliHire Module Adapters for NVIDIA Models.

Provides domain-specific abstractions connecting NVIDIA models to:
- M01: Document OCR and layout parsing (Resume Studio)
- M02: Assessment item generation and rubric calibration
- M03: Universal Technical & Non-Technical Work Round Intelligence
- M04: Conversational verbal interview speech pipelines (governed)
"""

from .m01_document_parser import M01DocumentParserAdapter
from .m02_assessment_evaluator import M02AssessmentEvaluatorAdapter
from .m03_workround_agent import M03WorkRoundAgentAdapter
from .m04_speech_pipeline import M04SpeechPipelineAdapter

__all__ = [
    "M01DocumentParserAdapter",
    "M02AssessmentEvaluatorAdapter",
    "M03WorkRoundAgentAdapter",
    "M04SpeechPipelineAdapter",
]
