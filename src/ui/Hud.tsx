import { useEffect, useRef } from 'react'
import gsap from 'gsap'
import { useWorld, currentLoop, currentWorld } from '../store/world'
import type { ChatMsg } from '../store/world'
import { TopBar, fmt } from './Chrome'

export function Hud() {
  const phase = useWorld((s) => s.phase)
  const dim = phase === 'attribution' || phase === 'reward' || phase === 'calm'
  return (
    <div className="hud" data-phase={phase}>
      <div className="bars" aria-hidden />
      <div className="dimmer" data-on={dim} aria-hidden />
      <TopBar />
      <Flash />
      <ChaosLine />
      {(phase === 'expectation' || phase === 'anticipation') && <Subtitle />}
      {phase === 'anticipation' && <BigCount />}
      <InterruptLayer />
      {phase === 'reveal' && <Reveal />}
      {phase === 'attribution' && <Attribution />}
      {phase === 'reward' && <Reward />}
      {phase === 'calm' && <NextHook />}
      <Chat />
      <Toasts />
    </div>
  )
}

// ---------------------------------------------------------------- subtitle block

function Subtitle() {
  const s = useWorld()
  const loop = currentLoop(s)!
  const root = useRef<HTMLDivElement>(null)
  const prev = useRef<Record<string, number>>({})

  useEffect(() => {
    if (!root.current) return
    gsap.fromTo(root.current, { y: 18, opacity: 0 }, { y: 0, opacity: 1, duration: 0.9, ease: 'power3.out' })
  }, [])

  const canPredict = !s.prediction
  const hot = s.phase === 'anticipation' && s.timeLeft < 10
  const winner = Object.entries(s.odds).sort((a, b) => b[1] - a[1])[0]?.[0]

  return (
    <section className="subtitle" ref={root} aria-live="polite">
      <div className="sub-head">
        <div className="status">
          {s.phase === 'expectation' ? (
            <span className="eyebrow">Predictions open</span>
          ) : s.locked ? (
            <span className="eyebrow curse">{s.locked.interrupt.omen}</span>
          ) : (
            <span className="eyebrow warn">Reveal in</span>
          )}
          <h2 className="question">{loop.question}</h2>
        </div>
        {s.phase === 'expectation' ? <span className="countdown open">Open</span> : <span className="countdown" data-hot={hot}>{fmt(s.timeLeft)}</span>}
      </div>

      <div className="odds" role="group" aria-label="Predictions">
        {loop.options.map((o, i) => {
          const p = s.odds[o.id] ?? 0
          const pct = Math.round(p * 100)
          const last = prev.current[o.id] ?? pct
          prev.current[o.id] = pct
          const dir = pct > last ? 'up' : pct < last ? 'down' : null
          return (
            <button key={o.id} className="odd" data-mine={s.prediction === o.id} disabled={!canPredict} onClick={() => s.predict(o.id)} aria-pressed={s.prediction === o.id}>
              <kbd>{i + 1}</kbd>
              <span className="label">{o.label}{o.id === winner && <small>crowd</small>}</span>
              <span className="pct">{pct}%{dir && <span className="delta" data-dir={dir}>{dir === 'up' ? '▲' : '▼'}</span>}</span>
              <span className="track"><i style={{ width: `${pct}%` }} /></span>
            </button>
          )
        })}
      </div>

      <div className="sub-foot">
        <div className="left">
          <span className="eyebrow">{s.predictions.toLocaleString()} predictions</span>
          {s.phase === 'anticipation' && s.interruptWindow === 0 && !s.locked && <span className="eyebrow warn">An interrupt is possible</span>}
          {s.locked && <span className="eyebrow curse">Interrupt locked · @{s.locked.actor}</span>}
          <span className="eyebrow">Chaos <b style={{ color: 'var(--oxblood)' }}>{Math.round(s.chaos * 100)}%</b></span>
        </div>
        <div className="actions">
          {s.prediction ? (
            <button className="act" onClick={s.reinforce} disabled={s.reinforced || s.phase !== 'anticipation' || s.viewer.influence < 400}>
              <kbd>R</kbd> Reinforce <small>−400</small>
            </button>
          ) : (
            <span className="act" style={{ opacity: 0.55, cursor: 'default' }}>Pick an outcome <small>1–3</small></span>
          )}
          <button className="act" onClick={s.buyClue} disabled={s.clueBought || s.viewer.influence < 600}>
            <kbd>K</kbd> {s.clueBought ? 'Clue bought' : 'Clue'} <small>−600</small>
          </button>
          <span className="eyebrow">Influence <b style={{ color: 'var(--cream)' }}>{s.viewer.influence.toLocaleString()}</b></span>
        </div>
      </div>
    </section>
  )
}

