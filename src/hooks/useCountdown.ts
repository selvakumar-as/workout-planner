import { useCallback, useEffect, useRef, useState } from "react";

// ---------------------------------------------------------------------------
// useCountdown
//
// Counts down from `initialMs` to 0.  Ticks every 100 ms.
// `isDone` becomes true when remaining reaches 0 after having been started.
// ---------------------------------------------------------------------------

export interface CountdownState {
  remaining: number;
  isRunning: boolean;
  isDone: boolean;
  start: () => void;
  pause: () => void;
  reset: (newMs?: number) => void;
}

export function useCountdown(initialMs: number): CountdownState {
  const [remaining, setRemaining] = useState<number>(initialMs);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [isDone, setIsDone] = useState<boolean>(false);

  // Track when the current running segment started and the remaining value
  // at that point so we can compute the live countdown.
  const segmentStartRef = useRef<number | null>(null);
  const remainingAtSegmentStartRef = useRef<number>(initialMs);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const clearTick = useCallback(() => {
    if (intervalRef.current !== null) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const start = useCallback(() => {
    setIsDone(false);
    setIsRunning((prev) => {
      if (prev) return prev;
      segmentStartRef.current = Date.now();
      return true;
    });
  }, []);

  const pause = useCallback(() => {
    setIsRunning((prev) => {
      if (!prev) return prev;
      // Freeze current remaining.
      if (segmentStartRef.current !== null) {
        const elapsed = Date.now() - segmentStartRef.current;
        remainingAtSegmentStartRef.current = Math.max(
          0,
          remainingAtSegmentStartRef.current - elapsed
        );
        setRemaining(remainingAtSegmentStartRef.current);
        segmentStartRef.current = null;
      }
      return false;
    });
  }, []);

  const reset = useCallback(
    (newMs?: number) => {
      clearTick();
      const value = newMs !== undefined ? newMs : initialMs;
      remainingAtSegmentStartRef.current = value;
      segmentStartRef.current = null;
      setRemaining(value);
      setIsRunning(false);
      setIsDone(false);
    },
    [clearTick, initialMs]
  );

  // Manage the tick interval.
  useEffect(() => {
    if (isRunning) {
      if (segmentStartRef.current === null) {
        segmentStartRef.current = Date.now();
      }
      intervalRef.current = setInterval(() => {
        const elapsed =
          segmentStartRef.current !== null
            ? Date.now() - segmentStartRef.current
            : 0;
        const next = Math.max(
          0,
          remainingAtSegmentStartRef.current - elapsed
        );
        setRemaining(next);
        if (next === 0) {
          clearTick();
          setIsRunning(false);
          setIsDone(true);
        }
      }, 100);
    } else {
      clearTick();
    }

    return clearTick;
  }, [isRunning, clearTick]);

  // Clean up on unmount.
  useEffect(() => {
    return clearTick;
  }, [clearTick]);

  return { remaining, isRunning, isDone, start, pause, reset };
}
