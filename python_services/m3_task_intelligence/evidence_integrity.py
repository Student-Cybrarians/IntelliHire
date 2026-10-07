"""
M03 Evidence Integrity, Provenance & Calibration Engine (Phase 5)
Provides Python data integrity utilities for:
1. Evidence normalization & fact-vs-interpretation segregation
2. Calibrated Bayesian confidence & epistemic uncertainty calculation
3. Behavioral telemetry anomaly detection
4. Cryptographic SHA-256 provenance hashing
"""

import hashlib
import json
import math
import re
from typing import Dict, List, Any, Optional, Tuple


SPECULATIVE_WORDS = {
    'feels', 'thinks', 'believes', 'likely knows', 'probably understands',
    'seems to grasp', 'appears intelligent', 'attitude', 'personality',
    'inherently', 'natural ability', 'mindset'
}


class EvidenceNormalizer:
    """Ensures empirical segregation: observed facts must be verifiable and free of speculation."""

    @staticmethod
    def is_empirical_fact(statement: str) -> Tuple[bool, Optional[str]]:
        """Validates that a statement is strictly an observable fact."""
        if not statement or len(statement.strip()) < 5:
            return False, "Statement too short to constitute evidence"

        lower = statement.lower()
        for word in SPECULATIVE_WORDS:
            if re.search(r'\b' + re.escape(word) + r'\b', lower):
                return False, f"Contains speculative or non-observable term: '{word}'"

        return True, None

    @staticmethod
    def normalize_observed_facts(facts: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Filters, categorizes and normalizes an array of observable facts."""
        normalized = []
        for i, item in enumerate(facts):
            fact_text = item.get('fact') or item.get('statement') or str(item)
            is_valid, reason = EvidenceNormalizer.is_empirical_fact(fact_text)
            
            category = item.get('category', 'action')
            if category not in {'action', 'execution_result', 'constraint_handling', 'timing', 'artifact_structure'}:
                category = 'action'

            verified_by = item.get('verified_by', 'telemetry_stream')
            if verified_by not in {'sandbox_execution', 'telemetry_stream', 'heuristic_parser', 'human'}:
                verified_by = 'telemetry_stream'

            normalized.append({
                'id': item.get('id', f'fact-{i+1}'),
                'fact': fact_text.strip(),
                'is_empirical': is_valid,
                'rejection_reason': reason,
                'category': category,
                'verified_by': verified_by,
                'metrics': item.get('metrics', {})
            })
        return normalized


class ConfidenceCalibrator:
    """Calculates Bayesian confidence and epistemic uncertainty from empirical observations."""

    @staticmethod
    def calculate_confidence(
        action_count: int,
        dimension_scores: Dict[str, float],
        has_sandbox_execution: bool,
        handled_dynamic_shift: bool,
        duration_seconds: float = 60.0
    ) -> Dict[str, float]:
        """
        Bayesian calibration:
        - Base confidence: 0.50 (prior)
        - Telemetry evidence weight: up to +0.20 based on log density
        - Verification weight: +0.15 if validated in sandbox execution
        - Adaptation weight: +0.10 if adapted to mid-scenario shift
        - Variance penalty: down to -0.15 if rubric dimension scores have high disagreement
        """
        score_values = [float(v) for v in dimension_scores.values() if isinstance(v, (int, float))]
        score_std = 0.0
        if len(score_values) > 1:
            mean = sum(score_values) / len(score_values)
            variance = sum((x - mean) ** 2 for x in score_values) / len(score_values)
            score_std = math.sqrt(variance)

        # 1. Telemetry bonus (diminishing returns log scale)
        telemetry_bonus = min(0.20, math.log1p(max(0, action_count)) * 0.07)

        # 2. Execution verification bonus
        exec_bonus = 0.15 if has_sandbox_execution else 0.0

        # 3. Dynamic constraint handling bonus
        adapt_bonus = 0.10 if handled_dynamic_shift else 0.0

        # 4. Pace sanity check
        pace_penalty = 0.20 if duration_seconds < 5.0 else 0.0

        # 5. Variance penalty
        variance_penalty = min(0.15, score_std * 0.4)

        raw_confidence = 0.50 + telemetry_bonus + exec_bonus + adapt_bonus - pace_penalty - variance_penalty
        calibrated_confidence = max(0.20, min(0.98, round(raw_confidence, 3)))
        epistemic_uncertainty = round(1.0 - calibrated_confidence, 3)

        return {
            'confidence_score': calibrated_confidence,
            'uncertainty_score': epistemic_uncertainty,
            'dimension_std_dev': round(score_std, 3),
            'action_density_factor': round(telemetry_bonus, 3)
        }


class AnomalyDetector:
    """Identifies telemetry anomalies, rapid bursts, and integrity violations."""

    @staticmethod
    def detect_anomalies(
        action_count: int,
        duration_seconds: float,
        overall_score: float,
        dimension_scores: Dict[str, float]
    ) -> List[Dict[str, Any]]:
        anomalies = []

        # 1. Instant Submission Anomaly
        if duration_seconds < 3.0 and overall_score > 0.70:
            anomalies.append({
                'code': 'INSTANT_SUBMISSION',
                'severity': 'high',
                'description': f'Deliverable submitted in {duration_seconds:.1f}s with high score ({overall_score:.2f}). Potential unobservable external copy-paste.'
            })

        # 2. Telemetry Silence Anomaly
        if action_count == 0 and overall_score > 0.75:
            anomalies.append({
                'code': 'TELEMETRY_SILENCE',
                'severity': 'medium',
                'description': 'Zero interaction events logged prior to final submission.'
            })

        # 3. Severe Dimension Discrepancy
        correctness = dimension_scores.get('correctness', 0.5)
        constraints = dimension_scores.get('constraint_handling', 0.5)
        if correctness > 0.90 and constraints < 0.20:
            anomalies.append({
                'code': 'CONSTRAINT_BYPASS_DISCREPANCY',
                'severity': 'medium',
                'description': 'Deliverable passed baseline correctness but completely bypassed operational constraints.'
            })

        return anomalies


class ProvenanceHasher:
    """Generates immutable cryptographic SHA-256 fingerprint for submission bundle."""

    @staticmethod
    def compute_hash(
        session_id: str,
        task_id: str,
        user_id: str,
        candidate_work: Any,
        timestamp: str
    ) -> str:
        payload = {
            'session_id': session_id,
            'task_id': task_id,
            'user_id': user_id,
            'candidate_work': candidate_work,
            'timestamp': timestamp
        }
        canonical_json = json.dumps(payload, sort_keys=True, separators=(',', ':'))
        return hashlib.sha256(canonical_json.encode('utf-8')).hexdigest()
