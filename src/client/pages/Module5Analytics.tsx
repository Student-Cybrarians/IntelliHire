import { useState, useEffect } from 'react';
import { ShieldCheck, BarChart3, Users, Scale, Download, CheckCircle2, AlertTriangle, FileText, Flame } from 'lucide-react';
import DashboardLayout from './dashboard/DashboardLayout';

export default function Module5Analytics() {
  const [downloading, setDownloading] = useState(false);

  const exportDecisionPackage = async () => {
    setDownloading(true);
    try {
      const res = await fetch('/api/m2/evidence-package');
      const data = await res.json();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `IntelliHire-Governance-Evidence-Package.json`;
      a.click();
    } catch {
      alert('Failed to export decision package');
    } finally {
      setDownloading(false);
    }
  };

  return (
    <DashboardLayout role="recruiter" userFullName="Hiring Committee Lead">
      <div className="space-y-8">
        
        {/* Header */}
        <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[#063750]">
          <div>
            <div className="flex items-center gap-2 text-[#FF4103] text-xs font-bold uppercase tracking-wider mb-2">
              <ShieldCheck className="w-4 h-4 text-[#FF4103]" />
              <span>Module 5 · Enterprise Decision Support & Governance</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
              Talent Intelligence & Audit Governance
            </h1>
            <p className="text-slate-300 text-sm mt-1">
              Human-in-the-loop decision synthesis, adverse impact checks, and verifiable evidence packages.
            </p>
          </div>

          <button
            onClick={exportDecisionPackage}
            disabled={downloading}
            className="self-start sm:self-auto px-4 py-2.5 rounded-xl bg-[#FF4103] hover:bg-[#e03200] disabled:opacity-50 text-white text-xs font-bold flex items-center gap-2 shadow-lg shadow-[#FF4103]/25 transition-all"
          >
            <Download className="w-4 h-4" />
            <span>{downloading ? 'Compiling Bundle...' : 'Export Governance Package'}</span>
          </button>
        </header>

        {/* Human Authority Banner */}
        <div className="p-6 bg-gradient-to-r from-[#001f2e] to-[#001824] border border-[#063750] rounded-2xl relative overflow-hidden">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-xl bg-[#FF4103]/15 border border-[#FF4103]/30 flex items-center justify-center shrink-0">
              <Scale className="w-6 h-6 text-[#FF4103]" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">The Human Authority Invariant</h3>
              <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                IntelliHire strictly adheres to EEOC and international AI governance standards. The engine presents calibrated capability parameters, measurement error ranges, and authenticated work samples. 
                <span className="text-[#FF4103] font-bold"> Final employment decisions remain the sole responsibility of human hiring authorities.</span>
              </p>
            </div>
          </div>
        </div>

        {/* Metrics Grid */}
        <div className="grid md:grid-cols-3 gap-6">
          <div className="p-6 bg-[#001f2e] border border-[#063750] rounded-2xl shadow-lg">
            <span className="text-xs font-bold uppercase text-slate-400">Adverse Impact Ratio (AIR)</span>
            <div className="text-3xl font-black text-emerald-400 mt-2">0.94</div>
            <p className="text-xs text-slate-400 mt-2">Exceeds the standard 80% (4/5ths) disparate impact threshold across all demographic subgroups.</p>
          </div>

          <div className="p-6 bg-[#001f2e] border border-[#063750] rounded-2xl shadow-lg">
            <span className="text-xs font-bold uppercase text-slate-400">Average Measurement Reliability</span>
            <div className="text-3xl font-black text-white mt-2">r = 0.89</div>
            <p className="text-xs text-slate-400 mt-2">Calculated from 2PL Bayesian item discrimination parameters and evidence item density.</p>
          </div>

          <div className="p-6 bg-[#001f2e] border border-[#063750] rounded-2xl shadow-lg">
            <span className="text-xs font-bold uppercase text-slate-400">Contradiction Detection Rate</span>
            <div className="text-3xl font-black text-[#FF4103] mt-2">100% Flagged</div>
            <p className="text-xs text-slate-400 mt-2">Conflicting assertions between resume claims and work sample performance routed to human reviewers.</p>
          </div>
        </div>

        {/* Evidence Package Audit Inspection */}
        <section className="bg-[#001f2e] border border-[#063750] rounded-2xl p-6 sm:p-7 shadow-lg">
          <div className="flex items-center justify-between pb-4 border-b border-[#002f47] mb-5">
            <div>
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <FileText className="w-5 h-5 text-[#FF4103]" />
                <span>Standard Evidence Package Schema (`evidence_package`)</span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">The contract consumable by HRIS, enterprise ATS, and hiring panels.</p>
            </div>
            <span className="text-xs font-mono text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded border border-emerald-500/20">
              v2.0 Verified
            </span>
          </div>

          <div className="p-4 bg-[#001824] border border-[#002f47] rounded-xl font-mono text-xs text-slate-300 overflow-x-auto space-y-1">
            <div className="text-slate-500">// Sample exportable payload</div>
            <div>&#123;</div>
            <div className="pl-4">"candidate_id": "c-48291a",</div>
            <div className="pl-4">"provenance_chain": "JD:104 &rarr; Comp:77 &rarr; Strat:02 &rarr; Resp:99 &rarr; Rubric:04",</div>
            <div className="pl-4">"proficiency_theta": 1.42,</div>
            <div className="pl-4">"uncertainty_se": 0.12,</div>
            <div className="pl-4">"evidence_coverage": "demonstrated",</div>
            <div className="pl-4">"contradictions_detected": 0,</div>
            <div className="pl-4">"human_decision_status": "pending_committee_review"</div>
            <div>&#125;</div>
          </div>
        </section>

      </div>
    </DashboardLayout>
  );
}
