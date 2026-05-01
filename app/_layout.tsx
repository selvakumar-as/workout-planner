import { Stack } from "expo-router";
import { SafeAreaProvider } from "react-native-safe-area-context";

export default function RootLayout() {
  return (
    <SafeAreaProvider>
    <Stack>
      <Stack.Screen name="index" options={{ title: "WorkoutPlanner", headerShown: false }} />
      <Stack.Screen name="workouts" options={{ headerShown: false }} />
      <Stack.Screen name="select-workout" options={{ title: "Select Workout" }} />
      <Stack.Screen name="session" options={{ title: "Active Session", headerShown: false }} />
      <Stack.Screen name="profile" options={{ title: "My Profile" }} />
      <Stack.Screen name="session-summary" options={{ title: "Session Summary" }} />
      <Stack.Screen name="metrics" options={{ title: "Metrics" }} />
    </Stack>
    </SafeAreaProvider>
  );
}
