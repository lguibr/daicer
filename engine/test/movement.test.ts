import { describe, it, expect } from 'vitest';
import { ActionDispatcher } from '../src/engine/action-dispatcher';
import { createEntity, createGameState } from './factories';
import { GameState } from '../src/types/engine';
import { Entity } from '../src/types';

describe('ActionDispatcher: Movement & Pathfinding', () => {
  const dispatcher = new ActionDispatcher('test-seed');

  it('should move linearly in empty space', () => {
    const actor = createEntity({ id: 'hero', position: { x: 0, y: 0, z: 0 }, speed: 30 });
    const state = createGameState({ entities: [actor] });

    const result = dispatcher.dispatch(state, {
      type: 'MOVE',
      payload: {
        actorId: 'hero',
        targetPosition: { x: 5, y: 0, z: 0 }, // 5ft away
      },
    });

    expect(result.success).toBe(true);
    expect(result.events[0].type).toBe('ENTITY_MOVED');
    expect(actor.position).toEqual({ x: 5, y: 0, z: 0 });
  });

  it('should be blocked by another entity', () => {
    const actor = createEntity({ id: 'hero', position: { x: 0, y: 0, z: 0 }, speed: 30 });
    // Obstacle at (1,0,0)
    const blocker = createEntity({ id: 'wall-guy', position: { x: 1, y: 0, z: 0 } });
    const state = createGameState({ entities: [actor, blocker] });

    // Try to move THROUGH the blocker to (2,0,0)
    // A* should find path around it if 2D/3D adjacency allows.
    // In 3D with z=0 fixed, neighbors are (1,0,0) [Blocked], (0,1,0), (0,-1,0).
    // It should go (0,0) -> (0,1) -> (1,1) -> (2,1) -> (2,0) or similar.
    // Distance approx 1+1.4+1 = 3.4. Speed 30. Should succeed.

    // BUT wait, my checkCollision function checks ROUNDED positions.
    // If I try to move EXACTLY to (1,0,0), it fails.

    // Test 1: Move TO occupied space
    const result1 = dispatcher.dispatch(state, {
      type: 'MOVE',
      payload: {
        actorId: 'hero',
        targetPosition: { x: 1, y: 0, z: 0 },
      },
    });

    // Should fail directly because target is blocked
    expect(result1.success).toBe(false);
    expect(actor.position).toEqual({ x: 0, y: 0, z: 0 });
  });

  it('should pathfind around an entity', () => {
    const actor = createEntity({ id: 'hero', position: { x: 0, y: 0, z: 0 }, speed: 30 });
    const blocker = createEntity({ id: 'orc', position: { x: 2, y: 0, z: 0 } });
    const state = createGameState({ entities: [actor, blocker] });

    // Move past the blocker to (4,0,0)
    const result = dispatcher.dispatch(state, {
      type: 'MOVE',
      payload: {
        actorId: 'hero',
        targetPosition: { x: 4, y: 0, z: 0 },
      },
    });

    expect(result.success).toBe(true);
    // Path should avoid (2,0,0).
    // Likely: (0,0)->(1,0)->(1,1)->(2,1)->(3,1)->(3,0)->(4,0) or similar.
    // Just verify it reached the goal
    expect(actor.position).toEqual({ x: 4, y: 0, z: 0 });

    // Check path length in event
    const path = (result.events[0].payload as any).path;
    expect(path.length).toBeGreaterThan(0);
    // Ensure no point in path is (2,0,0)
    const hitBlocker = path.some((p: any) => p.x === 2 && p.y === 0 && p.z === 0);
    expect(hitBlocker).toBe(false);
  });
});
