/**
 * M03 AI Technical & Non-Technical Work Round Engine
 * Phase 1: Foundation Domain-Agnostic Architecture Contracts
 *
 * Provides shared, domain-agnostic contracts for candidates, jobs, competencies,
 * dynamic work surfaces, observable telemetry, evaluations, pedagogical explanations,
 * misconceptions, and adaptive work loops.
 */

import type { CanonicalModalityId } from './modalityRegistry';
import type { SeniorityLevel } from './evidenceStrategy';

// -----------------------------------------------------------------------------
// 1. Provenance & Uncertainty Primitives
// -----------------------------------------------------------------------------

export interface ProvenanceRecord {
  sourceModule: 'm01_resume' | 'm02_assessment' | 'm03_simulation' | 'm04_interview' | 'm05_readiness' | 'catalog_seed' | 'system';
  sourceRecordId?: string;
  generatorMethod: 'catalog_seed' | 'adaptive_ai' | 'rubric_deterministic' | 'hybrid' | 'human_expert';
  modelIdentifier?: string;
  promptVersion?: string;
  recordedAt: string;
  auditSignature?: string;
}

export interface UncertaintyEstimate {
  currentProficiency: number; // 0.0 - 1.0
  uncertaintyScore: number;   // 0.0 - 1.0 (Bayesian / Kalman covariance/variance)
  observationCount: number;
  lastUpdated: string;
}

// -----------------------------------------------------------------------------
// 2. Candidate & Job Context Contracts
// -----------------------------------------------------------------------------

export interface CandidateContext {
  userId: string;
  organizationId: string;
  targetRole: string;
  targetDomainId?: string;
  targetOccupationId?: string;
  occupationCode?: string;
  seniorityLevel: SeniorityLevel | string;
  activeResumeId?: string;
  extractedSkills: string[];
  verifiedClaims: Array<{
    claim: string;
    category?: string;
    source: string;
    confidence: number;
  }>;
  currentReadinessScore: number; // 0.0 - 1.0
  diagnosedGaps: Array<{
    skillId?: string;
    skillName: string;
    gapType: string;
    severity: string;
    recommendation?: string;
  }>;
}

export interface JobContext {
  requisitionId?: string;
  jobTitle: string;
  targetSeniority: SeniorityLevel | string;
  targetDomain?: string;
  targetOccupation?: string;
  requiredCompetencies: Array<{
    competencyId?: string;
    name: string;
    priority: 'required' | 'preferred';
    weight?: number;
  }>;
  requiredSkills: string[];
  rawJobDescription?: string;
  keyRequirements: string[];
  matchGapSummary?: {
    matchScore?: number;
    missingRequirements?: string[];
  };
}

// -----------------------------------------------------------------------------
// 3. Competency Target Contract
// -----------------------------------------------------------------------------

export interface CompetencyTarget {
  id: string;
  name: string;
  domain: string;
  skillName: string;
  skillId?: string;
  targetProficiency: number; // 0.0 - 1.0 (threshold sought)
  currentProficiency: number; // 0.0 - 1.0 (prior belief)
  uncertaintyEstimate: number; // 0.0 - 1.0 (uncertainty in belief)
  diagnosisSource: 'm01_ats_gap' | 'm02_assessment_gap' | 'job_requirement' | 'baseline_target';
  rationale: string;
}

// -----------------------------------------------------------------------------
// 4. Work Surface & Modality Contracts
// -----------------------------------------------------------------------------

export type WorkRoundModality =
  | 'coding'
  | 'financial_analysis'
  | 'operational_triage'
  | 'data_analysis'
  | 'written_communication'
  | 'system_design'
  | 'policy_review'
  | 'customer_scenario'
  | 'troubleshooting'
  | 'custom';

export interface WorkSurfaceConfiguration {
  syntaxLanguage?: string;
  starterTemplate?: string;
  readOnlyFiles?: Array<{ path: string; content: string }>;
  inputDataSchema?: Record<string, any>;
  spreadsheetGrid?: {
    columns: string[];
    rows: any[][];
  };
  incidentLogs?: Array<{ timestamp: string; level: string; service: string; message: string }>;
  allowedTools: string[];
  maxExecutionTimeSeconds?: number;
}

export interface WorkSurface {
  adapterId: string;
  modality: WorkRoundModality;
  title: string;
  editorType: 'code' | 'spreadsheet' | 'incident_console' | 'markdown' | 'structured_form';
  configuration: WorkSurfaceConfiguration;
  activeWidgets?: string[];
}

// -----------------------------------------------------------------------------
// 5. Task Definition Contract
// -----------------------------------------------------------------------------

export interface DynamicInjectionSpec {
  triggerStep: number;
  alertTitle: string;
  newRequirement: string;
  constraintChange: string;
  rationale: string;
}

