import { useState } from 'react';
import { Layers, CheckSquare, Play, CheckCircle2, ShieldCheck } from 'lucide-react';
import { WorkSurfaceAdapterProps } from '../WorkSurfaceTypes';

export default function StructuredResponseWorkSurfaceAdapter({
  task,
  candidateWork,
  onChange,
  onAction,
  onExecute,
  isExecuting,
  executionResult,
  operationalConstraints
}: WorkSurfaceAdapterProps) {
  const [checkedConstraints, setCheckedConstraints] = useState<number[]>(
    candidateWork.checked_constraints || []
  );

  const [deliverable, setDeliverable] = useState(
    candidateWork.output_text || candidateWork.solution || ''
  );

  const [tradeoffs, setTradeoffs] = useState(candidateWork.tradeoffs || '');

  const toggleConstraint = (idx: number) => {
    const next = checkedConstraints.includes(idx)
      ? checkedConstraints.filter(i => i !== idx)
      : [...checkedConstraints, idx];
    setCheckedConstraints(next);
    const updated = { ...candidateWork, checked_constraints: next };
    onChange(updated);
    onAction('constraint_self_audit', { checked_count: next.length }, updated);
  };

  const handleDeliverableChange = (val: string) => {
    setDeliverable(val);
    const updated = { ...candidateWork, output_text: val, solution: val };
    onChange(updated);
    onAction('structured_deliverable_edit', { length: val.length }, updated);
  };

  const handleTradeoffsChange = (val: string) => {
    setTradeoffs(val);
    const updated = { ...candidateWork, tradeoffs: val };
    onChange(updated);
    onAction('tradeoffs_edit', { length: val.length }, updated);
  };

  const handleValidate = () => {
    onExecute('validate_document', {
      candidate_work: { ...candidateWork, output_text: `${deliverable}\n\nTrade-offs:\n${tradeoffs}` }
    });
  };

  return (
    <div className="space-y-4 text-xs font-sans" role="region" aria-label="Structured Response and Constraint Audit Work Surface">
      {/* Constraint Self-Audit Checklist */}
      <div className="p-3.5 bg-[#001420] border border-[#002f47] rounded-xl space-y-2">
        <span className="font-bold text-white flex items-center gap-1.5">
          <CheckSquare className="w-4 h-4 text-emerald-400" />
          <span>Operational Constraints Self-Audit Checklist ({checkedConstraints.length}/{operationalConstraints.length})</span>
        </span>
        <div className="space-y-1.5">
          {operationalConstraints.map((con, idx) => {
            const isChecked = checkedConstraints.includes(idx);
            return (
              <label
                key={idx}
                className={`p-2 rounded-lg border flex items-center gap-2.5 cursor-pointer transition-colors ${
                  isChecked
                    ? 'bg-[#002235] border-emerald-500/40 text-emerald-200'
                    : 'bg-[#00101b] border-[#002538] text-slate-400 hover:text-slate-200'
                }`}
              >
                <input
                  type="checkbox"
                  checked={isChecked}
                  onChange={() => toggleConstraint(idx)}
                  className="rounded border-slate-700 text-emerald-500 focus:ring-0 accent-emerald-500"
                />
                <span className="text-[11px]">{con}</span>
              </label>
            );
          })}
        </div>
      </div>

      {/* Execution Results */}
      {executionResult && (
        <div className="p-3 bg-[#001420] border border-emerald-500/30 rounded-xl font-mono text-[11px] text-emerald-300">
          <pre className="whitespace-pre-wrap">{executionResult.output}</pre>
        </div>
      )}

      {/* Structured Deliverable */}
      <div className="p-3.5 bg-[#00101b] border border-[#002f47] rounded-xl space-y-2">
        <div className="flex items-center justify-between">
          <label className="font-bold text-slate-300 block">Structured Solution & Core Deliverable:</label>
          <button
            type="button"
            disabled={isExecuting}
            onClick={handleValidate}
            className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold flex items-center gap-1.5 transition-all shadow-sm"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>{isExecuting ? 'Validating…' : 'Validate Deliverable'}</span>
          </button>
        </div>
        <textarea
          rows={6}
          value={deliverable}
          onChange={e => handleDeliverableChange(e.target.value)}
          placeholder="State your technical/operational deliverable conforming directly to scenario constraints..."
          className="w-full p-3 bg-[#001420] border border-[#002538] rounded-lg text-white text-xs leading-relaxed focus:outline-none focus:border-emerald-500"
        />
      </div>

      {/* Trade-off Matrix */}
      <div className="p-3.5 bg-[#00101b] border border-[#002f47] rounded-xl space-y-2">
        <label className="font-bold text-slate-300 block">Trade-Off Analysis & Rollback Defense:</label>
        <textarea
          rows={3}
          value={tradeoffs}
          onChange={e => handleTradeoffsChange(e.target.value)}
          placeholder="Document secondary alternatives considered, blast radius containment, and rollback trigger..."
          className="w-full p-2.5 bg-[#001420] border border-[#002538] rounded-lg text-white text-xs leading-relaxed focus:outline-none focus:border-emerald-500"
        />
      </div>
    </div>
  );
}
