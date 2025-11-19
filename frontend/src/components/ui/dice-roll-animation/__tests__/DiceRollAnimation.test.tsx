/**
 * @vitest-environment jsdom
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';

import { DiceRollAnimation } from '../DiceRollAnimation';
import type { DieRoll } from '../types';

// Mock Three.js WebGLRenderer to avoid WebGL context issues in tests
// Also mock canvas getContext for texture creation
vi.mock('three', async (importOriginal) => {
  const actual = (await importOriginal()) as any;

  // Mock canvas getContext globally
  if (typeof HTMLCanvasElement !== 'undefined') {
    HTMLCanvasElement.prototype.getContext = vi.fn((contextType) => {
      if (contextType === '2d') {
        return {
          fillRect: vi.fn(),
          clearRect: vi.fn(),
          getImageData: vi.fn(),
          putImageData: vi.fn(),
          createImageData: vi.fn(),
          setTransform: vi.fn(),
          drawImage: vi.fn(),
          save: vi.fn(),
          fillText: vi.fn(),
          restore: vi.fn(),
          beginPath: vi.fn(),
          moveTo: vi.fn(),
          lineTo: vi.fn(),
          closePath: vi.fn(),
          stroke: vi.fn(),
          translate: vi.fn(),
          scale: vi.fn(),
          rotate: vi.fn(),
          arc: vi.fn(),
          fill: vi.fn(),
          measureText: vi.fn(() => ({ width: 0 })),
          transform: vi.fn(),
          rect: vi.fn(),
          clip: vi.fn(),
          canvas: document.createElement('canvas'),
          font: '',
          fillStyle: '',
          strokeStyle: '',
          textAlign: 'left',
          textBaseline: 'alphabetic',
        };
      }
      return null;
    }) as any;
  }

  // Mock renderer as a class
  const MockRenderer = function (this: any) {
    this.domElement = document.createElement('canvas');
    this.setPixelRatio = vi.fn();
    this.setSize = vi.fn();
    this.render = vi.fn();
    this.dispose = vi.fn();
  };

  return {
    ...actual,
    WebGLRenderer: MockRenderer,
  };
});

describe('DiceRollAnimation', () => {
  let mockRequestAnimationFrame: ReturnType<typeof vi.spyOn>;
  let mockCancelAnimationFrame: ReturnType<typeof vi.spyOn>;
  let frameCallbacks: FrameRequestCallback[];
  let frameId: number;

  beforeEach(() => {
    frameCallbacks = [];
    frameId = 0;

    mockRequestAnimationFrame = vi.spyOn(window, 'requestAnimationFrame').mockImplementation((callback) => {
      frameCallbacks.push(callback);
      frameId += 1;
      return frameId;
    });

    mockCancelAnimationFrame = vi.spyOn(window, 'cancelAnimationFrame').mockImplementation(() => {});
  });

  afterEach(() => {
    mockRequestAnimationFrame.mockRestore();
    mockCancelAnimationFrame.mockRestore();
  });

  it('renders with single die configuration', () => {
    const dice: DieRoll[] = [{ type: 20, result: 15 }];
    const { container } = render(<DiceRollAnimation dice={dice} />);

    const canvas = container.querySelector('canvas');
    expect(canvas).toBeInTheDocument();

    const diceContainer = container.querySelector('[data-dice-count]');
    expect(diceContainer).toHaveAttribute('data-dice-count', '1');
  });

  it('renders with multiple dice', () => {
    const dice: DieRoll[] = [
      { type: 6, result: 4 },
      { type: 6, result: 6 },
      { type: 6, result: 2 },
    ];
    const { container } = render(<DiceRollAnimation dice={dice} />);

    const diceContainer = container.querySelector('[data-dice-count]');
    expect(diceContainer).toHaveAttribute('data-dice-count', '3');
  });

  it('starts animation automatically when autoStart is true', () => {
    const dice: DieRoll[] = [{ type: 20, result: 15 }];
    render(<DiceRollAnimation dice={dice} autoStart />);

    expect(mockRequestAnimationFrame).toHaveBeenCalled();
    expect(frameCallbacks.length).toBeGreaterThan(0);
  });

  it('does not start animation when autoStart is false', () => {
    const dice: DieRoll[] = [{ type: 20, result: 15 }];
    render(<DiceRollAnimation dice={dice} autoStart={false} />);

    // Should not start the animation loop
    expect(frameCallbacks.length).toBe(0);
  });

  it('accepts onComplete callback prop', () => {
    const onComplete = vi.fn();
    const dice: DieRoll[] = [{ type: 6, result: 3 }];

    const { container } = render(<DiceRollAnimation dice={dice} onComplete={onComplete} autoStart />);

    // Verify component renders with callback
    expect(container.querySelector('canvas')).toBeInTheDocument();
    expect(onComplete).not.toHaveBeenCalled(); // Not called immediately
  });

  it('handles mixed dice types', () => {
    const dice: DieRoll[] = [
      { type: 20, result: 18 },
      { type: 12, result: 7 },
      { type: 6, result: 4 },
    ];
    const { container } = render(<DiceRollAnimation dice={dice} />);

    const diceContainer = container.querySelector('[data-dice-count]');
    expect(diceContainer).toHaveAttribute('data-dice-count', '3');
  });

  it('applies correct size classes', () => {
    const dice: DieRoll[] = [{ type: 20, result: 15 }];

    const { container: smallContainer } = render(<DiceRollAnimation dice={dice} size="small" />);
    const smallCanvas = smallContainer.querySelector('div[style*="200px"]');
    expect(smallCanvas).toBeInTheDocument();

    const { container: mediumContainer } = render(<DiceRollAnimation dice={dice} size="medium" />);
    const mediumCanvas = mediumContainer.querySelector('div[style*="280px"]');
    expect(mediumCanvas).toBeInTheDocument();

    const { container: largeContainer } = render(<DiceRollAnimation dice={dice} size="large" />);
    const largeCanvas = largeContainer.querySelector('div[style*="380px"]');
    expect(largeCanvas).toBeInTheDocument();
  });

  it('applies custom className', () => {
    const dice: DieRoll[] = [{ type: 20, result: 15 }];
    const { container } = render(<DiceRollAnimation dice={dice} className="custom-class" />);

    const wrapper = container.firstChild;
    expect(wrapper).toHaveClass('custom-class');
  });

  it('applies custom styles', () => {
    const dice: DieRoll[] = [{ type: 20, result: 15 }];
    const customStyle = { backgroundColor: 'red' };
    const { container } = render(<DiceRollAnimation dice={dice} style={customStyle} />);

    const wrapper = container.firstChild as HTMLElement;
    expect(wrapper.style.backgroundColor).toBe('red');
  });

  it('handles D10 with result 0', () => {
    const dice: DieRoll[] = [{ type: 10, result: 0 }];
    const { container } = render(<DiceRollAnimation dice={dice} />);

    const diceContainer = container.querySelector('[data-dice-count]');
    expect(diceContainer).toHaveAttribute('data-dice-count', '1');
  });

  it('handles custom colors for dice', () => {
    const dice: DieRoll[] = [
      { type: 20, result: 15, color: '#ff0000' },
      { type: 6, result: 3, color: '#00ff00' },
    ];
    const { container } = render(<DiceRollAnimation dice={dice} />);

    const diceContainer = container.querySelector('[data-dice-count]');
    expect(diceContainer).toHaveAttribute('data-dice-count', '2');
  });

  it('shows axes when showAxes is true', () => {
    const dice: DieRoll[] = [{ type: 20, result: 15 }];
    render(<DiceRollAnimation dice={dice} showAxes />);

    // The axes are added to the scene, which is internal
    // Just verify the component renders without error
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('cleans up resources on unmount', () => {
    const dice: DieRoll[] = [{ type: 20, result: 15 }];
    const { unmount } = render(<DiceRollAnimation dice={dice} />);

    unmount();

    expect(mockCancelAnimationFrame).toHaveBeenCalled();
  });

  it('starts with animation-complete as false', () => {
    const dice: DieRoll[] = [{ type: 6, result: 3 }];
    const { container } = render(<DiceRollAnimation dice={dice} autoStart />);

    const diceContainer = container.querySelector('[data-animation-complete]');
    expect(diceContainer).toHaveAttribute('data-animation-complete', 'false');
  });

  it('handles all die types correctly', () => {
    const dice: DieRoll[] = [
      { type: 2, result: 2 },
      { type: 4, result: 3 },
      { type: 6, result: 4 },
      { type: 8, result: 5 },
      { type: 10, result: 7 },
      { type: 12, result: 9 },
      { type: 20, result: 15 },
    ];
    const { container } = render(<DiceRollAnimation dice={dice} />);

    const diceContainer = container.querySelector('[data-dice-count]');
    expect(diceContainer).toHaveAttribute('data-dice-count', '7');
  });

  it('handles edge case of maximum result for each die type', () => {
    const dice: DieRoll[] = [
      { type: 2, result: 2 },
      { type: 4, result: 4 },
      { type: 6, result: 6 },
      { type: 8, result: 8 },
      { type: 10, result: 9 },
      { type: 12, result: 12 },
      { type: 20, result: 20 },
    ];
    const { container } = render(<DiceRollAnimation dice={dice} />);

    const diceContainer = container.querySelector('[data-dice-count]');
    expect(diceContainer).toHaveAttribute('data-dice-count', '7');
  });

  it('handles edge case of minimum result for each die type', () => {
    const dice: DieRoll[] = [
      { type: 2, result: 1 },
      { type: 4, result: 1 },
      { type: 6, result: 1 },
      { type: 8, result: 1 },
      { type: 10, result: 0 },
      { type: 12, result: 1 },
      { type: 20, result: 1 },
    ];
    const { container } = render(<DiceRollAnimation dice={dice} />);

    const diceContainer = container.querySelector('[data-dice-count]');
    expect(diceContainer).toHaveAttribute('data-dice-count', '7');
  });
});
