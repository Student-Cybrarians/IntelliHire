import { useState, useEffect } from 'react';
import { Briefcase, Users, Search, Plus, Filter, ArrowRight, CheckCircle2, AlertCircle, ChevronRight, Layers, Flame } from 'lucide-react';
import { Link } from 'react-router-dom';
import DashboardLayout from './dashboard/DashboardLayout';

export default function Module3Pipeline() {
  const [requisitions, setRequisitions] = useState<any[]>([]);
  const [selectedReq, setSelectedReq] = useState<any | null>(null);
  const [applications, setApplications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    async function fetchRequisitions() {
      try {
        const res = await fetch('/api/requisitions');
        const data: any = await res.json();
        if (data.success && data.requisitions) {
          setRequisitions(data.requisitions);
          if (data.requisitions.length > 0) {
            setSelectedReq(data.requisitions[0]);
            loadApplications(data.requisitions[0].id);
          }
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    fetchRequisitions();
  }, []);

  const loadApplications = async (reqId: string) => {
    try {
      const res = await fetch(`/api/requisitions/${reqId}/applications`);
      const data: any = await res.json();
      if (data.success) {
        setApplications(data.applications || []);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    setIsSearching(true);
    try {
      const res = await fetch(`/api/search/candidates?q=${encodeURIComponent(searchQuery)}`);
      const data: any = await res.json();
      if (data.success) {
        setSearchResults(data.results || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <DashboardLayout role="recruiter" userFullName="Recruiter / Talent Partner">
      <div className="space-y-8">
        
        {/* Header */}
        <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[#063750]">
          <div>
            <div className="flex items-center gap-2 text-[#FF4103] text-xs font-bold uppercase tracking-wider mb-2">
              <Layers className="w-4 h-4 text-[#FF4103]" />
              <span>Module 3 · Requisition & Match Orchestration</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
              Talent Pipeline & Candidate Match
            </h1>
            <p className="text-slate-300 text-sm mt-1">
              Multi-stage pipeline tracking powered by precomputed embedding similarity and verified evidence.
            </p>
          </div>

          <form onSubmit={handleSearch} className="flex relative w-full sm:w-80">
            <input
              type="text"
              placeholder="Semantic candidate search..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full bg-[#001824] border border-[#002f47] text-white text-xs px-4 py-2.5 rounded-l-xl focus:outline-none focus:border-[#FF4103]"
            />
            <button
              type="submit"
              disabled={isSearching}
              className="bg-[#FF4103] hover:bg-[#e03200] text-white px-4 py-2.5 rounded-r-xl font-bold text-xs"
            >
              {isSearching ? '...' : 'Search'}
            </button>
          </form>
        </header>

        {/* Search Results if active */}
        {searchResults.length > 0 && (
          <section className="bg-[#001f2e] border border-[#FF4103]/40 rounded-2xl p-6 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Search className="w-4 h-4 text-[#FF4103]" />
                <span>Semantic Search Candidates ({searchResults.length})</span>
              </h3>
              <button onClick={() => setSearchResults([])} className="text-xs text-slate-400 hover:text-white">Close</button>
            </div>
            <div className="grid md:grid-cols-2 gap-3">
              {searchResults.map((c, i) => (
                <div key={i} className="p-3.5 bg-[#001824] border border-[#002f47] rounded-xl flex justify-between items-center">
                  <div>
                    <h4 className="font-bold text-white text-sm">{c.full_name || 'Candidate'}</h4>
                    <p className="text-xs text-slate-400">{c.target_role || 'Specialist'} · {c.primary_domain || 'Domain'}</p>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-bold text-[#FF4103]">{(Number(c.similarity || 0.85) * 100).toFixed(0)}% Match</span>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Requisitions List & Active Pipeline */}
        <div className="grid lg:grid-cols-3 gap-6">
          
          {/* Requisitions Column */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400">Active Requisitions</h3>
              <span className="text-xs text-[#FF4103] font-semibold">{requisitions.length} Open</span>
            </div>

            <div className="space-y-3">
              {requisitions.length === 0 ? (
                <div className="p-6 bg-[#001f2e] border border-[#063750] rounded-xl text-center text-slate-400 text-xs">
                  No active requisitions found.
                </div>
              ) : (
                requisitions.map((req) => (
                  <button
                    key={req.id}
                    onClick={() => { setSelectedReq(req); loadApplications(req.id); }}
                    className={`w-full text-left p-4 rounded-xl border transition-all ${
                      selectedReq?.id === req.id
                        ? 'bg-[#001f2e] border-[#FF4103] shadow-md shadow-[#FF4103]/10'
                        : 'bg-[#001824] border-[#002f47] hover:border-slate-600'
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <h4 className="font-bold text-white text-sm">{req.title}</h4>
                      <span className="text-[10px] uppercase font-bold text-[#FF4103] bg-[#FF4103]/10 px-2 py-0.5 rounded">
                        {req.status}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 mt-1">{req.department || 'General'}</p>
                  </button>
                ))
              )}
            </div>
          </div>

          {/* Candidate Applications Pipeline */}
          <div className="lg:col-span-2 bg-[#001f2e] border border-[#063750] rounded-2xl p-6 shadow-lg">
            <div className="flex items-center justify-between pb-4 border-b border-[#002f47] mb-6">
              <div>
                <h3 className="text-lg font-bold text-white">
                  Applicants for {selectedReq?.title || 'Selected Requisition'}
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Stages: Applied &rarr; Screening (M1) &rarr; Assessment (M2) &rarr; Interview (M4) &rarr; Decision (M5)
                </p>
              </div>
              <span className="text-xs font-bold text-white bg-[#001824] px-3 py-1 rounded-lg border border-[#002f47]">
                {applications.length} Candidates
              </span>
            </div>

            {applications.length === 0 ? (
              <div className="py-16 text-center text-slate-400">
                <Users className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                <p className="text-sm font-semibold">No applications submitted yet for this role.</p>
                <p className="text-xs text-slate-500 mt-1">Candidates who apply via the job board will populate this pipeline.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {applications.map((app) => (
                  <div key={app.id} className="p-4 bg-[#001824] border border-[#002f47] rounded-xl flex items-center justify-between">
                    <div>
                      <h4 className="font-bold text-white text-sm">{app.candidate_name || 'Candidate Portfolio'}</h4>
                      <div className="flex items-center gap-2 mt-1 text-xs text-slate-400">
                        <span className="text-[#FF4103] font-semibold">Stage: {app.stage || 'Applied'}</span>
                        <span>·</span>
                        <span>ATS Match: {((app.match_score || 0.82) * 100).toFixed(0)}%</span>
                      </div>
                    </div>
                    <Link
                      to="/assess"
                      className="px-3 py-1.5 rounded-lg bg-[#FF4103]/15 border border-[#FF4103]/40 text-[#FF4103] hover:bg-[#FF4103] hover:text-white text-xs font-bold transition-all"
                    >
                      Inspect Evidence
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

      </div>
    </DashboardLayout>
  );
}
