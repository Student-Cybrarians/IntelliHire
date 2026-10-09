/**
 * M03 Dynamic Cross-Occupation Task Generation & Synthesis Engine
 *
 * Coordinates dynamic task generation across technical, financial, operational,
 * legal, compliance, and research disciplines. Integrates with Python task intelligence,
 * NVIDIA model routing, structured schema validation, and tenant persistence.
 */

import {
  SimulationDefinitionConfig,
  TaskDefinition,
  CompetencyTarget,
  CandidateContext,
  JobContext,
  RoleContext,
  WorkSurfaceType,
  SeniorityLevel,
  TaskRoutingResult,
  TaskRoutingInfo,
  validateSimulationDefinitionConfig,
  validateUniversalTaskDefinition,
  scaleTaskToCandidateSeniority,
  normalizeSeniorityLevel,
  calculateTaskRepetitionFingerprint,
  sanitizeContextForTaskTargeting,
  seedSimulationToTaskDefinition
} from '../../src/shared/m3WorkRoundContracts';
import { SEED_SIMULATIONS, ensureDefinitionInDb } from './simulationEngine';
import { invokeNvidiaChat, checkSafetyGuardrail } from './nvidiaModelRegistry';

export interface TaskSynthesisContextBundle {
  candidateContext?: CandidateContext;
  jobContext?: JobContext;
  roleContext?: RoleContext;
  targets: CompetencyTarget[];
  primaryTarget?: CompetencyTarget;
}

export interface TaskSynthesisOptions {
  forceRegenerate?: boolean;
  requestedSeniority?: string;
  requestedModality?: WorkSurfaceType;
  pastDefinitionIds?: string[];
}

export interface TaskRoutingPolicyResult {
  routingResult: TaskRoutingResult;
  routingReason: string;
  task: TaskDefinition;
  definition: SimulationDefinitionConfig;
  isValid: boolean;
  routingInfo: TaskRoutingInfo;
}

// -----------------------------------------------------------------------------
// Cross-Occupational Archetype Template Library (Deterministic Local Synthesis)
// -----------------------------------------------------------------------------

interface ArchetypeTemplate {
  id: string;
  title: string;
  domain: string;
  target_role: string;
  occupation_code?: string;
  simulation_type: string;
  work_surface_type: WorkSurfaceType;
  task_form: string;
  task_family: string;
  competency_name: string;
  skill_name: string;
  scenario: {
    background: string;
    objective: string;
    initial_requirements: string[];
    constraints: string[];
    tools_available: string[];
    expected_output_type: string;
  };
  rubric: {
    dimensions: Array<{
      name: string;
      weight: number;
      description: string;
      criteria: string;
    }>;
  };
}

