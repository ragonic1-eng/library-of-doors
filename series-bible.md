# THE LIBRARY OF DOORS — Series Bible (v0.1)

Umbrella design for a linked series of interactive video novels. Book 1 is *The Sandman* (see `story-map.md`). Planned additions: *Neverwhere* (Gaiman), *Coraline* (Gaiman), *The Alchemist* (Coelho). More can be added with no structural change.

Book details below for the three future titles come from my knowledge of the novels, not from a source PDF. Each will get its own full story map, like `story-map.md`, once you drop its PDF in the project folder.

---

## 1. The unifying idea: every book begins with a door

| Book | The door | Who sends the hero through it |
|---|---|---|
| The Sandman | The gates of Horn and Ivory; the glass sphere | Burgess's ritual |
| Neverwhere | A girl named Door, bleeding on a pavement | Richard's own kindness |
| Coraline | The small bricked-up door in the drawing room | Coraline's boredom and curiosity |
| The Alchemist | A recurring dream of treasure at the Pyramids | A dream (in this series: sent from the Dreaming) |

In the source, Dream's librarian Lucienne keeps every story ever dreamed. So the hub of the whole series is **the Library in the Dreaming**. Each book is a door in that library. The player reaches the library for the first time at Sandman scene 2.1, which is why that scene is in the Episode 1 build.

---

## 2. The hub: Lucienne's library

A single explorable location, revisited between books and between Sandman episodes.

- **Lucienne** greets the player every visit. Her dialogue reflects the Traveller profile (§4).
- **The Doors wall.** One door per book. Locked doors are visible from day one as dark silhouettes with the title carved above, so she can see what is coming. A door unlocks when its content pack is installed and its prerequisite is met (§5).
- **The reading table.** Holds the relic earned from each completed book (§6). Four relics on the table open the Fifth Door (§7).
- **The Sandman shelf.** Sandman episodes 2 to 7 sit here as chapters of one book; the player can continue Sandman or step through another door, in any order.
- **Who else is here** depends on state: Matthew the raven after Sandman 6.1; Daniel, the new Dream, after Sandman ending A; the black cat from Coraline after Coraline is finished (cats walk between dreams in the Sandman source, so this is in character).

---

## 2b. Thresholds: how one story becomes another without a jolt

Rule: **there is never a hard cut between worlds.** Every change of book, and every return, is a three-beat threshold, and the player's own identity shift is part of the fiction.

**The identity shift is diegetic.** Aurie is Dream. She does not "switch character"; she dreams her way into the next book's hero. Entering a door, she sits in the library's reading chair, closes her eyes, and the hero of the next book opens theirs. Leaving a book, the hero closes their eyes at the story's end, and Aurie opens hers in the library with the relic already in her hand. The player is always Aurie underneath, which is also why memory and the player model carry across.

**Three beats on the way in**

1. **Approach** (library, 5 s). Aurie walks to the door. Lucienne gives one line of send-off in the tone of the book ahead: for Neverwhere, "Mind the stairs, my lady. They move." For Coraline, "It is a small door. Most of the important ones are." For The Alchemist, "Take water." The audio of the library is still full.
2. **Threshold** (library, 10 s). The door opens and the next world leaks in before we go to it: London rain blown sideways across the reading table, or a grey drizzle and a smell of rust, or desert heat that makes the lantern flame lean. The new book's ambient sound begins to rise under the library's, crossfading over about eight seconds. Aurie's inner voice speaks one line. She sits. Her eyes close.
3. **Arrival** (new book, 10 s). The first frame of the new book is the same door seen from the other side, already closing behind the hero, who is then revealed from behind or by their hands. The library's sound finishes fading. The book's own narration begins only after this clip.

**Three beats on the way out**, mirrored: the hero's last authored scene ends on their closing eyes, the book's ambience drains while the library's lantern-crackle rises, and the first library frame is the reading chair with Aurie waking and the relic in her hand. Lucienne's first line references something she did in that book.

**Within a book**, scene changes use the same discipline at smaller scale: one second of held last frame before any cut, sound of the next place arriving before its picture, and a bridging line from the director that names what just happened, so the player is carried rather than dropped.

**Technical** (one implementation, every book): a continuous hand-held sway that never resets across cuts; audio crossfade of 6 to 8 seconds between ambiences; a 4-second colour-grade drift between the two books' palettes applied in the player; no black frames anywhere except the very first title. Threshold clips are generated per door, two per book (in and out), and reused on every crossing.

## 2c. Casting (decided 2026-10-21)

