import type { ReactNode } from 'react'
import { useWorld, currentWorld, currentLoop } from '../store/world'

export function TopBar() {
  const s = useWorld()
  const world = currentWorld(s)
  const loop = currentLoop(s)
  const inWorld = s.screen === 'world' && world && loop
  const nextLoop = world ? world.loops[(s.loopIndex + 1) % world.loops.length] : null

  return (
    <header className="topbar">
      <button className="wordmark" onClick={() => (s.screen === 'world' ? s.leaveWorld() : s.openGuide())} aria-label="LiveWorld home">
        LiveWorld
      </button>

      <div className="credits-line">
        {inWorld ? (
          <>
            <div className="title">{world.name}</div>
            <div className="sub eyebrow">Day {s.episode} · {loop.place} · with <b>{world.creator}</b></div>
            <div className="horizons" aria-label="Three time horizons">
              <span className="horizon"><span className="eyebrow now">Now</span><p>{loop.question}</p></span>
              <span className="horizon"><span className="eyebrow soon">Soon</span><p>{nextLoop?.question} · {Math.max(1, Math.round(s.timeLeft / 60 + 3))} min</p></span>
              <span className="horizon"><span className="eyebrow">Later</span><p>The season finale · tomorrow 8:00 PM</p></span>
            </div>
          </>
        ) : (
          <div className="sub eyebrow">Programmable live entertainment</div>
        )}
      </div>

      <div className="right">
        {inWorld ? (
          <>
            <span className="live eyebrow"><i />Live · {s.viewers.toLocaleString()}</span>
            <span className="timecode"><Timecode /></span>
          </>
        ) : (
          <>
            <span className="eyebrow">Influence <b style={{ color: 'var(--cream)' }}>{s.viewer.influence.toLocaleString()}</b></span>
            <span className="eyebrow">XP <b style={{ color: 'var(--cream)' }}>{s.viewer.xp.toLocaleString()}</b></span>
          </>
        )}
      </div>
    </header>
  )
}

function Timecode() {
  const elapsed = useWorld((s) => s.elapsed)
  const loopIndex = useWorld((s) => s.loopIndex)
  const t = elapsed + loopIndex * 61
  const h = Math.floor(t / 3600)
  const m = Math.floor((t % 3600) / 60)
  const sec = Math.floor(t % 60)
  const f = Math.floor((t % 1) * 24)
  return <>{[h, m, sec, f].map((n) => String(n).padStart(2, '0')).join(':')}</>
}

export function fmt(sec: number) {
  const s = Math.max(0, Math.ceil(sec))
  return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`
}

export function Hints({ items, extra }: { items: [string, string][]; extra?: ReactNode }) {
  return (
    <nav className="hints" aria-label="Controls">
      {items.map(([k, label]) => (
        <span key={k}><kbd>{k}</kbd>{label}</span>
      ))}
      {extra}
    </nav>
  )
}
