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

export type { AssessmentPurpose } from './evidenceStrategy';
import type { AssessmentPurpose } from './evidenceStrategy';

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
// 2. Candidate, Job & Role Context Contracts
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

export interface RoleContext {
  roleTitle: string;
  domain: string;
  occupationCode?: string; // O*NET code e.g. '15-1252.00'
  occupationTitle?: string;
  seniorityLevel: SeniorityLevel | string;
  expectedProficiencyBaseline?: number;
  seniorityExpectations: {
    complexityCeiling: string;
    autonomyLevel: string;
    decisionScope: string;
    expectedProficiencyBaseline: number;
  };
  requiredCompetencies: Array<{
    name: string;
    priority: 'mandatory' | 'preferred' | 'bonus';
    weight: number;
  }>;
}

// -----------------------------------------------------------------------------
// 3. Evidence Reference & Gap Signal Contracts (5-Layer Distinction)
// -----------------------------------------------------------------------------

export type EvidenceCategory =
  | 'source_evidence'       // Raw text snippets from resume, logs, or interview transcripts
  | 'extracted_fact'        // Validated facts e.g. executed tests, code syntax, answers
  | 'model_interpretation'  // Inferred reasoning e.g. ATS score, LLM rubric feedback
  | 'human_judgment';       // Hiring manager / committee review ratings

export interface EvidenceReference {
  id: string;
  sourceModule: 'm01_resume' | 'm02_assessment' | 'm03_simulation' | 'm04_interview' | 'm05_ledger' | 'human_review';
  sourceRecordId?: string;
  evidenceCategory: EvidenceCategory;
  statement: string;
  competencyOrSkill: string;
  confidenceScore: number;     // 0.0 - 1.0 (calibrated confidence)
  uncertaintyScore: number;    // 0.0 - 1.0 (Bayesian/Kalman variance)
  isDirectObservation: boolean; // true if authenticated work product, false if self-claim
  observedAt: string;
  humanVerificationState?: 'unreviewed' | 'verified' | 'disputed' | 'overridden';
}

export interface GapSignal {
  id: string;
  skillName: string;
  competencyName: string;
  sourceModule: 'm01_ats_match' | 'm02_assessment' | 'm02_misconception' | 'm03_simulation';
  gapOriginType: 'confirmed_weakness' | 'high_uncertainty' | 'unassessed_critical' | 'misconception_flag' | 'missing_claim';
  severity: 'critical' | 'moderate' | 'low';
  observedDeficit: string;
  misconceptionDetails?: {
    remediationAdvice: string;
    divergencePattern: string;
  };
  confidence: number;
  uncertainty: number;
  detectedAt: string;
}

// -----------------------------------------------------------------------------
// 4. Competency & Skill Target Contracts
// -----------------------------------------------------------------------------

export interface SkillTarget {
  id: string;
  skillName: string;
  competencyName: string;
  domain: string;
  targetProficiency: number;
  currentProficiency: number;
  uncertaintyEstimate: number;
  observationCount: number;
  gapSignal?: GapSignal;
  targetingPriorityScore: number; // 0.0 - 1.0 (composite rank)
  priorityBreakdown: {
    jobRelevanceWeight: number;
    uncertaintyDeficitWeight: number;
    gapSeverityWeight: number;
    coverageDeficitWeight: number;
    recencyFatiguePenalty: number;
    rationale: string;
  };
}

export interface CompetencyTarget {
  id: string;
  name: string;
  domain: string;
  skillName: string;
  skillId?: string;
  targetProficiency: number; // 0.0 - 1.0 (threshold sought)
  currentProficiency: number; // 0.0 - 1.0 (prior belief)
  uncertaintyEstimate: number; // 0.0 - 1.0 (uncertainty in belief)
  observationCount?: number;
  diagnosisSource: 'm01_ats_gap' | 'm02_assessment_gap' | 'm02_misconception' | 'm03_simulation_gap' | 'job_requirement' | 'baseline_target';
  rationale: string;
  targetingScore?: number; // Composite rank score
  skills?: SkillTarget[];
}

// -----------------------------------------------------------------------------
// 5. Unified Assessment Context Contract
// -----------------------------------------------------------------------------

