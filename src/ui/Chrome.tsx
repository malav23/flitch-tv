import { useEffect, useRef, useState } from 'react'
import gsap from 'gsap'
import { useWorld, currentWorld, currentLoop, rankFor } from '../store/world'
import type { ChatMsg } from '../store/world'
import { net } from '../engine/net'

export function fmt(sec: number) {
  const s = Math.max(0, Math.ceil(sec))
  return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`
}

const ch = (i: number) => `CH ${String(i + 1).padStart(2, '0')}`

export function TopBar() {
  const s = useWorld()
  const world = currentWorld(s)
  const idx = world ? s.worlds.findIndex((w) => w.id === world.id) : s.guideIndex
  const mid =
    s.screen === 'world' && world
      ? `${ch(idx)} · ${world.name} · Day ${s.episode}`
      : s.screen === 'studio'
        ? 'Creator studio'
        : `Channel guide · ${s.worlds.length} signals`
  return (
    <header className="bar top">
      <button className="wordmark" onClick={() => (s.screen === 'guide' ? undefined : s.openGuide())}>LiveWorld</button>
      <span className="mid">{mid}</span>
      <span className="wins">
        <button title={s.muted ? 'Unmute' : 'Mute'} onClick={s.toggleMute}>{s.muted ? '_' : '~'}</button>
        <button title="Your record" onClick={() => s.togglePanel('profile')}>□</button>
        <button title="Back" onClick={() => (s.screen === 'world' ? s.leaveWorld() : s.screen === 'studio' ? s.openGuide() : s.togglePanel('help'))}>×</button>
      </span>
    </header>
  )
}

export function BottomBar() {
  const s = useWorld()
  const hints =
    s.screen === 'world'
      ? '1-3 predict · R reinforce · K clue · ↵ interrupt · P record · ⌫ back'
      : s.screen === 'guide'
        ? '← → turn · ↵ enter · C create · P record · ? help'
        : 'Esc back'
  return (
    <footer className="bar bottom">
      <span>{'{$}'} {s.viewer.influence.toLocaleString()} · XP {s.viewer.xp.toLocaleString()}</span>
      <span className="mid faint">{hints}</span>
      <span>{s.screen === 'world' ? `[ - ${s.online ? `${s.online} here · ` : ''}${s.viewers.toLocaleString()} watching - ]` : s.connected ? `[ - ${s.online} in the lobby - ]` : '[ - liveworld - ]'}</span>
    </footer>
  )
}

/** Left column: channels in the guide, the three time horizons in a world. */
export function LeftCol() {
  const s = useWorld()
  const world = currentWorld(s)
  const loop = currentLoop(s)
  if (s.screen === 'world' && world && loop) {
    const next = world.loops[(s.loopIndex + 1) % world.loops.length]
    return (
      <aside className="col left">
        <div className="card" data-on="true">
          <span className="k">Now{s.phase === 'anticipation' ? ` · ${fmt(s.timeLeft)}` : ''}</span>
          <span className="v">{loop.question}</span>
        </div>
        <div className="card">
          <span className="k">Soon · {Math.max(1, Math.round(s.timeLeft / 60 + 3))} min</span>
          <span className="v">{next.question}</span>
        </div>
        <div className="card">
          <span className="k">Later · tomorrow 8:00 PM</span>
          <span className="v">The season finale. One viewer decides who is saved.</span>
        </div>
        <div className="card">
          <span className="k">Generated moments</span>
          <span className="v" style={{ color: 'var(--ink-2)' }}>
            {s.generation === 'idle' && 'Nothing queued.'}
            {s.generation === 'queued' && 'Branch queued.'}
            {s.generation === 'rendering' && 'Rendering likely branches.'}
            {s.generation === 'ready' && 'Ready.'}
          </span>
        </div>
      </aside>
    )
  }
  return (
    <aside className="col left">
      <span className="k dim" style={{ fontSize: 10.5 }}>Channels</span>
      <div className="list">
        {s.worlds.map((w, i) => (
          <button key={w.id} className="chn" data-on={i === s.guideIndex} onClick={() => (i === s.guideIndex ? s.enterWorld(w.id) : s.moveGuide(i - s.guideIndex))}>
            <span className="n">{ch(i)}</span>
            <span className="t">{w.name}</span>
          </button>
        ))}
      </div>
    </aside>
  )
}

/** Right column: the record in the guide, the room's chat in a world. */
export function RightCol() {
  const s = useWorld()
  if (s.screen === 'world') return <ChatCol />
  const v = s.viewer
  const acc = v.total ? Math.round((v.correct / v.total) * 100) : 0
  return (
    <aside className="col right">
      <div className="card">
        <span className="k">Your record</span>
        <span className="v">{rankFor(v)}</span>
        <span className="k">Accuracy {acc}% · contrarian {v.contrarianWins}</span>
        <span className="k">Titles {v.titles.length ? v.titles.join(', ') : 'none yet'}</span>
      </div>
      <div className="card">
        <span className="k">How this works</span>
        <span className="v dim">Predict what happens next. Spend influence to change it. Reality bends; the world remembers who did it.</span>
      </div>
    </aside>
  )
}

function ChatCol() {
  const chat = useWorld((s) => s.chat)
  const online = useWorld((s) => s.online)
  const connected = useWorld((s) => s.connected)
  const [text, setText] = useState('')
  const say = (t: string) => net.say(t)
  return (
    <aside className="col right">
      <div className="chatcol">
        <span className="k online" data-on={connected}><i />Room · {connected ? `${online} here` : 'offline · simulated'}</span>
        <div className="chatlog">
          {chat.slice(-30).map((m) => <Msg key={m.id} m={m} />)}
        </div>
        <form
          className="say"
          onSubmit={(e) => { e.preventDefault(); say(text); setText('') }}
        >
          <input value={text} onChange={(e) => setText(e.target.value)} placeholder="What do you want to happen next…" aria-label="Say something" />
          <button type="submit">Say</button>
        </form>
      </div>
    </aside>
  )
}

function Msg({ m }: { m: ChatMsg }) {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (ref.current) gsap.fromTo(ref.current, { opacity: 0 }, { opacity: 1, duration: 0.25 })
  }, [])
  return (
    <div className="msg" ref={ref} data-tone={m.tone}>
      <span className="name">{m.name}</span>{m.text}
    </div>
  )
}

/** Horizontal RGB slices that flash across the screen on transitions. */
export function GlitchSlices() {
  const tick = useWorld((s) => s.glitchTick)
  const reduced = useWorld((s) => s.reducedMotion)
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (!ref.current || tick === 0 || reduced) return
    const el = ref.current
    const bars = Array.from(el.children) as HTMLElement[]
    const colors = ['var(--cyan)', 'var(--magenta)', 'var(--yellow)', '#fff', 'var(--cyan)', 'var(--magenta)']
    const scatter = () => {
      bars.forEach((b) => {
        b.style.top = `${Math.random() * 100}%`
        b.style.height = `${1 + Math.random() * 4}px`
        b.style.background = colors[Math.floor(Math.random() * colors.length)]
        b.style.opacity = String(0.3 + Math.random() * 0.7)
        b.style.transform = `translateX(${(Math.random() - 0.5) * 12}px) scaleX(${0.6 + Math.random() * 0.4})`
      })
    }
    scatter()
    const tl = gsap.timeline()
    tl.set(el, { opacity: 1 })
    for (let i = 0; i < 4; i++) tl.call(scatter, [], i * 0.09)
    tl.to(el, { opacity: 0, duration: 0.15 }, 0.36)
    return () => { tl.kill() }
  }, [tick, reduced])
  return (
    <div className="glitch" ref={ref} aria-hidden>
      {Array.from({ length: 16 }, (_, i) => <i key={i} />)}
    </div>
  )
}
