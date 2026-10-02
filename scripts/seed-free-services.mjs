// scripts/seed-free-services.ts
import * as fs from "node:fs";
import * as path from "node:path";

// src/shared/freeServiceParser.ts
function generateServiceId(category, provider, name) {
  const parts = [
    category,
    provider || "",
    name
  ].map((s) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "")).filter(Boolean);
  return parts.join("__") || "service-" + Math.random().toString(36).substring(2, 9);
}
function extractLimits(text) {
  const limits = {
    storage_limit: null,
    request_limit: null,
    compute_limit: null,
    bandwidth_limit: null,
    retention_limit: null,
    user_limit: null,
    project_limit: null,
    api_limit: null
  };
  const storageMatch = text.match(/\b(\d+(?:\.\d+)?\s*(?:[Gg][Bb]|[Mm][Bb]|[Tt][Bb]|[Pp][Bb]))\s*(?:storage|disk|SSD|space|database|file|blob|data)?\b/);
  if (storageMatch) limits.storage_limit = storageMatch[1].trim();
  const reqMatch = text.match(/\b(\d+(?:[,\.]\d+)?\s*(?:k|m|million|thousand)?\s*(?:requests?|reqs?|queries|calls|invocations|runs|api calls|hits|visits)(?:\s*(?:\/|per)\s*(?:month|mo|day|sec|second|hour))?)\b/i);
  if (reqMatch) limits.request_limit = reqMatch[1].trim();
  const computeMatch = text.match(/\b(\d+(?:\.\d+)?\s*(?:hours?|hrs?|vCPU|vCPUs|cores?|RAM|MB RAM|GB RAM|instances?|compute units?)(?:\s*(?:\/|per)\s*(?:month|mo))?)\b/i);
  if (computeMatch) limits.compute_limit = computeMatch[1].trim();
  const bwMatch = text.match(/\b(\d+(?:\.\d+)?\s*(?:[Gg][Bb]|[Mm][Bb]|[Tt][Bb])\s*(?:bandwidth|transfer|egress|traffic|data transfer)(?:\s*(?:\/|per)\s*(?:month|mo))?)\b/i);
  if (bwMatch) limits.bandwidth_limit = bwMatch[1].trim();
  const retMatch = text.match(/\b(\d+\s*(?:days?|months?|weeks?|hours?)\s*(?:data\s*)?(?:retention|history|logs))\b/i);
  if (retMatch) limits.retention_limit = retMatch[1].trim();
  const userMatch = text.match(/\b((?:up to\s*)?\d+\s*(?:users?|team members?|seats?|collaborators?|accounts?|members?))\b/i);
  if (userMatch) limits.user_limit = userMatch[1].trim();
  const projMatch = text.match(/\b((?:up to\s*)?\d+\s*(?:projects?|apps?|applications?|databases?|domains?|websites?|sites?))\b/i);
  if (projMatch) limits.project_limit = projMatch[1].trim();
  const apiMatch = text.match(/\b(\d+(?:[,\.]\d+)?\s*(?:calls?|requests?|reqs?)\s*(?:\/|\s*per\s*)(?:day|minute|min|sec|second|hour))\b/i);
  if (apiMatch) limits.api_limit = apiMatch[1].trim();
  return limits;
}
function detectFreeTierType(text, tags) {
  const lower = text.toLowerCase();
  const hasTag = (tag) => tags.some((t) => t.toLowerCase().includes(tag));
  if (hasTag("open source") || hasTag("self-hosted")) {
    return "open_source";
  }
  if (lower.includes("$") || lower.includes("credit") || lower.includes("credits")) {
    return "credits";
  }
  if (hasTag("free trial") || lower.includes("free trial") || lower.includes("30-day trial") || lower.includes("14-day trial") || lower.includes("trial period")) {
    return "free_trial";
  }
  if (lower.includes("always free") || lower.includes("forever free") || lower.includes("free forever")) {
    return "always_free";
  }
  if (lower.includes("open source") || lower.includes("self-hosted")) {
    return "open_source";
  }
  if (lower.includes("free tier") || lower.includes("free plan") || lower.includes("free up to") || lower.includes("/mo") || lower.includes("free for")) {
    return "freemium";
  }
  return "unknown";
}
function extractFlags(text, tags, category) {
  const lower = text.toLowerCase();
  const hasTag = (tag) => tags.some((t) => t.toLowerCase().includes(tag));
  let credit_card_required = null;
  if (/no\s+credit\s+card(?:\s+required)?|without\s+credit\s+card|doesn't\s+require\s+(?:a\s+)?credit\s+card/i.test(lower)) {
    credit_card_required = 0;
  } else if (/requires?\s+(?:a\s+)?credit\s+card|credit\s+card\s+required|\bcc\s+required\b/i.test(lower)) {
    credit_card_required = 1;
  }
  let trial_only = null;
  if (hasTag("free trial") || /\btrial\s+only\b|(?:\d+[- ]day\s+trial)/i.test(lower)) {
    trial_only = 1;
  } else if (/always\s+free|forever\s+free|free\s+forever|free\s+plan|free\s+tier/i.test(lower)) {
    trial_only = 0;
  }
  let open_source = null;
  if (hasTag("open source") || /\bopen[- ]source\b|\bsource available\b|github\.com/i.test(lower)) {
    open_source = 1;
  }
  let self_hostable = null;
  if (hasTag("self-hosted") || /\bself[- ]hostable\b|\bself[- ]host\b|\bon[- ]premise\b/i.test(lower)) {
    self_hostable = 1;
  }
  let commercial_use = null;
  if (/commercial\s+use\s+allowed|free\s+for\s+commercial/i.test(lower)) {
    commercial_use = 1;
  } else if (/non[- ]commercial\s+only|personal\s+use\s+only/i.test(lower)) {
    commercial_use = 0;
  }
  let production_allowed = null;
  if (/production\s+ready|for\s+production/i.test(lower)) {
    production_allowed = 1;
  } else if (/non[- ]production\s+only|testing\s+only|dev\s+only/i.test(lower)) {
    production_allowed = 0;
  }
  let api_available = null;
  if (category.toLowerCase().includes("api") || /\b(?:rest|graphql|public)?\s*api\b/i.test(lower)) {
    api_available = 1;
  }
  let sdk_available = null;
  if (/\b(?:sdk|client library|python library|npm package|node\.js package)\b/i.test(lower)) {
    sdk_available = 1;
  }
  let webhook_available = null;
  if (/\bwebhooks?\b/i.test(lower)) {
    webhook_available = 1;
  }
  return {
    credit_card_required,
    trial_only,
    open_source,
    self_hostable,
    commercial_use,
    production_allowed,
    api_available,
    sdk_available,
    webhook_available
  };
}
function calculatePriority(name, modules, description, provider) {
  const n = name.toLowerCase();
  const p = (provider || "").toLowerCase();
  const criticalVendors = [
    "cloudflare",
    "github",
    "turso",
    "supabase",
    "neon",
    "upstash",
    "resend",
    "sentry",
    "posthog",
    "meilisearch",
    "typesense",
    "fly.io",
    "vercel",
    "google cloud",
    "aws"
  ];
  if (criticalVendors.some((v) => n.includes(v) || p.includes(v))) {
    return "critical";
  }
  if (modules.includes("M1") || modules.includes("M2") || modules.includes("M3") || modules.includes("M4")) {
    if (/database|llm|storage|auth|webrtc|vector/i.test(description)) {
      return "high";
    }
  }
  if (modules.includes("M5") || modules.includes("shared")) {
    return "medium";
  }
  return "low";
}
function mapIntelliHireModules(category, subcategory, name, description) {
  const modules = /* @__PURE__ */ new Set();
  const cat = category.toLowerCase();
  const sub = (subcategory || "").toLowerCase();
  const text = `${name} ${description}`.toLowerCase();
  if (cat.includes("document") || cat.includes("font") || cat.includes("translation") || /\b(ocr|pdf|document|parse|parsing|parser|resume|extract|extraction|cv|vector|embedding|embeddings|text analysis|nlp|semantic search)\b/i.test(text)) {
    modules.add("M1");
  }
  if (cat.includes("generative ai") || cat.includes("ai") || cat.includes("testing") || cat.includes("code quality") || /\b(llm|generative ai|openai|anthropic|code execution|sandbox|rubric|assessment|scoring|grading|speech|transcription|voice evaluation|quiz|proctoring)\b/i.test(text)) {
    modules.add("M2");
  }
  if (cat.includes("database") || cat.includes("baas") || cat.includes("search") || cat.includes("messaging and streaming") || cat.includes("queue") || /\b(database|sql|postgres|sqlite|mysql|search|elasticsearch|meilisearch|typesense|indexing|queue|kafka|rabbitmq|redis|cache|pubsub|workflow)\b/i.test(text)) {
    modules.add("M3");
  }
  if (cat.includes("webrtc") || cat.includes("email") || cat.includes("sms") || cat.includes("communication") || cat.includes("calendar") || /\b(webrtc|video|audio stream|stun|turn|stream|transcription|speech-to-text|calendar|scheduling|emails?|smtp|mail(?:ings?)?|notifications?|push notification|telephony)\b/i.test(text)) {
    modules.add("M4");
  }
  if (cat.includes("log management") || cat.includes("analytics") || cat.includes("crash") || cat.includes("monitoring") || cat.includes("security") || /\b(analytics|telemetry|metrics|tracing|logging|log|audit|observability|monitoring|dashboard|reporting|compliance|governance|alerting|apm)\b/i.test(text)) {
    modules.add("M5");
  }
  if (cat.includes("major cloud providers") || cat.includes("authentication") || cat.includes("storage") || cat.includes("cdn") || cat.includes("dns") || cat.includes("ci and cd") || cat.includes("hosting") || cat.includes("paas") || cat.includes("iaas") || cat.includes("serverless") || cat.includes("source code") || cat.includes("secrets") || cat.includes("waf") || modules.size === 0) {
    modules.add("shared");
  }
  return Array.from(modules);
}
function extractCapabilityTags(category, subcategory, name, description) {
  const tags = /* @__PURE__ */ new Set();
  const text = `${category} ${subcategory || ""} ${name} ${description}`.toLowerCase();
  const mapping = {
    "authentication": /\b(auth|oauth|jwt|identity|sso|login)\b/i,
    "object_storage": /\b(storage|s3|r2|blob|file upload)\b/i,
    "relational_database": /\b(sql|postgres|sqlite|mysql|cockroach|neon|turso)\b/i,
    "document_database": /\b(mongodb|nosql|firestore|document store)\b/i,
    "vector_search": /\b(vector|embedding|semantic search|pinecone|qdrant|weaviate|chroma)\b/i,
    "llm_inference": /\b(llm|gpt|claude|gemini|groq|inference|openai|huggingface)\b/i,
    "code_sandbox": /\b(code execution|sandbox|compiler|runner|docker|container)\b/i,
    "webrtc_video": /\b(webrtc|video call|streaming|media server|stun|turn)\b/i,
    "email_delivery": /\b(email|smtp|transactional email|sendgrid|resend|mailgun)\b/i,
    "messaging_queue": /\b(queue|kafka|rabbitmq|pubsub|redis|event stream)\b/i,
    "observability_logging": /\b(logging|logs|telemetry|metrics|sentry|datadog|grafana|apm)\b/i,
    "ci_cd_automation": /\b(ci\/cd|pipeline|github actions|build|deploy)\b/i,
    "serverless_compute": /\b(serverless|workers|lambda|cloud functions|edge compute)\b/i,
    "ocr_parsing": /\b(ocr|pdf parsing|document extraction|tesseract)\b/i,
    "audio_speech": /\b(speech|transcription|whisper|tts|stt|audio)\b/i,
    "cdn_edge": /\b(cdn|edge|cloudflare|fastly|akamai|caching)\b/i,
    "dns_domains": /\b(dns|domain|nameserver)\b/i,
    "secrets_vault": /\b(secrets|vault|kms|key management)\b/i
  };
  for (const [tag, regex] of Object.entries(mapping)) {
    if (regex.test(text)) {
      tags.add(tag);
    }
  }
  const catTag = category.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "");
  if (catTag) tags.add(catTag);
  return Array.from(tags);
}
function calculateRiskLevel(text, creditCardReq, trialOnly) {
  if (trialOnly === 1) return "high";
  if (creditCardReq === 1) return "medium";
  if (/deprecated|discontinued|unmaintained|beta|preview/i.test(text)) return "high";
  return "low";
}
function parseFreeForDevMarkdown(markdown, sourceCommit = "master") {
  const lines = markdown.split(/\r?\n/);
  const services = [];
  const categoriesSet = /* @__PURE__ */ new Set();
  let currentCategory = "";
  let currentSubcategory = null;
  let currentProvider = null;
  let currentProviderUrl = null;
  const mCount = { m1: 0, m2: 0, m3: 0, m4: 0, m5: 0, shared: 0 };
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();
    const catMatch = line.match(/^##\s+(.+)$/);
    if (catMatch) {
      const heading = catMatch[1].trim();
      if (/table of contents|license|contributing|sponsors/i.test(heading)) {
        currentCategory = "";
        currentSubcategory = null;
        currentProvider = null;
        continue;
      }
      currentCategory = heading;
      currentSubcategory = null;
      currentProvider = null;
      categoriesSet.add(currentCategory);
      continue;
    }
    if (!currentCategory) continue;
    const subMatch = line.match(/^###\s+(.+)$/);
    if (subMatch) {
      currentSubcategory = subMatch[1].trim();
      currentProvider = null;
      continue;
    }
    if (currentCategory.toLowerCase() === "major cloud providers") {
      const providerOnlyMatch = line.match(/^\s*\*\s+\[([^\]]+)\]\(([^)]+)\)\s*$/);
      if (providerOnlyMatch) {
        currentProvider = providerOnlyMatch[1].trim();
        currentProviderUrl = providerOnlyMatch[2].trim();
        continue;
      }
      const nestedMatch = line.match(/^\s*\*\s+(?:\[([^\]]+)\]\(([^)]+)\)|([^-\s:][^-\n:]*?))\s*(?:-\s*(.*)|:\s*(.*))?$/);
      if (nestedMatch && currentProvider) {
        const serviceName = (nestedMatch[1] || nestedMatch[3] || "").trim();
        const serviceUrl = nestedMatch[2] ? nestedMatch[2].trim() : currentProviderUrl;
        const description = (nestedMatch[4] || nestedMatch[5] || "").trim();
        if (serviceName && !/full,?\s*detailed\s*list/i.test(serviceName)) {
          const limits = extractLimits(description);
          const flags = extractFlags(description, [], currentCategory);
          const tierType = detectFreeTierType(description, []);
          const modules = mapIntelliHireModules(currentCategory, currentSubcategory, serviceName, description);
          const capTags = extractCapabilityTags(currentCategory, currentSubcategory, serviceName, description);
          const priority = calculatePriority(serviceName, modules, description, currentProvider);
          const riskLevel = calculateRiskLevel(description, flags.credit_card_required, flags.trial_only);
          const id = generateServiceId(currentCategory, currentProvider, serviceName);
          const record = {
            id,
            provider_name: currentProvider,
            service_name: serviceName,
            category: currentCategory,
            subcategory: currentSubcategory,
            official_url: serviceUrl,
            source_url: `https://github.com/ripienaar/free-for-dev#${currentCategory.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`,
            description: description || serviceName,
            free_tier_description: description || serviceName,
            free_tier_type: tierType,
            quota: null,
            quota_unit: null,
            quota_period: null,
            ...limits,
            ...flags,
            intellihire_modules_json: JSON.stringify(modules),
            capability_tags_json: JSON.stringify(capTags),
            priority,
            risk_level: riskLevel,
            verification_status: "unverified",
            source_provenance_json: JSON.stringify({
              source: "free-for.dev",
              repository: "https://github.com/ripienaar/free-for-dev",
              file: "README.md",
              commit: sourceCommit,
              retrievedAt: (/* @__PURE__ */ new Date()).toISOString(),
              sourceUrl: serviceUrl
            })
          };
          services.push(record);
          if (modules.includes("M1")) mCount.m1++;
          if (modules.includes("M2")) mCount.m2++;
          if (modules.includes("M3")) mCount.m3++;
          if (modules.includes("M4")) mCount.m4++;
          if (modules.includes("M5")) mCount.m5++;
          if (modules.includes("shared")) mCount.shared++;
        }
        continue;
      }
    }
    const standardMatch = line.match(/^\s*\*\s+\[([^\]]+)\]\(([^)]+)\)(.*)$/);
    if (standardMatch) {
      const serviceName = standardMatch[1].trim();
      const serviceUrl = standardMatch[2].trim();
      const remainder = standardMatch[3].trim();
      const tags = [];
      const tagMatches = remainder.matchAll(/\[([^\]]+)\]/g);
      for (const tm of tagMatches) {
        tags.push(tm[1].trim());
      }
      let descPart = remainder.replace(/(?:\[[^\]]+\]\s*)+/, "").trim();
      if (descPart.startsWith("-") || descPart.startsWith(":")) {
        descPart = descPart.substring(1).trim();
      }
      const description = descPart || serviceName;
      const limits = extractLimits(description);
      const flags = extractFlags(description, tags, currentCategory);
      const tierType = detectFreeTierType(description, tags);
      const modules = mapIntelliHireModules(currentCategory, currentSubcategory, serviceName, description);
      const capTags = extractCapabilityTags(currentCategory, currentSubcategory, serviceName, description);
      const priority = calculatePriority(serviceName, modules, description);
      const riskLevel = calculateRiskLevel(description, flags.credit_card_required, flags.trial_only);
      const id = generateServiceId(currentCategory, null, serviceName);
      const record = {
        id,
        provider_name: null,
        service_name: serviceName,
        category: currentCategory,
        subcategory: currentSubcategory,
        official_url: serviceUrl,
        source_url: `https://github.com/ripienaar/free-for-dev#${currentCategory.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`,
        description,
        free_tier_description: description,
        free_tier_type: tierType,
        quota: null,
        quota_unit: null,
        quota_period: null,
        ...limits,
        ...flags,
        intellihire_modules_json: JSON.stringify(modules),
        capability_tags_json: JSON.stringify(capTags),
        priority,
        risk_level: riskLevel,
        verification_status: "unverified",
        source_provenance_json: JSON.stringify({
          source: "free-for.dev",
          repository: "https://github.com/ripienaar/free-for-dev",
          file: "README.md",
          commit: sourceCommit,
          retrievedAt: (/* @__PURE__ */ new Date()).toISOString(),
          sourceUrl: serviceUrl
        })
      };
      services.push(record);
      if (modules.includes("M1")) mCount.m1++;
      if (modules.includes("M2")) mCount.m2++;
      if (modules.includes("M3")) mCount.m3++;
      if (modules.includes("M4")) mCount.m4++;
      if (modules.includes("M5")) mCount.m5++;
      if (modules.includes("shared")) mCount.shared++;
    }
  }
  return {
    services,
    categories: Array.from(categoriesSet),
    stats: {
      totalServices: services.length,
      totalCategories: categoriesSet.size,
      m1Count: mCount.m1,
      m2Count: mCount.m2,
      m3Count: mCount.m3,
      m4Count: mCount.m4,
      m5Count: mCount.m5,
      sharedCount: mCount.shared
    }
  };
}

