import { Link } from 'react-router-dom';
import { 
  Flame, ShieldCheck, Target, Brain, Award, Users, Scale, CheckCircle2, ArrowRight, BookOpen, Layers
} from 'lucide-react';
import Navbar from '../components/Navbar';

export default function About() {
  const principles = [
    {
      title: 'Universal Occupational Scope',
      desc: 'IntelliHire never assumes every candidate is in software. We ground evidence in standard taxonomies (ESCO, O*NET) across healthcare, finance, operations, education, legal, trades, and tech.',
      icon: Users
    },
    {
      title: 'Evidence Over Unverified Claims',
      desc: 'An optimized resume is an assertion, not proof. We evaluate demonstrated performance via multi-modal work samples, dynamic scenarios, and verified tasks.',
      icon: Target
    },
    {
      title: 'Bayesian Uncertainty Representation',
      desc: 'We never reduce human ability to a single opaque percentage. Every proficiency score is accompanied by its standard error SE(θ) and evidence coverage.',
      icon: Brain
    },
    {
      title: 'Strict Human Decision Boundary',
      desc: 'M2 produces verifiable assessment evidence and decision support. AI never autonomously rejects, hires, promotes, or fires candidates. Human authority is non-negotiable.',
      icon: Scale
    }
  ];

  return (
    <div className="min-h-screen bg-[#001621] text-slate-100 flex flex-col selection:bg-[#FF4103] selection:text-white">
      <Navbar />

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#FF4103]/15 text-[#FF4103] border border-[#FF4103]/30 text-xs font-bold uppercase tracking-wider mb-4">
            <Flame className="w-4 h-4" />
            Methodology & Governance
          </div>
          <h1 className="text-4xl sm:text-5xl font-black text-white tracking-tight">
            About IntelliHire Universal Evidence Engine
          </h1>
          <p className="mt-4 text-lg text-slate-300 leading-relaxed">
            The next-generation recruitment intelligence platform designed to eliminate keyword gaming, reduce algorithmic bias, and establish authentic evidence of human competence.
          </p>
        </div>

        {/* Core Principles Grid */}
        <div className="grid md:grid-cols-2 gap-6 mb-16">
          {principles.map((p) => {
            const Icon = p.icon;
            return (
              <div 
                key={p.title}
                className="bg-[#001f2e] border border-[#063750] rounded-2xl p-7 hover:border-[#FF4103]/50 transition-colors shadow-lg"
              >
                <div className="w-12 h-12 rounded-xl bg-[#FF4103]/15 border border-[#FF4103]/30 flex items-center justify-center mb-5 text-[#FF4103]">
                  <Icon className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">{p.title}</h3>
                <p className="text-sm text-slate-300 leading-relaxed">{p.desc}</p>
              </div>
            );
          })}
        </div>

        {/* 5-Module Progression Timeline */}
        <section className="bg-[#00111a] border border-[#063750] rounded-3xl p-8 sm:p-12 mb-16">
          <h2 className="text-2xl sm:text-3xl font-bold text-white mb-2">The 5 Engine Modules</h2>
          <p className="text-sm text-slate-400 mb-8">
            A cohesive architecture connecting source document intake to final human-led employment decisions.
          </p>

          <div className="space-y-6">
            <div className="p-5 bg-[#001f2e] rounded-xl border border-[#002f47] flex gap-4 items-start">
              <div className="w-9 h-9 rounded-lg bg-[#FF4103] text-white flex items-center justify-center font-bold shrink-0 text-sm">
                M1
              </div>
              <div>
                <h4 className="text-base font-bold text-white">Module 1 · Intake, Resume Intelligence & Claim Extraction</h4>
                <p className="text-sm text-slate-300 mt-1">
                  Processes resumes (PDF, DOCX, TXT, TEX) using isolated Python Pyodide workers, performs multi-pass extraction, separates facts from inferences, redacts PII, and applies 4-dimensional hybrid ATS scoring.
                </p>
              </div>
            </div>

            <div className="p-5 bg-[#001f2e] rounded-xl border border-[#002f47] flex gap-4 items-start">
              <div className="w-9 h-9 rounded-lg bg-[#FF4103] text-white flex items-center justify-center font-bold shrink-0 text-sm">
                M2
              </div>
              <div>
                <h4 className="text-base font-bold text-white">Module 2 · Universal Adaptive Evidence & Competency Engine</h4>
                <p className="text-sm text-slate-300 mt-1">
                  Executes Bayesian uncertainty-directed adaptive assessments. Formulates Evidence Strategies based on role, seniority, and purpose, and generates tamper-evident Evidence Packages.
                </p>
              </div>
            </div>

            <div className="p-5 bg-[#001f2e] rounded-xl border border-[#002f47] flex gap-4 items-start">
              <div className="w-9 h-9 rounded-lg bg-[#FF4103] text-white flex items-center justify-center font-bold shrink-0 text-sm">
                M3
              </div>
              <div>
                <h4 className="text-base font-bold text-white">Module 3 · Requisition Matching & Pipeline Orchestration</h4>
                <p className="text-sm text-slate-300 mt-1">
                  Matches candidates against requisitions using precomputed vector embeddings stored in D1. Manages pipeline state transitions with immutable audit event logging.
                </p>
              </div>
            </div>

            <div className="p-5 bg-[#001f2e] rounded-xl border border-[#002f47] flex gap-4 items-start">
              <div className="w-9 h-9 rounded-lg bg-[#FF4103] text-white flex items-center justify-center font-bold shrink-0 text-sm">
                M4
              </div>
              <div>
                <h4 className="text-base font-bold text-white">Module 4 · Structured Interview Intelligence</h4>
                <p className="text-sm text-slate-300 mt-1">
                  Synthesizes evidence from M1 and M2 to generate customized, structured interview guides that probe high-uncertainty areas and diagnosed gaps rather than asking generic questions.
                </p>
              </div>
            </div>

            <div className="p-5 bg-[#001f2e] rounded-xl border border-[#002f47] flex gap-4 items-start">
              <div className="w-9 h-9 rounded-lg bg-[#FF4103] text-white flex items-center justify-center font-bold shrink-0 text-sm">
                M5
              </div>
              <div>
                <h4 className="text-base font-bold text-white">Module 5 · Enterprise Governance & Decision Support</h4>
                <p className="text-sm text-slate-300 mt-1">
                  Provides hiring committees with comprehensive Evidence Packages, adverse impact monitoring, and cryptographic provenance, ensuring final human accountability.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA */}
        <div className="text-center bg-[#001f2e] border border-[#063750] rounded-2xl p-8">
          <h3 className="text-2xl font-bold text-white mb-2">Ready to experience evidence-based hiring?</h3>
          <p className="text-slate-300 text-sm mb-6 max-w-xl mx-auto">
            Explore the candidate workspace or verify your own competency profile today.
          </p>
          <div className="flex justify-center gap-4">
            <Link
              to="/assess"
              className="px-6 py-3 rounded-xl font-bold text-white bg-[#FF4103] hover:bg-[#e03200] transition-colors"
            >
              Take Assessment
            </Link>
            <Link
              to="/dashboard"
              className="px-6 py-3 rounded-xl font-bold text-slate-200 bg-[#001621] border border-[#063750] hover:bg-[#002538] transition-colors"
            >
              Command Center
            </Link>
          </div>
        </div>

      </main>
    </div>
  );
}
