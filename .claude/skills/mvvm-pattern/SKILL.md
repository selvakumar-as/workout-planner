---
name: mvvm-pattern
description: MVVM architecture conventions for WorkoutPlanner. Use whenever creating, editing, or reviewing ViewModels, service classes, or View-ViewModel wiring in any .ts or .tsx file under src/viewmodels/, src/services/, src/components/, or app/ screens.
---

# Architecture Overview

WorkoutPlanner follows a three-layer MVVM pattern:
```
View (React Component) → ViewModel (Hook + Logic) → Service (IO + Persistence)
```

Each layer has strict boundaries. Code that crosses a boundary is always a bug.

# Layer 1: Views

**Location:** `src/components/` and `app/` screen files
**Responsibility:** Rendering and user interaction only

Rules:
- No imports from `src/stores/`, `src/services/`, or `src/lib/supabase.ts`
- No data transformation, filtering, sorting, or business logic
- No async operations
- Get all data and handlers from a ViewModel hook or from props
- Conditional rendering based on ViewModel state (`isLoading`, `error`, `isEmpty`) is fine
```tsx
// src/components/WorkoutList.tsx
import { useWorkoutListViewModel } from '@/viewmodels/useWorkoutListViewModel';

export function WorkoutList() {
  const { workouts, isLoading, error, refresh } = useWorkoutListViewModel();

  if (isLoading) return <LoadingSpinner />;
  if (error) return <ErrorBanner message={error} onRetry={refresh} />;
  if (workouts.length === 0) return <EmptyState message="No workouts yet" />;

  return (
    <FlatList
      data={workouts}
      renderItem={renderWorkout}
      keyExtractor={(item) => item.id}
      onRefresh={refresh}
      refreshing={isLoading}
    />
  );
}
```

# Layer 2: ViewModels

**Location:** `src/viewmodels/`
**Naming:** `useXxxViewModel.ts`
**Responsibility:** Orchestration — connects Views to Services and Stores

A ViewModel hook is the single entry point for a View's data and behavior. It may:
- Read from Zustand stores for shared state
- Hold local state via `useState` for UI-only concerns
- Derive computed values from store or local state
- Call Service methods for backend operations
- Manage loading and error states around async operations

A ViewModel hook must NOT:
- Import React Native components or return JSX
- Contain raw Supabase queries or direct HTTP calls
- Access AsyncStorage or other persistence directly
- Be used by more than one screen (extract shared logic into a service or shared hook)
```tsx
// src/viewmodels/useWorkoutListViewModel.ts
import { useState, useEffect, useCallback } from 'react';
import { useWorkoutStore } from '@/stores/workoutStore';
import { WorkoutService } from '@/services/workoutService';

export function useWorkoutListViewModel() {
  const workouts = useWorkoutStore((s) => s.workouts);
  const setWorkouts = useWorkoutStore((s) => s.setWorkouts);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await WorkoutService.getAll();
      setWorkouts(data);
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Failed to load workouts';
      setError(message);
      console.error('WorkoutList refresh failed:', e);
    } finally {
      setIsLoading(false);
    }
  }, [setWorkouts]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { workouts, isLoading, error, refresh };
}
```

## ViewModel Return Shape

Every ViewModel returns a flat object. Group fields by concern using comments, not nesting:
```typescript
return {
  // Data
  workouts,
  selectedWorkout,

  // UI State
  isLoading,
  error,
  isDeleteConfirmVisible,

  // Handlers
  refresh,
  deleteWorkout,
  toggleDeleteConfirm,
};
```

Never return nested objects like `{ state: { ... }, actions: { ... } }` — this complicates destructuring and testing.

# Layer 3: Services

**Location:** `src/services/`
**Naming:** `xxxService.ts`
**Responsibility:** All IO — Supabase queries, external APIs, AsyncStorage, file system

