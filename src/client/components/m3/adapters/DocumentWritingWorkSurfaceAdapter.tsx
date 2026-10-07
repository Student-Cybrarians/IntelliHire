import { useState } from 'react';
import { FileText, CheckCircle2, AlertCircle, BookOpen, Layers } from 'lucide-react';
import { WorkSurfaceAdapterProps } from '../WorkSurfaceTypes';

export default function DocumentWritingWorkSurfaceAdapter({
  task,
  candidateWork,
  onChange,
  onAction,
  onExecute,
  isExecuting,
  executionResult
}: WorkSurfaceAdapterProps) {
  const [sections, setSections] = useState({
    executiveSummary: candidateWork.executive_summary || '',
    analysis: candidateWork.analysis || candidateWork.output_text || '',
    recommendations: candidateWork.recommendations || ''
  });

  const totalWords = Object.values(sections).join(' ').trim().split(/\s+/).filter(Boolean).length;

  const handleSectionChange = (field: string, val: string) => {
    const updatedSections = { ...sections, [field]: val };
    setSections(updatedSections);
    const updatedWork = { ...candidateWork, ...updatedSections, output_text: Object.values(updatedSections).join('\n\n') };
    onChange(updatedWork);
    onAction('document_section_edit', { field, words: val.split(/\s+/).filter(Boolean).length }, updatedWork);
  };

  const handleAudit = () => {
    onExecute('validate_document', { candidate_work: { ...candidateWork, output_text: Object.values(sections).join('\n\n') } });
  };

  return (
    <div className="space-y-4 text-xs font-sans" role="region" aria-label="Professional Writing and Document Work Surface">
      {/* Word Count Header */}
      <div className="flex items-center justify-between p-3 bg-[#001420] border border-[#002f47] rounded-xl">
        <div className="flex items-center gap-2">
          <FileText className="w-4 h-4 text-amber-400" />
          <span className="font-bold text-white">Professional Deliverable & Technical Memo</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="font-mono text-slate-300">
            Total Words: <strong className="text-white">{totalWords}</strong>
          </span>
          <button
            type="button"
            disabled={isExecuting}
            onClick={handleAudit}
            className="px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-white font-bold flex items-center gap-1.5 transition-all shadow-sm"
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>{isExecuting ? 'Auditing…' : 'Audit Document Completeness'}</span>
          </button>
        </div>
      </div>

      {/* Execution Results */}
      {executionResult && (
        <div className="p-3 bg-[#001420] border border-amber-500/30 rounded-xl font-mono text-[11px] text-amber-300">
          <pre className="whitespace-pre-wrap">{executionResult.output}</pre>
        </div>
      )}

      {/* Structured Sections */}
      <div className="space-y-3">
        <div className="p-3 bg-[#00101b] border border-[#002f47] rounded-xl space-y-1.5">
          <label className="font-bold text-slate-300 block">1. Executive Summary & Problem Scope</label>
          <textarea
            rows={3}
            value={sections.executiveSummary}
            onChange={e => handleSectionChange('executiveSummary', e.target.value)}
            placeholder="Articulate the core problem, stakeholders involved, and key high-level takeaway..."
            className="w-full p-2.5 bg-[#001420] border border-[#002538] rounded-lg text-white text-xs leading-relaxed focus:outline-none focus:border-amber-500"
          />
        </div>

        <div className="p-3 bg-[#00101b] border border-[#002f47] rounded-xl space-y-1.5">
          <label className="font-bold text-slate-300 block">2. Analysis, Trade-Offs & Evidence</label>
          <textarea
            rows={5}
            value={sections.analysis}
            onChange={e => handleSectionChange('analysis', e.target.value)}
            placeholder="Present deep analytical reasoning, evaluate alternatives, and quantify operational/business risks..."
            className="w-full p-2.5 bg-[#001420] border border-[#002538] rounded-lg text-white text-xs leading-relaxed focus:outline-none focus:border-amber-500"
          />
        </div>

        <div className="p-3 bg-[#00101b] border border-[#002f47] rounded-xl space-y-1.5">
          <label className="font-bold text-slate-300 block">3. Actionable Recommendations & Implementation Roadmap</label>
          <textarea
            rows={3}
            value={sections.recommendations}
            onChange={e => handleSectionChange('recommendations', e.target.value)}
            placeholder="Specific next steps, owner assignments, milestone schedule, and success metrics..."
            className="w-full p-2.5 bg-[#001420] border border-[#002538] rounded-lg text-white text-xs leading-relaxed focus:outline-none focus:border-amber-500"
          />
        </div>
      </div>
    </div>
  );
}
