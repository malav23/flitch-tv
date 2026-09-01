import { useEffect, useMemo, useRef, useState } from 'react'
import * as THREE from 'three'
import { useFrame, useThree } from '@react-three/fiber'
import { MeshReflectorMaterial, MeshDistortMaterial } from '@react-three/drei'
import { EffectComposer, EffectGroup, Bloom, Noise, Vignette, ChromaticAberration, Glitch, ToneMapping, SMAA, DepthOfField } from '@react-three/postprocessing'
import { BlendFunction, GlitchMode, ToneMappingMode } from 'postprocessing'
import type { ChromaticAberrationEffect, DepthOfFieldEffect } from 'postprocessing'
import gsap from 'gsap'
import { useWorld, currentLoop } from '../store/world'
import { makeSurface } from './textures'

/**
 * The "reality layer": a simulated live feed rendered in real time.
 * A wet concrete corridor lit by tungsten tubes. The room behind the door is
 * where generated interrupts land. Phase changes in the store drive GSAP beats.
 */

type StageKey = 'door' | 'survive' | 'vent'
const STAGES: Record<StageKey, { start: number; end: number; doorOpen: boolean }> = {
  door: { start: 1.6, end: -8.4, doorOpen: false },
  survive: { start: -9.6, end: -11.4, doorOpen: true },
  vent: { start: 1.6, end: -6.2, doorOpen: false },
}
const stageOf = (id?: string): StageKey => (id === 'survive' ? 'survive' : id === 'vent' ? 'vent' : 'door')

const DOOR_Z = -12
const WALL_X = 1.9
const CEIL = 3

const TUNGSTEN = '#ffd9a8'
const OXBLOOD = '#c8322b'

interface Beat {
  red: number
  flash: number
  shake: number
  push: number
  gold: number
  dim: number
  aberration: number
}

/** Focus target shared between the creator and the depth-of-field effect */
const focusPoint = new THREE.Vector3(0, 1.1, 0)

