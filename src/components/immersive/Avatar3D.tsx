
import React, { useRef, useEffect } from 'react';
import * as THREE from 'three';

interface Avatar3DProps {
  isSpeaking: boolean;
  isListening: boolean;
  isThinking: boolean;
  avatarStyle?: 'teacher' | 'casual' | 'professional' | 'friendly';
  sentiment?: 'neutral' | 'happy' | 'sad' | 'surprised' | 'angry';
}

export const Avatar3D: React.FC<Avatar3DProps> = ({
  isSpeaking,
  isListening,
  isThinking,
  avatarStyle = 'teacher',
  sentiment = 'neutral'
}) => {
  const avatarRef = useRef<THREE.Group | null>(null);

  // Create the avatar model
  const createAvatarModel = () => {
    const avatarGroup = new THREE.Group();
    
    // Define colors
    const colors = {
      primary: 0xF5F5F5, // Soft white
      accent: 0x4287f5,  // Soft blue
      eye: 0x1A2B4C,     // Navy blue
      eyeGlow: 0x78D6FF, // Light blue
    };
    
    // Create head
    const headGeometry = new THREE.SphereGeometry(0.5, 32, 32);
    const headMaterial = new THREE.MeshStandardMaterial({
      color: colors.primary,
      roughness: 0.7,
      metalness: 0.2,
    });
    const head = new THREE.Mesh(headGeometry, headMaterial);
    head.position.y = 0.5;
    avatarGroup.add(head);
    
    // Create eyes
    const createEye = (x: number) => {
      const eyeGroup = new THREE.Group();
      
      const eyeGeometry = new THREE.SphereGeometry(0.1, 32, 32);
      const eyeMaterial = new THREE.MeshStandardMaterial({
        color: colors.eye,
        roughness: 0.3,
        metalness: 0.5,
      });
      const eye = new THREE.Mesh(eyeGeometry, eyeMaterial);
      eyeGroup.add(eye);
      
      const glowGeometry = new THREE.SphereGeometry(0.05, 32, 32);
      const glowMaterial = new THREE.MeshStandardMaterial({
        color: colors.eyeGlow,
        emissive: colors.eyeGlow,
        emissiveIntensity: 0.5,
      });
      const glow = new THREE.Mesh(glowGeometry, glowMaterial);
      glow.position.z = 0.05;
      eyeGroup.add(glow);
      
      eyeGroup.position.set(x, 0.6, 0.4);
      return eyeGroup;
    };
    
    avatarGroup.add(createEye(-0.15));
    avatarGroup.add(createEye(0.15));
    
    // Create mouth
    const mouthGeometry = new THREE.TorusGeometry(0.1, 0.02, 16, 32, Math.PI);
    const mouthMaterial = new THREE.MeshStandardMaterial({
      color: 0xFF6B6B,
      roughness: 0.5,
      metalness: 0.3,
    });
    const mouth = new THREE.Mesh(mouthGeometry, mouthMaterial);
    mouth.rotation.x = Math.PI;
    mouth.position.set(0, 0.3, 0.45);
    mouth.name = 'mouth';
    avatarGroup.add(mouth);
    
    // Create body
    const bodyGeometry = new THREE.CylinderGeometry(0.3, 0.4, 0.7, 32);
    const bodyMaterial = new THREE.MeshStandardMaterial({
      color: colors.accent,
      roughness: 0.7,
      metalness: 0.2,
    });
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    body.position.y = -0.4;
    avatarGroup.add(body);
    
    return avatarGroup;
  };
  
  // Apply emotions to the avatar's face
  const applySentiment = (sentiment: string, avatarGroup: THREE.Group) => {
    const mouth = avatarGroup.getObjectByName('mouth') as THREE.Mesh;
    if (!mouth) return;
    
    switch (sentiment) {
      case 'happy':
        mouth.scale.y = 0.8;
        mouth.position.y = 0.3;
        break;
      case 'sad':
        mouth.scale.y = -0.6;
        mouth.position.y = 0.2;
        break;
      case 'surprised':
        mouth.scale.x = 0.7;
        mouth.scale.y = 1.2;
        break;
      case 'angry':
        mouth.scale.y = -0.4;
        mouth.position.y = 0.25;
        break;
      default: // neutral
        mouth.scale.set(1, 1, 1);
        mouth.position.y = 0.3;
    }
  };
  
  // Initialize and update the avatar
  useEffect(() => {
    console.log('Avatar3D component mounted or updated');
    if (!avatarRef.current) {
      avatarRef.current = createAvatarModel();
      console.log('Avatar3D model created');
    }
    
    if (avatarRef.current) {
      applySentiment(sentiment, avatarRef.current);
    }
    
    return () => {
      console.log('Avatar3D component unmounting');
      // Clean up Three.js objects to prevent memory leaks
      if (avatarRef.current) {
        avatarRef.current.traverse((child) => {
          if (child instanceof THREE.Mesh) {
            child.geometry.dispose();
            if (Array.isArray(child.material)) {
              child.material.forEach(material => material.dispose());
            } else {
              child.material.dispose();
            }
          }
        });
        avatarRef.current = null;
      }
    };
  }, [sentiment, avatarStyle]);
  
  return (
    <></>
  );
};

export default Avatar3D;
