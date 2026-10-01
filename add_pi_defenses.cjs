const fs = require('fs');
let content = fs.readFileSync('functions/api/[[route]].ts', 'utf8');

// Use clear delimiters for prompt injection defense in both JD and Match
content = content.replace(
  /\{ role: 'user', content: rawText\.slice\(0, 50000\) \}/,
  `{ role: 'user', content: \`--- JOB DESCRIPTION START ---\\n\${rawText.slice(0, 50000)}\\n--- JOB DESCRIPTION END ---\` }`
);

content = content.replace(
  /const userPrompt = \`JD Requirements:\\n\$\{jd\.requirements_json\}\\n\\nCandidate Resume:\\n\$\{resume\.context_data_json\}\\n\\nRaw Resume Text Fallback:\\n\$\{String\(resume\.raw_text\)\.slice\(0, 10000\)\}\`;/,
  `const userPrompt = \`--- JD REQUIREMENTS START ---\\n\${jd.requirements_json}\\n--- JD REQUIREMENTS END ---\\n\\n--- CANDIDATE RESUME START ---\\n\${resume.context_data_json}\\n--- CANDIDATE RESUME END ---\\n\\n--- RAW RESUME TEXT FALLBACK START ---\\n\${String(resume.raw_text).slice(0, 10000)}\\n--- RAW RESUME TEXT FALLBACK END ---\`;`
);

fs.writeFileSync('functions/api/[[route]].ts', content);
