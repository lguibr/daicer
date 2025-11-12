import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

export interface DebouncedBusyOptions {
  enterDelayMs?: number;
  minVisibleMs?: number;
}

export interface DebouncedBusyResult {
  isBusy: boolean;
  pending: boolean;
}

const DEFAULT_ENTER_DELAY = 350;
const DEFAULT_MIN_VISIBLE = 333;

export function useDebouncedBusy(active: boolean, options?: DebouncedBusyOptions): DebouncedBusyResult {
  const { enterDelayMs = DEFAULT_ENTER_DELAY, minVisibleMs = DEFAULT_MIN_VISIBLE } = options ?? {};

  const [visible, setVisible] = useState(false);
  const enterTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const exitTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const visibleSinceRef = useRef<number | null>(null);
  const activeRef = useRef<boolean>(active);

  const markVisible = useCallback(() => {
    setVisible((currentVisible) => {
      if (!currentVisible) {
        visibleSinceRef.current = Date.now();
        return true;
      }
      if (!visibleSinceRef.current) {
        visibleSinceRef.current = Date.now();
      }
      return currentVisible;
    });
  }, []);

  const markHidden = useCallback(() => {
    setVisible((currentVisible) => {
      if (currentVisible) {
        visibleSinceRef.current = null;
        return false;
      }
      return currentVisible;
    });
  }, []);

  const clearEnterTimer = () => {
    if (enterTimerRef.current) {
      clearTimeout(enterTimerRef.current);
      enterTimerRef.current = null;
    }
  };

  const clearExitTimer = () => {
    if (exitTimerRef.current) {
      clearTimeout(exitTimerRef.current);
      exitTimerRef.current = null;
    }
  };

  useEffect(() => {
    activeRef.current = active;

    if (active) {
      clearExitTimer();

      if (visible) {
        return;
      }

      if (enterDelayMs <= 0) {
        markVisible();
        return;
      }

      if (enterTimerRef.current) {
        return;
      }

      enterTimerRef.current = setTimeout(() => {
        enterTimerRef.current = null;
        if (activeRef.current) {
          markVisible();
        }
      }, enterDelayMs);
      return;
    }

    // active === false
    clearEnterTimer();

    if (!visible) {
      return;
    }

    const startedAt = visibleSinceRef.current ?? Date.now();
    const elapsed = Date.now() - startedAt;
    const remaining = Math.max(minVisibleMs - elapsed, 0);

    if (remaining <= 0) {
      markHidden();
      return;
    }

    if (exitTimerRef.current) {
      return;
    }

    exitTimerRef.current = setTimeout(() => {
      exitTimerRef.current = null;
      if (!activeRef.current) {
        markHidden();
      }
    }, remaining);
  }, [active, enterDelayMs, markHidden, markVisible, minVisibleMs, visible]);

  useEffect(
    () => () => {
      clearEnterTimer();
      clearExitTimer();
    },
    []
  );

  const pending = useMemo(() => active || visible, [active, visible]);

  return { isBusy: visible, pending };
}
