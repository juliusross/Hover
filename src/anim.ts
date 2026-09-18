import * as THREE from 'three'
import { CLIP, FADE } from './constants'

type PlayOpts = {
  loop?: boolean
  fade?: number
  clamp?: boolean
  pauseAtStart?: boolean
}

export type Anim = {
  mixer: THREE.AnimationMixer
  actions: Record<string, THREE.AnimationAction>
  current: string | null
  oneShot: string | null
}

export function createAnim(root: THREE.Object3D, clips: THREE.AnimationClip[]): Anim {
  const mixer = new THREE.AnimationMixer(root)
  const actions: Record<string, THREE.AnimationAction> = {}
  for (const clip of clips) {
    actions[clip.name] = mixer.clipAction(clip, root)
  }
  return { mixer, actions, current: null, oneShot: null }
}

export function play(anim: Anim, name: string, opts: PlayOpts = {}) {
  const next = anim.actions[name]
  if (!next) return
  const { loop = true, fade = FADE, clamp = false, pauseAtStart = false } = opts

  if (anim.current === name && next.isScheduled()) {
    if (pauseAtStart) {
      if (next.timeScale !== 0) {
        next.time = 0
        next.timeScale = 0
        next.paused = false
      }
    } else if (next.timeScale === 0 || next.paused) {
      next.paused = false
      next.time = 0
      next.timeScale = 1
      next.setLoop(THREE.LoopRepeat, Infinity)
    }
    return
  }

  next.enabled = true
  next.reset()
  next.paused = false
  next.time = 0
  next.timeScale = pauseAtStart ? 0 : 1
  next.clampWhenFinished = clamp
  next.setLoop(loop && !pauseAtStart ? THREE.LoopRepeat : THREE.LoopOnce, loop && !pauseAtStart ? Infinity : 1)

  const prev = anim.current ? anim.actions[anim.current] : null
  if (prev && prev !== next) {
    next.fadeIn(fade)
    prev.fadeOut(fade)
  } else {
    next.weight = 1
    next.setEffectiveWeight(1)
  }
  next.play()
  anim.current = name
}

export function playOneShot(anim: Anim, name: string, fade = 0.16) {
  anim.oneShot = name
  play(anim, name, { loop: false, clamp: true, fade })
}

export function clipTime(anim: Anim, name: string) {
  return anim.actions[name]?.time ?? 0
}

export function labelFor(clip: string, moving: boolean, running: boolean) {
  if (clip === CLIP.jump) return 'Jump'
  if (clip === CLIP.punch) return 'Punch'
  if (clip === CLIP.hit) return 'Hit'
  if (clip === CLIP.dead) return 'Dead'
  if (clip === CLIP.walk && !moving) return 'Idle'
  if (clip === CLIP.run || running) return 'Run'
  if (clip === CLIP.walk) return 'Walk'
  return clip
}
