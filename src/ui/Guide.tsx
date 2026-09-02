import { useEffect, useRef } from 'react'
import gsap from 'gsap'
import { useWorld } from '../store/world'

/** Caption inside the frame while browsing the sets. */
export function GuideOverlay() {
  const worlds = useWorld((s) => s.worlds)
  const index = useWorld((s) => s.guideIndex)
  const enterWorld = useWorld((s) => s.enterWorld)
  const moveGuide = useWorld((s) => s.moveGuide)
  const ref = useRef<HTMLDivElement>(null)
  const w = worlds[index]

  useEffect(() => {
    if (ref.current) gsap.fromTo(ref.current, { opacity: 0, y: 6 }, { opacity: 1, y: 0, duration: 0.5, ease: 'power2.out', delay: 0.15 })
  }, [index])

  if (!w) return null
  return (
    <>
      <span className="corner tl">{`CH ${String(index + 1).padStart(2, '0')} / ${String(worlds.length).padStart(2, '0')}`}</span>
      <span className="corner tr"><span className="hot">●</span> live · {w.viewers.toLocaleString()}</span>
      <div className="caption" ref={ref} key={w.id}>
        <span className="label">{w.mood} · day {w.day} · with {w.creator}</span>
        <h2>{w.situation}</h2>
        <div className="row">
          <span><b>{w.timing}</b></span>
          <span>threat {Math.round(w.threat * 100)}%</span>
          <button className="enter" onClick={() => enterWorld(w.id)}>Enter <kbd>↵</kbd></button>
        </div>
      </div>
      <button className="corner br" style={{ pointerEvents: 'auto' }} onClick={() => moveGuide(1)} aria-label="Next channel">
        <span className="faint">‹</span> turn <span className="faint">›</span>
      </button>
    </>
  )
}
