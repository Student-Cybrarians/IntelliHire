import { Hono } from 'hono';
import { getCookie } from 'hono/cookie';
import { verify } from 'hono/jwt';
import { parseFreeForDevMarkdown } from '../../src/shared/freeServiceParser';

type Bindings = {
  DB: D1Database;
  SESSION_KV: KVNamespace;
  JWT_SECRET: string;
};

type UserSession = {
  id: string;
  email: string;
  full_name: string;
  role: string;
  organization_id?: string;
};

export const freeInfrastructureRouter = new Hono<{ Bindings: Bindings }>();

const getSessionUser = async (c: any): Promise<UserSession | null> => {
  const sessionId = getCookie(c, 'intellihire_session');
  if (!sessionId) return null;
  const jwt = await c.env.SESSION_KV.get(`session:${sessionId}`);
  if (!jwt) return null;
  try {
    return (await verify(jwt, c.env.JWT_SECRET, 'HS256')) as UserSession;
  } catch {
    return null;
  }
};

// 1. GET /free-infrastructure/summary
freeInfrastructureRouter.get('/summary', async (c) => {
  try {
    const totalServices = await c.env.DB.prepare('SELECT COUNT(*) as count FROM free_service_catalog').first();
    const totalCategories = await c.env.DB.prepare('SELECT COUNT(DISTINCT category) as count FROM free_service_catalog').first();

    const m1Count = await c.env.DB.prepare("SELECT COUNT(*) as count FROM free_service_catalog WHERE intellihire_modules_json LIKE '%\"M1\"%'").first();
    const m2Count = await c.env.DB.prepare("SELECT COUNT(*) as count FROM free_service_catalog WHERE intellihire_modules_json LIKE '%\"M2\"%'").first();
    const m3Count = await c.env.DB.prepare("SELECT COUNT(*) as count FROM free_service_catalog WHERE intellihire_modules_json LIKE '%\"M3\"%'").first();
    const m4Count = await c.env.DB.prepare("SELECT COUNT(*) as count FROM free_service_catalog WHERE intellihire_modules_json LIKE '%\"M4\"%'").first();
    const m5Count = await c.env.DB.prepare("SELECT COUNT(*) as count FROM free_service_catalog WHERE intellihire_modules_json LIKE '%\"M5\"%'").first();
    const sharedCount = await c.env.DB.prepare("SELECT COUNT(*) as count FROM free_service_catalog WHERE intellihire_modules_json LIKE '%\"shared\"%'").first();

    const openSourceCount = await c.env.DB.prepare('SELECT COUNT(*) as count FROM free_service_catalog WHERE open_source = 1').first();
    const selfHostableCount = await c.env.DB.prepare('SELECT COUNT(*) as count FROM free_service_catalog WHERE self_hostable = 1').first();
    const alwaysFreeCount = await c.env.DB.prepare("SELECT COUNT(*) as count FROM free_service_catalog WHERE free_tier_type = 'always_free'").first();
    const noCreditCardCount = await c.env.DB.prepare('SELECT COUNT(*) as count FROM free_service_catalog WHERE credit_card_required = 0').first();

    const lastSync = await c.env.DB.prepare('SELECT synced_at, services_count, categories_count, status FROM free_service_sync_log ORDER BY synced_at DESC LIMIT 1').first();

    return c.json({
      success: true,
      summary: {
        total_services: Number(totalServices?.count || 0),
        total_categories: Number(totalCategories?.count || 0),
        modules: {
          M1: Number(m1Count?.count || 0),
          M2: Number(m2Count?.count || 0),
          M3: Number(m3Count?.count || 0),
          M4: Number(m4Count?.count || 0),
          M5: Number(m5Count?.count || 0),
          shared: Number(sharedCount?.count || 0),
        },
        traits: {
          open_source: Number(openSourceCount?.count || 0),
          self_hostable: Number(selfHostableCount?.count || 0),
          always_free: Number(alwaysFreeCount?.count || 0),
          no_credit_card: Number(noCreditCardCount?.count || 0),
        },
        last_sync: lastSync || null,
      },
    });
  } catch (err: any) {
    return c.json({ error: 'Failed to retrieve summary metrics', details: err.message }, 500);
  }
});

