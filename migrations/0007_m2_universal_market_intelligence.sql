-- Migration 0007: M02 Universal Role-Specific Interview Intelligence & Market Benchmarks
-- Extends coverage across technical and non-technical occupations, seniorities, and provenance sources

-- 1. Alter interview_intelligence_item to support multi-occupation taxonomy and quality auditing
ALTER TABLE interview_intelligence_item ADD COLUMN occupation_id TEXT;
ALTER TABLE interview_intelligence_item ADD COLUMN seniority_level TEXT DEFAULT 'mid';
ALTER TABLE interview_intelligence_item ADD COLUMN competency_name TEXT;
ALTER TABLE interview_intelligence_item ADD COLUMN is_stale INTEGER DEFAULT 0;
ALTER TABLE interview_intelligence_item ADD COLUMN last_verified_at DATETIME;

-- 2. Add performance indices
CREATE INDEX IF NOT EXISTS idx_intel_item_role ON interview_intelligence_item(target_role, seniority_level);
CREATE INDEX IF NOT EXISTS idx_intel_item_domain ON interview_intelligence_item(domain, category);
CREATE INDEX IF NOT EXISTS idx_intel_item_type ON interview_intelligence_item(question_type);
CREATE INDEX IF NOT EXISTS idx_intel_item_occ ON interview_intelligence_item(occupation_id);

-- 3. Extend taxonomy_occupation with universal occupations
INSERT OR IGNORE INTO taxonomy_occupation (id, domain_id, name, code) VALUES
  ('occ_cyber_analyst', 'dom_it', 'Information Security Analyst', '15-1212'),
  ('occ_cloud_devops', 'dom_it', 'Cloud & DevOps Systems Engineer', '15-1299'),
  ('occ_ai_ml_eng', 'dom_it', 'AI & Machine Learning Engineer', '15-1299'),
  ('occ_biz_analyst', 'dom_business', 'Management & Business Analyst', '13-1111'),
  ('occ_accountant', 'dom_business', 'Accountant & Auditor', '13-2011'),
  ('occ_mfg_eng', 'dom_engineering', 'Manufacturing & Industrial Engineer', '17-2112'),
  ('occ_clin_research', 'dom_healthcare', 'Clinical Research Coordinator', '19-1042');

-- 4. Update existing AI/ML rows with seniority and occupation links
UPDATE interview_intelligence_item SET
  occupation_id = 'occ_ai_ml_eng',
  seniority_level = 'senior',
  competency_name = 'Context Engineering & Prompt Architecture',
  last_verified_at = CURRENT_TIMESTAMP
WHERE id = 'intel-aiml-01';

UPDATE interview_intelligence_item SET
  occupation_id = 'occ_ai_ml_eng',
  seniority_level = 'mid',
  competency_name = 'Model Validation & Temporal Split Design',
  last_verified_at = CURRENT_TIMESTAMP
WHERE id = 'intel-aiml-02';

UPDATE interview_intelligence_item SET
  occupation_id = 'occ_ai_ml_eng',
  seniority_level = 'mid',
  competency_name = 'Cross-Functional Technical Negotiation',
  last_verified_at = CURRENT_TIMESTAMP
WHERE id = 'intel-aiml-03';

UPDATE interview_intelligence_item SET
  occupation_id = 'occ_ai_ml_eng',
  seniority_level = 'senior',
  competency_name = 'Distributed Inference Architecture',
  last_verified_at = CURRENT_TIMESTAMP
WHERE id = 'intel-aiml-04';

UPDATE interview_intelligence_item SET
  occupation_id = 'occ_ai_ml_eng',
  seniority_level = 'entry',
  competency_name = 'Technical Metric Translation & Communication',
  last_verified_at = CURRENT_TIMESTAMP
WHERE id = 'intel-aiml-05';

-- 5. Seed Universal Market Intelligence Benchmarks across Occupations & Domains

-- ==============================================================================
-- DOMAIN: IT / SOFTWARE / CYBERSECURITY / CLOUD / DATA
-- ==============================================================================

INSERT OR REPLACE INTO interview_intelligence_item (
  id, target_role, domain, category, topic, question, question_type, difficulty_level,
  evaluation_rubric_json, sample_good_response, sample_pitfalls, hints_json,
  source_url, source_publisher, retrieved_at, company_context, provenance_type, confidence_score,
  occupation_id, seniority_level, competency_name, is_stale, last_verified_at
) VALUES (
  'intel-swe-01',
  'Software Developer',
  'dom_it',
  'public_source',
  'Distributed Caching & Cache-Aside Invalidation',
  'When implementing a cache-aside pattern with Redis in front of a relational database under heavy read traffic, how do you prevent cache stampede (thundering herd) when high-cardinality keys expire? Explain the trade-offs between mutex locking, probabilistic early expiration (XFetch), and background asynchronous warming.',
  'system_design',
  4,
  '[{"score":5,"criterion":"Exemplary","description":"Accurately explains probabilistic early expiration (XFetch algorithm with delta * beta * ln(rnd)) and mutex leases, calculating overhead and cache invalidation consistency trade-offs."},{"score":3,"criterion":"Proficient","description":"Proposes distributed locking or cache warming before key TTL expiry to protect the backing database from thundering herd."},{"score":1,"criterion":"Developing","description":"Suggests simply increasing cache TTL without addressing key expiry stampedes under concurrent loads."}]',
  'To prevent cache stampedes under high concurrency, we employ either distributed mutex locks (e.g. Redlock or single-instance lease keys) or probabilistic early expiration (XFetch). With probabilistic early expiration, worker processes computing reads evaluate if current_time - (delta * beta * ln(random())) > expiry. If true, a single worker proactively refreshes the cache in the background before hard expiry, eliminating database spikes without blocking concurrent reads.',
  'Recommending global cache locking that stalls all reader threads, or ignoring stale cache delivery during DB outages.',
  '["Consider how concurrent readers behave when a hot key hits TTL zero.","Evaluate probabilistic recomputation algorithms versus distributed locks."]',
  'https://github.com/donnemartin/system-design-primer',
  'System Design Primer & Scalable Architecture Knowledge Base',
  '2026-01-20 00:00:00',
  NULL,
  'public_open_source_curation',
  0.92,
  'occ_software_dev',
  'senior',
  'Distributed Systems & Caching Architecture',
  0,
  CURRENT_TIMESTAMP
);

