-- Seed simulation definitions
INSERT INTO simulation_definition (
  id, organization_id, title, occupation_code, target_role, domain, simulation_type,
  competency_name, skill_name, difficulty_level, scenario_json, dynamic_injection_json,
  expected_output_schema_json, rubric_json, is_active
) VALUES (
  'sim-tech-rate-limiter',
  'org_default_public',
  'Distributed Token Bucket Rate Limiter',
  '15-1252.00',
  'Senior Backend Engineer',
  'software',
  'coding',
  'System Architecture & Concurrency',
  'Distributed Systems & Concurrency',
  3,
  '{"background":"Your API gateway processes 50,000 requests/sec across 4 regional clusters. Third-party partner endpoints are experiencing brownouts.","objective":"Implement an in-memory sliding-window token bucket algorithm that prevents quota exhaustion while maintaining sub-millisecond overhead.","initial_requirements":["Enforce limit of max 100 requests per 60-second rolling window per client ID","Handle concurrent requests safely without race conditions","Return { allowed: boolean, remaining: number, reset_seconds: number }"],"constraints":["Memory overhead < 2KB per active client","Do not use blocking sleep calls","Must handle clock-skew drift up to 500ms"],"starting_data":{"template_code":"// Implement Sliding Window Rate Limiter\nclass TokenBucketRateLimiter {\n  private capacity: number;\n  private refillRatePerSec: number;\n  private buckets: Map<string, { tokens: number; lastRefill: number }>;\n\n  constructor(capacity = 100, refillRatePerSec = 1.66) {\n    this.capacity = capacity;\n    this.refillRatePerSec = refillRatePerSec;\n    this.buckets = new Map();\n  }\n\n  public checkRequest(clientId: string, nowMs = Date.now()): { allowed: boolean; remaining: number; reset_seconds: number } {\n    // TODO: Implement token calculation and rate check\n    return { allowed: true, remaining: this.capacity - 1, reset_seconds: 60 };\n  }\n}"},"tools_available":["TypeScript Code Editor","Test Case Runner","Memory Estimator"],"expected_output_type":"source_code"}',
  '{"trigger_step":2,"alert_title":"EMERGENCY CONSTRAINT SHIFT: Redis Cluster Partition","new_requirement":"A regional fiber cut has isolated Redis. You must implement a degraded local fallback mode that relaxes the limit by 20% rather than failing open or dropping 100% of traffic.","constraint_change":"Global synchronization unavailable; must operate on local replica timestamps.","rationale":"Tests graceful degradation and resilience under network partition ambiguity."}',
  '{"type":"source_code"}',
  '{"dimensions":[{"name":"correctness","weight":0.25,"description":"Accurate window enforcement","criteria":"Enforces 100 req/60s boundary accurately across edge cases."},{"name":"concurrency_handling","weight":0.2,"description":"Safe concurrent execution","criteria":"Prevents race conditions in token deduction and refill."},{"name":"process_and_validation","weight":0.2,"description":"Test coverage & edge verification","criteria":"Considers burst traffic, zero tokens, and clock drift."},{"name":"adaptability","weight":0.2,"description":"Handling injected Redis partition","criteria":"Correctly implements degraded local mode without crashing."},{"name":"code_quality","weight":0.15,"description":"Clean architecture & complexity","criteria":"O(1) lookup time with clear types and minimal memory footprint."}]}',
  1
) ON CONFLICT(id) DO UPDATE SET
  title = excluded.title,
  scenario_json = excluded.scenario_json,
  dynamic_injection_json = excluded.dynamic_injection_json,
  rubric_json = excluded.rubric_json;

