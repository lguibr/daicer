import { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';

import type { Language } from '@daicer/engine';
import { createDie } from './createDie';
import type { DiceLoaderProps, DieType, DieVisualStyle } from './types';
import { AVAILABLE_DIE_TYPES, generateRandomDieColor, generateRandomDieType, generateRandomVisualStyle } from './utils';
import { useI18n } from '../../../i18n';

interface DieInstance {
  group: THREE.Group;
  rotationSpeed: THREE.Vector3;
}

interface ThreeState {
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  renderer: THREE.WebGLRenderer;
  axes?: THREE.AxesHelper;
  diceGroup?: THREE.Group;
  dice: DieInstance[];
}

interface DiceDescriptor {
  id: string;
  type: DieType;
  color: string;
  visualStyle: DieVisualStyle;
  scale: number;
  position: { x: number; y: number; z: number };
  rotation: { x: number; y: number; z: number };
  rotationSpeed: { x: number; y: number; z: number };
}

interface PositionedDie {
  x: number;
  y: number;
  z: number;
  scale: number;
}

const MESSAGE_KEYS = [
  'diceLoader.messages.summoning',
  'diceLoader.messages.rattling',
  'diceLoader.messages.focusing',
  'diceLoader.messages.calibrating',
] as const;

const FALLBACK_MESSAGES: Record<Language, readonly string[]> = {
  en: [
    'Summoning shiny math rocks...',
    'Rattling the dice tray of destiny...',
    'Consulting the probability spirits...',
    'Calibrating critical hit chances...',
  ],
  es: [
    'Invocando dados brillantes...',
    'Agitando la bandeja del destino...',
    'Consultando a los espíritus de la probabilidad...',
    'Calibrando las tiradas críticas...',
  ],
  'pt-BR': [
    'Invocando dados reluzentes...',
    'Chacoalhando a bandeja do destino...',
    'Consultando os espíritus da probabilidade...',
    'Calibrando as chances de crítico...',
  ],
};

const MIN_DICE_COUNT = 1;
const MAX_DICE_COUNT = 6;
const DEFAULT_MAX_DICE_COUNT = 4;

const SIZE_MAP: Record<Required<DiceLoaderProps>['size'], number> = {
  small: 0.8,
  medium: 1,
  large: 1.3,
};

const CONTAINER_SIZE_MAP: Record<Required<DiceLoaderProps>['size'], number> = {
  small: 200,
  medium: 280,
  large: 380,
};

const MIN_ROTATION_SPEED = { x: 0.04, y: 0.06, z: 0.036 };
const ROTATION_VARIATION = { x: 0.014, y: 0.0175, z: 0.0125 };
const GOLDEN_ANGLE = Math.PI * (3 - Math.sqrt(5));
const MIN_POSITION_SEPARATION = 0.9;
const MAX_POSITION_ATTEMPTS = 12;

function randomBetween(min: number, max: number): number {
  return min + Math.random() * (max - min);
}

function clampDiceCount(value?: number): number | undefined {
  if (value === undefined || Number.isNaN(value)) {
    return undefined;
  }
  const floored = Math.floor(value);
  if (floored < MIN_DICE_COUNT) {
    return MIN_DICE_COUNT;
  }
  if (floored > MAX_DICE_COUNT) {
    return MAX_DICE_COUNT;
  }
  return floored;
}

function randomInt(min: number, max: number): number {
  const lower = Math.ceil(min);
  const upper = Math.floor(max);
  return Math.max(lower, Math.floor(Math.random() * (upper - lower + 1)) + lower);
}

const isPositionTooClose = (positions: PositionedDie[], candidate: PositionedDie): boolean =>
  positions.some((pos) => {
    const dx = pos.x - candidate.x;
    const dy = pos.y - candidate.y;
    const dz = pos.z - candidate.z;
    const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);
    const separation = Math.max(MIN_POSITION_SEPARATION, (pos.scale + candidate.scale) * 0.55);
    return distance < separation;
  });