INSERT OR REPLACE INTO interview_intelligence_item (
  id, target_role, domain, category, topic, question, question_type, difficulty_level,
  evaluation_rubric_json, sample_good_response, sample_pitfalls, hints_json,
  source_url, source_publisher, retrieved_at, company_context, provenance_type, confidence_score,
  occupation_id, seniority_level, competency_name, is_stale, last_verified_at
) VALUES (
  'intel-swe-02',
  'Software Developer',
  'dom_it',
  'public_source',
  'Algorithmic Complexity & Defensive Edge Handling',
  'Describe your approach to designing an algorithm that must process large streams of customer transaction logs. How do you balance memory efficiency (space complexity) against execution time (time complexity), and how do you write modular, easily testable unit checks for boundary cases (such as empty streams, duplicate timestamps, or corrupt records)?',
  'technical',
  2,
  '[{"score":5,"criterion":"Exemplary","description":"Articulates sliding window or streaming generator patterns keeping memory O(1), writes pure deterministic functions, and handles corrupt inputs with schema validation and test fixtures."},{"score":3,"criterion":"Proficient","description":"Explains Big-O time and space trade-offs clearly, proposing iterative processing instead of loading entire datasets into memory."},{"score":1,"criterion":"Developing","description":"Loads entire batch file in memory with O(N) space, fails to test edge cases or malformed rows."}]',
  'I approach stream processing using iterators and generator functions to maintain strict O(1) space complexity per record rather than buffering entire payloads. For boundary cases, I isolate pure transformation functions from I/O, writing parameterized unit tests that verify empty streams, out-of-order timestamps, and malformed payload fallback paths.',
  'Buffering massive payloads in memory; neglecting error isolation when parsing dirty stream data.',
  '["Focus on generator/streaming pipelines rather than in-memory buffering.","Discuss parameterized unit testing for corrupt or out-of-order records."]',
  'https://careers.google.com/how-we-hire/',
  'Google Careers Official Engineering Guidance',
  '2026-02-01 00:00:00',
  'Google SWE Interview Preparation Framework (General Practice)',
  'employer_published_portal',
  0.95,
  'occ_software_dev',
  'graduate',
  'Algorithmic Efficiency & Unit Test Design',
  0,
  CURRENT_TIMESTAMP
);

INSERT OR REPLACE INTO interview_intelligence_item (
  id, target_role, domain, category, topic, question, question_type, difficulty_level,
  evaluation_rubric_json, sample_good_response, sample_pitfalls, hints_json,
  source_url, source_publisher, retrieved_at, company_context, provenance_type, confidence_score,
  occupation_id, seniority_level, competency_name, is_stale, last_verified_at
) VALUES (
  'intel-devops-01',
  'Cloud & DevOps Systems Engineer',
  'dom_it',
  'public_source',
  'Kubernetes Ingress & Zero-Downtime Blue/Green Deployments',
  'In a multi-cluster Kubernetes environment hosting mission-critical microservices, how do you implement zero-downtime rolling updates? What specific pod disruption budgets (PDB), readiness/liveness probe timings, and connection-draining (preStop lifecycle hooks) configurations are necessary to avoid HTTP 502/504 errors during rollout?',
  'technical',
  4,
  '[{"score":5,"criterion":"Exemplary","description":"Specifies preStop sleep hook for kube-proxy iptables propagation, graceful SIGTERM termination window, readiness probes with initialDelaySeconds, and PDB maxUnavailable=1."},{"score":3,"criterion":"Proficient","description":"Identifies need for readiness probes and PodDisruptionBudgets to prevent draining too many pods simultaneously."},{"score":1,"criterion":"Developing","description":"Only mentions changing deployment replica counts without understanding pod termination lifecycle or endpoint deregistration latency."}]',
  'Zero-downtime deployments require orchestrating Kubernetes lifecycle events with network ingress. We configure preStop hooks with a sleep (e.g. 5-10s) so the pod ceases accepting new traffic while iptables/IPVS endpoints propagate across nodes. We tune terminationGracePeriodSeconds to allow inflight requests to complete, enforce a PodDisruptionBudget (minAvailable: 80%), and calibrate readiness probes so new pods only receive traffic after warming caches.',
  'Setting readiness probes identical to liveness probes, causing cascading pod restarts during initialization.',
  '["Think about what happens to in-flight TCP connections when a pod receives SIGTERM.","How does the ingress controller learn that a pod is terminating?"]',
  'https://kubernetes.io/docs/concepts/workloads/pods/pod-lifecycle/',
  'Kubernetes Official Architecture Documentation & CNCF Standards',
  '2026-01-15 00:00:00',
  NULL,
  'public_technical_standards',
  0.94,
  'occ_cloud_devops',
  'senior',
  'Container Orchestration & High Availability Networking',
  0,
  CURRENT_TIMESTAMP
);

