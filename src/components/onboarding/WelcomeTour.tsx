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
    />
  );
};
