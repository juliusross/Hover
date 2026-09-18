/** Clip names as exported on the GLB (inspect `/models/character.glb`). */
export const MODEL_URL = '/models/character.glb'

export const CLIPS = {
  idleSource: 'Walking',
  walk: 'Walking',
  run: 'Running',
  jump: 'Regular_Jump',
  restpose: 'restpose',
} as const

export const HUD_ONESHOTS = [
  { clip: 'Punch_Combo_2', label: 'Punch' },
  { clip: 'Hit_Reaction', label: 'Hit' },
  { clip: 'Listening_Gesture', label: 'Listen' },
  { clip: 'Dead', label: 'Dead' },
] as const

export const LOCOMOTION = new Set<string>([CLIPS.walk, CLIPS.run, CLIPS.idleSource])

export const LOCK_MOVEMENT = new Set<string>([
  'Punch_Combo_2',
  'Hit_Reaction',
  'Listening_Gesture',
  'Dead',
])

export const WALK_SPEED = 1.85
export const RUN_SPEED = 5.1

/** Crossfade duration in seconds. */
export const FADE = 0.22
