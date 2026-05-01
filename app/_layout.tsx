import { Stack } from "expo-router";

export default function RootLayout() {
  return (
    <Stack>
      <Stack.Screen name="index" options={{ title: "WorkoutPlanner", headerShown: false }} />
      <Stack.Screen name="workouts" options={{ headerShown: false }} />
      <Stack.Screen name="select-workout" options={{ title: "Select Workout" }} />
      <Stack.Screen name="session" options={{ title: "Active Session", headerShown: false }} />
    </Stack>
  );
}
