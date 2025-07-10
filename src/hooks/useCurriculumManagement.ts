import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { getDemoCurriculumData } from '@/utils/demoData';

export interface Curriculum {
  id: string;
  title: string;
  description?: string;
  grade_level?: string;
  content: any;
  is_active: boolean;
  school_id?: string;
  subject_id?: string;
  created_at: string;
}

export const useCurriculumManagement = () => {
  const { user } = useAuth();
  const [curricula, setCurricula] = useState<Curriculum[]>([]);
  const [loading, setLoading] = useState(false);
  
  // Use demo data when not authenticated or in demo mode
  const useDemoData = !user || window.location.href.includes('demo');

  const fetchCurricula = async () => {
    if (useDemoData) {
      setCurricula(getDemoCurriculumData());
      return;
    }
    
    if (!user) return;

    setLoading(true);
    try {
      // Check if user is school admin
      const { data: schoolData } = await supabase
        .from('school_accounts')
        .select('id')
        .eq('admin_user_id', user.id)
        .single();

      let query = supabase.from('curricula').select('*');
      
      if (schoolData) {
        query = query.eq('school_id', schoolData.id);
      } else {
        // For parents, show curricula they created
        query = query.is('school_id', null);
      }

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) throw error;
      setCurricula(data || []);
    } catch (error: any) {
      console.error('Error fetching curricula:', error);
      toast({
        title: "Error",
        description: "Failed to fetch curricula: " + error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const createCurriculum = async (curriculumData: {
    title: string;
    description?: string;
    grade_level?: string;
    content: any;
    subject_id?: string;
  }) => {
    if (useDemoData) {
      toast({
        title: "Demo Mode",
        description: "This is a demo. Curriculum creation would work in the full version.",
      });
      return null;
    }

    if (!user) return null;

    try {
      // Check if user is school admin
      const { data: schoolData } = await supabase
        .from('school_accounts')
        .select('id')
        .eq('admin_user_id', user.id)
        .single();

      const { data, error } = await supabase
        .from('curricula')
        .insert({
          ...curriculumData,
          school_id: schoolData?.id || null
        })
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Success",
        description: "Curriculum created successfully!",
      });

      await fetchCurricula();
      return data;
    } catch (error: any) {
      console.error('Error creating curriculum:', error);
      toast({
        title: "Error",
        description: "Failed to create curriculum: " + error.message,
        variant: "destructive"
      });
      return null;
    }
  };

  const updateCurriculum = async (id: string, updates: Partial<Curriculum>) => {
    if (useDemoData) {
      toast({
        title: "Demo Mode",
        description: "This is a demo. Curriculum updates would work in the full version.",
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('curricula')
        .update(updates)
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Curriculum updated successfully!",
      });

      await fetchCurricula();
    } catch (error: any) {
      console.error('Error updating curriculum:', error);
      toast({
        title: "Error",
        description: "Failed to update curriculum: " + error.message,
        variant: "destructive"
      });
    }
  };

  const deleteCurriculum = async (id: string) => {
    if (useDemoData) {
      toast({
        title: "Demo Mode",
        description: "This is a demo. Curriculum deletion would work in the full version.",
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('curricula')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Curriculum deleted successfully!",
      });

      await fetchCurricula();
    } catch (error: any) {
      console.error('Error deleting curriculum:', error);
      toast({
        title: "Error",
        description: "Failed to delete curriculum: " + error.message,
        variant: "destructive"
      });
    }
  };

  useEffect(() => {
    fetchCurricula();
  }, [user, useDemoData]);

  return {
    curricula,
    loading,
    createCurriculum,
    updateCurriculum,
    deleteCurriculum,
    fetchCurricula
  };
};
