# Aurie on screen — Codex scene pack
Status: written production proposals only. No video or image assets rendered; no game graph changed.
Owner request: add a few scenes using video and coordinate with Claude to avoid conflicts.
Branch: codex/aurie-scene-pack

## Coordination
Claude: please read this before implementing your pending Aurie-visibility plan. This pack proposes three short visual scenes within existing chapters, rather than beginning Episode 6. They are not locks on your work; confirm the allocation with the owner before duplicating these shots.
Codex owns this proposal document only. Claude retains integration of book.json, production manifests, narration, player/audio code, asset upload and deployment.
The owner must relay the coordination note to the separate Claude session; creating this branch does not guarantee Claude has been notified.
Do not merge old Player.tsx or score mappings from Codex branches over the newer audio integration. Use current main as the integration base.
No paid generation calls have been made. The latest handoff says the broader Aurie-visibility plan is pending budget; establish the rendering budget with the owner before paid production.

## Shared production requirements
- Use the existing approved Aurie identity and angle sheets, and the approved costume and location references for the relevant chapter. Do not reconstruct Charmaine's face from a text description.
- Aurie remains fully clothed. Preserve her approved face, body proportions and appearance.
- Use the existing approved Lucienne, Johanna and Death designs.
- Landscape 16:9, cinematic realism matching existing shots, slow restrained movement. No baked-in subtitles, labels or watermarks.
- Prefer a locked medium close-up to a wide shot: the owner's concern is that Aurie disappears from the story.
- Keep mouths closed during silent reaction shots. Do not fabricate lip-sync.
- A five-second render is a visual segment, not a deadline for narration. Hold the final frame if existing speech continues; let the audio finish.
- These shots reuse the existing story and text. Do not add new spoken lines or regenerate existing narration merely to insert a visual.
- Match the preceding and following frames, screen direction, light and clothing before rendering.
- Proposed asset IDs below are names only. Add no reference to book.json until the corresponding file exists, is checked and is uploaded.
- Use the current approved production pipeline. HANDOFF reports that the gateway ignores Wan 3.0 reference media, so do not assume it preserves identity.

## 1. The Queen Comes Home
Placement: scene 2.1, after arriving at the ruined library and before Lucienne's opening reply.
Purpose: restore Aurie to view after captivity; make the damage to her home personal.
Length: one five-second shot; hold if necessary.
Proposed asset: aurie-homecoming-v1.

Story action:
Aurie stops just inside the library. Her hand rests on a damaged wooden shelf. For a moment, her regal posture loosens. She looks toward Lucienne, gathers herself and waits. Her face carries exhaustion and recognition; no tears are forced.

On-screen text:
Reuse the existing line, “Most of the Dreaming is gone. Only the library still stands.”
Do not duplicate its narration or replace the later reveal of the three doors.

Gameplay:
Keep the existing cold response / apology decision. This neutral reaction must not imply either choice has already been made. No new flags, rewards or branching.

Video prompt:
Use the approved Aurie face and angle references and the approved library environment as identity and scene anchors. Medium close-up, eye-level three-quarter view of Aurie, fully clothed in her approved return-to-the-Dreaming costume. Her face occupies roughly one quarter of the frame. One hand rests on a splintered wooden bookshelf. Warm lantern light touches one side of her face; cool shadow and softly drifting dust surround the ruined shelves. She takes one quiet breath, looks toward Lucienne just off camera, then steadies her shoulders. Her mouth stays closed. Camera almost locked, only a very gentle push-in. Preserve facial identity, wardrobe, hand anatomy and lighting throughout. No transformation, no tears appearing suddenly, no additional characters entering.

Integration:
Attach the approved clip to the existing narrated beat, retaining its exact text and audio ID. Preserve the next beat revealing the doors and all existing conditional text.

## 2. The Weight of the Pouch
Placement: scene 2.4, after the Rachel decision, inside its existing aftermath.
Purpose: show the emotional consequence on Aurie's face, with distinct treatment for mercy and cruelty.
Length: one five-second shot per route; only the selected version plays.
Proposed assets: aurie-sand-mercy-v1 and aurie-sand-cold-v1.

Merciful route:
After the garden image, show Aurie at Rachel's bedside. She closes her hand gently around the returned pouch. She looks back toward Rachel, then lowers her eyes. Her expression is quiet and grave, not triumphant.

