# Neverwhere: interactive story map (v0.1)

**Source:** `source-text/neverwhere.txt`, the full novel (prologue and twenty chapters). Page references point to its page markers. Anything not in the novel is marked **◆** and kept rare.

**Series place:** Book 2 of *The Library of Doors* (`series-bible.md`), entered through the *Neverwhere* door in Lucienne's library. Trait shaped: **LOYALTY** (`profile.traits.loyalty`). Relic earned: **the Angel's key** (`"angel_key"`), the silver key kept by the Black Friars.

**Player character:** Richard Mayhew. As in Book 1, the hero is played by and modelled on the author's wife; generated dialogue uses the name and pronouns in her profile. The map says "Richard" and "he" to match the source.

---

## 0. Design pillars

1. **Will you go back for them?** Richard stops for a bleeding stranger, loses his whole life for it, and at the end, holding the life he asked for, cuts a door back. Every decision asks whether he stays with people when it costs him: Door, Anaesthesia, Hunter (even after she betrays him), the marquis, Old Bailey. LOYALTY rises for going back, standing in front and keeping faith; it falls for saving yourself, naming others, and keeping the ticket home in your own pocket.
2. **Hybrid perspective, hand-held.** Cinematic third-person, hero visible, for establishing and emotional beats; first-person POV at every decision and in tense beats (the ladder, Night's Bridge, the plank, the Ordeal, the Beast). Every clip hand-held with natural shake: a breathing drift on still shots, a real stagger on running ones, more shake in POV. Never a tripod lock, never a drone glide.
3. **Grimy, witty, real.** London Below is wet brick, sewer water, candles in lemonade bottles, coats patched with lace. The surreal is one or two details per shot (a door where there was wall, a medieval court inside a Tube carriage) shot as photographically as everything else (`character-prompts.md` §1). The humour is dry and played straight. Homeless people in London Above are shown with dignity, never as comic grime: the book's heart is that Richard sees them.
4. **Two Londons, two looks.** Above: daylight, sodium-orange nights, glass, people looking through the hero. Below: fire, lamp and candle, ochre and soot, blacks that hold detail. While Richard is invisible, his reflection in shop glass lags half a beat behind him.
5. **No mid-story game over, except the one the book provides.** Bad choices close off allies and endings and leave marks (a cut ear, a missing bead). The only premature ending is failing the Ordeal (Ending E), which offers a return to the last choice.
6. **Cutaways carry half the book.** Door, the marquis, and Croup and Vandemar drive the plot when Richard is absent. These play as short 3P cutaways without decisions, as in Sandman 7.1. Their dramatic irony (the marquis pocketing the Beast statue, then sitting down with the killers) makes the "traitor" choice in 5.2 a real deduction. **One is held back:** Islington's call to Croup (ch. 13, pp. 189 to 190) moves to the climax (8.4) as a flashback, so the twist lands for the player when it lands for Richard.
7. **Richard's look follows the story** (set per episode, not chosen): good suit (Ep 1) → jeans, sneakers, thick sweater (Ep 2 to 3) → muddy, unshaven, bleached welts on the jeans (Ep 4 to 7) → bloodied, splinted finger, stitched ear (Ep 8) → grey friar's robe (8.5) → office suit with the splint (8.8 to 8.9).

---

## 1. State variables

| Variable | Range | Moved by | What it changes |
|---|---|---|---|
| **LOYALTY** | -10 to +10 (profile) | Nearly every decision. | Which endings exist (A needs ≥ 4, B needs ≥ 8); who answers the knife-cut door; tone of Door's and the marquis's lines. |
| **DOOR_BOND** | 0 to 5 (starts 1) | Kindness to Door, taking her side, trusting her with the key. | Ending A-variant, Ending B, Door's lines on the Westminster hill. |
| **MARQUIS_TRUST** | 0 to 3 (starts 1) | Defending or doubting the marquis; accepting his help. | Whether the marquis is the one who comes back (A vs A-var). |
| **MERCY / COURAGE / FAITH** | profile, ±1 | Light touches, marked in scenes. | Cross-book echoes (§5). |

**Flags:** `UMBRELLA_GIVEN`, `TOLD_CV`, `RAT_RESPECT`, `ANA_HEARD`, `ANA_ASKED` (0 to 3), `BEAD_KEPT`, `OLD_BAILEY_FRIEND`, `LAMIA_NOTICED`, `DOOR_PROMISE`, `HUNTER_SUSPECT` (0 to 3), `BEAST_SHARED`, `ISLINGTON_BARGAIN` (self / door / atlantis), `KEY_TAKEN`, `NO_COPY`, `LAMIA_GUIDE`, `WARRIOR`, `KNIFE`, `HUNTER_FORGIVEN`, `LATE`, `CV_LOOSE`, `KEY_RETURNED`, `ABOVE_ANCHOR`, `KEPT_FEATHER`.

**Master switches:**
- **The key** (`KEY_TAKEN` → `NO_COPY`). Door beats the angel with a copy Hammersmith forges at the market, which needs the real key to pass through her hands. If Richard keeps the key after the Ordeal (6.6B) and refuses to lend it at the market (7.2B), there is no copy and the climax runs on the real key: the road to Ending D.
- **Hunter's knife** (`KNIFE`). The canonical ending is cut with it. Refuse it in 8.3 and Ending A is gone.
- **Hunter's secret** (`HUNTER_SUSPECT`). Clues in 5.1, 5.2, 6.1, 6.2. At 2, Richard can warn Door before the betrayal (7.6).

---

## 2. Structure at a glance

Eight episodes in the novel's order: **48 core scenes** plus the hub door (1.0), **14 cutaways**, about **25 variant clips**, **5 endings** plus one variant.

| Ep | Title | Chapters | Core scenes | Key fork |
|---|---|---|---|---|
| 1 | Doors | Prologue to 2 | 7 (+1.0) | Carry the girl home; lie to the killers |
| 2 | Fallen through the cracks | 3 to 5 | 6 | Anaesthesia; Night's Bridge; the bead |
| 3 | The Floating Market | 5 | 4 | What you trade; "Are you coming?" |
| 4 | Earl's Court | 6 to 8 | 4 | Defending or doubting the marquis |
| 5 | Angels over England | 8 to 10 | 6 | Who is the traitor; what you ask the angel |
| 6 | The Ordeal of the Key | 10 to 12 | 6 | Hunter's clues; the Ordeal; who holds the key |
| 7 | Down Street | 13 to 15 | 6 | Lending the key; Lamia; Hunter's betrayal |
| 8 | The Beast, the angel, and the door | 16 to 20 | 9 | The Beast; Islington's bargain; stay or go; cut the door |

---

## 3. Episode by episode

Format per scene: **Setting** → **Clip** (3P or POV) → **DECISION** → consequences. Cutaways (**C1** to **C14**) are listed where they fall.

### Episode 1: Doors (prologue, ch. 1 to 2)

**1.0 The Neverwhere door** (hub)
Setting: the Doors wall. The *Neverwhere* door is a plain London street door: peeling black paint, brass letterbox, the Underground roundel worn into the wood.
Clip: POV, hand on the cold handle; Lucienne behind (open conversation, §6). It opens on rain and pub noise. *(No decision.)*

**1.1 The umbrella** (prologue, pp. 3 to 6)
Setting: a small Scottish town, the night before Richard moves to London; rain outside the pub.
Clip: 3P. Richard, sick at his own leaving party, sits on the kerb with a white umbrella printed with the Tube map. A beaky old woman in shawls reads his palm, blinks ("Not any London I know"), warns him about doors, and wobbles off into the rain.
DECISION:
- A. **Run after her with the umbrella.** (canon) → LOYALTY +1. Flag `UMBRELLA_GIVEN`. A good heart, she says, is sometimes enough, but mostly not.
- B. **Go back inside.** → 0.

**1.2 Door on the pavement** (ch. 1, pp. 10 to 22)
Setting: three years later. The office off the Strand (trolls on the monitor, a Post-it on Jessica's photo), then a dark street behind a high brick wall, Jessica on his arm, late for dinner with her boss.
Clip: 3P montage of the Friday. **C1** intercut: a girl running four days through tunnels; Croup and Vandemar walking behind their "canary", Mr Ross; Ross finds her and she puts her hand to his chest and *opens* him (implied, not shown); she runs, bleeding. On the street a door opens in the blank wall and a figure falls. Jessica steps over it. Richard kneels; blood on his fingers. POV: the girl's eyes open: not a hospital, they'll find me. Jessica: put her down or the engagement is over.
DECISION:
- A. **Carry her home.** (canon) → LOYALTY +3. Jessica left crying. At his flat (keys left inside) the girl touches the door and it swings open.
- B. **Dial 999 and go to dinner.** → LOYALTY -1. Variant: walking home alone at midnight he finds her still there, unseen by anyone, and carries her home then. DOOR_BOND -1.

**1.3 Whose barony is this?** (ch. 2, pp. 23 to 25)
Setting: Richard's flat, morning, TV still on.
Clip: opens on the **first Beast dream**, POV: a sewer, a boar the size of an ox, his hand on a spear but furred and clawed, the charge, face-down in bloody water. 3P: he wakes on the couch. The girl, in layers of filthy velvet and lace, stares at the buses: "I'm in London Above." Most of the blood was someone else's. They bandage her arm at the sink.
DECISION (conversation window, Door):
- A. **Just help; ask nothing.** → LOYALTY +1, DOOR_BOND +1.
- B. **Insist on a doctor and the police.** → DOOR_BOND -1.
- C. **Make a joke of it.** → DOOR_BOND +1. She repeats his name as one word.

**1.4 Two gentlemen at the door** (ch. 2, pp. 25 to 30)
Setting: the doorway. Mr Croup (small, orange-haired, a fox) and Mr Vandemar (huge, a wolf) in black suits cut two centuries wrong, with posters: HAVE YOU SEEN THIS GIRL? ANSWERS TO THE NAME OF DOREEN.
Clip: POV, Croup's graveyard smile arriving a fraction late. Vandemar sniffs and walks straight to the bathroom. It is spotlessly empty. Cross-book echo: if Sandman `ALEX_CURSED` is on, Vandemar, sniffing: "We heard of a man who dreams of waking. Nasty."
DECISION (conversation window, Croup and Vandemar):
- A. **"I haven't seen her."** (canon) → LOYALTY +2.
- B. **Bluster about the police.** → LOYALTY +1. (Croup cuts the phone line anyway.)
- C. **Glance at the bathroom. "She was here."** → LOYALTY -4. Flag `TOLD_CV`. DOOR_BOND -2: she heard.
After: Jessica's message on the machine ends the engagement. The girl is making tea: "I'm Door."

**1.5 Breadcrumbs** (ch. 2, pp. 30 to 33)
Setting: the bedroom window over the roof tiles.
Clip: 3P. Door picks up an ordinary pigeon, ties a message on with Richard's blue rubber band and burbles at it: find the marquis de Carabas. Later a rat runs from the videotapes and Richard throws the remote at it. It carries the reply.
DECISION (Door: "Are you going to apologise?"):
- A. **Apologise to the rat, with dignity.** (canon) → LOYALTY +1. Flag `RAT_RESPECT`.
- B. **"It's a rat."** → DOOR_BOND -1.

**1.6 Orme Passage** (ch. 2, pp. 33 to 41)
Setting: Hanway Street, then an alley that should not exist (ORME PASSAGE W1) under one gas jet; a sewer ladder that comes out on a rooftop in daylight.
Clip: 3P. Richard turns three times widdershins and tosses the note at a bin; a pile of rags stands up and catches it: the marquis. POV on the ladder: London tiny below; the marquis lets go with both hands and waggles his fingers. On the roof Old Bailey offers starling stew; the marquis forces a silver box on him. A broom cupboard lets them out in Richard's stairwell.
DECISION 1 (conversation window, the marquis: "What exactly is she offering me?"):
- A. **"A favour. A really big one."** (canon) → MARQUIS_TRUST +1.
- B. **"She'll owe you. So will I."** → LOYALTY +1.
- C. **Bluff that she can pay.** → MARQUIS_TRUST -1.
DECISION 2 (POV, the ladder): **climb** (canon; COURAGE +1) / **ask for help** (he gives none, but waits).

**1.7 Goodbye** (ch. 2, pp. 41 to 42)
Clip: 3P. Door, washed, in a huge leather flying jacket. The marquis kneels: "My lady." She thanks Richard, kisses his cheek as friends do, says sorry without saying for what. He looks down; when he looks up, nobody is there. *(No decision.)*

---

### Episode 2: Fallen through the cracks (ch. 3 to 5)

**2.1 The Monday nobody sees** (ch. 3, pp. 43 to 47)
Clip: 3P, reflections lagging. Interactive montage: the player picks three of five attempts to be seen (taxi, ticket machine, Tube doors, Sylvia, Gary); all fail. Last: Jessica's office, "Angels over England" posters. She apologises for her dreadful memory for faces.
DECISION:
- A. **"It's okay. Forget it."** (canon) → 0.
- B. **"I'm sorry I upset you. I'd stop for her again."** → LOYALTY +1. She calls after him: "Richard... Maybury?"

**2.2 The flat is let** (ch. 3, pp. 48 to 51)
Clip: 3P comedy: an agent shows the flat to a couple while Richard hides behind a washcloth in the bath. "We'll take it." Then the phone. POV: Croup, through static, asks if he knows what his own liver tastes like.
DECISION (conversation window, Croup by phone):
- A. **"I don't know where she is."** (canon, and true) → LOYALTY +1.
- B. **"If I help you find her, will you leave me alone?"** → LOYALTY -3. Flag `TOLD_CV`.
- C. **"I'm calling the police."** → 0. The operator cannot hear him.
He packs a bag: "You knew this would happen."

**2.3 The cash machine** (ch. 3, pp. 51 to 53)
Clip: 3P. The card is rejected. Richard gives it to a short old homeless man ("fifteen hundred in there, if you can get to it"), who hands it back. The man can see him, but backs away when Richard asks about the Floating Market.
DECISION:
- A. **"I'm sorry I troubled you."** (canon) → MERCY +1. The man, Iliaster, hisses him back and leads him down basement steps.
- B. **Grab his sleeve.** → LOYALTY -1. He flees; Richard sleeps on a bench until a rat leads him to the same door (if `RAT_RESPECT`; otherwise Iliaster returns, grumbling).

**C2** (pp. 54 to 57): the closed hospital's sub-cellar. Croup throws razor blades between his fingers; Vandemar pins his own hand to the wall with his knife. The Bakelite phone: the employer says "the other one" is not old enough; it must be the Door female, alive. Vandemar spits on the wound and it closes.

**2.4 The Lord Rat-speaker** (ch. 3 to 4, pp. 52 to 60)
Setting: a vaulted hall of small fires and spits, people in calico-fur trims.
Clip: POV, a glass dagger at his throat. Across the hall people fall to the floor as a small black shape approaches: a rat, who seems to wink.
DECISION (conversation window, the Lord Rat-speaker with Master Longtail):
- A. **"Hello, Ratty. Do you know where Door is?"** (canon) → horror in the room, amusement in the rat. `RAT_RESPECT` on.
- B. **Kneel with everyone and wait.** → 0.
- C. **Grab for the glass.** → a cut on the neck (visible later). Longtail stops it.
Without `RAT_RESPECT`, Longtail hesitates and the Rat-speaker gets his nick in. Either way the bag is taken (it returns in 8.6) and a thin girl is ordered to guide him to the market.

**C3** (pp. 60 to 75): the House Without Doors. A white hall hung with pictures of rooms. Memories in the walls: her brother floating in a Victorian pool; her mother and little sister watering plants until Croup steps in (cut before the knife). Her father's study: **the marquis pockets a small obsidian beast from the desk.** The journal machine: Lord Portico, bleeding, says go to Islington, trust Islington, avenge us; then blood across the wall. The marquis takes the gold watch.
**C4** (pp. 71 to 73): Croup and Vandemar "hire" Varney to win the bodyguard job by pulling his morning-star apart link by link.

**2.5 Anaesthesia** (ch. 4, pp. 60 to 71)
Setting: dark vaults; a door onto the Embankment at night; the Albert Bridge in its lights.
Clip: 3P. The girl wears a stained badge, I AM 11, and quartz beads, and has eaten his fruit. "Do you like cat? Thigh or breast?" On a bench by the river she tells him how she came Below. **Tone note:** her history (a mother who broke down, an aunt's man who hurt her, running away on her birthday, rats finding her sick under a flyover) is told in her own words over a still two-shot; nothing is shown. Keep "nobody ever gets both."
DECISION (conversation window, Anaesthesia):
- A. **Ask about her, and listen.** (canon) → LOYALTY +2. Flag `ANA_HEARD`.
- B. **Talk about your job and fiancée.** → 0.
- C. **Promise to get her back up here one day.** → LOYALTY +1, `ANA_HEARD`.

**2.6 Night's Bridge** (ch. 4, pp. 75 to 80)
Setting: a stone bridge over a black void, no sky, no water.
Clip: 3P. Varney's gang shoves Richard down; Anaesthesia hisses like a cornered rat and Varney backs off. A tall woman in mottled leather joins them. On the bridge the dark is turned up. POV, near-black: something slithers past; Anaesthesia's hand shakes in his. Hallucinations: **an angel falling with burning wings** (plant it), Jessica, the Beast. The candle flares. Nobody is holding his hand. Beads patter down the bridge.
DECISION 1 (POV, in the dark):
- A. **Hold her hand tighter and keep walking.** (canon) → LOYALTY +1.
- B. **Let go to shield your face.** → LOYALTY -1. In 6.5 her voice says "You let go."
- C. **Call her name.** → LOYALTY +1, COURAGE +1.
She is taken in every case: the bridge takes its toll. Cross-book echo: if Coraline is finished with COURAGE ≥ 4, **D. keep talking to her in the dark**: still taken, but the rat in 5.1 says she heard him, and she counts as an anchor in 6.5 without the bead.
DECISION 2 (beads at his feet):
- A. **Keep one bead.** (canon) → `BEAD_KEPT`.
- B. **Go back onto the bridge for her.** → LOYALTY +2. The woman hauls him back by the collar; the beads roll into the dark.
- C. **Walk on without looking.** → LOYALTY -2.

---

### Episode 3: The Floating Market (ch. 5)

**3.1 Harrods after dark** (pp. 81 to 87)
Clip: 3P. Knightsbridge station; his watch has gone blank and he bins it. Harrods' Egyptian Room ablaze: dream sellers, a woman bawling "Rubbish!", a knight selling Lost Property, a dentist with a hand drill. A pale woman in black velvet smiles (micro: **smile back** (canon) → `LAMIA_NOTICED` / look away). A sign: OLD BAILEY'S BIRDS AND INFORMATION.
DECISION (Old Bailey: "What'll you give me?"):
- A. **Aunt Maude's handkerchief.** (canon) → `OLD_BAILEY_FRIEND`. He waves it like a flag.
- B. **Anaesthesia's bead** (if kept). → LOYALTY -2; `BEAD_KEPT` off.
- C. **Nothing.** → he arrives at the auditions late and sees only the end of Hunter's fight.

**3.2 The auditions** (pp. 87 to 94)
Setting: the Fish and Meat Hall, sawdust; Door and the marquis on the smoked-salmon counter.
Clip: 3P. Bodyguards fight by Knack; a thrown Ruislip lands on Richard. Door, furious: what is he doing here? The leather woman puts Varney down with his own knife: "I'm called Hunter." The Hunter? "I'm back." A Black Friar tolls the closing bell.
DECISION (Door: "Why did you have to come here?"):
- A. **"I didn't really have much choice."** (canon) → 0.
- B. **"I came to find you."** → DOOR_BOND +1.
- C. **"You knew this would happen to me."** → DOOR_BOND -1.

**3.3 Left in the sewer** (pp. 94 to 96)
Clip: 3P. The marquis explains the two Londons: Richard has fallen through the cracks. "Good night." Richard follows down the ladder. "Go away." "No." They leave him.
DECISION:
- A. **Sit down where you are.** (canon) → he cries for the first time since his father died.
- B. **Follow at a distance.** → LOYALTY +1, MARQUIS_TRUST -1.
**C5** (pp. 96 to 98): Varney flees down 259 spiral stairs; Vandemar waits at the bottom paring his nails with Varney's machete; Croup falls on him (cut on impact; a stain). In a tunnel, Door stops: we can't leave him. The marquis: of course we can; we did. Door: "You are working for me, aren't you?"

**3.4 "Are you coming?"** (pp. 98 to 100)
Setting: a ledge above a storm drain.
Clip: 3P, then POV as her lamp finds him. She says sorry, and means it.
DECISION (conversation window, Door):
- A. **"I don't have anywhere else to be. Why not?"** (canon) → DOOR_BOND +1. She hugs him and promises to try to get him home. `DOOR_PROMISE`.
- B. **"Only if you get me home."** → `DOOR_PROMISE`; she promises, carefully.
- C. **"No."** → she sits beside him in silence, then asks again (a beat, not a route).
They are looking for an angel named Islington. Richard laughs until it echoes.
**C6** (p. 100): a rock hall, iron pillars, a waterfall, a black door of flint and silver. Candles light as a barefoot figure in white passes and go out behind it. No wings, but unmistakably an angel.

---

### Episode 4: Earl's Court (ch. 6 to 8)

**4.1 No such things as angels** (ch. 6, pp. 101 to 105)
Clip: 3P, Richard's "Dear Diary" as inner voice. Hunter: there are shepherds in Shepherd's Bush; pray you never meet them. In the Bank tunnel the busker Lear can see them; the marquis plays a reel that empties passers-by's pockets onto his coat, in exchange for a train schedule. He taps Angel on the Tube map: Islington.
DECISION (light trait): **"There are no such things as angels."** (canon; FAITH -1) / **"All right. Show me one."** (FAITH +1).

**4.2 Mind the Gap** (ch. 6, pp. 105 to 107)
Clip: POV on a Central Line platform. Interactive beat: **step back when Hunter warns** (no welts) / **look at her, puzzled** (canon): black smoke wells over the edge and wraps his ankle; Hunter beats it off; his jeans bleach where it touched; purple welts. Door holds his hand while he shakes (DOOR_BOND +1 either way).
**C7** (pp. 107 to 109): the hospital courtyard of junk and frogs. The employer orders them to scare her, not kill her. "Scarecrows." Crows overhead: a murder.

**4.3 The court on the train** (ch. 6 to 7, pp. 110 to 118)
Setting: a dark, empty-looking carriage that inside is a medieval court: straw, chickens, a log fire, a wolfhound, old men-at-arms in knitted chain mail.
Clip: 3P. The huge one-eyed earl in dressing gown and slippers; his jester Tooley calls Richard a mooncalf and goes quiet when Hunter invites him to be funny. The earl recognises the marquis (the White City retreat, his eye) and orders him seized.
DECISION (conversation window, the earl):
- A. **Let Door handle it.** (canon) → she calls violence against her companion an attack on her house; the marquis leaves at the next station.
- B. **Speak up for the marquis.** → LOYALTY +1, MARQUIS_TRUST +1.
- C. **"He does seem a bit dodgy."** → MARQUIS_TRUST -2, DOOR_BOND -1.
A man-at-arms knocks on a vending machine and it pours out chocolate. Tooley's toast: a child, a bravo, a fool (Richard is the fool).
**C8** (pp. 118 to 119): Lear mobbed by blank-eyed people forcing money on him. The marquis plays the counter-charm and calls in a theft: a piece of T'ang sculpture.

**4.4 The library of lost things** (ch. 7, pp. 119 to 122)
Setting: behind the throne, a stone library of lost property (dentures, gnomes, umbrellas, a wooden leg), Tube tunnels rushing past the windows.
Clip: 3P. The quick way to Islington works once, for an opener; after that, the long way down. **Tone note:** the book's leer at Door is played as confused courtliness she gently corrects, or cut.
DECISION: **let Door ask again** (canon) / **"Your Grace, the Angel Islington?"** (LOYALTY +1, DOOR_BOND +1). She gets the scroll: use the Angelus. They are dropped at BRITISH MUSEUM. There isn't one, says Richard. Then be very careful getting off, says the delighted earl.
**C9** (ch. 8, pp. 123 to 126): Old Bailey's roof facing St Paul's. He names the obsidian figure: the Great Beast of London, a butcher's animal that escaped into the Fleet Ditch in King Charles's day and grew. The marquis drops off the roof: keep the box, the rats will tell you what to do with it.

---

### Episode 5: Angels over England (ch. 8 to 10)

**5.1 British Museum Station** (ch. 8, pp. 126 to 129)
Clip: 3P. A sealed station, 1930s posters for malted drinks. A rat, Miss Whiskers. Door opens an iron door ("We're openers"). Hunter will not climb: she guards Door Below and cannot go Above. A curse, she admits, like an embarrassing illness.
DECISION 1 (micro): **ask Miss Whiskers about Anaesthesia** (canon; `ANA_ASKED` +1, LOYALTY +1: taken as tribute; sometimes they come back) / say nothing.
DECISION 2 (to Hunter): **"Don't be silly."** (canon) / **"Then wait. We'll come back for you."** (LOYALTY +1) / **"What happens to you up there?"** (`HUNTER_SUSPECT` +1).

**5.2 The storeroom** (ch. 8, pp. 129 to 133)
Clip: 3P. Croup and Vandemar on plinths among museum junk. To Door: a traitor in your nest, a cuckoo. They run; behind them, cuckoo calls and a wolf's howl.
DECISION 1 (conversation window, Croup and Vandemar):
- A. **"If you want to hurt her, you'll have to kill me first."** (canon) → LOYALTY +2, DOOR_BOND +1. Vandemar, pleased: "All right. Thanks."
- B. **Grab her hand and run.** → 0.
- If `TOLD_CV`: Croup thanks Mister Mayhew for his help in front of Door → DOOR_BOND -2.
DECISION 2 (outside: "A traitor?"): **the marquis** (MARQUIS_TRUST -1; the misdirection the book intends) / **Hunter** (`HUNTER_SUSPECT` +1) / **"They're winding us up"** (canon, Door's answer).

**5.3 Angels over England** (ch. 9, pp. 134 to 143)
Setting: the exhibition launch: string quartet, champagne, a room crowded with angels, Jessica in green silk running the night.
Clip: 3P. Jessica half-recognises Richard. **Tone note:** replace the book's real celebrities with unnamed guests.
DECISION (conversation window, Jessica): **tell her who you were, gently** / **tell her cheekily: her birthday, the song she hums** (canon) / **say nothing and walk away**. A or B: she sends for security. C: no security, and Door need not scream in 5.4.

**5.4 The Angelus** (ch. 9, pp. 143 to 146)
Clip: 3P. Mr Stockton pulls the cord; a cathedral door carved with a staring medieval angel. Guards grip Richard. Door screams into the microphone like a power drill. "Wrong London." Her hand on the door; light like fireworks; they walk into it, and the room agrees it never happened.
DECISION (if held): **tear free** (canon) / **"Go without me!"** (DOOR_BOND +1, LOYALTY +1; she screams anyway).

**5.5 The Angel Islington** (ch. 9 to 10, pp. 146 to 151)
Clip: 3P, POV for the decision. The rock hall from C6. Islington, neither man nor woman, golden hair, eyes of old grey light, pours wine from Atlantis like a sacrament: "To former glories." London Below is the second city it has cared for; the first sank. It gives Door a black Beast statuette to bring her safely back, and asks for the key the Black Friars keep.
DECISION (conversation window, Islington: "And you? What do you want, Richard Mayhew?"):
- A. **"My life back. My flat. My job."** (canon) → `ISLINGTON_BARGAIN=self`. "That can happen."
- B. **"Help Door. That's all."** → LOYALTY +2. `=door`.
- C. **"Why does an angel live under London?"** → `=atlantis`. It tells of the waves.
If he says he believes in it: FAITH +1.

**5.6 The steps** (ch. 10, pp. 151 to 157)
Clip: 3P. Drunk on Atlantean wine, Richard dances down the museum steps like Fred Astaire; Door giggles, joins in, dances better; they tumble at the bottom laughing. Hunter, at the station: they are very drunk.
DECISION: **dance** (canon; DOOR_BOND +1) / walk down with dignity. **Tone note:** the book's wondering about a kiss is dropped; the moment stays a laugh between friends.
**C10** (pp. 147 to 158): the marquis waits in the killers' cellar, holds a stolen T'ang figurine under a hammer and trades three questions each. Why not kill Door? Vandemar: she's the only one who can open the door. Why protect her? Her father saved his life. Croup eats the figurine with joy. Under Marble Arch, Vandemar is already waiting on the steps. A knife hilt to the temple.

---

### Episode 6: The Ordeal of the Key (ch. 10 to 12)

**6.1 Serpentine's house** (ch. 10, pp. 158 to 167)
Setting: stables marked with an S and seven stars; a tiny Tube platform laid for breakfast, trains feet away.
Clip: opens on **three dreams** (3P): Hunter dancing with the Great Weasel under Bangkok; Door's father teaching her to open a padlock ("all things want to open") and her question, who hid the journal?; Richard's Beast, bigger, weapons bristling. Door is terrified: Serpentine of the Seven Sisters, towering in a white corset and a shredded wedding dress; Hunter once worked for her. To Hunter: "You're Beast-hunting then? You'll need the spear, of course." To Door: your hero. "He's not my hero." "I'm afraid he is."
DECISIONS: **ask Hunter what she meant by the spear** (`HUNTER_SUSPECT` +1; "Eat your breakfast.") / let it pass (canon). And **take Door's trembling hand under the table** (DOOR_BOND +1) / don't.
**C11** (pp. 165 to 166): on Old Bailey's roof the silver box starts to pulse red like a heartbeat. "He's in trouble."

**6.2 The river and the fog** (ch. 11, pp. 168 to 170)
Clip: 3P. A slippery bank, a black lake, then a yellow pea-souper. Asked what she is after, Hunter speaks over mist that seems to hold shapes: the blind white alligator king under New York, the talking bear under Berlin, the black tiger under Calcutta, and the Beast of London, which she will kill or die trying.
DECISION (conversation window, Hunter):
- A. **Say nothing.** (canon)
- B. **"What would you give for your chance at it?"** → `HUNTER_SUSPECT` +1. She stops talking for a mile.
- C. **"I dream about it."** → `BEAST_SHARED`. Hunter: then perhaps it dreams of you.

**6.3 The bridge of the Black Friars** (ch. 11, pp. 170 to 174)
Clip: 3P. Fog over a marsh; friars in black Dominican robes with crossbows. Brother Sable pushes Richard into the mud; Hunter beats Sable at quarterstaff. Door answers Brother Fuliginous's riddle: a key. The blind abbot: the last test falls to the one who neither fought nor answered.
DECISION (conversation window, the abbot):
- A. **"How much of an ordeal is it?" and go.** (canon) → COURAGE +1, LOYALTY +1.
- B. **"It's for an angel. Couldn't you just hand it over?"** (canon line) → unmoved; then A.
- C. **Ask Door: "Do you want me to?"** → no. "Then I'll do it for you." LOYALTY +2, DOOR_BOND +1.

**6.4 The wall of those who failed** (ch. 11, pp. 174 to 178)
Clip: 3P. A Polaroid flash; a wall of faces going back through daguerreotypes to watercolours. The first part of the Ordeal is a nice cup of tea, an ordeal for them, not him. "Lead on, Macduff." When he's gone, the abbot says it's "lay on", but hadn't the heart to correct him. *(Optional talk with the abbot; no decision.)*
**C12** (pp. 174 to 177): on the bridge Hunter calculates angles. Door remembers being five in Kew's butterfly house: her father pointing out a man in a big coat, a fraud and possibly a monster; if you're ever in trouble, go to him; he has to protect you. The marquis winked. Then: the marquis nailed to an X of pallets in the hospital canteen, spitting blood at Vandemar (aftermath only).

**6.5 The Ordeal** (ch. 12, pp. 179 to 187)
Setting: an empty, dim Blackfriars platform that flashes into real rush hour.
Clip: POV, heaviest shake in the book.  Gary sits down: "I'm not really here. I'm you," and his face runs like putty into Richard's own. Flash: in a train window Richard sees himself as a mad street sleeper. Jessica (also him) cries that he had a breakdown and has been wandering. His old desk troll is kicked onto the track; the posters change. **Tone note:** the book's posters and its train of the dead are explicitly about suicide. Here the posters read **GIVE UP. YOU WERE NEVER THERE.**, the pull is to climb down after the troll, and the train carries **the lost** from the wall of faces. The horror of being told you're mad, and half believing it, stays full strength.
DECISION (conversation window, "the other Richard"; the anchor depends on state):
- **Anchor:** his hand finds the bead and he hears Anaesthesia: "Richard. Hold on." (canon; `BEAD_KEPT` or the Coraline echo). Without it: Door's "Are you coming?" if LOYALTY ≥ 5 ◆; Hunter's "Mind the gap" if he heeded her in 4.2 ◆; the old woman's "You've a good heart" if `UMBRELLA_GIVEN` ◆. With no anchor, only A and B are offered, unsigned.
- A. **Hold on; step onto the train when the doors open.** (canon) → 6.6.
- B. **Climb down for the troll.** → **ENDING E.**
- C. **Wait to be told what to do.** → Gary mocks him; back to the choice.

**6.6 The key** (ch. 12, pp. 186 to 188)
Clip: 3P. A small shrine, a silver key turning on a thread. The abbot comes for a body. He's not dead. One of those, then, a poor creature. Richard stands: "I am not a poor creature." Hunter sees he has begun to grow up. Behind them: we have lost the key; God help us all.
DECISION:
- A. **Toss it to Door.** (canon) → LOYALTY +1, DOOR_BOND +1.
- B. **Keep it. It's your ticket home.** → LOYALTY -2, DOOR_BOND -1. `KEY_TAKEN`.

---

### Episode 7: Down Street (ch. 13 to 15)

**7.1 The painted caves** (ch. 13, pp. 192 to 196)
Clip: 3P. Ochre paintings of mammoths, then lorries and cats. Door ties the key on string (or asks to see it, if `KEY_TAKEN`). Hunter lifts a boy painter's switchblade; the next market is Belfast, tonight. A woman in black velvet asks the same and looks at Richard as she says she'll see him there (if `LAMIA_NOTICED`; otherwise at Door). A fresh, unflattering painting of the three of them.
DECISION (will the marquis be there?): **"Like a bad penny."** (MARQUIS_TRUST +1) / **"He's probably sold us out."** (MARQUIS_TRUST -1; Door: he won't let us down).
**C13** (pp. 190 to 208): Vandemar wheels the marquis's body through the drains in a squeaking supermarket trolley and tips it into the sewer. Old Bailey buys it for a bottle of Chanel No. 5 and drags it on a pram base to the top of the London Wall. In the silver box, a duck's egg; he smashes it with a toasting fork. The marquis coughs up sewer water: "I think my throat's been cut." Being dead is very dark and very cold. He owes Old Bailey a favour. (If `OLD_BAILEY_FRIEND`, Old Bailey mutters about the lad with the little flag.)

**7.2 HMS Belfast** (ch. 14, pp. 200 to 209)
Clip: 3P. A warship deck crowded with stalls. Hammersmith, a bearded mountain, hammers a black rose and lifts Door onto his booth; he blushes for Hunter. Door sends Richard and Hunter for curry. Behind them, Door asks Hammersmith for a chain and his discretion.
DECISION (only if `KEY_TAKEN`; Door: "Can I have the key? I want a chain for it."):
- A. **Give it to her.** → LOYALTY +2, DOOR_BOND +1. The copy is made.
- B. **"I'll keep it, thanks."** → LOYALTY -2. `NO_COPY`.

**7.3 Curry and Lamia** (ch. 14, pp. 204 to 211)
Clip: 3P. The pale woman: "I do not eat... curry," and laughs; he realises how long since he shared a joke. Lamia, a Velvet, a guide. Hunter: "He's not yours." Door hugs Richard (canon: slipping the real key into his pocket, unseen; revealed in 8.5). Lamia knows the way: Down Street. Door: we can't afford a guide. Lamia: she'll take payment from him.
DECISION (conversation window, Lamia, then Door):
- A. **"You just don't like me figuring things out."** (canon) → LOYALTY -1. `LAMIA_GUIDE`.
- B. **"It's Door's call."** → DOOR_BOND +1. Lamia follows anyway, for free.
By the time the marquis reaches the market, they are gone.

**7.4 The Royal Society for the Prevention of Cruelty to Houses** (ch. 15, pp. 212 to 216)
Clip: 3P. A brass plate (DOWN STREET. PLEASE KNOCK.), a sleepy footman, four flights of ever-shabbier stairs, an OUT OF ORDER lift. Below: an inside-out Tower of Babel, a spiral road down a bottomless well, a plank to reach it. POV on the plank; someone calls the lift back up and the door slams behind him. He freezes on hands and knees.
DECISION (POV): **let Hunter talk you across** (canon: she strokes his white knuckles, talks him on inch by inch, lifts him onto rock; he thanks her twice and laughs till he cries: "Safe.") / **shut your eyes and crawl alone** (COURAGE +1; she still lifts him off).

**7.5 The kiss of the Velvet** (ch. 15, pp. 216 to 219)
Clip: 3P. Lamia: let them go ahead. His breath steams; hers doesn't. Would he give her some of his heat, as payment?
DECISION (conversation window, Lamia; most persuasive if `LAMIA_GUIDE`):
- A. **Yes.** (canon) → the cold kiss; frost over his skin, eyes frozen open. A hand closes on her neck: the marquis, barefoot, in a blanket, a filthy cloth round his throat: give him back his life. She breathes it back and spits ice in his face. MARQUIS_TRUST +2.
- B. **No.** → she tries anyway; he pulls back; the marquis arrives. MARQUIS_TRUST +1, COURAGE +1.
**Tone note:** a vampire beat, cold and deadly, not a sexual one. Why did people think the marquis dead? "Because they killed me." Across the well, two figures in shadow: a trap. POV sprint down the spiral.

**7.6 Hunter's choice** (ch. 15, pp. 219 to 223)
Clip: 3P. Croup and Vandemar step out and bind Door. Richard shouts for Hunter. (If `HUNTER_SUSPECT` ≥ 2, first: **D. "Door! Hunter's with them!"** → DOOR_BOND +1.) Hunter's kick, balletic, into his stomach. "I'm afraid so. No hard feelings." Croup asks who has the key.
DECISION 1 (conversation window, Croup and Vandemar):
- A. **"I do. Search me."** with his old front-door key. (canon) → LOYALTY +2. Vandemar crushes it like foil and lectures on where to kick (knee, shoulder, ribs: visible in Ep 8).
- B. **Say nothing.** → Door answers; he is kicked anyway, less.
- C. **"She has it."** → LOYALTY -4, DOOR_BOND -2.
Croup takes the Beast token from Door and tosses Hunter her payment: a bronze spear with faces carved on the haft. She loves it on sight. The marquis with a crossbow: "Tell him, Hunter." "Islington."
DECISION 2: **"Who's behind this?"** (canon) / **"Kill her."** (MERCY -1; the marquis: death is so final) / **"Bring her."** (MERCY +1). He brings her either way.

---

### Episode 8: The Beast, the angel, and the door (ch. 16 to 20)

**8.1 The giants' gate** (ch. 16, pp. 224 to 229)
Setting: a Cyclopean gate; beyond, a labyrinth of lanes from every century that fell through the cracks; the Fleet Marsh, mosquitoes, old corpses.
Clip: 3P. When angels go bad, they go worse than anyone; Lucifer was an angel. A far bellow. The marquis: wait here if you like. Then he shows his own token.
DECISION 1: **"I'm not turning back. They've got Door."** (canon; LOYALTY +2) / **"I'll wait here."** (LOYALTY -2; alone, he hears Door's distant shout "Hey! Beast! Here!" and runs after them).
DECISION 2 (Hunter: "And I saved your life. Many times."): **look away** (canon) / **"I know. That's why it hurts."** (MERCY +1).
In the marsh the marquis steps on a rib cage; the token flies into the mud; Richard sees it glint, and a bubble of gas swallows it. "Too late."
**C14** (pp. 226 to 230): Door marched through the labyrinth. "You're afraid, aren't you?" She shouts for the Beast; Vandemar gags her with a dead snuff dealer's handkerchief. An oak door with an oval mirror; the angel's face in it: enter.

**8.2 The Beast** (ch. 16, pp. 229 to 233)
Clip: 3P by flare light. It comes so slowly he thinks it sick, until he sees the ground it covers; broken spears bristle from its hide. She is a fraction late; the tusk opens her side. Broken, she asks if he has ever used a spear: hold it at the blunt end. "I knew that part." "I know." She did a bad thing, and now makes amends. She hauls herself up, hums until the labyrinth rings, and calls it out. POV: the framing of the 1.3 dream, but the hand on the spear is his own.
DECISION (Hunter: "Now, Richard. Strike! Under and up!"):
- A. **Strike under and up.** (canon) → `WARRIOR`.
- B. **Throw the spear, as in the dream.** (removed if `BEAST_SHARED`: Hunter shouts "Not like your dream!") → the throw glances off and the dream nearly comes true; Hunter, dying, drives her knife into its eye ◆. Beast dead, `WARRIOR` off, a cracked rib.
- C. **Drop the spear and drag Hunter clear.** → LOYALTY +2, MERCY +1. The Beast thunders off wounded. `LATE`.

**8.3 Hunter's last words** (ch. 16, pp. 232 to 235)
Clip: 3P close. Blind now, she laughs: he's the greatest hunter in London Below, the Warrior (if `WARRIOR`; else "My last kill. Not bad.").
DECISION 1 ("Take the knife. She's yours."): **take it** (canon; `KNIFE`; clean her blood off, a hunter looks after her weapons) / **refuse twice** (`KNIFE` off: **Ending A impossible**).
DECISION 2: **"I forgive you."** (`HUNTER_FORGIVEN`, MERCY +1, LOYALTY +1) / **hold her hand in silence** (canon).
DECISION 3 ("Touch the Beast's blood to your eyes and tongue." The marquis: do it.): **do it** (canon: it tastes like an ocean; he runs straight through the labyrinth with the epigraph's dirge in his head, "fire and fleet and candlelight") / **refuse** (`LATE`).
The marquis closes her eyes: we'll come back for the body later.

**8.4 The angel's hall** (ch. 17, pp. 236 to 246)
Setting: the iron pillars, the table, the candles, the black flint door; Door chained spread-eagled, a bruise on her cheek.
Clip: 3P, POV at decisions. "Come in, Richard Mayhew. You do look a mess." Hunter? Dead. "The poor dear." Vandemar breaks Richard's little finger. Croup brings in the marquis (you told me he was dead; he was). The mask slips. **Held-back flashback:** Atlantis drowning, four million voices; Islington waking and calling Croup through the rock pool: keep the girl safe; the marquis no longer matters. In the hall it screams "They deserved it," then, mildly: just one of those things. Vandemar recites Portico's real words in his voice: Door, child, fear Islington. A blade under Richard's ear. Cross-book echo: if Sandman 2.5 was played, when Islington calls Lucifer an idiot Richard can reply **"I've met better angels than you. Worse ones too."** (counts as the goad below).
DECISION 1 (if `ISLINGTON_BARGAIN=self`; ◆ "Tell her to open it, and I keep my word: your life back."):
- A. **"Don't do it, Door. We don't matter."** (canon line) → LOYALTY +3.
- B. **"Door, please. Do it."** → LOYALTY -4, DOOR_BOND -2.
(If `=door`: "You asked nothing for yourself. Then your pain is your gift to her." Only A. If `=atlantis`: A, plus "You sank a city and called it unfortunate.")
Door: stop them, I'll open it. Her palm on the flint until a keyhole appears.
DECISION 2 (with the marquis, to the killers): **"You don't think you'll ever see him again?"** (canon: they go to collect, in full, with interest and meat hooks; "Jam tomorrow") / stay silent.
**Copy path (the book):** the door opens on churning orange and purple; candles, then the table, fly into it: gravity, not wind. "That's not Heaven. What have you done?" It was Hammersmith's copy; she opened a door as far and hard away as she could. Islington offers news of her living sister, and falls. Croup, climbing Vandemar's back, boasts he killed her family; the suit tears and he falls; Vandemar: "Bye-bye," and lets go. The door slams. Darkness. Door frees them; Richard holds her; the marquis, afraid of sleep now, sleeps last.
**`NO_COPY` path:** the real key opens on quiet gold light; Islington steps forward. If Decision 2 was the goad (or the Sandman echo fired), LOYALTY ≥ 4 and DOOR_BOND ≥ 3: the killers seize its robe for their pay and Richard shouts **"Door, shut it!"** She slams the true door on the struggle; Islington stays imprisoned; Croup and Vandemar walk out unpaid (`CV_LOOSE`) → 8.5. Otherwise Islington walks into the light: **ENDING D.**
**`LATE` variant:** they reach a dark, silent hall: Door alone, one wrist chained, a candle; it is done, without them. DOOR_BOND -1. With `NO_COPY` and `LATE`, they arrive as she turns the real key under the knife: **ENDING D.**

**8.5 The friars' table** (ch. 19, pp. 248 to 252)
Clip: 3P. Richard wakes in a grey robe, finger splinted, ear stitched. Door in a robe far too big, reading *Mansfield Park*; the marquis wheeled in like a swashbuckler. Hunter? There was no body, only the Beast. She slipped the key into his pocket at the market. The abbot, holding the Warrior's filthy trousers: you are all very stupid people. The key is the key to all reality; Richard is its master until he returns it; it will take him home.
DECISION (conversation window, the abbot, Door, the marquis): **"When could we do this?"** (canon) / **"Not yet. What happens to London Below?"** (LOYALTY +1) / **give the key back: "I'm staying."** (LOYALTY +3, `KEY_RETURNED` → 8.7 with option B unlocked).

**8.6 Nightingale Lane** (ch. 19, pp. 252 to 256)
Clip: 3P. A ghost station reached from the friars' bell tower. Old Bailey waves Richard's handkerchief on a stick ("me little flag", if `OLD_BAILEY_FRIEND`) and gives him a black feather bound with red thread. The earl's train, a ragged fanfare: "Thought you'd be taller." Knighted with Hunter's knife: Sir Richard of Maybury, the freedom of the Underside (without `WARRIOR`, Tooley: "the one who was with the Hunter"; without `KNIFE`, Tooley's bauble). At a gloaming terminus the Lord Rat-speaker returns the bag: no hard feelings about Anaesthesia; the rats are your friends. In an underpass Lamia blows a kiss. Cross-book echo: if Sandman `MATTHEW_RAVEN`, the feather came from a talking bird who works for a lord who dreams.
DECISION: **walk off without a word** (canon) / **"Did she ever come back?"** (`ANA_ASKED` +1, LOYALTY +1; "Sometimes they do.") / **"Thank you."**

**8.7 The island of Westminster** (ch. 19, pp. 256 to 258)
Clip: 3P. A frosted hill between three rivers at dawn: London three thousand years ago. Door in new brocade under the old jacket. There's sorting out to do and only her to do it; her sister may be alive. "Please don't go."
DECISION (conversation window, Door):
- A. **"I have to go home."** (canon) → she turns the key in the air: just walk, don't look back. He looks back; her cheeks are wet. → 8.8.
- B. **"I'll stay."** (LOYALTY ≥ 8 and DOOR_BOND ≥ 4, or `KEY_RETURNED`) → **ENDING B.**
- C. **Take the key and turn it yourself** (if `KEY_TAKEN`). → LOYALTY -2, DOOR_BOND -2. "Then go." A-var impossible.
**Relic:** the abbot made Richard the key's master; whoever turns it, he finds it in his back pocket in London Above, beside the bead ◆. Earned in Endings A, A-var, B and C.

**8.8 London Above** (ch. 20, pp. 259 to 266)
Clip: 3P montage, reflection now in step. A sticky child says this man is bothering her: Richard grins and runs through the pigeons. The cash machine works; a taxi stops; R. B. MAYHEW, JUNIOR PARTNER on a door; the penthouse, packing cases never unpacked, Hunter's knife on the mantelpiece. Nights at the dark window. Then Jessica with the ring: perhaps one day he'd give it back.
DECISION: **"You keep it. I'm sorry. I've just changed."** (canon) / **take the ring** (`ABOVE_ANCHOR`: Ending A needs LOYALTY ≥ 6). Micro: **talk to the rat** (canon; LOYALTY +1) / walk on.

**8.9 "Are you coming?"** (ch. 20, pp. 267 to 273)
Clip: 3P. A Friday night out and the new girl from Computer Services. Richard sees the rest of his life: wedding, two children, Croydon. Not a bad life. Gary finds him outside; in a greasy spoon Richard tells him everything. Gary: the people who fall through the cracks freeze in doorways on the Strand; get used to it. Richard gives ten pounds to an old woman asleep in a doorway, a dirty once-white umbrella tied to her wrist (faded Tube lines visible if `UMBRELLA_GIVEN` ◆). If this is all there is, he doesn't want to be sane.
DECISION 1 (earlier, Windmill Street): **drop the feather in the gutter** (canon; later it is gone) / **keep it** (`KEPT_FEATHER`).
DECISION 2 (conversation window: Gary in the café; then alone at the wall):
- A. **Cut a door in the brick with Hunter's knife: one across, two down. Hammer on it.** (canon; needs `KNIFE`) → LOYALTY ≥ 4 (≥ 6 with `ABOVE_ANCHOR`) and MARQUIS_TRUST ≥ 2: **ENDING A.** LOYALTY enough, MARQUIS_TRUST < 2, DOOR_BOND ≥ 4: **ENDING A-var.** LOYALTY too low: nothing opens; dawn on the pavement: **ENDING C.**
- B. **Take the next taxi home.** → **ENDING C.**

---

## 4. Endings

| ID | Name | Requirement | What the player sees |
|---|---|---|---|
| **A** | *Are you coming?* (canon) | `KNIFE`; 8.7A; 8.9A; LOYALTY ≥ 4 (≥ 6 with `ABOVE_ANCHOR`); MARQUIS_TRUST ≥ 2 | The outline becomes a hole in the wall. The marquis, arms folded, yawns: "Well? Are you coming?" They walk through, leaving not even the doorway. |
| **A-var** | *The opener* ◆ | As A, but MARQUIS_TRUST < 2 and DOOR_BOND ≥ 4 | The bricks swing open from the other side: Door, chin up, asks the same question. The marquis lurks behind her. |
| **B** | *Sir Richard of the Underside* | 8.7B, or `KEY_RETURNED` | Richard never goes up. The next Floating Market: Richard helping Door broker peace between baronies; Old Bailey waving his little flag; a rat-speaker girl at the edge of the crowd who might be Anaesthesia ◆. If `HUNTER_FORGIVEN`, her name carved on the giants' gate. |
| **C** | *Get used to it* | 8.9B; or 8.9A with LOYALTY too low; or no `KNIFE` | The penthouse; the cases unpacked at last, the girl from Computer Services helping; the knife in a drawer. Lucienne: "It is not a bad life. It is just not his." |
| **D** | *Jam tomorrow* | `NO_COPY` and the 8.4 save fails, or `NO_COPY` with `LATE` | The angel walks into true light, promising to reward the worthy and cast down the hateful. The abbot: we have lost the key; God help us all. In Lucienne's library a locked door shivers. "Return to the last choice." |
| **E** | *The wall of those who failed* (premature) | 6.5B | A poor creature lifted from the shrine floor; a new Polaroid on the wall; Door and Hunter led away through the fog. "Return to the last choice." |

---

## 5. Consequence web

| Early choice | Echo |
|---|---|
| 1.1 `UMBRELLA_GIVEN` | An anchor in 6.5; the umbrella in the Soho doorway (8.9). |
| 1.4 / 2.2 `TOLD_CV` | Croup thanks Richard in front of Door (5.2): DOOR_BOND -2. |
| 2.5 `ANA_HEARD`; 5.1 / 8.6 `ANA_ASKED` | The weight of her voice in 6.5; the girl in Ending B's crowd. |
| 2.6 `BEAD_KEPT` (or sold, 3.1) | The canonical anchor in 6.5. Going back for her (2.6B) costs the bead but earns LOYALTY. |
| 3.1 `OLD_BAILEY_FRIEND` | "Me little flag" at Nightingale Lane; his mutter over the body (C13). |
| 3.1 `LAMIA_NOTICED`; 7.3 `LAMIA_GUIDE` | Whom the Velvet seeks in 7.1; how hard she presses in 7.5. |
| 4.3, 5.2, 7.1, 7.5 MARQUIS_TRUST | Who answers the knife-cut door (A vs A-var). |
| 5.1, 5.2, 6.1, 6.2 `HUNTER_SUSPECT` | At 2, the warning option in 7.6. |
| 5.5 `ISLINGTON_BARGAIN` | Temptation (self), contempt (door), or retort (atlantis) in 8.4. |
| 6.2 `BEAST_SHARED` | Removes the dream-trap in 8.2. |
| 6.6 `KEY_TAKEN` → 7.2 `NO_COPY` | **Master switch** for Ending D and the save path in 8.4; option C on the hill. |
| 8.2C / 8.3 `LATE` | The empty-hall variant; with `NO_COPY`, Ending D. |
| 8.3 `KNIFE` | **Master switch** for Ending A. |
| **Cross-book, from the series bible** | |
| Sandman `ALEX_CURSED` | 1.4: Vandemar has heard of a man who dreams of waking. |
| Neverwhere done, LOYALTY ≥ 4 | Sandman 5.3, Hob 1889: stay for one more drink. |
| Holding the Angel's key | Coraline's door home: the key rattles in the lock and does not fit. |
| All four relics | The Fifth Door: Richard arrives as a dreamer and asks the player about one choice here (default: whether she cut the door). |
| **Cross-book, proposed** | |
| Sandman 2.5 played (any Lucifer outcome) | 8.4: Richard answers Islington's sneer about Lucifer; counts as the goad for the `NO_COPY` save. |
| Sandman `MATTHEW_RAVEN` | 8.6: the feather came from a talking bird who serves a lord who dreams; in the Fifth Door, Matthew knows Richard. |
| Coraline done, COURAGE ≥ 4 | 2.6 option D: talk to Anaesthesia in the dark; she anchors 6.5 without the bead. |

---

## 6. Conversation windows

Per `ai-dialogue-design.md` §3. The inner voice (§2.2) is Richard's mental "Dear Diary", dry and self-mocking, colder at low LOYALTY. Guardrails for this book: Islington never hints at the twist before 8.4; Croup speaks in elaborate synonyms, Vandemar in short flat literal sentences; the marquis never answers a question directly; Hunter never lies, she withholds.

| Scene | Character(s) | The player might try | Authored exits |
|---|---|---|---|
| 1.0 | Lucienne | Ask what lies behind the door | None (hub). She says only that it starts with doors. |
| 1.3 | Door | Ask who she is, insist, joke | A help / B doctor and police / C humour |
| 1.4 | Croup and Vandemar | Lie, bluster, stall, betray | A lie / B police / C give her away |
| 1.6 | The marquis | Negotiate, ask questions (forbidden), bluff | A big favour / B "so will I" / C bluff |
| 2.2 | Croup (phone) | Defy, beg, bargain, threaten | A don't know / B offer to help them / C police |
| 2.4 | Lord Rat-speaker (Master Longtail) | Reason, plead, greet the rat, fight | A "Hello, Ratty" / B kneel / C grab the knife |
| 2.5 | Anaesthesia | Ask about her, talk about himself, promise | A listen / B himself / C promise |
| 3.4 | Door | Sulk, blame, forgive, bargain | A "Why not?" / B only if you get me home / C no (loops) |
| 4.3 | The earl, Tooley | Defend the marquis, agree, banter | A let Door / B defend / C "dodgy" |
| 5.2 | Croup and Vandemar | Stand in front, run, ask about the traitor | A "kill me first" / B run |
| 5.3 | Jessica | Remind her, tease, apologise, say goodbye | A gentle / B cheeky / C silent |
| 5.5 | The Angel Islington | Ask for his life, for Door, about Atlantis | A life / B Door / C Atlantis |
| 6.2 | Hunter | Admire, probe her price, share the dream | A admire / B probe / C dream |
| 6.3 | The abbot | Bargain, plead the angel, volunteer, ask Door | A accept / B bargain then accept / C ask Door |
| 6.5 | "The other Richard" (Gary, Jessica, himself) | Argue, agree he is mad, name his friends | A hold on and board / B the troll (Ending E) / C wait (loops) |
| 7.3 | Lamia, then Door | Hire her, defer to Door, ask her price, flirt | A insist / B Door's call |
| 7.5 | Lamia | Give warmth, refuse, call for help, ask what she is | A yes / B no |
| 7.6 | Croup and Vandemar (Hunter) | Decoy, silence, give Door up, warn | A decoy / B silence / C "she has it" / D warn (if unlocked) |
| 8.4 | Islington (Croup, Vandemar) | Defy, plead, goad the killers, mock it | 1A "We don't matter" / 1B "Do it" / 2A goad / 2B silent |
| 8.5 | Abbot, Door, the marquis | Ask to go home, ask about London Below, return the key | A go / B not yet / C give back the key |
| 8.7 | Door | Say goodbye, stay, ask her up, ask about her sister | A go / B stay / C turn it yourself |
| 8.9 | Gary | Tell the story, ask if he believes it | None; colours Gary's last line. Exits are taken alone at the wall (A cut / B taxi). |

---

## 7. Cast

Description paragraphs in the register of `character-prompts.md` §3 (add the Reference sheet frame and Style Bible for full prompts). ◆ marks details the novel does not give.

**Richard Mayhew (canon look, for reference).** A Scottish man in his late twenties, slim, slightly round-shouldered from desk work. Fresh-faced and boyish, dark slightly curly hair that never lies flat, large hazel eyes, a rumpled just-woken look more attractive than he would believe. Starts in a good dark suit Jessica chose; then jeans, sneakers, a thick sweater, a black sports bag
*Surreal detail:* in London Above his reflection in glass lags half a beat behind him.

**The hero as played by your wife.** Method of `character-prompts.md` §3.1: her own face exactly, made beautiful by light and styling, never reshaped. The reference sheet needs three outfits: the dinner suit, the jeans and sweater (clean and ruined), the grey friar's robe.
*Surreal detail:* a quartz bead in her pocket catches a light that is not in the scene.

**Door.** A small, slight young woman (age unclear in the book; cast clearly adult, about twenty ◆), with a pale, heart-shaped elfin face and pointed chin. Short dark auburn hair with copper and bronze lights, filthy and tangled at first. Eyes like fire opals, flickering green, blue, red and gold as she moves. Layers of ripped and patched velvet, lace, taffeta, silk and brocade under an enormous brown leather flying jacket that makes her look smaller.
*Surreal detail:* when her hand rests on a lock, hairline seams of white light run through it before it opens.

**The marquis de Carabas.** A tall Black man of uncertain age ◆, a very dark face in which his eyes and sudden grin burn white, long black hair tied back. Moves like a great cat. A huge dandyish black coat, neither frock coat nor trench, filthy lace cuffs, raggedy clothes beneath, high square-toed black boots, Portico's gold watch on a chain. After his death: barefoot, a blanket worn as a poncho, a discoloured cloth wound high round his throat.
*Surreal detail:* his coat has more inside pockets than a coat could hold.

**Hunter.** A tall woman of no readable age, long tawny hair, skin the colour of burnt caramel, nut-brown eyes, a face like carved wood at rest and a smile that could stop a revolution. Soft leathers dappled grey and brown like an animal's coat, a battered duffel, a staff, a knife at her belt, a torch strapped to her wrist. An accent no one can place.
*Surreal detail:* dust and water on the floor do not stir when she walks.

**Mr Croup.** A little shorter than Richard, thin, quick, almost dancing. Lank, greasy hair of an unlikely orange, pallid skin, faded china-blue eyes, teeth like an accident in a graveyard. A greasy, frayed black suit made two hundred years ago from a description of a modern one, every line and grace note wrong. No jewellery.
*Surreal detail:* his smile arrives a fraction of a second after the rest of his face.

**Mr Vandemar.** Two and a half heads taller than Croup, huge and impassive; grey-and-black hair cut bristle-short, brown eyes, a bullet head. The same wrong black suit. On his right hand, rings made from the skulls of four ravens; a knife holstered in his sleeve. He walks the way death walks.
*Surreal detail:* when he spits on a wound in his hand, the flesh knits closed on camera.

**The Angel Islington.** Barefoot, not much taller than Richard yet making him feel a child; neither man nor woman, perfectly androgynous and very beautiful. A pale, wise, gentle, slightly lonely face, golden hair, luminous pearl-grey eyes as old as the universe. A plain robe that looks white, then looks woven from light. No wings.
*Surreal detail:* candles light themselves as it approaches and go out behind it.

**Anaesthesia.** A thin, bedraggled girl in her late teens who moves in scurries and laughs behind her hand. Ragged layers trimmed with scraps of fur, a necklace of rough quartz beads, a stained red birthday badge reading I AM 11. Carries a candle in a lemonade bottle.
*Surreal detail:* small rats walk in step beside her feet.

**Old Bailey.** An old roof-man, round and short ◆, a kind creased face, grey muttonchop whiskers. A nameless garment covered entirely in feathers, ropes wound round and round his body, fingerless gloves more hole than glove, battered spectacles on a string.
*Surreal detail:* a feather lifts off his coat and, a few metres off, becomes a small grey bird.

**Lord Rat-speaker.** Taller than Richard but bent in a permanent stoop, hands at his chest with fingertips pressed together. Long hair, a patchy brown beard, yellow teeth, rags trimmed with orange, white and black calico fur. A glass dagger with a fur grip.
*Surreal detail:* his shadow on the vault wall has a long thin tail.

**Iliaster.** A short, old, balding man; a scraggly yellow-and-grey beard; facial lines etched in black dirt; grey rheumy eyes; a filthy coat over a ruined dark grey sweater; an old railwayman's lamp that gives less light than a match.
*Surreal detail:* the rain falls around him without touching him.

**Lamia.** Slight and very pale, black hair perfectly coiffed and piled high, silver jewellery, a long jet-black velvet dress; eyes the colour of foxgloves, plum-bloom lips, very cold fingers; a scent of honeysuckle, lily of the valley and musk. After feeding, her skin flushes pink and her lips turn scarlet. (Other Velvets: the same cut in green, chocolate, royal blue, dark blood.)
*Surreal detail:* in the cold her breath does not steam while everyone else's does.

**Serpentine.** A towering old woman whose greying hair brushes the lintel; an imperious, ravaged face, sharp eyes, a mouth like a cruel slash. A white leather corset and high white leather boots over the shredded, dirt-stained remains of a lace wedding dress. Her majordomo: a thin, severe woman with long dark hair in a black dress pinched wasp-thin at the waist.
*Surreal detail:* her torn train leaves no mark in the mud it drags through.

**The earl, Tooley and the men-at-arms.** The earl: immense and elderly, head brushing the carriage roof, a black patch over his left eye, a red-grey beard with crumbs in it, a fur cap over a balding head, a fur-lined dressing gown, pyjama trousers, carpet slippers. Tooley: an arthritic old jester with a pinched, humourless mouth and a painted face in faded motley. Halvard and Dagvard: grey old men in tin hats and knitted chain mail, like retired clerks in amateur dramatics.
*Surreal detail:* vending machines pay out when his men knock in his name.

**Lear.** An extremely tall busker, shoulder-length dark hair, a long forked beard, deep-set eyes, a serious nose; ragged T-shirt, oil-stained jeans, a saxophone, his coat on the floor with a few coins.
*Surreal detail:* the coins on his coat are dated years that have not happened yet.

**The abbot.** A very old man in a black Dominican habit and cowl, a gnarled brown hand on a brother's arm, eyes glaucous blue-white with cataracts, a deep melodious voice.
*Surreal detail:* the steam from his teacup bends toward his face as if he could see it.

**Brother Fuliginous and Brother Sable.** Fuliginous: young, slight, deep rich brown skin, a nervous thin face, a battered Polaroid camera. Sable: tall, skin the dark brown of old mahogany, a wooden staff as tall as himself, a split lip after Hunter. Both in black Dominican robes.
*Surreal detail:* the fog parts around Sable's staff in a perfect circle.

**Hammersmith.** A smith like a small mountain: shaggy brown beard, leather apron, hands several sizes larger than Richard's and a handshake practised until it is gentle.
*Surreal detail:* the iron rose he forges holds a dewdrop that never dries.

**Varney.** A big man like a bull that has been shaved, dehorned and tattooed, with complete dental breakdown; clothes stitched from car seats and rubber mats; a shaven head.
*Surreal detail:* the crowbar he lifts with his mind trails a faint heat haze.

**Jessica Bartram.** A very beautiful Englishwoman of twenty-six with long chestnut hair in corkscrew curls and dark flashing eyes; poised, organised, a little terrifying. A smart city coat; at the museum, an off-the-shoulder green silk dress.
*Surreal detail:* Richard's name on a list fades a little each time she looks at it.

**Gary.** A colleague of about thirty in suit and tie, clean-shaven, every hair in place (details ◆).
*Surreal detail:* in the café his mug of tea is the only thing in the shot that steams.

**Lord Portico.** In the journal machine: thin, ascetic, almost bald, "Caesar as Prospero", in a threadbare smoking jacket and skullcap; in the last entry a long coat and a scarlet gash down his head. In Door's dream: younger, thick brown hair, an easy smile.
*Surreal detail:* in the dream he peels an orange that turns itself inside out.

**The old woman with the umbrella.** Very old, in layers of coats and shawls, a beaky grimy face with two sharp eyes; once a dancer, she says. In 8.9 perhaps the same woman, asleep in a Soho doorway in a wool hat of no colour.
*Surreal detail:* while she reads his palm, the rain stops falling on the two of them only.

**The Great Beast of London.** A boar grown in the sewers for three centuries, the size of an ox or a bull elephant; a steaming bristled hide stuck with broken spears, shattered swords and rusted knives; dried blood on its tusks; small red eyes. It moves so slowly it looks old, until you see the ground it covers.
*Surreal detail:* drops of water hang in the air around it when it charges, as in Richard's dream.

---

## 8. Recurring locations

- **The Neverwhere door:** a plain London street door among the carved doors of Lucienne's library.
- **Richard's office off the Strand:** a draughty room of cubicles and trolls; later his own office with a river view.
- **Newton Mansions:** Richard's untidy flat over a bakery, its stairwell broom cupboard; later the penthouse of unpacked cases.
- **Orme Passage:** an alley off Hanway Place under one gas jet; a manhole.
- **Old Bailey's rooftops:** broken gargoyles; a roof facing St Paul's; Centre Point with washing on a line.
- **The Rat-speakers' hall:** a vaulted cellar of small fires, spits and rat holes.
- **The Embankment and Albert Bridge:** the river at night, stars, strings of white lights.
- **Night's Bridge:** a stone bridge over a void, an identical anteroom at each end.
- **Harrods at night:** the Floating Market in the Egyptian Room and the Food Halls.
- **The sewers:** Victorian red-brick vaults and storm-drain ledges.
- **The House Without Doors:** a white hall of pictures, a Victorian pool, Portico's study.
- **The closed hospital:** Croup and Vandemar's sub-cellar, junk courtyard and canteen.
- **Bank to Monument:** the busker's passage; a platform with a gap that bites.
- **The Earl's Court:** a carriage that is a smoky medieval hall; the library of lost things behind the throne.
- **British Museum Station:** sealed in 1933, old posters, an iron door.
- **The British Museum:** a storeroom of rare junk, the "Angels over England" gallery, the front steps at dawn.
- **Islington's hall:** iron pillars, a waterfall and rock pool, a black door of flint and silver.
- **Serpentine's house:** stables marked with an S and seven stars; a tiny breakfast platform.
- **The river and the London Particular:** a slippery bank, a black lake, yellow fog over marsh.
- **The Black Friars:** a bridge in fog, the wall of those who failed, the key shrine, the infirmary, the bell tower.
- **The painted caves:** limestone tunnels of mammoths, lorries and cats in ochre.
- **HMS Belfast:** a market on a warship's deck by Tower Bridge.
- **Down Street:** the Royal Society for the Prevention of Cruelty to Houses, the plank, the spiral road down a bottomless well.
- **The labyrinth:** the giants' gate, lanes from every century, the Fleet Marsh.
- **Nightingale Lane:** a ghost station; a gloaming terminus; an underpass of Velvets.
- **The island of Westminster:** a frosted hill between three rivers, three thousand years ago.
- **Soho at night:** a pub, a greasy spoon, a Brewer Street doorway and its wall.
