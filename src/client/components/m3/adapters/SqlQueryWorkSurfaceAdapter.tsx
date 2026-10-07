import { useState } from 'react';
import { Database, Play, CheckCircle2, AlertCircle, Terminal, Layers } from 'lucide-react';
import { WorkSurfaceAdapterProps } from '../WorkSurfaceTypes';

export default function SqlQueryWorkSurfaceAdapter({
  task,
  candidateWork,
  onChange,
  onAction,
  onExecute,
  isExecuting,
  executionResult
}: WorkSurfaceAdapterProps) {
  const defaultQuery = task?.scenario?.starting_data?.raw_query || 'CREATE INDEX CONCURRENTLY idx_orders_status_created ON orders (status, created_at DESC);';
  const currentQuery = candidateWork.query || candidateWork.code || defaultQuery;
  const [activeTab, setActiveTab] = useState<'editor' | 'schema'>('editor');

  const schemaInfo = task?.scenario?.starting_data?.schema || {
    table: 'orders',
    columns: [
      { name: 'id', type: 'UUID PRIMARY KEY' },
      { name: 'customer_id', type: 'UUID' },
      { name: 'status', type: 'VARCHAR(32)' },
      { name: 'total_amount', type: 'NUMERIC(12,2)' },
      { name: 'created_at', type: 'TIMESTAMPTZ' }
    ],
    existing_indexes: ['idx_orders_customer_id (customer_id)']
  };

  const handleQueryChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    const updated = { ...candidateWork, query: val, code: val };
    onChange(updated);
    onAction('sql_edit', { query_length: val.length }, updated);
  };

  const handleRun = () => {
    onExecute('run_sql', { query: currentQuery, candidate_work: { ...candidateWork, query: currentQuery, code: currentQuery } });
  };

  return (
    <div className="space-y-4 text-xs font-sans" role="region" aria-label="SQL and Relational Query Work Surface">
      {/* Top Toolbar */}
      <div className="flex items-center justify-between p-2.5 bg-[#001420] border border-[#002f47] rounded-xl">
        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#002235] text-sky-400 font-mono text-[11px] font-bold">
            <Database className="w-3.5 h-3.5" />
            <span>schema.sql</span>
          </span>
          <button
            type="button"
            onClick={() => setActiveTab('editor')}
            className={`px-2.5 py-1 rounded transition-colors ${
              activeTab === 'editor' ? 'bg-[#002a40] text-white font-bold' : 'text-slate-400 hover:text-white'
            }`}
          >
            Query Editor
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('schema')}
            className={`px-2.5 py-1 rounded transition-colors ${
              activeTab === 'schema' ? 'bg-[#002a40] text-white font-bold' : 'text-slate-400 hover:text-white'
            }`}
          >
            Schema Inspector
          </button>
        </div>

        <button
          type="button"
          disabled={isExecuting}
          onClick={handleRun}
          className="px-3.5 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-500 disabled:opacity-50 text-white font-bold flex items-center gap-1.5 shadow-sm transition-all"
          aria-label="Execute Query and Explain Plan"
        >
          <Play className="w-3.5 h-3.5 fill-current" />
          <span>{isExecuting ? 'Analyzing Query Plan…' : 'Execute & Explain Plan'}</span>
        </button>
      </div>

      {/* View 1: Query Editor */}
      {activeTab === 'editor' && (
        <div className="bg-[#00101b] border border-[#002f47] rounded-xl p-3 focus-within:border-sky-500 transition-colors">
          <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
            SQL DDL / Query Statement:
          </label>
          <textarea
            rows={8}
            value={currentQuery}
            onChange={handleQueryChange}
            spellCheck={false}
            placeholder="CREATE INDEX CONCURRENTLY idx_orders_status_created ON orders (status, created_at DESC);"
            className="w-full bg-transparent text-sky-300 font-mono text-xs leading-relaxed focus:outline-none resize-y"
          />
        </div>
      )}

      {/* View 2: Schema Inspector */}
      {activeTab === 'schema' && (
        <div className="p-4 bg-[#00101b] border border-[#002f47] rounded-xl space-y-3">
          <div className="flex items-center justify-between">
            <span className="font-bold text-white flex items-center gap-1.5">
              <Layers className="w-4 h-4 text-sky-400" />
              <span>Table: {schemaInfo.table} (~1,000,000 rows)</span>
            </span>
            <span className="text-[11px] text-slate-400 font-mono">Engine: PostgreSQL / Relational</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left font-mono text-[11px] border-collapse">
              <thead>
                <tr className="border-b border-[#002538] text-slate-400">
                  <th className="py-1.5 px-2">Column</th>
                  <th className="py-1.5 px-2">Type</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#002030] text-slate-300">
                {schemaInfo.columns.map((c: any, i: number) => (
                  <tr key={i} className="hover:bg-[#001824]">
                    <td className="py-1.5 px-2 font-bold text-white">{c.name}</td>
                    <td className="py-1.5 px-2 text-slate-400">{c.type}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="pt-2 border-t border-[#002030] text-[11px] text-slate-400">
            <span className="font-bold text-slate-300">Existing Indexes:</span> {schemaInfo.existing_indexes.join(', ')}
          </div>
        </div>
      )}

      {/* Execution Results Terminal */}
      {executionResult && (
        <div className="p-3.5 bg-[#001420] border border-sky-500/30 rounded-xl font-mono text-[11px] text-sky-300 space-y-2">
          <div className="flex items-center justify-between pb-2 border-b border-sky-500/20">
            <span className="font-bold uppercase tracking-wider flex items-center gap-1.5">
              <Terminal className="w-3.5 h-3.5" />
              <span>Query Execution Plan & Optimization Telemetry</span>
            </span>
            <span className="font-bold text-white">
              {executionResult.metrics?.is_composite_index ? '✓ Index Seek' : '⚠ High Cost Scan'}
            </span>
          </div>
          <pre className="whitespace-pre-wrap leading-relaxed">
            {executionResult.output}
          </pre>
        </div>
      )}
    </div>
  );
}
