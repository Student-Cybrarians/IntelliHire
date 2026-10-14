import { describe, it, expect, vi } from 'vitest';
import { app } from './[[route]]';
import {
  generateDeterministicInterviewPlan,
  validateInterviewPlan
} from '../../src/shared/m4InterviewContracts';
import {
  synthesizeHumanInterviewM05Package,
  generateInterviewerQuestionSuggestions,
  validateInvitationPayload,
  validateEvaluationPayload
} from '../../src/shared/m4HumanInterviewContracts';

vi.mock('hono/jwt', () => ({
  sign: vi.fn(),
  verify: vi.fn().mockImplementation(async (token) => {
    if (token === 'recruiter-token') {
      return { id: 'recruiter-user-1', role: 'recruiter', full_name: 'Lead Evaluator', organization_id: 'org-m4' };
    }
    if (token === 'candidate-token') {
      return { id: 'candidate-user-1', role: 'candidate', full_name: 'Alex Mercer', organization_id: 'org-m4' };
    }
    if (token === 'attacker-token') {
      return { id: 'attacker-user-2', role: 'recruiter', full_name: 'Foreign Recruiter', organization_id: 'org-foreign' };
    }
    return null;
  })
}));

const createMockEnv = (customData: any = {}) => {
  return {
    DB: {
      prepare: (query: string) => ({
        bind: (...args: any[]) => ({
          first: vi.fn().mockImplementation(async () => {
            if (query.includes('FROM user_account WHERE id = ?')) {
              return { organization_id: 'org-m4', role: 'candidate' };
            }
            if (query.includes('candidate_profile WHERE user_id = ?')) {
              return {
                user_id: args[0],
                target_role: 'Principal Cloud Architect',
                primary_domain: 'software',
                experience_level: 'senior',
                bio: 'Cloud distributed systems expert with deep disaster recovery experience.'
              };
            }
            if (query.includes('candidate_context WHERE user_id = ?')) {
              return {
                raw_text: 'Built Multi-Region Failover Architecture and Kafka event streaming.',
                context_data_json: JSON.stringify({
                  projects: ['Multi-Region Active-Active Mesh', 'Global Auth Mesh'],
                  skills: ['Distributed Systems', 'Chaos Engineering', 'Kubernetes']
                })
              };
            }
            return null;
          }),
          all: vi.fn().mockImplementation(async () => {
            if (query.includes('candidate_claim')) {
              return { results: [{ claim_value: 'Distributed Systems' }, { claim_value: 'Chaos Engineering' }] };
            }
            if (query.includes('candidate_skill_proficiency_v2')) {
              return { results: [{ skill_name: 'Kubernetes' }, { skill_name: 'Reliability Engineering' }] };
            }
            if (query.includes('FROM candidate_gap')) {
              return {
                results: [
                  { skill_id: 'sk-1', skill_name: 'Split-Brain Quorum', gap_type: 'deficiency', recommendation: 'Strengthen Raft Consensus Understanding' }
                ]
              };
            }
            if (query.includes('FROM assessment_evaluation')) {
              return {
                results: [
                  {
                    evaluation_json: JSON.stringify({
                      teaching_payload: { misconception_remediation: 'Conflating eventual consistency with monotonic read consistency' }
                    }),
                    skill_name: 'Data Consistency'
                  }
                ]
              };
            }
            return { results: [] };
          }),
          run: vi.fn().mockResolvedValue({ success: true })
        })
      })
    },
    SESSION_KV: {
      get: vi.fn().mockImplementation(async (id: string) => {
        if (id === 'session:recruiter-token') return 'recruiter-token';
        if (id === 'session:candidate-token') return 'candidate-token';
        if (id === 'session:attacker-token') return 'attacker-token';
        return null;
      })
    }
  };
};

