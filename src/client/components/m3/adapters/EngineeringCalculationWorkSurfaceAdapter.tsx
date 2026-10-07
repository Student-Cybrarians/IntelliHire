import { useState } from 'react';
import { Cpu, Play, CheckCircle2, AlertTriangle, Layers, BookOpen } from 'lucide-react';
import { WorkSurfaceAdapterProps } from '../WorkSurfaceTypes';

export default function EngineeringCalculationWorkSurfaceAdapter({
  task,
  candidateWork,
  onChange,
  onAction,
  onExecute,
  isExecuting,
  executionResult
}: WorkSurfaceAdapterProps) {
  const [params, setParams] = useState({
    arrivalRate: candidateWork.arrivalRate || 500,
    serviceRate: candidateWork.serviceRate || 650,
    concurrencySlots: candidateWork.concurrencySlots || 32,
    p99TargetMs: candidateWork.p99TargetMs || 15
  });

  const notes = candidateWork.derivation_notes || '';

  const handleParamChange = (field: string, val: number) => {
    const updatedParams = { ...params, [field]: val };
    setParams(updatedParams);
    const updatedWork = { ...candidateWork, ...updatedParams };
    onChange(updatedWork);
    onAction('engineering_calc_update', { field, value: val }, updatedWork);
  };

  const handleNotesChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    const updated = { ...candidateWork, derivation_notes: val };
    onChange(updated);
    onAction('derivation_notes_edit', { length: val.length }, updated);
  };

  const utilization = Math.round((params.arrivalRate / params.serviceRate) * 100);
  const isStable = params.arrivalRate < params.serviceRate;

  const handleVerify = () => {
    onExecute('verify_engineering_calc', { parameters: params, candidate_work: candidateWork });
  };

  return (
    <div className="space-y-4 text-xs font-sans" role="region" aria-label="Engineering Calculation Work Surface">
      {/* Parameter Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3 bg-[#001420] border border-[#002f47] rounded-xl">
          <span className="text-[10px] text-slate-400 uppercase font-bold block mb-1">Arrival Rate (λ)</span>
          <input
            type="number"
            value={params.arrivalRate}
            onChange={e => handleParamChange('arrivalRate', Number(e.target.value))}
            className="w-full bg-[#000e17] border border-[#002538] rounded p-1.5 text-white font-mono text-xs"
          />
          <span className="text-[10px] text-slate-500 mt-1 block">reqs/second</span>
        </div>

        <div className="p-3 bg-[#001420] border border-[#002f47] rounded-xl">
          <span className="text-[10px] text-slate-400 uppercase font-bold block mb-1">Service Rate (μ)</span>
          <input
            type="number"
            value={params.serviceRate}
            onChange={e => handleParamChange('serviceRate', Number(e.target.value))}
            className="w-full bg-[#000e17] border border-[#002538] rounded p-1.5 text-white font-mono text-xs"
          />
          <span className="text-[10px] text-slate-500 mt-1 block">reqs/second</span>
        </div>

        <div className="p-3 bg-[#001420] border border-[#002f47] rounded-xl">
          <span className="text-[10px] text-slate-400 uppercase font-bold block mb-1">Utilization (ρ)</span>
          <div className={`text-base font-bold font-mono ${isStable ? 'text-emerald-400' : 'text-red-400'}`}>
            {utilization}%
          </div>
          <span className="text-[10px] text-slate-500 block">{isStable ? 'Stable (ρ < 1.0)' : 'Unstable Queue'}</span>
        </div>

        <div className="p-3 bg-[#001420] border border-[#002f47] rounded-xl">
          <span className="text-[10px] text-slate-400 uppercase font-bold block mb-1">p99 Target</span>
          <input
            type="number"
            value={params.p99TargetMs}
            onChange={e => handleParamChange('p99TargetMs', Number(e.target.value))}
            className="w-full bg-[#000e17] border border-[#002538] rounded p-1.5 text-white font-mono text-xs"
          />
          <span className="text-[10px] text-slate-500 mt-1 block">milliseconds</span>
        </div>
      </div>

      {/* Equations & Proof Verification */}
      <div className="p-3.5 bg-[#00101b] border border-[#002f47] rounded-xl space-y-3">
        <div className="flex items-center justify-between pb-2 border-b border-[#002538]">
          <span className="font-bold text-white flex items-center gap-1.5">
            <BookOpen className="w-4 h-4 text-cyan-400" />
            <span>Analytical Model: Little's Law & M/M/1/K Queue Bounds</span>
          </span>
          <button
            type="button"
            disabled={isExecuting}
            onClick={handleVerify}
            className="px-3.5 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white font-bold flex items-center gap-1.5 shadow-sm transition-all"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>{isExecuting ? 'Verifying Equations…' : 'Verify System Proof'}</span>
          </button>
        </div>

        <div className="p-3 bg-[#001420] rounded-lg font-mono text-[11px] text-cyan-300 border border-[#002538]">
          L = λ * W | p99_latency = -ln(0.01) / (μ - λ) = {isStable ? ((-Math.log(0.01) / (params.serviceRate - params.arrivalRate)) * 1000).toFixed(1) : '∞'}ms
        </div>

        {/* Execution Output */}
        {executionResult && (
          <div className="p-3 bg-[#001420] border border-cyan-500/30 rounded-xl font-mono text-[11px] text-cyan-300">
            <pre className="whitespace-pre-wrap">{executionResult.output}</pre>
          </div>
        )}

        <label className="text-slate-400 font-bold block pt-1">
          Mathematical Derivation & Trade-off Proof:
        </label>
        <textarea
          rows={5}
          value={notes}
          onChange={handleNotesChange}
          placeholder="Demonstrate step-by-step mathematical derivation of memory overhead and burst stability..."
          className="w-full p-3 bg-[#001420] border border-[#002538] rounded-lg text-white text-xs leading-relaxed focus:outline-none focus:border-cyan-500"
        />
      </div>
    </div>
  );
}
