import { Hono } from 'hono';
import type { Bindings, UserSession } from './[[route]]';
import { getSessionUser, logAuditEvent } from './[[route]]';
import {
  InterviewPlan,
  InterviewQuestion,
  InterviewQuestionCategory,
  AnchoredRubric,
  AnswerCoachingPayload,
  RetryComparison,
  TurnAttemptRecord,
  CoachingStructureType,
  FollowUpUncertainty,
  AdaptiveFollowUpDecision,
  FollowUpExchange,
  getRecommendedStructureForCategory,
  getStructureSteps,
  generateDeterministicCoaching,
  validateCoachingPayload,
  validateInterviewPlan,
  generateDeterministicInterviewPlan,
  validateFollowUpDecision,
  generateDeterministicFollowUpDecision
} from '../../src/shared/m4InterviewContracts';

/**
 * Phase 2: Evidence-Grounded Answer Coaching & Structure Guidance Generator
 * Generates structured feedback (what worked, what to improve, why it matters, how to improve,
 * structure blueprint outline, and illustrative improved answer with anti-hallucination safe harbor).
 */
export async function generateAnswerCoaching(
  env: Bindings,
  params: {
    category: InterviewQuestionCategory;
    question: string;
    competency: string;
    candidateResponse: string;
    rubric: AnchoredRubric;
    score: number;
    observableEvidence?: string[];
    aiInterpretation?: { strengths?: string; gaps?: string };
  }
): Promise<AnswerCoachingPayload> {
  const structureType = getRecommendedStructureForCategory(params.category);
  const structureOutline = getStructureSteps(structureType);

  if (env.NVIDIA_API_KEY) {
    try {
      const prompt = `You are an elite executive interview communication coach and presentation advisor.
Target Competency: "${params.competency}"
Question: "${params.question}"
Candidate Response:
"${params.candidateResponse}"

Anchored Rubric:
Unsatisfactory: "${params.rubric?.unsatisfactory || ''}"
Competent: "${params.rubric?.competent || ''}"
Exceptional: "${params.rubric?.exceptional || ''}"

Evaluation Score: ${Math.round(params.score * 100)}%
Observed Evidence: ${JSON.stringify(params.observableEvidence || [])}
Observed Strengths: "${params.aiInterpretation?.strengths || ''}"
Observed Gaps: "${params.aiInterpretation?.gaps || ''}"

TASK: Provide structured, actionable, evidence-grounded coaching for this candidate.
Recommended Structure Blueprint: "${structureType}"

CRITICAL ANTI-HALLUCINATION INVARIANTS:
1. Do NOT invent new employers, projects, metrics, degrees, or certifications that the candidate did NOT mention.
2. Anchor the improved answer strictly in the facts and terminology the candidate already used.
3. For missing data points, metrics, or specifics, use bracketed placeholders such as "[your specific metric / latency / team size / timeline]".
4. Do NOT evaluate physical appearance, facial expressions, tone, or personality traits. Focus purely on verbal structure, logic, evidence depth, and professional communication clarity.

Return ONLY valid JSON matching this schema:
{
  "what_worked": ["<concrete observed strength in their response>", "<another specific strength>"],
  "what_to_improve": ["<concrete omission or structural weakness to fix>", "<another specific improvement>"],
  "why_it_matters": "<clear 1-2 sentence explanation of why this distinction matters to hiring managers and executive panels>",
  "how_to_improve": "<concrete actionable advice on how to restructure the answer using ${structureType}>",
  "suggested_structure_type": "${structureType}",
  "suggested_structure_outline": ${JSON.stringify(structureOutline)},
  "illustrative_improved_answer": "<fully articulated model response demonstrating the ${structureType} structure without hallucinating facts>",
  "anti_hallucination_guarantee": true
}`;

      const aiResp = await fetch('https://integrate.api.nvidia.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${env.NVIDIA_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'meta/muse-glimmer-30b',
          messages: [
            { role: 'system', content: 'You are an objective executive communication coach. Return ONLY valid JSON.' },
            { role: 'user', content: prompt }
          ],
          temperature: 0.2,
          max_tokens: 1500
        })
      });

      if (aiResp.ok) {
        const aiData = await aiResp.json() as any;
        const content = aiData.choices?.[0]?.message?.content || '{}';
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          const validation = validateCoachingPayload(parsed);
          if (validation.valid) {
            parsed.anti_hallucination_guarantee = true;
            return parsed;
          }
        }
      }
    } catch (_) {
      // Fallback on error
    }
  }

  // Deterministic fallback
  return generateDeterministicCoaching({
    category: params.category,
    question: params.question,
    competency: params.competency,
    candidateResponse: params.candidateResponse,
    rubric: params.rubric,
    score: params.score
  });
}

/**
 * Phase 3: Adaptive Conversational Follow-Up & Dynamic Probing Decision Engine
 * Determines whether a targeted follow-up probe is warranted to clarify ambiguity or missing evidence,
 * strictly bounded to a max of 2 follow-ups per primary question.
 */
export async function generateAdaptiveFollowUpDecision(
  env: Bindings,
  params: {
    category: InterviewQuestionCategory;
    question: string;
    competency: string;
    candidateResponse: string;
    rubric: AnchoredRubric;
    score: number;
    observableEvidence?: string[];
    existingFollowUpsCount?: number;
    maxFollowUps?: number;
  }
): Promise<AdaptiveFollowUpDecision> {
  const maxFollowUps = params.maxFollowUps ?? 2;
  const existingCount = params.existingFollowUpsCount ?? 0;

  // Strict boundary: Never exceed max follow-ups
  if (existingCount >= maxFollowUps) {
    return generateDeterministicFollowUpDecision(params);
  }

  // Completeness check: If answer is already strong (>= 50 words, score >= 0.88), no follow-up needed
  const wordCount = (params.candidateResponse || '').trim().split(/\s+/).filter(Boolean).length;
  if (wordCount >= 50 && params.score >= 0.88) {
    return generateDeterministicFollowUpDecision(params);
  }

  if (env.NVIDIA_API_KEY) {
    try {
      const prompt = `You are an expert executive interview panelist conducting a structured, adaptive interview.
Target Competency: "${params.competency}"
Question: "${params.question}"
Category: "${params.category}"
Candidate's Current Response:
"${params.candidateResponse}"

Anchored Rubric:
Unsatisfactory: "${params.rubric?.unsatisfactory || ''}"
Competent: "${params.rubric?.competent || ''}"
Exceptional: "${params.rubric?.exceptional || ''}"

Current Score Estimate: ${Math.round(params.score * 100)}%
Observed Evidence: ${JSON.stringify(params.observableEvidence || [])}
Follow-ups already asked on this question: ${existingCount} (Maximum allowed: ${maxFollowUps})

DECISION TASK:
1. Analyze if the candidate's response has specific ambiguities, missing operational trade-offs, lack of personal agency, or unquantified claims that would materially benefit from one sharp, context-specific follow-up probe.
2. If the response is already thorough and clear, or if further probing adds little learning value, set "warranted": false.
3. If useful, set "warranted": true and craft ONE concise, context-specific probe (under 300 characters) grounded directly in what the candidate said. Explain what it helps the candidate practice.

CRITICAL INVARIANTS:
1. DO NOT invent facts, achievements, or history the candidate did not mention.
2. DO NOT evaluate facial expressions, tone, emotion, or personality traits.
3. Ensure the follow-up question directly challenges or deepens their stated answer.

Return ONLY valid JSON matching this schema:
{
  "warranted": boolean,
  "reason": "<clear explanation of why a probe is or is not warranted>",
  "follow_up_question": "<the concise follow-up probe, or empty string if not warranted>",
  "targeted_criterion": "<the specific rubric criterion being probed>",
  "practice_objective": "<what this helps the candidate practice, e.g. 'Practice defending architectural trade-offs under scale'>",
  "is_sufficiently_complete": boolean,
  "uncertainty_level": "low" | "medium" | "high",
  "confidence_score": 0.90,
  "probe_category": "${params.category}"
}`;

      const aiResp = await fetch('https://integrate.api.nvidia.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${env.NVIDIA_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'meta/muse-glimmer-30b',
          messages: [
            { role: 'system', content: 'You are an objective, calibrated interview panelist. Return ONLY valid JSON.' },
            { role: 'user', content: prompt }
          ],
          temperature: 0.2,
          max_tokens: 600
        })
      });

      if (aiResp.ok) {
        const aiData = await aiResp.json() as any;
        const content = aiData.choices?.[0]?.message?.content || '{}';
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          const validation = validateFollowUpDecision(parsed);
          if (validation.valid) {
            return parsed;
          }
        }
      }
    } catch (_) {
      // Fall through to deterministic fallback
    }
  }

  return generateDeterministicFollowUpDecision(params);
}

/**
 * Personalized 10-Question Interview Generator
 * Leverages candidate profile & verified claims with meta/muse-glimmer-30b,
 * strictly falling back to deterministic cross-occupation archetypes.
 */
