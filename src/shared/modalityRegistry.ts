/**
 * Universal Evidence Modality Registry
 * IntelliHire M2 Universal Evidence & Competency Assessment Engine
 * Phase 2 - Prompt 12
 * 
 * Versioned evidence modality registry supporting the architecture for:
 * 1. knowledge_question
 * 2. reasoning
 * 3. scenario
 * 4. simulation
 * 5. structured_response
 * 6. writing
 * 7. coding
 * 8. spreadsheet_data
 * 9. document_analysis
 * 10. planning
 * 11. presentation
 * 12. domain_work_sample
 * 13. role_play
 * 
 * Rule: Only enable modalities that actually have live implementation.
 */

import { EvaluationMethod } from './evidenceStrategy';

export type CanonicalModalityId =
  | 'knowledge_question'
  | 'reasoning'
  | 'scenario'
  | 'simulation'
  | 'structured_response'
  | 'writing'
  | 'coding'
  | 'spreadsheet_data'
  | 'document_analysis'
  | 'planning'
  | 'presentation'
  | 'domain_work_sample'
  | 'role_play';

export type ModalityAlias =
  | 'knowledge_inquiry'
  | 'structured_reasoning'
  | 'dynamic_scenario'
  | 'domain_simulation'
  | 'data_analysis_sample'
  | 'written_work_sample'
  | 'practical_execution'
  | 'presentation_defense'
  | 'mcq'
  | 'code'
  | 'open_text';

export type ModalityIdentifier = CanonicalModalityId | ModalityAlias;

export type ModalityStatus = 'active' | 'beta' | 'planned' | 'deprecated';

export interface ModalityCapabilities {
  supportsAutomatedEvaluation: boolean;
  supportsRubricEvaluation: boolean;
  supportsHumanEvaluation: boolean;
  supportsAdaptiveTesting: boolean;
  supportsAsynchronousSubmission: boolean;
  requiresBrowserEnvironment: boolean;
  requiresRuntimeSandbox: boolean;
  preservesProvenance: boolean;
}

export interface ModalityValidationRules {
  minResponseLength?: number;
  maxResponseLength?: number;
  allowedFileTypes?: string[];
  maxExecutionTimeSeconds?: number;
  requiredArtifacts?: string[];
  schema?: Record<string, any>;
}

export interface ModalityAccessibilityAccommodations {
  screenReaderFriendly: boolean;
  keyboardNavigable: boolean;
  extendedTimeSupport: boolean;
  textToSpeechSupport: boolean;
  sensoryComplexity: 'low' | 'medium' | 'high';
  alternativeInputTypes: string[];
}

export interface ModalityFairnessConstraints {
  cultureFairnessTested: boolean;
  languageIndependenceLevel: 'high' | 'medium' | 'low';
  dialectRobustness: boolean;
}

export interface ModalityRenderContract {
  componentType: string;
  hasInteractiveControls: boolean;
  supportsRealtimeFeedback: boolean;
}

export interface EvidenceModalityDefinition {
  id: CanonicalModalityId;
  aliases: ModalityAlias[];
  name: string;
  version: string;
  description: string;
  status: ModalityStatus;
  enabled: boolean; // Only true if live implementation exists
  implementationPhase: 'Phase 1' | 'Phase 2' | 'Phase 3' | 'Phase 4';
  capabilities: ModalityCapabilities;
  supportedInputTypes: string[];
  evaluationMethods: EvaluationMethod[];
  validationRules: ModalityValidationRules;
  accessibilityAccommodations: ModalityAccessibilityAccommodations;
  fairnessConstraints: ModalityFairnessConstraints;
  renderContract: ModalityRenderContract;
}

export interface ModalityValidationResult {
  valid: boolean;
  errors: string[];
  normalizedModalityId?: CanonicalModalityId;
}

// Canonical Registry Version
export const MODALITY_REGISTRY_VERSION = '2.0.0';

