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

- `src/content/books/sandman/book.json` — the scene graph. Each scene: clips, narration, optional `narrationIf`, `hook`, `episodeTitle`, a `conversation`, and `choices`.
- `src/content/characters/sandman.json` — character cards (voice, wants, knows, secrets, red lines, TTS voice and direction).
- `src/app/api/dialogue/route.ts` — live dialogue. The model plays the character and returns JSON: `dialogue`, `narration`, `inner_thought`, `mood`, `decision`, `consequences`, `trust_delta`, `fear_delta`, `memory_note`. The server validates every id against what is allowed right now.
- `src/app/api/tts/route.ts` — voice, via `gpt-audio-1.5` directed as a voice actor.
- `src/components/Player.tsx` — the player: clips, hand-held sway, reaction loops per mood, conversation UI, consequences, ripples.
- `src/lib/state/profile.ts` — save state: traits (mercy, loyalty, courage, faith), flags, relations (trust and fear per character), echoes, memory.

### How consequences work (the gameplay core)

Every conversation has:
- `canon`: facts the character may never contradict.
- `possibilities`: the likely approaches and how the scene bends to each, so improvisation stays on-story.
- `consequences`: a menu of tagged outcomes. The model fires a tag only when the player's latest words or actions earn it. Each fires once, applies effects, changes the speaker's trust and fear, can show a `ripple` line on screen, and can leave an `echo`: a story fact that later characters (listed in `knownBy`) remember and mention.
- `exits`: where the scene may end. Choices can carry `requires` (hidden until earned) and `effectsIf` (extra cost or reward from earlier deeds).

To add depth to a scene, add to its `possibilities` and `consequences`, and add `narrationIf` lines or `knownBy` echoes that pay them off later. Keep consequences tied to the actual books.

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

## Not in git (local only)

The novels and extracted text, the family photos (`characters/`), generated images and clips (`assets/`, `app/public/clips/`), the face models, and the key. An assistant without access to the author's PC can work on design, story, prompts and code, but not generate media.

## Current status (update this section as you go)

- Live for the author's phones at https://library-of-doors.vercel.app (Singapore region, Blob-hosted clips, Haiku dialogue, gpt-audio voice). Clip spend about 299 of the 400 yuan cap.
- Episode 1: all 24 scene clips and all 21 reaction loops exist and are uploaded. Alex (the author) is consistent everywhere. Charmaine (Aurie) is consistent in 0.0a, 1.2b-B and the master sheet; 0.0c was re-rendered (check its frames: the shot ends in a flare); 1.1b, 1.2b-A and 1.5b still use an older, drifted face because the glass distortion in those compositions defeats the face-refine pass. Fix idea: reframe those three as close-ups with less glass between camera and face, then generate, refine and gate at 0.40.
- Gameplay: consequence engine, relations, echoes, action narration, and the Unity and old-Alex conversations are live.
- Known gap: the first AI reply after idle can take 7 to 16 s on Vercel (about 3 to 4 s on a PC); the gateway itself has a 2 to 4 s floor per call. The start gate warms the functions; a `?probe=1` GET on `/api/dialogue` reports gateway timing from inside Vercel.
- Open decision for the owner: the Neverwhere hero's name (default Rachel Mayhew).
