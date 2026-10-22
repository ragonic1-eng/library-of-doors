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
