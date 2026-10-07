import { describe, it, expect, vi } from 'vitest';
import { app } from './[[route]]';
import { executeCandidateWork } from './simulationEngine';

vi.mock('hono/jwt', () => ({
  sign: vi.fn().mockResolvedValue('fake-jwt'),
  verify: vi.fn().mockResolvedValue({ id: 'user-1' }),
}));

describe('M03 Universal Execution Engine - Unit Tests', () => {
  it('executes coding task in isolated sandbox with test results', () => {
    const taskDef = {
      id: 'sim-tech-rate-limiter',
      simulation_type: 'coding',
      title: 'Distributed Token Bucket Rate Limiter',
      scenario: {
        constraints: ['Memory overhead < 2KB']
      }
    };

    const result = executeCandidateWork(taskDef, 'run_code', {
      code: 'class TokenBucketRateLimiter { allow(tokens) { if (tokens > 100) return 429; this.refill(); return 200; } refill() {} }'
    });

    expect(result.success).toBe(true);
    expect(result.execution_type).toBe('code_execution');
    expect(result.status).toBe('passed');
    expect(result.test_results?.length).toBe(3);
    expect(result.output).toContain('3/3 Tests Passed');
    expect(result.duration_ms).toBeGreaterThanOrEqual(0);
  });

  it('rejects prohibited malicious patterns in code execution', () => {
    const taskDef = {
      id: 'sim-tech-sandbox-test',
      simulation_type: 'coding',
      title: 'Security Sandbox Test'
    };

    const result = executeCandidateWork(taskDef, 'run_code', {
      code: 'eval("require(\'child_process\').execSync(\'cat /etc/passwd\')")'
    });

    expect(result.success).toBe(false);
    expect(result.status).toBe('error');
    expect(result.errors?.[0]).toContain('Prohibited keyword: eval(');
    expect(result.output).toContain('Security Sandbox Policy Violation');
  });

  it('analyzes SQL query with explain plan and index seek verification', () => {
    const taskDef = {
      id: 'sim-tech-api-relational-indexing',
      simulation_type: 'sql',
      title: 'High-Volume Ledger Optimization'
    };

    const goodSql = 'CREATE INDEX CONCURRENTLY idx_audit_status_created ON candidate_audit_event (status, created_at);';
    const result = executeCandidateWork(taskDef, 'run_sql', {
      query: goodSql
    });

    expect(result.success).toBe(true);
    expect(result.execution_type).toBe('sql_execution');
    expect(result.status).toBe('passed');
    expect(result.metrics?.is_composite_index).toBe(true);
    expect(result.metrics?.estimated_scan_cost).toBe(1.4);
    expect(result.test_results?.every(t => t.passed)).toBe(true);
  });

  it('calculates financial CapEx envelope, NPV and IRR sensitivity', () => {
    const taskDef = {
      id: 'sim-finance-capex',
      simulation_type: 'financial_analysis',
      title: 'CapEx ROI & Capital Allocation',
      scenario: {
        starting_data: {
          projects: [
            { name: 'Alpha', capex: 6000000, cash_flows_y1_5: [2000000, 2000000, 2000000, 2000000, 2000000] },
            { name: 'Beta', capex: 7500000, cash_flows_y1_5: [2500000, 2500000, 2500000, 2500000, 2500000] }
          ]
        }
      }
    };

    const result = executeCandidateWork(taskDef, 'calc_financials', {
      candidate_work: {
        selected_projects: ['Alpha', 'Beta'],
        memo: 'Recommending Alpha and Beta portfolio under $15M ceiling.'
      }
    });

    expect(result.success).toBe(true);
    expect(result.execution_type).toBe('financial_calculation');
    expect(result.metrics?.total_capex_usd).toBe(13500000);
    expect(result.metrics?.within_capex_ceiling).toBe(true);
    expect(result.status).toBe('passed');
    expect(result.test_results?.[0].passed).toBe(true);
  });

  it('flags budget overrun when financial CapEx exceeds $15M constraint', () => {
    const taskDef = {
      id: 'sim-finance-capex',
      simulation_type: 'financial_analysis',
      title: 'CapEx ROI & Capital Allocation',
      scenario: {
        starting_data: {
          projects: [
            { name: 'Alpha', capex: 10000000, cash_flows_y1_5: [3000000] },
            { name: 'Beta', capex: 8000000, cash_flows_y1_5: [2000000] }
          ]
        }
      }
    };

    const result = executeCandidateWork(taskDef, 'calc_financials', {
      candidate_work: {
        selected_projects: ['Alpha', 'Beta']
      }
    });

    expect(result.metrics?.within_capex_ceiling).toBe(false);
    expect(result.status).toBe('warning');
    expect(result.test_results?.some(t => !t.passed && t.name.includes('$15.0M Cap'))).toBe(true);
  });

  it('verifies healthcare triage shift simulation and breaks', () => {
    const taskDef = {
      id: 'sim-ops-ed-triage',
      simulation_type: 'operational_triage',
      title: 'Emergency Department Mass Casualty Triage'
    };

    const result = executeCandidateWork(taskDef, 'run_operations_triage', {
      candidate_work: {
        triage_plan: 'Assign 1:2 ICU nurse to intubated trauma P-101. Staggered break relief coverage active for telemetry. Float pool overtime within 12 hours.'
      }
    });

    expect(result.success).toBe(true);
    expect(result.status).toBe('passed');
    expect(result.test_results?.length).toBe(3);
    expect(result.test_results?.every(t => t.passed)).toBe(true);
  });

  it('flags safety violation when triage plan omits break coverage', () => {
    const taskDef = {
      id: 'sim-ops-ed-triage',
      simulation_type: 'operational_triage',
      title: 'Emergency Department Mass Casualty Triage'
    };

    const result = executeCandidateWork(taskDef, 'run_operations_triage', {
      candidate_work: {
        triage_plan: 'Assign ICU nurse to trauma P-101.'
      }
    });

    expect(result.status).toBe('warning');
    expect(result.test_results?.some(t => !t.passed && t.name.includes('Break'))).toBe(true);
  });
});

