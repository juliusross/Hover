import './style.css'
import * as THREE from 'three'
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'

const MODEL_URL = '/models/character.glb'
const WALK = 'Walking'
const RUN = 'Running'
const JUMP = 'Regular_Jump'
const LOCK_MOVEMENT = new Set([
  'Punch_Combo_2',
  'Hit_Reaction',
  'Listening_Gesture',
  'Dead',
])
const WALK_SPEED = 1.85
const RUN_SPEED = 5.1
const FADE = 0.22

const keys = {
  forward: false,
  back: false,
  left: false,
  right: false,
  run: false,
  jump: false,
}

const hudState = document.querySelector('#hud-state') as HTMLElement
const hudClip = document.querySelector('#hud-clip') as HTMLElement
const hudClips = document.querySelector('#hud-clips') as HTMLElement
const loaderEl = document.querySelector('#loader') as HTMLElement
const loaderBar = document.querySelector('#loader-bar') as HTMLElement
const loaderMeta = document.querySelector('#loader-meta') as HTMLElement

const scene = new THREE.Scene()
scene.background = new THREE.Color('#8aa0b0')
scene.fog = new THREE.Fog('#8aa0b0', 22, 80)

const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 160)
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
sun.shadow.camera.left = -12
sun.shadow.camera.right = 12
sun.shadow.camera.top = 12
sun.shadow.camera.bottom = -12
sun.shadow.bias = -0.0002
scene.add(sun)

const ground = new THREE.Mesh(
  new THREE.PlaneGeometry(400, 400),
  new THREE.MeshStandardMaterial({ color: '#3f4c3c', roughness: 0.95, metalness: 0.02 }),
)
ground.rotation.x = -Math.PI / 2
ground.receiveShadow = true
scene.add(ground)

const grid = new THREE.GridHelper(200, 80, 0x8fa392, 0x6d7f70)
grid.position.y = 0.01
scene.add(grid)

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

const actions: Record<string, THREE.AnimationAction> = {}
let mixer: THREE.AnimationMixer | null = null
let currentClip: string | null = null
let oneShot: string | null = null
let jumpHeld = false
let pendingJump = false
let pendingOneShot: string | null = null
let shownState = ''
let shownClip = ''

function setHud(state: string, clip: string) {
  if (state === shownState && clip === shownClip) return
  shownState = state
  shownClip = clip
  hudState.textContent = state
  hudClip.textContent = `clip: ${clip}`
  for (const li of hudClips.querySelectorAll('li')) {
    li.classList.toggle('is-active', li.textContent === clip)
  }
}

function labelFor(clip: string, moving: boolean, running: boolean) {
  if (clip === JUMP) return 'Jump'
  if (clip === 'Punch_Combo_2') return 'Punch'
  if (clip === 'Hit_Reaction') return 'Hit'
  if (clip === 'Listening_Gesture') return 'Listen'
  if (clip === 'Dead') return 'Dead'
  if (clip === WALK && !moving) return 'Idle'
  if (clip === RUN || running) return 'Run'
  if (clip === WALK) return 'Walk'
  return clip
}

function play(name: string, opts: {
  loop?: boolean
  fade?: number
  clamp?: boolean
  pauseAtStart?: boolean
} = {}) {
  const next = actions[name]
  if (!next) return
  const { loop = true, fade = FADE, clamp = false, pauseAtStart = false } = opts

  if (currentClip === name && next.isScheduled()) {
    if (pauseAtStart) {
      if (next.timeScale !== 0) {
        next.time = 0
        next.timeScale = 0
        next.paused = false
      }
    } else if (next.timeScale === 0 || next.paused) {
      next.paused = false
      next.time = 0
      next.timeScale = 1
      next.setLoop(THREE.LoopRepeat, Infinity)
    }
    return
  }

  next.enabled = true
  next.reset()
  next.paused = false
  next.time = 0
  next.timeScale = pauseAtStart ? 0 : 1
  next.clampWhenFinished = clamp
  next.setLoop(loop && !pauseAtStart ? THREE.LoopRepeat : THREE.LoopOnce, loop && !pauseAtStart ? Infinity : 1)

  const prev = currentClip ? actions[currentClip] : null
  if (prev && prev !== next) {
    next.fadeIn(fade)
    prev.fadeOut(fade)
  } else {
    next.weight = 1
    next.setEffectiveWeight(1)
  }
  next.play()
  currentClip = name
}

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
  return { moving, running }
}

