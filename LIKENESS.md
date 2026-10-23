# Likeness playbook: keeping Aurie and Alex looking like themselves

Aurie is the owner's wife and Alex is the owner, built from their real photos. This page records what we have
measured about when their faces hold and when they drift, and the rules every new picture and video follows.
Scores are `tools/face_score.py` cosine similarity against the real photos (0.40 or more is a good likeness,
0.50 or more strong; a video is judged by its worst sampled frame).

## What our own pictures show (audit of 2026-10-23: 47 Aurie shots, 10 Alex shots)

| Finding | Evidence |
|---|---|
| Stills hold the face far better than videos | Aurie stills average 0.38, videos 0.25 (worst frame). Alex stills 0.57 to 0.64, his videos mostly 0.04 to 0.27 |
| The video model is where faces drift | wan2.7-i2v sees only the first frame. Even from a good first frame (about 0.40) a clip typically ends near 0.33 and its worst frame lower |
| Big close-ups in video drift most | Aurie faces 150 px or larger average 0.28; medium shots (face 90 to 149 px wide in a 1280 frame) 0.39 |
| Editing an approved picture beats generating afresh | The best stills are edits of approved high-likeness pictures (boat 0.51, mirror 0.46); fresh generations land around 0.30 to 0.40 |
| Big expressions and heavy ageing break the face | Alex screaming or aged 1.5d-A/B and 1.5c: 0.04 to 0.13 |
| A face edit can spread to other people | The cave picture: a likeness edit gave Orphea Aurie's face too, so name exactly which face to change |
| Character sheets and angle sheets do not reach video | They help still pictures only; wan2.7-i2v uses the first frame and nothing else |

## Rules for every new shot

1. **Make the face in a still, then animate.** Build the first frame by editing an approved high-likeness picture
   (`scripts/edit-image.mjs --score aurie|alex`), never by generating the face fresh. Keep candidates scoring 0.40+.
2. **Medium shots, not close-ups.** In anything that moves, keep the face about a tenth to a ninth of the frame width
   (roughly 90 to 150 px at 1280). Save true close-ups for stills.
3. **Calm motion.** Locked-off camera or a slow drift; no push-in onto a face; no head turns toward the camera, no
   standing up fast, no screaming or laughing open-mouthed. Put the action in the world around her (wind, light,
   particles, other characters), not in her face.
4. **Back or three-quarter views for anything energetic.** If she must run, fight or turn, show her from behind or in
   silhouette and say so in the prompt and the motion ("she never turns her head; her face is never seen").
5. **One real face per picture where possible.** With two people with similar hair, name the face to change.
6. **Scale and costume locks.** The sphere is always about 2 m with Aurie kneeling life-size at true adult proportions:
   sitting back on her heels, knees visible, head about a ninth of the sphere's width, mist above her
   (`assets/refs/sphere.png`, rebuilt 2026-10-23 because the old one gave her a big head on a small body);
   her black high-collared gown everywhere; Alex always in his black rectangular glasses.
7. **Check every result automatically.** `generate-clips` now scores the likeness of every finished Aurie or Alex clip
   and warns when its worst frame falls below 0.30; such a clip is re-rendered calmer, or the scene keeps the still.

8. **Restore the face after every video of Aurie or Alex.** Run `tools/venv/Scripts/python tools/face_restore.py aurie|alex <clip>`:
   FaceFusion (local, free) puts the real face back on every frame, touching only that person, and the result is
   kept only if the likeness improves. First run over 19 drifting clips: 14 improved (for example Aurie with Death
   0.18 to 0.44, Aurie with Nada 0.33 to 0.49, Alex 1.5d-A 0.13 to 0.55, Alex 1.5k-a 0.12 to 0.44); it can soften
   a big expression (a scream becomes a frightened face), so check those by eye.

## Reference photos (updated 2026-10-23)

The owner sent 9 more photos of himself and 15 of Charmaine. They stay local (`characters/`, never in git). Both the
likeness check and the face-restoring pass use only the clear, straight-on, arm's-length ones:

- **Aurie:** `characters/dream/photo-4, 6, 9, 11, 12, 13, 14, 16, 18`. Left out: glasses (photo-10), a years-old
  photo (photo-17), blurred laughs (photo-20, 22), very close selfies (photo-15) and the narrow older four. With the
  wider set her stills score fairer (for example the convention 0.26 to 0.43, Calliope at dawn 0.34 to 0.48).
- **Alex:** `characters/alex/photo, photo-2, face, photo-7, 8, 9`. Left out: very close selfies (photo-3, 4, lens
  stretch), head turned (photo-5, 6) and low angles (photo-10, 11).

## Options not yet used (need the owner's go-ahead)

- **A video model that sees several face references.** The Infistar key offers `kling-video-o1` (its "Elements"
  take several reference angles of one subject) and `doubao-seedance-2-0`. A small test, the same Aurie shot in
  each, about ¥10 to ¥15, would show whether they hold her face better than wan2.7-i2v.
- ~~A face-restoring pass after the video~~ (now rule 8) with FaceFusion (open source, runs on this PC, free; needs a download of
  about 1 to 2 GB to the D drive): it puts the reference face back onto each frame. Strong for identity, but it can
  add flicker at the edges, so it would be tested on two or three clips first.

Sources consulted: [Higgsfield, consistent characters 2026](https://higgsfield.ai/blog/tools-for-consistent-ai-characters),
[Kling character-consistency workflow](https://kling2-6.com/en/blog/how-to-maintain-ai-character-consistency),
[AI character consistency methods compared](https://flick.art/blog/img2img-consistent-character),
[Kling O1 reference images](https://www.scenario.com/models/kling-o1-reference-images),
[Kling 3.0 subject binding](https://kling.ai/blog/kling-3-subject-binding-character-consistency),
[FaceFusion guide](https://magichour.ai/blog/how-to-use-facefusion),
[KeyID, keyframe editing for identity-preserving video (2026)](https://arxiv.org/pdf/2608.16154),
[Training-free identity-preserving video (ACM MM 2025 winner)](https://arxiv.org/pdf/2509.01362).
