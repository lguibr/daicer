import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { useStatusDice } from '../useStatusDice';

describe('useStatusDice', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.runOnlyPendingTimers();
    vi.useRealTimers();
  });

  it('builds deterministic dice for provided digits', () => {
    const { result } = renderHook(() => useStatusDice('404', { revealDelayMs: 10 }));
    const faces = result.current.dice.map((die) => die.result);
    expect(faces).toEqual([4, 0, 4]);
  });

  it('transitions from loader to result after the configured delay', () => {
    const { result } = renderHook(() => useStatusDice('500', { revealDelayMs: 20 }));
    expect(result.current.showLoader).toBe(true);
    expect(result.current.showResult).toBe(false);

    act(() => {
      vi.advanceTimersByTime(25);
    });

    expect(result.current.showLoader).toBe(false);
    expect(result.current.showResult).toBe(true);
  });

  it('defaults to zero when digit is unknown', () => {
    const { result } = renderHook(() => useStatusDice('A', { revealDelayMs: 5 }));
    expect(result.current.dice).toHaveLength(1);
    expect(result.current.dice[0]?.result).toBe(0);
  });
});
