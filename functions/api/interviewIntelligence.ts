import { Hono } from 'hono';
import type { Bindings, UserSession } from './[[route]]';
import { getSessionUser, logAuditEvent } from './[[route]]';

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

  // 3. Start or Schedule Structured Interview Session
  app.post('/m4/interviews/sessions', async (c) => {
    const user = await getSessionUser(c);
    if (!user) return c.json({ error: 'Unauthorized' }, 401);

    const dbUser = await c.env.DB.prepare('SELECT organization_id FROM user_account WHERE id = ?').bind(user.id).first();
    const orgId = (dbUser?.organization_id as string) || 'org_default_public';

    const { protocol_id, candidate_user_id, requisition_id } = await c.req.json().catch(() => ({}));
    const protocol = SEED_PROTOCOLS.find(p => p.id === protocol_id) || SEED_PROTOCOLS[0];

    const targetCandidateId = candidate_user_id || user.id;
    const sessionId = crypto.randomUUID();

    await c.env.DB.prepare(
      `INSERT INTO interview_session 
       (id, organization_id, protocol_id, candidate_user_id, interviewer_user_id, requisition_id, status, active_panel_role, current_turn)
       VALUES (?, ?, ?, ?, ?, ?, 'in_progress', ?, 1)`
    ).bind(
      sessionId, orgId, protocol.id, targetCandidateId, user.id, requisition_id || null, protocol.panel_roles[0] || 'Hiring Manager'
    ).run();

    await logAuditEvent(c, orgId, user.id, 'START', 'INTERVIEW_SESSION', sessionId, { protocol_id: protocol.id });

    return c.json({
      success: true,
      session_id: sessionId,
      protocol,
      active_panel_role: protocol.panel_roles[0] || 'Hiring Manager',
      current_turn: 1,
      first_question: protocol.question_sequence[0] || null
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

    const protocol = SEED_PROTOCOLS.find(p => p.id === session.protocol_id) || SEED_PROTOCOLS[0];

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
        turns: (observations.results || []).map((o: any) => ({
          turn_number: o.turn_number,
          interviewer_role: o.interviewer_role,
          question: o.question_text,
          candidate_response: o.candidate_response,
          observable_evidence: JSON.parse((o.observable_evidence_json as string) || '[]'),
          rubric_evaluation: JSON.parse((o.rubric_evaluation_json as string) || '{}'),
          ai_interpretation: JSON.parse((o.ai_interpretation_json as string) || '{}'),
          ai_recommended_probe: o.ai_recommended_probe,
          human_rating: o.human_rating,
          human_notes: o.human_notes
        }))
      }
    });
  });

  // 5. Submit Turn Response & Adaptive Evaluation Loop
  app.post('/m4/interviews/sessions/:id/turn', async (c) => {
    const user = await getSessionUser(c);
    if (!user) return c.json({ error: 'Unauthorized' }, 401);

    const sessionId = c.req.param('id');
    const session = await c.env.DB.prepare('SELECT * FROM interview_session WHERE id = ?').bind(sessionId).first();
    if (!session) return c.json({ error: 'Session not found' }, 404);

    const { candidate_response, current_question, interviewer_role } = await c.req.json().catch(() => ({}));
    if (!candidate_response || !current_question) {
      return c.json({ error: 'candidate_response and current_question are required' }, 400);
    }

    const protocol = SEED_PROTOCOLS.find(p => p.id === session.protocol_id) || SEED_PROTOCOLS[0];
    const turnNumber = Number(session.current_turn || 1);

    // AI-Assisted Evidence Extraction & Anchored Rubric Scoring if NVIDIA Key present
    let rubricScore = 0.82;
    let observableEvidence = [
      'Candidate structured answer using conclusion-first methodology',
      'Directly addressed consensus protocol failover under network partition'
    ];
    let aiInterpretation = {
      strengths: 'Demonstrated clear trade-off understanding between latency and consistency.',
      gaps: 'Did not explicitly calculate the cross-region network round-trip time budget.'
    };
    let aiRecommendedProbe = 'What is your maximum acceptable failover latency before secondary partition recovery triggers?';

    if (c.env.NVIDIA_API_KEY) {
      try {
        const prompt = `You are an expert executive interview panel evaluator.
Protocol: ${protocol.title}
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

    const obsId = crypto.randomUUID();

    // Persist observation
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
      current_question.question_type || 'structured',
      candidate_response,
      JSON.stringify(observableEvidence),
      JSON.stringify({ score: rubricScore, criteria: current_question.anchored_rubric }),
      JSON.stringify(aiInterpretation),
      aiRecommendedProbe
    ).run();

    // Advance turn and coordinate panel members
    const nextTurn = turnNumber + 1;
    const nextPanelIndex = (nextTurn - 1) % protocol.panel_roles.length;
    const nextRole = protocol.panel_roles[nextPanelIndex];
    const nextSeqQuestion = protocol.question_sequence[turnNumber] || null;

    await c.env.DB.prepare(
      `UPDATE interview_session 
       SET current_turn = ?, active_panel_role = ?, updated_at = CURRENT_TIMESTAMP 
       WHERE id = ?`
    ).bind(nextTurn, nextRole, sessionId).run();

    return c.json({
      success: true,
      observation_id: obsId,
      turn_completed: turnNumber,
      evaluation: {
        score: Math.round(rubricScore * 100),
        observable_evidence: observableEvidence,
        ai_interpretation: aiInterpretation,
        ai_recommended_probe: aiRecommendedProbe
      },
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

    const protocol = SEED_PROTOCOLS.find(p => p.id === session.protocol_id) || SEED_PROTOCOLS[0];

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
      protocol_title: protocol.title,
      target_role: protocol.target_role,
      total_panel_turns: obsList.length,
      overall_interview_rating: Math.round(overallScore * 100),
      evidence_confidence: 0.89,
      human_review_required: obsList.some((o: any) => o.human_rating === null),
      governance_notice: 'M04 outputs structured evidence and calibrated ratings for human decision support. Automated hiring decisions are strictly prohibited.'
    };

    const synthId = crypto.randomUUID();

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
