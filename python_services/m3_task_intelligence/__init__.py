"""
IntelliHire M03 Universal Task Intelligence Package
Extensible technical & non-technical task taxonomy, seniority scaling,
repetition detection, diversity scoring, and task synthesis.
"""

from .taxonomy import TaskTaxonomy, TaskForm, CognitiveDimension, TaskFamily
from .seniority_scaler import SeniorityScaler
from .repetition_detector import RepetitionDetector
from .diversity_scorer import DiversityScorer
from .quality_evaluator import QualityEvaluator
from .task_synthesizer import TaskSynthesizer
from .engine import TaskIntelligenceEngine

__all__ = [
    'TaskTaxonomy',
    'TaskForm',
    'CognitiveDimension',
    'TaskFamily',
    'SeniorityScaler',
    'RepetitionDetector',
    'DiversityScorer',
    'QualityEvaluator',
    'TaskSynthesizer',
    'TaskIntelligenceEngine'
]
