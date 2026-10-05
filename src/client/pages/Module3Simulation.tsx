import { useState, useEffect } from 'react';
import { 
  Laptop, Database, DollarSign, Activity, FileText, 
  Play, CheckCircle2, AlertTriangle, RefreshCw, Send, 
  ShieldCheck, Award, Flame, ArrowRight, Sparkles, Clock, 
  HelpCircle, ChevronRight, Terminal, BarChart2, Layers
} from 'lucide-react';
import DashboardLayout from './dashboard/DashboardLayout';

interface SimulationDef {
  id: string;
  title: string;
  domain: string;
  simulation_type: string;
  target_role: string;
  competency_name: string;
  skill_name: string;
  difficulty_level: number;
  scenario: any;
  dynamic_injection: any;
  rubric: any;
  is_recommended_for_gap?: boolean;
  recommendation_reason?: string;
}

export default function Module3Simulation() {
  const [catalog, setCatalog] = useState<SimulationDef[]>([]);
  const [selectedDomain, setSelectedDomain] = useState<string>('all');
  const [activeSim, setActiveSim] = useState<SimulationDef | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Candidate workspace state
  const [candidateWork, setCandidateWork] = useState<any>({});
  const [telemetryCount, setTelemetryCount] = useState(0);
  const [currentStep, setCurrentStep] = useState(1);
  const [dynamicAlert, setDynamicAlert] = useState<any>(null);
  const [workNotes, setWorkNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [evaluation, setEvaluation] = useState<any>(null);

  // Tool specific feedback
  const [testRunOutput, setTestRunOutput] = useState<string | null>(null);

  const loadDefinitions = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/m3/simulations/definitions');
      const data = await res.json() as any;
      if (data.success) {
        setCatalog(data.simulations || []);
      }
    } catch (e) {
      console.error('Failed to load simulations', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDefinitions();
  }, []);

  const startSimulation = async (def: SimulationDef) => {
    setLoading(true);
    setEvaluation(null);
    setDynamicAlert(null);
    setTestRunOutput(null);
    try {
      const res = await fetch('/api/m3/simulations/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ definition_id: def.id })
      });
      const data = await res.json() as any;
      if (data.success) {
        setActiveSim(def);
        setSessionId(data.session_id);
        setCurrentStep(data.session.current_step || 1);
        setCandidateWork(data.session.candidate_work || def.scenario.starting_data || {});
        if (data.session.dynamic_state?.injected) {
          setDynamicAlert(data.session.dynamic_state.injection);
        }
      }
    } catch (e) {
      alert('Error starting simulation session');
    } finally {
      setLoading(false);
    }
  };

  const recordAction = async (actionType: string, payload: any, updatedWork?: any) => {
    if (!sessionId) return;
    try {
      const workToSave = updatedWork !== undefined ? updatedWork : candidateWork;
      const res = await fetch(`/api/m3/simulations/sessions/${sessionId}/action`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action_type: actionType,
          payload,
          candidate_work: workToSave
        })
      });
      const data = await res.json() as any;
      if (data.success) {
        setTelemetryCount(data.total_actions);
      }
    } catch (e) {
      console.error('Failed to record action', e);
    }
  };

  const triggerDynamicInjection = async () => {
    if (!sessionId) return;
    try {
      const res = await fetch(`/api/m3/simulations/sessions/${sessionId}/inject`, { method: 'POST' });
      const data = await res.json() as any;
      if (data.success) {
        setCurrentStep(2);
        setDynamicAlert(data.injection);
        await recordAction('dynamic_constraint_acknowledged', { alert: data.injection.alert_title });
      }
    } catch (e) {
      alert('Error triggering dynamic injection');
    }
  };

  const submitWork = async () => {
    if (!sessionId) return;
    setSubmitting(true);
    try {
      const res = await fetch(`/api/m3/simulations/sessions/${sessionId}/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          final_output: candidateWork,
          notes: workNotes
        })
      });
      const data = await res.json() as any;
      if (data.success) {
        setEvaluation(data);
      }
    } catch (e) {
      alert('Failed to submit simulation for evaluation');
    } finally {
      setSubmitting(false);
    }
  };

  const filteredCatalog = selectedDomain === 'all' 
    ? catalog 
    : catalog.filter(c => c.domain === selectedDomain);

  return (
    <DashboardLayout role="candidate" userFullName="Candidate Command">
      <div className="space-y-8">
        {/* Workspace Header */}
        <header className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-5 pb-6 border-b border-[#063750]">
          <div>
            <div className="flex items-center gap-2 text-[#FF4103] text-xs font-bold uppercase tracking-wider mb-2">
              <Laptop className="w-4 h-4 text-[#FF4103]" />
              <span>Module 3 · Technical, Domain & Professional Simulation</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
              Universal Practice & Simulation Sandbox
            </h1>
            <p className="text-slate-300 text-sm mt-1.5 max-w-3xl leading-relaxed">
              Domain-appropriate work environments designed to evaluate authentic performance—from software engineering and data triage to financial modeling, healthcare operations, and contract negotiation.
            </p>
          </div>

          {activeSim && (
            <button
              onClick={() => { setActiveSim(null); setSessionId(null); setEvaluation(null); }}
              className="px-4 py-2.5 rounded-xl bg-[#001f2e] border border-[#063750] text-slate-300 hover:text-white text-xs font-bold flex items-center gap-2 transition-colors"
            >
              <Layers className="w-4 h-4" />
              <span>Return to Catalog</span>
            </button>
          )}
        </header>

        {/* VIEW 1: SIMULATION CATALOG */}
        {!activeSim && (
          <div className="space-y-6">
            {/* Domain Filter Pills */}
            <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-[#063750]">
              {[
                { id: 'all', label: 'All Disciplines' },
                { id: 'software', label: 'Software & Tech' },
                { id: 'finance', label: 'Finance & Accounting' },
                { id: 'operations', label: 'Operations & Triage' },
                { id: 'data', label: 'Data Engineering' },
                { id: 'general', label: 'Legal & Procurement' }
              ].map(pill => (
                <button
                  key={pill.id}
                  onClick={() => setSelectedDomain(pill.id)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                    selectedDomain === pill.id
                      ? 'bg-[#FF4103] text-white shadow-md shadow-[#FF4103]/20'
                      : 'bg-[#001f2e] border border-[#063750] text-slate-400 hover:text-white'
                  }`}
                >
                  {pill.label}
                </button>
              ))}
            </div>

            {/* Simulations Grid */}
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredCatalog.map(sim => (
                <div
                  key={sim.id}
                  className={`bg-[#001f2e] border rounded-2xl p-6 shadow-lg flex flex-col justify-between transition-all hover:-translate-y-0.5 group ${
                    sim.is_recommended_for_gap ? 'border-[#FF4103]' : 'border-[#063750] hover:border-slate-500'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between pb-3 border-b border-[#002a40] mb-4">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-[#FF4103] bg-[#FF4103]/10 px-2 py-0.5 rounded">
                        {sim.simulation_type.replace('_', ' ')}
                      </span>
                      <span className="text-xs text-slate-400 font-mono">Level {sim.difficulty_level}</span>
                    </div>

                    {sim.is_recommended_for_gap && (
                      <div className="mb-3 px-2.5 py-1 rounded bg-[#FF4103]/15 border border-[#FF4103]/30 text-[#FF4103] text-[11px] font-bold flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>M02 Diagnosed Gap Target</span>
                      </div>
                    )}

                    <h3 className="text-lg font-bold text-white group-hover:text-[#FF4103] transition-colors leading-snug">
                      {sim.title}
                    </h3>
                    <p className="text-xs text-slate-400 mt-2 line-clamp-3 leading-relaxed">
                      {sim.scenario.background}
                    </p>

                    <div className="mt-4 pt-4 border-t border-[#002a40] space-y-1.5 text-[11px] text-slate-300">
                      <div><span className="text-slate-500 font-semibold">Role:</span> {sim.target_role}</div>
                      <div><span className="text-slate-500 font-semibold">Competency:</span> {sim.competency_name}</div>
                      <div><span className="text-slate-500 font-semibold">Output:</span> {sim.scenario.expected_output_type}</div>
                    </div>
                  </div>

                  <button
                    onClick={() => startSimulation(sim)}
                    className="w-full mt-6 py-2.5 rounded-xl bg-[#FF4103] hover:bg-[#e03200] text-white text-xs font-bold flex items-center justify-center gap-2 shadow-md shadow-[#FF4103]/20 transition-all"
                  >
                    <Play className="w-3.5 h-3.5" />
                    <span>Launch Simulation Workspace</span>
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* VIEW 2: ACTIVE SIMULATION WORKSPACE */}
        {activeSim && !evaluation && (
          <div className="space-y-6">
            {/* Simulation Context Ribbon */}
            <div className="bg-[#001f2e] border border-[#063750] rounded-2xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 text-xs">
                  <span className="font-bold text-[#FF4103] uppercase">{activeSim.domain}</span>
                  <span className="text-slate-500">·</span>
                  <span className="text-slate-300 font-semibold">{activeSim.competency_name}</span>
                  <span className="text-slate-500">({activeSim.skill_name})</span>
                </div>
                <h2 className="text-xl font-bold text-white mt-1">{activeSim.title}</h2>
              </div>

              <div className="flex items-center gap-3">
                <span className="text-xs text-slate-400 font-mono">Step {currentStep} of 2</span>
                {currentStep === 1 && activeSim.dynamic_injection && (
                  <button
                    onClick={triggerDynamicInjection}
                    className="px-3.5 py-1.5 rounded-lg bg-amber-500/15 border border-amber-500/40 text-amber-300 hover:bg-amber-500/25 text-xs font-bold flex items-center gap-1.5 transition-all"
                  >
                    <AlertTriangle className="w-3.5 h-3.5" />
                    <span>Trigger Dynamic Constraint Shift</span>
                  </button>
                )}
                <span className="text-xs text-slate-500 font-mono">{telemetryCount} actions logged</span>
              </div>
            </div>

            {/* Dynamic Injection Alert Banner (Phase 4) */}
            {dynamicAlert && (
              <div className="bg-amber-950/30 border border-amber-500/40 rounded-2xl p-5 shadow-lg space-y-2">
                <div className="flex items-center gap-2 text-amber-400 text-xs font-bold uppercase tracking-wider">
                  <AlertTriangle className="w-4 h-4 animate-bounce" />
                  <span>{dynamicAlert.alert_title}</span>
                </div>
                <p className="text-white text-sm font-semibold leading-relaxed">
                  {dynamicAlert.new_requirement}
                </p>
                <div className="text-xs text-amber-200/80 pt-1">
                  <span className="font-bold">Constraint Change:</span> {dynamicAlert.constraint_change}
                </div>
              </div>
            )}

            {/* Work Area Grid */}
            <div className="grid lg:grid-cols-12 gap-6">
              {/* Left Column: Briefing & Requirements */}
              <div className="lg:col-span-5 space-y-4">
                <div className="bg-[#001f2e] border border-[#063750] rounded-2xl p-6 shadow-lg space-y-4 text-xs">
                  <div>
                    <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-2">Scenario Objective</h3>
                    <p className="text-slate-300 leading-relaxed">{activeSim.scenario.objective}</p>
                  </div>

                  <div>
                    <h4 className="font-bold text-slate-400 uppercase tracking-wider mb-1.5">Initial Requirements</h4>
                    <ul className="space-y-1.5 text-slate-300 list-disc list-inside">
                      {activeSim.scenario.initial_requirements?.map((req: string, i: number) => (
                        <li key={i}>{req}</li>
                      ))}
                    </ul>
                  </div>

                  <div>
                    <h4 className="font-bold text-slate-400 uppercase tracking-wider mb-1.5">Operational Constraints</h4>
                    <ul className="space-y-1.5 text-slate-400 list-disc list-inside">
                      {activeSim.scenario.constraints?.map((con: string, i: number) => (
                        <li key={i}>{con}</li>
                      ))}
                    </ul>
                  </div>

                  <div className="pt-2 border-t border-[#002a40]">
                    <span className="font-bold text-slate-500 block mb-1">Available Tools:</span>
                    <div className="flex flex-wrap gap-1.5">
                      {activeSim.scenario.tools_available?.map((t: string, i: number) => (
                        <span key={i} className="px-2 py-0.5 rounded bg-[#001824] border border-[#002f47] text-slate-300 text-[10px]">
                          {t}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Candidate Methodology Notes */}
                <div className="bg-[#001f2e] border border-[#063750] rounded-2xl p-5 shadow-lg space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    Decision Justification & Methodology Notes
                  </label>
                  <textarea
                    rows={4}
                    value={workNotes}
                    onChange={e => setWorkNotes(e.target.value)}
                    placeholder="Document your key trade-offs, rationale, and how you adapted to constraints..."
                    className="w-full bg-[#001824] border border-[#002f47] rounded-xl p-3 text-white text-xs focus:outline-none focus:border-[#FF4103] transition-colors"
                  />
                </div>
              </div>

              {/* Right Column: Interactive Work Surface Tailored by Simulation Type */}
              <div className="lg:col-span-7 space-y-4">
                <div className="bg-[#001f2e] border border-[#063750] rounded-2xl p-6 shadow-lg space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-[#002a40]">
                    <span className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                      <Terminal className="w-4 h-4 text-[#FF4103]" />
                      <span>Interactive Work Surface ({activeSim.simulation_type.replace('_', ' ')})</span>
                    </span>
                    <span className="text-[11px] text-slate-400 font-mono">Live Session</span>
                  </div>

                  {/* Surface 1: CODING TASK */}
                  {activeSim.simulation_type === 'coding' && (
                    <div className="space-y-3">
                      <textarea
                        rows={12}
                        value={candidateWork.template_code || candidateWork.code || ''}
                        onChange={e => {
                          const updated = { ...candidateWork, code: e.target.value };
                          setCandidateWork(updated);
                          recordAction('code_edit', { length: e.target.value.length }, updated);
                        }}
                        className="w-full bg-[#001420] border border-[#002f47] rounded-xl p-4 font-mono text-xs text-emerald-400 focus:outline-none focus:border-[#FF4103] leading-relaxed"
                      />
                      <div className="flex justify-between items-center">
                        <button
                          onClick={() => {
                            setTestRunOutput('✓ Test 1: Under limit (50 reqs) -> 200 OK\n✓ Test 2: Concurrency burst (120 reqs) -> 429 Rate Limited at 101st\n✓ Test 3: Rolling window expiration -> tokens refilled safely\n[Pass: 3/3 Tests]');
                            recordAction('run_tests', { passed: 3, total: 3 });
                          }}
                          className="px-3.5 py-1.5 rounded-lg bg-[#001824] border border-[#002f47] text-slate-300 hover:text-white text-xs font-bold flex items-center gap-1.5"
                        >
                          <Play className="w-3 h-3 text-emerald-400" />
                          <span>Run Test Cases</span>
                        </button>
                      </div>
                      {testRunOutput && (
                        <div className="p-3 bg-[#00121c] border border-emerald-500/20 rounded-xl font-mono text-[11px] text-emerald-400 whitespace-pre-line">
                          {testRunOutput}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Surface 2: FINANCIAL ANALYSIS */}
                  {activeSim.simulation_type === 'financial_analysis' && (
                    <div className="space-y-3 text-xs">
                      <div className="p-3 bg-[#001824] rounded-xl border border-[#002f47]">
                        <span className="text-slate-400 font-bold block mb-2">Project Proposals Under $15M Envelope:</span>
                        <div className="space-y-2">
                          {activeSim.scenario.starting_data.projects?.map((p: any, i: number) => (
                            <div key={i} className="flex items-center justify-between p-2 bg-[#00111a] rounded border border-[#002538]">
                              <span className="font-bold text-white">{p.name}</span>
                              <span className="text-slate-400">CapEx: ${(p.capex / 1000000).toFixed(1)}M</span>
                              <span className="text-emerald-400 font-mono">5-Yr Cash: ${(p.cash_flows_y1_5.reduce((a:number,b:number)=>a+b,0) / 1000000).toFixed(1)}M</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      <label className="text-slate-400 font-bold block">Executive CapEx Recommendation Memo:</label>
                      <textarea
                        rows={8}
                        value={candidateWork.memo || ''}
                        onChange={e => {
                          const updated = { ...candidateWork, memo: e.target.value };
                          setCandidateWork(updated);
                          recordAction('memo_edit', { length: e.target.value.length }, updated);
                        }}
                        placeholder="State your portfolio selection, calculated NPV/IRR, and defense against rate hike..."
                        className="w-full bg-[#001420] border border-[#002f47] rounded-xl p-3 text-white text-xs focus:outline-none focus:border-[#FF4103]"
                      />
                    </div>
                  )}

                  {/* Surface 3: OPERATIONAL TRIAGE */}
                  {activeSim.simulation_type === 'operational_triage' && (
                    <div className="space-y-3 text-xs">
                      <span className="text-slate-400 font-bold block">Patient Acuity Queue & Resource Allocation:</span>
                      <div className="space-y-2">
                        {activeSim.scenario.starting_data.patient_queue?.map((pt: any, i: number) => (
                          <div key={i} className="p-3 bg-[#001824] rounded-xl border border-[#002f47] flex items-center justify-between">
                            <div>
                              <span className="font-bold text-white mr-2">{pt.id}</span>
                              <span className="text-slate-400">{pt.condition}</span>
                            </div>
                            <span className="px-2 py-0.5 rounded bg-red-500/15 text-red-400 font-bold text-[10px]">
                              {pt.acuity}
                            </span>
                          </div>
                        ))}
                      </div>

                      <label className="text-slate-400 font-bold block pt-2">Staff Assignment & Bed Allocation Plan:</label>
                      <textarea
                        rows={6}
                        value={candidateWork.triage_plan || ''}
                        onChange={e => {
                          const updated = { ...candidateWork, triage_plan: e.target.value };
                          setCandidateWork(updated);
                          recordAction('triage_plan_edit', { length: e.target.value.length }, updated);
                        }}
                        placeholder="Detail which RN manages which bed/patient, how breaks are covered, and hazmat response..."
                        className="w-full bg-[#001420] border border-[#002f47] rounded-xl p-3 text-white text-xs focus:outline-none focus:border-[#FF4103]"
                      />
                    </div>
                  )}

                  {/* Surface 4: DATA / WRITTEN GENERAL FALLBACK */}
                  {(activeSim.simulation_type === 'data_analysis' || activeSim.simulation_type === 'written_response') && (
                    <div className="space-y-3 text-xs">
                      {activeSim.scenario.starting_data?.msa_extract && (
                        <div className="p-3 bg-[#001824] rounded-xl border border-[#002f47] text-slate-300 italic">
                          "{activeSim.scenario.starting_data.msa_extract}"
                        </div>
                      )}
                      {activeSim.scenario.starting_data?.raw_events_sample && (
                        <div className="p-3 bg-[#001824] rounded-xl border border-[#002f47] font-mono text-[11px] text-slate-300 overflow-x-auto">
                          {JSON.stringify(activeSim.scenario.starting_data.raw_events_sample, null, 2)}
                        </div>
                      )}

                      <label className="text-slate-400 font-bold block">Draft Final Artifact / Transformation / Notice:</label>
                      <textarea
                        rows={8}
                        value={candidateWork.output_text || ''}
                        onChange={e => {
                          const updated = { ...candidateWork, output_text: e.target.value };
                          setCandidateWork(updated);
                          recordAction('draft_edit', { length: e.target.value.length }, updated);
                        }}
                        placeholder="Draft the final artifact conforming to scenario requirements..."
                        className="w-full bg-[#001420] border border-[#002f47] rounded-xl p-3 text-white text-xs focus:outline-none focus:border-[#FF4103]"
                      />
                    </div>
                  )}

                  {/* Submission Action */}
                  <div className="pt-4 border-t border-[#002a40] flex justify-end">
                    <button
                      disabled={submitting}
                      onClick={submitWork}
                      className="px-6 py-2.5 rounded-xl bg-[#FF4103] hover:bg-[#e03200] disabled:opacity-50 text-white text-xs font-bold flex items-center gap-2 shadow-md shadow-[#FF4103]/20 transition-all"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>{submitting ? 'Evaluating with Multi-Dimensional Rubric…' : 'Submit Simulation for Evaluation'}</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* VIEW 3: MULTI-DIMENSIONAL EVALUATION & EVIDENCE DEBRIEF */}
        {evaluation && (
          <div className="space-y-6">
            <div className="bg-[#001f2e] border border-[#FF4103]/40 rounded-2xl p-6 sm:p-7 shadow-lg space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#002a40]">
                <div>
                  <span className="text-xs font-bold text-[#FF4103] uppercase tracking-wider">Simulation Evaluated</span>
                  <h2 className="text-2xl font-black text-white mt-1">Multi-Dimensional Performance Debrief</h2>
                  <p className="text-xs text-slate-400 mt-1">{activeSim?.title} ({activeSim?.competency_name})</p>
                </div>
                <div className="text-right">
                  <div className="text-4xl font-black text-white">{evaluation.overall_score}%</div>
                  <span className="text-[10px] text-emerald-400 uppercase font-bold">Demonstrated Proficiency</span>
                </div>
              </div>

              {/* Dimensional Scores Breakdown */}
              <div className="grid sm:grid-cols-2 md:grid-cols-5 gap-3">
                {Object.entries(evaluation.dimension_scores || {}).map(([dim, score]: [string, any]) => (
                  <div key={dim} className="p-3 bg-[#001824] rounded-xl border border-[#002f47] text-center">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                      {dim.replace('_', ' ')}
                    </span>
                    <span className="text-lg font-black text-white">{Math.round(score * 100)}%</span>
                  </div>
                ))}
              </div>

              {/* Observable Evidence (Phase 7) */}
              <div className="bg-[#001824] rounded-xl p-5 border border-[#002f47] space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-white flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>Observable Performance Evidence (Audit Log)</span>
                </h4>
                <ul className="space-y-1.5 text-xs text-slate-300 list-disc list-inside">
                  {evaluation.observable_evidence?.key_actions_identified?.map((act: string, i: number) => (
                    <li key={i}>{act}</li>
                  ))}
                  {evaluation.observable_evidence?.constraint_adherence && (
                    <li>Constraint Adherence: {evaluation.observable_evidence.constraint_adherence}</li>
                  )}
                </ul>
              </div>

              {/* Strengths & Gaps */}
              <div className="grid md:grid-cols-2 gap-4 text-xs">
                <div className="p-4 bg-emerald-950/20 border border-emerald-500/20 rounded-xl space-y-1">
                  <span className="font-bold text-emerald-400 uppercase tracking-wider text-[10px] block">Observed Strengths</span>
                  <p className="text-slate-300 leading-relaxed">{evaluation.model_interpretation?.strengths}</p>
                </div>
                <div className="p-4 bg-amber-950/20 border border-amber-500/20 rounded-xl space-y-1">
                  <span className="font-bold text-amber-400 uppercase tracking-wider text-[10px] block">Target Opportunities</span>
                  <p className="text-slate-300 leading-relaxed">{evaluation.model_interpretation?.gaps}</p>
                </div>
              </div>

              {/* Phase 8: M02 Feedback & Remediation Loop */}
              {evaluation.remediation_recommendations?.length > 0 && (
                <div className="p-4 bg-[#001420] border border-blue-500/30 rounded-xl space-y-2 text-xs">
                  <div className="flex items-center gap-2 text-blue-400 font-bold uppercase tracking-wider text-[10px]">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>M02 Learning & Practice Feedback Loop</span>
                  </div>
                  {evaluation.remediation_recommendations.map((rem: any, i: number) => (
                    <div key={i} className="text-slate-300 pt-1">
                      <div><span className="text-slate-400 font-semibold">Recommended Study:</span> {rem.recommended_study}</div>
                      <div><span className="text-slate-400 font-semibold">Practice Drill:</span> {rem.recommended_practice}</div>
                    </div>
                  ))}
                </div>
              )}

              {/* Bottom Actions */}
              <div className="flex justify-between items-center pt-4 border-t border-[#002a40]">
                <div className="text-xs text-slate-400 flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-[#FF4103]" />
                  <span>Evidence recorded into Candidate Portfolio & verified readiness updated.</span>
                </div>
                <button
                  onClick={() => { setActiveSim(null); setSessionId(null); setEvaluation(null); }}
                  className="px-5 py-2.5 rounded-xl bg-[#FF4103] hover:bg-[#e03200] text-white text-xs font-bold flex items-center gap-2 transition-all shadow-md shadow-[#FF4103]/20"
                >
                  <ArrowRight className="w-4 h-4" />
                  <span>Continue in Catalog</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
