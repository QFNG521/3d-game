import React, { forwardRef } from 'react'
import { Environment } from '@react-three/drei'
import { EffectComposer, Bloom, Vignette } from '@react-three/postprocessing'
import DollarBill from './DollarBill'

const Scene = forwardRef(function Scene({ wind, billRef }, ref) {
  return (
    <>
      <color attach="background" args={['#f0ece6']} />
      <fog attach="fog" args={['#f0ece6', 10, 30]} />

      <ambientLight intensity={0.8} color="#fff8f0" />
      <directionalLight
        position={[5, 10, 5]}
        intensity={1.5}
        color="#fff5e0"
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-near={0.1}
        shadow-camera-far={30}
        shadow-camera-left={-5}
        shadow-camera-right={5}
        shadow-camera-top={5}
        shadow-camera-bottom={-5}
      />
      <directionalLight
        position={[-5, 5, -3]}
        intensity={0.4}
        color="#d0e0ff"
      />
      <pointLight position={[0, 6, 0]} intensity={0.5} color="#ffffff" />

      <Environment preset="apartment" />

      <DollarBill wind={wind} forwardRef={billRef} />

      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.005, 0]} receiveShadow>
        <planeGeometry args={[50, 50]} />
        <meshStandardMaterial color="#e8e4de" roughness={0.95} metalness={0.0} />
      </mesh>

      <EffectComposer multisampling={4}>
        <Bloom
          intensity={0.08}
          luminanceThreshold={0.95}
          luminanceSmoothing={0.4}
        />
        <Vignette
          eskil={false}
          offset={0.15}
          darkness={0.3}
        />
      </EffectComposer>
    </>
  )
})

export default Scene