Reuse existing narration:
“She dies smiling. The sand flows home into the pouch.”

Cruel route:
Show Aurie in the same room, taking the pouch and turning away from the bed. Her face stays controlled; her hand tightens around the pouch. Keep Johanna's reaction and the existing transition into 2.4b. Do not show reconciliation, an apology or Rachel's recovery.

Reuse existing narration:
“You take the pouch. Behind you, Rachel begins to scream.”

Gameplay:
Preserve 2.4.A and 2.4.B, CONSTANTINE_ALLY / CONSTANTINE_CURSE, the sand reward and the existing follow-up branch. No second choice or extra trait award.

Video prompt — mercy:
Approved Aurie identity and Rachel-room references. Medium close-up of fully clothed Aurie beside the bed, her face and the small sand pouch both clearly visible. Soft filtered daylight, the established room's dreamlike texture behind her. She closes her fingers gently around the pouch, glances toward Rachel off camera, then lowers her eyes with restrained sorrow. Mouth closed, no smile of victory. Slow breath and a minimal camera push-in. No magical resurrection, no new person, no change of costume or facial identity.

Video prompt — cold:
Use the same approved identity, room, costume, framing and lighting as the mercy version. Aurie closes her hand firmly around the pouch, turns her eyes away from Rachel off camera and begins a small controlled turn toward the exit. Her face is composed and distant, never exaggerated or villainously smiling. Keep her face visible throughout. Mouth closed, no additional gestures, no camera cut.

Integration:
Replace the visual of the relevant existing aftermath beat only after the assets pass review. Preserve the garden clip and the HEARD_RACHEL conditional line on the mercy route. Preserve the later Johanna branch on the cruel route.
Do not create or amplify a literal scream sound effect for this insert; the existing narration and room tone are sufficient.

## 3. A Sister, Not a Queen
Placement: scene 2.12, between the park arrival and Death's opening conversation.
Purpose: visibly contrast Aurie's formal bearing with Death's ordinary warmth; make this reunion feel like family.
Length: one five-second shot.
Proposed asset: aurie-death-bench-v1.

Story action:
An eye-level two-shot: Aurie sits rigidly at one end of the bench. Death sits nearby with the bread. Aurie looks at her sister; her shoulders ease slightly. Death gives a small, familiar smile. Keep Aurie's face large enough to read, with both approved identities recognizable.

Reuse existing narration:
“Her older sister, Death. She meets every living thing at the end, and she is the one sibling Aurie has always loved.”

Gameplay:
Preserve the choice to accompany Death or refuse. No hand-taking, standing up or departure before the player chooses. This shot conveys familiarity, not a preselected outcome.

Video prompt:
Approved Aurie and Death identity references, approved park environment and their existing costumes. Intimate eye-level medium two-shot on the established park bench. Aurie is clearly visible in three-quarter view, fully clothed and initially upright and formal. Death sits beside her holding a small piece of bread. Aurie turns her eyes toward her sister and lets her shoulders soften almost imperceptibly; Death answers with a tiny affectionate smile. Both mouths remain closed. Quiet daylight, soft background trees, restrained depth of field, camera locked. No embrace, no standing, no costume changes, no extra people entering the foreground.

Integration:
Attach to the existing sister-introduction beat, retaining exact text and narration. Keep the current music value in book.json (“wings” at the time of writing); do not restore the old Codex score override.

## Acceptance and release
1. Confirm the three allocations with Claude through the owner before either assistant expands overlapping scenes.
2. Inspect existing approved reference images and shot transitions.
3. Render four five-second assets total: homecoming, two Rachel variants, sister reunion. If budget permits only three, prioritize homecoming, mercy and reunion; leave the cruel route unchanged.
4. Check each face frame by frame, not merely the opening still. Follow the project's existing likeness workflow and owner review.
5. Verify each shot serves the selected route and does not imply an unchosen action.
6. Integrate only existing narration text; if any words change, use the current narration validation and revision-cache process in HANDOFF.
7. Run story/build checks and play both Rachel branches, both Lucienne responses and both Death choices.
8. Check phone framing and subtitles so Aurie's face remains visible.
9. Upload rendered assets, then deploy only when the integration is verified and the owner has authorized that release.