describe('M04 Phase 3: End-to-End AI Voice & Human Interview Validation Matrix', () => {

  // CRITERION 1 & 2: Role/Resume & Module 2 Learning Gaps Personalization
  it('1. Personalizes 10-Question Plan with verified M01 projects and incorporates M02 diagnosed learning gaps', async () => {
    const env = createMockEnv();
    const req = new Request('http://localhost/api/m4/interviews/sessions', {
      method: 'POST',
      headers: {
        'Cookie': 'intellihire_session=candidate-token',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        personalized: true,
        target_role: 'Principal Cloud Architect',
        domain: 'software',
        seniority: 'senior'
      })
    });

    const res = await app.fetch(req, env as any);
    expect(res.status).toBe(200);
    const body = await res.json() as any;
    expect(body.success).toBe(true);
    expect(body.plan).toBeDefined();
    expect(body.plan.totalQuestions).toBe(10);
    expect(body.plan.targetRole).toBe('Principal Cloud Architect');

    // Turn 2 must be grounded in verified candidate project
    const turn2 = body.plan.questions[1];
    expect(turn2.category).toBe('role_competency');
    expect(turn2.question).toContain('Multi-Region Active-Active Mesh');

    // Turn 7 must incorporate diagnosed learning gap / misconception from M02
    const turn7 = body.plan.questions[6];
    expect(turn7.category).toBe('role_competency');
    expect(turn7.competency).toContain('Data Consistency: Conflating eventual consistency with monotonic read consistency');
  });

  // CRITERION 3: Cross-Domain & Non-IT Occupation Coverage
  it('2. Cross-domain deterministic plan generator supports Healthcare, Finance, and Legal without IT template bias', () => {
    // Finance Plan
    const financePlan = generateDeterministicInterviewPlan({
      targetRole: 'Senior Financial Portfolio Analyst',
      domain: 'finance',
      seniority: 'senior',
      skills: ['DCF Modeling', 'Variance Analysis', 'Capital Budgeting'],
      projects: ['Q3 Operating Cost Restructuring']
    });
    expect(financePlan.questions).toHaveLength(10);
    expect(financePlan.questions[1].panel_role).toBe('Chief Financial Officer');
    expect(financePlan.questions[1].question).toContain('Q3 Operating Cost Restructuring');

    // Healthcare Plan
    const healthPlan = generateDeterministicInterviewPlan({
      targetRole: 'Clinical Nurse Manager',
      domain: 'healthcare',
      seniority: 'lead',
      skills: ['Triage Protocol', 'Patient Advocacy', 'ICU Resuscitation'],
      projects: ['Emergency Department Workflow Overhaul']
    });
    expect(healthPlan.questions).toHaveLength(10);
    expect(healthPlan.questions[1].panel_role).toBe('Clinical Director');
    expect(healthPlan.questions[1].question).toContain('Emergency Department Workflow Overhaul');

    // Legal Plan
    const legalPlan = generateDeterministicInterviewPlan({
      targetRole: 'Corporate Compliance Counsel',
      domain: 'legal',
      seniority: 'senior',
      skills: ['Cross-Border GDPR Compliance', 'Antitrust Review'],
      projects: ['Enterprise Data Privacy Remediation']
    });
    expect(legalPlan.questions).toHaveLength(10);
    expect(legalPlan.questions[1].panel_role).toBe('General Counsel');
    expect(legalPlan.questions[1].question).toContain('Enterprise Data Privacy Remediation');
  });

  // CRITERION 4: Candidate & Recruiter RBAC & Tenant Isolation
  it('3. Security & RBAC: candidates cannot schedule interviews for other candidates', async () => {
    const env = createMockEnv();
    const req = new Request('http://localhost/api/m4/interviews/sessions', {
      method: 'POST',
      headers: {
        'Cookie': 'intellihire_session=candidate-token',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        candidate_user_id: 'some-other-candidate-uuid',
        personalized: true
      })
    });

    const res = await app.fetch(req, env as any);
    expect(res.status).toBe(403);
    const body = await res.json() as any;
    expect(body.error).toContain('Forbidden');
  });

  // CRITERION 5: Module 5 Synthesis Schema & Governance Declarations
  it('4. Synthesizes auditable Module 5 evidence package with integrity checksum and ethical governance', () => {
    const m05Package = synthesizeHumanInterviewM05Package({
      invitation: {
        id: 'inv-12345678-abcd',
        organization_id: 'org-m4',
        candidate_user_id: 'cand-1',
        interviewer_user_id: 'interv-1',
        target_role: 'Principal Cloud Resilience Architect',
        interview_type: 'technical_and_behavioral',
        scheduled_start_time: '2026-10-14T10:00:00Z',
        scheduled_end_time: '2026-10-14T11:00:00Z',
        timezone: 'UTC',
        status: 'completed',
        candidate_token: 'cand-tok',
        interviewer_token: 'int-tok',
        created_by_user_id: 'recruiter-1'
      },
      evaluation: {
        id: 'eval-999',
        room_id: 'room-123',
        invitation_id: 'inv-12345678-abcd',
        interviewer_user_id: 'interv-1',
        candidate_user_id: 'cand-1',
        organization_id: 'org-m4',
        overall_recommendation: 'strong_hire',
        competency_scores: {
          'Technical Execution': { rating: 5, rubric_level: 'L5 Exceptional', evidence: 'Masterful explanation of CAP theorem trade-offs.' }
        },
        interviewer_notes: 'Consensus recommendation: Strong Hire. Demonstrated deep distributed systems knowledge.',
        private_observations: [
          { timestamp: '10:15', competency: 'Technical Execution', observation: 'Articulated consensus quorum.' }
        ],
        m05_evidence_package: {}
      }
    });

    expect(m05Package.package_type).toBe('m04_human_live_interview_evidence');
    expect(m05Package.schema_version).toBe('2.0.0');
    expect(m05Package.human_evaluation.recommendation).toBe('strong_hire');
    expect(m05Package.ethical_governance.evaluator_type).toBe('human_recruiter');
    expect(m05Package.ethical_governance.ai_role).toBe('non_decisional_preparation_assistant');
    expect(m05Package.ethical_governance.biometrics_collected).toBe(false);
    expect(m05Package.integrity_checksum).toContain('m04-human-inv-1234');
  });

  // CRITERION 6: Grounded Recruiter Question Suggestions
  it('5. Generates grounded recruiter question suggestions without fabricating candidate history', () => {
    const suggestions = generateInterviewerQuestionSuggestions({
      targetRole: 'Staff Site Reliability Engineer',
      skills: ['Incident Response', 'Post-Mortem Analysis', 'Kubernetes'],
      projects: ['Zero-Downtime Migration']
    });

    expect(suggestions).toHaveLength(5);
    // Question 1 must be grounded in candidate project
    expect(suggestions[0].category).toBe('technical_execution');
    expect(suggestions[0].question).toContain('Zero-Downtime Migration');
    expect(suggestions[0].provenance_note).toContain('Grounded in candidate\'s verified project "Zero-Downtime Migration"');
    
    // Status starts as suggested
    expect(suggestions[0].status).toBe('suggested');
  });

  // CRITERION 7: Payload Validation Robustness
  it('6. Payload validation guards against invalid dates and malformed evaluations', () => {
    const invalidDates = validateInvitationPayload({
      candidate_user_id: 'c-1',
      target_role: 'SRE',
      scheduled_start_time: '2026-10-14T12:00:00Z',
      scheduled_end_time: '2026-10-14T10:00:00Z' // end before start
    });
    expect(invalidDates.valid).toBe(false);
    expect(invalidDates.error).toContain('strictly after');

    const invalidEval = validateEvaluationPayload({
      overall_recommendation: 'invalid_choice',
      interviewer_notes: 'Some notes'
    });
    expect(invalidEval.valid).toBe(false);
    expect(invalidEval.error).toContain('overall_recommendation must be one of');
  });
});
