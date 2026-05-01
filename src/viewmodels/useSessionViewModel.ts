import { useSessionStore } from '../stores/sessionStore';
import { workoutStoreApi } from '../stores/workoutStore';
import type { AutoTimerConfig, Session, SessionSet, SessionStatus } from '../types';
import type { SessionSummaryData, ExerciseSummaryItem } from '../types/sessionSummary';

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
  const autoTimerConfig: AutoTimerConfig | null = (() => {
    if (activeSession === null) return null;
    const workout = workoutStoreApi.getState().workouts.find(
      (w) => w.id === activeSession.workoutId
    );
    return workout?.autoTimerConfig ?? null;
  })();

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

  const getSummaryForSession = (sessionId: string): SessionSummaryData | null => {
    const allSessions = useSessionStore.getState().sessionHistory;
    const session: Session | undefined = allSessions.find((s) => s.id === sessionId);
    if (session === undefined) return null;

    const exercises = workoutStoreApi.getState().exercises;
    const workouts = workoutStoreApi.getState().workouts;

    const workout = workouts.find((w) => w.id === session.workoutId);
    const workoutName = workout?.name ?? "Workout";

    const byExercise = new Map<string, SessionSet[]>();
    for (const s of session.sets) {
      const existing = byExercise.get(s.exerciseId);
      if (existing !== undefined) {
        existing.push(s);
      } else {
        byExercise.set(s.exerciseId, [s]);
      }
    }

    const exerciseSummaries: ExerciseSummaryItem[] = [];
    byExercise.forEach((sets, exerciseId) => {
      const exercise = exercises.find((e) => e.id === exerciseId);
      const exerciseName = exercise?.name ?? "Exercise";
      const setsCompleted = sets.length;
      const totalReps = sets.reduce((sum, s) => sum + s.reps, 0);
      const totalDurationSecs = sets.reduce((sum, s) => sum + (s.durationSecs ?? 0), 0);
      const totalCalories = sets.reduce((sum, s) => sum + (s.caloriesBurnt ?? 0), 0);
      exerciseSummaries.push({
        exerciseId,
        exerciseName,
        setsCompleted,
        totalReps,
        totalDurationSecs,
        totalCalories,
        sets,
      });
    });

    const totalDurationSecs = session.sets.reduce((sum, s) => sum + (s.durationSecs ?? 0), 0);
    const totalCalories = session.sets.reduce((sum, s) => sum + (s.caloriesBurnt ?? 0), 0);

    return {
      sessionId: session.id,
      workoutName,
      startedAt: session.startedAt,
      completedAt: session.completedAt ?? session.startedAt,
      totalDurationSecs,
      totalCalories,
      exercises: exerciseSummaries,
    };
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
    getSummaryForSession,
  };
}
