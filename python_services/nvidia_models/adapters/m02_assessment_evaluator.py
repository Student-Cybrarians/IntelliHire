"""Module M02 Adapter: Assessment Item & Rubric Evaluation with NVIDIA Models.

Leverages meta/muse-glimmer-30b and google/gemma-4-31b-it for
rubric scoring, question generation, and deterministic verification.
"""

from typing import Any, Dict, Optional
from ..client import NvidiaClient


class M02AssessmentEvaluatorAdapter:
    """Adapter for assessment rubric scoring and structured evaluation."""

    def __init__(self, client: Optional[NvidiaClient] = None):
        self.client = client or NvidiaClient()

    def evaluate_response(
        self,
        question_text: str,
        candidate_response: str,
        rubric_criteria: str,
    ) -> Dict[str, Any]:
        """Evaluate a candidate's subjective response against a defined rubric."""
        system_prompt = (
            "You are an objective hiring competency evaluator.\n"
            "Score the response against the criteria (0 to 100) and explain the rating.\n"
            "Return valid JSON: {'score': int, 'feedback': str, 'demonstrated_competencies': [str]}"
        )
        user_content = (
            f"Question: {question_text}\n\n"
            f"Rubric: {rubric_criteria}\n\n"
            f"Candidate Response: {candidate_response}"
        )
        messages = [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_content},
        ]
        return self.client.chat_completion(
            messages=messages,
            model="meta/muse-glimmer-30b",
            temperature=0.0,
        )
