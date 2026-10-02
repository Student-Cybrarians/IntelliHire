/**
 * Free-for.dev Catalog Ingestion & Metadata Normalization Domain Service
 * Ingests markdown from https://github.com/ripienaar/free-for-dev
 * Extracts categories, services, limits, flags, and maps capabilities to IntelliHire architecture.
 */

export interface FreeServiceRecord {
  id: string;
  provider_name: string | null;
  service_name: string;
  category: string;
  subcategory: string | null;
  official_url: string | null;
  source_url: string;
  description: string;
  free_tier_description: string | null;
  free_tier_type: 'always_free' | 'free_trial' | 'credits' | 'freemium' | 'open_source' | 'unknown';
  quota: number | null;
  quota_unit: string | null;
  quota_period: string | null;
  storage_limit: string | null;
  request_limit: string | null;
  compute_limit: string | null;
  bandwidth_limit: string | null;
  retention_limit: string | null;
  user_limit: string | null;
  project_limit: string | null;
  api_limit: string | null;
  credit_card_required: number | null; // 1 = Yes, 0 = No, null = Unknown/Not stated
  trial_only: number | null;           // 1 = Yes, 0 = No, null = Unknown
  open_source: number | null;          // 1 = Yes, 0 = No, null = Unknown
  self_hostable: number | null;        // 1 = Yes, 0 = No, null = Unknown
  commercial_use: number | null;       // 1 = Yes, 0 = No, null = Unknown
  production_allowed: number | null;   // 1 = Yes, 0 = No, null = Unknown
  api_available: number | null;        // 1 = Yes, 0 = No, null = Unknown
  sdk_available: number | null;        // 1 = Yes, 0 = No, null = Unknown
  webhook_available: number | null;    // 1 = Yes, 0 = No, null = Unknown
  intellihire_modules_json: string;    // JSON string array of ('M1'|'M2'|'M3'|'M4'|'M5'|'shared')
  capability_tags_json: string;        // JSON string array of tags
  priority: 'critical' | 'high' | 'medium' | 'low';
  risk_level: 'low' | 'medium' | 'high';
  verification_status: 'unverified' | 'verified';
  source_provenance_json: string;
  created_at?: string;
  updated_at?: string;
}

export interface ParseResult {
  services: FreeServiceRecord[];
  categories: string[];
  stats: {
    totalServices: number;
    totalCategories: number;
    m1Count: number;
    m2Count: number;
    m3Count: number;
    m4Count: number;
    m5Count: number;
    sharedCount: number;
  };
}

/**
 * Normalizes an identifier string into a slug
 */
