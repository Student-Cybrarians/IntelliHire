import { useState } from 'react';
import { ShieldCheck, Play, AlertTriangle, FileText, CheckCircle2 } from 'lucide-react';
import { WorkSurfaceAdapterProps } from '../WorkSurfaceTypes';

export default function LegalProfessionalMemoWorkSurfaceAdapter({
  task,
  candidateWork,
  onChange,
  onAction,
  onExecute,
  isExecuting,
  executionResult
}: WorkSurfaceAdapterProps) {
  const msaClause = task?.scenario?.starting_data?.msa_extract || 
    'SECTION 11.2 LIMITATION OF LIABILITY: IN NO EVENT SHALL SUPPLIER TOTAL AGGREGATE LIABILITY EXCEED $50,000 OR THE FEES PAID IN THE PRIOR 1 MONTH, REGARDLESS OF GROSS NEGLIGENCE, WILLFUL MISCONDUCT, OR DATA BREACH CLAIMS.';

  const [redlineText, setRedlineText] = useState(candidateWork.redline_text || candidateWork.output_text || '');
  const [riskRating, setRiskRating] = useState(candidateWork.risk_rating || 'high');

  const handleRedlineChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setRedlineText(val);
    const updated = { ...candidateWork, redline_text: val, output_text: val, risk_rating: riskRating };
    onChange(updated);
    onAction('legal_redline_edit', { length: val.length }, updated);
  };

  const handleRiskChange = (rating: string) => {
    setRiskRating(rating);
    const updated = { ...candidateWork, risk_rating: rating };
    onChange(updated);
    onAction('legal_risk_rated', { risk_rating: rating }, updated);
  };

  const handleAudit = () => {
    onExecute('validate_document', { candidate_work: { ...candidateWork, output_text: redlineText, memo: redlineText } });
  };

  return (
    <div className="space-y-4 text-xs font-sans" role="region" aria-label="Legal and Contract Analysis Work Surface">
      {/* Clause Inspector */}
      <div className="p-3.5 bg-[#001420] border border-[#002f47] rounded-xl space-y-2">
        <span className="font-bold text-white flex items-center gap-1.5">
          <ShieldCheck className="w-4 h-4 text-orange-400" />
          <span>Contested Contractual Clause Under Negotiation:</span>
        </span>
        <div className="p-3 bg-[#000d16] rounded-lg font-mono text-[11px] text-slate-300 border border-[#002235] leading-relaxed">
          {msaClause}
        </div>
      </div>

      {/* Risk Rating Selector */}
      <div className="p-3 bg-[#00101b] border border-[#002f47] rounded-xl flex items-center justify-between">
        <span className="font-bold text-slate-300">Commercial Risk Exposure Assessment:</span>
        <div className="flex gap-1.5">
          {['low', 'moderate', 'high', 'critical'].map(lvl => (
            <button
              key={lvl}
              type="button"
              onClick={() => handleRiskChange(lvl)}
              className={`px-2.5 py-1 rounded text-[11px] uppercase font-bold transition-all ${
                riskRating === lvl
                  ? 'bg-orange-500 text-black shadow-sm font-black'
                  : 'bg-[#001824] text-slate-400 hover:text-white border border-[#002a40]'
              }`}
            >
              {lvl}
            </button>
          ))}
        </div>
      </div>

      {/* Execution Results */}
      {executionResult && (
        <div className="p-3 bg-[#001420] border border-orange-500/30 rounded-xl font-mono text-[11px] text-orange-300">
          <pre className="whitespace-pre-wrap">{executionResult.output}</pre>
        </div>
      )}

      {/* Redline Editor */}
      <div className="p-3.5 bg-[#00101b] border border-[#002f47] rounded-xl space-y-2">
        <div className="flex items-center justify-between">
          <label className="font-bold text-slate-300 block">Proposed Counter-Language Redline & Legal Defense:</label>
          <button
            type="button"
            disabled={isExecuting}
            onClick={handleAudit}
            className="px-3 py-1.5 rounded-lg bg-orange-600 hover:bg-orange-500 disabled:opacity-50 text-white font-bold flex items-center gap-1.5 transition-all shadow-sm"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>{isExecuting ? 'Validating…' : 'Validate Legal Exposure'}</span>
          </button>
        </div>
        <textarea
          rows={6}
          value={redlineText}
          onChange={handleRedlineChange}
          placeholder="Redline the liability cap to minimum 12 months fees or $2,000,000 and explicitly exclude data breach / gross negligence from the cap..."
          className="w-full p-3 bg-[#001420] border border-[#002538] rounded-lg text-white text-xs leading-relaxed focus:outline-none focus:border-orange-500"
        />
      </div>
    </div>
  );
}
