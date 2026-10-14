import React, { useState, useEffect } from 'react';
import {
  Calendar, Clock, User, CheckCircle, XCircle, Plus, Copy, Check,
  Video, ArrowRight, RefreshCw, AlertCircle, Shield, Globe
} from 'lucide-react';
import {
  HumanInterviewInvitation,
  HumanInterviewType
} from '../../../shared/m4HumanInterviewContracts';

interface HumanInterviewSchedulingCardProps {
  currentUser: any;
  onJoinRoom: (roomId: string, token: string) => void;
}

export const HumanInterviewSchedulingCard: React.FC<HumanInterviewSchedulingCardProps> = ({
  currentUser,
  onJoinRoom
}) => {
  const isRecruiter = ['recruiter', 'hiring_manager', 'org_admin'].includes(currentUser?.role || '');

  // State
  const [invitations, setInvitations] = useState<any[]>([]);
  const [candidates, setCandidates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Form State for New Invitation
  const [selectedCandidateId, setSelectedCandidateId] = useState<string>('');
  const [targetRole, setTargetRole] = useState<string>('Senior Cloud & Systems Architect');
  const [jobDescription, setJobDescription] = useState<string>('Lead architecture for high-throughput, fault-tolerant edge distributed systems.');
  const [interviewType, setInterviewType] = useState<HumanInterviewType>('technical_and_behavioral');
  const [startDate, setStartDate] = useState<string>(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    d.setHours(14, 0, 0, 0);
    return d.toISOString().slice(0, 16);
  });
  const [endDate, setEndDate] = useState<string>(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    d.setHours(15, 0, 0, 0);
    return d.toISOString().slice(0, 16);
  });
  const [timezone, setTimezone] = useState<string>('UTC');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Load Invitations and Candidates
  const loadData = async () => {
    try {
      setLoading(true);
      const invRes = await fetch('/api/m4/human-interviews/invitations');
      const invData = await invRes.json() as any;
      if (invData.success) {
        setInvitations(invData.invitations || []);
      }

      if (isRecruiter) {
        const candRes = await fetch('/api/m4/human-interviews/candidates');
        const candData = await candRes.json() as any;
        if (candData.success && candData.candidates) {
          setCandidates(candData.candidates);
          if (candData.candidates[0] && !selectedCandidateId) {
            setSelectedCandidateId(candData.candidates[0].user_id);
          }
        }
      }
    } catch (err: any) {
      console.error('Failed loading human interview data', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [currentUser]);

  // Handle Create Invitation Submit
  const handleScheduleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCandidateId) {
      setActionError('Please select a candidate');
      return;
    }

    setIsSubmitting(true);
    setActionError(null);

    try {
      const payload = {
        candidate_user_id: selectedCandidateId,
        target_role: targetRole.trim(),
        job_description: jobDescription.trim(),
        interview_type: interviewType,
        scheduled_start_time: new Date(startDate).toISOString(),
        scheduled_end_time: new Date(endDate).toISOString(),
        timezone
      };

      const res = await fetch('/api/m4/human-interviews/invitations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json() as any;
      if (data.success) {
        setShowScheduleModal(false);
        await loadData();
      } else {
        setActionError(data.error || 'Failed to create interview invitation');
      }
    } catch (err: any) {
      setActionError(err.message || 'Network error scheduling interview');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Candidate Respond (Accept / Decline)
  const handleCandidateResponse = async (invitationId: string, action: 'accept' | 'decline') => {
    try {
      const res = await fetch(`/api/m4/human-interviews/invitations/${invitationId}/respond`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action })
      });
      const data = await res.json() as any;
      if (data.success) {
        await loadData();
      }
    } catch (err) {
      console.error('Failed responding to invitation', err);
    }
  };

  const copyUrl = (url: string, id: string) => {
    const fullUrl = window.location.origin + url;
    navigator.clipboard.writeText(fullUrl);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <div className="bg-[#001f2e] border border-[#063750] rounded-2xl p-6 shadow-lg space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#002a40]">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-[#FF4103]/10 border border-[#FF4103]/30 text-[#FF4103] text-[10px] font-bold uppercase tracking-wider">
                M04 Phase 2 · Human Live Collaboration
              </span>
              <span className="px-2 py-0.5 rounded-md bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[10px] font-bold">
                Live WebRTC Media Enabled
              </span>
            </div>
            <h3 className="text-white text-lg font-extrabold tracking-tight mt-1">
              Real Human HR Interview Scheduling & Live Video Rooms
            </h3>
            <p className="text-slate-400 text-xs mt-1">
              Schedule genuine interviews between real candidates and human recruiters. Both participants join protected peer-to-peer audio/video rooms with grounded evaluation workspaces.
            </p>
          </div>

          {isRecruiter && (
            <button
              onClick={() => setShowScheduleModal(true)}
              className="px-5 py-2.5 rounded-xl bg-[#FF4103] hover:bg-[#e03200] text-white text-xs font-bold flex items-center justify-center gap-2 shadow-lg shadow-[#FF4103]/25 transition-all shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>Schedule Human Interview</span>
            </button>
          )}
        </div>

        {/* Invariant Bar */}
        <div className="p-3 bg-[#001824] rounded-xl border border-[#063750] text-[11px] text-slate-400 flex items-start gap-2 leading-relaxed">
          <Shield className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
          <span>
            <strong>Authentic Human Engagement Invariant:</strong> AI assists recruiters with grounded question suggestions and private observation organization, but never impersonates human interviewers. Dual-party informed consent is required before any recording is enabled. Zero biometric profiling.
          </span>
        </div>
      </div>

      {/* Invitations List Work Surface */}
      <div className="bg-[#001f2e] border border-[#063750] rounded-2xl p-6 shadow-lg space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-[#002a40]">
          <h4 className="text-white text-sm font-bold flex items-center gap-2">
            <Calendar className="w-4 h-4 text-[#FF4103]" />
            <span>Scheduled & Active Human Interviews ({invitations.length})</span>
          </h4>
          <button
            onClick={loadData}
            className="p-1.5 rounded-lg bg-[#001824] hover:bg-[#00283d] text-slate-400 hover:text-white border border-[#063750]"
            title="Refresh list"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {loading ? (
          <div className="p-8 text-center text-slate-400 text-xs">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto text-[#FF4103] mb-2" />
            Loading scheduled interviews...
          </div>
        ) : invitations.length === 0 ? (
          <div className="p-8 text-center text-slate-400 text-xs space-y-2">
            <AlertCircle className="w-8 h-8 text-slate-500 mx-auto" />
            <p>No human interview sessions scheduled yet.</p>
            {isRecruiter && (
              <p className="text-[11px]">Click "Schedule Human Interview" above to invite a candidate to a live room.</p>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {invitations.map((inv) => {
              const token = isRecruiter ? inv.interviewer_token : inv.candidate_token;
              const joinUrl = isRecruiter ? inv.interviewer_join_url : inv.candidate_join_url;
              const canJoin = ['scheduled', 'accepted', 'in_progress', 'waiting'].includes(inv.status);

              return (
                <div
                  key={inv.id}
                  className="p-4 bg-[#001824] border border-[#063750] hover:border-[#002f47] rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all"
                >
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2">
                      <span className="text-white font-bold text-sm">
                        {inv.target_role}
                      </span>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                        inv.status === 'completed' ? 'bg-emerald-950 text-emerald-400 border border-emerald-500/30' :
                        inv.status === 'accepted' || inv.status === 'in_progress' ? 'bg-blue-950 text-blue-400 border border-blue-500/30' :
                        inv.status === 'declined' || inv.status === 'cancelled' ? 'bg-rose-950 text-rose-400 border border-rose-500/30' :
                        'bg-amber-950 text-amber-400 border border-amber-500/30'
                      }`}>
                        {inv.status}
                      </span>
                      <span className="text-slate-400 text-[10px] font-semibold capitalize">
                        · {inv.interview_type?.replace(/_/g, ' ')}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400">
                      <span className="flex items-center gap-1 text-slate-300">
                        <User className="w-3.5 h-3.5 text-slate-400" />
                        Candidate: {inv.candidate_name || inv.candidate_email}
                      </span>
                      {isRecruiter && (
                        <span className="flex items-center gap-1">
                          Interviewer: {inv.interviewer_name || inv.interviewer_email}
                        </span>
                      )}
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        {new Date(inv.scheduled_start_time).toLocaleString([], {
                          month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                        })} ({inv.timezone || 'UTC'})
                      </span>
                    </div>

                    {inv.candidate_response_notes && (
                      <p className="text-xs text-slate-300 italic pt-1">
                        Candidate Note: "{inv.candidate_response_notes}"
                      </p>
                    )}
                  </div>

                  {/* Actions Dock */}
                  <div className="flex items-center gap-2 shrink-0">
                    {/* Candidate Accept / Decline Actions */}
                    {!isRecruiter && inv.status === 'scheduled' && (
                      <div className="flex items-center gap-1.5 mr-2">
                        <button
                          type="button"
                          onClick={() => handleCandidateResponse(inv.id, 'accept')}
                          className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold"
                        >
                          Accept
                        </button>
                        <button
                          type="button"
                          onClick={() => handleCandidateResponse(inv.id, 'decline')}
                          className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-rose-900/40 text-slate-300 hover:text-rose-300 text-xs font-bold"
                        >
                          Decline
                        </button>
                      </div>
                    )}

                    {/* Copy Join Link Button */}
                    {joinUrl && (
                      <button
                        type="button"
                        onClick={() => copyUrl(joinUrl, inv.id)}
                        className="p-2 rounded-lg bg-[#001f2e] hover:bg-[#002a40] text-slate-300 border border-[#063750] text-xs font-semibold flex items-center gap-1"
                        title="Copy participant join link"
                      >
                        {copiedId === inv.id ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    )}

                    {/* Join Live Room Button */}
                    {canJoin && inv.room_id && token && (
                      <button
                        type="button"
                        onClick={() => onJoinRoom(inv.room_id, token)}
                        className="px-4 py-2 rounded-xl bg-[#FF4103] hover:bg-[#e03200] text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-[#FF4103]/20 transition-all"
                      >
                        <Video className="w-3.5 h-3.5" />
                        <span>Enter Live Room</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* SCHEDULE HUMAN INTERVIEW MODAL (RECRUITER ONLY)                           */}
      {/* ========================================================================= */}
      {showScheduleModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#001f2e] border border-[#063750] rounded-2xl max-w-xl w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#002a40]">
              <div>
                <h3 className="text-white text-base font-bold">Schedule Human HR Interview</h3>
                <p className="text-slate-400 text-xs mt-0.5">
                  Invite candidate to a live peer-to-peer audio/video room with anchored workspace.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowScheduleModal(false)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            {actionError && (
              <div className="p-3 bg-rose-950/30 border border-rose-500/30 rounded-xl text-rose-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{actionError}</span>
              </div>
            )}

            <form onSubmit={handleScheduleSubmit} className="space-y-4 text-xs">
              {/* Select Candidate */}
              <div className="space-y-1">
                <label className="text-white font-bold block">Select Candidate:</label>
                <select
                  value={selectedCandidateId}
                  onChange={e => setSelectedCandidateId(e.target.value)}
                  className="w-full bg-[#001824] border border-[#063750] rounded-xl p-2.5 text-white focus:outline-none focus:border-[#FF4103]"
                  required
                >
                  {candidates.length > 0 ? (
                    candidates.map(c => (
                      <option key={c.user_id} value={c.user_id}>
                        {c.full_name} ({c.email}) · {c.target_role || 'Candidate'}
                      </option>
                    ))
                  ) : (
                    <option value="9c6711d1-4e12-49be-a5a0-a0cc9bb168f1">
                      MOKSHITH Y (instatimetogrow@gmail.com)
                    </option>
                  )}
                </select>
              </div>

              {/* Target Role */}
              <div className="space-y-1">
                <label className="text-white font-bold block">Target Job Role:</label>
                <input
                  type="text"
                  value={targetRole}
                  onChange={e => setTargetRole(e.target.value)}
                  className="w-full bg-[#001824] border border-[#063750] rounded-xl p-2.5 text-white focus:outline-none focus:border-[#FF4103]"
                  required
                />
              </div>

              {/* Interview Format */}
              <div className="space-y-1">
                <label className="text-white font-bold block">Interview Format / Type:</label>
                <select
                  value={interviewType}
                  onChange={e => setInterviewType(e.target.value as HumanInterviewType)}
                  className="w-full bg-[#001824] border border-[#063750] rounded-xl p-2.5 text-white focus:outline-none focus:border-[#FF4103]"
                >
                  <option value="technical_and_behavioral">Technical & Behavioral Panel (Comprehensive)</option>
                  <option value="technical_deep_dive">Technical Deep Dive & Architecture</option>
                  <option value="behavioral_hr">Behavioral HR & Culture Standards</option>
                  <option value="executive_panel">Executive Leadership Panel</option>
                  <option value="system_architecture">System Architecture & Resilience</option>
                </select>
              </div>

              {/* Dates & Timezone Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-white font-bold block">Start Date & Time:</label>
                  <input
                    type="datetime-local"
                    value={startDate}
                    onChange={e => setStartDate(e.target.value)}
                    className="w-full bg-[#001824] border border-[#063750] rounded-xl p-2.5 text-white focus:outline-none focus:border-[#FF4103]"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-white font-bold block">End Date & Time:</label>
                  <input
                    type="datetime-local"
                    value={endDate}
                    onChange={e => setEndDate(e.target.value)}
                    className="w-full bg-[#001824] border border-[#063750] rounded-xl p-2.5 text-white focus:outline-none focus:border-[#FF4103]"
                    required
                  />
                </div>
              </div>

              {/* Job Description Context */}
              <div className="space-y-1">
                <label className="text-white font-bold block">Job Context & Goals:</label>
                <textarea
                  rows={2}
                  value={jobDescription}
                  onChange={e => setJobDescription(e.target.value)}
                  className="w-full bg-[#001824] border border-[#063750] rounded-xl p-2 text-white focus:outline-none focus:border-[#FF4103]"
                />
              </div>

              {/* Buttons */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#002a40]">
                <button
                  type="button"
                  onClick={() => setShowScheduleModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-2.5 rounded-xl bg-[#FF4103] hover:bg-[#e03200] disabled:opacity-50 text-white text-xs font-bold shadow-lg shadow-[#FF4103]/25 flex items-center gap-2"
                >
                  <CheckCircle className="w-3.5 h-3.5" />
                  <span>{isSubmitting ? 'Scheduling...' : 'Create & Invite Candidate'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
