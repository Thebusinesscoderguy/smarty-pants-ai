import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { getDemoAchievementList } from '@/utils/demoData';

export interface Achievement {
  id: string;
  name: string;
  description?: string;
  type: 'milestone' | 'streak' | 'completion' | 'mastery' | 'challenge';
  icon?: string;
  criteria: any;
  points: number;
  school_id?: string;
  creator_id?: string;
  created_at: string;
}

export const useAchievementManagement = () => {
  const { user } = useAuth();
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [loading, setLoading] = useState(false);
  
  // Use demo data when not authenticated or in demo mode
  const useDemoData = !user || window.location.href.includes('demo');

  const fetchAchievements = async (filterByCreator = false) => {
    if (useDemoData) {
      setAchievements(getDemoAchievementList());
      return;
    }
    
    if (!user) return;

    setLoading(true);
    try {
      let query = supabase
        .from('achievements')
        .select('*');
      
      // Only filter by creator when specifically requested (for management)
      if (filterByCreator) {
        query = query.eq('creator_id', user.id);
      }
      
      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) throw error;
      setAchievements(data || []);
    } catch (error: any) {
      console.error('Error fetching achievements:', error);
      toast({
        title: "Error",
        description: "Failed to fetch achievements: " + error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const createAchievement = async (achievementData: {
    name: string;
    description?: string;
    type: 'milestone' | 'streak' | 'completion' | 'mastery' | 'challenge';
    icon?: string;
    criteria: any;
    points: number;
  }) => {
    if (useDemoData) {
      toast({
        title: "Demo Mode",
        description: "This is a demo. Achievement creation would work in the full version.",
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
        .from('achievements')
        .insert({
          ...achievementData,
          creator_id: user.id,
          school_id: schoolData?.id || null
        })
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Success",
        description: "Achievement created successfully!",
      });

      await fetchAchievements(true);
      return data;
    } catch (error: any) {
      console.error('Error creating achievement:', error);
      toast({
        title: "Error",
        description: "Failed to create achievement: " + error.message,
        variant: "destructive"
      });
      return null;
    }
  };

  const updateAchievement = async (id: string, updates: Partial<Achievement>) => {
    if (useDemoData) {
      toast({
        title: "Demo Mode",
        description: "This is a demo. Achievement updates would work in the full version.",
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('achievements')
        .update(updates)
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Achievement updated successfully!",
      });

      await fetchAchievements(true);
    } catch (error: any) {
      console.error('Error updating achievement:', error);
      toast({
        title: "Error",
        description: "Failed to update achievement: " + error.message,
        variant: "destructive"
      });
    }
  };

  const deleteAchievement = async (id: string) => {
    if (useDemoData) {
      toast({
        title: "Demo Mode",
        description: "This is a demo. Achievement deletion would work in the full version.",
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('achievements')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Achievement deleted successfully!",
      });

      await fetchAchievements(true);
    } catch (error: any) {
      console.error('Error deleting achievement:', error);
      toast({
        title: "Error",
        description: "Failed to delete achievement: " + error.message,
        variant: "destructive"
      });
    }
  };

  useEffect(() => {
    fetchAchievements(true); // Filter by creator for management
  }, [user, useDemoData]);

  return {
    achievements,
    loading,
    createAchievement,
    updateAchievement,
    deleteAchievement,
    fetchAchievements
  };
};
