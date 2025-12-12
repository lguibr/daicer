/**
 * @file frontend/src/workers/tacticalRenderer.worker.ts
 * @description Web worker for 3D tactical arena rendering with Three.js
 */

import './utils/threeShim.ts';
import * as THREE from 'three';
import type { GridCell, TacticalUnit } from '../types/tactical';

let scene: THREE.Scene | null = null;
let camera: THREE.PerspectiveCamera | null = null;
let renderer: THREE.WebGLRenderer | null = null;
let animationFrameId: number | null = null;

const CELL_SIZE = 1;
const GRID_OFFSET_X = -7.5;
const GRID_OFFSET_Z = -7.5;

// ============================================================================
// Worker Message Handler
// ============================================================================

self.onmessage = (e: MessageEvent) => {
  const { type, data } = e.data;

  try {
    switch (type) {
      case 'init':
        initScene(data.canvas, data.width, data.height);
        self.postMessage({ type: 'ready' });
        break;

      case 'render-arena':
        renderArena(data.cells, data.units);
        self.postMessage({ type: 'rendered' });
        break;

      case 'update-camera':
        updateCamera(data.position, data.target);
        break;

      case 'highlight-cells':
        highlightCells(data.positions);
        break;

      case 'clear-highlights':
        clearHighlights();
        break;

      case 'dispose':
        dispose();
        self.postMessage({ type: 'disposed' });
        break;

      default:
        // eslint-disable-next-line no-console
        console.warn(`Unknown message type: ${type}`);
    }
  } catch (error) {
    self.postMessage({
      type: 'error',
      error: error instanceof Error ? error.message : String(error),
    });
  }
};

// ============================================================================
// Scene Initialization
// ============================================================================

function initScene(canvas: OffscreenCanvas, width: number, height: number): void {
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x1a1a2e);

  // Camera
  camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
  camera.position.set(0, 20, 20);
  camera.lookAt(0, 0, 0);

  // Renderer
  renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: true,
    alpha: false,
  });
  renderer.setSize(width, height);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  // Lights
  const ambientLight = new THREE.AmbientLight(0x404040, 0.5);
  scene.add(ambientLight);

  const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
  directionalLight.position.set(10, 20, 10);
  directionalLight.castShadow = true;
  directionalLight.shadow.mapSize.width = 2048;
  directionalLight.shadow.mapSize.height = 2048;
  directionalLight.shadow.camera.near = 0.5;
  directionalLight.shadow.camera.far = 50;
  directionalLight.shadow.camera.left = -20;
  directionalLight.shadow.camera.right = 20;
  directionalLight.shadow.camera.top = 20;
  directionalLight.shadow.camera.bottom = -20;
  scene.add(directionalLight);

  // Grid helper
  const gridHelper = new THREE.GridHelper(15, 15, 0x444444, 0x222222);
  gridHelper.position.set(0, 0, 0);
  scene.add(gridHelper);

  // Start animation loop
  animate();
}

// ============================================================================
// Rendering
// ============================================================================

function renderArena(cells: GridCell[], units: TacticalUnit[]): void {
  if (!scene) return;

  // Clear previous terrain meshes (keep lights, camera, grid)
  const objectsToRemove: THREE.Object3D[] = [];
  scene.traverse((obj) => {
    if (obj.userData.type === 'terrain' || obj.userData.type === 'unit') {
      objectsToRemove.push(obj);
    }
  });
  objectsToRemove.forEach((obj) => scene!.remove(obj));

  // Render terrain
  cells.forEach((cell) => {
    const mesh = createTerrainMesh(cell);
    if (mesh) {
      scene!.add(mesh);
    }
  });

  // Render units
  units.forEach((unit) => {
    const mesh = createUnitMesh(unit);
    if (mesh) {
      scene!.add(mesh);
    }
  });
}

