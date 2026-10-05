import fs from 'fs';

const filePath = 'functions/api/[[route]].ts';
let code = fs.readFileSync(filePath, 'utf-8');

const m2EvaluateStart = "app.post('/m2/evaluate', async (c) => {";
// Find the end of m2Evaluate block
const idxStart = code.indexOf(m2EvaluateStart);
if (idxStart === -1) {
  console.log("Could not find /m2/evaluate route");
  process.exit(1);
}

// Find the end of the route block
const endRegex = /\n  \}\);\n/g;
endRegex.lastIndex = idxStart;
const match = endRegex.exec(code);
if (!match) {
  console.log("Could not find end of /m2/evaluate route");
  process.exit(1);
}

const idxEnd = match.index + match[0].length;

const originalRoute = code.substring(idxStart, idxEnd);

const newRoute = `app.post('/m2/evaluate', async (c) => {
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
    
    let score = 0;
    let confidence = 1.0;
    let evaluatorType = 'hybrid';
    let evaluatorMetadata: any = {};
    
    const content = JSON.parse((item.content_json as string) || '{}');
    const responseData = JSON.parse((responseRec.response_data_json as string) || '{}');
    const rubric = rubric_id ? await c.env.DB.prepare('SELECT * FROM assessment_rubric WHERE id = ?').bind(rubric_id).first() : null;
    const criteria = rubric ? rubric.evaluation_criteria_json : 'General correctness';

    let deterministicScore: number | null = null;
    if (item.item_type === 'mcq') {
      deterministicScore = responseData.answer === content.correct_answer ? 100 : 0;
      score = deterministicScore;
    }

    // M02 Adaptive Teaching Engine (Generates explanation regardless of type)
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
    // Use the correct schema columns for assessment_evaluation table
    // It has: id, response_id, evaluator_type, evaluator_metadata_json, score_raw, evaluation_json, confidence_score
    await c.env.DB.prepare(
      'INSERT INTO assessment_evaluation (id, response_id, evaluator_type, evaluator_metadata_json, score_raw, evaluation_json, confidence_score) VALUES (?, ?, ?, ?, ?, ?, ?)'
    ).bind(evalId, response_id, evaluatorType, JSON.stringify({ model: evaluatorMetadata.model }), score, JSON.stringify(evaluatorMetadata.teaching_payload || evaluatorMetadata), confidence).run();
  
    // Proficiency update (Bayesian-ish / Weighted average)
    const currentProf = await c.env.DB.prepare('SELECT * FROM candidate_skill_proficiency_v2 WHERE user_id = ? AND skill_id = ?').bind(attempt?.user_id, item.skill_id).first();
    const idProf = currentProf ? currentProf.id : crypto.randomUUID();
    
    let newProficiency = (score / 100);
    let newUncertainty = 0.5;
    let evidenceStatus = 'assessed';
    
    if (currentProf) {
      const oldProf = currentProf.proficiency_estimate as number;
      const oldUnc = currentProf.uncertainty_estimate as number;
      // Simple Kalman-like update
      const kalmanGain = oldUnc / (oldUnc + 0.2); // 0.2 is measurement noise
      newProficiency = oldProf + kalmanGain * (newProficiency - oldProf);
      newUncertainty = (1 - kalmanGain) * oldUnc;
    }
    
    await c.env.DB.prepare(
      'INSERT INTO candidate_skill_proficiency_v2 (id, user_id, skill_id, proficiency_estimate, uncertainty_estimate, evidence_status, latest_attempt_id) VALUES (?, ?, ?, ?, ?, ?, ?) ON CONFLICT(user_id, skill_id) DO UPDATE SET proficiency_estimate = excluded.proficiency_estimate, uncertainty_estimate = excluded.uncertainty_estimate, evidence_status = excluded.evidence_status, latest_attempt_id = excluded.latest_attempt_id'
    ).bind(idProf, attempt?.user_id, item.skill_id, newProficiency, newUncertainty, evidenceStatus, attempt?.id).run();
  
    return c.json({ success: true, evaluation_id: evalId, score, teaching_explanation: evaluatorMetadata.teaching_payload });
  });
`;

code = code.replace(originalRoute, newRoute);
fs.writeFileSync(filePath, code, 'utf-8');
console.log("Evaluation teaching engine injected!");
