import { useNavigate } from 'react-router-dom';
import { useSchoolOnboarding, STEP_KEYS } from '@/hooks/useSchoolOnboarding';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Sparkles, ArrowRight, X } from 'lucide-react';
import { useState } from 'react';

export const ResumeOnboardingBanner = () => {
  const { progress, loading } = useSchoolOnboarding();
  const navigate = useNavigate();
  const [dismissed, setDismissed] = useState(false);

  if (loading || !progress || progress.completed_at || dismissed) return null;

  const completedCount = (progress.completed_steps || []).length;
  const total = STEP_KEYS.length;
  const pct = (completedCount / total) * 100;

  return (
    <Card className="p-4 mb-6 bg-gradient-to-r from-primary/10 via-primary/5 to-transparent border-primary/30">
      <div className="flex items-center gap-4">
        <div className="p-2 rounded-lg bg-primary/20 shrink-0">
          <Sparkles className="h-5 w-5 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm">Finish setting up your school</p>
          <p className="text-xs text-muted-foreground mb-2">
            {completedCount} of {total} steps complete — pick up where you left off.
          </p>
          <Progress value={pct} className="h-1" />
        </div>
        <Button size="sm" onClick={() => navigate('/school-onboarding')}>
          Resume <ArrowRight className="h-3 w-3 ml-1" />
        </Button>
        <Button variant="ghost" size="icon" onClick={() => setDismissed(true)}>
          <X className="h-4 w-4" />
        </Button>
      </div>
    </Card>
  );
};
