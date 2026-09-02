import { useEffect, useRef } from 'react'
import gsap from 'gsap'
import { useWorld, currentLoop, currentWorld } from '../store/world'
import { fmt } from './Chrome'

/** Everything drawn over the picture while inside a world. Mono captions, nothing else. */
export function Hud() {
  const phase = useWorld((s) => s.phase)
  const dim = phase === 'attribution' || phase === 'reward' || phase === 'calm'
  return (
    <div className="hud" data-phase={phase}>
      <div className="dimmer" data-on={dim} aria-hidden />
      <Flash />
      <ChaosLine />
      {(phase === 'expectation' || phase === 'anticipation') && <Sub />}
      {(phase === 'expectation' || phase === 'anticipation') && <Countdown />}
      {phase === 'anticipation' && <BigCount />}
      <InterruptLayer />
      {phase === 'reveal' && <Reveal />}
      {phase === 'attribution' && <Attribution />}
      {phase === 'reward' && <Reward />}
      {phase === 'calm' && <NextHook />}
      <Toasts />
    </div>
  )
}

function Sub() {
  const s = useWorld()
  const loop = currentLoop(s)!
  const root = useRef<HTMLDivElement>(null)
  const prev = useRef<Record<string, number>>({})
  useEffect(() => {
    if (root.current) gsap.fromTo(root.current, { opacity: 0, y: 8 }, { opacity: 1, y: 0, duration: 0.5, ease: 'power2.out' })
  }, [])
  const canPredict = !s.prediction
  const winner = Object.entries(s.odds).sort((a, b) => b[1] - a[1])[0]?.[0]
  return (
    <section className="sub" ref={root} aria-live="polite">
      <div className="head">
        {s.locked ? (
          <span className="status" data-tone="curse">⚠ {s.locked.interrupt.omen}</span>
        ) : (
          <span className="status">{s.phase === 'expectation' ? 'Predictions open' : 'Predict before the reveal'}</span>
        )}
      </div>
      <h2 className="question">{loop.question}</h2>
      <div className="odds" role="group" aria-label="Predictions">
        {loop.options.map((o, i) => {
          const pct = Math.round((s.odds[o.id] ?? 0) * 100)
          const last = prev.current[o.id] ?? pct
          prev.current[o.id] = pct
          const dir = pct > last ? '▲' : pct < last ? '▼' : ' '
          return (
            <button key={o.id} className="odd" data-mine={s.prediction === o.id} disabled={!canPredict} onClick={() => s.predict(o.id)} aria-pressed={s.prediction === o.id}>
              <span className="n">[{i + 1}]</span>
              <span className="opt">{o.label}{o.id === winner && <small>crowd</small>}</span>
              <span className="track"><i style={{ width: `${pct}%` }} /></span>
              <span className="pct">{pct}%<span className="faint">{dir}</span></span>
            </button>
          )
        })}
      </div>
      <div className="foot">
        <span>{s.predictions.toLocaleString()} predictions</span>
        <span>chaos <span className="hot">{Math.round(s.chaos * 100)}%</span></span>
        {s.phase === 'anticipation' && s.interruptWindow === 0 && !s.locked && <span className="hot">an interrupt is possible</span>}
        {s.locked && <span className="hot">locked · @{s.locked.actor}</span>}
        {s.prediction ? (
          <button onClick={s.reinforce} disabled={s.reinforced || s.phase !== 'anticipation' || s.viewer.influence < 400}>[R] reinforce −400</button>
        ) : (
          <span>[1-3] pick an outcome</span>
        )}
        <button onClick={s.buyClue} disabled={s.clueBought || s.viewer.influence < 600}>[K] {s.clueBought ? 'clue bought' : 'clue −600'}</button>
      </div>
    </section>
  )
}

function Countdown() {
  const phase = useWorld((s) => s.phase)
  const t = useWorld((s) => s.timeLeft)
  const locked = useWorld((s) => !!s.locked)
  return (
    <div className="countdown">
      <span className="k">{phase === 'expectation' ? 'opens' : locked ? 'something has changed' : 'reveal in'}</span>
      <span className="t" data-hot={phase === 'anticipation' && t < 10}>{phase === 'expectation' ? '--:--' : fmt(t)}</span>
    </div>
  )
}

