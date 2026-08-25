import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

export function ParticleField() {
  const particlesRef = useRef<THREE.Points>(null);
  const ringsRef = useRef<THREE.Group>(null);

  // Create particle system
  const particleCount = 200;
  const positions = useMemo(() => {
    const positions = new Float32Array(particleCount * 3);
    for (let i = 0; i < particleCount * 3; i += 3) {
      // Random positions in a sphere around the robot
      const radius = 3 + Math.random() * 4;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(Math.random() * 2 - 1);
      
      positions[i] = radius * Math.sin(phi) * Math.cos(theta);
      positions[i + 1] = radius * Math.sin(phi) * Math.sin(theta);
      positions[i + 2] = radius * Math.cos(phi);
    }
    return positions;
  }, []);

  // Animate particles
  useFrame((state) => {
    if (particlesRef.current) {
      particlesRef.current.rotation.y += 0.001;
      particlesRef.current.rotation.x += 0.0005;
    }
    
    if (ringsRef.current) {
      ringsRef.current.rotation.y += 0.002;
    }
  });

  return (
    <group>
      {/* Floating Particles */}
      <points ref={particlesRef}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            args={[positions, 3]}
          />
        </bufferGeometry>
        <pointsMaterial
          size={0.05}
          color="#3b82f6" // Blue
          transparent
          opacity={0.6}
          sizeAttenuation={true}
        />
      </points>

      {/* Floating Rings */}
      <group ref={ringsRef}>
        {/* Ring 1 - Blue */}
        <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 1, 0]}>
          <torusGeometry args={[2.5, 0.02, 16, 100]} />
          <meshBasicMaterial color="#3b82f6" transparent opacity={0.4} />
        </mesh>
        
        {/* Ring 2 - Cyan */}
        <mesh rotation={[0, Math.PI / 2, 0]} position={[0, 0.5, 0]}>
          <torusGeometry args={[3, 0.02, 16, 100]} />
          <meshBasicMaterial color="#06b6d4" transparent opacity={0.3} />
        </mesh>
        
        {/* Ring 3 - Blue (smaller) */}
        <mesh rotation={[Math.PI / 4, Math.PI / 4, 0]} position={[0, -0.5, 0]}>
          <torusGeometry args={[2, 0.02, 16, 100]} />
          <meshBasicMaterial color="#3b82f6" transparent opacity={0.5} />
        </mesh>
      </group>

      {/* Additional floating particles (cyan) */}
      <points position={[0, 0, 0]}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            args={[positions, 3]}
          />
        </bufferGeometry>
        <pointsMaterial
          size={0.04}
          color="#06b6d4" // Cyan
          transparent
          opacity={0.5}
          sizeAttenuation={true}
        />
      </points>
    </group>
  );
}

