# Neverwhere: production plan (v0.1, 2026-10-23)

Book 2 of *The Library of Doors*. This plan answers three questions the owner asked before a single scene is
scripted: does it continue from The Sandman or stand alone; what The Sandman taught us about wasted money; and
how the branches get planned and locked **before** any script, picture or voice is made. The story itself is
already mapped from a full read of the novel in `story-map-neverwhere.md`; this plan decides how to build it.

Numbers marked *est.* are estimates from the Sandman unit costs; everything else is measured.

---

## 0. The two answers first

**1. Same series, new world: not a continuation of the Sandman plot.**
Neverwhere is Gaiman's other London, and London Below is not the Dreaming. Forcing Morpheus, Lucienne or the
Endless into it would break both stories. What continues is the frame that already exists in the game: Aurie in
Lucienne's library, the wall of doors, her traits and relics. She sits in the reading chair, closes her eyes, and
opens them as the hero of Neverwhere; when the book ends she wakes in the library with its relic in her hand (the
Black Friars' silver key). Three or four one-line echoes of Sandman choices are already written into the map
(Vandemar has heard of "a man who dreams of waking" if Alex was cursed; Richard answers Islington's sneer about
Lucifer if she met him), and they stay text-only, so they cost nothing. The bonus is that the heroine of
Neverwhere is literally named **Door**, which makes the Library of Doors frame feel designed rather than bolted on.

**2. The hero is Aurie, as in Book 1.** The series bible once suggested "Rachel Mayhew"; since Book 1 renamed
Dream to Aurie and the credits say "Aurie · Charmaine Lim", the simplest and most consistent choice is
**Aurie Mayhew**. Jessica's "Richard... Maybury?" becomes "Aurie... Maybury?" and nothing else changes. Every
romance stays as the novel wrote it (Jessica stays the fiancée). The owner can still pick Rachel or Richard.

---

## 1. What The Sandman cost, and where the money leaked

Measured on 2026-10-23 (`npm run clips -- spend`, `book.json`, the media folders, `CHANGELOG.md`):

| The Sandman as built | |
|---|---|
| Gateway spend, total | **¥1,187** |
| Scenes / narrated beats / choices | 95 / 601 / 133 |
| Scenes whose choices lead to different next scenes | 25 of 95 |
| Clips generated / clips the story actually plays | **120 / 81** (39 never used) |
| Stills generated / used | 221 / 190 |
| Talking and listening loops | 51 |
| Narration lines recorded | 837 |
| Character cards / character folders with sheets | 41 / 41 |
| Music / ambience / sound effects (all local, free) | 27 / 24 / 12 |
| Unit costs | clip 5 s about ¥3; image about ¥0.46 (flash) to ¥0.9 (nano-banana); one voice take about ¥0.17 |

Where it leaked, in order of size:

| Leak | Evidence | Cost |
|---|---|---|
| **Pictures that did not match their words, fixed afterwards** | The audit found 295 of 695 narrated lines weak against their picture; fixing it took 85 re-points, 42 new stills and 22 new clips, plus the 27 contradicting lines | about ¥90 *est.* |
| **Re-renders for things decided late**: costume (white dress to black gown, 6 clips), scale (the sphere: three passes, 14 + 9 edits, 3 + 5 clips), props (the helm), gender (Orpheus to Orphea, a whole stretch), faces (about 10 clips) | CHANGELOG 2026-10-22 and 10-23 | about ¥90 to ¥110 *est.* |
| **Clips generated and never used** | 39 of 120 clip files are not referenced by the story (early takes, alternates, shots cut when scenes were rewritten) | about ¥117 *est.* |
| **Checking voices with the paid voice model** | one round of gpt-audio transcription checks | about ¥76 |
| **Angle and turnaround sheets for 30+ characters** | the likeness audit later showed they cannot help video at all (the video model sees only the first frame) | about ¥30 *est.* |
| **Probes without a go/no-go** | Wan 3.0 reference mode through the gateway ignored the references | ¥4.81 |
| **Story rework** (time rather than gateway money): branches added in five separate passes; 56 of 99 flags were set and never read; Parts Five and Six had no real branches at launch; Aurie was off screen for 20 chapters after Chapter 4 and needed 20+ pictures added later | CHANGELOG | sessions, not yuan |

About **¥400 of the ¥1,187, a third, was avoidable** *est.* Nearly all of it comes from one habit: generating
before the story, the cast and the props were final.

---

## 2. The twelve rules for Neverwhere

Each rule names what enforces it. A rule with no check is a wish.

| # | Rule | What it prevents | Enforced by |
|---|---|---|---|
| 1 | **The branch map is locked before a word of script.** Every choice either opens a variant scene, or sets a flag that is read at a named later scene, or is cut. | 56 unread flags; branches bolted on in five passes | a skeleton `book.json` (ids, choices, flags, conditions, no prose) that passes `check-story` and a play simulator: every scene reachable, every ending reachable, every flag read somewhere. Shown in the Developer menu map for sign-off |
| 2 | **The hero is on screen in every core scene**, at least one picture of Aurie per scene; cutaways are the only exception and never more than two in a row. | Aurie vanishing for 20 chapters | a count in `check-story` (to add) |
| 3 | **Script, then picture plan, then audit, then voice.** Narration is recorded once, after the text is frozen. The picture plan carries a one-line caption per slot and is audited against the lines before anything is generated. | 295 weak lines fixed after the fact; re-recorded narration | `audit_pictures` / `match_pictures` run on the plan, not on the finished game |
| 4 | **The bible comes before the shots.** Every character's gender, age, ethnicity and look is decided and approved on a sheet; every prop that appears with Aurie has a reference picture (the key, Hunter's knife, Door's flying jacket, the Beast, Croup and Vandemar's suits, the Angelus door) made first, the way `sphere.png` and `helm.png` should have been. Aurie's seven looks in this book are edits of one approved base picture. | the sphere's three passes, the helm, the gown, Orphea | the Part 1 storyboard cannot start until the bible is approved |
| 5 | **Stills and animated overlays by default; a video quota per Part.** No picture is generated before its scene's beats are final; no "spare" clips. | 39 unused clips | the quota table in §5; `generate-clips` only renders shots listed in the frozen storyboard |
| 6 | **Faces: first frame from an approved still, medium shots, calm motion, automatic likeness check, free face-restoring pass.** | face re-renders | `LIKENESS.md` rules 1 to 8, already in the tools |
| 7 | **One render per clip.** If a clip fails its checks, the beat keeps its still plus an overlay; a second render needs a named reason in the changelog. | rerolls | the budget cap per Part |
| 8 | **Probes are cheap, once, and have a go/no-go line written down before they run.** | Wan 3.0 | §6, decision 3 |
| 9 | **Every check is local and free.** Likeness (OpenCV), face restore (FaceFusion), music, ambience and effects (MusicGen, AudioLDM), and now voice transcripts too: add `faster-whisper` locally instead of paying the voice model to listen. | the ¥76 round | `tools/` |
| 10 | **Real-actor check on every sheet before approval.** | Madoc, Loki, Nuala, Hob, Burgess redesigns | a gate in Phase 4 |
| 11 | **Ranked backups and a spend cap in every tool** (already built). | stalls and overruns | `MODEL_*_FALLBACK`, `--budget` |
| 12 | **Each Part is signed off in the Developer menu before its voice is recorded, and the changelog gets a line per Part with its cost.** | late rewrites after money is spent | the owner's sign-off per Part |

