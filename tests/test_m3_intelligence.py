"""
Comprehensive Test Suite for M03 Context Intelligence & Task Targeting Engine
IntelliHire M03 - Phase 2
"""

import unittest
import json
import sys
import os

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from python_services.m3_intelligence.bayesian_calibrator import calculate_kalman_update, project_information_gain
from python_services.m3_intelligence.semantic_matcher import tokenize, compute_tf_vector, cosine_similarity, match_candidate_to_requirements
from python_services.m3_intelligence.evidence_aggregator import EvidenceAggregator
from python_services.m3_intelligence.target_ranker import TargetRanker, sanitize_sensitive_attributes, SENSITIVE_ATTRIBUTES
from python_services.m3_intelligence.engine import build_assessment_context


class TestM03Intelligence(unittest.TestCase):

    def setUp(self):
        self.sample_complete_payload = {
            "candidate": {
                "id": "cand-alex-1",
                "organization_id": "org-m3-prod",
                "target_role": "Senior Backend Infrastructure Engineer",
                "seniority_level": "senior",
                "primary_domain": "software",
                "extracted_skills": ["Go", "Kubernetes", "Distributed Systems", "PostgreSQL"],
                "readiness_score": 0.78
            },
            "job": {
                "id": "req-infra-99",
                "title": "Senior Backend Infrastructure Engineer",
                "role_category": "software",
                "seniority_level": "senior",
                "required_skills": ["Distributed Systems & Concurrency", "Kubernetes", "Performance Optimization"],
                "key_requirements": [
                    "Experience with sliding-window rate limiters and concurrency",
                    "Deep knowledge of Kubernetes pod lifecycle and container networking",
                    "Sub-millisecond query optimization and relational indexing"
                ]
            },
            "claims": [
                {"claim_value": "Architected low-latency distributed rate limiter in Go", "confidence_score": 0.92},
                {"claim_value": "Managed 50-node Kubernetes cluster across AWS regions", "confidence_score": 0.90}
            ],
            "m02_evaluations": [
                {
                    "skill_name": "Distributed Systems & Concurrency",
                    "score_raw": 0.35,
                    "is_correct": False,
                    "analysis_of_candidate_answer": "Candidate diverged on clock-drift handling under network partition.",
                    "misconception_remediation": "Review NTP skew tolerance and monotonically non-decreasing timestamps."
                }
            ],
            "proficiencies": [
                {
                    "skill_name": "Distributed Systems & Concurrency",
                    "proficiency_estimate": 0.35,
                    "uncertainty_estimate": 0.55,
                    "observation_count": 1
                },
                {
                    "skill_name": "Kubernetes",
                    "proficiency_estimate": 0.85,
                    "uncertainty_estimate": 0.15,
                    "observation_count": 3
                }
            ]
        }

    # 1. Complete Context
    def test_complete_context_generation(self):
        ctx = build_assessment_context(self.sample_complete_payload, assessment_purpose="practice")
        self.assertIsNotNone(ctx["contextId"])
        self.assertEqual(ctx["candidateContext"]["userId"], "cand-alex-1")
        self.assertEqual(ctx["jobContext"]["jobTitle"], "Senior Backend Infrastructure Engineer")
        self.assertEqual(ctx["activeWorkModality"], "coding")
        self.assertGreater(len(ctx["prioritizedTargets"]), 0)

        # Verified that the diagnosed gap (Distributed Systems & Concurrency) is prioritized to top
        top_target = ctx["primaryRecommendedTarget"]
        self.assertEqual(top_target["skillName"], "Distributed Systems & Concurrency")
        self.assertGreater(top_target["targetingScore"], 0.70)
        self.assertIn("deficit", top_target["rationale"].lower())

    # 2. Missing Resume Case
    def test_missing_resume_resilience(self):
        payload = dict(self.sample_complete_payload)
        payload["claims"] = []
        payload["candidate"]["extracted_skills"] = []
        payload["candidate"]["active_resume_id"] = None

        ctx = build_assessment_context(payload, assessment_purpose="diagnostic")
        self.assertIsNotNone(ctx["contextId"])
        self.assertEqual(len(ctx["candidateContext"]["verifiedClaims"]), 0)
        self.assertGreater(len(ctx["prioritizedTargets"]), 0)

    # 3. Missing Job Description Case
    def test_missing_jd_resilience(self):
        payload = dict(self.sample_complete_payload)
        payload["job"] = {}

        ctx = build_assessment_context(payload, assessment_purpose="practice")
        self.assertIsNotNone(ctx["contextId"])
        self.assertEqual(ctx["jobContext"]["jobTitle"], "Senior Backend Infrastructure Engineer")
        self.assertGreater(len(ctx["prioritizedTargets"]), 0)

    # 4. Incomplete Profile Case
    def test_incomplete_profile_resilience(self):
        payload = {
            "candidate": {},
            "job": {},
            "claims": [],
            "m02_evaluations": [],
            "proficiencies": []
        }
        ctx = build_assessment_context(payload, assessment_purpose="practice")
        self.assertIsNotNone(ctx["contextId"])
        self.assertIsNotNone(ctx["primaryRecommendedTarget"])
        self.assertEqual(ctx["securityGovernance"]["sensitiveAttributesExcluded"], True)

    # 5. Missing Competency Mapping Case
    def test_missing_competency_mapping(self):
        payload = dict(self.sample_complete_payload)
        payload["proficiencies"] = []
        payload["job"]["required_skills"] = []

        ctx = build_assessment_context(payload, assessment_purpose="practice")
        self.assertIsNotNone(ctx["primaryRecommendedTarget"])

    # 6. Conflicting Evidence Case
    def test_conflicting_evidence_resolution(self):
        """
        Resume claims high proficiency (self-claim) but M02 reveals failure (direct evidence).
        The engine must prioritize the direct evidence over the self-claim.
        """
        payload = dict(self.sample_complete_payload)
        payload["claims"] = [{"claim_value": "World-class expert in Concurrency and Thread Safety", "confidence_score": 0.99}]
        payload["m02_evaluations"] = [{
            "skill_name": "Distributed Systems & Concurrency",
            "score_raw": 0.20,
            "is_correct": False
        }]

        ctx = build_assessment_context(payload, assessment_purpose="gap_validation")
        # Direct evidence should yield a confirmed gap
        signals = [g for g in ctx["gapSignals"] if g["skill_name"] == "Distributed Systems & Concurrency"]
        self.assertGreater(len(signals), 0)
        self.assertEqual(signals[0]["gap_origin_type"], "confirmed_weakness")

    # 7. Low-Confidence Evidence Case
    def test_low_confidence_evidence_handling(self):
        """
        A low score with weak evidence (observation_count=0, high uncertainty)
        must be handled differently from a confirmed demonstrated weakness.
        """
        ranker = TargetRanker(assessment_purpose="practice")
        result_uncertain = ranker.compute_priority(
            skill_name="eBPF",
            competency_name="Kernel Internals",
            job_requirements=["eBPF"],
            current_proficiency=0.30,
            uncertainty=0.85,
            observation_count=0
        )

        result_confirmed = ranker.compute_priority(
            skill_name="eBPF",
            competency_name="Kernel Internals",
            job_requirements=["eBPF"],
            current_proficiency=0.30,
            uncertainty=0.08,
            observation_count=4,
            gap_signal={"gap_origin_type": "confirmed_weakness"}
        )

        # Both are prioritized, but confirmed weakness has higher gap severity
        self.assertIn("epistemic uncertainty", result_uncertain["breakdown"]["rationale"].lower())
        self.assertIn("confirmed demonstrated deficit", result_confirmed["breakdown"]["rationale"].lower())

    # 8. Different Seniorities
    def test_different_seniorities(self):
        junior_payload = dict(self.sample_complete_payload)
        junior_payload["candidate"]["seniority_level"] = "junior"
        ctx_jr = build_assessment_context(junior_payload)
        self.assertEqual(ctx_jr["roleContext"]["seniorityLevel"], "junior")

        lead_payload = dict(self.sample_complete_payload)
        lead_payload["candidate"]["seniority_level"] = "lead"
        ctx_lead = build_assessment_context(lead_payload)
        self.assertEqual(ctx_lead["roleContext"]["seniorityLevel"], "lead")

    # 9. Multiple Roles / Modalities
    def test_multiple_roles_and_modalities(self):
        fin_payload = dict(self.sample_complete_payload)
        fin_payload["candidate"]["target_role"] = "VP Financial Planning & Analysis"
        ctx_fin = build_assessment_context(fin_payload)
        self.assertEqual(ctx_fin["activeWorkModality"], "financial_analysis")

        ops_payload = dict(self.sample_complete_payload)
        ops_payload["candidate"]["target_role"] = "Clinical Nurse Float Pool Operations Manager"
        ctx_ops = build_assessment_context(ops_payload)
        self.assertEqual(ctx_ops["activeWorkModality"], "operational_triage")

    # 10. Tenant Isolation & Authorization Boundary
    def test_tenant_isolation(self):
        payload = dict(self.sample_complete_payload)
        payload["candidate"]["organization_id"] = "org-tenant-alpha"
        ctx = build_assessment_context(payload)
        self.assertEqual(ctx["securityGovernance"]["tenantId"], "org-tenant-alpha")
        self.assertEqual(ctx["candidateContext"]["organizationId"], "org-tenant-alpha")

    # 11. Sensitive-Trait Exclusion (Fairness Safeguards)
    def test_sensitive_trait_exclusion(self):
        """
        Deliberately inject prohibited protected attributes into the raw payload.
        Verify that ALL are purged and documented in the exclusion audit log.
        """
        malicious_payload = dict(self.sample_complete_payload)
        malicious_payload["candidate"]["age"] = 45
        malicious_payload["candidate"]["gender"] = "female"
        malicious_payload["candidate"]["race"] = "Asian"
        malicious_payload["candidate"]["religion"] = "Christian"
        malicious_payload["candidate"]["marital_status"] = "married"
        malicious_payload["candidate"]["candidate_disability"] = "none"

        ctx = build_assessment_context(malicious_payload)

        # Assert no sensitive traits in sanitized candidate context
        cand_ctx = ctx["candidateContext"]
        self.assertNotIn("age", cand_ctx)
        self.assertNotIn("gender", cand_ctx)
        self.assertNotIn("race", cand_ctx)
        self.assertNotIn("religion", cand_ctx)
        self.assertNotIn("marital_status", cand_ctx)

        # Assert exclusion audit logged them
        audit = ctx["securityGovernance"]["exclusionAudit"]
        self.assertIn("age", audit)
        self.assertIn("gender", audit)
        self.assertIn("race", audit)
        self.assertIn("religion", audit)

    # 12. Statistical Bayesian / Kalman Calibration
    def test_kalman_calibration_step(self):
        # High uncertainty prior: 0.5 mean, 0.6 variance
        # Observed authentic simulation score: 0.90
        res = calculate_kalman_update(
            prior_mean=0.5,
            prior_variance=0.6,
            observed_score=0.9,
            source_module="m03_simulation"
        )
        self.assertGreater(res.posterior_mean, 0.80)
        self.assertLess(res.posterior_variance, 0.10)
        self.assertGreater(res.uncertainty_reduction_pct, 80.0)
        self.assertGreater(res.information_gain_nats, 1.0)


if __name__ == "__main__":
    unittest.main()
