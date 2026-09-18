import { useCallback, useRef } from 'react'
import * as THREE from 'three'
import { FADE } from '../characters/clips'

type Actions = Record<string, THREE.AnimationAction | null>

type PlayOpts = {
  loop?: boolean
  fade?: number
  clamp?: boolean
  timeScale?: number
  /** Hold a clip at t=0 (used for Idle — restpose is too short to loop). */
  pauseAtStart?: boolean
}

/**
 * Mixer helper: crossfade only when the clip actually changes.
 * Never restarts the current clip every frame.
 */
export function useAnimationMachine() {
  const current = useRef<string | null>(null)

  const play = useCallback((actions: Actions, name: string, opts: PlayOpts = {}) => {
    const next = actions[name]
    if (!next) return false

    const {
      loop = true,
      fade = FADE,
      clamp = false,
      timeScale = 1,
      pauseAtStart = false,
    } = opts

    const sameClip = current.current === name
    if (sameClip && next.isScheduled()) {
      if (pauseAtStart) {
        if (next.timeScale !== 0) {
          next.time = 0
          next.timeScale = 0
          next.paused = false
        }
      } else if (next.timeScale === 0 || next.paused) {
        next.paused = false
        next.time = 0
        next.timeScale = timeScale
        next.setLoop(THREE.LoopRepeat, Infinity)
      }
      return true
    }

    next.enabled = true
    next.reset()
    next.paused = false
    next.time = 0
    next.timeScale = pauseAtStart ? 0 : timeScale
    next.clampWhenFinished = clamp
    next.setLoop(loop && !pauseAtStart ? THREE.LoopRepeat : THREE.LoopOnce, loop && !pauseAtStart ? Infinity : 1)

    const prevName = current.current
    const prev = prevName ? actions[prevName] : null
    if (prev && prev !== next) {
      next.fadeIn(fade)
      prev.fadeOut(fade)
    } else {
      next.weight = 1
      next.setEffectiveWeight(1)
    }
    next.play()

    current.current = name
    return true
  }, [])

  return { current, play }
}
