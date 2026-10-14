/**
 * IntelliHire M04 Phase 2: Human Live Interview Contracts
 * Types, schemas, and helpers for scheduling, invitation lifecycle,
 * WebRTC signaling, interviewer workspace, and post-interview human evaluation.
 */

export type HumanInterviewType =
  | 'technical_and_behavioral'
  | 'technical_deep_dive'
  | 'behavioral_hr'
  | 'executive_panel'
  | 'system_architecture';

export type HumanInterviewStatus =
  | 'draft'
  | 'invited'
  | 'accepted'
  | 'declined'
  | 'rescheduled'
  | 'scheduled'
  | 'waiting'
  | 'in_progress'
  | 'completed'
  | 'cancelled'
  | 'no_show';

export type RoomStatus = 'waiting' | 'in_progress' | 'completed' | 'closed';

export type ParticipantRole = 'interviewer' | 'candidate';

export interface HumanInterviewInvitation {
  id: string;
  organization_id: string;
  candidate_user_id: string;
  candidate_name?: string;
  candidate_email?: string;
  interviewer_user_id: string;
  interviewer_name?: string;
  interviewer_email?: string;
  target_role: string;
  job_description?: string;
  resume_id?: string;
  interview_type: HumanInterviewType;
  scheduled_start_time: string;
  scheduled_end_time: string;
  timezone: string;
  status: HumanInterviewStatus;
  candidate_token: string;
  interviewer_token: string;
  candidate_response_notes?: string;
  cancellation_reason?: string;
  created_by_user_id: string;
  created_at: string;
  updated_at: string;
}

export interface HumanInterviewRoom {
  id: string;
  invitation_id: string;
  organization_id: string;
  room_status: RoomStatus;
  candidate_joined_at?: string;
  interviewer_joined_at?: string;
  candidate_recording_consent: number;
  interviewer_recording_consent: number;
  recording_enabled: number;
  workspace_state_json: string;
  started_at?: string;
  ended_at?: string;
  created_at: string;
  updated_at: string;
}

export type SignalType = 'offer' | 'answer' | 'ice-candidate' | 'presence' | 'control';

export interface HumanInterviewSignal {
  id: string;
  room_id: string;
  sender_user_id: string;
  sender_role: ParticipantRole;
  signal_type: SignalType;
  signal_payload_json: string;
  created_at: number;
}

export type RecommendationType = 'strong_hire' | 'hire' | 'further_review' | 'no_hire' | 'hold';

export interface CompetencyScoreEntry {
  rating: number; // 1 to 5
  rubric_level: 'L1 Unsatisfactory' | 'L2 Developing' | 'L3 Competent Standard' | 'L4 Strong' | 'L5 Exceptional';
  evidence_observed: string;
}

export interface HumanInterviewEvaluation {
  id: string;
  room_id: string;
  invitation_id: string;
  interviewer_user_id: string;
  candidate_user_id: string;
  organization_id: string;
  overall_recommendation: RecommendationType;
  competency_scores: Record<string, CompetencyScoreEntry>;
  interviewer_notes: string;
  private_observations: Array<{
    timestamp: string;
    competency: string;
    observation: string;
    rating?: number;
  }>;
  m05_evidence_package: Record<string, any>;
  created_at?: string;
}

export interface WorkspaceQuestionItem {
  id: string;
  category: 'technical_execution' | 'behavioral_star' | 'situational_resilience' | 'culture_standards';
  question: string;
  competency: string;
  provenance_note: string;
  status: 'suggested' | 'asked' | 'skipped' | 'adapted';
  adapted_text?: string;
  rating?: number;
  notes?: string;
}

export interface InterviewerWorkspaceState {
  questions: WorkspaceQuestionItem[];
  active_question_id?: string;
  live_notes: string;
  private_observations: Array<{
    id: string;
    timestamp: string;
    competency: string;
    text: string;
    rating?: number;
  }>;
  recording_consented: boolean;
  rubric_drafts: Record<string, { rating: number; rubric_level: string; evidence: string }>;
}

/**
 * Generates structured question suggestions grounded in candidate's verified M01 facts.
 * AI suggestions are clearly distinguished from candidate facts and never impersonate human.
 */
