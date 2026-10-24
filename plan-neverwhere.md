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

## 2. The thirteen rules for Neverwhere

Each rule names what enforces it. A rule with no check is a wish.

| # | Rule | What it prevents | Enforced by |
|---|---|---|---|
| 1 | **The branch map is locked before a word of script.** Every choice either opens a variant scene, or sets a flag that is read at a named later scene, or is cut. | 56 unread flags; branches bolted on in five passes | a skeleton `book.json` (ids, choices, flags, conditions, no prose) that passes `check-story` and a play simulator: every scene reachable, every ending reachable, every flag read somewhere. Shown in the Developer menu map for sign-off |
| 2 | **The hero is on screen in every core scene**, at least one picture of Aurie per scene; cutaways are the only exception and never more than two in a row. | Aurie vanishing for 20 chapters | a count in `check-story` (to add) |
| 3 | **Script, then picture plan, then audit, then voice.** Narration is recorded once, after the text is frozen. The picture plan carries a one-line caption per slot and is audited against the lines before anything is generated. | 295 weak lines fixed after the fact; re-recorded narration | `audit_pictures` / `match_pictures` run on the plan, not on the finished game |
| 4 | **The bible comes before the shots, one character at a time: every new character's sheet is generated, shown in chat and approved by the owner before that character appears in any still or clip** (owner's rule, 2026-10-24). Every character's gender, age, ethnicity and look is decided and approved on a sheet; every prop that appears with Aurie has a reference picture (the key, Hunter's knife, Door's flying jacket, the Beast, Croup and Vandemar's suits, the Angelus door) made first, the way `sphere.png` and `helm.png` should have been. Aurie's seven looks in this book are edits of one approved base picture. | the sphere's three passes, the helm, the gown, Orphea | the first batch's storyboard cannot start until the bible is approved |
| 5 | **Stills and animated overlays by default; a video quota per batch.** No picture is generated before its scene's beats are final; no "spare" clips. | 39 unused clips | the quota table in §5; `generate-clips` only renders shots listed in the frozen storyboard |
| 6 | **Faces: first frame from an approved still, medium shots, calm motion, automatic likeness check, free face-restoring pass.** | face re-renders | `LIKENESS.md` rules 1 to 8, already in the tools |
| 7 | **One render per clip.** If a clip fails its checks, the beat keeps its still plus an overlay; a second render needs a named reason in the changelog. | rerolls | the budget cap per batch |
| 8 | **Probes are cheap, once, and have a go/no-go line written down before they run.** | Wan 3.0 | §6, decision 3 |
| 9 | **Every check is local and free.** Likeness (OpenCV), face restore (FaceFusion), music, ambience and effects (MusicGen, AudioLDM), and now voice transcripts too: add `faster-whisper` locally instead of paying the voice model to listen. | the ¥76 round | `tools/` |
| 10 | **Real-actor check on every sheet before approval.** | Madoc, Loki, Nuala, Hob, Burgess redesigns | a gate in Phase 4 |
| 11 | **Ranked backups and a spend cap in every tool** (already built). | stalls and overruns | `MODEL_*_FALLBACK`, `--budget` |
| 14 | **Dead ends make choices matter** (owner, 2026-10-24). Seven scenes where Aurie dies or causes a death and the story goes back a few scenes, with her state restored to how it was when she first arrived there (flags, traits, relics, what the world remembers), not only the last choice. Each needs two wrong steps or one the story warned about: giving Door away twice (back to the gentlemen at the door), grabbing the Rat-speaker's glass with no rat's respect (back to the cash machine), letting go on Night's Bridge and walking on (back to Anaesthesia), crawling the plank alone without earned courage (back to the curry stall), taking Lamia's kiss after doubting the marquis twice (same), giving Door up to the killers (back to Down Street), throwing the spear as in the dream (back to the Fleet Marsh). The Ordeal (E) and the angel walking free (D) go back the same way, to the friars' bridge and to HMS Belfast where the key could still be lent. The card names what killed her and where the story resumes. **Every dead end and every ending plays on video, never a still alone** (owner's rule). | choices with no weight; a game-over that only replays one tap | `retryFrom` + checkpoints in the engine; `check-story` requires the retry scene to lead back to the dead end and a video on every ending; the simulator plays on from each death |
| 13 | **Talking loops close on their own first frame; scene clips play once and are never looped.** This rule covers only the loops that play while a character talks or listens to the player. Each must end on the picture it started from, so the join is invisible: (a) render it with the same keyframe as first **and** last frame, if the gateway accepts an end frame (tested once, see §6 decision 3; the motion prompt also says "returns to the starting pose, mouth closed, eyes where they began"); (b) if not, the free ping-pong (forward, then backward), which suits small head and mouth movement. Everything else (Hell and the demons, movement, fire, any dramatic beat) is a one-way scene clip: it plays forward once, is never ping-ponged, and if the beat must hold afterwards the player keeps the last frame with its slow push-in, as it does today. | the loop seam snapping every few seconds; reversed motion on action shots | the seam measure (first-to-last frame difference under 6) on talking loops only, before publishing |
| 12 | **Each batch of chapters is signed off in the Developer menu before its voice is recorded, and the changelog gets a line per batch with its cost.** | late rewrites after money is spent | the owner's sign-off per batch |

