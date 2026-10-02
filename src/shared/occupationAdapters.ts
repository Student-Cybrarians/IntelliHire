/**
 * Pluggable Occupation Adapters Interface & Implementations
 * IntelliHire M2 Universal Evidence & Competency Assessment Engine
 * Phase 2 - Prompt 16
 * 
 * Supports pluggable adapters for:
 * 1. technical
 * 2. finance
 * 3. healthcare
 * 4. education
 * 5. sales
 * 6. operations
 * 7. professional_services
 * 8. skilled_work
 * 
 * Invariant: Pluggable registry pattern - zero hardcoded monolithic role conditionals.
 */

import { SeniorityLevel, AssessmentPurpose } from './evidenceStrategy';
import { CanonicalModalityId } from './modalityRegistry';

export interface OccupationDomainContext {
  role_title?: string;
  occupation_name?: string;
  occupation_code?: string;
  industry?: string;
}

export interface DomainEvidenceRequirement {
  requiredEvidence: string;
  evaluationCriteria: string[];
  criticalTradeOffs: string[];
  antiPatterns: string[];
}

export interface ModalityRecommendation {
  primary: CanonicalModalityId;
  alternatives: CanonicalModalityId[];
  rationale: string;
}

/**
 * Pluggable Occupation Adapter Interface
 */
export interface OccupationAdapter {
  readonly domainId: string;
  readonly displayName: string;
  readonly description: string;
  readonly standardTaxonomies: string[];
  readonly regulatoryFrameworks: string[];

  matches(context: OccupationDomainContext): boolean;

  getPreferredModalities(
    seniority: SeniorityLevel,
    purpose: AssessmentPurpose
  ): ModalityRecommendation;

  getDomainEvidenceRequirement(
    competencyName: string,
    seniority: SeniorityLevel
  ): DomainEvidenceRequirement;

  getAccessibilityAccommodations(): string[];
}

/**
 * 1. Technical & Engineering Adapter
 */
export class TechnicalOccupationAdapter implements OccupationAdapter {
  readonly domainId = 'technical';
  readonly displayName = 'Technical & Software Engineering';
  readonly description = 'Software engineering, cloud infrastructure, cybersecurity, devops, and data systems.';
  readonly standardTaxonomies = ['O*NET 15-1252.00', 'ESCO 2512', 'SFIA v8'];
  readonly regulatoryFrameworks = ['SOC 2', 'ISO 27001', 'GDPR', 'OWASP'];

  matches(context: OccupationDomainContext): boolean {
    const text = `${context.role_title || ''} ${context.occupation_name || ''} ${context.industry || ''}`.toLowerCase();
    return /(software|developer|engineer|devops|cloud|sre|architect|python|react|java|backend|frontend|fullstack|cybersecurity|data engineer|database)/i.test(text);
  }

  getPreferredModalities(seniority: SeniorityLevel, _purpose: AssessmentPurpose): ModalityRecommendation {
    if (['foundation', 'junior', 'mid'].includes(seniority)) {
      return {
        primary: 'coding',
        alternatives: ['reasoning', 'knowledge_question'],
        rationale: 'Early-to-mid technical roles require direct code execution and algorithmic syntax verification.',
      };
    }
    return {
      primary: 'scenario',
      alternatives: ['coding', 'reasoning'],
      rationale: 'Senior-to-executive technical roles require architectural scenario evaluation and fault-tolerance trade-offs.',
    };
  }

  getDomainEvidenceRequirement(competencyName: string, seniority: SeniorityLevel): DomainEvidenceRequirement {
    return {
      requiredEvidence: `Working code or system architecture trace demonstrating execution standards in ${competencyName}.`,
      evaluationCriteria: ['Algorithmic correctness', 'Edge-case handling', 'Memory/CPU efficiency', 'Clean abstraction & maintainability'],
      criticalTradeOffs: ['Latency vs throughput', 'Consistency vs availability', 'Developer velocity vs technical debt'],
      antiPatterns: ['Brittle non-defensive assumptions', 'Ignoring network partition failure modes', 'Cargo-cult framework dependency'],
    };
  }

