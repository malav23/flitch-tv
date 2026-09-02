import { useEffect, useRef } from 'react'
import gsap from 'gsap'
import { useWorld } from '../store/world'

/** A set switching on: a line, then the picture. */
export function Boot() {
  const root = useRef<HTMLDivElement>(null)
  const finish = useWorld((s) => s.finishBoot)
  const reduced = useWorld((s) => s.reducedMotion)

  useEffect(() => {
    if (reduced) { const t = setTimeout(finish, 500); return () => clearTimeout(t) }
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ onComplete: finish })
      tl.to('.boot-line', { scaleX: 1, duration: 0.35, ease: 'power4.out' }, 0.2)
        .to('.boot-line', { scaleY: 40, opacity: 0, duration: 0.35, ease: 'power2.in' }, '+=0.15')
        .fromTo('.boot-mark', { opacity: 0 }, { opacity: 1, duration: 0.4 }, '-=0.1')
        .to({}, { duration: 1.0 })
        .to(root.current, { opacity: 0, duration: 0.3 })
    }, root)
    return () => ctx.revert()
  }, [finish, reduced])

  return (
    <div className="boot" ref={root} aria-label="Starting LiveWorld">
      <div className="boot-line" />
      <div className="boot-mark">
        <div className="word">LiveWorld</div>
        <p>A film you can interrupt.</p>
      </div>
      <button className="boot-skip" onClick={finish}>[ skip ]</button>
    </div>
  )
}
