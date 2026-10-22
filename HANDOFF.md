# The Library of Doors — handoff guide for any AI assistant

Read this first. It lets ChatGPT, Claude or any other assistant continue the project without the original conversation.

## What this is

A private gift: an interactive video novel for the author's wife, Charmaine, who plays the hero **Aurie**. It is a web app (Next.js, deployed on Vercel) built from four linked books: *The Sandman* (Book 1, in production), *Neverwhere*, *Coraline* and *The Alchemist* (mapped, not built). The author plays **Alex Burgess** in The Sandman. Immersion is the top priority: realistic video, live AI characters, choices with consequences.

## Read these, in this order

| File | What it holds |
|---|---|
| `CHANGELOG.md` | **Read first.** The shared change log and directory for every AI (Claude, ChatGPT) and the owner: what exists, who changed it last, what is in flight. Add a line there with every change. |
| `series-bible.md` | The whole series: the library hub, book-to-book thresholds (§2b), casting rules (§2c: Aurie plays every hero, bisexual, romances as written), the Traveller profile, unlock rules, cross-book echoes |
| `story-map.md` | The Sandman: 7 episodes, every scene, decisions, flags, endings. Aurie = Dream (she/her, "my lady") |
| `story-map-neverwhere.md`, `story-map-coraline.md`, `story-map-alchemist.md` | The other three books, mapped from the full novels |
| `ai-dialogue-design.md` | How live characters work: flexible NPC rules, the reply format, learning the player |
| `engagement-design.md` | The micro-drama pacing engine: hooks, payoffs, episode cards |
| `character-prompts.md` | The frozen Style Bible and every image prompt (characters, expressions, poses, locations) |
| `episode-1-production-sheet.md` | Episode 1 clip list, reaction loops, totals |
| `production/ep1-shots.json` | Machine-readable shot list: keyframe recipes, motion prompts, identity locks |

## The app (`app/`)

- `src/content/books/sandman/book.json` — the scene graph. Each scene: `beats` (the film), `episodeTitle`, `music`, a `conversation`, and `choices` (each with its own `aftermath` beats).
- **Beats** are the film, one moment each: `{ text, clip | still, card, style: "hook", if: [flags], unless: [flags] }`. A beat's `text` is ONE short narrated sentence, shown as a subtitle only while it is spoken. `clip` plays a video and holds its last frame; `still` shows an image from `stills/` with a slow push-in; `card` is a silent time/place card ("1988"). `if`/`unless` make a line appear only after earlier deeds, which is how choices visibly change later scenes. Keep every scene connected: if time passes or something important happens off screen, add a card and a line that says so.
- `src/content/characters/sandman.json` — character cards (voice, wants, knows, secrets, red lines, TTS voice and direction).
- `src/app/api/dialogue/route.ts` — live dialogue. The model plays the character and returns JSON: `dialogue`, `narration`, `inner_thought`, `mood`, `decision`, `consequences`, `trust_delta`, `fear_delta`, `memory_note`. The server validates every id against what is allowed right now.
- `src/app/api/tts/route.ts` — voice, via `gpt-audio-1.5` directed as a voice actor.
- `src/components/Player.tsx` — the player: a beat timeline (picture, subtitle and voice together; a tap skips; scene changes silence every voice), hand-held sway, reaction loops per mood, conversation UI, consequences, ripples, end-of-episode recap.
- `src/lib/story/lines.ts` — `lineId(text)`: the narrator file for a line is `audio/lines/<lineId>.mp3`. `tools/gen_narration.py` uses the same hash, so editing a line's words automatically needs a new recording and stale audio can never play.
- `src/lib/state/profile.ts` — save state: traits (mercy, loyalty, courage, faith), flags, relations (trust and fear per character), echoes, memory.

### How consequences work (the gameplay core)