export function WorldScene() {
  const phase = useWorld((s) => s.phase)
  const outcome = useWorld((s) => s.outcome)
  const loopId = useWorld((s) => currentLoop(s)?.id)
  const locked = useWorld((s) => !!s.locked)
  const reduced = useWorld((s) => s.reducedMotion)
  const stage = stageOf(loopId)

  const beat = useRef<Beat>({ red: 0, flash: 0, shake: 0, push: 0, gold: 0, dim: 0, aberration: 0.0006 })
  const creatureRef = useRef<THREE.Group>(null)
  const doorRef = useRef<THREE.Group>(null)
  const shieldRef = useRef<THREE.Mesh>(null)
  const grateRef = useRef<THREE.Mesh>(null)
  const chestLid = useRef<THREE.Mesh>(null)
  const [glitch, setGlitch] = useState(false)

  useEffect(() => {
    gsap.to(beat.current, { dim: locked ? 0.75 : 0, red: locked ? 0.25 : 0, duration: 1.2, ease: 'power2.out' })
    if (locked && !reduced) {
      setGlitch(true)
      const t = setTimeout(() => setGlitch(false), 700)
      gsap.fromTo(beat.current, { shake: 0.25 }, { shake: 0, duration: 0.8 })
      return () => clearTimeout(t)
    }
  }, [locked, reduced])

  useEffect(() => {
    if (phase !== 'calm') return
    const st = STAGES[stage]
    gsap.killTweensOf(beat.current)
    gsap.to(beat.current, { red: 0, flash: 0, push: 0, gold: 0, dim: 0, shake: 0, aberration: 0.0006, duration: 1.2 })
    if (doorRef.current) gsap.to(doorRef.current.rotation, { y: st.doorOpen ? -1.75 : 0, duration: 0.01 })
    if (creatureRef.current) {
      const c = creatureRef.current
      c.visible = stage === 'survive'
      c.position.set(1.2, 1.1, -14.2)
      c.scale.setScalar(stage === 'survive' ? 1 : 0.6)
    }
    if (shieldRef.current) { shieldRef.current.scale.setScalar(0.01); (shieldRef.current.material as THREE.MeshBasicMaterial).opacity = 0 }
    if (grateRef.current) { grateRef.current.position.set(WALL_X - 0.02, 1.7, -9); grateRef.current.rotation.set(0, -Math.PI / 2, 0) }
    if (chestLid.current) chestLid.current.rotation.x = 0
  }, [phase, stage])

  useEffect(() => {
    if (phase !== 'reveal' || !outcome) return
    const b = beat.current
    const c = creatureRef.current
    const tl = gsap.timeline()
    const violent = ['monster', 'dies', 'wounded', 'vent-creature'].includes(outcome)

    tl.to(b, { flash: 1, duration: 0.05 }).to(b, { flash: 0, duration: 0.6, ease: 'power2.out' })
    tl.to(b, { push: 1, duration: 1.6, ease: 'power3.inOut' }, 0)

    if (stage === 'door' && doorRef.current) tl.to(doorRef.current.rotation, { y: -1.85, duration: 1.3, ease: 'power2.inOut' }, 0.15)
    if (stage === 'vent' && grateRef.current && (outcome === 'vent-creature' || outcome === 'vent-child')) {
      tl.to(grateRef.current.position, { x: WALL_X - 1.2, y: 0.3, z: -8.4, duration: 0.45, ease: 'power3.in' }, 0.9)
      tl.to(grateRef.current.rotation, { x: 1.2, z: 0.6, duration: 0.45 }, 0.9)
    }

    switch (outcome) {
      case 'treasure':
        tl.to(b, { gold: 1, duration: 1.4, ease: 'power2.out' }, 1.2)
        if (chestLid.current) tl.to(chestLid.current.rotation, { x: -1.4, duration: 1.1, ease: 'back.out(1.6)' }, 1.3)
        break
      case 'monster':
        if (c) {
          c.visible = true
          c.position.set(0, 1, -15.6)
          c.scale.setScalar(0.6)
          tl.to(c.position, { z: -10.3, y: 1.25, duration: 0.5, ease: 'power4.in' }, 1.35)
          tl.to(c.scale, { x: 1.25, y: 1.25, z: 1.25, duration: 0.5 }, 1.35)
        }
        tl.to(b, { red: 1, shake: 0.9, aberration: 0.006, duration: 0.25 }, 1.8)
        tl.to(b, { shake: 0.15, aberration: 0.0015, duration: 2.2, ease: 'power2.out' }, 2.1)
        break
      case 'empty':
        tl.to(b, { dim: 0.5, duration: 2 }, 1)
        break
      case 'survive':
        if (shieldRef.current) {
          const m = shieldRef.current.material as THREE.MeshBasicMaterial
          tl.to(m, { opacity: 0.9, duration: 0.2 }, 1.0)
          tl.to(shieldRef.current.scale, { x: 6, y: 6, z: 6, duration: 1.1, ease: 'power3.out' }, 1.0)
          tl.to(m, { opacity: 0, duration: 0.8 }, 1.5)
        }
        if (c) {
          tl.to(c.position, { z: -18.5, x: 0.4, y: 1, duration: 1.2, ease: 'power3.out' }, 1.2)
          tl.to(c.scale, { x: 0.3, y: 0.3, z: 0.3, duration: 1.4 }, 1.2)
        }
        tl.to(b, { shake: 0.35, duration: 0.2 }, 1.0).to(b, { shake: 0, duration: 1 }, 1.3)
        break
      case 'wounded':
        if (c) {
          tl.to(c.position, { z: -11.2, x: -0.3, y: 1.3, duration: 0.45, ease: 'power4.in' }, 1.1)
          tl.to(c.position, { z: -14.5, x: 1.4, duration: 1.2, ease: 'power2.out' }, 2.0)
        }
        tl.to(b, { red: 0.9, shake: 0.7, aberration: 0.004, duration: 0.2 }, 1.5)
        tl.to(b, { red: 0.35, shake: 0.05, aberration: 0.001, duration: 2.5 }, 1.9)
        break
      case 'dies':
        if (c) {
          tl.to(c.position, { z: -9.7, x: 0, y: 1.45, duration: 0.55, ease: 'power4.in' }, 1.2)
          tl.to(c.scale, { x: 1.6, y: 1.6, z: 1.6, duration: 0.55 }, 1.2)
        }
        tl.to(b, { red: 1, shake: 1.2, aberration: 0.01, duration: 0.2 }, 1.7)
        tl.to(b, { dim: 1, shake: 0, duration: 1.5 }, 2.4)
        break
      case 'vent-nothing':
        tl.to(b, { dim: 0.2, duration: 1.5 }, 1)
        break
      case 'vent-creature':
        if (c) {
          c.visible = true
          c.position.set(WALL_X + 0.6, 1.7, -9)
          c.scale.setScalar(0.35)
          tl.to(c.position, { x: 0.3, y: 1.1, z: -8.6, duration: 0.7, ease: 'power3.in' }, 1.4)
          tl.to(c.scale, { x: 1.2, y: 1.2, z: 1.2, duration: 0.7 }, 1.4)
        }
        tl.to(b, { red: 1, shake: 0.9, aberration: 0.006, duration: 0.25 }, 2.0)
        tl.to(b, { shake: 0.1, aberration: 0.0015, duration: 2, ease: 'power2.out' }, 2.4)
        break
      case 'vent-child':
        tl.to(b, { gold: 0.7, duration: 1.6 }, 1.4)
        break
    }

    if (violent && !reduced) {
      const t1 = setTimeout(() => setGlitch(true), 1300)
      const t2 = setTimeout(() => setGlitch(false), 2900)
      return () => { clearTimeout(t1); clearTimeout(t2); tl.kill() }
    }
    return () => tl.kill()
  }, [phase, outcome, stage, reduced])

  return (
    <>
      <color attach="background" args={['#070605']} />
      <fog attach="fog" args={['#070605', 4, 26]} />
      <ambientLight intensity={0.18} color="#8a7c6a" />
      <hemisphereLight args={['#3a2f26', '#050403', 0.35]} />
      <Corridor />
      <Fixtures beat={beat} />
      <Door ref={doorRef} />
      <Room outcome={outcome} beat={beat} chestLid={chestLid} />
      <Vent grateRef={grateRef} visible={stage === 'vent'} />
      <Survivor visible={phase !== 'calm' && phase !== 'expectation' && phase !== 'anticipation' && outcome === 'vent-child'} />
      <Creature ref={creatureRef} beat={beat} />
      <Creator stage={stage} shieldRef={shieldRef} />
      <Dust />
      <CameraRig stage={stage} beat={beat} />
      <Effects beat={beat} glitch={glitch && !reduced} />
    </>
  )
}

// ---------------------------------------------------------------- set