// Mapping from aliases to canonical IDs
export const MODALITY_ALIAS_MAP: Record<ModalityIdentifier, CanonicalModalityId> = {
  knowledge_question: 'knowledge_question',
  knowledge_inquiry: 'knowledge_question',
  mcq: 'knowledge_question',

  reasoning: 'reasoning',
  structured_reasoning: 'reasoning',

  scenario: 'scenario',
  dynamic_scenario: 'scenario',

  simulation: 'simulation',
  domain_simulation: 'simulation',

  structured_response: 'structured_response',
  open_text: 'structured_response',

  writing: 'writing',
  written_work_sample: 'writing',

  coding: 'coding',
  practical_execution: 'coding',
  code: 'coding',

  spreadsheet_data: 'spreadsheet_data',
  data_analysis_sample: 'spreadsheet_data',

  document_analysis: 'document_analysis',
  planning: 'planning',

  presentation: 'presentation',
  presentation_defense: 'presentation',

  domain_work_sample: 'domain_work_sample',
  role_play: 'role_play',
};

export const ALL_MODALITY_DEFINITIONS: EvidenceModalityDefinition[] = [
  // 1. Knowledge Question (ENABLED: live MCQ items + automated scoring)
  {
    id: 'knowledge_question',
    aliases: ['knowledge_inquiry', 'mcq'],
    name: 'Knowledge Question',
    version: '2.0.0',
    description: 'Deterministic direct questions, conceptual multiple-choice, and fact verification.',
    status: 'active',
    enabled: true,
    implementationPhase: 'Phase 1',
    capabilities: {
      supportsAutomatedEvaluation: true,
      supportsRubricEvaluation: false,
      supportsHumanEvaluation: true,
      supportsAdaptiveTesting: true,
      supportsAsynchronousSubmission: false,
      requiresBrowserEnvironment: false,
      requiresRuntimeSandbox: false,
      preservesProvenance: true,
    },
    supportedInputTypes: ['single_choice', 'multiple_choice'],
    evaluationMethods: ['objective', 'hybrid'],
    validationRules: {
      minResponseLength: 1,
      maxResponseLength: 100,
      maxExecutionTimeSeconds: 120,
    },
    accessibilityAccommodations: {
      screenReaderFriendly: true,
      keyboardNavigable: true,
      extendedTimeSupport: true,
      textToSpeechSupport: true,
      sensoryComplexity: 'low',
      alternativeInputTypes: ['keyboard_numeric', 'voice_selection'],
    },
    fairnessConstraints: {
      cultureFairnessTested: true,
      languageIndependenceLevel: 'medium',
      dialectRobustness: true,
    },
    renderContract: {
      componentType: 'MultipleChoiceView',
      hasInteractiveControls: true,
      supportsRealtimeFeedback: false,
    },
  },

  // 2. Structured Reasoning (ENABLED: open-text explanation + rubric/AI evaluation)
  {
    id: 'reasoning',
    aliases: ['structured_reasoning'],
    name: 'Structured Reasoning',
    version: '2.0.0',
    description: 'Analytical breakdowns, hypothesis explanations, and evidence-grounded rationales.',
    status: 'active',
    enabled: true,
    implementationPhase: 'Phase 1',
    capabilities: {
      supportsAutomatedEvaluation: true,
      supportsRubricEvaluation: true,
      supportsHumanEvaluation: true,
      supportsAdaptiveTesting: true,
      supportsAsynchronousSubmission: true,
      requiresBrowserEnvironment: false,
      requiresRuntimeSandbox: false,
      preservesProvenance: true,
    },
    supportedInputTypes: ['text', 'structured_argument'],
    evaluationMethods: ['rubric', 'ai', 'hybrid', 'human'],
    validationRules: {
      minResponseLength: 20,
      maxResponseLength: 5000,
      maxExecutionTimeSeconds: 600,
    },
    accessibilityAccommodations: {
      screenReaderFriendly: true,
      keyboardNavigable: true,
      extendedTimeSupport: true,
      textToSpeechSupport: true,
      sensoryComplexity: 'low',
      alternativeInputTypes: ['dictation', 'voice_to_text'],
    },
    fairnessConstraints: {
      cultureFairnessTested: true,
      languageIndependenceLevel: 'medium',
      dialectRobustness: true,
    },
    renderContract: {
      componentType: 'StructuredReasoningView',
      hasInteractiveControls: true,
      supportsRealtimeFeedback: false,
    },
  },

  // 3. Dynamic Scenario (ENABLED: contextual situation + decision assessment)
  {
    id: 'scenario',
    aliases: ['dynamic_scenario'],
    name: 'Dynamic Scenario',
    version: '2.0.0',
    description: 'Branching professional situations evaluating judgment under ambiguity and risk.',
    status: 'active',
    enabled: true,
    implementationPhase: 'Phase 1',
    capabilities: {
      supportsAutomatedEvaluation: true,
      supportsRubricEvaluation: true,
      supportsHumanEvaluation: true,
      supportsAdaptiveTesting: true,
      supportsAsynchronousSubmission: false,
      requiresBrowserEnvironment: false,
      requiresRuntimeSandbox: false,
      preservesProvenance: true,
    },
    supportedInputTypes: ['choice_with_rationale', 'multi_step_decision'],
    evaluationMethods: ['rubric', 'ai', 'hybrid'],
    validationRules: {
      minResponseLength: 10,
      maxResponseLength: 4000,
      maxExecutionTimeSeconds: 900,
    },
    accessibilityAccommodations: {
      screenReaderFriendly: true,
      keyboardNavigable: true,
      extendedTimeSupport: true,
      textToSpeechSupport: true,
      sensoryComplexity: 'medium',
      alternativeInputTypes: ['simplified_branching'],
    },
    fairnessConstraints: {
      cultureFairnessTested: true,
      languageIndependenceLevel: 'medium',
      dialectRobustness: true,
    },
    renderContract: {
      componentType: 'ScenarioSimulationView',
      hasInteractiveControls: true,
      supportsRealtimeFeedback: true,
    },
  },

  // 4. Practical Coding Execution (ENABLED: code snippet & logic submission evaluated via rubric/AI)
  {
    id: 'coding',
    aliases: ['practical_execution', 'code'],
    name: 'Practical Coding Execution',
    version: '2.0.0',
    description: 'Code synthesis, bug diagnosis, and algorithmic architecture assessment without unsafe server execution.',
    status: 'active',
    enabled: true,
    implementationPhase: 'Phase 1',
    capabilities: {
      supportsAutomatedEvaluation: true,
      supportsRubricEvaluation: true,
      supportsHumanEvaluation: true,
      supportsAdaptiveTesting: true,
      supportsAsynchronousSubmission: false,
      requiresBrowserEnvironment: true,
      requiresRuntimeSandbox: false,
      preservesProvenance: true,
    },
    supportedInputTypes: ['code_editor', 'diff_submission'],
    evaluationMethods: ['rubric', 'ai', 'hybrid'],
    validationRules: {
      minResponseLength: 10,
      maxResponseLength: 12000,
      maxExecutionTimeSeconds: 1200,
    },
    accessibilityAccommodations: {
      screenReaderFriendly: false, // Coding editors require specialized screen reader setup
      keyboardNavigable: true,
      extendedTimeSupport: true,
      textToSpeechSupport: false,
      sensoryComplexity: 'medium',
      alternativeInputTypes: ['plain_text_code'],
    },
    fairnessConstraints: {
      cultureFairnessTested: true,
      languageIndependenceLevel: 'high',
      dialectRobustness: true,
    },
    renderContract: {
      componentType: 'CodeExecutionView',
      hasInteractiveControls: true,
      supportsRealtimeFeedback: false,
    },
  },

  // 5. Structured Response (ENABLED: form inputs, decision justification, key-value criteria)
  {
    id: 'structured_response',
    aliases: ['open_text'],
    name: 'Structured Response',
    version: '2.0.0',
    description: 'Multi-part structured inputs, prioritization matrices, and tabular responses.',
    status: 'active',
    enabled: true,
    implementationPhase: 'Phase 1',
    capabilities: {
      supportsAutomatedEvaluation: true,
      supportsRubricEvaluation: true,
      supportsHumanEvaluation: true,
      supportsAdaptiveTesting: true,
      supportsAsynchronousSubmission: true,
      requiresBrowserEnvironment: false,
      requiresRuntimeSandbox: false,
      preservesProvenance: true,
    },
    supportedInputTypes: ['form_fields', 'ranking', 'tabular_inputs'],
    evaluationMethods: ['rubric', 'ai', 'hybrid', 'objective'],
    validationRules: {
      minResponseLength: 5,
      maxResponseLength: 6000,
      maxExecutionTimeSeconds: 600,
    },
    accessibilityAccommodations: {
      screenReaderFriendly: true,
      keyboardNavigable: true,
      extendedTimeSupport: true,
      textToSpeechSupport: true,
      sensoryComplexity: 'low',
      alternativeInputTypes: ['sequential_prompts'],
    },
    fairnessConstraints: {
      cultureFairnessTested: true,
      languageIndependenceLevel: 'medium',
      dialectRobustness: true,
    },
    renderContract: {
      componentType: 'StructuredResponseView',
      hasInteractiveControls: true,
      supportsRealtimeFeedback: false,
    },
  },

  // 6. Domain Simulation (PLANNED: Phase 3 Prompt 22)
  {
    id: 'simulation',
    aliases: ['domain_simulation'],
    name: 'Domain Simulation',
    version: '2.0.0',
    description: 'Immersive multi-state domain simulation mimicking real-world workstation software.',
    status: 'planned',
    enabled: false, // Planned for Phase 3
    implementationPhase: 'Phase 3',
    capabilities: {
      supportsAutomatedEvaluation: false,
      supportsRubricEvaluation: true,
      supportsHumanEvaluation: true,
      supportsAdaptiveTesting: false,
      supportsAsynchronousSubmission: false,
      requiresBrowserEnvironment: true,
      requiresRuntimeSandbox: true,
      preservesProvenance: true,
    },
    supportedInputTypes: ['state_interaction', 'event_log'],
    evaluationMethods: ['rubric', 'hybrid'],
    validationRules: {
      maxExecutionTimeSeconds: 1800,
    },
    accessibilityAccommodations: {
      screenReaderFriendly: false,
      keyboardNavigable: true,
      extendedTimeSupport: true,
      textToSpeechSupport: false,
      sensoryComplexity: 'high',
      alternativeInputTypes: ['accessible_scenario_fallback'],
    },
    fairnessConstraints: {
      cultureFairnessTested: false,
      languageIndependenceLevel: 'medium',
      dialectRobustness: false,
    },
    renderContract: {
      componentType: 'InteractiveSimulationView',
      hasInteractiveControls: true,
      supportsRealtimeFeedback: true,
    },
  },

  // 7. Writing & Document Work Sample (PLANNED: Phase 3 Prompt 26)
  {
    id: 'writing',
    aliases: ['written_work_sample'],
    name: 'Writing Work Sample',
    version: '2.0.0',
    description: 'Drafting executive summaries, technical proposals, customer comms, or policy briefs.',
    status: 'planned',
    enabled: false,
    implementationPhase: 'Phase 3',
    capabilities: {
      supportsAutomatedEvaluation: true,
      supportsRubricEvaluation: true,
      supportsHumanEvaluation: true,
      supportsAdaptiveTesting: false,
      supportsAsynchronousSubmission: true,
      requiresBrowserEnvironment: false,
      requiresRuntimeSandbox: false,
      preservesProvenance: true,
    },
    supportedInputTypes: ['rich_text', 'markdown', 'document_upload'],
    evaluationMethods: ['rubric', 'ai', 'human'],
    validationRules: {
      minResponseLength: 100,
      maxResponseLength: 20000,
      allowedFileTypes: ['pdf', 'docx', 'md', 'txt'],
    },
    accessibilityAccommodations: {
      screenReaderFriendly: true,
      keyboardNavigable: true,
      extendedTimeSupport: true,
      textToSpeechSupport: true,
      sensoryComplexity: 'low',
      alternativeInputTypes: ['dictation', 'external_editor'],
    },
    fairnessConstraints: {
      cultureFairnessTested: true,
      languageIndependenceLevel: 'low',
      dialectRobustness: true,
    },
    renderContract: {
      componentType: 'DocumentEditorView',
      hasInteractiveControls: true,
      supportsRealtimeFeedback: false,
    },
  },

  // 8. Spreadsheet & Data Analysis (PLANNED: Phase 3 Prompt 25)
  {
    id: 'spreadsheet_data',
    aliases: ['data_analysis_sample'],
    name: 'Spreadsheet & Data Analysis',
    version: '2.0.0',
    description: 'Financial models, statistical pivots, reconciliation sheets, and dashboard analysis.',
    status: 'planned',
    enabled: false,
    implementationPhase: 'Phase 3',
    capabilities: {
      supportsAutomatedEvaluation: true,
      supportsRubricEvaluation: true,
      supportsHumanEvaluation: true,
      supportsAdaptiveTesting: false,
      supportsAsynchronousSubmission: true,
      requiresBrowserEnvironment: true,
      requiresRuntimeSandbox: false,
      preservesProvenance: true,
    },
    supportedInputTypes: ['tabular_workbook', 'csv_upload', 'formula_inputs'],
    evaluationMethods: ['objective', 'rubric', 'ai'],
    validationRules: {
      allowedFileTypes: ['xlsx', 'csv'],
      maxExecutionTimeSeconds: 1800,
    },
    accessibilityAccommodations: {
      screenReaderFriendly: false,
      keyboardNavigable: true,
      extendedTimeSupport: true,
      textToSpeechSupport: false,
      sensoryComplexity: 'medium',
      alternativeInputTypes: ['tabular_html'],
    },
    fairnessConstraints: {
      cultureFairnessTested: true,
      languageIndependenceLevel: 'high',
      dialectRobustness: true,
    },
    renderContract: {
      componentType: 'SpreadsheetView',
      hasInteractiveControls: true,
      supportsRealtimeFeedback: false,
    },
  },

  // 9. Document Analysis (PLANNED: Phase 3)
  {
    id: 'document_analysis',
    aliases: [],
    name: 'Document Analysis',
    version: '2.0.0',
    description: 'Contract redlining, audit review, clinical note parsing, and requirement cross-checks.',
    status: 'planned',
    enabled: false,
    implementationPhase: 'Phase 3',
    capabilities: {
      supportsAutomatedEvaluation: true,
      supportsRubricEvaluation: true,
      supportsHumanEvaluation: true,
      supportsAdaptiveTesting: false,
      supportsAsynchronousSubmission: true,
      requiresBrowserEnvironment: false,
      requiresRuntimeSandbox: false,
      preservesProvenance: true,
    },
    supportedInputTypes: ['annotation', 'highlight_and_tag', 'finding_report'],
    evaluationMethods: ['rubric', 'ai', 'hybrid'],
    validationRules: {
      minResponseLength: 20,
      maxResponseLength: 15000,
    },
    accessibilityAccommodations: {
      screenReaderFriendly: true,
      keyboardNavigable: true,
      extendedTimeSupport: true,
      textToSpeechSupport: true,
      sensoryComplexity: 'medium',
      alternativeInputTypes: ['structured_findings_form'],
    },
    fairnessConstraints: {
      cultureFairnessTested: true,
      languageIndependenceLevel: 'medium',
      dialectRobustness: true,
    },
    renderContract: {
      componentType: 'DocumentAnnotationView',
      hasInteractiveControls: true,
      supportsRealtimeFeedback: false,
    },
  },

  // 10. Planning (PLANNED: Phase 3)
  {
    id: 'planning',
    aliases: [],
    name: 'Strategic & Operational Planning',
    version: '2.0.0',
    description: 'Project Gantt sequencing, resource allocation, OKR structuring, and sprint planning.',
    status: 'planned',
    enabled: false,
    implementationPhase: 'Phase 3',
    capabilities: {
      supportsAutomatedEvaluation: false,
      supportsRubricEvaluation: true,
      supportsHumanEvaluation: true,
      supportsAdaptiveTesting: false,
      supportsAsynchronousSubmission: true,
      requiresBrowserEnvironment: false,
      requiresRuntimeSandbox: false,
      preservesProvenance: true,
    },
    supportedInputTypes: ['timeline_sequence', 'risk_register', 'structured_plan'],
    evaluationMethods: ['rubric', 'ai', 'human'],
    validationRules: {
      minResponseLength: 50,
      maxResponseLength: 10000,
    },
    accessibilityAccommodations: {
      screenReaderFriendly: true,
      keyboardNavigable: true,
      extendedTimeSupport: true,
      textToSpeechSupport: true,
      sensoryComplexity: 'medium',
      alternativeInputTypes: ['bulleted_timeline'],
    },
    fairnessConstraints: {
      cultureFairnessTested: true,
      languageIndependenceLevel: 'medium',
      dialectRobustness: true,
    },
    renderContract: {
      componentType: 'PlanningCanvasView',
      hasInteractiveControls: true,
      supportsRealtimeFeedback: false,
    },
  },

  // 11. Presentation & Defense (PLANNED: Phase 3)
  {
    id: 'presentation',
    aliases: ['presentation_defense'],
    name: 'Presentation & Defense',
    version: '2.0.0',
    description: 'Slide deck pitch, live defense response, and stakeholder alignment presentation.',
    status: 'planned',
    enabled: false,
    implementationPhase: 'Phase 3',
    capabilities: {
      supportsAutomatedEvaluation: false,
      supportsRubricEvaluation: true,
      supportsHumanEvaluation: true,
      supportsAdaptiveTesting: false,
      supportsAsynchronousSubmission: true,
      requiresBrowserEnvironment: true,
      requiresRuntimeSandbox: false,
      preservesProvenance: true,
    },
    supportedInputTypes: ['slide_upload', 'recorded_pitch', 'q_and_a_transcript'],
    evaluationMethods: ['rubric', 'human', 'hybrid'],
    validationRules: {
      allowedFileTypes: ['pdf', 'pptx'],
      maxExecutionTimeSeconds: 1800,
    },
    accessibilityAccommodations: {
      screenReaderFriendly: true,
      keyboardNavigable: true,
      extendedTimeSupport: true,
      textToSpeechSupport: true,
      sensoryComplexity: 'high',
      alternativeInputTypes: ['written_briefing_defense'],
    },
    fairnessConstraints: {
      cultureFairnessTested: true,
      languageIndependenceLevel: 'low',
      dialectRobustness: false,
    },
    renderContract: {
      componentType: 'PresentationDeckView',
      hasInteractiveControls: true,
      supportsRealtimeFeedback: false,
    },
  },

  // 12. Domain Work Sample (PLANNED: Phase 3 Prompt 24/27)
  {
    id: 'domain_work_sample',
    aliases: [],
    name: 'Domain Work Sample',
    version: '2.0.0',
    description: 'Job-specific tangible deliverable (e.g. nursing care plan, sales territory plan, legal clause).',
    status: 'planned',
    enabled: false,
    implementationPhase: 'Phase 3',
    capabilities: {
      supportsAutomatedEvaluation: false,
      supportsRubricEvaluation: true,
      supportsHumanEvaluation: true,
      supportsAdaptiveTesting: false,
      supportsAsynchronousSubmission: true,
      requiresBrowserEnvironment: false,
      requiresRuntimeSandbox: false,
      preservesProvenance: true,
    },
    supportedInputTypes: ['portfolio_artifact', 'job_sample_submission'],
    evaluationMethods: ['rubric', 'ai', 'human'],
    validationRules: {
      minResponseLength: 50,
      maxResponseLength: 25000,
    },
    accessibilityAccommodations: {
      screenReaderFriendly: true,
      keyboardNavigable: true,
      extendedTimeSupport: true,
      textToSpeechSupport: true,
      sensoryComplexity: 'medium',
      alternativeInputTypes: ['accessible_work_sample'],
    },
    fairnessConstraints: {
      cultureFairnessTested: true,
      languageIndependenceLevel: 'medium',
      dialectRobustness: true,
    },
    renderContract: {
      componentType: 'WorkSampleSubmissionView',
      hasInteractiveControls: true,
      supportsRealtimeFeedback: false,
    },
  },

  // 13. Role-Play (PLANNED: Phase 3)
  {
    id: 'role_play',
    aliases: [],
    name: 'Interactive Role-Play',
    version: '2.0.0',
    description: 'Dynamic conversational dialogue simulating client escalations, negotiations, or patient consultations.',
    status: 'planned',
    enabled: false,
    implementationPhase: 'Phase 3',
    capabilities: {
      supportsAutomatedEvaluation: true,
      supportsRubricEvaluation: true,
      supportsHumanEvaluation: true,
      supportsAdaptiveTesting: true,
      supportsAsynchronousSubmission: false,
      requiresBrowserEnvironment: false,
      requiresRuntimeSandbox: false,
      preservesProvenance: true,
    },
    supportedInputTypes: ['conversational_turns', 'transcript_dialogue'],
    evaluationMethods: ['rubric', 'ai', 'hybrid'],
    validationRules: {
      minResponseLength: 5,
      maxResponseLength: 10000,
      maxExecutionTimeSeconds: 1200,
    },
    accessibilityAccommodations: {
      screenReaderFriendly: true,
      keyboardNavigable: true,
      extendedTimeSupport: true,
      textToSpeechSupport: true,
      sensoryComplexity: 'medium',
      alternativeInputTypes: ['text_dialogue_fallback'],
    },
    fairnessConstraints: {
      cultureFairnessTested: false,
      languageIndependenceLevel: 'low',
      dialectRobustness: true,
    },
    renderContract: {
      componentType: 'RolePlayChatView',
      hasInteractiveControls: true,
      supportsRealtimeFeedback: true,
    },
  },
];

