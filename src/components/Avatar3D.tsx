
import React, { useEffect, useRef, useState } from 'react';
import { Card } from '@/components/ui/card';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

interface Avatar3DProps {
  isSpeaking: boolean;
  isListening: boolean;
  isThinking: boolean;
  avatarStyle: 'teacher' | 'casual' | 'professional' | 'friendly';
  className?: string;
  currentSentiment?: 'neutral' | 'happy' | 'sad' | 'surprised' | 'angry';
  speechIntensity?: number; // 0-1 value for lip movement intensity
  speechText?: string; // Added to respond to specific words
}

const Avatar3D: React.FC<Avatar3DProps> = ({
  isSpeaking,
  isListening,
  isThinking,
  avatarStyle,
  className = '',
  currentSentiment = 'neutral',
  speechIntensity = 0.5,
  speechText = '',
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const modelRef = useRef<THREE.Group | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const requestRef = useRef<number | null>(null);
  
  const [avatarLoaded, setAvatarLoaded] = useState(false);
  const [lipOpenness, setLipOpenness] = useState(0);
  const [animationState, setAnimationState] = useState<string>('idle');
  
  // Lip sync variables
  const lipSyncInterval = useRef<NodeJS.Timeout | null>(null);
  const speechPattern = useRef<number[]>([0, 0.3, 0.6, 1, 0.8, 0.5, 0.2, 0, 0.4, 0.7, 0.5, 0.3, 0]);
  const speechPatternIndex = useRef(0);
  
  // Setup Three.js scene
  useEffect(() => {
    if (!containerRef.current) return;
    
    // Initialize scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x000000);
    sceneRef.current = scene;
    
    // Add ambient light
    const ambientLight = new THREE.AmbientLight(0x404040, 2);
    scene.add(ambientLight);
    
    // Add directional light
    const directionalLight = new THREE.DirectionalLight(0xffffff, 2);
    directionalLight.position.set(0, 10, 10);
    scene.add(directionalLight);
    
    // Setup camera
    const width = containerRef.current.clientWidth;
    const height = containerRef.current.clientHeight;
    const camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 1000);
    camera.position.z = 5;
    cameraRef.current = camera;
    
    // Setup renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(window.devicePixelRatio);
    containerRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;
    
    // Setup controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.enableZoom = true;
    controls.minDistance = 3;
    controls.maxDistance = 10;
    controlsRef.current = controls;
    
    // Load avatar model based on style
    loadAvatarModel(avatarStyle);
    
    // Animation loop
    const animate = () => {
      if (controlsRef.current) controlsRef.current.update();
      if (rendererRef.current && cameraRef.current && sceneRef.current) {
        rendererRef.current.render(sceneRef.current, cameraRef.current);
      }
      
      // Animate the avatar model based on state
      if (modelRef.current) {
        // Apply animations based on speaking, listening, thinking states and animation state
        if (isSpeaking) {
          applyLipMovement(modelRef.current, lipOpenness);
          
          if (animationState === 'speaking') {
            // Gentle head movement while speaking
            modelRef.current.rotation.y = Math.sin(Date.now() * 0.001) * 0.2;
            // Subtle hand gestures for speaking
            animateGestures(modelRef.current, 'speaking');
          }
        } else if (isListening) {
          // Slight head tilt and nodding when listening
          modelRef.current.rotation.y = Math.sin(Date.now() * 0.0008) * 0.1;
          modelRef.current.rotation.x = Math.sin(Date.now() * 0.001) * 0.05;
          animateGestures(modelRef.current, 'listening');
        } else if (isThinking) {
          // More pronounced head tilt for thinking
          modelRef.current.rotation.x = Math.sin(Date.now() * 0.001) * 0.15;
          // Hand to chin pose for thinking
          animateGestures(modelRef.current, 'thinking');
        } else {
          // Idle animations
          modelRef.current.rotation.y = Math.sin(Date.now() * 0.0005) * 0.05;
          modelRef.current.rotation.x = Math.sin(Date.now() * 0.0007) * 0.03;
          animateGestures(modelRef.current, 'idle');
        }
        
        // Apply sentiment-based animations
        applySentimentAnimation(modelRef.current, currentSentiment);
      }
      
      requestRef.current = requestAnimationFrame(animate);
    };
    
    requestRef.current = requestAnimationFrame(animate);
    
    // Handle window resize
    const handleResize = () => {
      if (!containerRef.current || !cameraRef.current || !rendererRef.current) return;
      
      const width = containerRef.current.clientWidth;
      const height = containerRef.current.clientHeight;
      
      cameraRef.current.aspect = width / height;
      cameraRef.current.updateProjectionMatrix();
      
      rendererRef.current.setSize(width, height);
    };
    
    window.addEventListener('resize', handleResize);
    
    // Cleanup
    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
      if (containerRef.current && rendererRef.current) {
        containerRef.current.removeChild(rendererRef.current.domElement);
      }
      window.removeEventListener('resize', handleResize);
      
      // Clear lip sync interval
      if (lipSyncInterval.current) {
        clearInterval(lipSyncInterval.current);
      }
    };
  }, []);
  
  // Load avatar model based on selected style
  const loadAvatarModel = (style: string) => {
    if (!sceneRef.current) return;
    
    // Clear previous model if exists
    if (modelRef.current) {
      sceneRef.current.remove(modelRef.current);
      modelRef.current = null;
    }
    
    // Create avatar geometry based on style
    const avatarGroup = new THREE.Group();
    
    // Base body - choose different geometries based on style
    let bodyGeometry;
    let bodyMaterial;
    let bodyColor;
    
    switch (style) {
      case 'teacher':
        bodyColor = 0x3f51b5;
        break;
      case 'casual':
        bodyColor = 0x4caf50;
        break;
      case 'professional':
        bodyColor = 0x607d8b;
        break;
      case 'friendly':
        bodyColor = 0xff9800;
        break;
      default:
        bodyColor = 0x3f51b5;
    }
    
    // Create full body
    // Head
    const headGeometry = new THREE.SphereGeometry(0.8, 32, 32);
    const headMaterial = new THREE.MeshPhongMaterial({ color: bodyColor });
    const head = new THREE.Mesh(headGeometry, headMaterial);
    head.position.set(0, 1.2, 0);
    head.name = "head";
    avatarGroup.add(head);
    
    // Torso
    const torsoGeometry = new THREE.CylinderGeometry(0.7, 0.5, 1.5, 16);
    const torsoMaterial = new THREE.MeshPhongMaterial({ color: bodyColor });
    const torso = new THREE.Mesh(torsoGeometry, torsoMaterial);
    torso.position.set(0, 0, 0);
    torso.name = "torso";
    avatarGroup.add(torso);
    
    // Add eyes
    const eyeGeometry = new THREE.SphereGeometry(0.15, 32, 32);
    const eyeMaterial = new THREE.MeshPhongMaterial({ color: 0xffffff });
    
    const leftEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
    leftEye.position.set(-0.3, 1.3, 0.65);
    leftEye.name = "leftEye";
    avatarGroup.add(leftEye);
    
    const rightEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
    rightEye.position.set(0.3, 1.3, 0.65);
    rightEye.name = "rightEye";
    avatarGroup.add(rightEye);
    
    // Add pupils
    const pupilGeometry = new THREE.SphereGeometry(0.07, 32, 32);
    const pupilMaterial = new THREE.MeshPhongMaterial({ color: 0x000000 });
    
    const leftPupil = new THREE.Mesh(pupilGeometry, pupilMaterial);
    leftPupil.position.set(-0.3, 1.3, 0.75);
    leftPupil.name = "leftPupil";
    avatarGroup.add(leftPupil);
    
    const rightPupil = new THREE.Mesh(pupilGeometry, pupilMaterial);
    rightPupil.position.set(0.3, 1.3, 0.75);
    rightPupil.name = "rightPupil";
    avatarGroup.add(rightPupil);
    
    // Add mouth - will be animated
    const mouthGeometry = new THREE.BoxGeometry(0.5, 0.1, 0.1);
    const mouthMaterial = new THREE.MeshPhongMaterial({ color: 0x000000 });
    const mouth = new THREE.Mesh(mouthGeometry, mouthMaterial);
    mouth.position.set(0, 1.0, 0.75);
    mouth.name = "mouth";
    avatarGroup.add(mouth);
    
    // Add arms
    const armGeometry = new THREE.CylinderGeometry(0.1, 0.1, 1.2, 16);
    const armMaterial = new THREE.MeshPhongMaterial({ color: bodyColor });
    
    const leftArm = new THREE.Group();
    const leftArmUpper = new THREE.Mesh(armGeometry, armMaterial);
    leftArmUpper.position.set(0, -0.5, 0);
    leftArmUpper.rotation.z = Math.PI / 8;
    leftArm.add(leftArmUpper);
    leftArm.position.set(-0.8, 0.3, 0);
    leftArm.name = "leftArm";
    avatarGroup.add(leftArm);
    
    const rightArm = new THREE.Group();
    const rightArmUpper = new THREE.Mesh(armGeometry, armMaterial);
    rightArmUpper.position.set(0, -0.5, 0);
    rightArmUpper.rotation.z = -Math.PI / 8;
    rightArm.add(rightArmUpper);
    rightArm.position.set(0.8, 0.3, 0);
    rightArm.name = "rightArm";
    avatarGroup.add(rightArm);
    
    // Add hands
    const handGeometry = new THREE.SphereGeometry(0.15, 16, 16);
    const handMaterial = new THREE.MeshPhongMaterial({ color: 0xffddcc });
    
    const leftHand = new THREE.Mesh(handGeometry, handMaterial);
    leftHand.position.set(-1.1, -0.6, 0);
    leftHand.name = "leftHand";
    avatarGroup.add(leftHand);
    
    const rightHand = new THREE.Mesh(handGeometry, handMaterial);
    rightHand.position.set(1.1, -0.6, 0);
    rightHand.name = "rightHand";
    avatarGroup.add(rightHand);
    
    // Add legs
    const legGeometry = new THREE.CylinderGeometry(0.15, 0.15, 1.5, 16);
    const legMaterial = new THREE.MeshPhongMaterial({ color: bodyColor });
    
    const leftLeg = new THREE.Mesh(legGeometry, legMaterial);
    leftLeg.position.set(-0.3, -1.5, 0);
    leftLeg.name = "leftLeg";
    avatarGroup.add(leftLeg);
    
    const rightLeg = new THREE.Mesh(legGeometry, legMaterial);
    rightLeg.position.set(0.3, -1.5, 0);
    rightLeg.name = "rightLeg";
    avatarGroup.add(rightLeg);
    
    // Add feet
    const footGeometry = new THREE.BoxGeometry(0.25, 0.1, 0.5);
    const footMaterial = new THREE.MeshPhongMaterial({ color: 0x333333 });
    
    const leftFoot = new THREE.Mesh(footGeometry, footMaterial);
    leftFoot.position.set(-0.3, -2.3, 0.1);
    leftFoot.name = "leftFoot";
    avatarGroup.add(leftFoot);
    
    const rightFoot = new THREE.Mesh(footGeometry, footMaterial);
    rightFoot.position.set(0.3, -2.3, 0.1);
    rightFoot.name = "rightFoot";
    avatarGroup.add(rightFoot);
    
    // Add avatar to scene
    avatarGroup.position.set(0, 1.5, 0);
    sceneRef.current.add(avatarGroup);
    modelRef.current = avatarGroup;
    setAvatarLoaded(true);
  };
  
  // Apply lip movement for speaking animation
  const applyLipMovement = (model: THREE.Group, openness: number) => {
    const mouth = model.children.find(child => child.name === "mouth");
    if (mouth) {
      (mouth as THREE.Mesh).scale.y = 1 + openness * 4; // More exaggerated movement
      (mouth as THREE.Mesh).position.y = 1.0 - (openness * 0.1); // Adjust position as it opens
    }
  };
  
  // Animate gestures based on state
  const animateGestures = (model: THREE.Group, state: string) => {
    const leftArm = model.children.find(child => child.name === "leftArm");
    const rightArm = model.children.find(child => child.name === "rightArm");
    const leftHand = model.children.find(child => child.name === "leftHand");
    const rightHand = model.children.find(child => child.name === "rightHand");
    
    if (!leftArm || !rightArm || !leftHand || !rightHand) return;
    
    switch (state) {
      case 'speaking':
        // Gesturing animation for speaking
        leftArm.rotation.z = Math.sin(Date.now() * 0.002) * 0.3 + Math.PI / 6;
        rightArm.rotation.z = -Math.sin(Date.now() * 0.002) * 0.3 - Math.PI / 6;
        
        // Update hand positions to follow arms
        const leftArmAngle = leftArm.rotation.z;
        const rightArmAngle = rightArm.rotation.z;
        
        leftHand.position.x = -0.8 - Math.sin(leftArmAngle) * 0.8;
        leftHand.position.y = -0.2 - Math.cos(leftArmAngle) * 0.8;
        
        rightHand.position.x = 0.8 + Math.sin(-rightArmAngle) * 0.8;
        rightHand.position.y = -0.2 - Math.cos(rightArmAngle) * 0.8;
        break;
        
      case 'listening':
        // Subtle arm movements when listening
        leftArm.rotation.z = Math.PI / 6;
        rightArm.rotation.z = -Math.PI / 6;
        
        // Hands in resting position
        leftHand.position.set(-1.1, -0.6, 0);
        rightHand.position.set(1.1, -0.6, 0);
        break;
        
      case 'thinking':
        // One hand goes to chin in thinking pose
        rightArm.rotation.z = -Math.PI / 3;
        rightArm.rotation.y = -Math.PI / 8;
        
        rightHand.position.set(0.4, 0.8, 0.6);
        
        leftArm.rotation.z = Math.PI / 4;
        leftHand.position.set(-1.0, -0.4, 0.2);
        break;
        
      default: // 'idle'
        // Relaxed pose
        leftArm.rotation.z = Math.PI / 8 + Math.sin(Date.now() * 0.001) * 0.05;
        rightArm.rotation.z = -Math.PI / 8 - Math.sin(Date.now() * 0.001) * 0.05;
        
        leftHand.position.set(-1.1, -0.6, 0);
        rightHand.position.set(1.1, -0.6, 0);
        break;
    }
  };
  
  // Apply sentiment-based animations
  const applySentimentAnimation = (model: THREE.Group, sentiment: string = 'neutral') => {
    const leftEye = model.children.find(child => child.name === "leftEye");
    const rightEye = model.children.find(child => child.name === "rightEye");
    const mouth = model.children.find(child => child.name === "mouth");
    
    if (!leftEye || !rightEye || !mouth) return;
    
    switch (sentiment) {
      case 'happy':
        // Wider smile and raised eyebrows
        (mouth as THREE.Mesh).scale.x = 1.5;
        (mouth as THREE.Mesh).scale.y = 0.8;
        (mouth as THREE.Mesh).position.y = 0.95;
        
        // Slightly squint eyes
        (leftEye as THREE.Mesh).scale.y = 0.8;
        (rightEye as THREE.Mesh).scale.y = 0.8;
        
        // Body becomes more energetic
        model.scale.y = 1 + Math.sin(Date.now() * 0.005) * 0.03;
        break;
        
      case 'sad':
        // Drooping mouth
        (mouth as THREE.Mesh).scale.x = 0.8;
        (mouth as THREE.Mesh).scale.y = 0.6;
        (mouth as THREE.Mesh).position.y = 0.9;
        
        // Drooping eyes
        (leftEye as THREE.Mesh).scale.y = 0.7;
        (rightEye as THREE.Mesh).scale.y = 0.7;
        
        // Slumping posture
        model.rotation.x = Math.sin(Date.now() * 0.001) * 0.05 - 0.1;
        break;
        
      case 'surprised':
        // Wide open mouth
        (mouth as THREE.Mesh).scale.x = 0.7;
        (mouth as THREE.Mesh).scale.y = 2;
        
        // Wide eyes
        (leftEye as THREE.Mesh).scale.x = 1.3;
        (leftEye as THREE.Mesh).scale.y = 1.3;
        (rightEye as THREE.Mesh).scale.x = 1.3;
        (rightEye as THREE.Mesh).scale.y = 1.3;
        
        // Slight back movement
        model.position.z = Math.sin(Date.now() * 0.005) * 0.2;
        break;
        
      case 'angry':
        // Tight mouth
        (mouth as THREE.Mesh).scale.x = 0.8;
        (mouth as THREE.Mesh).scale.y = 0.4;
        
        // Furrowed brow effect with eyes
        (leftEye as THREE.Mesh).scale.y = 0.6;
        (rightEye as THREE.Mesh).scale.y = 0.6;
        (leftEye as THREE.Mesh).rotation.z = 0.2;
        (rightEye as THREE.Mesh).rotation.z = -0.2;
        
        // Tense posture
        model.rotation.z = Math.sin(Date.now() * 0.003) * 0.05;
        break;
        
      default: // 'neutral'
        // Return to normal
        (mouth as THREE.Mesh).scale.x = 1;
        (mouth as THREE.Mesh).scale.y = 1;
        (mouth as THREE.Mesh).position.y = 1.0;
        
        (leftEye as THREE.Mesh).scale.x = 1;
        (leftEye as THREE.Mesh).scale.y = 1;
        (rightEye as THREE.Mesh).scale.x = 1;
        (rightEye as THREE.Mesh).scale.y = 1;
        (leftEye as THREE.Mesh).rotation.z = 0;
        (rightEye as THREE.Mesh).rotation.z = 0;
        
        model.rotation.x *= 0.95;
        model.rotation.z *= 0.95;
        model.scale.x += (1 - model.scale.x) * 0.1;
        model.scale.y += (1 - model.scale.y) * 0.1;
        model.position.z *= 0.9;
    }
  };
  
  // Update avatar style when it changes
  useEffect(() => {
    if (sceneRef.current) {
      loadAvatarModel(avatarStyle);
    }
  }, [avatarStyle]);
  
  // Update animation state based on inputs
  useEffect(() => {
    if (isSpeaking) {
      setAnimationState('speaking');
    } else if (isListening) {
      setAnimationState('listening');
    } else if (isThinking) {
      setAnimationState('thinking');
    } else {
      setAnimationState('idle');
    }
  }, [isSpeaking, isListening, isThinking]);
  
  // Update lip sync animation when speaking
  useEffect(() => {
    if (isSpeaking) {
      // Clear any existing interval
      if (lipSyncInterval.current) {
        clearInterval(lipSyncInterval.current);
      }
      
      // Create pattern based on speech text if available
      if (speechText) {
        // Create a dynamic pattern based on speech text
        const words = speechText.split(' ');
        const newPattern = words.flatMap(word => {
          const wordLength = word.length;
          const intensity = Math.min(0.5 + (wordLength / 10), 1);
          return [0, intensity * 0.5, intensity, intensity * 0.7, 0.1];
        });
        
        if (newPattern.length > 0) {
          speechPattern.current = newPattern;
        }
      }
      
      // Create new lip sync interval
      lipSyncInterval.current = setInterval(() => {
        speechPatternIndex.current = (speechPatternIndex.current + 1) % speechPattern.current.length;
        const openness = speechPattern.current[speechPatternIndex.current] * speechIntensity;
        setLipOpenness(openness);
      }, 80); // Faster for more realistic speech
      
      return () => {
        if (lipSyncInterval.current) {
          clearInterval(lipSyncInterval.current);
          lipSyncInterval.current = null;
        }
        setLipOpenness(0);
      };
    } else {
      if (lipSyncInterval.current) {
        clearInterval(lipSyncInterval.current);
        lipSyncInterval.current = null;
      }
      setLipOpenness(0);
    }
  }, [isSpeaking, speechIntensity, speechText]);

  return (
    <div 
      ref={containerRef}
      className={`relative w-full h-full flex items-center justify-center ${className}`}
    >
      <Card className="absolute top-4 left-4 z-10 bg-black/50 border-none p-2">
        <p className="text-xs text-white">
          {!avatarLoaded && 'Loading avatar...'}
          {avatarLoaded && isSpeaking && 'Speaking...'}
          {avatarLoaded && isListening && 'Listening...'}
          {avatarLoaded && isThinking && 'Thinking...'}
          {avatarLoaded && !isSpeaking && !isListening && !isThinking && 'Ready'}
        </p>
      </Card>
    </div>
  );
};

export default Avatar3D;
