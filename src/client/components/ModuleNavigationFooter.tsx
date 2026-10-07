import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowRight, ArrowLeft, CheckCircle2, Loader2, Sparkles, 
  FileText, Target, Laptop, Brain, BarChart3, Check
} from 'lucide-react';

export type CandidateModuleKey = 'M01' | 'M02' | 'M03' | 'M04' | 'M05';

export interface ModuleStepDef {
  key: CandidateModuleKey;
  order: number;
  label: string;
  shortName: string;
  fullName: string;
  path: string;
  icon: React.ComponentType<{ className?: string }>;
}

export const CANDIDATE_JOURNEY_STEPS: ModuleStepDef[] = [
  { key: 'M01', order: 1, label: 'M01', shortName: 'Resume', fullName: 'Resume Intelligence', path: '/resume', icon: FileText },
  { key: 'M02', order: 2, label: 'M02', shortName: 'Assessment', fullName: 'Adaptive Assessment', path: '/assess', icon: Target },
  { key: 'M03', order: 3, label: 'M03', shortName: 'Simulation', fullName: 'Technical & Domain Simulation', path: '/simulation', icon: Laptop },
  { key: 'M04', order: 4, label: 'M04', shortName: 'Interviews', fullName: 'Structured Interviews', path: '/interviews', icon: Brain },
  { key: 'M05', order: 5, label: 'M05', shortName: 'Readiness', fullName: 'Decision Support & Results', path: '/results', icon: BarChart3 },
];

export interface ModuleNavigationFooterProps {
  currentModule: CandidateModuleKey;
  isCompleted?: boolean;
  onBeforeNavigate?: () => Promise<boolean | void>;
  nextCustomPath?: string;
  nextCustomTitle?: string;
  saveStatusText?: string;
  secondaryAction?: {
    label: string;
    onClick: () => void;
  };
}

