# Coraline: interactive story map (v0.1)

**Source:** `source-text/coraline.txt`, the full text of *Coraline* (10th anniversary edition, 13 chapters plus the author's introduction). Every scene below comes from the text unless marked **◆**. Additions are few and small: the library door at each end of the book (series hub), one told memory shown as a flashback, and a handful of fallback branches that only exist so that a non-canon choice has somewhere to go.

**Book 3 of the Library of Doors.** Entered through a door in Lucienne's library (see `series-bible.md`). Trait shaped: **COURAGE** (`profile.traits.courage`). Relic earned: **the black button key** (`button_key`).

**Player character:** Coraline Jones, played by your wife.

**A note on dialogue.** Lines from the book are paraphrased in this map. The authored lines in `story.json` should be taken from your own copy of the book, which is fine for a private gift. The rats' songs and the father's made-up song are verse and are deliberately not reproduced here (see §9).

---

## 0. Design pillars

1. **Brave means scared and doing it anyway.** This is the book's own thesis (the introduction says it outright, and Coraline says it to the cat in chapter 5 after the wasp story). So COURAGE moves only when Coraline is afraid and acts anyway. Bravado earns nothing: eating a beetle to make a point is 0. Calm clarity earns nothing either: in the attic (4.6) the text says she is not frightened, so refusing the temptation there moves FAITH, not COURAGE. Running, giving up and waiting for grown-ups lower it.
2. **Hybrid perspective, hand-held.** Establishing shots and emotional beats are cinematic third-person with Coraline visible (3P). Every decision and every tense beat cuts to first-person POV: the hand into the sac, the cellar, the corridor, the hand on the tablecloth. All clips are hand-held in style with natural camera shake. In POV the shake is applied by the app, scaled to fear: low COURAGE means a shakier frame, high COURAGE a steadier one. The first truly steady frame in the whole book is the golden afternoon in 5.3, when she is home and "the sky had never seemed so sky" (chapter 11).
3. **Two of everything, and the copy decays.** Every location exists twice: the real house and the other mother's copy. The copy is generated in four states that the player watches degrade: perfect (Ep 2), slightly wrong (Ep 3), a photograph (Ep 4, after the attic), a charcoal scribble on grey paper (end of Ep 4). The real house never changes, except that it gets warmer.
4. **The beldam cheats; Coraline does not have to.** The decision spine from the series bible: what she accepts from the other mother, how she uses the stone, and whether she keeps the game fair when the beldam does not. A `PLAYS_FAIR` flag tracks whether Coraline kept her side of the bargain until the beldam broke hers. Tricking her at the end (the bluff, the thrown cat) is canon and fair, because by then the beldam has already lied.
5. **No mid-story game over, with two exceptions that offer "return to the last choice":** accepting the buttons (Ending C) and leaving without her parents (Ending E). Everything else scars the story instead: a ghost left in the dark, the cat gone, the hand still loose.
6. **Casting: she is herself.** Your wife plays Coraline at her own adult age, in Coraline's clothes, in Coraline's story. The world treats her exactly as the book treats Coraline (the neighbours still call her Caroline, her parents still forget to listen). Nothing in the book states Coraline's age, so very little must change. The few lines that fix her as a child are softened, listed in §9. This is an assumption; the alternative (a child actor's face in 3P, her only in POV) is noted in §9.

---

## 1. State variables

| Variable | Range | Moved by | What it changes |
|---|---|---|---|
| **COURAGE** | -10 to +10 | Acting while afraid (+), fleeing or giving up (-). Stored as `profile.traits.courage`. | POV camera shake; the length of the final hold at the well (5.6); whether she can chase the third soul alone (4.7); the cross-book echoes. |
| **FOG** | 0 to 3 | Eating the other mother's food, wearing her clothes, playing with her toys. The stone with a hole clears it (chapter 6: putting it in her pocket is like coming out of a fog). | At FOG 2 or more, a "stay" option appears in the attic (4.6). At FOG 3 the inner voice starts to sound like the other mother. |
| **CAT_TRUST** | 0 to 3 | Politeness, asking the cat's advice, carrying it, apologising. | At 2 or more the cat kills the rat and returns the third soul (4.7). At 3 the cat speaks to her in the library hub afterwards. |
| **SOULS** | 0 to 3 | `SOUL_1` (the boy, toybox), `SOUL_2` (the tall girl, theatre), `SOUL_3` (the winged girl, attic) | Hands helping at the door (5.2), places filled at the picnic (5.4), Ending A vs D. |
| **NAME** | 0 to 4 | Each time she corrects "Caroline" to "Coraline". | Mr Bobo finally saying her name right (5.7); A-variant. |
| Light cross-trait moves | +-1 each | MERCY (3.6, 4.5), LOYALTY (3.2, 3.8, 4.7), FAITH (4.6, 5.4) | Read by the other books, per the bible's rule that each book nudges the other three traits in one or two scenes. |

Flags (stored in `profile.flags.coraline`): `WELL_FOUND`, `TRIED_RECIPE`, `MICE_WARNING`, `STONE_HELD`, `STONE_POCKET` (carried, not left at home), `STONE_HINT` (the ghost's whisper), `STONE_LOST`, `STONE_RETURNED`, `DOG_FRIEND`, `BUTTONS_OPEN`, `BELDAM_SUSPECTS`, `OF_TALKED` (the other father said too much), `SNOWGLOBE_SEEN`, `PARENTS_SAVED` (the snow globe taken), `CHALLENGE_IDEA`, `GHOST_PROMISE`, `STAKES` (all / parents), `HAND_OATH`, `CAT_CARRIED`, `PLAYS_FAIR` (starts on), `WARNED`, `WELL_TRAP`, `HAND_LOOSE`.

---

## 2. Structure at a glance

Five episodes, following the book's thirteen chapters in order. **33 core scenes**, 2 hub scenes in the library (◆), about **20 variant clips**, **5 endings plus 1 variant**. Story time is the last weeks of a cold summer holiday.

| Ep | Title | Chapters | Story time | Core scenes | Key fork |
|---|---|---|---|---|---|
| 1 | The door that went nowhere | 1 to 2 | First two weeks, a rainy day, a foggy day | 5 | Find the well; take the stone |
| 2 | The other mother | 3 to 4 | One sunny afternoon | 6 | Eat her food; refuse the buttons |
| 3 | Going back | 5 to 7 | Two empty days, one night, one day in her world | 8 | Go back for them; promise the ghosts |
| 4 | The exploring game | 8 to 10 | One day in her world | 7 | The terms of the game; the three souls; the cat |
| 5 | The hand and the well | 11 to 13 | The last week of the holidays | 7 | The bluff; the trap at the well |

---

## 3. Episode by episode

Format per scene: **Setting** → **Clip** (3P or POV) → **DECISION** → consequences. "Window" marks a conversation window (§6).

### Hub: L.1 The Coraline door ◆

Setting: Lucienne's library. On the Doors wall, one small door: carved brown wood, a drawing-room door, too plain for the wall. Cold air at the keyhole smells of something very old and very slow (the book's words for the passage).
Clip (3P): Lucienne raises the lantern: this door opens onto a house; mind which side of it you come back to. The door opens on rain.
*(No decision. Window: Lucienne, open.)*

---

### Episode 1: The door that went nowhere (chapters 1 to 2)

**1.1 Exploring the grounds**
Setting: a very old house split into flats; an overgrown garden of huge trees, a tennis court with a rotted net, stunted roses, a rockery that is all rocks, a fairy ring of foul toadstools. A cold summer. Miss Spink and Miss Forcible have warned her about the well.
Clip (3P): a fortnight's montage: a hedgehog, a snakeskin with no snake, a rock like a frog, a toad like a rock. A haughty black cat watches from a wall and slips away.
DECISION:
- A. **Find the well, so she knows where to keep away from it.** (canon) → `WELL_FOUND`. POV: a boarded brick circle in long grass; pebbles and acorns through a knothole, counting to the plop.
- B. **Try to make friends with the cat.** → it slips away every time; in 2.4 it remembers being chased.
- C. **Stay in sight of the house.** → `WELL_FOUND` off (in 5.5 she finds the well the hard way).
COURAGE 0 for all: curiosity, not fear.

