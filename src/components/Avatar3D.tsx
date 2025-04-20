
import React, { useEffect, useRef, useState } from 'react';
import { Card } from '@/components/ui/card';

interface Avatar3DProps {
  isSpeaking: boolean;
  isListening: boolean;
  isThinking: boolean;
  avatarStyle: 'teacher' | 'casual' | 'professional' | 'friendly';
  className?: string;
}

const Avatar3D: React.FC<Avatar3DProps> = ({
  isSpeaking,
  isListening,
  isThinking,
  avatarStyle,
  className = '',
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [currentExpression, setCurrentExpression] = useState<string>('neutral');

  useEffect(() => {
    // Determine expression based on avatar state
    if (isSpeaking) {
      setCurrentExpression('speaking');
    } else if (isListening) {
      setCurrentExpression('listening');
    } else if (isThinking) {
      setCurrentExpression('thinking');
    } else {
      setCurrentExpression('neutral');
    }
  }, [isSpeaking, isListening, isThinking]);

  // For now, we'll use a placeholder with CSS animations
  // In a real implementation, you would use a 3D library like Three.js
  const getExpressionClass = () => {
    switch (currentExpression) {
      case 'speaking':
        return 'avatar-speaking';
      case 'listening':
        return 'avatar-listening';
      case 'thinking':
        return 'avatar-thinking';
      default:
        return 'avatar-neutral';
    }
  };

  const getAvatarImage = () => {
    // Different avatar images based on style
    switch (avatarStyle) {
      case 'teacher':
        return 'https://api.dicebear.com/7.x/bottts/svg?seed=teacher';
      case 'casual':
        return 'https://api.dicebear.com/7.x/bottts/svg?seed=casual';
      case 'professional':
        return 'https://api.dicebear.com/7.x/bottts/svg?seed=professional';
      case 'friendly':
        return 'https://api.dicebear.com/7.x/bottts/svg?seed=friendly';
      default:
        return 'https://api.dicebear.com/7.x/bottts/svg?seed=default';
    }
  };

  return (
    <div className={`relative w-full h-full flex items-center justify-center ${className}`}>
      <Card className={`relative w-64 h-80 bg-transparent border-none shadow-none ${getExpressionClass()}`}>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <img 
            src={getAvatarImage()} 
            alt="3D Avatar" 
            className="w-48 h-48 object-contain" 
          />
          <div className="text-center mt-4 text-white/80">
            <p className="text-xs uppercase tracking-wide">
              {currentExpression === 'speaking' && 'Speaking...'}
              {currentExpression === 'listening' && 'Listening...'}
              {currentExpression === 'thinking' && 'Thinking...'}
              {currentExpression === 'neutral' && 'Ready'}
            </p>
          </div>
        </div>
        <canvas 
          ref={canvasRef} 
          className="absolute inset-0 w-full h-full opacity-0" 
          // The canvas is hidden for now as we're using the placeholder
        />
      </Card>
      
      <style>
        {`
          .avatar-speaking {
            animation: speak 1s infinite alternate;
          }
          .avatar-listening {
            animation: listen 2s infinite;
          }
          .avatar-thinking {
            animation: think 3s infinite;
          }
          @keyframes speak {
            0% { transform: scale(1); }
            100% { transform: scale(1.05); }
          }
          @keyframes listen {
            0% { transform: translateY(0); }
            50% { transform: translateY(-5px); }
            100% { transform: translateY(0); }
          }
          @keyframes think {
            0% { transform: rotate(0deg); }
            25% { transform: rotate(-2deg); }
            75% { transform: rotate(2deg); }
            100% { transform: rotate(0deg); }
          }
        `}
      </style>
    </div>
  );
};

export default Avatar3D;
