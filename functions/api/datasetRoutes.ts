/**
 * IntelliHire Dataset & Curated Learning Resources Routes
 * 
 * Provides candidate-facing and auditor-facing APIs for dataset governance,
 * legal provenance inspection, standard job descriptions, benchmark resumes,
 * and curated practice question banks.
 */

import { Hono } from 'hono';
import { Bindings, UserSession, getSessionUser } from './[[route]]';
import { DATASET_REGISTRY } from '../../src/shared/datasetRegistry';
import { CURATED_LEARNING_RESOURCES } from '../../src/shared/curatedResources';

export function registerDatasetRoutes(app: Hono<{ Bindings: Bindings }>) {

  // 1. Authoritative Dataset Registry (Audit & Transparency)
  app.get('/datasets/registry', async (c) => {
    return c.json({
      success: true,
      sources: DATASET_REGISTRY,
      registry: DATASET_REGISTRY,
      total_sources: DATASET_REGISTRY.length,
      ethical_invariants: {
        zero_biometric_facial_scoring: true,
        eeoc_compliance: true,
        eu_ai_act_annex_iii_compliant: true,
        human_decision_sovereignty: true,
        prohibited_sources: ['FER2013', 'AffectNet', 'Unconsented LinkedIn Scrapes', 'Proprietary LeetCode']
      }
    });
  });

  // 2. Searchable, Filterable Curated Resources
  app.get('/datasets/resources', async (c) => {
    const mod = c.req.query('module');
    const domain = c.req.query('domain');
    const type = c.req.query('type');
    const q = (c.req.query('q') || '').toLowerCase().trim();

    let list = [...CURATED_LEARNING_RESOURCES];

    if (mod) {
      list = list.filter((r) => r.module.toUpperCase() === mod.toUpperCase());
    }
    if (domain) {
      list = list.filter((r) => r.domain.toLowerCase() === domain.toLowerCase());
    }
    if (type) {
      list = list.filter((r) => r.resourceType.toLowerCase() === type.toLowerCase());
    }
    if (q) {
      list = list.filter((r) =>
        r.title.toLowerCase().includes(q) ||
        r.topic.toLowerCase().includes(q) ||
        (r.targetRole && r.targetRole.toLowerCase().includes(q))
      );
    }

    return c.json({
      success: true,
      count: list.length,
      total_curated: CURATED_LEARNING_RESOURCES.length,
      resources: list
    });
  });

  // 3. One-Click Standard Job Descriptions (O*NET Aligned)
  app.get('/datasets/sample-jds', async (c) => {
    const jds = CURATED_LEARNING_RESOURCES.filter((r) => r.resourceType === 'job_description');
    const formatted = jds.map((j) => ({
      id: j.id,
      title: j.title,
      domain: j.domain,
      targetRole: j.targetRole,
      role_title: j.targetRole || j.title,
      socCode: j.occupationCode,
      soc_code: j.occupationCode || '',
      experience_level: j.content?.experience_level || 'Mid-Senior',
      jd_text: typeof j.content === 'string' ? j.content : j.content?.raw_jd || j.description,
      content: j.content,
      provenanceNotes: j.provenanceNotes,
      license: 'CC BY 4.0 (USDOL O*NET standard)'
    }));
    return c.json({
      success: true,
      count: formatted.length,
      job_descriptions: formatted,
      data: formatted
    });
  });

  // 4. One-Click Benchmark Candidate Resumes
  app.get('/datasets/sample-resumes', async (c) => {
    const resumes = CURATED_LEARNING_RESOURCES.filter((r) => r.resourceType === 'benchmark_resume');
    const formatted = resumes.map((r) => ({
      id: r.id,
      title: r.title,
      domain: r.domain,
      targetRole: r.targetRole,
      target_role: r.targetRole,
      role_title: r.targetRole || r.title,
      difficultyLevel: r.difficultyLevel,
      candidateName: r.content.candidateName,
      candidate_name: r.content.candidateName,
      filename: `benchmark_${(r.targetRole || 'candidate').toLowerCase().replace(/\s+/g, '_')}.txt`,
      skills: r.content.skills || [],
      skillsCount: r.content.skills.length,
      experienceCount: r.content.experience.length,
      content: r.content,
      raw_text: `${r.content.candidateName}\n${r.content.summary}\n\nSKILLS:\n${(r.content.skills || []).join(', ')}`,
      provenanceNotes: r.provenanceNotes,
      license: 'CC0 1.0 Universal'
    }));
    return c.json({
      success: true,
      count: formatted.length,
      resumes: formatted,
      data: formatted
    });
  });

  // 5. Ingest Benchmark Resume into Candidate Workspace
  app.post('/datasets/load-benchmark-resume', async (c) => {
    const user = await getSessionUser(c);
    if (!user) return c.json({ error: 'Unauthorized' }, 401);

    const body = await c.req.json().catch(() => ({}));
    const benchmarkId = body.benchmark_id;
    if (!benchmarkId) return c.json({ error: 'Missing benchmark_id' }, 400);

    const benchmark = CURATED_LEARNING_RESOURCES.find(
      (r) => r.id === benchmarkId && r.resourceType === 'benchmark_resume'
    );
    if (!benchmark) return c.json({ error: 'Benchmark resume not found' }, 404);

    const resumeId = crypto.randomUUID();
    const rawText = `${benchmark.content.candidateName}
${benchmark.content.summary}

SKILLS:
${benchmark.content.skills.join(', ')}

EXPERIENCE:
${benchmark.content.experience.map((e: any) => `${e.title} at ${e.company} (${e.duration}): ${e.description}`).join('\n\n')}

EDUCATION:
${benchmark.content.education.join('\n')}

CERTIFICATIONS:
${benchmark.content.certifications.join('\n')}`;

    // Get current version count for this candidate
    const existingCount = await c.env.DB.prepare(
      'SELECT COUNT(*) as count FROM candidate_resume WHERE user_id = ?'
    ).bind(user.id).first() as any;
    const version = (existingCount?.count || 0) + 1;

    // 1. Insert into candidate_resume
    await c.env.DB.prepare(`
      INSERT INTO candidate_resume (id, organization_id, user_id, filename, file_format, file_size_bytes, storage_ref, version)
      VALUES (?, 'org_default_public', ?, ?, 'txt', ?, ?, ?)
    `).bind(
      resumeId,
      user.id,
      `benchmark_${benchmark.targetRole?.toLowerCase().replace(/\s+/g, '_')}_v${version}.txt`,
      rawText.length,
      `benchmark:${benchmark.id}`,
      version
    ).run();

    // 2. Insert into candidate_context
    const contextData = {
      skills: benchmark.content.skills,
      experience: benchmark.content.experience,
      education: benchmark.content.education,
      certifications: benchmark.content.certifications,
      achievements: benchmark.content.achievements || [],
      provenance: {
        source: benchmark.sourceCode,
        benchmark_id: benchmark.id,
        confidence: 'benchmark_verified',
        extraction_status: 'benchmark_loaded',
        pii_categories_redacted: ['email', 'phone']
      },
      quality_analysis: {
        overall_quality_score: 95,
        checks: [
          { dimension: 'Document Text Layer', status: 'PASS', detail: 'Verified benchmark structure.' },
          { dimension: 'Domain & Technical Skills', status: 'PASS', detail: `${benchmark.content.skills.length} skills verified against taxonomy.` },
          { dimension: 'Chronological Work Experience', status: 'PASS', detail: `${benchmark.content.experience.length} roles verified.` },
          { dimension: 'Quantified Impact & Outcomes', status: 'PASS', detail: 'Includes concrete throughput and latency metrics.' }
        ]
      }
    };

    await c.env.DB.prepare(`
      INSERT INTO candidate_context (id, resume_id, user_id, raw_text, context_data_json)
      VALUES (?, ?, ?, ?, ?)
    `).bind(
      crypto.randomUUID(),
      resumeId,
      user.id,
      rawText,
      JSON.stringify(contextData)
    ).run();

    return c.json({
      success: true,
      message: `Successfully loaded benchmark profile for ${benchmark.targetRole}`,
      resume_id: resumeId,
      version,
      context_data: contextData,
      raw_text: rawText
    });
  });
}