export function generateServiceId(category: string, provider: string | null, name: string): string {
  const parts = [
    category,
    provider || '',
    name
  ].map(s => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')).filter(Boolean);
  
  return parts.join('__') || 'service-' + Math.random().toString(36).substring(2, 9);
}

/**
 * Extracts numeric and textual limit thresholds from service description
 */
export function extractLimits(text: string) {
  const limits: {
    storage_limit: string | null;
    request_limit: string | null;
    compute_limit: string | null;
    bandwidth_limit: string | null;
    retention_limit: string | null;
    user_limit: string | null;
    project_limit: string | null;
    api_limit: string | null;
  } = {
    storage_limit: null,
    request_limit: null,
    compute_limit: null,
    bandwidth_limit: null,
    retention_limit: null,
    user_limit: null,
    project_limit: null,
    api_limit: null,
  };

  // Storage Limit (e.g. 5 GB, 500 MB storage/disk/SSD/space)
  const storageMatch = text.match(/\b(\d+(?:\.\d+)?\s*(?:[Gg][Bb]|[Mm][Bb]|[Tt][Bb]|[Pp][Bb]))\s*(?:storage|disk|SSD|space|database|file|blob|data)?\b/);
  if (storageMatch) limits.storage_limit = storageMatch[1].trim();

  // Requests / Invocations (e.g. 100,000 requests/mo, 100k queries/month)
  const reqMatch = text.match(/\b(\d+(?:[,\.]\d+)?\s*(?:k|m|million|thousand)?\s*(?:requests?|reqs?|queries|calls|invocations|runs|api calls|hits|visits)(?:\s*(?:\/|per)\s*(?:month|mo|day|sec|second|hour))?)\b/i);
  if (reqMatch) limits.request_limit = reqMatch[1].trim();

  // Compute (e.g. 500 hours, 1 vCPU, 512MB RAM)
  const computeMatch = text.match(/\b(\d+(?:\.\d+)?\s*(?:hours?|hrs?|vCPU|vCPUs|cores?|RAM|MB RAM|GB RAM|instances?|compute units?)(?:\s*(?:\/|per)\s*(?:month|mo))?)\b/i);
  if (computeMatch) limits.compute_limit = computeMatch[1].trim();

  // Bandwidth / Transfer (e.g. 100 GB bandwidth, 10 GB/mo transfer)
  const bwMatch = text.match(/\b(\d+(?:\.\d+)?\s*(?:[Gg][Bb]|[Mm][Bb]|[Tt][Bb])\s*(?:bandwidth|transfer|egress|traffic|data transfer)(?:\s*(?:\/|per)\s*(?:month|mo))?)\b/i);
  if (bwMatch) limits.bandwidth_limit = bwMatch[1].trim();

  // Data Retention (e.g. 7 days retention, 30 days history)
  const retMatch = text.match(/\b(\d+\s*(?:days?|months?|weeks?|hours?)\s*(?:data\s*)?(?:retention|history|logs))\b/i);
  if (retMatch) limits.retention_limit = retMatch[1].trim();

  // User / Team Limits (e.g. 3 users, up to 5 team members)
  const userMatch = text.match(/\b((?:up to\s*)?\d+\s*(?:users?|team members?|seats?|collaborators?|accounts?|members?))\b/i);
  if (userMatch) limits.user_limit = userMatch[1].trim();

  // Project / App Limits (e.g. 1 project, 3 apps, 2 databases)
  const projMatch = text.match(/\b((?:up to\s*)?\d+\s*(?:projects?|apps?|applications?|databases?|domains?|websites?|sites?))\b/i);
  if (projMatch) limits.project_limit = projMatch[1].trim();

  // API Call Limits (e.g. 100 calls/day, 60 req/min)
  const apiMatch = text.match(/\b(\d+(?:[,\.]\d+)?\s*(?:calls?|requests?|reqs?)\s*(?:\/|\s*per\s*)(?:day|minute|min|sec|second|hour))\b/i);
  if (apiMatch) limits.api_limit = apiMatch[1].trim();

  return limits;
}

/**
 * Classifies the free tier type based on description and bracket tags
 */
export function detectFreeTierType(text: string, tags: string[]): FreeServiceRecord['free_tier_type'] {
  const lower = text.toLowerCase();
  const hasTag = (tag: string) => tags.some(t => t.toLowerCase().includes(tag));

  if (hasTag('open source') || hasTag('self-hosted')) {
    return 'open_source';
  }
  if (lower.includes('$') || lower.includes('credit') || lower.includes('credits')) {
    return 'credits';
  }
  if (hasTag('free trial') || lower.includes('free trial') || lower.includes('30-day trial') || lower.includes('14-day trial') || lower.includes('trial period')) {
    return 'free_trial';
  }
  if (lower.includes('always free') || lower.includes('forever free') || lower.includes('free forever')) {
    return 'always_free';
  }
  if (lower.includes('open source') || lower.includes('self-hosted')) {
    return 'open_source';
  }
  if (lower.includes('free tier') || lower.includes('free plan') || lower.includes('free up to') || lower.includes('/mo') || lower.includes('free for')) {
    return 'freemium';
  }
  return 'unknown';
}

/**
 * Extracts disclosed constraint flags. Strict: Returns null when not explicitly stated!
 */
export function extractFlags(text: string, tags: string[], category: string) {
  const lower = text.toLowerCase();
  const hasTag = (tag: string) => tags.some(t => t.toLowerCase().includes(tag));

  // Credit Card Required: 1 = Yes, 0 = No, null = Not Stated
  // Note: Evaluate negative condition ('no credit card') BEFORE positive ('credit card required')
  let credit_card_required: number | null = null;
  if (/no\s+credit\s+card(?:\s+required)?|without\s+credit\s+card|doesn't\s+require\s+(?:a\s+)?credit\s+card/i.test(lower)) {
    credit_card_required = 0;
  } else if (/requires?\s+(?:a\s+)?credit\s+card|credit\s+card\s+required|\bcc\s+required\b/i.test(lower)) {
    credit_card_required = 1;
  }

  // Trial Only: 1 = Yes, 0 = No, null = Unknown
  let trial_only: number | null = null;
  if (hasTag('free trial') || /\btrial\s+only\b|(?:\d+[- ]day\s+trial)/i.test(lower)) {
    trial_only = 1;
  } else if (/always\s+free|forever\s+free|free\s+forever|free\s+plan|free\s+tier/i.test(lower)) {
    trial_only = 0;
  }

  // Open Source: 1 = Yes, null = Unknown
  let open_source: number | null = null;
  if (hasTag('open source') || /\bopen[- ]source\b|\bsource available\b|github\.com/i.test(lower)) {
    open_source = 1;
  }

  // Self Hostable: 1 = Yes, null = Unknown
  let self_hostable: number | null = null;
  if (hasTag('self-hosted') || /\bself[- ]hostable\b|\bself[- ]host\b|\bon[- ]premise\b/i.test(lower)) {
    self_hostable = 1;
  }

  // Commercial Use: 1 = Yes, 0 = No, null = Unknown
  let commercial_use: number | null = null;
  if (/commercial\s+use\s+allowed|free\s+for\s+commercial/i.test(lower)) {
    commercial_use = 1;
  } else if (/non[- ]commercial\s+only|personal\s+use\s+only/i.test(lower)) {
    commercial_use = 0;
  }

  // Production Allowed: 1 = Yes, 0 = No, null = Unknown
  let production_allowed: number | null = null;
  if (/production\s+ready|for\s+production/i.test(lower)) {
    production_allowed = 1;
  } else if (/non[- ]production\s+only|testing\s+only|dev\s+only/i.test(lower)) {
    production_allowed = 0;
  }

  // API Available
  let api_available: number | null = null;
  if (category.toLowerCase().includes('api') || /\b(?:rest|graphql|public)?\s*api\b/i.test(lower)) {
    api_available = 1;
  }

  // SDK Available
  let sdk_available: number | null = null;
  if (/\b(?:sdk|client library|python library|npm package|node\.js package)\b/i.test(lower)) {
    sdk_available = 1;
  }

  // Webhook Available
  let webhook_available: number | null = null;
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
    webhook_available,
  };
}

