import fs from 'fs';

const filePath = 'functions/api/[[route]].ts';
let code = fs.readFileSync(filePath, 'utf-8');

const respondRouteStr = `app.post('/m2/attempts/:id/respond', async (c) => {
  const user = await getSessionUser(c);
  if (!user) return c.json({ error: 'Unauthorized' }, 401);
  const dbUser = await c.env.DB.prepare('SELECT organization_id FROM user_account WHERE id = ?').bind(user.id).first();
  if (!dbUser?.organization_id) return c.json({ error: 'Org not found' }, 403);

  const attemptId = c.req.param('id');
  const { item_id, response_data, time_taken_seconds } = await c.req.json();
  const responseId = crypto.randomUUID();

  await c.env.DB.prepare(
    'INSERT INTO assessment_response_v2 (id, attempt_id, item_id, response_data_json) VALUES (?, ?, ?, ?)'
  ).bind(responseId, attemptId, item_id, JSON.stringify(response_data)).run();

  await logAuditEvent(c, dbUser.organization_id as string, user.id, 'RESPOND', 'ATTEMPT', attemptId, { response_id: responseId });

  // Evaluate immediately
  const item = await c.env.DB.prepare('SELECT * FROM assessment_item_v2 WHERE id = ?').bind(item_id).first();
  const attempt = await c.env.DB.prepare('SELECT * FROM assessment_attempt WHERE id = ?').bind(attemptId).first();
  if (!item || !attempt) return c.json({ error: 'Item or Attempt not found' }, 404);

  let score = 0;
  let confidence = 1.0;
  let evaluatorType = 'hybrid';
  let evaluatorMetadata: any = {};
  
  const content = JSON.parse((item.content_json as string) || '{}');
  const criteria = 'General correctness';

  let deterministicScore: number | null = null;
  if (item.item_type === 'mcq' || item.item_type === 'multiple_choice') {
    const isCorrect = String(response_data.selected_option || response_data.answer) === String(content.correct_answer);
    deterministicScore = isCorrect ? 100 : 0;
    score = deterministicScore;
  }

  const prompt = \`As an expert AI tutor and assessor, evaluate the candidate's response and provide a comprehensive teaching explanation.
  Item Type: \${item.item_type}
  Question/Task: \${content.question || content.text}
  \${content.options ? 'Options: ' + JSON.stringify(content.options) : ''}
  \${content.correct_answer ? 'Correct Answer: ' + content.correct_answer : ''}
  Evaluation Criteria: \${criteria}
  Candidate Response: \${JSON.stringify(response_data)}
  
  You MUST return ONLY a valid JSON object matching exactly this schema:
  {
    "score": <integer 0-100, use \${deterministicScore !== null ? deterministicScore : 'your evaluation based on criteria'}>,
    "is_correct": <boolean>,
    "explanation_of_correct_answer": "<Explain what the ideal answer is and WHY it is correct>",
    "how_to_arrive": "<Step-by-step logic to arrive at the solution>",
    "analysis_of_candidate_answer": "<Explain WHY the candidate's answer is incorrect, partially correct, or incomplete. If fully correct, praise the specific correct reasoning.>",
    "analysis_of_alternatives": "<Explain WHY similar/alternative answers or distractors are incorrect or when they might be valid under different constraints>",
    "misconception_remediation": "<Identify any underlying misconception and explain how to remember or understand the concept correctly>"
  }\`;
  
  try {
    const aiResp = await fetch("https://integrate.api.nvidia.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": \`Bearer \${c.env.NVIDIA_API_KEY}\`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "meta/muse-glimmer-30b",
        messages: [{ role: "system", content: "You are a JSON-only evaluation and teaching engine. Return strict JSON without markdown formatting." }, { role: "user", content: prompt }],
        temperature: 0.1,
        max_tokens: 1500
      })
    });
    const aiResult = await aiResp.json() as any;
    const text = aiResult.choices?.[0]?.message?.content || '{}';
    
    const jsonStr = text.substring(text.indexOf('{'), text.lastIndexOf('}') + 1);
    const parsedContent = JSON.parse(jsonStr);

    if (deterministicScore === null) {
      score = parsedContent.score || 0;
    }
    
    evaluatorMetadata = { 
      model: "meta/muse-glimmer-30b",
      teaching_payload: parsedContent
    };
    confidence = 0.9;
  } catch (e) {
    evaluatorMetadata = { error: 'Failed to generate teaching explanation' };
    if (deterministicScore === null) score = 0;
  }

  const evalId = crypto.randomUUID();
  await c.env.DB.prepare(
    'INSERT INTO assessment_evaluation (id, response_id, evaluator_type, evaluator_metadata_json, score_raw, evaluation_json, confidence_score) VALUES (?, ?, ?, ?, ?, ?, ?)'
  ).bind(evalId, responseId, evaluatorType, JSON.stringify({ model: evaluatorMetadata.model }), score, JSON.stringify(evaluatorMetadata.teaching_payload || evaluatorMetadata), confidence).run();

  const currentProf = await c.env.DB.prepare('SELECT * FROM candidate_skill_proficiency_v2 WHERE user_id = ? AND skill_id = ?').bind(attempt?.user_id, item.skill_id).first();
  const idProf = currentProf ? currentProf.id : crypto.randomUUID();
  
  let newProficiency = (score / 100);
  let newUncertainty = 0.5;
  let evidenceStatus = 'assessed';
  
  if (currentProf) {
    const oldProf = currentProf.proficiency_estimate as number;
    const oldUnc = currentProf.uncertainty_estimate as number;
    const kalmanGain = oldUnc / (oldUnc + 0.2);
    newProficiency = oldProf + kalmanGain * (newProficiency - oldProf);
    newUncertainty = (1 - kalmanGain) * oldUnc;
  }
  
  await c.env.DB.prepare(
    'INSERT INTO candidate_skill_proficiency_v2 (id, user_id, skill_id, proficiency_estimate, uncertainty_estimate, evidence_status, latest_attempt_id) VALUES (?, ?, ?, ?, ?, ?, ?) ON CONFLICT(user_id, skill_id) DO UPDATE SET proficiency_estimate = excluded.proficiency_estimate, uncertainty_estimate = excluded.uncertainty_estimate, evidence_status = excluded.evidence_status, latest_attempt_id = excluded.latest_attempt_id'
  ).bind(idProf, attempt?.user_id, item.skill_id, newProficiency, newUncertainty, evidenceStatus, attempt?.id).run();

  return c.json({ 
    success: true, 
    id: responseId,
    evaluation: {
      score_raw: score / 100,
      confidence_score: confidence,
      evaluator_type: evaluatorType,
      teaching_payload: evaluatorMetadata.teaching_payload
    }
  });
});`;

const startIdx = code.indexOf("app.post('/m2/attempts/:id/respond', async (c) => {");
const endStr = "  app.post('/m2/attempts/:id/complete', async (c) => {";
const endIdx = code.indexOf(endStr);

if (startIdx !== -1 && endIdx !== -1) {
    const toReplace = code.substring(startIdx, endIdx);
    code = code.replace(toReplace, respondRouteStr + "\n\n");
    fs.writeFileSync(filePath, code, 'utf-8');
    console.log("Merged respond+evaluate!");
} else {
    console.log("Could not find bounds.");
}
