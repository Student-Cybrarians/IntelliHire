import { useEffect, useState } from 'react';
import { Target, FileText, Lock, Briefcase } from 'lucide-react';

export default function CandidateWorkspace({ profileName }: { profileName: string }) {
  const [profile, setProfile] = useState<any>(null);
  const [resumeStatus, setResumeStatus] = useState<any>(null);
  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [applyingId, setApplyingId] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      fetch('/api/dashboard/candidate').then(res => res.json()),
      fetch('/api/resume/status').then(res => res.json().then(data => ({ status: res.status, data }))),
      fetch('/api/requisitions').then(res => res.json())
    ]).then(([profileData, resumeData, reqsData]: any) => {
      setProfile(profileData.profile);
      setResumeStatus(resumeData);
      if (reqsData.success) setJobs(reqsData.requisitions);
      setLoading(false);
    }).catch(console.error);
  }, []);

  const applyToJob = async (id: string) => {
    setApplyingId(id);
    try {
      const res = await fetch(`/api/requisitions/${id}/apply`, { method: 'POST' });
      const data = await res.json() as any;
      if (data.success) {
        alert('Applied successfully! AI Match Score: ' + data.matchScore);
      } else {
        alert('Error: ' + data.error);
      }
    } catch (e) {
      alert('Network error');
    }
    setApplyingId(null);
  };

  if (loading) return <div className="text-white">Loading...</div>;

  return (
    <div>
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Welcome back, {profileName.split(' ')[0]}.</h1>
        <p className="text-slate-400">Your readiness score is improving. Next step: Upload your resume for ATS analysis.</p>
      </header>`n      <div className="mb-8 p-6 bg-brand-500/10 border border-brand-500/20 rounded-xl flex items-center justify-between"><div><h3 className="text-white font-medium mb-1">Verify Your Skills</h3><p className="text-slate-400 text-sm">Take an AI-powered diagnostic to prove your claimed skills and increase your Match Score.</p></div><button onClick={() => window.location.href="/assessment/skill-1"} className="px-4 py-2 bg-brand-600 hover:bg-brand-500 text-white rounded-lg text-sm font-medium transition-colors">Start Assessment</button></div>

      {/* Readiness Score Card (Hidden for brevity, but kept in code) */}
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
          <p className="text-slate-400 mb-4 max-w-lg">Based on your onboarding, we estimate your readiness for a {profile?.experience_level || 'mid'} level role.</p>
          <div className="flex gap-4">
            <span className="px-3 py-1 rounded-full bg-slate-800 border border-slate-700 text-xs font-medium text-slate-300">Target: {profile?.target_role || 'Not set'}</span>
          </div>
        </div>
      </div>

      <h2 className="text-xl font-semibold text-white mb-4">Job Board (AI Matching)</h2>
      
      <div className="grid md:grid-cols-2 gap-6 mb-8">
        {jobs.length === 0 ? <p className="text-slate-400">No jobs posted yet.</p> : jobs.map(job => (
          <div key={job.id} className="bg-slate-900/50 border border-slate-800 rounded-xl p-6 flex flex-col">
            <div className="flex justify-between items-start mb-4">
               <div>
                 <h3 className="text-lg font-semibold text-white">{job.title}</h3>
                 <p className="text-slate-400 text-sm">{job.department}</p>
               </div>
               <div className="w-10 h-10 bg-brand-500/10 rounded-lg flex items-center justify-center border border-brand-500/20">
                 <Briefcase className="w-5 h-5 text-brand-400" />
               </div>
            </div>
            
            <button 
              disabled={applyingId === job.id}
              onClick={() => applyToJob(job.id)}
              className="w-full mt-auto py-2.5 bg-brand-600 hover:bg-brand-500 disabled:opacity-50 text-white font-medium rounded-lg transition-colors">
              {applyingId === job.id ? 'Applying...' : 'Apply with IntelliHire'}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}