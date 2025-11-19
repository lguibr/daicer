/**
 * Mock for worker pool - used in Jest tests
 */

export const initWorkerPool = jest.fn();
export const getWorkerPool = jest.fn(() => ({
  run: jest.fn().mockResolvedValue({}),
}));
export const shutdownWorkerPool = jest.fn().mockResolvedValue(undefined);
export const getWorkerPoolStats = jest.fn(() => null);
