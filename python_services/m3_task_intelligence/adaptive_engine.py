"""
IntelliHire M03 Adaptive Continuous Work-Round ML Engine.
Phase 8/10: Bayesian Proficiency Tracking, Multi-Armed Adaptation Policy,
Uncertainty Minimization, Anti-Tunnel-Vision Guardrails, and Auditable Decision Tracing.
"""

import math
import uuid
import datetime
from typing import Dict, Any, List, Optional, Tuple

class BayesianProficiencyTracker:
    """
    Tracks and updates candidate competency proficiency beliefs using
    Kalman-Bayesian conjugate updates with uncertainty estimation.
    """

    def __init__(self, default_prior_mean: float = 0.50, default_prior_var: float = 0.16):
        self.default_prior_mean = default_prior_mean
        self.default_prior_var = default_prior_var
        self.skills: Dict[str, Dict[str, float]] = {}

    def get_skill_belief(self, skill_name: str) -> Dict[str, float]:
        normalized_name = skill_name.strip().lower()
        if normalized_name not in self.skills:
            self.skills[normalized_name] = {
                "mean": self.default_prior_mean,
                "variance": self.default_prior_var,
                "uncertainty": min(1.0, 2.0 * math.sqrt(self.default_prior_var)),
                "observations": 0
            }
        return dict(self.skills[normalized_name])

    def update_skill(
        self,
        skill_name: str,
        observed_score: float, # 0.0 to 1.0
        confidence: float = 0.85, # 0.0 to 1.0
        validity: str = "correct"
    ) -> Dict[str, float]:
        """
        Applies a Bayesian update to belief state based on observed performance.
        Higher evaluation confidence reduces measurement noise variance.
        """
        normalized_name = skill_name.strip().lower()
        if normalized_name not in self.skills:
            self.skills[normalized_name] = {
                "mean": self.default_prior_mean,
                "variance": self.default_prior_var,
                "uncertainty": min(1.0, 2.0 * math.sqrt(self.default_prior_var)),
                "observations": 0
            }
        belief = self.skills[normalized_name]
        prior_mean = belief["mean"]
        prior_var = belief["variance"]

        # Observation noise variance is inversely related to confidence and validity
        validity_factor = {
            "correct": 1.0,
            "alternative_valid": 0.95,
            "context_dependent": 0.80,
            "partially_correct": 0.75,
            "incomplete": 0.70,
            "incorrect": 0.85,
            "insufficient_information": 0.50
        }.get(validity, 0.75)

        # Measurement noise variance sigma_eps^2
        noise_var = max(0.02, 0.20 * (1.0 - (confidence * validity_factor) * 0.75))

        # Kalman gain K = sigma_prior^2 / (sigma_prior^2 + sigma_eps^2)
        kalman_gain = prior_var / (prior_var + noise_var)

        # Posterior mean & variance
        posterior_mean = prior_mean + kalman_gain * (observed_score - prior_mean)
        posterior_mean = max(0.01, min(0.99, posterior_mean))
        posterior_var = max(0.005, (1.0 - kalman_gain) * prior_var)

        belief["mean"] = round(posterior_mean, 4)
        belief["variance"] = round(posterior_var, 4)
        belief["uncertainty"] = round(min(1.0, 2.0 * math.sqrt(posterior_var)), 4)
        belief["observations"] += 1

        return dict(belief)


