"""
Universal Task Taxonomy & Archetype Registry for M03 Work Round Engine.
Defines extensible technical and non-technical task families, cognitive dimensions,
and supported task forms.
"""

from typing import List, Dict, Any, Optional

class TaskForm:
    DIRECT_PROBLEM = "direct_problem"
    SCENARIO = "scenario"
    CASE_STUDY = "case_study"
    DEBUGGING = "debugging"
    PRACTICAL_EXECUTION = "practical_execution"
    ANALYSIS = "analysis"
    SYSTEM_DESIGN = "system_design"
    WRITTEN_RESPONSE = "written_response"
    QUANTITATIVE_CALCULATION = "quantitative_calculation"
    STRATEGIC_DECISION = "strategic_decision"
    WHAT_IF_SIMULATION = "what_if_simulation"
    CONSTRAINT_SHIFT = "constraint_shift"
    ALTERNATIVE_EVALUATION = "alternative_evaluation"
    REASONING_EXPLANATION = "reasoning_explanation"
    ARTIFACT_CRITIQUE = "artifact_critique"
    ARTIFACT_IMPROVEMENT = "artifact_improvement"

    ALL_FORMS = [
        DIRECT_PROBLEM, SCENARIO, CASE_STUDY, DEBUGGING, PRACTICAL_EXECUTION,
        ANALYSIS, SYSTEM_DESIGN, WRITTEN_RESPONSE, QUANTITATIVE_CALCULATION,
        STRATEGIC_DECISION, WHAT_IF_SIMULATION, CONSTRAINT_SHIFT,
        ALTERNATIVE_EVALUATION, REASONING_EXPLANATION, ARTIFACT_CRITIQUE, ARTIFACT_IMPROVEMENT
    ]

class CognitiveDimension:
    KNOWLEDGE_APPLICATION = "knowledge_application"
    ANALYTICAL_REASONING = "analytical_reasoning"
    TECHNICAL_EXECUTION = "technical_execution"
    PROBLEM_SOLVING = "problem_solving"
    JUDGMENT_AND_TRADEOFFS = "judgment_and_tradeoffs"
    COMMUNICATION = "communication"
    CREATIVITY = "creativity"
    STRATEGIC_ALIGNMENT = "strategic_alignment"
    RISK_AND_ETHICS = "risk_and_ethics"
    ADAPTABILITY = "adaptability"
    PRACTICAL_PERFORMANCE = "practical_performance"

    ALL_DIMENSIONS = [
        KNOWLEDGE_APPLICATION, ANALYTICAL_REASONING, TECHNICAL_EXECUTION,
        PROBLEM_SOLVING, JUDGMENT_AND_TRADEOFFS, COMMUNICATION, CREATIVITY,
        STRATEGIC_ALIGNMENT, RISK_AND_ETHICS, ADAPTABILITY, PRACTICAL_PERFORMANCE
    ]

class TaskFamily:
    # Technical Families
    CODING = "coding"
    DEBUGGING = "debugging"
    CODE_REVIEW = "code_review"
    ALGORITHMS = "algorithms"
    SQL_DATA = "sql_data"
    DATA_ANALYSIS = "data_analysis"
    SYSTEM_DESIGN = "system_design"
    CLOUD_INFRASTRUCTURE = "cloud_infrastructure"
    CYBERSECURITY = "cybersecurity"
    TROUBLESHOOTING = "troubleshooting"
    TECHNICAL_DOCS = "technical_docs"
    CONFIGURATION = "configuration"

    # Non-Technical Families
    FINANCIAL_MODELING = "financial_modeling"
    OPERATIONS_MANAGEMENT = "operations_management"
    MARKETING_STRATEGY = "marketing_strategy"
    SALES_ENABLEMENT = "sales_enablement"
    HR_PEOPLE = "hr_people"
    CUSTOMER_SUCCESS = "customer_success"
    PROCUREMENT_VENDOR = "procurement_vendor"
    LEGAL_COMPLIANCE = "legal_compliance"
    PROJECT_MANAGEMENT = "project_management"
    EXECUTIVE_DECISION = "executive_decision"

    TECHNICAL_FAMILIES = [
        CODING, DEBUGGING, CODE_REVIEW, ALGORITHMS, SQL_DATA, DATA_ANALYSIS,
        SYSTEM_DESIGN, CLOUD_INFRASTRUCTURE, CYBERSECURITY, TROUBLESHOOTING,
        TECHNICAL_DOCS, CONFIGURATION
    ]

    NON_TECHNICAL_FAMILIES = [
        FINANCIAL_MODELING, OPERATIONS_MANAGEMENT, MARKETING_STRATEGY,
        SALES_ENABLEMENT, HR_PEOPLE, CUSTOMER_SUCCESS, PROCUREMENT_VENDOR,
        LEGAL_COMPLIANCE, PROJECT_MANAGEMENT, EXECUTIVE_DECISION
    ]