INSERT INTO simulation_definition (
  id, organization_id, title, occupation_code, target_role, domain, simulation_type,
  competency_name, skill_name, difficulty_level, scenario_json, dynamic_injection_json,
  expected_output_schema_json, rubric_json, is_active
) VALUES (
  'sim-finance-capex-allocation',
  'org_default_public',
  'CapEx ROI & Capital Allocation Under Inflation',
  '13-2051.00',
  'Senior Financial Analyst',
  'finance',
  'financial_analysis',
  'Financial Planning & Valuation',
  'Capital Budgeting & Valuation',
  3,
  '{"background":"Apex Manufacturing has a $15M capital expenditure envelope for FY2027. Three division heads have submitted competing proposals.","objective":"Evaluate Projects Alpha (Automation, $8M), Beta (Supply Chain Hub, $6M), and Gamma (Green Energy Retrofit, $4M). Recommend the optimal capital allocation under an 8.5% weighted average cost of capital (WACC).","initial_requirements":["Calculate Net Present Value (NPV) and Internal Rate of Return (IRR) for each project","Determine optimal portfolio combination under the $15M constraint","Draft an executive justification memo recommending project selection and debt/equity financing ratio"],"constraints":["Total capital spend cannot exceed $15,000,000 in Year 0","Minimum required portfolio hurdle rate is 11.0%","Payback period must be <= 3.5 years for at least one chosen project"],"starting_data":{"projects":[{"name":"Project Alpha (Robotics)","capex":8000000,"cash_flows_y1_5":[2200000,2600000,3100000,3400000,3500000],"risk":"Medium"},{"name":"Project Beta (Regional Hub)","capex":6000000,"cash_flows_y1_5":[1600000,1900000,2200000,2400000,2500000],"risk":"Low"},{"name":"Project Gamma (Solar Array)","capex":4000000,"cash_flows_y1_5":[900000,1100000,1200000,1400000,1500000],"risk":"Low"}],"baseline_wacc":0.085},"tools_available":["DCF Calculator","Sensitivity Matrix","Financial Memo Drafting Workspace"],"expected_output_type":"financial_model_memo"}',
  '{"trigger_step":2,"alert_title":"MARKET SHIFT: Central Bank Rate Hike & Equipment Delay","new_requirement":"Central bank raises benchmark rates by 125 bps (WACC increases from 8.5% to 9.75%), and Project Alpha vendor reports 6-month delivery delay pushing Year 1 cash flow down 40%.","constraint_change":"Re-calculate NPV sensitivity and decide whether to drop Alpha or renegotiate vendor payment terms.","rationale":"Evaluates real-time financial resilience and risk-adjusted capital rationing."}',
  '{"type":"financial_model_memo"}',
  '{"dimensions":[{"name":"correctness","weight":0.25,"description":"Mathematical accuracy of DCF & NPV","criteria":"Accurate discount factor application and cash flow summation."},{"name":"decision_quality","weight":0.25,"description":"Risk-adjusted capital rationing","criteria":"Sound strategic allocation balancing risk, IRR, and payback."},{"name":"adaptability","weight":0.2,"description":"Response to rate hike & delay","criteria":"Accurately measures sensitivity and justifies pivot or retention."},{"name":"communication","weight":0.15,"description":"C-Suite memo clarity","criteria":"Concise executive memo with unambiguous recommendations."},{"name":"methodology","weight":0.15,"description":"Defensible financial assumptions","criteria":"Explicit documentation of reinvestment rate and terminal value assumptions."}]}',
  1
) ON CONFLICT(id) DO UPDATE SET
  title = excluded.title,
  scenario_json = excluded.scenario_json,
  dynamic_injection_json = excluded.dynamic_injection_json,
  rubric_json = excluded.rubric_json;

