import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { stripTypeScriptTypes } from 'node:module';
import { faithful } from '../src/lib/server/faithful.ts';
import { watchPlayback, speechChunks } from '../src/lib/story/audio.ts';
import { sceneScore, localScoreUrl } from '../src/lib/story/score.ts';

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

test('new score files exist and silence/other books remain respected', () => {
  for (const scene of ['2.2','2.5','2.9','2.12','5.3c']) {
    const url=localScoreUrl(sceneScore('sandman',scene,'library'));
    assert.ok(readFileSync(new URL(`../public${url}`,import.meta.url)).length>10000);
  }
  assert.equal(sceneScore('sandman','2.2','none'),'none');
  assert.equal(sceneScore('coraline','2.2','library'),'library');
  assert.equal(localScoreUrl('local:../../bad'),null);
});

function character(t) {
  const tick=clock(t);
  const a={currentTime:0,pauseCount:0,play:()=>Promise.resolve(),pause(){this.pauseCount++;}};
  let ducks=0, revoked=0;
  const stoppers={current:new Set()},playing={current:new Set()},pausedRef={current:false};
  const snippet=player.slice(player.indexOf('  const playVoice ='),player.indexOf('  /** A whole reply'));
  const make=new Function('useCallback','Audio','URL','setTalking','stoppers','playing','duck','unduck','pausedRef','watchPlayback','speechChunks','waitUnpaused',stripTypeScriptTypes(snippet)+'\nreturn playVoice;');
  const playVoice=make(f=>f,function(){return a;},{createObjectURL:()=> 'blob:test',revokeObjectURL:()=>revoked++},()=>{},stoppers,playing,()=>ducks++,()=>ducks--,pausedRef,watchPlayback,speechChunks,async()=>{});
  const voice=playVoice(Promise.resolve(new Blob(['audio'])),'A long and slow character reply.');
  return {a,tick,stoppers,playing,voice,ducks:()=>ducks,revoked:()=>revoked};
}

test('character reply remains audible beyond 25 seconds and releases its blob at the end',async t=>{
  const h=character(t); await Promise.resolve(); await Promise.resolve(); await Promise.resolve();
  h.a.onplaying(); await h.voice.started;
  for(let i=0;i<120;i++){h.a.currentTime+=.5;h.tick(500);}
  assert.equal(h.a.pauseCount,0);
  h.a.onended(); await h.voice.ended;
  assert.equal(h.ducks(),0);assert.equal(h.revoked(),1);assert.equal(h.playing.current.size,0);
});

test('interrupting character speech unducks music and cannot complete twice',async t=>{
  const h=character(t); await Promise.resolve(); await Promise.resolve(); await Promise.resolve();
  h.a.onplaying(); const oldEnded=h.a.onended;
  [...h.stoppers.current][0](); oldEnded(); await h.voice.ended;
  assert.equal(h.ducks(),0);assert.equal(h.revoked(),1);assert.equal(h.a.pauseCount,1);
});
