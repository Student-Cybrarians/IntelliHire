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
      if (!res.ok) throw new Error(data.error || 'Match analysis failed');

      setMatchData(data.data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setMatchRunning(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch(status) {
      case 'EVIDENCE_FOUND': return <CheckCircle2 className="w-5 h-5 text-green-500" />;
      case 'MISSING': return <XCircle className="w-5 h-5 text-red-500" />;
      case 'CONTRADICTORY': return <FileQuestion className="w-5 h-5 text-yellow-500" />;
      default: return <ChevronRight className="w-5 h-5 text-slate-500" />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-white flex items-center gap-3">
            <FileText className="w-8 h-8 text-brand-500" />
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
          <div className="p-4 bg-red-950/50 border border-red-900 rounded-lg flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
            <div className="text-red-200 text-sm">
              <p className="font-semibold text-red-400">Error</p>
              {error}
            </div>
          </div>
        )}

        <div className="grid lg:grid-cols-2 gap-6">
          {/* LEFT: Resume */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-6 flex flex-col">
            <h2 className="text-xl font-semibold text-white flex items-center gap-2">
              <FileText className="w-6 h-6 text-brand-500" />
              Source Evidence
            </h2>
            
            {!resumeData && !extracting ? (
              <form onSubmit={handleUpload} className="space-y-4">
                <div className="border-2 border-dashed border-slate-700 rounded-lg p-8 text-center hover:border-brand-500 transition-colors cursor-pointer">
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
                  className="w-full py-3 px-4 bg-brand-600 hover:bg-brand-700 text-white rounded-lg font-semibold disabled:opacity-50"
                >
                  {uploading ? 'Uploading...' : 'Extract Evidence'}
                </button>
              </form>
            ) : extracting ? (
              <div className="flex-1 flex flex-col items-center justify-center text-brand-400 space-y-4 py-12">
                <div className="w-8 h-8 border-4 border-brand-500 border-t-transparent rounded-full animate-spin" />
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
                        <span key={i} className="px-2 py-1 bg-slate-800 text-slate-300 rounded text-sm border border-slate-700">
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
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-6 flex flex-col">
            <h2 className="text-xl font-semibold text-white flex items-center gap-2">
              <Briefcase className="w-6 h-6 text-brand-500" />
              Target Requirements
            </h2>

            {!jdData && !jdAnalyzing ? (
              <form onSubmit={handleJDAnalyze} className="space-y-4 flex-1 flex flex-col">
                <textarea 
                  value={jdText}
                  onChange={(e) => setJdText(e.target.value)}
                  placeholder="Paste Job Description here..."
                  className="flex-1 w-full p-4 bg-slate-950 border border-slate-700 rounded-lg text-slate-300 focus:outline-none focus:border-brand-500 resize-none min-h-[200px]"
                />
                <button
                  type="submit"
                  disabled={!jdText.trim()}
                  className="w-full py-3 px-4 bg-brand-600 hover:bg-brand-700 text-white rounded-lg font-semibold disabled:opacity-50"
                >
                  Analyze Job Description
                </button>
              </form>
            ) : jdAnalyzing ? (
              <div className="flex-1 flex flex-col items-center justify-center text-brand-400 space-y-4 py-12">
                <div className="w-8 h-8 border-4 border-brand-500 border-t-transparent rounded-full animate-spin" />
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
                      <li key={i} className="flex items-start gap-2 text-sm text-slate-300 p-2 bg-slate-950 rounded border border-slate-800">
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
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                <Bot className="w-8 h-8 text-brand-500" />
                ATS & Match Analysis
              </h2>
              {!matchData && !matchRunning && (
                <button
                  onClick={handleMatch}
                  className="px-6 py-3 bg-brand-600 hover:bg-brand-700 text-white rounded-lg font-semibold"
                >
                  Run Intelligence Match
                </button>
              )}
            </div>

            {matchRunning && (
              <div className="flex flex-col items-center justify-center text-brand-400 space-y-4 py-12">
                <div className="w-8 h-8 border-4 border-brand-500 border-t-transparent rounded-full animate-spin" />
                <p>Correlating evidence against requirements...</p>
              </div>
            )}

            {matchData && (
              <div className="space-y-8">
                {/* ATS Score */}
                <div className="flex items-center gap-4 p-4 bg-slate-950 border border-slate-800 rounded-lg">
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
                      <div key={i} className="p-4 bg-slate-950 border border-slate-800 rounded-lg">
                        <div className="flex items-start gap-3">
                          {getStatusIcon(gap.status)}
                          <div>
                            <p className="font-medium text-slate-200">{gap.requirement}</p>
                            {gap.candidate_evidence && (
                              <p className="text-sm text-slate-400 mt-1"><span className="text-brand-400 font-semibold">Evidence:</span> {gap.candidate_evidence}</p>
                            )}
                            <p className="text-sm text-slate-500 mt-2 bg-slate-900 p-2 rounded">{gap.explanation}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Improvements */}
                {matchData.improvement_suggestions && matchData.improvement_suggestions.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                      <Sparkles className="w-5 h-5 text-yellow-500" />
                      Actionable Improvements
                    </h3>
                    <div className="p-3 bg-yellow-950/20 border border-yellow-900/50 rounded-lg text-yellow-500 text-xs mb-4">
                      Warning: Generated wording does not establish new experience. Verify suggestions against your actual work history.
                    </div>
                    <div className="space-y-4">
                      {matchData.improvement_suggestions.map((sugg: any, i: number) => (
                        <div key={i} className="grid md:grid-cols-2 gap-4 p-4 bg-slate-950 border border-slate-800 rounded-lg">
                          <div>
                            <span className="text-xs font-bold text-slate-500 uppercase">Original Evidence</span>
                            <p className="text-sm text-slate-400 mt-1">{sugg.source_evidence}</p>
                          </div>
                          <div>
                            <span className="text-xs font-bold text-brand-500 uppercase">Suggested Rewrite</span>
                            <p className="text-sm text-slate-200 mt-1">{sugg.suggested_text}</p>
                            <p className="text-xs text-slate-500 mt-2 italic">{sugg.rationale}</p>
                          </div>
                        </div>
                      ))}
                    </div>
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
