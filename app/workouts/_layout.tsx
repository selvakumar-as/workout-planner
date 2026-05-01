import { Stack, router } from "expo-router";
import { Pressable, Text } from "react-native";

export default function WorkoutsLayout() {
  return (
    <Stack>
      <Stack.Screen
        name="index"
        options={{
          title: "My Workouts",
          headerLeft: () => (
            <Pressable
              onPress={() => router.back()}
              accessibilityLabel="Go back"
              style={{ flexDirection: "row", alignItems: "center" }}
            >
              <Text style={{ color: "#2563EB", fontSize: 22, lineHeight: 26 }}>‹</Text>
              <Text style={{ color: "#2563EB", fontSize: 16, marginLeft: 4 }}>Back</Text>
            </Pressable>
          ),
        }}
      />
      <Stack.Screen name="new" options={{ title: "New Workout" }} />
      <Stack.Screen name="[id]" options={{ title: "Workout Detail" }} />
      <Stack.Screen name="[id]/add-exercise" options={{ title: "Add Exercise" }} />
      <Stack.Screen name="[id]/timer-config" options={{ title: "Auto Timer Config" }} />
    </Stack>
  );
}