function Corridor() {
  const floor = useMemo(() => makeSurface({ color: '#2a2622', variation: 0.5, grime: 0.6, bump: 3, roughness: 0.75, wet: 0.7, repeat: [2, 10], seed: 3 }), [])
  const wall = useMemo(() => makeSurface({ color: '#4a4038', variation: 0.4, grime: 0.7, grid: { cols: 6, rows: 3 }, bump: 3.5, roughness: 0.8, repeat: [7, 1.2], seed: 11 }), [])
  const ceil = useMemo(() => makeSurface({ color: '#2b2521', variation: 0.3, grime: 0.5, bump: 2, roughness: 0.9, repeat: [2, 10], seed: 19 }), [])
  const ribs = useMemo(() => Array.from({ length: 8 }, (_, i) => -1.5 - i * 1.6), [])
  const normalScale = useMemo(() => new THREE.Vector2(0.6, 0.6), [])

  return (
    <group>
      {/* wet concrete floor: reflects the tubes */}
      <mesh rotation-x={-Math.PI / 2} position={[0, 0, -5]} receiveShadow>
        <planeGeometry args={[WALL_X * 2, 20]} />
        <MeshReflectorMaterial
          map={floor.map}
          normalMap={floor.normalMap}
          roughnessMap={floor.roughnessMap}
          normalScale={normalScale}
          blur={[600, 200]}
          resolution={768}
          mixBlur={4}
          mixStrength={2.2}
          mixContrast={1}
          depthScale={0.6}
          minDepthThreshold={0.6}
          maxDepthThreshold={1.6}
          roughness={0.7}
          metalness={0.05}
          color="#5a5148"
          mirror={0.35}
        />
      </mesh>
      {/* ceiling */}
      <mesh rotation-x={Math.PI / 2} position={[0, CEIL, -5]} receiveShadow>
        <planeGeometry args={[WALL_X * 2, 20]} />
        <meshStandardMaterial map={ceil.map} normalMap={ceil.normalMap} roughnessMap={ceil.roughnessMap} color="#7a6f66" />
      </mesh>
      {/* tiled walls */}
      <mesh rotation-y={Math.PI / 2} position={[-WALL_X, 1.5, -5]} receiveShadow>
        <planeGeometry args={[20, 3]} />
        <meshStandardMaterial map={wall.map} normalMap={wall.normalMap} roughnessMap={wall.roughnessMap} color="#8b7f74" />
      </mesh>
      <mesh rotation-y={-Math.PI / 2} position={[WALL_X, 1.5, -5]} receiveShadow>
        <planeGeometry args={[20, 3]} />
        <meshStandardMaterial map={wall.map} normalMap={wall.normalMap} roughnessMap={wall.roughnessMap} color="#8b7f74" />
      </mesh>
      {/* wainscot line, skirting, conduit */}
      {[-1, 1].map((side) => (
        <group key={side}>
          <mesh position={[side * (WALL_X - 0.02), 1.25, -5]} rotation-y={side > 0 ? -Math.PI / 2 : Math.PI / 2}>
            <boxGeometry args={[20, 0.05, 0.03]} />
            <meshStandardMaterial color="#5b3a2e" roughness={0.6} />
          </mesh>
          <mesh position={[side * (WALL_X - 0.04), 0.09, -5]} rotation-y={side > 0 ? -Math.PI / 2 : Math.PI / 2}>
            <boxGeometry args={[20, 0.18, 0.06]} />
            <meshStandardMaterial color="#1e1a17" roughness={0.9} />
          </mesh>
          <mesh position={[side * (WALL_X - 0.09), 2.3, -5]} rotation-x={Math.PI / 2}>
            <cylinderGeometry args={[0.035, 0.035, 20, 10]} />
            <meshStandardMaterial color="#39322d" roughness={0.55} metalness={0.7} />
          </mesh>
        </group>
      ))}
      {/* structural ribs */}
      {ribs.map((z) => (
        <group key={z} position-z={z}>
          <mesh position={[-WALL_X + 0.1, 1.5, 0]} castShadow receiveShadow><boxGeometry args={[0.2, 3, 0.28]} /><meshStandardMaterial color="#3d352f" roughness={0.75} /></mesh>
          <mesh position={[WALL_X - 0.1, 1.5, 0]} castShadow receiveShadow><boxGeometry args={[0.2, 3, 0.28]} /><meshStandardMaterial color="#3d352f" roughness={0.75} /></mesh>
          <mesh position={[0, CEIL - 0.08, 0]} castShadow><boxGeometry args={[WALL_X * 2, 0.16, 0.28]} /><meshStandardMaterial color="#3d352f" roughness={0.75} /></mesh>
          {[-WALL_X + 0.1, WALL_X - 0.1].map((x) => (
            <mesh key={x} position={[x, 2.2, 0.15]}><cylinderGeometry args={[0.03, 0.03, 0.02, 8]} /><meshStandardMaterial color="#8a7d6a" metalness={0.9} roughness={0.4} /></mesh>
          ))}
        </group>
      ))}
      {/* ceiling pipes */}
      {[[WALL_X - 0.35, 2.7, 0.08], [WALL_X - 0.55, 2.62, 0.05], [-WALL_X + 0.4, 2.75, 0.1]].map(([x, y, r], i) => (
        <mesh key={i} position={[x, y, -5]} rotation-x={Math.PI / 2} castShadow>
          <cylinderGeometry args={[r, r, 20, 14]} />
          <meshStandardMaterial color={i === 2 ? '#5a2f27' : '#3a332e'} roughness={0.45} metalness={0.7} />
        </mesh>
      ))}
      {/* hanging cable */}
      <mesh position={[0.6, 2.2, -3.2]} rotation-z={0.15}>
        <torusGeometry args={[0.5, 0.012, 6, 30, Math.PI]} />
        <meshStandardMaterial color="#111" roughness={0.9} />
      </mesh>
      {/* crates and drums along the walls */}
      <mesh position={[-WALL_X + 0.45, 0.35, -2.4]} rotation-y={0.2} castShadow receiveShadow><boxGeometry args={[0.7, 0.7, 0.7]} /><meshStandardMaterial color="#4c3f33" roughness={0.9} /></mesh>
      <mesh position={[-WALL_X + 0.4, 0.95, -2.5]} rotation-y={-0.3} castShadow receiveShadow><boxGeometry args={[0.5, 0.5, 0.5]} /><meshStandardMaterial color="#3f352c" roughness={0.9} /></mesh>
      <mesh position={[WALL_X - 0.45, 0.45, -6.4]} castShadow receiveShadow><cylinderGeometry args={[0.3, 0.3, 0.9, 20]} /><meshStandardMaterial color="#5a2f27" roughness={0.5} metalness={0.4} /></mesh>
      <mesh position={[WALL_X - 0.5, 0.45, -7.1]} castShadow receiveShadow><cylinderGeometry args={[0.3, 0.3, 0.9, 20]} /><meshStandardMaterial color="#3a332e" roughness={0.5} metalness={0.5} /></mesh>
      {/* end wall around the door */}
      <mesh position={[0, 1.5, DOOR_Z - 0.02]} receiveShadow>
        <planeGeometry args={[WALL_X * 2, 3]} />
        <meshStandardMaterial map={wall.map} normalMap={wall.normalMap} roughnessMap={wall.roughnessMap} color="#7a6f66" />
      </mesh>
      {/* hazard stripe */}
      <mesh rotation-x={-Math.PI / 2} position={[0, 0.006, DOOR_Z + 1.1]}>
        <planeGeometry args={[WALL_X * 2, 0.16]} />
        <meshStandardMaterial color="#d1a955" emissive="#d1a955" emissiveIntensity={0.12} roughness={0.9} />
      </mesh>
    </group>
  )
}

