
import { useRef, useState } from 'react';
import { Message } from '../types/message';

export const useAudioHandler = () => {
  const [activeSpeakingMessage, setActiveSpeakingMessage] = useState<string | null>(null);
  const audioRefs = useRef<{ [key: string]: HTMLAudioElement | null }>({});

  const handlePlayAudio = (messageId: string, messages: Message[] = [], setMessages?: React.Dispatch<React.SetStateAction<Message[]>>) => {
    if (!audioRefs.current[messageId]) {
      const message = messages.find(m => m.id === messageId);
      
      if (message?.audioUrl) {
        const audio = new Audio(message.audioUrl);
        audioRefs.current[messageId] = audio;
        
        audio.onended = () => {
          if (setMessages) {
            setMessages(prevMessages => 
              prevMessages.map(m => 
                m.id === messageId ? { ...m, isPlaying: false } : m
              )
            );
          }
          setActiveSpeakingMessage(null);
        };
      }
    }
    
    const audio = audioRefs.current[messageId];
    
    if (audio) {
      // Pause all other audio elements
      Object.entries(audioRefs.current).forEach(([id, audioElement]) => {
        if (id !== messageId && audioElement) {
          audioElement.pause();
          audioElement.currentTime = 0;
          
          if (setMessages) {
            setMessages(prevMessages => 
              prevMessages.map(m => 
                m.id === id ? { ...m, isPlaying: false } : m
              )
            );
          }
        }
      });
      
      audio.play();
      setActiveSpeakingMessage(messageId);
      
      if (setMessages) {
        setMessages(prevMessages => 
          prevMessages.map(m => 
            m.id === messageId ? { ...m, isPlaying: true } : m
          )
        );
      }
    }
  };

  const handlePauseAudio = (messageId: string, messages: Message[] = [], setMessages?: React.Dispatch<React.SetStateAction<Message[]>>) => {
    const audio = audioRefs.current[messageId];
    
    if (audio) {
      audio.pause();
      setActiveSpeakingMessage(null);
      
      if (setMessages) {
        setMessages(prevMessages => 
          prevMessages.map(m => 
            m.id === messageId ? { ...m, isPlaying: false } : m
          )
        );
      }
    }
  };

  return {
    handlePlayAudio,
    handlePauseAudio,
    activeSpeakingMessage
  };
};
