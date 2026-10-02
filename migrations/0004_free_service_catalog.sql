-- Migration 0004: Free-for.dev Infrastructure Intelligence Catalog
-- Implements Phase 1 Catalog Schema for tracking and mapping external cloud/developer free tiers

CREATE TABLE IF NOT EXISTS free_service_catalog (
    id TEXT PRIMARY KEY,
    provider_name TEXT,
    service_name TEXT NOT NULL,
    category TEXT NOT NULL,
    subcategory TEXT,
    official_url TEXT,
    source_url TEXT,
    description TEXT NOT NULL,
    free_tier_description TEXT,
    free_tier_type TEXT NOT NULL DEFAULT 'unknown',
    quota REAL,
    quota_unit TEXT,
    quota_period TEXT,
    storage_limit TEXT,
    request_limit TEXT,
    compute_limit TEXT,
    bandwidth_limit TEXT,
    retention_limit TEXT,
    user_limit TEXT,
    project_limit TEXT,
    api_limit TEXT,
    credit_card_required INTEGER,
    trial_only INTEGER,
    open_source INTEGER,
    self_hostable INTEGER,
    commercial_use INTEGER,
    production_allowed INTEGER,
    api_available INTEGER,
    sdk_available INTEGER,
    webhook_available INTEGER,
    intellihire_modules_json TEXT NOT NULL DEFAULT '[]',
    capability_tags_json TEXT NOT NULL DEFAULT '[]',
    priority TEXT NOT NULL DEFAULT 'medium',
    risk_level TEXT NOT NULL DEFAULT 'low',
    verification_status TEXT NOT NULL DEFAULT 'unverified',
    source_provenance_json TEXT NOT NULL DEFAULT '{}',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_fsc_category ON free_service_catalog (category);
CREATE INDEX IF NOT EXISTS idx_fsc_subcategory ON free_service_catalog (subcategory);
CREATE INDEX IF NOT EXISTS idx_fsc_provider ON free_service_catalog (provider_name);
CREATE INDEX IF NOT EXISTS idx_fsc_service ON free_service_catalog (service_name);
CREATE INDEX IF NOT EXISTS idx_fsc_tier_type ON free_service_catalog (free_tier_type);
CREATE INDEX IF NOT EXISTS idx_fsc_priority ON free_service_catalog (priority);
CREATE INDEX IF NOT EXISTS idx_fsc_open_source ON free_service_catalog (open_source);
CREATE INDEX IF NOT EXISTS idx_fsc_self_hostable ON free_service_catalog (self_hostable);

CREATE TABLE IF NOT EXISTS free_service_sync_log (
    id TEXT PRIMARY KEY,
    synced_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    source_commit TEXT,
    services_count INTEGER NOT NULL DEFAULT 0,
    categories_count INTEGER NOT NULL DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'success',
    error_message TEXT
);
