"""
Diversity Scoring and Entropy Analysis Engine for M03 Universal Task Intelligence.
Measures the breadth of cognitive dimensions, task forms, and families
experienced by a candidate across simulation work rounds.
"""

import math
from typing import Dict, Any, List
from .taxonomy import CognitiveDimension, TaskForm, TaskTaxonomy

class DiversityScorer:
    """Computes Shannon entropy and portfolio diversity across cognitive and task dimensions."""

    @classmethod
    def calculate_entropy(cls, counts: Dict[str, int]) -> float:
        total = sum(counts.values())
        if total <= 1:
            return 0.0
        entropy = 0.0
        for count in counts.values():
            if count > 0:
                p = count / total
                entropy -= p * math.log(p)
        return entropy

    @classmethod
    def analyze_task_history(cls, tasks: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Analyzes a candidate's completed task history to measure diversity and recommend next forms."""
        form_counts: Dict[str, int] = {}
        dimension_counts: Dict[str, int] = {dim: 0 for dim in CognitiveDimension.ALL_DIMENSIONS}
        family_counts: Dict[str, int] = {}

        for task in tasks:
            form = task.get("taskForm") or task.get("simulation_type") or "practical_execution"
            form_counts[form] = form_counts.get(form, 0) + 1

            family = task.get("taskFamily") or "coding"
            family_counts[family] = family_counts.get(family, 0) + 1

            dims = task.get("cognitiveDimensions") or TaskTaxonomy.get_cognitive_dimensions_for_form(form)
            for d in dims:
                if d in dimension_counts:
                    dimension_counts[d] += 1

        # Calculate Shannon entropy
        form_entropy = cls.calculate_entropy(form_counts)
        dim_entropy = cls.calculate_entropy(dimension_counts)

        # Normalize dimension entropy (max is ln(total_dimensions))
        max_dim_entropy = math.log(len(CognitiveDimension.ALL_DIMENSIONS))
        normalized_dim_diversity = min(1.0, dim_entropy / max_dim_entropy) if max_dim_entropy > 0 else 0.0

        # Identify under-represented cognitive dimensions
        under_represented_dims = [
            dim for dim, count in sorted(dimension_counts.items(), key=lambda x: x[1])
            if count == 0 or count < (sum(dimension_counts.values()) / max(1, len(dimension_counts)))
        ]

        # Recommend next task forms to maximize cognitive entropy
        recommended_forms: List[str] = []
        if under_represented_dims:
            target_dim = under_represented_dims[0]
            for form, dims in TaskTaxonomy.FORM_COGNITIVE_AFFINITY.items():
                if target_dim in dims and form_counts.get(form, 0) == 0:
                    recommended_forms.append(form)

        if not recommended_forms:
            recommended_forms = [TaskForm.SCENARIO, TaskForm.SYSTEM_DESIGN, TaskForm.CASE_STUDY]

        return {
            "total_tasks_completed": len(tasks),
            "form_distribution": form_counts,
            "cognitive_dimension_counts": dimension_counts,
            "shannon_entropy_dimensions": round(dim_entropy, 3),
            "normalized_cognitive_diversity": round(normalized_dim_diversity, 3),
            "under_represented_dimensions": under_represented_dims[:3],
            "recommended_next_task_forms": recommended_forms[:3]
        }