// scripts/seed-free-services.ts
function escapeSql(str) {
  if (str === null || str === void 0) return "NULL";
  return `'${String(str).replace(/'/g, "''")}'`;
}
function escapeSqlNum(num) {
  if (num === null || num === void 0) return "NULL";
  return String(num);
}
async function main() {
  console.log("Fetching live free-for-dev README.md...");
  const res = await fetch("https://raw.githubusercontent.com/ripienaar/free-for-dev/master/README.md");
  if (!res.ok) {
    throw new Error(`Failed to fetch source: ${res.status} ${res.statusText}`);
  }
  const markdown = await res.text();
  console.log(`Fetched ${markdown.length} bytes of markdown.`);
  const parseResult = parseFreeForDevMarkdown(markdown, "master");
  console.log(`Successfully parsed ${parseResult.services.length} services across ${parseResult.categories.length} categories.`);
  console.log("Module Breakdown:", parseResult.stats);
  const sqlStatements = [];
  sqlStatements.push("-- Auto-generated Free-for.dev Catalog Seed\n");
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
  const syncLogId = "sync_" + Date.now();
  sqlStatements.push(`INSERT INTO free_service_sync_log (
    id, source_commit, services_count, categories_count, status
  ) VALUES (
    ${escapeSql(syncLogId)},
    'master',
    ${parseResult.services.length},
    ${parseResult.categories.length},
    'success'
  );`);
  const outDir = path.resolve(process.cwd(), "scripts");
  const outFile = path.join(outDir, "seed_catalog.sql");
  fs.writeFileSync(outFile, sqlStatements.join("\n\n"), "utf-8");
  console.log(`Wrote SQL seed script to ${outFile} (${sqlStatements.length} statements).`);
}
main().catch((err) => {
  console.error("Seeding failed:", err);
  process.exit(1);
});
