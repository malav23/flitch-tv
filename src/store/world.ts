import { create } from 'zustand'
import { WORLDS, CHAT_NAMES, CHAT_TEMPLATES } from '../data/worlds'
import type { World, Loop, Interrupt, OutcomeId } from '../data/worlds'

export type Screen = 'boot' | 'guide' | 'world' | 'studio'
export type Phase =
  | 'calm'
  | 'expectation'
  | 'anticipation'
  | 'reveal'
  | 'attribution'
  | 'reward'

export type Panel = 'none' | 'profile' | 'history' | 'help'

export interface ChatMsg {
  id: number
  name: string
  text: string
  tone?: 'system' | 'you' | 'actor'
}

export interface HistoryEntry {
  id: number
  episode: number
  text: string
  kind: 'prediction' | 'interrupt' | 'clue' | 'title'
  at: number
}

export interface Viewer {
  name: string
  influence: number
  xp: number
  chaosXp: number
  titles: string[]
  correct: number
  total: number
  contrarianWins: number
  legendary: number
  history: HistoryEntry[]
}

export interface Toast {
  id: number
  text: string
  sub?: string
  tone: 'sodium' | 'curse' | 'signal' | 'bone'
}

export interface RewardSummary {
  predicted: boolean
  correct: boolean
  gain: number
  entryP: number
  contrarian: boolean
  outcomeLabel: string
  interruptXp: number
  newTitle: string | null
  actor: string | null
}

export interface LockedInterrupt {
  interrupt: Interrupt
  actor: string
  isYou: boolean
}

interface WorldState {
  screen: Screen
  worlds: World[]
  guideIndex: number
  worldId: string | null

  loopIndex: number
  phase: Phase
  /** Seconds remaining in the current phase */
  timeLeft: number
  /** Seconds elapsed in the current phase */
  elapsed: number
  odds: Record<OutcomeId, number>
  predictions: number
  viewers: number
  chaos: number
  prediction: OutcomeId | null
  entryP: number
  reinforced: boolean
  clueBought: boolean
  interruptAvailable: Interrupt | null
  interruptWindow: number
  locked: LockedInterrupt | null
  outcome: OutcomeId | null
  /** Simulated H3 generation state (never shown as "generating" to viewers) */
  generation: 'idle' | 'queued' | 'rendering' | 'ready'
  episode: number
  lastReward: RewardSummary | null

  viewer: Viewer
  chat: ChatMsg[]
  toasts: Toast[]
  panel: Panel
  reducedMotion: boolean
  muted: boolean

  // actions
  finishBoot: () => void
  openGuide: () => void
  moveGuide: (delta: number) => void
  enterWorld: (id?: string) => void
  leaveWorld: () => void
  openStudio: () => void
  launchWorld: (w: World) => void
  predict: (id: OutcomeId) => void
  reinforce: () => void
  buyClue: () => void
  activateInterrupt: () => void
  setPanel: (p: Panel) => void
  togglePanel: (p: Panel) => void
  toggleMute: () => void
  pushChat: (m: Omit<ChatMsg, 'id'>) => void
  toast: (t: Omit<Toast, 'id'>) => void
  dismissToast: (id: number) => void
  tick: (dt: number) => void
}

let idc = 1
const nid = () => idc++

const pick = <T,>(arr: T[]) => arr[Math.floor(Math.random() * arr.length)]
const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v))

export const currentWorld = (s: WorldState): World | null =>
  s.worlds.find((w) => w.id === s.worldId) ?? null

export const currentLoop = (s: WorldState): Loop | null => {
  const w = currentWorld(s)
  if (!w) return null
  return w.loops[s.loopIndex % w.loops.length]
}

export function rankFor(v: Viewer): string {
  const acc = v.total ? v.correct / v.total : 0
  if (v.total === 0) return 'Watcher'
  if (v.total < 3) return 'Seer I'
  if (acc < 0.4) return 'Seer II'
  if (acc < 0.6) return 'Oracle I'
  if (acc < 0.75) return 'Oracle II'
  return 'Oracle III'
}

function startOdds(loop: Loop): Record<OutcomeId, number> {
  const o: Record<OutcomeId, number> = {}
  for (const opt of loop.options) o[opt.id] = opt.baseP
  return normalize(o)
}

