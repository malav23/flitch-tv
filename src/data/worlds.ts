// Situations, not streams. Discovery shows unresolved questions.
// Outcome ids are fixed (the 3D scene keys on them); labels and copy are per world.

export type OutcomeId = string

export interface LoopOption {
  id: OutcomeId
  label: string
  baseP: number
}

export interface Interrupt {
  id: string
  name: string
  kind: 'sabotage' | 'protect' | 'modify' | 'chaos'
  cost: number
  forces: OutcomeId
  title: string
  xp: number
  unlocks: string
  omen: string
}

export type SceneKey =
  | 'treasure' | 'monster' | 'empty'
  | 'survive' | 'wounded' | 'dies'
  | 'vent-nothing' | 'vent-creature' | 'vent-child'

export interface Loop {
  id: 'door' | 'survive' | 'vent'
  question: string
  place: string
  options: LoopOption[]
  duration: number
  expected: OutcomeId
  interrupts: Interrupt[]
  reveals: Record<OutcomeId, { headline: string; consequence: string; scene: SceneKey }>
  clue: string
}

export interface World {
  id: string
  name: string
  /** Poster tagline, set like an A24 one-sheet */
  tagline: string
  creator: string
  situation: string
  timing: string
  live: boolean
  viewers: number
  day: number
  threat: number
  mood: string
  /** Poster ink colour */
  poster: string
  /** Muted accent used in the world HUD */
  accent: string
  loops: Loop[]
}

// ------------------------------------------------------------ loop factory

type DoorCopy = {
  question: string; place: string; clue: string
  treasure: [string, string, string]; monster: [string, string, string]; empty: [string, string, string]
  interrupt: { name: string; title: string; unlocks: string; omen: string; cost?: number }
  p?: [number, number, number]
}
type SurviveCopy = {
  question: string; place: string; clue: string
  survive: [string, string, string]; wounded: [string, string, string]; dies: [string, string, string]
  protect: { name: string; title: string; unlocks: string; omen: string }
  sabotage: { name: string; title: string; unlocks: string; omen: string }
  p?: [number, number, number]
}
type VentCopy = {
  question: string; place: string; clue: string
  nothing: [string, string, string]; creature: [string, string, string]; child: [string, string, string]
  interrupt: { name: string; title: string; unlocks: string; omen: string }
  p?: [number, number, number]
}

// [label, headline, consequence]
const door = (c: DoorCopy): Loop => ({
  id: 'door',
  question: c.question,
  place: c.place,
  options: [
    { id: 'treasure', label: c.treasure[0], baseP: c.p?.[0] ?? 0.64 },
    { id: 'monster', label: c.monster[0], baseP: c.p?.[1] ?? 0.22 },
    { id: 'empty', label: c.empty[0], baseP: c.p?.[2] ?? 0.14 },
  ],
  duration: 32,
  expected: 'treasure',
  interrupts: [{ id: 'curse', name: c.interrupt.name, kind: 'chaos', cost: c.interrupt.cost ?? 3000, forces: 'monster', title: c.interrupt.title, xp: 400, unlocks: c.interrupt.unlocks, omen: c.interrupt.omen }],
  reveals: {
    treasure: { headline: c.treasure[1], consequence: c.treasure[2], scene: 'treasure' },
    monster: { headline: c.monster[1], consequence: c.monster[2], scene: 'monster' },
    empty: { headline: c.empty[1], consequence: c.empty[2], scene: 'empty' },
  },
  clue: c.clue,
})

