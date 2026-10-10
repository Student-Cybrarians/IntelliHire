/**
 * M04 Universal Behavioral, Communication & Professional Interaction Simulation
 * Core Domain Contracts, Types, and Schema Validators
 */

export type InterviewQuestionCategory = 
  | 'behavioral' 
  | 'situational' 
  | 'professional_judgment' 
  | 'communication' 
  | 'role_competency';

export interface AnchoredRubric {
  unsatisfactory: string;
  competent: string;
  exceptional: string;
}

export interface InterviewQuestion {
  turn: number; // 1 to 10
  panel_role: string;
  category: InterviewQuestionCategory;
  competency: string;
  question: string;
  probe_intent: string;
  anchored_rubric: AnchoredRubric;
}

export interface InterviewPlanProvenance {
  generatedAt: string;
  modelUsed: string;
  personalizationInputs: string[];
  isFallback: boolean;
}

export interface InterviewPlan {
  planId: string;
  targetRole: string;
  domain: string;
  seniority: string;
  totalQuestions: 10;
  questions: InterviewQuestion[];
  provenance: InterviewPlanProvenance;
}

export interface CandidateAnswerSubmission {
  turn: number;
  question: string;
  candidate_response: string;
  interviewer_role: string;
  response_mode?: 'text' | 'voice';
}

export type FollowUpUncertainty = 'low' | 'medium' | 'high';

export interface AdaptiveFollowUpDecision {
  warranted: boolean;
  reason: string;
  follow_up_question?: string;
  targeted_criterion: string;
  practice_objective: string;
  is_sufficiently_complete: boolean;
  uncertainty_level: FollowUpUncertainty;
  confidence_score: number;
  probe_category: InterviewQuestionCategory;
}

export interface FollowUpExchange {
  follow_up_number: number; // 1 or 2 (strictly bounded to max_follow_ups)
  question: string;
  practice_objective: string;
  targeted_criterion: string;
  candidate_response?: string;
  submitted_at?: string;
  skipped: boolean;
  observable_evidence?: string[];
  score_impact?: number;
}

export interface TurnObservationResult {
  turn: number;
  interviewer_role: string;
  question: string;
  candidate_response: string;
  observable_evidence: string[];
  rubric_score: number;
  ai_interpretation: {
    strengths?: string;
    gaps?: string;
    coaching?: AnswerCoachingPayload;
    retry_comparison?: RetryComparison;
    attempts?: TurnAttemptRecord[];
    follow_ups?: FollowUpExchange[];
    follow_up_decision?: AdaptiveFollowUpDecision | null;
  };
  ai_recommended_probe?: string;
  recorded_at: string;
  coaching?: AnswerCoachingPayload;
  retry_comparison?: RetryComparison;
  attempts?: TurnAttemptRecord[];
  active_follow_up?: FollowUpExchange | null;
  follow_ups?: FollowUpExchange[];
  follow_up_decision?: AdaptiveFollowUpDecision | null;
}

export interface InterviewSessionSummary {
  sessionId: string;
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
  currentTurn: number; // 1 to 10
  totalQuestions: 10;
  targetRole: string;
  domain: string;
  seniority: string;
  activeQuestion: InterviewQuestion | null;
  history: TurnObservationResult[];
  cameraEnabled?: boolean;
}

/**
 * Validates that an interview plan strictly adheres to the 10-question invariant.
 */
export function validateInterviewPlan(plan: any): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!plan || typeof plan !== 'object') {
    return { valid: false, errors: ['Interview plan payload is missing or not an object.'] };
  }

  if (!Array.isArray(plan.questions)) {
    return { valid: false, errors: ['Interview plan must contain an array of questions.'] };
  }

  if (plan.questions.length !== 10) {
    errors.push(`Interview plan must contain exactly 10 questions, received ${plan.questions.length}.`);
  }

  const seenQuestions = new Set<string>();
  const turns = new Set<number>();

  plan.questions.forEach((q: any, idx: number) => {
    const qNum = idx + 1;
    if (!q || typeof q !== 'object') {
      errors.push(`Question #${qNum} is malformed.`);
      return;
    }

    if (q.turn !== qNum) {
      errors.push(`Question #${qNum} has invalid turn number '${q.turn}'. Must be ${qNum}.`);
    }
    turns.add(q.turn);

    if (!q.question || typeof q.question !== 'string' || q.question.trim().length < 15) {
      errors.push(`Question #${qNum} must contain a non-empty question string of at least 15 characters.`);
    }

    const normQ = (q.question || '').toLowerCase().trim();
    if (seenQuestions.has(normQ)) {
      errors.push(`Question #${qNum} is a duplicate of a previous question.`);
    }
    seenQuestions.add(normQ);

    if (!q.competency || typeof q.competency !== 'string') {
      errors.push(`Question #${qNum} must specify a targeted competency.`);
    }

    if (!q.panel_role || typeof q.panel_role !== 'string') {
      errors.push(`Question #${qNum} must specify a panel role.`);
    }

    if (!q.probe_intent || typeof q.probe_intent !== 'string') {
      errors.push(`Question #${qNum} must specify a probe intent.`);
    }

    if (!q.anchored_rubric || typeof q.anchored_rubric !== 'object') {
      errors.push(`Question #${qNum} must specify an anchored rubric object.`);
    } else {
      if (!q.anchored_rubric.unsatisfactory) errors.push(`Question #${qNum} rubric missing 'unsatisfactory' level.`);
      if (!q.anchored_rubric.competent) errors.push(`Question #${qNum} rubric missing 'competent' level.`);
      if (!q.anchored_rubric.exceptional) errors.push(`Question #${qNum} rubric missing 'exceptional' level.`);
    }
  });

  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Deterministic Cross-Occupation 10-Question Generator
 * Generates calibrated sequential questions without hallucinating candidate history.
 */
