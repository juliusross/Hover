export const MODEL_URL = '/models/character.glb'

export const CLIP = {
  walk: 'Walking',
  run: 'Running',
  jump: 'Regular_Jump',
  punch: 'Punch_Combo_2',
  hit: 'Hit_Reaction',
  dead: 'Dead',
} as const

export const LOCK_MOVEMENT = new Set<string>([CLIP.punch, CLIP.hit, CLIP.dead])

export const WALK_SPEED = 1.85
export const RUN_SPEED = 5.1
export const FADE = 0.22

export const ARENA_HALF = 12
export const ARENA_WALL = 0.45

export const PLAYER_MAX_HP = 5
export const PLAYER_RADIUS = 0.42

export const ENEMY_COUNT = 4
export const ENEMY_MAX_HP = 2
export const ENEMY_SPEED = 1.2
export const ENEMY_RADIUS = 0.38

export const CONTACT_RANGE = 1.2
export const CONTACT_COOLDOWN = 1.2
export const CONTACT_DAMAGE = 1

/** First strike of Mixamo Punch_Combo_2 (~5.08s clip). One hit per punch. */
export const PUNCH_WINDOW_START = 0.28
export const PUNCH_WINDOW_END = 0.78
/** Unlock locomotion after the first strike so the 5s combo does not freeze the player. */
export const PUNCH_RECOVER = 0.95
export const PUNCH_RANGE = 2.35
export const PUNCH_CONE_DOT = Math.cos((58 * Math.PI) / 180)
export const PUNCH_DAMAGE = 1
export const PUNCH_KNOCKBACK = 1.15
