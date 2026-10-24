# Character and Location Prompts — Episode 1 (v0.2)

Target look: **surreal realism**. Every image must read as a real photograph of an impossible thing. Real skin, real cloth, real light; the surreal lives in one or two deliberate details per image, never in the rendering style.

Use these prompts through the gateway (`gemini-nano-banana-2.1`) or paste them into the Gemini app. Same model, same results.

---

## 1. The Style Bible (append to EVERY image prompt, word for word, never edit)

```
=== REALISM ===
Photorealistic cinematic film still, indistinguishable from a photograph. Shot on a full-frame cinema camera with a 50mm anamorphic lens at f/2.0, shallow depth of field, subtle horizontal lens flare and gentle oval bokeh. Natural skin with visible pores, fine vellus hair, slight redness around the nostrils and eyelids, subsurface scattering in ears and fingertips, individual eyelashes, moist eyes with a single soft catchlight. Fabric shows real weave, pilling, creases and dust. Metal shows fingerprints and tarnish. Motivated practical lighting only, soft falloff, deep shadows that still hold detail. Muted desaturated palette, cool shadows, one warm accent source. Fine 35mm film grain, slight halation around highlights. 16:9.

=== SURREAL ===
The impossible element is rendered with the same physical realism as everything else: it casts shadows, reflects light, disturbs dust. Subtle, unsettling, dreamlike, never cartoonish.

=== MOTION (video clips only) ===
Hand-held cinema camera, as if filmed by a person standing in the room: a gentle continuous operator sway and breath, fine micro-shake, slight drift and correction in the framing, an occasional small focus breathe. Never a locked-off tripod, never a smooth gimbal glide, never a jarring jolt. The shake is subtle enough that the viewer feels present rather than noticing the camera.

=== NEGATIVE ===
cartoon, anime, comic, illustration, painting, concept art, 3D render, video game, plastic or waxy skin, airbrushed, oversaturated, HDR, neon, text, watermark, logo, extra fingers, deformed hands, duplicate faces, modern objects in period scenes, smiling unless specified.
```

Why fixed: the final block anchors the style across hundreds of generations. Characters are then held consistent by **always attaching the approved reference sheet as the input image** for every later still, and the approved still as the first frame for every clip.

---

## 2. Workflow

1. Generate each character's **reference sheet** until one is approved. Save to `characters/<name>/ref.png`.
2. Generate each character's **hero portrait** as an *edit* of the sheet (attach the sheet, instruction: "same person exactly"). Approve. Save as `characters/<name>/hero.png`.
3. Every scene still = edit of the relevant sheet(s) plus the location plate.
4. Every Kling clip = `input_reference` set to an approved still.
5. Never regenerate an approved face from text alone.

---

## 3. Characters