- **Aurie plays every hero.** Dream in The Sandman, and through the identity shift in §2b she dreams herself into Richard, Coraline and Santiago. All four heroes are modelled on her reference photo, styled per book.
- **She is bisexual, so every romance stays as written.** Jessica remains Richard's fiancée. Fatima remains Santiago's love at the oasis. Nada, Nuala and Calliope remain as the Sandman wrote them. No partner changes gender; the generated dialogue addresses the hero as a woman and lets the relationships be what they are.
- **Names inside each book.** Characters use the book's names, since that is the world she has stepped into; her inner voice is always Aurie. Coraline and Santiago carry over unchanged. For Neverwhere, "Richard" sits oddly on a woman: default is **Rachel Mayhew** (same initials, so the book's rhythms survive). Say the word if you prefer she keep "Richard."
- **Ages.** Coraline is played at Aurie's own adult age; the map already lists the five lines that change.
- **Her face, protected.** Never generate her face with button eyes, a needle near her eye, or any injury. Those beats are first-person only.

## 3. The four books at a glance

| Book | You play | Core question | The trait it shapes | Relic earned | Tone |
|---|---|---|---|---|---|
| **The Sandman** | Dream / Morpheus | Can a king learn mercy? | MERCY | A pinch of dream sand | Mythic, dark |
| **Neverwhere** | Richard Mayhew | Will you go back for the people who need you? | LOYALTY | The Angel's key (the Black Friars' key) | Urban fantasy, witty, grimy |
| **Coraline** | Coraline Jones | Can you be brave while frightened? | COURAGE | The black button key | Fairy-tale horror |
| **The Alchemist** | Santiago | Will you listen to your heart and follow the omens? | FAITH | Urim and Thummim, the two stones | Fable, warm, desert |

One-paragraph arcs (to be expanded into full maps later):

**Neverwhere.** Richard, an ordinary Londoner, stops to help an injured girl called Door and falls out of London Above into London Below, a city of forgotten people under the streets. With the untrustworthy Marquis de Carabas and the bodyguard Hunter, he helps Door hunt her family's killers, the assassins Croup and Vandemar, and survives the Ordeal of the Key to reach the Angel Islington, who is not what he seems. Decision spine: whom Richard trusts, whether he takes the key for himself, and the ending choice to return to London Below after getting his old life back.

**Coraline.** Coraline, bored in a new flat, finds a door to an Other flat where an Other Mother with button eyes offers her everything, at the price of her eyes. With a sardonic black cat and the ghosts of three stolen children, she must win a game against the beldam to free her real parents and the ghosts, then trap the beldam's severed hand down a well. Decision spine: what Coraline accepts from the Other Mother, how she uses the seeing-stone, and whether she keeps the beldam's game fair when the beldam does not.

**The Alchemist.** Santiago, a shepherd in Andalusia, dreams twice of treasure at the Pyramids. A king of Salem gives him two stones and the idea of a Personal Legend. He is robbed in Tangier, works for a crystal merchant, crosses the desert with an Englishman, loves Fatima at the oasis, learns from the Alchemist to turn himself into the wind, and finds that the treasure was buried under the sycamore where he started. Decision spine: whether he turns back at each hardship, whether he stays with Fatima, and how he reads the omens.

---

## 4. The Traveller profile (carries across every book)

A single profile persists across all books.

```
profile = {
  traits:   { mercy: 0, loyalty: 0, courage: 0, faith: 0 },   // each -10 .. +10
  relics:   [],                                                 // "sand", "angel_key", "button_key", "stones"
  completed:[],                                                 // book ids, plus "sandman.ep1" .. "sandman.ep7"
  endings:  { sandman: null, neverwhere: null, coraline: null, alchemist: null },
  flags:    { sandman: {...}, neverwhere: {...}, coraline: {...}, alchemist: {...} }
}
```

Rules:
- Each book moves **its own trait** strongly (the big decisions) and the other three lightly (one or two scenes each).
- Any scene in any book may test any trait or relic. That is how the books talk to each other (§6).
- Sandman's MERCY meter from `story-map.md` is `profile.traits.mercy`. Nothing in the existing map changes.

---

## 5. Unlock rules

- Sandman Episode 1 is always first; it introduces the library.
- Finishing **any** episode or book returns the player to the library.
- A book's door opens when its content pack exists. Recommended order shown by a soft glow, never enforced: Sandman Ep 1 → Coraline → Neverwhere → The Alchemist → remaining Sandman episodes → Fifth Door. Reason: Coraline is short and self-contained, Neverwhere is the longest adventure, The Alchemist is the gentlest and works best after the darker books.
- Within Sandman, episodes stay sequential.

---

## 6. Cross-book echoes (first draft)

Small, earned, never required. Each is one line of dialogue or one extra option.