/** Recessed tungsten tubes with housings, fake volumetric cones and one shadow-casting light. */
function Fixtures({ beat }: { beat: React.RefObject<Beat> }) {
  const zs = useMemo(() => [-0.5, -4.5, -8.5], [])
  const lights = useRef<THREE.PointLight[]>([])
  const tubes = useRef<THREE.Mesh[]>([])
  const cones = useRef<THREE.Mesh[]>([])
  const seed = useRef(zs.map(() => Math.random() * 100))
  const warm = useMemo(() => new THREE.Color(TUNGSTEN), [])
  const red = useMemo(() => new THREE.Color(OXBLOOD), [])
  const tmp = useMemo(() => new THREE.Color(), [])

  useFrame(({ clock }) => {
    const b = beat.current!
    const chaos = useWorld.getState().chaos
    const t = clock.elapsedTime
    zs.forEach((_, i) => {
      const n = Math.sin(t * 17 + seed.current[i]) * Math.sin(t * 5.3 + seed.current[i] * 2)
      const flick = n > 0.55 - chaos * 0.35 ? 0.25 : 1
      const base = 16 * flick * (1 - b.dim * 0.8)
      tmp.copy(warm).lerp(red, b.red)
      const l = lights.current[i]
      const m = tubes.current[i]?.material as THREE.MeshStandardMaterial | undefined
      const cm = cones.current[i]?.material as THREE.MeshBasicMaterial | undefined
      if (l) { l.intensity = base + b.flash * 40; l.color.copy(tmp) }
      if (m) { m.emissiveIntensity = (flick > 0.5 ? 1.2 : 0.2) * (1 - b.dim * 0.85) + b.flash * 2; m.emissive.copy(tmp) }
      if (cm) { cm.opacity = (flick > 0.5 ? 0.028 : 0.008) * (1 - b.dim * 0.9); cm.color.copy(tmp) }
    })
  })

  return (
    <group>
      {zs.map((z, i) => (
        <group key={z} position={[0, CEIL - 0.1, z]}>
          <mesh position={[0, 0.02, 0]} castShadow>
            <boxGeometry args={[1.6, 0.12, 0.26]} />
            <meshStandardMaterial color="#2b2622" roughness={0.6} metalness={0.5} />
          </mesh>
          <mesh ref={(el) => { if (el) tubes.current[i] = el }} position={[0, -0.05, 0]} rotation-z={Math.PI / 2}>
            <cylinderGeometry args={[0.03, 0.03, 1.4, 12]} />
            <meshStandardMaterial color="#ffe6c4" emissive={TUNGSTEN} emissiveIntensity={1.2} roughness={0.3} />
          </mesh>
          <mesh ref={(el) => { if (el) cones.current[i] = el }} position={[0, -1.15, 0]} scale={[1.6, 1, 0.55]}>
            <coneGeometry args={[1.3, 2.2, 24, 1, true]} />
            <meshBasicMaterial color={TUNGSTEN} transparent opacity={0.045} side={THREE.DoubleSide} depthWrite={false} blending={THREE.AdditiveBlending} />
          </mesh>
          <pointLight
            ref={(el) => { if (el) lights.current[i] = el }}
            position={[0, -0.25, 0]}
            intensity={16}
            distance={9}
            decay={1.4}
            color={TUNGSTEN}
            castShadow={i === 1}
            shadow-mapSize={[1024, 1024]}
            shadow-bias={-0.002}
          />
        </group>
      ))}
    </group>
  )
}

