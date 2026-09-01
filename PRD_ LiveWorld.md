# PRD: LiveWorld
## Twitch 2.0 — Programmable Live Entertainment

**Version:** 0.1  
**Stage:** MVP / Prototype  
**Primary platform:** Web  
**Video generation:** fal.ai MiniMax H3 Max  
**Working category:** Interactive Live Worlds / Programmable Anticipation

---

# 1. Product Summary

LiveWorld is a live entertainment platform where viewers do more than watch or chat.

They:

- predict what will happen
- anticipate outcomes
- influence events
- interrupt expected outcomes
- trigger AI-generated scenes
- receive status and recognition
- create persistent consequences
- return to worlds that remember what happened

The fundamental content primitive is:

**Expectation → Anticipation → Interaction → Interrupt → Outcome → Reward → Memory**

Example:

A creator is walking toward a locked door.

The audience sees:

> "What's behind the door?"

70% predict treasure.

A 20-second countdown starts.

During the countdown viewers can:

- buy clues
- reinforce their prediction
- secretly modify the room
- unlock a rare interrupt

The creator opens the door.

Instead of treasure, the video cuts seamlessly into an AI-generated scene of a monster emerging from the room.

> INTERRUPT TRIGGERED BY @Alex

Chat explodes.

A new question appears:

> "Can the creator survive?"

A new anticipation loop immediately begins.

---

# 2. Product Thesis

Existing live platforms are built around:

**Creator → Stream → Viewer → Chat**

LiveWorld should operate as:

**Creator + Audience + AI → World State → Uncertain Events → Live Outcomes**

The viewer should repeatedly experience:

### "I think X is going to happen."

followed by:

### "Wait... Y happened."

followed by:

### "Did we cause that?"

followed by:

### "What happens next?"

The product is therefore not primarily a livestreaming product.

It is an **uncertainty and causality engine for live entertainment.**

---

# 3. Why H3 Changes the Product

Historically, interactive livestreaming can modify:

- overlays
- game state
- polls
- sounds
- animations
- text

Generative video allows us to modify **reality itself**.

Instead of:

> "A monster appeared" text overlay

the system generates:

> A five-second cinematic sequence showing the monster physically entering the creator's world.

Instead of displaying:

> "The city has been destroyed"

the audience sees an AI-generated version of the city being destroyed.

This allows the platform to make impossible audience actions visually real.

---

# 4. H3 Model Strategy

LiveWorld should use two H3 modes.

## Runtime Model

### MiniMax H3 Max

Use for:

- live interrupts
- surprise scenes
- character reactions
- transformations
- environmental changes
- short narrative branches
- generated transitions
- audience-triggered outcomes

Default:

- 5 seconds
- 768p desktop
- 480p low-bandwidth/mobile
- `prompt_expansion_mode: balanced`
- native audio
- asynchronous generation

H3 Max is appropriate because latency matters more than 2K resolution.

fal currently documents H3 Max at 480p/768p and exposes duration, aspect ratio, seed, safety checking and prompt-expansion controls.

---

## Cinematic Model

### MiniMax H3

Use standard H3 for:

- opening cinematics
- world introduction
- trailers
- character establishment
- premium replay clips
- episode recaps
- high-resolution story sequences
- creator-exportable highlights

Standard H3 supports up to 2K, native stereo audio, multimodal references, first/last-frame control and video editing.

---

# 5. Critical Architecture Principle

## Do NOT generate the entire livestream.

That would introduce:

- latency
- cost
- instability
- identity drift
- moderation complexity

Instead:

### Live stream = reality layer

### H3 = reality interruption layer

Example:

```text
CREATOR STREAM
      │
      │
      ▼
Normal gameplay
      │
      │
 ANTICIPATION
      │
      ▼
3...2...1...
      │
      ▼
H3 GENERATED INTERRUPT
      │
      ▼
Return to livestream
      │
      ▼
New consequence
```

A generated clip should usually last:

**3–10 seconds**

and alter the narrative state.

---

# 6. Product Goal

Create a live experience where a viewer encounters a meaningful:

**predict → intervene → reveal → reward**

