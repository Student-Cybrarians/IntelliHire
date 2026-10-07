"""
Seniority Scaling Engine for M03 Universal Task Intelligence.
Transforms task depth, scope, ambiguity, constraints, expected output,
and evaluation rubrics across all 7 professional seniority levels.
"""

from typing import Dict, Any, List

class SeniorityScaler:
    """Scales tasks across entry, junior, mid, senior, lead, manager, and director/executive tiers."""

    SENIORITY_PROFILES = {
        "entry": {
            "ambiguity": "low",
            "scope": "local_component",
            "autonomy": "procedural",
            "complexity_factor": 1.0,
            "time_allotted": 1200,
            "rubric_weights": {"correctness": 0.50, "code_quality": 0.30, "edge_cases": 0.20, "architecture": 0.00}
        },
        "junior": {
            "ambiguity": "low_to_moderate",
            "scope": "single_module",
            "autonomy": "independent_guided",
            "complexity_factor": 1.2,
            "time_allotted": 1500,
            "rubric_weights": {"correctness": 0.40, "code_quality": 0.30, "edge_cases": 0.20, "architecture": 0.10}
        },
        "mid": {
            "ambiguity": "moderate",
            "scope": "subsystem_service",
            "autonomy": "autonomous",
            "complexity_factor": 1.5,
            "time_allotted": 1800,
            "rubric_weights": {"correctness": 0.30, "code_quality": 0.25, "error_handling": 0.25, "architecture": 0.20}
        },
        "senior": {
            "ambiguity": "high",
            "scope": "cross_system",
            "autonomy": "architectural",
            "complexity_factor": 1.8,
            "time_allotted": 2100,
            "rubric_weights": {"architecture": 0.30, "resilience": 0.25, "tradeoffs": 0.25, "correctness": 0.20}
        },
        "lead": {
            "ambiguity": "high",
            "scope": "multi_system_platform",
            "autonomy": "organizational_technical",
            "complexity_factor": 2.1,
            "time_allotted": 2400,
            "rubric_weights": {"architecture": 0.35, "blast_radius": 0.25, "tradeoffs": 0.20, "team_maintainability": 0.20}
        },
        "manager": {
            "ambiguity": "very_high",
            "scope": "operational_delivery",
            "autonomy": "operational_governance",
            "complexity_factor": 2.3,
            "time_allotted": 2400,
            "rubric_weights": {"decision_quality": 0.35, "operational_risk": 0.30, "stakeholder_communication": 0.20, "execution": 0.15}
        },
        "executive": {
            "ambiguity": "very_high",
            "scope": "enterprise_strategic",
            "autonomy": "executive_authority",
            "complexity_factor": 2.5,
            "time_allotted": 2700,
            "rubric_weights": {"strategic_alignment": 0.35, "capital_allocation": 0.30, "enterprise_risk": 0.25, "executive_clarity": 0.10}
        }
    }

    @classmethod
    def normalize_seniority(cls, seniority_str: str) -> str:
        s = (seniority_str or "mid").lower().strip()
        if "entry" in s or "intern" in s or "assoc" in s:
            return "entry"
        if "junior" in s:
            return "junior"
        if "senior" in s or "sr" in s:
            return "senior"
        if "lead" in s or "staff" in s or "principal" in s:
            return "lead"
        if "manager" in s or "head" in s:
            return "manager"
        if "director" in s or "vp" in s or "exec" in s or "chief" in s:
            return "executive"
        return "mid"

    @classmethod
    def scale_task(cls, base_task: Dict[str, Any], target_seniority: str) -> Dict[str, Any]:
        """Deeply adapts a task's scope, constraints, and rubrics to match target seniority."""
        norm_level = cls.normalize_seniority(target_seniority)
        profile = cls.SENIORITY_PROFILES[norm_level]

        scaled = dict(base_task)
        scenario = dict(base_task.get("scenario", {}))
        constraints = list(scenario.get("constraints") or scenario.get("operationalConstraints") or [])

        # Add seniority-appropriate constraints
        if norm_level in ("entry", "junior"):
            constraints.append("Implementation must pass all unit tests without modifying function signatures.")
            expected_output = "Fully passing implementation with boundary condition unit tests."
        elif norm_level == "mid":
            constraints.append("Must handle asynchronous retries with exponential backoff and circuit breaking.")
            expected_output = "Production-ready service implementation with comprehensive error propagation."
        elif norm_level in ("senior", "lead"):
            constraints.append("Must guarantee atomic state transitions under concurrent multi-region contention.")
            constraints.append("Design must detail failover degraded mode with bounded p99 latency SLO (<15ms).")
            expected_output = "Resilient architectural implementation accompanied by technical trade-off RFC."
        else: # manager / executive
            constraints.append("Must provide executive ROI and capital expenditure sensitivity model under varying adoption rates.")
            constraints.append("Identify regulatory, security, and human capital trade-offs with explicit mitigation milestones.")
            expected_output = "Strategic decision memo, financial sensitivity schedule, and executive presentation."

        scenario["operationalConstraints"] = constraints
        scenario["expectedOutputType"] = expected_output
        scaled["scenario"] = scenario

        # Update Seniority Scope metadata
        scaled["seniorityScope"] = {
            "level": norm_level,
            "ambiguityLevel": profile["ambiguity"],
            "systemScope": profile["scope"],
            "expectedAutonomy": profile["autonomy"],
            "complexityFactor": profile["complexity_factor"]
        }
        scaled["timeAllottedSeconds"] = profile["time_allotted"]

        # Adapt Rubric weights to emphasize seniority-relevant dimensions
        rubric = dict(base_task.get("rubric") or {})
        dimensions = [dict(d) for d in (rubric.get("dimensions") or base_task.get("rubric_dimensions") or [])]
        
        # If standard dimensions exist, adjust weights towards the seniority profile
        if norm_level in ("senior", "lead"):
            for dim in dimensions:
                if dim.get("name") in ("architecture", "resilience", "decision_quality", "system_design"):
                    dim["weight"] = max(dim.get("weight", 0.2), 0.35)
                elif dim.get("name") == "correctness":
                    dim["weight"] = min(dim.get("weight", 0.3), 0.20)
        elif norm_level in ("manager", "executive"):
            for dim in dimensions:
                if dim.get("name") in ("decision_quality", "communication", "adaptability", "strategic_alignment"):
                    dim["weight"] = max(dim.get("weight", 0.2), 0.35)

        # Re-normalize rubric weights to sum exactly to 1.0
        total_w = sum(float(d.get("weight", 0.0)) for d in dimensions)
        if total_w > 0:
            for dim in dimensions:
                dim["weight"] = round(float(dim.get("weight", 0.0)) / total_w, 2)
            rem = round(1.0 - sum(d["weight"] for d in dimensions), 2)
            if dimensions:
                dimensions[0]["weight"] = round(dimensions[0]["weight"] + rem, 2)

        rubric["dimensions"] = dimensions
        scaled["rubric"] = rubric

        return scaled
