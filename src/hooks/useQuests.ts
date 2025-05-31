
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/components/ui/use-toast';

export interface Quest {
  id: string;
  title: string;
  description: string;
  type: 'daily' | 'weekly';
  difficulty: 'basic' | 'intermediate' | 'hard';
  target_value: number;
  subject_id?: string;
  created_by: 'ai' | 'parent' | 'school';
  created_by_id?: string;
  is_active: boolean;
  created_at: string;
  expires_at?: string;
  current_value?: number;
  completed?: boolean;
}

export interface SubjectAssignment {
  id: string;
  user_id: string;
  subject_id: string;
  assigned_by: 'self' | 'parent' | 'school';
  assigned_by_id?: string;
  is_active: boolean;
  created_at: string;
  subjects?: {
    name: string;
    description: string;
  };
}

export interface LearningAnalytic {
  id: string;
  user_id: string;
  subject_id: string;
  topic_name: string;
  strength_score: number;
  total_attempts: number;
  correct_attempts: number;
  last_updated: string;
  subjects?: {
    name: string;
  };
}

export const useQuests = () => {
  const [dailyQuests, setDailyQuests] = useState<Quest[]>([]);
  const [weeklyQuests, setWeeklyQuests] = useState<Quest[]>([]);
  const [subjectAssignments, setSubjectAssignments] = useState<SubjectAssignment[]>([]);
  const [strengths, setStrengths] = useState<LearningAnalytic[]>([]);
  const [weaknesses, setWeaknesses] = useState<LearningAnalytic[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      fetchQuestData();
    }
  }, [user]);

  const fetchQuestData = async () => {
    try {
      setIsLoading(true);

      // Fetch daily quests with user progress
      const { data: dailyQuestsData, error: dailyError } = await supabase
        .from('quests')
        .select(`
          *,
          user_quest_progress (
            current_value,
            completed,
            completed_at
          )
        `)
        .eq('type', 'daily')
        .eq('is_active', true)
        .eq('user_quest_progress.user_id', user?.id || '');

      if (dailyError) throw dailyError;

      // Fetch weekly quests with user progress
      const { data: weeklyQuestsData, error: weeklyError } = await supabase
        .from('quests')
        .select(`
          *,
          user_quest_progress (
            current_value,
            completed,
            completed_at
          )
        `)
        .eq('type', 'weekly')
        .eq('is_active', true)
        .eq('user_quest_progress.user_id', user?.id || '');

      if (weeklyError) throw weeklyError;

      // Fetch user's subject assignments
      const { data: subjectData, error: subjectError } = await supabase
        .from('subject_assignments')
        .select(`
          *,
          subjects (
            name,
            description
          )
        `)
        .eq('user_id', user?.id)
        .eq('is_active', true);

      if (subjectError) throw subjectError;

      // Fetch learning analytics for strengths and weaknesses
      const { data: analyticsData, error: analyticsError } = await supabase
        .from('learning_analytics')
        .select(`
          *,
          subjects (
            name
          )
        `)
        .eq('user_id', user?.id);

      if (analyticsError) throw analyticsError;

      // Process quest data
      const processedDailyQuests = dailyQuestsData?.map(quest => ({
        ...quest,
        current_value: quest.user_quest_progress?.[0]?.current_value || 0,
        completed: quest.user_quest_progress?.[0]?.completed || false
      })) || [];

      const processedWeeklyQuests = weeklyQuestsData?.map(quest => ({
        ...quest,
        current_value: quest.user_quest_progress?.[0]?.current_value || 0,
        completed: quest.user_quest_progress?.[0]?.completed || false
      })) || [];

      // Separate strengths and weaknesses
      const strengthsList = analyticsData?.filter(item => item.strength_score >= 0.7) || [];
      const weaknessesList = analyticsData?.filter(item => item.strength_score < 0.5) || [];

      setDailyQuests(processedDailyQuests);
      setWeeklyQuests(processedWeeklyQuests);
      setSubjectAssignments(subjectData || []);
      setStrengths(strengthsList);
      setWeaknesses(weaknessesList);

    } catch (error: any) {
      console.error('Error fetching quest data:', error);
      toast({
        title: "Error",
        description: "Failed to load quest data",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const updateQuestProgress = async (questId: string, increment: number = 1) => {
    if (!user) return;

    try {
      // Get current quest progress
      const { data: currentProgress } = await supabase
        .from('user_quest_progress')
        .select('*')
        .eq('user_id', user.id)
        .eq('quest_id', questId)
        .single();

      const newValue = (currentProgress?.current_value || 0) + increment;
      
      // Get quest details to check target
      const { data: questData } = await supabase
        .from('quests')
        .select('target_value, title')
        .eq('id', questId)
        .single();

      const isCompleted = newValue >= (questData?.target_value || 0);

      // Upsert progress
      const { error } = await supabase
        .from('user_quest_progress')
        .upsert({
          user_id: user.id,
          quest_id: questId,
          current_value: newValue,
          completed: isCompleted,
          completed_at: isCompleted ? new Date().toISOString() : null
        });

      if (error) throw error;

      if (isCompleted) {
        toast({
          title: "Quest Completed! 🎉",
          description: `Great job completing "${questData?.title}"!`,
        });
      }

      // Refresh data
      await fetchQuestData();

    } catch (error: any) {
      console.error('Error updating quest progress:', error);
      toast({
        title: "Error",
        description: "Failed to update quest progress",
        variant: "destructive"
      });
    }
  };

  const updateLearningAnalytics = async (
    subjectId: string, 
    topicName: string, 
    isCorrect: boolean
  ) => {
    if (!user) return;

    try {
      // Get current analytics
      const { data: currentData } = await supabase
        .from('learning_analytics')
        .select('*')
        .eq('user_id', user.id)
        .eq('subject_id', subjectId)
        .eq('topic_name', topicName)
        .single();

      const totalAttempts = (currentData?.total_attempts || 0) + 1;
      const correctAttempts = (currentData?.correct_attempts || 0) + (isCorrect ? 1 : 0);
      const strengthScore = correctAttempts / totalAttempts;

      const { error } = await supabase
        .from('learning_analytics')
        .upsert({
          user_id: user.id,
          subject_id: subjectId,
          topic_name: topicName,
          strength_score: strengthScore,
          total_attempts: totalAttempts,
          correct_attempts: correctAttempts,
          last_updated: new Date().toISOString()
        });

      if (error) throw error;

      // Refresh analytics
      await fetchQuestData();

    } catch (error: any) {
      console.error('Error updating learning analytics:', error);
    }
  };

  return {
    dailyQuests,
    weeklyQuests,
    subjectAssignments,
    strengths,
    weaknesses,
    isLoading,
    updateQuestProgress,
    updateLearningAnalytics,
    fetchQuestData
  };
};
