import { useEffect, useRef, useState, type CSSProperties } from 'react';
import * as THREE from 'three';

import { createDie } from './createDie';
import type { DiceLoaderSize, DieVisualStyle } from './types';

export interface LogoDiceProps {
  size?: DiceLoaderSize;
  color?: string;
  visualStyle?: DieVisualStyle;
  showAxes?: boolean;
  className?: string;
  style?: CSSProperties;
  /** If true, dice animate: spin crazy → shake → stop with AI face up */
  animated?: boolean;
}

interface ThreeState {
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  renderer: THREE.WebGLRenderer;
  die?: THREE.Group;
}

type AnimationPhase = 'spinning' | 'shaking' | 'stopped';

const SIZE_MAP: Record<Required<LogoDiceProps>['size'], number> = {
  small: 0.8,
  medium: 1,
  large: 1.3,
};

const CONTAINER_SIZE_MAP: Record<Required<LogoDiceProps>['size'], number> = {
  small: 200,
  medium: 280,
  large: 380,
};

/**
 * LogoDice - Branded dice that displays D20 with custom faces:
 * - Face 20 → "AI"
 * - Face 8 → "D"
 * - Face 17 → "CER"
 *
 * Animation: Spin crazy → shake → stop with AI face pointing up
 */
export function LogoDice({
  size = 'medium',
  color = '#ff9500',
  visualStyle = 'glowing',
  showAxes = false,
  className,
  style,
  animated = true,
}: LogoDiceProps) {
  const mountRef = useRef<HTMLDivElement>(null);
  const animationFrameRef = useRef<number | undefined>(undefined);
  const stateRef = useRef<ThreeState | null>(null);
  const [phase, setPhase] = useState<AnimationPhase>('spinning');
  const startTimeRef = useRef<number>(0);

  const canvasStyle: CSSProperties = {
    width: `${CONTAINER_SIZE_MAP[size]}px`,
    height: `${CONTAINER_SIZE_MAP[size]}px`,
    position: 'relative',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
  };

  const rootClassName = className
    ? `flex flex-col items-center gap-3 ${className}`
    : 'flex flex-col items-center gap-3';

  useEffect(() => {
    if (!mountRef.current) return undefined;

    const mountElement = mountRef.current;
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
    // Adjust camera for better view of top face (AI) and side faces (D, CER)
    camera.position.set(0, 2, 6.5);
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(mountElement.clientWidth, mountElement.clientHeight, false);
    mountElement.appendChild(renderer.domElement);

    const ambientLight = new THREE.AmbientLight(0xffffff, 1.5);
    const directionalLight = new THREE.DirectionalLight(0xffffff, 2.2);
    directionalLight.position.set(4, 6, 5);
    const fillLight = new THREE.DirectionalLight(0xffffff, 0.8);
    fillLight.position.set(-2, -3, -3);
    scene.add(ambientLight, directionalLight, fillLight);

    if (showAxes) {
      const axes = new THREE.AxesHelper(2.5);
      scene.add(axes);
    }

    stateRef.current = { scene, camera, renderer };
    startTimeRef.current = Date.now();
    startTimeRef.current = Date.now();

    const die = createDie('20-ai', color, visualStyle);
    die.scale.set(SIZE_MAP[size] * 1.2, SIZE_MAP[size] * 1.2, SIZE_MAP[size] * 1.2);
    scene.add(die);
    stateRef.current.die = die;

    // Target rotation to show AI face prominently with D and CER visible on sides
    // Slight tilt to show the branding clearly
    const TARGET_ROTATION = new THREE.Euler(
      -0.2, // Tilt forward slightly to see top face (AI)
      0.3, // Rotate to show side faces (D, CER)
      0.1 // Small z rotation for dynamic look
    );

    const animate = () => {
      if (!stateRef.current?.die) return;

      const elapsed = (Date.now() - startTimeRef.current) / 1000;
      const currentPhase = phase;

      if (animated) {
        if (currentPhase === 'spinning') {
          // Crazy spin phase (0-2.5s)
          if (elapsed < 2.5) {
            stateRef.current.die.rotation.x += 0.18;
            stateRef.current.die.rotation.y += 0.25;
            stateRef.current.die.rotation.z += 0.21;
          } else {
            setPhase('shaking');
          }
        } else if (currentPhase === 'shaking') {
          // Shaking/slowing phase (2.5-5s)
          if (elapsed < 5) {
            const shakeFactor = (5 - elapsed) / 2.5;
            const shake = Math.sin(elapsed * 18) * 0.12 * shakeFactor;

            stateRef.current.die.rotation.x = THREE.MathUtils.lerp(
              stateRef.current.die.rotation.x,
              TARGET_ROTATION.x + shake,
              0.04
            );
            stateRef.current.die.rotation.y = THREE.MathUtils.lerp(
              stateRef.current.die.rotation.y,
              TARGET_ROTATION.y + shake,
              0.04
            );
            stateRef.current.die.rotation.z = THREE.MathUtils.lerp(
              stateRef.current.die.rotation.z,
              TARGET_ROTATION.z + shake,
              0.04
            );
          } else {
            setPhase('stopped');
          }
        } else if (currentPhase === 'stopped') {
          // Final settle - slow rotation to showcase D/AI/CER branding
          const settledTime = elapsed - 5;
          const gentleRotation = settledTime * 0.15; // Slow continuous rotation

          stateRef.current.die.rotation.x = THREE.MathUtils.lerp(
            stateRef.current.die.rotation.x,
            TARGET_ROTATION.x,
            0.08
          );
          stateRef.current.die.rotation.y = TARGET_ROTATION.y + gentleRotation;
          stateRef.current.die.rotation.z = THREE.MathUtils.lerp(
            stateRef.current.die.rotation.z,
            TARGET_ROTATION.z,
            0.08
          );
        }
      } else {
        // Static mode - show branding with gentle rotation
        const time = elapsed * 0.2;
        stateRef.current.die.rotation.x = TARGET_ROTATION.x;
        stateRef.current.die.rotation.y = TARGET_ROTATION.y + time;
        stateRef.current.die.rotation.z = TARGET_ROTATION.z;
      }

      renderer.render(scene, camera);
      animationFrameRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      if (stateRef.current) {
        const { scene: currentScene, renderer: currentRenderer, die: currentDie } = stateRef.current;

        if (currentDie) {
          currentScene.remove(currentDie);
          currentDie.traverse((obj) => {
            if (obj instanceof THREE.Mesh) {
              obj.geometry.dispose();
              if (obj.material) {
                if (Array.isArray(obj.material)) {
                  obj.material.forEach((mat) => mat.dispose());
                } else {
                  obj.material.dispose();
                }
              }
            }
          });
        }

        currentRenderer.dispose();
        currentRenderer.forceContextLoss();
        if (mountElement.contains(currentRenderer.domElement)) {
          mountElement.removeChild(currentRenderer.domElement);
        }
      }
      stateRef.current = null;
    };
  }, [color, visualStyle, size, showAxes, animated, phase]);

  return (
    <div className={rootClassName} style={style}>
      <div ref={mountRef} className="relative flex items-center justify-center" style={canvasStyle} />
      {animated && (
        <div className="text-center text-sm text-shadow-300" role="status" aria-live="polite">
          {phase === 'spinning' && '🎲 Rolling the DAICER...'}
          {phase === 'shaking' && '✨ Settling...'}
          {phase === 'stopped' && '🎯 D • AI • CER'}
        </div>
      )}
    </div>
  );
}
