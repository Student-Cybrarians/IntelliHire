import { useState, useEffect } from 'react';
import { 
  Brain, FileText, CheckCircle2, AlertTriangle, Sparkles, UserCheck, 
  ShieldCheck, ChevronRight, Layers, Play, Send, Award, Users, 
  HelpCircle, MessageSquare, Star, ArrowRight, RefreshCw, BarChart2,
  Video, Eye, Mic, Clock, Check, Target, Compass, BookOpen
} from 'lucide-react';
import DashboardLayout from './dashboard/DashboardLayout';
import ModuleNavigationFooter from '../components/ModuleNavigationFooter';
import InterviewCameraPreview from '../components/m4/InterviewCameraPreview';

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
  const [totalQuestions, setTotalQuestions] = useState<number>(10);
  const [activePanelRole, setActivePanelRole] = useState<string>('');
  const [currentQuestion, setCurrentQuestion] = useState<any>(null);
  const [candidateResponse, setCandidateResponse] = useState<string>('');
  const [submittingTurn, setSubmittingTurn] = useState<boolean>(false);
  const [transcript, setTranscript] = useState<any[]>([]);
  const [activePlan, setActivePlan] = useState<any>(null);
  const [cameraActive, setCameraActive] = useState<boolean>(false);
  const [turnError, setTurnError] = useState<string | null>(null);

  // Phase 2 Coaching & Retry State
  const [activeCoaching, setActiveCoaching] = useState<any>(null);
  const [activeEvaluation, setActiveEvaluation] = useState<any>(null);
  const [retryComparison, setRetryComparison] = useState<any>(null);
  const [turnAttempts, setTurnAttempts] = useState<any[]>([]);
  const [isRetrying, setIsRetrying] = useState<boolean>(false);
  const [retryResponse, setRetryResponse] = useState<string>('');
  const [submittingRetry, setSubmittingRetry] = useState<boolean>(false);
  const [advancingTurn, setAdvancingTurn] = useState<boolean>(false);
  const [pendingAdvance, setPendingAdvance] = useState<boolean>(false);
  const [activeCoachingTab, setActiveCoachingTab] = useState<'feedback' | 'blueprint' | 'model'>('feedback');

  // Phase 3 Adaptive Follow-Up & Dynamic Probing State
  const [activeFollowUp, setActiveFollowUp] = useState<any>(null);
  const [followUpResponse, setFollowUpResponse] = useState<string>('');
  const [submittingFollowUp, setSubmittingFollowUp] = useState<boolean>(false);
  const [skippingFollowUp, setSkippingFollowUp] = useState<boolean>(false);
  const [followUpsHistory, setFollowUpsHistory] = useState<any[]>([]);
  const [followUpDecision, setFollowUpDecision] = useState<any>(null);

  // Interviewer Evaluation Input (Separate from AI)
  const [humanRating, setHumanRating] = useState<number>(4);
  const [humanNotes, setHumanNotes] = useState<string>('');

  // Post-Interview Synthesis
  const [synthesis, setSynthesis] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'cockpit' | 'dossier' | 'synthesis'>('cockpit');
  const [currentUser, setCurrentUser] = useState<any>(null);

  const loadInitialData = async () => {
    setLoading(true);
    try {
      const [protoRes, candRes, authRes, activeRes] = await Promise.all([
        fetch('/api/m4/interviews/protocols').catch(() => null),
        fetch('/api/m4/interviews/candidates').catch(() => null),
        fetch('/api/auth/me').catch(() => null),
        fetch('/api/m4/interviews/sessions/active').catch(() => null)
      ]);

      if (authRes && authRes.ok) {
        const authData = await authRes.json() as any;
        if (authData.user) {
          setCurrentUser(authData.user);
        }
      }

      if (protoRes && protoRes.ok) {
        const protoData = await protoRes.json() as any;
        if (protoData.success) {
          setProtocols(protoData.protocols || []);
          if (protoData.protocols?.length > 0) {
            setSelectedProtocol(protoData.protocols[0]);
          }
        }
      }

      if (candRes && candRes.ok) {
        const candData = await candRes.json() as any;
        if (candData.success) {
          setCandidateDossier(candData.candidate);
        }
      }

      // Check active in-progress session for refresh persistence
      if (activeRes && activeRes.ok) {
        const activeData = await activeRes.json() as any;
        if (activeData.success && activeData.active_session) {
          const act = activeData.active_session;
          setSessionId(act.id);
          setCurrentTurn(act.current_turn || 1);
          setTotalQuestions(act.total_questions || 10);
          setActivePanelRole(act.active_panel_role);
          setCurrentQuestion(act.active_question);
          setActivePlan(act.plan || null);
          setPendingAdvance(Boolean(act.pending_advance));

          setActiveFollowUp(act.active_follow_up || null);
          setFollowUpsHistory(act.active_turn_follow_ups || []);
          setFollowUpDecision(act.active_turn_follow_up_decision || null);

          if (act.active_turn_observation?.candidate_response) {
            setCandidateResponse(act.active_turn_observation.candidate_response);
          }

          if (act.active_turn_coaching) {
            setActiveCoaching(act.active_turn_coaching);
            setActiveEvaluation({
              score: act.active_turn_score,
              observable_evidence: act.active_turn_observation?.observable_evidence || [],
              ai_recommended_probe: act.active_turn_observation?.ai_recommended_probe || ''
            });
            setRetryComparison(act.active_turn_retry_comparison || null);
            setTurnAttempts(act.active_turn_attempts || []);
          }

          setTranscript((act.observations || []).map((o: any) => ({
            turn: o.turn_number,
            role: o.interviewer_role,
            question: o.question,
            response: o.candidate_response,
            evaluation: o.rubric_evaluation,
            coaching: o.coaching,
            retry_comparison: o.retry_comparison,
            attempts: o.attempts,
            active_follow_up: o.active_follow_up,
            follow_ups: o.follow_ups,
            follow_up_decision: o.follow_up_decision,
            human_rating: o.human_rating,
            human_notes: o.human_notes
          })));
        }
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

  const startInterview = async (protocolToStart = selectedProtocol, personalized = false) => {
    setLoading(true);
    setSynthesis(null);
    setTranscript([]);
    setTurnError(null);
    setActiveCoaching(null);
    setActiveEvaluation(null);
    setRetryComparison(null);
    setTurnAttempts([]);
    setPendingAdvance(false);
    setIsRetrying(false);
    setActiveFollowUp(null);
    setFollowUpResponse('');
    setFollowUpsHistory([]);
    setFollowUpDecision(null);
    try {
      const res = await fetch('/api/m4/interviews/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          personalized: personalized || (isCandidateRole && !protocolToStart),
          protocol_id: protocolToStart?.id,
          candidate_user_id: candidateDossier?.id,
          camera_enabled: cameraActive
        })
      });
      const data = await res.json() as any;
      if (data.success) {
        setSessionId(data.session_id);
        setCurrentTurn(data.current_turn || 1);
        setTotalQuestions(data.total_questions || data.protocol?.question_sequence?.length || 10);
        setActivePanelRole(data.active_panel_role);
        setCurrentQuestion(data.first_question);
        setActivePlan(data.plan || null);
        setCandidateResponse('');
        setHumanRating(4);
        setHumanNotes('');
      } else {
        alert('Failed to initialize interview session');
      }
    } catch (e) {
      alert('Failed to start interview session');
    } finally {
      setLoading(false);
    }
  };

  const submitTurn = async () => {
    if (!sessionId || !currentQuestion || !candidateResponse.trim() || submittingTurn) return;
    setSubmittingTurn(true);
    setTurnError(null);
    try {
      const res = await fetch(`/api/m4/interviews/sessions/${sessionId}/turn`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          turn_number: currentTurn,
          candidate_response: candidateResponse,
          current_question: currentQuestion,
          interviewer_role: activePanelRole,
          auto_advance: false
        })
      });
      const data = await res.json() as any;
      if (data.success) {
        setActiveEvaluation(data.evaluation);
        setTurnAttempts(data.attempts || []);
        setRetryComparison(null);
        setIsRetrying(false);

        const incomingFollowUp = data.follow_up || data.active_follow_up;
        if (data.follow_up_required && incomingFollowUp) {
          setActiveFollowUp(incomingFollowUp);
          setFollowUpsHistory(data.follow_ups || [incomingFollowUp]);
          setFollowUpDecision(data.follow_up_decision || null);
          setFollowUpResponse('');
          setPendingAdvance(false);
          setActiveCoaching(null);
        } else {
          setActiveFollowUp(null);
          setFollowUpsHistory(data.follow_ups || []);
          setFollowUpDecision(data.follow_up_decision || null);
          setActiveCoaching(data.coaching);
          setPendingAdvance(true);
        }

        // Update transcript
        setTranscript(prev => {
          const filtered = prev.filter(t => t.turn !== currentTurn);
          return [...filtered, {
            turn: currentTurn,
            role: activePanelRole,
            question: currentQuestion.question,
            competency: currentQuestion.competency,
            response: candidateResponse,
            evaluation: data.evaluation,
            coaching: data.coaching,
            attempts: data.attempts || [],
            active_follow_up: data.follow_up || null,
            follow_ups: data.follow_ups || [],
            follow_up_decision: data.follow_up_decision || null,
            human_rating: humanRating,
            human_notes: humanNotes
          }];
        });

        // Automatically save initial human rating if in recruiter cockpit
        if (!isCandidateRole) {
          await fetch(`/api/m4/interviews/sessions/${sessionId}/rate`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              turn_number: currentTurn,
              human_rating: humanRating,
              human_notes: humanNotes
            })
          }).catch(() => {});

          if (data.is_complete || !data.next_turn?.next_question) {
            if (data.synthesis) {
              setSynthesis(data.synthesis);
              setActiveTab('synthesis');
              setCurrentQuestion(null);
            } else {
              await completeInterview();
            }
          } else {
            setCurrentTurn(data.next_turn.turn_number);
            setActivePanelRole(data.next_turn.active_panel_role);
            setCurrentQuestion(data.next_turn.next_question);
            setCandidateResponse('');
            setHumanNotes('');
          }
        }
      } else if (data.duplicate) {
        setTurnError('This question turn has already been recorded.');
      } else {
        setTurnError(data.error || 'Failed to submit response');
      }
    } catch (e) {
      setTurnError('Network error submitting turn response');
    } finally {
      setSubmittingTurn(false);
    }
  };

  const submitFollowUpResponse = async () => {
    if (!sessionId || !activeFollowUp || !followUpResponse.trim() || submittingFollowUp) return;
    setSubmittingFollowUp(true);
    setTurnError(null);
    try {
      const res = await fetch(`/api/m4/interviews/sessions/${sessionId}/follow-up`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          turn_number: currentTurn,
          follow_up_response: followUpResponse
        })
      });
      const data = await res.json() as any;
      if (data.success) {
        if (data.follow_up_required && data.follow_up) {
          // Second subordinate follow-up probe
          setActiveFollowUp(data.follow_up);
          setFollowUpsHistory(data.follow_ups || []);
          setFollowUpDecision(data.follow_up_decision || null);
          setFollowUpResponse('');
          setPendingAdvance(false);
        } else {
          // Probing completed
          setActiveFollowUp(null);
          setFollowUpsHistory(data.follow_ups || []);
          setActiveCoaching(data.coaching);
          if (data.evaluation) setActiveEvaluation(data.evaluation);
          setPendingAdvance(true);
        }

        // Update transcript entry with follow-ups
        setTranscript(prev => {
          const filtered = prev.filter(t => t.turn !== currentTurn);
          return [...filtered, {
            turn: currentTurn,
            role: activePanelRole,
            question: currentQuestion.question,
            competency: currentQuestion.competency,
            response: candidateResponse,
            evaluation: data.evaluation || activeEvaluation,
            coaching: data.coaching || activeCoaching,
            attempts: turnAttempts,
            follow_ups: data.follow_ups || followUpsHistory,
            human_rating: humanRating,
            human_notes: humanNotes
          }];
        });
      } else {
        setTurnError(data.error || 'Failed to submit follow-up response');
      }
    } catch (e) {
      setTurnError('Network error submitting follow-up response');
    } finally {
      setSubmittingFollowUp(false);
    }
  };

  const skipFollowUp = async () => {
    if (!sessionId || !activeFollowUp || skippingFollowUp) return;
    setSkippingFollowUp(true);
    setTurnError(null);
    try {
      const res = await fetch(`/api/m4/interviews/sessions/${sessionId}/follow-up`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          turn_number: currentTurn,
          skipped: true
        })
      });
      const data = await res.json() as any;
      if (data.success) {
        setActiveFollowUp(null);
        setFollowUpsHistory(data.follow_ups || []);
        setActiveCoaching(data.coaching);
        setPendingAdvance(true);

        setTranscript(prev => {
          const filtered = prev.filter(t => t.turn !== currentTurn);
          return [...filtered, {
            turn: currentTurn,
            role: activePanelRole,
            question: currentQuestion.question,
            competency: currentQuestion.competency,
            response: candidateResponse,
            evaluation: activeEvaluation,
            coaching: data.coaching,
            attempts: turnAttempts,
            follow_ups: data.follow_ups || followUpsHistory,
            human_rating: humanRating,
            human_notes: humanNotes
          }];
        });
      } else {
        setTurnError(data.error || 'Failed to skip follow-up probe');
      }
    } catch (e) {
      setTurnError('Network error skipping follow-up probe');
    } finally {
      setSkippingFollowUp(false);
    }
  };

  const submitRetry = async () => {
    if (!sessionId || !currentQuestion || !retryResponse.trim() || submittingRetry) return;
    setSubmittingRetry(true);
    setTurnError(null);
    try {
      const res = await fetch(`/api/m4/interviews/sessions/${sessionId}/retry`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          turn_number: currentTurn,
          candidate_response: retryResponse,
          current_question: currentQuestion,
          interviewer_role: activePanelRole
        })
      });
      const data = await res.json() as any;
      if (data.success) {
        setActiveEvaluation(data.evaluation);
        setActiveCoaching(data.coaching);
        setRetryComparison(data.retry_comparison);
        setTurnAttempts(data.attempts || []);
        setCandidateResponse(retryResponse);
        setIsRetrying(false);

        // Update transcript entry
        setTranscript(prev => {
          const filtered = prev.filter(t => t.turn !== currentTurn);
          return [...filtered, {
            turn: currentTurn,
            role: activePanelRole,
            question: currentQuestion.question,
            competency: currentQuestion.competency,
            response: retryResponse,
            evaluation: data.evaluation,
            coaching: data.coaching,
            retry_comparison: data.retry_comparison,
            attempts: data.attempts || [],
            human_rating: humanRating,
            human_notes: humanNotes
          }];
        });
      } else {
        setTurnError(data.error || 'Failed to submit revised answer');
      }
    } catch (e) {
      setTurnError('Network error submitting retry');
    } finally {
      setSubmittingRetry(false);
    }
  };

  const advanceToNextTurn = async () => {
    if (!sessionId || advancingTurn) return;
    setAdvancingTurn(true);
    setTurnError(null);
    try {
      const res = await fetch(`/api/m4/interviews/sessions/${sessionId}/advance`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ current_turn: currentTurn })
      });
      const data = await res.json() as any;
      if (data.success) {
        if (data.is_complete || !data.next_turn?.next_question) {
          await completeInterview();
        } else {
          setCurrentTurn(data.next_turn.turn_number);
          setActivePanelRole(data.next_turn.active_panel_role);
          setCurrentQuestion(data.next_turn.next_question);
          setCandidateResponse('');
          setRetryResponse('');
          setActiveCoaching(null);
          setActiveEvaluation(null);
          setRetryComparison(null);
          setTurnAttempts([]);
          setPendingAdvance(false);
          setIsRetrying(false);
          setActiveFollowUp(null);
          setFollowUpResponse('');
          setFollowUpsHistory([]);
          setFollowUpDecision(null);
          setHumanNotes('');
        }
      } else {
        setTurnError(data.error || 'Failed to advance to next question');
      }
    } catch (e) {
      setTurnError('Network error advancing question turn');
    } finally {
      setAdvancingTurn(false);
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
                ? 'Personalized 10-question sequential interview simulation grounded in your profile and evaluated against anchored competency rubrics.'
                : 'Consumes candidate evidence packages across M01 (Resume & Claims), M02 (Adaptive Gaps & Misconceptions), and M03 (Work Simulations) to drive panel-coordinated questioning with anchored rubrics and bias-free human evaluation.'}
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            {!sessionId ? (
              <button
                onClick={() => startInterview(selectedProtocol, isCandidateRole)}
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
            { id: 'cockpit', label: isCandidateRole ? '10-Question Interview Session' : 'Interviewer Panel Cockpit', icon: Layers },
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

        {/* TAB 1: INTERVIEWER PANEL COCKPIT / CANDIDATE INTERVIEW EXPERIENCE */}
        {activeTab === 'cockpit' && (
          <div className="space-y-6">
            
            {/* Active Protocol Ribbon & Context */}
            <div className="bg-[#001f2e] border border-[#063750] rounded-2xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <span className="text-xs uppercase font-bold text-slate-400">Target Role & Interview Protocol</span>
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
                    <span className="text-[#FF4103] font-bold">#{currentTurn} of {totalQuestions || 10}</span>
                  </div>
                </div>
              )}
            </div>

            {/* PRE-SESSION BRIEFING: When no interview is actively running */}
            {!sessionId && (
              <div className="grid lg:grid-cols-12 gap-6">
                {/* Left: 10-Question Sequential Interview Blueprint */}
                <div className="lg:col-span-7 space-y-4">
                  <div className="bg-[#001f2e] border border-[#063750] rounded-2xl p-6 shadow-lg space-y-4">
                    <div className="flex items-center justify-between pb-3 border-b border-[#002a40]">
                      <div className="flex items-center gap-2">
                        <Compass className="w-4 h-4 text-[#FF4103]" />
                        <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                          10-Question Sequential Interview Structure
                        </h3>
                      </div>
                      <span className="px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-400 text-[10px] font-bold">
                        ONE QUESTION AT A TIME
                      </span>
                    </div>

                    <p className="text-xs text-slate-300 leading-relaxed">
                      Your personalized interview covers 10 sequential rounds designed to assess holistic professional maturity without hallucinating candidate history. Each question is asked one at a time, recorded, and evaluated against calibrated anchored rubrics.
                    </p>

                    <div className="grid sm:grid-cols-2 gap-2.5 pt-2 text-xs">
                      {[
                        { num: '01', title: 'Professional Narrative', cat: 'Communication' },
                        { num: '02', title: 'Deep Technical Execution', cat: 'Role Competency' },
                        { num: '03', title: 'Conflict & Stakeholder Alignment', cat: 'Behavioral STAR' },
                        { num: '04', title: 'Judgment Under Ambiguity', cat: 'Professional Judgment' },
                        { num: '05', title: 'Failure Recovery & Resilience', cat: 'Situational' },
                        { num: '06', title: 'Cross-Functional Translation', cat: 'Communication' },
                        { num: '07', title: 'Quality Standards & Hygiene', cat: 'Role Competency' },
                        { num: '08', title: 'Ethical Governance & Integrity', cat: 'Professional Judgment' },
                        { num: '09', title: 'Prioritization Under Crunch', cat: 'Situational' },
                        { num: '10', title: 'Continuous Growth & Learning', cat: 'Behavioral' }
                      ].map(step => (
                        <div key={step.num} className="p-2.5 bg-[#001824] border border-[#002f47] rounded-xl flex items-center gap-2.5">
                          <span className="w-6 h-6 rounded-md bg-[#FF4103]/15 text-[#FF4103] font-mono text-[11px] font-bold flex items-center justify-center shrink-0">
                            {step.num}
                          </span>
                          <div className="min-w-0">
                            <span className="text-white font-semibold block text-[11px] truncate">{step.title}</span>
                            <span className="text-[10px] text-slate-400 block">{step.cat}</span>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="pt-4 border-t border-[#002a40] flex items-center justify-between">
                      <div className="flex items-center gap-2 text-[11px] text-slate-400">
                        <Clock className="w-3.5 h-3.5 text-slate-500" />
                        <span>Estimated duration: 25–35 minutes</span>
                      </div>
                      <button
                        onClick={() => startInterview(selectedProtocol, isCandidateRole)}
                        className="px-5 py-2.5 rounded-xl bg-[#FF4103] hover:bg-[#e03200] text-white text-xs font-bold flex items-center gap-2 shadow-lg shadow-[#FF4103]/20 transition-all"
                      >
                        <Play className="w-4 h-4" />
                        <span>Begin 10-Question Personalized Interview</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Right: Camera & Hardware Readiness Check */}
                <div className="lg:col-span-5 space-y-4">
                  <InterviewCameraPreview 
                    compact={false}
                    onCameraStateChange={(active) => setCameraActive(active)}
                  />
                </div>
              </div>
            )}

            {/* ACTIVE TURN EXECUTION: When session is in progress */}
            {sessionId && currentQuestion && (
              <div className="space-y-6">
                
                {/* 10-Question Progress Ribbon */}
                <div className="bg-[#001824] border border-[#063750] rounded-2xl p-4 space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-[#FF4103]/20 border border-[#FF4103]/40 flex items-center justify-center text-[#FF4103] font-black text-sm">
                        {currentTurn}
                      </div>
                      <div>
                        <h4 className="text-white text-xs font-bold tracking-tight">
                          Question {currentTurn} of {totalQuestions || 10}
                        </h4>
                        <p className="text-[11px] text-slate-400">
                          Target Competency: <span className="text-slate-200 font-semibold">{currentQuestion.competency}</span>
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-[#002f47] text-slate-300 border border-[#004163]">
                        {activePanelRole}
                      </span>
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-[#FF4103]/15 text-[#FF4103] border border-[#FF4103]/30 uppercase">
                        {currentQuestion.category || currentQuestion.question_type || 'Behavioral'}
                      </span>
                    </div>
                  </div>

                  {/* 10-Step Progress Bar */}
                  <div className="grid grid-cols-10 gap-1.5 pt-1">
                    {Array.from({ length: totalQuestions || 10 }).map((_, idx) => {
                      const stepNum = idx + 1;
                      const isDone = stepNum < currentTurn;
                      const isCurrent = stepNum === currentTurn;
                      return (
                        <div key={idx} className="flex flex-col items-center gap-1">
                          <div
                            className={`h-2 w-full rounded-full transition-all ${
                              isDone
                                ? 'bg-emerald-500 shadow-sm shadow-emerald-500/30'
                                : isCurrent
                                ? 'bg-[#FF4103] ring-2 ring-[#FF4103]/40'
                                : 'bg-[#00283c]'
                            }`}
                          />
                          <span className={`text-[9px] font-mono ${isCurrent ? 'text-[#FF4103] font-bold' : isDone ? 'text-emerald-400' : 'text-slate-500'}`}>
                            Q{stepNum}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Two-Column Work Surface */}
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

                  {/* Right: Camera Preview & Candidate Stated Response */}
                  <div className="lg:col-span-6 space-y-4">
                    {/* Embedded Optional Camera Preview */}
                    <InterviewCameraPreview 
                      compact={true} 
                      onCameraStateChange={(active) => setCameraActive(active)} 
                    />

                    {/* ADAPTIVE FOLLOW-UP PROBE CARD (Phase 3) */}
                    {activeFollowUp && !isRetrying ? (
                      <div className="bg-[#001f2e] border border-amber-500/40 rounded-2xl p-6 shadow-xl space-y-4 text-xs animate-in fade-in duration-200">
                        {/* Header */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-[#002a40] gap-2">
                          <div className="flex items-center gap-2">
                            <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse" />
                            <span className="text-amber-400 font-bold uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                              <span>Adaptive Follow-Up Probe ({activeFollowUp.follow_up_number} of 2)</span>
                            </span>
                          </div>
                          <span className="px-2.5 py-0.5 rounded-full bg-[#001824] text-slate-300 font-mono text-[10px] border border-[#002f47]">
                            Subordinate to Q{currentTurn} of {totalQuestions}
                          </span>
                        </div>

                        {/* Candidate's Original Answer Context */}
                        <div className="p-3 bg-[#001824] border border-[#002f47] rounded-xl space-y-1">
                          <span className="text-[10px] uppercase font-bold text-slate-400 block">Your Initial Answer:</span>
                          <p className="text-slate-300 text-xs italic line-clamp-3">
                            "{candidateResponse}"
                          </p>
                        </div>

                        {/* Follow-up Question Callout */}
                        <div className="p-4 bg-amber-950/20 border border-amber-500/30 rounded-xl space-y-2">
                          <div className="flex items-center gap-2 text-amber-300 font-bold text-[11px]">
                            <MessageSquare className="w-4 h-4 text-amber-400 shrink-0" />
                            <span>Interviewer Targeted Follow-Up Probe:</span>
                          </div>
                          <p className="text-white text-sm font-semibold leading-relaxed">
                            "{activeFollowUp.question}"
                          </p>
                          <div className="pt-2 border-t border-amber-500/20 flex flex-wrap items-center gap-3 text-[11px]">
                            <span className="text-amber-200/90">
                              <span className="font-bold text-amber-400">Practice Goal:</span> {activeFollowUp.practice_objective}
                            </span>
                            <span className="text-slate-400">
                              <span className="font-bold text-slate-300">Targeted Criterion:</span> {activeFollowUp.targeted_criterion}
                            </span>
                          </div>
                        </div>

                        {/* Follow-up Response Textarea */}
                        <div className="space-y-1">
                          <div className="flex items-center justify-between text-slate-400 text-[11px]">
                            <span>Your Follow-Up Response:</span>
                            <span>{followUpResponse.trim().split(/\s+/).filter(Boolean).length} words</span>
                          </div>
                          <textarea
                            rows={5}
                            value={followUpResponse}
                            onChange={e => setFollowUpResponse(e.target.value)}
                            disabled={submittingFollowUp || skippingFollowUp}
                            placeholder="Address this specific probe with concrete operational actions, quantifiable metrics, or architectural trade-offs..."
                            className="w-full bg-[#001824] border border-[#002f47] rounded-xl p-3.5 text-white text-xs focus:outline-none focus:border-amber-400 leading-relaxed disabled:opacity-50"
                          />
                        </div>

                        {turnError && (
                          <div className="p-2.5 bg-red-950/30 border border-red-500/30 rounded-xl text-red-300 text-xs">
                            {turnError}
                          </div>
                        )}

                        {/* Action Buttons */}
                        <div className="flex flex-col sm:flex-row items-center justify-between pt-2 gap-3">
                          <button
                            type="button"
                            disabled={submittingFollowUp || skippingFollowUp}
                            onClick={skipFollowUp}
                            className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-[#001824] hover:bg-[#00283d] text-slate-300 hover:text-white border border-[#002f47] text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
                          >
                            <span>{skippingFollowUp ? 'Skipping…' : 'Skip Follow-Up & View Coaching →'}</span>
                          </button>

                          <button
                            type="button"
                            disabled={submittingFollowUp || skippingFollowUp || !followUpResponse.trim()}
                            onClick={submitFollowUpResponse}
                            className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-slate-950 text-xs font-bold flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 transition-all"
                          >
                            <Send className="w-3.5 h-3.5" />
                            <span>{submittingFollowUp ? 'Evaluating Follow-Up…' : 'Submit Follow-Up Response'}</span>
                          </button>
                        </div>
                      </div>
                    ) : pendingAdvance && activeCoaching && !isRetrying ? (
                      <div className="bg-[#001f2e] border border-[#063750] rounded-2xl p-6 shadow-lg space-y-4 text-xs">
                        {/* Header Ribbon with Score & Attempt Count */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-[#002a40] gap-2">
                          <div className="flex items-center gap-2">
                            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                            <span className="text-white font-bold uppercase tracking-wider text-[11px]">
                              Answer Coaching & Presentation Guidance
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            {activeEvaluation?.score !== undefined && (
                              <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 font-bold border border-emerald-500/30 text-[11px]">
                                Score: {activeEvaluation.score}%
                              </span>
                            )}
                            <span className="px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 font-mono text-[10px] border border-slate-700">
                              Attempt {turnAttempts.length || 1}
                            </span>
                          </div>
                        </div>

                        {/* Retry Comparison Delta Banner if present */}
                        {retryComparison && (
                          <div className="p-3 bg-emerald-950/25 border border-emerald-500/30 rounded-xl space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="font-bold text-emerald-400 uppercase tracking-wider text-[10px] flex items-center gap-1.5">
                                <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                                <span>Revised Attempt Delta</span>
                              </span>
                              <span className={`font-black text-xs ${retryComparison.score_delta >= 0 ? 'text-emerald-400' : 'text-amber-400'}`}>
                                {retryComparison.previous_score}% → {retryComparison.current_score}% ({retryComparison.score_delta >= 0 ? '+' : ''}{retryComparison.score_delta}%)
                              </span>
                            </div>
                            <p className="text-slate-200 text-xs italic">
                              "{retryComparison.delta_summary}"
                            </p>
                            {retryComparison.improvements_noted?.length > 0 && (
                              <div className="space-y-1 pt-1">
                                <span className="text-[10px] uppercase font-bold text-emerald-400 block">Observed Improvements:</span>
                                <ul className="list-disc list-inside text-slate-300 text-[11px] space-y-0.5">
                                  {retryComparison.improvements_noted.map((imp: string, i: number) => (
                                    <li key={i}>{imp}</li>
                                  ))}
                                </ul>
                              </div>
                            )}
                            {retryComparison.remaining_gaps?.length > 0 && (
                              <div className="space-y-1 pt-1">
                                <span className="text-[10px] uppercase font-bold text-amber-400 block">Remaining Gaps:</span>
                                <ul className="list-disc list-inside text-slate-300 text-[11px] space-y-0.5">
                                  {retryComparison.remaining_gaps.map((gap: string, i: number) => (
                                    <li key={i}>{gap}</li>
                                  ))}
                                </ul>
                              </div>
                            )}
                          </div>
                        )}

                        {/* Coaching Section Navigation Tabs */}
                        <div className="flex gap-2 border-b border-[#002a40] pb-2">
                          {[
                            { id: 'feedback', label: 'Diagnostic Coaching', icon: Sparkles },
                            { id: 'blueprint', label: `Structure Blueprint (${activeCoaching.suggested_structure_type})`, icon: Layers },
                            { id: 'model', label: 'Model Improved Answer', icon: BookOpen }
                          ].map(tab => {
                            const Icon = tab.icon;
                            const active = activeCoachingTab === tab.id;
                            return (
                              <button
                                key={tab.id}
                                type="button"
                                onClick={() => setActiveCoachingTab(tab.id as any)}
                                className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all ${
                                  active 
                                    ? 'bg-[#FF4103] text-white shadow-sm' 
                                    : 'bg-[#001824] text-slate-400 hover:text-white border border-[#002f47]'
                                }`}
                              >
                                <Icon className="w-3.5 h-3.5" />
                                <span>{tab.label}</span>
                              </button>
                            );
                          })}
                        </div>

                        {/* TAB 1: DIAGNOSTIC COACHING */}
                        {activeCoachingTab === 'feedback' && (
                          <div className="space-y-3.5">
                            {/* What Worked */}
                            <div className="p-3 bg-emerald-950/20 border border-emerald-500/25 rounded-xl space-y-1.5">
                              <span className="text-emerald-400 font-bold uppercase tracking-wider text-[10px] flex items-center gap-1.5">
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                                <span>What Worked in Your Response</span>
                              </span>
                              <ul className="list-disc list-inside text-slate-200 text-xs space-y-1">
                                {activeCoaching.what_worked?.map((w: string, i: number) => (
                                  <li key={i}>{w}</li>
                                ))}
                              </ul>
                            </div>

                            {/* What to Improve */}
                            <div className="p-3 bg-amber-950/20 border border-amber-500/25 rounded-xl space-y-1.5">
                              <span className="text-amber-400 font-bold uppercase tracking-wider text-[10px] flex items-center gap-1.5">
                                <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                                <span>What to Improve</span>
                              </span>
                              <ul className="list-disc list-inside text-slate-200 text-xs space-y-1">
                                {activeCoaching.what_to_improve?.map((w: string, i: number) => (
                                  <li key={i}>{w}</li>
                                ))}
                              </ul>
                            </div>

                            {/* Why It Matters */}
                            <div className="p-3 bg-blue-950/20 border border-blue-500/25 rounded-xl space-y-1">
                              <span className="text-blue-400 font-bold uppercase tracking-wider text-[10px] flex items-center gap-1.5">
                                <HelpCircle className="w-3.5 h-3.5 text-blue-400" />
                                <span>Why This Competency Matters</span>
                              </span>
                              <p className="text-slate-300 text-xs leading-relaxed">{activeCoaching.why_it_matters}</p>
                            </div>

                            {/* How to Improve */}
                            <div className="p-3 bg-purple-950/20 border border-purple-500/25 rounded-xl space-y-1">
                              <span className="text-purple-400 font-bold uppercase tracking-wider text-[10px] flex items-center gap-1.5">
                                <Target className="w-3.5 h-3.5 text-purple-400" />
                                <span>How to Elevate Your Response</span>
                              </span>
                              <p className="text-slate-300 text-xs leading-relaxed">{activeCoaching.how_to_improve}</p>
                            </div>

                            {/* Adaptive Follow-up Probe Evidence Consolidated */}
                            {followUpsHistory.length > 0 && (
                              <div className="p-3 bg-amber-950/20 border border-amber-500/25 rounded-xl space-y-2">
                                <span className="text-amber-400 font-bold uppercase tracking-wider text-[10px] flex items-center gap-1.5">
                                  <MessageSquare className="w-3.5 h-3.5 text-amber-400" />
                                  <span>Adaptive Probing Evidence Consolidated</span>
                                </span>
                                <div className="space-y-1.5">
                                  {followUpsHistory.map((fu: any, i: number) => (
                                    <div key={i} className="p-2 bg-[#001824] rounded-lg border border-[#002f47] text-[11px] space-y-0.5">
                                      <div className="flex items-center justify-between">
                                        <span className="font-semibold text-amber-300">Probe #{fu.follow_up_number}: {fu.targeted_criterion}</span>
                                        <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${fu.skipped ? 'bg-slate-800 text-slate-400' : 'bg-emerald-500/15 text-emerald-400'}`}>
                                          {fu.skipped ? 'Skipped' : 'Answered (+8% Impact)'}
                                        </span>
                                      </div>
                                      <p className="text-slate-400 italic">"{fu.question}"</p>
                                      {fu.candidate_response && (
                                        <p className="text-slate-200">Clarification: "{fu.candidate_response}"</p>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        )}

                        {/* TAB 2: STRUCTURE BLUEPRINT */}
                        {activeCoachingTab === 'blueprint' && (
                          <div className="space-y-3">
                            <div className="p-2.5 bg-[#001824] rounded-xl border border-[#002f47] text-[11px] text-slate-300 flex items-center justify-between">
                              <span>Framework: <strong className="text-white">{activeCoaching.suggested_structure_type}</strong></span>
                              <span className="text-slate-400 font-mono text-[10px]">Strategic Narrative Blueprint</span>
                            </div>

                            <div className="grid gap-2">
                              {activeCoaching.suggested_structure_outline?.map((step: any, idx: number) => (
                                <div key={idx} className="p-3 bg-[#001622] rounded-xl border border-[#002b40] space-y-1">
                                  <div className="flex items-center justify-between">
                                    <span className="font-bold text-[#FF4103] text-xs uppercase tracking-wide">
                                      {step.step}: {step.label}
                                    </span>
                                    <span className="text-[10px] font-mono text-slate-500">Step {idx + 1}</span>
                                  </div>
                                  <p className="text-slate-300 text-[11px] leading-relaxed">{step.prompt}</p>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* TAB 3: ILLUSTRATIVE MODEL ANSWER */}
                        {activeCoachingTab === 'model' && (
                          <div className="space-y-3">
                            <div className="p-3 bg-[#001824] rounded-xl border border-[#002f47] space-y-2">
                              <span className="text-slate-400 font-bold uppercase text-[10px] tracking-wider block">
                                Illustrative Exemplar (Grounded in Your Stated Facts)
                              </span>
                              <p className="text-slate-200 text-xs leading-relaxed whitespace-pre-wrap font-sans">
                                {activeCoaching.illustrative_improved_answer}
                              </p>
                            </div>

                            <div className="p-2.5 bg-[#00121d] border border-emerald-500/20 rounded-xl flex items-center gap-2 text-[10px] text-slate-400">
                              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                              <span>Anti-Hallucination Safe Harbor: Anchored strictly in your response with bracketed placeholders [like metrics]. No unverified facts added.</span>
                            </div>
                          </div>
                        )}

                        {/* Gated Progression & Retry Controls */}
                        <div className="pt-3 border-t border-[#002a40] flex flex-col sm:flex-row items-center justify-between gap-3">
                          <button
                            type="button"
                            onClick={() => {
                              setIsRetrying(true);
                              setRetryResponse(candidateResponse);
                            }}
                            className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-[#001824] hover:bg-[#00283d] text-slate-200 hover:text-white border border-[#063750] text-xs font-bold flex items-center justify-center gap-2 transition-colors"
                          >
                            <RefreshCw className="w-3.5 h-3.5 text-[#FF4103]" />
                            <span>Retry This Question (Refine Answer)</span>
                          </button>

                          <button
                            type="button"
                            disabled={advancingTurn}
                            onClick={advanceToNextTurn}
                            className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-[#FF4103] hover:bg-[#e03200] disabled:opacity-50 text-white text-xs font-bold flex items-center justify-center gap-2 shadow-lg shadow-[#FF4103]/25 transition-all"
                          >
                            <span>{advancingTurn ? 'Advancing Panel…' : currentTurn >= totalQuestions ? 'Finish Interview & Synthesize Readiness →' : `Continue to Next Question (Q${currentTurn + 1}/${totalQuestions}) →`}</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ) : isRetrying ? (
                      /* RETRY ANSWER EDITOR */
                      <div className="bg-[#001f2e] border border-[#063750] rounded-2xl p-6 shadow-lg space-y-4 text-xs">
                        <div className="flex items-center justify-between pb-2 border-b border-[#002a40]">
                          <div>
                            <span className="text-[#FF4103] font-bold uppercase tracking-wider text-[11px] block">
                              Retry Attempt {turnAttempts.length + 1}
                            </span>
                            <span className="text-slate-400 text-[11px]">
                              Apply the {activeCoaching?.suggested_structure_type || 'STAR'} structure blueprint to refine your answer.
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() => setIsRetrying(false)}
                            className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white text-[11px]"
                          >
                            Cancel
                          </button>
                        </div>

                        <div className="space-y-1">
                          <div className="flex items-center justify-between text-slate-400 text-[11px]">
                            <span>Your Revised Response:</span>
                            <span>{retryResponse.trim().split(/\s+/).filter(Boolean).length} words</span>
                          </div>
                          <textarea
                            rows={7}
                            value={retryResponse}
                            onChange={e => setRetryResponse(e.target.value)}
                            disabled={submittingRetry}
                            placeholder="Draft your refined answer applying the coaching feedback and structure outline..."
                            className="w-full bg-[#001824] border border-[#002f47] rounded-xl p-3.5 text-white text-xs focus:outline-none focus:border-[#FF4103] leading-relaxed disabled:opacity-50"
                          />
                        </div>

                        {turnError && (
                          <div className="p-2.5 bg-red-950/30 border border-red-500/30 rounded-xl text-red-300 text-xs">
                            {turnError}
                          </div>
                        )}

                        <div className="flex items-center justify-between pt-2">
                          <button
                            type="button"
                            onClick={() => setIsRetrying(false)}
                            className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold hover:text-white"
                          >
                            Cancel Retry
                          </button>
                          <button
                            type="button"
                            disabled={submittingRetry || !retryResponse.trim()}
                            onClick={submitRetry}
                            className="px-5 py-2.5 rounded-xl bg-[#FF4103] hover:bg-[#e03200] disabled:opacity-50 text-white text-xs font-bold flex items-center gap-2 shadow-md shadow-[#FF4103]/20 transition-all"
                          >
                            <Send className="w-3.5 h-3.5" />
                            <span>{submittingRetry ? 'Evaluating Revision…' : 'Submit Revised Answer'}</span>
                          </button>
                        </div>
                      </div>
                    ) : (
                      /* INITIAL SUBMISSION INTERFACE */
                      <div className="bg-[#001f2e] border border-[#063750] rounded-2xl p-6 shadow-lg space-y-4 text-xs">
                        <div className="flex items-center justify-between">
                          <span className="text-slate-400 font-bold uppercase tracking-wider block">
                            Candidate Oral / Stated Response
                          </span>
                          <span className="text-[11px] text-slate-500">
                            {candidateResponse.trim().split(/\s+/).filter(Boolean).length} words
                          </span>
                        </div>

                        <textarea
                          rows={6}
                          value={candidateResponse}
                          onChange={e => setCandidateResponse(e.target.value)}
                          disabled={submittingTurn}
                          placeholder="Transcribe candidate's response detailing their methodology, trade-offs, and concrete examples..."
                          className="w-full bg-[#001824] border border-[#002f47] rounded-xl p-3.5 text-white text-xs focus:outline-none focus:border-[#FF4103] leading-relaxed disabled:opacity-50"
                        />

                        {turnError && (
                          <div className="p-2.5 bg-red-950/30 border border-red-500/30 rounded-xl text-red-300 text-xs">
                            {turnError}
                          </div>
                        )}

                        {/* Human Assessor Calibrated Rating Interface (if in recruiter cockpit or review) */}
                        {!isCandidateRole && (
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
                                  type="button"
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
                        )}

                        {/* Submission Action Bar */}
                        <div className="flex items-center justify-between pt-2">
                          <span className="text-[11px] text-slate-500">
                            Turn {currentTurn} of {totalQuestions || 10}
                          </span>
                          <button
                            type="button"
                            disabled={submittingTurn || !candidateResponse.trim()}
                            onClick={submitTurn}
                            className="px-5 py-2.5 rounded-xl bg-[#FF4103] hover:bg-[#e03200] disabled:opacity-50 text-white text-xs font-bold flex items-center gap-2 shadow-md shadow-[#FF4103]/20 transition-all"
                          >
                            <span>
                              {submittingTurn 
                                ? (isCandidateRole ? 'Extracting Evidence & Generating Coaching…' : 'Extracting Evidence & Coordinating Next Turn…')
                                : (isCandidateRole ? 'Submit Response & Receive Coaching' : 'Submit Turn & Advance Panel')
                              }
                            </span>
                          </button>
                        </div>
                      </div>
                    )}
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
                      {t.human_rating !== undefined && (
                        <span className="font-mono">Human Rating: {t.human_rating}/5</span>
                      )}
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

                        <div className="p-3 bg-purple-950/20 border border-purple-500/20 rounded-xl space-y-1">
                          <span className="font-bold text-purple-400 text-[10px] uppercase block">Panel Analysis & Recommended Probe</span>
                          <p className="text-slate-300">{t.evaluation.ai_recommended_probe}</p>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: CANDIDATE DOSSIER (M01-M03 Evidence Integration) */}
        {activeTab === 'dossier' && (
          <div className="space-y-6">
            <div className="bg-[#001f2e] border border-[#063750] rounded-2xl p-6 shadow-lg space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#002a40]">
                <div>
                  <span className="text-xs font-bold text-[#FF4103] uppercase tracking-wider">Candidate Dossier</span>
                  <h2 className="text-2xl font-black text-white mt-1">{candidateDossier?.name || 'Alex Mercer'}</h2>
                  <p className="text-xs text-slate-400 mt-1">
                    {candidateDossier?.target_role} · {candidateDossier?.experience_level?.toUpperCase()}
                  </p>
                </div>
                <div className="text-right">
                  <div className="text-3xl font-black text-white">{candidateDossier?.readiness_score}%</div>
                  <span className="text-[10px] text-emerald-400 uppercase font-bold">M01–M03 Readiness</span>
                </div>
              </div>

              {/* M01 Resume Claims */}
              <div className="pt-2">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-2">
                  M01 Verified Resume Claims ({candidateDossier?.m01_verified_claims_count} Verified)
                </span>
                <div className="p-4 bg-[#001824] rounded-xl border border-[#002f47] text-xs text-slate-300">
                  Candidate resume claims have passed multi-pass extraction and hash verification.
                </div>
              </div>
            </div>

            {/* M02 Proficiencies & Misconceptions */}
            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-[#001f2e] border border-[#063750] rounded-2xl p-6 shadow-lg space-y-3">
                <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <BarChart2 className="w-4 h-4 text-[#FF4103]" />
                  <span>M02 Adaptive Proficiency Estimates</span>
                </h3>
                <div className="space-y-2 text-xs">
                  {candidateDossier?.m02_proficiencies?.map((p: any, i: number) => (
                    <div key={i} className="p-3 bg-[#001824] rounded-xl border border-[#002f47] flex items-center justify-between">
                      <div>
                        <div className="text-white font-semibold">{p.skill}</div>
                        <div className="text-[10px] text-slate-500">{p.competency}</div>
                      </div>
                      <div className="text-right">
                        <span className="text-emerald-400 font-bold">{p.estimate}%</span>
                        <div className="text-[10px] text-slate-500">±{p.uncertainty}% unc.</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-[#001f2e] border border-[#063750] rounded-2xl p-6 shadow-lg space-y-3">
                <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-400" />
                  <span>M02 Diagnosed Misconceptions (Probe Targets)</span>
                </h3>
                <div className="space-y-2 text-xs">
                  {candidateDossier?.m02_diagnosed_misconceptions?.length === 0 ? (
                    <div className="p-3 bg-[#001824] rounded-xl text-slate-400">No active misconceptions recorded.</div>
                  ) : (
                    candidateDossier?.m02_diagnosed_misconceptions?.map((m: string, i: number) => (
                      <div key={i} className="p-3 bg-amber-950/20 border border-amber-500/20 rounded-xl text-amber-200">
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
                  Launch a panel interview and complete all 10 turns to generate an auditable M05 Evidence Package.
                </p>
                <button
                  onClick={() => { setActiveTab('cockpit'); startInterview(selectedProtocol, isCandidateRole); }}
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

        {/* Global Candidate Journey Navigation */}
        <ModuleNavigationFooter
          currentModule="M04"
          isCompleted={Boolean(synthesis)}
          saveStatusText={sessionId ? (submittingTurn ? 'Synthesizing response…' : 'Interview turn synchronized') : undefined}
        />
      </div>
    </DashboardLayout>
  );
}
