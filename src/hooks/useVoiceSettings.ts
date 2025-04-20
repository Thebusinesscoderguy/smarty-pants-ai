
import { useState } from 'react';
import { useToast } from '@/components/ui/use-toast';

export const useVoiceSettings = () => {
  const [isVoiceEnabled, setIsVoiceEnabled] = useState(true);
  const [selectedVoice, setSelectedVoice] = useState('alloy');
  const { toast } = useToast();

  const toggleVoice = () => {
    setIsVoiceEnabled(!isVoiceEnabled);
    toast({
      title: isVoiceEnabled ? "Voice responses disabled" : "Voice responses enabled",
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

  return {
    isVoiceEnabled,
    selectedVoice,
    toggleVoice,
    changeVoice,
  };
};

