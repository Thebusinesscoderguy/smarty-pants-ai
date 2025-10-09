import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { getDemoQuestList } from '@/utils/demoData';

export interface Quest {
  id: string;
  title: string;
  description: string;
  type: string;
  difficulty: string;
  target_value: number;
  subject_id?: string;
  created_by_id?: string;
  created_by?: string;
  is_active: boolean;
  expires_at?: string;
  rewards: any;
  requirements: any;
  created_at: string;
  assigned_children?: string[] | null;
}

export const useQuestManagement = () => {
  const { user } = useAuth();
  const [quests, setQuests] = useState<Quest[]>([]);
  const [loading, setLoading] = useState(false);
  
  // Use demo data when not authenticated or in demo mode
  const useDemoData = !user || window.location.href.includes('demo');

  const fetchQuests = async () => {
    if (useDemoData) {
      setQuests(getDemoQuestList());
      return;
    }
    
    if (!user) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('quests')
        .select('*')
        .eq('created_by_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setQuests(data || []);
    } catch (error: any) {
      console.error('Error fetching quests:', error);
      toast({
        title: "Error",
        description: "Failed to fetch quests: " + error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const createQuest = async (questData: {
    title: string;
    description: string;
    type: string;
    difficulty: string;
    target_value: number;
    subject_id?: string;
    expires_at?: string;
    rewards?: any;
    requirements?: any;
    assigned_children?: string[] | null;
  }) => {
    if (useDemoData) {
      toast({
        title: "Demo Mode",
        description: "This is a demo. Quest creation would work in the full version.",
      });
      return null;
    }

    if (!user) return null;

    try {
      const questDataToInsert = {
        ...questData,
        created_by_id: user.id,
        created_by: 'parent'
      };
      
      console.log('Creating quest with data:', questDataToInsert);
      
      const { data, error } = await supabase
        .from('quests')
        .insert(questDataToInsert)
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Success",
        description: "Quest created successfully!",
      });

      await fetchQuests();
      return data;
    } catch (error: any) {
      console.error('Error creating quest:', error);
      toast({
        title: "Error",
        description: "Failed to create quest: " + error.message,
        variant: "destructive"
      });
      return null;
    }
  };

  const updateQuest = async (id: string, updates: Partial<Quest>) => {
    if (useDemoData) {
      toast({
        title: "Demo Mode",
        description: "This is a demo. Quest updates would work in the full version.",
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('quests')
        .update(updates)
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Quest updated successfully!",
      });

      await fetchQuests();
    } catch (error: any) {
      console.error('Error updating quest:', error);
      toast({
        title: "Error",
        description: "Failed to update quest: " + error.message,
        variant: "destructive"
      });
    }
  };

  const deleteQuest = async (id: string) => {
    if (useDemoData) {
      toast({
        title: "Demo Mode",
        description: "This is a demo. Quest deletion would work in the full version.",
      });
      return;
    }

    try {
      // First delete all related progress records
      const { error: progressError } = await supabase
        .from('user_quest_progress')
        .delete()
        .eq('quest_id', id);

      if (progressError) throw progressError;

      // Then delete the quest
      const { error } = await supabase
        .from('quests')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Quest deleted successfully!",
      });

      await fetchQuests();
    } catch (error: any) {
      console.error('Error deleting quest:', error);
      toast({
        title: "Error",
        description: "Failed to delete quest: " + error.message,
        variant: "destructive"
      });
    }
  };

  useEffect(() => {
    fetchQuests();
  }, [user, useDemoData]);

  return {
    quests,
    loading,
    createQuest,
    updateQuest,
    deleteQuest,
    fetchQuests
  };
};