describe('M03 Universal Execution Engine - API Routes', () => {
  it('returns 401 when unauthenticated on POST /api/m3/simulations/sessions/:id/execute', async () => {
    const env = {
      DB: {},
      SESSION_KV: {
        get: vi.fn().mockResolvedValue(null),
      },
      JWT_SECRET: 'test-secret',
    };

    const res = await app.request('/api/m3/simulations/sessions/ses-123/execute', {
      method: 'POST',
      body: JSON.stringify({ action_type: 'run_code', payload: {} }),
      headers: { 'Content-Type': 'application/json' }
    }, env);

    expect(res.status).toBe(401);
  });

  it('returns 404 when session does not exist on POST /api/m3/simulations/sessions/:id/execute', async () => {
    const jwt = 'fake-jwt';
    const env = {
      DB: {
        prepare: vi.fn().mockReturnValue({
          bind: vi.fn().mockReturnValue({
            first: vi.fn().mockResolvedValue(null),
          }),
        }),
      },
      SESSION_KV: {
        get: vi.fn().mockResolvedValue(jwt),
      },
      JWT_SECRET: 'test-secret',
    };

    const req = new Request('http://localhost/api/m3/simulations/sessions/nonexistent/execute', {
      method: 'POST',
      headers: {
        Cookie: 'intellihire_session=session-1',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ action_type: 'run_code', payload: {} })
    });

    const res = await app.request(req, {}, env);
    expect(res.status).toBe(404);
    const data = await res.json() as any;
    expect(data.error).toBe('Session not found');
  });

  it('executes candidate work and saves draft on POST /api/m3/simulations/sessions/:id/execute', async () => {
    const jwt = 'fake-jwt';
    const runMock = vi.fn().mockResolvedValue({ success: true });
    const sessionMock = {
      id: 'session-valid',
      user_id: 'user-1',
      definition_id: 'sim-tech-rate-limiter',
      status: 'in_progress',
      current_step: 1,
      telemetry_events_json: '[]'
    };

    const env = {
      DB: {
        prepare: vi.fn().mockImplementation((query: string) => {
          if (query.includes('FROM simulation_session WHERE id = ?')) {
            return {
              bind: vi.fn().mockReturnValue({
                first: vi.fn().mockResolvedValue(sessionMock)
              })
            };
          }
          return {
            bind: vi.fn().mockReturnValue({
              run: runMock
            })
          };
        }),
      },
      SESSION_KV: {
        get: vi.fn().mockResolvedValue(jwt),
      },
      JWT_SECRET: 'test-secret',
    };

    const req = new Request('http://localhost/api/m3/simulations/sessions/session-valid/execute', {
      method: 'POST',
      headers: {
        Cookie: 'intellihire_session=session-1',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        action_type: 'run_code',
        candidate_work: { code: 'class TokenBucketRateLimiter { allow() { return 200; } }' },
        payload: { code: 'class TokenBucketRateLimiter { allow() { return 200; } }' }
      })
    });

    const res = await app.request(req, {}, env);
    expect(res.status).toBe(200);
    const data = await res.json() as any;
    expect(data.success).toBe(true);
    expect(data.execution_result.status).toBe('passed');
    expect(data.execution_result.execution_type).toBe('code_execution');
    expect(runMock).toHaveBeenCalled(); // Telemetry & candidate_work_json saved!
  });

  it('executes standalone code in sandbox via POST /api/m3/execute with auth', async () => {
    const jwt = 'fake-jwt';
    const env = {
      DB: {},
      SESSION_KV: {
        get: vi.fn().mockResolvedValue(jwt),
      },
      JWT_SECRET: 'test-secret',
    };

    const req = new Request('http://localhost/api/m3/execute', {
      method: 'POST',
      headers: {
        Cookie: 'intellihire_session=session-1',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        definition_id: 'sim-tech-rate-limiter',
        action_type: 'run_code',
        payload: { code: 'class TokenBucketRateLimiter { allow(tokens) { if (tokens > 100) return 429; this.refill(); return 200; } refill() {} }' }
      })
    });

    const res = await app.request(req, {}, env);
    expect(res.status).toBe(200);
    const data = await res.json() as any;
    expect(data.success).toBe(true);
    expect(data.execution_result.status).toBe('passed');
  });
});
