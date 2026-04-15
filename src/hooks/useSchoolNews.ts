import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';

export interface NewsPost {
  id: string;
  school_id: string;
  teacher_id: string;
  title: string;
  content: string;
  image_url: string | null;
  link_url: string | null;
  link_title: string | null;
  is_pinned: boolean;
  created_at: string;
  updated_at: string;
  teacher?: { first_name: string | null; last_name: string | null; email: string };
  school?: { school_name: string };
}

export const useSchoolNews = (schoolId?: string) => {
  const { user } = useAuth();
  const [posts, setPosts] = useState<NewsPost[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPosts = useCallback(async () => {
    if (!user) { setLoading(false); return; }
    try {
      let query = supabase
        .from('school_news')
        .select('*, teacher:school_teachers(first_name, last_name, email), school:school_accounts(school_name)')
        .order('is_pinned', { ascending: false })
        .order('created_at', { ascending: false })
        .limit(50);

      if (schoolId) {
        query = query.eq('school_id', schoolId);
      }

      const { data, error } = await query;
      if (error) throw error;
      setPosts((data as unknown as NewsPost[]) || []);
    } catch (e) {
      console.error('Error fetching news:', e);
    } finally {
      setLoading(false);
    }
  }, [user, schoolId]);

  useEffect(() => { fetchPosts(); }, [fetchPosts]);

  const createPost = async (post: {
    school_id: string;
    teacher_id: string;
    title: string;
    content: string;
    image_url?: string;
    link_url?: string;
    link_title?: string;
  }) => {
    const { error } = await supabase.from('school_news').insert(post);
    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
      return false;
    }
    toast({ title: 'Posted!', description: 'News published successfully.' });
    fetchPosts();
    return true;
  };

  const deletePost = async (id: string) => {
    const { error } = await supabase.from('school_news').delete().eq('id', id);
    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
      return;
    }
    setPosts(prev => prev.filter(p => p.id !== id));
    toast({ title: 'Deleted', description: 'Post removed.' });
  };

  const togglePin = async (id: string, pinned: boolean) => {
    const { error } = await supabase.from('school_news').update({ is_pinned: !pinned }).eq('id', id);
    if (error) return;
    fetchPosts();
  };

  return { posts, loading, createPost, deletePost, togglePin, refetch: fetchPosts };
};