const CROSS_OCCUPATION_ARCHETYPES: ArchetypeTemplate[] = [
  // 1. Cybersecurity & Incident Containment (Technical)
  {
    id: 'arch-sec-incident-containment',
    title: 'Zero-Day API Authentication Bypass & Incident Containment',
    domain: 'cybersecurity',
    target_role: 'Security Operations Engineer',
    occupation_code: '15-1212.00',
    simulation_type: 'coding',
    work_surface_type: 'code_editor',
    task_form: 'debugging',
    task_family: 'cybersecurity',
    competency_name: 'Threat Detection & Incident Response',
    skill_name: 'Security Incident Containment',
    scenario: {
      background: 'Security telemetry detects an abnormal spike in privileged access tokens issued without valid signature validation against the OIDC identity provider.',
      objective: 'Analyze the authentication middleware, identify the JWT signature verification bypass, and implement an atomic cryptographic patch with revocation logging.',
      initial_requirements: [
        'Isolate the compromised JWT token validation code path',
        'Implement strict cryptographic public-key pinning and algorithm enforcement (reject none/HS256 confusion)',
        'Generate structured incident response containment steps and SIEM alert rules'
      ],
      constraints: [
        'Must not break existing active sessions using valid RS256 signatures',
        'Verification latency must remain below 10ms per request'
      ],
      tools_available: ['Security Audit Workbench', 'Cryptographic Token Inspector'],
      expected_output_type: 'secure_middleware_patch_and_incident_report'
    },
    rubric: {
      dimensions: [
        { name: 'vulnerability_mitigation', weight: 0.40, description: 'Cryptographic fix accuracy', criteria: 'Completely eliminates algorithm substitution and validates public keys.' },
        { name: 'operational_containment', weight: 0.35, description: 'Blast radius containment', criteria: 'Provides actionable token revocation rules without global service outage.' },
        { name: 'security_auditing', weight: 0.25, description: 'Audit trail clarity', criteria: 'Produces complete forensic logging schema for SOC ingestion.' }
      ]
    }
  },

  // 2. Financial Analysis & M&A Due Diligence (Finance)
  {
    id: 'arch-fin-ma-due-diligence',
    title: 'M&A Valuation & Debt Covenant Stress Testing',
    domain: 'finance',
    target_role: 'Senior Financial Analyst',
    occupation_code: '13-2051.00',
    simulation_type: 'financial_analysis',
    work_surface_type: 'financial_table',
    task_form: 'quantitative_calculation',
    task_family: 'financial_modeling',
    competency_name: 'Financial Modeling & Valuation',
    skill_name: 'Capital Budgeting & Valuation',
    scenario: {
      background: 'The corporate development committee is evaluating a $45M enterprise SaaS acquisition. Rising floating debt rates threaten existing debt-to-EBITDA covenants.',
      objective: 'Build a multi-scenario DCF and debt amortization model evaluating leverage covenants under base and stressed interest rate scenarios.',
      initial_requirements: [
        'Forecast 5-year Free Cash Flows to Firm (FCFF) under 8%, 15%, and 25% churn sensitivities',
        'Calculate debt service coverage ratio (DSCR) and maximum leverage ratio compliance',
        'Draft a strategic board memo advising whether to approve, restructure, or reject the acquisition'
      ],
      constraints: [
        'Maximum allowable leverage covenant: 3.5x Senior Debt / EBITDA',
        'Terminal growth rate assumption capped at 3.0%'
      ],
      tools_available: ['DCF Financial Model Workspace', 'Sensitivity Table Builder'],
      expected_output_type: 'financial_model_memo'
    },
    rubric: {
      dimensions: [
        { name: 'mathematical_precision', weight: 0.35, description: 'DCF & DSCR accuracy', criteria: 'Flawless cash flow discounting and debt amortization calculations.' },
        { name: 'risk_sensitivity', weight: 0.35, description: 'Covenant stress testing', criteria: 'Accurately quantifies breach thresholds under stressed churn and rate conditions.' },
        { name: 'executive_recommendation', weight: 0.30, description: 'Board memo decisiveness', criteria: 'Clear, defensible transaction guidance with downside mitigations.' }
      ]
    }
  },

  // 3. Clinical & Operations Resource Triage (Healthcare Operations)
  {
    id: 'arch-ops-clinical-triage',
    title: 'Hospital Emergency Capacity & Multi-Casualty Resource Triage',
    domain: 'operations',
    target_role: 'Healthcare Operations Director',
    occupation_code: '11-9111.00',
    simulation_type: 'operational_triage',
    work_surface_type: 'operations_decision',
    task_form: 'scenario',
    task_family: 'operations_management',
    competency_name: 'Crisis Operations & Acuity Triage',
    skill_name: 'Resource Optimization',
    scenario: {
      background: 'Metro Regional Hospital receives notification of an industrial chemical release resulting in 22 incoming acute respiratory patients while ICU occupancy is at 96%.',
      objective: 'Execute emergency surge allocation protocols across float nurse pools, ventilators, and isolation telemetry beds without compromising existing critical patients.',
      initial_requirements: [
        'Sort incoming patient cohort by Emergency Severity Index (ESI Levels 1-5)',
        'Reallocate certified ICU/ER float staff adhering to statutory nurse-to-patient safety ratios',
        'Identify stable post-surgical patients eligible for transfer to step-down units to free ICU beds'
      ],
      constraints: [
        'Mandatory nurse-to-patient ratio: ICU 1:2, Trauma 1:1, Med-Surg 1:4',
        'Zero patient left unmonitored in triage intake longer than 10 minutes'
      ],
      tools_available: ['Triage Census Board', 'Staff Competency Matrix'],
      expected_output_type: 'triage_allocation_plan'
    },
    rubric: {
      dimensions: [
        { name: 'patient_safety', weight: 0.40, description: 'Clinical safety ratio compliance', criteria: 'Strict adherence to statutory ratios without unattended critical patients.' },
        { name: 'acuity_prioritization', weight: 0.35, description: 'ESI triage precision', criteria: 'Accurately prioritizes high-acuity respiratory patients over non-emergent cases.' },
        { name: 'resource_efficiency', weight: 0.25, description: 'Surge protocol execution', criteria: 'Maximizes throughput and bed turnover under severe resource constraints.' }
      ]
    }
  },

  // 4. Legal Compliance & Vendor Procurement (Legal / Procurement)
  {
    id: 'arch-legal-vendor-procurement',
    title: 'Enterprise AI Vendor Contracting & Data Sovereignty Review',
    domain: 'legal',
    target_role: 'Commercial Legal Counsel',
    occupation_code: '23-1011.00',
    simulation_type: 'written_response',
    work_surface_type: 'legal_memo',
    task_form: 'written_response',
    task_family: 'legal_compliance',
    competency_name: 'Commercial Contracts & Regulatory Compliance',
    skill_name: 'Vendor Negotiation & Regulatory Compliance',
    scenario: {
      background: 'An enterprise bank is procuring a generative AI customer support platform. The vendor contract contains unilateral training rights and foreign sub-processor clauses.',
      objective: 'Review the master services agreement (MSA) and data processing addendum (DPA), formulating required redlines protecting IP, customer data privacy, and regulatory liability.',
      initial_requirements: [
        'Identify GDPR Article 28, EU AI Act, and GLBA compliance gaps in vendor terms',
        'Draft redlines eliminating vendor rights to train foundational models on proprietary customer prompts',
        'Formulate mutual indemnification language for third-party copyright and privacy infringement'
      ],
      constraints: [
        'Vendor liability cap must be negotiated to at least 3x annual contract value or uncapped for data breaches',
        'Customer data must remain encrypted at rest in local sovereign geographic jurisdictions'
      ],
      tools_available: ['Contract Redlining Studio', 'Regulatory Risk Checklist'],
      expected_output_type: 'legal_redline_and_counsel_memo'
    },
    rubric: {
      dimensions: [
        { name: 'regulatory_compliance', weight: 0.40, description: 'Privacy & AI Act compliance', criteria: 'Identifies all cross-border data transfer and model training risks.' },
        { name: 'contractual_protection', weight: 0.35, description: 'Redline negotiation quality', criteria: 'Secures robust IP indemnification and enforceable liability covenants.' },
        { name: 'commercial_clarity', weight: 0.25, description: 'Counsel memo clarity', criteria: 'Actionable executive legal brief with clear risk-weighted recommendations.' }
      ]
    }
  },

  // 5. Research, Education & Data Science (Research / Science)
  {
    id: 'arch-res-clinical-trial-protocol',
    title: 'Adaptive Clinical Trial Statistical Power & Sample Sizing',
    domain: 'research',
    target_role: 'Biostatistician & Clinical Researcher',
    occupation_code: '15-2041.00',
    simulation_type: 'data_analysis',
    work_surface_type: 'research_analysis',
    task_form: 'analysis',
    task_family: 'data_analysis',
    competency_name: 'Statistical Methodology & Study Design',
    skill_name: 'Research Methodology & Statistical Analysis',
    scenario: {
      background: 'A Phase II adaptive clinical trial for an oncology biomarker exhibits higher than anticipated interim dropouts and variance in primary endpoint biomarker assays.',
      objective: 'Evaluate statistical power, adjust sample size calculations using Lan-DeMets alpha spending functions, and draft an interim study protocol revision.',
      initial_requirements: [
        'Calculate required sample size to maintain 85% statistical power at two-sided alpha = 0.05',
        'Model interim stopping boundaries for early efficacy versus futility',
        'Draft protocol adjustment justifying sample size re-estimation to the Institutional Review Board'
      ],
      constraints: [
        'Total patient enrollment cannot exceed budget ceiling of 350 participants',
        'False discovery rate must remain bounded below 0.05 across interim looks'
      ],
      tools_available: ['Statistical Analysis Suite', 'Protocol Drafting Workspace'],
      expected_output_type: 'statistical_design_and_irb_memo'
    },
    rubric: {
      dimensions: [
        { name: 'statistical_rigor', weight: 0.40, description: 'Power and sample calculation', criteria: 'Accurate alpha-spending and power estimations preventing Type I error inflation.' },
        { name: 'study_feasibility', weight: 0.35, description: 'Adaptive boundary design', criteria: 'Defensible futility boundaries balancing participant safety and clinical budget.' },
        { name: 'methodological_clarity', weight: 0.25, description: 'IRB protocol justification', criteria: 'Clear, transparent explanation of biomarker variance and design adjustments.' }
      ]
    }
  }
];

