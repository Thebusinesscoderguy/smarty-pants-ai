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
    
    // Softer lighting setup
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
    scene.add(ambientLight);
    
    const frontLight = new THREE.DirectionalLight(0xffffff, 0.8);
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
    
    // Define softer colors based on style
    let mainColor, accentColor, faceColor;
    
    switch (style) {
      case 'teacher':
        mainColor = 0xD3E4FD; // Soft blue
        accentColor = 0xF2FCE2; // Soft green
        faceColor = 0xFDE1D3; // Soft peach
        break;
      case 'casual':
        mainColor = 0xFEF7CD; // Soft yellow
        accentColor = 0xFEC6A1; // Soft orange
        faceColor = 0xFDE1D3; // Soft peach
        break;
      case 'professional':
        mainColor = 0xE5DEFF; // Soft purple
        accentColor = 0xF1F0FB; // Soft gray
        faceColor = 0xFDE1D3; // Soft peach
        break;
      case 'friendly':
        mainColor = 0xFEC6A1; // Soft orange
        accentColor = 0xFEF7CD; // Soft yellow
        faceColor = 0xFDE1D3; // Soft peach
        break;
      default:
        mainColor = 0xD3E4FD;
        accentColor = 0xF2FCE2;
        faceColor = 0xFDE1D3;
    }
    
    const avatarGroup = new THREE.Group();
    avatarGroup.name = 'avatar';
    
    // Create head with softer features
    const headGroup = new THREE.Group();
    headGroup.name = 'head';
    
    // Main head - smoother sphere
    const headGeometry = new THREE.SphereGeometry(0.8, 32, 32);
    const headMaterial = new THREE.MeshStandardMaterial({
      color: faceColor,
      roughness: 0.3,
      metalness: 0.1,
    });
    const head = new THREE.Mesh(headGeometry, headMaterial);
    head.scale.set(1, 1.1, 0.9);
    head.castShadow = true;
    headGroup.add(head);
    
    // Friendly eyes
    const createEye = (x: number) => {
      const eyeGroup = new THREE.Group();
      
      // White of the eye
      const eyeWhiteGeometry = new THREE.SphereGeometry(0.15, 32, 32);
      const eyeWhiteMaterial = new THREE.MeshStandardMaterial({
        color: 0xffffff,
        roughness: 0.2,
      });
      const eyeWhite = new THREE.Mesh(eyeWhiteGeometry, eyeWhiteMaterial);
      eyeWhite.scale.set(1, 1, 0.3);
      eyeGroup.add(eyeWhite);
      
      // Iris - larger and more friendly
      const irisGeometry = new THREE.SphereGeometry(0.08, 32, 32);
      const irisMaterial = new THREE.MeshStandardMaterial({
        color: mainColor,
        roughness: 0.2,
        metalness: 0.3,
      });
      const iris = new THREE.Mesh(irisGeometry, irisMaterial);
      iris.position.z = 0.12;
      eyeGroup.add(iris);
      
      // Pupil - smaller and rounder
      const pupilGeometry = new THREE.SphereGeometry(0.04, 32, 32);
      const pupilMaterial = new THREE.MeshStandardMaterial({
        color: 0x000000,
        roughness: 0.1,
      });
      const pupil = new THREE.Mesh(pupilGeometry, pupilMaterial);
      pupil.position.z = 0.15;
      eyeGroup.add(pupil);
      
      eyeGroup.position.set(x, 0.1, 0.6);
      return eyeGroup;
    };
    
    headGroup.add(createEye(-0.25));
    headGroup.add(createEye(0.25));
    
    // Friendlier nose
    const noseGeometry = new THREE.SphereGeometry(0.08, 32, 32);
    const noseMaterial = new THREE.MeshStandardMaterial({
      color: accentColor,
      roughness: 0.4,
    });
    const nose = new THREE.Mesh(noseGeometry, noseMaterial);
    nose.position.set(0, -0.1, 0.7);
    nose.scale.set(1, 1.2, 0.6);
    headGroup.add(nose);
    
    // Friendly smile
    const createSmile = () => {
      const smileGroup = new THREE.Group();
      const smileGeometry = new THREE.TorusGeometry(0.2, 0.04, 16, 32, Math.PI);
      const smileMaterial = new THREE.MeshStandardMaterial({
        color: 0xff9999,
        roughness: 0.3,
      });
      const smile = new THREE.Mesh(smileGeometry, smileMaterial);
      smile.rotation.x = Math.PI;
      smile.name = 'mouth';
      smileGroup.add(smile);
      smileGroup.position.set(0, -0.3, 0.6);
      return smileGroup;
    };
    
    headGroup.add(createSmile());
    
    // Create body
    const bodyGroup = new THREE.Group();
    bodyGroup.name = 'body';
    
    // Main body - rounded cylinder
    const bodyGeometry = new THREE.CylinderGeometry(0.6, 0.7, 1.8, 32);
    const bodyMaterial = new THREE.MeshStandardMaterial({
      color: mainColor,
      roughness: 0.3,
      metalness: 0.2,
    });
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    body.position.y = -0.2;
    body.castShadow = true;
    bodyGroup.add(body);
    
    // Create natural-looking arms
    const createArm = (side: number) => {
      const armGroup = new THREE.Group();
      
      // Upper arm - slightly thicker
      const upperArmGeometry = new THREE.CylinderGeometry(0.12, 0.1, 0.6, 32);
      const armMaterial = new THREE.MeshStandardMaterial({
        color: mainColor,
        roughness: 0.3,
        metalness: 0.2,
      });
      const upperArm = new THREE.Mesh(upperArmGeometry, armMaterial);
      upperArm.position.y = -0.3;
      armGroup.add(upperArm);
      
      // Elbow joint - smoother transition
      const elbowGeometry = new THREE.SphereGeometry(0.11, 32, 32);
      const elbow = new THREE.Mesh(elbowGeometry, armMaterial);
      elbow.position.y = -0.6;
      armGroup.add(elbow);
      
      // Forearm - natural taper
      const forearmGeometry = new THREE.CylinderGeometry(0.09, 0.08, 0.6, 32);
      const forearm = new THREE.Mesh(forearmGeometry, armMaterial);
      forearm.position.y = -0.9;
      armGroup.add(forearm);
      
      // Hand - more natural shape
      const handGeometry = new THREE.SphereGeometry(0.11, 32, 32);
      const handMaterial = new THREE.MeshStandardMaterial({
        color: faceColor,
        roughness: 0.3,
      });
      const hand = new THREE.Mesh(handGeometry, handMaterial);
      hand.position.y = -1.2;
      hand.scale.set(1, 0.8, 0.6);
      armGroup.add(hand);
      
      // Position and rotate arm
      armGroup.position.set(side * 0.8, 0.7, 0);
      armGroup.rotation.z = side * 0.2;
      return armGroup;
    };
    
    bodyGroup.add(createArm(-1)); // Left arm
    bodyGroup.add(createArm(1));  // Right arm
    
    // Create legs
    const createLeg = (side: number) => {
      const legGroup = new THREE.Group();
      
      // Upper leg
      const upperLegGeometry = new THREE.CylinderGeometry(0.15, 0.13, 0.8, 32);
      const legMaterial = new THREE.MeshStandardMaterial({
        color: mainColor,
        roughness: 0.3,
        metalness: 0.2,
      });
      const upperLeg = new THREE.Mesh(upperLegGeometry, legMaterial);
      upperLeg.position.y = -0.4;
      legGroup.add(upperLeg);
      
      // Knee
      const kneeGeometry = new THREE.SphereGeometry(0.14, 32, 32);
      const knee = new THREE.Mesh(kneeGeometry, legMaterial);
      knee.position.y = -0.8;
      legGroup.add(knee);
      
      // Lower leg
      const lowerLegGeometry = new THREE.CylinderGeometry(0.12, 0.1, 0.8, 32);
      const lowerLeg = new THREE.Mesh(lowerLegGeometry, legMaterial);
      lowerLeg.position.y = -1.2;
      legGroup.add(lowerLeg);
      
      // Foot
      const footGeometry = new THREE.SphereGeometry(0.15, 32, 32);
      const footMaterial = new THREE.MeshStandardMaterial({
        color: accentColor,
        roughness: 0.3,
      });
      const foot = new THREE.Mesh(footGeometry, footMaterial);
      foot.position.y = -1.6;
      foot.scale.set(1.2, 0.4, 1.5);
      legGroup.add(foot);
      
      legGroup.position.set(side * 0.3, -0.9, 0);
      return legGroup;
    };
    
    bodyGroup.add(createLeg(-1)); // Left leg
    bodyGroup.add(createLeg(1));  // Right leg
    
    // Position everything
    headGroup.position.set(0, 1.5, 0);
    bodyGroup.position.set(0, 0, 0);
    
    avatarGroup.add(headGroup);
    avatarGroup.add(bodyGroup);
    
    // Final positioning
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

// Custom function to create a rounded box geometry
function createRoundedBoxGeometry(
  width = 1, 
  height = 1, 
  depth = 1, 
  segments = 4, 
  radius = 0.1
) {
  // Create a base box geometry
  const geometry = new THREE.BoxGeometry(width, height, depth, segments, segments, segments);
  
  // Create rounded edges by moving vertices
  const position = geometry.attributes.position;
  const normal = geometry.attributes.normal;
  
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
  
  return geometry;
}

export default Avatar3D;
