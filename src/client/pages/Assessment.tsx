import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { CheckCircle2, XCircle, ChevronRight, Loader2, Target } from 'lucide-react';

export default function Assessment() {
  const { skill_id } = useParams();
  const navigate = useNavigate();
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [item, setItem] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<{ is_correct: boolean; new_score: number } | null>(null);
  const [completed, setCompleted] = useState(false);

  // Initialize session
  useEffect(() => {
    const init = async () => {
      try {
        const res = await fetch('/api/assessment/start', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ skill_id })
        });
        const data = await res.json() as any;
        if (data.success) {
          setSessionId(data.session_id);
          fetchNext(data.session_id);
        } else {
          alert('Error starting assessment');
          navigate('/dashboard');
        }
      } catch (e) {
        alert('Network error');
        navigate('/dashboard');
      }
    };
    init();
  }, [skill_id]);

  const fetchNext = async (sid: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/assessment/sessions/${sid}/next?skill_id=${skill_id}`);
      const data = await res.json() as any;
      if (data.completed) {
        setCompleted(true);
      } else if (data.success) {
        setItem(data.item);
        setSelectedOption(null);
        setResult(null);
      }
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  const submitAnswer = async () => {
    if (!selectedOption || !sessionId || !item) return;
    setSubmitting(true);
    try {
      const res = await fetch(`/api/assessment/sessions/${sessionId}/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ item_id: item.id, response_text: selectedOption, skill_id })
      });
      const data = await res.json() as any;
      if (data.success) {
        setResult({ is_correct: data.is_correct, new_score: data.new_score });
      }
    } catch (e) {
      console.error(e);
    }
    setSubmitting(false);
  };

  if (loading && !item) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-brand-500 animate-spin" />
      </div>
    );
  }

  if (completed) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-xl p-8 text-center">
          <div className="w-16 h-16 bg-brand-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <Target className="w-8 h-8 text-brand-500" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">Assessment Complete</h1>
          <p className="text-slate-400 mb-8">You have answered all available questions for this skill. Your proficiency score has been updated.</p>
          <button 
            onClick={() => navigate('/dashboard')}
            className="w-full py-3 rounded-lg font-medium text-white bg-brand-600 hover:bg-brand-500 transition-colors"
          >
            Return to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 font-sans p-4 md:p-8 flex flex-col items-center">
      <div className="w-full max-w-2xl mt-12 mb-8">
        <button onClick={() => navigate('/dashboard')} className="text-slate-400 hover:text-white text-sm mb-8 flex items-center gap-2 transition-colors">
          &larr; Back to Dashboard
        </button>
        
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
          <div className="p-8 border-b border-slate-800">
            <div className="flex justify-between items-center mb-6">
              <span className="text-sm font-medium text-brand-400 uppercase tracking-wider">Skill Verification</span>
              <span className="text-xs text-slate-500 font-mono">ID: {item?.id?.slice(0,8)}</span>
            </div>
            <h2 className="text-xl md:text-2xl font-medium text-white leading-relaxed">
              {item?.question_text}
            </h2>
          </div>
          
          <div className="p-8 bg-slate-900/50">
            <div className="space-y-3">
              {item?.options?.map((opt: string, i: number) => (
                <button
                  key={i}
                  disabled={result !== null || submitting}
                  onClick={() => setSelectedOption(opt)}
                  className={\`w-full text-left p-4 rounded-xl border transition-all \${
                    selectedOption === opt
                      ? 'border-brand-500 bg-brand-500/10 text-white'
                      : 'border-slate-700 bg-slate-800/30 text-slate-300 hover:border-slate-600 hover:bg-slate-800'
                  } \${result !== null ? 'opacity-70 cursor-default' : ''}\`}
                >
                  <div className="flex gap-4">
                    <span className={\`font-mono font-medium \${selectedOption === opt ? 'text-brand-400' : 'text-slate-500'}\`}>
                      {String.fromCharCode(65 + i)}
                    </span>
                    <span>{opt}</span>
                  </div>
                </button>
              ))}
            </div>

            {result && (
              <div className={\`mt-8 p-4 rounded-xl flex items-start gap-4 \${result.is_correct ? 'bg-emerald-500/10 border border-emerald-500/20' : 'bg-red-500/10 border border-red-500/20'}\`}>
                {result.is_correct ? <CheckCircle2 className="w-6 h-6 text-emerald-500 shrink-0" /> : <XCircle className="w-6 h-6 text-red-500 shrink-0" />}
                <div>
                  <h4 className={\`font-medium \${result.is_correct ? 'text-emerald-400' : 'text-red-400'}\`}>
                    {result.is_correct ? 'Correct Answer' : 'Incorrect Answer'}
                  </h4>
                  <p className="text-sm text-slate-400 mt-1">Your new verified proficiency score for this skill is <strong className="text-white">{result.new_score}%</strong>.</p>
                </div>
              </div>
            )}
            
            <div className="mt-8 flex justify-end">
              {!result ? (
                <button
                  disabled={!selectedOption || submitting}
                  onClick={submitAnswer}
                  className="px-6 py-3 rounded-lg font-medium text-white bg-brand-600 hover:bg-brand-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  {submitting ? 'Verifying...' : 'Submit Answer'}
                </button>
              ) : (
                <button
                  onClick={() => sessionId && fetchNext(sessionId)}
                  className="px-6 py-3 rounded-lg font-medium text-slate-900 bg-white hover:bg-slate-200 flex items-center gap-2 transition-all"
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
