
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/components/ui/use-toast';
import { isMockDataEnabled } from '@/utils/mockDataToggle';
import { mockAchievements } from '@/utils/mockData';

export interface Achievement {
  id: string;
  name: string;
  description: string;
  type: 'milestone' | 'streak' | 'completion' | 'mastery' | 'challenge';
  icon: string;
  criteria?: any;
  earned_at?: string;
}

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
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [userAchievements, setUserAchievements] = useState<Achievement[]>([]);
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [userProgress, setUserProgress] = useState<UserProgress[]>([]);
  const [userLevel, setUserLevel] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    if (isMockDataEnabled()) {
      setIsLoading(true);
      // Properly type the mock achievements
      const mockAchievementsWithCriteria: Achievement[] = mockAchievements.map(achievement => ({
        ...achievement,
        type: achievement.type as 'milestone' | 'streak' | 'completion' | 'mastery' | 'challenge',
        criteria: achievement.type === 'milestone' ? { lessons_completed: 1 } : {}
      }));
      setAchievements(mockAchievementsWithCriteria);
      setUserAchievements(mockAchievementsWithCriteria.filter(a => a.earned_at));
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
      
      // Fetch all achievements
      const { data: achievementsData, error: achievementsError } = await supabase
        .from('achievements')
        .select('*');
      
      if (achievementsError) throw achievementsError;

      // Fetch user's earned achievements
      const { data: userAchievementsData, error: userAchievementsError } = await supabase
        .from('user_achievements')
        .select(`
          earned_at,
          achievements (*)
        `)
        .eq('user_id', user?.id);

      if (userAchievementsError) throw userAchievementsError;

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

      setAchievements(achievementsData || []);
      setUserAchievements(userAchievementsData?.map(ua => ({
        ...ua.achievements,
        earned_at: ua.earned_at
      })) || []);

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

  const completeLesson = async (lessonId: string, timeSpent: number = 0) => {
    if (!user) return;

    try {
      // Update or insert user progress
      const { error } = await supabase
        .from('user_progress')
        .upsert({
          user_id: user.id,
          lesson_id: lessonId,
          status: 'completed',
          completion_percentage: 100,
          time_spent: timeSpent,
          completed_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });

      if (error) throw error;

      // Check for new achievements
      await checkAchievements();
      
      // Update challenge progress
      await updateChallengeProgress('lessons_completed', 1);

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

  const checkAchievements = async () => {
    if (!user) return;

    try {
      // Get user's current progress stats
      const { data: progressData } = await supabase
        .from('user_progress')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'completed');

      const completedLessons = progressData?.length || 0;

      // Check each achievement criteria
      for (const achievement of achievements) {
        const criteria = achievement.criteria;
        let shouldEarn = false;

        switch (achievement.type) {
          case 'milestone':
            if (criteria.lessons_completed && completedLessons >= criteria.lessons_completed) {
              shouldEarn = true;
            }
            break;
          case 'challenge':
            if (criteria.lessons_per_day) {
              // Check if user completed required lessons today
              const today = new Date().toISOString().split('T')[0];
              const { data: todayProgress } = await supabase
                .from('user_progress')
                .select('*')
                .eq('user_id', user.id)
                .eq('status', 'completed')
                .gte('completed_at', today + 'T00:00:00.000Z')
                .lt('completed_at', today + 'T23:59:59.999Z');

              if (todayProgress && todayProgress.length >= criteria.lessons_per_day) {
                shouldEarn = true;
              }
            }
            break;
        }

        if (shouldEarn && !userAchievements.find(ua => ua.id === achievement.id)) {
          await earnAchievement(achievement.id);
        }
      }
    } catch (error) {
      console.error('Error checking achievements:', error);
    }
  };

  const earnAchievement = async (achievementId: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('user_achievements')
        .insert({
          user_id: user.id,
          achievement_id: achievementId
        });

      if (error) throw error;

      const achievement = achievements.find(a => a.id === achievementId);
      if (achievement) {
        toast({
          title: "Achievement Unlocked! 🏆",
          description: `${achievement.icon} ${achievement.name}`,
        });
      }
    } catch (error) {
      console.error('Error earning achievement:', error);
    }
  };

  const updateChallengeProgress = async (type: string, increment: number) => {
    if (!user) return;

    try {
      const today = new Date().toISOString().split('T')[0];
      
      // Find relevant challenges for today
      const relevantChallenges = challenges.filter(challenge => {
        if (type === 'lessons_completed' && 
            (challenge.title.includes('lesson') || challenge.title.includes('Dose'))) {
          return true;
        }
        return false;
      });

      for (const challenge of relevantChallenges) {
        const { error } = await supabase
          .from('user_challenge_progress')
          .upsert({
            user_id: user.id,
            challenge_id: challenge.id,
            current_value: (challenge.current_value || 0) + increment,
            completed: (challenge.current_value || 0) + increment >= challenge.target_value
          });

        if (error) throw error;
      }
    } catch (error) {
      console.error('Error updating challenge progress:', error);
    }
  };

  return {
    achievements,
    userAchievements,
    challenges,
    userProgress,
    userLevel,
    isLoading,
    completeLesson,
    checkAchievements,
    updateChallengeProgress,
    fetchGamificationData
  };
};
