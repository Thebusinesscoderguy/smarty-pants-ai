
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

export const useActivityTracking = () => {
  const { user } = useAuth();

  const logActivity = async (
    activityType: string,
    subjectId?: string,
    durationMinutes?: number,
    score?: number,
    metadata?: any
  ) => {
    if (!user) return;

    try {
      // Get user's school
      const { data: schoolRelation } = await supabase
        .from('school_student_relationships')
        .select('school_id')
        .eq('student_id', user.id)
        .eq('is_active', true)
        .single();

      await supabase
        .from('student_activity_logs')
        .insert({
          student_id: user.id,
          school_id: schoolRelation?.school_id || null,
          activity_type: activityType,
          subject_id: subjectId,
          duration_minutes: durationMinutes || 0,
          score: score,
          metadata: metadata || {}
        });

      // Update quest progress based on activity
      if (activityType === 'lesson' || activityType === 'quiz') {
        await updateQuestProgress(activityType, subjectId);
      }
    } catch (error) {
      console.error('Error logging activity:', error);
    }
  };

  const updateQuestProgress = async (activityType: string, subjectId?: string) => {
    if (!user) return;

    try {
      // Get user's active quests
      const { data: questProgress } = await supabase
        .from('user_quest_progress')
        .select(`
          *,
          quests (*)
        `)
        .eq('user_id', user.id)
        .eq('completed', false);

      if (!questProgress) return;

      for (const progress of questProgress) {
        const quest = progress.quests;
        if (!quest) continue;

        let shouldIncrement = false;

        // Check if this activity matches the quest criteria
        if (quest.type === 'daily' || quest.type === 'weekly') {
          if (!quest.subject_id || quest.subject_id === subjectId) {
            shouldIncrement = true;
          }
        }

        if (shouldIncrement) {
          const newValue = (progress.current_value || 0) + 1;
          const completed = newValue >= quest.target_value;

          await supabase
            .from('user_quest_progress')
            .update({
              current_value: newValue,
              completed: completed,
              completed_at: completed ? new Date().toISOString() : null
            })
            .eq('id', progress.id);
        }
      }
    } catch (error) {
      console.error('Error updating quest progress:', error);
    }
  };

  return {
    logActivity
  };
};
