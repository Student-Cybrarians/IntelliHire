const fs = require('fs');
let content = fs.readFileSync('src/client/pages/Resume.tsx', 'utf8');

// Replace handleMatch
const oldHandleMatch = /const handleMatch = async \(\) => \{[\s\S]*?setMatchRunning\(false\);\n    \}\n  \};/;
const newHandleMatch = `const handleMatch = async () => {
    if (!resumeId || !jdId) return;
    setMatchRunning(true);
    setError(null);

    try {
      const res = await fetch('/api/match/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resume_id: resumeId, jd_id: jdId })
      });
      const data = await res.json() as any;
      if (!res.ok) throw new Error(data.error || 'Match analysis failed to start');

      const jobId = data.job_id;
      
      // Poll for completion
      const poll = async () => {
        const statusRes = await fetch(\`/api/match/status/\${jobId}\`);
        const statusData = await statusRes.json() as any;
        
        if (statusData.status === 'READY') {
          // Fetch the actual match data. 
          // The result JSON from the job should have the match report.
          setMatchData(statusData.result);
          setMatchRunning(false);
        } else if (statusData.status === 'FAILED') {
          setError(statusData.error || 'Match processing failed');
          setMatchRunning(false);
        } else {
          // PENDING or PROCESSING
          setTimeout(poll, 2000);
        }
      };

      poll();

    } catch (err: any) {
      setError(err.message);
      setMatchRunning(false);
    }
  };`;
content = content.replace(oldHandleMatch, newHandleMatch);

// We also need to update the UI where ATS score is displayed, 
// because we removed ats_score from the AI output.
const oldAtsScoreUI = /\{\/\* ATS Score \*\/\}\s*<div className="flex items-center gap-4 p-4 bg-slate-950 border border-slate-800 rounded-lg">\s*<div className="text-4xl font-bold text-white">\{matchData\.ats_score\}<span className="text-lg text-slate-500">\/100<\/span><\/div>\s*<div>\s*<h3 className="font-semibold text-white">Parseability & Alignment<\/h3>\s*<p className="text-sm text-slate-400">Structural and semantic document compatibility\.<\/p>\s*<\/div>\s*<\/div>/;

const newAtsScoreUI = `{/* ATS Score */}\n<div className="flex items-center gap-4 p-4 bg-slate-950 border border-slate-800 rounded-lg">\n  <div className="text-4xl font-bold text-white">{matchData.ats_score || 'N/A'}<span className="text-lg text-slate-500">/100</span></div>\n  <div>\n    <h3 className="font-semibold text-white">Parseability & Alignment</h3>\n    <p className="text-sm text-slate-400">Structural and semantic document compatibility.</p>\n  </div>\n</div>`;

content = content.replace(oldAtsScoreUI, newAtsScoreUI);

fs.writeFileSync('src/client/pages/Resume.tsx', content);
