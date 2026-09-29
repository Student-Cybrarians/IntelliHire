import { useEffect, useState } from 'react';
import { Users, AlertCircle, Briefcase, Plus, ChevronRight, FileText } from 'lucide-react';

export default function RecruiterWorkspace() {
  const [stats, setStats] = useState<any>(null);
  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // UI States
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);
  const [applications, setApplications] = useState<any[]>([]);
  const [loadingApps, setLoadingApps] = useState(false);

  // Form States
  const [newTitle, setNewTitle] = useState('');
  const [newDept, setNewDept] = useState('');
  const [newDesc, setNewDesc] = useState('');

  const fetchJobs = () => {
    fetch('/api/requisitions')
      .then(res => res.json())
      .then((data: any) => {
        if (data.success) setJobs(data.requisitions);
      });
  };

  useEffect(() => {
    fetch('/api/dashboard/recruiter')
      .then(res => res.json())
      .then((data: any) => {
        if (data.error) setError(data.error);
        else setStats(data.pipeline_stats);
        setLoading(false);
      })
      .catch(err => {
        setError('Failed to load recruiter stats.');
        setLoading(false);
      });

    fetchJobs();
  }, []);

  const handleCreateJob = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle) return;
    try {
      const res = await fetch('/api/requisitions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: newTitle, department: newDept, description: newDesc })
      });
      const data = await res.json() as any;
      if (data.success) {
        setShowCreateForm(false);
        setNewTitle(''); setNewDept(''); setNewDesc('');
        fetchJobs();
      } else {
        alert(data.error);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSelectJob = async (id: string) => {
    setSelectedJobId(id);
    setLoadingApps(true);
    setApplications([]);
    try {
      const res = await fetch(`/api/requisitions/${id}/applications`);
      const data = await res.json() as any;
      if (data.success) {
        setApplications(data.applications);
      }
    } catch (err) {
      console.error(err);
    }
    setLoadingApps(false);
  };

  const updateApplicationStatus = async (appId: string, newStatus: string) => {
    try {
      const res = await fetch(`/api/applications/${appId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
      const data = await res.json() as any;
      if (data.success) {
        // Optimistically update UI
        setApplications(apps => apps.map(a => a.id === appId ? { ...a, status: newStatus } : a));
      } else {
        alert(data.error || 'Failed to update status');
      }
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) return <div className="text-white">Loading pipeline data...</div>;

  if (error) return (
    <div className="bg-red-500/10 border border-red-500/20 p-6 rounded-xl flex items-start gap-4">
      <AlertCircle className="w-6 h-6 text-red-400 flex-shrink-0" />
      <div>
        <h3 className="text-red-400 font-semibold">Access Denied or Error</h3>
        <p className="text-red-300 text-sm mt-1">{error}</p>
      </div>
    </div>
  );

  return (
    <div>
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Recruiter Workspace</h1>
        <p className="text-slate-400">Manage job requisitions and review AI-scored candidate pipelines.</p>
      </header>
      
      <div className="grid md:grid-cols-12 gap-8">
        
        {/* LEFT COLUMN: Jobs */}
        <div className="md:col-span-5 flex flex-col gap-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold text-white">Requisitions</h2>
            <button onClick={() => setShowCreateForm(!showCreateForm)} className="flex items-center gap-1 px-3 py-1.5 bg-brand-600 hover:bg-brand-500 text-white text-sm font-medium rounded-lg transition-colors">
              <Plus className="w-4 h-4" /> New Job
            </button>
          </div>

          {showCreateForm && (
            <form onSubmit={handleCreateJob} className="bg-slate-900 border border-slate-700 rounded-xl p-4 flex flex-col gap-3">
              <input required type="text" placeholder="Job Title" value={newTitle} onChange={e => setNewTitle(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-brand-500" />
              <input type="text" placeholder="Department" value={newDept} onChange={e => setNewDept(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-brand-500" />
              <textarea placeholder="Job Description (required for AI matching)" value={newDesc} onChange={e => setNewDesc(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-brand-500 min-h-[100px]" />
              <button type="submit" className="w-full py-2 bg-brand-600 hover:bg-brand-500 text-white font-medium rounded-lg transition-colors text-sm">Create Requisition</button>
            </form>
          )}

          <div className="flex flex-col gap-3">
            {jobs.length === 0 && !showCreateForm && <p className="text-slate-500 text-sm">No active requisitions.</p>}
            {jobs.map(job => (
              <button 
                key={job.id} 
                onClick={() => handleSelectJob(job.id)}
                className={`text-left p-4 rounded-xl border transition-all ${selectedJobId === job.id ? 'bg-slate-800 border-brand-500' : 'bg-slate-900 border-slate-800 hover:border-slate-600'}`}
              >
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-semibold text-white">{job.title}</h3>
                  <ChevronRight className={`w-5 h-5 ${selectedJobId === job.id ? 'text-brand-400' : 'text-slate-600'}`} />
                </div>
                <div className="flex gap-2">
                  <span className="px-2 py-0.5 bg-slate-950 rounded text-xs text-slate-400 border border-slate-800">{job.department}</span>
                  <span className="px-2 py-0.5 bg-slate-950 rounded text-xs text-slate-400 border border-slate-800">{job.status}</span>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* RIGHT COLUMN: Applications View */}
        <div className="md:col-span-7">
          {!selectedJobId ? (
            <div className="bg-slate-900/50 border border-slate-800 border-dashed rounded-xl p-12 flex flex-col items-center justify-center text-center">
              <Users className="w-12 h-12 text-slate-700 mb-4" />
              <h3 className="text-lg font-medium text-slate-300">Select a Requisition</h3>
              <p className="text-slate-500 text-sm max-w-sm mt-2">Click a job on the left to view incoming candidate applications and their AI Match Scores.</p>
            </div>
          ) : (
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
              <h2 className="text-xl font-semibold text-white mb-6">Candidate Pipeline</h2>
              
              {loadingApps ? (
                <div className="text-slate-400 py-8 text-center">Loading AI Evaluations...</div>
              ) : applications.length === 0 ? (
                <div className="text-slate-500 py-8 text-center border border-dashed border-slate-700 rounded-lg">No candidates have applied yet.</div>
              ) : (
                <div className="flex flex-col gap-4">
                  {applications.map(app => (
                    <div key={app.id} className="bg-slate-950 border border-slate-800 p-5 rounded-lg flex flex-col gap-4">
                      
                      {/* Top Row: Name and Score */}
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-semibold text-white text-lg">{app.full_name}</h4>
                          <a href={`mailto:${app.email}`} className="text-sm text-brand-400 hover:underline">{app.email}</a>
                          
                          <div className="mt-3">
                            <label className="text-xs text-slate-500 block mb-1">Pipeline Stage</label>
                            <select 
                              value={app.status || 'APPLIED'} 
                              onChange={(e) => updateApplicationStatus(app.id, e.target.value)}
                              className="bg-slate-900 border border-slate-700 text-slate-200 text-sm rounded-lg focus:ring-brand-500 focus:border-brand-500 block w-40 p-2"
                            >
                              <option value="APPLIED">Applied</option>
                              <option value="SCREENING">Screening</option>
                              <option value="INTERVIEW">Interview</option>
                              <option value="OFFER">Offer</option>
                              <option value="HIRED">Hired</option>
                              <option value="REJECTED">Rejected</option>
                            </select>
                          </div>
                        </div>
                        <div className="flex flex-col items-end">
                          <span className="text-xs text-slate-500 uppercase tracking-wider mb-1">Match Score</span>
                          <div className={`flex items-center justify-center w-12 h-12 rounded-full border-4 font-bold text-lg ${(app.match_score || 0) >= 75 ? 'border-green-500/20 text-green-400' : (app.match_score || 0) >= 50 ? 'border-amber-500/20 text-amber-400' : 'border-red-500/20 text-red-400'}`}>
                            {app.match_score || 0}
                          </div>
                        </div>
                      </div>

                      {/* AI Reasoning */}
                      <div className="bg-slate-900 p-4 rounded-md border border-slate-800 flex gap-3">
                        <FileText className="w-5 h-5 text-brand-500 flex-shrink-0 mt-0.5" />
                        <div>
                          <h5 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">AI Match Reasoning</h5>
                          <p className="text-slate-300 text-sm leading-relaxed">{app.match_reasoning || "Pending evaluation."}</p>
                        </div>
                      </div>
                      
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}