const Door = ({ ref }: { ref: React.RefObject<THREE.Group | null> }) => {
  const steel = useMemo(() => makeSurface({ color: '#4d4238', variation: 0.5, grime: 0.8, bump: 2, roughness: 0.5, repeat: [1, 1], seed: 23 }), [])
  return (
    <group position={[0, 0, DOOR_Z]}>
      <mesh position={[-0.74, 1.15, 0]} castShadow><boxGeometry args={[0.14, 2.3, 0.24]} /><meshStandardMaterial color="#2c2622" roughness={0.6} metalness={0.4} /></mesh>
      <mesh position={[0.74, 1.15, 0]} castShadow><boxGeometry args={[0.14, 2.3, 0.24]} /><meshStandardMaterial color="#2c2622" roughness={0.6} metalness={0.4} /></mesh>
      <mesh position={[0, 2.37, 0]} castShadow><boxGeometry args={[1.62, 0.14, 0.24]} /><meshStandardMaterial color="#2c2622" roughness={0.6} metalness={0.4} /></mesh>
      {/* door lamp */}
      <mesh position={[0, 2.55, 0.12]}><boxGeometry args={[0.3, 0.1, 0.12]} /><meshStandardMaterial color="#2b2622" metalness={0.6} roughness={0.4} /></mesh>
      <mesh position={[0, 2.49, 0.15]}><sphereGeometry args={[0.035, 10, 10]} /><meshStandardMaterial color="#fff" emissive={OXBLOOD} emissiveIntensity={4} /></mesh>
      <pointLight position={[0, 2.4, 0.4]} intensity={2.5} distance={3} color={OXBLOOD} />
      {/* hinged leaf */}
      <group ref={ref} position={[-0.66, 0, 0]}>
        <mesh position={[0.66, 1.15, 0]} castShadow receiveShadow>
          <boxGeometry args={[1.28, 2.26, 0.08]} />
          <meshStandardMaterial map={steel.map} normalMap={steel.normalMap} roughnessMap={steel.roughnessMap} color="#6a5a4e" metalness={0.55} />
        </mesh>
        <mesh position={[0.66, 0.75, 0.045]}>
          <boxGeometry args={[0.9, 1.1, 0.02]} />
          <meshStandardMaterial color="#3d332c" roughness={0.6} metalness={0.5} />
        </mesh>
        <mesh position={[0.66, 1.75, 0.045]} rotation-x={Math.PI / 2}>
          <cylinderGeometry args={[0.16, 0.16, 0.03, 24]} />
          <meshStandardMaterial color="#8a7d6a" metalness={0.9} roughness={0.3} />
        </mesh>
        <mesh position={[0.66, 1.75, 0.065]}>
          <circleGeometry args={[0.12, 24]} />
          <meshStandardMaterial color="#05070a" roughness={0.1} metalness={0.2} />
        </mesh>
        <mesh position={[1.14, 1.05, 0.09]} rotation-z={Math.PI / 2}>
          <cylinderGeometry args={[0.025, 0.025, 0.22, 12]} />
          <meshStandardMaterial color="#c8b28a" metalness={0.9} roughness={0.25} />
        </mesh>
        <mesh position={[1.12, 1.3, 0.06]}>
          <boxGeometry args={[0.1, 0.16, 0.03]} />
          <meshStandardMaterial color="#1a1614" roughness={0.5} />
        </mesh>
        <mesh position={[1.12, 1.34, 0.08]}>
          <boxGeometry args={[0.03, 0.02, 0.01]} />
          <meshStandardMaterial color="#fff" emissive="#8fa284" emissiveIntensity={3} />
        </mesh>
        <mesh position={[0.66, 2.0, 0.045]}>
          <planeGeometry args={[0.5, 0.14]} />
          <meshStandardMaterial color="#d1a955" emissive="#d1a955" emissiveIntensity={0.08} roughness={0.9} />
        </mesh>
      </group>
    </group>
  )
}

function Room({ outcome, beat, chestLid }: { outcome: string | null; beat: React.RefObject<Beat>; chestLid: React.RefObject<THREE.Mesh | null> }) {
  const gold = useRef<THREE.PointLight>(null)
  const redLight = useRef<THREE.PointLight>(null)
  const wall = useMemo(() => makeSurface({ color: '#2a2420', variation: 0.5, grime: 0.8, bump: 2.5, roughness: 0.9, repeat: [3, 2], seed: 41 }), [])
  useFrame(() => {
    const b = beat.current!
    if (gold.current) gold.current.intensity = b.gold * 40
    if (redLight.current) redLight.current.intensity = b.red * 30
  })
  const showChest = outcome === 'treasure'
  return (
    <group position={[0, 0, DOOR_Z - 3]}>
      <mesh rotation-x={-Math.PI / 2} receiveShadow><planeGeometry args={[5, 6]} /><meshStandardMaterial map={wall.map} normalMap={wall.normalMap} color="#4a423b" roughness={0.85} /></mesh>
      <mesh rotation-x={Math.PI / 2} position={[0, 3, 0]}><planeGeometry args={[5, 6]} /><meshStandardMaterial color="#120f0d" /></mesh>
      <mesh position={[0, 1.5, -3]} receiveShadow><planeGeometry args={[5, 3]} /><meshStandardMaterial map={wall.map} normalMap={wall.normalMap} color="#3a332d" /></mesh>
      <mesh rotation-y={Math.PI / 2} position={[-2.5, 1.5, 0]}><planeGeometry args={[6, 3]} /><meshStandardMaterial map={wall.map} normalMap={wall.normalMap} color="#3a332d" /></mesh>
      <mesh rotation-y={-Math.PI / 2} position={[2.5, 1.5, 0]}><planeGeometry args={[6, 3]} /><meshStandardMaterial map={wall.map} normalMap={wall.normalMap} color="#3a332d" /></mesh>
      {/* server racks with status LEDs */}
      {[-1.8, 1.8].map((x) => (
        <group key={x} position={[x, 0, -1]}>
          <mesh position={[0, 1.1, 0]} castShadow receiveShadow><boxGeometry args={[0.6, 2.2, 2.6]} /><meshStandardMaterial color="#14110f" roughness={0.6} metalness={0.5} /></mesh>
          {Array.from({ length: 9 }, (_, i) => (
            <mesh key={i} position={[x < 0 ? 0.31 : -0.31, 0.4 + i * 0.2, -1 + (i % 3) * 0.8]}>
              <boxGeometry args={[0.01, 0.02, 0.02]} />
              <meshStandardMaterial color="#fff" emissive={i % 4 === 0 ? '#c8322b' : '#8fa284'} emissiveIntensity={3} />
            </mesh>
          ))}
        </group>
      ))}
      <pointLight ref={redLight} position={[0, 1.4, 0]} intensity={0} distance={9} color={OXBLOOD} />
      <group position={[0, 0, -0.6]} visible={showChest}>
        <mesh position={[0, 0.3, 0]} castShadow><boxGeometry args={[1.1, 0.6, 0.7]} /><meshStandardMaterial color="#3b2a12" roughness={0.6} metalness={0.4} /></mesh>
        <group position={[0, 0.6, -0.35]}>
          <mesh ref={chestLid} position={[0, 0.06, 0.35]} castShadow><boxGeometry args={[1.12, 0.12, 0.72]} /><meshStandardMaterial color="#4a3416" roughness={0.5} metalness={0.5} /></mesh>
        </group>
        <mesh position={[0, 0.62, 0]}><boxGeometry args={[0.9, 0.04, 0.5]} /><meshStandardMaterial color="#ffd27a" emissive="#d1a955" emissiveIntensity={2.5} /></mesh>
        <pointLight ref={gold} position={[0, 1, 0.3]} intensity={0} distance={7} color="#d1a955" />
      </group>
    </group>
  )
}

