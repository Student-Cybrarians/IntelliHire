"""
Master Task Intelligence Engine Orchestrator for M03 Work Round System.
Coordinates task selection, repetition prevention, diversity analysis,
seniority calibration, and quality validation.
"""

import sys
import json
from typing import Dict, Any, List, Optional
from .taxonomy import TaskTaxonomy, TaskForm, CognitiveDimension, TaskFamily
from .seniority_scaler import SeniorityScaler
from .repetition_detector import RepetitionDetector
from .diversity_scorer import DiversityScorer
from .quality_evaluator import QualityEvaluator
from .task_synthesizer import TaskSynthesizer

class TaskIntelligenceEngine:
    """Master orchestrator for universal task intelligence."""

    @classmethod
    def get_next_task(
        cls,
        assessment_context: Dict[str, Any],
        previous_tasks: Optional[List[Dict[str, Any]]] = None,
        assessment_purpose: str = "practice"
    ) -> Dict[str, Any]:
        """
        Selects and synthesizes ONE appropriate task at a time for the candidate.
        Enforces non-repetition, seniority scaling, and safety invariants.
        """
        previous_tasks = previous_tasks or []

        # 1. Analyze candidate's past diversity to discover under-represented forms
        diversity_analysis = DiversityScorer.analyze_task_history(previous_tasks)
        recommended_forms = diversity_analysis.get("recommended_next_task_forms") or [TaskForm.PRACTICAL_EXECUTION]
        chosen_form = recommended_forms[0]

        # 2. Select prioritized competency target
        prioritized_targets = assessment_context.get("prioritizedTargets") or []
        target_comp = None
        if prioritized_targets:
            # Pick highest priority target that hasn't been recently repeated
            recent_skills = [
                (t.get("competencyTarget", {}).get("skillName") or t.get("skill_name") or "").lower()
                for t in previous_tasks[-2:]
            ]
            for pt in prioritized_targets:
                s_name = (pt.get("skillName") or pt.get("name") or "").lower()
                if s_name not in recent_skills:
                    target_comp = pt
                    break
            if not target_comp and prioritized_targets:
                target_comp = prioritized_targets[0]

        # 3. Synthesize task
        task = TaskSynthesizer.synthesize_task(
            assessment_context=assessment_context,
            target_competency=target_comp,
            previous_tasks=previous_tasks,
            requested_form=chosen_form if previous_tasks else None
        )

        # 4. Validate Quality & Invariants
        quality_res = QualityEvaluator.evaluate_quality(task)
        safe, violations = QualityEvaluator.safety_check(task)

        if not safe:
            raise ValueError(f"Task generation safety invariant failed: {'; '.join(violations)}")

        # 5. Attach telemetry and diversity context
        task["diversityContext"] = {
            "currentEntropy": diversity_analysis.get("shannon_entropy_dimensions", 0.0),
            "underRepresentedDimensions": diversity_analysis.get("under_represented_dimensions", [])
        }
        task["qualityAudit"] = quality_res

        return task

def main():
    if len(sys.argv) > 1 and sys.argv[1] == "--next-task":
        # Read assessment context from stdin
        raw_input = sys.stdin.read().strip()
        data = json.loads(raw_input) if raw_input else {}
        ctx = data.get("assessmentContext", {})
        prev = data.get("previousTasks", [])
        purpose = data.get("purpose", "practice")
        
        result_task = TaskIntelligenceEngine.get_next_task(ctx, prev, purpose)
        print(json.dumps(result_task, indent=2))
    else:
        print("M03 Universal Task Intelligence Engine CLI active.")

if __name__ == "__main__":
    main()
