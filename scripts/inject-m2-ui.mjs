import fs from 'fs';

const filePath = 'src/client/pages/AssessmentV2.tsx';
let code = fs.readFileSync(filePath, 'utf-8');

const oldEvalUIStr = `{/* Evaluation feedback */}
            {lastEvaluation && (
              <div className={\`mt-6 p-4 rounded-xl border \${
                lastEvaluation.score_raw >= 0.7 
                  ? 'bg-emerald-500/10 border-emerald-500/20' 
                  : lastEvaluation.score_raw >= 0.4 
                    ? 'bg-yellow-500/10 border-yellow-500/20'
                    : 'bg-red-500/10 border-red-500/20'
              }\`}>
                <div className="flex items-start gap-3">
                  {lastEvaluation.score_raw >= 0.7 ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                  ) : (
                    <XCircle className="w-5 h-5 text-red-400 shrink-0" />
                  )}
                  <div>
                    <p className="font-medium text-white">
                      Score: {(lastEvaluation.score_raw * 100).toFixed(0)}%
                    </p>
                    {lastEvaluation.feedback && (
                      <p className="text-sm text-slate-400 mt-1">{lastEvaluation.feedback}</p>
                    )}
                    <p className="text-xs text-slate-500 mt-2">
                      Evaluator: {lastEvaluation.evaluator_type} • Confidence: {((lastEvaluation.confidence_score || 0) * 100).toFixed(0)}%
                    </p>
                  </div>
                </div>
              </div>
            )}`;

const newEvalUIStr = `{/* M02 Adaptive Teaching Engine UI */}
            {lastEvaluation && (
              <div className={\`mt-6 overflow-hidden rounded-xl border \${
                lastEvaluation.score_raw >= 0.7 
                  ? 'bg-emerald-950/20 border-emerald-500/30' 
                  : lastEvaluation.score_raw >= 0.4 
                    ? 'bg-yellow-950/20 border-yellow-500/30'
                    : 'bg-red-950/20 border-red-500/30'
              }\`}>
                <div className={\`p-4 border-b \${lastEvaluation.score_raw >= 0.7 ? 'border-emerald-500/20 bg-emerald-500/10' : lastEvaluation.score_raw >= 0.4 ? 'border-yellow-500/20 bg-yellow-500/10' : 'border-red-500/20 bg-red-500/10'}\`}>
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-3">
                      {lastEvaluation.score_raw >= 0.7 ? (
                        <CheckCircle2 className="w-6 h-6 text-emerald-400" />
                      ) : (
                        <XCircle className="w-6 h-6 text-red-400" />
                      )}
                      <div>
                        <h3 className="font-bold text-white text-lg">
                          Score: {(lastEvaluation.score_raw * 100).toFixed(0)}%
                        </h3>
                        <p className="text-xs text-slate-400">Evaluator: {lastEvaluation.evaluator_type} (Confidence: {((lastEvaluation.confidence_score || 0) * 100).toFixed(0)}%)</p>
                      </div>
                    </div>
                  </div>
                </div>
                
                {lastEvaluation.teaching_payload ? (
                  <div className="p-5 space-y-5">
                    <div className="bg-slate-900/50 p-4 rounded-lg border border-slate-700/50">
                      <h4 className="text-sm font-semibold text-blue-400 uppercase tracking-wider mb-2">Analysis of Your Answer</h4>
                      <p className="text-slate-300 text-sm leading-relaxed">{lastEvaluation.teaching_payload.analysis_of_candidate_answer}</p>
                    </div>

                    {(lastEvaluation.teaching_payload.misconception_remediation && lastEvaluation.teaching_payload.misconception_remediation !== "N/A") && (
                      <div className="bg-orange-950/20 p-4 rounded-lg border border-orange-500/20">
                        <h4 className="text-sm font-semibold text-orange-400 uppercase tracking-wider mb-2">Misconception Remediation</h4>
                        <p className="text-orange-200 text-sm leading-relaxed">{lastEvaluation.teaching_payload.misconception_remediation}</p>
                      </div>
                    )}

                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="bg-emerald-950/10 p-4 rounded-lg border border-emerald-500/10">
                        <h4 className="text-sm font-semibold text-emerald-400 uppercase tracking-wider mb-2">The Correct Approach</h4>
                        <p className="text-emerald-100/70 text-sm leading-relaxed mb-3">{lastEvaluation.teaching_payload.explanation_of_correct_answer}</p>
                        <h5 className="text-xs font-semibold text-slate-400 mt-4 mb-1">How to arrive at it:</h5>
                        <p className="text-slate-400 text-sm">{lastEvaluation.teaching_payload.how_to_arrive}</p>
                      </div>

                      <div className="bg-slate-800/30 p-4 rounded-lg border border-slate-700/30">
                        <h4 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-2">Why Alternatives Fail</h4>
                        <p className="text-slate-400 text-sm leading-relaxed">{lastEvaluation.teaching_payload.analysis_of_alternatives}</p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="p-4">
                    {lastEvaluation.feedback && <p className="text-sm text-slate-300">{lastEvaluation.feedback}</p>}
                  </div>
                )}
              </div>
            )}`;

// Use a simple replace on a known substring to avoid whitespace/regex mismatches
const startIndex = code.indexOf("{/* Evaluation feedback */}");
const searchSub = "          {/* Action buttons */}";
const endIndex = code.indexOf(searchSub);

if (startIndex !== -1 && endIndex !== -1) {
  const toReplace = code.substring(startIndex, endIndex);
  code = code.replace(toReplace, newEvalUIStr + "\n\n          ");
  fs.writeFileSync(filePath, code, 'utf-8');
  console.log("Teaching UI injected!");
} else {
  console.log("Could not find evaluation UI block.");
}
