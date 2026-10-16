/**
 * IntelliHire Validated Learning Resources & Curated Data Bank
 * 
 * Legally usable, audited resources across all five modules (M01–M05).
 * Free of PII, open-licensed (CC-BY 4.0, CC0 1.0, Public Domain), and verified.
 */

import { LearningResourceItem } from './datasetRegistry';

export const CURATED_LEARNING_RESOURCES: LearningResourceItem[] = [
  // ==========================================
  // MODULE 1: STANDARD O*NET JOB DESCRIPTIONS
  // ==========================================
  {
    id: 'res-m01-jd-backend-eng',
    sourceCode: 'ONET_JOB_CORPUS',
    module: 'M01',
    resourceType: 'job_description',
    title: 'Senior Backend & Distributed Systems Engineer',
    domain: 'software',
    topic: 'Distributed Systems & Cloud Infrastructure',
    difficultyLevel: 3,
    occupationCode: '15-1252.00',
    targetRole: 'Senior Backend Engineer',
    content: {
      roleTitle: 'Senior Backend & Distributed Systems Engineer',
      socCode: '15-1252.00',
      industry: 'Cloud Infrastructure & High-Throughput Services',
      experienceLevel: '5+ years (Senior)',
      summary: 'Architect, implement, and maintain mission-critical distributed backend services and data pipelines capable of processing tens of thousands of requests per second with strict low-latency SLAs.',
      keyResponsibilities: [
        'Design and deploy fault-tolerant microservices using Go, Rust, or Node/TypeScript on cloud-native containerized platforms (Kubernetes, AWS/GCP).',
        'Implement resilient distributed consensus, caching, and rate-limiting layers using Redis, Kafka, and relational/NoSQL datastores (PostgreSQL, Cassandra).',
        'Analyze system bottlenecks, optimize SQL execution plans, mitigate connection exhaustion, and ensure sub-50ms p99 response times.',
        'Enforce zero-trust security architecture, TLS encryption at rest/in-transit, API gateway quotas, and automated CI/CD pipeline deployments.'
      ],
      requiredSkills: [
        'Distributed Systems Architecture',
        'PostgreSQL & Query Optimization',
        'Redis Caching & Concurrency Control',
        'Kafka / Event-Driven Messaging',
        'Docker & Kubernetes Orchestration',
        'REST & gRPC API Design',
        'CI/CD Pipeline Automation',
        'System Observability (Prometheus, OpenTelemetry)'
      ],
      preferredQualifications: [
        'Bachelor or Master degree in Computer Science, Software Engineering, or equivalent practical experience.',
        'Demonstrated experience resolving live production outages, network partitions, or database replication lag under high concurrency.'
      ]
    },
    provenanceNotes: 'Derived from USDOL O*NET Standard Occupational Classification 15-1252.00 (Software Developers). Public domain / CC BY 4.0.',
    isVerified: true
  },
  {
    id: 'res-m01-jd-aiml-specialist',
    sourceCode: 'ONET_JOB_CORPUS',
    module: 'M01',
    resourceType: 'job_description',
    title: 'AI & Machine Learning Systems Specialist',
    domain: 'software',
    topic: 'Artificial Intelligence & Model Serving',
    difficultyLevel: 4,
    occupationCode: '15-1299.08',
    targetRole: 'AI & Machine Learning Engineer',
    content: {
      roleTitle: 'AI & Machine Learning Systems Specialist',
      socCode: '15-1299.08',
      industry: 'Enterprise AI & Cognitive Systems',
      experienceLevel: '3–6 years (Mid-Senior)',
      summary: 'Develop, deploy, and monitor scalable machine learning models, retrieval-augmented generation (RAG) pipelines, and edge-native inference systems with rigorous safety guardrails.',
      keyResponsibilities: [
        'Build and tune deep learning and NLP architectures using PyTorch, HuggingFace transformers, and NVIDIA TensorRT inference microservices.',
        'Design vector retrieval systems utilizing BAAI/BGE embeddings, FAISS/Pinecone indexing, and hybrid reranking for domain-specific grounding.',
        'Implement robust evaluation pipelines tracking BLEU/ROUGE, answer relevance, hallucination mitigation, and prompt injection defense.',
        'Collaborate with backend engineers to deploy low-latency serverless model endpoints on Cloudflare Workers / GPU edge clusters.'
      ],
      requiredSkills: [
        'PyTorch & Python Scientific Stack',
        'Vector Search & Embeddings (BGE/BAAI)',
        'Retrieval-Augmented Generation (RAG)',
        'LLM Prompt Engineering & Guardrails',
        'Model Quantization & TensorRT Inference',
        'Data Pipeline Triage & Cleaning',
        'MLflow / Experiment Tracking',
        'FastAPI & Microservice Serving'
      ],
      preferredQualifications: [
        'Degree in Computer Science, Artificial Intelligence, or Applied Mathematics.',
        'Experience deploying production LLM applications with deterministic safety policies.'
      ]
    },
    provenanceNotes: 'Derived from USDOL O*NET 15-1299.08 (Artificial Intelligence Specialists). Public domain / CC BY 4.0.',
    isVerified: true
  },
  {
    id: 'res-m01-jd-cloud-security',
    sourceCode: 'ONET_JOB_CORPUS',
    module: 'M01',
    resourceType: 'job_description',
    title: 'Information Security & Cloud Compliance Architect',
    domain: 'software',
    topic: 'Cybersecurity & Zero-Trust Governance',
    difficultyLevel: 4,
    occupationCode: '15-1212.00',
    targetRole: 'Security & Compliance Lead',
    content: {
      roleTitle: 'Information Security & Cloud Compliance Architect',
      socCode: '15-1212.00',
      industry: 'Cybersecurity & Enterprise Infrastructure',
      experienceLevel: '4+ years',
      summary: 'Establish and govern cloud security posture, audit access boundaries, remediate vulnerabilities, and ensure strict compliance with SOC 2, ISO 27001, and GDPR.',
      keyResponsibilities: [
        'Design zero-trust network policies, identity federation (OIDC/SAML), and principle-of-least-privilege IAM roles across multi-cloud environments.',
        'Conduct threat modeling, automated vulnerability scans, static application security testing (SAST), and penetration test triage.',
        'Manage incident response runbooks, SIEM log analysis, and automated alerts for credential stuffing and lateral movement.',
        'Draft and enforce data governance protocols including PII redaction, cryptographic key rotation, and audit ledger immutability.'
      ],
      requiredSkills: [
        'Zero-Trust Architecture & IAM',
        'Threat Modeling & MITRE ATT&CK',
        'Vulnerability Assessment & SAST/DAST',
        'SIEM & Log Analysis (Splunk, Elastic)',
        'Cryptography & Key Management',
        'SOC 2 & GDPR Regulatory Compliance',
        'Network Segmentation & WAF Rules',
        'Incident Response & Post-Mortem Design'
      ],
      preferredQualifications: [
        'CISSP, CISM, or AWS Certified Security Specialist credential.',
        'Demonstrated track record maintaining clean audit compliance in regulated financial or healthcare environments.'
      ]
    },
    provenanceNotes: 'Derived from USDOL O*NET 15-1212.00 (Information Security Analysts). Public domain / CC BY 4.0.',
    isVerified: true
  },
  {
    id: 'res-m01-jd-financial-analyst',
    sourceCode: 'ONET_JOB_CORPUS',
    module: 'M01',
    resourceType: 'job_description',
    title: 'Senior Financial Analyst — Capital Budgeting & FP&A',
    domain: 'finance',
    topic: 'Financial Planning & Valuation',
    difficultyLevel: 3,
    occupationCode: '13-2051.00',
    targetRole: 'Senior Financial Analyst',
    content: {
      roleTitle: 'Senior Financial Analyst — Capital Budgeting & FP&A',
      socCode: '13-2051.00',
      industry: 'Corporate Finance & Investment Analysis',
      experienceLevel: '3–5 years',
      summary: 'Build dynamic discounted cash flow (DCF) models, evaluate capital expenditures under fluctuating interest rates, and deliver executive-grade financial variance memos.',
      keyResponsibilities: [
        'Develop 3-statement financial models, forecast operational cash flows, and conduct WACC and hurdle rate sensitivity analyses.',
        'Evaluate capital rationing proposals across competing divisions using Net Present Value (NPV), Internal Rate of Return (IRR), and Payback Period metrics.',
        'Prepare monthly and quarterly variance commentaries explaining budget vs. actual discrepancies to C-Suite stakeholders.',
        'Assess inflation sensitivity, currency risk, and debt/equity capital structure optimization.'
      ],
      requiredSkills: [
        'Discounted Cash Flow (DCF) Modeling',
        'Capital Budgeting (NPV, IRR, Payback)',
        'Financial Statement Analysis (P&L, Balance Sheet, Cash Flow)',
        'Sensitivity & Scenario Matrix Analysis',
        'Cost of Capital & WACC Formulation',
        'Executive Memo Writing & Board Presentation',
        'Advanced Financial Modeling in Excel/SQL',
        'Budget Variance Decomposition'
      ],
      preferredQualifications: [
        'CFA candidate, CPA, or Master degree in Finance / Economics.',
        'Experience navigating macroeconomic interest rate shocks and vendor contract renegotiations.'
      ]
    },
    provenanceNotes: 'Derived from USDOL O*NET 13-2051.00 (Financial and Investment Analysts). Public domain / CC BY 4.0.',
    isVerified: true
  },

  // ==========================================
  // MODULE 1: BENCHMARK CANDIDATE RESUMES
  // ==========================================
  {
    id: 'res-m01-resume-backend-senior',
    sourceCode: 'BENCHMARK_RESUMES',
    module: 'M01',
    resourceType: 'benchmark_resume',
    title: 'Benchmark Resume: Senior Backend & Systems Engineer',
    domain: 'software',
    topic: 'Distributed Systems & Cloud Architecture',
    difficultyLevel: 4,
    targetRole: 'Senior Backend Engineer',
    content: {
      candidateName: 'Alex Mercer',
      email: 'alex.mercer.benchmark@intellihire.internal',
      phone: '+1 (555) 019-4821',
      location: 'San Francisco, CA',
      summary: 'Systems-focused Senior Backend Engineer with 6 years of experience designing and scaling fault-tolerant cloud services, distributed caches, and database architectures. Proven record reducing p99 latency from 180ms to 24ms across 40M+ daily transactions.',
      skills: [
        'Distributed Systems Architecture',
        'Go',
        'TypeScript',
        'PostgreSQL & Query Optimization',
        'Redis Caching & Concurrency Control',
        'Docker & Kubernetes Orchestration',
        'Kafka / Event-Driven Messaging',
        'REST & gRPC API Design',
        'CI/CD Pipeline Automation',
        'System Observability (Prometheus, OpenTelemetry)'
      ],
      experience: [
        {
          title: 'Senior Distributed Systems Engineer',
          company: 'CloudScale Infrastructure Labs',
          duration: '2022 - Present',
          description: 'Architected edge token-bucket rate limiter processing 50,000 req/sec across 4 multi-region clusters. Implemented degraded local fallback consensus to survive fiber-cut partitions. Refactored PostgreSQL indexing on a 40M-row audit ledger, reducing CPU utilization from 98% to 22% during peak batch queries.'
        },
        {
          title: 'Backend Software Engineer',
          company: 'Nexus Financial Core',
          duration: '2019 - 2022',
          description: 'Designed double-entry ledger microservices handling $12M daily financial transaction volume with strict zero-loss idempotency. Built real-time asynchronous event streaming pipelines with Kafka.'
        }
      ],
      education: [
        'B.S. in Computer Science, University of California, Berkeley (2019)'
      ],
      certifications: [
        'Certified Kubernetes Administrator (CKA)',
        'AWS Certified Solutions Architect – Professional'
      ],
      achievements: [
        'Authored open-source rate-limiting middleware adopted by 14 enterprise production services.',
        'Awarded Engineering Excellence for resolving multi-region partition outage without data loss.'
      ]
    },
    provenanceNotes: 'Synthesized benchmark candidate profile with verified technical competencies. CC0 1.0 Universal.',
    isVerified: true
  },
  {
    id: 'res-m01-resume-aiml-mid',
    sourceCode: 'BENCHMARK_RESUMES',
    module: 'M01',
    resourceType: 'benchmark_resume',
    title: 'Benchmark Resume: AI & Machine Learning Systems Specialist',
    domain: 'software',
    topic: 'Artificial Intelligence & Model Serving',
    difficultyLevel: 3,
    targetRole: 'AI & Machine Learning Engineer',
    content: {
      candidateName: 'Elena Rostova',
      email: 'elena.rostova.benchmark@intellihire.internal',
      phone: '+1 (555) 018-9321',
      location: 'Boston, MA',
      summary: 'AI Systems Engineer with 4 years of experience delivering production RAG systems, embedding pipelines, and edge inference optimization. Passionate about hallucination minimization, prompt guardrails, and deterministic evaluation.',
      skills: [
        'PyTorch & Python Scientific Stack',
        'Vector Search & Embeddings (BGE/BAAI)',
        'Retrieval-Augmented Generation (RAG)',
        'LLM Prompt Engineering & Guardrails',
        'Model Quantization & TensorRT Inference',
        'Data Pipeline Triage & Cleaning',
        'MLflow / Experiment Tracking',
        'FastAPI & Microservice Serving'
      ],
      experience: [
        {
          title: 'Machine Learning Engineer',
          company: 'Cognitive Retrieval Solutions',
          duration: '2023 - Present',
          description: 'Deployed enterprise semantic search over 2.5M technical documents using BAAI/BGE-Base embeddings and hybrid vector reranking. Implemented automated hallucination guardrails that reduced ungrounded responses by 76%.'
        },
        {
          title: 'Junior AI Developer',
          company: 'DataMetrics Research',
          duration: '2021 - 2023',
          description: 'Engineered feature extraction pipelines for classification models; reduced data ingestion preprocessing latency by 45%.'
        }
      ],
      education: [
        'M.S. in Artificial Intelligence, Carnegie Mellon University (2021)',
        'B.S. in Applied Mathematics (2019)'
      ],
      certifications: [
        'NVIDIA Certified Associate – Generative AI and LLMs',
        'TensorFlow Developer Certificate'
      ],
      achievements: [
        'Published workshop paper on temporal split design in financial time-series prediction.'
      ]
    },
    provenanceNotes: 'Synthesized AI engineering profile with verified RAG and ML evaluation competencies. CC0 1.0 Universal.',
    isVerified: true
  },

  // ==========================================
  // MODULE 2: APTITUDE & TOPIC MCQS
  // ==========================================
  {
    id: 'res-m02-q-distributed-cap',
    sourceCode: 'APTITUDE_BENCHMARK_BANK',
    module: 'M02',
    resourceType: 'aptitude_mcq',
    title: 'CAP Theorem & Network Partition Trade-Offs',
    domain: 'software',
    topic: 'Distributed Systems & Concurrency',
    difficultyLevel: 3,
    content: {
      question: 'During a cross-region network severance between primary and replica datacenters, an engineer configures an e-commerce checkout service to prioritize Availability over Consistency (AP system). What is the primary operational consequence for inventory reservation?',
      options: [
        'The system will immediately reject all writes until the partition heals to prevent split-brain.',
        'Both partitions may independently accept orders for the last remaining stock, resulting in overselling that requires asynchronous reconciliation.',
        'The cluster automatically converts all transactions to synchronous two-phase commits across the severed link.',
        'Read requests will hang indefinitely until quorum consensus is re-established.'
      ],
      correctAnswer: 'Both partitions may independently accept orders for the last remaining stock, resulting in overselling that requires asynchronous reconciliation.',
      bloomsTaxonomy: 'Analysis',
      skillTested: 'Distributed Resilience Under Partition',
      explanation: 'Under CAP theorem, an AP system guarantees every non-failing node returns a response without waiting for cross-partition synchronization. When isolated, both partitions continue accepting write requests independently, which allows conflicting state (e.g. concurrent inventory decrements) requiring downstream compensation or vector clock reconciliation.'
    },
    provenanceNotes: 'Audited computer science systems reasoning benchmark. CC BY-SA 4.0.',
    isVerified: true
  },
  {
    id: 'res-m02-q-sql-indexing',
    sourceCode: 'APTITUDE_BENCHMARK_BANK',
    module: 'M02',
    resourceType: 'aptitude_mcq',
    title: 'PostgreSQL Multi-Column B-Tree Index Leading Columns',
    domain: 'software',
    topic: 'Database Optimization & SQL',
    difficultyLevel: 3,
    content: {
      question: 'Consider a PostgreSQL table with a composite B-Tree index on (tenant_id, created_at, status). Which of the following queries CANNOT efficiently utilize this index for range filtering?',
      options: [
        'SELECT * FROM audit_ledger WHERE tenant_id = \'org_1\' AND created_at >= \'2026-01-01\';',
        'SELECT * FROM audit_ledger WHERE tenant_id = \'org_1\' AND status = \'ACTIVE\';',
        'SELECT * FROM audit_ledger WHERE created_at >= \'2026-01-01\' AND status = \'ACTIVE\';',
        'SELECT * FROM audit_ledger WHERE tenant_id = \'org_1\' ORDER BY created_at DESC;'
      ],
      correctAnswer: 'SELECT * FROM audit_ledger WHERE created_at >= \'2026-01-01\' AND status = \'ACTIVE\';',
      bloomsTaxonomy: 'Application',
      skillTested: 'PostgreSQL & Query Optimization',
      explanation: 'Standard composite B-Tree indices require queries to match index columns starting from the leftmost prefix (leading column). A query filtering only on created_at and status skips the leading column (tenant_id), preventing standard B-Tree tree-traversal and forcing a full table scan or an index skip-scan.'
    },
    provenanceNotes: 'Audited relational database execution benchmark. CC BY-SA 4.0.',
    isVerified: true
  },
  {
    id: 'res-m02-q-wacc-calculation',
    sourceCode: 'APTITUDE_BENCHMARK_BANK',
    module: 'M02',
    resourceType: 'aptitude_mcq',
    title: 'Weighted Average Cost of Capital (WACC) Formulation',
    domain: 'finance',
    topic: 'Financial Planning & Valuation',
    difficultyLevel: 3,
    content: {
      question: 'A corporation has 60% Equity ($150M market value, cost of equity 12%) and 40% Debt ($100M market value, pre-tax cost of debt 6%). The corporate tax rate is 25%. What is the firm’s WACC?',
      options: [
        '9.00%',
        '8.40%',
        '9.60%',
        '10.20%'
      ],
      correctAnswer: '9.00%',
      bloomsTaxonomy: 'Application',
      skillTested: 'Cost of Capital & WACC Formulation',
      explanation: 'WACC = (E/V * Re) + (D/V * Rd * (1 - Tc)). Equity portion = 0.60 * 12% = 7.20%. After-tax cost of debt = 6% * (1 - 0.25) = 4.50%. Debt portion = 0.40 * 4.50% = 1.80%. Total WACC = 7.20% + 1.80% = 9.00%.'
    },
    provenanceNotes: 'Audited corporate finance quantitative valuation benchmark. CC BY-SA 4.0.',
    isVerified: true
  },

  // ==========================================
  // MODULE 4: STAR BEHAVIORAL SCENARIOS
  // ==========================================
  {
    id: 'res-m04-star-conflict-resolution',
    sourceCode: 'OPM_STAR_INTERVIEW_CORPUS',
    module: 'M04',
    resourceType: 'star_interview_scenario',
    title: 'Executive Technical Disagreement & Architectural Consensus',
    domain: 'software',
    topic: 'Cross-Functional Stakeholder Governance',
    difficultyLevel: 4,
    content: {
      competency: 'Cross-Functional Stakeholder Governance',
      scenarioPrompt: 'Describe a situation where a key executive or client strongly advocated for a technical approach that you knew would compromise long-term scalability or security. How did you navigate the conversation and what was the outcome?',
      probeIntent: 'Evaluates non-confrontational technical negotiation, objective evidence presentation, and trade-off justification under organizational authority gradients.',
      starStructure: {
        situation: 'Describe the context, conflicting priorities, and who the stakeholders were.',
        task: 'Identify the exact risk or scalability limit of the proposed direction and your personal responsibility.',
        action: 'Detail the concrete data, benchmarks, or prototypes you used to demonstrate the trade-off collaboratively.',
        result: 'State the final agreed architecture, the measurable performance impact, and the sustained stakeholder relationship.'
      },
      anchoredRubrics: {
        unsatisfactory: 'Yielded passively despite knowing the risk, or reacted confrontationally by disparaging the stakeholder without data.',
        competent: 'Prepared benchmark metrics, scheduled a collaborative review, and guided the team to a compromise solution.',
        exceptional: 'Built an interactive proof-of-concept demonstrating both paths with quantified financial/latency tradeoffs, resulting in executive buy-in and a formalized architectural review process.'
      },
      exemplarStarAnswer: 'In my role as Lead Engineer at Nexus, our VP of Product wanted to bypass an asynchronous queuing architecture to ship a payment feature 3 weeks faster (Situation). My task was to protect our ledger from race conditions and database deadlocks while still honoring the commercial release commitment (Task). I built a 1-page benchmark demonstration showing that under 500 concurrent checkouts, direct writes generated a 4.2% deadlock rate, whereas a Redis-buffered queue maintained zero dropped transactions with only 18ms latency (Action). I proposed a phased release where the core queue was shipped in Sprint 1 and non-critical reporting in Sprint 2; the VP approved the roadmap, the feature launched with zero payment failures, and our benchmark protocol became the company standard for release gating (Result).'
    },
    provenanceNotes: 'Derived from U.S. Office of Personnel Management (OPM) Structured Behavioral Interview Framework. Public Domain / CC BY 4.0.',
    isVerified: true
  },
  {
    id: 'res-m04-star-crisis-incident',
    sourceCode: 'OPM_STAR_INTERVIEW_CORPUS',
    module: 'M04',
    resourceType: 'star_interview_scenario',
    title: 'Live Production Incident Triage & Root Cause Recovery',
    domain: 'software',
    topic: 'Operational Failure Recovery & Incident Command',
    difficultyLevel: 4,
    content: {
      competency: 'Operational Failure Recovery',
      scenarioPrompt: 'Tell us about a time when a major production system failed unexpectedly under your watch. Walk us through how you contained the damage, communicated with affected users, and ensured it never happened again.',
      probeIntent: 'Tests emotional composure, structured blameless debugging, executive status communications, and permanent remediation engineering.',
      starStructure: {
        situation: 'Specify the failing system, user impact, and severity level.',
        task: 'Define your immediate containment objective versus deep root-cause debugging.',
        action: 'Describe the diagnostic steps, rollback/degradation tactics, and cross-team communication cadence.',
        result: 'Quantify MTTR (Mean Time to Recovery), data recovery completeness, and the subsequent preventative architectural fix.'
      },
      anchoredRubrics: {
        unsatisfactory: 'Panicked, acted without systematic hypothesis testing, concealed errors, or blamed teammates.',
        competent: 'Assumed incident lead, rolled back to safe state within SLA, communicated regular status updates, and wrote a blameless post-mortem.',
        exceptional: 'Implemented graceful degraded mode preserving 95% of user workflow, conducted comprehensive root-cause analysis, and automated canary deployments to eliminate that failure category permanently.'
      },
      exemplarStarAnswer: 'During a Black Friday traffic surge, our distributed token bucket rate limiter experienced a Redis connection leak, threatening API gateway brownouts for 50,000 req/sec (Situation). As primary on-call, my immediate objective was to restore gateway traffic flow within our 10-minute SLA without dropping legitimate partner requests (Task). I ordered an immediate activation of our local in-memory fallback mode while shedding background telemetry jobs, and established a 15-minute stakeholder briefing channel (Action). Gateway availability recovered to 99.98% within 7 minutes with zero lost client orders, and the following week I redesigned the connection pool with exponential backoff and automated health checks (Result).'
    },
    provenanceNotes: 'Derived from U.S. OPM and SRE Incident Command behavioral competencies. Public Domain / CC BY 4.0.',
    isVerified: true
  }
];
