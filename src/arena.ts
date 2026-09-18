import * as THREE from 'three'
import { ARENA_HALF, ARENA_WALL } from './constants'

export function buildArena(scene: THREE.Scene) {
  const floor = new THREE.Mesh(
    new THREE.PlaneGeometry(ARENA_HALF * 2 + 2, ARENA_HALF * 2 + 2),
    new THREE.MeshStandardMaterial({ color: '#3f4c3c', roughness: 0.95, metalness: 0.02 }),
  )
  floor.rotation.x = -Math.PI / 2
  floor.receiveShadow = true
  scene.add(floor)

  const grid = new THREE.GridHelper(ARENA_HALF * 2, ARENA_HALF * 2, 0x8fa392, 0x6d7f70)
  grid.position.y = 0.01
  scene.add(grid)

  const wallMat = new THREE.MeshStandardMaterial({ color: '#2c352c', roughness: 0.9 })
  const thick = ARENA_WALL
  const height = 0.7
  const span = ARENA_HALF * 2 + thick
  const walls: Array<[number, number, number, number]> = [
    [span, thick, 0, ARENA_HALF + thick / 2],
    [span, thick, 0, -(ARENA_HALF + thick / 2)],
    [thick, span, ARENA_HALF + thick / 2, 0],
    [thick, span, -(ARENA_HALF + thick / 2), 0],
  ]
  for (const [sx, sz, x, z] of walls) {
    const wall = new THREE.Mesh(new THREE.BoxGeometry(sx, height, sz), wallMat)
    wall.position.set(x, height / 2, z)
    wall.castShadow = true
    wall.receiveShadow = true
    scene.add(wall)
  }
}

export function clampToArena(position: THREE.Vector3, radius: number) {
  const limit = ARENA_HALF - radius
  position.x = Math.max(-limit, Math.min(limit, position.x))
  position.z = Math.max(-limit, Math.min(limit, position.z))
}