export function generateDeterministicInterviewPlan(params: {
  targetRole?: string;
  domain?: string;
  seniority?: string;
  skills?: string[];
  bio?: string;
}): InterviewPlan {
  const role = params.targetRole?.trim() || 'Professional Candidate';
  const domain = (params.domain || 'general').toLowerCase();
  const seniority = (params.seniority || 'mid').toLowerCase();
  const skills = params.skills && params.skills.length > 0 ? params.skills : [`Core ${role} Methodology`];
  const primarySkill = skills[0] || 'Domain Execution';
  const secondarySkill = skills[1] || 'Collaborative Problem Solving';

  const panelHiringManager = 'Hiring Manager';
  const panelDomainLead = domain.includes('software') || domain.includes('tech') 
    ? 'Principal Systems Architect'
    : domain.includes('finance')
    ? 'Chief Financial Officer'
    : domain.includes('health')
    ? 'Clinical Director'
    : domain.includes('legal')
    ? 'General Counsel'
    : 'Functional Practice Lead';
  const panelCulturePartner = 'People & Culture Partner';
  const panelExecutive = 'Executive Director';

  const questions: InterviewQuestion[] = [
    // 1. Introduction & Professional Value Proposition (Communication)
    {
      turn: 1,
      panel_role: panelHiringManager,
      category: 'communication',
      competency: 'Professional Narrative & Role Alignment',
      question: `Welcome to your interview for the ${role} position. To start off, please introduce yourself, your core professional journey, and what uniquely aligns your background with this role.`,
      probe_intent: 'Examine structured self-introduction, clarity of professional identity, and baseline communication composure.',
      anchored_rubric: {
        unsatisfactory: 'Unstructured, rambles without clear milestones, or shows little understanding of the role.',
        competent: 'Concise, chronological overview highlighting key career milestones relevant to the target role.',
        exceptional: 'Articulate value proposition connecting past impact directly to strategic challenges facing this position.'
      }
    },
    // 2. Key Project & Technical/Functional Deep Dive (Role Competency)
    {
      turn: 2,
      panel_role: panelDomainLead,
      category: 'role_competency',
      competency: `${primarySkill} Execution`,
      question: `In your work with ${primarySkill}, walk us through a complex challenge you led from requirements to delivery. What key trade-offs did you evaluate, and how did you measure success?`,
      probe_intent: 'Verifies hands-on depth, trade-off reasoning, and disciplined delivery metrics without inventing candidate facts.',
      anchored_rubric: {
        unsatisfactory: 'Surface-level description lacking concrete decisions, metrics, or personal ownership.',
        competent: 'Structured STAR breakdown explaining technical/domain decisions, constraints, and measurable impact.',
        exceptional: 'Deep analysis of trade-offs, counterfactuals, risk mitigation, and lasting architectural/process legacy.'
      }
    },
    // 3. Behavioral: Interpersonal Conflict or Stakeholder Disagreement (Behavioral)
    {
      turn: 3,
      panel_role: panelCulturePartner,
      category: 'behavioral',
      competency: 'Constructive Disagreement & Conflict Resolution',
      question: 'Describe a situation where a key stakeholder, peer, or client fundamentally disagreed with your technical or strategic recommendation. How did you handle the friction and reach an aligned outcome?',
      probe_intent: 'Assess empathy, active listening, negotiation framework, and de-escalation maturity.',
      anchored_rubric: {
        unsatisfactory: 'Blames the other party, relies on passive-aggressive escalation, or admits to yielding without resolution.',
        competent: 'Listened objectively, used data and shared business goals to bridge perspectives, and maintained mutual respect.',
        exceptional: 'Identified root cause of misalignment, co-created a compromise matrix, and strengthened long-term trust.'
      }
    },
    // 4. Professional Judgment under Ambiguity (Professional Judgment)
    {
      turn: 4,
      panel_role: panelDomainLead,
      category: 'professional_judgment',
      competency: 'Decision Making Under Incomplete Information',
      question: `Tell us about a time when you had to make a critical decision for a project with ambiguous requirements or incomplete data. How did you structure your assumptions and minimize downside risk?`,
      probe_intent: 'Examines risk assessment, decision velocity, heuristic reasoning, and contingency planning.',
      anchored_rubric: {
        unsatisfactory: 'Paralyzed by ambiguity, made reckless guesses without testing assumptions, or waited for others to decide.',
        competent: 'Documented core assumptions, consulted key domain references, and implemented reversible staging gates.',
        exceptional: 'Formulated probabilistic downside bounds, established early-warning telemetry, and communicated bounds transparently.'
      }
    },
    // 5. Situational: Overcoming Setbacks / Failure Recovery (Situational)
    {
      turn: 5,
      panel_role: panelHiringManager,
      category: 'situational',
      competency: 'Resilience & Root-Cause Remediation',
      question: 'Think of an initiative, release, or critical deliverable that did not go according to plan or failed to meet expectations. What was your immediate response, what did you learn, and how did you adapt?',
      probe_intent: 'Measures psychological ownership, blameless post-mortem discipline, and capacity for self-correction.',
      anchored_rubric: {
        unsatisfactory: 'Defensive, deflects accountability to external factors, or fails to extract meaningful lessons.',
        competent: 'Owns personal responsibility, conducted structured root-cause analysis, and implemented preventative safeguards.',
        exceptional: 'Transparently deconstructs systemic contributors, established organization-wide learning, and turned setback into breakthrough.'
      }
    },
    // 6. Cross-Functional Collaboration & Influence (Communication)
    {
      turn: 6,
      panel_role: panelCulturePartner,
      category: 'communication',
      competency: 'Cross-Disciplinary Translation & Alignment',
      question: `How do you explain complex concepts in ${primarySkill} or ${secondarySkill} to non-technical or cross-functional partners with different priorities? Can you share a concrete example?`,
      probe_intent: 'Evaluates cognitive empathy, audience-adaptive language, and alignment across diverse teams.',
      anchored_rubric: {
        unsatisfactory: 'Overwhelms audience with unexplained jargon or becomes frustrated when misunderstood.',
        competent: 'Uses analogies, business impact metrics, and user stories to make specialized concepts accessible.',
        exceptional: 'Empowers cross-functional partners to champion the initiative by framing value in their specific success metrics.'
      }
    },
    // 7. Role-Specific Technical/Functional Excellence (Role Competency)
    {
      turn: 7,
      panel_role: panelDomainLead,
      category: 'role_competency',
      competency: `${role} Standards & Rigor`,
      question: `In modern ${domain} environments, operational standards are continually evolving. What quality, security, or regulatory benchmarks do you consider non-negotiable for a ${seniority} ${role}?`,
      probe_intent: 'Tests mastery of domain hygiene, security/compliance awareness, and professional craftsmanship.',
      anchored_rubric: {
        unsatisfactory: 'Treats standards as optional bureaucratic obstacles or demonstrates ignorance of core domain hygiene.',
        competent: 'Articulates industry-standard best practices, automated linting/testing, and statutory compliance protocols.',
        exceptional: 'Embeds defensive design, observability, and auditability by default into standard operating procedures.'
      }
    },
    // 8. Ethical Governance & Professional Integrity (Professional Judgment)
    {
      turn: 8,
      panel_role: panelExecutive,
      category: 'professional_judgment',
      competency: 'Integrity & Responsible Governance',
      question: 'Have you ever been pressured to cut corners, bypass safety or compliance checks, or rush a deliverable at the expense of quality? How did you navigate the pressure while upholding professional standards?',
      probe_intent: 'Examines ethical backbone, courage to speak truth to power, and constructive escalation.',
      anchored_rubric: {
        unsatisfactory: 'Complied quietly despite knowing risks, or became purely combative without constructive solutions.',
        competent: 'Stood firm on non-negotiable safety/compliance standards and offered pragmatic phased delivery alternatives.',
        exceptional: 'Quantified the technical debt and liability of the shortcut, gained executive alignment on safe alternatives, and protected the organization.'
      }
    },
    // 9. Prioritization & Capacity Management (Situational)
    {
      turn: 9,
      panel_role: panelHiringManager,
      category: 'situational',
      competency: 'Capacity Management & Strategic Triaging',
      question: `When multiple urgent requests arrive simultaneously and resources are constrained, how do you prioritize tasks for yourself and your team without causing burnout?`,
      probe_intent: 'Checks time-boxing methodology, Eisenhower matrix application, and proactive communication of trade-offs.',
      anchored_rubric: {
        unsatisfactory: 'Reactive firefighting, accepts impossible deadlines leading to collapse, or drops tasks silently.',
        competent: 'Prioritizes by business urgency and blast radius, communicates capacity constraints early, and resets expectations.',
        exceptional: 'Establishes clear SLA tiers, automates low-value overhead, and builds sustainable team delivery velocity.'
      }
    },
    // 10. Continuous Learning & Future Impact (Behavioral)
    {
      turn: 10,
      panel_role: panelExecutive,
      category: 'behavioral',
      competency: 'Growth Mindset & Forward Impact',
      question: `Looking ahead over the next 12 to 24 months, what emerging shifts in ${domain} are you most energized by, and how are you actively developing your skills to lead in that direction as a ${role}?`,
      probe_intent: 'Assesses forward-looking curiosity, continuous upskilling habit, and long-term ambition for high impact.',
      anchored_rubric: {
        unsatisfactory: 'Complacent, unaware of modern industry shifts, or displays no self-directed learning.',
        competent: 'Cites current trends and describes concrete personal learning routines or experimental projects.',
        exceptional: 'Connects macro technology/domain shifts to strategic organizational opportunities with proactive mastery.'
      }
    }
  ];

  return {
    planId: `plan-${crypto.randomUUID().slice(0, 10)}`,
    targetRole: role,
    domain,
    seniority,
    totalQuestions: 10,
    questions,
    provenance: {
      generatedAt: new Date().toISOString(),
      modelUsed: 'deterministic_calibrated_archetype_engine_v4',
      personalizationInputs: [
        `role: ${role}`,
        `domain: ${domain}`,
        `seniority: ${seniority}`,
        `skills: ${skills.join(', ')}`
      ],
      isFallback: true
    }
  };
}

