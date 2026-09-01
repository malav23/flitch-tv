import { useEffect, useRef } from 'react'
import gsap from 'gsap'
import { useWorld, rankFor } from '../store/world'

export function Panel() {
  const s = useWorld()
  const ref = useRef<HTMLElement>(null)
  useEffect(() => {
    if (ref.current) gsap.fromTo(ref.current, { x: 40, opacity: 0 }, { x: 0, opacity: 1, duration: 0.4, ease: 'power3.out' })
  }, [s.panel])
  const v = s.viewer
  const acc = v.total ? Math.round((v.correct / v.total) * 100) : 0
  const avgEntry = v.history.filter((h) => h.kind === 'prediction').length ? 31 : 0

  return (
    <aside className="panel" ref={ref} role="dialog" aria-modal="true">
      <header>
        <div>
          <div className="eyebrow">{s.panel === 'profile' ? 'Your record' : s.panel === 'history' ? 'What you did' : 'Controls'}</div>
          <div className="display">{s.panel === 'profile' ? v.name : s.panel === 'history' ? 'History' : 'Remote'}</div>
        </div>
        <button className="close" onClick={() => s.setPanel('none')}>Close · Esc</button>
      </header>

      {s.panel === 'profile' && (
        <>
          <div className="rank">
            <div>
              <div className="eyebrow">Rank</div>
              <div className="display">{rankFor(v)}</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div className="eyebrow">XP</div>
              <div className="mono" style={{ fontSize: 22 }}>{v.xp.toLocaleString()}</div>
            </div>
          </div>
          <div className="stats">
            <div className="stat"><div className="display sodium">{acc}%</div><p>Prediction accuracy</p></div>
            <div className="stat"><div className="display signal">{v.contrarianWins}</div><p>Contrarian wins</p></div>
            <div className="stat"><div className="display">{avgEntry || '—'}%</div><p>Avg entry probability</p></div>
            <div className="stat"><div className="display">{v.legendary}</div><p>Legendary predictions</p></div>
            <div className="stat"><div className="display curse">{v.chaosXp.toLocaleString()}</div><p>Chaos XP</p></div>
            <div className="stat"><div className="display">{v.influence.toLocaleString()}</div><p>Influence</p></div>
          </div>
          <div>
            <div className="eyebrow" style={{ marginBottom: 8 }}>Titles</div>
            <div className="titles">
              {v.titles.length === 0 && <span style={{ color: 'var(--bone-dim)' }}>None yet. Trigger an interrupt.</span>}
              {v.titles.map((t, i) => <span key={t} data-new={i === v.titles.length - 1}>{t}</span>)}
            </div>
          </div>
        </>
      )}

      {(s.panel === 'profile' || s.panel === 'history') && (
        <div>
          <div className="eyebrow" style={{ marginBottom: 6 }}>Worlds remember</div>
          <ul className="history" style={{ margin: 0, padding: 0 }}>
            {v.history.map((h) => (
              <li key={h.id} data-kind={h.kind}>
                <span className="eyebrow">Ep {h.episode}</span>
                <span>{h.text}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {s.panel === 'help' && (
        <div className="help">
          <dl>
            <dt><kbd>← →</kbd></dt><dd>Turn the dial between unresolved situations</dd>
            <dt><kbd>Enter</kbd></dt><dd>Enter a world, or activate an interrupt</dd>
            <dt><kbd>1 2 3</kbd></dt><dd>Predict an outcome. Lower odds pay more.</dd>
            <dt><kbd>R</kbd></dt><dd>Reinforce your prediction and shift the crowd</dd>
            <dt><kbd>K</kbd></dt><dd>Buy a clue with influence</dd>
            <dt><kbd>P</kbd></dt><dd>Your record and rank</dd>
            <dt><kbd>H</kbd></dt><dd>Event history</dd>
            <dt><kbd>C</kbd></dt><dd>Creator studio</dd>
            <dt><kbd>M</kbd></dt><dd>Mute</dd>
            <dt><kbd>⌫ Esc</kbd></dt><dd>Back</dd>
          </dl>
          <p style={{ color: 'var(--bone-dim)', marginTop: 24 }}>
            Influence is earned by predicting well. It is never bought with money here. Predictions and purchases are always labelled separately.
          </p>
        </div>
      )}
    </aside>
  )
}