INSERT OR REPLACE INTO interview_intelligence_item (
  id, target_role, domain, category, topic, question, question_type, difficulty_level,
  evaluation_rubric_json, sample_good_response, sample_pitfalls, hints_json,
  source_url, source_publisher, retrieved_at, company_context, provenance_type, confidence_score,
  occupation_id, seniority_level, competency_name, is_stale, last_verified_at
) VALUES (
  'intel-cyber-01',
  'Information Security Analyst',
  'dom_it',
  'public_source',
  'Security Incident Response & MITRE ATT&CK Triage',
  'Your SIEM generates high-severity alerts indicating suspicious PowerShell execution with encoded commands and unexpected outbound beaconing to an unfamiliar external IP address on an internal domain controller. Walk through your immediate incident triage process following the NIST SP 800-61 framework. How do you contain the threat without destroying volatile forensic memory?',
  'case_study',
  3,
  '[{"score":5,"criterion":"Exemplary","description":"Follows NIST triage sequence: host isolation via EDR without powering off, volatile RAM capture (dumpit/WinPmem), hash extraction, firewall egress block, and scoping via DNS/NetFlow."},{"score":3,"criterion":"Proficient","description":"Recommends network isolation, decoding the PowerShell script, and checking compromised credentials across active directory."},{"score":1,"criterion":"Developing","description":"Suggests rebooting the server or deleting the malicious file immediately, destroying forensic evidence."}]',
  'Following NIST SP 800-61, I first preserve volatile evidence by performing network-level containment via EDR endpoint isolation rather than pulling the power plug or rebooting. I capture memory dumps for volatile malware artifacts, extract the Base64-encoded command from PowerShell Script Block logs (Event ID 4104), submit the C2 destination IP to blocklists at the perimeter firewall, and initiate credential revocation for any impacted service accounts.',
  'Rebooting the host which destroys RAM forensics; communicating incident details over compromised email channels.',
  '["Remember the rule of volatile memory: never reboot or power off an active suspect host before triage.","Reference NIST SP 800-61 containment and eradication phases."]',
  'https://csrc.nist.gov/publications/detail/sp/800-61/rev-2/final',
  'NIST Computer Security Incident Handling Guide (SP 800-61 Rev. 2)',
  '2026-01-10 00:00:00',
  NULL,
  'government_technical_standard',
  0.96,
  'occ_cyber_analyst',
  'mid',
  'Incident Response & Digital Forensics',
  0,
  CURRENT_TIMESTAMP
);

INSERT OR REPLACE INTO interview_intelligence_item (
  id, target_role, domain, category, topic, question, question_type, difficulty_level,
  evaluation_rubric_json, sample_good_response, sample_pitfalls, hints_json,
  source_url, source_publisher, retrieved_at, company_context, provenance_type, confidence_score,
  occupation_id, seniority_level, competency_name, is_stale, last_verified_at
) VALUES (
  'intel-data-01',
  'Data Scientist',
  'dom_it',
  'public_source',
  'A/B Testing Power Analysis & Sample Ratio Mismatch (SRM)',
  'You are evaluating an online experiment where conversion rate improved by 4.2% (p = 0.01), but the traffic split between variant and control is 49.1% vs 50.9% on an intended 50/50 allocation with 200,000 total visitors. Can you launch this feature? Explain how you diagnose Sample Ratio Mismatch (SRM) and why proceeding without investigation risks severe false positives.',
  'technical',
  3,
  '[{"score":5,"criterion":"Exemplary","description":"Performs Chi-Square goodness-of-fit test on sample allocations, identifies SRM as a critical data integrity violation, and halts rollout until bucket assignment bias or redirect latency is resolved."},{"score":3,"criterion":"Proficient","description":"Notes that the sample split deviation is statistically significant despite looking small, recommending looking into tracking bugs before shipping."},{"score":1,"criterion":"Developing","description":"Argues that a 0.9% allocation difference is negligible and recommends launching based on the 4.2% lift."}]',
  'I would halt rollout immediately. With 200,000 observations, a 49.1% to 50.9% split yields a Chi-Square test p-value far below 0.001, indicating an unmistakable Sample Ratio Mismatch (SRM). SRM signifies that the experiment is fundamentally compromised—either due to bot filtering discrepancies, redirect latency driving variant drop-offs, or telemetry caching. The observed 4.2% lift is likely a selection artifact rather than true treatment effect.',
  'Dismissing the split discrepancy as insignificant; failing to calculate Chi-Square goodness-of-fit on assignment counts.',
  '["Calculate the Chi-Square statistic on the sample proportions with N=200,000.","Why does non-random traffic loss distort conversion measurements?"]',
  'https://scikit-learn.org/stable/modules/cross_validation.html',
  'Scikit-Learn Statistical Validation & Experimental Design Standards',
  '2026-01-25 00:00:00',
  NULL,
  'public_open_source_curation',
  0.93,
  'occ_data_sci',
  'mid',
  'Experimentation Design & Statistical Inference',
  0,
  CURRENT_TIMESTAMP
);

-- ==============================================================================
-- DOMAIN: ENGINEERING & ARCHITECTURE
-- ==============================================================================

