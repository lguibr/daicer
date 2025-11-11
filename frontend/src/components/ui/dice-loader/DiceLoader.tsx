import { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';

import { createDie } from './createDie';
import type { DiceLoaderProps, DieType } from './types';
import { generateRandomDieColor } from './utils';

interface ThreeState {
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  renderer: THREE.WebGLRenderer;
  die?: THREE.Group;
  axes?: THREE.AxesHelper;
}

const SIZE_MAP: Record<Required<DiceLoaderProps>['size'], number> = {
  small: 0.7,
  medium: 1,
  large: 1.4,
};

const DIE_ROTATION_SPEED = { x: 0.01, y: 0.015 };
const DEFAULT_DIE_TYPE: DieType = 20;

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

export function DiceLoader({
  size = 'medium',
  dieType = DEFAULT_DIE_TYPE,
  color,
  showAxes = false,
  className,
  style,
}: DiceLoaderProps) {
  const mountRef = useRef<HTMLDivElement>(null);
  const animationFrameRef = useRef<number>();
  const stateRef = useRef<ThreeState | null>(null);

  const selectedColor = useMemo(() => color ?? generateRandomDieColor(), [color]);

  useEffect(() => {
    if (!mountRef.current) {
      return undefined;
    }

    const mountElement = mountRef.current;
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, mountElement.clientWidth / mountElement.clientHeight, 0.1, 100);
    camera.position.set(0, 0, 5);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(mountElement.clientWidth, mountElement.clientHeight, false);
    mountElement.appendChild(renderer.domElement);

    const ambientLight = new THREE.AmbientLight(0xffffff, 1.2);
    const directionalLight = new THREE.DirectionalLight(0xffffff, 1.8);
    directionalLight.position.set(4, 6, 5);
    scene.add(ambientLight, directionalLight);

    const axes = new THREE.AxesHelper(2);
    scene.add(axes);

    stateRef.current = { scene, camera, renderer, axes };

    const handleResize = () => {
      if (!mountElement || !stateRef.current) return;
      const { camera: currentCamera, renderer: currentRenderer } = stateRef.current;
      const width = mountElement.clientWidth;
      const height = mountElement.clientHeight || 1;
      currentCamera.aspect = width / height;
      currentCamera.updateProjectionMatrix();
      currentRenderer.setSize(width, height, false);
    };

    const animate = () => {
      animationFrameRef.current = requestAnimationFrame(animate);
      const currentState = stateRef.current;
      if (currentState?.die) {
        currentState.die.rotation.x += DIE_ROTATION_SPEED.x;
        currentState.die.rotation.y += DIE_ROTATION_SPEED.y;
      }
      renderer.render(scene, camera);
    };

    animate();
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      if (!stateRef.current) {
        return;
      }
      const { scene: currentScene, renderer: currentRenderer } = stateRef.current;
      currentScene.traverse((object: THREE.Object3D) => {
        if (object instanceof THREE.Mesh) {
          object.geometry.dispose();
          const { material } = object;
          if (material) {
            disposeMaterial(material);
          }
        }
      });
      currentRenderer.dispose();
      if (mountElement.contains(currentRenderer.domElement)) {
        mountElement.removeChild(currentRenderer.domElement);
      }
      stateRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (!stateRef.current) return;
    const { scene, die: currentDie } = stateRef.current;
    if (currentDie) {
      scene.remove(currentDie);
      currentDie.traverse((object: THREE.Object3D) => {
        if (object instanceof THREE.Mesh) {
          object.geometry.dispose();
          const { material } = object;
          if (material) {
            disposeMaterial(material);
          }
        }
      });
    }

    const die = createDie(dieType, selectedColor);
    scene.add(die);
    stateRef.current.die = die;
  }, [dieType, selectedColor]);

  useEffect(() => {
    if (!stateRef.current?.die) return;
    const scale = SIZE_MAP[size] ?? SIZE_MAP.medium;
    stateRef.current.die.scale.set(scale, scale, scale);
  }, [size]);

  useEffect(() => {
    if (mountRef.current) {
      mountRef.current.dataset.diceColor = selectedColor;
    }
  }, [selectedColor]);

  useEffect(() => {
    if (!stateRef.current?.axes) return;
    stateRef.current.axes.visible = showAxes;
  }, [showAxes]);

  return <div ref={mountRef} className={className} style={style} />;
}