---

## 3. How it is built: phases and gates

Nothing costs money until Phase 4, and nothing is generated for a Part until that Part's storyboard is frozen.

| Phase | What | Who signs | Cost |
|---|---|---|---|
| 0 | **Decisions** (§6) | owner | ¥0 |
| 1 | **Branch spine lock.** The skeleton `book.json` from `story-map-neverwhere.md`: every scene id and title, every choice with its flag or variant, every condition, every picture slot marked still or clip, no prose. `check-story` and the simulator pass. The owner walks the map in the Developer menu and approves the shape. | owner | ¥0 |
| 2 | **The second door.** Engine work: the library hub with two doors, switching books, the LOYALTY trait and this book's variables (DOOR_BOND, MARQUIS_TRUST), the way in and out of the book (series bible §2b), tests. | me | ¥0 |
| 3 | **Script, one Part at a time.** Beats (one narrated sentence each), choice aftermaths, conversation cards (22 live talks in the map; the dialogue engine is reused as is), the picture plan with a caption per slot, the hero-on-screen count, the text audit. Each Part's storyboard is read in the Developer menu before it is frozen. | owner reads, me | ¥0 |
| 4 | **The bible.** Cast sheets (about 24 named characters), expression sheets only for the 10 who speak most, Aurie's base and her seven looks, prop references, the two palettes (London Above: sodium orange and glass; Below: fire, ochre and soot). Real-actor check. | owner approves faces | about ¥35 *est.* |
| 5 | **Media per Part, in story order.** Stills first (1 candidate, 2 only when Aurie is in it), then clips from approved stills, then talking loops, each with its checks and the restore pass. | me, checks | about ¥300 *est.* |
| 6 | **Voice and sound per Part.** Narration once; music, ambience and effects made locally in one pass per place. | me | about ¥105 *est.* |
| 7 | **QA and deploy per Part.** Simulated plays reach every exit; the owner plays the Part on the phone; the changelog line carries the Part's cost. | owner | ¥0 |

