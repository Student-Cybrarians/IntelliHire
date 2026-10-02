async function run() {
  const base = 'https://intellihire-v3.pages.dev';
  const checks = [
    { name: 'Root [home]', url: base + '/', expected: [200] },
    { name: '[about]', url: base + '/about', expected: [200] },
    { name: '[google login]', url: base + '/login', expected: [200] },
    { name: '[register]', url: base + '/register', expected: [200] },
    { name: '[onboard]', url: base + '/onboarding', expected: [200] },
    { name: '[dashboard]', url: base + '/dashboard', expected: [200] },
    { name: '[candidate]', url: base + '/candidate', expected: [200] },
    { name: '[admin]', url: base + '/admin', expected: [200] },
    { name: '[module 1] /resume', url: base + '/resume', expected: [200] },
    { name: '[module 1] /module-1', url: base + '/module-1', expected: [200] },
    { name: '[module 2] /assess', url: base + '/assess', expected: [200] },
    { name: '[module 2] /module-2', url: base + '/module-2', expected: [200] },
    { name: '[module 3] /module-3', url: base + '/module-3', expected: [200] },
    { name: '[module 4] /module-4', url: base + '/module-4', expected: [200] },
    { name: '[module 5] /module-5', url: base + '/module-5', expected: [200] },
    { name: 'Health Check API', url: base + '/api/health', expected: [200] },
    { name: 'M1 Resume Protected', url: base + '/api/resume/status', expected: [401] },
    { name: 'M2 Blueprints Protected', url: base + '/api/m2/blueprints', expected: [401] },
    { name: 'M2 Attempts Protected', url: base + '/api/m2/attempts', method: 'POST', body: '{}', expected: [401] },
    { name: 'M2 Modality Registry Protected', url: base + '/api/m2/modalities', expected: [401] },
    { name: 'M2 Evidence Strategies Protected', url: base + '/api/m2/strategies', expected: [401] },
    { name: 'M2 Purposes Protected', url: base + '/api/m2/purposes', expected: [401] },
    { name: 'M2 Seniorities Protected', url: base + '/api/m2/seniorities', expected: [401] },
    { name: 'M2 Occupation Adapters Protected', url: base + '/api/m2/occupations/adapters', expected: [401] }
  ];

  let allPass = true;
  for (const c of checks) {
    try {
      const opts = { method: c.method || 'GET' };
      if (c.body) opts.body = c.body;
      const res = await fetch(c.url, opts);
      const ok = c.expected.includes(res.status);
      console.log(`[${ok ? 'PASS' : 'FAIL'}] ${c.name}: HTTP ${res.status}`);
      if (!ok) allPass = false;
    } catch (e) {
      console.log(`[FAIL] ${c.name}: Exception ${e.message}`);
      allPass = false;
    }
  }

  process.exit(allPass ? 0 : 1);
}

run();
