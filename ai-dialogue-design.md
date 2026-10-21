# Living Characters — AI Dialogue Design (v0.1)

How the characters talk back like people instead of menus, while the story's consequences stay authored.

---

## 1. The principle: authored spine, living skin

- **The story graph decides what can happen.** Scenes, clips, consequences, endings all come from `story.json` as mapped in `story-map.md`. The AI never invents a death, an item, or an ending.
- **The AI decides how it is said and how the character feels.** Every character is played live by Claude, in character, with memory of what the player did and said. The player can type or speak freely to them.
- **Free talk ends in an authored choice.** When the conversation reaches one of the scene's authored outcomes, the model flags it and the matching consequence fires. The player never sees a numbered menu unless they want one.

Result: the same scene plays differently every time, the characters remember her, and the story still lands on the mapped consequences.

---

## 1b. Flexible NPC rules (nothing is scripted word for word)

- **Every character is live, in every scene.** No canned replies anywhere. If she says something no designer anticipated, the character answers it in character, in the moment, from their card and the scene's canon.
- **React, do not deflect.** A character may refuse, lie, mock, soften or change the subject, but only as that character would. "I cannot answer that" never appears. If she asks Burgess about his dead son, he answers as a grieving tyrant would.
- **Improvise within canon, never against it.** Characters may invent small texture (what they ate, what the weather was, an old grudge) but never a fact that contradicts the scene's canon list or the story graph.
- **The exits are destinations, not scripts.** The authored exits say where a scene can end, not how. Two playthroughs can reach the same exit through completely different conversations.
- **Immersion over mechanics.** No numbers, meters or option labels on screen by default. Consequences are felt through what characters say and what the world looks like later.
- **Time pressure is in character.** When a window must close, the character ends it ("Enough. Decide."), not a timer.
- **Romance stays as written.** The hero is a woman in every book and is bisexual; love interests keep the gender the novels gave them (Jessica, Fatima, Nada, Nuala, Calliope). Characters address her as a woman and otherwise play the relationship exactly as the book does, with the same warmth and the same restraint.

## 2. Three places the AI speaks

### 2.1 Conversation windows (characters talk back)
A scene opens a window where the player can speak to a character for several exchanges. Episode 1 has three:

| Scene | Character | Player can try anything, for example... | Authored exits the model maps to |
|---|---|---|---|
| 1.2 | Roderick Burgess at the glass | Stay silent, mock him, ask about his dead son, bluff, bargain | A silence / B threat / C false bargain |
| 1.4 | Alex Burgess, decades later | Comfort him, probe his guilt, promise, lie, show him something | A empathy dream / B nothing / C his death |
| 2.1+ | Lucienne in the library (the hub) | Ask about the Dreaming, the locked doors, her own past, advice on what to do next | None required. She is the series companion; conversation here is open. |

### 2.2 Dream's inner voice ("AI thought")
At every decision point, one or two sentences of Dream's private thought, generated from the profile and recent history. Example after sparing Alex, arriving at the library: *"Seventy years. I let the boy live. Lucienne will not say so, but she would not have."* This is where the player feels the character thinking, not a template.

### 2.3 The narrator between scenes
Short bridging narration generated from what actually happened, so transitions reference the player's own path. Fallback: the authored bridging line.

---

## 3. How a conversation turn works

1. The player speaks (text box, or microphone with on-device speech-to-text).
2. The app sends one request to Claude with:
   - **Stable prefix (cached):** the character card, the scene's canon facts, the rules of the game, the list of authored exits for this scene with their IDs.
   - **Per-turn:** the Traveller profile, a short memory log of notable things the player has said or done, the conversation so far, the new line.
3. Claude replies with a **structured object**, not loose text:
   ```
   { "dialogue": "...",            // what the character says, 1-3 sentences
     "inner_thought": "..." | null, // Dream's private reaction, optional
     "mood": "wary" | "amused" | ..., // drives which idle clip and voice tone play
     "decision": "1.2.B" | null,    // an authored exit ID when the talk has reached one
     "memory_note": "..." | null }  // one line worth remembering about the player
   ```
4. The app plays the dialogue with voice and subtitles over the character's idle clip. If `decision` is set, the authored consequence clip plays and state updates.
5. If the window hits its exchange limit with no decision, the character forces the issue in character ("Enough. Will you bargain or not?") and the model must choose the closest exit.

The structured object is enforced with Claude's structured-output feature, so the game code never has to parse prose.

---

## 4. Character cards (what makes each one feel real)

Each character gets a card, written once, reused everywhere. Fields:

- **Voice:** rhythm, vocabulary, what they never say. Burgess: Edwardian, grandiose, calls Dream "creature." Lucienne: precise, dry, affectionate underneath, says "my lord" and means it.
- **Wants:** Burgess wants immortality and his dead son back. Alex wants to be told he is not his father. Lucienne wants the realm whole and her king changed.
- **Knows / does not know:** Burgess does not know he caught Dream instead of Death until Dream chooses to tell him. Lucienne knows every book in the library, including the three locked doors, but will only hint at them.
- **Secrets and triggers:** what they reveal, and only when the player earns it. Alex admits he nearly freed Dream in 1950 only if treated kindly.
- **Red lines:** they cannot grant anything the story graph does not allow. Burgess cannot open the sphere. Lucienne cannot unlock a door whose book is not installed.
- **Memory of the player:** the memory log is injected each turn, so Lucienne can say "You told me, the night you came back, that you felt nothing. Do you still?"

