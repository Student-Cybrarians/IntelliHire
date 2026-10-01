const fs = require('fs');
let content = fs.readFileSync('m1-async-worker/src/index.ts', 'utf8');

// Insert ATS heuristic before updating Job Status
const insertPoint = /\/\/ 4\. Update Job Status/;
const atsLogic = `
          // ATS Deterministic Signal
          const textLen = String(resume.raw_text || '').length;
          let atsScore = 100;
          if (textLen < 500) atsScore -= 50; 
          else if (textLen < 1500) atsScore -= 20; 
          
          const containsContact = /(phone|email|linkedin|@)/i.test(String(resume.raw_text || ''));
          if (!containsContact) atsScore -= 10;

          structuredData.ats_score = atsScore;

          // 4. Update Job Status
`;

content = content.replace(insertPoint, atsLogic);
fs.writeFileSync('m1-async-worker/src/index.ts', content);