function ChaosLine() {
  const chaos = useWorld((s) => s.chaos)
  return <div className="chaos-line" title="Audience chaos. High chaos opens rare interrupts."><i style={{ width: `${Math.round(chaos * 100)}%` }} /></div>
}

function BigCount() {
  const t = useWorld((s) => s.timeLeft)
  const curse = useWorld((s) => !!s.locked)
  const n = Math.ceil(t)
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (ref.current) gsap.fromTo(ref.current, { scale: 1.08, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.4, ease: 'power3.out' })
  }, [n])
  if (t > 5.5 || t <= 0) return null
  return <div className="bigcount" ref={ref} data-curse={curse} aria-hidden>{n}</div>
}

// ---------------------------------------------------------------- interrupt

function InterruptLayer() {
  const it = useWorld((s) => s.interruptAvailable)
  const win = useWorld((s) => s.interruptWindow)
  const locked = useWorld((s) => s.locked)
  const phase = useWorld((s) => s.phase)
  const influence = useWorld((s) => s.viewer.influence)
  const activate = useWorld((s) => s.activateInterrupt)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (ref.current) gsap.fromTo(ref.current, { x: 30, opacity: 0 }, { x: 0, opacity: 1, duration: 0.6, ease: 'power3.out' })
  }, [it?.id, locked?.interrupt.id])

  if (phase !== 'anticipation') return null

  if (locked) {
    return (
      <aside className="locked" ref={ref} role="status">
        <div className="eyebrow">Interrupt locked</div>
        <h3>{locked.interrupt.name}</h3>
        <p>Triggered by <b style={{ color: 'var(--cream)', fontWeight: 500 }}>@{locked.actor}</b></p>
        <p className="omen">Something has changed.</p>
      </aside>
    )
  }
  if (!it) return null
  const kindLabel = { chaos: 'Rare interrupt', sabotage: 'Sabotage', protect: 'Protect', modify: 'Modify' }[it.kind]
  return (
    <aside className="interrupt" ref={ref} role="dialog" aria-label={`${kindLabel}: ${it.name}`}>
      <div className="head"><span className="eyebrow">{kindLabel}</span><span className="mono" style={{ fontSize: 12, color: 'var(--cream-dim)' }}>{Math.max(0, win).toFixed(1)}s</span></div>
      <h3>{it.name}</h3>
      <dl>
        <dt>Cost</dt><dd className="mono">{it.cost.toLocaleString()} influence</dd>
        <dt>Outcome</dt><dd>Unknown</dd>
        <dt>Available</dt><dd className="mono">{Math.ceil(Math.max(0, win))} seconds</dd>
      </dl>
      <div className="window"><i style={{ transform: `scaleX(${Math.max(0, win) / 9})`, transition: 'transform 0.1s linear' }} /></div>
      <button className="act primary" onClick={activate} disabled={influence < it.cost}>Activate <small>Enter</small></button>
      {influence < it.cost && <p className="eyebrow" style={{ marginTop: 10 }}>You need {(it.cost - influence).toLocaleString()} more influence</p>}
    </aside>
  )
}

// ---------------------------------------------------------------- reveal & rewards

