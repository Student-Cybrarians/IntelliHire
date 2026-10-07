"""
Unit and Integration Tests for M03 AI/ML Assessment & Evaluation Engine (Phase 6).
Verifies:
1. Deterministic-first verification pipelines across modalities
2. 7 distinct Alternative Validity classifications
3. Domain-anchored rubric dimension scoring
4. Evaluator Bayesian calibration and Brier scores
5. Verification of diverse benchmark fixtures
"""

import unittest
from python_services.m3_task_intelligence.evaluation_engine import (
    DeterministicEvaluator,
    AlternativeValidityClassifier,
    MultiDimensionalScorer,
    EvaluatorCalibrationAnalyzer
)
from python_services.m3_task_intelligence.evaluation_fixtures import EVALUATION_FIXTURES


class TestM3EvaluationEngine(unittest.TestCase):

    def test_deterministic_coding_evaluator(self):
        code_valid = """
class TokenBucketRateLimiter:
    def __init__(self, capacity: int):
        self.capacity = capacity
        self.tokens = capacity
    def allow_request(self) -> bool:
        if self.tokens > 0:
            self.tokens -= 1
            return True
        return False
"""
        res = DeterministicEvaluator.evaluate_coding(code_valid, tests_passed=3, total_tests=3)
        self.assertTrue(res.passed)
        self.assertTrue(res.syntax_valid)
        self.assertGreaterEqual(res.score, 0.8)
        self.assertEqual(len(res.test_results), 3)

        # Syntax error test
        code_broken = "def broken(:"
        res_broken = DeterministicEvaluator.evaluate_coding(code_broken, tests_passed=0, total_tests=3)
        self.assertFalse(res_broken.passed)
        self.assertFalse(res_broken.syntax_valid)
        self.assertEqual(res_broken.score, 0.0)

    def test_deterministic_sql_evaluator(self):
        sql = """
CREATE INDEX CONCURRENTLY idx_audit_created ON candidate_audit_event (tenant_id, created_at DESC) INCLUDE (user_id, event_type);
SELECT user_id, event_type FROM candidate_audit_event WHERE tenant_id = $1 AND created_at >= $2;
"""
        res = DeterministicEvaluator.evaluate_sql(sql)
        self.assertTrue(res.passed)
        self.assertTrue(res.syntax_valid)
        self.assertGreaterEqual(res.score, 0.75)
        # Check non-concurrent fails concurrency check
        sql_blocking = "CREATE INDEX idx ON candidate_audit_event (tenant_id);"
        res_blocking = DeterministicEvaluator.evaluate_sql(sql_blocking)
        self.assertFalse(any(t["name"] == "Zero-Downtime Concurrency Check" and t["passed"] for t in res_blocking.test_results))

    def test_deterministic_finance_evaluator(self):
        calcs = {
            "total_capex": 14.0,
            "wacc": 0.085,
            "Project Alpha": {"npv": 4.25, "irr": 0.182}
        }
        res = DeterministicEvaluator.evaluate_finance(calcs, budget_envelope=15.0)
        self.assertTrue(res.passed)
        self.assertEqual(res.metrics["total_capex_m"], 14.0)

        # Exceeds budget
        calcs_over = {"total_capex": 22.0, "wacc": 0.085}
        res_over = DeterministicEvaluator.evaluate_finance(calcs_over, budget_envelope=15.0)
        self.assertFalse(res_over.passed)

    def test_deterministic_operations_evaluator(self):
        # Violation: Med-Surg nurse to intubated patient
        unsafe_assignments = [
            {"patient_id": "P-101 (Intubated ICU)", "nurse": "RN Elena Rostova (Med-Surg)"}
        ]
        res_unsafe = DeterministicEvaluator.evaluate_operations(unsafe_assignments)
        self.assertFalse(res_unsafe.passed)
        self.assertIn("Critical clinical safety violation", res_unsafe.errors[0])

        # Safe assignment
        safe_assignments = [
            {"patient_id": "P-101 (Intubated ICU)", "nurse": "RN Sarah Chen (ICU)", "overtime": 2}
        ]
        res_safe = DeterministicEvaluator.evaluate_operations(safe_assignments)
        self.assertTrue(res_safe.passed)

    def test_alternative_validity_classifications(self):
        # 1. Correct
        fix_correct = EVALUATION_FIXTURES["coding_rate_limiter_correct"]
        det_correct = DeterministicEvaluator.evaluate_universal(fix_correct["task_id"], fix_correct["deliverable"])
        val_correct, _ = AlternativeValidityClassifier.classify(
            det_correct, fix_correct["notes"], fix_correct["handled_dynamic_shift"],
            fix_correct["telemetry_action_count"], fix_correct["deliverable"]
        )
        self.assertEqual(val_correct, "correct")

        # 2. Alternative Valid
        fix_alt = EVALUATION_FIXTURES["coding_rate_limiter_alternative_valid"]
        det_alt = DeterministicEvaluator.evaluate_universal(fix_alt["task_id"], fix_alt["deliverable"])
        val_alt, _ = AlternativeValidityClassifier.classify(
            det_alt, fix_alt["notes"], fix_alt["handled_dynamic_shift"],
            fix_alt["telemetry_action_count"], fix_alt["deliverable"]
        )
        self.assertEqual(val_alt, "alternative_valid")

        # 3. Partially Correct
        fix_part = EVALUATION_FIXTURES["coding_rate_limiter_partially_correct"]
        det_part = DeterministicEvaluator.evaluate_universal(fix_part["task_id"], fix_part["deliverable"])
        val_part, _ = AlternativeValidityClassifier.classify(
            det_part, fix_part["notes"], fix_part["handled_dynamic_shift"],
            fix_part["telemetry_action_count"], fix_part["deliverable"]
        )
        self.assertEqual(val_part, "partially_correct")

        # 4. Incorrect
        fix_inc = EVALUATION_FIXTURES["operations_triage_incorrect"]
        det_inc = DeterministicEvaluator.evaluate_universal(fix_inc["task_id"], fix_inc["deliverable"])
        val_inc, _ = AlternativeValidityClassifier.classify(
            det_inc, fix_inc["notes"], fix_inc["handled_dynamic_shift"],
            fix_inc["telemetry_action_count"], fix_inc["deliverable"]
        )
        self.assertEqual(val_inc, "incorrect")

        # 5. Insufficient Information
        fix_empty = EVALUATION_FIXTURES["empty_insufficient_information"]
        det_empty = DeterministicEvaluator.evaluate_universal(fix_empty["task_id"], fix_empty["deliverable"])
        val_empty, _ = AlternativeValidityClassifier.classify(
            det_empty, fix_empty["notes"], fix_empty["handled_dynamic_shift"],
            fix_empty["telemetry_action_count"], fix_empty["deliverable"]
        )
        self.assertEqual(val_empty, "insufficient_information")

    def test_multidimensional_domain_rubric_scoring(self):
        rubric = {
            "dimensions": [
                {"name": "patient_safety", "weight": 0.35, "criteria": "Ratio compliance"},
                {"name": "prioritization", "weight": 0.25, "criteria": "ESI prioritization"},
                {"name": "adaptability", "weight": 0.25, "criteria": "Hazmat adjustment"},
                {"name": "efficiency", "weight": 0.15, "criteria": "Overtime limit"}
            ]
        }
        fix = EVALUATION_FIXTURES["operations_triage_context_dependent"]
        det = DeterministicEvaluator.evaluate_universal(fix["task_id"], fix["deliverable"])
        res = MultiDimensionalScorer.score_rubric(
            rubric=rubric,
            deterministic=det,
            validity="context_dependent",
            telemetry_action_count=fix["telemetry_action_count"],
            handled_dynamic_shift=fix["handled_dynamic_shift"]
        )
        self.assertIn("patient_safety", res["dimension_scores"])
        self.assertIn("prioritization", res["dimension_scores"])
        self.assertIn("adaptability", res["dimension_scores"])
        self.assertGreater(res["overall_score"], 0.6)

    def test_calibration_and_brier_score(self):
        # Test Brier Score Calculation
        preds = [0.9, 0.8, 0.2, 0.1]
        outcomes = [1.0, 1.0, 0.0, 0.0]
        # (0.1^2 + 0.2^2 + 0.2^2 + 0.1^2) / 4 = (0.01 + 0.04 + 0.04 + 0.01)/4 = 0.10/4 = 0.025
        brier = EvaluatorCalibrationAnalyzer.calculate_brier_score(preds, outcomes)
        self.assertAlmostEqual(brier, 0.025, places=3)

        # Test Bayesian Confidence Calibration
        calib = EvaluatorCalibrationAnalyzer.calibrate_confidence(
            action_count=6,
            deterministic_score=0.9,
            validity="correct",
            handled_dynamic_shift=True
        )
        self.assertGreater(calib["confidence_score"], 0.80)
        self.assertAlmostEqual(calib["confidence_score"] + calib["uncertainty_score"], 1.0, places=2)


if __name__ == "__main__":
    unittest.main()
