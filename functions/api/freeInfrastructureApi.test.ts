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

const mockCatalogData = [
  {
    id: 'major-cloud-providers__cloudflare__workers',
    provider_name: 'Cloudflare',
    service_name: 'Workers',
    category: 'Major Cloud Providers',
    subcategory: null,
    official_url: 'https://workers.cloudflare.com',
    source_url: 'https://github.com/ripienaar/free-for-dev#major-cloud-providers',
    description: 'Serverless execution at the edge with 100,000 requests/day',
    free_tier_description: '100,000 requests/day, 10ms CPU time per request',
    free_tier_type: 'always_free',
    storage_limit: null,
    request_limit: '100,000 requests/day',
    compute_limit: '10ms CPU time',
    bandwidth_limit: null,
    retention_limit: null,
    user_limit: null,
    project_limit: null,
    api_limit: null,
    credit_card_required: 0,
    trial_only: 0,
    open_source: null,
    self_hostable: null,
    commercial_use: 1,
    production_allowed: 1,
    api_available: 1,
    sdk_available: 1,
    webhook_available: null,
    intellihire_modules_json: JSON.stringify(['M2', 'shared']),
    capability_tags_json: JSON.stringify(['serverless_compute', 'cdn_edge']),
    priority: 'critical',
    risk_level: 'low',
    verification_status: 'verified',
    source_provenance_json: JSON.stringify({
      source: 'free-for.dev',
      repository: 'https://github.com/ripienaar/free-for-dev',
      file: 'README.md',
      commit: 'master',
      retrievedAt: '2026-10-02T12:00:00Z',
    }),
  },
  {
    id: 'apis-data-and-ml__tesseract-ocr',
    provider_name: null,
    service_name: 'Tesseract OCR',
    category: 'APIs, Data, and ML',
    subcategory: null,
    official_url: 'https://github.com/tesseract-ocr/tesseract',
    source_url: 'https://github.com/ripienaar/free-for-dev#apis-data-and-ml',
    description: 'Open source OCR engine for document text extraction',
    free_tier_description: 'Open source, free for all uses',
    free_tier_type: 'open_source',
    storage_limit: null,
    request_limit: null,
    compute_limit: null,
    bandwidth_limit: null,
    retention_limit: null,
    user_limit: null,
    project_limit: null,
    api_limit: null,
    credit_card_required: null,
    trial_only: null,
    open_source: 1,
    self_hostable: 1,
    commercial_use: 1,
    production_allowed: 1,
    api_available: 1,
    sdk_available: null,
    webhook_available: null,
    intellihire_modules_json: JSON.stringify(['M1']),
    capability_tags_json: JSON.stringify(['ocr_parsing']),
    priority: 'high',
    risk_level: 'low',
    verification_status: 'unverified',
    source_provenance_json: JSON.stringify({
      source: 'free-for.dev',
      repository: 'https://github.com/ripienaar/free-for-dev',
      file: 'README.md',
      commit: 'master',
      retrievedAt: '2026-10-02T12:00:00Z',
    }),
  },
];

const createMockEnv = () => {
  return {
    DB: {
      prepare: (query: string) => ({
        bind: (...args: any[]) => ({
          first: vi.fn().mockImplementation(async () => {
            if (query.includes('FROM free_service_catalog WHERE id = ?')) {
              const item = mockCatalogData.find(m => m.id === args[0]);
              return item || null;
            }
            if (query.includes('COUNT(*) as count FROM free_service_catalog')) {
              return { count: mockCatalogData.length };
            }
            if (query.includes('COUNT(DISTINCT category) as count')) {
              return { count: 2 };
            }
            if (query.includes('FROM free_service_sync_log')) {
              return { synced_at: '2026-10-02T12:00:00Z', services_count: 2, categories_count: 2, status: 'success' };
            }
            return { count: 1 };
          }),
          all: vi.fn().mockImplementation(async () => {
            if (query.includes('GROUP BY category')) {
              return {
                results: [
                  { category: 'APIs, Data, and ML', count: 1 },
                  { category: 'Major Cloud Providers', count: 1 },
                ],
              };
            }
            if (query.includes('FROM free_service_catalog')) {
              return { results: mockCatalogData };
            }
            return { results: [] };
          }),
          run: vi.fn().mockResolvedValue({ success: true }),
        }),
        first: vi.fn().mockImplementation(async () => {
          if (query.includes('COUNT(*) as count FROM free_service_catalog')) {
            return { count: mockCatalogData.length };
          }
          if (query.includes('COUNT(DISTINCT category) as count')) {
            return { count: 2 };
          }
          if (query.includes('FROM free_service_sync_log')) {
            return { synced_at: '2026-10-02T12:00:00Z', services_count: 2, categories_count: 2, status: 'success' };
          }
          return { count: 1 };
        }),
        all: vi.fn().mockImplementation(async () => {
          if (query.includes('GROUP BY category')) {
            return {
              results: [
                { category: 'APIs, Data, and ML', count: 1 },
                { category: 'Major Cloud Providers', count: 1 },
              ],
            };
          }
          return { results: mockCatalogData };
        }),
        run: vi.fn().mockResolvedValue({ success: true }),
      }),
      batch: vi.fn().mockResolvedValue([]),
    },
    SESSION_KV: {
      get: vi.fn().mockImplementation(async (id: string) => {
        if (id === 'session:recruiter-token') return 'recruiter-token';
        if (id === 'session:candidate-token') return 'candidate-token';
        return null;
      }),
      put: vi.fn(),
      delete: vi.fn(),
    },
  };
};

