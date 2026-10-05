import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Target, Loader2, ChevronRight, CheckCircle2, XCircle, 
  Clock, AlertTriangle, BarChart3, Brain, ArrowLeft, 
  ShieldCheck, Sparkles, BookOpen
} from 'lucide-react';

type AttemptState = 'loading' | 'intro' | 'in_progress' | 'evaluating' | 'completed' | 'error';
type ItemType = 'multiple_choice' | 'short_answer' | 'scenario' | 'practical' | 'reasoning';

interface AssessmentItem {
  id: string;
  item_type: ItemType;
  content_json: string;
  difficulty_level: number;
  skill_name?: string;
  competency_name?: string;
  selection_reason?: string;
}

interface ProficiencyEntry {
  skill_id: string;
  skill_name: string;
  proficiency_estimate: number;
  uncertainty_estimate: number;
  evidence_status: string;
}

interface GapEntry {
  skill_id: string;
  skill_name: string;
  gap_type: string;
  severity: string;
  recommendation?: string;
}

export default function AssessmentV2() {
  const navigate = useNavigate();
  const [state, setState] = useState<AttemptState>('loading');
  const [error, setError] = useState('');
  
  // Blueprint selection
  const [blueprints, setBlueprints] = useState<any[]>([]);
  const [selectedBlueprint, setSelectedBlueprint] = useState<string | null>(null);
  
  // Attempt state
  const [attemptId, setAttemptId] = useState<string | null>(null);
  const [currentItem, setCurrentItem] = useState<AssessmentItem | null>(null);
  const [itemContent, setItemContent] = useState<any>(null);
  const [itemCount, setItemCount] = useState(0);
  const [maxItems, setMaxItems] = useState(20);
  
  // Response state
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [freeTextResponse, setFreeTextResponse] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [lastEvaluation, setLastEvaluation] = useState<any>(null);
  
  // Results
  const [proficiency, setProficiency] = useState<ProficiencyEntry[]>([]);
  const [gaps, setGaps] = useState<GapEntry[]>([]);
  const [attemptSummary, setAttemptSummary] = useState<any>(null);
  
  // Timer
  const [startTime, setStartTime] = useState<number>(0);
  const [elapsed, setElapsed] = useState(0);

  // Timer effect
  useEffect(() => {
    if (state !== 'in_progress' || !startTime) return;
    const interval = setInterval(() => setElapsed(Math.floor((Date.now() - startTime) / 1000)), 1000);
    return () => clearInterval(interval);
  }, [state, startTime]);

  // Load blueprints on mount
  useEffect(() => {
    loadBlueprints();
  }, []);

  const loadBlueprints = async () => {
    try {
      const res = await fetch('/api/m2/blueprints');
      const data = await res.json() as any;
      if (data.success) {
        setBlueprints(data.blueprints || []);
        setState('intro');
      } else {
        // Auto-generate a blueprint from candidate context if none exist
        setState('intro');
      }
    } catch (e) {
      setError('Failed to load assessment blueprints');
      setState('error');
    }
  };

  const startAttempt = async () => {
    setState('loading');
    try {
      const res = await fetch('/api/m2/attempts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ blueprint_id: selectedBlueprint })
      });
      const data = await res.json() as any;
      if (!res.ok || !data.success) {
        setError(data.error || 'Failed to start assessment');
        setState('error');
        return;
      }
      setAttemptId(data.attempt_id);
      setStartTime(Date.now());
      setState('in_progress');
      fetchNextItem(data.attempt_id);
    } catch (e) {
      setError('Network error starting assessment');
      setState('error');
    }
  };

  const fetchNextItem = async (aid: string) => {
    try {
      const res = await fetch(`/api/m2/attempts/${aid}/next`);
      const data = await res.json() as any;
      if (data.completed) {
        await completeAttempt(aid);
        return;
      }
      if (data.success && data.item) {
        setCurrentItem(data.item);
        try { setItemContent(JSON.parse(data.item.content_json)); } catch { setItemContent({ question: data.item.content_json }); }
        setSelectedOption(null);
        setFreeTextResponse('');
        setLastEvaluation(null);
        setItemCount(prev => prev + 1);
      } else {
        setError(data.error || 'No items available');
        setState('error');
      }
    } catch (e) {
      setError('Failed to fetch next question');
      setState('error');
    }
  };

  const submitResponse = async () => {
    if (!attemptId || !currentItem) return;
    setSubmitting(true);
    setState('evaluating');
    
    const responseData = currentItem.item_type === 'multiple_choice' 
      ? { selected_option: selectedOption }
      : { text_response: freeTextResponse };
    
    try {
      const res = await fetch(`/api/m2/attempts/${attemptId}/respond`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          item_id: currentItem.id,
          response_data: responseData,
          time_taken_seconds: elapsed > 0 ? elapsed - (startTime ? Math.floor((Date.now() - startTime) / 1000) : 0) : 0
        })
      });
      const data = await res.json() as any;
      if (data.success) {
        setLastEvaluation(data.evaluation);
        setState('in_progress');
      } else {
        setError(data.error || 'Response submission failed');
        setState('in_progress');
      }
    } catch (e) {
      setError('Network error submitting response');
      setState('in_progress');
    }
    setSubmitting(false);
  };

  const completeAttempt = async (aid: string) => {
    try {
      await fetch(`/api/m2/attempts/${aid}/complete`, { method: 'POST' });
      
      // Load proficiency and gaps
      const [profRes, gapRes] = await Promise.all([
        fetch('/api/m2/proficiency'),
        fetch('/api/m2/gaps')
      ]);
      const profData = await profRes.json() as any;
      const gapData = await gapRes.json() as any;
      
      if (profData.success) setProficiency(profData.proficiency || []);
      if (gapData.success) setGaps(gapData.gaps || []);
      
      setState('completed');
    } catch (e) {
      setState('completed');
    }
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const difficultyLabel = (level: number) => {
    if (level <= 2) return 'Foundation';
    if (level <= 4) return 'Core';
    if (level <= 6) return 'Applied';
    if (level <= 8) return 'Advanced';
    return 'Expert';
  };

  const confidenceColor = (uncertainty: number) => {
    if (uncertainty < 0.2) return 'text-emerald-400';
    if (uncertainty < 0.4) return 'text-yellow-400';
    return 'text-orange-400';
  };

  // --- RENDER STATES ---

  if (state === 'loading') {
    return (
      <div className="min-h-screen bg-[#001621] flex items-center justify-center" role="status" aria-label="Loading assessment">
        <div className="text-center">
          <Loader2 className="w-10 h-10 text-[#FF4103] animate-spin mx-auto mb-4" aria-hidden="true" />
          <p className="text-slate-400">Preparing your assessment...</p>
        </div>
      </div>
    );
  }

  if (state === 'error') {
    return (
      <div className="min-h-screen bg-[#001621] flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-[#001f2e] border border-red-800 rounded-xl p-8 text-center" role="alert">
          <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" aria-hidden="true" />
          <h1 className="text-xl font-bold text-white mb-2">Assessment Error</h1>
          <p className="text-slate-400 mb-6">{error}</p>
          <div className="flex gap-3 justify-center">
            <button onClick={() => navigate('/dashboard')} className="px-4 py-2.5 rounded-lg bg-slate-800 text-slate-300 hover:text-white">
              Back to Dashboard
            </button>
            <button onClick={() => { setError(''); setState('intro'); }} className="px-4 py-2.5 rounded-lg bg-[#FF4103] text-white hover:bg-[#e03200]">
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (state === 'intro') {
    return (
      <div className="min-h-screen bg-[#001621] text-slate-200 p-4 md:p-8">
        <div className="max-w-2xl mx-auto mt-12">
          <button onClick={() => navigate('/dashboard')} className="text-slate-400 hover:text-white text-sm mb-8 flex items-center gap-2">
            <ArrowLeft className="w-4 h-4" /> Back to Dashboard
          </button>
          
          <div className="bg-[#001f2e] border border-[#063750] rounded-2xl p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-brand-500/10 rounded-xl flex items-center justify-center">
                <Brain className="w-6 h-6 text-[#FF4103]" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">Skill Assessment</h1>
                <p className="text-slate-400 text-sm">Evidence-based competency verification</p>
              </div>
            </div>

            <div className="space-y-4 mb-8">
              <div className="p-4 bg-[#001621] border border-[#063750] rounded-lg">
                <h3 className="text-sm font-semibold text-[#FF4103] uppercase mb-2">How it works</h3>
                <ul className="space-y-2 text-sm text-slate-300">
                  <li className="flex items-start gap-2"><CheckCircle2 className="w-4 h-4 text-[#FF4103] mt-0.5 shrink-0" /> Questions adapt to your demonstrated skill level</li>
                  <li className="flex items-start gap-2"><CheckCircle2 className="w-4 h-4 text-[#FF4103] mt-0.5 shrink-0" /> Multiple question types: conceptual, scenario-based, practical</li>
                  <li className="flex items-start gap-2"><CheckCircle2 className="w-4 h-4 text-[#FF4103] mt-0.5 shrink-0" /> Results show proficiency with confidence levels</li>
                  <li className="flex items-start gap-2"><CheckCircle2 className="w-4 h-4 text-[#FF4103] mt-0.5 shrink-0" /> Gap analysis identifies areas for improvement</li>
                </ul>
              </div>

              <div className="p-4 bg-blue-950/20 border border-blue-900/50 rounded-lg">
                <div className="flex items-start gap-2">
                  <ShieldCheck className="w-4 h-4 text-[#FF4103] mt-0.5 shrink-0" />
                  <p className="text-sm text-blue-300">Your responses are evaluated against structured rubrics. AI scoring confidence is tracked separately from your performance.</p>
                </div>
              </div>
            </div>

            {blueprints.length > 0 && (
              <div className="mb-6">
                <label className="text-sm font-medium text-slate-300 mb-2 block" htmlFor="blueprint-select">Assessment Blueprint</label>
                <select 
                  id="blueprint-select"
                  value={selectedBlueprint || ''}
                  onChange={e => setSelectedBlueprint(e.target.value || null)}
                  className="w-full p-3 bg-[#001621] border border-[#002f47] rounded-lg text-white focus:ring-2 focus:ring-[#FF4103] focus:outline-none"
                >
                  <option value="">Auto-generate from your profile</option>
                  {blueprints.map(bp => (
                    <option key={bp.id} value={bp.id}>{bp.target_role || 'General'} — v{bp.version}</option>
                  ))}
                </select>
              </div>
            )}

            <button 
              onClick={startAttempt}
              className="w-full py-3.5 rounded-lg font-medium text-white bg-[#FF4103] hover:bg-[#e03200] transition-colors flex items-center justify-center gap-2"
              aria-label="Begin adaptive assessment"
            >
              <Sparkles className="w-5 h-5" /> Begin Assessment
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (state === 'completed') {
    return (
      <div className="min-h-screen bg-[#001621] text-slate-200 p-4 md:p-8">
        <div className="max-w-3xl mx-auto mt-12">
          <div className="bg-[#001f2e] border border-[#063750] rounded-2xl overflow-hidden">
            <div className="p-8 border-b border-[#063750] text-center">
              <div className="w-16 h-16 bg-brand-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Target className="w-8 h-8 text-[#FF4103]" />
              </div>
              <h1 className="text-2xl font-bold text-white mb-2">Assessment Complete</h1>
              <p className="text-slate-400">Your skill proficiency has been updated based on verified evidence.</p>
              <p className="text-sm text-slate-500 mt-2">{itemCount} questions answered · {formatTime(elapsed)} elapsed</p>
            </div>

            {/* Proficiency Results */}
            {proficiency.length > 0 && (
              <div className="p-8 border-b border-[#063750]">
                <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-[#FF4103]" /> Skill Proficiency
                </h2>
                <div className="space-y-4">
                  {proficiency.map(p => (
                    <div key={p.skill_id} className="p-4 bg-[#001621] border border-[#063750] rounded-lg">
                      <div className="flex justify-between items-center mb-2">
                        <span className="font-medium text-white">{p.skill_name}</span>
                        <div className="flex items-center gap-3">
                          <span className="text-[#FF4103] font-bold">{(p.proficiency_estimate * 100).toFixed(0)}%</span>
                          <span className={`text-xs ${confidenceColor(p.uncertainty_estimate)}`}>
                            ±{(p.uncertainty_estimate * 100).toFixed(0)}%
                          </span>
                        </div>
                      </div>
                      <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                        <div className="h-full bg-brand-500 rounded-full transition-all" style={{width: `${p.proficiency_estimate * 100}%`}} />
                      </div>
                      <div className="flex justify-between mt-1">
                        <span className="text-xs text-slate-500">{p.evidence_status}</span>
                        <span className="text-xs text-slate-500">
                          Confidence: {p.uncertainty_estimate < 0.2 ? 'High' : p.uncertainty_estimate < 0.4 ? 'Medium' : 'Low'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Gap Analysis */}
            {gaps.length > 0 && (
              <div className="p-8 border-b border-[#063750]">
                <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-yellow-400" /> Gap Analysis
                </h2>
                <div className="space-y-3">
                  {gaps.map(g => (
                    <div key={g.skill_id} className="p-4 bg-[#001621] border border-[#063750] rounded-lg">
                      <div className="flex justify-between items-start">
                        <div>
                          <span className="font-medium text-white">{g.skill_name}</span>
                          <span className={`ml-2 text-xs px-2 py-0.5 rounded-full ${
                            g.severity === 'critical' ? 'bg-red-500/20 text-red-400' :
                            g.severity === 'significant' ? 'bg-orange-500/20 text-orange-400' :
                            g.severity === 'minor' ? 'bg-yellow-500/20 text-yellow-400' :
                            'bg-slate-700 text-slate-400'
                          }`}>{g.severity}</span>
                        </div>
                        <span className="text-xs text-slate-500 uppercase">{g.gap_type}</span>
                      </div>
                      {g.recommendation && <p className="text-sm text-slate-400 mt-2">{g.recommendation}</p>}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="p-8">
              <div className="p-4 bg-blue-950/20 border border-blue-900/50 rounded-lg mb-6">
                <p className="text-sm text-blue-300 flex items-start gap-2">
                  <ShieldCheck className="w-4 h-4 shrink-0 mt-0.5" />
                  These results represent evidence-based proficiency estimates, not employment decisions. Uncertainty ranges indicate measurement confidence.
                </p>
              </div>
              <button 
                onClick={() => navigate('/dashboard')}
                className="w-full py-3 rounded-lg font-medium text-white bg-[#FF4103] hover:bg-[#e03200]"
              >
                Return to Command Center
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // --- IN PROGRESS / EVALUATING ---
  return (
    <div className="min-h-screen bg-[#001621] text-slate-200 p-4 md:p-8">
      <div className="max-w-2xl mx-auto mt-8">
        {/* Header bar */}
        <div className="flex items-center justify-between mb-6">
          <button onClick={() => navigate('/dashboard')} className="text-slate-400 hover:text-white text-sm flex items-center gap-2">
            <ArrowLeft className="w-4 h-4" /> Exit
          </button>
          <div className="flex items-center gap-4 text-sm">
            <span className="text-slate-500 flex items-center gap-1">
              <BookOpen className="w-4 h-4" /> Q{itemCount}
            </span>
            <span className="text-slate-500 flex items-center gap-1">
              <Clock className="w-4 h-4" /> {formatTime(elapsed)}
            </span>
          </div>
        </div>

        {/* Item metadata */}
        {currentItem && (
          <div className="flex gap-2 mb-4 flex-wrap">
            {currentItem.skill_name && (
              <span className="text-xs px-2.5 py-1 bg-brand-500/10 text-[#FF4103] rounded-full border border-[#FF4103]/20">
                {currentItem.skill_name}
              </span>
            )}
            {currentItem.difficulty_level && (
              <span className="text-xs px-2.5 py-1 bg-slate-800 text-slate-400 rounded-full border border-[#002f47]">
                {difficultyLabel(currentItem.difficulty_level)}
              </span>
            )}
            {currentItem.selection_reason && (
              <span className="text-xs px-2.5 py-1 bg-slate-800 text-slate-500 rounded-full border border-[#002f47]">
                {currentItem.selection_reason}
              </span>
            )}
          </div>
        )}

        {/* Question card */}
        <div className="bg-[#001f2e] border border-[#063750] rounded-2xl overflow-hidden shadow-xl">
          <div className="p-8 border-b border-[#063750]">
            <h2 className="text-xl font-medium text-white leading-relaxed" id="question-text">
              {itemContent?.question || itemContent?.text || 'Loading question...'}
            </h2>
            {itemContent?.context && (
              <div className="mt-4 p-3 bg-[#001621] border border-[#063750] rounded-lg">
                <p className="text-sm text-slate-400">{itemContent.context}</p>
              </div>
            )}
          </div>

          <div className="p-8 bg-[#001f2e]/50">
            {/* Multiple choice */}
            {currentItem?.item_type === 'multiple_choice' && itemContent?.options && (
              <div className="space-y-3" role="radiogroup" aria-labelledby="question-text">
                {itemContent.options.map((opt: string, i: number) => (
                  <button
                    key={i}
                    disabled={lastEvaluation !== null || submitting}
                    onClick={() => setSelectedOption(opt)}
                    role="radio"
                    aria-checked={selectedOption === opt}
                    className={`w-full text-left p-4 rounded-xl border transition-all focus:ring-2 focus:ring-[#FF4103] focus:outline-none ${
                      selectedOption === opt
                        ? 'border-[#FF4103] bg-brand-500/10 text-white'
                        : 'border-[#002f47] bg-slate-800/30 text-slate-300 hover:border-slate-600'
                    } ${lastEvaluation ? 'opacity-70 cursor-default' : ''}`}
                  >
                    <div className="flex gap-4">
                      <span className={`font-mono font-medium ${selectedOption === opt ? 'text-[#FF4103]' : 'text-slate-500'}`}>
                        {String.fromCharCode(65 + i)}
                      </span>
                      <span>{opt}</span>
                    </div>
                  </button>
                ))}
              </div>
            )}

            {/* Free text / short answer / scenario / reasoning */}
            {(currentItem?.item_type === 'short_answer' || currentItem?.item_type === 'scenario' || currentItem?.item_type === 'reasoning') && (
              <div>
                <label htmlFor="response-text" className="sr-only">Your response</label>
                <textarea
                  id="response-text"
                  value={freeTextResponse}
                  onChange={e => setFreeTextResponse(e.target.value)}
                  disabled={lastEvaluation !== null || submitting}
                  placeholder="Type your response here..."
                  rows={6}
                  className="w-full p-4 bg-[#001621] border border-[#002f47] rounded-xl text-white placeholder-slate-600 focus:ring-2 focus:ring-[#FF4103] focus:outline-none resize-y"
                />
                <p className="text-xs text-slate-500 mt-2">{freeTextResponse.length} characters</p>
              </div>
            )}

            {/* M02 Adaptive Teaching Engine UI */}
            {lastEvaluation && (
              <div className={`mt-6 overflow-hidden rounded-xl border ${
                lastEvaluation.score_raw >= 0.7 
                  ? 'bg-emerald-950/20 border-emerald-500/30' 
                  : lastEvaluation.score_raw >= 0.4 
                    ? 'bg-yellow-950/20 border-yellow-500/30'
                    : 'bg-red-950/20 border-red-500/30'
              }`}>
                <div className={`p-4 border-b ${lastEvaluation.score_raw >= 0.7 ? 'border-emerald-500/20 bg-emerald-500/10' : lastEvaluation.score_raw >= 0.4 ? 'border-yellow-500/20 bg-yellow-500/10' : 'border-red-500/20 bg-red-500/10'}`}>
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-3">
                      {lastEvaluation.score_raw >= 0.7 ? (
                        <CheckCircle2 className="w-6 h-6 text-emerald-400" />
                      ) : (
                        <XCircle className="w-6 h-6 text-red-400" />
                      )}
                      <div>
                        <h3 className="font-bold text-white text-lg">
                          Score: {(lastEvaluation.score_raw * 100).toFixed(0)}%
                        </h3>
                        <p className="text-xs text-slate-400">Evaluator: {lastEvaluation.evaluator_type} (Confidence: {((lastEvaluation.confidence_score || 0) * 100).toFixed(0)}%)</p>
                      </div>
                    </div>
                  </div>
                </div>
                
                {lastEvaluation.teaching_payload ? (
                  <div className="p-5 space-y-5">
                    <div className="bg-slate-900/50 p-4 rounded-lg border border-slate-700/50">
                      <h4 className="text-sm font-semibold text-blue-400 uppercase tracking-wider mb-2">Analysis of Your Answer</h4>
                      <p className="text-slate-300 text-sm leading-relaxed">{lastEvaluation.teaching_payload.analysis_of_candidate_answer}</p>
                    </div>

                    {(lastEvaluation.teaching_payload.misconception_remediation && lastEvaluation.teaching_payload.misconception_remediation !== "N/A") && (
                      <div className="bg-orange-950/20 p-4 rounded-lg border border-orange-500/20">
                        <h4 className="text-sm font-semibold text-orange-400 uppercase tracking-wider mb-2">Misconception Remediation</h4>
                        <p className="text-orange-200 text-sm leading-relaxed">{lastEvaluation.teaching_payload.misconception_remediation}</p>
                      </div>
                    )}

                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="bg-emerald-950/10 p-4 rounded-lg border border-emerald-500/10">
                        <h4 className="text-sm font-semibold text-emerald-400 uppercase tracking-wider mb-2">The Correct Approach</h4>
                        <p className="text-emerald-100/70 text-sm leading-relaxed mb-3">{lastEvaluation.teaching_payload.explanation_of_correct_answer}</p>
                        <h5 className="text-xs font-semibold text-slate-400 mt-4 mb-1">How to arrive at it:</h5>
                        <p className="text-slate-400 text-sm">{lastEvaluation.teaching_payload.how_to_arrive}</p>
                      </div>

                      <div className="space-y-4">
                        <div className="bg-slate-800/30 p-4 rounded-lg border border-slate-700/30">
                          <h4 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-2">Why Alternatives Fail</h4>
                          <p className="text-slate-400 text-sm leading-relaxed">{lastEvaluation.teaching_payload.analysis_of_alternatives}</p>
                        </div>
                        {(lastEvaluation.teaching_payload.follow_up_question && lastEvaluation.teaching_payload.follow_up_question !== "N/A") && (
                          <div className="bg-indigo-950/20 p-4 rounded-lg border border-indigo-500/20">
                            <h4 className="text-sm font-semibold text-indigo-400 uppercase tracking-wider mb-2">Follow-up / Adapt</h4>
                            <p className="text-indigo-200 text-sm leading-relaxed font-medium mb-2">{lastEvaluation.teaching_payload.follow_up_question}</p>
                            {lastEvaluation.teaching_payload.adaptation_recommendation && (
                              <span className="inline-block px-2 py-1 bg-indigo-900/50 text-indigo-300 text-xs rounded border border-indigo-800/50">
                                Adaptation: {lastEvaluation.teaching_payload.adaptation_recommendation.replace('_', ' ')}
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="p-4">
                    {lastEvaluation.feedback && <p className="text-sm text-slate-300">{lastEvaluation.feedback}</p>}
                  </div>
                )}
              </div>
            )}

                    {/* Action buttons */}
            <div className="mt-8 flex justify-end">
              {!lastEvaluation ? (
                <button
                  disabled={
                    submitting || 
                    (currentItem?.item_type === 'multiple_choice' && !selectedOption) ||
                    (currentItem?.item_type !== 'multiple_choice' && !freeTextResponse.trim())
                  }
                  onClick={submitResponse}
                  className="px-6 py-3 rounded-lg font-medium text-white bg-[#FF4103] hover:bg-[#e03200] disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2"
                  aria-label="Submit your answer"
                >
                  {submitting ? (
                    <><Loader2 className="w-4 h-4 animate-spin" /> Evaluating...</>
                  ) : (
                    'Submit Answer'
                  )}
                </button>
              ) : (
                <button
                  onClick={() => attemptId && fetchNextItem(attemptId)}
                  className="px-6 py-3 rounded-lg font-medium text-slate-900 bg-white hover:bg-slate-200 flex items-center gap-2 transition-all"
                  aria-label="Continue to next question"
                >
                  Next Question <ChevronRight className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

