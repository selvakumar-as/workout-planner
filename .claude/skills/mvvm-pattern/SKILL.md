---
name: mvvm-pattern
description: MVVM pattern rules for WorkoutPlanner ViewModels
---

ViewModel rules:
- Pure TypeScript class, no React imports
- State managed via Zustand slice, exposed as getters
- Actions are methods on the class that call Zustand set()
- No async in ViewModels — async goes in services/, ViewModel calls service methods
- Every ViewModel has a corresponding useXxxViewModel() hook that provides the VM instance