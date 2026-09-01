/**
 * Procedural audio. No assets: a low drone that tightens with tension,
 * clock ticks under ten seconds, an impact at the reveal, a chime at reward.
 */
class Audio {
  ctx: AudioContext | null = null
  master: GainNode | null = null
  drone: { osc: OscillatorNode; osc2: OscillatorNode; gain: GainNode; filter: BiquadFilterNode } | null = null
  muted = false
  unlocked = false

  unlock() {
    if (this.unlocked) return
    try {
      const Ctx = window.AudioContext || (window as any).webkitAudioContext
      this.ctx = new Ctx()
      this.master = this.ctx.createGain()
      this.master.gain.value = this.muted ? 0 : 0.6
      this.master.connect(this.ctx.destination)
      this.unlocked = true
      this.startDrone()
    } catch {
      /* audio unavailable */
    }
  }

  setMuted(m: boolean) {
    this.muted = m
    if (this.master && this.ctx) this.master.gain.setTargetAtTime(m ? 0 : 0.6, this.ctx.currentTime, 0.05)
  }

  private startDrone() {
    if (!this.ctx || !this.master) return
    const osc = this.ctx.createOscillator()
    const osc2 = this.ctx.createOscillator()
    const gain = this.ctx.createGain()
    const filter = this.ctx.createBiquadFilter()
    osc.type = 'sawtooth'; osc.frequency.value = 38
    osc2.type = 'sine'; osc2.frequency.value = 57
    filter.type = 'lowpass'; filter.frequency.value = 180; filter.Q.value = 6
    gain.gain.value = 0
    osc.connect(filter); osc2.connect(filter); filter.connect(gain); gain.connect(this.master)
    osc.start(); osc2.start()
    this.drone = { osc, osc2, gain, filter }
  }

  /** tension 0..1 shapes the drone; presence toggles it on for the world screen */
  setTension(t: number, present: boolean) {
    if (!this.ctx || !this.drone) return
    const now = this.ctx.currentTime
    this.drone.gain.gain.setTargetAtTime(present ? 0.05 + t * 0.09 : 0, now, 0.4)
    this.drone.filter.frequency.setTargetAtTime(160 + t * 900, now, 0.4)
    this.drone.osc.frequency.setTargetAtTime(38 + t * 6, now, 0.8)
  }

  private blip(freq: number, dur: number, type: OscillatorType, vol: number) {
    if (!this.ctx || !this.master) return
    const o = this.ctx.createOscillator()
    const g = this.ctx.createGain()
    o.type = type; o.frequency.value = freq
    g.gain.value = vol
    g.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + dur)
    o.connect(g); g.connect(this.master)
    o.start(); o.stop(this.ctx.currentTime + dur)
  }

  tick(vol = 1) { this.blip(1400, 0.05, 'square', 0.05 * vol) }
  select() { this.blip(880, 0.12, 'triangle', 0.12); setTimeout(() => this.blip(1320, 0.14, 'triangle', 0.1), 60) }
  lock() { this.blip(110, 0.6, 'sawtooth', 0.25); this.blip(220, 0.3, 'square', 0.08) }
  chime() { [660, 880, 1320].forEach((f, i) => setTimeout(() => this.blip(f, 0.5, 'sine', 0.12), i * 90)) }

  impact() {
    if (!this.ctx || !this.master) return
    const len = this.ctx.sampleRate * 1.2
    const buf = this.ctx.createBuffer(1, len, this.ctx.sampleRate)
    const d = buf.getChannelData(0)
    for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 3)
    const src = this.ctx.createBufferSource()
    src.buffer = buf
    const f = this.ctx.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 500
    const g = this.ctx.createGain(); g.gain.value = 0.7
    src.connect(f); f.connect(g); g.connect(this.master)
    src.start()
    this.blip(55, 1.4, 'sine', 0.5)
  }
}

export const audio = new Audio()
