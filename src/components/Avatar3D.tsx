
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
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const modelRef = useRef<THREE.Group | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const requestRef = useRef<number | null>(null);
  
  const [avatarLoaded, setAvatarLoaded] = useState(false);
  const [lipOpenness, setLipOpenness] = useState(0);
  
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
        // Apply animations based on speaking, listening, thinking states
        if (isSpeaking) {
          modelRef.current.rotation.y += 0.005;
          // Apply lip movement
          applyLipMovement(modelRef.current, lipOpenness);
        } else if (isListening) {
          modelRef.current.rotation.y += 0.002;
        } else if (isThinking) {
          modelRef.current.rotation.x = Math.sin(Date.now() * 0.001) * 0.1;
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
    
    switch (style) {
      case 'teacher':
        bodyGeometry = new THREE.CapsuleGeometry(1, 2, 10, 10);
        bodyMaterial = new THREE.MeshPhongMaterial({ color: 0x3f51b5 });
        break;
      case 'casual':
        bodyGeometry = new THREE.SphereGeometry(1.2, 32, 32);
        bodyMaterial = new THREE.MeshPhongMaterial({ color: 0x4caf50 });
        break;
      case 'professional':
        bodyGeometry = new THREE.BoxGeometry(1.8, 2.5, 1);
        bodyMaterial = new THREE.MeshPhongMaterial({ color: 0x607d8b });
        break;
      case 'friendly':
        bodyGeometry = new THREE.TorusGeometry(1, 0.4, 16, 64);
        bodyMaterial = new THREE.MeshPhongMaterial({ color: 0xff9800 });
        break;
      default:
        bodyGeometry = new THREE.CapsuleGeometry(1, 2, 10, 10);
        bodyMaterial = new THREE.MeshPhongMaterial({ color: 0x3f51b5 });
    }
    
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    avatarGroup.add(body);
    
    // Add eyes
    const eyeGeometry = new THREE.SphereGeometry(0.2, 32, 32);
    const eyeMaterial = new THREE.MeshPhongMaterial({ color: 0xffffff });
    
    const leftEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
    leftEye.position.set(-0.4, 0.5, 0.8);
    avatarGroup.add(leftEye);
    
    const rightEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
    rightEye.position.set(0.4, 0.5, 0.8);
    avatarGroup.add(rightEye);
    
    // Add pupils
    const pupilGeometry = new THREE.SphereGeometry(0.1, 32, 32);
    const pupilMaterial = new THREE.MeshPhongMaterial({ color: 0x000000 });
    
    const leftPupil = new THREE.Mesh(pupilGeometry, pupilMaterial);
    leftPupil.position.set(-0.4, 0.5, 0.9);
    avatarGroup.add(leftPupil);
    
    const rightPupil = new THREE.Mesh(pupilGeometry, pupilMaterial);
    rightPupil.position.set(0.4, 0.5, 0.9);
    avatarGroup.add(rightPupil);
    
    // Add mouth - will be animated
    const mouthGeometry = new THREE.BoxGeometry(0.8, 0.2, 0.1);
    const mouthMaterial = new THREE.MeshPhongMaterial({ color: 0x000000 });
    const mouth = new THREE.Mesh(mouthGeometry, mouthMaterial);
    mouth.position.set(0, 0, 0.9);
    mouth.name = "mouth"; // For targeted animations
    avatarGroup.add(mouth);
    
    // Add limbs for full body avatars
    if (style === 'teacher' || style === 'professional') {
      // Arms
      const armGeometry = new THREE.CapsuleGeometry(0.2, 1, 5, 5);
      const armMaterial = new THREE.MeshPhongMaterial({ color: bodyMaterial.color });
      
      const leftArm = new THREE.Mesh(armGeometry, armMaterial);
      leftArm.position.set(-1.2, 0, 0);
      leftArm.rotation.z = Math.PI / 2;
      leftArm.name = "leftArm";
      avatarGroup.add(leftArm);
      
      const rightArm = new THREE.Mesh(armGeometry, armMaterial);
      rightArm.position.set(1.2, 0, 0);
      rightArm.rotation.z = -Math.PI / 2;
      rightArm.name = "rightArm";
      avatarGroup.add(rightArm);
      
      // Legs
      const legGeometry = new THREE.CapsuleGeometry(0.25, 1.2, 5, 5);
      const legMaterial = new THREE.MeshPhongMaterial({ color: bodyMaterial.color });
      
      const leftLeg = new THREE.Mesh(legGeometry, legMaterial);
      leftLeg.position.set(-0.5, -1.5, 0);
      leftLeg.name = "leftLeg";
      avatarGroup.add(leftLeg);
      
      const rightLeg = new THREE.Mesh(legGeometry, legMaterial);
      rightLeg.position.set(0.5, -1.5, 0);
      rightLeg.name = "rightLeg";
      avatarGroup.add(rightLeg);
    }
    
    // Add avatar to scene
    avatarGroup.position.set(0, 0, 0);
    sceneRef.current.add(avatarGroup);
    modelRef.current = avatarGroup;
    setAvatarLoaded(true);
  };
  
  // Apply lip movement for speaking animation
  const applyLipMovement = (model: THREE.Group, openness: number) => {
    const mouth = model.children.find(child => child.name === "mouth");
    if (mouth) {
      (mouth as THREE.Mesh).scale.y = 1 + openness * 2;
      (mouth as THREE.Mesh).position.y = 0 - (openness * 0.15);
    }
  };
  
  // Apply sentiment-based animations
  const applySentimentAnimation = (model: THREE.Group, sentiment: string = 'neutral') => {
    switch (sentiment) {
      case 'happy':
        model.scale.y = 1 + Math.sin(Date.now() * 0.005) * 0.05;
        break;
      case 'sad':
        model.rotation.x = Math.sin(Date.now() * 0.001) * 0.1 - 0.1;
        break;
      case 'surprised':
        model.scale.x = 1 + Math.sin(Date.now() * 0.01) * 0.1;
        model.scale.y = 1 + Math.sin(Date.now() * 0.01) * 0.1;
        break;
      case 'angry':
        model.rotation.z = Math.sin(Date.now() * 0.003) * 0.1;
        break;
      default:
        // Return to normal
        model.rotation.x *= 0.95;
        model.rotation.z *= 0.95;
        model.scale.x += (1 - model.scale.x) * 0.1;
        model.scale.y += (1 - model.scale.y) * 0.1;
    }
  };
  
  // Update avatar style when it changes
  useEffect(() => {
    if (sceneRef.current) {
      loadAvatarModel(avatarStyle);
    }
  }, [avatarStyle]);
  
  // Update lip sync animation when speaking
  useEffect(() => {
    if (isSpeaking) {
      // Clear any existing interval
      if (lipSyncInterval.current) {
        clearInterval(lipSyncInterval.current);
      }
      
      // Create new lip sync interval
      lipSyncInterval.current = setInterval(() => {
        speechPatternIndex.current = (speechPatternIndex.current + 1) % speechPattern.current.length;
        const openness = speechPattern.current[speechPatternIndex.current] * speechIntensity;
        setLipOpenness(openness);
      }, 100);
      
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
  }, [isSpeaking, speechIntensity]);

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
