// Shared scene-graph schema for every book in the series.
// One engine, one content pack per book (see ../../../../series-bible.md §8).

export type Trait = "mercy" | "loyalty" | "courage" | "faith";

export interface Effect {
  traits?: Partial<Record<Trait, number>>; // added to profile.traits
  flags?: Record<string, boolean>; // set on profile.flags[bookId]
  vars?: Record<string, number>; // added to profile.vars[bookId] (e.g. dreaming, power)
  relic?: string; // pushed to profile.relics
}

export interface Choice {
  id: string; // e.g. "1.2.A" — also the conversation exit id
  text: string; // what Aurie does, in prose (shown only if the player asks for options)
  clip?: string; // consequence clip played after choosing
  effects?: Effect;
  next: string; // scene id
}

export interface Conversation {
  character: string; // key into the book's character cards
  maxTurns: number; // 0 = open-ended (hub)
  canon: string[]; // facts the character may never contradict
  exits: Record<string, string>; // choice id -> what reaching it looks like
  opening?: string; // the character's first line if the player stays silent
}

export interface Scene {
  id: string;
  title: string;
  type?: "scene" | "hub" | "end";
  pov: "3P" | "POV";
  clips: string[]; // played in order; files live at /clips/<bookId>/<clip>.mp4
  narration?: string; // fallback bridging text (the director may rewrite it)
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
  playerModel: PlayerModel;
  position: { book: string; scene: string } | null;
}

export interface DialogueReply {
  dialogue: string;
  inner_thought: string | null;
  mood: string;
  decision: string | null;
  memory_note: string | null;
}
