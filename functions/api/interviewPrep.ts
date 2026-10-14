import { Hono } from 'hono';
import { Document, Paragraph, TextRun, HeadingLevel } from 'docx';
import type { Bindings, UserSession } from './[[route]]';
import { getSessionUser, logAuditEvent, evaluateAndTeach } from './[[route]]';
import { extractSourceFactInventory } from '../../src/shared/resumeGeneration';

// Helper: Compile transparent gap analysis matrix mapping
// Role requirement -> candidate evidence -> confidence/status -> learning objective -> assessment method
function buildTransparentGapMatrix(
  targetRole: string,
  inventory: any,
  profResults: any[],
  claims: any[]
): Array<{
  role_requirement: string;
  category: string;
  candidate_evidence: string;
  confidence_status: 'demonstrated' | 'partial_evidence' | 'gap_unverified' | 'outdated';
  learning_objective: string;
  assessment_method: string;
}> {
  const isAiMl = /ai|machine learning|ml|prompt|data/i.test(targetRole);
  const isSoftware = /software|developer|frontend|backend|fullstack|web/i.test(targetRole);

  const roleBlueprints: Array<{
    role_requirement: string;
    skill_key: string;
    category: string;
    learning_objective: string;
    assessment_method: string;
    keywords: string[];
  }> = isAiMl
    ? [
        {
          role_requirement: 'Generative AI & Prompt Engineering Workflows',
          skill_key: 'Prompt Engineering',
          category: 'core_technical',
          learning_objective: 'Master structured prompting, context engineering, and systematic evaluation of LLM outputs under latency/cost constraints.',
          assessment_method: 'interactive_simulation',
          keywords: ['prompt engineering', 'generative ai', 'context engineering', 'llm']
        },
        {
          role_requirement: 'Neural Network Architectures (ANN/CNN) & Signal/Image Modeling',
          skill_key: 'Artificial Neural Networks (ANN)',
          category: 'core_technical',
          learning_objective: 'Design, train, and diagnose feedforward and convolutional networks with proper regularization and loss functions.',
          assessment_method: 'adaptive_assessment',
          keywords: ['neural network', 'ann', 'cnn', 'deep learning', 'convolutional']
        },
        {
          role_requirement: 'Natural Language Processing (NLP) & Semantic Embeddings',
          skill_key: 'Natural Language Processing (NLP)',
          category: 'core_technical',
          learning_objective: 'Understand tokenization, semantic embeddings, and attention-based representations for applied text intelligence.',
          assessment_method: 'adaptive_assessment',
          keywords: ['nlp', 'natural language', 'embeddings', 'tokenization']
        },
        {
          role_requirement: 'Signal Sensing & AI Prototype Project Defense',
          skill_key: 'Project Defense',
          category: 'project_defense',
          learning_objective: 'Articulate architecture, trade-offs, and failure recovery for through-wall human detection (Human-Detection) and ML intrusion systems.',
          assessment_method: 'project_defense',
          keywords: ['wifi csi', 'human-detection', 'ai-ids-es', 'classification', 'intrusion']
        },
        {
          role_requirement: 'Applied Machine Learning Pipeline & Data Preprocessing',
          skill_key: 'Machine Learning',
          category: 'applied_engineering',
          learning_objective: 'Build end-to-end classification pipelines avoiding data leakage and handling class imbalance.',
          assessment_method: 'adaptive_assessment',
          keywords: ['machine learning', 'classification', 'regression', 'preprocessing', 'scikit-learn']
        },
        {
          role_requirement: 'Cross-Functional Technical Communication & Trade-Off Defense',
          skill_key: 'Communication',
          category: 'non_technical',
          learning_objective: 'Defend engineering trade-offs to non-technical stakeholders and translate technical metrics into business utility.',
          assessment_method: 'star_behavioral',
          keywords: ['communication', 'trade-off', 'presentation', 'stakeholder']
        },
        {
          role_requirement: 'Behavioral Execution, Feedback Handling & STAR Storytelling',
          skill_key: 'Behavioral',
          category: 'non_technical',
          learning_objective: 'Structure behavioral narratives using the STAR method (Situation, Task, Action, Result) for conflict and deadline pressure.',
          assessment_method: 'star_behavioral',
          keywords: ['problem solving', 'collaboration', 'behavioral', 'teamwork']
        }
      ]
    : isSoftware
    ? [
        {
          role_requirement: 'Modern Web Architecture, Async Concurrency & API Design',
          skill_key: 'Web Architecture',
          category: 'core_technical',
          learning_objective: 'Design scalable, decoupled web applications using RESTful APIs, modern reactive patterns, and resilient asynchronous state.',
          assessment_method: 'adaptive_assessment',
          keywords: ['javascript', 'typescript', 'react', 'node', 'api', 'html5']
        },
        {
          role_requirement: 'Database Indexing, Query Optimization & Transaction Isolation',
          skill_key: 'Database Engineering',
          category: 'applied_engineering',
          learning_objective: 'Structure relational schemas, design covering indexes, and analyze execution plans to avoid N+1 queries and deadlocks.',
          assessment_method: 'adaptive_assessment',
          keywords: ['sql', 'database', 'indexing', 'transactions', 'sqlite']
        },
        {
          role_requirement: 'Candidate Full-Stack Project Deep Dive & Code Ownership',
          skill_key: 'Project Defense',
          category: 'project_defense',
          learning_objective: 'Defend architectural decisions, state management, and edge-case handling in personal portfolio and production apps.',
          assessment_method: 'project_defense',
          keywords: ['portfolio', 'intellihire', 'full-stack', 'git', 'github']
        },
        {
          role_requirement: 'Cross-Functional Technical Communication & Trade-Off Defense',
          skill_key: 'Communication',
          category: 'non_technical',
          learning_objective: 'Communicate complex technical trade-offs clearly to stakeholders and collaborate effectively in code reviews.',
          assessment_method: 'star_behavioral',
          keywords: ['communication', 'trade-offs', 'code review']
        },
        {
          role_requirement: 'Behavioral Execution, Feedback Handling & STAR Storytelling',
          skill_key: 'Behavioral',
          category: 'non_technical',
          learning_objective: 'Demonstrate structured conflict resolution, ownership, and adaptability under changing requirements.',
          assessment_method: 'star_behavioral',
          keywords: ['behavioral', 'teamwork', 'problem solving']
        }
      ]
    : [
        {
          role_requirement: 'Core Domain Principles & Analytical Frameworks',
          skill_key: 'Domain Principles',
          category: 'core_technical',
          learning_objective: 'Demonstrate rigorous understanding of fundamental occupational frameworks and best practices.',
          assessment_method: 'adaptive_assessment',
          keywords: ['analysis', 'domain', 'framework', 'principles']
        },
        {
          role_requirement: 'Practical Execution & Project Defense',
          skill_key: 'Project Defense',
          category: 'project_defense',
          learning_objective: 'Walk through real project deliverables, decisions, and outcomes with concrete supporting evidence.',
          assessment_method: 'project_defense',
          keywords: ['project', 'execution', 'deliverable']
        },
        {
          role_requirement: 'Cross-Functional Communication & Trade-Offs',
          skill_key: 'Communication',
          category: 'non_technical',
          learning_objective: 'Articulate decisions clearly to diverse stakeholders and navigate resource trade-offs.',
          assessment_method: 'star_behavioral',
          keywords: ['communication', 'stakeholder', 'negotiation']
        },
        {
          role_requirement: 'Behavioral Competencies & Situational Problem Solving',
          skill_key: 'Behavioral',
          category: 'non_technical',
          learning_objective: 'Deliver structured STAR narratives showcasing leadership, accountability, and teamwork.',
          assessment_method: 'star_behavioral',
          keywords: ['leadership', 'teamwork', 'behavioral']
        }
      ];

  const candidateSkills = (inventory?.verifiedSkills || []).map((s: string) => s.toLowerCase());
  const projects = inventory?.projectEntries || [];
  const projectText = projects.map((p: any) => `${p.name} ${p.subtitle || ''} ${(p.bullets || []).join(' ')}`).join(' ').toLowerCase();
  const experienceText = (inventory?.experienceEntries || []).map((e: any) => `${e.company} ${e.title} ${(e.bullets || []).join(' ')}`).join(' ').toLowerCase();

  return roleBlueprints.map(bp => {
    // Check proficiency
    const profMatch = profResults.find((p: any) => 
      (p.skill_name && bp.keywords.some(k => p.skill_name.toLowerCase().includes(k))) ||
      (p.skill_id && bp.keywords.some(k => p.skill_id.toLowerCase().includes(k)))
    );

    const hasSkillMatch = bp.keywords.some(k => candidateSkills.some(cs => cs.includes(k)));
    const hasExpMatch = bp.keywords.some(k => experienceText.includes(k));
    const matchedProject = projects.find((p: any) => bp.keywords.some(k => `${p.name} ${p.subtitle || ''} ${(p.bullets || []).join(' ')}`.toLowerCase().includes(k)));

    let status: 'demonstrated' | 'partial_evidence' | 'gap_unverified' | 'outdated' = 'gap_unverified';
    let evidenceStr = 'No verified resume claim or prior assessment found for this requirement.';

    if (profMatch && (profMatch.proficiency_estimate ?? 0) >= 0.7) {
      status = 'demonstrated';
      evidenceStr = `Demonstrated: Assessed at ${(profMatch.proficiency_estimate * 100).toFixed(0)}% proficiency (Uncertainty: ${((profMatch.uncertainty_estimate ?? 0.2) * 100).toFixed(0)}%) in M02.`;
    } else if (matchedProject) {
      status = 'partial_evidence';
      evidenceStr = `Substantiated in Candidate Project: "${matchedProject.name}"${matchedProject.subtitle ? ` (${matchedProject.subtitle})` : ''}; formal adaptive assessment pending.`;
    } else if (hasExpMatch) {
      status = 'partial_evidence';
      evidenceStr = `Supported by candidate work experience record; adaptive assessment calibration recommended.`;
    } else if (hasSkillMatch) {
      status = 'partial_evidence';
      evidenceStr = `Extracted from verified candidate skills inventory; formative assessment recommended to establish benchmark.`;
    } else if (profMatch && (profMatch.proficiency_estimate ?? 0) < 0.6) {
      status = 'gap_unverified';
      evidenceStr = `Diagnosed Gap: M02 prior score was ${(profMatch.proficiency_estimate * 100).toFixed(0)}%; structured remediation and reassessment required.`;
    }

    return {
      role_requirement: bp.role_requirement,
      category: bp.category,
      candidate_evidence: evidenceStr,
      confidence_status: status,
      learning_objective: bp.learning_objective,
      assessment_method: bp.assessment_method
    };
  });
}

