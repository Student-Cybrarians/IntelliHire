const fs = require('fs');
let content = fs.readFileSync('src/client/pages/Resume.tsx', 'utf8');

// Add Needs Human Review banner to UI
content = content.replace(
  /<p className="text-sm text-slate-500 mt-2 bg-slate-900 p-2 rounded">\{gap\.explanation\}<\/p>/g,
  `<p className="text-sm text-slate-500 mt-2 bg-slate-900 p-2 rounded">{gap.explanation}</p>
                              {gap.status === 'CONTRADICTORY' && (
                                <div className="mt-2 text-xs font-semibold text-orange-400 bg-orange-950/50 inline-block px-2 py-1 rounded">
                                  NEEDS HUMAN REVIEW - PLEASE VERIFY
                                </div>
                              )}`
);

fs.writeFileSync('src/client/pages/Resume.tsx', content);
