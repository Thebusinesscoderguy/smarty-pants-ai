import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

export interface StudentClassification {
  id: string;
  student_id: string;
  classification_tag: string;
  assigned_by?: string;
  assigned_automatically: boolean;
  created_at: string;
  updated_at: string;
  student_name?: string;
}

export const useStudentClassifications = () => {
  const { user } = useAuth();
  const [classifications, setClassifications] = useState<StudentClassification[]>([]);
  const [availableTags, setAvailableTags] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const predefinedTags = [
    'High Achiever',
    'Visual Learner', 
    'Needs Support',
    'STEM Focused',
    'Creative Explorer',
    'Fast Paced',
    'Collaborative',
    'Self-Directed',
    'Analytical Thinker',
    'Hands-On Learner',
    'Detail Oriented',
    'Big Picture Thinker'
  ];

  const fetchClassifications = async () => {
    if (!user) return;

    setLoading(true);
    try {
      // Get school account
      const { data: schoolData } = await supabase
        .from('school_accounts')
        .select('id')
        .eq('admin_user_id', user.id)
        .single();

      if (!schoolData) {
        setClassifications([]);
        return;
      }

      // Get students in school
      const { data: relationships } = await supabase
        .from('school_student_relationships')
        .select('student_id')
        .eq('school_id', schoolData.id)
        .eq('is_active', true);

      if (!relationships) {
        setClassifications([]);
        return;
      }

      const { data: students } = await supabase
        .from('profiles')
        .select('id, display_name')
        .in('id', relationships.map(r => r.student_id));

      if (!students) {
        setClassifications([]);
        return;
      }

      const studentIds = students.map(s => s.id);

      // Get all classifications for these students
      const { data: classificationData } = await supabase
        .from('student_classifications')
        .select('*')
        .in('student_id', studentIds);

      // Combine with student names
      const enrichedClassifications = (classificationData || []).map(classification => ({
        ...classification,
        student_name: students?.find(s => s.id === classification.student_id)?.display_name || 'Unknown Student'
      }));

      setClassifications(enrichedClassifications);

      // Extract unique tags
      const tags = [...new Set(enrichedClassifications.map(c => c.classification_tag))];
      setAvailableTags([...new Set([...predefinedTags, ...tags])]);

    } catch (error: any) {
      console.error('Error fetching classifications:', error);
      toast({
        title: "Error",
        description: "Failed to load student classifications",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const assignClassification = async (studentId: string, tag: string, automatic: boolean = false) => {
    if (!user) return false;

    try {
      // Check if classification already exists
      const { data: existing } = await supabase
        .from('student_classifications')
        .select('id')
        .eq('student_id', studentId)
        .eq('classification_tag', tag)
        .single();

      if (existing) {
        toast({
          title: "Already Assigned",
          description: "This classification is already assigned to the student",
          variant: "default"
        });
        return false;
      }

      const { error } = await supabase
        .from('student_classifications')
        .insert({
          student_id: studentId,
          classification_tag: tag,
          assigned_by: user.id,
          assigned_automatically: automatic
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: `Classification "${tag}" assigned successfully`,
      });

      await fetchClassifications();
      return true;

    } catch (error: any) {
      console.error('Error assigning classification:', error);
      toast({
        title: "Error",
        description: "Failed to assign classification: " + error.message,
        variant: "destructive"
      });
      return false;
    }
  };

  const removeClassification = async (classificationId: string) => {
    try {
      const { error } = await supabase
        .from('student_classifications')
        .delete()
        .eq('id', classificationId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Classification removed successfully",
      });

      await fetchClassifications();

    } catch (error: any) {
      console.error('Error removing classification:', error);
      toast({
        title: "Error",
        description: "Failed to remove classification: " + error.message,
        variant: "destructive"
      });
    }
  };

  const autoClassifyStudent = async (studentId: string) => {
    if (!user) return;

    try {
      // Get student analytics for auto-classification
      const { data: analytics } = await supabase
        .from('learning_analytics')
        .select('*')
        .eq('user_id', studentId);

      if (!analytics || analytics.length === 0) return;

      const suggestions = generateClassificationSuggestions(analytics);
      
      // Auto-assign top suggestion
      if (suggestions.length > 0) {
        await assignClassification(studentId, suggestions[0], true);
      }

    } catch (error) {
      console.error('Error auto-classifying student:', error);
    }
  };

  const generateClassificationSuggestions = (analytics: any[]): string[] => {
    const suggestions: string[] = [];
    
    const avgStrength = analytics.reduce((sum, a) => sum + (a.strength_score || 0), 0) / analytics.length;
    const totalAttempts = analytics.reduce((sum, a) => sum + (a.total_attempts || 0), 0);

    // Performance-based classifications
    if (avgStrength >= 0.85) {
      suggestions.push('High Achiever');
    } else if (avgStrength <= 0.5) {
      suggestions.push('Needs Support');
    }

    // Engagement-based classifications
    if (totalAttempts >= 100) {
      suggestions.push('Self-Directed');
    }

    // Subject-specific classifications
    const stemTopics = analytics.filter(a => 
      a.topic_name?.toLowerCase().includes('math') || 
      a.topic_name?.toLowerCase().includes('science') ||
      a.topic_name?.toLowerCase().includes('chemistry') ||
      a.topic_name?.toLowerCase().includes('physics')
    );

    if (stemTopics.length > analytics.length * 0.6) {
      suggestions.push('STEM Focused');
    }

    return suggestions;
  };

  const getStudentsByClassification = (tag: string) => {
    return classifications.filter(c => c.classification_tag === tag);
  };

  useEffect(() => {
    fetchClassifications();
  }, [user]);

  return {
    classifications,
    availableTags,
    loading,
    assignClassification,
    removeClassification,
    autoClassifyStudent,
    getStudentsByClassification,
    fetchClassifications,
    predefinedTags
  };
};