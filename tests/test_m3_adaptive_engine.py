"""
Unit and Monte Carlo Integration Tests for M03 Adaptive Continuous Work-Round Engine.
Phase 8/10: Bayesian Proficiency Tracking, Multi-Armed Adaptation Policies,
Misconception Remediation, Zero-Repetition, and Anti-Tunnel-Vision Guardrails.
"""

import unittest
from python_services.m3_task_intelligence.adaptive_engine import (
    BayesianProficiencyTracker,
    AdaptivePolicyEngine,
    AdaptiveMonteCarloSimulator
)

class TestM3AdaptiveEngine(unittest.TestCase):

    def setUp(self):
        self.mock_simulations = [
            {
                "id": "sim-tech-rate-limiter",
                "title": "Distributed Token Bucket Rate Limiter",
                "competency_name": "System Architecture & Concurrency",
                "skill_name": "Distributed Systems & Concurrency",
                "domain": "software",
                "simulation_type": "coding",
                "difficulty_level": 3
            },
            {
                "id": "sim-tech-api-relational-indexing",
                "title": "PostgreSQL Index Optimization & Execution Plan Analysis",
                "competency_name": "Database Architecture & Optimization",
                "skill_name": "Relational Indexing & MVCC",
                "domain": "software",
                "simulation_type": "coding",
                "difficulty_level": 3
            },
            {
                "id": "sim-tech-relational-indexing-diff4",
                "title": "High-Throughput Partitioning & Non-Blocking MVCC",
                "competency_name": "Database Architecture & Optimization",
                "skill_name": "Relational Indexing & MVCC",
                "domain": "software",
                "simulation_type": "coding",
                "difficulty_level": 4
            },
            {
                "id": "sim-tech-relational-indexing-diff2",
                "title": "Basic Single-Table B-Tree Indexing",
                "competency_name": "Database Architecture & Optimization",
                "skill_name": "Relational Indexing & MVCC",
                "domain": "software",
                "simulation_type": "coding",
                "difficulty_level": 2
            },
            {
                "id": "sim-finance-capex-allocation",
                "title": "CapEx ROI & Capital Allocation Under Inflation",
                "competency_name": "Financial Planning & Valuation",
                "skill_name": "Capital Budgeting & Valuation",
                "domain": "finance",
                "simulation_type": "financial_analysis",
                "difficulty_level": 3
            },
            {
                "id": "sim-healthcare-triage-priority",
                "title": "Emergency Department Surge & Triage Allocation",
                "competency_name": "Clinical Emergency Triage",
                "skill_name": "Emergency Triage & Patient Prioritization",
                "domain": "healthcare_admin",
                "simulation_type": "operational_triage",
                "difficulty_level": 3
            },
            {
                "id": "sim-data-pipeline-realtime",
                "title": "Streaming Event Pipeline & Dead-Letter Recovery",
                "competency_name": "Data Engineering & Analytics",
                "skill_name": "Real-Time Pipeline Engineering",
                "domain": "data",
                "simulation_type": "coding",
                "difficulty_level": 3
            }
        ]

        self.jd_competencies = [
            {"name": "System Architecture & Concurrency", "skillName": "Distributed Systems & Concurrency", "domain": "software"},
            {"name": "Database Architecture & Optimization", "skillName": "Relational Indexing & MVCC", "domain": "software"},
            {"name": "Financial Planning & Valuation", "skillName": "Capital Budgeting & Valuation", "domain": "finance"},
            {"name": "Clinical Emergency Triage", "skillName": "Emergency Triage & Patient Prioritization", "domain": "healthcare_admin"},
            {"name": "Data Engineering & Analytics", "skillName": "Real-Time Pipeline Engineering", "domain": "data"}
        ]

    def test_bayesian_proficiency_tracker_kalman_update(self):
        """Verifies Bayesian belief updating and monotonic uncertainty reduction."""
        tracker = BayesianProficiencyTracker(default_prior_mean=0.50, default_prior_var=0.16)
        
        initial = tracker.get_skill_belief("Relational Indexing & MVCC")
        self.assertEqual(initial["mean"], 0.50)
        self.assertEqual(initial["observations"], 0)
        self.assertAlmostEqual(initial["uncertainty"], 0.80, places=2)

        # High score observation
        updated = tracker.update_skill("Relational Indexing & MVCC", observed_score=0.90, confidence=0.95, validity="correct")
        self.assertGreater(updated["mean"], 0.50)
        self.assertLess(updated["uncertainty"], initial["uncertainty"])
        self.assertEqual(updated["observations"], 1)

        # Second observation strengthens confidence further
        second = tracker.update_skill("Relational Indexing & MVCC", observed_score=0.92, confidence=0.90, validity="correct")
        self.assertGreater(second["mean"], updated["mean"])
        self.assertLess(second["uncertainty"], updated["uncertainty"])
        self.assertEqual(second["observations"], 2)

    def test_adaptive_policy_misconception_remediation(self):
        """Verifies that an unaddressed diagnosed misconception triggers remediation policy."""
        previous_rounds = [
            {
                "roundIndex": 1,
                "definitionId": "sim-tech-api-relational-indexing",
                "taskTitle": "PostgreSQL Index Optimization",
                "competencyName": "Database Architecture & Optimization",
                "skillName": "Relational Indexing & MVCC",
                "difficulty": 3,
                "overallScore": 48.0,
                "alternativeValidity": "incomplete"
            }
        ]
        latest_eval = {
            "overall_score": 48.0,
            "alternative_validity": "incomplete",
            "confidence_score": 0.85,
            "uncertainty_score": 0.35,
            "teaching_payload": {
                "misconceptions": [
                    {"conceptName": "Locking Invariant Omission in Concurrent DDL"}
                ]
            }
        }

        res = AdaptivePolicyEngine.evaluate_next_step(
            candidate_context={"seniorityLevel": "senior"},
            job_context={"requiredCompetencies": self.jd_competencies},
            previous_rounds=previous_rounds,
            latest_evaluation=latest_eval,
            available_simulations=self.mock_simulations
        )

        decision = res["decision"]
        self.assertEqual(decision["reasonType"], "remediate_misconception")
        self.assertIn("misconception", decision["internalRationale"].lower())
        self.assertIn("Relational Indexing & MVCC", decision["targetSkill"])
        # Selected task must NOT be the same task id
        self.assertNotEqual(decision["selectedSimulationId"], "sim-tech-api-relational-indexing")

    def test_adaptive_policy_increase_difficulty_on_mastery(self):
        """Verifies difficulty elevation when candidate exhibits high proficiency and low uncertainty."""
        previous_rounds = [
            {
                "roundIndex": 1,
                "definitionId": "sim-tech-api-relational-indexing",
                "taskTitle": "PostgreSQL Index Optimization",
                "competencyName": "Database Architecture & Optimization",
                "skillName": "Relational Indexing & MVCC",
                "difficulty": 3,
                "overallScore": 92.0,
                "alternativeValidity": "correct"
            }
        ]
        latest_eval = {
            "overall_score": 92.0,
            "alternative_validity": "correct",
            "confidence_score": 0.95,
            "uncertainty_score": 0.15,
            "teaching_payload": {"misconceptions": []}
        }

        res = AdaptivePolicyEngine.evaluate_next_step(
            candidate_context={"seniorityLevel": "senior"},
            job_context={"requiredCompetencies": self.jd_competencies},
            previous_rounds=previous_rounds,
            latest_evaluation=latest_eval,
            available_simulations=self.mock_simulations
        )

        decision = res["decision"]
        self.assertEqual(decision["reasonType"], "increase_difficulty")
        self.assertGreaterEqual(decision["targetDifficulty"], 3)
        self.assertNotEqual(decision["selectedSimulationId"], "sim-tech-api-relational-indexing")

    def test_adaptive_policy_anti_tunnel_vision_guardrail(self):
        """Verifies that 2 consecutive rounds on the same competency triggers forced rotation."""
        previous_rounds = [
            {
                "roundIndex": 1,
                "definitionId": "sim-tech-api-relational-indexing",
                "competencyName": "Database Architecture & Optimization",
                "skillName": "Relational Indexing & MVCC",
                "difficulty": 3
            },
            {
                "roundIndex": 2,
                "definitionId": "sim-tech-relational-indexing-diff4",
                "competencyName": "Database Architecture & Optimization",
                "skillName": "Relational Indexing & MVCC",
                "difficulty": 4
            }
        ]
        latest_eval = {
            "overall_score": 88.0,
            "alternative_validity": "correct",
            "confidence_score": 0.90,
            "uncertainty_score": 0.20
        }

        res = AdaptivePolicyEngine.evaluate_next_step(
            candidate_context={"seniorityLevel": "senior"},
            job_context={"requiredCompetencies": self.jd_competencies},
            previous_rounds=previous_rounds,
            latest_evaluation=latest_eval,
            available_simulations=self.mock_simulations
        )

        decision = res["decision"]
        # Must rotate away from Database Architecture & Optimization
        self.assertNotEqual(decision["targetCompetency"], "Database Architecture & Optimization")
        self.assertEqual(decision["reasonType"], "broaden_coverage")
        self.assertIn("Anti-Tunnel-Vision", decision["internalRationale"])

    def test_zero_repetition_invariant(self):
        """Verifies that an already attempted task definition is strictly never repeated."""
        previous_rounds = [
            {"roundIndex": 1, "definitionId": "sim-tech-rate-limiter", "competencyName": "System Architecture & Concurrency"},
            {"roundIndex": 2, "definitionId": "sim-tech-api-relational-indexing", "competencyName": "Database Architecture & Optimization"}
        ]

        res = AdaptivePolicyEngine.evaluate_next_step(
            candidate_context={"seniorityLevel": "mid"},
            job_context={"requiredCompetencies": self.jd_competencies},
            previous_rounds=previous_rounds,
            latest_evaluation={"overall_score": 75.0, "alternative_validity": "correct"},
            available_simulations=self.mock_simulations
        )

        decision = res["decision"]
        self.assertNotIn(decision["selectedSimulationId"], ["sim-tech-rate-limiter", "sim-tech-api-relational-indexing"])

    def test_monte_carlo_trajectories_and_convergence(self):
        """Simulates 4 candidate archetypes over 5 rounds to verify convergence and zero repetition."""
        archetypes = ["expert", "struggling", "improver", "mixed"]
        
        for arch in archetypes:
            sim_res = AdaptiveMonteCarloSimulator.simulate_trajectory(
                candidate_profile=arch,
                num_rounds=4,
                available_sims=self.mock_simulations,
                jd_competencies=self.jd_competencies
            )

            self.assertEqual(sim_res["repetitionViolations"], 0, f"Repetition violation in {arch}")
            self.assertEqual(sim_res["uniqueTasksAttempted"], 4)
            self.assertGreaterEqual(sim_res["coverageRatio"], 0.60)
            self.assertTrue(sim_res["uncertaintyStrictlyDecreased"])

if __name__ == "__main__":
    unittest.main()
