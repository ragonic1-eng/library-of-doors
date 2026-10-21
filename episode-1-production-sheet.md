# Episode 1 — Production Sheet (v0.2)

Companion to `story-map.md`. Covers the first build: Episode 1 (five scenes) plus scene 2.1 as the closing teaser.

**Decisions locked 2026-10-21:** the hero is **Aurie**, Dream of the Endless, played by and modelled on the author's wife (reference photo in `characters/dream/photo.jpg`); characters address her as "my lady" and the story map's "he" reads as "she" in all generated dialogue. Perspective: hybrid. Camera: hand-held feel on every clip. Platform: web app on Vercel first.

---

## 1. Perspective: hybrid, and why

**Recommendation: hybrid.** Cinematic third-person by default, first-person POV at every decision.

Why not pure POV: for a gift, half the fun is *seeing* the hero in the story. Pure POV hides Dream for the whole game and gets claustrophobic in an episode set mostly in a cellar.

Why not pure third-person: a face must be identical in every clip. Kling's Elements / subject-binding feature makes this workable from reference photos or a short reference clip, but every extra third-person shot is another chance for drift. Reserving POV for decisions cuts the number of hero-visible clips by roughly half.

How it plays:
- **Establishing and emotional beats** (Burgess's ritual, the decades montage, the escape): third-person, Dream visible, Kling subject binding on.
- **Decision moments**: cut to POV. The last frame freezes, ambient loop plays (candle flicker, dust in a shaft of light), the options appear as Dream's inner voice. The player's choice then plays out in third-person again.
- **Tense beats** (looking out through the glass, slipping into the guard's dream): POV, so she feels trapped or free.

**Casting option.** In the source, Dream appears to each being in the form that being expects. If the character images you send are of your wife, the hero can simply *be* her: same name, same powers, no story change needed. Say so and I'll write the prompts that way.

---

## 2. Format decisions for Kling

| Setting | Choice | Reason |
|---|---|---|
| Aspect | 16:9 landscape | Phone held sideways, full-screen, feels like a film. 9:16 wastes the cellar's width and Kling's cinematic framing. |
| Clip length | 5 s for beats, 10 s for montage and set pieces | Kling generates 5 or 10 s natively; longer clips drift more. Chain clips with first/last-frame conditioning for continuity. |
| Mode | Professional (pro) for hero-visible shots, Standard for POV and environment | Pro is where face consistency holds up. |
| Image plates | Generate one still per location first (Kolors / Kling image), approve it, then use it as the first frame for every clip in that location | Locks look of each set before spending video credits. |
| Reference for characters | 3 photos per character minimum (see §4), optional 3–8 s clip | Kling Elements accepts photo or clip references; a clip binds best. |
| Audio | Generate silent, add narration and ambience in the app | Keeps control of voice and lets the inner-voice options play over the loop. |

Prompt skeleton I'll use for every Kling clip:
`[subject with Element tag] + [action] + [setting, era, materials] + [camera: shot size, movement] + [lighting] + [style: photoreal, 35 mm film, muted palette]`, with a separate negative prompt (`cartoon, text, watermark, extra fingers, modern objects`).

---

## 3. Episode 1 scene and clip list

Clip IDs are what the app will reference. "3P" = third-person, "POV" = first-person. ★ = hero visible, needs subject binding.

| Scene | Clip | Shot | Length | Content |
|---|---|---|---|---|
| 0.0 Cold open (approved 2026-10-21) | 0.0a ★ | 3P | 10 s | The throne room of the Dreaming at full power: Aurie seated, the Corinthian kneeling, Lucienne at her shoulder with the day's report, her hair moving in its own wind, walls of stars. |
| | 0.0b | POV | 5 s | She raises a hand; a nightmare dissolves into drifting sand at the gesture. |
| | 0.0c ★ | 3P | 10 s | Mid-sentence, chalk-white lines flare across the floor beneath her; the pull; blackness; the cellar. Replaces the old 1.1a. |
| 1.1 Ritual | 1.1b ★ | 3P | 10 s | Aurie materialises inside the glass sphere, bare and pale, collapses. Helm, pouch and ruby lifted away by gloved hands. |
| 1.2 Bargain | 1.2a | POV | 5 s | Through the curved glass: Burgess crouches, lips moving. |
| | 1.2b-A/B/C ★ | 3P | 5 s each | Three outcomes: silence / Burgess recoils from a threat / Burgess laughs at the false bargain. |
| 1.3 Montage | 1.3a | 3P | 10 s | 1916 trench: a soldier who cannot sleep, eyes open, shells falling. |
| | 1.3b | 3P | 10 s | A girl (Unity) asleep in a sunlit bedroom; calendar pages peel; she ages. |
| | 1.3c | 3P | 10 s | The Dreaming's palace shedding stone like sand into a grey sky. |
| 1.4 Alex | 1.4a | POV | 5 s | An older Alex at the glass, a guard (Paul) behind him. |
| | 1.4b-A ★ | 3P | 10 s | Alex's dream: his father's hand raised, a child flinching; Alex wakes crying. |
| | 1.4b-B | POV | 5 s | Alex waits; nothing; he leaves. |
| | 1.4b-C | 3P | 10 s | Alex's dream: his own body, old, in the chair, the sphere empty. He wakes screaming. |
| 1.5 Escape | 1.5a | POV | 5 s | A guard slumps against the glass; his breath fogs it. |
| | 1.5b ★ | 3P | 10 s | Dream steps out of the sleeping guard's dream as a tall shadow; the circle's chalk crumbles. |
| | 1.5c | 3P | 5 s | Alex wheeled in, screaming. |
| | 1.5d-A/B/C ★ | 3P | 10 s each | Eternal Waking (Alex waking again and again into worse rooms) / one night of nightmares / Dream turns and walks out into the dawn. |
| 2.1 Library hub | 2.1a ★ | 3P | 10 s | Dream at the gates of Horn and Ivory, cracked; Lucienne with a lantern. Variant: ruined / strained. |
| | 2.1b | POV | 10 s | Slow pan along the Doors wall: three dark locked doors carved *Neverwhere*, *Coraline*, *The Alchemist*; the empty reading table. |
| | 2.1c | 3P | 5 s | Lucienne turns to the player: "Every story has a door, my lord. These are not yet open." |

Totals: **26 clips** (21 base + 5 decision variants), 11 with the hero visible. Plus 9 location stills. Scene 2.1 doubles as the series hub; see `series-bible.md` §2 and §9.

---

### 3b. Reaction loops (movement during live dialogue)

While Aurie talks with a character, the scene video is replaced by that character's loop for their current mood, chosen live by the dialogue model and cross-faded on every reply. Each loop is 5 s, seamless (first and last frames match), hand-held sway, the character breathing, blinking and shifting in place with the emotion readable throughout. Source frame: the matching panel of the character's expression sheet (`character-prompts.md` §3b). File: `public/clips/sandman/react/<character>-<mood>.mp4`. Missing loops fall back to neutral, then to the scene's last frame, so they can be added gradually.

| Character | Scene | Moods (7 each) |
|---|---|---|
| burgess | 1.2 at the glass | neutral, warm, wary, hostile, amused, afraid, grieving |
| alex | 1.4 at the glass (1970s, from the old-Alex sheet, made a decade younger) | same seven |
| lucienne | 2.1 the library hub | same seven |

Totals: 21 loops, about 105 s of video. Cheapest model is fine here (`kling-v2-6`); faces come from the approved expression panels.

## 4. Cast for Episode 1

Characters are **generated**, not photographed (prompts in `character-prompts.md`). The only photo needed is of your wife, if she is to be the face of Dream: one clear front-facing shot in even light, no glasses or hat. Each character gets an approved three-view reference sheet, and every later image and clip is derived from that sheet.

| Character | Role in Ep 1 | Ages needed | Notes for casting |
|---|---|---|---|
| **Dream / Morpheus** (the player) | Hero | one | Pale, dark hair, black clothing in the source. Can be anyone; see §1 casting option. |
| **Roderick Burgess** | Captor, 1916 | one (50s) | Edwardian occultist, beard, heavy robes. |
| **Alex Burgess** | Son, inherits the prisoner | two (20s and 70s) | Send photos of one person; I'll age him in the prompt. |
| **Paul McGuire** | Alex's companion and guard | one (40s–60s) | Quiet, kind face. |
| **Unity Kincaid** | The sleeping girl in the montage | child, then old | No photo needed unless you want a specific face. |
| **The sleeping guard** | Dream's door out | one | Any face; can be generated. |
| **Lucienne** | Librarian, teaser scene | one | Tall, grey-haired, spectacles in the source. Can be generated. |

Minimum you must send: **Dream, Roderick, Alex.** The rest I can generate from text.

---

## 5. Recurring locations (I generate these, no images needed)

1. Fawney Rig cellar, 1916: candlelight, chalk circle, brass instruments.
2. The same cellar, 1970s: electric bulbs, dust, the sphere greyed.
3. The same cellar, 1988: a broken circle, dawn light through a high window.
4. Inside the glass sphere, looking out (POV plate).
5. The Dreaming's palace, crumbling (montage).
6. The gates of Horn and Ivory, ruined and strained variants.
7. The guard's dream: a pub, a wife, warm light (the door Dream uses).
8. Lucienne's library interior: endless shelves, the Doors wall with three locked doors, the reading table (the series hub).
9. The throne room of the Dreaming at full power (cold open): a throne of black glass, walls that are open night sky, the Corinthian kneeling, sand drifting upward.

Each gets one approved still before any video is generated.

---

## 6. What happens next

1. Done: the gateway key is in `.env` with all model choices.
2. You approve the Style Bible in `character-prompts.md` and decide whether your wife is the face of Dream.
3. I generate the reference sheets and 8 location plates for approval, then the 24 clips.
4. In parallel I build the web app shell: clip player, freeze-frame with ambient loop, live character dialogue, voice, state tracking, save slot.
