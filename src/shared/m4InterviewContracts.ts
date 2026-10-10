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
  };
  ai_recommended_probe?: string;
  recorded_at: string;
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
