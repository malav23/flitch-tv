import { useWorld } from '../store/world'

/**
 * Realtime client. Rooms follow the channel you are watching; the lobby is the guide.
 * If the server is unreachable the app keeps working with the simulated room only.
 */

type ServerMsg =
  | { type: 'welcome'; room: string; name: string; history: { id: number; name: string; text: string; at: number }[]; count: number }
  | { type: 'chat'; room: string; msg: { id: number; name: string; text: string; at: number } }
  | { type: 'presence'; room: string; count: number; names: string[] }
  | { type: 'system'; room: string; text: string }

const URL =
  (import.meta.env.VITE_WS_URL as string | undefined) ??
  `${location.protocol === 'https:' ? 'wss' : 'ws'}://${location.hostname}:8787`

class Net {
  private ws: WebSocket | null = null
  private name: string | null = null
  private room = 'lobby'
  private retry = 0
  private timer: number | null = null
  connected = false

  connect(name: string) {
    this.name = name
    this.open()
  }

  private open() {
    if (!this.name) return
    if (this.ws && (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING)) return
    try {
      this.ws = new WebSocket(URL)
    } catch {
      this.scheduleRetry()
      return
    }
    this.ws.onopen = () => {
      this.retry = 0
      this.connected = true
      useWorld.getState().setNet({ connected: true })
      this.send({ type: 'join', name: this.name, room: this.room })
    }
    this.ws.onmessage = (e) => {
      let m: ServerMsg
      try { m = JSON.parse(e.data) } catch { return }
      this.handle(m)
    }
    this.ws.onclose = () => {
      this.connected = false
      useWorld.getState().setNet({ connected: false, online: 0 })
      this.scheduleRetry()
    }
    this.ws.onerror = () => { this.ws?.close() }
  }

  private scheduleRetry() {
    if (this.timer) return
    const wait = Math.min(15000, 1000 * 2 ** this.retry++)
    this.timer = window.setTimeout(() => { this.timer = null; this.open() }, wait)
  }

  private send(o: unknown) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) this.ws.send(JSON.stringify(o))
  }

  private handle(m: ServerMsg) {
    const s = useWorld.getState()
    switch (m.type) {
      case 'welcome':
        s.setNet({ connected: true, online: m.count, serverName: m.name })
        for (const h of m.history.slice(-12)) s.pushChat({ name: h.name, text: h.text, tone: h.name === m.name ? 'you' : 'live' })
        break
      case 'chat':
        if (m.room !== this.room) return
        s.pushChat({ name: m.msg.name, text: m.msg.text, tone: m.msg.name === s.serverName ? 'you' : 'live' })
        break
      case 'presence':
        if (m.room !== this.room) return
        s.setNet({ online: m.count })
        break
      case 'system':
        if (m.room !== this.room) return
        s.pushChat({ name: 'room', text: m.text, tone: 'system' })
        break
    }
  }

  setRoom(room: string) {
    if (this.room === room) return
    this.room = room
    this.send({ type: 'room', room })
  }

  /** Say something in the room. Falls back to the local simulated room when offline. */
  say(text: string) {
    const t = text.trim()
    if (!t) return
    if (this.connected) this.send({ type: 'say', text: t })
    else useWorld.getState().say(t)
    useWorld.setState((s) => ({ chaos: Math.min(1, s.chaos + 0.01) }))
  }
}

export const net = new Net()
