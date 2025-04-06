
import React, { useEffect, useState, useRef } from 'react';
import Lottie from 'react-lottie';
import { Card } from '@/components/ui/card';

// Import animation files using standard ES import syntax
import teacherIdle from '../assets/animations/teacher-idle.json';
// Since other animation files might not exist yet, we'll use the idle one for all states
// until proper animations are created

// Avatar animation states
const AVATAR_STATES = {
  IDLE: 'idle',
  TALKING: 'talking',
  THINKING: 'thinking',
  LISTENING: 'listening',
  HAPPY: 'happy',
  CONFUSED: 'confused',
};

// Define avatar options
export type AvatarStyle = 'teacher' | 'casual' | 'professional' | 'friendly';

interface AIAvatarProps {
  isSpeaking: boolean;
  isListening?: boolean;
  isThinking?: boolean;
  emotion?: 'neutral' | 'happy' | 'confused' | 'excited';
  avatarStyle?: AvatarStyle;
  className?: string;
}

// Animation data for different states - using proper ES imports
const animationData = {
  teacher: {
    idle: teacherIdle,
    talking: teacherIdle, // Replace with actual talking animation when available
    thinking: teacherIdle, // Replace with actual thinking animation when available
    listening: teacherIdle, // Replace with actual listening animation when available
    happy: teacherIdle, // Replace with actual happy animation when available
    confused: teacherIdle, // Replace with actual confused animation when available
  }
};

const AIAvatar: React.FC<AIAvatarProps> = ({ 
  isSpeaking, 
  isListening = false, 
  isThinking = false, 
  emotion = 'neutral',
  avatarStyle = 'teacher',
  className = ''
}) => {
  const [currentAnimation, setCurrentAnimation] = useState(AVATAR_STATES.IDLE);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  
  // Determine which animation to play based on avatar state
  useEffect(() => {
    if (isSpeaking) {
      setCurrentAnimation(AVATAR_STATES.TALKING);
    } else if (isListening) {
      setCurrentAnimation(AVATAR_STATES.LISTENING);
    } else if (isThinking) {
      setCurrentAnimation(AVATAR_STATES.THINKING);
    } else if (emotion === 'happy') {
      setCurrentAnimation(AVATAR_STATES.HAPPY);
    } else if (emotion === 'confused') {
      setCurrentAnimation(AVATAR_STATES.CONFUSED);
    } else {
      setCurrentAnimation(AVATAR_STATES.IDLE);
    }
  }, [isSpeaking, isListening, isThinking, emotion]);

  // Select the appropriate animation based on the current state
  const selectedAnimation = (() => {
    const animations = animationData[avatarStyle];
    switch(currentAnimation) {
      case AVATAR_STATES.TALKING:
        return animations.talking;
      case AVATAR_STATES.THINKING:
        return animations.thinking;
      case AVATAR_STATES.LISTENING:
        return animations.listening;
      case AVATAR_STATES.HAPPY:
        return animations.happy;
      case AVATAR_STATES.CONFUSED:
        return animations.confused;
      default:
        return animations.idle;
    }
  })();

  // Set up Lottie options
  const defaultOptions = {
    loop: true,
    autoplay: true,
    animationData: selectedAnimation,
    rendererSettings: {
      preserveAspectRatio: 'xMidYMid slice'
    }
  };

  return (
    <Card className={`bg-white/10 border-white/20 p-4 rounded-lg overflow-hidden ${className}`}>
      <div className="flex flex-col items-center">
        <div className="w-64 h-64 relative">
          <Lottie 
            options={defaultOptions}
            height={250}
            width={250}
            isStopped={false}
            isPaused={false}
          />
          {/* Status indicator */}
          <div className={`absolute bottom-2 right-2 w-4 h-4 rounded-full ${
            isSpeaking ? 'bg-green-500 animate-pulse' :
            isListening ? 'bg-blue-500 animate-pulse' :
            isThinking ? 'bg-yellow-500 animate-pulse' :
            'bg-gray-500'
          }`} />
        </div>
        <div className="mt-2 text-center">
          <p className="text-white/70 text-sm">
            {isSpeaking ? 'Speaking...' : 
             isListening ? 'Listening...' : 
             isThinking ? 'Thinking...' : 'Ready to help'}
          </p>
        </div>
      </div>
    </Card>
  );
};

export default AIAvatar;
