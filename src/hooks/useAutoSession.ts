import { useCallback, useEffect, useRef, useState } from "react";
import type { AutoTimerConfig, WorkoutExercise } from "../types";
import { useCountdown } from "./useCountdown";
import type { WorkoutSoundCallbacks } from "./useWorkoutSound";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export const GRACE_PERIOD_MS = 5000;

export type AutoPhase =
  | "IDLE"
  | "GRACE"
  | "RUNNING"
  | "SET_REST"
  | "EXERCISE_REST"
  | "DONE";

export interface AutoSessionConfig {
  exercises: WorkoutExercise[]; // sorted by order
  autoTimerConfig: AutoTimerConfig;
  onSetComplete: (
    exerciseId: string,
    setNumber: number,
    reps: number,
    weightKg?: number
  ) => void;
  onSessionComplete: () => void;
}

export interface AutoSessionState {
  phase: AutoPhase;
  graceRemaining: number; // ms
  setRemaining: number;   // ms
  restRemaining: number;  // ms
  currentExerciseIndex: number;
  currentSetNumber: number;
  start: () => void;
  skipRest: () => void;
  skipGrace: () => void;
  stopEarly: () => void;
}

// ---------------------------------------------------------------------------
// useAutoSession
// ---------------------------------------------------------------------------

