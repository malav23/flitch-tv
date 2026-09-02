import { Suspense, useEffect } from 'react'
import { Canvas } from '@react-three/fiber'
import { useWorld } from './store/world'
import { startDirector } from './engine/director'
import { audio } from './engine/audio'
import { useRemote } from './hooks/useRemote'
import { GuideScene } from './scenes/GuideScene'
import { WorldScene } from './scenes/WorldScene'
import { Boot } from './ui/Boot'
import { GuideOverlay } from './ui/Guide'
import { Hud } from './ui/Hud'
import { Panel } from './ui/Panel'
import { Studio } from './ui/Studio'
import { TopBar, BottomBar, LeftCol, RightCol, GlitchSlices } from './ui/Chrome'

function useAudioDirector() {
  useEffect(() => {
    let lastPhase = useWorld.getState().phase
    let lastSecond = -1
    return useWorld.subscribe((s) => {
      audio.setTension(s.chaos * 0.6 + (s.phase === 'anticipation' ? 0.4 * (1 - s.timeLeft / 40) : 0), s.screen === 'world')
      if (s.phase !== lastPhase) {
        if (s.phase === 'reveal') audio.impact()
        if (s.phase === 'reward') audio.chime()
        lastPhase = s.phase
      }
      if (s.phase === 'anticipation' && s.timeLeft < 10) {
        const sec = Math.ceil(s.timeLeft)
        if (sec !== lastSecond) { audio.tick(); lastSecond = sec }
      }
    })
  }, [])
}

export default function App() {
  const screen = useWorld((s) => s.screen)
  const panel = useWorld((s) => s.panel)
  useRemote()
  useAudioDirector()
  useEffect(() => startDirector(), [])

  return (
    <>
      <div className="app">
        <TopBar />
        <main className="grid">
          <LeftCol />
          <section className="frame" aria-label="Screen">
            <div className="stage">
              <Canvas shadows dpr={[1, 1.75]} camera={{ fov: 60, near: 0.1, far: 80, position: [0, 1, 5] }} gl={{ antialias: false, powerPreference: 'high-performance' }}>
                <Suspense fallback={null}>{screen === 'world' ? <WorldScene /> : <GuideScene />}</Suspense>
              </Canvas>
            </div>
            {screen === 'guide' && <GuideOverlay />}
            {screen === 'world' && <Hud />}
            <GlitchSlices />
          </section>
          <RightCol />
        </main>
        <BottomBar />
      </div>
      {screen === 'boot' && <Boot />}
      {screen === 'studio' && <Studio />}
      {panel !== 'none' && <Panel />}
    </>
  )
}