function normalize(o: Record<OutcomeId, number>) {
  const sum = Object.values(o).reduce((a, b) => a + b, 0) || 1
  const r: Record<OutcomeId, number> = {}
  for (const k in o) r[k] = o[k] / sum
  return r
}

const PHASE_LEN: Record<Exclude<Phase, 'anticipation'>, number> = {
  calm: 4,
  expectation: 7,
  reveal: 7.5,
  attribution: 4,
  reward: 5,
}

export const useWorld = create<WorldState>((set, get) => ({
  screen: 'boot',
  worlds: WORLDS,
  guideIndex: 0,
  worldId: null,

  loopIndex: 0,
  phase: 'calm',
  timeLeft: 2,
  elapsed: 0,
  odds: {},
  predictions: 0,
  viewers: 0,
  chaos: 0.34,
  prediction: null,
  entryP: 0,
  reinforced: false,
  clueBought: false,
  interruptAvailable: null,
  interruptWindow: 0,
  locked: null,
  outcome: null,
  generation: 'idle',
  episode: 47,
  lastReward: null,

  viewer: {
    name: 'you',
    influence: 6400,
    xp: 1250,
    chaosXp: 0,
    titles: [],
    correct: 5,
    total: 7,
    contrarianWins: 1,
    legendary: 0,
    history: [
      { id: nid(), episode: 14, text: 'Saved Kai', kind: 'interrupt', at: Date.now() - 86400e3 * 30 },
      { id: nid(), episode: 22, text: 'Discovered Vault #12', kind: 'clue', at: Date.now() - 86400e3 * 20 },
      { id: nid(), episode: 29, text: 'Predicted the betrayal at 19%', kind: 'prediction', at: Date.now() - 86400e3 * 9 },
    ],
  },
  chat: [],
  toasts: [],
  panel: 'none',
  reducedMotion:
    typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches,
  muted: false,

  finishBoot: () => set({ screen: 'guide' }),
  openGuide: () => set({ screen: 'guide', panel: 'none' }),
  moveGuide: (delta) =>
    set((s) => ({ guideIndex: (s.guideIndex + delta + s.worlds.length) % s.worlds.length })),

  enterWorld: (id) => {
    const s = get()
    const world = id ? s.worlds.find((w) => w.id === id) : s.worlds[s.guideIndex]
    if (!world) return
    const loop = world.loops[0]
    set({
      screen: 'world',
      worldId: world.id,
      loopIndex: 0,
      phase: 'calm',
      timeLeft: 2.5,
      elapsed: 0,
      odds: startOdds(loop),
      predictions: Math.round(world.viewers * 0.62),
      viewers: world.viewers,
      chaos: 0.34 + world.threat * 0.2,
      prediction: null,
      entryP: 0,
      reinforced: false,
      clueBought: false,
      interruptAvailable: null,
      interruptWindow: 0,
      locked: null,
      outcome: null,
      generation: 'idle',
      episode: world.day,
      chat: [
        { id: nid(), name: 'world', text: `Day ${world.day}. ${world.viewers.toLocaleString()} watching.`, tone: 'system' },
      ],
      panel: 'none',
    })
  },

  leaveWorld: () => set({ screen: 'guide', worldId: null, panel: 'none' }),
  openStudio: () => set({ screen: 'studio', panel: 'none' }),

  launchWorld: (w) => {
    set((s) => ({ worlds: [w, ...s.worlds], guideIndex: 0 }))
    get().enterWorld(w.id)
  },

  predict: (id) => {
    const s = get()
    const loop = currentLoop(s)
    if (!loop || (s.phase !== 'expectation' && s.phase !== 'anticipation')) return
    if (s.prediction) return
    const p = s.odds[id] ?? 0
    const odds = { ...s.odds }
    // Your prediction nudges the crowd slightly
    odds[id] = odds[id] + 0.004
    set({
      prediction: id,
      entryP: p,
      odds: normalize(odds),
      predictions: s.predictions + 1,
      chaos: clamp(s.chaos + 0.01),
    })
    const label = loop.options.find((o) => o.id === id)?.label ?? id
    get().pushChat({ name: 'you', text: `predicted ${label} at ${Math.round(p * 100)}%`, tone: 'you' })
  },

  reinforce: () => {
    const s = get()
    if (!s.prediction || s.reinforced || s.viewer.influence < 400) return
    if (s.phase !== 'anticipation') return
    const odds = { ...s.odds }
    odds[s.prediction] += 0.03
    set({
      reinforced: true,
      odds: normalize(odds),
      viewer: { ...s.viewer, influence: s.viewer.influence - 400 },
      chaos: clamp(s.chaos + 0.03),
    })
    get().toast({ text: 'Prediction reinforced', sub: '−400 influence · crowd shifted', tone: 'signal' })
  },

  buyClue: () => {
    const s = get()
    const loop = currentLoop(s)
    if (!loop || s.clueBought || s.viewer.influence < 600) return
    if (s.phase !== 'expectation' && s.phase !== 'anticipation') return
    set({
      clueBought: true,
      viewer: {
        ...s.viewer,
        influence: s.viewer.influence - 600,
        history: [
          { id: nid(), episode: s.episode, text: `Bought a clue: “${loop.clue}”`, kind: 'clue', at: Date.now() },
          ...s.viewer.history,
        ],
      },
      chaos: clamp(s.chaos + 0.02),
    })
    get().toast({ text: 'Clue', sub: loop.clue, tone: 'bone' })
  },

  activateInterrupt: () => {
    const s = get()
    const it = s.interruptAvailable
    if (!it || s.locked || s.phase !== 'anticipation') return
    if (s.viewer.influence < it.cost) {
      get().toast({ text: 'Not enough influence', sub: `Needs ${it.cost.toLocaleString()}`, tone: 'curse' })
      return
    }
    set({
      locked: { interrupt: it, actor: 'you', isYou: true },
      interruptAvailable: null,
      interruptWindow: 0,
      generation: 'queued',
      chaos: clamp(s.chaos + 0.25),
      viewer: { ...s.viewer, influence: s.viewer.influence - it.cost },
      // Anticipation shortens: the reveal is coming.
      timeLeft: Math.min(s.timeLeft, 9),
    })
    get().pushChat({ name: 'world', text: `INTERRUPT LOCKED · triggered by @you`, tone: 'system' })
    setTimeout(() => get().pushChat({ name: 'world', text: it.omen, tone: 'system' }), 1200)
  },

  setPanel: (p) => set({ panel: p }),
  togglePanel: (p) => set((s) => ({ panel: s.panel === p ? 'none' : p })),
  toggleMute: () => set((s) => ({ muted: !s.muted })),

  pushChat: (m) =>
    set((s) => ({ chat: [...s.chat, { ...m, id: nid() }].slice(-60) })),

  toast: (t) => {
    const id = nid()
    set((s) => ({ toasts: [...s.toasts, { ...t, id }].slice(-3) }))
    setTimeout(() => get().dismissToast(id), 4200)
  },
  dismissToast: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),

  // ---- The director ----------------------------------------------------
  tick: (dt) => {
    const s = get()
    if (s.screen !== 'world') return
    const loop = currentLoop(s)
    const world = currentWorld(s)
    if (!loop || !world) return

    let { timeLeft, elapsed, chaos, odds, predictions, viewers, interruptAvailable, interruptWindow, locked, generation } = s
    timeLeft -= dt
    elapsed += dt
    const patch: Partial<WorldState> = {}

    // Ambient audience drift
    viewers = Math.max(100, Math.round(viewers + (Math.random() - 0.48) * 40 * dt * 10))

    // Chat velocity depends on tension
    const velocity =
      s.phase === 'reveal' ? 6 : s.phase === 'anticipation' ? (timeLeft < 8 ? 3.2 : 1.6) : 0.9
    if (Math.random() < velocity * dt) {
      const key = locked && s.phase === 'anticipation' ? 'omen' : s.phase
      const tpl = pick(CHAT_TEMPLATES[key] ?? CHAT_TEMPLATES.calm)
      const text = tpl
        .replace('{chaos}', `${Math.round(chaos * 100)}%`)
        .replace('{n}', String(Math.round(predictions * (odds[loop.options[1].id] ?? 0.2))))
        .replace('{a}', loop.options[0].label.toLowerCase())
        .replace('{b}', loop.options[1].label.toLowerCase())
        .replace('{c}', loop.options[2].label.toLowerCase())
        .replace('{actor}', locked?.actor ?? 'someone')
      get().pushChat({ name: pick(CHAT_NAMES), text })
    }

    switch (s.phase) {
      case 'calm': {
        chaos = clamp(chaos - 0.02 * dt, 0.15, 1)
        if (timeLeft <= 0) {
          // Start a new loop: create expectation
          Object.assign(patch, {
            phase: 'expectation',
            timeLeft: PHASE_LEN.expectation,
            elapsed: 0,
            odds: startOdds(loop),
            predictions: Math.round(viewers * 0.35),
            prediction: null,
            entryP: 0,
            reinforced: false,
            clueBought: false,
            interruptAvailable: null,
            interruptWindow: 0,
            locked: null,
            outcome: null,
            generation: 'idle',
          })
          get().pushChat({ name: 'world', text: loop.question.toUpperCase(), tone: 'system' })
        }
        break
      }
      case 'expectation': {
        predictions += Math.round(viewers * 0.02 * dt * 10)
        if (timeLeft <= 0) {
          Object.assign(patch, { phase: 'anticipation', timeLeft: loop.duration, elapsed: 0 })
          // Predictive generation: prefetch likely branches while the crowd decides
          generation = 'rendering'
        }
        break
      }
      case 'anticipation': {
        predictions += Math.round(viewers * 0.006 * dt * 10)
        // Crowd drifts: mostly toward the expected outcome, noisier as the clock runs down
        const noise = 0.02 + (1 - timeLeft / loop.duration) * 0.05
        const next = { ...odds }
        for (const opt of loop.options) {
          const pull = opt.id === loop.expected ? 0.015 : -0.005
          next[opt.id] = clamp(next[opt.id] + (pull + (Math.random() - 0.5) * noise) * dt, 0.02, 0.95)
        }
        odds = normalize(next)

        chaos = clamp(chaos + (0.012 + (locked ? 0.05 : 0)) * dt)

        // Open the interrupt window at ~60% of the countdown if chaos is high enough
        if (!interruptAvailable && !locked && interruptWindow === 0 && timeLeft < loop.duration * 0.62 && chaos > 0.45) {
          interruptAvailable = pick(loop.interrupts)
          interruptWindow = 9
          get().pushChat({ name: 'world', text: `⚠ RARE INTERRUPT AVAILABLE · ${interruptAvailable.name.toUpperCase()}`, tone: 'system' })
        }
        if (interruptAvailable) {
          interruptWindow -= dt
          // Another viewer may take it before you when chaos is very high
          if (interruptWindow < 3 && chaos > 0.82 && Math.random() < 0.08 * dt * 10) {
            const actor = pick(CHAT_NAMES)
            locked = { interrupt: interruptAvailable, actor, isYou: false }
            interruptAvailable = null
            interruptWindow = 0
            generation = 'queued'
            timeLeft = Math.min(timeLeft, 9)
            get().pushChat({ name: 'world', text: `INTERRUPT LOCKED · triggered by @${actor}`, tone: 'system' })
            setTimeout(() => get().pushChat({ name: 'world', text: locked!.interrupt.omen, tone: 'system' }), 1200)
          } else if (interruptWindow <= 0) {
            interruptAvailable = null
            interruptWindow = -1 // closed for this loop
          }
        }
        if (locked && generation === 'queued' && timeLeft < 6) generation = 'rendering'
        if (locked && generation === 'rendering' && timeLeft < 2.5) generation = 'ready'

        if (timeLeft <= 0) {
          // Resolve
          let outcome: OutcomeId
          if (locked) outcome = locked.interrupt.forces
          else {
            // Weighted by crowd, but the world favours the expected path
            const r = Math.random()
            outcome = r < 0.72 ? loop.expected : pick(loop.options.filter((o) => o.id !== loop.expected)).id
          }
          Object.assign(patch, {
            phase: 'reveal',
            timeLeft: PHASE_LEN.reveal,
            elapsed: 0,
            outcome,
            generation: 'ready',
          })
          chaos = clamp(chaos + 0.15)
        }
        break
      }
      case 'reveal': {
        chaos = clamp(chaos - 0.01 * dt)
        if (timeLeft <= 0) {
          if (locked) Object.assign(patch, { phase: 'attribution', timeLeft: PHASE_LEN.attribution, elapsed: 0 })
          else Object.assign(patch, { phase: 'reward', timeLeft: PHASE_LEN.reward, elapsed: 0 })
          if (patch.phase === 'reward') applyRewards(get, set)
        }
        break
      }
      case 'attribution': {
        if (timeLeft <= 0) {
          Object.assign(patch, { phase: 'reward', timeLeft: PHASE_LEN.reward, elapsed: 0 })
          applyRewards(get, set)
        }
        break
      }
      case 'reward': {
        chaos = clamp(chaos - 0.05 * dt, 0.15, 1)
        if (timeLeft <= 0) {
          Object.assign(patch, {
            phase: 'calm',
            timeLeft: PHASE_LEN.calm,
            elapsed: 0,
            loopIndex: s.loopIndex + 1,
          })
          const nextLoop = world.loops[(s.loopIndex + 1) % world.loops.length]
          get().pushChat({ name: 'world', text: `Next: ${nextLoop.question}`, tone: 'system' })
        }
        break
      }
    }

    set({
      timeLeft: patch.timeLeft ?? timeLeft,
      elapsed: patch.elapsed ?? elapsed,
      chaos,
      odds: patch.odds ?? odds,
      predictions: patch.predictions ?? predictions,
      viewers,
      interruptAvailable: 'interruptAvailable' in patch ? patch.interruptAvailable! : interruptAvailable,
      interruptWindow: 'interruptWindow' in patch ? patch.interruptWindow! : interruptWindow,
      locked: 'locked' in patch ? patch.locked! : locked,
      generation: patch.generation ?? generation,
      ...patch,
    })
  },
}))

