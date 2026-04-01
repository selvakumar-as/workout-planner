/**
 * Unit tests for SessionViewModel
 *
 * Covers all ViewModel methods by asserting state transitions against the
 * Zustand store. Implementation details (e.g. exact set() calls) are NOT
 * tested — only the observable state is.
 */

import { SessionViewModel } from '../viewmodels/SessionViewModel';
import { sessionStoreApi } from '../stores/sessionStore';

// ---------------------------------------------------------------------------
// Fixed test doubles
// ---------------------------------------------------------------------------

const FIXED_DATE = '2026-01-01T10:00:00.000Z';

// Deterministic UUIDs — counter resets before each test.
let uuidCounter = 0;

beforeEach(() => {
  uuidCounter = 0;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (global as any).crypto = {
    randomUUID: () => `test-uuid-${++uuidCounter}`,
  } as unknown as Crypto;

  // Pin wall-clock time.
  jest.useFakeTimers();
  jest.setSystemTime(new Date(FIXED_DATE));

  // Reset Zustand store to a clean slate.
  sessionStoreApi.setState({ activeSession: null, sessionHistory: [] });
});

afterEach(() => {
  jest.useRealTimers();
});

// ---------------------------------------------------------------------------
// Helper — fresh ViewModel instance per test.
// ---------------------------------------------------------------------------
function makeVM(): SessionViewModel {
  return new SessionViewModel();
}

// A valid UUID used as a stand-in for workout / exercise IDs in tests.
const WORKOUT_ID = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
const EXERCISE_ID = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';

// ---------------------------------------------------------------------------
// Initial state
// ---------------------------------------------------------------------------