loop within the first **3 minutes** of entering.

---

# 7. North Star Metric

## Meaningful Interactions per Viewer Hour

A meaningful interaction changes one of:

- viewer expectation
- world state
- creator behavior
- narrative outcome
- viewer status
- community outcome

Do not count:

- ordinary chat
- emoji reactions
- passive likes

---

# 8. Supporting Metrics

### Viewer

- interaction participation rate
- predictions/viewer
- interventions/viewer
- viewer session duration
- anticipation hold rate
- reveal retention
- repeat-viewer rate
- world return rate
- clips shared
- faction participation

### Creator

- time to first interactive world
- live experiences created/week
- creator D7 retention
- creator D30 retention
- events triggered/hour
- revenue/viewer hour

### AI

- generation success rate
- generation latency
- interrupt delivery latency
- continuity rating
- prompt-adherence rating
- safety rejection rate
- generated-scene reuse rate

---

# 9. Core Psychological Model

The experience must continuously create unresolved loops.

## Phase 1 — Expectation

Make the viewer form a mental prediction.

Examples:

> "Sarah is probably the traitor."

> "Door B contains the money."

> "The streamer will survive."

> "Team Red will win."

No expectation = no meaningful surprise.

---

# 10. Phase 2 — Anticipation

The platform delays resolution.

Tools:

- countdown
- progress meter
- hidden information
- probability
- clues
- factions
- escalating audio
- partial reveals
- locked actions
- accumulating stakes

Example:

```text
THE DOOR OPENS IN

00:18

Treasure       67%
Monster        21%
Nothing        12%

54,293 predictions

⚠ An interrupt is possible.
```

---

# 11. Phase 3 — Interaction

Allow viewers to influence the state before resolution.

Possible actions:

### Vote

"Which door?"

### Predict

"What will happen?"

### Modify

"Add another enemy."

### Protect

"Give creator a shield."

### Sabotage

"Remove creator's weapon."

### Reveal

"Buy a clue."

### Collaborate

"Everyone contribute to unlock the vault."

### Secret action

Only the actor knows what they triggered.

---

# 12. Phase 4 — Interrupt

The expected trajectory changes.

Example:

Audience expectation:

> Creator receives treasure.

Interrupt:

> Someone activates "Cursed Treasure."

H3 generates:

A five-second clip where the chest cracks open, black smoke pours out and a creature emerges.

The stream resumes.

New world state:

```text
Boss active = TRUE
Creator health = 73
Curse = ACTIVE
```

---

# 13. Phase 5 — Causal Attribution

The viewer must understand **why** the unexpected thing happened.

Show:

> CURSED CHEST  
> Triggered by @Malav

or:

> TEAM RED UNLOCKED THIS EVENT

or:

> 3% CHAOS EVENT ACTIVATED

This produces:

### "I caused that."

which is much stronger than:

### "I watched that."

---

# 14. Phase 6 — Psychological Reward

Rewards should not primarily be currency.

There are six core reward classes.

## Agency

"I changed reality."

## Recognition

"The creator saw what I did."

## Prediction

"I knew something before everyone else."

## Status

"My history proves I'm good at this."

## Discovery

"I discovered something others didn't."

## Narrative ownership

"Something I did yesterday matters today."

---

# 15. Phase 7 — Memory

Every meaningful event updates persistent world state.

Example:

```text
Viewer: Malav

Saved Kai
Episode 14

Betrayed Team Red
Episode 17

Discovered Vault #12
Episode 22

Released The Entity
Episode 29
```

AI characters can use this later.

Example:

> "You again. You're the one who released me."

The experience becomes relational rather than transactional.

---

# 16. Three Time Horizons

Every world should contain three simultaneous loops.

## NOW

Seconds.

> Vote now.

> Attack now.

> Save him.

## SOON

Minutes.

> The vault opens in 8 minutes.

> Someone will be eliminated.

## LATER

Hours/days.

> The invasion begins tomorrow.

> The missing character hasn't returned.

This gives viewers three reasons to remain attached.

---

# 17. Primary Personas

## Persona A — Creator

