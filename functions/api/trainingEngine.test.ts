import { describe, it, expect, vi } from 'vitest';
import { app } from './[[route]]';

vi.mock('hono/jwt', () => ({
  sign: vi.fn(),
  verify: vi.fn().mockImplementation(async (token) => {
    if (token === 'recruiter-token') {
      return { id: 'recruiter-1', role: 'recruiter', organization_id: 'org-test' };
    }
    if (token === 'candidate-token') {
      return { id: 'cand-1', role: 'candidate', organization_id: 'org-test' };
    }
    if (token === 'other-candidate-token') {
      return { id: 'cand-2', role: 'candidate', organization_id: 'org-test' };
    }
    return null;
  })
}));

const createMockEnv = () => {
  const mockDbData: Record<string, any> = {
    user_account: [
      { id: 'cand-1', full_name: 'Elena Rostova', email: 'elena@example.com', role: 'candidate', organization_id: 'org-test' },
      { id: 'cand-2', full_name: 'Marcus Vance', email: 'marcus@example.com', role: 'candidate', organization_id: 'org-test' },
      { id: 'recruiter-1', full_name: 'Senior Trainer', email: 'trainer@enterprise.com', role: 'recruiter', organization_id: 'org-test' }
    ],
    candidate_profile: [
      { user_id: 'cand-1', target_role: 'Senior Distributed Architect', primary_domain: 'software', experience_level: 'senior' },
      { user_id: 'cand-2', target_role: 'Director of FP&A', primary_domain: 'finance', experience_level: 'lead' }
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
        evidence_sources_json: JSON.stringify(['M02 Misconception: 2PC vs saga', 'M03 Simulation']),
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
        mastery_status: 'unassessed'
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
        current_capability: 'Hesitated during M04 CFO crisis probe.',
        evidence_gap_summary: 'Diagnosed from M04 Panel Interview.',
        prerequisite_module_ids_json: '["mod-1"]',
        status: 'locked',
        mastery_status: 'unassessed'
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
        completion_status: 'not_started',
        demonstrated_score: null,
        completed_at: null
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
          misconception_warning: 'Do not assume leader writes succeed in isolated partition.'
        }),
        provenance_json: JSON.stringify({ authoritative: true }),
        completion_status: 'not_started',
        demonstrated_score: null,
        completed_at: null
      }
    ],
    learning_progress_record: [],
    candidate_skill_proficiency_v2: [],
    readiness_evidence_ledger: []
  };

  return {
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
              return { ...m, organization_id: p?.organization_id, pathway_user_id: p?.user_id };
            }
            if (query.includes('FROM user_account') && query.includes('WHERE u.id = ?')) {
              const u = mockDbData.user_account.find((item: any) => item.id === args[0]);
              if (!u) return null;
              const prof = mockDbData.candidate_profile.find((item: any) => item.user_id === args[0]);
              return { ...u, target_role: prof?.target_role, primary_domain: prof?.primary_domain, experience_level: prof?.experience_level };
            }
            if (query.includes('COUNT(*) as total')) {
              return { total: 4, completed: 2, mastered: 1 };
            }
            if (query.includes('AVG(overall_progress)')) {
              return { total_pathways: 10, avg_progress: 0.68, avg_mastery: 0.62, completed_pathways: 3 };
            }
            return null;
          }),
          all: vi.fn().mockImplementation(async () => {
            if (query.includes('FROM learning_pathway')) {
              return {
                results: mockDbData.learning_pathway.map((p: any) => ({
                  ...p,
                  learner_name: 'Elena Rostova',
                  total_modules: 2,
                  mastered_modules: 0
                }))
              };
            }
            if (query.includes('FROM curriculum_module')) {
              return { results: mockDbData.curriculum_module.filter((m: any) => m.pathway_id === args[0]) };
            }
            if (query.includes('FROM learning_unit')) {
              return { results: mockDbData.learning_unit };
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
                pathway_type: args[7]
              });
            }
            if (query.includes('UPDATE learning_unit')) {
              const u = mockDbData.learning_unit.find((item: any) => item.id === args[args.length - 1]);
              if (u) {
                u.completion_status = args[0];
                if (args.length > 2) u.demonstrated_score = args[0];
              }
            }
            if (query.includes('UPDATE curriculum_module') && query.includes('mastery_status = ?')) {
              const m = mockDbData.curriculum_module.find((item: any) => item.id === args[2]);
              if (m) {
                m.mastery_status = args[0];
                m.status = args[1];
              }
            }
            if (query.includes('UPDATE curriculum_module') && query.includes("status = 'available'")) {
              const m = mockDbData.curriculum_module.find((item: any) => item.sequence_order === args[1]);
              if (m) m.status = 'available';
            }
            if (query.includes('INSERT INTO candidate_skill_proficiency_v2')) {
              mockDbData.candidate_skill_proficiency_v2.push({ user_id: args[1], skill_id: args[2], proficiency: args[3] });
            }
            if (query.includes('INSERT INTO readiness_evidence_ledger')) {
              mockDbData.readiness_evidence_ledger.push({ id: args[0], candidate_id: args[1], competency: args[4] });
            }
            return { success: true };
          })
        })
      })
    },
    SESSION_KV: {
      get: vi.fn().mockImplementation(async (id: string) => {
        if (id === 'session:recruiter-token') return mockDbData.user_account[2];
        if (id === 'session:candidate-token') return mockDbData.user_account[0];
        if (id === 'session:other-candidate-token') return mockDbData.user_account[1];
        return null;
      })
    }
  };
};

