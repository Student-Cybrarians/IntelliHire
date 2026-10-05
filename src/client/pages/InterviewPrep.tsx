import { useState, useEffect } from 'react';
import { 
  Brain, Target, Compass, BookOpen, CheckCircle2, AlertTriangle, 
  Sparkles, ArrowRight, RefreshCw, Download, Play, MessageSquare, 
  HelpCircle, ChevronRight, ShieldCheck, Flame, Send, Award, FileText
} from 'lucide-react';
import DashboardLayout from './dashboard/DashboardLayout';

type Tab = 'profile' | 'plan' | 'simulation' | 'readiness';
type SimMode = 'practice' | 'learning' | 'mock' | 'assessment' | 'targeted';

export default function InterviewPrep() {
  const [tab, setTab] = useState<Tab>('profile');
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<any>(null);
  const [plan, setPlan] = useState<any>(null);
  const [readiness, setReadiness] = useState<any>(null);

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
      const [profRes, readRes] = await Promise.all([
        fetch('/api/m2/prep/profile'),
        fetch('/api/m2/prep/readiness')
      ]);
      const profData: any = await profRes.json();
      const readData: any = await readRes.json();
      if (profData.success) {
        setProfile(profData.profile);
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
    } catch (e) {
      console.error('Failed to load prep data', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const startSimulation = async (simMode: SimMode = mode) => {
    setMode(simMode);
    setLoading(true);
    setHistory([]);
    setSessionCompleted(false);
    setDebrief(null);
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
          teaching_payload: data.teaching_payload
        }]);
        setAnswerText('');
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
              Synthesizes real assessment evidence, diagnosed gaps, and misconceptions into an interactive, role-aware interview simulator and personalized study guide.
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
                className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${
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

        {/* Tab 1: Preparation Profile */}
        {tab === 'profile' && (
          <div className="space-y-6">
            <div className="grid lg:grid-cols-3 gap-6">
              {/* Role Context */}
              <div className="bg-[#001f2e] border border-[#063750] rounded-2xl p-6 shadow-lg">
                <span className="text-xs text-slate-400 uppercase font-semibold">Target Context</span>
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

        {/* Tab 2: Evidence-Based Plan */}
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

        {/* Tab 3: Interactive Simulation */}
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
                  The engine will ask targeted, scenario-based interview questions addressing your specific gaps. It evaluates your answers in real time and probes your reasoning.
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
                <div className="flex items-center justify-between pb-3 border-b border-[#002a40]">
                  <div className="flex items-center gap-2 text-xs">
                    <span className="px-2 py-0.5 rounded bg-[#FF4103]/15 text-[#FF4103] font-bold uppercase tracking-wider">
                      Question {currentQuestion.question_number} of {currentQuestion.total_questions}
                    </span>
                    <span className="text-slate-400">·</span>
                    <span className="text-slate-300 font-semibold">{currentQuestion.competency}</span>
                    <span className="text-slate-500">({currentQuestion.skill})</span>
                  </div>
                  <span className="text-xs px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 font-mono">
                    Technique: {currentQuestion.technique}
                  </span>
                </div>

                <div className="space-y-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Interviewer Scenario</span>
                  <h3 className="text-lg font-bold text-white leading-relaxed">
                    "{currentQuestion.question}"
                  </h3>
                  <p className="text-xs text-slate-400 italic">
                    Evaluation focus: {currentQuestion.evaluation_criteria}
                  </p>
                </div>

                <div className="space-y-3 pt-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    Your Stated Response (Think Aloud, Defend, or Trade-off Justification)
                  </label>
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
                      <span>{submitting ? 'Evaluating with Teaching Engine…' : 'Submit Response'}</span>
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

                    {/* Evaluator Reaction */}
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

        {/* Tab 4: Readiness Synthesis */}
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
      </div>
    </DashboardLayout>
  );
}
