import { useEffect, useRef, useState } from 'react';
import { Target, FileText, Upload, CheckCircle2, Briefcase, ClipboardCheck, ShieldCheck, Flame, RefreshCw, Zap, ArrowRight, Brain } from 'lucide-react';
import { Link } from 'react-router-dom';

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
      const profileData: any = await profileRes.json();
      const statusData: any = await statusRes.json().catch(() => ({}));
      const jobsData: any = await jobsRes.json();
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
      const data: any = await res.json().catch(() => ({}));
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
      const data: any = await res.json();
      alert(data.success ? `Application submitted. Match score: ${data.matchScore}` : data.error);
    } catch { alert('Network error'); }
    finally { setApplyingId(null); }
  };

  if (loading) return (
    <div className="flex items-center justify-center py-20 text-slate-400">
      <div className="flex items-center gap-3">
        <Flame className="w-6 h-6 text-[#FF4103] animate-spin" />
        <span>Loading your candidate workspace...</span>
      </div>
    </div>
  );

  const readiness = Number(profile?.readiness_score || 0);
  const skills = (() => { try { return JSON.parse(profile?.skills_json || '[]'); } catch { return []; } })();
  const completeness = Math.min(100, Math.round(
    ([profile?.target_role, profile?.experience_level, profile?.primary_domain, skills.length, profile?.bio, resumeStatus?.resume_uploaded]
      .filter(Boolean).length / 6) * 100
  ));

  return (
    <div className="space-y-8">
      {/* Workspace Header */}
      <header className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-5 pb-6 border-b border-[#063750]">
        <div>
          <div className="flex items-center gap-2 text-[#FF4103] text-xs font-bold uppercase tracking-wider mb-2">
            <Flame className="w-4 h-4 text-[#FF4103]" /> 
            <span>Candidate Command Center</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
            Welcome back, {profileName.split(' ')[0]}.
          </h1>
          <p className="text-slate-300 text-sm mt-1.5">
            Build authentic evidence, verify competency proficiency, and improve verified readiness.
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <Link
            to="/assess"
            className="px-4 py-2.5 rounded-xl bg-[#FF4103] hover:bg-[#e03200] text-white text-xs font-bold flex items-center gap-2 shadow-lg shadow-[#FF4103]/20 transition-all"
          >
            <Zap className="w-4 h-4" />
            <span>Take M2 Assessment</span>
          </Link>
          <button 
            onClick={() => load()} 
            className="p-2.5 rounded-xl bg-[#001f2e] border border-[#063750] text-slate-300 hover:text-white hover:bg-[#00273c] transition-colors" 
            title="Refresh"
            aria-label="Refresh workspace"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Readiness & Profile Gauges */}
      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-[#001f2e] border border-[#063750] rounded-2xl p-6 sm:p-7 shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-bold text-white">Profile & Evidence Readiness</h2>
              <p className="text-xs text-slate-400 mt-0.5">Context completeness is maintained separate from verified proficiency.</p>
            </div>
            <span className="text-[#FF4103] font-black text-xl">{completeness}%</span>
          </div>
          
          <div className="h-2.5 bg-[#001824] rounded-full overflow-hidden border border-[#002b40]">
            <div 
              className="h-full bg-gradient-to-r from-[#FF4103] to-[#ff7847] rounded-full transition-all duration-500" 
              style={{ width: `${completeness}%` }}
            />
          </div>

          <div className="grid sm:grid-cols-2 gap-3 mt-6">
            <div className="p-3.5 bg-[#001824] rounded-xl border border-[#002f47]">
              <span className="text-xs text-slate-400 uppercase font-semibold">Target role</span>
              <div className="text-white font-bold text-sm mt-1">{profile?.target_role || 'Not set'}</div>
            </div>
            <div className="p-3.5 bg-[#001824] rounded-xl border border-[#002f47]">
              <span className="text-xs text-slate-400 uppercase font-semibold">Domain</span>
              <div className="text-white font-bold text-sm mt-1">{profile?.primary_domain || 'Not set'}</div>
            </div>
            <div className="p-3.5 bg-[#001824] rounded-xl border border-[#002f47]">
              <span className="text-xs text-slate-400 uppercase font-semibold">Resume Source</span>
              <div className="text-white font-bold text-sm mt-1 truncate">
                {resumeStatus?.resume_uploaded ? resumeStatus.resume.filename : 'Not uploaded'}
              </div>
            </div>
            <div className="p-3.5 bg-[#001824] rounded-xl border border-[#002f47]">
              <span className="text-xs text-slate-400 uppercase font-semibold">Extracted Claims</span>
              <div className="text-[#FF4103] font-bold text-sm mt-1">{claims.length} verified assertions</div>
            </div>
          </div>
        </div>

        <div className="bg-[#001f2e] border border-[#063750] rounded-2xl p-6 sm:p-7 shadow-lg flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 text-slate-300 mb-3">
              <Target className="w-5 h-5 text-[#FF4103]" />
              <span className="font-bold text-sm text-white">Synthesized Readiness</span>
            </div>
            <div className="text-5xl font-black text-white tracking-tight">
              {(readiness * 100).toFixed(0)}%
            </div>
            <p className="text-xs text-slate-400 mt-2 leading-relaxed">
              Synthesized score from verified M1 claim extraction and M2 adaptive assessments. Complete more assessments to reduce uncertainty.
            </p>
          </div>

          <div className="pt-4 border-t border-[#002a40] mt-4">
            <Link
              to="/assess"
              className="w-full py-2.5 rounded-xl bg-[#FF4103]/15 border border-[#FF4103]/40 text-[#FF4103] hover:bg-[#FF4103] hover:text-white text-xs font-bold flex items-center justify-center gap-2 transition-all"
            >
              <span>Verify Next Competency</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>

      {/* Resume Intelligence Section */}
      <section className="bg-[#001f2e] border border-[#063750] rounded-2xl p-6 sm:p-7 shadow-lg">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-[#002a40]">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <FileText className="w-5 h-5 text-[#FF4103]" /> 
              <span>M1 · Resume Intelligence & Extraction</span>
            </h2>
            <p className="text-slate-400 text-xs sm:text-sm mt-1">
              Supports PDF, DOCX, TXT or TEX. Original document remains the immutable evidence source.
            </p>
          </div>
          
          <input 
            ref={fileRef} 
            type="file" 
            accept=".pdf,.docx,.txt,.tex" 
            className="hidden" 
            onChange={e => {
              const file = e.target.files?.[0]; 
              if (file) uploadResume(file); 
              e.currentTarget.value = '';
            }}
          />
          
          <div className="flex gap-2">
            <Link
              to="/resume"
              className="px-4 py-2.5 bg-[#001824] hover:bg-[#002538] border border-[#002f47] text-slate-200 text-xs font-bold rounded-xl flex items-center gap-2 transition-colors"
            >
              Open Studio
            </Link>
            <button 
              disabled={uploading} 
              onClick={() => fileRef.current?.click()} 
              className="px-4 py-2.5 bg-[#FF4103] hover:bg-[#e03200] disabled:opacity-50 text-white rounded-xl flex items-center gap-2 text-xs font-bold shadow-md shadow-[#FF4103]/20 transition-all"
            >
              {uploading ? 'Extracting…' : <><Upload className="w-4 h-4"/> Upload Resume</>}
            </button>
          </div>
        </div>

        {uploadMessage && (
          <div className="mt-4 p-3.5 rounded-xl bg-[#001824] border border-[#002f47] text-xs text-slate-300">
            {uploadMessage}
          </div>
        )}

        <div className="grid md:grid-cols-3 gap-4 mt-6">
          <div className="p-4 rounded-xl bg-[#001824] border border-[#002f47]">
            <ShieldCheck className="w-5 h-5 text-[#FF4103] mb-2" />
            <div className="text-sm font-bold text-white">Source Integrity</div>
            <div className="text-xs text-slate-400 mt-1">
              Original resume evidence is stored in KV with SHA-256 integrity hashes.
            </div>
          </div>
          <div className="p-4 rounded-xl bg-[#001824] border border-[#002f47]">
            <ClipboardCheck className="w-5 h-5 text-[#FF4103] mb-2" />
            <div className="text-sm font-bold text-white">Claim Extraction</div>
            <div className="text-xs text-slate-400 mt-1">
              {claims.length ? `${claims.length} claims extracted with character provenance.` : 'Upload a resume to begin extraction.'}
            </div>
          </div>
          <div className="p-4 rounded-xl bg-[#001824] border border-[#002f47]">
            <CheckCircle2 className="w-5 h-5 text-[#FF4103] mb-2" />
            <div className="text-sm font-bold text-white">Assessment Proof</div>
            <div className="text-xs text-slate-400 mt-1">
              Use M2 Universal Assessment to convert unverified claims into proven capability.
            </div>
          </div>
        </div>
      </section>

      {/* Next Actions Grid */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-white">Recommended Next Actions</h2>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Link 
            to="/interview-prep" 
            className="text-left bg-[#001f2e] border border-[#063750] hover:border-[#FF4103] rounded-2xl p-6 transition-all hover:-translate-y-0.5 group shadow-lg block"
          >
            <Brain className="w-6 h-6 text-[#FF4103] mb-3 group-hover:scale-110 transition-transform" />
            <h3 className="font-bold text-white text-base">Interview Prep</h3>
            <p className="text-xs text-slate-400 mt-1 leading-relaxed">
              Targeted simulation, adaptive questioning, diagnosed gaps, and exportable preparation guide.
            </p>
          </Link>

          <button 
            onClick={() => window.location.href = '/assess'} 
            className="text-left bg-[#001f2e] border border-[#063750] rounded-2xl p-6 hover:border-[#FF4103] transition-all hover:-translate-y-0.5 group shadow-lg"
          >
            <ClipboardCheck className="w-6 h-6 text-[#FF4103] mb-3 group-hover:scale-110 transition-transform" />
            <h3 className="font-bold text-white text-base">Take Assessment</h3>
            <p className="text-xs text-slate-400 mt-1 leading-relaxed">
              Adaptive skill verification with evidence-based proficiency and uncertainty tracking.
            </p>
          </button>
          
          <button 
            onClick={() => fileRef.current?.click()} 
            className="text-left bg-[#001f2e] border border-[#063750] rounded-2xl p-6 hover:border-[#FF4103] transition-all hover:-translate-y-0.5 group shadow-lg"
          >
            <Upload className="w-6 h-6 text-[#FF4103] mb-3 group-hover:scale-110 transition-transform" />
            <h3 className="font-bold text-white text-base">Update Resume</h3>
            <p className="text-xs text-slate-400 mt-1 leading-relaxed">
              Upload a new version to trigger multi-pass extraction and hybrid ATS re-scoring.
            </p>
          </button>
          
          <Link 
            to="/candidate" 
            className="text-left bg-[#001f2e] border border-[#063750] rounded-2xl p-6 hover:border-[#FF4103] transition-all hover:-translate-y-0.5 group shadow-lg block"
          >
            <Briefcase className="w-6 h-6 text-[#FF4103] mb-3 group-hover:scale-110 transition-transform" />
            <h3 className="font-bold text-white text-base">Evidence Portfolio</h3>
            <p className="text-xs text-slate-400 mt-1 leading-relaxed">
              View your full competency radar, verified claims, and exportable Evidence Package.
            </p>
          </Link>
        </div>
      </section>

      {/* Job Board Requisitions */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-white">Live Requisitions & Match Engine</h2>
          <span className="text-xs text-slate-400">{jobs.length} open roles</span>
        </div>
        <div className="grid md:grid-cols-2 gap-4">
          {jobs.length === 0 ? (
            <div className="p-8 bg-[#001f2e] border border-[#063750] rounded-2xl text-slate-400 text-sm text-center md:col-span-2">
              No active job requisitions posted yet. Check back soon.
            </div>
          ) : (
            jobs.map(job => (
              <div key={job.id} className="bg-[#001f2e] border border-[#063750] rounded-2xl p-6 flex flex-col justify-between hover:border-[#FF4103]/50 transition-colors shadow-lg">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-lg font-bold text-white">{job.title}</h3>
                    <p className="text-slate-400 text-xs mt-0.5">{job.department || 'General'}</p>
                  </div>
                  <Briefcase className="w-5 h-5 text-[#FF4103]" />
                </div>
                <button 
                  disabled={applyingId === job.id} 
                  onClick={() => applyToJob(job.id)} 
                  className="w-full mt-4 py-2.5 bg-[#FF4103] hover:bg-[#e03200] disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-md shadow-[#FF4103]/20 transition-all"
                >
                  {applyingId === job.id ? 'Submitting Application...' : 'Apply with Evidence Portfolio'}
                </button>
              </div>
            ))
          )}
        </div>
      </section>

      {/* Extracted Claims Snapshot */}
      {claims.length > 0 && (
        <section className="bg-[#001f2e] border border-[#063750] rounded-2xl p-6 shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-white">Extracted Claim Provenance Snapshot</h2>
            <span className="text-xs text-[#FF4103] font-semibold">{claims.length} claims</span>
          </div>
          <div className="grid md:grid-cols-2 gap-3">
            {claims.slice(0, 8).map((c, i) => (
              <div key={i} className="p-3.5 bg-[#001824] border border-[#002f47] rounded-xl">
                <span className="text-[10px] uppercase font-bold tracking-wider text-[#FF4103] bg-[#FF4103]/10 px-2 py-0.5 rounded">
                  {c.claim_type}
                </span>
                <div className="text-sm font-medium text-slate-200 mt-2">{c.claim_value}</div>
                <div className="text-[11px] text-slate-500 mt-1 flex items-center justify-between">
                  <span>State: {c.verification_state || 'extracted'}</span>
                  <span>Conf: {((c.confidence_score || 0.85) * 100).toFixed(0)}%</span>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}