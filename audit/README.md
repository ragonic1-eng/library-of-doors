# Audio audit — 22 October 2026

Code audit and recording inventory complete; listening audit remains blocked.

Scope: all 43 scenes in the current five parts, including conditional beats and choice aftermaths: 352 narration references, 348 unique recordings. `audio-inventory.json` lists every expected line, URL, condition, character opening and inner voice. Its blocked statuses are not missing-file findings.

## What caused cutoffs in the code

- Narration was stopped after an estimated reading-time deadline, even if audio was still playing. Slow performance, buffering and pausing could lose the end. Healthy playback now waits for `ended`; a 30-second lack of progress triggers a readable-text fallback. Paused time does not count.
- A scene-ending reply had a 25-second cap. It now waits for the whole reply, including every labelled speaker. Explicit Skip and sending a new line still interrupt intentionally.
- The voice validator accepted roughly 80% word overlap, disregarded order/repetition and accepted absent transcripts. It now requires the complete normalized word sequence and rejects provider length-limit completions. The screenshot's Burgess line truncated at “glass” is a regression case. Provider transcripts cannot prove the underlying audio bytes are complete; this is not a confirmed reproduction of the exact live recording.
- Stopped character voices did not restore the music duck counter or release blob URLs. Cleanup now runs exactly once for completion, interruption and failure.
- Browser fallback speech now uses short utterances, retains the active utterance, respects pause, ducks music and watches for stalled speech. It still uses a device voice, so it cannot guarantee the actor's character voice when the gateway fails.

No recorded narrator file or actor recording has been regenerated. Strict transcript matching may cause more retries or device-voice fallback for legitimate transcript differences; punctuation/case/curly apostrophes are normalized. Watch latency on the actual gateway.

## New original score

Five 40-second ambient instrumental MP3s are included under `app/public/audio/music`. Generated locally from synthesized tones, composed motifs, filtered noise and delay, with no samples or paid model calls. `tools/compose_score.py` reproduces them (NumPy, SciPy, ffmpeg). Their wind, air and room textures provide subtle environmental sound; there are no separate triggered effects.

| Track | Mood and scenes |
| --- | --- |
| crossroads-v1 | Suspended glass-like notes and wind; the Three, Destiny's garden, the family |
| hell-v1 | Low dissonant drones and rumble; Hell gates, Lucifer and empty Hell |
| ruby-v1 | Uneasy pulse and fractured motif; the diner and inside the ruby |
| wings-v1 | Open, gentle harmony and air; Death and Unity's sacrifice |
| friend-v1 | Warm restrained motif and room texture; Hob's first and final meetings, Part Five end |

The existing six tracks remain elsewhere. New files are served by the app and need no Blob upload. Music-off, ducking and crossfades use the existing controls. New files decode fully, last 40 seconds, and have peak headroom; `new-score-check.json` records technical measurements. These checks do not replace phone/headphone listening.

## Character-direction audit

The cards generally match their roles on paper: Burgess's controlled Edwardian menace, Alex's hesitant delivery and aged variant, Lucienne's restrained warmth, Johanna's dry London manner, Lucifer's soft courtesy, Death's warmth, and three separately directed Fates. Voice names alone cannot establish that the actual performances fit. Aurie and Death both use marin, Lucienne and the Crone both use sage, and several men use verse: direction distinguishes them, but listening should confirm it. No unverified voice reassignment was made.

## Verification and remaining work

- Nine regression checks pass: `cd app && node tests/audio.test.mjs` (Node 24). Tests execute the player's narrator/character playback code with controlled media and clocks.
- `node scripts/check-story.mjs` passes; remote media checks are skipped by that script when media is not local.
- Changed TS/TSX parses successfully. Local version-specific Next docs were unavailable; consulted upstream client-component documentation.
- `npm ci` failed with network `EPERM`, so a full Next build and phone playback were not run.
- Direct live-site/Blob access is blocked here. Every original recording still needs listening/transcription verification. Run `python tools/audit_audio.py --online` in a network-enabled environment to download/decode the entire inventory first. Duration flags are triage, not proof of missing words.
- On a phone: replay Burgess's screenshot line to its final word “brings”; pause midway for at least 30 seconds; try a long response and a multi-speaker reply; check no overlaps and music recovery. Listen to all conditional/aftermath recordings as well as the main route. Correct any actually truncated files using the existing narration pipeline, with new asset versions to defeat caches.

This branch does not deploy or modify the live Blob store. Based on main `cb2943f3e98bcfac48af94aab1ea9976a4e8ec72`, preserving the new clothed sphere clip.

