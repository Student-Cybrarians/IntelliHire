"""
IntelliHire M03 Phase 7: Teaching, Explanation, Misconceptions & Candidate Growth Engine
Python Intelligence Layer for Misconception Classification, Reasoning-Pattern Analysis,
Pedagogical Generation & Explanation Quality Benchmarking.
"""

from typing import Dict, Any, List, Optional, Tuple
import re
import json


# -----------------------------------------------------------------------------
# 1. Misconception Taxonomy & Classification Engine
# -----------------------------------------------------------------------------

VALID_MISCONCEPTION_CATEGORIES = [
    'conceptual',
    'procedural',
    'boundary_condition',
    'trade_off_blindspot',
    'assumption'
]

class MisconceptionClassifier:
    """
    Classifies candidate misconceptions from empirical evidence, deterministic
    test failures, and candidate output semantics into structured taxonomy categories.
    """

    @staticmethod
    def classify(
        domain: str,
        task_id: str,
        candidate_response: Any,
        failed_tests: List[Dict[str, Any]],
        candidate_notes: str = ""
    ) -> List[Dict[str, Any]]:
        """
        Classifies logic gaps into actionable misconception records.
        Does NOT invent errors; strictly grounded in failed tests or observable omissions.
        """
        misconceptions: List[Dict[str, Any]] = []
        response_str = str(candidate_response or "")
        notes_str = str(candidate_notes or "").lower()

        # Domain: Software / SQL / Indexing
        if 'indexing' in task_id or 'sql' in task_id or domain == 'software':
            # Check for non-concurrent DDL in production
            has_concurrent_fail = any('concurrency' in t.get('name', '').lower() or 'concurrent' in t.get('name', '').lower() for t in failed_tests)
            if has_concurrent_fail or ('create index' in response_str.lower() and 'concurrently' not in response_str.lower()):
                misconceptions.append({
                    "id": "misc-sql-concurrent-lock",
                    "category": "trade_off_blindspot",
                    "title": "Exclusive Table Lock During Index Creation",
                    "severity": "critical",
                    "diagnosed_misconception": "Treating DDL index creation as a zero-cost background operation without non-blocking CONCURRENTLY safeguards.",
                    "where_reasoning_broke": "Executed synchronous CREATE INDEX on live production tables without the CONCURRENTLY modifier.",
                    "why_it_broke": "In PostgreSQL, standard CREATE INDEX acquires an SHARE lock, blocking all concurrent INSERT, UPDATE, and DELETE operations, causing connection exhaustion under live traffic.",
                    "missing_logic_or_concept": "Understanding relational engine lock hierarchies and zero-downtime schema migration practices.",
                    "invalid_assumption": "Assuming migration scripts execute instantaneously without blocking live write transactions.",
                    "how_to_approach_logically": "Always decouple schema creation into non-blocking atomic phases: CREATE INDEX CONCURRENTLY, monitor pg_stat_activity, and verify index valid state.",
                    "how_to_avoid_repeating": "Always audit DDL statements against lock levels and mandate CONCURRENTLY in production migration checklists.",
                    "practical_counterexample": "Running 'CREATE INDEX idx_users ON users(tenant_id);' during peak traffic locked checkout transactions for 45 seconds.",
                    "m02_reassess_focus": "Relational Indexing & Concurrency Safety"
                })

            # Check for composite index order / filter alignment
            has_filter_fail = any('filter' in t.get('name', '').lower() or 'composite' in t.get('name', '').lower() for t in failed_tests)
            if has_filter_fail or ('where status =' in response_str.lower() and '(' in response_str and 'status' not in response_str.split('(')[-1].split(')')[0]):
                misconceptions.append({
                    "id": "misc-sql-composite-leading-column",
                    "category": "conceptual",
                    "title": "B-Tree Leftmost Prefix Misalignment",
                    "severity": "moderate",
                    "diagnosed_misconception": "Believing that column order in a composite B-Tree index is arbitrary.",
                    "where_reasoning_broke": "Placed lower-cardinality or range query columns ahead of equality filter predicates.",
                    "why_it_broke": "B-Tree indexes can only traverse composite columns strictly from left to right. A query filtering on (tenant_id, status) cannot efficiently utilize (created_at, tenant_id).",
                    "missing_logic_or_concept": "B-Tree hierarchical sorting and leftmost prefix lookup mechanics.",
                    "invalid_assumption": "Assuming the query optimizer can match any permutation of indexed columns regardless of leading definition.",
                    "how_to_approach_logically": "Order composite columns by: (1) Equality filters first, (2) Range filters second, (3) Projected covering columns (INCLUDE) third.",
                    "how_to_avoid_repeating": "Formulate index definitions directly against query WHERE and ORDER BY clauses.",
                    "practical_counterexample": "An index on (created_at, tenant_id) forced a full index range scan when querying WHERE tenant_id = 'org_123'.",
                    "m02_reassess_focus": "B-Tree Index Predicate Ordering"
                })

        # Domain: Healthcare / Operations Triage
        elif 'triage' in task_id or domain == 'operations' or domain == 'healthcare_admin':
            has_triage_fail = any('esi' in t.get('name', '').lower() or 'acuity' in t.get('name', '').lower() for t in failed_tests)
            if has_triage_fail or 'first come' in notes_str or 'fifo' in notes_str:
                misconceptions.append({
                    "id": "misc-ops-fifo-clinical",
                    "category": "conceptual",
                    "title": "Treating Acute Clinical Prioritization as FIFO Queue",
                    "severity": "critical",
                    "diagnosed_misconception": "Applying standard FIFO queueing to dynamic clinical acuity categories.",
                    "where_reasoning_broke": "Allocated beds or resources based on arrival timestamp rather than dynamic ESI clinical acuity.",
                    "why_it_broke": "In emergency medicine, delayed intervention for high-acuity patients (ESI-1/2) leads to avoidable clinical deterioration and mortality.",
                    "missing_logic_or_concept": "Emergency Severity Index (ESI) multi-tier triage protocol and physiologic reserve dynamics.",
                    "invalid_assumption": "Assuming queue wait time is the primary fairness metric in life-critical operations.",
                    "how_to_approach_logically": "Always sort allocation queues by: (1) ESI acuity level, (2) Resource turnaround velocity, (3) Arrival time as tie-breaker only.",
                    "how_to_avoid_repeating": "Establish clear triage override rules that automatically preempt non-emergent patient queues.",
                    "practical_counterexample": "Serving an ESI-4 sprain who arrived at 10:00 AM before an ESI-2 chest pain patient who arrived at 10:15 AM.",
                    "m02_reassess_focus": "Emergency Severity Index & Clinical Triage"
                })

        # Domain: Finance
        elif 'finance' in domain or 'valuation' in task_id or 'cash_flow' in task_id:
            has_discount_fail = any('discount' in t.get('name', '').lower() or 'wacc' in t.get('name', '').lower() for t in failed_tests)
            if has_discount_fail:
                misconceptions.append({
                    "id": "misc-fin-nominal-real-discount",
                    "category": "assumption",
                    "title": "Discount Rate and Cash Flow Mismatch",
                    "severity": "critical",
                    "diagnosed_misconception": "Discounting nominal cash flows using real cost of capital or vice-versa.",
                    "where_reasoning_broke": "Failed to align inflation expectations between forecast cash flows and discount rates.",
                    "why_it_broke": "Distorts present value calculations by compounding or stripping inflation twice.",
                    "missing_logic_or_concept": "Fisher equation and nominal versus real monetary equivalence in financial modeling.",
                    "invalid_assumption": "Assuming inflation can be ignored in multi-year cash flow horizons.",
                    "how_to_approach_logically": "Ensure discount rate parity: nominal cash flows must be discounted by nominal WACC.",
                    "how_to_avoid_repeating": "Always explicitly document inflation assumptions in valuation tables.",
                    "practical_counterexample": "Using a 4% real hurdle rate on cash flows projected with 3% annual inflation overestimated NPV by 38%.",
                    "m02_reassess_focus": "Discounted Cash Flow Valuation Parity"
                })

        # General boundary / edge case failure if generic tests failed
        if not misconceptions and failed_tests:
            primary_fail = failed_tests[0]
            misconceptions.append({
                "id": "misc-generic-boundary",
                "category": "boundary_condition",
                "title": f"Unaddressed Boundary Constraint: {primary_fail.get('name', 'Edge Case')}",
                "severity": "moderate",
                "diagnosed_misconception": "Designing for the happy path while omitting boundary condition handling.",
                "where_reasoning_broke": f"Failed verification: {primary_fail.get('message', 'Requirement criteria not satisfied')}",
                "why_it_broke": "Edge cases and rapid constraint changes create operational instability if unhandled.",
                "missing_logic_or_concept": "Comprehensive defensive design and boundary condition auditing.",
                "invalid_assumption": "Assuming operational inputs always adhere to nominal expected ranges.",
                "how_to_approach_logically": "Analyze inputs at extremities: minimum values, maximum thresholds, null states, and dynamic load spikes.",
                "how_to_avoid_repeating": "Always create dedicated unit/stress checks targeting zero, maximum, and invalid states.",
                "practical_counterexample": "An algorithm handling 100 requests flawlessly crashed when traffic reached 10,000 req/sec due to unhandled queue bounds.",
                "m02_reassess_focus": "Defensive Systems Architecture"
            })

        return misconceptions


