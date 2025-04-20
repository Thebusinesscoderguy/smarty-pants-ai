
import React, { useEffect, useRef, useState } from 'react';
import { Card } from '@/components/ui/card';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';

interface Avatar3DProps {
  isSpeaking: boolean;
  isListening: boolean;
  isThinking: boolean;
  avatarStyle: 'teacher' | 'casual' | 'professional' | 'friendly';
  className?: string;
  currentSentiment?: 'neutral' | 'happy' | 'sad' | 'surprised' | 'angry';
  speechIntensity?: number; // 0-1 value for lip movement intensity
}

const Avatar3D: React.FC<Avatar3DProps> = ({
  isSpeaking,
  isListening,
  isThinking,
  avatarStyle,
  className = '',
  currentSentiment = 'neutral',
  speechIntensity = 0.5,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [currentExpression, setCurrentExpression] = useState<string>('neutral');
  const sceneRef = useRef<{
    scene?: THREE.Scene;
    camera?: THREE.PerspectiveCamera;
    renderer?: THREE.WebGLRenderer;
    model?: THREE.Group;
    mixer?: THREE.AnimationMixer;
    animations?: {[key: string]: THREE.AnimationAction};
    controls?: OrbitControls;
    clock?: THREE.Clock;
    isInitialized: boolean;
  }>({
    isInitialized: false
  });
  
  // Animation frames counter for lip sync
  const frameCounter = useRef(0);
  
  useEffect(() => {
    // Determine expression based on avatar state and sentiment
    if (isSpeaking) {
      setCurrentExpression('speaking');
    } else if (isListening) {
      setCurrentExpression('listening');
    } else if (isThinking) {
      setCurrentExpression('thinking');
    } else {
      setCurrentExpression(currentSentiment || 'neutral');
    }
  }, [isSpeaking, isListening, isThinking, currentSentiment]);

  // For now, we'll use a placeholder with CSS animations
  // In a real implementation, you would load and animate a 3D model
  const getExpressionClass = () => {
    switch (currentExpression) {
      case 'speaking':
        return 'avatar-speaking';
      case 'listening':
        return 'avatar-listening';
      case 'thinking':
        return 'avatar-thinking';
      case 'happy':
        return 'avatar-happy';
      case 'sad':
        return 'avatar-sad';
      case 'surprised':
        return 'avatar-surprised';
      case 'angry':
        return 'avatar-angry';
      default:
        return 'avatar-neutral';
    }
  };

  const getAvatarImage = () => {
    // Different avatar images based on style
    switch (avatarStyle) {
      case 'teacher':
        return 'https://api.dicebear.com/7.x/personas/svg?seed=teacher&backgroundColor=transparent&scale=110';
      case 'casual':
        return 'https://api.dicebear.com/7.x/personas/svg?seed=casual&backgroundColor=transparent&scale=110';
      case 'professional':
        return 'https://api.dicebear.com/7.x/personas/svg?seed=professional&backgroundColor=transparent&scale=110';
      case 'friendly':
        return 'https://api.dicebear.com/7.x/personas/svg?seed=friendly&backgroundColor=transparent&scale=110';
      default:
        return 'https://api.dicebear.com/7.x/personas/svg?seed=default&backgroundColor=transparent&scale=110';
    }
  };

  // Update lip sync animation when speaking
  useEffect(() => {
    if (!isSpeaking) return;
    
    const lipSyncInterval = setInterval(() => {
      frameCounter.current = (frameCounter.current + 1) % 10;
    }, 100);
    
    return () => clearInterval(lipSyncInterval);
  }, [isSpeaking]);

  return (
    <div 
      ref={containerRef}
      className={`relative w-full h-full flex items-center justify-center ${className}`}
    >
      <Card 
        className={`relative w-full max-w-lg h-full max-h-[80vh] bg-transparent border-none shadow-none ${getExpressionClass()}`}
      >
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <div className="relative w-full h-full">
            <img 
              src={getAvatarImage()} 
              alt="3D Avatar" 
              className="w-full h-full object-contain" 
            />
            
            {/* Mouth animation overlay for lip syncing */}
            {isSpeaking && (
              <div 
                className="absolute mouth-animation"
                style={{
                  bottom: '20%',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  width: '20%',
                  height: '5%',
                  background: 'rgba(0,0,0,0.7)', 
                  borderRadius: '50%',
                  animation: 'mouth-move 0.2s infinite alternate',
                  transformOrigin: 'center'
                }}
              />
            )}
            
            {/* Emotional expressions */}
            {currentExpression === 'happy' && (
              <div className="absolute w-full h-full top-0 left-0 happy-overlay" />
            )}
            {currentExpression === 'sad' && (
              <div className="absolute w-full h-full top-0 left-0 sad-overlay" />
            )}
            {currentExpression === 'angry' && (
              <div className="absolute w-full h-full top-0 left-0 angry-overlay" />
            )}
            {currentExpression === 'surprised' && (
              <div className="absolute w-full h-full top-0 left-0 surprised-overlay" />
            )}
          </div>
          
          <div className="text-center mt-4 text-white/80">
            <p className="text-sm uppercase tracking-wide">
              {currentExpression === 'speaking' && 'Speaking...'}
              {currentExpression === 'listening' && 'Listening...'}
              {currentExpression === 'thinking' && 'Thinking...'}
              {currentExpression === 'neutral' && 'Ready'}
              {currentExpression === 'happy' && 'Happy 😊'}
              {currentExpression === 'sad' && 'Sad 😢'}
              {currentExpression === 'surprised' && 'Surprised 😮'}
              {currentExpression === 'angry' && 'Concerned 😠'}
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
            animation: body-speak 1s infinite alternate;
          }
          .avatar-listening {
            animation: listen 2s infinite;
          }
          .avatar-thinking {
            animation: think 3s infinite;
          }
          .avatar-happy {
            animation: happy 2s infinite;
          }
          .avatar-sad {
            animation: sad 3s infinite;
          }
          .avatar-surprised {
            animation: surprised 0.5s infinite;
          }
          .avatar-angry {
            animation: angry 1.5s infinite;
          }
          
          @keyframes body-speak {
            0% { transform: scale(1); }
            100% { transform: scale(1.02); }
          }
          @keyframes listen {
            0% { transform: translateY(0); }
            50% { transform: translateY(-5px); }
            100% { transform: translateY(0); }
          }
          @keyframes think {
            0% { transform: rotate(0deg); }
            25% { transform: rotate(-1deg); }
            75% { transform: rotate(1deg); }
            100% { transform: rotate(0deg); }
          }
          @keyframes happy {
            0% { transform: scale(1); }
            50% { transform: scale(1.03) rotate(1deg); }
            100% { transform: scale(1); }
          }
          @keyframes sad {
            0% { transform: translateY(0); }
            50% { transform: translateY(5px); }
            100% { transform: translateY(0); }
          }
          @keyframes surprised {
            0% { transform: scale(1); }
            50% { transform: scale(1.1); }
            100% { transform: scale(1); }
          }
          @keyframes angry {
            0% { transform: rotate(0deg); }
            25% { transform: rotate(-1deg); }
            75% { transform: rotate(1deg); }
            100% { transform: rotate(0deg); }
          }
          @keyframes mouth-move {
            0% { transform: translateX(-50%) scaleY(0.5); }
            100% { transform: translateX(-50%) scaleY(1.5); }
          }
          
          .happy-overlay {
            background: radial-gradient(circle, transparent 60%, rgba(255,255,0,0.1) 100%);
          }
          .sad-overlay {
            background: radial-gradient(circle, transparent 60%, rgba(0,0,255,0.1) 100%);
          }
          .angry-overlay {
            background: radial-gradient(circle, transparent 60%, rgba(255,0,0,0.1) 100%);
          }
          .surprised-overlay {
            background: radial-gradient(circle, transparent 60%, rgba(128,0,128,0.1) 100%);
          }
        `}
      </style>
    </div>
  );
};

export default Avatar3D;
