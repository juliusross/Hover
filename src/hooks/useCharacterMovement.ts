import { useRef } from 'react'
import * as THREE from 'three'
import type { KeyState } from '../controls/useKeyboard'
import { RUN_SPEED, WALK_SPEED } from '../characters/clips'

function dampAngle(current: number, target: number, lambda: number, dt: number) {
  let diff = target - current
  while (diff > Math.PI) diff -= Math.PI * 2
  while (diff < -Math.PI) diff += Math.PI * 2
  return current + diff * (1 - Math.exp(-lambda * dt))
}

export function useCharacterMovement() {
  const fwd = useRef(new THREE.Vector3())
  const right = useRef(new THREE.Vector3())
  const dir = useRef(new THREE.Vector3())
  const up = useRef(new THREE.Vector3(0, 1, 0))

  function step(
    group: THREE.Group,
    camera: THREE.Camera,
    keys: KeyState,
    dt: number,
    locked: boolean,
  ) {
    let x = 0
    let z = 0
    if (keys.forward) z += 1
    if (keys.back) z -= 1
    if (keys.left) x -= 1
    if (keys.right) x += 1

    const moving = x !== 0 || z !== 0
    const running = moving && keys.run

    if (locked || !moving) {
      return { moving: false, running: false }
    }

    const forward = fwd.current
    const rightVec = right.current
    camera.getWorldDirection(forward)
    forward.y = 0
    if (forward.lengthSq() < 1e-8) {
      forward.set(0, 0, 1)
    } else {
      forward.normalize()
    }
    rightVec.crossVectors(forward, up.current).normalize()

    dir.current
      .copy(forward)
      .multiplyScalar(z)
      .addScaledVector(rightVec, x)
      .normalize()

    const speed = running ? RUN_SPEED : WALK_SPEED
    group.position.addScaledVector(dir.current, speed * dt)

    const targetYaw = Math.atan2(dir.current.x, dir.current.z)
    group.rotation.y = dampAngle(group.rotation.y, targetYaw, 14, dt)

    return { moving, running }
  }

  return { step }
}