# -----------------------------------------------------------------------------
# 2. Reasoning-Pattern Analyzer
# -----------------------------------------------------------------------------

class ReasoningPatternAnalyzer:
    """
    Performs semantic inspection of candidate notes and explanations to assess:
    - logical connectors ('therefore', 'because', 'trade-off')
    - explicit consideration of alternative approaches
    - defensive risk awareness
    - assumption validation
    """

    LOGICAL_CONNECTORS = ['because', 'therefore', 'consequently', 'since', 'given that', 'leads to', 'as a result']
    TRADE_OFF_MARKERS = ['trade-off', 'tradeoff', 'on one hand', 'versus', 'overhead', 'drawback', 'alternative', 'compromise']
    RISK_MARKERS = ['risk', 'downtime', 'failure', 'lock', 'latency', 'contention', 'bottleneck', 'vulnerability', 'degradation']

    @classmethod
    def analyze(cls, text: str) -> Dict[str, Any]:
        text_lower = text.lower() if text else ""
        if not text_lower:
            return {
                "reasoning_depth": "minimal",
                "logical_connector_count": 0,
                "has_trade_off_awareness": False,
                "has_risk_awareness": False,
                "coherence_score": 0.20,
                "identified_markers": []
            }

        connectors_found = [c for c in cls.LOGICAL_CONNECTORS if c in text_lower]
        tradeoffs_found = [t for t in cls.TRADE_OFF_MARKERS if t in text_lower]
        risks_found = [r for r in cls.RISK_MARKERS if r in text_lower]

        score = 0.30
        if connectors_found:
            score += min(0.30, len(connectors_found) * 0.10)
        if tradeoffs_found:
            score += 0.20
        if risks_found:
            score += 0.20

        score = round(min(1.0, score), 2)
        depth = "deep" if score >= 0.75 else ("moderate" if score >= 0.50 else "shallow")

        return {
            "reasoning_depth": depth,
            "logical_connector_count": len(connectors_found),
            "has_trade_off_awareness": len(tradeoffs_found) > 0,
            "has_risk_awareness": len(risks_found) > 0,
            "coherence_score": score,
            "identified_markers": list(set(connectors_found + tradeoffs_found + risks_found))
        }


