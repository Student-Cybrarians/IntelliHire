"""
5-Layer Multi-Source Evidence Aggregator
IntelliHire M03 - Phase 2

Enforces strict separation of:
1. Source Evidence (verbatim candidate text or raw events)
2. Extracted / Observed Facts (syntax, test results, objective answers)
3. Model Interpretation (rubric scores, LLM critiques, ATS matches)
4. Confidence / Uncertainty Estimates (probabilistic Bayesian metrics)
5. Human Judgment (recruiter / hiring committee verification)

Guarantees: Never fabricates candidate qualifications. AI inference never silently becomes candidate fact.
"""

from typing import List, Dict, Any, Optional
import uuid
import datetime


def normalize_string(s: Optional[str]) -> str:
    return (s or "").strip()


class EvidenceAggregator:
    def __init__(self):
        self.evidence_ledger: List[Dict[str, Any]] = []
        self.gap_signals: List[Dict[str, Any]] = []

    def ingest_candidate_claims(self, claims: List[Dict[str, Any]], resume_id: Optional[str] = None) -> None:
        """Ingests resume claims, tagging them as self-reported source claims."""
        for cl in claims:
            claim_val = normalize_string(cl.get("claim") or cl.get("claim_value"))
            if not claim_val:
                continue

            self.evidence_ledger.append({
                "id": f"ev-claim-{uuid.uuid4().hex[:8]}",
                "source_module": "m01_resume",
                "source_record_id": resume_id or cl.get("context_id"),
                "evidence_category": "source_evidence",
                "statement": f"Candidate claimed: '{claim_val}'",
                "competency_or_skill": cl.get("category") or "General Competency",
                "confidence_score": float(cl.get("confidence") or cl.get("confidence_score") or 0.70),
                "uncertainty_score": 0.35,  # Unverified self-claim carries high uncertainty
                "is_direct_observation": False,
                "observed_at": cl.get("created_at") or datetime.datetime.now(datetime.timezone.utc).isoformat(),
                "human_verification_state": cl.get("human_verification_state", "unreviewed")
            })

    def ingest_m02_evaluations(self, m02_records: List[Dict[str, Any]]) -> None:
        """
        Ingests M02 assessment responses, separating observed test responses
        from pedagogical evaluations and misconceptions.
        """
        for r in m02_records:
            skill_name = normalize_string(r.get("skill_name") or r.get("skill_id") or "Core Skill")
            score = float(r.get("score") if r.get("score") is not None else (r.get("score_raw") or 0.0))
            is_correct = bool(r.get("is_correct", score >= 0.7))

            # 1. Extracted Fact: Objective Answer / Result
            self.evidence_ledger.append({
                "id": f"ev-m02-fact-{uuid.uuid4().hex[:8]}",
                "source_module": "m02_assessment",
                "source_record_id": r.get("response_id") or r.get("id"),
                "evidence_category": "extracted_fact",
                "statement": f"Scored {round(score * 100)}% on assessment item targeting '{skill_name}'",
                "competency_or_skill": skill_name,
                "confidence_score": 0.95,
                "uncertainty_score": 0.15,
                "is_direct_observation": True,
                "observed_at": r.get("created_at") or datetime.datetime.now(datetime.timezone.utc).isoformat(),
                "human_verification_state": "unreviewed"
            })

            # 2. Model Interpretation: Pedagogical Critique
            critique = r.get("explanation_of_correct_answer") or r.get("analysis_of_candidate_answer")
            if critique:
                self.evidence_ledger.append({
                    "id": f"ev-m02-eval-{uuid.uuid4().hex[:8]}",
                    "source_module": "m02_assessment",
                    "source_record_id": r.get("response_id") or r.get("id"),
                    "evidence_category": "model_interpretation",
                    "statement": f"AI Evaluator critique on '{skill_name}': {critique}",
                    "competency_or_skill": skill_name,
                    "confidence_score": 0.88,
                    "uncertainty_score": 0.18,
                    "is_direct_observation": False,
                    "observed_at": r.get("created_at") or datetime.datetime.now(datetime.timezone.utc).isoformat(),
                    "human_verification_state": "unreviewed"
                })

            # 3. Gap Signal: If incorrect or misconception detected
            if not is_correct or score < 0.65:
                misconception = r.get("misconception_remediation") or r.get("analysis_of_candidate_answer")
                self.gap_signals.append({
                    "id": f"gap-m02-{uuid.uuid4().hex[:8]}",
                    "skill_name": skill_name,
                    "competency_name": r.get("competency_name") or skill_name,
                    "source_module": "m02_misconception" if misconception else "m02_assessment",
                    "gap_origin_type": "confirmed_weakness" if score < 0.4 else "high_uncertainty",
                    "severity": "critical" if score < 0.4 else "moderate",
                    "observed_deficit": f"Failed item verification ({round(score * 100)}% score).",
                    "misconception_details": {
                        "remediation_advice": misconception or "Review core principles.",
                        "divergence_pattern": r.get("how_to_arrive") or "Direct deviation from recommended pattern."
                    } if misconception else None,
                    "confidence": 0.92,
                    "uncertainty": 0.12,
                    "detected_at": r.get("created_at") or datetime.datetime.now(datetime.timezone.utc).isoformat()
                })

    def ingest_m03_history(self, m03_evaluations: List[Dict[str, Any]]) -> None:
        """Ingests prior M03 simulation evaluations into evidence ledger."""
        for ev in m03_evaluations:
            skill = normalize_string(ev.get("skill_name") or ev.get("definition_id") or "Simulation Skill")
            score = float(ev.get("overall_score") or 0.0)

            # Observed Fact
            self.evidence_ledger.append({
                "id": f"ev-m03-{uuid.uuid4().hex[:8]}",
                "source_module": "m03_simulation",
                "source_record_id": ev.get("session_id") or ev.get("id"),
                "evidence_category": "extracted_fact",
                "statement": f"Completed simulation '{skill}' with composite score of {round(score * 100)}%",
                "competency_or_skill": skill,
                "confidence_score": 0.96,
                "uncertainty_score": 0.08,
                "is_direct_observation": True,
                "observed_at": ev.get("created_at") or datetime.datetime.now(datetime.timezone.utc).isoformat(),
                "human_verification_state": "unreviewed"
            })

            # Check if simulation indicated remaining gap
            if score < 0.65:
                self.gap_signals.append({
                    "id": f"gap-m03-{uuid.uuid4().hex[:8]}",
                    "skill_name": skill,
                    "competency_name": skill,
                    "source_module": "m03_simulation",
                    "gap_origin_type": "confirmed_weakness",
                    "severity": "critical" if score < 0.5 else "moderate",
                    "observed_deficit": f"Simulation execution deficit ({round(score * 100)}% score).",
                    "confidence": 0.95,
                    "uncertainty": 0.08,
                    "detected_at": ev.get("created_at") or datetime.datetime.now(datetime.timezone.utc).isoformat()
                })

    def get_bundle(self) -> Dict[str, Any]:
        return {
            "evidence_ledger": self.evidence_ledger,
            "gap_signals": self.gap_signals
        }
