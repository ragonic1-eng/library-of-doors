# CHANGELOG — the shared directory for every AI working on The Library of Doors

Read this before touching anything. Claude, ChatGPT/Codex and the owner all write here. It answers three questions: **what exists, who changed it last, and what is in flight.** `git log` is the raw record; this file is the readable index of it.

## Rules

1. Every change to the game (code, story, characters, prompts, media, hosting) gets one line under **Log**, newest first, in the same commit. Format: `date · who · area · what changed · files/dirs touched · live? `
2. **Who** is `Claude`, `ChatGPT` or `Owner`. Say which tool made the change so the other one can tell.
3. If you generate media (images, clips, voices, music), say where it landed (local folder and whether it was uploaded to Blob) and what it cost.
4. If you start work on a branch, add it under **In flight** with its purpose. Remove it when merged or abandoned.
5. Do not rewrite old entries. Correct them with a new line.
6. Keep `HANDOFF.md` for *how things work*; keep this file for *what changed*.

## Where things live

| What | Where | Notes |
|---|---|---|
| Scene graph (every scene, beat, choice) | `app/src/content/books/sandman/book.json` | checked by `app/scripts/check-story.mjs` on every build |
| Character cards (voice, wants, secrets, TTS voice) | `app/src/content/characters/sandman.json` | |
| The player (UI, timeline, voices, music, menu) | `app/src/components/Player.tsx`, `app/src/app/globals.css`, `app/src/components/Ambience.tsx` | |
| Live dialogue API | `app/src/app/api/dialogue/route.ts`, `app/src/lib/server/gateway.ts`, `app/src/lib/server/voice.ts` | model fallbacks and circuit breaker in gateway.ts |
| Other APIs | `app/src/app/api/{tts,save,version}/route.ts` | |
| Image prompts (Style Bible, every character, angle sheets, location plates) | `character-prompts.md` | §3 characters, §3b expressions/poses, §3c angle sheets, §4 plates |
| Shot list (keyframes, motion, stills, reaction loops, identity locks) | `production/ep1-shots.json` | all episodes, despite the name |
| Generators | `app/scripts/generate-images.mjs`, `generate-clips.mjs`, `edit-image.mjs`, `upload-clips.mjs` | run from `app/` with `npm run gen / clips / upload` |
| Narration and music tools | `tools/gen_narration.py`, `tools/pace_lines.py`, `tools/gen_music.py`, `tools/face_score.py` | local only |
| Generated media (local, not in git) | `assets/` (keyframes, plates, clips, audio), `characters/<id>/` (sheet, heads, turnaround, portrait) | |
| Media the game serves | `app/public/clips/sandman/` → Vercel Blob `clips/sandman/` | clips, `stills/`, `react/`, `audio/{music,lines}` |
| Story maps and design docs | `story-map*.md`, `series-bible.md`, `ai-dialogue-design.md`, `engagement-design.md` | |
| How everything works | `HANDOFF.md` | |
| Hosting | Vercel project `library-of-doors`, Blob store `library-clips-linked`, deploy with `vercel deploy --prod --yes` from the repo root | |

## In flight

