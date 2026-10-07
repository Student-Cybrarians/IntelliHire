"""
Representative Evaluation Fixtures for M03 AI/ML Assessment Engine.
Provides diverse, reproducible benchmarks across coding, data, finance,
operations, and professional writing with edge cases:
- correct
- partially_correct
- incomplete
- context_dependent
- alternative_valid
- incorrect
- insufficient_information
- provider_failure
"""

from typing import Dict, Any, List

EVALUATION_FIXTURES: Dict[str, Dict[str, Any]] = {
    # 1. Coding: Correct Token Bucket
    "coding_rate_limiter_correct": {
        "discipline": "software",
        "task_id": "sim-tech-rate-limiter",
        "expected_validity": "correct",
        "deliverable": {
            "code": """
class TokenBucketRateLimiter:
    def __init__(self, capacity: int, refill_rate_per_sec: float):
        import time
        self.capacity = float(capacity)
        self.tokens = float(capacity)
        self.refill_rate = float(refill_rate_per_sec)
        self.last_refill = time.time()

    def allow_request(self, tokens_required: int = 1) -> bool:
        import time
        now = time.time()
        elapsed = now - self.last_refill
        self.tokens = min(self.capacity, self.tokens + elapsed * self.refill_rate)
        self.last_refill = now
        if self.tokens >= tokens_required:
            self.tokens -= tokens_required
            return True
        return False
""",
            "tests_run": 3,
            "tests_passed": 3
        },
        "notes": "Implemented standard token bucket with time-delta refill. Verified thread-safety and burst absorption.",
        "telemetry_action_count": 6,
        "handled_dynamic_shift": True
    },

    # 2. Coding: Alternative Valid (Sliding Log / Leaky Bucket)
    "coding_rate_limiter_alternative_valid": {
        "discipline": "software",
        "task_id": "sim-tech-rate-limiter",
        "expected_validity": "alternative_valid",
        "deliverable": {
            "code": """
import collections
import time

class SlidingLogRateLimiter:
    '''Alternative implementation: Sliding log counter for strict window accuracy.'''
    def __init__(self, max_requests: int, window_seconds: float):
        self.max_requests = max_requests
        self.window_seconds = window_seconds
        self.log = collections.deque()

    def allow_request(self) -> bool:
        now = time.time()
        cutoff = now - self.window_seconds
        while self.log and self.log[0] <= cutoff:
            self.log.popleft()
        if len(self.log) < self.max_requests:
            self.log.append(now)
            return True
        return False
""",
            "tests_run": 3,
            "tests_passed": 3
        },
        "notes": "Chose sliding window log over classic token bucket to eliminate edge-of-window burst vulnerabilities. Accepts slight memory overhead for absolute rate precision.",
        "telemetry_action_count": 7,
        "handled_dynamic_shift": True
    },

    # 3. Coding: Partially Correct (Passes basic, fails concurrency/burst)
    "coding_rate_limiter_partially_correct": {
        "discipline": "software",
        "task_id": "sim-tech-rate-limiter",
        "expected_validity": "partially_correct",
        "deliverable": {
            "code": """
class FixedWindowLimiter:
    def __init__(self, limit: int):
        self.limit = limit
        self.count = 0

    def allow_request(self) -> bool:
        if self.count < self.limit:
            self.count += 1
            return True
        return False
""",
            "tests_run": 3,
            "tests_passed": 1
        },
        "notes": "Simple fixed counter. Did not have enough time to add sliding reset or token refill logic.",
        "telemetry_action_count": 3,
        "handled_dynamic_shift": False
    },

    # 4. Coding: Incorrect (Broken logic / infinite tokens)
    "coding_rate_limiter_incorrect": {
        "discipline": "software",
        "task_id": "sim-tech-rate-limiter",
        "expected_validity": "incorrect",
        "deliverable": {
            "code": """
class BrokenLimiter:
    def allow_request(self) -> bool:
        return True # Always allow
""",
            "tests_run": 3,
            "tests_passed": 0
        },
        "notes": "Struggled with the time calculation.",
        "telemetry_action_count": 2,
        "handled_dynamic_shift": False
    },

    # 5. SQL / Database: Correct PostgreSQL Index & Explain Plan Tuning
    "sql_postgres_index_correct": {
        "discipline": "software",
        "task_id": "sim-postgres-index-optimization",
        "expected_validity": "correct",
        "deliverable": {
            "sql": """
-- Step 1: Create non-blocking composite index
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_audit_tenant_created 
ON candidate_audit_event (tenant_id, created_at DESC) 
INCLUDE (user_id, event_type);

-- Step 2: Optimized query leveraging index-only scan
SELECT user_id, event_type, created_at 
FROM candidate_audit_event 
WHERE tenant_id = $1 AND created_at >= $2 
ORDER BY created_at DESC 
LIMIT 50;
""",
            "execution_plan_improvement": "98% cost reduction; Bitmap Heap Scan replaced with Index Only Scan",
            "disk_footprint_pct": 14.2
        },
        "notes": "Used CONCURRENTLY to avoid table locking on 40M rows. Added INCLUDE clause to achieve pure index-only scan without touching heap pages.",
        "telemetry_action_count": 5,
        "handled_dynamic_shift": True
    },

    # 6. Finance: Correct CapEx & Portfolio Allocation
    "financial_capex_correct": {
        "discipline": "finance",
        "task_id": "sim-finance-capex-allocation",
        "expected_validity": "correct",
        "deliverable": {
            "calculations": {
                "Project Alpha": {"npv": 4.25, "irr": 0.182, "cost": 8.0},
                "Project Beta": {"npv": 3.10, "irr": 0.165, "cost": 6.0},
                "Project Gamma": {"npv": 1.40, "irr": 0.120, "cost": 4.0}
            },
            "recommended_allocation": ["Project Alpha ($8M)", "Project Beta ($6M)"],
            "total_capex": 14.0,
            "remaining_cash": 1.0,
            "wacc": 0.085,
            "memo": "Executive Memo: Recommending Alpha + Beta totaling $14.0M within the $15M envelope. Combined portfolio NPV is $7.35M with average IRR of 17.5% exceeding 8.5% WACC hurdle."
        },
        "notes": "Alpha + Beta strictly maximizes total NPV ($7.35M) while staying under $15M constraint. Alpha + Gamma ($12M) yields only $5.65M NPV. Beta + Gamma ($10M) yields $4.50M NPV.",
        "telemetry_action_count": 8,
        "handled_dynamic_shift": True
    },

    # 7. Finance: Alternative Valid (Mezzanine Debt Funded Allocation)
    "financial_capex_alternative_valid": {
        "discipline": "finance",
        "task_id": "sim-finance-capex-allocation",
        "expected_validity": "alternative_valid",
        "deliverable": {
            "calculations": {
                "Project Alpha": {"npv": 4.25, "irr": 0.182, "cost": 8.0},
                "Project Beta": {"npv": 3.10, "irr": 0.165, "cost": 6.0},
                "Project Gamma": {"npv": 1.40, "irr": 0.120, "cost": 4.0}
            },
            "recommended_allocation": ["Project Alpha ($8M)", "Project Beta ($6M)", "Project Gamma ($4M)"],
            "total_capex": 18.0,
            "financing_strategy": "Fund $15M from primary envelope + $3M equipment lease / green bond financing for Gamma",
            "memo": "Strategic Allocation Proposal: Alpha and Beta funded via primary envelope. Gamma secured via dedicated 4.5% subsidized green bond. Total value created $8.75M NPV."
        },
        "notes": "Acknowledged $15M cash ceiling and proposed structured financing for the additional $3M, supported by rigorous debt-service coverage ratio calculations.",
        "telemetry_action_count": 9,
        "handled_dynamic_shift": True
    },

    # 8. Operations: Incorrect (Dangerous nurse-to-patient ratio violation)
    "operations_triage_incorrect": {
        "discipline": "operations",
        "task_id": "sim-ops-hospital-bed-triage",
        "expected_validity": "incorrect",
        "deliverable": {
            "assignments": [
                {"patient_id": "P-101 (Intubated ICU)", "nurse": "RN Elena Rostova (Med-Surg)"},
                {"patient_id": "P-105 (Acute Respiratory Distress)", "nurse": "RN Elena Rostova (Med-Surg)"},
                {"patient_id": "P-102 (Pediatric Trauma)", "nurse": "RN David Okafor (ICU)"}
            ],
            "overtime_hours": 24
        },
        "notes": "Assigned Med-Surg nurse to two intubated ICU patients to clear waiting room.",
        "telemetry_action_count": 3,
        "handled_dynamic_shift": False
    },

    # 9. Operations: Context-Dependent (Hazmat Crisis Holding Regime)
    "operations_triage_context_dependent": {
        "discipline": "operations",
        "task_id": "sim-ops-hospital-bed-triage",
        "expected_validity": "context_dependent",
        "deliverable": {
            "assignments": [
                {"patient_id": "P-101", "nurse": "RN Sarah Chen (ICU)", "unit": "ICU"},
                {"patient_id": "P-102", "nurse": "RN Marcus Rivera (ICU)", "unit": "Trauma Bay"},
                {"patient_id": "Hazmat-01", "nurse": "RN David Okafor (ICU)", "unit": "Decon Isolation"}
            ],
            "contingency_protocol": "Implemented Code Orange mass casualty triage holding. ESI-3 and stable telemetry patients held in ambulatory hallway pods under RN Priya Patel while Hazmat is contained."
        },
        "notes": "Under normal peacetime protocols this ratio would be non-standard, but under hazmat contamination lockdown, this is the safest triage protocol.",
        "telemetry_action_count": 7,
        "handled_dynamic_shift": True
    },

    # 10. Legal / Writing: Ambiguous / Partially Incomplete Memo
    "legal_memo_ambiguous": {
        "discipline": "general",
        "task_id": "sim-legal-vendor-sla-memo",
        "expected_validity": "context_dependent",
        "deliverable": {
            "memo_text": """
SUBJECT: Outage Notification
To CloudCore Management:
We experienced 14 hours of downtime. Under our agreement you owe us service credits.
Please fix this immediately or we will look at alternatives.
"""
        },
        "notes": "Sent brief notification.",
        "telemetry_action_count": 2,
        "handled_dynamic_shift": False
    },

    # 11. Data: Incomplete (Dropped corrupted rows without dead-letter queue)
    "data_pipeline_incomplete": {
        "discipline": "data",
        "task_id": "sim-data-pipeline-anomaly",
        "expected_validity": "incomplete",
        "deliverable": {
            "transformation_sql": """
SELECT event_id, user_id, amount_cents, timestamp
FROM raw_events
WHERE user_id IS NOT NULL AND status = 'valid';
"""
        },
        "notes": "Filtered out bad data.",
        "telemetry_action_count": 2,
        "handled_dynamic_shift": False
    },

    # 12. Insufficient Information: Blank or trivial submission
    "empty_insufficient_information": {
        "discipline": "general",
        "task_id": "sim-tech-rate-limiter",
        "expected_validity": "insufficient_information",
        "deliverable": {
            "code": "// TODO: implement rate limiter"
        },
        "notes": "",
        "telemetry_action_count": 0,
        "handled_dynamic_shift": False
    }
}
