import { useEffect, useMemo, useRef, useState } from 'react'
import * as THREE from 'three'
import { useFrame, useThree } from '@react-three/fiber'
import { RoundedBox, MeshReflectorMaterial } from '@react-three/drei'
import { EffectComposer, Bloom, Noise, Vignette, ToneMapping, Glitch } from '@react-three/postprocessing'
import { BlendFunction, GlitchMode, ToneMappingMode } from 'postprocessing'
import gsap from 'gsap'
import { useWorld } from '../store/world'

/**
 * A dark room. A stack of old sets, each one a channel.
 * Unselected sets show static. The selected set carries its world's colour
 * and lights the room. Turning the dial is the only interaction.
 */

const SLOTS: { p: [number, number, number]; r: number; s: number }[] = [
  { p: [-1.42, 0.46, 0.05], r: 0.08, s: 1 },
  { p: [0, 0.44, 0], r: -0.03, s: 1.05 },
  { p: [1.4, 0.46, 0.08], r: -0.1, s: 0.98 },
  { p: [-1.15, 1.36, -0.05], r: 0.05, s: 0.92 },
  { p: [0.12, 1.4, -0.1], r: 0.02, s: 0.96 },
  { p: [1.35, 1.34, -0.02], r: -0.06, s: 0.9 },
]

export function GuideScene() {
  const worlds = useWorld((s) => s.worlds)
  const index = useWorld((s) => s.guideIndex)
  const reduced = useWorld((s) => s.reducedMotion)
  const { camera } = useThree()
  const look = useRef(new THREE.Vector3(0, 0.95, 0))
  const [glitch, setGlitch] = useState(false)

  useEffect(() => {
    const c = camera as THREE.PerspectiveCamera
    c.fov = 40
    c.near = 0.1
    c.far = 40
    c.position.set(0.2, 1.1, 4.7)
    c.updateProjectionMatrix()
  }, [camera])

  useEffect(() => {
    const slot = SLOTS[index % SLOTS.length]
    gsap.to(look.current, { x: slot.p[0] * 0.35, y: 0.95 + (slot.p[1] - 0.9) * 0.3, duration: 1, ease: 'power3.out' })
    gsap.to(camera.position, { x: 0.2 + slot.p[0] * 0.18, y: 1.1 + (slot.p[1] - 0.9) * 0.15, duration: 1.1, ease: 'power3.out' })
    if (!reduced) {
      setGlitch(true)
      const t = setTimeout(() => setGlitch(false), 320)
      return () => clearTimeout(t)
    }
  }, [index, camera, reduced])

  useFrame(({ clock }) => {
    const t = clock.elapsedTime
    camera.position.x += Math.sin(t * 0.3) * 0.0006
    camera.lookAt(look.current.x + Math.sin(t * 0.2) * 0.01, look.current.y, look.current.z)
  })

  const floor = useMemo(() => new THREE.Vector2(0.5, 0.5), [])

  return (
    <>
      <color attach="background" args={['#000']} />
      <fog attach="fog" args={['#000', 5, 14]} />
      <ambientLight intensity={0.14} color="#9aa5b5" />
      {worlds.slice(0, SLOTS.length).map((w, i) => (
        <CRT key={w.id} slot={SLOTS[i]} color={w.poster} on={i === index} seed={i} />
      ))}
      {/* floor: a dark carpet that carries the glow */}
      <mesh rotation-x={-Math.PI / 2} position={[0, 0, 0]} receiveShadow>
        <planeGeometry args={[16, 16]} />
        <MeshReflectorMaterial
          blur={[500, 200]}
          resolution={512}
          mixBlur={6}
          mixStrength={1.6}
          depthScale={0.8}
          minDepthThreshold={0.5}
          maxDepthThreshold={1.4}
          roughness={0.95}
          metalness={0}
          color="#0a0908"
          mirror={0.22}
          normalScale={floor}
        />
      </mesh>
      <EffectComposer multisampling={0} mergeMode="none">
        <Bloom intensity={0.9} luminanceThreshold={0.45} luminanceSmoothing={0.5} mipmapBlur />
        <ToneMapping mode={ToneMappingMode.ACES_FILMIC} />
        <Noise premultiply blendFunction={BlendFunction.SOFT_LIGHT} opacity={0.25} />
        <Vignette eskil={false} offset={0.2} darkness={0.9} />
        <Glitch active={glitch} delay={new THREE.Vector2(0, 0.05)} duration={new THREE.Vector2(0.1, 0.25)} strength={new THREE.Vector2(0.2, 0.5)} mode={GlitchMode.SPORADIC} ratio={0.7} />
      </EffectComposer>
    </>
  )
}