// -----------------------------------------------------------------------------
// Modality & Surface Resolver
// -----------------------------------------------------------------------------

export function resolveWorkSurfaceForDomainAndRole(
  domain?: string,
  roleTitle?: string,
  requestedModality?: WorkSurfaceType
): WorkSurfaceType {
  if (requestedModality) return requestedModality;

  const d = (domain || '').toLowerCase().trim();
  const r = (roleTitle || '').toLowerCase().trim();

  if (d.includes('engineering') || d.includes('hardware') || d.includes('aerospace') || d.includes('mechanical') || r.includes('mechanical') || r.includes('hardware') || r.includes('aerospace') || r.includes('civil')) {
    return 'engineering_calc';
  }
  if (d.includes('sql') || d.includes('database') || r.includes('dba') || r.includes('database')) {
    return 'sql_query';
  }
  if (d.includes('data') || d.includes('analytics') || d.includes('biostat') || r.includes('data scientist')) {
    return 'data_analysis';
  }
  if (d.includes('finance') || d.includes('accounting') || d.includes('investment') || r.includes('financial') || r.includes('accountant')) {
    return 'financial_table';
  }
  if (d.includes('operations') || d.includes('health') || d.includes('hospital') || d.includes('triage') || r.includes('operations') || r.includes('nurse')) {
    return 'operations_decision';
  }
  if (d.includes('legal') || d.includes('compliance') || d.includes('regulatory') || r.includes('counsel') || r.includes('attorney')) {
    return 'legal_memo';
  }
  if (d.includes('research') || d.includes('science') || d.includes('clinical') || r.includes('researcher')) {
    return 'research_analysis';
  }
  if (d.includes('marketing') || d.includes('writing') || d.includes('hr') || r.includes('manager') || r.includes('director')) {
    return 'document_writing';
  }
  if (d.includes('software') || d.includes('code') || d.includes('dev') || r.includes('developer') || r.includes('programmer') || (r.includes('engineer') && (d.includes('software') || !d))) {
    return 'code_editor';
  }

  return 'structured_response';
}

