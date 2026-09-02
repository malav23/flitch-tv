# LiveWorld

**A film you can interrupt.**

Live entertainment today is a one-way pipe: a creator streams, an audience watches, a chat scrolls past. LiveWorld starts from a different idea. The audience should be able to *bet on what happens next, change it, and watch reality bend* because they did. Generated video (fal.ai MiniMax H3) turns an audience decision into a five-second cinematic moment that everyone sees at once, and the world remembers it afterwards.

This repository is a playable prototype of that idea: a dark room, one screen, and a loop you can feel end to end. Real people enter a name and talk in the room over a small realtime server; the wider audience, the odds, and the video generation are simulated.

The atomic unit is not a stream, a video, or a chat message. It is a loop:

**Expectation → Anticipation → Interaction → Interrupt → Reveal → Attribution → Reward → Memory**

---

## What it feels like

The set switches on. You are looking at a stack of old televisions in a dark room. Five of them show static. One glows with colour and lights the floor. A caption under it reads: *41,208 people think Ilya is about to open the server-room door. He has not blinked in four minutes. Opens in 00:42.* You press Enter.

The screen becomes a wet concrete corridor. Tungsten tubes flicker. A figure with a headlamp walks toward a steel door. A caption: **WHAT DID ILYA SEE BEHIND THE DOOR?** Three outcomes, live odds, a countdown top-right. You predict. The crowd shifts. Chaos climbs along the bottom edge.

A small box appears. **RARE INTERRUPT · PULL THE PLUG · 3,000 INFLUENCE · OUTCOME UNKNOWN · 9 SECONDS.** You activate it. The picture dims and reddens. *Something has changed.* The fans stop spinning. Five, four, three...

The door opens. RGB slices tear across the frame. Something that is not the model lunges out of the dark. **IT WAS NOT THE MODEL.** Then: **SOMEONE PULLED THE PLUG · triggered by @you. That was you.** Then the credits: +545 XP for a contrarian call, +400 chaos XP for changing what happened, a new title, **DISRUPTOR**, kept in this world.

And immediately: *Does the safety team survive the night?*

---

## Capabilities

### The loop engine
- **Six-phase state machine**: calm, expectation, anticipation, reveal, attribution, reward. Each resolved loop spawns the next question with no dead air.
- **Simulated audience**: odds drift toward the expected outcome with growing noise as the clock runs down, prediction counts climb, chat velocity follows tension.
- **Chaos meter** that rises with participation and opens rare interrupt windows when it crosses a threshold. When chaos is very high another viewer may take the interrupt before you.
- **Interrupts** of four kinds (chaos, sabotage, protect, modify), each forcing a specific outcome. Activating one shortens the countdown, dims the world and shows an omen, never a loading state.
- **Latency hidden by anticipation**: the simulated H3 generation moves through queued → rendering → ready behind the countdown, and the left column shows that state honestly.
- **Rewards scaled to conviction**: correct predictions pay more the lower the odds you entered at. Contrarian wins and legendary calls are tracked separately.
- **Persistent memory**: every meaningful act becomes an entry in your record with the episode number; titles unlock the first time you earn them.

### The room (realtime backend)
- **Names.** The first thing after the set switches on is *Who is watching*. Your name is kept in the browser and shown in the room. Duplicate names get a suffix.
- **Rooms per channel.** A Node WebSocket server (`server/index.mjs`) keeps one room per channel plus a lobby for the guide. Entering a channel moves you into its room; leaving returns you to the lobby.
- **Live chat and presence.** Messages broadcast to everyone in the room, with the last 80 kept as history for late joiners. The header shows how many people are here; the footer shows the lobby count. Join and leave notices appear as system lines.
- **Simulated audience alongside.** The bot crowd keeps talking so a room never feels empty; real people are highlighted in mint.
- **Graceful offline.** If the server is unreachable the room label says *offline · simulated* and everything else keeps working. Rate limit 1 message per 600 ms, 240 characters, control characters stripped.

### The picture (Three.js)
- **Channel guide as a room of CRT sets.** Six televisions on a reflective floor. Each screen is a canvas of live static repainted every frame; the selected set carries its world's colour, rolls a bright band, tears occasionally, and lights the room. Turning the dial moves the camera and fires a glitch pass.
- **A real-time 3D "reality layer"** standing in for the live stream: a corridor with procedural PBR surfaces (colour, normal and roughness maps from value noise, no downloads), a wet reflective floor, tiled walls, ribs, pipes, crates, a steel door with a badge reader, and a server room behind it.
- **Real shadows** from the walker's headlamp and a ceiling tube, plus volumetric light cones and drifting dust.
- An **articulated walker** whose limbs swing from the hips and shoulders, and an **organic creature** built from a distorting mesh with spikes and glowing eyes.
- **Per-outcome cinematography** choreographed with GSAP: door swing, camera push-in, red wash, shake, chromatic aberration, glitch, gold glow, shield shockwave, retreat, blackout.
- Post-processing: depth of field focused on the walker, bloom, ACES tone mapping, film noise, vignette, anti-aliasing.