  getAccessibilityAccommodations(): string[] {
    return ['plain_text_code_fallback', 'extended_time', 'screen_reader_friendly_ide'];
  }
}

/**
 * 2. Finance & Accounting Adapter
 */
export class FinanceOccupationAdapter implements OccupationAdapter {
  readonly domainId = 'finance';
  readonly displayName = 'Finance, Audit & Accounting';
  readonly description = 'Corporate finance, auditing, tax compliance, treasury, investment banking, and actuarial analysis.';
  readonly standardTaxonomies = ['O*NET 13-2011.00', 'ESCO 2411', 'SOC 13-2051'];
  readonly regulatoryFrameworks = ['SOX', 'GAAP', 'IFRS', 'FINRA', 'SEC Regulations'];

  matches(context: OccupationDomainContext): boolean {
    const text = `${context.role_title || ''} ${context.occupation_name || ''} ${context.industry || ''}`.toLowerCase();
    return /(accountant|audit|finance|financial|tax|treasury|controller|banking|actuary|payroll|cpa)/i.test(text);
  }

  getPreferredModalities(seniority: SeniorityLevel, _purpose: AssessmentPurpose): ModalityRecommendation {
    if (['foundation', 'junior'].includes(seniority)) {
      return {
        primary: 'structured_response',
        alternatives: ['knowledge_question', 'reasoning'],
        rationale: 'Junior financial professionals require structured tabular reconciliation and rule-based verification.',
      };
    }
    return {
      primary: 'reasoning',
      alternatives: ['scenario', 'structured_response'],
      rationale: 'Senior financial professionals require structured reasoning defending audit findings, tax posture, and valuation models.',
    };
  }

  getDomainEvidenceRequirement(competencyName: string, _seniority: SeniorityLevel): DomainEvidenceRequirement {
    return {
      requiredEvidence: `Quantitative reconciliation, ledger audit trail, and regulatory risk rationale for ${competencyName}.`,
      evaluationCriteria: ['Mathematical accuracy', 'Compliance with GAAP/IFRS standards', 'Audit trail transparency', 'Risk containment'],
      criticalTradeOffs: ['Conservative provision vs aggressive growth', 'Liquidity preservation vs yield optimization'],
      antiPatterns: ['Unbalanced reconciliation entries', 'Ambiguous journal notes', 'Circumventing dual-authorization controls'],
    };
  }

  getAccessibilityAccommodations(): string[] {
    return ['accessible_data_tables', 'high_contrast_formatting', 'extended_time'];
  }
}

/**
 * 3. Healthcare & Clinical Adapter
 */
export class HealthcareOccupationAdapter implements OccupationAdapter {
  readonly domainId = 'healthcare';
  readonly displayName = 'Healthcare & Clinical Medicine';
  readonly description = 'Nursing, medical diagnosis, pharmacology, patient triage, clinical therapy, and medical compliance.';
  readonly standardTaxonomies = ['O*NET 29-1141.00', 'ESCO 2221', 'SOC 29-1123'];
  readonly regulatoryFrameworks = ['HIPAA', 'Joint Commission', 'FDA Good Clinical Practice', 'State Nursing Boards'];

  matches(context: OccupationDomainContext): boolean {
    const text = `${context.role_title || ''} ${context.occupation_name || ''} ${context.industry || ''}`.toLowerCase();
    return /(nurse|doctor|physician|clinical|medical|patient|health|pharmacist|therapist|triage|hospital|ems)/i.test(text);
  }

  getPreferredModalities(_seniority: SeniorityLevel, _purpose: AssessmentPurpose): ModalityRecommendation {
    return {
      primary: 'scenario',
      alternatives: ['reasoning', 'structured_response'],
      rationale: 'Clinical medicine demands dynamic scenario evaluation testing patient triage and immediate intervention under uncertainty.',
    };
  }

