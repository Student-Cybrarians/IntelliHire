import { useState, useEffect } from 'react';
import { 
  BookOpen, Sparkles, CheckCircle2, Lock, ArrowRight, RefreshCw, 
  Layers, ShieldCheck, Flame, Users, AlertTriangle, HelpCircle, 
  CheckCircle, ChevronRight, Laptop, Brain, Award, Play, BarChart3,
  Clock, Calendar, Check, X, AlertCircle, History, Info
} from 'lucide-react';
import DashboardLayout from './dashboard/DashboardLayout';

interface LearningUnit {
  id: string;
  unit_order: number;
  unit_type: string;
  title: string;
  content_markdown: string;
  interactive_exercise: {
    question: string;
    options: string[];
    correct_index?: number;
    explanation_why?: string;
    explanation_how?: string;
    misconception_warning?: string;
  } | null;
  provenance: {
    author?: string;
    authoritative?: boolean;
  };
  completion_status: string;
  demonstrated_score: number | null;
  completed_at: string | null;
}

interface CurriculumModule {
  id: string;
  sequence_order: number;
  competency_name: string;
  skill_name: string;
  title: string;
  description: string;
  target_capability: string;
  current_capability: string;
  evidence_gap_summary: string;
  prerequisites: string[];
  status: 'locked' | 'available' | 'in_progress' | 'completed' | 'mastered';
  mastery_status: 'unassessed' | 'needs_practice' | 'proficient' | 'mastered';
  revision_due_at?: string | null;
  units: LearningUnit[];
}

interface LearningPathway {
  id: string;
  learner_id: string;
  learner_name: string;
  title: string;
  target_role: string;
  domain: string;
  occupation_code: string;
  pathway_type: string;
  status: string;
  overall_progress: number;
  mastery_score: number;
  evidence_sources: string[];
  modules: CurriculumModule[];
}

interface ReassessmentPromptData {
  module_id: string;
  module_title: string;
  competency_name: string;
  skill_name: string;
  target_role: string;
  variation_index: number;
  attempt_number: number;
  challenge_scenario: string;
  specific_prompt: string;
  passing_threshold_pct: number;
  criteria_dimensions: Array<{
    dimension: string;
    weight: number;
    description: string;
  }>;
  instructions: string;
}

const PRESET_ROLES = [
  { role: 'Registered Nurse & Clinical Specialist', domain: 'healthcare_admin', category: 'Healthcare' },
  { role: 'Mechanical & Manufacturing Engineer', domain: 'operations', category: 'Engineering' },
  { role: 'Financial Analyst & Auditor', domain: 'finance', category: 'Finance' },
  { role: 'Information Security Analyst', domain: 'software', category: 'Cybersecurity' },
  { role: 'AI & Machine Learning Engineer', domain: 'data', category: 'AI/ML' },
  { role: 'Senior Distributed Architect', domain: 'software', category: 'Systems' },
  { role: 'Full-Stack Software Engineer', domain: 'software', category: 'Software' }
];

