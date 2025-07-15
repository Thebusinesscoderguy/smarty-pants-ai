
import { useState } from 'react';
import { useToast } from '@/components/ui/use-toast';

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
    console.log('Voice changed to:', voice);
    toast({
      title: "Voice changed",
      description: `Now using ${voice} voice`,
      duration: 2000,
    });
  };

  return {
    isVoiceEnabled,
    selectedVoice,
    toggleVoice,
    changeVoice,
    setSelectedVoice: changeVoice,
  };
};
