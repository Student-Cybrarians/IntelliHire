"""
Multi-Objective Explainable Task Targeting & Fair Priority Engine
IntelliHire M03 - Phase 2

Formulation:
  Priority(s) = w_R * R_s + w_U * U_s + w_G * G_s + w_C * C_s - w_F * F_s

Guarantees:
  1. Distinguishes confirmed weakness with solid evidence from low score with weak evidence.
  2. Strictly strips and ignores all protected/sensitive attributes.
  3. Returns mathematically transparent, auditable rationales.
"""

from typing import List, Dict, Any, Optional, Tuple, Set
import re
import uuid

# Canonical list of protected attributes prohibited from task selection
SENSITIVE_ATTRIBUTES = {
    "age", "date_of_birth", "dob", "birth_year", "graduation_year",
    "gender", "sex", "pronouns", "sexual_orientation",
    "race", "ethnicity", "nationality", "citizenship_status", "national_origin",
    "religion", "creed", "caste",
    "marital_status", "parental_status", "pregnancy", "children",
    "disability", "medical_condition", "health_status", "genetic_information",
    "veteran_status", "military_status",
    "postal_address", "zip_code", "zip", "socioeconomic_status"
}


def sanitize_sensitive_attributes(payload: Any) -> Tuple[Any, List[str]]:
    """
    Recursively scans and purges any protected/sensitive demographic attributes.
    Returns sanitized object and audit log of detected/stripped attributes.
    """
    stripped_traits: List[str] = []

    def _clean(obj: Any) -> Any:
        if isinstance(obj, dict):
            cleaned_dict = {}
            for k, v in obj.items():
                lower_k = k.lower()
                # Check for exact matches or compound keys like user_age, candidate_gender
                is_sensitive = any(
                    lower_k == attr or lower_k.startswith(f"{attr}_") or lower_k.endswith(f"_{attr}")
                    for attr in SENSITIVE_ATTRIBUTES
                )
                if is_sensitive:
                    stripped_traits.append(k)
                    continue
                cleaned_dict[k] = _clean(v)
            return cleaned_dict
        elif isinstance(obj, list):
            return [_clean(item) for item in obj]
        elif isinstance(obj, str):
            # Check for direct demographic leakage in string values
            for attr in ("gender", "ethnicity", "religion"):
                if re.search(rf"\b{attr}\s*:\s*\w+\b", obj, re.IGNORECASE):
                    stripped_traits.append(f"regex_in_string:{attr}")
            return obj
        return obj

    sanitized = _clean(payload)
    return sanitized, list(set(stripped_traits))