The first thing the owner sees after saying go is Phase 1: the whole of Neverwhere as a map in the Developer menu,
every fork and ending visible, before any writing.

---

## 4. The branch spine (from the story map, with the tightenings proposed)

Eight Parts, 49 core scenes, 14 cutaways, 5 endings plus one variant. Three **master switches** decide the
ending: **the key** (keep it after the Ordeal and refuse to lend it at the market, and there is no copy for Door to
trick the angel with: the road to Ending D), **the knife** (refuse Hunter's knife and the canonical ending is
impossible), and **Hunter's secret** (collect two clues and Richard can warn Door before the betrayal).

| Part | Core scenes | The fork that opens a variant scene | Flags set here, and where they are read |
|---|---|---|---|
| 1 Doors | 1.0 to 1.7 (+C1) | 1.2 carry Door home, or dial 999 and find her again at midnight | UMBRELLA_GIVEN (6.5, 8.9); TOLD_CV (5.2); RAT_RESPECT (2.3, 2.4); MARQUIS_TRUST starts |
| 2 Fallen through the cracks | 2.1 to 2.6 (+C2 to C4) | 2.3 Iliaster leads you down, or a night on a bench and the rats | ANA_HEARD (6.5, 8.6); BEAD_KEPT (3.1, 6.5); 2.6 "you let go" echoed in 6.5 |
| 3 The Floating Market | 3.1 to 3.4 (+C5, C6) | 3.3 sit down in the sewer, or follow them at a distance | OLD_BAILEY_FRIEND (C13, 8.6); LAMIA_NOTICED (7.1, 7.5); DOOR_PROMISE (8.7) |
| 4 Earl's Court | 4.1 to 4.4 (+C7 to C9) | 4.3 speak up for the marquis, or call him dodgy | MARQUIS_TRUST ± (A vs A-variant); 4.2 heeded Hunter (an anchor in 6.5) |
| 5 Angels over England | 5.1 to 5.6 (+C10) | 5.3 Jessica: tell her gently, cheekily, or walk away (security or not) | HUNTER_SUSPECT (7.6); ANA_ASKED (8.6); ISLINGTON_BARGAIN self / door / atlantis (8.4); TOLD_CV pays off |
| 6 The Ordeal of the Key | 6.1 to 6.6 (+C11, C12) | 6.5 the Ordeal: hold on, or climb down (Ending E, return to the last choice); 6.6 toss the key to Door or keep it | BEAST_SHARED (8.2); KEY_TAKEN (7.2, 8.7) |
| 7 Down Street | 7.1 to 7.6 (+C13) | 7.2 lend the key or not (NO_COPY); 7.6 warn Door if HUNTER_SUSPECT ≥ 2 | NO_COPY (8.4, Ending D); LAMIA_GUIDE (7.5); decoy with the old key (bruises in Part 8) |
| 8 The Beast, the angel and the door | 8.1 to 8.9 (+C14) | 8.2 strike, throw, or drag Hunter clear (LATE); 8.4 the copy path or the real-key path; 8.5 give the key back; 8.7 go home or stay; 8.9 cut the door or take the taxi | WARRIOR, KNIFE, HUNTER_FORGIVEN, KEY_RETURNED, ABOVE_ANCHOR, KEPT_FEATHER: all read in 8.6 to 8.9 and the endings |

