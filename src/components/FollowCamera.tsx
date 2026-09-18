import { useRef, type RefObject } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

const OFFSET = new THREE.Vector3(0, 2.15, -4.35)
const LOOK = new THREE.Vector3(0, 1.15, 0)
const Y_AXIS = new THREE.Vector3(0, 1, 0)

type FollowCameraProps = {
  target: RefObject<THREE.Group | null>
}

/** Smoothed third-person camera that stays behind the character facing. */
export function FollowCamera({ target }: FollowCameraProps) {
  const desired = useRef(new THREE.Vector3())
  const lookAt = useRef(new THREE.Vector3())
  const offset = useRef(new THREE.Vector3())

  useFrame((state, delta) => {
    const group = target.current
    if (!group) return

    offset.current.copy(OFFSET)
    offset.current.applyAxisAngle(Y_AXIS, group.rotation.y)
    desired.current.copy(group.position).add(offset.current)

    const alpha = 1 - Math.exp(-5.5 * delta)
    state.camera.position.lerp(desired.current, alpha)

    lookAt.current.copy(group.position).add(LOOK)
    state.camera.lookAt(lookAt.current)
  })

  return null
}
