// functions/api/m2PersonalizedIntelligence.test.ts
// Comprehensive Functional Test Suite for M02 Personalized Learning, Training & Interview Intelligence

import { describe, it, expect, vi } from 'vitest';
import { app } from './[[route]]';

vi.mock('hono/jwt', () => ({
  sign: vi.fn(),
  verify: vi.fn().mockImplementation(async (token) => {
    if (token === 'candidate-token-m2') {
      return { id: 'candidate-m2-test', role: 'candidate', full_name: 'Mokshith G', organization_id: 'org-1' };
    }
    return null;
  })
}));

const sampleResumeText = `
Mokshith G
mokshith@example.com | +91 9876543210
GitHub: https://github.com/mokshithg | LinkedIn: https://linkedin.com/in/mokshithg

EXPERIENCE
InAmigos Foundation
Prompt Engineer Intern | May 2024 - July 2024
- Engineered structured prompt templates and context evaluation harnesses.
- Evaluated model responses across diverse LLM tasks.

PROJECTS
Human-Detection | https://github.com/mokshithg/Human-Detection
- Automated PIR sensor and camera tracking system using Python, OpenCV, and Arduino.
- Filtered false positive motion triggers through sensor fusion.

AI-IDS-ES | https://github.com/mokshithg/AI-IDS-ES
- Built Network Intrusion Detection System using machine learning algorithms on packet traces.
- Optimized precision and recall under extreme class imbalance.

IntelliHire-v3 | https://github.com/mokshithg/IntelliHire-v3
- Architected end-to-end edge-native talent evaluation platform using Cloudflare Workers and D1.

SKILLS
Machine Learning: Scikit-Learn, PyTorch, Artificial Neural Networks (ANN), Computer Vision (OpenCV)
AI & Prompting: Prompt Engineering, Context Architecture, RAG, LLM Evaluation
Languages & Tools: Python, TypeScript, React, SQL, Arduino, Git
`;

