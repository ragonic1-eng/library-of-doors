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

- Likeness check, free and local: `python -I tools/face_score.py aurie|alex <files>` (OpenCV YuNet and SFace; the models are downloaded into `tools/models/`, not committed). The score is mean cosine similarity to the real photos: 0.5 or above strong, 0.4 to 0.5 acceptable, below 0.4 reject. It cannot judge heavy aging (1988 Alex), so judge those by eye.
- Faces: always put the real photo face crops first and use the identity locks in `production/ep1-shots.json`. Keep faces large in frame. Never slim or beautify.

## Services and money

- One gateway key (Infistar, OpenAI-compatible) covers everything. It lives in `.env` and `app/.env.local`, which are never committed. **Never put the key in chat or in git.**
- Models in use: video `wan2.7-i2v` (Kling is restricted on this key), images `gemini-3-pro-image`, dialogue `grok-4.20-0309-reasoning` (20 to 40 s per reply; `claude-haiku-5-5` measured 2.5 s with better writing; the owner has not yet decided), voice `gpt-audio-1.5`.
- **Budget is limited.** The clip generator enforces a real-spend cap (`CLIP_BUDGET_CNY`, currently 250 yuan). No rerolls without a reason. Measure with the face scorer before re-rendering.

## Not in git (local only)

The novels and extracted text, the family photos (`characters/`), generated images and clips (`assets/`, `app/public/clips/`), the face models, and the key. An assistant without access to the author's PC can work on design, story, prompts and code, but not generate media.

## Current status (update this section as you go)

- Episode 1: 24 scene clips rendered; Alex's 1970s shots re-rendered with his real face; Aurie's master sheet regenerated from her photos (likeness 0.50) and her face shots need new keyframes and clips; reaction loops partly done.
- Gameplay: consequence engine, relations, echoes, action narration, and two new conversations (the sleeping girl Unity in 1916, old Alex at the escape) are built.
- Open decisions for the owner: dialogue model (Grok or Haiku), budget beyond 250 yuan, the Neverwhere hero's name (default Rachel Mayhew), the Vercel URL.