**1.2 The rainy day**
Setting: rain that means business; a TV programme on protective coloration; her father typing with his back to her; the drawing room, only for best.
Clip (3P): her father's game: count everything blue (153), the windows (21), the doors (14). The fourteenth, carved, in the drawing-room corner, is locked. Her mother takes the oldest, blackest key from the top of the kitchen doorframe and opens it. POV: red bricks. She doesn't lock it again.
DECISION: her father has made a recipe again (leek and potato stew, tarragon, Gruyère):
- A. **Microwave chips and a mini-pizza.** (canon) → no change.
- B. **Try the stew.** → COURAGE +1, `TRIED_RECIPE` (blunts the attic temptation in 4.6; she eats the pineapple in 5.3).

**1.3 Something in the hall**
Setting: night; something goes t-t-t-t, then a long creak.
Clip (POV): a shadow scuttles down the dark hall like a patch of night; she hopes it isn't a spider (establish: spiders make her deeply uncomfortable). Clip (3P): in the lit doorway her shadow falls across the carpet as a thin giant woman. The shape darts to the empty corner.
DECISION:
- A. **Turn on the light and go to the corner.** (canon) → COURAGE +1. The door is open a crack. Bricks.
- B. **Watch from the doorway.** → no change; she sees the door ajar later.
- C. **Go back to bed.** → COURAGE -1.
Then the dream (all routes): little black shapes with red eyes and yellow teeth singing under the moon.

**1.4 The fog**
Setting: thick white fog; blue hooded coat, red scarf, yellow wellingtons.
Clip (3P): Miss Spink like a large fluffy egg in cardigans, whispering that men sent her flowers; Miss Forcible: you'd have to be an explorer in this. She is one. Mr Bobo comes slowly down the outside steps, moustache tickling her ear: the mice say don't go through the door. They got her name wrong too; they kept saying Coraline.
DECISION (Window: Mr Bobo):
- A. **Correct him: Coraline.** (canon, as in chapter 1) → `NAME +1`.
- B. **Ask what door.** → `MICE_WARNING` (unlocks 2.1B).
- C. **Ask him to thank the mice.** → he remembers it in 5.7.

**1.5 Tea leaves and the stone**
Setting: the parlour: furniture polish and dogs, photographs of pretty women, framed programmes, Miss Forcible knitting.
Clip (3P): a pink bone-china cup, a dry Garibaldi; the leaves say terrible danger, and Miss Forcible agrees; don't wear green in your dressing room. From a jar (china duck, thimble, brass coin, paperclips) Miss Spink gives her a stone with a hole: they're good for bad things, sometimes.
DECISION (Window: Miss Spink and Miss Forcible):
- A. **Keep the stone in your fist.** (canon) → `STONE_HELD`, `STONE_POCKET`.
- B. **Take it, leave it at home.** → `STONE_HELD` only (changes 2.4 and 2.6).
- C. **Politely refuse.** → second chance in 3.1.
Inner voice: danger sounds exciting. Not really a bad thing.

---

### Episode 2: The other mother (chapters 3 to 4)

**2.1 Green gloves and the black key**
Setting: a department store; the car; home with her mother out at the shops.
Clip (3P): she wants Day-Glo green gloves and gets grey; frog and duck wellingtons; she claims she escaped aliens with a wig and a foreign laugh. What's in the empty flat? Nothing, unless you can walk through bricks. Alone: a chair, a broom, chink. The black key is colder than the rest. POV: clunk; she listens for her mother.
DECISION:
- A. **Open it.** (canon) → no change.
- B. **Say the mice's warning aloud and open it anyway.** (needs `MICE_WARNING`) → COURAGE +1.
- C. **Fetch the stone first.** (if left at home) → `STONE_POCKET`.
The bricks are gone. A dark hallway, a cold musty smell.

**2.2 The other mother**
Setting: her flat, almost. The hall picture of a boy and bubbles now looks as if he means to do something nasty to them.
Clip (3P, then POV): a woman at the stove with her back turned: paper-white skin, taller, thinner, long restless fingers, curved dark-red nails. She turns. POV close: big black buttons. The other father turns from the keyboard: buttons. A golden roast chicken, fried potatoes, tiny peas. They've been waiting a long time. Everyone has an other mother.
DECISION (Window: the other mother and father):
- A. **Eat. It's the best chicken she's ever had.** (canon) → FOG +1.
- B. **Refuse, though starving.** → COURAGE +1, `BELDAM_WARY` (rats in the background of 2.3 to 2.6, tag `[rats]`).

**2.3 The other bedroom**
Setting: green and peculiar pink; wind-up angels like startled sparrows, writhing picture books, chattering dinosaur skulls.
Clip (POV, then 3P): fifty red eyes under the bed. The rats build a pyramid and sing, then pour into the clothes of the other old man upstairs in the doorway; the largest climbs past his button eyes and under his tall black hat. Come up and watch them feed?
DECISION:
- A. **No, thank you; she's going exploring.** (canon) → no change.
- B. **Stay with the toys.** → FOG +1; her other parents wave from the doorway, smiling, the whole time.

**2.4 The cat who is not the other anything**
Setting: outside, the same house, but blue and red bulbs around the Spink and Forcible door spell ASTOUNDING! A THEATRICAL TRIUMPH!!!
Clip (3P): the black cat talks, in the voice at the back of her head but a man's. It is not the other cat; it's itself. Cats don't need names. It walks behind a tree and doesn't come out. Then: sensible of her to bring protection (only with `STONE_POCKET`).
DECISION (Window: the cat):
- A. **Apologise; be polite.** (canon) → CAT_TRUST +1.
- B. **Insist cats don't talk.** → it agrees drily it's only a cat, and leaves. CAT_TRUST 0.

**2.5 The theatre**
Setting: dust and velvet; an old Scottie usher with a torch in its mouth wants her ticket; the audience is all dogs.
Clip (3P): Miss Spink on a unicycle, Miss Forcible scattering petals; they unbutton their round coats, their faces open like empty shells, and two young button-eyed women step out (green tights and boots; white dress, flowers in yellow hair). Is this a dagger? Yes, shout the dogs. A volunteer? The little dog beside her: that's you.
DECISION 1:
- A. **Go up.** (canon) → COURAGE +1. POV: a balloon on her head; Miss Forcible blindfolded and spun; she holds her breath and squeezes her fists; the knife twangs into the board above her. A box of chocolates.
- B. **Stay seated.** → COURAGE -1.
DECISION 2 (after 1A):
- A. **Give the chocolates to the little dog** (not the toffee ones). (canon) → `DOG_FRIEND`.
- B. **Eat them.** → FOG +1.
The dog: the show goes on for ever and always.

**2.6 Buttons on a china plate**
Setting: the kitchen. On a china plate: black cotton, a long silver needle, two black buttons.
Clip (3P, then POV on the needle): one little thing, so she can stay for ever. It won't hurt (grown-ups say that when it will). Hair drifting like weed under the sea. A hand on her shoulder.
DECISION (Window: the other mother and father):
- A. **Refuse and leave.** (canon) → with `STONE_POCKET` her fingers close on the stone and the hand scuttles off like a frightened spider; without it she has to twist free (variant, a scratch that lasts the book).
- B. **"I'll think about it."** → FOG +1, `BUTTONS_OPEN` (the plate returns in 4.6).
- C. **Agree.** → **Ending C**.
Then: her other parents follow hand in hand, mouthing come back soon. Clip (POV, eyes closed): whispers, distant wind, something very old and slow behind her, her heartbeat. An armchair. Bricks. Home.

---

### Episode 3: Going back (chapters 5 to 7)

**3.1 A single child family**
Setting: her flat, empty for two days.
Clip (montage, 3P): toast, frozen pizza, TV, an unslept bed; limeade at the Spinks' that tastes bright green (she's become a single child family, she tells them; they talk about Tunbridge Wells); her money box spent on cake and apples; a silly story typed on her father's computer (◆ she types her own); 3:12 a.m., crying alone, asleep in her parents' bed. (No stone yet? She can ask Miss Spink for one at tea → `STONE_HELD`, `STONE_POCKET`.)
Clip (3P, then POV): the cat's cold paws. It leads her to the hall mirror, once a wardrobe door: her parents inside it, sad, waving limply; her mother writes on the fogged inside of the glass, then they fade.
Then the police (Window: the officer):
- A. **Report it as a crime, calmly.** (canon) → no change. Hot chocolate and a hug, he says.
- B. **Beg him to send someone.** → COURAGE -1.
- C. **Apologise and hang up.** → no change.
Nobody is coming.

