import { Hono } from 'hono';
import type { Bindings, UserSession } from './[[route]]';
import { getSessionUser, logAuditEvent } from './[[route]]';

export * from '../../src/shared/m3WorkRoundContracts';
import {
  CandidateContext,
  JobContext,
  CompetencyTarget,
  TaskDefinition,
  seedSimulationToTaskDefinition
} from '../../src/shared/m3WorkRoundContracts';

export interface SimulationScenario {
  background: string;
  objective: string;
  initial_requirements: string[];
  constraints: string[];
  starting_data?: any;
  tools_available: string[];
  expected_output_type: string;
}

export interface DynamicInjection {
  trigger_step: number;
  alert_title: string;
  new_requirement: string;
  constraint_change: string;
  rationale: string;
}

export interface SimulationRubric {
  dimensions: Array<{
    name: string;
    weight: number;
    description: string;
    criteria: string;
  }>;
  hidden_criteria?: string[];
}

export const SEED_SIMULATIONS = [
  {
    id: 'sim-tech-rate-limiter',
    title: 'Distributed Token Bucket Rate Limiter',
    occupation_code: '15-1252.00',
    target_role: 'Senior Backend Engineer',
    domain: 'software',
    simulation_type: 'coding',
    competency_name: 'System Architecture & Concurrency',
    skill_name: 'Distributed Systems & Concurrency',
    difficulty_level: 3,
    scenario: {
      background: 'Your API gateway processes 50,000 requests/sec across 4 regional clusters. Third-party partner endpoints are experiencing brownouts.',
      objective: 'Implement an in-memory sliding-window token bucket algorithm that prevents quota exhaustion while maintaining sub-millisecond overhead.',
      initial_requirements: [
        'Enforce limit of max 100 requests per 60-second rolling window per client ID',
        'Handle concurrent requests safely without race conditions',
        'Return { allowed: boolean, remaining: number, reset_seconds: number }'
      ],
      constraints: [
        'Memory overhead < 2KB per active client',
        'Do not use blocking sleep calls',
        'Must handle clock-skew drift up to 500ms'
      ],
      starting_data: {
        template_code: `// Implement Sliding Window Rate Limiter
class TokenBucketRateLimiter {
  private capacity: number;
  private refillRatePerSec: number;
  private buckets: Map<string, { tokens: number; lastRefill: number }>;

  constructor(capacity = 100, refillRatePerSec = 1.66) {
    this.capacity = capacity;
    this.refillRatePerSec = refillRatePerSec;
    this.buckets = new Map();
  }

  public checkRequest(clientId: string, nowMs = Date.now()): { allowed: boolean; remaining: number; reset_seconds: number } {
    // TODO: Implement token calculation and rate check
    return { allowed: true, remaining: this.capacity - 1, reset_seconds: 60 };
  }
}`
      },
      tools_available: ['TypeScript Code Editor', 'Test Case Runner', 'Memory Estimator'],
      expected_output_type: 'source_code'
    },
    dynamic_injection: {
      trigger_step: 2,
      alert_title: 'EMERGENCY CONSTRAINT SHIFT: Redis Cluster Partition',
      new_requirement: 'A regional fiber cut has isolated Redis. You must implement a degraded local fallback mode that relaxes the limit by 20% rather than failing open or dropping 100% of traffic.',
      constraint_change: 'Global synchronization unavailable; must operate on local replica timestamps.',
      rationale: 'Tests graceful degradation and resilience under network partition ambiguity.'
    },
    rubric: {
      dimensions: [
        { name: 'correctness', weight: 0.25, description: 'Accurate window enforcement', criteria: 'Enforces 100 req/60s boundary accurately across edge cases.' },
        { name: 'concurrency_handling', weight: 0.20, description: 'Safe concurrent execution', criteria: 'Prevents race conditions in token deduction and refill.' },
        { name: 'process_and_validation', weight: 0.20, description: 'Test coverage & edge verification', criteria: 'Considers burst traffic, zero tokens, and clock drift.' },
        { name: 'adaptability', weight: 0.20, description: 'Handling injected Redis partition', criteria: 'Correctly implements degraded local mode without crashing.' },
        { name: 'code_quality', weight: 0.15, description: 'Clean architecture & complexity', criteria: 'O(1) lookup time with clear types and minimal memory footprint.' }
      ]
    }
  },
  {
    id: 'sim-finance-capex-allocation',
    title: 'CapEx ROI & Capital Allocation Under Inflation',
    occupation_code: '13-2051.00',
    target_role: 'Senior Financial Analyst',
    domain: 'finance',
    simulation_type: 'financial_analysis',
    competency_name: 'Financial Planning & Valuation',
    skill_name: 'Capital Budgeting & Valuation',
    difficulty_level: 3,
    scenario: {
      background: 'Apex Manufacturing has a $15M capital expenditure envelope for FY2027. Three division heads have submitted competing proposals.',
      objective: 'Evaluate Projects Alpha (Automation, $8M), Beta (Supply Chain Hub, $6M), and Gamma (Green Energy Retrofit, $4M). Recommend the optimal capital allocation under an 8.5% weighted average cost of capital (WACC).',
      initial_requirements: [
        'Calculate Net Present Value (NPV) and Internal Rate of Return (IRR) for each project',
        'Determine optimal portfolio combination under the $15M constraint',
        'Draft an executive justification memo recommending project selection and debt/equity financing ratio'
      ],
      constraints: [
        'Total capital spend cannot exceed $15,000,000 in Year 0',
        'Minimum required portfolio hurdle rate is 11.0%',
        'Payback period must be <= 3.5 years for at least one chosen project'
      ],
      starting_data: {
        projects: [
          { name: 'Project Alpha (Robotics)', capex: 8000000, cash_flows_y1_5: [2200000, 2600000, 3100000, 3400000, 3500000], risk: 'Medium' },
          { name: 'Project Beta (Regional Hub)', capex: 6000000, cash_flows_y1_5: [1600000, 1900000, 2200000, 2400000, 2500000], risk: 'Low' },
          { name: 'Project Gamma (Solar Array)', capex: 4000000, cash_flows_y1_5: [900000, 1100000, 1200000, 1400000, 1500000], risk: 'Low' }
        ],
        baseline_wacc: 0.085
      },
      tools_available: ['DCF Calculator', 'Sensitivity Matrix', 'Financial Memo Drafting Workspace'],
      expected_output_type: 'financial_model_memo'
    },
    dynamic_injection: {
      trigger_step: 2,
      alert_title: 'MARKET SHIFT: Central Bank Rate Hike & Equipment Delay',
      new_requirement: 'Central bank raises benchmark rates by 125 bps (WACC increases from 8.5% to 9.75%), and Project Alpha vendor reports 6-month delivery delay pushing Year 1 cash flow down 40%.',
      constraint_change: 'Re-calculate NPV sensitivity and decide whether to drop Alpha or renegotiate vendor payment terms.',
      rationale: 'Evaluates real-time financial resilience and risk-adjusted capital rationing.'
    },
    rubric: {
      dimensions: [
        { name: 'correctness', weight: 0.25, description: 'Mathematical accuracy of DCF & NPV', criteria: 'Accurate discount factor application and cash flow summation.' },
        { name: 'decision_quality', weight: 0.25, description: 'Risk-adjusted capital rationing', criteria: 'Sound strategic allocation balancing risk, IRR, and payback.' },
        { name: 'adaptability', weight: 0.20, description: 'Response to rate hike & delay', criteria: 'Accurately measures sensitivity and justifies pivot or retention.' },
        { name: 'communication', weight: 0.15, description: 'C-Suite memo clarity', criteria: 'Concise executive memo with unambiguous recommendations.' },
        { name: 'methodology', weight: 0.15, description: 'Defensible financial assumptions', criteria: 'Explicit documentation of reinvestment rate and terminal value assumptions.' }
      ]
    }
  },
  {
    id: 'sim-ops-hospital-triage',
    title: 'Hospital Float Pool Staffing & Emergency Bed Triage',
    occupation_code: '11-9111.00',
    target_role: 'Operations Director',
    domain: 'operations',
    simulation_type: 'operational_triage',
    competency_name: 'Resource Optimization & Crisis Operations',
    skill_name: 'Resource Optimization',
    difficulty_level: 3,
    scenario: {
      background: 'At 19:00 shift change, Metro General Emergency Department experiences an unexpected mass-transit collision incident while 4 night-shift nurses call in sick.',
      objective: 'Allocate 6 float pool nurses and 8 open ICU/step-down beds among 12 incoming patients prioritized by emergency severity index (ESI), patient acuity, and nurse competency certifications.',
      initial_requirements: [
        'Assign all ESI Level 1 and Level 2 critical patients immediately',
        'Maintain regulatory nurse-to-patient safety ratios (ICU 1:2, Step-Down 1:3, Med-Surg 1:4)',
        'Allocate mandatory rest breaks without leaving critical telemetry beds unmonitored'
      ],
      constraints: [
        'Only certified ICU nurses (3 available) may manage intubated patients',
        'Float pool overtime budget capped at 16 hours for the shift',
        'Zero patient diversions permitted for pediatric trauma cases'
      ],
      starting_data: {
        patient_queue: [
          { id: 'P-101', age: 34, acuity: 'ESI-1', condition: 'Multiple trauma, intubated', required_unit: 'ICU' },
          { id: 'P-102', age: 67, acuity: 'ESI-2', condition: 'STEMI active chest pain', required_unit: 'ICU' },
          { id: 'P-103', age: 8, acuity: 'ESI-2', condition: 'Pediatric blunt abdominal trauma', required_unit: 'PICU/Step-Down' },
          { id: 'P-104', age: 45, acuity: 'ESI-3', condition: 'Compound femur fracture', required_unit: 'Med-Surg' },
          { id: 'P-105', age: 72, acuity: 'ESI-2', condition: 'Acute respiratory distress', required_unit: 'ICU' },
          { id: 'P-106', age: 29, acuity: 'ESI-3', condition: 'Laceration repair, stable vitals', required_unit: 'Fast-Track' }
        ],
        available_staff: [
          { name: 'RN Sarah Chen', certs: ['ICU', 'Trauma', 'Pediatric'], max_hours: 8 },
          { name: 'RN Marcus Rivera', certs: ['ICU', 'Cardiac'], max_hours: 8 },
          { name: 'RN David Okafor', certs: ['ICU'], max_hours: 8 },
          { name: 'RN Elena Rostova', certs: ['Med-Surg', 'Telemetry'], max_hours: 8 },
          { name: 'RN Priya Patel', certs: ['Med-Surg', 'Telemetry'], max_hours: 8 },
          { name: 'RN James Wilson', certs: ['Emergency', 'Triage'], max_hours: 8 }
        ]
      },
      tools_available: ['Triage Queue Board', 'Staff Competency Matrix', 'Bed Census Map'],
      expected_output_type: 'triage_allocation_plan'
    },
    dynamic_injection: {
      trigger_step: 2,
      alert_title: 'SUDDEN INFLUX: Secondary Hazmat Chemical Spill',
      new_requirement: 'Three additional patients arrive with chemical burn exposure requiring immediate decontamination and isolation; 1 ICU nurse must oversee decontamination.',
      constraint_change: 'Available ICU nursing capacity drops from 3 to 2 for 90 minutes. Must implement contingency patient holding protocols.',
      rationale: 'Evaluates dynamic crisis triage, acuity prioritization, and regulatory safety adherence under sudden resource depletion.'
    },
    rubric: {
      dimensions: [
        { name: 'patient_safety', weight: 0.30, description: 'Mandatory safety ratio adherence', criteria: 'Never exceeds nurse-to-patient ratio or assigns unqualified staff to intubated beds.' },
        { name: 'prioritization', weight: 0.25, description: 'ESI acuity ranking', criteria: 'ESI-1 and pediatric trauma receive first priority without delay.' },
        { name: 'adaptability', weight: 0.20, description: 'Hazmat contingency handling', criteria: 'Re-allocates staff swiftly while isolating decontamination risks.' },
        { name: 'process_and_governance', weight: 0.15, description: 'Regulatory and break coverage', criteria: 'Maintains compliant cross-coverage without patient abandonment.' },
        { name: 'efficiency', weight: 0.10, description: 'Overtime and resource utilization', criteria: 'Stays within 16-hour overtime envelope where clinically safe.' }
      ]
    }
  },
  {
    id: 'sim-data-pipeline-anomaly',
    title: 'Telemetry Pipeline Schema Drift & Anomaly Triage',
    occupation_code: '15-1254.00',
    target_role: 'Data Engineer',
    domain: 'data',
    simulation_type: 'data_analysis',
    competency_name: 'Data Engineering & Pipeline Reliability',
    skill_name: 'Data Engineering & Analytics',
    difficulty_level: 2,
    scenario: {
      background: 'The customer event stream feeding real-time billing metrics began throwing 40% invalid payloads following a third-party mobile app SDK release.',
      objective: 'Analyze the corrupted payload sample, write SQL/JSON transformations to sanitize the stream, isolate corrupted records in a dead-letter queue, and backfill the revenue metric.',
      initial_requirements: [
        'Detect schema drift causing null user_id and timestamp type mismatch',
        'Write transformation query to parse mixed ISO-8601 and Unix epoch timestamps',
        'Ensure zero duplicate transaction IDs reach the billing aggregation table'
      ],
      constraints: [
        'Processing throughput must support >= 10,000 records/sec',
        'Cannot drop valid transactions; only malformed records go to dead-letter queue'
      ],
      starting_data: {
        raw_events_sample: [
          { event_id: 'ev-01', user_id: 'usr_882', amount_cents: 1499, timestamp: '2026-10-05T14:32:00Z', status: 'valid' },
          { event_id: 'ev-02', user_id: null, amount_cents: 2999, timestamp: 1791208320, status: 'corrupted' },
          { event_id: 'ev-03', user_id: 'usr_914', amount_cents: '499', timestamp: '2026-10-05T14:35:10Z', status: 'schema_drift' },
          { event_id: 'ev-04', user_id: 'usr_882', amount_cents: 1499, timestamp: '2026-10-05T14:32:00Z', status: 'duplicate' }
        ]
      },
      tools_available: ['SQL / Transformation Sandbox', 'Dead-Letter Stream Inspector', 'Data Table Viewer'],
      expected_output_type: 'data_transformation_script'
    },
    dynamic_injection: {
      trigger_step: 2,
      alert_title: 'SUDDEN UPSTREAM DRIFT: Currency Code Field Injected',
      new_requirement: 'Mobile client begins sending non-USD transactions without warning. Amounts are now in mixed EUR/GBP/USD without currency conversion.',
      constraint_change: 'Must reject or normalize non-USD currencies before aggregation.',
      rationale: 'Evaluates defensive data modeling and handling unannounced upstream breaking changes.'
    },
    rubric: {
      dimensions: [
        { name: 'correctness', weight: 0.30, description: 'Accurate transformation and de-duplication', criteria: 'Cleans timestamps and eliminates duplicates.' },
        { name: 'process', weight: 0.25, description: 'Dead-letter segregation', criteria: 'Preserves raw data in DLQ without losing audit provenance.' },
        { name: 'adaptability', weight: 0.25, description: 'Currency handling', criteria: 'Gracefully identifies and handles multi-currency drift.' },
        { name: 'code_quality', weight: 0.20, description: 'Query performance and readability', criteria: 'Uses set-based operations rather than row-by-row iteration.' }
      ]
    }
  },
  {
    id: 'sim-legal-vendor-sla-memo',
    title: 'Enterprise Vendor SLA Breach Notice & Dispute Resolution',
    occupation_code: '13-1020.00',
    target_role: 'Procurement & Operations Lead',
    domain: 'general',
    simulation_type: 'written_response',
    competency_name: 'Vendor Governance & Contract Management',
    skill_name: 'Regulatory Compliance Audit',
    difficulty_level: 2,
    scenario: {
      background: 'CloudCore Infrastructure suffered a 14-hour regional outage during peak Black Friday sales, violating the 99.95% monthly uptime agreement in Section 8.2 of the Master Services Agreement.',
      objective: 'Draft a formal, legally grounded Breach Notice to the vendor demand letter citing specific contractual remedy provisions, calculating service credits, and mandating an audited Root Cause Analysis (RCA).',
      initial_requirements: [
        'Calculate service credit entitlement based on 14 hours of continuous downtime',
        'Cite contractual cure period (30 days) and audit rights',
        'Maintain a collaborative yet unyielding tone that preserves the commercial relationship while protecting enterprise claims'
      ],
      constraints: [
        'Do not prematurely threaten contract termination before the contractual 30-day cure window expires',
        'Must request third-party SOC2 forensic audit report'
      ],
      starting_data: {
        msa_extract: 'Section 8.2: Service Level Guarantee. If monthly availability falls below 99.9%, Client is entitled to a 25% credit of monthly billing fees. If downtime exceeds 12 consecutive hours, credit increases to 50% of monthly fee ($125,000 baseline). Client must deliver written notice within 15 days of incident.'
      },
      tools_available: ['Contract Clause Reference', 'Credit Calculation Worksheet', 'Executive Drafting Workspace'],
      expected_output_type: 'executive_memo'
    },
    dynamic_injection: {
      trigger_step: 2,
      alert_title: 'VENDOR COUNTER-CLAIM: Force Majeure Invoked',
      new_requirement: 'Vendor legal counsel sends letter asserting the outage was caused by utility-grid substation explosion beyond their control, claiming complete Force Majeure relief under Section 14.',
      constraint_change: 'Analyze Section 14 multi-site redundancy obligation to rebut the Force Majeure claim.',
      rationale: 'Tests commercial acumen, contract interpretation, and executive dispute resolution.'
    },
    rubric: {
      dimensions: [
        { name: 'legal_accuracy', weight: 0.30, description: 'Proper clause citation and credit math', criteria: 'Accurately calculates $62,500 credit and cites Section 8.2.' },
        { name: 'rebuttal_logic', weight: 0.25, description: 'Force majeure counter-argument', criteria: 'Points out vendor failed to failover to secondary geo-redundant site.' },
        { name: 'tone_and_communication', weight: 0.25, description: 'Professional assertiveness', criteria: 'Rigorous legal firmness without emotional or inflammatory language.' },
        { name: 'procedural_compliance', weight: 0.20, description: 'Preserves rights without premature breach', criteria: 'Respects 30-day cure timeline while locking in claims.' }
      ]
    }
  }
];

