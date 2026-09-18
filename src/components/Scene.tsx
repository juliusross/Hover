import type { RefObject, MutableRefObject } from 'react'
import type { Group } from 'three'
import { Character } from '../characters/Character'
import { FollowCamera } from './FollowCamera'
import { Ground } from './Ground'
import { Lights } from './Lights'

type SceneProps = {
  characterRef: RefObject<Group | null>
  oneShotRef: MutableRefObject<string | null>
  onStateChange: (state: string, clip: string) => void
  onClipsLoaded: (names: string[]) => void
}

export function Scene({
  characterRef,
  oneShotRef,
  onStateChange,
  onClipsLoaded,
}: SceneProps) {
  return (
    <>
      <color attach="background" args={['#8aa0b0']} />
      <fog attach="fog" args={['#8aa0b0', 14, 42]} />
      <Lights />
      <Ground />
      <Character
        groupRef={characterRef}
        oneShotRef={oneShotRef}
        onStateChange={onStateChange}
        onClipsLoaded={onClipsLoaded}
      />
      <FollowCamera target={characterRef} />
    </>
  )
}
