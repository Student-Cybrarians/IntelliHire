import { useEffect, useState } from 'react';
import { Users, AlertCircle } from 'lucide-react';

export default function RecruiterWorkspace() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
  }, []);

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
        <h1 className="text-3xl font-bold text-white mb-2">Pipeline Overview</h1>
        <p className="text-slate-400">Manage candidates and view readiness analytics across all active requisitions.</p>
      </header>

      <div className="grid md:grid-cols-3 gap-6 mb-8">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
          <div className="flex items-center gap-3 mb-2 text-slate-400">
            <Users className="w-5 h-5" />
            <h3 className="font-medium">Total Candidates</h3>
          </div>
          <p className="text-3xl font-bold text-white">{stats?.total_candidates || 0}</p>
        </div>
        
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
          <div className="flex items-center gap-3 mb-2 text-brand-400">
            <AlertCircle className="w-5 h-5" />
            <h3 className="font-medium">Needs Review</h3>
          </div>
          <p className="text-3xl font-bold text-white">{stats?.needs_review || 0}</p>
        </div>
      </div>
      
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
        <h2 className="text-xl font-semibold text-white mb-4">Active Requisitions</h2>
        <div className="text-slate-500 text-sm py-8 text-center border border-dashed border-slate-700 rounded-lg">
          No active requisitions assigned to you.
        </div>
      </div>
    </div>
  );
}