describe('Phase 1: Free Infrastructure Intelligence API Endpoints', () => {
  describe('GET /api/free-infrastructure/summary', () => {
    it('returns high-level summary metrics with module distribution and last sync status', async () => {
      const env = createMockEnv();
      const req = new Request('http://localhost/api/free-infrastructure/summary', { method: 'GET' });
      const res = await app.request(req, {}, env as any);

      expect(res.status).toBe(200);
      const data = await res.json() as any;
      expect(data.success).toBe(true);
      expect(data.summary).toBeDefined();
      expect(data.summary.total_services).toBe(2);
      expect(data.summary.total_categories).toBe(2);
      expect(data.summary.modules).toBeDefined();
      expect(data.summary.traits).toBeDefined();
      expect(data.summary.last_sync).toBeDefined();
    });
  });

  describe('GET /api/free-infrastructure/services', () => {
    it('returns paginated catalog results with metadata', async () => {
      const env = createMockEnv();
      const req = new Request('http://localhost/api/free-infrastructure/services?page=1&limit=10', { method: 'GET' });
      const res = await app.request(req, {}, env as any);

      expect(res.status).toBe(200);
      const data = await res.json() as any;
      expect(data.success).toBe(true);
      expect(Array.isArray(data.services)).toBe(true);
      expect(data.total).toBe(2);
      expect(data.page).toBe(1);
    });

    it('filters services by search query, category, and module', async () => {
      const env = createMockEnv();
      const req = new Request('http://localhost/api/free-infrastructure/services?q=cloudflare&category=Major+Cloud+Providers&module=M2', { method: 'GET' });
      const res = await app.request(req, {}, env as any);

      expect(res.status).toBe(200);
      const data = await res.json() as any;
      expect(data.success).toBe(true);
    });
  });

  describe('GET /api/free-infrastructure/services/:id', () => {
    it('returns 404 when service is not in catalog', async () => {
      const env = createMockEnv();
      const req = new Request('http://localhost/api/free-infrastructure/services/nonexistent-service', { method: 'GET' });
      const res = await app.request(req, {}, env as any);

      expect(res.status).toBe(404);
      const data = await res.json() as any;
      expect(data.error).toContain('not found');
    });

    it('returns structured item strictly separating SOURCE DATA, INTELLIHIRE MAPPING, and PROVENANCE', async () => {
      const env = createMockEnv();
      const req = new Request('http://localhost/api/free-infrastructure/services/major-cloud-providers__cloudflare__workers', { method: 'GET' });
      const res = await app.request(req, {}, env as any);

      expect(res.status).toBe(200);
      const data = await res.json() as any;
      expect(data.success).toBe(true);
      expect(data.id).toBe('major-cloud-providers__cloudflare__workers');

      // 1. Source Data verification
      expect(data.source_data).toBeDefined();
      expect(data.source_data.service_name).toBe('Workers');
      expect(data.source_data.provider_name).toBe('Cloudflare');
      expect(data.source_data.limits.requests).toBe('100,000 requests/day');
      expect(data.source_data.disclosed_flags.credit_card_required).toBe(0);

      // 2. IntelliHire Mapping verification
      expect(data.intellihire_mapping).toBeDefined();
      expect(data.intellihire_mapping.modules).toContain('M2');
      expect(data.intellihire_mapping.priority).toBe('critical');
      expect(data.intellihire_mapping.recommended_role).toBeDefined();

      // 3. Provenance verification
      expect(data.provenance).toBeDefined();
      expect(data.provenance.source).toBe('free-for.dev');
      expect(data.provenance.repository).toBe('https://github.com/ripienaar/free-for-dev');
    });
  });

  describe('GET /api/free-infrastructure/categories', () => {
    it('returns category listing with item counts', async () => {
      const env = createMockEnv();
      const req = new Request('http://localhost/api/free-infrastructure/categories', { method: 'GET' });
      const res = await app.request(req, {}, env as any);

      expect(res.status).toBe(200);
      const data = await res.json() as any;
      expect(data.success).toBe(true);
      expect(Array.isArray(data.categories)).toBe(true);
      expect(data.categories.length).toBe(2);
    });
  });

  describe('POST /api/free-infrastructure/sync Auth Guard', () => {
    it('rejects unauthenticated sync requests with 401', async () => {
      const env = createMockEnv();
      const req = new Request('http://localhost/api/free-infrastructure/sync', { method: 'POST' });
      const res = await app.request(req, {}, env as any);

      expect(res.status).toBe(401);
      const data = await res.json() as any;
      expect(data.error).toBe('Unauthorized');
    });
  });
});
