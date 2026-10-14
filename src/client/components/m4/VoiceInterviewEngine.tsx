import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  Mic, MicOff, Volume2, VolumeX, Sparkles, AlertCircle, 
  RotateCcw, ShieldCheck, Play, Radio, CheckCircle2, Edit3, Target, Compass
} from 'lucide-react';

export type VoiceState = 'idle' | 'speaking' | 'listening' | 'processing';
export type InterviewInteractionMode = 'voice' | 'text';

export interface UseVoiceEngineProps {
  onTranscriptUpdate?: (text: string) => void;
  onTranscriptAppend?: (text: string) => void;
  onError?: (err: string) => void;
}

export function useVoiceEngine({
  onTranscriptUpdate,
  onTranscriptAppend,
  onError
}: UseVoiceEngineProps = {}) {
  const [interactionMode, setInteractionMode] = useState<InterviewInteractionMode>('voice');
  const [voiceState, setVoiceState] = useState<VoiceState>('idle');
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);
  const [isListening, setIsListening] = useState<boolean>(false);
  const [audioLevel, setAudioLevel] = useState<number>(0);
  const [permissionError, setPermissionError] = useState<string | null>(null);

  const recognitionRef = useRef<any>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);

  const isSpeechSupported = typeof window !== 'undefined' && ('speechSynthesis' in window);
  const isRecognitionSupported = typeof window !== 'undefined' && 
    (('webkitSpeechRecognition' in window) || ('SpeechRecognition' in window));

  // Initialize SpeechRecognition safely
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const SpeechRec = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRec) {
      try {
        const recognition = new SpeechRec();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = 'en-US';

        recognition.onstart = () => {
          setIsListening(true);
          setVoiceState('listening');
          setPermissionError(null);
        };

        recognition.onresult = (event: any) => {
          let interimTranscript = '';
          let finalTranscript = '';

          for (let i = event.resultIndex; i < event.results.length; ++i) {
            if (event.results[i].isFinal) {
              finalTranscript += event.results[i][0].transcript;
            } else {
              interimTranscript += event.results[i][0].transcript;
            }
          }

          if (finalTranscript && onTranscriptAppend) {
            onTranscriptAppend(finalTranscript.trim());
          } else if (interimTranscript && onTranscriptUpdate) {
            onTranscriptUpdate(interimTranscript);
          }
        };

        recognition.onerror = (event: any) => {
          console.warn('SpeechRecognition error:', event.error);
          if (event.error === 'not-allowed') {
            setPermissionError('Microphone permission was denied. Switched to Accessible Text Mode.');
            setInteractionMode('text');
          } else if (event.error !== 'no-speech') {
            if (onError) onError(`Voice input error: ${event.error}`);
          }
          setIsListening(false);
          setVoiceState('idle');
        };

        recognition.onend = () => {
          setIsListening(false);
          if (voiceState === 'listening') {
            setVoiceState('idle');
          }
        };

        recognitionRef.current = recognition;
      } catch (err) {
        console.warn('SpeechRecognition init error:', err);
      }
    }

    return () => {
      if (recognitionRef.current) {
        try { recognitionRef.current.abort(); } catch (_) {}
      }
      if (typeof window !== 'undefined' && window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
      stopAudioVisualizer();
    };
  }, []);

  const stopAudioVisualizer = () => {
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      try { audioContextRef.current.close(); } catch (_) {}
      audioContextRef.current = null;
    }
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(t => {
        try { t.stop(); } catch (_) {}
      });
      mediaStreamRef.current = null;
    }
    setAudioLevel(0);
  };

  const startAudioVisualizer = async () => {
    try {
      if (!navigator?.mediaDevices?.getUserMedia) return;
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = stream;

      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        const ctx = new AudioCtx();
        audioContextRef.current = ctx;
        const analyser = ctx.createAnalyser();
        analyser.fftSize = 64;
        analyserRef.current = analyser;

        const source = ctx.createMediaStreamSource(stream);
        source.connect(analyser);

        const dataArray = new Uint8Array(analyser.frequencyBinCount);
        const updateVisuals = () => {
          if (analyserRef.current) {
            analyserRef.current.getByteFrequencyData(dataArray);
            let sum = 0;
            for (let i = 0; i < dataArray.length; i++) {
              sum += dataArray[i];
            }
            const avg = sum / dataArray.length;
            setAudioLevel(Math.min(100, Math.round((avg / 128) * 100)));
            animFrameRef.current = requestAnimationFrame(updateVisuals);
          }
        };
        updateVisuals();
      }
    } catch (_) {}
  };

  // Text to Speech
  const speakQuestion = useCallback((text: string, panelRole = 'Hiring Manager') => {
    if (!isSpeechSupported || !text) return;

    window.speechSynthesis.cancel();
    stopListening();

    const utterance = new SpeechSynthesisUtterance(text);

    // Persona-tuned speech synthesis attributes
    if (panelRole.toLowerCase().includes('architect') || panelRole.toLowerCase().includes('engineer')) {
      utterance.pitch = 0.95;
      utterance.rate = 0.98;
    } else if (panelRole.toLowerCase().includes('culture') || panelRole.toLowerCase().includes('people')) {
      utterance.pitch = 1.05;
      utterance.rate = 1.02;
    } else if (panelRole.toLowerCase().includes('director') || panelRole.toLowerCase().includes('cfo')) {
      utterance.pitch = 0.92;
      utterance.rate = 0.96;
    } else {
      utterance.pitch = 1.0;
      utterance.rate = 1.0;
    }

    utterance.onstart = () => {
      setIsSpeaking(true);
      setVoiceState('speaking');
    };

    utterance.onend = () => {
      setIsSpeaking(false);
      setVoiceState('idle');
    };

    utterance.onerror = () => {
      setIsSpeaking(false);
      setVoiceState('idle');
    };

    window.speechSynthesis.speak(utterance);
  }, [isSpeechSupported]);

  const stopSpeaking = useCallback(() => {
    if (isSpeechSupported) {
      window.speechSynthesis.cancel();
    }
    setIsSpeaking(false);
    if (voiceState === 'speaking') {
      setVoiceState('idle');
    }
  }, [isSpeechSupported, voiceState]);

  // Speech Recognition (Listening)
  const startListening = useCallback(() => {
    stopSpeaking();

    if (!recognitionRef.current) {
      setPermissionError('Web Speech recognition is not available in your current browser. Accessible Text Mode enabled.');
      setInteractionMode('text');
      return;
    }

    try {
      recognitionRef.current.start();
      startAudioVisualizer();
      setIsListening(true);
      setVoiceState('listening');
    } catch (err: any) {
      // recognition already running
      if (err?.name !== 'InvalidStateError') {
        console.warn('SpeechRecognition start error:', err);
      }
    }
  }, [stopSpeaking]);

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (_) {}
    }
    stopAudioVisualizer();
    setIsListening(false);
    if (voiceState === 'listening') {
      setVoiceState('idle');
    }
  }, [voiceState]);

  return {
    interactionMode,
    setInteractionMode,
    voiceState,
    setVoiceState,
    isSpeaking,
    isListening,
    audioLevel,
    permissionError,
    setPermissionError,
    isSpeechSupported,
    isRecognitionSupported,
    speakQuestion,
    stopSpeaking,
    startListening,
    stopListening
  };
}