Each character has two prompts: a **reference sheet** (neutral, for consistency) and a **hero portrait** (in-world, for the game's character gallery and as the master look).

Reference sheet frame, used by all:
```
Character reference sheet on a seamless matte charcoal studio backdrop, three views of the identical person side by side with equal spacing: LEFT a front-facing head-and-shoulders portrait; CENTRE a three-quarter view to the waist; RIGHT a full-length standing figure. Same face, hair, clothing and light in all three. Soft 1.5-metre octabox key light at 45 degrees upper left, a dim cool fill from the right, a faint hair light. Neutral expression unless specified. Nothing else in frame.
```

---

### 3.1 Dream / Morpheus (the player)

**Reference sheet, canon Dream:**
```
[Reference sheet frame]
A tall, gaunt, ageless figure, androgynous and severe, who could be thirty or thirty thousand. Height reads as unnaturally tall, around 1.95 m, with long limbs and long narrow hands. Skin chalk-pale with a faint cool blue undertone, so pale the veins at the temple and inner wrist show as faint blue threads; no blush anywhere. Face: long and angular, very high sharp cheekbones, hollow cheeks, a narrow straight nose, a thin unsmiling mouth with pale lips, a strong narrow jaw. Eyes deep-set in dark shadowed sockets, irises and pupils so dark they read as pure black, and inside each eye a single tiny pinpoint of white light like a distant star, rendered as a real reflection that moves with the eye. Brows black and straight. Hair pitch black, thick, standing up and outward in wild irregular spikes as if caught in a slow wind that touches nothing else in the room, with a few strands drifting visibly against gravity. Clothing: a long black coat that falls to the ankles like a robe, high collar framing the jaw, fabric a dense matte black wool that absorbs light so completely the folds read only as deeper black, cuffs slightly frayed, a faint shimmer in the deepest folds like far-off stars. Bare feet, pale, long-toed, standing on cold stone. Posture perfectly upright and utterly still, weight even, hands relaxed at the sides. Expression solemn, distant, faintly sorrowful, looking slightly past the camera as if listening to something far away.
SURREAL DETAIL: a thin drift of fine grey sand trickles from the hem of the coat onto the backdrop and pools at the feet, casting its own tiny shadows.
[Style Bible]
```

**Reference sheet, Aurie, Dream of the Endless** (attach `characters/dream/photo.jpg`). In this game the hero is named **Aurie**; Lucienne and the others address her as "my lady." Direction: pretty, mystical, graceful, and unmistakably her.
```
[Reference sheet frame]
Use the attached photograph as the exact face of this character. She must be instantly recognisable to her family: keep her bone structure, the shape and set of her eyes, her brows, nose, lips, chin and the proportions between them exactly as they are. Do not slim, reshape or idealise her features. Make her beautiful the way a great portrait photographer would: with light, styling, posture and calm, not by changing her face.

BODY: she is a curvy, full-figured woman of average height. Keep her real body shape and proportions; do not slim her. The gown is cut to celebrate the figure: fitted through the bust and waist, a soft drape over the hips, long unbroken vertical lines to the floor, so the silhouette reads as statuesque and regal.

LIGHT AND SKIN: replace the harsh overhead bathroom light of the photo with soft, flattering portrait light, a large soft key from upper left and a faint cool rim light tracing the hairline and the curve of the cheek. Skin kept real with pores and fine texture, but luminous and even, a cool porcelain pallor a shade or two paler than the photo, no shine, no redness, a faint cool blue vein at one temple. Lips their natural shape, a muted rose. The gentlest shadow under the cheekbone from the light alone.

EYES: her own eyes, lids and lashes, the irises deepened to near-black, and inside each eye one tiny pinpoint of white light like a distant star, rendered as a real reflection that would move if she moved.

HAIR: her own long hair, now a deep raven black with a soft sheen, brushed and lifted from the face so the forehead and cheekbones are clear, falling long down the back and over one shoulder, and a few fine strands drifting upward and outward as if stirred by a slow wind no one else feels.

CLOTHING: a long black high-collared gown-coat falling to the floor, dense matte black silk-wool that swallows light, fitted through the bodice and flowing from the hips; in its deepest folds a faint shimmer of distant stars, like a night sky seen through the cloth. A thin chain at the throat with a single small black stone. Bare pale feet just visible at the hem.

POSE AND GRACE: upright, long-necked, shoulders relaxed and back, chin level, weight even, one hand resting lightly at the collarbone with long relaxed fingers, the other at her side. Perfect stillness.

EXPRESSION: serene and knowing, eyes directly on the lens, a faint trace of her own warmth at the corners of the mouth, the calm of someone who has watched a thousand years of dreams and is not afraid of this one.

SURREAL DETAIL: a thin drift of fine grey sand trickles from the hem of the gown and pools at her feet, casting its own tiny shadows.
[Style Bible]
```

**Hero portrait, your wife as Dream (attach the approved sheet):**
```
Same woman exactly as in the attached reference sheet, same face, hair and gown. Medium close-up, chest up, slight three-quarter turn, standing at the open gate of horn at the edge of the Dreaming at dusk, mist to the horizon behind her. A cold silver light from the horn gate rims her hair and one cheek; a warm faint glow from somewhere behind the camera touches her face. Her hair lifts slowly in a wind that does not move the mist. She is looking directly at the camera as if she has been expecting the viewer. One hand rests on the amber horn of the gate, and where her fingers touch it the horn glows faintly from within. Expression: serene, a little amused, entirely in command.
SURREAL DETAIL: the mist at her feet is not mist but thousands of tiny sleeping faces, soft and out of focus.
[Style Bible]
```

**Hero portrait (attach approved sheet):**
```
Same person exactly as in the attached reference sheet, same face, hair and coat. Medium close-up, chest up, three-quarter angle, inside a vast glass sphere in a candle-lit stone cellar at night. The curved glass is between the camera and the figure: faint warped reflections of candle flames slide across it, a smear of condensation near the bottom edge, a fingerprint on the outside. The figure stands very still, eyes level with the lens, the star-points in each eye the brightest things in the frame. Hair lifts slowly in a wind that does not disturb the candle flames behind the glass. Candlelight from the lower left, amber, raking across the cheekbones; a cold blue fill from above that has no visible source. Dust hangs motionless in the air. Expression: contained fury under absolute stillness.
SURREAL DETAIL: the figure's shadow on the sphere's floor falls in the wrong direction, toward the light.
[Style Bible]
```

---

### 3.2 Roderick Burgess (captor, 1916, late 50s)

**Reference sheet:**
```
[Reference sheet frame]
A heavyset English occultist of fifty-eight, 1916. Height around 1.78 m, broad through the chest and gone soft at the waist. Face: broad and fleshy, jowls beginning, a wide forehead, a short thick neck. Skin florid with broken capillaries across the nose and cheeks, a sheen of sweat at the hairline, age spots on the backs of the hands. Beard close-cropped, iron grey with white at the chin, meticulously edged. Hair thinning, dark grey, oiled and combed straight back from a high hairline. Eyes small, pale cold grey, heavy-lidded, with a flat appraising stare; brows thick and grey. Mouth small, lips thin and pink, held in a faint satisfied purse. A thin white scar through the left eyebrow. Clothing: a floor-length ceremonial robe of burgundy silk velvet, crushed and worn shiny at the elbows and cuffs, lined in black, embroidered at the hem and collar with tarnished gold-thread sigils; beneath it a black Edwardian three-piece suit, white wing collar, black silk cravat with a pearl pin. A heavy gold signet ring on the right little finger and a carnelian ring on the left index finger. A brass amulet on a chain, a disc stamped with a circle and a dot, hanging over the waistcoat. Hands thick-fingered, nails clean and clipped. Posture: chest forward, chin lifted, the stance of a man who has never been refused. Expression: proprietary calm.
SURREAL DETAIL: the shadow of his raised hand on the backdrop has one finger too many.
[Style Bible]
```

**Hero portrait (attach sheet):**
```
Same man exactly as in the attached reference sheet. Medium shot, slightly low angle, in a vaulted stone cellar at night, 1916. He stands at a wooden lectern over an open grimoire, one hand flat on the page, the other raised mid-incantation with the carnelian ring catching candlelight. Behind him, out of focus, hooded figures and the tall beeswax candles of a chalk circle. Candlelight from below and left paints his face from under the chin, making the eye sockets dark and the sweat on his forehead glitter. Smoke from a censer drifts across the frame at knee height. Expression: the moment before triumph, lips parted, eyes fixed on something above the camera.
SURREAL DETAIL: the candle flames nearest him lean toward him instead of rising.
[Style Bible]
```

---

### 3.3 Alex Burgess, young (1920s to 1930s, early 20s)

**Reference sheet** (attach `characters/alex/photo.jpg`, the author himself):
```
[Reference sheet frame]
Use the attached photographs (the same man from two angles; the first is the main reference) as the exact face of this character. He must be instantly recognisable to anyone who knows him: keep his face shape, full cheeks, eyes, brows, nose, mouth, ears, hairline and the proportions between them exactly as they are. Keep his real build: a broad, solid, heavyset young man. Do not slim, lengthen or reshape his face or body. Change ONLY age, period styling and mood.
AGE AND PERIOD: early twenties, early 1930s England, the son of the house at Fawney Rig.
SPECTACLES: his own black-framed spectacles exactly as in the photo, rectangular matte black frames, thin lenses, slightly smudged; they are his signature feature and appear in every image of him at every age.
HAIR: his own thick black hair with no grey at all (he is young), swept back and brilliantined in a 1930s style, short at the sides, one strand escaped over the forehead.
SKIN: real texture, a faint shaving nick on the jaw, a little flush across the cheeks from nerves.
CLOTHING: a fawn lambswool cardigan, bobbled at the elbows, buttoned over a white cotton shirt with a soft collar, a narrow brown knitted tie, grey flannel trousers with a crease, brown brogues scuffed at the toe. A fountain pen clipped in the cardigan pocket, an ink stain on the right middle finger.
POSTURE: big shoulders rounded inward as if trying to take up less room, hands clasped in front, weight on the back foot.
EXPRESSION: not his usual smile. Anxious and kind, lips pressed together as if about to apologise, eyes soft behind the lenses. Wanting to be elsewhere.
SURREAL DETAIL: a single moth rests on his shoulder, perfectly still, its shadow sharp.
[Style Bible]
```

**Hero portrait (attach sheet):**
```
Same young man exactly as in the attached reference sheet. Close-up, slightly above eye level, in the dusty cellar of the 1930s. He crouches at the curved glass of a huge sphere, his face a hand's width from it, breath fogging a small oval on the glass, one palm pressed flat beside his face. The glass reflects the single electric bulb behind him and, faintly, two tiny star-points from inside the sphere where eyes would be. Hard bulb light from behind rims his hair; the only light on his face is a cold blue glow from inside the sphere. Expression: guilt and longing, mouth slightly open as if about to ask a question he has asked a hundred times.
SURREAL DETAIL: the fog of his breath on the glass forms, for an instant, the shape of an open door.
[Style Bible]
```

---

### 3.4 Alex Burgess, old (1988, early 70s)

**Reference sheet** (attach `characters/alex/photo.jpg`, the same author photo):
```
[Reference sheet frame]
Use the attached photographs (the same man from two angles; the first is the main reference) as the face of this character, aged fifty years to seventy-two. He must still be recognisable as the man in the photo: keep his face shape, eye shape, brows, nose, mouth, ears and proportions, and keep his heavyset build, now softened and stooped by age. Do not slim or reshape him. Change ONLY age, period styling and mood.
AGE: seventy-two, 1988. His swept-back hair now entirely white-grey, thinner at the crown. Skin with real age: deep lines from nose to mouth, crow's feet behind the lenses, loose skin at the jaw and neck, age spots on the temples and the backs of trembling hands, a healed cut on one knuckle. Eyes the same, a little clouded, lower lids drooping and red-rimmed.
SPECTACLES: the same black-framed spectacles as in the photo, rectangular matte black frames, now with thicker lenses, repaired at one hinge with white tape. His signature feature.
CLOTHING AND SETTING: seated in a 1980s hospital wheelchair with chrome rims and a cracked vinyl seat, a tartan wool blanket over the knees, a grey cardigan buttoned one hole wrong over a checked shirt, slippers. Hands gripping the armrests, knuckles white.
POSTURE: big frame collapsed forward into the chair.
EXPRESSION: not his usual smile. A lifetime of dread finally arriving.
SURREAL DETAIL: on his lap, under the blanket's edge, the same moth from fifty years ago, now grey, still perfectly still.
[Style Bible]
```

**Hero portrait (attach old sheet):**
```
Same old man exactly as in the attached reference sheet. Medium shot at dawn in the ruined cellar, 1988. He is being wheeled through the doorway, half turned in the chair, one hand flung up as if to ward something off, mouth open in a scream we cannot hear. A grey-blue shaft of morning light from a high window cuts across him and the drifting dust; behind him the shattered empty sphere. The tartan blanket is sliding off his knees. Focus on his eyes behind the taped spectacles.
SURREAL DETAIL: every shadow in the room points toward him.
[Style Bible]
```

---

### 3.5 Paul McGuire (Alex's companion and guard, late 50s)

**Reference sheet:**
```
[Reference sheet frame]
A kind, broad-shouldered Englishman of fifty-eight, 1970s. Height around 1.80 m, heavy-boned, a working man's build gone comfortable. Face: wide and weathered, deep laugh lines, a nose broken once long ago and set slightly left, soft brown eyes with heavy lower lids, bushy greying brows. Skin ruddy and lined, sun-damaged on the forearms, a small white scar on the chin, grey stubble. Hair greying brown, thick, cut short at the sides and left longer on top, a little unkempt. Clothing: a plain navy wool fisherman's jumper with the sleeves pushed to the elbows and a small darn on the left cuff, a checked flannel shirt collar showing, brown corduroy trousers worn pale at the knees, heavy black work boots. A ring of old iron keys on a leather loop at the belt; a wristwatch with a cracked face. Hands big, square, nails short, a wedding band worn thin. Posture: relaxed, weight on both feet, arms loose. Expression: patient, tired, loyal, a man who has sat with another man's fear for decades.
SURREAL DETAIL: one of the iron keys on his belt is faintly glowing from within, like a coal.
[Style Bible]
```

**Hero portrait (attach sheet):**
```
Same man exactly as in the attached reference sheet. Medium shot in the 1970s cellar under a bare bulb. He sits on a wooden chair beside the clouded glass sphere, a thermos cup of tea steaming in one hand, the other resting protectively on the back of an empty wheelchair. He is not looking at the sphere; he is looking at the doorway, waiting for Alex. Bulb light from above, hard and yellow, a cold reflected glow from the sphere on the side of his face. Dust in the beam.
SURREAL DETAIL: the steam from his tea curls sideways and into the glass, as if breathed in.
[Style Bible]
```

---

### 3.6 Lucienne (librarian of the Dreaming, timeless)

**Reference sheet:**
```
[Reference sheet frame]
A tall, slender woman of indeterminate age, somewhere between forty and four hundred. Height around 1.82 m, long neck, long fingers, an upright dancer's carriage. Skin deep warm brown with a satin finish, faint laugh lines at the eyes, a small mole high on the left cheekbone. Face: oval, high rounded cheekbones, a long straight nose, full composed mouth, a firm chin. Eyes large, dark brown, extremely alert, with faint gold flecks near the pupil. Hair silver-grey, fine, swept back from a high forehead into a tight low coil at the nape, not a strand loose. Small round wire-rimmed spectacles, perfectly clean, sitting low on the nose. Clothing: a long high-collared coat of charcoal wool, severely tailored, buttoned to the throat with twenty small jet buttons; across the chest a fine chain hung with dozens of tiny brass keys of different shapes; beneath, a long dark grey skirt to the ankle; narrow black boots. Holds an old brass lantern by its ring in the right hand, its glass smoked, a small steady flame inside. A pencil behind the left ear. Posture: straight, chin level, weight slightly forward as if about to walk. Expression: precise and dry, with deep affection and worry held carefully underneath.
SURREAL DETAIL: the lantern flame is a pale blue-white and casts no light of its own on her face, only on the floor.
[Style Bible]
```

**Hero portrait (attach sheet):**
```
Same woman exactly as in the attached reference sheet. Medium shot in an endless library: shelves rising out of sight into darkness behind her, a rolling ladder, dust. She stands at the end of a long reading table, lantern raised, turning toward the camera as if the player has just walked in. The lantern lights the table, a few floating motes and the nearest shelf; her face is lit by a soft cold light from the direction of the camera. Behind her, out of focus, three enormous locked doors of different woods. Expression: relief sharpened by seventy years of waiting, the beginning of "My lord."
SURREAL DETAIL: the books on the nearest shelf have no titles on their spines, and one is slowly writing its own.
[Style Bible]
```

---

### 3.7 The sleeping guard (1988, 30s)

**Reference sheet:**
```
[Reference sheet frame]
A tired security guard of thirty-four, 1988. Height around 1.75 m, slightly overweight, soft around the jaw. Face: round, two days of dark stubble, a large nose, heavy brows, a sleep crease on one cheek. Skin pale and oily, dark circles under the eyes, a cold sore at the corner of the mouth. Hair short, dark, flattened on one side. Clothing: a cheap light-grey polyester uniform shirt with a frayed embroidered security patch on the sleeve, a plastic name badge reading nothing legible, a black clip-on tie askew, a handheld radio clipped to the shoulder, dark trousers, black rubber-soled shoes. A paperback folded open in one hand, a half-eaten sandwich in foil in the other. Posture: slumped, head tipped back and to the side, mouth slightly open. Expression: deep sleep, peaceful, dreaming of somewhere kinder.
SURREAL DETAIL: a faint warm amber light, like a pub window, glows from under his closed eyelids.
[Style Bible]
```

**Hero portrait (attach sheet):**
```
Same man exactly as in the attached reference sheet. Close-up, in the 1988 cellar at night. He is asleep sitting on the floor with his back against the curved glass of the great sphere, head lolling against it, his breath fogging a widening oval on the glass. Through the fog, impossibly, a warm amber room is visible inside the sphere: a pub, a fire, a woman laughing. The single bulb above is off; the only light is that amber glow through the fog, and a thin cold line of pre-dawn from a high window.
SURREAL DETAIL: a long pale hand is pressing out through the fogged glass from inside, the glass bulging like skin without breaking.
[Style Bible]
```

---

### 3.8 The Three Who Are One (the Fates, timeless; Episode 2)

**Reference sheet:**
```
Character reference sheet on a seamless matte charcoal studio backdrop: three women standing side by side, full length, equal spacing, all facing the camera, the same soft 1.5-metre octabox key light at 45 degrees upper left. LEFT, the MAIDEN: about seventeen, slight, pale, freckled, red-brown hair loose to the waist, bare feet, a plain undyed linen shift, holding a wooden drop spindle with a single thread running from it. CENTRE, the MOTHER: about forty-five, broad-hipped and strong, olive skin, black hair in a heavy plait over one shoulder, a deep red wool dress and a leather apron, holding the same thread taut between her two hands to measure it. RIGHT, the CRONE: about ninety, tiny and bent, white hair thin as smoke, a face folded into a thousand lines, very dark bright eyes, a black shawl, holding a pair of old iron shears open around the same thread. The one thread passes through all three women's hands without a break. Expressions: the maiden curious, the mother patient, the crone amused.
SURREAL DETAIL: the three women cast a single shared shadow on the backdrop, the shape of one woman with three heads.
[Style Bible]
```

---

### 3.9 Johanna Constantine (exorcist, London, 1988, late 30s)

**Reference sheet:**
```
[Reference sheet frame]
A British exorcist of thirty-eight, London, 1988. Height around 1.72 m, lean and wiry. Face: angular, sharp cheekbones, a long straight nose broken once and set slightly crooked, thin mouth with a sardonic downturn, a small scar through the upper lip. Skin pale with faint freckles, tired shadows under the eyes. Eyes narrow, pale blue, sharp and amused and sad. Hair dirty blonde, chin length, carelessly pushed back, wet at the ends from rain. Clothing: a long beige trench coat, rain-darkened at the shoulders and hem, collar up; beneath it a loose white shirt, top two buttons open, a thin black tie pulled loose; black trousers; scuffed black Doc Martens boots. A silver ring on the right thumb, nicotine on the fingers of the left hand, an unlit cigarette behind one ear. Posture: weight on one hip, hands in coat pockets, shoulders slightly hunched against cold. Expression: unimpressed, watchful, someone who has seen worse and expects to again.
SURREAL DETAIL: her shadow on the backdrop is smoking a cigarette she is not holding.
[Style Bible]
```

---

### 3.10 Rachel (Johanna's former lover, wasted by the sand, 1988)

**Reference sheet:**
```
[Reference sheet frame]
A woman of thirty-five who has been breathing dream-sand for years and is dying of it. Height around 1.65 m, skeletal, collarbones and wrists like sticks. Face: once beautiful, now gaunt, skin stretched thin and grey-white like paper, cheeks hollow, lips cracked and pale, eyes huge and dark, the whites faintly golden, pupils wide, looking at something far away. Hair long, dark brown, matted and dry, spread around her head. Fine golden sand clings to her lips, eyelashes and the corners of her eyes and trickles from one nostril. Clothing: an oversized faded band T-shirt and a thin cardigan with holes at the cuffs. Posture: lying back, limp, one hand curled loosely. Expression: blissful and empty at once, smiling at a dream.
SURREAL DETAIL: the sand on her face drifts slowly upward instead of falling.
[Style Bible]
```

---

### 3.11 Lucifer Morningstar (ruler of Hell; Episode 2)

**Reference sheet:**
```
[Reference sheet frame]
The first of the fallen angels, ruler of Hell. Appears as a tall, slender, androgynous man of perhaps thirty-five, impossibly beautiful and impossibly tired. Height around 1.93 m. Face: long and fine-boned, high sharp cheekbones, a straight narrow nose, a wide calm mouth that almost smiles, a smooth jaw. Skin luminous pale gold, flawless, faintly glowing as if lit from inside. Eyes large, pale grey-gold, unblinking, ancient. Hair platinum blond, short and swept back. Clothing: a long high-collared robe of black silk, severe and unadorned, open at the throat; bare feet. Across both shoulder blades, visible through slits in the robe, two great white-feathered wings folded close, their tips scorched black. A thin band of dull iron around one wrist. Posture: perfectly still, one hand resting on the other. Expression: courteous, amused, cold, with a terrible patience.
SURREAL DETAIL: his shadow on the backdrop is that of a burning angel with wings spread.
[Style Bible]
```

---

### 3.12 Choronzon (a duke of Hell; Episode 2)

**Reference sheet:**
```
[Reference sheet frame]
A demon, a duke of Hell, built like a nightmare given a body. Height around 2.3 m, gaunt and too long in every limb, with an extra joint in each arm. Skin grey-green and leathery, cracked like dry riverbed, oozing a faint amber light in the cracks. Head: hairless, elongated, crowned with a ring of short twisted horns; the face is a mask of pale cracked bone with deep-set yellow eyes and a lipless grin full of thin needle teeth. Hands with four very long fingers ending in black nails. Wears only scraps of rotted crimson velvet and a chain belt hung with small bones. Holding, in one hand, a dark helm shaped like an old gas mask with a long ridged breathing tube, carved from black bone and a single huge jewel-like eye lens. Posture: hunched, head cocked, savouring. Expression: greedy, gleeful, cunning.
SURREAL DETAIL: the helm in his hand breathes, its tube slowly inflating and deflating.
[Style Bible]
```

---

### 3.13 John Dee, "Doctor Destiny" (Ethel Cripps's son; Episode 2)

**Reference sheet:**
```
[Reference sheet frame]
A man of about fifty-five who has spent decades in an asylum dreaming of a stone. Height around 1.80 m, skeletal, stooped. Face: a skull with skin on it, hollow temples, sunken cheeks, a thin lipless mouth, a long chin. Skin yellow-white and papery, blue veins at the temples. Eyes pale and watery, red-rimmed, pupils pinpricks, fixed and unblinking behind small round steel spectacles. Completely bald, with a few long wisps behind the ears. Clothing: an ill-fitting grey suit two sizes too big, a shirt buttoned to the throat with no tie, scuffed brown shoes; over it a stolen tan raincoat. Around his neck on a leather cord, a large red ruby the size of an egg, glowing faintly from inside. Hands long, thin, trembling slightly. Posture: polite, hunched, head forward like a bird. Expression: mild, courteous, empty, with something terrible looking out from behind the eyes.
SURREAL DETAIL: the ruby on his chest reflects a different room from the one he stands in.
[Style Bible]
```

---

### 3.14 Death of the Endless (Aurie's older sister; Episode 2)

**Reference sheet:**
```
[Reference sheet frame]
Death of the Endless, appearing as a young woman of about twenty-five. Height around 1.68 m, slim. Face: oval, delicate, a small straight nose, a wide warm mouth with a ready smile, a soft chin. Skin very pale, almost white, smooth, with a faint flush of life at the cheeks. Eyes large, dark brown, kind and amused, with heavy black eyeliner; beneath her right eye an ink-black spiral drawn like the Egyptian eye of Horus. Hair black, straight, shoulder length with a heavy fringe, slightly messy. Clothing: a black sleeveless top, black skinny jeans, black ankle boots, a black leather jacket over one arm; on a silver chain at her chest a silver ankh. Several silver rings. Posture: relaxed, weight on one leg, hands in pockets. Expression: warm, wry, gently teasing, as if she knows you better than you know yourself.
SURREAL DETAIL: a single black-and-white pigeon feather drifts down beside her and never reaches the floor.
[Style Bible]
```

---

### 3.15 Destiny of the Endless (eldest brother; Episode 3)

**Reference sheet:**
```
[Reference sheet frame]
Destiny of the Endless, the eldest. A very tall, gaunt man of no age, around 1.98 m, wrapped in a heavy hooded robe of undyed grey-brown wool that falls to the floor; the hood is up and casts his face half in shadow. Face: long, pale, smooth, solemn, a strong straight nose, a thin closed mouth. His eyes are blind: pale, milky and unfocused, looking at nothing. In his arms he holds an enormous ancient book bound in dark leather, open, and a heavy iron chain runs from a cuff on his left wrist to the book's spine. Bare pale feet. Posture: perfectly upright, unhurried, head slightly bowed toward the book. Expression: grave, patient, without warmth or cruelty.
SURREAL DETAIL: the pages of the book turn by themselves, and the words on them are still being written.
[Style Bible]
```

---

### 3.16 Desire of the Endless (Aurie's sibling; Episode 3)

**Reference sheet:**
```
[Reference sheet frame]
Desire of the Endless, neither man nor woman and both. Appears as a slender androgynous person of about twenty-eight, impossibly beautiful. Height around 1.78 m. Face: fine and sharp, high cheekbones, a small straight nose, a full curving mouth with a knowing half-smile. Skin smooth and pale with a faint gold sheen. Eyes tawny gold, like a cat's, heavy-lidded and amused. Hair short, soft, pale ash blond, swept back. Clothing: an immaculate pale cream three-piece suit, the jacket open, no tie, a deep red rose in the buttonhole; bare feet. A thin gold ring on one finger. Posture: one hip cocked, weight back, hands in pockets, utterly at ease. Expression: amused, intimate, cruel, as if it knows exactly what you want.
SURREAL DETAIL: red rose petals drift in the air around it and never land.
[Style Bible]
```

---

### 3.17 Despair of the Endless (Desire's twin; Episode 3)

**Reference sheet:**
```
[Reference sheet frame]
Despair of the Endless, Desire's twin. A short, heavy-set woman of indeterminate age, around 1.55 m, broad and soft. Skin pale grey, cool and dull like wet clay. Face: round and heavy, a wide flat nose, a small sad mouth, small pale grey eyes that look up through her lashes. Hair dark, lank and thin, falling to her shoulders. Clothing: a simple loose shift of grey linen to the knee, bare grey feet. On one finger an old iron ring with a small hook. Posture: shoulders rounded, head lowered, arms close to her body. Expression: quiet, mournful, gentle, endlessly tired.
SURREAL DETAIL: behind her the backdrop has become a wall of small dim grey mirrors, each one showing a different sad face.
[Style Bible]
```

---

### 3.18 Delirium of the Endless (the youngest; Episode 3)

**Reference sheet:**
```
[Reference sheet frame]
Delirium of the Endless, the youngest, who was once Delight. Appears as a slight teenage girl of about sixteen, around 1.55 m. Face: small and heart-shaped, a pointed chin, freckles, a wide wandering smile. Eyes mismatched: one bright green, one pale blue flecked with silver, never quite looking at the same thing. Hair a messy, choppy crop that shifts through several colours, pink, green, violet, at the tips. Clothing: a torn fishnet top over a too-big striped jumper, a short tutu skirt over ripped tights, one red boot and one yellow boot, mismatched gloves. Posture: tilted, restless, one foot hooked behind the other. Expression: distracted, delighted, a little frightened, about to say something nobody expects.
SURREAL DETAIL: three small brightly coloured fish swim through the air around her head.
[Style Bible]
```

---

### 3.19 The Norse delegation: Odin, Thor and Loki (Episode 4)

**Reference sheet:**
```
Character reference sheet on a seamless matte charcoal studio backdrop: three men standing side by side, full length, equal spacing, the same soft octabox key light at 45 degrees upper left. LEFT, ODIN: about seventy, tall and lean, a long grey beard braided with iron rings, one eye covered by a leather patch, the other ice-blue and hard; a wide-brimmed grey traveller's hat, a long grey wool cloak over mail, a tall ash-wood spear; two black ravens perched on his shoulders. CENTRE, THOR: huge and broad, about forty, a thick red beard and wild red hair, ruddy cheerful face, bare muscled arms with bronze armbands, a leather jerkin, a short-handled iron war hammer hanging from his belt. RIGHT, LOKI: slender, about thirty-five, an original face that resembles no real actor: narrow and fox-like, a long thin nose, heavy freckles, amber eyes, long copper hair in two loose braids, thin lips crossed by faint old white stitch scars from the myth where his mouth was sewn shut; a weathered rust-brown leather coat over a cream shirt, many small silver rings, hands loosely clasped. Expressions: Odin grave and calculating, Thor amiable and loud, Loki amused and watchful.
SURREAL DETAIL: Loki's shadow on the backdrop is that of a different, larger man.
[Style Bible]
```

---

### 3.20 Azazel, Lord of Hell (Episode 4)

**Reference sheet:**
```
[Reference sheet frame]
Azazel, one of the three lords of Hell. Not a man: a tall standing shape of living darkness, about 2.4 m, like a column of black smoke given a rough human outline and a cloak. Inside the darkness, scattered at different depths, dozens of eyes that blink independently and several thin-lipped mouths that open and close. A tarnished iron crown floats where a head would be. One long grey hand with too many joints emerges from the dark, holding a small glass jar in which a tiny bright point of light (a captured soul) flickers. Posture: looming, still. Expression: hungry, patient, polite.
SURREAL DETAIL: the shadow cast on the backdrop is lighter than the figure that casts it.
[Style Bible]
```

---

### 3.21 The Faerie envoys: Cluracan and Nuala (Episode 4)

**Reference sheet:**
```
Character reference sheet on a seamless matte charcoal studio backdrop: two figures side by side, full length, the same soft octabox key light at 45 degrees upper left. LEFT, CLURACAN of Faerie: a slender, beautiful young man of indeterminate age, pointed ears, a cascade of golden curls, sly green eyes, a flushed wine-happy smile; a flamboyant coat of shimmering peacock-blue silk embroidered with gold leaves, lace at the cuffs, a goblet in one hand. RIGHT, NUALA, his younger sister: small and slight but clearly an adult woman of about twenty-five, an original face resembling no real actress: round and freckled, a small upturned nose, large shy hazel eyes, pointed ears, short choppy ash-brown hair with tiny white flowers tucked in it, a simple pale grey-green gown, hands clasped in front of her, a faint shimmer around her like a heat haze (her glamour). Expressions: Cluracan delighted with himself, Nuala nervous and hopeful.
SURREAL DETAIL: small pale moths circle Nuala's head and never come near Cluracan.
[Style Bible]
```

---

### 3.22 The angels: Remiel and Duma (Episode 4)

**Reference sheet:**
```
Character reference sheet on a seamless matte charcoal studio backdrop: two angels side by side, full length, the same soft octabox key light. LEFT, REMIEL: tall, androgynous, about thirty in appearance, a calm perfect face, close-cropped golden hair, pale gold eyes, a simple floor-length white robe, great white wings folded behind, a faint gold light along the edges of the feathers. RIGHT, DUMA, the angel of silence: equally tall, dark-skinned, close-cropped black hair, a grave gentle face, lips closed, in an identical white robe, great grey-white wings folded. Expressions: Remiel serene and certain, Duma silent and sorrowful.
SURREAL DETAIL: there is no shadow beneath either of them.
[Style Bible]
```

---

### 3.23 Calliope, eldest of the Muses (Episode 5)

**Reference sheet:**
```
[Reference sheet frame]
Calliope, the Muse of epic poetry, appearing as a woman of about thirty-five. An original, unknown person who resembles no real actor, celebrity or public figure. Height around 1.72 m, long-limbed, strong shoulders. Face: a long oval with a high forehead, a straight Greek nose with a slight bump, heavy-lidded grey-green eyes, thick dark brows that almost meet, a wide mouth with a deep cupid's bow, a small scar through the left eyebrow. Skin olive, sun-warmed, a few freckles across the nose. Hair: very long, heavy, dark chestnut, loosely braided and coming undone. Clothing: a simple undyed linen shift, sleeveless, belted with a plain cord, bare feet. Posture: tall, guarded, arms folded. Expression: proud and exhausted, a deep weariness held behind dignity.
SURREAL DETAIL: faint lines of ancient Greek verse appear and fade on her forearms like breath on glass.
[Style Bible]
```

---

### 3.24 Richard Madoc, novelist (Episode 5)

**Reference sheet:**
```
[Reference sheet frame]
Richard Madoc, an English novelist of about forty, 1990. An original, unknown person who resembles no real actor, celebrity or public figure. Height around 1.75 m. Heavy-set, thick neck. Face: broad and fleshy with a heavy jaw, a large hooked nose, small dark eyes behind heavy tortoiseshell glasses, a neat short dark beard with grey in it, a fleshy lower lip. Hair: dark, tightly curled, cropped short, greying at the temples. Clothing: a rumpled oatmeal linen jacket over a black polo-neck, dark trousers, expensive loafers, a chunky gold watch. Posture: hands in pockets, shoulders hunched. Expression: charming smile that does not reach the eyes; underneath, panic.
SURREAL DETAIL: ink stains on his fingertips spread very slowly, like ink on wet paper.
[Style Bible]
```

---

### 3.25 The Corinthian, a nightmare (Episode 5)

**Reference sheet:**
```
[Reference sheet frame]
The Corinthian, a nightmare made by the Lady of Dreams, passing as a man of about thirty-five. An original, unknown person who resembles no real actor, celebrity or public figure. Height around 1.85 m, lean and graceful. Face: angular, hollow-cheeked, a long straight nose, a narrow mouth set in a faint amused smile, a long jaw. Skin pale. Hair: white-blond, cut very short. He always wears small round black sunglasses that hide his eyes completely. Clothing: a fitted charcoal suit, a white shirt open at the collar, no tie, black leather gloves, a long dark overcoat. Posture: relaxed, one hand in a pocket, perfectly at ease. Expression: courteous, curious, predatory.
SURREAL DETAIL: in the dark lenses of his glasses, instead of reflections, there is a faint glimpse of small teeth.
[Style Bible]
```

---

### 3.26 Rose Walker (Episode 5)

**Reference sheet:**
```
[Reference sheet frame]
Rose Walker, a young American woman of about twenty, 1990. An original, unknown person who resembles no real actor, celebrity or public figure. Height around 1.63 m, slight. Face: heart-shaped, wide-set warm hazel eyes, a short straight nose, a soft wide mouth, a dimple on the right cheek, a light dusting of freckles. Hair: chin-length, bleached a candy pink with dark brown roots showing, slightly messy. Clothing: a black band T-shirt, a faded denim jacket covered in enamel pins, a short black skirt over black tights, scuffed Doc Martens boots, many thin silver bracelets. Posture: shoulders hunched, hands in jacket pockets. Expression: wary, kind, frightened and trying not to show it.
SURREAL DETAIL: a faint ripple, like heat haze, surrounds her, and the air near her bends as if toward a drain.
[Style Bible]
```

---

### 3.27 Hob Gadling, the man who will not die (Episode 5)

**Reference sheet:**
```
[Reference sheet frame]
Robert "Hob" Gadling, an Englishman who looks about forty and has looked it for six hundred years. An original, unknown person who resembles no real actor, celebrity or public figure. Height around 1.76 m, stocky, broad-chested, strong working hands. Face: square and weathered, a broken nose healed a little crooked, bright brown eyes with deep laughter lines, bushy brown eyebrows, a wide grinning mouth with one chipped front tooth, a short trimmed brown beard with a streak of grey at the chin. Hair: thick brown, collar length. Clothing for this sheet: a 1389 peasant's undyed wool tunic, a leather belt with a knife, a rough brown hood down on his shoulders, a pewter tankard in one hand. Posture: feet planted, chest out. Expression: cocky, cheerful, alive to everything.
SURREAL DETAIL: none of the dust in the air ever settles on him.
[Style Bible]
```

---

### 3.28 Unity Kincaid (Episodes 1 and 5)

**Reference sheet** (attach `assets/keyframes/sandman/1.3d/keyframe.png`: keep her face exactly):
```
[Reference sheet frame]
Unity Kincaid, the woman in the attached image, now as she is in 1990: about eighty-five, very small and frail, white hair in a soft bun, the same face as the attached image, aged, gentle wrinkles, clear pale blue eyes. Clothing: a long pale blue quilted dressing gown over a white cotton nightgown, soft slippers, a thin gold wedding ring she never had reason to wear. Posture: upright despite her age, hands folded. Expression: serene, kind, quietly certain.
SURREAL DETAIL: a single pale butterfly rests on her shoulder, its wings opening and closing slowly.
[Style Bible]
```

---

### 3.29 Lyta Hall (Episode 6)

**Reference sheet:**
```
[Reference sheet frame]
Lyta Hall, a Korean-American woman of about twenty-eight, 1990, heavily pregnant (about eight months). An original, unknown person who resembles no real actor, celebrity or public figure. Height around 1.65 m, athletic build softened by pregnancy. Face: oval with high cheekbones, a strong straight jaw, dark brown monolid eyes with thick straight brows, a small straight nose, full lips set firm. Hair: black, thick, cut in a blunt shoulder-length bob with a heavy fringe. Clothing: a loose dusty-rose maternity dress, an oversized faded denim shirt worn open over it, white sneakers, a thin gold wedding band. Posture: one hand on her belly, shoulders squared. Expression: guarded, fierce, exhausted, a mother ready to fight.
SURREAL DETAIL: faint, slow ripples pass across the fabric over her belly, like light on water.
[Style Bible]
```

---

### 3.30 Hector Hall, a ghost (Episode 6)

**Reference sheet:**
```
[Reference sheet frame]
Hector Hall, Lyta's husband, a Korean-American man of about thirty who died and lingers as a ghost in a dream. An original, unknown person who resembles no real actor, celebrity or public figure. Height around 1.80 m, lean. Face: kind and open, a square jaw, warm dark monolid eyes, short black hair neatly side-parted, a faint smile. Clothing: a 1970s-style superhero costume he believes in: a bright yellow and red bodysuit with a small hourglass emblem on the chest and a short red cape. His whole figure is faintly translucent, slightly desaturated, edges softened like a fading photograph. Expression: earnest, loving, a little lost.
SURREAL DETAIL: the backdrop shows faintly through his chest.
[Style Bible]
```

---

### 3.31 Destruction of the Endless, the Prodigal (Episode 6)

**Reference sheet:**
```
[Reference sheet frame]
Destruction of the Endless, Aurie's brother who walked away from his duties three hundred years ago, appearing as a huge East Asian man of about fifty. An original, unknown person who resembles no real actor, celebrity or public figure. Height around 2.0 m, enormously broad and strong, a little heavy now. Face: broad and weathered, a big generous mouth, crinkled laughing dark eyes, a strong nose, a thick black beard streaked with grey, long black hair tied back loosely. Clothing: a paint-spattered loose linen shirt with sleeves rolled up over huge forearms, canvas trousers, bare feet; a paintbrush in one hand, a palette of garish colours in the other. Posture: relaxed, enormous, gentle. Expression: warm, amused, peaceful, with old sadness underneath.
SURREAL DETAIL: the paint on his palette shifts colour slowly on its own.
[Style Bible]
```

---

### 3.32 Barnabas, Destruction's dog (Episode 6)

**Reference sheet:**
```
Character reference sheet on a seamless matte charcoal studio backdrop: three views of the same dog side by side, the same soft octabox key light: LEFT head-and-shoulders, CENTRE three-quarter view standing, RIGHT full side view sitting. Barnabas, a large shaggy grey-and-white mongrel with a long intelligent face, floppy ears, bushy eyebrows, a grizzled muzzle and a worn leather collar; he looks wise, grumpy and patient, as if he is about to say something sarcastic.
SURREAL DETAIL: his expression is unmistakably human.
[Style Bible]
```

---

### 3.33 Matthew, the raven (Episode 6)

**Reference sheet:**
```
Character reference sheet on a seamless matte charcoal studio backdrop: three views of the same large common raven side by side, the same soft octabox key light: LEFT a close-up of the head, CENTRE perched on a plain wooden rail in three-quarter view, RIGHT wings half spread. Glossy blue-black feathers with an oily sheen, a heavy black beak, shaggy throat feathers, bright black curious eyes. Alert, cocky, a little nervous.
SURREAL DETAIL: his eyes hold a tiny glint of something human.
[Style Bible]
```

---

### 3.34 Orphea, Aurie's daughter (Episode 6)

**Reference sheet:**
```
[Reference sheet frame]
Orphea, daughter of Aurie (Dream of the Endless) and the Muse Calliope, the greatest singer of ancient Greece, appearing as a woman of about twenty-four, half East Asian and half Greek. An original, unknown person who resembles no real actor, actress, celebrity or public figure. Height around 1.70 m, slender and graceful, a dancer's shoulders. Face: a soft oval with her mother Aurie's full cheeks and soft rounded jaw, large almond single-lidded dark eyes with long lashes, Calliope's straight Greek nose with a slight bump, full lips. Skin warm golden olive. Hair: black, very long, thick loose waves to the waist, a thin gold laurel circlet. Clothing: in the ancient Greek tradition, a short sheer white linen chiton pinned at one shoulder with a gold brooch, leaving the other shoulder, her arms and her legs bare, belted high under the bust with a gold cord, gold armbands, bare feet, a lyre in her hands. Beautiful, sensual and confident, like a classical goddess statue come to life; glamorous, never explicit. Posture: relaxed, weight on one hip, a musician's elegant hands on the strings. Expression: warm, a little sad, knowing.
SURREAL DETAIL: faint notes of golden light drift from the strings of the lyre.
[Style Bible]
```

---

### 3.35 Thessaly, the witch (Part Seven)

**Reference sheet:**
```
[Reference sheet frame]
Thessaly, a witch of ancient Thessaly who is three thousand years old and looks like a petite woman of about twenty-five. An original, unknown person who resembles no real actor, actress, celebrity or public figure. Height around 1.58 m, slight and athletic, a fighter's poise. Face: heart-shaped with a small pointed chin, wide-set pale green eyes under straight dark-blonde brows, a short straight nose with a few faint freckles, a small firm mouth that rarely smiles. Hair: honey-blonde, shoulder length, sleek and straight, tucked behind one ear. Clothing: a glamorous, fitted witch-fighter look: a black leather corset-style bodice that leaves her shoulders, arms and a strip of midriff bare, a short black skirt slit at the side over sheer black tights and laced knee-high black boots, a long black velvet coat worn open and slipping off her shoulders, thin silver cuffs and rings carved with old Greek letters, a small silver moon pendant. Stylish and attractive, never explicit. Posture: weight on one hip, arms folded, utterly unimpressed. Expression: deadpan, dry, quietly dangerous.
SURREAL DETAIL: the moon pendant glows faintly, as if lit from far away, and her shadow on the backdrop is slightly taller than she is.
[Style Bible]
```

---

### 3.39 Alex Burgess as a boy (Part One branch, 1924 to 1926)

**Reference sheet** (no photographs: an original child drawn from this description, consistent with the adult Alex):
```
[Reference sheet frame]
Alex Burgess as a boy of eight to ten, Singaporean Chinese, an original child who resembles no real person. Face: a very broad, round, full face with full cheeks and a soft rounded chin; narrow single-lidded dark eyes; a broad nose with a rounded tip; full lips; slightly prominent ears. Small black-framed rectangular spectacles a little too big for him, sliding down his nose (they are his signature at every age). Hair: thick straight black hair, cut short at the sides by a strict barber, a cowlick at the crown. Build: sturdy, a little chubby. Clothing: 1920s English country-house boy's night clothes: striped flannel pyjamas, a too-large tartan dressing gown, bare feet. Posture: shoulders hunched, holding a candle, curious and frightened at once. Expression: wide-eyed, solemn, a lonely child in a cold house.
SURREAL DETAIL: a few grains of glittering sand cling to his pyjama sleeve, as if he has been somewhere he should not.
[Style Bible]
```

---

### 3.36 Daniel Hall as a child (Part Seven)

**Reference sheet:**
```
[Reference sheet frame]
Daniel Hall, a Korean-American boy of about two years old, the son of Lyta and Hector Hall from their sheets: round cheeks, dark brown monolid eyes, soft black hair, a serious little face. Clothing: soft white cotton pyjamas with tiny stars. Posture: standing, holding a small worn plush owl. Expression: calm and curious, uncannily still for a toddler.
SURREAL DETAIL: a few grains of pale silver sand rest in his hair and never fall.
[Style Bible]
```

---

### 3.37 Daniel, the new Dream (Part Seven)

**Reference sheet:**
```
[Reference sheet frame]
Daniel, the new Dream of the Endless: the child Daniel grown into a young man of about twenty-five, Korean-American, his face recognisably the boy's (round cheeks grown lean, the same dark eyes), but pale as moonlight. Height around 1.82 m, slender. Hair: pure white, softly tousled. His eyes are dark with a single pinpoint of white light in each, like a distant star. Clothing: a long flowing high-collared robe of white silk-wool, the opposite of Aurie's black, with a faint shimmer of pale stars in its folds; a pendant of green stone at his throat. Posture: still, gentle, newly come into himself. Expression: kind, grave, a little sad.
SURREAL DETAIL: a slow drift of white sand rises from the hem of his robe instead of falling.
[Style Bible]
```

---

### 3.38 The Kindly Ones (Part Seven)

**Reference sheet** (attach `characters/fates/sheet.png`: the same three women):
```
Character reference sheet on a seamless matte charcoal studio backdrop: the same three women as in the attached sheet, the Maiden, the Mother and the Crone, standing side by side, full length, now in their darker aspect as the Kindly Ones, the Furies. Each wears a long hooded robe of rough black wool; their faces are the same as in the attached sheet but drained and grey, eyes in deep shadow with a faint ember-red glint. The Maiden holds a spindle, the Mother a length of red thread pulled taut between her hands, the Crone a pair of old iron shears. Posture: utterly still, patient, inevitable. Expression: cold, polite, merciless.
SURREAL DETAIL: the red thread runs from the Mother's hands out of the frame, taut, as if tied to someone far away.
[Style Bible]
```

---

## 3n. Neverwhere cast (Book 2)

Every Neverwhere character, studied from the novel (`source-text/neverwhere.txt`) and `story-map-neverwhere.md` §7, with the owner's casting (2026-10-24): the roles the novel leaves open are East and South-East Asian Londoners (Door, Anaesthesia, Jessica, Gary, Lamia, Hammersmith, Lear, and so Door's father, Lord Portico); the looks the novel fixes stay as written, except Hunter, recast by the owner as an Asian woman, and Lamia, now half East Asian and half Greek (round 1 review). Door, Hunter and Lamia are styled alluring at the owner's request: curvy, revealing within each one's own fashion, never explicit. Every character is an original, unknown person who resembles no real actor, celebrity or public figure, and above all no actor from the 1996 BBC series, the 2013 radio drama or any stage version. Sheets are approved in chat before anyone appears in a picture (plan rule 4). Tiers: **A** sheet + head angles + turnaround (on video or with a talking loop); **B** sheet + turnaround (one action clip) or sheet + head angles (Gary); **C** sheet only. Lucienne, Death, Daniel and Hob come from the Sandman, already approved.

