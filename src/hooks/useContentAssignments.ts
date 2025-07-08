import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

export interface ContentAssignment {
  id: string;
  content_type: 'test' | 'quest' | 'curriculum' | 'achievement';
  content_id: string;
  assignment_type: 'individual' | 'classification' | 'all';
  target_id?: string;
  classification_tag?: string;
  assigned_by: string;
  created_at: string;
  due_date?: string;
  is_active: boolean;
  content_title?: string;
  student_count?: number;
}

export const useContentAssignments = () => {
  const { user } = useAuth();
  const [assignments, setAssignments] = useState<ContentAssignment[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchAssignments = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('content_assignments')
        .select('*')
        .eq('assigned_by', user.id)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Enrich with content titles and student counts
      const enrichedAssignments = await Promise.all(
        (data || []).map(async (assignment): Promise<ContentAssignment> => {
          let contentTitle = 'Unknown Content';
          let studentCount = 0;

          // Get content title based on type
          switch (assignment.content_type) {
            case 'test':
              const { data: test } = await supabase
                .from('tests')
                .select('title')
                .eq('id', assignment.content_id)
                .single();
              contentTitle = test?.title || 'Unknown Test';
              break;
            case 'quest':
              const { data: quest } = await supabase
                .from('quests')
                .select('title')
                .eq('id', assignment.content_id)
                .single();
              contentTitle = quest?.title || 'Unknown Quest';
              break;
            case 'curriculum':
              const { data: curriculum } = await supabase
                .from('curricula')
                .select('title')
                .eq('id', assignment.content_id)
                .single();
              contentTitle = curriculum?.title || 'Unknown Curriculum';
              break;
            case 'achievement':
              const { data: achievement } = await supabase
                .from('achievements')
                .select('name')
                .eq('id', assignment.content_id)
                .single();
              contentTitle = achievement?.name || 'Unknown Achievement';
              break;
          }

          // Calculate student count based on assignment type
          if (assignment.assignment_type === 'individual') {
            studentCount = 1;
          } else if (assignment.assignment_type === 'classification') {
            const { count } = await supabase
              .from('student_classifications')
              .select('*', { count: 'exact' })
              .eq('classification_tag', assignment.classification_tag);
            studentCount = count || 0;
          } else if (assignment.assignment_type === 'all') {
            // Get school student count
            const { data: schoolData } = await supabase
              .from('school_accounts')
              .select('id')
              .eq('admin_user_id', user.id)
              .single();

            if (schoolData) {
              const { count } = await supabase
                .from('school_student_relationships')
                .select('*', { count: 'exact' })
                .eq('school_id', schoolData.id)
                .eq('is_active', true);
              studentCount = count || 0;
            }
          }

          return {
            ...assignment,
            content_title: contentTitle,
            student_count: studentCount
          };
        })
      );

      setAssignments(enrichedAssignments);

    } catch (error: any) {
      console.error('Error fetching assignments:', error);
      toast({
        title: "Error",
        description: "Failed to load content assignments",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const createAssignment = async (
    contentType: ContentAssignment['content_type'],
    contentId: string,
    assignmentType: ContentAssignment['assignment_type'],
    targetId?: string,
    classificationTag?: string,
    dueDate?: string
  ) => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from('content_assignments')
        .insert({
          content_type: contentType,
          content_id: contentId,
          assignment_type: assignmentType,
          target_id: targetId,
          classification_tag: classificationTag,
          assigned_by: user.id,
          due_date: dueDate,
          is_active: true
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Content assigned successfully",
      });

      await fetchAssignments();
      return true;

    } catch (error: any) {
      console.error('Error creating assignment:', error);
      toast({
        title: "Error",
        description: "Failed to create assignment: " + error.message,
        variant: "destructive"
      });
      return false;
    }
  };

  const deactivateAssignment = async (assignmentId: string) => {
    try {
      const { error } = await supabase
        .from('content_assignments')
        .update({ is_active: false })
        .eq('id', assignmentId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Assignment deactivated successfully",
      });

      await fetchAssignments();

    } catch (error: any) {
      console.error('Error deactivating assignment:', error);
      toast({
        title: "Error",
        description: "Failed to deactivate assignment: " + error.message,
        variant: "destructive"
      });
    }
  };

  const getAssignedContent = async (contentType: ContentAssignment['content_type']) => {
    if (!user) return [];

    try {
      // Get content that's available to the current user
      const { data: assignments } = await supabase
        .from('content_assignments')
        .select('content_id')
        .eq('content_type', contentType)
        .eq('is_active', true)
        .or(`assignment_type.eq.all,and(assignment_type.eq.individual,target_id.eq.${user.id}),and(assignment_type.eq.classification,classification_tag.in.(${await getUserClassificationTags()}))`);

      return assignments?.map(a => a.content_id) || [];

    } catch (error) {
      console.error('Error getting assigned content:', error);
      return [];
    }
  };

  const getUserClassificationTags = async (): Promise<string> => {
    if (!user) return '';

    try {
      const { data } = await supabase
        .from('student_classifications')
        .select('classification_tag')
        .eq('student_id', user.id);

      return data?.map(c => c.classification_tag).join(',') || '';
    } catch (error) {
      return '';
    }
  };

  useEffect(() => {
    fetchAssignments();
  }, [user]);

  return {
    assignments,
    loading,
    createAssignment,
    deactivateAssignment,
    getAssignedContent,
    fetchAssignments
  };
};