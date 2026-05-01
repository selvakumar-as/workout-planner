// Auto-generated. Maps exercise.id -> bundled PNG icon asset.
// Drop `assets/exercise-icons/*.png` into your Expo project, then import:
//
//   import { getExerciseIcon } from '@/utils/exerciseIcons';
//   <Image source={getExerciseIcon(exercise.id)} style={{ width: 44, height: 44, borderRadius: 12 }} />
//
// Falls back to a generic icon based on equipment if id is unknown.

import type { Exercise, Equipment } from '../types';

export type IconKey =
  | 'abwheel'
  | 'barbell'
  | 'bench'
  | 'bodyweight'
  | 'cable'
  | 'calf'
  | 'crunch'
  | 'curl'
  | 'deadlift'
  | 'dumbbell'
  | 'hipthrust'
  | 'lateral'
  | 'legpress'
  | 'legraise'
  | 'lunge'
  | 'machine'
  | 'mountain'
  | 'overhead'
  | 'plank'
  | 'pullup'
  | 'pushup'
  | 'row'
  | 'sideplank'
  | 'squat'
  | 'tricep'
  | 'twist';

export const ICON_BY_EXERCISE_ID: Record<string, IconKey> = {
  "11111111-0000-0000-0000-000000000001": "bench",
  "11111111-0000-0000-0000-000000000002": "bench",
  "11111111-0000-0000-0000-000000000003": "bench",
  "11111111-0000-0000-0000-000000000004": "dumbbell",
  "11111111-0000-0000-0000-000000000005": "lateral",
  "11111111-0000-0000-0000-000000000006": "lateral",
  "11111111-0000-0000-0000-000000000007": "machine",
  "11111111-0000-0000-0000-000000000008": "machine",
  "11111111-0000-0000-0000-000000000009": "pushup",
  "11111111-0000-0000-0000-000000000010": "tricep",
  "11111111-0000-0000-0000-000000000011": "pullup",
  "11111111-0000-0000-0000-000000000012": "pullup",
  "11111111-0000-0000-0000-000000000013": "row",
  "11111111-0000-0000-0000-000000000014": "row",
  "11111111-0000-0000-0000-000000000015": "row",
  "11111111-0000-0000-0000-000000000016": "pullup",
  "11111111-0000-0000-0000-000000000017": "row",
  "11111111-0000-0000-0000-000000000018": "row",
  "11111111-0000-0000-0000-000000000019": "row",
  "11111111-0000-0000-0000-000000000020": "overhead",
  "11111111-0000-0000-0000-000000000021": "overhead",
  "11111111-0000-0000-0000-000000000022": "overhead",
  "11111111-0000-0000-0000-000000000023": "lateral",
  "11111111-0000-0000-0000-000000000024": "lateral",
  "11111111-0000-0000-0000-000000000025": "lateral",
  "11111111-0000-0000-0000-000000000026": "lateral",
  "11111111-0000-0000-0000-000000000027": "overhead",
  "11111111-0000-0000-0000-000000000028": "curl",
  "11111111-0000-0000-0000-000000000029": "curl",
  "11111111-0000-0000-0000-000000000030": "curl",
  "11111111-0000-0000-0000-000000000031": "curl",
  "11111111-0000-0000-0000-000000000032": "curl",
  "11111111-0000-0000-0000-000000000033": "tricep",
  "11111111-0000-0000-0000-000000000034": "bench",
  "11111111-0000-0000-0000-000000000035": "tricep",
  "11111111-0000-0000-0000-000000000036": "bench",
  "11111111-0000-0000-0000-000000000037": "tricep",
  "11111111-0000-0000-0000-000000000038": "tricep",
  "11111111-0000-0000-0000-000000000039": "plank",
  "11111111-0000-0000-0000-000000000040": "sideplank",
  "11111111-0000-0000-0000-000000000041": "crunch",
  "11111111-0000-0000-0000-000000000042": "twist",
  "11111111-0000-0000-0000-000000000043": "crunch",
  "11111111-0000-0000-0000-000000000044": "legraise",
  "11111111-0000-0000-0000-000000000045": "legraise",
  "11111111-0000-0000-0000-000000000046": "twist",
  "11111111-0000-0000-0000-000000000047": "mountain",
  "11111111-0000-0000-0000-000000000048": "abwheel",
  "11111111-0000-0000-0000-000000000049": "crunch",
  "11111111-0000-0000-0000-000000000050": "crunch",
  "11111111-0000-0000-0000-000000000051": "twist",
  "11111111-0000-0000-0000-000000000052": "crunch",
  "11111111-0000-0000-0000-000000000053": "crunch",
  "11111111-0000-0000-0000-000000000054": "squat",
  "11111111-0000-0000-0000-000000000055": "squat",
  "11111111-0000-0000-0000-000000000056": "squat",
  "11111111-0000-0000-0000-000000000057": "squat",
  "11111111-0000-0000-0000-000000000058": "deadlift",
  "11111111-0000-0000-0000-000000000059": "deadlift",
  "11111111-0000-0000-0000-000000000060": "deadlift",
  "11111111-0000-0000-0000-000000000061": "lunge",
  "11111111-0000-0000-0000-000000000062": "squat",
  "11111111-0000-0000-0000-000000000063": "lunge",
  "11111111-0000-0000-0000-000000000064": "hipthrust",
  "11111111-0000-0000-0000-000000000065": "hipthrust",
  "11111111-0000-0000-0000-000000000066": "legpress",
  "11111111-0000-0000-0000-000000000067": "squat",
  "11111111-0000-0000-0000-000000000068": "legpress",
  "11111111-0000-0000-0000-000000000069": "curl",
  "11111111-0000-0000-0000-000000000070": "calf",
  "11111111-0000-0000-0000-000000000071": "calf",
  "11111111-0000-0000-0000-000000000072": "hipthrust"
};

