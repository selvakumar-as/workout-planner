# Sound Assets

Place the following WAV files in this directory for workout beep sounds:

- `beep_set_start.wav` — short ~120ms beep, played when a set timer begins
- `beep_set_end.wav` — short ~120ms beep (different tone), played when a set timer ends
- `beep_exercise_start.wav` — longer ~400ms beep, played when a new exercise begins
- `beep_exercise_end.wav` — longer ~400ms beep (different tone), played when an exercise is fully complete

## Suggested Frequencies

| File | Frequency | Duration |
|---|---|---|
| beep_set_start.wav | 880 Hz (A5) | 120ms |
| beep_set_end.wav | 660 Hz (E5) | 120ms |
| beep_exercise_start.wav | 1046 Hz (C6) | 400ms |
| beep_exercise_end.wav | 523 Hz (C5) | 400ms |

## Generation

You can generate these with ffmpeg:

```bash
ffmpeg -f lavfi -i "sine=frequency=880:duration=0.12" assets/sounds/beep_set_start.wav
ffmpeg -f lavfi -i "sine=frequency=660:duration=0.12" assets/sounds/beep_set_end.wav
ffmpeg -f lavfi -i "sine=frequency=1046:duration=0.4" assets/sounds/beep_exercise_start.wav
ffmpeg -f lavfi -i "sine=frequency=523:duration=0.4" assets/sounds/beep_exercise_end.wav
```

The app uses try/catch around all audio loading, so missing files will not cause crashes.