export interface RubricDimension {
  name: string;
  weight: number;
  description: string;
  criteria: string;
}

export interface TaskDefinition {
  id: string;
  roundIndex: number;
  modality: WorkRoundModality;
  competencyTarget: CompetencyTarget;
  difficultyLevel: number; // 1 to 5
  scenario: {
    background: string;
    objective: string;
    initialRequirements: string[];
    operationalConstraints: string[];
    startingData?: any;
    toolsAvailable: string[];
    expectedOutputType: string;
  };
  dynamicInjection?: DynamicInjectionSpec;
  rubric: {
    dimensions: RubricDimension[];
    hiddenCriteria?: string[];
  };
  timeAllottedSeconds?: number;
  provenance: ProvenanceRecord;
}

// -----------------------------------------------------------------------------
// 6. Observable Evidence & Telemetry Contract
// -----------------------------------------------------------------------------

export interface TelemetryAction {
  timestamp: string | number;
  actionType: string;
  payload?: any;
}

export interface ObservableEvidence {
  telemetryActions: TelemetryAction[];
  constraintAdherenceScore: number; // 0.0 - 1.0
  toolUtilizationSummary: Record<string, number>;
  tradeOffsIdentified: string[];
  behavioralSignals: {
    timeToFirstActionMs?: number;
    totalActiveDurationMs: number;
    revisionCount: number;
    testRunCount?: number;
  };
  adherenceNotes?: string;
}

// -----------------------------------------------------------------------------
// 7. Submission Contract
// -----------------------------------------------------------------------------

export interface SubmissionArtifactPayload {
  primaryOutput: string | any;
  supportingArtifacts?: Record<string, string>;
  outputType: string;
}

export interface Submission {
  id: string;
  sessionId: string;
  taskId: string;
  roundIndex: number;
  artifactPayload: SubmissionArtifactPayload;
  candidateRationale?: string;
  observableEvidence: ObservableEvidence;
  submittedAt: string;
}

// -----------------------------------------------------------------------------
// 8. Misconception & Pedagogical Explanation Contracts
// -----------------------------------------------------------------------------

export interface Misconception {
  id: string;
  category: 'conceptual' | 'procedural' | 'boundary_condition' | 'trade_off_blindspot' | 'assumption';
  title: string;
  description: string;
  severity: 'minor' | 'moderate' | 'critical';
  remediationGuidance: string;
}

export interface Explanation {
  stepByStepSolution: string[];
  optimalApproachReasoning: string; // "Explain Why"
  concreteExecutionWalkthrough: string; // "Explain How"
  contrastAnalysis: {
    whatCandidateDidWell: string[];
    whereCandidateDiverged: string[];
    architecturalOrMethodologicalTradeoffs: string;
  };
}

// -----------------------------------------------------------------------------
// 9. Evaluation Contract
// -----------------------------------------------------------------------------

export interface EvaluationDimensionResult {
  score: number; // 0.0 - 1.0
  weight: number;
  feedback: string;
}

export interface Evaluation {
  id: string;
  submissionId: string;
  taskId: string;
  overallScore: number; // 0.0 - 1.0 (or 0 - 100 percentage)
  dimensionScores: Record<string, EvaluationDimensionResult>;
  observableEvidence: ObservableEvidence;
  identifiedMisconceptions: Misconception[];
  explanation: Explanation;
  evaluatorType: 'ai_bounded' | 'rubric_deterministic' | 'hybrid';
  evaluatorModel?: string;
  confidenceScore: number; // 0.0 - 1.0
  evaluatedAt: string;
}

// -----------------------------------------------------------------------------
// 10. Adaptation Decision Contract
// -----------------------------------------------------------------------------

export interface AdaptationDecision {
  currentRoundIndex: number;
  nextRoundIndex?: number;
  targetSkillForNextRound?: string;
  difficultyShift: 'increase' | 'maintain' | 'decrease' | 'remediate_gap' | 'pivot_dimension';
  difficultyDelta: number; // -1, 0, +1
  uncertaintyReductionProjected: number;
  adaptationRationale: string;
  shouldContinue: boolean;
  terminationReason?: 'target_confidence_reached' | 'all_target_skills_assessed' | 'max_rounds_reached' | 'candidate_requested_exit';
}

// -----------------------------------------------------------------------------
// 11. M03 Work Round Session Contract
// -----------------------------------------------------------------------------

export interface TaskRoundHistoryItem {
  taskId: string;
  task: TaskDefinition;
  workSurface: WorkSurface;
  submission?: Submission;
  evaluation?: Evaluation;
  adaptationDecision?: AdaptationDecision;
}