function updateCamera(dt: number) {
  camOffset.set(0, 2.15, -4.35).applyAxisAngle(Y_AXIS, player.rotation.y)
  camDesired.copy(player.position).add(camOffset)
  camera.position.lerp(camDesired, 1 - Math.exp(-5.5 * dt))
  camLook.set(player.position.x, player.position.y + 1.15, player.position.z)
  camera.lookAt(camLook)
}

function applyKey(code: string, pressed: boolean) {
  switch (code) {
    case 'KeyW':
    case 'ArrowUp':
      keys.forward = pressed
      break
    case 'KeyS':
    case 'ArrowDown':
      keys.back = pressed
      break
    case 'KeyA':
    case 'ArrowLeft':
      keys.left = pressed
      break
    case 'KeyD':
    case 'ArrowRight':
      keys.right = pressed
      break
    case 'ShiftLeft':
    case 'ShiftRight':
      keys.run = pressed
      break
    case 'Space':
      keys.jump = pressed
      break
    default:
      break
  }
}

const BLOCK = new Set(['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'])

window.addEventListener('keydown', (event) => {
  if (BLOCK.has(event.code)) event.preventDefault()
  if (event.repeat) return
  applyKey(event.code, true)
  if (event.code === 'Space') pendingJump = true
})
window.addEventListener('keyup', (event) => applyKey(event.code, false))
window.addEventListener('blur', () => {
  keys.forward = keys.back = keys.left = keys.right = keys.run = keys.jump = false
})

document.querySelectorAll<HTMLButtonElement>('[data-clip]').forEach((button) => {
  button.addEventListener('click', () => {
    pendingOneShot = button.dataset.clip ?? null
  })
})

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight
  camera.updateProjectionMatrix()
  renderer.setSize(window.innerWidth, window.innerHeight)
})

const manager = new THREE.LoadingManager()
manager.onProgress = (_url, loaded, total) => {
  const pct = total > 0 ? Math.min(100, (loaded / total) * 100) : 0
  loaderBar.style.width = `${pct}%`
  loaderMeta.textContent = `${pct.toFixed(0)}%`
}

const loader = new GLTFLoader(manager)
loader.load(MODEL_URL, (gltf) => {
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

  mixer = new THREE.AnimationMixer(model)
  for (const clip of gltf.animations) {
    actions[clip.name] = mixer.clipAction(clip, model)
  }

  hudClips.replaceChildren()
  for (const clip of gltf.animations) {
    const li = document.createElement('li')
    li.textContent = clip.name
    hudClips.append(li)
  }

  mixer.addEventListener('finished', (event) => {
    const finished = (event as { action: THREE.AnimationAction }).action.getClip().name
    if (finished === 'Dead') return
    if (oneShot === finished) oneShot = null
  })

  play(WALK, { pauseAtStart: true, loop: false, fade: 0 })
  mixer.update(1 / 60)
  setHud('Idle', WALK)
  loaderEl.hidden = true
}, (event) => {
  if (!event.total) return
  const pct = Math.min(100, (event.loaded / event.total) * 100)
  loaderBar.style.width = `${pct}%`
  loaderMeta.textContent = `${pct.toFixed(0)}%`
}, () => {
  loaderMeta.textContent = 'Failed to load /models/character.glb'
})

renderer.setAnimationLoop(() => {
  const dt = Math.min(clock.getDelta(), 0.05)
  if (!mixer) {
    renderer.render(scene, camera)
    return
  }

  if (pendingOneShot && actions[pendingOneShot]) {
    oneShot = pendingOneShot
    pendingOneShot = null
    play(oneShot, { loop: false, clamp: true, fade: oneShot === 'Dead' ? 0.12 : 0.18 })
  }

  const jumpPressed = pendingJump || (keys.jump && !jumpHeld)
  pendingJump = false
  jumpHeld = keys.jump
  const wantsMove = keys.forward || keys.back || keys.left || keys.right
  if (oneShot === 'Dead' && wantsMove) oneShot = null
  if (jumpPressed && oneShot === null) {
    oneShot = JUMP
    play(JUMP, { loop: false, clamp: true, fade: 0.12 })
  }

  const inOneShot = oneShot !== null
  const { moving, running } = stepMovement(dt, Boolean(oneShot && LOCK_MOVEMENT.has(oneShot)))
  if (!inOneShot) {
    if (moving && running) play(RUN, { loop: true })
    else if (moving) play(WALK, { loop: true })
    else play(WALK, { pauseAtStart: true, loop: false })
  }

  setHud(labelFor(currentClip ?? WALK, moving, running), currentClip ?? WALK)
  mixer.update(dt)
  updateCamera(dt)
  renderer.render(scene, camera)
})
