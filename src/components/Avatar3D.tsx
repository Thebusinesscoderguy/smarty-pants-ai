
import React, { useEffect, useRef, useState } from 'react';
import { Card } from '@/components/ui/card';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

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
  // Speech pattern for more realistic lip movement
  const speechPattern = useRef<number[]>([0, 0.3, 0.6, 1, 0.8, 0.5, 0.2, 0, 0.4, 0.7, 0.5, 0.3, 0]);
  const speechPatternIndex = useRef(0);
  
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
    // Different full-body avatar images based on style
    switch (avatarStyle) {
      case 'teacher':
        return 'https://api.dicebear.com/7.x/bottts/svg?seed=teacher&backgroundColor=transparent&scale=110';
      case 'casual':
        return 'https://api.dicebear.com/7.x/bottts/svg?seed=casual&backgroundColor=transparent&scale=110';
      case 'professional':
        return 'https://api.dicebear.com/7.x/bottts/svg?seed=professional&backgroundColor=transparent&scale=110';
      case 'friendly':
        return 'https://api.dicebear.com/7.x/bottts/svg?seed=friendly&backgroundColor=transparent&scale=110';
      default:
        return 'https://api.dicebear.com/7.x/bottts/svg?seed=default&backgroundColor=transparent&scale=110';
    }
  };

  // Update lip sync animation when speaking
  useEffect(() => {
    if (!isSpeaking) return;
    
    const lipSyncInterval = setInterval(() => {
      frameCounter.current = (frameCounter.current + 1) % 10;
      speechPatternIndex.current = (speechPatternIndex.current + 1) % speechPattern.current.length;
    }, 100);
    
    return () => clearInterval(lipSyncInterval);
  }, [isSpeaking]);

  // Generate gestures based on sentiment and speech
  const getGestureClass = () => {
    if (isSpeaking) {
      if (currentSentiment === 'happy') return 'gesture-hands-up';
      if (currentSentiment === 'sad') return 'gesture-hands-down';
      if (currentSentiment === 'angry') return 'gesture-pointing';
      if (currentSentiment === 'surprised') return 'gesture-hands-out';
      return 'gesture-talking';
    }
    
    if (isListening) return 'gesture-listening';
    if (isThinking) return 'gesture-thinking';
    
    return '';
  };

  // Determine head movement based on expression
  const getHeadMovementClass = () => {
    if (currentSentiment === 'happy') return 'head-nod-yes';
    if (currentSentiment === 'sad') return 'head-nod-no';
    if (isThinking) return 'head-tilt';
    return '';
  };

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
            <div className={`full-body-avatar ${getGestureClass()} ${getHeadMovementClass()}`}>
              <img 
                src={getAvatarImage()} 
                alt="3D Avatar" 
                className="w-full h-full object-contain" 
              />
            </div>
            
            {/* Mouth animation overlay for lip syncing */}
            {isSpeaking && (
              <div 
                className="mouth-animation"
                style={{
                  position: 'absolute',
                  bottom: '40%',
                  left: '50%',
                  transform: `translateX(-50%) scaleY(${speechPattern.current[speechPatternIndex.current] * speechIntensity + 0.5})`,
                  width: '10%',
                  height: '2%',
                  background: 'rgba(0,0,0,0.8)', 
                  borderRadius: '40%',
                  transition: 'transform 0.1s ease-in-out'
                }}
              />
            )}
            
            {/* Eyes animation */}
            <div className="eyes-container" style={{ 
              position: 'absolute', 
              top: '30%', 
              left: '0', 
              width: '100%', 
              display: 'flex', 
              justifyContent: 'center', 
              gap: '15%' 
            }}>
              <div className={`eye ${currentExpression === 'thinking' ? 'eye-blink' : ''}`} style={{ 
                width: '8%', 
                height: '4%', 
                background: 'rgba(0,0,0,0.8)', 
                borderRadius: '50%',
                animation: isThinking ? 'eye-roll 2s infinite' : ''
              }}/>
              <div className={`eye ${currentExpression === 'thinking' ? 'eye-blink' : ''}`} style={{ 
                width: '8%', 
                height: '4%', 
                background: 'rgba(0,0,0,0.8)', 
                borderRadius: '50%',
                animation: isThinking ? 'eye-roll 2s infinite' : ''
              }}/>
            </div>
            
            {/* Emotional expressions overlay */}
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
          /* Full body avatar styling */
          .full-body-avatar {
            width: 100%;
            height: 85%;
            position: relative;
          }

          /* Gesture animations */
          .gesture-talking {
            animation: talking-gesture 3s infinite alternate;
          }
          .gesture-hands-up {
            animation: hands-up-gesture 2s infinite alternate;
          }
          .gesture-hands-down {
            animation: hands-down-gesture 2s infinite alternate;
          }
          .gesture-pointing {
            animation: pointing-gesture 2s infinite alternate;
          }
          .gesture-hands-out {
            animation: hands-out-gesture 1s infinite alternate;
          }
          .gesture-listening {
            animation: listening-gesture 3s infinite;
          }
          .gesture-thinking {
            animation: thinking-gesture 3s infinite;
          }

          /* Head movement animations */
          .head-nod-yes {
            animation: nod-yes 2s infinite;
          }
          .head-nod-no {
            animation: nod-no 2s infinite;
          }
          .head-tilt {
            animation: head-tilt 3s infinite alternate;
          }

          /* Eye animations */
          .eye-blink {
            animation: blink 3s infinite;
          }

          /* General expression animations */
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
          
          /* Animation keyframes */
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
          @keyframes blink {
            0%, 45%, 55%, 100% { transform: scaleY(1); }
            50% { transform: scaleY(0.1); }
          }
          @keyframes eye-roll {
            0% { transform: translateX(0); }
            25% { transform: translateX(20%); }
            50% { transform: translateX(0); }
            75% { transform: translateX(-20%); }
            100% { transform: translateX(0); }
          }

          /* Gesture keyframes */
          @keyframes talking-gesture {
            0% { transform: translateY(0); }
            100% { transform: translateY(10px); }
          }
          @keyframes hands-up-gesture {
            0% { transform: translateY(0); }
            100% { transform: translateY(-15px) scale(1.05); }
          }
          @keyframes hands-down-gesture {
            0% { transform: translateY(0); }
            100% { transform: translateY(15px) scale(0.95); }
          }
          @keyframes pointing-gesture {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(5deg); }
          }
          @keyframes hands-out-gesture {
            0% { transform: scale(1); }
            100% { transform: scale(1.15); }
          }
          @keyframes listening-gesture {
            0% { transform: translateX(0); }
            25% { transform: translateX(5px); }
            75% { transform: translateX(-5px); }
            100% { transform: translateX(0); }
          }
          @keyframes thinking-gesture {
            0% { transform: rotate(0deg) translateY(0); }
            50% { transform: rotate(2deg) translateY(-5px); }
            100% { transform: rotate(-2deg) translateY(5px); }
          }
          @keyframes nod-yes {
            0%, 100% { transform: translateY(0); }
            50% { transform: translateY(-10px); }
          }
          @keyframes nod-no {
            0%, 100% { transform: translateX(0); }
            25% { transform: translateX(10px); }
            75% { transform: translateX(-10px); }
          }
          @keyframes head-tilt {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(8deg); }
          }

          /* Expression overlays */
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
