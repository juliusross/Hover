import * as THREE from 'three'
import { ENEMY_COUNT, ENEMY_MAX_HP, ENEMY_RADIUS, ENEMY_SPEED } from './constants'
import { clampToArena } from './arena'

const COLORS = [0xc45c4a, 0xd4a04a, 0x4a7ec4, 0x6a4aa8, 0x3a9a6a]

export type Enemy = {
  group: THREE.Group
  body: THREE.Mesh
  hp: number
  alive: boolean
  flash: number
}

export function spawnWave(scene: THREE.Scene, count = ENEMY_COUNT): Enemy[] {
  const enemies: Enemy[] = []
  const radius = 7.2
  for (let i = 0; i < count; i++) {
    const angle = (i / count) * Math.PI * 2 + 0.35
    const x = Math.sin(angle) * radius
    const z = Math.cos(angle) * radius
    enemies.push(createEnemy(scene, COLORS[i % COLORS.length], x, z))
  }
  return enemies
}

export function clearWave(scene: THREE.Scene, enemies: Enemy[]) {
  for (const enemy of enemies) {
    scene.remove(enemy.group)
    enemy.body.geometry.dispose()
    const mat = enemy.body.material
    if (Array.isArray(mat)) mat.forEach((m) => m.dispose())
    else mat.dispose()
  }
  enemies.length = 0
}

function createEnemy(scene: THREE.Scene, color: number, x: number, z: number): Enemy {
  const group = new THREE.Group()
  group.position.set(x, 0, z)

  const material = new THREE.MeshStandardMaterial({
    color,
    roughness: 0.55,
    metalness: 0.08,
    emissive: 0x000000,
  })
  const body = new THREE.Mesh(new THREE.CapsuleGeometry(ENEMY_RADIUS, 0.95, 4, 10), material)
  body.position.y = ENEMY_RADIUS + 0.475
  body.castShadow = true
  body.receiveShadow = true
  group.add(body)

  scene.add(group)
  return { group, body, hp: ENEMY_MAX_HP, alive: true, flash: 0 }
}

export function aliveCount(enemies: Enemy[]) {
  return enemies.reduce((n, e) => n + (e.alive ? 1 : 0), 0)
}

const toward = new THREE.Vector3()

export function updateEnemies(enemies: Enemy[], playerPos: THREE.Vector3, dt: number, chasing: boolean) {
  for (const enemy of enemies) {
    if (enemy.flash > 0) {
      enemy.flash = Math.max(0, enemy.flash - dt)
      const mat = enemy.body.material as THREE.MeshStandardMaterial
      mat.emissive.setHex(enemy.flash > 0 ? 0x551111 : 0x000000)
    }
    if (!enemy.alive || !chasing) continue

    toward.set(playerPos.x - enemy.group.position.x, 0, playerPos.z - enemy.group.position.z)
    const dist = toward.length()
    if (dist > 0.001) {
      enemy.group.rotation.y = Math.atan2(toward.x, toward.z)
      if (dist > ENEMY_RADIUS + 0.85) {
        toward.multiplyScalar(ENEMY_SPEED / dist)
        enemy.group.position.addScaledVector(toward, dt)
        clampToArena(enemy.group.position, ENEMY_RADIUS)
      }
    }
  }
}

export function hurtEnemy(enemy: Enemy, amount: number, knockDir: THREE.Vector3, knock: number) {
  if (!enemy.alive) return false
  enemy.hp -= amount
  enemy.flash = 0.18
  enemy.group.position.addScaledVector(knockDir, knock)
  clampToArena(enemy.group.position, ENEMY_RADIUS)
  if (enemy.hp <= 0) {
    enemy.alive = false
    enemy.hp = 0
    enemy.group.rotation.x = Math.PI / 2
    enemy.group.position.y = 0.2
    const mat = enemy.body.material as THREE.MeshStandardMaterial
    mat.color.multiplyScalar(0.35)
    mat.emissive.setHex(0x000000)
    return true
  }
  return false
}
