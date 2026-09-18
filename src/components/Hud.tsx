import { HUD_ONESHOTS } from '../characters/clips'

type HudProps = {
  state: string
  clip: string
  clips: string[]
  onOneShot: (clip: string) => void
}

export function Hud({ state, clip, clips, onOneShot }: HudProps) {
  return (
    <aside className="hud" aria-label="Character controls">
      <header className="hud-header">
        <p className="hud-kicker">Hover</p>
        <h1>Character viewer</h1>
      </header>

      <section>
        <h2>State</h2>
        <p className="hud-state">{state}</p>
        <p className="hud-clip">clip: {clip}</p>
      </section>

      <section>
        <h2>Move</h2>
        <ul className="hud-keys">
          <li>
            <kbd>W A S D</kbd> / arrows — walk
          </li>
          <li>
            <kbd>Shift</kbd> — run
          </li>
          <li>
            <kbd>Space</kbd> — jump
          </li>
        </ul>
      </section>

      <section>
        <h2>One-shots</h2>
        <div className="hud-buttons">
          {HUD_ONESHOTS.map((item) => (
            <button key={item.clip} type="button" onClick={() => onOneShot(item.clip)}>
              {item.label}
            </button>
          ))}
        </div>
      </section>

      <section>
        <h2>Clips in GLB</h2>
        <ul className="hud-clips">
          {clips.length === 0
            ? <li>loading…</li>
            : clips.map((name) => (
                <li key={name} className={name === clip ? 'is-active' : undefined}>
                  {name}
                </li>
              ))}
        </ul>
      </section>
    </aside>
  )
}