export function useAutoSession(
  config: AutoSessionConfig,
  sounds: WorkoutSoundCallbacks
): AutoSessionState {
  const { exercises, autoTimerConfig, onSetComplete, onSessionComplete } = config;

  const [phase, setPhase] = useState<AutoPhase>("IDLE");

  // Mirror mutable index/set refs to state for UI reactivity
  const [currentExerciseIndex, setCurrentExerciseIndexState] = useState(0);
  const [currentSetNumber, setCurrentSetNumberState] = useState(1);

  // Refs to avoid stale closures in callbacks
  const exerciseIndexRef = useRef(0);
  const setNumberRef = useRef(1);
  const phaseRef = useRef<AutoPhase>("IDLE");

  const setExerciseIndex = useCallback((idx: number) => {
    exerciseIndexRef.current = idx;
    setCurrentExerciseIndexState(idx);
  }, []);

  const setSetNumber = useCallback((n: number) => {
    setNumberRef.current = n;
    setCurrentSetNumberState(n);
  }, []);

  const setPhaseSync = useCallback((p: AutoPhase) => {
    phaseRef.current = p;
    setPhase(p);
  }, []);

  // Three countdowns — initialized with placeholder; real durations set via reset()
  const grace = useCountdown(GRACE_PERIOD_MS);
  const setTimer = useCountdown(autoTimerConfig.secondsPerSet * 1000);
  const restTimer = useCountdown(autoTimerConfig.restBetweenSetsSecs * 1000);

  // ------------------------------------------------------------------
  // Helpers
  // ------------------------------------------------------------------

  const logCurrentSet = useCallback(() => {
    const ex = exercises[exerciseIndexRef.current];
    if (ex === undefined) return;
    onSetComplete(
      ex.exerciseId,
      setNumberRef.current,
      ex.reps,
      ex.weightKg
    );
  }, [exercises, onSetComplete]);

  const startGrace = useCallback(() => {
    grace.reset(GRACE_PERIOD_MS);
    setPhaseSync("GRACE");
    // start() needs to be called after reset propagates — use setTimeout(0)
    setTimeout(() => grace.start(), 0);
  }, [grace, setPhaseSync]);

  const startSet = useCallback(() => {
    sounds.playSetStart();
    setTimer.reset(autoTimerConfig.secondsPerSet * 1000);
    setPhaseSync("RUNNING");
    setTimeout(() => setTimer.start(), 0);
  }, [sounds, setTimer, autoTimerConfig.secondsPerSet, setPhaseSync]);

  const startSetRest = useCallback(() => {
    restTimer.reset(autoTimerConfig.restBetweenSetsSecs * 1000);
    setPhaseSync("SET_REST");
    setTimeout(() => restTimer.start(), 0);
  }, [restTimer, autoTimerConfig.restBetweenSetsSecs, setPhaseSync]);

  const startExerciseRest = useCallback(() => {
    restTimer.reset(autoTimerConfig.restBetweenExercisesSecs * 1000);
    setPhaseSync("EXERCISE_REST");
    setTimeout(() => restTimer.start(), 0);
  }, [restTimer, autoTimerConfig.restBetweenExercisesSecs, setPhaseSync]);

  // ------------------------------------------------------------------
  // Transition: after a set completes (natural or stopEarly)
  // ------------------------------------------------------------------

  const handleSetComplete = useCallback(() => {
    sounds.playSetEnd();
    logCurrentSet();

    const currentEx = exercises[exerciseIndexRef.current];
    const totalSets = currentEx?.sets ?? 0;
    const isLastSet = setNumberRef.current >= totalSets;
    const isLastExercise = exerciseIndexRef.current >= exercises.length - 1;

    if (!isLastSet) {
      // More sets in this exercise
      setSetNumber(setNumberRef.current + 1);
      startSetRest();
    } else if (!isLastExercise) {
      // Last set, more exercises
      sounds.playExerciseEnd();
      startExerciseRest();
    } else {
      // Last set, last exercise
      sounds.playExerciseEnd();
      setPhaseSync("DONE");
      onSessionComplete();
    }
  }, [
    sounds,
    logCurrentSet,
    exercises,
    setSetNumber,
    startSetRest,
    startExerciseRest,
    setPhaseSync,
    onSessionComplete,
  ]);

  // ------------------------------------------------------------------
  // Countdown completion effects
  // ------------------------------------------------------------------

  useEffect(() => {
    if (grace.isDone && phaseRef.current === "GRACE") {
      startSet();
    }
  }, [grace.isDone, startSet]);

  useEffect(() => {
    if (setTimer.isDone && phaseRef.current === "RUNNING") {
      handleSetComplete();
    }
  }, [setTimer.isDone, handleSetComplete]);

  useEffect(() => {
    if (restTimer.isDone && phaseRef.current === "SET_REST") {
      startGrace();
    }
    if (restTimer.isDone && phaseRef.current === "EXERCISE_REST") {
      const nextIdx = exerciseIndexRef.current + 1;
      setExerciseIndex(nextIdx);
      setSetNumber(1);
      sounds.playExerciseStart();
      startGrace();
    }
  }, [restTimer.isDone, startGrace, setExerciseIndex, setSetNumber, sounds]);

  // ------------------------------------------------------------------
  // Public API
  // ------------------------------------------------------------------

  const start = useCallback(() => {
    if (phaseRef.current !== "IDLE") return;
    setExerciseIndex(0);
    setSetNumber(1);
    startGrace();
  }, [startGrace, setExerciseIndex, setSetNumber]);

  const skipGrace = useCallback(() => {
    if (phaseRef.current !== "GRACE") return;
    grace.reset(0);
    startSet();
  }, [grace, startSet]);

  const skipRest = useCallback(() => {
    if (phaseRef.current === "SET_REST") {
      restTimer.reset(0);
      startGrace();
    } else if (phaseRef.current === "EXERCISE_REST") {
      restTimer.reset(0);
      const nextIdx = exerciseIndexRef.current + 1;
      setExerciseIndex(nextIdx);
      setSetNumber(1);
      sounds.playExerciseStart();
      startGrace();
    }
  }, [restTimer, startGrace, setExerciseIndex, setSetNumber, sounds]);

  const stopEarly = useCallback(() => {
    if (phaseRef.current !== "RUNNING") return;
    setTimer.reset(0);
    handleSetComplete();
  }, [setTimer, handleSetComplete]);

  return {
    phase,
    graceRemaining: grace.remaining,
    setRemaining: setTimer.remaining,
    restRemaining: restTimer.remaining,
    currentExerciseIndex,
    currentSetNumber,
    start,
    skipRest,
    skipGrace,
    stopEarly,
  };
}
