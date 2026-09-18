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
    if (!next) return

    const {
      loop = true,
      fade = FADE,
      clamp = false,
      timeScale = 1,
      pauseAtStart = false,
    } = opts

    const sameClip = current.current === name
    if (sameClip) {
      if (pauseAtStart) {
        if (!next.paused) {
          next.paused = true
          next.time = 0
          next.timeScale = 0
        }
      } else if (next.paused || next.timeScale === 0) {
        next.paused = false
        next.time = 0
        next.timeScale = timeScale
        next.setLoop(THREE.LoopRepeat, Infinity)
      }
      return
    }

    next.enabled = true
    next.reset()
    next.timeScale = pauseAtStart ? 0 : timeScale
    next.paused = pauseAtStart
    next.time = 0
    next.clampWhenFinished = clamp
    next.setLoop(loop && !pauseAtStart ? THREE.LoopRepeat : THREE.LoopOnce, loop && !pauseAtStart ? Infinity : 1)
    next.fadeIn(fade)
    next.play()

    const prevName = current.current
    const prev = prevName ? actions[prevName] : null
    if (prev && prev !== next) {
      prev.fadeOut(fade)
    }

    current.current = name
  }, [])

  return { current, play }
}
