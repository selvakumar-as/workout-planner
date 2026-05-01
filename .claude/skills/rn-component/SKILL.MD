---
name: rn-component
description: React Native component and ViewModel conventions for WorkoutPlanner. Use whenever creating, editing, or reviewing .tsx or .ts files under src/components/, src/viewmodels/, or app/ screens.
---

# Project Stack

- React Native + Expo (file-based routing via Expo Router in `app/`)
- TypeScript (strict mode, no `any`)
- Zustand for state management (`src/stores/`)
- Supabase for backend (`src/lib/supabase.ts`)
- Zod for validation (`src/schemas/`)
- MVVM: Views in `src/components/`, ViewModels in `src/viewmodels/`

# Component Conventions

## Structure & Typing

- Use named function declarations with typed props — not `React.FC`:
```tsx
// Correct
interface WorkoutCardProps {
  workoutId: string;
  onPress: (id: string) => void;
}

export function WorkoutCard({ workoutId, onPress }: WorkoutCardProps) {
  // ...
}

// Avoid
const WorkoutCard: React.FC<WorkoutCardProps> = (props) => { ... }
```

- Export the Props interface — ViewModels and tests depend on it
- Destructure props at the function signature, never access `props.x` in the body
- Keep components under 150 lines. If exceeded, split and explain the decomposition

## File Layout Order

Follow this order within every component file:

1. Imports
2. Props interface (exported)
3. Component function (exported)
4. Styles via `StyleSheet.create()`

No other exports below the styles. Helper functions go above the component or into a utils file.

## Styling

- Always `StyleSheet.create()` at the bottom of the file — never inline style objects
- Use descriptive style names: `styles.headerContainer` not `styles.box1`
- For conditional styles, spread into an array: `style={[styles.base, isActive && styles.active]}`

## Interactive Elements

- Use `Pressable` — never `TouchableOpacity`, `TouchableHighlight`, or `TouchableWithoutFeedback`
- Every `Pressable` must have an `accessibilityLabel` and an `accessibilityRole`
- Images must have an `accessibilityLabel` describing their content

## Lists

- Always use `FlatList` with an explicit `keyExtractor` — never `.map()` in render
- Provide `getItemLayout` when row height is fixed for scroll performance
- Extract `renderItem` into a named function or component — never inline it as an anonymous arrow
```tsx
// Correct
const renderWorkout = ({ item }: { item: Workout }) => (
  <WorkoutCard workoutId={item.id} onPress={handlePress} />
);

<FlatList
  data={workouts}
  renderItem={renderWorkout}
  keyExtractor={(item) => item.id}
/>

// Avoid
<FlatList
  data={workouts}
  renderItem={({ item }) => <WorkoutCard ... />}
/>
```

## Layout

- `SafeAreaView` only at the screen level (`app/` routes) — never inside reusable components
- Screens wrap content in `SafeAreaView` → `View` (content container)
- Components assume they'll be placed inside a safe area — they never add their own

# MVVM Wiring

## Views (Components & Screens)

- Zero business logic — no API calls, no store access, no data transforms
- Get everything from a ViewModel hook or from props
- Conditional rendering based on ViewModel state is fine (`isLoading`, `error`, `isEmpty`)

## ViewModels (Custom Hooks)

- Named `useXViewModel` and placed in `src/viewmodels/`
- Return a flat object of state and handlers — no nested objects
```tsx
// ViewModel
export function useWorkoutListViewModel() {
  const workouts = useWorkoutStore((s) => s.workouts);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const { data, error: apiError } = await supabase
        .from('workouts')
        .select('*');
      if (apiError) throw apiError;
      useWorkoutStore.getState().setWorkouts(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load workouts');
      console.error('WorkoutList refresh failed:', e);
    } finally {
      setIsLoading(false);
    }
  };

  return { workouts, isLoading, error, refresh };
}

// View wiring
export function WorkoutListScreen() {
  const { workouts, isLoading, error, refresh } = useWorkoutListViewModel();
  // render using only the above — nothing else
}
```

## Connection Rule

Every screen in `app/` that has any interactivity **must** have a corresponding ViewModel. Static display-only screens are exempt.

# Validation

- All user inputs (sets, reps, weight, duration, text fields) must validate through Zod via `.safeParse()`
- Validation lives in the ViewModel, not the View
- Surface field-level errors from Zod to the View via the ViewModel return object

# Error Handling

- Wrap all Supabase calls in try/catch inside ViewModels
- Expose errors as `error: string | null` from the ViewModel
- Never silently swallow errors — at minimum `console.error` and surface to the View
- Display errors in the View using a consistent `ErrorBanner` component

# Anti-Patterns to Reject

| Don't | Do Instead |
|---|---|
| `React.FC<Props>` | Named function with typed props |
| `TouchableOpacity` | `Pressable` |
| Inline styles | `StyleSheet.create()` |
| `.map()` in render for lists | `FlatList` with `keyExtractor` |
| `props.x` in function body | Destructure in signature |
| Store/Supabase imports in Views | ViewModel hook |
| `.parse()` on user input | `.safeParse()` with error handling |
| `any` anywhere | Proper types or flagged question |
| Empty catch blocks | `console.error` + error state |
| Inline `renderItem` arrow | Named function or component |