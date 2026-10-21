# The Library of Doors — experience and voice audit

Initially reviewed against `d04eba3a2562e1a5164ce3e9127bce26d1cb0f10`, then reconciled with current upstream `e5e7841209746278ee3834542e0cb2e85da7d0da`. This is a source/design audit. The latest upstream handoff identifies the live site at https://library-of-doors.vercel.app and public Blob-hosted clips, narration and music. Those performances have not been auditioned in this review, and no gateway credentials are available here. Recommendations about vocal performance remain provisional until listening tests. The story maps are the source for this review; this is not an independent comparison with the full novels.

## The creative direction

Make the experience feel like a book that remembers Charmaine. The strongest existing idea is the consequence → echo → recognition loop: a promise made to Alex becomes a moral cost later; kindness to Unity becomes a memory that another scene can acknowledge. Develop that before adding more meters or more generated film.

The playable build originally contained eight scene nodes: the cold open, captivity, five conversations and a first-night endpoint. The four-book scope lives mostly in design documents. Treat this as the first night of The Sandman, not seven playable episodes or four completed games.

The near-term loop should be:

1. Notice something in the scene.
2. Speak, act, or deliberately stay silent.
3. See one immediate response.
4. Keep a comprehensible memory of what changed.
5. Encounter that memory in someone else's words or in the environment.
6. Return to the library and discover the next available chapter.

A player should be able to answer: “What am I trying to do now?”, “What did my last action change?”, and “Where will I continue tomorrow?” Avoid displaying ending formulas during a first playthrough.

## Existing production fixes retained

The newer upstream already adds tolerant JSON parsing (including extracting dialogue from truncated responses), a larger response token allowance, corrected transcript positioning, an inner-thought timeout, mobile startup/fullscreen/orientation handling, clip preloading, Blob media URLs, music crossfades/ducking, recorded narration/hooks and API warm-up. The handoff reports live verification; this review checked their source, not a live playback session. These improvements are preserved in the review branch.

## Findings and implemented changes

| Problem found in source | Result in this change |
|---|---|
| An AI-selected exit fired after 1.8 seconds, irrespective of reading or speech length. | The response suggests a visible Continue action. Only the player's click commits that exit. She can still speak again or choose another authored action. |
| TTS responses could arrive after leaving a scene; requests were not cancelled and object URLs were never released. | A single playback owner cancels requests, invalidates late responses, pauses existing audio and revokes URLs on replacement, completion or leaving. |
| Every TTS failure used the browser's default voice, flattening the cast. | Failure keeps subtitles and offers replay. Voice can be switched off. No automatic substitution of a different actor. |
| The client sent its newest line in both history and `playerLine`; the server appended it again and counted the final turn early. | Prior-history contract, compatibility normalization for the old client, and correct final-exchange counting. |
| A choice saved effects before saving its destination. A reload during its clip could revisit the choice with effects already awarded. | Effects, the decision record, journal and destination are saved together. Committed choices cannot apply twice. |
| The saved position was updated separately from the in-memory profile. | Arrival is an explicit state operation used for both resume and transitions. |
| `completed` existed but the first-night endpoint did not populate it. | `sandman.ep1` is awarded idempotently. No whole-book relic is awarded for one episode. |
| Missing clips advanced after four seconds, potentially hiding unread text or advancing while talking. | A missing clip becomes an explicit Continue reading beat. No fallback countdown. |
| Dialogue failure produced only “...”; mock mode gave every character a snide stock reply and could award keyword-based consequences. | Unavailability is identified outside character dialogue, the typed line is retained for retry, and authored actions are exposed. Offline calls do not invent outcomes. |
| Global private memories and raw flags were included in NPC prompts despite the `knownBy` design. | NPC prompts use their current conversation and permitted echoes. Aurie's inner voice retains access to her own memory. This reduces accidental omniscience; it is not a formal guarantee about model behaviour. |
| Transcript narration inherited absolute positioning from the cinematic narration style. Only four turns were shown. | The upstream positioning fix is retained. The complete current conversation is now scrollable and follows new replies. |
| Generic home links, ambiguous locked doors, no journal, no reading table. | A library home with a bookmark, themed doors, truthful “still being written” labels, four relic places and an authored journal. |
| Micro-parts were labeled Episodes 0–4 inside the series' Episode 1. | Their cards now say Part; the milestone remains the first night / Episode 1. |
| Gateway default was Grok while the current handoff specifies Haiku. | The default now matches `claude-haiku-5-5`; the environment override still takes precedence. Provider availability has not been tested. |

Source areas: `app/src/components/Player.tsx`, `app/src/lib/state/profile.ts`, `app/src/lib/audio/voice.ts`, `app/src/app/api/dialogue/route.ts`, `app/src/components/Library.tsx`, `app/src/app/globals.css`.

## A playable escape, added without generating media

