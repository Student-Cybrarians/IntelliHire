import { useState, useEffect } from 'react';
import { 
  Brain, FileText, CheckCircle2, AlertTriangle, Sparkles, UserCheck, 
  ShieldCheck, ChevronRight, Layers, Play, Send, Award, Users, 
  HelpCircle, MessageSquare, Star, ArrowRight, RefreshCw, BarChart2
} from 'lucide-react';
import DashboardLayout from './dashboard/DashboardLayout';

interface Protocol {
  id: string;
  title: string;
  target_role: string;
  domain: string;
  interview_type: string;
  seniority_level: string;
  panel_roles: string[];
  competency_targets: Array<{ name: string; description: string; weight: number }>;
  question_sequence: Array<{
    turn: number;
    panel_role: string;
    competency: string;
    question_type: string;
    question: string;
    probe_intent: string;
    anchored_rubric: {
      unsatisfactory: string;
      competent: string;
      exceptional: string;
    };
  }>;
}

export default function Module4Interviews() {
  const [protocols, setProtocols] = useState<Protocol[]>([]);
  const [selectedProtocol, setSelectedProtocol] = useState<Protocol | null>(null);
  const [candidateDossier, setCandidateDossier] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Active interview session state
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [currentTurn, setCurrentTurn] = useState<number>(1);
  const [activePanelRole, setActivePanelRole] = useState<string>('');
  const [currentQuestion, setCurrentQuestion] = useState<any>(null);
  const [candidateResponse, setCandidateResponse] = useState<string>('');
  const [submittingTurn, setSubmittingTurn] = useState<boolean>(false);
  const [transcript, setTranscript] = useState<any[]>([]);

  // Interviewer Evaluation Input (Separate from AI)
  const [humanRating, setHumanRating] = useState<number>(4);
  const [humanNotes, setHumanNotes] = useState<string>('');
  const [savingRating, setSavingRating] = useState<boolean>(false);

  // Post-Interview Synthesis
  const [synthesis, setSynthesis] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'cockpit' | 'dossier' | 'synthesis'>('cockpit');
  const [currentUser, setCurrentUser] = useState<any>(null);

  const loadInitialData = async () => {
    setLoading(true);
    try {
      const [protoRes, candRes, authRes] = await Promise.all([
        fetch('/api/m4/interviews/protocols'),
        fetch('/api/m4/interviews/candidates'),
        fetch('/api/auth/me').catch(() => null)
      ]);
      const protoData = await protoRes.json() as any;
      const candData = await candRes.json() as any;

      if (authRes && authRes.ok) {
        const authData = await authRes.json() as any;
        if (authData.user) {
          setCurrentUser(authData.user);
        }
      }

      if (protoData.success) {
        setProtocols(protoData.protocols || []);
        if (protoData.protocols?.length > 0) {
          setSelectedProtocol(protoData.protocols[0]);
        }
      }
      if (candData.success) {
        setCandidateDossier(candData.candidate);
      }
    } catch (e) {
      console.error('Failed to load M04 data', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInitialData();
  }, []);

  const startInterview = async (protocolToStart = selectedProtocol) => {
    if (!protocolToStart) return;
    setLoading(true);
    setSynthesis(null);
    setTranscript([]);
    try {
      const res = await fetch('/api/m4/interviews/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          protocol_id: protocolToStart.id,
          candidate_user_id: candidateDossier?.id
        })
      });
      const data = await res.json() as any;
      if (data.success) {
        setSessionId(data.session_id);
        setCurrentTurn(data.current_turn || 1);
        setActivePanelRole(data.active_panel_role);
        setCurrentQuestion(data.first_question);
        setCandidateResponse('');
        setHumanRating(4);
        setHumanNotes('');
      }
    } catch (e) {
      alert('Failed to start interview session');
    } finally {
      setLoading(false);
    }
  };

  const submitTurn = async () => {
    if (!sessionId || !currentQuestion || !candidateResponse.trim()) return;
    setSubmittingTurn(true);
    try {
      const res = await fetch(`/api/m4/interviews/sessions/${sessionId}/turn`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          candidate_response: candidateResponse,
          current_question: currentQuestion,
          interviewer_role: activePanelRole
        })
      });
      const data = await res.json() as any;
      if (data.success) {
        setTranscript(prev => [...prev, {
          turn: currentTurn,
          role: activePanelRole,
          question: currentQuestion.question,
          competency: currentQuestion.competency,
          response: candidateResponse,
          evaluation: data.evaluation,
          human_rating: humanRating,
          human_notes: humanNotes
        }]);

        // Automatically save initial human rating
        await fetch(`/api/m4/interviews/sessions/${sessionId}/rate`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            turn_number: currentTurn,
            human_rating: humanRating,
            human_notes: humanNotes
          })
        });

        if (data.next_turn?.next_question) {
          setCurrentTurn(data.next_turn.turn_number);
          setActivePanelRole(data.next_turn.active_panel_role);
          setCurrentQuestion(data.next_turn.next_question);
          setCandidateResponse('');
          setHumanNotes('');
        } else {
          // Reached end of protocol sequence, trigger complete
          await completeInterview();
        }
      }
    } catch (e) {
      alert('Error evaluating turn response');
    } finally {
      setSubmittingTurn(false);
    }
  };

  const completeInterview = async () => {
    if (!sessionId) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/m4/interviews/sessions/${sessionId}/complete`, { method: 'POST' });
      const data = await res.json() as any;
      if (data.success) {
        setSynthesis(data);
        setActiveTab('synthesis');
        setCurrentQuestion(null);
      }
    } catch (e) {
      console.error('Failed to complete interview', e);
    } finally {
      setLoading(false);
    }
  };

  const isCandidateRole = currentUser?.role === 'candidate';
  const roleName = currentUser?.role || 'candidate';
  const userDisplayName = currentUser?.full_name || (isCandidateRole ? 'Candidate' : 'Interview Committee Lead');

  return (
    <DashboardLayout role={roleName} userFullName={userDisplayName}>
      <div className="space-y-8">
        
        {/* Header */}
        <header className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-5 pb-6 border-b border-[#063750]">
          <div>
            <div className="flex items-center gap-2 text-[#FF4103] text-xs font-bold uppercase tracking-wider mb-2">
              <Brain className="w-4 h-4 text-[#FF4103]" />
              <span>{isCandidateRole ? 'Module 4 · HR Round' : 'Module 4 · Universal Professional Interaction & Interview Intelligence'}</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
              {isCandidateRole ? 'HR Round Simulation & Behavioral Interaction' : 'Calibrated Structured Interview Cockpit'}
            </h1>
            <p className="text-slate-300 text-sm mt-1.5 max-w-3xl leading-relaxed">
              {isCandidateRole 
                ? 'Interactive calibrated behavioral interview simulation evaluated against anchored competency rubrics.'
                : 'Consumes candidate evidence packages across M01 (Resume & Claims), M02 (Adaptive Gaps & Misconceptions), and M03 (Work Simulations) to drive panel-coordinated questioning with anchored rubrics and bias-free human evaluation.'}
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            {!sessionId ? (
              <button
                onClick={() => startInterview(selectedProtocol)}
                className="px-5 py-2.5 rounded-xl bg-[#FF4103] hover:bg-[#e03200] text-white text-xs font-bold flex items-center gap-2 shadow-lg shadow-[#FF4103]/20 transition-all"
              >
                <Play className="w-4 h-4" />
                <span>Launch Panel Interview</span>
              </button>
            ) : (
              <button
                onClick={() => { setSessionId(null); setSynthesis(null); }}
                className="px-4 py-2.5 rounded-xl bg-[#001f2e] border border-[#063750] text-slate-300 hover:text-white text-xs font-bold flex items-center gap-2"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Reset Cockpit</span>
              </button>
            )}
          </div>
        </header>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 border-b border-[#063750] pb-2">
          {[
            { id: 'cockpit', label: 'Interviewer Panel Cockpit', icon: Layers },
            { id: 'dossier', label: 'Candidate M01–M03 Evidence Dossier', icon: UserCheck },
            { id: 'synthesis', label: 'M05 Evidence Package Synthesis', icon: Award }
          ].map(tab => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${
                  active 
                    ? 'bg-[#FF4103] text-white shadow-md shadow-[#FF4103]/20' 
                    : 'bg-[#001f2e] border border-[#063750] text-slate-400 hover:text-white'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* TAB 1: INTERVIEWER PANEL COCKPIT */}
        {activeTab === 'cockpit' && (
          <div className="space-y-6">
            {/* Protocol & Candidate Ribbon */}
            <div className="bg-[#001f2e] border border-[#063750] rounded-2xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <span className="text-xs uppercase font-bold text-slate-400">Active Protocol Target</span>
                <div className="flex items-center gap-3 mt-1">
                  <select
                    value={selectedProtocol?.id || ''}
                    onChange={e => {
                      const p = protocols.find(x => x.id === e.target.value);
                      if (p) setSelectedProtocol(p);
                    }}
                    className="bg-[#001824] border border-[#002f47] rounded-xl px-3 py-1.5 text-white text-xs font-bold focus:outline-none focus:border-[#FF4103]"
                  >
                    {protocols.map(p => (
                      <option key={p.id} value={p.id}>
                        {p.title} ({p.target_role})
                      </option>
                    ))}
                  </select>
                  <span className="text-xs text-slate-400">·</span>
                  <span className="text-xs text-emerald-400 font-bold">{selectedProtocol?.domain?.toUpperCase()}</span>
                </div>
              </div>

              {sessionId && (
                <div className="flex items-center gap-4 text-xs font-mono">
                  <div className="p-2 bg-[#001824] rounded-lg border border-[#002f47]">
                    <span className="text-slate-500">Panel Role: </span>
                    <span className="text-white font-bold">{activePanelRole}</span>
                  </div>
                  <div className="p-2 bg-[#001824] rounded-lg border border-[#002f47]">
                    <span className="text-slate-500">Turn: </span>
                    <span className="text-[#FF4103] font-bold">#{currentTurn}</span>
                  </div>
                </div>
              )}
            </div>

            {/* Active Turn Execution Screen */}
            {sessionId && currentQuestion && (
              <div className="grid lg:grid-cols-12 gap-6">
                {/* Left: Coordinated Question & Anchored Rubric */}
                <div className="lg:col-span-6 space-y-4">
                  <div className="bg-[#001f2e] border border-[#063750] rounded-2xl p-6 shadow-lg space-y-4 text-xs">
                    <div className="flex items-center justify-between pb-3 border-b border-[#002a40]">
                      <span className="px-2 py-0.5 rounded bg-[#FF4103]/15 text-[#FF4103] font-bold uppercase tracking-wider">
                        Turn {currentTurn} · {activePanelRole}
                      </span>
                      <span className="text-slate-400 font-mono">Target: {currentQuestion.competency}</span>
                    </div>

                    <div>
                      <span className="text-slate-500 uppercase font-semibold block mb-1">Coordinated Interview Probe</span>
                      <h3 className="text-base font-bold text-white leading-relaxed">
                        "{currentQuestion.question}"
                      </h3>
                      <p className="text-slate-400 mt-1 italic">
                        Probe Intent: {currentQuestion.probe_intent}
                      </p>
                    </div>

                    {/* Anchored Rubric Levels */}
                    <div className="pt-3 border-t border-[#002a40] space-y-2">
                      <span className="text-slate-400 uppercase font-bold block">Calibrated Anchored Rubric</span>
                      
                      <div className="p-2.5 bg-red-950/20 border border-red-500/20 rounded-xl">
                        <span className="text-red-400 font-bold block text-[10px] uppercase">L1 · Unsatisfactory</span>
                        <p className="text-slate-300 mt-0.5">{currentQuestion.anchored_rubric?.unsatisfactory}</p>
                      </div>

                      <div className="p-2.5 bg-blue-950/20 border border-blue-500/20 rounded-xl">
                        <span className="text-blue-400 font-bold block text-[10px] uppercase">L3 · Competent Standard</span>
                        <p className="text-slate-300 mt-0.5">{currentQuestion.anchored_rubric?.competent}</p>
                      </div>

                      <div className="p-2.5 bg-emerald-950/20 border border-emerald-500/20 rounded-xl">
                        <span className="text-emerald-400 font-bold block text-[10px] uppercase">L5 · Exceptional Mastery</span>
                        <p className="text-slate-300 mt-0.5">{currentQuestion.anchored_rubric?.exceptional}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right: Candidate Response & Separate Human Evaluation */}
                <div className="lg:col-span-6 space-y-4">
                  <div className="bg-[#001f2e] border border-[#063750] rounded-2xl p-6 shadow-lg space-y-4 text-xs">
                    <span className="text-slate-400 font-bold uppercase tracking-wider block">
                      Candidate Oral / Stated Response
                    </span>
                    <textarea
                      rows={6}
                      value={candidateResponse}
                      onChange={e => setCandidateResponse(e.target.value)}
                      placeholder="Transcribe candidate's response detailing their methodology, trade-offs, and concrete examples..."
                      className="w-full bg-[#001824] border border-[#002f47] rounded-xl p-3.5 text-white text-xs focus:outline-none focus:border-[#FF4103] leading-relaxed"
                    />

                    {/* Human Assessor Calibrated Rating Interface */}
                    <div className="p-4 bg-[#001621] rounded-xl border border-[#002f47] space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-white uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                          <UserCheck className="w-3.5 h-3.5 text-[#FF4103]" />
                          <span>Human Assessor Rating (Independent from AI)</span>
                        </span>
                        <span className="font-bold text-[#FF4103] text-sm">{humanRating} / 5.0</span>
                      </div>

                      <div className="flex gap-2">
                        {[1, 2, 3, 4, 5].map(star => (
                          <button
                            key={star}
                            onClick={() => setHumanRating(star)}
                            className={`flex-1 py-1.5 rounded-lg font-bold text-xs transition-all ${
                              humanRating >= star 
                                ? 'bg-[#FF4103] text-white shadow-md' 
                                : 'bg-[#001f2e] text-slate-500 hover:text-white'
                            }`}
                          >
                            ★ {star}
                          </button>
                        ))}
                      </div>

                      <input
                        type="text"
                        value={humanNotes}
                        onChange={e => setHumanNotes(e.target.value)}
                        placeholder="Interviewer qualitative notes on candidate rationale..."
                        className="w-full bg-[#00111a] border border-[#00283d] rounded-lg p-2 text-white text-xs focus:outline-none focus:border-[#FF4103]"
                      />
                    </div>

                    <div className="flex justify-end pt-2">
                      <button
                        disabled={submittingTurn || !candidateResponse.trim()}
                        onClick={submitTurn}
                        className="px-5 py-2.5 rounded-xl bg-[#FF4103] hover:bg-[#e03200] disabled:opacity-50 text-white text-xs font-bold flex items-center gap-2 shadow-md shadow-[#FF4103]/20 transition-all"
                      >
                        <Send className="w-3.5 h-3.5" />
                        <span>{submittingTurn ? 'Extracting Evidence & Coordinating Next Turn…' : 'Submit Turn & Advance Panel'}</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Transcript & Evidence Stream */}
            {transcript.length > 0 && (
              <div className="space-y-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Panel Transcript & Evidence Stream ({transcript.length} turns completed)
                </h3>
                {transcript.map((t, idx) => (
                  <div key={idx} className="bg-[#001f2e] border border-[#063750] rounded-2xl p-5 space-y-3 text-xs">
                    <div className="flex items-center justify-between text-slate-400">
                      <span className="font-bold text-[#FF4103]">Turn #{t.turn} · {t.role}</span>
                      <span className="font-mono">Human Rating: {t.human_rating}/5</span>
                    </div>

                    <div className="text-white font-semibold">"{t.question}"</div>
                    
                    <div className="p-3 bg-[#001824] rounded-xl text-slate-300 border border-[#002f47]">
                      <span className="text-slate-500 font-bold block mb-1">Candidate Stated Response:</span>
                      {t.response}
                    </div>

                    {/* AI Evidence Extraction & Probing Recommendation */}
                    {t.evaluation && (
                      <div className="grid md:grid-cols-2 gap-3 pt-2">
                        <div className="p-3 bg-blue-950/20 border border-blue-500/20 rounded-xl space-y-1">
                          <span className="font-bold text-blue-400 text-[10px] uppercase block">Observable Evidence Captured</span>
                          <ul className="text-slate-300 list-disc list-inside space-y-0.5">
                            {t.evaluation.observable_evidence?.map((ev: string, i: number) => (
                              <li key={i}>{ev}</li>
                            ))}
                          </ul>
                        </div>

                        <div className="p-3 bg-indigo-950/20 border border-indigo-500/20 rounded-xl space-y-1">
                          <span className="font-bold text-indigo-400 text-[10px] uppercase block">AI Recommended Probing Challenge</span>
                          <p className="text-indigo-200 italic">"{t.evaluation.ai_recommended_probe}"</p>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: CANDIDATE M01–M03 EVIDENCE DOSSIER */}
        {activeTab === 'dossier' && (
          <div className="space-y-6">
            <div className="grid lg:grid-cols-3 gap-6">
              {/* Profile Card */}
              <div className="bg-[#001f2e] border border-[#063750] rounded-2xl p-6 shadow-lg space-y-3 text-xs">
                <span className="text-slate-400 uppercase font-semibold">Candidate Identity</span>
                <h3 className="text-xl font-bold text-white">{candidateDossier?.name}</h3>
                <div className="text-slate-300 space-y-1 pt-1">
                  <div><span className="text-slate-500">Target Role:</span> {candidateDossier?.target_role}</div>
                  <div><span className="text-slate-500">Domain:</span> {candidateDossier?.domain}</div>
                  <div><span className="text-slate-500">Experience:</span> {candidateDossier?.experience_level?.toUpperCase()}</div>
                  <div><span className="text-slate-500">Verified Readiness:</span> <span className="text-[#FF4103] font-bold">{candidateDossier?.readiness_score}%</span></div>
                </div>
              </div>

              {/* M02 Diagnosed Misconceptions */}
              <div className="bg-[#001f2e] border border-[#063750] rounded-2xl p-6 shadow-lg space-y-3 text-xs lg:col-span-2">
                <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-400" />
                  <span>M02 Diagnosed Cognitive Misconceptions (Pre-Interview Evidence)</span>
                </h3>
                <p className="text-slate-400">
                  These misconceptions were identified during prior adaptive assessments and should be explicitly probed during technical rounds.
                </p>
                <div className="space-y-2 pt-1">
                  {candidateDossier?.m02_diagnosed_misconceptions?.length === 0 ? (
                    <div className="p-3 bg-[#001824] rounded-xl text-slate-400">No unresolved misconceptions recorded.</div>
                  ) : (
                    candidateDossier?.m02_diagnosed_misconceptions?.map((m: string, i: number) => (
                      <div key={i} className="p-3 bg-[#001824] border border-amber-500/20 rounded-xl text-amber-200">
                        {m}
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            {/* M03 Practical Work Simulations Demonstrated */}
            <div className="bg-[#001f2e] border border-[#063750] rounded-2xl p-6 shadow-lg space-y-4">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <Award className="w-4 h-4 text-[#FF4103]" />
                <span>M03 Practical Work Simulations Demonstrated</span>
              </h3>
              <div className="grid md:grid-cols-2 gap-4 text-xs">
                {candidateDossier?.m03_simulations_demonstrated?.length === 0 ? (
                  <div className="p-4 bg-[#001824] rounded-xl text-slate-400 col-span-2">
                    No M03 simulation tasks completed yet.
                  </div>
                ) : (
                  candidateDossier?.m03_simulations_demonstrated?.map((sim: any, i: number) => (
                    <div key={i} className="p-4 bg-[#001824] border border-[#002f47] rounded-xl space-y-2">
                      <div className="flex items-center justify-between font-bold text-white">
                        <span>{sim.title}</span>
                        <span className="text-emerald-400">{sim.score}% Proficiency</span>
                      </div>
                      <div className="text-[11px] text-slate-400 uppercase">{sim.domain} · {sim.type}</div>
                      <div className="pt-2 border-t border-[#002a40] text-slate-300">
                        <span className="text-slate-500 font-semibold block mb-1">Observed Simulation Actions:</span>
                        <ul className="list-disc list-inside space-y-0.5">
                          {sim.evidence?.key_actions_identified?.map((a: string, j: number) => (
                            <li key={j}>{a}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: M05 EVIDENCE PACKAGE SYNTHESIS */}
        {activeTab === 'synthesis' && (
          <div className="space-y-6">
            {!synthesis ? (
              <div className="p-12 text-center bg-[#001f2e] border border-[#063750] rounded-2xl space-y-4">
                <Brain className="w-12 h-12 text-[#FF4103] mx-auto opacity-70" />
                <h3 className="text-lg font-bold text-white">No Completed Interview Synthesis Available</h3>
                <p className="text-xs text-slate-400 max-w-md mx-auto">
                  Launch a panel interview and complete all turns to generate an auditable M05 Evidence Package.
                </p>
                <button
                  onClick={() => { setActiveTab('cockpit'); startInterview(selectedProtocol); }}
                  className="px-5 py-2.5 rounded-xl bg-[#FF4103] hover:bg-[#e03200] text-white text-xs font-bold"
                >
                  Start Structured Interview
                </button>
              </div>
            ) : (
              <div className="bg-[#001f2e] border border-[#FF4103]/40 rounded-2xl p-6 sm:p-7 shadow-lg space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#002a40]">
                  <div>
                    <span className="text-xs font-bold text-[#FF4103] uppercase tracking-wider">Interview Concluded</span>
                    <h2 className="text-2xl font-black text-white mt-1">M05 Calibrated Evidence Package</h2>
                    <p className="text-xs text-slate-400 mt-1">{synthesis.m05_evidence_package?.protocol_title}</p>
                  </div>
                  <div className="text-right">
                    <div className="text-4xl font-black text-white">{synthesis.overall_rating}%</div>
                    <span className="text-[10px] text-emerald-400 uppercase font-bold">Interview Rating</span>
                  </div>
                </div>

                {/* Strengths & Gaps */}
                <div className="grid md:grid-cols-2 gap-4 text-xs">
                  <div className="p-4 bg-emerald-950/20 border border-emerald-500/20 rounded-xl space-y-1">
                    <span className="font-bold text-emerald-400 uppercase tracking-wider text-[10px] block">Observed Core Strengths</span>
                    <ul className="space-y-1 text-slate-300 list-disc list-inside">
                      {synthesis.strengths?.map((s: string, i: number) => (
                        <li key={i}>{s}</li>
                      ))}
                    </ul>
                  </div>

                  <div className="p-4 bg-amber-950/20 border border-amber-500/20 rounded-xl space-y-1">
                    <span className="font-bold text-amber-400 uppercase tracking-wider text-[10px] block">Observed Areas for Refinement</span>
                    <ul className="space-y-1 text-slate-300 list-disc list-inside">
                      {synthesis.gaps?.map((g: string, i: number) => (
                        <li key={i}>{g}</li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Governance Disclaimers */}
                <div className="p-4 bg-[#001420] border border-[#002f47] rounded-xl flex items-start gap-3 text-xs text-slate-300">
                  <ShieldCheck className="w-5 h-5 text-[#FF4103] shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold text-white block mb-0.5">Ethical Governance & Human Decision Support Invariant</span>
                    {synthesis.m05_evidence_package?.governance_notice}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

      </div>
    </DashboardLayout>
  );
}
