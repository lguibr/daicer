import { useEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';

import { createDie } from '../dice-loader/createDie';
import type { DiceRollAnimationProps, DieAnimationState, DieRoll } from './types';
import { generateRandomDieColor } from '../dice-loader/utils';
import { getTargetRotationForFace } from './calculateTargetRotation';
import { getColorForResult, lerpColor } from './colorUtils';

interface DieInstance {
  group: THREE.Group;
  state: DieAnimationState;
  dieRoll: DieRoll;
  startColor?: THREE.Color;
  targetColor?: THREE.Color;
}

interface ThreeState {
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  renderer: THREE.WebGLRenderer;
  axes?: THREE.AxesHelper;
  diceGroup?: THREE.Group;
  dice: DieInstance[];
}

const SIZE_MAP = {
  small: 1.2, // Increased from 0.8 for better visibility in cards
  medium: 1,
  large: 1.3,
};

const CONTAINER_SIZE_MAP = {
  small: 200,
  medium: 280,
  large: 380,
};

// Fixed positioning patterns for clear, non-overlapping dice layout
function getFixedDicePositions(count: number): Array<{ x: number; y: number; z: number }> {
  switch (count) {
    case 1:
      // Center
      return [{ x: 0, y: 0, z: 0 }];

    case 2:
      // Left and right - closer together for better visibility
      return [
        { x: -1.0, y: 0, z: 0 }, // Changed from -1.5
        { x: 1.0, y: 0, z: 0 }, // Changed from 1.5
      ];

    case 3:
      // Triangle: top center, bottom left, bottom right
      return [
        { x: 0, y: 1, z: 0 },
        { x: -1.2, y: -0.8, z: 0 },
        { x: 1.2, y: -0.8, z: 0 },
      ];

    case 4:
      // Square corners
      return [
        { x: -1.2, y: 1.2, z: 0 },
        { x: 1.2, y: 1.2, z: 0 },
        { x: -1.2, y: -1.2, z: 0 },
        { x: 1.2, y: -1.2, z: 0 },
      ];

    case 5:
      // 4 corners + center
      return [
        { x: 0, y: 0, z: 0 },
        { x: -1.5, y: 1.5, z: 0 },
        { x: 1.5, y: 1.5, z: 0 },
        { x: -1.5, y: -1.5, z: 0 },
        { x: 1.5, y: -1.5, z: 0 },
      ];

    case 6:
      // Hexagon arrangement
      return [
        { x: 0, y: 1.8, z: 0 },
        { x: 1.56, y: 0.9, z: 0 },
        { x: 1.56, y: -0.9, z: 0 },
        { x: 0, y: -1.8, z: 0 },
        { x: -1.56, y: -0.9, z: 0 },
        { x: -1.56, y: 0.9, z: 0 },
      ];

    default:
      // For more than 6, use circular arrangement with proper spacing
      const positions: Array<{ x: number; y: number; z: number }> = [];
      const radius = 1.2 + count * 0.15;
      for (let i = 0; i < count; i++) {
        const angle = (i / count) * Math.PI * 2;
        positions.push({
          x: Math.cos(angle) * radius,
          y: Math.sin(angle) * radius,
          z: 0,
        });
      }
      return positions;
  }
}

// Fast rotation speeds for rolling phase
const ROLL_SPEED_BASE = { x: 0.2, y: 0.25, z: 0.175 };
const ROLL_SPEED_VARIATION = { x: 0.1, y: 0.15, z: 0.075 };

// Animation timing
const ROLL_DURATION = 1000; // Fast roll phase duration in ms
const DECEL_DURATION = 600; // Deceleration phase duration in ms
const DISPLAY_DURATION = 2000; // Display final result for 2 seconds
const STAGGER_MIN = 100; // Minimum stagger between dice
const STAGGER_MAX = 300; // Maximum stagger between dice

function randomBetween(min: number, max: number): number {
  return min + Math.random() * (max - min);
}

function easeOutCubic(t: number): number {
  return 1 - (1 - t) ** 3;
}

function disposeMaterial(material: THREE.Material | THREE.Material[]): void {
  if (Array.isArray(material)) {
    material.forEach(disposeMaterial);
    return;
  }
  const mat = material as THREE.Material & { map?: THREE.Texture | null };
  if (mat.map) {
    mat.map.dispose();
  }
  material.dispose();
}

function disposeDieGroup(group: THREE.Group | undefined): void {
  if (!group) {
    return;
  }
  group.traverse((object: THREE.Object3D) => {
    if (object instanceof THREE.Mesh) {
      object.geometry.dispose();
      const { material } = object;
      if (material) {
        disposeMaterial(material);
      }
    }
  });
}

export function DiceRollAnimation({
  dice,
  size = 'medium',
  onComplete,
  showAxes = false,
  className,
  style,
  autoStart = true,
  colorByResult = true, // DEFAULT ON: dice morph color based on result (red=bad, green=good)
}: DiceRollAnimationProps) {
  const mountRef = useRef<HTMLDivElement>(null);
  const animationFrameRef = useRef<number>();
  const stateRef = useRef<ThreeState | null>(null);
  const [isComplete, setIsComplete] = useState(false);

  const canvasStyle = useMemo(() => {
    // Use explicit style dimensions if provided, otherwise use size map
    if (style?.width && style?.height) {
      return {
        ...style,
        position: 'relative' as const,
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
      };
    }

    const baseSize = CONTAINER_SIZE_MAP[size] ?? CONTAINER_SIZE_MAP.medium;
    return {
      width: `${baseSize}px`,
      height: `${baseSize}px`,
      position: 'relative' as const,
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      ...style,
    };
  }, [size, style]);

  const rootClassName = className
    ? `flex flex-col items-center gap-3 ${className}`
    : 'flex flex-col items-center gap-3';

  // Initialize Three.js scene
  useEffect(() => {
    if (!mountRef.current || !autoStart) {
      return undefined;
    }

    const mountElement = mountRef.current;

    // Wait for valid dimensions to prevent WebGL zero-size errors
    const width = mountElement.clientWidth || CONTAINER_SIZE_MAP[size] || 280;
    const height = mountElement.clientHeight || CONTAINER_SIZE_MAP[size] || 280;

    if (width === 0 || height === 0) {
      console.warn('DiceRollAnimation: Container has zero dimensions, skipping initialization');
      return undefined;
    }

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    // Closer camera for small size (cards) to make dice appear larger
    const cameraDistance = size === 'small' ? 4.5 : 7.5;
    camera.position.set(0, 0, cameraDistance);

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance',
      failIfMajorPerformanceCaveat: false,
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2)); // Cap at 2x for performance
    renderer.setSize(width, height, false);
    mountElement.appendChild(renderer.domElement);

    const ambientLight = new THREE.AmbientLight(0xffffff, 1.3);
    const directionalLight = new THREE.DirectionalLight(0xffffff, 1.9);
    directionalLight.position.set(4, 6, 5);
    scene.add(ambientLight, directionalLight);

    const axes = new THREE.AxesHelper(2.5);
    scene.add(axes);

    stateRef.current = { scene, camera, renderer, axes, dice: [] };

    const handleResize = () => {
      if (!mountElement || !stateRef.current) return;
      const { camera: currentCamera, renderer: currentRenderer } = stateRef.current;
      const width = mountElement.clientWidth || CONTAINER_SIZE_MAP[size] || 280;
      const height = mountElement.clientHeight || CONTAINER_SIZE_MAP[size] || 280;

      // Skip resize if dimensions are invalid
      if (width === 0 || height === 0) return;

      currentCamera.aspect = width / height;
      currentCamera.updateProjectionMatrix();
      currentRenderer.setSize(width, height, false);
    };

    const animate = () => {
      animationFrameRef.current = requestAnimationFrame(animate);
      const currentState = stateRef.current;
      if (currentState?.dice.length) {
        const now = Date.now();
        let allComplete = true;

        currentState.dice.forEach((instance) => {
          const { group: dieGroup, state: animState, startColor, targetColor } = instance;
          const elapsed = now - animState.startTime - animState.completionDelay;

          if (animState.phase === 'rolling') {
            // Fast rolling phase
            dieGroup.rotation.x += animState.rotationSpeed.x;
            dieGroup.rotation.y += animState.rotationSpeed.y;
            dieGroup.rotation.z += animState.rotationSpeed.z;

            if (elapsed >= ROLL_DURATION) {
              animState.phase = 'decelerating';
              // Store current rotation
              animState.currentRotation = {
                x: dieGroup.rotation.x,
                y: dieGroup.rotation.y,
                z: dieGroup.rotation.z,
              };
            }
            allComplete = false;
          } else if (animState.phase === 'decelerating') {
            // Deceleration phase with easing
            const decelElapsed = elapsed - ROLL_DURATION;
            const progress = Math.min(decelElapsed / DECEL_DURATION, 1);
            const easedProgress = easeOutCubic(progress);

            // Interpolate to target rotation
            dieGroup.rotation.x =
              animState.currentRotation.x + (animState.targetRotation.x - animState.currentRotation.x) * easedProgress;
            dieGroup.rotation.y =
              animState.currentRotation.y + (animState.targetRotation.y - animState.currentRotation.y) * easedProgress;
            dieGroup.rotation.z =
              animState.currentRotation.z + (animState.targetRotation.z - animState.currentRotation.z) * easedProgress;

            // Smooth color transition if colorByResult is enabled
            if (startColor && targetColor) {
              const interpolatedColor = lerpColor(startColor, targetColor, easedProgress);
              dieGroup.traverse((child) => {
                if (child instanceof THREE.Mesh && child.material instanceof THREE.MeshStandardMaterial) {
                  child.material.color.copy(interpolatedColor);
                }
              });
            }

            if (progress >= 1) {
              animState.phase = 'displaying';
              // Snap to exact target rotation
              dieGroup.rotation.x = animState.targetRotation.x;
              dieGroup.rotation.y = animState.targetRotation.y;
              dieGroup.rotation.z = animState.targetRotation.z;

              // Snap to exact target color
              if (startColor && targetColor) {
                dieGroup.traverse((child) => {
                  if (child instanceof THREE.Mesh && child.material instanceof THREE.MeshStandardMaterial) {
                    child.material.color.copy(targetColor);
                  }
                });
              }
            }
            allComplete = false;
          } else if (animState.phase === 'displaying') {
            // Display phase - hold the result for 2 seconds
            const displayElapsed = elapsed - ROLL_DURATION - DECEL_DURATION;

            if (displayElapsed >= DISPLAY_DURATION) {
              animState.phase = 'complete';
            } else {
              allComplete = false;
            }
          }
        });

        if (allComplete && !isComplete) {
          setIsComplete(true);
          if (onComplete) {
            onComplete();
          }
        }
      }
      renderer.render(scene, camera);
    };

    animate();
    const resizeObserver = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(() => handleResize()) : null;
    if (resizeObserver) {
      resizeObserver.observe(mountElement);
    }
    window.addEventListener('resize', handleResize);

    return () => {
      if (resizeObserver) {
        resizeObserver.disconnect();
      }
      window.removeEventListener('resize', handleResize);
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = undefined;
      }
      if (!stateRef.current) {
        return;
      }
      const { scene: currentScene, renderer: currentRenderer, diceGroup, dice: diceInstances } = stateRef.current;

      // Dispose all dice instances
      if (diceInstances && diceInstances.length > 0) {
        diceInstances.forEach(({ group }) => {
          disposeDieGroup(group);
        });
      }

      // Dispose dice group
      if (diceGroup) {
        currentScene.remove(diceGroup);
        disposeDieGroup(diceGroup);
      }

      // Dispose scene objects
      currentScene.traverse((object: THREE.Object3D) => {
        if (object instanceof THREE.Mesh) {
          object.geometry.dispose();
          const { material } = object;
          if (material) {
            disposeMaterial(material);
          }
        }
      });

      // Properly dispose renderer and force context loss
      currentRenderer.dispose();
      // Try to force context loss (only works in browser with real WebGL)
      try {
        const gl = currentRenderer.getContext();
        const ext = gl?.getExtension?.('WEBGL_lose_context');
        if (ext) {
          ext.loseContext();
        }
      } catch (e) {
        // Ignore in test environment
      }
      const canvas = currentRenderer.domElement;
      if (mountElement && mountElement.contains(canvas)) {
        mountElement.removeChild(canvas);
      }

      stateRef.current = null;
    };
  }, [autoStart, onComplete, isComplete]);

  // Create and position dice
  useEffect(() => {
    if (!stateRef.current || !autoStart) return;

    const currentState = stateRef.current;
    const { scene } = currentState;

    if (!currentState.diceGroup) {
      currentState.diceGroup = new THREE.Group();
      currentState.diceGroup.name = 'dice-collection';
      scene.add(currentState.diceGroup);
    }

    currentState.diceGroup.scale.set(1, 1, 1);
    currentState.diceGroup.position.set(0, 0, 0);

    if (currentState.dice.length) {
      currentState.dice.forEach(({ group }) => {
        currentState.diceGroup?.remove(group);
        disposeDieGroup(group);
      });
    }

    const startTime = Date.now();
    const fixedPositions = getFixedDicePositions(dice.length);

    const diceInstances: DieInstance[] = dice.map((dieRoll, index) => {
      const baseColor = dieRoll.color ?? generateRandomDieColor();
      const finalColor = colorByResult ? getColorForResult(dieRoll.type, dieRoll.result) : baseColor;

      const die = createDie(dieRoll.type, colorByResult ? baseColor : finalColor);

      // Use fixed position from pattern
      const position = fixedPositions[index] || { x: 0, y: 0, z: 0 };
      const { x } = position;
      const { y } = position;
      const { z } = position;

      const baseScale = 0.7;
      const scale = baseScale;

      die.scale.set(scale, scale, scale);
      die.position.set(x, y, z);

      // Random initial rotation
      die.rotation.set(randomBetween(0, Math.PI * 2), randomBetween(0, Math.PI * 2), randomBetween(0, Math.PI * 2));

      currentState.diceGroup?.add(die);

      // Get target rotation for the result number
      const targetRotation = getTargetRotationForFace(dieRoll.type, dieRoll.result);

      // Create animation state with staggered completion
      const completionDelay = randomBetween(STAGGER_MIN, STAGGER_MAX) * index;
      const state: DieAnimationState = {
        phase: 'rolling',
        startTime,
        completionDelay,
        currentRotation: { x: 0, y: 0, z: 0 },
        rotationSpeed: {
          x: randomBetween(ROLL_SPEED_BASE.x, ROLL_SPEED_BASE.x + ROLL_SPEED_VARIATION.x),
          y: randomBetween(ROLL_SPEED_BASE.y, ROLL_SPEED_BASE.y + ROLL_SPEED_VARIATION.y),
          z: randomBetween(ROLL_SPEED_BASE.z, ROLL_SPEED_BASE.z + ROLL_SPEED_VARIATION.z),
        },
        targetRotation,
      };

      return {
        group: die,
        state,
        dieRoll,
        startColor: colorByResult ? new THREE.Color(baseColor) : undefined,
        targetColor: colorByResult ? new THREE.Color(finalColor) : undefined,
      };
    });

    currentState.dice = diceInstances;

    // Scale the entire group to fit
    if (currentState.diceGroup) {
      const boundingBox = new THREE.Box3().setFromObject(currentState.diceGroup);
      const sizeVector = boundingBox.getSize(new THREE.Vector3());
      const maxAxis = Math.max(sizeVector.x, sizeVector.y, sizeVector.z, 1);
      const baseMultiplier = SIZE_MAP[size] ?? SIZE_MAP.medium;
      const desiredMax = baseMultiplier * 3.0; // Increased from 2.6 for bigger dice in cards
      const uniformScale = Math.min(baseMultiplier * 1.1, desiredMax / maxAxis); // Boost by 10%
      currentState.diceGroup.scale.set(uniformScale, uniformScale, uniformScale);
      const center = boundingBox.getCenter(new THREE.Vector3());
      currentState.diceGroup.position.set(-center.x, -center.y, -center.z);
    }
  }, [dice, size, autoStart]);

  // Update axes visibility
  useEffect(() => {
    if (!stateRef.current?.axes) return;
    stateRef.current.axes.visible = showAxes;
  }, [showAxes]);

  return (
    <div className={rootClassName} style={style}>
      <div
        ref={mountRef}
        className="relative flex items-center justify-center"
        style={canvasStyle}
        data-dice-count={dice.length}
        data-animation-complete={isComplete}
      />
    </div>
  );
}