function applyRewards(get: () => WorldState, set: (p: Partial<WorldState>) => void) {
  const s = get()
  const loop = currentLoop(s)
  if (!loop || !s.outcome) return
  const v = { ...s.viewer, history: [...s.viewer.history], titles: [...s.viewer.titles] }
  const outcomeLabel = loop.options.find((o) => o.id === s.outcome)?.label ?? s.outcome
  const summary: RewardSummary = { predicted: !!s.prediction, correct: false, gain: 0, entryP: s.entryP, contrarian: false, outcomeLabel, interruptXp: 0, newTitle: null, actor: s.locked?.actor ?? null }

  if (s.prediction) {
    v.total += 1
    if (s.prediction === s.outcome) {
      v.correct += 1
      // Low-consensus wins pay more
      const gain = Math.round(120 / Math.max(0.08, s.entryP))
      summary.correct = true
      summary.gain = gain
      v.xp += gain
      v.influence += Math.round(gain * 1.5)
      const contrarian = s.entryP < 0.35
      summary.contrarian = contrarian
      if (contrarian) v.contrarianWins += 1
      if (s.entryP < 0.15) v.legendary += 1
      v.history.unshift({
        id: nid(),
        episode: s.episode,
        text: `${contrarian ? 'Contrarian call' : 'Called'} “${outcomeLabel}” at ${Math.round(s.entryP * 100)}%`,
        kind: 'prediction',
        at: Date.now(),
      })
      get().toast({
        text: contrarian ? `Contrarian win · +${gain} XP` : `Correct · +${gain} XP`,
        sub: `You entered at ${Math.round(s.entryP * 100)}%`,
        tone: 'signal',
      })
    } else {
      v.xp += 20
      summary.gain = 20
      get().toast({ text: 'Wrong call · +20 XP', sub: `It was “${outcomeLabel}”`, tone: 'bone' })
    }
  }

  if (s.locked?.isYou) {
    const it = s.locked.interrupt
    v.chaosXp += it.xp
    summary.interruptXp = it.xp
    v.xp += it.xp
    v.history.unshift({ id: nid(), episode: s.episode, text: `${it.title} — you triggered it`, kind: 'interrupt', at: Date.now() })
    if (!v.titles.includes(it.unlocks)) {
      v.titles.push(it.unlocks)
      summary.newTitle = it.unlocks
      v.history.unshift({ id: nid(), episode: s.episode, text: `New title: ${it.unlocks}`, kind: 'title', at: Date.now() })
    }
  }
  set({ viewer: v, lastReward: summary })
}