INSERT INTO simulation_definition (
  id, organization_id, title, occupation_code, target_role, domain, simulation_type,
  competency_name, skill_name, difficulty_level, scenario_json, dynamic_injection_json,
  expected_output_schema_json, rubric_json, is_active
) VALUES (
  'sim-ops-hospital-triage',
  'org_default_public',
  'Hospital Float Pool Staffing & Emergency Bed Triage',
  '11-9111.00',
  'Operations Director',
  'operations',
  'operational_triage',
  'Resource Optimization & Crisis Operations',
  'Resource Optimization',
  3,
  '{"background":"At 19:00 shift change, Metro General Emergency Department experiences an unexpected mass-transit collision incident while 4 night-shift nurses call in sick.","objective":"Allocate 6 float pool nurses and 8 open ICU/step-down beds among 12 incoming patients prioritized by emergency severity index (ESI), patient acuity, and nurse competency certifications.","initial_requirements":["Assign all ESI Level 1 and Level 2 critical patients immediately","Maintain regulatory nurse-to-patient safety ratios (ICU 1:2, Step-Down 1:3, Med-Surg 1:4)","Allocate mandatory rest breaks without leaving critical telemetry beds unmonitored"],"constraints":["Only certified ICU nurses (3 available) may manage intubated patients","Float pool overtime budget capped at 16 hours for the shift","Zero patient diversions permitted for pediatric trauma cases"],"starting_data":{"patient_queue":[{"id":"P-101","age":34,"acuity":"ESI-1","condition":"Multiple trauma, intubated","required_unit":"ICU"},{"id":"P-102","age":67,"acuity":"ESI-2","condition":"STEMI active chest pain","required_unit":"ICU"},{"id":"P-103","age":8,"acuity":"ESI-2","condition":"Pediatric blunt abdominal trauma","required_unit":"PICU/Step-Down"},{"id":"P-104","age":45,"acuity":"ESI-3","condition":"Compound femur fracture","required_unit":"Med-Surg"},{"id":"P-105","age":72,"acuity":"ESI-2","condition":"Acute respiratory distress","required_unit":"ICU"},{"id":"P-106","age":29,"acuity":"ESI-3","condition":"Laceration repair, stable vitals","required_unit":"Fast-Track"}],"available_staff":[{"name":"RN Sarah Chen","certs":["ICU","Trauma","Pediatric"],"max_hours":8},{"name":"RN Marcus Rivera","certs":["ICU","Cardiac"],"max_hours":8},{"name":"RN David Okafor","certs":["ICU"],"max_hours":8},{"name":"RN Elena Rostova","certs":["Med-Surg","Telemetry"],"max_hours":8},{"name":"RN Priya Patel","certs":["Med-Surg","Telemetry"],"max_hours":8},{"name":"RN James Wilson","certs":["Emergency","Triage"],"max_hours":8}]},"tools_available":["Triage Queue Board","Staff Competency Matrix","Bed Census Map"],"expected_output_type":"triage_allocation_plan"}',
  '{"trigger_step":2,"alert_title":"SUDDEN INFLUX: Secondary Hazmat Chemical Spill","new_requirement":"Three additional patients arrive with chemical burn exposure requiring immediate decontamination and isolation; 1 ICU nurse must oversee decontamination.","constraint_change":"Available ICU nursing capacity drops from 3 to 2 for 90 minutes. Must implement contingency patient holding protocols.","rationale":"Evaluates dynamic crisis triage, acuity prioritization, and regulatory safety adherence under sudden resource depletion."}',
  '{"type":"triage_allocation_plan"}',
  '{"dimensions":[{"name":"patient_safety","weight":0.3,"description":"Mandatory safety ratio adherence","criteria":"Never exceeds nurse-to-patient ratio or assigns unqualified staff to intubated beds."},{"name":"prioritization","weight":0.25,"description":"ESI acuity ranking","criteria":"ESI-1 and pediatric trauma receive first priority without delay."},{"name":"adaptability","weight":0.2,"description":"Hazmat contingency handling","criteria":"Re-allocates staff swiftly while isolating decontamination risks."},{"name":"process_and_governance","weight":0.15,"description":"Regulatory and break coverage","criteria":"Maintains compliant cross-coverage without patient abandonment."},{"name":"efficiency","weight":0.1,"description":"Overtime and resource utilization","criteria":"Stays within 16-hour overtime envelope where clinically safe."}]}',
  1
) ON CONFLICT(id) DO UPDATE SET
  title = excluded.title,
  scenario_json = excluded.scenario_json,
  dynamic_injection_json = excluded.dynamic_injection_json,
  rubric_json = excluded.rubric_json;

INSERT INTO simulation_definition (
  id, organization_id, title, occupation_code, target_role, domain, simulation_type,
  competency_name, skill_name, difficulty_level, scenario_json, dynamic_injection_json,
  expected_output_schema_json, rubric_json, is_active
) VALUES (
  'sim-data-pipeline-anomaly',
  'org_default_public',
  'Telemetry Pipeline Schema Drift & Anomaly Triage',
  '15-1254.00',
  'Data Engineer',
  'data',
  'data_analysis',
  'Data Engineering & Pipeline Reliability',
  'Data Engineering & Analytics',
  2,
  '{"background":"The customer event stream feeding real-time billing metrics began throwing 40% invalid payloads following a third-party mobile app SDK release.","objective":"Analyze the corrupted payload sample, write SQL/JSON transformations to sanitize the stream, isolate corrupted records in a dead-letter queue, and backfill the revenue metric.","initial_requirements":["Detect schema drift causing null user_id and timestamp type mismatch","Write transformation query to parse mixed ISO-8601 and Unix epoch timestamps","Ensure zero duplicate transaction IDs reach the billing aggregation table"],"constraints":["Processing throughput must support >= 10,000 records/sec","Cannot drop valid transactions; only malformed records go to dead-letter queue"],"starting_data":{"raw_events_sample":[{"event_id":"ev-01","user_id":"usr_882","amount_cents":1499,"timestamp":"2026-10-05T14:32:00Z","status":"valid"},{"event_id":"ev-02","user_id":null,"amount_cents":2999,"timestamp":1791208320,"status":"corrupted"},{"event_id":"ev-03","user_id":"usr_914","amount_cents":"499","timestamp":"2026-10-05T14:35:10Z","status":"schema_drift"},{"event_id":"ev-04","user_id":"usr_882","amount_cents":1499,"timestamp":"2026-10-05T14:32:00Z","status":"duplicate"}]},"tools_available":["SQL / Transformation Sandbox","Dead-Letter Stream Inspector","Data Table Viewer"],"expected_output_type":"data_transformation_script"}',
  '{"trigger_step":2,"alert_title":"SUDDEN UPSTREAM DRIFT: Currency Code Field Injected","new_requirement":"Mobile client begins sending non-USD transactions without warning. Amounts are now in mixed EUR/GBP/USD without currency conversion.","constraint_change":"Must reject or normalize non-USD currencies before aggregation.","rationale":"Evaluates defensive data modeling and handling unannounced upstream breaking changes."}',
  '{"type":"data_transformation_script"}',
  '{"dimensions":[{"name":"correctness","weight":0.3,"description":"Accurate transformation and de-duplication","criteria":"Cleans timestamps and eliminates duplicates."},{"name":"process","weight":0.25,"description":"Dead-letter segregation","criteria":"Preserves raw data in DLQ without losing audit provenance."},{"name":"adaptability","weight":0.25,"description":"Currency handling","criteria":"Gracefully identifies and handles multi-currency drift."},{"name":"code_quality","weight":0.2,"description":"Query performance and readability","criteria":"Uses set-based operations rather than row-by-row iteration."}]}',
  1
) ON CONFLICT(id) DO UPDATE SET
  title = excluded.title,
  scenario_json = excluded.scenario_json,
  dynamic_injection_json = excluded.dynamic_injection_json,
  rubric_json = excluded.rubric_json;