---

## 3. How it is built: phases and gates

Nothing costs money until Phase 4, and nothing is generated for a chapter until its storyboard is frozen. Work moves in **eight batches of chapters**, each signed off before the next: A Prologue to 3, B 4 to 6, C 7 to 9, D 10 to 11, E 12 to 14, F 15 to 17, G 18 to 20, H 21 to 23.

| Phase | What | Who signs | Cost |
|---|---|---|---|
| 0 | **Decisions** (§6) | owner | ¥0 |
| 1 | **Branch spine lock.** The skeleton `book.json` from `story-map-neverwhere.md`: every scene id and title, every choice with its flag or variant, every condition, every picture slot marked still or clip, no prose. `check-story` and the simulator pass. The owner walks the map in the Developer menu and approves the shape. | owner | ¥0 |
| 2 | **The second door.** Engine work: the library hub with two doors, switching books, the LOYALTY trait and this book's variables (DOOR_BOND, MARQUIS_TRUST), the way in and out of the book (series bible §2b), tests. | me | ¥0 |
| 3 | **Script, one batch of chapters at a time, Batch A first.** Beats (one narrated sentence each), choice aftermaths, conversation cards (22 live talks in the map; the dialogue engine is reused as is), the picture plan with a caption per slot, the hero-on-screen count, the text audit. Each batch's storyboards are read in the Developer menu before they are frozen. | owner reads, me | ¥0 |
| 4 | **The bible.** Cast sheets (about 24 named characters), expression sheets only for the 10 who speak most, Aurie's base and her seven looks, prop references, the two palettes (London Above: sodium orange and glass; Below: fire, ochre and soot). Real-actor check. | owner approves faces | about ¥35 *est.* |
| 5 | **Media per batch, in story order, built from the cast record.** Every keyframe takes its people from `production/neverwhere-cast.json`: each character's approved sheet (and angle sheets) as references and their lock text leading the prompt, so every fix the owner approved (Aurie's slimmer face, longer legs, black clothes and real smile; Door's outfit; Hunter and Lamia recast; the earl's left-eye patch; the Beast's tusks) reaches every picture and so every clip. `check-story` fails if anyone in a picture is missing from it. Stills first (1 candidate, 2 only when Aurie is in it), then clips from approved stills, then talking loops, each with its checks and the restore pass. | me, checks | about ¥300 *est.* |
| 6 | **Voice and sound per batch.** Narration once; music, ambience and effects made locally in one pass per place. | me | about ¥105 *est.* |
| 7 | **QA and deploy per batch.** Simulated plays reach every exit; the owner plays the batch on the phone; the changelog line carries its cost. | owner | ¥0 |

The first thing the owner sees after saying go is Phase 1: the whole of Neverwhere as a map in the Developer menu,
every fork and ending visible, before any writing.

