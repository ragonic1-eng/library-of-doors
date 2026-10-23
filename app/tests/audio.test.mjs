import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { stripTypeScriptTypes } from 'node:module';
import { faithful } from '../src/lib/server/faithful.ts';
import { flaw } from '../src/lib/server/mp3.ts';
import { watchPlayback, speechChunks } from '../src/lib/story/audio.ts';
import { speechGain } from '../src/lib/story/level.ts';

// The player's volume levels (the audio panel), at their defaults for the extracted snippets below.
globalThis.volRef = { current: { voice: 1, music: 1, sfx: 1 } };
const player = readFileSync(new URL('../src/components/Player.tsx', import.meta.url), 'utf8');
const burgess = 'Everything I ask, creature? Then you will forgive an old man if he does not take a promise from behind glass on faith. Accept the bargain, and we shall see what the morning brings.';

test('voice validation rejects the screenshot cutoff, missing ending, repetitions and reordered words', () => {
  assert.equal(faithful(burgess, burgess.split(' on faith.')[0]), false);
  assert.equal(faithful(burgess, burgess.replace('what the morning brings.', '')), false);
  assert.equal(faithful('One two three.', 'One one one.'), false);
  assert.equal(faithful('One two three.', 'Three two one.'), false);
  assert.equal(faithful(burgess), false);
  assert.equal(faithful(burgess, burgess.toUpperCase()), true);
  assert.equal(faithful('I won’t leave.', "I won't leave!"), true);
  assert.equal(faithful('Ask them well, or not at all.', 'Ask them well, or not at all. *chuckles*'), true, 'a laugh is performance, not a word');
  assert.equal(faithful('Ask them well.', 'Ask them well. [sighs] Or not.'), false);
});

test('browser speech chunks preserve every word of long dialogue', () => {
  const text = `${burgess} ${burgess}`;
  const chunks = speechChunks(text);
  assert.ok(chunks.length > 3);
  assert.ok(chunks.every(s => s.length <= 140));
  assert.equal(chunks.join(' '), text);
});

function clock(t) {
  let now = 0;
  t.mock.timers.enable({ apis: ['setInterval', 'setTimeout'] });
  t.mock.method(performance, 'now', () => now);
  return (ms) => { for (let elapsed=0; elapsed<ms; elapsed+=500) { now+=500; t.mock.timers.tick(500); } };
}

function narrator(t) {
  const tick = clock(t);
  const audio = { currentTime: 0, pauseCount: 0, play: () => Promise.resolve(), pause() { this.pauseCount++; } };
  const pausedRef = { current: false };
  const stoppers = { current: new Set() }, playing = { current: new Set() };
  let shown = 0, ducks = 0;
  const snippet = player.slice(player.indexOf('  const playLine ='), player.indexOf('  /** Fetch a character'));
  const make = new Function('Audio','lineUrl','lineCache','stoppers','playing','duck','unduck','pausedRef','watchPlayback','readingMs',
    stripTypeScriptTypes(snippet) + '\nreturn playLine;');
  const playLine = make(function () { return audio; }, ()=>'test.mp3', {current:new Map()}, stoppers, playing,
    ()=>ducks++, ()=>ducks--, pausedRef, watchPlayback, ()=>2200);
  const ended = playLine('Slow dramatic speech.', ()=>shown++);
  return {tick,audio,pausedRef,stoppers,playing,ended,shown:()=>shown,ducks:()=>ducks};
}

test('real narrator code lets a slow 120-second recording finish, regardless of word count', async t => {
  const h=narrator(t);
  h.audio.onplaying();
  for (let i=0;i<240;i++) { h.audio.currentTime+=.5; h.tick(500); }
  assert.equal(h.audio.pauseCount,0);
  assert.equal(h.shown(),1);
  h.audio.onended(); await h.ended;
  assert.equal(h.audio.pauseCount,1);
  assert.equal(h.ducks(),0);
  assert.equal(h.stoppers.current.size,0);
});

test('pause does not expire narration; resume can finish normally', async t => {
  const h=narrator(t);
  h.pausedRef.current=true; h.tick(120000);
  assert.equal(h.audio.pauseCount,0);
  h.pausedRef.current=false; h.audio.currentTime=1; h.tick(500);
  assert.equal(h.audio.pauseCount,0);
  h.audio.onended(); await h.ended;
});

test('a stalled file falls back to reading time and cleans up once', async t => {
  const h=narrator(t);
  h.tick(34000); await h.ended;
  assert.equal(h.shown(),1);
  assert.equal(h.ducks(),0);
  assert.equal(h.playing.current.size,0);
  assert.equal(h.stoppers.current.size,0);
  h.tick(60000); assert.equal(h.ducks(),0);
});

test('Skip cancels narration timers and restores music exactly once', async t => {
  const h=narrator(t);
  [...h.stoppers.current][0](); await h.ended;
  h.tick(120000);
  assert.equal(h.ducks(),0);
  assert.equal(h.shown(),0);
});

