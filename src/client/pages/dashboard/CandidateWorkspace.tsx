import { useEffect, useRef, useState } from 'react';
import { Target, FileText, Upload, CheckCircle2, Briefcase, ClipboardCheck, ShieldCheck, Sparkles, RefreshCw } from 'lucide-react';

export default function CandidateWorkspace({ profileName }: { profileName: string }) {
  const [profile, setProfile] = useState<any>(null);
  const [resumeStatus, setResumeStatus] = useState<any>(null);
  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadMessage, setUploadMessage] = useState('');
  const [applyingId, setApplyingId] = useState<string | null>(null);
  const [claims, setClaims] = useState<any[]>([]);
  const fileRef = useRef<HTMLInputElement>(null);

  const load = async () => {
    setLoading(true);
    try {
      const [profileRes, statusRes, jobsRes] = await Promise.all([
        fetch('/api/dashboard/candidate'),
        fetch('/api/resume/status'),
        fetch('/api/requisitions')
      ]);
      const profileData = await profileRes.json();
      const statusData = await statusRes.json().catch(() => ({}));
      const jobsData = await jobsRes.json();
      setProfile(profileData.profile || {});
      setResumeStatus(profileData.modules || {});
      setClaims(statusData.claims || []);
      if (jobsData.success) setJobs(jobsData.requisitions || []);
    } finally { setLoading(false); }
  };

  useEffect(() => { load().catch(console.error); }, []);

  const uploadResume = async (file: File) => {
    setUploading(true); setUploadMessage('');
    try {
      const body = new FormData();
      body.append('resume', file);
      const res = await fetch('/api/resume/upload', { method: 'POST', body });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Resume upload failed');
      setUploadMessage(`Resume uploaded successfully (v${data.version || 1}). Extraction status: ${data.status || 'processing'}.`);
      await load();
    } catch (e: any) {
      setUploadMessage(e.message || 'Resume upload failed');
    } finally { setUploading(false); }
  };

  const applyToJob = async (id: string) => {
    setApplyingId(id);
    try {
      const res = await fetch(`/api/requisitions/${id}/apply`, { method: 'POST' });
      const data = await res.json();
      alert(data.success ? `Application submitted. Match score: ${data.matchScore}` : data.error);
    } catch { alert('Network error'); }
    finally { setApplyingId(null); }
  };

  if (loading) return <div className="text-white">Loading your workspace...</div>;

  const readiness = Number(profile?.readiness_score || 0);
  const skills = (() => { try { return JSON.parse(profile?.skills_json || '[]'); } catch { return []; } })();
  const completeness = Math.min(100, Math.round(
    ([profile?.target_role, profile?.experience_level, profile?.primary_domain, skills.length, profile?.bio, resumeStatus?.resume_uploaded]
      .filter(Boolean).length / 6) * 100
  ));

  return (
    <div className="space-y-8">
      <header className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-5">
        <div>
          <div className="flex items-center gap-2 text-brand-400 text-sm font-medium mb-2"><Sparkles className="w-4 h-4"/> Candidate Command Center</div>
          <h1 className="text-3xl font-bold text-white">Welcome back, {profileName.split(' ')[0]}.</h1>
          <p className="text-slate-400 mt-2">Build evidence, verify skills and improve readiness for your target role.</p>
        </div>
        <button onClick={()=>load()} className="self-start lg:self-auto p-2.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 hover:text-white" title="Refresh"><RefreshCw className="w-4 h-4"/></button>
      </header>

      <div className="grid lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4"><div><h2 className="text-lg font-semibold text-white">Profile & Evidence Readiness</h2><p className="text-sm text-slate-500">Context completeness is separate from verified proficiency.</p></div><span className="text-brand-400 font-bold">{completeness}%</span></div>
          <div className="h-2 bg-slate-800 rounded-full overflow-hidden"><div className="h-full bg-brand-500 rounded-full transition-all" style={{width:`${completeness}%`}}/></div>
          <div className="grid sm:grid-cols-2 gap-3 mt-5">
            <div className="p-3 bg-slate-950 rounded-lg border border-slate-800"><span className="text-xs text-slate-500">Target role</span><div className="text-white mt-1">{profile?.target_role || 'Not set'}</div></div>
            <div className="p-3 bg-slate-950 rounded-lg border border-slate-800"><span className="text-xs text-slate-500">Domain</span><div className="text-white mt-1">{profile?.primary_domain || 'Not set'}</div></div>
            <div className="p-3 bg-slate-950 rounded-lg border border-slate-800"><span className="text-xs text-slate-500">Resume</span><div className="text-white mt-1">{resumeStatus?.resume_uploaded ? resumeStatus.resume.filename : 'Not uploaded'}</div></div>
            <div className="p-3 bg-slate-950 rounded-lg border border-slate-800"><span className="text-xs text-slate-500">Extracted claims</span><div className="text-white mt-1">{claims.length}</div></div>
          </div>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
          <div className="flex items-center gap-2 text-slate-300 mb-3"><Target className="w-5 h-5 text-brand-400"/><span>Readiness</span></div>
          <div className="text-4xl font-bold text-white">{(readiness * 100).toFixed(0)}%</div>
          <p className="text-xs text-slate-500 mt-2">Current synthesized score. Complete evidence and assessments to update it.</p>
        </div>
      </div>

      <section className="bg-slate-900 border border-slate-800 rounded-xl p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div><h2 className="text-xl font-semibold text-white flex items-center gap-2"><FileText className="w-5 h-5 text-brand-400"/> Resume Intelligence</h2><p className="text-slate-400 text-sm mt-1">Upload PDF, DOCX, TXT or TEX. Your original document remains the source of truth.</p></div>
          <input ref={fileRef} type="file" accept=".pdf,.docx,.txt,.tex" className="hidden" onChange={e=>{const file=e.target.files?.[0]; if(file) uploadResume(file); e.currentTarget.value='';}}/>
          <button disabled={uploading} onClick={()=>fileRef.current?.click()} className="px-4 py-2.5 bg-brand-600 hover:bg-brand-500 disabled:opacity-50 text-white rounded-lg flex items-center gap-2 font-medium">{uploading ? 'Extracting…' : <><Upload className="w-4 h-4"/> Upload Resume</>}</button>
        </div>
        {uploadMessage && <div className="mt-4 p-3 rounded-lg bg-slate-950 border border-slate-800 text-sm text-slate-300">{uploadMessage}</div>}
        <div className="grid md:grid-cols-3 gap-3 mt-5">
          <div className="p-4 rounded-lg bg-slate-950 border border-slate-800"><ShieldCheck className="w-5 h-5 text-brand-400 mb-2"/><div className="text-sm text-white">Source integrity</div><div className="text-xs text-slate-500 mt-1">Original resume evidence is kept separate from inferred analysis.</div></div>
          <div className="p-4 rounded-lg bg-slate-950 border border-slate-800"><ClipboardCheck className="w-5 h-5 text-brand-400 mb-2"/><div className="text-sm text-white">Claim extraction</div><div className="text-xs text-slate-500 mt-1">{claims.length ? `${claims.length} extracted claims available` : 'Upload a resume to begin extraction.'}</div></div>
          <div className="p-4 rounded-lg bg-slate-950 border border-slate-800"><CheckCircle2 className="w-5 h-5 text-brand-400 mb-2"/><div className="text-sm text-white">Assessment evidence</div><div className="text-xs text-slate-500 mt-1">Use the assessment workflow to verify claimed skills.</div></div>
        </div>
      </section>

      <section>
        <div className="flex items-center justify-between mb-4"><h2 className="text-xl font-semibold text-white">Next Actions</h2></div>
        <div className="grid md:grid-cols-3 gap-4">
          <button onClick={()=>window.location.href='/assessment/skill-1'} className="text-left bg-slate-900 border border-slate-800 rounded-xl p-5 hover:border-brand-500/50 transition-colors"><ClipboardCheck className="w-6 h-6 text-brand-400 mb-3"/><h3 className="font-semibold text-white">Take Assessment</h3><p className="text-sm text-slate-500 mt-1">Generate evidence for a target skill.</p></button>
          <button onClick={()=>fileRef.current?.click()} className="text-left bg-slate-900 border border-slate-800 rounded-xl p-5 hover:border-brand-500/50 transition-colors"><Upload className="w-6 h-6 text-brand-400 mb-3"/><h3 className="font-semibold text-white">Update Resume</h3><p className="text-sm text-slate-500 mt-1">Keep your source context current.</p></button>
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5"><Briefcase className="w-6 h-6 text-brand-400 mb-3"/><h3 className="font-semibold text-white">Explore Jobs</h3><p className="text-sm text-slate-500 mt-1">Review roles below and apply when ready.</p></div>
        </div>
      </section>

      <section>
        <h2 className="text-xl font-semibold text-white mb-4">Job Board</h2>
        <div className="grid md:grid-cols-2 gap-6">
          {jobs.length === 0 ? <p className="text-slate-500">No open jobs posted yet.</p> : jobs.map(job => (
            <div key={job.id} className="bg-slate-900/50 border border-slate-800 rounded-xl p-6 flex flex-col">
              <div className="flex justify-between items-start mb-4"><div><h3 className="text-lg font-semibold text-white">{job.title}</h3><p className="text-slate-400 text-sm">{job.department}</p></div><Briefcase className="w-5 h-5 text-brand-400"/></div>
              <button disabled={applyingId === job.id} onClick={()=>applyToJob(job.id)} className="w-full mt-auto py-2.5 bg-brand-600 hover:bg-brand-500 disabled:opacity-50 text-white font-medium rounded-lg">{applyingId === job.id ? 'Applying...' : 'Apply with IntelliHire'}</button>
            </div>
          ))}
        </div>
      </section>

      {claims.length > 0 && <section className="bg-slate-900 border border-slate-800 rounded-xl p-6"><h2 className="text-xl font-semibold text-white mb-4">Evidence Snapshot</h2><div className="grid md:grid-cols-2 gap-3">{claims.slice(0,8).map((c,i)=><div key={i} className="p-3 bg-slate-950 border border-slate-800 rounded-lg"><span className="text-xs uppercase text-brand-400">{c.claim_type}</span><div className="text-sm text-slate-200 mt-1">{c.claim_value}</div><div className="text-xs text-slate-600 mt-1">State: extracted</div></div>)}</div></section>}
    </div>
  );
}