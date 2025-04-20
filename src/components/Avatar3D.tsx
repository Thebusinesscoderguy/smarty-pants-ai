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
  
  const lipSyncInterval = useRef<NodeJS.Timeout | null>(null);
  const speechPattern = useRef<number[]>([0, 0.3, 0.6, 1, 0.8, 0.5, 0.2, 0, 0.4, 0.7, 0.5, 0.3, 0]);
  const speechPatternIndex = useRef(0);
  
  useEffect(() => {
    if (!containerRef.current) return;
    
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x000000);
    sceneRef.current = scene;
    
    const ambientLight = new THREE.AmbientLight(0x404040, 2);
    scene.add(ambientLight);
    
    const directionalLight = new THREE.DirectionalLight(0xffffff, 2);
    directionalLight.position.set(0, 10, 10);
    scene.add(directionalLight);
    
    const width = containerRef.current.clientWidth;
    const height = containerRef.current.clientHeight;
    const camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 1000);
    camera.position.z = 5;
    cameraRef.current = camera;
    
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(window.devicePixelRatio);
    containerRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;
    
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.enableZoom = true;
    controls.minDistance = 3;
    controls.maxDistance = 10;
    controlsRef.current = controls;
    
    loadAvatarModel(avatarStyle);
    
    const animate = () => {
      if (controlsRef.current) controlsRef.current.update();
      if (rendererRef.current && cameraRef.current && sceneRef.current) {
        rendererRef.current.render(sceneRef.current, cameraRef.current);
      }
      
      if (modelRef.current) {
        if (isSpeaking) {
          applyLipMovement(modelRef.current, lipOpenness);
          
          if (animationState === 'speaking') {
            modelRef.current.rotation.y = Math.sin(Date.now() * 0.001) * 0.2;
            animateGestures(modelRef.current, 'speaking');
          }
        } else if (isListening) {
          modelRef.current.rotation.y = Math.sin(Date.now() * 0.0008) * 0.1;
          modelRef.current.rotation.x = Math.sin(Date.now() * 0.001) * 0.05;
          animateGestures(modelRef.current, 'listening');
        } else if (isThinking) {
          modelRef.current.rotation.x = Math.sin(Date.now() * 0.001) * 0.15;
          animateGestures(modelRef.current, 'thinking');
        } else {
          modelRef.current.rotation.y = Math.sin(Date.now() * 0.0005) * 0.05;
          modelRef.current.rotation.x = Math.sin(Date.now() * 0.0007) * 0.03;
          animateGestures(modelRef.current, 'idle');
        }
        
        applySentimentAnimation(modelRef.current, currentSentiment);
      }
      
      requestRef.current = requestAnimationFrame(animate);
    };
    
    requestRef.current = requestAnimationFrame(animate);
    
    const handleResize = () => {
      if (!containerRef.current || !cameraRef.current || !rendererRef.current) return;
      
      const width = containerRef.current.clientWidth;
      const height = containerRef.current.clientHeight;
      
      cameraRef.current.aspect = width / height;
      cameraRef.current.updateProjectionMatrix();
      
      rendererRef.current.setSize(width, height);
    };
    
    window.addEventListener('resize', handleResize);
    
    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
      if (containerRef.current && rendererRef.current) {
        containerRef.current.removeChild(rendererRef.current.domElement);
      }
      window.removeEventListener('resize', handleResize);
      
      if (lipSyncInterval.current) {
        clearInterval(lipSyncInterval.current);
      }
    };
  }, []);
  
  const loadAvatarModel = (style: string) => {
    if (!sceneRef.current) return;
    
    if (modelRef.current) {
      sceneRef.current.remove(modelRef.current);
      modelRef.current = null;
    }
    
    const avatarGroup = new THREE.Group();
    
    const mainColor = 0xFFFFFF; // White plastic
    const accentColor = 0x40E0D0; // Turquoise
    const screenColor = 0x111111; // Dark screen
    const eyeColor = 0x00FFFF; // Cyan blue
    
    const headGeometry = new THREE.SphereGeometry(0.8, 32, 32);
    const headMaterial = new THREE.MeshPhongMaterial({ 
      color: mainColor,
      shininess: 100,
      specular: 0x444444
    });
    const head = new THREE.Mesh(headGeometry, headMaterial);
    head.position.set(0, 1.2, 0);
    head.scale.set(1.2, 1.1, 1);
    head.name = "head";
    avatarGroup.add(head);
    
    const screenGeometry = new THREE.PlaneGeometry(1.2, 0.8);
    const screenMaterial = new THREE.MeshPhongMaterial({ 
      color: screenColor,
      shininess: 150,
      emissive: 0x111111
    });
    const screen = new THREE.Mesh(screenGeometry, screenMaterial);
    screen.position.set(0, 1.3, 0.7);
    screen.name = "screen";
    avatarGroup.add(screen);
    
    const eyeGeometry = new THREE.CircleGeometry(0.15, 32);
    const eyeMaterial = new THREE.MeshPhongMaterial({ 
      color: eyeColor,
      emissive: eyeColor,
      emissiveIntensity: 0.5,
      shininess: 100
    });
    
    const leftEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
    leftEye.position.set(-0.3, 1.3, 0.71);
    leftEye.name = "leftEye";
    avatarGroup.add(leftEye);
    
    const rightEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
    rightEye.position.set(0.3, 1.3, 0.71);
    rightEye.name = "rightEye";
    avatarGroup.add(rightEye);
    
    const torsoGeometry = new THREE.CylinderGeometry(0.7, 0.5, 1.8, 32);
    const torsoMaterial = new THREE.MeshPhongMaterial({ 
      color: mainColor,
      shininess: 100,
      specular: 0x444444
    });
    const torso = new THREE.Mesh(torsoGeometry, torsoMaterial);
    torso.position.set(0, 0, 0);
    torso.name = "torso";
    avatarGroup.add(torso);
    
    const chestGeometry = new THREE.CylinderGeometry(0.5, 0.4, 1.2, 32);
    const chestMaterial = new THREE.MeshPhongMaterial({ 
      color: accentColor,
      shininess: 150,
      specular: 0x666666,
      emissive: accentColor,
      emissiveIntensity: 0.2
    });
    const chest = new THREE.Mesh(chestGeometry, chestMaterial);
    chest.position.set(0, 0.2, 0.2);
    chest.rotation.x = 0.1;
    chest.name = "chest";
    avatarGroup.add(chest);
    
    const armGeometry = new THREE.CapsuleGeometry(0.15, 0.6, 4, 8);
    const armMaterial = new THREE.MeshPhongMaterial({ 
      color: mainColor,
      shininess: 100,
      specular: 0x444444
    });
    
    const leftArm = new THREE.Group();
    const leftArmMesh = new THREE.Mesh(armGeometry, armMaterial);
    leftArmMesh.position.set(0, -0.3, 0);
    leftArm.add(leftArmMesh);
    leftArm.position.set(-0.85, 0.3, 0);
    leftArm.name = "leftArm";
    avatarGroup.add(leftArm);
    
    const rightArm = new THREE.Group();
    const rightArmMesh = new THREE.Mesh(armGeometry, armMaterial);
    rightArmMesh.position.set(0, -0.3, 0);
    rightArm.add(rightArmMesh);
    rightArm.position.set(0.85, 0.3, 0);
    rightArm.name = "rightArm";
    avatarGroup.add(rightArm);
    
    const handGeometry = new THREE.SphereGeometry(0.18, 32, 32);
    const handMaterial = new THREE.MeshPhongMaterial({ 
      color: mainColor,
      shininess: 100,
      specular: 0x444444
    });
    
    const leftHand = new THREE.Mesh(handGeometry, handMaterial);
    leftHand.position.set(-0.85, -0.3, 0);
    leftHand.name = "leftHand";
    avatarGroup.add(leftHand);
    
    const rightHand = new THREE.Mesh(handGeometry, handMaterial);
    rightHand.position.set(0.85, -0.3, 0);
    rightHand.name = "rightHand";
    avatarGroup.add(rightHand);
    
    const baseGeometry = new THREE.CylinderGeometry(0.6, 0.7, 0.3, 32);
    const baseMaterial = new THREE.MeshPhongMaterial({ 
      color: accentColor,
      shininess: 150,
      specular: 0x666666
    });
    const base = new THREE.Mesh(baseGeometry, baseMaterial);
    base.position.set(0, -1.2, 0);
    base.name = "base";
    avatarGroup.add(base);
    
    avatarGroup.position.set(0, 1.5, 0);
    sceneRef.current.add(avatarGroup);
    modelRef.current = avatarGroup;
    setAvatarLoaded(true);
  };
  
  const applyLipMovement = (model: THREE.Group, openness: number) => {
    const mouth = model.children.find(child => child.name === "mouth");
    if (mouth) {
      (mouth as THREE.Mesh).scale.y = 1 + openness * 4;
      (mouth as THREE.Mesh).position.y = 1.0 - (openness * 0.1);
    }
  };
  
  const animateGestures = (model: THREE.Group, state: string) => {
    const leftArm = model.children.find(child => child.name === "leftArm");
    const rightArm = model.children.find(child => child.name === "rightArm");
    const leftHand = model.children.find(child => child.name === "leftHand");
    const rightHand = model.children.find(child => child.name === "rightHand");
    
    if (!leftArm || !rightArm || !leftHand || !rightHand) return;
    
    switch (state) {
      case 'speaking':
        leftArm.rotation.z = Math.sin(Date.now() * 0.002) * 0.3 + Math.PI / 6;
        rightArm.rotation.z = -Math.sin(Date.now() * 0.002) * 0.3 - Math.PI / 6;
        
        const leftArmAngle = leftArm.rotation.z;
        const rightArmAngle = rightArm.rotation.z;
        
        leftHand.position.x = -0.8 - Math.sin(leftArmAngle) * 0.8;
        leftHand.position.y = -0.2 - Math.cos(leftArmAngle) * 0.8;
        
        rightHand.position.x = 0.8 + Math.sin(-rightArmAngle) * 0.8;
        rightHand.position.y = -0.2 - Math.cos(rightArmAngle) * 0.8;
        break;
        
      case 'listening':
        leftArm.rotation.z = Math.PI / 6;
        rightArm.rotation.z = -Math.PI / 6;
        
        leftHand.position.set(-1.1, -0.6, 0);
        rightHand.position.set(1.1, -0.6, 0);
        break;
        
      case 'thinking':
        rightArm.rotation.z = -Math.PI / 3;
        rightArm.rotation.y = -Math.PI / 8;
        
        rightHand.position.set(0.4, 0.8, 0.6);
        
        leftArm.rotation.z = Math.PI / 4;
        leftHand.position.set(-1.0, -0.4, 0.2);
        break;
        
      default:
        leftArm.rotation.z = Math.PI / 8 + Math.sin(Date.now() * 0.001) * 0.05;
        rightArm.rotation.z = -Math.PI / 8 - Math.sin(Date.now() * 0.001) * 0.05;
        
        leftHand.position.set(-1.1, -0.6, 0);
        rightHand.position.set(1.1, -0.6, 0);
        break;
    }
  };
  
  const applySentimentAnimation = (model: THREE.Group, sentiment: string = 'neutral') => {
    const leftEye = model.children.find(child => child.name === "leftEye");
    const rightEye = model.children.find(child => child.name === "rightEye");
    const mouth = model.children.find(child => child.name === "mouth");
    
    if (!leftEye || !rightEye || !mouth) return;
    
    switch (sentiment) {
      case 'happy':
        (mouth as THREE.Mesh).scale.x = 1.5;
        (mouth as THREE.Mesh).scale.y = 0.8;
        (mouth as THREE.Mesh).position.y = 0.95;
        
        (leftEye as THREE.Mesh).scale.y = 0.8;
        (rightEye as THREE.Mesh).scale.y = 0.8;
        
        model.scale.y = 1 + Math.sin(Date.now() * 0.005) * 0.03;
        break;
        
      case 'sad':
        (mouth as THREE.Mesh).scale.x = 0.8;
        (mouth as THREE.Mesh).scale.y = 0.6;
        (mouth as THREE.Mesh).position.y = 0.9;
        
        (leftEye as THREE.Mesh).scale.y = 0.7;
        (rightEye as THREE.Mesh).scale.y = 0.7;
        
        model.rotation.x = Math.sin(Date.now() * 0.001) * 0.05 - 0.1;
        break;
        
      case 'surprised':
        (mouth as THREE.Mesh).scale.x = 0.7;
        (mouth as THREE.Mesh).scale.y = 2;
        
        (leftEye as THREE.Mesh).scale.x = 1.3;
        (leftEye as THREE.Mesh).scale.y = 1.3;
        (rightEye as THREE.Mesh).scale.x = 1.3;
        (rightEye as THREE.Mesh).scale.y = 1.3;
        
        model.position.z = Math.sin(Date.now() * 0.005) * 0.2;
        break;
        
      case 'angry':
        (mouth as THREE.Mesh).scale.x = 0.8;
        (mouth as THREE.Mesh).scale.y = 0.4;
        
        (leftEye as THREE.Mesh).scale.y = 0.6;
        (rightEye as THREE.Mesh).scale.y = 0.6;
        (leftEye as THREE.Mesh).rotation.z = 0.2;
        (rightEye as THREE.Mesh).rotation.z = -0.2;
        
        model.rotation.z = Math.sin(Date.now() * 0.003) * 0.05;
        break;
        
      default:
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
  
  useEffect(() => {
    if (sceneRef.current) {
      loadAvatarModel(avatarStyle);
    }
  }, [avatarStyle]);
  
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
  
  useEffect(() => {
    if (isSpeaking) {
      if (lipSyncInterval.current) {
        clearInterval(lipSyncInterval.current);
      }
      
      if (speechText) {
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
      
      lipSyncInterval.current = setInterval(() => {
        speechPatternIndex.current = (speechPatternIndex.current + 1) % speechPattern.current.length;
        const openness = speechPattern.current[speechPatternIndex.current] * speechIntensity;
        setLipOpenness(openness);
      }, 80);
      
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
