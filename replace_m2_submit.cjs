const fs = require('fs');
let content = fs.readFileSync('functions/api/[[route]].ts', 'utf8');

// Replace submit logic
content = content.replace(
  /const item = await c\.env\.DB\.prepare\('SELECT correct_answer FROM assessment_item WHERE id = \?'\)\.bind\(item_id\)\.first\(\);[\s\S]*?const existingProf = await c\.env\.DB\.prepare\('SELECT score, confidence FROM candidate_proficiency WHERE user_id = \? AND skill_id = \?'\)\s*\.bind\(user\.id, skill_id\)\.first\(\);\s*let newScore = existingProf \? \(existingProf\.score as number\) : 50;\s*let newConfidence = existingProf \? \(existingProf\.confidence as number\) : 0\.0;\s*if \(isCorrect\) \{\s*newScore = Math\.min\(100, newScore \+ 10\);\s*\} else \{\s*newScore = Math\.max\(0, newScore - 10\);\s*\}/,
  `const item = await c.env.DB.prepare('SELECT correct_answer, difficulty_level FROM assessment_item WHERE id = ?').bind(item_id).first();
  if (!item) return c.json({ error: 'Item not found' }, 404);

  const isCorrect = (item.correct_answer === response_text);
  const responseId = crypto.randomUUID();

  await c.env.DB.prepare(
    'INSERT INTO candidate_response (id, session_id, assessment_item_id, response_text, is_correct) VALUES (?, ?, ?, ?, ?)'
  ).bind(responseId, sessionId, item_id, response_text, isCorrect ? 1 : 0).run();

  // Update proficiency score (Weighted by difficulty)
  const existingProf = await c.env.DB.prepare('SELECT score, confidence FROM candidate_proficiency WHERE user_id = ? AND skill_id = ?')
    .bind(user.id, skill_id).first();
  
  let newScore = existingProf ? (existingProf.score as number) : 50;
  let newConfidence = existingProf ? (existingProf.confidence as number) : 0.0;
  
  // Difficulty is typically 1 to 5. 
  // Let's weight the score change by difficulty level. 
  const diffMultiplier = (item.difficulty_level as number) || 3;

  if (isCorrect) {
    newScore = Math.min(100, newScore + (diffMultiplier * 2.5));
  } else {
    newScore = Math.max(0, newScore - ((6 - diffMultiplier) * 2.5));
  }`
);

fs.writeFileSync('functions/api/[[route]].ts', content);
