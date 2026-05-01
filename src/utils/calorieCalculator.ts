export function calculateCalories(metValue: number, weightKg: number, durationSecs: number): number {
  return Math.round(metValue * weightKg * (durationSecs / 3600) * 10) / 10;
}