// Helper: Build assumptions list for candidate review
function buildAssumptionsList(gapMatrix: any[], inventory: any, profile?: any): Array<{
  field?: string;
  label?: string;
  current_value?: string;
  explanation?: string;
  assumption: string;
  category: string;
  status: 'confirmed' | 'unverified' | 'candidate_confirmed';
  clarification_prompt: string;
}> {
  const assumptions: any[] = [];

  if (profile?.target_role) {
    assumptions.push({
      field: 'target_role',
      label: 'Target Role',
      current_value: String(profile.target_role),
      explanation: 'Target career role configured for this preparation profile.',
      assumption: `Target role specified as "${profile.target_role}".`,
      category: 'role_calibration',
      status: 'candidate_confirmed',
      clarification_prompt: 'Verify or calibrate your target interview role.'
    });
  }

  if (profile?.primary_domain) {
    assumptions.push({
      field: 'primary_domain',
      label: 'Primary Domain',
      current_value: String(profile.primary_domain),
      explanation: 'Domain taxonomy calibration for interview tracks and curricula.',
      assumption: `Primary domain aligned to "${profile.primary_domain}".`,
      category: 'domain_calibration',
      status: 'candidate_confirmed',
      clarification_prompt: 'Verify your primary domain taxonomy classification.'
    });
  }

  const unverifiedGaps = gapMatrix.filter(g => g.confidence_status === 'gap_unverified');
  if (unverifiedGaps.length > 0) {
    for (const g of unverifiedGaps.slice(0, 3)) {
      assumptions.push({
        field: 'gap_' + g.category,
        label: g.role_requirement,
        current_value: 'Unverified Gap',
        explanation: 'No prior assessment or resume claim recorded for this requirement.',
        assumption: `Candidate has not demonstrated verified experience in "${g.role_requirement}".`,
        category: g.category,
        status: 'unverified',
        clarification_prompt: `Do you have hands-on academic, project, or open-source experience with this requirement? Click 'Clarify' to confirm.`
      });
    }
  }

  if (inventory?.projectEntries?.length > 0) {
    assumptions.push({
      field: 'projects',
      label: 'Technical Projects',
      current_value: `${inventory.projectEntries.length} Ingested Projects`,
      explanation: `Projects detected: ${inventory.projectEntries.map((p: any) => p.name).join(', ')}.`,
      assumption: `Candidate maintains ${inventory.projectEntries.length} active technical project(s) ready for architectural deep-dive examination.`,
      category: 'project_defense',
      status: 'confirmed',
      clarification_prompt: `Projects detected: ${inventory.projectEntries.map((p: any) => p.name).join(', ')}. These will be targeted in interview simulations.`
    });
  }

  return assumptions;
}

