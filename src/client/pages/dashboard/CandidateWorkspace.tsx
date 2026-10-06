import { useEffect, useRef, useState } from 'react';
import { Target, FileText, Upload, CheckCircle2, Briefcase, ClipboardCheck, ShieldCheck, Flame, RefreshCw, Zap, ArrowRight, Brain, Laptop, GraduationCap, Edit3, X, Check, AlertCircle, Clock, Sparkles } from 'lucide-react';
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
  const [pathways, setPathways] = useState<any[]>([]);
  const [dataState, setDataState] = useState<'current' | 'updating' | 'empty' | 'error'>('empty');
  const [resumeMeta, setResumeMeta] = useState<{ version?: number; filename?: string; extracted_at?: string } | null>(null);

  // Edit Profile modal state
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileSaveMessage, setProfileSaveMessage] = useState('');
  const [editForm, setEditForm] = useState({
    target_role: '',
    primary_domain: '',
    experience_level: 'entry',
    bio: ''
  });

  const fileRef = useRef<HTMLInputElement>(null);

  const load = async () => {
    setLoading(true);
    try {
      const [profileRes, statusRes, jobsRes, pathwaysRes] = await Promise.all([
        fetch('/api/dashboard/candidate'),
        fetch('/api/resume/status'),
        fetch('/api/requisitions'),
        fetch('/api/training/pathways').catch(() => null)
      ]);
      const profileData: any = await profileRes.json().catch(() => ({}));
      const statusData: any = await statusRes.json().catch(() => ({}));
      const jobsData: any = await jobsRes.json().catch(() => ({}));
      
      const prof = profileData.profile || {};
      setProfile(prof);
      setEditForm({
        target_role: prof.target_role || '',
        primary_domain: prof.primary_domain || '',
        experience_level: prof.experience_level || 'entry',
        bio: prof.bio || ''
      });

      setResumeStatus(profileData.modules || {});
      setClaims(statusData.claims || []);
      setDataState(statusData.data_state || (statusData.claims?.length ? 'current' : 'empty'));
      setResumeMeta({
        version: statusData.source_version || profileData.modules?.source_version,
        filename: statusData.source_filename || profileData.modules?.source_filename,
        extracted_at: statusData.extracted_at
      });

      if (jobsData.success) setJobs(jobsData.requisitions || []);

      if (pathwaysRes && pathwaysRes.ok) {
        const pData: any = await pathwaysRes.json().catch(() => ({}));
        if (pData.success && Array.isArray(pData.pathways)) {
          setPathways(pData.pathways);
        }
      }
    } finally { setLoading(false); }
  };

  useEffect(() => { load().catch(console.error); }, []);

  const uploadResume = async (file: File) => {
    setUploading(true); 
    setUploadMessage('Uploading resume document...');
    try {
      const body = new FormData();
      body.append('file', file);
      const res = await fetch('/api/resume/upload', { method: 'POST', body });
      const data: any = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Resume upload failed');

      setUploadMessage(`Resume uploaded (v${data.version || 1}). Running multi-pass competency extraction...`);
      if (data.resumeId) {
        setDataState('updating');
        const extractRes = await fetch(`/api/resume/extract/${data.resumeId}`, { method: 'POST' });
        const extractData: any = await extractRes.json().catch(() => ({}));
        if (extractRes.ok) {
          setUploadMessage(`Resume v${data.version} extracted successfully. ${extractData?.data?.skills?.length || 0} skills aligned.`);
        } else {
          setUploadMessage(`Resume uploaded (v${data.version}), extraction queued.`);
        }
      }
      await load();
    } catch (e: any) {
      setUploadMessage(e.message || 'Resume upload failed');
    } finally { setUploading(false); }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingProfile(true);
    setProfileSaveMessage('');
    try {
      const res = await fetch('/api/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editForm)
      });
      const data: any = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Failed to update profile');
      setProfileSaveMessage('Profile updated successfully.');
      await load();
      setTimeout(() => {
        setIsEditingProfile(false);
        setProfileSaveMessage('');
      }, 700);
    } catch (err: any) {
      setProfileSaveMessage(err.message || 'Error saving profile');
    } finally {
      setSavingProfile(false);
    }
  };

  const applyToJob = async (id: string) => {
    setApplyingId(id);
    try {
      const res = await fetch(`/api/requisitions/${id}/apply`, { method: 'POST' });
      const data: any = await res.json();
      alert(data.success ? `Application submitted! Match score: ${data.matchScore}%\nReasoning: ${data.matchReasoning}` : data.error);
      await load();
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
            <CheckCircle2 className="w-4 h-4 text-[#FF4103]" /> 
            <span>Dashboard · Learning Progress</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
            Welcome back, {profileName.split(' ')[0]}.
          </h1>
          <p className="text-slate-300 text-sm mt-1.5">
            Track your personalized learning pathways, verified competencies, and end-to-end module progression.
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <Link
            to="/assess"
            className="px-4 py-2.5 rounded-xl bg-[#FF4103] hover:bg-[#e03200] text-white text-xs font-bold flex items-center gap-2 shadow-lg shadow-[#FF4103]/20 transition-all"
          >
            <Zap className="w-4 h-4" />
            <span>Practice Aptitude Assessment</span>
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

      {/* Candidate Module Progression Strip */}
      <section className="bg-[#001f2e] border border-[#063750] rounded-2xl p-5 shadow-lg">
        <div className="flex items-center justify-between mb-3.5">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#FF4103] animate-pulse" />
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-300">Candidate Journey · Module Progression</h2>
          </div>
          <span className="text-[11px] text-slate-400">5 Continuous Competency Stages</span>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {/* Module 1 */}
          <Link 
            to="/resume"
            className="p-3 rounded-xl bg-[#001824] border border-[#002f47] hover:border-[#FF4103]/60 transition-all group flex flex-col justify-between"
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#FF4103]">Module 1</span>
              <FileText className="w-3.5 h-3.5 text-slate-400 group-hover:text-[#FF4103] transition-colors" />
            </div>
            <div className="mt-2">
              <p className="text-xs font-bold text-white group-hover:text-[#FF4103] transition-colors truncate">Resume Intelligence</p>
              <p className="text-[11px] text-slate-400 mt-0.5 truncate">
                {resumeStatus?.resume_uploaded ? `Active v${resumeMeta?.version || 1}` : 'Upload Resume'}
              </p>
            </div>
          </Link>

          {/* Module 2 */}
          <Link 
            to="/assess"
            className="p-3 rounded-xl bg-[#001824] border border-[#002f47] hover:border-[#FF4103]/60 transition-all group flex flex-col justify-between"
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#FF4103]">Module 2</span>
              <Target className="w-3.5 h-3.5 text-slate-400 group-hover:text-[#FF4103] transition-colors" />
            </div>
            <div className="mt-2">
              <p className="text-xs font-bold text-white group-hover:text-[#FF4103] transition-colors truncate">Aptitude Prep</p>
              <p className="text-[11px] text-slate-400 mt-0.5 truncate">
                {readiness > 0 ? `${(readiness * 100).toFixed(0)}% Assessed` : 'Ready to Start'}
              </p>
            </div>
          </Link>

          {/* Module 3 */}
          <Link 
            to="/simulation"
            className="p-3 rounded-xl bg-[#001824] border border-[#002f47] hover:border-[#FF4103]/60 transition-all group flex flex-col justify-between"
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#FF4103]">Module 3</span>
              <Laptop className="w-3.5 h-3.5 text-slate-400 group-hover:text-[#FF4103] transition-colors" />
            </div>
            <div className="mt-2">
              <p className="text-xs font-bold text-white group-hover:text-[#FF4103] transition-colors truncate">Technical Round</p>
              <p className="text-[11px] text-slate-400 mt-0.5 truncate">Practical Sandbox</p>
            </div>
          </Link>

          {/* Module 4 */}
          <Link 
            to="/interviews"
            className="p-3 rounded-xl bg-[#001824] border border-[#002f47] hover:border-[#FF4103]/60 transition-all group flex flex-col justify-between"
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#FF4103]">Module 4</span>
              <Brain className="w-3.5 h-3.5 text-slate-400 group-hover:text-[#FF4103] transition-colors" />
            </div>
            <div className="mt-2">
              <p className="text-xs font-bold text-white group-hover:text-[#FF4103] transition-colors truncate">HR Round</p>
              <p className="text-[11px] text-slate-400 mt-0.5 truncate">Behavioral Cockpit</p>
            </div>
          </Link>

          {/* Module 5 */}
          <Link 
            to="/results"
            className="p-3 rounded-xl bg-[#001824] border border-[#002f47] hover:border-[#FF4103]/60 transition-all group flex flex-col justify-between col-span-2 md:col-span-1"
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#FF4103]">Module 5</span>
              <ShieldCheck className="w-3.5 h-3.5 text-slate-400 group-hover:text-[#FF4103] transition-colors" />
            </div>
            <div className="mt-2">
              <p className="text-xs font-bold text-white group-hover:text-[#FF4103] transition-colors truncate">Results</p>
              <p className="text-[11px] text-slate-400 mt-0.5 truncate">
                {readiness > 0 ? `${(readiness * 100).toFixed(0)}% Synthesized` : 'Synthesized Overview'}
              </p>
            </div>
          </Link>
        </div>
      </section>

      {/* Readiness & Profile Gauges */}
      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-[#001f2e] border border-[#063750] rounded-2xl p-6 sm:p-7 shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-white">Profile & Evidence Readiness</h2>
                {dataState === 'current' && (
                  <span className="px-2 py-0.5 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[10px] font-bold rounded-full flex items-center gap-1">
                    <Check className="w-3 h-3" /> CANONICAL CURRENT
                  </span>
                )}
                {dataState === 'updating' && (
                  <span className="px-2 py-0.5 bg-amber-500/10 border border-amber-500/30 text-amber-400 text-[10px] font-bold rounded-full flex items-center gap-1 animate-pulse">
                    <Clock className="w-3 h-3 animate-spin" /> UPDATING
                  </span>
                )}
                {dataState === 'empty' && (
                  <span className="px-2 py-0.5 bg-slate-700/50 border border-slate-600 text-slate-400 text-[10px] font-bold rounded-full">
                    EMPTY PROFILE
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400 mt-0.5">Context completeness is maintained separate from verified proficiency.</p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setIsEditingProfile(true)}
                className="px-2.5 py-1.5 rounded-lg bg-[#001824] border border-[#002f47] hover:border-[#FF4103] text-xs font-semibold text-slate-300 hover:text-white flex items-center gap-1.5 transition-colors"
                title="Edit Target Role and Profile"
              >
                <Edit3 className="w-3 h-3 text-[#FF4103]" />
                <span>Edit Profile</span>
              </button>
              <span className="text-[#FF4103] font-black text-xl">{completeness}%</span>
            </div>
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
                {resumeMeta?.filename ? (
                  <span>{resumeMeta.filename} <span className="text-xs text-[#FF4103] font-normal">(v{resumeMeta.version})</span></span>
                ) : (
                  'Not uploaded'
                )}
              </div>
            </div>
            <div className="p-3.5 bg-[#001824] rounded-xl border border-[#002f47]">
              <span className="text-xs text-slate-400 uppercase font-semibold">Extracted Claims</span>
              <div className="text-[#FF4103] font-bold text-sm mt-1">
                {claims.length} verified assertions
                {resumeMeta?.version && <span className="text-xs text-slate-400 font-normal ml-1">· v{resumeMeta.version}</span>}
              </div>
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

      {/* Module 1: Resume Intelligence Section */}
      <section className="bg-[#001f2e] border border-[#063750] rounded-2xl p-6 sm:p-7 shadow-lg">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-[#002a40]">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <FileText className="w-5 h-5 text-[#FF4103]" /> 
              <span>Module 1 · Resume Intelligence & Extraction</span>
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
              {uploading ? (
                <>
                  <Flame className="w-4 h-4 animate-spin" />
                  <span>Processing…</span>
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4"/> 
                  <span>Upload Resume</span>
                </>
              )}
            </button>
          </div>
        </div>

        {uploadMessage && (
          <div className="mt-4 p-3.5 rounded-xl bg-[#001824] border border-[#002f47] text-xs text-slate-300 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-[#FF4103] shrink-0" />
            <span>{uploadMessage}</span>
          </div>
        )}

        <div className="grid md:grid-cols-3 gap-4 mt-6">
          <div className="p-4 rounded-xl bg-[#001824] border border-[#002f47]">
            <ShieldCheck className="w-5 h-5 text-[#FF4103] mb-2" />
            <div className="text-sm font-bold text-white">Source Integrity</div>
            <div className="text-xs text-slate-400 mt-1">
              Original resume evidence is stored in KV with SHA-256 integrity hashes and version tracking.
            </div>
          </div>
          <div className="p-4 rounded-xl bg-[#001824] border border-[#002f47]">
            <ClipboardCheck className="w-5 h-5 text-[#FF4103] mb-2" />
            <div className="text-sm font-bold text-white">Active Claim Provenance</div>
            <div className="text-xs text-slate-400 mt-1">
              {claims.length ? `${claims.length} claims extracted from current active resume (v${resumeMeta?.version || 1}).` : 'Upload a resume to begin extraction.'}
            </div>
          </div>
          <div className="p-4 rounded-xl bg-[#001824] border border-[#002f47]">
            <CheckCircle2 className="w-5 h-5 text-[#FF4103] mb-2" />
            <div className="text-sm font-bold text-white">Assessment Proof</div>
            <div className="text-xs text-slate-400 mt-1">
              Use Module 2 Assessment Preparation to convert unverified claims into proven capability.
            </div>
          </div>
        </div>
      </section>

      {/* Extracted Claims Snapshot */}
      <section className="bg-[#001f2e] border border-[#063750] rounded-2xl p-6 shadow-lg">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-white">Extracted Claim Provenance Snapshot</h2>
              {dataState === 'current' && (
                <span className="px-2 py-0.5 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[10px] font-bold rounded-full">
                  CURRENT
                </span>
              )}
              {dataState === 'updating' && (
                <span className="px-2 py-0.5 bg-amber-500/10 border border-amber-500/30 text-amber-400 text-[10px] font-bold rounded-full animate-pulse">
                  UPDATING
                </span>
              )}
              {dataState === 'empty' && (
                <span className="px-2 py-0.5 bg-slate-700/50 border border-slate-600 text-slate-400 text-[10px] font-bold rounded-full">
                  EMPTY
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              {resumeMeta?.filename ? (
                <span>Source: <strong className="text-slate-300">{resumeMeta.filename}</strong> (Version {resumeMeta.version}) · Active Evidence Source</span>
              ) : (
                'No active resume selected as evidence source'
              )}
            </p>
          </div>
          <span className="text-xs text-[#FF4103] font-semibold bg-[#FF4103]/10 px-2.5 py-1 rounded-lg border border-[#FF4103]/20 self-start sm:self-auto">
            {claims.length} verified claims
          </span>
        </div>

        {dataState === 'updating' ? (
          <div className="p-8 bg-[#001824] border border-[#002f47] rounded-xl text-center">
            <Flame className="w-8 h-8 text-[#FF4103] animate-spin mx-auto mb-2" />
            <p className="text-sm font-bold text-white">Updating Evidence from Resume v{resumeMeta?.version || 1}...</p>
            <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
              Running multi-pass segmentation, skill extraction, and taxonomy alignment. Your verified claims will update automatically.
            </p>
          </div>
        ) : claims.length > 0 ? (
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
        ) : (
          <div className="p-8 bg-[#001824] border border-[#002f47] rounded-xl text-center">
            <ClipboardCheck className="w-8 h-8 text-slate-500 mx-auto mb-2" />
            <p className="text-sm font-bold text-slate-300">No claims extracted yet</p>
            <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
              Upload your latest resume to automatically extract structured technical skills, experience claims, and role competencies with character-level provenance.
            </p>
          </div>
        )}
      </section>

      {/* Learning Pathways Progress Section */}
      <section className="bg-[#001f2e] border border-[#063750] rounded-2xl p-6 sm:p-7 shadow-lg">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#002a40]">
          <div>
            <div className="flex items-center gap-2 text-white font-bold text-lg">
              <GraduationCap className="w-5 h-5 text-[#FF4103]" />
              <span>Personalized Learning Pathways & Curricula</span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Targeted skill remediation, prerequisite graphs, formative practice units, and verified mastery gates.
            </p>
          </div>
          <Link
            to="/learning"
            className="px-3.5 py-2 rounded-xl bg-[#FF4103]/15 border border-[#FF4103]/40 hover:bg-[#FF4103] hover:text-white text-[#FF4103] text-xs font-bold transition-all self-start sm:self-auto"
          >
            Manage Pathways
          </Link>
        </div>

        {pathways.length > 0 ? (
          <div className="grid md:grid-cols-2 gap-4 mt-5">
            {pathways.slice(0, 4).map((p) => (
              <div key={p.id} className="p-4 rounded-xl bg-[#001824] border border-[#002f47] flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#FF4103] bg-[#FF4103]/10 px-2 py-0.5 rounded">
                      {p.target_role || 'General Pathway'}
                    </span>
                    <span className="text-xs font-bold text-slate-300">{p.progress_pct || 0}% Complete</span>
                  </div>
                  <h4 className="text-sm font-bold text-white mt-2 truncate">{p.title}</h4>
                  <div className="text-xs text-slate-400 mt-1">
                    {p.mastered_modules || 0} of {p.total_modules || 0} modules mastered
                  </div>
                  <div className="h-1.5 bg-[#002538] rounded-full overflow-hidden mt-3">
                    <div 
                      className="h-full bg-gradient-to-r from-[#FF4103] to-[#ff7847] rounded-full transition-all duration-300"
                      style={{ width: `${p.progress_pct || 0}%` }}
                    />
                  </div>
                </div>
                <div className="mt-4 pt-3 border-t border-[#002f47] flex items-center justify-between">
                  <span className="text-[11px] text-slate-500 capitalize">Status: {p.status || 'Active'}</span>
                  <Link 
                    to="/learning" 
                    className="text-xs font-bold text-[#FF4103] hover:underline flex items-center gap-1"
                  >
                    Continue <ArrowRight className="w-3 h-3" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="mt-5 p-6 rounded-xl bg-[#001824] border border-[#002f47] text-center">
            <GraduationCap className="w-8 h-8 text-slate-500 mx-auto mb-2" />
            <p className="text-sm font-bold text-slate-300">No active learning pathway yet</p>
            <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
              Learning pathways convert your detected skill gaps into structured, step-by-step curriculum milestones with interactive practice.
            </p>
            <Link 
              to="/learning" 
              className="inline-flex items-center gap-2 mt-4 px-4 py-2 rounded-xl bg-[#FF4103] text-white text-xs font-bold shadow-md shadow-[#FF4103]/20 hover:bg-[#e03200] transition-colors"
            >
              Start Learning Pathway
            </Link>
          </div>
        )}
      </section>

      {/* Recommended Next Actions Grid */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-white">Recommended Next Actions</h2>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <Link 
            to="/learning" 
            className="text-left bg-[#001f2e] border border-[#063750] hover:border-[#FF4103] rounded-2xl p-6 transition-all hover:-translate-y-0.5 group shadow-lg block"
          >
            <GraduationCap className="w-6 h-6 text-[#FF4103] mb-3 group-hover:scale-110 transition-transform" />
            <h3 className="font-bold text-white text-base">Learning Pathways</h3>
            <p className="text-xs text-slate-400 mt-1 leading-relaxed">
              Targeted curriculum remediation, prerequisite graphs, formative practice, and verified mastery gates.
            </p>
          </Link>

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

          <Link 
            to="/simulation" 
            className="text-left bg-[#001f2e] border border-[#063750] hover:border-[#FF4103] rounded-2xl p-6 transition-all hover:-translate-y-0.5 group shadow-lg block"
          >
            <Laptop className="w-6 h-6 text-[#FF4103] mb-3 group-hover:scale-110 transition-transform" />
            <h3 className="font-bold text-white text-base">Simulation Sandbox</h3>
            <p className="text-xs text-slate-400 mt-1 leading-relaxed">
              Technical & domain practical tasks with dynamic constraint shifts and multi-dimensional scoring.
            </p>
          </Link>

          <Link
            to="/assess" 
            className="text-left bg-[#001f2e] border border-[#063750] rounded-2xl p-6 hover:border-[#FF4103] transition-all hover:-translate-y-0.5 group shadow-lg block"
          >
            <ClipboardCheck className="w-6 h-6 text-[#FF4103] mb-3 group-hover:scale-110 transition-transform" />
            <h3 className="font-bold text-white text-base">Module 2 · Aptitude Assessment</h3>
            <p className="text-xs text-slate-400 mt-1 leading-relaxed">
              Adaptive skill verification with evidence-based proficiency and uncertainty tracking.
            </p>
          </Link>
          
          <Link
            to="/interviews" 
            className="text-left bg-[#001f2e] border border-[#063750] rounded-2xl p-6 hover:border-[#FF4103] transition-all hover:-translate-y-0.5 group shadow-lg block"
          >
            <Brain className="w-6 h-6 text-[#FF4103] mb-3 group-hover:scale-110 transition-transform" />
            <h3 className="font-bold text-white text-base">Module 4 · HR Round</h3>
            <p className="text-xs text-slate-400 mt-1 leading-relaxed">
              Calibrated behavioral interview simulation evaluated against competency rubrics.
            </p>
          </Link>
          
          <Link 
            to="/results" 
            className="text-left bg-[#001f2e] border border-[#063750] rounded-2xl p-6 hover:border-[#FF4103] transition-all hover:-translate-y-0.5 group shadow-lg block"
          >
            <ShieldCheck className="w-6 h-6 text-[#FF4103] mb-3 group-hover:scale-110 transition-transform" />
            <h3 className="font-bold text-white text-base">Module 5 · Results</h3>
            <p className="text-xs text-slate-400 mt-1 leading-relaxed">
              Consolidated readiness across Resume, Aptitude, Technical, and HR rounds.
            </p>
          </Link>
        </div>
      </section>

      {/* Job Board Requisitions & Live Match Engine */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-bold text-white">Live Requisitions & Match Engine</h2>
            <p className="text-xs text-slate-400 mt-0.5">Matching candidates with active requisitions based on verified evidence.</p>
          </div>
          <span className="text-xs text-[#FF4103] font-bold bg-[#FF4103]/10 px-2.5 py-1 rounded-lg border border-[#FF4103]/20">
            {jobs.length} open {jobs.length === 1 ? 'role' : 'roles'}
          </span>
        </div>
        <div className="grid md:grid-cols-2 gap-4">
          {jobs.length === 0 ? (
            <div className="p-8 bg-[#001f2e] border border-[#063750] rounded-2xl text-slate-400 text-sm text-center md:col-span-2">
              <Briefcase className="w-8 h-8 text-slate-500 mx-auto mb-2" />
              <p className="font-semibold text-slate-300">No active job requisitions posted yet.</p>
              <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
                Requisitions posted by recruiters in your organization will appear here with automated evidence matching. In the meantime, prepare your competencies using Learning Pathways or Interview Prep.
              </p>
            </div>
          ) : (
            jobs.map(job => (
              <div key={job.id} className="bg-[#001f2e] border border-[#063750] rounded-2xl p-6 flex flex-col justify-between hover:border-[#FF4103]/50 transition-colors shadow-lg">
                <div>
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h3 className="text-lg font-bold text-white">{job.title}</h3>
                      <p className="text-slate-400 text-xs mt-0.5">{job.department || 'General'}</p>
                    </div>
                    <Briefcase className="w-5 h-5 text-[#FF4103] shrink-0" />
                  </div>
                  {job.description && (
                    <p className="text-xs text-slate-300 mt-2 line-clamp-2 leading-relaxed">
                      {job.description}
                    </p>
                  )}
                  {job.application_status && (
                    <div className="mt-3 p-3 rounded-xl bg-[#001824] border border-[#002f47] text-xs">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400">Application:</span>
                        <span className="text-emerald-400 font-bold capitalize">{job.application_status}</span>
                      </div>
                      {typeof job.match_score === 'number' && job.match_score > 0 && (
                        <div className="flex items-center justify-between mt-1">
                          <span className="text-slate-400">Match score:</span>
                          <span className="text-[#FF4103] font-bold">{job.match_score}%</span>
                        </div>
                      )}
                      {job.match_reasoning && (
                        <p className="text-[11px] text-slate-400 mt-1 italic">
                          "{job.match_reasoning}"
                        </p>
                      )}
                    </div>
                  )}
                </div>
                <button 
                  disabled={applyingId === job.id || !!job.application_status} 
                  onClick={() => applyToJob(job.id)} 
                  className="w-full mt-4 py-2.5 bg-[#FF4103] hover:bg-[#e03200] disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-md shadow-[#FF4103]/20 transition-all flex items-center justify-center gap-2"
                >
                  {applyingId === job.id ? (
                    <>
                      <Flame className="w-4 h-4 animate-spin" />
                      <span>Submitting Application...</span>
                    </>
                  ) : job.application_status ? (
                    <>
                      <Check className="w-4 h-4 text-white" />
                      <span>Applied with Evidence Portfolio</span>
                    </>
                  ) : (
                    <span>Apply with Evidence Portfolio</span>
                  )}
                </button>
              </div>
            ))
          )}
        </div>
      </section>

      {/* Edit Profile Modal */}
      {isEditingProfile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-[#001f2e] border border-[#063750] rounded-2xl w-full max-w-lg p-6 shadow-2xl relative">
            <div className="flex items-center justify-between pb-4 border-b border-[#002f47]">
              <div className="flex items-center gap-2 text-white font-bold text-lg">
                <Edit3 className="w-5 h-5 text-[#FF4103]" />
                <span>Edit Candidate Profile</span>
              </div>
              <button 
                onClick={() => setIsEditingProfile(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-[#001824]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveProfile} className="space-y-4 mt-5">
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                  Target Role
                </label>
                <input
                  type="text"
                  required
                  value={editForm.target_role}
                  onChange={e => setEditForm(prev => ({ ...prev, target_role: e.target.value }))}
                  placeholder="e.g. AI / Machine Learning Engineer"
                  className="w-full px-3.5 py-2.5 bg-[#001824] border border-[#002f47] rounded-xl text-white text-sm focus:border-[#FF4103] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                  Primary Domain
                </label>
                <input
                  type="text"
                  required
                  value={editForm.primary_domain}
                  onChange={e => setEditForm(prev => ({ ...prev, primary_domain: e.target.value }))}
                  placeholder="e.g. Artificial Intelligence, Cloud & DevOps, Software Engineering"
                  className="w-full px-3.5 py-2.5 bg-[#001824] border border-[#002f47] rounded-xl text-white text-sm focus:border-[#FF4103] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                  Experience Level
                </label>
                <select
                  value={editForm.experience_level}
                  onChange={e => setEditForm(prev => ({ ...prev, experience_level: e.target.value }))}
                  className="w-full px-3.5 py-2.5 bg-[#001824] border border-[#002f47] rounded-xl text-white text-sm focus:border-[#FF4103] focus:outline-none"
                >
                  <option value="entry">Entry Level (0 - 2 years)</option>
                  <option value="mid">Mid Level (2 - 5 years)</option>
                  <option value="senior">Senior Level (5 - 8 years)</option>
                  <option value="lead">Staff / Lead (8+ years)</option>
                  <option value="executive">Principal / Executive</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                  Career Summary / Bio
                </label>
                <textarea
                  rows={3}
                  value={editForm.bio}
                  onChange={e => setEditForm(prev => ({ ...prev, bio: e.target.value }))}
                  placeholder="Summarize your professional background, strengths, and career aspirations..."
                  className="w-full px-3.5 py-2.5 bg-[#001824] border border-[#002f47] rounded-xl text-white text-sm focus:border-[#FF4103] focus:outline-none resize-none"
                />
              </div>

              {profileSaveMessage && (
                <div className={`p-3 rounded-xl text-xs flex items-center gap-2 ${profileSaveMessage.includes('Error') ? 'bg-red-500/10 text-red-400 border border-red-500/30' : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'}`}>
                  {profileSaveMessage.includes('Error') ? <AlertCircle className="w-4 h-4 shrink-0" /> : <Check className="w-4 h-4 shrink-0" />}
                  <span>{profileSaveMessage}</span>
                </div>
              )}

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#002f47]">
                <button
                  type="button"
                  onClick={() => setIsEditingProfile(false)}
                  className="px-4 py-2.5 rounded-xl bg-[#001824] border border-[#002f47] text-slate-300 hover:text-white text-xs font-bold transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingProfile}
                  className="px-5 py-2.5 rounded-xl bg-[#FF4103] hover:bg-[#e03200] disabled:opacity-50 text-white text-xs font-bold shadow-lg shadow-[#FF4103]/20 flex items-center gap-2 transition-all"
                >
                  {savingProfile ? (
                    <>
                      <Flame className="w-4 h-4 animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <span>Save Changes</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}