  getDomainEvidenceRequirement(competencyName: string, _seniority: SeniorityLevel): DomainEvidenceRequirement {
    return {
      requiredEvidence: `Clinical reasoning trajectory detailing differential diagnosis, patient stabilization steps, and escalation protocol for ${competencyName}.`,
      evaluationCriteria: ['Patient safety primacy', 'Differential diagnostic rigor', 'Protocol adherence under stress', 'Interdisciplinary communication'],
      criticalTradeOffs: ['Immediate stabilization vs definitive root-cause diagnosis', 'Aggressive intervention vs watchful waiting'],
      antiPatterns: ['Premature diagnostic closure', 'Violating aseptic standards', 'Delayed escalation of deteriorating vital signs'],
    };
  }

  getAccessibilityAccommodations(): string[] {
    return ['speech_to_text_dictation', 'screen_reader_friendly', 'reduced_sensory_distraction'];
  }
}

/**
 * 4. Education & Pedagogy Adapter
 */
export class EducationOccupationAdapter implements OccupationAdapter {
  readonly domainId = 'education';
  readonly displayName = 'Education, Pedagogy & Instruction';
  readonly description = 'Classroom teaching, instructional design, curriculum development, student mentoring, and educational technology.';
  readonly standardTaxonomies = ['O*NET 25-2021.00', 'ESCO 2320', 'SOC 25-3099'];
  readonly regulatoryFrameworks = ['FERPA', 'IDEA', 'Title IX', 'State Department of Education Standards'];

  matches(context: OccupationDomainContext): boolean {
    const text = `${context.role_title || ''} ${context.occupation_name || ''} ${context.industry || ''}`.toLowerCase();
    return /(teacher|educator|professor|instructor|pedagogy|curriculum|instructional design|academic|tutor)/i.test(text);
  }

  getPreferredModalities(_seniority: SeniorityLevel, _purpose: AssessmentPurpose): ModalityRecommendation {
    return {
      primary: 'scenario',
      alternatives: ['structured_response', 'reasoning'],
      rationale: 'Educational roles require scenario evaluation simulating classroom management, differentiated learning, and parent-student engagement.',
    };
  }

  getDomainEvidenceRequirement(competencyName: string, _seniority: SeniorityLevel): DomainEvidenceRequirement {
    return {
      requiredEvidence: `Lesson plan design, scaffolded instructional intervention, and student assessment rubric for ${competencyName}.`,
      evaluationCriteria: ['Differentiated learning accommodation', 'Formative check-for-understanding frequency', 'Engagement scaffolding', 'FERPA privacy adherence'],
      criticalTradeOffs: ['Breadth of syllabus coverage vs mastery depth', 'Standardized test prep vs experiential learning'],
      antiPatterns: ['One-size-fits-all instruction', 'Punitively addressing student confusion', 'Unclear assessment rubrics'],
    };
  }

  getAccessibilityAccommodations(): string[] {
    return ['captioned_media', 'screen_reader_friendly', 'text_to_speech'];
  }
}

/**
 * 5. Sales & Business Development Adapter
 */
export class SalesOccupationAdapter implements OccupationAdapter {
  readonly domainId = 'sales';
  readonly displayName = 'Sales & Revenue Operations';
  readonly description = 'Enterprise sales, account management, business development, client negotiation, and revenue enablement.';
  readonly standardTaxonomies = ['O*NET 41-3031.02', 'ESCO 3322', 'SOC 41-4011'];
  readonly regulatoryFrameworks = ['FTC Commercial Regulations', 'FCPA Anti-Bribery', 'GDPR/CAN-SPAM Marketing Laws'];

  matches(context: OccupationDomainContext): boolean {
    const text = `${context.role_title || ''} ${context.occupation_name || ''} ${context.industry || ''}`.toLowerCase();
    return /(sales|account executive|business development|bdr|sdr|account manager|revenue operations|growth|commercial manager)/i.test(text);
  }

  getPreferredModalities(_seniority: SeniorityLevel, _purpose: AssessmentPurpose): ModalityRecommendation {
    return {
      primary: 'scenario',
      alternatives: ['structured_response', 'reasoning'],
      rationale: 'Sales professionals require branching scenario assessments evaluating discovery probing, objection handling, and consultative closing.',
    };
  }

