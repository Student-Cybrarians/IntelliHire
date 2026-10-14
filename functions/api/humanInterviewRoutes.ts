import { Hono } from 'hono';
import type { Bindings, UserSession } from './[[route]]';
import { getSessionUser, logAuditEvent } from './[[route]]';
import {
  HumanInterviewInvitation,
  HumanInterviewRoom,
  HumanInterviewEvaluation,
  validateInvitationPayload,
  validateEvaluationPayload,
  generateInterviewerQuestionSuggestions,
  synthesizeHumanInterviewM05Package,
  ParticipantRole
} from '../../src/shared/m4HumanInterviewContracts';

export function registerHumanInterviewRoutes(app: Hono<{ Bindings: Bindings }>) {
  /**
   * Helper: verify token against room and return role
   */
  async function verifyRoomParticipant(
    c: any,
    roomId: string,
    token: string
  ): Promise<{
    room: any;
    invitation: any;
    role: ParticipantRole;
    userId: string;
  } | null> {
    if (!roomId || !token) return null;

    const row = await c.env.DB.prepare(`
      SELECT 
        r.id as room_id, r.invitation_id, r.organization_id, r.room_status,
        r.candidate_recording_consent, r.interviewer_recording_consent, r.recording_enabled,
        r.workspace_state_json, r.started_at, r.ended_at,
        i.candidate_user_id, i.interviewer_user_id, i.candidate_token, i.interviewer_token,
        i.target_role, i.job_description, i.status as invitation_status,
        i.scheduled_start_time, i.scheduled_end_time, i.timezone, i.interview_type
      FROM human_interview_room r
      JOIN human_interview_invitation i ON r.invitation_id = i.id
      WHERE r.id = ?
    `).bind(roomId).first();

    if (!row) return null;

    let role: ParticipantRole | null = null;
    let userId = '';

    if (token === row.interviewer_token) {
      role = 'interviewer';
      userId = row.interviewer_user_id as string;
    } else if (token === row.candidate_token) {
      role = 'candidate';
      userId = row.candidate_user_id as string;
    } else {
      // Fallback check against session user
      const user = await getSessionUser(c);
      if (user) {
        if (user.id === row.interviewer_user_id || ['recruiter', 'hiring_manager', 'org_admin'].includes(user.role)) {
          role = 'interviewer';
          userId = user.id;
        } else if (user.id === row.candidate_user_id) {
          role = 'candidate';
          userId = user.id;
        }
      }
    }

    if (!role) return null;

    return {
      room: {
        ...row,
        id: row.room_id
      },
      invitation: {
        ...row,
        id: row.invitation_id
      },
      role,
      userId
    };
  }

  // =========================================================================
  // 1. INVITATIONS & SCHEDULING LIFECYCLE
  // =========================================================================

  /**
   * POST /api/m4/human-interviews/invitations
   * Create interview invitation (restricted to recruiters / org admins)
   */
  app.post('/m4/human-interviews/invitations', async (c) => {
    const user = await getSessionUser(c);
    if (!user) return c.json({ error: 'Unauthorized: Authentication required' }, 401);

    const isRecruiter = ['recruiter', 'hiring_manager', 'org_admin'].includes(user.role);
    if (!isRecruiter) {
      return c.json({ error: 'Forbidden: Only recruiters or administrators can schedule human interviews' }, 403);
    }

    const body = await c.req.json().catch(() => ({}));
    const validation = validateInvitationPayload(body);
    if (!validation.valid) {
      return c.json({ error: validation.error }, 400);
    }

    const invitationId = crypto.randomUUID();
    const roomId = crypto.randomUUID();
    const candidateToken = crypto.randomUUID();
    const interviewerToken = crypto.randomUUID();
    const organizationId = user.organization_id || 'org_default_public';

    // Verify candidate exists
    const candidate = await c.env.DB.prepare('SELECT id, full_name, email FROM user_account WHERE id = ?')
      .bind(body.candidate_user_id).first();
    if (!candidate) {
      return c.json({ error: 'Candidate not found' }, 404);
    }

    // Retrieve candidate M01 context facts for question generation
    let verifiedSkills: string[] = [];
    let projects: string[] = [];
    try {
      const contextRow = await c.env.DB.prepare(`
        SELECT context_data_json FROM candidate_context 
        WHERE user_id = ? ORDER BY created_at DESC LIMIT 1
      `).bind(body.candidate_user_id).first();
      if (contextRow?.context_data_json) {
        const parsed = JSON.parse(contextRow.context_data_json as string);
        if (Array.isArray(parsed.skills)) verifiedSkills = parsed.skills;
        if (Array.isArray(parsed.projects)) {
          projects = parsed.projects.map((p: any) => typeof p === 'string' ? p : p.name || p.title).filter(Boolean);
        }
      }
    } catch (_) {}

    // Generate initial structured question suggestions
    const questionSuggestions = generateInterviewerQuestionSuggestions({
      targetRole: body.target_role,
      verifiedSkills,
      projects,
      seniority: body.seniority || 'mid'
    });

    const initialWorkspaceState = {
      questions: questionSuggestions,
      active_question_id: questionSuggestions[0]?.id || '',
      live_notes: '',
      private_observations: [],
      recording_consented: false,
      rubric_drafts: {}
    };

    // Insert invitation
    await c.env.DB.prepare(`
      INSERT INTO human_interview_invitation (
        id, organization_id, candidate_user_id, interviewer_user_id,
        target_role, job_description, resume_id, interview_type,
        scheduled_start_time, scheduled_end_time, timezone,
        status, candidate_token, interviewer_token, created_by_user_id
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'scheduled', ?, ?, ?)
    `).bind(
      invitationId,
      organizationId,
      body.candidate_user_id,
      user.id,
      body.target_role.trim(),
      body.job_description || null,
      body.resume_id || null,
      body.interview_type || 'technical_and_behavioral',
      body.scheduled_start_time,
      body.scheduled_end_time,
      body.timezone || 'UTC',
      candidateToken,
      interviewerToken,
      user.id
    ).run();

    // Insert human interview room
    await c.env.DB.prepare(`
      INSERT INTO human_interview_room (
        id, invitation_id, organization_id, room_status, workspace_state_json
      ) VALUES (?, ?, ?, 'waiting', ?)
    `).bind(
      roomId,
      invitationId,
      organizationId,
      JSON.stringify(initialWorkspaceState)
    ).run();

    await logAuditEvent(c, organizationId, user.id, 'HUMAN_INTERVIEW_SCHEDULED', 'human_interview_invitation', invitationId, {
      candidate_user_id: body.candidate_user_id,
      target_role: body.target_role,
      scheduled_start_time: body.scheduled_start_time
    });

    return c.json({
      success: true,
      invitation: {
        id: invitationId,
        room_id: roomId,
        candidate_user_id: body.candidate_user_id,
        candidate_name: candidate.full_name,
        candidate_email: candidate.email,
        target_role: body.target_role,
        scheduled_start_time: body.scheduled_start_time,
        scheduled_end_time: body.scheduled_end_time,
        timezone: body.timezone || 'UTC',
        status: 'scheduled',
        candidate_token: candidateToken,
        interviewer_token: interviewerToken,
        candidate_join_url: `/interviews?room=${roomId}&token=${candidateToken}`,
        interviewer_join_url: `/interviews?room=${roomId}&token=${interviewerToken}`
      }
    }, 201);
  });

  /**
   * GET /api/m4/human-interviews/candidates
   * List available candidate accounts for recruiter invitation modal
   */
  app.get('/m4/human-interviews/candidates', async (c) => {
    const user = await getSessionUser(c);
    if (!user) return c.json({ error: 'Unauthorized: Authentication required' }, 401);

    const isRecruiter = ['recruiter', 'hiring_manager', 'org_admin'].includes(user.role);
    if (!isRecruiter) {
      return c.json({ error: 'Forbidden: Only recruiters can query candidates list' }, 403);
    }

    const { results } = await c.env.DB.prepare(`
      SELECT u.id as user_id, u.full_name, u.email, p.target_role, p.experience_level
      FROM user_account u
      LEFT JOIN candidate_profile p ON u.id = p.user_id
      WHERE u.role = 'candidate'
      ORDER BY u.full_name ASC
    `).all();

    return c.json({ success: true, candidates: results || [] });
  });

  /**
   * GET /api/m4/human-interviews/invitations
   * List invitations for candidate or organization
   */
  app.get('/m4/human-interviews/invitations', async (c) => {
    const user = await getSessionUser(c);
    if (!user) return c.json({ error: 'Unauthorized: Authentication required' }, 401);

    const isRecruiter = ['recruiter', 'hiring_manager', 'org_admin'].includes(user.role);

    let query = `
      SELECT 
        i.*, r.id as room_id, r.room_status,
        cu.full_name as candidate_name, cu.email as candidate_email,
        iu.full_name as interviewer_name, iu.email as interviewer_email
      FROM human_interview_invitation i
      LEFT JOIN human_interview_room r ON r.invitation_id = i.id
      JOIN user_account cu ON i.candidate_user_id = cu.id
      JOIN user_account iu ON i.interviewer_user_id = iu.id
      WHERE i.organization_id = ?
    `;

    const params: any[] = [user.organization_id || 'org_default_public'];

    if (!isRecruiter) {
      query += ` AND i.candidate_user_id = ?`;
      params.push(user.id);
    }

    query += ` ORDER BY i.scheduled_start_time DESC`;

    const { results } = await c.env.DB.prepare(query).bind(...params).all();

    // Sanitize token output: candidates only see candidate_token, recruiters see both
    const invitations = (results || []).map((inv: any) => {
      const sanitized: any = { ...inv };
      if (!isRecruiter) {
        delete sanitized.interviewer_token;
      }
      sanitized.candidate_join_url = `/interviews?room=${inv.room_id}&token=${inv.candidate_token}`;
      if (isRecruiter) {
        sanitized.interviewer_join_url = `/interviews?room=${inv.room_id}&token=${inv.interviewer_token}`;
      }
      return sanitized;
    });

    return c.json({ success: true, invitations });
  });

  /**
   * GET /api/m4/human-interviews/invitations/:id
   */
  app.get('/m4/human-interviews/invitations/:id', async (c) => {
    const user = await getSessionUser(c);
    if (!user) return c.json({ error: 'Unauthorized: Authentication required' }, 401);

    const invitationId = c.req.param('id');
    const inv = await c.env.DB.prepare(`
      SELECT 
        i.*, r.id as room_id, r.room_status,
        cu.full_name as candidate_name, cu.email as candidate_email,
        iu.full_name as interviewer_name, iu.email as interviewer_email
      FROM human_interview_invitation i
      LEFT JOIN human_interview_room r ON r.invitation_id = i.id
      JOIN user_account cu ON i.candidate_user_id = cu.id
      JOIN user_account iu ON i.interviewer_user_id = iu.id
      WHERE i.id = ? AND i.organization_id = ?
    `).bind(invitationId, user.organization_id || 'org_default_public').first();

    if (!inv) return c.json({ error: 'Invitation not found' }, 404);

    const isRecruiter = ['recruiter', 'hiring_manager', 'org_admin'].includes(user.role);
    if (!isRecruiter && inv.candidate_user_id !== user.id) {
      return c.json({ error: 'Forbidden: Access denied to this invitation' }, 403);
    }

    const sanitized: any = { ...inv };
    if (!isRecruiter) delete sanitized.interviewer_token;

    return c.json({ success: true, invitation: sanitized });
  });

  /**
   * PATCH /api/m4/human-interviews/invitations/:id/respond
   * Candidate accepts or declines
   */
  app.patch('/m4/human-interviews/invitations/:id/respond', async (c) => {
    const user = await getSessionUser(c);
    if (!user) return c.json({ error: 'Unauthorized' }, 401);

    const invitationId = c.req.param('id');
    const body = await c.req.json().catch(() => ({}));
    const action = body.action; // 'accept' | 'decline'

    if (!['accept', 'decline'].includes(action)) {
      return c.json({ error: "Invalid action: must be 'accept' or 'decline'" }, 400);
    }

    const inv = await c.env.DB.prepare('SELECT * FROM human_interview_invitation WHERE id = ?')
      .bind(invitationId).first();
    if (!inv) return c.json({ error: 'Invitation not found' }, 404);

    if (inv.candidate_user_id !== user.id && !['recruiter', 'org_admin'].includes(user.role)) {
      return c.json({ error: 'Forbidden: Only candidate can respond to their invitation' }, 403);
    }

    const newStatus = action === 'accept' ? 'accepted' : 'declined';
    await c.env.DB.prepare(`
      UPDATE human_interview_invitation 
      SET status = ?, candidate_response_notes = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).bind(newStatus, body.notes || null, invitationId).run();

    return c.json({ success: true, status: newStatus });
  });

  /**
   * PATCH /api/m4/human-interviews/invitations/:id/reschedule
   */
  app.patch('/m4/human-interviews/invitations/:id/reschedule', async (c) => {
    const user = await getSessionUser(c);
    if (!user) return c.json({ error: 'Unauthorized' }, 401);

    const invitationId = c.req.param('id');
    const body = await c.req.json().catch(() => ({}));

    if (!body.scheduled_start_time || !body.scheduled_end_time) {
      return c.json({ error: 'scheduled_start_time and scheduled_end_time required' }, 400);
    }

    const inv = await c.env.DB.prepare('SELECT * FROM human_interview_invitation WHERE id = ?')
      .bind(invitationId).first();
    if (!inv) return c.json({ error: 'Invitation not found' }, 404);

    if (inv.candidate_user_id !== user.id && !['recruiter', 'hiring_manager', 'org_admin'].includes(user.role)) {
      return c.json({ error: 'Forbidden: Access denied' }, 403);
    }

    await c.env.DB.prepare(`
      UPDATE human_interview_invitation 
      SET scheduled_start_time = ?, scheduled_end_time = ?, timezone = ?,
          status = 'rescheduled', updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).bind(
      body.scheduled_start_time,
      body.scheduled_end_time,
      body.timezone || inv.timezone,
      invitationId
    ).run();

    return c.json({ success: true, status: 'rescheduled' });
  });

  /**
   * PATCH /api/m4/human-interviews/invitations/:id/cancel
   */
  app.patch('/m4/human-interviews/invitations/:id/cancel', async (c) => {
    const user = await getSessionUser(c);
    if (!user) return c.json({ error: 'Unauthorized' }, 401);

    const invitationId = c.req.param('id');
    const body = await c.req.json().catch(() => ({}));

    const inv = await c.env.DB.prepare('SELECT * FROM human_interview_invitation WHERE id = ?')
      .bind(invitationId).first();
    if (!inv) return c.json({ error: 'Invitation not found' }, 404);

    await c.env.DB.prepare(`
      UPDATE human_interview_invitation 
      SET status = 'cancelled', cancellation_reason = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).bind(body.cancellation_reason || 'Cancelled by participant', invitationId).run();

    await c.env.DB.prepare(`
      UPDATE human_interview_room SET room_status = 'closed', updated_at = CURRENT_TIMESTAMP
      WHERE invitation_id = ?
    `).bind(invitationId).run();

    return c.json({ success: true, status: 'cancelled' });
  });

  // =========================================================================
  // 2. SECURE ROOM JOIN & AUTHORIZATION
  // =========================================================================

  /**
   * POST /api/m4/human-interviews/rooms/join
   * Validates room token and authorizes participant
   */
  app.post('/m4/human-interviews/rooms/join', async (c) => {
    const body = await c.req.json().catch(() => ({}));
    const { room_id, token } = body;

    const auth = await verifyRoomParticipant(c, room_id, token);
    if (!auth) {
      return c.json({ error: 'Unauthorized: Invalid room ID or access token' }, 403);
    }

    const { room, invitation, role, userId } = auth;

    if (room.room_status === 'closed') {
      return c.json({ error: 'This interview room has been closed' }, 410);
    }

    // Update participant joined timestamp
    const now = new Date().toISOString();
    if (role === 'candidate') {
      await c.env.DB.prepare(`
        UPDATE human_interview_room 
        SET candidate_joined_at = COALESCE(candidate_joined_at, ?), updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).bind(now, room_id).run();
    } else {
      await c.env.DB.prepare(`
        UPDATE human_interview_room 
        SET interviewer_joined_at = COALESCE(interviewer_joined_at, ?), updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).bind(now, room_id).run();
    }

    // If both have joined at some point, advance room to in_progress
    if (room.room_status === 'waiting' && ((role === 'candidate' && room.interviewer_joined_at) || (role === 'interviewer' && room.candidate_joined_at))) {
      await c.env.DB.prepare(`
        UPDATE human_interview_room 
        SET room_status = 'in_progress', started_at = COALESCE(started_at, ?), updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).bind(now, room_id).run();
      await c.env.DB.prepare(`
        UPDATE human_interview_invitation SET status = 'in_progress', updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).bind(room.invitation_id).run();
    }

    // Fetch candidate context and profile for workspace
    let candidateContext: any = null;
    try {
      const candUser = await c.env.DB.prepare('SELECT id, full_name, email FROM user_account WHERE id = ?')
        .bind(invitation.candidate_user_id).first();
      const profile = await c.env.DB.prepare('SELECT * FROM candidate_profile WHERE user_id = ?')
        .bind(invitation.candidate_user_id).first();
      const contextRow = await c.env.DB.prepare(`
        SELECT context_data_json FROM candidate_context 
        WHERE user_id = ? ORDER BY created_at DESC LIMIT 1
      `).bind(invitation.candidate_user_id).first();

      candidateContext = {
        name: candUser?.full_name || 'Candidate',
        email: candUser?.email || '',
        profile: profile ? {
          target_role: profile.target_role,
          experience_level: profile.experience_level,
          bio: profile.bio
        } : null,
        resume_data: contextRow?.context_data_json ? JSON.parse(contextRow.context_data_json as string) : null
      };
    } catch (_) {}

    let workspaceState: any = {};
    try {
      workspaceState = JSON.parse(room.workspace_state_json || '{}');
    } catch (_) {}

    return c.json({
      success: true,
      room_id,
      participant_role: role,
      user_id: userId,
      room_status: room.room_status,
      recording_enabled: Boolean(room.recording_enabled),
      candidate_recording_consent: Boolean(room.candidate_recording_consent),
      interviewer_recording_consent: Boolean(room.interviewer_recording_consent),
      invitation: {
        id: invitation.invitation_id,
        target_role: invitation.target_role,
        interview_type: invitation.interview_type,
        scheduled_start_time: invitation.scheduled_start_time,
        scheduled_end_time: invitation.scheduled_end_time,
        timezone: invitation.timezone
      },
      candidate_context: candidateContext,
      workspace_state: workspaceState
    });
  });

  // =========================================================================
  // 3. REAL-TIME WEBRTC SIGNALING
  // =========================================================================

  /**
   * POST /api/m4/human-interviews/rooms/:id/signal
   * Send WebRTC signal (offer, answer, ice-candidate, presence, control)
   */
  app.post('/m4/human-interviews/rooms/:id/signal', async (c) => {
    const roomId = c.req.param('id');
    const body = await c.req.json().catch(() => ({}));
    const { token, signal_type, payload } = body;

    const auth = await verifyRoomParticipant(c, roomId, token);
    if (!auth) return c.json({ error: 'Unauthorized' }, 403);

    if (!['offer', 'answer', 'ice-candidate', 'presence', 'control'].includes(signal_type)) {
      return c.json({ error: 'Invalid signal_type' }, 400);
    }

    const signalId = crypto.randomUUID();
    const now = Date.now();

    await c.env.DB.prepare(`
      INSERT INTO human_interview_signal (
        id, room_id, sender_user_id, sender_role, signal_type, signal_payload_json, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `).bind(
      signalId,
      roomId,
      auth.userId,
      auth.role,
      signal_type,
      JSON.stringify(payload || {}),
      now
    ).run();

    // Maintenance: prune signals older than 15 minutes
    try {
      const cutoff = now - (15 * 60 * 1000);
      await c.env.DB.prepare('DELETE FROM human_interview_signal WHERE room_id = ? AND created_at < ?')
        .bind(roomId, cutoff).run();
    } catch (_) {}

    return c.json({ success: true, signal_id: signalId, timestamp: now });
  });

  /**
   * GET /api/m4/human-interviews/rooms/:id/signals
   * Retrieve signals from the other participant since timestamp
   */
  app.get('/m4/human-interviews/rooms/:id/signals', async (c) => {
    const roomId = c.req.param('id');
    const token = c.req.query('token') || '';
    const since = parseInt(c.req.query('since') || '0', 10);

    const auth = await verifyRoomParticipant(c, roomId, token);
    if (!auth) return c.json({ error: 'Unauthorized' }, 403);

    // Filter signals sent by the opposing role
    const opposingRole = auth.role === 'candidate' ? 'interviewer' : 'candidate';

    const { results } = await c.env.DB.prepare(`
      SELECT id, sender_role, signal_type, signal_payload_json, created_at
      FROM human_interview_signal
      WHERE room_id = ? AND sender_role = ? AND created_at > ?
      ORDER BY created_at ASC
    `).bind(roomId, opposingRole, since).all();

    const signals = (results || []).map((row: any) => {
      let payload = {};
      try {
        payload = JSON.parse(row.signal_payload_json);
      } catch (_) {}
      return {
        id: row.id,
        sender_role: row.sender_role,
        signal_type: row.signal_type,
        payload,
        created_at: row.created_at
      };
    });

    return c.json({ success: true, signals });
  });

  // =========================================================================
  // 4. WORKSPACE SYNC & RECORDING CONSENT
  // =========================================================================

  /**
   * PATCH /api/m4/human-interviews/rooms/:id/workspace
   * Interviewer syncs notes, selected questions, and live rubric drafts
   */
  app.patch('/m4/human-interviews/rooms/:id/workspace', async (c) => {
    const roomId = c.req.param('id');
    const body = await c.req.json().catch(() => ({}));
    const { token, workspace_state } = body;

    const auth = await verifyRoomParticipant(c, roomId, token);
    if (!auth || auth.role !== 'interviewer') {
      return c.json({ error: 'Forbidden: Only the interviewer can update workspace state' }, 403);
    }

    await c.env.DB.prepare(`
      UPDATE human_interview_room 
      SET workspace_state_json = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).bind(JSON.stringify(workspace_state || {}), roomId).run();

    return c.json({ success: true });
  });

  /**
   * POST /api/m4/human-interviews/rooms/:id/consent
   * Participant sets recording consent. Recording is only enabled if BOTH consent.
   */
  app.post('/m4/human-interviews/rooms/:id/consent', async (c) => {
    const roomId = c.req.param('id');
    const body = await c.req.json().catch(() => ({}));
    const { token, consented } = body;

    const auth = await verifyRoomParticipant(c, roomId, token);
    if (!auth) return c.json({ error: 'Unauthorized' }, 403);

    const consentVal = consented ? 1 : 0;
    if (auth.role === 'candidate') {
      await c.env.DB.prepare(`
        UPDATE human_interview_room 
        SET candidate_recording_consent = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).bind(consentVal, roomId).run();
    } else {
      await c.env.DB.prepare(`
        UPDATE human_interview_room 
        SET interviewer_recording_consent = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).bind(consentVal, roomId).run();
    }

    const room = await c.env.DB.prepare(`
      SELECT candidate_recording_consent, interviewer_recording_consent 
      FROM human_interview_room WHERE id = ?
    `).bind(roomId).first();

    const recordingEnabled = (room?.candidate_recording_consent === 1 && room?.interviewer_recording_consent === 1) ? 1 : 0;
    await c.env.DB.prepare('UPDATE human_interview_room SET recording_enabled = ? WHERE id = ?')
      .bind(recordingEnabled, roomId).run();

    return c.json({
      success: true,
      role: auth.role,
      consented: Boolean(consentVal),
      recording_enabled: Boolean(recordingEnabled)
    });
  });

  // =========================================================================
  // 5. POST-INTERVIEW HUMAN EVALUATION & SYNTHESIS
  // =========================================================================

  /**
   * POST /api/m4/human-interviews/rooms/:id/complete
   * Conclude interview and record human interviewer evaluation + M05 package
   */
  app.post('/m4/human-interviews/rooms/:id/complete', async (c) => {
    try {
      const roomId = c.req.param('id');
      const body = await c.req.json().catch(() => ({}));
      const { token, evaluation } = body;

      const auth = await verifyRoomParticipant(c, roomId, token);
      if (!auth || auth.role !== 'interviewer') {
        return c.json({ error: 'Forbidden: Only the interviewer can conclude the interview and submit evaluation' }, 403);
      }

      const validation = validateEvaluationPayload(evaluation);
      if (!validation.valid) {
        return c.json({ error: validation.error }, 400);
      }

      const evalId = crypto.randomUUID();
      const organizationId = auth.room.organization_id;

      // Synthesize Module 5 Evidence Package
      const m05EvidencePackage = synthesizeHumanInterviewM05Package({
        invitation: auth.invitation,
        evaluation: {
          id: evalId,
          room_id: roomId,
          invitation_id: auth.room.invitation_id,
          interviewer_user_id: auth.invitation.interviewer_user_id,
          candidate_user_id: auth.invitation.candidate_user_id,
          organization_id: organizationId,
          overall_recommendation: evaluation.overall_recommendation,
          competency_scores: evaluation.competency_scores || {},
          interviewer_notes: evaluation.interviewer_notes,
          private_observations: evaluation.private_observations || [],
          m05_evidence_package: {}
        }
      });

      await c.env.DB.prepare(`
        INSERT INTO human_interview_evaluation (
          id, room_id, invitation_id, interviewer_user_id, candidate_user_id, organization_id,
          overall_recommendation, competency_scores_json, interviewer_notes,
          private_observations_json, m05_evidence_package_json
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).bind(
        evalId,
        roomId,
        auth.room.invitation_id,
        auth.invitation.interviewer_user_id,
        auth.invitation.candidate_user_id,
        organizationId,
        evaluation.overall_recommendation,
        JSON.stringify(evaluation.competency_scores || {}),
        evaluation.interviewer_notes,
        JSON.stringify(evaluation.private_observations || []),
        JSON.stringify(m05EvidencePackage)
      ).run();

      // Mark room and invitation completed
      const now = new Date().toISOString();
      await c.env.DB.prepare(`
        UPDATE human_interview_room 
        SET room_status = 'completed', ended_at = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).bind(now, roomId).run();

      await c.env.DB.prepare(`
        UPDATE human_interview_invitation 
        SET status = 'completed', updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).bind(auth.room.invitation_id).run();

      await logAuditEvent(c, organizationId, auth.userId, 'HUMAN_INTERVIEW_COMPLETED', 'human_interview_room', roomId, {
        recommendation: evaluation.overall_recommendation,
        eval_id: evalId
      });

      return c.json({
        success: true,
        evaluation_id: evalId,
        m05_evidence_package: m05EvidencePackage
      });
    } catch (err: any) {
      console.error('Error concluding interview room:', err);
      return c.json({ error: err.message || 'Failed to complete interview' }, 500);
    }
  });

  /**
   * GET /api/m4/human-interviews/rooms/:id/evaluation
   */
  app.get('/m4/human-interviews/rooms/:id/evaluation', async (c) => {
    const roomId = c.req.param('id');
    const token = c.req.query('token') || '';

    const auth = await verifyRoomParticipant(c, roomId, token);
    if (!auth) return c.json({ error: 'Unauthorized' }, 403);

    const row = await c.env.DB.prepare(`
      SELECT * FROM human_interview_evaluation WHERE room_id = ?
    `).bind(roomId).first();

    if (!row) return c.json({ error: 'Evaluation not found' }, 404);

    return c.json({
      success: true,
      evaluation: {
        id: row.id,
        room_id: row.room_id,
        overall_recommendation: row.overall_recommendation,
        competency_scores: JSON.parse(row.competency_scores_json as string || '{}'),
        interviewer_notes: row.interviewer_notes,
        private_observations: auth.role === 'interviewer' ? JSON.parse(row.private_observations_json as string || '[]') : [],
        m05_evidence_package: JSON.parse(row.m05_evidence_package_json as string || '{}'),
        created_at: row.created_at
      }
    });
  });
}