class AdaptivePolicyEngine:
    """
    Multi-objective policy for selecting the optimal next work-round task.
    Balances uncertainty reduction, competency coverage breadth, difficulty calibration,
    and misconception remediation while enforcing zero-repetition and anti-tunnel-vision.
    """

    # Mapping of technical / domain competencies to friendly previews
    FRIENDLY_FOCUS_TEMPLATES = {
        "increase_difficulty": "Elevated Complexity: Deepening {skill} Mastery",
        "decrease_difficulty": "Foundational Focus: Core Principles in {skill}",
        "remediate_misconception": "Remediation Drill: Mastering Non-Blocking Invariants in {skill}",
        "test_prerequisite": "Essential Prerequisite: Foundational Constructs for {skill}",
        "broaden_coverage": "Role Breadth: Assessing {competency} ({skill})",
        "test_practical_execution": "Hands-On Execution: Practical Problem-Solving in {skill}",
        "test_reasoning_rigor": "Architectural Rationale: Design Trade-offs in {skill}",
        "transfer_domain": "Domain Transfer: Applying {skill} Under Novel Scenarios",
        "stress_constraint": "Resilience & Scale: Stress-Testing {skill} Under Tight Constraints",
        "validate_improvement": "Competency Re-Check: Verifying Growth in {skill}",
        "reduce_uncertainty": "Calibration Probe: Verifying Consistency in {skill}"
    }

    @classmethod
    def evaluate_next_step(
        cls,
        candidate_context: Dict[str, Any],
        job_context: Dict[str, Any],
        previous_rounds: List[Dict[str, Any]],
        latest_evaluation: Optional[Dict[str, Any]],
        available_simulations: List[Dict[str, Any]],
        tracker: Optional[BayesianProficiencyTracker] = None
    ) -> Dict[str, Any]:
        """
        Determines the optimal next task and outputs an auditable AdaptationDecision.
        """
        tracker = tracker or BayesianProficiencyTracker()
        round_index = len(previous_rounds) + 1
        previous_task_ids = [r.get("definitionId") or r.get("id") or "" for r in previous_rounds]
        
        # 1. Inspect latest evaluation and previous round context
        latest_eval = latest_evaluation or {}
        prior_score = float(latest_eval.get("overall_score", 65.0)) / 100.0 if latest_eval.get("overall_score") is not None else 0.65
        alternative_validity = latest_eval.get("alternative_validity", "correct")
        confidence = float(latest_eval.get("confidence_score", 0.85))
        uncertainty = float(latest_eval.get("uncertainty_score", 0.15))
        
        # Extract diagnosed misconceptions from teaching payload or previous rounds
        teaching_payload = latest_eval.get("teaching_payload") or {}
        misconceptions = teaching_payload.get("misconceptions") or []
        diagnosed_misconception_names = [m.get("conceptName", "") for m in misconceptions if m.get("conceptName")]

        # Update Bayesian beliefs for the skill just tested
        if previous_rounds:
            last_round = previous_rounds[-1]
            last_skill = last_round.get("skillName") or last_round.get("skill_name") or "General"
            tracker.update_skill(last_skill, prior_score, confidence, alternative_validity)

        # 2. Extract Job Competencies & Skills
        jd_competencies = job_context.get("requiredCompetencies") or job_context.get("competencies") or [
            {"name": "System Architecture & Concurrency", "skillName": "Distributed Systems & Concurrency", "domain": "software"},
            {"name": "Database Architecture & Optimization", "skillName": "Relational Indexing & MVCC", "domain": "software"},
            {"name": "Financial Planning & Valuation", "skillName": "Capital Budgeting & Valuation", "domain": "finance"},
            {"name": "Clinical Emergency Triage", "skillName": "Emergency Triage & Patient Prioritization", "domain": "healthcare_admin"},
            {"name": "Data Engineering & Analytics", "skillName": "Real-Time Pipeline Engineering", "domain": "data"}
        ]

        # Calculate coverage breadth
        assessed_competency_names = set(
            (r.get("competencyName") or r.get("competency_name") or "").lower()
            for r in previous_rounds if (r.get("competencyName") or r.get("competency_name"))
        )
        remaining_competencies = [
            c for c in jd_competencies
            if c.get("name", "").lower() not in assessed_competency_names
        ]

        # 3. Determine Adaptive Reason Type & Strategy
        recent_competencies = [
            (r.get("competencyName") or r.get("competency_name") or "").lower()
            for r in previous_rounds[-2:]
        ]
        
        # Anti-Tunnel-Vision check: If last 2 rounds were on same competency, MUST switch
        force_switch_competency = len(recent_competencies) >= 2 and recent_competencies[-1] == recent_competencies[-2] and len(remaining_competencies) > 0

        # Adaptation Decision Branching
        reason_type = "broaden_coverage"
        internal_rationale = ""
        target_difficulty = 3
        
        if force_switch_competency:
            reason_type = "broaden_coverage"
            internal_rationale = f"Anti-Tunnel-Vision invariant triggered: Last 2 rounds tested '{recent_competencies[-1]}'. Rotating to unassessed role requirement to guarantee evaluation breadth."
        elif len(diagnosed_misconception_names) > 0 and prior_score < 0.60:
            reason_type = "remediate_misconception"
            internal_rationale = f"Diagnosed active misconception: {diagnosed_misconception_names[0]}. Targeting immediate remediation task to verify whether candidate has corrected invalid premise."
        elif prior_score >= 0.85 and uncertainty <= 0.35 and alternative_validity in ["correct", "alternative_valid"]:
            if round_index >= 3 and len(remaining_competencies) == 0:
                reason_type = "stress_constraint"
                internal_rationale = f"Candidate demonstrated high proficiency (score={prior_score*100:.0f}%, U={uncertainty:.2f}) with zero unassessed competencies. Introducing tightened constraint stress-test."
            else:
                reason_type = "increase_difficulty"
                internal_rationale = f"Candidate demonstrated solid mastery (score={prior_score*100:.0f}%, U={uncertainty:.2f}). Elevating task complexity to probe upper bounds of capability."
        elif prior_score < 0.40 or alternative_validity in ["incorrect", "incomplete"]:
            if len(previous_rounds) >= 1 and previous_rounds[-1].get("difficulty", 3) >= 3:
                reason_type = "decrease_difficulty"
                internal_rationale = f"Candidate encountered substantial breakdown (score={prior_score*100:.0f}%, validity={alternative_validity}). Providing calibrated scaffolding at lower complexity to diagnose baseline."
            else:
                reason_type = "test_prerequisite"
                internal_rationale = f"Persistent execution gap detected (score={prior_score*100:.0f}%). Testing prerequisite conceptual invariant."
        elif uncertainty > 0.45:
            reason_type = "reduce_uncertainty"
            internal_rationale = f"High posterior uncertainty (U={uncertainty:.2f}). Probing candidate consistency to tighten proficiency confidence."
        elif len(remaining_competencies) > 0:
            reason_type = "broaden_coverage"
            internal_rationale = f"Evaluation breadth prioritization: {len(remaining_competencies)} of {len(jd_competencies)} JD competencies remain unmeasured. Selecting next required role dimension."
        else:
            reason_type = "transfer_domain"
            internal_rationale = "Core JD requirements covered. Testing skill transferability across alternative work round modality."

        # 4. Filter Available Simulations & Score Utility
        unattempted_sims = [s for s in available_simulations if s.get("id") not in previous_task_ids]
        if not unattempted_sims:
            # Fallback if entire catalogue exhausted
            unattempted_sims = available_simulations

        scored_candidates: List[Tuple[float, Dict[str, Any], Dict[str, float]]] = []

        for sim in unattempted_sims:
            sim_comp = sim.get("competency_name", "")
            sim_skill = sim.get("skill_name", "")
            sim_diff = int(sim.get("difficulty_level", 3))

            # Retrieve belief for this skill
            belief = tracker.get_skill_belief(sim_skill)
            skill_mean = belief["mean"]
            skill_u = belief["uncertainty"]

            # Compute Multi-Armed Utility Weights
            # 1. Coverage utility (bonus if this competency is unassessed)
            coverage_bonus = 1.0 if sim_comp.lower() not in assessed_competency_names else 0.1
            
            # 2. Uncertainty reduction utility
            uncertainty_bonus = skill_u
            
            # 3. Misconception targeting bonus
            misconception_bonus = 0.0
            if reason_type == "remediate_misconception":
                last_comp = (previous_rounds[-1].get("competencyName", "")).lower() if previous_rounds else ""
                last_skill = (previous_rounds[-1].get("skillName", "")).lower() if previous_rounds else ""
                if sim_comp.lower() == last_comp or sim_skill.lower() == last_skill:
                    misconception_bonus = 2.5
                elif any(m.lower() in sim_skill.lower() or m.lower() in sim_comp.lower() for m in diagnosed_misconception_names):
                    misconception_bonus = 2.0

            # 4. Difficulty alignment with Zone of Proximal Development (ZPD)
            current_diff = previous_rounds[-1].get("difficulty", 3) if previous_rounds else 3
            if reason_type == "increase_difficulty":
                target_diff = min(5, current_diff + 1)
            elif reason_type == "decrease_difficulty":
                target_diff = max(1, current_diff - 1)
            else:
                target_diff = current_diff

            diff_delta = abs(sim_diff - target_diff)
            difficulty_penalty = diff_delta * 0.25

            # 5. Recency / Tunnel-Vision penalty (bypassed for intentional remediation)
            recency_penalty = 0.0
            if reason_type != "remediate_misconception":
                for idx, r in enumerate(reversed(previous_rounds[-3:])):
                    if (r.get("competencyName") or "").lower() == sim_comp.lower():
                        recency_penalty += (3 - idx) * 0.4
                    if (r.get("skillName") or "").lower() == sim_skill.lower():
                        recency_penalty += (3 - idx) * 0.6

            # Total Utility
            utility = (
                (0.35 * coverage_bonus) +
                (0.25 * uncertainty_bonus) +
                (0.30 * misconception_bonus) -
                (0.20 * difficulty_penalty) -
                (0.40 * recency_penalty)
            )

            breakdown = {
                "coverage_weight": round(coverage_bonus, 3),
                "uncertainty_weight": round(uncertainty_bonus, 3),
                "misconception_weight": round(misconception_bonus, 3),
                "difficulty_penalty": round(difficulty_penalty, 3),
                "recency_penalty": round(recency_penalty, 3),
                "final_utility": round(utility, 3)
            }

            scored_candidates.append((utility, sim, breakdown))

        # Sort by highest utility
        scored_candidates.sort(key=lambda x: x[0], reverse=True)
        chosen_utility, chosen_sim, chosen_breakdown = scored_candidates[0]

        target_difficulty = int(chosen_sim.get("difficulty_level", target_difficulty))
        chosen_competency = chosen_sim.get("competency_name", "Technical Problem Solving")
        chosen_skill = chosen_sim.get("skill_name", "Core Domain Execution")
        chosen_domain = chosen_sim.get("domain", "software")
        chosen_modality = chosen_sim.get("simulation_type", "coding")

        # 5. Build Candidate-Friendly Preview
        template = cls.FRIENDLY_FOCUS_TEMPLATES.get(
            reason_type, "Next Work Focus: {competency} ({skill})"
        )
        friendly_preview = template.format(
            skill=chosen_skill,
            competency=chosen_competency
        )

        decision_id = f"dec_{uuid.uuid4().hex[:12]}"
        now_iso = datetime.datetime.now(datetime.timezone.utc).isoformat()

        decision = {
            "decisionId": decision_id,
            "timestamp": now_iso,
            "roundIndex": round_index,
            "reasonType": reason_type,
            "targetCompetency": chosen_competency,
            "targetSkill": chosen_skill,
            "targetDomain": chosen_domain,
            "targetDifficulty": target_difficulty,
            "targetModality": chosen_modality,
            "selectedSimulationId": chosen_sim.get("id"),
            "internalRationale": internal_rationale,
            "candidateFocusPreview": friendly_preview,
            "priorState": {
                "priorScore": round(prior_score * 100, 1),
                "alternativeValidity": alternative_validity,
                "confidence": round(confidence, 3),
                "uncertainty": round(uncertainty, 3),
                "diagnosedMisconceptions": diagnosed_misconception_names,
                "skillsCoveredCount": len(assessed_competency_names),
                "competenciesRemainingCount": len(remaining_competencies)
            },
            "selectionScores": chosen_breakdown
        }

        return {
            "decision": decision,
            "selectedTask": chosen_sim,
            "progressionSummary": {
                "roundsCompleted": len(previous_rounds),
                "competenciesCovered": list(assessed_competency_names),
                "competenciesRemaining": [c.get("name") for c in remaining_competencies],
                "coverageRatio": round(len(assessed_competency_names) / max(1, len(jd_competencies)), 2)
            }
        }


