/**
 * VoxelModelViewer Component
 * Three.js-based viewer for voxel models
 */

import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import type { ModelData } from '../../services/assetService';

interface VoxelModelViewerProps {
  modelData: ModelData;
  width?: number;
  height?: number;
  showGrid?: boolean;
  autoRotate?: boolean;
}

export function VoxelModelViewer({
  modelData,
  width = 400,
  height = 400,
  showGrid = true,
  autoRotate = false,
}: VoxelModelViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const frameIdRef = useRef<number | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    // Scene setup
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0f0a1e); // midnight-900
    sceneRef.current = scene;

    // Camera setup
    const camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 1000);
    camera.position.set(15, 15, 15);
    camera.lookAt(0, 0, 0);
    cameraRef.current = camera;

    // Renderer setup
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(window.devicePixelRatio);
    containerRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Orbit controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.autoRotate = autoRotate;
    controls.autoRotateSpeed = 2.0;
    controlsRef.current = controls;

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);

    const directionalLight1 = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight1.position.set(5, 10, 5);
    scene.add(directionalLight1);

    const directionalLight2 = new THREE.DirectionalLight(0xffffff, 0.4);
    directionalLight2.position.set(-5, 5, -5);
    scene.add(directionalLight2);

    // Grid helper
    if (showGrid) {
      const gridHelper = new THREE.GridHelper(20, 20, 0x7a49d9, 0x2a2040);
      scene.add(gridHelper);
    }

    // Axes helper (small, for reference)
    const axesHelper = new THREE.AxesHelper(2);
    scene.add(axesHelper);

    // Build model
    buildModel(scene, modelData);

    // Animation loop
    const animate = () => {
      frameIdRef.current = requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    // Cleanup
    return () => {
      if (frameIdRef.current) {
        cancelAnimationFrame(frameIdRef.current);
      }
      controls.dispose();
      renderer.dispose();
      if (containerRef.current && renderer.domElement) {
        containerRef.current.removeChild(renderer.domElement);
      }
    };
  }, [modelData, width, height, showGrid, autoRotate]);

  return (
    <div ref={containerRef} className="overflow-hidden rounded-lg border border-accent/30" style={{ width, height }} />
  );
}

function buildModel(scene: THREE.Scene, modelData: ModelData) {
  const group = new THREE.Group();

  // Apply global rotation if specified
  if (modelData.rotation) {
    group.rotation.set(modelData.rotation[0], modelData.rotation[1], modelData.rotation[2]);
  }

  // Apply global scale if specified
  if (modelData.scale) {
    group.scale.set(modelData.scale[0], modelData.scale[1], modelData.scale[2]);
  }

  // Build each part
  for (const part of modelData.parts) {
    const mesh = createPartMesh(part);
    if (mesh) {
      group.add(mesh);
    }
  }

  scene.add(group);
}

function createPartMesh(part: ModelData['parts'][0]): THREE.Mesh | null {
  let geometry: THREE.BufferGeometry | null = null;

  // Create geometry based on shape type
  switch (part.shape) {
    case 'box':
      geometry = new THREE.BoxGeometry(part.scale[0], part.scale[1], part.scale[2]);
      break;
    case 'sphere':
      geometry = new THREE.SphereGeometry(Math.max(part.scale[0], part.scale[1], part.scale[2]) / 2, 32, 32);
      break;
    case 'cylinder':
      geometry = new THREE.CylinderGeometry(part.scale[0] / 2, part.scale[2] / 2, part.scale[1], 32);
      break;
    case 'cone':
      geometry = new THREE.ConeGeometry(part.scale[0] / 2, part.scale[1], 32);
      break;
    case 'capsule':
      geometry = new THREE.CapsuleGeometry(part.scale[0] / 2, part.scale[1], 32, 32);
      break;
    default:
      console.warn(`Unknown shape type: ${part.shape}`);
      return null;
  }

  // Create material with color
  const material = new THREE.MeshStandardMaterial({
    color: new THREE.Color(part.color),
    roughness: 0.7,
    metalness: 0.2,
  });

  // Create mesh
  const mesh = new THREE.Mesh(geometry, material);

  // Apply transformations
  mesh.position.set(part.position[0], part.position[1], part.position[2]);
  mesh.rotation.set(part.rotation[0], part.rotation[1], part.rotation[2]);

  return mesh;
}
