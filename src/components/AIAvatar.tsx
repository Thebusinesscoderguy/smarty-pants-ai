
import React, { useEffect, useState, useRef } from 'react';
import Lottie from 'react-lottie';
import { Card } from '@/components/ui/card';

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

// Animation data for different states - in a real app, these would be actual Lottie animations
const animationData = {
  teacher: {
    idle: require('../assets/animations/teacher-idle.json'),
    talking: require('../assets/animations/teacher-talking.json'),
    thinking: require('../assets/animations/teacher-thinking.json'),
    listening: require('../assets/animations/teacher-listening.json'),
    happy: require('../assets/animations/teacher-happy.json'),
    confused: require('../assets/animations/teacher-confused.json'),
  }
};

// Mock animation data for development
const mockAnimationData = {
  default: {
    w: 400,
    h: 400,
    v: "5.7.6",
    fr: 30,
    ip: 0,
    op: 180,
    layers: [{
      ty: 4,
      shapes: [{
        ty: "el",
        d: 1,
        p: { a: 0, k: [0, 0] },
        s: { a: 0, k: [100, 100] }
      }]
    }]
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

  // For development purposes, we'll use mock animation data
  // In a production app, you'd replace this with actual Lottie animations
  const defaultOptions = {
    loop: true,
    autoplay: true,
    animationData: mockAnimationData.default,
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
