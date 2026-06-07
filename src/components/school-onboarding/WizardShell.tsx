import { ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Check, ChevronLeft, ChevronRight, Sparkles } from 'lucide-react';
import { STEP_KEYS, StepKey } from '@/hooks/useSchoolOnboarding';

const STEP_LABELS: Record<StepKey, string> = {
  welcome: 'Welcome',
  roster: 'Students',
  teachers: 'Teachers',
  gradebook: 'Gradebook',
  live: "You're live",
};

interface Props {
  currentStep: number;
  completedSteps: string[];
  onStepClick: (idx: number) => void;
  onBack?: () => void;
  onNext?: () => void;
  onSkip?: () => void;
  nextLabel?: string;
  nextDisabled?: boolean;
  hideNext?: boolean;
  hideBack?: boolean;
  title: string;
  subtitle?: string;
  children: ReactNode;
}

export const WizardShell = ({
  currentStep, completedSteps, onStepClick, onBack, onNext, onSkip,
  nextLabel = 'Continue', nextDisabled, hideNext, hideBack, title, subtitle, children,
}: Props) => {
  const pct = ((currentStep) / (STEP_KEYS.length - 1)) * 100;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="border-b bg-card/50 backdrop-blur sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 py-4">
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="h-5 w-5 text-primary" />
            <h2 className="font-bold">School Setup</h2>
            <span className="text-xs text-muted-foreground ml-auto">~15 minutes</span>
          </div>
          <Progress value={pct} className="h-1.5 mb-3" />
          <div className="flex items-center justify-between gap-2 overflow-x-auto">
            {STEP_KEYS.map((key, idx) => {
              const isDone = completedSteps.includes(key);
              const isCurrent = idx === currentStep;
              const reachable = isDone || idx <= currentStep;
              return (
                <button
                  key={key}
                  onClick={() => reachable && onStepClick(idx)}
                  disabled={!reachable}
                  className={`flex items-center gap-2 text-xs whitespace-nowrap px-2 py-1 rounded transition-colors ${
                    isCurrent ? 'text-primary font-semibold' : isDone ? 'text-foreground' : 'text-muted-foreground'
                  } ${reachable ? 'hover:bg-muted cursor-pointer' : 'cursor-not-allowed opacity-50'}`}
                >
                  <span className={`flex items-center justify-center h-5 w-5 rounded-full text-[10px] ${
                    isDone ? 'bg-primary text-primary-foreground' : isCurrent ? 'border-2 border-primary' : 'border border-muted-foreground/40'
                  }`}>
                    {isDone ? <Check className="h-3 w-3" /> : idx + 1}
                  </span>
                  {STEP_LABELS[key]}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold">{title}</h1>
          {subtitle && <p className="text-muted-foreground mt-2">{subtitle}</p>}
        </div>

        <div className="mb-8">{children}</div>

        <div className="flex items-center justify-between border-t pt-6">
          <div>
            {!hideBack && (
              <Button variant="ghost" onClick={onBack} disabled={currentStep === 0}>
                <ChevronLeft className="h-4 w-4 mr-1" /> Back
              </Button>
            )}
          </div>
          <div className="flex items-center gap-2">
            {onSkip && (
              <Button variant="ghost" onClick={onSkip}>Skip for now</Button>
            )}
            {!hideNext && (
              <Button onClick={onNext} disabled={nextDisabled}>
                {nextLabel} <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
