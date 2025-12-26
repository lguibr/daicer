import * as THREE from 'three';
// eslint-disable-next-line import/extensions
import { mergeVertices } from 'three/examples/jsm/utils/BufferGeometryUtils.js';

import type { DieType, DieVisualStyle } from './types';

const D10_VERTICES = [
  new THREE.Vector3(0, 1.3, 0),
  new THREE.Vector3(0, -1.3, 0),
  ...Array.from({ length: 5 }, (_, i) => {
    const angle = (i / 5) * 2 * Math.PI;
    const radius = 1;
    return new THREE.Vector3(radius * Math.sin(angle), 0, radius * Math.cos(angle));
  }),
];

const D10_FACES = [
  [0, 2, 3],
  [0, 3, 4],
  [0, 4, 5],
  [0, 5, 6],
  [0, 6, 2],
  [1, 3, 2],
  [1, 4, 3],
  [1, 5, 4],
  [1, 6, 5],
  [1, 2, 6],
];

const FACE_NUMBER_MAP: Record<DieType, (number | string)[]> = {
  2: [1, 2],
  4: [1, 2, 3, 4],
  6: [1, 6, 2, 5, 3, 4],
  8: [1, 3, 8, 6, 2, 4, 7, 5],
  10: [0, 2, 8, 6, 4, 9, 7, 1, 3, 5],
  12: [12, 2, 8, 5, 10, 4, 11, 9, 6, 3, 7, 1],
  20: [20, 2, 14, 10, 8, 1, 17, 11, 5, 9, 19, 15, 3, 7, 13, 18, 12, 6, 16, 4],
  '20-ai': ['AI', 2, 14, 10, 'D', 1, 'CER', 11, 5, 9, 19, 15, 3, 7, 13, 18, 12, 6, 16, 4],
};

const textureCache: Record<string, THREE.CanvasTexture> = {};

function createNumberTexture(number: string): THREE.CanvasTexture {
  const cacheKey = number;
  const cached = textureCache[cacheKey];
  if (cached) {
    return cached;
  }

  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d');
  if (!context) {
    throw new Error('Unable to acquire 2D canvas context for die texture generation.');
  }

  const size = 128;
  canvas.width = size;
  canvas.height = size;

  context.font = `bold ${size * 0.7}px Arial`;
  context.fillStyle = 'white';
  context.textAlign = 'center';
  context.textBaseline = 'middle';
  context.clearRect(0, 0, size, size);
  context.fillText(number, size / 2, size / 2 + size * 0.04);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  textureCache[cacheKey] = texture;
  return texture;
}

function createNumberPlane(num: string | number, size: number): THREE.Mesh {
  const texture = createNumberTexture(num.toString());
  const material = new THREE.MeshBasicMaterial({
    map: texture,
    transparent: true,
    depthTest: false,
    side: THREE.DoubleSide,
  });
  const geometry = new THREE.PlaneGeometry(size, size);
  return new THREE.Mesh(geometry, material);
}

function createDieGeometry(type: DieType): THREE.BufferGeometry {
  const baseType = type === '20-ai' ? 20 : type;

  switch (baseType) {
    case 2:
      return new THREE.CylinderGeometry(1, 1, 0.2, 32);
    case 4:
      return new THREE.TetrahedronGeometry(1.2);
    case 6:
      return new THREE.BoxGeometry(1.5, 1.5, 1.5);
    case 8:
      return new THREE.OctahedronGeometry(1.1);
    case 10: {
      const geometry = new THREE.PolyhedronGeometry(
        D10_VERTICES.flatMap((vertex) => vertex.toArray()),
        D10_FACES.flat(),
        1.1,
        0
      );
      geometry.rotateX(Math.PI / 2);
      return geometry;
    }
    case 12: {
      const dodecahedron = new THREE.DodecahedronGeometry(1);
      const indexed = mergeVertices(dodecahedron);
      indexed.rotateX(0.58);
      return indexed;
    }
    case 20:
    default:
      return new THREE.IcosahedronGeometry(1);
  }
}

