
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
    scene.background = new THREE.Color(0x121212);
    sceneRef.current = scene;
    
    // Add lighting
    const ambientLight = new THREE.AmbientLight(0x8E9196, 1.2);
    scene.add(ambientLight);
    
    const frontLight = new THREE.DirectionalLight(0xFFFFFF, 1.5);
    frontLight.position.set(0, 5, 10);
    scene.add(frontLight);
    
    const backLight = new THREE.DirectionalLight(0x9b87f5, 1);
    backLight.position.set(0, 5, -10);
    scene.add(backLight);
    
    const leftLight = new THREE.DirectionalLight(0x33C3F0, 0.8);
    leftLight.position.set(-10, 2, 0);
    scene.add(leftLight);
    
    const rightLight = new THREE.DirectionalLight(0xD946EF, 0.8);
    rightLight.position.set(10, 2, 0);
    scene.add(rightLight);
    
    // Setup camera
    const width = containerRef.current.clientWidth;
    const height = containerRef.current.clientHeight;
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.set(0, 1.5, 6);
    cameraRef.current = camera;
    
    // Setup renderer
    const renderer = new THREE.WebGLRenderer({ 
      antialias: true, 
      alpha: true 
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.outputEncoding = THREE.sRGBEncoding;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;
    
    containerRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;
    
    // Setup controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.enableZoom = true;
    controls.minDistance = 3;
    controls.maxDistance = 10;
    controls.autoRotate = false;
    controls.target.set(0, 1.2, 0);
    controlsRef.current = controls;
    
    // Create avatar
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
          
          if (animationState === 'speaking') {
            const headPart = modelRef.current.getObjectByName('head');
            if (headPart) {
              headPart.rotation.y = Math.sin(Date.now() * 0.001) * 0.15;
              headPart.rotation.x = Math.sin(Date.now() * 0.002) * 0.05;
            }
            animateGestures('speaking');
          }
        } else if (isListening) {
          const headPart = modelRef.current.getObjectByName('head');
          if (headPart) {
            headPart.rotation.y = Math.sin(Date.now() * 0.0008) * 0.2;
            headPart.rotation.x = Math.sin(Date.now() * 0.001) * 0.1;
          }
          animateGestures('listening');
        } else if (isThinking) {
          const headPart = modelRef.current.getObjectByName('head');
          if (headPart) {
            headPart.rotation.x = Math.sin(Date.now() * 0.001) * 0.15;
            headPart.rotation.z = Math.sin(Date.now() * 0.0007) * 0.05;
          }
          animateGestures('thinking');
        } else {
          const headPart = modelRef.current.getObjectByName('head');
          if (headPart) {
            headPart.rotation.y = Math.sin(Date.now() * 0.0005) * 0.05;
            headPart.rotation.x = Math.sin(Date.now() * 0.0007) * 0.03;
          }
          animateGestures('idle');
        }
        
        applySentimentAnimation(currentSentiment);
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
    
    // Clear previous model
    if (modelRef.current) {
      sceneRef.current.remove(modelRef.current);
      modelRef.current = null;
    }
    
    // Define colors based on style
    let mainColor, accentColor, eyeColor, screenColor;
    
    switch (style) {
      case 'teacher':
        mainColor = 0x33C3F0; // Sky blue
        accentColor = 0x8B5CF6; // Vivid purple
        eyeColor = 0xF97316; // Bright orange
        screenColor = 0x1A1F2C; // Dark screen
        break;
      case 'casual':
        mainColor = 0xD946EF; // Magenta pink
        accentColor = 0x0EA5E9; // Ocean blue
        eyeColor = 0x40FFFF; // Cyan eyes
        screenColor = 0x222222; // Dark gray
        break;
      case 'professional':
        mainColor = 0x403E43; // Charcoal gray
        accentColor = 0x1EAEDB; // Bright blue
        eyeColor = 0xFFFFFF; // White eyes
        screenColor = 0x111111; // Black screen
        break;
      case 'friendly':
        mainColor = 0xF97316; // Bright orange
        accentColor = 0x9b87f5; // Primary purple
        eyeColor = 0xD3E4FD; // Soft blue
        screenColor = 0x221F26; // Dark charcoal
        break;
      default:
        mainColor = 0x33C3F0; // Sky blue
        accentColor = 0x8B5CF6; // Vivid purple
        eyeColor = 0xF97316; // Bright orange
        screenColor = 0x1A1F2C; // Dark screen
    }
    
    // Create robot avatar group
    const avatarGroup = new THREE.Group();
    avatarGroup.name = 'avatar';
    
    // Create head
    const headGroup = new THREE.Group();
    headGroup.name = 'head';
    
    // Main head shape (slightly elongated sphere)
    const headGeometry = new THREE.SphereGeometry(1.2, 32, 32);
    const headMaterial = new THREE.MeshStandardMaterial({ 
      color: mainColor,
      metalness: 0.7,
      roughness: 0.3,
      envMapIntensity: 1,
    });
    const head = new THREE.Mesh(headGeometry, headMaterial);
    head.scale.set(1, 1.2, 0.8);
    head.castShadow = true;
    head.receiveShadow = true;
    headGroup.add(head);
    
    // Face screen/display
    const faceGeometry = new THREE.SphereGeometry(1.15, 32, 32);
    const faceMaterial = new THREE.MeshStandardMaterial({ 
      color: screenColor,
      emissive: screenColor,
      emissiveIntensity: 0.2,
      metalness: 0.2,
      roughness: 0.5
    });
    const face = new THREE.Mesh(faceGeometry, faceMaterial);
    face.position.set(0, 0, 0.6);
    face.scale.set(0.9, 1.05, 0.2);
    face.castShadow = false;
    face.receiveShadow = true;
    face.name = 'face';
    headGroup.add(face);
    
    // Create eyes
    const eyeGeometry = new THREE.SphereGeometry(0.22, 32, 32);
    const eyeMaterial = new THREE.MeshStandardMaterial({ 
      color: eyeColor, 
      emissive: eyeColor,
      emissiveIntensity: 0.8,
      metalness: 0.3,
      roughness: 0.3
    });
    
    // Left eye
    const leftEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
    leftEye.position.set(-0.45, 0.2, 0.8);
    leftEye.scale.set(1, 1.4, 0.2);
    leftEye.name = 'leftEye';
    headGroup.add(leftEye);
    
    // Right eye
    const rightEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
    rightEye.position.set(0.45, 0.2, 0.8);
    rightEye.scale.set(1, 1.4, 0.2);
    rightEye.name = 'rightEye';
    headGroup.add(rightEye);
    
    // Mouth
    const mouthGeometry = new THREE.TorusGeometry(0.3, 0.05, 16, 32, Math.PI);
    const mouthMaterial = new THREE.MeshStandardMaterial({ 
      color: eyeColor,
      emissive: eyeColor,
      emissiveIntensity: 0.5
    });
    const mouth = new THREE.Mesh(mouthGeometry, mouthMaterial);
    mouth.position.set(0, -0.3, 0.8);
    mouth.rotation.x = Math.PI;
    mouth.name = 'mouth';
    mouth.visible = true;
    headGroup.add(mouth);
    
    // Antenna
    const antennaGeometry = new THREE.CylinderGeometry(0.03, 0.03, 0.6, 16);
    const antennaMaterial = new THREE.MeshStandardMaterial({ 
      color: accentColor,
      metalness: 0.8,
      roughness: 0.2
    });
    const antenna = new THREE.Mesh(antennaGeometry, antennaMaterial);
    antenna.position.set(0, 1.2, 0);
    
    const antennaBallGeometry = new THREE.SphereGeometry(0.08, 16, 16);
    const antennaBall = new THREE.Mesh(antennaBallGeometry, antennaMaterial);
    antennaBall.position.set(0, 1.5, 0);
    
    headGroup.add(antenna);
    headGroup.add(antennaBall);
    headGroup.position.set(0, 1.4, 0);
    
    // Add head to avatar
    avatarGroup.add(headGroup);
    
    // Create body
    const bodyGroup = new THREE.Group();
    bodyGroup.name = 'body';
    
    // Main body - rounded cylinder
    const bodyGeometry = new THREE.CylinderGeometry(0.9, 1.1, 2, 32, 1, false);
    const bodyMaterial = new THREE.MeshStandardMaterial({ 
      color: mainColor,
      metalness: 0.7,
      roughness: 0.3
    });
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    body.position.set(0, -0.2, 0);
    body.castShadow = true;
    body.receiveShadow = true;
    bodyGroup.add(body);
    
    // Chest panel
    const panelGeometry = new THREE.RoundedBoxGeometry(1.4, 1.2, 0.1, 10, 0.1);
    const panelMaterial = new THREE.MeshStandardMaterial({ 
      color: accentColor,
      emissive: accentColor,
      emissiveIntensity: 0.2,
      metalness: 0.5,
      roughness: 0.3
    });
    const panel = new THREE.Mesh(panelGeometry, panelMaterial);
    panel.position.set(0, -0.2, 0.86);
    panel.castShadow = true;
    panel.receiveShadow = true;
    bodyGroup.add(panel);
    
    // Add details to panel
    for (let i = 0; i < 3; i++) {
      const buttonGeometry = new THREE.CircleGeometry(0.1, 32);
      const buttonMaterial = new THREE.MeshStandardMaterial({ 
        color: eyeColor,
        emissive: eyeColor,
        emissiveIntensity: 0.5
      });
      const button = new THREE.Mesh(buttonGeometry, buttonMaterial);
      button.position.set(0, -0.1 - (i * 0.3), 0.92);
      button.rotation.x = -Math.PI / 2;
      bodyGroup.add(button);
    }
    
    // Arms
    const createArm = (side: 'left' | 'right') => {
      const armGroup = new THREE.Group();
      armGroup.name = `${side}Arm`;
      
      // Upper arm
      const upperArmGeometry = new THREE.CylinderGeometry(0.15, 0.15, 0.8, 16);
      const armMaterial = new THREE.MeshStandardMaterial({ 
        color: mainColor,
        metalness: 0.7,
        roughness: 0.3
      });
      const upperArm = new THREE.Mesh(upperArmGeometry, armMaterial);
      upperArm.position.y = 0.2;
      upperArm.castShadow = true;
      upperArm.receiveShadow = true;
      armGroup.add(upperArm);
      
      // Elbow joint
      const elbowGeometry = new THREE.SphereGeometry(0.17, 16, 16);
      const elbow = new THREE.Mesh(elbowGeometry, armMaterial);
      elbow.position.y = -0.2;
      elbow.castShadow = true;
      elbow.receiveShadow = true;
      armGroup.add(elbow);
      
      // Lower arm
      const lowerArmGeometry = new THREE.CylinderGeometry(0.14, 0.13, 0.7, 16);
      const lowerArm = new THREE.Mesh(lowerArmGeometry, armMaterial);
      lowerArm.position.y = -0.6;
      lowerArm.castShadow = true;
      lowerArm.receiveShadow = true;
      armGroup.add(lowerArm);
      
      // Hand
      const handGeometry = new THREE.SphereGeometry(0.18, 16, 16);
      const handMaterial = new THREE.MeshStandardMaterial({ 
        color: accentColor,
        metalness: 0.6,
        roughness: 0.4
      });
      const hand = new THREE.Mesh(handGeometry, handMaterial);
      hand.position.y = -1;
      hand.castShadow = true;
      hand.receiveShadow = true;
      hand.name = `${side}Hand`;
      armGroup.add(hand);
      
      // Set arm position and orientation based on side
      armGroup.rotation.z = side === 'left' ? Math.PI / 6 : -Math.PI / 6;
      armGroup.position.set(side === 'left' ? -1.2 : 1.2, 0.4, 0);
      
      return armGroup;
    };
    
    // Add arms to body
    bodyGroup.add(createArm('left'));
    bodyGroup.add(createArm('right'));
    
    // Base
    const baseGeometry = new THREE.CylinderGeometry(1.2, 1.2, 0.3, 32);
    const baseMaterial = new THREE.MeshStandardMaterial({ 
      color: accentColor,
      metalness: 0.8,
      roughness: 0.2
    });
    const base = new THREE.Mesh(baseGeometry, baseMaterial);
    base.position.set(0, -1.8, 0);
    base.castShadow = true;
    base.receiveShadow = true;
    bodyGroup.add(base);
    
    // Add body to avatar
    avatarGroup.add(bodyGroup);
    
    // Position and add the full avatar to scene
    avatarGroup.position.set(0, 0.8, 0);
    avatarGroup.rotation.x = 0.1; // Slight forward tilt
    
    sceneRef.current.add(avatarGroup);
    modelRef.current = avatarGroup;
    setAvatarLoaded(true);
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
  
  const animateGestures = (state: string) => {
    if (!modelRef.current) return;
    
    const leftArm = modelRef.current.getObjectByName('body')?.getObjectByName('leftArm');
    const rightArm = modelRef.current.getObjectByName('body')?.getObjectByName('rightArm');
    
    if (!leftArm || !rightArm) return;
    
    switch (state) {
      case 'speaking':
        leftArm.rotation.z = Math.sin(Date.now() * 0.002) * 0.3 + Math.PI / 6;
        rightArm.rotation.z = -Math.sin(Date.now() * 0.002) * 0.3 - Math.PI / 6;
        
        // Move hands based on arm rotation
        const leftHand = leftArm.getObjectByName('leftHand');
        const rightHand = rightArm.getObjectByName('rightHand');
        
        if (leftHand && rightHand) {
          leftHand.position.x = Math.sin(Date.now() * 0.003) * 0.1;
          rightHand.position.x = -Math.sin(Date.now() * 0.003) * 0.1;
        }
        break;
        
      case 'listening':
        leftArm.rotation.z = Math.PI / 4.5;
        rightArm.rotation.z = -Math.PI / 4.5;
        
        // Position hands attentively
        const leftListenHand = leftArm.getObjectByName('leftHand');
        const rightListenHand = rightArm.getObjectByName('rightHand');
        
        if (leftListenHand && rightListenHand) {
          leftListenHand.position.set(0, -1, 0.2 + Math.sin(Date.now() * 0.003) * 0.05);
          rightListenHand.position.set(0, -1, 0.2 + Math.sin(Date.now() * 0.003) * 0.05);
        }
        break;
        
      case 'thinking':
        // Thinking pose with one hand near head
        rightArm.rotation.z = -Math.PI / 2.5;
        rightArm.rotation.y = -Math.PI / 8;
        rightArm.rotation.x = Math.PI / 6;
        
        const rightThinkHand = rightArm.getObjectByName('rightHand');
        if (rightThinkHand) {
          rightThinkHand.position.set(0.2, -0.8, 0.3);
        }
        
        leftArm.rotation.z = Math.PI / 4;
        leftArm.rotation.x = -Math.PI / 16;
        
        const leftThinkHand = leftArm.getObjectByName('leftHand');
        if (leftThinkHand) {
          leftThinkHand.position.set(-0.1, -1, 0.2);
        }
        break;
        
      default: // idle
        leftArm.rotation.z = Math.PI / 6 + Math.sin(Date.now() * 0.001) * 0.05;
        rightArm.rotation.z = -Math.PI / 6 - Math.sin(Date.now() * 0.001) * 0.05;
        leftArm.rotation.x = 0;
        rightArm.rotation.x = 0;
        leftArm.rotation.y = 0;
        rightArm.rotation.y = 0;
        
        // Reset hand positions
        const leftIdleHand = leftArm.getObjectByName('leftHand');
        const rightIdleHand = rightArm.getObjectByName('rightHand');
        
        if (leftIdleHand && rightIdleHand) {
          leftIdleHand.position.set(0, -1, 0);
          rightIdleHand.position.set(0, -1, 0);
        }
        break;
    }
  };
  
  const applySentimentAnimation = (sentiment: string = 'neutral') => {
    if (!modelRef.current) return;
    
    const headGroup = modelRef.current.getObjectByName('head');
    if (!headGroup) return;
    
    const leftEye = headGroup.getObjectByName('leftEye');
    const rightEye = headGroup.getObjectByName('rightEye');
    const mouth = headGroup.getObjectByName('mouth');
    
    if (!leftEye || !rightEye || !mouth) return;
    
    switch (sentiment) {
      case 'happy':
        (mouth as THREE.Mesh).scale.x = 1.5;
        (mouth as THREE.Mesh).scale.y = 0.8;
        mouth.position.y = -0.35;
        
        (leftEye as THREE.Mesh).scale.y = 0.8;
        (rightEye as THREE.Mesh).scale.y = 0.8;
        
        headGroup.scale.y = 1 + Math.sin(Date.now() * 0.005) * 0.03;
        break;
        
      case 'sad':
        (mouth as THREE.Mesh).scale.x = 0.8;
        (mouth as THREE.Mesh).scale.y = 0.6;
        mouth.position.y = -0.4;
        
        (leftEye as THREE.Mesh).scale.y = 0.7;
        (rightEye as THREE.Mesh).scale.y = 0.7;
        
        headGroup.rotation.x = Math.sin(Date.now() * 0.001) * 0.05 - 0.1;
        break;
        
      case 'surprised':
        (mouth as THREE.Mesh).scale.x = 0.7;
        (mouth as THREE.Mesh).scale.y = 2;
        
        (leftEye as THREE.Mesh).scale.x = 1.3;
        (leftEye as THREE.Mesh).scale.y = 1.3;
        (rightEye as THREE.Mesh).scale.x = 1.3;
        (rightEye as THREE.Mesh).scale.y = 1.3;
        
        headGroup.position.z = Math.sin(Date.now() * 0.005) * 0.2;
        break;
        
      case 'angry':
        (mouth as THREE.Mesh).scale.x = 0.8;
        (mouth as THREE.Mesh).scale.y = 0.4;
        
        (leftEye as THREE.Mesh).scale.y = 0.6;
        (rightEye as THREE.Mesh).scale.y = 0.6;
        (leftEye as THREE.Mesh).rotation.z = 0.2;
        (rightEye as THREE.Mesh).rotation.z = -0.2;
        
        headGroup.rotation.z = Math.sin(Date.now() * 0.003) * 0.05;
        break;
        
      default: // neutral
        (mouth as THREE.Mesh).scale.x = 1;
        (mouth as THREE.Mesh).scale.y = 1;
        mouth.position.y = -0.3;
        
        (leftEye as THREE.Mesh).scale.x = 1;
        (leftEye as THREE.Mesh).scale.y = 1.4;
        (rightEye as THREE.Mesh).scale.x = 1;
        (rightEye as THREE.Mesh).scale.y = 1.4;
        (leftEye as THREE.Mesh).rotation.z = 0;
        (rightEye as THREE.Mesh).rotation.z = 0;
        
        headGroup.rotation.x *= 0.95;
        headGroup.rotation.z *= 0.95;
        headGroup.scale.x += (1 - headGroup.scale.x) * 0.1;
        headGroup.scale.y += (1 - headGroup.scale.y) * 0.1;
        headGroup.position.z *= 0.9;
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

// Add this helper class for rounded box geometry - THREE.js doesn't include it by default
class RoundedBoxGeometry extends THREE.BoxGeometry {
  constructor(
    width = 1, 
    height = 1, 
    depth = 1, 
    segments = 4, 
    radius = 0.1
  ) {
    super(width, height, depth, segments, segments, segments);
    
    // Create rounded edges by moving vertices
    const position = this.attributes.position;
    const normal = this.attributes.normal;
    
    const halfWidth = width / 2;
    const halfHeight = height / 2;
    const halfDepth = depth / 2;
    
    // Don't exceed half dimensions
    radius = Math.min(radius, Math.min(halfWidth, Math.min(halfHeight, halfDepth)));
    
    const positions = [];
    const normals = [];
    
    for (let i = 0; i < position.count; i++) {
      const x = position.getX(i);
      const y = position.getY(i);
      const z = position.getZ(i);
      
      // Calculate distance to center
      const distX = Math.abs(x) - (halfWidth - radius);
      const distY = Math.abs(y) - (halfHeight - radius);
      const distZ = Math.abs(z) - (halfDepth - radius);
      
      // Only move vertices that are on corners
      if (distX > 0 && distY > 0 && distZ > 0) {
        const dirX = Math.sign(x);
        const dirY = Math.sign(y);
        const dirZ = Math.sign(z);
        
        // Calculate new position
        const newX = dirX * (halfWidth - radius + distX / Math.sqrt(distX * distX + distY * distY + distZ * distZ) * radius);
        const newY = dirY * (halfHeight - radius + distY / Math.sqrt(distX * distX + distY * distY + distZ * distZ) * radius);
        const newZ = dirZ * (halfDepth - radius + distZ / Math.sqrt(distX * distX + distY * distY + distZ * distZ) * radius);
        
        positions.push(newX, newY, newZ);
        
        // Calculate new normal
        const nx = (newX - dirX * (halfWidth - radius)) / radius;
        const ny = (newY - dirY * (halfHeight - radius)) / radius;
        const nz = (newZ - dirZ * (halfDepth - radius)) / radius;
        const length = Math.sqrt(nx * nx + ny * ny + nz * nz);
        
        normals.push(nx / length, ny / length, nz / length);
      } else {
        positions.push(x, y, z);
        normals.push(normal.getX(i), normal.getY(i), normal.getZ(i));
      }
    }
    
    // Update geometry
    for (let i = 0; i < position.count; i++) {
      position.setXYZ(i, positions[i * 3], positions[i * 3 + 1], positions[i * 3 + 2]);
      normal.setXYZ(i, normals[i * 3], normals[i * 3 + 1], normals[i * 3 + 2]);
    }
    
    position.needsUpdate = true;
    normal.needsUpdate = true;
  }
}

// Add to THREE namespace for easier usage
THREE.RoundedBoxGeometry = RoundedBoxGeometry;

// Extend THREE namespace with the new class
declare global {
  namespace THREE {
    class RoundedBoxGeometry extends BoxGeometry {
      constructor(
        width?: number,
        height?: number,
        depth?: number,
        segments?: number,
        radius?: number
      );
    }
  }
}

export default Avatar3D;
