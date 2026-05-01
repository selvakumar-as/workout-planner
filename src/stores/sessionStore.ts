import { create } from "zustand";
import { persist, createJSONStorage } from 'zustand/middleware';
import { MMKVLoader } from 'react-native-mmkv-storage';
import type { AutoTimerConfig, Session, SessionSet, SessionStatus } from "../types";
import { SessionStatusValues } from "../types";
import { randomUUID } from "../utils/uuid";

// ---------------------------------------------------------------------------
// MMKV storage adapter
// ---------------------------------------------------------------------------

const _sessionStorage = new MMKVLoader().withInstanceID('session-store').initialize();
const sessionMMKVAdapter = {
  getItem: async (name: string): Promise<string | null> => (await _sessionStorage.getItem(name) as string) ?? null,
  setItem: (name: string, value: string): Promise<unknown> => _sessionStorage.setItem(name, value),
  removeItem: (name: string): Promise<unknown> => Promise.resolve(_sessionStorage.removeItem(name)),
};

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

export const useSessionStore = create<SessionState>()(
  persist(
    (set, get) => ({
      activeSession: null,
      sessionHistory: [],

      startSession: (workoutId: string, options?: { autoMode?: boolean; autoTimerConfig?: AutoTimerConfig }) => {
        const newSession: Session = {
          id: randomUUID(),
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
          id: randomUUID(),
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
    }),
    {
      name: 'session-store',
      storage: createJSONStorage(() => sessionMMKVAdapter),
      partialize: (state) => ({ sessionHistory: state.sessionHistory }),
    }
  )
);

// ---------------------------------------------------------------------------
// Vanilla store accessor (for use in ViewModel without React hooks)
// ---------------------------------------------------------------------------

export const sessionStoreApi = useSessionStore;
