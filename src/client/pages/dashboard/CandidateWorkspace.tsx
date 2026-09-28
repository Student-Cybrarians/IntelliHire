import { useEffect, useState } from 'react';
import { Target, FileText, Lock } from 'lucide-react';

export default function CandidateWorkspace({ profileName }: { profileName: string }) {
  const [profile, setProfile] = useState<any>(null);
  const [resumeStatus, setResumeStatus] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch('/api/dashboard/candidate').then(res => res.json()),
      fetch('/api/resume/status').then(res => res.json().then(data => ({ status: res.status, data })))
    ]).then(([profileData, resumeData]: any) => {
      setProfile(profileData.profile);
      setResumeStatus(resumeData);
      setLoading(false);
    }).catch(console.error);
  }, []);

  if (loading) return <div className="text-white">Loading...</div>;

  return (
    <div>
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Welcome back, {profileName.split(' ')[0]}.</h1>
        <p className="text-slate-400">Your readiness score is improving. Next step: Upload your resume for ATS analysis.</p>
      </header>

      {/* Readiness Score Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 mb-8 flex flex-col md:flex-row items-center gap-8">
        <div className="flex-shrink-0 relative">
          <svg className="w-32 h-32 transform -rotate-90">
            <circle cx="64" cy="64" r="56" stroke="currentColor" strokeWidth="12" fill="transparent" className="text-slate-800" />
            <circle cx="64" cy="64" r="56" stroke="currentColor" strokeWidth="12" fill="transparent" strokeDasharray="351.85" strokeDashoffset={351.85 - (351.85 * (profile?.readiness_score || 0))} className="text-brand-500 transition-all duration-1000 ease-out" />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-3xl font-bold text-white">{(profile?.readiness_score ? profile.readiness_score * 100 : 0).toFixed(0)}%</span>
          </div>
        </div>
        <div className="flex-grow">
          <h2 className="text-xl font-semibold text-white mb-2">Target Role Readiness</h2>
          <p className="text-slate-400 mb-4 max-w-lg">Based on your onboarding, we estimate your readiness for a {profile?.experience_level || 'mid'} level role. Complete modules to increase confidence and unlock recruiter visibility.</p>
          <div className="flex gap-4">
            <span className="px-3 py-1 rounded-full bg-slate-800 border border-slate-700 text-xs font-medium text-slate-300">Target: {profile?.target_role || 'Not set'}</span>
            <span className="px-3 py-1 rounded-full bg-slate-800 border border-slate-700 text-xs font-medium text-slate-300">Level: {profile?.experience_level || 'Not set'}</span>
          </div>
        </div>
      </div>

      <h2 className="text-xl font-semibold text-white mb-4">Required Actions</h2>
      
      <div className="grid md:grid-cols-2 gap-6">
        {/* Action Module 1: Resume Intelligence (BLOCKED) */}
        <div className="bg-slate-900/50 border border-slate-800 hover:border-slate-700 rounded-xl p-6 transition-colors flex flex-col">
          <div className="w-12 h-12 bg-amber-500/10 rounded-lg flex items-center justify-center mb-4 border border-amber-500/20">
            <Lock className="w-6 h-6 text-amber-400" />
          </div>
          <h3 className="text-lg font-semibold text-white mb-2">Resume Intelligence</h3>
          
          <div className="text-amber-400/90 text-sm mb-4 flex-grow p-3 bg-amber-500/5 rounded-lg border border-amber-500/10">
            {resumeStatus?.status === 503 ? resumeStatus.data.error : "Module temporarily locked pending security verification."}
          </div>
          
          <button disabled className="w-full py-2.5 bg-slate-800/50 text-slate-500 font-medium rounded-lg cursor-not-allowed">
            Upload Locked
          </button>
        </div>

        {/* Action Module 2 */}
        <div className="bg-slate-900/50 border border-slate-800 hover:border-slate-700 rounded-xl p-6 transition-colors">
          <div className="w-12 h-12 bg-brand-500/10 rounded-lg flex items-center justify-center mb-4">
            <Target className="w-6 h-6 text-brand-500" />
          </div>
          <h3 className="text-lg font-semibold text-white mb-2">Adaptive Blueprint</h3>
          <p className="text-slate-400 text-sm mb-6 h-10">Take the initial 15-minute adaptive CAT assessment to identify your knowledge gaps.</p>
          <button className="w-full py-2.5 bg-slate-800/50 text-slate-500 font-medium rounded-lg cursor-not-allowed">
            Requires Resume First
          </button>
        </div>
      </div>
    </div>
  );
}