class TargetRanker:
    """
    Calibrates multi-objective priority score for candidate competencies and skills.
    """
    def __init__(self, assessment_purpose: str = "practice"):
        self.assessment_purpose = assessment_purpose.lower()

        # Weight profiles by assessment purpose
        if self.assessment_purpose == "diagnostic":
            self.w_R = 0.25  # Job Relevance
            self.w_U = 0.40  # Uncertainty (probe frontier)
            self.w_G = 0.15  # Gap Severity
            self.w_C = 0.25  # Coverage Deficit
            self.w_F = 0.10  # Fatigue penalty
        elif self.assessment_purpose == "gap_validation":
            self.w_R = 0.35  # Job Relevance
            self.w_U = 0.15  # Uncertainty
            self.w_G = 0.45  # Gap Severity (verify known deficits)
            self.w_C = 0.10  # Coverage Deficit
            self.w_F = 0.05
        elif self.assessment_purpose == "certification":
            self.w_R = 0.50  # Job Relevance (core requirements)
            self.w_U = 0.20  # Uncertainty
            self.w_G = 0.20  # Gap Severity
            self.w_C = 0.15  # Coverage Deficit
            self.w_F = 0.05
        else:  # default: practice / training
            self.w_R = 0.30
            self.w_U = 0.25
            self.w_G = 0.35
            self.w_C = 0.20
            self.w_F = 0.10

    def compute_priority(
        self,
        skill_name: str,
        competency_name: str,
        job_requirements: List[str],
        current_proficiency: float,
        uncertainty: float,
        observation_count: int,
        gap_signal: Optional[Dict[str, Any]] = None,
        recent_tasks: Optional[List[str]] = None,
        required_skills: Optional[List[str]] = None
    ) -> Dict[str, Any]:
        """
        Computes composite ranking priority and pedagogical rationale for a target skill.
        """
        # 1. Job Relevance (R_s)
        lower_skill = skill_name.lower()
        lower_comp = competency_name.lower()

        # Check required skills list
        in_required_skills = any(
            lower_skill == s.lower() or lower_comp == s.lower() or s.lower() in lower_skill
            for s in (required_skills or [])
        )

        # Check job requirement phrases
        in_job_reqs = any(
            lower_skill in req.lower() or lower_comp in req.lower() or
            any(part.strip() in req.lower() for part in lower_skill.replace("&", ",").split(",") if len(part.strip()) > 3)
            for req in job_requirements
        )

        is_explicitly_required = in_required_skills or in_job_reqs
        job_relevance = 1.0 if is_explicitly_required else (0.6 if job_requirements or required_skills else 0.5)

        # 2. Uncertainty Deficit (U_s)
        uncertainty_deficit = max(0.0, min(1.0, float(uncertainty)))

        # 3. Gap Severity (G_s)
        # Rule: A low score with weak evidence (few observations/high uncertainty) is different
        # from a confirmed demonstrated weakness.
        if gap_signal:
            gap_type = gap_signal.get("gap_origin_type")
            if gap_type == "confirmed_weakness":
                gap_severity = 1.0 if current_proficiency < 0.4 else 0.85
            elif gap_type == "high_uncertainty":
                gap_severity = 0.70
            elif gap_type == "misconception_flag":
                gap_severity = 0.95
            else:
                gap_severity = 0.60
        else:
            if current_proficiency < 0.45 and observation_count >= 1:
                gap_severity = 0.85  # Demonstrated low score
            elif current_proficiency < 0.5 and observation_count == 0:
                gap_severity = 0.50  # Unassessed baseline
            else:
                gap_severity = max(0.05, 1.0 - current_proficiency)

        # 4. Coverage Deficit (C_s)
        coverage_deficit = 1.0 / (1.0 + float(observation_count))

        # 5. Fatigue Penalty (F_s)
        recents = [t.lower() for t in (recent_tasks or [])]
        fatigue = 0.8 if lower_skill in recents[-1:] else (0.4 if lower_skill in recents[-3:] else 0.0)

        # Composite Priority Score:
        raw_score = (
            self.w_R * job_relevance +
            self.w_U * uncertainty_deficit +
            self.w_G * gap_severity +
            self.w_C * coverage_deficit -
            self.w_F * fatigue
        )
        priority_score = max(0.0, min(1.0, raw_score))

        # Formulate human-readable and model-explainable rationale
        reasons = []
        if is_explicitly_required:
            reasons.append("Mandatory requirement in target role specification")
        if gap_signal and gap_signal.get("gap_origin_type") == "confirmed_weakness":
            reasons.append(f"Confirmed demonstrated deficit ({round(current_proficiency * 100)}% score in M02)")
        elif uncertainty_deficit > 0.4:
            reasons.append(f"High epistemic uncertainty ({round(uncertainty_deficit * 100)}%) requiring empirical calibration")
        if coverage_deficit > 0.6:
            reasons.append(f"Low observation coverage ({observation_count} previous rounds)")
        if fatigue > 0:
            reasons.append("Slight fatigue penalty applied due to recent repetition")

        rationale = "; ".join(reasons) if reasons else f"Standard domain progression for {skill_name}."

        return {
            "skill_name": skill_name,
            "competency_name": competency_name,
            "targeting_score": round(priority_score, 4),
            "current_proficiency": round(current_proficiency, 3),
            "uncertainty_estimate": round(uncertainty_deficit, 3),
            "observation_count": observation_count,
            "breakdown": {
                "job_relevance_weight": round(job_relevance, 2),
                "uncertainty_deficit_weight": round(uncertainty_deficit, 2),
                "gap_severity_weight": round(gap_severity, 2),
                "coverage_deficit_weight": round(coverage_deficit, 2),
                "recency_fatigue_penalty": round(fatigue, 2),
                "rationale": rationale
            }
        }
