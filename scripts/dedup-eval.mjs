import fs from 'fs';

const filePath = 'functions/api/[[route]].ts';
let code = fs.readFileSync(filePath, 'utf-8');

// I will extract the duplicated logic into a helper function and replace both routes to use it.
const helperFunc = `
async function evaluateAndTeach(env: Bindings, responseRec: any, item: any, attempt: any, responseData: any, rubric_id?: string) {
  let score = 0;
  let confidence = 1.0;
  let evaluatorType = 'hybrid';
  let evaluatorMetadata: any = {};
  
  const content = JSON.parse((item.content_json as string) || '{}');
  const criteria = 'General correctness';

  let deterministicScore: number | null = null;
  if (item.item_type === 'mcq' || item.item_type === 'multiple_choice') {
    const isCorrect = String(responseData.selected_option || responseData.answer) === String(content.correct_answer);
    deterministicScore = isCorrect ? 100 : 0;
    score = deterministicScore;
  }

  const prompt = \`As an expert AI tutor and assessor, evaluate the candidate's response and provide a comprehensive teaching explanation.
  Item Type: \${item.item_type}
  Question/Task: \${content.question || content.text}
  \${content.options ? 'Options: ' + JSON.stringify(content.options) : ''}
  \${content.correct_answer ? 'Correct Answer: ' + content.correct_answer : ''}
  Evaluation Criteria: \${criteria}
  Candidate Response: \${JSON.stringify(responseData)}
  
  You MUST return ONLY a valid JSON object matching exactly this schema:
  {
    "score": <integer 0-100, use \${deterministicScore !== null ? deterministicScore : 'your evaluation based on criteria'}>,
    "is_correct": <boolean>,
    "explanation_of_correct_answer": "<Explain what the ideal answer is and WHY it is correct>",
    "how_to_arrive": "<Step-by-step logic to arrive at the solution>",
    "analysis_of_candidate_answer": "<Explain WHY the candidate's answer is incorrect, partially correct, or incomplete. If fully correct, praise the specific correct reasoning.>",
    "analysis_of_alternatives": "<Explain WHY similar/alternative answers or distractors are incorrect or when they might be valid under different constraints>",
    "misconception_remediation": "<Identify any underlying misconception and explain how to remember or understand the concept correctly>",
    "follow_up_question": "<A short follow-up question to test if they have understood the remediation>",
    "adaptation_recommendation": "<'increase_difficulty', 'maintain', or 'revisit_concept'>",
    "reassess_focus": "<Specific sub-topic to reassess>"
  }\`;
  
  try {
    const aiResp = await fetch("https://integrate.api.nvidia.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": \`Bearer \${env.NVIDIA_API_KEY}\`,
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
  await env.DB.prepare(
    'INSERT INTO assessment_evaluation (id, response_id, evaluator_type, evaluator_metadata_json, score_raw, evaluation_json, confidence_score) VALUES (?, ?, ?, ?, ?, ?, ?)'
  ).bind(evalId, responseRec.id, evaluatorType, JSON.stringify({ model: evaluatorMetadata.model }), score, JSON.stringify(evaluatorMetadata.teaching_payload || evaluatorMetadata), confidence).run();

  const currentProf = await env.DB.prepare('SELECT * FROM candidate_skill_proficiency_v2 WHERE user_id = ? AND skill_id = ?').bind(attempt?.user_id, item.skill_id).first();
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

  // Update adaptive state with the reassess focus if they failed
  let newAdaptiveStateJson = attempt.adaptive_state_json;
  if (score < 70 && evaluatorMetadata.teaching_payload?.reassess_focus) {
    try {
      const state = JSON.parse(attempt.adaptive_state_json as string || '{}');
      state.reassess_focus = evaluatorMetadata.teaching_payload.reassess_focus;
      state.adaptation = evaluatorMetadata.teaching_payload.adaptation_recommendation;
      newAdaptiveStateJson = JSON.stringify(state);
      await env.DB.prepare('UPDATE assessment_attempt SET adaptive_state_json = ? WHERE id = ?').bind(newAdaptiveStateJson, attempt.id).run();
    } catch(e) {}
  }
  
  await env.DB.prepare(
    'INSERT INTO candidate_skill_proficiency_v2 (id, user_id, skill_id, proficiency_estimate, uncertainty_estimate, evidence_status, latest_attempt_id) VALUES (?, ?, ?, ?, ?, ?, ?) ON CONFLICT(user_id, skill_id) DO UPDATE SET proficiency_estimate = excluded.proficiency_estimate, uncertainty_estimate = excluded.uncertainty_estimate, evidence_status = excluded.evidence_status, latest_attempt_id = excluded.latest_attempt_id'
  ).bind(idProf, attempt?.user_id, item.skill_id, newProficiency, newUncertainty, evidenceStatus, attempt?.id).run();

  return {
    evaluation_id: evalId,
    score_raw: score / 100,
    confidence_score: confidence,
    evaluator_type: evaluatorType,
    teaching_payload: evaluatorMetadata.teaching_payload
  };
}
`;