Services are plain TypeScript modules with static methods or exported functions. No React, no hooks, no state.
```typescript
// src/services/workoutService.ts
import { supabase } from '@/lib/supabase';
import { Workout, WorkoutInsert } from '@/types/workout';
import { workoutInsertSchema } from '@/schemas/workoutSchema';

export const WorkoutService = {
  async getAll(): Promise<Workout[]> {
    const { data, error } = await supabase
      .from('workouts')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) throw new Error(error.message);
    return data;
  },

  async create(input: WorkoutInsert): Promise<Workout> {
    const parsed = workoutInsertSchema.safeParse(input);
    if (!parsed.success) {
      throw new Error(parsed.error.issues[0].message);
    }
    const { data, error } = await supabase
      .from('workouts')
      .insert(parsed.data)
      .select()
      .single();
    if (error) throw new Error(error.message);
    return data;
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('workouts')
      .delete()
      .eq('id', id);
    if (error) throw new Error(error.message);
  },
};
```

## Service Rules

- Services throw errors — they never return `{ data, error }` tuples. ViewModels catch and handle them.
- Zod validation on inputs happens inside the Service, at the boundary before data reaches Supabase.
- Services are stateless — no class instances, no stored references. Use static methods or plain exported functions.
- One service per domain entity: `WorkoutService`, `ExerciseService`, `UserService`.

# State Placement Guide

Not all state belongs in Zustand. Use this decision tree:
```
Is this state used by multiple screens?
├── Yes → Zustand store in src/stores/
└── No
    ├── Is it server data that needs caching? → Zustand store
    └── Is it purely local UI state?
        ├── Yes → useState in the ViewModel
        └── Unsure → Start with useState, promote to Zustand only when reuse appears
```

Examples:
- **Zustand:** Current user, workout list, active workout session, exercise library
- **Local useState:** Form input values, modal open/closed, loading flags, error messages, scroll position

# Error Handling Flow

Errors flow upward through the layers:
```
Supabase error → Service throws Error → ViewModel catches, sets error state → View renders ErrorBanner
```

- Services: throw — never swallow
- ViewModels: catch, log with `console.error`, expose via `error: string | null`
- Views: render the error state — never try/catch
```tsx
// ViewModel error pattern
const deleteWorkout = useCallback(async (id: string) => {
  try {
    setError(null);
    await WorkoutService.delete(id);
    removeWorkout(id); // Zustand action
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Failed to delete workout';
    setError(message);
    console.error('Delete workout failed:', e);
  }
}, [removeWorkout]);
```

# Validation Flow

Validation sits at two points:

1. **User input validation** — ViewModel calls `.safeParse()` before passing data to a Service. Surface field-level errors to the View.
2. **Service boundary validation** — Service validates the final payload with `.safeParse()` before sending to Supabase. This catches programmer errors from within the codebase.

Both layers use Zod schemas from `src/schemas/`.

# File Structure Summary
```
src/
├── components/          # Views — rendering only
│   ├── WorkoutCard.tsx
│   └── __tests__/
├── viewmodels/          # ViewModel hooks — orchestration
│   ├── useWorkoutListViewModel.ts
│   └── __tests__/
├── services/            # IO and persistence
│   ├── workoutService.ts
│   └── __tests__/
├── stores/              # Zustand — shared state only
│   └── workoutStore.ts
├── schemas/             # Zod schemas
│   └── workoutSchema.ts
├── types/               # TypeScript interfaces
│   └── workout.ts
└── lib/
    └── supabase.ts      # Supabase client init
```

# Anti-Patterns

| Don't | Why | Do Instead |
|---|---|---|
| Supabase queries in a ViewModel | ViewModel becomes untestable without mocking Supabase | Delegate to a Service |
| Supabase or store imports in a View | View is coupled to data layer | Get everything from ViewModel hook |
| Business logic in a View component | Can't unit test without rendering | Move to ViewModel |
| Global Zustand for form input state | Pollutes shared state with ephemeral data | `useState` in ViewModel |
| Service returning `{ data, error }` | Callers forget to check error | Throw errors, let ViewModel catch |
| ViewModel returning nested objects | Complicates destructuring and mocking | Return flat object |
| Shared ViewModel used by 2+ screens | Becomes a god object | Extract shared logic to Service or hook |
| `any` to bypass a type issue | Hides real bugs | Define proper types or flag as a question |

# Testing Implications

This pattern makes each layer independently testable:
- **Services:** Test with mocked Supabase client. Verify queries, error throwing, and validation.
- **ViewModels:** Test with mocked Services. Verify state transitions, error handling, and return shape.
- **Views:** Test with mocked ViewModel hook. Verify rendering and interaction forwarding.

No layer requires the layer below it to be real in tests.