const survive = (c: SurviveCopy): Loop => ({
  id: 'survive',
  question: c.question,
  place: c.place,
  options: [
    { id: 'survive', label: c.survive[0], baseP: c.p?.[0] ?? 0.42 },
    { id: 'wounded', label: c.wounded[0], baseP: c.p?.[1] ?? 0.4 },
    { id: 'dies', label: c.dies[0], baseP: c.p?.[2] ?? 0.18 },
  ],
  duration: 26,
  expected: 'wounded',
  interrupts: [
    { id: 'shield', name: c.protect.name, kind: 'protect', cost: 1800, forces: 'survive', title: c.protect.title, xp: 300, unlocks: c.protect.unlocks, omen: c.protect.omen },
    { id: 'disarm', name: c.sabotage.name, kind: 'sabotage', cost: 2200, forces: 'dies', title: c.sabotage.title, xp: 350, unlocks: c.sabotage.unlocks, omen: c.sabotage.omen },
  ],
  reveals: {
    survive: { headline: c.survive[1], consequence: c.survive[2], scene: 'survive' },
    wounded: { headline: c.wounded[1], consequence: c.wounded[2], scene: 'wounded' },
    dies: { headline: c.dies[1], consequence: c.dies[2], scene: 'dies' },
  },
  clue: c.clue,
})

const vent = (c: VentCopy): Loop => ({
  id: 'vent',
  question: c.question,
  place: c.place,
  options: [
    { id: 'vent-nothing', label: c.nothing[0], baseP: c.p?.[0] ?? 0.5 },
    { id: 'vent-creature', label: c.creature[0], baseP: c.p?.[1] ?? 0.32 },
    { id: 'vent-child', label: c.child[0], baseP: c.p?.[2] ?? 0.18 },
  ],
  duration: 28,
  expected: 'vent-nothing',
  interrupts: [{ id: 'summon', name: c.interrupt.name, kind: 'chaos', cost: 4200, forces: 'vent-creature', title: c.interrupt.title, xp: 600, unlocks: c.interrupt.unlocks, omen: c.interrupt.omen }],
  reveals: {
    'vent-nothing': { headline: c.nothing[1], consequence: c.nothing[2], scene: 'vent-nothing' },
    'vent-creature': { headline: c.creature[1], consequence: c.creature[2], scene: 'vent-creature' },
    'vent-child': { headline: c.child[1], consequence: c.child[2], scene: 'vent-child' },
  },
  clue: c.clue,
})

// ------------------------------------------------------------ worlds

