// functions/api/m2UniversalMarketIntelligence.test.ts
// Comprehensive Functional Test Suite for M02 Universal Role Coverage, Market Intelligence & Question Bank Quality

import { describe, it, expect, vi } from 'vitest';
import { app } from './[[route]]';

vi.mock('hono/jwt', () => ({
  sign: vi.fn(),
  verify: vi.fn().mockImplementation(async (token) => {
    if (token === 'candidate-token-m2-universal') {
      return { id: 'candidate-univ-test', role: 'candidate', full_name: 'Universal Candidate', organization_id: 'org-1' };
    }
    return null;
  })
}));

const nowIso = new Date().toISOString();

const mockIntelligenceItems = [
  {
    id: 'intel-swe-01',
    target_role: 'Software Developer',
    domain: 'dom_it',
    category: 'public_source',
    topic: 'Distributed Caching & Cache-Aside Invalidation',
    question: 'How do you prevent cache stampede under heavy read traffic?',
    question_type: 'system_design',
    difficulty_level: 4,
    evaluation_rubric_json: JSON.stringify([{ score: 5, criterion: 'Exemplary', description: 'Explains XFetch and mutex leases' }]),
    hints_json: JSON.stringify(['Consider what happens when hot key hits TTL zero.']),
    source_url: 'https://github.com/donnemartin/system-design-primer',
    source_publisher: 'System Design Primer',
    retrieved_at: nowIso,
    provenance_type: 'public_open_source_curation',
    occupation_id: 'occ_software_dev',
    seniority_level: 'senior',
    competency_name: 'Distributed Systems & Caching Architecture',
    is_stale: 0,
    last_verified_at: nowIso
  },
  {
    id: 'intel-swe-02',
    target_role: 'Software Developer',
    domain: 'dom_it',
    category: 'public_source',
    topic: 'Algorithmic Complexity & Defensive Edge Handling',
    question: 'How do you balance memory efficiency against execution time in stream logs?',
    question_type: 'technical',
    difficulty_level: 2,
    evaluation_rubric_json: JSON.stringify([{ score: 5, criterion: 'Exemplary', description: 'Uses iterators keeping O(1) space' }]),
    hints_json: JSON.stringify(['Focus on streaming generators rather than buffering.']),
    source_url: 'https://careers.google.com/how-we-hire/',
    source_publisher: 'Google Careers Official Engineering Guidance',
    retrieved_at: nowIso,
    company_context: 'Google SWE Interview Preparation Framework',
    provenance_type: 'employer_guidance',
    occupation_id: 'occ_software_dev',
    seniority_level: 'graduate',
    competency_name: 'Algorithmic Efficiency & Unit Test Design',
    is_stale: 0,
    last_verified_at: nowIso
  },
  {
    id: 'intel-mech-01',
    target_role: 'Mechanical Engineer',
    domain: 'dom_engineering',
    category: 'public_source',
    topic: 'Finite Element Analysis (FEA) Stress Singularities',
    question: 'How do you distinguish between physical stress concentration and mathematical stress singularity in FEA?',
    question_type: 'technical',
    difficulty_level: 3,
    evaluation_rubric_json: JSON.stringify([{ score: 5, criterion: 'Exemplary', description: 'Performs mesh convergence and fillet modeling' }]),
    hints_json: JSON.stringify(['Check stress divergence as mesh elements decrease.']),
    source_url: 'https://www.asme.org/codes-standards/find-codes-standards/y14-5-dimensioning-tolerancing',
    source_publisher: 'ASME Standards & NASA Systems Engineering Handbook',
    retrieved_at: nowIso,
    provenance_type: 'professional_association_standard',
    occupation_id: 'occ_mech_eng',
    seniority_level: 'mid',
    competency_name: 'Structural Mechanics & GD&T',
    is_stale: 0,
    last_verified_at: nowIso
  },
  {
    id: 'intel-fin-01',
    target_role: 'Financial Analyst',
    domain: 'dom_business',
    category: 'public_source',
    topic: 'Discounted Cash Flow (DCF) Modeling & Sensitivity Analysis',
    question: 'How do you derive Unlevered Free Cash Flow (FCFF) and set up WACC sensitivity?',
    question_type: 'case_study',
    difficulty_level: 2,
    evaluation_rubric_json: JSON.stringify([{ score: 5, criterion: 'Exemplary', description: 'Derives FCFF and pairs WACC against g' }]),
    hints_json: JSON.stringify(['Remember FCFF belongs to all capital providers.']),
    source_url: 'https://corporatefinanceinstitute.com/resources/valuation/discounted-cash-flow-dcf/',
    source_publisher: 'Corporate Finance Institute',
    retrieved_at: nowIso,
    provenance_type: 'professional_finance_institute',
    occupation_id: 'occ_fin_analyst',
    seniority_level: 'graduate',
    competency_name: 'Corporate Valuation & Financial Modeling',
    is_stale: 0,
    last_verified_at: nowIso
  },
  {
    id: 'intel-nurse-01',
    target_role: 'Registered Nurse',
    domain: 'dom_healthcare',
    category: 'public_source',
    topic: 'Clinical Deterioration Triage & SBAR Escalation',
    question: 'A postoperative patient shows tachycardia and hypotension. Describe your immediate triage and SBAR escalation.',
    question_type: 'case_study',
    difficulty_level: 1,
    evaluation_rubric_json: JSON.stringify([{ score: 5, criterion: 'Exemplary', description: 'Executes verbatim SBAR escalation and shock stabilization' }]),
    hints_json: JSON.stringify(['Structure communication into SBAR.']),
    source_url: 'https://www.ihi.org/resources/tools/sbar-tool-situation-background-assessment-recommendation',
    source_publisher: 'Institute for Healthcare Improvement',
    retrieved_at: nowIso,
    provenance_type: 'healthcare_quality_standard',
    occupation_id: 'occ_nurse',
    seniority_level: 'entry',
    competency_name: 'Clinical Triage, Patient Safety & SBAR',
    is_stale: 0,
    last_verified_at: nowIso
  },
  {
    id: 'intel-lead-01',
    target_role: 'Product Manager',
    domain: 'dom_management',
    category: 'public_source',
    topic: 'Behavioral STAR: Disagree and Commit & Cross-Functional Alignment',
    question: 'Tell me about a time you strongly disagreed with strategic leadership direction.',
    question_type: 'behavioral_star',
    difficulty_level: 4,
    evaluation_rubric_json: JSON.stringify([{ score: 5, criterion: 'Exemplary', description: 'Uses STAR, demonstrates empirical backbone and complete commitment' }]),
    hints_json: JSON.stringify(['Amazon Leadership Principle: Have Backbone; Disagree and Commit.']),
    source_url: 'https://www.amazon.jobs/content/en/how-we-hire/interviewing-at-amazon',
    source_publisher: 'Amazon Jobs Official Hiring Portal',
    retrieved_at: nowIso,
    company_context: 'Amazon Leadership Principles Behavioral Guidance',
    provenance_type: 'employer_guidance',
    occupation_id: 'occ_product_mgr',
    seniority_level: 'senior',
    competency_name: 'Executive Communication & Ownership',
    is_stale: 0,
    last_verified_at: nowIso
  }
];