## Scene coverage

Every row below has been inventoried and its shared playback paths inspected. Original audio listening: **unverified for every row**.

| Scene | Title | Narration references | Live character |
| --- | --- | ---: | --- |
| 0.0 | The Queen of Dreams | 5 | — |
| 1.1 | The ritual at Fawney Rig | 6 | — |
| 1.2 | Burgess's bargain | 10 | burgess |
| 1.3 | The world without dreams | 13 | unity |
| 1.4 | Alex Burgess | 14 | alex |
| 1.5 | Escape | 10 | alex-old |
| 2.1 | The library between | 7 | lucienne |
| end-ep1 | End of the first night | 4 | — |
| 2.2 | The Three Who Are One | 9 | fates |
| 2.3 | The Sand | 6 | johanna |
| 2.4 | Rachel | 8 | johanna |
| end-2a | The first of three | 3 | — |
| 2.5 | The Gates of Hell | 9 | nada |
| 2.6 | Lucifer | 4 | lucifer |
| 2.7 | The Oldest Game | 8 | choronzon |
| 2.8 | Lucifer's Threat | 6 | lucifer |
| end-2b | The second of three | 3 | — |
| 2.9 | Twenty-Four Hours | 10 | — |
| 2.10 | Inside the Ruby | 4 | dee |
| 2.11 | Dee's Fate | 4 | dee |
| 2.12 | The Sound of Her Wings | 7 | death |
| end-ep2 | The Queen of Dreams, restored | 5 | — |
| 3.1 | Destiny's Garden | 4 | destiny |
| 3.2 | The Family | 21 | endless |
| end-ep3 | The family | 6 | — |
| 4.1 | Hell, Empty | 13 | lucifer |
| 4.2 | The Suitors | 18 | suitors |
| 4.3 | Nada | 9 | nada |
| end-ep4 | The key and the queen | 10 | — |
| 3.0 | The Mending | 6 | lucienne |
| 1.6 | Paul | 6 | paul |
| 2.4b | Johanna's Curse | 4 | johanna |
| 5.0 | A Prayer, Kept | 7 | — |
| 5.1 | Calliope | 8 | calliope |
| 5.1b | Richard Madoc | 13 | madoc |
| 5.2a | The Corinthian | 15 | corinthian |
| 5.2b | The Vortex | 10 | rose |
| 5.2c | Unity | 8 | unity-old |
| 5.2d | Desire's Threshold | 5 | desire |
| 5.3 | Men of Good Fortune | 11 | — |
| 5.3b | 1889 | 5 | hob-1889 |
| 5.3c | 1989 | 6 | hob |
| end-ep5 | Reflections | 12 | — |

## Claude's verification and integration (2026-10-22, 22:00 to 23:00)

ChatGPT's branch was reviewed, merged into `main` (its `Player.tsx` had LF line endings against `main`'s CRLF, so the file was merged three-way on normalised copies; tonight's curtain, thinking-box and menu-Undo work all survived), built, tested against the real gateway, and deployed. What was found and changed:

### The real cause of "the voice stops halfway"

The owner's Burgess line was reproduced through the real gateway. In one take the gateway's own transcript claimed every word, yet the audio itself went silent after "on faith" and padded the rest with silence. Measured over about 70 gateway takes:

- **Dead air**: the model stops speaking mid-line and fills the rest with silence or faint hiss (a 4 s dead tail; "Everything I ask, creature", then 16 s of hiss).
- **Runaway takes**: 36 s, 70 s, 84 s and 112 s readings of a 14-second line (mumbling or silence). In the player these are the "stuck" moments.
- **Voice-specific**: the `cedar` voice failed on 3 of 8 takes of the same line; `echo` and `ballad` on 0 of 8.
- **Small skips**: a take can drop a few words with no silence left behind ("Of course you are"). Neither a transcript nor a loudness check catches these; they are rare.

A transcript check alone cannot catch any of the first three, because the transcript is generated from the text, not from the audio.

### What now guards every live voice line (`app/src/lib/server/voice.ts`, `mp3.ts`)

