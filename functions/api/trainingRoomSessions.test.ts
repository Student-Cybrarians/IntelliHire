import { describe, it, expect, vi } from 'vitest';
import { app } from './[[route]]';

vi.mock('hono/jwt', () => ({
  sign: vi.fn(),
  verify: vi.fn().mockImplementation(async (token) => {
    if (token === 'candidate-token') {
      return { id: 'cand-user-99', role: 'candidate', full_name: 'Jordan Lee', organization_id: 'org-test' };
    }
    return null;
  })
}));

const createMockEnv = (dbOverrides: any = {}) => {
  return {
    SESSION_KV: {
      get: vi.fn().mockImplementation(async (id: string) => {
        if (id === 'session:candidate-token') return 'candidate-token';
        return null;
      })
    },
    DB: {
      prepare: (query: string) => ({
        bind: (...args: any[]) => ({
          first: vi.fn().mockImplementation(async () => {
            if (query.includes('FROM user_account WHERE id = ?')) {
              return { organization_id: 'org-test', role: 'candidate' };
            }
            if (query.includes('FROM interview_session WHERE id = ?')) {
              return {
                id: args[0],
                organization_id: 'org-test',
                candidate_id: 'cand-user-99',
                evidence_summary_json: JSON.stringify({ title: 'Old Session Title' })
              };
            }
            if (dbOverrides.first) return dbOverrides.first(query, args);
            return null;
          }),
          all: vi.fn().mockImplementation(async () => {
            if (query.includes('FROM interview_session s')) {
              return {
                results: [
                  {
                    id: 'sess-1',
                    protocol_id: 'proto-1',
                    candidate_user_id: 'cand-user-99',
                    organization_id: 'org-test',
                    status: 'completed',
                    turn_count: 5,
                    current_turn: 5,
                    evidence_summary_json: JSON.stringify({ custom_title: 'Distributed Systems Mock' }),
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString(),
                    protocol_title: 'Software Architect Behavioral',
                    overall_rating: 0.85,
                    readiness_verdict: 'STRONG_HIRE',
                    gaps_json: JSON.stringify(['conflict resolution'])
                  },
                  {
                    id: 'sess-2',
                    protocol_id: 'proto-2',
                    candidate_user_id: 'cand-user-99',
                    organization_id: 'org-test',
                    status: 'in_progress',
                    turn_count: 3,
                    current_turn: 2,
                    evidence_summary_json: null,
                    created_at: new Date(Date.now() - 86400000 * 2).toISOString(),
                    updated_at: new Date(Date.now() - 86400000 * 2).toISOString(),
                    protocol_title: 'Engineering Leadership',
                    overall_rating: null,
                    gaps_json: null
                  }
                ]
              };
            }
            if (query.includes('FROM simulation_session s')) {
              return {
                results: [
                  {
                    id: 'sim-1',
                    definition_id: 'sim-def-1',
                    user_id: 'cand-user-99',
                    status: 'completed',
                    overall_score: 0.92,
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString(),
                    def_title: 'Cloud High-Availability Failover Drill',
                    domain: 'cloud',
                    target_role: 'Cloud Architect',
                    difficulty_level: 4
                  }
                ]
              };
            }
            if (dbOverrides.all) return dbOverrides.all(query, args);
            return { results: [] };
          }),
          run: vi.fn().mockResolvedValue({ success: true, meta: { changes: 1 } })
        })
      })
    }
  };
};

describe('Training Room & Simulation Dashboard API Extensions', () => {
  it('GET /api/m4/interviews/sessions returns session history and aggregated training stats', async () => {
    const env = createMockEnv();
    const req = new Request('http://localhost/api/m4/interviews/sessions', {
      method: 'GET',
      headers: {
        'Cookie': 'intellihire_session=candidate-token'
      }
    });

    const res = await app.fetch(req, env as any);
    expect(res.status).toBe(200);

    const json = await res.json() as any;
    expect(json.success).toBe(true);
    expect(json.sessions).toHaveLength(2);
    expect(json.sessions[0].interviewTitle).toBe('Distributed Systems Mock');
    expect(json.sessions[0].score).toBe(8.5);

    // Verify Training Room stats aggregated from session results
    expect(json.stats).toBeDefined();
    expect(json.stats.total).toBe(2);
    expect(json.stats.completedCount).toBe(1);
    expect(json.stats.overallAvg).toBe(8.5);
    expect(json.stats.thisWeekCount).toBe(2);
    expect(json.stats.activityByDay).toBeDefined();
  });

  it('POST /api/m4/interviews/sessions/:id/rename updates the session title', async () => {
    const env = createMockEnv();
    const req = new Request('http://localhost/api/m4/interviews/sessions/sess-1/rename', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': 'intellihire_session=candidate-token'
      },
      body: JSON.stringify({ title: 'Refined Behavioral Practice Round' })
    });

    const res = await app.fetch(req, env as any);
    expect(res.status).toBe(200);

    const json = await res.json() as any;
    expect(json.success).toBe(true);
    expect(json.interviewTitle).toBe('Refined Behavioral Practice Round');
  });

  it('DELETE /api/m4/interviews/sessions/:id removes the session', async () => {
    const env = createMockEnv();
    const req = new Request('http://localhost/api/m4/interviews/sessions/sess-1', {
      method: 'DELETE',
      headers: {
        'Cookie': 'intellihire_session=candidate-token'
      }
    });

    const res = await app.fetch(req, env as any);
    expect(res.status).toBe(200);

    const json = await res.json() as any;
    expect(json.success).toBe(true);
  });

  it('GET /api/m3/simulations/sessions returns candidate simulation history', async () => {
    const env = createMockEnv();
    const req = new Request('http://localhost/api/m3/simulations/sessions', {
      method: 'GET',
      headers: {
        'Cookie': 'intellihire_session=candidate-token'
      }
    });

    const res = await app.fetch(req, env as any);
    expect(res.status).toBe(200);

    const json = await res.json() as any;
    expect(json.success).toBe(true);
    expect(json.sessions).toHaveLength(1);
    expect(json.sessions[0].title).toBe('Cloud High-Availability Failover Drill');
    expect(json.sessions[0].domain).toBe('cloud');
    expect(json.sessions[0].overall_score).toBe(92);
  });
});
