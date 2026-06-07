import { useNavigate } from 'react-router-dom';
import { useSchoolOnboarding, type StepKey } from '@/hooks/useSchoolOnboarding';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import {
  Sparkles, ArrowRight, CheckCircle2, Circle, ChevronDown, ChevronUp, X,
  School, GraduationCap, Users, ClipboardList,
} from 'lucide-react';
import { useEffect, useState } from 'react';

// 4-step activation checklist (maps to backend step keys)
const CHECKLIST: { key: StepKey; label: string; desc: string; icon: any }[] = [
  { key: 'welcome',   label: 'Name your school',      desc: 'Set school identity',       icon: School },
  { key: 'teachers',  label: 'Add your first teacher', desc: 'Invite a staff member',     icon: GraduationCap },
  { key: 'roster',    label: 'Add your first students', desc: 'Import or invite students', icon: Users },
  { key: 'gradebook', label: 'Create first assignment', desc: 'Set up gradebook',         icon: ClipboardList },
];

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
  const completedCount = CHECKLIST.filter(s => completed.has(s.key)).length;
  const total = CHECKLIST.length;
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
              {completedCount} of {total} steps complete
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
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2">
            {CHECKLIST.map((step, idx) => {
              const isComplete = completed.has(step.key);
              const isCurrent = !isComplete && CHECKLIST.slice(0, idx).every(s => completed.has(s.key));
              const Icon = step.icon;
              return (
                <button
                  key={step.key}
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
                  <div className="text-xs font-medium text-foreground">
                    {idx + 1}. {step.label}
                  </div>
                  <div className="text-[10px] text-muted-foreground line-clamp-1 mt-0.5">
                    {step.desc}
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
