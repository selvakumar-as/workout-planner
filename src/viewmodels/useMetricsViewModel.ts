import { useSessionStore } from "../stores/sessionStore";
import type { Session } from "../types";

export type MetricsFilter = "TODAY" | "LAST_5_DAYS" | "LAST_7_DAYS";

export interface DayMetric {
  date: string;
  minutes: number;
  calories: number;
  sessionCount: number;
}

function toDateKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function formatLabel(dateKey: string): string {
  const [y, m, d] = dateKey.split("-").map(Number);
  const date = new Date(y, (m ?? 1) - 1, d ?? 1);
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function getDayRange(filter: MetricsFilter): string[] {
  const today = new Date();
  const days = filter === "TODAY" ? 1 : filter === "LAST_5_DAYS" ? 5 : 7;
  const range: string[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    range.push(toDateKey(d));
  }
  return range;
}

export function useMetricsViewModel() {
  const sessionHistory = useSessionStore((s) => s.sessionHistory);

  const getDayMetrics = (filter: MetricsFilter): DayMetric[] => {
    const range = getDayRange(filter);
    const rangeSet = new Set(range);

    const completedInRange = sessionHistory.filter(
      (s: Session) => s.status === "COMPLETED" && rangeSet.has(toDateKey(new Date(s.startedAt)))
    );

    const byDay = new Map<string, { durationSecs: number; calories: number; sessionCount: number }>();
    for (const dateKey of range) {
      byDay.set(dateKey, { durationSecs: 0, calories: 0, sessionCount: 0 });
    }

    for (const session of completedInRange) {
      const key = toDateKey(new Date(session.startedAt));
      const entry = byDay.get(key);
      if (entry === undefined) continue;
      const sessionDuration = session.sets.reduce((sum, s) => sum + (s.durationSecs ?? 0), 0);
      const sessionCalories = session.sets.reduce((sum, s) => sum + (s.caloriesBurnt ?? 0), 0);
      entry.durationSecs += sessionDuration;
      entry.calories += sessionCalories;
      entry.sessionCount += 1;
    }

    return range.map((dateKey) => {
      const entry = byDay.get(dateKey) ?? { durationSecs: 0, calories: 0, sessionCount: 0 };
      return {
        date: formatLabel(dateKey),
        minutes: Math.round(entry.durationSecs / 60),
        calories: Math.round(entry.calories * 10) / 10,
        sessionCount: entry.sessionCount,
      };
    });
  };

  return {
    getDayMetrics,
  };
}