test('book.json alone chooses the music for each scene, and every named track exists', () => {
  const book = JSON.parse(readFileSync(new URL('../src/content/books/sandman/book.json', import.meta.url), 'utf8'));
  const expect = { '2.5': 'hell-v1', '2.6': 'lucifer', '4.1': 'lucifer', '2.12': 'death', '5.2c': 'wings', '5.3': 'tavern', '5.3c': 'tavern', '2.9': 'ruby', '2.10': 'ruby', '6.3': 'greek-lyre', '7.4': 'faerie', '3.2': 'endless' };
  for (const [scene, track] of Object.entries(expect)) assert.equal(book.scenes[scene].music, track, scene);
  assert.ok(!player.includes('sceneScore'), 'no second music map in the player');
  const dir = new URL('../public/clips/sandman/audio/music/', import.meta.url);
  if (!existsSync(dir)) return; // media is local-only; the deployed copies live on Blob
  for (const [id, scene] of Object.entries(book.scenes)) {
    if (!scene.music || scene.music === 'none') continue;
    assert.ok(readFileSync(new URL(`${scene.music}.mp3`, dir)).length > 10000, `${id}: ${scene.music}.mp3`);
  }
});

// Let the voice code finish its asynchronous setup (fetching, levelling) before driving playback.
const settle = async (h) => { for (let i = 0; i < 50 && !h.a.onplaying; i++) await Promise.resolve(); };
function character(t, text = 'A long and slow character reply.') {
  const tick=clock(t);
  const a={currentTime:0,pauseCount:0,play:()=>Promise.resolve(),pause(){this.pauseCount++;}};
  let ducks=0, revoked=0;
  const stoppers={current:new Set()},playing={current:new Set()},pausedRef={current:false};
  const snippet=player.slice(player.indexOf('  const playVoice ='),player.indexOf('  /** A whole reply'));
  const make=new Function('useCallback','Audio','URL','setTalking','stoppers','playing','duck','unduck','pausedRef','watchPlayback','speechChunks','waitUnpaused','mixer','levelVoice',stripTypeScriptTypes(snippet)+'\nreturn playVoice;');
  const playVoice=make(f=>f,function(){return a;},{createObjectURL:()=> 'blob:test',revokeObjectURL:()=>revoked++},()=>{},stoppers,playing,()=>ducks++,()=>ducks--,pausedRef,watchPlayback,speechChunks,async()=>{},{current:null},async()=>false);
  const voice=playVoice(Promise.resolve(new Blob(['audio'])),text);
  return {a,tick,stoppers,playing,voice,ducks:()=>ducks,revoked:()=>revoked};
}

// A long speech (60 words) read slowly for 60 seconds: no fixed cut-off may end it early.
const longReply = Array.from({ length: 60 }, (_, i) => `word${i}`).join(' ');
test('character reply remains audible beyond 25 seconds and releases its blob at the end',async t=>{
  const h=character(t, longReply); await settle(h);
  h.a.onplaying(); await h.voice.started;
  for(let i=0;i<120;i++){h.a.currentTime+=.5;h.tick(500);}
  assert.equal(h.a.pauseCount,0);
  h.a.onended(); await h.voice.ended;
  assert.equal(h.ducks(),0);assert.equal(h.revoked(),1);assert.equal(h.playing.current.size,0);
});

// A six-word line still "playing" after a minute is a take that went silent: the game must not hang on it.
test('a short line that runs absurdly long is ended, so the scene never hangs',async t=>{
  const h=character(t); await settle(h);
  h.a.onplaying(); await h.voice.started;
  for(let i=0;i<120;i++){h.a.currentTime+=.5;h.tick(500);}
  await h.voice.ended;
  assert.equal(h.a.pauseCount,1);assert.equal(h.ducks(),0);assert.equal(h.revoked(),1);
});

test('interrupting character speech unducks music and cannot complete twice',async t=>{
  const h=character(t); await settle(h);
  h.a.onplaying(); const oldEnded=h.a.onended;
  [...h.stoppers.current][0](); oldEnded(); await h.voice.ended;
  assert.equal(h.ducks(),0);assert.equal(h.revoked(),1);assert.equal(h.a.pauseCount,1);
});

// Measurements of real gateway takes of the Burgess line (37 words), checked by transcription.
test('voice takes that went quiet, stalled or rambled are rejected; real performances are kept', () => {
  const words = 37;
  assert.equal(flaw({ seconds: 14.9, speaking: 12.1, hole: 1.0, tail: 0.1 }, words), null, 'a clean read');
  assert.equal(flaw({ seconds: 13.6, speaking: 9.9, hole: 1.2, tail: 0.3 }, words), null, 'dramatic pauses');
  assert.equal(flaw({ seconds: 12.7, speaking: 6.0, hole: 1.9, tail: 1.4 }, 12), null, 'the Crone, whispery and slow');
  assert.match(flaw({ seconds: 14.0, speaking: 6.3, hole: 3.3, tail: 4.0 }, words), /went quiet/, 'stopped at "on faith"');
  assert.match(flaw({ seconds: 18.8, speaking: 1.7, hole: 17.1, tail: 0 }, words), /silence mid-line/, 'said "Everything I ask, creature", then hiss');
  assert.match(flaw({ seconds: 112.4, speaking: 7.9, hole: 60.2, tail: 0 }, words), /silence|ran/, 'ran on for two minutes');
  assert.match(flaw({ seconds: 36.4, speaking: 11, hole: 0.2, tail: 0 }, words), /ran/, 'said four words, then mumbled for half a minute');
  assert.equal(flaw({ seconds: 15.1, speaking: 8.3, hole: 1.5, tail: 1.3 }, 12), null, 'the Crone, slow, with her wicked laugh');
  assert.match(flaw({ seconds: 30, speaking: 2, hole: 0.5, tail: 0.5 }, words), /ran|voice/, 'far too long and almost no voice');
});

