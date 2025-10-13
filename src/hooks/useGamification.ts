import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/components/ui/use-toast';
import { isMockDataEnabled } from '@/utils/mockDataToggle';
import { useQuestProgressNotification } from './useQuestProgressNotification';
import { useQuestEvents } from './useQuestEvents';

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
  const questEvents = useQuestEvents();

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
              
              // Smart subject detection based on topic - more precise classification
              const topicLower = currentLesson.topic.toLowerCase();
              
              // Physics/Science keywords (most specific first)
              if (topicLower.includes('displacement') || topicLower.includes('velocity') || 
                  topicLower.includes('speed') || topicLower.includes('motion') ||
                  topicLower.includes('physics') || topicLower.includes('force') ||
                  topicLower.includes('energy') || topicLower.includes('momentum') ||
                  topicLower.includes('acceleration') || topicLower.includes('friction') ||
                  topicLower.includes('gravity') || topicLower.includes('wave') ||
                  topicLower.includes('light') || topicLower.includes('sound') ||
                  topicLower.includes('electric') || topicLower.includes('magnetic') ||
                  topicLower.includes('atom') || topicLower.includes('molecule') ||
                  topicLower.includes('chemistry') || topicLower.includes('biology')) {
                lessonContext.subject = 'science';
              } 
              // Math keywords (comprehensive math detection)
              else if (topicLower.includes('algebra') || topicLower.includes('geometry') || 
                        topicLower.includes('calculus') || topicLower.includes('trigonometry') ||
                        topicLower.includes('statistics') || topicLower.includes('probability') ||
                        topicLower.includes('slope') || topicLower.includes('intercept') ||
                        topicLower.includes('linear') || topicLower.includes('quadratic') ||
                        topicLower.includes('polynomial') || topicLower.includes('function') ||
                        topicLower.includes('graph') || topicLower.includes('coordinate') ||
                        topicLower.includes('math') || topicLower.includes('arithmetic') ||
                        topicLower.includes('fraction') || topicLower.includes('decimal') ||
                        topicLower.includes('ratio') || topicLower.includes('proportion') ||
                        topicLower.includes('exponent') || topicLower.includes('logarithm') ||
                        (topicLower.includes('equation') && !topicLower.includes('motion') && !topicLower.includes('physics'))) {
                lessonContext.subject = 'math';
              }
              // English keywords
              else if (topicLower.includes('grammar') || topicLower.includes('literature') || 
                        topicLower.includes('writing') || topicLower.includes('reading') ||
                        topicLower.includes('essay') || topicLower.includes('poetry')) {
                lessonContext.subject = 'english';
              }
              // Default to science for ambiguous topics
              else {
                lessonContext.subject = 'science';
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

      // Log quest event for AI classification
      if (lessonContext?.subject || lessonContext?.topic) {
        await questEvents.logQuestEvent({
          source: 'lesson',
          event_type: 'lesson_completed',
          payload: {
            lesson_id: lessonId,
            subject_name: lessonContext?.subject,
            topic: lessonContext?.topic,
            lesson_title: lessonContext?.lessonTitle,
            time_spent: timeSpent
          }
        });
      }

      // Only refresh the specific data that might have changed, not everything
      // This prevents unnecessary updates to other quests

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
      
      // Smart quest matching logic - STRICT matching only
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
          
          // If we have lesson context, do STRICT matching only
          if (lessonContext) {
            const { subject } = lessonContext;
            
            // Subject matching - ONLY match if quest explicitly mentions the subject
            if (subject) {
              const subjectLower = subject.toLowerCase();
              
              // Check if quest mentions specific subjects
              const mentionsScience = titleLower.includes('science') || titleLower.includes('physics');
              const mentionsMath = titleLower.includes('math') || titleLower.includes('algebra') || titleLower.includes('geometry') || 
                                 titleLower.includes('slope') || titleLower.includes('equation') || titleLower.includes('calculus');
              const mentionsEnglish = titleLower.includes('english') || titleLower.includes('language');
              
              // STRICT matching - only if subject and quest match exactly
              if (subjectLower.includes('science') || subjectLower.includes('physics')) {
                return mentionsScience;
              }
              if (subjectLower.includes('math')) {
                return mentionsMath;
              }
              if (subjectLower.includes('english')) {
                return mentionsEnglish;
              }
              
              // No match found
              return false;
            }
          }
          
          // Without proper context, don't update any quest
          return false;
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

      let notificationShown = false;
      
      const firstChallenge = relevantChallenges[0];
      if (firstChallenge) {
        const oldValue = firstChallenge.current_value || 0;
        const newValue = oldValue + increment;
        const completed = newValue >= firstChallenge.target_value;
        
        const { error } = await supabase
          .from('user_challenge_progress')
          .upsert({
            user_id: user.id,
            challenge_id: firstChallenge.id,
            current_value: newValue,
            completed
          });

        if (error) throw error;
        // No popup for challenges to avoid duplicates; quests will handle notification
      }

      // Also update "quests" progress (separate from daily_challenges)
      try {
        const { data: activeQuests, error: questsFetchError } = await supabase
          .from('quests')
          .select('id, title, description, target_value, type, subject_id')
          .eq('is_active', true);

        if (questsFetchError) {
          console.warn('Could not fetch quests for progress update:', questsFetchError);
        } else {
          // Smart match quests similar to challenges
          const matchedQuests = (activeQuests || []).filter((q) => {
            const titleLower = (q.title || '').toLowerCase();
            const descLower = (q.description || '').toLowerCase();

            if (type === 'lessons_completed') {
              const isLessonQuest = titleLower.includes('lesson') || descLower.includes('lesson') || descLower.includes('complete');
              if (!isLessonQuest) return false;

              if (lessonContext) {
                const subject = (lessonContext.subject || '').toLowerCase();

                // Only match quests that explicitly mention the subject we're working on
                const mentionsScience = titleLower.includes('science') || titleLower.includes('physics') || descLower.includes('science') || descLower.includes('physics');
                const mentionsMath = titleLower.includes('math') || titleLower.includes('algebra') || titleLower.includes('geometry') || 
                                   titleLower.includes('slope') || titleLower.includes('equation') || titleLower.includes('calculus') ||
                                   descLower.includes('math') || descLower.includes('algebra') || descLower.includes('geometry');
                const mentionsEnglish = titleLower.includes('english') || titleLower.includes('language') || descLower.includes('english');

                // STRICT matching - only update if the quest specifically mentions the subject
                if (subject.includes('science') || subject.includes('physics')) {
                  return mentionsScience;
                }
                if (subject.includes('math')) {
                  return mentionsMath;
                }
                if (subject.includes('english')) {
                  return mentionsEnglish;
                }
                
                // If no specific subject match, don't update any quest
                return false;
              }

              // Without context, don't update any quest to avoid unintended updates
              return false;
            }

            return false;
          });

          console.log('🎯 Matched quests for progress update:', matchedQuests.map(q => q.title));

          const topQuest = matchedQuests[0];
          if (topQuest) {
            // Determine effective target from DB value or parse from title/description
            const parseTarget = (q: any) => {
              const text = `${q.title || ''} ${q.description || ''}`;
              const nums = text.match(/\b(\d+)\b/);
              const parsed = nums ? parseInt(nums[1], 10) : NaN;
              // Prefer explicit DB target_value when > 1; otherwise use parsed number; fallback to 1
              return q.target_value && q.target_value > 1
                ? q.target_value
                : (Number.isFinite(parsed) && parsed > 1 ? parsed : (q.target_value || 1));
            };

            const effectiveTarget = parseTarget(topQuest);

            // Read existing value
            const { data: existing, error: existingErr } = await supabase
              .from('user_quest_progress')
              .select('current_value, completed')
              .eq('user_id', user.id)
              .eq('quest_id', topQuest.id)
              .maybeSingle();

            if (existingErr) {
              console.warn('Could not read existing quest progress:', { questId: topQuest.id, error: existingErr });
            }

            const oldValue = existing?.current_value || 0;
            const newValue = oldValue + increment;
            const completed = newValue >= effectiveTarget;

            const { error: upsertErr } = await supabase
              .from('user_quest_progress')
              .upsert({
                user_id: user.id,
                quest_id: topQuest.id,
                current_value: newValue,
                completed,
                completed_at: completed ? new Date().toISOString() : null
              } as any, { onConflict: 'user_id,quest_id' } as any);

            if (upsertErr) throw upsertErr;

            if (newValue > oldValue && !notificationShown) {
              showProgressUpdate(
                topQuest.id,
                topQuest.title,
                newValue,
                effectiveTarget,
                (topQuest.type as 'daily' | 'weekly') || 'daily'
              );
              notificationShown = true;
            }
          }
        }
      } catch (questsUpdateErr) {
        console.error('Error updating quests progress:', questsUpdateErr);
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