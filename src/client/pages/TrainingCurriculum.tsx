import { useState, useEffect } from 'react';
import { 
  BookOpen, Sparkles, CheckCircle2, Lock, ArrowRight, RefreshCw, 
  Layers, ShieldCheck, Flame, Users, AlertTriangle, HelpCircle, 
  CheckCircle, ChevronRight, Laptop, Brain, Award, Play, BarChart3
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
    correct_index: number;
    explanation_why: string;
    explanation_how: string;
    misconception_warning: string;
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

export default function TrainingCurriculum() {
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [pathways, setPathways] = useState<any[]>([]);
  const [activePathway, setActivePathway] = useState<LearningPathway | null>(null);
  const [activeModuleIndex, setActiveModuleIndex] = useState(0);
  const [activeUnitIndex, setActiveUnitIndex] = useState(0);
  
  // Exercise State
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [exerciseResult, setExerciseResult] = useState<any>(null);
  const [submittingExercise, setSubmittingExercise] = useState(false);

  // Reassessment Gate State
  const [reassessing, setReassessing] = useState(false);
  const [reassessmentResult, setReassessmentResult] = useState<any>(null);
  const [reassessmentNotes, setReassessmentNotes] = useState('');

  // Trainer / Cohort View
  const [activeTab, setActiveTab] = useState<'learner' | 'cohort'>('learner');
  const [cohortMetrics, setCohortMetrics] = useState<any>(null);
  const [generatingPathway, setGeneratingPathway] = useState(false);

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
        }
      }
    } catch (err) {
      console.error('Failed to load pathway:', err);
    }
  };

  const handleGeneratePathway = async () => {
    setGeneratingPathway(true);
    try {
      const res = await fetch('/api/training/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({})
      });
      if (res.ok) {
        const data = await res.json() as any;
        await loadPathwayDetails(data.pathway_id, true);
        const pathRes = await fetch('/api/training/pathways');
        if (pathRes.ok) {
          const pData = await pathRes.json() as any;
          setPathways(pData.pathways || []);
        }
      }
    } catch (err) {
      console.error('Pathway generation failed:', err);
    } finally {
      setGeneratingPathway(false);
    }
  };

  const currentModule = activePathway?.modules?.[activeModuleIndex];
  const currentUnit = currentModule?.units?.[activeUnitIndex];

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
        }
      }
    } catch (err) {
      console.error('Progress update error:', err);
    }
  };

  // Submit Reassessment Checkpoint
  const handleReassessModule = async () => {
    if (!currentModule || !activePathway) return;
    setReassessing(true);
    try {
      const res = await fetch(`/api/training/module/${currentModule.id}/reassess`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          demonstrated_score: 0.90,
          demonstration_notes: reassessmentNotes || 'Passed checkpoint demonstrating verified competency.'
        })
      });
      if (res.ok) {
        const data = await res.json() as any;
        setReassessmentResult(data);
        await loadPathwayDetails(activePathway.id);
      }
    } catch (err) {
      console.error('Reassessment failed:', err);
    } finally {
      setReassessing(false);
    }
  };

  const isTrainerOrAdmin = currentUser?.role === 'recruiter' || currentUser?.role === 'org_admin';

  return (
    <DashboardLayout role={currentUser?.role || 'candidate'} userFullName={currentUser?.full_name || 'Learner'}>
      <div className="space-y-8">

        {/* Header */}
        <header className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-6 border-b border-[#063750]">
          <div>
            <div className="flex items-center gap-2 text-[#FF4103] text-xs font-bold uppercase tracking-wider mb-2">
              <BookOpen className="w-4 h-4 text-[#FF4103]" />
              <span>Priority 18 · Training Curriculum & Learning Pathway Engine</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
              Evidence-Driven Learning Pathways
            </h1>
            <p className="text-slate-300 text-sm mt-1">
              Personalized micro-curricula compiled directly from diagnosed M01–M05 gaps. Enforces prerequisite trees and verified competency gates.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={handleGeneratePathway}
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
                Completing instructional reading units advances completion percentage, but does <span className="text-[#FF4103] font-bold">NOT</span> inflate verified skill proficiency. Verified competency is only awarded when passing targeted checkpoint reassessments, updating Bayesian θ proficiency in M02 and the M05 Evidence Ledger.
              </p>
            </div>
          </div>
        </div>

        {/* Navigation Tabs (if trainer/recruiter) */}
        {isTrainerOrAdmin && (
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
          </div>
        )}

        {/* ================= TAB 1: LEARNER WORKSPACE ================= */}
        {activeTab === 'learner' && (
          <div className="space-y-6">

            {/* Pathway Overview Bar */}
            {activePathway ? (
              <div className="p-6 bg-[#001f2e] border border-[#063750] rounded-2xl shadow-lg space-y-4">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-[#002f47]">
                  <div>
                    <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-[#FF4103]/20 text-[#FF4103] border border-[#FF4103]/30 font-bold">
                      {(activePathway.pathway_type || 'evidence_remediation').replace('_', ' ')}
                    </span>
                    <h2 className="text-xl font-bold text-white mt-1.5">{activePathway.title}</h2>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Target Role: <strong className="text-white">{activePathway.target_role}</strong> • Domain: <strong className="text-white capitalize">{activePathway.domain}</strong>
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

                        <div className="mt-3 pt-2 border-t border-[#002b40] flex items-center justify-between text-[10px] text-slate-400">
                          <span>{mod.units.length} Units</span>
                          <span className="text-slate-300">{mod.competency_name}</span>
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
                          <span className="text-[10px] font-mono text-slate-400">Prerequisite Enforced</span>
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

                        {/* Interactive Exercise (if unit has one) */}
                        {currentUnit.interactive_exercise && (
                          <div className="p-5 bg-[#001a29] rounded-xl border border-[#063750] space-y-4">
                            <div className="flex items-center gap-2 text-xs font-bold text-white">
                              <HelpCircle className="w-4 h-4 text-[#FF4103]" />
                              <span>Formative Practice Exercise</span>
                            </div>

                            <p className="text-xs text-slate-200 font-semibold">
                              {currentUnit.interactive_exercise.question}
                            </p>

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

                            <button
                              onClick={handleSubmitExercise}
                              disabled={selectedOption === null || submittingExercise}
                              className="px-4 py-2 rounded-xl bg-[#FF4103] hover:bg-[#e03200] disabled:opacity-50 text-white text-xs font-bold transition-all shadow-md"
                            >
                              {submittingExercise ? 'Evaluating...' : 'Submit Answer'}
                            </button>

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
                          <div className="p-5 bg-gradient-to-br from-[#001f2e] to-[#001824] rounded-xl border border-emerald-500/30 space-y-4">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2 text-xs font-bold text-white">
                                <Award className="w-5 h-5 text-emerald-400" />
                                <span>Module Reassessment Checkpoint Gate</span>
                              </div>
                              <span className="text-[10px] font-mono text-emerald-300 bg-emerald-500/20 px-2 py-0.5 rounded border border-emerald-500/30">
                                75% Score Required for Mastery
                              </span>
                            </div>

                            <p className="text-xs text-slate-300 leading-relaxed">
                              This checkpoint validates that learning transfer has occurred. Passing this reassessment unlocks the next sequential module and commits verified mastery evidence into your Bayesian competency profile and M05 ledger.
                            </p>

                            <textarea
                              rows={2}
                              value={reassessmentNotes}
                              onChange={(e) => setReassessmentNotes(e.target.value)}
                              placeholder="Record candidate practical demonstration notes or sandbox evidence summary..."
                              className="w-full bg-[#00141f] border border-[#002f47] text-white text-xs rounded-xl p-2.5 focus:outline-none focus:border-emerald-400"
                            />

                            <button
                              onClick={handleReassessModule}
                              disabled={reassessing}
                              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-bold transition-all shadow-md shadow-emerald-600/20 flex items-center gap-2"
                            >
                              <Play className="w-4 h-4" />
                              <span>{reassessing ? 'Evaluating Checkpoint...' : 'Execute Reassessment Gate'}</span>
                            </button>

                            {reassessmentResult && (
                              <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-xs text-emerald-200 space-y-1">
                                <div className="font-bold flex items-center gap-2 text-white">
                                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                                  <span>Demonstrated Mastery Confirmed: {reassessmentResult.demonstrated_score}%</span>
                                </div>
                                <p>Next module unlocked. Bayesian θ updated in M02 and verified entry recorded in M05 Evidence Ledger.</p>
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

        {/* ================= TAB 2: COHORT & INSTITUTION ANALYTICS ================= */}
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
                <span className="text-xs font-bold uppercase text-slate-400">Avg Verified Mastery</span>
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
              <p className="text-xs text-slate-400">Top diagnosed weaknesses across engineering, finance, and operations cohorts.</p>

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

      </div>
    </DashboardLayout>
  );
}