Every conversation has:
- `canon`: facts the character may never contradict.
- `possibilities`: the likely approaches and how the scene bends to each, so improvisation stays on-story.
- `consequences`: a menu of tagged outcomes. The model fires a tag only when the player's latest words or actions earn it. Each fires once, applies effects, changes the speaker's trust and fear, can show a `ripple` line on screen, and can leave an `echo`: a story fact that later characters (listed in `knownBy`) remember and mention.
- `exits`: where the scene may end. The model sets `decision` as soon as her own typed words match an exit, so typing alone moves the story; the suggested lines (the Ideas button) are said to the character with that exit as `intent`. Choices can carry `requires` (hidden until earned) and `effectsIf` (extra cost or reward from earlier deeds).

To add depth to a scene, add to its `possibilities` and `consequences`, and add beats with `if` flags or `knownBy` echoes that pay them off later. Keep consequences tied to the actual books.

## Production tools (run from `app/`)

```bash
npm run dev                                   # play locally at http://localhost:3000
npm run gen -- list                           # image jobs and their status
npm run gen -- one <job-id> --n 2 --min 0.5   # generate with a likeness gate
npm run clips -- list                         # video clips and their status
npm run clips -- one <clip-id>                # render one clip (respects the budget cap)
npm run clips -- spend                        # real spend against the cap
```

- Face refine for scene shots: `npm run gen -- refine <image> aurie|alex` keeps a composed scene and swaps in the real face (`tools/refine_batch.sh <shot ids>` runs generate-then-refine). Aurie scene shots: accept 0.40 or above plus an eye check; studio sheets: 0.50.
- Likeness check, free and local: `python -I tools/face_score.py aurie|alex <files>` (OpenCV YuNet and SFace; the models are downloaded into `tools/models/`, not committed). The score is mean cosine similarity to the real photos: 0.5 or above strong, 0.4 to 0.5 acceptable, below 0.4 reject. It cannot judge heavy aging (1988 Alex), so judge those by eye. In clips, a low average is often composition, not drift (a hand over the face, glass distortion, another person in frame, a cut to black): always look at the frames before paying for a re-render.
- Faces: always put the real photo face crops first and use the identity locks in `production/ep1-shots.json`. Keep faces large in frame. Never slim or beautify.

## Services and money

- One gateway key (Infistar, OpenAI-compatible) covers everything. It lives in `.env` and `app/.env.local`, which are never committed. **Never put the key in chat or in git.**
- Models in use: video `wan2.7-i2v` (Kling is restricted on this key), images `gemini-3-pro-image`, dialogue `claude-haiku-5-5` (about 2.5 s per reply; chosen over Grok, which took 20 to 40 s), voice `gpt-audio-1.5`.
- **Budget is limited.** The clip generator enforces a real-spend cap (`CLIP_BUDGET_CNY`, currently 400 yuan). No rerolls without a reason. Measure with the face scorer before re-rendering.

## Hosting (Vercel)

- Project: `library-of-doors` (team `ragonic1-engs-projects`), live at https://library-of-doors.vercel.app, deploying automatically from `main`. Root directory is `app`.
- The Vercel CLI on the author's PC is logged in; the project is linked locally in `.vercel/` (not committed). `vercel env ls`, `vercel env add NAME production`, `vercel env pull` all work from the project root.
- Functions are pinned to Singapore (`app/vercel.json`, `regions: ["sin1"]`) because the player and the AI gateway are both in Asia; the US default added 10 to 40 s to the first replies. The start gate also pings `/api/dialogue` and `/api/tts` (GET) to warm them.
- GitHub pushes stopped triggering Vercel builds at one point; `vercel deploy --prod --yes` from the project root deploys directly and is the reliable path.
- Clips are served from Vercel Blob, store `library-clips-linked` (`store_7Zfkb2xtOnrTOuPx`, public, linked to the project). Base URL `https://7zfkb2xtonrtoupx.public.blob.vercel-storage.com`; the app reads `NEXT_PUBLIC_CLIP_BASE` (set to `<base>/clips`). Upload with `npm run upload` from `app/` (uses the Blob SDK with exact file names; needs `BLOB_READ_WRITE_TOKEN`, which `vercel env pull .env.local` in the project root provides). It skips files already in the store; `--force` re-uploads, `--list` shows the store. The CLI's `vercel blob put` adds random suffixes in this version, so do not use it for clips. New or re-rendered clips must be uploaded there; `app/public/clips` is local-only.
- Production env vars set: INFISTAR_BASE_URL, INFISTAR_API_KEY, MODEL_DIALOGUE, MODEL_TTS, MODEL_VIDEO, MODEL_VIDEO_HERO, MODEL_IMAGE, MODEL_STT, NEXT_PUBLIC_CLIP_BASE. Changing a `NEXT_PUBLIC_` variable needs a redeploy.
- Target devices: Samsung Galaxy Fold 8 and S25 Ultra, mobile browser. The player has a tap-to-start gate (sound, fullscreen, landscape lock), a rotate prompt for upright phones, letterboxing on near-square screens, and touch-sized controls. Test sizes used: 1040x480 (S25 Ultra landscape), 960x860 (Fold inner), 480x1040 (upright phone).

