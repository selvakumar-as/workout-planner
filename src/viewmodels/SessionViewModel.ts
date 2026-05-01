import { sessionStoreApi } from "../store/sessionStore";
import type { AutoTimerConfig, Session, SessionSet, SessionStatus } from "../types";

// ---------------------------------------------------------------------------
// SessionViewModel
// Pure TypeScript class — NO React imports.
// State is read from the Zustand store via getState().
// Actions delegate to the store's action methods.
// ---------------------------------------------------------------------------

export class SessionViewModel {
  // -------------------------------------------------------------------------
  // Getters — read from store snapshot
  // -------------------------------------------------------------------------

  get activeSession(): Session | null {
    return sessionStoreApi.getState().activeSession;
  }

  get isSessionActive(): boolean {
    return sessionStoreApi.getState().activeSession !== null;
  }

  get sessionSets(): SessionSet[] {
    const { activeSession } = sessionStoreApi.getState();
    return activeSession?.sets ?? [];
  }

  get sessionStatus(): SessionStatus | null {
    return sessionStoreApi.getState().activeSession?.status ?? null;
  }

  get sessionHistory(): Session[] {
    return sessionStoreApi.getState().sessionHistory;
  }

  get autoMode(): boolean {
    return sessionStoreApi.getState().activeSession?.autoMode ?? false;
  }

  get autoTimerConfig(): AutoTimerConfig | null {
    return sessionStoreApi.getState().activeSession?.autoTimerConfig ?? null;
  }

  // -------------------------------------------------------------------------
  // Actions — delegate to store
  // -------------------------------------------------------------------------

  startSession(
    workoutId: string,
    options?: { autoMode?: boolean; autoTimerConfig?: AutoTimerConfig }
  ): void {
    sessionStoreApi.getState().startSession(workoutId, options);
  }

  setAutoMode(autoMode: boolean): void {
    sessionStoreApi.getState().setAutoMode(autoMode);
  }

  completeSession(): void {
    sessionStoreApi.getState().completeSession();
  }

  abandonSession(): void {
    sessionStoreApi.getState().abandonSession();
  }

  logSet(set: Omit<SessionSet, "id" | "completedAt">): void {
    sessionStoreApi.getState().logSet(set);
  }

  clearSession(): void {
    sessionStoreApi.getState().clearSession();
  }
}
