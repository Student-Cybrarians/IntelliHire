async function run() {
  const base = 'https://intellihire-v3.pages.dev';
  const checks = [
    { name: 'Root SPA', url: base + '/', expected: [200] },
    { name: 'Login Page', url: base + '/login', expected: [200] },
    { name: 'Assess Route', url: base + '/assess', expected: [200] },
    { name: 'Resume Route', url: base + '/resume', expected: [200] },
    { name: 'Health Endpoint', url: base + '/api/health', expected: [200] },
    { name: 'M1 Status Protected', url: base + '/api/resume/status', expected: [401] },
    { name: 'M2 Blueprints Protected', url: base + '/api/m2/blueprints', expected: [401] },
    { name: 'M2 Attempts POST Protected', url: base + '/api/m2/attempts', method: 'POST', body: '{}', expected: [401] },
    { name: 'M2 Attempt ID GET Protected', url: base + '/api/m2/attempts/attempt-test-123', expected: [401] },
    { name: 'M2 Proficiency Protected', url: base + '/api/m2/proficiency', expected: [401] },
    { name: 'M2 Evidence Package Protected', url: base + '/api/m2/evidence-package', expected: [401] },
    { name: 'Resume Extractor Live', url: 'https://resume-extractor.codersy17mc.workers.dev?format=txt', method: 'POST', body: 'Candidate Jane Doe - Operations Lead', expected: [200] }
  ];

  let allPass = true;
  for (const c of checks) {
    try {
      const opts = { method: c.method || 'GET' };
      if (c.body) opts.body = c.body;
      const res = await fetch(c.url, opts);
      const ok = c.expected.includes(res.status);
      console.log(`[${ok ? 'PASS' : 'FAIL'}] ${c.name}: HTTP ${res.status} (expected ${c.expected.join(',')})`);
      if (!ok) allPass = false;
    } catch (e) {
      console.log(`[FAIL] ${c.name}: Exception ${e.message}`);
      allPass = false;
    }
  }

  process.exit(allPass ? 0 : 1);
}

run();
