import { Suspense, useCallback, useRef, useState } from 'react'
import { Canvas } from '@react-three/fiber'
import type { Group } from 'three'
import { Hud } from './components/Hud'
import { LoadingScreen } from './components/LoadingScreen'
import { Scene } from './components/Scene'

export default function App() {
  const characterRef = useRef<Group>(null)
  const oneShotRef = useRef<string | null>(null)
  const [state, setState] = useState('Loading')
  const [clip, setClip] = useState('—')
  const [clips, setClips] = useState<string[]>([])

  const onStateChange = useCallback((nextState: string, nextClip: string) => {
    setState(nextState)
    setClip(nextClip)
  }, [])

  const onClipsLoaded = useCallback((names: string[]) => {
    setClips(names)
  }, [])

  const onOneShot = useCallback((name: string) => {
    oneShotRef.current = name
  }, [])

  return (
    <div className="app">
      <Canvas
        shadows
        dpr={[1, 2]}
        camera={{ position: [0, 2.2, 4.4], fov: 45, near: 0.1, far: 80 }}
        gl={{ antialias: true }}
      >
        <Suspense fallback={null}>
          <Scene
            characterRef={characterRef}
            oneShotRef={oneShotRef}
            onStateChange={onStateChange}
            onClipsLoaded={onClipsLoaded}
          />
        </Suspense>
      </Canvas>
      <LoadingScreen />
      <Hud state={state} clip={clip} clips={clips} onOneShot={onOneShot} />
    </div>
  )
}