class TaskTaxonomy:
    """Provides taxonomy lookups, modality mappings, and archetype resolution."""

    DOMAIN_MODALITY_MAP = {
        "software": "coding",
        "engineering": "coding",
        "data": "data_analysis",
        "ai": "coding",
        "finance": "financial_analysis",
        "accounting": "financial_analysis",
        "operations": "operational_triage",
        "healthcare": "operational_triage",
        "legal": "written_communication",
        "procurement": "written_communication",
        "marketing": "written_communication",
        "management": "operational_triage"
    }

    FORM_COGNITIVE_AFFINITY = {
        TaskForm.DIRECT_PROBLEM: [CognitiveDimension.KNOWLEDGE_APPLICATION, CognitiveDimension.TECHNICAL_EXECUTION],
        TaskForm.SCENARIO: [CognitiveDimension.PROBLEM_SOLVING, CognitiveDimension.JUDGMENT_AND_TRADEOFFS, CognitiveDimension.ADAPTABILITY],
        TaskForm.CASE_STUDY: [CognitiveDimension.ANALYTICAL_REASONING, CognitiveDimension.STRATEGIC_ALIGNMENT, CognitiveDimension.COMMUNICATION],
        TaskForm.DEBUGGING: [CognitiveDimension.PROBLEM_SOLVING, CognitiveDimension.TECHNICAL_EXECUTION, CognitiveDimension.ANALYTICAL_REASONING],
        TaskForm.PRACTICAL_EXECUTION: [CognitiveDimension.TECHNICAL_EXECUTION, CognitiveDimension.PRACTICAL_PERFORMANCE],
        TaskForm.ANALYSIS: [CognitiveDimension.ANALYTICAL_REASONING, CognitiveDimension.KNOWLEDGE_APPLICATION],
        TaskForm.SYSTEM_DESIGN: [CognitiveDimension.JUDGMENT_AND_TRADEOFFS, CognitiveDimension.STRATEGIC_ALIGNMENT, CognitiveDimension.CREATIVITY],
        TaskForm.WRITTEN_RESPONSE: [CognitiveDimension.COMMUNICATION, CognitiveDimension.ANALYTICAL_REASONING],
        TaskForm.QUANTITATIVE_CALCULATION: [CognitiveDimension.TECHNICAL_EXECUTION, CognitiveDimension.ANALYTICAL_REASONING],
        TaskForm.STRATEGIC_DECISION: [CognitiveDimension.JUDGMENT_AND_TRADEOFFS, CognitiveDimension.STRATEGIC_ALIGNMENT, CognitiveDimension.RISK_AND_ETHICS],
        TaskForm.WHAT_IF_SIMULATION: [CognitiveDimension.ADAPTABILITY, CognitiveDimension.ANALYTICAL_REASONING],
        TaskForm.CONSTRAINT_SHIFT: [CognitiveDimension.ADAPTABILITY, CognitiveDimension.PROBLEM_SOLVING],
        TaskForm.ALTERNATIVE_EVALUATION: [CognitiveDimension.JUDGMENT_AND_TRADEOFFS, CognitiveDimension.ANALYTICAL_REASONING],
        TaskForm.REASONING_EXPLANATION: [CognitiveDimension.COMMUNICATION, CognitiveDimension.KNOWLEDGE_APPLICATION],
        TaskForm.ARTIFACT_CRITIQUE: [CognitiveDimension.ANALYTICAL_REASONING, CognitiveDimension.RISK_AND_ETHICS],
        TaskForm.ARTIFACT_IMPROVEMENT: [CognitiveDimension.TECHNICAL_EXECUTION, CognitiveDimension.CREATIVITY]
    }

    @classmethod
    def resolve_modality(cls, domain: str, role_title: str) -> str:
        """Resolves active work surface modality from domain and role strings."""
        domain_lower = (domain or "").lower()
        role_lower = (role_title or "").lower()

        for key, modality in cls.DOMAIN_MODALITY_MAP.items():
            if key in domain_lower or key in role_lower:
                return modality
        
        if "finance" in role_lower or "budget" in role_lower or "analyst" in role_lower:
            return "financial_analysis"
        if "triage" in role_lower or "nurse" in role_lower or "operations" in role_lower:
            return "operational_triage"
        if "data" in role_lower or "sql" in role_lower:
            return "data_analysis"
        if "legal" in role_lower or "contract" in role_lower or "procurement" in role_lower:
            return "written_communication"

        return "coding"

    @classmethod
    def get_cognitive_dimensions_for_form(cls, form: str) -> List[str]:
        """Returns primary cognitive operations triggered by a task form."""
        return cls.FORM_COGNITIVE_AFFINITY.get(form, [
            CognitiveDimension.PROBLEM_SOLVING,
            CognitiveDimension.TECHNICAL_EXECUTION
        ])
