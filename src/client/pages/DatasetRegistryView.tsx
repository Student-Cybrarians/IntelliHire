import { useState, useEffect } from 'react';
import { 
  Database, ShieldCheck, AlertTriangle, CheckCircle2, 
  ExternalLink, FileText, Search, Filter, Layers, BookOpen,
  ArrowRight, Sparkles, Scale, Info, Check, RefreshCw
} from 'lucide-react';
import { Link } from 'react-router-dom';
import DashboardLayout from './dashboard/DashboardLayout';

interface DatasetMeta {
  id: string;
  code: string;
  name: string;
  officialSourceUrl: string;
  version: string;
  license: string;
  provenanceType: string;
  complianceStatus: string;
  intendedModule: string;
  historicalClaimedCount: string;
  verifiedRecordCount: number;
  redistributionTerms: string;
  privacyImplications: string;
  complianceNotes: string;
  retrievedAt: string;
}

interface LearningResource {
  id: string;
  sourceCode: string;
  module: string;
  resourceType: string;
  domain: string;
  title: string;
  topic?: string;
  targetRole?: string;
  occupationCode?: string;
  content: any;
  difficultyLevel?: number;
  provenanceNotes?: string;
  isVerified?: boolean;
}

export default function DatasetRegistryView() {
  const [sources, setSources] = useState<DatasetMeta[]>([]);
  const [resources, setResources] = useState<LearningResource[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [selectedModule, setSelectedModule] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedDomain, setSelectedDomain] = useState<string>('ALL');
  const [selectedResourceType, setSelectedResourceType] = useState<string>('ALL');

  const [activeTab, setActiveTab] = useState<'sources' | 'resources' | 'policy'>('sources');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [regRes, resRes] = await Promise.all([
        fetch('/api/datasets/registry'),
        fetch('/api/datasets/resources')
      ]);

      if (!regRes.ok) throw new Error('Failed to load dataset registry');
      const regData = await regRes.json() as any;
      setSources(regData.sources || []);

      if (resRes.ok) {
        const resData = await resRes.json() as any;
        setResources(resData.resources || []);
      }
    } catch (err: any) {
      setError(err.message || 'Error loading datasets');
    } finally {
      setLoading(false);
    }
  };

  const filteredResources = resources.filter(r => {
    if (selectedModule !== 'ALL' && r.module !== selectedModule) return false;
    if (selectedDomain !== 'ALL' && r.domain !== selectedDomain) return false;
    if (selectedResourceType !== 'ALL' && r.resourceType !== selectedResourceType) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = (r.title || '').toLowerCase().includes(q);
      const matchTopic = (r.topic || '').toLowerCase().includes(q);
      const matchRole = (r.targetRole || '').toLowerCase().includes(q);
      const matchDomain = (r.domain || '').toLowerCase().includes(q);
      if (!matchTitle && !matchTopic && !matchRole && !matchDomain) return false;
    }
    return true;
  });

  const getComplianceBadge = (status: string) => {
    switch (status) {
      case 'APPROVED_ACTIVE':
      case 'ACTIVE_INGESTED':
        return (
          <span className="px-2 py-0.5 rounded text-xs font-bold bg-emerald-950/60 text-emerald-400 border border-emerald-800/60 flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" /> VERIFIED & INGESTED
          </span>
        );
      case 'EXCLUDED_ETHICAL_POLICY':
        return (
          <span className="px-2 py-0.5 rounded text-xs font-bold bg-purple-950/60 text-purple-300 border border-purple-800/60 flex items-center gap-1">
            <ShieldCheck className="w-3 h-3" /> ETHICAL EXCLUSION
          </span>
        );
      case 'EXCLUDED_PROPRIETARY_COPYRIGHT':
        return (
          <span className="px-2 py-0.5 rounded text-xs font-bold bg-amber-950/60 text-amber-300 border border-amber-800/60 flex items-center gap-1">
            <Scale className="w-3 h-3" /> COPYRIGHT EXCLUSION
          </span>
        );
      default:
        return (
          <span className="px-2 py-0.5 rounded text-xs font-bold bg-slate-800 text-slate-300 border border-slate-700">
            {status}
          </span>
        );
    }
  };

  return (
    <DashboardLayout role="candidate" userFullName="Candidate">
      <div className="max-w-7xl mx-auto space-y-6 pb-12">
        
        {/* Top Header */}
        <div className="bg-[#001f2e] border border-[#063750] rounded-xl p-6 sm:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-3xl">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded text-xs font-bold bg-[#FF4103]/15 text-[#FF4103] border border-[#FF4103]/30 tracking-wide uppercase">
                Ethical AI & Data Transparency
              </span>
              <span className="text-xs text-slate-400 font-mono">D1 Colocated · Audit Trail</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-3">
              <Database className="w-8 h-8 text-[#FF4103]" />
              Audited Dataset & Learning Resources Registry
            </h1>
            <p className="text-sm text-slate-300 leading-relaxed">
              IntelliHire enforces rigorous legal provenance, privacy protection, and responsible AI governance. 
              Historical presentation claims are reconciled against lawful, verified source records, ensuring zero unconsented PII 
              redistribution, zero copyright infringement, and a strict exclusion of biometric emotion profiling.
            </p>
          </div>

          <div className="flex flex-row md:flex-col gap-3 shrink-0">
            <button
              onClick={fetchData}
              disabled={loading}
              className="px-4 py-2 bg-[#001824] hover:bg-[#002538] text-slate-200 border border-[#063750] rounded-lg text-xs font-semibold flex items-center gap-2 transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span>Refresh Sources</span>
            </button>
            <Link
              to="/resume"
              className="px-4 py-2 bg-[#FF4103] hover:bg-[#e03200] text-white rounded-lg text-xs font-semibold flex items-center gap-2 transition-colors justify-center"
            >
              <span>Test in Module 1</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {/* Status / Error Alert */}
        {error && (
          <div className="p-4 bg-red-950/40 border border-red-900 rounded-lg text-red-200 text-sm flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-red-400 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Tab Selection */}
        <div className="flex border-b border-[#063750] gap-4 text-sm font-semibold">
          <button
            onClick={() => setActiveTab('sources')}
            className={`pb-3 px-1 border-b-2 transition-colors flex items-center gap-2 ${
              activeTab === 'sources'
                ? 'border-[#FF4103] text-white'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>Dataset Sources ({sources.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('resources')}
            className={`pb-3 px-1 border-b-2 transition-colors flex items-center gap-2 ${
              activeTab === 'resources'
                ? 'border-[#FF4103] text-white'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>Curated Learning Resources ({resources.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('policy')}
            className={`pb-3 px-1 border-b-2 transition-colors flex items-center gap-2 ${
              activeTab === 'policy'
                ? 'border-[#FF4103] text-white'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Ethical Governance & Biometric Exclusion</span>
          </button>
        </div>

        {/* TAB 1: DATASET SOURCES */}
        {activeTab === 'sources' && (
          <div className="space-y-4">
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {sources.map((src) => (
                <div 
                  key={src.id || src.code} 
                  className="bg-[#001f2e] border border-[#063750] rounded-xl p-5 flex flex-col justify-between hover:border-[#FF4103]/60 transition-colors"
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <span className="text-[11px] font-mono font-bold text-[#FF4103] uppercase">
                        {src.intendedModule}
                      </span>
                      {getComplianceBadge(src.complianceStatus)}
                    </div>

                    <div>
                      <h3 className="text-base font-bold text-white leading-snug">
                        {src.name}
                      </h3>
                      <p className="text-xs text-slate-400 mt-1 line-clamp-2">
                        {src.complianceNotes}
                      </p>
                    </div>

                    {/* Claims vs. Verified Count Metric */}
                    <div className="grid grid-cols-2 gap-2 p-2.5 bg-[#001621] rounded-lg border border-[#002f47] text-xs">
                      <div>
                        <div className="text-[10px] uppercase font-bold text-slate-400">Claimed Size</div>
                        <div className="font-mono text-slate-300 font-semibold mt-0.5">{src.historicalClaimedCount}</div>
                      </div>
                      <div>
                        <div className="text-[10px] uppercase font-bold text-[#FF4103]">Verified Ingested</div>
                        <div className="font-mono text-emerald-400 font-bold mt-0.5">
                          {src.verifiedRecordCount > 0 ? `${src.verifiedRecordCount} records` : '0 (Lawful Excl.)'}
                        </div>
                      </div>
                    </div>

                    {/* Legal & Governance Attributes */}
                    <div className="space-y-1.5 text-xs">
                      <div className="flex items-center justify-between text-slate-400">
                        <span>License:</span>
                        <span className="font-mono text-slate-200 font-semibold truncate max-w-[170px]" title={src.license}>{src.license}</span>
                      </div>
                      <div className="flex items-center justify-between text-slate-400">
                        <span>Provenance:</span>
                        <span className="font-semibold text-slate-300">{src.provenanceType.replace(/_/g, ' ')}</span>
                      </div>
                      <div className="flex items-center justify-between text-slate-400">
                        <span>Candidate PII:</span>
                        <span className={src.complianceStatus === 'EXCLUDED_ETHICAL_POLICY' ? 'text-purple-400 font-semibold' : 'text-emerald-400 font-semibold'}>
                          {src.privacyImplications.includes('Zero PII') ? 'Zero PII (Synthetic)' : 'Scrubbed / Redacted'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-[#063750] mt-4 flex items-center justify-between text-xs">
                    <span className="text-[11px] text-slate-400 font-mono">
                      {src.code}
                    </span>
                    {src.officialSourceUrl && (
                      <a 
                        href={src.officialSourceUrl} 
                        target="_blank" 
                        rel="noreferrer"
                        className="text-[#FF4103] hover:underline flex items-center gap-1 font-semibold"
                      >
                        <span>Official Source</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 2: CURATED LEARNING RESOURCES */}
        {activeTab === 'resources' && (
          <div className="space-y-6">
            
            {/* Filter Bar */}
            <div className="bg-[#001f2e] border border-[#063750] rounded-xl p-4 flex flex-wrap gap-3 items-center justify-between">
              <div className="flex flex-wrap items-center gap-3 flex-1 min-w-[280px]">
                <div className="relative flex-1 min-w-[200px]">
                  <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search resources, topics, competencies..."
                    className="w-full bg-[#001621] border border-[#002f47] rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-[#FF4103]"
                  />
                </div>

                <select
                  value={selectedModule}
                  onChange={(e) => setSelectedModule(e.target.value)}
                  className="bg-[#001621] border border-[#002f47] rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-[#FF4103]"
                >
                  <option value="ALL">All Modules</option>
                  <option value="M01">M01 Resume & JDs</option>
                  <option value="M02">M02 Aptitude & Assessments</option>
                  <option value="M03">M03 Technical Simulation</option>
                  <option value="M04">M04 Behavioral Interviews</option>
                </select>

                <select
                  value={selectedResourceType}
                  onChange={(e) => setSelectedResourceType(e.target.value)}
                  className="bg-[#001621] border border-[#002f47] rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-[#FF4103]"
                >
                  <option value="ALL">All Resource Types</option>
                  <option value="job_description">Job Descriptions (O*NET)</option>
                  <option value="benchmark_resume">Benchmark Resumes (CC0)</option>
                  <option value="mcq_question">Assessment MCQs</option>
                  <option value="star_interview_scenario">STAR Interview Rubrics</option>
                </select>
              </div>

              <span className="text-xs text-slate-400 font-semibold">
                Showing {filteredResources.length} of {resources.length} verified items
              </span>
            </div>

            {/* Resources Grid */}
            <div className="grid md:grid-cols-2 gap-4">
              {filteredResources.map((res) => (
                <div 
                  key={res.id} 
                  className="bg-[#001f2e] border border-[#063750] rounded-xl p-5 space-y-3 flex flex-col justify-between"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#FF4103]/15 text-[#FF4103] border border-[#FF4103]/30 uppercase">
                          {res.module}
                        </span>
                        <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-800 text-slate-300">
                          {res.resourceType?.replace(/_/g, ' ') || 'Resource'}
                        </span>
                      </div>
                      <span className="text-[10px] font-mono text-emerald-400 font-bold px-1.5 py-0.5 bg-emerald-950/40 rounded border border-emerald-900/40">
                        Verified Audited
                      </span>
                    </div>

                    <h3 className="text-base font-bold text-white">
                      {res.title}
                    </h3>
                    <p className="text-xs text-slate-300 line-clamp-3">
                      {res.topic || res.targetRole || res.provenanceNotes}
                    </p>

                    {/* Specific Payload Previews */}
                    {res.resourceType === 'job_description' && (
                      <div className="p-3 bg-[#001621] border border-[#002f47] rounded-lg text-xs space-y-1 font-mono text-slate-300">
                        <div className="text-slate-400 text-[11px]">SOC Code: {res.occupationCode || res.content?.socCode}</div>
                        <div className="text-slate-400 text-[11px]">Experience: {res.content?.experienceLevel || 'Mid-Senior'}</div>
                        <div className="text-slate-400 text-[11px]">Core Skills: {res.content?.requiredSkills?.slice(0, 4).join(', ')}...</div>
                      </div>
                    )}

                    {res.resourceType === 'benchmark_resume' && (
                      <div className="p-3 bg-[#001621] border border-[#002f47] rounded-lg text-xs space-y-1 text-slate-300">
                        <div className="text-slate-400 text-[11px] font-mono">Candidate: {res.content?.candidateName}</div>
                        <div className="text-slate-400 text-[11px] font-mono">Target Role: {res.targetRole}</div>
                        <div className="text-slate-400 text-[11px] font-mono">Skills ({res.content?.skills?.length || 0}): {res.content?.skills?.slice(0, 6).join(', ')}...</div>
                      </div>
                    )}

                    {res.resourceType === 'aptitude_mcq' && (
                      <div className="p-3 bg-[#001621] border border-[#002f47] rounded-lg text-xs space-y-1.5 text-slate-300">
                        <div className="font-semibold text-slate-200">Q: {res.content?.questionText}</div>
                        <div className="text-emerald-400 text-[11px]">Domain: {res.domain} · Difficulty: {res.difficultyLevel}/5</div>
                        <div className="text-slate-400 text-[11px]">Key: {res.content?.correctOption}</div>
                      </div>
                    )}

                    {res.resourceType === 'star_interview_scenario' && (
                      <div className="p-3 bg-[#001621] border border-[#002f47] rounded-lg text-xs space-y-1 text-slate-300">
                        <div className="font-semibold text-slate-200">Competency: {res.content?.competency}</div>
                        <div className="text-slate-400 text-[11px]">Framework: {res.content?.behavioralScenario}</div>
                        <div className="text-slate-400 text-[11px]">Anchored Levels: 1 to 5 Rubric Available</div>
                      </div>
                    )}
                  </div>

                  <div className="pt-3 border-t border-[#063750] flex items-center justify-between text-xs text-slate-400">
                    <span className="truncate max-w-[220px]" title={res.provenanceNotes}>{res.provenanceNotes || 'Audited Standard'}</span>
                    <span className="font-mono text-[11px]">{res.domain}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 3: ETHICAL GOVERNANCE & BIOMETRIC EXCLUSION POLICY */}
        {activeTab === 'policy' && (
          <div className="space-y-6">
            <div className="bg-[#001f2e] border border-purple-900/50 rounded-xl p-6 sm:p-8 space-y-6">
              <div className="flex items-center gap-3 text-purple-400">
                <ShieldCheck className="w-8 h-8" />
                <h2 className="text-xl sm:text-2xl font-bold text-white">
                  IntelliHire Zero-Biometric Invariant & Ethical Governance Charter
                </h2>
              </div>

              <div className="prose prose-invert text-sm text-slate-300 max-w-none space-y-4 leading-relaxed">
                <p>
                  IntelliHire is engineered to uphold rigorous international standards in algorithmic fairness, 
                  candidate privacy, and responsible AI deployment. We strictly prohibit the use of unvalidated facial 
                  affect recognition, emotion scoring, or biometric sentiment inference for employment or competency evaluations.
                </p>

                <div className="grid md:grid-cols-2 gap-4 not-prose">
                  <div className="p-4 rounded-lg bg-[#001621] border border-purple-900/40 space-y-2">
                    <h4 className="font-bold text-white text-sm flex items-center gap-2">
                      <Scale className="w-4 h-4 text-purple-400" />
                      EU AI Act Title II & Annex III Compliance
                    </h4>
                    <p className="text-xs text-slate-300 leading-normal">
                      Emotion recognition systems in the workplace or education are strictly classified as prohibited or 
                      high-risk under EU AI Act Regulation (EU) 2024/1689. IntelliHire excludes datasets such as FER2013 and 
                      AffectNet from all candidate scoring and decision pipelines.
                    </p>
                  </div>

                  <div className="p-4 rounded-lg bg-[#001621] border border-purple-900/40 space-y-2">
                    <h4 className="font-bold text-white text-sm flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      EEOC & Title VII Algorithmic Fairness
                    </h4>
                    <p className="text-xs text-slate-300 leading-normal">
                      In accordance with U.S. Equal Employment Opportunity Commission (EEOC) guidance on AI selection procedures, 
                      assessments must be job-related and consistent with business necessity. Evaluators grade documented technical 
                      and behavioral evidence, not facial expressions or subjective affect.
                    </p>
                  </div>
                </div>

                <h3 className="text-base font-bold text-white pt-2">Key Operational Guarantees</h3>
                <ul className="list-disc pl-5 space-y-1.5 text-xs text-slate-300">
                  <li><strong>Zero Emotion Scoring:</strong> Camera and microphone inputs during interview practice are client-rendered for candidate rehearsal and transcription only; no affective or micro-expression scores are computed or stored.</li>
                  <li><strong>Candidate PII Scrubbing:</strong> Ingested benchmark documents undergo automated regex scrubbing for email, telephone, social security numbers, and physical residential addresses before model processing.</li>
                  <li><strong>Respect for Intellectual Property:</strong> We refuse to scrape LinkedIn or Naukri in violation of CFAA and platform Terms of Service. Instead, we use public-domain and CC-BY standard taxonomies from the U.S. Department of Labor (O*NET).</li>
                  <li><strong>No Redistribution of Copyrighted Problem Banks:</strong> Proprietary question systems (such as LeetCode solutions) are excluded in favor of open algorithmic reasoning specifications under MIT and Apache 2.0 licenses.</li>
                </ul>
              </div>
            </div>
          </div>
        )}

      </div>
    </DashboardLayout>
  );
}