/** An old television. The screen is a canvas of static that the frame loop repaints. */
function CRT({ slot, color, on, seed }: { slot: { p: [number, number, number]; r: number; s: number }; color: string; on: boolean; seed: number }) {
  const light = useRef<THREE.PointLight>(null)
  const led = useRef<THREE.Mesh>(null)
  const { canvas, tex, ctx } = useMemo(() => {
    const canvas = document.createElement('canvas')
    canvas.width = 96
    canvas.height = 72
    const ctx = canvas.getContext('2d')!
    const tex = new THREE.CanvasTexture(canvas)
    tex.colorSpace = THREE.SRGBColorSpace
    tex.minFilter = THREE.LinearFilter
    return { canvas, tex, ctx }
  }, [])
  const tint = useMemo(() => new THREE.Color(color), [color])
  const glow = useRef(on ? 1 : 0)
  const frame = useRef(0)
  useEffect(() => { gsap.to(glow, { current: on ? 1 : 0, duration: 0.6, ease: 'power2.out' }) }, [on])

  useFrame(({ clock }) => {
    frame.current++
    if (frame.current % 2) return
    const t = clock.elapsedTime
    const g = glow.current
    const w = canvas.width, h = canvas.height
    const img = ctx.createImageData(w, h)
    const d = img.data
    // rolling band and occasional torn slices, stronger on the selected set
    const band = ((t * 0.35 + seed * 0.2) % 1) * h
    const tear = Math.sin(t * 9 + seed) > 0.92 ? Math.floor(Math.random() * h) : -1
    for (let y = 0; y < h; y++) {
      const dy = Math.abs(y - band)
      const bandBoost = dy < 6 ? (1 - dy / 6) * 0.6 : 0
      const shift = tear >= 0 && Math.abs(y - tear) < 4 ? Math.floor((Math.random() - 0.5) * 20) : 0
      for (let x = 0; x < w; x++) {
        const n = Math.random()
        const base = 0.08 + n * 0.32 * (0.5 + g * 0.5)
        const xx = ((x + shift) % w + w) % w
        const i = (y * w + xx) * 4
        // colour glare drifting diagonally, like a rainbow bloom on a tube
        const glare = 0.5 + 0.5 * Math.sin((x / w) * 3 + (y / h) * 2 + t * 0.7 + seed)
        const r = base * (1 - g) + g * (tint.r * 0.9 + glare * 0.5 + bandBoost) * (0.6 + n * 0.5)
        const gg = base * (1 - g) + g * (tint.g * 0.9 + (1 - glare) * 0.35 + bandBoost) * (0.6 + n * 0.5)
        const b = base * (1 - g) + g * (tint.b * 0.9 + glare * 0.3 + bandBoost) * (0.6 + n * 0.5)
        d[i] = Math.min(255, r * 255)
        d[i + 1] = Math.min(255, gg * 255)
        d[i + 2] = Math.min(255, b * 255)
        d[i + 3] = 255
      }
    }
    ctx.putImageData(img, 0, 0)
    tex.needsUpdate = true
    if (light.current) {
      light.current.intensity = 0.8 + g * 14 + (g > 0.5 && Math.random() > 0.9 ? 1.5 : 0)
      light.current.color.copy(tint).lerp(new THREE.Color('#9aa5b5'), 1 - g)
    }
    if (led.current) (led.current.material as THREE.MeshStandardMaterial).emissiveIntensity = g > 0.5 ? 4 : 0.6 + Math.sin(t * 2 + seed) * 0.3
  })

  return (
    <group position={slot.p} rotation-y={slot.r} scale={slot.s}>
      <RoundedBox args={[1.24, 0.92, 0.98]} radius={0.05} smoothness={4} castShadow receiveShadow>
        <meshStandardMaterial color="#2b2521" roughness={0.65} metalness={0.05} />
      </RoundedBox>
      {/* bezel */}
      <mesh position={[-0.08, 0.02, 0.485]}>
        <boxGeometry args={[0.92, 0.72, 0.03]} />
        <meshStandardMaterial color="#141110" roughness={0.5} />
      </mesh>
      {/* screen, slightly proud of the bezel */}
      <mesh position={[-0.08, 0.02, 0.505]}>
        <planeGeometry args={[0.84, 0.63]} />
        <meshBasicMaterial map={tex} toneMapped={false} />
      </mesh>
      {/* control strip */}
      <mesh position={[0.46, 0.02, 0.5]}>
        <boxGeometry args={[0.18, 0.72, 0.02]} />
        <meshStandardMaterial color="#1c1917" roughness={0.6} />
      </mesh>
      <mesh ref={led} position={[0.46, 0.28, 0.515]}>
        <boxGeometry args={[0.05, 0.02, 0.01]} />
        <meshStandardMaterial color="#300" emissive="#ff3b3b" emissiveIntensity={1} />
      </mesh>
      {[0.05, -0.12].map((y) => (
        <mesh key={y} position={[0.46, y, 0.52]} rotation-x={Math.PI / 2}>
          <cylinderGeometry args={[0.035, 0.035, 0.03, 16]} />
          <meshStandardMaterial color="#3a332e" roughness={0.5} metalness={0.4} />
        </mesh>
      ))}
      {/* speaker grille lines */}
      {[-0.28, -0.31, -0.34].map((y) => (
        <mesh key={y} position={[0.46, y, 0.512]}>
          <boxGeometry args={[0.12, 0.006, 0.005]} />
          <meshStandardMaterial color="#0a0908" />
        </mesh>
      ))}
      <pointLight ref={light} position={[-0.08, 0.05, 1.1]} intensity={1} distance={5.5} decay={1.6} color={color} />
    </group>
  )
}
