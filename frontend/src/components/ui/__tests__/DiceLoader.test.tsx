import { cleanup, render } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => {
  const traverseMock = vi.fn((callback: (node: unknown) => void) => {
    callback({});
  });
  const scaleSetMock = vi.fn();
  const createDieMock = vi.fn((dieType: number, color: string) => ({
    name: 'die',
    userData: { dieType, baseColor: color },
    rotation: { x: 0, y: 0 },
    scale: { set: scaleSetMock },
    traverse: traverseMock,
  }));
  return { traverseMock, scaleSetMock, createDieMock };
});

vi.mock('../dice-loader/createDie', () => ({
  createDie: mocks.createDieMock,
}));

vi.mock('three', () => {
  class Object3D {
    children: Object3D[] = [];
    add = (...objs: Object3D[]) => {
      this.children.push(...objs);
    };
    remove = (obj: Object3D) => {
      this.children = this.children.filter((child) => child !== obj);
    };
    traverse(callback: (object: Object3D) => void) {
      callback(this);
      this.children.forEach((child) => child.traverse(callback));
    }
  }

  class Group extends Object3D {
    rotation = { x: 0, y: 0 };
    scale = { set: () => undefined };
    userData: Record<string, unknown> = {};
  }

  class Mesh extends Object3D {
    geometry = { dispose: () => undefined };
    material = { dispose: () => undefined };
  }

  class Scene extends Object3D {}

  class PerspectiveCamera extends Object3D {
    aspect = 1;
    position = { set: vi.fn() };
    updateProjectionMatrix = vi.fn();
  }

  class WebGLRenderer {
    domElement = document.createElement('canvas');
    setPixelRatio = () => undefined;
    setSize = () => undefined;
    render = () => undefined;
    dispose = () => undefined;
  }

  class AmbientLight extends Object3D {}

  class DirectionalLight extends Object3D {
    position = { set: () => undefined };
  }

  class AxesHelper extends Object3D {
    visible = false;
  }

  class Color {
    constructor(public hex: string | number) {}
  }

  return {
    Scene,
    PerspectiveCamera,
    WebGLRenderer,
    AmbientLight,
    DirectionalLight,
    AxesHelper,
    Mesh,
    Group,
    MeshStandardMaterial: class {},
    MeshBasicMaterial: class {},
    PlaneGeometry: class {},
    CylinderGeometry: class {},
    TetrahedronGeometry: class {},
    BoxGeometry: class {},
    OctahedronGeometry: class {},
    PolyhedronGeometry: class {},
    DodecahedronGeometry: class {},
    IcosahedronGeometry: class {},
    Vector3: class {
      constructor(
        public x = 0,
        public y = 0,
        public z = 0
      ) {}
      toArray() {
        return [this.x, this.y, this.z];
      }
      fromBufferAttribute() {
        return this;
      }
      add(v: { x: number; y: number; z: number }) {
        this.x += v.x;
        this.y += v.y;
        this.z += v.z;
        return this;
      }
      divideScalar() {
        return this;
      }
      sub() {
        return this;
      }
      clone() {
        return this;
      }
    },
    CanvasTexture: class {
      constructor(public canvas: HTMLCanvasElement) {}
    },
    Color,
    DoubleSide: 0,
  };
});

import { DiceLoader } from '../dice-loader/DiceLoader';
import { generateRandomDieColor } from '../dice-loader/utils';

describe('DiceLoader', () => {
  beforeEach(() => {
    vi.spyOn(window, 'requestAnimationFrame').mockImplementation(() => 1);
    vi.spyOn(window, 'cancelAnimationFrame').mockImplementation(() => undefined);
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it('renders a canvas element for the dice', () => {
    const { container } = render(<DiceLoader />);
    const canvas = container.querySelector('canvas');
    expect(canvas).toBeTruthy();
  });

  it('exposes the selected color via dataset', () => {
    const { container } = render(<DiceLoader color="#336699" />);
    const wrapper = container.firstElementChild as HTMLDivElement;
    expect(wrapper.dataset.diceColor).toBe('#336699');
  });
});

describe('generateRandomDieColor', () => {
  it('creates a valid hsl string', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.5);
    const color = generateRandomDieColor();
    expect(color).toMatch(/^hsl\(\d+deg \d+% \d+%\)$/);
  });
});
