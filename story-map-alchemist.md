# The Alchemist: interactive story map (v0.1)

**Source:** `source-text/alchemist.txt`, Paulo Coelho, *The Alchemist*, translated by Alan R. Clarke (HarperCollins edition; printed page numbers cited as p. N). Every scene comes from the full text. Additions are marked **◆** and kept rare: the library door (0.1), Lucienne's single dream visit (2.3), and a few short variant clips flagged where they occur.

**Player character:** Santiago, the Andalusian shepherd. The novel calls him "the boy" almost throughout; the app's narrator says Santiago.

**Series place:** Book 4 of *The Library of Doors* (`series-bible.md`). Entered through the fourth door in Lucienne's library. Trait shaped: FAITH (`profile.traits.faith`). Relic earned: Urim and Thummim, the two stones (`"stones"`). In this series the recurring dream of the Pyramids was sent from the Dreaming.

---

## 0. Design pillars

1. **You are Santiago, and you are seen.** Hybrid perspective. Cinematic third-person (3P) for travel, landscapes and emotional beats, so she watches herself cross the strait, ride the dunes, stand at the well. First-person POV for the moment of every decision and for tense beats (the thief's empty space in the crowd, the sword at the forehead, the cobra, the faceless refugees). The chosen option then plays out in 3P.
2. **Hand-held, as if carried by a fellow traveller.** Every clip has natural breathing shake, small reframes, and focus that hunts for a moment when something new enters. Steadier in the crystal shop and the plaza, looser on camelback and in the simum, almost still at the Pyramids. Never action shaky-cam.
3. **Warm, sunlit, fable-like. The gentlest of the four books.** Golden-hour Andalusia, white Tangier, the yellow and blue of the desert, moonlight like silver on stone. Danger is real (a thief, a war, a sword, a beating) but shown briefly: blood is a single drop on a forehead or a split lip, the battle is seen from far away. The shared Style Bible in `character-prompts.md` asks for a muted palette, so this book appends one palette line after it (warm amber and ochre, deep clear blue sky, soft golden key light) instead of editing the Bible. Period is deliberately timeless, loosely early twentieth century (Esperanto, rifles, a chrome-plated revolver); no engines, no electric light on screen.
4. **Decisions are about faith, never combat.** Three questions repeat through the book: do you turn back, whom do you trust, how do you read the omen. Every "go home" option is a real, gentle ending, never a punishment.
5. **The heart is the inner voice.** In the source, Santiago's heart literally talks to him (pp. 133 to 137). The "AI thought" from `ai-dialogue-design.md` §2.2 is therefore his heart: anxious and bargaining at low FAITH, quiet and certain at high FAITH. Before 6.1 it speaks only in hunches; from 6.1 it speaks as a voice.
6. **Omens are on screen.** At seven marked beats an omen passes through the frame before the decision (the butterfly, the stones through the hole, the thirsty man, the stones falling again, the hawks, the scarab, the falcon over the camp). If she taps it before choosing, the heart says one line, FAITH +1 and `OMENS_READ` +1. Untapped, nothing is lost but the line. Marked **Omen** in §3.
7. **The tests.** The alchemist says the Soul of the World tests everything learned before a dream is realized. So the book's blows (the robbery, the forgotten year, the gold taken by the general, the dead on the first day, the beating) drain FAITH automatically, and the choice right after each blow is the way back. Marked **Test** in §3.
8. **No mid-story game over. Same place, different light.** Danger always resolves. Key places are generated in two or three states: the ruined church at dusk with sheep and at night with a shovel; the Tangier market full and empty; the crystal shop dusty and thriving; the oasis at peace, armed, and (variant) raided.

---

## 1. State variables

| Variable | Range | Moved by | What it changes |
|---|---|---|---|
| **FAITH** (`profile.traits.faith`) | -10 to +10, starts at the profile's current value | Nearly every decision. Trusting the dream, reading omens and going on raise it; cynicism, hiding the dream and turning back lower it. Tests drain it. | Which endings are reachable; the heart's voice; clarity of the hawks vision (5.4); hints in the wind sequence (6.4); whether the truth can be spoken at 7.2; the kiss on the levanter (7.4). |
| **OMENS_READ** | 0 to 7 | Tapping an on-screen omen before a decision | One heart line each; four or more is required for the A postscript. |
| **COURAGE, LOYALTY, MERCY** | shared traits, -10 to +10 | Light touches only. COURAGE at 5.6, 6.2, 6.4. LOYALTY at 3.4, 5.10, 7.4. MERCY at 1.5, 2.2, 7.2. | Cross-book echoes (§5). |
| **PURSE** | visual state, not shown as a number | Sheep money, crystal savings, the fifty gold pieces, the monastery gold | Costume and props in each clip: shepherd's wool, white linen, rags. |

FAITH thresholds: **2** the hawks vision is clear (below, it is blurred and doubtful). **3** Santiago can find the words at 7.2 (below, option A is greyed: the words will not come). **5** the levanter carries Fatima's kiss and Ending A is reachable. **6** the heart whispers hints in 6.4. **10** at the end, with flags, unlocks the A postscript.

Flags (stored at `profile.flags.alchemist`): `DREAM_CHASED`, `DAUGHTER_TRUTH`, `GYPSY_OATH`, `KING_BELIEVED`, `BAKER_TOLD`, `SOLD_SHEEP`, `HEDGED`, `STONES_ASKED`, `ROBBED_TANGIER`, `OWNER_HEEDED`, `ADVENTURER`, `THIEF_FORGIVEN`, `HOLE_LEFT`, `DREAM_OPEN`, `WORDLESS`, `DREAM_TOLD_MERCHANT`, `MECCA_URGED`, `TEA_IN_CRYSTAL`, `MERCHANT_BLESSING`, `ENGLISHMAN_FRIEND`, `BOOK_THROWN`, `CAMEL_DRIVER_FRIEND`, `TRADITION_BROKEN`, `FATIMA_HURT`, `HAWKS_OMEN`, `HORSEMAN_TEST`, `COUNSELOR`, `LIFE_FOUND`, `FATIMA_PROMISE`, `HEART_FRIEND`, `TURNED_INTO_WIND` / `WIND_BORROWED`, `TRUTH_TOLD`, `SYCAMORE_KNOWN`, `SYCAMORE_TREASURE`, `STONES_IN_CHEST`, `TENTH_PAID`.

---

## 2. Structure at a glance

Seven episodes following the book's own order. **40 core scenes** plus the library door, about **22 variant clips**, **4 endings** with 3 variants.

| Ep | Title | Pages | Place and time | Core scenes | Key fork |
|---|---|---|---|---|---|
| 1 | The dream at the ruined church | 3 to 34 | Andalusia and Tarifa, three days | 7 | Sell the flock, or go back to the merchant's daughter |
| 2 | A stranger in a strange land | 34 to 49 | Tangier, one day and one night | 5 | Victim or adventurer; keep the stones or sell them for a ticket home |
| 3 | The crystal shop | 53 to 68 | Tangier, eleven months | 5 | Buy the sheep back, or join the caravan |
| 4 | The caravan | 68 to 89 | The Sahara, some weeks | 4 | Books or the caravan; throwing the book away |
| 5 | Al-Fayoum | 89 to 128 | The oasis, about a month | 10 | Fatima; the hawks; stay at the oasis or go |
| 6 | Into the wind | 128 to 164 | The desert at war, about two weeks | 5 | Listening to the heart; turning into the wind |
| 7 | The treasure | 165 to 173 | The Pyramids, then Andalusia | 4 | Telling the refugees the dream; the stones in the chest |

---

## 3. Episode by episode

Format per scene: **Setting** → **Clip** (3P or POV) → **DECISION** → consequences. "Window" means a conversation window (§6): free talk that ends on one of the authored exits listed.

**0.1 The door in the library** ◆ (hub, not counted as a core scene)
Setting: Lucienne's library, the Doors wall. The fourth door is pale weathered acacia with a brass ring, *The Alchemist* carved above it. A warm draught under it smells of dust and sheep's wool.
Clip: 3P. Lucienne lifts her lantern and tells the player this dream was one of the Dreaming's, sent to a shepherd who read books. She opens the book at its first page, the prologue (p. vii): by a caravan fire, an old alchemist reads the story of Narcissus and the lake that wept because it saw its own beauty in his eyes. The door opens onto Andalusian dusk.
*(No decision. Lucienne's greeting varies by books finished; after Coraline and Neverwhere she notes this one is gentler.)*

### Episode 1: The dream at the ruined church (pp. 3 to 34)

**1.1 The ruined church and the sycamore** (pp. 3 to 11)
Setting: Andalusian hills at dusk. A small abandoned church, the roof long fallen in, an enormous sycamore growing where the sacristy stood. About sixty sheep.
Clip: 3P, golden hour. Santiago drives the flock through the ruined gate, lays planks across it, lies down with a book for a pillow. Dream grade (soft, overexposed, drifting): a child plays among the sheep, takes both his hands, and the field becomes sand under the Pyramids; a treasure is hidden here, and the child begins to point. POV: stars through the broken roof. The second time the dream has stopped at that moment.
DECISION:
- A. **Get up, take the crook and wake the sheep by name.** (canon) → FAITH 0.
- B. **Close your eyes and try to go back into the dream.** → FAITH +1. Flag `DREAM_CHASED`. Two more seconds of dream: the child's finger points down at the sand. (◆ variant beat)
- C. **Blame the place: the church must be haunted.** → FAITH -1. The sheep stir uneasily; the text has the boy feel a strange anger toward his flock that morning.
Bridge clip: walking toward Tarifa at sunrise, the heavy jacket over his arm (he thinks of its weight in the heat and its warmth at dawn).

**1.2 The merchant's daughter** (pp. 5 to 10, memory)
Setting: a year ago, the steps of a dry-goods shop in a village four days away. Warmer grade, a little soft at the edges.
Clip: 3P. Santiago reads on the steps while the merchant is busy. A girl's voice behind him is surprised that shepherds can read: flowing black hair, eyes that recall the Moorish conquerors. They talk for two hours; she says every day in the village is like the one before. POV on her question: if he can read, why is he only a shepherd?
DECISION:
- A. **Mumble something and change the subject.** (canon) → FAITH 0.
- B. **Tell her the truth: the seminary, your father, and that you chose the road to see the world.** → FAITH +1. Flag `DAUGHTER_TRUTH`.
- C. **Tell her a story from a book as if it happened to you.** → FAITH -1. (In the text he plans to do exactly this, since she cannot read.)
Inset, no decision: his father handing him three ancient Spanish gold coins to buy a flock, and a blessing with a buried wish to travel in his eyes (p. 9).

**1.3 The gypsy in Tarifa** (pp. 11 to 16) · Window
Setting: a back room behind a curtain of coloured beads: a table, two chairs, an image of the Sacred Heart.
Clip: 3P, then POV as the old woman takes both his hands and prays. His childhood fear of gypsies returns; he silently says an Our Father. He tells the dream. She will charge nothing now, but wants one-tenth of the treasure if he finds it, and he must swear before the Sacred Heart.
DECISION (window exits):
- A. **Swear.** (canon) → FAITH 0. Flag `GYPSY_OATH`. Her reading: go to the Pyramids. He is irritated that he needed no one to tell him that.
- B. **Refuse and pay the fee.** → FAITH -1. She reads his palm and tells him nothing he can use. (◆ variant)
- C. **Pull your hands away and leave.** → FAITH -2.
All routes end on the text's coda: he decides never to believe in dreams again, trades his book for a thicker one, and sits in the plaza with new wine.

**1.4 The king of Salem** (pp. 17 to 26) · Window
Setting: the plaza in Tarifa, afternoon. A bench, a bakery at the corner, people hurrying.
Clip: 3P. An old man in Arab dress asks for a sip of wine and names the world's greatest lie: that fate takes control of our lives. He is the king of Salem. A stick in the sand, a flash from under his cape; POV on the sand: his parents' names, the seminary, and the merchant's daughter's name, which he never knew. Melchizedek explains the Personal Legend, the baker who will see Africa only when old, the emerald miner. His price: a tenth of the flock, tomorrow at this hour.
DECISION (window exits):
- A. **Listen, half-believing, and ask about the treasure.** (canon) → FAITH 0.
- B. **Believe him at once.** → FAITH +1. Flag `KING_BELIEVED`. He smiles and talks about beginner's luck.
- C. **Take your book back and leave him on the bench.** → FAITH -2. He vanishes round the corner with the appointment still made; he always appears in one form or another.
If she offers a tenth of the treasure instead, the king is disappointed (promising what you do not have kills the desire to earn it) and the window continues.

**1.5 The baker and the ticket window** (pp. 26 to 27)
Setting: the bakery the king pointed at; then the small building at the city gates that sells tickets to Africa.
Clip: 3P, then POV across the bakery counter at the baker's floury, contented face.
DECISION:
- A. **Say nothing about what the king said.** (canon) → FAITH 0, MERCY +1. (He spares the baker three days of wanting to give it all up.)
- B. **Tell him he could still go to Africa now.** → FAITH +1, MERCY -1. Flag `BAKER_TOLD`. The baker's smile falters.
Then, no decision: at the ticket window he says maybe tomorrow; from behind the glass, the ticket seller tells his assistant there goes another dreamer with no money.

**1.6 The levanter on the fort walls** (pp. 27 to 29)
Setting: the Moorish fort at Tarifa's highest point. Africa across the strait; the plaza below; the wind rising.
Clip: 3P wide on the wall, hand-held, hair and jacket whipping. He curses meeting the old man and thinks of every sheep he knows (the lame one, the one due in two months). POV down into the plaza: a young couple kiss on the bench where he talked with the king. The levanter strengthens, carrying the smell of the desert and of veiled women.
DECISION (first turning point):
- A. **Sell the flock. Bring the old man six sheep tomorrow.** (canon) → FAITH +2. Flag `SOLD_SHEEP`. Next noon: his friend bought all the others at once, saying he always dreamed of being a shepherd. A good omen.
- B. **Go back to the flock and on to the merchant's daughter, as planned.** → **Ending B1.**
- C. **Sell them, but tell yourself it is only for a year.** → FAITH +1. Flag `HEDGED`. The heart argues for home more loudly at 2.5 and 3.5.

**1.7 Six sheep and two stones** (pp. 29 to 34)
Setting: the plaza at noon; then the fort wall at sunset.
Clip: 3P. The king notices the lame sheep; Santiago defends it as the cleverest. The treasure is near the Pyramids; follow the omens. A butterfly passes between them. From a gold breastplate set with stones the king prises a black and a white stone: Urim and Thummim, yes and no; ask clear questions, but decide for yourself. Inset (20 s): the boy carrying a spoon with two drops of oil through the wise man's palace.
**Omen:** the butterfly (his grandfather said butterflies are good omens).
DECISION:
- A. **Pocket the stones and promise yourself to make your own decisions.** (canon) → FAITH 0.
- B. **Ask him to name the exact spot.** → FAITH -1. He will not; the omens will.
- C. **Test the stones on him: is this old man telling the truth?** → FAITH -1. Black: yes. He sighs. Flag `STONES_ASKED`.
Coda, 3P, the one shot through another's eyes: Melchizedek on the fort wall, the levanter in his face, his new sheep fidgeting, watching a small ship leave port. He hopes the boy succeeds, and wishes he had repeated his name.

---

### Episode 2: A stranger in a strange land (pp. 34 to 49)

**2.1 The bar and the sword** (pp. 34 to 39) · Window
Setting: a bar in the narrow streets of Tangier, men passing a huge pipe; then the great market: vegetables among daggers, carpets beside tobacco.
Clip: 3P. The call to prayer from a tower, everyone kneeling; he feels alone (a flicker of the saint on the white horse from his childhood church). Only Arabic is spoken. Bitter tea. A young man in Western dress, his own age and height, speaks to him in Spanish. Santiago asks him to be his guide. POV: the bar owner standing close, listening, uneasy. The young man asks whether he has enough money.
DECISION (whom to trust):
- A. **Show him the money and go with him.** (canon) → FAITH 0. The owner grabs Santiago and shouts in Arabic; the young man pulls him out, says the owner wanted his money, and takes the money himself to buy two camels.
- B. **Keep the pouch closed and look to the bar owner.** → FAITH 0. Flag `OWNER_HEEDED`. You cannot understand his angry warning; the young man still leads you into the market.
The robbery (all routes). POV: the most beautiful sword he has ever seen, scabbard embossed in silver, black hilt set with stones. He asks his friend to ask the price, realizes he looked away, feels his chest squeeze, and makes himself turn round slowly. A hand-held whip pan across the crowd: nobody. (In B the pouch strings are cut at the same moment.) Flag `ROBBED_TANGIER`.
**Test:** FAITH -2. The stalls come down at the call to prayer; the sun sets behind the white houses.

**2.2 The empty marketplace** (pp. 39 to 43)
Setting: the same plaza at night, empty.
Clip: 3P, then POV. He weeps for the first time, even his sheep never saw him cry, believing God unfair and imagining the bitter man he will become. In the pouch: the heavy book, the jacket, the two stones. He understands now that the bar owner was trying to warn him.
DECISION 1 (the text frames this exact choice):
- A. **"I'm an adventurer, looking for treasure."** (canon) → FAITH +2. Flag `ADVENTURER`.
- B. **"I'm the poor victim of a thief."** → FAITH -2, MERCY -1. The heart turns bitter until Episode 4.
- C. **Sell the stones at dawn and buy a ticket home.** → **Ending B1** (no relic: the stones are sold).
- D. *(only if MERCY ≥ 6 from Sandman)* **Forgive the thief aloud.** → FAITH +2, MERCY +1. Flag `THIEF_FORGIVEN`.
DECISION 2 (after A, B or D). He asks the stones whether the king's blessing is still with him: black, yes. Then whether he will find his treasure, and both stones slip through a hole in the pouch he never noticed.
**Omen:** the stones falling.
- A. **Leave the hole; the stones can fall whenever they want.** (canon) → Flag `HOLE_LEFT`.
- B. **Mend it.** → No change now; in 3.4 the stones cannot fall out by themselves, and that omen is lost.
He falls asleep in the middle of the market.

**2.3 The librarian in the dream** ◆ · Window
Setting: his sleep on the cobbles. The series' one visit from the Dreaming.
Clip: dream grade. The empty plaza lengthens into an aisle of the endless library. Lucienne (`character-prompts.md` §3.6) walks toward him with her lantern and a slim open book; on its pages the dream from 1.1 plays like a film. 3P on Santiago barefoot on market stones that are book spines. She tells him a dream like this is lent, not given, and that most people return theirs half-read. Does he want to give it back?
DECISION:
- A. **Keep it open.** → FAITH +1. Flag `DREAM_OPEN`. She marks the page with a ribbon the colour of the levanter's dust. (canon-compatible)
- B. **Take it back. It cost me everything.** → FAITH -2. She shelves it, but leaves it sticking out an inch.
- C. **Ask who she is.** → A librarian who keeps every dream ever dreamed. Returns to the choice.
He wakes: someone is shaking him, and the market is coming back to life (p. 43).

**2.4 The candy seller** (pp. 43 to 45)
Setting: dawn, the stalls going up.
Clip: 3P. Instead of sad, he is happy: no more searching for food and water for the sheep. A candy seller assembles his stall with a smile like the old king's.
DECISION:
- A. **Help him put up the stall.** (canon) → FAITH 0. Flag `WORDLESS`. He is given the first sweet of the day, and walking away realizes one of them spoke Arabic and the other Spanish, and they understood each other perfectly.
- B. **Walk on and look for work.** → FAITH 0.
Then he walks Tangier slowly, reading omens with a shepherd's patience.

**2.5 The crystal shop on the hill** (pp. 45 to 49) · Window
Setting: a crystal shop at the top of a steep street few customers climb; dusty glassware; a card saying several languages are spoken. Then a tiny café with one table.
Clip: 3P from the merchant's side (thirty years here; the boy has no money). POV: Santiago offers to clean the window glasses for food, using the jacket he will not need in the desert; two customers buy while he works. At lunch the merchant laughs: the Koran obliged him to feed a hungry man anyway, but both of them needed to clean away negative thoughts. A job, yes; Egypt, not with a year's wages. A silence so deep the city seems asleep. He offers the fare home.
DECISION (window exits):
- A. **"I'll work for you. I need money to buy some sheep."** (canon) → FAITH -1.
- B. **Take the fare and go home.** → **Ending B1.**
- C. **"I'll work for you until I can cross the desert."** → FAITH +1. The merchant raises an eyebrow and says nothing.
Echoes: holding Coraline's button key, the merchant notices it (a key with no door is a dream with no action). With `THIEF_FORGIVEN`, he hires the boy warmly and calls it a good omen for the shop.

---

### Episode 3: The crystal shop (pp. 53 to 68)

**3.1 The display case** (pp. 53 to 55)
Setting: the shop a month later; the merchant mumbling about breakage; the boy's sums (a year to buy sheep).
Clip: 3P work montage, then POV at the counter. He proposes a display case at the foot of the hill; the merchant fears people will bump it; the boy answers that snakes are part of life with sheep. Sales climb. Flag `DISPLAY_CASE` (auto). The merchant asks why he wanted the Pyramids.
DECISION:
- A. **"Because I've always heard about them."** (canon: the treasure has become a painful memory) → FAITH -1.
- B. **Tell him the dream, the gypsy and the king.** → FAITH +1. Flag `DREAM_TOLD_MERCHANT`. He still calls the Pyramids a pile of stones you could build in your backyard.

**3.2 Mecca** (pp. 55 to 58) · Window
Setting: the shop two days later. The merchant's eyes fill with tears as he speaks of the Prophet.
Clip: 3P close on the merchant. The five obligations; the fifth is the pilgrimage. He never went: the crystal is delicate, and it is the thought of Mecca that keeps him alive. He has imagined walking seven times round the sacred stone a thousand times and fears the real thing would disappoint.
DECISION (window exits):
- A. **Understand him and say nothing more.** (canon) → FAITH 0. He allows the display. Narration: not everyone sees his dream come true the same way.
- B. **Urge him to go. You will mind the shop.** → FAITH +1. He is hurt, then thoughtful. Flag `MECCA_URGED`.
- C. **Agree that perhaps it is wiser only to dream.** → FAITH -2. The heart is silent for a long time.

**3.3 Tea in crystal** (pp. 58 to 62)
Setting: two months on; a tired man at the top of the hill complains there is nowhere to drink after the climb. Evening, a hookah in the doorway.
Clip: POV on the thirsty man; then 3P at sunset, both of them speaking Arabic now.
**Omen:** the thirsty man.
DECISION:
- A. **Propose selling tea in crystal glasses.** (canon) → FAITH +1. Flag `TEA_IN_CRYSTAL`. The merchant says it will change a life he is used to, that every blessing ignored becomes a curse, and finally: Maktub, it is written. Montage: climbers drinking mint tea from crystal and buying the glasses; rival tea shops that are not at the top of a hill; two new employees.
- B. **Keep the idea to yourself.** → FAITH 0. The shop grows slowly; by 3.4 there is money for only sixty sheep.

**3.4 Eleven months and nine days** (pp. 62 to 66)
Setting: before dawn; the city asleep; the sunlit doorway; three packed sacks.
Clip: 3P. White linen Arabian clothes bought for this day, a headcloth held with a camel-skin ring, new sandals. A bundle of money: enough for a hundred and twenty sheep, a return ticket and an import licence (sixty sheep without `TEA_IN_CRYSTAL`). Tea with the merchant: he is leaving today.
**Test:** FAITH -1. For almost a year he has not thought of the old king once.
DECISION:
- A. **Ask for his blessing.** (canon) → LOYALTY +1. Flag `MERCHANT_BLESSING`. He is proud of him, and says he knows he will never go to Mecca, just as the boy knows he will not buy his sheep. Maktub.
- B. **Leave before he wakes.** → LOYALTY -1. A folded note on the counter. (◆ variant)
Upstairs, taking the jacket out of the old pouch, the two stones fall to the floor (only with `HOLE_LEFT`; otherwise he finds them only if FAITH ≥ 2). He notices the merchant's hair is like the old king's, and remembers the candy seller's smile.
**Omen:** the stones falling again.
*(Neverwhere echo, proposed: with LOYALTY ≥ 4, an extra option on the way out: go back and say goodbye properly in front of the customers.)*

**3.5 Two hours, or a whole desert** (pp. 66 to 68)
Setting: the bar from his first day. The owner brings him tea; the thief is not there.
Clip: 3P with the cup, then POV with Urim and Thummim in his palm. He remembers that one of the merchant's suppliers sends crystal across the desert by caravan. Andalusia is two hours away; or he is two hours closer to his treasure.
DECISION (second turning point):
- A. **Buy the ticket and the sheep. Go home a winner.** → **Ending B2.**
- B. **Go to the supplier's warehouse and find out how far the Pyramids really are.** (canon) → FAITH +2.
- C. **Ask the stones.** → Black, yes. FAITH 0; leads to B. The heart remarks that the king asked him to decide for himself.

---

### Episode 4: The caravan (pp. 68 to 89)

**4.1 The Englishman in the warehouse** (pp. 68 to 74) · Window
Setting: part warehouse, part corral; animals, sweat and dust.
Clip: 3P on the Englishman with a chemical journal (Esperanto, then religions, now alchemy; a two-hundred-year-old alchemist at Al-Fayoum). Santiago plays with the stones; the Englishman shouts their names and shows an identical pair from the Bible; shepherds, he says, first recognized a king the world refused. The fat warehouse boss: a caravan leaves today for Al-Fayoum, which is in Egypt.
DECISION (window exits):
- A. **Tell him about the king, and that you are looking for a treasure.** (canon) → FAITH 0. Flag `ENGLISHMAN_FRIEND`. In a way, he says, so is he.
- B. **"They're not for sale."** Close the conversation. → FAITH 0. He stays cool until 4.3.
- C. **Say you bought them in the market.** → FAITH -1.

**4.2 The oath and the crossing** (pp. 74 to 80)
Setting: almost two hundred people and four hundred animals; a dark-eyed, bearded caravan leader; then sand, rock and the salt crust of dead lakes, every detour returning to the same star.
Clip: 3P. The leader demands that each person swear by their own God to obey him. POV on Santiago's turn.
DECISION 1:
- A. **Swear to Jesus Christ, as you were raised.** (canon) → FAITH 0.
- B. **Stay silent, like the Englishman.** → FAITH -1.
Travel montage from camelback, hand-held: the wind; the sheep that have surely forgotten him, without nostalgia; the merchant's daughter probably married (with `DAUGHTER_TRUTH` he imagines she understood). At the fire the camel driver tells of his orchard near El Cairum, the earthquake and the Nile flood, and how fear goes once you know your story and the world's were written by the same hand.
DECISION 2:
- A. **Throw the book away; the caravan teaches more.** (canon) → FAITH +1. Flag `BOOK_THROWN`.
- B. **Keep it, and finish it one day.** → FAITH 0. (At 7.3 it is still in his pack.)

**4.3 Books and caravans** (pp. 80 to 87)
Setting: nights without fires, animals in a circle, armed sentinels; a full moon over the dunes.
Clip: 3P. Rumours of war; hooded Bedouins come and go in silence. On a moonlit walk the Englishman explains the Soul of the World; Santiago says the caravan and the desert speak one language. They swap: the Englishman will watch the caravan, the boy will read the books (mercury, dragons and kings, the Emerald Tablet, the Elixir and the Stone).
DECISION (returning the books):
- A. **Tell him the truth: the world has a soul, and it is so simple it could be written on an emerald.** (canon) → FAITH 0. He is disappointed and calls the boy's soul primitive; the boy respects his way anyway.
- B. **Tell him you need more time with the codes.** → FAITH -1. He is pleased; you lose a week of watching the desert.

**4.4 Stars on the desert** (pp. 87 to 89) · Window
Setting: the last nights, no fires, no moon; then dawn.
Clip: 3P, eating dates in the dark. The camel driver lives only in the present: if he has to fight, it is as good a day to die as any, and life is a festival. POV two nights later: the horizon seems lower, with stars on the desert itself. It is the oasis. Why not go now? Because we have to sleep.
DECISION (window exits):
- A. **Sleep, as he says.** (canon) → FAITH 0. Flag `CAMEL_DRIVER_FRIEND`. Dawn: an endless row of date palms. The Englishman exults; Santiago is quiet and content.
- B. **Lie awake counting the days to the Pyramids.** → FAITH -1. The dawn clip plays through tired eyes (variant grade).

---

### Episode 5: Al-Fayoum (pp. 89 to 128)

**5.1 The well** (pp. 89 to 95)
Setting: Al-Fayoum: three hundred wells, fifty thousand date palms, coloured tents, a great white tent at the centre. All arms are handed to the chieftains' men; the Englishman surrenders a chrome-plated revolver that, he says, helped him trust people.
Clip: 3P from far off on a figure in black at the edge of the palms watching the caravan arrive (the alchemist knows one traveller is his to teach). Then a wasted day searching for a tent with an oven, and the well. A woman warns him not to speak to women in black, who are married. Asked who cures the sick, an old man says that one sees even the chieftains only when he chooses.
DECISION:
- A. **Respect the tradition; speak only to men and to girls not in black.** (canon) → FAITH 0.
- B. **Ask the women in black anyway; the Englishman insists.** → FAITH 0. Flag `TRADITION_BROKEN`. One chieftain mentions it coldly in 5.5.
Then a young woman not dressed in black comes to the well, a vessel on her shoulder.

**5.2 Fatima** (pp. 95 to 98) · Window
Setting: the well, afternoon.
Clip: POV. Time stops: dark eyes, lips between a laugh and silence. The ambient sound drops out; the hand-held frame goes almost still. 3P as the Englishman shakes him. Her name is Fatima, the Prophet's daughter's name, carried everywhere by the invaders, she says proudly. She points south: the man who knows all the world's secrets and talks with the genies of the desert.
DECISION (window exits):
- A. **Ask her name, then about the alchemist.** (canon) → FAITH 0.
- B. **Say nothing; just look until she smiles.** → FAITH 0. The Englishman asks for you; same information.
- C. **Ask only about the alchemist and look away.** → FAITH -1. 5.3 begins awkwardly.
Coda: he sits by the well a long time, remembering that the levanter once brought him the perfume of this woman before he knew she existed.

**5.3 The proposal and the promise** (pp. 98 to 102) · Window
Setting: the well, the next day and the month after.
Clip: 3P. The Englishman reports that the alchemist told him only to go and try; Santiago tells him to try. Fatima arrives.
DECISION 1:
- A. **Tell her you love her and want her to be your wife.** (canon) → FAITH 0. She drops the vessel and the water spills.
- B. **Wait until you know her better, as your parents taught.** → FAITH -1. The proposal comes a week later.
Montage: fifteen minutes a day at the well. A month in, the war may last years. Fatima: she is part of his dream; if he must go, go; the dunes change but the desert never does; if she is truly part of his dream, he will come back. Desert women are proud of men who wander free as the wind.
DECISION 2 (window exit):
- A. **Say nothing yet; take it into the desert to understand.** (canon) → FAITH 0.
- B. **Tell her you will stay; the treasure can wait.** → FAITH -1. Flag `FATIMA_HURT`. She says she never asked that.
- C. **Ask her to come with you.** → FAITH 0. She refuses gently: she is a woman of the desert, and she waits.

**5.4 The hawks** (pp. 102 to 108)
Setting: the Englishman's furnace outside his tent (firewood, a transparent flask; he is separating the sulfur and has lost his fear of failure). Then a rocky place in the desert with the palms still in sight; shells underfoot, because this desert was once a sea; sunset turning the sand pink.
Clip: 3P at the furnace (with `ENGLISHMAN_FRIEND` he says he is beginning what he could have started ten years ago). Then alone on a stone, trying to separate love from possession. POV up: two hawks drifting on the wind. One dives at the other, and for two seconds he sees an army with drawn swords riding into the oasis (overexposed, silent). He tries to forget it; his heart will not let him.
**Omen:** the hawks. The vision is clear if FAITH ≥ 2, blurred and doubtful below.
DECISION:
- A. **Heed the omen and tell someone.** (canon) → FAITH +2. Flag `HAWKS_OMEN`. With `CAMEL_DRIVER_FRIEND` the camel driver is under a palm: he tells of the old seer and the twigs (God reveals the future only when it is written to be altered) and sends him to the chieftains. Without him, Santiago goes to the tent alone and 5.5 opens colder.
- B. **Call it a mirage; the desert fills men's hearts with visions.** → FAITH -2. Skips 5.5 and 5.6; plays the raid variant of 5.7.
- C. **Ask Urim and Thummim whether an army is coming.** → Black, yes. FAITH 0; continues as A. The heart notes he did not trust himself.

**5.5 The chieftains' tent** (pp. 108 to 112) · Window
Setting: the great white tent at night: carpets, hanging lamps of handwrought gold with candles, eight chieftains on embroidered silk cushions in a semicircle, servants with silver trays, hookahs.
Clip: 3P, hours outside as campfires go out. Inside, POV: why would the desert tell a stranger? Because his eyes are not yet used to it. The elder at the centre smiles almost imperceptibly and tells of Joseph and Pharaoh's dream: the Tradition also says to believe the desert. Tomorrow the men carry arms; a gold piece per ten dead enemies; if no weapon is used by sunset, one will be used on the boy.
DECISION (window exits):
- A. **Tell only what you saw; they need not believe it.** (canon) → FAITH 0.
- B. **Promise them victory.** → FAITH -1. The elder's eyes harden; the horseman's question in 5.6 is harsher.
- C. **Back down: perhaps it was a mirage.** → FAITH -2. Plays the raid variant of 5.7.

**5.6 The horseman** (pp. 112 to 116) · Window
Setting: the walk back under the full moon, twenty minutes to his tent.
Clip: 3P walking, no regrets: Maktub. Thunder; a wind throws him to the ground; dust hides the moon. POV from the sand: a huge white horse rearing, a rider all in black with a falcon on his left shoulder, the face hidden but the eyes, a great curved sword shining. Who dares to read the flight of the hawks?
DECISION (POV, tense):
- A. **"It was I." Lower your head to receive the blow.** (canon) → FAITH +1, COURAGE +1. Flag `HORSEMAN_TEST`. The point draws a single drop of blood. Allah made the armies and the hawks, he answers, and he saw an army, not the outcome. The rider sheathes the sword: it was a test of courage; love the desert but never trust it completely; if your head is still on at sunset tomorrow, find me. The whip points south.
- B. **Run for the palms.** → FAITH -2, COURAGE -1. The horse blocks every way; the question comes again and the choice returns once. Chosen twice, the rider leaves without pointing south, and 5.8 begins with Santiago asking for the tent of genies. (◆ variant beat)
- C. *(Coraline echo, proposed: COURAGE ≥ 4)* **Raise your eyes and meet his.** → as A, plus FAITH +1. He adds that courage is what the Language of the World most needs.

**5.7 The battle and the counselor** (pp. 116 to 117)
Setting: morning. Two thousand armed men hidden among the palms; five hundred riders come in from the north with weapons under their robes and attack the empty white tent.
Clip: from a distance only: dust, robes, horses; over in half an hour, the children kept beyond a grove. The spared commander is condemned by the Tradition and hanged from a dead palm (one long silhouette shot, skippable). The elder gives the boy fifty gold pieces and asks him to be counselor of the oasis.
DECISION:
- A. **Accept the gold and the post.** (canon) → FAITH 0. Flag `COUNSELOR`.
- B. **Take the gold, decline the post; you are only passing through.** → FAITH +1. In 5.10 there is no young tent-mate to wake Fatima for you.
Raid variant (after 5.4B or 5.5C) ◆: the unarmed oasis is entered at noon; the riders take water and food and leave tents burning; the camel driver is wounded (if a friend). FAITH -1 more, no gold, no post. That night the alchemist comes to Santiago instead, and 5.8 opens with his question: who failed to read the hawks?

**5.8 The alchemist's tent** (pp. 118 to 121) · Window
Setting: to the south, a single tent that passing Arabs say belongs to genies. Inside: a pile of books, a small cooking stove, carpets with strange designs, no ovens or flasks.
Clip: at moonrise the alchemist rides in with two dead hawks (the same two, the boy suspects). 3P by the fire: the wind said you would come; you already know all you need; I will only point the way. Wine, though forbidden: what comes out of mouths is evil, not what goes in. Sell your camel, buy a horse; camels kneel and die without warning, horses tire bit by bit.
DECISION (window exits):
- A. **"I've already found my treasure": a camel, money, fifty gold pieces, and Fatima.** (canon) → FAITH -1. None of it, he says, is from the Pyramids.
- B. **Ask him to teach you alchemy.** → FAITH 0. You already know it.
- C. **Ask how to reach the Pyramids through a war.** → FAITH +1. He knows what is happening in the desert. Tomorrow, a horse.

**5.9 Life attracts life** (pp. 121 to 126) · Window
Setting: the next night, moonlight, the rocky place of the hawks.
Clip: 3P riding. Show me where there is life in the desert. POV: the boy does not know where to look. Life attracts life.
DECISION 1:
- A. **Loosen the reins and let the horse find it.** (canon) → FAITH 0. Flag `LIFE_FOUND`. The horse slows of its own accord.
- B. **Search the rocks yourself.** → FAITH 0. Longer; in the end the alchemist lets your horse go.
- C. **Ask the stones where.** → FAITH -1. The stones say yes and no, not where.
The alchemist pulls a cobra from a hole and stills it inside a circle drawn with his scimitar: the omen he needed, since the Pyramids are surrounded by desert. Santiago says he wants to stay. The alchemist tells the next four years over a montage previewing Ending C, and says love never keeps a man from his Personal Legend. He erases the circle; the snake slides away.
DECISION 2 (third turning point; window exits):
- A. **"I'm going with you."** (canon) → FAITH +2. Peace in his heart. They leave before sunrise.
- B. **"I'm staying."** → **Ending C.**
- C. **Ask Fatima first.** → She has already told you (unless `FATIMA_HURT`, when the alchemist says she will not ask you to stay either way). Returns to the choice.

**5.10 Farewell among the palms** (pp. 126 to 128) · Window
Setting: two hours before dawn. With `COUNSELOR`, a young man from his tent is paid enough gold for a sheep to show the way, and enough for another to wake her.
Clip: 3P among the palms, against the Tradition. She stops him explaining why he loves her (one is loved because one is loved); he says the whole universe conspired for him to find her. Their first embrace. Her father went away once and always came back. She cries: a woman of the desert, but above all a woman. Coda: Fatima at dawn; the oasis is empty to her now, and she will send her kisses on the wind.
DECISION (window exits):
- A. **Promise to return, as her father returned to her mother.** (canon) → LOYALTY +1. Flag `FATIMA_PROMISE`.
- B. **Ask her to wait, but promise nothing.** → FAITH -1. Her coda turns away from the desert.
- C. **Leave without waking her.** → FAITH -1, LOYALTY -2. She hears it from the young man at dawn (variant).

---

### Episode 6: Into the wind (pp. 128 to 164)

**6.1 The heart** (pp. 128 to 143)
Setting: the open desert at war. Fires lit in holes, the falcon hunting (a rabbit one day, two birds the next), the sweet sick smell of battle on the wind; seven days, then more.
Clip: 3P riding shots, the alchemist ahead with the falcon. What is made of pure matter never spoils; one learns only through action; failed alchemists wanted only gold. The Emerald Tablet drawn in the sand: like the flight of the hawks, not a code. Listen to your heart. From here the heart speaks aloud, then frightens him with men who never found their treasure. He calls it a traitor.
DECISION:
- A. **Keep listening, even when it frightens you.** (canon) → FAITH +1. Flag `HEART_FRIEND`. He asks it to sound the alarm whenever he wanders from his dream.
- B. **Silence it and think only of the road.** → FAITH -2. The heart drops to a whisper (fewer hints in 6.4 and 7.1).
- C. **Ask it what it wants.** → FAITH +1. A longer heart monologue: hearts speak of treasure only to children; it once hid his father's rifle, and once kept him asleep in a field while two thieves waited ahead.
Then, no decision: three armed tribesmen search them; the alchemist calls his crystal flask and yellow glass egg the Elixir and the Philosopher's Stone; they laugh and wave them on (great treasures inside are rarely believed). Past a tribal camp the boy says there is no danger; the alchemist is angry: never forget you are in the desert. Two horsemen stop them and are turned back by his gaze alone.

**6.2 The blue-veiled camp** (pp. 144 to 147) · Window
Setting: sunset in giant dunes. The heart sounds an alarm; two horsemen become ten, then a hundred, in blue with black rings round their turbans and blue veils, only their eyes showing. A military camp; the chief's tent with his staff.
Clip: POV, shoved into the tent. Spies, seen at the enemy camp. The alchemist: travellers; his friend is an alchemist who will turn himself into the wind in three days, or they offer their lives. He takes the boy's bag and gives the chief all the gold.
**Test:** FAITH -1. Everything he saved in his life, gone.
DECISION (window exits; what Santiago says in the tent):
- A. **Stay silent and let the alchemist speak.** (canon) → FAITH 0.
- B. **Protest that you are no alchemist.** → FAITH -2, COURAGE -1. The chief laughs; his officers watch you closely (in 6.4 they stop it one exchange early).
- C. **Say it yourself: give me three days.** → FAITH +1, COURAGE +1.
Outside, all routes: horses taken, the desert now a wall; the alchemist says the money bought three days, pours tea on the boy's wrists, and tells him the only thing that makes a dream impossible is the fear of failure.

**6.3 Three days** (pp. 147 to 149)
Setting: day one, a battle nearby and wounded carried in; day two, a cliff above the camp.
Clip: Day one, 3P: a soldier speaks to a dead comrade; the alchemist out in the desert feeding his falcon, saying he already knows how to turn himself into the wind.
**Test:** FAITH -1. Death changes nothing in the camp.
Day two, hand-held on the clifftop, the whole desert below.
**Omen:** the falcon wheeling once over the camp and back to the alchemist's fist.
DECISION (how to spend the second day):
- A. **Sit on the cliff all afternoon and listen to the desert.** (canon) → FAITH +1. The desert senses his fear; they speak the same language.
- B. **Walk the camp looking for a way out.** → FAITH -1.
- C. **Ask the alchemist again how it is done.** → FAITH 0. The world is only the visible face of God, he says, and goes on feeding the falcon.

**6.4 Turning into the wind** (pp. 149 to 159) · Window and interactive sequence
Setting: day three, the cliff. The chief and his officers sit; the alchemist smiles.
Clip: 3P wide, then POV over the desert. The desert speaks first (voice and subtitles), then the wind, then the sun, then silence before the hand that wrote all.
INTERACTIVE SEQUENCE: four exchanges. The player speaks freely (window) or picks one of three. Each right answer raises the wind a visible step: sand lifting, tents straining, the sun becoming a golden disk.
1. Desert: what is love? → *the falcon's flight over your sands* (canon) / *keeping what you love* / *waiting for what you love*. The desert gives its sands but says to ask the wind.
2. Wind: you cannot be the wind; we are different things. → *we were made by the same hand and have the same soul* (canon) / *I command you* / *then help me die bravely*. The wind, curious and proud, sends him to heaven; he asks for a sandstorm so he can look at the sun without being blinded. The simum rises.
3. Sun: why do you say I do not know love? → *love is not standing still like the desert, roaming like the wind, or watching from afar like you; it transforms and improves the Soul of the World* (canon) / *because you are too far away* / *because you only burn*. The sun says to speak to the hand that wrote all.
4. The hand: the universe falls silent. → *ask to be saved* / *give thanks for everything you have* / *say nothing* (canon: a prayer without words; the only right answer, shown last).
Result:
- **Three or four right, including the silence** → FAITH +2, COURAGE +1. Flag `TURNED_INTO_WIND`. The simum blows as never before; when it stops he is standing beside a sand-covered sentinel on the far side of the camp. The alchemist smiles (his perfect disciple); the chief smiles (the glory of God) and quietly notes the two officers who asked to stop.
- **Fewer** → FAITH -1. Flag `WIND_BORROWED`. The alchemist raises the simum himself; Santiago is found on the far side of the camp all the same, but only the alchemist smiles.
With FAITH ≥ 6 or `HEART_FRIEND`, the heart whispers before each answer. After 6.2B the officers stop it after the sun, so the silence plus two others must be right. Next day the chief sends an escort.

**6.5 The Coptic monastery** (pp. 159 to 164) · Window
Setting: a Coptic monastery at the end of a day's ride; a monk in black at the gate; the kitchen.
Clip: 3P. The Pyramids are three hours away; the alchemist says he only invoked what the boy already knew. In the kitchen, lead in an iron pan and a hair-thin sliver of the yellow egg in wax: the metal reddens like blood and cools to gold (his Personal Legend, not the boy's). At the gate he cuts it in four: for the monk (do not say it is too much, life might be listening), for the boy, for himself, and one left with the monk for the boy, because what happens twice happens a third time.
DECISION:
- A. **Take your piece in silence; you heard what he told the monk.** (canon) → FAITH 0.
- B. **Say it is far more than you gave the general.** → FAITH 0. He repeats his warning, smiling.
- C. **Ask to go back into the desert with him.** → FAITH -1. No; your treasure is three hours away. Returns to the choice.
Riding on, the alchemist tells the story of the Roman father with two sons, whose soldier son's words to a rabbi are repeated across the world forever (pp. 162 to 164): every person plays a central role in the world's history without knowing it. Window for any last questions; the exit is goodbye.

---

### Episode 7: The treasure (pp. 165 to 173)

**7.1 The dune** (pp. 165 to 167)
Setting: hours of riding; a full moon, a month since the oasis; moonlit dunes like a rolling sea.
Clip: 3P climbing, the heart: notice where you are brought to tears. POV at the top: the Pyramids in moonlight. He kneels and weeps, thanking God for everyone who brought him here. He could go back to Fatima now. A scarab beetle, symbol of God in Egypt, scuttles where his tears fell. With `DREAM_CHASED`, the dream child's pointing hand flickers over the spot.
**Omen:** the scarab.
DECISION:
- A. **Dig where your tears fell.** (canon) → FAITH +1. No project is complete until its objective is reached.
- B. **You have seen them. It is enough. Ride back to Fatima.** → **Ending D.**

**7.2 The refugees** (pp. 167 to 169) · Window
Setting: night into dawn; the hole in the dune; figures with their backs to the moon.
Clip: 3P digging all night, hands raw, the wind filling the hole. POV: footsteps; faceless figures; refugees from the wars who need money. They find his gold, make him dig, find nothing. At sunrise they beat him: brief cuts of dust, a fall, a split lip, then sky.
**Test:** FAITH -1.
DECISION (option A is greyed if FAITH < 3: the words will not come):
- A. **Shout the truth: you are digging for treasure; you dreamed it twice.** (canon) → FAITH +2. Flag `TRUTH_TOLD`. Leaving, the leader turns back: two years ago, on this spot, he dreamed of a ruined church in Spain with a sycamore in the sacristy and treasure at its roots, and he is no fool to cross a desert for a dream. Flag `SYCAMORE_KNOWN`. The Pyramids seem to laugh at Santiago; he laughs back.
- B. **Say nothing; let them take the gold.** → FAITH -1. They leave, and the leader's dream is never spoken. → **Ending D** (bruised variant).
- C. *(MERCY ≥ 4)* **Offer them the gold freely; they need it more.** → FAITH 0, MERCY +1. The puzzled leader stops the beating and, leaving, tells his dream the same way; continues as A. (◆ variant)

**7.3 The sycamore** (pp. 171 to 172) · Window
Setting: the abandoned church at nightfall, the sycamore still in the sacristy, stars through the broken roof; then morning.
Clip: road-home montage ◆ (the monk laughing at his rags as he hands over the fourth piece of gold; the strait). 3P at the church, a shovel instead of a flock; wine under the stars; at high sun he digs. He shouts at the sky that the old sorcerer could have spared him the beating; a voice on the wind says then he would never have seen the Pyramids. The shovel strikes a chest: Spanish gold coins, precious stones, gold masks with red and white feathers, jewelled statues. Flag `SYCAMORE_TREASURE`. (If `BOOK_THROWN` is off, he finally reads past the burial scene. ◆)
Window: shout anything at the sky; the wind answers once.
DECISION:
- A. **Put Urim and Thummim in the chest: part of the treasure, and a reminder of the old king.** (canon) → FAITH 0. Flag `STONES_IN_CHEST`.
- B. **Keep them in your pocket.** → FAITH 0.
The narration notes how many times he used the stones (once, in the canon).

**7.4 The levanter** (pp. 172 to 173)
Setting: the church; a wind rising from Africa.
Clip: 3P. The levanter, carrying no desert dust and no threat of invasion, but a perfume he knows and the touch of a kiss arriving slowly from far away until it rests on his lips; the first time she has done that (only with `FATIMA_PROMISE` and FAITH ≥ 5; otherwise the wind carries only dust). POV down the road toward Tarifa.
DECISION:
- A. **Tarifa first, to give the gypsy her tenth; then Fatima.** (canon; only with `GYPSY_OATH`) → LOYALTY +1. Flag `TENTH_PAID`. A 5 s clip: the bead curtain, the old woman laughing.
- B. **Straight to Fatima.** → LOYALTY -1 if `GYPSY_OATH`.
- C. *(only without `FATIMA_PROMISE`)* **Stay in Andalusia with the treasure.** → Ending A, quiet variant.
Final line, canon: he tells the wind he is coming, Fatima.

---

## 4. Endings

| ID | Name | Requirement | What the player sees | Relic |
|---|---|---|---|---|
| **A** | *The treasure under the sycamore* (canon) | `SYCAMORE_TREASURE`, `FATIMA_PROMISE`, FAITH ≥ 5 at 7.4 | The chest at the sycamore roots, the stones laid in it, the levanter's kiss, "I'm coming, Fatima." Back in the library the two stones lie warm on the reading table. | Yes, bright |
| **A, postscript** ◆ | *The well at Al-Fayoum* | As A, plus FAITH 10, `TURNED_INTO_WIND`, `TENTH_PAID`, `OMENS_READ` ≥ 4 | After the credits, 20 s: Fatima at the well at dusk looking at the desert; the dunes have changed, the desert has not; a single rider on the horizon. Ends before they meet. | Yes, bright |
| **A, quiet** | *Gold and silence* | `SYCAMORE_TREASURE` but no `FATIMA_PROMISE`, or FAITH < 5, or 7.4C | The same chest and gold; the levanter blows but carries only dust. He sits rich beneath the sycamore, unsure which road to take. | Yes, dim |
| **B1** | *The shepherd's road* | Turned back early: 1.6B, 2.2C or 2.5B | Andalusian fields, the flock, the merchant's daughter's village (warmer with `DAUGHTER_TRUTH`). Narration echoes the baker: one day, perhaps. Melchizedek watches from a plaza bench. | Only if the stones were not sold (2.2C gives none) |
| **B2** | *A hundred and twenty sheep* | 3.5A | Home from Africa a winner: a large flock, an import licence, a good name. At night, in a drawer, two stones. The dream comes a third time. | Yes, dim |
| **C** | *The counselor of the oasis* | 5.9B | The alchemist's four-year prophecy, played out: the wedding, the camels, the palms growing, the omens growing louder and then silent, Fatima's quiet guilt, dismissal, wealth. Tender and melancholy. | Yes, dim |
| **D** | *The Pyramids by moonlight* | 7.1B or 7.2B | He has seen the Pyramids. He rides back toward the oasis (bruised, in the 7.2B variant). Final shot: the ruined church at night, another shepherd's flock asleep beneath the sycamore. | Yes, half-lit |

Every ending except A returns to the library, where Lucienne offers "Return to the last turning". FAITH and flags are kept from the play-through; the relic is replaced if a better ending is reached later.

**Canon path check** (starting FAITH 0, no omens tapped, 2.3 not counted): after Ep 1 = 2; Ep 2 = 1 (robbery -2, adventurer +2, sheep money -1); Ep 3 = 2; Ep 4 = 3; 5.4 → 5; 5.6 → 6; 5.8 → 5; 5.9 → 7; Ep 6 = 9; 7.1 → 10; 7.2 test → 9, truth → 10 (clamped). Ending A is reached with room to spare; the postscript also needs four omens.

---

## 5. Consequence web

| Early choice | Echo |
|---|---|
| 1.1B `DREAM_CHASED` | The dream child's pointing hand flickers over the dig site in 7.1. |
| 1.2B `DAUGHTER_TRUTH` | In 4.2 he imagines she understood him rather than married a baker; Ending B1 is warmer. |
| 1.3A `GYPSY_OATH` | Makes 7.4A possible; required for the A postscript. |
| 1.4 the king | Believed (`KING_BELIEVED`): a glint of the gold breastplate appears in later clips where the king "leaves his mark" (the candy seller's smile, the merchant's hair). Walked away: the glint is absent. |
| 1.5B `BAKER_TOLD` | In 3.3, when the merchant says every blessing ignored becomes a curse, the heart feels guilt about the baker instead of relief. |
| 1.6C `HEDGED` | The heart argues for home in 2.5 and 3.5; the alchemist mentions it in 5.9. |
| 1.7C, 3.5C, 5.4C, 5.9C (stones asked) | The epilogue narration counts the times he used the stones instead of "only once". |
| 2.1B `OWNER_HEEDED` | In 3.5 the bar owner greets him by name and will not take payment for the tea. ◆ |
| 2.2 victim or adventurer | Sets the heart's tone through Episode 3 and the merchant's first lines in 2.5. |
| 2.2C | Stones sold: no relic from this play-through. |
| 2.2A `HOLE_LEFT` | The stones fall out by themselves in 3.4 (an omen). Mended: no omen, and below FAITH 2 he forgets the stones entirely. |
| 2.3 `DREAM_OPEN` ◆ | Lucienne remembers in the hub ("the shepherd kept his page open"); shelved, she says the book is still sticking out an inch. |
| 2.4 `WORDLESS` | Shorter Arabic-learning montage in Episode 3; the Englishman notices his Arabic in 4.1. |
| 3.1B `DREAM_TOLD_MERCHANT` | The merchant's "you won't buy your sheep" in 3.4 refers to the dream by name. |
| 3.2B `MECCA_URGED` | In Ending A, a 2 s insert: pilgrimage symbols on the crystal shop door. ◆ |
| 3.3 `TEA_IN_CRYSTAL` | Enough money for 120 sheep (Ending B2 scale) and for the caravan. |
| 3.4A `MERCHANT_BLESSING` | Ending B2 opens with the merchant's blessing; A's library card mentions him. |
| 4.1 `ENGLISHMAN_FRIEND` | He asks for help searching in 5.1; his furnace line in 5.4; in the A postscript his furnace is still burning at the oasis. |
| 4.4 `CAMEL_DRIVER_FRIEND` | He is waiting under the palm in 5.4 with the seer's story; without him 5.5 opens cold. |
| 5.1B `TRADITION_BROKEN` | One chieftain's cold remark in 5.5. |
| 5.3B `FATIMA_HURT` | Changes the alchemist's answer in 5.9C; Fatima's farewell in 5.10 is shorter. |
| 5.4 `HAWKS_OMEN` | Scenes 5.5 to 5.7 exist as written; dismissed, the raid variant plays and there is no gold to give the general in 6.2 (he takes the crystal savings instead). |
| 5.6 `HORSEMAN_TEST` | The alchemist receives him in 5.8 without being searched for. |
| 5.7A `COUNSELOR` | The young tent-mate helps in 5.10; the prophecy in 5.9 includes the dismissal. |
| 5.10A `FATIMA_PROMISE` | The desert's question in 6.4 is answered with her; the kiss in 7.4; required for Ending A. |
| 6.1 `HEART_FRIEND` | Hints in 6.4; the heart's line at the dune in 7.1. |
| 6.4 `TURNED_INTO_WIND` | Required for the A postscript; the chief's escort is larger and salutes. |
| 7.2A `TRUTH_TOLD` | Gives `SYCAMORE_KNOWN`, the only road to 7.3. |
| **Cross-book (from the bible)** | |
| Coraline finished, holding the button key | 2.5: the crystal merchant notices the key and says a key with no door is a dream with no action. |
| Sandman MERCY ≥ 6 | 2.2D: Santiago can forgive the thief aloud; in 2.5 the merchant hires him more warmly and calls it a good omen for the shop. |
| The Alchemist finished, FAITH ≥ 4 | Sandman 6.3: Destruction says you already know a man who found his treasure at home; Ending C is softened, not removed. |
| **Cross-book (proposed)** | |
| Coraline finished, COURAGE ≥ 4 | 5.6C: meet the horseman's eyes instead of bowing; FAITH +1 extra. |
| Neverwhere finished, LOYALTY ≥ 4 | 3.4: go back and say goodbye to the crystal merchant in front of his customers (the book has him leave without one); LOYALTY +1. |
| The Alchemist Ending A reached | Sandman 7.6, the Wake: among the dreamers at the edge of the crowd stands a shepherd holding two stones, one black, one white. |

---

## 6. Conversation windows

The AI plays the character live (`ai-dialogue-design.md` §1 to §3); the talk must land on one of the authored exits. "Red lines" go into each character card's canon facts.

| Scene | Character | The player might try | Authored exits | Red lines |
|---|---|---|---|---|
| 0.1 | Lucienne (hub) | Ask about the shepherd, the dream, the other doors | None required (open) | Never reveals the ending or the sycamore. |
| 1.3 | The gypsy woman | Haggle, mock gypsies, ask about the Sacred Heart, ask how to reach Egypt | A swear / B pay the fee / C leave | Interprets only after the oath; does not know how to reach Egypt; keeps mentioning her cooking. |
| 1.4 | Melchizedek | Ask where Salem is, demand proof, offer a tenth of the treasure, ask about the baker | A listen / B believe / C walk away | Proves himself only by writing in the sand; price is always a tenth of the flock; never names the exact spot. |
| 2.1 | The young man | Ask his name, test his story, ask about the bar owner, bargain the fee | A trust / B heed the owner | Must not reveal he is a thief; the robbery happens on every route. |
| 2.3 ◆ | Lucienne in the dream | Ask who she is, ask to see the dream's end, ask about the Dreaming | A keep open / B shelve | Cannot show where the treasure is; one visit only in this book. |
| 2.5 | The crystal merchant | Ask for a loan, tell the dream, bargain wages, talk about God | A work for sheep / B go home / C work for Egypt | Offers the fare home exactly once; never lends money for the desert. |
| 3.2 | The crystal merchant (Mecca) | Push him to go, offer to mind the shop, share his own dream | A understand / B urge / C agree | He does not go to Mecca on any route. |
| 4.1 | The Englishman | Ask about alchemy, Esperanto, the Bible, his own stones | A tell / B close / C lie | Bookish and impatient; distrusts simplicity; still kind. |
| 4.4 | The camel driver | Ask about the flood, Mecca, the war, seers | A sleep / B stay awake | Lives in the present; will not predict anything. |
| 5.2 | Fatima at the well | Flirt, ask about her family, the alchemist, the war | A name and alchemist / B silence / C alchemist only | Respects the Tradition (no touching at the well); face uncovered, not in black. |
| 5.3 | Fatima (the women who wait) | Promise to stay, ask her to come, ask about her father | A take it to the desert / B stay / C come with me | Never asks him to stay; will not leave the oasis. |
| 5.5 | The elder chieftain and the council | Argue, promise victory, bargain the reward, retract | A plain truth / B promise / C back down | Only the elder decides; the terms (arms for a day, gold per ten dead, death if no weapon is used) are fixed. |
| 5.6 | The horseman (the alchemist, unrevealed) | Bargain, explain, beg, defy | A bow / B run / C meet his eyes | Never names himself; the sword stops at the forehead on every route. |
| 5.8 | The alchemist (tent) | Ask to be taught, ask his age, ask about Fatima or the Englishman | A "already found" / B teach me / C the route | Teaches only through action; never confirms the two hundred years. |
| 5.9 | The alchemist (the four years) | Argue for love, bargain for one year, ask to bring Fatima | A go / B stay / C ask Fatima | The prophecy is fixed; he never forbids staying. |
| 5.10 | Fatima (farewell) | Explain, promise, ask her to come | A promise / B ask her to wait / C (leave unseen, outside the window) | Stops explanations of love; cries once. |
| 6.2 | The blue-veiled chief | Bluff, plead, explain alchemy | A silent / B protest / C claim the three days | The gold is always taken; three days are always granted. |
| 6.4 | The desert, the wind, the sun, the hand | Poetry, argument, commands, prayer | Right or wrong per exchange; the hand needs silence | The hand never speaks. Desert: slow, possessive. Wind: proud, curious. Sun: wise, distant. |
| 6.5 | The alchemist (farewell) | Any last question; ask to go with him | Goodbye (the gate choices are authored) | Tells the centurion story, then leaves; will not come to the Pyramids. |
| 7.2 | The refugee leader | Explain, plead, offer the gold, defy | A truth / B silence / C offer | Always takes the gold; tells his dream only after A or C. |
| 7.3 | The voice on the wind | Anything shouted at the sky | None (open) | Replies once, about the Pyramids being beautiful. |

---

## 7. Cast for this book

Descriptions follow the realistic style of `character-prompts.md` §3 (paste into the reference-sheet frame, then add the Style Bible and this book's palette line).

**Santiago (the player).** Played by her: her own face and age from `characters/santiago/photo.jpg`, kept exactly as in the §3.1 rules (bone structure, eyes, brows, nose, mouth untouched; beauty from light and styling only). Skin warm and sun-touched, deepening across three stages: Andalusian gold, Tangier bronze, desert brown with wind-chapped lips. Hair her own, loose and wind-tangled, tied back with a strip of leather in the desert. Episodes 1 and 2: an undyed linen shirt, a heavy brown wool jacket with frayed cuffs and a darned elbow, a woven sash, wool trousers, scuffed leather boots, a goatskin wine bottle, a long olive-wood crook, and a worn leather shepherd's pouch with a tiny split at the bottom seam. From Episode 3: loose white linen Arabian clothes, a white headcloth held by a camel-skin ring, new leather sandals. At the Pyramids the linen is torn and dusty and her lip is split. Expression: open, curious, quick to wonder.
*Surreal detail:* a thin trickle of fine desert sand runs from the split in her pouch even in green Andalusia, long before she reaches the desert.
*Casting note to confirm:* the narrator says Santiago and other characters say shepherd, stranger or boy as the text does; Fatima's love story is kept as written, as Nada and Nuala were in Sandman.

**The dream child.** A barefoot girl of about seven in a plain linen shift, dark curls, olive skin with grass stains on her knees. Small hands that the sheep nuzzle without fear. A serious, delighted face, eyes very dark and bright. Seen only in the dream grade: soft, slightly overexposed.
*Surreal detail:* her footprints in the meadow grass fill slowly with sand.

**The merchant's daughter.** About eighteen, Andalusian, slim, flowing raven-black hair to the waist, dark almond eyes that recall the Moorish conquerors. A simple dark-green cotton dress, a flour-and-wool-dusted apron from her father's dry-goods shop, bare forearms, a thin silver chain. Sits sideways on the shop steps, chin on her hand. Expression: bored by every identical day until a shepherd starts talking.
*Surreal detail:* a single strand of white wool caught in her hair never falls, however she moves.

**Santiago's father (memory).** A farmer in his fifties, broad and slightly stooped, deep sun creases, hands cracked from drawing water, a black wool beret, a collarless shirt under a worn waistcoat. Holds out a small leather pouch with three ancient Spanish gold coins. Grey stubble, brown eyes that look past the camera to the horizon. Expression: gruff, proud, and a buried longing.
*Surreal detail:* in his eyes, reflected, a ship sails across a horizon that is not behind the camera.

**The gypsy woman.** In her late sixties, heavy, a black shawl over a faded red blouse, gold hoops in her ears and rings on every finger, flour dusting her forearms because something is cooking. Dry warm hands, dark eyes ringed with kohl, grey hair under a knotted headscarf. Sits at a bare table beneath a framed Sacred Heart, a bead curtain behind her. Expression: shrewd, impatient, amused.
*Surreal detail:* the painted flame above the Sacred Heart flickers like a real candle when she prays.

**Melchizedek, king of Salem.** An old man of indeterminate great age, lean and quick, white hair and a short white beard, deep-set grey eyes that seem to read thoughts. Arab dress: a dun wool cape over a pale robe, simple leather sandals. Under the cape a heavy gold breastplate set with precious stones, with two empty sockets at the centre after he gives the stones away. Holds a stick for writing in the sand. Expression: kindly, a little vain, deeply hopeful.
*Surreal detail:* the words he writes in the plaza sand stay perfectly sharp while people walk across them.

**The baker.** A plump man in his forties in a flour-whitened apron and white cap, forearms like bread dough, a content moustache. Stands in his shop window at the corner of the plaza. Expression: satisfied, unaware.
*Surreal detail:* the flour drifting from his hands falls toward the sea, as if the wind from Africa were calling it.

**The young man in Tangier (the thief).** Santiago's age and height, slim, a local Tangier face, clean-shaven, quick charming smile, very white teeth. Western dress slightly too big: a brown jacket, white shirt open at the throat, trousers with a sharp crease, polished shoes worn at the heels. Talks with his hands. Expression: friendly, attentive, eyes always flicking to the pouch.
*Surreal detail:* his reflection in the bar mirror leaves the frame a second before he does.

**The bar owner.** A heavy man of fifty-five, grey stubble, a stained apron over a striped djellaba, thick forearms, a tea tray in one hand. Brows drawn together, eyes worried rather than greedy. Expression: urgent, unable to make himself understood.
*Surreal detail:* the steam from the tea he pours bends toward the young man like a pointing finger.

**The candy seller.** A round-faced man of forty, sugar dust on his fingers and moustache, a white skullcap, a striped apron over his robe, sleeves rolled. Sets out trays of sweets at dawn. Expression: a smile exactly like the old king's.
*Surreal detail:* the sugar crystals on his hands glint in the same spots as the jewels on the king's breastplate.

**The crystal merchant.** A thin, slightly stooped man in his late sixties, white hair cut short and very like the king's, a neat grey beard, a fine but old djellaba in grey wool, amber prayer beads, careful long fingers that hold glass by the stem. Watery brown eyes that fill with tears when he speaks of the Prophet. Expression: grumbling, anxious, devout, quietly delighted.
*Surreal detail:* every glass on his shelves rings faintly, all on one note, whenever he says the word Mecca.

**The Englishman.** A tall, thin man of about forty, pale skin burned pink on the nose and neck, sandy thinning hair, round wire spectacles, a lined intelligent face. A rumpled linen jacket over a white shirt with sleeves rolled, a chemical journal under one arm, ink on his fingers; trunks of books; a chrome-plated revolver he hands over at the oasis; his own pair of rock-crystal stones. Expression: impatient, earnest, hungry for proof.
*Surreal detail:* the alchemical drawings in his books drift slowly across the page like iron filings near a magnet.

**The caravan leader.** A dark-eyed, black-bearded man of fifty in indigo and white, a rifle on his back, a bugle on a cord, a curved dagger at the sash. Weathered skin, eyes narrowed by years of glare. Expression: absolute authority, quiet piety.
*Surreal detail:* even at noon a pinpoint of starlight, the caravan's guiding star, shines in his eyes.

**The camel driver.** A sinewy man of fifty-five, skin cured dark by sun, a missing front tooth, a grey turban wound loosely, a sun-faded robe, dates knotted in a cloth at his belt. Hands of a former orchard farmer, thick-nailed. Expression: unhurried, amused, completely present.
*Surreal detail:* a fresh green olive leaf from his drowned orchard is always stuck to his sandal.

**Fatima.** About nineteen, a woman of the desert: tall and straight-backed, olive-brown skin, very dark eyes, full lips poised between a laugh and silence. A deep blue veil over her hair, her face uncovered, a long robe of undyed cotton (not black), henna patterns on her hands, thin silver bangles, a clay water vessel balanced on one shoulder. Expression: proud, shy, then fearless.
*Surreal detail:* water spilled from her vessel does not soak in but beads on the sand, each drop holding a tiny reflection of the sky.

**The elder chieftain.** A man in his seventies in robes of white and gold, a white beard, a gold ring with a dark stone, seated very still at the centre of a semicircle of cushions. Heavy-lidded eyes, a face that gives almost nothing. Beside him a young aide in white and gold. Expression: cold, then, for an instant, an almost invisible smile.
*Surreal detail:* the smoke from the hookahs circles him and never touches him.

**The alchemist.** Ageless, perhaps two hundred years old: lean, upright, deep-lined dark skin, a hawk-like nose, a close grey beard, calm black eyes. As the horseman: all in black, a black turban and a black kerchief over the face to the eyes, a peregrine falcon on his left shoulder, a white horse, a great curved sword. Unveiled in the tent: a plain dark robe, bare head of short grey hair. In his pouch, a small crystal flask of liquid and a yellow glass egg a little larger than a hen's egg. Expression: stern, then gently amused.
*Surreal detail:* his shadow keeps a falcon on its shoulder even when the real falcon is away hunting.

**The blue-veiled chief.** A powerful man of fifty in deep blue robes, a black ring circling his turban, a blue veil leaving only fierce dark eyes. A silver-hilted dagger, a camel-hair cloak. Sits among his officers on a rug in a war tent. Expression: arrogant, then reverent.
*Surreal detail:* his veil ripples gently in a wind that moves no other cloth in the tent.

**The Coptic monk.** A man of sixty in a black habit and a rounded black cap, a grey beard, a small iron cross on a cord, hands stained from kitchen work. Opens the monastery gate a hand's width at first. Expression: wary, then dazzled, then laughing.
*Surreal detail:* the lead melting in his pan smells of baking bread.

**The refugee leader.** A gaunt man of about forty in torn robes thinned by war, cheekbones sharp, a scar through one eyebrow; for most of the scene his back is to the moon and his face is in shadow. When the moonlight finally reaches his face: tired eyes that hold death, then contempt, then weariness. Expression: hard, then oddly confiding.
*Surreal detail:* as he tells his dream, a single sycamore leaf, far from any tree, falls onto the sand at his feet.

**Lucienne (dream appearance, 2.3)** ◆. Exactly as her approved sheet (`character-prompts.md` §3.6), barefoot here on stones that are book spines, her lantern burning blue-white, a slim open book in her other hand.
*Surreal detail:* the pages of her book show the shepherd's dream as moving pictures, lit from within.

---

## 8. Recurring locations

Lock these as stills before any clip (two or three states where noted).

1. **The ruined church with the sycamore**: roofless stone church, sycamore in the sacristy; dusk with sheep (1.1) and night with a shovel (7.3).
2. **Andalusian hills**: golden pasture, cork oaks, dry stone walls, a dirt road toward Tarifa.
3. **The dry-goods shop steps** (memory): whitewashed village shop, wool bales, a girl on the steps.
4. **The gypsy's back room**: bead curtain, bare table, two chairs, the Sacred Heart.
5. **Tarifa plaza**: benches, the bakery on the corner, sand between paving stones, hurried townspeople.
6. **The ticket window at the city gates**: a small whitewashed office with a grille.
7. **The Moorish fort walls**: crenellated walls at the town's height, Africa across the strait, the levanter.
8. **Tangier bar**: low room, a huge communal pipe, tea glasses, a mirror.
9. **Tangier market plaza**: full (daggers among vegetables, carpets beside tobacco) and empty at night.
10. **The crystal shop on the hill**: steep street, dusty glassware (Ep 2), a display case and crystal tea service crowded with customers (Ep 3).
11. **The one-table café**: a tiny room near the shop, a bench, a window on the street.
12. **The warehouse corral**: part warehouse, part pen; bales, camels, the Englishman's trunks.
13. **The caravan route**: dunes by day, salt flats of dead lakes, moonlit dunes, nights without fire.
14. **Al-Fayoum oasis**: fifty thousand palms, coloured tents, at peace, armed, and (variant) raided.
15. **The well**: stone well head under palms, women with vessels, the place time stops.
16. **The chieftains' white tent**: carpets, golden lamps, silk cushions, hookah smoke.
17. **The rocky place of the hawks**: stones and shells at the edge of the palms; later the cobra's circle.
18. **The alchemist's tent**: a lone tent to the south, books, small stove, patterned carpets.
19. **The desert at war**: fires hidden in pits, blood on the wind, a tribal camp in white robes.
20. **The blue-veiled camp and the cliff**: war tents in the dunes; the clifftop where the simum rises.
21. **The Coptic monastery**: walled gate, a monk in black, a smoke-dark kitchen with an iron pan.
22. **The dune facing the Pyramids**: moonlit sand like a sea, the Pyramids silver and black.
23. **Lucienne's library and the dream aisle**: the hub's Doors wall (0.1) and the dream variant with book-spine floor (2.3).
