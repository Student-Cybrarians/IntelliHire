const fs = require('fs');
let content = fs.readFileSync('functions/api/[[route]].ts', 'utf8');

// Update async job result insertion to include deterministic ATS score
content = content.replace(
  /await c\.env\.DB\.prepare\("UPDATE async_job SET status = 'READY', progress_percentage = 100, result_data_json = \? WHERE id = \?"\)\s*\.bind\(JSON\.stringify\(structuredData\), jobId\)\.run\(\);/,
  `
      // Deterministic ATS Signal
      const textLen = String(resume.raw_text).length;
      let atsScore = 100;
      if (textLen < 500) atsScore -= 50; // likely OCR failure or empty
      else if (textLen < 1500) atsScore -= 20; // very sparse
      
      const containsContact = /(phone|email|linkedin|@)/i.test(String(resume.raw_text));
      if (!containsContact) atsScore -= 10;

      structuredData.ats_score = atsScore;

      await c.env.DB.prepare("UPDATE async_job SET status = 'READY', progress_percentage = 100, result_data_json = ? WHERE id = ?")
        .bind(JSON.stringify(structuredData), jobId).run();`
);

fs.writeFileSync('functions/api/[[route]].ts', content);
