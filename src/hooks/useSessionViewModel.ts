import { useRef } from "react";
import { useStore } from "zustand";
import { sessionStoreApi } from "../store/sessionStore";
import { SessionViewModel } from "../viewmodels/SessionViewModel";

// ---------------------------------------------------------------------------
// useSessionViewModel
//
// Returns a stable SessionViewModel instance. Subscribes to the entire
// session store so the consuming component re-renders on any state change.
// The ViewModel itself is a class whose getters always read fresh state via
// getState(), so returning the same instance is safe.
// ---------------------------------------------------------------------------

export function useSessionViewModel(): SessionViewModel {
  // Subscribe to the whole store — any change triggers a re-render.
  useStore(sessionStoreApi);

  // Keep a single stable ViewModel instance across renders.
  const vmRef = useRef<SessionViewModel | null>(null);
  if (vmRef.current === null) {
    vmRef.current = new SessionViewModel();
  }

  return vmRef.current;
}