/**
 * Versioned Modality Registry Engine
 */
export class ModalityRegistry {
  private modalities: Map<CanonicalModalityId, EvidenceModalityDefinition> = new Map();
  private aliasIndex: Map<string, CanonicalModalityId> = new Map();
  public readonly version: string = MODALITY_REGISTRY_VERSION;

  constructor(definitions: EvidenceModalityDefinition[] = ALL_MODALITY_DEFINITIONS) {
    for (const def of definitions) {
      this.register(def);
    }
  }

  /**
   * Register or update a modality definition
   */
  public register(definition: EvidenceModalityDefinition): void {
    this.modalities.set(definition.id, definition);
    this.aliasIndex.set(definition.id.toLowerCase(), definition.id);
    for (const alias of definition.aliases) {
      this.aliasIndex.set(alias.toLowerCase(), definition.id);
    }
  }

  /**
   * Resolve an identifier or alias to its canonical modality ID
   */
  public resolveCanonicalId(identifier: string): CanonicalModalityId | undefined {
    return this.aliasIndex.get(identifier.toLowerCase());
  }

  /**
   * Retrieve a modality definition by canonical ID or alias
   */
  public get(identifier: string): EvidenceModalityDefinition | undefined {
    const canonicalId = this.resolveCanonicalId(identifier);
    if (!canonicalId) return undefined;
    return this.modalities.get(canonicalId);
  }