// -----------------------------------------------------------------------------
// Core Dynamic Task Synthesis Engine
// -----------------------------------------------------------------------------

export class DynamicTaskSynthesizer {

  /**
   * Evaluates task routing policy:
   * 1. Inspects available seed simulations.
   * 2. If a relevant unattempted seed matches domain AND skill, returns 'seed_match'.
   * 3. When no seed matches, dynamically synthesizes a validated task ('generated').
   * 4. If generation fails or is unavailable, returns controlled 'fallback'.
   */
  static async routeAndDeliverTask(
    env: any,
    contextBundle: TaskSynthesisContextBundle,
    options: TaskSynthesisOptions = {}
  ): Promise<TaskRoutingPolicyResult> {
    const pastIds = options.pastDefinitionIds || [];
    const targets = contextBundle.targets || [];
    const candSeniority = options.requestedSeniority || contextBundle.candidateContext?.seniorityLevel || 'mid';
    const targetRole = contextBundle.candidateContext?.targetRole || contextBundle.jobContext?.jobTitle || 'Professional';
    const candDomain = (contextBundle.roleContext?.domain || contextBundle.candidateContext?.targetDomainId || 'software').toLowerCase();

    // 1. Attempt Genuine Seed Matching
    let matchedSeed: any = null;
    let matchedTarget: CompetencyTarget | null = null;

    for (const target of targets) {
      const targetSkill = (target.skillName || '').toLowerCase().trim();
      const targetComp = (target.name || '').toLowerCase().trim();
      const targetDomain = (target.domain || candDomain).toLowerCase().trim();

      // Find candidate seed with genuine domain AND competency/skill alignment
      const candidates = SEED_SIMULATIONS.filter(sim => {
        const simSkill = sim.skill_name.toLowerCase();
        const simComp = sim.competency_name.toLowerCase();
        const simDomain = sim.domain.toLowerCase();

        // Must match domain or have close domain overlap
        const domainMatches = simDomain === targetDomain || simDomain.includes(targetDomain) || targetDomain.includes(simDomain);
        if (!domainMatches) return false;

        // Must match skill or competency
        return simSkill === targetSkill ||
               simComp === targetComp ||
               simSkill.includes(targetSkill) ||
               targetSkill.includes(simSkill) ||
               simComp.includes(targetComp) ||
               targetComp.includes(simComp);
      });

      const unattempted = candidates.find(s => !pastIds.includes(s.id));
      if (unattempted) {
        matchedSeed = unattempted;
        matchedTarget = target;
        break;
      }
    }

    // If genuine seed match found, return seed_match
    if (matchedSeed && matchedTarget) {
      const baseTask = seedSimulationToTaskDefinition(matchedSeed, pastIds.length + 1);
      baseTask.competencyTarget = matchedTarget;
      const scaledTask = scaleTaskToCandidateSeniority(baseTask, candSeniority);
      const isValid = validateUniversalTaskDefinition(scaledTask);

      const routingInfo: TaskRoutingInfo = {
        routingResult: 'seed_match',
        routingReason: `Matched pre-verified catalog seed for ${matchedSeed.skill_name} in domain ${matchedSeed.domain}`,
        matchedSeedId: matchedSeed.id,
        provenance: {
          source: 'seed_catalog',
          generatorMethod: 'catalog_seed',
          timestamp: new Date().toISOString(),
          organizationId: contextBundle.candidateContext?.organizationId || 'org_default_public',
          version: 1
        }
      };
      scaledTask.routingInfo = routingInfo;

      return {
        routingResult: 'seed_match',
        routingReason: routingInfo.routingReason,
        task: scaledTask,
        definition: matchedSeed as SimulationDefinitionConfig,
        isValid,
        routingInfo
      };
    }

    // 2. No Genuine Seed Match: Invoke Dynamic Cross-Occupation Task Generation
    const primaryTarget = matchedTarget || targets[0] || {
      id: 'target-gen-default',
      name: `${targetRole} Core Competency`,
      domain: candDomain,
      skillName: `${targetRole} Execution`,
      targetProficiency: 0.80,
      currentProficiency: 0.50,
      uncertaintyEstimate: 0.40,
      diagnosisSource: 'job_requirement',
      rationale: `Targeted dynamic simulation for ${targetRole}`
    };

    try {
      const genResult = await this.synthesizeDynamicSimulation(env, {
        candidateContext: contextBundle.candidateContext,
        jobContext: contextBundle.jobContext,
        roleContext: contextBundle.roleContext,
        targetCompetency: primaryTarget,
        organizationId: contextBundle.candidateContext?.organizationId || 'org_default_public',
        seniority: candSeniority,
        previousTasks: pastIds.map(id => ({ id, title: id })),
        forceRegenerate: options.forceRegenerate
      });

      if (genResult.definition && genResult.task && genResult.isValid) {
        // Automatically persist dynamically generated definition into D1 for tenant reuse
        if (env.DB) {
          await ensureDefinitionInDb(env.DB, genResult.definition, genResult.definition.organization_id || 'org_default_public');
        }

        return {
          routingResult: 'generated',
          routingReason: genResult.routingReason,
          task: genResult.task,
          definition: genResult.definition,
          isValid: true,
          routingInfo: genResult.task.routingInfo!
        };
      }
    } catch (genError: any) {
      console.warn('Dynamic task synthesis error; initiating controlled fallback:', genError?.message);
    }

    // 3. Fallback: Controlled Relevant Catalog Fallback (Clearly Labeled, Never Misrepresented)
    const fallbackSeed = SEED_SIMULATIONS.find(s => !pastIds.includes(s.id)) || SEED_SIMULATIONS[0];
    const fallbackBase = seedSimulationToTaskDefinition(fallbackSeed, pastIds.length + 1);
    fallbackBase.competencyTarget = primaryTarget;
    const fallbackTask = scaleTaskToCandidateSeniority(fallbackBase, candSeniority);
    const isFallbackValid = validateUniversalTaskDefinition(fallbackTask);

    const fallbackRoutingInfo: TaskRoutingInfo = {
      routingResult: 'fallback',
      routingReason: `No seed matched novel domain '${candDomain}' and dynamic generation encountered an issue; using controlled fallback seed '${fallbackSeed.title}'.`,
      matchedSeedId: fallbackSeed.id,
      provenance: {
        source: 'fallback_engine',
        generatorMethod: 'catalog_seed',
        timestamp: new Date().toISOString(),
        organizationId: contextBundle.candidateContext?.organizationId || 'org_default_public',
        version: 1
      }
    };
    fallbackTask.routingInfo = fallbackRoutingInfo;

    return {
      routingResult: 'fallback',
      routingReason: fallbackRoutingInfo.routingReason,
      task: fallbackTask,
      definition: fallbackSeed as SimulationDefinitionConfig,
      isValid: isFallbackValid,
      routingInfo: fallbackRoutingInfo
    };
  }