function createMaterialForStyle(
  color: string,
  visualStyle: DieVisualStyle
): THREE.MeshStandardMaterial | THREE.MeshPhysicalMaterial {
  const baseColor = new THREE.Color(color);

  switch (visualStyle) {
    case 'acrylic': {
      // Glass-like transparent with transmission
      const material = new THREE.MeshPhysicalMaterial({
        color: baseColor,
        metalness: 0.1,
        roughness: 0.1,
        transmission: 0.85,
        ior: 1.5,
        thickness: 0.3,
        transparent: true,
        opacity: 1.0,
      });
      return material;
    }
    case 'metallic': {
      // Chrome-like reflective
      const material = new THREE.MeshStandardMaterial({
        color: baseColor,
        metalness: 0.9,
        roughness: 0.2,
        transparent: false,
        opacity: 1.0,
      });
      return material;
    }
    case 'glowing': {
      // Emissive with bloom effect
      const material = new THREE.MeshStandardMaterial({
        color: baseColor,
        metalness: 0.3,
        roughness: 0.6,
        emissive: baseColor,
        emissiveIntensity: 1.5,
        transparent: false,
        opacity: 1.0,
      });
      return material;
    }
    case 'stone': {
      // Matte and solid
      const material = new THREE.MeshStandardMaterial({
        color: baseColor,
        metalness: 0.0,
        roughness: 0.9,
        transparent: false,
        opacity: 1.0,
      });
      return material;
    }
    case 'standard':
    default: {
      // Original standard material
      const material = new THREE.MeshStandardMaterial({
        color: baseColor,
        metalness: 0.2,
        roughness: 0.4,
        transparent: true,
        opacity: 0.9,
      });
      return material;
    }
  }
}

