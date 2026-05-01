import { create } from "zustand";
import type { AutoTimerConfig, Session, SessionSet, SessionStatus } from "../types";
import { SessionStatusValues } from "../types";

// ---------------------------------------------------------------------------
// State shape
// ---------------------------------------------------------------------------

interface SessionState {
  activeSession: Session | null;
  sessionHistory: Session[];
  // actions
  startSession: (
    workoutId: string,
    options?: { autoMode?: boolean; autoTimerConfig?: AutoTimerConfig }
  ) => void;
  completeSession: () => void;
  abandonSession: () => void;
  logSet: (set: Omit<SessionSet, "id" | "completedAt">) => void;
  clearSession: () => void;
  setAutoMode: (autoMode: boolean) => void;
}

// ---------------------------------------------------------------------------
// Store
// ---------------------------------------------------------------------------

export const useSessionStore = create<SessionState>((set, get) => ({
  activeSession: null,
  sessionHistory: [],

  startSession: (workoutId: string, options?: { autoMode?: boolean; autoTimerConfig?: AutoTimerConfig }) => {
    const newSession: Session = {
      id: crypto.randomUUID(),
      workoutId,
      startedAt: new Date().toISOString(),
      status: SessionStatusValues.IN_PROGRESS,
      sets: [],
      autoMode: options?.autoMode,
      autoTimerConfig: options?.autoTimerConfig,
    };
    set({ activeSession: newSession });
  },

  completeSession: () => {
    const { activeSession, sessionHistory } = get();
    if (activeSession === null) return;

    const completed: Session = {
      ...activeSession,
      status: SessionStatusValues.COMPLETED,
      completedAt: new Date().toISOString(),
    };
    set({
      activeSession: null,
      sessionHistory: [completed, ...sessionHistory],
    });
  },

  abandonSession: () => {
    const { activeSession, sessionHistory } = get();
    if (activeSession === null) return;

    const abandoned: Session = {
      ...activeSession,
      status: SessionStatusValues.ABANDONED,
      completedAt: new Date().toISOString(),
    };
    set({
      activeSession: null,
      sessionHistory: [abandoned, ...sessionHistory],
    });
  },

  logSet: (setData: Omit<SessionSet, "id" | "completedAt">) => {
    const { activeSession } = get();
    if (activeSession === null) return;

    const newSet: SessionSet = {
      ...setData,
      id: crypto.randomUUID(),
      completedAt: new Date().toISOString(),
    };
    set({
      activeSession: {
        ...activeSession,
        sets: [...activeSession.sets, newSet],
      },
    });
  },

  clearSession: () => {
    set({ activeSession: null });
  },

  setAutoMode: (autoMode: boolean) => {
    set((state) => {
      if (state.activeSession === null) return state;
      return {
        activeSession: { ...state.activeSession, autoMode },
      };
    });
  },
}));

// ---------------------------------------------------------------------------
// Vanilla store accessor (for use in ViewModel without React hooks)
// ---------------------------------------------------------------------------

export const sessionStoreApi = useSessionStore;
