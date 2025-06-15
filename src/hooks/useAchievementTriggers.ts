
import { useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';

export const useAchievementTriggers = () => {
  const { user } = useAuth();

  const checkAndAwardAchievements = useCallback(async (context: {
    type: 'lesson_complete' | 'quiz_complete' | 'streak' | 'mastery';
    data?: any;
  }) => {
    if (!user) return;

    try {
      // Get user's current progress and stats
      const { data: analytics } = await supabase
        .from('learning_analytics')
        .select('*')
        .eq('user_id', user.id);

      const { data: interactions } = await supabase
        .from('student_interactions')
        .select('created_at')
        .eq('student_id', user.id)
        .order('created_at', { ascending: false })
        .limit(30);

      // Get current achievements
      const { data: currentAchievements } = await supabase
        .from('user_achievements')
        .select('achievement_id')
        .eq('user_id', user.id);

      const earnedIds = new Set(currentAchievements?.map(a => a.achievement_id) || []);

      // Check for various achievement conditions
      const achievementsToAward = [];

      // First lesson achievement
      if (context.type === 'lesson_complete' && interactions && interactions.length === 1) {
        const { data: firstLessonAchievement } = await supabase
          .from('achievements')
          .select('id')
          .eq('name', 'First Steps')
          .single();
        
        if (firstLessonAchievement && !earnedIds.has(firstLessonAchievement.id)) {
          achievementsToAward.push(firstLessonAchievement.id);
        }
      }

      // Mastery achievements (80% strength score in a subject)
      if (analytics) {
        for (const analytic of analytics) {
          if (analytic.strength_score >= 0.8) {
            const { data: masteryAchievement } = await supabase
              .from('achievements')
              .select('id')
              .ilike('name', '%master%')
              .single();
            
            if (masteryAchievement && !earnedIds.has(masteryAchievement.id)) {
              achievementsToAward.push(masteryAchievement.id);
            }
          }
        }
      }

      // Award new achievements
      for (const achievementId of achievementsToAward) {
        await supabase
          .from('user_achievements')
          .insert({
            user_id: user.id,
            achievement_id: achievementId
          });

        // Get achievement details for notification
        const { data: achievement } = await supabase
          .from('achievements')
          .select('name, icon')
          .eq('id', achievementId)
          .single();

        if (achievement) {
          toast({
            title: "Achievement Unlocked! 🏆",
            description: `${achievement.icon || '🏆'} ${achievement.name}`,
          });
        }
      }

    } catch (error) {
      console.error('Error checking achievements:', error);
    }
  }, [user]);

  return { checkAndAwardAchievements };
};
