import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  Flame,
  Target,
  ShieldCheck,
  Brain,
  Layers,
  CheckCircle2,
  Briefcase,
  Compass,
  Users,
  ChevronRight,
  ChevronDown,
  BookOpen,
  Code2,
  MessageSquare,
  Scale,
  AlertCircle,
  Lock,
  EyeOff,
  FileText,
  Sparkles,
  RefreshCw,
  GraduationCap,
  Building2,
  UserCheck,
  Check,
  Info,
  HelpCircle,
  LayoutDashboard
} from 'lucide-react';
import Navbar from '../components/Navbar';

interface LifecycleStage {
  step: string;
  name: string;
  phase: 'Ground & Diagnose' | 'Learn & Rehearse' | 'Demonstrate & Verify' | 'Synthesize & Iterate';
  summary: string;
  detail: string;
  route: string;
  routeLabel: string;
  mode: string;
}

const LIFECYCLE_STAGES: LifecycleStage[] = [
  {
    step: '01',
    name: 'Discover',
    phase: 'Ground & Diagnose',
    summary: 'Explore occupational domains and target roles grounded in O*NET and ESCO taxonomies.',
    detail: 'Select from supported professional domains including Software, Data, Finance, Operations, Healthcare Administration, Legal, Engineering, and Education.',
    route: '/onboarding',
    routeLabel: 'Explore Role Taxonomy',
    mode: 'Candidate-Guided'
  },
  {
    step: '02',
    name: 'Profile',
    phase: 'Ground & Diagnose',
    summary: 'Establish your target role, experience tier, and baseline career context.',
    detail: 'Your profile scopes how assessments, task simulations, and interview questions calibrate complexity from Entry to Lead/Executive levels.',
    route: '/candidate',
    routeLabel: 'Configure Candidate Profile',
    mode: 'Persisted in D1'
  },
  {
    step: '03',
    name: 'Resume',
    phase: 'Ground & Diagnose',
    summary: 'Ingest your résumé (PDF, DOCX, TXT, TEX up to 5 MB) with automatic PII redaction.',
    detail: 'A 3-pass extraction pipeline segments document structure, extracts claims with source provenance, and redacts personal identifiers before external LLM calls.',
    route: '/resume',
    routeLabel: 'Open M1 Resume Studio',
    mode: 'M01 · Multi-Pass Extraction'
  },
  {
    step: '04',
    name: 'Match',
    phase: 'Ground & Diagnose',
    summary: 'Compare extracted claims against a target job description using a 4D hybrid ATS model.',
    detail: 'Evaluates Format (30%), Keyword Match (35%), Structure (10%), and AI Alignment (25%) with deterministic fallback so analysis never locks up.',
    route: '/resume',
    routeLabel: 'Run JD Alignment',
    mode: 'M01 · Hybrid Scoring'
  },
  {
    step: '05',
    name: 'Gap Analysis',
    phase: 'Ground & Diagnose',
    summary: 'Separate explicitly demonstrated requirements from unverified or missing skills.',
    detail: 'Distinguishes what your résumé asserts on paper from what still requires verification, learning, or practical demonstration.',
    route: '/resume',
    routeLabel: 'Review Gap Matrix',
    mode: 'M01 → M02 Handoff'
  },
  {
    step: '06',
    name: 'Learn',
    phase: 'Learn & Rehearse',
    summary: 'Follow structured learning pathways targeting your diagnosed competency gaps.',
    detail: 'Work through targeted concept modules where reading completion is tracked separately from verified skill mastery.',
    route: '/learning',
    routeLabel: 'Open Learning Pathways',
    mode: 'M02 · Guided Curriculum'
  },
  {
    step: '07',
    name: 'Practice',
    phase: 'Learn & Rehearse',
    summary: 'Answer formative practice prompts with Why-chain and How-chain diagnostic feedback.',
    detail: 'When a response misses a concept, the teaching engine explains why the distinction matters and how to remediate the underlying misconception.',
    route: '/learning',
    routeLabel: 'Practise with Remediation',
    mode: 'M02 · Diagnostic Teaching'
  },
  {
    step: '08',
    name: 'Simulate',
    phase: 'Learn & Rehearse',
    summary: 'Rehearse realistic, multi-constraint tasks across occupation-aware work surfaces.',
    detail: 'Execute code, write SQL, analyze financial tables, draft legal memos, or resolve operational bottlenecks with mid-task constraint shifts.',
    route: '/simulation',
    routeLabel: 'Launch M3 Simulation',
    mode: 'M03 · Work-Surface Sandbox'
  },
  {
    step: '09',
    name: 'Evidence',
    phase: 'Demonstrate & Verify',
    summary: 'Capture observable work artifacts, rubric evaluations, and provenance records.',
    detail: 'Every simulation submission, assessment response, and interview turn records timestamped observable evidence separate from AI interpretation.',
    route: '/results',
    routeLabel: 'Inspect Evidence Ledger',
    mode: 'M01–M05 Provenance'
  },
  {
    step: '10',
    name: 'Prepare',
    phase: 'Demonstrate & Verify',
    summary: 'Generate role-grounded interview preparation guides and structured study briefs.',
    detail: 'Synthesize your target role and skill gaps into focused preparation topics and exportable DOCX study guides.',
    route: '/interview-prep',
    routeLabel: 'Open Interview Prep',
    mode: 'M02 · Prep Engine'
  },
  {
    step: '11',
    name: 'Assess',
    phase: 'Demonstrate & Verify',
    summary: 'Complete adaptive assessments and 10-question structured interviews with coaching.',
    detail: 'Bayesian item selection targets high-uncertainty skills, while M04 conducts a 10-question sequential interview with adaptive follow-up probes and retries.',
    route: '/interviews',
    routeLabel: 'Start M4 Structured Interview',
    mode: 'M02 & M04 Evaluation'
  },
  {
    step: '12',
    name: 'Readiness',
    phase: 'Synthesize & Iterate',
    summary: 'Review your multi-dimensional readiness profile paired with measurement uncertainty.',
    detail: 'Consolidates M01 claims, M02 proficiency estimates, M03 task debriefs, and M04 interview observations into a 5-layer auditable readiness summary.',
    route: '/results',
    routeLabel: 'View M5 Readiness Summary',
    mode: 'M05 · 5-Layer Synthesis'
  },
  {
    step: '13',
    name: 'Opportunity',
    phase: 'Synthesize & Iterate',
    summary: 'Connect verified evidence packages with open requisitions for human-led review.',
    detail: 'Candidates explore open roles in their tenant workspace while recruiters and hiring committees review evidence packages under strict human decision authority.',
    route: '/dashboard',
    routeLabel: 'Explore Open Requisitions',
    mode: 'Human-in-the-Loop'
  },
  {
    step: '14',
    name: 'Improve',
    phase: 'Synthesize & Iterate',
    summary: 'Follow closed-loop remediation plans, retry weak areas, and reassess over time.',
    detail: 'Readiness is not a one-time verdict. Use specific gap recommendations from M03, M04, and M05 to practise again and strengthen your evidence.',
    route: '/learning',
    routeLabel: 'Continue Improvement Loop',
    mode: 'Iterative Progression'
  }
];

const WALKTHROUGH_STEPS = [
  {
    id: 'step-1',
    badge: 'Step 1 · Target Role & Gap Identification (M01)',
    title: 'Select a target role and separate paper claims from missing requirements',
    roleContext: 'Illustrative Example: Operations & Supply Chain Analyst (Mid-Level)',
    problem: 'A candidate uploads a résumé listing "Inventory Forecasting" and "SQL Reporting," but the target role also requires "Vendor SLA Breach Remediation" and "Safety Stock Sensitivity Modeling."',
    systemAction: 'M01 extracts 18 verifiable claims with PII redacted, computes a 4D hybrid ATS alignment breakdown, and flags the 2 unverified operational requirements instead of inventing experience.',
    artifactPreview: {
      header: 'M01 · Hybrid Alignment & Requirement Gap Matrix (Illustrative)',
      metrics: [
        { label: 'Format & Parseability (30%)', value: '92 / 100' },
        { label: 'Keyword Alignment (35%)', value: '78 / 100' },
        { label: 'Structure & Quantification (10%)', value: '85 / 100' },
        { label: 'AI Requirement Alignment (25%)', value: '74 / 100' }
      ],
      items: [
        { status: 'DEMONSTRATED', text: 'SQL aggregation & weekly inventory turnover reporting (Source: Resume v3, Experience #1)' },
        { status: 'MISSING / UNVERIFIED', text: 'Contractual SLA credit calculation & vendor cure-period escalation' },
        { status: 'NEXT ACTION', text: 'Route missing operational competencies to M02 Adaptive Assessment & M03 Task Simulation' }
      ]
    },
    ctaRoute: '/resume',
    ctaText: 'Try M01 Resume & JD Gap Analysis'
  },
  {
    id: 'step-2',
    badge: 'Step 2 · Adaptive Assessment & Teaching (M02)',
    title: 'Measure proficiency with explicit uncertainty and remediate misconceptions',
    roleContext: 'Illustrative Example: Bayesian Adaptive Probing & Diagnostic Teaching',
    problem: 'Traditional quizzes output a raw percentage without telling the candidate why their reasoning failed or how confident the measurement is.',
    systemAction: 'M02 selects items targeting high-uncertainty skills (e.g., Safety Stock & Reorder Point logic), updates proficiency θ and uncertainty SE(θ), and delivers a Why-Chain + How-Chain teaching explanation.',
    artifactPreview: {
      header: 'M02 · Adaptive Proficiency & Diagnostic Teaching (Illustrative)',
      metrics: [
        { label: 'Proficiency Estimate (θ)', value: '0.68 (Developing → Competent)' },
        { label: 'Measurement Uncertainty SE(θ)', value: '±0.16 (4 observations)' },
        { label: 'Completion vs. Mastery', value: 'Separated (Checkpoint Gate Required)' },
        { label: 'Diagnostic Mode', value: 'Why-Chain + How-Chain Active' }
      ],
      items: [
        { status: 'MISCONCEPTION DIAGNOSED', text: 'Calculated reorder point using average lead time only, omitting lead-time demand variance.' },
        { status: 'WHY IT MATTERS', text: 'Ignoring demand volatility during supplier lead-time spikes causes stockouts during peak cycles.' },
        { status: 'HOW TO IMPROVE', text: 'Apply safety stock buffer Z × σ_d × √L before reassessing at the module checkpoint.' }
      ]
    },
    ctaRoute: '/assess',
    ctaText: 'Explore M02 Adaptive Assessment'
  },
  {
    id: 'step-3',
    badge: 'Step 3 · Realistic Scenario Simulation (M03)',
    title: 'Practise an occupation-aware workplace task before real stakes arise',
    roleContext: 'Illustrative Example: Operations Decision / Vendor SLA Breach Simulation',
    problem: 'Reading about operational trade-offs is different from drafting a structured decision memo under time and budget constraints.',
    systemAction: 'M03 launches an occupation-appropriate work surface (e.g., Operations Decision or Financial/Legal Memo adapter), introduces a realistic constraint shift in Round 2, and evaluates rubric dimensions.',
    artifactPreview: {
      header: 'M03 · Work-Surface Task & Multi-Dimensional Debrief (Illustrative)',
      metrics: [
        { label: 'Work Surface Adapter', value: 'Operations Decision & Memo' },
        { label: 'Seniority Calibration', value: 'Mid-Level Scope' },
        { label: 'Constraint Shift', value: 'Round 2 Cold-Chain Delay Injected' },
        { label: 'Evaluation Mode', value: 'Rubric-Anchored + Deterministic Checks' }
      ],
      items: [
        { status: 'OBSERVED STRENGTH', text: 'Accurately cited Section 8.2 SLA threshold and computed 50% monthly fee credit ($62,500).' },
        { status: 'OBSERVED LOGIC GAP', text: 'Did not specify interim cold-chain rerouting cost cap during the 15-day vendor cure window.' },
        { status: 'ADAPTIVE ROUND 2', text: 'Practise revising the mitigation plan under a 20% expedited freight budget ceiling.' }
      ]
    },
    ctaRoute: '/simulation',
    ctaText: 'Explore M03 Simulation Workspace'
  },
  {
    id: 'step-4',
    badge: 'Step 4 · Sequential AI Interview & Coaching (M04)',
    title: 'Rehearse a 10-question structured interview with adaptive probes and retries',
    roleContext: 'Illustrative Example: Question 3 of 10 · Stakeholder Conflict & Alignment',
    problem: 'In live interviews, candidates often give high-level summaries that omit their personal actions, trade-offs, or measurable outcomes.',
    systemAction: 'M04 asks 10 sequential questions one at a time, triggers an adaptive follow-up probe when trade-offs are missing, provides STAR/CAR/SOAR coaching with anti-hallucination placeholders, and lets the candidate retry.',
    artifactPreview: {
      header: 'M04 · Turn Coaching, Adaptive Probe & Retry Delta (Illustrative)',
      metrics: [
        { label: 'Interview Progression', value: 'Question 3 of 10 (Sequential)' },
        { label: 'Adaptive Follow-Up', value: 'Probe 1 of 2 (Missing Trade-Offs)' },
        { label: 'Recommended Blueprint', value: 'STAR Structure' },
        { label: 'Formative Retry Delta', value: '68% → 86% (+18% Practice Gain)' }
      ],
      items: [
        { status: 'WHAT WORKED', text: 'Clearly stated the cross-team disagreement between finance and warehouse operations.' },
        { status: 'WHAT TO IMPROVE', text: 'Specify your personal mediation criteria and quantify the resulting cycle-time impact.' },
        { status: 'ANTI-HALLUCINATION MODEL', text: 'Uses "[your specific latency / cost metric]" placeholders—never invents employers or facts.' }
      ]
    },
    ctaRoute: '/interviews',
    ctaText: 'Launch M04 Interview Cockpit'
  },
  {
    id: 'step-5',
    badge: 'Step 5 · 5-Layer Evidence Ledger & Next Steps (M05)',
    title: 'Synthesize verifiable readiness evidence while preserving human authority',
    roleContext: 'Illustrative Example: Consolidated Readiness & Remediation Loop',
    problem: 'Disconnected tools leave candidates with no unified study plan and give reviewers opaque AI scores without provenance.',
    systemAction: 'M05 separates raw artifacts, extracted evidence, rubric interpretation, uncertainty, and human judgment—generating a closed-loop remediation plan for the candidate and an auditable dossier for human reviewers.',
    artifactPreview: {
      header: 'M05 · 5-Layer Auditable Readiness Ledger (Illustrative)',
      metrics: [
        { label: 'Layer 1 · Source Artifacts', value: 'Resume v3 + 2 Simulation Submissions' },
        { label: 'Layer 2 · Extracted Evidence', value: '27 Claims + 10 Interview Turns' },
        { label: 'Layer 3 & 4 · Model & Uncertainty', value: 'Rubric Scores + Explicit SE(θ)' },
        { label: 'Layer 5 · Decision Authority', value: 'Reserved Exclusively for Humans' }
      ],
      items: [
        { status: 'CONVERGENT EVIDENCE', text: 'SQL data reconciliation verified across M01 claim, M02 assessment, and M03 simulation.' },
        { status: 'REMEDIATION LOOP', text: 'Recommended Next Step: Complete M02 Supply-Chain Variance module & retry M03 Round 2.' },
        { status: 'GOVERNANCE INVARIANT', text: 'AI never autonomously hires, rejects, or ranks candidates without human committee sign-off.' }
      ]
    },
    ctaRoute: '/results',
    ctaText: 'Inspect M05 Readiness & Governance'
  }
];