export interface CumulativeEvidenceLedgerSummary {
  evaluatedSkills: Record<string, {
    proficiency: number;
    uncertainty: number;
    observationCount: number;
  }>;
  totalTelemetryActions: number;
  overallReadinessContribution: number;
}

export interface M03Session {
  id: string;
  userId: string;
  organizationId: string;
  candidateContext: CandidateContext;
  jobContext: JobContext;
  currentRoundIndex: number;
  totalRoundsPlanned: number;
  completedRounds: number;
  status: 'active' | 'in_progress' | 'completed' | 'abandoned';
  taskHistory: TaskRoundHistoryItem[];
  cumulativeEvidenceLedger: CumulativeEvidenceLedgerSummary;
  createdAt: string;
  updatedAt: string;
}

// -----------------------------------------------------------------------------
// 12. Validation & Conversion Helpers
// -----------------------------------------------------------------------------

export function validateCandidateContext(ctx: Partial<CandidateContext>): ctx is CandidateContext {
  return Boolean(
    ctx &&
    typeof ctx.userId === 'string' &&
    typeof ctx.organizationId === 'string' &&
    typeof ctx.targetRole === 'string' &&
    Array.isArray(ctx.extractedSkills) &&
    Array.isArray(ctx.diagnosedGaps)
  );
}

export function validateTaskDefinition(task: Partial<TaskDefinition>): task is TaskDefinition {
  return Boolean(
    task &&
    typeof task.id === 'string' &&
    typeof task.roundIndex === 'number' &&
    typeof task.modality === 'string' &&
    task.competencyTarget &&
    task.scenario &&
    task.rubric &&
    Array.isArray(task.rubric.dimensions)
  );
}

export function validateSubmission(sub: Partial<Submission>): sub is Submission {
  return Boolean(
    sub &&
    typeof sub.id === 'string' &&
    typeof sub.sessionId === 'string' &&
    typeof sub.taskId === 'string' &&
    sub.artifactPayload !== undefined &&
    sub.observableEvidence !== undefined
  );
}

export function validateEvaluation(evalObj: Partial<Evaluation>): evalObj is Evaluation {
  return Boolean(
    evalObj &&
    typeof evalObj.id === 'string' &&
    typeof evalObj.submissionId === 'string' &&
    typeof evalObj.overallScore === 'number' &&
    evalObj.dimensionScores &&
    evalObj.explanation &&
    Array.isArray(evalObj.identifiedMisconceptions)
  );
}

/**
 * Adapter helper to transform legacy Seed Simulation definitions into modern WorkRound TaskDefinition
 */
export function seedSimulationToTaskDefinition(
  seed: {
    id: string;
    title: string;
    occupation_code?: string;
    target_role: string;
    domain: string;
    simulation_type: string;
    competency_name: string;
    skill_name: string;
    difficulty_level: number;
    scenario: any;
    dynamic_injection?: any;
    rubric: any;
  },
  roundIndex: number = 1
): TaskDefinition {
  const modality = (seed.simulation_type as WorkRoundModality) || 'custom';
  return {
    id: seed.id,
    roundIndex,
    modality,
    competencyTarget: {
      id: `target-${seed.id}`,
      name: seed.competency_name,
      domain: seed.domain,
      skillName: seed.skill_name,
      targetProficiency: 0.8,
      currentProficiency: 0.5,
      uncertaintyEstimate: 0.5,
      diagnosisSource: 'baseline_target',
      rationale: `Targeting core competency ${seed.competency_name} for role ${seed.target_role}.`
    },
    difficultyLevel: seed.difficulty_level || 3,
    scenario: {
      background: seed.scenario?.background || '',
      objective: seed.scenario?.objective || '',
      initialRequirements: seed.scenario?.initial_requirements || [],
      operationalConstraints: seed.scenario?.constraints || [],
      startingData: seed.scenario?.starting_data,
      toolsAvailable: seed.scenario?.tools_available || [],
      expectedOutputType: seed.scenario?.expected_output_type || 'work_product'
    },
    dynamicInjection: seed.dynamic_injection ? {
      triggerStep: seed.dynamic_injection.trigger_step,
      alertTitle: seed.dynamic_injection.alert_title,
      newRequirement: seed.dynamic_injection.new_requirement,
      constraintChange: seed.dynamic_injection.constraint_change,
      rationale: seed.dynamic_injection.rationale
    } : undefined,
    rubric: {
      dimensions: (seed.rubric?.dimensions || []).map((d: any) => ({
        name: d.name,
        weight: d.weight,
        description: d.description,
        criteria: d.criteria
      })),
      hiddenCriteria: seed.rubric?.hidden_criteria
    },
    timeAllottedSeconds: 1800,
    provenance: {
      sourceModule: 'catalog_seed',
      generatorMethod: 'catalog_seed',
      recordedAt: new Date().toISOString()
    }
  };
}
