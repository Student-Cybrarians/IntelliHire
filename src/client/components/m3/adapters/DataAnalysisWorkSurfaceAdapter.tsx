import { useState } from 'react';
import { BarChart2, Play, Table, AlertTriangle, Terminal, Code2 } from 'lucide-react';
import { WorkSurfaceAdapterProps } from '../WorkSurfaceTypes';

export default function DataAnalysisWorkSurfaceAdapter({
  task,
  candidateWork,
  onChange,
  onAction,
  onExecute,
  isExecuting,
  executionResult
}: WorkSurfaceAdapterProps) {
  const currentScript = candidateWork.script || candidateWork.code || '';
  const [activeTab, setActiveTab] = useState<'script' | 'dataset'>('script');

  const datasetSample = task?.scenario?.starting_data?.raw_events_sample || [
    { event_id: 'evt-101', timestamp: '2026-10-06T14:02:11Z', service: 'checkout-api', status: 'error', latency_ms: 1240 },
    { event_id: 'evt-102', timestamp: '2026-10-06T14:02:12Z', service: 'payment-gateway', status: 'timeout', latency_ms: 4500 },
    { event_id: 'evt-103', timestamp: '2026-10-06T14:02:15Z', service: 'order-worker', status: 'dlq_retry', latency_ms: 890 }
  ];

  const handleScriptChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    const updated = { ...candidateWork, script: val, code: val };
    onChange(updated);
    onAction('script_edit', { length: val.length }, updated);
  };

  const handleRun = () => {
    onExecute('run_data_analysis', { script: currentScript, candidate_work: candidateWork });
  };

  return (
    <div className="space-y-4 text-xs font-sans" role="region" aria-label="Data Analysis and Transformation Work Surface">
      {/* Top Toolbar */}
      <div className="flex items-center justify-between p-2.5 bg-[#001420] border border-[#002f47] rounded-xl">
        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#002235] text-purple-400 font-mono text-[11px] font-bold">
            <Code2 className="w-3.5 h-3.5" />
            <span>analysis.py</span>
          </span>
          <button
            type="button"
            onClick={() => setActiveTab('script')}
            className={`px-2.5 py-1 rounded transition-colors ${
              activeTab === 'script' ? 'bg-[#002a40] text-white font-bold' : 'text-slate-400 hover:text-white'
            }`}
          >
            Transformation Script
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('dataset')}
            className={`px-2.5 py-1 rounded transition-colors ${
              activeTab === 'dataset' ? 'bg-[#002a40] text-white font-bold' : 'text-slate-400 hover:text-white'
            }`}
          >
            Dataset Sample ({datasetSample.length} rows)
          </button>
        </div>

        <button
          type="button"
          disabled={isExecuting}
          onClick={handleRun}
          className="px-3.5 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white font-bold flex items-center gap-1.5 shadow-sm transition-all"
        >
          <Play className="w-3.5 h-3.5 fill-current" />
          <span>{isExecuting ? 'Transforming Dataset…' : 'Run Transformation'}</span>
        </button>
      </div>

      {/* Script Editor */}
      {activeTab === 'script' && (
        <div className="bg-[#00101b] border border-[#002f47] rounded-xl p-3 focus-within:border-purple-500 transition-colors">
          <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
            Python / Data Aggregation Logic:
          </label>
          <textarea
            rows={8}
            value={currentScript}
            onChange={handleScriptChange}
            spellCheck={false}
            placeholder={`import statistics\n\n# Filter dead-letter events and calculate error spike rates\ndef process_events(records):\n    errors = [r for r in records if r.get('status') != 'ok']\n    return {'error_rate': len(errors) / len(records)}\n`}
            className="w-full bg-transparent text-purple-300 font-mono text-xs leading-relaxed focus:outline-none resize-y"
          />
        </div>
      )}

      {/* Dataset Sample Table */}
      {activeTab === 'dataset' && (
        <div className="p-3.5 bg-[#00101b] border border-[#002f47] rounded-xl overflow-x-auto space-y-2">
          <span className="font-bold text-slate-300 block">Ingested Telemetry Stream Stream:</span>
          <pre className="p-3 bg-[#000a12] rounded-lg font-mono text-[11px] text-slate-300 overflow-x-auto border border-[#001d2c]">
            {JSON.stringify(datasetSample, null, 2)}
          </pre>
        </div>
      )}

      {/* Execution Results */}
      {executionResult && (
        <div className="p-3.5 bg-[#001420] border border-purple-500/30 rounded-xl font-mono text-[11px] text-purple-300 space-y-2">
          <div className="flex items-center justify-between pb-2 border-b border-purple-500/20">
            <span className="font-bold uppercase tracking-wider flex items-center gap-1.5">
              <Terminal className="w-3.5 h-3.5" />
              <span>Data Transformation Output ({executionResult.duration_ms}ms)</span>
            </span>
          </div>
          <pre className="whitespace-pre-wrap leading-relaxed">{executionResult.output}</pre>
        </div>
      )}
    </div>
  );
}