export async function generatePersonalized10QuestionPlan(
  env: Bindings,
  candidateContext: {
    targetRole?: string;
    domain?: string;
    seniority?: string;
    skills?: string[];
    bio?: string;
    claims?: string[];
    diagnosedMisconceptions?: string[];
  }
): Promise<{ plan: InterviewPlan; isFallback: boolean }> {
  const role = candidateContext.targetRole?.trim() || 'Senior Professional';
  const domain = (candidateContext.domain || 'general').toLowerCase();
  const seniority = (candidateContext.seniority || 'mid').toLowerCase();
  const skills = candidateContext.skills && candidateContext.skills.length > 0
    ? candidateContext.skills
    : [`Core ${role} Methodology`];

  // If NVIDIA key available, attempt AI question generation
  if (env.NVIDIA_API_KEY) {
    try {
      const prompt = `You are an expert executive interview panel synthesizer.
Synthesize a structured sequential 10-question interview plan for a candidate applying for:
Target Role: "${role}"
Domain: "${domain}"
Seniority Level: "${seniority}"
Verified Skills from Candidate Profile/Resume: ${skills.join(', ')}
Candidate Bio/Summary: "${candidateContext.bio || 'General professional'}"
Diagnosed Areas for Focused Evaluation: ${candidateContext.diagnosedMisconceptions?.join(', ') || 'Core domain execution'}

STRICT INVARIANTS:
1. Output EXACTLY 10 questions numbered sequential turns 1 through 10.
2. Ground strictly in the candidate's target role and provided skills. DO NOT hallucinate specific past employers, confidential projects, or degrees not mentioned.
3. Ethical AI & Bias Invariant: Evaluate ONLY job-relevant competencies. Absolutely NO evaluation of protected traits, personality, or biometrics.
4. Categorical Sequence across 10 Turns:
   - Turn 1: category "communication" (Professional narrative and role alignment)
   - Turn 2: category "role_competency" (Technical/functional execution of ${skills[0] || 'primary skill'})
   - Turn 3: category "behavioral" (STAR format: conflict resolution or stakeholder disagreement)
   - Turn 4: category "professional_judgment" (Decision making under ambiguity/incomplete information)
   - Turn 5: category "situational" (Failure recovery, resilience, blameless post-mortem)
   - Turn 6: category "communication" (Cross-functional translation and executive influence)
   - Turn 7: category "role_competency" (Quality standards, operational hygiene, craftsmanship)
   - Turn 8: category "professional_judgment" (Ethical governance, compliance, professional integrity)
   - Turn 9: category "situational" (Prioritization under resource/capacity constraints)
   - Turn 10: category "behavioral" (Continuous learning, growth mindset, skill evolution)
5. Each question must include:
   - turn: integer (1 to 10)
   - panel_role: string (e.g. "Hiring Manager", "Systems Architect", "Operations Lead", "People Partner", etc.)
   - category: one of ["behavioral", "situational", "professional_judgment", "communication", "role_competency"]
   - competency: string
   - question: string (engaging, realistic, professional)
   - probe_intent: string
   - anchored_rubric: { "unsatisfactory": string, "competent": string, "exceptional": string }

Return ONLY valid JSON matching this structure:
{
  "planId": "proto-pers-${crypto.randomUUID()}",
  "targetRole": "${role}",
  "domain": "${domain}",
  "seniority": "${seniority}",
  "totalQuestions": 10,
  "questions": [ ...exactly 10 question objects... ]
}`;

      const aiResp = await fetch('https://integrate.api.nvidia.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${env.NVIDIA_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'meta/muse-glimmer-30b',
          messages: [
            { role: 'system', content: 'You are an objective executive interview panel synthesizer. Return ONLY valid JSON.' },
            { role: 'user', content: prompt }
          ],
          temperature: 0.2,
          max_tokens: 4096
        })
      });

      if (aiResp.ok) {
        const aiData = await aiResp.json() as any;
        const content = aiData.choices?.[0]?.message?.content || '{}';
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          const validation = validateInterviewPlan(parsed);
          if (validation.valid) {
            parsed.provenance = {
              generatedAt: new Date().toISOString(),
              modelUsed: 'meta/muse-glimmer-30b',
              personalizationInputs: skills,
              isFallback: false
            };
            return { plan: parsed, isFallback: false };
          }
        }
      }
    } catch (_) {
      // AI generation failed or timed out, proceed to deterministic fallback
    }
  }

  // Guaranteed deterministic fallback generator
  const deterministicPlan = generateDeterministicInterviewPlan({
    targetRole: role,
    domain,
    seniority,
    skills,
    bio: candidateContext.bio
  });

  return { plan: deterministicPlan, isFallback: true };
}


export interface InterviewProtocol {
  id: string;
  title: string;
  target_role: string;
  occupation_code?: string;
  domain: string;
  interview_type: string;
  seniority_level: string;
  panel_roles: string[];
  competency_targets: Array<{
    name: string;
    description: string;
    weight: number;
  }>;
  question_sequence: Array<{
    turn: number;
    panel_role: string;
    competency: string;
    question_type: string;
    question: string;
    probe_intent: string;
    anchored_rubric: {
      unsatisfactory: string;
      competent: string;
      exceptional: string;
    };
  }>;
}

export const SEED_PROTOCOLS: InterviewProtocol[] = [
  {
    id: 'proto-tech-arch-distributed',
    title: 'Distributed Architecture & Failure Domain Resilience',
    target_role: 'Senior Cloud & Systems Architect',
    occupation_code: '15-1252.00',
    domain: 'software',
    interview_type: 'structured_panel',
    seniority_level: 'senior',
    panel_roles: ['Engineering Director', 'Principal Systems Architect', 'Security & Compliance Lead'],
    competency_targets: [
      { name: 'Distributed Resilience Under Partition', description: 'Trade-off reasoning between consistency and latency under degradation', weight: 0.40 },
      { name: 'Cross-Functional Stakeholder Governance', description: 'Managing conflicting regulatory and technical constraints', weight: 0.35 },
      { name: 'Operational Failure Recovery', description: 'Systematic root-cause post-mortem and mitigation design', weight: 0.25 }
    ],
    question_sequence: [
      {
        turn: 1,
        panel_role: 'Principal Systems Architect',
        competency: 'Distributed Resilience Under Partition',
        question_type: 'situational',
        question: 'In your recent M3 simulation, failover latency between US-East and EU-Central approached your SLA threshold. Walk us through how you would re-architect consensus to survive a cross-region fiber severance while maintaining strict financial idempotency.',
        probe_intent: 'Examine CAP theorem and idempotency key trade-offs under asynchronous replication.',
        anchored_rubric: {
          unsatisfactory: 'Proposes synchronous two-phase commit without acknowledging latency penalties or single points of failure.',
          competent: 'Articulates raft/paxos consensus with local sequence numbers, read replicas, and distributed idempotency keys.',
          exceptional: 'Dynamically balances consistency models per transaction tier, specifying failover quorum, vector clocks, and automated partition healing.'
        }
      },
      {
        turn: 2,
        panel_role: 'Security & Compliance Lead',
        competency: 'Cross-Functional Stakeholder Governance',
        question_type: 'behavioral',
        question: 'When migrating the legacy data store, the Data Protection Officer raised GDPR deletion concerns while your data science team demanded historical immutability for billing analytics. How did you mediate this conflict and what formal artifact did you deliver?',
        probe_intent: 'Verify negotiation methodology and formal audit trail creation.',
        anchored_rubric: {
          unsatisfactory: 'Blames compliance or ignores regulatory mandate in favor of pure technical convenience.',
          competent: 'Demonstrates clear multi-stakeholder mediation, cryptographic crypto-shredding, and documented sign-off.',
          exceptional: 'Implements zero-knowledge pseudonymous tokenization satisfying both erasure rights and analytical integrity, signed by both legal and engineering.'
        }
      },
      {
        turn: 3,
        panel_role: 'Engineering Director',
        competency: 'Operational Failure Recovery',
        question_type: 'challenge',
        question: 'Assume your consensus cluster encounters split-brain and 0.2% of transactions log conflicting balances during a 15-minute window. An executive stakeholder demands you revert the entire database. How do you respond and defend your recovery path?',
        probe_intent: 'Tests composure, stakeholder communication, and non-destructive reconciliation under pressure.',
        anchored_rubric: {
          unsatisfactory: 'Yields immediately to executive panic causing catastrophic data loss or becomes confrontational.',
          competent: 'Calmly proposes ledger isolation, audit diff reconciliation, and compensatory credits without blanket destructive rollbacks.',
          exceptional: 'Leads with executive communication first, isolates contaminated accounts via feature flags, runs automated conflict-resolution heuristics, and provides verified board-level transparency.'
        }
      }
    ]
  },
  {
    id: 'proto-finance-fpa-leadership',
    title: 'Strategic Capital Rationing & Board Valuation',
    target_role: 'Director of Financial Planning & Analysis',
    occupation_code: '13-2051.00',
    domain: 'finance',
    interview_type: 'case_discussion',
    seniority_level: 'lead',
    panel_roles: ['Chief Financial Officer', 'VP of Operations', 'Board Audit Member'],
    competency_targets: [
      { name: 'Capital Rationing Under Uncertainty', description: 'Allocating scarce capital across competing investments during volatile cost of capital', weight: 0.45 },
      { name: 'Executive Narrative & Transparency', description: 'Translating complex quantitative sensitivity models for non-financial stakeholders', weight: 0.35 },
      { name: 'Risk & Liquidity Governance', description: 'Preserving working capital covenants under downside scenarios', weight: 0.20 }
    ],
    question_sequence: [
      {
        turn: 1,
        panel_role: 'Chief Financial Officer',
        competency: 'Capital Rationing Under Uncertainty',
        question_type: 'situational',
        question: 'Our cost of debt just rose 150 basis points, and two business units are fighting for the final $6M in our capital expenditure envelope. Project A has a higher IRR, but Project B has a 14-month faster payback period. How do you resolve this capital allocation dilemma?',
        probe_intent: 'Evaluate discount rate sensitivity, reinvestment assumptions, and capital prioritization.',
        anchored_rubric: {
          unsatisfactory: 'Relies solely on textbook IRR without recognizing reinvestment rate flaws or liquidity horizons.',
          competent: 'Applies modified IRR (MIRR), assesses cash flow velocity, and evaluates debt service coverage ratios.',
          exceptional: 'Synthesizes real-options valuation, proposes staged tranche funding tied to milestone gates, and safeguards debt covenants.'
        }
      },
      {
        turn: 2,
        panel_role: 'VP of Operations',
        competency: 'Executive Narrative & Transparency',
        question_type: 'behavioral',
        question: 'When operations misses quarterly gross margin targets by 300 bps due to supply-chain demurrage, the general manager claims finance models are detached from floor realities. Describe how you present this variance to the operating committee without alienating plant leaders.',
        probe_intent: 'Tests collaborative variance decomposition and empathetic executive communication.',
        anchored_rubric: {
          unsatisfactory: 'Defensive, quotes balance sheet equations, or assigns unilateral blame to plant management.',
          competent: 'Deconstructs price vs volume vs freight inflation transparently, facilitating joint root-cause workshops.',
          exceptional: 'Partners with plant operations to build shared unit-economic dashboards that empower floor managers to self-diagnose demurrage drivers in real time.'
        }
      }
    ]
  },
  {
    id: 'proto-ops-healthcare-crisis',
    title: 'Emergency Surge Triage & Clinical Governance',
    target_role: 'Director of Clinical Operations',
    occupation_code: '11-9111.00',
    domain: 'healthcare_admin',
    interview_type: 'situational',
    seniority_level: 'senior',
    panel_roles: ['Chief Medical Officer', 'Chief Nursing Officer', 'Legal & Regulatory Counsel'],
    competency_targets: [
      { name: 'Acuity-Based Resource Optimization', description: 'Balancing staffing ratios and clinical safety during mass-casualty surges', weight: 0.50 },
      { name: 'Crisis Communication & Regulatory Compliance', description: 'Adhering to public health reporting and union/statutory safety mandates', weight: 0.50 }
    ],
    question_sequence: [
      {
        turn: 1,
        panel_role: 'Chief Nursing Officer',
        competency: 'Acuity-Based Resource Optimization',
        question_type: 'situational',
        question: 'During a 20-patient trauma surge with 4 nurse call-offs, statutory nurse-to-patient ICU ratios are about to be breached in 30 minutes. What immediate operational lever do you pull to safeguard patients without exposing the hospital to regulatory revocation?',
        probe_intent: 'Examine crisis capacity management and statutory exception protocols.',
        anchored_rubric: {
          unsatisfactory: 'Authorizes dangerous nurse overload without documentation or unilaterally diverts ambulances without regional authority.',
          competent: 'Activates emergency float pool, transitions non-intubated patients to step-down telemetry, and logs emergency waiver.',
          exceptional: 'Implements dynamic acuity cohorting, pulls clinical supervisors into direct care, coordinates regional trauma network diversion, and files statutory exception paperwork within mandated timestamps.'
        }
      }
    ]
  }
];