describe('Priority 18: Training Curriculum & Learning Pathway Engine APIs', () => {

  it('1. GET /api/training/pathways lists learning pathways for learner', async () => {
    const env = createMockEnv();
    const req = new Request('http://localhost/api/training/pathways', {
      headers: { Cookie: 'intellihire_session=candidate-token' }
    });

    const res = await app.request(req, {}, env as any);
    expect(res.status).toBe(200);

    const data = await res.json() as any;
    expect(data.success).toBe(true);
    expect(data.pathways.length).toBeGreaterThanOrEqual(1);
    expect(data.pathways[0].title).toContain('Distributed Resiliency');
    expect(data.pathways[0].total_modules).toBe(2);
  });

  it('2. GET /api/training/pathway/:id retrieves complete hierarchy with modules and units', async () => {
    const env = createMockEnv();
    const req = new Request('http://localhost/api/training/pathway/pathway-1', {
      headers: { Cookie: 'intellihire_session=candidate-token' }
    });

    const res = await app.request(req, {}, env as any);
    expect(res.status).toBe(200);

    const data = await res.json() as any;
    expect(data.success).toBe(true);
    expect(data.pathway.title).toBeDefined();
    expect(data.pathway.modules.length).toBe(2);
    expect(data.pathway.modules[0].status).toBe('available');
    expect(data.pathway.modules[1].status).toBe('locked');
    expect(data.pathway.modules[0].units.length).toBeGreaterThanOrEqual(2);
  });

  it('3. Candidate RBAC isolation: candidate cannot access another candidate learning pathway', async () => {
    const env = createMockEnv();
    const req = new Request('http://localhost/api/training/pathway/pathway-1', {
      headers: { Cookie: 'intellihire_session=other-candidate-token' }
    });

    const res = await app.request(req, {}, env as any);
    expect(res.status).toBe(403);
    const data = await res.json() as any;
    expect(data.error).toContain('Forbidden');
  });

  it('4. POST /api/training/generate compiles evidence-driven pathway based on M01-M05 signals', async () => {
    const env = createMockEnv();
    const req = new Request('http://localhost/api/training/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: 'intellihire_session=candidate-token'
      },
      body: JSON.stringify({ user_id: 'cand-1' })
    });

    const res = await app.request(req, {}, env as any);
    expect(res.status).toBe(200);

    const data = await res.json() as any;
    expect(data.success).toBe(true);
    expect(data.pathway_id).toBeDefined();
    expect(data.title).toContain('Distributed Resiliency');
    expect(data.evidence_sources.length).toBeGreaterThan(0);
  });

  it('5. POST /api/training/unit/:id/progress marks unit completed (Completion != Mastery)', async () => {
    const env = createMockEnv();
    const req = new Request('http://localhost/api/training/unit/unit-1/progress', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: 'intellihire_session=candidate-token'
      },
      body: JSON.stringify({ status: 'completed' })
    });

    const res = await app.request(req, {}, env as any);
    expect(res.status).toBe(200);

    const data = await res.json() as any;
    expect(data.success).toBe(true);
    expect(data.status).toBe('completed');
    expect(data.overall_progress).toBeDefined();
  });

  it('6. POST /api/training/unit/:id/submit-exercise evaluates interactive exercise and provides Why/How explanations', async () => {
    const env = createMockEnv();
    const req = new Request('http://localhost/api/training/unit/unit-2/submit-exercise', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: 'intellihire_session=candidate-token'
      },
      body: JSON.stringify({ selected_index: 1 })
    });

    const res = await app.request(req, {}, env as any);
    expect(res.status).toBe(200);

    const data = await res.json() as any;
    expect(data.success).toBe(true);
    expect(data.is_correct).toBe(true);
    expect(data.score).toBe(100);
    expect(data.explanation_why).toContain('Raft requires majority quorum');
    expect(data.explanation_how).toBeDefined();
  });

  it('7. POST /api/training/module/:id/reassess verifies mastery checkpoint and updates Bayesian proficiency & M05 ledger', async () => {
    const env = createMockEnv();
    const req = new Request('http://localhost/api/training/module/mod-1/reassess', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: 'intellihire_session=candidate-token'
      },
      body: JSON.stringify({
        demonstrated_score: 0.90,
        demonstration_notes: 'Successfully recovered quorum without transaction loss in sandbox.'
      })
    });

    const res = await app.request(req, {}, env as any);
    expect(res.status).toBe(200);

    const data = await res.json() as any;
    expect(data.success).toBe(true);
    expect(data.is_mastered).toBe(true);
    expect(data.mastery_status).toBe('mastered');
    expect(data.evidence_persisted).toBe(true);
  });

  it('8. Failing reassessment gate does not upgrade mastery or unlock next module', async () => {
    const env = createMockEnv();
    const req = new Request('http://localhost/api/training/module/mod-1/reassess', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: 'intellihire_session=candidate-token'
      },
      body: JSON.stringify({
        demonstrated_score: 0.60,
        demonstration_notes: 'Failed to preserve linearizability during split-brain test.'
      })
    });

    const res = await app.request(req, {}, env as any);
    expect(res.status).toBe(200);

    const data = await res.json() as any;
    expect(data.success).toBe(true);
    expect(data.is_mastered).toBe(false);
    expect(data.mastery_status).toBe('needs_practice');
  });

  it('9. GET /api/training/cohort/analytics provides cohort metrics and top diagnosed gaps for trainers', async () => {
    const env = createMockEnv();
    const req = new Request('http://localhost/api/training/cohort/analytics', {
      headers: { Cookie: 'intellihire_session=recruiter-token' }
    });

    const res = await app.request(req, {}, env as any);
    expect(res.status).toBe(200);

    const data = await res.json() as any;
    expect(data.success).toBe(true);
    expect(data.cohort_metrics.total_learners_enrolled).toBeGreaterThanOrEqual(1);
    expect(data.cohort_metrics.top_diagnosed_gaps.length).toBeGreaterThanOrEqual(3);
  });

});
