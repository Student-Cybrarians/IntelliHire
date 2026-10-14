import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Upload, FileText, Bot, AlertCircle, CheckCircle2, LayoutDashboard, 
  Briefcase, ChevronRight, XCircle, FileQuestion, Sparkles, RefreshCw, 
  RotateCcw, Download, Check, Clock, X, AlertTriangle, ShieldCheck, Edit3 
} from 'lucide-react';
import ModuleNavigationFooter from '../components/ModuleNavigationFooter';

export default function Resume() {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [extracting, setExtracting] = useState(false);
  const [resumeData, setResumeData] = useState<any>(null);
  const [resumeId, setResumeId] = useState<string | null>(null);
  const [resumeVersion, setResumeVersion] = useState<number | null>(null);
  const [resumeFilename, setResumeFilename] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  // Target Requirements / JD State
  const [jdText, setJdText] = useState('');
  const [jdAnalyzing, setJdAnalyzing] = useState(false);
  const [jdData, setJdData] = useState<any>(null);
  const [jdId, setJdId] = useState<string | null>(null);
  const [isEditingJd, setIsEditingJd] = useState(false);

  // Match & ATS Analysis State
  const [matchRunning, setMatchRunning] = useState(false);
  const [matchData, setMatchData] = useState<any>(null);
  const [matchStale, setMatchStale] = useState(false);
  const [acceptedSuggestions, setAcceptedSuggestions] = useState<Set<number>>(new Set());
  const [editedSuggestions, setEditedSuggestions] = useState<Record<number, string>>({});
  const [copiedSuggestionIdx, setCopiedSuggestionIdx] = useState<number | null>(null);
  const [optimizing, setOptimizing] = useState(false);
  const [optimizedResumeId, setOptimizedResumeId] = useState<string | null>(null);
  const [currentJobId, setCurrentJobId] = useState<string | null>(null);

  // Candidate Structured Context Editing State
  const [isEditingContext, setIsEditingContext] = useState(false);
  const [savingContext, setSavingContext] = useState(false);
  const [editSkillsText, setEditSkillsText] = useState('');
  const [editEducationText, setEditEducationText] = useState('');
  const [editCertificationsText, setEditCertificationsText] = useState('');
  const [editAchievementsText, setEditAchievementsText] = useState('');
  const [editExperienceList, setEditExperienceList] = useState<Array<{ company: string; title: string; duration: string; description?: string }>>([]);

  // Persistence, Identity & Reset State
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [loadingInitial, setLoadingInitial] = useState(true);
  const [showResetModal, setShowResetModal] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  // Concurrency & Timeout Refs
  const activeMatchRequestIdRef = useRef<string>('');
  const pollTimerRef = useRef<any>(null);

  const getDraftKey = (uid: string) => `intellihire_m1_draft_${uid}`;

  // ----------------------------------------------------
  // Lifecycle: Restore Canonical & Scoped Draft State
  // ----------------------------------------------------
  useEffect(() => {
    let isMounted = true;

    const restoreWorkspace = async () => {
      setLoadingInitial(true);
      setError(null);

      try {
        // 1. Resolve authenticated user identity
        const authRes = await fetch('/api/auth/me');
        if (!authRes.ok) {
          navigate('/login');
          return;
        }
        const authData = await authRes.json() as any;
        const user = authData?.user;
        if (!user) {
          navigate('/login');
          return;
        }

        if (isMounted) setCurrentUserId(user.id);

        // 2. Fetch canonical server-side M01 state
        const stateRes = await fetch('/api/m1/state');
        if (stateRes.ok) {
          const stateData = await stateRes.json() as any;
          if (isMounted && stateData.success) {
            if (stateData.has_resume && stateData.resume) {
              setResumeId(stateData.resume.id);
              setResumeVersion(stateData.resume.version);
              setResumeFilename(stateData.resume.filename);
              setResumeData(stateData.resume_data || { skills: [] });
            }

            if (stateData.has_jd && stateData.jd) {
              setJdId(stateData.jd.id);
              setJdData(stateData.jd_data);
              setJdText(stateData.jd.raw_text || '');
            }

            if (stateData.has_match && stateData.match_data) {
              setMatchData(stateData.match_data);
              setMatchStale(Boolean(stateData.match_stale));
            }

            // Check if there is an in-flight pending job
            if (stateData.pending_job && (stateData.pending_job.status === 'PENDING' || stateData.pending_job.status === 'PROCESSING')) {
              setCurrentJobId(stateData.pending_job.id);
              pollMatchJob(stateData.pending_job.id);
            }
          }
        }

        // 3. Check candidate-scoped client draft for in-progress textarea text
        try {
          const draftRaw = sessionStorage.getItem(getDraftKey(user.id));
          if (draftRaw && isMounted) {
            const draft = JSON.parse(draftRaw);
            if (draft.jdTextDraft && !jdText) {
              setJdText(draft.jdTextDraft);
            }
            if (Array.isArray(draft.acceptedSuggestions) && draft.acceptedSuggestions.length > 0) {
              setAcceptedSuggestions(new Set(draft.acceptedSuggestions));
            }
          }
        } catch (_) {}

      } catch (err: any) {
        if (isMounted) setError('Failed to initialize workspace: ' + err.message);
      } finally {
        if (isMounted) setLoadingInitial(false);
      }
    };

    restoreWorkspace();

    return () => {
      isMounted = false;
      if (pollTimerRef.current) clearTimeout(pollTimerRef.current);
    };
  }, []);

  // Auto-save in-progress draft to scoped sessionStorage
  useEffect(() => {
    if (!currentUserId) return;
    try {
      if (!jdText && acceptedSuggestions.size === 0) {
        sessionStorage.removeItem(getDraftKey(currentUserId));
        return;
      }
      const draftPayload = {
        jdTextDraft: jdText,
        acceptedSuggestions: Array.from(acceptedSuggestions)
      };
      sessionStorage.setItem(getDraftKey(currentUserId), JSON.stringify(draftPayload));
    } catch (_) {}
  }, [jdText, acceptedSuggestions, currentUserId]);

  // ----------------------------------------------------
  // Actions: Context Editing & Verification
  // ----------------------------------------------------
  const startEditingContext = () => {
    if (!resumeData) return;
    setEditSkillsText((resumeData.skills || []).join(', '));
    setEditEducationText((resumeData.education || []).join('\n'));
    setEditCertificationsText((resumeData.certifications || []).join('\n'));
    setEditAchievementsText((resumeData.achievements || []).join('\n'));
    setEditExperienceList(
      Array.isArray(resumeData.experience) && resumeData.experience.length > 0
        ? resumeData.experience.map((e: any) => ({
            company: e.company || '',
            title: e.title || '',
            duration: e.duration || '',
            description: e.description || ''
          }))
        : [{ company: '', title: '', duration: '', description: '' }]
    );
    setIsEditingContext(true);
  };

  const handleSaveContext = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resumeId) return;
    setSavingContext(true);
    setError(null);

    const updatedSkills = editSkillsText.split(',').map(s => s.trim()).filter(Boolean);
    const updatedEducation = editEducationText.split('\n').map(s => s.trim()).filter(Boolean);
    const updatedCertifications = editCertificationsText.split('\n').map(s => s.trim()).filter(Boolean);
    const updatedAchievements = editAchievementsText.split('\n').map(s => s.trim()).filter(Boolean);
    const updatedExperience = editExperienceList.filter(exp => exp.company.trim() || exp.title.trim());

    try {
      const res = await fetch(`/api/resume/${resumeId}/context`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          skills: updatedSkills,
          experience: updatedExperience,
          education: updatedEducation,
          certifications: updatedCertifications,
          achievements: updatedAchievements
        })
      });
      const data = await res.json() as any;
      if (!res.ok) throw new Error(data.error || 'Failed to save resume profile edits');

      setResumeData(data.data);
      setIsEditingContext(false);
      if (matchData) setMatchStale(true);
      setStatusMessage('Structured resume profile verified and saved.');
    } catch (err: any) {
      setError(err.message || 'Failed to save structured resume edits');
    } finally {
      setSavingContext(false);
    }
  };

  // ----------------------------------------------------
  // Actions: Suggestions & Optimizations
  // ----------------------------------------------------
  const toggleSuggestion = (index: number) => {
    const newSet = new Set(acceptedSuggestions);
    if (newSet.has(index)) newSet.delete(index);
    else newSet.add(index);
    setAcceptedSuggestions(newSet);
  };

  const handleCopySuggestion = (index: number, text: string) => {
    try {
      navigator.clipboard?.writeText(text);
      setCopiedSuggestionIdx(index);
      setTimeout(() => setCopiedSuggestionIdx(null), 2000);
    } catch (_) {}
  };

  const applyOptimizations = async () => {
    if (!resumeId || acceptedSuggestions.size === 0) return;
    setOptimizing(true);
    setError(null);
    const accepted = Array.from(acceptedSuggestions).map(i => {
      const orig = matchData.improvement_suggestions[i];
      const customText = editedSuggestions[i];
      return {
        ...orig,
        suggested_text: customText !== undefined ? customText : (orig.suggested_text || orig.text || '')
      };
    });
    
    try {
      const res = await fetch(`/api/resume/${resumeId}/optimize`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accepted_suggestions: accepted })
      });
      const data = await res.json() as any;
      if (res.ok) {
        setOptimizedResumeId(data.new_resume_id);
        setResumeId(data.new_resume_id);
        if (data.version) setResumeVersion(data.version);
        if (data.data) setResumeData(data.data);
        setAcceptedSuggestions(new Set());
        setStatusMessage(`Optimization applied! Generated active candidate resume v${data.version || (resumeVersion || 1) + 1}.`);
      } else {
        setError(data.error || 'Optimization failed');
      }
    } catch (e: any) {
      setError(e.message || 'Optimization request failed');
    } finally {
      setOptimizing(false);
    }
  };

  const exportATSResume = async (type: 'global' | 'tailored') => {
    const targetId = optimizedResumeId || resumeId;
    if (!targetId) return;
    setError(null);
    try {
      const res = await fetch(`/api/resume/${targetId}/export?type=${type}`);
      if (!res.ok) {
        const errData: any = await res.json().catch(() => ({}));
        setError(errData.error || `Failed to export ${type} resume (${res.status})`);
        return;
      }
      const blob = await res.blob();
      const disposition = res.headers.get('Content-Disposition') || '';
      const filenameMatch = disposition.match(/filename="?([^";]+)"?/i);
      const filename = filenameMatch?.[1] || `IntelliHire_${type === 'tailored' ? 'Tailored' : 'Global'}_Resume.docx`;
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(url), 5000);
      setStatusMessage(`${type === 'tailored' ? 'Tailored' : 'Global'} ATS Resume downloaded (${filename}).`);
    } catch (e: any) {
      setError('Failed to export: ' + e.message);
    }
  };

  // ----------------------------------------------------
  // Action: Resume Upload & Extraction (Bounded Timeout)
  // ----------------------------------------------------
  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;

    setUploading(true);
    setError(null);
    setStatusMessage(null);

    const formData = new FormData();
    formData.append('file', file);

    const uploadController = new AbortController();
    const uploadTimeout = setTimeout(() => uploadController.abort(), 35000);

    try {
      const res = await fetch('/api/resume/upload', {
        method: 'POST',
        body: formData,
        signal: uploadController.signal
      });
      clearTimeout(uploadTimeout);

      const data = (await res.json()) as any;
      if (!res.ok) throw new Error(data.error || 'Resume upload failed');

      setResumeId(data.resumeId);
      setResumeVersion(data.version || 1);
      setResumeFilename(file.name);
      setUploading(false);
      setExtracting(true);

      // Invalidate matchData because resume changed
      if (matchData) {
        setMatchStale(true);
      }

      // Step 2: Multi-pass extraction
      const extractController = new AbortController();
      const extractTimeout = setTimeout(() => extractController.abort(), 35000);

      const extractRes = await fetch(`/api/resume/extract/${data.resumeId}`, {
        method: 'POST',
        signal: extractController.signal
      });
      clearTimeout(extractTimeout);
      
      const extractData = (await extractRes.json()) as any;
      if (!extractRes.ok) throw new Error(extractData.error || 'Extraction failed');

      setResumeData(extractData.data);
      setStatusMessage(`Resume evidence v${data.version || 1} parsed and saved.`);
    } catch (err: any) {
      clearTimeout(uploadTimeout);
      if (err.name === 'AbortError') {
        setError('Resume extraction timed out. Please check your connection and retry.');
      } else {
        setError(err.message || 'Resume upload failed');
      }
    } finally {
      setUploading(false);
      setExtracting(false);
    }
  };

  // ----------------------------------------------------
  // Action: Target Job Description Analysis (Bounded Timeout)
  // ----------------------------------------------------
  const handleJDAnalyze = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!jdText.trim()) return;

    setJdAnalyzing(true);
    setError(null);
    setStatusMessage(null);

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30000);

    try {
      const res = await fetch('/api/jd/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jd_text: jdText }),
        signal: controller.signal
      });
      clearTimeout(timeout);

      const data = await res.json() as any;
      if (!res.ok) throw new Error(data.error || 'JD analysis failed');

      setJdId(data.jd_id);
      setJdData(data.data);
      setIsEditingJd(false);

      // Invalidate existing match if JD requirements changed
      if (matchData) {
        setMatchStale(true);
      }

      setStatusMessage('Target requirements extracted and persisted.');
    } catch (err: any) {
      clearTimeout(timeout);
      if (err.name === 'AbortError') {
        setError('Job description analysis timed out. Previous evidence is preserved. Please retry.');
      } else {
        setError(err.message || 'JD analysis failed');
      }
    } finally {
      setJdAnalyzing(false);
    }
  };

  // ----------------------------------------------------
  // Action: Polling Match Job (Bounded Polling & Timeout)
  // ----------------------------------------------------
  const pollMatchJob = (jobId: string, expectedRequestId?: string) => {
    let attempts = 0;
    const maxAttempts = 15; // 15 polls * 2s = 30s max polling limit

    const runPoll = async () => {
      // Concurrency guard: verify this is still the active match request
      if (expectedRequestId && activeMatchRequestIdRef.current !== expectedRequestId) return;

      attempts++;
      try {
        const statusRes = await fetch(`/api/match/status/${jobId}`);
        if (!statusRes.ok) throw new Error('Failed to retrieve match status');
        const statusData = await statusRes.json() as any;

        if (expectedRequestId && activeMatchRequestIdRef.current !== expectedRequestId) return;

        if (statusData.status === 'READY') {
          setMatchData(statusData.result);
          setMatchStale(false);
          setMatchRunning(false);
          setStatusMessage('Intelligence match analysis completed and saved.');
        } else if (statusData.status === 'FAILED') {
          setError(statusData.error || 'Match analysis processing failed.');
          setMatchRunning(false);
        } else if (attempts >= maxAttempts) {
          // Bounded timeout reached: do NOT loop forever
          setMatchRunning(false);
          setError('Analysis is taking longer than expected. The job is queued in the background. Click "Check Status" or retry.');
        } else {
          // Re-poll in 2 seconds
          pollTimerRef.current = setTimeout(runPoll, 2000);
        }
      } catch (err: any) {
        if (expectedRequestId && activeMatchRequestIdRef.current !== expectedRequestId) return;
        if (attempts >= maxAttempts) {
          setMatchRunning(false);
          setError('Match status check timed out: ' + err.message);
        } else {
          pollTimerRef.current = setTimeout(runPoll, 2500);
        }
      }
    };

    setMatchRunning(true);
    runPoll();
  };

  // ----------------------------------------------------
  // Action: Run Match Analysis
  // ----------------------------------------------------
  const handleMatch = async () => {
    if (!resumeId || !jdId) return;

    const reqId = crypto.randomUUID();
    activeMatchRequestIdRef.current = reqId;

    setMatchRunning(true);
    setError(null);
    setStatusMessage(null);

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 20000);

    try {
      const res = await fetch('/api/match/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resume_id: resumeId, jd_id: jdId }),
        signal: controller.signal
      });
      clearTimeout(timeout);

      const data = await res.json() as any;
      if (!res.ok) throw new Error(data.error || 'Match analysis failed to start');

      if (data.job_id) {
        setCurrentJobId(data.job_id);
      }

      if (data.status === 'READY' && data.result) {
        setMatchData(data.result);
        setMatchStale(false);
        setMatchRunning(false);
        setStatusMessage('Intelligence match analysis completed and saved.');
      } else {
        pollMatchJob(data.job_id, reqId);
      }
    } catch (err: any) {
      clearTimeout(timeout);
      if (err.name === 'AbortError') {
        setError('Match analysis request timed out. Previous evidence is preserved. Please retry.');
      } else {
        setError(err.message || 'Match analysis failed');
      }
      setMatchRunning(false);
    }
  };

  const handleCheckStatus = async () => {
    const jobIdToCheck = currentJobId;
    if (!jobIdToCheck) return;

    setError(null);
    setStatusMessage('Checking match status in background...');
    try {
      const res = await fetch(`/api/match/status/${jobIdToCheck}`);
      const data = await res.json() as any;
      if (data.status === 'READY' && data.result) {
        setMatchData(data.result);
        setMatchStale(false);
        setMatchRunning(false);
        setStatusMessage('Match analysis retrieved and saved.');
      } else if (data.status === 'FAILED') {
        setError(data.error || 'Match analysis job failed.');
        setMatchRunning(false);
      } else {
        setStatusMessage(`Job is currently ${data.status}. Retrying polling...`);
        pollMatchJob(jobIdToCheck);
      }
    } catch (e: any) {
      setError('Failed to check status: ' + e.message);
    }
  };

  // ----------------------------------------------------
  // Action: Manual Reset ("Reset Module 1")
  // ----------------------------------------------------
  const handleManualReset = async () => {
    setResetting(true);
    setError(null);

    try {
      // 1. Call server-side reset endpoint
      const res = await fetch('/api/m1/reset', { method: 'POST' });
      const data: any = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Reset failed');

      // 2. Clear client-scoped draft
      if (currentUserId) {
        sessionStorage.removeItem(getDraftKey(currentUserId));
      }

      // 3. Reset local workflow and target requirements state
      setJdText('');
      setJdData(null);
      setJdId(null);
      setIsEditingJd(false);
      setMatchData(null);
      setMatchStale(false);
      setAcceptedSuggestions(new Set());
      setOptimizedResumeId(null);
      setShowResetModal(false);

      setStatusMessage('Module 1 workspace reset. Active canonical resume evidence remains protected.');
    } catch (err: any) {
      setError(err.message || 'Failed to reset workspace');
    } finally {
      setResetting(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (String(status || '').toUpperCase()) {
      case 'DEMONSTRATED':
      case 'EXPLICITLY_STATED':
      case 'EVIDENCE_FOUND':
        return <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />;
      case 'MISSING':
        return <XCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />;
      case 'CONTRADICTORY':
      case 'FLAGGED':
        return <FileQuestion className="w-5 h-5 text-orange-500 flex-shrink-0 mt-0.5" />;
      case 'UNCERTAIN':
      case 'PARTIAL':
        return <AlertCircle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />;
      default:
        return <ChevronRight className="w-5 h-5 text-slate-500 flex-shrink-0 mt-0.5" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const norm = String(status || 'UNCERTAIN').toUpperCase();
    if (norm === 'DEMONSTRATED' || norm === 'EVIDENCE_FOUND' || norm === 'EXPLICITLY_STATED') {
      return (
        <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-950/60 text-emerald-400 border border-emerald-800/60">
          DEMONSTRATED
        </span>
      );
    }
    if (norm === 'MISSING') {
      return (
        <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-red-950/60 text-red-400 border border-red-800/60">
          MISSING
        </span>
      );
    }
    if (norm === 'CONTRADICTORY' || norm === 'FLAGGED') {
      return (
        <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-orange-950/60 text-orange-400 border border-orange-800/60">
          CONTRADICTORY
        </span>
      );
    }
    return (
      <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-amber-950/60 text-amber-400 border border-amber-800/60">
        UNCERTAIN / PARTIAL
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-[#001621] p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-[#063750]">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold text-white flex items-center gap-3">
                <FileText className="w-8 h-8 text-[#FF4103]" />
                Resume Intelligence & ATS Matching
              </h1>
              {resumeData && jdData && matchData && !matchStale && (
                <span className="hidden md:inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold">
                  <Check className="w-3 h-3" /> Saved
                </span>
              )}
              {matchStale && (
                <span className="hidden md:inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-semibold">
                  <Clock className="w-3 h-3" /> Stale — Update Required
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Extract verifiable character provenance, analyze target requirements, and calibrate ATS compatibility.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowResetModal(true)}
              className="flex items-center gap-2 px-3.5 py-2 bg-[#001f2e] hover:bg-[#00273c] border border-[#063750] text-slate-300 hover:text-white rounded-lg text-xs font-semibold transition-colors"
              title="Reset Module 1 workspace"
            >
              <RotateCcw className="w-3.5 h-3.5 text-[#FF4103]" />
              <span>Reset Module 1</span>
            </button>

            <button 
              onClick={() => navigate('/dashboard')}
              className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-semibold transition-colors"
            >
              <LayoutDashboard className="w-4 h-4" />
              Back to Dashboard
            </button>
          </div>
        </div>

        {/* Workspace Restoration Banner */}
        {loadingInitial && (
          <div className="p-3 bg-[#001f2e] border border-[#063750] rounded-lg flex items-center gap-3 text-xs text-slate-300">
            <div className="w-4 h-4 border-2 border-[#FF4103] border-t-transparent rounded-full animate-spin shrink-0" />
            <span>Restoring candidate intelligence workspace...</span>
          </div>
        )}

        {/* Status / Success Toast */}
        {statusMessage && (
          <div className="p-3 bg-emerald-950/40 border border-emerald-800/60 rounded-lg flex items-center justify-between text-xs text-emerald-300">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{statusMessage}</span>
            </div>
            <button onClick={() => setStatusMessage(null)} className="text-emerald-400 hover:text-white">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Error Notification with In-Place Retry */}
        {error && (
          <div className="p-4 bg-red-950/50 border border-red-900 rounded-lg flex items-start justify-between gap-3">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
              <div className="text-red-200 text-sm">
                <p className="font-semibold text-red-400">Attention Required</p>
                <p>{error}</p>
                <div className="flex items-center gap-2 mt-2">
                  {resumeId && !resumeData && (
                    <button
                      type="button"
                      onClick={async () => {
                        setError(null);
                        setExtracting(true);
                        try {
                          const extractRes = await fetch(`/api/resume/extract/${resumeId}`, { method: 'POST' });
                          const extractData = await extractRes.json() as any;
                          if (!extractRes.ok) throw new Error(extractData.error || 'Extraction failed');
                          setResumeData(extractData.data);
                        } catch (e: any) {
                          setError(e.message);
                        } finally {
                          setExtracting(false);
                        }
                      }}
                      className="px-3 py-1 bg-red-800 hover:bg-red-700 text-white rounded text-xs font-medium transition-colors"
                    >
                      Retry Extraction
                    </button>
                  )}
                  {jdText && !jdData && (
                    <button
                      type="button"
                      onClick={handleJDAnalyze}
                      className="px-3 py-1 bg-red-800 hover:bg-red-700 text-white rounded text-xs font-medium transition-colors"
                    >
                      Retry JD Analysis
                    </button>
                  )}
                  {resumeId && jdId && !matchRunning && (
                    <button
                      type="button"
                      onClick={handleMatch}
                      className="px-3 py-1 bg-red-800 hover:bg-red-700 text-white rounded text-xs font-medium transition-colors"
                    >
                      Retry Match Analysis
                    </button>
                  )}
                  {currentJobId && (
                    <button
                      type="button"
                      onClick={handleCheckStatus}
                      className="px-3 py-1 bg-amber-800 hover:bg-amber-700 text-white rounded text-xs font-medium transition-colors"
                    >
                      Check Status
                    </button>
                  )}
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setError(null)}
              className="text-red-400 hover:text-red-300 text-sm font-medium"
            >
              Dismiss
            </button>
          </div>
        )}

        <div className="grid lg:grid-cols-2 gap-6">
          {/* LEFT: Source Evidence */}
          <div className="bg-[#001f2e] border border-[#063750] rounded-xl p-6 space-y-6 flex flex-col">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                <FileText className="w-6 h-6 text-[#FF4103]" />
                Source Evidence
              </h2>
              {resumeData && (
                <div className="flex items-center gap-3">
                  {!isEditingContext && (
                    <button
                      type="button"
                      onClick={startEditingContext}
                      className="text-xs text-slate-300 hover:text-[#FF4103] flex items-center gap-1 transition-colors"
                      title="Edit or verify extracted resume fields"
                    >
                      <Edit3 className="w-3.5 h-3.5 text-[#FF4103]" />
                      <span>Edit Extracted Fields</span>
                    </button>
                  )}
                  {resumeId && (
                    <button
                      type="button"
                      onClick={() => exportATSResume('global')}
                      className="text-xs text-slate-300 hover:text-white flex items-center gap-1 px-2.5 py-1 bg-[#001621] border border-[#063750] rounded transition-colors"
                      title="Export Global ATS Resume (DOCX)"
                    >
                      <Download className="w-3 h-3 text-[#FF4103]" />
                      <span>Export DOCX</span>
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => {
                      setResumeData(null);
                      setIsEditingContext(false);
                      setFile(null);
                    }}
                    className="text-xs text-slate-400 hover:text-[#FF4103] flex items-center gap-1 transition-colors"
                  >
                    <Upload className="w-3 h-3" />
                    <span>Change Document</span>
                  </button>
                </div>
              )}
            </div>
            
            {!resumeData && !extracting ? (
              <form onSubmit={handleUpload} className="space-y-4">
                <div className="border-2 border-dashed border-[#002f47] rounded-lg p-8 text-center hover:border-[#FF4103] transition-colors cursor-pointer">
                  <input
                    type="file"
                    accept=".pdf,.docx,.txt,.tex"
                    onChange={(e) => setFile(e.target.files?.[0] || null)}
                    className="hidden"
                    id="resume-upload"
                  />
                  <label htmlFor="resume-upload" className="cursor-pointer flex flex-col items-center">
                    <Upload className="w-12 h-12 text-slate-500 mb-4" />
                    <span className="text-slate-300 font-medium">{file ? file.name : 'Upload Resume Document'}</span>
                    <span className="text-xs text-slate-500 mt-1">Supports PDF, DOCX, TXT, or LaTeX (.tex) (Max 5MB)</span>
                  </label>
                </div>
                <button
                  type="submit"
                  disabled={!file || uploading}
                  className="w-full py-3 px-4 bg-[#FF4103] hover:bg-[#e03200] text-white rounded-lg font-semibold disabled:opacity-50 transition-colors"
                >
                  {uploading ? 'Uploading & Hashing...' : 'Extract Evidence'}
                </button>
              </form>
            ) : extracting ? (
              <div className="flex-1 flex flex-col items-center justify-center text-[#FF4103] space-y-4 py-12">
                <div className="w-8 h-8 border-4 border-[#FF4103] border-t-transparent rounded-full animate-spin" />
                <p>Analyzing document context & extracting claims...</p>
              </div>
            ) : isEditingContext ? (
              <form onSubmit={handleSaveContext} className="space-y-4 flex-1">
                <div className="flex items-center justify-between border-b border-[#063750] pb-2">
                  <span className="text-xs font-bold uppercase text-[#FF4103]">Edit & Verify Extracted Profile</span>
                  <button
                    type="button"
                    onClick={() => setIsEditingContext(false)}
                    className="text-xs text-slate-400 hover:text-white"
                  >
                    Cancel
                  </button>
                </div>

                <div>
                  <label htmlFor="edit-skills-input" className="block text-xs font-semibold text-slate-300 uppercase mb-1">
                    Verified Skills (comma-separated)
                  </label>
                  <input
                    id="edit-skills-input"
                    type="text"
                    value={editSkillsText}
                    onChange={(e) => setEditSkillsText(e.target.value)}
                    placeholder="e.g. Python, TypeScript, React, SQL"
                    className="w-full p-2.5 bg-[#001621] border border-[#063750] rounded text-sm text-slate-200 focus:outline-none focus:border-[#FF4103]"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-semibold text-slate-300 uppercase">Work Experience</label>
                    <button
                      type="button"
                      onClick={() => setEditExperienceList([...editExperienceList, { company: '', title: '', duration: '', description: '' }])}
                      className="text-xs text-[#FF4103] hover:underline font-medium"
                    >
                      + Add Role
                    </button>
                  </div>
                  <div className="space-y-2 max-h-[200px] overflow-y-auto pr-1">
                    {editExperienceList.map((exp, idx) => (
                      <div key={idx} className="p-2.5 bg-[#001621] border border-[#063750] rounded space-y-2">
                        <div className="grid grid-cols-3 gap-2">
                          <input
                            type="text"
                            value={exp.title}
                            onChange={(e) => {
                              const copy = [...editExperienceList];
                              copy[idx] = { ...copy[idx], title: e.target.value };
                              setEditExperienceList(copy);
                            }}
                            placeholder="Job Title"
                            className="p-1.5 bg-[#001f2e] border border-[#002f47] rounded text-xs text-slate-200"
                          />
                          <input
                            type="text"
                            value={exp.company}
                            onChange={(e) => {
                              const copy = [...editExperienceList];
                              copy[idx] = { ...copy[idx], company: e.target.value };
                              setEditExperienceList(copy);
                            }}
                            placeholder="Company"
                            className="p-1.5 bg-[#001f2e] border border-[#002f47] rounded text-xs text-slate-200"
                          />
                          <div className="flex gap-1">
                            <input
                              type="text"
                              value={exp.duration}
                              onChange={(e) => {
                                const copy = [...editExperienceList];
                                copy[idx] = { ...copy[idx], duration: e.target.value };
                                setEditExperienceList(copy);
                              }}
                              placeholder="Duration"
                              className="flex-1 p-1.5 bg-[#001f2e] border border-[#002f47] rounded text-xs text-slate-200"
                            />
                            <button
                              type="button"
                              onClick={() => setEditExperienceList(editExperienceList.filter((_, i) => i !== idx))}
                              className="px-2 text-slate-400 hover:text-red-400 text-xs"
                              title="Remove role"
                            >
                              ×
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label htmlFor="edit-education-input" className="block text-xs font-semibold text-slate-300 uppercase mb-1">
                      Education (one per line)
                    </label>
                    <textarea
                      id="edit-education-input"
                      rows={3}
                      value={editEducationText}
                      onChange={(e) => setEditEducationText(e.target.value)}
                      placeholder="B.Tech in Computer Science..."
                      className="w-full p-2 bg-[#001621] border border-[#063750] rounded text-xs text-slate-200 focus:outline-none focus:border-[#FF4103]"
                    />
                  </div>
                  <div>
                    <label htmlFor="edit-certs-input" className="block text-xs font-semibold text-slate-300 uppercase mb-1">
                      Certifications (one per line)
                    </label>
                    <textarea
                      id="edit-certs-input"
                      rows={3}
                      value={editCertificationsText}
                      onChange={(e) => setEditCertificationsText(e.target.value)}
                      placeholder="AWS Certified Developer..."
                      className="w-full p-2 bg-[#001621] border border-[#063750] rounded text-xs text-slate-200 focus:outline-none focus:border-[#FF4103]"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="edit-achievements-input" className="block text-xs font-semibold text-slate-300 uppercase mb-1">
                    Key Achievements & Impact (one per line)
                  </label>
                  <textarea
                    id="edit-achievements-input"
                    rows={2}
                    value={editAchievementsText}
                    onChange={(e) => setEditAchievementsText(e.target.value)}
                    placeholder="Improved API latency by 40%..."
                    className="w-full p-2 bg-[#001621] border border-[#063750] rounded text-xs text-slate-200 focus:outline-none focus:border-[#FF4103]"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsEditingContext(false)}
                    className="px-3 py-2 bg-[#001621] border border-[#063750] rounded text-xs font-semibold text-slate-300 hover:text-white"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={savingContext}
                    className="px-4 py-2 bg-[#FF4103] hover:bg-[#e03200] text-white rounded text-xs font-semibold disabled:opacity-50"
                  >
                    {savingContext ? 'Saving...' : 'Save Verified Profile'}
                  </button>
                </div>
              </form>
            ) : (
              <div className="space-y-4 flex-1">
                {resumeData.provenance?.extraction_status === 'NO_OCR' || resumeData.provenance?.warning ? (
                  <div className="p-3 bg-amber-950/40 border border-amber-700/60 rounded-lg flex items-start gap-2.5 text-amber-300 text-xs">
                    <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-amber-400" />
                    <div>
                      <p className="font-semibold">Unparseable / Image-Only Document Detected (NO_OCR)</p>
                      <p className="mt-0.5 text-amber-200/90">
                        {resumeData.provenance?.warning || 'No machine-readable text layer was found. Please upload a text-based PDF, DOCX, or TXT file, or manually enter your structured details via "Edit Extracted Fields".'}
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="p-3 bg-green-950/30 border border-green-900/50 rounded-lg flex items-center justify-between text-green-400 text-sm">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 shrink-0" />
                      <span>Evidence successfully extracted</span>
                      {resumeData.provenance?.confidence === 'candidate_verified' && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-900/50 text-emerald-300 text-[10px] font-bold uppercase">
                          <ShieldCheck className="w-3 h-3" /> Verified
                        </span>
                      )}
                    </div>
                    {resumeFilename && (
                      <span className="text-xs text-slate-300 font-medium truncate max-w-[220px]">
                        {resumeFilename} {resumeVersion ? `(v${resumeVersion})` : ''}
                      </span>
                    )}
                  </div>
                )}

                {/* Resume Quality & Completeness Analysis */}
                {resumeData.quality_analysis && (
                  <div className="p-3.5 bg-[#001621] border border-[#063750] rounded-lg space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold uppercase text-slate-300 flex items-center gap-1.5">
                        <ShieldCheck className="w-4 h-4 text-[#FF4103]" />
                        Resume Quality & Completeness
                      </span>
                      <span className="text-sm font-bold text-white">
                        {resumeData.quality_analysis.overall_quality_score}
                        <span className="text-xs text-slate-500">/100</span>
                      </span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                      {resumeData.quality_analysis.checks?.map((chk: any, idx: number) => (
                        <div key={idx} className="text-xs flex items-start gap-1.5 p-1.5 rounded bg-[#001f2e] border border-[#002f47]">
                          <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold shrink-0 ${
                            chk.status === 'PASS' ? 'bg-emerald-950/60 text-emerald-400' :
                            chk.status === 'WARN' ? 'bg-amber-950/60 text-amber-400' :
                            'bg-red-950/60 text-red-400'
                          }`}>
                            {chk.status}
                          </span>
                          <div className="min-w-0">
                            <p className="font-semibold text-slate-200 truncate">{chk.dimension}</p>
                            <p className="text-[11px] text-slate-400 leading-tight mt-0.5">{chk.detail}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {resumeData.skills && (
                  <div>
                    <h3 className="text-xs font-semibold text-slate-400 uppercase mb-2">
                      Verified Skills ({resumeData.skills.length})
                    </h3>
                    <div className="flex flex-wrap gap-1.5 max-h-[180px] overflow-y-auto pr-1">
                      {resumeData.skills.map((skill: string, i: number) => (
                        <span key={i} className="px-2 py-1 bg-slate-800 text-slate-200 rounded text-xs border border-[#002f47]">
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Domain Taxonomy Alignment */}
                {Array.isArray(resumeData.taxonomy_alignment) && resumeData.taxonomy_alignment.length > 0 && (
                  <div>
                    <h3 className="text-xs font-semibold text-slate-400 uppercase mb-1.5">
                      Domain Taxonomy Alignment
                    </h3>
                    <div className="flex flex-wrap gap-1.5">
                      {Array.from(new Set(resumeData.taxonomy_alignment.map((t: any) => t.aligned_domain))).map((domain: any, i: number) => (
                        <span key={i} className="px-2 py-0.5 bg-[#001621] text-[#FF4103] rounded text-xs border border-[#063750] font-medium">
                          {String(domain)}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Extracted Experience */}
                {Array.isArray(resumeData.experience) && resumeData.experience.length > 0 && (
                  <div>
                    <h3 className="text-xs font-semibold text-slate-400 uppercase mb-1.5">
                      Extracted Work Experience ({resumeData.experience.length})
                    </h3>
                    <div className="space-y-2 max-h-[180px] overflow-y-auto pr-1">
                      {resumeData.experience.map((exp: any, i: number) => (
                        <div key={i} className="p-2.5 bg-[#001621] border border-[#063750] rounded text-xs">
                          <div className="flex items-center justify-between gap-2">
                            <span className="font-semibold text-slate-200">{exp.title || 'Role'}</span>
                            <span className="text-slate-400 text-[11px]">{exp.duration || 'N/A'}</span>
                          </div>
                          <p className="text-slate-400 mt-0.5">{exp.company || 'Organization'}</p>
                          {exp.description && <p className="text-slate-500 mt-1 text-[11px]">{exp.description}</p>}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Extracted Education & Certifications */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {Array.isArray(resumeData.education) && resumeData.education.length > 0 && (
                    <div>
                      <h3 className="text-xs font-semibold text-slate-400 uppercase mb-1.5">
                        Education ({resumeData.education.length})
                      </h3>
                      <ul className="space-y-1 text-xs text-slate-300">
                        {resumeData.education.map((edu: any, i: number) => (
                          <li key={i} className="p-2 bg-[#001621] border border-[#063750] rounded">
                            {typeof edu === 'string' ? edu : `${edu.degree || ''} ${edu.institution || ''}`}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {Array.isArray(resumeData.certifications) && resumeData.certifications.length > 0 && (
                    <div>
                      <h3 className="text-xs font-semibold text-slate-400 uppercase mb-1.5">
                        Certifications ({resumeData.certifications.length})
                      </h3>
                      <ul className="space-y-1 text-xs text-slate-300">
                        {resumeData.certifications.map((cert: any, i: number) => (
                          <li key={i} className="p-2 bg-[#001621] border border-[#063750] rounded">
                            {typeof cert === 'string' ? cert : JSON.stringify(cert)}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>

                {/* Extracted Key Achievements */}
                {Array.isArray(resumeData.achievements) && resumeData.achievements.length > 0 && (
                  <div>
                    <h3 className="text-xs font-semibold text-slate-400 uppercase mb-1.5">
                      Key Achievements & Impact ({resumeData.achievements.length})
                    </h3>
                    <ul className="space-y-1 text-xs text-slate-300 max-h-[120px] overflow-y-auto pr-1">
                      {resumeData.achievements.map((ach: any, i: number) => (
                        <li key={i} className="p-2 bg-[#001621] border border-[#063750] rounded">
                          • {typeof ach === 'string' ? ach : JSON.stringify(ach)}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* RIGHT: Target Requirements */}
          <div className="bg-[#001f2e] border border-[#063750] rounded-xl p-6 space-y-6 flex flex-col">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                <Briefcase className="w-6 h-6 text-[#FF4103]" />
                Target Requirements
              </h2>
              {jdData && !isEditingJd && (
                <button
                  onClick={() => setIsEditingJd(true)}
                  className="text-xs text-slate-400 hover:text-[#FF4103] flex items-center gap-1 transition-colors"
                >
                  <Edit3 className="w-3 h-3" />
                  <span>Edit Requirements</span>
                </button>
              )}
            </div>

            {(!jdData || isEditingJd) && !jdAnalyzing ? (
              <form onSubmit={handleJDAnalyze} className="space-y-4 flex-1 flex flex-col">
                <textarea 
                  value={jdText}
                  onChange={(e) => setJdText(e.target.value)}
                  placeholder="Paste Job Description here to extract target competencies..."
                  className="flex-1 w-full p-4 bg-[#001621] border border-[#002f47] rounded-lg text-slate-300 focus:outline-none focus:border-[#FF4103] resize-none min-h-[200px]"
                />
                <div className="flex gap-2">
                  {isEditingJd && (
                    <button
                      type="button"
                      onClick={() => setIsEditingJd(false)}
                      className="px-4 py-3 bg-[#001824] border border-[#002f47] text-slate-300 hover:text-white rounded-lg text-sm font-semibold transition-colors"
                    >
                      Cancel
                    </button>
                  )}
                  <button
                    type="submit"
                    disabled={!jdText.trim()}
                    className="flex-1 py-3 px-4 bg-[#FF4103] hover:bg-[#e03200] text-white rounded-lg font-semibold disabled:opacity-50 transition-colors"
                  >
                    Analyze Job Description
                  </button>
                </div>
              </form>
            ) : jdAnalyzing ? (
              <div className="flex-1 flex flex-col items-center justify-center text-[#FF4103] space-y-4 py-12">
                <div className="w-8 h-8 border-4 border-[#FF4103] border-t-transparent rounded-full animate-spin" />
                <p>Extracting target requirements...</p>
              </div>
            ) : (
              <div className="space-y-4 flex-1">
                <div className="p-3 bg-green-950/30 border border-green-900/50 rounded-lg flex items-center gap-2 text-green-400 text-sm">
                  <CheckCircle2 className="w-4 h-4" /> Requirements successfully extracted
                </div>
                {jdData?.requirements && (
                  <ul className="space-y-2 max-h-[380px] overflow-y-auto pr-1">
                    {jdData.requirements.map((req: any, i: number) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-slate-300 p-2 bg-[#001621] rounded border border-[#063750]">
                        <ChevronRight className="w-4 h-4 mt-0.5 text-slate-500 shrink-0" />
                        <span>
                          {req.requirement || req} 
                          {req.importance === 'MANDATORY' && (
                            <span className="text-red-400 text-xs font-bold ml-1.5 px-1.5 py-0.5 bg-red-950/50 rounded border border-red-900/50">
                              REQUIRED
                            </span>
                          )}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </div>
        </div>

        {/* BOTTOM: Match Analysis */}
        {resumeData && jdData && (
          <div className="bg-[#001f2e] border border-[#063750] rounded-xl p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <div>
                <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                  <Bot className="w-8 h-8 text-[#FF4103]" />
                  ATS & Match Analysis
                </h2>
                {matchStale && (
                  <p className="text-xs text-amber-400 mt-1 flex items-center gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    Target requirements or evidence updated since last run. Re-run intelligence match to refresh analysis.
                  </p>
                )}
              </div>

              {!matchRunning && (
                <div className="flex items-center gap-3 flex-wrap">
                  {matchData && (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => exportATSResume('global')}
                        className="px-3.5 py-2 bg-[#001824] hover:bg-[#002538] border border-[#002f47] text-slate-300 hover:text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors"
                        title="Download Global ATS Document"
                      >
                        <Download className="w-3.5 h-3.5 text-[#FF4103]" />
                        <span>Global ATS (DOCX)</span>
                      </button>
                      <button
                        onClick={() => exportATSResume('tailored')}
                        className="px-3.5 py-2 bg-[#001824] hover:bg-[#002538] border border-[#002f47] text-slate-300 hover:text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors"
                        title="Download Tailored ATS Document"
                      >
                        <Download className="w-3.5 h-3.5 text-[#FF4103]" />
                        <span>Tailored ATS (DOCX)</span>
                      </button>
                    </div>
                  )}
                  <button
                    onClick={handleMatch}
                    className="px-6 py-2.5 bg-[#FF4103] hover:bg-[#e03200] text-white rounded-lg font-semibold text-sm transition-colors shadow-lg shadow-[#FF4103]/20"
                  >
                    {matchData ? 'Re-run Intelligence Match' : 'Run Intelligence Match'}
                  </button>
                </div>
              )}
            </div>

            {matchRunning && (
              <div className="flex flex-col items-center justify-center text-[#FF4103] space-y-4 py-12">
                <div className="w-8 h-8 border-4 border-[#FF4103] border-t-transparent rounded-full animate-spin" />
                <p>Correlating evidence against requirements...</p>
                <span className="text-xs text-slate-500">Checking semantic alignment and ATS parseability</span>
              </div>
            )}

            {matchData && !matchRunning && (
              <div className="space-y-8">
                {/* ATS Score */}
                <div className="flex items-center gap-4 p-4 bg-[#001621] border border-[#063750] rounded-lg">
                  <div className="text-4xl font-bold text-white">
                    {matchData.ats_score}
                    <span className="text-lg text-slate-500">/100</span>
                  </div>
                  <div>
                    <h3 className="font-semibold text-white">Parseability & Alignment</h3>
                    <p className="text-sm text-slate-400">
                      Derived objectively from evidence overlap.
                      {matchData.ats_breakdown && (
                        <span className="text-xs text-slate-500 ml-2">
                          (Format: {matchData.ats_breakdown.format?.score || 0}%, Keyword: {matchData.ats_breakdown.keyword_match?.score || 0}%, Structure: {matchData.ats_breakdown.structure?.score || 0}%, AI: {matchData.ats_breakdown.ai_alignment?.score || 0}%)
                        </span>
                      )}
                    </p>
                  </div>
                </div>

                {/* Flagged Contradictions */}
                {Array.isArray(matchData.contradictions) && matchData.contradictions.length > 0 && (
                  <div className="p-4 bg-orange-950/30 border border-orange-800/60 rounded-lg space-y-3">
                    <h3 className="text-sm font-bold uppercase text-orange-400 flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4" />
                      Flagged Contradictions & Review Alerts ({matchData.contradictions.length})
                    </h3>
                    <div className="space-y-2">
                      {matchData.contradictions.map((contra: any, idx: number) => (
                        <div key={idx} className="p-3 bg-[#001621] border border-orange-900/50 rounded text-xs space-y-1">
                          <p className="font-semibold text-orange-300">Claim: {contra.claim}</p>
                          <p className="text-slate-300">Evidence: {contra.evidence}</p>
                          <p className="text-slate-400 italic">{contra.explanation}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Gap Analysis */}
                <div>
                  <h3 className="text-lg font-semibold text-white mb-4">Evidence Gap Analysis</h3>
                  <div className="space-y-3">
                    {matchData.gap_analysis?.map((gap: any, i: number) => (
                      <div key={i} className="p-4 bg-[#001621] border border-[#063750] rounded-lg">
                        <div className="flex items-start gap-3">
                          {getStatusIcon(gap.status)}
                          <div className="flex-1">
                            <div className="flex items-center justify-between gap-2 flex-wrap">
                              <p className="font-medium text-slate-200">{gap.requirement}</p>
                              {getStatusBadge(gap.status)}
                            </div>
                            {gap.candidate_evidence && (
                              <p className="text-sm text-slate-400 mt-1">
                                <span className="text-[#FF4103] font-semibold">Evidence:</span> {gap.candidate_evidence}
                              </p>
                            )}
                            {gap.explanation && (
                              <p className="text-sm text-slate-400 mt-2 bg-[#001f2e] p-2 rounded border border-[#002f47]">
                                {gap.explanation}
                              </p>
                            )}
                            {gap.status === 'CONTRADICTORY' && (
                              <div className="mt-2 text-xs font-semibold text-orange-400 bg-orange-950/50 inline-block px-2 py-1 rounded">
                                NEEDS HUMAN REVIEW - PLEASE VERIFY
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Improvements */}
                {matchData.improvement_suggestions && matchData.improvement_suggestions.length > 0 && (
                  <div aria-live="polite">
                    <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                      <Sparkles className="w-5 h-5 text-yellow-500" aria-hidden="true" />
                      Actionable Improvements
                    </h3>
                    <div className="p-3 bg-yellow-950/20 border border-yellow-900/50 rounded-lg text-yellow-500 text-xs mb-4" role="alert">
                      Warning: Generated wording does not establish new experience. Verify and customize suggestions against your actual work history before applying.
                    </div>
                    <div className="space-y-4" role="group" aria-label="Optimization Suggestions">
                      {matchData.improvement_suggestions.map((sugg: any, i: number) => {
                        const defaultText = sugg.suggested_text || sugg.text || '';
                        const currentText = editedSuggestions[i] !== undefined ? editedSuggestions[i] : defaultText;
                        return (
                          <div key={i} className="flex gap-4 p-4 bg-[#001621] border border-[#063750] rounded-lg items-start">
                            <label className="sr-only" htmlFor={`opt-sugg-${i}`}>Accept suggestion {i+1}</label>
                            <input 
                              type="checkbox" 
                              id={`opt-sugg-${i}`} 
                              className="mt-1 w-5 h-5 rounded border-[#002f47] bg-slate-800 text-[#FF4103] focus:ring-[#FF4103] focus:ring-offset-slate-950" 
                              checked={acceptedSuggestions.has(i)} 
                              onChange={() => toggleSuggestion(i)} 
                            />
                            <div className="grid md:grid-cols-2 gap-4 flex-1">
                              <div>
                                <span className="text-xs font-bold text-slate-500 uppercase">Original Evidence</span>
                                <p className="text-sm text-slate-400 mt-1">{sugg.source_evidence || 'General Profile'}</p>
                              </div>
                              <div>
                                <div className="flex items-center justify-between">
                                  <span className="text-xs font-bold text-[#FF4103] uppercase">Suggested Rewrite (Editable)</span>
                                  <div className="flex items-center gap-2">
                                    {editedSuggestions[i] !== undefined && editedSuggestions[i] !== defaultText && (
                                      <button
                                        type="button"
                                        onClick={() => {
                                          const next = { ...editedSuggestions };
                                          delete next[i];
                                          setEditedSuggestions(next);
                                        }}
                                        className="text-[11px] text-slate-400 hover:text-white"
                                      >
                                        Reset
                                      </button>
                                    )}
                                    <button
                                      type="button"
                                      onClick={() => handleCopySuggestion(i, currentText)}
                                      className="text-[11px] text-slate-300 hover:text-[#FF4103] px-2 py-0.5 rounded bg-[#001f2e] border border-[#063750]"
                                    >
                                      {copiedSuggestionIdx === i ? 'Copied!' : 'Copy'}
                                    </button>
                                  </div>
                                </div>
                                <textarea
                                  rows={2}
                                  value={currentText}
                                  onChange={(e) => setEditedSuggestions({ ...editedSuggestions, [i]: e.target.value })}
                                  aria-label={`Edit suggestion ${i + 1}`}
                                  className="w-full mt-1.5 p-2 bg-[#001f2e] border border-[#063750] rounded text-sm text-slate-200 focus:outline-none focus:border-[#FF4103]"
                                />
                                {sugg.rationale && (
                                  <p className="text-xs text-slate-500 mt-1.5 italic">{sugg.rationale}</p>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    {acceptedSuggestions.size > 0 && (
                      <div className="mt-6">
                        <button 
                          onClick={applyOptimizations} 
                          disabled={optimizing} 
                          className="px-6 py-3 bg-yellow-600 hover:bg-yellow-700 disabled:opacity-50 text-white rounded-lg font-semibold focus:ring-2 focus:ring-yellow-500 transition-colors"
                        >
                          {optimizing ? 'Generating New Version...' : `Apply ${acceptedSuggestions.size} Optimizations (Creates v${(resumeVersion || 1) + 1})`}
                        </button>
                      </div>
                    )}
                    {optimizedResumeId && (
                      <div className="mt-6 p-4 bg-green-950/30 border border-green-900/50 rounded-lg flex items-center justify-between gap-3 text-green-400" role="status">
                        <div className="flex items-center gap-2.5">
                          <CheckCircle2 className="w-5 h-5 shrink-0" aria-hidden="true" />
                          <span>Successfully created active resume version (v{resumeVersion})! You can now export your Tailored ATS DOCX above.</span>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Reset Confirmation Modal */}
        {showResetModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
            <div className="bg-[#001f2e] border border-[#063750] rounded-2xl w-full max-w-md p-6 shadow-2xl relative">
              <div className="flex items-center gap-3 text-amber-400 mb-3">
                <AlertTriangle className="w-6 h-6 shrink-0" />
                <h3 className="text-lg font-bold text-white">Reset Module 1?</h3>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                This clears your current M01 working state, target requirements, and match analysis from this workspace.
                Your original uploaded evidence and parsed skills remain protected in accordance with evidence-storage rules.
              </p>
              <div className="flex items-center justify-end gap-3 mt-6 pt-4 border-t border-[#002f47]">
                <button
                  type="button"
                  disabled={resetting}
                  onClick={() => setShowResetModal(false)}
                  className="px-4 py-2 rounded-xl bg-[#001824] border border-[#002f47] text-slate-300 hover:text-white text-xs font-bold transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={resetting}
                  onClick={handleManualReset}
                  className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold shadow-md shadow-red-600/20 transition-all flex items-center gap-2"
                >
                  {resetting ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Resetting...</span>
                    </>
                  ) : (
                    <span>Confirm Reset</span>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Global Candidate Journey Navigation */}
        <ModuleNavigationFooter 
          currentModule="M01" 
          isCompleted={Boolean(matchData || resumeData)} 
        />
      </div>
    </div>
  );
}