Wants:

- entertaining streams
- higher retention
- more viewer participation
- monetization
- differentiated content

Does NOT want:

- coding
- game development
- manually scripting 50 events

---

## Persona B — Active Viewer

Wants:

- agency
- recognition
- social status
- community
- surprises

---

## Persona C — Lurker

Initially wants:

- entertainment

We gradually convert them:

```text
WATCH
↓
PREDICT
↓
VOTE
↓
INTERVENE
↓
IDENTITY
↓
FACTION
↓
WORLD MEMBER
```

---

# 18. Creator Experience

Creator lands on:

## Create Live Experience

Prompt:

> "Describe tonight's stream."

Example:

> "I'm playing a horror game for 90 minutes. Let viewers predict whether I survive each room. They should occasionally be able to spawn supernatural events and sabotage me."

AI returns:

### Act 1
Low-risk predictions

### Act 2
Viewer sabotage introduced

### Act 3
Hidden monster mechanic

### Act 4
Community boss

### Finale
Rare irreversible decision

Creator clicks:

**Launch World**

---

# 19. Creator Event Builder

Advanced creators get:

```text
WHEN

[ viewer prediction reaches 70% ]

AND

[ creator enters room ]

THEN

[ open interrupt window ]

IF

[ chaos meter > 80 ]

THEN

[ generate monster event ]

AFTER

[ launch survival prediction ]
```

Think:

**Zapier × Twitch × D&D dungeon master**

---

# 20. Core Event Object

Every event contains:

```text
EVENT

Expectation
What does the viewer believe?

Anticipation
How long before resolution?

Prediction
What can viewers predict?

Interventions
What can viewers change?

Expected Outcome
What appears likely?

Interrupts
What could violate expectation?

Reveal
How is reality revealed?

Reward
Who receives recognition?

Consequence
What changes permanently?

Next Hook
What question replaces this one?
```

The final property is crucial.

Every resolved loop should spawn another unresolved loop.

---

# 21. AI Director

A central AI Director manages narrative pacing.

Inputs:

- chat velocity
- viewer count
- interaction rate
- viewer departures
- predictions
- recent events
- creator state
- generated-video status
- narrative state
- world history

Output:

```text
DO NOTHING
CREATE EXPECTATION
ESCALATE
REVEAL CLUE
OPEN INTERRUPT
TRIGGER INTERRUPT
DELAY RESOLUTION
RESOLVE
START NEW LOOP
```

---

# 22. Pacing Model

The Director should not maximize constant stimulation.

Desired emotional curve:

```text
CALM
  ↓
CURIOSITY
  ↓
EXPECTATION
  ↓
ANTICIPATION
  ↓
TENSION
  ↓
INTERRUPT
  ↓
CHAOS
  ↓
PAYOFF
  ↓
RELIEF
  ↓
NEW QUESTION
```

Without calm, chaos becomes normal.

Without expectation, interruption becomes noise.

---

# 23. H3 Generation Engine

The Generation Engine transforms abstract events into audiovisual interruptions.

Input:

```text
WORLD STATE

Characters
Environment
Creator
Current event
Expected outcome
Interrupt
Visual style
Camera
Duration
Audio
Continuity references
```

Output:

```text
H3 PROMPT
+
REFERENCE IMAGE/VIDEO
+
GENERATION PARAMETERS
```

---

# 24. Example Runtime Prompt

World state:

```text
Location:
abandoned underground laboratory

Character:
masked creature

Expected:
creator opens empty storage room

Interrupt:
creature suddenly appears

Duration:
5 seconds
```

Generated prompt concept:

> Continue the established abandoned underground laboratory. The storage door opens into darkness. For the first second nothing happens. A distorted masked humanoid suddenly lunges forward from behind the doorway. Handheld camera recoil. Flickering fluorescent lighting. Metallic impact and startled breathing. Maintain the established environment and creature appearance.

Result becomes the reveal.

---

# 25. Latency Architecture

The product should hide generation latency through anticipation.

This is fundamental.

## Don't do:

Viewer clicks interrupt.

↓  

Blank loading screen.

