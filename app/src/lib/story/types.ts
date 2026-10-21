// Shared scene-graph schema for every book in the series.
// One engine, one content pack per book (see ../../../../series-bible.md §8).

export type Trait = "mercy" | "loyalty" | "courage" | "faith";

export interface Effect {
  traits?: Partial<Record<Trait, number>>; // added to profile.traits
  flags?: Record<string, boolean>; // set on profile.flags[bookId]
  vars?: Record<string, number>; // added to profile.vars[bookId] (e.g. dreaming, power)
  relic?: string; // pushed to profile.relics
}

/** A gate on a choice or exit. All listed minimums must hold. */
export interface Requires {
  traits?: Partial<Record<Trait, number>>; // minimum trait values
  flags?: string[]; // all must be set (book flags)
  notFlags?: string[]; // none may be set
  relation?: Record<string, { trust?: number; fear?: number }>; // minimum trust/fear with a character
}

export interface Choice {
  id: string; // e.g. "1.2.A" — also the conversation exit id
  text: string; // what Aurie does, in prose (shown only if the player asks for options)
  clip?: string; // consequence clip played after choosing
  effects?: Effect;
  effectsIf?: { flag: string; effects: Effect; ripple?: string }[]; // extra effects when an earlier flag is set
  requires?: Requires; // hidden when not met; the AI cannot steer to it either
  next: string; // scene id
}

/** Something the player's words or actions can cause, chosen live by the AI from this authored menu. */
export interface Consequence {
  when: string; // what the player must say or do to earn it (shown to the AI)
  effects?: Effect;
  trust?: number; // change to the speaking character's trust in Aurie
  fear?: number; // change to the speaking character's fear of Aurie
  ripple?: string; // a diegetic line shown when it fires ("Somewhere above, a man begins to weep.")
  echo?: { text: string; knownBy: string[] }; // a story fact later characters may know and mention
  requires?: Requires; // only on the menu when earlier events make it possible
}

export interface Conversation {
  character: string; // key into the book's character cards
  maxTurns: number; // 0 = open-ended (hub)
  canon: string[]; // facts the character may never contradict
  exits: Record<string, string>; // choice id -> what reaching it looks like
  opening?: string; // the character's first line if the player stays silent
  possibilities?: string[]; // likely approaches and how the scene bends to each (keeps improvisation on-story)
  consequences?: Record<string, Consequence>; // tag -> consequence; each fires at most once per playthrough
}

export interface Scene {
  id: string;
  title: string;
  type?: "scene" | "hub" | "end";
  pov: "3P" | "POV";
  clips: string[]; // played in order; files live at /clips/<bookId>/<clip>.mp4
  narration?: string; // fallback bridging text (the director may rewrite it)
  narrationIf?: { flag: string; text: string }[]; // extra sentences appended when earlier flags are set
  music?: string; // music track id for this scene (plays until a scene names another; "none" stops it)
  hook?: string; // one-line cliffhanger shown for a few seconds as the scene ends (engagement-design.md §6)
  episodeTitle?: string; // micro-episode title shown as a card when this scene opens
  innerVoice?: boolean; // ask the AI for Aurie's private thought before choices
  conversation?: Conversation;
  choices?: Choice[];
  next?: string; // for scenes with no choices
}

export interface Book {
  id: string;
  title: string;
  hero: string;
  trait: Trait;
  relic: string;
  start: string;
  scenes: Record<string, Scene>;
}

export interface CharacterCard {
  name: string;
  voice: string; // how they speak
  wants: string;
  knows: string[];
  secrets: string[]; // revealed only when earned
  redLines: string[]; // things they can never do or grant
  address: string; // how they address Aurie
  ttsVoice?: string; // gateway voice id
  voiceDirection?: string; // how the voice actor should deliver this character's lines
}

export interface PlayerModel {
  playStyle?: string;
  leans?: Record<string, number>;
  interests?: string[];
  favouriteCharacters?: string[];
  dislikes?: string[];
  memorableLines?: string[];
  humour?: string;
}

export interface Profile {
  name: string;
  traits: Record<Trait, number>;
  relics: string[];
  completed: string[];
  flags: Record<string, Record<string, boolean>>;
  vars: Record<string, Record<string, number>>;
  memory: string[]; // episodic notes, newest last
  relations: Record<string, { trust: number; fear: number }>; // each character's feeling toward Aurie, -5..5
  echoes: { text: string; knownBy: string[] }[]; // story facts her choices created, for later characters
  playerModel: PlayerModel;
  position: { book: string; scene: string } | null;
}

export interface DialogueReply {
  dialogue: string;
  narration: string | null; // what physically happens in the scene in response to her words or actions
  inner_thought: string | null;
  mood: string;
  decision: string | null;
  consequences: string[]; // tags from the scene's consequence menu that her latest input has earned
  trust_delta: number; // -2..2, the speaker's change in trust
  fear_delta: number; // -2..2, the speaker's change in fear
  memory_note: string | null;
}
