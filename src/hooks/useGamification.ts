import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/components/ui/use-toast';
import { isMockDataEnabled } from '@/utils/mockDataToggle';
import { useQuestProgressNotification } from './useQuestProgressNotification';

export interface Challenge {
  id: string;
  title: string;
  description: string;
  target_value: number;
  current_value?: number;
  completed?: boolean;
  challenge_date: string;
}

export interface UserProgress {
  subject: string;
  completed_lessons: number;
  total_lessons: number;
  completion_percentage: number;
  time_spent: number;
  level: number;
}

export const useGamification = () => {
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [userProgress, setUserProgress] = useState<UserProgress[]>([]);
  const [userLevel, setUserLevel] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();
  const { 
    currentNotification, 
    showProgressUpdate, 
    clearNotification, 
    initializeQuestValues 
  } = useQuestProgressNotification();

  useEffect(() => {
    if (isMockDataEnabled()) {
      setIsLoading(true);
      setChallenges([]);
      setUserProgress([]);
      setUserLevel(3);
      setIsLoading(false);
      return;
    }

    if (user) {
      fetchGamificationData();
    }
  }, [user]);

  const fetchGamificationData = async () => {
    try {
      setIsLoading(true);
      
      // Fetch daily challenges
      const today = new Date().toISOString().split('T')[0];
      const { data: challengesData, error: challengesError } = await supabase
        .from('daily_challenges')
        .select('*')
        .eq('challenge_date', today);

      if (challengesError) throw challengesError;

      // Fetch user challenge progress
      const { data: challengeProgressData, error: challengeProgressError } = await supabase
        .from('user_challenge_progress')
        .select(`
          current_value,
          completed,
          daily_challenges (*)
        `)
        .eq('user_id', user?.id);

      if (challengeProgressError) throw challengeProgressError;

      // Fetch user progress across subjects
      const { data: progressData, error: progressError } = await supabase
        .from('user_progress')
        .select(`
          *,
          lessons (
            *,
            modules (
              *,
              subjects (*)
            )
          )
        `)
        .eq('user_id', user?.id);

      if (progressError) throw progressError;

      // Process challenges with user progress
      const processedChallenges = challengesData?.map(challenge => {
        const progress = challengeProgressData?.find(cp => 
          cp.daily_challenges?.id === challenge.id
        );
        return {
          ...challenge,
          current_value: progress?.current_value || 0,
          completed: progress?.completed || false
        };
      }) || [];

      setChallenges(processedChallenges);
      
      // Initialize quest values for progress tracking
      initializeQuestValues(processedChallenges);

      // Calculate user level and progress
      const totalCompletedLessons = progressData?.filter(p => p.status === 'completed').length || 0;
      const calculatedLevel = Math.floor(totalCompletedLessons / 5) + 1;
      setUserLevel(calculatedLevel);

      // Process subject-wise progress
      const subjectProgress = processSubjectProgress(progressData || []);
      setUserProgress(subjectProgress);

    } catch (error: any) {
      console.error('Error fetching gamification data:', error);
      toast({
        title: "Error",
        description: "Failed to load gamification data",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const processSubjectProgress = (progressData: any[]): UserProgress[] => {
    const subjectMap = new Map();

    progressData.forEach(progress => {
      const subject = progress.lessons?.modules?.subjects;
      if (!subject) return;

      if (!subjectMap.has(subject.id)) {
        subjectMap.set(subject.id, {
          subject: subject.name,
          completed_lessons: 0,
          total_lessons: 0,
          time_spent: 0,
          completion_percentage: 0,
          level: 1
        });
      }

      const subjectData = subjectMap.get(subject.id);
      subjectData.total_lessons += 1;
      subjectData.time_spent += progress.time_spent || 0;

      if (progress.status === 'completed') {
        subjectData.completed_lessons += 1;
      }
    });

    return Array.from(subjectMap.values()).map(subject => ({
      ...subject,
      completion_percentage: subject.total_lessons > 0 
        ? Math.round((subject.completed_lessons / subject.total_lessons) * 100)
        : 0,
      level: Math.floor(subject.completed_lessons / 3) + 1
    }));
  };

  const completeLesson = async (lessonId?: string, timeSpent: number = 0) => {
    console.log('🎯 CompleteLesson called:', { user: !!user, lessonId, timeSpent });
    if (!user) {
      console.log('❌ No user found, cannot complete lesson');
      return;
    }

    // Helper: validate UUID v4
    const isValidUuid = (val?: string) =>
      !!val && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(val);

    try {
      // Update or insert user progress
      const { error } = await supabase
        .from('user_progress')
        .upsert({
          user_id: user.id,
          lesson_id: isValidUuid(lessonId) ? (lessonId as any) : null,
          status: 'completed',
          completion_percentage: 100,
          time_spent: timeSpent,
          completed_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });

      if (error) throw error;

      // Extract lesson context from current study plan if available
      let lessonContext: { subject?: string; topic?: string; lessonTitle?: string } = {};
      
      try {
        const planId = localStorage.getItem('active_study_plan_id');
        if (planId) {
          const { data: studyPlan } = await supabase
            .from('study_plans')
            .select('*')
            .eq('id', planId)
            .eq('user_id', user.id)
            .maybeSingle();
            
          if (studyPlan && studyPlan.daily_lessons) {
            const currentDay = parseInt(new URLSearchParams(window.location.search).get('day') || '1');
            const currentLesson = (studyPlan.daily_lessons as any[]).find((l: any) => l.day === currentDay);
            
            if (currentLesson) {
              lessonContext = {
                subject: 'science', // Infer from lesson content
                topic: currentLesson.topic,
                lessonTitle: currentLesson.topic
              };
              
              // Smart subject detection based on topic
              const topicLower = currentLesson.topic.toLowerCase();
              if (topicLower.includes('displacement') || topicLower.includes('velocity') || 
                  topicLower.includes('speed') || topicLower.includes('motion') ||
                  topicLower.includes('physics') || topicLower.includes('force')) {
                lessonContext.subject = 'science';
              } else if (topicLower.includes('algebra') || topicLower.includes('geometry') || 
                        topicLower.includes('calculus') || topicLower.includes('equation')) {
                lessonContext.subject = 'math';
              } else if (topicLower.includes('grammar') || topicLower.includes('literature') || 
                        topicLower.includes('writing') || topicLower.includes('reading')) {
                lessonContext.subject = 'english';
              }
            }
          }
        }
      } catch (contextError) {
        console.log('Could not extract lesson context:', contextError);
      }

      console.log('🎯 Completing lesson with context:', lessonContext);

      // Update challenge progress with intelligent matching
      await updateChallengeProgress('lessons_completed', 1, lessonContext);

      // Refresh data
      await fetchGamificationData();

      toast({
        title: "Lesson Completed! 🎉",
        description: "Great job! Keep up the excellent work.",
      });

    } catch (error: any) {
      console.error('Error completing lesson:', error);
      toast({
        title: "Error",
        description: "Failed to update progress",
        variant: "destructive"
      });
    }
  };

  const updateChallengeProgress = async (type: string, increment: number, lessonContext?: {
    subject?: string;
    topic?: string;
    lessonTitle?: string;
  }) => {
    console.log('🎯 UpdateChallengeProgress called:', { user: !!user, type, increment, lessonContext });
    if (!user) {
      console.log('❌ No user found, cannot update challenge progress');
      return;
    }

    try {
      const today = new Date().toISOString().split('T')[0];
      
      // Smart quest matching logic
      const relevantChallenges = challenges.filter(challenge => {
        if (type === 'lessons_completed') {
          const titleLower = challenge.title.toLowerCase();
          const descriptionLower = challenge.description.toLowerCase();
          
          // Check if it's a lesson-based quest
          const isLessonQuest = titleLower.includes('lesson') || 
                               titleLower.includes('dose') ||
                               descriptionLower.includes('lesson') ||
                               descriptionLower.includes('complete');
          
          if (!isLessonQuest) return false;
          
          // If we have lesson context, do smart matching
          if (lessonContext) {
            const { subject, topic, lessonTitle } = lessonContext;
            
            // Subject matching
            if (subject) {
              const subjectLower = subject.toLowerCase();
              const hasSubjectMatch = titleLower.includes(subjectLower) || 
                                    descriptionLower.includes(subjectLower);
              
              // If quest mentions a specific subject, only match that subject
              const mentionsScience = titleLower.includes('science') || titleLower.includes('physics');
              const mentionsMath = titleLower.includes('math') || titleLower.includes('algebra') || titleLower.includes('geometry');
              const mentionsEnglish = titleLower.includes('english') || titleLower.includes('language');
              
              if (mentionsScience && subjectLower.includes('science')) return true;
              if (mentionsScience && (subjectLower.includes('physics') || subjectLower.includes('displacement') || subjectLower.includes('velocity'))) return true;
              if (mentionsMath && subjectLower.includes('math')) return true;
              if (mentionsEnglish && subjectLower.includes('english')) return true;
              
              // If quest is generic but we have subject context, be more inclusive
              if (hasSubjectMatch) return true;
            }
            
            // Topic matching
            if (topic) {
              const topicLower = topic.toLowerCase();
              if (titleLower.includes(topicLower) || descriptionLower.includes(topicLower)) {
                return true;
              }
            }
            
            // Lesson title matching
            if (lessonTitle) {
              const lessonTitleLower = lessonTitle.toLowerCase();
              // Extract key words from lesson title for matching
              const keyWords = lessonTitleLower.split(' ').filter(word => word.length > 3);
              const hasKeyWordMatch = keyWords.some(word => 
                titleLower.includes(word) || descriptionLower.includes(word)
              );
              if (hasKeyWordMatch) return true;
            }
          }
          
          // Fallback to generic lesson quest if no specific matching
          return true;
        }
        return false;
      });

      console.log('Quest matching results:', {
        type,
        lessonContext,
        totalChallenges: challenges.length,
        relevantChallenges: relevantChallenges.length,
        matchedQuests: relevantChallenges.map(c => ({ title: c.title, description: c.description }))
      });

      for (const challenge of relevantChallenges) {
        const oldValue = challenge.current_value || 0;
        const newValue = oldValue + increment;
        const completed = newValue >= challenge.target_value;
        
        const { error } = await supabase
          .from('user_challenge_progress')
          .upsert({
            user_id: user.id,
            challenge_id: challenge.id,
            current_value: newValue,
            completed
          });

        if (error) throw error;
        
        // Show progress notification if value increased
        if (newValue > oldValue) {
          const questType = challenge.title.toLowerCase().includes('daily') ? 'daily' : 'weekly';
          showProgressUpdate(
            challenge.id,
            challenge.title,
            newValue,
            challenge.target_value,
            questType as 'daily' | 'weekly'
          );
        }
      }
    } catch (error) {
      console.error('Error updating challenge progress:', error);
    }
  };

  return {
    challenges,
    userProgress,
    userLevel,
    isLoading,
    completeLesson,
    updateChallengeProgress,
    fetchGamificationData,
    // Quest progress notification
    questProgressNotification: currentNotification,
    clearQuestNotification: clearNotification
  };
};