describe('Initial state', () => {
  it('activeSession is null', () => {
    expect(makeVM().activeSession).toBeNull();
  });

  it('isSessionActive is false', () => {
    expect(makeVM().isSessionActive).toBe(false);
  });

  it('sessionSets returns empty array', () => {
    expect(makeVM().sessionSets).toEqual([]);
  });

  it('sessionStatus returns null', () => {
    expect(makeVM().sessionStatus).toBeNull();
  });

  it('sessionHistory returns empty array', () => {
    expect(makeVM().sessionHistory).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// startSession
// ---------------------------------------------------------------------------

describe('startSession', () => {
  it('activeSession becomes non-null after startSession', () => {
    const vm = makeVM();
    vm.startSession(WORKOUT_ID);
    expect(vm.activeSession).not.toBeNull();
  });

  it('activeSession.workoutId equals the provided workoutId', () => {
    const vm = makeVM();
    vm.startSession(WORKOUT_ID);
    expect(vm.activeSession?.workoutId).toBe(WORKOUT_ID);
  });

  it('activeSession.status equals IN_PROGRESS', () => {
    const vm = makeVM();
    vm.startSession(WORKOUT_ID);
    expect(vm.activeSession?.status).toBe('IN_PROGRESS');
  });

  it('activeSession.sets is an empty array', () => {
    const vm = makeVM();
    vm.startSession(WORKOUT_ID);
    expect(vm.activeSession?.sets).toEqual([]);
  });

  it('activeSession.startedAt equals the mocked ISO date', () => {
    const vm = makeVM();
    vm.startSession(WORKOUT_ID);
    expect(vm.activeSession?.startedAt).toBe(FIXED_DATE);
  });

  it('activeSession.id is the first mocked UUID', () => {
    const vm = makeVM();
    vm.startSession(WORKOUT_ID);
    expect(vm.activeSession?.id).toBe('test-uuid-1');
  });

  it('isSessionActive becomes true after startSession', () => {
    const vm = makeVM();
    vm.startSession(WORKOUT_ID);
    expect(vm.isSessionActive).toBe(true);
  });

  it('sessionStatus becomes IN_PROGRESS after startSession', () => {
    const vm = makeVM();
    vm.startSession(WORKOUT_ID);
    expect(vm.sessionStatus).toBe('IN_PROGRESS');
  });
});

// ---------------------------------------------------------------------------
// completeSession
// ---------------------------------------------------------------------------

describe('completeSession', () => {
  it('activeSession becomes null after startSession + completeSession', () => {
    const vm = makeVM();
    vm.startSession(WORKOUT_ID);
    vm.completeSession();
    expect(vm.activeSession).toBeNull();
  });

  it('isSessionActive becomes false after completeSession', () => {
    const vm = makeVM();
    vm.startSession(WORKOUT_ID);
    vm.completeSession();
    expect(vm.isSessionActive).toBe(false);
  });

  it('sessionHistory has exactly 1 entry after one completed session', () => {
    const vm = makeVM();
    vm.startSession(WORKOUT_ID);
    vm.completeSession();
    expect(vm.sessionHistory).toHaveLength(1);
  });

  it('history entry status equals COMPLETED', () => {
    const vm = makeVM();
    vm.startSession(WORKOUT_ID);
    vm.completeSession();
    expect(vm.sessionHistory[0].status).toBe('COMPLETED');
  });

  it('history entry completedAt equals the mocked ISO date', () => {
    const vm = makeVM();
    vm.startSession(WORKOUT_ID);
    vm.completeSession();
    expect(vm.sessionHistory[0].completedAt).toBe(FIXED_DATE);
  });

  it('is a no-op when called with no active session (no throw, history stays empty)', () => {
    const vm = makeVM();
    expect(() => vm.completeSession()).not.toThrow();
    expect(vm.sessionHistory).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// abandonSession
// ---------------------------------------------------------------------------

describe('abandonSession', () => {
  it('activeSession becomes null after startSession + abandonSession', () => {
    const vm = makeVM();
    vm.startSession(WORKOUT_ID);
    vm.abandonSession();
    expect(vm.activeSession).toBeNull();
  });

  it('history entry status equals ABANDONED', () => {
    const vm = makeVM();
    vm.startSession(WORKOUT_ID);
    vm.abandonSession();
    expect(vm.sessionHistory[0].status).toBe('ABANDONED');
  });

  it('history entry completedAt is set after abandonSession', () => {
    const vm = makeVM();
    vm.startSession(WORKOUT_ID);
    vm.abandonSession();
    expect(vm.sessionHistory[0].completedAt).toBeDefined();
    expect(vm.sessionHistory[0].completedAt).toBe(FIXED_DATE);
  });

  it('is a no-op when called with no active session (no throw, history stays empty)', () => {
    const vm = makeVM();
    expect(() => vm.abandonSession()).not.toThrow();
    expect(vm.sessionHistory).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// logSet
// ---------------------------------------------------------------------------

describe('logSet', () => {
  const setData = {
    exerciseId: EXERCISE_ID,
    setNumber: 1,
    reps: 10,
    weightKg: 60,
  };

  it('appends one set to sessionSets after logSet', () => {
    const vm = makeVM();
    vm.startSession(WORKOUT_ID);
    vm.logSet(setData);
    expect(vm.sessionSets).toHaveLength(1);
  });

  it('logged set has the mocked UUID as id', () => {
    const vm = makeVM();
    vm.startSession(WORKOUT_ID);
    // UUID 1 is consumed by startSession; UUID 2 goes to the set.
    vm.logSet(setData);
    expect(vm.sessionSets[0].id).toBe('test-uuid-2');
  });

  it('logged set completedAt equals the mocked ISO date', () => {
    const vm = makeVM();
    vm.startSession(WORKOUT_ID);
    vm.logSet(setData);
    expect(vm.sessionSets[0].completedAt).toBe(FIXED_DATE);
  });

  it('logged set reps matches what was passed in', () => {
    const vm = makeVM();
    vm.startSession(WORKOUT_ID);
    vm.logSet(setData);
    expect(vm.sessionSets[0].reps).toBe(10);
  });

  it('logged set weightKg matches what was passed in', () => {
    const vm = makeVM();
    vm.startSession(WORKOUT_ID);
    vm.logSet(setData);
    expect(vm.sessionSets[0].weightKg).toBe(60);
  });

  it('multiple logSet calls accumulate sets in order', () => {
    const vm = makeVM();
    vm.startSession(WORKOUT_ID);
    vm.logSet({ ...setData, setNumber: 1, reps: 8 });
    vm.logSet({ ...setData, setNumber: 2, reps: 6 });
    expect(vm.sessionSets).toHaveLength(2);
    expect(vm.sessionSets[0].reps).toBe(8);
    expect(vm.sessionSets[1].reps).toBe(6);
  });

  it('is a no-op when no active session (no throw, sessionSets stays empty)', () => {
    const vm = makeVM();
    expect(() => vm.logSet(setData)).not.toThrow();
    expect(vm.sessionSets).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// clearSession
// ---------------------------------------------------------------------------

describe('clearSession', () => {
  it('activeSession becomes null after startSession + clearSession', () => {
    const vm = makeVM();
    vm.startSession(WORKOUT_ID);
    vm.clearSession();
    expect(vm.activeSession).toBeNull();
  });

  it('sessionHistory remains empty after clearSession (session not moved to history)', () => {
    const vm = makeVM();
    vm.startSession(WORKOUT_ID);
    vm.clearSession();
    expect(vm.sessionHistory).toHaveLength(0);
  });

  it('isSessionActive becomes false after clearSession', () => {
    const vm = makeVM();
    vm.startSession(WORKOUT_ID);
    vm.clearSession();
    expect(vm.isSessionActive).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// sessionHistory ordering
// ---------------------------------------------------------------------------

describe('sessionHistory ordering', () => {
  it('most recent completed session is first in sessionHistory', () => {
    const vm = makeVM();

    // First session.
    vm.startSession(WORKOUT_ID);
    const firstSessionId = vm.activeSession!.id;
    vm.completeSession();

    // Second session.
    vm.startSession(WORKOUT_ID);
    const secondSessionId = vm.activeSession!.id;
    vm.completeSession();

    expect(vm.sessionHistory).toHaveLength(2);
    // Most recent is prepended — should be at index 0.
    expect(vm.sessionHistory[0].id).toBe(secondSessionId);
    expect(vm.sessionHistory[1].id).toBe(firstSessionId);
  });
});
