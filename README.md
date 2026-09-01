# LiveWorld

**A film you can interrupt.**

Live entertainment today is a one-way pipe: a creator streams, an audience watches, a chat scrolls past. LiveWorld starts from a different idea. The audience should be able to *bet on what happens next, change it, and watch reality bend* because they did. Generated video (fal.ai MiniMax H3) turns an audience decision into a five-second cinematic moment that everyone sees at once, and the world remembers it afterwards.

This repository is a playable prototype of that idea, built as an immersive, TV-like experience in the browser. There is no backend yet; the audience, the odds, and the video generation are simulated so the whole loop can be felt end to end.

The atomic unit is not a stream, a video, or a chat message. It is a loop:

**Expectation → Anticipation → Interaction → Interrupt → Reveal → Attribution → Reward → Memory**

---

## What it feels like

You turn a dial of movie posters. Each one is an unresolved situation, not a creator thumbnail: *"41,208 people think Ilya is about to open the server-room door. He has not blinked in four minutes."* You press Enter.

You are in a letterboxed picture: a wet concrete corridor, tungsten tubes flickering, a figure walking toward a door. A question appears as a subtitle: *What did Ilya see behind the door?* Three outcomes, live odds, a countdown. You predict. The crowd shifts. Chaos rises.

A card slides in. **Rare interrupt: Pull the plug. Cost 3,000 influence. Outcome unknown. Nine seconds.** You activate it. The corridor dims and reddens. *Something has changed.* The fans stop spinning. The countdown hits five, four, three...

The door opens. The picture flashes. Something that is not the model lunges out of the dark. An intertitle: *It was not the model.* Then: *Someone pulled the plug, triggered by @you.* Then the credits roll: +545 XP for a contrarian call, +400 chaos XP for changing what happened, a new title, **Disruptor**, kept in this world forever.

And immediately: *Does the safety team survive the night?* A new loop begins.

---

## Capabilities

### The loop engine
- **Six-phase state machine** driving every scene: calm, expectation, anticipation, reveal, attribution, reward. Each resolved loop spawns the next question with no dead air.
- **Simulated audience**: odds drift toward the expected outcome with growing noise as the clock runs down, prediction counts climb, chat velocity follows tension.
- **Chaos meter** that rises with participation and opens rare interrupt windows when it crosses a threshold. If chaos is very high, another viewer may take the interrupt before you.
- **Interrupts** of four kinds (chaos, sabotage, protect, modify), each forcing a specific outcome. Activating one shortens the countdown, dims the world, and shows an omen, never a loading state.
- **Latency hidden by anticipation**: the simulated H3 generation moves through queued → rendering → ready behind the countdown, exactly as the product design intends.
- **Rewards scaled to conviction**: correct predictions pay more the lower the odds you entered at. Contrarian wins and legendary calls are tracked separately.
- **Persistent memory**: every meaningful act becomes an entry in your record with the episode number, and titles unlock the first time you earn them.

### The picture (Three.js)
- A real-time 3D "reality layer" standing in for the live stream: a corridor with procedurally generated PBR surfaces (colour, normal and roughness maps from value noise, no downloads), a wet reflective floor, tiled walls, ribs, pipes, crates, a steel door with a badge reader, and a server room behind it.
- **Real shadows** from the creator's headlamp and a ceiling tube, plus fake volumetric light cones and drifting dust.
- An **articulated walker** whose limbs swing from the hips and shoulders as they approach the door.
- An **organic creature** built from a distorting mesh with spikes and glowing eyes.
- **Per-outcome cinematography** choreographed with GSAP: door swing, camera push-in, red wash, shake, chromatic aberration, glitch, gold glow, shield shockwave, retreat, blackout.
- Cinematic post-processing: depth of field focused on the creator, bloom, ACES tone mapping, film grain, vignette, anti-aliasing.

### The interface (GSAP + CSS)
- **A24-style visual identity**: 35mm grain, letterboxed picture, cream ink on warm black, high-contrast Bodoni intertitles, tracked small caps, credits with dotted leaders.
- **Studio ident** boot sequence.
- **Poster dial**: worlds as one-sheets on a 3D ring you turn like a channel knob, with a logline and timing beneath the front poster.
- **Subtitle-style HUD** inside the bottom letterbox bar: question, three odds with crowd marker and live deltas, countdown, chaos hairline, reinforce and clue actions.
- **Three time horizons** in the top bar: what is happening now, what happens soon, what happens later.
- **Simulated chat rail** that reacts to the phase and to what you do.
- **Intertitles** for reveal, attribution ("triggered by @you"), and end-credit rewards.
- **Your record**: rank (Watcher → Seer → Oracle III), accuracy, contrarian wins, chaos XP, titles, and a history that worlds remember.
- **Creator studio**: describe tonight's stream, choose an intensity, get a five-act Director plan with WHEN/THEN rules, and launch it as a new world.
- Procedural audio: a tension drone, clock ticks under ten seconds, an impact at the reveal, a chime at reward. No audio files.
- TV-remote keyboard model, full mouse and touch support, mobile layout, reduced-motion support.

### The worlds
Six situations, each with three loops, written as good-natured parody of the people who talk about AI for a living:

| World | Situation |
| --- | --- |
| **What Did Ilya See** | Some doors should stay closed. This one has a badge reader. |
| **Hour Four** | A four-hour conversation about love, death and the transformer. Someone is lying. |
| **The Follow-Up Question** | He read the paper, the appendix, and the footnote you hoped nobody would. |
| **The Kitchen Keynote** | Hour nineteen. The leather jacket has not come off. |
| **Jamie, Pull That Up** | An elk has entered the studio. The guest is a physicist. |
| **Poker Night** | Four besties. One pot. Somebody bluffed about a fund size. |

---

## Run it

```bash
pnpm install
pnpm dev        # http://localhost:5173
pnpm build      # production build in dist/
```

## Controls

| Key | Does |
| --- | --- |
| ← → | Turn the dial between situations |
| Enter | Enter a world · activate an interrupt when one is offered |
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
- `src/scenes/WorldScene.tsx` — the 3D corridor, the creature, the walker, the camera rig, reveal choreography.
- `src/scenes/textures.ts` — procedural PBR surfaces.
- `src/scenes/GuideScene.tsx` — light leaks and dust behind the poster dial.
- `src/ui/` — boot, guide, HUD, panel, studio, shared chrome.
- `src/engine/audio.ts` — procedural sound.

## What is simulated, and what comes next

- The live stream is a rendered scene, not video. The real product overlays a creator's stream (OBS browser source first).
- Generated scenes are rendered in-engine and tagged as H3 Max output. The next step is a server-side fal.ai proxy driving the `generation` state that already exists in the store.
- Audience, odds and chat are bots tuned to the pacing model in the PRD.
- Influence is never bought with money. Predictions and purchases are always labelled separately.

Built with Vite, React 19, react-three-fiber, drei, postprocessing, GSAP and zustand.