export const WORLDS: World[] = [
  {
    id: 'ilya',
    name: 'What Did Ilya See',
    tagline: 'Some doors should stay closed. This one has a badge reader.',
    creator: 'Ilya',
    situation: '41,208 people think Ilya is about to open the server-room door. He has not blinked in four minutes.',
    timing: 'Opens in 00:42',
    live: true,
    viewers: 41208,
    day: 47,
    threat: 0.81,
    mood: 'Horror',
    poster: '#8f2b2b',
    accent: '#d9b14a',
    loops: [
      door({
        question: 'What did Ilya see behind the door?',
        place: 'Sublevel 3 · Cluster B',
        clue: 'Thermal scan: the room is 6°C colder than the corridor. GPUs do not run cold.',
        treasure: ['AGI', 'It was already awake', 'Cluster B online · Ilya is smiling · Safety team paged'],
        monster: ['Something else', 'It was not the model', 'Boss active · Ilya health 73 · Cluster B locked'],
        empty: ['A Slack notification', 'Just a Slack notification', 'Nothing changed. Nothing is ever nothing.'],
        interrupt: { name: 'Pull the plug', title: 'Someone pulled the plug', unlocks: 'Disruptor', omen: 'The fans stop spinning.' },
      }),
      survive({
        question: 'Does the safety team survive the night?',
        place: 'Sublevel 3 · Cluster B',
        clue: 'It is drawn to compute. The cluster is still running.',
        survive: ['Survives', 'The fans come back on', 'Ilya health 73 → 100 · It retreated into the weights'],
        wounded: ['Escapes wounded', 'Barely out', 'Ilya health 73 → 31 · It is still in the building'],
        dies: ['Resigns via tweet', 'Signal lost', 'Run ended · A very calm tweet has been posted · Dead characters 13'],
        protect: { name: 'Grant more compute', title: 'Compute granted', unlocks: 'Guardian', omen: 'A hum builds in the walls.' },
        sabotage: { name: 'Revoke the badge', title: 'Badge revoked', unlocks: 'Saboteur', omen: 'The door light flickers once.' },
      }),
      vent({
        question: 'What is moving in the cooling vent?',
        place: 'Sublevel 2 · Cooling shaft',
        clue: 'Spectrogram shows a second rhythm under the fan. It is 4/4.',
        nothing: ['Just the fan', 'A fan, and dust', 'Threat level 81% → 78%'],
        creature: ['The model', 'It knows your username', 'The model is out of the sandbox · Threat level 81% → 97%'],
        child: ['An intern', 'An intern survived down here', 'New character: Kai, intern · Unsolved mysteries 4 → 5'],
        interrupt: { name: 'Whisper the prompt', title: 'The prompt was whispered', unlocks: 'Chaos architect', omen: 'The fan stops.' },
      }),
    ],
  },
  {
    id: 'lex',
    name: 'Hour Four',
    tagline: 'A conversation about love, death and the transformer. Someone at the table is lying.',
    creator: 'Lex',
    situation: 'Hour four of the podcast. 9,302 people think the guest is about to say the word “consciousness.”',
    timing: 'Reveal in 11:04',
    live: true,
    viewers: 9302,
    day: 8,
    threat: 0.42,
    mood: 'Mystery',
    poster: '#2f3a4a',
    accent: '#b9c5d3',
    loops: [
      door({
        question: 'Who walks through the studio door for hour five?',
        place: 'Austin · The black-suit studio',
        clue: 'Two coffees were ordered. One is a Diet Coke.',
        treasure: ['A second guest', 'A second guest, and a guitar', 'Runtime +3 hours · Lex is smiling · Chat is not'],
        monster: ['Something else', 'Not the guest anyone booked', 'Boss active · Lex health 73 · The suit is wrinkled'],
        empty: ['The Diet Coke', 'Just the Diet Coke', 'Nothing changed. He asked about love anyway.'],
        interrupt: { name: 'Ask about love', title: 'The love question was asked', unlocks: 'Disruptor', omen: 'The room goes very, very quiet.', cost: 2600 },
        p: [0.58, 0.24, 0.18],
      }),
      survive({
        question: 'Does the guest survive the love question?',
        place: 'Austin · Hour five',
        clue: 'The guest has done three podcasts this week. None asked about love.',
        survive: ['Answers beautifully', 'They answer beautifully', 'Clip of the year · Guest health 73 → 100'],
        wounded: ['Deflects to AGI timelines', 'Deflects to timelines', 'Guest health 73 → 31 · The word “consciousness” has been said'],
        dies: ['Leaves', 'Signal lost', 'The guest has left the studio · Runtime frozen at 4:47:12'],
        protect: { name: 'Hand them the guitar', title: 'The guitar was handed over', unlocks: 'Guardian', omen: 'A single string is plucked.' },
        sabotage: { name: 'Cut the coffee', title: 'The coffee was cut', unlocks: 'Saboteur', omen: 'The cup is empty.' },
      }),
      vent({
        question: 'What is in the suit jacket pocket?',
        place: 'Austin · Green room',
        clue: 'The pocket has weight. It is rectangular.',
        nothing: ['A folded question list', 'A folded question list', 'Threat level 42% → 39%'],
        creature: ['A signed contract', 'It knows your podcast history', 'A new show has been announced · Threat level 42% → 71%'],
        child: ['A tiny robot', 'A tiny robot survived in there', 'New character: Kai, the pocket robot · Unsolved mysteries 4 → 5'],
        interrupt: { name: 'Empty the pocket', title: 'The pocket was emptied', unlocks: 'Chaos architect', omen: 'Something clicks.' },
      }),
    ],
  },
  {
    id: 'dwarkesh',
    name: 'The Follow-Up Question',
    tagline: 'He read the paper. He read the appendix. He read the footnote you hoped nobody would.',
    creator: 'Dwarkesh',
    situation: 'Dwarkesh has a follow-up. 18,201 people think the guest cannot answer it. The pause is now nine seconds long.',
    timing: 'Happening now',
    live: true,
    viewers: 18201,
    day: 112,
    threat: 0.64,
    mood: 'Heist',
    poster: '#5b4a2f',
    accent: '#d9b14a',
    loops: [
      door({
        question: 'What is behind the follow-up question?',
        place: 'San Francisco · The bookshelf room',
        clue: 'The guest’s eyes moved to the appendix. Page 41.',
        treasure: ['A real answer', 'A real answer, with a scaling law', 'Guest inventory +3 · The bookshelf approves'],
        monster: ['A worse question', 'There was a second follow-up', 'Boss active · Guest health 73 · Nine more seconds of silence'],
        empty: ['“Great question”', 'Just “great question”', 'Nothing changed. Nothing is ever nothing.'],
        interrupt: { name: 'Hand him the footnote', title: 'The footnote was handed over', unlocks: 'Disruptor', omen: 'A page turns by itself.' },
        p: [0.55, 0.3, 0.15],
      }),
      survive({
        question: 'Does the guest survive the appendix?',
        place: 'San Francisco · Page 41',
        clue: 'The footnote cites the guest’s own earlier paper.',
        survive: ['Nails it', 'They nail it', 'Guest health 73 → 100 · New scaling law named live'],
        wounded: ['“We should talk offline”', 'Taken offline', 'Guest health 73 → 31 · A DM has been sent'],
        dies: ['Cites a blog post', 'Signal lost', 'Run ended · The blog post was theirs · Dead characters 13'],
        protect: { name: 'Slide over the whiteboard', title: 'The whiteboard was slid over', unlocks: 'Guardian', omen: 'A marker squeaks.' },
        sabotage: { name: 'Close the laptop', title: 'The laptop was closed', unlocks: 'Saboteur', omen: 'The screen goes dark.' },
      }),
      vent({
        question: 'What is behind the bookshelf?',
        place: 'San Francisco · Behind the books',
        clue: 'One book is spineless. It is the only one not read.',
        nothing: ['More books', 'More books', 'Threat level 64% → 61%'],
        creature: ['The transcript', 'It knows what you asked', 'The transcript is live · Threat level 64% → 88%'],
        child: ['A grad student', 'A grad student survived back there', 'New character: Kai, PhD candidate · Unsolved mysteries 4 → 5'],
        interrupt: { name: 'Pull the spineless book', title: 'The book was pulled', unlocks: 'Chaos architect', omen: 'The shelf breathes out.' },
      }),
    ],
  },
  {
    id: 'jensen',
    name: 'The Kitchen Keynote',
    tagline: 'Hour nineteen. The leather jacket has not come off. The more you watch, the more you save.',
    creator: 'Jensen',
    situation: '78,120 viewers are trying to keep one man in a leather jacket cooking for 24 hours. The oven is at 900°C.',
    timing: 'Hour 19 of 24',
    live: true,
    viewers: 78120,
    day: 1,
    threat: 0.9,
    mood: 'Survival',
    poster: '#4b6b3c',
    accent: '#a8d08d',
    loops: [
      door({
        question: 'What is in the oven?',
        place: 'The kitchen · Rack 7',
        clue: 'The oven has a 900°C setting. It is labelled “inference.”',
        treasure: ['A new GPU', 'A new GPU, medium rare', 'Inventory +3 · Stock +4% · Jacket intact'],
        monster: ['Something else', 'That is not a GPU', 'Boss active · Jensen health 73 · The jacket is smoking'],
        empty: ['A rack of nothing', 'An empty rack', 'Nothing changed. It was a supply-chain issue.'],
        interrupt: { name: 'Turn up the oven', title: 'The oven was turned up', unlocks: 'Disruptor', omen: 'The kitchen lights dim to brown.' },
        p: [0.7, 0.18, 0.12],
      }),
      survive({
        question: 'Does the jacket survive hour twenty?',
        place: 'The kitchen · Hour 20',
        clue: 'Leather ignites at 200°C. The oven door is open.',
        survive: ['Survives', 'The jacket survives', 'Jacket health 73 → 100 · A new jacket was announced anyway'],
        wounded: ['Singed', 'Barely out, singed', 'Jacket health 73 → 31 · Sleeve two is gone'],
        dies: ['Removed', 'Signal lost', 'The jacket has been removed on camera · Markets are closed'],
        protect: { name: 'Hand him oven mitts', title: 'Oven mitts were handed over', unlocks: 'Guardian', omen: 'Something soft lands on the counter.' },
        sabotage: { name: 'Hide the tongs', title: 'The tongs were hidden', unlocks: 'Saboteur', omen: 'A drawer closes on its own.' },
      }),
      vent({
        question: 'What is moving in the range hood?',
        place: 'The kitchen · Range hood',
        clue: 'The hood fan is drawing 800 watts. Fans do not need 800 watts.',
        nothing: ['Just the fan', 'A fan, and grease', 'Threat level 90% → 87%'],
        creature: ['The next chip', 'It has a roadmap', 'The next chip has escaped the hood · Threat level 90% → 99%'],
        child: ['A line cook', 'A line cook survived up there', 'New character: Kai, line cook · Unsolved mysteries 4 → 5'],
        interrupt: { name: 'Say “the more you buy”', title: 'The catchphrase was said', unlocks: 'Chaos architect', omen: 'The hood goes silent.' },
      }),
    ],
  },
  {
    id: 'rogan',
    name: 'Jamie, Pull That Up',
    tagline: 'An elk has entered the studio. The guest is a physicist. Nobody has left.',
    creator: 'Joe',
    situation: 'An elk is loose in the studio. 61,044 people think Jamie is about to pull up the wrong thing.',
    timing: 'Vote closes in 03:18',
    live: true,
    viewers: 61044,
    day: 301,
    threat: 0.73,
    mood: 'Survival',
    poster: '#6b3a2a',
    accent: '#e0a06a',
    loops: [
      door({
        question: 'What does Jamie pull up?',
        place: 'Austin · The red room',
        clue: 'Jamie’s cursor is on a tab called “definitely real.”',
        treasure: ['The actual study', 'The actual study', 'Inventory +3 · The guest nods · The elk is calm'],
        monster: ['Something else', 'That is not the study', 'Boss active · Joe health 73 · The elk has noticed'],
        empty: ['A blank tab', 'Just a blank tab', 'Nothing changed. “That’s wild, man.”'],
        interrupt: { name: 'Feed the elk', title: 'The elk was fed', unlocks: 'Disruptor', omen: 'Hooves on the floor.' },
        p: [0.52, 0.3, 0.18],
      }),
      survive({
        question: 'Does the guest survive the elk?',
        place: 'Austin · The red room',
        clue: 'Elk are drawn to movement. The guest is gesturing.',
        survive: ['Survives', 'The elk lies down', 'Guest health 73 → 100 · Episode is now 4h 40m'],
        wounded: ['Escapes to the sauna', 'Escapes to the sauna', 'Guest health 73 → 31 · The sauna is occupied'],
        dies: ['Antlered', 'Signal lost', 'Run ended · The guest has been gently antlered · Dead characters 13'],
        protect: { name: 'Give the guest a kettlebell', title: 'A kettlebell was provided', unlocks: 'Guardian', omen: 'Iron on concrete.' },
        sabotage: { name: 'Play the elk call', title: 'The elk call was played', unlocks: 'Saboteur', omen: 'The elk turns its head.' },
      }),
      vent({
        question: 'What is in the sensory-deprivation tank?',
        place: 'Austin · The tank room',
        clue: 'The tank is 400 kg over its rated weight.',
        nothing: ['Salt water', 'Salt water', 'Threat level 73% → 70%'],
        creature: ['A second elk', 'It has been in there the whole time', 'Second elk released · Threat level 73% → 96%'],
        child: ['A previous guest', 'A previous guest survived in there', 'New character: Kai, episode 1,400 · Unsolved mysteries 4 → 5'],
        interrupt: { name: 'Open the tank', title: 'The tank was opened', unlocks: 'Chaos architect', omen: 'Water on the floor.' },
      }),
    ],
  },
  {
    id: 'allin',
    name: 'Poker Night',
    tagline: 'Four besties. One pot. Somebody bluffed about a fund size.',
    creator: 'The Besties',
    situation: 'Poker night. 5,410 people think the pot is bigger than the fund. Someone is about to call.',
    timing: 'Happening now',
    live: true,
    viewers: 5410,
    day: 66,
    threat: 0.3,
    mood: 'Heist',
    poster: '#3b3247',
    accent: '#c9a0dc',
    loops: [
      door({
        question: 'What is in the pot?',
        place: 'The penthouse · Table one',
        clue: 'The chips are colour-coded by fund vintage. Most are 2021.',
        treasure: ['Real money', 'Real money, allegedly', 'Pot claimed · Wine cellar unlocked · Everyone is a “dictator”'],
        monster: ['A term sheet', 'It was a term sheet', 'Boss active · Bestie health 73 · The pot is now a company'],
        empty: ['Vibes', 'Just vibes', 'Nothing changed. Someone said “let your winners ride.”'],
        interrupt: { name: 'Raise with the house', title: 'The house was raised', unlocks: 'Disruptor', omen: 'A chair scrapes.' },
        p: [0.5, 0.32, 0.18],
      }),
      survive({
        question: 'Does the friendship survive the river card?',
        place: 'The penthouse · The river',
        clue: 'One bestie has been quiet for four minutes. That has never happened.',
        survive: ['Survives', 'Everybody laughs', 'Friendship health 73 → 100 · Wine tasting resumed'],
        wounded: ['Survives, with a rant', 'Survives, with a rant', 'Friendship health 73 → 31 · A rant has been scheduled'],
        dies: ['Someone leaves the group chat', 'Signal lost', 'Run ended · The group chat has one fewer member · Dead characters 13'],
        protect: { name: 'Open another bottle', title: 'Another bottle was opened', unlocks: 'Guardian', omen: 'A cork.' },
        sabotage: { name: 'Read the last text aloud', title: 'The text was read aloud', unlocks: 'Saboteur', omen: 'A phone lights up face-down.' },
      }),
      vent({
        question: 'What is in the humidor?',
        place: 'The penthouse · Humidor',
        clue: 'The humidor is at 70% humidity and 40% louder than it should be.',
        nothing: ['Cigars', 'Cigars', 'Threat level 30% → 27%'],
        creature: ['The old fund’s LP letter', 'It knows your carry', 'The LP letter is out · Threat level 30% → 66%'],
        child: ['A fifth bestie', 'A fifth bestie survived in there', 'New character: Kai, fifth bestie · Unsolved mysteries 4 → 5'],
        interrupt: { name: 'Open the humidor', title: 'The humidor was opened', unlocks: 'Chaos architect', omen: 'Cedar, and something else.' },
      }),
    ],
  },
  {
    id: 'roast',
    name: 'Roast Battle',
    tagline: 'Two comics. One mic. The crowd has receipts.',
    creator: 'The Cellar',
    situation: '12,480 people think the next joke ends a career. The roaster has not looked up from the cue cards.',
    timing: 'Next round in 00:35',
    live: true,
    viewers: 12480,
    day: 19,
    threat: 0.58,
    mood: 'Comedy',
    poster: '#6b2a6b',
    accent: '#e0a0e0',
    loops: [
      door({
        question: 'Who does the roaster go after next?',
        place: 'The Cellar · Stage left',
        clue: 'The cue card on top is blank. The one under it has a name circled twice.',
        treasure: ['The host', 'The host, and it lands', 'Host health −20 · Crowd +3 · Bar tab opened'],
        monster: ['The audience', 'The crowd was the target', 'Boss active: the front row · Roaster health 73 · Exits locked'],
        empty: ['Themselves', 'A self-own', 'Nothing changed. Everybody clapped politely.'],
        interrupt: { name: 'Leak the front row’s secrets', title: 'The front row was leaked', unlocks: 'Disruptor', omen: 'The mic feeds back once.', cost: 2400 },
        p: [0.56, 0.28, 0.16],
      }),
      survive({
        question: 'Does the comeback land?',
        place: 'The Cellar · Centre mic',
        clue: 'The comeback is eleven words long. The last one is a name.',
        survive: ['Kills', 'It kills', 'Roaster health 73 → 100 · Standing ovation · Clip of the night'],
        wounded: ['Gets a groan', 'A groan, then a laugh', 'Roaster health 73 → 31 · The host has taken the mic'],
        dies: ['Bombs', 'Silence', 'Run ended · You could hear the ice machine · Dead characters 13'],
        protect: { name: 'Cue the laugh track', title: 'The laugh track was cued', unlocks: 'Guardian', omen: 'A speaker hums.' },
        sabotage: { name: 'Cut the mic', title: 'The mic was cut', unlocks: 'Saboteur', omen: 'The red light on the mic goes dark.' },
      }),
      vent({
        question: 'What is on the last cue card?',
        place: 'The Cellar · Backstage',
        clue: 'The card is thicker than the others. Something is taped to it.',
        nothing: ['A safe joke', 'A safe joke about airports', 'Threat level 58% → 55%'],
        creature: ['The forbidden bit', 'It knows about the group chat', 'The forbidden bit is out · Threat level 58% → 91%'],
        child: ['A heckler’s name', 'A heckler survived being named', 'New character: Kai, heckler · Unsolved mysteries 4 → 5'],
        interrupt: { name: 'Swap the cue card', title: 'The cue card was swapped', unlocks: 'Chaos architect', omen: 'Paper rustles offstage.' },
      }),
    ],
  },
]

