const fs = require('fs');
let content = fs.readFileSync('functions/api/[[route]].ts', 'utf8');

// Replace waituntil logic with queue send
const oldMatchRun = /const doMatch = async \(\) => \{[\s\S]*?c\.executionCtx\.waitUntil\(doMatch\(\)\);/;
const newMatchRun = `
  await c.env.M1_JOBS.send({
    jobId: jobId,
    type: 'MATCH_ANALYSIS',
    payload: { resume_id, jd_id, user_id: user.id }
  });
`;

content = content.replace(oldMatchRun, newMatchRun);

// Need to add M1_JOBS to Bindings type
const oldBindings = /NVIDIA_API_KEY: string;\s*RESUME_KV: KVNamespace;/;
const newBindings = `NVIDIA_API_KEY: string;
  RESUME_KV: KVNamespace;
  M1_JOBS: Queue;`;

content = content.replace(oldBindings, newBindings);

fs.writeFileSync('functions/api/[[route]].ts', content);
