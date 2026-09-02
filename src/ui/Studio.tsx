import { useEffect, useRef, useState } from 'react'
import gsap from 'gsap'
import { useWorld } from '../store/world'
import { HORROR_LOOPS } from '../data/worlds'
import type { World } from '../data/worlds'

interface Act { name: string; title: string; body: string; rule: string }

const DEFAULT =
  'I’m playing a horror game for 90 minutes. Let viewers predict whether I survive each room. They should occasionally be able to spawn supernatural events and sabotage me.'

function planFor(text: string, intensity: number): Act[] {
  const t = text.toLowerCase()
  const genre = t.includes('heist') ? 'heist' : t.includes('cook') ? 'kitchen' : t.includes('race') || t.includes('speedrun') ? 'run' : 'horror'
  const noun = { horror: 'room', heist: 'vault', kitchen: 'course', run: 'split' }[genre]
  const threat = { horror: 'the Entity', heist: 'the guards', kitchen: 'the critic', run: 'the clock' }[genre]
  return [
    { name: 'Act 1', title: 'Low-risk predictions', body: `Every ${noun}: “Will they make it?” Predictions only, no interventions. Viewers learn the odds.`, rule: `WHEN creator enters ${noun}\nTHEN open prediction (30s)` },
    { name: 'Act 2', title: 'Sabotage arrives', body: `Interrupts unlock when chaos passes ${45 + intensity * 10}%. Viewers can remove a tool or add a hazard.`, rule: `WHEN prediction reaches 70%\nAND chaos > ${45 + intensity * 10}\nTHEN open interrupt window (9s)` },
    { name: 'Act 3', title: `Hidden ${threat} mechanic`, body: `A secret action lets one viewer wake ${threat}. Only they know they did it, until the reveal.`, rule: `IF secret action fired\nTHEN generate ${threat} scene (H3 Max, 5s)\nAFTER launch survival prediction` },
    { name: 'Act 4', title: 'Community boss', body: 'Everyone contributes influence to a shared meter. Filling it forces a boss encounter nobody can undo.', rule: 'WHEN shared meter = 100%\nTHEN trigger boss branch (prefetched)' },
    { name: 'Finale', title: 'Rare irreversible decision', body: `One viewer chooses who ${genre === 'horror' ? 'the creator saves' : 'gets caught'}. The world remembers it next episode.`, rule: 'WHEN finale\nTHEN one-time choice · persist to world state' },
  ]
}

export function Studio() {
  const openGuide = useWorld((s) => s.openGuide)
  const launchWorld = useWorld((s) => s.launchWorld)
  const [text, setText] = useState(DEFAULT)
  const [name, setName] = useState('Tonight’s run')
  const [intensity, setIntensity] = useState(2)
  const [acts, setActs] = useState<Act[] | null>(null)
  const [busy, setBusy] = useState(false)
  const list = useRef<HTMLUListElement>(null)

  useEffect(() => {
    if (!acts || !list.current) return
    gsap.fromTo(list.current.querySelectorAll('li'), { opacity: 0, y: 16 }, { opacity: 1, y: 0, duration: 0.5, stagger: 0.12, ease: 'power3.out' })
  }, [acts])

  const generate = () => {
    setBusy(true)
    setActs(null)
    setTimeout(() => { setActs(planFor(text, intensity)); setBusy(false) }, 900)
  }

  const launch = () => {
    const world: World = {
      id: `custom-${Date.now()}`,
      name: name.trim() || 'Untitled world',
      creator: 'you',
      situation: `${(3200 + Math.round(Math.random() * 900)).toLocaleString()} people don’t think you survive the first room.`,
      timing: 'Opens in 00:30',
      live: true,
      viewers: 3200 + Math.round(Math.random() * 900),
      day: 1,
      threat: 0.35 + intensity * 0.15,
      mood: 'Horror',
      poster: '#8f2b2b',
      accent: '#d9b14a',
      tagline: 'A film you can interrupt.',
      loops: HORROR_LOOPS,
    }
    launchWorld(world)
  }

  return (
    <div className="studio">
      <div className="studio-grid">
        <div>
          <h1>Create a live<br />experience<span>Describe tonight. The Director builds the loops.</span></h1>
          <label className="eyebrow" htmlFor="world-name">World name</label>
          <input
            id="world-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            style={{ width: '100%', background: 'var(--panel)', border: '1px solid var(--panel-line)', color: 'var(--bone)', font: '18px var(--body)', padding: '12px 16px', userSelect: 'text' }}
          />
          <label className="eyebrow" htmlFor="desc">Describe tonight’s stream</label>
          <textarea id="desc" value={text} onChange={(e) => setText(e.target.value)} />
          <div className="intensity">
            Intensity
            {['Calm', 'Tense', 'Chaotic', 'Unhinged'].map((l, i) => (
              <button key={l} data-on={i === intensity} onClick={() => setIntensity(i)}>{l}</button>
            ))}
          </div>
          <div className="row">
            <button className="act primary" onClick={generate} disabled={busy}>{busy ? 'Reading…' : acts ? 'Regenerate plan' : 'Generate plan'}</button>
            <button className="act" onClick={launch} disabled={!acts}>Launch world <small>Enter the guide live</small></button>
            <button className="act" onClick={openGuide}>Back <small>Esc</small></button>
          </div>
          <p style={{ color: 'var(--bone-dim)', marginTop: 20, maxWidth: 520, fontSize: 14 }}>
            Generated scenes run on fal.ai MiniMax H3 Max, 5 seconds at 768p, only at high-value moments. Roughly $0.40 per moment, seen by every viewer at once. Your intensity setting caps how often the Director can spend one.
          </p>
        </div>

        <div>
          <div className="eyebrow" style={{ marginBottom: 10 }}>Tonight’s plan</div>
          {!acts ? (
            <div className="acts-empty">{busy ? 'The Director is reading your description…' : 'Generate a plan to see the acts, triggers and rules the Director will run.'}</div>
          ) : (
            <ul className="acts" ref={list} style={{ margin: 0, padding: 0 }}>
              {acts.map((a) => (
                <li key={a.name}>
                  <span className="eyebrow">{a.name}</span>
                  <div>
                    <h4>{a.title}</h4>
                    <p>{a.body}</p>
                    <div className="rule">{a.rule}</div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  )
}
