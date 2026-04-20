import { useNavigate } from 'react-router-dom';
import { useSchoolOnboarding, STEP_KEYS, type StepKey } from '@/hooks/useSchoolOnboarding';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import {
  Sparkles, ArrowRight, CheckCircle2, Circle, ChevronDown, ChevronUp, X,
  Compass, BookMarked, Users, GraduationCap, ClipboardList, Rocket,
} from 'lucide-react';
import { useEffect, useState } from 'react';

const STEP_META: Record<StepKey, { label: string; icon: any; desc: string }> = {
  welcome:   { label: 'Welcome',          icon: Compass,       desc: 'Tell us about your school' },
  framework: { label: 'Curriculum',       icon: BookMarked,    desc: 'Pick your framework' },
  roster:    { label: 'Add Students',     icon: Users,         desc: 'Import your student roster' },
  teachers:  { label: 'Invite Teachers',  icon: GraduationCap, desc: 'Bring your staff onboard' },
  gradebook: { label: 'Grade Book',       icon: ClipboardList, desc: 'Configure grading rules' },
  live:      { label: 'Go Live',          icon: Rocket,        desc: 'Activate your school' },
};

const DISMISS_KEY = 'onboarding-checklist-dismissed';

export const OnboardingChecklistWidget = () => {
  const { progress, loading } = useSchoolOnboarding();
  const navigate = useNavigate();
  const [expanded, setExpanded] = useState(true);
  const [dismissedThisSession, setDismissedThisSession] = useState(false);

  useEffect(() => {
    const stored = sessionStorage.getItem(DISMISS_KEY);
    if (stored === '1') setDismissedThisSession(true);
  }, []);

  if (loading || !progress || progress.completed_at || dismissedThisSession) return null;

  const completed = new Set(progress.completed_steps || []);
  const completedCount = completed.size;
  const total = STEP_KEYS.length;
  const pct = Math.round((completedCount / total) * 100);
  const isDone = completedCount === total;

  const dismiss = () => {
    sessionStorage.setItem(DISMISS_KEY, '1');
    setDismissedThisSession(true);
  };

  return (
    <Card className="mb-6 overflow-hidden border-primary/30 bg-gradient-to-br from-primary/5 via-background to-background">
      {/* Header */}
      <div className="p-4 flex items-center gap-3">
        <div className="p-2 rounded-lg bg-primary/15 shrink-0">
          <Sparkles className="h-5 w-5 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-semibold text-sm">Get your school live</h3>
            <Badge variant="secondary" className="text-xs">
              {completedCount} of {total} done
            </Badge>
            {isDone && <Badge className="text-xs bg-primary">Ready 🎉</Badge>}
          </div>
          <Progress value={pct} className="h-1.5 mt-2" />
        </div>
        <Button
          size="sm"
          onClick={() => navigate('/school-onboarding')}
          className="shrink-0"
        >
          {isDone ? 'Review' : 'Continue'}
          <ArrowRight className="h-3 w-3 ml-1" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 shrink-0"
          onClick={() => setExpanded((v) => !v)}
          aria-label={expanded ? 'Collapse' : 'Expand'}
        >
          {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 shrink-0 text-muted-foreground"
          onClick={dismiss}
          aria-label="Dismiss"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Steps grid */}
      {expanded && (
        <div className="px-4 pb-4">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2">
            {STEP_KEYS.map((key, idx) => {
              const meta = STEP_META[key];
              const isComplete = completed.has(key);
              const isCurrent = !isComplete && idx === completedCount;
              const Icon = meta.icon;
              return (
                <button
                  key={key}
                  onClick={() => navigate('/school-onboarding')}
                  className={`text-left p-3 rounded-lg border transition-all hover:shadow-sm ${
                    isComplete
                      ? 'border-primary/30 bg-primary/5'
                      : isCurrent
                      ? 'border-primary bg-card ring-2 ring-primary/20'
                      : 'border-border bg-card hover:border-primary/40'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1.5">
                    {isComplete ? (
                      <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
                    ) : (
                      <Circle className={`h-4 w-4 shrink-0 ${isCurrent ? 'text-primary' : 'text-muted-foreground/40'}`} />
                    )}
                    <Icon className={`h-3.5 w-3.5 ${isComplete ? 'text-primary' : 'text-muted-foreground'}`} />
                  </div>
                  <div className={`text-xs font-medium ${isComplete ? 'text-foreground' : 'text-foreground'}`}>
                    {meta.label}
                  </div>
                  <div className="text-[10px] text-muted-foreground line-clamp-1 mt-0.5">
                    {meta.desc}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </Card>
  );
};