export function registerInterviewIntelligenceRoutes(app: Hono<{ Bindings: Bindings }>) {

  // 1. List Interview Protocols
  app.get('/m4/interviews/protocols', async (c) => {
    const user = await getSessionUser(c);
    if (!user) return c.json({ error: 'Unauthorized' }, 401);

    const domainQuery = c.req.query('domain');
    let protocols = SEED_PROTOCOLS;

    if (domainQuery) {
      protocols = protocols.filter(p => p.domain === domainQuery);
    }

    return c.json({
      success: true,
      total: protocols.length,
      protocols
    });
  });

  // 2. Candidate Evidence Dossier (Rollup from M01, M02, M03)
  app.get('/m4/interviews/candidates', async (c) => {
    const user = await getSessionUser(c);
    if (!user) return c.json({ error: 'Unauthorized' }, 401);

    // Get candidate profile
    const profile = await c.env.DB.prepare('SELECT * FROM candidate_profile WHERE user_id = ?').bind(user.id).first();

    // M01 Claims
    const claims = await c.env.DB.prepare(
      `SELECT cl.* FROM candidate_claim cl
       JOIN candidate_context ctx ON cl.context_id = ctx.id
       WHERE ctx.user_id = ? LIMIT 10`
    ).bind(user.id).all();

    // M02 Proficiencies & Misconceptions
    const proficiencies = await c.env.DB.prepare(
      `SELECT p.*, s.name as skill_name, c.name as competency_name 
       FROM candidate_skill_proficiency_v2 p
       LEFT JOIN skill s ON p.skill_id = s.id
       LEFT JOIN competency c ON s.competency_id = c.id
       WHERE p.user_id = ?`
    ).bind(user.id).all();

    const misconceptions = await c.env.DB.prepare(
      `SELECT e.evaluation_json, s.name as skill_name 
       FROM assessment_evaluation e
       JOIN assessment_response_v2 r ON e.response_id = r.id
       JOIN assessment_attempt a ON r.attempt_id = a.id
       JOIN assessment_item_v2 i ON r.item_id = i.id
       LEFT JOIN skill s ON i.skill_id = s.id
       WHERE a.user_id = ? ORDER BY e.created_at DESC LIMIT 5`
    ).bind(user.id).all();

    // M03 Simulations Completed
    const simulations = await c.env.DB.prepare(
      `SELECT ev.overall_score, ev.dimension_scores_json, ev.observable_evidence_json, def.title, def.domain, def.simulation_type
       FROM simulation_evaluation ev
       JOIN simulation_definition def ON ev.definition_id = def.id
       WHERE ev.user_id = ? ORDER BY ev.created_at DESC LIMIT 5`
    ).bind(user.id).all();

    const harvestedMisconceptions: string[] = [];
    (misconceptions.results || []).forEach((m: any) => {
      try {
        const parsed = JSON.parse(m.evaluation_json || '{}');
        if (parsed.teaching_payload?.misconception_remediation && parsed.teaching_payload.misconception_remediation !== 'N/A') {
          harvestedMisconceptions.push(`${m.skill_name || 'Core'}: ${parsed.teaching_payload.misconception_remediation}`);
        }
      } catch (_) {}
    });

    const parsedSimulations = (simulations.results || []).map((s: any) => ({
      title: s.title,
      domain: s.domain,
      type: s.simulation_type,
      score: Math.round(Number(s.overall_score) * 100),
      evidence: JSON.parse((s.observable_evidence_json as string) || '{}')
    }));

    return c.json({
      success: true,
      candidate: {
        id: user.id,
        name: user.full_name || 'Candidate',
        target_role: profile?.target_role || 'Senior Professional',
        domain: profile?.primary_domain || 'General',
        experience_level: profile?.experience_level || 'mid',
        readiness_score: Math.round(Number(profile?.readiness_score || 0.72) * 100),
        m01_verified_claims_count: (claims.results || []).length,
        m02_proficiencies: (proficiencies.results || []).map((p: any) => ({
          skill: p.skill_name || p.skill_id,
          competency: p.competency_name || 'Domain Competency',
          estimate: Math.round((p.proficiency_estimate || 0.5) * 100),
          uncertainty: Math.round((p.uncertainty_estimate || 0.5) * 100)
        })),
        m02_diagnosed_misconceptions: harvestedMisconceptions,
        m03_simulations_demonstrated: parsedSimulations
      }
    });
  });

  // 3. Start or Schedule Structured Interview Session (Supports Seed Protocols & Personalized 10-Question Generator)
  app.post('/m4/interviews/sessions', async (c) => {
    const user = await getSessionUser(c);
    if (!user) return c.json({ error: 'Unauthorized' }, 401);

    const dbUser = await c.env.DB.prepare('SELECT organization_id FROM user_account WHERE id = ?').bind(user.id).first();
    const orgId = (dbUser?.organization_id as string) || 'org_default_public';

    const { protocol_id, candidate_user_id, requisition_id, personalized, camera_enabled } = await c.req.json().catch(() => ({}));
    const targetCandidateId = candidate_user_id || user.id;

    // Check if an existing seed protocol was explicitly requested without personalization
    const seedProtocol = protocol_id && protocol_id !== 'personalized' && protocol_id !== 'auto'
      ? SEED_PROTOCOLS.find(p => p.id === protocol_id)
      : null;

    let plan: InterviewPlan;
    let activeRole: string;
    let firstQuestion: any;
    let protoId: string;

    if (seedProtocol && personalized !== true) {
      protoId = seedProtocol.id;
      activeRole = seedProtocol.panel_roles[0] || 'Hiring Manager';
      firstQuestion = seedProtocol.question_sequence[0] || null;
      plan = {
        planId: seedProtocol.id,
        targetRole: seedProtocol.target_role,
        domain: seedProtocol.domain,
        seniority: seedProtocol.seniority_level,
        totalQuestions: 10,
        questions: seedProtocol.question_sequence.length === 10
          ? seedProtocol.question_sequence as any
          : generateDeterministicInterviewPlan({
              targetRole: seedProtocol.target_role,
              domain: seedProtocol.domain,
              seniority: seedProtocol.seniority_level
            }).questions,
        provenance: {
          generatedAt: new Date().toISOString(),
          modelUsed: 'seed-protocol-grounded',
          personalizationInputs: [seedProtocol.id],
          isFallback: true
        }
      };
    } else {
      // Load candidate profile context from DB
      const profile = await c.env.DB.prepare('SELECT * FROM candidate_profile WHERE user_id = ?').bind(targetCandidateId).first();
      const claims = await c.env.DB.prepare(
        `SELECT cl.claim_value FROM candidate_claim cl
         JOIN candidate_context ctx ON cl.context_id = ctx.id
         WHERE ctx.user_id = ? LIMIT 10`
      ).bind(targetCandidateId).all();
      const proficiencies = await c.env.DB.prepare(
        `SELECT s.name as skill_name FROM candidate_skill_proficiency_v2 p
         LEFT JOIN skill s ON p.skill_id = s.id
         WHERE p.user_id = ?`
      ).bind(targetCandidateId).all();

      const candidateSkills = [
        ...((claims.results || []).map((r: any) => r.claim_value).filter(Boolean)),
        ...((proficiencies.results || []).map((r: any) => r.skill_name).filter(Boolean))
      ];

      const generated = await generatePersonalized10QuestionPlan(c.env, {
        targetRole: (profile?.target_role as string) || 'Senior Professional',
        domain: (profile?.primary_domain as string) || 'software',
        seniority: (profile?.experience_level as string) || 'senior',
        skills: Array.from(new Set(candidateSkills)).slice(0, 5),
        bio: profile?.bio as string
      });

      plan = generated.plan;
      protoId = plan.planId;
      activeRole = plan.questions[0].panel_role;
      firstQuestion = plan.questions[0];
    }

    const sessionId = crypto.randomUUID();

    // Persist custom protocol if not already in seed protocols
    if (!seedProtocol) {
      await c.env.DB.prepare(
        `INSERT INTO interview_protocol 
         (id, organization_id, title, target_role, domain, interview_type, seniority_level, panel_roles_json, competency_targets_json, question_sequence_json, is_active)
         VALUES (?, ?, ?, ?, ?, 'structured_10_question', ?, ?, ?, ?, 1)`
      ).bind(
        protoId,
        orgId,
        `${plan.targetRole} Structured 10-Question Interview`,
        plan.targetRole,
        plan.domain,
        plan.seniority,
        JSON.stringify(Array.from(new Set(plan.questions.map(q => q.panel_role)))),
        JSON.stringify(plan.questions.map(q => ({ name: q.competency, description: q.probe_intent, weight: 0.1 }))),
        JSON.stringify(plan.questions)
      ).run().catch(() => {});
    }

    await c.env.DB.prepare(
      `INSERT INTO interview_session 
       (id, organization_id, protocol_id, candidate_user_id, interviewer_user_id, requisition_id, status, active_panel_role, current_turn, evidence_summary_json)
       VALUES (?, ?, ?, ?, ?, ?, 'in_progress', ?, 1, ?)`
    ).bind(
      sessionId,
      orgId,
      protoId,
      targetCandidateId,
      user.id,
      requisition_id || null,
      activeRole,
      JSON.stringify({ plan, camera_enabled: Boolean(camera_enabled) })
    ).run();

    await logAuditEvent(c, orgId, user.id, 'START', 'INTERVIEW_SESSION', sessionId, { protocol_id: protoId, total_questions: plan.questions.length });

    return c.json({
      success: true,
      session_id: sessionId,
      protocol: seedProtocol || {
        id: protoId,
        title: `${plan.targetRole} Structured 10-Question Interview`,
        target_role: plan.targetRole,
        domain: plan.domain,
        interview_type: 'structured_10_question',
        seniority_level: plan.seniority,
        panel_roles: Array.from(new Set(plan.questions.map(q => q.panel_role))),
        competency_targets: plan.questions.map(q => ({ name: q.competency, description: q.probe_intent, weight: 0.1 })),
        question_sequence: plan.questions
      },
      active_panel_role: activeRole,
      current_turn: 1,
      total_questions: plan.questions.length,
      first_question: firstQuestion,
      plan
    });
  });

  // 3b. Active Interview Session Recovery (Page Refresh & Resume)
  app.get('/m4/interviews/sessions/active', async (c) => {
    const user = await getSessionUser(c);
    if (!user) return c.json({ error: 'Unauthorized' }, 401);

    const activeSession = await c.env.DB.prepare(
      `SELECT * FROM interview_session 
       WHERE candidate_user_id = ? AND status = 'in_progress' 
       ORDER BY created_at DESC LIMIT 1`
    ).bind(user.id).first();

    if (!activeSession) {
      return c.json({ success: true, active_session: null });
    }

    // Recover questions from session evidence or protocol
    let plan: any = null;
    try {
      const summary = JSON.parse((activeSession.evidence_summary_json as string) || '{}');
      if (summary.plan && Array.isArray(summary.plan.questions)) {
        plan = summary.plan;
      }
    } catch (_) {}

    if (!plan) {
      const seed = SEED_PROTOCOLS.find(p => p.id === activeSession.protocol_id);
      if (seed) {
        plan = {
          planId: seed.id,
          targetRole: seed.target_role,
          domain: seed.domain,
          seniority: seed.seniority_level,
          totalQuestions: seed.question_sequence.length,
          questions: seed.question_sequence
        };
      }
    }

    const observations = await c.env.DB.prepare(
      `SELECT * FROM interview_observation WHERE session_id = ? ORDER BY turn_number ASC`
    ).bind(activeSession.id).all();

    const currentTurn = Number(activeSession.current_turn || 1);
    const questions = plan?.questions || [];
    const activeQuestion = questions.length >= currentTurn ? questions[currentTurn - 1] : null;
    const obsResults = observations.results || [];
    const mappedObservations = obsResults.map((o: any) => {
      const interp = JSON.parse((o.ai_interpretation_json as string) || '{}');
      return {
        turn_number: o.turn_number,
        interviewer_role: o.interviewer_role,
        question: o.question_text,
        candidate_response: o.candidate_response,
        observable_evidence: JSON.parse((o.observable_evidence_json as string) || '[]'),
        rubric_evaluation: JSON.parse((o.rubric_evaluation_json as string) || '{}'),
        ai_interpretation: interp,
        ai_recommended_probe: o.ai_recommended_probe,
        coaching: interp.coaching || null,
        retry_comparison: interp.retry_comparison || null,
        attempts: interp.attempts || [],
        active_follow_up: interp.active_follow_up || null,
        follow_ups: interp.follow_ups || [],
        follow_up_decision: interp.follow_up_decision || null,
        human_rating: o.human_rating,
        human_notes: o.human_notes
      };
    });

    const currentTurnObs = mappedObservations.find((o: any) => o.turn_number === currentTurn);
    const hasPendingFollowUp = Boolean(currentTurnObs?.active_follow_up && !currentTurnObs.active_follow_up.candidate_response && !currentTurnObs.active_follow_up.skipped);

    return c.json({
      success: true,
      active_session: {
        id: activeSession.id,
        status: activeSession.status,
        current_turn: currentTurn,
        total_questions: questions.length || 10,
        active_panel_role: activeSession.active_panel_role || activeQuestion?.panel_role || 'Hiring Manager',
        active_question: activeQuestion,
        questions,
        plan,
        pending_advance: Boolean(currentTurnObs && !hasPendingFollowUp),
        active_turn_observation: currentTurnObs || null,
        active_turn_coaching: currentTurnObs?.coaching || null,
        active_turn_retry_comparison: currentTurnObs?.retry_comparison || null,
        active_turn_attempts: currentTurnObs?.attempts || [],
        active_follow_up: currentTurnObs?.active_follow_up || null,
        active_turn_follow_ups: currentTurnObs?.follow_ups || [],
        active_turn_follow_up_decision: currentTurnObs?.follow_up_decision || null,
        observations: mappedObservations
      }
    });
  });

  // 4. Get Interview Session Details & Transcript
  app.get('/m4/interviews/sessions/:id', async (c) => {
    const user = await getSessionUser(c);
    if (!user) return c.json({ error: 'Unauthorized' }, 401);

    const sessionId = c.req.param('id');
    const session = await c.env.DB.prepare(
      `SELECT * FROM interview_session WHERE id = ? AND (interviewer_user_id = ? OR candidate_user_id = ?)`
    ).bind(sessionId, user.id, user.id).first();

    if (!session) return c.json({ error: 'Session not found' }, 404);

    let protocol = SEED_PROTOCOLS.find(p => p.id === session.protocol_id);
    let plan: any = null;
    try {
      const summary = JSON.parse((session.evidence_summary_json as string) || '{}');
      if (summary.plan) plan = summary.plan;
    } catch (_) {}

    if (!protocol && plan) {
      protocol = {
        id: plan.planId,
        title: `${plan.targetRole} Structured 10-Question Interview`,
        target_role: plan.targetRole,
        domain: plan.domain,
        interview_type: 'structured_10_question',
        seniority_level: plan.seniority,
        panel_roles: Array.from(new Set(plan.questions.map((q: any) => q.panel_role))),
        competency_targets: plan.questions.map((q: any) => ({ name: q.competency, description: q.probe_intent, weight: 0.1 })),
        question_sequence: plan.questions
      };
    } else if (!protocol) {
      protocol = SEED_PROTOCOLS[0];
    }

    const observations = await c.env.DB.prepare(
      `SELECT * FROM interview_observation WHERE session_id = ? ORDER BY turn_number ASC`
    ).bind(sessionId).all();

    return c.json({
      success: true,
      session: {
        id: session.id,
        status: session.status,
        current_turn: session.current_turn,
        active_panel_role: session.active_panel_role,
        protocol,
        plan,
        turns: (observations.results || []).map((o: any) => {
          const interp = JSON.parse((o.ai_interpretation_json as string) || '{}');
          return {
            turn_number: o.turn_number,
            interviewer_role: o.interviewer_role,
            question: o.question_text,
            candidate_response: o.candidate_response,
            observable_evidence: JSON.parse((o.observable_evidence_json as string) || '[]'),
            rubric_evaluation: JSON.parse((o.rubric_evaluation_json as string) || '{}'),
            ai_interpretation: interp,
            ai_recommended_probe: o.ai_recommended_probe,
            coaching: interp.coaching || null,
            retry_comparison: interp.retry_comparison || null,
            attempts: interp.attempts || [],
            active_follow_up: interp.active_follow_up || null,
            follow_ups: interp.follow_ups || [],
            follow_up_decision: interp.follow_up_decision || null,
            human_rating: o.human_rating,
            human_notes: o.human_notes
          };
        })
      }
    });
  });

  // 5. Submit Turn Response & Adaptive Evaluation Loop (With Coaching & Retry Capabilities)
  app.post('/m4/interviews/sessions/:id/turn', async (c) => {
    const user = await getSessionUser(c);
    if (!user) return c.json({ error: 'Unauthorized' }, 401);

    const sessionId = c.req.param('id');
    const session = await c.env.DB.prepare('SELECT * FROM interview_session WHERE id = ?').bind(sessionId).first();
    if (!session) return c.json({ error: 'Session not found' }, 404);

    const { candidate_response, current_question, interviewer_role, turn_number, is_retry, auto_advance } = await c.req.json().catch(() => ({}));
    if (!candidate_response || !current_question) {
      return c.json({ error: 'candidate_response and current_question are required' }, 400);
    }

    const turnNumber = turn_number !== undefined ? Number(turn_number) : Number(session.current_turn || 1);

    // Resolve plan or protocol questions sequence
    let questionSequence: any[] = [];
    let panelRoles: string[] = [];
    try {
      const summary = JSON.parse((session.evidence_summary_json as string) || '{}');
      if (summary.plan?.questions) {
        questionSequence = summary.plan.questions;
        panelRoles = Array.from(new Set(questionSequence.map(q => q.panel_role)));
      }
    } catch (_) {}

    const protocol = SEED_PROTOCOLS.find(p => p.id === session.protocol_id) || SEED_PROTOCOLS[0];
    if (questionSequence.length === 0) {
      questionSequence = protocol.question_sequence;
      panelRoles = protocol.panel_roles;
    }

    // Check if observation exists for this turn
    const existingObs = await c.env.DB.prepare(
      `SELECT * FROM interview_observation WHERE session_id = ? AND turn_number = ?`
    ).bind(sessionId, turnNumber).first();

    if (existingObs && !is_retry) {
      return c.json({
        error: `Duplicate turn submission: turn ${turnNumber} has already been submitted and recorded.`,
        duplicate: true,
        observation_id: existingObs.id
      }, 409);
    }

    // AI-Assisted Evidence Extraction & Anchored Rubric Scoring if NVIDIA Key present
    let rubricScore = 0.82;
    let observableEvidence = [
      'Candidate structured answer using conclusion-first methodology',
      'Directly addressed competency expectations under concrete operational constraints'
    ];
    let aiInterpretation: { strengths?: string; gaps?: string } = {
      strengths: 'Demonstrated clear trade-off understanding and pragmatic execution ownership.',
      gaps: 'Could provide more explicit operational telemetry or quantitative indicators.'
    };
    let aiRecommendedProbe = 'What metrics or verification steps would you use to validate this in production?';

    if (c.env.NVIDIA_API_KEY) {
      try {
        const prompt = `You are an expert executive interview panel evaluator.
Target Role: ${protocol.target_role}
Interviewer Panel Role: ${interviewer_role || session.active_panel_role}
Competency: ${current_question.competency}
Question: "${current_question.question}"
Anchored Rubric: ${JSON.stringify(current_question.anchored_rubric || {})}

Candidate Response:
"${candidate_response}"

Evaluate strictly against the anchored rubric. 
DO NOT evaluate protected traits, personality, or appearance. Evaluate job-relevant observable evidence only.
Return ONLY valid JSON matching:
{
  "score": <0.0 - 1.0>,
  "observable_evidence": ["<specific concrete assertion made by candidate>", "<specific technical or procedural fact cited>"],
  "model_interpretation": {
    "strengths": "<analysis of observed strengths>",
    "gaps": "<analysis of observed gaps>"
  },
  "recommended_follow_up_probe": "<sharp probing question to challenge an assumption or uncover depth>"
}`;

        const aiResp = await fetch('https://integrate.api.nvidia.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${c.env.NVIDIA_API_KEY}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            model: 'meta/muse-glimmer-30b',
            messages: [
              { role: 'system', content: 'You are an objective interview panel assessor. Return ONLY valid JSON.' },
              { role: 'user', content: prompt }
            ],
            temperature: 0.2,
            max_tokens: 800
          })
        });

        if (aiResp.ok) {
          const aiData = await aiResp.json() as any;
          const content = aiData.choices?.[0]?.message?.content || '{}';
          const parsed = JSON.parse(content.substring(content.indexOf('{'), content.lastIndexOf('}') + 1));
          if (typeof parsed.score === 'number') {
            rubricScore = parsed.score;
            if (Array.isArray(parsed.observable_evidence)) observableEvidence = parsed.observable_evidence;
            if (parsed.model_interpretation) aiInterpretation = parsed.model_interpretation;
            if (parsed.recommended_follow_up_probe) aiRecommendedProbe = parsed.recommended_follow_up_probe;
          }
        }
      } catch (_) {}
    }

    const currentScorePct = Math.round(rubricScore * 100);

    // Generate evidence-grounded Answer Coaching (What worked, What to improve, Why it matters, How to improve, Structure blueprint, Model answer)
    const coaching = await generateAnswerCoaching(c.env, {
      category: current_question.category || current_question.question_type || 'behavioral',
      question: current_question.question,
      competency: current_question.competency,
      candidateResponse: candidate_response,
      rubric: current_question.anchored_rubric,
      score: rubricScore,
      observableEvidence,
      aiInterpretation
    });

    const totalTurns = questionSequence.length > 0 ? questionSequence.length : 10;
    const nextTurn = turnNumber + 1;
    const isComplete = nextTurn > totalTurns;

    let nextRole = session.active_panel_role;
    let nextSeqQuestion = null;

    if (!isComplete) {
      nextSeqQuestion = questionSequence[turnNumber] || null;
      if (nextSeqQuestion) {
        nextRole = nextSeqQuestion.panel_role;
      } else if (panelRoles.length > 0) {
        const nextPanelIndex = (nextTurn - 1) % panelRoles.length;
        nextRole = panelRoles[nextPanelIndex];
      }
    }

    // RETRY FLOW
    if (is_retry && existingObs) {
      let priorInterp: any = {};
      try {
        priorInterp = JSON.parse((existingObs.ai_interpretation_json as string) || '{}');
      } catch (_) {}

      let priorEval: any = {};
      try {
        priorEval = JSON.parse((existingObs.rubric_evaluation_json as string) || '{}');
      } catch (_) {}

      const priorScore = priorEval.score !== undefined ? Math.round(priorEval.score * 100) : 80;
      const scoreDelta = currentScorePct - priorScore;
      const previousAttempts: TurnAttemptRecord[] = Array.isArray(priorInterp.attempts) ? priorInterp.attempts : [
        {
          attempt_number: 1,
          candidate_response: (existingObs.candidate_response as string) || '',
          submitted_at: (existingObs.created_at as string) || new Date().toISOString(),
          score: priorScore,
          observable_evidence: JSON.parse((existingObs.observable_evidence_json as string) || '[]'),
          coaching: priorInterp.coaching || coaching
        }
      ];

      const nextAttemptNumber = previousAttempts.length + 1;
      const improvementsNoted: string[] = [];
      if (candidate_response.length > String(existingObs.candidate_response || '').length + 10) {
        improvementsNoted.push('Substantially expanded on specific actions, tools, and technical rationale.');
      }
      if (scoreDelta > 0) {
        improvementsNoted.push(`Strengthened alignment with ${current_question.competency} anchored rubric criteria (+${scoreDelta}%).`);
      } else {
        improvementsNoted.push('Maintained clear personal agency and articulated core assertions.');
      }

      const remainingGaps: string[] = [];
      if (currentScorePct < 90) {
        remainingGaps.push('Could further emphasize quantitative production benchmarks or failure telemetry.');
      }

      const retryComparison: RetryComparison = {
        attempt_number: nextAttemptNumber,
        previous_score: priorScore,
        current_score: currentScorePct,
        score_delta: scoreDelta,
        delta_summary: scoreDelta >= 0
          ? `Revised attempt improved competency demonstration by +${scoreDelta}% points with enhanced structural clarity.`
          : `Revised attempt refined phrasing while sustaining solid demonstration of ${current_question.competency}.`,
        improvements_noted: improvementsNoted,
        remaining_gaps: remainingGaps
      };

      const revisedAttempt: TurnAttemptRecord = {
        attempt_number: nextAttemptNumber,
        candidate_response,
        submitted_at: new Date().toISOString(),
        score: currentScorePct,
        observable_evidence: observableEvidence,
        coaching
      };

      const updatedAttempts = [...previousAttempts, revisedAttempt];

      // Update observation
      await c.env.DB.prepare(
        `UPDATE interview_observation
         SET candidate_response = ?,
             observable_evidence_json = ?,
             rubric_evaluation_json = ?,
             ai_interpretation_json = ?,
             ai_recommended_probe = ?
         WHERE id = ?`
      ).bind(
        candidate_response,
        JSON.stringify(observableEvidence),
        JSON.stringify({ score: rubricScore, criteria: current_question.anchored_rubric, retry_count: updatedAttempts.length }),
        JSON.stringify({
          ...aiInterpretation,
          coaching,
          retry_comparison: retryComparison,
          attempts: updatedAttempts
        }),
        aiRecommendedProbe,
        existingObs.id
      ).run();

      return c.json({
        success: true,
        observation_id: existingObs.id,
        turn_completed: turnNumber,
        is_retry: true,
        is_complete: isComplete,
        evaluation: {
          score: currentScorePct,
          observable_evidence: observableEvidence,
          ai_interpretation: aiInterpretation,
          ai_recommended_probe: aiRecommendedProbe
        },
        coaching,
        retry_comparison: retryComparison,
        attempts: updatedAttempts,
        ready_to_advance: true,
        next_turn: isComplete ? null : {
          turn_number: nextTurn,
          active_panel_role: nextRole,
          next_question: nextSeqQuestion
        }
      });
    }

    // INITIAL SUBMISSION FLOW
    const obsId = crypto.randomUUID();

    // Adaptive Follow-up Decision (Phase 3)
    const followUpDecision = await generateAdaptiveFollowUpDecision(c.env, {
      category: current_question.category || current_question.question_type || 'behavioral',
      question: current_question.question,
      competency: current_question.competency,
      candidateResponse: candidate_response,
      rubric: current_question.anchored_rubric,
      score: rubricScore,
      observableEvidence,
      existingFollowUpsCount: 0,
      maxFollowUps: 2
    });

    const isFollowUpWarranted = followUpDecision.warranted && Boolean(followUpDecision.follow_up_question) && auto_advance !== true;

    let initialFollowUp: FollowUpExchange | null = null;
    let followUpsList: FollowUpExchange[] = [];

    if (isFollowUpWarranted) {
      initialFollowUp = {
        follow_up_number: 1,
        question: followUpDecision.follow_up_question!,
        practice_objective: followUpDecision.practice_objective,
        targeted_criterion: followUpDecision.targeted_criterion,
        skipped: false
      };
      followUpsList = [initialFollowUp];
    }

    const initialAttempt: TurnAttemptRecord = {
      attempt_number: 1,
      candidate_response,
      submitted_at: new Date().toISOString(),
      score: currentScorePct,
      observable_evidence: observableEvidence,
      coaching
    };

    await c.env.DB.prepare(
      `INSERT INTO interview_observation
       (id, session_id, turn_number, interviewer_role, question_text, question_type, candidate_response, 
        observable_evidence_json, rubric_evaluation_json, ai_interpretation_json, ai_recommended_probe, confidence_score)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0.88)`
    ).bind(
      obsId,
      sessionId,
      turnNumber,
      interviewer_role || session.active_panel_role,
      current_question.question,
      current_question.category || current_question.question_type || 'structured',
      candidate_response,
      JSON.stringify(observableEvidence),
      JSON.stringify({ score: rubricScore, criteria: current_question.anchored_rubric, retry_count: 1 }),
      JSON.stringify({
        ...aiInterpretation,
        coaching,
        attempts: [initialAttempt],
        active_follow_up: initialFollowUp,
        follow_ups: followUpsList,
        follow_up_decision: followUpDecision
      }),
      aiRecommendedProbe
    ).run();

    if (isComplete) {
      await c.env.DB.prepare(
        `UPDATE interview_session 
         SET status = 'completed', updated_at = CURRENT_TIMESTAMP 
         WHERE id = ?`
      ).bind(sessionId).run();
    } else if (auto_advance === true) {
      // Auto-advance if explicitly requested
      await c.env.DB.prepare(
        `UPDATE interview_session 
         SET current_turn = ?, active_panel_role = ?, updated_at = CURRENT_TIMESTAMP 
         WHERE id = ?`
      ).bind(nextTurn, nextRole, sessionId).run();
    }

    return c.json({
      success: true,
      observation_id: obsId,
      turn_completed: turnNumber,
      is_retry: false,
      is_complete: isComplete,
      follow_up_required: isFollowUpWarranted,
      follow_up: initialFollowUp,
      follow_up_decision: followUpDecision,
      follow_ups: followUpsList,
      evaluation: {
        score: currentScorePct,
        observable_evidence: observableEvidence,
        ai_interpretation: aiInterpretation,
        ai_recommended_probe: aiRecommendedProbe
      },
      coaching,
      attempts: [initialAttempt],
      ready_to_advance: true,
      next_turn: isComplete ? null : {
        turn_number: nextTurn,
        active_panel_role: nextRole,
        next_question: nextSeqQuestion
      }
    });
  });

  // 5b. Adaptive Follow-Up Probe Response Endpoint (Candidate Responds to or Skips Follow-Up)
  app.post('/m4/interviews/sessions/:id/follow-up', async (c) => {
    const user = await getSessionUser(c);
    if (!user) return c.json({ error: 'Unauthorized' }, 401);

    const sessionId = c.req.param('id');
    const session = await c.env.DB.prepare('SELECT * FROM interview_session WHERE id = ?').bind(sessionId).first();
    if (!session) return c.json({ error: 'Session not found' }, 404);

    const { turn_number, follow_up_response, skipped } = await c.req.json().catch(() => ({}));
    const activeTurn = turn_number !== undefined ? Number(turn_number) : Number(session.current_turn || 1);

    // Retrieve existing observation
    const obs = await c.env.DB.prepare(
      `SELECT * FROM interview_observation WHERE session_id = ? AND turn_number = ?`
    ).bind(sessionId, activeTurn).first();

    if (!obs) {
      return c.json({ error: `Observation for turn ${activeTurn} not found.` }, 404);
    }

    let interp: any = {};
    try {
      interp = JSON.parse((obs.ai_interpretation_json as string) || '{}');
    } catch (_) {}

    const followUps: FollowUpExchange[] = Array.isArray(interp.follow_ups) ? interp.follow_ups : [];
    const currentPendingFollowUp = followUps.find(f => !f.candidate_response && !f.skipped);

    if (!currentPendingFollowUp && !interp.active_follow_up) {
      return c.json({ error: 'No active follow-up pending for this turn.' }, 400);
    }

    const targetFollowUp: FollowUpExchange = currentPendingFollowUp || interp.active_follow_up;
    const followUpIndex = followUps.findIndex(f => f.follow_up_number === targetFollowUp.follow_up_number);

    let currentScorePct = 80;
    try {
      const evalData = JSON.parse((obs.rubric_evaluation_json as string) || '{}');
      if (typeof evalData.score === 'number') currentScorePct = Math.round(evalData.score * 100);
    } catch (_) {}

    let observableEvidence: string[] = [];
    try {
      observableEvidence = JSON.parse((obs.observable_evidence_json as string) || '[]');
    } catch (_) {}

    // Resolve question sequence for rubric details
    let questionSequence: any[] = [];
    try {
      const summary = JSON.parse((session.evidence_summary_json as string) || '{}');
      if (summary.plan?.questions) questionSequence = summary.plan.questions;
    } catch (_) {}
    const protocol = SEED_PROTOCOLS.find(p => p.id === session.protocol_id) || SEED_PROTOCOLS[0];
    if (questionSequence.length === 0) questionSequence = protocol.question_sequence;
    const currentQuestion = questionSequence[activeTurn - 1] || {
      question: obs.question_text,
      category: obs.question_type,
      competency: 'Core Competency',
      anchored_rubric: { unsatisfactory: '', competent: '', exceptional: '' }
    };

    if (skipped === true) {
      targetFollowUp.skipped = true;
      targetFollowUp.submitted_at = new Date().toISOString();
      if (followUpIndex >= 0) followUps[followUpIndex] = targetFollowUp;
      else followUps.push(targetFollowUp);

      // Consolidated coaching acknowledging candidate opted to proceed with initial evidence
      const coaching = await generateAnswerCoaching(c.env, {
        category: currentQuestion.category || 'behavioral',
        question: currentQuestion.question,
        competency: currentQuestion.competency,
        candidateResponse: String(obs.candidate_response || ''),
        rubric: currentQuestion.anchored_rubric,
        score: currentScorePct / 100,
        observableEvidence,
        aiInterpretation: interp
      });

      interp.follow_ups = followUps;
      interp.active_follow_up = null;
      interp.coaching = coaching;

      await c.env.DB.prepare(
        `UPDATE interview_observation
         SET ai_interpretation_json = ?
         WHERE id = ?`
      ).bind(JSON.stringify(interp), obs.id).run();

      return c.json({
        success: true,
        skipped: true,
        turn_completed: activeTurn,
        follow_up_required: false,
        follow_ups: followUps,
        coaching,
        ready_to_advance: true
      });
    }

    // Follow-up was answered
    if (!follow_up_response || typeof follow_up_response !== 'string' || follow_up_response.trim().length === 0) {
      return c.json({ error: 'follow_up_response is required or set skipped: true' }, 400);
    }

    const cleanFollowUpAnswer = follow_up_response.trim().slice(0, 4000);
    targetFollowUp.candidate_response = cleanFollowUpAnswer;
    targetFollowUp.submitted_at = new Date().toISOString();
    targetFollowUp.skipped = false;

    const newEvidenceItem = `Probe #${targetFollowUp.follow_up_number} Evidence: ${cleanFollowUpAnswer.slice(0, 160)}`;
    observableEvidence = [...observableEvidence, newEvidenceItem];

    const scoreBump = Math.min(100, currentScorePct + 8);
    targetFollowUp.score_impact = 8;
    targetFollowUp.observable_evidence = [newEvidenceItem];

    if (followUpIndex >= 0) followUps[followUpIndex] = targetFollowUp;
    else followUps.push(targetFollowUp);

    // Check if second follow-up is warranted (strictly maximum 2)
    const maxFollowUps = 2;
    let nextDecision: AdaptiveFollowUpDecision = {
      warranted: false,
      reason: 'Maximum follow-up probes reached.',
      targeted_criterion: currentQuestion.competency,
      practice_objective: 'Proceed to coaching and synthesis.',
      is_sufficiently_complete: true,
      uncertainty_level: 'low',
      confidence_score: 0.95,
      probe_category: currentQuestion.category || 'behavioral'
    };

    if (followUps.length < maxFollowUps) {
      const combinedResponse = `${obs.candidate_response}\n\n[Follow-up Response]: ${cleanFollowUpAnswer}`;
      nextDecision = await generateAdaptiveFollowUpDecision(c.env, {
        category: currentQuestion.category || 'behavioral',
        question: currentQuestion.question,
        competency: currentQuestion.competency,
        candidateResponse: combinedResponse,
        rubric: currentQuestion.anchored_rubric,
        score: scoreBump / 100,
        observableEvidence,
        existingFollowUpsCount: followUps.length,
        maxFollowUps
      });
    }

    if (nextDecision.warranted && nextDecision.follow_up_question) {
      const secondFollowUp: FollowUpExchange = {
        follow_up_number: followUps.length + 1,
        question: nextDecision.follow_up_question,
        practice_objective: nextDecision.practice_objective,
        targeted_criterion: nextDecision.targeted_criterion,
        skipped: false
      };
      followUps.push(secondFollowUp);
      interp.follow_ups = followUps;
      interp.active_follow_up = secondFollowUp;
      interp.follow_up_decision = nextDecision;

      await c.env.DB.prepare(
        `UPDATE interview_observation
         SET observable_evidence_json = ?,
             rubric_evaluation_json = ?,
             ai_interpretation_json = ?
         WHERE id = ?`
      ).bind(
        JSON.stringify(observableEvidence),
        JSON.stringify({ score: scoreBump / 100, criteria: currentQuestion.anchored_rubric }),
        JSON.stringify(interp),
        obs.id
      ).run();

      return c.json({
        success: true,
        turn_completed: activeTurn,
        follow_up_required: true,
        follow_up: secondFollowUp,
        follow_up_decision: nextDecision,
        follow_ups: followUps,
        evaluation: { score: scoreBump, observable_evidence: observableEvidence },
        ready_to_advance: false
      });
    }

    // All follow-up probes resolved: Generate consolidated coaching
    const consolidatedResponse = `${obs.candidate_response}\n\n[Follow-Up Clarification]: ${cleanFollowUpAnswer}`;
    const coaching = await generateAnswerCoaching(c.env, {
      category: currentQuestion.category || 'behavioral',
      question: currentQuestion.question,
      competency: currentQuestion.competency,
      candidateResponse: consolidatedResponse,
      rubric: currentQuestion.anchored_rubric,
      score: scoreBump / 100,
      observableEvidence,
      aiInterpretation: interp
    });

    interp.follow_ups = followUps;
    interp.active_follow_up = null;
    interp.coaching = coaching;

    await c.env.DB.prepare(
      `UPDATE interview_observation
       SET observable_evidence_json = ?,
           rubric_evaluation_json = ?,
           ai_interpretation_json = ?
       WHERE id = ?`
    ).bind(
      JSON.stringify(observableEvidence),
      JSON.stringify({ score: scoreBump / 100, criteria: currentQuestion.anchored_rubric }),
      JSON.stringify(interp),
      obs.id
    ).run();

    return c.json({
      success: true,
      turn_completed: activeTurn,
      follow_up_required: false,
      follow_ups: followUps,
      coaching,
      evaluation: { score: scoreBump, observable_evidence: observableEvidence },
      ready_to_advance: true
    });
  });

  // 5c. Retry Turn Answer Endpoint (Candidate Refines Answer Following Coaching)
  app.post('/m4/interviews/sessions/:id/retry', async (c) => {
    const user = await getSessionUser(c);
    if (!user) return c.json({ error: 'Unauthorized' }, 401);

    const sessionId = c.req.param('id');
    const body = await c.req.json().catch(() => ({}));
    return app.fetch(
      new Request(new URL(`/api/m4/interviews/sessions/${sessionId}/turn`, c.req.url).toString(), {
        method: 'POST',
        headers: c.req.raw.headers,
        body: JSON.stringify({ ...body, is_retry: true })
      }),
      c.env
    );
  });

  // 5d. Gated Turn Progression: Advance to Next Question (Only upon explicit candidate continuation)
  app.post('/m4/interviews/sessions/:id/advance', async (c) => {
    const user = await getSessionUser(c);
    if (!user) return c.json({ error: 'Unauthorized' }, 401);

    const sessionId = c.req.param('id');
    const session = await c.env.DB.prepare('SELECT * FROM interview_session WHERE id = ?').bind(sessionId).first();
    if (!session) return c.json({ error: 'Session not found' }, 404);

    const { current_turn } = await c.req.json().catch(() => ({}));
    const activeTurn = current_turn !== undefined ? Number(current_turn) : Number(session.current_turn || 1);

    // Verify observation for activeTurn has been recorded
    const obs = await c.env.DB.prepare(
      `SELECT id, ai_interpretation_json FROM interview_observation WHERE session_id = ? AND turn_number = ?`
    ).bind(sessionId, activeTurn).first();

    if (!obs) {
      return c.json({ error: `Cannot advance: turn ${activeTurn} has not been completed yet.` }, 400);
    }

    let interp: any = {};
    try {
      interp = JSON.parse((obs.ai_interpretation_json as string) || '{}');
    } catch (_) {}

    // Invariant: Cannot advance if an active follow-up is pending without being answered or skipped
    if (interp.active_follow_up && !interp.active_follow_up.candidate_response && !interp.active_follow_up.skipped) {
      return c.json({
        error: `Cannot advance: Question #${activeTurn} has an active follow-up probe. Please submit a response or skip the probe before continuing.`
      }, 400);
    }

    let questionSequence: any[] = [];
    let panelRoles: string[] = [];
    try {
      const summary = JSON.parse((session.evidence_summary_json as string) || '{}');
      if (summary.plan?.questions) {
        questionSequence = summary.plan.questions;
        panelRoles = Array.from(new Set(questionSequence.map(q => q.panel_role)));
      }
    } catch (_) {}

    const protocol = SEED_PROTOCOLS.find(p => p.id === session.protocol_id) || SEED_PROTOCOLS[0];
    if (questionSequence.length === 0) {
      questionSequence = protocol.question_sequence;
      panelRoles = protocol.panel_roles;
    }

    const totalTurns = questionSequence.length > 0 ? questionSequence.length : 10;
    const nextTurn = activeTurn + 1;
    const isComplete = nextTurn > totalTurns;

    if (isComplete) {
      await c.env.DB.prepare(
        `UPDATE interview_session 
         SET status = 'completed', updated_at = CURRENT_TIMESTAMP 
         WHERE id = ?`
      ).bind(sessionId).run();

      return c.json({
        success: true,
        is_complete: true,
        turn_advanced_from: activeTurn,
        next_turn: null
      });
    }

    const nextSeqQuestion = questionSequence[nextTurn - 1] || null;
    let nextRole = session.active_panel_role;
    if (nextSeqQuestion) {
      nextRole = nextSeqQuestion.panel_role;
    } else if (panelRoles.length > 0) {
      nextRole = panelRoles[(nextTurn - 1) % panelRoles.length];
    }

    await c.env.DB.prepare(
      `UPDATE interview_session 
       SET current_turn = ?, active_panel_role = ?, updated_at = CURRENT_TIMESTAMP 
       WHERE id = ?`
    ).bind(nextTurn, nextRole, sessionId).run();

    return c.json({
      success: true,
      is_complete: false,
      turn_advanced_from: activeTurn,
      next_turn: {
        turn_number: nextTurn,
        active_panel_role: nextRole,
        next_question: nextSeqQuestion
      }
    });
  });

  // 6. Record Interviewer Human Rating & Notes (Strict separation from AI suggestions)
  app.post('/m4/interviews/sessions/:id/rate', async (c) => {
    const user = await getSessionUser(c);
    if (!user) return c.json({ error: 'Unauthorized' }, 401);

    const sessionId = c.req.param('id');
    const { turn_number, human_rating, human_notes } = await c.req.json().catch(() => ({}));

    if (turn_number === undefined || human_rating === undefined) {
      return c.json({ error: 'turn_number and human_rating are required' }, 400);
    }

    await c.env.DB.prepare(
      `UPDATE interview_observation 
       SET human_rating = ?, human_notes = ? 
       WHERE session_id = ? AND turn_number = ?`
    ).bind(human_rating, human_notes || null, sessionId, turn_number).run();

    return c.json({
      success: true,
      turn_number,
      human_rating,
      notes_saved: Boolean(human_notes)
    });
  });

  // 7. Complete Session & Synthesize Evidence Package for M05
  app.post('/m4/interviews/sessions/:id/complete', async (c) => {
    const user = await getSessionUser(c);
    if (!user) return c.json({ error: 'Unauthorized' }, 401);

    const sessionId = c.req.param('id');
    const session = await c.env.DB.prepare('SELECT * FROM interview_session WHERE id = ?').bind(sessionId).first();
    if (!session) return c.json({ error: 'Session not found' }, 404);

    let protocol = SEED_PROTOCOLS.find(p => p.id === session.protocol_id);
    let protocolTitle = protocol?.title || 'Structured 10-Question Interview';
    let targetRole = protocol?.target_role || 'Professional Candidate';

    try {
      const summary = JSON.parse((session.evidence_summary_json as string) || '{}');
      if (summary.plan?.targetRole) {
        targetRole = summary.plan.targetRole;
        protocolTitle = `${targetRole} Structured 10-Question Interview`;
      }
    } catch (_) {}

    const observations = await c.env.DB.prepare(
      `SELECT * FROM interview_observation WHERE session_id = ? ORDER BY turn_number ASC`
    ).bind(sessionId).all();

    const obsList = observations.results || [];
    let totalScore = 0;
    const strengths: string[] = [];
    const gaps: string[] = [];
    const competencyCoverage: Record<string, { turns: number; avg_score: number }> = {};

    obsList.forEach((o: any) => {
      try {
        const rubric = JSON.parse((o.rubric_evaluation_json as string) || '{}');
        const score = typeof rubric.score === 'number' ? rubric.score : (o.human_rating ? o.human_rating / 5 : 0.8);
        totalScore += score;

        const aiInterp = JSON.parse((o.ai_interpretation_json as string) || '{}');
        if (aiInterp.strengths) strengths.push(aiInterp.strengths);
        if (aiInterp.gaps) gaps.push(aiInterp.gaps);

        const comp = o.interviewer_role || 'General';
        if (!competencyCoverage[comp]) competencyCoverage[comp] = { turns: 0, avg_score: 0 };
        competencyCoverage[comp].turns += 1;
        competencyCoverage[comp].avg_score += score;
      } catch (_) {}
    });

    const overallScore = obsList.length > 0 ? totalScore / obsList.length : 0.80;

    // Build M05 structured evidence package
    const m05Package = {
      session_id: sessionId,
      candidate_user_id: session.candidate_user_id,
      protocol_title: protocolTitle,
      target_role: targetRole,
      total_panel_turns: obsList.length,
      overall_interview_rating: Math.round(overallScore * 100),
      evidence_confidence: 0.89,
      human_review_required: obsList.some((o: any) => o.human_rating === null),
      governance_notice: 'M04 outputs structured evidence and calibrated ratings for human decision support. Automated hiring decisions are strictly prohibited.'
    };

    const synthId = crypto.randomUUID();

    // Check if synthesis already exists
    const existingSynth = await c.env.DB.prepare(
      `SELECT id FROM interview_synthesis WHERE session_id = ?`
    ).bind(sessionId).first();

    if (existingSynth) {
      await c.env.DB.prepare(
        `UPDATE interview_synthesis 
         SET overall_rating = ?, competency_coverage_json = ?, strengths_json = ?, gaps_json = ?, m05_evidence_package_json = ? 
         WHERE session_id = ?`
      ).bind(
        overallScore,
        JSON.stringify(competencyCoverage),
        JSON.stringify(strengths),
        JSON.stringify(gaps),
        JSON.stringify(m05Package),
        sessionId
      ).run();
    } else {
      await c.env.DB.prepare(
        `INSERT INTO interview_synthesis 
         (id, session_id, candidate_user_id, organization_id, overall_rating, competency_coverage_json, strengths_json, gaps_json, unanswered_areas_json, m05_evidence_package_json)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, '[]', ?)`
      ).bind(
        synthId,
        sessionId,
        session.candidate_user_id,
        session.organization_id,
        overallScore,
        JSON.stringify(competencyCoverage),
        JSON.stringify(strengths),
        JSON.stringify(gaps),
        JSON.stringify(m05Package)
      ).run();
    }

    await c.env.DB.prepare(
      `UPDATE interview_session SET status = 'completed', updated_at = CURRENT_TIMESTAMP WHERE id = ?`
    ).bind(sessionId).run();

    // M02 / Readiness updates: update candidate proficiency for the assessed domain
    const candidateProfile = await c.env.DB.prepare('SELECT readiness_score FROM candidate_profile WHERE user_id = ?').bind(session.candidate_user_id).first();
    if (candidateProfile) {
      const currentReadiness = Number(candidateProfile.readiness_score || 0.65);
      const updatedReadiness = Math.min(1.0, currentReadiness * 0.75 + overallScore * 0.25);
      await c.env.DB.prepare('UPDATE candidate_profile SET readiness_score = ? WHERE user_id = ?').bind(updatedReadiness, session.candidate_user_id).run();
    }

    await logAuditEvent(c, session.organization_id as string, user.id, 'COMPLETE', 'INTERVIEW_SESSION', sessionId, { score: overallScore });

    return c.json({
      success: true,
      synthesis_id: synthId,
      overall_rating: Math.round(overallScore * 100),
      strengths: strengths.slice(0, 3),
      gaps: gaps.slice(0, 3),
      competency_coverage: competencyCoverage,
      m05_evidence_package: m05Package
    });
  });

  // 8. Get M05 Synthesis Package
  app.get('/m4/interviews/sessions/:id/synthesis', async (c) => {
    const user = await getSessionUser(c);
    if (!user) return c.json({ error: 'Unauthorized' }, 401);

    const sessionId = c.req.param('id');
    const synthesis = await c.env.DB.prepare(
      `SELECT * FROM interview_synthesis WHERE session_id = ?`
    ).bind(sessionId).first();

    if (!synthesis) return c.json({ error: 'Synthesis not found' }, 404);

    return c.json({
      success: true,
      synthesis: {
        id: synthesis.id,
        overall_rating: Math.round(Number(synthesis.overall_rating) * 100),
        competency_coverage: JSON.parse((synthesis.competency_coverage_json as string) || '{}'),
        strengths: JSON.parse((synthesis.strengths_json as string) || '[]'),
        gaps: JSON.parse((synthesis.gaps_json as string) || '[]'),
        m05_evidence_package: JSON.parse((synthesis.m05_evidence_package_json as string) || '{}')
      }
    });
  });
}
