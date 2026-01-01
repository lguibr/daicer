/**
 * Dice Renderer Worker
 * Renders 3D dice using Three.js in OffscreenCanvas to prevent UI blocking
 */

import './utils/threeShim';
import * as THREE from 'three';

let scene: THREE.Scene | null = null;
let camera: THREE.PerspectiveCamera | null = null;
let renderer: THREE.WebGLRenderer | null = null;
let dice: THREE.Mesh[] = [];
let animationId: number | null = null;

const DICE_SIZE = 1.0;
const DICE_SPACING = 1.5;

/**
 * Create a D20 geometry
 */
function createD20Geometry(): THREE.PolyhedronGeometry {
  // D20 vertices
  const vertices = [
    0, 1.618, 1, 0, 1.618, -1, 0, -1.618, 1, 0, -1.618, -1, 1.618, 1, 0, 1.618, -1, 0, -1.618, 1, 0, -1.618, -1, 0, 1,
    0, 1.618, -1, 0, 1.618, 1, 0, -1.618, -1, 0, -1.618,
  ];

  // D20 faces (indices)
  const indices = [
    0, 8, 4, 0, 4, 1, 0, 1, 6, 0, 6, 9, 0, 9, 8, 8, 2, 5, 8, 5, 4, 4, 5, 10, 4, 10, 1, 1, 10, 11, 1, 11, 6, 6, 11, 7, 6,
    7, 9, 9, 7, 2, 9, 2, 8, 3, 11, 10, 3, 10, 5, 3, 5, 2, 3, 2, 7, 3, 7, 11,
  ];

  return new THREE.PolyhedronGeometry(vertices, indices, DICE_SIZE, 0);
}

/**
 * Create a D6 geometry
 */
function createD6Geometry(): THREE.BoxGeometry {
  return new THREE.BoxGeometry(DICE_SIZE, DICE_SIZE, DICE_SIZE);
}

/**
 * Initialize Three.js scene
 */
function initScene(canvas: OffscreenCanvas, width: number, height: number) {
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x0a0a0f);

  camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 1000);
  camera.position.z = 5;

  renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
  renderer.setSize(width, height);

  // Add lighting
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
  scene.add(ambientLight);

  const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
  directionalLight.position.set(5, 10, 5);
  scene.add(directionalLight);

  console.info('[DiceWorker] Scene initialized');
}

/**
 * Add dice to scene
 */
function addDice(count: number, type: 'd6' | 'd20') {
  if (!scene) return;

  // Clear existing dice
  dice.forEach((die) => scene!.remove(die));
  dice = [];

  const geometry = type === 'd6' ? createD6Geometry() : createD20Geometry();
  const material = new THREE.MeshStandardMaterial({
    color: 0x4a90e2,
    metalness: 0.3,
    roughness: 0.4,
  });

  for (let i = 0; i < count; i++) {
    const die = new THREE.Mesh(geometry, material.clone());

    // Position in a line
    die.position.x = (i - count / 2) * DICE_SPACING;
    die.position.y = 0;
    die.rotation.x = Math.random() * Math.PI;
    die.rotation.y = Math.random() * Math.PI;

    scene.add(die);
    dice.push(die);
  }

  console.info(`[DiceWorker] Added ${count} ${type} dice`);
}

/**
 * Animate dice
 */
function animate() {
  if (!scene || !camera || !renderer) return;

  animationId = self.requestAnimationFrame(animate) as unknown as number;

  // Rotate all dice
  dice.forEach((die, index) => {
    die.rotation.x += 0.01 + index * 0.002;
    die.rotation.y += 0.01 + index * 0.002;
  });

  renderer.render(scene, camera);
}

/**
 * Roll animation (fast spin then settle)
 */
function rollDice(results: number[]) {
  if (dice.length !== results.length) {
    console.warn('[DiceWorker] Dice count mismatch');
    return;
  }

  let frame = 0;
  const SPIN_FRAMES = 60;

  const spinAnimation = () => {
    frame++;

    dice.forEach((die, index) => {
      // Fast spin
      die.rotation.x += 0.3;
      die.rotation.y += 0.3;

      // Settle on result
      if (frame === SPIN_FRAMES) {
        // Map result to rotation (simplified)
        const result = results[index];
        if (result !== undefined) {
          die.rotation.x = (result / 20) * Math.PI * 2;
          die.rotation.y = (result / 20) * Math.PI * 2;
        }
      }
    });

    if (frame < SPIN_FRAMES) {
      self.requestAnimationFrame(spinAnimation);
    } else {
      self.postMessage({ type: 'roll-complete', results });
    }
  };

  spinAnimation();
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

  if (scene) {
    dice.forEach((die) => {
      die.geometry.dispose();
      (die.material as THREE.Material).dispose();
      scene!.remove(die);
    });
    dice = [];
  }

  if (renderer) {
    renderer.dispose();
    renderer = null;
  }

  scene = null;
  camera = null;

  console.info('[DiceWorker] Resources disposed');
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

    case 'add-dice':
      addDice(data.count, data.diceType || 'd20');
      break;

    case 'start-animation':
      animate();
      break;

    case 'stop-animation':
      stopAnimation();
      break;

    case 'roll':
      rollDice(data.results);
      break;

    case 'resize':
      resize(data.width, data.height);
      break;

    case 'dispose':
      dispose();
      break;

    default:
      console.warn('[DiceWorker] Unknown message type:', type);
  }
};

export {};
