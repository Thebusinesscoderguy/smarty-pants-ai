import { useState, useEffect } from 'react';
import { Joyride } from 'react-joyride';
import type { Step } from 'react-joyride';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

const tourSteps: Step[] = [
  {
    target: 'body',
    content: 'Welcome to Teachly! 🎓 Let me show you around the platform.',
    placement: 'center',
  },
  {
    target: '[data-tour="quiz-generator"]',
    content: 'Generate AI-powered quizzes and study plans here.',
    placement: 'bottom',
  },
  {
    target: '[data-tour="chat"]',
    content: 'Chat with your AI tutor for personalized help.',
    placement: 'bottom',
  },
  {
    target: '[data-tour="quests"]',
    content: 'Complete quests and earn achievements!',
    placement: 'bottom',
  },
];

const joyrideStyles = {
  options: {
    primaryColor: 'hsl(24, 95%, 53%)',
    zIndex: 10000,
    arrowColor: 'hsl(var(--card))',
    backgroundColor: 'hsl(var(--card))',
    textColor: 'hsl(var(--foreground))',
  },
  tooltip: {
    borderRadius: '1rem',
    padding: '1.25rem',
    boxShadow: '0 10px 30px -10px rgba(0,0,0,0.15)',
  },
  tooltipContent: {
    fontSize: '0.925rem',
    lineHeight: '1.5',
  },
  buttonNext: {
    borderRadius: '0.75rem',
    padding: '0.5rem 1.25rem',
    fontSize: '0.875rem',
    fontWeight: 600,
    backgroundColor: 'hsl(24, 95%, 53%)',
  },
  buttonBack: {
    borderRadius: '0.75rem',
    padding: '0.5rem 1.25rem',
    fontSize: '0.875rem',
    color: 'hsl(var(--muted-foreground))',
  },
  buttonSkip: {
    fontSize: '0.8rem',
    color: 'hsl(var(--muted-foreground))',
  },
  spotlight: {
    borderRadius: '1rem',
  },
};

export const WelcomeTour = () => {
  const { user } = useAuth();
  const [run, setRun] = useState(false);

  useEffect(() => {
    if (!user) return;
    const checkOnboarding = async () => {
      const { data } = await supabase
        .from('profiles')
        .select('onboarding_completed')
        .eq('id', user.id)
        .single();
      if (data && !data.onboarding_completed) {
        setTimeout(() => setRun(true), 1000);
      }
    };
    checkOnboarding();
  }, [user]);

  const handleEvent = (event: any) => {
    if (event.type === 'tour:end') {
      setRun(false);
      if (user) {
        supabase.from('profiles').update({ onboarding_completed: true }).eq('id', user.id);
      }
    }
  };

  if (!user) return null;

  return (
    <Joyride
      steps={tourSteps}
      run={run}
      continuous
      onEvent={handleEvent}
      styles={joyrideStyles}
    />
  );
};
