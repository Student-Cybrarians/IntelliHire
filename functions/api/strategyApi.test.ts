import { describe, it, expect, vi } from 'vitest';
import { app } from './[[route]]';

vi.mock('hono/jwt', () => ({
  sign: vi.fn(),
  verify: vi.fn().mockImplementation(async (token) => {
    if (token === 'recruiter-token') {
      return { id: 'usr_recruiter_01', email: 'mokshithyoga@gmail.com', full_name: 'Jane Recruiter', role: 'recruiter' };
    }
    if (token === 'candidate-token') {
      return { id: 'usr_candidate_01', email: 'candidate@example.com', full_name: 'John Candidate', role: 'candidate' };
    }
    return null;
  }),
}));

const createMockEnv = (dbOverrides: Record<string, any> = {}) => {
  return {
    DB: {
      prepare: (query: string) => ({
        bind: (...args: any[]) => {
          if (query.includes('FROM user_account WHERE id = ?')) {
            return {
              first: vi.fn().mockResolvedValue({ organization_id: 'org_acme_corp' }),
              all: vi.fn().mockResolvedValue({ results: [] }),
              run: vi.fn().mockResolvedValue({ success: true }),
            };
          }
          if (query.includes('FROM evidence_strategy WHERE id = ?')) {
            return {
              first: vi.fn().mockResolvedValue(
                dbOverrides.existingStrategy || {
                  id: args[0],
                  organization_id: 'org_acme_corp',
                  target_role: 'Fullstack Engineer',
                  seniority_level: 'mid',
                  assessment_purpose: 'recruitment',
                  required_evidence: 'Synthesized, syntactically verified code solution with unit tests.',
                  preferred_modality: 'coding',
                  evaluation_method: 'hybrid',
                  rubric_id: 'rub_123',
                  version: 1,
                  is_active: 1,
                }
              ),
              all: vi.fn().mockResolvedValue({ results: [] }),
              run: vi.fn().mockResolvedValue({ success: true }),
            };
          }
          if (query.includes('SELECT * FROM evidence_strategy WHERE organization_id = ?')) {
            return {
              all: vi.fn().mockResolvedValue({
                results: [
                  {
                    id: 'strat_1',
                    organization_id: 'org_acme_corp',
                    target_role: 'Fullstack Engineer',
                    preferred_modality: 'coding',
                    version: 1,
                  },
                ],
              }),
              first: vi.fn().mockResolvedValue(null),
              run: vi.fn().mockResolvedValue({ success: true }),
            };
          }
          return {
            first: vi.fn().mockResolvedValue({ success: true }),
            run: vi.fn().mockResolvedValue({ success: true }),
            all: vi.fn().mockResolvedValue({ results: [] }),
          };
        },
      }),
    },
    SESSION_KV: {
      get: vi.fn().mockImplementation(async (id: string) => {
        if (id === 'session:recruiter-token') return 'recruiter-token';
        if (id === 'session:candidate-token') return 'candidate-token';
        return null;
      }),
    },
    RESUME_KV: {
      get: vi.fn(),
      put: vi.fn(),
    },
  };
};