class AdaptiveMonteCarloSimulator:
    """
    Simulation suite verifying multi-round adaptation dynamics across candidate archetypes:
    - Rapid Improver (low initial -> rapid rise)
    - Consistently Strong (high proficiency throughout)
    - Struggling / Novice (repeated difficulties, needing scaffolding)
    - Oscillating / Domain Explorer
    """

    @classmethod
    def simulate_trajectory(
        cls,
        candidate_profile: str,
        num_rounds: int,
        available_sims: List[Dict[str, Any]],
        jd_competencies: List[Dict[str, Any]]
    ) -> Dict[str, Any]:
        tracker = BayesianProficiencyTracker()
        rounds_history: List[Dict[str, Any]] = []
        latest_eval: Optional[Dict[str, Any]] = None

        job_context = {"requiredCompetencies": jd_competencies}
        candidate_context = {"profile": candidate_profile}

        difficulty_path = []
        score_path = []
        uncertainty_path = []
        repetition_violations = 0
        seen_task_ids = set()

        for r_idx in range(1, num_rounds + 1):
            step_result = AdaptivePolicyEngine.evaluate_next_step(
                candidate_context=candidate_context,
                job_context=job_context,
                previous_rounds=rounds_history,
                latest_evaluation=latest_eval,
                available_simulations=available_sims,
                tracker=tracker
            )

            decision = step_result["decision"]
            task = step_result["selectedTask"]
            task_id = task.get("id")

            # Invariant check: Zero repetition
            if task_id in seen_task_ids:
                repetition_violations += 1
            seen_task_ids.add(task_id)

            task_diff = decision["targetDifficulty"]
            difficulty_path.append(task_diff)

            # Synthesize synthetic candidate response outcome based on profile
            if candidate_profile == "expert":
                score = min(100.0, 85.0 + (task_diff * 2.0))
                validity = "correct"
                misconceptions = []
            elif candidate_profile == "struggling":
                score = max(20.0, 45.0 - (task_diff * 4.0))
                validity = "partially_correct" if score > 35 else "incorrect"
                misconceptions = [{"conceptName": "Locking Invariant Omission"}] if r_idx == 1 else []
            elif candidate_profile == "improver":
                score = min(95.0, 35.0 + (r_idx * 20.0))
                validity = "partially_correct" if r_idx == 1 else "correct"
                misconceptions = [{"conceptName": "Index Ordering"}] if r_idx == 1 else []
            else: # mixed
                score = 70.0
                validity = "correct"
                misconceptions = []

            score_path.append(score)

            # Record round
            round_record = {
                "roundIndex": r_idx,
                "definitionId": task_id,
                "taskTitle": task.get("title", ""),
                "competencyName": task.get("competency_name", ""),
                "skillName": task.get("skill_name", ""),
                "difficulty": task_diff,
                "overallScore": score,
                "alternativeValidity": validity,
                "adaptationDecision": decision
            }
            rounds_history.append(round_record)

            # Update latest eval
            latest_eval = {
                "overall_score": score,
                "alternative_validity": validity,
                "confidence_score": 0.88,
                "uncertainty_score": max(0.10, 0.40 - (r_idx * 0.08)),
                "teaching_payload": {
                    "misconceptions": misconceptions
                }
            }
            uncertainty_path.append(latest_eval["uncertainty_score"])

        # Final coverage
        assessed_competencies = set(r["competencyName"].lower() for r in rounds_history)
        coverage_ratio = len(assessed_competencies) / max(1, len(jd_competencies))

        return {
            "candidateProfile": candidate_profile,
            "roundsCompleted": num_rounds,
            "repetitionViolations": repetition_violations,
            "difficultyPath": difficulty_path,
            "scorePath": score_path,
            "uncertaintyPath": uncertainty_path,
            "uniqueTasksAttempted": len(seen_task_ids),
            "coverageRatio": round(coverage_ratio, 2),
            "uncertaintyStrictlyDecreased": uncertainty_path[-1] < uncertainty_path[0]
        }