export function createDie(type: DieType, color: string, visualStyle: DieVisualStyle = 'standard'): THREE.Group {
  const geometry = createDieGeometry(type);
  const dieGroup = new THREE.Group();

  const baseMaterial = createMaterialForStyle(color, visualStyle);

  const dieBody = new THREE.Mesh(geometry, baseMaterial);
  dieGroup.add(dieBody);

  const numbers = FACE_NUMBER_MAP[type];
  const positions = geometry.getAttribute('position');
  if (!positions) {
    throw new Error('Die geometry is missing position attributes.');
  }
  const indices = geometry.index;

  const baseType = type === '20-ai' ? 20 : type;

  if (baseType === 2) {
    const cylinderHeight = 0.2;
    const planeSize = 1.2;

    const topCenter = new THREE.Vector3(0, cylinderHeight / 2, 0);
    const topNormal = new THREE.Vector3(0, 1, 0);
    const topPlane = createNumberPlane('1', planeSize);
    topPlane.position.copy(topCenter).add(topNormal.clone().multiplyScalar(0.01));
    topPlane.lookAt(topCenter.clone().add(topNormal));
    dieGroup.add(topPlane);

    const bottomCenter = new THREE.Vector3(0, -cylinderHeight / 2, 0);
    const bottomNormal = new THREE.Vector3(0, -1, 0);
    const bottomPlane = createNumberPlane('2', planeSize);
    bottomPlane.position.copy(bottomCenter).add(bottomNormal.clone().multiplyScalar(0.01));
    bottomPlane.lookAt(bottomCenter.clone().add(bottomNormal));
    dieGroup.add(bottomPlane);
  } else if (baseType === 6) {
    const planeSize = 0.8;
    const halfSize = 1.5 / 2;
    const faceData = [
      { normal: new THREE.Vector3(1, 0, 0), center: new THREE.Vector3(halfSize, 0, 0) },
      { normal: new THREE.Vector3(-1, 0, 0), center: new THREE.Vector3(-halfSize, 0, 0) },
      { normal: new THREE.Vector3(0, 1, 0), center: new THREE.Vector3(0, halfSize, 0) },
      { normal: new THREE.Vector3(0, -1, 0), center: new THREE.Vector3(0, -halfSize, 0) },
      { normal: new THREE.Vector3(0, 0, 1), center: new THREE.Vector3(0, 0, halfSize) },
      { normal: new THREE.Vector3(0, 0, -1), center: new THREE.Vector3(0, 0, -halfSize) },
    ];

    faceData.forEach(({ normal, center }, index) => {
      const faceNumber = numbers[index];
      if (faceNumber === undefined) {
        return;
      }
      const plane = createNumberPlane(faceNumber, planeSize);
      plane.position.copy(center).add(normal.clone().multiplyScalar(0.02));
      plane.lookAt(center.clone().add(normal));
      dieGroup.add(plane);
    });
  } else if (baseType === 12) {
    if (!indices) {
      throw new Error('D12 geometry must be indexed to place numbers.');
    }
    const faceCount = 12;
    for (let i = 0; i < faceCount; i += 1) {
      const vertexIndices = new Set<number>();
      for (let j = 0; j < 3; j += 1) {
        const triIndex = i * 3 + j;
        const baseIndex = triIndex * 3;
        vertexIndices.add(indices.getX(baseIndex));
        vertexIndices.add(indices.getY(baseIndex));
        vertexIndices.add(indices.getZ(baseIndex));
      }
      const vertices = Array.from(vertexIndices).map((idx) => new THREE.Vector3().fromBufferAttribute(positions, idx));
      const center = vertices
        .reduce((acc, vertex) => acc.add(vertex), new THREE.Vector3())
        .divideScalar(vertices.length);
      const baseIndex = i * 9;
      const vA = new THREE.Vector3().fromBufferAttribute(positions, indices.getX(baseIndex));
      const vB = new THREE.Vector3().fromBufferAttribute(positions, indices.getY(baseIndex));
      const vC = new THREE.Vector3().fromBufferAttribute(positions, indices.getZ(baseIndex));
      const normal = new THREE.Vector3().crossVectors(vB.clone().sub(vA), vC.clone().sub(vA)).normalize();

      const faceNumber = numbers[i];
      if (faceNumber !== undefined) {
        const plane = createNumberPlane(faceNumber, 0.5);
        plane.position.copy(center).add(normal.clone().multiplyScalar(0.01));
        plane.lookAt(center.clone().add(normal));
        dieGroup.add(plane);
      }
    }
  } else {
    const faceCount = indices ? indices.count / 3 : positions.count / 3;

    for (let i = 0; i < faceCount; i += 1) {
      const vA = new THREE.Vector3();
      const vB = new THREE.Vector3();
      const vC = new THREE.Vector3();

      if (indices) {
        const idx = i * 3;
        const iA = indices.getX(idx);
        const iB = indices.getY(idx);
        const iC = indices.getZ(idx);
        vA.fromBufferAttribute(positions, iA);
        vB.fromBufferAttribute(positions, iB);
        vC.fromBufferAttribute(positions, iC);
      } else {
        const idx = i * 3;
        vA.fromBufferAttribute(positions, idx);
        vB.fromBufferAttribute(positions, idx + 1);
        vC.fromBufferAttribute(positions, idx + 2);
      }

      const center = new THREE.Vector3().add(vA).add(vB).add(vC).divideScalar(3);
      const normal = new THREE.Vector3().crossVectors(vB.clone().sub(vA), vC.clone().sub(vA)).normalize();

      const faceNumber = numbers[i];
      if (faceNumber !== undefined) {
        const plane = createNumberPlane(faceNumber, type === 4 ? 0.6 : 0.5);
        plane.position.copy(center).add(normal.clone().multiplyScalar(0.01));
        plane.lookAt(center.clone().add(normal));
        dieGroup.add(plane);
      }
    }
  }

  dieGroup.name = 'die';
  dieGroup.userData = { dieType: type, baseColor: color };
  return dieGroup;
}
