"""
Task Synthesis and Archetype Generation Engine for M03 Universal Task Intelligence.
Dynamically instantiates parameterized technical and non-technical work tasks
based on candidate context, target competencies, diagnosed gaps, and seniority.
"""

from typing import Dict, Any, List, Optional
import uuid
from .taxonomy import TaskTaxonomy, TaskForm, CognitiveDimension, TaskFamily
from .seniority_scaler import SeniorityScaler
from .repetition_detector import RepetitionDetector
from .quality_evaluator import QualityEvaluator

class TaskSynthesizer:
    """Synthesizes structured work tasks adhering to the Core Model."""

    ARCHETYPES: List[Dict[str, Any]] = [
        # --- TECHNICAL ARCHETYPES ---
        {
            "id": "arch-tech-rate-limiter",
            "title": "Distributed Rate Limiter & Token Bucket Engine",
            "domain": "software",
            "modality": "coding",
            "task_form": TaskForm.PRACTICAL_EXECUTION,
            "task_family": TaskFamily.CODING,
            "competency": "Systems Architecture & Concurrency",
            "skill": "Concurrency & Distributed Systems",
            "scenario": {
                "background": "The API gateway at Apex Cloud experiences severe traffic spikes causing database exhaustion during promotional flash sales.",
                "objective": "Implement an in-memory sliding window or token-bucket rate limiter that throttles excess requests with sub-millisecond overhead.",
                "initial_requirements": [
                    "Implement acquire(key, cost) returning a boolean decision",
                    "Handle multi-threaded lock-free or atomic token replenishment",
                    "Guarantee zero clock drift starvation across concurrent bursts"
                ],
                "constraints": [
                    "Time complexity must be O(1) per token acquisition",
                    "Memory allocation must remain bounded under 1,000,000 unique keys"
                ],
                "expected_output_type": "working_code_test_suite"
            },
            "rubric_dimensions": [
                {"name": "correctness", "weight": 0.35, "description": "Accurate token replenishment", "criteria": "Passes all burst and concurrency stress test assertions."},
                {"name": "architecture", "weight": 0.35, "description": "Lock-free efficiency", "criteria": "Zero deadlock risk with minimal lock contention overhead."},
                {"name": "edge_cases", "weight": 0.30, "description": "Clock skew & high volume", "criteria": "Gracefully handles high cardinality and negative time intervals."}
            ]
        },
        {
            "id": "arch-tech-sql-optimization",
            "title": "PostgreSQL High-Volume Query Plan & Index Tuning",
            "domain": "data",
            "modality": "data_analysis",
            "task_form": TaskForm.ANALYSIS,
            "task_family": TaskFamily.SQL_DATA,
            "competency": "API Design & Relational Modeling",
            "skill": "Database Optimization & SQL Query Planning",
            "scenario": {
                "background": "A 500M row billing ledger table suffers from seq-scans during monthly invoice generation, degrading p99 query latency from 80ms to 4.2s.",
                "objective": "Diagnose the query execution plan, design partial composite indexes, and rewrite the query to utilize index-only scans without table locks.",
                "initial_requirements": [
                    "Identify filter predicates causing index suppression",
                    "Design a CONCURRENTLY created partial compound B-Tree or BRIN index",
                    "Rewrite the analytical window function query to eliminate temp disk spills"
                ],
                "constraints": [
                    "Total index disk size cannot exceed 15% of base table size",
                    "Query runtime must decrease below 150ms on warm cache"
                ],
                "expected_output_type": "sql_migration_and_plan_analysis"
            },
            "rubric_dimensions": [
                {"name": "analytical_rigor", "weight": 0.40, "description": "EXPLAIN ANALYZE diagnosis", "criteria": "Correctly pinpoints heap fetches, buffer misses, and sorts."},
                {"name": "indexing_strategy", "weight": 0.35, "description": "Composite/BRIN design", "criteria": "Optimal column ordering matching query sort and equality predicates."},
                {"name": "operational_safety", "weight": 0.25, "description": "Zero-downtime execution", "criteria": "Includes CONCURRENTLY modifiers and transaction timeouts."}
            ]
        },
        {
            "id": "arch-tech-cloud-failover",
            "title": "Cloudflare Workers & Edge Execution Failover Architecture",
            "domain": "software",
            "modality": "coding",
            "task_form": TaskForm.SYSTEM_DESIGN,
            "task_family": TaskFamily.CLOUD_INFRASTRUCTURE,
            "competency": "Cloud, Edge & Distributed Systems",
            "skill": "Cloudflare Workers & Edge Execution",
            "scenario": {
                "background": "A global edge worker proxies requests to primary and secondary origins. Origin outages cause HTTP 504 cascades across continents.",
                "objective": "Design and implement edge health checking, KV fallback caching, and circuit-breaking failover inside an isolated Cloudflare Worker.",
                "initial_requirements": [
                    "Implement active failover routing based on exponential origin health scores",
                    "Serve stale-while-revalidate cached KV payloads when all origins fail",
                    "Log structured telemetry and failure domain attribution"
                ],
                "constraints": [
                    "Execution memory must remain strictly below 128MB worker limit",
                    "Subrequest timeout must trigger within 1500ms to avoid edge timeout"
                ],
                "expected_output_type": "edge_worker_script_and_rfc"
            },
            "rubric_dimensions": [
                {"name": "resilience", "weight": 0.40, "description": "Circuit breaking & stale cache", "criteria": "Successfully absorbs origin downtime without throwing 5xx errors."},
                {"name": "edge_efficiency", "weight": 0.30, "description": "Memory and subrequest limits", "criteria": "Adheres to edge limits and avoids unbounded subrequest fanout."},
                {"name": "tradeoffs", "weight": 0.30, "description": "Cache consistency vs availability", "criteria": "Explicitly justifies eventual consistency trade-offs."}
            ]
        },

        # --- NON-TECHNICAL ARCHETYPES ---
        {
            "id": "arch-finance-capex-wacc",
            "title": "Capital Allocation & WACC Sensitivity Under Inflation",
            "domain": "finance",
            "modality": "financial_analysis",
            "task_form": TaskForm.QUANTITATIVE_CALCULATION,
            "task_family": TaskFamily.FINANCIAL_MODELING,
            "competency": "Financial Planning & Valuation",
            "skill": "Capital Budgeting & Valuation",
            "scenario": {
                "background": "OmniCorp has an available $25M capital expenditure envelope for FY2027 with competing division bids (Robotics, Data Center, Solar Retrofit).",
                "objective": "Calculate Net Present Value (NPV), Internal Rate of Return (IRR), and Payback Period across three projects under 9.0% WACC, and formulate a capital allocation memo.",
                "initial_requirements": [
                    "Construct DCF cash flow schedules for all three project options",
                    "Calculate NPV, IRR, and profitability indices under base and stressed WACC (+150 bps)",
                    "Draft an executive capital allocation recommendation memo"
                ],
                "constraints": [
                    "Year 0 cumulative capital spend cannot exceed $25,000,000",
                    "Minimum required hurdle rate is 10.5%"
                ],
                "expected_output_type": "financial_schedule_and_memo"
            },
            "rubric_dimensions": [
                {"name": "mathematical_accuracy", "weight": 0.35, "description": "DCF and NPV computation", "criteria": "Flawless discount factor and cash flow compounding calculations."},
                {"name": "decision_quality", "weight": 0.35, "description": "Risk-adjusted capital rationing", "criteria": "Recommends optimal value-maximizing project bundle under constraint."},
                {"name": "executive_communication", "weight": 0.30, "description": "Clarity of memo", "criteria": "Clear rationale, transparent assumptions, and risk disclosures."}
            ]
        },
        {
            "id": "arch-ops-hospital-triage",
            "title": "Hospital Emergency Department Surge & Float Pool Allocation",
            "domain": "operations",
            "modality": "operational_triage",
            "task_form": TaskForm.SCENARIO,
            "task_family": TaskFamily.OPERATIONS_MANAGEMENT,
            "competency": "Operations & Patient Acuity Triage",
            "skill": "Clinical Workflow & Resource Allocation",
            "scenario": {
                "background": "Saint Jude Regional Medical Center experiences a winter blizzard multi-vehicle collision resulting in 28 incoming trauma patients while ED is already at 92% occupancy.",
                "objective": "Reallocate available nurse float pools across ICU, Step-Down, and Trauma bays while executing rapid bed turnover to ensure zero unattended critical patients.",
                "initial_requirements": [
                    "Prioritize high-acuity admissions based on Emergency Severity Index (ESI)",
                    "Deploy 6 on-call float pool registered nurses according to mandated nurse-to-patient ratios",
                    "Identify non-emergent patients for safe early transfer or delayed observation"
                ],
                "constraints": [
                    "Mandated state nurse-to-patient ratio: ICU 1:2, Trauma 1:1, Med-Surg 1:4",
                    "Zero patient left in unmonitored hallway triage longer than 15 minutes"
                ],
                "expected_output_type": "operational_triage_roster_and_protocol"
            },
            "rubric_dimensions": [
                {"name": "triage_accuracy", "weight": 0.40, "description": "Acuity classification", "criteria": "Correctly assigns ESI levels and beds without under-triaging trauma."},
                {"name": "resource_efficiency", "weight": 0.35, "description": "Staffing ratio adherence", "criteria": "Satisfies mandatory staffing ratios under severe capacity crunch."},
                {"name": "patient_safety", "weight": 0.25, "description": "Bottleneck mitigation", "criteria": "Explicitly details escalation path for overflow patients."}
            ]
        },
        {
            "id": "arch-legal-procurement-rfp",
            "title": "Enterprise Cloud Procurement RFP & Sovereign Data Compliance",
            "domain": "legal",
            "modality": "written_communication",
            "task_form": TaskForm.WRITTEN_RESPONSE,
            "task_family": TaskFamily.PROCUREMENT_VENDOR,
            "competency": "Procurement & Commercial Contracts",
            "skill": "Vendor Negotiation & Regulatory Compliance",
            "scenario": {
                "background": "A multinational financial group is selecting a cloud provider for EU banking core transactions. Bids from HyperCloud US and EuroVault are under final review.",
                "objective": "Evaluate commercial terms, SLA indemnity caps, and Schrems II cross-border data transfer safeguards, drafting a vendor recommendation brief.",
                "initial_requirements": [
                    "Compare SLA commitments: 99.99% availability vs 99.9% with service credit structures",
                    "Identify data sovereignty and GDPR Article 46 transfer compliance risks",
                    "Formulate a negotiation redline for liability caps and audit inspection rights"
                ],
                "constraints": [
                    "Liability cap for data breaches must be uncapped or >= $50M",
                    "EU customer data must be cryptographically pinned within EEA boundaries"
                ],
                "expected_output_type": "procurement_scorecard_and_legal_brief"
            },
            "rubric_dimensions": [
                {"name": "regulatory_rigor", "weight": 0.40, "description": "GDPR and Schrems II compliance", "criteria": "Accurately identifies international surveillance and transfer risks."},
                {"name": "commercial_negotiation", "weight": 0.35, "description": "Liability and SLA redline", "criteria": "Proposes actionable contract redlines protecting organizational downside."},
                {"name": "clarity", "weight": 0.25, "description": "Executive briefing clarity", "criteria": "Clear decision matrix with objective vendor scoring."}
            ]
        }
    ]

    @classmethod
    def synthesize_task(
        cls,
        assessment_context: Dict[str, Any],
        target_competency: Optional[Dict[str, Any]] = None,
        previous_tasks: Optional[List[Dict[str, Any]]] = None,
        requested_form: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Synthesizes a tailored, non-repetitive task scaled to candidate seniority.
        Guarantees that ONE single high-value task is produced.
        """
        previous_tasks = previous_tasks or []
        cand_ctx = assessment_context.get("candidateContext", {})
        job_ctx = assessment_context.get("jobContext", {})
        role_ctx = assessment_context.get("roleContext", {})

        target_role = cand_ctx.get("targetRole") or job_ctx.get("jobTitle") or "Professional"
        seniority = cand_ctx.get("seniorityLevel") or role_ctx.get("seniorityLevel") or "senior"
        domain = role_ctx.get("domain") or cand_ctx.get("targetDomainId") or "software"

        # Determine target skill from primary recommended target or target_competency
        if target_competency:
            target_skill = target_competency.get("skillName") or target_competency.get("name") or "Core Skill"
            comp_name = target_competency.get("competencyName") or target_competency.get("name") or target_skill
        else:
            primary_target = assessment_context.get("primaryRecommendedTarget", {})
            target_skill = primary_target.get("skillName") or "System Architecture & Concurrency"
            comp_name = primary_target.get("name") or target_skill

        # Search for best archetype match that is NOT a duplicate
        chosen_archetype = None
        for arch in cls.ARCHETYPES:
            # Check domain / skill affinity
            arch_domain = arch["domain"]
            arch_skill = arch["skill"].lower()
            t_skill_lower = target_skill.lower()

            is_match = (
                arch_domain == domain or
                arch_skill in t_skill_lower or
                t_skill_lower in arch_skill or
                domain in arch["domain"]
            )

            if is_match:
                is_dup, _, _ = RepetitionDetector.is_duplicate(arch, previous_tasks, threshold=0.70)
                if not is_dup:
                    chosen_archetype = arch
                    break

        # Fallback to any non-duplicate archetype if domain-specific wasn't found
        if not chosen_archetype:
            for arch in cls.ARCHETYPES:
                is_dup, _, _ = RepetitionDetector.is_duplicate(arch, previous_tasks, threshold=0.70)
                if not is_dup:
                    chosen_archetype = arch
                    break

        # Ultimate fallback: customize archetype 0
        if not chosen_archetype:
            chosen_archetype = cls.ARCHETYPES[0]

        # Clone and parameterize with candidate context
        task_id = f"task-synth-{uuid.uuid4().hex[:10]}"
        task_form = requested_form or chosen_archetype.get("task_form", TaskForm.PRACTICAL_EXECUTION)
        cognitive_dims = TaskTaxonomy.get_cognitive_dimensions_for_form(task_form)

        base_task = {
            "id": task_id,
            "roundIndex": len(previous_tasks) + 1,
            "title": f"{chosen_archetype['title']} ({SeniorityScaler.normalize_seniority(seniority).capitalize()})",
            "modality": chosen_archetype["modality"],
            "taskForm": task_form,
            "taskFamily": chosen_archetype.get("task_family", TaskFamily.CODING),
            "cognitiveDimensions": cognitive_dims,
            "competencyTarget": {
                "id": f"tgt-{task_id[:8]}",
                "name": comp_name,
                "domain": domain,
                "skillName": target_skill,
                "targetProficiency": 0.80,
                "currentProficiency": 0.50,
                "uncertaintyEstimate": 0.40,
                "diagnosisSource": "m02_assessment_gap" if "gap" in str(target_competency) else "job_requirement",
                "rationale": f"Adaptive task calibrated for {target_role} ({seniority} tier)."
            },
            "difficultyLevel": 3 if seniority in ("entry", "junior") else (4 if seniority == "mid" else 5),
            "scenario": {
                "background": chosen_archetype["scenario"]["background"],
                "objective": chosen_archetype["scenario"]["objective"],
                "initialRequirements": list(chosen_archetype["scenario"]["initial_requirements"]),
                "operationalConstraints": list(chosen_archetype["scenario"]["constraints"]),
                "expectedOutputType": chosen_archetype["scenario"]["expected_output_type"]
            },
            "rubric": {
                "dimensions": [dict(d) for d in chosen_archetype["rubric_dimensions"]]
            },
            "provenance": {
                "sourceModule": "m03_task_synthesizer",
                "generatorMethod": "archetype_synthesis_v2",
                "recordedAt": "2026-10-07T21:00:00Z"
            }
        }

        # Apply Deep Seniority Scaling
        scaled_task = SeniorityScaler.scale_task(base_task, seniority)

        # Assemble Core Model contract
        scenario = scaled_task["scenario"]
        scaled_task["coreModel"] = {
            "input": scenario.get("background", ""),
            "constraints": scenario.get("operationalConstraints", []),
            "cognitiveOperation": scenario.get("objective", ""),
            "expectedOutput": scenario.get("expectedOutputType", "work_product"),
            "observableEvidence": scenario.get("initialRequirements", []),
            "evaluationCriteria": [f"{d['name']}: {d['criteria']}" for d in scaled_task["rubric"]["dimensions"]]
        }

        # Add repetition fingerprint and quality score
        scaled_task["repetitionFingerprint"] = RepetitionDetector.compute_fingerprint(scaled_task)
        quality_eval = QualityEvaluator.evaluate_quality(scaled_task)
        scaled_task["qualityScore"] = quality_eval["overall_quality_score"]

        return scaled_task