export interface AssessmentContext {
  contextId: string;
  candidateContext: CandidateContext;
  jobContext: JobContext;
  roleContext: RoleContext;
  assessmentPurpose: AssessmentPurpose;
  evidenceLedger: EvidenceReference[];
  gapSignals: GapSignal[];
  prioritizedTargets: CompetencyTarget[];
  primaryRecommendedTarget: CompetencyTarget;
  activeWorkModality: WorkRoundModality;
  securityGovernance: {
    tenantId: string;
    organizationId: string;
    candidateUserId: string;
    sensitiveAttributesExcluded: boolean;
    exclusionAudit: string[];
    createdAt: string;
  };
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
// 5. Universal Task Definition & Extensible Archetype Contracts
// -----------------------------------------------------------------------------

export type TaskForm =
  | 'direct_problem'
  | 'scenario'
  | 'case_study'
  | 'debugging'
  | 'practical_execution'
  | 'analysis'
  | 'system_design'
  | 'written_response'
  | 'quantitative_calculation'
  | 'strategic_decision'
  | 'what_if_simulation'
  | 'constraint_shift'
  | 'alternative_evaluation'
  | 'reasoning_explanation'
  | 'artifact_critique'
  | 'artifact_improvement';

export type CognitiveDimension =
  | 'knowledge_application'
  | 'analytical_reasoning'
  | 'technical_execution'
  | 'problem_solving'
  | 'judgment_and_tradeoffs'
  | 'communication'
  | 'creativity'
  | 'strategic_alignment'
  | 'risk_and_ethics'
  | 'adaptability'
  | 'practical_performance';

export type TaskFamily =
  // Technical families
  | 'coding'
  | 'debugging'
  | 'code_review'
  | 'algorithms'
  | 'sql_data'
  | 'data_analysis'
  | 'system_design'
  | 'cloud_infrastructure'
  | 'cybersecurity'
  | 'troubleshooting'
  | 'technical_docs'
  | 'configuration'
  // Non-Technical families
  | 'financial_modeling'
  | 'operations_management'
  | 'marketing_strategy'
  | 'sales_enablement'
  | 'hr_people'
  | 'customer_success'
  | 'procurement_vendor'
  | 'legal_compliance'
  | 'project_management'
  | 'executive_decision';

export interface TaskSeniorityScope {
  level: SeniorityLevel | string;
  ambiguityLevel: 'low' | 'moderate' | 'high' | 'very_high';
  systemScope: 'local_component' | 'subsystem' | 'cross_system' | 'enterprise_strategic';
  expectedAutonomy: 'procedural' | 'independent' | 'architectural' | 'organizational';
  complexityFactor: number; // 1.0 - 2.5
}

export interface TaskCoreModel {
  input: string;
  constraints: string[];
  cognitiveOperation: string;
  expectedOutput: string;
  observableEvidence: string[];
  evaluationCriteria: string[];
}

export interface ObservableEvidenceCriteria {
  requiredArtifacts: string[];
  demonstratedBehaviors: string[];
  measurableIndicators: Array<{
    name: string;
    description: string;
    threshold?: string;
  }>;
}

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
  taskForm?: TaskForm;
  taskFamily?: TaskFamily;
  cognitiveDimensions?: CognitiveDimension[];
  seniorityScope?: TaskSeniorityScope;
  coreModel?: TaskCoreModel;
  observableCriteria?: ObservableEvidenceCriteria;
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
  repetitionFingerprint?: string;
  qualityScore?: number;
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
export function calculateTaskRepetitionFingerprint(title: string, objective: string, skill: string): string {
  const norm = `${title.toLowerCase().trim()}|${objective.toLowerCase().trim()}|${skill.toLowerCase().trim()}`;
  let hash = 0;
  for (let i = 0; i < norm.length; i++) {
    hash = ((hash << 5) - hash) + norm.charCodeAt(i);
    hash |= 0;
  }
  return `fp-${Math.abs(hash).toString(16)}`;
}

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