function ChaosLine() {
  const chaos = useWorld((s) => s.chaos)
  return <div className="chaos-line"><i style={{ width: `${Math.round(chaos * 100)}%` }} /></div>
}

function BigCount() {
  const t = useWorld((s) => s.timeLeft)
  const curse = useWorld((s) => !!s.locked)
  const n = Math.ceil(t)
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (ref.current) gsap.fromTo(ref.current, { opacity: 0, scale: 1.06 }, { opacity: 1, scale: 1, duration: 0.3, ease: 'power3.out' })
  }, [n])
  if (t > 5.5 || t <= 0) return null
  return <div className="bigcount" ref={ref} data-curse={curse} aria-hidden>{n}</div>
}

function InterruptLayer() {
  const it = useWorld((s) => s.interruptAvailable)
  const win = useWorld((s) => s.interruptWindow)
  const locked = useWorld((s) => s.locked)
  const phase = useWorld((s) => s.phase)
  const influence = useWorld((s) => s.viewer.influence)
  const activate = useWorld((s) => s.activateInterrupt)
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (ref.current) gsap.fromTo(ref.current, { x: 16, opacity: 0 }, { x: 0, opacity: 1, duration: 0.4, ease: 'power3.out' })
  }, [it?.id, locked?.interrupt.id])
  if (phase !== 'anticipation') return null
  if (locked) {
    return (
      <aside className="locked" ref={ref} role="status">
        <span className="k">Interrupt locked</span>
        <p><b>{locked.interrupt.name}</b> · triggered by <b>@{locked.actor}</b></p>
        <p>Something has changed.</p>
      </aside>
    )
  }
  if (!it) return null
  const kind = { chaos: 'Rare interrupt', sabotage: 'Sabotage', protect: 'Protect', modify: 'Modify' }[it.kind]
  return (
    <aside className="interrupt" ref={ref} role="dialog" aria-label={`${kind}: ${it.name}`}>
      <span className="k"><span>{kind}</span><span>{Math.max(0, win).toFixed(1)}s</span></span>
      <h3>{it.name}</h3>
      <dl>
        <dt>Cost</dt><dd>{it.cost.toLocaleString()} influence</dd>
        <dt>Outcome</dt><dd>Unknown</dd>
        <dt>Window</dt><dd>{Math.ceil(Math.max(0, win))} seconds</dd>
      </dl>
      <div className="window"><i style={{ transform: `scaleX(${Math.max(0, win) / 9})`, transition: 'transform 0.1s linear' }} /></div>
      <button className="act" onClick={activate} disabled={influence < it.cost}>[ ↵ ] activate</button>
      {influence < it.cost && <span className="k" style={{ color: 'var(--ink-3)' }}>needs {(it.cost - influence).toLocaleString()} more</span>}
    </aside>
  )
}

function Flash() {
  const phase = useWorld((s) => s.phase)
  const outcome = useWorld((s) => s.outcome)
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (phase !== 'reveal' || !ref.current) return
    const violent = ['monster', 'dies', 'wounded', 'vent-creature'].includes(outcome ?? '')
    gsap.fromTo(ref.current, { opacity: 0.9, background: violent ? '#ff3b3b' : '#fff' }, { opacity: 0, duration: 0.6, ease: 'power2.out' })
  }, [phase, outcome])
  return <div className="flash" ref={ref} aria-hidden />
}

function Reveal() {
  const s = useWorld()
  const loop = currentLoop(s)!
  const reveal = s.outcome ? loop.reveals[s.outcome] : null
  const ref = useRef<HTMLDivElement>(null)
  const show = s.elapsed > 4.2
  useEffect(() => {
    if (!show || !ref.current) return
    const ctx = gsap.context(() => {
      gsap.fromTo('h2', { opacity: 0 }, { opacity: 1, duration: 0.5 })
      gsap.fromTo('.consequence', { opacity: 0 }, { opacity: 1, duration: 0.5, delay: 0.4 })
    }, ref)
    return () => ctx.revert()
  }, [show])
  return (
    <>
      {s.elapsed > 0.9 && <div className="gen-tag"><i />generated scene · H3 Max · 5s · 768p</div>}
      {show && reveal && (
        <div className="title" ref={ref}>
          <span className={`k ${s.locked ? 'hot' : ''}`}>{s.locked ? 'Interrupt' : 'Outcome'}</span>
          <h2>{reveal.headline}</h2>
          <p className="consequence">{reveal.consequence}</p>
        </div>
      )}
    </>
  )
}

