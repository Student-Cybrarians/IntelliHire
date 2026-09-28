import { useState, useEffect } from 'react';
import { Bot, FileText, Code2, Users, CheckCircle } from 'lucide-react';

export default function Dashboard() {
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [resumeUploadSuccess, setResumeUploadSuccess] = useState(false);
  const [uploadError, setUploadError] = useState('');

  const uploadResume = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setUploadError('');
    setResumeUploadSuccess(false);

    const formData = new FormData();
    formData.append('resume', file);

    try {
      const response = await fetch('/api/resume/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Upload failed. File might be too large or invalid format.');
      }

      setResumeUploadSuccess(true);
    } catch (err: any) {
      setUploadError(err.message || 'An error occurred during upload.');
    } finally {
      setIsUploading(false);
    }
  };

  useEffect(() => {
    fetch('/api/profile')
      .then(res => res.json())
      .then((data: any) => {
        setProfile(data.profile);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return <div className="min-h-screen bg-slate-950 flex items-center justify-center text-white">Loading...</div>;
  }
  return (
    <div className="min-h-screen bg-slate-950 flex flex-col md:flex-row">
      
      {/* Sidebar Navigation */}
      <aside className="w-full md:w-64 bg-slate-900 border-r border-slate-800 p-6 flex flex-col">
        <div className="flex items-center gap-2 mb-10">
          <Bot className="w-8 h-8 text-brand-500" />
          <span className="text-xl font-bold tracking-tight text-slate-100">IntelliHire</span>
        </div>

        <nav className="flex-grow space-y-2">
          <a href="#" className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-brand-500/10 text-brand-400 font-medium">
            <CheckCircle className="w-5 h-5" />
            Command Center
          </a>
          <a href="#" className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 transition-colors">
            <FileText className="w-5 h-5" />
            Resume Studio
          </a>
          <a href="#" className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 transition-colors">
            <Code2 className="w-5 h-5" />
            Technical Sandbox
          </a>
          <a href="#" className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 transition-colors">
            <Users className="w-5 h-5" />
            Role-Play Studio
          </a>
        </nav>

        <div className="pt-6 border-t border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-slate-300 font-semibold border border-slate-700">
              JD
            </div>
            <div>
              <p className="text-sm font-medium text-white">Jane Doe</p>
              <p className="text-xs text-slate-500">Candidate Profile</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-grow p-8 max-w-6xl mx-auto w-full">
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Welcome back, Jane.</h1>
          <p className="text-slate-400">Your readiness score is improving. Next step: Upload your resume for ATS analysis.</p>
        </header>

        {/* Readiness Score Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 mb-8 flex flex-col md:flex-row items-center gap-8">
          <div className="flex-shrink-0 relative">
            <svg className="w-32 h-32 transform -rotate-90">
              <circle cx="64" cy="64" r="56" stroke="currentColor" strokeWidth="12" fill="transparent" className="text-slate-800" />
              <circle cx="64" cy="64" r="56" stroke="currentColor" strokeWidth="12" fill="transparent" strokeDasharray="351.85" strokeDashoffset="105.55" className="text-brand-500 transition-all duration-1000 ease-out" />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-3xl font-bold text-white">{profile?.readiness_score ? `${(profile.readiness_score * 100).toFixed(0)}%` : '0%'}</span>
            </div>
          </div>
          <div className="flex-grow">
            <h2 className="text-xl font-semibold text-white mb-2">Target Role Readiness</h2>
            <p className="text-slate-400 mb-4 max-w-lg">Based on your onboarding, we estimate your readiness for a Mid-Level Software Engineer role. Complete modules to increase confidence and unlock recruiter visibility.</p>
            <div className="flex gap-4">
              <span className="px-3 py-1 rounded-full bg-slate-800 border border-slate-700 text-xs font-medium text-slate-300">Target: {profile?.target_role || 'Not set'}</span>
              <span className="px-3 py-1 rounded-full bg-slate-800 border border-slate-700 text-xs font-medium text-slate-300">Level: {profile?.experience_level || 'Not set'}</span>
            </div>
          </div>
        </div>

        <h2 className="text-xl font-semibold text-white mb-4">Required Actions</h2>
        
        <div className="grid md:grid-cols-2 gap-6">
          {/* Action Module 1 */}
          <div className="bg-slate-900/50 border border-slate-800 hover:border-slate-700 rounded-xl p-6 transition-colors flex flex-col">
            <div className="w-12 h-12 bg-sky-500/10 rounded-lg flex items-center justify-center mb-4">
              <FileText className="w-6 h-6 text-sky-400" />
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">Resume Intelligence</h3>
            <p className="text-slate-400 text-sm mb-4 flex-grow">Upload your resume to extract your skills, analyze ATS friendliness, and map your profile.</p>
            
            {uploadError && <div className="text-red-400 text-sm mb-3">{uploadError}</div>}
            
            {resumeUploadSuccess ? (
              <div className="flex items-center justify-center gap-2 w-full py-2.5 bg-emerald-500/20 text-emerald-400 font-medium rounded-lg">
                <CheckCircle className="w-5 h-5" />
                Upload Successful
              </div>
            ) : (
              <div className="relative">
                <input 
                  type="file" 
                  accept=".pdf,.docx,.txt,.tex" 
                  onChange={uploadResume} 
                  disabled={isUploading}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed" 
                />
                <button 
                  disabled={isUploading}
                  className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-white font-medium rounded-lg transition-colors flex items-center justify-center"
                >
                  {isUploading ? 'Extracting and Analyzing...' : 'Upload Resume'}
                </button>
              </div>
            )}
          </div>

          {/* Action Module 2 */}
          <div className="bg-slate-900/50 border border-slate-800 hover:border-slate-700 rounded-xl p-6 transition-colors">
            <div className="w-12 h-12 bg-brand-500/10 rounded-lg flex items-center justify-center mb-4">
              <Target className="w-6 h-6 text-brand-500" />
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">Adaptive Blueprint</h3>
            <p className="text-slate-400 text-sm mb-6 h-10">Take the initial 15-minute adaptive CAT assessment to identify your knowledge gaps.</p>
            <button className="w-full py-2.5 bg-brand-600 hover:bg-brand-500 text-white font-medium rounded-lg transition-colors opacity-50 cursor-not-allowed">
              Requires Resume First
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}

// Temporary inline import for missing icon in this file
function Target(props: any) {
  return <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>
}
