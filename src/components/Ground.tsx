import { Grid } from '@react-three/drei'

export function Ground() {
  return (
    <>
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[400, 400]} />
        <meshStandardMaterial color="#3f4c3c" roughness={0.95} metalness={0.02} />
      </mesh>
      <Grid
        args={[400, 400]}
        cellSize={1}
        cellThickness={0.6}
        cellColor="#6d7f70"
        sectionSize={5}
        sectionThickness={1.1}
        sectionColor="#8fa392"
        fadeDistance={70}
        fadeStrength={1.2}
        position={[0, 0.01, 0]}
      />
    </>
  )
}
