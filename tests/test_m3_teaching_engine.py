"""
Unit tests for IntelliHire M03 Phase 7 Teaching & Misconception Engine.
"""

import unittest
from python_services.m3_task_intelligence.teaching_engine import (
    MisconceptionClassifier,
    ReasoningPatternAnalyzer,
    TeachingExplanationGenerator,
    ExplanationQualityBenchmark,
    VALID_MISCONCEPTION_CATEGORIES
)


class TestM3TeachingEngine(unittest.TestCase):

    def setUp(self):
        self.sql_task = {
            "id": "sim-tech-api-relational-indexing",
            "domain": "software",
            "title": "PostgreSQL Index Optimization & Execution Plan Tuning",
            "competency_name": "API Design & Relational Modeling",
            "skill_name": "Relational Query & Index Optimization",
            "difficulty_level": 3
        }

        self.clinical_task = {
            "id": "sim-ops-hospital-triage",
            "domain": "operations",
            "title": "Hospital Emergency Bed Allocation & Triage Matrix",
            "competency_name": "Operations Management",
            "skill_name": "Emergency Triage Prioritization",
            "difficulty_level": 3
        }

    def test_misconception_classification_sql_lock(self):
        failed_tests = [
            {"name": "Zero-Downtime Concurrency Check", "passed": False, "message": "Missing CONCURRENTLY"}
        ]
        misconceptions = MisconceptionClassifier.classify(
            domain="software",
            task_id=self.sql_task["id"],
            candidate_response="CREATE INDEX idx ON orders (tenant_id);",
            failed_tests=failed_tests
        )
        self.assertGreaterEqual(len(misconceptions), 1)
        misc = misconceptions[0]
        self.assertIn(misc["category"], VALID_MISCONCEPTION_CATEGORIES)
        self.assertEqual(misc["category"], "trade_off_blindspot")
        self.assertIn("Exclusive Table Lock", misc["title"])
        self.assertIn("pg_stat_activity", misc["how_to_approach_logically"])

    def test_misconception_classification_clinical_fifo(self):
        failed_tests = [
            {"name": "Emergency Severity Index Adherence", "passed": False, "message": "Low acuity prioritized"}
        ]
        misconceptions = MisconceptionClassifier.classify(
            domain="operations",
            task_id=self.clinical_task["id"],
            candidate_response={},
            failed_tests=failed_tests,
            candidate_notes="Allocated beds by first come first served"
        )
        self.assertGreaterEqual(len(misconceptions), 1)
        misc = misconceptions[0]
        self.assertEqual(misc["category"], "conceptual")
        self.assertIn("FIFO", misc["title"])
        self.assertIn("Emergency Severity Index", misc["m02_reassess_focus"])

    def test_reasoning_pattern_analyzer(self):
        empty_res = ReasoningPatternAnalyzer.analyze("")
        self.assertEqual(empty_res["reasoning_depth"], "minimal")
        self.assertFalse(empty_res["has_trade_off_awareness"])

        deep_notes = (
            "We chose a partial index because the read latency is critical for active users. "
            "However, on the other hand, the trade-off is write overhead on insert. "
            "Therefore, we accept this compromise to mitigate the risk of connection pool exhaustion."
        )
        deep_res = ReasoningPatternAnalyzer.analyze(deep_notes)
        self.assertEqual(deep_res["reasoning_depth"], "deep")
        self.assertTrue(deep_res["has_trade_off_awareness"])
        self.assertTrue(deep_res["has_risk_awareness"])
        self.assertGreaterEqual(deep_res["coherence_score"], 0.8)

    def test_correct_response_teaching_payload_all_8_dimensions(self):
        det_result = {
            "score": 1.0,
            "test_results": [
                {"name": "Index Syntax", "passed": True},
                {"name": "Zero-Downtime Concurrency Check", "passed": True},
                {"name": "Composite Filter Alignment", "passed": True}
            ]
        }
        payload = TeachingExplanationGenerator.generate(
            task_def=self.sql_task,
            candidate_response="CREATE INDEX CONCURRENTLY idx_orders ON orders (tenant_id, status);",
            deterministic_result=det_result,
            alternative_validity="correct"
        )

        self.assertTrue(payload["is_correct_or_alternative"])
        self.assertIsNotNone(payload["why_correct_reasoning"])
        why = payload["why_correct_reasoning"]

        # Check all 8 correct dimensions
        self.assertIn("why_correct", why)
        self.assertIn("reasoning_path", why)
        self.assertIn("requirements_satisfied", why)
        self.assertIn("valid_assumptions", why)
        self.assertIn("important_trade_offs", why)
        self.assertIn("alternative_valid_approaches", why)
        self.assertIn("why_flawed_alternatives_fail", why)
        self.assertIn("potential_improvements", why)

        # Check interactive structures
        self.assertGreaterEqual(len(payload["why_chain"]), 2)
        self.assertGreaterEqual(len(payload["how_chain"]), 3)
        self.assertGreaterEqual(len(payload["what_if_scenarios"]), 2)
        self.assertIn("question", payload["follow_up_check"])
        self.assertIn("options", payload["follow_up_check"])

    def test_incorrect_response_teaching_payload_all_10_dimensions(self):
        det_result = {
            "score": 0.25,
            "test_results": [
                {"name": "Index Syntax", "passed": True},
                {"name": "Zero-Downtime Concurrency Check", "passed": False, "message": "Blocking DDL"},
                {"name": "Composite Filter Alignment", "passed": False, "message": "Wrong prefix"}
            ]
        }
        payload = TeachingExplanationGenerator.generate(
            task_def=self.sql_task,
            candidate_response="CREATE INDEX idx ON orders (created_at);",
            deterministic_result=det_result,
            alternative_validity="partially_correct"
        )

        self.assertFalse(payload["is_correct_or_alternative"])
        self.assertIsNotNone(payload["logic_gap_analysis"])
        gap = payload["logic_gap_analysis"]

        # Check all 10 logic gap dimensions
        self.assertIn("what_candidate_did_correctly", gap)
        self.assertIn("where_reasoning_breaks", gap)
        self.assertIn("why_it_breaks", gap)
        self.assertIn("missing_concept_or_logic", gap)
        self.assertIn("invalid_assumption", gap)
        self.assertIn("missing_requirement", gap)
        self.assertIn("correct_reasoning_path", gap)
        self.assertIn("how_to_approach_logically", gap)
        self.assertIn("how_to_avoid_repeating", gap)
        self.assertIn("practical_example_or_counterexample", gap)

        # Check that DO NOT say "Your answer is wrong, correct answer X" is obeyed:
        self.assertNotIn("Your answer is wrong. Correct answer:", gap["why_it_breaks"])
        self.assertGreaterEqual(len(payload["misconceptions"]), 1)

    def test_explanation_quality_benchmark(self):
        det_result = {
            "score": 1.0,
            "test_results": [{"name": "Index Syntax", "passed": True}]
        }
        payload = TeachingExplanationGenerator.generate(
            task_def=self.sql_task,
            candidate_response="CREATE INDEX CONCURRENTLY...",
            deterministic_result=det_result,
            alternative_validity="correct"
        )
        quality = ExplanationQualityBenchmark.evaluate_quality(
            task_def=self.sql_task,
            candidate_response="CREATE INDEX CONCURRENTLY...",
            teaching_payload=payload,
            deterministic_result=det_result
        )

        self.assertTrue(quality["is_certified"])
        self.assertGreaterEqual(quality["explanation_quality_score"], 0.85)
        self.assertTrue(quality["quality_checks"]["corresponds_to_actual_task"])
        self.assertTrue(quality["quality_checks"]["does_not_invent_errors"])


if __name__ == '__main__':
    unittest.main()