  let taskForm: TaskForm = 'practical_execution';
  let taskFamily: TaskFamily = 'coding';
  if (seed.simulation_type === 'financial_analysis') {
    taskForm = 'quantitative_calculation';
    taskFamily = 'financial_modeling';
  } else if (seed.simulation_type === 'operational_triage') {
    taskForm = 'scenario';
    taskFamily = 'operations_management';
  } else if (seed.simulation_type === 'written_response') {
    taskForm = 'written_response';
    taskFamily = 'legal_compliance';
  } else if (seed.simulation_type === 'incident_investigation') {
    taskForm = 'debugging';
    taskFamily = 'troubleshooting';
  }

  const coreModel: TaskCoreModel = {
    input: seed.scenario?.background || '',
    constraints: seed.scenario?.constraints || [],
    cognitiveOperation: seed.scenario?.objective || '',
    expectedOutput: seed.scenario?.expected_output_type || 'work_product',
    observableEvidence: seed.scenario?.initial_requirements || [],
    evaluationCriteria: (seed.rubric?.dimensions || []).map((d: any) => `${d.name}: ${d.criteria}`)
  };

  const seniorityScope: TaskSeniorityScope = {
    level: 'senior',
    ambiguityLevel: 'moderate',
    systemScope: 'subsystem',
    expectedAutonomy: 'independent',
    complexityFactor: 1.5
  };

  return {
    id: seed.id,
    roundIndex,
    modality,
    taskForm,
    taskFamily,
    cognitiveDimensions: [
      'technical_execution',
      'analytical_reasoning',
      'problem_solving',
      'judgment_and_tradeoffs',
      'adaptability'
    ],
    seniorityScope,
    coreModel,
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
    repetitionFingerprint: calculateTaskRepetitionFingerprint(seed.title, seed.scenario?.objective || '', seed.skill_name),
    qualityScore: 0.94,
    timeAllottedSeconds: 1800,
    provenance: {
      sourceModule: 'catalog_seed',
      generatorMethod: 'catalog_seed',
      recordedAt: new Date().toISOString()
    }
  };
}

export function normalizeSeniorityLevel(seniorityStr?: string): 'entry' | 'junior' | 'mid' | 'senior' | 'lead' | 'manager' | 'executive' {
  const s = (seniorityStr || 'mid').toLowerCase().trim();
  if (s.includes('entry') || s.includes('intern') || s.includes('assoc')) return 'entry';
  if (s.includes('junior')) return 'junior';
  if (s.includes('senior') || s.includes('sr')) return 'senior';
  if (s.includes('lead') || s.includes('staff') || s.includes('principal')) return 'lead';
  if (s.includes('manager') || s.includes('head')) return 'manager';
  if (s.includes('director') || s.includes('vp') || s.includes('exec') || s.includes('chief')) return 'executive';
  return 'mid';
}

