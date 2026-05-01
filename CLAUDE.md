# CLAUDE.md

# WorkoutPlanner — Claude Code context

## Project
React Native + Expo app. TypeScript strict mode. MVVM pattern using Zustand.
Expo Router for navigation. Uses https://docs.maestro.dev/get-started/supported-platform/react-native for integration testing

## Conventions
- ViewModels live in src/viewmodels/ and are plain TypeScript classes
- Screens in src/screens/ consume ViewModels via hooks only — no direct store access
- All interfaces in src/types/ — no inline type definitions in components
- No `any`. If you don't know the type, use `unknown` and narrow it
- Exercise groups: UPPER_BODY | CORE | LOWER_BODY (enum in src/types/workout.ts)

## MCP servers active
- github: PR creation, issue management
- filesystem: read/write to src/ only

## Agents
- architect: plan mode, data model and folder structure decisions
- component-builder: builds screens and components
- test-writer: writes Jest + RNTL tests
- reviewer: read-only code review before commits

## Commands

```bash
# Start dev server (prompts for platform)
npm start

# Platform-specific dev
npm run ios
npm run android
npm run web

# Run tests
npx jest

# Run a single test file
npx jest path/to/test.tsx

# TypeScript type checking
npx tsc --noEmit
```

## Architecture

**WorkoutPlanner** is a cross-platform (iOS, Android, Web) fitness app built with Expo + React Native.

### Tech Stack

| Concern | Library |
|---|---|
| Framework | Expo ~54 / React Native 0.81 |
| Routing | expo-router (file-based, like Next.js App Router) |
| Client state | Zustand |
| Local storage | react-native-mmkv-storage |
| Testing | Jest + React Native Testing Library |
| integration or scenario testing via maestro |https://maestro.dev/ | https://docs.maestro.dev/get-started/supported-platform/react-native
### Routing

The app uses **expo-router** with a file-based `app/` directory. Routes map directly to file paths (e.g., `app/index.tsx` → `/`, `app/workouts/[id].tsx` → `/workouts/:id`). Layouts are defined in `_layout.tsx` files. The root entry is `index.ts` → `App.tsx`, but as the app grows, routing will live entirely in `app/`.

### State Management Pattern

- **Zustand** for local/UI state (e.g., active workout session, UI toggles)
- **TanStack Query** for remote data fetching, caching, and synchronization
- **react-native-mmkv-storage** for persistent local storage (fast, synchronous, encrypted)

### React Native New Architecture

`newArchEnabled: true` is set in `app.json`. This enables the Fabric renderer and TurboModules. Avoid libraries that are not compatible with the New Architecture.
