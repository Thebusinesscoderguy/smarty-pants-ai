
import { useRef, useState } from 'react';
import { Message } from '../types/message';

export const useAudioHandler = () => {
  const [activeSpeakingMessage, setActiveSpeakingMessage] = useState<string | null>(null);
  const audioRefs = useRef<{ [key: string]: HTMLAudioElement | null }>({});

  const handlePlayAudio = (messageId: string, messages: Message[], setMessages: (messages: Message[]) => void) => {
    if (!audioRefs.current[messageId]) {
      const message = messages.find(m => m.id === messageId);
      
      if (message?.audioUrl) {
        const audio = new Audio(message.audioUrl);
        audioRefs.current[messageId] = audio;
        
        audio.onended = () => {
          setMessages(messages => 
            messages.map(m => 
              m.id === messageId ? { ...m, isPlaying: false } : m
            )
          );
          setActiveSpeakingMessage(null);
        };
      }
    }
    
    const audio = audioRefs.current[messageId];
    
    if (audio) {
      Object.entries(audioRefs.current).forEach(([id, audioElement]) => {
        if (id !== messageId && audioElement) {
          audioElement.pause();
          audioElement.currentTime = 0;
          
          setMessages(messages => 
            messages.map(m => 
              m.id === id ? { ...m, isPlaying: false } : m
            )
          );
        }
      });
      
      audio.play();
      setActiveSpeakingMessage(messageId);
      
      setMessages(messages => 
        messages.map(m => 
          m.id === messageId ? { ...m, isPlaying: true } : m
        )
      );
    }
  };

  const handlePauseAudio = (messageId: string, messages: Message[], setMessages: (messages: Message[]) => void) => {
    const audio = audioRefs.current[messageId];
    
    if (audio) {
      audio.pause();
      setActiveSpeakingMessage(null);
      
      setMessages(messages => 
        messages.map(m => 
          m.id === messageId ? { ...m, isPlaying: false } : m
        )
      );
    }
  };

  return {
    handlePlayAudio,
    handlePauseAudio,
    activeSpeakingMessage
  };
};
