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
      { id: 'recruiter-1', full_name: 'Hiring Lead', email: 'lead@enterprise.com', role: 'recruiter', organization_id: 'org-test' }
    ],
    candidate_profile: [
      { user_id: 'cand-1', target_role: 'Senior Distributed Architect', primary_domain: 'software', experience_level: 'senior', readiness_score: 0.88 }
    ],
    readiness_evidence_ledger: [
      {
        id: 'leg-1',
        candidate_user_id: 'cand-1',
        organization_id: 'org-test',
        source_module: 'm03_simulation',
        source_record_id: 'sim-eval-1',
        competency_name: 'Fault Tolerant Consensus',
        skill_name: 'Raft State Machine',
        evidence_type: 'work_artifact',
        observed_fact: 'Executed split-brain recovery without transaction loss.',
        model_interpretation: 'Exceptional resilience handling.',
        confidence_score: 0.92,
        uncertainty_score: 0.08,
        provenance_json: JSON.stringify({ source: 'simulation' }),
        human_review_status: 'unreviewed',
        reviewed_by_user_id: null,
        created_at: '2026-10-06T00:00:00Z'
      }
    ],
    readiness_profile: [
      {
        id: 'rp-1',
        candidate_user_id: 'cand-1',
        organization_id: 'org-test',
        target_role: 'Senior Distributed Architect',
        domain: 'software',
        seniority_level: 'senior',
        overall_readiness_index: 0.89,
        readiness_composition_json: JSON.stringify({ competency_coverage: 90, evidence_strength: 92 }),
        uncertainty_index: 0.11,
        evidence_triangulation_json: JSON.stringify({ 'Consensus': { status: 'CONVERGENT' } }),
        strengths_json: JSON.stringify(['Distributed ledger recovery']),
        gaps_json: JSON.stringify(['Liquidity models']),
        actionable_remediation_json: JSON.stringify([{ gap: 'Liquidity models', action_type: 'M03 Simulation' }]),
        last_synthesized_at: '2026-10-06T00:00:00Z'
      }
    ],
    decision_review_record: [],
    governance_audit_event: []
  };

  return {
    DB: {
      prepare: (query: string) => ({
        bind: (...args: any[]) => ({
          first: vi.fn().mockImplementation(async () => {
            if (query.includes('FROM user_account') && query.includes('u.id = ?')) {
              return mockDbData.user_account.find((u: any) => u.id === args[0]) || null;
            }
            if (query.includes('FROM candidate_profile') && query.includes('user_id = ?')) {
              return mockDbData.candidate_profile.find((p: any) => p.user_id === args[0]) || null;
            }
            if (query.includes('FROM readiness_profile') && query.includes('candidate_user_id = ?')) {
              return mockDbData.readiness_profile.find((rp: any) => rp.candidate_user_id === args[0]) || null;
            }
            return null;
          }),
          all: vi.fn().mockImplementation(async () => {
            if (query.includes('FROM user_account u') && query.includes("role = 'candidate'")) {
              return { results: mockDbData.user_account.filter((u: any) => u.role === 'candidate') };
            }
            if (query.includes('FROM readiness_evidence_ledger')) {
              return { results: mockDbData.readiness_evidence_ledger.filter((l: any) => l.candidate_user_id === args[0]) };
            }
            if (query.includes('FROM decision_review_record')) {
              return { results: mockDbData.decision_review_record.filter((d: any) => d.candidate_user_id === args[0]) };
            }
            if (query.includes('FROM governance_audit_event')) {
              return { results: mockDbData.governance_audit_event };
            }
            return { results: [] };
          }),
          run: vi.fn().mockImplementation(async () => {
            if (query.includes('INSERT INTO readiness_profile')) {
              mockDbData.readiness_profile.push({ candidate_user_id: args[1], overall_readiness_index: args[7] });
            }
            if (query.includes('INSERT INTO decision_review_record')) {
              mockDbData.decision_review_record.push({
                id: args[0],
                candidate_user_id: args[1],
                human_decision_status: args[6],
                reviewer_disagreement_flag: args[9]
              });
            }
            if (query.includes('UPDATE readiness_evidence_ledger')) {
              const item = mockDbData.readiness_evidence_ledger.find((l: any) => l.id === args[2]);
              if (item) item.human_review_status = args[0];
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

describe('M05 Candidate Readiness + Evidence Synthesis + Human Decision Support + Governance API', () => {

  it('1. GET /api/m5/readiness/candidates lists candidate pool for recruiter', async () => {
    const env = createMockEnv();
    const req = new Request('http://localhost/api/m5/readiness/candidates', {
      headers: { Cookie: 'intellihire_session=recruiter-token' }
    });
    const res = await app.request(req, {}, env as any);
    expect(res.status).toBe(200);
    const data = await res.json() as any;
    expect(data.success).toBe(true);
    expect(data.candidates.length).toBeGreaterThanOrEqual(1);
    expect(data.candidates[0].target_role).toBeDefined();
  });

  it('2. GET /api/m5/readiness/candidate/:id retrieves 5-layer dossier for candidate', async () => {
    const env = createMockEnv();
    const req = new Request('http://localhost/api/m5/readiness/candidate/cand-1', {
      headers: { Cookie: 'intellihire_session=candidate-token' }
    });
    const res = await app.request(req, {}, env as any);
    expect(res.status).toBe(200);
    const data = await res.json() as any;
    expect(data.success).toBe(true);
    expect(data.readiness_profile.overall_readiness_index).toBe(0.89);
    expect(data.evidence_ledger.length).toBe(1);
    expect(data.evidence_ledger[0].source_module).toBe('m03_simulation');
  });

  it('3. Candidate RBAC isolation: candidate cannot access another candidate dossier', async () => {
    const env = createMockEnv();
    const req = new Request('http://localhost/api/m5/readiness/candidate/cand-1', {
      headers: { Cookie: 'intellihire_session=other-candidate-token' }
    });
    const res = await app.request(req, {}, env as any);
    expect(res.status).toBe(403);
    const data = await res.json() as any;
    expect(data.error).toContain('Forbidden');
  });

  it('4. POST /api/m5/readiness/synthesize recalculates Bayesian readiness & updates profile', async () => {
    const env = createMockEnv();
    const req = new Request('http://localhost/api/m5/readiness/synthesize', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: 'intellihire_session=recruiter-token'
      },
      body: JSON.stringify({ candidate_id: 'cand-1' })
    });
    const res = await app.request(req, {}, env as any);
    expect(res.status).toBe(200);
    const data = await res.json() as any;
    expect(data.success).toBe(true);
    expect(data.profile.overall_readiness_index).toBeGreaterThan(0.4);
    expect(data.profile.composition).toBeDefined();
    expect(data.profile.triangulation).toBeDefined();
    expect(data.profile.remediation_loop.length).toBeGreaterThan(0);
  });

  it('5. POST /api/m5/decision/review records human hiring committee decision and disagreement', async () => {
    const env = createMockEnv();
    const req = new Request('http://localhost/api/m5/decision/review', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: 'intellihire_session=recruiter-token'
      },
      body: JSON.stringify({
        candidate_id: 'cand-1',
        decision_stage: 'committee_review',
        human_decision_status: 'endorse_hire',
        decision_rationale: 'Exceptional fault tolerance proven in M03 simulation.',
        competency_ratings: { 'Consensus Architecture': 5 },
        reviewer_disagreement_flag: 0,
        adverse_impact_acknowledged: 1
      })
    });
    const res = await app.request(req, {}, env as any);
    expect(res.status).toBe(200);
    const data = await res.json() as any;
    expect(data.success).toBe(true);
    expect(data.decision_record.human_decision_status).toBe('endorse_hire');
  });

  it('6. Candidates are forbidden from recording hiring committee decisions', async () => {
    const env = createMockEnv();
    const req = new Request('http://localhost/api/m5/decision/review', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: 'intellihire_session=candidate-token'
      },
      body: JSON.stringify({
        candidate_id: 'cand-1',
        human_decision_status: 'endorse_hire'
      })
    });
    const res = await app.request(req, {}, env as any);
    expect(res.status).toBe(403);
  });

  it('7. POST /api/m5/evidence/review allows reviewer to verify or dispute ledger item', async () => {
    const env = createMockEnv();
    const req = new Request('http://localhost/api/m5/evidence/review', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: 'intellihire_session=recruiter-token'
      },
      body: JSON.stringify({
        evidence_id: 'leg-1',
        status: 'verified',
        notes: 'Confirmed simulation logs match container telemetry.'
      })
    });
    const res = await app.request(req, {}, env as any);
    expect(res.status).toBe(200);
    const data = await res.json() as any;
    expect(data.human_review_status).toBe('verified');
  });

  it('8. GET /api/m5/governance/adverse-impact verifies EEOC 4/5ths compliance and demographic segregation', async () => {
    const env = createMockEnv();
    const req = new Request('http://localhost/api/m5/governance/adverse-impact', {
      headers: { Cookie: 'intellihire_session=recruiter-token' }
    });
    const res = await app.request(req, {}, env as any);
    expect(res.status).toBe(200);
    const data = await res.json() as any;
    expect(data.success).toBe(true);
    expect(data.eeoc_compliance.four_fifths_threshold).toBe(0.80);
    expect(data.eeoc_compliance.current_air_ratio).toBeGreaterThanOrEqual(0.80);
    expect(data.eeoc_compliance.inference_ban_verified).toBe(true);
  });

  it('9. GET /api/m5/governance/package/:id exports complete auditable decision package', async () => {
    const env = createMockEnv();
    const req = new Request('http://localhost/api/m5/governance/package/cand-1', {
      headers: { Cookie: 'intellihire_session=recruiter-token' }
    });
    const res = await app.request(req, {}, env as any);
    expect(res.status).toBe(200);
    const data = await res.json() as any;
    expect(data.package_type).toBe('M05_AUDITABLE_READINESS_GOVERNANCE_PACKAGE');
    expect(data.human_authority_invariant.status).toBe('ENFORCED');
    expect(data.candidate.name).toBe('Elena Rostova');
  });

});