Dream himself has a card for the inner voice: proud, formal, slowly thawing by MERCY score. At MERCY −6 the voice is cold and certain; at +6 it doubts itself.

---

## 5. Guardrails

- **Canon facts per scene** are listed in the cached prefix. The model may embroider mood, never facts.
- **Length cap** of three sentences per reply. It is a game, not a chat.
- **Tone:** full horror permitted; the model is told the audience is adult and the register is Gaiman, not slasher.
- **No menus by default.** A "show me my options" button reveals the authored exits rephrased in the moment's context, never as the same three strings every playthrough.
- **Offline fallback:** if the API is unreachable, the scene plays its authored lines and a plain choice list. The game never blocks.
- **Replay guard:** a short "previously" summary is kept per save slot so a second playthrough can be deliberately different (the model is told what the character said last time and asked not to repeat it).

---

## 6. Video, voice and latency

- **Idle loops.** Each conversation character gets 3 short Kling clips (5 s, seamless loop): neutral, hostile, soft. `mood` selects which loop plays while the generated line is spoken. This is how a pre-rendered video game can hold a live conversation.
- **Authored lines** (the big ones in `story-map.md`) can get real lip-sync later via Kling's lip-sync feature, rendered offline. Generated lines are voice-over only.
- **Voice.** Real voices from day one through the same gateway: MiniMax `speech-2.8-turbo` (text-to-speech, priced per character). One fixed voice per character chosen after a test call, so Burgess, Alex and Lucienne each always sound like themselves. Player speech input: `qwen-audio-3.0-asr` through the gateway, or the phone's built-in recognition as a free fallback.
- **Latency.** Replies stream word by word with a typewriter effect while the voice line is synthesised, so the first word appears in well under a second.
- **Model.** Grok (`grok-4.7`) through the gateway's OpenAI-compatible chat endpoint, with JSON-schema structured output for the reply object in §3. Your choice; it is also one of the cheapest capable models on the gateway's price list. If Grok's prose for Dream ever feels flat, Claude Opus 5.5 is on the same gateway at the same endpoint style and can be swapped by changing one line in `.env`.
- **Cost, estimate only:** at the gateway's listed Grok rate, a full Episode 1 playthrough with about 40 exchanges costs a few fen. Voice at the listed per-character rate adds roughly one to two yuan per playthrough. I will measure real usage after the first test session.

---

## 6b. Learning the player (so the story gets smarter the more she plays)

"Learning" here means memory and adaptation, not retraining a model. Three layers, all stored per save slot and carried across books:

1. **Episodic memory.** Every conversation turn can emit a `memory_note` (§3). These accumulate: what she said to Burgess, what she asked Lucienne, which doors she stared at. Characters quote them back.
2. **A player model.** After each conversation window, one cheap background call summarises the session into a structured profile:
   ```
   { "play_style": "talker | doer | explorer | trickster",
     "leans": { "kind": 0.7, "curious": 0.9, "defiant": 0.4, "playful": 0.6 },
     "interests": ["the Endless family", "why Burgess wanted Death"],
     "favourite_characters": ["Lucienne"],
     "dislikes": ["long exposition"],
     "memorable_lines": ["told Burgess his son would be ashamed of him"],
     "humour": "dry" }
   ```
   This is injected into every character prompt. The effect: if she jokes, characters start to spar back. If she digs for lore, Lucienne offers more of it unprompted. If she rushes, scenes tighten.
3. **An adaptive director.** Between scenes, the director reads the player model and picks from a small set of **optional micro-beats** per scene (written in advance, so still authored): a lore aside, a tense silence, a character calling back her own words, a gentler or harsher version of a transition. The spine never changes; the texture does.

Guardrails on learning: the player model can only steer tone, pacing and which optional beats appear. It can never change a consequence, unlock an ending, or override a state flag. She can view and reset it from the library (Lucienne: "Shall I forget what I know of you?").

Cross-book payoff: the model persists in the Traveller profile (see `series-bible.md`), so by the time she reaches Coraline the black cat already knows she likes to be teased.

## 7. Architecture note

The app is a web app hosted on **Vercel**: a Next.js project whose API routes hold the gateway key and proxy the live calls. The browser never sees the key. Video clips and stills are generated offline on your PC and uploaded to Vercel Blob storage; the app streams them from there. Save slots and the Traveller profile live in the browser by default, mirrored to Vercel KV so she can continue on another device. Installable to her phone's home screen as a PWA, landscape 16:9.

```
browser (PWA)  <->  Next.js API routes on Vercel  <->  Infistar gateway, one key:
                                                        Grok (characters, director, player model)
                                                        MiniMax speech (voices)
                                                        Qwen ASR (microphone input)
                                                        Gemini image + Kling video (offline batch)
```

`story.json` gains one optional block per scene:
```
"conversation": {
  "character": "burgess",
  "max_turns": 6,
  "exits": { "1.2.A": "Dream stays silent", "1.2.B": "Dream threatens him", "1.2.C": "Dream offers a false bargain" },
  "canon": ["Burgess believes he summoned Death", "The year is 1916", "The tools are already taken"]
}
```

---

## 8. Still to decide

- Microphone input or typing only for the first build. Recommendation: both, typing first.
- Whether Lucienne also acts as an optional hint system ("What would you do, Lucienne?") in all four books. Recommendation: yes, it is in character.
