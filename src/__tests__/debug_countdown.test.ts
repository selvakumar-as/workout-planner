import React from "react";
import { act, create } from "react-test-renderer";
import { useAutoSession, GRACE_PERIOD_MS } from "../hooks/useAutoSession";
import type { AutoSessionConfig, AutoSessionState } from "../hooks/useAutoSession";
import type { AutoTimerConfig, WorkoutExercise } from "../types";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
(global as any).IS_REACT_ACT_ENVIRONMENT = true;

const AUTO_CONFIG: AutoTimerConfig = { secondsPerSet: 30, restBetweenSetsSecs: 15, restBetweenExercisesSecs: 20 };
const SET_REST_MS = AUTO_CONFIG.restBetweenSetsSecs * 1000;
const EXERCISES_MULTI: WorkoutExercise[] = [
  { exerciseId: "ex1", order: 0, sets: 2, reps: 10 },
  { exerciseId: "ex2", order: 1, sets: 1, reps: 8 },
];
const makeSounds = () => ({
  unlockAudio: jest.fn(), playSetStart: jest.fn(), playSetEnd: jest.fn(),
  playExerciseStart: jest.fn(), playExerciseEnd: jest.fn(),
});

function advance(ms: number) { act(() => { jest.advanceTimersByTime(ms); }); }

function makeSession(sounds: ReturnType<typeof makeSounds>) {
  let latestState!: AutoSessionState;
  const onSetComplete = jest.fn();
  const onSessionComplete = jest.fn();
  const config: AutoSessionConfig = {
    exercises: EXERCISES_MULTI,
    autoTimerConfig: AUTO_CONFIG,
    onSetComplete,
    onSessionComplete,
  };
  function TestComponent() { latestState = useAutoSession(config, sounds); return null; }
  let renderer!: ReturnType<typeof create>;
  act(() => { renderer = create(React.createElement(TestComponent)); });
  return { read: () => latestState, unmount: () => act(() => { renderer.unmount(); }), onSetComplete };
}

test("trace grace countdown by 1000ms steps", () => {
  jest.useFakeTimers(); jest.setSystemTime(0);
  const sounds = makeSounds();
  const { read, unmount, onSetComplete } = makeSession(sounds);

  act(() => { read().start(); });
  advance(0);
  advance(GRACE_PERIOD_MS + 200);
  advance(0);
  // RUNNING
  advance(AUTO_CONFIG.secondsPerSet * 1000 + 200);
  advance(0);
  // SET_REST
  advance(SET_REST_MS + 200); // This completes SET_REST and transitions to GRACE, then fires grace.start()
  console.log("AFTER SET_REST+200:", read().phase, "graceRemaining=", read().graceRemaining, "t=", Date.now());
  // Now grace should be running - tick by 1000ms
  for (let i = 1; i <= 6; i++) {
    advance(1000);
    console.log(`  +${i * 1000}ms: phase=${read().phase} graceRemaining=${read().graceRemaining} t=${Date.now()}`);
  }

  unmount();
  jest.useRealTimers();
});