// 2. GET /free-infrastructure/services
freeInfrastructureRouter.get('/services', async (c) => {
  try {
    const q = (c.req.query('q') || '').trim();
    const category = c.req.query('category');
    const moduleFilter = c.req.query('module');
    const freeTierType = c.req.query('free_tier_type');
    const priority = c.req.query('priority');
    const openSource = c.req.query('open_source');
    const selfHostable = c.req.query('self_hostable');
    const noCreditCard = c.req.query('no_credit_card');
    const page = Math.max(1, parseInt(c.req.query('page') || '1', 10));
    const limit = Math.min(100, Math.max(1, parseInt(c.req.query('limit') || '24', 10)));
    const offset = (page - 1) * limit;

    const whereClauses: string[] = ['1=1'];
    const params: any[] = [];

    if (q) {
      whereClauses.push('(service_name LIKE ? OR provider_name LIKE ? OR description LIKE ? OR capability_tags_json LIKE ?)');
      const term = `%${q}%`;
      params.push(term, term, term, term);
    }

    if (category && category !== 'all') {
      whereClauses.push('category = ?');
      params.push(category);
    }

    if (moduleFilter && moduleFilter !== 'all') {
      whereClauses.push('intellihire_modules_json LIKE ?');
      params.push(`%"${moduleFilter}"%`);
    }

    if (freeTierType && freeTierType !== 'all') {
      whereClauses.push('free_tier_type = ?');
      params.push(freeTierType);
    }

    if (priority && priority !== 'all') {
      whereClauses.push('priority = ?');
      params.push(priority);
    }

    if (openSource === '1') {
      whereClauses.push('open_source = 1');
    }

    if (selfHostable === '1') {
      whereClauses.push('self_hostable = 1');
    }

    if (noCreditCard === '1') {
      whereClauses.push('credit_card_required = 0');
    }

    const whereSql = whereClauses.join(' AND ');

    // Count total matching
    const countSql = `SELECT COUNT(*) as count FROM free_service_catalog WHERE ${whereSql}`;
    const countStmt = c.env.DB.prepare(countSql);
    const countResult = await (params.length > 0 ? countStmt.bind(...params) : countStmt).first();
    const total = Number(countResult?.count || 0);

    // Fetch page of services
    const dataSql = `SELECT * FROM free_service_catalog WHERE ${whereSql} ORDER BY CASE priority WHEN 'critical' THEN 1 WHEN 'high' THEN 2 WHEN 'medium' THEN 3 ELSE 4 END, service_name ASC LIMIT ? OFFSET ?`;
    const dataStmt = c.env.DB.prepare(dataSql);
    const queryParams = [...params, limit, offset];
    const dataResult = await dataStmt.bind(...queryParams).all();

    return c.json({
      success: true,
      services: dataResult.results,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    });
  } catch (err: any) {
    return c.json({ error: 'Failed to retrieve services', details: err.message }, 500);
  }
});

// 3. GET /free-infrastructure/services/:id
freeInfrastructureRouter.get('/services/:id', async (c) => {
  try {
    const id = c.req.param('id');
    const service: any = await c.env.DB.prepare('SELECT * FROM free_service_catalog WHERE id = ?').bind(id).first();
    if (!service) {
      return c.json({ error: 'Service not found in free infrastructure catalog' }, 404);
    }

    // Explicit structural separation between SOURCE DATA and INTELLIHIRE MAPPING
    const modules = JSON.parse(service.intellihire_modules_json || '[]');
    const capabilityTags = JSON.parse(service.capability_tags_json || '[]');
    const provenance = JSON.parse(service.source_provenance_json || '{}');

    return c.json({
      success: true,
      id: service.id,
      source_data: {
        service_name: service.service_name,
        provider_name: service.provider_name,
        category: service.category,
        subcategory: service.subcategory,
        official_url: service.official_url,
        source_url: service.source_url,
        description: service.description,
        free_tier_description: service.free_tier_description,
        free_tier_type: service.free_tier_type,
        limits: {
          storage: service.storage_limit,
          requests: service.request_limit,
          compute: service.compute_limit,
          bandwidth: service.bandwidth_limit,
          retention: service.retention_limit,
          users: service.user_limit,
          projects: service.project_limit,
          api: service.api_limit,
        },
        disclosed_flags: {
          credit_card_required: service.credit_card_required,
          trial_only: service.trial_only,
          open_source: service.open_source,
          self_hostable: service.self_hostable,
          commercial_use: service.commercial_use,
          production_allowed: service.production_allowed,
          api_available: service.api_available,
          sdk_available: service.sdk_available,
          webhook_available: service.webhook_available,
        },
      },
      intellihire_mapping: {
        modules,
        capability_tags: capabilityTags,
        priority: service.priority,
        risk_level: service.risk_level,
        verification_status: service.verification_status,
        recommended_role: modules.includes('M1') ? 'Document Extraction & Parsing' :
                          modules.includes('M2') ? 'Adaptive Competency & Evaluation' :
                          modules.includes('M3') ? 'Requisition Search & Data Storage' :
                          modules.includes('M4') ? 'Interview Media & Streaming' :
                          modules.includes('M5') ? 'Analytics, Audit & Governance' : 'Shared Cloud Infrastructure',
      },
      provenance,
    });
  } catch (err: any) {
    return c.json({ error: 'Failed to retrieve service detail', details: err.message }, 500);
  }
});