function Attribution() {
  const locked = useWorld((s) => s.locked)
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (!ref.current) return
    const ctx = gsap.context(() => {
      gsap.fromTo('.k', { opacity: 0 }, { opacity: 1, duration: 0.5 })
      gsap.fromTo('h2', { opacity: 0, y: 6 }, { opacity: 1, y: 0, duration: 0.6, delay: 0.2 })
      gsap.fromTo('.by', { opacity: 0 }, { opacity: 1, duration: 0.5, delay: 0.6 })
    }, ref)
    return () => ctx.revert()
  }, [])
  if (!locked) return null
  return (
    <div className="title" ref={ref}>
      <span className="k hot">Why that happened</span>
      <h2>{locked.interrupt.title}</h2>
      <p className="by">triggered by <b>@{locked.actor}</b>{locked.isYou && '. That was you.'}</p>
    </div>
  )
}

function Reward() {
  const s = useWorld()
  const r = s.lastReward
  const world = currentWorld(s)!
  const loop = currentLoop(s)!
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (!ref.current) return
    const ctx = gsap.context(() => {
      gsap.fromTo('h2', { opacity: 0 }, { opacity: 1, duration: 0.5 })
      gsap.fromTo('.credit', { opacity: 0, y: 4 }, { opacity: 1, y: 0, duration: 0.4, stagger: 0.14, delay: 0.3 })
    }, ref)
    return () => ctx.revert()
  }, [])
  if (!r) return null
  const reveal = s.outcome ? loop.reveals[s.outcome] : null
  const lines: { k: string; v: string; tone?: string }[] = []
  if (r.predicted) {
    if (r.correct) lines.push({ k: `${r.contrarian ? 'Contrarian call' : 'Correct call'}, “${r.outcomeLabel}” at ${Math.round(r.entryP * 100)}%`, v: `+${r.gain} XP` })
    else lines.push({ k: `Wrong call. It was “${r.outcomeLabel}”`, v: '+20 XP', tone: 'dim' })
  } else lines.push({ k: `${s.predictions.toLocaleString()} people predicted. You watched`, v: 'press 1-3', tone: 'dim' })
  if (r.interruptXp > 0) lines.push({ k: 'You changed what happened', v: `+${r.interruptXp} chaos XP`, tone: 'hot' })
  if (r.newTitle) lines.push({ k: `New title, kept in ${world.name}`, v: r.newTitle })
  if (r.actor && !r.interruptXp) lines.push({ k: 'One viewer did that. You could have', v: `@${r.actor}`, tone: 'hot' })
  return (
    <div className="title" ref={ref}>
      <span className="k">Consequence</span>
      <h2 style={{ textShadow: 'none' }}>{reveal?.consequence.split(' · ')[0]}</h2>
      <div className="credits">
        {lines.map((l) => (
          <div className="credit" key={l.k}>
            <span className="k2">{l.k}</span>
            <span className="leader" />
            <span className={`v ${l.tone ?? ''}`}>{l.v}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function NextHook() {
  const s = useWorld()
  const world = currentWorld(s)!
  const loop = world.loops[s.loopIndex % world.loops.length]
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (ref.current) gsap.fromTo(ref.current, { opacity: 0 }, { opacity: 1, duration: 0.8 })
  }, [])
  return (
    <div className="nexthook" ref={ref}>
      <span className="k">Next · {loop.place}</span>
      <h3>{loop.question}</h3>
    </div>
  )
}

function Toasts() {
  const toasts = useWorld((s) => s.toasts)
  const phase = useWorld((s) => s.phase)
  if (phase === 'reveal') return null
  return (
    <div className="toasts" role="status">
      {toasts.map((t) => (
        <div key={t.id} className="toast" data-tone={t.tone}>
          <strong>{t.text}</strong>
          {t.sub && <span>{t.sub}</span>}
        </div>
      ))}
    </div>
  )
}
