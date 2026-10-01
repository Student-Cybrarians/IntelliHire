const fs = require('fs');
let content = fs.readFileSync('functions/api/[[route]].ts', 'utf8');

// Replace Assessment Generation Prompt
content = content.replace(
  /const prompt = `You are an expert technical assessor\.[\s\S]*?"traceability_reason": "Why this question tests this specific skill"\n}`;/,
  `const prompt = \`You are an expert assessor.
  Generate a multiple-choice diagnostic question to assess a candidate's proficiency in a domain-neutral manner.
  Competency: \${skillQuery.comp_name}
  Skill: \${skillQuery.skill_name}
  Description: \${skillQuery.skill_desc || 'N/A'}
  
  Return ONLY a valid JSON object matching this schema:
  {
    "question_text": "The question itself",
    "options": ["A", "B", "C", "D"],
    "correct_answer": "The exact string from options that is correct",
    "difficulty_level": 3,
    "traceability_reason": "Why this question tests this specific skill"
  }\`;`
);

fs.writeFileSync('functions/api/[[route]].ts', content);