### N01 Aurie Mayhew, the hero (tier A; real person)

**Reference sheet** (attach Charmaine's face crops and straight-on photographs first; likeness gate 0.45):
```
[Reference sheet frame]
Use the attached photographs as the exact face of this woman. She must be instantly recognisable to her family: keep her bone structure, the shape and set of her eyes, her brows, nose, lips, chin and the proportions between them exactly as they are: a full, round, soft face, wider than it is long, full cheeks and a soft rounded jaw; straight thick dark brows set fairly low; almond eyes with subtle single eyelids and slightly downturned outer corners; a broad nose with a soft rounded tip; a small mouth with a fuller lower lip. Do not slim, reshape or idealise her. Make her lovely the way a portrait photographer would, with light and calm, never by changing her face.
She is Aurie Mayhew, a London office worker in her thirties, a mortal woman: her own natural skin tone with real texture, her own dark eyes (no star-points), her own long straight dark brown-black hair worn loose past the shoulders, a little untidy. BODY: a curvy, full-figured woman of average height; keep her real shape and proportions; do not slim her.
CLOTHING (the look she wears for most of the story): a thick cream cable-knit wool sweater, slightly oversized; dark blue straight-leg jeans; worn white canvas sneakers; a black sports bag on one shoulder. Clean and new for this sheet.
POSE: standing easy, weight on one hip, one hand on the strap of the bag. EXPRESSION: open, kind, a little bewildered, the face of someone who stops for strangers.
SURREAL DETAIL: a single rough quartz bead in her jeans pocket catches a light that is not in the room.
[Style Bible]
```

### N02 Door (tier A)

**Reference sheet:**
```
[Reference sheet frame]
Door, the Lady Door of the House of Arch, a young British Chinese woman of about twenty-two, a grown woman, petite (about 1.58 m) with a curvy figure: a small waist, full bust and hips, shapely legs. An original, unknown person who resembles no real actor, celebrity or public figure, and no actor from any adaptation of Neverwhere. Very pretty: a pale, heart-shaped, elfin face, a small pointed chin, high delicate cheekbones, a small straight nose, full soft lips. Eyes: large, almond-shaped, single-lidded, with long lashes, and their irises are like fire opals, flickering green, blue, red and gold as she moves. Hair: short, choppy, tousled, near-black with deep auburn and copper lights where the light catches it.
CLOTHING (London Below's patched, layered fashion, made alluring): a fitted corset bodice pieced together from patched brocade, velvet and silk in faded jewel colours (garnet, bottle green, old gold), laced up the front, with a low sweetheart neckline; sheer torn black lace sleeves; a short layered skirt of ripped taffeta, velvet and lace scraps, longer at the back, the rips showing other layers beneath; patterned black stockings with a ladder in one, worn black lace-up boots. Over it, worn open and slipping off one shoulder, the enormous battered brown leather flying jacket with a sheepskin collar, much too big for her. Pretty and seductive, never explicit.
Posture: weight on one hip, one hand on the jacket's collar, quick and confident. Expression: wary, determined, a little defiant, aware she is being looked at.
SURREAL DETAIL: where her hand rests on the jacket's zip, hairline seams of white light run through the metal, as if it wants to open.
[Style Bible]
```

### N03 The marquis de Carabas (tier A)

**Reference sheet:**
```
[Reference sheet frame]
The marquis de Carabas, a tall Black British man of uncertain age, perhaps forty, about 1.90 m, lean, who moves like a great cat. An original, unknown person who resembles no real actor, celebrity or public figure, and no actor from any adaptation of Neverwhere. Face: very dark skin, a long elegant face with high cheekbones and a strong jaw, eyes whose whites burn bright in the dark face, a sudden wide grin of white teeth. Hair: long black locs tied back at the nape. Clothing: a huge dandyish black coat, neither frock coat nor trench coat, cut long and full with far too many inside pockets, its lace cuffs grubby and torn; under it ragged mismatched layers, a once-fine waistcoat with a missing button; high square-toed black boots; a gold pocket watch on a chain across the waistcoat. Posture: lounging, weight on one hip, one hand inside the coat. Expression: amused, sly, measuring everyone's price.
SURREAL DETAIL: the coat's lining shows more pockets than a coat could hold, receding into darkness.
[Style Bible]
```

### N04 Hunter (tier A)

**Reference sheet:**
```
[Reference sheet frame]
Hunter, a tall Asian woman of no readable age (she could be thirty-five or a thousand), about 1.78 m, of Kazakh and Han Chinese descent, with a lean, athletic and curvy build: long strong legs, a narrow waist, toned arms, full hips and bust. An original, unknown person who resembles no real actor, celebrity or public figure, and no actor from any adaptation of Neverwhere. Face: sun-warmed golden-brown skin, high wide cheekbones, a strong elegant jaw, hooded almond eyes of a warm nut-brown that miss nothing, a full mouth whose rare smile could stop a revolution; a calm face like carved wood at rest. Hair: very long, thick and dark, turning tawny bronze toward the ends, in a loose heavy braid over one shoulder.
CLOTHING (a hunter's leathers, thinner and close-fitting): a sleeveless fitted top of thin soft suede, dappled grey and brown like an animal's coat, laced at the sides and cut to the waist, leaving her shoulders and toned arms bare; thin supple dappled leather leggings that follow every line of her legs; soft knee-high boots; leather wraps around her forearms; a broad hunting knife in a sheath on a low-slung belt; a small torch strapped to her left wrist; a long wooden quarterstaff in one hand; a battered canvas duffel on the floor beside her. Strong and sexy, never explicit.
Posture: perfectly balanced, weight on one leg, staff planted. Expression: watchful, unreadable, faintly amused.
SURREAL DETAIL: the dust on the floor does not stir where she stands.
[Style Bible]
```

### N05 Mr Croup (tier A)

**Reference sheet:**
```
[Reference sheet frame]
Mr Croup, one of two very old killers who look like men, about 1.70 m, thin and quick, always almost dancing. An original, unknown person who resembles no real actor, celebrity or public figure, and no actor from any adaptation of Neverwhere. Face: pallid skin, a sharp foxlike face, faded china-blue eyes, lank greasy hair of an unlikely orange, a wide grin of teeth like an accident in a graveyard. Clothing: a greasy, frayed black suit made two hundred years ago from someone's description of a modern suit, so every line and seam is subtly wrong: lapels too wide, buttons in odd places, trousers a little short; a grubby white shirt, a thin black tie. No jewellery. Posture: leaning forward, hands rubbing together. Expression: delighted, oily, dangerous.
SURREAL DETAIL: his smile is a fraction of a second late, a faint ghost of the previous expression still on his face.
[Style Bible]
```

### N06 Mr Vandemar (tier A)

**Reference sheet:**
```
[Reference sheet frame]
Mr Vandemar, Mr Croup's partner, a huge impassive man about 2.05 m tall, broad as a door. An original, unknown person who resembles no real actor, celebrity or public figure, and no actor from any adaptation of Neverwhere. Face: a bullet head, grey-and-black hair cut bristle-short, flat calm brown eyes, a heavy jaw, no expression at all. Clothing: the same wrong two-hundred-year-old black suit as his partner, straining at the shoulders; on his right hand four rings made from the small skulls of ravens; the hilt of a knife just visible at his sleeve. Posture: utterly still, arms at his sides, like something that has never needed to hurry. Expression: blank, patient, literal.
SURREAL DETAIL: a thin line of an old wound on the back of his hand knits closed as you watch.
[Style Bible]
```

### N07 The Angel Islington (tier A)

**Reference sheet:**
```
[Reference sheet frame]
The Angel Islington, an angel who has lived under London since Atlantis sank, about 1.80 m, barefoot, neither man nor woman: perfectly androgynous and very beautiful. An original, unknown person who resembles no real actor, celebrity or public figure, and no actor from any adaptation of Neverwhere. Face: pale, wise, gentle and slightly lonely, smooth ageless skin, a straight nose, a calm mouth; luminous pearl-grey eyes as old as the universe. Hair: golden, shoulder length, soft. Clothing: a plain long robe that looks white and then looks woven from light, no belt, no ornament. No wings. Posture: serene, hands open at its sides. Expression: kind, patient, infinitely sad.
SURREAL DETAIL: the candles nearest it have lit themselves, and the ones behind it have just gone out, trailing smoke.
[Style Bible]
```

### N08 Lamia (tier A)

**Reference sheet:**
```
[Reference sheet frame]
Lamia, a Velvet, one of London Below's pale cold women who live on the warmth of others, named for the Greek lamia; she appears as a woman of about twenty-eight, half East Asian and half Greek, about 1.68 m, with a lean, curvy build: a narrow waist, full bust and hips, long slender legs, graceful arms. An original, unknown person who resembles no real actor, actress, celebrity or public figure, and no actor from any adaptation of Neverwhere. Face: a soft oval with high cheekbones and a delicate pointed chin, a straight classical Greek nose, almond eyes with long lashes whose irises are the colour of foxgloves (a soft purple-pink), full lips the deep colour of plum bloom; very pale porcelain skin with a faint cool sheen. Hair: thick and black, gathered high in a Greek-style updo of soft coils, pinned with silver pins and a thin silver circlet, a few curls loose at the neck.
CLOTHING: a long black gown in the cut of a Greek chiton, made of black velvet and sheer black chiffon: a fitted black velvet bodice under translucent black chiffon draped from both shoulders and pinned there with silver brooches, a deep V neckline, the chiffon falling sheer over her arms, sides and back so her pale skin shows through it, a slim velvet skirt with a high slit to the thigh, a fine silver cord belt high under the bust; silver rings and a silver collar. Elegant, seductive and sensual, never explicit.
Posture: very still, weight on one hip, one hand resting lightly at her collarbone. Expression: amused, curious, hungry under the politeness.
SURREAL DETAIL: frost feathers the chiffon at her fingertips, and her breath does not mist in the cold air.
[Style Bible]
```

### N09 Anaesthesia (tier A)

**Reference sheet:**
```
[Reference sheet frame]
Anaesthesia, a rat-speaker girl of London Below, a British Filipina of nineteen who looks exactly nineteen, clearly adult but young, thin and small, about 1.52 m. An original, unknown person who resembles no real actor, celebrity or public figure. Face: young and quick, soft youthful skin, a small chin, large dark watchful eyes, never gaunt or older-looking, a small mouth she hides behind her hand when she laughs, a smudge of soot on one cheek. Hair: black, long and ragged, tied back with string. Clothing: ragged layers trimmed with scraps of fur, fingerless gloves, a necklace of rough clear quartz beads on a string, a stained red birthday badge reading I AM 11 pinned to her coat; she holds a lit candle inside a cut-down lemonade bottle. Posture: hunched, ready to scurry. Expression: shy, curious, braver than she looks.
SURREAL DETAIL: two small brown rats sit at her feet looking the same way she does.
[Style Bible]
```

### N10 Old Bailey (tier A)

**Reference sheet:**
```
[Reference sheet frame]
Old Bailey, an old man who lives on London's rooftops and talks to birds, round and short, about 1.60 m. An original, unknown person who resembles no real actor, celebrity or public figure. Face: kind, creased and weathered, a red nose, bright small eyes, grey muttonchop whiskers; battered spectacles hanging on a string round his neck. Clothing: a nameless garment, part coat and part cape, covered thickly and entirely in feathers of every kind, ropes wound round and round his body, fingerless gloves more hole than glove, old boots. Posture: rocking on his heels. Expression: cheerful, shrewd, fond.
SURREAL DETAIL: a single feather lifts off his coat and, a little way off, is turning into a small grey bird.
[Style Bible]
```

### N11 The abbot of the Black Friars (tier A)

**Reference sheet:**
```
[Reference sheet frame]
The abbot of the Black Friars, a very old Black British man of about ninety, slight and stooped, about 1.70 m. An original, unknown person who resembles no real actor, celebrity or public figure. Face: deep brown, deeply lined, gentle; eyes glaucous blue-white with cataracts, blind; a short white beard. Clothing: a black Dominican habit with its cowl down over his shoulders, a plain wooden rosary at the belt; one gnarled brown hand resting on a plain wooden walking stick. Posture: upright despite his age. Expression: serene, wry, listening.
SURREAL DETAIL: the steam from the cup of tea in his other hand bends toward his face as if he could see it.
[Style Bible]
```

### N12 Jessica Bartram (tier A)

**Reference sheet:**
```
[Reference sheet frame]
Jessica Bartram, Aurie's fiancée, a British Korean woman of twenty-six, very beautiful, about 1.70 m. An original, unknown person who resembles no real actor, celebrity or public figure. Face: an oval face, dark flashing eyes, strong elegant brows, a confident mouth. Hair: long, glossy, dark chestnut, in loose corkscrew curls. Clothing: a smart camel city coat over a fitted black dress, black heels, a slim leather bag, an engagement ring; poised and expensive. Posture: upright, organised, a phone in one hand. Expression: polite, busy, a little terrifying.
SURREAL DETAIL: on the page of her diary, one name is fading as you look at it.
[Style Bible]
```

### N13 The earl of Earl's Court (tier A)

**Reference sheet:**
```
[Reference sheet frame]
The earl of Earl's Court, an immense elderly Englishman, about 2.05 m and broad, so tall his head brushes a ceiling. An original, unknown person who resembles no real actor, celebrity or public figure. Face: ruddy and jovial, a black patch over his left eye, a big red-grey beard with crumbs in it, bushy brows. Clothing: a fur cap over his balding head, a fur-lined dressing gown of faded wine-red brocade, striped pyjama trousers, carpet slippers; a heavy gold chain of office over the gown. Posture: expansive, one hand on his belly. Expression: delighted, forgetful, a little dangerous.
SURREAL DETAIL: a coin in his hand is dated a year that has not happened yet.
[Style Bible]
```

### N14 The Lord Rat-speaker (tier B, turnaround)

**Reference sheet:**
```
[Reference sheet frame]
The Lord Rat-speaker, ruler of the rat-speakers, a tall man of about fifty bent into a permanent stoop. An original, unknown person who resembles no real actor, celebrity or public figure. Face: long and gaunt, a patchy brown beard, yellow teeth, small suspicious eyes; long greasy hair. Clothing: rags trimmed with orange, white and black calico fur; a glass dagger with a fur-wrapped grip in his belt. Posture: stooped, hands held at his chest with the fingertips pressed together. Expression: obsequious, sly, afraid of the rat he serves.
SURREAL DETAIL: his shadow on the backdrop has a long thin tail.
[Style Bible]
```

### N15 Varney (tier B, turnaround)

**Reference sheet:**
```
[Reference sheet frame]
Varney, a hired bodyguard of London Below, a huge man about 1.95 m, like a bull that has been shaved, dehorned and tattooed. An original, unknown person who resembles no real actor, celebrity or public figure. Face: a shaven scarred head, heavy brow, broken nose, a mouth of complete dental ruin. Clothing: a jacket and trousers stitched together from old car-seat upholstery and rubber car mats, heavy boots, tattoos down his arms; a spiked morning-star on a chain in one fist. Posture: chest out, looming. Expression: stupid, cruel, sure of himself.
SURREAL DETAIL: a faint heat haze trails from the morning-star as if he were lifting it with his mind.
[Style Bible]
```

### N16 Brother Sable (tier B, turnaround)

**Reference sheet:**
```
[Reference sheet frame]
Brother Sable of the Black Friars, a tall Black British friar of about forty, about 1.92 m, powerful. An original, unknown person who resembles no real actor, celebrity or public figure. Face: skin the dark brown of old mahogany, a calm strong face, a shaved head, a split lower lip healing. Clothing: a black Dominican habit, sleeves pushed up; a plain wooden quarterstaff as tall as himself. Posture: staff grounded, feet apart. Expression: stern, fair, unhurried.
SURREAL DETAIL: the mist at his feet parts around the staff in a perfect circle.
[Style Bible]
```

### N17 The Great Beast of London (tier B, turnaround)

**Reference sheet:**
```
Creature reference sheet on a seamless matte charcoal studio backdrop, three views of the identical animal side by side, the same soft octabox key light: LEFT its head straight on, CENTRE three-quarter view standing, RIGHT full side view. The Great Beast of London: a boar that escaped into the Fleet Ditch three centuries ago and grew in the sewers to the size of a bull elephant, about 3.5 m at the shoulder. A steaming, bristled black-brown hide, matted and scarred, stuck all over with the broken shafts of spears, shattered sword blades and rusted knives from three hundred years of hunters; two great curved tusks jutting up and outward from the lower jaw like a wild boar's (never horns), yellowed, chipped and stained with dried blood; small red eyes; a ridge of coarse bristles along the spine. It looks ancient and slow, and enormous.
SURREAL DETAIL: drops of sewer water hang motionless in the air around it.
[Style Bible]
```

### N18 Gary (tier B, head angles)

**Reference sheet:**
```
[Reference sheet frame]
Gary, Aurie's colleague and friend, a British Chinese man of about thirty, about 1.75 m, slim. An original, unknown person who resembles no real actor, celebrity or public figure. Face: friendly and open, clean-shaven, black hair neatly cut and gelled so every hair is in place, rimless glasses. Clothing: a grey office suit, a white shirt, a loosened blue tie, a lanyard. Posture: easy, hands in his trouser pockets. Expression: kind, worried, out of his depth.
SURREAL DETAIL: the mug of tea in his hand is the only thing in the frame that steams.
[Style Bible]
```

### N19 The old woman with the umbrella (tier C)

**Reference sheet:**
```
[Reference sheet frame]
An old Scottish woman, very old, small, who was once a dancer. An original, unknown person who resembles no real actor, celebrity or public figure. Face: a beaky, grimy, wrinkled face with two very sharp bright eyes, white hair escaping a wool hat of no colour. Clothing: layer upon layer of old coats and shawls; she holds a white umbrella printed with the map of the London Underground. Posture: upright, a dancer's straight back under all the layers. Expression: shrewd, kind, amused.
SURREAL DETAIL: the rain around her is falling slightly slower than it should.
[Style Bible]
```

### N20 Tooley, the earl's jester (tier C)

**Reference sheet:**
```
[Reference sheet frame]
Tooley, the earl's jester, an arthritic old man of about seventy, small and bent. An original, unknown person who resembles no real actor, celebrity or public figure. Face: a painted face, white with faded red cheeks, a pinched, humourless mouth, tired eyes. Clothing: faded patched motley of red and yellow, a limp cap with tarnished bells, a bauble on a stick. Posture: hunched. Expression: sour, wary, a joke he has told too many times.
SURREAL DETAIL: the bells on his cap ring though he is not moving.
[Style Bible]
```

### N21 Iliaster (tier C)

**Reference sheet:**
```
[Reference sheet frame]
Iliaster, a man of London Below who lives among the homeless of London Above, short and old, about 1.58 m. An original, unknown person who resembles no real actor, celebrity or public figure. Face: balding, a scraggly yellow-and-grey beard, facial lines etched with black dirt, grey rheumy eyes. Clothing: a filthy long coat over a ruined dark grey sweater, fingerless gloves; an old railwayman's lamp that gives less light than a match. Posture: shoulders hunched. Expression: suspicious, then cautiously kind.
SURREAL DETAIL: the rain falls around him without touching him.
[Style Bible]
```

### N22 Mr Ross, the canary (tier C)

**Reference sheet:**
```
[Reference sheet frame]
Mr Ross, a killer Croup and Vandemar use as their canary, huge, almost as big as Vandemar, about 2.0 m. An original, unknown person who resembles no real actor, celebrity or public figure. Face: completely hairless head and face, heavy and grubby, small dull eyes. Clothing: a filthy T-shirt, crusted blue jeans, heavy boots. Posture: lumbering. Expression: dull menace, pleased with himself.
SURREAL DETAIL: a small yellow feather is caught on his shoulder.
[Style Bible]
```

### N23 Lear, the busker (tier C)

**Reference sheet:**
```
[Reference sheet frame]
Lear, a busker in the Bank tunnel who can see London Below, a British Vietnamese man of about forty, extremely tall, about 1.98 m, thin. An original, unknown person who resembles no real actor, celebrity or public figure. Face: long, deep-set eyes, a serious nose, a long forked black beard, shoulder-length black hair. Clothing: a ragged T-shirt, oil-stained jeans, an old army coat spread at his feet with a few coins on it; a battered tenor saxophone. Posture: stooped over the saxophone. Expression: dreamy, sad, alert.
SURREAL DETAIL: the coins on his coat are dated years that have not happened yet.
[Style Bible]
```

### N24 Serpentine of the Seven Sisters (tier C)

**Reference sheet:**
```
[Reference sheet frame]
Serpentine of the Seven Sisters, a towering old Englishwoman, about 2.0 m, gaunt and imperious. An original, unknown person who resembles no real actor, celebrity or public figure. Face: ravaged and proud, sharp grey eyes, a mouth like a cruel slash, greying hair piled high. Clothing: a white leather corset and high white leather boots over the shredded, dirt-stained remains of a long lace wedding dress. Posture: very straight, one hand on the back of a chair. Expression: contemptuous, amused, ancient.
SURREAL DETAIL: the torn train of the dress drags through a puddle and leaves no mark.
[Style Bible]
```

### N25 Hammersmith (tier C)

**Reference sheet:**
```
[Reference sheet frame]
Hammersmith, a smith of London Below, a Mongolian Londoner of about forty built like a small mountain, about 2.0 m, enormously broad. An original, unknown person who resembles no real actor, artist, celebrity or public figure. Face: broad and wind-burnt, a flat broad nose, warm round dark eyes, long black hair pulled back into a topknot, a thick black beard braided into a short plait at the chin, a shy smile. Clothing: a heavy scorched leather apron over a bare barrel chest and huge arms, a hammer in one hand that looks small in it, a black iron rose in the other. Posture: careful, as if afraid of breaking things. Expression: gentle, bashful.
SURREAL DETAIL: a drop of dew sits on the iron rose and does not dry in the forge heat.
[Style Bible]
```

### N26 Brother Fuliginous (tier C)

**Reference sheet:**
```
[Reference sheet frame]
Brother Fuliginous of the Black Friars, a young Black British friar of about twenty-five, slight, about 1.72 m. An original, unknown person who resembles no real actor, celebrity or public figure. Face: deep rich brown skin, a thin nervous face, a short-cropped head. Clothing: a black Dominican habit; a battered old Polaroid camera on a strap. Posture: eager, a little nervous. Expression: earnest.
SURREAL DETAIL: a Polaroid developing in his hand shows a face that is not in the room.
[Style Bible]
```

### N27 Lord Portico, Door's father (tier C)

**Reference sheet:**
```
[Reference sheet frame]
Lord Portico of the House of Arch, Door's father, a British Chinese man of about sixty, thin and ascetic. An original, unknown person who resembles no real actor, celebrity or public figure; his face is clearly related to Door's (the same heart-shaped face and pointed chin, grown long and lean with age). Face: almost bald, a high forehead, deep-set wise eyes, a thin mouth; "Caesar as Prospero". Clothing: a threadbare velvet smoking jacket, a black skullcap. Posture: upright, hands clasped behind his back. Expression: grave, tender, tired.
SURREAL DETAIL: an orange in his hand is slowly turning itself inside out.
[Style Bible]
```

### N28 The rats of London Below (tier C)

**Reference sheet:**
```
Creature reference sheet on a seamless matte charcoal studio backdrop, three views of the identical animal side by side, the same soft octabox key light: LEFT head close-up, CENTRE three-quarter view sitting up on its haunches, RIGHT full side view walking. Master Longtail, a large old black rat with a grizzled muzzle, a torn left ear, long whiskers and bright clever black eyes; a lord among rats, dignified and amused.
SURREAL DETAIL: his expression is unmistakably that of someone about to wink.
[Style Bible]
```

### N29 Props of Neverwhere

**Prop sheet:**
```
Prop reference sheet on a seamless matte charcoal studio backdrop, five objects laid out in one row with equal spacing, each lit by the same soft octabox key light, photographed straight on, no text, no labels. Left to right: (1) the key of the Black Friars: an old silver key about 12 cm long, an ornate bow worked with tiny angels' wings, tarnished, hanging from a plain grey thread; (2) Hunter's knife: a broad-bladed hunting knife with a worn bone handle and a brass guard; (3) the spear of faces: a bronze-headed spear, its wooden haft carved with small grotesque faces, shown upright; (4) the token: a small black obsidian statuette of a boar, about 8 cm long; (5) Old Bailey's silver box: a small tarnished silver snuffbox, its lid engraved with a bird.
SURREAL DETAIL: the silver key casts a shadow slightly larger than itself.
[Style Bible]
```

---

## 3b. Expression and pose sheets (movement library)

Every speaking character gets two extra sheets, always generated from their approved reference sheet. They give Kling more to work with (more varied, more natural movement per clip) and they are the source frames for the **reaction loops**: short looping clips, one per mood, that play behind live dialogue so a character visibly reacts to what Aurie says (see `ai-dialogue-design.md` §6).

Expression frame, used by all:
```
Expression sheet: a three-by-two grid of six head-and-shoulders photographs of the identical person in the attached reference sheet. Same face, hair, spectacles, clothing, same plain charcoal backdrop and the same soft key light in every frame, evenly spaced, no text, no labels, no borders. Each frame is a real, unposed-looking moment, the expression carried by the whole face (eyes, brows, mouth, jaw, neck tension), never a caricature. Left to right, top row then bottom row:
```

Pose frame, used by all:
```
Pose sheet: a three-by-two grid of six full-length photographs of the identical person in the attached reference sheet. Same face, hair, spectacles and clothing, same plain charcoal backdrop and soft key light in every frame, evenly spaced, no text, no labels, no borders. Each frame catches a real action mid-movement, weight shifting, fabric swinging, a trace of motion blur in the hands and hair only, the face sharp. Left to right, top row then bottom row:
```

**aurie expressions**
```
1 regal calm, eyes level, the faintest warmth at the mouth. 2 cold fury held perfectly still, nostrils slightly flared, jaw set. 3 sorrow, eyes wet but not crying, looking down and away. 4 a rare true smile, small and surprised by itself. 5 contempt, chin lifted, eyelids lowered, looking down the nose. 6 exhausted vulnerability, eyes closed, head tilted back, lips parted.
```

**aurie poses**
```
1 curled on the floor of the glass sphere, bare and pale, hair spread, one hand flat against the glass. 2 rising from a crouch, one hand trailing, hair lifting upward. 3 striding forward, the long gown swinging, hand raised to dissolve something into sand. 4 seated upright on a throne-like chair, one hand on the armrest, utterly still. 5 turning back over her shoulder mid-stride, hair swinging. 6 kneeling to touch the ground, fingers spread, sand rising from beneath her palm.
```

**burgess expressions**
```
1 proprietary calm, the satisfied purse of the lips. 2 triumphant, eyes wide, mouth open mid-proclamation. 3 cold anger, eyes narrowed, lips thinned white. 4 sudden fear he is trying to hide, eyes flicking sideways, a swallow. 5 grief for his dead son, the mask slipping, eyes red. 6 a sneer of contempt, one corner of the mouth pulled up.
```

**burgess poses**
```
1 reading aloud at a lectern, one hand flat on an open book, the other raised. 2 crouching to peer at something at floor level, robe pooling on the floor. 3 pacing, hands clasped behind his back, robe swinging. 4 pointing an accusing finger. 5 recoiling a step backward, arm half raised. 6 sitting heavily in a carved chair, head in one hand.
```

**alex-young expressions**
```
1 anxious politeness, lips pressed together. 2 a flinch, eyes squeezed half shut. 3 shy hope, the beginning of a smile. 4 tears held back, chin trembling. 5 guilt, unable to meet the camera's eye. 6 sudden resolve, jaw set, eyes steady behind the black frames.
```

**alex-young poses**
```
1 crouching close to something at eye level, one palm pressed flat on an invisible surface. 2 walking away and looking back over his shoulder. 3 standing with a wet cloth in one hand, frozen, about to wipe something away. 4 sitting on a wooden chair, elbows on knees, hands clasped. 5 reaching out a hand slowly, then stopping halfway. 6 hurrying forward, half running, cardigan swinging.
```

**alex-old expressions**
```
1 dread, eyes wide behind thick lenses. 2 screaming, mouth wide open, hands raised. 3 weary sadness, eyes downcast. 4 pleading, brows raised, lips parted. 5 brief peace, eyes closed, a faint smile. 6 confusion, waking suddenly, looking around.
```

**alex-old poses**
```
1 seated in the wheelchair, gripping the armrests. 2 leaning forward out of the wheelchair, one hand reaching toward the camera. 3 shrinking back into the wheelchair, arm across his face. 4 seated, head bowed, hands folded on the tartan blanket. 5 turning in the chair to look behind him. 6 slumped asleep in the chair, glasses askew.
```

**lucienne expressions**
```
1 precise attention, one eyebrow slightly raised. 2 relief breaking through composure, eyes shining. 3 dry disapproval, lips pressed, looking over her spectacles. 4 deep worry, brows drawn together. 5 warm affection, a small genuine smile. 6 grief held in check, eyes closed for one breath.
```

**lucienne poses**
```
1 walking briskly, lantern raised, coat swinging. 2 turning toward the camera with the lantern lifted. 3 reaching up to a high shelf, standing on tiptoe. 4 reading from an open ledger held in both hands. 5 bowing her head slightly, one hand at her chest. 6 standing very straight, hands folded in front, waiting.
```

**paul expressions**
```
1 patient kindness. 2 worry for someone else, brows drawn. 3 firm refusal, jaw set, a small shake of the head. 4 tiredness, eyes heavy. 5 a quiet laugh. 6 alarm, eyes wide, mouth open.
```

**paul poses**
```
1 sitting on a wooden chair holding a steaming tin cup. 2 pushing an empty wheelchair. 3 stepping forward to catch someone's arm. 4 standing in a doorway, keys in hand. 5 leaning back against a stone wall, arms folded. 6 kneeling beside a wheelchair, hand on its armrest.
```

## 3c. Angle sheets (turnaround and head angles)

The video model invents any side of a face it has not seen, and that is where faces drift. Every character who appears on video gets two more sheets, built from the approved reference sheet (and, for real people, their real face photographs). These are attached to every later keyframe, and to video jobs that take reference images.

Turnaround frame, used by all:
```
Character turnaround sheet: five full-length photographs of the identical person, side by side in one row, equal spacing, same height, on a seamless matte charcoal studio backdrop, the same soft even key light in every view. Left to right: (1) facing the camera; (2) three-quarter view turned to their left; (3) full profile facing left; (4) three-quarter view from behind, turned to their right; (5) directly from behind. Same face, hair, costume, accessories, build and proportions in every view, as in the attached reference sheet. Neutral standing pose, arms relaxed. No text, no labels, no borders.
```

Head-angle frame, used by all:
```
Head-angle sheet: a three-by-two grid of six head-and-shoulders photographs of the identical person, evenly spaced, on a seamless matte charcoal studio backdrop, the same soft key light, no text, no labels, no borders. Top row: (1) straight on, eyes to the lens; (2) three-quarter view turned to their left; (3) full left profile. Bottom row: (4) three-quarter view turned to their right; (5) camera low, looking up at the face, chin raised; (6) camera high, looking down at the face, eyes lifted toward the lens. Same face in every frame, the same bone structure, eyes, nose, mouth, ears, hairline, skin and hair as in the attached images; only the camera angle changes. Neutral calm expression.
```

---

## 4. Location plates

Each plate: wide establishing shot, no people unless stated, one surreal detail. Append the Style Bible.

**4.1 Fawney Rig cellar, 1916, the ritual**
```
A vaulted cellar beneath an English manor, 1916, barrel-vaulted in rough grey limestone sweating with damp, flagstone floor worn into shallow dips by centuries of feet. In the centre a magic circle three metres across chalked in thick white lines with Greek and Enochian letters, brass instruments at its cardinal points: an astrolabe, a censer trailing resinous smoke, a bowl of water, a knife. At the circle's heart a huge glass sphere, taller than a man, hand-blown with faint ripples and seams, resting in a low cradle of black iron. Twenty tall beeswax candles on iron spikes, their flames the only light, amber and unsteady, throwing the long shadows of hooded figures just out of frame up the vault. A carved wooden lectern with an open vellum grimoire, its pages weighted with a human skull. Wax drips frozen down the candle spikes; soot stains above old sconces. Smoke layers hang in the air at chest height. Cold blue leaks from a drain grate in one corner.
SCALE (critical, every cellar image): the glass sphere is about 2.2 metres across, resting directly on the floor in its low iron cradle at the centre of the circle, big enough for a tall woman to stand inside, its top well above a man's head. It is never a crystal ball, never on a stand, table or crate. One single wide photograph, never a collage or grid.
SURREAL DETAIL: the chalk lines of the circle are very faintly luminous, and the dust inside the circle hangs perfectly still while the dust outside drifts.
[Style Bible]
```

**4.2 Fawney Rig cellar, 1970s, the long wait**
```
The same vaulted limestone cellar fifty years on. Two bare incandescent bulbs on a twisted brown cable cast a sickly yellow light; one flickers. The chalk circle is faded, scuffed, re-chalked many times in slightly different hands. The glass sphere is clouded grey inside, dusty outside, a hand-print wiped clear at eye level. The brass instruments are green with verdigris and strung with cobwebs. A folding card table with a dented thermos, a tin mug, a transistor radio, a newspaper; a wooden chair; an empty wheelchair folded against the wall. Water stains and a slow drip from the vault. Cigarette ends swept into a corner.
SCALE (critical, every cellar image): the glass sphere is about 2.2 metres across, resting directly on the floor in its low iron cradle at the centre of the circle, big enough for a tall woman to stand inside, its top well above a man's head. It is never a crystal ball, never on a stand, table or crate. One single wide photograph, never a collage or grid.
SURREAL DETAIL: the hand-print wiped on the sphere is on the inside of the glass.
[Style Bible]
```

**4.3 Fawney Rig cellar, 1988, the escape**
```
The same cellar at dawn. A single high barred window admits a hard shaft of grey-blue morning light that cuts diagonally through thick drifting dust. The chalk circle is broken, a scuff mark dragged through its line. The glass sphere stands empty, a web of cracks spreading from a single point on its inner surface, a fine spray of glass dust on the floor beneath. The wooden chair is overturned. A paperback lies face down. The bulbs are dark. Everything is still except the dust in the beam.
SCALE (critical, every cellar image): the glass sphere is about 2.2 metres across, resting directly on the floor in its low iron cradle at the centre of the circle, big enough for a tall woman to stand inside, its top well above a man's head. It is never a crystal ball, never on a stand, table or crate. One single wide photograph, never a collage or grid.
SURREAL DETAIL: footprints in the dust lead from the centre of the circle to the door, bare and narrow, and there are no footprints leading in.
[Style Bible]
```

**4.4 Inside the glass sphere, POV plate**
```
First-person view from inside a huge glass sphere, the curved wall a hand's length from the lens. The glass warps the cellar beyond into bending verticals: smeared amber candle flames, the chalk circle arcing across the floor, the dark shape of a hooded figure approaching and growing. On the inside of the glass, faint reflections of two long pale hands at the lower edge of frame, fingertips just touching the surface, condensation blooming around them. Scratches on the inside of the glass at hand height, thousands of them.
SURREAL DETAIL: among the scratches, scratched from the inside, a tally of marks that would take a century to make.
[Style Bible]
```

**4.5 The Dreaming's palace, crumbling (montage)**
```
An impossible palace of bone-pale stone and black volcanic glass on a cliff above a slow grey sea of mist, under a sky with no sun and no colour. Its towers are taller than any building could stand, and they are dissolving from the top down: stone becoming streams of fine grey sand that pour sideways on a wind we cannot feel and vanish. Flights of stairs end in air. A cracked white path leads toward two colossal gates, one of translucent amber horn, one of yellowed ivory, each fifty feet high. No birds. No people.
SURREAL DETAIL: the mist sea below reflects the palace whole and intact, as it was.
[Style Bible]
```

**4.6 The gates of Horn and Ivory** (two plates: RUINED and STRAINED)
```
Two colossal gates side by side at the edge of a plain of pale mist. The left gate carved from a single piece of translucent amber horn, light moving slowly inside it like something alive; the right gate of yellowed ivory, cracked along its grain, carved with sleeping faces. Each gate fifty feet tall, set into a wall of grey stone that fades into fog within twenty metres on either side. Fine sand drifts against their bases.
RUINED version: both gates cracked and leaning, the horn gate split top to bottom, the ivory gate missing a panel, dead black vines, a dune of sand half-burying the threshold, no light within the horn.
STRAINED version: both gates standing but fissured, the fissures repaired with something like gold, a faint slow pulse of light deep within the horn gate.
SURREAL DETAIL: the shadows of the gates fall toward the viewer, as if the light source were behind the gates, yet the gates themselves are lit from the front.
[Style Bible]
```

**4.7 The guard's dream, the door Dream uses**
```
A warm English pub interior with the slight softness and overexposure of a remembered place: honey-coloured lamplight, a coal fire, dark wood polished by elbows, a horse brass, a dartboard. A woman in a green cardigan laughing at a corner table, her face slightly out of focus the way a loved face is in a dream; opposite her an empty chair with a pint still sweating on the table before it. The edges of the room do not end in walls but in gentle darkness, like the edge of a lamp's reach.
SURREAL DETAIL: the pub's one window looks out not onto a street but onto the stone cellar, candle-lit, from inside the glass sphere.
[Style Bible]
```

**4.8 Lucienne's library, the series hub**
```
An endless library inside the Dreaming. Shelves of dark oak rise forty, sixty, a hundred feet and keep going into darkness; rolling ladders on brass rails; galleries connected by stairs that do not quite meet. Dust turns slowly in shafts of light that have no windows to come from. In the foreground a long reading table of black wood, scarred and polished, with a single brass lantern and, before each of four empty chairs, a dark rectangle in the dust where something will one day be set down. On the far wall three enormous locked doors of different woods, each with a title carved deep above it in old letters: NEVERWHERE (black oak, iron-banded, a London fog seeping under it), CORALINE (small, pale, painted, a brick wall visible through its keyhole), THE ALCHEMIST (sun-bleached cedar, sand at its foot, a warm light under it). A fourth, lighter door stands open onto the grey dawn of the 1988 cellar.
SURREAL DETAIL: the books on the nearest shelves have blank spines, and the titles are slowly appearing letter by letter as if being written from inside.
[Style Bible]
```

---

**4.9 The throne room of the Dreaming, at full power (cold open, Episode 0)**
```
The heart of the Dreaming's palace before the fall. A vast circular hall whose walls are not walls but open night sky, thick with slow-turning stars close enough to touch; a floor of black glass reflecting them so the room seems to float in space. At its centre a throne grown from the same black glass, tall and narrow, with a drift of fine grey sand rising upward from its base against gravity. Before the throne, kneeling, a tall man in a pale suit with his head bowed (the Corinthian, face not visible). To one side a tall woman in a charcoal coat with a brass lantern and a ledger (Lucienne). A path of pale stone leads from the throne toward two distant gates of horn and ivory. Light comes from the stars themselves, cool silver, with one warm source: a single candle on the arm of the throne.
SURREAL DETAIL: the kneeling man's shadow is cast upward onto the stars.
[Style Bible]
```

**4.10 The crossroads of the Three, at the edge of the Dreaming (Episode 2)**
```
A crossroads at night at the edge of the Dreaming: three pale dirt roads meet in a flat clearing of long silver grass, each road running off into a different weather (one into mist, one into rain, one into dry moonlight). At the centre of the crossing, a low ring of three standing stones, one tall, one middle-sized, one short and broken. Above, an enormous moon in three phases at once: one third new, one third full, one third waning. A single wooden signpost with three blank arms. Wind moves the grass in rings. Cold silver light, deep blue shadows, mist pooling in the low ground.
SURREAL DETAIL: the long grass is made of fine silver thread, and in places it is being spun upward into the sky.
[Style Bible]
```

**4.11 London, night rain, 1988 (Episode 2)**
```
A narrow terraced street in north London, 1988, after midnight, in steady rain. Wet brick houses with bay windows, a red telephone box, a parked Austin Metro and a black cab, sodium streetlights turning the rain to orange needles, puddles reflecting everything upside down. One house halfway down the street is different: every window dark except one upstairs, which glows a faint wrong gold, and the front garden has grown wild with pale flowers that should not bloom in the rain. Steam rising from a drain.
SURREAL DETAIL: the rain falling past the gold window falls upward.
[Style Bible]
```

**4.12 Rachel's room, overgrown by dreams (Episode 2)**
```
A small upstairs bedroom in a London terraced house that has become a dream. The walls, ceiling and furniture are overgrown with soft living growth: pale flesh-pink and gold coral, fungus like folded silk, vines of braided hair with tiny glowing flowers, all of it gently breathing. Fine golden sand lies in drifts across the floor and on every surface like snow. A narrow iron bed against the far wall, its blankets half absorbed into the growth. On the bedside table, a small worn leather pouch, its drawstring open, spilling glowing sand. A single window, curtains rotted, rain outside. Light: the sand itself glows warm gold from below; deep shadows above.
SURREAL DETAIL: the shadows of the growth on the ceiling move a moment later than the growth itself.
[Style Bible]
```

---

**4.13 The gates of Hell (Episode 2)**
```
The gates of Hell, seen from the barren road that leads to them. Two colossal doors of black iron, a hundred feet high, set into a cliff that rises out of sight; the cliff face is made of human figures pressed into the rock, faces, hands and backs, some of them moving. The doors are carved with a single line of old letters, eroded beyond reading. Ash falls steadily like grey snow; a dull red glow comes from cracks in the ground. On the battlements high above, tiny horned figures watch. A dead tree at the roadside hung with rusted keys.
SURREAL DETAIL: the ash falling near the gates falls upward, as if the place is breathing in.
[Style Bible]
```

**4.14 Lucifer's arena, the Oldest Game (Episode 2)**
```
A vast round amphitheatre in Hell, carved from black basalt. Tier on tier of stone benches rise into red darkness, packed with thousands of demons of every shape, horned, winged, scaled, leaning forward. At the centre, a circular floor of polished obsidian ringed with a band of dull bronze, empty and waiting. At the far side, high on a stair of black stone, a narrow throne of the same black stone, and beside it two lesser thrones. Light from below: molten red seeping through cracks in the obsidian; the upper air full of drifting ash and smoke.
SURREAL DETAIL: the polished floor reflects not the arena but a clear blue summer sky.
[Style Bible]
```

**4.15 The diner, twenty-four hours (Episode 2)**
```
An American roadside diner at night in 1988. A long chrome counter with red vinyl stools, red booths along the window, a black-and-white checkered floor, a pie cabinet, coffee pots on warmers, a jukebox. Harsh flickering fluorescent tubes; outside the big windows, rain and a dark empty highway and a red neon sign reading 24 HOURS reflected backwards in the glass. A television mounted high in the corner showing static. Six or seven ordinary customers and a waitress, all slightly too still. In a corner booth, a red glow from something on the table.
SURREAL DETAIL: the clock above the counter has no hands, and the coffee in every cup is ever so slightly steaming backwards.
[Style Bible]
```

**4.16 The park, morning (Episode 2)**
```
A city park in early autumn, just after sunrise: a wide paved square with a large round stone fountain, a white marble memorial arch in the distance, plane trees with yellowing leaves, old iron lamp posts, green-painted wooden benches. Low golden light across the paving, long shadows, a light mist lifting. Hundreds of grey pigeons on the paving near one bench. A few early city people far in the background.
SURREAL DETAIL: one pigeon among the hundreds is perfectly white, and its shadow is a raven.
[Style Bible]
```

---

**4.17 Destiny's garden of forking paths (Episode 3)**
```
An endless formal garden at twilight, grey and green, laid out as paths that fork and fork again, each path lined with tall clipped hedges and old stone. At every fork a small stone statue faces one way. Grey mist lies along the ground. The sky is a pale, sourceless grey with no sun. In the middle distance, a hooded figure walks slowly with a great book in his arms. Silent, orderly, melancholy.
SURREAL DETAIL: the paths behind the walking figure quietly rearrange themselves after he has passed.
[Style Bible]
```

**4.18 The convocation hall of the Endless (Episode 3)**
```
A vast hall with no walls, only darkness and drifting stars at the edges. In the centre, a long table of black stone with eight tall chairs, each chair lit by its own different light from above: grey, warm white, deep red, dull grey-green, shifting rainbow, cold blue-black, pale gold, and one chair in total darkness, empty, with dust on its seat. On the table, a single candle in a brass holder and eight empty goblets. The floor is polished black, reflecting the lights.
SURREAL DETAIL: on the wall of darkness behind each chair hangs a glowing sigil: a book, an ankh, a helm, a heart, a hooked ring, a swirl of colour, and a sword, faint and floating.
[Style Bible]
```

---

**4.19 Hell, emptied (Episode 4)**
```
The corridors of Hell after everyone has gone: a long hall of black basalt cells, every iron door hanging open, chains lying slack on the stone floor, cold ash drifting, the red glow beneath the floor faded to a dull ember. Absolute silence. In the distance, the colossal gates stand open onto grey nothing. No people at all.
SURREAL DETAIL: on the floor, footprints in the ash lead out toward the gates, thousands of them, all going one way.
[Style Bible]
```

**4.20 The great hall of the Dreaming, prepared for guests (Episode 4)**
```
The great hall of Aurie's restored palace in the Dreaming, prepared for a banquet: a vast hall of pale stone and dark glass with a ceiling open to a night sky full of slow stars; long tables laid with silver, candles and strange fruit; banners of many realms hung along the walls (a raven, a horned crown, a golden leaf, a white feather, a black flame). Torchlight warm, starlight cold. Empty, waiting for guests.
SURREAL DETAIL: the candle flames lean all one way, toward the empty high seat at the head of the hall.
[Style Bible]
```

**4.21 The white room (Episode 4)**
```
A bare, perfectly white room in the Dreaming, with no visible walls, floor or ceiling edges, only soft white light in every direction, like the inside of a cloud. In the centre, a single plain wooden chair. Peaceful, empty, a little sad.
SURREAL DETAIL: a few grains of golden sand drift slowly downward through the air, falling forever.
[Style Bible]
```

---

**4.22 Madoc's house, the locked room (Episode 5)**
```
An attic room at the top of a writer's tall Georgian townhouse in London, 1990, night. Bare floorboards, a single bare bulb, a narrow iron bed with grey sheets, a heavy wooden chair, the window boarded up from the inside, a heavy padlock on the inside of the door. Downstairs light leaks under the door. Cold, cruel, tidy. No people.
SURREAL DETAIL: on the faded wallpaper, lines of handwritten verse have appeared and faded, layer on layer, as if the room itself has been trying to write.
[Style Bible]
```

**4.23 The convention ballroom (Episode 5)**
```
A large shabby 1990 American hotel ballroom in Georgia: rows of folding chairs facing a low stage with a lectern, a hand-painted banner above it with no readable words, fluorescent and chandelier light mixed, a buffet table with coffee urns and breakfast cereal boxes, name badges on a table. Empty, chairs waiting. A pleasant, ordinary room that feels wrong.
SURREAL DETAIL: every chair casts a shadow slightly longer than it should, all pointing at the stage.
[Style Bible]
```

**4.24 The boarding house (Episode 5)**
```
A run-down two-storey wooden boarding house in Florida, 1990, at night, seen from the front lawn: peeling white paint, a sagging porch with a swing, warm yellow light in four upstairs windows, Spanish moss on a live oak, a heavy humid night with moths around the porch light. No people.
SURREAL DETAIL: the walls of the house are faintly transparent, like frosted glass, and the four lit rooms can almost be seen through them.
[Style Bible]
```

**4.25 The vortex (Episode 5)**
```
Inside the Dreaming as it tears: the endless library of the Dreaming seen down a long aisle, but the far end of the aisle has become a slow spiralling whirlpool of light, and pages, books, lanterns and fragments of dreams (a door, a staircase, a carousel horse) are drifting from the shelves toward it and spiralling inward. Warm lantern light pulled into a cold white centre. No people.
SURREAL DETAIL: the pages being drawn in are still being written as they go.
[Style Bible]
```

**4.26 The White Horse tavern, 1389 (Episode 5)**
```
A crowded low-beamed English tavern in 1389: smoke from an open hearth, rushes on the floor, long rough tables, tallow candles, pewter tankards, a barrel of ale, a small window onto a muddy street. Warm firelight, deep smoky shadows. Empty of people for this plate.
SURREAL DETAIL: the hearth smoke curls down instead of up, toward one empty bench in the corner.
[Style Bible]
```

**4.27 The White Horse, 1989 (Episode 5)**
```
The same English tavern site in 1989, now an ordinary London pub: dark wooden booths, brass taps, a dartboard, a jukebox glowing, a pint glass on a corner table, rain on the window. Low warm light, a quiet afternoon. Empty of people for this plate.
SURREAL DETAIL: a single old beam in the ceiling is the same blackened beam from six hundred years before, with a carved horse on it.
[Style Bible]
```

---

**4.28 The false house (Episode 6)**
```
A pleasant small American suburban house from the 1950s, white picket fence, neat lawn and a porch light, floating in a vast dark void of the Dreaming: beyond the edges of the lawn there is nothing at all, only black and faint stars. Up close everything is subtly wrong: the paint peels into darkness, the windows show the void behind them, the garden flowers are paper. Night. No people.
SURREAL DETAIL: the house casts no shadow.
[Style Bible]
```

**4.29 Destruction's island (Episode 6)**
```
A small rocky Greek island at golden late afternoon: a whitewashed stone cottage with blue shutters among olive trees above a deep blue sea, an easel on the terrace with a garish, badly painted canvas, scattered paint pots, a wooden table with bread and wine. Warm Mediterranean light, long shadows, cicadas almost audible. No people.
SURREAL DETAIL: the sea at the horizon is painted, brushstrokes visible.
[Style Bible]
```

**4.30 Orpheus's shrine (Episode 6)**
```
A tiny ancient Greek shrine in a cave above the sea at dusk: rough white marble columns, oil lamps, a low marble altar heaped with fresh flowers, olive branches and offerings, a narrow opening onto the darkening sea. Warm lamplight, cool blue dusk outside. No people, the altar's top hidden by flowers.
SURREAL DETAIL: the lamp flames sway in time to music no one is playing.
[Style Bible]
```

**4.31 The stream at the edge of the Dreaming (Episode 6)**
```
A clear, shallow stream running over pale stones through a quiet meadow at the edge of the Dreaming at dusk, the great gates of horn and ivory far off on the horizon, silver grass, the first stars. Calm, grieving light. No people.
SURREAL DETAIL: the water runs slightly uphill.
[Style Bible]
```

**4.32 The desert road (Episode 6)**
```
An empty two-lane highway through an American desert at noon, heat shimmer, a battered 1970s convertible parked on the shoulder, a roadside diner sign with no readable words, tumbleweed, endless blue sky. No people.
SURREAL DETAIL: small brightly coloured fish swim through the air above the car.
[Style Bible]
```

---

**4.33 Lyta's apartment, the nursery (Part Seven)**
```
A small, modest 1990s American apartment nursery at night, lit by a single bedside lamp and the orange glow of a streetlight through thin curtains: a wooden crib with a mobile of paper stars, a rocking chair, toys on the floor, a window ajar with the curtain moving. Inside the crib, a small shape under a scorched blanket, the wood of the crib blackened as if by fire. Quiet, wrong. No people.
SURREAL DETAIL: the paper stars on the mobile turn slowly in the opposite direction to the breeze.
[Style Bible]
```

**4.34 The witch's crossroads (Part Seven)**
```
A crossroads of three dirt roads in an ancient wood at night, an old standing stone at the centre, bare twisted trees, ground mist. An enormous full moon hangs unnaturally low over the trees, close enough to see its craters, flooding everything with cold silver light. No people.
SURREAL DETAIL: the moon's reflection lies in a puddle at the foot of the stone, though the moon is in the wrong place for it.
[Style Bible]
```

**4.35 The Dreaming under siege (Part Seven)**
```
The great courtyard of the palace of the Dreaming at night, under attack by something unseen: the gates of horn and ivory cracked and hanging open, fires burning in the colonnades, the sky a deep bruised red, ash and loose pages drifting through the air, a carved stone gargoyle broken on the ground. Empty of people.
SURREAL DETAIL: where the ash settles, the stone underneath turns to grey sand and slowly pours away.
[Style Bible]
```

**4.36 A glade in Faerie (Part Seven)**
```
A moonlit glade deep in Faerie: tall silver birch trees with pale bark that glows faintly, a carpet of white flowers, a still dark pool, tiny drifting lights like will-o'-the-wisps among the trunks, a soft silver-violet light with no source. Hushed, beautiful, unearthly. No people.
SURREAL DETAIL: the reflections in the pool show the trees in full summer leaf, though the trees are bare.
[Style Bible]
```

**4.37 Litharge, the city of the dead (Part Seven)**
```
Litharge, a vast and ancient necropolis at dusk: a city of pale stone tombs, mausoleums and statues stretching to the horizon, a wide processional avenue lined with thousands of small candles leading to a great open plaza with a low stone bier, banners of black and silver, a sky of deep violet with the first stars. Solemn, enormous, quiet. No people.
SURREAL DETAIL: the candle flames all lean toward the bier, as if the whole city were bowing.
[Style Bible]
```

---

## 5. Kling clip pattern (video, through the gateway)

`POST /v1/videos` with `model`, `prompt`, `input_reference` (the approved still), `seconds` ("5" or "10"), `size` ("1280x720" or "1920x1080").

```
[What moves, one sentence, physical and specific.] [Camera: shot size, one movement, speed.] [Light and atmosphere.] Hand-held camera with gentle operator sway and micro-shake, as if filmed by someone standing in the room. Keep the face, hair, clothing and set exactly as in the reference image. Photoreal, subtle motion, film grain, no text, no morphing.
```

Two layers of handheld feel, so every clip matches: the prompt line above asks Kling for it, and the web player adds a faint procedural sway on top of every clip and every freeze-frame, so even a clip Kling renders too steady still breathes. The player's sway is tuned once and applies to all four books.

Example, clip 1.5b (hero visible, use `kling-v3-omni`):
```
A pale woman in a black floor-length gown rises slowly from a crouch beside a sleeping guard, her long black hair lifting in a wind that touches nothing else, as the chalk circle on the floor crumbles into drifting dust. Slow push-in from a low angle, 10 seconds. A grey-blue dawn shaft from a high window, dust turning in it, the guard's breath still fogging the glass. Hand-held camera with gentle operator sway and micro-shake, as if filmed by someone standing in the room. Keep the face, hair, clothing and set exactly as in the reference image. Photoreal, subtle motion, film grain, no text, no morphing.
```

Example, clip 1.2a (POV, use `kling-v2-6`):
```
From inside the glass sphere, a heavyset bearded man in a burgundy velvet robe crouches down to the curved glass, his face warping as he nears it, lips moving, a signet ring tapping twice against the surface. Static camera, slight handheld breath. Candlelight from behind him, amber, his breath briefly fogging the glass. Keep the set exactly as in the reference image. Photoreal, subtle motion, film grain, no text, no morphing.
```
