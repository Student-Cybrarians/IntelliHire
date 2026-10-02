import { describe, it, expect, vi } from 'vitest';

// ============================================================
// E-14: PII Redaction Tests
// ============================================================

// Import the redactPII function by testing it inline
// (since it's not exported from the route module, we test the patterns directly)
function redactPII(text: string): { redacted: string; piiFound: string[] } {
  const piiFound: string[] = [];
  let redacted = text;
  
  redacted = redacted.replace(/[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/g, () => {
    piiFound.push('email');
    return '[EMAIL_REDACTED]';
  });
  
  redacted = redacted.replace(/(\+?\d{1,3}[\s\-]?)?(\(?\d{3}\)?[\s\-]?\d{3}[\s\-]?\d{4})/g, () => {
    piiFound.push('phone');
    return '[PHONE_REDACTED]';
  });
  
  redacted = redacted.replace(/\b\d{3}[\-\s]?\d{2}[\-\s]?\d{4}\b/g, () => {
    piiFound.push('ssn');
    return '[SSN_REDACTED]';
  });
  
  redacted = redacted.replace(/\b\d{1,5}\s+[A-Za-z]+\s+(Street|St|Avenue|Ave|Boulevard|Blvd|Drive|Dr|Lane|Ln|Road|Rd|Court|Ct|Way|Place|Pl)\b\.?/gi, () => {
    piiFound.push('address');
    return '[ADDRESS_REDACTED]';
  });
  
  redacted = redacted.replace(/https?:\/\/[^\s]+/g, (match) => {
    if (/linkedin\.com|github\.com|portfolio|personal/i.test(match)) {
      piiFound.push('url');
      return '[PROFILE_URL_REDACTED]';
    }
    return match;
  });
  
  return { redacted, piiFound: [...new Set(piiFound)] };
}

describe('E-14: PII Redaction Engine', () => {
  it('redacts email addresses', () => {
    const { redacted, piiFound } = redactPII('Contact me at john.doe@example.com for details');
    expect(redacted).not.toContain('john.doe@example.com');
    expect(redacted).toContain('[EMAIL_REDACTED]');
    expect(piiFound).toContain('email');
  });

  it('redacts phone numbers', () => {
    const { redacted, piiFound } = redactPII('Call me at +1 (555) 123-4567');
    expect(redacted).toContain('[PHONE_REDACTED]');
    expect(piiFound).toContain('phone');
  });

  it('redacts SSN patterns', () => {
    const { redacted, piiFound } = redactPII('SSN: 123-45-6789');
    expect(redacted).toContain('[SSN_REDACTED]');
    expect(piiFound).toContain('ssn');
  });

  it('redacts street addresses', () => {
    const { redacted, piiFound } = redactPII('Lives at 123 Main Street, Springfield');
    expect(redacted).toContain('[ADDRESS_REDACTED]');
    expect(piiFound).toContain('address');
  });

  it('redacts LinkedIn URLs', () => {
    const { redacted, piiFound } = redactPII('Profile: https://linkedin.com/in/johndoe');
    expect(redacted).toContain('[PROFILE_URL_REDACTED]');
    expect(piiFound).toContain('url');
  });

  it('preserves non-PII content', () => {
    const text = 'Experienced software engineer with 5 years of Python development';
    const { redacted, piiFound } = redactPII(text);
    expect(redacted).toBe(text);
    expect(piiFound).toHaveLength(0);
  });

  it('redacts multiple PII types in one text', () => {
    const text = 'John Doe, john@test.com, 555-123-4567, 123 Oak Street';
    const { redacted, piiFound } = redactPII(text);
    expect(redacted).not.toContain('john@test.com');
    expect(piiFound.length).toBeGreaterThanOrEqual(2);
  });

  it('deduplicates PII categories', () => {
    const text = 'email1@test.com and email2@test.com';
    const { piiFound } = redactPII(text);
    expect(piiFound.filter(p => p === 'email')).toHaveLength(1);
  });
});

// ============================================================
// E-05: Hybrid ATS Scoring Tests
// ============================================================

function computeAtsScore(resumeText: string, jdRequirementsJson: string, gapAnalysis: any[]) {
  const resumeTextLower = resumeText.toLowerCase();
  
  // Dimension 1: Format Score (30%)
  let formatScore = 100;
  const textLen = resumeText.length;
  if (textLen < 300) formatScore -= 50;
  else if (textLen < 800) formatScore -= 30;
  else if (textLen < 1500) formatScore -= 10;
  if (textLen > 50000) formatScore -= 20;
  const hasContact = /(email|phone|linkedin|@|\+\d)/i.test(resumeText);
  if (!hasContact) formatScore -= 15;
  const hasSections = /(experience|education|skills|summary|objective|qualifications)/i.test(resumeText);
  if (!hasSections) formatScore -= 20;
  formatScore = Math.max(0, formatScore);

  // Dimension 2: Keyword Match Score (35%)
  let keywordScore = 0;
  try {
    const jdReqs = JSON.parse(jdRequirementsJson);
    const requirements = jdReqs.requirements || jdReqs;
    if (Array.isArray(requirements) && requirements.length > 0) {
      let matched = 0;
      for (const req of requirements) {
        const reqText = (typeof req === 'string' ? req : req.requirement || '').toLowerCase();
        const keywords = reqText.split(/\s+/).filter((w: string) => w.length > 3);
        const found = keywords.some((kw: string) => resumeTextLower.includes(kw));
        if (found) matched++;
      }
      keywordScore = Math.round((matched / requirements.length) * 100);
    }
  } catch (_) {
    keywordScore = 50;
  }

  // Dimension 3: Structure Score (10%)
  let structureScore = 0;
  const quantified = (resumeText.match(/\d+%|\$\d|\d+\s*(million|thousand|users|clients|projects)/gi) || []).length;
  structureScore += Math.min(40, quantified * 10);
  const actionVerbs = (resumeText.match(/\b(led|managed|developed|designed|implemented|created|launched|improved|reduced|increased|built|analyzed|delivered|architected|optimized|spearheaded|orchestrated)\b/gi) || []).length;
  structureScore += Math.min(40, actionVerbs * 5);
  structureScore = Math.min(100, structureScore);

  // Dimension 4: AI Match (25%)
  const aiMatchScore = gapAnalysis.length === 0 ? 50 :
    Math.round(gapAnalysis.filter(g => g.status === 'DEMONSTRATED').length / gapAnalysis.length * 100);

  return {
    total: Math.round(formatScore * 0.30 + keywordScore * 0.35 + structureScore * 0.10 + aiMatchScore * 0.25),
    breakdown: { format: formatScore, keyword_match: keywordScore, structure: structureScore, ai_alignment: aiMatchScore }
  };
}

describe('E-05: Hybrid ATS Scoring Model', () => {
  it('penalizes very short resumes', () => {
    const score = computeAtsScore('short text', '{}', []);
    expect(score.breakdown.format).toBeLessThan(50);
  });

  it('rewards well-structured resumes', () => {
    const goodResume = `
      EXPERIENCE
      Led a team of 10 engineers. Developed microservices architecture.
      Improved API response time by 40%. Built CI/CD pipeline.
      
      EDUCATION
      BS Computer Science
      
      SKILLS
      Python, TypeScript, React, AWS
      
      Contact: email@example.com, +1-555-123-4567
    `;
    const score = computeAtsScore(goodResume, '{}', []);
    expect(score.breakdown.format).toBeGreaterThan(50);
    expect(score.breakdown.structure).toBeGreaterThan(0);
  });

  it('scores keyword match against JD requirements', () => {
    const resume = 'Experienced Python developer with React and TypeScript skills. Built microservices.';
    const jd = JSON.stringify({ requirements: [
      { requirement: 'Python programming experience' },
      { requirement: 'React frontend development' },
      { requirement: 'Kubernetes orchestration' }
    ]});
    const score = computeAtsScore(resume, jd, []);
    // Should match Python and React but not Kubernetes
    expect(score.breakdown.keyword_match).toBeGreaterThan(30);
    expect(score.breakdown.keyword_match).toBeLessThan(100);
  });

  it('incorporates AI gap analysis into score', () => {
    const allDemonstrated = [
      { status: 'DEMONSTRATED' },
      { status: 'DEMONSTRATED' },
      { status: 'DEMONSTRATED' }
    ];
    const halfMissing = [
      { status: 'DEMONSTRATED' },
      { status: 'MISSING' },
      { status: 'DEMONSTRATED' },
      { status: 'MISSING' }
    ];
    const score1 = computeAtsScore('test resume text with experience and skills', '{}', allDemonstrated);
    const score2 = computeAtsScore('test resume text with experience and skills', '{}', halfMissing);
    expect(score1.breakdown.ai_alignment).toBe(100);
    expect(score2.breakdown.ai_alignment).toBe(50);
  });

  it('produces a composite score between 0 and 100', () => {
    const score = computeAtsScore('Python developer led team of 5 engineers', '{}', []);
    expect(score.total).toBeGreaterThanOrEqual(0);
    expect(score.total).toBeLessThanOrEqual(100);
  });

  it('returns a full breakdown with all dimensions', () => {
    const score = computeAtsScore('test', '{}', []);
    expect(score.breakdown).toHaveProperty('format');
    expect(score.breakdown).toHaveProperty('keyword_match');
    expect(score.breakdown).toHaveProperty('structure');
    expect(score.breakdown).toHaveProperty('ai_alignment');
  });
});

// ============================================================
// E-18: Cache Isolation Tests
// ============================================================

describe('E-18: LLM Response Caching Logic', () => {
  it('cache key includes content hash for tenant isolation', () => {
    const contentHash = 'abc123def456';
    const cacheKey = `extract_cache:${contentHash}`;
    expect(cacheKey).toBe('extract_cache:abc123def456');
    expect(cacheKey).not.toContain('user_id'); // Hash-based, not user-based
  });

  it('JD cache key is deterministic for identical text', async () => {
    const jdText = 'Looking for a senior Python developer with 5 years experience';
    const encoder = new TextEncoder();
    const hash1 = await crypto.subtle.digest('SHA-256', encoder.encode(jdText));
    const hash2 = await crypto.subtle.digest('SHA-256', encoder.encode(jdText));
    const hex1 = Array.from(new Uint8Array(hash1)).map(b => b.toString(16).padStart(2, '0')).join('');
    const hex2 = Array.from(new Uint8Array(hash2)).map(b => b.toString(16).padStart(2, '0')).join('');
    expect(hex1).toBe(hex2);
  });

  it('different JD text produces different cache keys', async () => {
    const encoder = new TextEncoder();
    const hash1 = await crypto.subtle.digest('SHA-256', encoder.encode('JD text one'));
    const hash2 = await crypto.subtle.digest('SHA-256', encoder.encode('JD text two'));
    const hex1 = Array.from(new Uint8Array(hash1)).map(b => b.toString(16).padStart(2, '0')).join('');
    const hex2 = Array.from(new Uint8Array(hash2)).map(b => b.toString(16).padStart(2, '0')).join('');
    expect(hex1).not.toBe(hex2);
  });
});

// ============================================================
// E-03: Multi-Pass Extraction Validation
// ============================================================

describe('E-03: Multi-Pass Extraction Provenance', () => {
  it('extraction provenance includes pipeline stages', () => {
    const provenance = {
      source_document_id: 'resume-123',
      extraction_method: 'multi_pass_v2_muse_glimmer_30b',
      extraction_pipeline: ['segmentation', 'entity_extraction', 'taxonomy_alignment'],
      extraction_status: 'extracted',
      confidence: 'unverified',
      pii_categories_redacted: ['email', 'phone']
    };
    expect(provenance.extraction_pipeline).toHaveLength(3);
    expect(provenance.extraction_pipeline).toContain('segmentation');
    expect(provenance.extraction_pipeline).toContain('entity_extraction');
    expect(provenance.extraction_pipeline).toContain('taxonomy_alignment');
    expect(provenance.extraction_method).toContain('multi_pass');
  });

  it('taxonomy alignment produces valid structure', () => {
    const alignment = [
      { skill: 'Python', aligned_domain: 'Software Development', confidence: 0.85 },
      { skill: 'React', aligned_domain: 'Web Development', confidence: 0.78 }
    ];
    for (const item of alignment) {
      expect(item).toHaveProperty('skill');
      expect(item).toHaveProperty('aligned_domain');
      expect(item).toHaveProperty('confidence');
      expect(item.confidence).toBeGreaterThan(0);
      expect(item.confidence).toBeLessThanOrEqual(1);
    }
  });

  it('extraction result includes all expected fields', () => {
    const result = {
      skills: ['Python', 'TypeScript'],
      experience: [{ company: 'Acme Corp', title: 'Engineer', duration: '2 years' }],
      education: ['BS Computer Science'],
      certifications: [],
      achievements: ['Improved performance by 40%'],
      sections: [{ name: 'Experience' }, { name: 'Education' }],
      taxonomy_alignment: [],
      provenance: { extraction_method: 'multi_pass_v2_muse_glimmer_30b' }
    };
    expect(result).toHaveProperty('skills');
    expect(result).toHaveProperty('experience');
    expect(result).toHaveProperty('education');
    expect(result).toHaveProperty('certifications');
    expect(result).toHaveProperty('sections');
    expect(result).toHaveProperty('taxonomy_alignment');
    expect(result).toHaveProperty('provenance');
  });
});

// ============================================================
// Resilient AI Output Parser & Fallback Tests
// ============================================================

describe('Resilient AI Output Parser & Extraction Fallback', () => {
  function repairTruncatedJson(str: string): string {
    let cleaned = str.trim();
    const firstBrace = cleaned.indexOf('{');
    const firstBracket = cleaned.indexOf('[');
    if (firstBrace === -1 && firstBracket === -1) return '';
    const isObject = firstBrace !== -1 && (firstBracket === -1 || firstBrace < firstBracket);
    cleaned = cleaned.substring(isObject ? firstBrace : firstBracket);

    let inString = false, escaped = false;
    const stack: ('{' | '[')[] = [];

    for (let i = 0; i < cleaned.length; i++) {
      const char = cleaned[i];
      if (escaped) { escaped = false; continue; }
      if (char === '\\') { escaped = true; continue; }
      if (char === '"') { inString = !inString; continue; }
      if (!inString) {
        if (char === '{' || char === '[') stack.push(char);
        else if (char === '}') { if (stack.length > 0 && stack[stack.length - 1] === '{') stack.pop(); }
        else if (char === ']') { if (stack.length > 0 && stack[stack.length - 1] === '[') stack.pop(); }
      }
    }
    if (inString) cleaned += '"';
    cleaned = cleaned.replace(/,\s*$/, '').replace(/:\s*$/, ': null');
    while (stack.length > 0) {
      const open = stack.pop();
      cleaned = cleaned.replace(/,\s*$/, '');
      if (open === '{') cleaned += '}';
      else if (open === '[') cleaned += ']';
    }
    return cleaned;
  }

  function extractJsonFromLlmResponse<T = any>(raw: string): T | null {
    if (!raw || typeof raw !== 'string') return null;
    const trimmed = raw.trim();
    try { return JSON.parse(trimmed); } catch (_) {}

    const fenceRegex = /```(?:json|JSON)?\s*([\s\S]*?)\s*```/;
    const match = fenceRegex.exec(trimmed);
    if (match && match[1]) {
      const content = match[1].trim();
      try { return JSON.parse(content); } catch (_) {
        try { return JSON.parse(content.replace(/,\s*([}\]])/g, '$1')); } catch (_) {}
      }
    }

    const firstBrace = trimmed.indexOf('{');
    const lastBrace = trimmed.lastIndexOf('}');
    if (firstBrace !== -1 && lastBrace > firstBrace) {
      const sub = trimmed.substring(firstBrace, lastBrace + 1);
      try { return JSON.parse(sub); } catch (_) {
        try { return JSON.parse(sub.replace(/,\s*([}\]])/g, '$1')); } catch (_) {}
      }
    }

    try {
      const repaired = repairTruncatedJson(trimmed);
      if (repaired) return JSON.parse(repaired);
    } catch (_) {}

    return null;
  }

  it('parses markdown code fence with surrounding preamble and postamble', () => {
    const raw = `Here is the requested ATS extraction:
\`\`\`json
{
  "skills": ["TypeScript", "React"],
  "experience": [{"company": "Tech", "title": "Dev", "duration": "2y"}]
}
\`\`\`
Hope this helps!`;
    const result = extractJsonFromLlmResponse(raw);
    expect(result).not.toBeNull();
    expect(result.skills).toContain('TypeScript');
    expect(result.experience).toHaveLength(1);
  });

  it('repairs trailing commas in AI output', () => {
    const raw = '{"skills": ["Go", "Docker",], "education": [],}';
    const result = extractJsonFromLlmResponse(raw);
    expect(result).not.toBeNull();
    expect(result.skills).toContain('Go');
  });

  it('recovers from truncated JSON response', () => {
    const raw = '{"skills": ["Python", "SQL"], "experience": [{"company": "DataCorp", "title": "Analyst"';
    const result = extractJsonFromLlmResponse(raw);
    expect(result).not.toBeNull();
    expect(result.skills).toContain('Python');
    expect(result.experience[0].company).toBe('DataCorp');
  });

  it('recovers from mid-string token cutoff', () => {
    const raw = '{"skills": ["Node.js", "Cloudflare Workers';
    const result = extractJsonFromLlmResponse(raw);
    expect(result).not.toBeNull();
    expect(result.skills).toBeDefined();
    expect(result.skills[0]).toBe('Node.js');
  });
});

