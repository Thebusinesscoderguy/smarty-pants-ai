import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';

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
  completion_percentage?: number;
  lessons_completed?: number;
  total_lessons?: number;
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

// Type guards to safely convert database strings to our expected types
const isValidQuestType = (type: string): type is 'daily' | 'weekly' => {
  return type === 'daily' || type === 'weekly';
};

const isValidDifficulty = (difficulty: string): difficulty is 'basic' | 'intermediate' | 'hard' => {
  return difficulty === 'basic' || difficulty === 'intermediate' || difficulty === 'hard';
};

const isValidCreatedBy = (createdBy: string): createdBy is 'ai' | 'parent' | 'school' => {
  return createdBy === 'ai' || createdBy === 'parent' || createdBy === 'school';
};

const isValidAssignedBy = (assignedBy: string): assignedBy is 'self' | 'parent' | 'school' => {
  return assignedBy === 'self' || assignedBy === 'parent' || assignedBy === 'school';
};

// Convert database quest data to our Quest interface
const convertDatabaseQuest = (dbQuest: any): Quest => {
  return {
    id: dbQuest.id,
    title: dbQuest.title,
    description: dbQuest.description,
    type: isValidQuestType(dbQuest.type) ? dbQuest.type : 'daily',
    difficulty: isValidDifficulty(dbQuest.difficulty) ? dbQuest.difficulty : 'basic',
    target_value: dbQuest.target_value,
    subject_id: dbQuest.subject_id,
    created_by: isValidCreatedBy(dbQuest.created_by) ? dbQuest.created_by : 'ai',
    created_by_id: dbQuest.created_by_id,
    is_active: dbQuest.is_active,
    created_at: dbQuest.created_at,
    expires_at: dbQuest.expires_at,
    current_value: dbQuest.user_quest_progress?.[0]?.current_value || 0,
    completed: dbQuest.user_quest_progress?.[0]?.completed || false
  };
};

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

  const calculateRealProgress = async (subjectId: string) => {
    try {
      // Get total curriculum items for this subject
      const { data: curricula } = await supabase
        .from('curricula')
        .select('content')
        .eq('subject_id', subjectId)
        .eq('is_active', true);

      // Count total lessons/modules in curriculum
      let totalLessons = 0;
      curricula?.forEach(curriculum => {
        if (curriculum.content && typeof curriculum.content === 'object') {
          totalLessons += Object.keys(curriculum.content).length;
        }
      });

      // Get completed progress for this user and subject
      const { data: progress } = await supabase
        .from('user_progress')
        .select('*')
        .eq('user_id', user?.id)
        .eq('status', 'completed');

      // Get learning analytics to determine mastery
      const { data: analytics } = await supabase
        .from('learning_analytics')
        .select('*')
        .eq('user_id', user?.id)
        .eq('subject_id', subjectId);

      // Calculate completion based on topics mastered (strength_score >= 0.7)
      const masteredTopics = analytics?.filter(a => a.strength_score >= 0.7).length || 0;
      const totalTopics = analytics?.length || 1;
      
      const completionPercentage = totalTopics > 0 ? Math.round((masteredTopics / totalTopics) * 100) : 0;
      const lessonsCompleted = progress?.length || 0;

      return {
        completion_percentage: completionPercentage,
        lessons_completed: lessonsCompleted,
        total_lessons: Math.max(totalLessons, totalTopics, 10) // Ensure reasonable total
      };
    } catch (error) {
      console.error('Error calculating real progress:', error);
      return {
        completion_percentage: 0,
        lessons_completed: 0,
        total_lessons: 10
      };
    }
  };

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

      // Calculate real progress for each subject assignment
      const subjectAssignmentsWithProgress = await Promise.all(
        (subjectData || []).map(async (assignment) => {
          const realProgress = await calculateRealProgress(assignment.subject_id);
          
          return {
            id: assignment.id,
            user_id: assignment.user_id,
            subject_id: assignment.subject_id,
            assigned_by: isValidAssignedBy(assignment.assigned_by) ? assignment.assigned_by : 'self',
            assigned_by_id: assignment.assigned_by_id,
            is_active: assignment.is_active,
            created_at: assignment.created_at,
            ...realProgress,
            subjects: assignment.subjects
          };
        })
      );

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

      // Process quest data with type conversion
      const processedDailyQuests = (dailyQuestsData || []).map(convertDatabaseQuest);
      const processedWeeklyQuests = (weeklyQuestsData || []).map(convertDatabaseQuest);

      // Separate strengths and weaknesses
      const strengthsList = analyticsData?.filter(item => item.strength_score >= 0.7) || [];
      const weaknessesList = analyticsData?.filter(item => item.strength_score < 0.5) || [];

      setDailyQuests(processedDailyQuests);
      setWeeklyQuests(processedWeeklyQuests);
      setSubjectAssignments(subjectAssignmentsWithProgress);
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