function createTerrainMesh(cell: GridCell): THREE.Group | null {
  const group = new THREE.Group();
  group.userData.type = 'terrain';
  group.userData.cellId = `${cell.x}-${cell.y}`;
  group.position.set(cell.x * CELL_SIZE + GRID_OFFSET_X, 0, cell.y * CELL_SIZE + GRID_OFFSET_Z);

  const { terrain } = cell;

  switch (terrain) {
    case 'floor': {
      const floor = new THREE.Mesh(
        new THREE.BoxGeometry(CELL_SIZE, 0.1, CELL_SIZE),
        new THREE.MeshStandardMaterial({
          color: 0x8b7355,
          roughness: 0.8,
        })
      );
      floor.position.y = 0.05;
      floor.receiveShadow = true;
      group.add(floor);
      break;
    }

    case 'wall': {
      const wall = new THREE.Mesh(
        new THREE.BoxGeometry(CELL_SIZE, 3, CELL_SIZE),
        new THREE.MeshStandardMaterial({
          color: 0x505050,
          roughness: 0.9,
        })
      );
      wall.position.y = 1.5;
      wall.castShadow = true;
      wall.receiveShadow = true;
      group.add(wall);
      break;
    }

    case 'difficult': {
      const base = new THREE.Mesh(
        new THREE.BoxGeometry(CELL_SIZE, 0.1, CELL_SIZE),
        new THREE.MeshStandardMaterial({
          color: 0x6b4423,
          roughness: 0.9,
        })
      );
      base.position.y = 0.05;
      base.receiveShadow = true;
      group.add(base);
      break;
    }

    case 'cover_half': {
      const base = new THREE.Mesh(
        new THREE.BoxGeometry(CELL_SIZE, 0.1, CELL_SIZE),
        new THREE.MeshStandardMaterial({ color: 0x8b7355 })
      );
      base.position.y = 0.05;
      base.receiveShadow = true;
      group.add(base);

      const cover = new THREE.Mesh(
        new THREE.BoxGeometry(CELL_SIZE * 0.8, 1, CELL_SIZE * 0.2),
        new THREE.MeshStandardMaterial({ color: 0x556b2f })
      );
      cover.position.y = 0.5;
      cover.castShadow = true;
      group.add(cover);
      break;
    }

    case 'cover_full': {
      const base = new THREE.Mesh(
        new THREE.BoxGeometry(CELL_SIZE, 0.1, CELL_SIZE),
        new THREE.MeshStandardMaterial({ color: 0x8b7355 })
      );
      base.position.y = 0.05;
      base.receiveShadow = true;
      group.add(base);

      const cover = new THREE.Mesh(
        new THREE.BoxGeometry(CELL_SIZE * 0.8, 2, CELL_SIZE * 0.3),
        new THREE.MeshStandardMaterial({ color: 0x556b2f })
      );
      cover.position.y = 1;
      cover.castShadow = true;
      group.add(cover);
      break;
    }

    case 'hazard': {
      const hazard = new THREE.Mesh(
        new THREE.BoxGeometry(CELL_SIZE, 0.2, CELL_SIZE),
        new THREE.MeshStandardMaterial({
          color: 0xff4500,
          emissive: 0xff4500,
          emissiveIntensity: 0.3,
        })
      );
      hazard.position.y = 0.1;
      group.add(hazard);
      break;
    }

    case 'elevation_high': {
      const elevated = new THREE.Mesh(
        new THREE.BoxGeometry(CELL_SIZE, 1, CELL_SIZE),
        new THREE.MeshStandardMaterial({ color: 0x9b8b7e })
      );
      elevated.position.y = 0.5;
      elevated.castShadow = true;
      elevated.receiveShadow = true;
      group.add(elevated);
      break;
    }

    case 'elevation_low': {
      const lowered = new THREE.Mesh(
        new THREE.BoxGeometry(CELL_SIZE, 0.1, CELL_SIZE),
        new THREE.MeshStandardMaterial({ color: 0x665544 })
      );
      lowered.position.y = -0.5;
      lowered.receiveShadow = true;
      group.add(lowered);
      break;
    }
  }

  return group;
}

