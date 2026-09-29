const fs = require('fs');
let c = fs.readFileSync('functions/api/[[route]].ts', 'utf8');

const slice5Routes = \
// 10. Requisition & Vacancy Mapping (Slice 5)
app.post('/requisitions', async (c) => {
  const user = await getSessionUser(c);
  if (!user || (user.role !== 'recruiter' && user.role !== 'org_admin')) return c.json({ error: 'Unauthorized' }, 401);
  
  const dbUser = await c.env.DB.prepare('SELECT organization_id FROM user_account WHERE id = ?').bind(user.id).first();
  if (!dbUser) return c.json({ error: 'Tenant missing' }, 403);
  
  let body;
  try { body = await c.req.json(); } catch(e) { return c.json({ error: 'Invalid JSON' }, 400); }
  
  if (!body.title) return c.json({ error: 'Missing title' }, 400);
  const reqId = crypto.randomUUID();
  
  await c.env.DB.prepare(\\\\\
    INSERT INTO job_requisition (id, organization_id, created_by_user_id, title, department, description, status)
    VALUES (?, ?, ?, ?, ?, ?, 'open')
  \\\\\\).bind(reqId, dbUser.organization_id, user.id, body.title, body.department || '', body.description || '').run();
  
  return c.json({ success: true, requisitionId: reqId });
});

app.get('/requisitions', async (c) => {
  const user = await getSessionUser(c);
  if (!user) return c.json({ error: 'Unauthorized' }, 401);
  
  const dbUser = await c.env.DB.prepare('SELECT organization_id FROM user_account WHERE id = ?').bind(user.id).first();
  if (!dbUser) return c.json({ error: 'Tenant missing' }, 403);
  
  const reqs = await c.env.DB.prepare('SELECT id, title, department, status, created_at FROM job_requisition WHERE organization_id = ? AND status = \\'open\\' ORDER BY created_at DESC').bind(dbUser.organization_id).all();
  return c.json({ success: true, requisitions: reqs.results });
});

app.post('/requisitions/:id/apply', async (c) => {
  const user = await getSessionUser(c);
  if (!user || user.role !== 'candidate') return c.json({ error: 'Unauthorized' }, 401);
  
  const dbUser = await c.env.DB.prepare('SELECT organization_id FROM user_account WHERE id = ?').bind(user.id).first();
  if (!dbUser) return c.json({ error: 'Tenant missing' }, 403);
  
  const reqId = c.req.param('id');
  
  // Verify requisition exists and is open for this tenant
  const reqCheck = await c.env.DB.prepare('SELECT id FROM job_requisition WHERE id = ? AND organization_id = ? AND status = \\'open\\'').bind(reqId, dbUser.organization_id).first();
  if (!reqCheck) return c.json({ error: 'Requisition not found or closed' }, 404);
  
  const appId = crypto.randomUUID();
  try {
    await c.env.DB.prepare(\\\\\
      INSERT INTO candidate_application (id, organization_id, requisition_id, candidate_user_id, status)
      VALUES (?, ?, ?, ?, 'applied')
    \\\\\\).bind(appId, dbUser.organization_id, reqId, user.id).run();
  } catch (e: any) {
    if (e.message?.includes('UNIQUE')) {
      return c.json({ error: 'Already applied' }, 409);
    }
    return c.json({ error: 'Database error' }, 500);
  }
  
  return c.json({ success: true, applicationId: appId });
});

app.get('/requisitions/:id/applications', async (c) => {
  const user = await getSessionUser(c);
  if (!user || (user.role !== 'recruiter' && user.role !== 'org_admin')) return c.json({ error: 'Unauthorized' }, 401);
  
  const dbUser = await c.env.DB.prepare('SELECT organization_id FROM user_account WHERE id = ?').bind(user.id).first();
  const reqId = c.req.param('id');
  
  // Tenant isolation boundary: bind organization_id
  const apps = await c.env.DB.prepare(\\\\\
    SELECT a.id, a.candidate_user_id, a.status, a.match_score, a.created_at, u.full_name, u.email 
    FROM candidate_application a
    JOIN user_account u ON a.candidate_user_id = u.id
    WHERE a.requisition_id = ? AND a.organization_id = ?
    ORDER BY a.created_at DESC
  \\\\\\).bind(reqId, dbUser.organization_id).all();
  
  return c.json({ success: true, applications: apps.results });
});
\;

c = c.replace('export const onRequest = handle(app);', slice5Routes + '\\nexport const onRequest = handle(app);');
fs.writeFileSync('functions/api/[[route]].ts', c);