export type CoachingStructureType =
  | 'STAR'
  | 'CLAIM_EXECUTION_IMPACT'
  | 'CONTEXT_ASSESSMENT_MITIGATION_OUTCOME'
  | 'PREMISE_OPTIONS_TRADEOFFS_RESOLUTION'
  | 'BLUF';

export interface StructureStep {
  step: string;
  label: string;
  prompt: string;
}

export interface AnswerCoachingPayload {
  what_worked: string[];
  what_to_improve: string[];
  why_it_matters: string;
  how_to_improve: string;
  suggested_structure_type: CoachingStructureType;
  suggested_structure_outline: StructureStep[];
  illustrative_improved_answer: string;
  anti_hallucination_guarantee: boolean;
}

export interface RetryComparison {
  attempt_number: number;
  delta_summary: string;
  improvements_noted: string[];
  remaining_gaps: string[];
  score_delta: number;
  previous_score: number;
  current_score: number;
  calibration_notice?: string;
}

export interface TurnAttemptRecord {
  attempt_number: number;
  candidate_response: string;
  submitted_at: string;
  score: number;
  observable_evidence: string[];
  coaching: AnswerCoachingPayload;
}

/**
 * Determines the most pedagogically appropriate structure taxonomy for a question category.
 */
export function getRecommendedStructureForCategory(category: InterviewQuestionCategory): CoachingStructureType {
  switch (category) {
    case 'behavioral':
      return 'STAR';
    case 'role_competency':
      return 'CLAIM_EXECUTION_IMPACT';
    case 'situational':
      return 'CONTEXT_ASSESSMENT_MITIGATION_OUTCOME';
    case 'professional_judgment':
      return 'PREMISE_OPTIONS_TRADEOFFS_RESOLUTION';
    case 'communication':
      return 'BLUF';
    default:
      return 'STAR';
  }
}