The guard's dream was already present in the production shot `1.5a`, but the player previously watched the entire escape before acting.

The existing shot is now followed by an observation: listen into the guard's dream or touch the misted glass. Each records a different discovery. A short authored threshold then lets her step into the dream. Existing shots `1.5b` and `1.5c` show the escape and Alex's arrival after that action.

The edited escape narration is text-only until its new matching recording is produced, so the old voice file does not contradict the new timing. The two new threshold scenes are also text-only; no missing audio is requested for them.

These are explicitly adaptation beats (◆), not claims of additional source scenes. Both observations work. There is no dexterity test, timer, score reward or expensive new clip requirement. The purpose is to make freedom something she enacts before deciding how to judge Alex.

The Unity conversation also now explicitly takes place in a remembered 1916 afternoon, avoiding the previous unmarked jump from a decades-long montage back to a ten-year-old Unity.

## Next scenes worth producing, in order

| Priority | Scene | Why it earns its production cost | Completion criterion |
|---|---|---|---|
| 1 | Lucienne's ledger, at the library table (◆) | The first visible payoff for the first night's actual conduct. | She references one earned deed, with a stated source: Aurie tells her, or the Dreaming carries it. Never reveal an unearned secret. Use the existing library plate and reaction loop. |
| 2 | The Three-in-One, then the sand quest | Converts “my tools are missing” into a concrete journey. | Show which lead is available, what Aurie knows, and a visible change in the Dreaming when sand returns. If only the sand route is built, present it honestly instead of offering three empty destinations. |
| 3 | Constantine and Rachel | Makes restored power carry a human cost. | Taking the sand and helping Rachel must have different immediate reactions and a later Constantine callback. Her response should follow the authored state, even when the AI improvises wording. |
| 4 | A brief return to a repaired corner of the library (◆) | Makes progression visible using a location the player recognizes. | One shelf rights itself or one lamp relights; Lucienne mentions the specific tool recovered. A color/light overlay or alternate still may suffice before buying another film. |
| 5 | Death's park bench after the tools return | Gives the player emotional breathing room after horror and power. | Acknowledge Alex's actual fate and ask one meaningful question. Allow silence. Do not turn every exchange into another cliffhanger. |
| 6 | Unity's recognition during the Rose/Unity arc | Pays off the added first-night conversation over a long distance. | Branch on gift, promise, attempted exploitation, or no bond. Do not give every run the same grateful speech. |

No need to add every new scene now. Finish one satisfying loop: captivity → earned escape → judgment → remembered deed → a concrete next lead.

## Progression across the series

Use three layers of progress:

- **Practical:** missing/recovered tools, clues learned, doors actually available. These tell her where she can go.
- **Relational:** promises, confessions, debts, refusals. These explain why someone reacts differently.
- **Personal:** mercy, loyalty, courage and faith. Keep the numerical values backstage; express their effects through the performance and the world.

The journal should report facts she has experienced, not personality diagnoses or hidden ending requirements. Avoid implying that high mercy is a completion score or that every relationship must be maximized.

For each important branch, author an immediate response and at least one later callback. Small reconverging branches are efficient: two responses can return to the same story spine while leaving a flag that matters later. Save major new video variants for decisions that change the world visibly.

The current schema still cannot express several mapped mechanics cleanly: maximum thresholds, variable comparisons such as POWER, whole-book prerequisites, or enum-valued outcomes like who receives Hell's key. Resolve those before implementing Episodes 2–7. Do not force all state into booleans without an explicit plan.

The current anti-repeat guard intentionally assumes each choice scene is visited once. Future repeatable hubs and retryable puzzles need visit-scoped decisions or explicit checkpoint rollback. Do not add a loop into the current graph and expect a committed scene to be selectable again.

Remaining design issues to settle:

- Generic trust/fear deltas can still be accumulated through extended conversation; cap by scene or tie advancement to authored revelations before making them major gates.
- Alex and `alex-old` currently have separate relationship keys. Share an identity-level relationship if later trust should inherit earlier trust; keep age-specific performance cards.
- Some echoes claim both “told no one” and `knownBy: lucienne`. Decide how Lucienne learned each fact rather than relying on her being all-knowing.
- “No mid-story game over” conflicts with premature endings in the maps. Make these a chapter close with explicit rewind, and define the exact checkpoint before building them.
- Saves currently preserve scene, consequences and journal, not the exact dialogue turn or playback position. Conversations restart when resuming a scene. The UI now states this. Transcript/checkpoint persistence is a separate next step.

## UI as part of the story

The shared visual language is dark ink, warm brass, generous serif text and a physical reading table. The library should be a resting place. During a scene, keep controls quiet but discoverable: Library, Journal, Voice, playback, and optional authored actions.

The implemented home uses an arched door motif and four atmospheric palettes. The actual generated footage remains the principal artwork when available. No replacement character art or likeness changes were made.

