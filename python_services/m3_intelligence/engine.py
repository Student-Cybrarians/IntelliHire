"""
M03 Assessment Context Intelligence Engine & CLI Runner
IntelliHire M03 - Phase 2
"""

import sys
import json
import uuid
import datetime
from typing import Dict, Any, List, Optional

from python_services.m3_intelligence.bayesian_calibrator import calculate_kalman_update, project_information_gain
from python_services.m3_intelligence.semantic_matcher import match_candidate_to_requirements
from python_services.m3_intelligence.evidence_aggregator import EvidenceAggregator
from python_services.m3_intelligence.target_ranker import TargetRanker, sanitize_sensitive_attributes


def build_assessment_context(
    raw_payload: Dict[str, Any],
    assessment_purpose: str = "practice"
) -> Dict[str, Any]:
    """
    Constructs the structured M03 AssessmentContext:
    Candidate Profile + Resume Evidence + JD + Role + Seniority + Competencies + Diagnosed Gaps
    -> Structured AssessmentContext with explainable prioritized targets.
    """
    # Step 1: Strip and audit sensitive attributes
    sanitized_input, stripped_traits = sanitize_sensitive_attributes(raw_payload)

    candidate_data = sanitized_input.get("candidate", {})
    job_data = sanitized_input.get("job", {})
    claims_data = sanitized_input.get("claims", [])
    m02_data = sanitized_input.get("m02_evaluations", [])
    m03_data = sanitized_input.get("m03_evaluations", [])
    proficiencies = sanitized_input.get("proficiencies", [])

    # Step 2: Ingest into 5-layer Evidence Aggregator
    aggregator = EvidenceAggregator()
    aggregator.ingest_candidate_claims(claims_data, candidate_data.get("active_resume_id"))
    aggregator.ingest_m02_evaluations(m02_data)
    aggregator.ingest_m03_history(m03_data)
    evidence_bundle = aggregator.get_bundle()

    # Step 3: Extract & Normalize Job Requirements
    key_requirements = job_data.get("key_requirements", [])
    required_skills = job_data.get("required_skills", [])
    if not key_requirements and required_skills:
        key_requirements = [f"Proficiency in {s}" for s in required_skills]

    # Step 4: Semantic Matching between Candidate Claims & JD Requirements
    candidate_text_corpus = " ".join([
        candidate_data.get("target_role", ""),
        " ".join(candidate_data.get("extracted_skills", [])),
        " ".join([c.get("statement", "") for c in evidence_bundle["evidence_ledger"]])
    ])
    semantic_alignments = match_candidate_to_requirements(candidate_text_corpus, key_requirements)

    # Step 5: Rank Competency & Skill Targets using Multi-Objective TargetRanker
    ranker = TargetRanker(assessment_purpose=assessment_purpose)

    # Assemble candidate skill pool
    skill_pool: Dict[str, Dict[str, Any]] = {}

    # Seed from proficiencies table
    for p in proficiencies:
        s_name = p.get("skill_name") or p.get("skill_id")
        if s_name:
            skill_pool[s_name] = {
                "skill_name": s_name,
                "competency_name": p.get("competency_name") or s_name,
                "current_proficiency": float(p.get("proficiency_estimate") or 0.5),
                "uncertainty": float(p.get("uncertainty_estimate") or 0.5),
                "observation_count": int(p.get("observation_count") or 1)
            }

    # Integrate gap signals
    for gap in evidence_bundle["gap_signals"]:
        s_name = gap["skill_name"]
        if s_name not in skill_pool:
            skill_pool[s_name] = {
                "skill_name": s_name,
                "competency_name": gap.get("competency_name") or s_name,
                "current_proficiency": 0.35 if gap["gap_origin_type"] == "confirmed_weakness" else 0.50,
                "uncertainty": gap.get("uncertainty", 0.35),
                "observation_count": 1
            }

    # Ensure JD required skills are in pool
    for req_skill in required_skills:
        if req_skill not in skill_pool:
            skill_pool[req_skill] = {
                "skill_name": req_skill,
                "competency_name": req_skill,
                "current_proficiency": 0.50,
                "uncertainty": 0.60,  # Unassessed requirement carries high uncertainty
                "observation_count": 0
            }

    # If pool is completely empty (cold start / missing profile), inject role baseline
    if not skill_pool:
        fallback_role = candidate_data.get("target_role") or "Core Engineering"
        fallback_skill = "System Architecture & Concurrency" if "software" in candidate_data.get("target_role", "").lower() else "Operational Execution"
        skill_pool[fallback_skill] = {
            "skill_name": fallback_skill,
            "competency_name": fallback_skill,
            "current_proficiency": 0.50,
            "uncertainty": 0.50,
            "observation_count": 0
        }

    # Rank each skill in pool (fatigue penalty applies only to repeated M03 simulations, not M02 incoming gaps)
    recent_tasks = [
        ev.get("competency_or_skill")
        for ev in evidence_bundle["evidence_ledger"]
        if ev.get("source_module") == "m03_simulation"
    ][-3:]
    ranked_targets: List[Dict[str, Any]] = []

    for s_name, s_info in skill_pool.items():
        # Find matching gap signal if exists
        matching_gap = next((g for g in evidence_bundle["gap_signals"] if g["skill_name"].lower() == s_name.lower()), None)

        score_data = ranker.compute_priority(
            skill_name=s_name,
            competency_name=s_info["competency_name"],
            job_requirements=key_requirements,
            current_proficiency=s_info["current_proficiency"],
            uncertainty=s_info["uncertainty"],
            observation_count=s_info["observation_count"],
            gap_signal=matching_gap,
            recent_tasks=recent_tasks,
            required_skills=required_skills
        )

        ranked_targets.append({
            "id": f"tgt-{uuid.uuid4().hex[:8]}",
            "name": s_info["competency_name"],
            "domain": candidate_data.get("primary_domain") or "software",
            "skillName": s_name,
            "targetProficiency": 0.80,
            "currentProficiency": score_data["current_proficiency"],
            "uncertaintyEstimate": score_data["uncertainty_estimate"],
            "observationCount": score_data["observation_count"],
            "diagnosisSource": "m02_assessment_gap" if matching_gap else ("job_requirement" if s_name in required_skills else "baseline_target"),
            "targetingScore": score_data["targeting_score"],
            "rationale": score_data["breakdown"]["rationale"],
            "skills": [{
                "id": f"sk-{uuid.uuid4().hex[:8]}",
                "skillName": s_name,
                "competencyName": s_info["competency_name"],
                "domain": candidate_data.get("primary_domain") or "software",
                "targetProficiency": 0.80,
                "currentProficiency": score_data["current_proficiency"],
                "uncertaintyEstimate": score_data["uncertainty_estimate"],
                "observationCount": score_data["observation_count"],
                "targetingPriorityScore": score_data["targeting_score"],
                "priorityBreakdown": {
                    "jobRelevanceWeight": score_data["breakdown"]["job_relevance_weight"],
                    "uncertaintyDeficitWeight": score_data["breakdown"]["uncertainty_deficit_weight"],
                    "gapSeverityWeight": score_data["breakdown"]["gap_severity_weight"],
                    "coverageDeficitWeight": score_data["breakdown"]["coverage_deficit_weight"],
                    "recencyFatiguePenalty": score_data["breakdown"]["recency_fatigue_penalty"],
                    "rationale": score_data["breakdown"]["rationale"]
                }
            }]
        })

    # Sort descending by composite targeting score
    ranked_targets.sort(key=lambda t: t["targetingScore"], reverse=True)
    primary_target = ranked_targets[0] if ranked_targets else None

    # Step 6: Determine Work Modality
    role_lower = (candidate_data.get("target_role") or "").lower()
    if any(k in role_lower for k in ("software", "backend", "fullstack", "developer", "engineer")):
        modality = "coding"
    elif any(k in role_lower for k in ("finance", "financial", "accounting", "analyst")):
        modality = "financial_analysis"
    elif any(k in role_lower for k in ("operations", "triage", "logistics", "clinical", "hospital")):
        modality = "operational_triage"
    elif any(k in role_lower for k in ("data", "analytics", "bi", "sql")):
        modality = "data_analysis"
    else:
        modality = "written_communication"

    # Step 7: Build Role Context
    role_context = {
        "roleTitle": candidate_data.get("target_role") or "Professional Candidate",
        "domain": candidate_data.get("primary_domain") or "cross-functional",
        "occupationCode": candidate_data.get("occupation_code") or "15-1252.00",
        "seniorityLevel": candidate_data.get("seniority_level") or "mid",
        "seniorityExpectations": {
            "complexityCeiling": "Senior-level autonomous system trade-offs",
            "autonomyLevel": "High",
            "decisionScope": "Architectural and operational domain integrity",
            "expectedProficiencyBaseline": 0.75
        },
        "requiredCompetencies": [
            {"name": req, "priority": "mandatory", "weight": 1.0}
            for req in required_skills[:5]
        ]
    }

    # Step 8: Return Complete Structured AssessmentContext
    context_id = f"ctx-m3-{uuid.uuid4().hex[:12]}"
    return {
        "contextId": context_id,
        "candidateContext": {
            "userId": candidate_data.get("id") or "user-default",
            "organizationId": candidate_data.get("organization_id") or "org_default_public",
            "targetRole": candidate_data.get("target_role") or "Software Engineer",
            "seniorityLevel": candidate_data.get("seniority_level") or "mid",
            "extractedSkills": candidate_data.get("extracted_skills", []),
            "verifiedClaims": [
                {"claim": c.get("claim_value") or c.get("claim"), "source": "m01_resume", "confidence": float(c.get("confidence_score") or 0.85)}
                for c in claims_data
            ],
            "currentReadinessScore": float(candidate_data.get("readiness_score") or 0.5),
            "diagnosedGaps": evidence_bundle["gap_signals"]
        },
        "jobContext": {
            "requisitionId": job_data.get("id"),
            "jobTitle": job_data.get("title") or candidate_data.get("target_role") or "Target Role",
            "targetSeniority": job_data.get("seniority_level") or candidate_data.get("seniority_level") or "mid",
            "targetDomain": job_data.get("role_category") or candidate_data.get("primary_domain") or "software",
            "requiredCompetencies": [{"name": s, "priority": "required"} for s in required_skills],
            "requiredSkills": required_skills,
            "keyRequirements": key_requirements,
            "semanticAlignments": semantic_alignments
        },
        "roleContext": role_context,
        "assessmentPurpose": assessment_purpose,
        "evidenceLedger": evidence_bundle["evidence_ledger"],
        "gapSignals": evidence_bundle["gap_signals"],
        "prioritizedTargets": ranked_targets,
        "primaryRecommendedTarget": primary_target,
        "activeWorkModality": modality,
        "securityGovernance": {
            "tenantId": candidate_data.get("organization_id") or "org_default_public",
            "organizationId": candidate_data.get("organization_id") or "org_default_public",
            "candidateUserId": candidate_data.get("id") or "user-default",
            "sensitiveAttributesExcluded": True,
            "exclusionAudit": stripped_traits,
            "createdAt": datetime.datetime.now(datetime.timezone.utc).isoformat()
        }
    }


if __name__ == "__main__":
    # Support CLI execution
    input_data = sys.stdin.read() if not sys.stdin.isatty() else "{}"
    try:
        parsed = json.loads(input_data) if input_data.strip() else {}
    except Exception as e:
        print(json.dumps({"error": f"Invalid JSON input: {e}"}))
        sys.exit(1)

    result = build_assessment_context(parsed)
    print(json.dumps(result, indent=2))
