import fs from 'fs';

const filePath = 'functions/api/[[route]].ts';
let code = fs.readFileSync(filePath, 'utf-8');

// Add import
if (!code.includes("from 'docx'")) {
    code = `import { Document, Packer, Paragraph, TextRun, HeadingLevel } from 'docx';\n` + code;
}

// Add the new route
const newRoute = `
  app.get('/resume/:id/export', async (c) => {
    const user = await getSessionUser(c);
    if (!user) return c.json({error: 'Unauthorized'}, 401);
    const resumeId = c.req.param('id');
    const type = c.req.query('type') || 'global';
    
    try {
      const profile = await c.env.DB.prepare('SELECT * FROM candidate_profile WHERE user_id = ?').bind(user.id).first();
      const ctx = await c.env.DB.prepare('SELECT * FROM candidate_context WHERE resume_id = ? AND user_id = ?').bind(resumeId, user.id).first();
      
      if (!ctx || !profile) return c.json({error: 'Not found'}, 404);
      
      let parsedData: any = {};
      try {
        parsedData = JSON.parse(ctx.context_data_json as string);
      } catch (e) {}

      // Basic Document Generation
      const doc = new Document({
        sections: [{
          properties: {},
          children: [
            new Paragraph({
              text: (profile.full_name || 'Candidate Name') as string,
              heading: HeadingLevel.HEADING_1,
            }),
            new Paragraph({
              text: (profile.target_role || 'Professional') as string,
              heading: HeadingLevel.HEADING_2,
            }),
            new Paragraph({
              text: "Professional Summary",
              heading: HeadingLevel.HEADING_3,
            }),
            new Paragraph({
              text: (profile.bio || 'Experienced professional with verified competencies.') as string,
            }),
            new Paragraph({
              text: "Skills",
              heading: HeadingLevel.HEADING_3,
            }),
            new Paragraph({
              text: (parsedData.skills || []).join(', '),
            }),
            new Paragraph({
              text: "Experience",
              heading: HeadingLevel.HEADING_3,
            }),
            ...(parsedData.experience || []).map((exp: any) => 
              new Paragraph({
                children: [
                  new TextRun({ text: \`\${exp.title} at \${exp.company}\`, bold: true }),
                  new TextRun({ text: \`\\n\${exp.duration}\`, italics: true }),
                  new TextRun({ text: \`\\n\${exp.description || ''}\` })
                ]
              })
            )
          ],
        }],
      });

      const buffer = await Packer.toBuffer(doc);
      
      c.header('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
      c.header('Content-Disposition', \`attachment; filename="ATS_Resume_\${type}.docx"\`);
      
      return new Response(buffer, {
        headers: c.res.headers
      });
      
    } catch (e: any) {
      return c.json({error: e.message}, 500);
    }
  });
`;

if (!code.includes("app.get('/resume/:id/export'")) {
    const optimizeMarker = "app.post('/resume/:id/optimize', async (c) => {";
    // Find the end of this block
    let markerIndex = code.indexOf(optimizeMarker);
    if (markerIndex !== -1) {
       // We'll just do a regex replace to insert after the end of this route.
       // It's safer to just place it right before the candidate/context route which is right after
       const candidateContextMarker = "app.get('/candidate/context'";
       code = code.replace(candidateContextMarker, newRoute + "\n  " + candidateContextMarker);
       fs.writeFileSync(filePath, code, 'utf-8');
       console.log("Export route added successfully!");
    } else {
       console.log("Could not find insertion marker.");
    }
} else {
    console.log("Export route already exists.");
}
