import React, { useState, useEffect, useRef } from 'react';
import { 
  Camera, CameraOff, Mic, MicOff, ShieldCheck, AlertCircle, 
  Video, Eye, Volume2, Info, ChevronDown, ChevronUp, Sun, Sparkles, CheckCircle2 
} from 'lucide-react';

interface InterviewCameraPreviewProps {
  onCameraStateChange?: (enabled: boolean) => void;
  compact?: boolean;
}

export default function InterviewCameraPreview({
  onCameraStateChange,
  compact = false
}: InterviewCameraPreviewProps) {
  const [cameraActive, setCameraActive] = useState<boolean>(false);
  const [micActive, setMicActive] = useState<boolean>(true);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [permissionError, setPermissionError] = useState<string | null>(null);
  const [micLevel, setMicLevel] = useState<number>(0);
  const [showSetupGuide, setShowSetupGuide] = useState<boolean>(false);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  // Stop all media tracks and close audio context safely
  const stopTracks = () => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      try {
        audioContextRef.current.close();
      } catch (_) {}
      audioContextRef.current = null;
    }
    if (stream) {
      stream.getTracks().forEach(track => {
        try {
          track.stop();
        } catch (_) {}
      });
      setStream(null);
    }
  };

  // Start camera and microphone preview stream
  const startCamera = async () => {
    setPermissionError(null);
    try {
      if (!navigator?.mediaDevices?.getUserMedia) {
        setPermissionError('Camera preview is not supported by your current browser.');
        return;
      }

      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 640 },
          height: { ideal: 480 },
          facingMode: 'user'
        },
        audio: true
      });

      setStream(mediaStream);
      setCameraActive(true);
      if (onCameraStateChange) onCameraStateChange(true);

      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }

      // Set up AudioContext volume meter
      try {
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        if (AudioCtx) {
          const audioCtx = new AudioCtx();
          audioContextRef.current = audioCtx;
          const analyser = audioCtx.createAnalyser();
          analyser.fftSize = 256;
          analyserRef.current = analyser;

          const source = audioCtx.createMediaStreamSource(mediaStream);
          source.connect(analyser);

          const dataArray = new Uint8Array(analyser.frequencyBinCount);
          const updateLevel = () => {
            if (analyserRef.current) {
              analyserRef.current.getByteFrequencyData(dataArray);
              let sum = 0;
              for (let i = 0; i < dataArray.length; i++) {
                sum += dataArray[i];
              }
              const average = sum / dataArray.length;
              setMicLevel(Math.min(100, Math.round((average / 128) * 100)));
              animationFrameRef.current = requestAnimationFrame(updateLevel);
            }
          };
          updateLevel();
        }
      } catch (_) {
        // Audio visualization is optional enhancement
      }
    } catch (err: any) {
      console.warn('Camera access denied or device unavailable:', err);
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setPermissionError('Camera / Microphone permission denied. You can proceed with text answering without penalty.');
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        setPermissionError('No camera or microphone hardware detected on this device.');
      } else {
        setPermissionError('Unable to access camera hardware. Text and voice fallback available.');
      }
      setCameraActive(false);
      if (onCameraStateChange) onCameraStateChange(false);
    }
  };

  const toggleCamera = () => {
    if (cameraActive) {
      stopTracks();
      setCameraActive(false);
      setMicLevel(0);
      if (onCameraStateChange) onCameraStateChange(false);
    } else {
      startCamera();
    }
  };

  const toggleMic = () => {
    if (stream) {
      const audioTracks = stream.getAudioTracks();
      const nextState = !micActive;
      audioTracks.forEach(t => { t.enabled = nextState; });
      setMicActive(nextState);
    }
  };

  // Re-bind srcObject if video element updates or stream changes
  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  // Clean up all tracks on unmount
  useEffect(() => {
    return () => {
      stopTracks();
    };
  }, []);

  return (
    <div className={`bg-[#001824] border border-[#063750] rounded-2xl overflow-hidden shadow-lg ${compact ? 'p-3' : 'p-5'} space-y-3`}>
      {/* Header ribbon */}
      <div className="flex items-center justify-between pb-2 border-b border-[#002a40]">
        <div className="flex items-center gap-2">
          <Video className="w-4 h-4 text-[#FF4103]" />
          <span className="text-xs font-bold text-white uppercase tracking-wider">
            {compact ? 'Candidate Preview' : 'Interactive Camera & Audio Check'}
          </span>
        </div>
        <div className="flex items-center gap-2">
          {cameraActive ? (
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              LIVE PREVIEW
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-800 text-slate-400 border border-slate-700">
              <Eye className="w-3 h-3" />
              CAMERA OFF
            </span>
          )}
        </div>
      </div>

      {/* Video Viewport Area */}
      <div className="relative aspect-video w-full bg-[#00101a] rounded-xl overflow-hidden border border-[#002f47] flex items-center justify-center">
        {cameraActive ? (
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-cover transform -scale-x-100"
            aria-label="Candidate live self-preview"
          />
        ) : (
          <div className="flex flex-col items-center justify-center p-6 text-center space-y-2">
            <div className="w-12 h-12 rounded-full bg-[#001f2e] border border-[#063750] flex items-center justify-center text-slate-400">
              <CameraOff className="w-6 h-6 text-slate-500" />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-300">Camera preview is currently inactive</p>
              <p className="text-[11px] text-slate-500 mt-0.5 max-w-xs">
                Camera is optional. Your interview evaluation is based strictly on your stated response evidence.
              </p>
            </div>
            <button
              type="button"
              onClick={startCamera}
              className="mt-2 px-3.5 py-1.5 rounded-lg bg-[#002a40] hover:bg-[#003d5c] text-white text-xs font-semibold flex items-center gap-1.5 border border-[#063750] transition-colors"
            >
              <Camera className="w-3.5 h-3.5 text-[#FF4103]" />
              <span>Enable Camera Preview</span>
            </button>
          </div>
        )}

        {/* Floating Controls Overlay when camera active */}
        {cameraActive && (
          <div className="absolute bottom-2.5 inset-x-2.5 flex items-center justify-between px-3 py-1.5 bg-[#00101acc]/90 backdrop-blur-md rounded-lg border border-[#063750]/80">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={toggleMic}
                className={`p-1.5 rounded-md text-xs font-medium transition-colors ${
                  micActive 
                    ? 'text-emerald-400 hover:bg-emerald-950/40' 
                    : 'text-red-400 hover:bg-red-950/40'
                }`}
                title={micActive ? 'Mute microphone' : 'Unmute microphone'}
                aria-label={micActive ? 'Mute microphone' : 'Unmute microphone'}
              >
                {micActive ? <Mic className="w-3.5 h-3.5" /> : <MicOff className="w-3.5 h-3.5" />}
              </button>

              {/* Mic level visualizer */}
              <div className="w-16 h-1.5 bg-[#002236] rounded-full overflow-hidden border border-[#003855]">
                <div 
                  className={`h-full transition-all duration-75 ${micActive ? 'bg-emerald-400' : 'bg-slate-600'}`}
                  style={{ width: micActive ? `${micLevel}%` : '0%' }}
                />
              </div>
            </div>

            <button
              type="button"
              onClick={toggleCamera}
              className="px-2.5 py-1 rounded-md bg-red-950/60 hover:bg-red-900/80 border border-red-500/30 text-red-300 text-[11px] font-bold flex items-center gap-1 transition-colors"
            >
              <CameraOff className="w-3 h-3" />
              <span>Turn Off</span>
            </button>
          </div>
        )}
      </div>

      {/* Permission alert if denied */}
      {permissionError && (
        <div className="p-2.5 bg-amber-950/20 border border-amber-500/30 rounded-xl flex items-start gap-2 text-[11px] text-amber-300">
          <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
          <div className="space-y-0.5">
            <span className="font-bold">Notice:</span>
            <p className="text-slate-300">{permissionError}</p>
          </div>
        </div>
      )}

      {/* Presentation Setup Guidance Toggle */}
      <div className="pt-1">
        <button
          type="button"
          onClick={() => setShowSetupGuide(!showSetupGuide)}
          className="w-full flex items-center justify-between px-3 py-2 rounded-xl bg-[#001522] hover:bg-[#002235] border border-[#063750] text-[11px] font-bold text-slate-300 transition-colors"
        >
          <div className="flex items-center gap-2">
            <Sun className="w-3.5 h-3.5 text-[#FF4103]" />
            <span>Camera & Microphone Presentation Setup Guide</span>
          </div>
          {showSetupGuide ? <ChevronUp className="w-3.5 h-3.5 text-slate-400" /> : <ChevronDown className="w-3.5 h-3.5 text-slate-400" />}
        </button>

        {showSetupGuide && (
          <div className="mt-2 p-3 bg-[#00121d] rounded-xl border border-[#002d45] space-y-2.5 text-[11px]">
            <div className="flex items-start gap-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <strong className="text-slate-200">Front Lighting:</strong>
                <p className="text-slate-400 text-[10px] mt-0.5 leading-relaxed">
                  Position your primary light source in front of your face. Avoid sitting with bright windows directly behind you to prevent silhouetting.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <strong className="text-slate-200">Eye-Level Camera Framing:</strong>
                <p className="text-slate-400 text-[10px] mt-0.5 leading-relaxed">
                  Elevate your device so the camera is level with your eyes. Center your head and upper shoulders within the frame.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <strong className="text-slate-200">Acoustic Clarity & Noise:</strong>
                <p className="text-slate-400 text-[10px] mt-0.5 leading-relaxed">
                  Ensure a quiet room with minimal echo. Watch the green microphone level meter above while speaking to confirm audio responsiveness.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <strong className="text-slate-200">Speaking Pace & Articulation:</strong>
                <p className="text-slate-400 text-[10px] mt-0.5 leading-relaxed">
                  Aim for a measured delivery (~130–150 words/min) with deliberate pauses between structural points (e.g. Situation → Action → Result).
                </p>
              </div>
            </div>

            <div className="pt-1.5 border-t border-[#00283d] text-[10px] text-slate-400 italic">
              Note: This guide is purely for your personal professional presentation comfort. Evaluation evaluates job-relevant verbal evidence exclusively.
            </div>
          </div>
        )}
      </div>

      {/* Explicit Privacy & Ethical Charter Banner */}
      <div className="p-2.5 bg-[#00101a] border border-[#063750] rounded-xl flex items-start gap-2 text-[11px] text-slate-400">
        <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
        <div className="space-y-0.5">
          <span className="font-bold text-slate-300">Privacy & Fairness Invariant</span>
          <p className="leading-relaxed text-slate-400 text-[10px]">
            Preview is processed strictly in your local browser. Video is <strong className="text-slate-200">never recorded, uploaded, or analyzed</strong> for emotion, facial expression, or biometric personality scoring.
          </p>
        </div>
      </div>
    </div>
  );
}
