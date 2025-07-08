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
  }) => {
    if (!user) return null;

    try {
      const { data, error } = await supabase
        .from('quests')
        .insert({
          ...questData,
          created_by_id: user.id,
          created_by: 'teacher'
        })
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
    try {
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