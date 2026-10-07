import { useState } from 'react';
import { Play, RotateCcw, CheckCircle2, XCircle, Terminal, FileCode, Clock } from 'lucide-react';
import { WorkSurfaceAdapterProps } from '../WorkSurfaceTypes';

export default function CodeWorkSurfaceAdapter({
  task,
  candidateWork,
  onChange,
  onAction,
  onExecute,
  isExecuting,
  executionResult
}: WorkSurfaceAdapterProps) {
  const currentCode = candidateWork.code || candidateWork.template_code || '';
  const starterTemplate = task?.scenario?.starting_data?.template_code || '// Write your implementation here\n';
  const [activeTab, setActiveTab] = useState<'editor' | 'tests'>('editor');

  const handleCodeChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    const updated = { ...candidateWork, code: val };
    onChange(updated);
    onAction('code_edit', { length: val.length, lines: val.split('\n').length }, updated);
  };

  const resetToTemplate = () => {
    if (window.confirm('Reset code to starter template? Your current edits will be replaced.')) {
      const updated = { ...candidateWork, code: starterTemplate };
      onChange(updated);
      onAction('reset_template', {}, updated);
    }
  };

  const handleRun = () => {
    onExecute('run_code', { code: currentCode, candidate_work: candidateWork });
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      handleRun();
    }
  };

  const lineCount = Math.max(currentCode.split('\n').length, 12);

  return (
    <div className="space-y-4 text-xs font-sans" role="region" aria-label="Code Editor Work Surface">
      {/* Top Toolbar */}
      <div className="flex items-center justify-between p-2.5 bg-[#001420] border border-[#002f47] rounded-xl">
        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#002235] text-emerald-400 font-mono text-[11px] font-bold">
            <FileCode className="w-3.5 h-3.5" />
            <span>solution.ts</span>
          </span>
          <button
            type="button"
            onClick={() => setActiveTab('editor')}
            className={`px-2.5 py-1 rounded transition-colors ${
              activeTab === 'editor' ? 'bg-[#002a40] text-white font-bold' : 'text-slate-400 hover:text-white'
            }`}
          >
            Code Editor
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('tests')}
            className={`px-2.5 py-1 rounded transition-colors ${
              activeTab === 'tests' ? 'bg-[#002a40] text-white font-bold' : 'text-slate-400 hover:text-white'
            }`}
          >
            Test Harness ({executionResult?.test_results?.length || 3})
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={resetToTemplate}
            title="Reset to starter template"
            className="p-1.5 rounded hover:bg-[#002538] text-slate-400 hover:text-slate-200 transition-colors"
            aria-label="Reset code to starter template"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            disabled={isExecuting}
            onClick={handleRun}
            className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold flex items-center gap-1.5 shadow-sm transition-all"
            aria-label="Run Test Cases (Ctrl+Enter)"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>{isExecuting ? 'Running Sandbox…' : 'Run Test Cases'}</span>
          </button>
        </div>
      </div>

      {/* Editor & Line Numbers */}
      {activeTab === 'editor' && (
        <div className="relative bg-[#00101b] border border-[#002f47] rounded-xl overflow-hidden focus-within:border-[#FF4103] transition-colors">
          <div className="flex">
            {/* Gutter / Line Numbers */}
            <div className="py-3 px-2 bg-[#000d16] select-none text-right font-mono text-[11px] text-slate-600 border-r border-[#002030] min-w-[3rem]">
              {Array.from({ length: lineCount }).map((_, i) => (
                <div key={i} className="leading-relaxed">{i + 1}</div>
              ))}
            </div>
            {/* Code Input */}
            <textarea
              rows={lineCount}
              value={currentCode}
              onChange={handleCodeChange}
              onKeyDown={handleKeyDown}
              spellCheck={false}
              aria-label="Code editor input area"
              placeholder="// Write your implementation here..."
              className="w-full p-3 bg-transparent text-emerald-300 font-mono text-xs leading-relaxed focus:outline-none resize-y min-h-[280px]"
            />
          </div>
        </div>
      )}

      {/* Test Harness View */}
      {activeTab === 'tests' && (
        <div className="p-4 bg-[#00101b] border border-[#002f47] rounded-xl space-y-3">
          <span className="font-bold text-slate-300 block">Configured Automated Verification Suite:</span>
          <div className="space-y-2">
            {(executionResult?.test_results || [
              { name: 'Test 1: Baseline Under Limit (50 reqs / 60s)', passed: true, message: 'Validates normal flow within capacity' },
              { name: 'Test 2: Concurrency Burst (120 reqs / 60s)', passed: false, message: 'Enforces rate limit boundary at threshold' },
              { name: 'Test 3: Token Refill Cadence & Memory Boundary', passed: false, message: 'Calculates replenish rate and memory quota' }
            ]).map((t, idx) => (
              <div key={idx} className="p-2.5 bg-[#001824] rounded-lg border border-[#002538] flex items-center justify-between">
                <span className="font-mono text-slate-300">{t.name}</span>
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase flex items-center gap-1 ${
                  t.passed ? 'bg-emerald-500/15 text-emerald-400' : 'bg-slate-700/30 text-slate-400'
                }`}>
                  {t.passed ? <CheckCircle2 className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                  <span>{t.passed ? 'Passed' : 'Pending Run'}</span>
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Execution Results Terminal */}
      {executionResult && (
        <div
          className={`p-3.5 rounded-xl border font-mono text-[11px] space-y-2 transition-all ${
            executionResult.status === 'passed'
              ? 'bg-[#001420] border-emerald-500/30 text-emerald-300'
              : 'bg-[#1a0808] border-red-500/30 text-red-300'
          }`}
          role="status"
          aria-live="polite"
        >
          <div className="flex items-center justify-between pb-2 border-b border-current/20">
            <span className="font-bold uppercase tracking-wider flex items-center gap-1.5">
              <Terminal className="w-3.5 h-3.5" />
              <span>Sandbox Test Results ({executionResult.duration_ms}ms)</span>
            </span>
            <span className="font-bold">
              {executionResult.status === 'passed' ? '✓ All Tests Passed' : '✗ Tests Incomplete'}
            </span>
          </div>
          <pre className="whitespace-pre-wrap leading-relaxed text-[11px] overflow-x-auto">
            {executionResult.output}
          </pre>
        </div>
      )}
    </div>
  );
}
