const fs = require('fs');
let content = fs.readFileSync('functions/api/[[route]].ts', 'utf8');

// Update async job result insertion
content = content.replace(
  /await c\.env\.DB\.prepare\("UPDATE async_job SET status = 'READY', progress_percentage = 100, result_data_json = \? WHERE id = \?"\)\s*\.bind\(JSON\.stringify\(\{ match_id: matchId \}\), jobId\)\.run\(\);/,
  `await c.env.DB.prepare("UPDATE async_job SET status = 'READY', progress_percentage = 100, result_data_json = ? WHERE id = ?")
        .bind(JSON.stringify(structuredData), jobId).run();`
);

fs.writeFileSync('functions/api/[[route]].ts', content);
