import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Upload, FileText, Bot, AlertCircle, CheckCircle2, LayoutDashboard } from 'lucide-react';

export default function Resume() {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [extracting, setExtracting] = useState(false);
  const [resumeData, setResumeData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;

    setUploading(true);
    setError(null);
    setResumeData(null);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch('/api/resume/upload', {
        method: 'POST',
        body: formData,
      });

      const data = (await res.json()) as any;
      if (!res.ok) throw new Error(data.error || 'Upload failed');

      setUploading(false);
      setExtracting(true);

      // Chain the extraction
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

  return (
    <div className="min-h-screen bg-slate-950 p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-white flex items-center gap-3">
            <FileText className="w-8 h-8 text-brand-500" />
            Resume Intelligence
          </h1>
          <button 
            onClick={() => navigate('/dashboard')}
            className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg transition-colors"
          >
            <LayoutDashboard className="w-4 h-4" />
            Back to Dashboard
          </button>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
            <h2 className="text-xl font-semibold text-white mb-4">Upload Document</h2>
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
                  <span className="text-slate-300 font-medium">{file ? file.name : 'Click to select resume'}</span>
                  <span className="text-slate-500 text-sm mt-2">PDF, DOCX, or TXT up to 5MB</span>
                </label>
              </div>
              <button
                type="submit"
                disabled={!file || uploading || extracting}
                className="w-full py-3 px-4 bg-brand-600 hover:bg-brand-700 text-white rounded-lg font-semibold disabled:opacity-50 transition-colors"
              >
                {uploading ? 'Uploading...' : extracting ? 'Extracting via AI...' : 'Analyze Resume'}
              </button>
            </form>

            {error && (
              <div className="mt-4 p-4 bg-red-950/50 border border-red-900 rounded-lg flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                <div className="text-red-200 text-sm">
                  <p className="font-semibold text-red-400">Error</p>
                  {error}
                </div>
              </div>
            )}
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
            <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
              <Bot className="w-6 h-6 text-brand-500" />
              Intelligence Engine
            </h2>
            
            {!resumeData && !extracting && (
              <div className="h-48 flex items-center justify-center text-slate-500 border border-dashed border-slate-800 rounded-lg">
                Waiting for document...
              </div>
            )}

            {extracting && (
              <div className="h-48 flex flex-col items-center justify-center text-brand-400 space-y-4">
                <div className="w-8 h-8 border-4 border-brand-500 border-t-transparent rounded-full animate-spin" />
                <p>Analyzing context and establishing provenance lineage...</p>
              </div>
            )}

            {resumeData && (
              <div className="space-y-4">
                <div className="p-3 bg-green-950/30 border border-green-900/50 rounded-lg flex items-center gap-2 text-green-400 text-sm">
                  <CheckCircle2 className="w-4 h-4" />
                  Successfully extracted and normalized
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

                {resumeData.provenance && (
                  <div className="mt-6 pt-4 border-t border-slate-800">
                    <h3 className="text-xs font-semibold text-slate-500 uppercase mb-2">Provenance Lineage</h3>
                    <pre className="text-xs text-slate-400 bg-slate-950 p-3 rounded overflow-x-auto border border-slate-800">
                      {JSON.stringify(resumeData.provenance, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
