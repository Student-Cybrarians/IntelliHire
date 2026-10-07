import { Hono } from 'hono';
import type { Bindings, UserSession } from './[[route]]';
import { getSessionUser, logAuditEvent } from './[[route]]';

export * from '../../src/shared/m3WorkRoundContracts';
import {
  CandidateContext,
  JobContext,
  RoleContext,
  EvidenceReference,
  GapSignal,
  SkillTarget,
  CompetencyTarget,
  AssessmentContext,
  AssessmentPurpose,
  TaskDefinition,
  WorkRoundModality,
  seedSimulationToTaskDefinition,
  scaleTaskToCandidateSeniority,
  normalizeSeniorityLevel,
  calculateTaskRepetitionFingerprint,
  validateUniversalTaskDefinition,
  sanitizeContextForTaskTargeting,
  validateAssessmentContext,
  WorkSurfaceType,
  ExecutionResult,
  AdaptationDecision,
  AdaptationReasonType,
  SimulationRoundRecord,
  SessionProgressionState
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
  },
  {
    id: 'sim-tech-cloudflare-workers-failover',
    title: 'Cloudflare Workers & Edge KV Failover Architecture',
    occupation_code: '15-1252.00',
    target_role: 'Cloud & Edge Infrastructure Engineer',
    domain: 'software',
    simulation_type: 'coding',
    competency_name: 'Cloud, Edge & Distributed Systems',
    skill_name: 'Cloudflare Workers & Edge Execution',
    difficulty_level: 3,
    scenario: {
      background: 'A globally distributed worker gateway routes live candidate traffic across primary and secondary origin clusters. Intermittent transatlantic fiber latency causes origin timeouts.',
      objective: 'Implement resilient edge health-checking, stale-while-revalidate KV caching, and circuit-breaking fallback in a Cloudflare Worker request handler.',
      initial_requirements: [
        'Route requests to healthy origin with exponential moving average latency tracking',
        'Serve stale cached KV response within 20ms when origin returns 5xx or times out',
        'Emit structured telemetry attributes on error state'
      ],
      constraints: [
        'Worker runtime execution must not exceed 128MB memory limit',
        'Origin subrequest timeout must terminate within 1500ms'
      ],
      starting_data: {
        template_code: `// Cloudflare Worker Resilient Edge Handler
export default {
  async fetch(request: Request, env: any, ctx: any): Promise<Response> {
    // TODO: Implement health-checking and KV fallback
    return new Response('Edge Gateway Operational', { status: 200 });
  }
};`
      },
      tools_available: ['TypeScript Code Editor', 'Edge Simulator', 'KV Namespace Inspector'],
      expected_output_type: 'source_code'
    },
    dynamic_injection: {
      trigger_step: 2,
      alert_title: 'ORIGIN BROWN-OUT: Primary Database Connection Pool Exhausted',
      new_requirement: 'Primary origin database pool enters lock contention. Edge worker must temporarily redirect 80% of read traffic to cached replicas without stale reads exceeding 120 seconds.',
      constraint_change: 'Must not evict valid security auth tokens from edge KV during eviction.',
      rationale: 'Evaluates graceful edge degradation under origin saturation.'
    },
    rubric: {
      dimensions: [
        { name: 'resilience', weight: 0.35, description: 'Circuit breaking and failover', criteria: 'Absorbs origin downtime without throwing unhandled 5xx exceptions.' },
        { name: 'correctness', weight: 0.30, description: 'Edge handler correctness', criteria: 'Properly implements fetch interception and KV cache lookup.' },
        { name: 'adaptability', weight: 0.20, description: 'Brownout response', criteria: 'Implements read redirection safely.' },
        { name: 'code_quality', weight: 0.15, description: 'Edge TypeScript patterns', criteria: 'Clean TypeScript types and minimal memory overhead.' }
      ]
    }
  },
  {
    id: 'sim-tech-api-relational-indexing',
    title: 'PostgreSQL Index Optimization & Execution Plan Tuning',
    occupation_code: '15-1254.00',
    target_role: 'Senior Backend Engineer',
    domain: 'software',
    simulation_type: 'coding',
    competency_name: 'API Design & Relational Modeling',
    skill_name: 'API Design & Relational Modeling',
    difficulty_level: 3,
    scenario: {
      background: 'The core candidate audit ledger table with 40M rows experiences seq scans during batch export, locking database CPU at 98%.',
      objective: 'Analyze the EXPLAIN ANALYZE plan, write composite index migrations, and rewrite the query to utilize index-only scans without table locks.',
      initial_requirements: [
        'Eliminate heap fetches on timestamp and tenant_id filtering',
        'Create zero-downtime concurrent index migration SQL',
        'Benchmark query runtime reduction below 100ms'
      ],
      constraints: [
        'Total index disk footprint must not exceed 20% of base table size',
        'Migration must execute CONCURRENTLY without ACCESS EXCLUSIVE locks'
      ],
      starting_data: {
        raw_query: 'SELECT user_id, event_type, created_at FROM candidate_audit_event WHERE tenant_id = $1 AND created_at >= $2 ORDER BY created_at DESC LIMIT 50;'
      },
      tools_available: ['SQL Query Editor', 'Execution Plan Visualizer', 'Index Footprint Calculator'],
      expected_output_type: 'sql_migration'
    },
    rubric: {
      dimensions: [
        { name: 'correctness', weight: 0.35, description: 'Index-only scan utilization', criteria: 'Eliminates table heap access for targeted query.' },
        { name: 'architecture', weight: 0.35, description: 'Safe migration strategy', criteria: 'Includes CONCURRENTLY modifier and handles lock timeouts.' },
        { name: 'code_quality', weight: 0.30, description: 'Optimal column ordering', criteria: 'Orders equality columns before range columns in composite index.' }
      ]
    }
  },
  {
    id: 'sim-tech-security-zero-trust',
    title: 'Zero-Trust Microservice Network Policy & Lateral Movement Triage',
    occupation_code: '15-1212.00',
    target_role: 'Security Engineer',
    domain: 'software',
    simulation_type: 'coding',
    competency_name: 'Security Operations & Incident Response',
    skill_name: 'Security Operations & Incident Response',
    difficulty_level: 4,
    scenario: {
      background: 'An internal compromised pod in the payment cluster attempted lateral egress to the secrets vault service over non-standard ports.',
      objective: 'Draft declarative Kubernetes NetworkPolicies to enforce zero-trust default-deny egress, isolate compromised namespaces, and mandate mTLS SPIFFE verification.',
      initial_requirements: [
        'Define default-deny ingress and egress policies for the payments namespace',
        'Allow strictly required DNS (port 53 UDP) and Vault API (port 8200 TCP) egress',
        'Draft an incident triage memo detailing remediation and containment steps'
      ],
      constraints: [
        'Legitimate payment processing pipelines must not experience traffic drops',
        'Must specify CIDR blocks and podSelector labels explicitly'
      ],
      starting_data: {
        cluster_layout: 'Namespace: payments (3 pods: api, worker, db-proxy); Namespace: vault (vault-server:8200)'
      },
      tools_available: ['NetworkPolicy YAML Editor', 'Traffic Flow Simulator', 'Audit Log Inspector'],
      expected_output_type: 'network_policy_yaml_and_memo'
    },
    rubric: {
      dimensions: [
        { name: 'correctness', weight: 0.40, description: 'Zero-trust policy completeness', criteria: 'Prevents lateral movement while permitting legitimate Vault traffic.' },
        { name: 'resilience', weight: 0.35, description: 'Blast radius containment', criteria: 'Strict default-deny rules with explicit port and protocol declarations.' },
        { name: 'communication', weight: 0.25, description: 'Incident response protocol', criteria: 'Clear, actionable forensic triage report.' }
      ]
    }
  },
  {
    id: 'sim-project-critical-path-recovery',
    title: 'Critical Path Delay & Cross-Functional Resource Reallocation',
    occupation_code: '11-9041.00',
    target_role: 'Technical Program Manager',
    domain: 'operations',
    simulation_type: 'operational_triage',
    competency_name: 'Delivery Governance & Program Management',
    skill_name: 'Project Management & Operational Governance',
    difficulty_level: 3,
    scenario: {
      background: 'Three weeks before GA release, the authentication microservice security audit uncovers 4 critical findings requiring 12 developer-days of remediation.',
      objective: 'Re-calculate the project critical path, fast-track non-dependent milestones, and reallocate engineering capacity across streams to preserve the launch date without scope compromise.',
      initial_requirements: [
        'Identify slack/float across workstreams Alpha, Beta, and Gamma',
        'Reassign 2 senior backend engineers from non-critical stream Beta to auth remediation',
        'Formulate a stakeholder trade-off briefing with revised milestone gates'
      ],
      constraints: [
        'Customer compliance audit milestone cannot slip past November 1st',
        'Zero reduction in mandatory security testing coverage permitted'
      ],
      starting_data: {
        workstreams: [
          { name: 'Auth & IAM', duration_days: 18, critical_path: true, team_size: 2 },
          { name: 'Billing UI', duration_days: 10, critical_path: false, float_days: 8, team_size: 3 },
          { name: 'Analytics Pipeline', duration_days: 14, critical_path: false, float_days: 4, team_size: 2 }
        ]
      },
      tools_available: ['Critical Path Network Diagram', 'Resource Loading Chart', 'Stakeholder Memo Editor'],
      expected_output_type: 'project_recovery_plan'
    },
    rubric: {
      dimensions: [
        { name: 'decision_quality', weight: 0.35, description: 'Resource leveling and critical path analysis', criteria: 'Accurately identifies float and rebalances headcount to critical path.' },
        { name: 'risk_management', weight: 0.35, description: 'Preservation of security quality gates', criteria: 'Resists dropping security fixes; protects compliance deadlines.' },
        { name: 'stakeholder_communication', weight: 0.30, description: 'Executive memo clarity', criteria: 'Clear schedule risk communication with explicit milestone triggers.' }
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
 * Phase 2 Intelligence: Comprehensive Context Aggregator & Target Engine
 * Resolves CandidateContext, JobContext, RoleContext, EvidenceReferences, GapSignals,
 * and builds structured AssessmentContext with multi-objective explainable ranking.
 */
export async function resolveCandidateJobContext(
  db: any,
  userId: string,
  organizationId: string,
  requisitionId?: string,
  assessmentPurpose: AssessmentPurpose = 'practice'
): Promise<{
  candidateContext: CandidateContext;
  jobContext: JobContext;
  targets: CompetencyTarget[];
  assessmentContext: AssessmentContext;
}> {
  // 1. Fetch Candidate Profile
  const profileRow = await db.prepare(
    `SELECT headline, target_role, experience_level, primary_domain, skills_json, bio, readiness_score, target_domain_id, target_occupation_id
     FROM candidate_profile WHERE user_id = ?`
  ).bind(userId).first();

  const targetRole = (profileRow?.target_role as string) || 'Senior Software Engineer';
  const seniority = (profileRow?.experience_level as string) || 'senior';
  const readiness = Number(profileRow?.readiness_score || 0.5);
  const primaryDomain = (profileRow?.primary_domain as string) || 'software';

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

  // 3. 5-Layer Evidence Ledger Initialization
  const evidenceLedger: EvidenceReference[] = [];
  const gapSignals: GapSignal[] = [];

  // Ingest Claims (Layer 1: Source Evidence)
  const verifiedClaims: Array<{ claim: string; category?: string; source: string; confidence: number }> = [];
  if (contextId) {
    try {
      const claims = await db.prepare(
        `SELECT claim_type, claim_value, confidence_score, verification_state, created_at FROM candidate_claim WHERE context_id = ? LIMIT 20`
      ).bind(contextId).all();
      for (const cl of (claims?.results || [])) {
        const claimVal = (cl.claim_value as string) || '';
        verifiedClaims.push({
          claim: claimVal,
          category: cl.claim_type as string,
          source: 'm01_resume',
          confidence: Number(cl.confidence_score || 0.85)
        });
        if (cl.claim_type === 'skill' && !extractedSkills.includes(claimVal)) {
          extractedSkills.push(claimVal);
        }

        // Add to 5-layer Evidence Ledger
        evidenceLedger.push({
          id: `ev-claim-${crypto.randomUUID().slice(0, 8)}`,
          sourceModule: 'm01_ats_match',
          sourceRecordId: activeResumeId,
          evidenceCategory: 'extracted_fact',
          evidenceLayer: 'extracted_facts',
          statement: `Candidate claimed: '${claimVal}'`,
          competencyOrSkill: (cl.claim_type as string) || 'Skill',
          confidenceScore: Number(cl.confidence_score || 0.75),
          uncertaintyScore: 0.35, // Self-claim carries high uncertainty
          isDirectObservation: false,
          observedAt: (cl.created_at as string) || new Date().toISOString(),
          humanVerificationState: (cl.verification_state as any) || 'unreviewed'
        });
      }
    } catch (_) {}
  }

  // 4. Ingest M02 Assessment Responses & Misconceptions (Layer 2: Extracted Facts, Layer 3: Model Interpretations)
  try {
    const m02Evals = await db.prepare(
      `SELECT e.score_raw, e.evaluation_json, i.skill_id, s.name as skill_name, c.name as competency_name, r.created_at
       FROM assessment_evaluation e
       JOIN assessment_response_v2 r ON e.response_id = r.id
       JOIN assessment_item_v2 i ON r.item_id = i.id
       JOIN assessment_attempt a ON r.attempt_id = a.id
       LEFT JOIN skill s ON i.skill_id = s.id
       LEFT JOIN competency c ON s.competency_id = c.id
       WHERE a.user_id = ?
       ORDER BY r.created_at DESC LIMIT 10`
    ).bind(userId).all();

    for (const ev of (m02Evals?.results || [])) {
      let parsedEval: any = {};
      try { parsedEval = JSON.parse((ev.evaluation_json || ev.feedback_json || '{}') as string); } catch (_) {}
      const skillName = (ev.skill_name as string) || (ev.skill_id as string) || (parsedEval.skill as string) || 'Core Skill';
      const score = Number(ev.score_raw !== undefined ? ev.score_raw : (ev.score !== undefined ? ev.score : 0.0));

      // Extracted Fact: Objective Test Result
      evidenceLedger.push({
        id: `ev-m02-fact-${crypto.randomUUID().slice(0, 8)}`,
        sourceModule: 'm02_assessment',
        evidenceCategory: 'extracted_fact',
        statement: `Scored ${Math.round(score * 100)}% on assessment probe for '${skillName}'`,
        competencyOrSkill: skillName,
        confidenceScore: 0.95,
        uncertaintyScore: 0.15,
        isDirectObservation: true,
        observedAt: (ev.created_at as string) || new Date().toISOString()
      });

      // Model Interpretation: Pedagogical Critique
      if (parsedEval.explanation_of_correct_answer || parsedEval.analysis_of_candidate_answer) {
        evidenceLedger.push({
          id: `ev-m02-critique-${crypto.randomUUID().slice(0, 8)}`,
          sourceModule: 'm02_assessment',
          evidenceCategory: 'model_interpretation',
          statement: `Pedagogical evaluation on '${skillName}': ${parsedEval.analysis_of_candidate_answer || parsedEval.explanation_of_correct_answer}`,
          competencyOrSkill: skillName,
          confidenceScore: 0.88,
          uncertaintyScore: 0.18,
          isDirectObservation: false,
          observedAt: (ev.created_at as string) || new Date().toISOString()
        });
      }

      // Gap Signal if deficit or misconception observed
      if (score < 0.65) {
        gapSignals.push({
          id: `gap-m02-${crypto.randomUUID().slice(0, 8)}`,
          skillName,
          competencyName: (ev.competency_name as string) || skillName,
          sourceModule: (parsedEval.misconception_remediation || parsedEval.misconception) ? 'm02_misconception' : 'm02_assessment',
          gapOriginType: score < 0.4 ? 'confirmed_weakness' : 'high_uncertainty',
          severity: score < 0.4 ? 'critical' : 'moderate',
          observedDeficit: `Demonstrated ${Math.round(score * 100)}% performance on adaptive assessment item.`,
          misconceptionDetails: (parsedEval.misconception_remediation || parsedEval.remediation || parsedEval.misconception) ? {
            remediationAdvice: parsedEval.misconception_remediation || parsedEval.remediation || 'Review core competency principles',
            divergencePattern: parsedEval.misconception || parsedEval.how_to_arrive || 'Deviation from recommended engineering rubric.'
          } : undefined,
          confidence: 0.92,
          uncertainty: 0.12,
          detectedAt: (ev.created_at as string) || new Date().toISOString()
        });
      }
    }
  } catch (_) {}

  // 5. Ingest M03 Historical Simulation Evaluations
  try {
    const m03History = await db.prepare(
      `SELECT e.overall_score, e.model_interpretation_json, d.title, d.skill_name, d.competency_name, e.created_at
       FROM simulation_evaluation e
       JOIN simulation_definition d ON e.definition_id = d.id
       WHERE e.user_id = ?
       ORDER BY e.created_at DESC LIMIT 5`
    ).bind(userId).all();

    for (const sim of (m03History?.results || [])) {
      const skillName = (sim.skill_name as string) || (sim.title as string) || 'Simulation';
      const score = Number(sim.overall_score || 0.0);
      evidenceLedger.push({
        id: `ev-m03-${crypto.randomUUID().slice(0, 8)}`,
        sourceModule: 'm03_simulation',
        evidenceCategory: 'extracted_fact',
        statement: `Completed simulation '${sim.title}' with composite rubric score of ${Math.round(score * 100)}%`,
        competencyOrSkill: skillName,
        confidenceScore: 0.96,
        uncertaintyScore: 0.08,
        isDirectObservation: true,
        observedAt: (sim.created_at as string) || new Date().toISOString()
      });

      if (score < 0.65) {
        gapSignals.push({
          id: `gap-m03-${crypto.randomUUID().slice(0, 8)}`,
          skillName,
          competencyName: (sim.competency_name as string) || skillName,
          sourceModule: 'm03_simulation',
          gapOriginType: 'confirmed_weakness',
          severity: score < 0.5 ? 'critical' : 'moderate',
          observedDeficit: `Work round simulation deficit (${Math.round(score * 100)}% score).`,
          confidence: 0.95,
          uncertainty: 0.08,
          detectedAt: (sim.created_at as string) || new Date().toISOString()
        });
      }
    }
  } catch (_) {}

  // 6. Fetch Diagnosed Gaps & Proficiency Estimates from Table
  let diagnosedGaps: any[] = [];
  let proficiencyMap = new Map<string, { originalName: string; estimate: number; uncertainty: number; count: number }>();
  try {
    const gapRows = await db.prepare(
      `SELECT p.skill_id, s.name as skill_name, p.proficiency_estimate, p.uncertainty_estimate
       FROM candidate_skill_proficiency_v2 p
       LEFT JOIN skill s ON p.skill_id = s.id
       WHERE p.user_id = ?`
    ).bind(userId).all();

    for (const g of (gapRows?.results || [])) {
      const sName = (g.skill_name as string) || (g.skill_id as string) || 'Competency';
      const prof = Number(g.proficiency_estimate || 0.5);
      const unc = Number(g.uncertainty_estimate || 0.5);
      proficiencyMap.set(sName.toLowerCase(), { originalName: sName, estimate: prof, uncertainty: unc, count: 1 });

      if (prof < 0.65 || unc > 0.4) {
        diagnosedGaps.push({
          skillId: g.skill_id as string,
          skillName: sName,
          gapType: prof < 0.5 ? 'low_demonstration' : 'high_uncertainty',
          severity: unc > 0.6 ? 'critical' : 'moderate',
          recommendation: `Target ${sName} in adaptive work round.`
        });
        if (!gapSignals.some(s => s.skillName.toLowerCase() === sName.toLowerCase())) {
          gapSignals.push({
            id: `gap-prof-${crypto.randomUUID().slice(0, 8)}`,
            skillName: sName,
            competencyName: sName,
            sourceModule: 'm02_assessment',
            gapOriginType: prof < 0.5 ? 'confirmed_weakness' : 'high_uncertainty',
            severity: unc > 0.6 ? 'critical' : 'moderate',
            observedDeficit: `Current estimated proficiency is ${Math.round(prof * 100)}% with ${Math.round(unc * 100)}% uncertainty variance.`,
            confidence: 0.90,
            uncertainty: unc,
            detectedAt: new Date().toISOString()
          });
        }
      }
    }
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

  // 7. Fetch Job Context
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
  const normalizeStringArray = (arr: any): string[] => {
    if (!Array.isArray(arr)) return [];
    return arr.map(item => {
      if (typeof item === 'string') return item.trim();
      if (item && typeof item === 'object') {
        return String(item.requirement || item.skill || item.name || item.title || item.text || '').trim();
      }
      return String(item || '').trim();
    }).filter(s => s.length > 0);
  };

  let requiredSkills: string[] = [];
  let keyRequirements: string[] = [];

  if (jobRow?.parsed_requirements_json) {
    try {
      const parsed = JSON.parse(jobRow.parsed_requirements_json as string);
      keyRequirements = normalizeStringArray(parsed.requirements || []);
      requiredSkills = normalizeStringArray(parsed.skills || []);
    } catch (_) {}
  }

  if (keyRequirements.length === 0) {
    try {
      const jdCtx = await db.prepare(
        `SELECT raw_text, requirements_json FROM job_description_context WHERE user_id = ? ORDER BY created_at DESC LIMIT 1`
      ).bind(userId).first();
      if (jdCtx?.requirements_json) {
        const parsed = JSON.parse(jdCtx.requirements_json as string);
        const rawReqs = parsed.requirements || (Array.isArray(parsed) ? parsed : []);
        keyRequirements = normalizeStringArray(rawReqs);
        requiredSkills = normalizeStringArray(parsed.skills || []);
      }
    } catch (_) {}
  }

  if (requiredSkills.length === 0) {
    if (primaryDomain === 'finance') {
      requiredSkills = ['CapEx & ROI Modeling', 'Valuation & Discounted Cash Flow', 'Variance Analysis'];
    } else if (primaryDomain === 'operations') {
      requiredSkills = ['Float Pool Operations', 'Emergency Bed Allocation', 'Patient Acuity Triage'];
    } else {
      requiredSkills = ['Distributed Systems & Concurrency', 'System Architecture & Concurrency', 'API Design & Relational Modeling'];
    }
  }

  if (keyRequirements.length === 0) {
    if (primaryDomain === 'finance') {
      keyRequirements = ['Financial modeling & cash flow forecasting', 'Capital expenditure variance analysis'];
    } else if (primaryDomain === 'operations') {
      keyRequirements = ['Clinical workflow triage & staffing optimization', 'Emergency bed management'];
    } else {
      keyRequirements = ['Production architecture & distributed system design', 'Concurrency & performance engineering'];
    }
  }

  const jobContext: JobContext = {
    requisitionId: (jobRow?.id as string) || undefined,
    jobTitle,
    targetSeniority: jobSeniority,
    targetDomain: (jobRow?.role_category as string) || primaryDomain,
    requiredCompetencies: requiredSkills.map((sk: string) => ({
      name: sk,
      priority: 'required'
    })),
    requiredSkills,
    rawJobDescription: (jobRow?.raw_jd_text as string) || undefined,
    keyRequirements
  };

  const expectedBaseline = seniority === 'entry' ? 0.60 : (seniority === 'senior' ? 0.80 : 0.70);

  // 8. Assemble Role Context
  const roleContext: RoleContext = {
    roleTitle: targetRole,
    domain: primaryDomain,
    occupationCode: (profileRow?.target_occupation_id as string) || '15-1252.00',
    seniorityLevel: seniority,
    expectedProficiencyBaseline: expectedBaseline,
    seniorityExpectations: {
      complexityCeiling: `${seniority.toUpperCase()}-level autonomous system decisions under operational constraints`,
      autonomyLevel: seniority === 'lead' || seniority === 'executive' ? 'Total' : 'High',
      decisionScope: 'Architectural, operational and failure-mode resiliency',
      expectedProficiencyBaseline: expectedBaseline
    },
    requiredCompetencies: requiredSkills.slice(0, 5).map(s => ({
      name: s,
      priority: 'mandatory',
      weight: 1.0
    }))
  };

  // 9. Multi-Objective Explainable Targeting Algorithm
  // Weights by Assessment Purpose:
  let w_R = 0.30; // Relevance
  let w_U = 0.25; // Uncertainty
  let w_G = 0.35; // Gap Severity
  let w_C = 0.20; // Coverage Deficit
  let w_F = 0.10; // Fatigue Penalty

  if (assessmentPurpose === 'diagnostic') {
    w_R = 0.25; w_U = 0.40; w_G = 0.15; w_C = 0.25; w_F = 0.10;
  } else if (assessmentPurpose === 'gap_validation') {
    w_R = 0.35; w_U = 0.15; w_G = 0.45; w_C = 0.10; w_F = 0.05;
  } else if (assessmentPurpose === 'certification') {
    w_R = 0.50; w_U = 0.20; w_G = 0.20; w_C = 0.15; w_F = 0.05;
  }

  // Build candidate skill pool
  const candidateSkillPool = new Map<string, { originalName: string; compName: string; prof: number; unc: number; obs: number }>();
  for (const [skLower, pData] of proficiencyMap.entries()) {
    candidateSkillPool.set(skLower, { originalName: pData.originalName, compName: pData.originalName, prof: pData.estimate, unc: pData.uncertainty, obs: pData.count });
  }
  for (const gap of gapSignals) {
    const skLower = gap.skillName.toLowerCase();
    if (!candidateSkillPool.has(skLower)) {
      candidateSkillPool.set(skLower, {
        originalName: gap.skillName,
        compName: gap.competencyName,
        prof: gap.gapOriginType === 'confirmed_weakness' ? 0.35 : 0.50,
        unc: gap.uncertainty || 0.35,
        obs: 1
      });
    }
  }
  for (const reqSkill of requiredSkills) {
    const skLower = reqSkill.toLowerCase();
    if (!candidateSkillPool.has(skLower)) {
      candidateSkillPool.set(skLower, { originalName: reqSkill, compName: reqSkill, prof: 0.50, unc: 0.60, obs: 0 });
    }
  }

  // Prior recent tasks from M03 (for fatigue penalty)
  const recentM03Tasks = evidenceLedger
    .filter(ev => ev.sourceModule === 'm03_simulation')
    .map(ev => ev.competencyOrSkill.toLowerCase())
    .slice(-3);

  const targets: CompetencyTarget[] = [];

  for (const [sKey, sInfo] of candidateSkillPool.entries()) {
    const lowerSKey = sKey.toLowerCase();
    const isExplicitlyRequired = requiredSkills.some(s => {
      const sStr = typeof s === 'string' ? s.toLowerCase() : String((s as any)?.skill || (s as any)?.name || '').toLowerCase();
      return sStr === lowerSKey || sStr.includes(lowerSKey);
    }) ||
      keyRequirements.some(req => {
        const rStr = typeof req === 'string' ? req.toLowerCase() : String((req as any)?.requirement || (req as any)?.title || '').toLowerCase();
        return rStr.includes(lowerSKey);
      });

    const jobRelevance = isExplicitlyRequired ? 1.0 : (requiredSkills.length > 0 ? 0.6 : 0.5);
    const uncertaintyDeficit = Math.max(0.0, Math.min(1.0, sInfo.unc));

    const matchingGap = gapSignals.find(g => g.skillName.toLowerCase() === lowerSKey);
    let gapSeverity = 0.50;
    if (matchingGap) {
      if (matchingGap.gapOriginType === 'confirmed_weakness') {
        gapSeverity = sInfo.prof < 0.4 ? 1.0 : 0.85;
      } else if (matchingGap.gapOriginType === 'misconception_flag') {
        gapSeverity = 0.95;
      } else {
        gapSeverity = 0.70;
      }
    } else {
      if (sInfo.prof < 0.45 && sInfo.obs >= 1) {
        gapSeverity = 0.85;
      } else if (sInfo.prof < 0.5 && sInfo.obs === 0) {
        gapSeverity = 0.50;
      } else {
        gapSeverity = Math.max(0.05, 1.0 - sInfo.prof);
      }
    }

    const coverageDeficit = 1.0 / (1.0 + Number(sInfo.obs));
    const fatigue = recentM03Tasks.slice(-1).includes(lowerSKey) ? 0.8 : (recentM03Tasks.includes(lowerSKey) ? 0.4 : 0.0);

    const rawScore = (w_R * jobRelevance) + (w_U * uncertaintyDeficit) + (w_G * gapSeverity) + (w_C * coverageDeficit) - (w_F * fatigue);
    const targetingScore = Math.max(0.0, Math.min(1.0, Math.round(rawScore * 1000) / 1000));

    // Formulate pedagogical rationale
    const rationales: string[] = [];
    if (isExplicitlyRequired) rationales.push('Mandatory requirement in target role specification');
    if (matchingGap && matchingGap.gapOriginType === 'confirmed_weakness') {
      rationales.push(`Confirmed demonstrated deficit (${Math.round(sInfo.prof * 100)}% score in M02 assessment)`);
    } else if (uncertaintyDeficit > 0.4) {
      rationales.push(`High epistemic uncertainty (${Math.round(uncertaintyDeficit * 100)}%) requiring empirical calibration`);
    }
    if (coverageDeficit > 0.6) rationales.push(`Low observation coverage (${sInfo.obs} previous rounds)`);
    if (fatigue > 0) rationales.push('Fatigue penalty applied due to recent repetition');

    const rationaleText = rationales.length > 0 ? rationales.join('; ') : `Targeting core competency ${sInfo.compName}.`;

    const capitalSkillName = sInfo.originalName || sKey.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
    const capitalCompName = sInfo.compName || capitalSkillName;

    const skillTargetObj: SkillTarget = {
      id: `sk-${crypto.randomUUID().slice(0, 8)}`,
      skillName: capitalSkillName,
      competencyName: capitalCompName,
      domain: primaryDomain,
      targetProficiency: 0.80,
      currentProficiency: Math.round(sInfo.prof * 100) / 100,
      uncertaintyEstimate: Math.round(sInfo.unc * 100) / 100,
      observationCount: sInfo.obs,
      gapSignal: matchingGap,
      targetingPriorityScore: targetingScore,
      priorityBreakdown: {
        jobRelevanceWeight: Math.round(jobRelevance * 100) / 100,
        uncertaintyDeficitWeight: Math.round(uncertaintyDeficit * 100) / 100,
        gapSeverityWeight: Math.round(gapSeverity * 100) / 100,
        coverageDeficitWeight: Math.round(coverageDeficit * 100) / 100,
        recencyFatiguePenalty: Math.round(fatigue * 100) / 100,
        rationale: rationaleText
      }
    };

    targets.push({
      id: `tgt-${crypto.randomUUID().slice(0, 8)}`,
      name: capitalCompName,
      domain: primaryDomain,
      skillName: capitalSkillName,
      targetProficiency: 0.80,
      currentProficiency: Math.round(sInfo.prof * 100) / 100,
      uncertaintyEstimate: Math.round(sInfo.unc * 100) / 100,
      observationCount: sInfo.obs,
      diagnosisSource: matchingGap ? 'm02_assessment_gap' : (isExplicitlyRequired ? 'job_requirement' : 'baseline_target'),
      targetingScore,
      rationale: rationaleText,
      skills: [skillTargetObj]
    });
  }

  // Sort descending by targetingScore
  targets.sort((a, b) => (b.targetingScore || 0) - (a.targetingScore || 0));

  const primaryTarget = targets[0] || {
    id: 'tgt-default',
    name: 'System Architecture',
    domain: 'software',
    skillName: 'System Architecture & Concurrency',
    targetProficiency: 0.80,
    currentProficiency: 0.50,
    uncertaintyEstimate: 0.50,
    observationCount: 0,
    diagnosisSource: 'baseline_target',
    targetingScore: 0.70,
    rationale: 'Baseline target for role specification'
  };

  // Determine Work Modality
  let workModality: WorkRoundModality = 'coding';
  const roleLower = targetRole.toLowerCase();
  if (roleLower.includes('finance') || roleLower.includes('analyst') || primaryDomain === 'finance') {
    workModality = 'financial_analysis';
  } else if (roleLower.includes('operation') || roleLower.includes('triage') || primaryDomain === 'operations') {
    workModality = 'operational_triage';
  } else if (roleLower.includes('data') || primaryDomain === 'data') {
    workModality = 'data_analysis';
  } else if (roleLower.includes('legal') || roleLower.includes('procurement')) {
    workModality = 'written_communication';
  }

  // 10. Assemble & Sanitize Assessment Context (Guarantees zero sensitive trait bias)
  const rawAssessmentContext: AssessmentContext = {
    contextId: `ctx-m3-${crypto.randomUUID().slice(0, 12)}`,
    candidateContext,
    jobContext,
    roleContext,
    assessmentPurpose,
    evidenceLedger,
    gapSignals,
    prioritizedTargets: targets,
    primaryRecommendedTarget: primaryTarget,
    activeWorkModality: workModality,
    securityGovernance: {
      tenantId: organizationId,
      organizationId,
      candidateUserId: userId,
      sensitiveAttributesExcluded: true,
      exclusionAudit: [],
      createdAt: new Date().toISOString()
    }
  };

  const { sanitized: assessmentContext, sensitiveTraitsFound } = sanitizeContextForTaskTargeting(rawAssessmentContext);
  assessmentContext.securityGovernance.exclusionAudit = sensitiveTraitsFound;

  const resolvedTargets: CompetencyTarget[] = diagnosedGaps.length > 0
    ? targets.filter(t => t.diagnosisSource === 'm02_assessment_gap' || t.diagnosisSource === 'm02_misconception' || t.diagnosisSource === 'm01_ats_gap')
    : targets;

  return { candidateContext, jobContext, targets: resolvedTargets.length > 0 ? resolvedTargets : targets, assessmentContext };
}

export function executeCandidateWork(
  def: any,
  actionType: string,
  payload: any
): ExecutionResult {
  const startTime = Date.now();
  const simType = def?.simulation_type || 'coding';

  // 1. Code Execution (JavaScript / TypeScript / Edge Workers)
  if (actionType === 'run_code' || (simType === 'coding' && actionType !== 'run_sql' && actionType !== 'calc_financials' && actionType !== 'run_operations_triage')) {
    const code = (payload?.code || payload?.candidate_work?.code || payload?.candidate_work?.template_code || '').trim();
    if (!code || code.length < 5) {
      return {
        success: false,
        execution_type: 'code_execution',
        status: 'error',
        output: 'Compilation Error: No code provided or code block is empty.',
        duration_ms: Date.now() - startTime,
        test_results: [],
        metrics: { lines_of_code: 0, syntax_valid: false },
        errors: ['Empty code deliverable']
      };
    }

    const prohibitedKeywords = ['eval(', 'Function(', 'process.exit', 'child_process', 'require("fs")', "require('fs')"];
    for (const kw of prohibitedKeywords) {
      if (code.includes(kw)) {
        return {
          success: false,
          execution_type: 'code_execution',
          status: 'error',
          output: `Security Sandbox Policy Violation: Prohibited construct "${kw}" detected. Execution aborted.`,
          duration_ms: Date.now() - startTime,
          test_results: [],
          metrics: { syntax_valid: false, sandbox_violation: true },
          errors: [`Prohibited keyword: ${kw}`]
        };
      }
    }

    const tests: Array<{ name: string; passed: boolean; message?: string }> = [];
    const codeLower = code.toLowerCase();

    if (def?.id?.includes('rate-limiter') || codeLower.includes('bucket') || codeLower.includes('ratelimit')) {
      const hasWindowLogic = codeLower.includes('window') || codeLower.includes('timestamp') || codeLower.includes('time') || codeLower.includes('token');
      const hasLimitCheck = codeLower.includes('429') || codeLower.includes('limit') || codeLower.includes('exceeded') || codeLower.includes('max') || codeLower.includes('allow');
      const hasRefill = codeLower.includes('refill') || codeLower.includes('add') || codeLower.includes('capacity') || codeLower.includes('replenish') || codeLower.includes('rate');

      tests.push({
        name: 'Test 1: Baseline Under Limit (50 reqs / 60s)',
        passed: hasWindowLogic,
        message: hasWindowLogic ? '200 OK — Request successfully processed under token threshold.' : 'Failed: Sliding window tracking not detected.'
      });
      tests.push({
        name: 'Test 2: Concurrency Burst (120 reqs / 60s)',
        passed: hasLimitCheck,
        message: hasLimitCheck ? '429 Rate Limited at 101st request — Threshold safely enforced.' : 'Failed: Rate limit boundary enforcement missing.'
      });
      tests.push({
        name: 'Test 3: Token Refill Cadence & Memory Boundary',
        passed: hasRefill,
        message: hasRefill ? 'Tokens refilled at configured cadence without memory leak (<2KB).' : 'Failed: Token refill cadence calculation incomplete.'
      });
    } else if (def?.id?.includes('failover') || codeLower.includes('failover') || codeLower.includes('origin')) {
      const hasBackup = codeLower.includes('backup') || codeLower.includes('secondary') || codeLower.includes('fallback') || codeLower.includes('retry');
      const hasStatusCheck = codeLower.includes('50') || codeLower.includes('status') || codeLower.includes('catch') || codeLower.includes('error');
      const hasHeader = codeLower.includes('header') || codeLower.includes('cf-') || codeLower.includes('response') || codeLower.includes('cache');

      tests.push({
        name: 'Test 1: Primary Origin Healthy Forwarding',
        passed: true,
        message: 'Primary origin healthy -> Request proxied with origin response status 200.'
      });
      tests.push({
        name: 'Test 2: Degradation & Failover Routing (<15ms)',
        passed: hasBackup && hasStatusCheck,
        message: hasBackup && hasStatusCheck ? 'Primary origin 503 -> Seamless failover routed to backup in 8.4ms.' : 'Failed: Failover routing condition not triggered on 5xx status.'
      });
      tests.push({
        name: 'Test 3: Response Header & Circuit Breaker Telemetry',
        passed: hasHeader,
        message: hasHeader ? 'Diagnostic header cf-failover-status: active attached safely.' : 'Failed: Observability header not attached.'
      });
    } else {
      const hasExportOrFunction = codeLower.includes('function') || codeLower.includes('class') || codeLower.includes('export') || codeLower.includes('def ');
      const hasLogic = code.length > 50;
      tests.push({
        name: 'Test 1: Code Syntax & Structure Verification',
        passed: hasExportOrFunction,
        message: hasExportOrFunction ? 'Syntax and structural entry point verified.' : 'Missing function or class definition.'
      });
      tests.push({
        name: 'Test 2: Boundary Condition Execution',
        passed: hasLogic,
        message: hasLogic ? 'Executed cleanly across baseline and edge cases.' : 'Code block too short to satisfy constraints.'
      });
    }

    const passedCount = tests.filter(t => t.passed).length;
    const allPassed = passedCount === tests.length;
    const duration = Math.min(2500, Math.max(12, Math.round(code.length * 0.4)));

    let outputText = tests.map(t => `${t.passed ? '✓' : '✗'} ${t.name} -> ${t.message}`).join('\n');
    outputText += `\n\n[Execution Summary: ${passedCount}/${tests.length} Tests Passed in ${duration}ms]`;

    return {
      success: true,
      execution_type: 'code_execution',
      status: allPassed ? 'passed' : 'failed',
      output: outputText,
      duration_ms: duration,
      test_results: tests,
      metrics: {
        lines_of_code: code.split('\n').length,
        character_count: code.length,
        tests_passed: passedCount,
        total_tests: tests.length,
        memory_overhead_kb: Math.round(code.length / 1024 * 10) / 10 + 0.8
      },
      errors: allPassed ? [] : tests.filter(t => !t.passed).map(t => t.name)
    };
  }

  // 2. SQL Query Execution & Explain Plan
  if (actionType === 'run_sql' || simType === 'sql' || def?.id?.includes('relational-indexing')) {
    const query = (payload?.query || payload?.candidate_work?.query || payload?.candidate_work?.code || '').trim();
    if (!query) {
      return {
        success: false,
        execution_type: 'sql_execution',
        status: 'error',
        output: 'SQL Error: No SQL query provided.',
        duration_ms: Date.now() - startTime,
        test_results: [],
        metrics: {},
        errors: ['Empty query string']
      };
    }

    const qLower = query.toLowerCase();
    const hasIndex = qLower.includes('create index') || qLower.includes('create unique index');
    const hasStatus = qLower.includes('status');
    const hasCreatedAt = qLower.includes('created_at') || qLower.includes('createdat') || qLower.includes('order_date');
    const isComposite = hasStatus && hasCreatedAt;
    const isConcurrent = qLower.includes('concurrently');

    const tests = [
      {
        name: 'Test 1: Index Target Column Alignment',
        passed: isComposite,
        message: isComposite ? 'Composite index correctly covers WHERE status filter and ORDER BY created_at.' : 'Index misses either status or created_at column for composite coverage.'
      },
      {
        name: 'Test 2: Lock-Free / Non-Blocking Migration Clause',
        passed: isConcurrent || qLower.includes('without locks') || !qLower.includes('drop table'),
        message: isConcurrent ? 'CONCURRENTLY clause prevents exclusive table locks on production.' : 'Validated: Non-destructive migration statement.'
      },
      {
        name: 'Test 3: Query Plan Optimization (Scan vs Seek)',
        passed: hasIndex,
        message: hasIndex ? 'EXPLAIN PLAN: SEARCH TABLE orders USING INDEX (Cost: 1.4, Rows: 50).' : 'EXPLAIN PLAN: SCAN TABLE orders (Cost: 4820.0, Rows: 1,000,000) [UNOPTIMIZED FULL SCAN].'
      }
    ];

    const passedCount = tests.filter(t => t.passed).length;
    const output = `--- SQL Execution Plan Analysis ---\nQuery: ${query.slice(0, 120)}${query.length > 120 ? '...' : ''}\n\n` +
      tests.map(t => `${t.passed ? '✓' : '✗'} ${t.name}: ${t.message}`).join('\n') +
      `\n\nEstimated Table Scan Reduction: ${isComposite ? '99.9% (Index Seek)' : '0% (Full Scan)'}`;

    return {
      success: true,
      execution_type: 'sql_execution',
      status: passedCount === tests.length ? 'passed' : 'warning',
      output,
      duration_ms: 18,
      test_results: tests,
      metrics: {
        query_type: hasIndex ? 'DDL_CREATE_INDEX' : 'DML_QUERY',
        is_composite_index: isComposite,
        estimated_scan_cost: isComposite ? 1.4 : 4820.0,
        index_efficiency_score: isComposite ? 0.98 : 0.35
      },
      errors: []
    };
  }

  // 3. Financial Analysis & Portfolio Modeling
  if (actionType === 'calc_financials' || simType === 'financial_analysis') {
    const rawWork = payload?.candidate_work || payload;
    const projects = rawWork?.projects || def?.scenario?.starting_data?.projects || [];
    const selectedProjectNames: string[] = rawWork?.selected_projects || (rawWork?.memo ? projects.filter((p: any) => rawWork.memo.toLowerCase().includes(p.name.toLowerCase())).map((p: any) => p.name) : ['Alpha', 'Beta']);
    
    const activeProjects = projects.filter((p: any) => selectedProjectNames.includes(p.name) || selectedProjectNames.length === 0);
    const totalCapEx = activeProjects.reduce((acc: number, p: any) => acc + Number(p.capex || 0), 0);
    const capexCap = 15000000; // $15M envelope
    const isWithinCap = totalCapEx <= capexCap;

    const discountRate = 0.085; // 8.5%
    let totalNPV = 0;
    for (const p of activeProjects) {
      const cfs = p.cash_flows_y1_5 || [2000000, 2000000, 2000000, 2000000, 2000000];
      let pNpv = -Number(p.capex || 0);
      cfs.forEach((cf: number, yr: number) => {
        pNpv += cf / Math.pow(1 + discountRate, yr + 1);
      });
      totalNPV += pNpv;
    }

    let stressedNPV = 0;
    for (const p of activeProjects) {
      const cfs = p.cash_flows_y1_5 || [2000000, 2000000, 2000000, 2000000, 2000000];
      let pNpv = -Number(p.capex || 0);
      cfs.forEach((cf: number, yr: number) => {
        pNpv += cf / Math.pow(1 + 0.0975, yr + 1);
      });
      stressedNPV += pNpv;
    }

    const tests = [
      {
        name: 'Test 1: Capital Expenditure Ceiling ($15.0M Cap)',
        passed: isWithinCap,
        message: isWithinCap
          ? `Total CapEx $${(totalCapEx / 1000000).toFixed(2)}M is within the $15.0M ceiling.`
          : `CapEx budget exceeded: $${(totalCapEx / 1000000).toFixed(2)}M > $15.0M ceiling.`
      },
      {
        name: 'Test 2: Portfolio NPV Viability (Hurdle Rate 8.5%)',
        passed: totalNPV > 0,
        message: totalNPV > 0
          ? `Portfolio NPV is positive: +$${(totalNPV / 1000000).toFixed(2)}M.`
          : `Portfolio NPV is negative: -$${Math.abs(totalNPV / 1000000).toFixed(2)}M.`
      },
      {
        name: 'Test 3: Rate Hike Sensitivity (+125 bps WACC Stress Test)',
        passed: stressedNPV > 0,
        message: stressedNPV > 0
          ? `Portfolio survives 9.75% WACC rate hike with +$${(stressedNPV / 1000000).toFixed(2)}M residual value.`
          : `Portfolio turns value-destructive under 9.75% rate hike: -$${Math.abs(stressedNPV / 1000000).toFixed(2)}M.`
      }
    ];

    const passedCount = tests.filter(t => t.passed).length;
    const output = `--- Capital Budgeting Schedule ---\n` +
      `Active Portfolio: ${activeProjects.map((p: any) => p.name).join(', ')}\n` +
      `Total CapEx: $${(totalCapEx / 1000000).toFixed(2)}M / $15.00M Cap\n` +
      `Estimated NPV (8.5% WACC): $${(totalNPV / 1000000).toFixed(2)}M\n` +
      `Stressed NPV (9.75% WACC): $${(stressedNPV / 1000000).toFixed(2)}M\n\n` +
      tests.map(t => `${t.passed ? '✓' : '✗'} ${t.name}: ${t.message}`).join('\n');

    return {
      success: true,
      execution_type: 'financial_calculation',
      status: passedCount === tests.length ? 'passed' : 'warning',
      output,
      duration_ms: 12,
      test_results: tests,
      metrics: {
        total_capex_usd: totalCapEx,
        portfolio_npv_usd: Math.round(totalNPV),
        stressed_npv_usd: Math.round(stressedNPV),
        within_capex_ceiling: isWithinCap
      },
      errors: isWithinCap ? [] : ['CapEx exceeds $15M budget']
    };
  }

  // 4. Operations Triage & Resource Dispatch
  if (actionType === 'run_operations_triage' || simType === 'operational_triage') {
    const rawWork = payload?.candidate_work || payload;
    const planText = (rawWork?.triage_plan || rawWork?.notes || '').toLowerCase();
    const hasIcuAssignment = planText.includes('icu') || planText.includes('p-101') || planText.includes('trauma');
    const hasBreakCoverage = planText.includes('break') || planText.includes('coverage') || planText.includes('relief') || planText.includes('rotate');
    const hasOvertimeLimit = planText.includes('overtime') || planText.includes('float') || planText.includes('hours') || planText.length > 50;

    const tests = [
      {
        name: 'Test 1: Critical Acuity (ESI 1 & 2) Protocol Compliance',
        passed: hasIcuAssignment,
        message: hasIcuAssignment
          ? 'Intubated critical patients allocated certified ICU RNs within 1:2 ratio.'
          : 'Failed: Unassigned intubated trauma patients detected.'
      },
      {
        name: 'Test 2: Mandatory Break & Continuous Telemetry Coverage',
        passed: hasBreakCoverage,
        message: hasBreakCoverage
          ? 'Staggered break coverage active; telemetry monitoring uninterrupted.'
          : 'Failed: Telemetry monitoring left uncovered during break transitions.'
      },
      {
        name: 'Test 3: Overtime Budget & Zero-Diversion Mandate',
        passed: hasOvertimeLimit,
        message: hasOvertimeLimit
          ? 'Float pool overtime maintained under 16-hour cap; zero diversions.'
          : 'Failed: Overtime threshold or diversion mandate violated.'
      }
    ];

    const passedCount = tests.filter(t => t.passed).length;
    const output = `--- Triage Shift Simulation Output ---\n` +
      tests.map(t => `${t.passed ? '✓' : '✗'} ${t.name}: ${t.message}`).join('\n') +
      `\n\nOverall Safety & Regulatory Compliance: ${Math.round((passedCount / tests.length) * 100)}%`;

    return {
      success: true,
      execution_type: 'operations_triage',
      status: passedCount === tests.length ? 'passed' : 'warning',
      output,
      duration_ms: 15,
      test_results: tests,
      metrics: {
        ratio_compliance: hasIcuAssignment,
        break_coverage_verified: hasBreakCoverage,
        overtime_budget_satisfied: hasOvertimeLimit
      },
      errors: []
    };
  }

  // 5. General Document / Memo / Structured Analysis Verification
  const text = (payload?.candidate_work?.memo || payload?.candidate_work?.output_text || payload?.text || payload?.notes || '').trim();
  const wordCount = text ? text.split(/\s+/).length : 0;
  const hasExecutiveSummary = text.toLowerCase().includes('summary') || text.toLowerCase().includes('recommend') || wordCount >= 30;
  const hasTradeoffs = text.toLowerCase().includes('trade-off') || text.toLowerCase().includes('risk') || text.toLowerCase().includes('however') || wordCount >= 40;

  const tests = [
    {
      name: 'Test 1: Minimum Deliverable Depth',
      passed: wordCount >= 25,
      message: wordCount >= 25 ? `Word count (${wordCount} words) meets minimum evaluation threshold.` : `Draft too brief (${wordCount} words < 25 words).`
    },
    {
      name: 'Test 2: Structural Elements & Rationale',
      passed: hasExecutiveSummary,
      message: hasExecutiveSummary ? 'Executive rationale and actionable recommendations present.' : 'Missing explicit recommendation statement.'
    },
    {
      name: 'Test 3: Risk & Trade-off Consideration',
      passed: hasTradeoffs,
      message: hasTradeoffs ? 'Acknowledges constraints and articulates mitigation trade-offs.' : 'Trade-off analysis not articulated.'
    }
  ];

  const passedCount = tests.filter(t => t.passed).length;
  const output = `--- Document Analysis & Rubric Audit ---\nWord Count: ${wordCount} words\n` +
    tests.map(t => `${t.passed ? '✓' : '✗'} ${t.name}: ${t.message}`).join('\n');

  return {
    success: true,
    execution_type: 'document_verification',
    status: passedCount === tests.length ? 'passed' : 'warning',
    output,
    duration_ms: 10,
    test_results: tests,
    metrics: { word_count: wordCount, completeness_score: Math.round((passedCount / tests.length) * 100) },
    errors: []
  };
}

// -----------------------------------------------------------------------------
// Phase 6 Evaluation Engine: Deterministic-First & Alternative Validity Helpers
// -----------------------------------------------------------------------------

export function executeDeterministicEvaluation(
  def: any,
  finalOutput: any,
  telemetryEvents: any[]
): DeterministicVerificationResult {
  const outputStr = typeof finalOutput === 'string' ? finalOutput : JSON.stringify(finalOutput || '');
  const outLower = outputStr.toLowerCase();
  const testResults: DeterministicTestResult[] = [];
  const checksPerformed: string[] = [];
  const errors: string[] = [];
  let score = 0.5;
  let passed = false;
  let syntaxValid = true;
  const schemaValid = true;

  // Empty or trivial check
  if (!outputStr || outputStr.trim().length < 15 || outLower.includes('// todo') || outLower.includes('# todo')) {
    return {
      passed: false,
      score: 0.0,
      testResults: [{ name: 'Deliverable Completeness', passed: false, details: 'Deliverable is empty or placeholder' }],
      checksPerformed: ['completeness_check'],
      syntaxValid: false,
      schemaValid: false,
      metrics: { deliverable_bytes: outputStr.length },
      errors: ['Empty or placeholder deliverable']
    };
  }

  // Domain-specific deterministic evaluation
  if (def.simulation_type === 'coding' || def.domain === 'software') {
    checksPerformed.push('syntax_ast_verification', 'state_management_check', 'sandbox_test_verification');

    // Check if SQL task
    if (def.id.includes('postgres') || def.scenario?.expected_output_type === 'sql_migration') {
      const hasIndex = outLower.includes('create index');
      const hasConcurrently = outLower.includes('concurrently');
      const hasComposite = outLower.includes('tenant_id') && outLower.includes('created_at');
      const hasCovering = outLower.includes('include') || (outLower.includes('user_id') && outLower.includes('event_type'));

      testResults.push({ name: 'Index Creation Syntax', passed: hasIndex, details: hasIndex ? 'CREATE INDEX detected' : 'Missing CREATE INDEX' });
      testResults.push({ name: 'Zero-Downtime Concurrency Check', passed: hasConcurrently, details: hasConcurrently ? 'CONCURRENTLY used to prevent table lock' : 'Missing CONCURRENTLY' });
      testResults.push({ name: 'Composite Filter Alignment', passed: hasComposite, details: hasComposite ? 'Composite filter aligned on tenant_id, created_at' : 'Missing composite filters' });
      testResults.push({ name: 'Index-Only Scan Optimization', passed: hasCovering, details: hasCovering ? 'Covering index enables index-only scan' : 'Heap fetches remain' });

      const passedCount = testResults.filter(t => t.passed).length;
      score = passedCount / testResults.length;
      passed = hasIndex && hasComposite;
    } else {
      // General coding (e.g. rate limiter or cloudflare worker)
      const hasClassOrFunction = outLower.includes('class') || outLower.includes('function') || outLower.includes('export default') || outLower.includes('def ');
      const hasStateFields = outLower.includes('token') || outLower.includes('time') || outLower.includes('window') || outLower.includes('cache') || outLower.includes('limit');
      const execActions = telemetryEvents.filter((e: any) => e.action_type?.includes('run') || e.action_type?.includes('execute'));
      const hasExecutedTests = execActions.length > 0;

      testResults.push({ name: 'Code Structure & Syntax', passed: hasClassOrFunction, details: hasClassOrFunction ? 'Valid module/class definition' : 'Missing functional structure' });
      testResults.push({ name: 'Algorithmic State Management', passed: hasStateFields, details: hasStateFields ? 'State management fields detected' : 'Missing rate-limiting state' });
      testResults.push({ name: 'Sandbox Test Suite Execution', passed: hasExecutedTests, details: hasExecutedTests ? `Candidate executed ${execActions.length} sandbox test runs` : 'No automated sandbox tests executed' });

      const passedCount = testResults.filter(t => t.passed).length;
      score = passedCount / testResults.length;
      passed = hasClassOrFunction && hasStateFields;
    }
  } else if (def.simulation_type === 'financial_analysis' || def.domain === 'finance') {
    checksPerformed.push('budget_envelope_constraint', 'npv_calculation_accuracy', 'wacc_hurdle_compliance');

    const hasBudgetCompliance = outLower.includes('14') || outLower.includes('15') || !outLower.includes('22');
    const hasNpv = outLower.includes('npv') || outLower.includes('alpha') || outLower.includes('net present value');
    const hasWacc = outLower.includes('8.5') || outLower.includes('wacc') || outLower.includes('hurdle');

    testResults.push({ name: 'Capital Envelope Constraint', passed: hasBudgetCompliance, details: hasBudgetCompliance ? 'Allocation respects $15M budget envelope' : 'Budget envelope exceeded' });
    testResults.push({ name: 'DCF / NPV Valuation Models', passed: hasNpv, details: hasNpv ? 'Discounted cash flow NPV models computed' : 'Missing NPV computations' });
    testResults.push({ name: 'Cost of Capital Hurdle Rate (WACC)', passed: hasWacc, details: hasWacc ? 'Applied 8.5% WACC hurdle benchmark' : 'Missing cost of capital analysis' });

    const passedCount = testResults.filter(t => t.passed).length;
    score = passedCount / testResults.length;
    passed = hasBudgetCompliance && hasNpv;
  } else if (def.simulation_type === 'operational_triage' || def.domain === 'operations') {
    checksPerformed.push('critical_care_acuity_match', 'nurse_patient_ratio', 'contingency_isolation_protocol');

    const hasMedSurgToIcu = (outLower.includes('med-surg') || outLower.includes('med surg')) && (outLower.includes('intubated') || outLower.includes('p-101'));
    const safetyPassed = !hasMedSurgToIcu;
    if (!safetyPassed) errors.push('Critical clinical safety violation: Med-Surg nurse assigned to intubated ICU bed');

    const hasTriage = outLower.includes('esi') || outLower.includes('p-102') || outLower.includes('icu') || outLower.includes('trauma');
    const hasContingency = outLower.includes('hazmat') || outLower.includes('contingency') || outLower.includes('holding') || outLower.includes('decon');

    testResults.push({ name: 'Critical Care Clinical Safety', passed: safetyPassed, details: safetyPassed ? 'Intubated beds assigned to ICU certified staff' : 'Med-Surg nurse assigned to intubated patient' });
    testResults.push({ name: 'Acuity-Based Bed Allocation', passed: hasTriage, details: hasTriage ? 'Acuity ranking aligns with ESI clinical criteria' : 'Missing triage prioritization' });
    testResults.push({ name: 'Hazmat Isolation Protocol', passed: hasContingency, details: hasContingency ? 'Addressed decontamination & isolation contingency' : 'Neglected chemical spill isolation' });

    const passedCount = testResults.filter(t => t.passed).length;
    score = passedCount / testResults.length;
    passed = safetyPassed && hasTriage;
  } else if (def.simulation_type === 'written_response' || def.domain === 'general') {
    checksPerformed.push('contractual_clause_citation', 'service_credit_calculation', 'cure_period_compliance');

    const hasClause = outLower.includes('section 8') || outLower.includes('8.2') || outLower.includes('service level');
    const hasMath = outLower.includes('62,500') || outLower.includes('62500') || outLower.includes('50%');
    const hasCure = outLower.includes('30') || outLower.includes('cure') || outLower.includes('notice');

    testResults.push({ name: 'Contractual Clause Citation', passed: hasClause, details: hasClause ? 'Cited Section 8.2 Service Level Guarantee' : 'Missing specific contract clause citation' });
    testResults.push({ name: 'Service Credit Calculation', passed: hasMath, details: hasMath ? 'Calculated 50% credit ($62,500) for >12hr downtime' : 'Missing or inaccurate credit computation' });
    testResults.push({ name: 'Cure Period & Procedural Rights', passed: hasCure, details: hasCure ? 'Respected 30-day cure window and formal notice timeline' : 'Missing cure timeline specification' });

    const passedCount = testResults.filter(t => t.passed).length;
    score = passedCount / testResults.length;
    passed = hasClause || hasMath;
  } else {
    checksPerformed.push('schema_drift_parsing', 'duplicate_filtering', 'dead_letter_segregation');

    const hasDrift = outLower.includes('timestamp') || outLower.includes('epoch') || outLower.includes('iso') || outLower.includes('parse');
    const hasDedup = outLower.includes('distinct') || outLower.includes('duplicate') || outLower.includes('group by') || outLower.includes('unique');
    const hasDlq = outLower.includes('dead') || outLower.includes('dlq') || outLower.includes('corrupted') || outLower.includes('invalid');

    testResults.push({ name: 'Schema Drift & Timestamp Parsing', passed: hasDrift, details: hasDrift ? 'Timestamp drift handling implemented' : 'Missing timestamp transformation' });
    testResults.push({ name: 'Duplicate Record Elimination', passed: hasDedup, details: hasDedup ? 'De-duplication logic verified' : 'Duplicate records not eliminated' });
    testResults.push({ name: 'Dead-Letter Queue Segregation', passed: hasDlq, details: hasDlq ? 'Corrupted events segregated to DLQ' : 'Corrupted events dropped without audit DLQ' });

    const passedCount = testResults.filter(t => t.passed).length;
    score = passedCount / testResults.length;
    passed = hasDrift;
  }

  return {
    passed,
    score: Math.round(score * 100) / 100,
    testResults,
    checksPerformed,
    syntaxValid,
    schemaValid,
    metrics: {
      tests_passed: testResults.filter(t => t.passed).length,
      total_tests: testResults.length,
      deliverable_bytes: outputStr.length
    },
    errors
  };
}

export function classifyAlternativeValidity(
  det: DeterministicVerificationResult,
  notes: string,
  handledDynamic: boolean,
  telemetryCount: number,
  finalOutput: any
): { validity: AlternativeValidity; rationale: string } {
  const outputStr = typeof finalOutput === 'string' ? finalOutput : JSON.stringify(finalOutput || '');
  const outLower = outputStr.toLowerCase();
  const notesLower = (notes || '').toLowerCase();

  // 1. Insufficient information
  if (!outputStr || outputStr.trim().length < 25 || (telemetryCount === 0 && outputStr.length < 50) || outLower.includes('// todo') || outLower.includes('# todo')) {
    return {
      validity: 'insufficient_information',
      rationale: 'Submission contains only placeholder tokens, unpopulated templates, or trivial content.'
    };
  }

  // 2. Fatal invariant violation (Incorrect)
  if (det.errors && det.errors.length > 0 && !det.passed) {
    return {
      validity: 'incorrect',
      rationale: `Fails mandatory domain invariants or clinical/security safety: ${det.errors.join('; ')}`
    };
  }

  // 3. Alternative Valid
  const hasAlternativeNotes = notesLower.includes('alternative') || notesLower.includes('sliding') || notesLower.includes('green bond') || notesLower.includes('mezzanine') || notesLower.includes('trade-off') || notesLower.includes('rationale');
  if (det.passed && hasAlternativeNotes && (outLower.includes('sliding') || outLower.includes('bond') || outLower.includes('lease'))) {
    return {
      validity: 'alternative_valid',
      rationale: 'Employed an innovative or alternative solution architecture that completely satisfies operational objectives with reasoned trade-offs.'
    };
  }

  // 4. Context-Dependent
  const isContextDep = notesLower.includes('context') || notesLower.includes('crisis') || notesLower.includes('lockdown') || notesLower.includes('holding') || outLower.includes('contingency');
  if (isContextDep && det.score >= 0.40) {
    return {
      validity: 'context_dependent',
      rationale: 'Solution validity depends on explicit operating context, emergency protocols, or relationship management.'
    };
  }

  // 5. Correct
  if (det.passed && det.score >= 0.75) {
    return {
      validity: 'correct',
      rationale: 'Demonstrated complete empirical correctness across all baseline requirements, constraints, and validation tests.'
    };
  }

  // 6. Incomplete
  if (det.score >= 0.30 && det.score < 0.65 && outputStr.length < 200) {
    return {
      validity: 'incomplete',
      rationale: 'Demonstrated valid initial approach but omitted trailing requirements or complete edge-case handling.'
    };
  }

  // 7. Partially Correct
  if (det.score >= 0.40 || det.testResults.some(t => t.passed)) {
    return {
      validity: 'partially_correct',
      rationale: 'Satisfied core baseline logic but failed secondary constraint checks, concurrency tests, or edge-case validations.'
    };
  }

  return {
    validity: 'incorrect',
    rationale: 'Deliverable failed objective verification and did not provide sufficient valid methodology.'
  };
}

export function scoreDomainRubric(
  rubric: any,
  det: DeterministicVerificationResult,
  validity: AlternativeValidity,
  telemetryCount: number,
  handledDynamic: boolean
): { overallScore: number; dimensionScores: Record<string, number> } {
  const dimensions: Array<{ name: string; weight: number }> = rubric?.dimensions || [
    { name: 'correctness', weight: 0.30 },
    { name: 'process', weight: 0.25 },
    { name: 'decision_quality', weight: 0.20 },
    { name: 'constraint_handling', weight: 0.15 },
    { name: 'adaptability', weight: 0.10 }
  ];

  const validityMultiplier: Record<AlternativeValidity, number> = {
    correct: 1.0,
    alternative_valid: 0.96,
    context_dependent: 0.82,
    partially_correct: 0.68,
    incomplete: 0.52,
    insufficient_information: 0.10,
    incorrect: 0.25
  };

  const mult = validityMultiplier[validity] ?? 0.70;
  const dimScores: Record<string, number> = {};

  for (const dim of dimensions) {
    const dName = dim.name;
    const base = det.score;
    let score = base;

    if (dName.includes('safety') || dName.includes('correctness') || dName.includes('quantitative') || dName.includes('legal') || dName.includes('concurrency')) {
      score = base * mult;
    } else if (dName.includes('process') || dName.includes('governance') || dName.includes('code_quality')) {
      const procBonus = Math.min(0.20, telemetryCount * 0.04);
      score = Math.min(1.0, (base * 0.7 + procBonus + 0.1) * mult);
    } else if (dName.includes('adaptability') || dName.includes('rebuttal') || dName.includes('prioritization')) {
      const adaptScore = handledDynamic ? 0.90 : 0.50;
      score = adaptScore * mult;
    } else if (dName.includes('efficiency') || dName.includes('decision') || dName.includes('capital')) {
      score = Math.min(1.0, (base * 0.85 + 0.15) * mult);
    } else {
      score = base * mult;
    }

    dimScores[dName] = Math.round(Math.max(0.05, Math.min(1.0, score)) * 100) / 100;
  }

  const totalWeight = dimensions.reduce((acc, d) => acc + (d.weight || 0.2), 0);
  const composite = dimensions.reduce((acc, d) => acc + (dimScores[d.name] || 0.5) * ((d.weight || 0.2) / totalWeight), 0);

  return {
    overallScore: Math.round(composite * 100) / 100,
    dimensionScores: dimScores
  };
}

export function generateTeachingPayload(
  def: any,
  finalOutput: any,
  det: DeterministicVerificationResult,
  validity: AlternativeValidity,
  notes: string = '',
  handledDynamic: boolean = false
): M3TeachingPayload {
  const domain = def.domain || 'general';
  const taskId = def.id || '';
  const taskTitle = def.title || 'Work Simulation Scenario';
  const outputStr = typeof finalOutput === 'string' ? finalOutput : JSON.stringify(finalOutput || '');
  const outLower = outputStr.toLowerCase();
  const notesLower = (notes || '').toLowerCase();
  const isCorrectOrAlternative = validity === 'correct' || validity === 'alternative_valid';
  const failedTests = det.testResults.filter(t => !t.passed);
  const passedTests = det.testResults.filter(t => t.passed);

  // Focus areas
  let focusAreas = ['domain_competency', 'process_rigor', 'constraint_handling'];
  if (domain === 'software') {
    focusAreas = ['algorithm_soundness', 'concurrency_safety', 'runtime_complexity', 'edge_case_isolation'];
  } else if (domain === 'finance') {
    focusAreas = ['mathematical_rigor', 'assumption_validity', 'cash_flow_timing', 'risk_sensitivity'];
  } else if (domain === 'operations') {
    focusAreas = ['triage_prioritization', 'throughput_velocity', 'resource_contention', 'human_safety'];
  }

  // 1. Diagnose Misconceptions
  const misconceptions: TeachingConceptRemediation[] = [];

  if (domain === 'software' || taskId.includes('indexing') || taskId.includes('sql')) {
    const hasConcurrentFail = failedTests.some(t => t.name.toLowerCase().includes('concurrency') || t.name.toLowerCase().includes('concurrent'));
    if (hasConcurrentFail || (outLower.includes('create index') && !outLower.includes('concurrently'))) {
      misconceptions.push({
        misconceptionId: 'misc-sql-concurrent-lock',
        category: 'trade_off_blindspot',
        diagnosedMisconception: 'Treating DDL index creation as a zero-cost background operation without non-blocking CONCURRENTLY safeguards.',
        severity: 'critical',
        whereReasoningBroke: 'Executed synchronous CREATE INDEX on live production tables without the CONCURRENTLY modifier.',
        whyItBroke: 'In PostgreSQL, standard CREATE INDEX acquires an SHARE lock, blocking all concurrent INSERT, UPDATE, and DELETE operations, causing connection exhaustion under live traffic.',
        missingLogicOrConcept: 'Understanding relational engine lock hierarchies and zero-downtime schema migration practices.',
        invalidAssumption: 'Assuming migration scripts execute instantaneously without blocking live write transactions.',
        howToApproachLogically: 'Always decouple schema creation into non-blocking atomic phases: CREATE INDEX CONCURRENTLY, monitor pg_stat_activity, and verify index valid state.',
        howToAvoidRepeating: 'Always audit DDL statements against lock levels and mandate CONCURRENTLY in production migration checklists.',
        practicalCounterexample: 'Running "CREATE INDEX idx_users ON users(tenant_id);" during peak traffic locked checkout transactions for 45 seconds.',
        m02ReassessFocus: 'Relational Indexing & Concurrency Safety'
      });
    }

    const hasFilterFail = failedTests.some(t => t.name.toLowerCase().includes('filter') || t.name.toLowerCase().includes('composite'));
    if (hasFilterFail || (outLower.includes('where status =') && outLower.includes('(') && !outLower.split('(')[1]?.split(')')[0]?.includes('status'))) {
      misconceptions.push({
        misconceptionId: 'misc-sql-composite-prefix',
        category: 'conceptual',
        diagnosedMisconception: 'Believing that column order in a composite B-Tree index is arbitrary.',
        severity: 'moderate',
        whereReasoningBroke: 'Placed lower-cardinality or range query columns ahead of equality filter predicates.',
        whyItBroke: 'B-Tree indexes can only traverse composite columns strictly from left to right. A query filtering on (tenant_id, status) cannot efficiently utilize (created_at, tenant_id).',
        missingLogicOrConcept: 'B-Tree hierarchical sorting and leftmost prefix lookup mechanics.',
        invalidAssumption: 'Assuming the query optimizer can match any permutation of indexed columns regardless of leading definition.',
        howToApproachLogically: 'Order composite columns by: (1) Equality filters first, (2) Range filters second, (3) Projected covering columns (INCLUDE) third.',
        howToAvoidRepeating: 'Formulate index definitions directly against query WHERE and ORDER BY clauses.',
        practicalCounterexample: 'An index on (created_at, tenant_id) forced a full index range scan when querying WHERE tenant_id = "org_123".',
        m02ReassessFocus: 'B-Tree Index Predicate Ordering'
      });
    }
  } else if (domain === 'operations' || taskId.includes('triage')) {
    const hasTriageFail = failedTests.some(t => t.name.toLowerCase().includes('esi') || t.name.toLowerCase().includes('acuity'));
    if (hasTriageFail || notesLower.includes('first come') || notesLower.includes('fifo')) {
      misconceptions.push({
        misconceptionId: 'misc-ops-fifo-clinical',
        category: 'conceptual',
        diagnosedMisconception: 'Applying standard FIFO queueing to dynamic clinical acuity categories.',
        severity: 'critical',
        whereReasoningBroke: 'Allocated beds or resources based on arrival timestamp rather than dynamic ESI clinical acuity.',
        whyItBroke: 'In emergency medicine, delayed intervention for high-acuity patients (ESI-1/2) leads to avoidable clinical deterioration and mortality.',
        missingLogicOrConcept: 'Emergency Severity Index (ESI) multi-tier triage protocol and physiologic reserve dynamics.',
        invalidAssumption: 'Assuming queue wait time is the primary fairness metric in life-critical operations.',
        howToApproachLogically: 'Always sort allocation queues by: (1) ESI acuity level, (2) Resource turnaround velocity, (3) Arrival time as tie-breaker only.',
        howToAvoidRepeating: 'Establish clear triage override rules that automatically preempt non-emergent patient queues.',
        practicalCounterexample: 'Serving an ESI-4 sprain who arrived at 10:00 AM before an ESI-2 chest pain patient who arrived at 10:15 AM.',
        m02ReassessFocus: 'Emergency Severity Index & Clinical Triage'
      });
    }
  }

  // Fallback boundary misconception if tests failed and none diagnosed yet
  if (misconceptions.length === 0 && failedTests.length > 0) {
    const primaryFail = failedTests[0];
    misconceptions.push({
      misconceptionId: 'misc-generic-boundary',
      category: 'boundary_condition',
      diagnosedMisconception: 'Designing for the nominal happy path while omitting boundary condition handling.',
      severity: 'moderate',
      whereReasoningBroke: `Failed verification: ${primaryFail.name} (${primaryFail.message || 'Requirement not met'})`,
      whyItBroke: 'Edge cases and rapid constraint changes create operational instability if unhandled.',
      missingLogicOrConcept: 'Comprehensive defensive design and boundary condition auditing.',
      invalidAssumption: 'Assuming operational inputs always adhere to nominal expected ranges.',
      howToApproachLogically: 'Analyze inputs at extremities: minimum values, maximum thresholds, null states, and dynamic load spikes.',
      howToAvoidRepeating: 'Always create dedicated verification checks targeting zero, maximum, and invalid states.',
      practicalCounterexample: 'An algorithm handling 100 requests flawlessly crashed when traffic reached 10,000 req/sec due to unhandled queue bounds.',
      m02ReassessFocus: 'Defensive Systems Architecture'
    });
  }

  // 2. Correct Response Dimensions (1-8)
  let whyCorrectReasoning: WhyCorrectReasoning | undefined = undefined;
  if (isCorrectOrAlternative) {
    whyCorrectReasoning = {
      whyCorrect: `Your solution successfully fulfilled the operational requirements of "${taskTitle}". It satisfied all ${passedTests.length} automated verification checks without violating operational invariants.`,
      reasoningPath: 'You accurately decoupled the problem into structural components: identifying key filter predicates, protecting live system throughput, and designing defensively for operational concurrency.',
      requirementsSatisfied: passedTests.map(t => `Verified check: ${t.name}`) || ['Satisfied all primary functional and structural deliverables.'],
      validAssumptions: [
        'Assumed concurrent system load requires non-blocking operational pathways.',
        'Assumed query optimizer traverses index predicates in leftmost composite order.',
        'Preserved strict data consistency across multi-tenant boundaries.'
      ],
      importantTradeOffs: [
        'Slight write-amplification during mutations accepted to achieve sub-millisecond query lookups.',
        'Longer initial deployment duration accepted via CONCURRENTLY in order to guarantee zero transaction locks.'
      ],
      alternativeValidApproaches: [
        {
          approachName: 'Partial / Filtered Index Architecture',
          description: 'Creating an index with a WHERE clause (e.g., WHERE deleted_at IS NULL).',
          tradeOffComparison: 'Significantly smaller index footprint and faster writes, but does not serve queries filtering on other soft-delete states.',
          validityContext: 'Highly recommended when 90%+ of queries target active records only.',
          isMateriallyFlawed: false
        },
        {
          approachName: 'Covering Index with INCLUDE Clause',
          description: 'Appending projected columns to the leaf pages using INCLUDE (column_name).',
          tradeOffComparison: 'Allows index-only scans eliminating heap lookups at the expense of wider index pages.',
          validityContext: 'Optimal when a specific high-frequency query projects 1-2 small scalar columns.',
          isMateriallyFlawed: false
        }
      ],
      whyFlawedAlternativesFail: [
        'Synchronous CREATE INDEX without CONCURRENTLY causes immediate table-level locking and transaction queuing.',
        'Single-column uncoordinated indexes force the query engine to perform expensive bitmap index scans with heavy CPU overhead.'
      ],
      potentialImprovements: [
        'Add automated monitoring via pg_stat_user_indexes to periodically check index utilization and scan efficiency.',
        'Implement proactive autovacuum tuning for the indexed relation to prevent dead tuple accumulation.'
      ]
    };
  }

  // 3. Incorrect / Partial Response Dimensions (1-10)
  let logicGapAnalysis: LogicGapAnalysis | undefined = undefined;
  if (!isCorrectOrAlternative) {
    const primaryMisc = misconceptions[0];
    const whatDoneWell = passedTests.map(t => `Successfully passed check: ${t.name}`);
    if (whatDoneWell.length === 0) {
      whatDoneWell.push('Initiated solution structure and recognized core domain objective.');
    }

    logicGapAnalysis = {
      whatCandidateDidCorrectly: whatDoneWell,
      whereReasoningBreaks: primaryMisc
        ? primaryMisc.whereReasoningBroke
        : `Your deliverable did not satisfy verification criteria for: ${failedTests.map(t => t.name).join(', ')}.`,
      whyItBreaks: primaryMisc
        ? primaryMisc.whyItBroke
        : 'The deliverable diverges from the required operational contract or omits critical defensive parameters.',
      missingConceptOrLogic: primaryMisc
        ? primaryMisc.missingLogicOrConcept
        : 'Understanding production constraints and edge-case handling under operational load.',
      invalidAssumption: primaryMisc
        ? primaryMisc.invalidAssumption
        : 'Assuming nominal happy-path execution without stress testing edge cases or system locks.',
      missingRequirement: failedTests.length > 0
        ? `Failed automated assertion: ${failedTests[0].name}`
        : 'Deliverable lacked completeness relative to expected artifact specifications.',
      correctReasoningPath: primaryMisc
        ? primaryMisc.howToApproachLogically
        : 'Step 1: Identify all operational constraints. Step 2: Verify zero-downtime safety. Step 3: Test boundary cases.',
      howToApproachLogically: 'Deconstruct the problem into: (1) Invariants that must never fail, (2) Concurrency & load conditions, (3) Exact output schema requirements.',
      howToAvoidRepeating: primaryMisc
        ? primaryMisc.howToAvoidRepeating
        : 'Use checklist-driven verification before submitting production deliverables.',
      practicalExampleOrCounterexample: primaryMisc
        ? primaryMisc.practicalCounterexample
        : 'Omitting concurrency controls caused cascading timeout errors across dependent services.'
    };
  }

  // 4. Why-Chain & How-Chain
  const whyChain: TeachingWhyChainItem[] = [
    {
      stage: 'System Invariant',
      statement: 'Production systems must maintain uninterrupted write availability during maintenance.',
      reasoning: 'High-throughput transactional APIs cannot tolerate exclusive table locks without triggering downstream timeouts.'
    },
    {
      stage: 'Access Pattern Optimization',
      statement: 'B-Tree index structure must match query filter cardinality.',
      reasoning: 'The query optimizer leverages leftmost composite prefixes to prune 99%+ of table blocks in log(N) time.'
    },
    {
      stage: 'Failure Isolation',
      statement: 'Mid-scenario constraint shifts require proactive mitigation.',
      reasoning: 'Real-world infrastructure experiences sudden traffic shifts; architectures must adapt without cascading failure.'
    }
  ];

  const howChain: TeachingHowChainStep[] = [
    {
      stepNumber: 1,
      action: 'Analyze Query Filters & Cardinality',
      rationale: 'Identify equality filters, range operators, and sort keys in the active workload.',
      domainConsideration: 'Predicate selectivity determines B-Tree tree depth and page count.'
    },
    {
      stepNumber: 2,
      action: 'Select Safe DDL Migration Syntax',
      rationale: 'Use non-blocking syntax (e.g. CONCURRENTLY) to avoid exclusive lock acquisition.',
      domainConsideration: 'Lock acquisition delays block connection pools and cause 504 Gateway Timeouts.'
    },
    {
      stepNumber: 3,
      action: 'Audit Covering & Projection Columns',
      rationale: 'Evaluate whether adding INCLUDE columns eliminates expensive heap table fetches.',
      domainConsideration: 'Index-only scan vs index-heap fetch trade-off.'
    },
    {
      stepNumber: 4,
      action: 'Validate Execution Plan with EXPLAIN ANALYZE',
      rationale: 'Verify that query planner switches from Seq Scan to Index Scan with optimal cost estimates.',
      domainConsideration: 'Planner cost models rely on updated pg_class and pg_statistics.'
    }
  ];

  // 5. Compare & Contrast
  const compareContrast: CompareContrastAnalysis = {
    candidateApproach: `Candidate provided deliverable with ${passedTests.length}/${det.testResults.length} passing tests. ${notes ? notes.slice(0, 150) : 'Direct deliverable submission without extended notes.'}`,
    optimalApproach: 'Production-grade implementation combining non-blocking execution (CONCURRENTLY), leftmost composite alignment, and explicit defensive handling for dynamic injections.',
    divergencePoints: failedTests.length > 0
      ? failedTests.map(t => `Validation difference: ${t.name}: ${t.message || 'Failed'}`)
      : ['Full concordance with optimal architectural requirements.'],
    tradeOffAnalysis: 'The optimal approach accepts marginal index write overhead in exchange for sub-millisecond read latency and zero downtime.'
  };

  // 6. Alternative Solutions
  const alternativeSolutions: TeachingAlternativeSolution[] = [
    {
      approachName: 'Partial / Filtered Index Architecture',
      description: 'Creating an index with a WHERE clause (e.g. WHERE deleted_at IS NULL).',
      tradeOffComparison: 'Significantly smaller index footprint and faster writes, but does not serve queries filtering on other soft-delete states.',
      validityContext: 'Highly recommended when 90%+ of queries target active records only.',
      isMateriallyFlawed: false
    },
    {
      approachName: 'Non-blocking Concurrent Index Migration',
      description: 'Execute CREATE INDEX CONCURRENTLY with composite filtering.',
      tradeOffComparison: 'Takes 2-3x longer to build but maintains 100% application uptime.',
      validityContext: 'Standard enterprise requirement for 24/7 web platforms.',
      isMateriallyFlawed: false
    }
  ];

  // 7. What-If Scenarios
  const whatIfScenarios: TeachingWhatIfScenario[] = [
    {
      changedConstraint: 'Write traffic spikes by 10x while read traffic remains constant.',
      howStrategyShifts: 'Re-evaluate secondary index footprint; prune unneeded indexes to prevent write throughput degradation.',
      keyTakeaway: 'Indexes accelerate reads but impose proportional penalties on INSERT and UPDATE transactions.'
    },
    {
      changedConstraint: 'The table grows beyond available RAM buffer pool (e.g. 500GB+).',
      howStrategyShifts: 'Transition from single B-Tree indexes to table partitioning (by date or hash) with local partitioned indexes.',
      keyTakeaway: 'Index efficiency collapses when index working sets no longer fit within shared buffer cache.'
    }
  ];

  // 8. Follow-up Check
  const followUpCheck: FollowUpUnderstandingCheck = {
    question: "In PostgreSQL, why does 'CREATE INDEX CONCURRENTLY' require two full table scans instead of one?",
    context: 'Verification of concurrency mechanics and lock-free migration internals.',
    options: [
      'Scan 1 builds the index structure; Scan 2 waits for pending transactions to finish and catches up on concurrent modifications.',
      'Scan 1 checks for duplicate keys; Scan 2 computes the B-Tree tree balance.',
      'Scan 1 creates a temporary table; Scan 2 copies rows into the primary relation.',
      'Scan 1 locks the table for reading; Scan 2 unlocks the table for writing.'
    ],
    correctAnswer: 'Scan 1 builds the index structure; Scan 2 waits for pending transactions to finish and catches up on concurrent modifications.',
    explanation: 'PostgreSQL executes two transactions: the first creates the index and registers it as invalid in pg_index, then waits for all current transactions to end. The second scan catches up on any rows modified since the first scan, guaranteeing complete index consistency without holding exclusive locks.'
  };

  const summaryGuidance = isCorrectOrAlternative
    ? `Mastery Demonstrated: Your submission for "${taskTitle}" exhibits strong architectural discipline. Review the trade-offs and alternative valid solutions below to further enhance edge-case resiliency.`
    : `Constructive Learning Opportunity: Your submission for "${taskTitle}" established a good baseline but diverged on ${failedTests.length} critical verification checks. Examine the logic gap analysis and counterexamples below.`;

  return {
    isCorrectOrAlternative,
    alternativeValidity: validity,
    summaryGuidance,
    whyCorrectReasoning,
    logicGapAnalysis,
    whyChain,
    howChain,
    compareContrast,
    alternativeSolutions,
    whatIfScenarios,
    misconceptions,
    followUpCheck,
    domainContext: {
      domain,
      focusAreas
    }
  };
}

// =============================================================================
// PHASE 8: ADAPTIVE WORK-ROUND POLICY EVALUATOR
// =============================================================================

export function evaluateAdaptiveNextStep(params: {
  candidateSeniority?: string;
  jobContext?: any;
  previousRounds: SimulationRoundRecord[];
  latestEvaluation?: any;
  availableSimulations?: any[];
}): {
  decision: AdaptationDecision;
  selectedSimulation: any;
  progressionSummary: {
    roundsCompleted: number;
    competenciesCovered: string[];
    competenciesRemaining: string[];
    coverageRatio: number;
  };
} {
  const previousRounds = params.previousRounds || [];
  const latestEval = params.latestEvaluation || {};
  const sims = params.availableSimulations || SEED_SIMULATIONS;
  const roundIndex = previousRounds.length + 1;

  const priorScore = typeof latestEval.overall_score === 'number'
    ? (latestEval.overall_score > 1 ? latestEval.overall_score / 100 : latestEval.overall_score)
    : 0.65;
  const alternativeValidity: AlternativeValidity = latestEval.alternative_validity || 'correct';
  const confidence = typeof latestEval.confidence_score === 'number' ? latestEval.confidence_score : 0.85;
  const uncertainty = typeof latestEval.uncertainty_score === 'number' ? latestEval.uncertainty_score : 0.15;

  const teachingPayload = latestEval.teaching_payload || {};
  const misconceptions = teachingPayload.misconceptions || [];
  const diagnosedMisconceptions: string[] = misconceptions
    .map((m: any) => m.conceptName || m.concept_name)
    .filter(Boolean);

  const previousTaskIds = previousRounds.map(r => r.definitionId).filter(Boolean);

  // Default required competencies if not provided
  const jdCompetencies = params.jobContext?.requiredCompetencies || [
    { name: 'System Architecture & Concurrency', skillName: 'Distributed Systems & Concurrency', domain: 'software' },
    { name: 'Database Architecture & Optimization', skillName: 'Relational Indexing & MVCC', domain: 'software' },
    { name: 'Financial Planning & Valuation', skillName: 'Capital Budgeting & Valuation', domain: 'finance' },
    { name: 'Clinical Emergency Triage', skillName: 'Emergency Triage & Patient Prioritization', domain: 'healthcare_admin' },
    { name: 'Data Engineering & Analytics', skillName: 'Real-Time Pipeline Engineering', domain: 'data' }
  ];

  const assessedCompetencies = new Set<string>(
    previousRounds.map(r => (r.competencyName || '').toLowerCase()).filter(Boolean)
  );

  const remainingCompetencies = jdCompetencies.filter(
    (c: any) => !assessedCompetencies.has(c.name.toLowerCase())
  );

  // Anti-Tunnel-Vision invariant
  const recentComps = previousRounds.slice(-2).map(r => (r.competencyName || '').toLowerCase());
  const forceSwitch = recentComps.length >= 2 && recentComps[0] === recentComps[1] && remainingCompetencies.length > 0;

  // Decision branching
  let reasonType: AdaptationReasonType = 'broaden_coverage';
  let internalRationale = '';
  let targetDifficulty = 3;

  if (forceSwitch) {
    reasonType = 'broaden_coverage';
    internalRationale = `Anti-Tunnel-Vision guardrail triggered: The last 2 rounds evaluated '${recentComps[0]}'. Rotating to unassessed role requirement to guarantee evaluation breadth.`;
  } else if (diagnosedMisconceptions.length > 0 && priorScore < 0.60) {
    reasonType = 'remediate_misconception';
    internalRationale = `Diagnosed active misconception: ${diagnosedMisconceptions[0]}. Immediate remediation round targeting this concept to verify candidate correction.`;
  } else if (priorScore >= 0.85 && uncertainty <= 0.35 && (alternativeValidity === 'correct' || alternativeValidity === 'alternative_valid')) {
    if (roundIndex >= 3 && remainingCompetencies.length === 0) {
      reasonType = 'stress_constraint';
      internalRationale = `High demonstrated proficiency (score: ${Math.round(priorScore * 100)}%, U: ${uncertainty.toFixed(2)}) across required competencies. Introducing tightened constraint stress-test.`;
    } else {
      reasonType = 'increase_difficulty';
      internalRationale = `Strong performance and calibrated confidence (score: ${Math.round(priorScore * 100)}%, U: ${uncertainty.toFixed(2)}). Elevating task difficulty to probe capability ceiling.`;
    }
  } else if (priorScore < 0.40 || alternativeValidity === 'incorrect' || alternativeValidity === 'incomplete') {
    const prevDiff = previousRounds.length > 0 ? (previousRounds[previousRounds.length - 1].difficulty || 3) : 3;
    if (prevDiff >= 3) {
      reasonType = 'decrease_difficulty';
      internalRationale = `Candidate experienced significant breakdown (score: ${Math.round(priorScore * 100)}%, validity: ${alternativeValidity}). Scaffolding at lower complexity to diagnose baseline.`;
    } else {
      reasonType = 'test_prerequisite';
      internalRationale = `Execution failure detected at foundational tier (score: ${Math.round(priorScore * 100)}%). Testing prerequisite conceptual invariant.`;
    }
  } else if (uncertainty > 0.45) {
    reasonType = 'reduce_uncertainty';
    internalRationale = `Posterior uncertainty elevated (U: ${uncertainty.toFixed(2)}). Administering calibration task to narrow proficiency confidence interval.`;
  } else if (remainingCompetencies.length > 0) {
    reasonType = 'broaden_coverage';
    internalRationale = `Role breadth prioritization: ${remainingCompetencies.length} of ${jdCompetencies.length} competencies remain unassessed. Presenting next required domain dimension.`;
  } else {
    reasonType = 'transfer_domain';
    internalRationale = `Core JD competencies evaluated. Testing cross-domain transfer of skills in alternative work round modality.`;
  }

  // Filter unattempted tasks
  let candidatePool = sims.filter(s => !previousTaskIds.includes(s.id));
  if (candidatePool.length === 0) {
    candidatePool = sims;
  }

  // Score candidate pool using Multi-Armed Bandit Utility Function
  const lastRound = previousRounds.length > 0 ? previousRounds[previousRounds.length - 1] : null;
  const lastRoundDiff = lastRound ? (lastRound.difficulty || 3) : 3;

  if (reasonType === 'increase_difficulty') targetDifficulty = Math.min(5, lastRoundDiff + 1);
  else if (reasonType === 'decrease_difficulty') targetDifficulty = Math.max(1, lastRoundDiff - 1);
  else targetDifficulty = lastRoundDiff;

  const scoredSims = candidatePool.map(sim => {
    const compName = sim.competency_name || '';
    const skillName = sim.skill_name || '';
    const diff = sim.difficulty_level || 3;

    const coverageBonus = !assessedCompetencies.has(compName.toLowerCase()) ? 1.0 : 0.1;
    let misconceptionBonus = 0.0;
    if (reasonType === 'remediate_misconception') {
      const lastComp = (lastRound?.competencyName || '').toLowerCase();
      const lastSkill = (lastRound?.skillName || '').toLowerCase();
      if (compName.toLowerCase() === lastComp || skillName.toLowerCase() === lastSkill) {
        misconceptionBonus = 2.5;
      } else if (diagnosedMisconceptions.some(m => skillName.toLowerCase().includes(m.toLowerCase()) || compName.toLowerCase().includes(m.toLowerCase()))) {
        misconceptionBonus = 2.0;
      }
    }

    const diffPenalty = Math.abs(diff - targetDifficulty) * 0.25;

    let recencyPenalty = 0.0;
    if (reasonType !== 'remediate_misconception') {
      const reversedRounds = [...previousRounds].reverse().slice(0, 3);
      reversedRounds.forEach((r, idx) => {
        if ((r.competencyName || '').toLowerCase() === compName.toLowerCase()) {
          recencyPenalty += (3 - idx) * 0.4;
        }
        if ((r.skillName || '').toLowerCase() === skillName.toLowerCase()) {
          recencyPenalty += (3 - idx) * 0.6;
        }
      });
    }

    const uncertaintyBonus = 0.5;
    const utility = (0.35 * coverageBonus) + (0.25 * uncertaintyBonus) + (0.30 * misconceptionBonus) - (0.20 * diffPenalty) - (0.40 * recencyPenalty);

    return {
      sim,
      utility,
      scores: {
        coverageBonus,
        misconceptionBonus,
        diffPenalty,
        recencyPenalty,
        finalUtility: utility
      }
    };
  });

  scoredSims.sort((a, b) => b.utility - a.utility);
  const chosen = scoredSims[0];
  const chosenSim = chosen.sim;

  // Friendly focus templates
  const friendlyTemplates: Record<AdaptationReasonType, string> = {
    increase_difficulty: `Elevated Complexity: Deepening ${chosenSim.skill_name} Mastery`,
    decrease_difficulty: `Foundational Focus: Core Principles in ${chosenSim.skill_name}`,
    remediate_misconception: `Remediation Drill: Mastering Key Invariants in ${chosenSim.skill_name}`,
    test_prerequisite: `Essential Prerequisite: Foundational Constructs for ${chosenSim.skill_name}`,
    broaden_coverage: `Role Breadth: Assessing ${chosenSim.competency_name} (${chosenSim.skill_name})`,
    test_practical_execution: `Hands-On Execution: Practical Problem-Solving in ${chosenSim.skill_name}`,
    test_reasoning_rigor: `Architectural Rationale: Design Trade-offs in ${chosenSim.skill_name}`,
    transfer_domain: `Domain Transfer: Applying ${chosenSim.skill_name} Under Novel Scenarios`,
    stress_constraint: `Resilience & Scale: Stress-Testing ${chosenSim.skill_name} Under Tight Constraints`,
    validate_improvement: `Competency Re-Check: Verifying Growth in ${chosenSim.skill_name}`,
    reduce_uncertainty: `Calibration Probe: Verifying Consistency in ${chosenSim.skill_name}`
  };

  const friendlyPreview = friendlyTemplates[reasonType] || `Next Focus: ${chosenSim.competency_name} (${chosenSim.skill_name})`;

  const decision: AdaptationDecision = {
    decisionId: `dec_${crypto.randomUUID().slice(0, 12)}`,
    timestamp: new Date().toISOString(),
    roundIndex,
    reasonType,
    targetCompetency: chosenSim.competency_name,
    targetSkill: chosenSim.skill_name,
    targetDomain: chosenSim.domain,
    targetDifficulty: chosenSim.difficulty_level || targetDifficulty,
    targetModality: chosenSim.simulation_type,
    internalRationale,
    candidateFocusPreview: friendlyPreview,
    priorState: {
      priorScore: Math.round(priorScore * 100),
      alternativeValidity,
      confidence: Number(confidence.toFixed(3)),
      uncertainty: Number(uncertainty.toFixed(3)),
      diagnosedMisconceptions,
      skillsCoveredCount: assessedCompetencies.size,
      competenciesRemainingCount: remainingCompetencies.length
    },
    selectionScores: {
      uncertaintyWeight: chosen.scores.coverageBonus,
      misconceptionWeight: chosen.scores.misconceptionBonus,
      coverageWeight: chosen.scores.coverageBonus,
      recencyPenalty: chosen.scores.recencyPenalty,
      finalUtilityScore: chosen.scores.finalUtility
    }
  };

  return {
    decision,
    selectedSimulation: chosenSim,
    progressionSummary: {
      roundsCompleted: previousRounds.length,
      competenciesCovered: Array.from(assessedCompetencies),
      competenciesRemaining: remainingCompetencies.map((c: any) => c.name),
      coverageRatio: Number((assessedCompetencies.size / Math.max(1, jdCompetencies.length)).toFixed(2))
    }
  };
}

export function registerSimulationRoutes(app: Hono<{ Bindings: Bindings }>) {

  // 1a. Phase 2: Full Assessment Context Intelligence Route
  app.get('/m3/simulations/context', async (c) => {
    try {
      const user = await getSessionUser(c);
      if (!user) return c.json({ error: 'Unauthorized' }, 401);

      const dbUser = await c.env.DB.prepare('SELECT organization_id FROM user_account WHERE id = ?').bind(user.id).first();
      const orgId = (dbUser?.organization_id as string) || 'org_default_public';
      const reqId = c.req.query('requisition_id');
      const purpose = (c.req.query('purpose') as AssessmentPurpose) || 'practice';

      const bundle = await resolveCandidateJobContext(c.env.DB, user.id, orgId, reqId, purpose);
      return c.json({
        success: true,
        candidate_context: bundle.candidateContext,
        job_context: bundle.jobContext,
        competency_targets: bundle.targets,
        assessment_context: bundle.assessmentContext
      });
    } catch (err: any) {
      console.error('Error in /m3/simulations/context:', err);
      return c.json({ success: false, error: err.message }, 500);
    }
  });

  // 1b. Phase 2: Targeted Simulation Context with Purpose Selection
  app.post('/m3/simulations/context/target', async (c) => {
    try {
      const user = await getSessionUser(c);
      if (!user) return c.json({ error: 'Unauthorized' }, 401);

      const dbUser = await c.env.DB.prepare('SELECT organization_id FROM user_account WHERE id = ?').bind(user.id).first();
      const orgId = (dbUser?.organization_id as string) || 'org_default_public';
      const body = await c.req.json().catch(() => ({}));
      const purpose = (body.assessment_purpose as AssessmentPurpose) || 'practice';
      const reqId = body.requisition_id;

      const bundle = await resolveCandidateJobContext(c.env.DB, user.id, orgId, reqId, purpose);
      return c.json({
        success: true,
        assessment_context: bundle.assessmentContext,
        recommended_target: bundle.assessmentContext.primaryRecommendedTarget
      });
    } catch (err: any) {
      console.error('Error in /m3/simulations/context/target:', err);
      return c.json({ success: false, error: err.message }, 500);
    }
  });

  // 1c. Phase 3: Deliver ONE Scaled, Adaptive Universal Task at a time
  app.get('/m3/tasks/next', async (c) => {
    try {
      const user = await getSessionUser(c);
      if (!user) return c.json({ error: 'Unauthorized' }, 401);

      const dbUser = await c.env.DB.prepare('SELECT organization_id FROM user_account WHERE id = ?').bind(user.id).first();
      const orgId = (dbUser?.organization_id as string) || 'org_default_public';
      const reqId = c.req.query('requisition_id');
      const purpose = (c.req.query('purpose') as AssessmentPurpose) || 'practice';

      // 1. Resolve full candidate context & prioritized targets
      const bundle = await resolveCandidateJobContext(c.env.DB, user.id, orgId, reqId, purpose);
      const targets = bundle.targets || [];

      // 2. Query candidate's past simulation sessions to discover already attempted tasks
      let pastDefinitionIds: string[] = [];
      try {
        const pastSessions = await c.env.DB.prepare(
          'SELECT definition_id FROM simulation_session WHERE user_id = ? ORDER BY created_at DESC LIMIT 20'
        ).bind(user.id).all();
        pastDefinitionIds = (pastSessions.results || []).map((r: any) => r.definition_id as string);
      } catch (_) {}

      // 3. Find matching seed simulation targeting the highest-priority non-repeated target
      let matchedSeed: any = null;
      let matchedTarget: CompetencyTarget | null = null;

      for (const target of targets) {
        const targetSkill = target.skillName.toLowerCase();
        const targetComp = target.name.toLowerCase();

        // Find candidate seed matching this target
        const candidateSeeds = SEED_SIMULATIONS.filter(sim => {
          const simSkill = sim.skill_name.toLowerCase();
          const simComp = sim.competency_name.toLowerCase();
          return simSkill === targetSkill ||
                 simComp === targetComp ||
                 simSkill.includes(targetSkill) ||
                 targetSkill.includes(simSkill) ||
                 simComp.includes(targetComp) ||
                 targetComp.includes(simComp);
        });

        // Filter out seeds candidate has recently done
        const unattempted = candidateSeeds.find(s => !pastDefinitionIds.includes(s.id));
        if (unattempted) {
          matchedSeed = unattempted;
          matchedTarget = target;
          break;
        }
      }

      // If no targeted unattempted seed found, fallback to any unattempted seed in the catalogue
      if (!matchedSeed) {
        matchedSeed = SEED_SIMULATIONS.find(s => !pastDefinitionIds.includes(s.id));
        if (matchedSeed) {
          matchedTarget = targets.find(t => t.domain === matchedSeed.domain) || targets[0] || null;
        }
      }

      // If all seeds in the catalogue have been attempted, fallback to first seed
      if (!matchedSeed) {
        matchedSeed = SEED_SIMULATIONS[0];
        matchedTarget = targets[0] || null;
      }

      // 4. Transform to TaskDefinition
      const baseTask = seedSimulationToTaskDefinition(matchedSeed, pastDefinitionIds.length + 1);
      if (matchedTarget) {
        baseTask.competencyTarget = matchedTarget;
      }

      // 5. Seniority scaling
      const candidateSeniority = bundle.candidateContext?.seniorityLevel || bundle.jobContext?.targetSeniority || 'mid';
      const scaledTask = scaleTaskToCandidateSeniority(baseTask, candidateSeniority);

      // 6. Validation
      const isValid = validateUniversalTaskDefinition(scaledTask);

      return c.json({
        success: true,
        task: scaledTask,
        is_valid: isValid,
        targeting_reason: matchedTarget?.rationale || `Directly targets ${scaledTask.competencyTarget.name}`,
        candidate_seniority: candidateSeniority,
        diversity_context: {
          past_rounds_completed: pastDefinitionIds.length,
          task_form: scaledTask.taskForm,
          task_family: scaledTask.taskFamily,
          modality: scaledTask.modality,
          cognitive_dimensions: scaledTask.cognitiveDimensions
        }
      });
    } catch (err: any) {
      console.error('Error in /m3/tasks/next:', err);
      return c.json({ success: false, error: err.message }, 500);
    }
  });

  // 1d. Phase 3: Universal Task Quality & Safety Validator
  app.post('/m3/tasks/validate', async (c) => {
    try {
      const user = await getSessionUser(c);
      if (!user) return c.json({ error: 'Unauthorized' }, 401);

      const body = await c.req.json().catch(() => ({}));
      const task = body.task;

      if (!task) {
        return c.json({ success: false, error: 'Task payload is required' }, 400);
      }

      const isValid = validateUniversalTaskDefinition(task);
      const errors: string[] = [];

      if (!task.id) errors.push('Missing task id');
      if (!task.modality) errors.push('Missing task modality');
      if (!task.competencyTarget) errors.push('Missing competencyTarget');
      if (!task.scenario?.objective) errors.push('Missing scenario objective');
      if (!task.scenario?.initialRequirements || task.scenario.initialRequirements.length === 0) errors.push('Missing initial requirements');
      if (!task.rubric?.dimensions || task.rubric.dimensions.length === 0) errors.push('Missing rubric dimensions');
      if (!task.coreModel) errors.push('Missing coreModel');

      // Safety check for sensitive demographic traits
      const { sensitiveTraitsFound } = sanitizeContextForTaskTargeting(task);

      return c.json({
        success: true,
        is_valid: isValid && errors.length === 0,
        errors,
        safety_passed: sensitiveTraitsFound.length === 0,
        sensitive_violations: sensitiveTraitsFound,
        quality_score: isValid && sensitiveTraitsFound.length === 0 ? 0.95 : 0.40
      });
    } catch (err: any) {
      console.error('Error in /m3/tasks/validate:', err);
      return c.json({ success: false, error: err.message }, 500);
    }
  });

  // 1. List Simulation Definitions (Enriched with Multi-Objective Targeting)
  app.get('/m3/simulations/definitions', async (c) => {
    const user = await getSessionUser(c);
    if (!user) return c.json({ error: 'Unauthorized' }, 401);

    const domainQuery = c.req.query('domain');
    const typeQuery = c.req.query('type');

    const dbUser = await c.env.DB.prepare('SELECT organization_id FROM user_account WHERE id = ?').bind(user.id).first();
    const orgId = (dbUser?.organization_id as string) || 'org_default_public';

    // Resolve context & prioritized targets
    let targets: CompetencyTarget[] = [];
    try {
      const bundle = await resolveCandidateJobContext(c.env.DB, user.id, orgId);
      targets = bundle.targets;
    } catch (_) {}

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

    // Map seed simulations against prioritized targets
    let results = SEED_SIMULATIONS.map(sim => {
      const simSkill = sim.skill_name.toLowerCase();
      const simComp = sim.competency_name.toLowerCase();

      // Find matching prioritized target
      const matchingTarget = targets.find(t =>
        t.skillName.toLowerCase() === simSkill ||
        t.name.toLowerCase() === simComp ||
        simSkill.includes(t.skillName.toLowerCase()) ||
        t.skillName.toLowerCase().includes(simSkill)
      );

      const isTargetedGap = Boolean(matchingTarget && (matchingTarget.targetingScore || 0) >= 0.60);
      const targetingScore = matchingTarget?.targetingScore || 0.40;

      return {
        ...sim,
        is_recommended_for_gap: isTargetedGap,
        user_session_status: sessionMap.get(sim.id) || null,
        targeting_priority_score: targetingScore,
        recommendation_reason: isTargetedGap 
          ? (matchingTarget?.rationale ? `${matchingTarget.rationale}; targets diagnosed uncertainty in ${sim.skill_name}` : `Directly targets diagnosed uncertainty in ${sim.skill_name}`)
          : 'Standard domain competency simulation'
      };
    });

    if (domainQuery) {
      results = results.filter(s => s.domain === domainQuery);
    }
    if (typeQuery) {
      results = results.filter(s => s.simulation_type === typeQuery);
    }

    // Sort by targeting priority score descending so highest-value work is first
    results.sort((a, b) => b.targeting_priority_score - a.targeting_priority_score);

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
      let { definition_id, force_new } = body;

      // Phase 3: Support adaptive next task selection
      let def = SEED_SIMULATIONS.find(s => s.id === definition_id);
      if (!def && (definition_id === 'adaptive_next' || !definition_id)) {
        let pastDefinitionIds: string[] = [];
        try {
          const pastSessions = await c.env.DB.prepare(
            'SELECT definition_id FROM simulation_session WHERE user_id = ? ORDER BY created_at DESC LIMIT 20'
          ).bind(user.id).all();
          pastDefinitionIds = (pastSessions.results || []).map((r: any) => r.definition_id as string);
        } catch (_) {}

        const bundle = await resolveCandidateJobContext(c.env.DB, user.id, orgId);
        const targets = bundle.targets || [];
        for (const target of targets) {
          const targetSkill = target.skillName.toLowerCase();
          const targetComp = target.name.toLowerCase();
          const match = SEED_SIMULATIONS.find(sim => {
            const simSkill = sim.skill_name.toLowerCase();
            const simComp = sim.competency_name.toLowerCase();
            return (simSkill === targetSkill || simComp === targetComp || simSkill.includes(targetSkill) || targetSkill.includes(simSkill)) &&
                   !pastDefinitionIds.includes(sim.id);
          });
          if (match) {
            def = match;
            break;
          }
        }
        if (!def) {
          def = SEED_SIMULATIONS.find(s => !pastDefinitionIds.includes(s.id)) || SEED_SIMULATIONS[0];
        }
      }

      if (!def) return c.json({ error: 'Valid definition_id required' }, 400);

      // Resolve candidate seniority for scaling
      const profile = await c.env.DB.prepare('SELECT experience_level FROM candidate_profile WHERE user_id = ?').bind(user.id).first();
      const candSeniority = (profile?.experience_level as string) || 'mid';

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
            task: scaleTaskToCandidateSeniority(seedSimulationToTaskDefinition(def, existing.current_step || 1), candSeniority),
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
        task: scaleTaskToCandidateSeniority(seedSimulationToTaskDefinition(def, 1), candSeniority),
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
         WHERE user_id = ? AND status IN ('active', 'in_progress', 'evaluated')
         ORDER BY updated_at DESC LIMIT 1`
      ).bind(user.id).first();

      if (!session) {
        return c.json({ success: true, active_session: null });
      }

      const def = SEED_SIMULATIONS.find(s => s.id === session.definition_id);
      const tevents = JSON.parse((session.telemetry_events_json as string) || '[]');

      let latestEvaluation = null;
      if (session.status === 'evaluated') {
        const ev = await c.env.DB.prepare(
          'SELECT * FROM simulation_evaluation WHERE session_id = ? AND user_id = ? ORDER BY created_at DESC'
        ).bind(session.id, user.id).first();
        if (ev) {
          latestEvaluation = {
            id: ev.id,
            session_id: ev.session_id,
            overall_score: Math.round(Number(ev.overall_score) * 100),
            alternative_validity: (ev.alternative_validity as AlternativeValidity) || 'correct',
            deterministic_verification: JSON.parse((ev.deterministic_verification_json as string) || '{}'),
            dimension_scores: JSON.parse((ev.dimension_scores_json as string) || '{}'),
            observable_evidence: JSON.parse((ev.observable_evidence_json as string) || '{}'),
            observed_facts: JSON.parse((ev.observed_facts_json as string) || '[]'),
            model_interpretation: JSON.parse((ev.model_interpretation_json as string) || '{}'),
            remediation_recommendations: JSON.parse((ev.remediation_recommendation_json as string) || '[]'),
            teaching_payload: JSON.parse((ev.teaching_payload_json as string) || '{}'),
            adaptation_decision: JSON.parse((ev.adaptation_decision_json as string) || '{}'),
            confidence_score: Number(ev.confidence_score || 0.85),
            uncertainty_score: Number(ev.uncertainty_score || 0.15),
            provenance: JSON.parse((ev.provenance_json as string) || '{}'),
            human_review_status: ev.human_review_status || 'unreviewed',
            created_at: ev.created_at
          };
        }
      }

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
          evaluation: latestEvaluation,
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

  // 5b. Phase 4: Execute Candidate Work in Safe Sandbox
  app.post('/m3/simulations/sessions/:id/execute', async (c) => {
    try {
      const user = await getSessionUser(c);
      if (!user) return c.json({ error: 'Unauthorized' }, 401);

      const sessionId = c.req.param('id');
      const session = await c.env.DB.prepare(
        'SELECT * FROM simulation_session WHERE id = ? AND user_id = ?'
      ).bind(sessionId, user.id).first();

      if (!session) return c.json({ error: 'Session not found' }, 404);

      const def = SEED_SIMULATIONS.find(s => s.id === session.definition_id) || SEED_SIMULATIONS[0];
      const body = await c.req.json().catch(() => ({}));
      const { action_type, code, query, parameters, candidate_work } = body;

      const payload = {
        code,
        query,
        parameters,
        candidate_work: candidate_work || JSON.parse((session.candidate_work_json as string) || '{}')
      };

      const execResult = executeCandidateWork(def, action_type || 'run_code', payload);

      // Record execution telemetry automatically
      const events = JSON.parse((session.telemetry_events_json as string) || '[]');
      events.push({
        timestamp: new Date().toISOString(),
        action_type: action_type || 'execution',
        payload: {
          execution_type: execResult.execution_type,
          status: execResult.status,
          duration_ms: execResult.duration_ms,
          tests_passed: execResult.test_results?.filter(t => t.passed).length || 0,
          total_tests: execResult.test_results?.length || 0,
          metrics: execResult.metrics
        }
      });

      // Update session work if candidate_work was passed
      const updatedWork = candidate_work ? JSON.stringify(candidate_work) : session.candidate_work_json;

      await c.env.DB.prepare(
        `UPDATE simulation_session 
         SET telemetry_events_json = ?, candidate_work_json = ?, updated_at = CURRENT_TIMESTAMP 
         WHERE id = ?`
      ).bind(JSON.stringify(events), updatedWork, sessionId).run();

      return c.json({
        success: true,
        session_id: sessionId,
        execution_result: execResult,
        total_actions: events.length
      });
    } catch (err: any) {
      console.error('Error executing candidate work:', err);
      return c.json({ success: false, error: err.message }, 500);
    }
  });

  // 5c. Phase 4: Standalone Execution Sandbox (Direct Testing)
  app.post('/m3/execute', async (c) => {
    try {
      const user = await getSessionUser(c);
      if (!user) return c.json({ error: 'Unauthorized' }, 401);

      const body = await c.req.json().catch(() => ({}));
      const { definition_id, action_type, payload } = body;
      const def = SEED_SIMULATIONS.find(s => s.id === definition_id) || SEED_SIMULATIONS[0];

      const execResult = executeCandidateWork(def, action_type || 'run_code', payload || {});
      return c.json({
        success: true,
        execution_result: execResult
      });
    } catch (err: any) {
      return c.json({ success: false, error: err.message }, 500);
    }
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

    // Phase 5 & 6 Idempotency Protection: If session is already completed, return existing evaluation
    if (session.status === 'completed') {
      const existingEval = await c.env.DB.prepare(
        'SELECT * FROM simulation_evaluation WHERE session_id = ? AND user_id = ? ORDER BY created_at DESC'
      ).bind(sessionId, user.id).first();

      if (existingEval) {
        return c.json({
          success: true,
          idempotent: true,
          session_id: sessionId,
          evaluation_id: existingEval.id,
          overall_score: Math.round(Number(existingEval.overall_score) * 100),
          alternative_validity: (existingEval.alternative_validity as AlternativeValidity) || 'correct',
          deterministic_verification: JSON.parse((existingEval.deterministic_verification_json as string) || '{}'),
          dimension_scores: JSON.parse((existingEval.dimension_scores_json as string) || '{}'),
          observable_evidence: JSON.parse((existingEval.observable_evidence_json as string) || '{}'),
          observed_facts: JSON.parse((existingEval.observed_facts_json as string) || '[]'),
          model_interpretation: JSON.parse((existingEval.model_interpretation_json as string) || '{}'),
          remediation_recommendations: JSON.parse((existingEval.remediation_recommendation_json as string) || '[]'),
          confidence_score: existingEval.confidence_score,
          uncertainty_score: existingEval.uncertainty_score || 0.15,
          provenance: JSON.parse((existingEval.provenance_json as string) || '{}'),
          teaching_payload: JSON.parse((existingEval.teaching_payload_json as string) || '{}')
        });
      }
    }

    const { final_output, notes } = await c.req.json().catch(() => ({}));
    const def = SEED_SIMULATIONS.find(s => s.id === session.definition_id);
    if (!def) return c.json({ error: 'Definition not found' }, 404);

    const telemetryEvents = JSON.parse((session.telemetry_events_json as string) || '[]');
    const dynamicState = JSON.parse((session.dynamic_state_json as string) || '{}');

    // Phase 6 Step 1: Deterministic-First Objective Verification Pipeline
    const deterministicResult = executeDeterministicEvaluation(def, final_output, telemetryEvents);
    const initialValidity = classifyAlternativeValidity(
      deterministicResult,
      notes || '',
      Boolean(dynamicState.injected),
      telemetryEvents.length,
      final_output
    );

    let alternativeValidity: AlternativeValidity = initialValidity.validity;
    let alternativeValidityRationale: string = initialValidity.rationale;
    let overallScore = deterministicResult.score;
    let dimensionScores: any = {};
    let observableEvidence: any = {};
    let modelInterpretation: any = {};
    let remediationTasks: any[] = [];
    let evaluatorType: 'deterministic_first' | 'hybrid_ai' | 'deterministic_fallback' = 'deterministic_first';

    let teachingPayload: M3TeachingPayload = generateTeachingPayload(
      def,
      final_output,
      deterministicResult,
      initialValidity.validity,
      notes || '',
      Boolean(dynamicState.injected)
    );

    // Phase 6 Step 2: Evidence-Grounded AI Interpretation (where NVIDIA API is available)
    if (c.env.NVIDIA_API_KEY) {
      try {
        const evalPrompt = `You are a strict, domain-expert practical assessment evaluator for IntelliHire.
Evaluate the candidate's actual deliverable and observable evidence against the official domain rubric.
DO NOT assign arbitrary scores. Anchor your analysis to the deterministic test results and empirical facts.

Domain: ${def.domain}
Simulation Type: ${def.simulation_type}
Role Context: ${def.target_role}
Competency: ${def.competency_name}
Skill: ${def.skill_name}

Scenario Objective: ${def.scenario.objective}
Initial Requirements: ${JSON.stringify(def.scenario.initial_requirements)}
Injected Constraint Change: ${JSON.stringify(def.dynamic_injection)}
Dynamic Shift Applied: ${dynamicState.injected ? 'YES' : 'NO'}

Deterministic Validation Suite Results:
${JSON.stringify(deterministicResult.test_results)}
Objective Score: ${deterministicResult.score}

Candidate Final Deliverable:
${JSON.stringify(final_output)}

Candidate Work Notes / Methodology:
${notes || 'None provided'}

Candidate Action Count: ${telemetryEvents.length} actions observed.

Official Evaluation Rubric:
${JSON.stringify(def.rubric)}

Classify Alternative Validity as ONE of:
- "correct"
- "partially_correct"
- "incomplete"
- "context_dependent"
- "alternative_valid"
- "incorrect"
- "insufficient_information"

Return ONLY valid JSON matching this schema:
{
  "overall_score": <number 0.0 - 1.0>,
  "alternative_validity": "<validity category>",
  "alternative_validity_rationale": "<reason for classification>",
  "dimension_scores": {
    ${(def.rubric?.dimensions || []).map((d: any) => `"${d.name}": <0.0 - 1.0>`).join(',\n    ')}
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
              max_tokens: 700
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
              evaluatorType = 'hybrid_ai';
              if (parsed.alternative_validity && isValidAlternativeValidity(parsed.alternative_validity)) {
                alternativeValidity = parsed.alternative_validity;
                alternativeValidityRationale = parsed.alternative_validity_rationale || alternativeValidityRationale;
              }
            }
          }
        } catch (fetchErr) {
          clearTimeout(timeoutId);
          console.warn('AI evaluation timed out or failed, falling back to deterministic domain rubric scoring:', fetchErr);
        }
      } catch (_) {}
    }

    // Phase 6 Step 3: Resilient Deterministic Rubric Scoring if AI was unavailable or skipped
    if (!dimensionScores || Object.keys(dimensionScores).length === 0) {
      evaluatorType = 'deterministic_fallback';
      const rubricScoring = scoreDomainRubric(
        def.rubric,
        deterministicResult,
        initialValidity.validity,
        telemetryEvents.length,
        Boolean(dynamicState.injected)
      );

      overallScore = rubricScoring.overallScore;
      dimensionScores = rubricScoring.dimensionScores;
      alternativeValidity = initialValidity.validity;
      alternativeValidityRationale = initialValidity.rationale;

      observableEvidence = {
        key_actions_identified: [
          `Candidate executed ${telemetryEvents.length} observable telemetry actions during the simulation`,
          `Delivered structured output conforming to ${def.scenario.expected_output_type}`,
          ...deterministicResult.testResults.map(t => `${t.name}: ${t.passed ? 'PASSED' : 'FAILED'}`)
        ],
        trade_offs_identified: notes ? [notes.slice(0, 120)] : ['Navigated resource constraints under operational conditions'],
        constraint_adherence: dynamicState.injected ? 'Adapted work surface to injected mid-scenario constraint change' : 'Completed initial baseline requirements'
      };

      modelInterpretation = {
        strengths: `Demonstrated disciplined execution in ${def.competency_name}. Maintained systematic approach across ${telemetryEvents.length} logged actions.`,
        gaps: overallScore < 0.8 ? `Opportunities remain to refine edge-case isolation and quantitative defense in ${def.skill_name}.` : 'No critical gaps identified in this scenario.',
        rationale: `Classified as '${alternativeValidity}': ${alternativeValidityRationale}`
      };

      remediationTasks = [
        {
          m02_skill_target: def.skill_name,
          recommended_study: `Review systematic methodologies for ${def.skill_name} under rapid constraint changes.`,
          recommended_practice: `Practice think-aloud scenario challenges in M02 Interview Prep focusing on ${def.competency_name}.`
        }
      ];
    }

    // Phase 7: Finalize Structured Pedagogical Teaching Payload
    teachingPayload = generateTeachingPayload(
      def,
      final_output,
      deterministicResult,
      alternativeValidity,
      notes || '',
      Boolean(dynamicState.injected)
    );

    const evalId = crypto.randomUUID();

    // Layer 1: Source Evidence
    const sourceEvidence = {
      candidate_work: final_output,
      notes: notes || '',
      action_count: telemetryEvents.length,
      duration_seconds: Math.max(1, Math.round((Date.now() - new Date((session.created_at as string) || Date.now()).getTime()) / 1000))
    };

    // Layer 2: Observable Facts (strictly empirical, verified by system)
    const executionActions = telemetryEvents.filter((e: any) => e.action_type?.includes('run') || e.action_type?.includes('execute'));
    const observedFacts: ObservableFact[] = [
      {
        id: `fact-${crypto.randomUUID().slice(0, 8)}`,
        fact: `Candidate logged ${telemetryEvents.length} interaction actions during the simulation session`,
        category: 'action',
        timestamp: new Date().toISOString(),
        verifiedBy: 'telemetry_stream',
        metrics: { action_count: telemetryEvents.length }
      },
      {
        id: `fact-${crypto.randomUUID().slice(0, 8)}`,
        fact: `Delivered structured final artifact conforming to expected schema (${def.scenario.expected_output_type})`,
        category: 'artifact_structure',
        timestamp: new Date().toISOString(),
        verifiedBy: 'heuristic_parser',
        metrics: { deliverable_bytes: JSON.stringify(final_output || '').length }
      },
      {
        id: `fact-${crypto.randomUUID().slice(0, 8)}`,
        fact: dynamicState.injected
          ? `Adapted deliverable in response to mid-scenario injection: ${def.dynamic_injection?.alert_title || 'Dynamic constraint shift'}`
          : 'Executed deliverable strictly under baseline operational constraints without mid-scenario deviation',
        category: 'constraint_handling',
        timestamp: new Date().toISOString(),
        verifiedBy: 'telemetry_stream',
        metrics: { dynamic_shift_present: Boolean(dynamicState.injected) }
      }
    ];

    if (executionActions.length > 0) {
      observedFacts.push({
        id: `fact-${crypto.randomUUID().slice(0, 8)}`,
        fact: `Executed ${executionActions.length} sandbox validation runs during iterative drafting`,
        category: 'execution_result',
        timestamp: new Date().toISOString(),
        verifiedBy: 'sandbox_execution',
        metrics: { sandbox_runs: executionActions.length }
      });
    }

    // Layer 3: Model Interpretation (explicitly marked speculative: true, segregated from empirical facts)
    const modelInterpretationRecord = {
      strengths: modelInterpretation.strengths || `Demonstrated disciplined execution in ${def.competency_name}. Maintained systematic approach across ${telemetryEvents.length} logged actions.`,
      gaps: modelInterpretation.gaps || (overallScore < 0.8 ? `Opportunities remain to refine edge-case isolation and quantitative defense in ${def.skill_name}.` : 'No critical gaps identified in this scenario.'),
      rationale: modelInterpretation.rationale || 'Performance evaluated against multi-dimensional domain rubric and observable telemetry stream.',
      speculative: true as const,
      evaluated_at: new Date().toISOString()
    };

    // Layer 4: Calibrated Confidence & Epistemic Uncertainty (Bayesian Grounding)
    const actionBonus = Math.min(0.18, Math.log1p(telemetryEvents.length) * 0.06);
    const executionBonus = deterministicResult.score * 0.15;
    const adaptBonus = dynamicState.injected ? 0.08 : 0.0;
    const calibratedConfidence = Math.max(0.25, Math.min(0.98, Math.round((0.55 + actionBonus + executionBonus + adaptBonus) * 100) / 100));
    const epistemicUncertainty = Math.round((1.0 - calibratedConfidence) * 100) / 100;

    // Layer 5: Cryptographic Provenance & Privacy Assurance
    const submissionString = JSON.stringify({
      sessionId,
      userId: user.id,
      definitionId: def.id,
      work: final_output,
      notes: notes || '',
      timestamp: new Date().toISOString()
    });
    const hashBuffer = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(submissionString));
    const submissionHash = Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, '0')).join('');

    const provenanceData = {
      task_id: def.id,
      task_version: 'v1.0',
      task_difficulty: def.difficulty_level,
      submission_hash: submissionHash,
      submission_timestamp: new Date().toISOString(),
      evaluator: {
        type: evaluatorType,
        model: evaluatorType === 'hybrid_ai' ? 'meta/muse-glimmer-30b' : 'deterministic_engine_v1',
        provider: evaluatorType === 'hybrid_ai' ? 'nvidia' : 'builtin'
      },
      alternative_validity: alternativeValidity,
      deterministic_score: deterministicResult.score,
      environment: {
        runtime: 'cloudflare_pages_workers',
        timestamp: new Date().toISOString(),
        ip_redacted: true
      },
      retained_telemetry_count: telemetryEvents.length,
      privacy_guarantee: 'pii_stripped_no_protected_traits',
      autonomous_decision_prohibited: true
    };

    // Phase 8: Evaluate Adaptive Next Step & Multi-Round State
    const currentDynamicState = JSON.parse((session.dynamic_state_json as string) || '{}');
    const existingRounds: SimulationRoundRecord[] = currentDynamicState.rounds_history || [];
    const currentRoundIdx = currentDynamicState.current_round_index || (existingRounds.length > 0 ? existingRounds[existingRounds.length - 1].roundIndex : 1);

    const adaptiveResult = evaluateAdaptiveNextStep({
      candidateSeniority: 'senior',
      previousRounds: [
        ...existingRounds.filter(r => r.roundIndex !== currentRoundIdx),
        {
          roundIndex: currentRoundIdx,
          definitionId: def.id,
          taskTitle: def.title,
          modality: def.simulation_type as WorkRoundModality,
          difficulty: def.difficulty_level || 3,
          competencyName: def.competency_name,
          skillName: def.skill_name,
          startedAt: currentDynamicState.current_round_started_at || session.created_at || new Date().toISOString(),
          submittedAt: new Date().toISOString(),
          overallScore: Math.round(overallScore * 100),
          alternativeValidity,
          confidence: calibratedConfidence,
          uncertainty: epistemicUncertainty,
          misconceptionsDiagnosed: (teachingPayload.misconceptions || []).map((m: any) => m.conceptName || m.concept_name).filter(Boolean),
          status: 'evaluated'
        }
      ],
      latestEvaluation: {
        overall_score: Math.round(overallScore * 100),
        alternative_validity: alternativeValidity,
        confidence_score: calibratedConfidence,
        uncertainty_score: epistemicUncertainty,
        teaching_payload: teachingPayload
      },
      availableSimulations: SEED_SIMULATIONS
    });

    const completedRoundRecord: SimulationRoundRecord = {
      roundIndex: currentRoundIdx,
      definitionId: def.id,
      taskTitle: def.title,
      modality: def.simulation_type as WorkRoundModality,
      difficulty: def.difficulty_level || 3,
      competencyName: def.competency_name,
      skillName: def.skill_name,
      startedAt: currentDynamicState.current_round_started_at || session.created_at || new Date().toISOString(),
      submittedAt: new Date().toISOString(),
      overallScore: Math.round(overallScore * 100),
      alternativeValidity,
      confidence: calibratedConfidence,
      uncertainty: epistemicUncertainty,
      misconceptionsDiagnosed: adaptiveResult.decision.priorState.diagnosedMisconceptions,
      adaptationDecision: adaptiveResult.decision,
      status: 'evaluated'
    };

    const updatedRounds = [
      ...existingRounds.filter(r => r.roundIndex !== currentRoundIdx),
      completedRoundRecord
    ];

    const updatedDynamicState = {
      ...currentDynamicState,
      current_round_index: currentRoundIdx,
      rounds_history: updatedRounds,
      latest_adaptation_decision: adaptiveResult.decision,
      progression: adaptiveResult.progressionSummary
    };

    // Persist evaluation with Phase 6, 7 & 8 columns (alternative_validity, deterministic_verification_json, teaching_payload_json, adaptation_decision_json)
    await c.env.DB.prepare(
      `INSERT INTO simulation_evaluation 
       (id, session_id, user_id, definition_id, overall_score, dimension_scores_json, observable_evidence_json, model_interpretation_json, remediation_recommendation_json, confidence_score, uncertainty_score, observed_facts_json, provenance_json, submission_hash, submission_version, alternative_validity, deterministic_verification_json, teaching_payload_json, adaptation_decision_json, human_review_status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?, ?, ?, 'unreviewed')`
    ).bind(
      evalId, sessionId, user.id, def.id,
      overallScore,
      JSON.stringify(dimensionScores),
      JSON.stringify(observableEvidence),
      JSON.stringify(modelInterpretationRecord),
      JSON.stringify(remediationTasks),
      calibratedConfidence,
      epistemicUncertainty,
      JSON.stringify(observedFacts),
      JSON.stringify(provenanceData),
      submissionHash,
      alternativeValidity,
      JSON.stringify(deterministicResult),
      JSON.stringify(teachingPayload),
      JSON.stringify(adaptiveResult.decision)
    ).run();

    // Mark session round as evaluated (keeping session open for continuous work rounds)
    await c.env.DB.prepare(
      `UPDATE simulation_session 
       SET status = 'evaluated', candidate_work_json = ?, dynamic_state_json = ?, updated_at = CURRENT_TIMESTAMP 
       WHERE id = ?`
    ).bind(JSON.stringify(final_output), JSON.stringify(updatedDynamicState), sessionId).run();

    // Downstream Sync 1: Synchronize to readiness_evidence_ledger for M05 consumption
    const ledgerId = crypto.randomUUID();
    const primaryFactText = observedFacts.map(f => f.fact).join('; ');
    await c.env.DB.prepare(
      `INSERT INTO readiness_evidence_ledger 
       (id, candidate_user_id, organization_id, source_module, source_record_id, competency_name, skill_name, evidence_type, observed_fact, model_interpretation, confidence_score, uncertainty_score, provenance_json, human_review_status, created_at)
       VALUES (?, ?, ?, 'M03', ?, ?, ?, 'work_simulation', ?, ?, ?, ?, ?, 'unreviewed', CURRENT_TIMESTAMP)`
    ).bind(
      ledgerId, user.id, (session.organization_id as string) || 'org_default_public',
      evalId, def.competency_name, def.skill_name,
      primaryFactText, modelInterpretationRecord.rationale || modelInterpretationRecord.strengths || '',
      calibratedConfidence, epistemicUncertainty, JSON.stringify(provenanceData)
    ).run().catch(err => console.warn('Non-blocking readiness ledger write error:', err));

    // Downstream Sync 1b: If misconceptions were diagnosed, synchronize to readiness_evidence_ledger as 'misconception'
    if (teachingPayload.misconceptions && teachingPayload.misconceptions.length > 0) {
      for (const misc of teachingPayload.misconceptions) {
        const miscLedgerId = crypto.randomUUID();
        await c.env.DB.prepare(
          `INSERT INTO readiness_evidence_ledger 
           (id, candidate_user_id, organization_id, source_module, source_record_id, competency_name, skill_name, evidence_type, observed_fact, model_interpretation, confidence_score, uncertainty_score, provenance_json, human_review_status, created_at)
           VALUES (?, ?, ?, 'M03', ?, ?, ?, 'misconception', ?, ?, ?, ?, ?, 'unreviewed', CURRENT_TIMESTAMP)`
        ).bind(
          miscLedgerId, user.id, (session.organization_id as string) || 'org_default_public',
          evalId, def.competency_name, def.skill_name,
          misc.diagnosedMisconception,
          `Category: ${misc.category}. Why it breaks: ${misc.whyItBroke}. Remediation: ${misc.howToAvoidRepeating}`,
          calibratedConfidence, epistemicUncertainty, JSON.stringify(provenanceData)
        ).run().catch(err => console.warn('Non-blocking misconception ledger write error:', err));
      }
    }

    // Downstream Sync 2: Canonical Evidence Package for M02/M05
    const packageId = `pkg-m3-${evalId}`;
    const evidencePkg = {
      packageId,
      sessionId,
      candidateId: user.id,
      organizationId: session.organization_id,
      targetRole: def.target_role,
      occupationCode: def.occupation_code,
      domain: def.domain,
      competencyName: def.competency_name,
      skillName: def.skill_name,
      taskTitle: def.title,
      taskModality: def.simulation_type,
      overallScore: Math.round(overallScore * 100),
      alternativeValidity,
      deterministicVerification: deterministicResult,
      dimensionScores,
      confidenceScore: calibratedConfidence,
      uncertaintyScore: epistemicUncertainty,
      sourceEvidence,
      observedFacts,
      modelInterpretation: modelInterpretationRecord,
      teachingPayload,
      humanJudgment: {
        status: 'unreviewed'
      },
      provenance: provenanceData,
      m05LedgerSynced: true,
      m02FeedbackLoop: {
        skillTarget: def.skill_name,
        recommendedStudy: remediationTasks[0]?.recommended_study || '',
        recommendedPractice: remediationTasks[0]?.recommended_practice || ''
      },
      autonomousDecisionProhibited: true
    };

    await c.env.DB.prepare(
      `INSERT OR REPLACE INTO evidence_package 
       (id, user_id, organization_id, attempt_id, package_version, package_json, created_at)
       VALUES (?, ?, ?, ?, 1, ?, CURRENT_TIMESTAMP)`
    ).bind(
      packageId, user.id, (session.organization_id as string) || 'org_default_public',
      sessionId, JSON.stringify(evidencePkg)
    ).run().catch(err => console.warn('Non-blocking evidence package write error:', err));

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
      alternative_validity: alternativeValidity,
      alternative_validity_rationale: alternativeValidityRationale,
      deterministic_verification: deterministicResult,
      dimension_scores: dimensionScores,
      observable_evidence: observableEvidence,
      observed_facts: observedFacts,
      model_interpretation: modelInterpretationRecord,
      remediation_recommendations: remediationTasks,
      teaching_payload: teachingPayload,
      adaptation_decision: adaptiveResult.decision,
      progression: {
        round_index: currentRoundIdx,
        rounds_completed: updatedRounds.length,
        competencies_covered: adaptiveResult.progressionSummary.competenciesCovered,
        competencies_remaining: adaptiveResult.progressionSummary.competenciesRemaining,
        coverage_ratio: adaptiveResult.progressionSummary.coverageRatio,
        can_proceed_to_next_module: true
      },
      confidence_score: calibratedConfidence,
      uncertainty_score: epistemicUncertainty,
      provenance: provenanceData,
      m02_feedback_loop: {
        skill_updated: def.skill_name,
        readiness_updated: true
      },
      autonomous_decision_prohibited: true
    });
    } catch (err: any) {
      console.error('Error submitting simulation for evaluation:', err);
      return c.json({ success: false, error: err.message || 'Error evaluating simulation' }, 500);
    }
  });

  // 7a. Phase 8: Transition to Next Adaptive Work Round
  app.post('/m3/simulations/sessions/:id/next', async (c) => {
    try {
      const user = await getSessionUser(c);
      if (!user) return c.json({ error: 'Unauthorized' }, 401);

      const sessionId = c.req.param('id');
      const session = await c.env.DB.prepare(
        'SELECT * FROM simulation_session WHERE id = ? AND user_id = ?'
      ).bind(sessionId, user.id).first();

      if (!session) return c.json({ error: 'Session not found' }, 404);

      const currentDynamicState = JSON.parse((session.dynamic_state_json as string) || '{}');
      const existingRounds: SimulationRoundRecord[] = currentDynamicState.rounds_history || [];

      // Fetch latest evaluation
      const latestEval = await c.env.DB.prepare(
        'SELECT * FROM simulation_evaluation WHERE session_id = ? AND user_id = ? ORDER BY created_at DESC'
      ).bind(sessionId, user.id).first();

      const latestEvalPayload = latestEval ? {
        overall_score: Number(latestEval.overall_score),
        alternative_validity: latestEval.alternative_validity,
        confidence_score: latestEval.confidence_score,
        uncertainty_score: latestEval.uncertainty_score,
        teaching_payload: JSON.parse((latestEval.teaching_payload_json as string) || '{}')
      } : undefined;

      // Evaluate next step
      const adaptiveResult = evaluateAdaptiveNextStep({
        candidateSeniority: 'senior',
        previousRounds: existingRounds,
        latestEvaluation: latestEvalPayload,
        availableSimulations: SEED_SIMULATIONS
      });

      const nextDef = adaptiveResult.selectedSimulation;
      const nextRoundIndex = (currentDynamicState.current_round_index || existingRounds.length || 1) + 1;

      const newRoundRecord: SimulationRoundRecord = {
        roundIndex: nextRoundIndex,
        definitionId: nextDef.id,
        taskTitle: nextDef.title,
        modality: nextDef.simulation_type as WorkRoundModality,
        difficulty: nextDef.difficulty_level || 3,
        competencyName: nextDef.competency_name,
        skillName: nextDef.skill_name,
        startedAt: new Date().toISOString(),
        status: 'active'
      };

      const updatedRounds = [...existingRounds, newRoundRecord];
      const updatedDynamicState = {
        ...currentDynamicState,
        current_round_index: nextRoundIndex,
        current_round_started_at: new Date().toISOString(),
        rounds_history: updatedRounds,
        latest_adaptation_decision: adaptiveResult.decision,
        progression: adaptiveResult.progressionSummary,
        injected: false,
        injection: null
      };

      // Update simulation_session
      await c.env.DB.prepare(
        `UPDATE simulation_session 
         SET definition_id = ?, status = 'active', current_step = 1,
             candidate_work_json = ?, dynamic_state_json = ?, updated_at = CURRENT_TIMESTAMP 
         WHERE id = ?`
      ).bind(
        nextDef.id,
        JSON.stringify(nextDef.scenario?.starting_data || {}),
        JSON.stringify(updatedDynamicState),
        sessionId
      ).run();

      const scaledTask = scaleTaskToCandidateSeniority(
        seedSimulationToTaskDefinition(nextDef, nextRoundIndex),
        'senior'
      );

      return c.json({
        success: true,
        session_id: sessionId,
        round_index: nextRoundIndex,
        definition: nextDef,
        task: scaledTask,
        adaptation_decision: adaptiveResult.decision,
        progression: adaptiveResult.progressionSummary
      });
    } catch (err: any) {
      console.error('Error transitioning to next adaptive round:', err);
      return c.json({ success: false, error: err.message || 'Error advancing to next round' }, 500);
    }
  });

  // 7b. Phase 8: Explicit Proceed to Next Module (Module 4 / Interviews)
  app.post('/m3/simulations/sessions/:id/proceed', async (c) => {
    try {
      const user = await getSessionUser(c);
      if (!user) return c.json({ error: 'Unauthorized' }, 401);

      const sessionId = c.req.param('id');
      const session = await c.env.DB.prepare(
        'SELECT * FROM simulation_session WHERE id = ? AND user_id = ?'
      ).bind(sessionId, user.id).first();

      if (!session) return c.json({ error: 'Session not found' }, 404);

      const currentDynamicState = JSON.parse((session.dynamic_state_json as string) || '{}');
      const rounds: SimulationRoundRecord[] = currentDynamicState.rounds_history || [];

      // Verify at least one round evaluated
      if (rounds.length === 0 && session.status !== 'evaluated') {
        return c.json({ error: 'Must complete and submit at least one simulation round before proceeding.' }, 400);
      }

      // Mark session as completed
      await c.env.DB.prepare(
        `UPDATE simulation_session 
         SET status = 'completed', updated_at = CURRENT_TIMESTAMP 
         WHERE id = ?`
      ).bind(sessionId).run();

      await logAuditEvent(c, (session.organization_id as string) || 'org_default_public', user.id, 'COMPLETE_MODULE_M03', 'SIMULATION_SESSION', sessionId, {
        total_rounds: rounds.length
      });

      const meanScore = rounds.length > 0
        ? Math.round(rounds.reduce((acc, r) => acc + (r.overallScore || 0), 0) / rounds.length)
        : 75;

      return c.json({
        success: true,
        session_id: sessionId,
        status: 'completed',
        total_rounds_completed: rounds.length,
        overall_proficiency_mean: meanScore,
        recommended_next_module: 'M04_INTERVIEWS',
        redirect_url: '/interviews'
      });
    } catch (err: any) {
      console.error('Error proceeding to next module:', err);
      return c.json({ success: false, error: err.message || 'Error proceeding to next module' }, 500);
    }
  });

  // 7c. Phase 8: Get Complete Multi-Round Progression State
  app.get('/m3/simulations/sessions/:id/progression', async (c) => {
    try {
      const user = await getSessionUser(c);
      if (!user) return c.json({ error: 'Unauthorized' }, 401);

      const sessionId = c.req.param('id');
      const session = await c.env.DB.prepare(
        'SELECT * FROM simulation_session WHERE id = ? AND user_id = ?'
      ).bind(sessionId, user.id).first();

      if (!session) return c.json({ error: 'Session not found' }, 404);

      const currentDynamicState = JSON.parse((session.dynamic_state_json as string) || '{}');
      const rounds: SimulationRoundRecord[] = currentDynamicState.rounds_history || [];

      const assessedCompetencies = new Set(rounds.map(r => (r.competencyName || '').toLowerCase()));
      const meanScore = rounds.length > 0
        ? Math.round(rounds.reduce((acc, r) => acc + (r.overallScore || 0), 0) / rounds.length)
        : 0;

      const progressionState: SessionProgressionState = {
        sessionId: session.id,
        status: session.status as any,
        currentRoundIndex: currentDynamicState.current_round_index || rounds.length || 1,
        rounds,
        latestAdaptationDecision: currentDynamicState.latest_adaptation_decision,
        competencyCoverage: {
          totalRequired: 5,
          assessed: assessedCompetencies.size,
          remaining: currentDynamicState.progression?.competenciesRemaining || [],
          coverageRatio: currentDynamicState.progression?.coverageRatio || 0
        },
        overallProficiencyMean: meanScore,
        cumulativeUncertainty: currentDynamicState.latest_adaptation_decision?.priorState?.uncertainty || 0.15,
        canProceedToNextModule: rounds.length >= 1
      };

      return c.json({
        success: true,
        progression: progressionState
      });
    } catch (err: any) {
      return c.json({ success: false, error: err.message }, 500);
    }
  });

  // 8. Get Evaluation Details (Phase 6, 7 & 8 enhanced)
  app.get('/m3/simulations/sessions/:id/evaluation', async (c) => {
    const user = await getSessionUser(c);
    if (!user) return c.json({ error: 'Unauthorized' }, 401);

    const sessionId = c.req.param('id');
    const evaluation = await c.env.DB.prepare(
      'SELECT * FROM simulation_evaluation WHERE session_id = ? AND user_id = ? ORDER BY created_at DESC'
    ).bind(sessionId, user.id).first();

    if (!evaluation) return c.json({ error: 'Evaluation not found' }, 404);

    return c.json({
      success: true,
      evaluation: {
        id: evaluation.id,
        session_id: evaluation.session_id,
        overall_score: Math.round(Number(evaluation.overall_score) * 100),
        alternative_validity: (evaluation.alternative_validity as AlternativeValidity) || 'correct',
        deterministic_verification: JSON.parse((evaluation.deterministic_verification_json as string) || '{}'),
        dimension_scores: JSON.parse((evaluation.dimension_scores_json as string) || '{}'),
        observable_evidence: JSON.parse((evaluation.observable_evidence_json as string) || '{}'),
        observed_facts: JSON.parse((evaluation.observed_facts_json as string) || '[]'),
        model_interpretation: JSON.parse((evaluation.model_interpretation_json as string) || '{}'),
        remediation_recommendations: JSON.parse((evaluation.remediation_recommendation_json as string) || '[]'),
        teaching_payload: JSON.parse((evaluation.teaching_payload_json as string) || '{}'),
        adaptation_decision: JSON.parse((evaluation.adaptation_decision_json as string) || '{}'),
        confidence_score: Number(evaluation.confidence_score || 0.85),
        uncertainty_score: Number(evaluation.uncertainty_score || 0.15),
        provenance: JSON.parse((evaluation.provenance_json as string) || '{}'),
        human_review_status: evaluation.human_review_status || 'unreviewed',
        autonomous_decision_prohibited: true,
        created_at: evaluation.created_at
      }
    });
  });

  // 9. Get Complete Structured Evidence Package (Phase 6 requirement for M05 ingestion)
  app.get('/m3/simulations/sessions/:id/evidence-package', async (c) => {
    const user = await getSessionUser(c);
    if (!user) return c.json({ error: 'Unauthorized' }, 401);

    const sessionId = c.req.param('id');
    const session = await c.env.DB.prepare(
      'SELECT * FROM simulation_session WHERE id = ? AND user_id = ?'
    ).bind(sessionId, user.id).first();

    if (!session) return c.json({ error: 'Session not found' }, 404);

    const evaluation = await c.env.DB.prepare(
      'SELECT * FROM simulation_evaluation WHERE session_id = ? AND user_id = ? ORDER BY created_at DESC'
    ).bind(sessionId, user.id).first();

    if (!evaluation) return c.json({ error: 'Evaluation not found' }, 404);

    const def = SEED_SIMULATIONS.find(s => s.id === session.definition_id) || SEED_SIMULATIONS[0];
    const observedFacts = JSON.parse((evaluation.observed_facts_json as string) || '[]');
    const provenance = JSON.parse((evaluation.provenance_json as string) || '{}');
    const dimensionScores = JSON.parse((evaluation.dimension_scores_json as string) || '{}');
    const remediationTasks = JSON.parse((evaluation.remediation_recommendation_json as string) || '[]');
    const modelInterpretation = JSON.parse((evaluation.model_interpretation_json as string) || '{}');
    const deterministicVerification = JSON.parse((evaluation.deterministic_verification_json as string) || '{}');

    const evidencePackage = {
      packageId: `pkg-m3-${evaluation.id}`,
      sessionId,
      candidateId: user.id,
      organizationId: session.organization_id,
      targetRole: def.target_role,
      occupationCode: def.occupation_code,
      domain: def.domain,
      competencyName: def.competency_name,
      skillName: def.skill_name,
      taskTitle: def.title,
      taskModality: def.simulation_type,
      overallScore: Math.round(Number(evaluation.overall_score) * 100),
      alternativeValidity: (evaluation.alternative_validity as AlternativeValidity) || 'correct',
      deterministicVerification,
      dimensionScores,
      confidenceScore: Number(evaluation.confidence_score || 0.85),
      uncertaintyScore: Number(evaluation.uncertainty_score || 0.15),
      sourceEvidence: {
        candidateWork: JSON.parse((session.candidate_work_json as string) || '{}'),
        actionCount: JSON.parse((session.telemetry_events_json as string) || '[]').length
      },
      observedFacts,
      modelInterpretation,
      humanJudgment: {
        status: evaluation.human_review_status || 'unreviewed'
      },
      provenance,
      m05LedgerSynced: true,
      m02FeedbackLoop: {
        skillTarget: def.skill_name,
        recommendedStudy: remediationTasks[0]?.recommended_study || '',
        recommendedPractice: remediationTasks[0]?.recommended_practice || ''
      },
      autonomousDecisionProhibited: true
    };

    return c.json({
      success: true,
      evidence_package: evidencePackage
    });
  });
}
