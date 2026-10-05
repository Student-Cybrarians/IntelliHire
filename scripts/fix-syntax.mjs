import fs from 'fs';

const filePath = 'functions/api/[[route]].ts';
let code = fs.readFileSync(filePath, 'utf-8');

const brokenPartStr = `  });
  
  const aiResult = await aiResp.json() as any;
  const text = aiResult.choices?.[0]?.message?.content || '{}';
  let mapping;
  try {
    const jsonStr = text.substring(text.indexOf('{'), text.lastIndexOf('}') + 1);
    mapping = JSON.parse(jsonStr);
  } catch (e) {
    mapping = { error: 'Failed to parse' };
  }
  
  await logAuditEvent(c, dbUser.organization_id as string, user.id, 'GENERATE', 'ROLE_MAPPING', role_title);
  return c.json({ mapping });
});`;

const correctRoleMappingStr = `  });

app.post('/m2/role-mapping', async (c) => {
  const user = await getSessionUser(c);
  if (!user) return c.json({ error: 'Unauthorized' }, 401);
  const dbUser = await c.env.DB.prepare('SELECT organization_id FROM user_account WHERE id = ?').bind(user.id).first();
  if (!dbUser?.organization_id) return c.json({ error: 'Org not found' }, 403);

  const { role_title, occupation_id } = await c.req.json();
  const prompt = \`Generate a JSON array of core competencies and required skills for the role: \${role_title}. Return ONLY JSON.\`;
  
  const aiResp = await fetch("https://integrate.api.nvidia.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": \`Bearer \${c.env.NVIDIA_API_KEY}\`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: "meta/muse-glimmer-30b",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.1
    })
  });
  
  const aiResult = await aiResp.json() as any;
  const text = aiResult.choices?.[0]?.message?.content || '{}';
  let mapping;
  try {
    const jsonStr = text.substring(text.indexOf('{'), text.lastIndexOf('}') + 1);
    mapping = JSON.parse(jsonStr);
  } catch (e) {
    mapping = { error: 'Failed to parse' };
  }
  
  await logAuditEvent(c, dbUser.organization_id as string, user.id, 'GENERATE', 'ROLE_MAPPING', role_title);
  return c.json({ mapping });
});`;

if (code.includes(brokenPartStr)) {
  code = code.replace(brokenPartStr, correctRoleMappingStr);
  fs.writeFileSync(filePath, code, 'utf-8');
  console.log("Syntax error fixed.");
} else {
  console.log("Broken part not found.");
}
