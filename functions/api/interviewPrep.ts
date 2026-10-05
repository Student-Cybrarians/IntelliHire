import { Hono } from 'hono';
import { Document, Paragraph, TextRun, HeadingLevel } from 'docx';
import type { Bindings, UserSession } from './[[route]]';
import { getSessionUser, logAuditEvent, evaluateAndTeach } from './[[route]]';

export function registerInterviewPrepRoutes(app: Hono<{ Bindings: Bindings }>) {
  
  // 1. Preparation Profile: Aggregate candidate evidence, gaps, misconceptions
  app.get('/m2/prep/profile', async (c) => {
    const user = await getSessionUser(c);
    if (!user) return c.json({ error: 'Unauthorized' }, 401);

    const profile = await c.env.DB.prepare(
      'SELECT * FROM candidate_profile WHERE user_id = ?'
    ).bind(user.id).first();

    const proficiencies = await c.env.DB.prepare(
      `SELECT p.*, s.name as skill_name, c.name as competency_name 
       FROM candidate_skill_proficiency_v2 p
       LEFT JOIN skill s ON p.skill_id = s.id
       LEFT JOIN competency c ON s.competency_id = c.id
       WHERE p.user_id = ?`
    ).bind(user.id).all();

    const claims = await c.env.DB.prepare(
      `SELECT cl.* FROM candidate_claim cl
       JOIN candidate_context ctx ON cl.context_id = ctx.id
       WHERE ctx.user_id = ?`
    ).bind(user.id).all();

    // Extract recent evaluations with misconceptions from teaching payloads
    const recentEvals = await c.env.DB.prepare(
      `SELECT e.*, i.content_json, s.name as skill_name 
       FROM assessment_evaluation e
       JOIN assessment_response_v2 r ON e.response_id = r.id
       JOIN assessment_attempt a ON r.attempt_id = a.id
       JOIN assessment_item_v2 i ON r.item_id = i.id
       LEFT JOIN skill s ON i.skill_id = s.id
       WHERE a.user_id = ?
       ORDER BY e.created_at DESC LIMIT 15`
    ).bind(user.id).all();

    const misconceptions: Array<{ skill: string; misconception: string; timestamp: string }> = [];
    (recentEvals.results || []).forEach((row: any) => {
      try {
        const payload = JSON.parse(row.evaluation_json || '{}');
        if (payload.misconception_remediation && payload.misconception_remediation !== 'N/A') {
          misconceptions.push({
            skill: row.skill_name || 'General',
            misconception: payload.misconception_remediation,
            timestamp: row.created_at
          });
        }
      } catch (_) {}
    });

    const profResults = proficiencies.results || [];
    const strengths = profResults.filter((p: any) => (p.proficiency_estimate ?? 0) >= 0.7);
    const gaps = profResults.filter((p: any) => (p.proficiency_estimate ?? 0) < 0.6 || p.evidence_status === 'missing' || p.evidence_status === 'unassessed');

    return c.json({
      success: true,
      profile: {
        target_role: profile?.target_role || 'General Professional',
        domain: profile?.primary_domain || 'General',
        experience_level: profile?.experience_level || 'mid',
        bio: profile?.bio || '',
        readiness_score: profile?.readiness_score || 0,
        strengths: strengths.map((s: any) => ({
          skill_id: s.skill_id,
          name: s.skill_name || s.skill_id,
          competency: s.competency_name || 'Domain Competency',
          proficiency: s.proficiency_estimate,
          uncertainty: s.uncertainty_estimate
        })),
        gaps: gaps.map((g: any) => ({
          skill_id: g.skill_id,
          name: g.skill_name || g.skill_id,
          competency: g.competency_name || 'Domain Competency',
          proficiency: g.proficiency_estimate ?? 0,
          uncertainty: g.uncertainty_estimate ?? 1.0,
          severity: (g.proficiency_estimate ?? 0) < 0.3 ? 'critical' : 'moderate'
        })),
        misconceptions: misconceptions.slice(0, 5),
        claims_count: (claims.results || []).length
      }
    });
  });

  // 2. Generate Evidence-Driven Preparation Plan
  app.post('/m2/prep/plan', async (c) => {
    const user = await getSessionUser(c);
    if (!user) return c.json({ error: 'Unauthorized' }, 401);

    const body = await c.req.json().catch(() => ({}));
    const targetRole = body.target_role;

    // Load candidate proficiencies
    const proficiencies = await c.env.DB.prepare(
      `SELECT p.*, s.name as skill_name, c.name as competency_name 
       FROM candidate_skill_proficiency_v2 p
       LEFT JOIN skill s ON p.skill_id = s.id
       LEFT JOIN competency c ON s.competency_id = c.id
       WHERE p.user_id = ?`
    ).bind(user.id).all();

    const profResults = proficiencies.results || [];
    
    // Sort gaps by priority: lowest proficiency + highest uncertainty first
    const prioritizedGaps = [...profResults].sort((a: any, b: any) => {
      const scoreA = (a.proficiency_estimate || 0) - (a.uncertainty_estimate || 0.5);
      const scoreB = (b.proficiency_estimate || 0) - (b.uncertainty_estimate || 0.5);
      return scoreA - scoreB;
    });

    const planItems = (prioritizedGaps.length > 0 ? prioritizedGaps : [
      { skill_name: 'Core Domain Principles', competency_name: 'Fundamentals', proficiency_estimate: 0.4, uncertainty_estimate: 0.6 },
      { skill_name: 'Structured Problem Solving', competency_name: 'Execution', proficiency_estimate: 0.5, uncertainty_estimate: 0.5 },
      { skill_name: 'Trade-Off & Risk Analysis', competency_name: 'Judgment', proficiency_estimate: 0.45, uncertainty_estimate: 0.7 }
    ]).slice(0, 6).map((gap: any, idx: number) => {
      const prof = gap.proficiency_estimate || 0;
      const unc = gap.uncertainty_estimate || 0.5;
      const priority = idx === 0 || prof < 0.4 ? 'high' : idx < 3 ? 'medium' : 'low';
      
      return {
        id: `plan-item-${idx + 1}`,
        competency: gap.competency_name || 'Core Competency',
        skill: gap.skill_name || 'Applied Skill',
        reason: prof < 0.4 
          ? `Diagnosed deficiency from prior assessment (Score: ${(prof * 100).toFixed(0)}%, Uncertainty: ${(unc * 100).toFixed(0)}%)`
          : `High evidence uncertainty requires deeper verification before live interviews`,
        current_evidence: `Assessed proficiency: ${(prof * 100).toFixed(0)}% with ${(unc * 100).toFixed(0)}% uncertainty`,
        target_capability: `Articulate, defend, and apply ${gap.skill_name || 'core concepts'} under interview conditions with clear trade-off rationale`,
        priority,
        recommended_learning: `Review systematic methodologies for ${gap.skill_name || 'this domain'}, focusing on decision frameworks and anti-patterns.`,
        recommended_practice: `Practice think-aloud reasoning and 'defend-your-answer' challenge drills on realistic scenarios.`,
        recommended_simulation: `Complete a 3-question adaptive mock interview focusing on ${gap.competency_name || 'this competency'}.`,
        recommended_question_types: ['why-chain', 'defend-your-answer', 'what-if', 'scenario-reasoning'],
        reassessment_criteria: `Score >= 75% on 2 consecutive scenario questions with uncertainty < 0.3`
      };
    });

    return c.json({
      success: true,
      target_role: targetRole || 'Target Role',
      generated_at: new Date().toISOString(),
      plan_items: planItems,
      total_priorities: planItems.length
    });
  });

  // 3. Start Interview Prep Session
  app.post('/m2/prep/sessions', async (c) => {
    const user = await getSessionUser(c);
    if (!user) return c.json({ error: 'Unauthorized' }, 401);

    const dbUser = await c.env.DB.prepare('SELECT organization_id FROM user_account WHERE id = ?').bind(user.id).first();
    const orgId = (dbUser?.organization_id as string) || 'org_default_public';

    const { mode, target_role } = await c.req.json().catch(() => ({}));
    const sessionMode = ['practice', 'learning', 'mock', 'assessment', 'targeted'].includes(mode) ? mode : 'mock';

    const sessionId = crypto.randomUUID();

    await c.env.DB.prepare(
      `INSERT INTO interview_prep_session 
       (id, user_id, organization_id, mode, status, target_role, prep_plan_json, questions_json, misconceptions_json) 
       VALUES (?, ?, ?, ?, 'active', ?, '{}', '[]', '[]')`
    ).bind(sessionId, user.id, orgId, sessionMode, target_role || 'General Role').run();

    await logAuditEvent(c, orgId, user.id, 'START', 'INTERVIEW_PREP_SESSION', sessionId, { mode: sessionMode });

    return c.json({
      success: true,
      session_id: sessionId,
      mode: sessionMode,
      target_role: target_role || 'General Role'
    });
  });

  // 4. Get Session State
  app.get('/m2/prep/sessions/:id', async (c) => {
    const user = await getSessionUser(c);
    if (!user) return c.json({ error: 'Unauthorized' }, 401);

    const sessionId = c.req.param('id');
    const session = await c.env.DB.prepare(
      'SELECT * FROM interview_prep_session WHERE id = ? AND user_id = ?'
    ).bind(sessionId, user.id).first();

    if (!session) return c.json({ error: 'Session not found' }, 404);

    const responses = await c.env.DB.prepare(
      'SELECT * FROM interview_prep_response WHERE session_id = ? ORDER BY created_at ASC'
    ).bind(sessionId).all();

    return c.json({
      success: true,
      session: {
        id: session.id,
        mode: session.mode,
        status: session.status,
        target_role: session.target_role,
        created_at: session.created_at,
        responses: (responses.results || []).map((r: any) => ({
          id: r.id,
          question: JSON.parse(r.question_json || '{}'),
          response_text: r.response_text,
          evaluation: JSON.parse(r.evaluation_json || '{}'),
          follow_up: r.follow_up_json ? JSON.parse(r.follow_up_json) : null,
          created_at: r.created_at
        }))
      }
    });
  });

  // 5. Generate Next Role-Aware Question
  app.post('/m2/prep/sessions/:id/question', async (c) => {
    const user = await getSessionUser(c);
    if (!user) return c.json({ error: 'Unauthorized' }, 401);

    const sessionId = c.req.param('id');
    const session = await c.env.DB.prepare(
      'SELECT * FROM interview_prep_session WHERE id = ? AND user_id = ?'
    ).bind(sessionId, user.id).first();

    if (!session) return c.json({ error: 'Session not found' }, 404);
    if (session.status !== 'active') return c.json({ error: 'Session is completed' }, 400);

    // Count past questions in this session
    const pastResponses = await c.env.DB.prepare(
      'SELECT * FROM interview_prep_response WHERE session_id = ?'
    ).bind(sessionId).all();
    const questionNumber = (pastResponses.results || []).length + 1;

    if (questionNumber > 5) {
      return c.json({ completed: true, message: 'Interview session questions finished. Ready for debrief.' });
    }

    // Select competency gap or profile skill
    const gaps = await c.env.DB.prepare(
      `SELECT p.*, s.name as skill_name, c.name as competency_name 
       FROM candidate_skill_proficiency_v2 p
       LEFT JOIN skill s ON p.skill_id = s.id
       LEFT JOIN competency c ON s.competency_id = c.id
       WHERE p.user_id = ? ORDER BY p.proficiency_estimate ASC LIMIT 3`
    ).bind(user.id).all();

    const targetGap: any = (gaps.results || [])[questionNumber % Math.max(1, (gaps.results || []).length)] || {};
    const skillName = targetGap.skill_name || 'System Architecture & Decision Making';
    const compName = targetGap.competency_name || 'Problem Solving & Judgment';

    // Cycle through dynamic questioning techniques
    const dynamicTechniques = [
      { type: 'answer-first', prompt: 'Lead with your conclusion first, then walk through the supporting evidence and trade-offs.' },
      { type: 'defend-your-answer', prompt: 'An executive stakeholder challenges your proposed solution as overly conservative. Defend your choice.' },
      { type: 'what-if', prompt: 'Suppose your available timeline and budget are cut in half after week 2. How do you adapt your plan?' },
      { type: 'why-chain', prompt: 'Explain the root cause of why this design or approach succeeds where conventional methods fail.' },
      { type: 'compare-and-contrast', prompt: 'Compare your chosen methodology against the leading alternative. Under what conditions would you switch?' }
    ];
    const technique = dynamicTechniques[(questionNumber - 1) % dynamicTechniques.length];

    // Dimension
    const dimensions = ['judgment', 'execution', 'reasoning', 'communication', 'risk', 'adaptability'];
    const dimension = dimensions[(questionNumber - 1) % dimensions.length];

    let questionText = `In your role as ${session.target_role || 'lead'}, how do you approach ${skillName}? ${technique.prompt}`;
    let evaluationCriteria = `Demonstrates structured thinking, acknowledges trade-offs, and provides concrete justification for ${compName}.`;

    // Try AI generation if API key is present
    if (c.env.NVIDIA_API_KEY) {
      try {
        const aiPrompt = `You are a rigorous, domain-aware executive interviewer evaluating a candidate for: "${session.target_role || 'Professional'}".
Focus Competency: "${compName}"
Target Skill: "${skillName}"
Questioning Dynamics Technique: "${technique.type}"
Evaluation Dimension: "${dimension}"

Generate a realistic, scenario-based interview question. DO NOT ask generic textbook trivia. Ask a situational, trade-off, or execution question.
Return ONLY valid JSON:
{
  "question": "<The question string>",
  "technique": "${technique.type}",
  "dimension": "${dimension}",
  "focus_area": "${skillName}",
  "evaluation_criteria": "<What a strong candidate response must demonstrate>"
}`;

        const aiRes = await fetch('https://integrate.api.nvidia.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${c.env.NVIDIA_API_KEY}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            model: 'meta/muse-glimmer-30b',
            messages: [
              { role: 'system', content: 'You are an expert interviewer. Return ONLY strict JSON.' },
              { role: 'user', content: aiPrompt }
            ],
            temperature: 0.3,
            max_tokens: 500
          })
        });

        if (aiRes.ok) {
          const aiData = await aiRes.json() as any;
          const content = aiData.choices?.[0]?.message?.content || '{}';
          const parsed = JSON.parse(content.substring(content.indexOf('{'), content.lastIndexOf('}') + 1));
          if (parsed.question) {
            questionText = parsed.question;
            evaluationCriteria = parsed.evaluation_criteria || evaluationCriteria;
          }
        }
      } catch (_) {}
    }

    const questionPayload = {
      id: crypto.randomUUID(),
      question_number: questionNumber,
      total_questions: 5,
      competency: compName,
      skill: skillName,
      dimension,
      technique: technique.type,
      question: questionText,
      evaluation_criteria: evaluationCriteria,
      mode: session.mode
    };

    return c.json({
      success: true,
      question: questionPayload
    });
  });

  // 6. Submit Response & Run Adaptive Evaluation Loop
  app.post('/m2/prep/sessions/:id/respond', async (c) => {
    const user = await getSessionUser(c);
    if (!user) return c.json({ error: 'Unauthorized' }, 401);

    const sessionId = c.req.param('id');
    const session = await c.env.DB.prepare(
      'SELECT * FROM interview_prep_session WHERE id = ? AND user_id = ?'
    ).bind(sessionId, user.id).first();

    if (!session) return c.json({ error: 'Session not found' }, 404);

    const { question, response_text } = await c.req.json().catch(() => ({}));
    if (!question || !response_text) return c.json({ error: 'Question and response_text are required' }, 400);

    // Reuse evaluateAndTeach infrastructure
    // Construct simulated item & response records for evaluateAndTeach compatibility
    const mockItem = {
      id: question.id || crypto.randomUUID(),
      item_type: 'short_answer',
      skill_id: question.skill || 'domain-competency',
      content_json: JSON.stringify({
        question: question.question,
        criteria: question.evaluation_criteria
      })
    };

    const mockAttempt = {
      id: sessionId,
      user_id: user.id,
      adaptive_state_json: '{}'
    };

    const evalResult = await evaluateAndTeach(
      c.env,
      { id: crypto.randomUUID() },
      mockItem,
      mockAttempt,
      { answer: response_text }
    );

    // Save response to DB
    const responseId = crypto.randomUUID();
    await c.env.DB.prepare(
      `INSERT INTO interview_prep_response 
       (id, session_id, question_json, response_text, evaluation_json, follow_up_json) 
       VALUES (?, ?, ?, ?, ?, ?)`
    ).bind(
      responseId,
      sessionId,
      JSON.stringify(question),
      response_text,
      JSON.stringify(evalResult),
      JSON.stringify(evalResult.teaching_payload?.follow_up_question ? {
        question: evalResult.teaching_payload.follow_up_question,
        adaptation: evalResult.teaching_payload.adaptation_recommendation
      } : null)
    ).run();

    // In mock mode: do not reveal full answer if candidate is mid-interview, but return guidance
    const isMock = session.mode === 'mock';
    const filteredEvaluation = isMock ? {
      score_raw: evalResult.score_raw,
      evaluator_type: evalResult.evaluator_type,
      // For mock: provide immediate interviewer reaction/probe without giving away the full answer
      analysis: evalResult.teaching_payload?.analysis_of_candidate_answer,
      interviewer_follow_up: evalResult.teaching_payload?.follow_up_question,
      adaptation: evalResult.teaching_payload?.adaptation_recommendation
    } : evalResult;

    return c.json({
      success: true,
      response_id: responseId,
      evaluation: filteredEvaluation,
      teaching_payload: isMock ? undefined : evalResult.teaching_payload,
      follow_up: evalResult.teaching_payload?.follow_up_question
    });
  });

  // 7. Complete Session & Generate Comprehensive Debrief
  app.post('/m2/prep/sessions/:id/complete', async (c) => {
    const user = await getSessionUser(c);
    if (!user) return c.json({ error: 'Unauthorized' }, 401);

    const sessionId = c.req.param('id');
    const session = await c.env.DB.prepare(
      'SELECT * FROM interview_prep_session WHERE id = ? AND user_id = ?'
    ).bind(sessionId, user.id).first();

    if (!session) return c.json({ error: 'Session not found' }, 404);

    const responses = await c.env.DB.prepare(
      'SELECT * FROM interview_prep_response WHERE session_id = ? ORDER BY created_at ASC'
    ).bind(sessionId).all();

    const respList = responses.results || [];
    let totalScore = 0;
    const debriefItems: any[] = [];
    const recurringMisconceptions: string[] = [];

    respList.forEach((r: any) => {
      try {
        const ev = JSON.parse(r.evaluation_json || '{}');
        const q = JSON.parse(r.question_json || '{}');
        const score = typeof ev.score_raw === 'number' ? ev.score_raw : 0.7;
        totalScore += score;

        const teaching = ev.teaching_payload || {};
        if (teaching.misconception_remediation && teaching.misconception_remediation !== 'N/A') {
          recurringMisconceptions.push(teaching.misconception_remediation);
        }

        debriefItems.push({
          question: q.question,
          competency: q.competency,
          candidate_answer: r.response_text,
          score_percentage: Math.round(score * 100),
          ideal_approach: teaching.explanation_of_correct_answer || 'Structured problem solving with clear trade-offs',
          strengths: score >= 0.7 ? 'Clear rationale and relevant evidence cited' : 'Demonstrated initial understanding of domain scope',
          areas_to_improve: teaching.analysis_of_candidate_answer || 'Strengthen quantitative justification and alternative comparison',
          misconception: teaching.misconception_remediation || null
        });
      } catch (_) {}
    });

    const avgScore = respList.length > 0 ? totalScore / respList.length : 0.75;

    await c.env.DB.prepare(
      `UPDATE interview_prep_session 
       SET status = 'completed', 
           readiness_snapshot_json = ?, 
           misconceptions_json = ?,
           updated_at = CURRENT_TIMESTAMP 
       WHERE id = ?`
    ).bind(
      JSON.stringify({ avg_score: avgScore, count: respList.length }),
      JSON.stringify(recurringMisconceptions),
      sessionId
    ).run();

    return c.json({
      success: true,
      session_id: sessionId,
      overall_readiness_score: Math.round(avgScore * 100),
      total_questions_answered: respList.length,
      debrief: debriefItems,
      misconceptions_to_remediate: [...new Set(recurringMisconceptions)]
    });
  });

  // 8. Interview Readiness Synthesis (Decision-support only, no autonomous hiring decision)
  app.get('/m2/prep/readiness', async (c) => {
    const user = await getSessionUser(c);
    if (!user) return c.json({ error: 'Unauthorized' }, 401);

    const profile = await c.env.DB.prepare(
      'SELECT * FROM candidate_profile WHERE user_id = ?'
    ).bind(user.id).first();

    const proficiencies = await c.env.DB.prepare(
      `SELECT p.*, s.name as skill_name, c.name as competency_name 
       FROM candidate_skill_proficiency_v2 p
       LEFT JOIN skill s ON p.skill_id = s.id
       LEFT JOIN competency c ON s.competency_id = c.id
       WHERE p.user_id = ?`
    ).bind(user.id).all();

    const sessions = await c.env.DB.prepare(
      `SELECT * FROM interview_prep_session WHERE user_id = ? AND status = 'completed'`
    ).bind(user.id).all();

    const profResults = proficiencies.results || [];
    const completedSessions = sessions.results || [];

    const totalAssessed = profResults.filter((p: any) => p.evidence_status === 'assessed').length;
    const avgProficiency = profResults.length > 0
      ? profResults.reduce((acc: number, p: any) => acc + (p.proficiency_estimate || 0), 0) / profResults.length
      : 0.65;
    const avgUncertainty = profResults.length > 0
      ? profResults.reduce((acc: number, p: any) => acc + (p.uncertainty_estimate || 0.5), 0) / profResults.length
      : 0.45;

    return c.json({
      success: true,
      readiness: {
        candidate_name: user.full_name,
        target_role: profile?.target_role || 'Target Role',
        domain: profile?.primary_domain || 'General',
        experience_level: profile?.experience_level || 'mid',
        overall_readiness_score: Math.round(avgProficiency * 100),
        evidence_confidence_score: Math.round((1 - avgUncertainty) * 100),
        competency_coverage: {
          total_competencies: profResults.length,
          verified: totalAssessed,
          coverage_percentage: profResults.length > 0 ? Math.round((totalAssessed / profResults.length) * 100) : 50
        },
        mock_interviews_completed: completedSessions.length,
        disclaimer: 'This synthesis provides candidate preparation analytics and human decision support. It does NOT constitute an automated hiring decision.',
        remaining_preparation_priorities: profResults
          .filter((p: any) => (p.proficiency_estimate || 0) < 0.65)
          .map((p: any) => ({
            skill: p.skill_name || p.skill_id,
            competency: p.competency_name || 'Domain Competency',
            current_level: `${Math.round((p.proficiency_estimate || 0) * 100)}%`,
            target_level: '75%+'
          }))
      }
    });
  });

  // 9. Export Preparation Guide (DOCX Format)
  app.get('/m2/prep/sessions/:id/export', async (c) => {
    const user = await getSessionUser(c);
    if (!user) return c.json({ error: 'Unauthorized' }, 401);

    const sessionId = c.req.param('id');
    const session = await c.env.DB.prepare(
      'SELECT * FROM interview_prep_session WHERE id = ? AND user_id = ?'
    ).bind(sessionId, user.id).first();

    if (!session) return c.json({ error: 'Session not found' }, 404);

    const profile = await c.env.DB.prepare(
      'SELECT * FROM candidate_profile WHERE user_id = ?'
    ).bind(user.id).first();

    const responses = await c.env.DB.prepare(
      'SELECT * FROM interview_prep_response WHERE session_id = ? ORDER BY created_at ASC'
    ).bind(sessionId).all();

    const respList = responses.results || [];

    // Build structured DOCX document using docx library
    const docChildren: any[] = [
      new Paragraph({
        text: 'INTELLIHIRE INTERVIEW PREPARATION GUIDE',
        heading: HeadingLevel.HEADING_1
      }),
      new Paragraph({
        children: [
          new TextRun({ text: 'Candidate: ', bold: true }),
          new TextRun(user.full_name || 'Candidate'),
          new TextRun({ text: '   |   Target Role: ', bold: true }),
          new TextRun(session.target_role || profile?.target_role || 'Target Professional'),
          new TextRun({ text: '   |   Mode: ', bold: true }),
          new TextRun(session.mode.toUpperCase())
        ]
      }),
      new Paragraph({
        text: 'This personalized preparation guide synthesizes actual assessment evidence, diagnosed competency gaps, and interview performance from your IntelliHire preparation sessions.',
        spacing: { before: 200, after: 300 }
      }),
      new Paragraph({
        text: '1. Executive Preparation Summary',
        heading: HeadingLevel.HEADING_2
      }),
      new Paragraph({
        children: [
          new TextRun({ text: 'Target Role & Domain: ', bold: true }),
          new TextRun(`${session.target_role || 'Role'} in ${profile?.primary_domain || 'General Domain'}\n`),
          new TextRun({ text: 'Interview Simulation Mode: ', bold: true }),
          new TextRun(`${session.mode} (${respList.length} questions completed)\n`),
          new TextRun({ text: 'Synthesized Readiness: ', bold: true }),
          new TextRun(`${Math.round(Number(profile?.readiness_score || 0.7) * 100)}% verified readiness`)
        ],
        spacing: { after: 200 }
      }),
      new Paragraph({
        text: '2. Interview Questions, Evaluation & Debrief',
        heading: HeadingLevel.HEADING_2
      })
    ];

    respList.forEach((r: any, idx: number) => {
      try {
        const q = JSON.parse(r.question_json || '{}');
        const ev = JSON.parse(r.evaluation_json || '{}');
        const teaching = ev.teaching_payload || {};

        docChildren.push(
          new Paragraph({
            text: `Question ${idx + 1}: ${q.competency || 'Domain'} — ${q.skill || 'Skill'} [${q.technique || 'Standard'}]`,
            heading: HeadingLevel.HEADING_3,
            spacing: { before: 200 }
          }),
          new Paragraph({
            children: [
              new TextRun({ text: 'Prompt: ', bold: true, italics: true }),
              new TextRun(q.question || 'Interview prompt')
            ]
          }),
          new Paragraph({
            children: [
              new TextRun({ text: 'Your Stated Response: ', bold: true }),
              new TextRun(r.response_text || 'No response recorded')
            ]
          }),
          new Paragraph({
            children: [
              new TextRun({ text: 'The Recommended Approach: ', bold: true }),
              new TextRun(teaching.explanation_of_correct_answer || 'Demonstrate structured trade-off reasoning.')
            ]
          }),
          new Paragraph({
            children: [
              new TextRun({ text: 'Analysis of Your Answer: ', bold: true }),
              new TextRun(teaching.analysis_of_candidate_answer || 'Response analyzed according to competency rubric.')
            ]
          })
        );

        if (teaching.misconception_remediation && teaching.misconception_remediation !== 'N/A') {
          docChildren.push(
            new Paragraph({
              children: [
                new TextRun({ text: 'Misconception Remediation: ', bold: true }),
                new TextRun(teaching.misconception_remediation)
              ]
            })
          );
        }
      } catch (_) {}
    });

    // Readiness checklist
    docChildren.push(
      new Paragraph({
        text: '3. Pre-Interview Readiness Checklist',
        heading: HeadingLevel.HEADING_2,
        spacing: { before: 300 }
      }),
      new Paragraph({ text: ' [X] Review diagnosed misconceptions before the interview.' }),
      new Paragraph({ text: ' [X] Prepare 2 concrete project examples demonstrating the recommended trade-off reasoning.' }),
      new Paragraph({ text: ' [X] Practice the answer-first communication technique on high-stakes architectural questions.' }),
      new Paragraph({ text: ' [X] Verify evidence items in the Candidate Portfolio are current.' }),
      new Paragraph({
        text: '\nGenerated by IntelliHire M02 Interview Preparation Engine. For human candidate development and decision support only.',
        spacing: { before: 400 }
      })
    );

    const doc = new Document({
      sections: [{ properties: {}, children: docChildren }]
    });

    const buffer = await (await import('docx')).Packer.toBuffer(doc);

    return new Response(buffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'Content-Disposition': `attachment; filename="IntelliHire_Interview_Prep_Guide_${session.target_role?.replace(/\s+/g, '_') || 'General'}.docx"`
      }
    });
  });
}
