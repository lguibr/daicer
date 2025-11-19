/**
 * StructurePreview Component
 * Real-time 3D WebGL preview of voxel structures using Three.js
 */

import { useRef, useMemo, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { Loader2 } from 'lucide-react';

interface Structure {
  id: string;
  name: string;
  size: 'tiny' | 'small' | 'medium' | 'large' | 'huge';
  type: 'settlement' | 'dungeon' | 'landmark' | 'ruin' | 'natural' | 'other';
  description?: string;
  significance: number;
}

interface StructurePreviewProps {
  structure: Structure;
  size?: number;
  autoRotate?: boolean;
  className?: string;
}

/**
 * Structure type to color mapping
 */
const TYPE_COLORS: Record<Structure['type'], string> = {
  settlement: '#8B7355', // Brown
  dungeon: '#4A5568', // Dark gray
  landmark: '#D4AF37', // Gold
  ruin: '#A0AEC0', // Light gray
  natural: '#48BB78', // Green
  other: '#718096', // Medium gray
};

/**
 * Size to voxel dimension mapping
 */
const SIZE_DIMENSIONS: Record<Structure['size'], [number, number, number]> = {
  tiny: [2, 2, 2],
  small: [3, 3, 3],
  medium: [5, 5, 4],
  large: [7, 7, 5],
  huge: [10, 10, 6],
};

/**
 * Voxel mesh component with auto-rotation
 */
function VoxelStructure({ structure, autoRotate = true }: { structure: Structure; autoRotate?: boolean }) {
  const meshRef = useRef<THREE.Group>(null);
  const dimensions = SIZE_DIMENSIONS[structure.size];

  // Generate voxel geometry
  const geometry = useMemo(() => {
    const [width, depth, height] = dimensions;
    const voxels: THREE.Mesh[] = [];
    const voxelSize = 0.2;
    const color = new THREE.Color(TYPE_COLORS[structure.type]);

    // Create a simple structure pattern based on type
    for (let x = 0; x < width; x++) {
      for (let y = 0; y < height; y++) {
        for (let z = 0; z < depth; z++) {
          // Determine if this voxel should be solid based on structure type
          let shouldPlace = false;

          if (structure.type === 'settlement') {
            // Walls and foundation
            shouldPlace =
              y === 0 || // Foundation
              x === 0 ||
              x === width - 1 ||
              z === 0 ||
              z === depth - 1 || // Walls
              (y === height - 1 && (x === 0 || x === width - 1 || z === 0 || z === depth - 1)); // Roof edges
          } else if (structure.type === 'dungeon') {
            // Solid with entrance
            shouldPlace = !(x === Math.floor(width / 2) && z === 0 && y < 2);
          } else if (structure.type === 'landmark') {
            // Tower/monument shape
            shouldPlace = x === Math.floor(width / 2) || z === Math.floor(depth / 2);
          } else if (structure.type === 'ruin') {
            // Partial/broken structure
            shouldPlace = Math.random() > 0.4 && (y === 0 || x === 0 || z === 0);
          } else if (structure.type === 'natural') {
            // Organic/irregular shape
            shouldPlace = Math.random() > 0.3;
          } else {
            // Default cube pattern
            shouldPlace = y === 0 || x === 0 || x === width - 1 || z === 0 || z === depth - 1;
          }

          if (shouldPlace) {
            const geo = new THREE.BoxGeometry(voxelSize, voxelSize, voxelSize);
            const mat = new THREE.MeshStandardMaterial({
              color: color.clone().multiplyScalar(0.8 + Math.random() * 0.4), // Slight variation
              roughness: 0.7,
              metalness: 0.1,
            });
            const mesh = new THREE.Mesh(geo, mat);
            mesh.position.set((x - width / 2) * voxelSize, (y - height / 2) * voxelSize, (z - depth / 2) * voxelSize);
            voxels.push(mesh);
          }
        }
      }
    }

    return voxels;
  }, [structure.type, dimensions]);

  // Auto-rotation animation
  useFrame((_state, delta) => {
    if (meshRef.current && autoRotate) {
      meshRef.current.rotation.y += delta * 0.5;
    }
  });

  return (
    <group ref={meshRef}>
      {geometry.map((voxel) => (
        <primitive key={voxel.uuid} object={voxel} />
      ))}
    </group>
  );
}

/**
 * Main StructurePreview component
 */
export function StructurePreview({ structure, size = 200, autoRotate = true, className = '' }: StructurePreviewProps) {
  const [isLoading, setIsLoading] = useState(true);

  return (
    <div
      className={`relative bg-gradient-to-br from-midnight-900 via-midnight-800 to-midnight-700 rounded-lg overflow-hidden border border-accent/20 ${className}`}
      style={{ width: size, height: size }}
    >
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center z-10 bg-midnight-900/80">
          <Loader2 className="w-8 h-8 animate-spin text-accent" />
        </div>
      )}

      <Canvas
        camera={{ position: [2, 2, 2], fov: 50 }}
        onCreated={() => setIsLoading(false)}
        gl={{ antialias: true, alpha: true }}
      >
        {/* Lighting */}
        <ambientLight intensity={0.5} />
        <directionalLight position={[5, 5, 5]} intensity={0.8} castShadow />
        <pointLight position={[-5, 5, -5]} intensity={0.3} />

        {/* Voxel structure */}
        <VoxelStructure structure={structure} autoRotate={autoRotate} />

        {/* Grid helper for reference */}
        <gridHelper args={[2, 10, '#7a49a5', '#4a2a65']} />
      </Canvas>

      {/* Structure info overlay */}
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-midnight-950/90 to-transparent p-2">
        <p className="text-xs text-parchment-light font-medium truncate">{structure.name}</p>
        <p className="text-xs text-shadow-400 capitalize">{structure.type}</p>
      </div>
    </div>
  );
}

/**
 * Thumbnail version for lists
 */
export function StructureThumbnail({ structure }: { structure: Structure }) {
  return <StructurePreview structure={structure} size={120} autoRotate />;
}
