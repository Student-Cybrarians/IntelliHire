import { useState } from 'react';
import { DollarSign, Calculator, AlertTriangle, CheckCircle2, TrendingUp, FileText } from 'lucide-react';
import { WorkSurfaceAdapterProps } from '../WorkSurfaceTypes';

export default function FinancialTableWorkSurfaceAdapter({
  task,
  candidateWork,
  onChange,
  onAction,
  onExecute,
  isExecuting,
  executionResult
}: WorkSurfaceAdapterProps) {
  const initialProjects = task?.scenario?.starting_data?.projects || [
    { name: 'Project Alpha (Core Cloud Migration)', capex: 8000000, cash_flows_y1_5: [2200000, 2500000, 2800000, 3000000, 3200000] },
    { name: 'Project Beta (AI Billing Automation)', capex: 6500000, cash_flows_y1_5: [1800000, 2100000, 2400000, 2600000, 2800000] },
    { name: 'Project Gamma (Legacy Data Warehousing)', capex: 5000000, cash_flows_y1_5: [1200000, 1500000, 1800000, 2000000, 2200000] }
  ];

  const [selectedProjects, setSelectedProjects] = useState<string[]>(
    candidateWork.selected_projects || ['Project Alpha (Core Cloud Migration)', 'Project Beta (AI Billing Automation)']
  );

  const memoText = candidateWork.memo || '';

  const toggleProject = (name: string) => {
    const next = selectedProjects.includes(name)
      ? selectedProjects.filter(p => p !== name)
      : [...selectedProjects, name];
    setSelectedProjects(next);
    const updated = { ...candidateWork, selected_projects: next };
    onChange(updated);
    onAction('financial_portfolio_update', { selected: next }, updated);
  };

  const handleMemoChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    const updated = { ...candidateWork, memo: val, selected_projects: selectedProjects };
    onChange(updated);
    onAction('memo_edit', { length: val.length }, updated);
  };

  const activeProjects = initialProjects.filter((p: any) => selectedProjects.includes(p.name));
  const totalCapEx = activeProjects.reduce((acc: number, p: any) => acc + Number(p.capex || 0), 0);
  const capExLimit = 15000000;
  const isOverBudget = totalCapEx > capExLimit;
  const capExPct = Math.min(100, Math.round((totalCapEx / capExLimit) * 100));

  const handleCalculate = () => {
    onExecute('calc_financials', {
      selected_projects: selectedProjects,
      projects: initialProjects,
      candidate_work: candidateWork
    });
  };

  return (
    <div className="space-y-4 text-xs font-sans" role="region" aria-label="Financial Modeling and Capital Allocation Work Surface">
      {/* CapEx Envelope Meter */}
      <div className="p-3.5 bg-[#001420] border border-[#002f47] rounded-xl space-y-2">
        <div className="flex items-center justify-between">
          <span className="font-bold text-white flex items-center gap-1.5">
            <DollarSign className="w-4 h-4 text-emerald-400" />
            <span>Capital Expenditure Allocation ($15.0M Envelope)</span>
          </span>
          <span className={`font-mono font-bold ${isOverBudget ? 'text-red-400' : 'text-emerald-400'}`}>
            ${(totalCapEx / 1000000).toFixed(2)}M / $15.00M ({capExPct}%)
          </span>
        </div>
        <div className="w-full bg-[#002235] rounded-full h-2 overflow-hidden">
          <div
            className={`h-full transition-all duration-300 ${isOverBudget ? 'bg-red-500' : 'bg-emerald-500'}`}
            style={{ width: `${capExPct}%` }}
          />
        </div>
        {isOverBudget && (
          <div className="text-[11px] text-red-400 flex items-center gap-1 pt-1 font-semibold">
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>Warning: Total proposed CapEx exceeds the $15.0M ceiling constraint!</span>
          </div>
        )}
      </div>

      {/* Project Selection Schedule Table */}
      <div className="bg-[#00101b] border border-[#002f47] rounded-xl p-3.5 space-y-3">
        <div className="flex items-center justify-between pb-2 border-b border-[#002538]">
          <span className="font-bold text-slate-300">Project Proposals Evaluation Table:</span>
          <button
            type="button"
            disabled={isExecuting}
            onClick={handleCalculate}
            className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold flex items-center gap-1.5 shadow-sm transition-all"
          >
            <Calculator className="w-3.5 h-3.5" />
            <span>{isExecuting ? 'Calculating…' : 'Calculate Portfolio NPV & Sensitivity'}</span>
          </button>
        </div>

        <div className="space-y-2">
          {initialProjects.map((p: any, i: number) => {
            const isSelected = selectedProjects.includes(p.name);
            const totalCash = (p.cash_flows_y1_5 || []).reduce((a: number, b: number) => a + b, 0);
            return (
              <div
                key={i}
                onClick={() => toggleProject(p.name)}
                className={`p-3 rounded-lg border cursor-pointer flex items-center justify-between transition-all ${
                  isSelected
                    ? 'bg-[#001c2b] border-emerald-500/40 text-white shadow-sm'
                    : 'bg-[#001420] border-[#002538] text-slate-400 hover:border-slate-500'
                }`}
                role="checkbox"
                aria-checked={isSelected}
                tabIndex={0}
                onKeyDown={e => { if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); toggleProject(p.name); } }}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-4 h-4 rounded border flex items-center justify-center ${
                    isSelected ? 'bg-emerald-500 border-emerald-400 text-black font-bold text-xs' : 'border-slate-600'
                  }`}>
                    {isSelected ? '✓' : ''}
                  </div>
                  <div>
                    <div className="font-bold text-white text-xs">{p.name}</div>
                    <div className="text-[11px] text-slate-400">Initial CapEx: ${(p.capex / 1000000).toFixed(2)}M</div>
                  </div>
                </div>
                <div className="text-right font-mono text-[11px]">
                  <div className="text-emerald-400 font-bold">5-Yr Cash Flow: ${(totalCash / 1000000).toFixed(2)}M</div>
                  <div className="text-slate-400">Undiscounted ROI: {Math.round((totalCash / p.capex - 1) * 100)}%</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Financial Execution Results */}
      {executionResult && (
        <div className="p-3.5 bg-[#001420] border border-emerald-500/30 rounded-xl font-mono text-[11px] text-emerald-300 space-y-2">
          <pre className="whitespace-pre-wrap leading-relaxed">{executionResult.output}</pre>
        </div>
      )}

      {/* Executive CapEx Memo Input */}
      <div className="bg-[#00101b] border border-[#002f47] rounded-xl p-3.5 space-y-2">
        <label className="text-slate-300 font-bold block flex items-center gap-1.5">
          <FileText className="w-3.5 h-3.5 text-emerald-400" />
          <span>Executive Capital Allocation Recommendation Memo:</span>
        </label>
        <textarea
          rows={6}
          value={memoText}
          onChange={handleMemoChange}
          placeholder="State your portfolio selection, defense against inflation/rate hike, and capital risk mitigations..."
          className="w-full p-3 bg-[#001420] border border-[#002538] rounded-lg text-white text-xs leading-relaxed focus:outline-none focus:border-emerald-500"
        />
      </div>
    </div>
  );
}