INSERT OR REPLACE INTO interview_intelligence_item (
  id, target_role, domain, category, topic, question, question_type, difficulty_level,
  evaluation_rubric_json, sample_good_response, sample_pitfalls, hints_json,
  source_url, source_publisher, retrieved_at, company_context, provenance_type, confidence_score,
  occupation_id, seniority_level, competency_name, is_stale, last_verified_at
) VALUES (
  'intel-mech-01',
  'Mechanical Engineer',
  'dom_engineering',
  'public_source',
  'Finite Element Analysis (FEA) Stress Singularities & GD&T Datum Selection',
  'In designing a structural aluminum mounting bracket subjected to cyclical vibrational loads, your FEA simulation displays an extreme von Mises stress spike at a sharp interior re-entrant corner. How do you distinguish between a physical stress concentration and a mathematical stress singularity in FEA? What mesh refinement techniques and GD&T datum selection would you specify to ensure fatigue life?',
  'technical',
  3,
  '[{"score":5,"criterion":"Exemplary","description":"Explains that singular stresses increase without bound as mesh size h approaches zero, applies fillet geometry, computes stress concentration factor Kt, and defines datums based on physical functional interfaces per ASME Y14.5."},{"score":3,"criterion":"Proficient","description":"Recommends adding a fillet radius and refining the local mesh (h-refinement) to verify if stress converges."},{"score":1,"criterion":"Developing","description":"Takes the raw peak stress at a sharp corner as real material failure without testing mesh convergence."}]',
  'To distinguish between a physical stress concentration and a numerical singularity, I perform mesh convergence analysis: if peak stress monotonically diverges as element size decreases toward zero at a sharp re-entrant corner, it is a mathematical singularity caused by linear elastic theory assumptions. I model a realistic internal fillet radius, compute the theoretical stress concentration factor (Kt), and confirm convergence. For GD&T under ASME Y14.5, I anchor primary datums to the primary mounting mating surface to constrain physical degrees of freedom.',
  'Confusing a mesh singularity with true yield stress; failing to specify fillet radii on internal edges.',
  '["Check what happens to stress values as mesh elements become infinitesimally small at a zero-radius vertex.","Reference ASME Y14.5 datum reference frame principles."]',
  'https://www.asme.org/codes-standards/find-codes-standards/y14-5-dimensioning-tolerancing',
  'ASME Standards & NASA Systems Engineering Handbook',
  '2026-01-18 00:00:00',
  NULL,
  'professional_association_standard',
  0.95,
  'occ_mech_eng',
  'mid',
  'Structural Mechanics, FEA & Geometric Tolerancing',
  0,
  CURRENT_TIMESTAMP
);

INSERT OR REPLACE INTO interview_intelligence_item (
  id, target_role, domain, category, topic, question, question_type, difficulty_level,
  evaluation_rubric_json, sample_good_response, sample_pitfalls, hints_json,
  source_url, source_publisher, retrieved_at, company_context, provenance_type, confidence_score,
  occupation_id, seniority_level, competency_name, is_stale, last_verified_at
) VALUES (
  'intel-civil-01',
  'Civil Engineer',
  'dom_engineering',
  'public_source',
  'Seismic Lateral Force Resisting Systems & Soil-Structure Interaction',
  'When designing a multi-story reinforced concrete frame structure situated on soft alluvial soil (Site Class E per ASCE 7), how do you account for soil amplification and seismic base shear? How do you prevent a soft-story collapse mechanism through ductile detailing and stiffness distribution?',
  'technical',
  4,
  '[{"score":5,"criterion":"Exemplary","description":"Applies site coefficient amplification (Fa, Fv), calculates fundamental period T, uses equivalent lateral force or modal response spectrum analysis, and enforces strong-column/weak-beam capacity design per ACI 318."},{"score":3,"criterion":"Proficient","description":"Discusses increased soil acceleration for soft soils and the need for continuous shear walls or ductile framing to avoid soft-story stiffness jumps."},{"score":1,"criterion":"Developing","description":"Calculates static gravity loads without adjusting spectral response coefficients for soil class or considering story drift limits."}]',
  'Site Class E requires applying elevated soil amplification coefficients (Fa and Fv) to short-period and 1-second spectral accelerations, substantially increasing design spectral response and seismic base shear. To prevent a catastrophic soft-story mechanism, I follow ACI 318 capacity design philosophy: ensuring strong-column/weak-beam behavior so plastic hinges form in flexural beam ends rather than column bases. I verify interstory drift limits under ASCE 7 and provide continuous seismic shear walls to prevent abrupt lateral stiffness discontinuities.',
  'Neglecting site amplification factors on soft soils; allowing stiffness drops between adjacent vertical stories.',
  '["Consider how seismic waves slow down and amplify in soft cohesive soils.","Recall capacity design principles: where do you want plastic hinges to form first?"]',
  'https://www.asce.org/publications-and-news/civil-engineering-source/article/2022/01/asce-7-22-standard-available',
  'American Society of Civil Engineers (ASCE 7) Minimum Design Standards',
  '2026-01-12 00:00:00',
  NULL,
  'professional_association_standard',
  0.94,
  'occ_civil_eng',
  'senior',
  'Structural Dynamics & Seismic Design Standards',
  0,
  CURRENT_TIMESTAMP
);

INSERT OR REPLACE INTO interview_intelligence_item (
  id, target_role, domain, category, topic, question, question_type, difficulty_level,
  evaluation_rubric_json, sample_good_response, sample_pitfalls, hints_json,
  source_url, source_publisher, retrieved_at, company_context, provenance_type, confidence_score,
  occupation_id, seniority_level, competency_name, is_stale, last_verified_at
) VALUES (
  'intel-mfg-01',
  'Manufacturing & Industrial Engineer',
  'dom_engineering',
  'public_source',
  'Design for Manufacturability (DFM) & Statistical Process Control (SPC)',
  'A high-precision CNC turned shaft on your automated assembly line exhibits an out-of-spec Process Capability Index (Cpk = 0.85, target >= 1.33) with a normal distribution centered slightly above the nominal dimension. Describe how you apply DMAIC and Statistical Process Control (SPC) to isolate tool wear versus thermal expansion, and how you adjust tolerances for manufacturability.',
  'case_study',
  3,
  '[{"score":5,"criterion":"Exemplary","description":"Distinguishes Cp (potential capability) from Cpk (centering), monitors X-bar and R charts for systematic drift vs sudden variance, checks machine coolant temperature stabilization, and implements tool offset compensation."},{"score":3,"criterion":"Proficient","description":"Identifies that Cpk below 1.0 means defect generation, reviews control charts for trends, and examines tooling condition."},{"score":1,"criterion":"Developing","description":"Suggests widening part engineering tolerances without investigating root-cause machine variation."}]',
  'A Cpk of 0.85 indicates that the process is currently producing out-of-spec scrap. Because the distribution is centered above nominal, I first separate centering from spread by calculating Cp versus Cpk. If Cp is adequate (>1.33) but Cpk is low, the process spread is fine and the issue is offset centering. I analyze X-bar and R control charts: a continuous upward slope across consecutive subgroups signifies gradual tool wear or thermal warmup drift. I establish automated tool offset adjustments and regulate coolant thermal stability before reviewing tolerance revisions.',
  'Widening tolerance bands as a first resort instead of investigating process capability; ignoring control chart drift trends.',
  '["Recall that Cpk = min((USL - mean)/(3*sigma), (mean - LSL)/(3*sigma)).","How does tool wear appear differently from machine vibration on an X-bar chart?"]',
  'https://www.sme.org/technologies/articles/2021/october/fundamentals-of-statistical-process-control/',
  'Society of Manufacturing Engineers (SME) Manufacturing Knowledge Series',
  '2026-01-22 00:00:00',
  NULL,
  'industry_body_guidelines',
  0.92,
  'occ_mfg_eng',
  'mid',
  'Quality Engineering, SPC & Process Capability',
  0,
  CURRENT_TIMESTAMP
);