export function scaleTaskToCandidateSeniority(baseTask: TaskDefinition, targetSeniority?: string): TaskDefinition {
  const normLevel = normalizeSeniorityLevel(targetSeniority || baseTask.seniorityScope?.level);
  
  const profiles: Record<string, {
    ambiguity: 'low' | 'moderate' | 'high' | 'very_high';
    scope: 'local_component' | 'subsystem' | 'cross_system' | 'enterprise_strategic';
    autonomy: 'procedural' | 'independent' | 'architectural' | 'organizational';
    complexityFactor: number;
    timeAllotted: number;
  }> = {
    entry: { ambiguity: 'low', scope: 'local_component', autonomy: 'procedural', complexityFactor: 1.0, timeAllotted: 1200 },
    junior: { ambiguity: 'low', scope: 'local_component', autonomy: 'independent', complexityFactor: 1.2, timeAllotted: 1500 },
    mid: { ambiguity: 'moderate', scope: 'subsystem', autonomy: 'independent', complexityFactor: 1.5, timeAllotted: 1800 },
    senior: { ambiguity: 'high', scope: 'cross_system', autonomy: 'architectural', complexityFactor: 1.8, timeAllotted: 2100 },
    lead: { ambiguity: 'high', scope: 'cross_system', autonomy: 'architectural', complexityFactor: 2.1, timeAllotted: 2400 },
    manager: { ambiguity: 'very_high', scope: 'enterprise_strategic', autonomy: 'organizational', complexityFactor: 2.3, timeAllotted: 2400 },
    executive: { ambiguity: 'very_high', scope: 'enterprise_strategic', autonomy: 'organizational', complexityFactor: 2.5, timeAllotted: 2700 }
  };

  const prof = profiles[normLevel] || profiles.mid;
  const constraints = [...(baseTask.scenario.operationalConstraints || [])];
  let expectedOutput = baseTask.scenario.expectedOutputType || 'work_product';

  if (normLevel === 'entry' || normLevel === 'junior') {
    constraints.push('Implementation must pass all unit tests without modifying function signatures.');
    expectedOutput = 'Fully passing implementation with boundary condition unit tests.';
  } else if (normLevel === 'mid') {
    constraints.push('Must handle asynchronous retries with exponential backoff and circuit breaking.');
    expectedOutput = 'Production-ready service implementation with comprehensive error propagation.';
  } else if (normLevel === 'senior' || normLevel === 'lead') {
    constraints.push('Must guarantee atomic state transitions under concurrent multi-region contention.');
    constraints.push('Design must detail failover degraded mode with bounded p99 latency SLO (<15ms).');
    expectedOutput = 'Resilient architectural implementation accompanied by technical trade-off RFC.';
  } else {
    constraints.push('Must provide executive ROI and capital expenditure sensitivity model under varying adoption rates.');
    constraints.push('Identify regulatory, security, and human capital trade-offs with explicit mitigation milestones.');
    expectedOutput = 'Strategic decision memo, financial sensitivity schedule, and executive presentation.';
  }

  // Adjust rubric dimension weights
  const dimensions = baseTask.rubric.dimensions.map(d => ({ ...d }));
  if (normLevel === 'senior' || normLevel === 'lead') {
    for (const d of dimensions) {
      if (['architecture', 'resilience', 'decision_quality', 'system_design'].includes(d.name)) {
        d.weight = Math.max(d.weight, 0.35);
      } else if (d.name === 'correctness') {
        d.weight = Math.min(d.weight, 0.20);
      }
    }
  } else if (normLevel === 'manager' || normLevel === 'executive') {
    for (const d of dimensions) {
      if (['decision_quality', 'communication', 'adaptability', 'strategic_alignment'].includes(d.name)) {
        d.weight = Math.max(d.weight, 0.35);
      }
    }
  }

  // Re-normalize weights so sum is strictly 1.00
  const totalWeight = dimensions.reduce((acc, d) => acc + d.weight, 0);
  if (totalWeight > 0) {
    for (const d of dimensions) {
      d.weight = Math.round((d.weight / totalWeight) * 100) / 100;
    }
    const currentSum = dimensions.reduce((acc, d) => acc + d.weight, 0);
    const diff = Math.round((1.0 - currentSum) * 100) / 100;
    if (dimensions.length > 0 && diff !== 0) {
      dimensions[0].weight = Math.round((dimensions[0].weight + diff) * 100) / 100;
    }
  }

  const updatedCoreModel: TaskCoreModel = baseTask.coreModel ? {
    ...baseTask.coreModel,
    constraints,
    expectedOutput,
    evaluationCriteria: dimensions.map(d => `${d.name}: ${d.criteria}`)
  } : {
    input: baseTask.scenario.background,
    constraints,
    cognitiveOperation: baseTask.scenario.objective,
    expectedOutput,
    observableEvidence: baseTask.scenario.initialRequirements,
    evaluationCriteria: dimensions.map(d => `${d.name}: ${d.criteria}`)
  };

  return {
    ...baseTask,
    seniorityScope: {
      level: normLevel,
      ambiguityLevel: prof.ambiguity,
      systemScope: prof.scope,
      expectedAutonomy: prof.autonomy,
      complexityFactor: prof.complexityFactor
    },
    timeAllottedSeconds: prof.timeAllotted,
    scenario: {
      ...baseTask.scenario,
      operationalConstraints: constraints,
      expectedOutputType: expectedOutput
    },
    rubric: {
      ...baseTask.rubric,
      dimensions
    },
    coreModel: updatedCoreModel
  };
}

// -----------------------------------------------------------------------------
// 13. Sensitive Attribute Exclusion & Fairness Safeguards
// -----------------------------------------------------------------------------

