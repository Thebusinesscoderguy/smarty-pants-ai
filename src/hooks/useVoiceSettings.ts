
import { useState } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';

export const useVoiceSettings = () => {
  const [isVoiceEnabled, setIsVoiceEnabled] = useState(true);
  const [selectedVoice, setSelectedVoice] = useState('alloy');
  const { toast } = useToast();

  const toggleVoice = () => {
    const newState = !isVoiceEnabled;
    setIsVoiceEnabled(newState);
    toast({
      title: newState ? "Voice responses enabled" : "Voice responses disabled",
      duration: 2000,
    });
  };

  const changeVoice = (voice: string) => {
    setSelectedVoice(voice);
    toast({
      title: "Voice changed",
      description: `Now using ${voice} voice`,
      duration: 2000,
    });
  };

  const testVoice = async () => {
    try {
      const testText = `Hello! This is a test of the ${selectedVoice} voice. How does this sound to you?`;
      
      const { data, error } = await supabase.functions.invoke('text-to-voice', {
        body: { text: testText, voice: selectedVoice }
      });

      if (error) throw error;

      if (data?.audioContent) {
        const audio = new Audio(`data:audio/mp3;base64,${data.audioContent}`);
        await audio.play();
        
        toast({
          title: "Voice Test",
          description: `Testing ${selectedVoice} voice...`,
        });
      }
    } catch (error: any) {
      console.error('Voice test error:', error);
      toast({
        title: "Voice Test Failed",
        description: "Could not test voice. Please try again.",
        variant: "destructive",
      });
    }
  };

  return {
    isVoiceEnabled,
    selectedVoice,
    toggleVoice,
    changeVoice,
    testVoice,
  };
};
