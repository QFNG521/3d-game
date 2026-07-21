import React, { useState, useRef, useCallback } from 'react'
import { Canvas } from '@react-three/fiber'
import Scene from './components/Scene'
import UI from './components/UI'

export default function App() {
  const [wind, setWind] = useState(false)
  const billRef = useRef()

  const handleReset = useCallback(() => {
    if (billRef.current?.reset) billRef.current.reset()
  }, [])

  const handleToggleWind = useCallback(() => {
    setWind(w => !w)
  }, [])

  return (
    <div style={{ width: '100vw', height: '100vh', background: '#f5f0eb' }}>
      <Canvas
        camera={{ position: [2, 4, 3], fov: 45, near: 0.1, far: 100 }}
        gl={{
          antialias: true,
          toneMapping: 3,
          toneMappingExposure: 1.0,
          outputColorSpace: 'srgb',
        }}
        shadows
        dpr={[1, 2]}
        style={{ cursor: 'default' }}
      >
        <Scene wind={wind} billRef={billRef} />
      </Canvas>
      <div className="hint-text">
        拖拽纸币 · 方向键/WASD旋转视角 · 滚轮缩放
      </div>
      <UI wind={wind} onToggleWind={handleToggleWind} onReset={handleReset} />
    </div>
  )
}