---

## 4. The branch spine, by chapter

Every scene id is **chapter.position** (owner, 2026-10-24): 9.4 is the fourth scene of Chapter 9, whether it is a
scene, a cutaway, a variant, a dead end or an ending (the title says which); picture ids carry the same number
(`nw-9.4-...`) and choice ids add a letter (9.4.C). To ask for a change, name the id. The full list, regenerated from
the game after every change, is **`story-index-neverwhere.md`** (every scene, its kind, its pictures, its choices
and where they lead, and its number in the story map).

Prologue and 23 chapters, 94 scenes: 22 live talks, 12 cutaways, 9 dead ends (7 deaths plus the Ordeal and the angel
walking free), 4 endings and credits. Three **master switches** decide the ending: **the key** (keep it after the
Ordeal at 14.3 and refuse to lend it at 15.3, and there is no copy for Door to trick the angel with: the road to
20.7), **the knife** (refuse Hunter's knife at 19.3 and the canonical ending is impossible), and **Hunter's secret**
(two clues among 10.2, 10.4, 12.1 and 12.2, and Aurie can warn Door at 17.1).

| Chapter | Scenes | The fork that matters | Read later at |
|---|---|---|---|
| Prologue · The umbrella | 0.1 to 0.2 | 0.2 give the old woman her umbrella | 14.1 (an anchor in the Ordeal), 22.4 |
| 1 · Door on the pavement | 1.1 to 1.3 | 1.2 carry Door home, or dial 999 (1.3 Midnight) | DOOR_BOND |
| 2 · Two gentlemen at the door | 2.1 to 2.3 | 2.2 lie to the killers, bluster, or give her away; 2.3 apologise to the rat | 4.3 dead end, 10.3; 4.5, 5.2 |
| 3 · The marquis de Carabas | 3.1 to 3.3 | 3.1 what Door offers him; 3.2 climb the ladder | MARQUIS_TRUST |
| 4 · Fallen through the cracks | 4.1 to 4.5 | 4.2 offer to help the killers (4.3 dead end if she gave Door away before); 4.4 Iliaster or the bench (4.5) | |
| 5 · The Rat-speakers | 5.1 to 5.4 | 5.2 greet the rat, kneel, or grab the glass (5.3 dead end without the rats' respect) | 21.2 |
| 6 · Night's Bridge | 6.1 to 6.4 | 6.1 listen to Anaesthesia; 6.2 hold her hand or let go; 6.3 keep a bead (6.4 dead end if she let go and walks on) | 14.1, 23.3 |
| 7 · The Floating Market | 7.1 to 7.3 | 7.1 smile at Lamia; 7.2 what she pays Old Bailey | 15.1, 16.3; 15.2, 21.2 |
| 8 · Are you coming? | 8.1 to 8.5 | 8.1 sit in the sewer or follow (8.2); 8.4 "Are you coming?" | 21.3 |
| 9 · Earl's Court | 9.1 to 9.6 | 9.2 heed Hunter at the gap; 9.4 defend the marquis or call him dodgy | 14.1; 16.4 dead end, 23.1 vs 23.2 |
| 10 · Angels over England | 10.1 to 10.6 | 10.3 stand in front of Door; 10.5 Jessica (security or not) | 10.6 |
| 11 · The Angel Islington | 11.1 to 11.3 | 11.1 what she asks the angel for | 20.3 |
| 12 · Serpentine | 12.1 to 12.2 | 12.2 tell Hunter she dreams of the Beast | 19.1 (removes the spear trap) |
| 13 · The Black Friars | 13.1 to 13.3 | 13.1 take the Ordeal, or ask Door | |
| 14 · The Ordeal | 14.1 to 14.3 | 14.1 hold on (14.2 dead end, back to 13.1); 14.3 toss the key or keep it | 15.3, 21.3 |
| 15 · HMS Belfast | 15.1 to 15.4 | 15.3 lend the key or not (no copy); 15.4 hire Lamia | 20.4, 20.7; 16.3 |
| 16 · Down Street | 16.1 to 16.4 | 16.1 the plank (16.2 dead end without courage); 16.3 Lamia's kiss (16.4 dead end after doubting the marquis) | |
| 17 · Hunter's choice | 17.1 to 17.3 | 17.1 decoy, silence, give Door up (17.2 dead end) or warn her | |
| 18 · The labyrinth | 18.1 to 18.4 | 18.1 go on or wait (18.2) | |
| 19 · The Beast | 19.1 to 19.5 | 19.1 strike, throw (19.2 dead end) or drag Hunter clear; 19.3 take the knife; 19.4 forgive her | 21.2, 22.4; 23.3 |
| 20 · The angel's hall | 20.1 to 20.7 | late or in time (20.2); 20.3 defy the angel; 20.4 goad the killers; the copy (20.5) or the true door (20.6); 20.7 the angel walks free, back to 15.3 | 21.2 |
| 21 · Lady of the Underside | 21.1 to 21.3 | 21.1 give the key back; 21.3 go home, stay, or turn it herself | 23.3 |
| 22 · London Above | 22.1 to 22.4 | 22.1 take Jessica's ring; 22.3 keep the feather; 22.4 cut the door or take the taxi | 23.1 to 23.4 |
| 23 · The endings | 23.1 to 23.5 | 23.1 *Are you coming?* (the marquis), 23.2 *The opener* (Door), 23.3 *Lady of the Underside*, 23.4 *Get used to it*, 23.5 credits | |

Tightenings kept so the map stays buildable within the quota (the story map keeps everything; these decide what
gets media):

- **About a dozen variant scenes**; every other consequence is a line that reads a flag, which costs words, not
  pictures. The Sandman showed that variant scenes are where media cost hides.
- **Cutaways: four on video, the rest as a still with narration.** Video: Door's fall through the wall (in 1.2), the
  House Without Doors (5.4), the marquis trading questions with the killers (11.3), the marquis coughing up the
  sewer (15.2).
- **The Monday nobody sees (4.1) is one choice**, with the montage as one video.
- **Every dead end and ending plays on video** (rule 14).
- **Aurie is in every scene but the cutaways** (checked on every build), and no two cutaways run back to back.

---

**The bridge from The Sandman** (owner, 2026-10-24; full design in `bridges.md`): Neverwhere opens at **0.1 The library between**, differently for each Sandman ending (or not finished), with Richard's Beast dream as the reason to go; the *Lyke Wake Dirge* from the novel's epigraph is the thread (0.1, 6.2, 19.5); Death, Aurie's sister, meets her at every dead end; six echoes of her Sandman save (2.2, 4.1, 6.2, 20.4 as an extra choice, 21.2, 23.5). About ¥7 (six stills, Hob's still, one shared Death clip), no new character sheets, the Sandman not edited.

---

## 5. Media quota and budget

| Per batch (8 batches of chapters) | Quota |
|---|---|
| Stills | about 20 (160 in all, plus about 10 for endings and the hub) |
| Clips | 5 (40 in all): the batch's one big moment, one POV beat, one cutaway where listed, two of Aurie at medium shot; plus one for each of the 7 dead ends and the 5 endings (rule 14) |
| Talking loops | 12 for the whole book (Door, the marquis, Hunter, Croup, Vandemar, Islington, Anaesthesia, Old Bailey, Lamia, the abbot, Jessica, the earl), made as ping-pongs |
| Narration | about 70 lines per batch (about 550 in all), recorded once |
| Music / ambience / effects | one theme per recurring place and person (about 14 themes, 12 beds), all local and free |

| Budget item | Count | Cost *est.* |
|---|---|---|
| Stills for scenes (1 candidate, 2 where Aurie is in it) | about 220 images | ¥100 |
| Cast, Aurie's looks, props | about 60 images | ¥35 |
| Clips: 40 story + 12 dead ends and endings + 4 hub and threshold + 12 loops, plus a 15% re-render allowance | 68 clips | ¥235 |
| Narration, plus 10% retakes | about 550 lines | ¥105 |
| The multi-reference video test (§6, decision 3) | once | ¥15 |
| Dialogue and play checks | | ¥10 |
| The bridge from The Sandman (7 stills, 1 shared clip) | | ¥7 |
| **Total** | | **about ¥507** |

Cap **¥500** (the dead-end and ending videos added about ¥40, so the estimate now meets the cap; if it tightens, the cutaway videos go first), hard stop ¥550, enforced per batch by the clip tool's budget flag. For comparison The Sandman
cost ¥1,187 for 95 scenes (about ¥12.50 a scene); this plan is about ¥6.50 a scene for a story of similar length,
and the difference is the thirteen rules, not lower quality: the same video model, the same stills, fewer of them
wasted. A leaner alternative (25 clips, cutaways all as stills) would land near ¥350.

---

## 6. Decisions (taken by the owner on 2026-10-24: all four as recommended)

Hero **Aurie Mayhew**; **full story, cap ¥500**; the **¥15 test runs** before Batch A's media; **Asian Londoners for the open roles**, the book's fixed looks kept. The original questions follow for the record.

1. **The hero's name.** Aurie Mayhew (recommended) / Rachel Mayhew / Richard.
2. **Scope and cap.** Full story with the quota above, cap ¥500 (recommended) / lean, cap ¥350.
3. **A ¥15 test before the first media**, two questions in one session: (i) `kling-video-o1`, a video model on the key that takes several reference photos of
   one person; go/no-go written now: it goes into the ranked list ahead of wan2.7 only if the same Aurie shot
   scores 0.45 or better on its worst frame where wan2.7 scored under 0.35; (ii) whether the gateway accepts an
   **end frame** as well as a start frame (wan2.x has a first-and-last-frame mode; Kling has an image tail). Go/no-go:
   a talking loop rendered with the same picture at both ends must measure a seam under 6 straight out of the model.
   If either fails it is written down and never tried again.
4. **Casting London Below.** The novel fixes some looks (the marquis is Black; Hunter's skin is burnt caramel; the
   friars are dark-skinned; Croup is pallid with orange hair; Islington is androgynous and golden-haired), and those
   stay. For the characters the book leaves open, the standing rule says new characters lean Asian: recommended
   as East and South-East Asian Londoners are **Door, Anaesthesia, Jessica, Gary, Lamia, Hammersmith and Lear**;
   Old Bailey, the earl, Serpentine and the abbot stay as written. No real-actor lookalikes anywhere.

---

## 7. Phase 1 status (2026-10-24)

Done the same morning as the go: the skeleton `app/src/content/books/neverwhere/book.json` (94 scenes: 49 core, 11 variants, 12 cutaways, 7 dead ends, 6 endings and credits; 133 picture slots each with its caption and who is in frame; every flag and condition from the map), stub cards for the 14 talk characters, the book registered in the engine with its door shown as *Being built* on the title page, a book switcher in the Developer menu so Neverwhere's map and storyboards can be walked from inside the Sandman, `check-story` extended (a flag read but never set fails any book; in a planning book a flag set but never read fails too; every non-cutaway scene must show Aurie; no two cutaways in a row), and `scripts/simulate-story.mjs`. Results: the story check passes; 4,000 random plays reach every scene, take every choice and reach every ending; a consistently generous player ends at A, a consistently selfish one at D; the real-key rescue (8.4d) and A-variant are rare under random play by design. The first flags the check caught (DOOR_PROMISE, BARGAIN_DOOR, LAMIA_GUIDE, GOADED set and never read; two scenes without Aurie) were fixed before anything was built on them.

Next: Phase 2 (the way in and out of the book, the LOYALTY trait on the profile) and Phase 3 (script, Batch A: the Prologue to Chapter 3, first), then the character sheets for approval and the ¥15 test.

## 7b. What was promised after the go

Phase 1, the same day: the skeleton `book.json` for Neverwhere, `check-story` and the simulator passing, and the
map visible in the Developer menu under a second door, so the shape of the whole book can be walked and changed
while changing it is still free. The first money is spent at Phase 4, after the owner has approved the cast.
