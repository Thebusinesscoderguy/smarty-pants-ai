
import { useState, useEffect } from 'react';
import { toast } from '@/hooks/use-toast';

export const useVoiceSettings = () => {
  const [isVoiceEnabled, setIsVoiceEnabled] = useState(true);
  const [selectedVoice, setSelectedVoice] = useState('alloy');

  // Load settings from localStorage on mount
  useEffect(() => {
    const savedVoiceEnabled = localStorage.getItem('voiceEnabled');
    const savedVoice = localStorage.getItem('selectedVoice');
    
    if (savedVoiceEnabled !== null) {
      setIsVoiceEnabled(JSON.parse(savedVoiceEnabled));
    }
    
    if (savedVoice) {
      setSelectedVoice(savedVoice);
    }
  }, []);

  const toggleVoice = () => {
    const newState = !isVoiceEnabled;
    setIsVoiceEnabled(newState);
    localStorage.setItem('voiceEnabled', JSON.stringify(newState));
    
    toast({
      title: newState ? "Voice responses enabled" : "Voice responses disabled",
      duration: 2000,
    });
  };

  const changeVoice = (voice: string) => {
    setSelectedVoice(voice);
    localStorage.setItem('selectedVoice', voice);
    
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
