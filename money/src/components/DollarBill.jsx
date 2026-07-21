import React, { useRef, useMemo, useEffect, useCallback, useState } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { ClothSimulation } from '../lib/clothPhysics'

const BILL_WIDTH = 1.535
const BILL_HEIGHT = 0.6525
const COLS = 48
const ROWS = 28
const DT = 1 / 60

function createBillGeometry() {
  const geo = new THREE.PlaneGeometry(BILL_WIDTH, BILL_HEIGHT, COLS - 1, ROWS - 1)
  geo.rotateX(-Math.PI / 2)
  return geo
}

function initializeGeometry(geo, cloth) {
  const positions = cloth.getPositions()
  const posAttr = geo.getAttribute('position')
  const arr = posAttr.array
  for (let i = 0; i < cloth.particleCount; i++) {
    const i3 = i * 3
    arr[i3] = positions[i3]
    arr[i3 + 1] = positions[i3 + 1]
    arr[i3 + 2] = positions[i3 + 2]
  }
  posAttr.needsUpdate = true
  geo.computeVertexNormals()
}

function useTexture(url) {
  const [texture, setTexture] = useState(null)
  useEffect(() => {
    const loader = new THREE.TextureLoader()
    loader.load(url, (tex) => {
      tex.colorSpace = THREE.SRGBColorSpace
      tex.anisotropy = 16
      tex.wrapS = THREE.RepeatWrapping
      tex.wrapT = THREE.RepeatWrapping
      setTexture(tex)
    })
  }, [url])
  return texture
}

export default function DollarBill({ wind, forwardRef }) {
  const clothRef = useRef(null)
  const keysRef = useRef({})
  const cameraStateRef = useRef({ theta: Math.PI * 0.15, phi: Math.PI * 0.35, dist: 4 })
  const isDraggingRef = useRef(false)
  const raycasterRef = useRef(new THREE.Raycaster())

  const { camera, gl } = useThree()

  const texture = useTexture('/bill-texture.jpg')

  const cloth = useMemo(() => {
    const c = new ClothSimulation(BILL_WIDTH, BILL_HEIGHT, COLS, ROWS)
    clothRef.current = c
    return c
  }, [])

  const geometry = useMemo(() => {
    const g = createBillGeometry()
    initializeGeometry(g, cloth)
    return g
  }, [])

  const backGeometry = useMemo(() => {
    const g = createBillGeometry()
    const uvAttr = g.getAttribute('uv')
    const arr = uvAttr.array
    for (let i = 0; i < arr.length; i += 2) {
      arr[i] = 1.0 - arr[i]
    }
    uvAttr.needsUpdate = true
    initializeGeometry(g, cloth)
    return g
  }, [])

  useEffect(() => {
    forwardRef.current = {
      reset: () => {
        if (clothRef.current) {
          clothRef.current.reset()
          updateGeometryPositions(geometry, clothRef.current)
          updateGeometryPositions(backGeometry, clothRef.current)
        }
      }
    }
  }, [forwardRef, geometry, backGeometry])

  useEffect(() => {
    const onKeyDown = (e) => { keysRef.current[e.key.toLowerCase()] = true }
    const onKeyUp = (e) => { keysRef.current[e.key.toLowerCase()] = false }
    window.addEventListener('keydown', onKeyDown)
    window.addEventListener('keyup', onKeyUp)
    return () => {
      window.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('keyup', onKeyUp)
    }
  }, [])

  const getHitPoint = useCallback((event) => {
    const rect = gl.domElement.getBoundingClientRect()
    const mouse = new THREE.Vector2(
      ((event.clientX - rect.left) / rect.width) * 2 - 1,
      -((event.clientY - rect.top) / rect.height) * 2 + 1
    )
    raycasterRef.current.setFromCamera(mouse, camera)
    const ray = raycasterRef.current.ray
    const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), -0.01)
    const target = new THREE.Vector3()
    if (ray.intersectPlane(plane, target)) return target
    return null
  }, [camera, gl])

  useEffect(() => {
    const canvas = gl.domElement
    const onPointerDown = (e) => {
      if (e.button !== 0) return
      const hit = getHitPoint(e)
      if (hit && clothRef.current) {
        clothRef.current.startDrag(hit, camera.position)
        isDraggingRef.current = true
      }
    }
    const onPointerMove = (e) => {
      if (isDraggingRef.current && clothRef.current) {
        const hit = getHitPoint(e)
        if (hit) clothRef.current.moveDrag(hit)
      }
    }
    const onPointerUp = () => {
      if (isDraggingRef.current && clothRef.current) {
        clothRef.current.endDrag()
        isDraggingRef.current = false
      }
    }
    canvas.addEventListener('pointerdown', onPointerDown)
    window.addEventListener('pointermove', onPointerMove)
    window.addEventListener('pointerup', onPointerUp)
    return () => {
      canvas.removeEventListener('pointerdown', onPointerDown)
      window.removeEventListener('pointermove', onPointerMove)
      window.removeEventListener('pointerup', onPointerUp)
    }
  }, [gl, camera, getHitPoint])

  useEffect(() => {
    const onWheel = (e) => {
      cameraStateRef.current.dist = THREE.MathUtils.clamp(
        cameraStateRef.current.dist + e.deltaY * 0.002,
        1.5, 10
      )
    }
    window.addEventListener('wheel', onWheel, { passive: true })
    return () => window.removeEventListener('wheel', onWheel)
  }, [])

  useFrame((state, delta) => {
    const keys = keysRef.current
    const cs = cameraStateRef.current
    const rotSpeed = 2.0 * delta

    if (keys['arrowleft'] || keys['a']) cs.theta -= rotSpeed
    if (keys['arrowright'] || keys['d']) cs.theta += rotSpeed
    if (keys['arrowup'] || keys['w']) cs.phi = Math.max(0.1, cs.phi - rotSpeed)
    if (keys['arrowdown'] || keys['s']) cs.phi = Math.min(Math.PI * 0.48, cs.phi + rotSpeed)

    camera.position.set(
      cs.dist * Math.sin(cs.phi) * Math.cos(cs.theta),
      cs.dist * Math.cos(cs.phi),
      cs.dist * Math.sin(cs.phi) * Math.sin(cs.theta)
    )
    camera.lookAt(0, 0, 0)

    if (clothRef.current) {
      clothRef.current.update(DT, wind, state.clock.elapsedTime)
      updateGeometryPositions(geometry, clothRef.current)
      updateGeometryPositions(backGeometry, clothRef.current)
    }
  })

  if (!texture) return null

  return (
    <group>
      <mesh geometry={geometry} frustumCulled={false} castShadow receiveShadow>
        <meshStandardMaterial
          map={texture}
          roughness={0.5}
          metalness={0.0}
          side={THREE.DoubleSide}
        />
      </mesh>
    </group>
  )
}

function updateGeometryPositions(geo, cloth) {
  const positions = cloth.getPositions()
  const posAttr = geo.getAttribute('position')
  const arr = posAttr.array
  for (let i = 0; i < cloth.particleCount; i++) {
    const i3 = i * 3
    arr[i3] = positions[i3]
    arr[i3 + 1] = positions[i3 + 1]
    arr[i3 + 2] = positions[i3 + 2]
  }
  posAttr.needsUpdate = true
  geo.computeVertexNormals()
}
