import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface QuestEventPayload {
  source: 'quiz' | 'study_plan' | 'chat' | 'lesson';
  event_type: string;
  subject_id?: string;
  score?: number;
  payload: any;
}

export const useQuestEvents = () => {
  const { user } = useAuth();

  const logQuestEvent = async (eventData: QuestEventPayload): Promise<string | null> => {
    if (!user) {
      console.warn('No user logged in, skipping quest event');
      return null;
    }

    try {
      // Create dedup hash to avoid double-counting
      const dedupData = `${user.id}-${eventData.source}-${eventData.event_type}-${JSON.stringify(eventData.payload)}-${Math.floor(Date.now() / 60000)}`;
      const dedupHash = btoa(dedupData).substring(0, 40);

      // Insert event
      const { data: event, error: insertError } = await supabase
        .from('quest_events')
        .insert({
          user_id: user.id,
          source: eventData.source,
          event_type: eventData.event_type,
          subject_id: eventData.subject_id || null,
          score: eventData.score || null,
          payload: eventData.payload,
          dedup_hash: dedupHash,
          status: 'pending'
        })
        .select()
        .single();

      if (insertError) {
        // Check if dedup constraint violation
        if (insertError.code === '23505') {
          console.log('Event already logged (dedup)');
          return null;
        }
        throw insertError;
      }

      console.log('Quest event logged:', event.id);

      // Immediately classify the event
      const { data: classifyResult, error: classifyError } = await supabase.functions.invoke(
        'classify-quest-event',
        { body: { eventId: event.id } }
      );

      if (classifyError) {
        console.error('Classification error:', classifyError);
        
        // Check for rate limit or payment errors
        if (classifyError.message?.includes('429') || classifyError.message?.includes('Rate limit')) {
          toast.error('Quest classification rate limited. Will retry later.');
        } else if (classifyError.message?.includes('402') || classifyError.message?.includes('Payment')) {
          toast.error('Quest classification requires credits. Please contact support.');
        } else {
          console.error('Quest classification failed, event will remain pending for retry');
        }
      } else {
        console.log('Quest classification result:', classifyResult);
        
        if (classifyResult?.status === 'classified' && classifyResult.decisions?.length > 0) {
          toast.success(`Quest progress updated! +${classifyResult.decisions.length} quest(s)`);
        }
      }

      return event.id;
    } catch (error: any) {
      console.error('Error logging quest event:', error);
      toast.error('Failed to log quest progress');
      return null;
    }
  };

  return { logQuestEvent };
};
