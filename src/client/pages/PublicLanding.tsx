import { Link } from 'react-router-dom';
import { 
  ArrowRight, Flame, Target, ShieldCheck, Brain, 
  Layers, CheckCircle2, Briefcase, Award, Zap, Compass, Users, ChevronRight
} from 'lucide-react';
import Navbar from '../components/Navbar';

export default function PublicLanding() {
  const modules = [
    {
      num: 'M1',
      title: 'Resume Intelligence',
      badge: 'Multi-Pass Extraction',
      description: '4-dimensional hybrid ATS scoring, deterministic PII redaction, and claim provenance verification.',
      link: '/resume',
      icon: Layers,
      color: 'from-[#FF4103] to-[#e03200]'
    },
    {
      num: 'M2',
      title: 'Universal Evidence Engine',
      badge: 'Adaptive Bayesian',
      description: 'Role-aware, multi-modal assessments across any occupation. Measures proficiency with explicit uncertainty ranges.',
      link: '/assess',
      icon: Target,
      color: 'from-[#FF4103] to-[#ff6c38]'
    },
    {
      num: 'M3',
      title: 'Pipeline & Candidate Match',
      badge: 'Deterministic Semantic',
      description: 'High-speed precomputed embedding matching connecting verified candidate portfolios with live job requisitions.',
      link: '/module-3',
      icon: Briefcase,
      color: 'from-[#ff6c38] to-[#FF4103]'
    },
    {
      num: 'M4',
      title: 'Interview Intelligence',
      badge: 'Evidence Synthesis',
      description: 'Competency-anchored structured interview protocols targeting diagnosed gaps rather than subjective impressions.',
      link: '/module-4',
      icon: Brain,
      color: 'from-[#FF4103] to-[#b82500]'
    },
    {
      num: 'M5',
      title: 'Decision Support & Governance',
      badge: 'Human Authority',
      description: 'Comprehensive auditable Evidence Packages. AI generates evidence; humans retain sole hiring decision authority.',
      link: '/module-5',
      icon: ShieldCheck,
      color: 'from-[#b82500] to-[#FF4103]'
    }
  ];

  const occupations = [
    'Technology & AI', 'Healthcare & Clinical', 'Finance & Banking',
    'Operations & Supply', 'Sales & Marketing', 'Engineering & Trades',
    'Legal & Compliance', 'Education & Research'
  ];

  return (
    <div className="min-h-screen bg-[#001621] text-slate-100 flex flex-col selection:bg-[#FF4103] selection:text-white">
      <Navbar />

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-12 pb-24 lg:pt-20 lg:pb-32">
        {/* Volcanic Ambient Glows */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[650px] h-[350px] bg-[#FF4103]/15 rounded-full blur-[140px] pointer-events-none -z-10" />
        <div className="absolute top-10 right-10 w-[300px] h-[300px] bg-[#FF4103]/10 rounded-full blur-[100px] pointer-events-none -z-10" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          
          {/* Badge */}
          <div className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-[#001f2e] border border-[#FF4103]/30 text-white text-xs font-semibold mb-8 shadow-inner shadow-[#FF4103]/10">
            <span className="flex h-2 w-2 rounded-full bg-[#FF4103] animate-ping" />
            <Flame className="w-3.5 h-3.5 text-[#FF4103]" />
            <span>Universal Adaptive Evidence & Competency Assessment Engine</span>
          </div>

          {/* Heading */}
          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black tracking-tight text-white leading-tight max-w-5xl mx-auto">
            Evidence Over Claims. <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#FF4103] via-[#ff7847] to-[#ffaf91]">
              Proficiency Over Keywords.
            </span>
          </h1>

          {/* Subtitle */}
          <p className="mt-6 text-lg sm:text-xl text-slate-300 max-w-3xl mx-auto font-normal leading-relaxed">
            IntelliHire transforms hiring across every occupation. We replace unverified resumes and generic quizzes with role-grounded, multi-modal evidence generation, Bayesian uncertainty modeling, and human-in-the-loop decision intelligence.
          </p>

          {/* CTA Buttons */}
          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              to="/assess"
              className="w-full sm:w-auto px-8 py-4 rounded-xl font-bold text-base text-white bg-gradient-to-r from-[#FF4103] to-[#e03200] hover:from-[#ff5722] hover:to-[#FF4103] shadow-xl shadow-[#FF4103]/25 flex items-center justify-center gap-2 transition-all hover:scale-[1.02] focus:ring-4 focus:ring-[#FF4103]/40"
            >
              <Zap className="w-5 h-5 text-white" />
              <span>Launch Adaptive Assessment</span>
              <ArrowRight className="w-5 h-5" />
            </Link>
            
            <Link
              to="/resume"
              className="w-full sm:w-auto px-8 py-4 rounded-xl font-bold text-base text-slate-200 bg-[#001f2e] hover:bg-[#00273c] border border-[#063750] hover:border-[#FF4103]/50 flex items-center justify-center gap-2 transition-all"
            >
              <Layers className="w-5 h-5 text-[#FF4103]" />
              <span>Analyze Resume Intelligence (M1)</span>
            </Link>
          </div>

          {/* Supported Universal Occupations Pills */}
          <div className="mt-14 pt-8 border-t border-[#00273c] max-w-4xl mx-auto">
            <p className="text-xs uppercase font-bold tracking-wider text-slate-400 mb-4">
              Universal Competency Framework — Built for All Occupations & Seniorities
            </p>
            <div className="flex flex-wrap items-center justify-center gap-2">
              {occupations.map((occ) => (
                <span
                  key={occ}
                  className="px-3 py-1 rounded-lg text-xs font-semibold bg-[#001b2a] border border-[#002b42] text-slate-300 hover:border-[#FF4103]/50 hover:text-white transition-colors"
                >
                  {occ}
                </span>
              ))}
            </div>
          </div>

        </div>
      </section>

      {/* 5-Module Engine Architecture Section */}
      <section id="modules" className="py-20 bg-[#00111a] border-y border-[#00273c]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center max-w-3xl mx-auto mb-16">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-[#FF4103]/10 text-[#FF4103] text-xs font-bold uppercase tracking-wider mb-3">
              Engine Slices M1 – M5
            </div>
            <h2 className="text-3xl sm:text-5xl font-black text-white tracking-tight">
              The 5 Pillars of IntelliHire
            </h2>
            <p className="text-slate-400 mt-4 text-base sm:text-lg">
              Each module performs a verified, evidence-grounded function with strict tenant isolation, cryptographic provenance, and human decision boundaries.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {modules.map((m, idx) => {
              const Icon = m.icon;
              return (
                <div
                  key={m.num}
                  className={`bg-[#001f2e] border border-[#063750] hover:border-[#FF4103]/60 rounded-2xl p-7 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-[#FF4103]/10 flex flex-col justify-between ${
                    idx === 4 ? 'md:col-span-2 lg:col-span-1' : ''
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-5">
                      <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${m.color} flex items-center justify-center shadow-md`}>
                        <Icon className="w-6 h-6 text-white" />
                      </div>
                      <span className="text-xs font-bold uppercase tracking-wider px-2.5 py-1 rounded bg-[#001621] text-[#FF4103] border border-[#FF4103]/30">
                        {m.num}
                      </span>
                    </div>

                    <div className="mb-2 flex items-center gap-2">
                      <span className="text-xs font-semibold text-[#FF4103]">{m.badge}</span>
                    </div>
                    <h3 className="text-xl font-bold text-white mb-2">{m.title}</h3>
                    <p className="text-sm text-slate-300 leading-relaxed mb-6">{m.description}</p>
                  </div>

                  <Link
                    to={m.link}
                    className="pt-4 border-t border-[#002a40] flex items-center justify-between text-sm font-semibold text-[#FF4103] hover:text-[#ff7847] transition-colors group"
                  >
                    <span>Launch {m.num} Workspace</span>
                    <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </Link>
                </div>
              );
            })}
          </div>

        </div>
      </section>

      {/* Human Decision Invariant Feature Highlight */}
      <section className="py-20 bg-[#001621]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-gradient-to-br from-[#001f2e] to-[#00111a] border border-[#063750] rounded-3xl p-8 sm:p-14 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-80 h-80 bg-[#FF4103]/10 rounded-full blur-3xl pointer-events-none" />

            <div className="grid lg:grid-cols-12 gap-8 items-center">
              <div className="lg:col-span-7">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded bg-[#FF4103]/15 text-[#FF4103] text-xs font-bold uppercase tracking-wider mb-4 border border-[#FF4103]/30">
                  <ShieldCheck className="w-4 h-4" />
                  Strict Ethical Invariant
                </div>
                <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight leading-tight">
                  AI Generates Evidence. <br />
                  <span className="text-[#FF4103]">Humans Make the Decisions.</span>
                </h2>
                <p className="text-slate-300 mt-4 leading-relaxed text-base">
                  IntelliHire rejects autonomous "AI hiring scores" and automated candidate rejection algorithms. We provide recruiters and hiring managers with clear, multi-dimensional competency profiles, explicit uncertainty envelopes, and verifiable work samples.
                </p>

                <div className="mt-8 space-y-3">
                  <div className="flex items-center gap-3 text-sm text-slate-200">
                    <CheckCircle2 className="w-5 h-5 text-[#FF4103] shrink-0" />
                    <span>Multi-dimensional proficiency score paired with measurement uncertainty ($\pm SE(\theta)$)</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm text-slate-200">
                    <CheckCircle2 className="w-5 h-5 text-[#FF4103] shrink-0" />
                    <span>Deterministic PII sanitization before any language model evaluation</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm text-slate-200">
                    <CheckCircle2 className="w-5 h-5 text-[#FF4103] shrink-0" />
                    <span>Cryptographic audit trail linking every score to rubrics and source evidence</span>
                  </div>
                </div>

                <div className="mt-8 flex gap-4">
                  <Link
                    to="/about"
                    className="px-6 py-3 rounded-xl font-bold text-sm bg-white text-[#001621] hover:bg-slate-200 transition-colors"
                  >
                    Read Methodology & Governance
                  </Link>
                </div>
              </div>

              <div className="lg:col-span-5 bg-[#001621] border border-[#063750] rounded-2xl p-6 shadow-2xl">
                <div className="text-xs uppercase font-bold text-slate-400 mb-3 flex items-center justify-between">
                  <span>Live Measurement Model</span>
                  <span className="text-[#FF4103]">Active State</span>
                </div>
                <div className="space-y-4 font-mono text-xs">
                  <div className="p-3 bg-[#001f2e] rounded-lg border border-[#002f47]">
                    <div className="text-slate-400">Latent Trait Proficiency</div>
                    <div className="text-white text-base font-bold mt-1">$\theta = +1.42$ (82% Demonstrated)</div>
                  </div>
                  <div className="p-3 bg-[#001f2e] rounded-lg border border-[#002f47]">
                    <div className="text-slate-400">Standard Error / Uncertainty</div>
                    <div className="text-emerald-400 text-base font-bold mt-1">$SE(\theta) = \pm 0.12$ (High Reliability)</div>
                  </div>
                  <div className="p-3 bg-[#001f2e] rounded-lg border border-[#002f47]">
                    <div className="text-slate-400">Evidence Provenance</div>
                    <div className="text-slate-200 mt-1">3 Work Samples · 4 Scenarios · 1 Rubric</div>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto bg-[#000e16] border-t border-[#00273c] py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-lg bg-[#FF4103] flex items-center justify-center">
                  <Flame className="w-5 h-5 text-white" />
                </div>
                <span className="font-bold text-lg text-white">IntelliHire</span>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                Universal Adaptive Evidence Engine & Competency Assessment Architecture.
              </p>
            </div>

            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 mb-3">Workspaces</h4>
              <ul className="space-y-2 text-xs text-slate-400">
                <li><Link to="/resume" className="hover:text-white">M1 · Resume Intelligence</Link></li>
                <li><Link to="/assess" className="hover:text-white">M2 · Adaptive Assessment</Link></li>
                <li><Link to="/module-3" className="hover:text-white">M3 · Talent Pipeline</Link></li>
                <li><Link to="/module-4" className="hover:text-white">M4 · Structured Interviews</Link></li>
                <li><Link to="/module-5" className="hover:text-white">M5 · Decision Analytics</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 mb-3">Platform</h4>
              <ul className="space-y-2 text-xs text-slate-400">
                <li><Link to="/about" className="hover:text-white">About & Methodology</Link></li>
                <li><Link to="/candidate" className="hover:text-white">Candidate Portfolio</Link></li>
                <li><Link to="/dashboard" className="hover:text-white">Command Center</Link></li>
                <li><Link to="/admin" className="hover:text-white">Admin Governance</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 mb-3">Identity</h4>
              <p className="text-xs text-slate-400">
                Brand Palette: <br />
                <span className="text-[#FF4103] font-semibold">Vulcanico (#FF4103)</span> & <br />
                <span className="text-cyan-400 font-semibold">Noturno (#001621)</span>
              </p>
              <div className="mt-4">
                <Link to="/login" className="text-xs font-semibold px-3 py-1.5 rounded bg-[#001f2e] border border-[#063750] text-slate-200 hover:text-white inline-block">
                  Portal Login &rarr;
                </Link>
              </div>
            </div>
          </div>

          <div className="mt-10 pt-6 border-t border-[#001e2e] text-center text-xs text-slate-500">
            &copy; {new Date().getFullYear()} IntelliHire Universal Evidence Engine. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