| If the player has... | Then in... | This happens |
|---|---|---|
| Finished Coraline, COURAGE ≥ 4 | Sandman 2.4, the Oldest Game | A fourth answer appears at the last round: "I am a child who is not afraid." It also wins. |
| Finished Neverwhere, LOYALTY ≥ 4 | Sandman 5.3, Hob Gadling 1889 | A third option: stay for one more drink. Counts as acknowledging friendship. |
| Finished The Alchemist, FAITH ≥ 4 | Sandman 6.3, Destruction's island | Destruction: "You already know a man who found his treasure at home." Ending C option is softened, not removed. |
| Sandman ending A reached | Coraline, the well | The black cat says the Sandman's line about dreams; the hand's fall is scored with Daniel's theme. |
| Sandman `ALEX_CURSED` on | Neverwhere, Croup and Vandemar's interrogation | Vandemar: "We heard of a man who dreams of waking. Nasty." Pure flavour. |
| Holding the Angel's key (Neverwhere) | Coraline, the locked door home | The Angel's key rattles in the lock but does not fit. Coraline remarks on it. Teaches that relics are not shortcuts. |
| Holding the button key (Coraline) | The Alchemist, the crystal shop | The merchant notices the key: "A key with no door is a dream with no action." |
| MERCY ≥ 6 from Sandman | The Alchemist, the thief in Tangier | Santiago can forgive the thief aloud; the merchant's hiring scene changes tone. |
| All four relics | The library | The Fifth Door appears (§7). |

---

## 7. The Fifth Door (series finale, built last)

With all four relics on the reading table, a fifth door opens onto a shared epilogue in the Dreaming. Richard, Coraline and Santiago arrive as dreamers; the player is Dream (Morpheus or Daniel, by Sandman ending). One short interactive scene, about six clips: each hero asks the player a question about a choice they made in their own book, and the answers write a closing page that Lucienne shelves. No new mechanics, pure payoff for having played everything.

---

## 8. Technical architecture: one engine, many content packs

```
app/
  engine/            player, state, choice UI, save slots, library hub
  profile.json       the Traveller profile (§4), one per player
  books/
    library/         the hub: manifest.json, story.json, clips/
    sandman/
      manifest.json  { id, title, hero, trait, relic, episodes: [...], requires: [] }
      story.json     scene graph: scenes, clips, choices, effects, conditions
      clips/         generated video, named by clip id (see episode-1-production-sheet.md)
      stills/        approved location plates
    coraline/        same layout
    neverwhere/      same layout
    alchemist/       same layout
```

- **story.json schema is shared.** A scene = `{ id, clip, pov, choices: [{ text, effects: {trait|flag|relic}, next, condition }] }`. Conditions may read `profile.*` so cross-book echoes need no special code.
- **Adding a book = adding a folder.** The library reads every manifest at start and draws a door for each.
- **Clips stay per book** so a book can be regenerated or restyled without touching the others.

---

## 9. Impact on the Episode 1 build (do now)

1. Scene 2.1 is built as the **library hub**, not a plain teaser: Lucienne, the Doors wall with three dark locked doors carved *Neverwhere*, *Coraline*, *The Alchemist*, the empty reading table, and the Sandman shelf. One extra location still, two extra clips (a slow pan along the Doors wall; Lucienne turning to the player).
2. The Traveller profile schema ships in the first build, even though only `mercy` moves in Episode 1.
3. Sandman is stored as `books/sandman/` from day one.

## 10. Story maps (all four books mapped, 2026-10-21)

| Book | Map | Episodes / scenes | Conversation windows | Endings | Open decisions |
|---|---|---|---|---|---|
| The Sandman | `story-map.md` | 7 / ~40 | 3 in Episode 1 | 5 | none |
| Neverwhere | `story-map-neverwhere.md` | 8 / 48 | 22 | 5 + variant | Casting settled (§2c): Jessica stays fiancée; hero name default Rachel Mayhew. Tone notes applied (suicide posters rewritten, Door cast adult, crude asides cut) |
| Coraline | `story-map-coraline.md` | 5 / 33 | 21 | 5 + variant | Casting settled (§2c): adult Coraline. Still open: spider look-away |
| The Alchemist | `story-map-alchemist.md` | 7 / 40 | 21 | 5 + variant | Casting settled (§2c): Fatima's romance kept. Palette line below |

Per-book palette: the shared Style Bible stays frozen. Each book appends one palette line after it. Sandman: cool, candle amber. Neverwhere: sodium orange and wet grey. Coraline: grey drizzle, one poison-bright colour per scene. The Alchemist: warm sand, white light, deep blue night.

Each analyst read its full novel. Additions not in the text are marked ◆ and kept rare. Source text extracted to `source-text/`.
