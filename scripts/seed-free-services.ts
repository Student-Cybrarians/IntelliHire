/**
 * Ingestion and Seeding Script for Free-for.dev Catalog
 * Ingests live README.md, parses it into FreeServiceRecords, and generates SQL seed for D1.
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import { parseFreeForDevMarkdown, FreeServiceRecord } from '../src/shared/freeServiceParser';

function escapeSql(str: string | null | undefined): string {
  if (str === null || str === undefined) return 'NULL';
  return `'${String(str).replace(/'/g, "''")}'`;
}

function escapeSqlNum(num: number | null | undefined): string {
  if (num === null || num === undefined) return 'NULL';
  return String(num);
}

async function main() {
  console.log('Fetching live free-for-dev README.md...');
  const res = await fetch('https://raw.githubusercontent.com/ripienaar/free-for-dev/master/README.md');
  if (!res.ok) {
    throw new Error(`Failed to fetch source: ${res.status} ${res.statusText}`);
  }
  const markdown = await res.text();
  console.log(`Fetched ${markdown.length} bytes of markdown.`);

  const parseResult = parseFreeForDevMarkdown(markdown, 'master');
  console.log(`Successfully parsed ${parseResult.services.length} services across ${parseResult.categories.length} categories.`);
  console.log('Module Breakdown:', parseResult.stats);

  const sqlStatements: string[] = [];
  sqlStatements.push('-- Auto-generated Free-for.dev Catalog Seed\n');

  for (const s of parseResult.services) {
    const stmt = `INSERT OR REPLACE INTO free_service_catalog (
      id, provider_name, service_name, category, subcategory,
      official_url, source_url, description, free_tier_description, free_tier_type,
      quota, quota_unit, quota_period,
      storage_limit, request_limit, compute_limit, bandwidth_limit, retention_limit, user_limit, project_limit, api_limit,
      credit_card_required, trial_only, open_source, self_hostable, commercial_use, production_allowed,
      api_available, sdk_available, webhook_available,
      intellihire_modules_json, capability_tags_json, priority, risk_level, verification_status,
      source_provenance_json, updated_at
    ) VALUES (
      ${escapeSql(s.id)},
      ${escapeSql(s.provider_name)},
      ${escapeSql(s.service_name)},
      ${escapeSql(s.category)},
      ${escapeSql(s.subcategory)},
      ${escapeSql(s.official_url)},
      ${escapeSql(s.source_url)},
      ${escapeSql(s.description)},
      ${escapeSql(s.free_tier_description)},
      ${escapeSql(s.free_tier_type)},
      ${escapeSqlNum(s.quota)},
      ${escapeSql(s.quota_unit)},
      ${escapeSql(s.quota_period)},
      ${escapeSql(s.storage_limit)},
      ${escapeSql(s.request_limit)},
      ${escapeSql(s.compute_limit)},
      ${escapeSql(s.bandwidth_limit)},
      ${escapeSql(s.retention_limit)},
      ${escapeSql(s.user_limit)},
      ${escapeSql(s.project_limit)},
      ${escapeSql(s.api_limit)},
      ${escapeSqlNum(s.credit_card_required)},
      ${escapeSqlNum(s.trial_only)},
      ${escapeSqlNum(s.open_source)},
      ${escapeSqlNum(s.self_hostable)},
      ${escapeSqlNum(s.commercial_use)},
      ${escapeSqlNum(s.production_allowed)},
      ${escapeSqlNum(s.api_available)},
      ${escapeSqlNum(s.sdk_available)},
      ${escapeSqlNum(s.webhook_available)},
      ${escapeSql(s.intellihire_modules_json)},
      ${escapeSql(s.capability_tags_json)},
      ${escapeSql(s.priority)},
      ${escapeSql(s.risk_level)},
      ${escapeSql(s.verification_status)},
      ${escapeSql(s.source_provenance_json)},
      CURRENT_TIMESTAMP
    );`;
    sqlStatements.push(stmt);
  }

  // Insert sync log
  const syncLogId = 'sync_' + Date.now();
  sqlStatements.push(`INSERT INTO free_service_sync_log (
    id, source_commit, services_count, categories_count, status
  ) VALUES (
    ${escapeSql(syncLogId)},
    'master',
    ${parseResult.services.length},
    ${parseResult.categories.length},
    'success'
  );`);

  const outDir = path.resolve(process.cwd(), 'scripts');
  const outFile = path.join(outDir, 'seed_catalog.sql');
  fs.writeFileSync(outFile, sqlStatements.join('\n\n'), 'utf-8');
  console.log(`Wrote SQL seed script to ${outFile} (${sqlStatements.length} statements).`);
}

main().catch(err => {
  console.error('Seeding failed:', err);
  process.exit(1);
});