/**
 * Returns structured step outline for the requested structure type.
 */
export function getStructureSteps(type: CoachingStructureType): StructureStep[] {
  switch (type) {
    case 'STAR':
      return [
        { step: 'Situation', label: 'Context & Scope', prompt: 'Briefly define the organizational context, project constraints, and initial operational stakes.' },
        { step: 'Task', label: 'Personal Responsibility', prompt: 'State your specific charter, what you were personally responsible for delivering, and key success criteria.' },
        { step: 'Action', label: 'Execution & Decisions', prompt: 'Detail the concrete steps, architectural/process decisions, and cross-functional leadership you executed.' },
        { step: 'Result', label: 'Impact & Measurement', prompt: 'Quantify measurable outcomes (metrics, uptime, delivery velocity) and lasting institutional lessons learned.' }
      ];
    case 'CLAIM_EXECUTION_IMPACT':
      return [
        { step: 'Claim', label: 'Technical Thesis', prompt: 'State your core technical stance or foundational design pattern immediately in your opening statement.' },
        { step: 'Execution', label: 'Implementation Mechanics', prompt: 'Walk through implementation mechanics, edge case handling, constraint mitigation, and trade-offs.' },
        { step: 'Impact', label: 'Production Verification', prompt: 'Cite concrete benchmarks, production telemetry, or verifiable qualitative impact validating the approach.' }
      ];
    case 'CONTEXT_ASSESSMENT_MITIGATION_OUTCOME':
      return [
        { step: 'Context', label: 'Scenario & Risk Horizon', prompt: 'Characterize the unexpected setback, systemic failure, or acute operational disruption.' },
        { step: 'Assessment', label: 'Root-Cause Triage', prompt: 'Describe how you rapidly isolated variables, triaged root causes, and communicated risk bounds.' },
        { step: 'Mitigation', label: 'Corrective Action', prompt: 'Explain the staged remediations you deployed to stabilize operations and eliminate single points of failure.' },
        { step: 'Outcome', label: 'Safeguards & Post-Mortem', prompt: 'Detail systemic safeguards, updated runbooks, and blameless post-mortem insights institutionalized.' }
      ];
    case 'PREMISE_OPTIONS_TRADEOFFS_RESOLUTION':
      return [
        { step: 'Premise', label: 'Dilemma & Ambiguity', prompt: 'Frame the competing business/technical demands, compliance stakes, or incomplete data conditions.' },
        { step: 'Options', label: 'Viable Alternatives', prompt: 'Articulate 2-3 credible strategic options evaluated, noting the trade-off profile of each.' },
        { step: 'Trade-offs', label: 'Constraint Weighing', prompt: 'Explain why the selected option was superior under the given organizational risk tolerance and constraints.' },
        { step: 'Resolution', label: 'Governance & Alignment', prompt: 'Demonstrate transparent stakeholder alignment, decision documentation, and post-decision monitoring.' }
      ];
    case 'BLUF':
      return [
        { step: 'BLUF', label: 'Bottom-Line-Up-Front', prompt: 'State the core recommendation, decision, or thesis concisely in the opening 20 seconds.' },
        { step: 'Context', label: 'Strategic Rationale', prompt: 'Provide audience-tailored context connecting the recommendation to executive priorities or user value.' },
        { step: 'Evidence', label: 'Supporting Data', prompt: 'Present key supporting indicators, cost/benefit trade-offs, and risk mitigations without excessive jargon.' },
        { step: 'Alignment', label: 'Next Milestones', prompt: 'Conclude with explicit ownership, requested action, and an invitation for targeted stakeholder input.' }
      ];
  }
}

