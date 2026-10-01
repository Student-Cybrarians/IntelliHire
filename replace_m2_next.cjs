const fs = require('fs');
let content = fs.readFileSync('functions/api/[[route]].ts', 'utf8');

// Replace next logic
content = content.replace(
  /\/\/ Find a question the user hasn't answered in this session[\s\S]*?ORDER BY RANDOM\(\) LIMIT 1\n    `\)\.bind\(skill_id, sessionId\)\.first\(\);/,
  `// Adaptive Selection based on proficiency
  const existingProf = await c.env.DB.prepare('SELECT score FROM candidate_proficiency WHERE user_id = ? AND skill_id = ?')
    .bind(user.id, skill_id).first();
  const currentScore = existingProf ? (existingProf.score as number) : 50;
  
  // Map score (0-100) to target difficulty (1-5)
  let targetDifficulty = 3;
  if (currentScore > 80) targetDifficulty = 5;
  else if (currentScore > 60) targetDifficulty = 4;
  else if (currentScore > 40) targetDifficulty = 3;
  else if (currentScore > 20) targetDifficulty = 2;
  else targetDifficulty = 1;

  // Find a question the user hasn't answered in this session closest to target difficulty
  const item = await c.env.DB.prepare(\`
    SELECT * FROM assessment_item 
    WHERE skill_id = ? 
    AND id NOT IN (SELECT assessment_item_id FROM candidate_response WHERE session_id = ?)
    ORDER BY ABS(difficulty_level - ?) ASC, RANDOM() LIMIT 1
  \`).bind(skill_id, sessionId, targetDifficulty).first();`
);

fs.writeFileSync('functions/api/[[route]].ts', content);
