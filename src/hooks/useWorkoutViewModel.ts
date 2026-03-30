import { useRef } from "react";
import { useStore } from "zustand";
import { workoutStoreApi } from "../store/workoutStore";
import { WorkoutViewModel } from "../viewmodels/WorkoutViewModel";

// ---------------------------------------------------------------------------
// useWorkoutViewModel
//
// Returns a stable WorkoutViewModel instance. Subscribes to the entire
// workout store so the consuming component re-renders on any state change.
// The ViewModel itself is a class whose getters always read fresh state via
// getState(), so returning the same instance is safe.
// ---------------------------------------------------------------------------

export function useWorkoutViewModel(): WorkoutViewModel {
  // Subscribe to the whole store — any change triggers a re-render.
  useStore(workoutStoreApi);

  // Keep a single stable ViewModel instance across renders.
  const vmRef = useRef<WorkoutViewModel | null>(null);
  if (vmRef.current === null) {
    vmRef.current = new WorkoutViewModel();
  }

  return vmRef.current;
}