// Real levels measured from gateway takes: the Maiden at about -18 dBFS, the Crone at about -37.
function tone(amplitude, seconds = 2, rate = 24000) {
  const x = new Float32Array(rate * seconds);
  for (let i = 0; i < x.length; i++) x[i] = (i % rate < rate * 0.8 ? amplitude : 0) * Math.sin(i / 7); // speech with pauses
  return x;
}
test('every speaker plays at the same loudness, however quietly the model recorded them', () => {
  const level = (amp) => amp * Math.SQRT1_2; // a sine's RMS
  const maiden = tone(0.18), crone = tone(0.02);
  const after = (x) => level(Math.max(...x.slice(0, 2000).map(Math.abs))) * speechGain(x, 24000);
  assert.ok(Math.abs(after(maiden) - after(crone)) < 0.01, 'Maiden and Crone end up level');
  assert.ok(speechGain(crone, 24000) > 4, 'the Crone is lifted a lot');
  assert.ok(speechGain(maiden, 24000) < 1, 'the Maiden is brought down a little');
  assert.equal(speechGain(new Float32Array(48000), 24000), 1, 'silence is left alone');
});

test('a beat sound effect plays once, can be switched off, and fades out when the scene changes', async () => {
  const made = [], faded = [];
  class FakeAudio { constructor(src) { this.src = src; this.paused = false; made.push(this); } play() { return Promise.resolve(); } pause() { this.paused = true; } }
  const snippet = player.slice(player.indexOf('  const playSfx ='), player.indexOf('  const assetUrl ='));
  const make = new Function('Audio','media','book','SFX_VOLUME','sfxOnRef','sfxPlaying','fadeTo',
    stripTypeScriptTypes(snippet) + '\nreturn { playSfx, fadeOutSfx };');
  const sfxOnRef = { current: true }, sfxPlaying = { current: new Set() };
  const { playSfx, fadeOutSfx } = make(FakeAudio, (p) => `/clips/${p}`, { id: 'sandman' }, 0.7, sfxOnRef, sfxPlaying,
    (a, v) => { faded.push([a, v]); return Promise.resolve(); });
  playSfx('glass-break');
  assert.equal(made.length, 1);
  assert.equal(made[0].src, '/clips/sandman/audio/sfx/glass-break.mp3');
  assert.equal(made[0].volume, 0.7);
  made[0].onended();
  assert.equal(sfxPlaying.current.size, 0, 'a finished effect is forgotten');
  playSfx('raven');
  fadeOutSfx(); await Promise.resolve(); await Promise.resolve();
  assert.deepEqual(faded.map(([a, v]) => [a.src.split('/').pop(), v]), [['raven.mp3', 0]]);
  assert.ok(made[1].paused, 'faded effects stop');
  assert.equal(sfxPlaying.current.size, 0);
  sfxOnRef.current = false;
  playSfx('thunder');
  assert.equal(made.length, 2, 'switched off: nothing plays');
});

test('every scene has an ambience bed, Hell burns, Nada\'s cell is ice, and the player loops it under the music', () => {
  const book = JSON.parse(readFileSync(new URL('../src/content/books/sandman/book.json', import.meta.url), 'utf8'));
  for (const [id, s] of Object.entries(book.scenes)) assert.ok(s.ambience || s.beats.some((b) => b.ambience), `${id} has no ambience`);
  for (const id of ['2.5', '2.6', '2.7', '2.8', '4.1']) assert.equal(book.scenes[id].ambience, 'hell', id);
  assert.equal(book.scenes['2.5'].beats.find((b) => b.text?.startsWith('In a cell of black ice')).ambience, 'ice');
  assert.ok(player.includes('audio/ambience/') && /a\.loop = true;[\s\S]*ambTarget/.test(player), 'player loops the bed');
  const dir = new URL('../public/clips/sandman/audio/ambience/', import.meta.url);
  if (!existsSync(dir)) return; // media is local-only; the deployed copies live on Blob
  const beds = new Set(Object.values(book.scenes).flatMap((s) => [s.ambience, ...s.beats.map((b) => b.ambience)]).filter(Boolean));
  for (const bed of beds) assert.ok(existsSync(new URL(`${bed}.mp3`, dir)), `${bed}.mp3`);
});