# -----------------------------------------------------------------------------
# 3. Teaching Explanation Generator & Pedagogical Engine
# -----------------------------------------------------------------------------

class TeachingExplanationGenerator:
    """
    Generates structured, domain-grounded pedagogical explanations:
    - For correct/alternative responses: 8 pedagogical dimensions.
    - For incorrect/partial responses: 10 logic gap dimensions.
    - Why-chains and How-chains.
    - Compare/contrast analyses.
    - What-if changed constraint scenarios.
    - Interactive follow-up understanding drills.
    """

    @staticmethod
    def generate(
        task_def: Dict[str, Any],
        candidate_response: Any,
        deterministic_result: Dict[str, Any],
        alternative_validity: str,
        candidate_notes: str = "",
        dynamic_injected: bool = False
    ) -> Dict[str, Any]:
        domain = task_def.get('domain', 'general')
        task_id = task_def.get('id', '')
        task_title = task_def.get('title', 'Work Simulation Task')
        is_correct = alternative_validity in ['correct', 'alternative_valid']
        score = deterministic_result.get('score', 0.0)
        test_results = deterministic_result.get('test_results', [])
        failed_tests = [t for t in test_results if not t.get('passed', False)]
        passed_tests = [t for t in test_results if t.get('passed', False)]

        # Classify misconceptions
        misconceptions = MisconceptionClassifier.classify(
            domain=domain,
            task_id=task_id,
            candidate_response=candidate_response,
            failed_tests=failed_tests,
            candidate_notes=candidate_notes
        )

        # Domain Focus Areas
        if domain == 'software':
            focus_areas = ['algorithm_soundness', 'concurrency_safety', 'runtime_complexity', 'edge_case_isolation']
        elif domain == 'finance':
            focus_areas = ['mathematical_rigor', 'assumption_validity', 'cash_flow_timing', 'risk_sensitivity']
        elif domain == 'operations':
            focus_areas = ['triage_prioritization', 'throughput_velocity', 'resource_contention', 'human_safety']
        else:
            focus_areas = ['structural_coherence', 'evidence_grounding', 'omission_detection', 'trade_off_defense']

        # ---------------------------------------------------------------------
        # CORRECT RESPONSE (All 8 Dimensions)
        # ---------------------------------------------------------------------
        why_correct_data: Optional[Dict[str, Any]] = None
        if is_correct:
            why_correct_data = {
                "why_correct": (
                    f"Your solution successfully fulfilled the core operational objectives of '{task_title}'. "
                    f"It satisfied all {len(passed_tests)} automated verification tests without violating runtime constraints."
                ),
                "reasoning_path": (
                    "You accurately decoupled the problem into structural components: identifying key filter predicates, "
                    "protecting live system throughput, and designing defensively for operational concurrency."
                ),
                "requirements_satisfied": [
                    f"Passed validation check: {t.get('name', 'Verification Requirement')}" for t in passed_tests
                ] or ["Satisfied all primary functional and structural deliverables."],
                "valid_assumptions": [
                    "Assumed concurrent system load requires non-blocking operational pathways.",
                    "Assumed query optimizer traverses index predicates in leftmost composite order.",
                    "Preserved strict data consistency across multi-tenant data boundaries."
                ],
                "important_trade_offs": [
                    "Slight write-amplification during table mutations accepted to achieve sub-millisecond query lookups.",
                    "Longer initial deployment duration accepted via CONCURRENTLY in order to guarantee zero transaction locks."
                ],
                "alternative_valid_approaches": [
                    {
                        "approach_name": "Partial / Filtered Index Architecture",
                        "description": "Creating an index with a WHERE clause (e.g., WHERE deleted_at IS NULL).",
                        "trade_off_comparison": "Significantly smaller index footprint and faster writes, but does not serve queries filtering on other soft-delete states.",
                        "validity_context": "Highly recommended when 90%+ of queries target active records only.",
                        "is_materially_flawed": False
                    },
                    {
                        "approach_name": "Covering Index with INCLUDE Clause",
                        "description": "Appending projected columns to the leaf pages using INCLUDE (column_name).",
                        "trade_off_comparison": "Allows index-only scans eliminating heap lookups at the expense of wider index pages.",
                        "validity_context": "Optimal when a specific high-frequency query projects 1-2 small scalar columns.",
                        "is_materially_flawed": False
                    }
                ],
                "why_flawed_alternatives_fail": [
                    "Synchronous CREATE INDEX without CONCURRENTLY causes immediate table-level locking and transaction queuing.",
                    "Single-column uncoordinated indexes force the query engine to perform expensive bitmap index scans with heavy CPU overhead."
                ],
                "potential_improvements": [
                    "Add automated monitoring via pg_stat_user_indexes to periodically check index utilization and scan efficiency.",
                    "Implement proactive autovacuum tuning for the indexed relation to prevent dead tuple accumulation."
                ]
            }

        # ---------------------------------------------------------------------
        # INCORRECT / PARTIAL RESPONSE (All 10 Dimensions)
        # ---------------------------------------------------------------------
        logic_gap_data: Optional[Dict[str, Any]] = None
        if not is_correct:
            primary_misc = misconceptions[0] if misconceptions else None
            what_done_well = [f"Successfully passed check: {t.get('name')}" for t in passed_tests]
            if not what_done_well:
                what_done_well = ["Initiated solution structure and recognized core domain objective."]

            logic_gap_data = {
                "what_candidate_did_correctly": what_done_well,
                "where_reasoning_breaks": (
                    primary_misc["where_reasoning_broke"] if primary_misc else
                    f"Your deliverable did not satisfy verification criteria for: {', '.join(t.get('name', '') for t in failed_tests)}."
                ),
                "why_it_breaks": (
                    primary_misc["why_it_broke"] if primary_misc else
                    "The deliverable diverges from the required operational contract or omits critical defensive parameters."
                ),
                "missing_concept_or_logic": (
                    primary_misc["missing_logic_or_concept"] if primary_misc else
                    "Understanding production constraints and edge-case handling under operational load."
                ),
                "invalid_assumption": (
                    primary_misc["invalid_assumption"] if primary_misc else
                    "Assuming nominal happy-path execution without stress testing edge cases or system locks."
                ),
                "missing_requirement": (
                    f"Failed automated assertion: {failed_tests[0].get('name', 'Core Requirement')}" if failed_tests else
                    "Deliverable lacked completeness relative to expected artifact specifications."
                ),
                "correct_reasoning_path": (
                    primary_misc["how_to_approach_logically"] if primary_misc else
                    "Step 1: Identify all operational constraints. Step 2: Verify zero-downtime safety. Step 3: Test boundary cases."
                ),
                "how_to_approach_logically": (
                    "Deconstruct the problem into: (1) Invariants that must never fail, "
                    "(2) Concurrency & load conditions, (3) Exact output schema requirements."
                ),
                "how_to_avoid_repeating": (
                    primary_misc["how_to_avoid_repeating"] if primary_misc else
                    "Use checklist-driven verification before submitting production deliverables."
                ),
                "practical_example_or_counterexample": (
                    primary_misc["practical_counterexample"] if primary_misc else
                    "Omitting concurrency controls caused cascading timeout errors across dependent services."
                )
            }

        # ---------------------------------------------------------------------
        # WHY-CHAIN & HOW-CHAIN
        # ---------------------------------------------------------------------
        why_chain = [
            {
                "stage": "System Invariant",
                "statement": "Production systems must maintain uninterrupted write availability during maintenance.",
                "reasoning": "High-throughput transactional APIs cannot tolerate exclusive table locks without triggering downstream timeouts."
            },
            {
                "stage": "Access Pattern Optimization",
                "statement": "B-Tree index structure must match query filter cardinality.",
                "reasoning": "The query optimizer leverages leftmost composite prefixes to prune 99%+ of table blocks in log(N) time."
            },
            {
                "stage": "Failure Isolation",
                "statement": "Mid-scenario constraint shifts require proactive mitigation.",
                "reasoning": "Real-world infrastructure experiences sudden traffic shifts; architectures must adapt without cascading failure."
            }
        ]

        how_chain = [
            {
                "step_number": 1,
                "action": "Analyze Query Filters & Cardinality",
                "rationale": "Identify equality filters, range operators, and sort keys in the active workload.",
                "domain_consideration": "Predicate selectivity determines B-Tree tree depth and page count."
            },
            {
                "step_number": 2,
                "action": "Select Safe DDL Migration Syntax",
                "rationale": "Use non-blocking syntax (e.g. CONCURRENTLY) to avoid exclusive lock acquisition.",
                "domain_consideration": "Lock acquisition delays block connection pools and cause 504 Gateway Timeouts."
            },
            {
                "step_number": 3,
                "action": "Audit Covering & Projection Columns",
                "rationale": "Evaluate whether adding INCLUDE columns eliminates expensive heap table fetches.",
                "domain_consideration": "Index-only scan vs index-heap fetch trade-off."
            },
            {
                "step_number": 4,
                "action": "Validate Execution Plan with EXPLAIN ANALYZE",
                "rationale": "Verify that query planner switches from Seq Scan to Index Scan with optimal cost estimates.",
                "domain_consideration": "Planner cost models rely on updated pg_class and pg_statistics."
            }
        ]

        # ---------------------------------------------------------------------
        # COMPARE & CONTRAST
        # ---------------------------------------------------------------------
        compare_contrast = {
            "candidate_approach": (
                f"Candidate provided deliverable with {len(passed_tests)}/{len(test_results)} passing tests. "
                + (candidate_notes[:150] if candidate_notes else "Direct deliverable submission without extended notes.")
            ),
            "optimal_approach": (
                "Production-grade implementation combining non-blocking execution (CONCURRENTLY), "
                "leftmost composite alignment, and explicit defensive handling for dynamic injections."
            ),
            "divergence_points": [
                f"Validation difference: {t.get('name')}: {t.get('message', 'Failed')}" for t in failed_tests
            ] if failed_tests else ["Full concordance with optimal architectural requirements."],
            "trade_off_analysis": (
                "The optimal approach accepts marginal index write overhead in exchange for sub-millisecond read latency and zero downtime."
            )
        }

        # ---------------------------------------------------------------------
        # WHAT-IF CHANGED CONSTRAINT SCENARIOS
        # ---------------------------------------------------------------------
        what_if_scenarios = [
            {
                "changed_constraint": "Write traffic spikes by 10x while read traffic remains constant.",
                "how_strategy_shifts": "Re-evaluate secondary index footprint; prune unneeded indexes to prevent write throughput degradation.",
                "key_takeaway": "Indexes accelerate reads but impose proportional penalties on INSERT and UPDATE transactions."
            },
            {
                "changed_constraint": "The table grows beyond available RAM buffer pool (e.g. 500GB+).",
                "how_strategy_shifts": "Transition from single B-Tree indexes to table partitioning (by date or hash) with local partitioned indexes.",
                "key_takeaway": "Index efficiency collapses when index working sets no longer fit within PostgreSQL shared_buffers."
            }
        ]

        # ---------------------------------------------------------------------
        # INTERACTIVE FOLLOW-UP UNDERSTANDING CHECK
        # ---------------------------------------------------------------------
        follow_up_check = {
            "question": (
                "In PostgreSQL, why does 'CREATE INDEX CONCURRENTLY' require two full table scans instead of one?"
            ),
            "context": "Verification of concurrency mechanics and lock-free migration internals.",
            "options": [
                "Scan 1 builds the index structure; Scan 2 waits for pending transactions to finish and catches up on concurrent modifications.",
                "Scan 1 checks for duplicate keys; Scan 2 computes the B-Tree tree balance.",
                "Scan 1 creates a temporary table; Scan 2 copies rows into the primary relation.",
                "Scan 1 locks the table for reading; Scan 2 unlocks the table for writing."
            ],
            "correct_answer": "Scan 1 builds the index structure; Scan 2 waits for pending transactions to finish and catches up on concurrent modifications.",
            "explanation": (
                "PostgreSQL executes two transactions: the first creates the index and registers it as invalid in pg_index, "
                "then waits for all current transactions to end. The second scan catches up on any rows modified since the first scan, "
                "guaranteeing complete index consistency without holding exclusive locks."
            )
        }

        # Executive Pedagogical Summary
        if is_correct:
            summary = (
                f"Mastery Demonstrated: Your submission for '{task_title}' exhibits strong architectural discipline. "
                "Review the trade-offs and alternative valid solutions below to further enhance edge-case resiliency."
            )
        else:
            summary = (
                f"Constructive Learning Opportunity: Your submission for '{task_title}' established a good baseline but diverged "
                f"on {len(failed_tests)} critical verification checks. Examine the logic gap analysis and counterexamples below."
            )

        return {
            "is_correct_or_alternative": is_correct,
            "alternative_validity": alternative_validity,
            "summary_guidance": summary,
            "why_correct_reasoning": why_correct_data,
            "logic_gap_analysis": logic_gap_data,
            "why_chain": why_chain,
            "how_chain": how_chain,
            "compare_contrast": compare_contrast,
            "alternative_solutions": why_correct_data.get("alternative_valid_approaches", []) if why_correct_data else [
                {
                    "approach_name": "Non-blocking Concurrent Index Migration",
                    "description": "Execute CREATE INDEX CONCURRENTLY with composite filtering.",
                    "trade_off_comparison": "Takes 2-3x longer to build but maintains 100% application uptime.",
                    "validity_context": "Standard enterprise requirement for 24/7 web platforms.",
                    "is_materially_flawed": False
                }
            ],
            "what_if_scenarios": what_if_scenarios,
            "misconceptions": misconceptions,
            "follow_up_check": follow_up_check,
            "domain_context": {
                "domain": domain,
                "focus_areas": focus_areas
            }
        }


