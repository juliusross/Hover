export type Keys = {
  forward: boolean
  back: boolean
  left: boolean
  right: boolean
  run: boolean
  jump: boolean
}

export const keys: Keys = {
  forward: false,
  back: false,
  left: false,
  right: false,
  run: false,
  jump: false,
}

export let pendingJump = false
export let pendingPunch = false
export let pendingRestart = false

export function consumeJump() {
  const pressed = pendingJump || (keys.jump && !jumpHeld)
  pendingJump = false
  jumpHeld = keys.jump
  return pressed
}

export function queuePunch() {
  pendingPunch = true
}

export function consumePunch() {
  const pressed = pendingPunch
  pendingPunch = false
  return pressed
}

export function consumeRestart() {
  const pressed = pendingRestart
  pendingRestart = false
  return pressed
}

let jumpHeld = false

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

export function bindInput() {
  window.addEventListener('keydown', (event) => {
    if (BLOCK.has(event.code)) event.preventDefault()
    if (event.repeat) return
    applyKey(event.code, true)
    if (event.code === 'Space') pendingJump = true
    if (event.code === 'KeyF' || event.code === 'KeyJ') pendingPunch = true
    if (event.code === 'KeyR') pendingRestart = true
  })
  window.addEventListener('keyup', (event) => applyKey(event.code, false))
  window.addEventListener('blur', () => {
    keys.forward = keys.back = keys.left = keys.right = keys.run = keys.jump = false
  })
}

export function wantsMove() {
  return keys.forward || keys.back || keys.left || keys.right
}
