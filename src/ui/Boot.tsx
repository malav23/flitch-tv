import { useEffect, useRef } from 'react'
import gsap from 'gsap'
import { useWorld } from '../store/world'

/** Studio ident. Black, a wordmark, a line of italic. Then the picture. */
export function Boot() {
  const root = useRef<HTMLDivElement>(null)
  const finish = useWorld((s) => s.finishBoot)
  const reduced = useWorld((s) => s.reducedMotion)

  useEffect(() => {
    if (reduced) { const t = setTimeout(finish, 600); return () => clearTimeout(t) }
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ onComplete: finish })
      tl.fromTo('.word', { opacity: 0, letterSpacing: '0.6em', filter: 'blur(6px)' }, { opacity: 1, letterSpacing: '0.34em', filter: 'blur(0px)', duration: 1.4, ease: 'power2.out' }, 0.3)
        .fromTo('.presents', { opacity: 0 }, { opacity: 1, duration: 0.8 }, '-=0.6')
        .fromTo('.film', { opacity: 0, y: 8 }, { opacity: 1, y: 0, duration: 0.9, ease: 'power2.out' }, '+=0.2')
        .to({}, { duration: 1.2 })
        .to(root.current, { opacity: 0, duration: 0.8, ease: 'power2.inOut' })
    }, root)
    return () => ctx.revert()
  }, [finish, reduced])

  return (
    <div className="boot" ref={root} aria-label="Starting LiveWorld">
      <div className="boot-mark">
        <div className="word">LiveWorld</div>
        <div className="presents eyebrow">presents</div>
        <p className="film">A film you can interrupt.</p>
      </div>
      <button className="boot-skip eyebrow" onClick={finish}>Skip · Enter</button>
    </div>
  )
}
