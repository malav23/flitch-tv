// LiveWorld realtime server: rooms per channel, names, presence, chat history.
// Plain Node + ws. No database; history lives in memory per room.
import { createServer } from 'node:http'
import { WebSocketServer } from 'ws'

const PORT = Number(process.env.PORT || 8787)
const HISTORY = 80
const MAX_TEXT = 240
const RATE_MS = 600

/** room -> { history: Msg[], clients: Set<ws> } */
const rooms = new Map()
const room = (id) => {
  if (!rooms.has(id)) rooms.set(id, { history: [], clients: new Set() })
  return rooms.get(id)
}

let seq = 1
const clean = (s, max) => String(s ?? "").replace(/[\x00-\x1f\x7f]/g, "").trim().slice(0, max)
const send = (ws, o) => { if (ws.readyState === 1) ws.send(JSON.stringify(o)) }
const broadcast = (id, o, except) => { for (const c of room(id).clients) if (c !== except) send(c, o) }

const presence = (id) => {
  const r = room(id)
  const names = [...r.clients].map((c) => c.meta?.name).filter(Boolean)
  broadcast(id, { type: 'presence', room: id, count: r.clients.size, names: names.slice(0, 40) })
}

const uniqueName = (id, want) => {
  const taken = new Set([...room(id).clients].map((c) => c.meta?.name))
  let n = want, i = 2
  while (taken.has(n)) n = `${want}${i++}`
  return n
}

const http = createServer((req, res) => {
  res.writeHead(200, { 'content-type': 'application/json', 'access-control-allow-origin': '*' })
  const summary = {}
  for (const [id, r] of rooms) summary[id] = r.clients.size
  res.end(JSON.stringify({ ok: true, rooms: summary }))
})

const wss = new WebSocketServer({ server: http })

wss.on('connection', (ws) => {
  ws.meta = { id: seq++, name: null, room: null, last: 0, alive: true }
  ws.on('pong', () => { ws.meta.alive = true })

  const leave = () => {
    const id = ws.meta.room
    if (!id) return
    room(id).clients.delete(ws)
    ws.meta.room = null
    if (ws.meta.name) broadcast(id, { type: 'system', room: id, text: `${ws.meta.name} left` })
    presence(id)
  }

  const join = (id) => {
    id = clean(id, 40) || 'lobby'
    if (ws.meta.room === id) return
    leave()
    const r = room(id)
    r.clients.add(ws)
    ws.meta.room = id
    send(ws, { type: 'welcome', room: id, name: ws.meta.name, history: r.history, count: r.clients.size })
    broadcast(id, { type: 'system', room: id, text: `${ws.meta.name} is here` }, ws)
    presence(id)
  }

  ws.on('message', (raw) => {
    let m
    try { m = JSON.parse(String(raw)) } catch { return }
    switch (m.type) {
      case 'join': {
        const want = clean(m.name, 20).replace(/\s+/g, '_') || `viewer${ws.meta.id}`
        ws.meta.name = uniqueName(clean(m.room, 40) || 'lobby', want)
        join(m.room)
        break
      }
      case 'room':
        if (ws.meta.name) join(m.room)
        break
      case 'say': {
        if (!ws.meta.name || !ws.meta.room) return
        const now = Date.now()
        if (now - ws.meta.last < RATE_MS) return
        const text = clean(m.text, MAX_TEXT)
        if (!text) return
        ws.meta.last = now
        const msg = { id: seq++, name: ws.meta.name, text, at: now }
        const r = room(ws.meta.room)
        r.history.push(msg)
        if (r.history.length > HISTORY) r.history.shift()
        broadcast(ws.meta.room, { type: 'chat', room: ws.meta.room, msg })
        break
      }
    }
  })

  ws.on('close', leave)
  ws.on('error', leave)
})

// Drop dead sockets
setInterval(() => {
  for (const ws of wss.clients) {
    if (!ws.meta.alive) { ws.terminate(); continue }
    ws.meta.alive = false
    ws.ping()
  }
}, 20000)

http.listen(PORT, () => console.log(`liveworld realtime on ws://localhost:${PORT}`))