export function generateInterviewerQuestionSuggestions(params: {
  targetRole: string;
  verifiedSkills?: string[];
  projects?: string[];
  seniority?: string;
}): WorkspaceQuestionItem[] {
  const skills = params.verifiedSkills || ['Distributed Systems', 'Cloud Architecture', 'Security & Incident Response'];
  const projects = params.projects || ['Production Cloud Deployment', 'Microservice Telemetry Pipeline'];
  const primarySkill = skills[0] || 'Core Architecture';
  const secondarySkill = skills[1] || 'Reliability Engineering';
  const primaryProject = projects[0] || 'Flagship Technical Project';

  return [
    {
      id: 'q-tech-1',
      category: 'technical_execution',
      competency: `${primarySkill} Execution & Trade-offs`,
      question: `In your work on "${primaryProject}", what was the most demanding architectural constraint you encountered, and what deliberate trade-offs did you make between performance, complexity, and operational safety?`,
      provenance_note: `Grounded in candidate's verified project "${primaryProject}" and skill "${primarySkill}".`,
      status: 'suggested'
    },
    {
      id: 'q-tech-2',
      category: 'technical_execution',
      competency: `${secondarySkill} & Edge Resilience`,
      question: `How have you applied ${secondarySkill} principles to identify and isolate single points of failure under unpredictable production workloads?`,
      provenance_note: `Anchored to role competency requirements for ${params.targetRole}.`,
      status: 'suggested'
    },
    {
      id: 'q-star-1',
      category: 'behavioral_star',
      competency: 'Conflict & Stakeholder Alignment (STAR)',
      question: `Describe a situation where a technical stakeholder or product manager strongly disagreed with your proposed engineering roadmap. How did you structure your counter-arguments, what consensus was achieved, and what was the quantifiable outcome?`,
      provenance_note: 'Standard behavioral inquiry evaluating structured STAR clarity and empathy.',
      status: 'suggested'
    },
    {
      id: 'q-sit-1',
      category: 'situational_resilience',
      competency: 'Incident Triage & Failure Recovery',
      question: `Walk us through a time an unexpected critical bug or outage occurred in a system you were maintaining. How did you coordinate containment, prevent alert fatigue, and ensure systemic post-mortem remediation?`,
      provenance_note: 'Situational evaluation measuring calm under crisis and blameless analysis.',
      status: 'suggested'
    },
    {
      id: 'q-cult-1',
      category: 'culture_standards',
      competency: 'Quality Standards & Mentorship',
      question: `How do you uphold rigorous code quality and architectural hygiene when working under tight deadline pressure, and how do you elevate team members along the way?`,
      provenance_note: 'Evaluates peer enablement and engineering standard discipline.',
      status: 'suggested'
    }
  ];
}

/**
 * Validates invitation payload
 */
export function validateInvitationPayload(payload: any): { valid: boolean; error?: string } {
  if (!payload.candidate_user_id) return { valid: false, error: 'candidate_user_id is required' };
  if (!payload.target_role || !payload.target_role.trim()) return { valid: false, error: 'target_role is required' };
  if (!payload.scheduled_start_time) return { valid: false, error: 'scheduled_start_time is required' };
  if (!payload.scheduled_end_time) return { valid: false, error: 'scheduled_end_time is required' };

  const start = new Date(payload.scheduled_start_time).getTime();
  const end = new Date(payload.scheduled_end_time).getTime();

  if (isNaN(start) || isNaN(end)) {
    return { valid: false, error: 'scheduled_start_time and scheduled_end_time must be valid ISO date strings' };
  }
  if (end <= start) {
    return { valid: false, error: 'scheduled_end_time must be strictly after scheduled_start_time' };
  }

  return { valid: true };
}

/**
 * Validates evaluation payload
 */
export function validateEvaluationPayload(payload: any): { valid: boolean; error?: string } {
  const validRecommendations: RecommendationType[] = ['strong_hire', 'hire', 'further_review', 'no_hire', 'hold'];
  if (!payload.overall_recommendation || !validRecommendations.includes(payload.overall_recommendation)) {
    return { valid: false, error: `overall_recommendation must be one of: ${validRecommendations.join(', ')}` };
  }
  if (!payload.interviewer_notes || !payload.interviewer_notes.trim()) {
    return { valid: false, error: 'interviewer_notes are required and cannot be empty' };
  }
  return { valid: true };
}

/**
 * Synthesizes Module 5 Evidence Package for human interview
 */
export function synthesizeHumanInterviewM05Package(params: {
  invitation: HumanInterviewInvitation;
  evaluation: HumanInterviewEvaluation;
  candidateProfile?: any;
}): Record<string, any> {
  const timestamp = new Date().toISOString();
  const invitationId = params.invitation?.id || (params.invitation as any)?.invitation_id || params.evaluation?.invitation_id || 'unknown';
  return {
    package_type: 'm04_human_live_interview_evidence',
    schema_version: '2.0.0',
    generated_at: timestamp,
    interview_metadata: {
      invitation_id: invitationId,
      interview_type: params.invitation?.interview_type || 'technical_and_behavioral',
      target_role: params.invitation?.target_role || 'Target Role',
      candidate_user_id: params.invitation?.candidate_user_id || params.evaluation?.candidate_user_id,
      interviewer_user_id: params.invitation?.interviewer_user_id || params.evaluation?.interviewer_user_id,
      scheduled_time: params.invitation?.scheduled_start_time
    },
    human_evaluation: {
      recommendation: params.evaluation.overall_recommendation,
      interviewer_notes: params.evaluation.interviewer_notes,
      competency_scores: params.evaluation.competency_scores,
      private_observations_count: params.evaluation.private_observations?.length || 0
    },
    ethical_governance: {
      evaluator_type: 'human_recruiter',
      ai_role: 'non_decisional_preparation_assistant',
      biometrics_collected: false,
      emotion_inference_used: false,
      recording_status: 'unrecorded_ephemeral_peer_stream'
    },
    integrity_checksum: `m04-human-${invitationId.slice(0, 8)}-${Date.now()}`
  };
}
