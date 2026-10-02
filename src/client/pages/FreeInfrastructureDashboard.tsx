import { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Server,
  Database,
  Layers,
  Search,
  ExternalLink,
  RefreshCw,
  Filter,
  X,
  Shield,
  AlertTriangle,
  CheckCircle2,
  FolderTree,
  Brain,
  FileText,
  Video,
  BarChart3,
  Cloud,
  ChevronLeft,
  ChevronRight,
  Info,
  GitBranch,
  Terminal,
  Code2
} from 'lucide-react';
import DashboardLayout from './dashboard/DashboardLayout';

interface FreeService {
  id: string;
  provider_name: string | null;
  service_name: string;
  category: string;
  subcategory: string | null;
  official_url: string | null;
  source_url: string;
  description: string;
  free_tier_description: string | null;
  free_tier_type: string;
  storage_limit: string | null;
  request_limit: string | null;
  compute_limit: string | null;
  bandwidth_limit: string | null;
  retention_limit: string | null;
  user_limit: string | null;
  project_limit: string | null;
  api_limit: string | null;
  credit_card_required: number | null;
  trial_only: number | null;
  open_source: number | null;
  self_hostable: number | null;
  commercial_use: number | null;
  production_allowed: number | null;
  api_available: number | null;
  sdk_available: number | null;
  webhook_available: number | null;
  intellihire_modules_json: string;
  capability_tags_json: string;
  priority: 'critical' | 'high' | 'medium' | 'low';
  risk_level: 'low' | 'medium' | 'high';
  verification_status: 'unverified' | 'verified';
  source_provenance_json: string;
}

interface SummaryData {
  total_services: number;
  total_categories: number;
  modules: {
    M1: number;
    M2: number;
    M3: number;
    M4: number;
    M5: number;
    shared: number;
  };
  traits: {
    open_source: number;
    self_hostable: number;
    always_free: number;
    no_credit_card: number;
  };
  last_sync: {
    synced_at: string;
    services_count: number;
    categories_count: number;
    status: string;
  } | null;
}

interface ServiceDetail {
  id: string;
  source_data: {
    service_name: string;
    provider_name: string | null;
    category: string;
    subcategory: string | null;
    official_url: string | null;
    source_url: string;
    description: string;
    free_tier_description: string | null;
    free_tier_type: string;
    limits: {
      storage: string | null;
      requests: string | null;
      compute: string | null;
      bandwidth: string | null;
      retention: string | null;
      users: string | null;
      projects: string | null;
      api: string | null;
    };
    disclosed_flags: {
      credit_card_required: number | null;
      trial_only: number | null;
      open_source: number | null;
      self_hostable: number | null;
      commercial_use: number | null;
      production_allowed: number | null;
      api_available: number | null;
      sdk_available: number | null;
      webhook_available: number | null;
    };
  };
  intellihire_mapping: {
    modules: string[];
    capability_tags: string[];
    priority: string;
    risk_level: string;
    verification_status: string;
    recommended_role: string;
  };
  provenance: {
    source: string;
    repository: string;
    file: string;
    commit: string;
    retrievedAt?: string;
    sourceUrl?: string;
  };
}