**3.2 The wasps**
Setting: night; dressing gown and slippers; a candle (the torch is dead); an apple in each pocket; the black key; the stone from her jeans pocket.
Clip (3P): the key in the lock, unturned, while she tells the cat a story. Flashback ◆: a wasteland of dumped cookers and armless dolls; her father shouting run; her one sting, his thirty-nine; then her father walking back alone that afternoon for the glasses he dropped. Standing there wasn't brave, he said; he wasn't scared. Going back was brave. She turns the key.
DECISION (POV at the open door):
- A. **Step through.** (canon) → COURAGE +2, LOYALTY +1 (light). She goes because they're her parents.
- B. **Shut it and wait for the grown-ups.** → **Ending E**.

**3.3 You don't frighten me**
Setting: the passage; the candle snuffed as if by a hand; cobweb on her face; a woman silhouetted in light at the end.
Clip (POV): she runs to the voice calling darling, too late to stop. (3P): rigid in cold arms; a midnight snack offered. The mirror shows only her, real eyes, a dead candle. She will be brave; no, she is.
DECISION 1 (Window: the other mother):
- A. **Bite her own apple: you don't frighten me.** (canon; they frighten her very much) → COURAGE +1.
- B. **Accept the hot chocolate.** → FOG +1.
- C. **Run back.** → COURAGE -1.
The mirror trick: her parents home from a holiday, glad to be rid of her.
DECISION 2:
- A. **Don't believe it.** (canon) → no change.
- B. **Let the doubt in.** → COURAGE -1, until a flash of real anger crosses the other mother's face and she knows.
A rat fetches the key. One key, one door. Locked, into the apron pocket.

**3.4 Dawn on the steps**
Clip (3P): the cat pushes against her. Calling cats is overrated; "Dinner!" will do. Why me? Something to love that isn't her. Maybe something to eat.
DECISION (Window: the cat):
- A. **Ask for advice.** (canon) → CAT_TRUST +1, `CHALLENGE_IDEA`: challenge her; her kind loves games; no guarantee she plays fair.
- B. **Ask what she is.** → no answer.
- C. **Ask for a way out.** → there are ways she doesn't know about; not for Coraline yet.
Then the toybox dragged across the bedroom door, its toys muttering in their sleep.

**3.5 Morning in her world**
Setting: a paper butterfly beating on the ceiling; dressing-up clothes; in a drawer, velvet-night jeans, a smoke-grey star sweater, orange boots.
DECISION 1:
- A. **Wear them.** (canon) → FOG +1, then reset to 0 when the stone goes in the pocket (colour steps up, a fog lifting).
- B. **Stay in pyjamas.** → no change.
Clip (3P): the other father at his desk doing nothing, face smoothing like rising dough. She's out fixing the doors; vermin (the cat). He mustn't talk.
DECISION 2 (Window: the other father):
- A. **Get him talking.** (canon) → she made the house, the grounds, the people, and waited. Finger to his lips, too late. `OF_TALKED` (he will be punished, 4.5).
- B. **Leave him be.** → no `OF_TALKED`.
Clip (POV): the drawing-room door, locked fast (cross-book: the Angel's key rattles, doesn't fit). The fruit painting, the lion-footed table, and something new on the mantelpiece: a snow globe with two little people.
DECISION 3:
- A. **Shake it, put it back.** (canon) → `SNOWGLOBE_SEEN`.
- B. **Pocket it now.** → `SNOWGLOBE_SEEN`, `BELDAM_SUSPECTS` (she silently takes it back in 3.7).
- C. **Ignore it.** → no `SNOWGLOBE_SEEN` (Ending E path).

**3.6 The edge of the world**
Setting: woods that thin into the idea of trees, then white nothing: no temperature, smell or ground.
Clip (POV): the cat, fur on end, tail down: the part she hasn't bothered to create.
DECISION 1:
- A. **Keep walking; an explorer needs every way out.** (canon) → the house looms out of the white. A small world. Spiders' webs only need to catch flies.
- B. **Turn back.** → she never learns how small it is.
Clip (3P): the cat pins a rat (her spies, her eyes and hands), lets it run, pins it again, and loves this bit.
DECISION 2:
- A. **Tell it to stop.** (canon) → MERCY +1 (light). How often does your dinner escape, it asks.
- B. **Watch.** → no change.
- C. **Tell it to finish the spy.** → CAT_TRUST +1, MERCY -1 (light).

**3.7 Beetles**
Clip (3P): a hand on her shoulder; mirrors are never to be trusted. Happy Families? She wants to go home and everyone let go. A daughter's ingratitude; the proudest spirit broken with love. A paper bag of shiny black beetles; legs pulled off into the glass ashtray; crunch. Sick and evil and weird. A minute's staring. She stands up, and up, and up.
DECISION (Window: the other mother):
- A. **You aren't my mother.** (canon) → no change (anger, not fear).
- B. **Eat a beetle to show her.** → FOG +1; the inner voice: stubborn, not brave.
- C. **Lunge for the black key in the handbag.** ◆ → misses; `BELDAM_SUSPECTS`.
All routes: the tiny silver key twisted into the glass; the mirror opens like a door. Out when she has learned manners. A fragment of beetle on the other mother's lip. Dark.

**3.8 Behind the mirror**
Setting: a broom cupboard of dark, one wall cold glass.
Clip (POV): a sob, stopped. A spider over her hand. A small cold cheek; hush, the beldam might be listening. Three voices, faint as a daytime moon: a governess, tulips like nursery embers, a child who thinks he was once a boy. She stole their hearts and souls and fed on them. Flee, or be left hollow.
DECISION (Window: the ghost children):
- A. **Refuse to run, promise to win their souls too, hold the coldest hand.** (canon) → COURAGE +1, LOYALTY +1 (light), `GHOST_PROMISE`, `STONE_HINT`: falling asleep after her last apple, a ghost kisses her cheek: look through the stone.
- B. **Promise, all business.** → `GHOST_PROMISE` only.
- C. **Agree to flee.** → COURAGE -1. No promise (the deal will be for her parents only).

---

### Episode 4: The exploring game (chapters 8 to 10)

**4.1 The deal**
Setting: the other mother, flushed and healthy, hair like lazy snakes, walks through the mirror like water and carries her out like a sleeping baby (an adult carried so: keep it, it is creepier). Cheese omelette, bacon, orange juice, hot chocolate. Nobody sensible believes in ghosts.
Clip (3P): you like games; wouldn't you rather win me fair and square?
Window: the other mother, up to 8 turns. Four exits:
- **The stake.** A. **Herself:** if she loses she stays, eats, plays Happy Families, takes the buttons; she grips her knees to stop them shaking. (canon) → COURAGE +1. B. **Something smaller** → laughed off, COURAGE -1, back to A.
- **The prize.** A. **Parents, the dead children, everyone.** (canon; needs `GHOST_PROMISE`) → `STAKES=all`. B. **Her parents.** → `STAKES=parents` (Ending D).
- **The game.** A. **An exploring game, a finding-things game.** (canon) B. **Riddles or skill** → rigged; the cat's warning (CAT_TRUST 1+) or inner voice; COURAGE -1, back to A.
- **The oath.** A. **Refuse her mother's grave** (she put her mother in it, and back when she crawled out) → she swears on her right hand. (canon) `HAND_OATH`. B. **Accept the grave.** → the picnic warning changes.
She eats, hating how easily she gave in, but won't taste the hot chocolate.

