import { useSessionStore } from '../stores/sessionStore';
import type { AutoTimerConfig, Session, SessionSet, SessionStatus } from '../types';

export function useSessionViewModel() {
  const activeSession = useSessionStore((s) => s.activeSession);
  const sessionHistory = useSessionStore((s) => s.sessionHistory);
  const startSessionAction = useSessionStore((s) => s.startSession);
  const completeSessionAction = useSessionStore((s) => s.completeSession);
  const abandonSessionAction = useSessionStore((s) => s.abandonSession);
  const logSetAction = useSessionStore((s) => s.logSet);
  const clearSessionAction = useSessionStore((s) => s.clearSession);
  const setAutoModeAction = useSessionStore((s) => s.setAutoMode);

  const isSessionActive = activeSession !== null;
  const sessionSets: SessionSet[] = activeSession?.sets ?? [];
  const sessionStatus: SessionStatus | null = activeSession?.status ?? null;
  const autoMode = activeSession?.autoMode ?? false;
  const autoTimerConfig: AutoTimerConfig | null = activeSession?.autoTimerConfig ?? null;

  const startSession = (
    workoutId: string,
    options?: { autoMode?: boolean; autoTimerConfig?: AutoTimerConfig }
  ): void => {
    startSessionAction(workoutId, options);
  };

  const completeSession = (): void => {
    completeSessionAction();
  };

  const abandonSession = (): void => {
    abandonSessionAction();
  };

  const logSet = (set: Omit<SessionSet, 'id' | 'completedAt'>): void => {
    logSetAction(set);
  };

  const clearSession = (): void => {
    clearSessionAction();
  };

  const setAutoMode = (value: boolean): void => {
    setAutoModeAction(value);
  };

  return {
    // Data
    activeSession,
    sessionHistory,
    // Derived
    isSessionActive,
    sessionSets,
    sessionStatus,
    autoMode,
    autoTimerConfig,
    // Handlers
    startSession,
    completeSession,
    abandonSession,
    logSet,
    clearSession,
    setAutoMode,
  };
}
