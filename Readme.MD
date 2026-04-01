
# WorkoutPlanner

A cross-platform fitness app built with **Expo** and **React Native**, enabling users to plan, track, and manage their workout routines seamlessly across iOS, Android, and Web.

## Features

- **Workout Planning**: Create and organize workouts by exercise groups (Upper Body, Core, Lower Body)
- **Session Tracking**: Monitor active workout sessions in real-time
- **Persistent Storage**: Fast, encrypted local storage via MMKV
- **Type-Safe**: TypeScript strict mode with Zod runtime validation
- **Cross-Platform**: Native performance on iOS, Android, and Web

## Tech Stack

- **Framework**: Expo ~54 / React Native 0.81
- **Routing**: Expo Router (file-based navigation)
- **State Management**: Zustand + TanStack Query
- **Persistence**: MMKV
- **Validation**: Zod
- **Testing**: Jest + React Native Testing Library
- **Architecture**: MVVM pattern with ViewModels

## Getting Started

```bash
npm install
npm start  # Choose platform: ios | android | web
```
