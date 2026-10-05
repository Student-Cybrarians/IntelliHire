import fs from 'fs';

const filePath = 'functions/api/assessment.test.ts';
let code = fs.readFileSync(filePath, 'utf-8');

const testCode = `
  it('Candidate receives adaptive teaching payload on response submission', async () => {
    // Setup fetch mock for NVIDIA API used in evaluateAndTeach
    const originalFetch = global.fetch;
    global.fetch = vi.fn().mockResolvedValue({
      json: async () => ({
        choices: [{
          message: {
            content: JSON.stringify({
              score: 80,
              is_correct: true,
              explanation_of_correct_answer: "SELECT retrieves data.",
              how_to_arrive: "Think about the SQL standard.",
              analysis_of_candidate_answer: "You are correct.",
              analysis_of_alternatives: "UPDATE is for modifying.",
              misconception_remediation: "N/A",
              follow_up_question: "How do you filter results?",
              adaptation_recommendation: "increase_difficulty"
            })
          }
        }]
      })
    }) as any;

    const env = createMockEnv();
    
    // Mock the DB specifically for the respond route
    env.DB.prepare = vi.fn().mockImplementation((query: string) => ({
      bind: (...args: any[]) => ({
        first: vi.fn().mockImplementation(async () => {
          if (query.includes('assessment_item_v2')) {
            return { id: 'item-1', skill_id: 'skill-1', item_type: 'mcq', content_json: '{"correct_answer":"A"}' };
          }
          if (query.includes('assessment_attempt')) {
            return { id: 'attempt-1', user_id: 'recruiter-1', adaptive_state_json: '{}' };
          }
          if (query.includes('candidate_skill_proficiency_v2')) {
            return { id: 'prof-1', proficiency_estimate: 0.5, uncertainty_estimate: 0.5 };
          }
          if (query.includes('user_account')) {
            return { organization_id: 'org-1' };
          }
          return null;
        }),
        run: vi.fn().mockResolvedValue({ success: true }),
        all: vi.fn().mockResolvedValue({ results: [] })
      })
    }));

    const req = new Request('http://localhost/api/m2/attempts/attempt-1/respond', {
      method: 'POST',
      headers: { 'Cookie': 'intellihire_session=recruiter-token', 'Content-Type': 'application/json' },
      body: JSON.stringify({ item_id: 'item-1', response_data: { answer: 'A' } })
    });

    const res = await app.request(req, {}, env as any);
    
    // Restore fetch
    global.fetch = originalFetch;

    expect(res.status).toBe(200);
    const data = await res.json() as any;
    expect(data.success).toBe(true);
    expect(data.evaluation).toBeDefined();
    expect(data.evaluation.teaching_payload).toBeDefined();
    expect(data.evaluation.teaching_payload.explanation_of_correct_answer).toBe("SELECT retrieves data.");
    expect(data.evaluation.teaching_payload.follow_up_question).toBe("How do you filter results?");
  });
`;

const closingBraceIndex = code.lastIndexOf('});');
if (closingBraceIndex !== -1) {
  code = code.substring(0, closingBraceIndex) + testCode + "\n" + code.substring(closingBraceIndex);
  fs.writeFileSync(filePath, code, 'utf-8');
  console.log("Added test for teaching payload.");
} else {
  console.log("Could not find closing brace.");
}
