import { useCallback, useEffect, useRef, useState } from "react";

// ---------------------------------------------------------------------------
// useStopwatch
//
// Tracks elapsed milliseconds since start. Accumulates across pause/resume.
// Ticks every 100 ms for smooth display.
// ---------------------------------------------------------------------------

export interface StopwatchState {
  elapsed: number;
  isRunning: boolean;
  start: () => void;
  pause: () => void;
  reset: () => void;
}

export function useStopwatch(): StopwatchState {
  const [elapsed, setElapsed] = useState<number>(0);
  const [isRunning, setIsRunning] = useState<boolean>(false);

  // Stores the timestamp when the current running segment started.
  const segmentStartRef = useRef<number | null>(null);
  // Stores the accumulated elapsed before the current running segment.
  const accumulatedRef = useRef<number>(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const clearTick = useCallback(() => {
    if (intervalRef.current !== null) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const start = useCallback(() => {
    setIsRunning((prev) => {
      if (prev) return prev; // already running
      segmentStartRef.current = Date.now();
      return true;
    });
  }, []);

  const pause = useCallback(() => {
    setIsRunning((prev) => {
      if (!prev) return prev; // already paused
      if (segmentStartRef.current !== null) {
        accumulatedRef.current += Date.now() - segmentStartRef.current;
        segmentStartRef.current = null;
      }
      return false;
    });
  }, []);

  const reset = useCallback(() => {
    clearTick();
    accumulatedRef.current = 0;
    segmentStartRef.current = null;
    setIsRunning(false);
    setElapsed(0);
  }, [clearTick]);

  // Manage the tick interval whenever isRunning changes.
  useEffect(() => {
    if (isRunning) {
      // Ensure segment start is recorded if start() updated isRunning.
      if (segmentStartRef.current === null) {
        segmentStartRef.current = Date.now();
      }
      intervalRef.current = setInterval(() => {
        const segmentMs =
          segmentStartRef.current !== null
            ? Date.now() - segmentStartRef.current
            : 0;
        setElapsed(accumulatedRef.current + segmentMs);
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

  return { elapsed, isRunning, start, pause, reset };
}
