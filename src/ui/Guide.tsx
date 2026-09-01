import { useEffect, useRef } from 'react'
import gsap from 'gsap'
import { useWorld } from '../store/world'
import { TopBar, Hints } from './Chrome'

const RADIUS = 520

/** Posters on a ring. Turn it like a channel knob; the front poster is tonight's picture. */
export function Guide() {
  const worlds = useWorld((s) => s.worlds)
  const index = useWorld((s) => s.guideIndex)
  const enterWorld = useWorld((s) => s.enterWorld)
  const moveGuide = useWorld((s) => s.moveGuide)
  const openStudio = useWorld((s) => s.openStudio)
  const reduced = useWorld((s) => s.reducedMotion)
  const ring = useRef<HTMLDivElement>(null)
  const root = useRef<HTMLDivElement>(null)
  const logline = useRef<HTMLDivElement>(null)
  const step = 360 / worlds.length
  const front = worlds[index]

  useEffect(() => {
    if (!ring.current) return
    gsap.to(ring.current, { z: -RADIUS, rotateY: -index * step, duration: reduced ? 0 : 1.1, ease: 'power3.out', overwrite: true })
    if (logline.current && !reduced) {
      gsap.fromTo(logline.current, { opacity: 0, y: 10 }, { opacity: 1, y: 0, duration: 0.7, ease: 'power2.out', delay: 0.25 })
    }
  }, [index, step, reduced])

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo('.guide-title', { opacity: 0, y: 16 }, { opacity: 1, y: 0, duration: 1, ease: 'power3.out' })
      gsap.fromTo('.poster', { opacity: 0 }, { opacity: 1, duration: 1, stagger: 0.07, ease: 'power2.out', delay: 0.2 })
    }, root)
    return () => ctx.revert()
  }, [])

  return (
    <div className="guide" ref={root}>
      <TopBar />
      <div className="guide-title">
        <div className="eyebrow">Now showing · {worlds.length} unresolved situations</div>
        <h1>What’s happening<br />right now?</h1>
      </div>

      <div className="dial" aria-roledescription="carousel">
        <div className="ring" ref={ring} style={{ transform: `translateZ(${-RADIUS}px) rotateY(${-index * step}deg)` }}>
          {worlds.map((w, i) => {
            const isFront = i === index
            const dist = Math.min((i - index + worlds.length) % worlds.length, (index - i + worlds.length) % worlds.length)
            return (
              <button
                key={w.id}
                className="poster"
                data-front={isFront}
                style={{
                  transform: `rotateY(${i * step}deg) translateZ(${RADIUS}px)`,
                  ['--paper' as string]: w.poster,
                  opacity: isFront ? 1 : Math.max(0.25, 0.7 - dist * 0.18),
                  filter: isFront ? 'none' : 'saturate(0.6) brightness(0.7)',
                }}
                onClick={() => (isFront ? enterWorld(w.id) : moveGuide(((i - index + worlds.length) % worlds.length) <= worlds.length / 2 ? 1 : -1))}
                aria-label={`${w.name}: ${w.situation}`}
                tabIndex={isFront ? 0 : -1}
              >
                <div className="p-top">
                  <span className="eyebrow">{w.mood}</span>
                  <span className="eyebrow">Day {w.day}</span>
                </div>
                <h3>{w.name}</h3>
                <p className="tagline">{w.tagline}</p>
                <div className="p-credits">
                  <span className="eyebrow">A <b>LiveWorld</b> production · with <b>{w.creator}</b></span>
                  <span className="eyebrow"><b>{w.viewers.toLocaleString()}</b> watching · threat <b>{Math.round(w.threat * 100)}%</b></span>
                </div>
              </button>
            )
          })}
        </div>
      </div>

      {front && (
        <div className="logline" ref={logline} key={front.id}>
          <p>{front.situation}</p>
          <div className="meta">
            <span className="eyebrow timing">{front.timing}</span>
            <button className="enter" onClick={() => enterWorld(front.id)}>Enter <kbd>↵</kbd></button>
          </div>
        </div>
      )}

      <div className="dial-nav" aria-hidden>
        {worlds.map((w, i) => <i key={w.id} data-on={i === index} />)}
      </div>

      <Hints
        items={[['← →', 'Turn'], ['Enter', 'Enter the world'], ['C', 'Creator studio'], ['P', 'Your record'], ['?', 'Help']]}
        extra={<button onClick={openStudio}>Create a live experience →</button>}
      />
    </div>
  )
}