  /**
   * Synthesizes a new simulation definition and task dynamically.
   * Applies safety guardrails, provider dispatch, archetype fallbacks,
   * contract validation, and persistence preparation.
   */
  static async synthesizeDynamicSimulation(
    env: any,
    params: {
      candidateContext?: CandidateContext;
      jobContext?: JobContext;
      roleContext?: RoleContext;
      targetCompetency: CompetencyTarget;
      organizationId: string;
      seniority?: string;
      previousTasks?: Array<{ id: string; title: string }>;
      forceRegenerate?: boolean;
    }
  ): Promise<{ definition: SimulationDefinitionConfig; task: TaskDefinition; isValid: boolean; routingReason: string }> {
    const targetComp = params.targetCompetency;
    const targetRole = params.candidateContext?.targetRole || params.jobContext?.jobTitle || 'Domain Professional';
    const domain = (targetComp.domain || params.roleContext?.domain || params.candidateContext?.targetDomainId || 'software').toLowerCase();
    const skillName = targetComp.skillName || targetComp.name || 'Domain Execution';
    const compName = targetComp.name || `${targetRole} Competency`;
    const seniority = normalizeSeniorityLevel(params.seniority || params.candidateContext?.seniorityLevel || 'mid');
    const workSurface = resolveWorkSurfaceForDomainAndRole(domain, targetRole);

    // 1. Safety Guardrail & Prompt Injection Defense
    const contextText = `${targetRole} ${domain} ${skillName} ${compName}`;
    const safetyCheck = await checkSafetyGuardrail(env?.NVIDIA_API_KEY, contextText, 'task_generation');
    if (!safetyCheck.safe) {
      throw new Error(`Task generation rejected by safety guardrail: ${safetyCheck.reason}`);
    }

    // 2. Multi-Tier Generation Pipeline:
    // Tier A: Remote Python Task Intelligence Worker (if configured)
    // Tier B: NVIDIA Model Dispatch (if API key available)
    // Tier C: Parameterized Cross-Occupational Archetype Synthesizer (deterministic local engine)
    let rawGeneratedConfig: any = null;
    let modelUsed = 'deterministic_archetype_synthesizer';

    // Tier A: Check Remote Python Service
    if (env?.TASK_SYNTHESIS_SERVICE_URL) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 8000);
        const pyRes = await fetch(`${env.TASK_SYNTHESIS_SERVICE_URL}/synthesize`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            targetRole,
            domain,
            skillName,
            competencyName: compName,
            seniority,
            workSurface,
            organizationId: params.organizationId
          }),
          signal: controller.signal
        });
        clearTimeout(timeoutId);

        if (pyRes.ok) {
          const pyData = await pyRes.json() as any;
          if (pyData?.definition) {
            rawGeneratedConfig = pyData.definition;
            modelUsed = 'python_task_synthesizer_worker';
          }
        }
      } catch (_) {
        // Fall through to Tier B
      }
    }

    // Tier B: NVIDIA LLM Dispatch (if Tier A was not used/failed and API key or AI binding present)
    if (!rawGeneratedConfig && (env?.NVIDIA_API_KEY || env?.AI)) {
      try {
        const systemPrompt = `You are the IntelliHire M03 Universal Simulation Task Synthesizer.
Generate a professional, realistic work simulation task tailored for the candidate.
Output ONLY valid JSON adhering strictly to this schema:
{
  "title": string (3-150 chars),
  "scenario": {
    "background": string (at least 20 words describing business/technical context),
    "objective": string (actionable core goal),
    "initial_requirements": [string] (2-4 concrete requirements),
    "constraints": [string] (1-3 operational/technical constraints),
    "tools_available": [string],
    "expected_output_type": string
  },
  "rubric": {
    "dimensions": [
      { "name": string, "weight": number (weights must sum to 1.0), "description": string, "criteria": string }
    ]
  }
}
Do NOT include preamble, markdown wrappers, or explanation outside the JSON.`;

        const userPrompt = `Role: ${targetRole}
Domain: ${domain}
Target Skill: ${skillName}
Competency: ${compName}
Seniority Tier: ${seniority}
Work Surface Modality: ${workSurface}
Generate a realistic, rigorous simulation task for this role.`;

        const llmResult = await invokeNvidiaChat(env, {
          model: 'meta/muse-glimmer-30b',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt }
          ],
          temperature: 0.2,
          maxTokens: 2048
        });

        if (llmResult.content && !llmResult.fallbackApplied) {
          const cleanJson = llmResult.content.replace(/```json/g, '').replace(/```/g, '').trim();
          const parsed = JSON.parse(cleanJson);
          if (parsed?.scenario?.objective && parsed?.rubric?.dimensions) {
            rawGeneratedConfig = parsed;
            modelUsed = llmResult.modelUsed || 'meta/muse-glimmer-30b';
          }
        }
      } catch (_) {
        // Fall through to Tier C
      }
    }

    // Tier C: Parameterized Cross-Occupational Archetype Synthesizer (Guaranteed Safe Baseline)
    if (!rawGeneratedConfig) {
      rawGeneratedConfig = this.synthesizeFromArchetype({
        domain,
        targetRole,
        skillName,
        compName,
        seniority,
        workSurface
      });
      modelUsed = 'parameterized_archetype_engine_v3';
    }

    // 3. Assemble Full SimulationDefinitionConfig
    const defId = `sim-dyn-${crypto.randomUUID().slice(0, 12)}`;
    const fullConfigPayload = {
      id: defId,
      organization_id: params.organizationId,
      title: rawGeneratedConfig.title || `${skillName} Simulation (${seniority.toUpperCase()})`,
      target_role: targetRole,
      domain: domain,
      simulation_type: rawGeneratedConfig.simulation_type || workSurface,
      work_surface_type: workSurface,
      seniority_level: seniority,
      competency_name: compName,
      skill_name: skillName,
      difficulty_level: seniority === 'entry' ? 2 : (seniority === 'senior' || seniority === 'lead' ? 4 : 3),
      scenario: {
        background: rawGeneratedConfig.scenario?.background || `Enterprise work round calibrated for ${targetRole}.`,
        objective: rawGeneratedConfig.scenario?.objective || `Execute core ${skillName} deliverable.`,
        initial_requirements: rawGeneratedConfig.scenario?.initial_requirements || [
          `Satisfy all ${skillName} specifications`,
          `Document execution trade-offs and assumptions`
        ],
        constraints: rawGeneratedConfig.scenario?.constraints || [
          `Complete deliverable within time envelope`,
          `Adhere to organizational safety standards`
        ],
        tools_available: rawGeneratedConfig.scenario?.tools_available || ['Domain Workspace'],
        expected_output_type: rawGeneratedConfig.scenario?.expected_output_type || 'work_product'
      },
      rubric: {
        dimensions: (rawGeneratedConfig.rubric?.dimensions || []).map((d: any) => ({
          name: d.name || 'core_execution',
          weight: Number(d.weight) || 0.5,
          description: d.description || d.criteria || 'Accurate execution',
          criteria: d.criteria || d.description || 'Meets standard'
        }))
      },
      metadata: {
        generated: true,
        generator_model: modelUsed,
        generation_timestamp: new Date().toISOString(),
        target_competency_id: targetComp.id
      },
      version: 1,
      is_active: 1
    };

    // Normalize rubric weights if they don't sum to 1.0
    if (fullConfigPayload.rubric.dimensions.length === 0) {
      fullConfigPayload.rubric.dimensions = [
        { name: 'correctness', weight: 0.50, description: 'Accuracy', criteria: 'Meets objective' },
        { name: 'decision_quality', weight: 0.50, description: 'Quality', criteria: 'Sound methodology' }
      ];
    } else {
      const sum = fullConfigPayload.rubric.dimensions.reduce((acc, d) => acc + d.weight, 0);
      if (sum > 0 && (sum < 0.85 || sum > 1.15)) {
        fullConfigPayload.rubric.dimensions = fullConfigPayload.rubric.dimensions.map(d => ({
          ...d,
          weight: Number((d.weight / sum).toFixed(2))
        }));
      }
    }

    // 4. Contract Boundary Validation
    const validation = validateSimulationDefinitionConfig(fullConfigPayload);
    if (!validation.valid || !validation.validated) {
      throw new Error(`Synthesized task failed contract validation: ${validation.errors.join('; ')}`);
    }

    const validDefinition = validation.validated;

    // 5. Convert to Universal TaskDefinition with Core Model
    const baseTask = seedSimulationToTaskDefinition(validDefinition, (params.previousTasks?.length || 0) + 1);
    baseTask.competencyTarget = targetComp;
    const scaledTask = scaleTaskToCandidateSeniority(baseTask, seniority);
    scaledTask.repetitionFingerprint = calculateTaskRepetitionFingerprint(
      scaledTask.scenario.objective,
      scaledTask.scenario.background,
      skillName
    );

    const routingInfo: TaskRoutingInfo = {
      routingResult: 'generated',
      routingReason: `Dynamically synthesized validated simulation task for novel role '${targetRole}' in domain '${domain}' targeting '${skillName}' using ${modelUsed}.`,
      generatedModelUsed: modelUsed,
      provenance: {
        source: 'dynamic_synthesizer',
        generatorMethod: modelUsed === 'python_task_synthesizer_worker' ? 'python_service' : 'dynamic_synthesizer',
        timestamp: new Date().toISOString(),
        organizationId: params.organizationId,
        version: 1
      }
    };
    scaledTask.routingInfo = routingInfo;

    const isTaskValid = validateUniversalTaskDefinition(scaledTask);

    return {
      definition: validDefinition,
      task: scaledTask,
      isValid: isTaskValid,
      routingReason: routingInfo.routingReason
    };
  }

  /**
   * Generates a realistic domain-specific simulation from cross-occupational templates.
   */
  private static synthesizeFromArchetype(params: {
    domain: string;
    targetRole: string;
    skillName: string;
    compName: string;
    seniority: string;
    workSurface: WorkSurfaceType;
  }): any {
    const { domain, targetRole, skillName, compName, seniority, workSurface } = params;

    // Search for closest archetype match
    const match = CROSS_OCCUPATION_ARCHETYPES.find(a =>
      a.domain === domain ||
      a.work_surface_type === workSurface ||
      domain.includes(a.domain) ||
      a.domain.includes(domain)
    ) || CROSS_OCCUPATION_ARCHETYPES[0];

    // Parameterize with candidate's actual target role and competency
    return {
      title: `${targetRole}: ${skillName} (${seniority.toUpperCase()})`,
      simulation_type: match.simulation_type,
      work_surface_type: workSurface,
      scenario: {
        background: `In an active ${targetRole} operational setting, the organization requires rigorous execution of ${compName} focusing on ${skillName}.`,
        objective: `Design and deliver an actionable ${skillName} solution satisfying all operational and regulatory constraints for ${targetRole}.`,
        initial_requirements: [
          `Execute primary deliverable demonstrating sound ${skillName} methodology`,
          `Analyze key assumptions, risk factors, and performance trade-offs`,
          `Produce structured verification evidence matching organizational standards`
        ],
        constraints: [
          `Adhere to enterprise compliance and security standards`,
          seniority === 'entry' ? 'Focus on procedural accuracy' : 'Formulate architectural contingency and resilience'
        ],
        tools_available: match.scenario.tools_available,
        expected_output_type: match.scenario.expected_output_type
      },
      rubric: {
        dimensions: [
          {
            name: 'technical_and_functional_quality',
            weight: 0.40,
            description: `Quality of ${skillName} solution`,
            criteria: `Demonstrates high technical and domain competence in ${skillName}.`
          },
          {
            name: 'decision_quality_and_tradeoffs',
            weight: 0.35,
            description: 'Risk and trade-off evaluation',
            criteria: 'Justifies design assumptions and articulates trade-offs clearly.'
          },
          {
            name: 'process_and_governance',
            weight: 0.25,
            description: 'Adherence to constraints and standards',
            criteria: 'Satisfies all organizational governance and safety constraints.'
          }
        ]
      }
    };
  }
}
