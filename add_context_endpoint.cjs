const fs = require('fs');
let content = fs.readFileSync('functions/api/[[route]].ts', 'utf8');

const routeToAdd = `
// Candidate Context Package API
app.get('/candidate/context', async (c) => {
  const user = await getSessionUser(c);
  if (!user || user.role !== 'candidate') return c.json({ error: 'Unauthorized' }, 401);

  // Fetch all evidence
  const evidence = await c.env.DB.prepare('SELECT category, normalized_value, evidence_status, confidence, source_reference, contradiction_notes, needs_human_review FROM evidence_item WHERE user_id = ?').bind(user.id).all();
  
  // Fetch proficiency scores (from M2)
  const proficiencies = await c.env.DB.prepare('SELECT skill_id, score, confidence FROM candidate_proficiency WHERE user_id = ?').bind(user.id).all();

  const packageVersion = "1.0";
  const contextPackage = {
    version: packageVersion,
    candidate_id: user.id,
    generated_at: new Date().toISOString(),
    evidence: evidence.results || [],
    proficiencies: proficiencies.results || [],
    status: 'READY'
  };

  return c.json({ success: true, package: contextPackage });
});
`;

// Insert near the end before export
content = content.replace(/export default app;/m, routeToAdd + '\nexport default app;');
fs.writeFileSync('functions/api/[[route]].ts', content);
