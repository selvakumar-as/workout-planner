---
name: rn-component
description: React Native component conventions for WorkoutPlanner
---

When creating a React Native component:
1. Use functional component with explicit FC<Props> typing
2. Props interface defined above the component, exported
3. StyleSheet.create() at bottom of file
4. Use Pressable not TouchableOpacity
5. Wrap in SafeAreaView only at screen level, not inside components
6. For lists: always FlatList with keyExtractor, never .map() in render