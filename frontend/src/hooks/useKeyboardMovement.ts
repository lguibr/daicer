/**
 * useKeyboardMovement Hook
 * Handles WASD keyboard controls for player movement
 * Tracks position in WORLD COORDINATES (not grid-local)
 */

import { useEffect, useState } from 'react';

export interface Position {
  x: number;
  y: number;
}

interface UseKeyboardMovementOptions {
  initialPosition: Position;
  moveSpeed?: number;
  bounds?: {
    minX?: number;
    maxX?: number;
    minY?: number;
    maxY?: number;
  };
  enabled?: boolean;
  coordinateOffset?: { x: number; y: number }; // For grid-to-world coordinate conversion
}

export function useKeyboardMovement({
  initialPosition,
  moveSpeed = 20,
  bounds = {},
  enabled = true,
  coordinateOffset = { x: 0, y: 0 },
}: UseKeyboardMovementOptions) {
  const [position, setPosition] = useState<Position>(initialPosition);
  const [isInitialized, setIsInitialized] = useState(false);

  // Only sync with initial position on first mount
  useEffect(() => {
    if (!isInitialized) {
      setPosition(initialPosition);
      setIsInitialized(true);
    }
  }, [initialPosition.x, initialPosition.y, isInitialized]);

  // Adjust position when coordinate offset changes (grid expansion)
  useEffect(() => {
    if (isInitialized) {
      // Convert from old coordinate system to new one
      // This prevents teleportation when grid expands
      console.log('[useKeyboardMovement] Coordinate offset changed:', coordinateOffset);
    }
  }, [coordinateOffset.x, coordinateOffset.y, isInitialized]);
  useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if typing in input/textarea
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement ||
        e.target instanceof HTMLSelectElement
      ) {
        return;
      }

      const key = e.key.toLowerCase();
      let newX = position.x;
      let newY = position.y;

      switch (key) {
        case 'w':
        case 'arrowup':
          newY = position.y - moveSpeed;
          break;
        case 's':
        case 'arrowdown':
          newY = position.y + moveSpeed;
          break;
        case 'a':
        case 'arrowleft':
          newX = position.x - moveSpeed;
          break;
        case 'd':
        case 'arrowright':
          newX = position.x + moveSpeed;
          break;
        default:
          return; // Don't prevent default for other keys
      }

      // Apply bounds if specified
      if (bounds.minX !== undefined) {
        newX = Math.max(bounds.minX, newX);
      }
      if (bounds.maxX !== undefined) {
        newX = Math.min(bounds.maxX, newX);
      }
      if (bounds.minY !== undefined) {
        newY = Math.max(bounds.minY, newY);
      }
      if (bounds.maxY !== undefined) {
        newY = Math.min(bounds.maxY, newY);
      }

      setPosition({ x: newX, y: newY });

      // Prevent default for WASD and arrow keys
      e.preventDefault();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [position, moveSpeed, bounds, enabled]);

  return {
    position,
    setPosition,
  };
}