Endings: **A** *Are you coming?* (the marquis at the cut door), **A-variant** (Door opens it), **B** *Sir Richard
of the Underside* (she never goes up), **C** *Get used to it* (the taxi), **D** *Jam tomorrow* (the angel walks
free; return to the last choice), **E** the wall of those who failed (the Ordeal; return to the last choice).

Tightenings proposed so the map stays buildable within the quota (the story map keeps everything; these decide
what gets media):

- **Variant scenes capped at about twelve** (one per Part plus the endings). Every other consequence is a line
  that reads a flag, which costs words, not pictures. The Sandman showed that variant scenes are where media cost
  hides.
- **Cutaways: four on video, the rest as a still with narration.** Video: C1 Door's fall through the wall, C3 the
  House Without Doors, C10 the marquis trading questions with the killers, C13 the marquis coughing up the sewer.
- **2.1's "pick three of five attempts to be seen" becomes one choice** with the montage as stills.
- **Endings D and E are "return to the last choice"**, so each is one still and a few lines.
- **Aurie is in every core scene by nature** (the novel never leaves Richard), so rule 2 costs nothing here; the
  cutaways are the only beats without her and are spaced so no two run back to back.

---

## 5. Media quota and budget

| Per Part (8 Parts) | Quota |
|---|---|
| Stills | about 20 (160 in all, plus about 10 for endings and the hub) |
| Clips | 5 (40 in all): the Part's one big moment, one POV beat, one cutaway where listed, two of Aurie at medium shot |
| Talking loops | 12 for the whole book (Door, the marquis, Hunter, Croup, Vandemar, Islington, Anaesthesia, Old Bailey, Lamia, the abbot, Jessica, the earl), made as ping-pongs |
| Narration | about 70 lines per Part (about 550 in all), recorded once |
| Music / ambience / effects | one theme per recurring place and person (about 14 themes, 12 beds), all local and free |

| Budget item | Count | Cost *est.* |
|---|---|---|
| Stills for scenes (1 candidate, 2 where Aurie is in it) | about 220 images | ¥100 |
| Cast, Aurie's looks, props | about 60 images | ¥35 |
| Clips: 40 story + 4 hub and threshold + 12 loops, plus a 15% re-render allowance | 56 clips | ¥195 |
| Narration, plus 10% retakes | about 550 lines | ¥105 |
| The multi-reference video test (§6, decision 3) | once | ¥15 |
| Dialogue and play checks | | ¥10 |
| **Total** | | **about ¥460** |

Proposed cap **¥500**, hard stop ¥550, enforced per Part by the clip tool's budget flag. For comparison The Sandman
cost ¥1,187 for 95 scenes (about ¥12.50 a scene); this plan is about ¥6.50 a scene for a story of similar length,
and the difference is the twelve rules, not lower quality: the same video model, the same stills, fewer of them
wasted. A leaner alternative (25 clips, cutaways all as stills) would land near ¥350.

---

## 6. Decisions needed from the owner before Phase 1

1. **The hero's name.** Aurie Mayhew (recommended) / Rachel Mayhew / Richard.
2. **Scope and cap.** Full story with the quota above, cap ¥500 (recommended) / lean, cap ¥350.
3. **A ¥15 test before Part 1** of `kling-video-o1`, a video model on the key that takes several reference photos of
   one person. Go/no-go written now: it goes into the ranked list ahead of wan2.7 only if the same Aurie shot
   scores 0.45 or better on its worst frame where wan2.7 scored under 0.35. Otherwise it is never tried again.
4. **Casting London Below.** The novel fixes some looks (the marquis is Black; Hunter's skin is burnt caramel; the
   friars are dark-skinned; Croup is pallid with orange hair; Islington is androgynous and golden-haired), and those
   stay. For the characters the book leaves open, the standing rule says new characters lean Asian: recommended
   as East and South-East Asian Londoners are **Door, Anaesthesia, Jessica, Gary, Lamia, Hammersmith and Lear**;
   Old Bailey, the earl, Serpentine and the abbot stay as written. No real-actor lookalikes anywhere.

---

## 7. What happens right after the go

Phase 1, the same day: the skeleton `book.json` for Neverwhere, `check-story` and the simulator passing, and the
map visible in the Developer menu under a second door, so the shape of the whole book can be walked and changed
while changing it is still free. The first money is spent at Phase 4, after the owner has approved the cast.
