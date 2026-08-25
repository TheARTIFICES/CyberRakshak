import { useRef, useEffect } from "react";
import { useFrame } from "@react-three/fiber";
import { useGLTF } from "@react-three/drei";
import type { Group } from "three";

type RobotModelProps = {
  rotationSpeed?: number;
};

export function RobotModel({ rotationSpeed = 0.3 }: RobotModelProps) {
  const groupRef = useRef<Group | null>(null);
  const { scene } = useGLTF("/hero/robot.glb");

  useEffect(() => {
    if (scene) {
      scene.scale.set(1.15, 1.15, 1.15);
      scene.position.set(0, -1.3, 0);
    }
  }, [scene]);

  useFrame((_, delta) => {
    if (!groupRef.current) return;
    groupRef.current.rotation.y += rotationSpeed * delta;
  });

  return (
    <group ref={groupRef} rotation={[0, 0, 0]}>
      <primitive object={scene} />
    </group>
  );
}

useGLTF.preload("/hero/robot.glb");

