import { Canvas } from "@react-three/fiber";
import { Environment, Stars, Sparkles, Grid } from "@react-three/drei";
import { RobotModel } from "./RobotModel";

export default function RobotHero() {
  return (
    <div className="w-full h-full flex items-center justify-center">
      <Canvas
        camera={{
          position: [0, 1.8, 5],
          fov: 25,
          near: 0.1,
          far: 500,
        }}
      >
        {/* Deep Cyberspace Background */}
        {/* Stars - Creates deep universe feel (lower opacity for grid visibility) */}
        <Stars 
          radius={300} 
          depth={50} 
          count={5000} 
          factor={4} 
          saturation={0} 
          fade 
          speed={1} 
        />

        {/* Digital Grid Floor - Retro-futuristic hacker floor */}
        <Grid
          position={[0, -2, 0]}
          args={[10, 10]}
          cellSize={0.5}
          cellThickness={0.5}
          cellColor="#00ffff"
          sectionSize={3}
          sectionThickness={1}
          sectionColor="#0088ff"
          fadeDistance={30}
          fadeStrength={1}
          followCamera={false}
          infiniteGrid
        />

        {/* Sparkles - Data Dust (floating cyan particles) */}
        <Sparkles 
          count={100} 
          scale={10} 
          size={2} 
          speed={0.4} 
          opacity={0.5} 
          color="#00ffff" 
        />

        {/* Fog - Blends robot into darkness */}
        <fog attach="fog" args={['#000000', 10, 50]} />

        {/* lighting */}
        <ambientLight intensity={0.9} />
        <directionalLight position={[3, 4, 3]} intensity={1.6} />
        <directionalLight position={[-3, 2, -2]} intensity={0.8} />

        {/* robot */}
        <group position={[0, 0.5, 0]}>
          <RobotModel rotationSpeed={0.3} />
        </group>

        <Environment preset="city" />
      </Canvas>
    </div>
  );
}
