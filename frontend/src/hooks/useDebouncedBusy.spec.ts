import { renderHook, act } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { useDebouncedBusy } from './useDebouncedBusy';

const advance = (ms: number) => {
  act(() => {
    vi.advanceTimersByTime(ms);
  });
};

describe('useDebouncedBusy', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.runOnlyPendingTimers();
    vi.useRealTimers();
  });

  it('delays entry until the configured delay elapses', () => {
    const { result, rerender } = renderHook(({ active }) => useDebouncedBusy(active, { enterDelayMs: 200 }), {
      initialProps: { active: false },
    });

    expect(result.current.isBusy).toBe(false);

    rerender({ active: true });
    expect(result.current.isBusy).toBe(false);

    advance(199);
    expect(result.current.isBusy).toBe(false);

    advance(1);
    expect(result.current.isBusy).toBe(true);
  });

  it('cancels the pending show if the source settles before the delay', () => {
    const { result, rerender } = renderHook(({ active }) => useDebouncedBusy(active, { enterDelayMs: 150 }), {
      initialProps: { active: false },
    });

    rerender({ active: true });
    rerender({ active: false });

    advance(200);
    expect(result.current.isBusy).toBe(false);
  });

  it('keeps the busy flag for the minimum visible duration even after settle', () => {
    const { result, rerender } = renderHook(
      ({ active }) => useDebouncedBusy(active, { enterDelayMs: 50, minVisibleMs: 300 }),
      { initialProps: { active: false } }
    );

    rerender({ active: true });
    advance(50);

    expect(result.current.isBusy).toBe(true);

    rerender({ active: false });
    expect(result.current.isBusy).toBe(true);

    advance(299);
    expect(result.current.isBusy).toBe(true);

    advance(1);
    expect(result.current.isBusy).toBe(false);
  });

  it('uses the default minimum visible time when not provided', () => {
    const { result, rerender } = renderHook(({ active }) => useDebouncedBusy(active), {
      initialProps: { active: false },
    });

    rerender({ active: true });
    advance(200);
    expect(result.current.isBusy).toBe(false);
    advance(150);
    expect(result.current.isBusy).toBe(true);

    rerender({ active: false });
    advance(332);
    expect(result.current.isBusy).toBe(true);
    advance(1);
    expect(result.current.isBusy).toBe(false);
  });
});
