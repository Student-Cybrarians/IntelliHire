"""
Unit tests for M03 Evidence Integrity, Calibration and Provenance Engine (Phase 5)
"""

import unittest
from python_services.m3_task_intelligence.evidence_integrity import (
    EvidenceNormalizer,
    ConfidenceCalibrator,
    AnomalyDetector,
    ProvenanceHasher
)


class TestM3EvidenceIntegrity(unittest.TestCase):

    def test_empirical_fact_validation(self):
        # Speculative / subjective language must be rejected
        valid, reason = EvidenceNormalizer.is_empirical_fact("Candidate feels confident about concurrency")
        self.assertFalse(valid)
        self.assertIn("feels", reason)

        valid, reason = EvidenceNormalizer.is_empirical_fact("Candidate probably understands SQL indexes")
        self.assertFalse(valid)
        self.assertIn("probably understands", reason)

        # Concrete empirical observation must be accepted
        valid, reason = EvidenceNormalizer.is_empirical_fact("Candidate created composite index on orders (status, created_at)")
        self.assertTrue(valid)
        self.assertIsNone(reason)

        valid, reason = EvidenceNormalizer.is_empirical_fact("Executed 3 automated test suites in 106ms with 0 errors")
        self.assertTrue(valid)
        self.assertIsNone(reason)

    def test_normalize_observed_facts(self):
        raw_facts = [
            {'fact': 'Executed CONCURRENT index creation', 'category': 'action'},
            {'fact': 'Candidate has great natural ability', 'category': 'speculation'}
        ]
        normalized = EvidenceNormalizer.normalize_observed_facts(raw_facts)
        self.assertEqual(len(normalized), 2)
        self.assertTrue(normalized[0]['is_empirical'])
        self.assertFalse(normalized[1]['is_empirical'])
        self.assertIn('natural ability', normalized[1]['rejection_reason'])

    def test_confidence_calibration(self):
        # 1. Low evidence scenario: 0 actions, no sandbox run
        low_res = ConfidenceCalibrator.calculate_confidence(
            action_count=0,
            dimension_scores={'correctness': 0.5, 'process': 0.5},
            has_sandbox_execution=False,
            handled_dynamic_shift=False
        )
        self.assertLessEqual(low_res['confidence_score'], 0.55)
        self.assertGreaterEqual(low_res['uncertainty_score'], 0.45)
        self.assertAlmostEqual(low_res['confidence_score'] + low_res['uncertainty_score'], 1.0, places=2)

        # 2. Rich evidence scenario: 10 actions, verified sandbox execution, handled shift
        rich_res = ConfidenceCalibrator.calculate_confidence(
            action_count=10,
            dimension_scores={'correctness': 0.9, 'process': 0.85, 'decision_quality': 0.88},
            has_sandbox_execution=True,
            handled_dynamic_shift=True,
            duration_seconds=120.0
        )
        self.assertGreater(rich_res['confidence_score'], 0.80)
        self.assertLess(rich_res['uncertainty_score'], 0.20)
        self.assertAlmostEqual(rich_res['confidence_score'] + rich_res['uncertainty_score'], 1.0, places=2)

    def test_anomaly_detection_instant_submission(self):
        anomalies = AnomalyDetector.detect_anomalies(
            action_count=1,
            duration_seconds=1.5,
            overall_score=0.92,
            dimension_scores={'correctness': 0.95}
        )
        self.assertTrue(any(a['code'] == 'INSTANT_SUBMISSION' for a in anomalies))

    def test_anomaly_detection_telemetry_silence(self):
        anomalies = AnomalyDetector.detect_anomalies(
            action_count=0,
            duration_seconds=45.0,
            overall_score=0.88,
            dimension_scores={'correctness': 0.90}
        )
        self.assertTrue(any(a['code'] == 'TELEMETRY_SILENCE' for a in anomalies))

    def test_provenance_hashing_determinism(self):
        hash1 = ProvenanceHasher.compute_hash(
            session_id="ses-123",
            task_id="sim-tech-rate-limiter",
            user_id="user-456",
            candidate_work={"code": "class TokenBucket {}"},
            timestamp="2026-10-07T21:00:00Z"
        )
        hash2 = ProvenanceHasher.compute_hash(
            session_id="ses-123",
            task_id="sim-tech-rate-limiter",
            user_id="user-456",
            candidate_work={"code": "class TokenBucket {}"},
            timestamp="2026-10-07T21:00:00Z"
        )
        self.assertEqual(hash1, hash2)
        self.assertEqual(len(hash1), 64)

        # Altering candidate work yields different hash
        hash3 = ProvenanceHasher.compute_hash(
            session_id="ses-123",
            task_id="sim-tech-rate-limiter",
            user_id="user-456",
            candidate_work={"code": "class TokenBucketDifferent {}"},
            timestamp="2026-10-07T21:00:00Z"
        )
        self.assertNotEqual(hash1, hash3)


if __name__ == '__main__':
    unittest.main()
