# The Library of Doors — handoff guide for any AI assistant

Read this first. It lets ChatGPT, Claude or any other assistant continue the project without the original conversation.

## What this is

A private gift: an interactive video novel for the author's wife, Charmaine, who plays the hero **Aurie**. It is a web app (Next.js, deployed on Vercel) built from four linked books: *The Sandman* (Book 1, in production), *Neverwhere*, *Coraline* and *The Alchemist* (mapped, not built). The author plays **Alex Burgess** in The Sandman. Immersion is the top priority: realistic video, live AI characters, choices with consequences.

## Read these, in this order

| File | What it holds |
|---|---|
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
- **Narration**: after editing any beat text, run `python -I tools/gen_narration.py --engine gateway --voice ash` (renders only lines without a recording into `assets/audio/lines-raw/`), then `tools/venv/Scripts/python tools/pace_lines.py` (trims dead air and lifts slow lines to about 2.5 words a second, writing `app/public/clips/sandman/audio/lines/`). `--engine kokoro` or `--engine chatterbox` (in `tools/venv-tts`) are free local alternatives.
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
- Still parked: Aurie shots 1.1b and 1.2b-A face drift.
