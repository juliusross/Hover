import { useEffect, useRef } from 'react'

export type KeyState = {
  forward: boolean
  back: boolean
  left: boolean
  right: boolean
  run: boolean
  jump: boolean
}

const INITIAL: KeyState = {
  forward: false,
  back: false,
  left: false,
  right: false,
  run: false,
  jump: false,
}

function applyKey(keys: KeyState, code: string, pressed: boolean) {
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

/** Keyboard state lives in a ref — no React re-renders on key events. */
export function useKeyboard() {
  const keys = useRef<KeyState>({ ...INITIAL })

  useEffect(() => {
    const onDown = (event: KeyboardEvent) => {
      if (event.repeat) {
        if (BLOCK.has(event.code)) event.preventDefault()
        return
      }
      applyKey(keys.current, event.code, true)
      if (BLOCK.has(event.code)) event.preventDefault()
    }
    const onUp = (event: KeyboardEvent) => {
      applyKey(keys.current, event.code, false)
    }
    const onBlur = () => {
      Object.assign(keys.current, INITIAL)
    }

    window.addEventListener('keydown', onDown)
    window.addEventListener('keyup', onUp)
    window.addEventListener('blur', onBlur)
    return () => {
      window.removeEventListener('keydown', onDown)
      window.removeEventListener('keyup', onUp)
      window.removeEventListener('blur', onBlur)
    }
  }, [])

  return keys
}
