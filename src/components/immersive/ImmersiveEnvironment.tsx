
import React, { useRef, useEffect, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar3D } from '@/components/immersive/Avatar3D';

interface ImmersiveEnvironmentProps {
  environment: string;
  isSpeaking: boolean;
  isListening: boolean;
  isThinking: boolean;
  subjectId: string;
}

const ImmersiveEnvironment: React.FC<ImmersiveEnvironmentProps> = ({
  environment,
  isSpeaking,
  isListening,
  isThinking,
  subjectId
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const requestIdRef = useRef<number | null>(null);
  const avatarRef = useRef<THREE.Group | null>(null);
  
  const [interactiveItems, setInteractiveItems] = useState<{ id: string, name: string, type: string }[]>([]);
  const [activeItem, setActiveItem] = useState<string | null>(null);
  const [sceneLoaded, setSceneLoaded] = useState(false);
  
  // Set up the 3D scene
  useEffect(() => {
    if (!mountRef.current) return;
    
    // Cleanup function to handle unmounting
    return () => {
      if (requestIdRef.current) {
        cancelAnimationFrame(requestIdRef.current);
      }
      
      if (rendererRef.current && mountRef.current) {
        mountRef.current.removeChild(rendererRef.current.domElement);
      }
      
      if (sceneRef.current) {
        // Dispose of all scene objects to prevent memory leaks
        sceneRef.current.traverse((object) => {
          if (object instanceof THREE.Mesh) {
            object.geometry.dispose();
            if (object.material instanceof THREE.Material) {
              object.material.dispose();
            } else if (Array.isArray(object.material)) {
              object.material.forEach(material => material.dispose());
            }
          }
        });
      }
    };
  }, []);
  
  // Initialize the 3D scene when the environment changes
  useEffect(() => {
    if (!mountRef.current) return;
    
    // Clear previous scene if it exists
    if (requestIdRef.current) {
      cancelAnimationFrame(requestIdRef.current);
    }
    
    if (rendererRef.current && mountRef.current && mountRef.current.contains(rendererRef.current.domElement)) {
      mountRef.current.removeChild(rendererRef.current.domElement);
    }
    
    // Set up scene
    const scene = new THREE.Scene();
    sceneRef.current = scene;
    
    // Add lighting
    const ambientLight = new THREE.AmbientLight(0x404040, 1.5);
    scene.add(ambientLight);
    
    const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight.position.set(5, 10, 7.5);
    directionalLight.castShadow = true;
    scene.add(directionalLight);
    
    // Set up camera
    const camera = new THREE.PerspectiveCamera(
      75,
      mountRef.current.clientWidth / mountRef.current.clientHeight,
      0.1,
      1000
    );
    camera.position.set(0, 2, 5);
    cameraRef.current = camera;
    
    // Set up renderer
    const renderer = new THREE.WebGLRenderer({ 
      antialias: true,
      alpha: true 
    });
    renderer.setSize(mountRef.current.clientWidth, mountRef.current.clientHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.shadowMap.enabled = true;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    mountRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;
    
    // Set up controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.maxPolarAngle = Math.PI / 2;
    controls.minDistance = 3;
    controls.maxDistance = 10;
    controlsRef.current = controls;
    
    // Create the specific environment
    createEnvironment(environment, scene);
    
    // Animation loop
    const animate = () => {
      if (controlsRef.current) {
        controlsRef.current.update();
      }
      
      // Render the scene
      if (rendererRef.current && cameraRef.current && sceneRef.current) {
        rendererRef.current.render(sceneRef.current, cameraRef.current);
      }
      
      requestIdRef.current = requestAnimationFrame(animate);
    };
    
    animate();
    
    // Handle window resize
    const handleResize = () => {
      if (!mountRef.current || !cameraRef.current || !rendererRef.current) return;
      
      const width = mountRef.current.clientWidth;
      const height = mountRef.current.clientHeight;
      
      cameraRef.current.aspect = width / height;
      cameraRef.current.updateProjectionMatrix();
      
      rendererRef.current.setSize(width, height);
    };
    
    window.addEventListener('resize', handleResize);
    
    return () => {
      window.removeEventListener('resize', handleResize);
      if (requestIdRef.current) {
        cancelAnimationFrame(requestIdRef.current);
      }
    };
  }, [environment]);
  
  // Create different environments based on subject
  const createEnvironment = (type: string, scene: THREE.Scene) => {
    // Clear previous environment items
    setInteractiveItems([]);
    
    // Add floor
    const floorGeometry = new THREE.PlaneGeometry(20, 20);
    const floorMaterial = new THREE.MeshStandardMaterial({ 
      color: 0x444444,
      roughness: 0.8,
      metalness: 0.2,
    });
    const floor = new THREE.Mesh(floorGeometry, floorMaterial);
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    scene.add(floor);
    
    // Create background based on environment type
    let skyColor = 0x87CEEB; // Default sky blue
    let items: { id: string, name: string, type: string }[] = [];
    
    switch (type) {
      case 'spaceship':
        // Space environment
        skyColor = 0x000020; // Dark blue
        scene.background = new THREE.Color(skyColor);
        
        // Add stars
        const starsGeometry = new THREE.BufferGeometry();
        const starsMaterial = new THREE.PointsMaterial({
          color: 0xffffff,
          size: 0.1,
        });
        
        const starsVertices = [];
        for (let i = 0; i < 1000; i++) {
          const x = THREE.MathUtils.randFloatSpread(100);
          const y = THREE.MathUtils.randFloatSpread(100);
          const z = THREE.MathUtils.randFloatSpread(100);
          starsVertices.push(x, y, z);
        }
        
        starsGeometry.setAttribute('position', new THREE.Float32BufferAttribute(starsVertices, 3));
        const stars = new THREE.Points(starsGeometry, starsMaterial);
        scene.add(stars);
        
        // Add a planet
        const planetGeometry = new THREE.SphereGeometry(1, 32, 32);
        const planetMaterial = new THREE.MeshStandardMaterial({
          color: 0x4169E1,
          roughness: 0.5,
          metalness: 0.5,
        });
        const planet = new THREE.Mesh(planetGeometry, planetMaterial);
        planet.position.set(-3, 2, -5);
        scene.add(planet);
        
        // Add a rocket
        const rocketGeometry = new THREE.ConeGeometry(0.5, 1.5, 32);
        const rocketMaterial = new THREE.MeshStandardMaterial({
          color: 0xFF4500,
          roughness: 0.3,
          metalness: 0.7,
        });
        const rocket = new THREE.Mesh(rocketGeometry, rocketMaterial);
        rocket.position.set(3, 1, -2);
        rocket.userData = { id: 'rocket', interactive: true };
        scene.add(rocket);
        
        items.push({ id: 'rocket', name: 'Rocket', type: 'model' });
        items.push({ id: 'planet', name: 'Planet', type: 'model' });
        break;
        
      case 'forest':
        // Forest environment
        skyColor = 0x87CEEB; // Sky blue
        scene.background = new THREE.Color(skyColor);
        
        // Add trees using simple cone and cylinder geometries
        for (let i = 0; i < 10; i++) {
          const trunkGeometry = new THREE.CylinderGeometry(0.2, 0.2, 1, 8);
          const trunkMaterial = new THREE.MeshStandardMaterial({ color: 0x8B4513 });
          const trunk = new THREE.Mesh(trunkGeometry, trunkMaterial);
          
          const leavesGeometry = new THREE.ConeGeometry(1, 2, 8);
          const leavesMaterial = new THREE.MeshStandardMaterial({ color: 0x228B22 });
          const leaves = new THREE.Mesh(leavesGeometry, leavesMaterial);
          leaves.position.y = 1.5;
          
          const tree = new THREE.Group();
          tree.add(trunk);
          tree.add(leaves);
          
          // Random position
          const x = Math.random() * 16 - 8;
          const z = Math.random() * 16 - 8;
          tree.position.set(x, 0, z);
          
          scene.add(tree);
        }
        
        // Add a molecule model
        const moleculeGroup = new THREE.Group();
        moleculeGroup.userData = { id: 'molecule', interactive: true };
        
        // Create atoms for the molecule
        const createAtom = (color: number, position: THREE.Vector3) => {
          const geometry = new THREE.SphereGeometry(0.3, 32, 32);
          const material = new THREE.MeshStandardMaterial({ color });
          const atom = new THREE.Mesh(geometry, material);
          atom.position.copy(position);
          return atom;
        };
        
        // Add atoms
        moleculeGroup.add(createAtom(0xff0000, new THREE.Vector3(0, 0, 0))); // Center
        moleculeGroup.add(createAtom(0x0000ff, new THREE.Vector3(0.6, 0.6, 0))); // Top right
        moleculeGroup.add(createAtom(0x0000ff, new THREE.Vector3(-0.6, 0.6, 0))); // Top left
        moleculeGroup.add(createAtom(0x0000ff, new THREE.Vector3(0, -0.6, 0.6))); // Bottom front
        moleculeGroup.add(createAtom(0x0000ff, new THREE.Vector3(0, -0.6, -0.6))); // Bottom back
        
        // Add bonds (cylinders)
        const bondGeometry = new THREE.CylinderGeometry(0.05, 0.05, 1, 8);
        
        const createBond = (start: THREE.Vector3, end: THREE.Vector3) => {
          const direction = new THREE.Vector3().subVectors(end, start);
          const bond = new THREE.Mesh(bondGeometry, new THREE.MeshBasicMaterial({ color: 0xffffff }));
          bond.position.copy(start);
          bond.position.lerp(end, 0.5);
          bond.scale.y = direction.length();
          bond.lookAt(end);
          bond.rotateX(Math.PI / 2);
          return bond;
        };
        
        // Add bonds between center and other atoms
        const centerPos = new THREE.Vector3(0, 0, 0);
        moleculeGroup.add(createBond(centerPos, new THREE.Vector3(0.6, 0.6, 0)));
        moleculeGroup.add(createBond(centerPos, new THREE.Vector3(-0.6, 0.6, 0)));
        moleculeGroup.add(createBond(centerPos, new THREE.Vector3(0, -0.6, 0.6)));
        moleculeGroup.add(createBond(centerPos, new THREE.Vector3(0, -0.6, -0.6)));
        
        moleculeGroup.position.set(2, 1.5, 0);
        scene.add(moleculeGroup);
        
        items.push({ id: 'molecule', name: 'Molecule', type: 'model' });
        items.push({ id: 'tree', name: 'Forest Ecosystem', type: 'environment' });
        break;
        
      case 'dojo':
        // Coding dojo environment
        skyColor = 0x1E1E1E; // Dark gray
        scene.background = new THREE.Color(skyColor);
        
        // Add dojo floor
        floor.material = new THREE.MeshStandardMaterial({
          color: 0x8B4513,
          roughness: 0.8,
          metalness: 0.2,
        });
        
        // Add walls
        const wallGeometry = new THREE.BoxGeometry(20, 4, 0.2);
        const wallMaterial = new THREE.MeshStandardMaterial({
          color: 0x8B0000,
          roughness: 0.9,
          metalness: 0.1,
        });
        
        const backWall = new THREE.Mesh(wallGeometry, wallMaterial);
        backWall.position.set(0, 2, -10);
        scene.add(backWall);
        
        const leftWall = new THREE.Mesh(wallGeometry, wallMaterial);
        leftWall.rotation.y = Math.PI / 2;
        leftWall.position.set(-10, 2, 0);
        scene.add(leftWall);
        
        const rightWall = new THREE.Mesh(wallGeometry, wallMaterial);
        rightWall.rotation.y = Math.PI / 2;
        rightWall.position.set(10, 2, 0);
        scene.add(rightWall);
        
        // Add code blocks
        const codeBlockGroup = new THREE.Group();
        codeBlockGroup.userData = { id: 'codeBlock', interactive: true };
        
        const blockGeometry = new THREE.BoxGeometry(3, 2, 0.1);
        const blockMaterial = new THREE.MeshStandardMaterial({
          color: 0x1E90FF,
          roughness: 0.4,
          metalness: 0.6,
          transparent: true,
          opacity: 0.8,
        });
        
        const codeBlock = new THREE.Mesh(blockGeometry, blockMaterial);
        codeBlock.position.set(0, 2, -4);
        codeBlockGroup.add(codeBlock);
        
        codeBlockGroup.position.set(0, 1, -3);
        scene.add(codeBlockGroup);
        
        items.push({ id: 'codeBlock', name: 'Code Sample', type: 'model' });
        items.push({ id: 'dojo', name: 'Coding Environment', type: 'environment' });
        break;
        
      case 'library':
        // Library environment
        skyColor = 0x3F2305; // Warm brown
        scene.background = new THREE.Color(skyColor);
        
        // Add library floor
        floor.material = new THREE.MeshStandardMaterial({
          color: 0x8B4513,
          roughness: 0.8,
          metalness: 0.2,
        });
        
        // Add bookshelves
        const bookshelfGeometry = new THREE.BoxGeometry(3, 4, 0.5);
        const bookshelfMaterial = new THREE.MeshStandardMaterial({
          color: 0x5C4033,
          roughness: 0.9,
          metalness: 0.1,
        });
        
        const bookshelf1 = new THREE.Mesh(bookshelfGeometry, bookshelfMaterial);
        bookshelf1.position.set(-5, 2, -5);
        scene.add(bookshelf1);
        
        const bookshelf2 = new THREE.Mesh(bookshelfGeometry, bookshelfMaterial);
        bookshelf2.position.set(5, 2, -5);
        scene.add(bookshelf2);
        
        // Add a floating book
        const bookGroup = new THREE.Group();
        bookGroup.userData = { id: 'book', interactive: true };
        
        const bookGeometry = new THREE.BoxGeometry(1, 0.1, 0.7);
        const bookMaterial = new THREE.MeshStandardMaterial({
          color: 0x8B0000,
          roughness: 0.4,
          metalness: 0.2,
        });
        
        const book = new THREE.Mesh(bookGeometry, bookMaterial);
        bookGroup.add(book);
        
        bookGroup.position.set(0, 1.5, 0);
        scene.add(bookGroup);
        
        items.push({ id: 'book', name: 'Interactive Book', type: 'model' });
        items.push({ id: 'library', name: 'Library Hall', type: 'environment' });
        break;
    }
    
    // Add avatar to the scene
    const avatarGroup = createAvatar();
    avatarGroup.position.set(0, 0, 0);
    scene.add(avatarGroup);
    avatarRef.current = avatarGroup;
    
    // Update interactive items
    setInteractiveItems(items);
    setSceneLoaded(true);
  };
  
  // Create a simple avatar for the scene
  const createAvatar = () => {
    const avatarGroup = new THREE.Group();
    
    // Create basic avatar shape
    const headGeometry = new THREE.SphereGeometry(0.5, 32, 32);
    const headMaterial = new THREE.MeshStandardMaterial({
      color: 0xF5F5F5,
      roughness: 0.7,
      metalness: 0.3,
    });
    const head = new THREE.Mesh(headGeometry, headMaterial);
    head.position.y = 1.6;
    avatarGroup.add(head);
    
    // Create eyes
    const eyeGeometry = new THREE.SphereGeometry(0.1, 32, 32);
    const eyeMaterial = new THREE.MeshStandardMaterial({
      color: 0x4287f5,
      emissive: 0x4287f5,
      emissiveIntensity: 0.5,
    });
    
    const leftEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
    leftEye.position.set(-0.2, 1.7, 0.4);
    avatarGroup.add(leftEye);
    
    const rightEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
    rightEye.position.set(0.2, 1.7, 0.4);
    avatarGroup.add(rightEye);
    
    // Create body
    const bodyGeometry = new THREE.CylinderGeometry(0.3, 0.5, 1.5, 32);
    const bodyMaterial = new THREE.MeshStandardMaterial({
      color: 0x4287f5,
      roughness: 0.8,
      metalness: 0.2,
    });
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    body.position.y = 0.75;
    avatarGroup.add(body);
    
    return avatarGroup;
  };
  
  // Handle avatar animations based on state
  useEffect(() => {
    if (!avatarRef.current) return;
    
    // Animation loop for avatar
    const animateAvatar = () => {
      if (!avatarRef.current) return;
      
      if (isSpeaking) {
        // Bobbing motion while speaking
        avatarRef.current.position.y = Math.sin(Date.now() * 0.005) * 0.05;
        avatarRef.current.rotation.y = Math.sin(Date.now() * 0.002) * 0.2;
      } else if (isListening) {
        // Slight tilt while listening
        avatarRef.current.rotation.z = Math.sin(Date.now() * 0.003) * 0.1;
      } else if (isThinking) {
        // Back and forth motion while thinking
        avatarRef.current.rotation.x = Math.sin(Date.now() * 0.002) * 0.1;
      } else {
        // Idle animation
        avatarRef.current.position.y = Math.sin(Date.now() * 0.001) * 0.03;
        avatarRef.current.rotation.y = Math.sin(Date.now() * 0.001) * 0.1;
      }
      
      requestAnimationFrame(animateAvatar);
    };
    
    const animationId = requestAnimationFrame(animateAvatar);
    return () => cancelAnimationFrame(animationId);
  }, [isSpeaking, isListening, isThinking]);
  
  const handleItemClick = (itemId: string) => {
    setActiveItem(itemId);
    
    // Find the item in the scene and highlight it
    if (sceneRef.current) {
      sceneRef.current.traverse((object) => {
        if (object.userData && object.userData.id === itemId) {
          // Add a highlight effect
          if (object instanceof THREE.Mesh) {
            object.scale.multiplyScalar(1.1);
            
            // Return to normal after a moment
            setTimeout(() => {
              object.scale.multiplyScalar(1/1.1);
            }, 1000);
          }
        }
      });
    }
    
    // Show a toast message about the item
    toast({
      title: `Exploring: ${itemId}`,
      description: "The AI is explaining this item to you now.",
    });
  };
  
  return (
    <div className="relative w-full h-full overflow-hidden">
      <div 
        ref={mountRef} 
        className="absolute top-0 left-0 w-full h-full"
      />
      
      {sceneLoaded && (
        <>
          {/* Overlay for avatar and interactive elements */}
          <div className="absolute top-4 right-4 z-10">
            <Card className="p-3 bg-black/60 border-gray-700">
              <h3 className="text-sm font-medium mb-2">Interactive Elements</h3>
              <div className="space-y-2">
                {interactiveItems.map(item => (
                  <Button 
                    key={item.id}
                    size="sm"
                    variant="outline"
                    className={`w-full ${activeItem === item.id ? 'bg-blue-900' : 'bg-transparent'}`}
                    onClick={() => handleItemClick(item.id)}
                  >
                    {item.name}
                  </Button>
                ))}
              </div>
            </Card>
          </div>
          
          {/* Avatar status overlay */}
          <Card className="absolute bottom-4 left-4 z-10 bg-black/60 border-gray-700 p-2">
            <p className="text-xs text-white">
              {isSpeaking && 'AI is explaining...'}
              {isListening && 'AI is listening...'}
              {isThinking && 'AI is thinking...'}
              {!isSpeaking && !isListening && !isThinking && 'AI is ready'}
            </p>
          </Card>
        </>
      )}
    </div>
  );
};

export default ImmersiveEnvironment;
