# THE SANDMAN — Interactive Story Map (v0.1)

**Source:** `the-sandman.pdf` — Bookey summary (26 pp) of Dirk Maggs' Audible adaptation of Neil Gaiman's *The Sandman*. Chapters 3 and 6 are truncated in the PDF. Where the summary only names an event, scene detail is filled in from the original graphic novels and marked **◆**.

**Player character:** Morpheus (Dream of the Endless), Lord of the Dreaming.

---

## 0. Design pillars

1. **You are Dream.** Clips are shot first-person POV (the camera is Morpheus' eyes) with occasional over-the-shoulder shots. This keeps immersion high and sidesteps the hardest video-gen problem: keeping the hero's face consistent across hundreds of clips. Morpheus is seen only in reflections, water, the Ruby's surface, and other characters' eyes.
2. **Choices are about *who you become*, not puzzles.** The book's spine is Morpheus changing from a cold, prideful king into one capable of mercy. Every decision nudges that arc.
3. **No mid-story game over.** Bad choices don't fail the player. They scar the Dreaming (visible in later clips), close off allies, and lock endings.
4. **Consequences are visible, not just numeric.** The same location is generated in 2–3 states (ruined / strained / restored). Allies appear or are absent in later scenes based on earlier choices.

---

## 1. State variables (tracked across the whole story)

| Variable | Range | Moved by | What it changes |
|---|---|---|---|
| **MERCY** | −10 … +10 | Nearly every decision. Compassion raises it, pride and cruelty lower it. | Which of the 3 main endings is reachable. Tone of Death's and Hob's dialogue. |
| **POWER** | 0 … 3 | Artifacts reclaimed: Helm, Sand, Ruby | Environment detail in the Dreaming; which options appear in confrontations. |
| **DREAMING** | 0 … 100 | Time lost in captivity, Rose Walker outcome, Corinthian, Furies siege | Visual state of the Dreaming in every return scene. Hits 0 → premature ending. |
| **Flags** | on/off | See consequence web §5 | Specific scene variants and ally appearances |

Flags: `ALEX_CURSED`, `LUCIFER_GRUDGE`, `CONSTANTINE_ALLY`, `DEE_SPARED`, `NADA_FREED`, `NADA_FORGIVEN`, `HELL_KEY_TO` (angels / norse / faerie / demons / chaos), `NUALA_BOON`, `LOKI_DEBT`, `HOB_FRIEND`, `ROSE_SPARED`, `CALLIOPE_FREED`, `MADOC_FATE`, `LYTA_THREATENED`, `ORPHEUS_RELEASED`, `MATTHEW_RAVEN`, `CORINTHIAN_REMADE`.

---

## 2. Structure at a glance

Seven episodes, mirroring the PDF's seven chapters. About **40 core scenes**, **~25 variant clips**, **5 endings**.

| Ep | Title (from PDF) | Story time | Core scenes | Key fork |
|---|---|---|---|---|
| 1 | The Captivity of Dream | 1916 → 1988 | 5 | How you treat your captors |
| 2 | Liberation and the Quest to Reclaim Power | 1988 | 7 | Order of artifacts; fate of Dee; defying Lucifer |
| 3 | The Endless Family | timeless | 3 | Rising to Desire's bait → going to Hell for Nada |
| 4 | Realms Beyond the Dreaming | 1990 | 5 | Who receives the Key to Hell; apologising to Nada |
| 5 | Reflections on Humanity | 1389 → 1990 | 8 | Rose Walker; Madoc's punishment; Hob's friendship; Lyta |
| 6 | Redemption and Change | 1991 | 5 | Releasing Orpheus (the point of no return) |
| 7 | The Legacy of the Sandman | 1992 | 6 | Surrender, fight, or abdicate |

---

## 3. Episode by episode

Format per scene: **Setting** → **Clip (what the player sees)** → **DECISION** → consequences.

### EPISODE 1 — The Captivity of Dream (PDF ch. 1)

**1.1 The Ritual at Fawney Rig (1916)** ◆
Setting: a candle-lit cellar in an English manor; hooded cultists; Roderick Burgess reads from a grimoire.
Clip: POV. Blackness, then being *pulled*. You slam into a stone floor inside a glass sphere. Through the glass: Burgess' triumphant face. Your helm, pouch and ruby are lifted from the floor by gloved hands.
*(Intro, no decision — establish the three tools being taken.)*

**1.2 Burgess' Bargain**
Setting: the same cellar, hours later. Burgess alone with you.
Clip: Burgess crouches at the glass: "Give me immortality, power, and the return of my dead son, and I will free you."
DECISION:
- A. **Say nothing.** (canon) → MERCY 0. Burgess leaves furious. Imprisonment is long.
- B. **Threaten him.** → MERCY −1. Burgess doubles the wards. `DREAMING −10` extra (longer absence).
- C. **Offer a false bargain.** → MERCY −2. Burgess sees through it (Endless cannot lie about their nature easily). Flag `DECEIT`. Desire will mock this in Ep. 3.

**1.3 The World Without Dreams (montage 1916–1960s)**
Setting: cuts between the cellar and the world — a girl who cannot wake (Unity Kincaid), a soldier who cannot sleep, the Dreaming itself cracking.
Clip: montage; no POV. Ends with the Dreaming's great palace shedding stone like sand.
*(No decision. Sets DREAMING to 40.)*

**1.4 Alex Burgess (1970s)**
Setting: Roderick is dead. His son Alex, older now, sits by the sphere with a guard, Paul.
Clip: Alex whispers through the glass: "If I let you go, will you hurt me?"
DECISION:
- A. **Promise him nothing, but show him a dream of his father's cruelty to him** (empathy). → MERCY +2. Alex nearly releases you; Paul stops him. Flag `ALEX_SEEN`.
- B. **Stare through him.** (canon) → MERCY 0.
- C. **Show him his own death.** → MERCY −2. Alex never comes back. Guards triple.

**1.5 Escape (1988)**
Setting: a guard falls asleep against the glass; his breath fogs it; his dream is your door.
Clip: POV. You slip into the sleeping guard's dream, then out into the cellar as a tall shadow. The circle is broken. Alex, now in a wheelchair, is wheeled in screaming.
DECISION — Alex's punishment:
- A. **Eternal Waking** — he dreams of waking forever, each time into a worse nightmare. (canon) → MERCY −3. Flag `ALEX_CURSED` (the Furies cite this in Ep. 7; Death rebukes you in 2.7).
- B. **A single night of nightmares, then nothing.** → MERCY 0.
- C. **Walk away. He is old and already afraid.** → MERCY +2.

---

### EPISODE 2 — Liberation and the Quest to Reclaim Power (PDF ch. 2)

**2.1 Return to the Dreaming**
Setting: the gates of Horn and Ivory, cracked. Lucienne the librarian waits with a lantern. Cain and Abel's houses are collapsing.
Clip: POV crossing the threshold. Environment variant by `DREAMING` value (ruined / strained). Lucienne: "My lord. Seventy years. We thought you dead."
DECISION — how to greet your realm:
- A. "Then you thought wrong. Report." (cold) → MERCY −1.
- B. "I am sorry I was gone so long." → MERCY +1. Lucienne's loyalty line unlocks extra information in 7.3.

**2.2 The Three-in-One** ◆
Setting: a crossroads at the edge of the Dreaming; the Fates / Hecateae — maiden, mother, crone.
Clip: they appear one by one, finishing each other's sentences. Each answers one question for a price.
DECISION — choose the order of the quest (all three required; order changes difficulty and dialogue):
- **Sand first** (London, easiest) → `CONSTANTINE_ALLY` possible before Hell.
- **Helm first** (Hell) → you enter Hell weakest; Lucifer's taunt is harsher; `LUCIFER_GRUDGE` more likely.
- **Ruby first** (Dee) → hardest; you face Dee without helm or sand; Dee can strip 10 extra `DREAMING`.

**2.3 The Pouch of Sand — Johanna Constantine (London)**
Setting: rain-slick London; Johanna's flat; then the house of her ex-lover Rachel, who has been breathing the sand for years.
Clip: POV; the flat is a nightmare garden of melted furniture. Rachel on the bed, half-dissolved into dream. Constantine: "She's dying. Can you do anything?"
DECISION:
- A. **Give Rachel a gentle dream to die in.** (canon) → MERCY +2. Flag `CONSTANTINE_ALLY` (she appears in 7.2 to warn you).
- B. **Take the pouch and go.** → MERCY −2. Constantine curses your name.
- C. **Try to save her** (POWER check) → only possible if you already hold the Ruby; otherwise fails and Rachel dies screaming. If it succeeds: MERCY +3, `CONSTANTINE_ALLY`.
→ POWER +1.

**2.4 The Helm — The Oldest Game in Hell**
Setting: the gates of Hell; a demon legion; Lucifer Morningstar on a throne of black stone; the demon Choronzon holds your helm.
Clip: POV across an amphitheatre of damned souls. The Oldest Game: each player names a form that defeats the last.
INTERACTIVE SEQUENCE — the player picks each response from 3 options (wrong picks lose a round; 3 lost rounds = you lose the helm this episode and must return in Ep. 4):
- Choronzon: "I am a dire wolf." → you: *hunter / fire / night* (hunter wins)
- "I am a horsefly biting the hunter" → *spider / wind / winter* (spider)
- "I am a snake" → *ox / eagle / stone* (ox)
- "I am anthrax, the ox dies" → *a world / a god / a river* (a world)
- "I am a nova, worlds burn" → *a universe / a star / darkness* (universe)
- "I am Anti-Life, the end of all" → **"I am hope."** (canon; only correct answer; shown as the final choice with two tempting wrong ones: *I am Death* / *I am the Endless*)
→ POWER +1.

**2.5 Lucifer's Threat**
Setting: the gates, as you leave. The legions block you.
Clip: Lucifer, quietly: "You have no power here, Dream. Tell me — why should I let you leave?"
DECISION:
- A. **"What power would Hell have if those imprisoned here could not dream of Heaven?"** (canon) → MERCY 0, but flag `LUCIFER_GRUDGE` ON. Hell parts. Lucifer: "One day I will destroy you."
- B. **Bow slightly and leave in silence.** → MERCY +1, no grudge. Lucifer finds you dull; **he will not hand you the key in Ep. 4** (he gives it to another). Changes Ep. 4 route.
- C. **Offer him a favour owed.** → flag `LUCIFER_FAVOUR`. He collects it in Ep. 7 by refusing to shelter you.

**2.6 The Ruby — Doctor Destiny (24 Hours)**
Setting: a roadside diner in America; John Dee, skeletal, sits with the Ruby. Six ordinary people inside.
Clip: POV from the dream-side. Through the diner window you watch the patrons' dreams twisting as Dee turns the stone. Intensity option: the player may **look away** (the clip cuts to the Dreaming shaking) or **watch** (horror variant).
DECISION — how to confront:
- A. **Enter the diner in the waking world.** → Dee sees you coming, uses the Ruby, you are nearly unmade. POWER check: if POWER ≥ 2 you survive; else you lose `DREAMING −15`.
- B. **Enter through the dreams of the patrons.** (canon) → You meet Dee inside the Ruby. Dee shatters it, thinking he kills you; the stored power returns to you.
→ POWER = 3 (full).

**2.7 Dee's Fate**
Setting: the ruins of the diner at dawn; Dee, tiny and broken, in your palm.
DECISION:
- A. **Return him to Arkham, asleep, and give him a dream.** (canon) → MERCY +2. Flag `DEE_SPARED`.
- B. **Unmake him.** → MERCY −3.
- C. **Leave him awake and sane with the memory of what he did.** → MERCY −1.

**2.8 The Sound of Her Wings** ◆ (closing scene; ties to PDF ch. 3's Death)
Setting: a park in Washington Square; pigeons; your sister Death in black, sitting on a bench.
Clip: POV; she throws bread at your feet. "You got your tools back and you're sitting here feeling sorry for yourself."
DECISION:
- A. **Admit you feel empty.** → MERCY +2. Death takes your hand; you walk her rounds (short montage: an old violinist, a baby). Unlocks the warm variant of 7.6.
- B. **"I am fine."** → MERCY −1. She leaves. The cold variant of 7.6 is used unless MERCY recovers.

---

### EPISODE 3 — The Endless Family (PDF ch. 3, truncated)

**3.1 Destiny's Garden** ◆
Setting: a garden of forking paths; Destiny, blind, chained to his book.
Clip: he reads from the book without looking: a family convocation is called. Scenes of the paths branching literally in the garden as you choose.
*(No decision; exposition of the Endless: Destiny, Death, Dream, Destruction (absent), Desire, Despair, Delirium.)*

**3.2 The Convocation**
Setting: a long table in Destiny's hall. Each sibling sits in their own light.
Clip: slow pan POV around the table. Each sibling speaks to you in turn; the player chooses one reply to each (short, 2 options each — all shift MERCY by ±1):
- **Death**: "You look better. A little." — warm / deflect
- **Despair**: "I missed you. The world was so sad without you." — thank her / recoil
- **Delirium**: "You were gone and I couldn't find you in the fish." — gentle / impatient
- **Desire**: "Still brooding over the girl you sent to Hell, brother?" — see 3.3

**3.3 Desire's Bait**
Clip: Desire smiles. The table falls silent. Death: "They are right, you know. What you did to Nada was wrong."
DECISION:
- A. **"You are right. I will go to Hell and free her."** (canon) → MERCY +2. Flag `NADA_QUEST`. Ep. 4 begins at Hell.
- B. **Rise, insult Desire, leave.** → MERCY −2. Ep. 4 begins at Faerie instead; Nada subplot locked until Ep. 6 (Delirium shames you into it, at higher cost).
- C. **"She refused me. The punishment was just."** → MERCY −3. Flag `PRIDE_LOCK` (blocks Ending A unless reversed in 6.4).

---

### EPISODE 4 — Realms Beyond the Dreaming (PDF ch. 4)

**4.1 Hell, Empty** ◆
Setting: Hell, silent, the fires out. Lucifer alone, locking the gates.
Clip: POV walking through vacant torture-halls. Lucifer: "I quit. The damned are loose in your world. And I have one last gift." He hands you the Key to Hell — **unless** `LUCIFER_GRUDGE` is off and you chose 2.5B, in which case he has given it to Azazel, and you must win it in 4.3 by bargain.
*(Lucifer cuts off his wings on the shore — Dream can hold the knife or refuse.)* MERCY ±1.

**4.2 The Suitors (two-part banquet)** ◆
Setting: the Dreaming's great hall, restored for guests. Delegations arrive: Odin, Thor and Loki (Norse); Azazel with Choronzon and the demons (who hold Nada's soul); Order and Chaos; Cluracan and Nuala of Faerie; Bast of Egypt; Susano-o of Japan; the angels Remiel and Duma, sent only to observe.
Clip: each delegation's entrance is its own short clip; the player can visit each table (hub scene).
DECISION — the Key to Hell goes to:
- **The angels** (canon) → flag `HELL_KEY_TO=angels`. Hell reopens as a place of "redemption through suffering." The demons leave Nada behind: `NADA_FREED`.
- **The Norse** → Odin gives you Loki's loyalty; flag `LOKI_DEBT`. Hell becomes a staging ground for Ragnarök. Nada must be bought from Azazel separately (MERCY −1 as a cost in a dream-duel).
- **Azazel and the demons** → `NADA_FREED` directly (they trade her), but Hell returns to pure torment. MERCY −2. Lucifer in Ep. 7 is hostile.
- **Faerie** → Hell becomes a wild court; Faerie owes you; Nuala's boon is doubled. Nada bought separately.
- **Order / Chaos** → neutral; Nada bought separately.
In every route, **Nuala is left behind as a gift** to the Dreaming → flag `NUALA_BOON` (she will owe you a boon; its *use* is the hinge of Ep. 7).
If you ever let Loki escape his cave-bindings in this banquet (an optional kindness: "I will give you a dream of freedom") → `LOKI_DEBT` ON regardless of who gets the key. This is the seed of Daniel's abduction.

**4.3 Nada**
Setting: a bare white room in the Dreaming. Nada, the queen you loved ten thousand years ago and sent to Hell when she refused you.
Clip: she stands with her back to you.
DECISION:
- A. **Kneel. "I am sorry. I was wrong."** (canon) → MERCY +3. Flag `NADA_FORGIVEN`. She chooses rebirth as a child in Hong Kong. Reverses `PRIDE_LOCK`.
- B. **"I have freed you. Return to me."** → MERCY −2. She strikes you and leaves. `PRIDE_LOCK` remains.
- C. **Offer her any realm, any reward, except an apology.** → MERCY −1. She refuses everything.

**4.4 The Underworld Negotiation** (PDF names this: negotiating "with gods of death... to free a soul trapped in eternal torment"; in the source this is Nada/Hell, so 4.1–4.3 cover it. If you want a separate Hades & Persephone scene it can be inserted here as an optional vignette for Orpheus' backstory ◆: you watch your son plead for Eurydice and fail.)

**4.5 Faerie — A Midsummer Night's Dream (1593)** ◆
Setting: Wendel's Mound, England. Auberon, Titania and the faerie court watch Shakespeare's company perform the play you commissioned.
Clip: POV from the grass. Puck swaps himself for the actor playing Puck. Titania beckons to Hamnet, Shakespeare's son.
DECISION:
- A. **Let the faerie court take what pleases them; the bargain was for a play.** (canon) → MERCY −1. Hamnet dies young (shown later in a single line). Puck stays loose in the mortal world → joins Loki in Ep. 7.
- B. **Warn Shakespeare about Titania's interest in the boy.** → MERCY +1. Titania insulted; Faerie's goodwill −1; Puck still loose.
- C. **Bind Puck before he leaves the mound.** → Puck is not loose; in Ep. 7 Loki acts alone (siege is weaker: `DREAMING −10` less).

---

### EPISODE 5 — Reflections on Humanity (PDF ch. 5)

These four stories are a **hub**: the player chooses the order; each is 1–3 scenes.

**5.1 Calliope** (PDF: Richard Madoc and the captured muse)
Setting: a writer's house in England; a locked upstairs room; Calliope, your former lover and mother of Orpheus, naked and chained to a chair for sixty years.
Clip: POV in the doorway. She does not look up. "You came."
DECISION 1 — Calliope:
- A. **Free her at once, before dealing with Madoc.** → MERCY +1.
- B. **Deal with Madoc first.** → MERCY 0.
DECISION 2 — Madoc's punishment:
- A. **Flood him with ideas until he claws at the walls.** (canon) → MERCY −1. Flag `MADOC_FATE=flood`.
- B. **Ask Calliope what she wants.** → She asks for his release once he has confessed publicly. MERCY +2. `MADOC_FATE=confess`.
- C. **Strip him of every idea he ever had, leaving him empty.** → MERCY −3.
Flag `CALLIOPE_FREED`. She appears at the Wake in 7.6.

**5.2 Rose Walker — The Vortex** (PDF: Rose, the dream vortex)
Setting: a boarding house in Florida; Rose searching for her brother Jed; the escaped nightmare the Corinthian; a serial-killer "cereal convention."
Three scenes:
*5.2a The Corinthian.* A hotel ballroom of murderers. The Corinthian, your own creation, a nightmare with mouths for eyes, keynote speaker.
DECISION: **Unmake him** (canon; MERCY 0) / **Order him home to be remade** (MERCY −1; flag `CORINTHIAN_REMADE` early, he is a tool in Ep. 7) / **Let him go** (MERCY −2; `DREAMING −10`).
Then the convention: **Leave them their delusions** / **Make them see what they are** (canon, MERCY +1).
*5.2b The walls come down.* Rose dreams; every dreamer in the house falls into one shared dream; the Dreaming begins to tear.
Clip: POV in the Dreaming as Lucienne's library pages fly off into a vortex.
DECISION:
- A. **Kill Rose now.** → `DREAMING` saved. MERCY −4. Flag `ROSE_SPARED` off. Death appears, silent, disappointed.
- B. **Wait. Search for another way.** → `DREAMING −15` (the realm bleeds while you wait) → leads to 5.2c.
- C. **Refuse to kill a mortal at all; try to contain the vortex.** → fails. `DREAMING −40`. If this drops DREAMING to 0 → **Ending D** triggers now.
*5.2c Unity Kincaid.* The old woman who slept through your captivity (from 1.3) steps into the dream: "It should have been me. I was meant to be the vortex." She takes Rose's heart and dies in her place. (canon)
→ MERCY +2. `ROSE_SPARED` ON. Rose appears in 7.6.
Also here: **Desire** engineered Rose's existence to trick you into killing family blood. Optional confrontation in Desire's Threshold: **threaten** (MERCY −1) / **warn and leave** (MERCY 0).

**5.3 Hob Gadling — Men of Good Fortune** (PDF: the immortal met once a century)
Setting: the White Horse tavern, 1389, then the same spot every hundred years.
Six short clips; in each, one toggle decision: **acknowledge Hob as a friend** / **deny it, call it curiosity**.
- 1389: Hob boasts he will never die. Death grants it on your behalf. *(no decision)*
- 1489, 1589 (Shakespeare in the corner, Will's bargain seeds 4.5), 1689 (Hob destitute), 1789 (Hob rich from slaving; you tell him it is "a poor thing to be slaver" — **say it** MERCY +1 / **stay silent** 0)
- **1889**: Hob: "You keep coming back because you're lonely. I'm your friend." DECISION: **Walk out** (canon; MERCY −1) / **"Perhaps."** (MERCY +1).
- **1989**: you return, late, after captivity. If you walked out in 1889 and still return: Hob: "I knew you would." Flag `HOB_FRIEND` ON if ≥ 4 acknowledgements in total. Hob gets a speech at the Wake.

**5.4 Lyta Hall and Daniel** (PDF ch. 6 names them; they are seeded here) ◆
Setting: a ruined dream-house where two rogue nightmares, Brute and Glob, have hidden a dead hero's ghost and his pregnant wife, Lyta.
Clip: you dissolve the false house. Lyta screams as her husband's ghost unravels.
DECISION — what you say about her unborn child, conceived in the Dreaming:
- A. **"The child is mine. One day I will come for him."** (canon) → MERCY −2. Flag `LYTA_THREATENED` ON. Lyta's hatred is total in Ep. 7.
- B. **"The child belongs to dreams. When he is grown he may choose."** → MERCY +1. Lyta still fears you but hesitates in 7.2 (one extra option).
- C. **Say nothing; let her go with her ghost's last words.** → MERCY +2. Lyta grieves rather than hates; the Furies must *trick* her in Ep. 7.

---

### EPISODE 6 — Redemption and Change (PDF ch. 6, truncated)

**6.1 Restoring the Realm**
Setting: the Dreaming, rebuilt according to `DREAMING` value. Lucienne presents the census of what returned and what did not.
Clip: a walking tour: the library, the house of Cain and Abel, the gates. Matthew, a newly dead man, is offered the post of raven.
DECISION: **Accept Matthew as your raven** (canon; MERCY +1; `MATTHEW_RAVEN`, he narrates key Ep. 7 beats) / **Refuse; you need no company** (MERCY −1).
DECISION: **Remake the Corinthian** (if not already) — **remade, with your eyes** (he becomes your hunter in Ep. 7) / **leave him unmade**.

**6.2 Nuala's Service**
Setting: the palace. Nuala, the faerie gift, stripped of glamour at your order, asks to serve.
DECISION: **Let her keep her glamour** (MERCY +1) / **"In my realm, things are what they are."** (canon; MERCY 0). Either way: "If you ever need me, call, and I will come." `NUALA_BOON` confirmed.

**6.3 Brief Lives — Delirium's Quest** ◆
Setting: Delirium, youngest of the Endless, at your door: "Help me find our brother. Destruction." Three travelling clips: a waking-world road trip (airport, a dancer, a lawyer who dies when you touch his life), then the island where Destruction has hidden for 300 years with his talking dog, Barnabas.
Clip: Destruction, huge and gentle, painting badly. "I quit, brother. You should think about it."
DECISION:
- A. **Listen.** → MERCY +1. Unlocks **Ending C** as an option in 7.5.
- B. **"The Endless do not quit."** → MERCY −1. Ending C locked.

**6.4 Orpheus — the point of no return** ◆
Setting: a Greek island shrine. Your son Orpheus, a living severed head on an altar, kept by a priest. He told you where Destruction was; his price was death.
Clip: POV close on the head. "Father. You promised."
DECISION:
- A. **Grant him death.** (canon) → MERCY +3. Flag `ORPHEUS_RELEASED` ON. **You have spilled family blood. The Furies may now claim you.** This is required for **Ending A**. Reverses `PRIDE_LOCK` if still set.
- B. **Refuse. "I will not."** → MERCY −3. `ORPHEUS_RELEASED` OFF. The Furies have no legal claim: **Ending A impossible**; Ep. 7 plays as a pure siege toward Ending B or C.
- C. **Ask Death to do it instead.** → Death: "No. He is yours." Returns to the choice (a beat, not a route).

**6.5 Return**
Setting: the Dreaming at dusk. You wash your son's blood from your hands in a stream and it will not come off.
Clip: Matthew (if raven) or Lucienne asks what happened. The reply is auto-written from MERCY.
*(No decision; tonal checkpoint.)*

---

### EPISODE 7 — The Legacy of the Sandman (PDF ch. 7)

**7.1 The Abduction of Daniel**
Setting: Lyta's apartment; Daniel, two years old, playing. Loki (if `LOKI_DEBT`) and Puck (if loose from 4.5) take him and burn a false body in the crib.
Clip: cutaway, not POV. Lyta's scream.
If `LOKI_DEBT` is OFF and Puck is bound: Desire arranges the abduction instead through mortal agents — slower, and you learn of it in time to send the Corinthian.

**7.2 Lyta Walks**
Setting: Lyta, barefoot, walking into the city that becomes a myth-city. Three women at a loom (the Furies in disguise). "Do you want to hurt him?"
Clip: intercut with POV in the Dreaming as Lucienne reports a mortal "descending into the myths." If `CONSTANTINE_ALLY`: Johanna appears at the gates to warn you first.
DECISION:
- A. **Send the Corinthian (if remade) and Matthew to find Daniel.** (canon) → they recover him from Loki.
- B. **Go yourself to Lyta.** → Only possible if `LYTA_THREATENED` is OFF. You reach her before the Furies. If MERCY ≥ 5 she listens. **Ending A becomes Ending A-variant** (see §4). Otherwise she curses you anyway.
- C. **Do nothing; a mortal cannot harm the Dreaming.** → The Furies enter unopposed; `DREAMING −30`.

**7.3 The Siege of the Dreaming**
Setting: the Furies, now in Lyta's body, walk through your realm. Everyone they touch dies: Gilbert/Fiddler's Green, Abel, Mervyn.
Clip: POV walking through your dying realm. Environment variant uses `DREAMING`. Allies present depend on flags.
DECISION — for each named resident, a quick choice as the Furies approach: **send them away** (they survive; MERCY +1 each) / **have them stand** (they die; MERCY 0). Three such micro-decisions (Abel, Mervyn, Lucienne).

**7.4 Nuala's Boon**
Setting: Faerie. Nuala, having learned Daniel is taken and the Dreaming under attack, calls her boon: "Come to me."
Clip: you are pulled from the siege mid-sentence to a faerie glade. Nuala: "I love you. I wanted to warn you." Lucifer (if `LUCIFER_FAVOUR`) or Odin's messenger offers shelter if you abandon the Dreaming.
DECISION:
- A. **Honour the boon in full; stay until she releases you.** (canon) → MERCY +1. Your absence lets the Furies kill more. `DREAMING −10`.
- B. **Break the boon and return.** → MERCY −2. Faerie is offended; Nuala's confession is never heard. Siege damage less.
- C. **Accept shelter (only if offered).** → Jumps to Ending C.

**7.5 The Choice** (the climax; PDF: "He surrenders himself to the Furies")
Setting: the throne room, the gallery of the Endless' sigils, the Furies at the door. Death waits on the steps.
Clip: POV. Each sigil on the wall is a door; your siblings' voices come through them (Desire gloating, Despair quiet, Delirium pleading, Destruction absent, Destiny silent).
DECISION (options unlocked by state):
- A. **Walk to Death and take her hand.** → **ENDING A.** Requires `ORPHEUS_RELEASED` ON and MERCY ≥ 4.
- B. **Stand and fight the Furies as the king of the Dreaming.** → **ENDING B.**
- C. **Walk through Destruction's door.** → **ENDING C.** Requires 6.3A.
- If MERCY < 4 and `ORPHEUS_RELEASED` ON: A is shown greyed, Death says: "You could have. You still can. But you haven't learned how yet." → B or C only.

**7.6 The Wake**
Setting: the necropolis Litharge; a funeral attended by every being from every realm.
Clip: a long POV **not as Morpheus** — the player is now **Daniel**, the new Dream, white-robed, walking through mourners. Each attendee is present or absent by flag: Hob (if `HOB_FRIEND`), Rose (if `ROSE_SPARED`), Calliope (if `CALLIOPE_FREED`), Nada (if `NADA_FORGIVEN`), Constantine (if ally), Matthew (if raven), Alex Burgess' ghost (if not cursed), Lucifer at the edge (tone by grudge/favour). Death's eulogy changes by MERCY.
Final line (PDF): the torch passes; the Endless persist beyond individual incarnations.

---

## 4. Endings

| ID | Name | Requirement | What the player sees |
|---|---|---|---|
| **A** | *The Sound of Her Wings* (canon) | `ORPHEUS_RELEASED`, MERCY ≥ 4, chose 7.5A | Morpheus takes Death's hand on the throne steps. Daniel wakes as Dream. The full Wake (7.6) with every earned mourner. |
| **A-var** | *Lyta's Mercy* | As A, plus 7.2B succeeded (MERCY ≥ 5, Lyta never threatened) | Lyta releases the Furies herself. Morpheus still goes to Death, but by his own choice, not pursuit. Lyta holds Daniel at the Wake. |
| **B** | *The King Who Would Not Change* | Chose 7.5B | Morpheus destroys the Furies' vessel but the Dreaming is ash. He sits a cracked throne alone. Death visits once: "You won. Was it worth it?" No Wake. Short epilogue: nightmares loose in the world. |
| **C** | *The Deserter* | 6.3A and chose 7.5C or 7.4C | Morpheus abandons the realm. The Dreaming fades; Delirium wanders its ruins; Destiny's book records a chapter never finished. Bittersweet, lonely. |
| **D** | *Eternal Waking* (premature) | `DREAMING` reaches 0 at any point (most likely 5.2c) | The Dreaming collapses. Humanity stops dreaming. Final clip: the sleeping sickness from 1.3 returns to the whole world; Morpheus a king of nothing. Offers "Return to the last choice." |
| **E** | *Hollow Bargain* (short) | 1.2C and later `DECEIT` compounded by 2.5C and 4.3C | Desire reveals every lie at the Convocation replay; the Endless strip Morpheus of the realm by consensus. Rare, deliberately for "evil run" players. |

---

## 5. Consequence web (what echoes forward)

| Early choice | Echo |
|---|---|
| 1.5A `ALEX_CURSED` | Death rebukes you in 2.8; the Furies name it in 7.5; Alex absent from the Wake. |
| 2.2 artifact order | Difficulty and dialogue of each of 2.3–2.6. |
| 2.3A `CONSTANTINE_ALLY` | Johanna warns you in 7.2 (earlier knowledge of the Furies). |
| 2.5 Lucifer | 2.5A grudge: Lucifer gives you the key *to spite the universe* (4.1). 2.5B no grudge: you must win the key at the banquet. 2.5C favour: he collects by offering shelter in 7.4 (temptation toward Ending C). |
| 2.7 Dee | `DEE_SPARED`: a dreaming Dee is glimpsed at the Wake. |
| 3.3 Desire's bait | Sets whether Ep. 4 begins in Hell or Faerie; `PRIDE_LOCK`. |
| 4.2 Hell's key | Who shelters/attacks in 7.4; whether Loki is in your debt (abduction route). |
| 4.3 Nada | Forgiveness reverses `PRIDE_LOCK`; Nada at the Wake. |
| 4.5 Puck | Bound Puck = weaker siege; loose Puck = Loki's accomplice. |
| 5.2 Rose | `DREAMING` damage; Rose at the Wake; Ending D risk. |
| 5.3 Hob | Hob's speech at the Wake; Hob alone otherwise. |
| 5.4 Lyta | Whether 7.2B exists at all. |
| 6.3 Destruction | Ending C unlock. |
| 6.4 Orpheus | **Master switch** for Ending A. |
| 7.4 Nuala | Siege death toll; Faerie attendance at the Wake. |

---

## 6. Production notes for generated video

- **Perspective:** first-person POV default. Morpheus appears only as reflection, shadow, hands (pale, long fingers, black sleeves), and in other characters' eyes. Saves character-consistency budget for the supporting cast.
- **Scene = clip template + variant tags.** Example: `2.1_return_dreaming[ruined|strained]`, `7.3_siege[allies:constantine,matthew][dreaming:30]`. Generate base plates once, then variants.
- **Clip length:** 6–12 s per beat; decision screens freeze on the last frame with an ambient loop (dust motes, candle flicker, pigeons) so the player never stares at a still.
- **Decision UI:** options are spoken as Morpheus' *inner voice*; no on-screen buttons until the player touches the screen. Keeps the "inside the book" feel.
- **Approximate asset count for a vertical slice (Episode 1 + 2):** 13 core scenes, ~9 variants, 3 interactive sequences (Oldest Game, diner, Death's rounds). This is the recommended first build.
- **Recurring locations to lock early (style sheets before any clip):** Burgess' cellar, the Dreaming palace (3 states), Lucienne's library, the gates of Hell, the diner, Death's park bench, Destiny's garden, the White Horse tavern, the throne room, Litharge.

---

## 7. Decisions (updated 2026-10-21)

| Question | Decision |
|---|---|
| Audience | Private gift for the author's wife, who likes adventure. Not for store release, so no licensing concern. |
| Scope of first build | **Episode 1**, plus scene 2.1 (return to the Dreaming) as a closing teaser so the slice ends on wonder, not in a cellar. |
| Tone ceiling | Full horror kept for 2.6 and 5.2a. "Look away" remains an option, not the default. |
| Perspective | **Hybrid, recommended:** cinematic third-person for establishing shots and emotional beats (Dream is visible), first-person POV for the moment of every decision and for tense beats. See `episode-1-production-sheet.md` §1 for why. |
| Generator | **Kling (可灵)** via the Kling Open Platform API. Character consistency via Kling Elements / subject binding from reference images or a short reference clip. |
| Platform | Recommendation: build as a web app (PWA) first, installable on her phone's home screen, landscape 16:9. Wrap as an APK later only if wanted. |

See `episode-1-production-sheet.md` for the Episode 1 cast, locations, and the reference images needed.

**Hero note (added 2026-10-21):** the player's Dream is named **Aurie** and modelled on the author's wife. Every "he/his" for Morpheus in this map becomes "she/her" in the game; "my lord" becomes "my lady." Nothing else changes.

**Series note (added 2026-10-21):** this book is Book 1 of a linked series with *Neverwhere*, *Coraline* and *The Alchemist*. Scene 2.1, Lucienne's library, is the hub the player returns to between books and between Sandman episodes. The MERCY meter is the `mercy` trait of a shared Traveller profile. See `series-bible.md`.