↓  

AI video appears.

---

## Do:

Viewer activates interrupt.

↓

System shows:

> SOMETHING HAS CHANGED

↓

Countdown continues.

↓

H3 generation runs invisibly.

↓

Reveal moment arrives.

↓

Generated video plays immediately.

The psychological mechanic becomes the latency solution.

---

# 26. Predictive Generation

Even better:

Generate likely branches **before viewers choose**.

Example:

Question:

> "Which artifact should Kai touch?"

Options:

A  
B  
C

While viewers vote:

H3 generates:

```text
A outcome
B outcome
C outcome
```

At resolution:

Winning branch plays instantly.

The user experiences zero generation latency.

---

# 27. Branch Prefetch System

At any moment:

```text
CURRENT STATE
      │
 ┌────┼────┐
 │    │    │
 ▼    ▼    ▼
 A    B    C

Generate probable futures
before resolution.
```

Priority should depend on:

`P(branch) × importance × generation latency`

Generate high-probability branches first.

---

# 28. Dynamic Interrupt Generation

Not every possibility should be pre-generated.

Example:

A viewer unexpectedly triggers:

> "Replace monster with giant rabbit."

Now:

1. freeze interrupt choice
2. create 3–5 second anticipation window
3. submit H3 Max request
4. continue creator footage
5. show environmental warning
6. receive H3 asset
7. trigger transition
8. play generated scene
9. return to live world

---

# 29. Generation Fallback

AI generation cannot be allowed to break the live experience.

If video is not available at reveal deadline:

### Fallback 1

Extend anticipation naturally.

> "Something is approaching..."

### Fallback 2

Use pre-generated generic animation.

### Fallback 3

Use overlay/audio event.

Never show:

> Generating...

to viewers.

---

# 30. Continuity

Worlds need visual memory.

Each world stores a:

## World Reference Pack

Including:

- character reference images
- environment reference
- costumes
- key props
- visual style
- creator avatar
- important NPCs
- color/light state
- recent generated frame

Reference-to-video and image-to-video are then used whenever continuity is more important than pure text-to-video. H3/H3 Max expose image/reference-conditioned workflows suitable for this use case.

---

# 31. Native Audio

Generated interruptions should include:

- dialogue
- environmental sound
- effects
- creature sounds
- transition audio

Avoid switching to generic background music for every generated sequence.

H3 generates audiovisual output natively, so the interrupt should feel like an extension of the world rather than a silent insert.

---

# 32. Viewer Interface

Primary mobile layout:

```text
┌─────────────────────┐
│                     │
│     LIVE WORLD      │
│                     │
│                     │
├─────────────────────┤
│ ⚠ VAULT OPENS 00:31 │
│                     │
│ Monster       41%   │
│ Treasure      38%   │
│ Nothing       21%   │
│                     │
│ [ PREDICT ]         │
│                     │
│ CHAOS ███████░ 74%  │
│                     │
│ [INTERVENE] [CLUE]  │
└─────────────────────┘
```

Video remains dominant.

Interaction appears contextually.

---

# 33. Interrupt Interface

When an interrupt becomes available:

```text
RARE INTERRUPT

CURSE THE CHEST

Cost:
3,000 influence

Outcome:
Unknown

Available:
8 seconds

[ ACTIVATE ]
```

After activation:

```text
INTERRUPT LOCKED

Triggered by @Alex

Something has changed.
```

Do not reveal the consequence immediately.

Preserve anticipation.

---

# 34. Prediction Reputation

Predictions should create skill-based identity.

Example:

```text
MALAV

Prediction accuracy
72%

Contrarian wins
19

Average entry probability
31%

Legendary predictions
4

Rank
ORACLE III
```

Users should gain more recognition for correctly predicting low-consensus outcomes.

---

# 35. Viewer Archetypes

Actions organically create identities.

Examples:

### Oracle
Great predictor.

### Guardian
Frequently saves creators.

### Chaos Architect
Triggers unusual events.

### Explorer
Discovers secrets.

### Loyalist
Supports one faction.

### Kingmaker
Influences major outcomes.

These identities become social status.