-- ==============================================================================
-- DOMAIN: BUSINESS & FINANCIAL OPERATIONS
-- ==============================================================================

INSERT OR REPLACE INTO interview_intelligence_item (
  id, target_role, domain, category, topic, question, question_type, difficulty_level,
  evaluation_rubric_json, sample_good_response, sample_pitfalls, hints_json,
  source_url, source_publisher, retrieved_at, company_context, provenance_type, confidence_score,
  occupation_id, seniority_level, competency_name, is_stale, last_verified_at
) VALUES (
  'intel-fin-01',
  'Financial Analyst',
  'dom_business',
  'public_source',
  'Discounted Cash Flow (DCF) Modeling & Sensitivity Analysis',
  'When building an intrinsic valuation DCF model for an enterprise with volatile operating cash flows, how do you determine the appropriate Weighted Average Cost of Capital (WACC)? How do you calculate Unlevered Free Cash Flow (FCFF) from EBITDA, and what variables do you test in a two-way sensitivity matrix to evaluate terminal value risk?',
  'case_study',
  2,
  '[{"score":5,"criterion":"Exemplary","description":"Correctly derives FCFF = EBITDA - D&A - Taxes + D&A - Capex - Change in NWC, details CAPM cost of equity levering/unlevering Beta, and pairs WACC against Terminal Growth Rate (or Exit Multiple) in sensitivity analysis."},{"score":3,"criterion":"Proficient","description":"Explains Unlevered Free Cash Flow components and sets up sensitivity tables showing how cost of capital impacts valuation."},{"score":1,"criterion":"Developing","description":"Confuses levered and unlevered cash flows, uses Net Income directly without adjusting for working capital or Capex."}]',
  'To derive Unlevered Free Cash Flow (FCFF), I start with Operating Income (EBIT) * (1 - Tax Rate) + D&A - Capital Expenditures - Increase in Non-Cash Net Working Capital. For WACC, I calculate Cost of Equity via CAPM using an unlevered peer Beta relevered for target capital structure, blended with after-tax Cost of Debt. Because terminal value often represents 60-80% of total enterprise value, I construct a two-way sensitivity matrix testing WACC (step +/- 50 bps) against the Perpetual Growth Rate (g, step +/- 25 bps) to bracket reasonable valuation ranges.',
  'Deducting interest expenses in an unlevered cash flow calculation; using arbitrary terminal growth rates that exceed GDP growth.',
  '["Remember that Unlevered Free Cash Flow belongs to all capital providers, so interest is not deducted.","What happens to terminal value if growth rate approaches WACC?"]',
  'https://corporatefinanceinstitute.com/resources/valuation/discounted-cash-flow-dcf/',
  'Corporate Finance Institute (CFI) Valuation Frameworks',
  '2026-01-14 00:00:00',
  NULL,
  'professional_finance_institute',
  0.96,
  'occ_fin_analyst',
  'graduate',
  'Corporate Valuation & Financial Modeling',
  0,
  CURRENT_TIMESTAMP
);

INSERT OR REPLACE INTO interview_intelligence_item (
  id, target_role, domain, category, topic, question, question_type, difficulty_level,
  evaluation_rubric_json, sample_good_response, sample_pitfalls, hints_json,
  source_url, source_publisher, retrieved_at, company_context, provenance_type, confidence_score,
  occupation_id, seniority_level, competency_name, is_stale, last_verified_at
) VALUES (
  'intel-acct-01',
  'Accountant & Auditor',
  'dom_business',
  'public_source',
  'Revenue Recognition Under ASC 606 & Material Weakness Evaluation',
  'Under the 5-step model of ASC 606 (Revenue from Contracts with Customers), how do you evaluate whether multi-element software contracts containing software licenses, ongoing cloud hosting, and implementation consulting represent distinct performance obligations? If an audit reveals $2.5M in recognized revenue was not transfer-of-control compliant, how do you assess whether this constitutes a material weakness in internal controls?',
  'technical',
  3,
  '[{"score":5,"criterion":"Exemplary","description":"Applies ASC 606 criteria (capable of being distinct + distinct within context of contract), details standalone selling price allocation, and assesses material weakness under PCAOB AS 2201 based on magnitude and control design failure."},{"score":3,"criterion":"Proficient","description":"Outlines the 5 steps of ASC 606 and identifies that improper revenue recognition indicates significant deficiency or material weakness."},{"score":1,"criterion":"Developing","description":"Treats all bundled services as a single lump-sum without evaluating distinct obligations or internal control risk."}]',
  'Under ASC 606 Step 2, a good or service is distinct if: 1) the customer can benefit from it on its own (capable of being distinct), and 2) the promise to transfer it is separately identifiable from other contract promises. If custom implementation significantly modifies the software, they form a combined bundle; otherwise, license and services are distinct performance obligations with transaction price allocated via standalone selling prices (Step 4). A $2.5M misstatement indicates a control breakdown; under PCAOB AS 2201, if there is a reasonable possibility that controls failed to prevent a material misstatement, it is classified as a material weakness requiring remediation and audit committee disclosure.',
  'Relying on invoice billing dates rather than transfer of control; downplaying material control deficiencies as minor clerical errors.',
  '["Review the 5 steps of ASC 606: Identify contract, obligations, price, allocate, recognize.","What distinguishes a control deficiency from a material weakness?"]',
  'https://www.fasb.org/page/PageContent?pageId=/standards/accounting-standards-updates.html',
  'Financial Accounting Standards Board (FASB ASC 606) & AICPA Guidelines',
  '2026-01-16 00:00:00',
  NULL,
  'regulatory_accounting_board',
  0.97,
  'occ_accountant',
  'mid',
  'Financial Reporting Standards & Internal Control Audit',
  0,
  CURRENT_TIMESTAMP
);