const createUniversalMockEnv = () => {
  const storedDrills: any[] = [];

  return {
    DB: {
      prepare: (query: string) => {
        const createStatement = (boundArgs: any[]) => ({
          first: vi.fn().mockImplementation(async () => {
            if (query.includes('COUNT(*) as count FROM interview_intelligence_item') && !query.includes('WHERE')) {
              return { count: mockIntelligenceItems.length + storedDrills.length };
            }
            if (query.includes('COUNT(*) as count FROM interview_intelligence_item WHERE is_stale = 1')) {
              return { count: 0 };
            }
            if (query.includes('candidate_profile') || query.includes('user_account')) {
              return {
                id: 'profile-univ-test',
                user_id: 'candidate-univ-test',
                target_role: 'Financial Analyst',
                primary_domain: 'dom_business',
                organization_id: 'org-1'
              };
            }
            return null;
          }),
          run: vi.fn().mockImplementation(async () => {
            if (query.includes('INSERT INTO interview_intelligence_item')) {
              storedDrills.push({ id: boundArgs[0], target_role: boundArgs[1], domain: boundArgs[2], category: boundArgs[3], topic: boundArgs[4] });
            }
            return { success: true };
          }),
          all: vi.fn().mockImplementation(async () => {
            if (query.includes('GROUP BY domain')) {
              return {
                results: [
                  { domain: 'dom_it', count: 2 },
                  { domain: 'dom_engineering', count: 1 },
                  { domain: 'dom_business', count: 1 },
                  { domain: 'dom_healthcare', count: 1 },
                  { domain: 'dom_management', count: 1 }
                ]
              };
            }
            if (query.includes('GROUP BY target_role') && !query.includes('seniority_level')) {
              return {
                results: [
                  { target_role: 'Software Developer', count: 2 },
                  { target_role: 'Mechanical Engineer', count: 1 },
                  { target_role: 'Financial Analyst', count: 1 },
                  { target_role: 'Registered Nurse', count: 1 },
                  { target_role: 'Product Manager', count: 1 }
                ]
              };
            }
            if (query.includes('GROUP BY seniority')) {
              return {
                results: [
                  { seniority: 'entry', count: 1 },
                  { seniority: 'graduate', count: 2 },
                  { seniority: 'mid', count: 1 },
                  { seniority: 'senior', count: 2 }
                ]
              };
            }
            if (query.includes('GROUP BY question_type')) {
              return {
                results: [
                  { question_type: 'technical', count: 2 },
                  { question_type: 'case_study', count: 2 },
                  { question_type: 'system_design', count: 1 },
                  { question_type: 'behavioral_star', count: 1 }
                ]
              };
            }
            if (query.includes('GROUP BY prov_type')) {
              return {
                results: [
                  { prov_type: 'public_source', count: 4 },
                  { prov_type: 'employer_guidance', count: 2 }
                ]
              };
            }
            if (query.includes('SELECT id, topic, question, target_role, category, retrieved_at, last_verified_at, is_stale FROM interview_intelligence_item')) {
              return { results: [...mockIntelligenceItems, ...storedDrills] };
            }
            if (query.includes('SELECT * FROM interview_intelligence_item')) {
              let filtered = [...mockIntelligenceItems, ...storedDrills];
              if (query.includes("provenance_type = 'employer_guidance'")) {
                filtered = filtered.filter(i => i.provenance_type === 'employer_guidance' || i.category === 'employer_guidance');
              } else if (query.includes("category = 'public_source'") && query.includes("provenance_type != 'employer_guidance'")) {
                filtered = filtered.filter(i => i.category === 'public_source' && i.provenance_type !== 'employer_guidance');
              } else if (boundArgs.includes('llm_practice')) {
                filtered = filtered.filter(i => i.category === 'llm_practice');
              }

              if (boundArgs.includes('dom_engineering')) {
                filtered = filtered.filter(i => i.domain === 'dom_engineering');
              } else if (boundArgs.includes('dom_healthcare')) {
                filtered = filtered.filter(i => i.domain === 'dom_healthcare');
              } else if (boundArgs.includes('dom_business')) {
                filtered = filtered.filter(i => i.domain === 'dom_business');
              }

              if (boundArgs.includes('entry') || boundArgs.includes(1)) {
                filtered = filtered.filter(i => i.seniority_level === 'entry' || i.difficulty_level === 1);
              } else if (boundArgs.includes('senior') || boundArgs.includes(4)) {
                filtered = filtered.filter(i => i.seniority_level === 'senior' || i.difficulty_level >= 4);
              }

              if (boundArgs.includes('case_study')) {
                filtered = filtered.filter(i => i.question_type === 'case_study');
              } else if (boundArgs.includes('behavioral_star')) {
                filtered = filtered.filter(i => i.question_type === 'behavioral_star');
              }

              const searchArg = boundArgs.find(a => typeof a === 'string' && a.startsWith('%') && a.endsWith('%'));
              if (searchArg) {
                const term = searchArg.replace(/%/g, '').toLowerCase();
                filtered = filtered.filter(i => 
                  (i.topic && i.topic.toLowerCase().includes(term)) ||
                  (i.question && i.question.toLowerCase().includes(term)) ||
                  (i.target_role && i.target_role.toLowerCase().includes(term))
                );
              }

              return { results: filtered };
            }
            return { results: [] };
          })
        });

        const rootStatement = createStatement([]);
        return {
          bind: (...args: any[]) => createStatement(args),
          first: rootStatement.first,
          all: rootStatement.all,
          run: rootStatement.run
        };
      }
    },
    SESSION_KV: {
      get: vi.fn().mockImplementation(async (id: string) => {
        if (id === 'session:candidate-token-m2-universal') return 'candidate-token-m2-universal';
        return null;
      }),
      put: vi.fn(),
      delete: vi.fn()
    },
    JWT_SECRET: 'test-secret'
  };
};