/** Default loop set used when the creator studio launches a new world */
export const HORROR_LOOPS: Loop[] = WORLDS[0].loops

export const CHAT_NAMES = [
  'alex_k', 'moonpatrol', 'quietvoid', 'dani', 'tobi.exe', 'sarah_w', 'hex', 'ghostbyte',
  'nour', 'kaitlin', 'oracle_pete', 'redteam_jo', 'bluefang', 'lurker404', 'mira', 'vaultkeeper',
]

/** {a} {b} {c} are the three option labels, {actor} the interrupt actor, {chaos} the meter */
export const CHAT_TEMPLATES: Record<string, string[]> = {
  expectation: [
    'here we go', '{a}. calling it', 'nah its {b}', 'clue says {b}. trust', 'DONT DO IT', 'please no',
    'i have 3k influence saved for this', 'contrarian on {c} lol', 'chaos is at {chaos}', 'someone buy a clue', 'this is the room from ep 22',
  ],
  anticipation: [
    'oh no', '{n} people on {b} now', 'the odds are shifting', 'who just intervened', 'chaos rising', 'why is it so quiet',
    'W A I T', 'i can hear breathing', 'lock in', 'reinforcing {a}',
  ],
  interrupt_window: ['INTERRUPT AVAILABLE', 'dont you dare', 'someone do it', 'DO IT', 'my heart', 'who has 3k', 'not again', 'chaos gang rise up', 'protect them!!!', 'the omen...'],
  omen: ['something changed', 'WHO DID THAT', 'the lights', 'oh the room changed', 'we are so cooked', 'im scared', 'no no no', 'it got colder', 'LOOK OUT'],
  reveal: ['AAAAAAAA', 'NO WAY', 'WHAT', 'I CALLED IT', 'clip it', 'CLIP IT', 'holy', 'RUN', '💀💀💀', 'oh my god'],
  attribution: ['@{actor} you monster', 'gg @{actor}', 'we did that', 'blame @{actor}', 'legendary', 'that was one person??'],
  reward: ['oracle gang', 'i knew it', 'give me my xp', 'contrarian W', 'whos next', 'again again'],
  calm: ['...', 'breathe', 'ok ok ok', 'what now', 'next question pls', 'the fan is still going'],
}
