import { useState, useEffect, useRef } from 'react';
import { Loader2 } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';

interface GenerationProgressProps {
  isGenerating: boolean;
  estimatedSeconds?: number;
  label?: string;
  className?: string;
}

export const GenerationProgress = ({
  isGenerating,
  estimatedSeconds = 30,
  label = 'Generating...',
  className,
}: GenerationProgressProps) => {
  const [elapsed, setElapsed] = useState(0);
  const startRef = useRef<number | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (isGenerating) {
      setElapsed(0);
      startRef.current = Date.now();
      intervalRef.current = setInterval(() => {
        if (startRef.current) {
          setElapsed(Math.floor((Date.now() - startRef.current) / 1000));
        }
      }, 500);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
      startRef.current = null;
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isGenerating]);

  if (!isGenerating) return null;

  // Progress: ease-out curve that approaches 95% and never exceeds it
  const ratio = Math.min(elapsed / estimatedSeconds, 1);
  const progressValue = Math.min(95, Math.round(ratio * 85 + (1 - Math.exp(-ratio * 3)) * 10));

  const remaining = Math.max(0, estimatedSeconds - elapsed);
  const isOvertime = elapsed > estimatedSeconds;

  const formatTime = (s: number) => {
    if (s < 60) return `${s}s`;
    return `${Math.floor(s / 60)}m ${s % 60}s`;
  };

  return (
    <div className={cn('space-y-3 p-4 rounded-xl border border-border bg-muted/30 animate-fade-in', className)}>
      <div className="flex items-center gap-3">
        <div className="relative">
          <Loader2 className="h-5 w-5 animate-spin text-primary" />
          <div className="absolute inset-0 h-5 w-5 animate-ping opacity-20 rounded-full bg-primary" />
        </div>
        <span className="text-sm font-medium text-foreground">{label}</span>
      </div>

      <Progress value={progressValue} className="h-2" />

      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>
          {isOvertime
            ? `Taking longer than expected... (${formatTime(elapsed)} elapsed)`
            : `~${formatTime(remaining)} remaining`}
        </span>
        <span className="tabular-nums">{formatTime(elapsed)} elapsed</span>
      </div>
    </div>
  );
};
