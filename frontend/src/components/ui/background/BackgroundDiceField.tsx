import { useRef, useMemo, useEffect } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { createDie } from '../dice-loader/createDie';

// --- Types ---

import { DieType, DieVisualStyle } from '../dice-loader/types';

interface FallingDieProps {
  initialSpeed: number;
  rotationSpeed: [number, number, number];
  scale?: number;
  xPos: number; // Fixed X lane or random range center
  zPos: number; // Depth
  dieType: DieType;
  material: DieVisualStyle;
  color: string;
}

// --- Components ---

function FallingDie({ initialSpeed, rotationSpeed, scale = 1, xPos, zPos, dieType, material, color }: FallingDieProps) {
  const groupRef = useRef<THREE.Group>(null);

  // Create a memoized die instance
  const die = useMemo(() => {
    // Basic die generation
    const dieGroup = createDie(dieType, color, material);

    // Enable shadows
    dieGroup.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        child.castShadow = true;
        child.receiveShadow = true;
      }
    });

    return dieGroup;
  }, [dieType, color, material]);

  useEffect(() => {
    if (groupRef.current) {
      groupRef.current.add(die);
    }
    return () => {
      if (groupRef.current) {
        groupRef.current.remove(die);
      }
    };
  }, [die]);

  // Randomize initial Y to spread them out at start
  const initialY = useMemo(() => Math.random() * 40 + 10, []);

  // Mutable physics state
  const physicsState = useRef({
    y: initialY,
    velocity: initialSpeed,
    rotation: new THREE.Euler(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI),
  });

  const { viewport } = useThree();
  // Gravity - stronger for faster fall
  const GRAVITY = 9.8 * 2.5;

  useFrame((_state, delta) => {
    if (!groupRef.current) return;

    // 1. Update Velocity (v = u + at)
    physicsState.current.velocity += GRAVITY * delta;

    // 2. Update Position
    physicsState.current.y -= physicsState.current.velocity * delta;

    // 3. Update Rotation - Very fast chaotic spin
    const spinFactor = 1 + physicsState.current.velocity * 0.15;

    groupRef.current.rotation.x += rotationSpeed[0] * delta * spinFactor;
    groupRef.current.rotation.y += rotationSpeed[1] * delta * spinFactor;
    groupRef.current.rotation.z += rotationSpeed[2] * delta * spinFactor;

    // Reset logic
    const resetThreshold = -viewport.height / 2 - 5;
    const spawnHeight = viewport.height / 2 + 5;

    if (physicsState.current.y < resetThreshold) {
      // Reset to top
      physicsState.current.y = spawnHeight + Math.random() * 5;
      // Reset velocity - keep it fast but varied
      physicsState.current.velocity = initialSpeed + Math.random() * 3;
    }

    // Apply
    groupRef.current.position.set(xPos, physicsState.current.y, zPos);
  });

  return <group ref={groupRef} position={[xPos, initialY, zPos]} scale={scale} dispose={null} />;
}

function Scene() {
  const diceConfig = useMemo(() => {
    const count = 35; // Many more dice since they are smaller
    const items: FallingDieProps[] = [];

    // Configs for randomization
    // Supported types from createDie.ts: 2, 4, 6, 8, 10, 12, 20, '20-ai'
    const types: DieType[] = [2, 4, 6, 8, 10, 12, 20, '20-ai'];
    const styles: DieVisualStyle[] = ['acrylic', 'metallic', 'glowing', 'stone', 'standard'];
    const colors = ['#d4af37', '#7a49d9', '#d88416', '#2e1065', '#4c1d95', '#a855f7', '#fbbf24'];

    // Width calculation at depth -10 roughly
    // FOV 45, Z=10 (camera), Die Z=-5 to -15. Dist = 15 to 25.
    // Visible width ≈ 2 * dist * tan(22.5) ≈ 0.828 * dist.
    // At dist 20, width ≈ 16.5 units.

    for (let i = 0; i < count; i++) {
      // Much deeper depth range: -10 to -30
      // Camera is at +10. So distance is 20 to 40.
      const z = -Math.random() * 20 - 10;

      // Calculate spread based on depth to fill screen
      // tan(22.5 deg) ≈ 0.414. Visible height at dist D = 2 * D * 0.414 ≈ 0.828 * D
      // Aspect ratio (width) scales this.
      // At z=-30 (dist 40), width ≈ 33 units * aspect.
      const spread = Math.abs(z - 10) * 0.8;

      items.push({
        xPos: (Math.random() - 0.5) * spread * 2.5, // Wide spread
        zPos: z,
        // Start faster
        initialSpeed: 4 + Math.random() * 4,
        rotationSpeed: [
          (Math.random() - 0.5) * 15, // Very fast rotation
          (Math.random() - 0.5) * 15,
          (Math.random() - 0.5) * 15,
        ],
        // Much smaller scale: 0.15 to 0.35
        scale: 0.15 + Math.random() * 0.2,

        // Random visual properties
        dieType: types[Math.floor(Math.random() * types.length)]!,
        material: styles[Math.floor(Math.random() * styles.length)]!,
        color: colors[Math.floor(Math.random() * colors.length)]!,
      });
    }
    return items;
  }, []);

  return (
    <>
      <ambientLight intensity={0.5} />
      <directionalLight position={[10, 10, 5]} intensity={1.5} color="#ffd700" />
      <pointLight position={[-10, 0, -10]} intensity={1} color="#7a49d9" />

      {diceConfig.map((props, i) => (
        // eslint-disable-next-line react/no-array-index-key
        <FallingDie key={i} {...props} />
      ))}

      {/* Stronger Fog to fade distant dice */}
      <fog attach="fog" args={['#050205', 15, 50]} />
    </>
  );
}

export function BackgroundDiceField() {
  return (
    // FIXED positioning is critical here to prevent scroll reset
    // -z-50 ensures it is behind everything
    <div className="fixed inset-0 -z-50 pointer-events-none">
      <Canvas
        camera={{ position: [0, 0, 10], fov: 45 }}
        dpr={[1, 1.5]} // Performance optimization
        gl={{ alpha: true, antialias: false }} // Disable antialias for background perf
      >
        <Scene />
      </Canvas>
      {/* Gradient overlay for text contrast */}
      <div className="absolute inset-0 bg-gradient-to-b from-midnight-950/30 via-midnight-950/10 to-midnight-950/80" />
    </div>
  );
}
