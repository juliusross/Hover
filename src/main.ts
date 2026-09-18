import './style.css'
import * as THREE from 'three'
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'
import { createAnim, clipTime, labelFor, play, playOneShot } from './anim'
import { buildArena, clampToArena } from './arena'
import {
  faceEnemy,
  nearestEnemy,
  resetContactTimer,
  resolveContact,
  resolvePunchHit,
} from './combat'
import {
  CLIP,
  ENEMY_COUNT,
  LOCK_MOVEMENT,
  MODEL_URL,
  PLAYER_MAX_HP,
  PLAYER_RADIUS,
  PUNCH_WINDOW_END,
  PUNCH_WINDOW_START,
  PUNCH_RECOVER,
  RUN_SPEED,
  WALK_SPEED,
} from './constants'
import { aliveCount, clearWave, spawnWave, updateEnemies, type Enemy } from './enemy'
import {
  bindInput,
  consumeJump,
  consumePunch,
  consumeRestart,
  keys,
  queuePunch,
} from './input'
import {
  hideLoader,
  onPunchButton,
  setAnimHud,
  setBanner,
  setEnemiesLeft,
  setHp,
  setLoaderError,
  setLoaderProgress,
} from './ui'

type Phase = 'play' | 'win' | 'lose'

const scene = new THREE.Scene()
scene.background = new THREE.Color('#8aa0b0')
scene.fog = new THREE.Fog('#8aa0b0', 16, 48)

const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 80)
camera.position.set(0, 2.2, 4.4)

const renderer = new THREE.WebGLRenderer({ antialias: true })
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
renderer.setSize(window.innerWidth, window.innerHeight)
renderer.shadowMap.enabled = true
document.body.appendChild(renderer.domElement)

scene.add(new THREE.HemisphereLight('#e8f0ff', '#3a3328', 0.85))
const sun = new THREE.DirectionalLight('#ffffff', 1.35)
sun.position.set(8, 14, 6)
sun.castShadow = true
sun.shadow.mapSize.set(2048, 2048)
sun.shadow.camera.near = 0.5
sun.shadow.camera.far = 40
sun.shadow.camera.left = -16
sun.shadow.camera.right = 16
sun.shadow.camera.top = 16
sun.shadow.camera.bottom = -16
sun.shadow.bias = -0.0002
scene.add(sun)

buildArena(scene)

const player = new THREE.Group()
scene.add(player)

const clock = new THREE.Clock()
const camDesired = new THREE.Vector3()
const camLook = new THREE.Vector3()
const camOffset = new THREE.Vector3()
const moveFwd = new THREE.Vector3()
const moveRight = new THREE.Vector3()
const moveDir = new THREE.Vector3()
const up = new THREE.Vector3(0, 1, 0)
const Y_AXIS = new THREE.Vector3(0, 1, 0)

let anim: ReturnType<typeof createAnim> | null = null
let enemies: Enemy[] = []
let phase: Phase = 'play'
let hp = PLAYER_MAX_HP
let punchHitThisSwing = false
let invuln = 0

bindInput()
onPunchButton(() => {
  if (phase !== 'lose') queuePunch()
})

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight
  camera.updateProjectionMatrix()
  renderer.setSize(window.innerWidth, window.innerHeight)
})

function dampAngle(current: number, target: number, lambda: number, dt: number) {
  let diff = target - current
  while (diff > Math.PI) diff -= Math.PI * 2
  while (diff < -Math.PI) diff += Math.PI * 2
  return current + diff * (1 - Math.exp(-lambda * dt))
}

function stepMovement(dt: number, locked: boolean) {
  let x = 0
  let z = 0
  if (keys.forward) z += 1
  if (keys.back) z -= 1
  if (keys.left) x -= 1
  if (keys.right) x += 1
  const moving = x !== 0 || z !== 0
  const running = moving && keys.run
  if (locked || !moving) return { moving: false, running: false }

  camera.getWorldDirection(moveFwd)
  moveFwd.y = 0
  if (moveFwd.lengthSq() < 1e-8) moveFwd.set(0, 0, 1)
  else moveFwd.normalize()
  moveRight.crossVectors(moveFwd, up).normalize()
  moveDir.copy(moveFwd).multiplyScalar(z).addScaledVector(moveRight, x).normalize()

  player.position.addScaledVector(moveDir, (running ? RUN_SPEED : WALK_SPEED) * dt)
  player.rotation.y = dampAngle(player.rotation.y, Math.atan2(moveDir.x, moveDir.z), 14, dt)
  clampToArena(player.position, PLAYER_RADIUS)
  return { moving, running }
}

function updateCamera(dt: number) {
  camOffset.set(0, 2.15, -4.35).applyAxisAngle(Y_AXIS, player.rotation.y)
  camDesired.copy(player.position).add(camOffset)
  camera.position.lerp(camDesired, 1 - Math.exp(-5.5 * dt))
  camLook.set(player.position.x, player.position.y + 1.15, player.position.z)
  camera.lookAt(camLook)
}