describe('Prompt 19 — Strategy API Endpoints', () => {
  describe('Authentication & Authorization Guards', () => {
    it('rejects unauthenticated requests with 401', async () => {
      const env = createMockEnv();
      const req = new Request('http://localhost/api/m2/strategies', { method: 'GET' });
      const res = await app.request(req, {}, env as any);
      expect(res.status).toBe(401);
    });

    it('forbids candidate role from creating evidence strategy templates with 403', async () => {
      const env = createMockEnv();
      const req = new Request('http://localhost/api/m2/strategies', {
        method: 'POST',
        headers: {
          Cookie: 'intellihire_session=candidate-token',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          target_role: 'Engineer',
          required_evidence: 'Sample evidence description',
        }),
      });
      const res = await app.request(req, {}, env as any);
      expect(res.status).toBe(403);
      const data = await res.json() as any;
      expect(data.error).toContain('Forbidden');
    });
  });

  describe('POST /api/m2/strategies (Create)', () => {
    it('rejects invalid strategy payloads with 400 and rejection codes', async () => {
      const env = createMockEnv();
      const req = new Request('http://localhost/api/m2/strategies', {
        method: 'POST',
        headers: {
          Cookie: 'intellihire_session=recruiter-token',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          target_role: 'Engineer',
          seniority_level: 'invalid_level',
          required_evidence: 'short',
        }),
      });
      const res = await app.request(req, {}, env as any);
      expect(res.status).toBe(400);
      const data = await res.json() as any;
      expect(data.error).toContain('Strategy validation failed');
      expect(data.rejection_codes.length).toBeGreaterThan(0);
    });

    it('creates compliant evidence strategy with 201 and persists to D1', async () => {
      const env = createMockEnv();
      const validPayload = {
        target_role: 'Fullstack TypeScript Engineer',
        occupation: { name: 'Software Engineer', code: '15-1252.00' },
        seniority_level: 'mid',
        assessment_purpose: 'recruitment',
        primary_modality: 'coding',
        evaluation_method: 'hybrid',
        rubric_id: 'rub_typescript_01',
        required_evidence: 'Synthesized, syntactically verified code solution with unit tests.',
        minimum_evidence_items: 5,
        confidence_threshold: 0.80,
      };

      const req = new Request('http://localhost/api/m2/strategies', {
        method: 'POST',
        headers: {
          Cookie: 'intellihire_session=recruiter-token',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(validPayload),
      });

      const res = await app.request(req, {}, env as any);
      expect(res.status).toBe(201);
      const data = await res.json() as any;
      expect(data.status).toBe('created');
      expect(data.id).toBeTruthy();
      expect(data.version).toBe(1);
    });
  });

  describe('GET /api/m2/strategies & GET /api/m2/strategies/:id (Retrieve)', () => {
    it('retrieves all active strategies isolated by tenant organization', async () => {
      const env = createMockEnv();
      const req = new Request('http://localhost/api/m2/strategies', {
        method: 'GET',
        headers: { Cookie: 'intellihire_session=recruiter-token' },
      });
      const res = await app.request(req, {}, env as any);
      expect(res.status).toBe(200);
      const data = await res.json() as any;
      expect(Array.isArray(data.strategies)).toBe(true);
      expect(data.strategies.length).toBe(1);
      expect(data.strategies[0].id).toBe('strat_1');
    });

    it('retrieves single strategy by ID', async () => {
      const env = createMockEnv();
      const req = new Request('http://localhost/api/m2/strategies/strat_1', {
        method: 'GET',
        headers: { Cookie: 'intellihire_session=recruiter-token' },
      });
      const res = await app.request(req, {}, env as any);
      expect(res.status).toBe(200);
      const data = await res.json() as any;
      expect(data.strategy).toBeDefined();
      expect(data.strategy.id).toBe('strat_1');
    });
  });

  describe('POST /api/m2/strategies/:id/version (Versioning)', () => {
    it('creates an incremented version (version 2) and records audit trail', async () => {
      const env = createMockEnv();
      const req = new Request('http://localhost/api/m2/strategies/strat_1/version', {
        method: 'POST',
        headers: {
          Cookie: 'intellihire_session=recruiter-token',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          minimum_evidence_items: 6,
          confidence_threshold: 0.85,
        }),
      });

      const res = await app.request(req, {}, env as any);
      expect(res.status).toBe(200);
      const data = await res.json() as any;
      expect(data.status).toBe('versioned');
      expect(data.version).toBe(2);
      expect(data.id).toBeTruthy();
    });
  });

  describe('POST /api/m2/strategies/validate (Preflight Validation)', () => {
    it('returns validation result without persisting', async () => {
      const env = createMockEnv();
      const req = new Request('http://localhost/api/m2/strategies/validate', {
        method: 'POST',
        headers: {
          Cookie: 'intellihire_session=recruiter-token',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          seniority_level: 'mid',
          target_role: 'Developer',
          assessment_purpose: 'recruitment',
          primary_modality: 'coding',
          rubric_id: 'rub_123',
          required_evidence: 'Working code solution with boundary assertions.',
        }),
      });

      const res = await app.request(req, {}, env as any);
      expect(res.status).toBe(200);
      const data = await res.json() as any;
      expect(data.valid).toBe(true);
      expect(data.errors.length).toBe(0);
    });
  });

  describe('POST /api/m2/strategies/preview (Runtime Strategy Preview)', () => {
    it('returns real-time strategy preview with modality and rationale', async () => {
      const env = createMockEnv();
      const req = new Request('http://localhost/api/m2/strategies/preview', {
        method: 'POST',
        headers: {
          Cookie: 'intellihire_session=recruiter-token',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          role: 'Registered Nurse',
          occupation: { name: 'Healthcare Practitioner' },
          competency: { id: 'comp_triage', name: 'Emergency Patient Triage' },
          seniority: 'mid',
          purpose: 'certification',
        }),
      });

      const res = await app.request(req, {}, env as any);
      expect(res.status).toBe(200);
      const data = await res.json() as any;
      expect(data.preview).toBeDefined();
      expect(data.preview.modality).toBe('scenario');
      expect(data.preview.rationale).toBeDefined();
    });
  });

  describe('POST /api/m2/strategies/execution-plan (Execution Planning)', () => {
    it('returns a multi-stage execution plan with stopping rules and duration estimates', async () => {
      const env = createMockEnv();
      const req = new Request('http://localhost/api/m2/strategies/execution-plan', {
        method: 'POST',
        headers: {
          Cookie: 'intellihire_session=recruiter-token',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          context: {
            role: 'DevOps Engineer',
            occupation: { name: 'Cloud Infrastructure' },
            competency: { id: 'comp_k8s', name: 'Kubernetes Cluster Recovery' },
            seniority: 'senior',
            purpose: 'recruitment',
          },
        }),
      });

      const res = await app.request(req, {}, env as any);
      expect(res.status).toBe(200);
      const data = await res.json() as any;
      expect(data.execution_plan).toBeDefined();
      expect(data.execution_plan.plan_id).toMatch(/^PLAN_/);
      expect(data.execution_plan.stages.length).toBe(3);
      expect(data.execution_plan.estimated_duration_minutes).toBeGreaterThan(0);
      expect(data.execution_plan.stopping_rules).toBeDefined();
      expect(data.execution_plan.provenance).toBeDefined();
    });
  });
});
