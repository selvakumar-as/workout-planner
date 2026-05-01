import type { SessionSet } from "./session";

export interface ExerciseSummaryItem {
  exerciseId:        string;
  exerciseName:      string;
  setsCompleted:     number;
  totalReps:         number;
  totalDurationSecs: number;
  totalCalories:     number;
  sets:              SessionSet[];
}

export interface SessionSummaryData {
  sessionId:         string;
  workoutName:       string;
  startedAt:         string;
  completedAt:       string;
  totalDurationSecs: number;
  totalCalories:     number;
  exercises:         ExerciseSummaryItem[];
}
