import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Upload, FileText, Bot, AlertCircle, CheckCircle2, LayoutDashboard, Briefcase, ChevronRight, XCircle, FileQuestion, Sparkles } from 'lucide-react';

export default function Resume() {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [extracting, setExtracting] = useState(false);
  const [resumeData, setResumeData] = useState<any>(null);
  const [resumeId, setResumeId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  // M1 Additions
  const [jdText, setJdText] = useState('');
  const [jdAnalyzing, setJdAnalyzing] = useState(false);
  const [jdData, setJdData] = useState<any>(null);
  const [jdId, setJdId] = useState<string | null>(null);

  const [matchRunning, setMatchRunning] = useState(false);
  const [matchData, setMatchData] = useState<any>(null);
  const [acceptedSuggestions, setAcceptedSuggestions] = useState<Set<number>>(new Set());
  const [optimizing, setOptimizing] = useState(false);
  const [optimizedResumeId, setOptimizedResumeId] = useState<string | null>(null);

  
  const toggleSuggestion = (index: number) => {
    const newSet = new Set(acceptedSuggestions);
    if (newSet.has(index)) newSet.delete(index);
    else newSet.add(index);
    setAcceptedSuggestions(newSet);
  };

  const applyOptimizations = async () => {
    if (!resumeId || acceptedSuggestions.size === 0) return;
    setOptimizing(true);
    const accepted = Array.from(acceptedSuggestions).map(i => matchData.improvement_suggestions[i]);
    try {
      const res = await fetch(`/api/resume/${resumeId}/optimize`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accepted_suggestions: accepted })
      });
      const data = await res.json() as any;
      if (res.ok) setOptimizedResumeId(data.new_resume_id);
      else setError(data.error);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setOptimizing(false);
    }
  };

  
  const exportATSResume = async (type: 'global' | 'tailored') => {
    if (!resumeId) return;
    try {
      window.location.href = `/api/resume/${resumeId}/export?type=${type}`;
    } catch (e: any) {
      setError('Failed to export: ' + e.message);
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;

    setUploading(true);
    setError(null);
    setResumeData(null);
    setMatchData(null);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch('/api/resume/upload', {
        method: 'POST',
        body: formData,
      });

      const data = (await res.json()) as any;
      if (!res.ok) throw new Error(data.error || 'Upload failed');

      setResumeId(data.resumeId);
      setUploading(false);
      setExtracting(true);

      const extractRes = await fetch(`/api/resume/extract/${data.resumeId}`, {
        method: 'POST',
      });
      
      const extractData = (await extractRes.json()) as any;
      if (!extractRes.ok) throw new Error(extractData.error || 'Extraction failed');

      setResumeData(extractData.data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setUploading(false);
      setExtracting(false);
    }
  };

  const handleJDAnalyze = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!jdText.trim()) return;

    setJdAnalyzing(true);
    setError(null);
    setMatchData(null);

    try {
      const res = await fetch('/api/jd/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jd_text: jdText })
      });

      const data = await res.json() as any;
      if (!res.ok) throw new Error(data.error || 'JD analysis failed');

      setJdId(data.jd_id);
      setJdData(data.data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setJdAnalyzing(false);
    }
  };

  const handleMatch = async () => {
    if (!resumeId || !jdId) return;
    setMatchRunning(true);
    setError(null);

    try {
      const res = await fetch('/api/match/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resume_id: resumeId, jd_id: jdId })
      });
      const data = await res.json() as any;
      if (!res.ok) throw new Error(data.error || 'Match analysis failed to start');

      const jobId = data.job_id;
      
      // Poll for completion
      const poll = async () => {
        const statusRes = await fetch(`/api/match/status/${jobId}`);
        const statusData = await statusRes.json() as any;
        
        if (statusData.status === 'READY') {
          // Fetch the actual match data. 
          // The result JSON from the job should have the match report.
          setMatchData(statusData.result);
          setMatchRunning(false);
        } else if (statusData.status === 'FAILED') {
          setError(statusData.error || 'Match processing failed');
          setMatchRunning(false);
        } else {
          // PENDING or PROCESSING
          setTimeout(poll, 2000);
        }
      };

      poll();

    } catch (err: any) {
      setError(err.message);
      setMatchRunning(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch(status) {
      case 'EVIDENCE_FOUND': return <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0" />;
      case 'MISSING': return <XCircle className="w-5 h-5 text-red-500 flex-shrink-0" />;
      case 'CONTRADICTORY': return <FileQuestion className="w-5 h-5 text-orange-500 flex-shrink-0" />;
      case 'UNCERTAIN': return <AlertCircle className="w-5 h-5 text-yellow-500 flex-shrink-0" />;
      default: return <ChevronRight className="w-5 h-5 text-slate-500 flex-shrink-0" />;
    }
  };

  return (
    <div className="min-h-screen bg-[#001621] p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-white flex items-center gap-3">
            <FileText className="w-8 h-8 text-[#FF4103]" />
            Resume Intelligence & ATS Matching
          </h1>
          <button 
            onClick={() => navigate('/dashboard')}
            className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg transition-colors"
          >
            <LayoutDashboard className="w-4 h-4" />
            Back to Dashboard
          </button>
        </div>

        {error && (
          <div className="p-4 bg-red-950/50 border border-red-900 rounded-lg flex items-start justify-between gap-3">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
              <div className="text-red-200 text-sm">
                <p className="font-semibold text-red-400">Error</p>
                <p>{error}</p>
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
                    className="mt-2 px-3 py-1 bg-red-800 hover:bg-red-700 text-white rounded text-xs font-medium transition-colors"
                  >
                    Retry Extraction
                  </button>
                )}
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
          {/* LEFT: Resume */}
          <div className="bg-[#001f2e] border border-[#063750] rounded-xl p-6 space-y-6 flex flex-col">
            <h2 className="text-xl font-semibold text-white flex items-center gap-2">
              <FileText className="w-6 h-6 text-[#FF4103]" />
              Source Evidence
            </h2>
            
            {!resumeData && !extracting ? (
              <form onSubmit={handleUpload} className="space-y-4">
                <div className="border-2 border-dashed border-[#002f47] rounded-lg p-8 text-center hover:border-[#FF4103] transition-colors cursor-pointer">
                  <input
                    type="file"
                    accept=".pdf,.docx,.txt"
                    onChange={(e) => setFile(e.target.files?.[0] || null)}
                    className="hidden"
                    id="resume-upload"
                  />
                  <label htmlFor="resume-upload" className="cursor-pointer flex flex-col items-center">
                    <Upload className="w-12 h-12 text-slate-500 mb-4" />
                    <span className="text-slate-300 font-medium">{file ? file.name : 'Upload Resume Document'}</span>
                  </label>
                </div>
                <button
                  type="submit"
                  disabled={!file || uploading}
                  className="w-full py-3 px-4 bg-[#FF4103] hover:bg-brand-700 text-white rounded-lg font-semibold disabled:opacity-50"
                >
                  {uploading ? 'Uploading...' : 'Extract Evidence'}
                </button>
              </form>
            ) : extracting ? (
              <div className="flex-1 flex flex-col items-center justify-center text-[#FF4103] space-y-4 py-12">
                <div className="w-8 h-8 border-4 border-[#FF4103] border-t-transparent rounded-full animate-spin" />
                <p>Analyzing document context...</p>
              </div>
            ) : (
              <div className="space-y-4 flex-1">
                <div className="p-3 bg-green-950/30 border border-green-900/50 rounded-lg flex items-center gap-2 text-green-400 text-sm">
                  <CheckCircle2 className="w-4 h-4" /> Evidence successfully extracted
                </div>
                {resumeData.skills && (
                  <div>
                    <h3 className="text-sm font-semibold text-slate-400 uppercase mb-2">Verified Skills</h3>
                    <div className="flex flex-wrap gap-2">
                      {resumeData.skills.map((skill: string, i: number) => (
                        <span key={i} className="px-2 py-1 bg-slate-800 text-slate-300 rounded text-sm border border-[#002f47]">
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* RIGHT: JD */}
          <div className="bg-[#001f2e] border border-[#063750] rounded-xl p-6 space-y-6 flex flex-col">
            <h2 className="text-xl font-semibold text-white flex items-center gap-2">
              <Briefcase className="w-6 h-6 text-[#FF4103]" />
              Target Requirements
            </h2>

            {!jdData && !jdAnalyzing ? (
              <form onSubmit={handleJDAnalyze} className="space-y-4 flex-1 flex flex-col">
                <textarea 
                  value={jdText}
                  onChange={(e) => setJdText(e.target.value)}
                  placeholder="Paste Job Description here..."
                  className="flex-1 w-full p-4 bg-[#001621] border border-[#002f47] rounded-lg text-slate-300 focus:outline-none focus:border-[#FF4103] resize-none min-h-[200px]"
                />
                <button
                  type="submit"
                  disabled={!jdText.trim()}
                  className="w-full py-3 px-4 bg-[#FF4103] hover:bg-brand-700 text-white rounded-lg font-semibold disabled:opacity-50"
                >
                  Analyze Job Description
                </button>
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
                  <ul className="space-y-2">
                    {jdData.requirements.map((req: any, i: number) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-slate-300 p-2 bg-[#001621] rounded border border-[#063750]">
                        <ChevronRight className="w-4 h-4 mt-0.5 text-slate-500" />
                        <span>{req.requirement} {req.mandatory && <span className="text-red-400 text-xs font-bold ml-1">REQUIRED</span>}</span>
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
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                <Bot className="w-8 h-8 text-[#FF4103]" />
                ATS & Match Analysis
              </h2>
              {!matchData && !matchRunning && (
                <button
                  onClick={handleMatch}
                  className="px-6 py-3 bg-[#FF4103] hover:bg-brand-700 text-white rounded-lg font-semibold"
                >
                  Run Intelligence Match
                </button>
              )}
            </div>

            {matchRunning && (
              <div className="flex flex-col items-center justify-center text-[#FF4103] space-y-4 py-12">
                <div className="w-8 h-8 border-4 border-[#FF4103] border-t-transparent rounded-full animate-spin" />
                <p>Correlating evidence against requirements...</p>
              </div>
            )}

            {matchData && (
              <div className="space-y-8">
                {/* ATS Score */}
                <div className="flex items-center gap-4 p-4 bg-[#001621] border border-[#063750] rounded-lg">
                  <div className="text-4xl font-bold text-white">{matchData.ats_score}<span className="text-lg text-slate-500">/100</span></div>
                  <div>
                    <h3 className="font-semibold text-white">Parseability & Alignment</h3>
                    <p className="text-sm text-slate-400">Derived objectively from evidence overlap.</p>
                  </div>
                </div>

                {/* Gap Analysis */}
                <div>
                  <h3 className="text-lg font-semibold text-white mb-4">Evidence Gap Analysis</h3>
                  <div className="space-y-3">
                    {matchData.gap_analysis?.map((gap: any, i: number) => (
                      <div key={i} className="p-4 bg-[#001621] border border-[#063750] rounded-lg">
                        <div className="flex items-start gap-3">
                          {getStatusIcon(gap.status)}
                          <div>
                            <p className="font-medium text-slate-200">{gap.requirement}</p>
                            {gap.candidate_evidence && (
                              <p className="text-sm text-slate-400 mt-1"><span className="text-[#FF4103] font-semibold">Evidence:</span> {gap.candidate_evidence}</p>
                            )}
                            <p className="text-sm text-slate-500 mt-2 bg-[#001f2e] p-2 rounded">{gap.explanation}</p>
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
                      Warning: Generated wording does not establish new experience. Verify suggestions against your actual work history.
                    </div>
                    <div className="space-y-4" role="group" aria-label="Optimization Suggestions">
                      {matchData.improvement_suggestions.map((sugg: any, i: number) => (
                        <div key={i} className="flex gap-4 p-4 bg-[#001621] border border-[#063750] rounded-lg items-start">
                          <label className="sr-only" htmlFor={`opt-sugg-${i}`}>Accept suggestion {i+1}</label>
                          <input type="checkbox" id={`opt-sugg-${i}`} className="mt-1 w-5 h-5 rounded border-[#002f47] bg-slate-800 text-brand-600 focus:ring-[#FF4103] focus:ring-offset-slate-950" 
                                 checked={acceptedSuggestions.has(i)} onChange={() => toggleSuggestion(i)} />
                          <div className="grid md:grid-cols-2 gap-4 flex-1">
                            <div>
                              <span className="text-xs font-bold text-slate-500 uppercase">Original Evidence</span>
                              <p className="text-sm text-slate-400 mt-1">{sugg.source_evidence}</p>
                            </div>
                            <div>
                              <span className="text-xs font-bold text-[#FF4103] uppercase">Suggested Rewrite</span>
                              <p className="text-sm text-slate-200 mt-1">{sugg.suggested_text}</p>
                              <p className="text-xs text-slate-500 mt-2 italic">{sugg.rationale}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                    {acceptedSuggestions.size > 0 && !optimizedResumeId && (
                      <div className="mt-6">
                        <button onClick={applyOptimizations} disabled={optimizing} className="px-6 py-3 bg-yellow-600 hover:bg-yellow-700 disabled:opacity-50 text-white rounded-lg font-semibold focus:ring-2 focus:ring-yellow-500">
                          {optimizing ? 'Generating New Version...' : `Apply ${acceptedSuggestions.size} Optimizations (Creates v2)`}
                        </button>
                      </div>
                    )}
                    {optimizedResumeId && (
                      <div className="mt-6 p-4 bg-green-950/30 border border-green-900/50 rounded-lg flex items-center gap-3 text-green-400" role="status">
                        <CheckCircle2 className="w-5 h-5" aria-hidden="true" />
                        <span>Successfully created new resume version!</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}



