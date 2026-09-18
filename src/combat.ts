import * as THREE from 'three'
import {
  CONTACT_COOLDOWN,
  CONTACT_DAMAGE,
  CONTACT_RANGE,
  PUNCH_CONE_DOT,
  PUNCH_DAMAGE,
  PUNCH_KNOCKBACK,
  PUNCH_RANGE,
  PLAYER_RADIUS,
} from './constants'
import { hurtEnemy, type Enemy } from './enemy'

const toEnemy = new THREE.Vector3()
const forward = new THREE.Vector3()
const knock = new THREE.Vector3()

export function nearestInPunchCone(player: THREE.Object3D, enemies: Enemy[]): Enemy | null {
  forward.set(Math.sin(player.rotation.y), 0, Math.cos(player.rotation.y))
  let best: Enemy | null = null
  let bestDist = PUNCH_RANGE
  for (const enemy of enemies) {
    if (!enemy.alive) continue
    toEnemy.set(
      enemy.group.position.x - player.position.x,
      0,
      enemy.group.position.z - player.position.z,
    )
    const dist = toEnemy.length()
    if (dist > PUNCH_RANGE || dist < 0.001) continue
    toEnemy.multiplyScalar(1 / dist)
    if (toEnemy.dot(forward) < PUNCH_CONE_DOT) continue
    if (dist < bestDist) {
      bestDist = dist
      best = enemy
    }
  }
  return best
}

export function nearestEnemy(player: THREE.Object3D, enemies: Enemy[]): Enemy | null {
  let best: Enemy | null = null
  let bestDist = Infinity
  for (const enemy of enemies) {
    if (!enemy.alive) continue
    const dx = enemy.group.position.x - player.position.x
    const dz = enemy.group.position.z - player.position.z
    const dist = Math.hypot(dx, dz)
    if (dist < bestDist) {
      bestDist = dist
      best = enemy
    }
  }
  return best
}

export function faceEnemy(player: THREE.Object3D, enemy: Enemy) {
  const dx = enemy.group.position.x - player.position.x
  const dz = enemy.group.position.z - player.position.z
  if (dx * dx + dz * dz < 1e-6) return
  player.rotation.y = Math.atan2(dx, dz)
}

export function resolvePunchHit(player: THREE.Object3D, enemies: Enemy[]) {
  const target = nearestInPunchCone(player, enemies)
  if (!target) return false
  forward.set(Math.sin(player.rotation.y), 0, Math.cos(player.rotation.y))
  knock.copy(forward)
  hurtEnemy(target, PUNCH_DAMAGE, knock, PUNCH_KNOCKBACK)
  return true
}

let contactTimer = 0

export function resetContactTimer() {
  contactTimer = 0
}

export function resolveContact(
  player: THREE.Object3D,
  enemies: Enemy[],
  dt: number,
  canHurtPlayer: boolean,
): number {
  contactTimer = Math.max(0, contactTimer - dt)
  if (!canHurtPlayer || contactTimer > 0) return 0

  for (const enemy of enemies) {
    if (!enemy.alive) continue
    const dx = enemy.group.position.x - player.position.x
    const dz = enemy.group.position.z - player.position.z
    const dist = Math.hypot(dx, dz)
    if (dist <= CONTACT_RANGE + PLAYER_RADIUS) {
      contactTimer = CONTACT_COOLDOWN
      return CONTACT_DAMAGE
    }
  }
  return 0
}