const createMockEnv = (customData: any = {}) => {
  const memoryClaims: any[] = [];
  const memoryResponses: any[] = [];
  const memoryProficiencies: any[] = [
    { skill_id: 'skill-prompt', skill_name: 'Prompt Engineering', competency_name: 'Generative AI', proficiency_estimate: 0.82, uncertainty_estimate: 0.15, evidence_status: 'assessed' },
    { skill_id: 'skill-ann', skill_name: 'Artificial Neural Networks (ANN)', competency_name: 'Neural Modeling', proficiency_estimate: 0.45, uncertainty_estimate: 0.55, evidence_status: 'assessed' }
  ];

  return {
    DB: {
      prepare: (query: string) => ({
        bind: (...args: any[]) => ({
          first: vi.fn().mockImplementation(async () => {
            if (query.includes('candidate_profile') || query.includes('user_account u LEFT JOIN candidate_profile p')) {
              return {
                id: 'profile-m2',
                user_id: 'candidate-m2-test',
                target_role: customData.target_role || 'AI & Machine Learning Engineer',
                primary_domain: customData.primary_domain || 'data',
                experience_level: customData.experience_level || 'entry',
                readiness_score: 0.74,
                claims_count: 5
              };
            }
            if (query.includes('user_account') && query.includes('organization_id')) {
              return { organization_id: 'org-1' };
            }
            if (query.includes('COUNT(*) as cnt') || query.includes('candidate_claim cl')) {
              return { cnt: 4 };
            }
            if (query.includes('candidate_resume')) {
              return {
                id: 'resume-v22',
                raw_text: sampleResumeText,
                context_data_json: JSON.stringify({
                  projects: [
                    { name: 'Human-Detection', repoUrl: 'https://github.com/mokshithg/Human-Detection', tech: 'Python, OpenCV, PIR Sensor', description: 'Automated PIR sensor and camera tracking system.' },
                    { name: 'AI-IDS-ES', repoUrl: 'https://github.com/mokshithg/AI-IDS-ES', tech: 'Python, Scikit-Learn', description: 'Network Intrusion Detection System with anomaly scoring.' },
                    { name: 'IntelliHire-v3', repoUrl: 'https://github.com/mokshithg/IntelliHire-v3', tech: 'TypeScript, Cloudflare Workers, D1', description: 'Edge-native candidate assessment engine.' }
                  ],
                  experience: [
                    { title: 'Prompt Engineer Intern', company: 'InAmigos Foundation', dates: 'May 2024 - July 2024' }
                  ],
                  skills: [
                    { category: 'Machine Learning', items: ['ANN', 'OpenCV', 'PyTorch'] },
                    { category: 'AI & Prompting', items: ['Prompt Engineering', 'RAG'] }
                  ]
                })
              };
            }
            if (query.includes('interview_prep_session') && query.includes('SELECT')) {
              return {
                id: 'session-m2-test',
                user_id: 'candidate-m2-test',
                organization_id: 'org-1',
                mode: customData.mode || 'mock',
                status: 'active',
                target_role: customData.target_role || 'AI & Machine Learning Engineer'
              };
            }
            if (query.includes('curriculum_module') && query.includes('SELECT m.*')) {
              return {
                id: args[0] || 'mod-test-1',
                pathway_id: 'pathway-m2-test',
                sequence_order: 1,
                competency_name: 'Generative AI & LLM Systems',
                skill_name: 'Prompt Engineering & Context Architecture',
                title: 'Foundation: Context Engineering & Evaluation Harnesses',
                pathway_user_id: 'candidate-m2-test',
                organization_id: 'org-1'
              };
            }
            if (query.includes('learning_pathway p') && query.includes('WHERE p.id = ?')) {
              return {
                id: args[0] || 'pathway-m2-test',
                user_id: 'candidate-m2-test',
                learner_name: 'Mokshith G',
                title: 'Applied AI/ML Systems Pathway',
                target_role: 'AI & Machine Learning Engineer',
                domain: 'data',
                overall_progress: 0.25,
                mastery_score: 0.0
              };
            }
            if (query.includes('COUNT(*) as total')) {
              return { total: 4, completed: 1, mastered: 1 };
            }
            return null;
          }),
          run: vi.fn().mockImplementation(async () => {
            if (query.includes('INSERT INTO candidate_claim')) {
              memoryClaims.push({ args });
            }
            if (query.includes('INSERT INTO interview_prep_response')) {
              memoryResponses.push({ id: args[0], session_id: args[1], question_json: args[2], response_text: args[3] });
            }
            return { success: true };
          }),
          all: vi.fn().mockImplementation(async () => {
            if (query.includes('interview_prep_response')) {
              return { results: memoryResponses };
            }
            if (query.includes('candidate_skill_proficiency_v2')) {
              return { results: memoryProficiencies };
            }
            if (query.includes('candidate_claim')) {
              return {
                results: [
                  { claim_type: 'skill', claim_value: 'Prompt Engineering', verification_status: 'verified' },
                  { claim_type: 'project', claim_value: 'Human-Detection', verification_status: 'verified' },
                  { claim_type: 'project', claim_value: 'AI-IDS-ES', verification_status: 'verified' }
                ]
              };
            }
            if (query.includes('interview_intelligence_item')) {
              const items = [
                {
                  id: 'intel-aiml-01',
                  target_role: 'AI & Machine Learning Engineer',
                  domain: 'data',
                  track: 'core_technical',
                  category: 'public_source',
                  question_type: 'scenario',
                  difficulty: 'advanced',
                  title: 'Low-Latency LLM Serving & KV Cache Memory Management',
                  prompt: 'How does KV caching reduce generative decode latency, and what are its memory implications?',
                  rubric_criteria_json: JSON.stringify([{ score: 5, criterion: 'Exemplary', description: 'Explains attention KV storage' }]),
                  hints_json: JSON.stringify(['Consider the attention computation during next-token generation.']),
                  source_url: 'https://huggingface.co/docs/transformers/main/en/kv_cache',
                  publisher: 'Hugging Face Transformers Documentation',
                  retrieval_date: '2026-03-15',
                  company_context: 'Production Generative AI'
                },
                {
                  id: 'intel-aiml-02',
                  target_role: 'AI & Machine Learning Engineer',
                  domain: 'data',
                  track: 'project_deep_dive',
                  category: 'candidate_gap',
                  question_type: 'deep_dive',
                  difficulty: 'advanced',
                  title: 'Project Architecture & False-Positive Sensor Filtering',
                  prompt: 'In your Human-Detection project, how did you calibrate sensor latency?',
                  rubric_criteria_json: JSON.stringify([{ score: 5, criterion: 'Exemplary', description: 'Details sensor synchronization' }]),
                  hints_json: JSON.stringify(['Consider temporal hysteresis and sensor polling rates.']),
                  source_url: 'https://github.com/mokshithg/Human-Detection',
                  publisher: 'Candidate Project Portfolio',
                  retrieval_date: '2026-03-15',
                  company_context: 'Edge Vision'
                }
              ];
              if (args.length > 0 && typeof args[0] === 'string' && args[0] !== 'all') {
                return { results: items.filter(i => i.category === args[0]) };
              }
              return { results: items };
            }
            if (query.includes('curriculum_module WHERE pathway_id = ?')) {
              return {
                results: [
                  {
                    id: 'mod-1',
                    pathway_id: 'pathway-m2-test',
                    sequence_order: 1,
                    competency_name: 'Generative AI & LLM Systems',
                    skill_name: 'Prompt Engineering & Context Architecture',
                    title: 'Foundation: Context Engineering & Evaluation Harnesses',
                    description: 'Structured context formatting, prompt optimization, and deterministic LLM evaluation.',
                    target_capability: 'Can design high-precision prompt templates without hallucination.',
                    current_capability: 'Candidate possesses practical prompt engineering experience.',
                    evidence_gap_summary: 'Derived from candidate prompt engineering background.',
                    prerequisite_module_ids_json: '[]',
                    status: 'available',
                    mastery_status: 'unassessed',
                    revision_due_at: '2026-10-16T12:00:00.000Z'
                  }
                ]
              };
            }
            if (query.includes('learning_unit WHERE module_id IN')) {
              return {
                results: [
                  {
                    id: 'unit-1',
                    module_id: 'mod-1',
                    unit_order: 1,
                    unit_type: 'micro_concept',
                    title: 'Role Context: Structured Output Schema & Token Optimization',
                    content_markdown: 'Content on prompt engineering...',
                    interactive_exercise_json: null,
                    completion_status: 'completed',
                    demonstrated_score: 1.0
                  }
                ]
              };
            }
            return { results: [] };
          })
        })
      })
    },
    SESSION_KV: {
      get: vi.fn().mockImplementation(async (id: string) => {
        if (id === 'session:candidate-token-m2') return 'candidate-token-m2';
        return null;
      }),
      put: vi.fn().mockResolvedValue(true)
    }
  };
};