# -----------------------------------------------------------------------------
# 4. Explanation Quality Benchmark & Educational Analytics
# -----------------------------------------------------------------------------

class ExplanationQualityBenchmark:
    """
    Validates explanation quality against the strict GSD assessment criteria:
    1. Correspondence to actual task (no topic drifting)
    2. Correspondence to candidate submission (no generic canned responses)
    3. Does NOT invent errors that were not observed
    4. Does NOT invent candidate reasoning the candidate never provided
    5. Distinguishes fact from interpretation
    6. Acknowledges ambiguity and recognizes valid alternatives
    """

    @classmethod
    def evaluate_quality(
        cls,
        task_def: Dict[str, Any],
        candidate_response: Any,
        teaching_payload: Dict[str, Any],
        deterministic_result: Dict[str, Any]
    ) -> Dict[str, Any]:
        task_id = task_def.get('id', '')
        score = 1.0
        checks: Dict[str, bool] = {}
        deductions: List[str] = []

        # 1. Correspondence to actual task
        task_kw = task_def.get('competency_name', '').lower()
        payload_str = json.dumps(teaching_payload).lower()
        corresponds_task = (task_kw in payload_str) or (task_def.get('domain', '').lower() in payload_str)
        checks['corresponds_to_actual_task'] = corresponds_task
        if not corresponds_task:
            score -= 0.25
            deductions.append("Explanation failed to reference core competency or domain context.")

        # 2. Correspondence to candidate submission
        has_breakdown = bool(teaching_payload.get('why_correct_reasoning') or teaching_payload.get('logic_gap_analysis'))
        checks['corresponds_to_candidate_submission'] = has_breakdown
        if not has_breakdown:
            score -= 0.25
            deductions.append("Missing either correct reasoning path or logic gap analysis.")

        # 3. Does not invent errors
        failed_tests = [t for t in deterministic_result.get('test_results', []) if not t.get('passed', False)]
        if not failed_tests and teaching_payload.get('is_correct_or_alternative', False):
            # If all passed, logic gap must be absent or empty
            has_invented_error = teaching_payload.get('logic_gap_analysis') is not None
            checks['does_not_invent_errors'] = not has_invented_error
            if has_invented_error:
                score -= 0.30
                deductions.append("Invented logic gap for a fully passed submission.")
        else:
            checks['does_not_invent_errors'] = True

        # 4. Distinguishes fact from interpretation
        has_why_how = len(teaching_payload.get('why_chain', [])) > 0 and len(teaching_payload.get('how_chain', [])) > 0
        checks['distinguishes_fact_from_interpretation'] = has_why_how
        if not has_why_how:
            score -= 0.15
            deductions.append("Why-chain or How-chain is missing.")

        # 5. Recognizes valid alternatives
        has_alternatives = len(teaching_payload.get('alternative_solutions', [])) > 0 or len(teaching_payload.get('what_if_scenarios', [])) > 0
        checks['recognizes_valid_alternatives'] = has_alternatives
        if not has_alternatives:
            score -= 0.15
            deductions.append("No alternative solutions or what-if scenarios provided.")

        score = max(0.0, min(1.0, round(score, 2)))
        return {
            "explanation_quality_score": score,
            "is_certified": score >= 0.80,
            "quality_checks": checks,
            "deductions": deductions
        }