1. The prompt requires every word to be clearly audible and forbids whispering, fading out or long silences.
2. Each take is decoded on the server (`mpg123-decoder`, MIT, 11 ms per take) and rejected for a quiet tail over 1.5 s, a silence over 3.5 s mid-line, a length over 0.65 s a word plus 8 s, or an impossible speaking rate. Calibrated on labelled takes: every large failure caught, no false alarms on 33 good takes, dramatic pauses and the Crone's whisper and laugh kept.
3. ChatGPT's strict ordered transcript match stays, but ignores sound notes (`*chuckles*`, `[sighs]`): the Crone's laugh was failing every take.
4. Two takes are recorded at once and the first good one wins; a second pair only if both fail and under 14 s have passed. Lines with no words ("…") are not voiced at all.
5. The `cedar` voice is retired: Burgess and Paul now use `echo`, Destruction `ballad`; the suitors were reassigned so each still has a distinct voice (Odin echo, Thor ash, Loki verse, Azazel ballad, Cluracan alloy, Remiel sage).
6. Player backstop: a voice still playing at words/1.1 + 8 s of its own playback time is ended (pause-safe), so no single take can hang a scene.

Live result after the changes: every delivered clip measured clean; through the real game, Burgess's reply to "Free me, and you shall have everything you ask" played 16.35 of 16.35 s and the story moved on only after it ended. Pausing in the menu for 35 s mid-voice resumed and finished (20.85 of 20.85 s); sending a new line mid-voice stopped the old one at once; the music came back to full level (0.16 under the voice, 0.45 after).

### Narration: every recording transcribed (`tools/audit_narration.mjs`, `audit/narration-audit.json`)

All 409 narrated lines in Parts One to Six (including conditional lines and choice aftermaths) were decoded, measured and transcribed, then every suspect was transcribed again by a second, independent listener (Gemini). Names the listeners mishear ("Aurie" as Ori or Ari, "Madoc" as Maddock) and British spellings were not counted as faults. Confirmed faults, all fixed:

| Line | Fault | Fix |
|---|---|---|
| `7133a4e2` 5.3, "Aurie says nothing…" | read "A low, intimate tone, building tension" aloud | re-recorded |
| `729e816f` 4.3, "Nada refuses every gift…" | read "Narration, deep and intimate, with deliberate pacing…" aloud | re-recorded |
| `7bf5dbde` 5.0, "In 1927 an old writer…" | repeated "A pause, a young novelist bought her" | re-recorded |
| `d394979d` 2.7, "Lucifer will judge. Type your answer…" | skipped "Type your answer" and said "be" for "beat" | re-recorded |
| 4.2, two "Nada's soul Aurie…" lines | heard as "Not a soul…" by both listeners | reworded ("Aurie takes Nada's soul…"), new recordings |

Re-recorded lines keep their file names, so `app/src/lib/story/lines.ts` adds `?v=2` to their address and phones fetch the new audio despite the one-year cache. `tools/gen_narration.py` now listens to and measures every take before keeping it (four tries), fences the script line, never asks for a whisper, and has `--ids` for re-recording specific lines; run it with `tools/venv/Scripts/python`.

### Music

The five procedural tracks were measured (seamless loops, but about 9 dB quieter than the other beds) and judged by an audio model, absolutely and then head to head against the bed each would replace (both orders, to cancel position bias). Kept: `hell-v1`, levelled to −19 dBFS, for the Hell scenes (tied on quality; gives Hell its own sound). Not used: `crossroads-v1` (lost to the existing bed for the Fates), `wings-v1` (1/10, "sterile, grating"), `friend-v1` (3/10), `ruby-v1` (4/10). Replaced with new MusicGen beds written for those scenes (`tools/gen_music.py`): `wings` (Death and Unity, 8/10), `ruby` (2.9 and 2.10; beat the current diner bed in both orders) and `tavern` (the 1389 to 1789 tavern montage only; for the quiet 1989 reunion the existing `library` bed won both ways and stays). All music now lives with the other beds in `app/public/clips/sandman/audio/music/` (served from Blob) and is chosen only by `music` in `book.json`; the separate `score.ts` map was removed because the scene curtain read `book.json` and would have faded shared tracks to silence between scenes.

### Voices at different volumes (owner report: the Three)

Each labelled speaker is a separate take, and the model records each voice at its own level: measured speech levels were Maiden −18 dBFS, Crone −37 dBFS (about 19 dB quieter), Orpheus −26, narrator −24. The player now routes every character voice through a Web Audio gain set from that clip's own speech level (`app/src/lib/story/level.ts`), aiming at −22 dBFS, up to +18 dB, with a limiter so a boosted whisper never clips. The mixer is opened by the first tap on the start screen and resumed when the page comes back into view; if it is not running, voices play exactly as before.

### Not verified

- Listening on the owner's phones, the only real test of voice quality and music levels.
- Small word skips in live voices (rare; not detectable without transcribing every take).
- The original 348 recordings were transcribed, not listened to by a person.