INSERT OR REPLACE INTO interview_intelligence_item (
  id, target_role, domain, category, topic, question, question_type, difficulty_level,
  evaluation_rubric_json, sample_good_response, sample_pitfalls, hints_json,
  source_url, source_publisher, retrieved_at, company_context, provenance_type, confidence_score,
  occupation_id, seniority_level, competency_name, is_stale, last_verified_at
) VALUES (
  'intel-biz-01',
  'Management & Business Analyst',
  'dom_business',
  'public_source',
  'Business Process Modeling (BPMN), Gap Analysis & Acceptance Criteria',
  'You are tasked with redesigning a legacy loan origination workflow that suffers from a 38% customer drop-off during document verification. Walk through how you conduct stakeholder interviews, map the current state (As-Is) versus future state (To-Be) in BPMN, and write unambiguous Given-When-Then acceptance criteria for automated verification integrations.',
  'case_study',
  3,
  '[{"score":5,"criterion":"Exemplary","description":"Maps As-Is pain points using swimlane BPMN, identifies bottlenecks via cycle time analysis, specifies automated OCR/API validation, and writes rigorous Gherkin criteria with edge conditions."},{"score":3,"criterion":"Proficient","description":"Describes mapping current vs proposed workflows and drafting functional requirements for development teams."},{"score":1,"criterion":"Developing","description":"Proposes broad UI redesign without mapping backend process bottlenecks or defining verifiable acceptance criteria."}]',
  'I start by analyzing funnel analytics to isolate where the 38% drop-off occurs. I map the As-Is workflow in BPMN swimlanes across Customer, Loan Officer, and Underwriting to pinpoint manual wait states. For the To-Be state, I eliminate redundant manual reviews by integrating automated document OCR and identity API checks. I define requirements using Gherkin syntax: Given an applicant submits a valid government ID in JPEG/PDF format, When the OCR confidence exceeds 95% and facial match passes, Then the application state advances to pre-approved within 120 seconds.',
  'Assuming customer drop-off is purely cosmetic without analyzing system cycle time; writing vague requirements without testable boundaries.',
  '["Use swimlane diagrams to clearly separate human tasks from automated API events.","Format acceptance criteria using Given/When/Then to eliminate ambiguity."]',
  'https://www.iiba.org/career-resources/a-guide-to-the-business-analysis-body-of-knowledge-babok-guide/',
  'International Institute of Business Analysis (IIBA BABOK Guide)',
  '2026-01-24 00:00:00',
  NULL,
  'professional_association_standard',
  0.94,
  'occ_biz_analyst',
  'mid',
  'Process Engineering, Requirements Architecture & BPMN',
  0,
  CURRENT_TIMESTAMP
);

-- ==============================================================================
-- DOMAIN: MANAGEMENT & PRODUCT LEADERSHIP
-- ==============================================================================

INSERT OR REPLACE INTO interview_intelligence_item (
  id, target_role, domain, category, topic, question, question_type, difficulty_level,
  evaluation_rubric_json, sample_good_response, sample_pitfalls, hints_json,
  source_url, source_publisher, retrieved_at, company_context, provenance_type, confidence_score,
  occupation_id, seniority_level, competency_name, is_stale, last_verified_at
) VALUES (
  'intel-pm-01',
  'Product Manager',
  'dom_management',
  'public_source',
  'Product Discovery, Feature Prioritization Frameworks & North Star Metrics',
  'You lead product for a B2B SaaS platform where enterprise sales demands custom bespoke integrations to close a $1.2M contract, while the core engineering team is advocating a 2-month tech-debt refactor to stabilize latency. How do you evaluate and prioritize this conflict? What framework (e.g. RICE, Kano) and outcome metrics do you use to communicate the trade-off to executive leadership?',
  'case_study',
  4,
  '[{"score":5,"criterion":"Exemplary","description":"Evaluates opportunity cost, scores using RICE adjusted for engineering risk, explores extensible webhook architecture instead of one-off custom code, and aligns decisions to Net Revenue Retention (NRR)."},{"score":3,"criterion":"Proficient","description":"Balances immediate sales revenue against long-term reliability using structured scoring and clear stakeholder negotiation."},{"score":1,"criterion":"Developing","description":"Immediately caves to the sales demand without evaluating tech debt impact, or rejects sales outright without alternative compromise."}]',
  'I treat this as an architectural opportunity rather than a zero-sum conflict. I evaluate the custom integration through the RICE framework: if this custom request reflects a recurring market need, we can build a standardized public API or webhook framework that serves both the prospective $1.2M enterprise and future pipeline, rather than writing throwaway custom code. For technical debt, I quantify the cost of inaction—showing how latency spikes directly threaten our existing $15M ARR and churn SLA penalties. I propose a phased sprint allocation (e.g. 60% core platform/debt, 40% integration framework).',
  'Committing to bespoke throwaway code that paralyzes future roadmap velocity; ignoring executive revenue objectives.',
  '["Look for the third way: can the custom requirement be generalized into a platform capability?","Quantify the cost of technical debt in terms of churn and latency SLAs."]',
  'https://www.mindtheproduct.com/how-to-prioritise-product-features/',
  'Mind the Product & Pragmatic Institute Product Leadership Guides',
  '2026-01-28 00:00:00',
  NULL,
  'industry_publication_resource',
  0.93,
  'occ_product_mgr',
  'senior',
  'Product Strategy, Roadmap Trade-offs & Value Metrics',
  0,
  CURRENT_TIMESTAMP
);