describe('M02: Personalized Learning, Training & Interview Intelligence', () => {

  it('1. GET /api/m2/prep/profile returns Transparent Gap Matrix and Candidate Verified Projects', async () => {
    const env = createMockEnv();
    const req = new Request('http://localhost/api/m2/prep/profile', {
      method: 'GET',
      headers: { 'Cookie': 'intellihire_session=candidate-token-m2' }
    });

    const res = await app.request(req, {}, env as any);
    expect(res.status).toBe(200);

    const data = await res.json() as any;
    expect(data.success).toBe(true);
    expect(data.profile).toBeDefined();

    // Verify Transparent Gap Matrix
    const matrix = data.profile.transparent_gap_matrix;
    expect(Array.isArray(matrix)).toBe(true);
    expect(matrix.length).toBeGreaterThan(0);

    const firstGap = matrix[0];
    expect(firstGap.role_requirement).toBeDefined();
    expect(firstGap.candidate_evidence).toBeDefined();
    expect(['demonstrated', 'partial_evidence', 'gap_unverified', 'outdated']).toContain(firstGap.confidence_status);
    expect(firstGap.learning_objective).toBeDefined();
    expect(firstGap.assessment_method).toBeDefined();

    // Verify Verified Projects Grounding
    const projects = data.profile.verified_projects;
    expect(Array.isArray(projects)).toBe(true);
    expect(projects.some((p: any) => p.name === 'Human-Detection')).toBe(true);
    expect(projects.some((p: any) => p.name === 'AI-IDS-ES')).toBe(true);

    // Verify Assumptions
    const assumptions = data.profile.assumptions;
    expect(Array.isArray(assumptions)).toBe(true);
    expect(assumptions.some((a: any) => a.field === 'target_role')).toBe(true);
  });

  it('2. PUT /api/m2/prep/profile/clarify confirms candidate assumptions and updates profile context', async () => {
    const env = createMockEnv();
    const req = new Request('http://localhost/api/m2/prep/profile/clarify', {
      method: 'PUT',
      headers: {
        'Cookie': 'intellihire_session=candidate-token-m2',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        clarifications: [
          { field: 'target_role', value: 'AI & Machine Learning Engineer', action: 'confirmed' },
          { field: 'primary_domain', value: 'data', action: 'confirmed' }
        ]
      })
    });

    const res = await app.request(req, {}, env as any);
    expect(res.status).toBe(200);

    const data = await res.json() as any;
    expect(data.success).toBe(true);
    expect(data.clarifications_applied).toBe(2);
    expect(data.message).toContain('clarifications saved');
  });

  it('3. GET /api/m2/intelligence/questions discovers market-researched benchmarks with provenance', async () => {
    const env = createMockEnv();
    const req = new Request('http://localhost/api/m2/intelligence/questions?category=public_source', {
      method: 'GET',
      headers: { 'Cookie': 'intellihire_session=candidate-token-m2' }
    });

    const res = await app.request(req, {}, env as any);
    expect(res.status).toBe(200);

    const data = await res.json() as any;
    expect(data.success).toBe(true);
    expect(Array.isArray(data.questions)).toBe(true);
    expect(data.questions.length).toBeGreaterThan(0);

    const q = data.questions[0];
    expect(q.category).toBe('public_source');
    expect(q.source_url).toContain('huggingface.co');
    expect(q.publisher).toContain('Hugging Face');
    expect(q.retrieval_date).toBeDefined();
    expect(Array.isArray(q.rubric_criteria)).toBe(true);
  });

  it('4. POST /api/m2/prep/sessions/:id/question grounds Question 2 in Candidate Projects', async () => {
    const env = createMockEnv();

    // Start session
    const startReq = new Request('http://localhost/api/m2/prep/sessions', {
      method: 'POST',
      headers: {
        'Cookie': 'intellihire_session=candidate-token-m2',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ mode: 'mock', target_role: 'AI & Machine Learning Engineer' })
    });
    const startRes = await app.request(startReq, {}, env as any);
    const startData = await startRes.json() as any;
    expect(startData.success).toBe(true);
    const sid = startData.session_id;

    // Fetch Question 1 (Public Benchmark)
    const q1Req = new Request(`http://localhost/api/m2/prep/sessions/${sid}/question`, {
      method: 'POST',
      headers: { 'Cookie': 'intellihire_session=candidate-token-m2' }
    });
    const q1Res = await app.request(q1Req, {}, env as any);
    const q1Data = await q1Res.json() as any;
    expect(q1Data.success).toBe(true);
    expect(q1Data.question.question_number).toBe(1);

    // Answer Question 1
    const ans1Req = new Request(`http://localhost/api/m2/prep/sessions/${sid}/respond`, {
      method: 'POST',
      headers: {
        'Cookie': 'intellihire_session=candidate-token-m2',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        question: q1Data.question,
        response_text: 'KV caching stores key and value tensors of prior tokens to avoid quadratic recomputation during autoregressive generation.'
      })
    });
    const ans1Res = await app.request(ans1Req, {}, env as any);
    expect(ans1Res.status).toBe(200);

    // Fetch Question 2 (Candidate Project Deep Dive)
    const q2Req = new Request(`http://localhost/api/m2/prep/sessions/${sid}/question`, {
      method: 'POST',
      headers: { 'Cookie': 'intellihire_session=candidate-token-m2' }
    });
    const q2Res = await app.request(q2Req, {}, env as any);
    const q2Data = await q2Res.json() as any;
    expect(q2Data.success).toBe(true);
    expect(q2Data.question.question_number).toBe(2);
    expect(q2Data.question.track).toBe('project_deep_dive');
    expect(q2Data.question.provenance.candidate_project).toBeDefined();
    expect(q2Data.question.question).toContain(q2Data.question.provenance.candidate_project);
  });

  it('5. POST /api/m2/prep/sessions/:id/hint provides progressive scaffolding without answer key leakage', async () => {
    const env = createMockEnv();
    const req = new Request('http://localhost/api/m2/prep/sessions/session-m2-test/hint', {
      method: 'POST',
      headers: {
        'Cookie': 'intellihire_session=candidate-token-m2',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        question_id: 'q-ann-diagnostic',
        level: 1
      })
    });

    const res = await app.request(req, {}, env as any);
    expect(res.status).toBe(200);

    const data = await res.json() as any;
    expect(data.success).toBe(true);
    expect(data.level).toBe(1);
    expect(data.hint).toBeDefined();
    expect(data.max_levels).toBe(2);

    // Verify hint does NOT leak full solution or label itself as correct answer
    expect(data.hint.toLowerCase()).not.toContain('correct answer:');
    expect(data.hint.toLowerCase()).not.toContain('solution:');
  });

  it('6. POST /api/m2/prep/sessions/:id/respond includes labeled reference model answer and formative feedback', async () => {
    const env = createMockEnv();
    const req = new Request('http://localhost/api/m2/prep/sessions/session-m2-test/respond', {
      method: 'POST',
      headers: {
        'Cookie': 'intellihire_session=candidate-token-m2',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        question: {
          id: 'q-prompt-eval',
          question: 'How do you design an automated evaluation harness for generative AI outputs?',
          competency: 'Generative AI',
          skill: 'Prompt Engineering'
        },
        response_text: 'I create golden benchmark evaluation datasets with rubrics, measure semantic similarity using embeddings, and validate strict JSON schema conformance.'
      })
    });

    const res = await app.request(req, {}, env as any);
    expect(res.status).toBe(200);

    const data = await res.json() as any;
    expect(data.success).toBe(true);
    expect(data.evaluation).toBeDefined();
    expect(data.evaluation.strengths).toBeDefined();
    expect(data.evaluation.areas_to_improve).toBeDefined();
    expect(data.model_answer).toBeDefined();
    expect(data.model_answer_disclaimer).toContain('instructional comparison model');
  });

  it('7. POST /api/training/generate compiles role-specific pathway with candidate project grounding and spaced revision', async () => {
    const env = createMockEnv({ target_role: 'AI & Machine Learning Engineer' });
    const req = new Request('http://localhost/api/training/generate', {
      method: 'POST',
      headers: {
        'Cookie': 'intellihire_session=candidate-token-m2',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ target_role: 'AI & Machine Learning Engineer' })
    });

    const res = await app.request(req, {}, env as any);
    expect(res.status).toBe(200);

    const data = await res.json() as any;
    expect(data.success).toBe(true);
    expect(data.title).toContain('Applied AI/ML Systems');
    expect(data.target_role).toBe('AI & Machine Learning Engineer');
    expect(data.modules_generated).toBe(3);
    expect(data.evidence_sources.some((s: string) => s.includes('Candidate Projects Grounding'))).toBe(true);
  });

  it('8. POST /api/training/module/:id/reassess evaluates synthesis, sets spaced revision, and updates Bayesian proficiency', async () => {
    const env = createMockEnv();
    const req = new Request('http://localhost/api/training/module/mod-1/reassess', {
      method: 'POST',
      headers: {
        'Cookie': 'intellihire_session=candidate-token-m2',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        demonstration_notes: 'Synthesized context boundaries, XML tag isolation, and token latency budgets to prevent prompt injection and hallucination.'
      })
    });

    const res = await app.request(req, {}, env as any);
    expect(res.status).toBe(200);

    const data = await res.json() as any;
    expect(data.success).toBe(true);
    expect(data.is_mastered).toBe(true);
    expect(data.mastery_status).toBe('mastered');
    expect(data.demonstrated_score).toBeGreaterThanOrEqual(75);
    expect(data.evidence_persisted).toBe(true);
    expect(data.revision_due_at).toBeDefined();
  });
});
