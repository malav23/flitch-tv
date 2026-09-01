import { useEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import { useFrame, useThree } from '@react-three/fiber'
import { EffectComposer, Bloom, Noise, Vignette, ToneMapping } from '@react-three/postprocessing'
import { BlendFunction, ToneMappingMode } from 'postprocessing'
import { useWorld } from '../store/world'

/** Behind the posters: a dark room, slow light leaks, drifting dust. Tinted by the focused poster. */
export function GuideScene() {
  const poster = useWorld((s) => s.worlds[s.guideIndex]?.poster ?? '#8f2b2b')
  const reduced = useWorld((s) => s.reducedMotion)
  const dust = useRef<THREE.Points>(null)
  const leakA = useRef<THREE.Mesh>(null)
  const leakB = useRef<THREE.Mesh>(null)
  const target = useMemo(() => new THREE.Color(), [])
  const { camera } = useThree()

  useEffect(() => {
    camera.position.set(0, 0.2, 9)
    camera.lookAt(0, 0, 0)
  }, [camera])

  const leakTex = useMemo(() => {
    const c = document.createElement('canvas')
    c.width = c.height = 256
    const g = c.getContext('2d')!
    const grad = g.createRadialGradient(128, 128, 0, 128, 128, 128)
    grad.addColorStop(0, 'rgba(255,255,255,1)')
    grad.addColorStop(0.4, 'rgba(255,255,255,0.35)')
    grad.addColorStop(1, 'rgba(255,255,255,0)')
    g.fillStyle = grad
    g.fillRect(0, 0, 256, 256)
    const t = new THREE.CanvasTexture(c)
    return t
  }, [])

  const positions = useMemo(() => {
    const n = 900
    const a = new Float32Array(n * 3)
    for (let i = 0; i < n; i++) {
      a[i * 3] = (Math.random() - 0.5) * 24
      a[i * 3 + 1] = (Math.random() - 0.5) * 12
      a[i * 3 + 2] = -Math.random() * 14
    }
    return a
  }, [])

  useFrame(({ clock }, dt) => {
    const d = reduced ? 0 : dt
    const t = clock.elapsedTime
    target.set(poster)
    if (dust.current) {
      const p = dust.current.geometry.attributes.position as THREE.BufferAttribute
      for (let i = 0; i < p.count; i++) {
        let y = p.getY(i) - d * 0.05
        if (y < -6) y = 6
        p.setY(i, y)
      }
      p.needsUpdate = true
    }
    if (leakA.current) {
      leakA.current.position.set(-5 + Math.sin(t * 0.13) * 1.5, 1.5 + Math.cos(t * 0.11) * 0.8, -6)
      ;(leakA.current.material as THREE.MeshBasicMaterial).color.lerp(target, 0.04)
    }
    if (leakB.current) {
      leakB.current.position.set(5 + Math.cos(t * 0.09) * 1.2, -2 + Math.sin(t * 0.15) * 0.9, -7)
      ;(leakB.current.material as THREE.MeshBasicMaterial).color.lerp(target, 0.04)
    }
  })

  return (
    <>
      <color attach="background" args={['#0a0908']} />
      <fog attach="fog" args={['#0a0908', 5, 22]} />
      <mesh ref={leakA} position={[-5, 1.5, -6]}>
        <planeGeometry args={[16, 16]} />
        <meshBasicMaterial map={leakTex} transparent opacity={0.28} blending={THREE.AdditiveBlending} depthWrite={false} color="#8f2b2b" />
      </mesh>
      <mesh ref={leakB} position={[5, -2, -7]}>
        <planeGeometry args={[14, 14]} />
        <meshBasicMaterial map={leakTex} transparent opacity={0.18} blending={THREE.AdditiveBlending} depthWrite={false} color="#8f2b2b" />
      </mesh>
      <points ref={dust}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        </bufferGeometry>
        <pointsMaterial size={0.025} sizeAttenuation transparent opacity={0.5} color="#efe7d7" />
      </points>
      <EffectComposer multisampling={0}>
        <Bloom intensity={0.6} luminanceThreshold={0.6} luminanceSmoothing={0.6} mipmapBlur />
        <ToneMapping mode={ToneMappingMode.ACES_FILMIC} />
        <Noise premultiply blendFunction={BlendFunction.SOFT_LIGHT} opacity={0.3} />
        <Vignette eskil={false} offset={0.2} darkness={0.9} />
      </EffectComposer>
    </>
  )
}