---

# 36. Factions

Worlds can contain competing communities.

Example:

```text
THE REBELLION

42,190 members

vs

THE EMPIRE

38,741 members
```

Factions accumulate:

- territory
- influence
- resources
- history
- wins
- losses

This provides long-term retention independent of creator schedule.

---

# 37. Persistent World State

Eventually every creator owns a world.

Example:

```text
WORLD: THE UNDERGROUND

DAY 47

Population
184,921

Current ruler
Team Blue

Dead characters
12

Unsolved mysteries
4

Current threat
THE ENTITY

Threat level
████████░░ 81%

NEXT EVENT

Tomorrow
8:00 PM
```

The stream becomes an episode of the world rather than the world itself.

---

# 38. MVP Scope

The MVP should NOT attempt persistent worlds yet.

Build one loop extremely well:

# Predict → Anticipate → Interrupt → Reveal → Reward

---

# 39. MVP Features — P0

## Creator

- account
- create session
- stream embed / OBS integration
- AI experience prompt
- event creation
- countdown
- prediction
- vote
- interrupt
- H3 generation
- outcome
- reward
- basic analytics

## Viewer

- anonymous watch
- account
- prediction
- vote
- influence points
- interrupt
- XP
- username attribution
- event history

## AI

- Event Director
- prompt generation
- H3 Max generation
- branch pre-generation
- safety layer
- generation fallback

---

# 40. P1

After core retention is proven:

- factions
- inventory
- persistent world
- AI NPCs
- relationship memory
- secret actions
- creator marketplace
- world discovery
- viewer-generated quests

---

# 41. Explicit Non-Goals

MVP should NOT build:

- livestream CDN
- Twitch competitor infrastructure
- native mobile app
- crypto
- monetary betting
- open marketplace
- advanced avatar creator
- hundreds of games
- custom foundation model

Use Twitch/YouTube/video sources first.

Own the interaction layer.

---

# 42. Suggested Technical Architecture

```text
                  CREATOR
                     │
                     ▼
              CREATOR STUDIO
                     │
                     ▼
               EVENT ENGINE
                     │
          ┌──────────┼──────────┐
          │          │          │
          ▼          ▼          ▼
     WORLD STATE  DIRECTOR AI  RULE ENGINE
          │          │          │
          └──────────┼──────────┘
                     ▼
             ANTICIPATION ENGINE
                     │
             ┌───────┴───────┐
             │               │
             ▼               ▼
       LIVE OVERLAY     H3 GENERATOR
                             │
                             ▼
                       fal.ai H3 Max
                             │
                             ▼
                        ASSET CACHE
                             │
                             ▼
                        REVEAL ENGINE
                             │
                             ▼
                          VIEWER
                             │
                             ▼
                       REWARD ENGINE
                             │
                             ▼
                        WORLD STATE
```

---

# 43. Recommended Stack

### Frontend

Next.js / React

### Realtime

WebSockets

Potential options:

- Liveblocks
- Ably
- Supabase Realtime

### Backend

Node.js / TypeScript

### Database

Postgres

### Cache

Redis

### AI orchestration

LLM + deterministic rules

### Video

fal.ai

### Live integration

OBS Browser Source first

Then:

- Twitch
- YouTube

### Storage

Object storage/CDN for generated clips.

---

# 44. H3 Integration

Server only.

Never expose fal key to client applications. fal's documentation explicitly recommends a server-side proxy when integrating from browsers.

Conceptual call:

```text
Event Engine
↓
Prompt Compiler
↓
Generation Request
↓
fal H3 Max
↓
request_id
↓
Generation Queue
↓
Video URL
↓
Cache
↓
Reveal Engine
```

---

# 45. H3 Generation Modes

## MODE A — Live

H3 Max

```text
duration: 5
resolution: 768P
prompt expansion: balanced
```

Goal:

speed.

---

## MODE B — Mobile/Fast

H3 Max

```text
resolution: 480P
```

Goal:

lowest generation and transmission overhead.

---

## MODE C — Premium Scene

H3

```text
2K
5–15 seconds
```

Goal:

quality.

---

## MODE D — Continuity

H3 Max reference/image-to-video.

Goal:

maintain character or environment.

---

# 46. Cost Philosophy

Do not generate video continuously.

Generation should correspond to **high-value emotional moments**.

A world might therefore contain:

- dozens of cheap UI interactions
- several overlay events
- a few generated interrupt moments

rather than hundreds of generated clips.

At fal's currently listed standard H3 Max rate, 768p output is $0.08/second, so a 5-second generated moment is roughly $0.40 before any extra reference-input costs.

The desired economics are therefore:

```text
1 AI video
↓
thousands of viewers experience it
↓
thousands of interactions
↓
multiple clips/social moments
```

Generation cost becomes extremely attractive at scale because one inference can entertain the entire audience.

---

# 47. Viral Loop

Major event occurs.

↓

System automatically captures:

**10 sec before + generated interruption + 10 sec after**

↓

Creates vertical clip:

> "20,000 viewers thought he was about to win..."

↓

"...then ONE viewer did this."

↓

Share to TikTok/Reels/Shorts.

↓

Viewer sees unusual moment.

↓

CTA:

> CONTROL THE NEXT ONE LIVE

↓

New user enters active world.

This should become the primary acquisition loop.

---

# 48. Discovery

Do not primarily show creator thumbnails.

Show **unresolved situations**.

Bad:

> RyanGaming  
> 8.2K watching

Good:

> 18,201 people think Ryan is about to open the wrong door.

**Opens in 01:42**

[ENTER]

Another:

> Team Red has been planning this betrayal for six hours.

**Happening now**

[ENTER]

Discovery itself should contain anticipation.

---

# 49. Ethical Design Constraints

Psychological mechanisms should create entertainment rather than exploit compulsion.

Therefore:

- clearly distinguish purchases from predictions
- no real-money wagering in MVP
- disclose probabilistic mechanics where appropriate
- spending limits
- age-sensitive monetization controls
- no fake viewer activity
- no fake scarcity
- no secretly altering paid outcomes
- creator-configurable intensity
- viewer notification controls

The goal is uncertainty in the story, not uncertainty about what the product is charging users for.

---

# 50. MVP Experiment

Do NOT launch a platform first.

Run a controlled experiment with:

**10 creators**

Each creator runs:

**5 streams**

Half:

standard livestream.

Half:

LiveWorld interactions.

Compare:

- average watch time
- 1-minute retention
- 5-minute retention
- interactions/viewer
- chat velocity
- repeat viewers
- clip shares
- monetization

Primary hypothesis:

> Viewers exposed to unresolved anticipation + consequential interruption loops remain longer and participate more than viewers exposed to ordinary polling/chat interactions.

---

# 51. First Use Case

Start with:

## Horror / Survival Stream

Why:

Expectation and interruption naturally fit.

Mechanics:

- will creator survive?
- what is behind the door?
- viewers spawn enemy
- viewers save creator
- hidden objects
- danger meter
- boss unlock
- cursed items
- secret rooms

H3-generated supernatural events can feel native rather than forced.

---

# 52. Example Full Loop

Creator approaches door.

### T = 0

System:

> WHAT IS BEHIND THE DOOR?

Predictions open.

---

### T = 10s

Results:

```text
TREASURE  72%
MONSTER   18%
EMPTY     10%
```

---

### T = 20s

System:

> ⚠ CHAOS INTERRUPT AVAILABLE

---

### T = 24s

@Alex activates:

**CURSED ROOM**

H3 generation starts.

---

### T = 25s

Audience sees:

> Something inside the room has changed.

Countdown:

```text
5
4
3
2
1
```

---

### T = 30s

Creator opens door.

H3 sequence plays.

A monster emerges.

---

### T = 35s

Stream resumes.

Screen:

> CURSED ROOM  
> Triggered by @Alex

---

### T = 37s

Reward:

```text
@Alex

+400 CHAOS XP

NEW TITLE:
DISRUPTOR
```

---

### T = 40s

Immediately:

> WILL THE CREATOR SURVIVE?

New prediction.

The loop continues.