/**
 * Calculates priority in IntelliHire architecture
 */
export function calculatePriority(
  name: string,
  modules: string[],
  description: string,
  provider?: string | null
): 'critical' | 'high' | 'medium' | 'low' {
  const n = name.toLowerCase();
  const p = (provider || '').toLowerCase();
  
  // Foundational cloud & core vendors IntelliHire directly depends on or integrates with
  const criticalVendors = [
    'cloudflare', 'github', 'turso', 'supabase', 'neon', 'upstash',
    'resend', 'sentry', 'posthog', 'meilisearch', 'typesense', 'fly.io', 'vercel', 'google cloud', 'aws'
  ];
  if (criticalVendors.some(v => n.includes(v) || p.includes(v))) {
    return 'critical';
  }

  // High priority for core capabilities in M1, M2, M3, M4
  if (modules.includes('M1') || modules.includes('M2') || modules.includes('M3') || modules.includes('M4')) {
    if (/database|llm|storage|auth|webrtc|vector/i.test(description)) {
      return 'high';
    }
  }

  if (modules.includes('M5') || modules.includes('shared')) {
    return 'medium';
  }

  return 'low';
}

/**
 * Maps services deterministically to IntelliHire's 5 core modules and shared infra
 */
export function mapIntelliHireModules(
  category: string,
  subcategory: string | null,
  name: string,
  description: string
): string[] {
  const modules = new Set<string>();
  const cat = category.toLowerCase();
  const sub = (subcategory || '').toLowerCase();
  const text = `${name} ${description}`.toLowerCase();

  // M1: Document Parsing, OCR, Resume Text Extraction, Vector Embeddings
  if (
    cat.includes('document') ||
    cat.includes('font') ||
    cat.includes('translation') ||
    /\b(ocr|pdf|document|parse|parsing|parser|resume|extract|extraction|cv|vector|embedding|embeddings|text analysis|nlp|semantic search)\b/i.test(text)
  ) {
    modules.add('M1');
  }

  // M2: Universal Assessment & Adaptive Competency Evaluation
  if (
    cat.includes('generative ai') ||
    cat.includes('ai') ||
    cat.includes('testing') ||
    cat.includes('code quality') ||
    /\b(llm|generative ai|openai|anthropic|code execution|sandbox|rubric|assessment|scoring|grading|speech|transcription|voice evaluation|quiz|proctoring)\b/i.test(text)
  ) {
    modules.add('M2');
  }

  // M3: Requisition Matching, Relational Queries & Search
  if (
    cat.includes('database') ||
    cat.includes('baas') ||
    cat.includes('search') ||
    cat.includes('messaging and streaming') ||
    cat.includes('queue') ||
    /\b(database|sql|postgres|sqlite|mysql|search|elasticsearch|meilisearch|typesense|indexing|queue|kafka|rabbitmq|redis|cache|pubsub|workflow)\b/i.test(text)
  ) {
    modules.add('M3');
  }

  // M4: Video/Audio Interview Streaming & Realtime Communication
  if (
    cat.includes('webrtc') ||
    cat.includes('email') ||
    cat.includes('sms') ||
    cat.includes('communication') ||
    cat.includes('calendar') ||
    /\b(webrtc|video|audio stream|stun|turn|stream|transcription|speech-to-text|calendar|scheduling|emails?|smtp|mail(?:ings?)?|notifications?|push notification|telephony)\b/i.test(text)
  ) {
    modules.add('M4');
  }

  // M5: Analytics, Audit Logging & Enterprise Governance
  if (
    cat.includes('log management') ||
    cat.includes('analytics') ||
    cat.includes('crash') ||
    cat.includes('monitoring') ||
    cat.includes('security') ||
    /\b(analytics|telemetry|metrics|tracing|logging|log|audit|observability|monitoring|dashboard|reporting|compliance|governance|alerting|apm)\b/i.test(text)
  ) {
    modules.add('M5');
  }

  // Shared Infrastructure: Cloud, Auth, Storage, DNS, CI/CD, Serverless
  if (
    cat.includes('major cloud providers') ||
    cat.includes('authentication') ||
    cat.includes('storage') ||
    cat.includes('cdn') ||
    cat.includes('dns') ||
    cat.includes('ci and cd') ||
    cat.includes('hosting') ||
    cat.includes('paas') ||
    cat.includes('iaas') ||
    cat.includes('serverless') ||
    cat.includes('source code') ||
    cat.includes('secrets') ||
    cat.includes('waf') ||
    modules.size === 0 // Default fallback to shared if not mapped to a specific feature
  ) {
    modules.add('shared');
  }

  return Array.from(modules);
}

