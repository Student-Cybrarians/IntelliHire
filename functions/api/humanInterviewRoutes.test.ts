import { describe, it, expect, vi } from 'vitest';
import { app } from './[[route]]';
import {
  generateInterviewerQuestionSuggestions,
  validateInvitationPayload,
  validateEvaluationPayload,
  synthesizeHumanInterviewM05Package
} from '../../src/shared/m4HumanInterviewContracts';

vi.mock('hono/jwt', () => ({
  sign: vi.fn(),
  verify: vi.fn().mockImplementation(async (token) => {
    if (token === 'recruiter-token') {
      return { id: 'recruiter-1', email: 'mokshithyoga@gmail.com', role: 'recruiter', full_name: 'Lead Recruiter', organization_id: 'org-m4' };
    }
    if (token === 'candidate-token') {
      return { id: 'candidate-1', email: 'candidate@intellihire.test', role: 'candidate', full_name: 'Alex Mercer', organization_id: 'org-m4' };
    }
    if (token === 'attacker-token') {
      return { id: 'attacker-1', email: 'attacker@foreign.test', role: 'candidate', full_name: 'Foreign User', organization_id: 'org-foreign' };
    }
    return null;
  })
}));

const createMockEnv = () => {
  const invitations = new Map<string, any>();
  const rooms = new Map<string, any>();
  const signals: any[] = [];
  const evaluations = new Map<string, any>();

  return {
    SESSION_KV: {
      get: vi.fn().mockImplementation(async (key: string) => {
        if (key === 'session:recruiter-session') return 'recruiter-token';
        if (key === 'session:candidate-session') return 'candidate-token';
        if (key === 'session:attacker-session') return 'attacker-token';
        return null;
      }),
      put: vi.fn().mockResolvedValue(undefined),
      delete: vi.fn().mockResolvedValue(undefined)
    },
    DB: {
      prepare: (query: string) => ({
        bind: (...args: any[]) => ({
          first: vi.fn().mockImplementation(async () => {
            if (query.includes('FROM user_account WHERE id = ?')) {
              const uid = args[0];
              if (uid === 'candidate-1') return { id: 'candidate-1', full_name: 'Alex Mercer', email: 'alex@intellihire.test', organization_id: 'org-m4', role: 'candidate' };
              if (uid === 'recruiter-1') return { id: 'recruiter-1', full_name: 'Lead Recruiter', email: 'recruiter@intellihire.test', organization_id: 'org-m4', role: 'recruiter' };
              return null;
            }
            if (query.includes('FROM candidate_profile WHERE user_id = ?')) {
              return { target_role: 'Senior Cloud Architect', experience_level: 'senior', bio: 'Experienced architect' };
            }
            if (query.includes('FROM candidate_context WHERE user_id = ?')) {
              return {
                context_data_json: JSON.stringify({
                  skills: ['Distributed Systems', 'Cloud Security', 'Kubernetes'],
                  projects: [{ name: 'Multi-Region Mesh Deployment' }]
                })
              };
            }
            if (query.includes('FROM human_interview_room r') && query.includes('WHERE r.id = ?')) {
              const roomId = args[0];
              const room = rooms.get(roomId);
              if (!room) return null;
              const inv = invitations.get(room.invitation_id);
              if (!inv) return null;
              return {
                ...room,
                ...inv,
                room_id: room.id,
                invitation_id: inv.id,
                invitation_status: inv.status
              };
            }
            if (query.includes('human_interview_room') && query.includes('WHERE id = ?')) {
              return rooms.get(args[0]) || null;
            }
            if (query.includes('human_interview_invitation') && query.includes('WHERE id = ?')) {
              return invitations.get(args[0]) || null;
            }
            if (query.includes('FROM human_interview_evaluation WHERE room_id = ?')) {
              return evaluations.get(args[0]) || null;
            }
            return null;
          }),
          all: vi.fn().mockImplementation(async () => {
            if (query.includes('FROM human_interview_invitation i')) {
              const orgId = args[0];
              const candId = args[1];
              let list = Array.from(invitations.values()).filter(i => i.organization_id === orgId);
              if (candId) {
                list = list.filter(i => i.candidate_user_id === candId);
              }
              const formatted = list.map(inv => {
                const room = Array.from(rooms.values()).find(r => r.invitation_id === inv.id);
                return {
                  ...inv,
                  room_id: room?.id || 'room-1',
                  room_status: room?.room_status || 'waiting',
                  candidate_name: 'Alex Mercer',
                  candidate_email: 'alex@intellihire.test',
                  interviewer_name: 'Lead Recruiter',
                  interviewer_email: 'recruiter@intellihire.test'
                };
              });
              return { results: formatted };
            }
            if (query.includes('FROM human_interview_signal')) {
              const roomId = args[0];
              const opposingRole = args[1];
              const since = args[2] || 0;
              const filtered = signals.filter(s => s.room_id === roomId && s.sender_role === opposingRole && s.created_at > since);
              return { results: filtered };
            }
            return { results: [] };
          }),
          run: vi.fn().mockImplementation(async () => {
            if (query.includes('INSERT INTO human_interview_invitation')) {
              invitations.set(args[0], {
                id: args[0],
                organization_id: args[1],
                candidate_user_id: args[2],
                interviewer_user_id: args[3],
                target_role: args[4],
                job_description: args[5],
                resume_id: args[6],
                interview_type: args[7],
                scheduled_start_time: args[8],
                scheduled_end_time: args[9],
                timezone: args[10],
                status: 'scheduled',
                candidate_token: args[11],
                interviewer_token: args[12],
                created_by_user_id: args[13]
              });
            } else if (query.includes('INSERT INTO human_interview_room')) {
              rooms.set(args[0], {
                id: args[0],
                invitation_id: args[1],
                organization_id: args[2],
                room_status: 'waiting',
                workspace_state_json: args[3],
                candidate_recording_consent: 0,
                interviewer_recording_consent: 0,
                recording_enabled: 0
              });
            } else if (query.includes('INSERT INTO human_interview_signal')) {
              signals.push({
                id: args[0],
                room_id: args[1],
                sender_user_id: args[2],
                sender_role: args[3],
                signal_type: args[4],
                signal_payload_json: args[5],
                created_at: args[6]
              });
            } else if (query.includes('INSERT INTO human_interview_evaluation')) {
              evaluations.set(args[1], {
                id: args[0],
                room_id: args[1],
                invitation_id: args[2],
                interviewer_user_id: args[3],
                candidate_user_id: args[4],
                organization_id: args[5],
                overall_recommendation: args[6],
                competency_scores_json: args[7],
                interviewer_notes: args[8],
                private_observations_json: args[9],
                m05_evidence_package_json: args[10],
                created_at: new Date().toISOString()
              });
            } else if (query.includes('UPDATE human_interview_invitation SET status = ?')) {
              const inv = invitations.get(args[2]);
              if (inv) {
                inv.status = args[0];
                inv.candidate_response_notes = args[1];
              }
            } else if (query.includes('UPDATE human_interview_room SET candidate_joined_at =')) {
              const r = rooms.get(args[1]);
              if (r) r.candidate_joined_at = args[0];
            } else if (query.includes('UPDATE human_interview_room SET interviewer_joined_at =')) {
              const r = rooms.get(args[1]);
              if (r) r.interviewer_joined_at = args[0];
            } else if (query.includes('candidate_recording_consent = ?')) {
              const r = rooms.get(args[1]);
              if (r) r.candidate_recording_consent = args[0];
            } else if (query.includes('interviewer_recording_consent = ?')) {
              const r = rooms.get(args[1]);
              if (r) r.interviewer_recording_consent = args[0];
            } else if (query.includes('recording_enabled = ?')) {
              const r = rooms.get(args[1]);
              if (r) r.recording_enabled = args[0];
            } else if (query.includes('UPDATE human_interview_room SET workspace_state_json = ?')) {
              const r = rooms.get(args[1]);
              if (r) r.workspace_state_json = args[0];
            } else if (query.includes('UPDATE human_interview_room SET room_status = ?')) {
              const r = rooms.get(args[2]);
              if (r) r.room_status = args[0];
            }
            return { success: true };
          })
        })
      })
    }
  };
};

