import { useState, useEffect } from 'react';
import { 
  Brain, Target, Compass, BookOpen, CheckCircle2, AlertTriangle, 
  Sparkles, ArrowRight, RefreshCw, Download, Play, MessageSquare, 
  HelpCircle, ChevronRight, ShieldCheck, Flame, Send, Award, FileText,
  Globe, ExternalLink, FolderGit2, Check, X, Lightbulb, Sliders,
  Filter, Search, PlusCircle, BarChart3, Clock, Layers, Shield
} from 'lucide-react';
import DashboardLayout from './dashboard/DashboardLayout';

type Tab = 'profile' | 'intelligence' | 'plan' | 'simulation' | 'readiness';
type SimMode = 'practice' | 'learning' | 'mock' | 'assessment' | 'targeted';

export default function InterviewPrep() {
  const [tab, setTab] = useState<Tab>('profile');
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<any>(null);
  const [plan, setPlan] = useState<any>(null);
  const [readiness, setReadiness] = useState<any>(null);

  // Market Intelligence state
  const [intelCategory, setIntelCategory] = useState<string>('all');
  const [intelDomain, setIntelDomain] = useState<string>('all');
  const [intelSeniority, setIntelSeniority] = useState<string>('all');
  const [intelTrack, setIntelTrack] = useState<string>('all');
  const [intelSearch, setIntelSearch] = useState<string>('');
  const [intelQuestions, setIntelQuestions] = useState<any[]>([]);
  const [intelLoading, setIntelLoading] = useState(false);
  const [intelCoverage, setIntelCoverage] = useState<any>(null);
  const [auditLoading, setAuditLoading] = useState(false);
  const [auditResult, setAuditResult] = useState<any>(null);

  // Practice Drill Generator Modal state
  const [generateModalOpen, setGenerateModalOpen] = useState(false);
  const [genRole, setGenRole] = useState('');
  const [genDomain, setGenDomain] = useState('dom_it');
  const [genSeniority, setGenSeniority] = useState('mid');
  const [genTrack, setGenTrack] = useState('technical');
  const [genCompetency, setGenCompetency] = useState('');
  const [genObjective, setGenObjective] = useState('');
  const [genLoading, setGenLoading] = useState(false);
  const [genSuccess, setGenSuccess] = useState<string | null>(null);

  // Progressive Hint state
  const [activeHints, setActiveHints] = useState<string[]>([]);
  const [hintLoading, setHintLoading] = useState(false);
  const [hintMaxReached, setHintMaxReached] = useState(false);

  // Clarification Modal state
  const [clarifyModalOpen, setClarifyModalOpen] = useState(false);
  const [clarifyRole, setClarifyRole] = useState('');
  const [clarifyDomain, setClarifyDomain] = useState('');
  const [clarifyExperience, setClarifyExperience] = useState('');
  const [clarifySubmitting, setClarifySubmitting] = useState(false);
  const [clarifySuccess, setClarifySuccess] = useState<string | null>(null);

  // Simulation state
  const [mode, setMode] = useState<SimMode>('mock');
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [currentQuestion, setCurrentQuestion] = useState<any>(null);
  const [answerText, setAnswerText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [history, setHistory] = useState<any[]>([]);
  const [sessionCompleted, setSessionCompleted] = useState(false);
  const [debrief, setDebrief] = useState<any>(null);
  const [exporting, setExporting] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const [profRes, readRes, activeRes] = await Promise.all([
        fetch('/api/m2/prep/profile'),
        fetch('/api/m2/prep/readiness'),
        fetch('/api/m2/prep/sessions/active')
      ]);
      const profData: any = await profRes.json();
      const readData: any = await readRes.json();
      const activeData: any = activeRes.ok ? await activeRes.json() : { success: false };
      
      if (profData.success) {
        setProfile(profData.profile);
        setGenRole(profData.profile.target_role || 'AI & Machine Learning Engineer');
        // Load plan for candidate target role
        const planRes = await fetch('/api/m2/prep/plan', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ target_role: profData.profile.target_role })
        });
        const planData: any = await planRes.json();
        if (planData.success) setPlan(planData);
      }
      if (readData.success) setReadiness(readData.readiness);
      if (activeData.success && activeData.session_id) {
        setSessionId(activeData.session_id);
        if (activeData.mode) setMode(activeData.mode as SimMode);
        if (Array.isArray(activeData.history)) setHistory(activeData.history);
        await fetchNextQuestion(activeData.session_id);
      }
    } catch (e) {
      console.error('Failed to load prep data', e);
    } finally {
      setLoading(false);
    }
  };

  const loadIntelligence = async () => {
    setIntelLoading(true);
    try {
      const params = new URLSearchParams();
      if (intelCategory !== 'all') params.set('category', intelCategory);
      if (intelDomain !== 'all') params.set('domain', intelDomain);
      if (intelSeniority !== 'all') params.set('seniority', intelSeniority);
      if (intelTrack !== 'all') params.set('type', intelTrack);
      if (intelSearch.trim()) params.set('q', intelSearch.trim());
      params.set('limit', '50');

      const [qRes, cRes] = await Promise.all([
        fetch(`/api/m2/intelligence/questions?${params.toString()}`),
        fetch('/api/m2/intelligence/coverage')
      ]);

      if (qRes.ok) {
        const data: any = await qRes.json();
        setIntelQuestions(data.questions || []);
      }
      if (cRes.ok) {
        const cData: any = await cRes.json();
        setIntelCoverage(cData);
      }
    } catch (e) {
      console.error('Failed to load intelligence questions', e);
    } finally {
      setIntelLoading(false);
    }
  };

  const triggerFreshnessAudit = async () => {
    setAuditLoading(true);
    try {
      const res = await fetch('/api/m2/intelligence/verify-freshness', { method: 'POST' });
      if (res.ok) {
        const data: any = await res.json();
        setAuditResult(data);
        await loadIntelligence();
      }
    } catch (e) {
      console.error('Failed to audit freshness', e);
    } finally {
      setAuditLoading(false);
    }
  };

  const submitGenerateDrill = async () => {
    if (!genRole.trim() || !genCompetency.trim()) {
      alert('Please provide a target role and competency.');
      return;
    }
    setGenLoading(true);
    try {
      const res = await fetch('/api/m2/intelligence/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          target_role: genRole.trim(),
          domain: genDomain,
          seniority_level: genSeniority,
          question_type: genTrack,
          competency: genCompetency.trim(),
          learning_objective: genObjective.trim() || undefined,
          store_in_bank: true
        })
      });
      const data: any = await res.json();
      if (data.success) {
        setGenSuccess('Practice drill generated and added to question bank!');
        setTimeout(() => {
          setGenSuccess(null);
          setGenerateModalOpen(false);
        }, 1500);
        await loadIntelligence();
      } else {
        alert(data.error || 'Failed to generate drill');
      }
    } catch (e) {
      alert('Error generating practice drill');
    } finally {
      setGenLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (tab === 'intelligence') {
      loadIntelligence();
    }
  }, [tab, intelCategory, intelDomain, intelSeniority, intelTrack]);

  const submitClarifications = async () => {
    setClarifySubmitting(true);
    try {
      const clarifications: any[] = [];
      if (clarifyRole.trim()) {
        clarifications.push({ field: 'target_role', value: clarifyRole.trim(), action: 'confirmed' });
      }
      if (clarifyDomain.trim()) {
        clarifications.push({ field: 'primary_domain', value: clarifyDomain.trim(), action: 'confirmed' });
      }
      if (clarifyExperience.trim()) {
        clarifications.push({ field: 'experience_level', value: clarifyExperience.trim(), action: 'confirmed' });
      }

      const res = await fetch('/api/m2/prep/profile/clarify', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clarifications })
      });
      const data: any = await res.json();
      if (data.success) {
        setClarifySuccess(data.message || 'Profile clarified successfully!');
        setTimeout(() => {
          setClarifySuccess(null);
          setClarifyModalOpen(false);
        }, 1500);
        await loadData();
      } else {
        alert(data.error || 'Failed to clarify profile');
      }
    } catch (e) {
      alert('Error updating clarifications');
    } finally {
      setClarifySubmitting(false);
    }
  };

  const startSimulation = async (simMode: SimMode = mode) => {
    setMode(simMode);
    setLoading(true);
    setHistory([]);
    setSessionCompleted(false);
    setDebrief(null);
    setActiveHints([]);
    setHintMaxReached(false);
    try {
      const res = await fetch('/api/m2/prep/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode: simMode,
          target_role: profile?.target_role || 'Target Role'
        })
      });
      const data: any = await res.json();
      if (data.success) {
        setSessionId(data.session_id);
        setTab('simulation');
        await fetchNextQuestion(data.session_id);
      }
    } catch (e) {
      alert('Error starting interview session');
    } finally {
      setLoading(false);
    }
  };

  const fetchNextQuestion = async (sid: string) => {
    try {
      setActiveHints([]);
      setHintMaxReached(false);
      const res = await fetch(`/api/m2/prep/sessions/${sid}/question`, { method: 'POST' });
      const data: any = await res.json();
      if (data.completed) {
        await completeSimulation(sid);
      } else if (data.success && data.question) {
        setCurrentQuestion(data.question);
        setAnswerText('');
      }
    } catch (e) {
      console.error('Error fetching question', e);
    }
  };

  const requestProgressiveHint = async () => {
    if (!sessionId || !currentQuestion) return;
    setHintLoading(true);
    try {
      const nextLevel = activeHints.length + 1;
      const res = await fetch(`/api/m2/prep/sessions/${sessionId}/hint`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question_id: currentQuestion.id,
          level: nextLevel
        })
      });
      const data: any = await res.json();
      if (data.success && data.hint) {
        setActiveHints(prev => [...prev, data.hint]);
        if (data.level >= data.max_levels) {
          setHintMaxReached(true);
        }
      }
    } catch (e) {
      console.error('Failed to get hint', e);
    } finally {
      setHintLoading(false);
    }
  };

  const submitAnswer = async () => {
    if (!answerText.trim() || !sessionId || !currentQuestion) return;
    setSubmitting(true);
    try {
      const res = await fetch(`/api/m2/prep/sessions/${sessionId}/respond`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: currentQuestion,
          response_text: answerText
        })
      });
      const data: any = await res.json();
      if (data.success) {
        setHistory(prev => [...prev, {
          question: currentQuestion,
          answer: answerText,
          evaluation: data.evaluation,
          follow_up: data.follow_up,
          teaching_payload: data.teaching_payload,
          model_answer: data.model_answer
        }]);
        setAnswerText('');
        setActiveHints([]);
        setHintMaxReached(false);
        // Fetch next or trigger completion
        await fetchNextQuestion(sessionId);
      }
    } catch (e) {
      alert('Failed to evaluate answer');
    } finally {
      setSubmitting(false);
    }
  };

  const completeSimulation = async (sid: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/m2/prep/sessions/${sid}/complete`, { method: 'POST' });
      const data: any = await res.json();
      if (data.success) {
        setDebrief(data);
        setSessionCompleted(true);
        setCurrentQuestion(null);
      }
    } catch (e) {
      console.error('Failed to complete session', e);
    } finally {
      setLoading(false);
    }
  };

  const exportGuide = async () => {
    if (!sessionId) {
      alert('Start or complete a preparation session first to export a personalized guide.');
      return;
    }
    setExporting(true);
    try {
      const res = await fetch(`/api/m2/prep/sessions/${sessionId}/export`);
      if (!res.ok) throw new Error('Export failed');
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `IntelliHire_Prep_Guide_${profile?.target_role?.replace(/\s+/g, '_') || 'General'}.docx`;
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch (e) {
      alert('Failed to generate DOCX preparation guide.');
    } finally {
      setExporting(false);
    }
  };

  return (
    <DashboardLayout role="candidate" userFullName="Candidate Command">
      <div className="space-y-8">
        {/* Header */}
        <header className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-5 pb-6 border-b border-[#063750]">
          <div>
            <div className="flex items-center gap-2 text-[#FF4103] text-xs font-bold uppercase tracking-wider mb-2">
              <Brain className="w-4 h-4 text-[#FF4103]" />
              <span>Module 2 · Universal Adaptive Evidence</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
              Adaptive Interview Preparation Engine
            </h1>
            <p className="text-slate-300 text-sm mt-1.5 max-w-3xl">
              Synthesizes real candidate facts, verified projects, and diagnosed gaps into a transparent preparation matrix, market interview benchmarks, and interactive project deep-dive simulations.
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={() => startSimulation('mock')}
              className="px-4 py-2.5 rounded-xl bg-[#FF4103] hover:bg-[#e03200] text-white text-xs font-bold flex items-center gap-2 shadow-lg shadow-[#FF4103]/20 transition-all"
            >
              <Play className="w-4 h-4" />
              <span>Launch Mock Interview</span>
            </button>
            <button
              onClick={exportGuide}
              disabled={exporting || !sessionId}
              className="px-4 py-2.5 rounded-xl bg-[#001f2e] border border-[#063750] text-slate-200 hover:text-white hover:bg-[#00273c] text-xs font-bold flex items-center gap-2 transition-colors disabled:opacity-50"
              title="Download DOCX preparation guide"
            >
              <Download className="w-4 h-4 text-[#FF4103]" />
              <span>{exporting ? 'Generating…' : 'Export Guide (.docx)'}</span>
            </button>
          </div>
        </header>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 border-b border-[#063750] pb-2 overflow-x-auto">
          {[
            { id: 'profile', label: 'Preparation Profile', icon: Compass },
            { id: 'intelligence', label: 'Market Benchmarks', icon: Globe },
            { id: 'plan', label: 'Evidence-Based Plan', icon: Target },
            { id: 'simulation', label: 'Interactive Simulator', icon: MessageSquare },
            { id: 'readiness', label: 'Readiness Synthesis', icon: Award }
          ].map(t => {
            const Icon = t.icon;
            const active = tab === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setTab(t.id as Tab)}
                className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all whitespace-nowrap ${
                  active 
                    ? 'bg-[#FF4103] text-white shadow-md shadow-[#FF4103]/20' 
                    : 'bg-[#001f2e] border border-[#063750] text-slate-300 hover:text-white'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{t.label}</span>
              </button>
            );
          })}
        </div>

        {/* ================= TAB 1: PREPARATION PROFILE ================= */}
        {tab === 'profile' && (
          <div className="space-y-6">
            <div className="grid lg:grid-cols-3 gap-6">
              {/* Target Role Context */}
              <div className="bg-[#001f2e] border border-[#063750] rounded-2xl p-6 shadow-lg">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-400 uppercase font-semibold">Target Context</span>
                  <button
                    onClick={() => {
                      setClarifyRole(profile?.target_role || '');
                      setClarifyDomain(profile?.domain || '');
                      setClarifyExperience(profile?.experience_level || '');
                      setClarifyModalOpen(true);
                    }}
                    className="text-[#FF4103] hover:underline text-xs font-bold flex items-center gap-1"
                  >
                    <Sliders className="w-3 h-3" />
                    <span>Clarify</span>
                  </button>
                </div>
                <h3 className="text-xl font-bold text-white mt-1">{profile?.target_role || 'General Professional'}</h3>
                <div className="mt-3 space-y-2 text-xs text-slate-300">
                  <div><span className="text-slate-500">Domain:</span> {profile?.domain || 'General'}</div>
                  <div><span className="text-slate-500">Seniority:</span> {profile?.experience_level?.toUpperCase() || 'MID'}</div>
                  <div><span className="text-slate-500">Claims Verified:</span> {profile?.claims_count || 0} assertions</div>
                </div>
              </div>

              {/* Diagnosed Gaps */}
              <div className="bg-[#001f2e] border border-[#063750] rounded-2xl p-6 shadow-lg lg:col-span-2">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-amber-400" />
                    <span>Diagnosed Weak Areas & Uncertainty Targets</span>
                  </h3>
                  <span className="text-xs text-slate-400">{profile?.gaps?.length || 0} priority targets</span>
                </div>
                <div className="grid sm:grid-cols-2 gap-3 mt-3">
                  {profile?.gaps?.length === 0 ? (
                    <div className="text-xs text-slate-400 p-4 bg-[#001824] rounded-xl border border-[#002f47] sm:col-span-2">
                      No critical gaps diagnosed yet. Complete an adaptive assessment to identify targeted focus areas.
                    </div>
                  ) : (
                    profile?.gaps?.map((g: any, i: number) => (
                      <div key={i} className="p-3 bg-[#001824] border border-[#002f47] rounded-xl">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-bold text-white truncate">{g.name}</span>
                          <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold uppercase ${
                            g.severity === 'critical' ? 'bg-red-500/10 text-red-400' : 'bg-amber-500/10 text-amber-400'
                          }`}>
                            {g.severity}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-400 mt-1">{g.competency}</div>
                        <div className="text-[10px] text-slate-500 mt-1 flex justify-between">
                          <span>Proficiency: {Math.round(g.proficiency * 100)}%</span>
                          <span>Uncertainty: {Math.round(g.uncertainty * 100)}%</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            {/* Transparent Role-to-Evidence Gap Analysis Matrix */}
            <div className="bg-[#001f2e] border border-[#063750] rounded-2xl p-6 shadow-lg space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-[#002a40]">
                <div>
                  <div className="flex items-center gap-2">
                    <Target className="w-4 h-4 text-[#FF4103]" />
                    <h3 className="text-base font-bold text-white">Transparent Role-to-Evidence Gap Matrix</h3>
                  </div>
                  <p className="text-xs text-slate-400 mt-1">
                    Every requirement for <strong className="text-white">{profile?.target_role}</strong> is cross-referenced with your verified source evidence and mapped to learning objectives.
                  </p>
                </div>
                <span className="text-xs font-mono px-2.5 py-1 rounded bg-[#001824] border border-[#063750] text-slate-300">
                  {profile?.transparent_gap_matrix?.length || 0} Evaluated Competencies
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead>
                    <tr className="border-b border-[#002f47] text-slate-400 uppercase text-[10px] tracking-wider">
                      <th className="py-2.5 px-3">Role Requirement</th>
                      <th className="py-2.5 px-3">Candidate Source Evidence</th>
                      <th className="py-2.5 px-3">Confidence Status</th>
                      <th className="py-2.5 px-3">Learning Objective</th>
                      <th className="py-2.5 px-3">Assessment Method</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#002a40]/60">
                    {(profile?.transparent_gap_matrix || []).map((row: any, idx: number) => {
                      const statusConfig = {
                        demonstrated: { bg: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30', label: 'Demonstrated' },
                        partial_evidence: { bg: 'bg-amber-500/15 text-amber-400 border-amber-500/30', label: 'Partial Evidence' },
                        gap_unverified: { bg: 'bg-red-500/15 text-red-400 border-red-500/30', label: 'Gap (Unverified)' },
                        outdated: { bg: 'bg-slate-500/15 text-slate-400 border-slate-500/30', label: 'Outdated' }
                      }[row.confidence_status as 'demonstrated' | 'partial_evidence' | 'gap_unverified' | 'outdated'] || {
                        bg: 'bg-slate-500/15 text-slate-400 border-slate-500/30', label: row.confidence_status
                      };

                      return (
                        <tr key={idx} className="hover:bg-[#002538]/50 transition-colors">
                          <td className="py-3 px-3 font-semibold text-white max-w-[200px]">
                            <div>{row.role_requirement}</div>
                            <span className="text-[10px] font-mono text-slate-500 uppercase">{row.category?.replace('_', ' ')}</span>
                          </td>
                          <td className="py-3 px-3 text-slate-300 max-w-[240px]">
                            {row.candidate_evidence}
                          </td>
                          <td className="py-3 px-3 whitespace-nowrap">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${statusConfig.bg}`}>
                              {statusConfig.label}
                            </span>
                          </td>
                          <td className="py-3 px-3 text-slate-400 max-w-[240px]">
                            {row.learning_objective}
                          </td>
                          <td className="py-3 px-3 text-slate-300 font-mono text-[11px] whitespace-nowrap">
                            {row.assessment_method?.replace('_', ' ')}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Verified Candidate Projects & Source Inventory */}
            {profile?.verified_projects?.length > 0 && (
              <div className="bg-[#001f2e] border border-[#063750] rounded-2xl p-6 shadow-lg space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-[#002a40]">
                  <div className="flex items-center gap-2">
                    <FolderGit2 className="w-4 h-4 text-[#FF4103]" />
                    <h3 className="text-base font-bold text-white">Verified Candidate Projects (Interview Deep-Dive Grounds)</h3>
                  </div>
                  <span className="text-xs text-slate-400">{profile.verified_projects.length} Ingested Projects</span>
                </div>
                <div className="grid md:grid-cols-2 gap-4">
                  {profile.verified_projects.map((proj: any, idx: number) => (
                    <div key={idx} className="p-4 bg-[#001824] rounded-xl border border-[#002f47] space-y-2 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-white text-sm">{proj.name}</span>
                        {proj.repoUrl && (
                          <a
                            href={proj.repoUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[#FF4103] hover:underline flex items-center gap-1 text-[11px]"
                          >
                            <span>Repository</span>
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        )}
                      </div>
                      {proj.tech && (
                        <div className="text-[11px] text-slate-400 font-mono">
                          <span className="text-slate-500">Stack:</span> {proj.tech}
                        </div>
                      )}
                      {proj.description && (
                        <p className="text-slate-300 line-clamp-3 leading-relaxed">{proj.description}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Transparent Profile Assumptions & Clarification Control */}
            {profile?.assumptions?.length > 0 && (
              <div className="bg-[#001f2e] border border-[#063750] rounded-2xl p-6 shadow-lg space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#002a40]">
                  <div>
                    <div className="flex items-center gap-2">
                      <HelpCircle className="w-4 h-4 text-amber-400" />
                      <h3 className="text-base font-bold text-white">Profile Assumptions & Confidence Bounds</h3>
                    </div>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Verify, confirm, or correct automated inferences before starting targeted interview preparation.
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      setClarifyRole(profile?.target_role || '');
                      setClarifyDomain(profile?.domain || '');
                      setClarifyExperience(profile?.experience_level || '');
                      setClarifyModalOpen(true);
                    }}
                    className="px-3.5 py-2 rounded-xl bg-[#001824] border border-[#FF4103] text-[#FF4103] hover:bg-[#FF4103] hover:text-white text-xs font-bold flex items-center gap-2 transition-all self-start sm:self-auto"
                  >
                    <Sliders className="w-3.5 h-3.5" />
                    <span>Clarify Profile Assumptions</span>
                  </button>
                </div>

                <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-3">
                  {profile.assumptions.map((a: any, i: number) => (
                    <div key={i} className="p-3 bg-[#001824] rounded-xl border border-[#002f47] space-y-1 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-white">{a.label}</span>
                        <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold uppercase ${
                          a.status === 'candidate_confirmed' ? 'bg-emerald-500/15 text-emerald-400' : 'bg-amber-500/15 text-amber-400'
                        }`}>
                          {a.status === 'candidate_confirmed' ? 'Confirmed' : 'Assumed'}
                        </span>
                      </div>
                      <div className="text-slate-300 font-medium">{a.current_value}</div>
                      <div className="text-[11px] text-slate-400 leading-snug">{a.explanation}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Recurring Misconceptions from Teaching Engine */}
            {profile?.misconceptions?.length > 0 && (
              <div className="bg-[#001f2e] border border-amber-500/30 rounded-2xl p-6 shadow-lg">
                <h3 className="text-base font-bold text-white flex items-center gap-2 mb-2">
                  <Sparkles className="w-4 h-4 text-[#FF4103]" />
                  <span>Diagnosed Cognitive Misconceptions (From M2 Teaching Engine)</span>
                </h3>
                <p className="text-xs text-slate-400 mb-4">
                  These underlying misconceptions were automatically extracted when you answered previous assessment items incorrectly.
                </p>
                <div className="space-y-2.5">
                  {profile.misconceptions.map((m: any, i: number) => (
                    <div key={i} className="p-3 bg-[#001824] border border-amber-500/20 rounded-xl flex items-start gap-3">
                      <span className="text-[#FF4103] font-bold text-xs mt-0.5">#{i + 1}</span>
                      <div>
                        <div className="text-xs font-semibold text-amber-200">{m.skill}</div>
                        <div className="text-xs text-slate-300 mt-0.5">{m.misconception}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ================= TAB 2: MARKET INTERVIEW INTELLIGENCE & UNIVERSAL ROLE COVERAGE ================= */}
        {tab === 'intelligence' && (
          <div className="space-y-6">
            {/* Header & Primary Actions */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-2">
              <div>
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <Globe className="w-5 h-5 text-[#FF4103]" />
                  <span>Market-Researched Interview Benchmarks & Universal Intelligence</span>
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  Evidence-grounded interview benchmarks across technical, engineering, finance, management, and clinical domains with verified provenance.
                </p>
              </div>

              <div className="flex items-center gap-2.5 flex-wrap">
                <button
                  onClick={() => setGenerateModalOpen(true)}
                  className="px-3.5 py-2 rounded-xl bg-[#FF4103] hover:bg-[#e03200] text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-[#FF4103]/20 transition-all"
                >
                  <PlusCircle className="w-4 h-4" />
                  <span>Generate Practice Drill</span>
                </button>
                <button
                  onClick={triggerFreshnessAudit}
                  disabled={auditLoading}
                  className="px-3.5 py-2 rounded-xl bg-[#001824] border border-[#063750] hover:border-slate-400 text-slate-300 hover:text-white text-xs font-bold flex items-center gap-1.5 transition-all"
                  title="Verify freshness policy and check for stale or duplicate benchmarks"
                >
                  <RefreshCw className={`w-3.5 h-3.5 text-[#FF4103] ${auditLoading ? 'animate-spin' : ''}`} />
                  <span>{auditLoading ? 'Auditing...' : 'Audit Freshness'}</span>
                </button>
              </div>
            </div>

            {/* Coverage & Freshness KPI Strip */}
            {intelCoverage && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3.5 bg-[#001f2e] border border-[#063750] rounded-xl space-y-1">
                  <div className="flex items-center justify-between text-slate-400 text-xs">
                    <span>Total Benchmarks</span>
                    <BarChart3 className="w-3.5 h-3.5 text-[#FF4103]" />
                  </div>
                  <div className="text-xl font-black text-white">{intelCoverage.total_items || 0}</div>
                  <div className="text-[10px] text-slate-400 font-mono">Curated & Verified</div>
                </div>

                <div className="p-3.5 bg-[#001f2e] border border-[#063750] rounded-xl space-y-1">
                  <div className="flex items-center justify-between text-slate-400 text-xs">
                    <span>Roles Covered</span>
                    <Layers className="w-3.5 h-3.5 text-blue-400" />
                  </div>
                  <div className="text-xl font-black text-white">{intelCoverage.total_occupations_covered || 0}</div>
                  <div className="text-[10px] text-slate-400 font-mono">5 Major Domains</div>
                </div>

                <div className="p-3.5 bg-[#001f2e] border border-[#063750] rounded-xl space-y-1">
                  <div className="flex items-center justify-between text-slate-400 text-xs">
                    <span>Freshness Rate</span>
                    <Clock className="w-3.5 h-3.5 text-emerald-400" />
                  </div>
                  <div className="text-xl font-black text-emerald-400">{intelCoverage.freshness_rate_pct || 100}%</div>
                  <div className="text-[10px] text-slate-400 font-mono">Within 180-Day Window</div>
                </div>

                <div className="p-3.5 bg-[#001f2e] border border-[#063750] rounded-xl space-y-1">
                  <div className="flex items-center justify-between text-slate-400 text-xs">
                    <span>Employer Guidance</span>
                    <Shield className="w-3.5 h-3.5 text-purple-400" />
                  </div>
                  <div className="text-xl font-black text-purple-400">
                    {intelCoverage.provenance_breakdown?.employer_guidance || 2}
                  </div>
                  <div className="text-[10px] text-slate-400 font-mono">Official Portals</div>
                </div>
              </div>
            )}

            {/* Freshness Audit Result Alert */}
            {auditResult && (
              <div className="p-3.5 bg-emerald-500/10 border border-emerald-500/30 rounded-xl flex items-start gap-2.5 text-xs text-emerald-300">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <div className="space-y-0.5">
                  <span className="font-bold">Freshness Audit Completed: </span>
                  <span>
                    Audited {auditResult.total_audited} benchmarks. Stale items: {auditResult.stale_items_count}. Duplicate pairs: {auditResult.duplicate_items_count}. All active benchmarks verified.
                  </span>
                </div>
              </div>
            )}

            {/* Mandatory Evidence & Anti-Hallucination Safe Harbor Banner */}
            <div className="p-3.5 bg-[#001824] border border-blue-500/25 rounded-xl flex items-start gap-3 text-xs text-slate-300">
              <ShieldCheck className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <span className="font-bold text-blue-200">Provenance & Safe Harbor Guarantee:</span>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Public interview reports and employer resources are indicative practice references, not guaranteed predictions of live questions. IntelliHire strictly prohibits presenting AI-generated drills as actual company interview questions or fabricating employer attribution.
                </p>
              </div>
            </div>

            {/* Multi-Dimension Filter Bar */}
            <div className="bg-[#001f2e] border border-[#063750] rounded-2xl p-4 shadow-lg space-y-3">
              {/* Category / Provenance Pills */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 border-b border-[#002a40]">
                {[
                  { id: 'all', label: 'All Benchmarks' },
                  { id: 'public_source', label: 'Public Benchmarks' },
                  { id: 'employer_guidance', label: 'Employer Guidance' },
                  { id: 'llm_practice', label: 'Synthetic Drills' },
                  { id: 'candidate_gap', label: 'Candidate Gaps' }
                ].map(cat => (
                  <button
                    key={cat.id}
                    onClick={() => setIntelCategory(cat.id)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
                      intelCategory === cat.id
                        ? 'bg-[#FF4103] text-white shadow-sm'
                        : 'text-slate-400 hover:text-white bg-[#001824]'
                    }`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>

              {/* Sub-Filters: Domain, Seniority, Track, Search */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2.5 text-xs">
                <div>
                  <label className="block text-slate-400 text-[10px] font-bold uppercase mb-1">Domain</label>
                  <select
                    value={intelDomain}
                    onChange={e => setIntelDomain(e.target.value)}
                    className="w-full bg-[#001824] border border-[#002f47] rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-[#FF4103]"
                  >
                    <option value="all">All Domains</option>
                    <option value="dom_it">Computer & Mathematical (IT)</option>
                    <option value="dom_engineering">Engineering & Architecture</option>
                    <option value="dom_business">Business & Financial</option>
                    <option value="dom_management">Management & Leadership</option>
                    <option value="dom_healthcare">Healthcare Practitioners</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-400 text-[10px] font-bold uppercase mb-1">Seniority Level</label>
                  <select
                    value={intelSeniority}
                    onChange={e => setIntelSeniority(e.target.value)}
                    className="w-full bg-[#001824] border border-[#002f47] rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-[#FF4103]"
                  >
                    <option value="all">All Seniority Levels</option>
                    <option value="entry">Entry-Level</option>
                    <option value="graduate">Graduate / Associate</option>
                    <option value="mid">Mid-Level</option>
                    <option value="senior">Senior</option>
                    <option value="specialist">Specialist / Lead</option>
                    <option value="manager">Manager</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-400 text-[10px] font-bold uppercase mb-1">Interview Track / Round</label>
                  <select
                    value={intelTrack}
                    onChange={e => setIntelTrack(e.target.value)}
                    className="w-full bg-[#001824] border border-[#002f47] rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-[#FF4103]"
                  >
                    <option value="all">All Tracks</option>
                    <option value="technical">Technical Core & Architecture</option>
                    <option value="case_study">Case Study & Problem Solving</option>
                    <option value="system_design">System Design</option>
                    <option value="behavioral_star">Behavioral (STAR)</option>
                    <option value="communication">Communication & Collaboration</option>
                    <option value="situational_judgment">Situational Judgment</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-400 text-[10px] font-bold uppercase mb-1">Keyword Search</label>
                  <div className="relative">
                    <input
                      type="text"
                      value={intelSearch}
                      onChange={e => setIntelSearch(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter') loadIntelligence(); }}
                      placeholder="e.g. SBAR, DCF, GD&T, Caching..."
                      className="w-full bg-[#001824] border border-[#002f47] rounded-xl pl-8 pr-3 py-2 text-slate-200 focus:outline-none focus:border-[#FF4103]"
                    />
                    <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-3" />
                  </div>
                </div>
              </div>
            </div>

            {/* Questions Grid */}
            {intelLoading ? (
              <div className="p-12 text-center text-slate-400 text-xs">
                <RefreshCw className="w-6 h-6 animate-spin mx-auto text-[#FF4103] mb-2" />
                Loading universal market intelligence benchmarks...
              </div>
            ) : intelQuestions.length === 0 ? (
              <div className="p-8 text-center bg-[#001f2e] border border-[#063750] rounded-2xl text-slate-400 text-xs space-y-2">
                <p>No intelligence benchmarks match your filter criteria.</p>
                <button
                  onClick={() => {
                    setIntelCategory('all');
                    setIntelDomain('all');
                    setIntelSeniority('all');
                    setIntelTrack('all');
                    setIntelSearch('');
                  }}
                  className="px-3.5 py-1.5 rounded-xl bg-[#001824] border border-[#063750] text-[#FF4103] text-xs font-semibold hover:bg-[#002538]"
                >
                  Reset All Filters
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {intelQuestions.map((q: any) => {
                  const isEmployer = q.is_employer_guidance || q.provenance_type === 'employer_guidance' || q.provenance_type === 'employer_published_portal';
                  const isLLM = q.category === 'llm_practice' || q.provenance_type === 'ai_synthesized';
                  const isCandidateGap = q.category === 'candidate_gap';

                  return (
                    <div key={q.id} className="bg-[#001f2e] border border-[#063750] rounded-2xl p-6 shadow-lg space-y-4">
                      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 pb-3 border-b border-[#002a40]">
                        <div>
                          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                            {/* Track Badge */}
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-blue-500/15 text-blue-300 border border-blue-500/30">
                              {(q.question_type || q.track || 'technical').replace('_', ' ')}
                            </span>

                            {/* Provenance Badge */}
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                              isEmployer
                                ? 'bg-purple-500/15 text-purple-300 border border-purple-500/30'
                                : isLLM
                                  ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                                  : isCandidateGap
                                    ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                                    : 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/30'
                            }`}>
                              {isEmployer
                                ? 'Employer Published Guidance'
                                : isLLM
                                  ? 'LLM Practice Drill (Generated)'
                                  : isCandidateGap
                                    ? 'Candidate Gap Drill'
                                    : 'Public Benchmark'}
                            </span>

                            {/* Seniority Badge */}
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-slate-700/40 text-slate-300 border border-slate-600/30">
                              {q.seniority_level || 'Mid'}
                            </span>
                          </div>

                          <h3 className="text-base font-bold text-white">{q.title}</h3>
                          <div className="flex items-center gap-2 text-xs text-slate-400 mt-1 flex-wrap">
                            <span>Target Role: <span className="text-slate-200 font-medium">{q.target_role}</span></span>
                            {q.competency_name && (
                              <span>· Competency: <span className="text-[#FF4103] font-medium">{q.competency_name}</span></span>
                            )}
                            {q.company_context && (
                              <span className="text-purple-300 italic">({q.company_context})</span>
                            )}
                          </div>
                        </div>

                        <button
                          onClick={() => startSimulation('targeted')}
                          className="px-3.5 py-2 rounded-xl bg-[#001824] border border-[#FF4103] text-[#FF4103] hover:bg-[#FF4103] hover:text-white text-xs font-bold flex items-center gap-1.5 transition-all shrink-0"
                        >
                          <Play className="w-3.5 h-3.5" />
                          <span>Practice in Simulator</span>
                        </button>
                      </div>

                      <div className="p-3.5 bg-[#001824] rounded-xl border border-[#002f47] text-xs text-slate-200 leading-relaxed font-sans">
                        "{q.prompt}"
                      </div>

                      {/* Rubric Criteria */}
                      {Array.isArray(q.rubric_criteria) && q.rubric_criteria.length > 0 && (
                        <div className="space-y-1.5">
                          <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Evaluation Rubric:</span>
                          <div className="grid sm:grid-cols-3 gap-2 text-[11px]">
                            {q.rubric_criteria.map((r: any, rIdx: number) => (
                              <div key={rIdx} className="p-2.5 bg-[#00121c] rounded-lg border border-[#002233]">
                                <span className="font-bold text-white block mb-0.5">Score {r.score}: {r.criterion}</span>
                                <span className="text-slate-400 leading-snug block">{r.description}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Provenance & Citation Block */}
                      <div className="pt-2 border-t border-[#002a40] flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-400">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-slate-500">Source:</span>
                          <span className="text-slate-300 font-medium">{q.publisher || q.source_publisher || 'Market Benchmark'}</span>
                          {q.retrieval_date && (
                            <span className="text-slate-500 font-mono">· Retrieved {String(q.retrieval_date).split(' ')[0]}</span>
                          )}
                          {q.provenance_label && (
                            <span className="text-slate-500 italic">[{q.provenance_label}]</span>
                          )}
                        </div>
                        {q.source_url && (
                          <a
                            href={q.source_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[#FF4103] hover:underline flex items-center gap-1 font-semibold"
                          >
                            <span>Verified Citation</span>
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ================= TAB 3: EVIDENCE-BASED PLAN ================= */}
        {tab === 'plan' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between pb-2">
              <div>
                <h2 className="text-lg font-bold text-white">Prioritized Capability Preparation Plan</h2>
                <p className="text-xs text-slate-400">Targeted preparation actions ordered by diagnosed uncertainty and gap severity.</p>
              </div>
              <button
                onClick={() => startSimulation('targeted')}
                className="px-3.5 py-2 rounded-xl bg-[#001824] border border-[#063750] text-[#FF4103] hover:bg-[#002538] text-xs font-bold flex items-center gap-2"
              >
                <Play className="w-3.5 h-3.5" /> Practice Top Gap
              </button>
            </div>

            <div className="space-y-4">
              {plan?.plan_items?.map((item: any) => (
                <div key={item.id} className="bg-[#001f2e] border border-[#063750] rounded-2xl p-6 shadow-lg space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-[#002a40]">
                    <div>
                      <span className="text-xs font-bold text-[#FF4103] uppercase tracking-wider">{item.competency}</span>
                      <h3 className="text-base font-bold text-white mt-0.5">{item.skill}</h3>
                    </div>
                    <span className={`px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider self-start sm:self-auto ${
                      item.priority === 'high' ? 'bg-red-500/15 text-red-400 border border-red-500/30' : 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                    }`}>
                      {item.priority} Priority
                    </span>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4 text-xs">
                    <div className="p-3 bg-[#001824] rounded-xl border border-[#002f47]">
                      <span className="text-slate-500 uppercase font-semibold">Evidence Diagnosis</span>
                      <div className="text-slate-300 mt-1">{item.reason}</div>
                    </div>
                    <div className="p-3 bg-[#001824] rounded-xl border border-[#002f47]">
                      <span className="text-slate-500 uppercase font-semibold">Target Capability</span>
                      <div className="text-white font-medium mt-1">{item.target_capability}</div>
                    </div>
                  </div>

                  <div className="grid md:grid-cols-3 gap-3 text-xs pt-1">
                    <div className="p-3 bg-[#001824]/60 rounded-xl border border-[#002b40]">
                      <span className="text-blue-400 font-semibold flex items-center gap-1.5 mb-1">
                        <BookOpen className="w-3.5 h-3.5" /> Recommended Learning
                      </span>
                      <p className="text-slate-400 leading-relaxed">{item.recommended_learning}</p>
                    </div>
                    <div className="p-3 bg-[#001824]/60 rounded-xl border border-[#002b40]">
                      <span className="text-emerald-400 font-semibold flex items-center gap-1.5 mb-1">
                        <Target className="w-3.5 h-3.5" /> Practice Drill
                      </span>
                      <p className="text-slate-400 leading-relaxed">{item.recommended_practice}</p>
                    </div>
                    <div className="p-3 bg-[#001824]/60 rounded-xl border border-[#002b40]">
                      <span className="text-purple-400 font-semibold flex items-center gap-1.5 mb-1">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Reassessment Criteria
                      </span>
                      <p className="text-slate-400 leading-relaxed">{item.reassessment_criteria}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ================= TAB 4: INTERACTIVE SIMULATOR ================= */}
        {tab === 'simulation' && (
          <div className="space-y-6">
            {/* Simulation Header Ribbon */}
            <div className="bg-[#001f2e] border border-[#063750] rounded-2xl p-4 flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <span className="text-xs uppercase font-bold text-slate-400">Simulation Mode:</span>
                <div className="flex gap-1.5">
                  {(['practice', 'learning', 'mock', 'assessment', 'targeted'] as SimMode[]).map(m => (
                    <button
                      key={m}
                      onClick={() => startSimulation(m)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold uppercase transition-all ${
                        mode === m ? 'bg-[#FF4103] text-white' : 'bg-[#001824] text-slate-400 hover:text-white'
                      }`}
                    >
                      {m}
                    </button>
                  ))}
                </div>
              </div>

              {sessionId && (
                <div className="flex items-center gap-3 text-xs">
                  <span className="text-slate-400 font-mono">Session: {sessionId.slice(0, 8)}</span>
                  <button
                    onClick={() => startSimulation(mode)}
                    className="p-1.5 rounded-lg bg-[#001824] text-slate-300 hover:text-white"
                    title="Restart Simulation"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>

            {/* If no session started */}
            {!sessionId && !loading && (
              <div className="p-12 text-center bg-[#001f2e] border border-[#063750] rounded-2xl space-y-4">
                <Brain className="w-12 h-12 text-[#FF4103] mx-auto opacity-75" />
                <h3 className="text-xl font-bold text-white">Ready for Real-Time Role Interview Simulation?</h3>
                <p className="text-sm text-slate-300 max-w-xl mx-auto">
                  The engine asks targeted, scenario-based interview questions addressing your specific gaps and deep dives into your actual demonstrated projects.
                </p>
                <button
                  onClick={() => startSimulation('mock')}
                  className="px-6 py-3 rounded-xl bg-[#FF4103] hover:bg-[#e03200] text-white text-xs font-bold inline-flex items-center gap-2 shadow-lg shadow-[#FF4103]/20"
                >
                  <Play className="w-4 h-4" /> Start Mock Interview
                </button>
              </div>
            )}

            {/* Active Question Screen */}
            {currentQuestion && !sessionCompleted && (
              <div className="bg-[#001f2e] border border-[#063750] rounded-2xl p-6 sm:p-7 shadow-lg space-y-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-[#002a40]">
                  <div className="flex items-center gap-2 text-xs flex-wrap">
                    <span className="px-2 py-0.5 rounded bg-[#FF4103]/15 text-[#FF4103] font-bold uppercase tracking-wider">
                      Question {currentQuestion.question_number} of {currentQuestion.total_questions}
                    </span>
                    <span className="text-slate-400">·</span>
                    <span className="text-slate-300 font-semibold">{currentQuestion.competency}</span>
                    <span className="text-slate-500">({currentQuestion.skill})</span>
                  </div>

                  <div className="flex items-center gap-2">
                    {currentQuestion.track === 'project_deep_dive' ? (
                      <span className="text-xs px-2.5 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30 font-bold">
                        Candidate Project Deep Dive
                      </span>
                    ) : (
                      <span className="text-xs px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 font-mono">
                        Track: {currentQuestion.track?.replace('_', ' ')}
                      </span>
                    )}

                    {currentQuestion.technique && (
                      <span className="text-xs px-2 py-0.5 rounded bg-indigo-500/15 text-indigo-300 border border-indigo-500/30 font-mono">
                        Technique: {currentQuestion.technique}
                      </span>
                    )}

                    {currentQuestion.category === 'public_source' && (
                      <span className="text-xs px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 font-mono">
                        Public Benchmark
                      </span>
                    )}
                  </div>
                </div>

                {/* Grounding Attribution Banner */}
                {currentQuestion.provenance?.candidate_project && (
                  <div className="p-3 bg-purple-950/20 border border-purple-500/30 rounded-xl text-xs text-purple-200 flex items-center gap-2">
                    <FolderGit2 className="w-4 h-4 text-purple-400 shrink-0" />
                    <span>
                      Grounded in your verified candidate project: <strong className="text-white">{currentQuestion.provenance.candidate_project}</strong>
                    </span>
                  </div>
                )}

                {currentQuestion.provenance?.source_url && (
                  <div className="p-3 bg-emerald-950/20 border border-emerald-500/30 rounded-xl text-xs text-emerald-200 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <Globe className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span>
                        Market Benchmark Citation: <strong className="text-white">{currentQuestion.provenance.publisher || 'Public Source'}</strong>
                      </span>
                    </div>
                    <a
                      href={currentQuestion.provenance.source_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[#FF4103] hover:underline flex items-center gap-1 font-bold shrink-0"
                    >
                      <span>View Source</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                )}

                <div className="space-y-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Interviewer Scenario</span>
                  <h3 className="text-lg font-bold text-white leading-relaxed">
                    "{currentQuestion.question}"
                  </h3>
                  <p className="text-xs text-slate-400 italic">
                    Evaluation focus: {currentQuestion.evaluation_criteria}
                  </p>
                </div>

                {/* Progressive Hint Drawer */}
                <div className="flex items-center justify-between pt-1">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    Your Stated Response
                  </span>
                  <button
                    onClick={requestProgressiveHint}
                    disabled={hintLoading || hintMaxReached}
                    className="px-3 py-1.5 rounded-lg bg-[#001824] border border-[#063750] hover:border-[#FF4103] text-slate-300 hover:text-white text-xs font-semibold flex items-center gap-1.5 transition-all disabled:opacity-40"
                  >
                    <Lightbulb className="w-3.5 h-3.5 text-amber-400" />
                    <span>
                      {hintLoading ? 'Loading Hint...' : hintMaxReached ? 'Max Hints Used' : `Request Progressive Hint (${activeHints.length + 1}/2)`}
                    </span>
                  </button>
                </div>

                {/* Display Active Progressive Hints */}
                {activeHints.length > 0 && (
                  <div className="p-3.5 bg-amber-950/20 border border-amber-500/30 rounded-xl text-xs space-y-2">
                    <div className="flex items-center gap-2 font-bold text-amber-300">
                      <Lightbulb className="w-3.5 h-3.5 text-amber-400" />
                      <span>Progressive Scaffolding Hints (No Answer Leakage)</span>
                    </div>
                    {activeHints.map((hintText, hIdx) => (
                      <div key={hIdx} className="text-slate-300 pl-4 border-l-2 border-amber-500/50">
                        <strong className="text-amber-200">Hint {hIdx + 1}: </strong>
                        {hintText}
                      </div>
                    ))}
                  </div>
                )}

                <div className="space-y-3">
                  <textarea
                    rows={5}
                    value={answerText}
                    onChange={e => setAnswerText(e.target.value)}
                    placeholder="Provide a comprehensive response detailing your methodology, trade-offs, and decision criteria..."
                    className="w-full bg-[#001824] border border-[#002f47] rounded-xl p-4 text-white text-sm focus:outline-none focus:border-[#FF4103] transition-colors leading-relaxed"
                  />
                  <div className="flex justify-end">
                    <button
                      disabled={submitting || !answerText.trim()}
                      onClick={submitAnswer}
                      className="px-5 py-2.5 rounded-xl bg-[#FF4103] hover:bg-[#e03200] disabled:opacity-50 text-white text-xs font-bold flex items-center gap-2 shadow-md shadow-[#FF4103]/20 transition-all"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>{submitting ? 'Evaluating Response…' : 'Submit Response'}</span>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Previous Responses in Session (Conversation Stream) */}
            {history.length > 0 && (
              <div className="space-y-4">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Session Transcript & Feedback Stream</h4>
                {history.map((h, idx) => (
                  <div key={idx} className="bg-[#001f2e] border border-[#063750] rounded-2xl p-5 space-y-3">
                    <div className="flex items-center justify-between text-xs text-slate-400">
                      <span className="font-bold text-[#FF4103]">Question #{idx + 1} ({h.question.competency})</span>
                      <span className="font-mono">Evaluated</span>
                    </div>
                    <div className="text-sm font-semibold text-white">"{h.question.question}"</div>
                    <div className="p-3 bg-[#001824] rounded-xl text-xs text-slate-300 border border-[#002f47]">
                      <span className="text-slate-500 font-bold block mb-1">Your Answer:</span>
                      {h.answer}
                    </div>

                    {/* Evaluator Assessment */}
                    {h.evaluation && (
                      <div className="p-3.5 bg-blue-950/20 border border-blue-500/20 rounded-xl text-xs space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-blue-400 uppercase tracking-wider text-[10px]">Interviewer Assessment</span>
                          {h.evaluation.score_raw !== undefined && (
                            <span className="font-bold text-white">Score: {Math.round(h.evaluation.score_raw * 100)}%</span>
                          )}
                        </div>
                        {h.evaluation.analysis && (
                          <p className="text-slate-300">{h.evaluation.analysis}</p>
                        )}
                        {h.follow_up && (
                          <div className="pt-2 border-t border-blue-500/20 text-indigo-300">
                            <span className="font-bold text-[10px] uppercase block mb-0.5">Interviewer Counter-Challenge / Probe:</span>
                            "{h.follow_up}"
                          </div>
                        )}
                      </div>
                    )}

                    {/* Explicitly Labeled Reference Model Answer */}
                    {(h.model_answer || h.evaluation?.model_answer || h.teaching_payload?.explanation_how) && (
                      <div className="p-4 bg-[#00121c] border border-[#063750] rounded-xl text-xs space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-slate-300 uppercase tracking-wider text-[10px] flex items-center gap-1.5">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                            <span>Reference Model Answer (Example for comparison, not candidate claims)</span>
                          </span>
                          <span className="text-[10px] font-mono text-slate-500">Instructional Standard</span>
                        </div>
                        <p className="text-slate-300 leading-relaxed italic bg-[#001824] p-3 rounded-lg border border-[#002a40]">
                          {h.model_answer || h.evaluation?.model_answer || h.teaching_payload?.explanation_how}
                        </p>
                        <div className="text-[10px] text-slate-500">
                          Notice: Provided as an instructional comparison model for candidate self-reflection; not attributed to candidate claims.
                        </div>
                      </div>
                    )}

                    {/* Teaching Engine Payload */}
                    {h.teaching_payload && mode !== 'mock' && (
                      <div className="p-4 bg-[#001824] border border-emerald-500/30 rounded-xl text-xs space-y-2.5">
                        <div className="flex items-center gap-2 font-bold text-emerald-400 uppercase tracking-wider text-[10px]">
                          <Sparkles className="w-3.5 h-3.5 text-[#FF4103]" />
                          <span>M2 Teaching Engine — Deep Pedagogical Breakdown</span>
                        </div>
                        {h.teaching_payload.explanation_why && (
                          <div>
                            <span className="font-semibold text-white">Why (Core Principle): </span>
                            <span className="text-slate-300">{h.teaching_payload.explanation_why}</span>
                          </div>
                        )}
                        {h.teaching_payload.explanation_how && (
                          <div>
                            <span className="font-semibold text-white">How (Step-by-Step Methodology): </span>
                            <span className="text-slate-300">{h.teaching_payload.explanation_how}</span>
                          </div>
                        )}
                        {h.teaching_payload.misconception_diagnosis && (
                          <div className="p-2.5 bg-amber-500/10 border border-amber-500/20 rounded-lg text-amber-200">
                            <span className="font-semibold">Misconception Remediation: </span>
                            <span>{h.teaching_payload.misconception_diagnosis}</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Session Completed Debrief */}
            {sessionCompleted && debrief && (
              <div className="bg-[#001f2e] border border-[#FF4103]/40 rounded-2xl p-6 sm:p-7 shadow-lg space-y-6">
                <div className="flex items-center justify-between pb-4 border-b border-[#002a40]">
                  <div>
                    <span className="text-xs font-bold text-[#FF4103] uppercase tracking-wider">Simulation Concluded</span>
                    <h3 className="text-2xl font-black text-white mt-1">Comprehensive Interview Debrief</h3>
                  </div>
                  <div className="text-right">
                    <span className="text-3xl font-black text-white">{debrief.overall_readiness_score}%</span>
                    <div className="text-[10px] text-slate-400 uppercase font-semibold">Session Performance</div>
                  </div>
                </div>

                <div className="space-y-4">
                  {debrief.debrief?.map((d: any, i: number) => (
                    <div key={i} className="p-4 bg-[#001824] border border-[#002f47] rounded-xl space-y-2 text-xs">
                      <div className="flex items-center justify-between font-bold text-white">
                        <span>Probe #{i + 1}: {d.competency}</span>
                        <span className={d.score_percentage >= 70 ? 'text-emerald-400' : 'text-amber-400'}>
                          {d.score_percentage}% Score
                        </span>
                      </div>
                      <div className="text-slate-400 italic">"{d.question}"</div>
                      <div className="grid md:grid-cols-2 gap-3 pt-2">
                        <div>
                          <span className="text-emerald-400 font-semibold block mb-0.5">Strengths Observed:</span>
                          <p className="text-slate-300">{d.strengths}</p>
                        </div>
                        <div>
                          <span className="text-amber-400 font-semibold block mb-0.5">Recommended Refinement:</span>
                          <p className="text-slate-300">{d.areas_to_improve}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-[#002a40]">
                  <button
                    onClick={exportGuide}
                    disabled={exporting}
                    className="px-4 py-2.5 rounded-xl bg-[#001824] border border-[#063750] text-slate-200 hover:text-white text-xs font-bold flex items-center gap-2"
                  >
                    <Download className="w-3.5 h-3.5 text-[#FF4103]" />
                    <span>{exporting ? 'Generating…' : 'Export Full Guide (.docx)'}</span>
                  </button>
                  <button
                    onClick={() => startSimulation(mode)}
                    className="px-5 py-2.5 rounded-xl bg-[#FF4103] hover:bg-[#e03200] text-white text-xs font-bold flex items-center gap-2"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Run Another Simulation</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ================= TAB 5: READINESS SYNTHESIS ================= */}
        {tab === 'readiness' && (
          <div className="space-y-6">
            <div className="grid lg:grid-cols-3 gap-6">
              <div className="bg-[#001f2e] border border-[#063750] rounded-2xl p-6 shadow-lg space-y-4">
                <span className="text-xs text-slate-400 uppercase font-semibold">Synthesized Readiness</span>
                <div className="text-5xl font-black text-white tracking-tight">
                  {readiness?.overall_readiness_score || 0}%
                </div>
                <div className="space-y-2 text-xs text-slate-300 pt-2 border-t border-[#002a40]">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Evidence Confidence:</span>
                    <span className="font-bold text-white">{readiness?.evidence_confidence_score || 0}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Competency Coverage:</span>
                    <span className="font-bold text-white">
                      {readiness?.competency_coverage?.coverage_percentage || 0}% ({readiness?.competency_coverage?.verified || 0}/{readiness?.competency_coverage?.total_competencies || 0})
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Completed Simulations:</span>
                    <span className="font-bold text-white">{readiness?.mock_interviews_completed || 0}</span>
                  </div>
                </div>
              </div>

              <div className="bg-[#001f2e] border border-[#063750] rounded-2xl p-6 shadow-lg lg:col-span-2 space-y-4">
                <h3 className="text-base font-bold text-white">Remaining Preparation Priorities</h3>
                <p className="text-xs text-slate-400">
                  Target competencies that require additional practice or uncertainty reduction before live stakeholder interviews.
                </p>

                <div className="space-y-2.5">
                  {readiness?.remaining_preparation_priorities?.length === 0 ? (
                    <div className="text-xs text-slate-400 p-4 bg-[#001824] rounded-xl border border-[#002f47]">
                      All assessed competencies are above the 75% target threshold!
                    </div>
                  ) : (
                    readiness?.remaining_preparation_priorities?.map((p: any, i: number) => (
                      <div key={i} className="p-3 bg-[#001824] border border-[#002f47] rounded-xl flex items-center justify-between text-xs">
                        <div>
                          <div className="font-bold text-white">{p.skill}</div>
                          <div className="text-[11px] text-slate-400">{p.competency}</div>
                        </div>
                        <div className="text-right">
                          <span className="text-amber-400 font-bold">{p.current_level}</span>
                          <span className="text-slate-500 text-[10px] block">Target: {p.target_level}</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            {/* Decision Support Disclaimer */}
            <div className="p-4 rounded-xl bg-[#001824] border border-[#002f47] text-xs text-slate-400 flex items-start gap-3">
              <ShieldCheck className="w-5 h-5 text-[#FF4103] shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-white block mb-0.5">Ethical Decision Support & Safety Notice</span>
                {readiness?.disclaimer || 'This synthesis provides candidate preparation analytics and human decision support. It does NOT constitute an automated hiring decision.'}
              </div>
            </div>
          </div>
        )}

        {/* ================= CLARIFICATION MODAL ================= */}
        {clarifyModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in">
            <div className="bg-[#001f2e] border border-[#063750] rounded-2xl p-6 sm:p-7 max-w-lg w-full shadow-2xl space-y-5">
              <div className="flex items-center justify-between pb-3 border-b border-[#002a40]">
                <div className="flex items-center gap-2">
                  <Sliders className="w-5 h-5 text-[#FF4103]" />
                  <h3 className="text-lg font-bold text-white">Clarify Profile Assumptions</h3>
                </div>
                <button
                  onClick={() => setClarifyModalOpen(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-[#002538]"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <p className="text-xs text-slate-300 leading-relaxed">
                Confirm or update inferred role settings to recalibrate the transparent gap matrix and customize your interview simulator experience.
              </p>

              {clarifySuccess && (
                <div className="p-3 bg-emerald-500/15 border border-emerald-500/30 rounded-xl text-xs text-emerald-300 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>{clarifySuccess}</span>
                </div>
              )}

              <div className="space-y-4 text-xs">
                <div>
                  <label className="block text-slate-400 font-bold uppercase tracking-wider text-[10px] mb-1">
                    Target Role
                  </label>
                  <input
                    type="text"
                    value={clarifyRole}
                    onChange={e => setClarifyRole(e.target.value)}
                    placeholder="e.g. AI & Machine Learning Engineer"
                    className="w-full bg-[#001824] border border-[#002f47] rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-[#FF4103]"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 font-bold uppercase tracking-wider text-[10px] mb-1">
                    Primary Domain
                  </label>
                  <select
                    value={clarifyDomain}
                    onChange={e => setClarifyDomain(e.target.value)}
                    className="w-full bg-[#001824] border border-[#002f47] rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-[#FF4103]"
                  >
                    <option value="data">Data / AI / Machine Learning</option>
                    <option value="software">Software Engineering / Distributed Systems</option>
                    <option value="finance">Finance / FP&A</option>
                    <option value="operations">Operations / Supply Chain</option>
                    <option value="general">General Professional</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-400 font-bold uppercase tracking-wider text-[10px] mb-1">
                    Seniority Level
                  </label>
                  <select
                    value={clarifyExperience}
                    onChange={e => setClarifyExperience(e.target.value)}
                    className="w-full bg-[#001824] border border-[#002f47] rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-[#FF4103]"
                  >
                    <option value="entry">Entry-Level / Early Career</option>
                    <option value="mid">Mid-Level Engineer / Specialist</option>
                    <option value="senior">Senior / Lead Architect</option>
                    <option value="director">Director / Executive</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-[#002a40]">
                <button
                  type="button"
                  onClick={() => setClarifyModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-[#001824] text-slate-300 hover:text-white text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={submitClarifications}
                  disabled={clarifySubmitting}
                  className="px-5 py-2 rounded-xl bg-[#FF4103] hover:bg-[#e03200] disabled:opacity-50 text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-[#FF4103]/20"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>{clarifySubmitting ? 'Confirming...' : 'Save & Confirm Assumptions'}</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Practice Drill Generator Modal */}
        {generateModalOpen && (
          <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-[#001f2e] border border-[#063750] rounded-2xl max-w-lg w-full p-6 space-y-5 shadow-2xl">
              <div className="flex items-center justify-between pb-3 border-b border-[#002a40]">
                <div className="flex items-center gap-2">
                  <PlusCircle className="w-5 h-5 text-[#FF4103]" />
                  <h3 className="text-base font-bold text-white">Generate Role-Specific Practice Drill</h3>
                </div>
                <button
                  onClick={() => setGenerateModalOpen(false)}
                  className="text-slate-400 hover:text-white p-1 rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {genSuccess ? (
                <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-center text-xs text-emerald-300 font-bold">
                  {genSuccess}
                </div>
              ) : (
                <div className="space-y-3.5 text-xs">
                  <div>
                    <label className="block text-slate-400 font-bold uppercase tracking-wider text-[10px] mb-1">
                      Target Occupation / Role
                    </label>
                    <input
                      type="text"
                      value={genRole}
                      onChange={e => setGenRole(e.target.value)}
                      placeholder="e.g. Registered Nurse, Financial Analyst, Mechanical Engineer"
                      className="w-full bg-[#001824] border border-[#002f47] rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-[#FF4103]"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-slate-400 font-bold uppercase tracking-wider text-[10px] mb-1">
                        Domain
                      </label>
                      <select
                        value={genDomain}
                        onChange={e => setGenDomain(e.target.value)}
                        className="w-full bg-[#001824] border border-[#002f47] rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-[#FF4103]"
                      >
                        <option value="dom_it">Computer & IT</option>
                        <option value="dom_engineering">Engineering & Arch</option>
                        <option value="dom_business">Business & Finance</option>
                        <option value="dom_management">Management</option>
                        <option value="dom_healthcare">Healthcare</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-slate-400 font-bold uppercase tracking-wider text-[10px] mb-1">
                        Seniority Level
                      </label>
                      <select
                        value={genSeniority}
                        onChange={e => setGenSeniority(e.target.value)}
                        className="w-full bg-[#001824] border border-[#002f47] rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-[#FF4103]"
                      >
                        <option value="entry">Entry-Level</option>
                        <option value="graduate">Graduate / Associate</option>
                        <option value="mid">Mid-Level</option>
                        <option value="senior">Senior</option>
                        <option value="specialist">Specialist / Lead</option>
                        <option value="manager">Manager</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-slate-400 font-bold uppercase tracking-wider text-[10px] mb-1">
                      Question Track / Format
                    </label>
                    <select
                      value={genTrack}
                      onChange={e => setGenTrack(e.target.value)}
                      className="w-full bg-[#001824] border border-[#002f47] rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-[#FF4103]"
                    >
                      <option value="technical">Technical Core & Practical Execution</option>
                      <option value="case_study">Case Study & Diagnostic Problem Solving</option>
                      <option value="system_design">System Design & Architecture</option>
                      <option value="behavioral_star">Behavioral (STAR Method)</option>
                      <option value="communication">Communication & Conflict Resolution</option>
                      <option value="situational_judgment">Situational Judgment & Ethics</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-400 font-bold uppercase tracking-wider text-[10px] mb-1">
                      Target Competency
                    </label>
                    <input
                      type="text"
                      value={genCompetency}
                      onChange={e => setGenCompetency(e.target.value)}
                      placeholder="e.g. Clinical Triage SBAR, GD&T Tolerance Stacks, DCF Sensitivity"
                      className="w-full bg-[#001824] border border-[#002f47] rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-[#FF4103]"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-400 font-bold uppercase tracking-wider text-[10px] mb-1">
                      Learning Objective (Optional)
                    </label>
                    <input
                      type="text"
                      value={genObjective}
                      onChange={e => setGenObjective(e.target.value)}
                      placeholder="e.g. Master rapid hemodynamic stabilization and SBAR escalation"
                      className="w-full bg-[#001824] border border-[#002f47] rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-[#FF4103]"
                    />
                  </div>

                  <div className="p-3 bg-[#001824] border border-amber-500/20 rounded-xl text-[11px] text-amber-200/90 leading-snug">
                    <span className="font-bold block text-amber-300 mb-0.5">Anti-Hallucination Safe Harbor:</span>
                    The generated drill will be strictly labeled as synthetic practice. It will include a 3-tier scoring rubric and 2 progressive hints with zero answer leakage.
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-3 pt-3 border-t border-[#002a40]">
                <button
                  type="button"
                  onClick={() => setGenerateModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-[#001824] text-slate-300 hover:text-white text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={submitGenerateDrill}
                  disabled={genLoading || !genRole.trim() || !genCompetency.trim()}
                  className="px-5 py-2 rounded-xl bg-[#FF4103] hover:bg-[#e03200] disabled:opacity-50 text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-[#FF4103]/20"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>{genLoading ? 'Generating Drill...' : 'Generate Practice Drill'}</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