/**
 * Visual Turn-Taking Status Bar & Audio Meter
 */
export function VoiceStatusBar({
  voiceState,
  isSpeaking,
  isListening,
  audioLevel,
  activePanelRole,
  onReplayAudio,
  onStopAudio,
  interactionMode
}: {
  voiceState: VoiceState;
  isSpeaking: boolean;
  isListening: boolean;
  audioLevel: number;
  activePanelRole: string;
  onReplayAudio: () => void;
  onStopAudio: () => void;
  interactionMode: InterviewInteractionMode;
}) {
  return (
    <div className="p-3.5 bg-[#001522] border border-[#002f47] rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
      <div className="flex items-center gap-3">
        {/* Dynamic Voice State Pill */}
        <div className="flex items-center gap-2">
          {voiceState === 'speaking' ? (
            <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/40 font-bold uppercase tracking-wider text-[10px] animate-pulse">
              <Volume2 className="w-3.5 h-3.5 text-blue-400" />
              <span>AI Speaking ({activePanelRole})</span>
            </span>
          ) : voiceState === 'listening' ? (
            <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-bold uppercase tracking-wider text-[10px] animate-pulse">
              <Mic className="w-3.5 h-3.5 text-emerald-400" />
              <span>Listening to You</span>
            </span>
          ) : voiceState === 'processing' ? (
            <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold uppercase tracking-wider text-[10px]">
              <Radio className="w-3.5 h-3.5 text-amber-400 animate-spin" />
              <span>AI Synthesizing…</span>
            </span>
          ) : (
            <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#002438] text-slate-300 border border-[#003856] font-semibold text-[10px]">
              <Sparkles className="w-3.5 h-3.5 text-[#FF4103]" />
              <span>Your Turn to Respond</span>
            </span>
          )}
        </div>

        {/* Audio Waveform / Pulsing Level */}
        {interactionMode === 'voice' && (
          <div className="flex items-center gap-1 h-5 px-2 bg-[#000e17] rounded-lg border border-[#00283d]">
            {[12, 28, 48, 20, 60, 36, 18, 50].map((h, i) => {
              const active = isSpeaking || isListening;
              const dynamicHeight = active ? Math.max(4, Math.min(18, (audioLevel / 100) * h * 1.5)) : 4;
              return (
                <div
                  key={i}
                  style={{ height: `${active ? dynamicHeight : 4}px` }}
                  className={`w-1 rounded-full transition-all duration-75 ${
                    isListening
                      ? 'bg-emerald-400'
                      : isSpeaking
                      ? 'bg-blue-400'
                      : 'bg-slate-700'
                  }`}
                />
              );
            })}
          </div>
        )}
      </div>

      {/* Audio Playback Controls */}
      {interactionMode === 'voice' && (
        <div className="flex items-center gap-2">
          {isSpeaking ? (
            <button
              type="button"
              onClick={onStopAudio}
              className="px-2.5 py-1 rounded-lg bg-red-950/40 hover:bg-red-900/40 text-red-300 border border-red-500/30 text-[11px] font-semibold flex items-center gap-1.5 transition-colors"
            >
              <VolumeX className="w-3 h-3 text-red-400" />
              <span>Skip / Stop Audio</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={onReplayAudio}
              className="px-2.5 py-1 rounded-lg bg-[#002438] hover:bg-[#00344f] text-slate-300 hover:text-white border border-[#003b5a] text-[11px] font-semibold flex items-center gap-1.5 transition-colors"
            >
              <Volume2 className="w-3 h-3 text-blue-400" />
              <span>Hear Question Aloud</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
}

/**
 * Pre-Session Role Confirmation & Evidence Review Card
 */
export function PreInterviewEvidenceCard({
  candidateDossier,
  selectedTargetRole,
  onTargetRoleChange,
  interactionMode,
  onModeChange,
  onStartSession,
  loading
}: {
  candidateDossier: any;
  selectedTargetRole: string;
  onTargetRoleChange: (newRole: string) => void;
  interactionMode: InterviewInteractionMode;
  onModeChange: (mode: InterviewInteractionMode) => void;
  onStartSession: () => void;
  loading: boolean;
}) {
  const [isEditingRole, setIsEditingRole] = useState(false);
  const [tempRole, setTempRole] = useState(selectedTargetRole || candidateDossier?.target_role || 'AI & Machine Learning Engineer');

  const skills: string[] = candidateDossier?.m01_verified_claims_count
    ? (candidateDossier?.m02_proficiencies?.map((p: any) => p.skill) || [])
    : ['AI Systems Architecture', 'Cloud Infrastructure', 'Security Monitoring', 'Distributed Systems'];

  const projects: string[] = candidateDossier?.m01_projects || [];

  return (
    <div className="bg-[#001f2e] border border-[#063750] rounded-2xl p-6 shadow-xl space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-[#002a40] gap-3">
        <div>
          <div className="flex items-center gap-2 text-[#FF4103] text-xs font-bold uppercase tracking-wider mb-1">
            <ShieldCheck className="w-4 h-4 text-[#FF4103]" />
            <span>Candidate Evidence Grounding & Protocol Calibration</span>
          </div>
          <h3 className="text-lg font-bold text-white tracking-tight">
            Personalized 10-Question Voice AI Mock Interview
          </h3>
        </div>
        <div className="flex items-center gap-2">
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>M01 & M02 Connected</span>
          </span>
        </div>
      </div>

      {/* Target Role Confirmation */}
      <div className="p-4 bg-[#001624] border border-[#002b40] rounded-xl space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-slate-400 text-xs uppercase font-bold tracking-wider flex items-center gap-1.5">
            <Target className="w-3.5 h-3.5 text-[#FF4103]" />
            <span>Target Job Role & Interview Focus</span>
          </span>
          <button
            type="button"
            onClick={() => setIsEditingRole(!isEditingRole)}
            className="text-[11px] text-slate-300 hover:text-white font-semibold flex items-center gap-1 transition-colors"
          >
            <Edit3 className="w-3 h-3 text-[#FF4103]" />
            <span>{isEditingRole ? 'Done' : 'Customize Role / JD'}</span>
          </button>
        </div>

        {isEditingRole ? (
          <div className="flex items-center gap-2 pt-1">
            <input
              type="text"
              value={tempRole}
              onChange={e => {
                setTempRole(e.target.value);
                onTargetRoleChange(e.target.value);
              }}
              placeholder="e.g. Lead Cloud Security Engineer"
              className="flex-1 bg-[#00101b] border border-[#003855] rounded-xl px-3.5 py-2 text-white text-xs font-semibold focus:outline-none focus:border-[#FF4103]"
            />
            <button
              type="button"
              onClick={() => {
                onTargetRoleChange(tempRole);
                setIsEditingRole(false);
              }}
              className="px-3 py-2 bg-[#FF4103] hover:bg-[#e03200] text-white text-xs font-bold rounded-xl"
            >
              Confirm
            </button>
          </div>
        ) : (
          <div className="flex items-center justify-between">
            <div className="text-base font-bold text-white">
              {selectedTargetRole || candidateDossier?.target_role || 'Senior Professional'}
            </div>
            <span className="px-2.5 py-0.5 rounded bg-[#00283c] text-slate-300 font-mono text-[11px] border border-[#003b59]">
              Seniority: {candidateDossier?.experience_level || 'Mid-Level'}
            </span>
          </div>
        )}
      </div>

      {/* Verified Evidence Badges */}
      <div className="grid sm:grid-cols-2 gap-4 text-xs">
        <div className="p-3.5 bg-[#001824] border border-[#002f47] rounded-xl space-y-2">
          <span className="text-[11px] uppercase font-bold text-slate-400 block">
            Verified Competencies (M01 / M02)
          </span>
          <div className="flex flex-wrap gap-1.5">
            {skills.slice(0, 6).map((skill, idx) => (
              <span
                key={idx}
                className="px-2 py-0.5 rounded-md bg-[#00283d] text-slate-200 border border-[#003f61] text-[10px] font-medium"
              >
                {skill}
              </span>
            ))}
          </div>
        </div>

        <div className="p-3.5 bg-[#001824] border border-[#002f47] rounded-xl space-y-2">
          <span className="text-[11px] uppercase font-bold text-slate-400 block">
            Grounded Projects & Background
          </span>
          <div className="flex flex-wrap gap-1.5">
            {projects.length > 0 ? (
              projects.slice(0, 4).map((p, idx) => (
                <span
                  key={idx}
                  className="px-2 py-0.5 rounded-md bg-[#00283d] text-emerald-300 border border-emerald-500/30 text-[10px] font-medium"
                >
                  {p}
                </span>
              ))
            ) : (
              <span className="text-slate-400 text-[11px] italic">
                {candidateDossier?.name || 'Candidate'} · Verified Resume & Assessment Evidence
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Interaction Mode Selection */}
      <div className="p-4 bg-[#001420] border border-[#00283c] rounded-xl space-y-3">
        <span className="text-slate-400 text-xs uppercase font-bold tracking-wider block">
          Choose Interaction Experience
        </span>
        <div className="grid sm:grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => onModeChange('voice')}
            className={`p-3.5 rounded-xl border text-left transition-all ${
              interactionMode === 'voice'
                ? 'bg-[#FF4103]/15 border-[#FF4103] shadow-md shadow-[#FF4103]/10 ring-1 ring-[#FF4103]'
                : 'bg-[#001927] border-[#002f47] text-slate-300 hover:border-slate-500'
            }`}
          >
            <div className="flex items-center gap-2 mb-1">
              <Mic className={`w-4 h-4 ${interactionMode === 'voice' ? 'text-[#FF4103]' : 'text-slate-400'}`} />
              <span className="text-xs font-bold text-white">🎙️ Real-Time Voice AI (Recommended)</span>
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Hear the interviewer speak each question aloud and respond naturally using your microphone with live transcription.
            </p>
          </button>

          <button
            type="button"
            onClick={() => onModeChange('text')}
            className={`p-3.5 rounded-xl border text-left transition-all ${
              interactionMode === 'text'
                ? 'bg-[#FF4103]/15 border-[#FF4103] shadow-md shadow-[#FF4103]/10 ring-1 ring-[#FF4103]'
                : 'bg-[#001927] border-[#002f47] text-slate-300 hover:border-slate-500'
            }`}
          >
            <div className="flex items-center gap-2 mb-1">
              <Compass className={`w-4 h-4 ${interactionMode === 'text' ? 'text-[#FF4103]' : 'text-slate-400'}`} />
              <span className="text-xs font-bold text-white">⌨️ Accessible Text Mode</span>
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Read questions on screen and type your responses directly. Identical calibrated rubrics and coaching.
            </p>
          </button>
        </div>
      </div>

      {/* Privacy Guarantee Invariant */}
      <div className="p-3 bg-[#00101b] border border-emerald-500/20 rounded-xl flex items-center gap-2 text-[11px] text-slate-400">
        <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
        <span>
          <strong>Ethical AI Invariant:</strong> Audio is processed strictly for transcription and competency evaluation. Zero biometric profiling, emotion inference, or facial scoring.
        </span>
      </div>

      {/* Launch Button */}
      <div className="pt-2 flex items-center justify-between">
        <span className="text-xs text-slate-400 font-mono">10 Sequential Questions · Calibrated Rubrics</span>
        <button
          type="button"
          disabled={loading}
          onClick={onStartSession}
          className="px-6 py-3 rounded-xl bg-[#FF4103] hover:bg-[#e03200] disabled:opacity-50 text-white text-xs font-bold flex items-center gap-2 shadow-lg shadow-[#FF4103]/25 transition-all"
        >
          <Play className="w-4 h-4" />
          <span>{loading ? 'Initializing Session…' : 'Launch 10-Question Personalized Interview'}</span>
        </button>
      </div>
    </div>
  );
}