// Now let's remove the duplicated logic in both routes.

// Fix app.post('/m2/attempts/:id/respond'
const respondStart = "app.post('/m2/attempts/:id/respond', async (c) => {";
const respondEnd = "app.post('/m2/attempts/:id/complete', async (c) => {";
const idxR1 = code.indexOf(respondStart);
const idxR2 = code.indexOf(respondEnd);

if (idxR1 !== -1 && idxR2 !== -1) {
  const newRespondRoute = `app.post('/m2/attempts/:id/respond', async (c) => {
    const user = await getSessionUser(c);
    if (!user) return c.json({ error: 'Unauthorized' }, 401);
    const dbUser = await c.env.DB.prepare('SELECT organization_id FROM user_account WHERE id = ?').bind(user.id).first();
    if (!dbUser?.organization_id) return c.json({ error: 'Org not found' }, 403);
  
    const attemptId = c.req.param('id');
    const body = await c.req.json();
    const item_id = body.item_id;
    const response_data_json = body.response_data || body.response_data_json;
    const responseId = crypto.randomUUID();
  
    await c.env.DB.prepare(
      'INSERT INTO assessment_response_v2 (id, attempt_id, item_id, response_data_json) VALUES (?, ?, ?, ?)'
    ).bind(responseId, attemptId, item_id, JSON.stringify(response_data_json)).run();
  
    await logAuditEvent(c, dbUser.organization_id as string, user.id, 'RESPOND', 'ATTEMPT', attemptId, { response_id: responseId });
  
    const item = await c.env.DB.prepare('SELECT * FROM assessment_item_v2 WHERE id = ?').bind(item_id).first();
    const attempt = await c.env.DB.prepare('SELECT * FROM assessment_attempt WHERE id = ?').bind(attemptId).first();
    if (!item || !attempt) return c.json({ success: true, id: responseId });
  
    const evaluation = await evaluateAndTeach(c.env, { id: responseId, ...body }, item, attempt, response_data_json);
  
    return c.json({ 
      success: true, 
      id: responseId,
      evaluation
    });
  });

  `;
  code = code.substring(0, idxR1) + newRespondRoute + code.substring(idxR2);
}

// Fix app.post('/m2/evaluate'
const evalStart = "app.post('/m2/evaluate', async (c) => {";
const evalEnd = "app.post('/m2/role-mapping', async (c) => {";
const idxE1 = code.indexOf(evalStart);
const idxE2 = code.indexOf(evalEnd);

if (idxE1 !== -1 && idxE2 !== -1) {
  const newEvalRoute = `app.post('/m2/evaluate', async (c) => {
    const user = await getSessionUser(c);
    if (!user) return c.json({ error: 'Unauthorized' }, 401);
    const dbUser = await c.env.DB.prepare('SELECT organization_id FROM user_account WHERE id = ?').bind(user.id).first();
    if (!dbUser?.organization_id) return c.json({ error: 'Org not found' }, 403);
  
    const { response_id, rubric_id } = await c.req.json();
    
    const responseRec = await c.env.DB.prepare('SELECT * FROM assessment_response_v2 WHERE id = ?').bind(response_id).first();
    if (!responseRec) return c.json({ error: 'Response not found' }, 404);
  
    const item = await c.env.DB.prepare('SELECT * FROM assessment_item_v2 WHERE id = ?').bind(responseRec.item_id).first();
    if (!item) return c.json({ error: 'Item not found' }, 404);
  
    const attempt = await c.env.DB.prepare('SELECT * FROM assessment_attempt WHERE id = ?').bind(responseRec.attempt_id).first();
    
    const responseData = JSON.parse((responseRec.response_data_json as string) || '{}');
    const evaluation = await evaluateAndTeach(c.env, responseRec, item, attempt, responseData, rubric_id);
    
    return c.json({ success: true, ...evaluation });
  });

`;
  code = code.substring(0, idxE1) + newEvalRoute + code.substring(idxE2);
}

// Insert helper func right before /m2/blueprints (first m2 route) to be safe and in scope
const m2Start = "app.post('/m2/blueprints'";
if (code.includes(m2Start)) {
  code = code.replace(m2Start, helperFunc + "\n" + m2Start);
}

fs.writeFileSync(filePath, code, 'utf-8');
console.log("Refactored logic into evaluateAndTeach helper.");
