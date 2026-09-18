export function Lights() {
  return (
    <>
      <hemisphereLight args={['#e8f0ff', '#3a3328', 0.85]} />
      <directionalLight
        position={[8, 14, 6]}
        intensity={1.35}
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-camera-near={0.5}
        shadow-camera-far={40}
        shadow-camera-left={-12}
        shadow-camera-right={12}
        shadow-camera-top={12}
        shadow-camera-bottom={-12}
        shadow-bias={-0.0002}
      />
    </>
  )
}