export default function ModuleNavigationFooter({
  currentModule,
  isCompleted = false,
  onBeforeNavigate,
  nextCustomPath,
  nextCustomTitle,
  saveStatusText,
  secondaryAction,
}: ModuleNavigationFooterProps) {
  const navigate = useNavigate();
  const [navigating, setNavigating] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const currentIndex = CANDIDATE_JOURNEY_STEPS.findIndex(s => s.key === currentModule);
  const currentStep = CANDIDATE_JOURNEY_STEPS[currentIndex] || CANDIDATE_JOURNEY_STEPS[0];
  const nextStep = currentIndex < CANDIDATE_JOURNEY_STEPS.length - 1 ? CANDIDATE_JOURNEY_STEPS[currentIndex + 1] : null;
  const prevStep = currentIndex > 0 ? CANDIDATE_JOURNEY_STEPS[currentIndex - 1] : null;

  const targetNextPath = nextCustomPath || (nextStep ? nextStep.path : '/dashboard');
  const targetNextTitle = nextCustomTitle || (nextStep ? `${nextStep.label} · ${nextStep.shortName}` : 'Command Center');

  const handleNextClick = async () => {
    if (navigating) return;
    setErrorMsg(null);
    setNavigating(true);

    try {
      if (onBeforeNavigate) {
        const canContinue = await onBeforeNavigate();
        if (canContinue === false) {
          setNavigating(false);
          return;
        }
      }
      navigate(targetNextPath);
    } catch (err: any) {
      console.error('Error during module transition:', err);
      setErrorMsg(err.message || 'Failed to complete module transition');
      setNavigating(false);
    }
  };

  const handlePrevClick = () => {
    if (prevStep) {
      navigate(prevStep.path);
    }
  };

  return (
    <footer 
      role="navigation" 
      aria-label="IntelliHire Candidate Journey Navigation"
      className="mt-12 pt-6 pb-4 border-t border-[#063750] bg-[#001420]/90 backdrop-blur-md sticky bottom-0 z-40 rounded-t-2xl shadow-2xl px-4 sm:px-6"
    >
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Left: Journey Stepper */}
        <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto py-1">
          {CANDIDATE_JOURNEY_STEPS.map((step, idx) => {
            const isCurrent = step.key === currentModule;
            const isPast = idx < currentIndex;
            const Icon = step.icon;

            return (
              <button
                key={step.key}
                type="button"
                onClick={() => {
                  if (!navigating && (isPast || isCurrent)) {
                    navigate(step.path);
                  }
                }}
                disabled={!isPast && !isCurrent}
                aria-current={isCurrent ? 'step' : undefined}
                title={`${step.label}: ${step.fullName}`}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  isCurrent
                    ? 'bg-[#FF4103]/20 border border-[#FF4103] text-white shadow-sm ring-1 ring-[#FF4103]/40'
                    : isPast
                    ? 'bg-[#001f2e] border border-emerald-500/30 text-emerald-300 hover:text-white hover:border-emerald-500/60'
                    : 'bg-[#001824] border border-[#063750] text-slate-500 cursor-not-allowed opacity-60'
                }`}
              >
                {isPast ? (
                  <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                ) : (
                  <Icon className={`w-3.5 h-3.5 shrink-0 ${isCurrent ? 'text-[#FF4103]' : 'text-slate-400'}`} />
                )}
                <span>{step.label}</span>
                <span className="hidden lg:inline text-[11px] font-normal opacity-80">{step.shortName}</span>
              </button>
            );
          })}
        </div>

        {/* Center / Status Indicator */}
        <div className="flex items-center gap-3 text-xs text-slate-300">
          {errorMsg ? (
            <span className="text-red-400 bg-red-950/40 px-3 py-1 rounded border border-red-500/30">
              {errorMsg}
            </span>
          ) : isCompleted ? (
            <span className="flex items-center gap-1.5 text-emerald-400 bg-emerald-950/30 px-3 py-1 rounded-lg border border-emerald-500/30 font-medium">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>{currentStep.label} Completed</span>
            </span>
          ) : saveStatusText ? (
            <span className="text-slate-400 italic">
              {saveStatusText}
            </span>
          ) : null}
        </div>

        {/* Right / Action Controls */}
        <div className="flex items-center justify-end gap-3 w-full md:w-auto">
          {prevStep && (
            <button
              type="button"
              onClick={handlePrevClick}
              disabled={navigating}
              className="px-3.5 py-2.5 rounded-xl bg-[#001f2e] hover:bg-[#002b40] border border-[#063750] text-slate-300 hover:text-white text-xs font-semibold flex items-center gap-1.5 transition-all focus:outline-none focus:ring-2 focus:ring-[#063750]"
              aria-label={`Previous: Return to ${prevStep.label} ${prevStep.shortName}`}
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Back to</span> {prevStep.label}
            </button>
          )}

          {secondaryAction && (
            <button
              type="button"
              onClick={secondaryAction.onClick}
              disabled={navigating}
              className="px-4 py-2.5 rounded-xl bg-[#001f2e] hover:bg-[#002b40] border border-[#063750] text-slate-200 hover:text-white text-xs font-bold transition-all focus:outline-none focus:ring-2 focus:ring-[#063750]"
            >
              {secondaryAction.label}
            </button>
          )}

          <button
            type="button"
            onClick={handleNextClick}
            disabled={navigating}
            className="px-5 py-2.5 rounded-xl bg-[#FF4103] hover:bg-[#e03200] active:scale-[0.98] text-white text-xs font-bold flex items-center gap-2 shadow-lg shadow-[#FF4103]/25 transition-all focus:outline-none focus:ring-2 focus:ring-[#FF4103] focus:ring-offset-2 focus:ring-offset-[#001621] disabled:opacity-50"
            aria-label={`Proceed to Next Module: ${targetNextTitle}`}
          >
            {navigating ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Saving & Continuing…</span>
              </>
            ) : (
              <>
                <span>Next Module: {targetNextTitle}</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </div>
    </footer>
  );
}