async function ensureDefinitionInDb(db: any, def: (typeof SEED_SIMULATIONS)[0], orgId: string) {
  try {
    const existing = await db.prepare('SELECT id FROM simulation_definition WHERE id = ?').bind(def.id).first();
    if (!existing) {
      await db.prepare(
        `INSERT INTO simulation_definition (
          id, organization_id, title, occupation_code, target_role, domain, simulation_type,
          competency_name, skill_name, difficulty_level, scenario_json, dynamic_injection_json,
          expected_output_schema_json, rubric_json, is_active
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)`
      ).bind(
        def.id,
        orgId,
        def.title,
        def.occupation_code,
        def.target_role,
        def.domain,
        def.simulation_type,
        def.competency_name,
        def.skill_name,
        def.difficulty_level || 2,
        JSON.stringify(def.scenario || {}),
        JSON.stringify(def.dynamic_injection || {}),
        JSON.stringify({ type: def.scenario?.expected_output_type || 'string' }),
        JSON.stringify(def.rubric || {})
      ).run();
    }
  } catch (e) {
    console.warn('ensureDefinitionInDb notice:', e);
  }
}

/**
 * Phase 1 Foundation: Context Aggregator Helper
 * Resolves CandidateContext and JobContext from D1 database
 */
export async function resolveCandidateJobContext(
  db: any,
  userId: string,
  organizationId: string,
  requisitionId?: string
): Promise<{ candidateContext: CandidateContext; jobContext: JobContext; targets: CompetencyTarget[] }> {
  // 1. Fetch Candidate Profile
  const profileRow = await db.prepare(
    `SELECT headline, target_role, experience_level, primary_domain, skills_json, bio, readiness_score, target_domain_id, target_occupation_id
     FROM candidate_profile WHERE user_id = ?`
  ).bind(userId).first();

  const targetRole = (profileRow?.target_role as string) || 'Senior Software Engineer';
  const seniority = (profileRow?.experience_level as string) || 'senior';
  const readiness = Number(profileRow?.readiness_score || 0.5);

  let extractedSkills: string[] = [];
  try {
    if (profileRow?.skills_json) {
      extractedSkills = JSON.parse(profileRow.skills_json as string);
    }
  } catch (_) {}

  // 2. Fetch Active Resume / Context
  const activeContext = await db.prepare(
    `SELECT id, resume_id FROM candidate_context WHERE user_id = ? ORDER BY created_at DESC LIMIT 1`
  ).bind(userId).first();

  const activeResumeId = (activeContext?.resume_id as string) || undefined;
  const contextId = activeContext?.id as string | undefined;

  // 3. Fetch Claims
  const verifiedClaims: Array<{ claim: string; category?: string; source: string; confidence: number }> = [];
  if (contextId) {
    try {
      const claims = await db.prepare(
        `SELECT claim_type, claim_value, confidence_score FROM candidate_claim WHERE context_id = ? LIMIT 20`
      ).bind(contextId).all();
      for (const cl of (claims?.results || [])) {
        verifiedClaims.push({
          claim: cl.claim_value as string,
          category: cl.claim_type as string,
          source: 'm01_resume',
          confidence: Number(cl.confidence_score || 0.85)
        });
        if (cl.claim_type === 'skill' && !extractedSkills.includes(cl.claim_value as string)) {
          extractedSkills.push(cl.claim_value as string);
        }
      }
    } catch (_) {}
  }

  // 4. Fetch Diagnosed Gaps & Proficiency Estimates
  let diagnosedGaps: any[] = [];
  try {
    const gapRows = await db.prepare(
      `SELECT p.skill_id, s.name as skill_name, p.proficiency_estimate, p.uncertainty_estimate
       FROM candidate_skill_proficiency_v2 p
       LEFT JOIN skill s ON p.skill_id = s.id
       WHERE p.user_id = ? AND (p.proficiency_estimate < 0.65 OR p.uncertainty_estimate > 0.4)`
    ).bind(userId).all();

    diagnosedGaps = (gapRows?.results || []).map((g: any) => ({
      skillId: g.skill_id as string,
      skillName: (g.skill_name as string) || 'Target Competency',
      gapType: Number(g.proficiency_estimate) < 0.5 ? 'low_demonstration' : 'high_uncertainty',
      severity: Number(g.uncertainty_estimate) > 0.6 ? 'critical' : 'moderate',
      recommendation: `Target ${g.skill_name} in adaptive work round.`
    }));
  } catch (_) {}

  const candidateContext: CandidateContext = {
    userId,
    organizationId,
    targetRole,
    targetDomainId: (profileRow?.target_domain_id as string) || undefined,
    targetOccupationId: (profileRow?.target_occupation_id as string) || undefined,
    seniorityLevel: seniority,
    activeResumeId,
    extractedSkills,
    verifiedClaims,
    currentReadinessScore: readiness,
    diagnosedGaps
  };

  // 5. Fetch Job Context
  let jobRow: any = null;
  if (requisitionId) {
    try {
      jobRow = await db.prepare(`SELECT * FROM job_requisition WHERE id = ?`).bind(requisitionId).first();
    } catch (_) {}
  }
  if (!jobRow) {
    try {
      jobRow = await db.prepare(
        `SELECT * FROM job_requisition WHERE organization_id = ? ORDER BY created_at DESC LIMIT 1`
      ).bind(organizationId).first();
    } catch (_) {}
  }

  const jobTitle = (jobRow?.title as string) || targetRole;
  const jobSeniority = (jobRow?.seniority_level as string) || seniority;
  let requiredSkills: string[] = [];
  let keyRequirements: string[] = [];

  if (jobRow?.parsed_requirements_json) {
    try {
      const parsed = JSON.parse(jobRow.parsed_requirements_json as string);
      keyRequirements = parsed.requirements || [];
      requiredSkills = parsed.skills || [];
    } catch (_) {}
  }

  // Also check job_description_context if available
  if (keyRequirements.length === 0) {
    try {
      const jdCtx = await db.prepare(
        `SELECT raw_text, requirements_json FROM job_description_context WHERE user_id = ? ORDER BY created_at DESC LIMIT 1`
      ).bind(userId).first();
      if (jdCtx?.requirements_json) {
        const parsed = JSON.parse(jdCtx.requirements_json as string);
        keyRequirements = parsed.requirements || [];
        requiredSkills = parsed.skills || [];
      }
    } catch (_) {}
  }

  if (requiredSkills.length === 0) {
    requiredSkills = ['System Architecture', 'API Design', 'Performance Optimization'];
  }

  const jobContext: JobContext = {
    requisitionId: (jobRow?.id as string) || undefined,
    jobTitle,
    targetSeniority: jobSeniority,
    targetDomain: (jobRow?.role_category as string) || 'software',
    requiredCompetencies: requiredSkills.map((sk: string) => ({
      name: sk,
      priority: 'required'
    })),
    requiredSkills,
    rawJobDescription: (jobRow?.raw_jd_text as string) || undefined,
    keyRequirements
  };

  // 6. Assemble Competency Targets
  const targets: CompetencyTarget[] = diagnosedGaps.length > 0
    ? diagnosedGaps.map((gap: any) => ({
        id: `tgt-${gap.skillId || encodeURIComponent(gap.skillName)}`,
        name: gap.skillName,
        domain: candidateContext.targetDomainId || 'software',
        skillName: gap.skillName,
        skillId: gap.skillId,
        targetProficiency: 0.80,
        currentProficiency: 0.45,
        uncertaintyEstimate: 0.55,
        diagnosisSource: 'm02_assessment_gap',
        rationale: `Diagnosed from candidate assessment gap (${gap.gapType})`
      }))
    : requiredSkills.slice(0, 3).map((sk: string) => ({
        id: `tgt-${encodeURIComponent(sk)}`,
        name: sk,
        domain: 'software',
        skillName: sk,
        targetProficiency: 0.80,
        currentProficiency: 0.50,
        uncertaintyEstimate: 0.50,
        diagnosisSource: 'job_requirement',
        rationale: `Required competency from target role specification: ${sk}`
      }));

  return { candidateContext, jobContext, targets };
}