/**
 * Extracts fine-grained capability tags for search and categorization
 */
export function extractCapabilityTags(
  category: string,
  subcategory: string | null,
  name: string,
  description: string
): string[] {
  const tags = new Set<string>();
  const text = `${category} ${subcategory || ''} ${name} ${description}`.toLowerCase();

  const mapping: Record<string, RegExp> = {
    'authentication': /\b(auth|oauth|jwt|identity|sso|login)\b/i,
    'object_storage': /\b(storage|s3|r2|blob|file upload)\b/i,
    'relational_database': /\b(sql|postgres|sqlite|mysql|cockroach|neon|turso)\b/i,
    'document_database': /\b(mongodb|nosql|firestore|document store)\b/i,
    'vector_search': /\b(vector|embedding|semantic search|pinecone|qdrant|weaviate|chroma)\b/i,
    'llm_inference': /\b(llm|gpt|claude|gemini|groq|inference|openai|huggingface)\b/i,
    'code_sandbox': /\b(code execution|sandbox|compiler|runner|docker|container)\b/i,
    'webrtc_video': /\b(webrtc|video call|streaming|media server|stun|turn)\b/i,
    'email_delivery': /\b(email|smtp|transactional email|sendgrid|resend|mailgun)\b/i,
    'messaging_queue': /\b(queue|kafka|rabbitmq|pubsub|redis|event stream)\b/i,
    'observability_logging': /\b(logging|logs|telemetry|metrics|sentry|datadog|grafana|apm)\b/i,
    'ci_cd_automation': /\b(ci\/cd|pipeline|github actions|build|deploy)\b/i,
    'serverless_compute': /\b(serverless|workers|lambda|cloud functions|edge compute)\b/i,
    'ocr_parsing': /\b(ocr|pdf parsing|document extraction|tesseract)\b/i,
    'audio_speech': /\b(speech|transcription|whisper|tts|stt|audio)\b/i,
    'cdn_edge': /\b(cdn|edge|cloudflare|fastly|akamai|caching)\b/i,
    'dns_domains': /\b(dns|domain|nameserver)\b/i,
    'secrets_vault': /\b(secrets|vault|kms|key management)\b/i,
  };

  for (const [tag, regex] of Object.entries(mapping)) {
    if (regex.test(text)) {
      tags.add(tag);
    }
  }

  // Also include the normalized category name as a general tag
  const catTag = category.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '');
  if (catTag) tags.add(catTag);

  return Array.from(tags);
}