function Vent({ grateRef, visible }: { grateRef: React.RefObject<THREE.Mesh | null>; visible: boolean }) {
  const fan = useRef<THREE.Mesh>(null)
  useFrame((_, dt) => {
    const s = useWorld.getState()
    const stopped = !!s.locked || (s.phase === 'reveal' && s.outcome !== 'vent-nothing')
    if (fan.current) fan.current.rotation.z += dt * (stopped ? 0.4 : 9)
  })
  return (
    <group visible={visible}>
      <mesh position={[WALL_X - 0.01, 1.7, -9]} rotation-y={-Math.PI / 2}>
        <planeGeometry args={[1.2, 0.9]} />
        <meshStandardMaterial color="#000" />
      </mesh>
      <mesh ref={fan} position={[WALL_X + 0.35, 1.7, -9]} rotation-y={-Math.PI / 2}>
        <boxGeometry args={[0.9, 0.08, 0.04]} />
        <meshStandardMaterial color="#3a3542" />
      </mesh>
      <mesh ref={grateRef} position={[WALL_X - 0.02, 1.7, -9]} rotation-y={-Math.PI / 2} castShadow>
        <boxGeometry args={[1.2, 0.9, 0.04]} />
        <meshStandardMaterial color="#3a3542" roughness={0.6} metalness={0.5} wireframe />
      </mesh>
    </group>
  )
}

function Survivor({ visible }: { visible: boolean }) {
  return (
    <group position={[1.2, 0, -8.6]} visible={visible}>
      <mesh position={[0, 0.55, 0]} castShadow><capsuleGeometry args={[0.16, 0.6, 4, 10]} /><meshStandardMaterial color="#e8e2d0" roughness={0.9} /></mesh>
      <pointLight position={[0, 1, 0.3]} intensity={18} distance={6} color="#ffcf8a" />
    </group>
  )
}

const Creature = ({ ref, beat }: { ref: React.RefObject<THREE.Group | null>; beat: React.RefObject<Beat> }) => {
  const spikes = useMemo(
    () => Array.from({ length: 22 }, () => {
      const v = new THREE.Vector3().randomDirection()
      return { pos: v.clone().multiplyScalar(0.55), quat: new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), v), len: 0.5 + Math.random() * 1.1 }
    }),
    [],
  )
  const eyes = useRef<THREE.PointLight>(null)
  const body = useRef<THREE.Mesh>(null)
  useFrame(({ clock }) => {
    const g = ref.current
    if (!g || !g.visible) return
    const t = clock.elapsedTime
    const s = useWorld.getState()
    if (body.current) body.current.scale.setScalar(1 + Math.sin(t * 3.1) * 0.05)
    if (s.phase !== 'reveal' && stageOf(currentLoop(s)?.id) === 'survive') {
      g.position.x = 1.2 + Math.sin(t * 0.7) * 1.1
      g.position.y = 1.1 + Math.sin(t * 1.9) * 0.15
      g.rotation.y = Math.sin(t * 0.7) * 0.6
    } else {
      g.rotation.y += 0.01
      g.rotation.x = Math.sin(t * 2) * 0.1
    }
    if (eyes.current) eyes.current.intensity = 10 + Math.sin(t * 13) * 4 + beat.current!.red * 20
  })
  return (
    <group ref={ref} visible={false}>
      <mesh ref={body} castShadow>
        <icosahedronGeometry args={[0.65, 4]} />
        <MeshDistortMaterial color="#070406" roughness={0.3} metalness={0.25} distort={0.45} speed={2.6} />
      </mesh>
      {spikes.map((s, i) => (
        <mesh key={i} position={s.pos} quaternion={s.quat} castShadow>
          <coneGeometry args={[0.06, s.len, 6]} />
          <meshStandardMaterial color="#0a0608" roughness={0.5} metalness={0.3} />
        </mesh>
      ))}
      <mesh position={[-0.18, 0.12, 0.6]}><sphereGeometry args={[0.06, 12, 12]} /><meshStandardMaterial color="#fff" emissive="#d94b3a" emissiveIntensity={6} /></mesh>
      <mesh position={[0.18, 0.1, 0.6]}><sphereGeometry args={[0.06, 12, 12]} /><meshStandardMaterial color="#fff" emissive="#d94b3a" emissiveIntensity={6} /></mesh>
      <pointLight ref={eyes} position={[0, 0.1, 0.9]} intensity={10} distance={5} color={OXBLOOD} />
    </group>
  )
}

