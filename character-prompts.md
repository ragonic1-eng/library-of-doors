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

**Reference sheet:**
```
[Reference sheet frame]
A slight, anxious young Englishman of twenty-two, early 1930s. Height around 1.72 m, narrow-shouldered, thin wrists. Face: long and thin, his father's grey eyes but wide and wet and without any of the coldness, a high forehead, a slightly receding chin, prominent Adam's apple. Skin fair and dry, flaking slightly at the sides of the nose, a faint shaving nick on the jaw, pale freckles across the bridge of the nose. Hair fair, fine, side-parted and brilliantined flat, one strand escaped over the forehead. Round tortoiseshell spectacles with thin lenses, slightly smudged. Lips pressed together as if about to apologise. Clothing: a fawn lambswool cardigan, bobbled at the elbows, buttoned over a white cotton shirt with a soft collar, a narrow brown knitted tie, grey flannel trousers with a crease, brown brogues scuffed at the toe. A fountain pen clipped in the cardigan pocket, ink stain on the right middle finger. Posture: shoulders rounded, hands clasped in front, weight on the back foot. Expression: wanting to be elsewhere.
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

**Generate as an EDIT of the approved young-Alex sheet:**
```
Age this exact man fifty years, to seventy-two, keeping his bone structure, eye shape, the receding chin and the round spectacles so he is unmistakably the same person. Hair now thin and white, combed over a freckled scalp. Skin papery and translucent, deep lines from nose to mouth, loose at the neck, liver spots on the temples and the backs of trembling hands, a healed cut on one knuckle. Eyes the same wet grey, now clouded slightly, the lower lids drooping, red-rimmed. The spectacles now thick-lensed, repaired at one hinge with tape. Seated in a 1980s hospital wheelchair with chrome rims and a cracked vinyl seat, a tartan wool blanket over the knees, a grey cardigan buttoned one hole wrong over a checked shirt, slippers. Hands gripping the armrests, knuckles white. Posture collapsed forward. Expression: a lifetime of dread finally arriving.
SURREAL DETAIL: on his lap, under the blanket's edge, the same moth from fifty years ago, now grey, still perfectly still.
Three-view reference sheet layout as in the attached image.
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

## 4. Location plates

Each plate: wide establishing shot, no people unless stated, one surreal detail. Append the Style Bible.

**4.1 Fawney Rig cellar, 1916, the ritual**
```
A vaulted cellar beneath an English manor, 1916, barrel-vaulted in rough grey limestone sweating with damp, flagstone floor worn into shallow dips by centuries of feet. In the centre a magic circle three metres across chalked in thick white lines with Greek and Enochian letters, brass instruments at its cardinal points: an astrolabe, a censer trailing resinous smoke, a bowl of water, a knife. At the circle's heart a huge glass sphere, taller than a man, hand-blown with faint ripples and seams, resting in a low cradle of black iron. Twenty tall beeswax candles on iron spikes, their flames the only light, amber and unsteady, throwing the long shadows of hooded figures just out of frame up the vault. A carved wooden lectern with an open vellum grimoire, its pages weighted with a human skull. Wax drips frozen down the candle spikes; soot stains above old sconces. Smoke layers hang in the air at chest height. Cold blue leaks from a drain grate in one corner.
SURREAL DETAIL: the chalk lines of the circle are very faintly luminous, and the dust inside the circle hangs perfectly still while the dust outside drifts.
[Style Bible]
```

**4.2 Fawney Rig cellar, 1970s, the long wait**
```
The same vaulted limestone cellar fifty years on. Two bare incandescent bulbs on a twisted brown cable cast a sickly yellow light; one flickers. The chalk circle is faded, scuffed, re-chalked many times in slightly different hands. The glass sphere is clouded grey inside, dusty outside, a hand-print wiped clear at eye level. The brass instruments are green with verdigris and strung with cobwebs. A folding card table with a dented thermos, a tin mug, a transistor radio, a newspaper; a wooden chair; an empty wheelchair folded against the wall. Water stains and a slow drip from the vault. Cigarette ends swept into a corner.
SURREAL DETAIL: the hand-print wiped on the sphere is on the inside of the glass.
[Style Bible]
```

**4.3 Fawney Rig cellar, 1988, the escape**
```
The same cellar at dawn. A single high barred window admits a hard shaft of grey-blue morning light that cuts diagonally through thick drifting dust. The chalk circle is broken, a scuff mark dragged through its line. The glass sphere stands empty, a web of cracks spreading from a single point on its inner surface, a fine spray of glass dust on the floor beneath. The wooden chair is overturned. A paperback lies face down. The bulbs are dark. Everything is still except the dust in the beam.
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