## Sound

- **Music beds**: `tools/venv/Scripts/python tools/gen_music.py [track ...]` renders loop-ready 30 s MP3s with Meta MusicGen (small model, CPU, free, no account) into `app/public/clips/sandman/audio/music/<track>.mp3`. Track ids and prompts live in that script; scenes name their track with `music` in `book.json` (a scene without one keeps the previous track; `"none"` stops it). The player cross-fades between tracks and ducks the bed under any voice. Free alternative the owner mentioned: make tracks in Suno and drop them in the same folder under the same names.
- **Narration**: after editing any beat text, run `tools/venv/Scripts/python tools/gen_narration.py --engine gateway --voice ash` (each take is transcribed and measured before it is kept; `--ids a,b --force` re-records specific lines) (renders only lines without a recording into `assets/audio/lines-raw/`), then `tools/venv/Scripts/python tools/pace_lines.py` (trims dead air and lifts slow lines to about 2.5 words a second, writing `app/public/clips/sandman/audio/lines/`). `--engine kokoro` or `--engine chatterbox` (in `tools/venv-tts`) are free local alternatives.
- After rendering anything: `npm run upload` in `app/` (the uploader includes audio).
- The local Python environment for these tools is `tools/venv` (not committed): torch CPU, transformers, kokoro, soundfile, imageio-ffmpeg. Windows note: both scripts force UTF-8 console output.

## Not in git (local only)

The novels and extracted text, the family photos (`characters/`), generated images and clips (`assets/`, `app/public/clips/`), the face models, and the key. An assistant without access to the author's PC can work on design, story, prompts and code, but not generate media.

## Current status (update this section as you go)

- Live for the author's phones at https://library-of-doors.vercel.app (Singapore region, Blob-hosted clips, Haiku dialogue, gpt-audio voice). Clip spend about 299 of the 400 yuan cap.
- Episode 1: all 24 scene clips and all 21 reaction loops exist and are uploaded. Alex (the author) is consistent everywhere. Charmaine (Aurie) is consistent in 0.0a, 1.2b-B and the master sheet; 0.0c was re-rendered (check its frames: the shot ends in a flare); 1.1b, 1.2b-A and 1.5b still use an older, drifted face because the glass distortion in those compositions defeats the face-refine pass. Fix idea: reframe those three as close-ups with less glass between camera and face, then generate, refine and gate at 0.40.
- Gameplay: consequence engine, relations, echoes, action narration, and the Unity and old-Alex conversations are live.
- Sound: narration and hook lines are pre-rendered (gateway narrator, voice "ash") and live; music beds are generated locally with MusicGen (see Sound). Narrator voice choice (gateway vs Kokoro) is pending the owner's ear.
- Latency: the gateway has a 2 to 4 s floor per call anywhere. The start gate calls `GET /api/dialogue?warm=1` (one 3-token model call) and `GET /api/tts`, which absorbs the gateway's slow first hop; measured after that, production replies take 3.4 to 4.4 s, the same as on a PC. `?probe=1` on the same route times both gateway hostnames from inside Vercel.
- Open decision for the owner: the Neverwhere hero's name (default Rachel Mayhew).