function createDiceDescriptors(
  diceCount: number | undefined,
  maxDiceCount: number | undefined,
  dieType: DieType | undefined,
  color: string | undefined,
  visualStyle: DieVisualStyle | undefined
): DiceDescriptor[] {
  const exact = clampDiceCount(diceCount);
  const maxCount = clampDiceCount(maxDiceCount) ?? DEFAULT_MAX_DICE_COUNT;
  const total = exact ?? randomInt(MIN_DICE_COUNT, maxCount);
  const placedPositions: PositionedDie[] = [];

  return Array.from({ length: total }, (_, index) => {
    const type = dieType ?? generateRandomDieType();
    const diceColor = color ?? generateRandomDieColor();
    const diceVisualStyle = visualStyle ?? generateRandomVisualStyle();
    const baseScale = 0.65 + index * 0.04;
    const scale = randomBetween(baseScale, baseScale + 0.5);

    let positionAttempts = 0;
    let positionFound = false;
    let candidate: PositionedDie = { x: 0, y: 0, z: 0, scale };

    while (positionAttempts < MAX_POSITION_ATTEMPTS && !positionFound) {
      const angle = index * GOLDEN_ANGLE + randomBetween(-0.35, 0.35);
      const radiusBase = 1 + index * 0.22;
      const radius = total === 1 ? 0 : radiusBase + randomBetween(-0.1, 0.45);

      const x = Math.cos(angle) * radius;
      const z = Math.sin(angle) * radius;
      const y = randomBetween(-0.75, 0.75) + index * 0.05;

      candidate = { x, y, z, scale };
      const tooClose = isPositionTooClose(placedPositions, candidate);

      if (!tooClose) {
        placedPositions.push(candidate);
        positionFound = true;
      }

      positionAttempts += 1;
    }

    if (!positionFound) {
      placedPositions.push(candidate);
    }

    const rotation = {
      x: randomBetween(0, Math.PI * 2),
      y: randomBetween(0, Math.PI * 2),
      z: randomBetween(0, Math.PI * 2),
    };

    const rotationSpeed = {
      x: randomBetween(MIN_ROTATION_SPEED.x, MIN_ROTATION_SPEED.x + ROTATION_VARIATION.x + index * 0.01),
      y: randomBetween(MIN_ROTATION_SPEED.y, MIN_ROTATION_SPEED.y + ROTATION_VARIATION.y + index * 0.015),
      z: randomBetween(MIN_ROTATION_SPEED.z, MIN_ROTATION_SPEED.z + ROTATION_VARIATION.z + index * 0.008),
    };

    const id =
      typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID() : `die-${Date.now()}-${index}`;

    const finalPosition = candidate;

    return {
      id,
      type,
      color: diceColor,
      visualStyle: diceVisualStyle,
      scale,
      position: { x: finalPosition.x, y: finalPosition.y, z: finalPosition.z },
      rotation,
      rotationSpeed,
    } satisfies DiceDescriptor;
  });
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

export function DiceLoader({
  size = 'medium',
  dieType,
  color,
  visualStyle,
  message,
  showAxes = false,
  className,
  style,
  diceCount,
  maxDiceCount,
  showMessage = true,
  static: isStatic = false,
}: DiceLoaderProps) {
  const mountRef = useRef<HTMLDivElement>(null);
  const animationFrameRef = useRef<number | undefined>(undefined);
  const stateRef = useRef<ThreeState | null>(null);
  const { t, language } = useI18n();

  const diceDescriptors = useMemo(
    () => createDiceDescriptors(diceCount, maxDiceCount, dieType, color, visualStyle),
    [color, diceCount, dieType, maxDiceCount, visualStyle]
  );

  const localizedMessages = useMemo<string[]>(() => {
    const translatedMessages = MESSAGE_KEYS.map((key) => {
      const translation = t(key);
      return translation !== key ? translation : null;
    }).filter((value): value is string => Boolean(value));

    if (translatedMessages.length > 0) {
      return translatedMessages;
    }
    const fallback = FALLBACK_MESSAGES[language];
    if (fallback && fallback.length > 0) {
      return Array.from(fallback);
    }
    return Array.from(FALLBACK_MESSAGES.en);
  }, [language, t]);

  const randomLocalizedMessage = useMemo(() => {
    const options = localizedMessages.length > 0 ? localizedMessages : Array.from(FALLBACK_MESSAGES.en);
    const index = Math.floor(Math.random() * options.length);
    return options[index];
  }, [localizedMessages]);

  const displayedMessage = showMessage ? (message ?? randomLocalizedMessage) : undefined;

  const canvasStyle = useMemo(() => {
    const baseSize = CONTAINER_SIZE_MAP[size] ?? CONTAINER_SIZE_MAP.medium;
    return {
      width: `${baseSize}px`,
      height: `${baseSize}px`,
      position: 'relative' as const,
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
    };
  }, [size]);

  const rootClassName = className
    ? `flex flex-col items-center gap-3 ${className}`
    : 'flex flex-col items-center gap-3';

  useEffect(() => {
    if (!mountRef.current) {
      return undefined;
    }

    const mountElement = mountRef.current;
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, mountElement.clientWidth / mountElement.clientHeight, 0.1, 100);
    camera.position.set(0, 0, 7.5);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(mountElement.clientWidth, mountElement.clientHeight, false);
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
      const width = mountElement.clientWidth;
      const height = mountElement.clientHeight || 1;
      currentCamera.aspect = width / height;
      currentCamera.updateProjectionMatrix();
      currentRenderer.setSize(width, height, false);
    };

    const animate = () => {
      animationFrameRef.current = requestAnimationFrame(animate);
      const currentState = stateRef.current;
      if (currentState?.dice.length) {
        currentState.dice.forEach((instance) => {
          const { group: dieGroup, rotationSpeed } = instance;
          dieGroup.rotation.x += rotationSpeed.x;
          dieGroup.rotation.y += rotationSpeed.y;
          dieGroup.rotation.z += rotationSpeed.z;
        });
      }
      renderer.render(scene, camera);
    };

    // Start animation loop or render once if static
    if (isStatic) {
      // Static mode: render once, no animation loop
      renderer.render(scene, camera);
    } else {
      // Dynamic mode: start animation loop
      animate();
    }
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
      const { scene: currentScene, renderer: currentRenderer, diceGroup, dice } = stateRef.current;

      // Dispose all dice instances
      if (dice && dice.length > 0) {
        dice.forEach(({ group }) => {
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

      // Dispose renderer and remove canvas
      currentRenderer.dispose();
      currentRenderer.forceContextLoss();
      if (mountElement.contains(currentRenderer.domElement)) {
        mountElement.removeChild(currentRenderer.domElement);
      }
      stateRef.current = null;
    };
  }, [isStatic]);

  useEffect(() => {
    if (!stateRef.current) return;

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

    const diceInstances = diceDescriptors.map((descriptor) => {
      const die = createDie(descriptor.type, descriptor.color, descriptor.visualStyle);
      die.scale.set(descriptor.scale, descriptor.scale, descriptor.scale);
      die.position.set(descriptor.position.x, descriptor.position.y, descriptor.position.z);
      die.rotation.set(descriptor.rotation.x, descriptor.rotation.y, descriptor.rotation.z);
      currentState.diceGroup?.add(die);

      return {
        group: die,
        rotationSpeed: new THREE.Vector3(
          descriptor.rotationSpeed.x,
          descriptor.rotationSpeed.y,
          descriptor.rotationSpeed.z
        ),
      } satisfies DieInstance;
    });

    currentState.dice = diceInstances;

    if (currentState.diceGroup) {
      const boundingBox = new THREE.Box3().setFromObject(currentState.diceGroup);
      const sizeVector = boundingBox.getSize(new THREE.Vector3());
      const maxAxis = Math.max(sizeVector.x, sizeVector.y, sizeVector.z, 1);
      const baseMultiplier = SIZE_MAP[size] ?? SIZE_MAP.medium;
      const desiredMax = baseMultiplier * 2.6;
      const uniformScale = Math.min(baseMultiplier, desiredMax / maxAxis);
      currentState.diceGroup.scale.set(uniformScale, uniformScale, uniformScale);
      const center = boundingBox.getCenter(new THREE.Vector3());
      currentState.diceGroup.position.set(-center.x, -center.y, -center.z);
    }

    // Re-render after dice update (important for static mode)
    if (isStatic && currentState.renderer && currentState.scene && currentState.camera) {
      currentState.renderer.render(currentState.scene, currentState.camera);
    }
  }, [diceDescriptors, size, isStatic]);

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
        data-dice-count={diceDescriptors.length}
        data-dice-types={
          diceDescriptors.map((descriptor) => descriptor.type).join(',') || AVAILABLE_DIE_TYPES.join(',')
        }
      />
      {displayedMessage ? (
        <div className="text-center text-sm text-shadow-300" role="status" aria-live="polite">
          {displayedMessage}
        </div>
      ) : null}
    </div>
  );
}