  /**
   * Check if a modality exists in the registry
   */
  public has(identifier: string): boolean {
    return this.resolveCanonicalId(identifier) !== undefined;
  }

  /**
   * Check if a modality is currently enabled (has real implementation)
   */
  public isEnabled(identifier: string): boolean {
    const mod = this.get(identifier);
    return !!(mod && mod.enabled);
  }

  /**
   * Get all registered modality definitions
   */
  public getAll(): EvidenceModalityDefinition[] {
    return Array.from(this.modalities.values());
  }

  /**
   * Get all currently enabled modalities (live implementation only)
   */
  public getEnabled(): EvidenceModalityDefinition[] {
    return this.getAll().filter((m) => m.enabled);
  }

  /**
   * Get planned / roadmap modalities
   */
  public getPlanned(): EvidenceModalityDefinition[] {
    return this.getAll().filter((m) => !m.enabled);
  }

  /**
   * Validate a candidate response against the modality's rules and enablement
   */
  public validateResponse(
    identifier: string,
    responseData: any
  ): ModalityValidationResult {
    const canonicalId = this.resolveCanonicalId(identifier);
    if (!canonicalId) {
      return {
        valid: false,
        errors: [`Unknown evidence modality: "${identifier}"`],
      };
    }

    const modality = this.modalities.get(canonicalId)!;
    if (!modality.enabled) {
      return {
        valid: false,
        normalizedModalityId: canonicalId,
        errors: [
          `Modality "${modality.name}" is planned for ${modality.implementationPhase} and is not yet enabled for live assessments.`,
        ],
      };
    }

    const errors: string[] = [];

    // Basic payload check
    if (responseData === null || responseData === undefined) {
      errors.push('Response payload cannot be empty');
      return { valid: false, errors, normalizedModalityId: canonicalId };
    }

    // Modality-specific response shape validation
    switch (canonicalId) {
      case 'knowledge_question': {
        const option =
          typeof responseData === 'string'
            ? responseData
            : responseData.selected_option || responseData.option_id || responseData.answer;
        if (!option || typeof option !== 'string') {
          errors.push('Knowledge question requires a valid selected option');
        }
        break;
      }

      case 'reasoning':
      case 'structured_response': {
        const text =
          typeof responseData === 'string'
            ? responseData
            : responseData.text || responseData.response || responseData.rationale || '';
        const min = modality.validationRules.minResponseLength || 10;
        const max = modality.validationRules.maxResponseLength || 5000;
        if (typeof text !== 'string' || text.trim().length < min) {
          errors.push(`Response must contain at least ${min} characters`);
        } else if (text.length > max) {
          errors.push(`Response exceeds maximum length of ${max} characters`);
        }
        break;
      }

      case 'scenario': {
        const decision =
          typeof responseData === 'object' && responseData !== null
            ? responseData.action || responseData.selected_action || responseData.decision
            : responseData;
        if (!decision) {
          errors.push('Scenario requires an explicit decision or chosen action');
        }
        break;
      }

      case 'coding': {
        const code =
          typeof responseData === 'string'
            ? responseData
            : responseData.code || responseData.solution || '';
        const min = modality.validationRules.minResponseLength || 5;
        const max = modality.validationRules.maxResponseLength || 12000;
        if (typeof code !== 'string' || code.trim().length < min) {
          errors.push(`Code solution must contain at least ${min} characters`);
        } else if (code.length > max) {
          errors.push(`Code solution exceeds maximum limit of ${max} characters`);
        }
        break;
      }

      default:
        // Other modalities are not enabled in Phase 2
        errors.push(`Modality "${canonicalId}" is not permitted for live submission.`);
    }

    return {
      valid: errors.length === 0,
      errors,
      normalizedModalityId: canonicalId,
    };
  }
}

// Global Default Registry Instance
export const globalModalityRegistry = new ModalityRegistry();
