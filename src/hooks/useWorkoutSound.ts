import { useCallback, useEffect, useRef } from "react";
import { Platform } from "react-native";
import { Audio } from "expo-av";

// ---------------------------------------------------------------------------
// useWorkoutSound
//
// Web:    Uses Web Audio API (oscillators) — no files needed, plays from timer
//         callbacks after the AudioContext is unlocked by a user gesture.
//         Call unlockAudio() inside any user-gesture handler before starting
//         the auto session.
//
// Native: Uses expo-av with bundled WAV files. Silent fail if missing.
// ---------------------------------------------------------------------------

export interface WorkoutSoundCallbacks {
  /** Call once from a user gesture (e.g. "Start Auto Session" press) on web. */
  unlockAudio: () => void;
  playSetStart: () => void;
  playSetEnd: () => void;
  playExerciseStart: () => void;
  playExerciseEnd: () => void;
}

// ---------------------------------------------------------------------------
// Web implementation — Web Audio API oscillator beeps
// ---------------------------------------------------------------------------

function playOscillator(
  ctx: AudioContext,
  freqHz: number,
  durationMs: number,
  gainValue = 0.4
): void {
  try {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = "sine";
    osc.frequency.value = freqHz;
    const t = ctx.currentTime;
    gain.gain.setValueAtTime(gainValue, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + durationMs / 1000);
    osc.start(t);
    osc.stop(t + durationMs / 1000);
  } catch {
    // silent fail
  }
}

function useWorkoutSoundWeb(): WorkoutSoundCallbacks {
  const ctxRef = useRef<AudioContext | null>(null);

  const getOrCreateCtx = useCallback((): AudioContext | null => {
    if (typeof AudioContext === "undefined" && typeof (window as unknown as { webkitAudioContext?: unknown }).webkitAudioContext === "undefined") {
      return null;
    }
    if (ctxRef.current === null) {
      const Ctor =
        AudioContext ??
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      ctxRef.current = new Ctor();
    }
    return ctxRef.current;
  }, []);

  // Unlock: resume a suspended AudioContext from a user gesture.
  const unlockAudio = useCallback(() => {
    const ctx = getOrCreateCtx();
    if (ctx && ctx.state === "suspended") {
      void ctx.resume().catch(() => {});
    }
  }, [getOrCreateCtx]);

  useEffect(() => {
    return () => {
      void ctxRef.current?.close().catch(() => {});
    };
  }, []);

  const playSetStart     = useCallback(() => { const c = getOrCreateCtx(); if (c) playOscillator(c, 880, 120); }, [getOrCreateCtx]);
  const playSetEnd       = useCallback(() => { const c = getOrCreateCtx(); if (c) playOscillator(c, 660, 120); }, [getOrCreateCtx]);
  const playExerciseStart = useCallback(() => { const c = getOrCreateCtx(); if (c) playOscillator(c, 1047, 400); }, [getOrCreateCtx]);
  const playExerciseEnd  = useCallback(() => { const c = getOrCreateCtx(); if (c) playOscillator(c, 523, 400); }, [getOrCreateCtx]);

  return { unlockAudio, playSetStart, playSetEnd, playExerciseStart, playExerciseEnd };
}

// ---------------------------------------------------------------------------
// Native implementation — expo-av WAV files
// ---------------------------------------------------------------------------

type SoundRef = React.MutableRefObject<Audio.Sound | null>;

async function loadSound(source: number, ref: SoundRef): Promise<void> {
  try {
    const { sound } = await Audio.Sound.createAsync(source);
    ref.current = sound;
  } catch {
    // file missing or platform unsupported — silent fail
  }
}

async function playSound(ref: SoundRef): Promise<void> {
  try {
    const sound = ref.current;
    if (sound === null) return;
    await sound.setPositionAsync(0);
    await sound.playAsync();
  } catch {
    // silent fail
  }
}

function useWorkoutSoundNative(): WorkoutSoundCallbacks {
  const setStartRef      = useRef<Audio.Sound | null>(null);
  const setEndRef        = useRef<Audio.Sound | null>(null);
  const exStartRef       = useRef<Audio.Sound | null>(null);
  const exEndRef         = useRef<Audio.Sound | null>(null);

  useEffect(() => {
    void Audio.setAudioModeAsync({ playsInSilentModeIOS: true }).catch(() => {});
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    void loadSound(require("../../assets/sounds/beep_set_start.wav"),      setStartRef);
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    void loadSound(require("../../assets/sounds/beep_set_end.wav"),        setEndRef);
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    void loadSound(require("../../assets/sounds/beep_exercise_start.wav"), exStartRef);
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    void loadSound(require("../../assets/sounds/beep_exercise_end.wav"),   exEndRef);

    return () => {
      void setStartRef.current?.unloadAsync().catch(() => {});
      void setEndRef.current?.unloadAsync().catch(() => {});
      void exStartRef.current?.unloadAsync().catch(() => {});
      void exEndRef.current?.unloadAsync().catch(() => {});
    };
  }, []);

  const unlockAudio      = useCallback(() => {}, []); // no-op on native
  const playSetStart     = useCallback(() => { void playSound(setStartRef); }, []);
  const playSetEnd       = useCallback(() => { void playSound(setEndRef); }, []);
  const playExerciseStart = useCallback(() => { void playSound(exStartRef); }, []);
  const playExerciseEnd  = useCallback(() => { void playSound(exEndRef); }, []);

  return { unlockAudio, playSetStart, playSetEnd, playExerciseStart, playExerciseEnd };
}

// ---------------------------------------------------------------------------
// Unified export
// ---------------------------------------------------------------------------

export function useWorkoutSound(): WorkoutSoundCallbacks {
  // Rules of Hooks: always call both, return based on platform.
  const web    = useWorkoutSoundWeb();
  const native = useWorkoutSoundNative();
  return Platform.OS === "web" ? web : native;
}