**4.2 The first soul**
Setting: a fingernail tapping a button eye becomes the drip of the tap; she is alone. Better she had a location; nowhere means anywhere.
Clip (POV): the stone held out like a gun. In the hall mirror it glows like a green coal and a trail of green fire drifts to her bedroom (no stone, no trail). (3P): toys flutter to greet her; a tank on its back like a beetle; the toybox tipped: a charm bracelet of animals forever chasing, a green soldier, a grey marble, a pink yo-yo.
DECISION 1:
- A. **Look through the stone.** (canon; prompted only with `STONE_HINT`) → POV: a grey pencil-drawing room and one ember-red glint. The marble. `SOUL_1`: he certainly was a boy; hurry.
- B. **Search by hand.** → pick one forgotten toy; one chance in four. Wrong: a tap-tap from the kitchen, `SOUL_1` off.
DECISION 2:
- A. **Change back into pyjamas; fold her clothes on the bed.** (canon) → FOG 0.
- B. **Keep them on.** → FOG +1.
Clip (POV): in the hall, a wind of invisible sand, sharp as glass. A ghost: keep going.
DECISION 3:
- A. **Shout "play fair".** (canon) → the wind drops, petulantly.
- B. **Push on silently.** → stung cheeks until 4.4.
- C. **Retreat.** → COURAGE -1, try again.

**4.3 The thing on the wall**
Setting: the lights round the door flicker nonsense; the theatre is derelict: broken seats, cobwebs, rotting velvet.
Clip (POV, torch through dust): a torch at her feet (with `DOG_FRIEND`, dropped by a grey-muzzled shape above ◆, one frame). Dog-bats hang from the ceiling, hairless, once dogs. Through the stone: on the back wall a sac like a spider's egg case, twice her size; inside, two heads and eight limbs rolled together like Plasticine; in one hand, a glow like polished cherrywood.
DECISION:
- A. **Climb up and reach in.** (canon; she has never been so scared) → COURAGE +2. POV: webbing that crackles like a tiny fire; a cold slick hand; fingers loosening one by one. `SOUL_2`. Four buttons open; a wail and a bluebottle buzz cry thief; a grab scrapes her arm; dog-bats circle, never touching. It can't follow. A girl: flee, you have two.
- B. **Decide there's no soul here.** → COURAGE -1, `SOUL_2` off.