export default function FreeInfrastructureDashboard() {
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [summary, setSummary] = useState<SummaryData | null>(null);
  const [services, setServices] = useState<FreeService[]>([]);
  const [categories, setCategories] = useState<{ category: string; count: number }[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit] = useState(24);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [syncMessage, setSyncMessage] = useState<string | null>(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedModule, setSelectedModule] = useState('all');
  const [selectedTierType, setSelectedTierType] = useState('all');
  const [selectedPriority, setSelectedPriority] = useState('all');
  const [filterOpenSource, setFilterOpenSource] = useState(false);
  const [filterSelfHostable, setFilterSelfHostable] = useState(false);
  const [filterNoCard, setFilterNoCard] = useState(false);

  // Detail Modal / Drawer
  const [selectedServiceId, setSelectedServiceId] = useState<string | null>(null);
  const [serviceDetail, setServiceDetail] = useState<ServiceDetail | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  // Auth fetch
  useEffect(() => {
    fetch('/api/auth/me')
      .then(res => res.json())
      .then((data: any) => {
        if (data.user) setCurrentUser(data.user);
      })
      .catch(() => {});
  }, []);

  // Fetch summary & categories
  const fetchSummaryAndCategories = useCallback(async () => {
    try {
      const [sumRes, catRes] = await Promise.all([
        fetch('/api/free-infrastructure/summary'),
        fetch('/api/free-infrastructure/categories'),
      ]);
      if (sumRes.ok) {
        const sumData = await sumRes.json() as any;
        setSummary(sumData.summary);
      }
      if (catRes.ok) {
        const catData = await catRes.json() as any;
        setCategories(catData.categories || []);
      }
    } catch (e) {
      console.error('Failed to load summary', e);
    }
  }, []);

  useEffect(() => {
    fetchSummaryAndCategories();
  }, [fetchSummaryAndCategories]);

  // Fetch services with active filters
  const fetchServices = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: String(limit),
      });

      if (searchQuery.trim()) params.set('q', searchQuery.trim());
      if (selectedCategory !== 'all') params.set('category', selectedCategory);
      if (selectedModule !== 'all') params.set('module', selectedModule);
      if (selectedTierType !== 'all') params.set('free_tier_type', selectedTierType);
      if (selectedPriority !== 'all') params.set('priority', selectedPriority);
      if (filterOpenSource) params.set('open_source', '1');
      if (filterSelfHostable) params.set('self_hostable', '1');
      if (filterNoCard) params.set('no_credit_card', '1');

      const res = await fetch(`/api/free-infrastructure/services?${params.toString()}`);
      if (res.ok) {
        const data = await res.json() as any;
        setServices(data.services || []);
        setTotal(data.total || 0);
      }
    } catch (e) {
      console.error('Failed to fetch services', e);
    } finally {
      setLoading(false);
    }
  }, [page, limit, searchQuery, selectedCategory, selectedModule, selectedTierType, selectedPriority, filterOpenSource, filterSelfHostable, filterNoCard]);

  useEffect(() => {
    fetchServices();
  }, [fetchServices]);

  // Handle Sync
  const handleSync = async () => {
    setSyncing(true);
    setSyncMessage(null);
    try {
      const res = await fetch('/api/free-infrastructure/sync', { method: 'POST' });
      const data = await res.json() as any;
      if (res.ok) {
        setSyncMessage(`Successfully synced ${data.services_count} services across ${data.categories_count} categories!`);
        await fetchSummaryAndCategories();
        await fetchServices();
      } else {
        setSyncMessage(`Sync failed: ${data.error || 'Server error'}`);
      }
    } catch (e: any) {
      setSyncMessage(`Sync error: ${e.message}`);
    } finally {
      setSyncing(false);
      setTimeout(() => setSyncMessage(null), 5000);
    }
  };

  // Open Service Detail
  const handleOpenDetail = async (id: string) => {
    setSelectedServiceId(id);
    setLoadingDetail(true);
    try {
      const res = await fetch(`/api/free-infrastructure/services/${encodeURIComponent(id)}`);
      if (res.ok) {
        const data = await res.json() as any;
        setServiceDetail(data);
      }
    } catch (e) {
      console.error('Failed to fetch service detail', e);
    } finally {
      setLoadingDetail(false);
    }
  };

  const handleCloseDetail = () => {
    setSelectedServiceId(null);
    setServiceDetail(null);
  };

  // Reset filters
  const handleResetFilters = () => {
    setSearchQuery('');
    setSelectedCategory('all');
    setSelectedModule('all');
    setSelectedTierType('all');
    setSelectedPriority('all');
    setFilterOpenSource(false);
    setFilterSelfHostable(false);
    setFilterNoCard(false);
    setPage(1);
  };

  const totalPages = Math.ceil(total / limit);

  // Badge helpers
  const getPriorityBadge = (p: string) => {
    switch (p) {
      case 'critical':
        return <span className="px-2 py-0.5 text-[10px] font-black uppercase rounded bg-rose-500/20 text-rose-400 border border-rose-500/40">Critical</span>;
      case 'high':
        return <span className="px-2 py-0.5 text-[10px] font-bold uppercase rounded bg-amber-500/20 text-amber-400 border border-amber-500/40">High</span>;
      case 'medium':
        return <span className="px-2 py-0.5 text-[10px] font-medium uppercase rounded bg-blue-500/20 text-blue-400 border border-blue-500/40">Medium</span>;
      default:
        return <span className="px-2 py-0.5 text-[10px] font-medium uppercase rounded bg-slate-500/20 text-slate-400 border border-slate-500/40">Low</span>;
    }
  };

  const getTierTypeBadge = (t: string) => {
    switch (t) {
      case 'always_free':
        return <span className="px-2 py-0.5 text-[10px] font-semibold rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">Always Free</span>;
      case 'open_source':
        return <span className="px-2 py-0.5 text-[10px] font-semibold rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">Open Source</span>;
      case 'credits':
        return <span className="px-2 py-0.5 text-[10px] font-semibold rounded bg-yellow-500/20 text-yellow-300 border border-yellow-500/30">Credits</span>;
      case 'free_trial':
        return <span className="px-2 py-0.5 text-[10px] font-semibold rounded bg-orange-500/20 text-orange-300 border border-orange-500/30">Free Trial</span>;
      case 'freemium':
        return <span className="px-2 py-0.5 text-[10px] font-semibold rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">Freemium</span>;
      default:
        return <span className="px-2 py-0.5 text-[10px] font-semibold rounded bg-slate-600/30 text-slate-400 border border-slate-600/40">Unknown</span>;
    }
  };

  const getModuleBadge = (mod: string) => {
    switch (mod) {
      case 'M1':
        return <span key={mod} className="px-2 py-0.5 text-[10px] font-bold rounded bg-[#FF4103]/20 text-[#FF4103] border border-[#FF4103]/30">M1 · Resume</span>;
      case 'M2':
        return <span key={mod} className="px-2 py-0.5 text-[10px] font-bold rounded bg-sky-500/20 text-sky-400 border border-sky-500/30">M2 · Assessment</span>;
      case 'M3':
        return <span key={mod} className="px-2 py-0.5 text-[10px] font-bold rounded bg-purple-500/20 text-purple-400 border border-purple-500/30">M3 · Pipeline</span>;
      case 'M4':
        return <span key={mod} className="px-2 py-0.5 text-[10px] font-bold rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">M4 · Interview</span>;
      case 'M5':
        return <span key={mod} className="px-2 py-0.5 text-[10px] font-bold rounded bg-amber-500/20 text-amber-400 border border-amber-500/30">M5 · Governance</span>;
      default:
        return <span key={mod} className="px-2 py-0.5 text-[10px] font-bold rounded bg-slate-500/20 text-slate-300 border border-slate-500/30">Shared Infra</span>;
    }
  };

  const renderDisclosedFlag = (val: number | null, trueText = 'Yes', falseText = 'No') => {
    if (val === 1) return <span className="text-emerald-400 font-semibold">{trueText}</span>;
    if (val === 0) return <span className="text-slate-400 font-normal">{falseText}</span>;
    return <span className="text-slate-500 italic">Not Disclosed / Unknown</span>;
  };

  return (
    <DashboardLayout role={currentUser?.role || 'candidate'} userFullName={currentUser?.full_name || 'IntelliHire Engineer'}>
      <div className="space-y-8 pb-16">
        
        {/* Header with Title and Sync action */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#063750] pb-6">
          <div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#FF4103] to-[#b82500] flex items-center justify-center shadow-lg shadow-[#FF4103]/20">
                <Server className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white flex items-center gap-2">
                  <span>Free Infrastructure Intelligence</span>
                  <span className="text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-[#FF4103]/15 text-[#FF4103] border border-[#FF4103]/30">
                    Phase 1
                  </span>
                </h1>
                <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
                  Live ingested service catalog from <a href="https://free-for.dev/" target="_blank" rel="noreferrer" className="text-slate-300 hover:text-[#FF4103] underline decoration-slate-600">free-for.dev</a> normalized and mapped to IntelliHire architecture
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleSync}
              disabled={syncing}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold bg-[#FF4103] hover:bg-[#e03200] text-white shadow-lg shadow-[#FF4103]/25 transition-all disabled:opacity-50"
              title="Fetch fresh catalog from ripienaar/free-for-dev"
            >
              <RefreshCw className={`w-4 h-4 ${syncing ? 'animate-spin' : ''}`} />
              <span>{syncing ? 'Syncing Catalog...' : 'Sync free-for.dev'}</span>
            </button>
            <a
              href="https://github.com/ripienaar/free-for-dev"
              target="_blank"
              rel="noreferrer"
              className="p-2 rounded-xl border border-[#063750] bg-[#001e2c] text-slate-300 hover:text-white hover:border-[#FF4103]/50 transition-all text-xs flex items-center gap-1.5"
              title="View Authoritative Source on GitHub"
            >
              <GitBranch className="w-4 h-4 text-slate-400" />
              <span className="hidden sm:inline">Source Repo</span>
            </a>
          </div>
        </div>

        {/* Sync Status Banner */}
        {syncMessage && (
          <div className={`p-4 rounded-xl text-sm flex items-center gap-3 ${syncMessage.includes('failed') || syncMessage.includes('error') ? 'bg-rose-500/15 border border-rose-500/30 text-rose-300' : 'bg-emerald-500/15 border border-emerald-500/30 text-emerald-300'}`}>
            <Info className="w-5 h-5 shrink-0" />
            <span>{syncMessage}</span>
          </div>
        )}

        {/* 8 Dynamic Summary Metric Cards */}
        {summary && (
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
            <div className="p-3.5 rounded-xl bg-[#001c2a] border border-[#063750] flex flex-col justify-between">
              <div className="flex items-center justify-between text-slate-400 text-xs">
                <span>Total Services</span>
                <Server className="w-4 h-4 text-[#FF4103]" />
              </div>
              <div className="mt-2 text-xl font-black text-white">{summary.total_services.toLocaleString()}</div>
              <div className="text-[10px] text-slate-400 mt-0.5">Catalog offerings</div>
            </div>

            <div className="p-3.5 rounded-xl bg-[#001c2a] border border-[#063750] flex flex-col justify-between">
              <div className="flex items-center justify-between text-slate-400 text-xs">
                <span>Categories</span>
                <FolderTree className="w-4 h-4 text-cyan-400" />
              </div>
              <div className="mt-2 text-xl font-black text-white">{summary.total_categories}</div>
              <div className="text-[10px] text-slate-400 mt-0.5">Dev capabilities</div>
            </div>

            <div className="p-3.5 rounded-xl bg-[#001c2a] border border-[#063750] flex flex-col justify-between">
              <div className="flex items-center justify-between text-slate-400 text-xs">
                <span>M1 · Resume</span>
                <FileText className="w-4 h-4 text-[#FF4103]" />
              </div>
              <div className="mt-2 text-xl font-black text-[#FF4103]">{summary.modules.M1}</div>
              <div className="text-[10px] text-slate-400 mt-0.5">OCR & parsing</div>
            </div>

            <div className="p-3.5 rounded-xl bg-[#001c2a] border border-[#063750] flex flex-col justify-between">
              <div className="flex items-center justify-between text-slate-400 text-xs">
                <span>M2 · Assess</span>
                <Brain className="w-4 h-4 text-sky-400" />
              </div>
              <div className="mt-2 text-xl font-black text-sky-400">{summary.modules.M2}</div>
              <div className="text-[10px] text-slate-400 mt-0.5">AI & sandboxes</div>
            </div>

            <div className="p-3.5 rounded-xl bg-[#001c2a] border border-[#063750] flex flex-col justify-between">
              <div className="flex items-center justify-between text-slate-400 text-xs">
                <span>M3 · Pipeline</span>
                <Database className="w-4 h-4 text-purple-400" />
              </div>
              <div className="mt-2 text-xl font-black text-purple-400">{summary.modules.M3}</div>
              <div className="text-[10px] text-slate-400 mt-0.5">DB & search</div>
            </div>

            <div className="p-3.5 rounded-xl bg-[#001c2a] border border-[#063750] flex flex-col justify-between">
              <div className="flex items-center justify-between text-slate-400 text-xs">
                <span>M4 · Interview</span>
                <Video className="w-4 h-4 text-emerald-400" />
              </div>
              <div className="mt-2 text-xl font-black text-emerald-400">{summary.modules.M4}</div>
              <div className="text-[10px] text-slate-400 mt-0.5">WebRTC & voice</div>
            </div>

            <div className="p-3.5 rounded-xl bg-[#001c2a] border border-[#063750] flex flex-col justify-between">
              <div className="flex items-center justify-between text-slate-400 text-xs">
                <span>M5 · Analytics</span>
                <BarChart3 className="w-4 h-4 text-amber-400" />
              </div>
              <div className="mt-2 text-xl font-black text-amber-400">{summary.modules.M5}</div>
              <div className="text-[10px] text-slate-400 mt-0.5">Logs & telemetry</div>
            </div>

            <div className="p-3.5 rounded-xl bg-[#001c2a] border border-[#063750] flex flex-col justify-between">
              <div className="flex items-center justify-between text-slate-400 text-xs">
                <span>Shared Infra</span>
                <Cloud className="w-4 h-4 text-slate-400" />
              </div>
              <div className="mt-2 text-xl font-black text-slate-200">{summary.modules.shared}</div>
              <div className="text-[10px] text-slate-400 mt-0.5">Auth & storage</div>
            </div>
          </div>
        )}

        {/* Filter Controls Bar */}
        <div className="p-4 rounded-2xl bg-[#001a27] border border-[#063750] space-y-4">
          <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center">
            {/* Search Input */}
            <div className="relative flex-grow">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                placeholder="Search services, providers, keywords (e.g. cloudflare, sqlite, ocr)..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setPage(1);
                }}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#00131d] border border-[#063750] text-sm text-white placeholder-slate-500 focus:outline-none focus:border-[#FF4103] transition-colors"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Category Dropdown */}
            <select
              value={selectedCategory}
              onChange={(e) => {
                setSelectedCategory(e.target.value);
                setPage(1);
              }}
              className="px-3 py-2.5 rounded-xl bg-[#00131d] border border-[#063750] text-xs sm:text-sm text-slate-200 focus:outline-none focus:border-[#FF4103]"
            >
              <option value="all">All Categories ({categories.length})</option>
              {categories.map((c) => (
                <option key={c.category} value={c.category}>
                  {c.category} ({c.count})
                </option>
              ))}
            </select>

            {/* Module Dropdown */}
            <select
              value={selectedModule}
              onChange={(e) => {
                setSelectedModule(e.target.value);
                setPage(1);
              }}
              className="px-3 py-2.5 rounded-xl bg-[#00131d] border border-[#063750] text-xs sm:text-sm text-slate-200 focus:outline-none focus:border-[#FF4103]"
            >
              <option value="all">All IntelliHire Modules</option>
              <option value="M1">M1 · Resume / Document Intelligence</option>
              <option value="M2">M2 · Adaptive Assessment & AI</option>
              <option value="M3">M3 · Requisition & Pipeline Data</option>
              <option value="M4">M4 · Interview Video & Streaming</option>
              <option value="M5">M5 · Talent Analytics & Auditing</option>
              <option value="shared">Shared Cloud Infrastructure</option>
            </select>

            {/* Free Tier Type Dropdown */}
            <select
              value={selectedTierType}
              onChange={(e) => {
                setSelectedTierType(e.target.value);
                setPage(1);
              }}
              className="px-3 py-2.5 rounded-xl bg-[#00131d] border border-[#063750] text-xs sm:text-sm text-slate-200 focus:outline-none focus:border-[#FF4103]"
            >
              <option value="all">All Tier Types</option>
              <option value="always_free">Always Free</option>
              <option value="freemium">Freemium</option>
              <option value="open_source">Open Source / Self-Hosted</option>
              <option value="credits">Credits / Grants</option>
              <option value="free_trial">Free Trial</option>
            </select>

            {/* Priority Dropdown */}
            <select
              value={selectedPriority}
              onChange={(e) => {
                setSelectedPriority(e.target.value);
                setPage(1);
              }}
              className="px-3 py-2.5 rounded-xl bg-[#00131d] border border-[#063750] text-xs sm:text-sm text-slate-200 focus:outline-none focus:border-[#FF4103]"
            >
              <option value="all">All Priorities</option>
              <option value="critical">Critical</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </div>

          {/* Quick Filter Chips */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-1 border-t border-[#063750]/50 text-xs">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-slate-400 font-medium">Quick Filters:</span>
              
              <button
                onClick={() => setFilterOpenSource(!filterOpenSource)}
                className={`px-3 py-1.5 rounded-lg font-medium transition-all ${filterOpenSource ? 'bg-indigo-500/25 text-indigo-300 border border-indigo-500/50' : 'bg-[#00131d] text-slate-400 border border-[#063750] hover:text-white'}`}
              >
                Open Source
              </button>

              <button
                onClick={() => setFilterSelfHostable(!filterSelfHostable)}
                className={`px-3 py-1.5 rounded-lg font-medium transition-all ${filterSelfHostable ? 'bg-indigo-500/25 text-indigo-300 border border-indigo-500/50' : 'bg-[#00131d] text-slate-400 border border-[#063750] hover:text-white'}`}
              >
                Self-Hostable
              </button>

              <button
                onClick={() => setFilterNoCard(!filterNoCard)}
                className={`px-3 py-1.5 rounded-lg font-medium transition-all ${filterNoCard ? 'bg-emerald-500/25 text-emerald-300 border border-emerald-500/50' : 'bg-[#00131d] text-slate-400 border border-[#063750] hover:text-white'}`}
              >
                No Credit Card Required
              </button>
            </div>

            <div className="flex items-center gap-3">
              <span className="text-slate-400">
                Found <strong className="text-white">{total.toLocaleString()}</strong> services
              </span>
              {(searchQuery || selectedCategory !== 'all' || selectedModule !== 'all' || selectedTierType !== 'all' || selectedPriority !== 'all' || filterOpenSource || filterSelfHostable || filterNoCard) && (
                <button
                  onClick={handleResetFilters}
                  className="text-xs text-[#FF4103] hover:underline"
                >
                  Reset Filters
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Services Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 9 }).map((_, i) => (
              <div key={i} className="h-56 rounded-2xl bg-[#001a27] border border-[#063750] animate-pulse p-5 space-y-3">
                <div className="h-6 w-1/2 bg-slate-800 rounded"></div>
                <div className="h-4 w-3/4 bg-slate-800 rounded"></div>
                <div className="h-16 w-full bg-slate-800 rounded"></div>
              </div>
            ))}
          </div>
        ) : services.length === 0 ? (
          <div className="text-center py-16 px-4 rounded-2xl bg-[#001824] border border-[#063750]">
            <Server className="w-12 h-12 text-slate-600 mx-auto mb-3" />
            <h3 className="text-lg font-bold text-white">No services match your filters</h3>
            <p className="text-sm text-slate-400 mt-1 max-w-md mx-auto">
              Try adjusting your search query, category selection, or resetting your filter toggles.
            </p>
            <button
              onClick={handleResetFilters}
              className="mt-4 px-4 py-2 rounded-xl text-xs font-bold bg-[#FF4103] text-white"
            >
              Clear All Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {services.map((service) => {
              const modules: string[] = JSON.parse(service.intellihire_modules_json || '[]');
              return (
                <div
                  key={service.id}
                  className="rounded-2xl bg-[#001a27] border border-[#063750] hover:border-[#FF4103]/50 transition-all p-5 flex flex-col justify-between group shadow-sm hover:shadow-lg"
                >
                  <div>
                    {/* Card Top: Badges */}
                    <div className="flex items-center justify-between gap-2 mb-2.5">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {getPriorityBadge(service.priority)}
                        {getTierTypeBadge(service.free_tier_type)}
                      </div>
                      <span className="text-[11px] font-medium text-slate-400 truncate max-w-[130px]">
                        {service.category}
                      </span>
                    </div>

                    {/* Title & Provider */}
                    <div className="mb-2">
                      <h3 className="text-base font-bold text-white group-hover:text-[#FF4103] transition-colors flex items-center justify-between">
                        <span>{service.service_name}</span>
                        {service.official_url && (
                          <a
                            href={service.official_url}
                            target="_blank"
                            rel="noreferrer"
                            className="text-slate-400 hover:text-white p-1 rounded transition-colors"
                            title={`Visit ${service.service_name}`}
                            onClick={(e) => e.stopPropagation()}
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        )}
                      </h3>
                      {service.provider_name && (
                        <p className="text-xs text-slate-400 font-medium">by {service.provider_name}</p>
                      )}
                    </div>

                    {/* Description */}
                    <p className="text-xs text-slate-300 line-clamp-3 mb-3 leading-relaxed">
                      {service.description}
                    </p>

                    {/* Key limits pills */}
                    <div className="flex flex-wrap gap-1.5 mb-3">
                      {service.storage_limit && (
                        <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-[#00283c] text-cyan-300 border border-cyan-500/20">
                          💾 {service.storage_limit}
                        </span>
                      )}
                      {service.request_limit && (
                        <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-[#00283c] text-amber-300 border border-amber-500/20">
                          ⚡ {service.request_limit}
                        </span>
                      )}
                      {service.compute_limit && (
                        <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-[#00283c] text-purple-300 border border-purple-500/20">
                          ⚙️ {service.compute_limit}
                        </span>
                      )}
                      {service.user_limit && (
                        <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-[#00283c] text-emerald-300 border border-emerald-500/20">
                          👥 {service.user_limit}
                        </span>
                      )}
                      {service.open_source === 1 && (
                        <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-indigo-500/15 text-indigo-300 border border-indigo-500/30">
                          OSS
                        </span>
                      )}
                      {service.credit_card_required === 0 && (
                        <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                          No CC
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Card Bottom: Module Mappings & Action */}
                  <div className="pt-3 border-t border-[#063750]/60 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1 flex-wrap">
                      {modules.map(getModuleBadge)}
                    </div>
                    <button
                      onClick={() => handleOpenDetail(service.id)}
                      className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-[#00273a] hover:bg-[#FF4103] text-slate-200 hover:text-white transition-all shrink-0"
                    >
                      Inspect Mapping
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Pagination Bar */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between gap-4 pt-4 border-t border-[#063750]">
            <p className="text-xs text-slate-400">
              Showing page <strong className="text-white">{page}</strong> of <strong className="text-white">{totalPages}</strong> ({total.toLocaleString()} total entries)
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-[#063750] bg-[#001e2c] text-xs font-semibold text-slate-200 hover:text-white disabled:opacity-40"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Prev</span>
              </button>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-[#063750] bg-[#001e2c] text-xs font-semibold text-slate-200 hover:text-white disabled:opacity-40"
              >
                <span>Next</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

      </div>

      {/* Slide-over / Modal Detail View */}
      {selectedServiceId && (
        <div
          className="fixed inset-0 z-50 overflow-hidden bg-black/70 backdrop-blur-sm flex justify-end"
          role="dialog"
          aria-modal="true"
          aria-label="Service Architecture Mapping"
          onClick={handleCloseDetail}
        >
          <div
            className="w-full max-w-2xl bg-[#001621] border-l border-[#063750] h-full overflow-y-auto p-6 sm:p-8 flex flex-col justify-between shadow-2xl space-y-6"
            onClick={(e) => e.stopPropagation()}
          >
            {loadingDetail || !serviceDetail ? (
              <div className="flex items-center justify-center h-64 text-slate-400 text-sm">
                <RefreshCw className="w-6 h-6 animate-spin text-[#FF4103] mr-2" />
                <span>Loading Architecture Details...</span>
              </div>
            ) : (
              <>
                <div className="space-y-6">
                  {/* Top Bar with Close button */}
                  <div className="flex items-start justify-between gap-4 border-b border-[#063750] pb-4">
                    <div>
                      <div className="flex items-center gap-2 mb-1.5">
                        {getPriorityBadge(serviceDetail.intellihire_mapping.priority)}
                        {getTierTypeBadge(serviceDetail.source_data.free_tier_type)}
                        <span className="text-xs text-slate-400">
                          Risk: <strong className={serviceDetail.intellihire_mapping.risk_level === 'high' ? 'text-rose-400' : 'text-emerald-400'}>{serviceDetail.intellihire_mapping.risk_level.toUpperCase()}</strong>
                        </span>
                      </div>
                      <h2 className="text-2xl font-black text-white flex items-center gap-2">
                        <span>{serviceDetail.source_data.service_name}</span>
                        {serviceDetail.source_data.official_url && (
                          <a
                            href={serviceDetail.source_data.official_url}
                            target="_blank"
                            rel="noreferrer"
                            className="text-[#FF4103] hover:text-white"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </a>
                        )}
                      </h2>
                      {serviceDetail.source_data.provider_name && (
                        <p className="text-xs text-slate-400">Provider: {serviceDetail.source_data.provider_name}</p>
                      )}
                    </div>
                    <button
                      onClick={handleCloseDetail}
                      className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-[#00273c]"
                      aria-label="Close dialog"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  {/* SECTION 1: SOURCE DATA (Strictly isolated from interpretation) */}
                  <div className="p-4 rounded-xl bg-[#001c2a] border border-[#063750] space-y-3">
                    <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-400 border-b border-[#063750] pb-2">
                      <FolderTree className="w-4 h-4 text-cyan-400" />
                      <span>1. Authoritative Source Data (free-for.dev)</span>
                    </div>

                    <div>
                      <div className="text-[11px] font-semibold text-slate-400">Category & Subcategory</div>
                      <div className="text-xs text-white">
                        {serviceDetail.source_data.category}
                        {serviceDetail.source_data.subcategory ? ` · ${serviceDetail.source_data.subcategory}` : ''}
                      </div>
                    </div>

                    <div>
                      <div className="text-[11px] font-semibold text-slate-400">Free Tier Specification</div>
                      <p className="text-xs text-slate-200 mt-0.5 bg-[#00141f] p-2.5 rounded-lg border border-[#063750]/60">
                        {serviceDetail.source_data.free_tier_description || serviceDetail.source_data.description}
                      </p>
                    </div>

                    {/* Extracted Quotas Grid */}
                    <div>
                      <div className="text-[11px] font-semibold text-slate-400 mb-1.5">Extracted Capacity Limits</div>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                        <div className="p-2 rounded bg-[#00141f] border border-[#063750]/50">
                          <span className="text-slate-400 block text-[10px]">Storage</span>
                          <span className="text-slate-200 font-semibold">{serviceDetail.source_data.limits.storage || 'Unspecified'}</span>
                        </div>
                        <div className="p-2 rounded bg-[#00141f] border border-[#063750]/50">
                          <span className="text-slate-400 block text-[10px]">Requests</span>
                          <span className="text-slate-200 font-semibold">{serviceDetail.source_data.limits.requests || 'Unspecified'}</span>
                        </div>
                        <div className="p-2 rounded bg-[#00141f] border border-[#063750]/50">
                          <span className="text-slate-400 block text-[10px]">Compute</span>
                          <span className="text-slate-200 font-semibold">{serviceDetail.source_data.limits.compute || 'Unspecified'}</span>
                        </div>
                        <div className="p-2 rounded bg-[#00141f] border border-[#063750]/50">
                          <span className="text-slate-400 block text-[10px]">Retention</span>
                          <span className="text-slate-200 font-semibold">{serviceDetail.source_data.limits.retention || 'Unspecified'}</span>
                        </div>
                        <div className="p-2 rounded bg-[#00141f] border border-[#063750]/50">
                          <span className="text-slate-400 block text-[10px]">Users / Seats</span>
                          <span className="text-slate-200 font-semibold">{serviceDetail.source_data.limits.users || 'Unspecified'}</span>
                        </div>
                        <div className="p-2 rounded bg-[#00141f] border border-[#063750]/50">
                          <span className="text-slate-400 block text-[10px]">Projects / Apps</span>
                          <span className="text-slate-200 font-semibold">{serviceDetail.source_data.limits.projects || 'Unspecified'}</span>
                        </div>
                        <div className="p-2 rounded bg-[#00141f] border border-[#063750]/50">
                          <span className="text-slate-400 block text-[10px]">Bandwidth</span>
                          <span className="text-slate-200 font-semibold">{serviceDetail.source_data.limits.bandwidth || 'Unspecified'}</span>
                        </div>
                        <div className="p-2 rounded bg-[#00141f] border border-[#063750]/50">
                          <span className="text-slate-400 block text-[10px]">API Limits</span>
                          <span className="text-slate-200 font-semibold">{serviceDetail.source_data.limits.api || 'Unspecified'}</span>
                        </div>
                      </div>
                    </div>

                    {/* Disclosed Constraints Table */}
                    <div>
                      <div className="text-[11px] font-semibold text-slate-400 mb-1">Disclosed Constraints (Strict Invariant)</div>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
                        <div className="p-1.5 rounded bg-[#00141f] flex items-center justify-between">
                          <span className="text-slate-400">Credit Card:</span>
                          {renderDisclosedFlag(serviceDetail.source_data.disclosed_flags.credit_card_required, 'Required', 'No CC')}
                        </div>
                        <div className="p-1.5 rounded bg-[#00141f] flex items-center justify-between">
                          <span className="text-slate-400">Trial Only:</span>
                          {renderDisclosedFlag(serviceDetail.source_data.disclosed_flags.trial_only, 'Trial', 'Permanent Tier')}
                        </div>
                        <div className="p-1.5 rounded bg-[#00141f] flex items-center justify-between">
                          <span className="text-slate-400">Open Source:</span>
                          {renderDisclosedFlag(serviceDetail.source_data.disclosed_flags.open_source, 'Yes')}
                        </div>
                        <div className="p-1.5 rounded bg-[#00141f] flex items-center justify-between">
                          <span className="text-slate-400">Self-Hostable:</span>
                          {renderDisclosedFlag(serviceDetail.source_data.disclosed_flags.self_hostable, 'Yes')}
                        </div>
                        <div className="p-1.5 rounded bg-[#00141f] flex items-center justify-between">
                          <span className="text-slate-400">Commercial Use:</span>
                          {renderDisclosedFlag(serviceDetail.source_data.disclosed_flags.commercial_use, 'Allowed', 'Non-commercial')}
                        </div>
                        <div className="p-1.5 rounded bg-[#00141f] flex items-center justify-between">
                          <span className="text-slate-400">API Access:</span>
                          {renderDisclosedFlag(serviceDetail.source_data.disclosed_flags.api_available, 'Available')}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* SECTION 2: INTELLIHIRE ARCHITECTURE MAPPING */}
                  <div className="p-4 rounded-xl bg-[#001c2a] border border-[#063750] space-y-3">
                    <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#FF4103] border-b border-[#063750] pb-2">
                      <Layers className="w-4 h-4 text-[#FF4103]" />
                      <span>2. IntelliHire Architecture Mapping</span>
                    </div>

                    <div>
                      <div className="text-[11px] font-semibold text-slate-400 mb-1">Target Engine Modules</div>
                      <div className="flex flex-wrap gap-1.5">
                        {serviceDetail.intellihire_mapping.modules.map(getModuleBadge)}
                      </div>
                    </div>

                    <div>
                      <div className="text-[11px] font-semibold text-slate-400 mb-1">Recommended Integration Role</div>
                      <div className="text-xs text-white font-medium p-2.5 rounded bg-[#00141f] border border-[#063750]/50">
                        {serviceDetail.intellihire_mapping.recommended_role}
                      </div>
                    </div>

                    <div>
                      <div className="text-[11px] font-semibold text-slate-400 mb-1">Extracted Capability Tags</div>
                      <div className="flex flex-wrap gap-1">
                        {serviceDetail.intellihire_mapping.capability_tags.map((tag) => (
                          <span key={tag} className="px-2 py-0.5 text-[10px] rounded bg-[#00273a] text-slate-300 border border-[#063750]">
                            #{tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* SECTION 3: PROVENANCE & AUDIT */}
                  <div className="p-4 rounded-xl bg-[#001c2a] border border-[#063750] space-y-2 text-xs">
                    <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-400 border-b border-[#063750] pb-2">
                      <Shield className="w-4 h-4 text-emerald-400" />
                      <span>3. Data Provenance & Verification Audit</span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-[11px]">
                      <div>
                        <span className="text-slate-400 block">Source Catalog:</span>
                        <span className="text-slate-200 font-mono">{serviceDetail.provenance.source}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block">Repository:</span>
                        <a
                          href={serviceDetail.provenance.repository}
                          target="_blank"
                          rel="noreferrer"
                          className="text-[#FF4103] hover:underline font-mono truncate block"
                        >
                          ripienaar/free-for-dev
                        </a>
                      </div>
                      <div>
                        <span className="text-slate-400 block">Commit Hash:</span>
                        <span className="text-slate-200 font-mono">{serviceDetail.provenance.commit || 'master'}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block">Verification Status:</span>
                        <span className="text-emerald-400 font-semibold capitalize">{serviceDetail.intellihire_mapping.verification_status}</span>
                      </div>
                    </div>
                  </div>

                </div>

                {/* Footer Action */}
                <div className="pt-4 border-t border-[#063750] flex items-center justify-between">
                  <a
                    href={serviceDetail.source_data.official_url || '#'}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-[#FF4103] text-white hover:bg-[#e03200] transition-colors"
                  >
                    <span>Visit Provider Website</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>

                  <button
                    onClick={handleCloseDetail}
                    className="px-4 py-2 rounded-xl text-xs font-semibold bg-[#00273a] text-slate-300 hover:text-white"
                  >
                    Close
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

    </DashboardLayout>
  );
}