INSERT INTO simulation_definition (
  id, organization_id, title, occupation_code, target_role, domain, simulation_type,
  competency_name, skill_name, difficulty_level, scenario_json, dynamic_injection_json,
  expected_output_schema_json, rubric_json, is_active
) VALUES (
  'sim-legal-vendor-sla-memo',
  'org_default_public',
  'Enterprise Vendor SLA Breach Notice & Dispute Resolution',
  '13-1020.00',
  'Procurement & Operations Lead',
  'general',
  'written_response',
  'Vendor Governance & Contract Management',
  'Regulatory Compliance Audit',
  2,
  '{"background":"CloudCore Infrastructure suffered a 14-hour regional outage during peak Black Friday sales, violating the 99.95% monthly uptime agreement in Section 8.2 of the Master Services Agreement.","objective":"Draft a formal, legally grounded Breach Notice to the vendor demand letter citing specific contractual remedy provisions, calculating service credits, and mandating an audited Root Cause Analysis (RCA).","initial_requirements":["Calculate service credit entitlement based on 14 hours of continuous downtime","Cite contractual cure period (30 days) and audit rights","Maintain a collaborative yet unyielding tone that preserves the commercial relationship while protecting enterprise claims"],"constraints":["Do not prematurely threaten contract termination before the contractual 30-day cure window expires","Must request third-party SOC2 forensic audit report"],"starting_data":{"msa_extract":"Section 8.2: Service Level Guarantee. If monthly availability falls below 99.9%, Client is entitled to a 25% credit of monthly billing fees. If downtime exceeds 12 consecutive hours, credit increases to 50% of monthly fee ($125,000 baseline). Client must deliver written notice within 15 days of incident."},"tools_available":["Contract Clause Reference","Credit Calculation Worksheet","Executive Drafting Workspace"],"expected_output_type":"executive_memo"}',
  '{"trigger_step":2,"alert_title":"VENDOR COUNTER-CLAIM: Force Majeure Invoked","new_requirement":"Vendor legal counsel sends letter asserting the outage was caused by utility-grid substation explosion beyond their control, claiming complete Force Majeure relief under Section 14.","constraint_change":"Analyze Section 14 multi-site redundancy obligation to rebut the Force Majeure claim.","rationale":"Tests commercial acumen, contract interpretation, and executive dispute resolution."}',
  '{"type":"executive_memo"}',
  '{"dimensions":[{"name":"legal_accuracy","weight":0.3,"description":"Proper clause citation and credit math","criteria":"Accurately calculates $62,500 credit and cites Section 8.2."},{"name":"rebuttal_logic","weight":0.25,"description":"Force majeure counter-argument","criteria":"Points out vendor failed to failover to secondary geo-redundant site."},{"name":"tone_and_communication","weight":0.25,"description":"Professional assertiveness","criteria":"Rigorous legal firmness without emotional or inflammatory language."},{"name":"procedural_compliance","weight":0.2,"description":"Preserves rights without premature breach","criteria":"Respects 30-day cure timeline while locking in claims."}]}',
  1
) ON CONFLICT(id) DO UPDATE SET
  title = excluded.title,
  scenario_json = excluded.scenario_json,
  dynamic_injection_json = excluded.dynamic_injection_json,
  rubric_json = excluded.rubric_json;

