export type Banner = 'win' | 'lose' | null

const els = {
  state: document.querySelector('#hud-state') as HTMLElement,
  clip: document.querySelector('#hud-clip') as HTMLElement,
  hp: document.querySelector('#hud-hp') as HTMLElement,
  enemies: document.querySelector('#hud-enemies') as HTMLElement,
  banner: document.querySelector('#banner') as HTMLElement,
  bannerTitle: document.querySelector('#banner-title') as HTMLElement,
  bannerHint: document.querySelector('#banner-hint') as HTMLElement,
  loader: document.querySelector('#loader') as HTMLElement,
  loaderBar: document.querySelector('#loader-bar') as HTMLElement,
  loaderMeta: document.querySelector('#loader-meta') as HTMLElement,
}

let shownState = ''
let shownClip = ''
let shownHp = -1
let shownAlive = -1

export function setLoaderProgress(pct: number) {
  els.loaderBar.style.width = `${pct}%`
  els.loaderMeta.textContent = `${pct.toFixed(0)}%`
}

export function hideLoader() {
  els.loader.hidden = true
}

export function setLoaderError(message: string) {
  els.loaderMeta.textContent = message
}

export function setAnimHud(state: string, clip: string) {
  if (state === shownState && clip === shownClip) return
  shownState = state
  shownClip = clip
  els.state.textContent = state
  els.clip.textContent = `clip: ${clip}`
}

export function setHp(hp: number, max: number) {
  if (hp === shownHp) return
  shownHp = hp
  const filled = Math.max(0, hp)
  els.hp.textContent = `${'●'.repeat(filled)}${'○'.repeat(Math.max(0, max - filled))}  ${filled}/${max}`
}

export function setEnemiesLeft(alive: number, total: number) {
  if (alive === shownAlive) return
  shownAlive = alive
  els.enemies.textContent = `${alive} / ${total}`
}

export function setBanner(kind: Banner) {
  if (!kind) {
    els.banner.hidden = true
    return
  }
  els.banner.hidden = false
  els.banner.dataset.kind = kind
  if (kind === 'win') {
    els.bannerTitle.textContent = 'Wave cleared'
    els.bannerHint.textContent = 'Press R for another wave'
  } else {
    els.bannerTitle.textContent = 'You are down'
    els.bannerHint.textContent = 'Press R to restart'
  }
}

export function onPunchButton(handler: () => void) {
  document.querySelector('#btn-punch')?.addEventListener('click', handler)
}