## Working from ChatGPT / Codex (no local media, no key)
The repo holds code and story only. Clips, voices and music are NOT in git, but they are public on Vercel Blob, so you can still build and play the game:
1. Setup (put this in the Codex environment's setup script, which runs with internet; the agent phase may not have it):
   `cd app && npm ci`
2. Create `app/.env.local` with:
   `NEXT_PUBLIC_CLIP_BASE=https://7zfkb2xtonrtoupx.public.blob.vercel-storage.com/clips`
   `MOCK_AI=1`  (canned NPC replies, no API key needed)
3. `npm run build` must pass. `npm run dev` then open `/play/sandman` to see real clips and hear real music and narration.
4. The live site https://library-of-doors.vercel.app is the verified reference (build, playback, dialogue, music, narration checked 2026-10-22).
What ChatGPT cannot do from its sandbox: generate images, clips, voices or music (needs the owner's PC: tools/venv, models, photos, key) and deploy (needs the owner's Vercel login). Good jobs for it: story/branching in book.json, character cards, dialogue prompt in api/dialogue, UI in Player.tsx/globals.css. Push a branch; the owner deploys.

## Status 2026-10-22 (latest)
- Episode 1 rebuilt (owner feedback: scenes jumped too far, typing changed nothing, narration lagged and read words not on screen). Now: 66 short narrated beats grounded in canon (the summoning, Randall, the stolen tools, sleeping sickness and Unity, Ethel Cripps 1926, Burgess dies 1947, Alex inherits, the 1988 escape through a sleeper's dream, home to Lucienne), time cards and stills bridging every jump, an aftermath for every choice, `if` lines that pay off earlier deeds, and an end recap of what the world remembers with Play again.
- Verified on production: subtitle and voice start together (within 0.2 s) and end together; no voice outlives its scene; tap to skip; typed lines end scenes (AI test: 7 of 7 lines reached the right outcome, off-topic lines kept the scene going); character text appears when the voice starts; replies about 30 words.
- Narration pacing: total 507 s -> 357 s after `pace_lines.py`; transcription checks show no clipped words.
- Music: six MusicGen beds live. Suno alternative: drop mp3s under the same ids.
- Narrator voice: gateway "ash" with the cinematic direction is live. Chatterbox (free, local, `tools/venv-tts`, needs `setuptools<81` on Windows) is available as an engine; owner may still pick it.
- Housekeeping: a stray Vercel project named `app` was created by deploying from `app/` by mistake (no env vars, not linked any more). Always deploy from the repo root. The owner can delete `app` in the Vercel dashboard.
- Episode 1 gaps closed with 4 new pictures: the ritual on video (1.1a), Unity's dream on video (1.3d, the conversation now happens there), Ethel Cripps fleeing with the tools (still, 1926), Burgess dead before the sphere (still, 1947).
- Part Two live (source chapter 2, the sand): end of Part One -> Continue -> 2.2 the Three at the crossroads (live talk, three questions) -> 2.3 Johanna Constantine in London -> 2.4 Rachel's room (gentle or cruel ending; sets CONSTANTINE_ALLY or CONSTANTINE_CURSE and relic sand) -> end-2a. New cast/places: character-prompts.md 3.8-3.10 and 4.10-4.12; shots in production/ep1-shots.json (`"still": true` = image only). AI test: 8 of 8 lines reached the right outcome.
- Spend: Y364.29 of Y400 after this round (6 clips, about 20 images, 25 narrator lines). One image costs about Y0.46.
- Episode Two complete and live (owner approved Y120-150 more): 2.5 Hell gates and Nada, 2.6 Lucifer, 2.7 the Oldest Game (typed forms vs Choronzon; lose = replay; a `triggers` rule makes "hope" after anti-life always win), 2.8 Lucifer's threat, 2.9-2.11 John Dee and the ruby, 2.12 Death and her rounds, end-ep2. Part end cards have Continue.
- Owner feedback handled: characters now have "talking" loops (react/<who>-talking.mp4) that play only while their voice is audible; finished clips keep a slow push-in; "<Name> is typing" bubble while a reply loads.
- Dialogue resilience: the gateway's Claude channel failed intermittently ("OAuth refresh failed"). The route now falls back to MODEL_DIALOGUE_FALLBACK (default gpt-5.4-mini, then gemini-3-flash).
- Spend: Y475.28 total (this round Y111 of the approved Y150). One 5 s loop about Y3, one 10 s clip about Y6, one image about Y0.46.
- Next in the source: Episode 3, the Endless family (Destiny's garden, the convocation, Desire's bait). Needs a new budget.
- Owner feedback round (2026-10-22, nine points) done and live:
  - Story flow: every scene change must say WHERE, WHY and WHO. Chapters are named Prologue, Chapter 1-11, inside Part One / Part Two. Each scene has a `recap` line for "Story so far".
  - The Three: card `speakers` (MAIDEN/MOTHER/CRONE) give each labelled part its own on-screen name and voice; the player splits "MAIDEN: ... CRONE: ..." replies.
  - Player: fullscreen toggle and pause menu (Story so far, Chapters, Restart chapter, Play on another phone, Start over); "Your choice" card on every decision; "Previously" card when returning; offline/server errors shown with Retry.
  - Steering: characters push toward the scene's exits in character, more plainly near maxTurns; asking questions never ends a scene.
  - Saves: local always; optional cloud save code (`/api/save`, Vercel Blob `saves/<code>.json`, no login).
  - Model safety net: gateway.ts circuit breaker benches a failing model for 3 minutes, uses MODEL_DIALOGUE_FALLBACK (gpt-5.4-mini, gemini-3-flash), then tries the main model again. `GET /api/dialogue?probe=0` shows what is benched.
  - Story check: `npm run check` (also runs before every build) fails on duplicate Ideas lines, broken links, choices that are not exits, unknown characters, missing pictures or narration.
- PRODUCTION RULE for new scenes (cost): default to a still image with `fx` (rain, embers, ash, dust, glitter, snow, mist, flicker) and the hand-held still camera; use video only for key moments (a transformation, a face that must move, an action beat). One still is about Y0.46; a 10 s clip about Y6.
- Aurie's face fixed in 1.1b and 1.2b-A (published as clips 1.1b-v2 / 1.2b-A-v2 to beat phone caches). Lesson: when a fresh generation keeps drifting, EDIT an approved high-likeness image instead (`node scripts/edit-image.mjs <src> <out> "<change>" --score aurie`).
- Part Three live: 3.1 Destiny's garden, 3.2 the family of the Endless (labelled speakers DESTINY/DEATH/DESIRE/DESPAIR/DELIRIUM via card `speakers` + conversation `speakerNames`), end-ep3. Flags set: NADA_QUEST, STORMED_OUT, PRIDE_LOCK, ACCUSED_DESIRE.
- Spend: Y523.60 total (face fix about Y20, Episode Three about Y26).
- UI round from research (VN and interactive-film conventions): no tap-to-skip on the picture; Skip button top-right (tap = next line, hold 0.9 s = skip this part); Undo on the "Your choice" card; Recent lines backlog; text size and music settings; one-time tip; 48 px touch targets; Ideas ignore taps for 400 ms after opening.
- Speed: dialogue streams (gatewayStream) and the voice is made as soon as the spoken line is complete, returned in the reply (`voice` field); openings are voiced during the narration. Measured: local 5-8 s per turn, production 9.5-11.5 s (the gateway itself answers Vercel slowly, 2-11 s even for tiny calls; hkg1 tested, no better, so functions stay in sin1). The biggest remaining lever is a faster model (gpt-5.4-mini) if the owner prefers speed over Haiku's writing.
- Voices: gpt-audio sometimes ANSWERED a line instead of reading it. lib/server/voice.ts synthLine fences the line as a script, checks the returned transcript, retries up to 3 times. Stage directions in *asterisks* are moved out of the spoken line into narration. MiniMax speech-2.8-turbo is on the key but offers only two Mandarin voices (WAV), so it is not used.
- Update notice: /api/version vs NEXT_PUBLIC_BUILD_ID; an open tab offers "Update now" when a newer deployment is live.
- Part Four live: 4.1 Hell empty (Lucifer resigns, key, wings), 4.2 the suitors (multi-speaker card `suitors`), 4.3 Nada, end-ep4. Loki and Nuala redesigned to resemble no real actors (always check new faces for celebrity likeness).
- Spend: Y561.37 total (was Y558.87 before the Parts One/Two audit) (Episode Four about Y21; audit, tests and narration about Y10).
- Parts Three/Four audit: new scene 3.0 The Mending (Lucienne brings Destiny's letter; can explain the Endless); bridges for Nada's history, every route into Hell, the suitors' arrival, Nada's arrival; ends of Parts Three/Four reflect choices.
- AI replies: schema starts with a private `subtext` (what she really feels/wants) and `mood`, then `dialogue` (<=40 words); prompt sections READ HER FIRST and SOUND LIKE A PERSON; mood also directs the voice (voice.ts DELIVERY).
- Fixed: the player's newest line was sent twice (history + playerLine). The route now drops the duplicate; this also fixes scenes ending one turn early.
- Parts One/Two audit: branch scenes 1.6 Paul (only after 1.5.A Eternal Waking; lift the curse or not) and 2.4b Johanna's Curse (only after 2.4.B; apologise or walk away), plus bridges (prologue nightmare, why Alex comes down, travel to Hell and to the ruby, who Death is). Old Alex in still-paul-1988 scores 0.32 (aged faces score low against young photos; the alex-old sheet itself is 0.44); face-refine made him young, so the unrefined, consistent version is used.
- Design rule now: a cruel or extreme choice should get an answer on screen (a character who reacts, a branch), not just a flag.
- Next in the source (story-map.md Episode 5, "Reflections on Humanity"): Calliope, Rose Walker and the Corinthian, Hob Gadling, Lyta Hall. Needs a new budget.
- Angle sheets (owner request: "more angles" for consistency): character-prompts.md §3c. Each video character gets `characters/<id>/heads.png` (six head angles) and `turnaround.png` (front, three-quarter, profile, back). `npm run gen -- angles` (group) or `one <id>-heads`. Any keyframe that references `characters/<id>/sheet.png` now automatically attaches that character's angle sheets too (generate-images.mjs `withAngles`). Done for Aurie (heads 0.47), Alex young (heads 0.62, turnaround 0.53), Lucienne, Death, and the Part Five cast.
- Video with reference images: tested `wan3.0-video` (Wan 3.0 accepts up to 10 reference images through DashScope's `media` array), but the Infistar `/v1/videos` route ignores `metadata.input.media` and renders text-to-video instead (cost Y4.81 for the probe; 720p not offered for it, 1080p about Y0.96/s). Not usable for references through this gateway today; `wan2.7-i2v` from an angle-informed keyframe stays the pipeline.
- Part Five (source chapter 5, "Reflections on Humanity"), live: 5.0 Lucienne's kept prayer -> 5.1 Calliope (free her first or go to Madoc first) -> 5.1b Richard Madoc (flood with ideas / Calliope decides / empty him) -> 5.2a the Corinthian at the killers' convention (unmake / remake / let go) -> 5.2b Rose Walker the vortex (kill or wait; both reach Unity, but raising a hand to Rose is remembered) -> 5.2c Unity Kincaid takes the vortex -> 5.2d Desire's Threshold (threaten / warn) -> 5.3 Hob Gadling 1389-1789 (speak up about slaving or not) -> 5.3b 1889 (walk out / "Perhaps") -> 5.3c 1989 (call him friend or not) -> end-ep5. New cards: calliope, madoc, corinthian, rose, unity-old, hob, desire. Madoc was redesigned once because the first sheet resembled the TV actor.
- Part Five media: 14 stills, 6 clips (5.1a, 5.2aa, 5.2ba, 5.2ca, 5.3a, 5.3ca), talking loops for hob and calliope. Hob in 1889 uses card `hob-1889` (same text) so the 1989 pub loop does not play over the Victorian scene. Aurie in the 1389 tavern (5.3a) scores 0.35 (three-quarter face in firelight) after face refine; judged a clear likeness by eye. Production dialogue test: 8 of 8 new conversations in character, right consequences and exits.
- Spend: Y602.22 total (Part Five and angle sheets about Y41, including the Y4.81 Wan 3.0 probe).
- Owner rule (2026-10-22): new characters should lean Asian where the source does not fix their look; do not change approved characters.
- Next in the source: Episode 6, "Redemption and Change" (Orpheus, Lyta Hall and Daniel, the Kindly Ones seeded). Needs a new budget.
- Angle sheets for the remaining cast done (heads + turnaround): alex-old (heads 0.46), burgess, paul, guard, johanna, rachel, lucifer, choronzon, dee, destiny, desire, despair, delirium, madoc; turnaround only for azazel, corinthian, unity. Group sheets (fates, norse, faerie, angels) still need splitting into one sheet per person before angle sheets make sense.
- Owner feedback: Aurie did not look like herself in the opening throne shot (0.0a) or as the girl forming in the glass sphere (1.1a). Replaced with 0.0a-v2 (close-up on the throne, 0.42-0.44 through the clip) and 1.1a-v2 (Aurie kneeling inside the clear sphere, face large; keyframe 0.46, clip 0.29-0.34 because of the curved glass, clear likeness by eye). New ids beat phone caches. Face refine and edit-from-approved did NOT raise 0.0a's score; a fresh keyframe with the angle sheets did.
- Spend: Y619.28 total.
- Owner feedback: Aurie looked naked kneeling in the sphere (1.1a-v2). 1.1a-v3: same approved keyframe edited to a plain white strapless tube dress (likeness unchanged, 0.45), 5 s clip with calm motion (no leaning into the glass, mouth closed); her eyes close at the end, leading into 1.1b where she wakes. Rule: Aurie is never shown unclothed; dress her in white in sphere/captivity shots.
- Owner UI round (2026-10-22 evening): the inner thought ("Aurie, thinking") no longer times out; it clears when she sends a line or taps it. The "Your choice" card has no button on it any more (a tappable Undo there bounced players back into the scene by reflex); "Undo my last choice" is in the pause menu and works until the next scene starts (`undoRef` is cleared in `goTo`). Scene changes go through a black curtain (`.curtain`, z-index 18: above picture, subtitles and cards, below the rotate prompt, update bar and menu); `goTo` waits CURTAIN_MS (700 ms) before swapping the scene and lifts the curtain 350 ms after, and if the next scene has a different music track the old bed starts fading out with the curtain. In-scene picture dissolves are 0.9 s with the previous layer kept 1 s.
- ChatGPT status: the only ChatGPT branch is `codex/player-experience-audit` (draft PR #1, 2026-10-22 00:01). It has no sound-effect or ambience work and conflicts with everything since; see CHANGELOG.md "In flight".
- Audio round (2026-10-22, late; ChatGPT's `codex/audio-completion-audit` merged): see `audit/README.md`, section "Claude's verification and integration", for the full story. Rules that came out of it:
  - Never trust the voice model's transcript alone: `lib/server/voice.ts` decodes and measures every take (`lib/server/mp3.ts`: dead tail over 1.5 s, silence over 3.5 s, over 0.65 s per word plus 8 s) and records two takes at once. Do not use the `cedar` voice (about 1 take in 4 unusable).
  - Character voices are levelled in the player (`lib/story/level.ts`, Web Audio, target −22 dBFS). The mixer opens on the start-screen tap.
  - A re-recorded narration line keeps its file name: add its id to `REVISED` in `lib/story/lines.ts` so phones fetch the new file.
  - Music is chosen only by `music` in `book.json`; all beds live in `app/public/clips/sandman/audio/music/` (Blob). New beds: `hell-v1` (Hell), `wings` (Death, Unity), `ruby` (2.9, 2.10), `tavern` (5.3).
  - `tools/audit_narration.mjs` re-checks every narration recording (needs the key; about 400 transcriptions).
  - The screen stays awake while playing (Screen Wake Lock, re-requested on returning to the page). The title page and the player show a rotate prompt on upright phones.
- Aurie on screen (owner, 2026-10-22): after Chapter 4 her face appeared only once in 20 chapters (an early "first-person" design choice). A chapter-by-chapter plan for adding her back is pending the owner's budget.
