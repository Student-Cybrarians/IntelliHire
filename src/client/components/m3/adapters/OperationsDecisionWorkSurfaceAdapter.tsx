import { useState } from 'react';
import { Activity, Play, AlertTriangle, CheckCircle2, Users, ShieldAlert } from 'lucide-react';
import { WorkSurfaceAdapterProps } from '../WorkSurfaceTypes';

export default function OperationsDecisionWorkSurfaceAdapter({
  task,
  candidateWork,
  onChange,
  onAction,
  onExecute,
  isExecuting,
  executionResult
}: WorkSurfaceAdapterProps) {
  const patientQueue = task?.scenario?.starting_data?.patient_queue || [
    { id: 'P-101', condition: 'Multiple trauma, intubated', acuity: 'ESI-1' },
    { id: 'P-102', condition: 'STEMI active chest pain', acuity: 'ESI-2' },
    { id: 'P-103', condition: 'Pediatric blunt abdominal trauma', acuity: 'ESI-2' },
    { id: 'P-104', condition: 'Compound femur fracture', acuity: 'ESI-3' },
    { id: 'P-105', condition: 'Acute respiratory distress', acuity: 'ESI-2' },
    { id: 'P-106', condition: 'Laceration repair, stable vitals', acuity: 'ESI-3' }
  ];

  const planText = candidateWork.triage_plan || '';
  const overtimeHours = candidateWork.overtime_hours || 12;

  const handlePlanChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    const updated = { ...candidateWork, triage_plan: val };
    onChange(updated);
    onAction('triage_plan_edit', { length: val.length }, updated);
  };

  const handleOvertimeChange = (val: number) => {
    const updated = { ...candidateWork, overtime_hours: val };
    onChange(updated);
    onAction('overtime_budget_change', { overtime_hours: val }, updated);
  };

  const handleSimulate = () => {
    onExecute('run_operations_triage', { candidate_work: candidateWork });
  };

  return (
    <div className="space-y-4 text-xs font-sans" role="region" aria-label="Operations and Resource Allocation Work Surface">
      {/* Patient Acuity Queue Board */}
      <div className="p-3.5 bg-[#001420] border border-[#002f47] rounded-xl space-y-3">
        <div className="flex items-center justify-between">
          <span className="font-bold text-white flex items-center gap-1.5">
            <Activity className="w-4 h-4 text-red-400" />
            <span>Emergency Patient Acuity Queue (ESI Triage)</span>
          </span>
          <span className="text-[11px] text-slate-400 font-mono">Capacity: 8 Open ICU/Step-Down Beds</span>
        </div>

        <div className="grid sm:grid-cols-2 gap-2">
          {patientQueue.map((pt: any, i: number) => (
            <div key={i} className="p-2.5 bg-[#00101b] rounded-lg border border-[#002538] flex items-center justify-between">
              <div>
                <span className="font-bold text-white font-mono mr-2">{pt.id}</span>
                <span className="text-slate-300 text-[11px]">{pt.condition}</span>
              </div>
              <span className={`px-2 py-0.5 rounded font-mono font-bold text-[10px] ${
                pt.acuity === 'ESI-1' ? 'bg-red-500/20 text-red-400 border border-red-500/30' :
                pt.acuity === 'ESI-2' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' :
                'bg-slate-700/30 text-slate-300'
              }`}>
                {pt.acuity}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Staffing Controls & Overtime */}
      <div className="p-3.5 bg-[#00101b] border border-[#002f47] rounded-xl space-y-3">
        <div className="flex items-center justify-between pb-2 border-b border-[#002538]">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-emerald-400" />
            <span className="font-bold text-white">Staff Allocation & Overtime Cap (Max 16h)</span>
          </div>
          <button
            type="button"
            disabled={isExecuting}
            onClick={handleSimulate}
            className="px-3.5 py-1.5 rounded-lg bg-[#FF4103] hover:bg-[#e03200] disabled:opacity-50 text-white font-bold flex items-center gap-1.5 shadow-sm transition-all"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>{isExecuting ? 'Simulating Shift Ratios…' : 'Simulate Shift & Check Safety Ratios'}</span>
          </button>
        </div>

        <div className="flex items-center justify-between p-2.5 bg-[#001420] rounded-lg border border-[#002538]">
          <span className="text-slate-300">Float Pool Overtime Hours Allocated:</span>
          <div className="flex items-center gap-2">
            <input
              type="range"
              min="0"
              max="24"
              value={overtimeHours}
              onChange={e => handleOvertimeChange(Number(e.target.value))}
              className="accent-[#FF4103]"
            />
            <span className={`font-mono font-bold text-xs ${overtimeHours > 16 ? 'text-red-400' : 'text-emerald-400'}`}>
              {overtimeHours}h / 16h Max
            </span>
          </div>
        </div>

        {/* Execution Output */}
        {executionResult && (
          <div className="p-3.5 bg-[#001420] border border-amber-500/30 rounded-xl font-mono text-[11px] text-amber-300 space-y-2">
            <pre className="whitespace-pre-wrap">{executionResult.output}</pre>
          </div>
        )}

        {/* Staff Assignment & Bed Allocation Plan */}
        <div>
          <label className="text-slate-300 font-bold block mb-1.5">
            Operational Bed Assignment & Critical Hazmat Protocol:
          </label>
          <textarea
            rows={6}
            value={planText}
            onChange={handlePlanChange}
            placeholder="Assign certified ICU nurses to P-101 and ESI-1/2 cases, plan mandatory meal/rest break relief coverage, and detail pediatric trauma zero-diversion..."
            className="w-full p-3 bg-[#001420] border border-[#002538] rounded-lg text-white text-xs leading-relaxed focus:outline-none focus:border-[#FF4103]"
          />
        </div>
      </div>
    </div>
  );
}