describe('M02 Universal Role Coverage & Market Intelligence Engine', () => {
  const authHeaders = {
    'Cookie': 'intellihire_session=candidate-token-m2-universal',
    'Content-Type': 'application/json'
  };

  it('1. Domain Coverage: filters engineering, healthcare, and business benchmarks accurately', async () => {
    const env = createUniversalMockEnv();

    // Engineering domain
    const engRes = await app.request('/api/m2/intelligence/questions?domain=dom_engineering', {
      headers: authHeaders
    }, env);
    expect(engRes.status).toBe(200);
    const engData = await engRes.json() as any;
    expect(engData.success).toBe(true);
    expect(engData.questions.length).toBeGreaterThan(0);
    expect(engData.questions[0].target_role).toBe('Mechanical Engineer');
    expect(engData.questions[0].domain).toBe('dom_engineering');

    // Healthcare domain
    const healthRes = await app.request('/api/m2/intelligence/questions?domain=dom_healthcare', {
      headers: authHeaders
    }, env);
    expect(healthRes.status).toBe(200);
    const healthData = await healthRes.json() as any;
    expect(healthData.success).toBe(true);
    expect(healthData.questions[0].target_role).toBe('Registered Nurse');
    expect(healthData.questions[0].domain).toBe('dom_healthcare');

    // Business domain
    const bizRes = await app.request('/api/m2/intelligence/questions?domain=dom_business', {
      headers: authHeaders
    }, env);
    expect(bizRes.status).toBe(200);
    const bizData = await bizRes.json() as any;
    expect(bizData.success).toBe(true);
    expect(bizData.questions[0].target_role).toBe('Financial Analyst');
  });

  it('2. Seniority Coverage: correctly isolates entry-level versus senior interview standards', async () => {
    const env = createUniversalMockEnv();

    // Entry level
    const entryRes = await app.request('/api/m2/intelligence/questions?seniority=entry', {
      headers: authHeaders
    }, env);
    expect(entryRes.status).toBe(200);
    const entryData = await entryRes.json() as any;
    expect(entryData.success).toBe(true);
    expect(entryData.questions.every((q: any) => q.seniority_level === 'entry' || q.difficulty_level === 1)).toBe(true);

    // Senior level
    const seniorRes = await app.request('/api/m2/intelligence/questions?seniority=senior', {
      headers: authHeaders
    }, env);
    expect(seniorRes.status).toBe(200);
    const seniorData = await seniorRes.json() as any;
    expect(seniorData.success).toBe(true);
    expect(seniorData.questions.every((q: any) => q.seniority_level === 'senior' || q.difficulty_level >= 4)).toBe(true);
  });

  it('3. Question Track Taxonomy: distinguishes Case Studies, Behavioral STAR, and Technical rounds without cross-contamination', async () => {
    const env = createUniversalMockEnv();

    // Case studies
    const caseRes = await app.request('/api/m2/intelligence/questions?type=case_study', {
      headers: authHeaders
    }, env);
    expect(caseRes.status).toBe(200);
    const caseData = await caseRes.json() as any;
    expect(caseData.success).toBe(true);
    expect(caseData.questions.every((q: any) => q.question_type === 'case_study')).toBe(true);
    // Verified that non-technical roles (Nurse, Financial Analyst) are case studies without LeetCode programming
    expect(caseData.questions.some((q: any) => q.target_role === 'Registered Nurse' || q.target_role === 'Financial Analyst')).toBe(true);

    // Behavioral STAR
    const starRes = await app.request('/api/m2/intelligence/questions?type=behavioral_star', {
      headers: authHeaders
    }, env);
    expect(starRes.status).toBe(200);
    const starData = await starRes.json() as any;
    expect(starData.success).toBe(true);
    expect(starData.questions[0].question_type).toBe('behavioral_star');
    expect(starData.questions[0].topic).toContain('STAR');
  });

  it('4. Source Provenance: strictly labels Employer Published Guidance vs Public Benchmarks', async () => {
    const env = createUniversalMockEnv();

    const empRes = await app.request('/api/m2/intelligence/questions?category=employer_guidance', {
      headers: authHeaders
    }, env);
    expect(empRes.status).toBe(200);
    const empData = await empRes.json() as any;
    expect(empData.success).toBe(true);
    expect(empData.questions.length).toBeGreaterThan(0);
    
    // Each item must be marked as employer published guidance
    for (const item of empData.questions) {
      expect(item.is_employer_guidance).toBe(true);
      expect(item.provenance_label).toBe('Official Employer Published Guidance');
      expect(item.publisher).toBeDefined();
      expect(item.company_context).toBeDefined();
    }
  });

  it('5. Keyword Search: accurately finds domain terminology (SBAR triage, DCF sensitivity)', async () => {
    const env = createUniversalMockEnv();

    const searchRes = await app.request('/api/m2/intelligence/questions?q=SBAR', {
      headers: authHeaders
    }, env);
    expect(searchRes.status).toBe(200);
    const searchData = await searchRes.json() as any;
    expect(searchData.success).toBe(true);
    expect(searchData.questions[0].topic).toContain('SBAR');
    expect(searchData.questions[0].target_role).toBe('Registered Nurse');
  });

  it('6. Coverage & Freshness Dashboard: delivers explicit measurable metrics across 5 domains and prioritized gaps', async () => {
    const env = createUniversalMockEnv();

    const covRes = await app.request('/api/m2/intelligence/coverage', {
      headers: authHeaders
    }, env);
    expect(covRes.status).toBe(200);
    const covData = await covRes.json() as any;
    expect(covData.success).toBe(true);
    expect(covData.total_items).toBeGreaterThan(0);
    expect(covData.total_occupations_covered).toBe(5);
    expect(covData.freshness_rate_pct).toBe(100);
    expect(covData.domains.dom_it).toBe(2);
    expect(covData.domains.dom_engineering).toBe(1);
    expect(covData.domains.dom_business).toBe(1);
    expect(covData.domains.dom_healthcare).toBe(1);
    expect(covData.domains.dom_management).toBe(1);
    expect(Array.isArray(covData.prioritized_gaps)).toBe(true);
    expect(covData.prioritized_gaps.length).toBeGreaterThan(0);
  });

  it('7. Dynamic Practice Drill Generation: generates healthcare clinical drill with 3-tier rubric and progressive hints', async () => {
    const env = createUniversalMockEnv();

    const genRes = await app.request('/api/m2/intelligence/generate', {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({
        target_role: 'Registered Nurse',
        domain: 'dom_healthcare',
        seniority_level: 'entry',
        question_type: 'case_study',
        competency: 'Emergency Clinical Triage & SBAR Escalation',
        learning_objective: 'Master rapid vital assessment and structured provider communication under time pressure',
        store_in_bank: true
      })
    }, env);

    expect(genRes.status).toBe(200);
    const genData = await genRes.json() as any;
    expect(genData.success).toBe(true);
    expect(genData.item).toBeDefined();
    expect(genData.item.category).toBe('llm_practice');
    expect(genData.item.provenance_type).toBe('ai_synthesized');
    expect(genData.item.provenance_label).toContain('LLM Practice Drill (Generated for preparation, not an actual employer interview question)');
    expect(genData.item.source_url).toBeNull(); // No fabricated URLs
    expect(genData.item.company_context).toBeNull(); // No fabricated company attribution
    expect(genData.item.hints.length).toBe(2);
    expect(genData.item.rubric_criteria.length).toBe(3);
    // Non-IT clinical question must NOT ask coding questions
    expect(genData.item.prompt).not.toContain('function');
    expect(genData.item.prompt).not.toContain('class');
    expect(genData.item.prompt).toContain('clinical');
  });

  it('8. Freshness Audit & Deduplication: validates active benchmarks and reports audit metrics', async () => {
    const env = createUniversalMockEnv();

    const auditRes = await app.request('/api/m2/intelligence/verify-freshness', {
      method: 'POST',
      headers: authHeaders
    }, env);

    expect(auditRes.status).toBe(200);
    const auditData = await auditRes.json() as any;
    expect(auditData.success).toBe(true);
    expect(auditData.total_audited).toBeGreaterThan(0);
    expect(auditData.stale_items_count).toBe(0);
    expect(auditData.refresh_policy.freshness_window_days).toBe(180);
  });
});
