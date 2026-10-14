import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Video, VideoOff, Mic, MicOff, PhoneOff, Settings, Shield, Sparkles,
  User, CheckCircle, AlertTriangle, Clock, RefreshCw, Send,
  FileText, Check, ChevronRight, Layers, Eye, HelpCircle, Lock,
  Share2, Copy
} from 'lucide-react';
import {
  HumanInterviewInvitation,
  HumanInterviewRoom,
  WorkspaceQuestionItem,
  InterviewerWorkspaceState,
  RecommendationType,
  ParticipantRole
} from '../../../shared/m4HumanInterviewContracts';

interface HumanInterviewLiveRoomProps {
  roomId: string;
  token: string;
  onExit: () => void;
}

export const HumanInterviewLiveRoom: React.FC<HumanInterviewLiveRoomProps> = ({
  roomId,
  token,
  onExit
}) => {
  // Session & Participant State
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [participantRole, setParticipantRole] = useState<ParticipantRole>('candidate');
  const [room, setRoom] = useState<any>(null);
  const [invitation, setInvitation] = useState<any>(null);
  const [candidateContext, setCandidateContext] = useState<any>(null);

  // WebRTC Media State
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [isMicMuted, setIsMicMuted] = useState(false);
  const [isCameraOff, setIsCameraOff] = useState(false);
  const [availableDevices, setAvailableDevices] = useState<{ audio: MediaDeviceInfo[]; video: MediaDeviceInfo[] }>({ audio: [], video: [] });
  const [selectedAudioDevice, setSelectedAudioDevice] = useState<string>('');
  const [selectedVideoDevice, setSelectedVideoDevice] = useState<string>('');
  const [connectionState, setConnectionState] = useState<'connecting' | 'waiting' | 'connected' | 'reconnecting' | 'failed'>('waiting');
  const [peerPresence, setPeerPresence] = useState<boolean>(false);

  // Recording & Governance State
  const [recordingConsented, setRecordingConsented] = useState<boolean>(false);
  const [recordingEnabled, setRecordingEnabled] = useState<boolean>(false);

  // Interviewer Workspace State
  const [workspaceQuestions, setWorkspaceQuestions] = useState<WorkspaceQuestionItem[]>([]);
  const [activeQuestionId, setActiveQuestionId] = useState<string>('');
  const [liveNotes, setLiveNotes] = useState<string>('');
  const [quickObservation, setQuickObservation] = useState<string>('');
  const [selectedCompetency, setSelectedCompetency] = useState<string>('Technical Execution');
  const [observationsList, setObservationsList] = useState<Array<{ timestamp: string; competency: string; text: string }>>([]);
  const [isSavingWorkspace, setIsSavingWorkspace] = useState(false);

  // Post-Interview Evaluation State
  const [showEvaluationModal, setShowEvaluationModal] = useState(false);
  const [overallRecommendation, setOverallRecommendation] = useState<RecommendationType>('hire');
  const [finalEvaluationNotes, setFinalEvaluationNotes] = useState('');
  const [competencyScores, setCompetencyScores] = useState<Record<string, { rating: number; rubric_level: string; evidence: string }>>({
    'Technical Execution': { rating: 4, rubric_level: 'L4 Strong', evidence: 'Solid grasp of core architectural patterns.' },
    'Behavioral STAR & Alignment': { rating: 4, rubric_level: 'L4 Strong', evidence: 'Demonstrated clear ownership and constructive conflict resolution.' },
    'Failure Resilience & Triage': { rating: 4, rubric_level: 'L4 Strong', evidence: 'Calm and methodical incident troubleshooting.' }
  });
  const [isSubmittingEvaluation, setIsSubmittingEvaluation] = useState(false);
  const [evaluationError, setEvaluationError] = useState<string | null>(null);
  const [completedSynthesis, setCompletedSynthesis] = useState<any>(null);

  // References
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const pendingIceCandidatesRef = useRef<RTCIceCandidateInit[]>([]);
  const lastSignalTimeRef = useRef<number>(0);
  const pollIntervalRef = useRef<any>(null);
  const copyToastRef = useRef<boolean>(false);
  const [copiedLink, setCopiedLink] = useState(false);

  // =========================================================================
  // 1. INITIALIZE ROOM & AUTHORIZE PARTICIPANT
  // =========================================================================
  useEffect(() => {
    let isMounted = true;

    const joinRoom = async () => {
      try {
        setLoading(true);
        setError(null);

        const res = await fetch('/api/m4/human-interviews/rooms/join', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ room_id: roomId, token })
        });

        const data = await res.json() as any;
        if (!data.success) {
          setError(data.error || 'Failed to join interview room');
          setLoading(false);
          return;
        }

        if (!isMounted) return;

        setParticipantRole(data.participant_role);
        setRoom(data);
        setInvitation(data.invitation);
        setCandidateContext(data.candidate_context);
        setRecordingEnabled(data.recording_enabled);
        setRecordingConsented(
          data.participant_role === 'candidate'
            ? data.candidate_recording_consent
            : data.interviewer_recording_consent
        );

        if (data.workspace_state?.questions) {
          setWorkspaceQuestions(data.workspace_state.questions);
          setActiveQuestionId(data.workspace_state.active_question_id || data.workspace_state.questions[0]?.id || '');
          setLiveNotes(data.workspace_state.live_notes || '');
          setObservationsList(data.workspace_state.private_observations || []);
        }

        setLoading(false);
      } catch (err: any) {
        if (isMounted) {
          setError(err.message || 'Network error connecting to room');
          setLoading(false);
        }
      }
    };

    joinRoom();

    return () => {
      isMounted = false;
    };
  }, [roomId, token]);

  // =========================================================================
  // 2. WEBRTC MEDIA SETUP & PEER CONNECTION
  // =========================================================================
  const initLocalMedia = useCallback(async () => {
    try {
      const constraints: MediaStreamConstraints = {
        audio: selectedAudioDevice ? { deviceId: { exact: selectedAudioDevice } } : true,
        video: selectedVideoDevice ? { deviceId: { exact: selectedVideoDevice }, width: { ideal: 1280 }, height: { ideal: 720 } } : true
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      setLocalStream(stream);

      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }

      // Enumerate available devices
      try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const audioDevices = devices.filter(d => d.kind === 'audioinput');
        const videoDevices = devices.filter(d => d.kind === 'videoinput');
        setAvailableDevices({ audio: audioDevices, video: videoDevices });
      } catch (_) {}

      return stream;
    } catch (err: any) {
      console.warn('getUserMedia error, attempting audio-only fallback:', err);
      try {
        const audioOnlyStream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
        setLocalStream(audioOnlyStream);
        setIsCameraOff(true);
        if (localVideoRef.current) localVideoRef.current.srcObject = audioOnlyStream;
        return audioOnlyStream;
      } catch (audioErr: any) {
        console.error('All media devices denied or unavailable:', audioErr);
        setError('Camera or microphone access denied. You can still participate in the interview workspace.');
        return null;
      }
    }
  }, [selectedAudioDevice, selectedVideoDevice]);

  // Send Signal Helper
  const sendSignal = useCallback(async (type: string, payload: any) => {
    try {
      await fetch(`/api/m4/human-interviews/rooms/${roomId}/signal`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, signal_type: type, payload })
      });
    } catch (err) {
      console.error('Failed to send WebRTC signal', err);
    }
  }, [roomId, token]);

  // Initialize WebRTC Peer Connection
  useEffect(() => {
    if (loading || error) return;

    let pc: RTCPeerConnection | null = null;

    const setupPeerConnection = async () => {
      const stream = await initLocalMedia();

      const configuration: RTCConfiguration = {
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' },
          { urls: 'stun:stun1.l.google.com:19302' }
        ]
      };

      pc = new RTCPeerConnection(configuration);
      peerConnectionRef.current = pc;

      // Add local media tracks
      if (stream) {
        stream.getTracks().forEach(track => {
          if (pc && stream) pc.addTrack(track, stream);
        });
      }

      // Handle remote media track reception
      pc.ontrack = (event) => {
        if (event.streams && event.streams[0]) {
          setRemoteStream(event.streams[0]);
          if (remoteVideoRef.current) {
            remoteVideoRef.current.srcObject = event.streams[0];
          }
        }
      };

      // Handle ICE Candidate generation
      pc.onicecandidate = (event) => {
        if (event.candidate) {
          sendSignal('ice-candidate', event.candidate);
        }
      };

      // Handle ICE Connection State changes
      pc.oniceconnectionstatechange = () => {
        if (!pc) return;
        const state = pc.iceConnectionState;
        if (state === 'connected' || state === 'completed') {
          setConnectionState('connected');
          setPeerPresence(true);
        } else if (state === 'checking') {
          setConnectionState('connecting');
        } else if (state === 'disconnected') {
          setConnectionState('reconnecting');
        } else if (state === 'failed') {
          setConnectionState('failed');
        }
      };

      // If Interviewer, create initial Offer
      if (participantRole === 'interviewer') {
        try {
          const offer = await pc.createOffer({
            offerToReceiveAudio: true,
            offerToReceiveVideo: true
          });
          await pc.setLocalDescription(offer);
          await sendSignal('offer', offer);
        } catch (offerErr) {
          console.error('Failed creating initial WebRTC offer', offerErr);
        }
      }

      // Announce presence
      await sendSignal('presence', { role: participantRole, online: true });
    };

    setupPeerConnection();

    // Polling loop for opposing WebRTC signals
    pollIntervalRef.current = setInterval(async () => {
      try {
        const since = lastSignalTimeRef.current;
        const res = await fetch(`/api/m4/human-interviews/rooms/${roomId}/signals?token=${token}&since=${since}`);
        const data = await res.json() as any;

        if (data.success && data.signals && data.signals.length > 0) {
          for (const sig of data.signals) {
            lastSignalTimeRef.current = Math.max(lastSignalTimeRef.current, sig.created_at);
            const currentPc = peerConnectionRef.current;
            if (!currentPc) continue;

            if (sig.signal_type === 'presence') {
              setPeerPresence(true);
            } else if (sig.signal_type === 'offer' && participantRole === 'candidate') {
              await currentPc.setRemoteDescription(new RTCSessionDescription(sig.payload));
              // Process any pending queued ICE candidates
              while (pendingIceCandidatesRef.current.length > 0) {
                const candidate = pendingIceCandidatesRef.current.shift();
                if (candidate) await currentPc.addIceCandidate(new RTCIceCandidate(candidate));
              }
              const answer = await currentPc.createAnswer();
              await currentPc.setLocalDescription(answer);
              await sendSignal('answer', answer);
            } else if (sig.signal_type === 'answer' && participantRole === 'interviewer') {
              if (currentPc.signalingState === 'have-local-offer') {
                await currentPc.setRemoteDescription(new RTCSessionDescription(sig.payload));
                while (pendingIceCandidatesRef.current.length > 0) {
                  const candidate = pendingIceCandidatesRef.current.shift();
                  if (candidate) await currentPc.addIceCandidate(new RTCIceCandidate(candidate));
                }
              }
            } else if (sig.signal_type === 'ice-candidate') {
              if (currentPc.remoteDescription && currentPc.remoteDescription.type) {
                await currentPc.addIceCandidate(new RTCIceCandidate(sig.payload));
              } else {
                pendingIceCandidatesRef.current.push(sig.payload);
              }
            } else if (sig.signal_type === 'control') {
              if (sig.payload?.ended) {
                setConnectionState('failed');
              }
            }
          }
        }
      } catch (pollErr) {
        console.warn('Signal polling error', pollErr);
      }
    }, 800);

    return () => {
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
      if (pc) pc.close();
      if (localStream) {
        localStream.getTracks().forEach(t => t.stop());
      }
    };
  }, [loading, error, roomId, token, participantRole, initLocalMedia, sendSignal]);

  // Media Controls: Mic Mute / Unmute
  const toggleMic = () => {
    if (localStream) {
      const audioTrack = localStream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsMicMuted(!audioTrack.enabled);
        sendSignal('control', { mic_muted: !audioTrack.enabled });
      }
    }
  };

  // Media Controls: Camera Toggle
  const toggleCamera = () => {
    if (localStream) {
      const videoTrack = localStream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setIsCameraOff(!videoTrack.enabled);
        sendSignal('control', { camera_off: !videoTrack.enabled });
      }
    }
  };

  // Recording Consent Toggle
  const toggleRecordingConsent = async () => {
    const nextVal = !recordingConsented;
    setRecordingConsented(nextVal);
    try {
      const res = await fetch(`/api/m4/human-interviews/rooms/${roomId}/consent`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, consented: nextVal })
      });
      const data = await res.json() as any;
      if (data.success) {
        setRecordingEnabled(data.recording_enabled);
      }
    } catch (err) {
      console.error('Failed to update recording consent', err);
    }
  };

  // Sync Interviewer Workspace State
  const saveWorkspace = async () => {
    if (participantRole !== 'interviewer') return;
    setIsSavingWorkspace(true);
    try {
      const state: InterviewerWorkspaceState = {
        questions: workspaceQuestions,
        active_question_id: activeQuestionId,
        live_notes: liveNotes,
        private_observations: observationsList.map((obs, i) => ({
          id: `obs-${i}`,
          timestamp: obs.timestamp,
          competency: obs.competency,
          text: obs.text
        })),
        recording_consented: recordingConsented,
        rubric_drafts: competencyScores
      };

      await fetch(`/api/m4/human-interviews/rooms/${roomId}/workspace`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, workspace_state: state })
      });
    } catch (err) {
      console.error('Failed to save workspace', err);
    } finally {
      setIsSavingWorkspace(false);
    }
  };

  // Add Observation
  const addObservation = () => {
    if (!quickObservation.trim()) return;
    const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const newObs = {
      timestamp: now,
      competency: selectedCompetency,
      text: quickObservation.trim()
    };
    setObservationsList(prev => [newObs, ...prev]);
    setQuickObservation('');
  };

  // Conclude Interview & Submit Evaluation
  const submitFinalEvaluation = async () => {
    if (!finalEvaluationNotes.trim()) {
      setEvaluationError('Please enter detailed interviewer notes before concluding.');
      return;
    }
    setEvaluationError(null);
    setIsSubmittingEvaluation(true);
    try {
      const res = await fetch(`/api/m4/human-interviews/rooms/${roomId}/complete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token,
          evaluation: {
            overall_recommendation: overallRecommendation,
            interviewer_notes: finalEvaluationNotes,
            competency_scores: competencyScores,
            private_observations: observationsList
          }
        })
      });
      let data: any = {};
      try {
        data = await res.json();
      } catch (_) {
        data = { success: false, error: `Server response code: ${res.status}` };
      }
      if (data.success) {
        setCompletedSynthesis(data.m05_evidence_package);
        setShowEvaluationModal(false);
        await sendSignal('control', { ended: true });
      } else {
        setEvaluationError(data.error || 'Failed to submit evaluation');
      }
    } catch (err: any) {
      console.error('Failed to complete interview', err);
      setEvaluationError(err.message || 'Failed to complete interview');
    } finally {
      setIsSubmittingEvaluation(false);
    }
  };

  const copyJoinLink = () => {
    const url = window.location.origin + `/interviews?room=${roomId}&token=${token}`;
    navigator.clipboard.writeText(url);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  // =========================================================================
  // RENDER LOADING & ERROR STATES
  // =========================================================================
  if (loading) {
    return (
      <div className="min-h-[500px] flex flex-col items-center justify-center p-8 text-center space-y-4">
        <RefreshCw className="w-8 h-8 text-[#FF4103] animate-spin" />
        <h3 className="text-white text-base font-bold">Connecting to Protected Live Interview Room...</h3>
        <p className="text-slate-400 text-xs">Authenticating participant tokens and configuring WebRTC signaling channels.</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 max-w-xl mx-auto bg-[#001f2e] border border-rose-500/30 rounded-2xl text-center space-y-4">
        <AlertTriangle className="w-10 h-10 text-rose-400 mx-auto" />
        <h3 className="text-white text-base font-bold">Unable to Enter Live Room</h3>
        <p className="text-slate-300 text-xs leading-relaxed">{error}</p>
        <button
          onClick={onExit}
          className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold transition-all"
        >
          Return to Interviews Dashboard
        </button>
      </div>
    );
  }

  // =========================================================================
  // RENDER POST-INTERVIEW SYNTHESIS COMPLETION
  // =========================================================================
  if (completedSynthesis) {
    return (
      <div className="space-y-6 max-w-4xl mx-auto">
        <div className="bg-[#001f2e] border border-emerald-500/30 rounded-2xl p-6 shadow-xl space-y-4">
          <div className="flex items-center gap-3">
            <CheckCircle className="w-8 h-8 text-emerald-400 shrink-0" />
            <div>
              <h3 className="text-white text-lg font-bold">Live Human Interview Concluded & Synthesized</h3>
              <p className="text-slate-400 text-xs">
                Official interview record sealed and exported to Module 5 Evidence Package.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-[#002a40]">
            <div className="bg-[#001824] p-4 rounded-xl border border-[#063750]">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Final Recommendation</span>
              <span className="text-emerald-400 font-extrabold text-base uppercase">
                {overallRecommendation.replace('_', ' ')}
              </span>
            </div>
            <div className="bg-[#001824] p-4 rounded-xl border border-[#063750]">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Candidate</span>
              <span className="text-white font-bold text-sm">
                {candidateContext?.name || 'Verified Candidate'}
              </span>
            </div>
            <div className="bg-[#001824] p-4 rounded-xl border border-[#063750]">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Target Role</span>
              <span className="text-white font-bold text-sm">
                {invitation?.target_role || 'Target Role'}
              </span>
            </div>
          </div>

          <div className="p-4 bg-[#001824] rounded-xl border border-[#063750] space-y-2">
            <span className="text-slate-400 text-xs font-bold block">Interviewer Evaluator Summary:</span>
            <p className="text-slate-200 text-xs leading-relaxed italic">
              "{finalEvaluationNotes}"
            </p>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <button
              onClick={onExit}
              className="px-6 py-2.5 rounded-xl bg-[#FF4103] hover:bg-[#e03200] text-white text-xs font-bold shadow-md shadow-[#FF4103]/20"
            >
              Back to Interview Cockpit
            </button>
          </div>
        </div>
      </div>
    );
  }

  // =========================================================================
  // RENDER LIVE INTERVIEW WORKSPACE & AUDIO/VIDEO ROOM
  // =========================================================================
  return (
    <div className="space-y-6">
      {/* Top Banner: Role & Security Invariants */}
      <div className="bg-[#001f2e] border border-[#063750] rounded-2xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-lg">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#001824] border border-[#063750] flex items-center justify-center text-[#FF4103]">
            <Video className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded-md bg-[#FF4103]/10 border border-[#FF4103]/30 text-[#FF4103] text-[10px] font-black uppercase tracking-wider">
                Live Human Interview
              </span>
              <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                connectionState === 'connected' ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-400' :
                connectionState === 'connecting' ? 'bg-amber-500/10 border border-amber-500/30 text-amber-400' :
                'bg-slate-800 text-slate-400'
              }`}>
                {connectionState === 'connected' ? '● WebRTC Connected' :
                 connectionState === 'connecting' ? '◌ Negotiating STUN...' :
                 'Waiting for Peer'}
              </span>
              <span className="px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 text-[10px] font-bold capitalize">
                Your Role: {participantRole}
              </span>
            </div>
            <h3 className="text-white text-sm font-bold tracking-tight mt-0.5">
              {invitation?.target_role || 'Candidate Interview'} · {invitation?.interview_type?.replace(/_/g, ' ')}
            </h3>
          </div>
        </div>

        {/* Action Controls & Recording Consent */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={copyJoinLink}
            className="px-3 py-1.5 rounded-xl bg-[#001824] hover:bg-[#00283d] text-slate-300 hover:text-white border border-[#063750] text-xs font-semibold flex items-center gap-1.5 transition-colors"
          >
            {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-slate-400" />}
            <span>{copiedLink ? 'Link Copied!' : 'Copy Room Link'}</span>
          </button>

          {/* Recording Consent Pill */}
          <button
            onClick={toggleRecordingConsent}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 border transition-all ${
              recordingConsented
                ? 'bg-rose-950/25 border-rose-500/30 text-rose-300'
                : 'bg-[#001824] border-[#063750] text-slate-400 hover:text-slate-200'
            }`}
          >
            <Shield className="w-3.5 h-3.5" />
            <span>{recordingConsented ? 'Recording Consent Given' : 'Consent to Recording'}</span>
          </button>

          {participantRole === 'interviewer' && (
            <button
              onClick={() => setShowEvaluationModal(true)}
              className="px-4 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md shadow-emerald-600/20 flex items-center gap-1.5"
            >
              <CheckCircle className="w-3.5 h-3.5" />
              <span>Conclude & Evaluate</span>
            </button>
          )}

          <button
            onClick={onExit}
            className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-rose-900/40 text-slate-300 hover:text-rose-300 text-xs font-bold transition-colors"
          >
            Leave Room
          </button>
        </div>
      </div>

      {/* Main Grid: Video Grid (Left) & Workspace / Agenda (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Live Video Streams (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-[#001824] border border-[#063750] rounded-2xl p-4 shadow-xl space-y-4">
            {/* Remote Participant Video Box */}
            <div className="relative aspect-video bg-[#00121c] rounded-xl overflow-hidden border border-[#002f47] flex items-center justify-center">
              <video
                ref={remoteVideoRef}
                autoPlay
                playsInline
                className="w-full h-full object-cover"
              />

              {!peerPresence && (
                <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center space-y-3 bg-[#00121c]/90">
                  <div className="w-16 h-16 rounded-full bg-[#001f2e] border border-[#063750] flex items-center justify-center text-slate-400">
                    <User className="w-8 h-8" />
                  </div>
                  <div>
                    <h4 className="text-white text-sm font-bold">Waiting for {participantRole === 'candidate' ? 'Interviewer' : 'Candidate'} to Join...</h4>
                    <p className="text-slate-400 text-xs max-w-sm mt-1">
                      Both participants must join this authorized room to exchange live video and audio.
                    </p>
                  </div>
                </div>
              )}

              {/* Remote Peer Overlay Tag */}
              <div className="absolute top-3 left-3 px-2.5 py-1 rounded-lg bg-black/60 backdrop-blur-md text-white text-[11px] font-bold flex items-center gap-1.5 border border-white/10">
                <span className={`w-2 h-2 rounded-full ${peerPresence ? 'bg-emerald-400 animate-pulse' : 'bg-slate-500'}`} />
                <span>{participantRole === 'candidate' ? 'Interviewer Stream' : `${candidateContext?.name || 'Candidate'} (Remote)`}</span>
              </div>
            </div>

            {/* Bottom Row: Local Camera Preview & Media Controls */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
              {/* Local Video Thumbnail */}
              <div className="relative w-36 aspect-video bg-[#00121c] rounded-lg overflow-hidden border border-[#002f47] shrink-0">
                <video
                  ref={localVideoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover"
                />
                {isCameraOff && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/80 text-[10px] text-slate-400 font-bold">
                    Camera Off
                  </div>
                )}
                <div className="absolute bottom-1 left-1 px-1.5 py-0.5 rounded bg-black/70 text-[9px] text-slate-300 font-semibold">
                  You ({participantRole})
                </div>
              </div>

              {/* Center Media Control Dock */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={toggleMic}
                  className={`p-3 rounded-xl border font-bold flex items-center justify-center transition-all ${
                    isMicMuted
                      ? 'bg-rose-500/20 border-rose-500 text-rose-400'
                      : 'bg-[#001f2e] border-[#063750] text-slate-200 hover:text-white'
                  }`}
                  title={isMicMuted ? 'Unmute Microphone' : 'Mute Microphone'}
                >
                  {isMicMuted ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                </button>

                <button
                  type="button"
                  onClick={toggleCamera}
                  className={`p-3 rounded-xl border font-bold flex items-center justify-center transition-all ${
                    isCameraOff
                      ? 'bg-rose-500/20 border-rose-500 text-rose-400'
                      : 'bg-[#001f2e] border-[#063750] text-slate-200 hover:text-white'
                  }`}
                  title={isCameraOff ? 'Turn Camera On' : 'Turn Camera Off'}
                >
                  {isCameraOff ? <VideoOff className="w-4 h-4" /> : <Video className="w-4 h-4" />}
                </button>
              </div>

              {/* Status Pill */}
              <div className="text-right">
                <span className="text-[10px] text-slate-400 block">Session Recording</span>
                <span className={`text-[11px] font-bold ${recordingEnabled ? 'text-rose-400 flex items-center gap-1' : 'text-slate-500'}`}>
                  {recordingEnabled ? '● Inactive (Ephemeral Only)' : 'Disabled (Requires Both Consent)'}
                </span>
              </div>
            </div>

            {/* Ethical AI Invariant Disclosure */}
            <div className="p-3 bg-[#001f2e] rounded-xl border border-[#063750] text-[11px] text-slate-400 flex items-start gap-2 leading-relaxed">
              <Shield className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <span>
                <strong>Privacy & Human Sovereignty Guarantee:</strong> This interview is conducted directly between human participants. Streams are peer-to-peer and ephemeral. Zero biometric emotion scoring, facial sentiment profiling, or accent analysis is applied.
              </span>
            </div>
          </div>
        </div>

        {/* Right Column: Interviewer Workspace (for Recruiter) or Agenda (for Candidate) (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          {participantRole === 'interviewer' ? (
            /* ========================================================= */
            /* RECRUITER / INTERVIEWER WORKSPACE                         */
            /* ========================================================= */
            <div className="bg-[#001f2e] border border-[#063750] rounded-2xl p-5 shadow-xl space-y-5">
              <div className="flex items-center justify-between pb-3 border-b border-[#002a40]">
                <div>
                  <h4 className="text-white text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-[#FF4103]" />
                    <span>Interviewer Evaluation Workspace</span>
                  </h4>
                  <p className="text-slate-400 text-[11px] mt-0.5">
                    Grounded questions, candidate resume facts, and live private notes.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={saveWorkspace}
                  disabled={isSavingWorkspace}
                  className="px-2.5 py-1 rounded-lg bg-[#001824] hover:bg-[#00283d] text-slate-300 hover:text-white border border-[#063750] text-[11px] font-semibold flex items-center gap-1"
                >
                  <Check className="w-3 h-3 text-emerald-400" />
                  <span>{isSavingWorkspace ? 'Saving...' : 'Save Draft'}</span>
                </button>
              </div>

              {/* Candidate Verified Facts Card */}
              <div className="bg-[#001824] p-3.5 rounded-xl border border-[#063750] space-y-2">
                <span className="text-[10px] uppercase font-bold text-[#FF4103] block">
                  Verified Candidate Facts (M01 Context)
                </span>
                <div className="text-white text-xs font-bold">
                  {candidateContext?.name} · {candidateContext?.profile?.experience_level || 'Mid-Level'}
                </div>
                {candidateContext?.resume_data?.skills && (
                  <div className="flex flex-wrap gap-1 pt-1">
                    {candidateContext.resume_data.skills.slice(0, 5).map((s: string, i: number) => (
                      <span key={i} className="px-2 py-0.5 rounded-md bg-[#002538] border border-[#063750] text-slate-300 text-[10px]">
                        {s}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Structured Question Suggestions */}
              <div className="space-y-2.5">
                <span className="text-[11px] uppercase font-bold text-slate-300 block">
                  Role-Grounded Question Bank ({workspaceQuestions.length})
                </span>

                <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                  {workspaceQuestions.map((q) => {
                    const isActive = q.id === activeQuestionId;
                    return (
                      <div
                        key={q.id}
                        className={`p-3 rounded-xl border transition-all text-xs space-y-1.5 ${
                          isActive
                            ? 'bg-[#001824] border-[#FF4103]/60 shadow-md'
                            : 'bg-[#001824]/60 border-[#063750] hover:border-slate-500'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-bold text-slate-400 uppercase">
                            {q.competency}
                          </span>
                          <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase ${
                            q.status === 'asked' ? 'bg-emerald-950 text-emerald-400' :
                            q.status === 'skipped' ? 'bg-slate-800 text-slate-400' :
                            'bg-blue-950 text-blue-400'
                          }`}>
                            {q.status}
                          </span>
                        </div>

                        <p className="text-slate-200 text-xs leading-relaxed font-medium">
                          "{q.question}"
                        </p>

                        <div className="flex items-center justify-between pt-1 border-t border-[#002a40]/60 text-[10px]">
                          <span className="text-slate-400 italic text-[10px]">
                            {q.provenance_note}
                          </span>
                          <div className="flex gap-1.5">
                            <button
                              type="button"
                              onClick={() => {
                                setActiveQuestionId(q.id);
                                setWorkspaceQuestions(prev => prev.map(item => item.id === q.id ? { ...item, status: 'asked' } : item));
                              }}
                              className="px-2 py-0.5 rounded bg-[#FF4103]/20 hover:bg-[#FF4103] text-white font-bold"
                            >
                              Ask This
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setWorkspaceQuestions(prev => prev.map(item => item.id === q.id ? { ...item, status: 'skipped' } : item));
                              }}
                              className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white"
                            >
                              Skip
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Private In-Interview Notes */}
              <div className="space-y-2">
                <span className="text-[11px] uppercase font-bold text-slate-300 block">
                  Private Interviewer Notes (Confidential)
                </span>
                <textarea
                  rows={4}
                  value={liveNotes}
                  onChange={e => setLiveNotes(e.target.value)}
                  placeholder="Record confidential notes, technical depth observations, and key candidate trade-offs..."
                  className="w-full bg-[#001824] border border-[#063750] rounded-xl p-3 text-white text-xs focus:outline-none focus:border-[#FF4103] leading-relaxed"
                />
              </div>

              {/* Quick Observation Logger */}
              <div className="space-y-2 pt-2 border-t border-[#002a40]">
                <span className="text-[11px] uppercase font-bold text-slate-300 block">
                  Log Evidence Observation
                </span>
                <div className="flex gap-2">
                  <select
                    value={selectedCompetency}
                    onChange={e => setSelectedCompetency(e.target.value)}
                    className="bg-[#001824] border border-[#063750] rounded-xl px-2.5 py-1.5 text-xs text-white focus:outline-none"
                  >
                    <option value="Technical Execution">Technical Execution</option>
                    <option value="Behavioral STAR & Alignment">Behavioral STAR</option>
                    <option value="Failure Resilience & Triage">Failure Resilience</option>
                    <option value="Communication & Clarity">Communication</option>
                  </select>
                  <input
                    type="text"
                    value={quickObservation}
                    onChange={e => setQuickObservation(e.target.value)}
                    placeholder="Log specific evidence..."
                    className="flex-1 bg-[#001824] border border-[#063750] rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-[#FF4103]"
                    onKeyDown={e => { if (e.key === 'Enter') addObservation(); }}
                  />
                  <button
                    type="button"
                    onClick={addObservation}
                    className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold"
                  >
                    Log
                  </button>
                </div>

                {observationsList.length > 0 && (
                  <div className="space-y-1 pt-1 max-h-32 overflow-y-auto">
                    {observationsList.map((obs, i) => (
                      <div key={i} className="text-[11px] text-slate-300 flex items-start gap-2 bg-[#001824] p-2 rounded-lg border border-[#002f47]">
                        <span className="text-slate-400 font-mono text-[10px]">{obs.timestamp}</span>
                        <span className="text-[#FF4103] font-bold text-[10px]">[{obs.competency}]</span>
                        <span className="flex-1">{obs.text}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ) : (
            /* ========================================================= */
            /* CANDIDATE VIEW & INTERVIEW AGENDA                         */
            /* ========================================================= */
            <div className="bg-[#001f2e] border border-[#063750] rounded-2xl p-6 shadow-xl space-y-5">
              <div className="pb-3 border-b border-[#002a40]">
                <h4 className="text-white text-sm font-bold flex items-center gap-2">
                  <User className="w-4 h-4 text-[#FF4103]" />
                  <span>Interview Session Briefing</span>
                </h4>
                <p className="text-slate-400 text-xs mt-1">
                  You are participating in a live human panel interview with an authorized recruiter.
                </p>
              </div>

              <div className="space-y-3 text-xs">
                <div className="p-3.5 bg-[#001824] rounded-xl border border-[#063750] space-y-1">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Target Role</span>
                  <span className="text-white font-bold text-sm">{invitation?.target_role}</span>
                </div>

                <div className="p-3.5 bg-[#001824] rounded-xl border border-[#063750] space-y-1">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Interview Format</span>
                  <span className="text-white font-medium capitalize">
                    {invitation?.interview_type?.replace(/_/g, ' ')}
                  </span>
                </div>

                <div className="p-3.5 bg-[#001824] rounded-xl border border-[#063750] space-y-2">
                  <span className="text-[10px] uppercase font-bold text-[#FF4103] block">Interview Presentation Tips</span>
                  <ul className="list-disc list-inside text-slate-300 text-xs space-y-1">
                    <li>Speak clearly into your microphone; camera and microphone can be toggled anytime.</li>
                    <li>Structure answers around concrete actions, trade-offs, and metrics.</li>
                    <li>Ask clarifying questions whenever a problem prompt is broad or ambiguous.</li>
                  </ul>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* POST-INTERVIEW EVALUATION MODAL (RECRUITER ONLY)                          */}
      {/* ========================================================================= */}
      {showEvaluationModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#001f2e] border border-[#063750] rounded-2xl max-w-2xl w-full p-6 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-[#002a40]">
              <div>
                <h3 className="text-white text-base font-bold">Conclude Live Interview & Record Evaluation</h3>
                <p className="text-slate-400 text-xs mt-0.5">
                  Record your human judgment and anchored ratings. These will be exported to Module 5.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowEvaluationModal(false)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            {evaluationError && (
              <div className="p-3 bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs rounded-xl flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{evaluationError}</span>
              </div>
            )}

            {/* Overall Recommendation */}
            <div className="space-y-2">
              <label className="text-white text-xs font-bold block">
                Overall Hiring Recommendation:
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                {(['strong_hire', 'hire', 'further_review', 'hold', 'no_hire'] as RecommendationType[]).map(rec => (
                  <button
                    key={rec}
                    type="button"
                    onClick={() => setOverallRecommendation(rec)}
                    className={`py-2 px-2.5 rounded-xl text-xs font-bold border transition-all text-center capitalize ${
                      overallRecommendation === rec
                        ? 'bg-[#FF4103] text-white border-[#FF4103] shadow-md shadow-[#FF4103]/20'
                        : 'bg-[#001824] border-[#063750] text-slate-300 hover:text-white'
                    }`}
                  >
                    {rec.replace(/_/g, ' ')}
                  </button>
                ))}
              </div>
            </div>

            {/* Competency Ratings */}
            <div className="space-y-3">
              <label className="text-white text-xs font-bold block">
                Anchored Competency Ratings (1-5):
              </label>
              {Object.entries(competencyScores).map(([compName, scoreData]) => (
                <div key={compName} className="p-3 bg-[#001824] rounded-xl border border-[#063750] space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-white font-bold">{compName}</span>
                    <span className="text-[#FF4103] font-black">{scoreData.rating} / 5 ({scoreData.rubric_level})</span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="5"
                    step="1"
                    value={scoreData.rating}
                    onChange={e => {
                      const val = parseInt(e.target.value, 10);
                      const levels: Record<number, string> = {
                        1: 'L1 Unsatisfactory',
                        2: 'L2 Developing',
                        3: 'L3 Competent Standard',
                        4: 'L4 Strong',
                        5: 'L5 Exceptional'
                      };
                      setCompetencyScores(prev => ({
                        ...prev,
                        [compName]: {
                          ...prev[compName],
                          rating: val,
                          rubric_level: levels[val] || 'L3 Competent'
                        }
                      }));
                    }}
                    className="w-full accent-[#FF4103]"
                  />
                  <input
                    type="text"
                    value={scoreData.evidence}
                    onChange={e => {
                      const val = e.target.value;
                      setCompetencyScores(prev => ({
                        ...prev,
                        [compName]: { ...prev[compName], evidence: val }
                      }));
                    }}
                    placeholder="Evidence observed..."
                    className="w-full bg-[#00121c] border border-[#002f47] rounded-lg p-2 text-xs text-white focus:outline-none"
                  />
                </div>
              ))}
            </div>

            {/* Detailed Evaluator Notes */}
            <div className="space-y-2">
              <label className="text-white text-xs font-bold block">
                Detailed Interviewer Notes & Synthesis:
              </label>
              <textarea
                rows={5}
                value={finalEvaluationNotes}
                onChange={e => setFinalEvaluationNotes(e.target.value)}
                placeholder="Synthesize overall candidate performance, core strengths, observed trade-offs, and final evaluation rationale..."
                className="w-full bg-[#001824] border border-[#063750] rounded-xl p-3.5 text-white text-xs focus:outline-none focus:border-[#FF4103] leading-relaxed"
              />
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#002a40]">
              <button
                type="button"
                onClick={() => setShowEvaluationModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold hover:text-white"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={submitFinalEvaluation}
                disabled={isSubmittingEvaluation || !finalEvaluationNotes.trim()}
                className="px-6 py-2.5 rounded-xl bg-[#FF4103] hover:bg-[#e03200] disabled:opacity-50 text-white text-xs font-bold shadow-lg shadow-[#FF4103]/25 flex items-center gap-2"
              >
                <CheckCircle className="w-3.5 h-3.5" />
                <span>{isSubmittingEvaluation ? 'Finalizing Evaluation...' : 'Submit Evaluation & Close Room'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