const FAQ_ITEMS = [
  {
    question: 'What exactly is IntelliHire?',
    answer:
      'IntelliHire is an evidence-driven career readiness, adaptive learning, skill assessment, task simulation, and structured interview practice platform. It connects five integrated modules (M01 through M05) so you can analyze how your résumé aligns with a target role, identify missing skills, study and practise realistic workplace scenarios, rehearse 10-question structured interviews with coaching, and build an auditable readiness portfolio.'
  },
  {
    question: 'Who should use IntelliHire?',
    answer:
      'IntelliHire is built for students and fresh graduates preparing for their first roles, active job seekers and career changers diagnosing skill gaps for a transition, working professionals rehearsing high-stakes technical or leadership scenarios, educators guiding structured career preparation, and recruiting or talent-development teams that want evidence-grounded candidate dossiers with human decision oversight.'
  },
  {
    question: 'How is IntelliHire different from an AI résumé builder or generic chatbot?',
    answer:
      'An AI résumé writer focuses on making you look qualified on paper—sometimes by embellishing claims you cannot defend in an interview. A generic chatbot gives unanchored advice without tracking your competency state. IntelliHire treats your résumé as an initial set of claims to verify and build upon: it identifies gaps against a target role, routes you to targeted learning and adaptive assessments (M02), lets you rehearse realistic tasks (M03) and structured 10-question interviews with coaching and retries (M04), and records observable evidence with explicit uncertainty (M05).'
  },
  {
    question: 'How do the five modules (M01–M05) work together?',
    answer:
      'M01 ingests your résumé (with automatic PII redaction) and compares your extracted claims against a target job description. M02 uses those diagnosed gaps to deliver targeted learning pathways, Bayesian adaptive assessments, and interview prep guides. M03 provides hands-on, occupation-aware task simulations with mid-task constraint shifts. M04 conducts a 10-question sequential interview informed by your M01–M03 profile, offering adaptive follow-up probes, answer coaching, and retries. M05 synthesizes all observations into a 5-layer readiness ledger and next-step remediation plan.'
  },
  {
    question: 'Does IntelliHire guarantee a job offer or interview success?',
    answer:
      'No. IntelliHire is a capability-development, simulation, and evidence-building platform—not a job-placement agency or guaranteed-employment service. While deliberate practice, gap remediation, and structured answer coaching help you prepare more thoroughly, hiring outcomes always depend on market conditions, role competition, and the independent judgment of human employers.'
  },
  {
    question: 'Are the AI scores definitive measures of my ability or employability?',
    answer:
      'No. Every proficiency estimate or rubric score in IntelliHire is treated as a formative, model-assisted indicator paired with explicit uncertainty—such as Bayesian standard error SE(θ) in M02 or calibration notices on retry deltas in M04. In M05, AI interpretations are strictly separated from raw candidate work and independent human reviewer ratings. AI never autonomously hires, rejects, or determines a person’s worth.'
  },
  {
    question: 'Is camera use required during M04 interview practice?',
    answer:
      'No. Camera use in M04 is 100% optional and disabled by default. You can complete every interview question, follow-up probe, coaching review, and retry using text or transcript input alone. If you choose to enable the local camera preview for self-reflection, the video stream stays strictly inside your browser via getUserMedia—zero video frames or recordings are ever uploaded or stored, and IntelliHire never performs facial emotion recognition, biometric analysis, or voice/accent personality inference.'
  },
  {
    question: 'What can I use for free right now?',
    answer:
      'During the current Public Sandbox phase, any user who signs in with Google SSO is provisioned into the IntelliHire Public Sandbox (tier: "free") at $0. This includes access to M01 Resume Intelligence (up to 5 MB per PDF, DOCX, TXT, or TEX file) and DOCX export, M02 Adaptive Assessments, Learning Pathways, and Interview Prep, M03 Domain Simulations, M04 10-Question Structured Interviews with coaching and retries, and M05 Personal Readiness summaries, operating within the shared sandbox allocation of 100 daily AI inference calls (with automatic deterministic fallback).'
  },
  {
    question: 'What do paid plans include, and is billing active?',
    answer:
      'Commercial subscription pricing and self-serve payment processing are not yet active. While the platform database schema provisions "free", "pro", and "enterprise" organization tiers and tracks daily AI call quotas (tenant_quota), we have not established paid subscription fees yet. All individual capabilities are currently accessible via the free Public Sandbox rather than gated behind a paywall.'
  },
  {
    question: 'How is my personal information handled?',
    answer:
      'Authentication uses Google OAuth 2.0 with cryptographically signed HS256 session tokens stored in Cloudflare KV (no plaintext passwords stored). Before résumé or job-description text is sent to external language models, a deterministic PII redaction filter masks email addresses, phone numbers, SSN patterns, street addresses, and personal profile URLs. Data queries are scoped by user_id and organization_id at the database layer.'
  },
  {
    question: 'How can employers, educators, or institutions engage with IntelliHire?',
    answer:
      'Recruiter and Organization Admin workflows—including job requisition management (/module-3), multi-panel structured interview rubrics (/module-4), 5-layer committee decision records with EEOC 4/5ths adverse-impact monitoring (/module-5), and tenant quota governance (/admin)—are implemented and role-gated in the platform. University cohort accreditation and cross-cohort benchmarking (Priorities 19–21) are currently on the development roadmap.'
  }
];

