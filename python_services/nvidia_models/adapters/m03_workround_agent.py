"""Module M03 Adapter: Technical & Non-Technical Work Round Intelligence.

Leverages nvidia/nemotron-3-nano-omni-30b-a3b-reasoning and deepseek-ai/deepseek-v4.1-flash
for cognitive debriefs, logic gap diagnosis, and misconception remediation.
"""

from typing import Any, Dict, Optional
from ..client import NvidiaClient


class M03WorkRoundAgentAdapter:
    """Adapter for continuous adaptive work round debriefs and teaching feedback."""

    def __init__(self, client: Optional[NvidiaClient] = None):
        self.client = client or NvidiaClient()

    def generate_task_debrief(
        self,
        task_title: str,
        task_prompt: str,
        candidate_submission: str,
        execution_results: str,
    ) -> Dict[str, Any]:
        """Produce an evidence-grounded teaching debrief identifying logic gaps and strengths."""
        system_prompt = (
            "You are an expert technical mentor debriefing a candidate work-round task.\n"
            "Analyze the candidate's process and execution output.\n"
            "Format response as structured JSON:\n"
            "{\n"
            "  'passed': boolean,\n"
            "  'strengths': [str],\n"
            "  'logic_gaps': [str],\n"
            "  'misconceptions': [str],\n"
            "  'teaching_explanation': str,\n"
            "  'recommended_next_focus': str\n"
            "}"
        )
        user_content = (
            f"Task: {task_title}\n"
            f"Requirements:\n{task_prompt}\n\n"
            f"Candidate Work:\n{candidate_submission}\n\n"
            f"Execution Results:\n{execution_results}"
        )
        messages = [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_content},
        ]
        return self.client.chat_completion(
            messages=messages,
            model="nvidia/nemotron-3-nano-omni-30b-a3b-reasoning",
            temperature=0.4,
            max_tokens=4096,
        )
