
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';
import { isMockDataEnabled } from '@/utils/mockDataToggle';
import { mockQuests, mockSubjects } from '@/utils/mockData';

interface Quest {
  id: string;
  title: string;
  description: string;
  type: string;
  difficulty: string;
  target_value: number;
  current_value?: number;
  completed?: boolean;
  expires_at: string;
  subjects?: { name: string };
}

interface SubjectAssignment {
  id: string;
  completion_percentage: number;
  lessons_completed: number;
  total_lessons: number;
  assigned_by: string;
  subjects?: { name: string };
}

export const useQuests = () => {
  const [dailyQuests, setDailyQuests] = useState<Quest[]>([]);
  const [weeklyQuests, setWeeklyQuests] = useState<Quest[]>([]);
  const [subjectAssignments, setSubjectAssignments] = useState<SubjectAssignment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    if (isMockDataEnabled()) {
      setIsLoading(true);
      // Use mock data with proper Quest interface
      const mockDailyQuests = mockQuests.active.filter(q => q.type === 'daily').map(quest => ({
        ...quest,
        expires_at: quest.expires_at || new Date().toISOString()
      }));
      const mockWeeklyQuests = mockQuests.active.filter(q => q.type === 'weekly').map(quest => ({
        ...quest,
        expires_at: quest.expires_at || new Date().toISOString()
      }));
      
      setDailyQuests(mockDailyQuests);
      setWeeklyQuests(mockWeeklyQuests);
      // Properly map mock subjects to SubjectAssignment interface
      setSubjectAssignments(mockSubjects.map(subject => ({
        id: subject.id,
        completion_percentage: subject.completion_percentage,
        lessons_completed: subject.lessons_completed,
        total_lessons: subject.total_lessons,
        assigned_by: subject.assigned_by,
        subjects: { name: subject.name }
      })));
      setIsLoading(false);
      return;
    }

    if (user) {
      fetchQuests();
    } else {
      setIsLoading(false);
    }
  }, [user]);

  const fetchQuests = async () => {
    try {
      setIsLoading(true);

      // Fetch daily quests
      const { data: dailyQuestsData, error: dailyError } = await supabase
        .from('quests')
        .select('*')
        .eq('type', 'daily')
        .eq('is_active', true);

      if (dailyError) throw dailyError;

      // Fetch weekly quests
      const { data: weeklyQuestsData, error: weeklyError } = await supabase
        .from('quests')
        .select('*')
        .eq('type', 'weekly')
        .eq('is_active', true);

      if (weeklyError) throw weeklyError;

      // Fetch user's subject assignments with subjects data
      const { data: subjectData, error: subjectError } = await supabase
        .from('subject_assignments')
        .select(`
          *,
          subjects (
            name
          )
        `)
        .eq('user_id', user?.id)
        .eq('is_active', true);

      if (subjectError) throw subjectError;

      // Normalize target values: infer number from title/description when DB stores 1
      const normalizeTarget = (q: any) => {
        const text = `${q.title || ''} ${q.description || ''}`;
        const nums = text.match(/\b(\d+)\b/);
        const parsed = nums ? parseInt(nums[1], 10) : NaN;
        return q.target_value && q.target_value > 1
          ? q.target_value
          : (Number.isFinite(parsed) && parsed > 1 ? parsed : (q.target_value || 1));
      };

      const normalizedDaily = (dailyQuestsData || []).map((q: any) => ({
        ...q,
        target_value: normalizeTarget(q),
      }));

      const normalizedWeekly = (weeklyQuestsData || []).map((q: any) => ({
        ...q,
        target_value: normalizeTarget(q),
      }));

      setDailyQuests(normalizedDaily);
      setWeeklyQuests(normalizedWeekly);
      
      // Map the real data to match SubjectAssignment interface
      const mappedSubjectAssignments: SubjectAssignment[] = (subjectData || []).map(assignment => ({
        id: assignment.id,
        completion_percentage: 0, // Default value since not available from basic assignment
        lessons_completed: 0, // Default value since not available from basic assignment
        total_lessons: 1, // Default value since not available from basic assignment
        assigned_by: assignment.assigned_by,
        subjects: assignment.subjects ? { name: assignment.subjects.name } : undefined
      }));
      
      setSubjectAssignments(mappedSubjectAssignments);

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

  return {
    dailyQuests,
    weeklyQuests,
    subjectAssignments,
    isLoading,
    refetchQuests: fetchQuests
  };
};