  getDomainEvidenceRequirement(competencyName: string, _seniority: SeniorityLevel): DomainEvidenceRequirement {
    return {
      requiredEvidence: `Discovery dialogue script, customer value proposition analysis, and objection resolution sequence for ${competencyName}.`,
      evaluationCriteria: ['Customer pain discovery depth', 'Value alignment vs product feature dumping', 'Negotiation elasticity', 'Pipeline velocity awareness'],
      criticalTradeOffs: ['Discounting for immediate quarter-end close vs contract lifetime value', 'Focus on new customer acquisition vs existing expansion'],
      antiPatterns: ['Over-promising unbuilt roadmap features', 'Failing to qualify economic buyer authority', 'Aggressive high-pressure tactics'],
    };
  }

  getAccessibilityAccommodations(): string[] {
    return ['accessible_text_chat', 'dictation_support', 'extended_time'];
  }
}

/**
 * 6. Operations & Supply Chain Adapter
 */
export class OperationsOccupationAdapter implements OccupationAdapter {
  readonly domainId = 'operations';
  readonly displayName = 'Operations, Logistics & Supply Chain';
  readonly description = 'Supply chain logistics, warehouse operations, procurement, operational excellence, and project delivery.';
  readonly standardTaxonomies = ['O*NET 11-1021.00', 'ESCO 1324', 'SOC 11-3051'];
  readonly regulatoryFrameworks = ['OSHA', 'Lean Six Sigma', 'ISO 9001 Quality Management', 'DOT Transportation Safety'];

  matches(context: OccupationDomainContext): boolean {
    const text = `${context.role_title || ''} ${context.occupation_name || ''} ${context.industry || ''}`.toLowerCase();
    return /(operations|logistics|supply chain|warehouse|procurement|scrum master|project manager|program manager|fulfillment)/i.test(text);
  }

  getPreferredModalities(seniority: SeniorityLevel, _purpose: AssessmentPurpose): ModalityRecommendation {
    if (['foundation', 'junior'].includes(seniority)) {
      return {
        primary: 'structured_response',
        alternatives: ['knowledge_question', 'scenario'],
        rationale: 'Junior operational roles focus on structured process workflows, checklist verification, and inventory tracking.',
      };
    }
    return {
      primary: 'scenario',
      alternatives: ['reasoning', 'structured_response'],
      rationale: 'Senior operations leaders require dynamic scenarios testing bottleneck mitigation, supply disruption, and contingency dispatching.',
    };
  }

  getDomainEvidenceRequirement(competencyName: string, _seniority: SeniorityLevel): DomainEvidenceRequirement {
    return {
      requiredEvidence: `Bottleneck diagnosis, capacity modeling schedule, and incident recovery plan for ${competencyName}.`,
      evaluationCriteria: ['Throughput efficiency', 'Safety adherence under quota pressure', 'Cross-functional dependency management', 'Inventory cost containment'],
      criticalTradeOffs: ['Just-in-time lean inventory vs buffer stock resilience', 'Overtime surge labor vs delivery deadline extension'],
      antiPatterns: ['Ignoring safety warnings to meet shift targets', 'Failure to trace upstream material shortages', 'Siloed escalation delay'],
    };
  }

  getAccessibilityAccommodations(): string[] {
    return ['accessible_workflow_diagrams', 'keyboard_navigation', 'extended_time'];
  }
}

/**
 * 7. Professional Services, Consulting & Legal Adapter
 */
export class ProfessionalServicesOccupationAdapter implements OccupationAdapter {
  readonly domainId = 'professional_services';
  readonly displayName = 'Professional Services, Strategy & Legal';
  readonly description = 'Management consulting, corporate legal counsel, human resources, organizational design, and advisory services.';
  readonly standardTaxonomies = ['O*NET 13-1111.00', 'ESCO 2421', 'SOC 23-1011'];
  readonly regulatoryFrameworks = ['Bar Association Ethics', 'EEOC Compliance', 'FLSA', 'Client Confidentiality Privilege'];

