import fs from 'fs';

const filePath = 'src/client/pages/AssessmentV2.tsx';
let code = fs.readFileSync(filePath, 'utf-8');

const replacementStr = `
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="bg-emerald-950/10 p-4 rounded-lg border border-emerald-500/10">
                        <h4 className="text-sm font-semibold text-emerald-400 uppercase tracking-wider mb-2">The Correct Approach</h4>
                        <p className="text-emerald-100/70 text-sm leading-relaxed mb-3">{lastEvaluation.teaching_payload.explanation_of_correct_answer}</p>
                        <h5 className="text-xs font-semibold text-slate-400 mt-4 mb-1">How to arrive at it:</h5>
                        <p className="text-slate-400 text-sm">{lastEvaluation.teaching_payload.how_to_arrive}</p>
                      </div>

                      <div className="space-y-4">
                        <div className="bg-slate-800/30 p-4 rounded-lg border border-slate-700/30">
                          <h4 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-2">Why Alternatives Fail</h4>
                          <p className="text-slate-400 text-sm leading-relaxed">{lastEvaluation.teaching_payload.analysis_of_alternatives}</p>
                        </div>
                        {(lastEvaluation.teaching_payload.follow_up_question && lastEvaluation.teaching_payload.follow_up_question !== "N/A") && (
                          <div className="bg-indigo-950/20 p-4 rounded-lg border border-indigo-500/20">
                            <h4 className="text-sm font-semibold text-indigo-400 uppercase tracking-wider mb-2">Follow-up / Adapt</h4>
                            <p className="text-indigo-200 text-sm leading-relaxed font-medium mb-2">{lastEvaluation.teaching_payload.follow_up_question}</p>
                            {lastEvaluation.teaching_payload.adaptation_recommendation && (
                              <span className="inline-block px-2 py-1 bg-indigo-900/50 text-indigo-300 text-xs rounded border border-indigo-800/50">
                                Adaptation: {lastEvaluation.teaching_payload.adaptation_recommendation.replace('_', ' ')}
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
`;

// Locate the grid block to replace
const startMarker = '<div className="grid md:grid-cols-2 gap-4">';
const endMarker = '</div>\n                  </div>\n                ) : (';

const idx1 = code.indexOf(startMarker);
const idx2 = code.indexOf(endMarker);

if (idx1 !== -1 && idx2 !== -1) {
  const toReplace = code.substring(idx1, idx2);
  code = code.replace(toReplace, replacementStr.trim() + "\n                  ");
  fs.writeFileSync(filePath, code, 'utf-8');
  console.log("Follow-up UI injected!");
} else {
  console.log("Could not find grid block.");
}
