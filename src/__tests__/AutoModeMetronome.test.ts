/**
 * Tests for the F6 metronome in auto RUNNING phase.
 *
 * Covers the useMetronomeTick hook directly:
 *  - The interval fires when enabled=true and isRunning=true.
 *  - The interval does NOT fire when enabled=false.
 *  - The interval does NOT fire when isRunning=false.
 *  - Cleanup: the interval is cleared when the hook unmounts.
 *  - Cleanup: the interval is cleared when enabled/isRunning change to false.
 *
 * Strategy:
 *  - Mount the hook via react-test-renderer + act.
 *  - Use jest fake timers to control setInterval ticks precisely.
 */

import React from "react";
import { act, create } from "react-test-renderer";
import { useMetronomeTick } from "../hooks/useMetronomeTick";

// Tell React's concurrent-mode scheduler that we are inside an act()-aware
// test environment.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
(global as any).IS_REACT_ACT_ENVIRONMENT = true;

// ---------------------------------------------------------------------------
// Test helper — mounts the hook in a minimal React component
// ---------------------------------------------------------------------------

interface HookProps {
  enabled: boolean;
  isRunning: boolean;
  playTick: () => void;
}

function HookHarness(props: HookProps): null {
  useMetronomeTick(props);
  return null;
}

function mountHook(props: HookProps) {
  let renderer!: ReturnType<typeof create>;
  act(() => {
    renderer = create(React.createElement(HookHarness, props));
  });
  const update = (nextProps: HookProps) =>
    act(() => {
      renderer.update(React.createElement(HookHarness, nextProps));
    });
  const unmount = () => act(() => { renderer.unmount(); });
  return { update, unmount };
}

// ---------------------------------------------------------------------------
// Setup / teardown
// ---------------------------------------------------------------------------

beforeEach(() => {
  jest.useFakeTimers();
});

afterEach(() => {
  jest.useRealTimers();
  jest.clearAllMocks();
});

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("useMetronomeTick", () => {
  describe("when enabled=true and isRunning=true", () => {
    it("should call playTick after 1 second", () => {
      const playTick = jest.fn();
      mountHook({ enabled: true, isRunning: true, playTick });

      act(() => { jest.advanceTimersByTime(1000); });

      expect(playTick).toHaveBeenCalledTimes(1);
    });

    it("should call playTick multiple times as time advances", () => {
      const playTick = jest.fn();
      mountHook({ enabled: true, isRunning: true, playTick });

      act(() => { jest.advanceTimersByTime(3000); });

      expect(playTick).toHaveBeenCalledTimes(3);
    });
  });

  describe("when enabled=false", () => {
    it("should NOT call playTick even after time advances", () => {
      const playTick = jest.fn();
      mountHook({ enabled: false, isRunning: true, playTick });

      act(() => { jest.advanceTimersByTime(5000); });

      expect(playTick).not.toHaveBeenCalled();
    });
  });

  describe("when isRunning=false", () => {
    it("should NOT call playTick even when enabled=true", () => {
      const playTick = jest.fn();
      mountHook({ enabled: true, isRunning: false, playTick });

      act(() => { jest.advanceTimersByTime(5000); });

      expect(playTick).not.toHaveBeenCalled();
    });
  });

  describe("when both enabled=false and isRunning=false", () => {
    it("should NOT call playTick", () => {
      const playTick = jest.fn();
      mountHook({ enabled: false, isRunning: false, playTick });

      act(() => { jest.advanceTimersByTime(5000); });

      expect(playTick).not.toHaveBeenCalled();
    });
  });

  describe("cleanup", () => {
    it("should stop calling playTick after unmount", () => {
      const playTick = jest.fn();
      const { unmount } = mountHook({ enabled: true, isRunning: true, playTick });

      act(() => { jest.advanceTimersByTime(1000); });
      expect(playTick).toHaveBeenCalledTimes(1);

      unmount();
      playTick.mockClear();

      act(() => { jest.advanceTimersByTime(3000); });
      expect(playTick).not.toHaveBeenCalled();
    });

    it("should stop calling playTick when isRunning changes to false", () => {
      const playTick = jest.fn();
      const { update } = mountHook({ enabled: true, isRunning: true, playTick });

      act(() => { jest.advanceTimersByTime(1000); });
      expect(playTick).toHaveBeenCalledTimes(1);

      update({ enabled: true, isRunning: false, playTick });
      playTick.mockClear();

      act(() => { jest.advanceTimersByTime(3000); });
      expect(playTick).not.toHaveBeenCalled();
    });

    it("should stop calling playTick when enabled changes to false", () => {
      const playTick = jest.fn();
      const { update } = mountHook({ enabled: true, isRunning: true, playTick });

      act(() => { jest.advanceTimersByTime(1000); });
      expect(playTick).toHaveBeenCalledTimes(1);

      update({ enabled: false, isRunning: true, playTick });
      playTick.mockClear();

      act(() => { jest.advanceTimersByTime(3000); });
      expect(playTick).not.toHaveBeenCalled();
    });
  });
});