function Flash() {
  const phase = useWorld((s) => s.phase)
  const outcome = useWorld((s) => s.outcome)
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (phase !== 'reveal' || !ref.current) return
    const violent = ['monster', 'dies', 'wounded', 'vent-creature'].includes(outcome ?? '')
    gsap.fromTo(ref.current, { opacity: 0.9, background: violent ? '#a83a33' : '#efe7d7' }, { opacity: 0, duration: 0.8, ease: 'power2.out' })
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
      gsap.fromTo('h2', { opacity: 0, filter: 'blur(8px)' }, { opacity: 1, filter: 'blur(0px)', duration: 0.9, ease: 'power2.out' })
      gsap.fromTo('.consequence, .rules', { opacity: 0 }, { opacity: 1, duration: 0.6, delay: 0.5 })
    }, ref)
    return () => ctx.revert()
  }, [show])
  return (
    <>
      {s.elapsed > 0.9 && <div className="gen-tag eyebrow" title="This moment was generated, not filmed."><i />Generated scene · H3 Max · 5s · 768p</div>}
      {show && reveal && (
        <div className="intertitle" ref={ref}>
          <div className={`eyebrow ${s.locked ? 'curse' : 'brass'}`}>{s.locked ? 'Interrupt' : 'Outcome'}</div>
          <h2 className="italic">{reveal.headline}</h2>
          <div className="rules"><i /><i /></div>
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
      const tl = gsap.timeline()
      tl.fromTo('.eyebrow', { opacity: 0 }, { opacity: 1, duration: 0.7 })
        .fromTo('h2', { opacity: 0, y: 10 }, { opacity: 1, y: 0, duration: 0.9, ease: 'power2.out' }, '-=0.3')
        .fromTo('.by', { opacity: 0 }, { opacity: 1, duration: 0.7 }, '-=0.2')
    }, ref)
    return () => ctx.revert()
  }, [])
  if (!locked) return null
  return (
    <div className="intertitle" ref={ref}>
      <div className="eyebrow curse">Why that happened</div>
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
      gsap.fromTo('h2', { opacity: 0 }, { opacity: 1, duration: 0.8 })
      gsap.fromTo('.credit', { opacity: 0, y: 6 }, { opacity: 1, y: 0, duration: 0.5, stagger: 0.16, ease: 'power2.out', delay: 0.4 })
    }, ref)
    return () => ctx.revert()
  }, [])
  if (!r) return null
  const reveal = s.outcome ? loop.reveals[s.outcome] : null
  const lines: { k: string; v: string; tone?: string }[] = []
  if (r.predicted) {
    if (r.correct) lines.push({ k: `${r.contrarian ? 'Contrarian call' : 'Correct call'}, “${r.outcomeLabel}” at ${Math.round(r.entryP * 100)}%`, v: `+${r.gain} XP`, tone: r.contrarian ? 'slate' : 'brass' })
    else lines.push({ k: `Wrong call. It was “${r.outcomeLabel}”`, v: '+20 XP', tone: 'dim' })
  } else lines.push({ k: `${s.predictions.toLocaleString()} people predicted. You watched`, v: 'Press 1–3', tone: 'dim' })
  if (r.interruptXp > 0) lines.push({ k: 'You changed what happened', v: `+${r.interruptXp} chaos XP`, tone: 'curse' })
  if (r.newTitle) lines.push({ k: `New title, kept in ${world.name}`, v: r.newTitle, tone: 'brass' })
  if (r.actor && !r.interruptXp) lines.push({ k: 'One viewer did that. You could have', v: `@${r.actor}`, tone: 'curse' })
  return (
    <div className="intertitle" ref={ref}>
      <div className="eyebrow brass">Consequence</div>
      <h2 className="italic" style={{ fontSize: 'clamp(36px, 5vw, 76px)' }}>{reveal?.consequence.split(' · ')[0]}</h2>
      <div className="credits">
        {lines.map((l) => (
          <div className="credit" key={l.k}>
            <span className="k">{l.k}</span>
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
    if (ref.current) gsap.fromTo(ref.current, { opacity: 0 }, { opacity: 1, duration: 1.2, ease: 'power2.out' })
  }, [])
  return (
    <div className="nexthook" ref={ref}>
      <div className="eyebrow">Next · {loop.place}</div>
      <h3>{loop.question}</h3>
    </div>
  )
}

// ---------------------------------------------------------------- chat & toasts

function Chat() {
  const chat = useWorld((s) => s.chat)
  return (
    <aside className="chat" aria-label="Audience">
      {chat.slice(-26).map((m) => <Msg key={m.id} m={m} />)}
    </aside>
  )
}

function Msg({ m }: { m: ChatMsg }) {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (ref.current) gsap.fromTo(ref.current, { opacity: 0, x: 8 }, { opacity: 1, x: 0, duration: 0.3, ease: 'power2.out' })
  }, [])
  return (
    <div className="msg" ref={ref} data-tone={m.tone}>
      <span className="name">{m.name}</span>{m.text}
    </div>
  )
}

function Toasts() {
  const toasts = useWorld((s) => s.toasts)
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