export const SENSITIVE_ATTRIBUTES = [
  'age', 'date_of_birth', 'birth_year', 'graduation_year',
  'gender', 'sex', 'pronouns',
  'race', 'ethnicity', 'nationality', 'citizenship_status',
  'religion', 'creed', 'caste',
  'sexual_orientation',
  'marital_status', 'parental_status', 'pregnancy',
  'disability', 'medical_condition', 'genetic_information',
  'veteran_status', 'postal_address', 'zip_code', 'financial_background'
] as const;

export function sanitizeContextForTaskTargeting<T>(payload: T): { sanitized: T; sensitiveTraitsFound: string[] } {
  const sensitiveTraitsFound: string[] = [];

  function recursiveSanitize(obj: any, path: string = ''): any {
    if (obj === null || obj === undefined) return obj;
    if (typeof obj === 'string') {
      return obj;
    }
    if (Array.isArray(obj)) {
      return obj.map((item, idx) => recursiveSanitize(item, `${path}[${idx}]`));
    }
    if (typeof obj === 'object') {
      const sanitizedObj: any = {};
      for (const [key, value] of Object.entries(obj)) {
        const lowerKey = key.toLowerCase();
        const currentPath = path ? `${path}.${key}` : key;
        if (SENSITIVE_ATTRIBUTES.some(attr => lowerKey === attr || lowerKey.includes(`_${attr}`) || lowerKey.includes(`${attr}_`))) {
          sensitiveTraitsFound.push(currentPath);
          continue; // Strip key completely
        }
        sanitizedObj[key] = recursiveSanitize(value, currentPath);
      }
      return sanitizedObj;
    }
    return obj;
  }

  const sanitized = recursiveSanitize(payload);
  if (sanitized && typeof sanitized === 'object' && (sanitized as any).securityGovernance) {
    (sanitized as any).securityGovernance.sensitiveAttributesExcluded = true;
    (sanitized as any).securityGovernance.exclusionAudit = sensitiveTraitsFound;
  }
  return { sanitized, sensitiveTraitsFound };
}

// -----------------------------------------------------------------------------
// 14. Phase 2 Validation Predicates
// -----------------------------------------------------------------------------

export function validateRoleContext(role: Partial<RoleContext>): role is RoleContext {
  return Boolean(
    role &&
    typeof role.roleTitle === 'string' &&
    typeof role.domain === 'string' &&
    role.seniorityExpectations &&
    Array.isArray(role.requiredCompetencies)
  );
}

export function validateEvidenceReference(ev: Partial<EvidenceReference>): ev is EvidenceReference {
  return Boolean(
    ev &&
    typeof ev.id === 'string' &&
    typeof ev.sourceModule === 'string' &&
    typeof ev.evidenceCategory === 'string' &&
    typeof ev.statement === 'string' &&
    typeof ev.confidenceScore === 'number' &&
    typeof ev.uncertaintyScore === 'number'
  );
}

export function validateGapSignal(gap: Partial<GapSignal>): gap is GapSignal {
  return Boolean(
    gap &&
    typeof gap.id === 'string' &&
    typeof gap.skillName === 'string' &&
    typeof gap.sourceModule === 'string' &&
    typeof gap.gapOriginType === 'string' &&
    typeof gap.severity === 'string'
  );
}

export function validateAssessmentContext(ctx: Partial<AssessmentContext>): ctx is AssessmentContext {
  return Boolean(
    ctx &&
    typeof ctx.contextId === 'string' &&
    ctx.candidateContext &&
    ctx.jobContext &&
    ctx.roleContext &&
    Array.isArray(ctx.evidenceLedger) &&
    Array.isArray(ctx.gapSignals) &&
    Array.isArray(ctx.prioritizedTargets) &&
    ctx.securityGovernance &&
    ctx.securityGovernance.sensitiveAttributesExcluded === true
  );
}

export function validateUniversalTaskDefinition(task: Partial<TaskDefinition>): task is TaskDefinition {
  return Boolean(
    task &&
    typeof task.id === 'string' &&
    typeof task.modality === 'string' &&
    task.competencyTarget &&
    task.scenario &&
    typeof task.scenario.objective === 'string' &&
    Array.isArray(task.scenario.initialRequirements) &&
    task.rubric &&
    Array.isArray(task.rubric.dimensions) &&
    task.rubric.dimensions.length > 0
  );
}