function startPunch() {
  if (!anim || phase === 'lose') return
  if (anim.oneShot === CLIP.punch || anim.oneShot === CLIP.dead) return
  const target = nearestEnemy(player, enemies)
  if (target) faceEnemy(player, target)
  punchHitThisSwing = false
  playOneShot(anim, CLIP.punch, 0.12)
}

function startWave() {
  clearWave(scene, enemies)
  enemies = spawnWave(scene, ENEMY_COUNT)
  hp = PLAYER_MAX_HP
  phase = 'play'
  punchHitThisSwing = false
  invuln = 0
  resetContactTimer()
  player.position.set(0, 0, 0)
  player.rotation.set(0, 0, 0)
  if (anim) {
    anim.oneShot = null
    play(anim, CLIP.walk, { pauseAtStart: true, loop: false, fade: 0 })
    anim.mixer.update(1 / 60)
  }
  setHp(hp, PLAYER_MAX_HP)
  setEnemiesLeft(aliveCount(enemies), ENEMY_COUNT)
  setBanner(null)
  setAnimHud('Idle', CLIP.walk)
}

function onPlayerHurt(amount: number) {
  if (!anim || phase !== 'play') return
  hp = Math.max(0, hp - amount)
  invuln = 0.9
  setHp(hp, PLAYER_MAX_HP)
  if (hp <= 0) {
    phase = 'lose'
    playOneShot(anim, CLIP.dead, 0.1)
    setBanner('lose')
    return
  }
  playOneShot(anim, CLIP.hit, 0.1)
}

const manager = new THREE.LoadingManager()
manager.onProgress = (_url, loaded, total) => {
  const pct = total > 0 ? Math.min(100, (loaded / total) * 100) : 0
  setLoaderProgress(pct)
}

const loader = new GLTFLoader(manager)
loader.load(
  MODEL_URL,
  (gltf) => {
    const model = gltf.scene
    model.traverse((obj) => {
      const mesh = obj as THREE.SkinnedMesh
      if (mesh.isMesh) {
        mesh.castShadow = true
        mesh.receiveShadow = true
      }
      if (mesh.isSkinnedMesh) mesh.frustumCulled = false
    })
    player.add(model)
    anim = createAnim(model, gltf.animations)
    anim.mixer.addEventListener('finished', (event) => {
      const finished = (event as { action: THREE.AnimationAction }).action.getClip().name
      if (!anim) return
      if (finished === CLIP.dead) return
      if (anim.oneShot === finished) anim.oneShot = null
    })
    startWave()
    hideLoader()
  },
  (event) => {
    if (!event.total) return
    setLoaderProgress(Math.min(100, (event.loaded / event.total) * 100))
  },
  () => setLoaderError('Failed to load /models/character.glb'),
)

renderer.setAnimationLoop(() => {
  const dt = Math.min(clock.getDelta(), 0.05)
  if (!anim) {
    renderer.render(scene, camera)
    return
  }

  if (consumeRestart()) startWave()

  const punchQueued = consumePunch()
  if (punchQueued && phase !== 'lose') startPunch()

  const jumpPressed = consumeJump()
  if (phase !== 'lose' && jumpPressed && anim.oneShot === null) {
    playOneShot(anim, CLIP.jump, 0.12)
  }

  invuln = Math.max(0, invuln - dt)
  const locked = phase === 'lose' || Boolean(anim.oneShot && LOCK_MOVEMENT.has(anim.oneShot))
  const { moving, running } = stepMovement(dt, locked)

  if (phase !== 'lose' && anim.oneShot === null) {
    if (moving && running) play(anim, CLIP.run, { loop: true })
    else if (moving) play(anim, CLIP.walk, { loop: true })
    else play(anim, CLIP.walk, { pauseAtStart: true, loop: false })
  }

  if (anim.oneShot === CLIP.punch && !punchHitThisSwing) {
    const t = clipTime(anim, CLIP.punch)
    if (t >= PUNCH_WINDOW_START && t <= PUNCH_WINDOW_END) {
      punchHitThisSwing = true
      resolvePunchHit(player, enemies)
      const left = aliveCount(enemies)
      setEnemiesLeft(left, ENEMY_COUNT)
      if (left === 0 && phase === 'play') {
        phase = 'win'
        setBanner('win')
      }
    }
  }
  if (anim.oneShot === CLIP.punch && clipTime(anim, CLIP.punch) >= PUNCH_RECOVER) {
    anim.oneShot = null
  }

  const chasing = phase === 'play'
  updateEnemies(enemies, player.position, dt, chasing)
  if (phase === 'play') {
    const dmg = resolveContact(player, enemies, dt, invuln <= 0 && anim.oneShot !== CLIP.hit)
    if (dmg > 0) onPlayerHurt(dmg)
  }

  setAnimHud(labelFor(anim.current ?? CLIP.walk, moving, running), anim.current ?? CLIP.walk)
  anim.mixer.update(dt)
  updateCamera(dt)
  renderer.render(scene, camera)
})
