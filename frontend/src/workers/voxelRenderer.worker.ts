/**
 * Voxel Model Viewer Worker
 * Renders 3D voxel models using Three.js in OffscreenCanvas
 */

import './utils/threeShim';
import * as THREE from 'three';

let scene: THREE.Scene | null = null;
let camera: THREE.PerspectiveCamera | null = null;
let renderer: THREE.WebGLRenderer | null = null;
let model: THREE.Group | null = null;
let animationId: number | null = null;

// Camera control state (proxied from main thread)
const cameraRotation = { theta: 0, phi: Math.PI / 4 };
let cameraDistance = 10;

const VOXEL_SIZE = 0.5;

/**
 * Update camera position based on rotation angles
 */
function updateCameraPosition() {
  if (!camera) return;
  camera.position.x = cameraDistance * Math.sin(cameraRotation.phi) * Math.cos(cameraRotation.theta);
  camera.position.y = cameraDistance * Math.cos(cameraRotation.phi);
  camera.position.z = cameraDistance * Math.sin(cameraRotation.phi) * Math.sin(cameraRotation.theta);
  camera.lookAt(0, 0, 0);
}

/**
 * Initialize Three.js scene
 */
function initScene(canvas: OffscreenCanvas, width: number, height: number) {
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x0a0a0f);

  camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 1000);
  updateCameraPosition();

  renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
  renderer.setSize(width, height);

  // Add grid helper
  const gridHelper = new THREE.GridHelper(20, 20, 0x444444, 0x222222);
  scene.add(gridHelper);

  // Add lighting
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
  scene.add(ambientLight);

  const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
  directionalLight.position.set(10, 10, 5);
  scene.add(directionalLight);

  console.info('[VoxelWorker] Scene initialized');
}

/**
 * Create voxel model from voxel data
 */
function createVoxelModel(voxels: Array<{ x: number; y: number; z: number; color: string }>) {
  if (!scene) return;

  // Remove existing model
  if (model) {
    scene.remove(model);
    model.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        child.geometry.dispose();
        (child.material as THREE.Material).dispose();
      }
    });
  }

  model = new THREE.Group();

  // Create instanced mesh for better performance
  const geometry = new THREE.BoxGeometry(VOXEL_SIZE, VOXEL_SIZE, VOXEL_SIZE);

  // Group voxels by color for instancing
  const voxelsByColor = new Map<string, Array<{ x: number; y: number; z: number }>>();

  voxels.forEach((voxel) => {
    if (!voxelsByColor.has(voxel.color)) {
      voxelsByColor.set(voxel.color, []);
    }
    voxelsByColor.get(voxel.color)!.push(voxel);
  });

  // Create instanced mesh for each color
  voxelsByColor.forEach((positions, color) => {
    const material = new THREE.MeshStandardMaterial({
      color: new THREE.Color(color),
      metalness: 0.2,
      roughness: 0.6,
    });

    const instancedMesh = new THREE.InstancedMesh(geometry, material, positions.length);

    positions.forEach((pos, index) => {
      const matrix = new THREE.Matrix4();
      matrix.setPosition(pos.x * VOXEL_SIZE, pos.y * VOXEL_SIZE, pos.z * VOXEL_SIZE);
      instancedMesh.setMatrixAt(index, matrix);
    });

    instancedMesh.instanceMatrix.needsUpdate = true;
    model!.add(instancedMesh);
  });

  // Center model
  const box = new THREE.Box3().setFromObject(model);
  const center = box.getCenter(new THREE.Vector3());
  model.position.sub(center);

  scene.add(model);
  console.info(`[VoxelWorker] Created model with ${voxels.length} voxels`);
}

/**
 * Animate scene
 */
function animate() {
  if (!scene || !camera || !renderer) return;

  animationId = self.requestAnimationFrame(animate) as unknown as number;

  // Optional: slowly rotate model
  if (model) {
    model.rotation.y += 0.005;
  }

  renderer.render(scene, camera);
}

/**
 * Handle camera control updates from main thread
 */
function updateCamera(delta: { theta?: number; phi?: number; distance?: number }) {
  if (delta.theta !== undefined) {
    cameraRotation.theta += delta.theta;
  }
  if (delta.phi !== undefined) {
    cameraRotation.phi = Math.max(0.1, Math.min(Math.PI - 0.1, cameraRotation.phi + delta.phi));
  }
  if (delta.distance !== undefined) {
    cameraDistance = Math.max(2, Math.min(50, cameraDistance + delta.distance));
  }

  updateCameraPosition();
}

/**
 * Stop animation
 */
function stopAnimation() {
  if (animationId !== null) {
    self.cancelAnimationFrame(animationId);
    animationId = null;
  }
}

/**
 * Resize renderer
 */
function resize(width: number, height: number) {
  if (renderer && camera) {
    renderer.setSize(width, height);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
  }
}

/**
 * Cleanup resources
 */
function dispose() {
  stopAnimation();

  if (scene && model) {
    scene.remove(model);
    model.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        child.geometry.dispose();
        (child.material as THREE.Material).dispose();
      }
    });
    model = null;
  }

  if (renderer) {
    renderer.dispose();
    renderer = null;
  }

  scene = null;
  camera = null;

  console.info('[VoxelWorker] Resources disposed');
}

// Message handler
self.onmessage = (e: MessageEvent) => {
  const { type, data } = e.data;

  switch (type) {
    case 'init':
      initScene(data.canvas, data.width, data.height);
      if (data.autoStart) {
        animate();
      }
      break;

    case 'load-model':
      createVoxelModel(data.voxels);
      break;

    case 'update-camera':
      updateCamera(data);
      break;

    case 'start-animation':
      animate();
      break;

    case 'stop-animation':
      stopAnimation();
      break;

    case 'resize':
      resize(data.width, data.height);
      break;

    case 'dispose':
      dispose();
      break;

    default:
      console.warn('[VoxelWorker] Unknown message type:', type);
  }
};

export {};