// 4. GET /free-infrastructure/categories
freeInfrastructureRouter.get('/categories', async (c) => {
  try {
    const results = await c.env.DB.prepare(`
      SELECT category, COUNT(*) as count 
      FROM free_service_catalog 
      GROUP BY category 
      ORDER BY category ASC
    `).all();
    return c.json({ success: true, categories: results.results });
  } catch (err: any) {
    return c.json({ error: 'Failed to retrieve categories', details: err.message }, 500);
  }
});

// 5. POST /free-infrastructure/sync
freeInfrastructureRouter.post('/sync', async (c) => {
  const user = await getSessionUser(c);
  if (!user) return c.json({ error: 'Unauthorized' }, 401);

  try {
    const res = await fetch('https://raw.githubusercontent.com/ripienaar/free-for-dev/master/README.md');
    if (!res.ok) {
      return c.json({ error: `Upstream fetch failed: ${res.statusText}` }, 502);
    }
    const markdown = await res.text();
    const parseResult = parseFreeForDevMarkdown(markdown, 'master');

    // Batch upsert in chunks of 50
    const chunkSize = 50;
    for (let i = 0; i < parseResult.services.length; i += chunkSize) {
      const chunk = parseResult.services.slice(i, i + chunkSize);
      const stmts = chunk.map(s => {
        return c.env.DB.prepare(`
          INSERT INTO free_service_catalog (
            id, provider_name, service_name, category, subcategory,
            official_url, source_url, description, free_tier_description, free_tier_type,
            storage_limit, request_limit, compute_limit, bandwidth_limit, retention_limit, user_limit, project_limit, api_limit,
            credit_card_required, trial_only, open_source, self_hostable, commercial_use, production_allowed,
            api_available, sdk_available, webhook_available,
            intellihire_modules_json, capability_tags_json, priority, risk_level, verification_status,
            source_provenance_json, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
          ON CONFLICT(id) DO UPDATE SET
            description = excluded.description,
            free_tier_description = excluded.free_tier_description,
            free_tier_type = excluded.free_tier_type,
            storage_limit = excluded.storage_limit,
            request_limit = excluded.request_limit,
            compute_limit = excluded.compute_limit,
            bandwidth_limit = excluded.bandwidth_limit,
            retention_limit = excluded.retention_limit,
            user_limit = excluded.user_limit,
            project_limit = excluded.project_limit,
            api_limit = excluded.api_limit,
            credit_card_required = excluded.credit_card_required,
            trial_only = excluded.trial_only,
            open_source = excluded.open_source,
            self_hostable = excluded.self_hostable,
            commercial_use = excluded.commercial_use,
            production_allowed = excluded.production_allowed,
            api_available = excluded.api_available,
            sdk_available = excluded.sdk_available,
            webhook_available = excluded.webhook_available,
            intellihire_modules_json = excluded.intellihire_modules_json,
            capability_tags_json = excluded.capability_tags_json,
            priority = excluded.priority,
            risk_level = excluded.risk_level,
            updated_at = CURRENT_TIMESTAMP
        `).bind(
          s.id, s.provider_name, s.service_name, s.category, s.subcategory,
          s.official_url, s.source_url, s.description, s.free_tier_description, s.free_tier_type,
          s.storage_limit, s.request_limit, s.compute_limit, s.bandwidth_limit, s.retention_limit, s.user_limit, s.project_limit, s.api_limit,
          s.credit_card_required, s.trial_only, s.open_source, s.self_hostable, s.commercial_use, s.production_allowed,
          s.api_available, s.sdk_available, s.webhook_available,
          s.intellihire_modules_json, s.capability_tags_json, s.priority, s.risk_level, s.verification_status,
          s.source_provenance_json
        );
      });
      await c.env.DB.batch(stmts);
    }

    const syncLogId = 'sync_' + Date.now();
    await c.env.DB.prepare(`
      INSERT INTO free_service_sync_log (id, source_commit, services_count, categories_count, status)
      VALUES (?, 'master', ?, ?, 'success')
    `).bind(syncLogId, parseResult.services.length, parseResult.categories.length).run();

    return c.json({
      success: true,
      synced_at: new Date().toISOString(),
      services_count: parseResult.services.length,
      categories_count: parseResult.categories.length,
      stats: parseResult.stats,
    });
  } catch (err: any) {
    return c.json({ error: 'Sync failed', details: err.message }, 500);
  }
});
