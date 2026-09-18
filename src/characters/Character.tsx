import { useEffect, useLayoutEffect, useMemo, useRef, type MutableRefObject, type RefObject } from 'react'
import { useFrame } from '@react-three/fiber'
import { useGLTF } from '@react-three/drei'
import * as THREE from 'three'
import { clone as cloneSkinned } from 'three/examples/jsm/utils/SkeletonUtils.js'
import { useKeyboard } from '../controls/useKeyboard'
import { useAnimationMachine } from '../hooks/useAnimationMachine'
import { useCharacterMovement } from '../hooks/useCharacterMovement'
import {
  CLIPS,
  LOCK_MOVEMENT,
  MODEL_URL,
} from './clips'

type CharacterProps = {
  groupRef: RefObject<THREE.Group | null>
  oneShotRef: MutableRefObject<string | null>
  onStateChange: (state: string, clip: string) => void
  onClipsLoaded: (names: string[]) => void
}

function labelFor(clip: string, moving: boolean, running: boolean) {
  if (clip === CLIPS.jump) return 'Jump'
  if (clip === 'Punch_Combo_2') return 'Punch'
  if (clip === 'Hit_Reaction') return 'Hit'
  if (clip === 'Listening_Gesture') return 'Listen'
  if (clip === 'Dead') return 'Dead'
  if (clip === CLIPS.walk && !moving) return 'Idle'
  if (clip === CLIPS.run || running) return 'Run'
  if (clip === CLIPS.walk) return 'Walk'
  return clip
}

export function Character({
  groupRef,
  oneShotRef,
  onStateChange,
  onClipsLoaded,
}: CharacterProps) {
  const { scene, animations } = useGLTF(MODEL_URL)
  const clone = useMemo(() => cloneSkinned(scene), [scene])
  const mixer = useMemo(() => new THREE.AnimationMixer(clone), [clone])
  const actions = useMemo(() => {
    const map: Record<string, THREE.AnimationAction> = {}
    for (const clip of animations) {
      map[clip.name] = mixer.clipAction(clip, clone)
    }
    return map
  }, [animations, mixer, clone])

  const keys = useKeyboard()
  const { play, current } = useAnimationMachine()
  const { step } = useCharacterMovement()
  const jumpHeld = useRef(false)
  const hudState = useRef({ state: '', clip: '' })
  const oneShotActive = useRef<string | null>(null)

  useEffect(() => {
    clone.traverse((obj) => {
      const mesh = obj as THREE.SkinnedMesh
      if (mesh.isMesh) {
        mesh.castShadow = true
        mesh.receiveShadow = true
      }
      if (mesh.isSkinnedMesh) {
        mesh.frustumCulled = false
      }
    })
  }, [clone])

  useEffect(() => {
    onClipsLoaded(animations.map((clip) => clip.name))
  }, [animations, onClipsLoaded])

  useLayoutEffect(() => {
    play(actions, CLIPS.walk, { pauseAtStart: true, loop: false, fade: 0 })
    mixer.update(1 / 60)
    onStateChange('Idle', CLIPS.walk)
    return () => {
      mixer.stopAllAction()
    }
  }, [actions, mixer, play, onStateChange])

  useEffect(() => {
    const onFinished = (event: { action: THREE.AnimationAction }) => {
      const finished = event.action.getClip().name
      if (finished === 'Dead') return
      if (oneShotActive.current === finished) {
        oneShotActive.current = null
      }
    }
    mixer.addEventListener('finished', onFinished)
    return () => mixer.removeEventListener('finished', onFinished)
  }, [mixer])

  useFrame((state, delta) => {
    const group = groupRef.current
    if (!group) return
    const dt = Math.min(delta, 0.05)
    const input = keys.current

    const requested = oneShotRef.current
    if (requested && actions[requested]) {
      oneShotRef.current = null
      oneShotActive.current = requested
      const stayDown = requested === 'Dead'
      play(actions, requested, {
        loop: false,
        clamp: true,
        fade: stayDown ? 0.12 : 0.18,
      })
    }

    const jumpPressed = input.jump && !jumpHeld.current
    jumpHeld.current = input.jump
    const wantsMove = input.forward || input.back || input.left || input.right

    if (oneShotActive.current === 'Dead' && wantsMove) {
      oneShotActive.current = null
    }

    if (jumpPressed && oneShotActive.current === null) {
      oneShotActive.current = CLIPS.jump
      play(actions, CLIPS.jump, { loop: false, clamp: true, fade: 0.12 })
    }

    const inOneShot = oneShotActive.current !== null
    const locked = Boolean(oneShotActive.current && LOCK_MOVEMENT.has(oneShotActive.current))
    const { moving, running } = step(group, state.camera, input, dt, locked)

    if (!inOneShot) {
      if (moving && running) {
        play(actions, CLIPS.run, { loop: true })
      } else if (moving) {
        play(actions, CLIPS.walk, { loop: true })
      } else {
        play(actions, CLIPS.walk, { pauseAtStart: true, loop: false })
      }
    }

    const clip = current.current ?? CLIPS.walk
    const nextState = labelFor(clip, moving, running)
    if (hudState.current.state !== nextState || hudState.current.clip !== clip) {
      hudState.current = { state: nextState, clip }
      onStateChange(nextState, clip)
    }

    mixer.update(dt)
  })

  return (
    <group ref={groupRef}>
      <primitive object={clone} />
    </group>
  )
}

useGLTF.preload(MODEL_URL)