  matches(context: OccupationDomainContext): boolean {
    const text = `${context.role_title || ''} ${context.occupation_name || ''} ${context.industry || ''}`.toLowerCase();
    return /(consultant|consulting|strategy|legal|attorney|counsel|lawyer|contracts|human resources|hr business partner|hrbp)/i.test(text);
  }

  getPreferredModalities(_seniority: SeniorityLevel, _purpose: AssessmentPurpose): ModalityRecommendation {
    return {
      primary: 'reasoning',
      alternatives: ['scenario', 'structured_response'],
      rationale: 'Consulting and advisory roles demand structured reasoning articulating stakeholder synthesis, risk appraisal, and executive recommendations.',
    };
  }

  getDomainEvidenceRequirement(competencyName: string, _seniority: SeniorityLevel): DomainEvidenceRequirement {
    return {
      requiredEvidence: `Issue tree decomposition, legal risk analysis memorandum, and synthesized executive briefing for ${competencyName}.`,
      evaluationCriteria: ['MECE analytical rigor', 'Precision of legal/contractual terminology', 'Stakeholder political sensitivity', 'Actionable executive synthesis'],
      criticalTradeOffs: ['Comprehensive risk elimination vs commercial deal velocity', 'Strict legal exposure avoidance vs business enablement'],
      antiPatterns: ['Unstructured stream-of-consciousness advice', 'Ambiguous clause phrasing', 'Failure to cite statutory authority'],
    };
  }

  getAccessibilityAccommodations(): string[] {
    return ['screen_reader_friendly', 'extended_time', 'dictation_support'];
  }
}

/**
 * 8. Skilled Work, Technical Trades & Field Service Adapter
 */
export class SkilledWorkOccupationAdapter implements OccupationAdapter {
  readonly domainId = 'skilled_work';
  readonly displayName = 'Skilled Trades & Field Technical Work';
  readonly description = 'Electrical, HVAC, mechanical maintenance, precision manufacturing, plumbing, and physical field service.';
  readonly standardTaxonomies = ['O*NET 47-2111.00', 'ESCO 7126', 'SOC 49-9021'];
  readonly regulatoryFrameworks = ['OSHA General Industry / Construction', 'National Electrical Code (NEC)', 'EPA Section 608'];

  matches(context: OccupationDomainContext): boolean {
    const text = `${context.role_title || ''} ${context.occupation_name || ''} ${context.industry || ''}`.toLowerCase();
    return /(technician|electrician|hvac|mechanic|carpentry|plumber|maintenance|field service|assembly|welder|machinist)/i.test(text);
  }

  getPreferredModalities(seniority: SeniorityLevel, _purpose: AssessmentPurpose): ModalityRecommendation {
    if (['foundation', 'junior'].includes(seniority)) {
      return {
        primary: 'knowledge_question',
        alternatives: ['structured_response', 'scenario'],
        rationale: 'Foundational skilled work requires verified knowledge of safety codes, Lockout/Tagout, and tool specifications.',
      };
    }
    return {
      primary: 'scenario',
      alternatives: ['structured_response', 'reasoning'],
      rationale: 'Experienced tradespeople require troubleshooting scenarios identifying fault causes and safe repair sequences.',
    };
  }

  getDomainEvidenceRequirement(competencyName: string, _seniority: SeniorityLevel): DomainEvidenceRequirement {
    return {
      requiredEvidence: `Lockout/tagout isolation sequence, schematic diagnosis trail, and procedural repair checklist for ${competencyName}.`,
      evaluationCriteria: ['OSHA/NEC safety compliance primacy', 'Systematic diagnostic isolation', 'Correct tool and PPE specification', 'Functional verification test'],
      criticalTradeOffs: ['Speed of equipment restoration vs exhaustive root-cause component replacement'],
      antiPatterns: ['Bypassing safety interlocks', 'Working on live circuits without arc-flash PPE', 'Trial-and-error part swapping'],
    };
  }

