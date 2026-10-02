import { useState, useEffect } from 'react';
import { UserCheck, Award, Target, AlertTriangle, ShieldCheck, Download, Flame, CheckCircle2, ChevronRight, BarChart3 } from 'lucide-react';
import { Link } from 'react-router-dom';
import DashboardLayout from './dashboard/DashboardLayout';

export default function CandidateProfile() {
  const [profile, setProfile] = useState<any>(null);
  const [proficiency, setProficiency] = useState<any[]>([]);
  const [gaps, setGaps] = useState<any[]>([]);
  const [claims, setClaims] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    async function loadPortfolio() {
      try {
        const [dashRes, profRes, gapRes, resumeRes] = await Promise.all([
          fetch('/api/dashboard/candidate'),
          fetch('/api/m2/proficiency'),
          fetch('/api/m2/gaps'),
          fetch('/api/resume/status')
        ]);
        const dashData: any = await dashRes.json();
        const profData: any = await profRes.json();
        const gapData: any = await gapRes.json();
        const resumeData: any = await resumeRes.json().catch(() => ({}));

        setProfile(dashData.profile || {});
        setProficiency(profData.proficiency || []);
        setGaps(gapData.gaps || []);
        setClaims(resumeData.claims || []);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    loadPortfolio();
  }, []);

  const exportEvidencePackage = async () => {
    setDownloading(true);
    try {
      const res = await fetch('/api/m2/evidence-package');
      const data: any = await res.json();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `IntelliHire-Evidence-Package-${profile?.target_role || 'Candidate'}.json`;
      a.click();
    } catch (e) {
      alert('Failed to generate exportable package');
    } finally {
      setDownloading(false);
    }
  };

  return (
    <DashboardLayout role="candidate" userFullName={profile?.target_role || 'Candidate'}>
      <div className="space-y-8">
        
        {/* Header */}
        <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[#063750]">
          <div>
            <div className="flex items-center gap-2 text-[#FF4103] text-xs font-bold uppercase tracking-wider mb-2">
              <UserCheck className="w-4 h-4 text-[#FF4103]" />
              <span>Universal Competency Portfolio</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
              Candidate Evidence Portfolio
            </h1>
            <p className="text-slate-300 text-sm mt-1">
              Your verified, tamper-evident competency record. Free from keyword gaming.
            </p>
          </div>

          <button
            onClick={exportEvidencePackage}
            disabled={downloading}
            className="self-start sm:self-auto px-4 py-2.5 rounded-xl bg-[#FF4103] hover:bg-[#e03200] disabled:opacity-50 text-white text-xs font-bold flex items-center gap-2 shadow-lg shadow-[#FF4103]/25 transition-all"
          >
            <Download className="w-4 h-4" />
            <span>{downloading ? 'Compiling Package...' : 'Export Evidence Package'}</span>
          </button>
        </header>

        {/* Profile Summary Card */}
        <div className="bg-[#001f2e] border border-[#063750] rounded-2xl p-6 sm:p-8 shadow-lg">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-6 border-b border-[#002b40]">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-[#FF4103] bg-[#FF4103]/10 px-2.5 py-1 rounded-md border border-[#FF4103]/30">
                {profile?.experience_level || 'Mid'} Level Professional
              </span>
              <h2 className="text-2xl font-bold text-white mt-2">
                {profile?.target_role || 'Software & Systems Specialist'}
              </h2>
              <p className="text-slate-400 text-xs mt-1">Domain: {profile?.primary_domain || 'Technology & Engineering'}</p>
            </div>
            <div className="text-right">
              <span className="text-xs text-slate-400 block">Synthesized Readiness</span>
              <span className="text-3xl font-black text-white text-[#FF4103]">
                {((Number(profile?.readiness_score) || 0.72) * 100).toFixed(0)}%
              </span>
            </div>
          </div>

          <div className="mt-6">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Professional Summary</h4>
            <p className="text-sm text-slate-300 leading-relaxed">
              {profile?.bio || 'No candidate bio submitted yet. Update your profile in onboarding or command center.'}
            </p>
          </div>
        </div>

        {/* Verified Skill Proficiency Breakdown */}
        <section className="bg-[#001f2e] border border-[#063750] rounded-2xl p-6 sm:p-8 shadow-lg">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-xl font-bold text-white flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-[#FF4103]" />
                <span>Verified Skill Proficiency & Uncertainty Envelopes</span>
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Measured using 2-parameter logistic item response models with explicit standard error $\pm SE(\theta)$.
              </p>
            </div>
            <Link to="/assess" className="text-xs font-bold text-[#FF4103] hover:underline flex items-center gap-1">
              <span>Take Assessment</span>
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>

          {proficiency.length === 0 ? (
            <div className="p-8 text-center bg-[#001824] rounded-xl border border-[#002f47]">
              <Target className="w-8 h-8 text-[#FF4103] mx-auto mb-2 opacity-80" />
              <p className="text-sm text-slate-300 font-semibold">No verified assessments recorded yet.</p>
              <p className="text-xs text-slate-500 mt-1">Take your first M2 adaptive simulation to generate verifiable evidence.</p>
              <Link to="/assess" className="mt-4 inline-block px-4 py-2 bg-[#FF4103] text-white font-bold text-xs rounded-lg">
                Begin Assessment
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {proficiency.map((p) => {
                const pct = Math.round((p.proficiency_estimate || 0.7) * 100);
                const unc = Math.round((p.uncertainty_estimate || 0.15) * 100);
                return (
                  <div key={p.skill_id || p.id} className="p-4 bg-[#001824] border border-[#002f47] rounded-xl">
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-bold text-white text-sm">{p.skill_name || 'Competency Node'}</span>
                      <div className="flex items-center gap-3">
                        <span className="text-[#FF4103] font-black text-sm">{pct}%</span>
                        <span className="text-xs text-slate-400 font-mono">SE: &plusmn;{unc}%</span>
                      </div>
                    </div>
                    <div className="h-2 bg-[#00111a] rounded-full overflow-hidden border border-[#002538]">
                      <div className="h-full bg-gradient-to-r from-[#FF4103] to-[#ff7847] rounded-full" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* Actionable Gap Recommendations */}
        {gaps.length > 0 && (
          <section className="bg-[#001f2e] border border-[#063750] rounded-2xl p-6 sm:p-8 shadow-lg">
            <h3 className="text-xl font-bold text-white flex items-center gap-2 mb-4">
              <AlertTriangle className="w-5 h-5 text-amber-400" />
              <span>Evidence-Diagnosed Gaps</span>
            </h3>
            <div className="grid md:grid-cols-2 gap-3">
              {gaps.map((g, i) => (
                <div key={i} className="p-4 bg-[#001824] border border-[#002f47] rounded-xl">
                  <div className="flex justify-between items-start">
                    <span className="font-bold text-white text-sm">{g.skill_name || 'Skill Gap'}</span>
                    <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-amber-500/20 text-amber-400">
                      {g.severity || 'moderate'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-2 leading-relaxed">{g.recommendation || 'Continue targeted practice.'}</p>
                </div>
              ))}
            </div>
          </section>
        )}

      </div>
    </DashboardLayout>
  );
}