export default function TrainingCurriculum() {
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [pathways, setPathways] = useState<any[]>([]);
  const [activePathway, setActivePathway] = useState<LearningPathway | null>(null);
  const [activeModuleIndex, setActiveModuleIndex] = useState(0);
  const [activeUnitIndex, setActiveUnitIndex] = useState(0);
  
  // Navigation Tabs: Learner Cockpit, Spaced Revision, Cohort Analytics
  const [activeTab, setActiveTab] = useState<'learner' | 'revision' | 'cohort'>('learner');
  const [cohortMetrics, setCohortMetrics] = useState<any>(null);
  const [generatingPathway, setGeneratingPathway] = useState(false);

  // Pathway Generation Modal State
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [selectedPresetIndex, setSelectedPresetIndex] = useState<number | null>(null);
  const [customRoleInput, setCustomRoleInput] = useState('');
  const [customDomainInput, setCustomDomainInput] = useState('auto');

  // Exercise State
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [exerciseResult, setExerciseResult] = useState<any>(null);
  const [submittingExercise, setSubmittingExercise] = useState(false);
  const [hintLoading, setHintLoading] = useState(false);
  const [activeHint, setActiveHint] = useState<string | null>(null);

  // Reassessment Gate State
  const [reassessmentPrompt, setReassessmentPrompt] = useState<ReassessmentPromptData | null>(null);
  const [reassessmentPromptLoading, setReassessmentPromptLoading] = useState(false);
  const [reassessmentSolution, setReassessmentSolution] = useState('');
  const [reassessmentRationale, setReassessmentRationale] = useState('');
  const [reassessing, setReassessing] = useState(false);
  const [reassessmentResult, setReassessmentResult] = useState<any>(null);
  const [reassessmentHistory, setReassessmentHistory] = useState<any[]>([]);
  const [showHistoryAccordion, setShowHistoryAccordion] = useState(false);

  // Spaced Revision State
  const [spacedRevisionData, setSpacedRevisionData] = useState<any>(null);
  const [spacedRevisionLoading, setSpacedRevisionLoading] = useState(false);
  const [completingRevisionId, setCompletingRevisionId] = useState<string | null>(null);
  const [revisionSuccessMsg, setRevisionSuccessMsg] = useState<string | null>(null);

  // Initialize data
  useEffect(() => {
    async function init() {
      try {
        const userRes = await fetch('/api/auth/me');
        if (userRes.ok) {
          const u = await userRes.json() as any;
          setCurrentUser(u.user || u);
        }

        const pathRes = await fetch('/api/training/pathways');
        if (pathRes.ok) {
          const data = await pathRes.json() as any;
          setPathways(data.pathways || []);
          if (data.pathways && data.pathways.length > 0) {
            loadPathwayDetails(data.pathways[0].id, true);
          }
        }

        const cohortRes = await fetch('/api/training/cohort/analytics');
        if (cohortRes.ok) {
          const cData = await cohortRes.json() as any;
          setCohortMetrics(cData.cohort_metrics);
        }

        // Preload spaced revision count
        loadSpacedRevision();
      } catch (err) {
        console.error('Init training failed:', err);
      } finally {
        setLoading(false);
      }
    }
    init();
  }, []);

  const loadPathwayDetails = async (pathwayId: string, resetSelection = false) => {
    try {
      const res = await fetch(`/api/training/pathway/${pathwayId}`);
      if (res.ok) {
        const data = await res.json() as any;
        setActivePathway(data.pathway);
        if (resetSelection) {
          setActiveModuleIndex(0);
          setActiveUnitIndex(0);
          setSelectedOption(null);
          setExerciseResult(null);
          setReassessmentResult(null);
          setActiveHint(null);
        }
      }
    } catch (err) {
      console.error('Failed to load pathway:', err);
    }
  };

  const handleOpenGenerateModal = () => {
    setSelectedPresetIndex(null);
    setCustomRoleInput('');
    setCustomDomainInput('auto');
    setShowGenerateModal(true);
  };

  const handleGeneratePathway = async () => {
    setGeneratingPathway(true);
    setShowGenerateModal(false);
    try {
      let rolePayload: string | undefined = undefined;
      let domainPayload: string | undefined = undefined;

      if (selectedPresetIndex !== null && PRESET_ROLES[selectedPresetIndex]) {
        rolePayload = PRESET_ROLES[selectedPresetIndex].role;
        domainPayload = PRESET_ROLES[selectedPresetIndex].domain;
      } else if (customRoleInput.trim()) {
        rolePayload = customRoleInput.trim();
        if (customDomainInput !== 'auto') {
          domainPayload = customDomainInput;
        }
      }

      const res = await fetch('/api/training/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          target_role: rolePayload,
          domain: domainPayload
        })
      });
      if (res.ok) {
        const data = await res.json() as any;
        await loadPathwayDetails(data.pathway_id, true);
        const pathRes = await fetch('/api/training/pathways');
        if (pathRes.ok) {
          const pData = await pathRes.json() as any;
          setPathways(pData.pathways || []);
        }
        await loadSpacedRevision();
      }
    } catch (err) {
      console.error('Pathway generation failed:', err);
    } finally {
      setGeneratingPathway(false);
    }
  };

  const currentModule = activePathway?.modules?.[activeModuleIndex];
  const currentUnit = currentModule?.units?.[activeUnitIndex];

  // Reassessment prompt & history loader
  useEffect(() => {
    if (currentUnit?.unit_type === 'reassessment_gate' && currentModule) {
      loadReassessmentPrompt(currentModule.id);
      loadReassessmentHistory(currentModule.id);
    } else {
      setReassessmentPrompt(null);
      setReassessmentResult(null);
    }
    setActiveHint(null);
    setSelectedOption(null);
    setExerciseResult(null);
  }, [currentUnit?.id, currentModule?.id]);

  const loadReassessmentPrompt = async (moduleId: string) => {
    setReassessmentPromptLoading(true);
    try {
      const res = await fetch(`/api/training/module/${moduleId}/reassessment-prompt`);
      if (res.ok) {
        const data = await res.json() as any;
        setReassessmentPrompt(data);
      }
    } catch (err) {
      console.error('Failed to load reassessment prompt:', err);
    } finally {
      setReassessmentPromptLoading(false);
    }
  };

  const loadReassessmentHistory = async (moduleId: string) => {
    try {
      const res = await fetch(`/api/training/module/${moduleId}/reassessment-history`);
      if (res.ok) {
        const data = await res.json() as any;
        setReassessmentHistory(data.attempts || []);
      }
    } catch (err) {
      console.error('Failed to load reassessment history:', err);
    }
  };

  // Submit Interactive Exercise
  const handleSubmitExercise = async () => {
    if (selectedOption === null || !currentUnit) return;
    setSubmittingExercise(true);
    try {
      const res = await fetch(`/api/training/unit/${currentUnit.id}/submit-exercise`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ selected_index: selectedOption })
      });
      if (res.ok) {
        const data = await res.json() as any;
        setExerciseResult(data);
        if (activePathway) {
          await loadPathwayDetails(activePathway.id);
        }
      }
    } catch (err) {
      console.error('Submit exercise error:', err);
    } finally {
      setSubmittingExercise(false);
    }
  };

  // Request Progressive Hint
  const handleRequestHint = async () => {
    if (!currentUnit) return;
    setHintLoading(true);
    try {
      const res = await fetch(`/api/training/unit/${currentUnit.id}/submit-exercise`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ request_hint: true })
      });
      if (res.ok) {
        const data = await res.json() as any;
        setActiveHint(data.hint || data.progressive_hint);
      }
    } catch (err) {
      console.error('Hint request error:', err);
    } finally {
      setHintLoading(false);
    }
  };

  // Submit Unit Progress (Reading)
  const handleMarkUnitComplete = async () => {
    if (!currentUnit || !activePathway) return;
    try {
      const res = await fetch(`/api/training/unit/${currentUnit.id}/progress`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'completed' })
      });
      if (res.ok) {
        await loadPathwayDetails(activePathway.id);
        if (activeUnitIndex < (currentModule?.units?.length || 1) - 1) {
          setActiveUnitIndex(prev => prev + 1);
          setSelectedOption(null);
          setExerciseResult(null);
          setActiveHint(null);
        }
      }
    } catch (err) {
      console.error('Progress update error:', err);
    }
  };

  // Submit Reassessment Checkpoint
  const handleReassessModule = async () => {
    if (!currentModule || !activePathway) return;
    const combinedLength = (reassessmentSolution.trim() + ' ' + reassessmentRationale.trim()).trim().length;
    if (combinedLength < 10) {
      setReassessmentResult({
        is_mastered: false,
        error: 'Please provide a substantive technical synthesis solution (at least 10 characters) addressing the challenge scenario.'
      });
      return;
    }
    setReassessing(true);
    try {
      const res = await fetch(`/api/training/module/${currentModule.id}/reassess`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          solution_text: reassessmentSolution.trim(),
          approach_rationale: reassessmentRationale.trim(),
          challenge_prompt: reassessmentPrompt?.specific_prompt
        })
      });
      const data = await res.json() as any;
      if (res.ok) {
        setReassessmentResult(data);
        await loadPathwayDetails(activePathway.id);
        await loadReassessmentHistory(currentModule.id);
        await loadSpacedRevision();
      } else {
        setReassessmentResult({
          is_mastered: false,
          error: data.error || 'Reassessment checkpoint validation failed.'
        });
      }
    } catch (err) {
      console.error('Reassessment failed:', err);
    } finally {
      setReassessing(false);
    }
  };

  // Spaced Revision API
  const loadSpacedRevision = async () => {
    setSpacedRevisionLoading(true);
    try {
      const res = await fetch('/api/training/spaced-revision');
      if (res.ok) {
        const data = await res.json() as any;
        setSpacedRevisionData(data);
      }
    } catch (err) {
      console.error('Failed to load spaced revision:', err);
    } finally {
      setSpacedRevisionLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'revision') {
      loadSpacedRevision();
    }
  }, [activeTab]);

  const handleCompleteRevision = async (moduleId: string) => {
    setCompletingRevisionId(moduleId);
    try {
      const res = await fetch(`/api/training/module/${moduleId}/complete-revision`, {
        method: 'POST'
      });
      if (res.ok) {
        const data = await res.json() as any;
        setRevisionSuccessMsg(data.message || 'Retention check verified. Next spaced revision scheduled in 21 days.');
        await loadSpacedRevision();
        if (activePathway) {
          await loadPathwayDetails(activePathway.id);
        }
        setTimeout(() => setRevisionSuccessMsg(null), 6000);
      }
    } catch (err) {
      console.error('Complete revision failed:', err);
    } finally {
      setCompletingRevisionId(null);
    }
  };

  const isTrainerOrAdmin = currentUser?.role === 'recruiter' || currentUser?.role === 'org_admin';
  const dueNowCount = spacedRevisionData?.due_now?.length || 0;

  return (
    <DashboardLayout role={currentUser?.role || 'candidate'} userFullName={currentUser?.full_name || 'Learner'}>
      <div className="space-y-8">

        {/* Header */}
        <header className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-6 border-b border-[#063750]">
          <div>
            <div className="flex items-center gap-2 text-[#FF4103] text-xs font-bold uppercase tracking-wider mb-2">
              <BookOpen className="w-4 h-4 text-[#FF4103]" />
              <span>Priority 18 · Personalized Teaching & Adaptive Mastery Engine</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
              Evidence-Driven Learning Pathways
            </h1>
            <p className="text-slate-300 text-sm mt-1">
              Personalized micro-curricula compiled directly from diagnosed M01–M05 gaps. Enforces prerequisite trees, teach-before-test pedagogy, and server-validated mastery gates.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={handleOpenGenerateModal}
              disabled={generatingPathway}
              className="px-4 py-2.5 rounded-xl bg-[#FF4103] hover:bg-[#e03200] disabled:opacity-50 text-white text-xs font-bold flex items-center gap-2 shadow-lg shadow-[#FF4103]/25 transition-all"
            >
              <Sparkles className={`w-4 h-4 ${generatingPathway ? 'animate-spin' : ''}`} />
              <span>{generatingPathway ? 'Compiling Pathway...' : 'Generate Personalized Pathway'}</span>
            </button>
          </div>
        </header>

        {/* Invariant Banner: Completion != Mastery */}
        <div className="p-6 bg-gradient-to-r from-[#001f2e] via-[#001a26] to-[#00131d] border border-[#063750] rounded-2xl relative overflow-hidden">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-xl bg-[#FF4103]/15 border border-[#FF4103]/30 flex items-center justify-center shrink-0">
              <Award className="w-6 h-6 text-[#FF4103]" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <span>Core Governance Invariant: Completion ≠ Mastery</span>
                <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  Enforced
                </span>
              </h3>
              <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                Completing instructional reading units advances content completion percentage, but does <span className="text-[#FF4103] font-bold">NOT</span> inflate verified skill proficiency. Verified competency is only awarded when passing server-evaluated checkpoint reassessments (≥75%), which update Bayesian θ proficiency in M02, record verified entries in the M05 Evidence Ledger, and schedule spaced retention reviews (+7–14 days).
              </p>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 border-b border-[#063750] pb-2">
          <button
            onClick={() => setActiveTab('learner')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === 'learner'
                ? 'bg-[#FF4103] text-white shadow-lg shadow-[#FF4103]/25'
                : 'bg-[#001f2e] text-slate-300 hover:text-white border border-[#063750]'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>Learner Curriculum Cockpit</span>
          </button>

          <button
            onClick={() => setActiveTab('revision')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 relative ${
              activeTab === 'revision'
                ? 'bg-[#FF4103] text-white shadow-lg shadow-[#FF4103]/25'
                : 'bg-[#001f2e] text-slate-300 hover:text-white border border-[#063750]'
            }`}
          >
            <Clock className="w-4 h-4" />
            <span>Spaced Revision Schedule</span>
            {dueNowCount > 0 && (
              <span className="px-1.5 py-0.5 rounded-full bg-amber-500 text-slate-900 font-black text-[10px] ml-1">
                {dueNowCount}
              </span>
            )}
          </button>

          {isTrainerOrAdmin && (
            <button
              onClick={() => setActiveTab('cohort')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                activeTab === 'cohort'
                  ? 'bg-[#FF4103] text-white shadow-lg shadow-[#FF4103]/25'
                  : 'bg-[#001f2e] text-slate-300 hover:text-white border border-[#063750]'
              }`}
            >
              <Users className="w-4 h-4" />
              <span>Cohort & Institutional Analytics</span>
            </button>
          )}
        </div>

        {/* ================= TAB 1: LEARNER WORKSPACE ================= */}
        {activeTab === 'learner' && (
          <div className="space-y-6">

            {/* Pathway Overview Bar */}
            {activePathway ? (
              <div className="p-6 bg-[#001f2e] border border-[#063750] rounded-2xl shadow-lg space-y-4">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-[#002f47]">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-[#FF4103]/20 text-[#FF4103] border border-[#FF4103]/30 font-bold">
                        {(activePathway.pathway_type || 'evidence_remediation').replace('_', ' ')}
                      </span>
                      {pathways.length > 1 && (
                        <select
                          value={activePathway.id}
                          onChange={(e) => loadPathwayDetails(e.target.value, true)}
                          className="text-xs bg-[#00141f] border border-[#002f47] text-white rounded-lg px-2 py-1 font-mono focus:outline-none"
                        >
                          {pathways.map(p => (
                            <option key={p.id} value={p.id}>
                              {p.title} ({p.target_role})
                            </option>
                          ))}
                        </select>
                      )}
                    </div>
                    <h2 className="text-xl font-bold text-white mt-1.5">{activePathway.title}</h2>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Target Role: <strong className="text-white">{activePathway.target_role}</strong> • Domain: <strong className="text-white capitalize">{activePathway.domain.replace('_', ' ')}</strong>
                    </p>
                  </div>

                  <div className="flex items-center gap-6">
                    <div>
                      <span className="text-[10px] uppercase font-mono text-slate-400 block">Content Completion</span>
                      <div className="text-2xl font-black text-white mt-0.5">{activePathway.overall_progress}%</div>
                      <div className="w-28 h-1.5 bg-[#001824] rounded-full mt-1 overflow-hidden">
                        <div className="h-full bg-slate-400 rounded-full" style={{ width: `${activePathway.overall_progress}%` }} />
                      </div>
                    </div>

                    <div>
                      <span className="text-[10px] uppercase font-mono text-emerald-400 block font-bold">Verified Mastery</span>
                      <div className="text-2xl font-black text-emerald-400 mt-0.5">{activePathway.mastery_score}%</div>
                      <div className="w-28 h-1.5 bg-[#001824] rounded-full mt-1 overflow-hidden">
                        <div className="h-full bg-emerald-400 rounded-full" style={{ width: `${activePathway.mastery_score}%` }} />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Evidence Attribution Sources */}
                <div className="p-4 bg-[#001824] rounded-xl border border-[#002f47] space-y-2">
                  <div className="flex items-center gap-2 text-xs font-bold text-white">
                    <ShieldCheck className="w-4 h-4 text-[#FF4103]" />
                    <span>Evidence-Driven Recommendation Attribution:</span>
                  </div>
                  <div className="grid sm:grid-cols-2 gap-2 text-[11px] text-slate-300">
                    {(activePathway.evidence_sources || []).map((src, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#FF4103] shrink-0" />
                        <span>{src}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-8 bg-[#001f2e] border border-[#063750] rounded-2xl text-center space-y-3">
                <BookOpen className="w-8 h-8 text-slate-500 mx-auto" />
                <h3 className="text-base font-bold text-white">No Learning Pathway Active</h3>
                <p className="text-xs text-slate-400 max-w-md mx-auto">
                  Click "Generate Personalized Pathway" to compile a customized curriculum based on your assessment results, simulation telemetry, and interview feedback.
                </p>
              </div>
            )}

            {/* Main Interactive Grid: Module List + Unit Viewer */}
            {activePathway && (
              <div className="grid lg:grid-cols-3 gap-6">

                {/* Left Column: Prerequisite Module Sequence */}
                <div className="space-y-3">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 px-1">Curriculum Progression</h3>

                  {(activePathway.modules || []).map((mod, idx) => {
                    const isSelected = idx === activeModuleIndex;
                    const isLocked = mod.status === 'locked';
                    const isMastered = mod.mastery_status === 'mastered';

                    return (
                      <div
                        key={mod.id}
                        onClick={() => {
                          if (!isLocked) {
                            setActiveModuleIndex(idx);
                            setActiveUnitIndex(0);
                            setSelectedOption(null);
                            setExerciseResult(null);
                            setReassessmentResult(null);
                            setActiveHint(null);
                          }
                        }}
                        className={`p-4 rounded-xl border transition-all text-left block ${
                          isLocked 
                            ? 'bg-[#001520] border-[#002b40]/50 opacity-60 cursor-not-allowed' :
                          isSelected
                            ? 'bg-[#002538] border-[#FF4103] shadow-lg shadow-[#FF4103]/10 cursor-pointer'
                            : 'bg-[#001f2e] border-[#063750] hover:border-[#003b57] cursor-pointer'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-[10px] font-mono text-slate-400 uppercase font-bold">
                            Module {mod.sequence_order}
                          </span>
                          {isMastered ? (
                            <span className="flex items-center gap-1 text-[10px] font-mono bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded font-bold border border-emerald-500/30">
                              <CheckCircle2 className="w-3 h-3" /> Mastered
                            </span>
                          ) : isLocked ? (
                            <span className="flex items-center gap-1 text-[10px] font-mono bg-slate-800 text-slate-400 px-2 py-0.5 rounded">
                              <Lock className="w-3 h-3" /> Locked
                            </span>
                          ) : (
                            <span className="text-[10px] font-mono bg-sky-500/20 text-sky-300 px-2 py-0.5 rounded border border-sky-500/30">
                              Available
                            </span>
                          )}
                        </div>

                        <h4 className="text-sm font-bold text-white">{mod.title}</h4>
                        <p className="text-[11px] text-slate-400 mt-1 line-clamp-2">{mod.description}</p>

                        <div className="mt-3 pt-2 border-t border-[#002b40] space-y-1">
                          <div className="flex items-center justify-between text-[10px] text-slate-400">
                            <span>{mod.units.length} Units</span>
                            <span className="text-slate-300">{mod.competency_name}</span>
                          </div>
                          {mod.revision_due_at && (
                            <div className="text-[10px] font-mono text-amber-300/90 flex items-center justify-between pt-1 border-t border-[#002233]">
                              <span>Spaced Revision:</span>
                              <span>Due {new Date(mod.revision_due_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Right 2 Columns: Active Unit Workspace */}
                <div className="lg:col-span-2 space-y-6">
                  {currentModule && currentUnit ? (
                    <div className="bg-[#001f2e] border border-[#063750] rounded-2xl p-6 shadow-lg space-y-6">

                      {/* Module Gap Context */}
                      <div className="p-4 bg-[#001824] rounded-xl border border-[#002f47] space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-white flex items-center gap-2">
                            <AlertTriangle className="w-4 h-4 text-amber-400" />
                            <span>Diagnosed Capability Gap</span>
                          </span>
                          <div className="flex items-center gap-2">
                            {currentModule.revision_due_at && (
                              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                                Spaced Revision: Due {new Date(currentModule.revision_due_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                              </span>
                            )}
                            <span className="text-[10px] font-mono text-slate-400">Prerequisite Enforced</span>
                          </div>
                        </div>
                        <p className="text-xs text-slate-300 leading-relaxed">{currentModule.evidence_gap_summary}</p>
                        <div className="text-[11px] text-slate-400 pt-1 border-t border-[#002b40]">
                          Target: <strong className="text-white">{currentModule.target_capability}</strong>
                        </div>
                      </div>

                      {/* Unit Sub-tabs */}
                      <div className="flex items-center gap-2 border-b border-[#002f47] overflow-x-auto pb-2">
                        {(currentModule?.units || []).map((u, uIdx) => (
                          <button
                            key={u.id}
                            onClick={() => {
                              setActiveUnitIndex(uIdx);
                              setSelectedOption(null);
                              setExerciseResult(null);
                              setReassessmentResult(null);
                              setActiveHint(null);
                            }}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 ${
                              uIdx === activeUnitIndex
                                ? 'bg-[#FF4103] text-white shadow-sm'
                                : u.completion_status === 'completed'
                                ? 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/20'
                                : 'bg-[#001824] text-slate-300 hover:text-white'
                            }`}
                          >
                            {u.completion_status === 'completed' ? (
                              <CheckCircle2 className="w-3.5 h-3.5" />
                            ) : (
                              <span className="w-3.5 h-3.5 rounded-full border border-slate-500 inline-block text-[9px] text-center leading-3">
                                {u.unit_order}
                              </span>
                            )}
                            <span>{u.title}</span>
                          </button>
                        ))}
                      </div>

                      {/* Unit Content Body */}
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <h3 className="text-lg font-bold text-white flex items-center gap-2">
                            <span>{currentUnit.title}</span>
                          </h3>
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#001824] text-slate-400 border border-[#002f47]">
                            {currentUnit.unit_type.replace('_', ' ')}
                          </span>
                        </div>

                        {/* Markdown / Lesson Body */}
                        <div className="p-4 bg-[#001824] rounded-xl border border-[#002f47] text-xs text-slate-200 leading-relaxed space-y-3 font-sans whitespace-pre-line">
                          {currentUnit.content_markdown}
                        </div>

                        {/* Formative Interactive Practice Exercise */}
                        {currentUnit.interactive_exercise && (
                          <div className="p-5 bg-[#001a29] rounded-xl border border-[#063750] space-y-4">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2 text-xs font-bold text-white">
                                <HelpCircle className="w-4 h-4 text-[#FF4103]" />
                                <span>Formative Practice Exercise</span>
                              </div>
                              <button
                                onClick={handleRequestHint}
                                disabled={hintLoading}
                                className="px-2.5 py-1 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[11px] font-bold flex items-center gap-1.5 transition-all"
                              >
                                <Sparkles className="w-3 h-3 text-amber-400" />
                                <span>{hintLoading ? 'Retrieving Hint...' : 'Request Guiding Hint'}</span>
                              </button>
                            </div>

                            <p className="text-xs text-slate-200 font-semibold">
                              {currentUnit.interactive_exercise.question}
                            </p>

                            {/* Progressive Hint Display */}
                            {activeHint && (
                              <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl text-xs text-amber-200 space-y-1">
                                <div className="font-bold flex items-center gap-1.5 text-amber-300">
                                  <Info className="w-3.5 h-3.5" />
                                  <span>Pedagogical Hint</span>
                                </div>
                                <p>{activeHint}</p>
                              </div>
                            )}

                            <div className="space-y-2">
                              {(currentUnit.interactive_exercise.options || []).map((opt, optIdx) => {
                                const isChecked = selectedOption === optIdx;
                                return (
                                  <label
                                    key={optIdx}
                                    className={`flex items-start gap-3 p-3 rounded-xl border text-xs cursor-pointer transition-all ${
                                      isChecked
                                        ? 'bg-[#FF4103]/10 border-[#FF4103] text-white'
                                        : 'bg-[#001824] border-[#002f47] text-slate-300 hover:bg-[#002236]'
                                    }`}
                                  >
                                    <input
                                      type="radio"
                                      name="exercise_option"
                                      checked={isChecked}
                                      onChange={() => setSelectedOption(optIdx)}
                                      className="mt-0.5 accent-[#FF4103]"
                                    />
                                    <span>{opt}</span>
                                  </label>
                                );
                              })}
                            </div>

                            <div className="flex items-center gap-3">
                              <button
                                onClick={handleSubmitExercise}
                                disabled={selectedOption === null || submittingExercise}
                                className="px-4 py-2 rounded-xl bg-[#FF4103] hover:bg-[#e03200] disabled:opacity-50 text-white text-xs font-bold transition-all shadow-md"
                              >
                                {submittingExercise ? 'Evaluating...' : 'Submit Answer'}
                              </button>
                            </div>

                            {/* Exercise Instant Feedback */}
                            {exerciseResult && (
                              <div className={`p-4 rounded-xl text-xs space-y-2 border ${
                                exerciseResult.is_correct
                                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-200'
                                  : 'bg-rose-500/10 border-rose-500/30 text-rose-200'
                              }`}>
                                <div className="font-bold flex items-center gap-2">
                                  {exerciseResult.is_correct ? (
                                    <>
                                      <CheckCircle className="w-4 h-4 text-emerald-400" />
                                      <span>Correct! Demonstrates solid conceptual grasp.</span>
                                    </>
                                  ) : (
                                    <>
                                      <AlertTriangle className="w-4 h-4 text-rose-400" />
                                      <span>Incorrect. Notice the misconception below:</span>
                                    </>
                                  )}
                                </div>
                                <p><strong>Explain Why:</strong> {exerciseResult.explanation_why}</p>
                                <p><strong>Explain How:</strong> {exerciseResult.explanation_how}</p>
                                {exerciseResult.misconception_warning && (
                                  <p className="text-amber-300">
                                    <strong>Misconception Alert:</strong> {exerciseResult.misconception_warning}
                                  </p>
                                )}
                              </div>
                            )}
                          </div>
                        )}

                        {/* Reassessment Gate View (if checkpoint unit) */}
                        {currentUnit.unit_type === 'reassessment_gate' && (
                          <div className="p-5 bg-gradient-to-br from-[#001f2e] to-[#001824] rounded-xl border border-emerald-500/30 space-y-5">
                            
                            {/* Gate Header */}
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-[#002f47]">
                              <div className="flex items-center gap-2 text-xs font-bold text-white">
                                <Award className="w-5 h-5 text-emerald-400" />
                                <span>Module Reassessment Checkpoint Gate</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="text-[10px] font-mono text-emerald-300 bg-emerald-500/20 px-2 py-0.5 rounded border border-emerald-500/30">
                                  75% Score Required for Mastery
                                </span>
                                {reassessmentPrompt && (
                                  <span className="text-[10px] font-mono text-sky-300 bg-sky-500/20 px-2 py-0.5 rounded border border-sky-500/30">
                                    Variation #{reassessmentPrompt.variation_index} · Attempt #{reassessmentPrompt.attempt_number}
                                  </span>
                                )}
                              </div>
                            </div>

                            {/* Challenge Scenario & Specific Prompt */}
                            {reassessmentPromptLoading ? (
                              <div className="p-4 bg-[#00141f] rounded-xl border border-[#002f47] text-xs text-slate-400 text-center">
                                Loading dynamic challenge scenario...
                              </div>
                            ) : reassessmentPrompt ? (
                              <div className="space-y-3">
                                <div className="p-4 bg-[#00141f] rounded-xl border border-[#002f47] space-y-2">
                                  <div className="text-[11px] font-bold text-sky-400 uppercase tracking-wider flex items-center gap-1.5">
                                    <Sparkles className="w-3.5 h-3.5" />
                                    <span>Realistic Operational Challenge Scenario</span>
                                  </div>
                                  <p className="text-xs text-slate-200 leading-relaxed font-medium">
                                    {reassessmentPrompt.challenge_scenario}
                                  </p>
                                </div>

                                <div className="p-4 bg-[#00141f] rounded-xl border border-[#002f47] space-y-2">
                                  <div className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                                    <Play className="w-3.5 h-3.5" />
                                    <span>Demonstration Prompt</span>
                                  </div>
                                  <p className="text-xs text-slate-200 leading-relaxed font-semibold">
                                    {reassessmentPrompt.specific_prompt}
                                  </p>
                                </div>

                                {/* Criteria Dimensions Rubric */}
                                <div className="p-3 bg-[#001824] rounded-xl border border-[#002f47] space-y-2">
                                  <div className="text-[10px] font-mono uppercase text-slate-400 font-bold">
                                    Server-Side Evaluation Rubric (4 Weighted Dimensions)
                                  </div>
                                  <div className="grid sm:grid-cols-2 gap-2 text-[11px]">
                                    {(reassessmentPrompt.criteria_dimensions || []).map((cd, cdIdx) => (
                                      <div key={cdIdx} className="p-2 bg-[#00141f] rounded-lg border border-[#002538] space-y-0.5">
                                        <div className="font-bold text-white flex items-center justify-between">
                                          <span>{cd.dimension}</span>
                                          <span className="text-[#FF4103] font-mono text-[10px]">{Math.round(cd.weight * 100)}%</span>
                                        </div>
                                        <div className="text-slate-400 text-[10px]">{cd.description}</div>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              </div>
                            ) : (
                              <div className="p-4 bg-[#00141f] rounded-xl border border-[#002f47] text-xs text-slate-300">
                                This checkpoint gate validates that learning transfer has occurred. Passing this reassessment unlocks the next sequential module and commits verified mastery evidence into your Bayesian competency profile and M05 ledger.
                              </div>
                            )}

                            {/* Candidate Solution Inputs */}
                            <div className="space-y-3">
                              <div>
                                <label className="text-[11px] font-bold text-slate-300 block mb-1">
                                  Technical Solution & Implementation Synthesis (Required):
                                </label>
                                <textarea
                                  rows={4}
                                  value={reassessmentSolution}
                                  onChange={(e) => setReassessmentSolution(e.target.value)}
                                  placeholder="Record candidate practical demonstration notes, diagnostic sequence, or implementation synthesis..."
                                  className="w-full bg-[#00141f] border border-[#002f47] text-white text-xs rounded-xl p-3 focus:outline-none focus:border-emerald-400 leading-relaxed font-mono"
                                />
                              </div>

                              <div>
                                <label className="text-[11px] font-bold text-slate-300 block mb-1">
                                  Approach Rationale, Trade-offs & Failure Modes (Recommended):
                                </label>
                                <textarea
                                  rows={2}
                                  value={reassessmentRationale}
                                  onChange={(e) => setReassessmentRationale(e.target.value)}
                                  placeholder="Explain why you chose this intervention versus alternatives, operational trade-offs, and verification metrics..."
                                  className="w-full bg-[#00141f] border border-[#002f47] text-white text-xs rounded-xl p-3 focus:outline-none focus:border-emerald-400 leading-relaxed font-mono"
                                />
                              </div>
                            </div>

                            <button
                              onClick={handleReassessModule}
                              disabled={reassessing}
                              className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-bold transition-all shadow-md shadow-emerald-600/20 flex items-center gap-2"
                            >
                              <Play className="w-4 h-4" />
                              <span>{reassessing ? 'Evaluating Checkpoint Rubric...' : 'Execute Reassessment Gate'}</span>
                            </button>

                            {/* Server-Side Rubric Evaluation Result */}
                              {reassessmentResult && (
                                <div className={`p-5 rounded-xl text-xs space-y-4 border ${
                                  (reassessmentResult.is_mastered || reassessmentResult.passed)
                                    ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-200'
                                    : 'bg-amber-500/10 border-amber-500/30 text-amber-200'
                                }`}>
                                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-emerald-500/20">
                                    <div className="font-bold flex items-center gap-2 text-white text-sm">
                                      {(reassessmentResult.is_mastered || reassessmentResult.passed) ? (
                                      <>
                                        <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                                        <span>Demonstrated Mastery Confirmed: {reassessmentResult.demonstrated_score || 0}%</span>
                                      </>
                                    ) : (
                                      <>
                                        <AlertTriangle className="w-5 h-5 text-amber-400" />
                                        <span>Checkpoint Needs Practice — Score: {reassessmentResult.demonstrated_score || 0}%</span>
                                      </>
                                    )}
                                  </div>
                                  <div className="text-right">
                                    <span className="text-lg font-black text-white">{reassessmentResult.demonstrated_score || 0}%</span>
                                    <span className="text-[10px] text-slate-400 block">Passing: 75%</span>
                                  </div>
                                </div>

                                {reassessmentResult.error && (
                                  <p className="text-rose-300 font-semibold">{reassessmentResult.error}</p>
                                )}

                                {/* Criteria Dimensions Breakdown */}
                                {reassessmentResult.criteria_breakdown && (
                                  <div className="space-y-2">
                                    <div className="font-bold text-white text-[11px]">Criteria Dimension Scores:</div>
                                    <div className="grid sm:grid-cols-2 gap-2">
                                      {Object.entries(reassessmentResult.criteria_breakdown).map(([dimKey, val]: [string, any]) => (
                                        <div key={dimKey} className="p-2.5 bg-[#00141f] rounded-lg border border-[#002f47] space-y-1">
                                          <div className="flex items-center justify-between text-[11px]">
                                            <span className="text-slate-300 capitalize">{dimKey.replace(/_/g, ' ')}</span>
                                            <span className="font-mono font-bold text-white">{val.score}%</span>
                                          </div>
                                          <div className="w-full h-1.5 bg-[#001f2e] rounded-full overflow-hidden">
                                            <div
                                              className={`h-full rounded-full ${val.score >= 75 ? 'bg-emerald-400' : 'bg-amber-400'}`}
                                              style={{ width: `${Math.min(100, val.score)}%` }}
                                            />
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )}

                                {/* Strengths & Omissions */}
                                {reassessmentResult.strengths?.length > 0 && (
                                  <div className="space-y-1">
                                    <div className="font-bold text-emerald-300 text-[11px] flex items-center gap-1">
                                      <Check className="w-3.5 h-3.5" /> Strengths Demonstrated:
                                    </div>
                                    <ul className="list-disc pl-5 space-y-0.5 text-[11px] text-slate-200">
                                      {reassessmentResult.strengths.map((s: string, idx: number) => (
                                        <li key={idx}>{s}</li>
                                      ))}
                                    </ul>
                                  </div>
                                )}

                                {reassessmentResult.omissions?.length > 0 && (
                                  <div className="space-y-1">
                                    <div className="font-bold text-amber-300 text-[11px] flex items-center gap-1">
                                      <AlertCircle className="w-3.5 h-3.5" /> Key Omissions:
                                    </div>
                                    <ul className="list-disc pl-5 space-y-0.5 text-[11px] text-slate-200">
                                      {reassessmentResult.omissions.map((o: string, idx: number) => (
                                        <li key={idx}>{o}</li>
                                      ))}
                                    </ul>
                                  </div>
                                )}

                                {reassessmentResult.remediation_recommendations?.length > 0 && (
                                  <div className="space-y-1 p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg">
                                    <div className="font-bold text-amber-200 text-[11px]">Remediation Guidance:</div>
                                    <ul className="list-disc pl-5 space-y-0.5 text-[11px] text-amber-100">
                                      {reassessmentResult.remediation_recommendations.map((r: string, idx: number) => (
                                        <li key={idx}>{r}</li>
                                      ))}
                                    </ul>
                                  </div>
                                )}

                                {(reassessmentResult.is_mastered || reassessmentResult.passed) && (
                                  <div className="pt-2 border-t border-emerald-500/20 text-slate-300 text-[11px] space-y-1">
                                    <p className="text-emerald-300 font-bold">✓ Next module unlocked in sequence.</p>
                                    <p>Bayesian θ updated in M02 and verified entry recorded in M05 Evidence Ledger.</p>
                                    {reassessmentResult.revision_due_at && (
                                      <p className="text-sky-300">
                                        ✓ Spaced retention check scheduled for {new Date(reassessmentResult.revision_due_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })} (+14 days).
                                      </p>
                                    )}
                                  </div>
                                )}
                              </div>
                            )}

                            {/* Past Reassessment Attempts History Accordion */}
                            {reassessmentHistory.length > 0 && (
                              <div className="pt-3 border-t border-[#002f47] space-y-2">
                                <button
                                  onClick={() => setShowHistoryAccordion(!showHistoryAccordion)}
                                  className="w-full flex items-center justify-between text-xs text-slate-400 hover:text-white transition-all py-1"
                                >
                                  <span className="flex items-center gap-1.5 font-bold">
                                    <History className="w-3.5 h-3.5 text-sky-400" />
                                    <span>Past Reassessment Attempts ({reassessmentHistory.length})</span>
                                  </span>
                                  <span className="text-[10px] text-slate-400">
                                    {showHistoryAccordion ? 'Hide History' : 'View History'}
                                  </span>
                                </button>

                                {showHistoryAccordion && (
                                  <div className="space-y-2 pt-2">
                                    {reassessmentHistory.map((att) => (
                                      <div key={att.id} className="p-3 bg-[#00141f] rounded-xl border border-[#002538] text-xs space-y-1.5">
                                        <div className="flex items-center justify-between">
                                          <span className="font-bold text-white flex items-center gap-1.5">
                                            {att.is_mastered ? (
                                              <span className="text-emerald-400 flex items-center gap-1">
                                                <CheckCircle2 className="w-3.5 h-3.5" /> Mastered ({att.score_pct}%)
                                              </span>
                                            ) : (
                                              <span className="text-amber-400 flex items-center gap-1">
                                                <AlertTriangle className="w-3.5 h-3.5" /> Needs Practice ({att.score_pct}%)
                                              </span>
                                            )}
                                          </span>
                                          <span className="text-[10px] font-mono text-slate-500">
                                            {new Date(att.created_at).toLocaleString()}
                                          </span>
                                        </div>
                                        <p className="text-[11px] text-slate-300 line-clamp-2">{att.challenge_prompt}</p>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            )}

                          </div>
                        )}

                        {/* Navigation / Next Actions */}
                        <div className="flex items-center justify-between pt-4 border-t border-[#002f47]">
                          <span className="text-xs text-slate-400">
                            Unit {activeUnitIndex + 1} of {currentModule.units.length}
                          </span>

                          <button
                            onClick={handleMarkUnitComplete}
                            className="px-4 py-2 rounded-xl bg-[#001824] hover:bg-[#002538] border border-[#002f47] text-slate-200 text-xs font-bold flex items-center gap-2 transition-all"
                          >
                            <span>Mark Completed & Next</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </button>
                        </div>

                      </div>

                    </div>
                  ) : null}
                </div>

              </div>
            )}

            {/* M05 Closed-Loop Hands-on Ecosystem Handoff */}
            <div className="p-6 bg-[#001f2e] border border-[#063750] rounded-2xl shadow-lg space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-[#002f47]">
                <h4 className="text-base font-bold text-white flex items-center gap-2">
                  <Laptop className="w-4 h-4 text-[#FF4103]" />
                  <span>Hands-on Ecosystem Handoffs</span>
                </h4>
                <span className="text-xs text-slate-400">Multi-Modal Learning Transfer</span>
              </div>

              <div className="grid sm:grid-cols-3 gap-4">
                <a
                  href="/assess"
                  className="p-4 bg-[#001824] rounded-xl border border-[#002f47] hover:border-[#FF4103] transition-all group block"
                >
                  <Brain className="w-5 h-5 text-[#FF4103] mb-2 group-hover:scale-110 transition-transform" />
                  <div className="text-xs font-bold text-white">M02 Adaptive Verification</div>
                  <div className="text-[11px] text-slate-400 mt-1">Re-test item bank with Bayesian θ uncertainty bounds.</div>
                </a>

                <a
                  href="/simulation"
                  className="p-4 bg-[#001824] rounded-xl border border-[#002f47] hover:border-[#FF4103] transition-all group block"
                >
                  <Laptop className="w-5 h-5 text-emerald-400 mb-2 group-hover:scale-110 transition-transform" />
                  <div className="text-xs font-bold text-white">M03 Practical Sandbox</div>
                  <div className="text-[11px] text-slate-400 mt-1">Execute chaos fault tolerance and telemetry tasks.</div>
                </a>

                <a
                  href="/interview-prep"
                  className="p-4 bg-[#001824] rounded-xl border border-[#002f47] hover:border-[#FF4103] transition-all group block"
                >
                  <Users className="w-5 h-5 text-purple-400 mb-2 group-hover:scale-110 transition-transform" />
                  <div className="text-xs font-bold text-white">M04 Panel Simulation</div>
                  <div className="text-[11px] text-slate-400 mt-1">Rehearse stakeholder justification under crisis turns.</div>
                </a>
              </div>
            </div>

          </div>
        )}

        {/* ================= TAB 2: SPACED REVISION SCHEDULE ================= */}
        {activeTab === 'revision' && (
          <div className="space-y-6">

            {/* Notification message */}
            {revisionSuccessMsg && (
              <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-xs text-emerald-300 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>{revisionSuccessMsg}</span>
              </div>
            )}

            {/* Overview Metric Cards */}
            <div className="grid md:grid-cols-3 gap-6">
              <div className="p-6 bg-[#001f2e] border border-[#063750] rounded-2xl shadow-lg">
                <span className="text-xs font-bold uppercase text-amber-400 flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5" /> Due Now / Overdue
                </span>
                <div className="text-3xl font-black text-amber-400 mt-2">
                  {spacedRevisionData?.due_now?.length || 0}
                </div>
                <p className="text-xs text-slate-400 mt-2">Modules requiring immediate retention practice to prevent decay.</p>
              </div>

              <div className="p-6 bg-[#001f2e] border border-[#063750] rounded-2xl shadow-lg">
                <span className="text-xs font-bold uppercase text-sky-400 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5" /> Upcoming This Week
                </span>
                <div className="text-3xl font-black text-sky-400 mt-2">
                  {spacedRevisionData?.upcoming_this_week?.length || 0}
                </div>
                <p className="text-xs text-slate-400 mt-2">Scheduled within the next 7 days for consolidation.</p>
              </div>

              <div className="p-6 bg-[#001f2e] border border-[#063750] rounded-2xl shadow-lg">
                <span className="text-xs font-bold uppercase text-emerald-400 flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Retained Mastery
                </span>
                <div className="text-3xl font-black text-emerald-400 mt-2">
                  {spacedRevisionData?.retained_mastery?.length || 0}
                </div>
                <p className="text-xs text-slate-400 mt-2">Consolidated modules with active long-term mastery.</p>
              </div>
            </div>

            {/* List 1: Due Now Modules */}
            <div className="p-6 bg-[#001f2e] border border-[#063750] rounded-2xl shadow-lg space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-[#002f47]">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <Flame className="w-5 h-5 text-amber-400" />
                  <span>Immediate Spaced Retention Queue</span>
                </h3>
                <span className="text-xs text-slate-400">Memory Decay Defense</span>
              </div>

              {spacedRevisionLoading ? (
                <div className="text-xs text-slate-400 text-center py-6">Loading spaced revision queue...</div>
              ) : (spacedRevisionData?.due_now || []).length === 0 ? (
                <div className="p-6 bg-[#001824] rounded-xl text-center space-y-2 border border-[#002f47]">
                  <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto" />
                  <p className="text-xs font-bold text-white">All Active Modules Up-to-Date!</p>
                  <p className="text-xs text-slate-400">No modules are currently overdue for retention practice.</p>
                </div>
              ) : (
                <div className="divide-y divide-[#002f47]">
                  {(spacedRevisionData.due_now || []).map((item: any) => (
                    <div key={item.module_id} className="py-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 font-bold">
                            Due Now
                          </span>
                          <span className="text-xs text-slate-400">{item.pathway_title}</span>
                        </div>
                        <h4 className="text-sm font-bold text-white mt-1">{item.module_title}</h4>
                        <p className="text-xs text-slate-300 mt-0.5">Competency: {item.competency_name}</p>
                      </div>

                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => handleCompleteRevision(item.module_id)}
                          disabled={completingRevisionId === item.module_id}
                          className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-white text-xs font-bold flex items-center gap-2 shadow-md transition-all"
                        >
                          <RefreshCw className={`w-3.5 h-3.5 ${completingRevisionId === item.module_id ? 'animate-spin' : ''}`} />
                          <span>{completingRevisionId === item.module_id ? 'Verifying...' : 'Complete Retention Review'}</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* List 2: Upcoming and Retained */}
            <div className="grid md:grid-cols-2 gap-6">
              {/* Upcoming */}
              <div className="p-6 bg-[#001f2e] border border-[#063750] rounded-2xl shadow-lg space-y-4">
                <h4 className="text-sm font-bold text-white flex items-center gap-2">
                  <Clock className="w-4 h-4 text-sky-400" />
                  <span>Upcoming This Week</span>
                </h4>
                {(spacedRevisionData?.upcoming_this_week || []).length === 0 ? (
                  <p className="text-xs text-slate-400">No revisions scheduled this week.</p>
                ) : (
                  <div className="divide-y divide-[#002f47]">
                    {(spacedRevisionData?.upcoming_this_week || []).map((item: any) => (
                      <div key={item.module_id} className="py-2.5 flex items-center justify-between text-xs">
                        <div>
                          <div className="font-bold text-white">{item.module_title}</div>
                          <div className="text-[11px] text-slate-400">{item.competency_name}</div>
                        </div>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-sky-500/20 text-sky-300 border border-sky-500/30">
                          in {item.days_until_due}d
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Retained Mastery */}
              <div className="p-6 bg-[#001f2e] border border-[#063750] rounded-2xl shadow-lg space-y-4">
                <h4 className="text-sm font-bold text-white flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>Consolidated Long-Term Retention</span>
                </h4>
                {(spacedRevisionData?.retained_mastery || []).length === 0 ? (
                  <p className="text-xs text-slate-400">Pass module reassessments to build long-term retention schedules.</p>
                ) : (
                  <div className="divide-y divide-[#002f47]">
                    {(spacedRevisionData?.retained_mastery || []).map((item: any) => (
                      <div key={item.module_id} className="py-2.5 flex items-center justify-between text-xs">
                        <div>
                          <div className="font-bold text-white">{item.module_title}</div>
                          <div className="text-[11px] text-slate-400">{item.competency_name}</div>
                        </div>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                          in {item.days_until_due}d
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

          </div>
        )}

        {/* ================= TAB 3: COHORT & INSTITUTION ANALYTICS ================= */}
        {activeTab === 'cohort' && (
          <div className="space-y-6">
            <div className="grid md:grid-cols-4 gap-6">
              <div className="p-6 bg-[#001f2e] border border-[#063750] rounded-2xl shadow-lg">
                <span className="text-xs font-bold uppercase text-slate-400">Learners Enrolled</span>
                <div className="text-3xl font-black text-white mt-2">
                  {cohortMetrics?.total_learners_enrolled || 12}
                </div>
                <p className="text-xs text-slate-400 mt-2">Active pathways compiled from M01–M05 signals.</p>
              </div>

              <div className="p-6 bg-[#001f2e] border border-[#063750] rounded-2xl shadow-lg">
                <span className="text-xs font-bold uppercase text-slate-400">Avg Content Completion</span>
                <div className="text-3xl font-black text-slate-200 mt-2">
                  {cohortMetrics?.avg_completion_progress || 65}%
                </div>
                <p className="text-xs text-slate-400 mt-2">Instructional reading and exercise attempts.</p>
              </div>

              <div className="p-6 bg-[#001f2e] border border-[#063750] rounded-2xl shadow-lg">
                <span className="text-xs font-bold uppercase text-emerald-400">Avg Verified Mastery</span>
                <div className="text-3xl font-black text-emerald-400 mt-2">
                  {cohortMetrics?.avg_verified_mastery || 58}%
                </div>
                <p className="text-xs text-slate-400 mt-2">Passed checkpoint gates with verified θ proficiency.</p>
              </div>

              <div className="p-6 bg-[#001f2e] border border-[#063750] rounded-2xl shadow-lg">
                <span className="text-xs font-bold uppercase text-slate-400">Mastered Pathways</span>
                <div className="text-3xl font-black text-[#FF4103] mt-2">
                  {cohortMetrics?.completed_pathways_count || 4}
                </div>
                <p className="text-xs text-slate-400 mt-2">All sequential modules passed reassessment.</p>
              </div>
            </div>

            {/* Top Diagnosed Cohort Gaps */}
            <div className="p-6 bg-[#001f2e] border border-[#063750] rounded-2xl shadow-lg space-y-4">
              <h3 className="text-lg font-bold text-white">Cohort Skill Gaps & Remediation Velocity</h3>
              <p className="text-xs text-slate-400">Top diagnosed weaknesses across engineering, finance, healthcare, and operations cohorts.</p>

              <div className="divide-y divide-[#002f47]">
                {(cohortMetrics?.top_diagnosed_gaps || []).map((g: any, idx: number) => (
                  <div key={idx} className="py-3 flex items-center justify-between text-xs">
                    <div>
                      <div className="font-bold text-white">{g.competency}</div>
                      <div className="text-[11px] text-slate-400 mt-0.5">{g.affected_learners} learners affected</div>
                    </div>
                    <span className="text-xs font-mono px-2.5 py-1 rounded bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 font-bold">
                      {g.remediation_completion} Remediated
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Pathway Generation Modal */}
        {showGenerateModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
            <div className="bg-[#001a26] border border-[#063750] rounded-2xl max-w-xl w-full p-6 shadow-2xl space-y-6">
              <div className="flex items-center justify-between pb-3 border-b border-[#002f47]">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-[#FF4103]" />
                  <h3 className="text-lg font-bold text-white">Compile Evidence-Driven Pathway</h3>
                </div>
                <button
                  onClick={() => setShowGenerateModal(false)}
                  className="p-1 rounded-lg hover:bg-[#002f47] text-slate-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4">
                <p className="text-xs text-slate-300">
                  Select a standardized role track or enter a custom target role. The curriculum engine will personalize learning objectives and calibrate checkpoint challenges to your verified M01 evidence and experience.
                </p>

                {/* Standard Preset Track Options */}
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-400 block">
                    Pre-Calibrated Occupation Tracks:
                  </label>
                  <div className="grid sm:grid-cols-2 gap-2">
                    {PRESET_ROLES.map((preset, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => {
                          setSelectedPresetIndex(idx);
                          setCustomRoleInput('');
                        }}
                        className={`p-3 rounded-xl border text-left text-xs transition-all ${
                          selectedPresetIndex === idx
                            ? 'bg-[#FF4103]/15 border-[#FF4103] text-white shadow-md'
                            : 'bg-[#00141f] border-[#002f47] text-slate-300 hover:border-slate-500'
                        }`}
                      >
                        <div className="text-[10px] uppercase font-mono text-[#FF4103] font-bold">
                          {preset.category}
                        </div>
                        <div className="font-bold text-white mt-0.5">{preset.role}</div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Custom Role Input */}
                <div className="pt-2 border-t border-[#002f47] space-y-3">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-400 block">
                    Or Specify Custom Target Role:
                  </label>
                  <input
                    type="text"
                    value={customRoleInput}
                    onChange={(e) => {
                      setCustomRoleInput(e.target.value);
                      setSelectedPresetIndex(null);
                    }}
                    placeholder="e.g. Lead Cybersecurity Architect, Pediatric Nurse..."
                    className="w-full bg-[#00141f] border border-[#002f47] rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#FF4103]"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#002f47]">
                <button
                  type="button"
                  onClick={() => setShowGenerateModal(false)}
                  className="px-4 py-2 rounded-xl bg-[#00141f] text-slate-300 hover:text-white text-xs font-bold border border-[#002f47]"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleGeneratePathway}
                  disabled={generatingPathway}
                  className="px-5 py-2 rounded-xl bg-[#FF4103] hover:bg-[#e03200] disabled:opacity-50 text-white text-xs font-bold shadow-lg shadow-[#FF4103]/25 flex items-center gap-2"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>Compile Pathway</span>
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </DashboardLayout>
  );
}