  getAccessibilityAccommodations(): string[] {
    return ['visual_diagram_support', 'screen_reader_friendly', 'simplified_language_options'];
  }
}

/**
 * Fallback General Occupation Adapter
 */
export class GeneralOccupationAdapter implements OccupationAdapter {
  readonly domainId = 'general';
  readonly displayName = 'General Occupational Profile';
  readonly description = 'Standard workplace competencies across non-specialized organizational domains.';
  readonly standardTaxonomies = ['O*NET Universal Competencies'];
  readonly regulatoryFrameworks = ['Standard Workplace Safety', 'Equal Opportunity Employment'];

  matches(_context: OccupationDomainContext): boolean {
    return true; // Catch-all fallback
  }

  getPreferredModalities(seniority: SeniorityLevel, _purpose: AssessmentPurpose): ModalityRecommendation {
    if (['foundation', 'junior'].includes(seniority)) {
      return {
        primary: 'knowledge_question',
        alternatives: ['structured_response'],
        rationale: 'General foundational competency relies on direct objective knowledge verification.',
      };
    }
    return {
      primary: 'structured_response',
      alternatives: ['reasoning', 'scenario'],
      rationale: 'Mid-to-senior general competency relies on structured professional response articulating execution standards.',
    };
  }

  getDomainEvidenceRequirement(competencyName: string, _seniority: SeniorityLevel): DomainEvidenceRequirement {
    return {
      requiredEvidence: `Structured work sample or procedural response demonstrating competency in ${competencyName}.`,
      evaluationCriteria: ['Clarity and completeness', 'Adherence to professional standards', 'Logical sequencing'],
      criticalTradeOffs: ['Immediate task execution vs quality control'],
      antiPatterns: ['Unverified factual claims', 'Ignoring instructions'],
    };
  }

  getAccessibilityAccommodations(): string[] {
    return ['screen_reader_friendly', 'keyboard_navigation', 'extended_time'];
  }
}

/**
 * Pluggable Occupation Adapter Registry
 */
export class OccupationAdapterRegistry {
  private adapters: Map<string, OccupationAdapter> = new Map();
  private fallbackAdapter: OccupationAdapter = new GeneralOccupationAdapter();

  constructor(customAdapters?: OccupationAdapter[]) {
    // Register the 8 mandatory domain adapters
    const defaults: OccupationAdapter[] = [
      new TechnicalOccupationAdapter(),
      new FinanceOccupationAdapter(),
      new HealthcareOccupationAdapter(),
      new EducationOccupationAdapter(),
      new SalesOccupationAdapter(),
      new OperationsOccupationAdapter(),
      new ProfessionalServicesOccupationAdapter(),
      new SkilledWorkOccupationAdapter(),
    ];

    for (const adapter of customAdapters || defaults) {
      this.register(adapter);
    }
  }

  /**
   * Register a new or overriding occupation adapter
   * Prepend by default so specialized adapters evaluate before broad ones
   */
  public register(adapter: OccupationAdapter, prepend: boolean = true): void {
    if (prepend) {
      const existing = Array.from(this.adapters.entries()).filter(([k]) => k !== adapter.domainId);
      this.adapters = new Map([[adapter.domainId, adapter], ...existing]);
    } else {
      this.adapters.set(adapter.domainId, adapter);
    }
  }

  /**
   * Retrieve adapter by domain ID
   */
  public get(domainId: string): OccupationAdapter | undefined {
    return this.adapters.get(domainId);
  }

  /**
   * Get all registered adapters
   */
  public getAll(): OccupationAdapter[] {
    return Array.from(this.adapters.values());
  }

  /**
   * Dynamically resolve the best matching adapter for a given context
   * Note: Pure pluggable dispatch loop - zero hardcoded switch/case statements.
   */
  public resolveAdapter(context: OccupationDomainContext): OccupationAdapter {
    for (const adapter of this.adapters.values()) {
      if (adapter.matches(context)) {
        return adapter;
      }
    }
    return this.fallbackAdapter;
  }
}

// Global Default Registry Instance
export const globalOccupationRegistry = new OccupationAdapterRegistry();
