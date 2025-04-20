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
  speechIntensity?: number;
  speechText?: string;
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
    
    // Initialize scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x1E1E1E); // Dark charcoal background
    sceneRef.current = scene;
    
    // Soft ambient lighting setup
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
    scene.add(ambientLight);
    
    // Soft directional lights
    const frontLight = new THREE.DirectionalLight(0xffffff, 0.6);
    frontLight.position.set(0, 5, 10);
    frontLight.castShadow = true;
    scene.add(frontLight);
    
    const backLight = new THREE.DirectionalLight(0xe8e8ff, 0.4);
    backLight.position.set(0, 5, -10);
    scene.add(backLight);
    
    // Setup camera and renderer
    const width = containerRef.current.clientWidth;
    const height = containerRef.current.clientHeight;
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.set(0, 1.5, 6);
    cameraRef.current = camera;
    
    const renderer = new THREE.WebGLRenderer({ 
      antialias: true,
      alpha: true 
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;
    
    containerRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Create controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.enableZoom = true;
    controls.minDistance = 3;
    controls.maxDistance = 10;
    controls.autoRotate = false;
    controls.target.set(0, 1.2, 0);
    controlsRef.current = controls;
    
    loadAvatarModel(avatarStyle);
    
    // Animation loop
    const animate = () => {
      if (controlsRef.current) controlsRef.current.update();
      
      if (rendererRef.current && cameraRef.current && sceneRef.current) {
        rendererRef.current.render(sceneRef.current, cameraRef.current);
      }
      
      // Avatar animations
      if (modelRef.current) {
        if (isSpeaking) {
          applyLipMovement(lipOpenness);
          animateBody('speaking');
        } else if (isListening) {
          animateBody('listening');
        } else if (isThinking) {
          animateBody('thinking');
        } else {
          animateBody('idle');
        }
        
        applySentimentExpression(currentSentiment);
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
    
    // Define colors based on specifications
    const colors = {
      primary: 0xF5F5F5, // Soft white
      accent1: 0xA7EFFF, // Soft aqua blue
      accent2: 0xAEEBD9, // Mint green
      accent3: 0xFFD6C2, // Pastel peach
      faceplate: 0x1A2B4C, // Navy blue
      eyeGlow: 0x78D6FF, // Light blue
    };
    
    const avatarGroup = new THREE.Group();
    avatarGroup.name = 'avatar';
    
    // Create head with friendly features
    const headGroup = new THREE.Group();
    headGroup.name = 'head';
    
    // Main head - soft rounded shape
    const headGeometry = new THREE.SphereGeometry(0.8, 32, 32);
    const headMaterial = new THREE.MeshStandardMaterial({
      color: colors.primary,
      roughness: 0.7, // More matte finish
      metalness: 0.1,
    });
    const head = new THREE.Mesh(headGeometry, headMaterial);
    head.scale.set(1, 1.1, 0.9);
    head.castShadow = true;
    headGroup.add(head);
    
    // Friendly large eyes with soft glow
    const createEye = (x: number) => {
      const eyeGroup = new THREE.Group();
      
      // Eye base - large oval shape
      const eyeGeometry = new THREE.SphereGeometry(0.2, 32, 32);
      const eyeMaterial = new THREE.MeshStandardMaterial({
        color: colors.faceplate,
        roughness: 0.3,
        metalness: 0.5,
      });
      const eye = new THREE.Mesh(eyeGeometry, eyeMaterial);
      eye.scale.set(1.2, 1, 0.1);
      eyeGroup.add(eye);
      
      // Eye glow
      const glowGeometry = new THREE.SphereGeometry(0.15, 32, 32);
      const glowMaterial = new THREE.MeshStandardMaterial({
        color: colors.eyeGlow,
        emissive: colors.eyeGlow,
        emissiveIntensity: 0.5,
        roughness: 0.1,
        metalness: 0.9,
      });
      const glow = new THREE.Mesh(glowGeometry, glowMaterial);
      glow.scale.set(1.2, 1, 0.1);
      glow.position.z = 0.02;
      eyeGroup.add(glow);
      
      eyeGroup.position.set(x, 0.1, 0.7);
      return eyeGroup;
    };
    
    headGroup.add(createEye(-0.3));
    headGroup.add(createEye(0.3));
    
    // Gentle smile
    const smileGeometry = new THREE.TorusGeometry(0.2, 0.02, 16, 32, Math.PI);
    const smileMaterial = new THREE.MeshStandardMaterial({
      color: colors.accent3,
      roughness: 0.5,
      metalness: 0.3,
    });
    const smile = new THREE.Mesh(smileGeometry, smileMaterial);
    smile.rotation.x = Math.PI;
    smile.position.set(0, -0.2, 0.7);
    smile.name = 'mouth';
    headGroup.add(smile);
    
    // Create friendly body
    const bodyGroup = new THREE.Group();
    bodyGroup.name = 'body';
    
    // Main body - rounded cylinder
    const bodyGeometry = new THREE.CylinderGeometry(0.6, 0.7, 1.5, 32, 1, false);
    const bodyMaterial = new THREE.MeshStandardMaterial({
      color: colors.primary,
      roughness: 0.7,
      metalness: 0.2,
    });
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    body.position.y = -0.2;
    body.castShadow = true;
    bodyGroup.add(body);
    
    // Create chunky arms with mitten-like hands
    const createArm = (side: number) => {
      const armGroup = new THREE.Group();
      
      // Upper arm - chunky cylinder
      const upperArmGeometry = new THREE.CylinderGeometry(0.15, 0.13, 0.5, 16);
      const armMaterial = new THREE.MeshStandardMaterial({
        color: colors.accent1,
        roughness: 0.7,
        metalness: 0.2,
      });
      const upperArm = new THREE.Mesh(upperArmGeometry, armMaterial);
      upperArm.position.y = -0.25;
      armGroup.add(upperArm);
      
      // Mitten-like hand
      const handGeometry = new THREE.SphereGeometry(0.15, 16, 16);
      const handMaterial = new THREE.MeshStandardMaterial({
        color: colors.accent2,
        roughness: 0.8,
        metalness: 0.1,
      });
      const hand = new THREE.Mesh(handGeometry, handMaterial);
      hand.position.y = -0.5;
      hand.scale.set(1, 0.8, 0.6);
      armGroup.add(hand);
      
      armGroup.position.set(side * 0.8, 0.5, 0);
      armGroup.rotation.z = side * 0.2;
      return armGroup;
    };
    
    bodyGroup.add(createArm(-1));
    bodyGroup.add(createArm(1));
    
    // Create single stubby leg
    const legGroup = new THREE.Group();
    
    // Main leg - short cylinder
    const legGeometry = new THREE.CylinderGeometry(0.25, 0.3, 0.6, 16);
    const legMaterial = new THREE.MeshStandardMaterial({
      color: colors.accent1,
      roughness: 0.7,
      metalness: 0.2,
    });
    const leg = new THREE.Mesh(legGeometry, legMaterial);
    leg.position.y = -0.3;
    legGroup.add(leg);
    
    // Rounded foot
    const footGeometry = new THREE.SphereGeometry(0.3, 16, 16);
    const footMaterial = new THREE.MeshStandardMaterial({
      color: colors.accent2,
      roughness: 0.8,
      metalness: 0.1,
    });
    const foot = new THREE.Mesh(footGeometry, footMaterial);
    foot.position.y = -0.6;
    foot.scale.set(1, 0.4, 1);
    legGroup.add(foot);
    
    legGroup.position.set(0, -0.7, 0);
    bodyGroup.add(legGroup);
    
    // Position and assemble everything
    headGroup.position.set(0, 1.2, 0);
    bodyGroup.position.set(0, 0, 0);
    
    avatarGroup.add(headGroup);
    avatarGroup.add(bodyGroup);
    
    avatarGroup.position.set(0, 1.2, 0);
    avatarGroup.rotation.x = 0.1;
    
    sceneRef.current.add(avatarGroup);
    modelRef.current = avatarGroup;
    setAvatarLoaded(true);
  };
  
  const animateBody = (state: string) => {
    if (!modelRef.current) return;
    
    const head = modelRef.current.getObjectByName('head');
    const bodyGroup = modelRef.current.getObjectByName('body');
    
    if (!head || !bodyGroup) return;
    
    switch (state) {
      case 'speaking':
        head.rotation.y = Math.sin(Date.now() * 0.002) * 0.1;
        head.rotation.x = Math.sin(Date.now() * 0.003) * 0.05;
        bodyGroup.rotation.y = Math.sin(Date.now() * 0.001) * 0.05;
        break;
        
      case 'listening':
        head.rotation.y = Math.sin(Date.now() * 0.001) * 0.15;
        head.rotation.x = Math.cos(Date.now() * 0.002) * 0.05;
        bodyGroup.rotation.y = Math.sin(Date.now() * 0.001) * 0.03;
        break;
        
      case 'thinking':
        head.rotation.z = Math.sin(Date.now() * 0.001) * 0.05;
        head.rotation.x = Math.cos(Date.now() * 0.002) * 0.1;
        bodyGroup.rotation.y = Math.sin(Date.now() * 0.001) * 0.02;
        break;
        
      default: // idle
        head.rotation.y = Math.sin(Date.now() * 0.0005) * 0.05;
        head.rotation.x = Math.sin(Date.now() * 0.0007) * 0.03;
        bodyGroup.rotation.y = Math.sin(Date.now() * 0.0003) * 0.02;
    }
  };
  
  const applySentimentExpression = (sentiment: string) => {
    if (!modelRef.current) return;
    
    const mouth = modelRef.current.getObjectByName('mouth') as THREE.Mesh;
    if (!mouth) return;
    
    switch (sentiment) {
      case 'happy':
        mouth.scale.y = 0.8;
        mouth.position.y = -0.25;
        break;
      case 'sad':
        mouth.scale.y = -0.6;
        mouth.position.y = -0.35;
        break;
      case 'surprised':
        mouth.scale.x = 0.7;
        mouth.scale.y = 1.2;
        break;
      case 'angry':
        mouth.scale.y = -0.4;
        mouth.position.y = -0.3;
        break;
      default: // neutral
        mouth.scale.setScalar(1);
        mouth.position.y = -0.3;
    }
  };

  const applyLipMovement = (openness: number) => {
    if (!modelRef.current) return;
    
    const mouth = modelRef.current.getObjectByName('head')?.getObjectByName('mouth');
    if (mouth) {
      mouth.visible = true;
      (mouth as THREE.Mesh).scale.y = 1 + openness * 4;
      mouth.position.y = -0.3 - (openness * 0.1);
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
