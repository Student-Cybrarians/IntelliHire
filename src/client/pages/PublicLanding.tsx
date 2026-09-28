import { Link } from 'react-router-dom';
import { ArrowRight, Bot, Target, ShieldCheck } from 'lucide-react';

export default function PublicLanding() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-950 p-6">
      
      <header className="absolute top-0 left-0 right-0 p-6 flex justify-between items-center max-w-7xl mx-auto w-full">
        <div className="flex items-center gap-2">
          <Bot className="w-8 h-8 text-brand-500" />
          <span className="text-xl font-bold tracking-tight text-slate-100">IntelliHire</span>
        </div>
        <nav>
          <Link to="/login" className="px-5 py-2.5 rounded-md bg-brand-600 hover:bg-brand-500 text-white font-medium transition-colors">
            Sign In
          </Link>
        </nav>
      </header>

      <main className="max-w-4xl mx-auto text-center mt-20">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-800/50 border border-slate-700/50 text-brand-400 mb-8 text-sm font-medium">
          <span className="flex h-2 w-2 rounded-full bg-brand-500"></span>
          Autonomous Recruitment & Training Engine
        </div>
        
        <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-8 leading-tight">
          Master the Interview. <br/>
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-400 to-sky-300">
            Secure the Offer.
          </span>
        </h1>
        
        <p className="text-xl text-slate-400 mb-12 max-w-2xl mx-auto">
          The ultimate platform for candidates to train with AI-driven simulations, optimize resumes, and prove readiness to top employers.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <Link to="/login" className="px-8 py-4 rounded-lg bg-brand-600 hover:bg-brand-500 text-white font-semibold flex items-center gap-2 text-lg transition-colors w-full sm:w-auto justify-center">
            Start Free Training <ArrowRight className="w-5 h-5" />
          </Link>
        </div>

        <div className="grid md:grid-cols-3 gap-8 mt-24 text-left border-t border-slate-800 pt-16">
          <div className="bg-slate-900/50 p-6 rounded-xl border border-slate-800">
            <Target className="w-10 h-10 text-brand-500 mb-4" />
            <h3 className="text-xl font-semibold mb-2">Adaptive Assessments</h3>
            <p className="text-slate-400">Dynamic 2PL IRT testing that identifies skill gaps and prescribes personalized learning paths.</p>
          </div>
          <div className="bg-slate-900/50 p-6 rounded-xl border border-slate-800">
            <Bot className="w-10 h-10 text-brand-500 mb-4" />
            <h3 className="text-xl font-semibold mb-2">AI Interview Simulator</h3>
            <p className="text-slate-400">Practice behavioral and technical rounds in a safe, isolated sandbox with instant rubric feedback.</p>
          </div>
          <div className="bg-slate-900/50 p-6 rounded-xl border border-slate-800">
            <ShieldCheck className="w-10 h-10 text-brand-500 mb-4" />
            <h3 className="text-xl font-semibold mb-2">Anti-Fabrication Engine</h3>
            <p className="text-slate-400">Prove your skills with cryptographic provenance. Generate resumes that beat the ATS authentically.</p>
          </div>
        </div>
      </main>
    </div>
  );
}