const ICON_SOURCES: Record<IconKey, number> = {
  abwheel: require('../../assets/exercise-icons/abwheel.png'),
  barbell: require('../../assets/exercise-icons/deadlift.png'),
  bench: require('../../assets/exercise-icons/bench.png'),
  bodyweight: require('../../assets/exercise-icons/pushup.png'),
  cable: require('../../assets/exercise-icons/row.png'),
  calf: require('../../assets/exercise-icons/calf.png'),
  crunch: require('../../assets/exercise-icons/crunch.png'),
  curl: require('../../assets/exercise-icons/curl.png'),
  deadlift: require('../../assets/exercise-icons/deadlift.png'),
  dumbbell: require('../../assets/exercise-icons/dumbbell.png'),
  hipthrust: require('../../assets/exercise-icons/hipthrust.png'),
  lateral: require('../../assets/exercise-icons/lateral.png'),
  legpress: require('../../assets/exercise-icons/legpress.png'),
  legraise: require('../../assets/exercise-icons/legraise.png'),
  lunge: require('../../assets/exercise-icons/lunge.png'),
  machine: require('../../assets/exercise-icons/machine.png'),
  mountain: require('../../assets/exercise-icons/mountain.png'),
  overhead: require('../../assets/exercise-icons/overhead.png'),
  plank: require('../../assets/exercise-icons/plank.png'),
  pullup: require('../../assets/exercise-icons/pullup.png'),
  pushup: require('../../assets/exercise-icons/pushup.png'),
  row: require('../../assets/exercise-icons/row.png'),
  sideplank: require('../../assets/exercise-icons/sideplank.png'),
  squat: require('../../assets/exercise-icons/squat.png'),
  tricep: require('../../assets/exercise-icons/tricep.png'),
  twist: require('../../assets/exercise-icons/twist.png'),
};

const EQUIPMENT_FALLBACK: Record<Equipment, IconKey> = {
  BARBELL: 'barbell',
  DUMBBELL: 'dumbbell',
  CABLE: 'cable',
  MACHINE: 'machine',
  BODYWEIGHT: 'bodyweight',
};

/** Resolve an icon `require()` source for any Exercise (by id, then by equipment). */
export function getExerciseIcon(exerciseOrId: Exercise | string): number {
  const id = typeof exerciseOrId === 'string' ? exerciseOrId : exerciseOrId.id;
  const key = ICON_BY_EXERCISE_ID[id];
  if (key) return ICON_SOURCES[key];
  if (typeof exerciseOrId === 'object' && exerciseOrId.equipment?.length) {
    const ek = EQUIPMENT_FALLBACK[exerciseOrId.equipment[0]];
    if (ek) return ICON_SOURCES[ek];
  }
  return ICON_SOURCES.bodyweight;
}

/** Lower-level lookup if you already know the icon key. */
export function getIconByKey(key: IconKey): number {
  return ICON_SOURCES[key];
}
