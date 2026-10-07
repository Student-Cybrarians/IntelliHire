import { useState } from 'react';
import { Search, Play, BookOpen, CheckCircle2, Bookmark } from 'lucide-react';
import { WorkSurfaceAdapterProps } from '../WorkSurfaceTypes';

export default function ResearchAnalysisWorkSurfaceAdapter({
  task,
  candidateWork,
  onChange,
  onAction,
  onExecute,
  isExecuting,
  executionResult
}: WorkSurfaceAdapterProps) {
  const sources = task?.scenario?.starting_data?.research_sources || [
    { id: 'SRC-1', title: 'Internal Telemetry Logs (Oct 2026)', excerpt: 'Average p99 latency spiked 340% during peak flash sale concurrent checkout bursts.' },
    { id: 'SRC-2', title: 'Payment Gateway SLA Contract', excerpt: 'Gateway contract specifies minimum 99.95% uptime and maximum 800ms API timeout.' }
  ];

  const [hypothesis, setHypothesis] = useState(candidateWork.hypothesis || '');
  const [synthesis, setSynthesis] = useState(candidateWork.synthesis || candidateWork.output_text || '');

  const handleHypothesisChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setHypothesis(val);
    const updated = { ...candidateWork, hypothesis: val, synthesis };
    onChange(updated);
    onAction('hypothesis_edit', { hypothesis: val }, updated);
  };

  const handleSynthesisChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setSynthesis(val);
    const updated = { ...candidateWork, hypothesis, synthesis: val, output_text: val };
    onChange(updated);
    onAction('research_synthesis_edit', { length: val.length }, updated);
  };

  const handleExecute = () => {
    onExecute('validate_document', { candidate_work: { ...candidateWork, output_text: `${hypothesis}\n\n${synthesis}` } });
  };

  return (
    <div className="space-y-4 text-xs font-sans" role="region" aria-label="Research and Investigation Work Surface">
      {/* Evidence Source Clips */}
      <div className="p-3.5 bg-[#001420] border border-[#002f47] rounded-xl space-y-2">
        <span className="font-bold text-white flex items-center gap-1.5">
          <BookOpen className="w-4 h-4 text-teal-400" />
          <span>Provided Primary Evidence & Source Clips:</span>
        </span>
        <div className="space-y-1.5">
          {sources.map((src: any, i: number) => (
            <div key={i} className="p-2.5 bg-[#00101b] rounded-lg border border-[#002538] text-[11px]">
              <span className="font-bold text-teal-300 font-mono mr-2">{src.id}: {src.title}</span>
              <p className="text-slate-300 mt-1 italic">"{src.excerpt}"</p>
            </div>
          ))}
        </div>
      </div>

      {/* Hypothesis Input */}
      <div className="p-3 bg-[#00101b] border border-[#002f47] rounded-xl space-y-1.5">
        <label className="font-bold text-slate-300 block">Investigative Hypothesis / Core Thesis:</label>
        <input
          type="text"
          value={hypothesis}
          onChange={handleHypothesisChange}
          placeholder="State your primary hypothesis grounded in observed evidence..."
          className="w-full p-2 bg-[#001420] border border-[#002538] rounded-lg text-white text-xs focus:outline-none focus:border-teal-500"
        />
      </div>

      {/* Execution Results */}
      {executionResult && (
        <div className="p-3 bg-[#001420] border border-teal-500/30 rounded-xl font-mono text-[11px] text-teal-300">
          <pre className="whitespace-pre-wrap">{executionResult.output}</pre>
        </div>
      )}

      {/* Synthesis Editor */}
      <div className="p-3.5 bg-[#00101b] border border-[#002f47] rounded-xl space-y-2">
        <div className="flex items-center justify-between">
          <label className="font-bold text-slate-300 block">Synthesis, Citations & Empirical Conclusion:</label>
          <button
            type="button"
            disabled={isExecuting}
            onClick={handleExecute}
            className="px-3 py-1.5 rounded-lg bg-teal-600 hover:bg-teal-500 disabled:opacity-50 text-white font-bold flex items-center gap-1.5 transition-all shadow-sm"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>{isExecuting ? 'Synthesizing…' : 'Synthesize Findings'}</span>
          </button>
        </div>
        <textarea
          rows={6}
          value={synthesis}
          onChange={handleSynthesisChange}
          placeholder="Synthesize evidence across sources, defend against counter-hypotheses, and present definitive findings..."
          className="w-full p-3 bg-[#001420] border border-[#002538] rounded-lg text-white text-xs leading-relaxed focus:outline-none focus:border-teal-500"
        />
      </div>
    </div>
  );
}