/** An articulated walker with a headlamp. Limbs swing from hips and shoulders while moving. */
function Creator({ stage, shieldRef }: { stage: StageKey; shieldRef: React.RefObject<THREE.Mesh | null> }) {
  const g = useRef<THREE.Group>(null)
  const lamp = useRef<THREE.SpotLight>(null)
  const cone = useRef<THREE.Mesh>(null)
  const hipL = useRef<THREE.Group>(null)
  const hipR = useRef<THREE.Group>(null)
  const shL = useRef<THREE.Group>(null)
  const shR = useRef<THREE.Group>(null)
  const torso = useRef<THREE.Group>(null)
  const target = useMemo(() => new THREE.Object3D(), [])
  const walkPhase = useRef(0)

  useFrame(({ clock }, dt) => {
    const s = useWorld.getState()
    const st = STAGES[stage]
    const loop = currentLoop(s)
    const t = clock.elapsedTime
    let z = st.start
    let walking = false
    if (s.phase === 'anticipation' && loop) {
      const p = 1 - s.timeLeft / loop.duration
      z = THREE.MathUtils.lerp(st.start, st.end, Math.min(1, p * 1.05))
      walking = p < 0.95
    } else if (s.phase !== 'calm' && s.phase !== 'expectation') z = st.end

    if (g.current) {
      const prevZ = g.current.position.z
      g.current.position.z += (z - prevZ) * 0.08
      const speed = Math.abs(g.current.position.z - prevZ) / Math.max(dt, 1e-3)
      walking = walking && speed > 0.05
      walkPhase.current += dt * (walking ? 7.5 : 0)
      const ph = walkPhase.current
      const swing = walking ? 0.55 : 0
      if (hipL.current) hipL.current.rotation.x = Math.sin(ph) * swing
      if (hipR.current) hipR.current.rotation.x = -Math.sin(ph) * swing
      if (shL.current) shL.current.rotation.x = -Math.sin(ph) * swing * 0.7
      if (shR.current) shR.current.rotation.x = Math.sin(ph) * swing * 0.7
      g.current.position.y = walking ? Math.abs(Math.sin(ph)) * 0.035 : 0
      g.current.position.x = Math.sin(t * 0.8) * 0.05
      if (torso.current) torso.current.rotation.y = walking ? Math.sin(ph) * 0.08 : Math.sin(t * 0.5) * 0.02
    }
    target.position.set(Math.sin(t * 0.9) * 0.5, 1.0 + Math.sin(t * 1.3) * 0.1, (g.current?.position.z ?? 0) - 6)
    if (lamp.current) lamp.current.intensity = s.locked ? 60 + Math.sin(t * 30) * 30 : 110
    if (cone.current) (cone.current.material as THREE.MeshBasicMaterial).opacity = s.locked ? 0.006 + Math.sin(t * 30) * 0.004 : 0.012
    if (shieldRef.current && g.current) shieldRef.current.position.set(g.current.position.x, 1.1, g.current.position.z - 0.3)
    focusPoint.set(g.current?.position.x ?? 0, 1.2, g.current?.position.z ?? 0)
  })

  const skin = '#c9b79c'
  const cloth = '#2a3340'
  const gear = '#1c1a18'
  return (
    <>
      <group ref={g} position={[0, 0, STAGES[stage].start]}>
        <group ref={hipL} position={[-0.11, 0.86, 0]}>
          <mesh position={[0, -0.43, 0]} castShadow><capsuleGeometry args={[0.08, 0.7, 4, 10]} /><meshStandardMaterial color={gear} roughness={0.9} /></mesh>
          <mesh position={[0, -0.84, 0.05]} castShadow><boxGeometry args={[0.14, 0.08, 0.26]} /><meshStandardMaterial color="#0f0e0d" roughness={0.8} /></mesh>
        </group>
        <group ref={hipR} position={[0.11, 0.86, 0]}>
          <mesh position={[0, -0.43, 0]} castShadow><capsuleGeometry args={[0.08, 0.7, 4, 10]} /><meshStandardMaterial color={gear} roughness={0.9} /></mesh>
          <mesh position={[0, -0.84, 0.05]} castShadow><boxGeometry args={[0.14, 0.08, 0.26]} /><meshStandardMaterial color="#0f0e0d" roughness={0.8} /></mesh>
        </group>
        <group ref={torso}>
          <mesh position={[0, 1.18, 0]} castShadow><capsuleGeometry args={[0.19, 0.42, 6, 12]} /><meshStandardMaterial color={cloth} roughness={0.85} /></mesh>
          <mesh position={[0, 1.15, -0.16]} castShadow><boxGeometry args={[0.32, 0.42, 0.16]} /><meshStandardMaterial color={gear} roughness={0.9} /></mesh>
          <group ref={shL} position={[-0.27, 1.42, 0]}>
            <mesh position={[0, -0.3, 0]} castShadow><capsuleGeometry args={[0.06, 0.5, 4, 10]} /><meshStandardMaterial color={cloth} roughness={0.85} /></mesh>
            <mesh position={[0, -0.6, 0]}><sphereGeometry args={[0.06, 10, 10]} /><meshStandardMaterial color={skin} roughness={0.9} /></mesh>
          </group>
          <group ref={shR} position={[0.27, 1.42, 0]}>
            <mesh position={[0, -0.3, 0]} castShadow><capsuleGeometry args={[0.06, 0.5, 4, 10]} /><meshStandardMaterial color={cloth} roughness={0.85} /></mesh>
            <mesh position={[0, -0.6, 0]}><sphereGeometry args={[0.06, 10, 10]} /><meshStandardMaterial color={skin} roughness={0.9} /></mesh>
          </group>
          <mesh position={[0, 1.66, 0]} castShadow><sphereGeometry args={[0.14, 20, 20]} /><meshStandardMaterial color={skin} roughness={0.85} /></mesh>
          <mesh position={[0, 1.7, 0]}><torusGeometry args={[0.14, 0.015, 8, 24]} /><meshStandardMaterial color="#111" roughness={0.6} /></mesh>
          <mesh position={[0, 1.7, 0.13]} rotation-x={Math.PI / 2}><cylinderGeometry args={[0.035, 0.035, 0.05, 12]} /><meshStandardMaterial color="#222" metalness={0.7} roughness={0.4} /></mesh>
          <mesh position={[0, 1.7, 0.16]}><circleGeometry args={[0.025, 12]} /><meshStandardMaterial color="#fff" emissive="#fff6d8" emissiveIntensity={1.6} /></mesh>
          <spotLight ref={lamp} position={[0, 1.7, 0.2]} target={target} angle={0.48} penumbra={0.7} intensity={110} distance={16} decay={1.3} color="#ffe2b8" castShadow shadow-mapSize={[1024, 1024]} shadow-bias={-0.0015} />
          <mesh ref={cone} position={[0, 1.5, -3.9]} rotation-x={Math.PI / 2}>
            <coneGeometry args={[1.1, 6, 24, 1, true]} />
            <meshBasicMaterial color="#ffe2b8" transparent opacity={0.012} side={THREE.BackSide} depthWrite={false} blending={THREE.AdditiveBlending} />
          </mesh>
        </group>
      </group>
      <primitive object={target} />
      <mesh ref={shieldRef}>
        <ringGeometry args={[0.85, 1, 48]} />
        <meshBasicMaterial color="#8fa284" transparent opacity={0} side={THREE.DoubleSide} />
      </mesh>
    </>
  )
}

