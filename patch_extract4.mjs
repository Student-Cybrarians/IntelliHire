import fs from 'fs';
const content = fs.readFileSync('functions/api/[[route]].ts', 'utf8');

if (content.includes("app.post('/resume/extract/:resume_id'")) {
    console.log("Already injected.");
} else {
    const newEndpoint = `
// AI Resume Intelligence Extraction
app.post('/resume/extract/:resume_id', async (c) => {
  const user = await getSessionUser(c);
  if (!user) return c.json({ error: 'Unauthorized' }, 401);

  const resumeId = c.req.param('resume_id');
  const dbUser = await c.env.DB.prepare('SELECT organization_id FROM user_account WHERE id = ?').bind(user.id).first();
  if (!dbUser) return c.json({ error: 'Tenant context missing' }, 403);
  
  // Verify ownership and get raw text
  const resumeData = await c.env.DB.prepare(\`
    SELECT r.id, c.raw_text, c.id as context_id
    FROM candidate_resume r
    JOIN candidate_context c ON r.id = c.resume_id
    WHERE r.id = ? AND r.user_id = ? AND r.organization_id = ?
  \`).bind(resumeId, user.id, dbUser.organization_id).first();

  if (!resumeData) return c.json({ error: 'Resume not found or unauthorized' }, 404);
  
  const apiKey = c.env.NVIDIA_API_KEY;
  if (!apiKey) {
    return c.json({ 
      error: 'AI Extraction Unavailable: Missing Provider Credentials',
      details: 'NVIDIA API key not configured server-side.'
    }, 503);
  }

  const systemPrompt = \`You are an AI trained to extract structured ATS data from raw resume text.
Analyze only supplied evidence. Do not invent facts, job titles, or experience.
Identify missing information. Distinguish extracted facts from interpretation.
Format as JSON: { "skills": [string], "experience": [ { "company": string, "title": string, "years": string } ], "education": [string] }\`;

  try {
    const aiResponse = await fetch('https://integrate.api.nvidia.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': \`Bearer \${apiKey}\`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'meta/muse-glimmer-30b',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: resumeData.raw_text as string }
        ],
        temperature: 0,
        max_tokens: 1024
      })
    });

    if (aiResponse.status === 429) return c.json({ error: 'AI Extraction Rate Limited: Provider quota exceeded' }, 429);
    if (!aiResponse.ok) return c.json({ error: 'AI Provider Unavailable' }, 502);

    const aiData = await aiResponse.json();
    const aiContent = aiData.choices?.[0]?.message?.content;
    if (!aiContent) return c.json({ error: 'Empty response from AI provider' }, 500);
    
    let structuredData;
    try {
      structuredData = JSON.parse(aiContent);
    } catch (e) {
      const cleaned = aiContent.replace(/\`\`\`json/g, '').replace(/\`\`\`/g, '').trim();
      try {
        structuredData = JSON.parse(cleaned);
      } catch (e2) {
        return c.json({ error: 'Malformed AI output', raw: aiContent }, 500);
      }
    }

    const finalPayload = {
      ...structuredData,
      provenance: { source_document_id: resumeId, extraction_method: 'meta/muse-glimmer-30b', extraction_status: 'extracted', confidence: 'unverified' }
    };

    await c.env.DB.prepare("UPDATE candidate_context SET context_data_json = ?, extraction_status = 'parsed' WHERE id = ?").bind(JSON.stringify(finalPayload), resumeData.context_id).run();

    if (structuredData.skills && Array.isArray(structuredData.skills)) {
      for (const skill of structuredData.skills) {
        await c.env.DB.prepare(\`INSERT INTO candidate_claim (id, context_id, claim_type, claim_value, confidence_score, verification_state) VALUES (?, ?, 'skill', ?, 0.9, 'extracted')\`).bind(crypto.randomUUID(), resumeData.context_id, String(skill).substring(0, 255)).run();
      }
    }

    return c.json({ success: true, data: finalPayload });
  } catch (error) {
    return c.json({ error: 'Timeout or network failure reaching AI provider' }, 504);
  }
});
`;
    // We will append it right before the final line `export const onRequest = handle(app);`
    const updated = content.replace("export const onRequest = handle(app);", newEndpoint + "\nexport const onRequest = handle(app);");
    fs.writeFileSync('functions/api/[[route]].ts', updated);
    console.log('Successfully injected /resume/extract/:resume_id');
}
