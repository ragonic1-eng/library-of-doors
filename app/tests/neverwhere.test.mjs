import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { applyEffect, meets, newProfile, route } from '../src/lib/state/profile.ts';

const book = JSON.parse(readFileSync(new URL('../src/content/books/neverwhere/book.json', import.meta.url), 'utf8'));
const S = book.scenes;
const choice = (sid, cid) => S[sid].choices.find((c) => c.id === cid);
const B = 'neverwhere';

test('every scene id is its chapter and position, so the owner can name any scene', () => {
  let chapter = -1, pos = 0;
  for (const id of Object.keys(S)) {
    if (S[id].episodeTitle) { chapter++; pos = 0; }
    pos++;
    assert.equal(id, `${chapter}.${pos}`, `${id} should be ${chapter}.${pos}`);
    for (const c of S[id].choices ?? []) assert.ok(c.id.startsWith(`${id}.`), `${c.id} belongs to ${id}`);
    for (const b of [...S[id].beats, ...(S[id].choices ?? []).flatMap((c) => c.aftermath ?? [])]) for (const pic of [b.clip, b.still].filter(Boolean)) assert.ok(/^nw-(\d+\.\d+|shared)-/.test(pic), pic);
  }
});

test('every dead end goes back to an earlier scene that can lead to it again, and plays on video', () => {
  const ids = Object.keys(S);
  const dead = ids.filter((id) => S[id].retryFrom);
  assert.ok(dead.length >= 7, `dead ends: ${dead.length}`);
  for (const id of dead) {
    const sc = S[id];
    assert.equal(sc.type, 'end', id);
    assert.ok(S[sc.retryFrom], `${id} goes back to ${sc.retryFrom}`);
    assert.ok(ids.indexOf(sc.retryFrom) < ids.indexOf(id), `${id}: ${sc.retryFrom} comes earlier in the book`);
    assert.ok(sc.beats.some((b) => b.clip), `${id} has a video`);
  }
  for (const id of ids.filter((x) => S[x].type === 'end' && !/credits/i.test(S[x].title))) assert.ok(S[id].beats.some((b) => b.clip), `${id} ends on video`);
});

test('a dead end needs two wrong steps: giving Door away once is survivable, twice is not', () => {
  let p = newProfile();
  const offer = choice('4.2', '4.2.B');
  assert.equal(route(applyEffect(p, B, offer.effects), B, offer), '4.4', 'first betrayal: the story goes on');
  p = applyEffect(p, B, choice('2.2', '2.2.C').effects);
  assert.equal(route(applyEffect(p, B, offer.effects), B, offer), '4.3', 'second betrayal: disposed of');
});

test('the marquis only saves her from Lamia if she never doubted him twice', () => {
  const yes = choice('16.3', '16.3.A');
  let p = newProfile();
  assert.equal(route(applyEffect(p, B, yes.effects), B, yes), '17.1', 'a neutral player is saved');
  p = applyEffect(p, B, choice('9.4', '9.4.C').effects); // "a bit dodgy": -2
  assert.equal(route(applyEffect(p, B, yes.effects), B, yes), '16.4', 'after doubting him, frost');
});

test('throwing the spear is gone once she shared the dream with Hunter, and the Ordeal is not offered as a loop', () => {
  let p = newProfile();
  assert.ok(meets(p, B, choice('19.1', '19.1.B').requires));
  p = applyEffect(p, B, choice('12.2', '12.2.C').effects);
  assert.ok(!meets(p, B, choice('19.1', '19.1.B').requires), 'BEAST_SHARED removes the dream trap');
  assert.equal(S['14.2'].retryFrom, '13.1');
  assert.equal(S['20.7'].retryFrom, '15.3');
});

test('the bridge opens one way for each Sandman ending, and remembers the latest one', async () => {
  const { flagOn } = await import('../src/lib/state/profile.ts');
  const passes = (p, b) => (!b.if || b.if.every((f) => flagOn(p, B, f))) && (!b.unless || !b.unless.some((f) => flagOn(p, B, f)));
  const variant = (visited) => {
    const p = { ...newProfile(), visited };
    return S['0.1'].beats.filter((b) => (b.still || (b.clip && b.clip !== 'nw-2.1-beast-dream-v')) && passes(p, b)).map((b) => b.still ?? b.clip);
  };
  assert.deepEqual(variant([]), ['nw-0.1-library'], 'Sandman not finished');
  assert.deepEqual(variant(['7.5', 'end-A', 'fin-dream']), ['nw-0.1-wake', 'nw-0.1-daniel'], 'the Wake');
  assert.deepEqual(variant(['end-B']), ['nw-0.1-ash-v'], "the Sandman's own clip of Aurie alone");
  assert.deepEqual(variant(['end-C']), ['nw-0.1-flat']);
  assert.deepEqual(variant(['end-R']), ['nw-0.1-throne']);
  assert.deepEqual(variant(['end-A', 'fin-dream', 'end-C']), ['nw-0.1-flat'], 'played the Sandman twice: the latest ending counts');
});

test('one book remembers another: Lucifer, Hob, Alex, and Death at every dead end', async () => {
  const { flagOn } = await import('../src/lib/state/profile.ts');
  const p = { ...newProfile(), visited: ['2.6'], flags: { sandman: { HOB_FRIEND: true } } };
  assert.ok(flagOn(p, B, 'sandman:@2.6'));
  assert.ok(flagOn(p, B, 'sandman:HOB_FRIEND'));
  assert.ok(!flagOn(p, B, 'sandman:ALEX_CURSED'));
  assert.ok(!flagOn(p, B, 'HOB_FRIEND'), 'a plain flag is this book only');
  assert.ok(meets(p, B, choice('20.4', '20.4.C').requires), 'met Lucifer: the extra retort');
  assert.ok(!meets(newProfile(), B, choice('20.4', '20.4.C').requires));
  for (const id of Object.keys(S).filter((x) => S[x].retryFrom)) assert.ok(S[id].beats.some((b) => b.clip === 'nw-shared-death-v'), `${id}: Death is there`);
});