function Dust() {
  const ref = useRef<THREE.Points>(null)
  const positions = useMemo(() => {
    const n = 700
    const a = new Float32Array(n * 3)
    for (let i = 0; i < n; i++) {
      a[i * 3] = (Math.random() - 0.5) * WALL_X * 2
      a[i * 3 + 1] = Math.random() * 3
      a[i * 3 + 2] = 3 - Math.random() * 22
    }
    return a
  }, [])
  useFrame((_, dt) => {
    if (!ref.current) return
    const p = ref.current.geometry.attributes.position as THREE.BufferAttribute
    for (let i = 0; i < p.count; i++) {
      let y = p.getY(i) - dt * 0.06
      if (y < 0) y = 3
      p.setY(i, y)
      p.setX(i, p.getX(i) + Math.sin(i + y * 3) * dt * 0.01)
    }
    p.needsUpdate = true
  })
  return (
    <points ref={ref}>
      <bufferGeometry><bufferAttribute attach="attributes-position" args={[positions, 3]} /></bufferGeometry>
      <pointsMaterial size={0.014} color="#efe7d7" transparent opacity={0.3} sizeAttenuation />
    </points>
  )
}

function CameraRig({ stage, beat }: { stage: StageKey; beat: React.RefObject<Beat> }) {
  const { camera } = useThree()
  const look = useMemo(() => new THREE.Vector3(), [])
  useEffect(() => {
    const c = camera as THREE.PerspectiveCamera
    c.fov = 58
    c.near = 0.1
    c.far = 60
    c.updateProjectionMatrix()
  }, [camera])
  useFrame(({ clock }) => {
    const s = useWorld.getState()
    const st = STAGES[stage]
    const loop = currentLoop(s)
    const b = beat.current!
    const t = clock.elapsedTime
    let creatorZ = st.start
    if (s.phase === 'anticipation' && loop) creatorZ = THREE.MathUtils.lerp(st.start, st.end, Math.min(1, (1 - s.timeLeft / loop.duration) * 1.05))
    else if (s.phase !== 'calm' && s.phase !== 'expectation') creatorZ = st.end

    const back = THREE.MathUtils.lerp(3.9, 1.9, b.push)
    const tx = 0.85 + Math.sin(t * 0.6) * 0.06 + b.push * 0.45
    const ty = 1.95 + Math.sin(t * 1.1) * 0.03 - b.push * 0.15
    const tz = creatorZ + back
    const shake = b.shake * (s.reducedMotion ? 0 : 1)
    camera.position.x += (tx - camera.position.x) * 0.06 + (Math.random() - 0.5) * shake * 0.12
    camera.position.y += (ty - camera.position.y) * 0.06 + (Math.random() - 0.5) * shake * 0.12
    camera.position.z += (tz - camera.position.z) * 0.06
    look.set(-0.2 + Math.sin(t * 0.4) * 0.12 - b.push * 0.35, 1.15 - b.push * 0.05, creatorZ - 5 - b.push * 3)
    camera.lookAt(look)
    camera.rotation.z = Math.sin(t * 0.7) * 0.004 + (Math.random() - 0.5) * shake * 0.03
  })
  return null
}

function Effects({ beat, glitch }: { beat: React.RefObject<Beat>; glitch: boolean }) {
  const ca = useRef<ChromaticAberrationEffect>(null)
  const dof = useRef<DepthOfFieldEffect>(null)
  useFrame(() => {
    const a = beat.current!.aberration
    if (ca.current) ca.current.offset.set(a, a * 0.6)
    if (dof.current) dof.current.target = focusPoint
  })
  const delay = useMemo(() => new THREE.Vector2(0.1, 0.4), [])
  const duration = useMemo(() => new THREE.Vector2(0.08, 0.25), [])
  const strength = useMemo(() => new THREE.Vector2(0.25, 0.6), [])
  const offset = useMemo(() => new THREE.Vector2(0.0006, 0.0004), [])
  return (
    <EffectComposer multisampling={0} mergeMode="none">
      <SMAA />
      <DepthOfField ref={dof} target={focusPoint} focalLength={0.018} bokehScale={1.4} height={480} />
      <EffectGroup>
        <Bloom intensity={0.7} luminanceThreshold={0.6} luminanceSmoothing={0.35} mipmapBlur />
        <ToneMapping mode={ToneMappingMode.ACES_FILMIC} />
        <ChromaticAberration ref={ca} offset={offset} radialModulation modulationOffset={0.35} />
        <Noise premultiply blendFunction={BlendFunction.SOFT_LIGHT} opacity={0.2} />
        <Vignette eskil={false} offset={0.18} darkness={0.95} />
      </EffectGroup>
      <Glitch active={glitch} delay={delay} duration={duration} strength={strength} mode={GlitchMode.SPORADIC} ratio={0.8} />
    </EffectComposer>
  )
}
