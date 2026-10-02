import { describe, it, expect } from 'vitest';
import {
  parseFreeForDevMarkdown,
  extractLimits,
  detectFreeTierType,
  extractFlags,
  mapIntelliHireModules,
  extractCapabilityTags,
  calculatePriority,
  calculateRiskLevel,
  generateServiceId
} from '../src/shared/freeServiceParser';

describe('Free-for.dev Catalog Parser Domain Service', () => {
  describe('extractLimits', () => {
    it('should extract storage limits correctly', () => {
      const limits = extractLimits('Offers 5 GB storage and 100 MB database');
      expect(limits.storage_limit).toBe('5 GB');
    });

    it('should extract request limits correctly', () => {
      const limits = extractLimits('Up to 100k requests/month on the free tier');
      expect(limits.request_limit).toBe('100k requests/month');
    });

    it('should extract compute limits correctly', () => {
      const limits = extractLimits('Provides 1 vCPU and 512MB RAM with 750 hours/mo');
      expect(limits.compute_limit).toBe('1 vCPU');
    });

    it('should extract retention limits correctly', () => {
      const limits = extractLimits('Log retention for 7 days retention');
      expect(limits.retention_limit).toBe('7 days retention');
    });

    it('should extract team/user limits correctly', () => {
      const limits = extractLimits('Free plan supports up to 5 users and 3 projects');
      expect(limits.user_limit).toBe('up to 5 users');
      expect(limits.project_limit).toBe('3 projects');
    });

    it('should return null when limits are not stated', () => {
      const limits = extractLimits('A general tool for developers');
      expect(limits.storage_limit).toBeNull();
      expect(limits.request_limit).toBeNull();
      expect(limits.compute_limit).toBeNull();
    });
  });

  describe('detectFreeTierType', () => {
    it('detects open_source from tags or description', () => {
      expect(detectFreeTierType('Host yourself', ['Open Source'])).toBe('open_source');
      expect(detectFreeTierType('An open source platform', [])).toBe('open_source');
    });

    it('detects credits', () => {
      expect(detectFreeTierType('$200 free credit for 30 days', [])).toBe('credits');
    });

    it('detects free_trial', () => {
      expect(detectFreeTierType('Includes a 14-day trial', [])).toBe('free_trial');
      expect(detectFreeTierType('Service features', ['Free Trial'])).toBe('free_trial');
    });

    it('detects always_free', () => {
      expect(detectFreeTierType('Always free for hobbyists and open source developers', [])).toBe('always_free');
    });

    it('detects freemium', () => {
      expect(detectFreeTierType('Free tier includes 100 requests per month', [])).toBe('freemium');
    });
  });

  describe('extractFlags - Strict Null Handling for Invariants', () => {
    it('returns null for unknown flags rather than guessing false', () => {
      const flags = extractFlags('Basic markdown utility', [], 'Tools');
      expect(flags.credit_card_required).toBeNull();
      expect(flags.trial_only).toBeNull();
      expect(flags.commercial_use).toBeNull();
      expect(flags.production_allowed).toBeNull();
    });

    it('detects credit card requirements accurately', () => {
      expect(extractFlags('Requires credit card to sign up', [], 'Cloud').credit_card_required).toBe(1);
      expect(extractFlags('Free tier, no credit card required', [], 'Cloud').credit_card_required).toBe(0);
    });

    it('detects open source and self-hostable accurately', () => {
      const flags = extractFlags('Community edition', ['Open Source', 'Self-Hosted'], 'Databases');
      expect(flags.open_source).toBe(1);
      expect(flags.self_hostable).toBe(1);
    });
  });

  describe('mapIntelliHireModules', () => {
    it('maps document parsing to Module 1', () => {
      const mods = mapIntelliHireModules('APIs, Data, and ML', null, 'DocuParse', 'PDF OCR extraction and text parsing service');
      expect(mods).toContain('M1');
    });

    it('maps LLM and code sandboxes to Module 2', () => {
      const mods = mapIntelliHireModules('Generative AI', null, 'Groq Cloud', 'Fast LLM inference and code execution evaluation');
      expect(mods).toContain('M2');
    });

    it('maps databases and search to Module 3', () => {
      const mods = mapIntelliHireModules('Databases', null, 'Turso', 'Edge SQLite database and distributed search');
      expect(mods).toContain('M3');
    });

    it('maps WebRTC and video to Module 4', () => {
      const mods = mapIntelliHireModules('WebRTC', null, 'Daily.co', 'Video calling and realtime media streaming API');
      expect(mods).toContain('M4');
    });

    it('maps logging and monitoring to Module 5', () => {
      const mods = mapIntelliHireModules('Log Management', null, 'BetterStack', 'Telemetry, log auditing and uptime observability');
      expect(mods).toContain('M5');
    });

    it('maps cloud providers to shared infrastructure', () => {
      const mods = mapIntelliHireModules('Major Cloud Providers', null, 'Cloudflare', 'Global edge CDN, DNS, and serverless compute');
      expect(mods).toContain('shared');
    });
  });

  describe('calculatePriority', () => {
    it('assigns critical priority to core infrastructure vendors', () => {
      expect(calculatePriority('Cloudflare Workers', ['shared'], 'Serverless functions')).toBe('critical');
      expect(calculatePriority('Turso Database', ['M3'], 'SQLite database')).toBe('critical');
    });

    it('assigns high priority to key module capabilities', () => {
      expect(calculatePriority('Custom Vector Service', ['M1'], 'Embeddings and vector database')).toBe('high');
    });
  });

  describe('parseFreeForDevMarkdown full integration', () => {
    const sampleMarkdown = `
# Free for Dev

A list of SaaS, PaaS and IaaS offerings that have free tiers of interest to devops and devs.

## Table of Contents
* [Major Cloud Providers](#major-cloud-providers)
* [APIs, Data, and ML](#apis-data-and-ml)

## Major Cloud Providers
* [Cloudflare](https://www.cloudflare.com/)
  * Application Security and Performance - Free plan provides unmetered DDoS mitigation, CDN, SSL, DNS.
  * Workers - 100,000 requests/day, 10ms CPU time per request.
* [Google Cloud Platform](https://cloud.google.com/)
  * Compute Engine - 1 non-preemptible e2-micro VM instance per month, 30 GB storage.
  * Cloud Storage - 5 GB-months of regional storage.

## APIs, Data, and ML
* [Tesseract OCR](https://github.com/tesseract-ocr/tesseract) [Open Source] [Self-Hosted] - Optical character recognition engine for documents and PDFs.
* [Groq](https://groq.com/) - Free tier with fast LLM inference up to 30 requests/minute.
* [Resend](https://resend.com/) - 3,000 emails/month, 100 emails/day, 1 domain.
`;

    it('parses both nested cloud providers and standard categories', () => {
      const result = parseFreeForDevMarkdown(sampleMarkdown, 'test-commit-sha');
      
      expect(result.categories).toContain('Major Cloud Providers');
      expect(result.categories).toContain('APIs, Data, and ML');
      expect(result.stats.totalCategories).toBe(2);
      expect(result.services.length).toBe(7); // 2 cloudflare + 2 gcp + 3 apis

      // Verify Cloudflare Workers nested entry
      const workers = result.services.find(s => s.service_name === 'Workers');
      expect(workers).toBeDefined();
      expect(workers?.provider_name).toBe('Cloudflare');
      expect(workers?.category).toBe('Major Cloud Providers');
      expect(workers?.request_limit).toBe('100,000 requests/day');
      expect(workers?.priority).toBe('critical');

      // Verify Tesseract Open Source entry
      const tesseract = result.services.find(s => s.service_name === 'Tesseract OCR');
      expect(tesseract).toBeDefined();
      expect(tesseract?.open_source).toBe(1);
      expect(tesseract?.self_hostable).toBe(1);
      expect(tesseract?.free_tier_type).toBe('open_source');
      const tesseractModules = JSON.parse(tesseract?.intellihire_modules_json || '[]');
      expect(tesseractModules).toContain('M1');

      // Verify Resend email entry
      const resend = result.services.find(s => s.service_name === 'Resend');
      expect(resend).toBeDefined();
      const resendModules = JSON.parse(resend?.intellihire_modules_json || '[]');
      expect(resendModules).toContain('M4');

      // Check provenance
      const provenance = JSON.parse(resend?.source_provenance_json || '{}');
      expect(provenance.source).toBe('free-for.dev');
      expect(provenance.commit).toBe('test-commit-sha');
    });
  });
});