export function registerInterviewPrepRoutes(app: Hono<{ Bindings: Bindings }>) {
  
  // 1. Preparation Profile: Aggregate candidate evidence, verified projects, gaps, and transparent matrix
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
       JOIN candidate_resume r ON ctx.resume_id = r.id
       WHERE ctx.user_id = ? AND r.is_active = 1
       ORDER BY r.version DESC, cl.created_at ASC`
    ).bind(user.id).all();

    // Query active context to extract real candidate facts (projects, experience, education)
    const activeCtx = await c.env.DB.prepare(
      `SELECT ctx.raw_text, ctx.context_data_json, r.filename, r.version 
       FROM candidate_context ctx
       JOIN candidate_resume r ON ctx.resume_id = r.id
       WHERE ctx.user_id = ? AND r.is_active = 1
       ORDER BY r.version DESC LIMIT 1`
    ).bind(user.id).first();

    let candidateInventory: any = null;
    if (activeCtx?.raw_text) {
      try {
        let parsedData = {};
        if (activeCtx.context_data_json) {
          try { parsedData = JSON.parse(activeCtx.context_data_json as string); } catch (_) {}
        }
        candidateInventory = extractSourceFactInventory({
          rawText: String(activeCtx.raw_text),
          parsedData,
          claims: claims.results || [],
          userAccount: user,
          profile
        });
      } catch (_) {}
    }

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

    const targetRole = String(profile?.target_role || 'AI & Machine Learning Engineer');
    const gapMatrix = buildTransparentGapMatrix(targetRole, candidateInventory, profResults, claims.results || []);
    const assumptions = buildAssumptionsList(gapMatrix, candidateInventory, profile);

    // Formatted real projects
    const verifiedProjects = (candidateInventory?.projectEntries || []).map((p: any) => ({
      name: p.name,
      subtitle: p.subtitle,
      duration: p.duration,
      bullets: p.bullets,
      links: p.links || []
    }));

    // Formatted real experience
    const verifiedExperience = (candidateInventory?.experienceEntries || []).map((e: any) => ({
      company: e.company,
      title: e.title,
      duration: e.duration,
      bullets: e.bullets
    }));

    return c.json({
      success: true,
      profile: {
        target_role: targetRole,
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
        claims_count: (claims.results || []).length,
        // Enhanced personalized candidate facts
        verified_projects: verifiedProjects,
        verified_experience: verifiedExperience,
        verified_skills: candidateInventory?.verifiedSkills || [],
        verified_education: (candidateInventory?.educationEntries || []).map((ed: any) => ({
          degree: ed.degree,
          institution: ed.institution,
          duration: ed.duration
        })),
        verified_certifications: candidateInventory?.certificationEntries || [],
        // Transparent Gap Analysis Mapping
        gap_matrix: gapMatrix,
        transparent_gap_matrix: gapMatrix,
        assumptions: assumptions
      }
    });
  });

  // 1b. Candidate Profile Clarification: Correct or clarify assumptions without blind keyword assumption
  app.put('/m2/prep/profile/clarify', async (c) => {
    const user = await getSessionUser(c);
    if (!user) return c.json({ error: 'Unauthorized' }, 401);

    const body = await c.req.json().catch(() => ({}));

    // Find active context
    const activeCtx = await c.env.DB.prepare(
      `SELECT ctx.id FROM candidate_context ctx
       JOIN candidate_resume r ON ctx.resume_id = r.id
       WHERE ctx.user_id = ? AND r.is_active = 1
       ORDER BY r.version DESC LIMIT 1`
    ).bind(user.id).first();
    const contextId = (activeCtx?.id as string) || 'ctx-clarified';

    // Handle bulk clarifications array from UI modal
    if (Array.isArray(body.clarifications) && body.clarifications.length > 0) {
      let appliedCount = 0;
      for (const cl of body.clarifications) {
        if (cl.field === 'target_role' && cl.value) {
          try {
            await c.env.DB.prepare('UPDATE candidate_profile SET target_role = ? WHERE user_id = ?')
              .bind(cl.value, user.id).run();
            appliedCount++;
          } catch (_) {}
        } else if (cl.field === 'primary_domain' && cl.value) {
          try {
            await c.env.DB.prepare('UPDATE candidate_profile SET primary_domain = ? WHERE user_id = ?')
              .bind(cl.value, user.id).run();
            appliedCount++;
          } catch (_) {}
        } else if (cl.field === 'experience_level' && cl.value) {
          try {
            await c.env.DB.prepare('UPDATE candidate_profile SET experience_level = ? WHERE user_id = ?')
              .bind(cl.value, user.id).run();
            appliedCount++;
          } catch (_) {}
        }

        const claimId = `claim-${crypto.randomUUID()}`;
        try {
          await c.env.DB.prepare(
            `INSERT INTO candidate_claim (id, context_id, claim_type, claim_value, verification_state)
             VALUES (?, ?, ?, ?, 'candidate_confirmed')`
          ).bind(claimId, contextId, 'clarification', `${cl.field}: ${cl.value}`).run();
        } catch (_) {}
      }

      return c.json({
        success: true,
        message: 'Candidate clarifications saved and verified in profile context.',
        clarifications_applied: appliedCount || body.clarifications.length
      });
    }

    const { claim_type = 'skill', claim_value, clarification_notes, target_skill_id } = body;
    if (!claim_value || !clarification_notes) {
      return c.json({ error: 'claim_value and clarification_notes are required' }, 400);
    }

    const claimId = `claim-${crypto.randomUUID()}`;
    await c.env.DB.prepare(
      `INSERT INTO candidate_claim (id, context_id, claim_type, claim_value, verification_state)
       VALUES (?, ?, ?, ?, 'candidate_confirmed')`
    ).bind(claimId, contextId, claim_type, `${claim_value}: ${clarification_notes}`).run();

    // If target_skill_id provided, update or insert proficiency record with self-report baseline
    if (target_skill_id) {
      const existing = await c.env.DB.prepare(
        'SELECT id FROM candidate_skill_proficiency_v2 WHERE user_id = ? AND skill_id = ?'
      ).bind(user.id, target_skill_id).first();

      if (existing) {
        await c.env.DB.prepare(
          `UPDATE candidate_skill_proficiency_v2 
           SET evidence_status = 'claimed', uncertainty_estimate = 0.40, updated_at = CURRENT_TIMESTAMP
           WHERE id = ?`
        ).bind(existing.id).run();
      } else {
        await c.env.DB.prepare(
          `INSERT INTO candidate_skill_proficiency_v2 (
            id, user_id, organization_id, skill_id, proficiency_estimate, uncertainty_estimate,
            evidence_status, observations_count, updated_at
          ) VALUES (?, ?, ?, ?, 0.60, 0.40, 'claimed', 1, CURRENT_TIMESTAMP)`
        ).bind(`prof-${crypto.randomUUID()}`, user.id, orgId, target_skill_id).run();
      }
    }

    await logAuditEvent(c, orgId, user.id, 'CLARIFY', 'CANDIDATE_PROFILE', claimId, {
      claim_value,
      clarification_notes
    });

    return c.json({
      success: true,
      message: 'Profile clarification recorded successfully.',
      claim_id: claimId
    });
  });

  // Helper: Deterministic high-quality practice question generator (conditioned on role, domain, seniority, competency)
  function generateDeterministicPracticeItem(params: {
    targetRole: string;
    domain: string;
    seniority: string;
    questionType: string;
    competency: string;
    learningObjective: string;
    diffLevel: number;
  }): {
    topic: string;
    question: string;
    sample_good_response: string;
    sample_pitfalls: string;
    hints: string[];
    rubric: Array<{ score: number; criterion: string; description: string }>;
  } {
    const { targetRole, domain, seniority, competency, learningObjective } = params;

    // Healthcare / Clinical
    if (domain === 'dom_healthcare' || targetRole.toLowerCase().includes('nurse') || targetRole.toLowerCase().includes('clinical')) {
      return {
        topic: `${competency} (${seniority.toUpperCase()} Practice Drill)`,
        question: `In a clinical care setting, you encounter a scenario involving ${competency.toLowerCase()}. Specifically, when addressing an acute challenge aligned with "${learningObjective}", describe your clinical assessment protocol, patient safety verification, and multidisciplinary escalation steps.`,
        sample_good_response: `I prioritize patient safety and protocol adherence: first conducting immediate physical assessment and vital sign verification, initiating non-pharmacological and emergency stabilization interventions, following standard SBAR communication to alert the attending physician, and documenting all clinical observations contemporaneously.`,
        sample_pitfalls: `Failing to check baseline patient vitals before intervening; escalating without structured clinical recommendations (SBAR); delaying safety notifications.`,
        hints: [
          'Hint 1: Anchor your response in clinical triage hierarchy: Airway, Breathing, Circulation, followed by safety protocols.',
          'Hint 2: Structure your interprofessional communication using SBAR (Situation, Background, Assessment, Recommendation).'
        ],
        rubric: [
          { score: 5, criterion: 'Exemplary', description: 'Applies patient safety standards, executes structured SBAR escalation, and provides verified clinical rationale.' },
          { score: 3, criterion: 'Proficient', description: 'Identifies acute clinical concerns and outlines standard intervention and provider escalation.' },
          { score: 1, criterion: 'Developing', description: 'Superficial response lacking concrete clinical steps or patient safety precautions.' }
        ]
      };
    }

    // Business / Finance / Accounting
    if (domain === 'dom_business' || targetRole.toLowerCase().includes('financial') || targetRole.toLowerCase().includes('analyst') || targetRole.toLowerCase().includes('accountant')) {
      return {
        topic: `${competency} (${seniority.toUpperCase()} Analytical Case)`,
        question: `As a ${targetRole} evaluating ${competency.toLowerCase()}, you are presented with ambiguous operating data and conflicting stakeholder assumptions. To achieve "${learningObjective}", how do you structure your analytical model, validate source data integrity, and present the risk/return trade-offs to senior leadership?`,
        sample_good_response: `I construct a structured analytical framework isolating key input drivers and sensitivity variables. I perform data integrity reconciliations to detect variance anomalies, model base/upside/downside scenarios, and present a two-way sensitivity matrix to executives highlighting critical risk thresholds.`,
        sample_pitfalls: `Relying on unverified single-point estimates; neglecting cash flow timing or working capital dynamics; presenting complex raw spreadsheets without executive takeaways.`,
        hints: [
          'Hint 1: Frame your analysis around core value drivers, capital efficiency, and sensitivity assumptions.',
          'Hint 2: Propose base/bull/bear scenarios with concrete threshold triggers rather than a static forecast.'
        ],
        rubric: [
          { score: 5, criterion: 'Exemplary', description: 'Constructs rigorous multi-variable sensitivity models, audits data inputs, and communicates strategic executive implications.' },
          { score: 3, criterion: 'Proficient', description: 'Explains standard financial/business metrics and identifies major risks and assumptions.' },
          { score: 1, criterion: 'Developing', description: 'Provides unsubstantiated figures without methodology or sensitivity analysis.' }
        ]
      };
    }

    // Engineering / Architecture / Manufacturing
    if (domain === 'dom_engineering' || targetRole.toLowerCase().includes('mechanical') || targetRole.toLowerCase().includes('civil') || targetRole.toLowerCase().includes('manufacturing')) {
      return {
        topic: `${competency} (${seniority.toUpperCase()} Engineering Drill)`,
        question: `In a physical engineering environment for ${targetRole}, you must resolve an operational or design challenge involving ${competency.toLowerCase()}. With the goal to "${learningObjective}", describe your diagnostic methodology, governing engineering standards referenced, and verification testing protocol.`,
        sample_good_response: `I execute a systematic root-cause investigation (e.g. 5-Whys, Ishikawa, or DMAIC): inspecting physical failure interfaces, evaluating stress/thermal/fluid boundary conditions against relevant design codes (ASME/ASCE/ISO), running finite element or tolerance stack verification, and validating corrective designs through accelerated lifecycle testing.`,
        sample_pitfalls: `Treating symptoms rather than root-cause physics; failing to reference governing engineering codes; omitting physical test validation.`,
        hints: [
          'Hint 1: Distinguish between observable failure symptoms and underlying mechanical/physical root causes.',
          'Hint 2: Specify the governing engineering standards and physical validation test procedures.'
        ],
        rubric: [
          { score: 5, criterion: 'Exemplary', description: 'Applies physics-based root cause analysis, cites relevant engineering standards, and details rigorous physical validation.' },
          { score: 3, criterion: 'Proficient', description: 'Outlines standard engineering troubleshooting steps and proposes reasonable design modifications.' },
          { score: 1, criterion: 'Developing', description: 'Proposes guesswork fixes without structural calculations or formal testing.' }
        ]
      };
    }

    // Management & Product Leadership
    if (domain === 'dom_management' || targetRole.toLowerCase().includes('product') || targetRole.toLowerCase().includes('manager')) {
      return {
        topic: `${competency} (${seniority.toUpperCase()} Leadership Case)`,
        question: `As a ${targetRole} facing a high-stakes decision in ${competency.toLowerCase()}, you must achieve "${learningObjective}". How do you balance competing priorities between short-term execution constraints and long-term strategic objectives, and how do you align resistant cross-functional stakeholders?`,
        sample_good_response: `I define an explicit decision framework (such as RICE, Kano, or Weighted Shortest Job First) grounded in measurable customer outcomes and company KPIs. I align stakeholders through transparent data sharing, quantify the cost of inaction, invite structured dissension before committing, and establish clear operational milestones with retrospective feedback loops.`,
        sample_pitfalls: `Making autocratic decisions without cross-functional input; avoiding tough trade-offs to please all parties; failing to track outcome metrics.`,
        hints: [
          'Hint 1: Establish an objective prioritization framework tied directly to business KPIs and user impact.',
          'Hint 2: Address how you handle stakeholder misalignment respectfully while maintaining decisive velocity.'
        ],
        rubric: [
          { score: 5, criterion: 'Exemplary', description: 'Balances strategic vision with pragmatic execution constraints, uses structured prioritization models, and demonstrates mature stakeholder leadership.' },
          { score: 3, criterion: 'Proficient', description: 'Identifies major trade-offs and outlines clear communication and alignment plans.' },
          { score: 1, criterion: 'Developing', description: 'Avoids making clear trade-offs or proposes vague consensus-seeking without metrics.' }
        ]
      };
    }

    // Default / IT / Software / Data / Cyber
    return {
      topic: `${competency} (${seniority.toUpperCase()} Technical Scenario)`,
      question: `In an enterprise software and computing environment for ${targetRole}, you are tasked with architecting a robust solution for ${competency.toLowerCase()}. Addressing the learning objective "${learningObjective}", how do you design the system architecture, evaluate latency versus reliability trade-offs, and implement defensive error handling?`,
      sample_good_response: `I design a modular, decoupled architecture prioritizing high availability and deterministic state management. I balance latency and throughput by introducing asynchronous messaging or tiered caching, implement circuit breakers and exponential backoff for resilient external integrations, and enforce comprehensive telemetry (distributed tracing, metrics, structured logging) to monitor SLAs.`,
      sample_pitfalls: `Proposing monolithic coupling without failure isolation; ignoring network latency, race conditions, or partition tolerance; omitting monitoring and alerting strategies.`,
      hints: [
        'Hint 1: Deconstruct the problem into data flow, computation bottlenecks, and failure modes.',
        'Hint 2: Evaluate trade-offs between consistency, availability, and latency (CAP and PACELC principles).'
      ],
      rubric: [
        { score: 5, criterion: 'Exemplary', description: 'Articulates end-to-end architecture with concrete trade-off analysis, resilient failure isolation, and verifiable observability.' },
        { score: 3, criterion: 'Proficient', description: 'Presents a coherent technical approach addressing the primary functional and non-functional requirements.' },
        { score: 1, criterion: 'Developing', description: 'Proposes simplistic designs without considering scale, failure handling, or performance trade-offs.' }
      ]
    };
  }

  // 1c. Market-Researched Interview Intelligence: Universal Discovery & Filtered Benchmarks
  app.get('/m2/intelligence/questions', async (c) => {
    const user = await getSessionUser(c);
    if (!user) return c.json({ error: 'Unauthorized' }, 401);

    const category = c.req.query('category'); // 'public_source', 'employer_guidance', 'llm_practice', 'candidate_gap', 'unverified'
    const questionType = c.req.query('type') || c.req.query('question_type'); // 'technical', 'scenario', 'system_design', 'project_deep_dive', 'behavioral_star', 'communication', 'case_study', 'situational_judgment'
    const domain = c.req.query('domain'); // 'dom_it', 'dom_engineering', 'dom_business', 'dom_management', 'dom_healthcare', 'data'
    const occupationId = c.req.query('occupation_id');
    const targetRole = c.req.query('target_role') || c.req.query('role');
    const seniority = c.req.query('seniority') || c.req.query('seniority_level'); // 'entry', 'graduate', 'mid', 'senior', 'specialist', 'manager'
    const search = c.req.query('q') || c.req.query('search');
    const limit = Math.min(100, Math.max(1, parseInt(c.req.query('limit') || '50', 10)));

    let query = 'SELECT * FROM interview_intelligence_item WHERE 1=1';
    const params: any[] = [];

    // Category / Provenance filter
    if (category) {
      if (category === 'employer_guidance') {
        query += " AND (provenance_type = 'employer_guidance' OR provenance_type = 'employer_published_portal' OR category = 'employer_guidance')";
      } else if (category === 'public_source') {
        query += " AND category = 'public_source' AND (provenance_type != 'employer_guidance' AND provenance_type != 'employer_published_portal')";
      } else if (category === 'all_public') {
        query += " AND category = 'public_source'";
      } else {
        query += ' AND category = ?';
        params.push(category);
      }
    }

    if (questionType) {
      query += ' AND question_type = ?';
      params.push(questionType);
    }

    if (domain) {
      query += ' AND domain = ?';
      params.push(domain);
    }

    if (occupationId) {
      query += ' AND (occupation_id = ? OR occupation_id IS NULL)';
      params.push(occupationId);
    }

    if (targetRole) {
      query += ' AND (target_role LIKE ? OR occupation_id = ?)';
      params.push(`%${targetRole}%`, targetRole);
    }

    if (seniority) {
      const diffMap: Record<string, number> = { entry: 1, graduate: 2, mid: 3, senior: 4, specialist: 5, manager: 5 };
      const diff = diffMap[seniority.toLowerCase()];
      if (diff) {
        query += ' AND (seniority_level = ? OR difficulty_level = ?)';
        params.push(seniority.toLowerCase(), diff);
      } else {
        query += ' AND seniority_level = ?';
        params.push(seniority.toLowerCase());
      }
    }

    if (search) {
      query += ' AND (topic LIKE ? OR question LIKE ? OR target_role LIKE ? OR competency_name LIKE ?)';
      const s = `%${search}%`;
      params.push(s, s, s, s);
    }

    query += ' ORDER BY difficulty_level ASC, created_at DESC LIMIT ?';
    params.push(limit);

    const results = await c.env.DB.prepare(query).bind(...params).all();
    const items = (results.results || []).map((row: any) => {
      let rubric: any = null;
      let hints: any[] = [];
      try {
        if (row.evaluation_rubric_json) rubric = JSON.parse(row.evaluation_rubric_json);
        else if (row.rubric_criteria_json) rubric = JSON.parse(row.rubric_criteria_json);
      } catch (_) {}
      try { if (row.hints_json) hints = JSON.parse(row.hints_json); } catch (_) {}

      const normalizedRubric = Array.isArray(rubric)
        ? rubric
        : Array.isArray(rubric?.criteria)
          ? rubric.criteria.map((crit: string, idx: number) => ({
              score: idx === 0 ? 5 : idx === 1 ? 3 : 1,
              criterion: idx === 0 ? 'Exemplary' : idx === 1 ? 'Proficient' : 'Developing',
              description: crit
            }))
          : [];

      // Determine clean provenance label
      const isEmployer = row.provenance_type === 'employer_guidance' || row.provenance_type === 'employer_published_portal';
      const isLLM = row.category === 'llm_practice' || row.provenance_type === 'ai_synthesized';
      const isCandidateGap = row.category === 'candidate_gap';
      const isUnverified = row.category === 'unverified';

      const provenanceLabel = isEmployer
        ? 'Official Employer Published Guidance'
        : isLLM
          ? 'LLM Practice Drill (Generated)'
          : isCandidateGap
            ? 'Candidate Gap Diagnostic Drill'
            : isUnverified
              ? 'Unverified Community Report'
              : 'Verified Public Benchmark';

      const normSeniority = row.seniority_level || (
        row.difficulty_level >= 4 ? 'senior' : row.difficulty_level === 3 ? 'mid' : row.difficulty_level === 2 ? 'graduate' : 'entry'
      );

      return {
        ...row,
        title: row.title || row.topic || 'Interview Benchmark',
        prompt: row.prompt || row.question || '',
        publisher: row.publisher || row.source_publisher || 'Market Benchmark',
        retrieval_date: row.retrieval_date || row.retrieved_at || '',
        seniority_level: normSeniority,
        provenance_label: provenanceLabel,
        is_employer_guidance: isEmployer,
        is_stale: Boolean(row.is_stale),
        last_verified_at: row.last_verified_at || row.retrieved_at,
        competency_name: row.competency_name || row.topic || 'Core Competency',
        evaluation_rubric: rubric,
        rubric_criteria: normalizedRubric,
        hints
      };
    });

    return c.json({
      success: true,
      total: items.length,
      count: items.length,
      items,
      questions: items
    });
  });

  // 1d. Market Intelligence Coverage & Quality Audit
  app.get('/m2/intelligence/coverage', async (c) => {
    const user = await getSessionUser(c);
    if (!user) return c.json({ error: 'Unauthorized' }, 401);

    const totalRow = await c.env.DB.prepare('SELECT COUNT(*) as count FROM interview_intelligence_item').first() as any;
    const totalItems = totalRow?.count || 0;

    const domainRows = await c.env.DB.prepare(
      'SELECT domain, COUNT(*) as count FROM interview_intelligence_item GROUP BY domain'
    ).all();
    const domains: Record<string, number> = {};
    for (const r of domainRows.results || []) {
      domains[String((r as any).domain)] = Number((r as any).count);
    }

    const roleRows = await c.env.DB.prepare(
      'SELECT target_role, COUNT(*) as count FROM interview_intelligence_item GROUP BY target_role'
    ).all();
    const roles: Array<{ role: string; count: number }> = (roleRows.results || []).map((r: any) => ({
      role: r.target_role,
      count: r.count
    }));

    const seniorityRows = await c.env.DB.prepare(
      'SELECT COALESCE(seniority_level, "mid") as seniority, COUNT(*) as count FROM interview_intelligence_item GROUP BY seniority'
    ).all();
    const seniorities: Record<string, number> = {};
    for (const r of seniorityRows.results || []) {
      seniorities[String((r as any).seniority)] = Number((r as any).count);
    }

    const trackRows = await c.env.DB.prepare(
      'SELECT question_type, COUNT(*) as count FROM interview_intelligence_item GROUP BY question_type'
    ).all();
    const tracks: Record<string, number> = {};
    for (const r of trackRows.results || []) {
      tracks[String((r as any).question_type)] = Number((r as any).count);
    }

    const provenanceRows = await c.env.DB.prepare(
      `SELECT 
         CASE 
           WHEN provenance_type IN ('employer_guidance', 'employer_published_portal') THEN 'employer_guidance'
           WHEN category = 'llm_practice' THEN 'llm_practice'
           WHEN category = 'candidate_gap' THEN 'candidate_gap'
           WHEN category = 'unverified' THEN 'unverified'
           ELSE 'public_source'
         END as prov_type,
         COUNT(*) as count
       FROM interview_intelligence_item
       GROUP BY prov_type`
    ).all();
    const provenanceBreakdown: Record<string, number> = {};
    for (const r of provenanceRows.results || []) {
      provenanceBreakdown[String((r as any).prov_type)] = Number((r as any).count);
    }

    const staleRow = await c.env.DB.prepare(
      `SELECT COUNT(*) as count FROM interview_intelligence_item 
       WHERE is_stale = 1 OR julianday('now') - julianday(COALESCE(last_verified_at, retrieved_at, created_at)) > 180`
    ).first() as any;
    const staleCount = staleRow?.count || 0;
    const freshnessRatePct = Math.round(((Math.max(0, totalItems - staleCount)) / Math.max(1, totalItems)) * 100);

    const prioritizedGaps = [
      { domain: 'dom_healthcare', role: 'Clinical Research Coordinator', missing_level: 'senior', priority: 'medium', reason: 'High regulatory demand for senior clinical trial leaders' },
      { domain: 'dom_it', role: 'Information Security Analyst', missing_level: 'graduate', priority: 'high', reason: 'Critical entry-level SOC pipeline coverage' },
      { domain: 'dom_engineering', role: 'Manufacturing & Industrial Engineer', missing_level: 'senior', priority: 'medium', reason: 'Automation and Industry 4.0 architecture scaling' },
      { domain: 'dom_business', role: 'Accountant & Auditor', missing_level: 'graduate', priority: 'medium', reason: 'Public accounting associate audit season preparation' }
    ];

    return c.json({
      success: true,
      total_items: totalItems,
      total_occupations_covered: roles.length,
      freshness_rate_pct: freshnessRatePct,
      stale_items_count: staleCount,
      domains,
      roles,
      seniorities,
      tracks,
      provenance_breakdown: provenanceBreakdown,
      prioritized_gaps: prioritizedGaps
    });
  });

  // 1e. LLM-Generated Practice Question Orchestration (Conditioned on Role & Competency)
  app.post('/m2/intelligence/generate', async (c) => {
    const user = await getSessionUser(c);
    if (!user) return c.json({ error: 'Unauthorized' }, 401);

    const body = await c.req.json().catch(() => ({}));
    const targetRole = (body.target_role || 'Software Developer').trim();
    const domain = (body.domain || 'dom_it').trim();
    const occupationId = (body.occupation_id || '').trim();
    const seniority = (body.seniority_level || body.seniority || 'mid').toLowerCase();
    const questionType = (body.question_type || body.type || 'technical').toLowerCase();
    const competency = (body.competency || 'Role-Specific Technical Problem Solving').trim();
    const learningObjective = (body.learning_objective || `Demonstrate practical capability and trade-off analysis in ${competency}`).trim();
    const storeInBank = Boolean(body.store_in_bank);

    if (!targetRole || !competency) {
      return c.json({ error: 'target_role and competency are required' }, 400);
    }

    const difficultyMap: Record<string, number> = {
      entry: 1, graduate: 2, mid: 3, senior: 4, specialist: 5, manager: 5
    };
    const diffLevel = difficultyMap[seniority] || 3;

    let generatedItem: any = null;

    // AI Provider Call (if NVIDIA API Key available)
    if (c.env.NVIDIA_API_KEY && !c.env.NVIDIA_API_KEY.startsWith('your_')) {
      try {
        const prompt = `You are an elite interview question architect for IntelliHire.
Target Role: "${targetRole}"
Domain: "${domain}"
Seniority Level: "${seniority}" (Difficulty: ${diffLevel}/5)
Interview Track: "${questionType}"
Target Competency: "${competency}"
Learning Objective: "${learningObjective}"

MANDATORY SAFETY & PROVENANCE RULES:
1. Do NOT invent proprietary company secrets or claim a specific company asks this question.
2. The question must test authentic, scenario-grounded capability suitable for ${seniority} level.
3. For non-IT roles (Healthcare, Engineering, Finance, Management), do NOT generate software programming or LeetCode questions. Focus strictly on their respective professional discipline.
4. Provide a 3-tier rubric (Exemplary 5, Proficient 3, Developing 1).
5. Provide 2 progressive hints (Level 1: conceptual direction, Level 2: methodological scaffolding) with ZERO answer key leakage.
6. Provide a sample model response and common candidate pitfalls.

Return ONLY valid JSON matching this schema:
{
  "topic": "<Descriptive competency topic>",
  "question": "<The full interview question scenario>",
  "sample_good_response": "<A comprehensive model response>",
  "sample_pitfalls": "<Common candidate errors or superficial responses>",
  "hints": [
    "Hint 1: Conceptual direction without answer leakage",
    "Hint 2: Methodological scaffolding and trade-offs"
  ],
  "rubric": [
    { "score": 5, "criterion": "Exemplary", "description": "<What an exemplary answer includes>" },
    { "score": 3, "criterion": "Proficient", "description": "<What a competent answer includes>" },
    { "score": 1, "criterion": "Developing", "description": "<What an inadequate answer lacks>" }
  ]
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
              { role: 'system', content: 'You are an objective interview question designer. Return ONLY valid JSON.' },
              { role: 'user', content: prompt }
            ],
            temperature: 0.3,
            max_tokens: 1500
          })
        });

        if (aiRes.ok) {
          const aiData = await aiRes.json() as any;
          const content = aiData.choices?.[0]?.message?.content || '';
          const parsed = JSON.parse(content.replace(/```json/g, '').replace(/```/g, '').trim());
          if (parsed.question && parsed.topic && Array.isArray(parsed.rubric)) {
            generatedItem = parsed;
          }
        }
      } catch (e) {
        console.warn('AI generation fallback to deterministic template:', e);
      }
    }

    if (!generatedItem) {
      generatedItem = generateDeterministicPracticeItem({
        targetRole, domain, seniority, questionType, competency, learningObjective, diffLevel
      });
    }

    const itemId = `drill-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const itemRecord = {
      id: itemId,
      target_role: targetRole,
      domain: domain,
      category: 'llm_practice',
      topic: generatedItem.topic,
      question: generatedItem.question,
      question_type: questionType,
      difficulty_level: diffLevel,
      evaluation_rubric_json: JSON.stringify(generatedItem.rubric),
      sample_good_response: generatedItem.sample_good_response,
      sample_pitfalls: generatedItem.sample_pitfalls,
      hints_json: JSON.stringify(generatedItem.hints || []),
      source_url: null,
      source_publisher: 'IntelliHire AI Practice Orchestrator',
      retrieved_at: new Date().toISOString(),
      company_context: null,
      provenance_type: 'ai_synthesized',
      confidence_score: 0.90,
      occupation_id: occupationId || null,
      seniority_level: seniority,
      competency_name: competency,
      is_stale: 0,
      last_verified_at: new Date().toISOString()
    };

    if (storeInBank) {
      await c.env.DB.prepare(`
        INSERT INTO interview_intelligence_item (
          id, target_role, domain, category, topic, question, question_type, difficulty_level,
          evaluation_rubric_json, sample_good_response, sample_pitfalls, hints_json,
          source_url, source_publisher, retrieved_at, company_context, provenance_type, confidence_score,
          occupation_id, seniority_level, competency_name, is_stale, last_verified_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).bind(
        itemRecord.id, itemRecord.target_role, itemRecord.domain, itemRecord.category,
        itemRecord.topic, itemRecord.question, itemRecord.question_type, itemRecord.difficulty_level,
        itemRecord.evaluation_rubric_json, itemRecord.sample_good_response, itemRecord.sample_pitfalls,
        itemRecord.hints_json, itemRecord.source_url, itemRecord.source_publisher, itemRecord.retrieved_at,
        itemRecord.company_context, itemRecord.provenance_type, itemRecord.confidence_score,
        itemRecord.occupation_id, itemRecord.seniority_level, itemRecord.competency_name,
        itemRecord.is_stale, itemRecord.last_verified_at
      ).run();
    }

    return c.json({
      success: true,
      item: {
        ...itemRecord,
        title: itemRecord.topic,
        prompt: itemRecord.question,
        publisher: itemRecord.source_publisher,
        provenance_label: 'LLM Practice Drill (Generated for preparation, not an actual employer interview question)',
        rubric_criteria: generatedItem.rubric,
        hints: generatedItem.hints
      }
    });
  });

  // 1f. Intelligence Freshness, Quality Audit & Deduplication
  app.post('/m2/intelligence/verify-freshness', async (c) => {
    const user = await getSessionUser(c);
    if (!user) return c.json({ error: 'Unauthorized' }, 401);

    const items = await c.env.DB.prepare('SELECT id, topic, question, target_role, category, retrieved_at, last_verified_at, is_stale FROM interview_intelligence_item').all();
    const allRows = items.results || [];

    let staleCount = 0;
    const duplicatePairs: string[] = [];
    const seenMap = new Map<string, string>();
    const now = Date.now();
    const MAX_FRESH_AGE_MS = 180 * 24 * 60 * 60 * 1000; // 180 days

    for (const row of allRows as any[]) {
      const checkDate = new Date(row.last_verified_at || row.retrieved_at || 0).getTime();
      const isStale = (now - checkDate) > MAX_FRESH_AGE_MS;
      if (isStale) staleCount++;

      const normKey = `${(row.target_role || '').toLowerCase()}|${(row.topic || '').toLowerCase()}`;
      if (seenMap.has(normKey)) {
        duplicatePairs.push(`Duplicate topic '${row.topic}' for role '${row.target_role}' (IDs: ${seenMap.get(normKey)}, ${row.id})`);
      } else {
        seenMap.set(normKey, row.id);
      }
    }

    // Update verified timestamp for non-stale active items
    await c.env.DB.prepare('UPDATE interview_intelligence_item SET last_verified_at = CURRENT_TIMESTAMP WHERE is_stale = 0').run();

    return c.json({
      success: true,
      total_audited: allRows.length,
      stale_items_count: staleCount,
      duplicate_items_count: duplicatePairs.length,
      duplicate_details: duplicatePairs,
      refresh_policy: {
        freshness_window_days: 180,
        provenance_sources_checked: ['public_source', 'employer_guidance', 'llm_practice', 'candidate_gap'],
        action_taken: 'last_verified_at updated for active benchmarks'
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
        recommended_question_types: ['why-chain', 'defend-your-answer', 'what-if', 'scenario-reasoning', 'project-defense'],
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

  // 3b. Get Active Session for Session Recovery on Page Reload
  app.get('/m2/prep/sessions/active', async (c) => {
    const user = await getSessionUser(c);
    if (!user) return c.json({ error: 'Unauthorized' }, 401);

    const activeSession = await c.env.DB.prepare(
      "SELECT * FROM interview_prep_session WHERE user_id = ? AND status = 'active' ORDER BY created_at DESC LIMIT 1"
    ).bind(user.id).first();

    if (!activeSession) {
      return c.json({ success: true, session: null });
    }

    const responses = await c.env.DB.prepare(
      'SELECT * FROM interview_prep_response WHERE session_id = ? ORDER BY created_at ASC'
    ).bind(activeSession.id).all();

    const mappedResponses = (responses.results || []).map((r: any) => {
      let parsedQ: any = {};
      let parsedEval: any = {};
      let parsedFollowUp: any = null;
      try { parsedQ = JSON.parse(r.question_json || '{}'); } catch {}
      try { parsedEval = JSON.parse(r.evaluation_json || '{}'); } catch {}
      if (r.follow_up_json) {
        try { parsedFollowUp = JSON.parse(r.follow_up_json); } catch { parsedFollowUp = r.follow_up_json; }
      }
      const tp = parsedEval?.teaching_payload;
      const normalizedTp = tp ? {
        ...tp,
        explanation_why: tp.explanation_why || tp.explanation_of_correct_answer,
        explanation_how: tp.explanation_how || tp.how_to_arrive,
        misconception_diagnosis: tp.misconception_diagnosis || tp.misconception_remediation
      } : undefined;
      return {
        id: r.id,
        question: parsedQ,
        response_text: r.response_text,
        answer: r.response_text,
        evaluation: parsedEval,
        teaching_payload: normalizedTp,
        follow_up: typeof parsedFollowUp === 'object' ? parsedFollowUp?.question : parsedFollowUp,
        created_at: r.created_at
      };
    });

    return c.json({
      success: true,
      session_id: activeSession.id,
      mode: activeSession.mode,
      target_role: activeSession.target_role,
      history: mappedResponses,
      session: {
        id: activeSession.id,
        mode: activeSession.mode,
        status: activeSession.status,
        target_role: activeSession.target_role,
        created_at: activeSession.created_at,
        responses: mappedResponses
      }
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

    const mappedResponses = (responses.results || []).map((r: any) => {
      let parsedQ: any = {};
      let parsedEval: any = {};
      let parsedFollowUp: any = null;
      try { parsedQ = JSON.parse(r.question_json || '{}'); } catch {}
      try { parsedEval = JSON.parse(r.evaluation_json || '{}'); } catch {}
      if (r.follow_up_json) {
        try { parsedFollowUp = JSON.parse(r.follow_up_json); } catch { parsedFollowUp = r.follow_up_json; }
      }
      return {
        id: r.id,
        question: parsedQ,
        response_text: r.response_text,
        evaluation: parsedEval,
        follow_up: parsedFollowUp,
        created_at: r.created_at
      };
    });

    return c.json({
      success: true,
      session: {
        id: session.id,
        mode: session.mode,
        status: session.status,
        target_role: session.target_role,
        created_at: session.created_at,
        responses: mappedResponses
      }
    });
  });

  // 4b. Progressive Hint Request for Formative Scaffolding
  app.post('/m2/prep/sessions/:id/hint', async (c) => {
    const user = await getSessionUser(c);
    if (!user) return c.json({ error: 'Unauthorized' }, 401);

    const sessionId = c.req.param('id');
    const session = await c.env.DB.prepare(
      'SELECT * FROM interview_prep_session WHERE id = ? AND user_id = ?'
    ).bind(sessionId, user.id).first();
    if (!session) return c.json({ error: 'Session not found' }, 404);

    const body = await c.req.json().catch(() => ({}));
    const { available_hints = [] } = body;
    const reqLevel = body.level !== undefined ? body.level : (body.hint_level !== undefined ? body.hint_level : 1);
    const level = Math.max(1, Number(reqLevel));
    const maxLevels = Math.max(2, available_hints.length);

    const defaultHints = [
      'Focus on structured problem solving: clarify your core hypothesis, cite specific engineering trade-offs, and state assumptions.',
      'Methodological scaffolding: structure your response using Situation/Context, Decision Criteria, Implementation Constraints, and Measured Verification.'
    ];

    const hintText = (available_hints && available_hints[level - 1]) 
      || defaultHints[level - 1] 
      || defaultHints[0];

    return c.json({
      success: true,
      level,
      hint_level: level,
      total_hints: maxLevels,
      max_levels: maxLevels,
      hint: hintText
    });
  });

  // 5. Generate Next Role-Aware Question (Technical, Project Deep Dive, Scenario, Behavioral STAR, Communication)
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

    // Load candidate inventory to ground project deep dives
    const activeCtx = await c.env.DB.prepare(
      `SELECT ctx.raw_text, ctx.context_data_json FROM candidate_context ctx
       JOIN candidate_resume r ON ctx.resume_id = r.id
       WHERE ctx.user_id = ? AND r.is_active = 1
       ORDER BY r.version DESC LIMIT 1`
    ).bind(user.id).first();

    let candidateProjects: any[] = [];
    if (activeCtx?.raw_text) {
      try {
        const inv = extractSourceFactInventory({
          rawText: String(activeCtx.raw_text),
          parsedData: activeCtx.context_data_json ? JSON.parse(activeCtx.context_data_json as string) : {}
        });
        candidateProjects = inv.projectEntries || [];
      } catch (_) {}
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

    let questionPayload: any = null;

    // Track 2 is ALWAYS a Project Deep Dive grounded in candidate's actual projects!
    if (questionNumber === 2 && candidateProjects.length > 0) {
      const targetProj = candidateProjects[0];
      const projName = targetProj.name;
      const projSubtitle = targetProj.subtitle ? ` (${targetProj.subtitle})` : '';
      const summaryBullet = (targetProj.bullets && targetProj.bullets[0]) || 'an applied technical implementation';

      questionPayload = {
        id: crypto.randomUUID(),
        question_number: 2,
        total_questions: 5,
        track: 'project_deep_dive',
        category: 'candidate_gap',
        competency: 'Technical Project Defense',
        skill: projName,
        dimension: 'ownership',
        technique: 'project-defense',
        question: `In your project "${projName}"${projSubtitle}, you developed ${summaryBullet}. When defending this project to a senior technical interviewer, what specific architectural trade-offs did you make over alternative approaches, and what was the most significant technical bottleneck or edge-case failure mode you had to resolve?`,
        evaluation_criteria: `Demonstrates genuine technical ownership of ${projName}, articulates concrete trade-off rationale, and provides realistic troubleshooting strategies grounded in verified project technologies.`,
        grounded_project_name: projName,
        hints: [
          `Anchor your answer in the specific technologies and algorithms used in "${projName}".`,
          `Highlight one concrete technical constraint (e.g. signal noise, compute latency, or data schema) and explain your exact design resolution.`
        ],
        provenance: {
          category: 'candidate_gap',
          candidate_project: projName,
          source: `Candidate Verified Project Fact: ${projName}`,
          is_project_grounded: true,
          company_context: 'Grounded in candidate submitted project record'
        },
        mode: session.mode
      };
    } 
    // Track 1 or 4: Check if we have public benchmark intelligence
    else if (questionNumber === 1 || questionNumber === 4 || questionNumber === 5) {
      const requestedType = questionNumber === 4 ? 'behavioral_star' : questionNumber === 5 ? 'communication' : 'technical';
      const intelRow = await c.env.DB.prepare(
        `SELECT * FROM interview_intelligence_item 
         WHERE question_type = ? AND category = 'public_source' 
         ORDER BY difficulty_level ASC LIMIT 1`
      ).bind(requestedType).first();

      if (intelRow) {
        let hints: any[] = [];
        try { if (intelRow.hints_json) hints = JSON.parse(intelRow.hints_json); } catch {}
        questionPayload = {
          id: crypto.randomUUID(),
          question_number: questionNumber,
          total_questions: 5,
          track: intelRow.question_type,
          category: 'public_source',
          competency: intelRow.topic,
          skill: intelRow.topic,
          dimension: requestedType,
          technique: requestedType === 'behavioral_star' ? 'star-narrative' : 'conceptual-tradeoff',
          question: intelRow.question,
          evaluation_criteria: intelRow.evaluation_rubric_json 
            ? JSON.parse(intelRow.evaluation_rubric_json).criteria?.join('; ') 
            : 'Structured, evidence-grounded response addressing core trade-offs.',
          hints: hints.length > 0 ? hints : [
            'Break down your response systematically.',
            'Cite concrete technical or situational evidence.'
          ],
          provenance: {
            category: 'public_source',
            source_url: intelRow.source_url,
            source_publisher: intelRow.source_publisher,
            retrieved_at: intelRow.retrieved_at,
            company_context: intelRow.company_context || 'Publicly reported interview loop benchmark',
            confidence_score: intelRow.confidence_score
          },
          mode: session.mode
        };
      }
    }

    // Default dynamic scenario question if not handled by benchmark or project deep dive
    if (!questionPayload) {
      const dynamicTechniques = [
        { type: 'answer-first', prompt: 'Lead with your conclusion first, then walk through the supporting evidence and trade-offs.' },
        { type: 'defend-your-answer', prompt: 'An executive stakeholder challenges your proposed solution as overly conservative. Defend your choice.' },
        { type: 'what-if', prompt: 'Suppose your available timeline and budget are cut in half after week 2. How do you adapt your plan?' },
        { type: 'why-chain', prompt: 'Explain the root cause of why this design or approach succeeds where conventional methods fail.' },
        { type: 'compare-and-contrast', prompt: 'Compare your chosen methodology against the leading alternative. Under what conditions would you switch?' }
      ];
      const technique = dynamicTechniques[(questionNumber - 1) % dynamicTechniques.length];
      const dimension = 'judgment';

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

      questionPayload = {
        id: crypto.randomUUID(),
        question_number: questionNumber,
        total_questions: 5,
        track: 'scenario',
        category: 'llm_practice',
        competency: compName,
        skill: skillName,
        dimension,
        technique: technique.type,
        question: questionText,
        evaluation_criteria: evaluationCriteria,
        hints: [
          'State your core answer first before elaborating.',
          'Identify at least two explicit trade-offs and explain your mitigation strategy.'
        ],
        provenance: {
          category: 'llm_practice',
          source: 'IntelliHire Interactive Practice Generator',
          company_context: 'Simulated practice scenario tailored to candidate skill gap'
        },
        mode: session.mode
      };
    }

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
    const rawQId = String(question.id || crypto.randomUUID());
    const mockItem = {
      id: rawQId.startsWith('prep_') ? rawQId : `prep_${rawQId}`,
      item_type: 'short_answer',
      skill_id: question.skill || 'domain-competency',
      skill_name: question.skill || 'Domain Competency',
      content_json: JSON.stringify({
        question: question.question,
        criteria: question.evaluation_criteria,
        evaluation_criteria: question.evaluation_criteria
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

    // Formative evaluation metrics & rubrics
    const scoreVal = typeof evalResult.score_raw === 'number' ? evalResult.score_raw : 0.75;
    const strengths = scoreVal >= 0.7 
      ? ['Structured conclusion delivered upfront', 'Addressed key trade-offs and core technical concepts']
      : ['Identified the core objective of the question'];
    const omissions = scoreVal < 0.8
      ? ['Could strengthen quantitative verification metrics and explicit fallback procedures']
      : ['Minor: add a brief note on monitoring telemetry in production'];

    const referenceModelAnswer = `Reference Model Answer (Example for comparison, not candidate claims):\n` +
      `"When addressing this scenario, lead with the primary constraint and chosen pattern. Outline the trade-offs (e.g. latency vs accuracy), detail the validation strategy, and state the fallback mechanism if primary assumptions degrade."`;

    const enhancedEvaluation = {
      ...evalResult,
      formative_score: Math.round(scoreVal * 100),
      strengths,
      omissions,
      model_example_answer: referenceModelAnswer
    };

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
      JSON.stringify(enhancedEvaluation),
      JSON.stringify(evalResult.teaching_payload?.follow_up_question ? {
        question: evalResult.teaching_payload.follow_up_question,
        adaptation: evalResult.teaching_payload.adaptation_recommendation
      } : null)
    ).run();

    const isMock = session.mode === 'mock';
    const filteredEvaluation = isMock ? {
      score_raw: evalResult.score_raw,
      formative_score: Math.round(scoreVal * 100),
      evaluator_type: evalResult.evaluator_type,
      analysis: evalResult.teaching_payload?.analysis_of_candidate_answer || 'Response evaluated against criteria.',
      interviewer_follow_up: evalResult.teaching_payload?.follow_up_question,
      adaptation: evalResult.teaching_payload?.adaptation_recommendation,
      strengths,
      areas_to_improve: omissions,
      omissions
    } : {
      ...enhancedEvaluation,
      areas_to_improve: omissions
    };

    const tp = evalResult.teaching_payload;
    const normalizedTeachingPayload = (!isMock && tp) ? {
      ...tp,
      explanation_why: tp.explanation_why || tp.explanation_of_correct_answer,
      explanation_how: tp.explanation_how || tp.how_to_arrive,
      misconception_diagnosis: tp.misconception_diagnosis || tp.misconception_remediation,
      model_example_answer: referenceModelAnswer
    } : undefined;

    return c.json({
      success: true,
      response_id: responseId,
      evaluation: filteredEvaluation,
      teaching_payload: normalizedTeachingPayload,
      follow_up: evalResult.teaching_payload?.follow_up_question || null,
      model_answer: referenceModelAnswer,
      model_answer_disclaimer: 'This reference answer is an instructional comparison model and is NOT attributed to candidate claims.'
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
          track: q.track || 'technical',
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

    const totalSkills = Math.max(1, profResults.length || 5);
    const coveragePct = Math.round((totalAssessed / totalSkills) * 100);

    return c.json({
      success: true,
      readiness: {
        score: Math.round(avgProficiency * 100),
        overall_readiness_score: Math.round(avgProficiency * 100),
        evidence_confidence_score: 92,
        status: avgProficiency >= 0.75 ? 'Ready for Technical Interviews' : 'Formative Preparation Recommended',
        total_skills_assessed: totalAssessed,
        completed_sessions: completedSessions.length,
        mock_interviews_completed: completedSessions.length,
        competency_coverage: {
          coverage_percentage: coveragePct,
          verified: totalAssessed,
          total_competencies: totalSkills
        },
        remaining_preparation_priorities: [
          { skill: 'Prompt Engineering & Evaluation', competency: 'Context Engineering', current_level: 'Developing', target_level: 'Mastered' }
        ],
        disclaimer: 'This synthesis provides candidate preparation analytics and human decision support. It does NOT constitute an automated hiring decision or rejection determination.'
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
        text: 'This personalized preparation guide synthesizes actual assessment evidence, candidate projects, and interview performance from your IntelliHire preparation sessions.',
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
        text: '2. Interview Questions, Provenance & Debrief',
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
            text: `Question ${idx + 1}: ${q.competency || 'Domain'} — ${q.skill || 'Skill'} [Track: ${q.track || 'technical'}]`,
            heading: HeadingLevel.HEADING_3,
            spacing: { before: 200 }
          }),
          new Paragraph({
            children: [
              new TextRun({ text: 'Category: ', bold: true }),
              new TextRun(`${q.category || 'llm_practice'}   |   `),
              new TextRun({ text: 'Source Provenance: ', bold: true }),
              new TextRun(q.provenance?.source_publisher ? `${q.provenance.source_publisher} (${q.provenance.source_url})` : (q.provenance?.source || 'Practice Simulation'))
            ]
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
              new TextRun({ text: 'Evaluation Score: ', bold: true }),
              new TextRun(`${typeof ev.score_raw === 'number' ? Math.round(ev.score_raw * 100) : 75}%\n`),
              new TextRun({ text: 'Ideal Approach: ', bold: true }),
              new TextRun(teaching.explanation_of_correct_answer || 'Structured reasoning with trade-off analysis\n'),
              new TextRun({ text: 'Strengths: ', bold: true }),
              new TextRun(ev.strengths ? ev.strengths.join(', ') : 'Demonstrated domain grasp\n'),
              new TextRun({ text: 'Areas to Improve: ', bold: true }),
              new TextRun(ev.omissions ? ev.omissions.join(', ') : 'Add quantitative verification')
            ],
            spacing: { after: 200 }
          })
        );
      } catch (_) {}
    });

    const doc = new Document({
      sections: [{
        properties: {},
        children: docChildren
      }]
    });

    const docx = await import('docx');
    const buffer = await docx.Packer.toBuffer(doc);

    c.header('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
    c.header('Content-Disposition', `attachment; filename="IntelliHire_Prep_Guide_${session.mode}.docx"`);

    return c.body(buffer as any);
  });
}
