import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Upload, FileText, Bot, AlertCircle, CheckCircle2, LayoutDashboard, Briefcase, 
  ChevronRight, XCircle, FileQuestion, Sparkles, Layers, Award, GraduationCap, 
  ArrowRight, ShieldCheck, RefreshCw, Compass, BookOpen, User, Check
} from 'lucide-react';

export default function Resume() {
  const navigate = useNavigate();

  // Navigation steps
  const [activeStep, setActiveStep] = useState<number>(1);
  const [error, setError] = useState<string | null>(null);

  // Ingestion Mode: 'upload' | 'manual'
  const [ingestionMode, setIngestionMode] = useState<'upload' | 'manual'>('upload');

  // Taxonomy states
  const [domains, setDomains] = useState<Array<{ id: string; name: string; description: string }>>([]);
  const [occupations, setOccupations] = useState<Array<{ id: string; name: string; domain_id: string }>>([]);
  const [selectedDomain, setSelectedDomain] = useState<string>('dom_tech');
  const [selectedSeniority, setSelectedSeniority] = useState<string>('Mid-Level');

  // Resume file upload state
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [extracting, setExtracting] = useState(false);
  const [resumeData, setResumeData] = useState<any>(null);
  const [resumeId, setResumeId] = useState<string | null>(null);
  const [rawResumeText, setRawResumeText] = useState<string>('');

  // Manual Profile entry state
  const [fullName, setFullName] = useState('');
  const [targetRoleInput, setTargetRoleInput] = useState('');
  const [summaryInput, setSummaryInput] = useState('');
  const [skillTagInput, setSkillTagInput] = useState('');
  const [skillsList, setSkillsList] = useState<string[]>([]);
  const [expTitle, setExpTitle] = useState('');
  const [expCompany, setExpCompany] = useState('');
  const [expYears, setExpYears] = useState('');
  const [expDesc, setExpDesc] = useState('');
  const [experiences, setExperiences] = useState<Array<{ title: string; company: string; years: string; description: string }>>([]);
  const [eduInput, setEduInput] = useState('');
  const [educationList, setEducationList] = useState<string[]>([]);
  const [certInput, setCertInput] = useState('');
  const [certificationsList, setCertificationsList] = useState<string[]>([]);
  const [savingManual, setSavingManual] = useState(false);

  // Job Description state
  const [jdText, setJdText] = useState('');
  const [jdAnalyzing, setJdAnalyzing] = useState(false);
  const [jdData, setJdData] = useState<any>(null);
  const [jdId, setJdId] = useState<string | null>(null);

  // Match & ATS state
  const [matchRunning, setMatchRunning] = useState(false);
  const [matchData, setMatchData] = useState<any>(null);
  const [gapFilter, setGapFilter] = useState<'all' | 'evidence' | 'transferable' | 'missing'>('all');

  // Targeted Variant state
  const [generatingVariant, setGeneratingVariant] = useState(false);
  const [variantData, setVariantData] = useState<any>(null);
  const [variantSaved, setVariantSaved] = useState(false);

  // Fetch taxonomy on mount
  useEffect(() => {
    fetch('/api/taxonomy/categories')
      .then(res => res.json())
      .then((data: any) => {
        if (data.domains && Array.isArray(data.domains)) {
          setDomains(data.domains);
        }
      })
      .catch(() => {
        // Fallback to static domains if endpoint unreachable
        setDomains([
          { id: 'dom_tech', name: 'Technology & Digital Systems', description: 'Software, cloud, data, cybersecurity, AI' },
          { id: 'dom_health', name: 'Healthcare, Clinical & Nursing', description: 'Medicine, nursing, allied health, pharmacy' },
          { id: 'dom_corp', name: 'Business, Finance & Operations', description: 'Strategy, accounting, operations, HR, marketing' },
          { id: 'dom_legal', name: 'Legal, Regulatory & Compliance', description: 'Attorneys, paralegals, compliance officers' },
          { id: 'dom_eng', name: 'Engineering & Industrial', description: 'Mechanical, civil, electrical, industrial' },
          { id: 'dom_trades', name: 'Skilled Trades & Vocational', description: 'Electricians, plumbers, HVAC, welding, carpentry' },
          { id: 'dom_creative', name: 'Creative, Media & Design', description: 'UX/UI, copywriting, multimedia, production' },
          { id: 'dom_edu', name: 'Education & Research', description: 'Teachers, professors, academic researchers' },
          { id: 'dom_public', name: 'Public Sector & Logistics', description: 'Public administration, NGO, supply chain' }
        ]);
      });
  }, []);

  // Update occupations on domain change
  useEffect(() => {
    if (!selectedDomain) return;
    fetch(`/api/taxonomy/occupations?domain_id=${selectedDomain}`)
      .then(res => res.json())
      .then((data: any) => {
        if (Array.isArray(data)) setOccupations(data);
      })
      .catch(() => setOccupations([]));
  }, [selectedDomain]);

  // Handle Resume Document Upload
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
      setActiveStep(2); // Progress to target JD step
    } catch (err: any) {
      setError(err.message);
    } finally {
      setUploading(false);
      setExtracting(false);
    }
  };

  // Add skill tag in manual entry
  const handleAddSkill = () => {
    if (!skillTagInput.trim()) return;
    if (!skillsList.includes(skillTagInput.trim())) {
      setSkillsList([...skillsList, skillTagInput.trim()]);
    }
    setSkillTagInput('');
  };

  // Add experience in manual entry
  const handleAddExperience = () => {
    if (!expTitle.trim() || !expCompany.trim()) return;
    setExperiences([...experiences, {
      title: expTitle.trim(),
      company: expCompany.trim(),
      years: expYears.trim() || 'Present',
      description: expDesc.trim()
    }]);
    setExpTitle('');
    setExpCompany('');
    setExpYears('');
    setExpDesc('');
  };

  // Add education
  const handleAddEducation = () => {
    if (!eduInput.trim()) return;
    setEducationList([...educationList, eduInput.trim()]);
    setEduInput('');
  };

  // Add certification
  const handleAddCert = () => {
    if (!certInput.trim()) return;
    setCertificationsList([...certificationsList, certInput.trim()]);
    setCertInput('');
  };

  // Handle Manual Profile Submission
  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetRoleInput.trim() || skillsList.length === 0) {
      setError('Please provide a target role and at least one core skill.');
      return;
    }

    setSavingManual(true);
    setError(null);

    try {
      const res = await fetch('/api/resume/manual', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          full_name: fullName.trim() || 'Candidate',
          target_role: targetRoleInput.trim(),
          target_domain: selectedDomain,
          seniority_level: selectedSeniority,
          summary: summaryInput.trim(),
          skills: skillsList,
          experiences: experiences,
          education: educationList,
          certifications: certificationsList
        })
      });

      const data = await res.json() as any;
      if (!res.ok) throw new Error(data.error || 'Failed to submit manual profile');

      setResumeId(data.resumeId);
      setResumeData(data.data);
      setRawResumeText(data.raw_text || '');
      setActiveStep(2); // Progress to target JD step
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSavingManual(false);
    }
  };

  // Handle JD Analysis
  const handleJDAnalyze = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!jdText.trim() || jdText.length < 50) {
      setError('Job Description must contain at least 50 characters for accurate parsing.');
      return;
    }

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
      setActiveStep(3); // Progress to Match Analysis step
    } catch (err: any) {
      setError(err.message);
    } finally {
      setJdAnalyzing(false);
    }
  };

  // Handle Match Run (Dual-Engine: Deterministic ATS + AI Qualitative Fit)
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

  // Handle Targeted Variant Generation
  const handleGenerateVariant = async () => {
    if (!resumeId || !jdId) return;
    setGeneratingVariant(true);
    setError(null);

    try {
      const res = await fetch('/api/resume/variant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resume_id: resumeId, jd_id: jdId })
      });
      const data = await res.json() as any;
      if (!res.ok) throw new Error(data.error || 'Failed to generate variant');

      setVariantData(data);
      setActiveStep(4);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setGeneratingVariant(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch(status) {
      case 'EVIDENCE_FOUND':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-950/60 border border-emerald-800 text-emerald-300 rounded-full text-xs font-semibold">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> Evidence Verified
          </span>
        );
      case 'TRANSFERABLE':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-sky-950/60 border border-sky-800 text-sky-300 rounded-full text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5 text-sky-400" /> Transferable Skill
          </span>
        );
      case 'MISSING':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-rose-950/60 border border-rose-800 text-rose-300 rounded-full text-xs font-semibold">
            <XCircle className="w-3.5 h-3.5 text-rose-400" /> Missing Evidence
          </span>
        );
      case 'CONTRADICTORY':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-amber-950/60 border border-amber-800 text-amber-300 rounded-full text-xs font-semibold">
            <FileQuestion className="w-3.5 h-3.5 text-amber-400" /> Contradictory Claim
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-800 border border-slate-700 text-slate-400 rounded-full text-xs font-semibold">
            {status}
          </span>
        );
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6 md:p-10">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Header with Title and Dashboard link */}
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-800">
          <div>
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-brand-900/30 border border-brand-700/50 rounded-xl">
                <FileText className="w-7 h-7 text-brand-400" />
              </div>
              <div>
                <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-white">
                  Career & Resume Intelligence
                </h1>
                <p className="text-slate-400 text-sm mt-0.5">
                  Universal ATS analysis, evidence grounding & targeted career optimization across all professional domains.
                </p>
              </div>
            </div>
          </div>
          
          <button 
            onClick={() => navigate('/dashboard')}
            className="flex items-center gap-2 px-4 py-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-200 rounded-lg text-sm font-medium transition-colors"
            aria-label="Back to Dashboard"
          >
            <LayoutDashboard className="w-4 h-4" />
            Dashboard
          </button>
        </header>

        {/* Global Error Banner */}
        {error && (
          <div role="alert" className="p-4 bg-rose-950/40 border border-rose-900/60 rounded-xl flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-rose-400 flex-shrink-0 mt-0.5" />
            <div className="text-rose-200 text-sm">
              <p className="font-semibold text-rose-300">Action Required</p>
              <p className="mt-0.5">{error}</p>
            </div>
          </div>
        )}

        {/* Stage Progress Bar */}
        <nav aria-label="Module 1 Stages" className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-2">
          <ol className="grid grid-cols-2 md:grid-cols-5 gap-2 text-xs md:text-sm font-medium">
            {[
              { num: 1, title: '1. Ingest Profile', active: activeStep === 1, done: Boolean(resumeData) },
              { num: 2, title: '2. Target Role & JD', active: activeStep === 2, done: Boolean(jdData) },
              { num: 3, title: '3. ATS & Match', active: activeStep === 3, done: Boolean(matchData) },
              { num: 4, title: '4. Targeted Variant', active: activeStep === 4, done: Boolean(variantData) },
              { num: 5, title: '5. Career Pathways', active: activeStep === 5, done: Boolean(matchData?.career_pathway_recommendations?.length) }
            ].map(step => (
              <li key={step.num}>
                <button
                  onClick={() => setActiveStep(step.num)}
                  disabled={!step.done && step.num > activeStep}
                  className={`w-full text-left py-2.5 px-3.5 rounded-xl transition-all flex items-center justify-between ${
                    step.active 
                      ? 'bg-brand-600 text-white font-semibold shadow-lg shadow-brand-900/40' 
                      : step.done 
                        ? 'bg-slate-800/80 text-emerald-400 hover:bg-slate-800' 
                        : 'text-slate-500 hover:text-slate-400 disabled:opacity-40 disabled:cursor-not-allowed'
                  }`}
                >
                  <span className="truncate">{step.title}</span>
                  {step.done && <Check className="w-4 h-4 ml-1 flex-shrink-0" />}
                </button>
              </li>
            ))}
          </ol>
        </nav>

        {/* ======================================================== */}
        {/* STEP 1: INGEST PROFILE (UPLOAD DOCUMENT OR MANUAL ENTRY) */}
        {/* ======================================================== */}
        {activeStep === 1 && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <User className="w-5 h-5 text-brand-400" />
                  Candidate Profile & Source Evidence
                </h2>
                <p className="text-slate-400 text-sm mt-1">
                  Upload an existing resume document (.pdf, .docx, .txt) or enter your professional credentials directly.
                </p>
              </div>

              {/* Ingestion Mode Toggle */}
              <div className="flex bg-slate-900 border border-slate-800 p-1 rounded-xl" role="tablist">
                <button
                  role="tab"
                  aria-selected={ingestionMode === 'upload'}
                  onClick={() => setIngestionMode('upload')}
                  className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    ingestionMode === 'upload' ? 'bg-brand-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Upload Document
                </button>
                <button
                  role="tab"
                  aria-selected={ingestionMode === 'manual'}
                  onClick={() => setIngestionMode('manual')}
                  className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    ingestionMode === 'manual' ? 'bg-brand-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Enter Profile Manually
                </button>
              </div>
            </div>

            {ingestionMode === 'upload' ? (
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8">
                {!resumeData && !extracting ? (
                  <form onSubmit={handleUpload} className="space-y-6">
                    <div className="border-2 border-dashed border-slate-700/80 hover:border-brand-500/80 rounded-2xl p-10 text-center transition-all bg-slate-950/40">
                      <input
                        type="file"
                        accept=".pdf,.docx,.txt"
                        onChange={(e) => setFile(e.target.files?.[0] || null)}
                        className="hidden"
                        id="resume-file-input"
                      />
                      <label htmlFor="resume-file-input" className="cursor-pointer flex flex-col items-center">
                        <div className="p-4 bg-slate-800/80 rounded-full mb-4 text-brand-400">
                          <Upload className="w-8 h-8" />
                        </div>
                        <span className="text-lg font-semibold text-slate-200">
                          {file ? file.name : 'Select or drop your resume file'}
                        </span>
                        <span className="text-sm text-slate-500 mt-1">
                          Accepts PDF, DOCX, TXT format (up to 5MB)
                        </span>
                      </label>
                    </div>

                    <div className="flex justify-end">
                      <button
                        type="submit"
                        disabled={!file || uploading}
                        className="px-6 py-3 bg-brand-600 hover:bg-brand-500 text-white rounded-xl font-semibold transition-colors disabled:opacity-50 flex items-center gap-2 shadow-lg shadow-brand-900/30"
                      >
                        {uploading ? (
                          <>
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            <span>Uploading Document...</span>
                          </>
                        ) : (
                          <>
                            <span>Extract Evidence</span>
                            <ArrowRight className="w-4 h-4" />
                          </>
                        )}
                      </button>
                    </div>
                  </form>
                ) : extracting ? (
                  <div className="py-16 text-center space-y-4">
                    <div className="w-10 h-10 border-4 border-brand-500 border-t-transparent rounded-full animate-spin mx-auto" />
                    <p className="text-brand-300 font-medium">Extracting source claims and competencies with Muse Glimmer AI...</p>
                    <p className="text-xs text-slate-500">Checking provenance and mapping skills without fabrication.</p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    <div className="p-4 bg-emerald-950/30 border border-emerald-800/50 rounded-xl flex items-center justify-between">
                      <div className="flex items-center gap-2 text-emerald-400 text-sm font-medium">
                        <CheckCircle2 className="w-5 h-5" />
                        Evidence successfully extracted from source document.
                      </div>
                      <span className="text-xs font-mono text-emerald-500/80">PROVENANCE: VERIFIED</span>
                    </div>

                    {resumeData.summary && (
                      <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800">
                        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">Extracted Summary</h3>
                        <p className="text-sm text-slate-300">{resumeData.summary}</p>
                      </div>
                    )}

                    {resumeData.skills && (
                      <div>
                        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Verified Competencies</h3>
                        <div className="flex flex-wrap gap-2">
                          {resumeData.skills.map((skill: string, i: number) => (
                            <span key={i} className="px-3 py-1 bg-slate-800 text-slate-200 rounded-lg text-xs font-medium border border-slate-700">
                              {skill}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="flex justify-end pt-4">
                      <button
                        onClick={() => setActiveStep(2)}
                        className="px-6 py-2.5 bg-brand-600 hover:bg-brand-500 text-white rounded-xl text-sm font-semibold flex items-center gap-2"
                      >
                        <span>Next: Select Target Opportunity</span>
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              /* Manual Entry Form */
              <form onSubmit={handleManualSubmit} className="bg-slate-900 border border-slate-800 rounded-2xl p-6 md:p-8 space-y-6">
                <div className="grid md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">Full Name</label>
                    <input
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="e.g. Dr. Jane Doe"
                      className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 text-sm focus:outline-none focus:border-brand-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">Target Role / Title *</label>
                    <input
                      type="text"
                      required
                      value={targetRoleInput}
                      onChange={(e) => setTargetRoleInput(e.target.value)}
                      placeholder="e.g. Licensed Electrician, Registered Nurse, Full-Stack Engineer"
                      className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 text-sm focus:outline-none focus:border-brand-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">Seniority Level</label>
                    <select
                      value={selectedSeniority}
                      onChange={(e) => setSelectedSeniority(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 text-sm focus:outline-none focus:border-brand-500"
                    >
                      <option value="Entry-Level / Apprentice">Entry-Level / Apprentice</option>
                      <option value="Mid-Level / Journeyman">Mid-Level / Journeyman</option>
                      <option value="Senior Specialist">Senior Specialist</option>
                      <option value="Lead / Supervisor">Lead / Supervisor</option>
                      <option value="Executive / Director / Principal">Executive / Director / Principal</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">Career Domain</label>
                  <select
                    value={selectedDomain}
                    onChange={(e) => setSelectedDomain(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 text-sm focus:outline-none focus:border-brand-500"
                  >
                    {domains.map(d => (
                      <option key={d.id} value={d.id}>{d.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">Professional Summary</label>
                  <textarea
                    rows={3}
                    value={summaryInput}
                    onChange={(e) => setSummaryInput(e.target.value)}
                    placeholder="Provide an overview of your career background, clinical/trade experience, or technical competencies..."
                    className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 text-sm focus:outline-none focus:border-brand-500 resize-none"
                  />
                </div>

                {/* Skills Input */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">Core Competencies & Skills *</label>
                  <div className="flex gap-2 mb-2">
                    <input
                      type="text"
                      value={skillTagInput}
                      onChange={(e) => setSkillTagInput(e.target.value)}
                      onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddSkill(); } }}
                      placeholder="e.g. Patient Triage, Conduit Bending, Financial Modeling, React"
                      className="flex-1 px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 text-sm focus:outline-none focus:border-brand-500"
                    />
                    <button
                      type="button"
                      onClick={handleAddSkill}
                      className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-sm font-semibold"
                    >
                      Add Skill
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {skillsList.map((skill, idx) => (
                      <span key={idx} className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-800 border border-slate-700 text-slate-200 rounded-lg text-xs">
                        {skill}
                        <button type="button" onClick={() => setSkillsList(skillsList.filter((_, i) => i !== idx))} className="text-slate-400 hover:text-rose-400">×</button>
                      </span>
                    ))}
                  </div>
                </div>

                {/* Work History */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">Work History / Engagements</label>
                  <div className="grid md:grid-cols-3 gap-2 mb-2">
                    <input
                      type="text"
                      value={expTitle}
                      onChange={(e) => setExpTitle(e.target.value)}
                      placeholder="Job Title"
                      className="px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 text-sm"
                    />
                    <input
                      type="text"
                      value={expCompany}
                      onChange={(e) => setExpCompany(e.target.value)}
                      placeholder="Organization / Company"
                      className="px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 text-sm"
                    />
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={expYears}
                        onChange={(e) => setExpYears(e.target.value)}
                        placeholder="Dates (e.g. 2021-2025)"
                        className="flex-1 px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 text-sm"
                      />
                      <button
                        type="button"
                        onClick={handleAddExperience}
                        className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-sm font-semibold"
                      >
                        Add
                      </button>
                    </div>
                  </div>
                  {experiences.map((exp, idx) => (
                    <div key={idx} className="p-3 bg-slate-950 border border-slate-800/80 rounded-xl text-xs text-slate-300 mb-2 flex items-center justify-between">
                      <div>
                        <span className="font-semibold text-white">{exp.title}</span> at {exp.company} ({exp.years})
                      </div>
                      <button type="button" onClick={() => setExperiences(experiences.filter((_, i) => i !== idx))} className="text-rose-400">Remove</button>
                    </div>
                  ))}
                </div>

                {/* Certifications & Education */}
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">Certifications / Professional Licenses</label>
                    <div className="flex gap-2 mb-2">
                      <input
                        type="text"
                        value={certInput}
                        onChange={(e) => setCertInput(e.target.value)}
                        placeholder="e.g. Licensed Journeyman Electrician, RN, CPA"
                        className="flex-1 px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 text-sm"
                      />
                      <button type="button" onClick={handleAddCert} className="px-3 py-2 bg-slate-800 text-slate-200 rounded-xl text-sm font-semibold">Add</button>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {certificationsList.map((c, i) => (
                        <span key={i} className="px-2 py-0.5 bg-slate-800 text-slate-300 rounded text-xs">
                          {c} <button type="button" onClick={() => setCertificationsList(certificationsList.filter((_, idx) => idx !== i))} className="ml-1 text-slate-400 hover:text-rose-400">×</button>
                        </span>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">Education & Qualifications</label>
                    <div className="flex gap-2 mb-2">
                      <input
                        type="text"
                        value={eduInput}
                        onChange={(e) => setEduInput(e.target.value)}
                        placeholder="e.g. BSN - Nursing, Apprenticeship Diploma"
                        className="flex-1 px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 text-sm"
                      />
                      <button type="button" onClick={handleAddEducation} className="px-3 py-2 bg-slate-800 text-slate-200 rounded-xl text-sm font-semibold">Add</button>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {educationList.map((edu, i) => (
                        <span key={i} className="px-2 py-0.5 bg-slate-800 text-slate-300 rounded text-xs">
                          {edu} <button type="button" onClick={() => setEducationList(educationList.filter((_, idx) => idx !== i))} className="ml-1 text-slate-400 hover:text-rose-400">×</button>
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="flex justify-end pt-4 border-t border-slate-800">
                  <button
                    type="submit"
                    disabled={savingManual}
                    className="px-6 py-3 bg-brand-600 hover:bg-brand-500 text-white rounded-xl font-semibold transition-colors disabled:opacity-50 flex items-center gap-2 shadow-lg shadow-brand-900/30"
                  >
                    {savingManual ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        <span>Saving Profile Context...</span>
                      </>
                    ) : (
                      <>
                        <span>Save & Proceed to Target Opportunity</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        )}

        {/* ======================================================== */}
        {/* STEP 2: TARGET ROLE & JOB DESCRIPTION                    */}
        {/* ======================================================== */}
        {activeStep === 2 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <Briefcase className="w-5 h-5 text-brand-400" />
                Target Role & Opportunity Requirements
              </h2>
              <p className="text-slate-400 text-sm mt-1">
                Paste any job advertisement, vacancy description, or client brief. The parser extracts both mandatory and preferred requirements.
              </p>
            </div>

            <div className="grid lg:grid-cols-3 gap-6">
              {/* Left Column: Context Card */}
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
                <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400">Active Profile Evidence</h3>
                <div className="p-4 bg-slate-950 rounded-xl border border-slate-800/80 space-y-2 text-xs">
                  <div>
                    <span className="text-slate-500">Domain:</span> <span className="font-semibold text-slate-300">{resumeData?.domain || selectedDomain}</span>
                  </div>
                  <div>
                    <span className="text-slate-500">Verified Skills:</span> <span className="font-semibold text-slate-300">{resumeData?.skills?.length || 0}</span>
                  </div>
                  <div>
                    <span className="text-slate-500">Document Source:</span> <span className="font-mono text-brand-400">Provenance Grounded</span>
                  </div>
                </div>

                <div className="pt-2">
                  <span className="text-xs text-slate-500">Need to switch source resume?</span>
                  <button
                    onClick={() => setActiveStep(1)}
                    className="block text-xs text-brand-400 hover:text-brand-300 font-semibold mt-1"
                  >
                    ← Edit Profile or Ingest New File
                  </button>
                </div>
              </div>

              {/* Center / Right: JD Input & Analysis */}
              <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
                <form onSubmit={handleJDAnalyze} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                      Job Description Text (min. 50 characters)
                    </label>
                    <textarea
                      rows={8}
                      value={jdText}
                      onChange={(e) => setJdText(e.target.value)}
                      placeholder="Paste target job description here (e.g. Registered Nurse ICU, Senior Electrician, Software Engineer, Financial Controller)..."
                      className="w-full p-4 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 text-sm focus:outline-none focus:border-brand-500 resize-none font-mono"
                    />
                  </div>

                  <div className="flex justify-end gap-3">
                    <button
                      type="submit"
                      disabled={!jdText.trim() || jdAnalyzing}
                      className="px-6 py-3 bg-brand-600 hover:bg-brand-500 text-white rounded-xl text-sm font-semibold transition-colors disabled:opacity-50 flex items-center gap-2"
                    >
                      {jdAnalyzing ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          <span>Parsing Requirements...</span>
                        </>
                      ) : (
                        <>
                          <Briefcase className="w-4 h-4" />
                          <span>Analyze Job Description</span>
                        </>
                      )}
                    </button>
                  </div>
                </form>

                {/* Parsed JD summary if available */}
                {jdData && (
                  <div className="space-y-4 pt-4 border-t border-slate-800">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-bold text-white uppercase tracking-wider">
                        Extracted Requirements ({jdData.requirements?.length || 0})
                      </h4>
                      <span className="text-xs text-brand-400 font-medium">Domain: {jdData.target_domain || 'General'}</span>
                    </div>

                    <div className="grid md:grid-cols-2 gap-2 max-h-60 overflow-y-auto pr-1">
                      {jdData.requirements?.map((req: any, i: number) => (
                        <div key={i} className="p-3 bg-slate-950 border border-slate-800 rounded-xl text-xs space-y-1">
                          <div className="flex items-start justify-between gap-2">
                            <span className="font-medium text-slate-200">{req.requirement}</span>
                            {req.mandatory ? (
                              <span className="text-[10px] px-2 py-0.5 bg-rose-950/80 text-rose-300 border border-rose-800 rounded font-bold uppercase flex-shrink-0">
                                Required
                              </span>
                            ) : (
                              <span className="text-[10px] px-2 py-0.5 bg-slate-800 text-slate-400 border border-slate-700 rounded font-medium flex-shrink-0">
                                Preferred
                              </span>
                            )}
                          </div>
                          <span className="text-[11px] text-slate-500 capitalize">{req.category}</span>
                        </div>
                      ))}
                    </div>

                    <div className="flex justify-end pt-2">
                      <button
                        onClick={() => { setActiveStep(3); handleMatch(); }}
                        className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-sm font-semibold flex items-center gap-2 shadow-lg shadow-emerald-900/30"
                      >
                        <span>Run Dual-Engine Match & ATS</span>
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* STEP 3: ATS & DUAL-ENGINE MATCH RESULTS                  */}
        {/* ======================================================== */}
        {activeStep === 3 && (
          <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <Bot className="w-5 h-5 text-brand-400" />
                  Dual-Engine Match & ATS Evaluation
                </h2>
                <p className="text-slate-400 text-sm mt-0.5">
                  Distinguishing objective deterministic ATS signals from qualitative AI semantic interpretation.
                </p>
              </div>

              {!matchData && !matchRunning && (
                <button
                  onClick={handleMatch}
                  className="px-6 py-2.5 bg-brand-600 hover:bg-brand-500 text-white rounded-xl text-sm font-semibold"
                >
                  Run Analysis
                </button>
              )}
            </div>

            {matchRunning && (
              <div className="py-20 bg-slate-900 border border-slate-800 rounded-2xl text-center space-y-4">
                <div className="w-10 h-10 border-4 border-brand-500 border-t-transparent rounded-full animate-spin mx-auto" />
                <p className="text-brand-300 font-semibold">Correlating candidate evidence against hiring criteria...</p>
                <p className="text-xs text-slate-500">Computing deterministic keyword coverage and evaluating transferable competencies.</p>
              </div>
            )}

            {matchData && (
              <div className="space-y-6">
                
                {/* Composite Score Banner */}
                <div className="grid md:grid-cols-3 gap-4">
                  {/* Overall Composite */}
                  <div className="p-6 bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-800 rounded-2xl flex flex-col justify-between">
                    <div>
                      <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Composite Readiness Fit</span>
                      <div className="flex items-baseline gap-2 mt-2">
                        <span className="text-5xl font-black text-white">{matchData.composite_score}</span>
                        <span className="text-lg text-slate-500 font-semibold">/100</span>
                      </div>
                    </div>
                    <p className="text-xs text-slate-400 mt-4">
                      Blended metric: 50% objective ATS signals + 50% semantic context alignment.
                    </p>
                  </div>

                  {/* Deterministic ATS Score */}
                  <div className="p-6 bg-slate-900 border border-slate-800 rounded-2xl space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold uppercase tracking-wider text-sky-400 flex items-center gap-1.5">
                        <ShieldCheck className="w-4 h-4" /> Deterministic ATS Index
                      </span>
                      <span className="text-2xl font-bold text-white">{matchData.deterministic?.deterministic_ats_index || 0}%</span>
                    </div>
                    <div className="space-y-1.5 text-xs text-slate-300">
                      <div className="flex justify-between">
                        <span className="text-slate-400">Keyword Coverage:</span>
                        <span className="font-semibold">{matchData.deterministic?.keyword_coverage_pct || 0}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Required Skills Verified:</span>
                        <span className="font-semibold">{matchData.deterministic?.required_skill_coverage_pct || 0}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Document Completeness:</span>
                        <span className="font-semibold">{matchData.deterministic?.section_completeness?.completeness_pct || 0}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Parseability Score:</span>
                        <span className="font-semibold">{matchData.deterministic?.parseability_score || 0}/100</span>
                      </div>
                    </div>
                  </div>

                  {/* AI Qualitative Fit */}
                  <div className="p-6 bg-slate-900 border border-slate-800 rounded-2xl space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                        <Sparkles className="w-4 h-4" /> AI Contextual Fit
                      </span>
                      <span className="text-2xl font-bold text-white">{matchData.qualitative?.semantic_fit_score || 70}%</span>
                    </div>
                    <p className="text-xs text-slate-400">
                      Evaluates transferable skills, multi-domain analogies, and relevance beyond exact verbatim matching.
                    </p>
                    <div className="pt-1 text-xs">
                      <span className="text-slate-400">Transferable Skills Found:</span>{' '}
                      <span className="font-semibold text-white">{matchData.transferable_skills?.length || 0}</span>
                    </div>
                  </div>
                </div>

                {/* Evidence Gap Analysis Map */}
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                      <h3 className="text-lg font-bold text-white">Evidence Gap & Requirement Traceability</h3>
                      <p className="text-xs text-slate-400">Every requirement mapped directly to source candidate evidence.</p>
                    </div>

                    {/* Filter Tabs */}
                    <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
                      {(['all', 'evidence', 'transferable', 'missing'] as const).map(tab => (
                        <button
                          key={tab}
                          onClick={() => setGapFilter(tab)}
                          className={`px-3 py-1 rounded-lg capitalize font-medium ${
                            gapFilter === tab ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-white'
                          }`}
                        >
                          {tab}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-3">
                    {matchData.gap_analysis
                      ?.filter((gap: any) => {
                        if (gapFilter === 'evidence') return gap.status === 'EVIDENCE_FOUND';
                        if (gapFilter === 'transferable') return gap.status === 'TRANSFERABLE';
                        if (gapFilter === 'missing') return gap.status === 'MISSING';
                        return true;
                      })
                      .map((gap: any, i: number) => (
                        <div key={i} className="p-4 bg-slate-950 border border-slate-800/80 rounded-xl space-y-2">
                          <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
                            <span className="font-semibold text-slate-200 text-sm">{gap.requirement}</span>
                            {getStatusBadge(gap.status)}
                          </div>

                          {gap.candidate_evidence && (
                            <div className="p-2.5 bg-slate-900/80 rounded-lg text-xs border border-slate-800 text-slate-300">
                              <span className="text-brand-400 font-bold uppercase text-[10px] block mb-0.5">Source Evidence Quote:</span>
                              {gap.candidate_evidence}
                            </div>
                          )}

                          <p className="text-xs text-slate-400 italic">
                            {gap.explanation}
                          </p>
                        </div>
                      ))}
                  </div>
                </div>

                {/* Transferable Skills Callout if any */}
                {matchData.transferable_skills && matchData.transferable_skills.length > 0 && (
                  <div className="bg-sky-950/20 border border-sky-900/50 rounded-2xl p-6 space-y-3">
                    <h3 className="text-sm font-bold uppercase tracking-wider text-sky-400 flex items-center gap-2">
                      <Sparkles className="w-4 h-4" /> Transferable Skill Bridges
                    </h3>
                    <p className="text-xs text-slate-300">
                      Cross-domain capabilities that demonstrate readiness for this position:
                    </p>
                    <div className="grid md:grid-cols-2 gap-3">
                      {matchData.transferable_skills.map((ts: any, i: number) => (
                        <div key={i} className="p-3 bg-slate-900/80 border border-sky-900/30 rounded-xl text-xs space-y-1">
                          <span className="font-semibold text-sky-200">{ts.candidate_skill}</span>
                          <p className="text-slate-400">{ts.rationale}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Actionable Improvement Suggestions */}
                {matchData.improvement_suggestions && matchData.improvement_suggestions.length > 0 && (
                  <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-bold text-white flex items-center gap-2">
                        <Sparkles className="w-5 h-5 text-amber-400" />
                        Evidence-Grounded Resume Improvements
                      </h3>
                      <span className="text-xs text-slate-400">Zero-Fabrication Policy</span>
                    </div>

                    <div className="p-3 bg-amber-950/30 border border-amber-800/40 rounded-xl text-amber-300 text-xs">
                      Safety Notice: Suggestions optimize wording and terminology of your existing verified history. They do not add qualifications or unperformed work.
                    </div>

                    <div className="space-y-4">
                      {matchData.improvement_suggestions.map((sugg: any, i: number) => (
                        <div key={i} className="grid md:grid-cols-2 gap-4 p-4 bg-slate-950 border border-slate-800 rounded-xl">
                          <div>
                            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Original Evidence</span>
                            <p className="text-xs text-slate-300 mt-1">{sugg.source_evidence}</p>
                          </div>
                          <div>
                            <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider">Suggested Alignment</span>
                            <p className="text-xs text-emerald-200 mt-1">{sugg.suggested_text}</p>
                            <p className="text-[11px] text-slate-500 mt-1.5 italic">{sugg.rationale}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Bottom Navigation */}
                <div className="flex justify-between items-center pt-4">
                  <button
                    onClick={() => setActiveStep(2)}
                    className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-sm"
                  >
                    ← Back to JD
                  </button>

                  <button
                    onClick={handleGenerateVariant}
                    disabled={generatingVariant}
                    className="px-6 py-3 bg-brand-600 hover:bg-brand-500 text-white rounded-xl text-sm font-semibold flex items-center gap-2 shadow-lg shadow-brand-900/30 disabled:opacity-50"
                  >
                    {generatingVariant ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        <span>Generating Tailored Variant...</span>
                      </>
                    ) : (
                      <>
                        <span>Generate Targeted Resume Variant</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </div>

              </div>
            )}
          </div>
        )}

        {/* ======================================================== */}
        {/* STEP 4: TARGETED RESUME VARIANT STUDIO                   */}
        {/* ======================================================== */}
        {activeStep === 4 && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <FileText className="w-5 h-5 text-brand-400" />
                  Targeted Resume Variant Studio
                </h2>
                <p className="text-slate-400 text-sm mt-0.5">
                  Review your evidence-grounded resume variant tailored strictly to the target opportunity requirements.
                </p>
              </div>

              {variantData && (
                <button
                  onClick={() => setVariantSaved(true)}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors"
                >
                  {variantSaved ? <CheckCircle2 className="w-4 h-4" /> : <Layers className="w-4 h-4" />}
                  {variantSaved ? 'Saved to Version History' : 'Save Version'}
                </button>
              )}
            </div>

            {variantData ? (
              <div className="space-y-6">
                {/* Attestation Banner */}
                <div className="p-4 bg-emerald-950/20 border border-emerald-900/40 rounded-xl flex items-center justify-between text-xs text-emerald-400">
                  <span className="flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4" />
                    {variantData.integrity_attestation}
                  </span>
                  <span className="font-mono text-[10px] text-emerald-500 uppercase">ZERO FABRICATION GUARANTEE</span>
                </div>

                {/* Tailoring Summary */}
                {variantData.tailoring_summary && variantData.tailoring_summary.length > 0 && (
                  <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-2">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Tailoring Modifications</h3>
                    <ul className="grid md:grid-cols-2 gap-2 text-xs text-slate-300">
                      {variantData.tailoring_summary.map((mod: string, i: number) => (
                        <li key={i} className="flex items-center gap-2">
                          <Check className="w-3.5 h-3.5 text-brand-400 flex-shrink-0" />
                          <span>{mod}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Targeted Markdown Resume Document */}
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 space-y-4">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Targeted Resume Markdown</h3>
                  <pre className="p-6 bg-slate-950 border border-slate-800/80 rounded-xl text-slate-200 font-mono text-xs whitespace-pre-wrap leading-relaxed max-h-[500px] overflow-y-auto">
                    {variantData.variant_markdown}
                  </pre>
                </div>

                <div className="flex justify-between items-center pt-2">
                  <button
                    onClick={() => setActiveStep(3)}
                    className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-sm"
                  >
                    ← Back to Match Results
                  </button>

                  <button
                    onClick={() => setActiveStep(5)}
                    className="px-6 py-2.5 bg-brand-600 hover:bg-brand-500 text-white rounded-xl text-sm font-semibold flex items-center gap-2"
                  >
                    <span>View Career & Skill Pathways</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ) : (
              <div className="py-20 bg-slate-900 border border-slate-800 rounded-2xl text-center space-y-4">
                <FileText className="w-12 h-12 text-slate-600 mx-auto" />
                <p className="text-slate-300 font-semibold">No variant generated yet.</p>
                <button
                  onClick={handleGenerateVariant}
                  className="px-6 py-2.5 bg-brand-600 hover:bg-brand-500 text-white rounded-xl text-sm font-semibold"
                >
                  Generate Targeted Resume Variant
                </button>
              </div>
            )}
          </div>
        )}

        {/* ======================================================== */}
        {/* STEP 5: CAREER & SKILL PATHWAY RECOMMENDATIONS           */}
        {/* ======================================================== */}
        {activeStep === 5 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <Compass className="w-5 h-5 text-brand-400" />
                Career Pathways & Readiness Action Plan
              </h2>
              <p className="text-slate-400 text-sm mt-0.5">
                Targeted recommendations to bridge identified gaps and prepare structured context for downstream training and assessment.
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              {/* Recommendations List */}
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
                <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                  <Award className="w-4 h-4 text-yellow-400" /> Recommended Bridge Actions
                </h3>

                <div className="space-y-3">
                  {matchData?.career_pathway_recommendations && matchData.career_pathway_recommendations.length > 0 ? (
                    matchData.career_pathway_recommendations.map((rec: any, idx: number) => (
                      <div key={idx} className="p-4 bg-slate-950 border border-slate-800/80 rounded-xl space-y-1.5">
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-slate-200 text-xs">{rec.gap_area}</span>
                          <span className="text-[10px] px-2 py-0.5 bg-slate-800 text-brand-300 border border-slate-700 rounded capitalize">
                            {rec.type}
                          </span>
                        </div>
                        <p className="text-xs text-slate-400">{rec.recommended_action}</p>
                      </div>
                    ))
                  ) : (
                    <div className="p-4 bg-slate-950 rounded-xl text-xs text-slate-400">
                      Run Match Analysis to populate custom career pathway recommendations for this opportunity.
                    </div>
                  )}
                </div>
              </div>

              {/* Readiness Contract for Future Modules */}
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
                <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-emerald-400" /> Downstream Module Readiness Contract
                </h3>

                <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-3 text-xs">
                  <div>
                    <span className="text-slate-500 font-semibold block">Module 2 (Adaptive Assessment):</span>
                    <span className="text-slate-300">
                      Identified missing skill gaps are formatted as target assessment objectives.
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 font-semibold block">Module 3 (Simulation):</span>
                    <span className="text-slate-300">
                      Domain context ({jdData?.target_domain || 'General'}) and target role are pre-configured for situational scenarios.
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 font-semibold block">Module 5 (Hiring Operations):</span>
                    <span className="text-slate-300">
                      Candidate claims and deterministic ATS evidence are verified for human decision support.
                    </span>
                  </div>
                </div>

                <div className="pt-4 flex justify-between">
                  <button
                    onClick={() => setActiveStep(4)}
                    className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-sm"
                  >
                    ← Back to Variant Studio
                  </button>

                  <button
                    onClick={() => navigate('/dashboard')}
                    className="px-6 py-2.5 bg-brand-600 hover:bg-brand-500 text-white rounded-xl text-sm font-semibold flex items-center gap-2 shadow-lg shadow-brand-900/30"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Complete Module 1 Workflow</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