| Branch / PR | Who | Purpose | Status |
|---|---|---|---|
| `codex/player-experience-audit` (PR #1, draft) | ChatGPT | Pacing and voice-lifecycle fixes, journal, library bookmark, experience audit (`docs/EXPERIENCE-AUDIT.md`) | Opened 2026-10-22 00:01, before the day's rebuilds. Its bugs were fixed separately on `main` since; conflicts heavily with `main`. Recommend closing; cherry-pick ideas from the audit doc by hand if wanted. |
| `codex/audio-completion-audit` | ChatGPT | Narration/voice truncation fixes, strict voice transcripts, five procedural music beds, audio audit | **Merged into `main` by Claude on 2026-10-22 (about 23:45)** with changes; see the log entry and `audit/README.md` ("Claude's verification and integration"). The branch can be deleted. |

One-shot sound effects exist since 2026-10-23 (`beat.sfx`, `tools/gen_sfx.py`). Separate ambience beds are still not started.

## Log

### 2026-10-23

| Time | Who | Area | Change | Touched | Live |
|---|---|---|---|---|---|
| 02:00 | Claude | story, media | **Full-run audit.** Parts Five and Six never branched (every choice led to the same next scene); four choices now get their own scene before the story rejoins: 5.2f Loose (the Corinthian set free, one night from Rose's brother), 6.1b The Oath (Lyta after Aurie claims her son), 6.4b The Painted Sea (an evening with Destruction and Delirium after listening to him), 6.6b The Song (refusing Orpheus goes home to the throne instead of the stream). Pictures added where lines showed the previous scene's picture: 5.3 opening and the 1589/1689 centuries (2 new stills), 5.2a, 7.1a, ending C, end of Part Six (Lyta rocking Daniel, new still). Part Seven's Lyta gets her own card `lyta-door`, so her pregnant Part Six talking loop no longer plays at her door. 6 new stills (flash image model; pro still down; one Hob candidate rejected for resembling a real actor and rebuilt from his approved 1489 picture), 17 narration lines. | `book.json`, `sandman.json`, `ep1-shots.json`, Blob | yes |
| 01:40 | Claude | story, media, sound, UI | **Part Seven, "The Kindly Ones", live** with real branching: 7.0 the empty crib → find the child (7.1a) / go to Lyta yourself (7.1b, needs she was never threatened; win her trust at mercy ≥ 5 → 7.1c together) / ignore her (7.2); 7.2 Thessaly at the crossroads (live talk; four outcomes, one needs Orpheus refused); 7.3 the siege (send your people away or make them stand); 7.4 Nuala's boon (stay, break it, or shelter in Faerie if FAERIE_FRIEND); 7.5 Death on the throne steps (take her hand at mercy ≥ 6 with Orpheus released, fight, or Destruction's door if you listened to him). Four endings: end-A the Wake (mourners named by every earlier friendship), end-B, end-C, end-R. New cast (original, resemble no real person): Thessaly (petite honey-blonde witch, black strapless corset, slit skirt, velvet coat; heads + turnaround), Daniel child and adult Dream, the Kindly Ones; cards thessaly, nuala, death-end. 5 places, 16 stills, 8 clips with Aurie (news, crossroads, siege, Death's hand, the door, alone, listens, plus 7.3a the Kindly Ones), talking loops thessaly ×2, nuala, death-end; 103 narration lines, self-checked. **Aurie's essential eight finished**: clips aurie-mending, -nada, -hob, -death-bench, -stream live, narration for all eight. **Scene overlays**: new `sparks` (Hell: embers, random spark bursts with a flash, heat glow) and `frost` (Nada's ice cell, the cold house: mist banks, frosted edges, glinting crystals); every scene now has an overlay; **bug fixed**: since the Part Six curtain change the current picture (z-index 1) covered the talking loops, the overlays and the vignette; now picture 1, talking loop 2, overlay 3, vignette 4. **Sound effects**: AudioLDM 2 (local, free), judged by listening; 12 kept (glass, sand, door, gates, arena, ruby, pigeons, raven, bell, thunder, ice, pub laughter), placed on 31 beats including Part Seven; feathers dropped (it came out as plain wind). Image gateway outage (`gemini-3-pro-image` "no available channel") worked around with `gemini-3.1-flash-image`; Aurie built by editing her approved high-likeness pictures (`edit-image.mjs --ref`). Spend this round about ¥101 (Aurie eight, ruby, Part Seven ≈ ¥60–65). | `book.json`, `sandman.json`, `Ambience.tsx`, `Player.tsx`, `globals.css`, `types.ts`, `check-story.mjs`, `edit-image.mjs`, `generate-images.mjs`, `slow-fetch.mjs`, `tests/audio.test.mjs`, `tools/gen_sfx.py`, `character-prompts.md` §3.35–3.38, §4.33–4.37, `ep1-shots.json`, `HANDOFF.md`, Blob | yes |

### 2026-10-22

| Time | Who | Area | Change | Touched | Live |
|---|---|---|---|---|---|
| 23:45 | Claude (+ ChatGPT) | sound, voice, UI, story media | **ChatGPT's audio branch merged, verified against the real gateway, and extended.** Root cause of "voice stops halfway / gets stuck" found: the voice model's own transcript claims every word while its audio goes silent, hisses, or runs on for a minute (about 1 take in 4 for the `cedar` voice). Server now decodes and measures every take (`lib/server/mp3.ts`, `mpg123-decoder`), records one take and, only if it fails, two more at once, ignores *laughs* in transcripts, skips wordless lines; `cedar` retired (Burgess, Paul echo; Destruction ballad; suitors reassigned). Player: no fixed cut-offs (ChatGPT), runaway-take backstop, every character voice levelled to −22 dBFS through Web Audio (`lib/story/level.ts`; the Crone was 19 dB quieter than the Maiden). Narration: all 409 lines transcribed by two listeners (`tools/audit_narration.mjs`); 4 faulty recordings re-made (`?v=2` cache-busting in `lib/story/lines.ts`), 2 lines reworded; `gen_narration.py` now checks every take. Music: of ChatGPT's five beds only `hell-v1` kept (levelled +9 dB); new MusicGen beds `wings`, `ruby`, `tavern`, each chosen by head-to-head listening; music only from `book.json` (removed `score.ts`, which would have silenced shared tracks under the scene curtain). Screen wake lock while playing. Rotate prompt on the title page and in the player (phone outline that tips sideways). Ruby chapter (2.9 to 2.11): new `ruby` music is live; 9 new stills, 2 clips and a Dee talking loop are written (`ep1-shots.json`) but not yet generated (the image gateway was timing out), so the chapter still shows its old pictures. | `app/src/lib/server/{voice,mp3,faithful}.ts`, `app/src/lib/story/{audio,level,lines}.ts`, `Player.tsx`, `RotatePrompt.tsx`, `page.tsx`, `globals.css`, `book.json`, `sandman.json`, `ep1-shots.json`, `tools/{gen_narration.py,gen_music.py,compose_score.py,audit_narration.mjs}`, `audit/`, `app/tests/audio.test.mjs`, Blob `audio/`, `stills/`, clips | yes |
| 21:10 | Claude | UI | Owner round: (1) "Aurie, thinking" stays until she sends her next line or taps it, instead of vanishing after 7 s; (2) the Undo button is gone from the "Your choice" card (players tapped it by reflex and got bounced back); "Undo my last choice" now lives in the ☰ menu until the next scene begins; (3) scene changes dip to black (0.7 s down, 1.3 s up) with the music starting its cross-fade as the picture goes; dissolves between pictures within a scene lengthened to 0.9 s. | `Player.tsx`, `globals.css` | yes |
| 20:40 | Claude | docs | Created this change log; HANDOFF points to it | `CHANGELOG.md`, `HANDOFF.md` | n/a |
| 20:35 | Claude | story, media | **Part Six live**: 6.0 Matthew the raven, 6.1 Lyta and the false house, 6.2 Delirium's road trip, 6.3 Orpheus, 6.4 Destruction, 6.5 the price, 6.6 the stream, end-ep6. New cards matthew, lyta, destruction, orpheus (Lyta, Hector, Destruction cast Asian; Orpheus half Asian). 7 stills, 2 clips (6.1a, 6.5a), talking loops for orpheus, lyta, destruction. Angle sheets for lyta, destruction, orpheus. Spend about ¥30. | `book.json`, `sandman.json`, `character-prompts.md` §3.29–3.34, §4.28–4.32, `ep1-shots.json`, `assets/`, Blob | yes |
| 20:23 | Claude | media | Aurie dressed in a white tube dress in the sphere ritual clip (1.1a-v3); calm motion. Rule: Aurie is never shown unclothed. | `book.json`, `ep1-shots.json`, Blob | yes |
| 20:13 | Claude | media | Angle sheets (heads + turnaround) for the remaining cast (alex-old, burgess, paul, guard, johanna, rachel, lucifer, choronzon, dee, destiny, desire, despair, delirium, madoc; turnaround only for azazel, corinthian, unity). Aurie's face rebuilt in 0.0a-v2 (throne close-up) and 1.1a-v2 (sphere). | `generate-images.mjs`, `characters/*/heads.png`, `turnaround.png`, Blob | yes |
| 19:27 | Claude | story, media, tooling | **Part Five live** (Calliope/Madoc, the Corinthian, Rose and Unity, Desire, Hob 1389–1989). Angle-sheet system added: `characters/<id>/heads.png` and `turnaround.png`, auto-attached to every keyframe that references that character's sheet. Wan 3.0 reference-to-video tested through the gateway: `media` array ignored, not usable (¥4.81). Madoc redesigned (first sheet resembled the TV actor). | `book.json`, `sandman.json`, `character-prompts.md` §3.23–3.28, §3c, §4.22–4.27, `ep1-shots.json`, `generate-images.mjs`, Blob | yes |
| 17:56 | Claude | story | Parts One/Two audit: branch scenes 1.6 Paul (after cursing Alex) and 2.4b Johanna's Curse (after Rachel's cruel end); bridging lines in 0.0, 1.4, 2.5, 2.9, 2.12. Rule: a cruel choice gets an on-screen answer. | `book.json`, `sandman.json`, `ep1-shots.json` | yes |
| 17:38 | Claude | story, AI | Parts Three/Four audit: new scene 3.0 The Mending; bridges for Nada, Hell routes, suitors; choice-aware part endings. Dialogue schema now starts with private `subtext` and `mood`; mood directs the voice. Fixed the player's line being sent twice. | `book.json`, `api/dialogue/route.ts`, `lib/server/voice.ts` | yes |
| 17:19 | Claude | UI | First-conversation hint moved out of a box into the input placeholder plus a glowing Ideas button (it was covering the talk). | `Player.tsx`, `globals.css` | yes |
| 16:13 | Claude | AI | Stage directions in *asterisks* never spoken; moved to narration. | `api/dialogue/route.ts` | yes |
| 16:12 | Claude | story, media | **Part Four live**: 4.1 Hell emptied, 4.2 the suitors (multi-speaker card), 4.3 Nada. Loki and Nuala redesigned to resemble no real actor. | `book.json`, `sandman.json`, `character-prompts.md` §3.19–3.22, Blob | yes |
| 15:36 | Claude | UI, speed, voice | Skip button (tap = line, hold = part), Undo on choice card, Recent lines, text size and music settings, 48 px targets. Dialogue streams with voice bundled; openings pre-voiced. gpt-audio read lines verbatim (fenced script + transcript check, 3 takes). Update-available notice (`/api/version`). | `Player.tsx`, `globals.css`, `api/dialogue`, `lib/server/voice.ts`, `api/version`, `next.config.ts` | yes |
| 12:54 | Claude | story, media | **Part Three live**: 3.1 Destiny's garden, 3.2 the family of the Endless (labelled speakers with their own voices). | `book.json`, `sandman.json`, `character-prompts.md` §3.15–3.18, Blob | yes |
| 12:38 | Claude | media | Aurie's face fixed in 1.1b and 1.2b-A by editing an approved image (`edit-image.mjs`), published as `-v2` clips. | `edit-image.mjs`, Blob | yes |
| 10:55 | Claude | UI, story, infra | Nine-point owner round: where/why/who bridges, Prologue/Chapter naming, recaps; the Three as three speakers; pause menu, fullscreen, Your-choice card, Previously card, Retry banner; in-character steering; cloud save code (`/api/save`); model circuit breaker; `check-story.mjs` as prebuild; ambience canvas (rain, embers, ash, dust, glitter, snow, mist, flicker). | `Player.tsx`, `Ambience.tsx`, `api/save`, `gateway.ts`, `check-story.mjs`, `book.json` | yes |
| 10:02 | Claude | story, media, UI | **Part Two complete**: 2.5 Hell, 2.6 Lucifer, 2.7 the Oldest Game, 2.8, 2.9–2.11 Dee and the ruby, 2.12 Death. Talking loops while a character's voice plays; typing bubble. Dialogue fallback models. | `book.json`, `sandman.json`, `ep1-shots.json`, `Player.tsx`, `api/dialogue`, Blob | yes |
| 08:44 | Claude | story, media | Episode 1 gaps closed (ritual 1.1a, Unity's dream 1.3d, Ethel 1926, Burgess 1947); Part Two start: 2.2 the Three, 2.3 Johanna, 2.4 Rachel. | `book.json`, `ep1-shots.json`, Blob | yes |
| 08:07 | Claude | story, player | Episode 1 rebuilt as 66 narrated beats (text + voice together, per-line audio by hash); typed words decide scenes. | `book.json`, `Player.tsx`, `lib/story/lines.ts`, `tools/gen_narration.py`, `tools/pace_lines.py` | yes |
| 07:18 | Claude | sound | Narrator re-rendered with cinematic direction (gateway voice "ash"); Chatterbox added as a local engine. | `tools/gen_narration.py`, `assets/audio/`, Blob | yes |
| 00:01 | ChatGPT | player, story | Draft PR #1 on `codex/player-experience-audit` (see In flight). | branch only | no |
| 00:00 | Claude | AI, sound | Dialogue JSON parsing hardened; sound pipeline documented. | `api/dialogue`, `HANDOFF.md` | yes |

### 2026-10-21

| Time | Who | Area | Change | Touched | Live |
|---|---|---|---|---|---|
| 23:57 | Claude | sound | Music beds (MusicGen, 6 tracks), narration and hook audio in the player; ducking under voices. | `tools/gen_music.py`, `Player.tsx`, Blob `audio/` | yes |
| 23:13–23:35 | Claude | hosting, speed | Mobile build (start gate, rotate prompt, foldable fit); Vercel functions pinned to Singapore; gateway warm-up from the start gate; Blob uploader; Aurie's glass shots reframed as close-ups. | `Player.tsx`, `vercel.json`, `api/dialogue`, `upload-clips.mjs`, `ep1-shots.json` | yes |
| 22:12–22:37 | Claude | gameplay, media | Consequence engine (tags, trust/fear, echoes, action narration); face-refine pass; dialogue on Haiku; clip cap ¥400. | `api/dialogue`, `lib/state/profile.ts`, `generate-images.mjs`, `HANDOFF.md` | yes |
| 21:04–21:46 | Claude | media, tooling | Episode 1 scene clips complete; reaction loops; local face-likeness scorer and identity locks. | `assets/clips/`, `tools/face_score.py`, `ep1-shots.json` | yes |
| 18:42–20:50 | Claude | tooling, media | Image generator, clip generator with real-spend cap, Episode 1 shot list, cast sheets (author cast as Alex), Episode 0 cold open approved. | `generate-images.mjs`, `generate-clips.mjs`, `character-prompts.md`, `ep1-shots.json` | yes |

### Before 2026-10-21

Design phase: story maps for all four books, series bible, dialogue and engagement design, Episode 1 production sheet. See `git log --before=2026-10-21`.

## Spend (gateway, cumulative)

| Date | Total |
|---|---|
| 2026-10-22 20:35 | about ¥660 (Part Six about ¥30 on top of ¥628.66) |
| 2026-10-22 20:23 | ¥626.50 |
| 2026-10-22 19:27 | ¥602.22 |
| 2026-10-22 17:56 | ¥561.37 |
| 2026-10-22 12:54 | ¥523.60 |
| 2026-10-22 10:02 | ¥475.28 |
| 2026-10-22 08:44 | ¥364.29 |
| 2026-10-21 end | about ¥299 |

Check the live figure with `npm run clips -- spend` from `app/`.