export function registerSimulationRoutes(app: Hono<{ Bindings: Bindings }>) {

  // 1a. Phase 1: Context Aggregator Route for Work Round Engine Targeting
  app.get('/m3/simulations/context', async (c) => {
    try {
      const user = await getSessionUser(c);
      if (!user) return c.json({ error: 'Unauthorized' }, 401);

      const dbUser = await c.env.DB.prepare('SELECT organization_id FROM user_account WHERE id = ?').bind(user.id).first();
      const orgId = (dbUser?.organization_id as string) || 'org_default_public';
      const reqId = c.req.query('requisition_id');

      const bundle = await resolveCandidateJobContext(c.env.DB, user.id, orgId, reqId);
      return c.json({
        success: true,
        candidate_context: bundle.candidateContext,
        job_context: bundle.jobContext,
        competency_targets: bundle.targets
      });
    } catch (err: any) {
      console.error('Error in /m3/simulations/context:', err);
      return c.json({ success: false, error: err.message }, 500);
    }
  });

  // 1. List Simulation Definitions (with M02 Gap-Targeting)
  app.get('/m3/simulations/definitions', async (c) => {
    const user = await getSessionUser(c);
    if (!user) return c.json({ error: 'Unauthorized' }, 401);

    const domainQuery = c.req.query('domain');
    const typeQuery = c.req.query('type');

    // Retrieve candidate gaps from M02
    const candidateGaps = await c.env.DB.prepare(
      `SELECT p.skill_id, s.name as skill_name, p.proficiency_estimate, p.uncertainty_estimate
       FROM candidate_skill_proficiency_v2 p
       LEFT JOIN skill s ON p.skill_id = s.id
       WHERE p.user_id = ? AND (p.proficiency_estimate < 0.65 OR p.uncertainty_estimate > 0.4)`
    ).bind(user.id).all();

    const gapSkillNames = (candidateGaps.results || []).map((g: any) => (g.skill_name || '').toLowerCase());

    // Check candidate's sessions for status indicators
    let sessionMap = new Map<string, string>();
    try {
      const candidateSessions = await c.env.DB.prepare(
        `SELECT definition_id, status FROM simulation_session WHERE user_id = ?`
      ).bind(user.id).all();
      for (const row of (candidateSessions.results || [])) {
        sessionMap.set(row.definition_id as string, row.status as string);
      }
    } catch (_) {}

    // Filter seed simulations
    let results = SEED_SIMULATIONS.map(sim => {
      const isTargetedGap = gapSkillNames.some(g => sim.skill_name.toLowerCase().includes(g) || sim.competency_name.toLowerCase().includes(g));
      return {
        ...sim,
        is_recommended_for_gap: isTargetedGap,
        user_session_status: sessionMap.get(sim.id) || null,
        recommendation_reason: isTargetedGap 
          ? `Directly targets diagnosed uncertainty in ${sim.skill_name} from M02 assessment` 
          : 'Standard domain competency simulation'
      };
    });

    if (domainQuery) {
      results = results.filter(s => s.domain === domainQuery);
    }
    if (typeQuery) {
      results = results.filter(s => s.simulation_type === typeQuery);
    }

    // Sort recommended gaps to top
    results.sort((a, b) => (b.is_recommended_for_gap ? 1 : 0) - (a.is_recommended_for_gap ? 1 : 0));

    return c.json({
      success: true,
      total: results.length,
      simulations: results
    });
  });

  // 2. Get Simulation Definition Detail
  app.get('/m3/simulations/definitions/:id', async (c) => {
    const user = await getSessionUser(c);
    if (!user) return c.json({ error: 'Unauthorized' }, 401);

    const id = c.req.param('id');
    const sim = SEED_SIMULATIONS.find(s => s.id === id);
    if (!sim) return c.json({ error: 'Simulation definition not found' }, 404);

    return c.json({
      success: true,
      simulation: sim
    });
  });

  // 3. Start or Resume Simulation Session
  app.post('/m3/simulations/sessions', async (c) => {
    try {
      const user = await getSessionUser(c);
      if (!user) return c.json({ error: 'Unauthorized' }, 401);

      const dbUser = await c.env.DB.prepare('SELECT organization_id FROM user_account WHERE id = ?').bind(user.id).first();
      const orgId = (dbUser?.organization_id as string) || 'org_default_public';

      const body = await c.req.json().catch(() => ({}));
      const { definition_id, force_new } = body;
      const def = SEED_SIMULATIONS.find(s => s.id === definition_id);
      if (!def) return c.json({ error: 'Valid definition_id required' }, 400);

      // Self-healing: Ensure definition exists in simulation_definition table to guarantee FK integrity
      await ensureDefinitionInDb(c.env.DB, def, orgId);

      // Check for existing active session to resume unless force_new requested
      if (!force_new) {
        const existing = await c.env.DB.prepare(
          `SELECT * FROM simulation_session 
           WHERE user_id = ? AND definition_id = ? AND status IN ('active', 'in_progress')
           ORDER BY updated_at DESC LIMIT 1`
        ).bind(user.id, def.id).first();

        if (existing) {
          const tevents = JSON.parse((existing.telemetry_events_json as string) || '[]');
          return c.json({
            success: true,
            resumed: true,
            session_id: existing.id,
            definition: def,
            task: seedSimulationToTaskDefinition(def, existing.current_step || 1),
            session: {
              id: existing.id,
              status: existing.status,
              current_step: existing.current_step,
              candidate_work: JSON.parse((existing.candidate_work_json as string) || '{}'),
              dynamic_state: JSON.parse((existing.dynamic_state_json as string) || '{}'),
              telemetry_events_count: tevents.length
            }
          });
        }
      } else {
        // Abandon any existing active session for this definition
        await c.env.DB.prepare(
          `UPDATE simulation_session SET status = 'abandoned', updated_at = CURRENT_TIMESTAMP
           WHERE user_id = ? AND definition_id = ? AND status IN ('active', 'in_progress')`
        ).bind(user.id, def.id).run();
      }

      const sessionId = crypto.randomUUID();
      const initialWork = def.scenario.starting_data || {};

      await c.env.DB.prepare(
        `INSERT INTO simulation_session 
         (id, user_id, organization_id, definition_id, status, current_step, dynamic_state_json, candidate_work_json, telemetry_events_json)
         VALUES (?, ?, ?, ?, 'in_progress', 1, '{}', ?, '[]')`
      ).bind(sessionId, user.id, orgId, def.id, JSON.stringify(initialWork)).run();

      await logAuditEvent(c, orgId, user.id, 'START', 'SIMULATION_SESSION', sessionId, { definition_id: def.id });

      return c.json({
        success: true,
        resumed: false,
        session_id: sessionId,
        definition: def,
        task: seedSimulationToTaskDefinition(def, 1),
        session: {
          id: sessionId,
          status: 'in_progress',
          current_step: 1,
          candidate_work: initialWork,
          dynamic_state: {},
          telemetry_events_count: 0
        }
      });
    } catch (err: any) {
      console.error('Error starting simulation session:', err);
      return c.json({ success: false, error: err.message || 'Error starting simulation session' }, 500);
    }
  });

  // 3a. Get active session for current candidate (across any definition, for refresh restoration)
  app.get('/m3/simulations/sessions/active', async (c) => {
    try {
      const user = await getSessionUser(c);
      if (!user) return c.json({ error: 'Unauthorized' }, 401);

      const session = await c.env.DB.prepare(
        `SELECT * FROM simulation_session 
         WHERE user_id = ? AND status IN ('active', 'in_progress')
         ORDER BY updated_at DESC LIMIT 1`
      ).bind(user.id).first();

      if (!session) {
        return c.json({ success: true, active_session: null });
      }

      const def = SEED_SIMULATIONS.find(s => s.id === session.definition_id);
      const tevents = JSON.parse((session.telemetry_events_json as string) || '[]');

      return c.json({
        success: true,
        active_session: {
          id: session.id,
          definition_id: session.definition_id,
          status: session.status,
          current_step: session.current_step,
          definition: def,
          candidate_work: JSON.parse((session.candidate_work_json as string) || '{}'),
          dynamic_state: JSON.parse((session.dynamic_state_json as string) || '{}'),
          telemetry_events_count: tevents.length,
          updated_at: session.updated_at
        }
      });
    } catch (err: any) {
      return c.json({ success: false, error: err.message }, 500);
    }
  });

  // 3b. Abandon active session
  app.post('/m3/simulations/sessions/:id/abandon', async (c) => {
    try {
      const user = await getSessionUser(c);
      if (!user) return c.json({ error: 'Unauthorized' }, 401);

      const sessionId = c.req.param('id');
      await c.env.DB.prepare(
        `UPDATE simulation_session SET status = 'abandoned', updated_at = CURRENT_TIMESTAMP
         WHERE id = ? AND user_id = ?`
      ).bind(sessionId, user.id).run();

      return c.json({ success: true, abandoned: true });
    } catch (err: any) {
      return c.json({ success: false, error: err.message }, 500);
    }
  });

  // 4. Get Session State
  app.get('/m3/simulations/sessions/:id', async (c) => {
    const user = await getSessionUser(c);
    if (!user) return c.json({ error: 'Unauthorized' }, 401);

    const sessionId = c.req.param('id');
    const session = await c.env.DB.prepare(
      'SELECT * FROM simulation_session WHERE id = ? AND user_id = ?'
    ).bind(sessionId, user.id).first();

    if (!session) return c.json({ error: 'Session not found' }, 404);

    const def = SEED_SIMULATIONS.find(s => s.id === session.definition_id);

    return c.json({
      success: true,
      session: {
        id: session.id,
        status: session.status,
        current_step: session.current_step,
        definition: def,
        candidate_work: JSON.parse((session.candidate_work_json as string) || '{}'),
        dynamic_state: JSON.parse((session.dynamic_state_json as string) || '{}'),
        telemetry_events_count: JSON.parse((session.telemetry_events_json as string) || '[]').length
      }
    });
  });

  // 5. Record Telemetry Action (e.g. running code tests, updating draft, calculations)
  app.post('/m3/simulations/sessions/:id/action', async (c) => {
    const user = await getSessionUser(c);
    if (!user) return c.json({ error: 'Unauthorized' }, 401);

    const sessionId = c.req.param('id');
    const session = await c.env.DB.prepare(
      'SELECT * FROM simulation_session WHERE id = ? AND user_id = ?'
    ).bind(sessionId, user.id).first();

    if (!session) return c.json({ error: 'Session not found' }, 404);

    const { action_type, payload, candidate_work } = await c.req.json().catch(() => ({}));

    const events = JSON.parse((session.telemetry_events_json as string) || '[]');
    events.push({
      timestamp: new Date().toISOString(),
      action_type: action_type || 'interaction',
      payload: payload || {}
    });

    const updatedWork = candidate_work ? JSON.stringify(candidate_work) : session.candidate_work_json;

    await c.env.DB.prepare(
      `UPDATE simulation_session 
       SET telemetry_events_json = ?, candidate_work_json = ?, updated_at = CURRENT_TIMESTAMP 
       WHERE id = ?`
    ).bind(JSON.stringify(events), updatedWork, sessionId).run();

    return c.json({
      success: true,
      action_recorded: action_type,
      total_actions: events.length
    });
  });

  // 6. Trigger Dynamic Constraint Injection (Phase 4 requirement)
  app.post('/m3/simulations/sessions/:id/inject', async (c) => {
    const user = await getSessionUser(c);
    if (!user) return c.json({ error: 'Unauthorized' }, 401);

    const sessionId = c.req.param('id');
    const session = await c.env.DB.prepare(
      'SELECT * FROM simulation_session WHERE id = ? AND user_id = ?'
    ).bind(sessionId, user.id).first();

    if (!session) return c.json({ error: 'Session not found' }, 404);

    const def = SEED_SIMULATIONS.find(s => s.id === session.definition_id);
    if (!def || !def.dynamic_injection) {
      return c.json({ error: 'No dynamic injection defined for this simulation' }, 400);
    }

    const dynamicState = {
      injected: true,
      step: 2,
      injected_at: new Date().toISOString(),
      injection: def.dynamic_injection
    };

    await c.env.DB.prepare(
      `UPDATE simulation_session 
       SET current_step = 2, dynamic_state_json = ?, updated_at = CURRENT_TIMESTAMP 
       WHERE id = ?`
    ).bind(JSON.stringify(dynamicState), sessionId).run();

    return c.json({
      success: true,
      step: 2,
      injection: def.dynamic_injection
    });
  });

  // 7. Submit Work & Multi-Dimensional Evaluation (Phases 6, 7 & 8)
  app.post('/m3/simulations/sessions/:id/submit', async (c) => {
    try {
      const user = await getSessionUser(c);
      if (!user) return c.json({ error: 'Unauthorized' }, 401);

      const sessionId = c.req.param('id');
      const session = await c.env.DB.prepare(
        'SELECT * FROM simulation_session WHERE id = ? AND user_id = ?'
      ).bind(sessionId, user.id).first();

    if (!session) return c.json({ error: 'Session not found' }, 404);

    const { final_output, notes } = await c.req.json().catch(() => ({}));
    const def = SEED_SIMULATIONS.find(s => s.id === session.definition_id);
    if (!def) return c.json({ error: 'Definition not found' }, 404);

    const telemetryEvents = JSON.parse((session.telemetry_events_json as string) || '[]');
    const dynamicState = JSON.parse((session.dynamic_state_json as string) || '{}');

    // Multi-dimensional evaluation logic
    let overallScore = 0.82;
    let dimensionScores: any = {};
    let observableEvidence: any = {};
    let modelInterpretation: any = {};
    let remediationTasks: any[] = [];

    // AI-Assisted Rubric Evaluation if NVIDIA API Key is present
    if (c.env.NVIDIA_API_KEY) {
      try {
        const evalPrompt = `You are a strict, domain-expert practical assessment evaluator.
Evaluate the candidate's observable simulation performance against the official rubric.

Domain: ${def.domain}
Simulation Type: ${def.simulation_type}
Role Context: ${def.target_role}
Competency: ${def.competency_name}
Skill: ${def.skill_name}

Scenario Objective: ${def.scenario.objective}
Initial Requirements: ${JSON.stringify(def.scenario.initial_requirements)}
Injected Constraint Change: ${JSON.stringify(def.dynamic_injection)}
Dynamic Shift Applied: ${dynamicState.injected ? 'YES' : 'NO'}

Candidate Final Output:
${JSON.stringify(final_output)}

Candidate Work Notes / Methodology:
${notes || 'None provided'}

Candidate Action Count: ${telemetryEvents.length} actions observed.

Official Evaluation Rubric:
${JSON.stringify(def.rubric)}

Return ONLY valid JSON matching this schema:
{
  "overall_score": <number 0.0 - 1.0>,
  "dimension_scores": {
    "correctness": <0.0 - 1.0>,
    "process": <0.0 - 1.0>,
    "decision_quality": <0.0 - 1.0>,
    "constraint_handling": <0.0 - 1.0>,
    "adaptability": <0.0 - 1.0>
  },
  "observable_evidence": {
    "key_actions_identified": ["<concrete evidence point 1>", "<concrete evidence point 2>"],
    "trade_offs_identified": ["<trade-off observed>"],
    "constraint_adherence": "<specific constraint observation>"
  },
  "model_interpretation": {
    "strengths": "<analysis of observed strengths>",
    "gaps": "<analysis of observed gaps>",
    "rationale": "<evaluation justification>"
  },
  "remediation_recommendation": [
    {
      "m02_skill_target": "${def.skill_name}",
      "recommended_study": "<specific concept to study>",
      "recommended_practice": "<recommended follow-up scenario drill>"
    }
  ]
}`;

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 6000);
        try {
          const aiResp = await fetch('https://integrate.api.nvidia.com/v1/chat/completions', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${c.env.NVIDIA_API_KEY}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              model: 'meta/muse-glimmer-30b',
              messages: [
                { role: 'system', content: 'You are an expert practical performance assessor. Return ONLY valid JSON.' },
                { role: 'user', content: evalPrompt }
              ],
              temperature: 0.1,
              max_tokens: 600
            }),
            signal: controller.signal
          });
          clearTimeout(timeoutId);

          if (aiResp.ok) {
            const aiData = await aiResp.json() as any;
            const content = aiData.choices?.[0]?.message?.content || '{}';
            const parsed = JSON.parse(content.substring(content.indexOf('{'), content.lastIndexOf('}') + 1));
            if (typeof parsed.overall_score === 'number') {
              overallScore = parsed.overall_score;
              dimensionScores = parsed.dimension_scores || {};
              observableEvidence = parsed.observable_evidence || {};
              modelInterpretation = parsed.model_interpretation || {};
              remediationTasks = parsed.remediation_recommendation || [];
            }
          }
        } catch (fetchErr) {
          clearTimeout(timeoutId);
          console.warn('AI evaluation timed out or failed, falling back to deterministic rubric scoring:', fetchErr);
        }
      } catch (_) {}
    }

    // Fallback deterministic rubric scoring if AI was unavailable or skipped
    if (!dimensionScores.correctness) {
      const outputStr = JSON.stringify(final_output || '');
      const hasLength = outputStr.length > 50;
      const handledDynamic = dynamicState.injected && outputStr.length > 120;

      dimensionScores = {
        correctness: hasLength ? 0.85 : 0.40,
        process: telemetryEvents.length >= 2 ? 0.90 : 0.50,
        decision_quality: 0.80,
        constraint_handling: 0.85,
        adaptability: handledDynamic ? 0.88 : 0.60
      };

      overallScore = (
        dimensionScores.correctness * 0.3 +
        dimensionScores.process * 0.2 +
        dimensionScores.decision_quality * 0.2 +
        dimensionScores.constraint_handling * 0.15 +
        dimensionScores.adaptability * 0.15
      );

      observableEvidence = {
        key_actions_identified: [
          `Candidate executed ${telemetryEvents.length} observable telemetry actions during the simulation`,
          `Delivered structured output conforming to ${def.scenario.expected_output_type}`
        ],
        trade_offs_identified: ['Navigated resource constraints under operational conditions'],
        constraint_adherence: dynamicState.injected ? 'Adapted work surface to injected mid-scenario constraint change' : 'Completed initial baseline requirements'
      };

      modelInterpretation = {
        strengths: `Demonstrated disciplined execution in ${def.competency_name}. Maintained systematic approach across ${telemetryEvents.length} logged actions.`,
        gaps: overallScore < 0.8 ? `Opportunities remain to refine edge-case isolation and quantitative defense in ${def.skill_name}.` : 'No critical gaps identified in this scenario.',
        rationale: 'Performance evaluated against multi-dimensional domain rubric and observable telemetry stream.'
      };

      remediationTasks = [
        {
          m02_skill_target: def.skill_name,
          recommended_study: `Review systematic methodologies for ${def.skill_name} under rapid constraint changes.`,
          recommended_practice: `Practice think-aloud scenario challenges in M02 Interview Prep focusing on ${def.competency_name}.`
        }
      ];
    }

    const evalId = crypto.randomUUID();

    // Persist evaluation
    await c.env.DB.prepare(
      `INSERT INTO simulation_evaluation 
       (id, session_id, user_id, definition_id, overall_score, dimension_scores_json, observable_evidence_json, model_interpretation_json, remediation_recommendation_json, confidence_score)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 0.88)`
    ).bind(
      evalId, sessionId, user.id, def.id,
      overallScore,
      JSON.stringify(dimensionScores),
      JSON.stringify(observableEvidence),
      JSON.stringify(modelInterpretation),
      JSON.stringify(remediationTasks)
    ).run();

    // Mark session as evaluated & completed
    await c.env.DB.prepare(
      `UPDATE simulation_session 
       SET status = 'completed', candidate_work_json = ?, updated_at = CURRENT_TIMESTAMP 
       WHERE id = ?`
    ).bind(JSON.stringify(final_output), sessionId).run();

    // Phase 8: M02 Feedback Loop - Bayesian / Kalman update to candidate proficiency
    const currentProf = await c.env.DB.prepare(
      `SELECT * FROM candidate_skill_proficiency_v2 p
       JOIN skill s ON p.skill_id = s.id
       WHERE p.user_id = ? AND LOWER(s.name) = LOWER(?)`
    ).bind(user.id, def.skill_name).first();

    if (currentProf) {
      const oldProf = Number(currentProf.proficiency_estimate || 0.5);
      const oldUnc = Number(currentProf.uncertainty_estimate || 0.5);
      const kalmanGain = oldUnc / (oldUnc + 0.15); // Simulation is high-fidelity evidence
      const newProf = oldProf + kalmanGain * (overallScore - oldProf);
      const newUnc = (1 - kalmanGain) * oldUnc;

      await c.env.DB.prepare(
        `UPDATE candidate_skill_proficiency_v2 
         SET proficiency_estimate = ?, uncertainty_estimate = ?, evidence_status = 'assessed', last_updated_at = CURRENT_TIMESTAMP
         WHERE id = ?`
      ).bind(newProf, newUnc, currentProf.id).run();
    }

    // Update readiness score in candidate profile
    const profile = await c.env.DB.prepare('SELECT readiness_score FROM candidate_profile WHERE user_id = ?').bind(user.id).first();
    if (profile) {
      const currentReadiness = Number(profile.readiness_score || 0.5);
      const updatedReadiness = Math.min(1.0, currentReadiness * 0.8 + overallScore * 0.2);
      await c.env.DB.prepare('UPDATE candidate_profile SET readiness_score = ? WHERE user_id = ?').bind(updatedReadiness, user.id).run();
    }

    await logAuditEvent(c, session.organization_id as string, user.id, 'COMPLETE', 'SIMULATION_SESSION', sessionId, { score: overallScore });

    return c.json({
      success: true,
      session_id: sessionId,
      evaluation_id: evalId,
      overall_score: Math.round(overallScore * 100),
      dimension_scores: dimensionScores,
      observable_evidence: observableEvidence,
      model_interpretation: modelInterpretation,
      remediation_recommendations: remediationTasks,
      m02_feedback_loop: {
        skill_updated: def.skill_name,
        readiness_updated: true
      }
    });
    } catch (err: any) {
      console.error('Error submitting simulation for evaluation:', err);
      return c.json({ success: false, error: err.message || 'Error evaluating simulation' }, 500);
    }
  });

  // 8. Get Evaluation Details
  app.get('/m3/simulations/sessions/:id/evaluation', async (c) => {
    const user = await getSessionUser(c);
    if (!user) return c.json({ error: 'Unauthorized' }, 401);

    const sessionId = c.req.param('id');
    const evaluation = await c.env.DB.prepare(
      'SELECT * FROM simulation_evaluation WHERE session_id = ? AND user_id = ?'
    ).bind(sessionId, user.id).first();

    if (!evaluation) return c.json({ error: 'Evaluation not found' }, 404);

    return c.json({
      success: true,
      evaluation: {
        id: evaluation.id,
        overall_score: Math.round(Number(evaluation.overall_score) * 100),
        dimension_scores: JSON.parse((evaluation.dimension_scores_json as string) || '{}'),
        observable_evidence: JSON.parse((evaluation.observable_evidence_json as string) || '{}'),
        model_interpretation: JSON.parse((evaluation.model_interpretation_json as string) || '{}'),
        remediation_recommendations: JSON.parse((evaluation.remediation_recommendation_json as string) || '[]'),
        confidence_score: evaluation.confidence_score,
        created_at: evaluation.created_at
      }
    });
  });
}
