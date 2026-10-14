import { describe, it, expect, vi } from 'vitest';
import { app } from './[[route]]';

vi.mock('hono/jwt', () => ({
  sign: vi.fn(),
  verify: vi.fn().mockImplementation(async (token) => {
    if (token === 'recruiter-token') {
      return { id: 'recruiter-1', role: 'recruiter', organization_id: 'org-test' };
    }
    if (token === 'nurse-token') {
      return { id: 'cand-nurse', role: 'candidate', organization_id: 'org-test' };
    }
    if (token === 'engineer-token') {
      return { id: 'cand-engineer', role: 'candidate', organization_id: 'org-test' };
    }
    if (token === 'candidate-token') {
      return { id: 'cand-1', role: 'candidate', organization_id: 'org-test' };
    }
    return null;
  })
}));

const createMockEnv = () => {
  const mockDbData: Record<string, any> = {
    user_account: [
      { id: 'cand-1', full_name: 'Elena Rostova', email: 'elena@example.com', role: 'candidate', organization_id: 'org-test' },
      { id: 'cand-nurse', full_name: 'Sarah Jenkins', email: 'sarah.nurse@hospital.org', role: 'candidate', organization_id: 'org-test' },
      { id: 'cand-engineer', full_name: 'David Chen', email: 'dchen@precision-eng.com', role: 'candidate', organization_id: 'org-test' },
      { id: 'recruiter-1', full_name: 'Senior Clinical Educator', email: 'educator@hospital.org', role: 'recruiter', organization_id: 'org-test' }
    ],
    candidate_profile: [
      { user_id: 'cand-1', target_role: 'Senior Distributed Architect', primary_domain: 'software', experience_level: 'senior' },
      { user_id: 'cand-nurse', target_role: 'Registered Nurse & Clinical Specialist', primary_domain: 'healthcare_admin', experience_level: 'senior' },
      { user_id: 'cand-engineer', target_role: 'Mechanical & Manufacturing Engineer', primary_domain: 'operations', experience_level: 'senior' }
    ],
    candidate_resume: [
      { id: 'res-cand-1', user_id: 'cand-1', is_active: 1, created_at: '2026-10-01T00:00:00Z' }
    ],
    candidate_context: [
      {
        resume_id: 'res-cand-1',
        raw_text: 'Built high-throughput Raft consensus cluster processing 50k transactions/sec with Redis and Kafka.',
        context_data_json: JSON.stringify({
          projects: [
            { name: 'ConsensusMesh', description: 'Raft-based multi-region state replication pipeline', tech: 'Rust, Raft, RocksDB' }
          ]
        })
      }
    ],
    skill: [
      { id: 'skill-1', name: 'Raft & State Machine Replication' },
      { id: 'skill-2', name: 'SBAR Escalation & Rapid Response' },
      { id: 'skill-3', name: 'FEA Stress Singularities & Convergence' }
    ],
    learning_pathway: [
      {
        id: 'pathway-1',
        organization_id: 'org-test',
        user_id: 'cand-1',
        title: 'Distributed Resiliency & Consensus Remediation Pathway',
        target_role: 'Senior Distributed Architect',
        domain: 'software',
        occupation_code: '15-1252.00',
        pathway_type: 'skill_gap_remediation',
        status: 'active',
        overall_progress: 0.25,
        mastery_score: 0.0,
        evidence_sources_json: JSON.stringify(['M01 Project: ConsensusMesh', 'M02 Misconception']),
        created_at: '2026-10-06T00:00:00Z',
        updated_at: '2026-10-06T00:00:00Z'
      }
    ],
    curriculum_module: [
      {
        id: 'mod-1',
        pathway_id: 'pathway-1',
        sequence_order: 1,
        competency_name: 'Consensus Protocols',
        skill_name: 'Raft & State Machine Replication',
        title: 'Foundation: Consensus State Machines',
        description: 'Core state replication under network partition.',
        target_capability: 'Can design partitioned leader election algorithms.',
        current_capability: 'Confused async saga with 2PC.',
        evidence_gap_summary: 'Diagnosed from M02 Adaptive Misconception.',
        prerequisite_module_ids_json: '[]',
        status: 'available',
        mastery_status: 'unassessed',
        revision_due_at: '2026-10-01T00:00:00Z' // Due now / overdue
      },
      {
        id: 'mod-2',
        pathway_id: 'pathway-1',
        sequence_order: 2,
        competency_name: 'System Fault Tolerance',
        skill_name: 'Chaos Engineering',
        title: 'Applied: Chaos Mitigation & Ledger Reconciliation',
        description: 'Isolating contaminated accounts during crises.',
        target_capability: 'Leads non-destructive ledger reconciliation.',
        current_capability: 'Hesitated during M04 probe.',
        evidence_gap_summary: 'Diagnosed from M04 Panel Interview.',
        prerequisite_module_ids_json: '["mod-1"]',
        status: 'locked',
        mastery_status: 'unassessed',
        revision_due_at: null
      }
    ],
    learning_unit: [
      {
        id: 'unit-1',
        module_id: 'mod-1',
        unit_order: 1,
        unit_type: 'micro_concept',
        title: 'Anatomy of Distributed Quorums',
        content_markdown: 'Quorum = floor(N / 2) + 1',
        interactive_exercise_json: null,
        provenance_json: JSON.stringify({ authoritative: true }),
        completion_status: 'completed',
        demonstrated_score: 1.0,
        completed_at: '2026-10-06T00:00:00Z'
      },
      {
        id: 'unit-2',
        module_id: 'mod-1',
        unit_order: 2,
        unit_type: 'guided_exercise',
        title: 'Practice: Resolving Leader Heartbeat Partitions',
        content_markdown: 'Evaluate cluster partition event.',
        interactive_exercise_json: JSON.stringify({
          question: 'What happens to client writes routed to isolated leader N1?',
          options: ['Merges writes upon recovery', 'Writes remain uncommitted and time out', 'Halts cluster'],
          correct_index: 1,
          explanation_why: 'Raft requires majority quorum acknowledgment.',
          explanation_how: 'N1 cannot achieve quorum so writes time out.',
          misconception_warning: 'Do not assume leader writes succeed in isolated partition without quorum.'
        }),
        provenance_json: JSON.stringify({ authoritative: true }),
        completion_status: 'not_started',
        demonstrated_score: null,
        completed_at: null
      },
      {
        id: 'unit-3',
        module_id: 'mod-1',
        unit_order: 3,
        unit_type: 'reassessment_gate',
        title: 'Reassessment Checkpoint Gate: Consensus Partition',
        content_markdown: 'Server-validated mastery evaluation.',
        interactive_exercise_json: null,
        provenance_json: JSON.stringify({ authoritative: true }),
        completion_status: 'not_started',
        demonstrated_score: null,
        completed_at: null
      }
    ],
    curriculum_reassessment_attempt: [],
    learning_progress_record: [],
    candidate_skill_proficiency_v2: [],
    readiness_evidence_ledger: []
  };

  return {
    mockDbData,
    DB: {
      prepare: (query: string) => ({
        bind: (...args: any[]) => ({
          first: vi.fn().mockImplementation(async () => {
            if (query.includes('FROM learning_pathway') && query.includes('p.id = ?')) {
              const p = mockDbData.learning_pathway.find((item: any) => item.id === args[0]);
              if (!p) return null;
              const u = mockDbData.user_account.find((item: any) => item.id === p.user_id);
              return { ...p, learner_name: u?.full_name, learner_email: u?.email };
            }
            if (query.includes('FROM learning_unit u') && query.includes('WHERE u.id = ?')) {
              const u = mockDbData.learning_unit.find((item: any) => item.id === args[0]);
              if (!u) return null;
              const m = mockDbData.curriculum_module.find((item: any) => item.id === u.module_id);
              return { ...u, pathway_id: m?.pathway_id, module_id: m?.id };
            }
            if (query.includes('FROM curriculum_module m') && query.includes('WHERE m.id = ?')) {
              const m = mockDbData.curriculum_module.find((item: any) => item.id === args[0]);
              if (!m) return null;
              const p = mockDbData.learning_pathway.find((item: any) => item.id === m.pathway_id);
              return { 
                ...m, 
                organization_id: p?.organization_id, 
                pathway_user_id: p?.user_id,
                domain: p?.domain,
                target_role: p?.target_role
              };
            }
            if (query.includes('FROM user_account') && query.includes('WHERE u.id = ?')) {
              const u = mockDbData.user_account.find((item: any) => item.id === args[0]);
              if (!u) return null;
              const prof = mockDbData.candidate_profile.find((item: any) => item.user_id === args[0]);
              return { ...u, target_role: prof?.target_role, primary_domain: prof?.primary_domain, experience_level: prof?.experience_level };
            }
            if (query.includes('FROM candidate_resume r') && query.includes('WHERE r.user_id = ?')) {
              const r = mockDbData.candidate_resume.find((item: any) => item.user_id === args[0]);
              if (!r) return null;
              const ctx = mockDbData.candidate_context.find((item: any) => item.resume_id === r.id);
              return { ...r, raw_text: ctx?.raw_text, context_data_json: ctx?.context_data_json };
            }
            if (query.includes('FROM curriculum_reassessment_attempt') && query.includes('COUNT(*)')) {
              const count = mockDbData.curriculum_reassessment_attempt.filter((a: any) => a.module_id === args[0] && a.user_id === args[1]).length;
              return { cnt: count };
            }
            if (query.includes('FROM skill WHERE LOWER(name) LIKE')) {
              const s = mockDbData.skill.find((item: any) => item.name.toLowerCase().includes(String(args[0]).replace(/%/g, '').toLowerCase()));
              return s || { id: 'skill-1', name: 'Raft' };
            }
            if (query.includes('SELECT id FROM skill WHERE 1 = ?')) {
              return mockDbData.skill[0] || { id: 'skill-1', name: 'Fallback' };
            }
            if (query.includes('AVG(proficiency_estimate)')) {
              return { avg_prof: 0.88 };
            }
            if (query.includes('COUNT(*) as total, SUM(CASE WHEN mastery_status')) {
              const mods = mockDbData.curriculum_module.filter((m: any) => m.pathway_id === args[0]);
              const total = mods.length;
              const mastered = mods.filter((m: any) => m.mastery_status === 'mastered').length;
              return { total, mastered };
            }
            return null;
          }),
          all: vi.fn().mockImplementation(async () => {
            if (query.includes('FROM learning_pathway')) {
              return { results: mockDbData.learning_pathway };
            }
            if (query.includes('FROM curriculum_module m') && query.includes('JOIN learning_pathway p')) {
              return {
                results: mockDbData.curriculum_module.map((m: any) => {
                  const p = mockDbData.learning_pathway.find((item: any) => item.id === m.pathway_id);
                  return { ...m, pathway_id: p?.id, pathway_title: p?.title };
                })
              };
            }
            if (query.includes('FROM curriculum_module')) {
              return { results: mockDbData.curriculum_module.filter((m: any) => m.pathway_id === args[0]) };
            }
            if (query.includes('FROM learning_unit')) {
              return { results: mockDbData.learning_unit.filter((u: any) => u.module_id === args[0]) };
            }
            if (query.includes('FROM curriculum_reassessment_attempt')) {
              return {
                results: mockDbData.curriculum_reassessment_attempt.filter((a: any) => a.module_id === args[0] && a.user_id === args[1])
              };
            }
            return { results: [] };
          }),
          run: vi.fn().mockImplementation(async () => {
            if (query.includes('INSERT INTO learning_pathway')) {
              mockDbData.learning_pathway.push({
                id: args[0],
                organization_id: args[1],
                user_id: args[2],
                title: args[3],
                target_role: args[4],
                domain: args[5],
                pathway_type: args[7],
                evidence_sources_json: args[9]
              });
            }
            if (query.includes('INSERT INTO curriculum_reassessment_attempt')) {
              mockDbData.curriculum_reassessment_attempt.push({
                id: args[0],
                module_id: args[1],
                user_id: args[2],
                challenge_prompt: args[3],
                solution_text: args[4],
                evaluation_score: args[5],
                is_mastered: args[6],
                criteria_scores_json: args[7],
                feedback_json: args[8],
                created_at: new Date().toISOString()
              });
            }
            if (query.includes('UPDATE curriculum_module') && query.includes('mastery_status = ?')) {
              const m = mockDbData.curriculum_module.find((item: any) => item.id === args[3]);
              if (m) {
                m.mastery_status = args[0];
                m.status = args[1];
                m.revision_due_at = args[2];
              }
            }
            if (query.includes('UPDATE curriculum_module') && query.includes("status = 'available'")) {
              const m = mockDbData.curriculum_module.find((item: any) => item.pathway_id === args[0] && item.sequence_order === args[1]);
              if (m) m.status = 'available';
            }
            if (query.includes('UPDATE curriculum_module SET revision_due_at = ?')) {
              const m = mockDbData.curriculum_module.find((item: any) => item.id === args[1]);
              if (m) m.revision_due_at = args[0];
            }
            if (query.includes('INSERT INTO candidate_skill_proficiency_v2')) {
              mockDbData.candidate_skill_proficiency_v2.push({
                user_id: args[1],
                skill_id: args[2],
                proficiency_estimate: args[3],
                uncertainty_estimate: args[4]
              });
            }
            if (query.includes('INSERT INTO readiness_evidence_ledger')) {
              mockDbData.readiness_evidence_ledger.push({
                id: args[0],
                candidate_user_id: args[1],
                organization_id: args[2],
                competency_name: args[4],
                skill_name: args[5],
                observed_fact: args[6]
              });
            }
            return { success: true };
          })
        })
      })
    },
    SESSION_KV: {
      get: vi.fn().mockImplementation(async (id: string) => {
        if (id === 'session:recruiter-token') return mockDbData.user_account[3];
        if (id === 'session:candidate-token') return mockDbData.user_account[0];
        if (id === 'session:nurse-token') return mockDbData.user_account[1];
        if (id === 'session:engineer-token') return mockDbData.user_account[2];
        return null;
      })
    }
  };
};