| World | Palette and material | Interface behaviour to develop with its content |
|---|---|---|
| Sandman | Blue-black, tarnished gold, vellum, candlelight | Restrained transitions; remembered promises appear as marginal notes. |
| Neverwhere | Wet slate, sodium amber, worn signage | A route ledger that gains places only when discovered. Clever, compact labels. |
| Coraline | Rain-grey with one acidic accent | Familiar domestic shapes become subtly less symmetrical. Keep controls stable and legible even when the world distorts. |
| The Alchemist | Sand, white daylight, deep night blue | More breathing room, slower environmental transitions, omens recorded as observations rather than objective arrows. |

Continue adapting layout to phones: scroll long conversations, wrap input controls, respect safe areas and keyboard space, preserve readable contrast, expose focus states, and honor reduced motion. The new code adds these accommodations but still needs browser testing at narrow portrait and short landscape sizes.

## Voice audit — direction approved for testing, performances not auditioned

The six character cards use five voice IDs. Keeping Alex and old Alex on the same `verse` ID is a good continuity choice. IDs are provider presets; their names do not prove accent, age, gender presentation or suitability. Existing IDs were retained pending listening.

| Character / preset | Fit of the existing writing | Risk in the original direction | Updated performance target |
|---|---|---|---|
| Roderick / `cedar` | Strong: precise, possessive, threatening through restraint. | Continuous “deep menace” can become a generic villain. | Measured ownership of the room; brief rhythm changes around Randall; no habitual growl. |
| Alex / `verse` | Strong: self-excusing hesitation and fear of his father. | Pauses on every phrase make him mannered and slow. | Rehearsed bravery that loses certainty; natural pitch and vowels retained across ages. |
| Old Alex / `verse` | Strong connection to younger Alex. | Constant sobbing/gasping obscures the words and removes emotional range. | Shorter breath groups and occasional roughness; dignity cracking only when earned. |
| Lucienne / `sage` | Best-defined voice in the cast: exact, dry, affectionate through restraint. | “Great age” can produce frailty; whispering would weaken her authority. | Timeless, capable, clear; warmth in a small change of rhythm. |
| Aurie / `marin` | Proud, brief, inward voice suits the protagonist. | Near-whisper delivery loses intelligibility on a phone. Mercy framed only as self-doubt can make growth sound like weakness. | Close and audible; vulnerability without timidity, formal without trailer narration. |
| Unity / `shimmer` | Wonder and dream logic work. | Forced high pitch or a ghostly whisper can turn a person into a horror effect. | Natural curiosity, simple phrasing and clear words; the content supplies the unease. |

Audition with original calibration lines, not imitations of a screen actor:

- Roderick: “You misunderstand me. I am offering you the only kindness this room contains.”
- Alex, both ages: “I had the cloth in my hand. That is the part I cannot stop remembering.”
- Lucienne: “I kept the catalogue. It seemed unwise to assume you would not ask for it.”
- Aurie: “The door is open. I had forgotten that freedom could ask something of me.”
- Unity: “If I tell you where the sea is, will you sit beside it for a little while?”

Record neutral and emotionally changed deliveries on the owner's configured gateway. Listen on the phone speakers Charmaine will use. Check every word, accent stability, distinction between speakers, Alex's continuity, and audibility without headphones. Let Charmaine's preferences decide the final casting. Replacing a voice ID should follow that test, not a guess from its label.

Also resolve chronology before regenerating Alex: the content calls him seventy-two in 1988 while other production material treats him as already a boy at the 1916 ritual. A coherent adaptation timeline should guide both face aging and voice aging.

## Verification and remaining limits

Executed: eleven Node tests covering choice atomicity and repeat prevention, gates, one-time consequences, completion without premature relics, legacy save fields/storage failure, dialogue duplication/turn counting, all graph branches, cancelled/late/out-of-order voice responses and TTS failure, and pre-rendered narration cancellation/duck release. All passed. All fourteen source TypeScript/TSX files parsed successfully. `git diff --check` passed.

The test command is `cd app && npm test`, using Node 22.18+ or Node 24 for native TypeScript stripping. It needs no installed application dependencies.

Not completed: dependency installation, TypeScript type-checking, lint, Next.js production build, browser QA, real gateway calls, actual voice listening, video playback and deployment. Dependency setup was interrupted at the network permission step. The public media URLs are now documented upstream; private source assets and API credentials remain outside the repository. A parser pass is not a replacement for a full build.

Before merging: install the existing dependencies, run `npm run lint`, `npx tsc --noEmit`, `npm run build`, then play one merciful and one severe route with the real media. Exercise reload during a consequence, late dialogue/voice responses, Voice off, failed requests, mobile keyboard, and resuming the end of the first night. Keep the branch as a draft until these checks are complete.
