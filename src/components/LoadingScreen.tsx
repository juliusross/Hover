import { useProgress } from '@react-three/drei'

export function LoadingScreen() {
  const { active, progress, loaded, total } = useProgress()
  if (!active && progress >= 100) return null

  const pct = Math.min(100, progress)

  return (
    <div className="loader">
      <div className="loader-card">
        <p className="loader-kicker">Hover</p>
        <h1>Loading character</h1>
        <p className="loader-path">/models/character.glb</p>
        <div className="loader-bar" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
          <span style={{ width: `${pct}%` }} />
        </div>
        <p className="loader-meta">
          {pct.toFixed(0)}%
          {total > 0 ? ` · ${loaded}/${total} assets` : ''}
        </p>
      </div>
    </div>
  )
}