export default function PublicLanding() {
  const [activeLifecyclePhase, setActiveLifecyclePhase] = useState<string>('All');
  const [activeWalkthroughStep, setActiveWalkthroughStep] = useState<number>(0);
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);
  const [authenticatedUser, setAuthenticatedUser] = useState<{ id?: string; full_name?: string; role?: string } | null>(null);

  useEffect(() => {
    document.title =
      'IntelliHire — Evidence-Driven Career Readiness, Skill Assessment, Simulation & Interview Practice';
    let active = true;
    fetch('/api/auth/me', { credentials: 'same-origin', headers: { Accept: 'application/json' } })
      .then((res) => (res.ok ? res.json() : null))
      .then((data: any) => {
        if (active && data?.user?.id) {
          setAuthenticatedUser(data.user);
        }
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, []);

  const filteredLifecycleStages =
    activeLifecyclePhase === 'All'
      ? LIFECYCLE_STAGES
      : LIFECYCLE_STAGES.filter((s) => s.phase === activeLifecyclePhase);

  const currentWalkthrough = WALKTHROUGH_STEPS[activeWalkthroughStep] || WALKTHROUGH_STEPS[0];

  return (
    <div className="min-h-screen bg-[#001621] text-slate-100 flex flex-col selection:bg-[#FF4103] selection:text-white">
      <Navbar />

      <main className="flex-grow">
        {/* =====================================================================
            SECTION A: HERO — IMMEDIATE CLARITY AND CURIOSITY
           ===================================================================== */}
        <section
          id="hero"
          aria-labelledby="hero-heading"
          className="relative overflow-hidden pt-10 pb-20 lg:pt-16 lg:pb-28 border-b border-[#00273c]"
        >
          {/* Restrained Ambient Illumination */}
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[620px] h-[320px] bg-[#FF4103]/10 rounded-full blur-[130px] pointer-events-none -z-10" />

          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid lg:grid-cols-12 gap-12 items-center">
              {/* Left Column: Core Positioning & Conversion CTAs */}
              <div className="lg:col-span-7 text-left">
                <div className="inline-flex items-center gap-2.5 px-3.5 py-1.5 rounded-full bg-[#001f2e] border border-[#FF4103]/35 text-slate-200 text-xs font-semibold mb-6">
                  <Flame className="w-3.5 h-3.5 text-[#FF4103] shrink-0" />
                  <span>Evidence-Driven Career Readiness, Simulation & Talent Development</span>
                </div>

                <h1
                  id="hero-heading"
                  className="text-3xl sm:text-5xl lg:text-[3.4rem] font-black tracking-tight text-white leading-[1.12]"
                >
                  Your potential deserves more than a résumé.{' '}
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#FF4103] via-[#ff7847] to-[#ffaf91]">
                    Build the skills, practise the situations, and develop the evidence
                  </span>{' '}
                  to take your next career step.
                </h1>

                <p className="mt-6 text-base sm:text-lg text-slate-300 leading-relaxed max-w-2xl">
                  Traditional career preparation fragments résumé edits, study, skill tests, task practice, and interview coaching across disconnected tools. IntelliHire connects them into one structured, iterative journey—helping you move from claiming qualifications on paper to demonstrating real capability with transparent feedback and accountable human oversight.
                </p>

                {/* Primary & Secondary CTAs */}
                <div className="mt-8 flex flex-col sm:flex-row items-stretch sm:items-center gap-3.5">
                  {authenticatedUser ? (
                    <Link
                      to="/dashboard"
                      className="px-7 py-4 rounded-xl font-bold text-sm sm:text-base text-white bg-gradient-to-r from-[#FF4103] to-[#e03200] hover:from-[#ff5722] hover:to-[#FF4103] shadow-xl shadow-[#FF4103]/25 flex items-center justify-center gap-2.5 transition-all focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#FF4103]/50"
                    >
                      <LayoutDashboard className="w-5 h-5" />
                      <span>Continue in Your Workspace</span>
                      <ArrowRight className="w-4 h-4" />
                    </Link>
                  ) : (
                    <Link
                      to="/register"
                      className="px-7 py-4 rounded-xl font-bold text-sm sm:text-base text-white bg-gradient-to-r from-[#FF4103] to-[#e03200] hover:from-[#ff5722] hover:to-[#FF4103] shadow-xl shadow-[#FF4103]/25 flex items-center justify-center gap-2.5 transition-all focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#FF4103]/50"
                    >
                      <span>Start Building Your Readiness</span>
                      <ArrowRight className="w-4 h-4" />
                    </Link>
                  )}

                  <a
                    href="#modules"
                    className="px-6 py-4 rounded-xl font-bold text-sm sm:text-base text-slate-200 bg-[#001f2e] hover:bg-[#00273c] border border-[#063750] hover:border-[#FF4103]/50 flex items-center justify-center gap-2 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF4103]"
                  >
                    <Layers className="w-4 h-4 text-[#FF4103]" />
                    <span>Explore the 5 Modules</span>
                  </a>

                  <a
                    href="#walkthrough"
                    className="px-5 py-4 rounded-xl font-semibold text-sm text-slate-300 hover:text-white hover:bg-[#001f2e] flex items-center justify-center gap-1.5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF4103]"
                  >
                    <span>See How It Works</span>
                    <ChevronRight className="w-4 h-4 text-[#FF4103]" />
                  </a>
                </div>

                {/* Quick Trust & Access Facts */}
                <div className="mt-8 pt-6 border-t border-[#00273c] grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs text-slate-300">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Free Public Sandbox access (Google SSO)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Zero fabricated claims or fake scores</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Humans retain all hiring authority</span>
                  </div>
                </div>
              </div>

              {/* Right Column: Product-Relevant Visual — Connected Readiness Architecture */}
              <div className="lg:col-span-5">
                <div
                  className="bg-[#001f2e] border border-[#063750] rounded-2xl p-6 shadow-2xl relative"
                  role="region"
                  aria-label="IntelliHire Connected Career-Readiness Journey Overview"
                >
                  <div className="flex items-center justify-between pb-4 mb-4 border-b border-[#002b40]">
                    <div>
                      <span className="text-[11px] font-bold uppercase tracking-wider text-[#FF4103]">
                        Connected Platform Architecture
                      </span>
                      <h2 className="text-base font-bold text-white mt-0.5">
                        From Paper Claims to Practised Readiness
                      </h2>
                    </div>
                    <span className="px-2.5 py-1 rounded-md bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-[11px] font-bold">
                      M01 → M05 Live
                    </span>
                  </div>

                  <div className="space-y-3">
                    <div className="p-3.5 rounded-xl bg-[#001621] border border-[#002b40] flex items-start gap-3">
                      <div className="w-8 h-8 rounded-lg bg-[#FF4103]/15 border border-[#FF4103]/40 text-[#FF4103] font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                        M01
                      </div>
                      <div className="text-xs">
                        <div className="font-bold text-white flex items-center justify-between">
                          <span>Resume Intelligence & Requirement Gaps</span>
                          <span className="text-slate-400 font-mono">4D Hybrid ATS</span>
                        </div>
                        <p className="text-slate-300 mt-1">
                          Extracts claims with PII redaction and identifies what a target job description requires that your résumé has not yet demonstrated.
                        </p>
                      </div>
                    </div>

                    <div className="p-3.5 rounded-xl bg-[#001621] border border-[#002b40] flex items-start gap-3">
                      <div className="w-8 h-8 rounded-lg bg-[#FF4103]/15 border border-[#FF4103]/40 text-[#FF4103] font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                        M02
                      </div>
                      <div className="text-xs">
                        <div className="font-bold text-white flex items-center justify-between">
                          <span>Adaptive Learning, Assessment & Prep</span>
                          <span className="text-emerald-400 font-mono">θ ± SE(θ)</span>
                        </div>
                        <p className="text-slate-300 mt-1">
                          Targets high-uncertainty skills with Bayesian assessments, Why/How misconception teaching, and structured learning pathways.
                        </p>
                      </div>
                    </div>

                    <div className="p-3.5 rounded-xl bg-[#001621] border border-[#002b40] flex items-start gap-3">
                      <div className="w-8 h-8 rounded-lg bg-[#FF4103]/15 border border-[#FF4103]/40 text-[#FF4103] font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                        M03
                      </div>
                      <div className="text-xs">
                        <div className="font-bold text-white flex items-center justify-between">
                          <span>Occupation-Aware Task Simulation</span>
                          <span className="text-slate-400 font-mono">9 Work Surfaces</span>
                        </div>
                        <p className="text-slate-300 mt-1">
                          Rehearse realistic technical, financial, operational, or legal tasks with seniority scaling and mid-task constraint shifts.
                        </p>
                      </div>
                    </div>

                    <div className="p-3.5 rounded-xl bg-[#001621] border border-[#002b40] flex items-start gap-3">
                      <div className="w-8 h-8 rounded-lg bg-[#FF4103]/15 border border-[#FF4103]/40 text-[#FF4103] font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                        M04
                      </div>
                      <div className="text-xs">
                        <div className="font-bold text-white flex items-center justify-between">
                          <span>10-Question Sequential AI Interview</span>
                          <span className="text-amber-300 font-mono">STAR / CAR / SOAR</span>
                        </div>
                        <p className="text-slate-300 mt-1">
                          One question at a time with adaptive follow-up probes, evidence-grounded coaching, answer retries, and optional local camera preview.
                        </p>
                      </div>
                    </div>

                    <div className="p-3.5 rounded-xl bg-[#001621] border border-[#002b40] flex items-start gap-3">
                      <div className="w-8 h-8 rounded-lg bg-[#FF4103]/15 border border-[#FF4103]/40 text-[#FF4103] font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                        M05
                      </div>
                      <div className="text-xs">
                        <div className="font-bold text-white flex items-center justify-between">
                          <span>Readiness Synthesis & Human Decision Support</span>
                          <span className="text-cyan-300 font-mono">5-Layer Ledger</span>
                        </div>
                        <p className="text-slate-300 mt-1">
                          Separates raw work, extracted observations, model interpretation, uncertainty, and human judgment for next-step growth.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Clear Category Positioning Strip: What IntelliHire Is vs. Is Not */}
            <div className="mt-14 pt-8 border-t border-[#00273c]">
              <div className="grid md:grid-cols-2 gap-6 bg-[#00111a] border border-[#063750] rounded-2xl p-6">
                <div>
                  <div className="text-xs font-bold uppercase tracking-wider text-emerald-400 mb-2">
                    What IntelliHire Is
                  </div>
                  <p className="text-xs sm:text-sm text-slate-200 leading-relaxed">
                    An integrated career-readiness, learning, assessment, simulation, and decision-support environment that helps you understand what a role requires, practise the actual work and conversations, and build verifiable evidence of your progress.
                  </p>
                </div>
                <div>
                  <div className="text-xs font-bold uppercase tracking-wider text-amber-400 mb-2">
                    What IntelliHire Is Not
                  </div>
                  <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                    Not a one-click AI résumé fabricator, not an unanchored chatbot, not an isolated mock-interview toy, not an autonomous hiring/rejection algorithm, and never a guaranteed job-placement service.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* =====================================================================
            SECTION B: THE PROBLEM — WHY INTELLIHIIRE MATTERS
           ===================================================================== */}
        <section
          id="problem"
          aria-labelledby="problem-heading"
          className="py-20 bg-[#00111a] border-b border-[#00273c]"
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-3xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-[#FF4103]/10 text-[#FF4103] text-xs font-bold uppercase tracking-wider mb-3">
                The Career Readiness Gap
              </div>
              <h2 id="problem-heading" className="text-3xl sm:text-4xl font-black text-white tracking-tight">
                Looking qualified on paper is not the same as being ready for the work.
              </h2>
              <p className="mt-4 text-slate-300 text-base leading-relaxed">
                In today’s job market, both candidates and hiring teams face a structural disconnect: the tools people use to polish applications rarely help them build, rehearse, or demonstrate the underlying capabilities a role actually demands.
              </p>
            </div>

            <div className="mt-12 grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[
                {
                  title: 'A résumé describes experience without demonstrating capability',
                  desc: 'Bullet points can list tools and job titles, yet still leave unclear how someone reasons through trade-offs, structures a deliverable, or handles operational constraints.'
                },
                {
                  title: 'Unclear priorities for a target role',
                  desc: 'Job seekers and career changers often spend weeks studying generic material because they lack a clear breakdown of which specific requirements they already meet versus where their true gaps lie.'
                },
                {
                  title: 'Interview practice lacks actionable, structured coaching',
                  desc: 'Practising alone or with generic prompts rarely shows which rubric criterion an answer missed, why that omission matters to an interviewer, or how to restructure and retry the response.'
                },
                {
                  title: 'Few safe places to rehearse realistic scenarios',
                  desc: 'Most candidates only encounter multi-constraint workplace problems—like debugging a service degradation, reconciling a financial variance, or mediating a stakeholder conflict—when the stakes are already live.'
                },
                {
                  title: 'Learning, practice, and readiness remain disconnected',
                  desc: 'When résumé editing, coursework, skill assessments, and interview prep live in separate tools, progress in one place never informs what you should practise next.'
                },
                {
                  title: 'Employers need verifiable evidence, not opaque AI verdicts',
                  desc: 'Hiring teams need structured work samples, explicit confidence bounds, and accountable human judgment—not black-box AI scores that conflate keyword density with competence.'
                }
              ].map((item) => (
                <div
                  key={item.title}
                  className="bg-[#001f2e] border border-[#063750] rounded-2xl p-6 flex flex-col justify-between"
                >
                  <div>
                    <div className="w-8 h-8 rounded-lg bg-[#FF4103]/15 border border-[#FF4103]/30 flex items-center justify-center text-[#FF4103] mb-4">
                      <AlertCircle className="w-4 h-4" />
                    </div>
                    <h3 className="text-base font-bold text-white mb-2">{item.title}</h3>
                    <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Paper Qualification vs. Capability Development Comparison */}
            <div className="mt-12 grid md:grid-cols-2 gap-6">
              <div className="bg-[#001621] border border-[#002b40] rounded-2xl p-6">
                <div className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
                  Fragmented, Surface-Level Preparation
                </div>
                <ul className="space-y-2.5 text-xs sm:text-sm text-slate-300">
                  <li className="flex items-start gap-2.5">
                    <span className="text-red-400 font-bold mt-0.5">×</span>
                    <span>Rewrites résumé keywords without checking whether you can explain or execute them.</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <span className="text-red-400 font-bold mt-0.5">×</span>
                    <span>Gives a single static quiz score with no measure of uncertainty or misconception teaching.</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <span className="text-red-400 font-bold mt-0.5">×</span>
                    <span>Asks generic interview questions in bulk without probing specific gaps in your answer.</span>
                  </li>
                </ul>
              </div>

              <div className="bg-[#001f2e] border border-[#FF4103]/40 rounded-2xl p-6">
                <div className="text-xs font-bold uppercase tracking-wider text-[#FF4103] mb-3">
                  The Connected IntelliHire Journey
                </div>
                <ul className="space-y-2.5 text-xs sm:text-sm text-slate-200">
                  <li className="flex items-start gap-2.5">
                    <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <span>Treats résumé claims as a starting baseline and identifies exact gaps against your target role.</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <span>Connects learning modules, Bayesian assessments, and realistic task simulations to those gaps.</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <span>Coaches your interview responses turn by turn, lets you retry, and compiles auditable readiness evidence.</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* =====================================================================
            SECTION C: FOUNDER MISSION — WHY WE ARE BUILDING INTELLIHIIRE
           ===================================================================== */}
        <section
          id="mission"
          aria-labelledby="mission-heading"
          className="py-20 bg-[#001621] border-b border-[#00273c]"
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="bg-gradient-to-br from-[#001f2e] to-[#00111a] border border-[#063750] rounded-3xl p-8 sm:p-12">
              <div className="max-w-3xl">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#FF4103]/15 text-[#FF4103] border border-[#FF4103]/30 text-xs font-bold uppercase tracking-wider mb-4">
                  <Compass className="w-3.5 h-3.5" />
                  <span>Platform Mission & Founding Design Philosophy</span>
                </div>
                <h2 id="mission-heading" className="text-3xl sm:text-4xl font-black text-white tracking-tight">
                  Why we are building IntelliHire
                </h2>
                <p className="mt-4 text-base sm:text-lg text-slate-200 leading-relaxed">
                  We are building IntelliHire around a straightforward conviction: <strong className="text-white">career opportunity should not depend solely on how well someone formats a résumé, and AI should never be used to fabricate qualifications or replace human judgment.</strong>
                </p>
                <p className="mt-3 text-sm sm:text-base text-slate-300 leading-relaxed">
                  Too many capable students, career changers, and working professionals get filtered out because they have not had a structured environment to practise the scenarios, tasks, and professional conversations their target role requires. At the same time, organizations struggle to separate polished keyword claims from genuine readiness. Our mission is to bridge that divide with an honest, evidence-grounded development loop.
                </p>
              </div>

              <div className="mt-10 grid md:grid-cols-2 lg:grid-cols-3 gap-5">
                {[
                  {
                    num: '01',
                    title: 'Beyond Résumé Presentation',
                    body: 'A document is a starting summary, not the full measure of a person. We help candidates move from unverified paper claims to practised, observable work samples.'
                  },
                  {
                    num: '02',
                    title: 'A Practical Path to Professional Goals',
                    body: 'Instead of leaving learners to guess what to study next, we connect role requirements directly to gap analysis, targeted learning modules, and hands-on rehearsal.'
                  },
                  {
                    num: '03',
                    title: 'Learning Connected to Realistic Practice',
                    body: 'Reading a concept does not equal mastery. Every learning pathway and assessment in IntelliHire links to practical task simulations and structured explanations.'
                  },
                  {
                    num: '04',
                    title: 'AI as a Coach, Never a Fabricator',
                    body: 'Our AI engines are governed by strict anti-hallucination rules: they explain gaps and suggest structural improvements using bracketed placeholders rather than inventing credentials.'
                  },
                  {
                    num: '05',
                    title: 'Built for Diverse Occupations',
                    body: 'Career readiness is not only for software engineers. Our taxonomy and simulation adapters span Software, Data, Finance, Operations, Healthcare Admin, Legal, Engineering, and Education.'
                  },
                  {
                    num: '06',
                    title: 'Accountable Human Oversight',
                    body: 'Organizations make better talent decisions when source evidence, model interpretation, and measurement uncertainty are kept transparent—and when humans retain sole decision authority.'
                  }
                ].map((principle) => (
                  <div
                    key={principle.num}
                    className="bg-[#001621]/90 border border-[#002f47] rounded-2xl p-5"
                  >
                    <div className="text-xs font-mono font-bold text-[#FF4103] mb-2">
                      Principle {principle.num}
                    </div>
                    <h3 className="text-base font-bold text-white mb-2">{principle.title}</h3>
                    <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">{principle.body}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* =====================================================================
            SECTION D: THE 14-STAGE INTELLIHIIRE LIFECYCLE
           ===================================================================== */}
        <section
          id="lifecycle"
          aria-labelledby="lifecycle-heading"
          className="py-20 bg-[#00111a] border-b border-[#00273c]"
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 mb-10">
              <div className="max-w-3xl">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-[#FF4103]/10 text-[#FF4103] text-xs font-bold uppercase tracking-wider mb-3">
                  Iterative 14-Stage Career Lifecycle
                </div>
                <h2 id="lifecycle-heading" className="text-3xl sm:text-4xl font-black text-white tracking-tight">
                  One Continuous Loop from Discovery to Improvement
                </h2>
                <p className="mt-3 text-sm sm:text-base text-slate-300 leading-relaxed">
                  Career readiness is an iterative cycle, not a one-way funnel. Each stage connects to a real workspace in IntelliHire so you can diagnose gaps, learn, practise, simulate, and reassess as your capabilities grow.
                </p>
              </div>

              {/* Phase Filter Controls */}
              <div className="flex flex-wrap gap-2" role="group" aria-label="Filter lifecycle stages by phase">
                {['All', 'Ground & Diagnose', 'Learn & Rehearse', 'Demonstrate & Verify', 'Synthesize & Iterate'].map(
                  (phase) => (
                    <button
                      key={phase}
                      type="button"
                      onClick={() => setActiveLifecyclePhase(phase)}
                      aria-pressed={activeLifecyclePhase === phase}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF4103] ${
                        activeLifecyclePhase === phase
                          ? 'bg-[#FF4103] text-white'
                          : 'bg-[#001f2e] text-slate-300 border border-[#063750] hover:text-white'
                      }`}
                    >
                      {phase}
                    </button>
                  )
                )}
              </div>
            </div>

            {/* Visual Flow Ribbon */}
            <div
              className="mb-8 p-4 rounded-2xl bg-[#001621] border border-[#063750] overflow-x-auto"
              aria-label="14-Stage Progression Sequence"
            >
              <div className="flex items-center gap-1.5 min-w-max text-xs font-bold">
                {LIFECYCLE_STAGES.map((stage, idx) => (
                  <div key={stage.name} className="flex items-center gap-1.5">
                    <span className="px-2.5 py-1 rounded-lg bg-[#001f2e] border border-[#002f47] text-slate-200">
                      <span className="text-[#FF4103] mr-1">{stage.step}</span>
                      {stage.name}
                    </span>
                    {idx < LIFECYCLE_STAGES.length - 1 && (
                      <ArrowRight className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* 14-Stage Cards Grid */}
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredLifecycleStages.map((stage) => (
                <div
                  key={stage.step}
                  className="bg-[#001f2e] border border-[#063750] rounded-2xl p-5 flex flex-col justify-between hover:border-[#FF4103]/50 transition-colors"
                >
                  <div>
                    <div className="flex items-center justify-between text-[11px] font-mono mb-2">
                      <span className="text-[#FF4103] font-bold">
                        STAGE {stage.step} · {stage.phase.toUpperCase()}
                      </span>
                    </div>
                    <h3 className="text-lg font-bold text-white mb-1.5">{stage.name}</h3>
                    <p className="text-xs font-medium text-slate-200 mb-2">{stage.summary}</p>
                    <p className="text-xs text-slate-400 leading-relaxed mb-4">{stage.detail}</p>
                  </div>

                  <div className="pt-3 border-t border-[#002a40] flex items-center justify-between">
                    <span className="text-[10px] font-mono text-slate-400">{stage.mode}</span>
                    <Link
                      to={stage.route}
                      className="text-xs font-bold text-[#FF4103] hover:text-[#ff7847] inline-flex items-center gap-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF4103] rounded"
                    >
                      <span>{stage.routeLabel}</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* =====================================================================
            SECTION E: ALL FIVE MODULES (M01–M05)
           ===================================================================== */}
        <section
          id="modules"
          aria-labelledby="modules-heading"
          className="py-20 bg-[#001621] border-b border-[#00273c]"
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-3xl mb-14">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-[#FF4103]/10 text-[#FF4103] text-xs font-bold uppercase tracking-wider mb-3">
                Integrated 5-Module Architecture
              </div>
              <h2 id="modules-heading" className="text-3xl sm:text-4xl font-black text-white tracking-tight">
                How the Five IntelliHire Modules Work Together
              </h2>
              <p className="mt-3 text-slate-300 text-base leading-relaxed">
                Each module solves a specific breakdown in the career readiness journey and passes structured, versioned context to the next—without fabricating credentials or automating human hiring decisions.
              </p>
            </div>

            <div className="space-y-8">
              {/* MODULE 1 */}
              <article
                aria-labelledby="m1-title"
                className="bg-[#001f2e] border border-[#063750] rounded-3xl p-6 sm:p-8 lg:p-10 shadow-xl"
              >
                <div className="grid lg:grid-cols-12 gap-8 items-start">
                  <div className="lg:col-span-7 space-y-4">
                    <div className="flex flex-wrap items-center gap-2.5">
                      <span className="px-3 py-1 rounded-lg bg-[#FF4103] text-white text-xs font-black uppercase">
                        Module 1
                      </span>
                      <span className="text-xs font-bold text-[#FF4103] uppercase tracking-wider">
                        Resume Intelligence, Claim Provenance & Hybrid ATS Alignment
                      </span>
                    </div>
                    <h3 id="m1-title" className="text-2xl sm:text-3xl font-black text-white">
                      Understand what your résumé communicates—and what a target role still needs you to prove.
                    </h3>

                    <div className="grid sm:grid-cols-3 gap-4 pt-2">
                      <div className="p-4 rounded-xl bg-[#001621] border border-[#002b40]">
                        <div className="text-[11px] font-bold uppercase text-amber-400 mb-1">The User's Problem</div>
                        <p className="text-xs text-slate-300 leading-relaxed">
                          Candidates rarely know whether their résumé parses cleanly or which specific job-description requirements are unsupported by their documented history.
                        </p>
                      </div>
                      <div className="p-4 rounded-xl bg-[#001621] border border-[#002b40]">
                        <div className="text-[11px] font-bold uppercase text-[#FF4103] mb-1">What M01 Helps You Do</div>
                        <p className="text-xs text-slate-300 leading-relaxed">
                          Upload PDF, DOCX, TXT, or TEX résumés (up to 5 MB), run 3-pass extraction with deterministic PII redaction, analyze target JDs, compute a 4D hybrid ATS score, and export Global or Job-Tailored DOCX résumés.
                        </p>
                      </div>
                      <div className="p-4 rounded-xl bg-[#001621] border border-[#002b40]">
                        <div className="text-[11px] font-bold uppercase text-emerald-400 mb-1">Practical Benefit</div>
                        <p className="text-xs text-slate-300 leading-relaxed">
                          Replaces guesswork with a transparent requirement gap matrix and versioned résumé lineage—without inventing employers, dates, or credentials.
                        </p>
                      </div>
                    </div>

                    <div className="pt-2 flex flex-wrap gap-3">
                      <Link
                        to="/resume"
                        className="px-5 py-2.5 rounded-xl bg-[#FF4103] hover:bg-[#e03200] text-white text-xs sm:text-sm font-bold inline-flex items-center gap-2 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
                      >
                        <FileText className="w-4 h-4" />
                        <span>Explore Module 1 · Resume Intelligence</span>
                        <ArrowRight className="w-4 h-4" />
                      </Link>
                    </div>
                  </div>

                  {/* M01 Real Contract UI Preview */}
                  <div className="lg:col-span-5 bg-[#001621] border border-[#002f47] rounded-2xl p-5 text-xs font-mono space-y-3">
                    <div className="flex items-center justify-between text-slate-400 border-b border-[#00273c] pb-2">
                      <span>M01 Workspace Contract Preview</span>
                      <span className="text-emerald-400">PII Redacted · SHA-256 Cached</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="p-2.5 rounded-lg bg-[#001f2e] border border-[#002b40]">
                        <div className="text-slate-400 text-[10px]">4D Hybrid ATS Composite</div>
                        <div className="text-white font-bold text-sm mt-0.5">Format 30% · Keyword 35%</div>
                      </div>
                      <div className="p-2.5 rounded-lg bg-[#001f2e] border border-[#002b40]">
                        <div className="text-slate-400 text-[10px]">Alignment & Structure</div>
                        <div className="text-white font-bold text-sm mt-0.5">AI 25% · Structure 10%</div>
                      </div>
                    </div>
                    <div className="p-3 rounded-lg bg-[#001f2e] border border-[#002b40] space-y-1.5">
                      <div className="text-[#FF4103] font-bold">3-Pass Extraction & Provenance</div>
                      <div className="text-slate-300">1. Structural segmentation → 2. Entity & claim extraction → 3. O*NET/ESCO domain alignment</div>
                      <div className="text-slate-400 text-[11px]">Exports: Global ATS DOCX & Job-Tailored DOCX</div>
                    </div>
                  </div>
                </div>
              </article>

              {/* MODULE 2 */}
              <article
                aria-labelledby="m2-title"
                className="bg-[#001f2e] border border-[#063750] rounded-3xl p-6 sm:p-8 lg:p-10 shadow-xl"
              >
                <div className="grid lg:grid-cols-12 gap-8 items-start">
                  <div className="lg:col-span-7 space-y-4">
                    <div className="flex flex-wrap items-center gap-2.5">
                      <span className="px-3 py-1 rounded-lg bg-[#FF4103] text-white text-xs font-black uppercase">
                        Module 2
                      </span>
                      <span className="text-xs font-bold text-[#FF4103] uppercase tracking-wider">
                        Adaptive Learning, Bayesian Assessment & Interview Preparation
                      </span>
                    </div>
                    <h3 id="m2-title" className="text-2xl sm:text-3xl font-black text-white">
                      Close skill gaps through adaptive assessment, misconception remediation, and structured study.
                    </h3>

                    <div className="grid sm:grid-cols-3 gap-4 pt-2">
                      <div className="p-4 rounded-xl bg-[#001621] border border-[#002b40]">
                        <div className="text-[11px] font-bold uppercase text-amber-400 mb-1">The User's Problem</div>
                        <p className="text-xs text-slate-300 leading-relaxed">
                          Static multiple-choice tests score answers without explaining underlying misconceptions or separating passive reading from verified skill mastery.
                        </p>
                      </div>
                      <div className="p-4 rounded-xl bg-[#001621] border border-[#002b40]">
                        <div className="text-[11px] font-bold uppercase text-[#FF4103] mb-1">What M02 Helps You Do</div>
                        <p className="text-xs text-slate-300 leading-relaxed">
                          Take Bayesian uncertainty-directed assessments, receive Why-chain and How-chain diagnostic teaching, progress through gated Learning Pathways, and export custom DOCX interview prep guides.
                        </p>
                      </div>
                      <div className="p-4 rounded-xl bg-[#001621] border border-[#002b40]">
                        <div className="text-[11px] font-bold uppercase text-emerald-400 mb-1">Practical Benefit</div>
                        <p className="text-xs text-slate-300 leading-relaxed">
                          Focuses study time on high-uncertainty competencies and verifies conceptual understanding before advancing to complex simulations.
                        </p>
                      </div>
                    </div>

                    <div className="pt-2 flex flex-wrap gap-3">
                      <Link
                        to="/assess"
                        className="px-5 py-2.5 rounded-xl bg-[#FF4103] hover:bg-[#e03200] text-white text-xs sm:text-sm font-bold inline-flex items-center gap-2 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
                      >
                        <Target className="w-4 h-4" />
                        <span>Explore M02 Adaptive Assessment</span>
                        <ArrowRight className="w-4 h-4" />
                      </Link>
                      <Link
                        to="/learning"
                        className="px-4 py-2.5 rounded-xl bg-[#001621] hover:bg-[#00273c] border border-[#063750] text-slate-200 text-xs sm:text-sm font-semibold inline-flex items-center gap-2 transition-colors"
                      >
                        <BookOpen className="w-4 h-4 text-[#FF4103]" />
                        <span>Learning Pathways</span>
                      </Link>
                      <Link
                        to="/interview-prep"
                        className="px-4 py-2.5 rounded-xl bg-[#001621] hover:bg-[#00273c] border border-[#063750] text-slate-200 text-xs sm:text-sm font-semibold inline-flex items-center gap-2 transition-colors"
                      >
                        <span>Interview Prep Guides</span>
                      </Link>
                    </div>
                  </div>

                  {/* M02 Real Contract UI Preview */}
                  <div className="lg:col-span-5 bg-[#001621] border border-[#002f47] rounded-2xl p-5 text-xs font-mono space-y-3">
                    <div className="flex items-center justify-between text-slate-400 border-b border-[#00273c] pb-2">
                      <span>M02 Adaptive & Teaching Engine</span>
                      <span className="text-emerald-400">Completion ≠ Mastery</span>
                    </div>
                    <div className="p-3 rounded-lg bg-[#001f2e] border border-[#002b40] space-y-1">
                      <div className="text-slate-400 text-[10px]">Bayesian Proficiency State</div>
                      <div className="text-white font-bold">Proficiency θ Estimate + Uncertainty SE(θ)</div>
                      <div className="text-slate-300 text-[11px]">Selects next item where skill uncertainty is highest</div>
                    </div>
                    <div className="p-3 rounded-lg bg-[#001f2e] border border-[#002b40] space-y-1">
                      <div className="text-[#FF4103] font-bold">Diagnostic Teaching Payload</div>
                      <div className="text-slate-300">• Why-Chain: Core principle & trade-off rationale</div>
                      <div className="text-slate-300">• How-Chain: Step-by-step remediation & checkpoint gate</div>
                    </div>
                  </div>
                </div>
              </article>

              {/* MODULE 3 */}
              <article
                aria-labelledby="m3-title"
                className="bg-[#001f2e] border border-[#063750] rounded-3xl p-6 sm:p-8 lg:p-10 shadow-xl"
              >
                <div className="grid lg:grid-cols-12 gap-8 items-start">
                  <div className="lg:col-span-7 space-y-4">
                    <div className="flex flex-wrap items-center gap-2.5">
                      <span className="px-3 py-1 rounded-lg bg-[#FF4103] text-white text-xs font-black uppercase">
                        Module 3
                      </span>
                      <span className="text-xs font-bold text-[#FF4103] uppercase tracking-wider">
                        Technical, Domain & Professional Work-Surface Simulation
                      </span>
                    </div>
                    <h3 id="m3-title" className="text-2xl sm:text-3xl font-black text-white">
                      Practise realistic, seniority-scaled workplace tasks across technical and business domains.
                    </h3>

                    <div className="grid sm:grid-cols-3 gap-4 pt-2">
                      <div className="p-4 rounded-xl bg-[#001621] border border-[#002b40]">
                        <div className="text-[11px] font-bold uppercase text-amber-400 mb-1">The User's Problem</div>
                        <p className="text-xs text-slate-300 leading-relaxed">
                          Candidates rarely get to rehearse practical job tasks—or adapt when constraints shift mid-project—until they are already in a live evaluation.
                        </p>
                      </div>
                      <div className="p-4 rounded-xl bg-[#001621] border border-[#002b40]">
                        <div className="text-[11px] font-bold uppercase text-[#FF4103] mb-1">What M03 Helps You Do</div>
                        <p className="text-xs text-slate-300 leading-relaxed">
                          Work through occupation-aware simulations across 9 specialized work-surface adapters, scaled from Entry to Lead seniority, with multi-dimensional rubric debriefs and adaptive Round 2 follow-ups.
                        </p>
                      </div>
                      <div className="p-4 rounded-xl bg-[#001621] border border-[#002b40]">
                        <div className="text-[11px] font-bold uppercase text-emerald-400 mb-1">Practical Benefit</div>
                        <p className="text-xs text-slate-300 leading-relaxed">
                          Builds concrete task artifacts and surfaces specific logic gaps or edge-case omissions you can refine through iterative practice rounds.
                        </p>
                      </div>
                    </div>

                    <div className="pt-2 flex flex-wrap items-center gap-3">
                      <Link
                        to="/simulation"
                        className="px-5 py-2.5 rounded-xl bg-[#FF4103] hover:bg-[#e03200] text-white text-xs sm:text-sm font-bold inline-flex items-center gap-2 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
                      >
                        <Code2 className="w-4 h-4" />
                        <span>Launch M03 Simulation Workspace</span>
                        <ArrowRight className="w-4 h-4" />
                      </Link>
                      <Link
                        to="/module-3"
                        className="px-4 py-2.5 rounded-xl bg-[#001621] hover:bg-[#00273c] border border-[#063750] text-slate-200 text-xs sm:text-sm font-semibold inline-flex items-center gap-2 transition-colors"
                      >
                        <Briefcase className="w-4 h-4 text-[#FF4103]" />
                        <span>Open Role Dispatcher (/module-3)</span>
                      </Link>
                    </div>
                  </div>

                  {/* M03 Real Contract UI Preview */}
                  <div className="lg:col-span-5 bg-[#001621] border border-[#002f47] rounded-2xl p-5 text-xs font-mono space-y-3">
                    <div className="flex items-center justify-between text-slate-400 border-b border-[#00273c] pb-2">
                      <span>Supported M03 Work-Surface Adapters</span>
                      <span className="text-[#FF4103]">Entry → Lead Scaling</span>
                    </div>
                    <div className="grid grid-cols-2 gap-1.5 text-[11px] text-slate-200">
                      <div className="p-2 rounded bg-[#001f2e] border border-[#002b40]">• Code Execution</div>
                      <div className="p-2 rounded bg-[#001f2e] border border-[#002b40]">• SQL Query Sandbox</div>
                      <div className="p-2 rounded bg-[#001f2e] border border-[#002b40]">• Data Analysis</div>
                      <div className="p-2 rounded bg-[#001f2e] border border-[#002b40]">• Financial Table Model</div>
                      <div className="p-2 rounded bg-[#001f2e] border border-[#002b40]">• Operations Decision</div>
                      <div className="p-2 rounded bg-[#001f2e] border border-[#002b40]">• Legal / Exec Memo</div>
                      <div className="p-2 rounded bg-[#001f2e] border border-[#002b40]">• Engineering Calc</div>
                      <div className="p-2 rounded bg-[#001f2e] border border-[#002b40]">• Research & Writing</div>
                    </div>
                    <div className="text-[11px] text-slate-400 leading-relaxed">
                      Note: Single-surface simulation tasks and dynamic archetype synthesis are active today; multi-file IDE workspace expansion (M03 Phase 4) is held on roadmap.
                    </div>
                  </div>
                </div>
              </article>

              {/* MODULE 4 */}
              <article
                aria-labelledby="m4-title"
                className="bg-[#001f2e] border border-[#063750] rounded-3xl p-6 sm:p-8 lg:p-10 shadow-xl"
              >
                <div className="grid lg:grid-cols-12 gap-8 items-start">
                  <div className="lg:col-span-7 space-y-4">
                    <div className="flex flex-wrap items-center gap-2.5">
                      <span className="px-3 py-1 rounded-lg bg-[#FF4103] text-white text-xs font-black uppercase">
                        Module 4
                      </span>
                      <span className="text-xs font-bold text-[#FF4103] uppercase tracking-wider">
                        Behavioral, Communication & Professional Interaction Simulation
                      </span>
                    </div>
                    <h3 id="m4-title" className="text-2xl sm:text-3xl font-black text-white">
                      Practise a 10-question sequential interview with adaptive follow-ups, coaching, and retries.
                    </h3>

                    <div className="grid sm:grid-cols-3 gap-4 pt-2">
                      <div className="p-4 rounded-xl bg-[#001621] border border-[#002b40]">
                        <div className="text-[11px] font-bold uppercase text-amber-400 mb-1">The User's Problem</div>
                        <p className="text-xs text-slate-300 leading-relaxed">
                          Candidates often finish mock interviews without knowing which part of their answer was vague or having the chance to immediately restructure and retry it.
                        </p>
                      </div>
                      <div className="p-4 rounded-xl bg-[#001621] border border-[#002b40]">
                        <div className="text-[11px] font-bold uppercase text-[#FF4103] mb-1">What M04 Helps You Do</div>
                        <p className="text-xs text-slate-300 leading-relaxed">
                          Complete 10 sequential questions personalized to your profile, respond to up to 2 adaptive follow-up probes per question, review STAR/CAR/SOAR/PREP/PAR coaching, and retry answers before advancing.
                        </p>
                      </div>
                      <div className="p-4 rounded-xl bg-[#001621] border border-[#002b40]">
                        <div className="text-[11px] font-bold uppercase text-emerald-400 mb-1">Practical Benefit</div>
                        <p className="text-xs text-slate-300 leading-relaxed">
                          Develops clear, evidence-grounded communication habits while respecting strict privacy boundaries (optional local camera preview, zero video storage, zero biometric inference).
                        </p>
                      </div>
                    </div>

                    <div className="pt-2 flex flex-wrap gap-3">
                      <Link
                        to="/interviews"
                        className="px-5 py-2.5 rounded-xl bg-[#FF4103] hover:bg-[#e03200] text-white text-xs sm:text-sm font-bold inline-flex items-center gap-2 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
                      >
                        <MessageSquare className="w-4 h-4" />
                        <span>Explore Module 4 · Structured Interviews</span>
                        <ArrowRight className="w-4 h-4" />
                      </Link>
                    </div>
                  </div>

                  {/* M04 Real Contract UI Preview */}
                  <div className="lg:col-span-5 bg-[#001621] border border-[#002f47] rounded-2xl p-5 text-xs font-mono space-y-3">
                    <div className="flex items-center justify-between text-slate-400 border-b border-[#00273c] pb-2">
                      <span>M04 Turn-by-Turn Coaching Loop</span>
                      <span className="text-emerald-400">10 Sequential Rounds</span>
                    </div>
                    <div className="p-3 rounded-lg bg-[#001f2e] border border-[#002b40] space-y-1">
                      <div className="text-white font-bold">Adaptive Probing & Answer Coaching</div>
                      <div className="text-slate-300">• Probes missing outcomes, trade-offs, or personal agency (max 2/turn)</div>
                      <div className="text-slate-300">• Coaching tabs: What Worked · What to Improve · Structure · Model Answer</div>
                      <div className="text-slate-300">• Immediate candidate retry with formative delta comparison</div>
                    </div>
                    <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-[11px]">
                      Privacy Invariant: Optional local browser camera preview only. Zero video upload/storage. Zero facial emotion, voice, accent, or personality analysis.
                    </div>
                  </div>
                </div>
              </article>

              {/* MODULE 5 */}
              <article
                aria-labelledby="m5-title"
                className="bg-[#001f2e] border border-[#063750] rounded-3xl p-6 sm:p-8 lg:p-10 shadow-xl"
              >
                <div className="grid lg:grid-cols-12 gap-8 items-start">
                  <div className="lg:col-span-7 space-y-4">
                    <div className="flex flex-wrap items-center gap-2.5">
                      <span className="px-3 py-1 rounded-lg bg-[#FF4103] text-white text-xs font-black uppercase">
                        Module 5
                      </span>
                      <span className="text-xs font-bold text-[#FF4103] uppercase tracking-wider">
                        Candidate Readiness Synthesis & Human Decision Support
                      </span>
                    </div>
                    <h3 id="m5-title" className="text-2xl sm:text-3xl font-black text-white">
                      Synthesize verifiable evidence into clear next steps and human-accountable decisions.
                    </h3>

                    <div className="grid sm:grid-cols-3 gap-4 pt-2">
                      <div className="p-4 rounded-xl bg-[#001621] border border-[#002b40]">
                        <div className="text-[11px] font-bold uppercase text-amber-400 mb-1">The User's Problem</div>
                        <p className="text-xs text-slate-300 leading-relaxed">
                          Opaque composite scores hide what was actually observed, how uncertain the model is, and what the candidate should study or practise next.
                        </p>
                      </div>
                      <div className="p-4 rounded-xl bg-[#001621] border border-[#002b40]">
                        <div className="text-[11px] font-bold uppercase text-[#FF4103] mb-1">What M05 Helps You Do</div>
                        <p className="text-xs text-slate-300 leading-relaxed">
                          Inspect a 5-layer Evidence Ledger across M01–M04, follow closed-loop remediation recommendations, and—for authorized reviewers—record human committee decisions with adverse-impact governance.
                        </p>
                      </div>
                      <div className="p-4 rounded-xl bg-[#001621] border border-[#002b40]">
                        <div className="text-[11px] font-bold uppercase text-emerald-400 mb-1">Practical Benefit</div>
                        <p className="text-xs text-slate-300 leading-relaxed">
                          Gives candidates an actionable improvement roadmap and gives hiring teams auditable evidence while keeping every hiring decision strictly human.
                        </p>
                      </div>
                    </div>

                    <div className="pt-2 flex flex-wrap gap-3">
                      <Link
                        to="/results"
                        className="px-5 py-2.5 rounded-xl bg-[#FF4103] hover:bg-[#e03200] text-white text-xs sm:text-sm font-bold inline-flex items-center gap-2 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
                      >
                        <ShieldCheck className="w-4 h-4" />
                        <span>Explore Module 5 · Readiness & Governance</span>
                        <ArrowRight className="w-4 h-4" />
                      </Link>
                    </div>
                  </div>

                  {/* M05 Real Contract UI Preview */}
                  <div className="lg:col-span-5 bg-[#001621] border border-[#002f47] rounded-2xl p-5 text-xs font-mono space-y-2.5">
                    <div className="flex items-center justify-between text-slate-400 border-b border-[#00273c] pb-2">
                      <span>M05 5-Layer Evidence Separation</span>
                      <span className="text-[#FF4103]">Human Authority Only</span>
                    </div>
                    {[
                      { layer: 'Layer 1 · Source Artifacts', desc: 'Raw résumé files, simulation submissions, turn transcripts' },
                      { layer: 'Layer 2 · Extracted Observations', desc: 'Cited phrases, deterministic test checks, claim spans' },
                      { layer: 'Layer 3 · Model Interpretation', desc: 'Rubric-aligned evaluation & strengths/gaps summary' },
                      { layer: 'Layer 4 · Uncertainty & Coverage', desc: 'Standard error SE(θ), unprobed areas & follow-up counts' },
                      { layer: 'Layer 5 · Human Judgment', desc: 'Independent interviewer ratings & committee decision record' }
                    ].map((l) => (
                      <div key={l.layer} className="p-2.5 rounded-lg bg-[#001f2e] border border-[#002b40]">
                        <div className="text-white font-bold text-[11px]">{l.layer}</div>
                        <div className="text-slate-400 text-[11px]">{l.desc}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </article>
            </div>
          </div>
        </section>

        {/* =====================================================================
            SECTION F: SHOW THE DIFFERENTIATED APPROACH
           ===================================================================== */}
        <section
          id="differentiation"
          aria-labelledby="differentiation-heading"
          className="py-20 bg-[#00111a] border-b border-[#00273c]"
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-3xl mb-12">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-[#FF4103]/10 text-[#FF4103] text-xs font-bold uppercase tracking-wider mb-3">
                Why Our Approach Is Different
              </div>
              <h2 id="differentiation-heading" className="text-3xl sm:text-4xl font-black text-white tracking-tight">
                Seven architectural principles that set IntelliHire apart
              </h2>
              <p className="mt-3 text-slate-300 text-base leading-relaxed">
                We designed IntelliHire so every assessment, simulation, and coaching interaction is explainable, connected, and respectful of human agency.
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[
                {
                  num: '01',
                  title: 'Connected Development',
                  desc: 'Your résumé analysis (M01), learning modules and adaptive assessments (M02), workplace simulations (M03), interview practice (M04), and readiness synthesis (M05) share a unified competency context rather than operating as isolated silos.'
                },
                {
                  num: '02',
                  title: 'Practice Before the Stakes Are Real',
                  desc: 'Rehearse realistic job tasks—including mid-task constraint shifts and contextual interview follow-up probes—in a formative environment where you can inspect feedback and retry.'
                },
                {
                  num: '03',
                  title: 'Evidence Over Empty Scores',
                  desc: 'Feedback cites specific observed statements or task checks and pairs proficiency estimates with explicit uncertainty bounds (±SE(θ)) rather than presenting an opaque single number.'
                },
                {
                  num: '04',
                  title: 'Personalized Next Steps',
                  desc: 'Instead of generic study lists, remediation loops point to the exact skill gaps, rubric criteria, or simulation constraints that need further practice.'
                },
                {
                  num: '05',
                  title: 'Human Agency & Decision Authority',
                  desc: 'AI supports reflection, preparation, and structured evidence organization. It never defines a person’s worth and never makes autonomous hiring or rejection decisions.'
                },
                {
                  num: '06',
                  title: 'Cross-Occupation Ambition',
                  desc: 'Grounded in O*NET and ESCO taxonomies with 9 specialized work-surface adapters supporting Software, Data, Finance, Operations, Legal, Engineering, Healthcare Admin, and Education roles.'
                },
                {
                  num: '07',
                  title: 'Responsible Anti-Hallucination AI',
                  desc: 'When illustrating how to strengthen a résumé bullet or interview answer, IntelliHire uses explicit placeholders like "[your specific metric / team size]"—never fabricating achievements or work history.'
                }
              ].map((pillar, idx) => (
                <div
                  key={pillar.num}
                  className={`bg-[#001f2e] border border-[#063750] rounded-2xl p-6 ${
                    idx === 6 ? 'md:col-span-2 lg:col-span-3' : ''
                  }`}
                >
                  <div className="flex items-center gap-2.5 mb-3">
                    <span className="px-2.5 py-0.5 rounded bg-[#FF4103]/15 border border-[#FF4103]/30 text-[#FF4103] text-xs font-mono font-bold">
                      {pillar.num}
                    </span>
                    <h3 className="text-lg font-bold text-white">{pillar.title}</h3>
                  </div>
                  <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">{pillar.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* =====================================================================
            SECTION G: DEMONSTRATE THE PRODUCT — INTERACTIVE WALKTHROUGH
           ===================================================================== */}
        <section
          id="walkthrough"
          aria-labelledby="walkthrough-heading"
          className="py-20 bg-[#001621] border-b border-[#00273c]"
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 mb-10">
              <div className="max-w-3xl">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs font-bold uppercase tracking-wider mb-3">
                  <Info className="w-3.5 h-3.5" />
                  <span>Illustrative Product Walkthrough · Synthetic Example Grounded in Live Contracts</span>
                </div>
                <h2 id="walkthrough-heading" className="text-3xl sm:text-4xl font-black text-white tracking-tight">
                  See how a candidate progresses from gap diagnosis to practised readiness
                </h2>
                <p className="mt-3 text-sm sm:text-base text-slate-300 leading-relaxed">
                  Step through a practical example showing how IntelliHire connects role requirements, adaptive learning, scenario simulation, interview coaching, and readiness synthesis. All example data below is explicitly labeled as illustrative.
                </p>
              </div>
            </div>

            {/* Interactive Step Selector Tabs */}
            <div
              className="grid grid-cols-1 sm:grid-cols-5 gap-2 mb-8"
              role="tablist"
              aria-label="Product Walkthrough Steps"
            >
              {WALKTHROUGH_STEPS.map((step, index) => (
                <button
                  key={step.id}
                  type="button"
                  role="tab"
                  aria-selected={activeWalkthroughStep === index}
                  aria-controls={`walkthrough-panel-${step.id}`}
                  id={`walkthrough-tab-${step.id}`}
                  onClick={() => setActiveWalkthroughStep(index)}
                  className={`p-3.5 rounded-xl border text-left transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF4103] ${
                    activeWalkthroughStep === index
                      ? 'bg-[#001f2e] border-[#FF4103] text-white shadow-lg shadow-[#FF4103]/10'
                      : 'bg-[#00111a] border-[#002b40] text-slate-400 hover:text-slate-200 hover:border-[#063750]'
                  }`}
                >
                  <div className="text-[11px] font-mono font-bold text-[#FF4103]">STEP 0{index + 1}</div>
                  <div className="text-xs font-bold mt-1 line-clamp-2">{step.title}</div>
                </button>
              ))}
            </div>

            {/* Active Walkthrough Panel */}
            <div
              id={`walkthrough-panel-${currentWalkthrough.id}`}
              role="tabpanel"
              aria-labelledby={`walkthrough-tab-${currentWalkthrough.id}`}
              className="bg-[#001f2e] border border-[#063750] rounded-3xl p-6 sm:p-10 shadow-2xl"
            >
              <div className="grid lg:grid-cols-12 gap-8 items-start">
                <div className="lg:col-span-6 space-y-5">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded bg-[#001621] border border-[#002f47] text-[#FF4103] text-xs font-mono font-bold">
                    {currentWalkthrough.badge}
                  </div>
                  <h3 className="text-2xl font-black text-white leading-snug">{currentWalkthrough.title}</h3>
                  <div className="text-xs font-semibold text-amber-300 bg-amber-500/10 border border-amber-500/30 rounded-lg px-3 py-2">
                    {currentWalkthrough.roleContext}
                  </div>

                  <div className="space-y-3">
                    <div className="p-4 rounded-xl bg-[#001621] border border-[#002b40]">
                      <div className="text-xs font-bold uppercase text-slate-400 mb-1">Scenario Challenge</div>
                      <p className="text-xs sm:text-sm text-slate-200 leading-relaxed">{currentWalkthrough.problem}</p>
                    </div>
                    <div className="p-4 rounded-xl bg-[#001621] border border-[#002b40]">
                      <div className="text-xs font-bold uppercase text-[#FF4103] mb-1">How IntelliHire Responds</div>
                      <p className="text-xs sm:text-sm text-slate-200 leading-relaxed">
                        {currentWalkthrough.systemAction}
                      </p>
                    </div>
                  </div>

                  <div className="pt-2 flex flex-wrap items-center gap-3">
                    <Link
                      to={currentWalkthrough.ctaRoute}
                      className="px-5 py-2.5 rounded-xl bg-[#FF4103] hover:bg-[#e03200] text-white text-xs sm:text-sm font-bold inline-flex items-center gap-2 transition-colors"
                    >
                      <span>{currentWalkthrough.ctaText}</span>
                      <ArrowRight className="w-4 h-4" />
                    </Link>
                    {activeWalkthroughStep < WALKTHROUGH_STEPS.length - 1 && (
                      <button
                        type="button"
                        onClick={() => setActiveWalkthroughStep((prev) => prev + 1)}
                        className="px-4 py-2.5 rounded-xl bg-[#001621] hover:bg-[#00273c] border border-[#063750] text-slate-200 text-xs sm:text-sm font-semibold inline-flex items-center gap-1.5"
                      >
                        <span>Next Step</span>
                        <ChevronRight className="w-4 h-4 text-[#FF4103]" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Right: Structured Contract Output Preview */}
                <div className="lg:col-span-6 bg-[#001621] border border-[#002f47] rounded-2xl p-5 sm:p-6 font-mono text-xs space-y-4">
                  <div className="flex items-center justify-between border-b border-[#00273c] pb-3">
                    <span className="font-bold text-white">{currentWalkthrough.artifactPreview.header}</span>
                    <span className="px-2 py-0.5 rounded bg-amber-500/15 text-amber-300 text-[10px] font-bold">
                      ILLUSTRATIVE SAMPLE
                    </span>
                  </div>

                  <div className="grid sm:grid-cols-2 gap-2.5">
                    {currentWalkthrough.artifactPreview.metrics.map((m) => (
                      <div key={m.label} className="p-3 rounded-xl bg-[#001f2e] border border-[#002b40]">
                        <div className="text-slate-400 text-[10px]">{m.label}</div>
                        <div className="text-white font-bold text-xs mt-1">{m.value}</div>
                      </div>
                    ))}
                  </div>

                  <div className="space-y-2">
                    {currentWalkthrough.artifactPreview.items.map((item) => (
                      <div key={item.text} className="p-3 rounded-xl bg-[#001f2e] border border-[#002b40]">
                        <div className="text-[#FF4103] font-bold text-[10px] mb-0.5">{item.status}</div>
                        <div className="text-slate-200 text-xs font-sans">{item.text}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* =====================================================================
            SECTION H: WHO INTELLIHIIRE SERVES
           ===================================================================== */}
        <section
          id="audiences"
          aria-labelledby="audiences-heading"
          className="py-20 bg-[#00111a] border-b border-[#00273c]"
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-3xl mb-12">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-[#FF4103]/10 text-[#FF4103] text-xs font-bold uppercase tracking-wider mb-3">
                Who IntelliHire Serves
              </div>
              <h2 id="audiences-heading" className="text-3xl sm:text-4xl font-black text-white tracking-tight">
                Built for learners, career movers, educators, and accountable hiring teams
              </h2>
              <p className="mt-3 text-slate-300 text-base leading-relaxed">
                Different audiences engage with IntelliHire through role-appropriate workflows and permissions. Here is how the platform supports each group today.
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Audience 1 */}
              <div className="bg-[#001f2e] border border-[#063750] rounded-2xl p-6 flex flex-col justify-between">
                <div>
                  <div className="w-10 h-10 rounded-xl bg-[#FF4103]/15 border border-[#FF4103]/30 flex items-center justify-center text-[#FF4103] mb-4">
                    <GraduationCap className="w-5 h-5" />
                  </div>
                  <h3 className="text-lg font-bold text-white mb-2">Students & Fresh Graduates</h3>
                  <p className="text-xs font-semibold text-amber-300 mb-2">
                    Challenge: Limited work history makes it hard to stand out on a résumé alone.
                  </p>
                  <p className="text-xs sm:text-sm text-slate-300 leading-relaxed mb-6">
                    Use M01 to structure academic and project claims, M02 to verify foundational skills, M03 to practise entry-level domain tasks, and M04 to rehearse behavioural and technical interviews with structured STAR coaching.
                  </p>
                </div>
                <Link
                  to="/register"
                  className="pt-4 border-t border-[#002a40] text-xs font-bold text-[#FF4103] hover:text-[#ff7847] flex items-center justify-between"
                >
                  <span>Start as a Student / Graduate Candidate</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>

              {/* Audience 2 */}
              <div className="bg-[#001f2e] border border-[#063750] rounded-2xl p-6 flex flex-col justify-between">
                <div>
                  <div className="w-10 h-10 rounded-xl bg-[#FF4103]/15 border border-[#FF4103]/30 flex items-center justify-center text-[#FF4103] mb-4">
                    <RefreshCw className="w-5 h-5" />
                  </div>
                  <h3 className="text-lg font-bold text-white mb-2">Job Seekers & Career Changers</h3>
                  <p className="text-xs font-semibold text-amber-300 mb-2">
                    Challenge: Translating transferable experience and closing targeted gaps for a new domain.
                  </p>
                  <p className="text-xs sm:text-sm text-slate-300 leading-relaxed mb-6">
                    Compare your current résumé against a target job description in M01, follow targeted Learning Pathways in M02, and practise domain-specific tasks in M03 to build demonstrable evidence in your target field.
                  </p>
                </div>
                <Link
                  to="/resume"
                  className="pt-4 border-t border-[#002a40] text-xs font-bold text-[#FF4103] hover:text-[#ff7847] flex items-center justify-between"
                >
                  <span>Run a Target Role Gap Analysis</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>

              {/* Audience 3 */}
              <div className="bg-[#001f2e] border border-[#063750] rounded-2xl p-6 flex flex-col justify-between">
                <div>
                  <div className="w-10 h-10 rounded-xl bg-[#FF4103]/15 border border-[#FF4103]/30 flex items-center justify-center text-[#FF4103] mb-4">
                    <UserCheck className="w-5 h-5" />
                  </div>
                  <h3 className="text-lg font-bold text-white mb-2">Working Professionals Pursuing Advancement</h3>
                  <p className="text-xs font-semibold text-amber-300 mb-2">
                    Challenge: Preparing for senior, staff, or leadership evaluations that test trade-offs and judgment.
                  </p>
                  <p className="text-xs sm:text-sm text-slate-300 leading-relaxed mb-6">
                    Rehearse Senior and Lead-tier simulations with mid-task constraint shifts in M03, and practise articulating architectural, financial, or operational trade-offs under adaptive follow-up probing in M04.
                  </p>
                </div>
                <Link
                  to="/interviews"
                  className="pt-4 border-t border-[#002a40] text-xs font-bold text-[#FF4103] hover:text-[#ff7847] flex items-center justify-between"
                >
                  <span>Practise Senior-Level Interview Probes</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>

              {/* Audience 4 */}
              <div className="bg-[#001f2e] border border-[#063750] rounded-2xl p-6 flex flex-col justify-between">
                <div>
                  <div className="w-10 h-10 rounded-xl bg-[#FF4103]/15 border border-[#FF4103]/30 flex items-center justify-center text-[#FF4103] mb-4">
                    <BookOpen className="w-5 h-5" />
                  </div>
                  <h3 className="text-lg font-bold text-white mb-2">Educators & Career-Development Programs</h3>
                  <p className="text-xs font-semibold text-amber-300 mb-2">
                    Challenge: Helping learners move from passive coursework completion to demonstrable readiness.
                  </p>
                  <p className="text-xs sm:text-sm text-slate-300 leading-relaxed mb-6">
                    Learners can use M02 Learning Pathways (which enforce Completion ≠ Mastery via reassessment checkpoints) and M04 answer coaching. Note: Multi-institution cohort accreditation & ABET/AACSB transcript benchmarking (Priorities 19–21) are planned on our roadmap.
                  </p>
                </div>
                <Link
                  to="/learning"
                  className="pt-4 border-t border-[#002a40] text-xs font-bold text-[#FF4103] hover:text-[#ff7847] flex items-center justify-between"
                >
                  <span>Explore Competency Learning Pathways</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>

              {/* Audience 5 */}
              <div className="bg-[#001f2e] border border-[#063750] rounded-2xl p-6 flex flex-col justify-between md:col-span-2">
                <div>
                  <div className="w-10 h-10 rounded-xl bg-[#FF4103]/15 border border-[#FF4103]/30 flex items-center justify-center text-[#FF4103] mb-4">
                    <Building2 className="w-5 h-5" />
                  </div>
                  <h3 className="text-lg font-bold text-white mb-2">Employers, Recruiters & Talent-Development Teams</h3>
                  <p className="text-xs font-semibold text-amber-300 mb-2">
                    Challenge: Evaluating candidates fairly with job-relevant evidence rather than keyword filters or opaque AI scores.
                  </p>
                  <p className="text-xs sm:text-sm text-slate-300 leading-relaxed mb-6">
                    Authorized Recruiter and Organization Admin accounts can manage open job requisitions and semantic candidate matching (<code className="text-slate-200">/module-3</code>), conduct calibrated panel interviews with independent human ratings (<code className="text-slate-200">/module-4</code>), and record human committee decisions with 5-layer evidence ledgers and EEOC 4/5ths adverse-impact monitoring (<code className="text-slate-200">/module-5</code>). Permissions are strictly role- and tenant-scoped.
                  </p>
                </div>
                <div className="pt-4 border-t border-[#002a40] flex flex-wrap items-center justify-between gap-4">
                  <Link
                    to="/register"
                    className="text-xs font-bold text-[#FF4103] hover:text-[#ff7847] inline-flex items-center gap-1.5"
                  >
                    <span>Register Recruiter / Organization Account</span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                  <Link
                    to="/about"
                    className="text-xs font-semibold text-slate-300 hover:text-white inline-flex items-center gap-1.5"
                  >
                    <span>Review Governance & Methodology</span>
                    <ChevronRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* =====================================================================
            SECTION I: PRICING — TRANSPARENT AND GROUNDED IN THE ACTUAL PRODUCT
           ===================================================================== */}
        <section
          id="pricing"
          aria-labelledby="pricing-heading"
          className="py-20 bg-[#001621] border-b border-[#00273c]"
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-3xl mb-10">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-[#FF4103]/10 text-[#FF4103] text-xs font-bold uppercase tracking-wider mb-3">
                Transparent Access, Quotas & Commercial Status
              </div>
              <h2 id="pricing-heading" className="text-3xl sm:text-4xl font-black text-white tracking-tight">
                Start for free in the Public Sandbox. Honest disclosure on plans and limits.
              </h2>
              <p className="mt-3 text-slate-300 text-base leading-relaxed">
                We believe pricing and usage limits should reflect what is actually enforced in the platform today. Commercial paid billing is not yet active—every candidate signing up today receives full M01–M05 workspace access in our Public Sandbox.
              </p>
            </div>

            {/* Honest Commercial Status Banner */}
            <div className="mb-10 p-5 rounded-2xl bg-[#001f2e] border border-[#063750] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-start gap-3">
                <Info className="w-5 h-5 text-[#FF4103] shrink-0 mt-0.5" />
                <div className="text-xs sm:text-sm text-slate-200 leading-relaxed">
                  <strong className="text-white">Verified Billing & Entitlement Status:</strong> The platform schema (<code className="text-slate-300">organization.tier</code> and <code className="text-slate-300">tenant_quota</code>) provisions <code className="text-slate-300">free</code>, <code className="text-slate-300">pro</code>, and <code className="text-slate-300">enterprise</code> tiers. Paid checkout is not enabled at this stage, so no credit card is required and no artificial paywalls block the 5 modules.
                </div>
              </div>
              <Link
                to="/register"
                className="px-4 py-2 rounded-xl bg-[#FF4103] hover:bg-[#e03200] text-white text-xs font-bold shrink-0"
              >
                Create Free Sandbox Account
              </Link>
            </div>

            {/* 3 Tier Cards Grounded in schema.sql (free, pro, enterprise) */}
            <div className="grid lg:grid-cols-3 gap-6 items-stretch">
              {/* Tier 1: Free / Public Sandbox (Active & Recommended) */}
              <div className="bg-[#001f2e] border-2 border-[#FF4103] rounded-3xl p-7 flex flex-col justify-between shadow-2xl shadow-[#FF4103]/10 relative">
                <div>
                  <div className="flex items-center justify-between gap-2 mb-4">
                    <span className="px-3 py-1 rounded-full bg-[#FF4103] text-white text-[11px] font-black uppercase tracking-wider">
                      Recommended · Active Today
                    </span>
                    <span className="text-xs font-mono text-emerald-400 font-bold">tier: 'free'</span>
                  </div>

                  <h3 className="text-2xl font-black text-white">Public Sandbox / Explore</h3>
                  <div className="mt-3 flex items-baseline gap-2">
                    <span className="text-4xl font-black text-white">$0</span>
                    <span className="text-xs text-slate-400 font-semibold">
                      / public sandbox access · no credit card
                    </span>
                  </div>
                  <p className="mt-3 text-xs sm:text-sm text-slate-300 leading-relaxed">
                    Provisioned automatically into <code className="text-slate-200">IntelliHire Public Sandbox</code> upon Google SSO sign-in. Designed for students, job seekers, and professionals exploring the full 5-module readiness workflow.
                  </p>

                  <div className="mt-6 pt-5 border-t border-[#002a40] space-y-3">
                    <div className="text-xs font-bold uppercase tracking-wider text-slate-300">
                      Verified Available Capabilities & Limits
                    </div>
                    <ul className="space-y-2.5 text-xs text-slate-200">
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                        <span>
                          <strong>M01 Resume Intelligence:</strong> Upload PDF, DOCX, TXT, or TEX files up to <strong>5 MB per file</strong>; 3-pass claim extraction, PII redaction, 4D hybrid ATS match, and Global/Tailored DOCX export.
                        </span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                        <span>
                          <strong>M02 Assessment & Learning:</strong> Adaptive Bayesian assessments, Why/How diagnostic teaching, gated Learning Pathways, and Interview Prep DOCX export.
                        </span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                        <span>
                          <strong>M03 Work-Surface Simulations:</strong> Occupation-aware simulations across 9 work surfaces with seniority scaling and Round 2 constraint shifts.
                        </span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                        <span>
                          <strong>M04 Structured Interviews:</strong> <strong>10 sequential questions</strong> per session, up to <strong>2 adaptive follow-ups</strong> per turn, STAR/CAR/SOAR coaching, answer retries, and optional local camera preview.
                        </span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                        <span>
                          <strong>M05 Readiness Summary:</strong> Personal 5-layer evidence ledger and closed-loop remediation plan.
                        </span>
                      </li>
                      <li className="flex items-start gap-2">
                        <Info className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                        <span>
                          <strong>AI Quota Enforcement:</strong> Shared sandbox tenant allocation of <strong>100 daily AI calls</strong> (rolling 24h UTC reset) with SHA-256 response caching and automatic deterministic fallback if external AI quota is reached.
                        </span>
                      </li>
                    </ul>
                  </div>
                </div>

                <div className="mt-8 pt-4 border-t border-[#002a40]">
                  <Link
                    to="/register"
                    className="w-full py-3.5 px-5 rounded-xl font-bold text-sm text-white bg-gradient-to-r from-[#FF4103] to-[#e03200] hover:from-[#ff5722] hover:to-[#FF4103] shadow-lg shadow-[#FF4103]/25 flex items-center justify-center gap-2 transition-all"
                  >
                    <span>Start Free in Public Sandbox</span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>

              {/* Tier 2: Individual / Intensive Practice (Pro Tier in Schema) */}
              <div className="bg-[#001f2e] border border-[#063750] rounded-3xl p-7 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between gap-2 mb-4">
                    <span className="px-3 py-1 rounded-full bg-slate-800 border border-slate-700 text-slate-300 text-[11px] font-bold uppercase tracking-wider">
                      Planned Commercial Tier
                    </span>
                    <span className="text-xs font-mono text-slate-400">tier: 'pro'</span>
                  </div>

                  <h3 className="text-2xl font-black text-white">Individual Career Growth</h3>
                  <div className="mt-3">
                    <span className="text-xl font-bold text-amber-300">
                      Pricing Not Yet Established
                    </span>
                    <p className="text-xs text-slate-400 mt-1">
                      Included in Public Sandbox during current evaluation phase
                    </p>
                  </div>
                  <p className="mt-3 text-xs sm:text-sm text-slate-300 leading-relaxed">
                    Provisioned in the database schema (<code className="text-slate-200">tier = 'pro'</code>) for dedicated individual AI inference quotas and intensive multi-role practice once commercial billing is introduced.
                  </p>

                  <div className="mt-6 pt-5 border-t border-[#002a40] space-y-3">
                    <div className="text-xs font-bold uppercase tracking-wider text-slate-300">
                      Available Now via Sandbox vs. Planned
                    </div>
                    <ul className="space-y-2.5 text-xs text-slate-300">
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                        <span>
                          <strong>Available Now (in Free Sandbox):</strong> Full access to M01–M05 candidate modules, multi-version résumé history (up to 5 MB/file), adaptive assessments, simulations, and 10-question interview coaching.
                        </span>
                      </li>
                      <li className="flex items-start gap-2">
                        <Info className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                        <span>
                          <strong>Planned for Commercial Release:</strong> Dedicated per-user daily AI inference quota (isolated from the shared public sandbox pool) and self-serve subscription management.
                        </span>
                      </li>
                      <li className="flex items-start gap-2">
                        <Info className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                        <span>
                          <strong>Planned M03 Expansion:</strong> Multi-file workspace simulation environment (M03 Phase 4, currently on hold).
                        </span>
                      </li>
                    </ul>
                  </div>
                </div>

                <div className="mt-8 pt-4 border-t border-[#002a40]">
                  <Link
                    to="/register"
                    className="w-full py-3.5 px-5 rounded-xl font-bold text-sm text-slate-200 bg-[#001621] hover:bg-[#00273c] border border-[#063750] hover:border-[#FF4103]/50 flex items-center justify-center gap-2 transition-colors"
                  >
                    <span>Use Free Sandbox Access Today</span>
                    <ArrowRight className="w-4 h-4 text-[#FF4103]" />
                  </Link>
                </div>
              </div>

              {/* Tier 3: Institution, Team & Enterprise */}
              <div className="bg-[#001f2e] border border-[#063750] rounded-3xl p-7 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between gap-2 mb-4">
                    <span className="px-3 py-1 rounded-full bg-cyan-500/15 border border-cyan-500/30 text-cyan-300 text-[11px] font-bold uppercase tracking-wider">
                      Recruiter & Org Governance
                    </span>
                    <span className="text-xs font-mono text-cyan-400">tier: 'enterprise'</span>
                  </div>

                  <h3 className="text-2xl font-black text-white">Team, Institution & Enterprise</h3>
                  <div className="mt-3">
                    <span className="text-xl font-bold text-cyan-300">
                      Pilot & Role-Gated Access
                    </span>
                    <p className="text-xs text-slate-400 mt-1">
                      Custom commercial pricing not yet established
                    </p>
                  </div>
                  <p className="mt-3 text-xs sm:text-sm text-slate-300 leading-relaxed">
                    Supports recruiting teams, hiring committees, and organizational administrators requiring strict tenant isolation, custom assessment blueprints, and auditable human decision records.
                  </p>

                  <div className="mt-6 pt-5 border-t border-[#002a40] space-y-3">
                    <div className="text-xs font-bold uppercase tracking-wider text-slate-300">
                      Implemented Governance vs. Roadmap
                    </div>
                    <ul className="space-y-2.5 text-xs text-slate-300">
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                        <span>
                          <strong>Implemented Now:</strong> Server-side <code className="text-slate-200">organization_id</code> tenant isolation across D1 tables and immutable <code className="text-slate-200">audit_log</code> / <code className="text-slate-200">m2_audit_event</code> streams.
                        </span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                        <span>
                          <strong>Implemented Now:</strong> Recruiter Requisition Pipeline (<code className="text-slate-200">/module-3</code>), M02 Blueprint & Rubric authoring, M04 independent interviewer rating capture, and M05 Committee Decision Records with EEOC 4/5ths adverse-impact monitoring.
                        </span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                        <span>
                          <strong>Implemented Now:</strong> Organization Admin Control Center (<code className="text-slate-200">/admin</code>) with configurable tenant AI quota tracking (e.g., 500 daily AI calls allocation).
                        </span>
                      </li>
                      <li className="flex items-start gap-2">
                        <Info className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                        <span>
                          <strong>Planned Roadmap (Priorities 19–21):</strong> University curriculum accreditation mapping (ABET/AACSB) and cross-cohort institutional transcript exports.
                        </span>
                      </li>
                    </ul>
                  </div>
                </div>

                <div className="mt-8 pt-4 border-t border-[#002a40] flex flex-col gap-2">
                  <Link
                    to="/register"
                    className="w-full py-3 px-5 rounded-xl font-bold text-xs sm:text-sm text-white bg-[#001621] hover:bg-[#00273c] border border-[#063750] hover:border-cyan-400/50 flex items-center justify-center gap-2 transition-colors"
                  >
                    <span>Explore Recruiter / Org Onboarding</span>
                    <ArrowRight className="w-4 h-4 text-cyan-400" />
                  </Link>
                  <Link
                    to="/about"
                    className="w-full py-2 text-center text-xs font-semibold text-slate-400 hover:text-slate-200"
                  >
                    View Enterprise Governance Specification &rarr;
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* =====================================================================
            SECTION J: TRUST, PRIVACY, AND RESPONSIBLE AI
           ===================================================================== */}
        <section
          id="trust"
          aria-labelledby="trust-heading"
          className="py-20 bg-[#00111a] border-b border-[#00273c]"
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-3xl mb-12">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-bold uppercase tracking-wider mb-3">
                <ShieldCheck className="w-4 h-4" />
                <span>Trust, Privacy & Responsible AI Safeguards</span>
              </div>
              <h2 id="trust-heading" className="text-3xl sm:text-4xl font-black text-white tracking-tight">
                Engineered with verifiable guardrails, not marketing promises
              </h2>
              <p className="mt-3 text-slate-300 text-base leading-relaxed">
                Career and hiring decisions carry real consequences. Every module in IntelliHire enforces technical safeguards that protect candidate dignity, privacy, and human accountability.
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="bg-[#001f2e] border border-[#063750] rounded-2xl p-6">
                <div className="flex items-center gap-2.5 text-emerald-400 font-bold text-sm mb-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <h3>Zero Fabrication of Candidate Facts</h3>
                </div>
                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                  M01 résumé optimization and M04 answer coaching are bound by anti-hallucination validators. When suggesting how to strengthen an answer, the system uses bracketed placeholders (<code className="text-slate-200">[your specific metric / timeline]</code>) rather than inventing employers, degrees, or metrics.
                </p>
              </div>

              <div className="bg-[#001f2e] border border-[#063750] rounded-2xl p-6">
                <div className="flex items-center gap-2.5 text-emerald-400 font-bold text-sm mb-2">
                  <Scale className="w-4 h-4 shrink-0" />
                  <h3>Evidence Separated from Interpretation</h3>
                </div>
                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                  Across M01–M05, raw candidate submissions and extracted text spans are stored separately from AI rubric evaluations and human reviewer notes so anyone inspecting a dossier can trace what the candidate actually wrote or said.
                </p>
              </div>

              <div className="bg-[#001f2e] border border-[#063750] rounded-2xl p-6">
                <div className="flex items-center gap-2.5 text-emerald-400 font-bold text-sm mb-2">
                  <Brain className="w-4 h-4 shrink-0" />
                  <h3>Explicit Measurement Uncertainty</h3>
                </div>
                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                  Proficiency estimates in M02 include Bayesian standard error <code className="text-slate-200">SE(θ)</code>, M04 retry comparisons include formative practice calibration notices, and M05 highlights unprobed areas so low-confidence signals are never mistaken for certainty.
                </p>
              </div>

              <div className="bg-[#001f2e] border border-[#063750] rounded-2xl p-6">
                <div className="flex items-center gap-2.5 text-emerald-400 font-bold text-sm mb-2">
                  <EyeOff className="w-4 h-4 shrink-0" />
                  <h3>Optional Camera & Zero Video Storage</h3>
                </div>
                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                  In M04 interviews, the browser camera starts only after your explicit click, can be stopped at any moment, and is never required. Media tracks run locally in your browser memory—no video frames or audio recordings are uploaded or stored.
                </p>
              </div>

              <div className="bg-[#001f2e] border border-[#063750] rounded-2xl p-6">
                <div className="flex items-center gap-2.5 text-emerald-400 font-bold text-sm mb-2">
                  <ShieldCheck className="w-4 h-4 shrink-0" />
                  <h3>No Biometric, Emotion, or Voice Inference</h3>
                </div>
                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                  IntelliHire strictly prohibits inferring emotion, honesty, confidence, personality traits, protected characteristics, or employability from facial features, eye movement, vocal tone, or accent. Evaluation focuses strictly on verbal content and task structure.
                </p>
              </div>

              <div className="bg-[#001f2e] border border-[#063750] rounded-2xl p-6">
                <div className="flex items-center gap-2.5 text-emerald-400 font-bold text-sm mb-2">
                  <Lock className="w-4 h-4 shrink-0" />
                  <h3>PII Redaction & Human Decision Control</h3>
                </div>
                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                  Deterministic regex filters redact emails, phone numbers, SSNs, street addresses, and personal URLs before external LLM processing. All consequential hiring decisions remain under accountable human authority in M05.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* =====================================================================
            SECTION K: FREQUENTLY ASKED QUESTIONS (FAQ)
           ===================================================================== */}
        <section
          id="faq"
          aria-labelledby="faq-heading"
          className="py-20 bg-[#001621] border-b border-[#00273c]"
        >
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-[#FF4103]/10 text-[#FF4103] text-xs font-bold uppercase tracking-wider mb-3">
                <HelpCircle className="w-3.5 h-3.5" />
                <span>Frequently Asked Questions</span>
              </div>
              <h2 id="faq-heading" className="text-3xl sm:text-4xl font-black text-white tracking-tight">
                Clear answers about capabilities, limits, and privacy
              </h2>
              <p className="mt-3 text-slate-300 text-sm sm:text-base">
                Grounded in what IntelliHire actually implements and enforces today.
              </p>
            </div>

            <div className="space-y-3">
              {FAQ_ITEMS.map((item, idx) => {
                const isOpen = openFaqIndex === idx;
                const buttonId = `faq-question-${idx}`;
                const panelId = `faq-answer-${idx}`;
                return (
                  <div
                    key={item.question}
                    className="bg-[#001f2e] border border-[#063750] rounded-2xl overflow-hidden"
                  >
                    <h3>
                      <button
                        id={buttonId}
                        type="button"
                        aria-expanded={isOpen}
                        aria-controls={panelId}
                        onClick={() => setOpenFaqIndex(isOpen ? null : idx)}
                        className="w-full px-6 py-4 text-left flex items-center justify-between gap-4 text-sm sm:text-base font-bold text-white hover:bg-[#002538] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#FF4103]"
                      >
                        <span>{item.question}</span>
                        <ChevronDown
                          className={`w-5 h-5 text-[#FF4103] shrink-0 transition-transform duration-200 ${
                            isOpen ? 'rotate-180' : ''
                          }`}
                        />
                      </button>
                    </h3>
                    {isOpen && (
                      <div
                        id={panelId}
                        role="region"
                        aria-labelledby={buttonId}
                        className="px-6 pb-5 pt-1 text-xs sm:text-sm text-slate-300 leading-relaxed border-t border-[#002a40]"
                      >
                        {item.answer}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* =====================================================================
            SECTION L: FINAL CONVERSION SECTION
           ===================================================================== */}
        <section
          aria-labelledby="final-cta-heading"
          className="py-20 bg-gradient-to-b from-[#00111a] to-[#001621]"
        >
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <div className="bg-[#001f2e] border border-[#063750] rounded-3xl p-8 sm:p-14 shadow-2xl relative overflow-hidden">
              <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#FF4103]/15 border border-[#FF4103]/30 text-[#FF4103] text-xs font-bold uppercase tracking-wider mb-5">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Take Your Next Career Step</span>
              </div>

              <h2
                id="final-cta-heading"
                className="text-3xl sm:text-5xl font-black text-white tracking-tight leading-tight max-w-3xl mx-auto"
              >
                Build more than a profile.{' '}
                <span className="text-[#FF4103]">Build the readiness behind it.</span>
              </h2>

              <p className="mt-4 text-sm sm:text-base text-slate-300 max-w-2xl mx-auto leading-relaxed">
                Start in the free Public Sandbox to analyze your résumé against a target role, practise adaptive assessments and realistic domain simulations, or rehearse a 10-question structured interview with evidence-grounded coaching.
              </p>

              <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link
                  to="/register"
                  className="w-full sm:w-auto px-8 py-4 rounded-xl font-bold text-sm sm:text-base text-white bg-gradient-to-r from-[#FF4103] to-[#e03200] hover:from-[#ff5722] hover:to-[#FF4103] shadow-xl shadow-[#FF4103]/25 flex items-center justify-center gap-2 transition-all focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#FF4103]/50"
                >
                  <span>Create Free Account & Start Now</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <Link
                  to="/resume"
                  className="w-full sm:w-auto px-6 py-4 rounded-xl font-bold text-sm sm:text-base text-slate-200 bg-[#001621] hover:bg-[#00273c] border border-[#063750] hover:border-[#FF4103]/50 flex items-center justify-center gap-2 transition-colors"
                >
                  <span>Explore M01 Resume Studio</span>
                </Link>
                <Link
                  to="/interviews"
                  className="w-full sm:w-auto px-6 py-4 rounded-xl font-bold text-sm sm:text-base text-slate-200 bg-[#001621] hover:bg-[#00273c] border border-[#063750] hover:border-[#FF4103]/50 flex items-center justify-center gap-2 transition-colors"
                >
                  <span>Practise M04 Interview</span>
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* =====================================================================
          FOOTER
         ===================================================================== */}
      <footer className="mt-auto bg-[#000e16] border-t border-[#00273c] py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-8">
            <div className="col-span-2">
              <div className="flex items-center gap-2.5 mb-4">
                <div className="w-8 h-8 rounded-lg bg-[#FF4103] flex items-center justify-center">
                  <Flame className="w-5 h-5 text-white" />
                </div>
                <span className="font-bold text-lg text-white">IntelliHire</span>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed max-w-sm">
                Evidence-driven career readiness, adaptive learning, assessment, work-surface simulation, and structured interview platform with accountable human decision oversight.
              </p>
              <div className="mt-4 flex flex-wrap gap-3 text-xs text-slate-400">
                <Link to="/login" className="text-[#FF4103] font-semibold hover:underline">
                  Sign In
                </Link>
                <span>·</span>
                <Link to="/register" className="text-slate-200 font-semibold hover:underline">
                  Create Account
                </Link>
                <span>·</span>
                <Link to="/about" className="hover:text-white">
                  Methodology & Governance
                </Link>
              </div>
            </div>

            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200 mb-3">
                Five Modules
              </h3>
              <ul className="space-y-2 text-xs text-slate-400">
                <li>
                  <Link to="/resume" className="hover:text-white">
                    M1 · Resume Intelligence
                  </Link>
                </li>
                <li>
                  <Link to="/assess" className="hover:text-white">
                    M2 · Adaptive Assessment
                  </Link>
                </li>
                <li>
                  <Link to="/learning" className="hover:text-white">
                    M2 · Learning Pathways
                  </Link>
                </li>
                <li>
                  <Link to="/simulation" className="hover:text-white">
                    M3 · Task Simulation
                  </Link>
                </li>
                <li>
                  <Link to="/interviews" className="hover:text-white">
                    M4 · Structured Interviews
                  </Link>
                </li>
                <li>
                  <Link to="/results" className="hover:text-white">
                    M5 · Readiness & Governance
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200 mb-3">
                Product Story
              </h3>
              <ul className="space-y-2 text-xs text-slate-400">
                <li>
                  <a href="#problem" className="hover:text-white">
                    Why IntelliHire Matters
                  </a>
                </li>
                <li>
                  <a href="#mission" className="hover:text-white">
                    Founder Mission & Principles
                  </a>
                </li>
                <li>
                  <a href="#lifecycle" className="hover:text-white">
                    14-Stage Readiness Lifecycle
                  </a>
                </li>
                <li>
                  <a href="#walkthrough" className="hover:text-white">
                    Interactive Walkthrough
                  </a>
                </li>
                <li>
                  <a href="#pricing" className="hover:text-white">
                    Sandbox Access & Quotas
                  </a>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200 mb-3">
                Trust & Account
              </h3>
              <ul className="space-y-2 text-xs text-slate-400">
                <li>
                  <a href="#trust" className="hover:text-white">
                    Responsible AI Safeguards
                  </a>
                </li>
                <li>
                  <a href="#faq" className="hover:text-white">
                    FAQ & Limitations
                  </a>
                </li>
                <li>
                  <Link to="/dashboard" className="hover:text-white">
                    Candidate Workspace
                  </Link>
                </li>
                <li>
                  <Link to="/admin" className="hover:text-white">
                    Organization Governance
                  </Link>
                </li>
              </ul>
            </div>
          </div>

          <div className="mt-10 pt-6 border-t border-[#001e2e] flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
            <div>
              &copy; {new Date().getFullYear()} IntelliHire Universal Evidence Engine. All rights reserved.
            </div>
            <div>
              AI generates evidence and coaching; consequential hiring decisions remain strictly human.
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