INSERT OR REPLACE INTO interview_intelligence_item (
  id, target_role, domain, category, topic, question, question_type, difficulty_level,
  evaluation_rubric_json, sample_good_response, sample_pitfalls, hints_json,
  source_url, source_publisher, retrieved_at, company_context, provenance_type, confidence_score,
  occupation_id, seniority_level, competency_name, is_stale, last_verified_at
) VALUES (
  'intel-lead-01',
  'Product Manager',
  'dom_management',
  'public_source',
  'Behavioral STAR: Disagree and Commit & Cross-Functional Alignment',
  'Tell me about a time when you strongly disagreed with a strategic or technical direction championed by your manager or senior leadership. How did you formulate your counter-arguments using data, how did you handle the debate respectfully, and what did you do once a final executive decision was reached that contradicted your recommendation?',
  'behavioral_star',
  4,
  '[{"score":5,"criterion":"Exemplary","description":"Uses STAR structure, presents objective empirical counter-evidence without personal bias, debates vigorously with professional backbone, and completely commits to the team decision without passive-aggressive undermining."},{"score":3,"criterion":"Proficient","description":"Describes respectful professional pushback supported by facts, and follows through with project execution once decided."},{"score":1,"criterion":"Developing","description":"Adopts either passive compliance without voicing concerns, or continues to complain and undermine the initiative after the decision is finalized."}]',
  'In my previous role, leadership decided to sunset our standalone desktop client in favor of an unproven web app on an accelerated 6-week timeline. (Situation/Task). Believing the timeline risked catastrophic churn among power users requiring offline mode, I gathered telemetry showing 34% of active revenue depended on offline caching. I presented a risk analysis proposing a hybrid rollout (Action). Leadership heard my points but decided to proceed with the web-only migration to unify codebase costs. Once the decision was finalized, I fully committed: I helped draft migration FAQs, coordinated user onboarding, and focused our squad on optimizing web caching (Result).',
  'Claiming you never disagree with superiors; or showing lingering resentment after a decision is made.',
  '["Amazon Leadership Principle: Have Backbone; Disagree and Commit.","Show how you used objective metrics rather than emotional arguments."]',
  'https://www.amazon.jobs/content/en/how-we-hire/interviewing-at-amazon',
  'Amazon Jobs Official Hiring Portal & Leadership Principles Guide',
  '2026-02-05 00:00:00',
  'Amazon Leadership Principles Behavioral Guidance (General Practice)',
  'employer_published_portal',
  0.96,
  'occ_product_mgr',
  'senior',
  'Executive Communication, Stakeholder Alignment & Ownership',
  0,
  CURRENT_TIMESTAMP
);

-- ==============================================================================
-- DOMAIN: HEALTHCARE PRACTITIONERS & CLINICAL RESEARCH
-- ==============================================================================

INSERT OR REPLACE INTO interview_intelligence_item (
  id, target_role, domain, category, topic, question, question_type, difficulty_level,
  evaluation_rubric_json, sample_good_response, sample_pitfalls, hints_json,
  source_url, source_publisher, retrieved_at, company_context, provenance_type, confidence_score,
  occupation_id, seniority_level, competency_name, is_stale, last_verified_at
) VALUES (
  'intel-nurse-01',
  'Registered Nurse',
  'dom_healthcare',
  'public_source',
  'Clinical Deterioration Triage & Structured SBAR Escalation',
  'A postoperative abdominal surgery patient on your floor becomes increasingly restless, with vital signs showing tachycardia (heart rate 128 bpm), hypotension (blood pressure 86/52 mmHg), and cool, clammy extremities with decreased urine output (15 mL/hr). Describe your immediate clinical interventions and how you communicate an urgent escalation to the attending surgeon using the SBAR (Situation, Background, Assessment, Recommendation) framework.',
  'case_study',
  2,
  '[{"score":5,"criterion":"Exemplary","description":"Identifies early septic or hypovolemic shock, initiates ABC vitals monitoring, places patient supine, prepares IV fluid bolus, and executes verbatim SBAR escalation with clear clinical recommendations."},{"score":3,"criterion":"Proficient","description":"Recognizes acute hemodynamic instability, alerts rapid response/physician, and provides structured patient history."},{"score":1,"criterion":"Developing","description":"Delays escalation to re-check vitals in an hour or fails to formulate a concrete clinical recommendation."}]',
  'This patient presents acute hemodynamic compromise consistent with hypovolemic or septic shock. My immediate actions are: elevate legs/place supine, check surgical site for active hemorrhage, ensure patent IV access, administer high-flow oxygen, and immediately call the attending surgeon using SBAR: Situation: Mr. Jones in room 412 is exhibiting acute signs of shock with BP 86/52 and HR 128. Background: He is post-op day 1 from an open hemicolectomy. Assessment: I suspect occult internal bleeding or rapid hypovolemia given low urine output of 15 mL/hr and cold clammy skin. Recommendation: I request an immediate bedside evaluation and orders for a 1-liter IV crystalloid bolus and a STAT CBC and coagulation panel.',
  'Waiting for the next scheduled vital sign check; calling the physician without vital signs or concrete recommendations.',
  '["Structure your communication strictly into SBAR: Situation, Background, Assessment, Recommendation.","Identify the underlying shock pathophysiology from the vitals."]',
  'https://www.ihi.org/resources/tools/sbar-tool-situation-background-assessment-recommendation',
  'Institute for Healthcare Improvement (IHI) Clinical Communication Standards',
  '2026-01-19 00:00:00',
  NULL,
  'healthcare_quality_standard',
  0.98,
  'occ_nurse',
  'entry',
  'Clinical Triage, Patient Safety & SBAR Communication',
  0,
  CURRENT_TIMESTAMP
);

