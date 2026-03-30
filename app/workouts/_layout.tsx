import { Stack } from "expo-router";

export default function WorkoutsLayout() {
  return (
    <Stack>
      <Stack.Screen name="index" options={{ title: "My Workouts" }} />
      <Stack.Screen name="new" options={{ title: "New Workout" }} />
      <Stack.Screen name="[id]" options={{ title: "Workout Detail" }} />
      <Stack.Screen name="[id]/add-exercise" options={{ title: "Add Exercise" }} />
    </Stack>
  );
}
