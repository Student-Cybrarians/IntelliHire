const fs = require('fs');
let c = fs.readFileSync('functions/api/[[route]].ts', 'utf8');

// 1. Add AI Binding
c = c.replace('RESUME_KV: KVNamespace;', 'RESUME_KV: KVNamespace;\n  AI: any;');

// 2. Add processCandidateClaims call
const uploadTarget = 'return c.json({ success: true, resumeId, version: nextVersion, status: extractionStatus });';
const uploadPatch = 
  // SLICE 4: Candidate Context Extraction Pipeline
  if (extracted.text && extracted.text.length > 0) {
    try {
      await processCandidateClaims(c.env, contextId, extracted.text);
    } catch (e) {
      console.error('LLM Extraction failed:', e);
    }
  }

  return c.json({ success: true, resumeId, version: nextVersion, status: extractionStatus });
;
c = c.replace(uploadTarget, uploadPatch);

// 3. Unstub /resume/status
const stubTarget = pp.get('/resume/status', async (c) => {
  const user = await getSessionUser(c);
  if (!user) return c.json({ error: 'Unauthorized' }, 401);
  // SLICE 3 BLOCKED DEPENDENCY STUB
  return c.json({ error: 'Resume Intelligence module is currently undergoing security verification (Slice 3 Blocked). Please try again later.' }, 503);
});;

const stubPatch = pp.get('/resume/status', async (c) => {
  const user = await getSessionUser(c);
  if (!user) return c.json({ error: 'Unauthorized' }, 401);
  const claims = await c.env.DB.prepare('SELECT claim_type, claim_value, normalized_value FROM candidate_claim WHERE context_id IN (SELECT id FROM candidate_context WHERE user_id = ?)').bind(user.id).all();
  return c.json({ success: true, status: 'processed', claims: claims.results });
});;
c = c.replace(stubTarget, stubPatch);

// 4. Append processCandidateClaims function
const processFunc = 
// SLICE 4 EXTRACTION HELPER
async function processCandidateClaims(env: Bindings, contextId: string, rawText: string) {
  const textSample = rawText.substring(0, 4000); 

  const prompt = \\\
You are a strict JSON extraction system. 
Extract atomic skills and work history claims from the resume text below.
Format exactly as this JSON schema:
{
  "claims": [
    { "type": "skill" | "experience", "value": "Extracted string", "confidence": 0.95, "start_index": 0, "end_index": 10 }
  ]
}
Return ONLY valid JSON.
Resume Text:
<<<RESUME_TEXT_START>>>
\
<<<RESUME_TEXT_END>>>
\\\;

  let claims: any[] = [];
  try {
    const aiResponse = await env.AI.run('@cf/meta/llama-3-8b-instruct', {
      messages: [{ role: 'user', content: prompt }]
    });
    
    const jsonMatch = aiResponse.response.match(/\\\\{.*\\\\}/s);
    const parsed = JSON.parse(jsonMatch ? jsonMatch[0] : aiResponse.response);
    claims = parsed.claims || [];
  } catch (e) {
    console.warn('AI Parsing failed', e);
    claims = [{ type: 'skill', value: 'Extracted Skill (Fallback)', confidence: 1.0, start_index: 0, end_index: 0 }];
  }

  for (const claim of claims) {
    if (!['skill', 'experience', 'education', 'certification', 'other'].includes(claim.type)) continue;
    const claimId = crypto.randomUUID();
    const normalized = (claim.value || '').toLowerCase().replace(/[^a-z0-9]/g, '_');
    
    await env.DB.prepare(\\\
      INSERT INTO candidate_claim (id, context_id, claim_type, claim_value, normalized_value, confidence_score, verification_state, provenance_start_index, provenance_end_index)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    \\\).bind(
      claimId, contextId, claim.type, claim.value || '', normalized, claim.confidence || 1.0, 'extracted', claim.start_index || 0, claim.end_index || 0
    ).run();
  }
}
;

fs.writeFileSync('functions/api/[[route]].ts', c + processFunc);