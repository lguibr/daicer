import { describe, it, expect, jest } from '@jest/globals';
import { emitProgress, createStreamEventUpdate } from '../stream-progress';

describe('emitProgress', () => {
  it('should emit event to writer if provided', () => {
    const mockWriter = jest.fn();
    const config = {
      configurable: { writer: mockWriter },
    };

    emitProgress('test_event', { data: 'value' }, config);

    expect(mockWriter).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'test_event',
        data: 'value',
        timestamp: expect.any(Number),
      })
    );
  });

  it('should not throw if writer is undefined', () => {
    expect(() => {
      emitProgress('test_event', { data: 'value' });
    }).not.toThrow();
  });

  it('should not throw if config is undefined', () => {
    expect(() => {
      emitProgress('test_event', { data: 'value' }, undefined);
    }).not.toThrow();
  });

  it('should include timestamp in emitted event', () => {
    const mockWriter = jest.fn();
    const config = { configurable: { writer: mockWriter } };

    const before = Date.now();
    emitProgress('test', {});
    const after = Date.now();

    const call = mockWriter.mock.calls[0][0];
    expect(call.timestamp).toBeGreaterThanOrEqual(before);
    expect(call.timestamp).toBeLessThanOrEqual(after);
  });
});

describe('createStreamEventUpdate', () => {
  it('should create partial state update with stream event', () => {
    const result = createStreamEventUpdate('node_start', { node: 'test_node' });

    expect(result).toHaveProperty('streamEvents');
    expect(result.streamEvents).toHaveLength(1);
    expect(result.streamEvents[0]).toMatchObject({
      type: 'node_start',
      node: 'test_node',
      timestamp: expect.any(Number),
    });
  });

  it('should include all data fields in event', () => {
    const result = createStreamEventUpdate('progress', {
      current: 5,
      total: 10,
      message: 'Processing...',
    });

    expect(result.streamEvents[0]).toMatchObject({
      type: 'progress',
      current: 5,
      total: 10,
      message: 'Processing...',
    });
  });
});