### The interface (GSAP + CSS)
- **One screen in a dark room.** A single framed picture in the centre, black everywhere else, two quiet columns beside it, a thin bar above and below.
- **One typeface, neon ink.** Space Mono, uppercase, on black. Mint for the frame, labels and anything that is yours; cyan for timecodes and section labels; magenta for interrupts and danger; yellow for chaos. Glows are soft and only on active elements. RGB slices flash across the frame on every transition.
- **Captions, not panels.** The question is a white label bar. Odds are three mono lines with a thin bar and a percentage. The countdown sits top-right like a timecode. Chaos is a hairline along the bottom edge.
- **Left column**: channel list in the guide; NOW / SOON / LATER cards and the generation state inside a world.
- **Right column**: your record in the guide; the room's chat inside a world, with an input for what you want to happen next.
- **Intertitles** for reveal, attribution ("triggered by @you") and end-credit rewards with dotted leaders.
- **Window chrome** in the top bar: mute, your record, close.
- **Your record**: rank (Watcher → Seer → Oracle III), accuracy, contrarian wins, chaos XP, titles, and a history worlds remember.
- **Creator studio**: describe tonight's stream, choose an intensity, get a five-act Director plan with WHEN/THEN rules, and launch it as a new channel.
- Procedural audio: a tension drone, clock ticks under ten seconds, an impact at the reveal, a chime at reward. No audio files.
- Keyboard remote, mouse and touch, a portrait layout on phones, reduced-motion support.

### The worlds
Six channels, each with three loops, written as good-natured parody of the people who talk about AI for a living:

| Channel | Situation |
| --- | --- |
| **CH 01 · What Did Ilya See** | Some doors should stay closed. This one has a badge reader. |
| **CH 02 · Hour Four** | A four-hour conversation about love, death and the transformer. Someone is lying. |
| **CH 03 · The Follow-Up Question** | He read the paper, the appendix, and the footnote you hoped nobody would. |
| **CH 04 · The Kitchen Keynote** | Hour nineteen. The leather jacket has not come off. |
| **CH 05 · Jamie, Pull That Up** | An elk has entered the studio. The guest is a physicist. |
| **CH 06 · Poker Night** | Four besties. One pot. Somebody bluffed about a fund size. |
| **CH 07 · Roast Battle** | Two comics. One mic. The crowd has receipts. |

---

## Run it

```bash
pnpm install
pnpm dev        # web on http://localhost:5173 + realtime server on ws://localhost:8787
pnpm build      # production build in dist/
pnpm server     # realtime server only (PORT=8787 by default)
```

Point the client at a deployed server with `VITE_WS_URL=wss://your-host` at build time.

## Controls

| Key | Does |
| --- | --- |
| ← → | Turn the dial between channels |
| Enter | Enter a channel · activate an interrupt when one is offered |
| 1 2 3 | Predict an outcome. Lower odds pay more. |
| R | Reinforce your prediction (spends influence, shifts the crowd) |
| K | Buy a clue |
| P / H | Your record · event history |
| C | Creator studio |
| M | Mute |
| ⌫ / Esc | Back |

Everything is also clickable and tappable.

## Where things live

- `src/store/world.ts` — the loop state machine, the Director tick, rewards, memory.
- `src/data/worlds.ts` — worlds, loops, interrupts, reveal copy, chat templates.
- `src/scenes/GuideScene.tsx` — the room of CRT sets.
- `src/scenes/WorldScene.tsx` — the corridor, the creature, the walker, the camera rig, reveal choreography.
- `src/scenes/textures.ts` — procedural PBR surfaces.
- `src/ui/` — app chrome and columns, guide caption, HUD, record panel, studio, boot.
- `src/engine/audio.ts` — procedural sound.
- `src/engine/net.ts` — realtime client: connect, rooms, say, presence, reconnect.
- `server/index.mjs` — the realtime server.

## What is simulated, and what comes next

- The live stream is a rendered scene, not video. The real product overlays a creator's stream (OBS browser source first).
- Generated scenes are rendered in-engine and tagged as H3 Max output. The next step is a server-side fal.ai proxy driving the `generation` state that already exists in the store.
- The wider audience and the odds are bots tuned to the pacing model in the PRD; the room's chat is real.
- Chat history is in memory on the server. Predictions and interrupts are still per-viewer; sharing them across the room is the next backend step.
- Influence is never bought with money. Predictions and purchases are always labelled separately.

Built with Vite, React 19, react-three-fiber, drei, postprocessing, GSAP and zustand.