describe('M04 Phase 2 Human Live Interview Routes & Lifecycle', () => {
  it('1. Rejects unauthenticated invitation creation', async () => {
    const env = createMockEnv();
    const res = await app.request('/api/m4/human-interviews/invitations', {
      method: 'POST',
      body: JSON.stringify({ candidate_user_id: 'candidate-1', target_role: 'Cloud Architect' }),
      headers: { 'Content-Type': 'application/json' }
    }, env);

    expect(res.status).toBe(401);
  });

  it('2. Forbids candidates from creating interview invitations', async () => {
    const env = createMockEnv();
    const res = await app.request('/api/m4/human-interviews/invitations', {
      method: 'POST',
      body: JSON.stringify({
        candidate_user_id: 'candidate-1',
        target_role: 'Cloud Architect',
        scheduled_start_time: '2026-10-20T10:00:00Z',
        scheduled_end_time: '2026-10-20T11:00:00Z'
      }),
      headers: {
        'Content-Type': 'application/json',
        Cookie: 'intellihire_session=candidate-session'
      }
    }, env);

    expect(res.status).toBe(403);
  });

  it('3. Recruiter creates valid invitation with automatic room & token generation', async () => {
    const env = createMockEnv();
    const res = await app.request('/api/m4/human-interviews/invitations', {
      method: 'POST',
      body: JSON.stringify({
        candidate_user_id: 'candidate-1',
        target_role: 'Senior Cloud & Systems Architect',
        job_description: 'Architecting resilient edge systems.',
        interview_type: 'technical_and_behavioral',
        scheduled_start_time: '2026-10-20T10:00:00Z',
        scheduled_end_time: '2026-10-20T11:00:00Z',
        timezone: 'America/New_York'
      }),
      headers: {
        'Content-Type': 'application/json',
        Cookie: 'intellihire_session=recruiter-session'
      }
    }, env);

    expect(res.status).toBe(201);
    const data = await res.json() as any;
    expect(data.success).toBe(true);
    expect(data.invitation.id).toBeDefined();
    expect(data.invitation.room_id).toBeDefined();
    expect(data.invitation.candidate_token).toBeDefined();
    expect(data.invitation.interviewer_token).toBeDefined();
    expect(data.invitation.candidate_join_url).toContain(data.invitation.candidate_token);
  });

  it('4. Candidate views invitations without seeing recruiter join tokens', async () => {
    const env = createMockEnv();
    // Pre-create invitation
    const createRes = await app.request('/api/m4/human-interviews/invitations', {
      method: 'POST',
      body: JSON.stringify({
        candidate_user_id: 'candidate-1',
        target_role: 'DevOps Lead',
        scheduled_start_time: '2026-10-22T14:00:00Z',
        scheduled_end_time: '2026-10-22T15:00:00Z'
      }),
      headers: {
        'Content-Type': 'application/json',
        Cookie: 'intellihire_session=recruiter-session'
      }
    }, env);
    expect(createRes.status).toBe(201);

    // Candidate lists invitations
    const listRes = await app.request('/api/m4/human-interviews/invitations', {
      method: 'GET',
      headers: { Cookie: 'intellihire_session=candidate-session' }
    }, env);

    expect(listRes.status).toBe(200);
    const listData = await listRes.json() as any;
    expect(listData.invitations.length).toBeGreaterThan(0);
    expect(listData.invitations[0].candidate_token).toBeDefined();
    expect(listData.invitations[0].interviewer_token).toBeUndefined(); // Securely stripped
  });

  it('5. Candidate accepts interview invitation', async () => {
    const env = createMockEnv();
    const createRes = await app.request('/api/m4/human-interviews/invitations', {
      method: 'POST',
      body: JSON.stringify({
        candidate_user_id: 'candidate-1',
        target_role: 'Solutions Architect',
        scheduled_start_time: '2026-10-23T16:00:00Z',
        scheduled_end_time: '2026-10-23T17:00:00Z'
      }),
      headers: {
        'Content-Type': 'application/json',
        Cookie: 'intellihire_session=recruiter-session'
      }
    }, env);
    const { invitation } = await createRes.json() as any;

    const respondRes = await app.request(`/api/m4/human-interviews/invitations/${invitation.id}/respond`, {
      method: 'PATCH',
      body: JSON.stringify({ action: 'accept', notes: 'Confirmed and prepared.' }),
      headers: {
        'Content-Type': 'application/json',
        Cookie: 'intellihire_session=candidate-session'
      }
    }, env);

    expect(respondRes.status).toBe(200);
    const respondData = await respondRes.json() as any;
    expect(respondData.status).toBe('accepted');
  });

  it('6. Authorizes room join with candidate token and loads grounded workspace state', async () => {
    const env = createMockEnv();
    const createRes = await app.request('/api/m4/human-interviews/invitations', {
      method: 'POST',
      body: JSON.stringify({
        candidate_user_id: 'candidate-1',
        target_role: 'Principal SRE',
        scheduled_start_time: '2026-10-24T10:00:00Z',
        scheduled_end_time: '2026-10-24T11:00:00Z'
      }),
      headers: {
        'Content-Type': 'application/json',
        Cookie: 'intellihire_session=recruiter-session'
      }
    }, env);
    const { invitation } = await createRes.json() as any;

    const joinRes = await app.request('/api/m4/human-interviews/rooms/join', {
      method: 'POST',
      body: JSON.stringify({
        room_id: invitation.room_id,
        token: invitation.candidate_token
      }),
      headers: { 'Content-Type': 'application/json' }
    }, env);

    expect(joinRes.status).toBe(200);
    const joinData = await joinRes.json() as any;
    expect(joinData.success).toBe(true);
    expect(joinData.participant_role).toBe('candidate');
    expect(joinData.candidate_context.profile.target_role).toBe('Senior Cloud Architect');
    expect(joinData.workspace_state.questions.length).toBeGreaterThan(0);
  });

  it('7. Exchanging WebRTC signals between candidate and interviewer', async () => {
    const env = createMockEnv();
    const createRes = await app.request('/api/m4/human-interviews/invitations', {
      method: 'POST',
      body: JSON.stringify({
        candidate_user_id: 'candidate-1',
        target_role: 'Security Engineer',
        scheduled_start_time: '2026-10-25T13:00:00Z',
        scheduled_end_time: '2026-10-25T14:00:00Z'
      }),
      headers: {
        'Content-Type': 'application/json',
        Cookie: 'intellihire_session=recruiter-session'
      }
    }, env);
    const { invitation } = await createRes.json() as any;

    // Candidate sends SDP Offer
    const offerRes = await app.request(`/api/m4/human-interviews/rooms/${invitation.room_id}/signal`, {
      method: 'POST',
      body: JSON.stringify({
        token: invitation.candidate_token,
        signal_type: 'offer',
        payload: { sdp: 'v=0\r\no=candidate 123456\r\ns=test-stream', type: 'offer' }
      }),
      headers: { 'Content-Type': 'application/json' }
    }, env);
    expect(offerRes.status).toBe(200);

    // Interviewer polls for signals
    const signalsRes = await app.request(`/api/m4/human-interviews/rooms/${invitation.room_id}/signals?token=${invitation.interviewer_token}&since=0`, {
      method: 'GET'
    }, env);
    expect(signalsRes.status).toBe(200);
    const signalsData = await signalsRes.json() as any;
    expect(signalsData.signals.length).toBe(1);
    expect(signalsData.signals[0].signal_type).toBe('offer');
    expect(signalsData.signals[0].sender_role).toBe('candidate');

    // Interviewer sends SDP Answer
    const answerRes = await app.request(`/api/m4/human-interviews/rooms/${invitation.room_id}/signal`, {
      method: 'POST',
      body: JSON.stringify({
        token: invitation.interviewer_token,
        signal_type: 'answer',
        payload: { sdp: 'v=0\r\no=interviewer 654321\r\ns=test-stream', type: 'answer' }
      }),
      headers: { 'Content-Type': 'application/json' }
    }, env);
    expect(answerRes.status).toBe(200);

    // Candidate polls for answer
    const candSignalsRes = await app.request(`/api/m4/human-interviews/rooms/${invitation.room_id}/signals?token=${invitation.candidate_token}&since=0`, {
      method: 'GET'
    }, env);
    expect(candSignalsRes.status).toBe(200);
    const candSignalsData = await candSignalsRes.json() as any;
    expect(candSignalsData.signals.length).toBe(1);
    expect(candSignalsData.signals[0].signal_type).toBe('answer');
  });

  it('8. Recording consent invariant: recording is disabled unless BOTH consent', async () => {
    const env = createMockEnv();
    const createRes = await app.request('/api/m4/human-interviews/invitations', {
      method: 'POST',
      body: JSON.stringify({
        candidate_user_id: 'candidate-1',
        target_role: 'Staff Engineer',
        scheduled_start_time: '2026-10-26T10:00:00Z',
        scheduled_end_time: '2026-10-26T11:00:00Z'
      }),
      headers: {
        'Content-Type': 'application/json',
        Cookie: 'intellihire_session=recruiter-session'
      }
    }, env);
    const { invitation } = await createRes.json() as any;

    // Candidate consents
    const candConsentRes = await app.request(`/api/m4/human-interviews/rooms/${invitation.room_id}/consent`, {
      method: 'POST',
      body: JSON.stringify({ token: invitation.candidate_token, consented: true }),
      headers: { 'Content-Type': 'application/json' }
    }, env);
    const candConsentData = await candConsentRes.json() as any;
    expect(candConsentData.recording_enabled).toBe(false); // Only 1 party consented

    // Interviewer consents
    const intvConsentRes = await app.request(`/api/m4/human-interviews/rooms/${invitation.room_id}/consent`, {
      method: 'POST',
      body: JSON.stringify({ token: invitation.interviewer_token, consented: true }),
      headers: { 'Content-Type': 'application/json' }
    }, env);
    const intvConsentData = await intvConsentRes.json() as any;
    expect(intvConsentData.recording_enabled).toBe(true); // Both consented
  });

  it('9. Concluding interview with human evaluation and generating M05 evidence package', async () => {
    const env = createMockEnv();
    const createRes = await app.request('/api/m4/human-interviews/invitations', {
      method: 'POST',
      body: JSON.stringify({
        candidate_user_id: 'candidate-1',
        target_role: 'Lead Architect',
        scheduled_start_time: '2026-10-27T10:00:00Z',
        scheduled_end_time: '2026-10-27T11:00:00Z'
      }),
      headers: {
        'Content-Type': 'application/json',
        Cookie: 'intellihire_session=recruiter-session'
      }
    }, env);
    const { invitation } = await createRes.json() as any;

    const completeRes = await app.request(`/api/m4/human-interviews/rooms/${invitation.room_id}/complete`, {
      method: 'POST',
      body: JSON.stringify({
        token: invitation.interviewer_token,
        evaluation: {
          overall_recommendation: 'strong_hire',
          interviewer_notes: 'Demonstrated exceptional hands-on grasp of distributed consensus and zero-downtime canary deployments.',
          competency_scores: {
            'Technical Architecture': { rating: 5, rubric_level: 'L5 Exceptional', evidence_observed: 'Detailed mesh egress failover trade-offs.' },
            'Communication & Composure': { rating: 4, rubric_level: 'L4 Strong', evidence_observed: 'Concise executive summaries.' }
          },
          private_observations: [
            { timestamp: '10:15', competency: 'Technical Architecture', observation: 'Clear rationale on database partitioning.' }
          ]
        }
      }),
      headers: { 'Content-Type': 'application/json' }
    }, env);

    expect(completeRes.status).toBe(200);
    const completeData = await completeRes.json() as any;
    expect(completeData.success).toBe(true);
    expect(completeData.evaluation_id).toBeDefined();
    expect(completeData.m05_evidence_package.package_type).toBe('m04_human_live_interview_evidence');
    expect(completeData.m05_evidence_package.ethical_governance.biometrics_collected).toBe(false);
  });
});