---

# 53. 12-Week Build Plan

## Weeks 1–2

Foundation.

Build:

- creator account
- viewer account
- session model
- event model
- WebSocket infrastructure
- OBS overlay
- simple stream page

Success:

Creator can launch an interactive stream.

---

## Weeks 3–4

Expectation Engine.

Build:

- predictions
- polls
- countdowns
- outcomes
- points
- participation analytics

Success:

Predict → reveal loop works reliably.

---

## Weeks 5–6

H3 Integration.

Build:

- fal server integration
- H3 Max text-to-video
- H3 Max image-to-video
- video cache
- generation status
- asset preloading
- fallback system

Success:

AI-generated interruption can be inserted into a live experience.

---

## Weeks 7–8

Interrupt Engine.

Build:

- audience-triggered interrupt
- chaos meter
- rare actions
- branch pre-generation
- causal attribution
- automatic next event

Success:

Expectation → unexpected AI-generated outcome.

This is the first true **"magic moment."**

---

## Weeks 9–10

Reward Layer.

Build:

- XP
- prediction accuracy
- titles
- event history
- creator acknowledgment
- simple leaderboard

Success:

Viewer actions create persistent identity.

---

## Weeks 11–12

Director + Beta.

Build:

- AI event suggestions
- pacing rules
- engagement signals
- automated event generation
- analytics dashboard
- clip generator

Recruit:

10 creators.

Run controlled beta.

---

# 54. MVP Kill Criteria

Do not continue toward a standalone streaming network unless interactive experiences demonstrate meaningful improvement.

Example thresholds to investigate:

### Participation

> 25%+ viewers perform at least one interaction.

### Interaction density

> 3+ meaningful actions per active viewer hour.

### Anticipation hold

Viewers who enter an anticipation loop should have materially higher reveal retention.

### Retention

Interactive sessions should outperform creator baselines.

### Creator pull

Creators voluntarily run another LiveWorld session.

The most important signal:

> "My normal stream now feels boring without this."

---

# 55. Post-MVP Roadmap

```text
INTERACTIVE STREAM PLUGIN
         ↓
VIEWER IDENTITY
         ↓
AI DIRECTOR
         ↓
PERSISTENT WORLD
         ↓
AI CHARACTERS
         ↓
WORLD DISCOVERY
         ↓
CREATOR ECONOMY
         ↓
NATIVE LIVE PLATFORM
```

---

# 56. Ultimate Product

Eventually a user doesn't open LiveWorld asking:

> "Who is streaming?"

They ask:

> **"What's happening right now?"**

Homepage:

> A civilization of 4,000 AI characters is voting on whether to start a war.

> 78,000 viewers are trying to keep one creator alive for 24 hours.

> Nobody knows who the traitor is. The reveal happens in 11 minutes.

> Team Red just discovered something Team Blue wasn't supposed to know.

> An AI character who disappeared three weeks ago just returned.

And every event has one button:

# ENTER

---

# 57. Strategic Moat

The moat is not H3.

Models will improve and become interchangeable.

The moat becomes the accumulated:

- interaction graph
- viewer identity graph
- creator graph
- world state
- narrative memory
- event templates
- prediction history
- interaction-performance dataset
- knowledge of which expectation/interrupt structures create compelling live experiences

Eventually LiveWorld learns:

> Given this audience, creator, narrative state and emotional intensity, what should happen next?

That becomes the proprietary layer.

---

# 58. Product Principle

Every major feature should pass this test:

### Does it make the viewer wonder what happens next?

### Can the viewer influence that outcome?

### Can something violate their expectation?

### Does the outcome create a consequence?

### Does the system remember it?

If yes:

it belongs in LiveWorld.

If not:

it is probably just another Twitch feature.

---

# Final Product Definition

**LiveWorld is an AI-native live entertainment platform where audiences predict, influence and interrupt unfolding worlds, with generative video turning their actions into visible reality.**

Its atomic unit is not:

**the stream**

or:

**the video**

or:

**the chat message.**

It is:

# Expectation → Anticipation → Interrupt → Outcome → Reward → Memory