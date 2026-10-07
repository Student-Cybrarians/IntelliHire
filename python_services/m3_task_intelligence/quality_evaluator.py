"""
Task Quality Evaluation and Safety Verification Engine for M03 Universal Task Intelligence.
Validates structural integrity, rubric anchoring, core model compliance,
and strict absence of sensitive demographic attributes.
"""

from typing import Dict, Any, List, Tuple
import re

SENSITIVE_TRAITS = [
    "age", "gender", "race", "religion", "ethnicity", "sexual_orientation",
    "marital_status", "pregnancy", "disability", "caste", "nationality"
]

ACTION_VERBS = [
    "implement", "design", "refactor", "diagnose", "evaluate", "calculate",
    "optimize", "formulate", "debug", "analyze", "resolve", "triage", "draft"
]

class QualityEvaluator:
    """Evaluates task quality, cognitive demand, and safety invariants."""

    @classmethod
    def validate_structure(cls, task: Dict[str, Any]) -> Tuple[bool, List[str]]:
        errors: List[str] = []
        if not task.get("id"):
            errors.append("Task is missing a valid 'id'.")
        if not task.get("modality"):
            errors.append("Task is missing 'modality'.")

        scenario = task.get("scenario") or {}
        if not scenario.get("objective"):
            errors.append("Scenario is missing an 'objective'.")
        
        reqs = scenario.get("initialRequirements") or scenario.get("initial_requirements") or []
        if not isinstance(reqs, list) or len(reqs) == 0:
            errors.append("Scenario must have at least one initial requirement.")

        rubric = task.get("rubric") or {}
        dimensions = rubric.get("dimensions") or []
        if not isinstance(dimensions, list) or len(dimensions) == 0:
            errors.append("Rubric must contain at least one evaluation dimension.")
        else:
            total_weight = sum(float(d.get("weight", 0.0)) for d in dimensions)
            if not (0.90 <= total_weight <= 1.10):
                errors.append(f"Rubric dimension weights must sum to approximately 1.0 (found {round(total_weight, 2)}).")

        return len(errors) == 0, errors

    @classmethod
    def evaluate_quality(cls, task: Dict[str, Any]) -> Dict[str, Any]:
        """Calculates multi-dimensional quality and cognitive demand scores."""
        valid, errors = cls.validate_structure(task)
        if not valid:
            return {
                "is_valid": False,
                "overall_quality_score": 0.0,
                "structural_errors": errors,
                "clarity_score": 0.0,
                "rubric_soundness": 0.0,
                "cognitive_demand": 0.0
            }

        scenario = task.get("scenario", {})
        objective = scenario.get("objective", "").lower()
        background = scenario.get("background", "")
        constraints = scenario.get("operationalConstraints") or scenario.get("constraints") or []

        # 1. Clarity Score
        has_action_verb = any(v in objective for v in ACTION_VERBS)
        has_adequate_length = len(objective.split()) >= 8 and len(background.split()) >= 15
        clarity = 1.0 if (has_action_verb and has_adequate_length) else (0.7 if has_action_verb else 0.5)

        # 2. Constraint Realism Score
        constraint_score = min(1.0, len(constraints) * 0.35)

        # 3. Rubric Soundness Score
        dimensions = task.get("rubric", {}).get("dimensions", [])
        detailed_criteria = sum(1 for d in dimensions if len(d.get("criteria", "").split()) >= 6)
        rubric_soundness = min(1.0, detailed_criteria / max(1, len(dimensions)))

        # 4. Cognitive Demand (Bloom's Taxonomy proxy)
        high_order_verbs = ["design", "evaluate", "optimize", "triage", "formulate", "architect"]
        is_high_order = any(v in objective for v in high_order_verbs)
        seniority = task.get("seniorityScope", {}).get("level", "mid")
        cognitive_demand = 0.90 if is_high_order else 0.70
        if seniority in ("senior", "lead", "manager", "executive"):
            cognitive_demand = min(1.0, cognitive_demand + 0.10)

        # Composite Quality Score
        composite_quality = (0.35 * clarity) + (0.25 * constraint_score) + (0.25 * rubric_soundness) + (0.15 * cognitive_demand)
        composite_quality = round(min(1.0, composite_quality), 3)

        return {
            "is_valid": True,
            "overall_quality_score": composite_quality,
            "structural_errors": [],
            "clarity_score": round(clarity, 2),
            "constraint_realism": round(constraint_score, 2),
            "rubric_soundness": round(rubric_soundness, 2),
            "cognitive_demand": round(cognitive_demand, 2)
        }

    @classmethod
    def safety_check(cls, task: Dict[str, Any]) -> Tuple[bool, List[str]]:
        """Ensures complete absence of protected demographic traits or autonomous employment verdicts."""
        violations: List[str] = []
        text_corpus = " ".join([
            str(task.get("title", "")),
            str(task.get("scenario", {}).get("background", "")),
            str(task.get("scenario", {}).get("objective", "")),
            " ".join(task.get("scenario", {}).get("operationalConstraints", []) or [])
        ]).lower()

        for trait in SENSITIVE_TRAITS:
            pattern = rf'\b{trait}\b'
            if re.search(pattern, text_corpus):
                violations.append(f"Protected attribute '{trait}' detected in task definition.")

        if "hire" in text_corpus or "reject candidate" in text_corpus or "terminate employment" in text_corpus:
            # Check if autonomous hiring is mandated
            if "must hire" in text_corpus or "automatically reject" in text_corpus:
                violations.append("Prohibited autonomous employment determination detected.")

        return len(violations) == 0, violations