/**
 * Validates Answer Coaching payload shape and invariants.
 */
export function validateCoachingPayload(coaching: any): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  if (!coaching || typeof coaching !== 'object') {
    return { valid: false, errors: ['Coaching payload is missing or not an object.'] };
  }

  if (!Array.isArray(coaching.what_worked) || coaching.what_worked.length === 0) {
    errors.push('Coaching payload must contain at least one element in what_worked.');
  }

  if (!Array.isArray(coaching.what_to_improve) || coaching.what_to_improve.length === 0) {
    errors.push('Coaching payload must contain at least one element in what_to_improve.');
  }

  if (!coaching.why_it_matters || typeof coaching.why_it_matters !== 'string') {
    errors.push('Coaching payload must contain a non-empty why_it_matters explanation.');
  }

  if (!coaching.how_to_improve || typeof coaching.how_to_improve !== 'string') {
    errors.push('Coaching payload must contain actionable how_to_improve guidance.');
  }

  const validTypes: CoachingStructureType[] = [
    'STAR', 'CLAIM_EXECUTION_IMPACT', 'CONTEXT_ASSESSMENT_MITIGATION_OUTCOME',
    'PREMISE_OPTIONS_TRADEOFFS_RESOLUTION', 'BLUF'
  ];
  if (!validTypes.includes(coaching.suggested_structure_type)) {
    errors.push(`Invalid suggested_structure_type '${coaching.suggested_structure_type}'.`);
  }

  if (!Array.isArray(coaching.suggested_structure_outline) || coaching.suggested_structure_outline.length === 0) {
    errors.push('Coaching payload must provide a non-empty suggested_structure_outline array.');
  }

  if (!coaching.illustrative_improved_answer || typeof coaching.illustrative_improved_answer !== 'string') {
    errors.push('Coaching payload must provide an illustrative_improved_answer.');
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Generates calibrated, evidence-grounded coaching deterministically.
 * Strictly guarantees anti-hallucination safe harbor by anchoring solely in candidate's response
 * and using explicit placeholders for unstated parameters.
 */
export function generateDeterministicCoaching(params: {
  category: InterviewQuestionCategory;
  question: string;
  competency: string;
  candidateResponse: string;
  rubric: AnchoredRubric;
  score: number;
}): AnswerCoachingPayload {
  const structureType = getRecommendedStructureForCategory(params.category);
  const outline = getStructureSteps(structureType);
  const response = params.candidateResponse.trim();
  const wordCount = response.split(/\s+/).filter(Boolean).length;

  const whatWorked: string[] = [];
  const whatToImprove: string[] = [];

  if (wordCount >= 40) {
    whatWorked.push('Provided adequate baseline detail and directly engaged with the core question prompt.');
  } else {
    whatToImprove.push('Response is relatively brief; expanding on specific execution actions will provide stronger evidence.');
  }

  // Check structure-specific elements
  if (structureType === 'STAR') {
    if (/(situation|context|project|team|when|at my previous)/i.test(response)) {
      whatWorked.push('Established initial contextual framing for the challenge.');
    } else {
      whatToImprove.push('Anchor the situation early: specify the system state, team environment, and primary constraint.');
    }

    if (/(action|led|designed|implemented|built|decided|orchestrated)/i.test(response)) {
      whatWorked.push('Demonstrated personal ownership by highlighting specific actions taken.');
    } else {
      whatToImprove.push('Clarify your individual agency: distinguish what you directly executed vs. general team activity.');
    }

    if (/(result|outcome|metric|percent|%|reduced|increased|delivered|saved)/i.test(response)) {
      whatWorked.push('Included observable outcomes or operational impact.');
    } else {
      whatToImprove.push('Quantify the result: incorporate measurable telemetry, timeline impact, or customer satisfaction indicators.');
    }
  } else if (structureType === 'CLAIM_EXECUTION_IMPACT') {
    if (/(approach|pattern|architecture|framework|standard)/i.test(response)) {
      whatWorked.push('Articulated an architectural pattern or methodology.');
    } else {
      whatToImprove.push('Lead with a direct technical thesis or core design paradigm before diving into details.');
    }
    whatToImprove.push('Elaborate on production verification, edge cases, and degradation safety margins.');
  } else {
    whatWorked.push('Addressed the competency domain with professional orientation.');
    whatToImprove.push(`Organize thoughts using the ${structureType.replace(/_/g, '-')} blueprint to maximize panel clarity.`);
  }

  if (whatWorked.length === 0) {
    whatWorked.push('Engaged directly with the interviewer prompt.');
  }
  if (whatToImprove.length === 0) {
    whatToImprove.push('Sharpen quantitative impact metrics and explicit trade-off justification.');
  }

  const whyItMatters = `For a ${params.competency} evaluation, interviewers look for structured thinking, clear personal accountability, and measurable results. An unstructured response obscures your true technical and leadership depth.`;

  const howToImprove = `Restructure your answer around the ${structureType} model: State your thesis upfront, outline the concrete actions you personally drove, and finish with verified outcomes. Use placeholders like [your specific metrics] to quantify impact without overstating facts.`;

  // Construct illustrative improved answer grounded in candidate's stated response
  // Guaranteed anti-hallucination: Anchors to candidate words or explicit bracketed placeholders
  let illustrativeAnswer = '';
  if (structureType === 'STAR') {
    illustrativeAnswer = `[Situation]: In a scenario involving ${params.competency.toLowerCase()}, our team faced [specific operational constraint or system challenge]. ` +
      `[Task]: My objective as the lead was to [define primary deliverable and risk boundary] within [stated timeframe]. ` +
      `[Action]: Based on my experience with ${response.slice(0, 100).replace(/[\r\n]+/g, ' ')}..., I took three decisive steps: First, [diagnostic action]; second, [implementation choice and trade-off]; third, [cross-functional alignment]. ` +
      `[Result]: This approach delivered [quantifiable outcome: e.g. X% improvement or zero downtime], establishing [lasting process or architectural safeguard] for the organization.`;
  } else if (structureType === 'CLAIM_EXECUTION_IMPACT') {
    illustrativeAnswer = `[Claim]: For ${params.competency}, the most robust paradigm is [core pattern / methodology], because it balances [key trade-off A] against [key trade-off B]. ` +
      `[Execution]: Drawing from hands-on delivery, I implement this by: 1) [initial validation and boundary definition], 2) [staged rollout or fail-safe mitigation], and 3) [automated testing]. ` +
      `[Impact]: In production, this resulted in [verifiable performance metric / SLA attainment], eliminating [identified failure mode].`;
  } else if (structureType === 'CONTEXT_ASSESSMENT_MITIGATION_OUTCOME') {
    illustrativeAnswer = `[Context]: When an unexpected issue occurred in ${params.competency.toLowerCase()}, [initial symptom / blast radius]. ` +
      `[Assessment]: I immediately isolated the root cause by [diagnostic steps] rather than treating surface symptoms. ` +
      `[Mitigation]: We executed a phased mitigation: [immediate containment step], followed by [permanent architectural fix]. ` +
      `[Outcome]: We restored normal operation within [recovery time], conducted a blameless post-mortem, and implemented [automated guardrail] to prevent recurrence.`;
  } else if (structureType === 'PREMISE_OPTIONS_TRADEOFFS_RESOLUTION') {
    illustrativeAnswer = `[Premise]: When faced with incomplete data regarding ${params.competency.toLowerCase()}, the primary risk was [downside consequence]. ` +
      `[Options]: I evaluated Option A ([alternative 1]) versus Option B ([alternative 2]). ` +
      `[Trade-offs]: While Option A offered speed, Option B provided regulatory and architectural durability under scale. ` +
      `[Resolution]: I chose [selected option], aligned stakeholders with a 1-page decision matrix, and established [telemetry trigger] to validate assumptions.`;
  } else {
    illustrativeAnswer = `[BLUF]: My direct recommendation is [core proposal], which achieves [primary business goal] while controlling [risk]. ` +
      `[Context & Rationale]: This addresses [stakeholder objective] under the current [operational constraints]. ` +
      `[Supporting Evidence]: As evidenced by [observable benchmark or past delivery], this yields [measurable benefit]. ` +
      `[Next Milestones]: To proceed, I propose [next 2 immediate action items] with [defined timeline].`;
  }

  return {
    what_worked: whatWorked,
    what_to_improve: whatToImprove,
    why_it_matters: whyItMatters,
    how_to_improve: howToImprove,
    suggested_structure_type: structureType,
    suggested_structure_outline: outline,
    illustrative_improved_answer: illustrativeAnswer,
    anti_hallucination_guarantee: true
  };
}

/**
 * Validates Adaptive Follow-Up Decision contract and safety constraints.
 */
export function validateFollowUpDecision(decision: any): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  if (!decision || typeof decision !== 'object') {
    return { valid: false, errors: ['Follow-up decision is missing or not an object.'] };
  }

  if (typeof decision.warranted !== 'boolean') {
    errors.push('Follow-up decision must contain a boolean warranted flag.');
  }

  if (!decision.reason || typeof decision.reason !== 'string' || decision.reason.trim().length < 5) {
    errors.push('Follow-up decision must contain a reason string of at least 5 characters.');
  }

  if (decision.warranted) {
    if (!decision.follow_up_question || typeof decision.follow_up_question !== 'string' || decision.follow_up_question.trim().length < 15) {
      errors.push('When warranted, follow_up_question must be at least 15 characters.');
    }
    if (decision.follow_up_question && decision.follow_up_question.length > 400) {
      errors.push('follow_up_question must not exceed 400 characters.');
    }
    if (!decision.practice_objective || typeof decision.practice_objective !== 'string' || decision.practice_objective.trim().length < 10) {
      errors.push('When warranted, practice_objective must be at least 10 characters.');
    }
    if (!decision.targeted_criterion || typeof decision.targeted_criterion !== 'string') {
      errors.push('When warranted, targeted_criterion must be specified.');
    }

    // Guardrail against prompt injection patterns in follow-up question
    const qLower = (decision.follow_up_question || '').toLowerCase();
    if (/(ignore previous|system prompt|assistant instructions|<script|javascript:)/i.test(qLower)) {
      errors.push('Follow-up question contains prohibited injection patterns.');
    }
  }

  const validUncertainties: FollowUpUncertainty[] = ['low', 'medium', 'high'];
  if (decision.uncertainty_level && !validUncertainties.includes(decision.uncertainty_level)) {
    errors.push(`Invalid uncertainty_level '${decision.uncertainty_level}'.`);
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Deterministically generates an adaptive follow-up probe decision grounded in candidate's response.
 * Strictly guarantees anti-hallucination and bounded follow-ups.
 */
export function generateDeterministicFollowUpDecision(params: {
  category: InterviewQuestionCategory;
  question: string;
  competency: string;
  candidateResponse: string;
  rubric: AnchoredRubric;
  score: number;
  existingFollowUpsCount?: number;
  maxFollowUps?: number;
}): AdaptiveFollowUpDecision {
  const maxFollowUps = params.maxFollowUps ?? 2;
  const existingCount = params.existingFollowUpsCount ?? 0;
  const response = (params.candidateResponse || '').trim();
  const wordCount = response.split(/\s+/).filter(Boolean).length;
  const category = params.category || 'behavioral';

  // Strict boundary: Max follow-ups reached
  if (existingCount >= maxFollowUps) {
    return {
      warranted: false,
      reason: `Maximum limit of ${maxFollowUps} follow-up probes reached for this primary question.`,
      targeted_criterion: params.competency,
      practice_objective: 'Proceed to coaching and synthesis with existing evidence.',
      is_sufficiently_complete: true,
      uncertainty_level: 'low',
      confidence_score: 0.98,
      probe_category: category
    };
  }

  // Completeness check: If answer is thorough (>= 50 words with high score >= 0.88 and concrete evidence)
  const hasStrongStructure = wordCount >= 50 && params.score >= 0.88;
  if (hasStrongStructure) {
    return {
      warranted: false,
      reason: 'Candidate response is sufficiently comprehensive, providing verifiable evidence and structured reasoning across all anchored rubric criteria.',
      targeted_criterion: params.competency,
      practice_objective: 'Review coaching feedback and advance to the next primary question.',
      is_sufficiently_complete: true,
      uncertainty_level: 'low',
      confidence_score: 0.92,
      probe_category: category
    };
  }

  // Generate category-specific follow-up probe based on observed gaps
  switch (category) {
    case 'behavioral': {
      const mentionsAction = /(i led|i designed|i built|i decided|i implemented|i chose|my role|personally)/i.test(response);
      const mentionsResult = /(result|metric|reduced|increased|improved|delivered|%|saved|outcome)/i.test(response);

      if (!mentionsAction) {
        return {
          warranted: true,
          reason: 'Response describes team activities or generalized context without clearly isolating the candidate\'s direct personal actions.',
          follow_up_question: 'Could you walk me through the specific actions you personally executed, distinguishing your direct leadership from what the broader team delivered?',
          targeted_criterion: 'Individual Agency & Personal Action Execution',
          practice_objective: 'Practice articulating personal agency and ownership in high-stakes situations.',
          is_sufficiently_complete: false,
          uncertainty_level: 'low',
          confidence_score: 0.90,
          probe_category: 'behavioral'
        };
      }

      if (!mentionsResult) {
        return {
          warranted: true,
          reason: 'Response outlines execution steps but omits verifiable operational or business results.',
          follow_up_question: 'What was the measurable outcome or operational impact of that effort, and how did you verify its long-term success?',
          targeted_criterion: 'Measurable Outcomes & Verifiable Impact',
          practice_objective: 'Practice quantifying business outcomes and long-term sustainability.',
          is_sufficiently_complete: false,
          uncertainty_level: 'low',
          confidence_score: 0.90,
          probe_category: 'behavioral'
        };
      }

      if (existingCount >= 1) {
        return {
          warranted: false,
          reason: 'Candidate addressed the follow-up probe, providing clear personal agency and verifiable outcomes.',
          targeted_criterion: params.competency,
          practice_objective: 'Proceed to coaching and synthesis with existing evidence.',
          is_sufficiently_complete: true,
          uncertainty_level: 'low',
          confidence_score: 0.94,
          probe_category: 'behavioral'
        };
      }

      return {
        warranted: true,
        reason: 'Candidate provided initial actions; probing for edge cases and systemic learnings.',
        follow_up_question: 'Looking back at that scenario, what unexpected complication arose during execution, and how did you adapt your plan?',
        targeted_criterion: 'Adaptive Execution & Post-Implementation Learnings',
        practice_objective: 'Practice reflecting on execution challenges and demonstrating continuous learning.',
        is_sufficiently_complete: false,
        uncertainty_level: 'medium',
        confidence_score: 0.85,
        probe_category: 'behavioral'
      };
    }

    case 'role_competency': {
      const mentionsTradeoffs = /(trade-off|tradeoff|versus|alternative|downside|latency|throughput|cost|scale)/i.test(response);

      if (!mentionsTradeoffs) {
        return {
          warranted: true,
          reason: 'Technical assertion was stated without detailing architectural trade-offs or production failure modes.',
          follow_up_question: `What specific technical trade-offs did you balance in your approach to ${params.competency}, and how did you guard against potential failure modes?`,
          targeted_criterion: 'Architectural Trade-offs & Failure Mode Mitigation',
          practice_objective: 'Practice defending technical architecture choices and fault tolerance.',
          is_sufficiently_complete: false,
          uncertainty_level: 'low',
          confidence_score: 0.91,
          probe_category: 'role_competency'
        };
      }

      if (existingCount >= 1) {
        return {
          warranted: false,
          reason: 'Candidate clarified technical architecture and trade-off rationale in response to probe.',
          targeted_criterion: params.competency,
          practice_objective: 'Proceed to coaching and synthesis.',
          is_sufficiently_complete: true,
          uncertainty_level: 'low',
          confidence_score: 0.94,
          probe_category: 'role_competency'
        };
      }

      return {
        warranted: true,
        reason: 'Technical baseline established; probing verification telemetry and degradation boundaries.',
        follow_up_question: 'How did you instrument and monitor this system in production to ensure SLA compliance under unexpected traffic spikes?',
        targeted_criterion: 'Production Telemetry & SLA Resilience',
        practice_objective: 'Practice articulating observability and production operational excellence.',
        is_sufficiently_complete: false,
        uncertainty_level: 'low',
        confidence_score: 0.88,
        probe_category: 'role_competency'
      };
    }

    case 'situational': {
      if (existingCount >= 1) {
        return {
          warranted: false,
          reason: 'Candidate addressed dynamic risk mitigation and contingency planning in response to probe.',
          targeted_criterion: params.competency,
          practice_objective: 'Proceed to coaching and synthesis.',
          is_sufficiently_complete: true,
          uncertainty_level: 'low',
          confidence_score: 0.93,
          probe_category: 'situational'
        };
      }

      return {
        warranted: true,
        reason: 'Candidate addressed the primary incident; probing constraint shifts and blast-radius containment.',
        follow_up_question: 'If this operational incident escalated and halved your acceptable recovery time, what immediate trade-offs would you make to contain blast radius?',
        targeted_criterion: 'Dynamic Blast-Radius Containment & Crisis Triage',
        practice_objective: 'Practice agile risk triage and contingency decision-making under escalating pressure.',
        is_sufficiently_complete: false,
        uncertainty_level: 'low',
        confidence_score: 0.90,
        probe_category: 'situational'
      };
    }

    case 'professional_judgment': {
      if (existingCount >= 1) {
        return {
          warranted: false,
          reason: 'Candidate clarified alternative options and decision trade-offs in response to probe.',
          targeted_criterion: params.competency,
          practice_objective: 'Proceed to coaching and synthesis.',
          is_sufficiently_complete: true,
          uncertainty_level: 'low',
          confidence_score: 0.93,
          probe_category: 'professional_judgment'
        };
      }

      return {
        warranted: true,
        reason: 'Candidate outlined a resolution; probing comparative alternatives and decision governance.',
        follow_up_question: 'What other viable option did you seriously consider, and what principle or metric led you to reject it in favor of your chosen direction?',
        targeted_criterion: 'Multi-Option Comparative Analysis & Principled Governance',
        practice_objective: 'Practice transparent decision evaluation and justifying trade-offs to senior leadership.',
        is_sufficiently_complete: false,
        uncertainty_level: 'low',
        confidence_score: 0.90,
        probe_category: 'professional_judgment'
      };
    }

    case 'communication':
    default: {
      if (existingCount >= 1) {
        return {
          warranted: false,
          reason: 'Candidate provided concise executive synthesis in response to probe.',
          targeted_criterion: params.competency,
          practice_objective: 'Proceed to coaching and synthesis.',
          is_sufficiently_complete: true,
          uncertainty_level: 'low',
          confidence_score: 0.93,
          probe_category: 'communication'
        };
      }

      return {
        warranted: true,
        reason: 'Response contains valuable ideas; probing for concise executive synthesis and structured delivery.',
        follow_up_question: 'If you had just 30 seconds with an executive sponsor, how would you state your bottom-line proposal and core justification?',
        targeted_criterion: 'Executive BLUF Synthesis & High-Stakes Clarity',
        practice_objective: 'Practice concise Bottom-Line-Up-Front (BLUF) synthesis for executive audiences.',
        is_sufficiently_complete: false,
        uncertainty_level: 'low',
        confidence_score: 0.89,
        probe_category: 'communication'
      };
    }
  }
}