function createUnitMesh(unit: TacticalUnit): THREE.Group {
  const group = new THREE.Group();
  group.userData.type = 'unit';
  group.userData.unitId = unit.id;
  group.position.set(unit.position.x * CELL_SIZE + GRID_OFFSET_X, 1, unit.position.y * CELL_SIZE + GRID_OFFSET_Z);

  // Simple cylinder for unit representation
  const color = unit.allegiance === 'player' ? 0x4a90e2 : unit.allegiance === 'enemy' ? 0xe74c3c : 0xf39c12;

  const unitMesh = new THREE.Mesh(
    new THREE.CylinderGeometry(0.3, 0.3, 1.8, 16),
    new THREE.MeshStandardMaterial({
      color,
      metalness: 0.2,
      roughness: 0.7,
    })
  );
  unitMesh.castShadow = true;
  group.add(unitMesh);

  // HP indicator ring
  const hpRatio = unit.hp / unit.maxHp;
  const hpColor = hpRatio > 0.5 ? 0x2ecc71 : hpRatio > 0.25 ? 0xf39c12 : 0xe74c3c;
  const hpRing = new THREE.Mesh(
    new THREE.RingGeometry(0.35, 0.4, 32),
    new THREE.MeshBasicMaterial({ color: hpColor, side: THREE.DoubleSide })
  );
  hpRing.rotation.x = -Math.PI / 2;
  hpRing.position.y = 1;
  group.add(hpRing);

  return group;
}

// ============================================================================
// Camera Control
// ============================================================================

function updateCamera(
  position: { x: number; y: number; z: number },
  target?: { x: number; y: number; z: number }
): void {
  if (!camera) return;

  camera.position.set(position.x, position.y, position.z);
  if (target) {
    camera.lookAt(target.x, target.y, target.z);
  }
}

// ============================================================================
// Highlight Management
// ============================================================================

const highlights = new Map<string, THREE.Mesh>();

function highlightCells(positions: Array<{ x: number; y: number; color?: string }>): void {
  if (!scene) return;

  clearHighlights();

  positions.forEach(({ x, y, color = '#ffff00' }) => {
    const highlightMesh = new THREE.Mesh(
      new THREE.PlaneGeometry(CELL_SIZE * 0.9, CELL_SIZE * 0.9),
      new THREE.MeshBasicMaterial({
        color: new THREE.Color(color),
        transparent: true,
        opacity: 0.3,
        side: THREE.DoubleSide,
      })
    );
    highlightMesh.rotation.x = -Math.PI / 2;
    highlightMesh.position.set(x * CELL_SIZE + GRID_OFFSET_X, 0.11, y * CELL_SIZE + GRID_OFFSET_Z);

    const key = `${x}-${y}`;
    highlights.set(key, highlightMesh);
    scene!.add(highlightMesh);
  });
}

function clearHighlights(): void {
  highlights.forEach((mesh) => {
    scene?.remove(mesh);
    mesh.geometry.dispose();
    (mesh.material as THREE.Material).dispose();
  });
  highlights.clear();
}

// ============================================================================
// Animation Loop
// ============================================================================

function animate(): void {
  if (!renderer || !scene || !camera) return;

  animationFrameId = requestAnimationFrame(animate);
  renderer.render(scene, camera);
}

// ============================================================================
// Cleanup
// ============================================================================

function dispose(): void {
  if (animationFrameId !== null) {
    cancelAnimationFrame(animationFrameId);
    animationFrameId = null;
  }

  clearHighlights();

  if (scene) {
    scene.traverse((obj) => {
      if (obj instanceof THREE.Mesh) {
        obj.geometry.dispose();
        if (Array.isArray(obj.material)) {
          obj.material.forEach((mat) => mat.dispose());
        } else {
          obj.material.dispose();
        }
      }
    });
    scene.clear();
    scene = null;
  }

  if (renderer) {
    renderer.dispose();
    renderer = null;
  }

  camera = null;
}