**4.4 A helping hand**
Setting: swirling mist; the house crouching, slanted, the idea of a house.
Clip (3P): the other mother in cold fury. Two found. Her voice from the mist and house and sky: you know I love you. Coraline nods: as a miser loves money. A hint about the locked empty flat; she coughs and takes a small brass key off her tongue. Coraline catches it, damp. A ghost: it's a trick.
DECISION (Window: the other mother):
- A. **Use it anyway.** (canon) → 4.5.
- B. **Refuse; go to the attic.** → skip 4.5 (there's no soul in that cellar).

**4.5 The cellar**
Setting: walls like old milk; rug-ghosts on bare boards; a cat-sized dead spider in the bath; a ring in the floor; a trapdoor; damp clay and sour vinegar; crude paintings of eyes and grapes and maybe people; a heap of curtains; a foot.
(Without `OF_TALKED`: only dust and damp and forgetting. No decision.)
Clip (3P, then POV, she whistles to keep things from jumping out): a grub-pale, dough-faced thing with stick limbs and buttons sits up and says her name in a voice no longer her father's, and pushes its face-clay into a nose.
DECISION 1 (Window: the thing that was the other father):
- A. **Pity him.** (canon) → MERCY +1 (light). Poor thing, made and thrown away; she pats his tacky head; his left button falls. He begs her to run; she's pushing him to hurt her. You can; be brave. Alas, he can't.
- B. **Back away silently.** / C. **Threaten him.** → both buttons stay on.
DECISION 2 (POV, one heartbeat):
- A. **Grab the button and pull.** (canon) → COURAGE +1. It clicks off the brickwork; he roars blind. (After B or C he still half-sees her and brushes her slipper on the stairs.)
- B. **Scream and run.** → COURAGE -1; chased round the cellar.
Her foot slips; he flows up the steps like a serpent; the trapdoor slams and rattles and holds.
DECISION 3:
- A. **Lock up; key under the mat.** (canon) → `PLAYS_FAIR` holds.
- B. **Keep the key.** → `PLAYS_FAIR` off.

**4.6 The attic**
Setting: low ceilings; red eyes; the rats' third song; the smell of every exotic food left to rot.
Clip (POV): she isn't frightened, and knows it's true: she can only copy and twist. (With `SNOWGLOBE_SEEN`: why a snow globe on a mantelpiece that's bare at home?) In the last room, a bundle of coat and hat with a voice like dead leaves.
DECISION (Window: the other Mr Bobo): home will be bored and ignored; too clever and quiet; they don't get your name right. Stay, and worlds will be built for her every day. No grey wet days; no recipes with garlic and tarragon (with `TRIED_RECIPE` she laughs); Day-Glo gloves, frog boots.
- A. **"I don't want whatever I want. Nobody does."** (canon) → FAITH +1 (light). COURAGE 0: she isn't afraid.
- B. **Bargain for the soul.** → `PLAYS_FAIR` off.
- C. **Stay.** (only at FOG 2+ or `BUTTONS_OPEN`, when the needle and spool sit beside him) → **Ending C**.
Through the stone, a blue-white star at his chest. She steps closer; he falls apart into rats; the coat drops empty; the largest rat runs with the marble.

**4.7 The rat, the cat, and the flat world**
Clip (3P hard hand-held, POV locked on the rat): down the steps as the house flattens into a photograph; decoy rats; she skids and crashes: skinned knee, gritty palm, blood down the pyjama leg. The rat is gone. She's failed everyone, and wishes the earth would swallow her. A cough.
- **CAT_TRUST 2+** (canon): a headless rat on the path; the cat, smug, paw on the marble, rolls it to her. `SOUL_3`.
- **Below 2:** DECISION: A. **Chase it into the white nothing** ◆ (COURAGE 6+) → it runs out of world and drops the marble; `SOUL_3`, COURAGE +1. B. **Let it go.** → `SOUL_3` off.
A last voice: she lied; she'll never give you up. And she knows: the mantelpiece at home is bare. The parents are in the globe, and the promise will be broken.
Clip (3P): the house is a charcoal scribble on grey paper. The ways out have gone flat. The cat backs against her leg, trembling like a dead leaf.
DECISION (if the cat is here):
- A. **Carry it. If the only way out is past her, that's the way.** (canon) → CAT_TRUST +1, COURAGE +1, LOYALTY +1 (light), `CAT_CARRIED`. It licks her bleeding palm.
- B. **Let it go its own way.** → no `CAT_CARRIED`.
Her front door is a child's scrawl. It opens.

---

### Episode 5: The hand and the well (chapters 11 to 13)

**5.1 The unravelling time**
Setting: the drawing room, the fruit in the painting eaten to cores and stones, the lion-pawed table clawing the carpet, mist at the window.
Clip (3P): she is huge, head near the ceiling, spider-belly pale, hair writhing, teeth like knives, standing between Coraline and the mantelpiece. Where are they? Three frosted marbles shown, and pocketed again. We aren't finished.
DECISION 1 (Window: the other mother):
- A. **The bluff: they're in the passage, behind that door; open it.** (canon; needs `SNOWGLOBE_SEEN`) → she needs to gloat. The iron key; an empty corridor; delight. You'll stay for ever.
- B. **Say they're in the snow globe.** → she doesn't move from the mantelpiece. COURAGE -1, `BELDAM_SUSPECTS`, back to A.
- C. **Hand over the marbles in good faith.** → **Ending C**.
- (Without `SNOWGLOBE_SEEN`: bluff the door open and run alone → **Ending E**.)
DECISION 2 (POV, door open):
- A. **Throw the cat at her.** (canon; needs `CAT_CARRIED`) → it lands on her head, bites her cheek; black tarry blood. Snow globe into the pocket, key out of the lock, come on! `PARENTS_SAVED`.
- B. **Throw the stone at her buttons.** ◆ (no cat) → a one-second reel; `PARENTS_SAVED`, `STONE_LOST`. Fails under `BELDAM_SUSPECTS` → **Ending C**.
- C. **Run alone.** → **Ending E**.

**5.2 Closing the door**
Clip (POV, hands on the iron handle): heavy as a door against a gale, pulled from the other side. Then hands over hers: three children, two adults (fewer if souls were lost or no globe). Hold strong; pull. With `PARENTS_SAVED`, her own mother's voice: well done. That is enough. An inhuman scream; fingers through the gap.
DECISION:
- A. **Duck and keep pulling: we're going home.** (canon) → the door bangs shut. Something drops from head height with a scuttling thump.
- B. **Force the fingers back.** → a cut palm; the same thump.
Below COURAGE 3 it takes a second pull and the stone falls into the dark (`STONE_LOST`).
Clip (POV, the run): uphill and too long; the wall warm, furred, breathing; then hot and wet like a mouth. Glowing shapes ahead. Something scuttles between her feet.
DECISION:
- A. **Keep a hand on the wall.** (canon) → she stumbles and recovers. The corridor is older than the other mother, and knows she's there.
- B. **Run blind.** → she falls: three seconds of black and breath before ghost hands lift her. COURAGE -1.
Daylight. The loudest, most satisfying slam. Locked.

**5.3 Home**
Setting: golden late afternoon; a robin's-egg sky; a beech tree.
DECISION 1 (the cat huddled in the corner):
- A. **Apologise for throwing it.** (canon) → it purrs into her lap. CAT_TRUST +1 (max 3).
- B. **Say nothing.** → CAT_TRUST -1; it bolts when the door opens.
Clip (3P, the first steady frame of the book): sun gilding every whisker; the sky has never seemed so sky. She sleeps in the armchair. Her mother wakes her (this room is only for best); a hug till her arms ache. From her pockets: three marbles, the stone, the key, an empty snow globe filling with glitter snow. The key on a string round her neck. A kiss on her father's balding head; his kind grey eyes; he lifts her off her feet. Home-made pizza: green pepper, meatballs, pineapple.
DECISION 2:
- A. **All but the pineapple.** (canon) B. **Pineapple too** → with `TRIED_RECIPE`, her father grins.

**5.4 The picnic**
Setting: a dream: an old oak, a linen cloth, lemonade and chocolate milk.
Clip (3P, warm): the boy in red-velvet britches with new potatoes and cold trout; the tall girl in a brown bonnet with bread and purple jam; the pale winged girl in spider-silk and a silver circlet, eating flowers, remembering how to smile. A game of tag; the winged girl swoops for the ball. Ice cream, honeysuckle. This is their staging post. But.
Variants: a child not freed is missing, their place set and untouched. With `STAKES=parents`, no picnic: three pale shapes behind glass (Ending D).
DECISION (Window: the three children):
- A. **Ask for a clue.** (canon) → `WARNED`: she swore by her right hand, and lied; no one is given more than they can bear; fortune, wisdom and courage (only fortune and courage if `PLAYS_FAIR` is off); she hates you; be wise, be brave, be tricky. The boy hugs her: thou livest.
- B. **Insist it's over.** → no `WARNED` (+2 s on the final hold).
- C. **Ask them to stay.** → they can't; FAITH +1 (light); warned anyway.
They cross the moonlit meadow to a wooden bridge over a stream, and wave. She wakes believing it (FAITH +1, light).
Clip (POV, pre-dawn): something rattles her door; go away or you'll be sorry; an irregular scuttle. From under the hall couch, long white legs, clicking past her out of the front door. Five-footed, crimson-nailed, bone-coloured. The other mother's right hand. It wants the key.

**5.5 Something will have to be done**
Clip (montage): the marbles broken like empty wrens' eggs, kept in a small blue box; the tea leaves show a hand; Hamish with a gash in his side; Mr Bobo's mice frightened of a weasel (in his country, a trap with meat); her hand on the key: it doesn't want meat. At night a white hand leaps from her sill to the drainpipe, leaving gouges in the glass.
DECISION:
- A. **A trap.** (canon) → 5.6 (without `WELL_FOUND`, +2 s on the hold).
- B. **Never take the key off.** → **Ending B**.
- C. **Let it have the key: leave it on the step.** → **Ending C** (variant).

**5.6 The dolls' tea party**
Clip (3P): a paper tablecloth with red flowers; you don't play with dolls any more; they're protective coloration (the TV programme from 1.2 pays off).
DECISION 1:
- A. **The long way round:** the road, a fence, wasteland, an old drive, under a hedge in two trips for the water. (canon) → the hand never sees the trap laid.
- B. **Straight across the garden.** → it watches, and won't take the bait (→ **Ending B**). The inner voice warns once.
Clip (3P): the planks dragged off; a green, slippery brick throat; the cloth over it, a water-weighted cup every twenty centimetres, a doll by each.
Window: Miss Spink (light): Hamish is a brave little soldier; the man upstairs is Mister Bobo; Mr Lovat thought the well went down half a mile. Coraline says loudly that the key on its string is part of her game.
Clip (3P, long lens): swinging the key across the meadow; something bone-coloured keeps pace ten metres off; she can't whistle, so she sings her father's silly song, voice hardly trembling.
Clip (POV): hello, dolls; the lucky key laid in the middle, string held, breath held; the cloth holds; she lets go. Cherry cake for Jemima, Pinky and Primrose. Bone-white flickers closer. Jemima dropped her cake; she walks to the far side.
DECISION 2 (POV, the hold): keep her eyes on the dolls: hold 3 s at COURAGE 5+, 8 s below (+2 without `WARNED`, +2 without `WELL_FOUND`). The frame shakes with COURAGE.
- A. **Don't look.** (canon) → COURAGE +2, `WELL_TRAP`. A chittering rush on fingertips; a stump; tasting the air like a crab; one nail-clacking leap onto the cloth. Time slows. Fingers close on the key. Cups fly; cloth, key and hand fall into the dark. She counts. At forty, a splash. (Cross-book: with Sandman ending A, the cat's line about dreams and Daniel's theme.)
- B. **Look** (or let go early) → it freezes, tastes the air, backs away. → **Ending B**.
After A: the planks hauled back. Nothing in, nothing ever out. Can it see stars from down there?

**5.7 The first audience**
Clip (3P): the cat, the first time in days, leaps onto the planks and slowly winks; belly rub; it walks off like a patch of midnight at midday. Mr Bobo: the mice say you are our saviour, Caroline.
DECISION 1 (Window: Mr Bobo):
- A. **Correct him once more.** (canon) → `NAME +1`; he says Coraline with wonder and respect; she'll be the mice's first audience.
- B. **Let it go.** → still Caroline in the closing clip.
DECISION 2 (the parlour):
- A. **Return the stone and hug them both.** (canon; not if `STONE_LOST`) → `STONE_RETURNED`. Miss Forcible smells of garlic; no one has hugged Miss Spink like that since the stage.
- B. **Keep it.** → it sits by the relic in the library.
Clip (3P, night): the window wide open now; nothing about tomorrow frightens her; tiny silver music of the mouse circus on the night air; the meadow remembered; first stars; sleep.

### Hub: L.2 The reading table ◆

Clip (3P): she steps out of the Coraline door; it settles, keyhole dark. The black cat (the bible's hub rule) lays the black key on the reading table, dry, on its string, with a single black button threaded beside it. Lucienne: what goes down wells in stories ends up on her shelves; a key to a door shut for good, and an eye that no longer sees. Relic `button_key`; COURAGE saved. In Ending B she lays it down herself, string scored with scratches. Endings C and E: the door goes dark; return to the last choice. At CAT_TRUST 3 the cat talks in the library from now on.

---

## 4. Endings

Precedence when several apply: C, then E, then D, then B, then A.

| ID | Name | Requirement | What the player sees |
|---|---|---|---|
| **A** | *Protective coloration* (canon) | `STAKES=all`, SOULS 3, `PARENTS_SAVED`, the door shut (5.2), the trap chosen (5.5A), the long route (5.6A), the hold completed (5.6 D2A) | The hand goes down the well. The cat's wink, Mr Bobo, the stone returned, the mouse circus music on the night air. Relic earned. |
| **A-var** | *The first audience* ◆ | As A, plus CAT_TRUST 3, `STONE_RETURNED`, NAME 3 or more, `PLAYS_FAIR` on | One extra closing clip: the mice are ready. In the attic, by lamplight, the first performance of the mouse circus, with Coraline the only audience and the cat in the window. Mr Bobo says her name right without being told. |
| **B** | *The key around her neck* | Parents saved, but the hand not trapped: 5.5B, 5.6 route B, looking at the hand, or releasing the hold | She never takes the key off. Every few nights, scratching at the glass; tea leaves that keep showing a hand; Hamish never quite comes out from under the chair. Relic earned (she brings the key herself). Sets `HAND_LOOSE` (see cross-book echoes). |
| **C** | *For ever and always* (premature) | Agree to the buttons (2.6C), agree to stay (4.6C), hand over the marbles (5.1 D1C), the stone throw fails under `BELDAM_SUSPECTS`, or the variant: give the hand the key (5.5C) | POV only. The spool, the needle, black thread; the world goes glossy and dark, with the shine of a button where the light used to be. Last shot, 3P from behind and far away: three people at a kitchen table, smiling identical smiles, waving slowly. Variant (5.5C): weeks later, the bricks in the drawing-room door are simply gone, and a voice calls her darling. Offers "return to the last choice." No relic. |
| **D** | *The empty place* | Parents saved, fewer than 3 souls freed, or `STAKES=parents` | The picnic with one or more places set and untouched; or, with `STAKES=parents`, no picnic, only three pale shapes behind cold glass. Lucienne shelves the book with one chapter unfinished. Relic earned. In the library, once per visit, a cold small hand squeezes hers. |
| **E** | *Bricks* (premature) | Never goes back (3.2B), or escapes without the snow globe (5.1) | The flat stays empty. The mirror at the end of the hall shows only her. She sits on the cold bottom step at dawn and the cat does not come. Offers "return to the last choice." No relic. |

COURAGE does not lock an ending on its own; it changes how hard the last hold is and how the camera feels. The canon path reaches the +10 ceiling during Episode 4. A player who hesitates a few times usually reaches the tea party at around +5 to +7.

---

## 5. Consequence web

| Early choice | Echo |
|---|---|
| 1.1 `WELL_FOUND` | Shorter hold at the well; without it she has to find the well by Miss Spink's remark with the hand already following. |
| 1.2 `TRIED_RECIPE` | The attic temptation about meals without recipes falls flat (4.6); she eats the pineapple (5.3). |
| 1.2 protective coloration on TV | Pays off as her excuse for the dolls (5.6). |
| 1.4 `MICE_WARNING` | Option 2.1B (+1 COURAGE for knowingly opening the door). |
| 1.5 the stone | Protection in 2.4 and 2.6; the soul search in 4.2 to 4.6; the fallback throw in 5.1; returning it in 5.7. |
| 2.2 / 2.3 / 2.5 FOG | The "stay" option in the attic (4.6); the inner voice's tone. |
| 2.4, 3.4, 3.6, 4.7 CAT_TRUST | Whether the cat kills the rat and returns the third soul (4.7); whether there is a cat to throw (5.1); A-var; whether the cat talks in the library. |
| 2.5 `DOG_FRIEND` | One frame in the derelict theatre (4.3): a grey-muzzled dog-bat drops the torch at her feet. |
| 2.6 `BUTTONS_OPEN` | The spool and needle reappear in the attic (4.6) with a "stay" option. |
| 3.1 the stone, second chance | A late stone if she refused it in 1.5. |
| 3.2 going back | The master switch for the whole book (Ending E otherwise). |
| 3.5 `OF_TALKED` | Whether the other father is in the cellar at all (4.5). Her pressing him is what gets him punished. |
| 3.5 `SNOWGLOBE_SEEN` | The attic realisation (4.6), the bluff (5.1); Ending E otherwise. |
| 3.5B / 3.7C / 5.1B `BELDAM_SUSPECTS` | She guards the mantelpiece; only the thrown cat works in 5.1. |
| 3.8 `GHOST_PROMISE`, `STONE_HINT` | Whether the dead children are in the stakes (4.1); whether she is prompted to use the stone (4.2). |
| 4.1 `HAND_OATH` | The tall girl's warning at the picnic (5.4); the meaning of the hand. |
| 4.2 to 4.7 SOULS | Hands helping at the door (5.2); places at the picnic (5.4); Ending A vs D. |
| 4.5 the button pulled | The black button that comes back with the key in the library (L.2). |
| `PLAYS_FAIR` (4.2, 4.5, 4.6) | The winged girl's blessing (5.4); A-var. |
| 5.4 `WARNED` | Length of the final hold. |
| NAME | Mr Bobo says "Coraline" unprompted in A-var. |

### Cross-book echoes

From the series bible:

| If the player has... | Then in... | This happens |
|---|---|---|
| Finished Coraline, COURAGE 4 or more | Sandman 2.4, the Oldest Game | A fourth answer at the last round: "I am a child who is not afraid." It also wins. |
| Sandman ending A | Coraline 5.6, the well | The cat says the Sandman's line about dreams; the hand's fall is scored with Daniel's theme. |
| The Angel's key (Neverwhere) | Coraline 3.5, the locked door home | The Angel's key rattles in the lock but does not fit; Coraline remarks on it. |
| The button key (Coraline) | The Alchemist, the crystal shop | The merchant: "A key with no door is a dream with no action." |
| Finished Coraline | The library hub | The black cat appears in the library (in this map: speaks to her only at CAT_TRUST 3). |

Proposed new echoes:

| If the player has... | Then in... | This happens |
|---|---|---|
| Sandman MERCY 4 or more | Coraline 4.5, the cellar | An extra option in the window: tell the thing that was the other father that she is not angry with him, and that it can stop. He holds still for one breath longer than he can bear, and she climbs the steps without a chase. Same COURAGE +1, no chase; MERCY +1. |
| Coraline CAT_TRUST 3 | Sandman 7.6, the Wake | A black cat sits among the mourners, apart from everyone, washing a paw. Cats walk between dreams in the Sandman source, so it is in character. No line, one shot. |
| Coraline `HAND_LOOSE` (Ending B) | Neverwhere, the Floating Market | A stallholder has a bone-white hand with crimson nails in a birdcage, found scuttling in the sewers looking for a key. If she carries the button key, it throws itself at the bars. Flavour only. |

---

## 6. Conversation windows

Each window maps free talk onto the authored exits listed. "Open" means no exit is required (the window is texture).

| Scene | Character | What the player might try | Authored exits |
|---|---|---|---|
| L.1 | Lucienne | Ask about the small door, the house, what she should take, whether she has been there | Open |
| 1.4 | Mr Bobo (real) | Ask about the mice, the circus, his country, the message, her name | 1.4.A correct the name / 1.4.B ask about the door / 1.4.C thank the mice |
| 1.5 | Miss Spink and Miss Forcible | Ask about their acting, the danger, the dogs, Portia vs Ophelia; laugh at the leaves | 1.5.A take and keep the stone / 1.5.B take it, leave it home / 1.5.C refuse it |
| 2.2 | The other mother (and other father) | Ask who they are, where her real parents are, why buttons; flatter; refuse; test the food | 2.2.A eat / 2.2.B refuse |
| 2.4 | The cat | Argue that cats don't talk, ask its name, apologise, ask about "here", tease it | 2.4.A apologise / 2.4.B insist cats don't talk |
| 2.6 | The other mother and other father | Stall, ask why, ask if it hurts, try to bargain, agree, refuse | 2.6.A refuse and leave / 2.6.B "I'll think about it" / 2.6.C agree |
| 3.1 | The police officer (voice) | Explain calmly, beg, joke, be furious, describe the other mother | 3.1.A report calmly / 3.1.B beg / 3.1.C hang up |
| 3.3 | The other mother | Demand her parents, accuse her, accept comfort, mock her, run | 3.3.A "you don't frighten me" / 3.3.B the hot chocolate / 3.3.C run |
| 3.4 | The cat | Ask why she wants her, what she is, for advice, for a way out; offer it dinner | 3.4.A advice / 3.4.B what she is / 3.4.C a way out |
| 3.5 | The other father | Coax, sympathise, trick him into talking, ignore him | 3.5.A get him talking / 3.5.B leave him |
| 3.7 | The other mother | Refuse, insult, bargain, play along, go for the key | 3.7.A "you are not my mother" / 3.7.B eat a beetle / 3.7.C go for the key |
| 3.8 | The ghost children (voices) | Ask their names, how they died, how long; comfort them; ask how to escape | 3.8.A promise and comfort / 3.8.B promise only / 3.8.C plan to flee |
| 4.1 | The other mother | Negotiate stakes, prize, game type and oath in any order; probe for her weakness | 4.1.D1 A/B; 4.1.D2 A/B; 4.1.D3 A/B; 4.1.D4 A/B (four exits must all be reached; the model may resolve several in one turn) |
| 4.4 | The other mother | Taunt her, thank her, refuse the key, ask what's in the flat | 4.4.A use the key / 4.4.B refuse |
| 4.5 | The thing that was the other father | Pity, ask questions, threaten, plead, encourage him to fight her | 4.5.D1 A pity / B silence / C threaten (D2 is a timed POV beat, not talk) |
| 4.6 | The other Mr Bobo | Interrogate the temptation, bargain, consider it, mock the copy | 4.6.A "I don't want whatever I want" / 4.6.B bargain / 4.6.C stay (gated) |
| 5.1 | The other mother, huge | Bluff, demand, stall, provoke her to gloat, offer the marbles | 5.1.D1 A bluff / B honest demand / C hand over the marbles |
| 5.4 | The three children | Ask what comes next, where they're going, their names, for a clue; ask them to stay | 5.4.A ask for a clue / 5.4.B insist it's over / 5.4.C ask them to stay |
| 5.6 | Miss Spink | Ask after Hamish and Mr Bobo; make sure the key is mentioned loudly | Open, but the model must let Coraline say the key line aloud before the window closes |
| 5.7 | Mr Bobo (real) | Ask about the mice, the concert, his family, the weasel | 5.7.D1 A correct the name / B let it go |
| L.2 | Lucienne (and the cat at CAT_TRUST 3) | Talk about what happened, the key, the button, what comes next | Open |

Character card notes for this book (beyond `ai-dialogue-design.md` §4):
- **The other mother.** Voice: warm, sing-song, maternal words used as tools ("my darling", "manners", "for your own good"). Wants: something to love that isn't her, and to eat. Red lines: she never admits the parents are in the snow globe; she never plays fair; she never says what she is. She loves games and cannot resist gloating; the model should let a clever player use that.
- **The cat.** Voice: dry, sarcastic, a man's voice, the voice at the back of her head. Never gives its name; never answers "what is she"; respects politeness and despises being squeezed.
- **The ghost children.** Archaic speech (thou, aye, peradventure, 'tain't). They remember images, not names. They cannot leave, cannot touch the door, and will not promise what comes after.
- **Guardrail specific to this book:** the temptation lines (3.3 mirror, 4.6 attic) may only use what is in the book. The model must not use anything from the player model or memory log about her real family to make them land harder (see §9).

---

## 7. Cast list

Descriptions in the realistic register of `character-prompts.md` §3, for building reference sheets later. Every character also gets one surreal detail.

**Coraline Jones (the player, your wife).** Her own face exactly, bone structure, eyes, brows and proportions untouched; the book gives Coraline hazel eyes, so keep hers whatever colour they are. Her own hair, worn loose and a little untidy, damp strands falling over her eyes in the fog. Real-world clothes: a blue hooded coat, a red wool scarf, yellow wellington boots; at night a long T-shirt, pyjama bottoms, a blue towelling dressing gown with deep, heavy pockets, worn slippers; from 4.7 on, a ripped pyjama knee, a skinned palm, dried blood. Other-world clothes: black jeans like velvet night, a smoke-grey sweater with tiny real stars twinkling in the knit, bright orange boots. From 5.3, an old black iron key on a piece of string under her T-shirt. Expression: curious, stubborn, frightened, and going on anyway.
SURREAL DETAIL: standing in a lit doorway, her shadow on the carpet is a thin giant woman, far longer than the room.

**Mrs Jones (her mother).** Cast a generation older than the player. A practical, busy woman with short hair she doesn't think about, reading glasses pushed up on her head, a cardigan over a work shirt, car keys and a purse always about to be forgotten. Her study smells of flowers. Warm but distracted: she talks to shop assistants over Coraline's head and buys clothes to grow into. In the mirror (3.1) she looks sad and lost, her husband's arm round her.
SURREAL DETAIL: in Episode 5 a fine dust of glitter snow, which never melts, still clings to her hair and shoulders.

**Mr Jones (her father).** Same generation as Mrs Jones. A balding head, kind grey eyes behind glasses, a soft jumper with the sleeves pushed up, often an apron and a wooden spoon: he cooks recipes nobody asked for. He works at a computer with his back to the door and talks without turning round. In the wasp flashback, younger, in big brown boots and gloves, charging uphill like a rhino.
SURREAL DETAIL: in raking light, thirty-nine faint pale marks on his neck and forearms, the wasp stings from the story.

**The other mother, early form (Episodes 2 and 3).** At first glance Mrs Jones, and wrong in measured ways: a head taller and thinner, skin white as paper, fingers too long and never still, curved dark-red nails. Two large, glossy black buttons sewn where her eyes should be, the black thread vanishing into the skin, catching the window light like wet stones. Mrs Jones's clothes with an apron over them, a deep front pocket that clinks with keys. A smile with a full set of teeth, each one a fraction too long. Black hair, wet-looking.
SURREAL DETAIL: her hair drifts slowly around her head like weed under the sea, while nothing else in the kitchen moves.

**The other mother, late form (the beldam, 5.1).** Huge: her head almost brushes the ceiling. Skin the bluish pale of a spider's belly, stretched thin over long joints; arms and fingers so long they read as legs. The buttons dull and expressionless now. Hair writhing and twining like living things; teeth sharp as knives; lips thin and pale. Where the cat has raked her, black tarry ooze runs instead of blood. She stands statue-still, then moves all at once.
SURREAL DETAIL: the pattern of the wallpaper and the mist in the window bend gently towards her, like threads towards the centre of a web.

**The other mother's right hand (Episode 5).** A long white right hand, severed cleanly at the wrist with no blood and no wound, the colour of bone. Crimson curved nails, slightly chipped from glass. It runs high on its fingertips like a crab, five-footed, tapping and clicking, and pauses on stumps to taste the air. Fast, then utterly still.
SURREAL DETAIL: its shadow on the grass is the shadow of a large spider, a leg too many.

**The other father, early form.** Mr Jones with buttons for eyes, sitting at a desk that looks just like his but doing nothing at all, not even pretending. Same clothes, a little too clean. From Episode 3 his face loses its lines and pores, smoothing out like bread dough beginning to rise. Hands folded in his lap; a finger to his lips.
SURREAL DETAIL: the keyboard in front of him has no letters on the keys.

**The other father, late form (the thing in the cellar, 4.5).** The size and rough shape of a person, pale and swollen like a grub, with stick-thin arms and feet. A face with almost no features, puffed like risen dough, pale strands stretching between the lips when the mouth opens. Two black buttons pressed into the dough; the left one falls off. Skin tacky, like warm bread dough to the touch. Huge, miserable, and dangerous.
SURREAL DETAIL: with twig fingers he pushes the clay of his own face into something like a nose, and it slowly sags.

**The black cat.** A large, haughty black cat, short dense coat with a faint sheen, green eyes that flash when it yawns, a mouth and tongue of astonishing pinkness. Tail held high and curling at the tip like a question mark. In the white nothing its fur stands straight out and its tail drops between its legs; carried, it trembles and seems smaller. Whiskers turn gold in afternoon light.
SURREAL DETAIL: it walks behind a tree trunk and does not come out the other side; its shadow arrives a beat after it does.

**Miss Spink (April).** Old, small and round, bundled in so many pullovers and cardigans that she looks like a large fluffy egg. Thick glasses that make her eyes look huge. Short-sighted; peers into teacups. Leads a scrum of ageing Scottie dogs on tartan leads. Talks about her Portia and the flowers men sent to her dressing room.
SURREAL DETAIL: in her thick lenses, instead of the window, a tiny lit stage with a red curtain.

**Miss Forcible (Miriam).** Old and round too, knitting hard in an armchair, a character actress who once played the nurse in *Romeo* and Lady Bracknell. Firm, practical, scoffing, kind. Smells of the raw garlic she has been cutting. Wears an apron over a woollen dress.
SURREAL DETAIL: the knitting on her needles never ends; it runs off her lap, across the carpet and out under the door.

**The other Miss Spink and Miss Forcible (the theatre, 2.5).** Two young women, thin, pale and quite pretty, with black-button eyes. The other Miss Spink in green tights and high brown boots to the thigh; the other Miss Forcible in a white dress with flowers in long yellow hair. Behind them on the stage, the round old bodies they stepped out of, hanging open like empty shells.
SURREAL DETAIL: the empty old faces behind them are still smiling.
*Late form (4.3):* twice Coraline's size, sealed in a greyish-white sac like a spider's egg case on the back wall: two heads, four arms, four legs, two lumps of wax melted together; four button eyes; one voice wails, the other buzzes.
SURREAL DETAIL: the sac crackles softly, like a tiny fire, whenever anything moves.

**Mr Bobo, the crazy old man upstairs.** An old man with a big moustache, from a fine old circus family (Romanian or Slovenian or Livonian, Miss Spink can never remember). Slow on the outside steps, a milk bottle in one hand, a waistcoat and an old jacket; his flat smells of pipe tobacco, strange foods and sharp cheesy things. Gets her name wrong, eagerly, every time, until the very end.
SURREAL DETAIL: from his waistcoat pocket peeps a silver tuba the size of a thimble.

**The other Mr Bobo.** The same man with big black-button eyes, in a long raincoat and a tall black hat, the hunger plain in his face. Lumps slide restlessly under his clothes where the rats live. In the attic he is only a bundle of coat and hat with a dry, rustling voice, and then he falls apart into rats.
SURREAL DETAIL: the largest rat sits on his head under the hat, and its red eyes show through a moth hole in the brim.

**The ghost children.** Behind the mirror: three shapes about Coraline's own size (child-sized beside her adult frame), faint and pale as a moon in the daytime sky, afterimages more than bodies. At the picnic, solid and warm:
- *The boy* (first soul, the toybox marble, ember red): the smallest, red-velvet knee-britches, a frilly white shirt, a dirty face, a trembling lower lip he bites to stop.
- *The tall girl* (second soul, the theatre, cherrywood brown): a shapeless brown dress and a brown bonnet tied under her chin, jam round her mouth, a big bread knife.
- *The winged girl* (third soul, the attic, star blue-white): very pale, dressed in spiders' webs, a circle of glittering silver in blonde hair, dusty silver butterfly wings.
(The book does not say which marble is which child. This mapping follows the colours: the brown glow and the brown dress, the star-white glow and the circlet "glittering like a star".)
SURREAL DETAIL: each child carries, somewhere on them, the colour of their soul: the boy's cheeks ember-flushed, the tall girl's buttons polished cherrywood, the winged girl's circlet shining blue-white.

**The rats.** Short soot-black fur, little red eyes, pink paws like tiny hands, pink hairless tails like long smooth worms. They form pyramids and sing in high, whispery voices. The largest and blackest has an unpleasant sort of smile and carries the third marble in its forepaws.
SURREAL DETAIL: when they build their pyramid, the shadow on the wall is of one tall thin woman.

**The dogs.** Ageing Highland terriers: Hamish, Angus, Bruce, Jock, Andrew. The usher at the theatre: a large black Scottie with a grey muzzle, carrying a torch in its mouth, gruff. The little dog in the next seat: whispering, greedy for chocolates, hates toffees. In 4.3, the dog-bats: hairless and jellyish, faces that might once have been dogs, bat wings, hanging upside down like spiders and bats.
SURREAL DETAIL: the theatre dogs' eyes reflect the stage as two tiny button-shaped lights.

**The police officer.** Voice only: deep, gruff, reassuring, smiling, completely unhelpful.

**Lucienne.** As in `character-prompts.md` §3.6. Cameo in L.1 and L.2.

---

## 8. Recurring locations

- **The house, real:** a very old manor split into flats, huge old trees, outside steps past Coraline's door up to the attic, in rain, fog and late-summer sun.
- **The house, other (four states):** identical but for the flashing blue and red bulbs round the Spink and Forcible door; then twisted and crouching; then a photograph; then a charcoal scribble on grey paper.
- **The drawing room and the door:** grandmother's furniture, the bowl-of-fruit painting, the lion-footed table, the heavy glass ashtray, the carved door in the corner onto bricks. Other version: the fruit eaten, the table clawing the carpet.
- **The passage between:** cold, musty, very old and slow; on the way back, uphill, furred, breathing, wet as a mouth.
- **The hallway and the mirror:** a full-length mirror that was once a wardrobe door; behind it in the other flat, the broom-cupboard cell with one glass wall.
- **The kitchen:** real (microwave, keys on the doorframe, freezer pizza); other (roast chicken, omelette, bacon under the grill, the china plate with needle and buttons).
- **Coraline's bedroom:** real (toybox, window, the curtains open at the end); other (green and pink, wind-up angels, chattering skulls, the toybox of forgotten things).
- **The studies and the parents' bedroom:** two studies, the father's keyboard, the clock reading 3:12.
- **The Spink and Forcible parlour:** furniture polish and dogs, photographs of pretty women, framed programmes, the jar on the mantelpiece.
- **The theatre:** alive (velvet, rows of dogs, the high wooden stage); derelict (broken chairs, cobwebs, rotting velvet, the sac on the back wall, dog-bats).
- **Mr Bobo's attic:** real (seen only from the doorway); other (low slanting ceilings, rot, red eyes, the last room).
- **The garden:** the tennis court with the rotten net, the rose garden, the rockery, the fairy ring, and the boarded well in the long grass of the meadow.
- **The edge of the world:** woods that become the idea of trees, then the white nothing with no ground.
- **The empty flat and its cellar:** milk-coloured walls, the spider in the bath, the trapdoor ring, the crude paintings, the heap of curtains.
- **The long way round:** the road, the fence, the wasteland, the old drive, the hedge.
- **The wasteland gully** (told memory, ◆ flashback): thrown-away cookers and broken dolls, a stream, a cloud of wasps.
- **The department store:** grey school-style clothes, Day-Glo gloves, frog and duck wellingtons.
- **The picnic meadow** (dream): the old oak, the linen cloth, the little wooden bridge over the stream under a huge moon.
- **Lucienne's library:** the Coraline door on the Doors wall; the reading table.

---

## 9. Production and adaptation notes

- **Perspective budget.** 3P with the hero visible for establishing shots and emotion (the theatre, the picnic, home); POV for every decision and for the sac, the cellar, the corridor, the hold at the well. Hero-visible clips need Kling subject binding from your wife's reference sheet.
- **Hand-held shake is applied by the app, not generated.** Generate clips as steady hand-held, then add shake as a transform scaled by COURAGE (and by FOG, which adds a slow drift). This gives a continuous visible effect without extra generations.
- **Plates.** Every location in §8 is generated as a real plate and an other plate; the other house needs four plates (perfect, wrong, photograph, charcoal). Lock these before any clips.
- **Clip naming.** `2.6_buttons[stone|nostone]`, `4.3_sac[dogfriend]`, `5.2_door[souls:2][globe]`, `5.4_picnic[souls:3]`.
- **Recommended first build:** L.1 plus Episode 2 (through the door, the other mother, the cat, the theatre, the buttons). It is the most visually rich episode, it shows both houses, and it ends on the passage home.
- **Adult casting, the only line changes needed:** school-clothes shopping becomes clothes for the new term; the policeman drops "after your bedtime" but keeps the condescension; "small for her age" in narration becomes framing (the house is shot large around her); her father "lifts her off her feet" rather than carries her like a child; the night before school becomes the night before the new term. Everything else plays as written. Alternative, if you would rather keep Coraline a child: a consistent child face in 3P and your wife's voice and POV only. Not recommended, since it removes her from the screen.
- **Verse.** The rats' three songs and the father's made-up song are short poems in the book. Do not generate them into video text. Either have the voice actors read them from your own copy (private use) or write new verses for the game.
- **Never render her face with button eyes, or a needle near her eye.** Ending C is POV only. The other characters can have buttons; she never does.
- **Spiders.** Coraline dislikes spiders, and the book leans on it: a spider across her hand in the dark, a dead spider the size of a cat in a bath, the beldam's spider-belly form, the hand's spider shadow. If your wife has a real fear of spiders, keep the images but offer a "look away" toggle as in Sandman 2.6.
