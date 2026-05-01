import { useEffect } from "react";

export interface MetronomeTickOptions {
  enabled: boolean;
  isRunning: boolean;
  playTick: () => void;
}

export function useMetronomeTick({ enabled, isRunning, playTick }: MetronomeTickOptions): void {
  useEffect(() => {
    if (!enabled || !isRunning) return;
    const id = setInterval(() => {
      playTick();
    }, 1000);
    return () => clearInterval(id);
  }, [enabled, isRunning, playTick]);
}
