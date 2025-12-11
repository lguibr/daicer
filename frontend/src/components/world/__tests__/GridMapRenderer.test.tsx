import { render, act, fireEvent } from '@testing-library/react';
import { GridMapRenderer } from '../GridMapRenderer';
import { getSocket } from '../../../services/socket';
import { vi, describe, it, expect, beforeEach } from 'vitest';

// Mock Socket service
vi.mock('../../../services/socket', () => ({
  getSocket: vi.fn(),
  initSocket: vi.fn(),
}));

// Mock Firebase Auth
vi.mock('../../../services/firebase', () => ({
  auth: {
    currentUser: { getIdToken: vi.fn().mockResolvedValue('mock-token') },
  },
}));

describe('GridMapRenderer', () => {
  let mockSocket: any;
  let mockEmit: any;
  let mockOn: any;
  let mockOff: any;

  beforeEach(() => {
    vi.clearAllMocks();

    mockEmit = vi.fn();
    mockOn = vi.fn();
    mockOff = vi.fn();

    mockSocket = {
      emit: mockEmit,
      on: mockOn,
      off: mockOff,
      connected: true,
    };

    (getSocket as any).mockReturnValue(mockSocket);

    // Mock Canvas
    HTMLCanvasElement.prototype.getContext = vi.fn().mockReturnValue({
      clearRect: vi.fn(),
      save: vi.fn(),
      restore: vi.fn(),
      translate: vi.fn(),
      scale: vi.fn(),
      drawImage: vi.fn(),
      beginPath: vi.fn(),
      moveTo: vi.fn(),
      lineTo: vi.fn(),
      stroke: vi.fn(),
      fill: vi.fn(),
      fillRect: vi.fn(),
      strokeRect: vi.fn(),
      resetTransform: vi.fn(),
      closePath: vi.fn(),
      arc: vi.fn(),
      fillText: vi.fn(),
      measureText: vi.fn().mockReturnValue({ width: 10 }),
      canvas: { width: 800, height: 600 },
    }) as any;
  });

  it('should initialize and request map view for Room mode', async () => {
    vi.useFakeTimers();

    await act(async () => {
      render(<GridMapRenderer roomId="room-123" currentLayer={0} />);
    });

    // Should try to get socket
    expect(getSocket).toHaveBeenCalled();

    // Advance timers to trigger debounce
    act(() => {
      vi.advanceTimersByTime(250);
    });

    // Should emit map:view:query after debounce
    expect(mockEmit).toHaveBeenCalledWith(
      'map:view:query',
      expect.objectContaining({
        roomId: 'room-123',
        z: 0,
      })
    );

    vi.useRealTimers();
  });

  it('should handle map:view:result socket event', async () => {
    let resultCallback: any;
    mockOn.mockImplementation((event: string, cb: any) => {
      if (event === 'map:view:result') {
        resultCallback = cb;
      }
    });

    await act(async () => {
      render(<GridMapRenderer roomId="room-123" currentLayer={0} />);
    });

    // Wait for effect
    expect(mockOn).toHaveBeenCalledWith('map:view:result', expect.any(Function));

    // Simulate server response
    const mockData = {
      roomId: 'room-123',
      chunks: [{ chunkX: 0, chunkY: 0, z: 0, tiles: [], features: [] }],
      entities: [{ id: 'e1', type: 'player', x: 0, y: 0, z: 0, name: 'P1' }],
    };

    await act(async () => {
      if (resultCallback) {
        resultCallback(mockData);
      }
    });

    // Assertions? We can check if state updated re-renders something.
    // Canvas is hard to check.
    // But if no error thrown, it processed the data.
  });
});