/**
 * Assesses integration risk level
 */
export function calculateRiskLevel(
  text: string,
  creditCardReq: number | null,
  trialOnly: number | null
): 'low' | 'medium' | 'high' {
  if (trialOnly === 1) return 'high';
  if (creditCardReq === 1) return 'medium';
  if (/deprecated|discontinued|unmaintained|beta|preview/i.test(text)) return 'high';
  return 'low';
}

/**
 * Master parser: Converts free-for-dev README markdown into structured FreeServiceRecord list
 */
export function parseFreeForDevMarkdown(markdown: string, sourceCommit = 'master'): ParseResult {
  const lines = markdown.split(/\r?\n/);
  const services: FreeServiceRecord[] = [];
  const categoriesSet = new Set<string>();

  let currentCategory = '';
  let currentSubcategory: string | null = null;
  let currentProvider: string | null = null;
  let currentProviderUrl: string | null = null;

  const mCount = { m1: 0, m2: 0, m3: 0, m4: 0, m5: 0, shared: 0 };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();

    // Check for Category (## Header)
    const catMatch = line.match(/^##\s+(.+)$/);
    if (catMatch) {
      const heading = catMatch[1].trim();
      // Skip meta sections
      if (/table of contents|license|contributing|sponsors/i.test(heading)) {
        currentCategory = '';
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

    // Check for Subcategory (### Header)
    const subMatch = line.match(/^###\s+(.+)$/);
    if (subMatch) {
      currentSubcategory = subMatch[1].trim();
      currentProvider = null;
      continue;
    }

    // In "Major Cloud Providers", entries are organized under Providers
    if (currentCategory.toLowerCase() === 'major cloud providers') {
      // If line is just a link with provider name, e.g. "  * [Cloudflare](https://...)" or "* [Google Cloud Platform](https://...)"
      const providerOnlyMatch = line.match(/^\s*\*\s+\[([^\]]+)\]\(([^)]+)\)\s*$/);
      if (providerOnlyMatch) {
        currentProvider = providerOnlyMatch[1].trim();
        currentProviderUrl = providerOnlyMatch[2].trim();
        continue;
      }

      // Otherwise if it's a bullet with description and we have currentProvider:
      const nestedMatch = line.match(/^\s*\*\s+(?:\[([^\]]+)\]\(([^)]+)\)|([^-\s:][^-\n:]*?))\s*(?:-\s*(.*)|:\s*(.*))?$/);
      if (nestedMatch && currentProvider) {
        const serviceName = (nestedMatch[1] || nestedMatch[3] || '').trim();
        const serviceUrl = nestedMatch[2] ? nestedMatch[2].trim() : currentProviderUrl;
        const description = (nestedMatch[4] || nestedMatch[5] || '').trim();

        if (serviceName && !/full,?\s*detailed\s*list/i.test(serviceName)) {
          const limits = extractLimits(description);
          const flags = extractFlags(description, [], currentCategory);
          const tierType = detectFreeTierType(description, []);
          const modules = mapIntelliHireModules(currentCategory, currentSubcategory, serviceName, description);
          const capTags = extractCapabilityTags(currentCategory, currentSubcategory, serviceName, description);
          const priority = calculatePriority(serviceName, modules, description, currentProvider);
          const riskLevel = calculateRiskLevel(description, flags.credit_card_required, flags.trial_only);

          const id = generateServiceId(currentCategory, currentProvider, serviceName);

          const record: FreeServiceRecord = {
            id,
            provider_name: currentProvider,
            service_name: serviceName,
            category: currentCategory,
            subcategory: currentSubcategory,
            official_url: serviceUrl,
            source_url: `https://github.com/ripienaar/free-for-dev#${currentCategory.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`,
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
            verification_status: 'unverified',
            source_provenance_json: JSON.stringify({
              source: 'free-for.dev',
              repository: 'https://github.com/ripienaar/free-for-dev',
              file: 'README.md',
              commit: sourceCommit,
              retrievedAt: new Date().toISOString(),
              sourceUrl: serviceUrl,
            }),
          };

          services.push(record);

          if (modules.includes('M1')) mCount.m1++;
          if (modules.includes('M2')) mCount.m2++;
          if (modules.includes('M3')) mCount.m3++;
          if (modules.includes('M4')) mCount.m4++;
          if (modules.includes('M5')) mCount.m5++;
          if (modules.includes('shared')) mCount.shared++;
        }
        continue;
      }
    }

    // Standard Bullet list format in other categories:
    // Any spaces, then * [Service Name](url) [Tag1] [Tag2] - Description
    const standardMatch = line.match(/^\s*\*\s+\[([^\]]+)\]\(([^)]+)\)(.*)$/);
    if (standardMatch) {
      const serviceName = standardMatch[1].trim();
      const serviceUrl = standardMatch[2].trim();
      const remainder = standardMatch[3].trim();

      // Parse tags in brackets, e.g. `[Open Source] [Free Trial]`
      const tags: string[] = [];
      const tagMatches = remainder.matchAll(/\[([^\]]+)\]/g);
      for (const tm of tagMatches) {
        tags.push(tm[1].trim());
      }

      // Remainder after tags and dash/colon
      let descPart = remainder.replace(/(?:\[[^\]]+\]\s*)+/, '').trim();
      if (descPart.startsWith('-') || descPart.startsWith(':')) {
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

      const record: FreeServiceRecord = {
        id,
        provider_name: null,
        service_name: serviceName,
        category: currentCategory,
        subcategory: currentSubcategory,
        official_url: serviceUrl,
        source_url: `https://github.com/ripienaar/free-for-dev#${currentCategory.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`,
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
        verification_status: 'unverified',
        source_provenance_json: JSON.stringify({
          source: 'free-for.dev',
          repository: 'https://github.com/ripienaar/free-for-dev',
          file: 'README.md',
          commit: sourceCommit,
          retrievedAt: new Date().toISOString(),
          sourceUrl: serviceUrl,
        }),
      };

      services.push(record);

      if (modules.includes('M1')) mCount.m1++;
      if (modules.includes('M2')) mCount.m2++;
      if (modules.includes('M3')) mCount.m3++;
      if (modules.includes('M4')) mCount.m4++;
      if (modules.includes('M5')) mCount.m5++;
      if (modules.includes('shared')) mCount.shared++;
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
      sharedCount: mCount.shared,
    },
  };
}
