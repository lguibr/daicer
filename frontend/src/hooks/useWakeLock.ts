import { useEffect, useRef, useState } from 'react';

export function useWakeLock() {
  const wakeLock = useRef<WakeLockSentinel | null>(null);
  const [isLocked, setIsLocked] = useState(false);

  const requestWakeLock = async () => {
    if ('wakeLock' in navigator) {
      try {
        wakeLock.current = await navigator.wakeLock.request('screen');
        setIsLocked(true);

        wakeLock.current.addEventListener('release', () => {
          setIsLocked(false);
          console.info('Wake Lock released');
        });
        console.info('Wake Lock acquired');
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } catch (err: any) {
        console.error(`${err.name}, ${err.message}`);
      }
    }
  };

  const releaseWakeLock = async () => {
    if (wakeLock.current) {
      await wakeLock.current.release();
      wakeLock.current = null;
    }
  };

  useEffect(() => {
    // Attempt to acquire lock on mount
    // eslint-disable-next-line react-hooks/set-state-in-effect
    requestWakeLock();

    // Re-acquire lock when page becomes visible again
    const handleVisibilityChange = async () => {
      if (document.visibilityState === 'visible' && !isLocked) {
        await requestWakeLock();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      releaseWakeLock();
    };
  }, [isLocked]);

  return { isLocked, requestWakeLock, releaseWakeLock };
}