INSERT OR REPLACE INTO interview_intelligence_item (
  id, target_role, domain, category, topic, question, question_type, difficulty_level,
  evaluation_rubric_json, sample_good_response, sample_pitfalls, hints_json,
  source_url, source_publisher, retrieved_at, company_context, provenance_type, confidence_score,
  occupation_id, seniority_level, competency_name, is_stale, last_verified_at
) VALUES (
  'intel-nurse-02',
  'Registered Nurse',
  'dom_healthcare',
  'public_source',
  'Medication Safety, High-Alert Double Checks & Patient Advocacy',
  'During a hectic night shift with an emergency admission, you receive a verbal order from a fatigued resident for IV potassium chloride push to correct a serum potassium of 2.9 mEq/L. How do you respond to this order in accordance with Joint Commission safety standards and the American Nurses Association (ANA) Code of Ethics? How do you advocate for patient safety without creating hostile interpersonal conflict?',
  'situational_judgment',
  3,
  '[{"score":5,"criterion":"Exemplary","description":"Immediately refuses IV push potassium (which is fatal), explains it must ONLY be administered via diluted controlled IV infusion pump, follows closed-loop communication, and escalates to nursing supervisor/pharmacy if pushed."},{"score":3,"criterion":"Proficient","description":"Identifies that IV push potassium is a lethal medication error and professionally refuses the order, requesting an infusion order instead."},{"score":1,"criterion":"Developing","description":"Prepares to administer the push or hesitates to question the resident out of fear of authority."}]',
  'IV push potassium chloride is a known fatal lethal medication error; concentrated potassium must NEVER be administered via direct push, only via controlled slow IV infusion (maximum 10-20 mEq/hr with cardiac telemetry monitoring). I respond calmly and immediately: Dr. Smith, IV potassium cannot be given as a bolus or direct push per Joint Commission high-alert medication standards as it causes fatal cardiac arrest. Let us order 20 mEq diluted in 100 mL saline on an infusion pump over two hours, and I will place the patient on continuous telemetry monitoring. If there is any resistance, I immediately involve the clinical pharmacist and charge nurse.',
  'Administering any high-alert medication without independent verification; failing to advocate for patient life out of hierarchy fear.',
  '["High-alert medication rule: Potassium Chloride (KCl) is NEVER given IV push.","Use professional assertion focused on patient safety and Joint Commission standards."]',
  'https://www.jointcommission.org/standards/',
  'The Joint Commission National Patient Safety Goals & ANA Nursing Code',
  '2026-01-26 00:00:00',
  NULL,
  'healthcare_quality_standard',
  0.98,
  'occ_nurse',
  'senior',
  'Medication Safety, Ethical Standards & Patient Advocacy',
  0,
  CURRENT_TIMESTAMP
);

INSERT OR REPLACE INTO interview_intelligence_item (
  id, target_role, domain, category, topic, question, question_type, difficulty_level,
  evaluation_rubric_json, sample_good_response, sample_pitfalls, hints_json,
  source_url, source_publisher, retrieved_at, company_context, provenance_type, confidence_score,
  occupation_id, seniority_level, competency_name, is_stale, last_verified_at
) VALUES (
  'intel-clin-01',
  'Clinical Research Coordinator',
  'dom_healthcare',
  'public_source',
  'Good Clinical Practice (GCP), Informed Consent & Protocol Deviation Reporting',
  'During an FDA Phase II oncology clinical drug trial, a research subject arrives for their Day 28 visit. You discover that a lab technician drew pharmacokinetic (PK) blood samples 90 minutes after the protocol-specified 30-minute post-dose window, and the subject has also failed to sign the newly IRB-approved consent form addendum. How do you document this protocol deviation, ensure subject safety, and report to the IRB and Sponsor under ICH-GCP guidelines?',
  'case_study',
  3,
  '[{"score":5,"criterion":"Exemplary","description":"Halts investigational drug administration until re-consented, documents protocol deviation with root-cause analysis (CAPA), preserves sample with actual timestamp, and notifies IRB/Sponsor within mandated timeline."},{"score":3,"criterion":"Proficient","description":"Re-consents the patient with the latest IRB addendum and files a protocol deviation report with the Principal Investigator."},{"score":1,"criterion":"Developing","description":"Falsifies the timestamp to match the protocol window or continues visits without re-consenting the subject."}]',
  'Under ICH-GCP E6 guidelines, subject rights and protocol integrity are non-negotiable. First, regarding informed consent: the subject must be presented with the newly approved IRB addendum, given adequate time to review, and sign before any further protocol-specific procedures or investigational drug doses occur. Second, regarding the PK timing: I record the exact actual draw timestamp on the CRF rather than backdating. I notify the Principal Investigator, initiate a formal Protocol Deviation report detailing the 60-minute window breach, assess clinical impact on PK modeling with the Medical Monitor, and implement a Corrective and Preventive Action (CAPA) plan for phlebotomy scheduling.',
  'Altering timestamps to hide the delay; administering investigational drug without current IRB consent.',
  '["ICH-GCP golden rule: If it was not documented accurately, it did not happen. Never falsify sample timestamps.","Subjects must re-consent with the latest IRB addenda before continuing study interventions."]',
  'https://www.fda.gov/science-research/clinical-trials-and-human-subject-protection/good-clinical-practice',
  'FDA Good Clinical Practice (GCP) & ICH E6 Guidelines',
  '2026-01-21 00:00:00',
  NULL,
  'regulatory_clinical_standard',
  0.97,
  'occ_clin_research',
  'mid',
  'Clinical Trial Compliance, GCP & IRB Protocol Governance',
  0,
  CURRENT_TIMESTAMP
);
