import { useState } from 'react';
import { Brain, FileText, CheckCircle2, AlertTriangle, Sparkles, UserCheck, ShieldCheck, ChevronRight } from 'lucide-react';
import DashboardLayout from './dashboard/DashboardLayout';

export default function Module4Interviews() {
  const [selectedCandidate, setSelectedCandidate] = useState('Alex Mercer · Senior Cloud Architect');
  const [activeTab, setActiveTab] = useState<'guide' | 'rubric' | 'evaluation'>('guide');

  const questionProtocols = [
    {
      competency: 'Distributed System Resiliency (Diagnosed Gap from M2)',
      question: 'In your M2 scenario, your failover latency exceeded the target SLA. Describe how you would re-architect the consensus protocol between US-East and EU-Central under partitions.',
      focus: 'Measurement of trade-off evaluation under network partition ambiguity.',
      rubricAnchor: 'Senior/Lead Level: Must articulate CAP theorem trade-offs and idempotency keys.'
    },
    {
      competency: 'Cross-Functional Stakeholder Governance',
      question: 'When migrating the legacy data store, the compliance officer raised GDPR retention concerns while engineering needed immediate indexing. Walk us through how you mediated this conflict.',
      focus: 'Verification of ethical governance and negotiation capability.',
      rubricAnchor: 'Competent: Demonstrates clear communication and documented sign-off.'
    }
  ];

  return (
    <DashboardLayout role="recruiter" userFullName="Interview Committee Lead">
      <div className="space-y-8">
        
        {/* Header */}
        <header className="pb-6 border-b border-[#063750]">
          <div className="flex items-center gap-2 text-[#FF4103] text-xs font-bold uppercase tracking-wider mb-2">
            <Brain className="w-4 h-4 text-[#FF4103]" />
            <span>Module 4 · Structured Interview Intelligence</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
            Evidence-Grounded Interview Protocols
          </h1>
          <p className="text-slate-300 text-sm mt-1">
            Dynamic interview guides generated from M2 assessment gaps. Eliminates generic trivia and subjective impressions.
          </p>
        </header>

        {/* Candidate Selector Ribbon */}
        <div className="bg-[#001f2e] border border-[#063750] rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <span className="text-xs font-bold uppercase text-slate-400">Target Candidate Assessment</span>
            <div className="text-base font-bold text-white mt-0.5">{selectedCandidate}</div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setActiveTab('guide')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeTab === 'guide' ? 'bg-[#FF4103] text-white' : 'bg-[#001824] text-slate-300 hover:text-white'
              }`}
            >
              Structured Guide
            </button>
            <button
              onClick={() => setActiveTab('rubric')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeTab === 'rubric' ? 'bg-[#FF4103] text-white' : 'bg-[#001824] text-slate-300 hover:text-white'
              }`}
            >
              Anchored Rubric
            </button>
          </div>
        </div>

        {/* Protocol Cards */}
        <div className="space-y-6">
          {questionProtocols.map((proto, idx) => (
            <div key={idx} className="bg-[#001f2e] border border-[#063750] rounded-2xl p-6 sm:p-7 shadow-lg">
              <div className="flex items-center justify-between pb-3 border-b border-[#002a40] mb-4">
                <span className="text-xs font-bold text-[#FF4103] uppercase tracking-wider">
                  Probe #{idx + 1} · {proto.competency}
                </span>
                <span className="text-[11px] text-slate-400 font-mono">Gap Remediation Target</span>
              </div>

              <h3 className="text-lg font-bold text-white leading-relaxed mb-3">
                "{proto.question}"
              </h3>

              <div className="grid sm:grid-cols-2 gap-4 mt-4 pt-4 border-t border-[#002a40] text-xs">
                <div className="p-3 bg-[#001824] rounded-xl border border-[#002f47]">
                  <span className="text-slate-400 uppercase font-semibold">Evaluation Focus</span>
                  <p className="text-slate-200 mt-1 leading-relaxed">{proto.focus}</p>
                </div>
                <div className="p-3 bg-[#001824] rounded-xl border border-[#002f47]">
                  <span className="text-slate-400 uppercase font-semibold">Anchored Rubric Standard</span>
                  <p className="text-slate-200 mt-1 leading-relaxed">{proto.rubricAnchor}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Evidence Synthesis Footer */}
        <div className="p-6 bg-[#00111a] border border-[#063750] rounded-2xl flex items-center justify-between">
          <div className="flex items-center gap-3">
            <ShieldCheck className="w-5 h-5 text-[#FF4103]" />
            <span className="text-xs text-slate-300">
              Evaluator scoring will automatically link to the candidate's final M5 Evidence Package.
            </span>
          </div>
          <button className="px-4 py-2 bg-[#FF4103] hover:bg-[#e03200] text-white text-xs font-bold rounded-xl transition-all">
            Submit Assessor Sheet
          </button>
        </div>

      </div>
    </DashboardLayout>
  );
}
