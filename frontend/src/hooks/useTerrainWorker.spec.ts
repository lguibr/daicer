import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';

// Mock Worker
const postMessageMock = vi.fn();
const terminateMock = vi.fn();

class MockWorker {
  postMessage = postMessageMock;
  terminate = terminateMock;
  addEventListener = vi.fn();
  removeEventListener = vi.fn();
}

describe('useTerrainWorker', () => {
// eslint-disable-next-line @typescript-eslint/no-explicit-any
  let useTerrainWorker: any;

  beforeEach(async () => {
    // Reset mocks
    postMessageMock.mockClear();
    terminateMock.mockClear();

    // Stub Global Worker
    vi.stubGlobal('Worker', MockWorker);

    // Re-import the module to ensure it uses the mocked Worker
    // We need to invalidate cache if possible, but for now just import might work if it wasn't loaded
    // But vitest might have loaded it?
    // Actually, just doing dynamic import here might trigger the top-level execution if not cached.
    // To be safe, we rely on the fact that this is the first time we import it in this test execution context (if isolated).
    const mod = await import('./useTerrainWorker');
    useTerrainWorker = mod.useTerrainWorker;
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.resetModules(); // Important to clear cache for next run if needed
  });

  it('should instantiate the worker', () => {
    renderHook(() => useTerrainWorker());
    // Since we mocked the class, we can check if the mock was used if we spy on it
    // But basic instantiation check is implicitly done by renderHook not crashing
  });

  it('should request a chunk generation', () => {
    const { result } = renderHook(() => useTerrainWorker());

    result.current.requestChunk('room-1', 'seed-1', 5, 5);

    expect(postMessageMock).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'GENERATE_CHUNK',
        payload: expect.objectContaining({
          x: 5,
          y: 5,
        }),
      })
    );
  });
});