describe('IntelliHire M02 Phase 2: Personalized Teaching & Adaptive Mastery Tests', () => {

  it('1. Compiles domain-calibrated pathway for Healthcare (Registered Nurse & Clinical Specialist)', async () => {
    const env = createMockEnv();
    const req = new Request('http://localhost/api/training/generate', {
      method: 'POST',
      headers: { 
        Cookie: 'intellihire_session=nurse-token',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        target_role: 'Registered Nurse & Clinical Specialist',
        domain: 'healthcare_admin'
      })
    });

    const res = await app.request(req, {}, env as any);
    expect(res.status).toBe(200);

    const data = await res.json() as any;
    expect(data.success).toBe(true);
    expect(data.target_role).toBe('Registered Nurse & Clinical Specialist');
    expect(data.domain).toBe('healthcare_admin');
    expect(data.modules_created).toBeGreaterThanOrEqual(2);
  });

  it('2. Compiles domain-calibrated pathway for Engineering (Mechanical & Manufacturing Engineer)', async () => {
    const env = createMockEnv();
    const req = new Request('http://localhost/api/training/generate', {
      method: 'POST',
      headers: { 
        Cookie: 'intellihire_session=engineer-token',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        target_role: 'Mechanical & Manufacturing Engineer',
        domain: 'operations'
      })
    });

    const res = await app.request(req, {}, env as any);
    expect(res.status).toBe(200);

    const data = await res.json() as any;
    expect(data.success).toBe(true);
    expect(data.target_role).toBe('Mechanical & Manufacturing Engineer');
    expect(data.domain).toBe('operations');
  });

  it('3. Grounds learning objectives in candidate M01 resume projects and evidence', async () => {
    const env = createMockEnv();
    const req = new Request('http://localhost/api/training/generate', {
      method: 'POST',
      headers: { 
        Cookie: 'intellihire_session=candidate-token',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({})
    });

    const res = await app.request(req, {}, env as any);
    expect(res.status).toBe(200);

    const data = await res.json() as any;
    expect(data.success).toBe(true);
    // Verified that candidate projects from resume are captured in evidence sources
    const hasProjectEvidence = data.evidence_sources.some((src: string) => src.includes('Project Context: ConsensusMesh'));
    expect(hasProjectEvidence).toBe(true);
  });

  it('4. Provides progressive guiding hints on exercises without answer key leakage', async () => {
    const env = createMockEnv();
    const req = new Request('http://localhost/api/training/unit/unit-2/submit-exercise', {
      method: 'POST',
      headers: { 
        Cookie: 'intellihire_session=candidate-token',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ request_hint: true })
    });

    const res = await app.request(req, {}, env as any);
    expect(res.status).toBe(200);

    const data = await res.json() as any;
    expect(data.success).toBe(true);
    expect(data.hint).toBeDefined();
    expect(data.hint).toContain('Guiding Hint');
    // Ensure answer key index is NEVER leaked in the hint payload
    expect(data.correct_index).toBeUndefined();
    expect(data.explanation_why).toBeUndefined();
  });

  it('5. Generates dynamic reassessment prompt with 4 weighted criteria dimensions and no answer keys', async () => {
    const env = createMockEnv();
    const req = new Request('http://localhost/api/training/module/mod-1/reassessment-prompt', {
      headers: { Cookie: 'intellihire_session=candidate-token' }
    });

    const res = await app.request(req, {}, env as any);
    expect(res.status).toBe(200);

    const data = await res.json() as any;
    expect(data.success).toBe(true);
    expect(data.challenge_scenario).toBeDefined();
    expect(data.specific_prompt).toBeDefined();
    expect(data.passing_threshold_pct).toBe(75);
    expect(data.criteria_dimensions.length).toBe(4);
    
    // Verify criteria weights sum to 1.0 (Accuracy 35%, Reasoning 30%, Trade-offs 20%, Evidence 15%)
    const totalWeight = data.criteria_dimensions.reduce((sum: number, c: any) => sum + c.weight, 0);
    expect(Math.round(totalWeight * 100)).toBe(100);
  });

  it('6. Rejects short/trivial reassessment responses (<10 characters)', async () => {
    const env = createMockEnv();
    const req = new Request('http://localhost/api/training/module/mod-1/reassess', {
      method: 'POST',
      headers: { 
        Cookie: 'intellihire_session=candidate-token',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        solution_text: 'too short'
      })
    });

    const res = await app.request(req, {}, env as any);
    expect(res.status).toBe(400);

    const data = await res.json() as any;
    expect(data.error).toContain('at least 10 characters');
  });

  it('7. Handles reassessment failure: caps score, sets revision due to +1d, recommends remediation units', async () => {
    const env = createMockEnv();
    const req = new Request('http://localhost/api/training/module/mod-1/reassess', {
      method: 'POST',
      headers: { 
        Cookie: 'intellihire_session=candidate-token',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        solution_text: "I failed to understand the partition handling protocol and cannot solve this without more guidance.",
        approach_rationale: "Unsure how leader election functions."
      })
    });

    const res = await app.request(req, {}, env as any);
    expect(res.status).toBe(200);

    const data = await res.json() as any;
    expect(data.success).toBe(true);
    expect(data.is_mastered).toBe(false);
    expect(data.mastery_status).toBe('needs_practice');
    expect(data.demonstrated_score).toBeLessThan(75);
    expect(data.next_module_unlocked).toBe(false);
    expect(data.remediation_recommendations.length).toBeGreaterThan(0);
    expect(data.remediation_recommendations[0]).toContain('Revisit Unit 2');
  });

  it('8. Validates server-side mastery: unlocks next module, sets revision due to +14d, logs to readiness ledger', async () => {
    const env = createMockEnv();
    const solutionText = `
      To resolve the consensus split-brain under network partition, we enforce Raft majority quorum rules.
      First, isolated leader N1 cannot reach a quorum (requires floor(5/2) + 1 = 3 nodes) and will reject or time out client writes.
      Second, Region 2 with 3 nodes elects a new term leader following standard heartbeats.
      Third, we analyze trade-offs: client availability is prioritized with transactional outbox and read-your-own-writes session tokens versus strict CAP consistency.
      Finally, we verify state alignment via Prometheus telemetry monitoring replication lag and commit index convergence across all active nodes.
    `;

    const req = new Request('http://localhost/api/training/module/mod-1/reassess', {
      method: 'POST',
      headers: { 
        Cookie: 'intellihire_session=candidate-token',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        solution_text: solutionText,
        approach_rationale: "Optimizes for partition fault tolerance while preventing state divergence across replicas."
      })
    });

    const res = await app.request(req, {}, env as any);
    expect(res.status).toBe(200);

    const data = await res.json() as any;
    expect(data.success).toBe(true);
    expect(data.is_mastered).toBe(true);
    expect(data.mastery_status).toBe('mastered');
    expect(data.demonstrated_score).toBeGreaterThanOrEqual(75);
    expect(data.next_module_unlocked).toBe(true);
    expect(data.evidence_persisted).toBe(true);
    expect(data.strengths.length).toBeGreaterThan(0);

    // Verify next module (mod-2) was unlocked in mock DB
    const mod2 = env.mockDbData.curriculum_module.find((m: any) => m.id === 'mod-2');
    expect(mod2.status).toBe('available');

    // Verify entry was written to readiness_evidence_ledger
    expect(env.mockDbData.readiness_evidence_ledger.length).toBeGreaterThan(0);
    const ledgerEntry = env.mockDbData.readiness_evidence_ledger[0];
    expect(ledgerEntry.candidate_user_id).toBe('cand-1');
    expect(ledgerEntry.competency_name).toBe('Consensus Protocols');
  });

  it('9. Retrieves historical reassessment attempts for module auditability', async () => {
    const env = createMockEnv();
    const req = new Request('http://localhost/api/training/module/mod-1/reassessment-history', {
      headers: { Cookie: 'intellihire_session=candidate-token' }
    });

    const res = await app.request(req, {}, env as any);
    expect(res.status).toBe(200);

    const data = await res.json() as any;
    expect(data.success).toBe(true);
    expect(data.module_id).toBe('mod-1');
    expect(Array.isArray(data.attempts)).toBe(true);
  });

  it('10. Groups spaced retention modules and advances interval via complete-revision', async () => {
    const env = createMockEnv();
    
    // Test GET /spaced-revision
    const getReq = new Request('http://localhost/api/training/spaced-revision', {
      headers: { Cookie: 'intellihire_session=candidate-token' }
    });

    const getRes = await app.request(getReq, {}, env as any);
    expect(getRes.status).toBe(200);

    const getData = await getRes.json() as any;
    expect(getData.success).toBe(true);
    expect(getData.due_now.length).toBeGreaterThanOrEqual(1);
    expect(getData.due_now[0].module_id).toBe('mod-1');

    // Test POST /complete-revision
    const postReq = new Request('http://localhost/api/training/module/mod-1/complete-revision', {
      method: 'POST',
      headers: { Cookie: 'intellihire_session=candidate-token' }
    });

    const postRes = await app.request(postReq, {}, env as any);
    expect(postRes.status).toBe(200);

    const postData = await postRes.json() as any;
    expect(postData.success).toBe(true);
    expect(postData.message).toContain('Next spaced revision scheduled in 21 days');

    // Verify module revision_due_at was updated to future date
    const mod1 = env.mockDbData.curriculum_module.find((m: any) => m.id === 'mod-1');
    expect(new Date(mod1.revision_due_at).getTime()).toBeGreaterThan(Date.now());
  });

});
