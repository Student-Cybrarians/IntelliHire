"""
Comprehensive Unit & Integration Test Suite for M03 Universal Task Intelligence.
Covers relevance, diversity, duplicate prevention, competency targeting,
seniority scaling across 7 tiers, missing context, invalid output handling, and safety.
"""

import unittest
import sys
import os

# Add scratch root to python path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from python_services.m3_task_intelligence.taxonomy import (
    TaskTaxonomy, TaskForm, CognitiveDimension, TaskFamily
)
from python_services.m3_task_intelligence.seniority_scaler import SeniorityScaler
from python_services.m3_task_intelligence.repetition_detector import RepetitionDetector
from python_services.m3_task_intelligence.diversity_scorer import DiversityScorer
from python_services.m3_task_intelligence.quality_evaluator import QualityEvaluator
from python_services.m3_task_intelligence.task_synthesizer import TaskSynthesizer
from python_services.m3_task_intelligence.engine import TaskIntelligenceEngine

class TestM3UniversalTaskIntelligence(unittest.TestCase):

    def setUp(self):
        self.mock_context = {
            "contextId": "ctx-test-1",
            "candidateContext": {
                "userId": "usr-cand-1",
                "targetRole": "Staff Distributed Systems Engineer",
                "seniorityLevel": "lead",
                "targetDomainId": "software"
            },
            "jobContext": {
                "jobTitle": "Staff Distributed Systems Engineer",
                "targetSeniority": "lead",
                "keyRequirements": ["High throughput consensus", "Zero downtime deployments"]
            },
            "roleContext": {
                "roleTitle": "Staff Distributed Systems Engineer",
                "domain": "software",
                "seniorityLevel": "lead",
                "requiredCompetencies": [
                    {"name": "Concurrency & Distributed Systems", "priority": "mandatory"}
                ]
            },
            "prioritizedTargets": [
                {
                    "name": "Systems Architecture & Concurrency",
                    "skillName": "Concurrency & Distributed Systems",
                    "targetingScore": 0.88,
                    "diagnosisSource": "m02_assessment_gap"
                },
                {
                    "name": "Cloud, Edge & Distributed Systems",
                    "skillName": "Cloudflare Workers & Edge Execution",
                    "targetingScore": 0.72,
                    "diagnosisSource": "baseline_target"
                }
            ],
            "primaryRecommendedTarget": {
                "name": "Systems Architecture & Concurrency",
                "skillName": "Concurrency & Distributed Systems",
                "targetingScore": 0.88
            }
        }

    # 1. Relevance Test
    def test_task_relevance(self):
        task = TaskIntelligenceEngine.get_next_task(self.mock_context)
        self.assertIsNotNone(task)
        self.assertIn("Distributed", task["title"])
        self.assertEqual(task["modality"], "coding")
        self.assertEqual(task["competencyTarget"]["skillName"], "Concurrency & Distributed Systems")
        self.assertEqual(task["coreModel"]["input"], task["scenario"]["background"])

    # 2. Competency Targeting Test
    def test_competency_targeting(self):
        # Target must match highest priority target from context
        task = TaskIntelligenceEngine.get_next_task(self.mock_context)
        self.assertEqual(task["competencyTarget"]["name"], "Systems Architecture & Concurrency")

    # 3. Duplicate Prevention Test
    def test_duplicate_prevention(self):
        first_task = TaskIntelligenceEngine.get_next_task(self.mock_context)
        fp1 = first_task["repetitionFingerprint"]
        
        # Verify duplicate detector catches exact match
        is_dup, score, reason = RepetitionDetector.is_duplicate(first_task, [first_task])
        self.assertTrue(is_dup)
        self.assertAlmostEqual(score, 1.0)

        # Getting next task passing previous tasks should yield a different task or form
        second_task = TaskIntelligenceEngine.get_next_task(self.mock_context, previous_tasks=[first_task])
        self.assertNotEqual(first_task["id"], second_task["id"])
        is_second_dup, _, _ = RepetitionDetector.is_duplicate(second_task, [first_task])
        self.assertFalse(is_second_dup)

    # 4. Seniority Scaling Across All 7 Tiers
    def test_seniority_scaling_all_tiers(self):
        base_archetype = TaskSynthesizer.ARCHETYPES[0]
        tiers = ["entry", "junior", "mid", "senior", "lead", "manager", "executive"]
        
        for tier in tiers:
            scaled = SeniorityScaler.scale_task(base_archetype, tier)
            scope = scaled["seniorityScope"]
            self.assertEqual(scope["level"], tier)
            self.assertGreater(scope["complexityFactor"], 0.9)
            
            # Constraints and rubrics must differ meaningfully
            constraints = scaled["scenario"]["operationalConstraints"]
            self.assertGreaterEqual(len(constraints), 2)
            
            if tier in ("senior", "lead"):
                self.assertEqual(scope["ambiguityLevel"], "high")
                # Architecture or trade-offs must be evaluated
                dim_names = [d["name"] for d in scaled["rubric"]["dimensions"]]
                self.assertTrue("architecture" in dim_names or "resilience" in dim_names)
            elif tier == "executive":
                self.assertEqual(scope["systemScope"], "enterprise_strategic")

    # 5. Non-Technical Task Domains Test
    def test_non_technical_task_synthesis(self):
        fin_context = {
            "candidateContext": {"targetRole": "Senior Financial Analyst", "seniorityLevel": "senior", "targetDomainId": "finance"},
            "roleContext": {"roleTitle": "Senior Financial Analyst", "domain": "finance", "seniorityLevel": "senior"},
            "prioritizedTargets": [
                {"name": "Financial Planning & Valuation", "skillName": "Capital Budgeting & Valuation", "targetingScore": 0.85}
            ]
        }
        fin_task = TaskIntelligenceEngine.get_next_task(fin_context)
        self.assertEqual(fin_task["modality"], "financial_analysis")
        self.assertEqual(fin_task["taskFamily"], TaskFamily.FINANCIAL_MODELING)
        self.assertEqual(fin_task["taskForm"], TaskForm.QUANTITATIVE_CALCULATION)

        ops_context = {
            "candidateContext": {"targetRole": "Clinical Operations Manager", "seniorityLevel": "manager", "targetDomainId": "operations"},
            "roleContext": {"roleTitle": "Clinical Operations Manager", "domain": "operations", "seniorityLevel": "manager"},
            "prioritizedTargets": [
                {"name": "Operations & Patient Acuity Triage", "skillName": "Clinical Workflow & Resource Allocation", "targetingScore": 0.91}
            ]
        }
        ops_task = TaskIntelligenceEngine.get_next_task(ops_context)
        self.assertEqual(ops_task["modality"], "operational_triage")
        self.assertEqual(ops_task["taskFamily"], TaskFamily.OPERATIONS_MANAGEMENT)

    # 6. Diversity & Shannon Entropy Test
    def test_diversity_and_entropy_scoring(self):
        tasks = [
            {"taskForm": TaskForm.PRACTICAL_EXECUTION, "taskFamily": TaskFamily.CODING, "cognitiveDimensions": [CognitiveDimension.TECHNICAL_EXECUTION]},
            {"taskForm": TaskForm.SCENARIO, "taskFamily": TaskFamily.OPERATIONS_MANAGEMENT, "cognitiveDimensions": [CognitiveDimension.PROBLEM_SOLVING, CognitiveDimension.ADAPTABILITY]},
            {"taskForm": TaskForm.QUANTITATIVE_CALCULATION, "taskFamily": TaskFamily.FINANCIAL_MODELING, "cognitiveDimensions": [CognitiveDimension.ANALYTICAL_REASONING]}
        ]
        analysis = DiversityScorer.analyze_task_history(tasks)
        self.assertGreater(analysis["shannon_entropy_dimensions"], 0.5)
        self.assertGreater(analysis["normalized_cognitive_diversity"], 0.2)
        self.assertTrue(len(analysis["recommended_next_task_forms"]) > 0)

    # 7. Quality Evaluator Structural Soundness Test
    def test_quality_evaluation_valid_task(self):
        task = TaskIntelligenceEngine.get_next_task(self.mock_context)
        res = QualityEvaluator.evaluate_quality(task)
        self.assertTrue(res["is_valid"])
        self.assertGreaterEqual(res["overall_quality_score"], 0.70)
        self.assertEqual(res["structural_errors"], [])

    # 8. Invalid AI Output Handling Test
    def test_invalid_task_detection(self):
        malformed_task = {
            "id": "bad-task-1",
            "modality": "coding",
            "scenario": {
                "background": "something",
                # missing objective
                "initialRequirements": []
            },
            "rubric": {
                "dimensions": [{"name": "crit", "weight": 0.2}] # weights do not sum to 1.0
            }
        }
        valid, errors = QualityEvaluator.validate_structure(malformed_task)
        self.assertFalse(valid)
        self.assertGreater(len(errors), 0)

    # 9. Safety & Protected Attribute Stripping Test
    def test_safety_check(self):
        safe_task = TaskIntelligenceEngine.get_next_task(self.mock_context)
        safe, violations = QualityEvaluator.safety_check(safe_task)
        self.assertTrue(safe)
        self.assertEqual(violations, [])

        # Inject demographic attribute
        unsafe_task = dict(safe_task)
        unsafe_task["scenario"] = dict(safe_task["scenario"])
        unsafe_task["scenario"]["background"] += " The candidate must be under 30 years of age."
        unsafe, unsafe_violations = QualityEvaluator.safety_check(unsafe_task)
        self.assertFalse(unsafe)
        self.assertIn("age", str(unsafe_violations))

    # 10. Missing Context Fallback Test
    def test_missing_context_fallback(self):
        empty_context = {}
        task = TaskIntelligenceEngine.get_next_task(empty_context)
        self.assertIsNotNone(task)
        self.assertEqual(task["modality"], "coding")
        self.assertTrue(task["id"].startswith("task-synth-"))

    # 11. Modality Resolution Test
    def test_taxonomy_modality_resolution(self):
        self.assertEqual(TaskTaxonomy.resolve_modality("software", "Software Engineer"), "coding")
        self.assertEqual(TaskTaxonomy.resolve_modality("finance", "Portfolio Manager"), "financial_analysis")
        self.assertEqual(TaskTaxonomy.resolve_modality("healthcare", "Triage Nurse"), "operational_triage")
        self.assertEqual(TaskTaxonomy.resolve_modality("legal", "Corporate Counsel"), "written_communication")

    # 12. Single Task Delivery Invariant
    def test_single_task_delivery(self):
        # The engine must return exactly ONE structured task object, not an array of hundreds
        task = TaskIntelligenceEngine.get_next_task(self.mock_context)
        self.assertIsInstance(task, dict)
        self.assertIn("coreModel", task)
        self.assertIn("scenario", task)
        self.assertIn("rubric", task)

if __name__ == "__main__":
    unittest.main()
