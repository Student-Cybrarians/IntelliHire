import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import FreeInfrastructureDashboard from '../src/client/pages/FreeInfrastructureDashboard';

const mockSummary = {
  total_services: 1334,
  total_categories: 57,
  modules: {
    M1: 70,
    M2: 172,
    M3: 145,
    M4: 213,
    M5: 237,
    shared: 740,
  },
  traits: {
    open_source: 420,
    self_hostable: 310,
    always_free: 890,
    no_credit_card: 1050,
  },
  last_sync: {
    synced_at: '2026-10-02T12:00:00Z',
    services_count: 1334,
    categories_count: 57,
    status: 'success',
  },
};

const mockCategories = [
  { category: 'Major Cloud Providers', count: 12 },
  { category: 'APIs, Data, and ML', count: 180 },
];

const mockServices = [
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
];

const mockDetail = {
  id: 'major-cloud-providers__cloudflare__workers',
  source_data: {
    service_name: 'Workers',
    provider_name: 'Cloudflare',
    category: 'Major Cloud Providers',
    subcategory: null,
    official_url: 'https://workers.cloudflare.com',
    source_url: 'https://github.com/ripienaar/free-for-dev#major-cloud-providers',
    description: 'Serverless execution at the edge with 100,000 requests/day',
    free_tier_description: '100,000 requests/day, 10ms CPU time per request',
    free_tier_type: 'always_free',
    limits: {
      storage: null,
      requests: '100,000 requests/day',
      compute: '10ms CPU time',
      bandwidth: null,
      retention: null,
      users: null,
      projects: null,
      api: null,
    },
    disclosed_flags: {
      credit_card_required: 0,
      trial_only: 0,
      open_source: null,
      self_hostable: null,
      commercial_use: 1,
      production_allowed: 1,
      api_available: 1,
      sdk_available: 1,
      webhook_available: null,
    },
  },
  intellihire_mapping: {
    modules: ['M2', 'shared'],
    capability_tags: ['serverless_compute', 'cdn_edge'],
    priority: 'critical',
    risk_level: 'low',
    verification_status: 'verified',
    recommended_role: 'Adaptive Competency & Evaluation',
  },
  provenance: {
    source: 'free-for.dev',
    repository: 'https://github.com/ripienaar/free-for-dev',
    file: 'README.md',
    commit: 'master',
    retrievedAt: '2026-10-02T12:00:00Z',
  },
};

describe('FreeInfrastructureDashboard UI Component', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn().mockImplementation((url: string) => {
      if (url.includes('/api/auth/me')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ user: { id: 'u1', full_name: 'Admin User', role: 'org_admin' } }),
        });
      }
      if (url.includes('/api/free-infrastructure/summary')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ success: true, summary: mockSummary }),
        });
      }
      if (url.includes('/api/free-infrastructure/categories')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ success: true, categories: mockCategories }),
        });
      }
      if (url.includes('/api/free-infrastructure/services/')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockDetail),
        });
      }
      if (url.includes('/api/free-infrastructure/services')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ success: true, services: mockServices, total: 1, page: 1, totalPages: 1 }),
        });
      }
      return Promise.reject(new Error(`Unhandled URL: ${url}`));
    }));
  });

  it('renders the header and dynamic metric summary cards', async () => {
    render(
      <BrowserRouter>
        <FreeInfrastructureDashboard />
      </BrowserRouter>
    );

    expect(screen.getByText('Free Infrastructure Intelligence')).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText('1,334')).toBeInTheDocument();
      expect(screen.getByText('57')).toBeInTheDocument();
      expect(screen.getByText('Workers')).toBeInTheDocument();
    });
  });

  it('opens and inspects the Architecture Mapping detail view', async () => {
    render(
      <BrowserRouter>
        <FreeInfrastructureDashboard />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Inspect Mapping')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Inspect Mapping'));

    await waitFor(() => {
      // 1. Check Section 1: Authoritative Source Data
      expect(screen.getByText('1. Authoritative Source Data (free-for.dev)')).toBeInTheDocument();
      expect(screen.getByText('100,000 requests/day, 10ms CPU time per request')).toBeInTheDocument();

      // 2. Check Section 2: Architecture Mapping
      expect(screen.getByText('2. IntelliHire Architecture Mapping')).toBeInTheDocument();
      expect(screen.getByText('Adaptive Competency & Evaluation')).toBeInTheDocument();
      expect(screen.getByText('#serverless_compute')).toBeInTheDocument();

      // 3. Check Section 3: Data Provenance
      expect(screen.getByText('3. Data Provenance & Verification Audit')).toBeInTheDocument();
      expect(screen.getByText('ripienaar/free-for-dev')).toBeInTheDocument();
    });
  });
});
