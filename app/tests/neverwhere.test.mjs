import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { applyEffect, meets, newProfile, route } from '../src/lib/state/profile.ts';

const book = JSON.parse(readFileSync(new URL('../src/content/books/neverwhere/book.json', import.meta.url), 'utf8'));
const S = book.scenes;
const choice = (sid, cid) => S[sid].choices.find((c) => c.id === cid);
const B = 'neverwhere';

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
  for (const id of ids.filter((x) => S[x].type === 'end' && x !== 'fin-credits')) assert.ok(S[id].beats.some((b) => b.clip), `${id} ends on video`);
});

test('a dead end needs two wrong steps: giving Door away once is survivable, twice is not', () => {
  let p = newProfile();
  const offer = choice('2.2', '2.2.B');
  assert.equal(route(applyEffect(p, B, offer.effects), B, offer), '2.3', 'first betrayal: the story goes on');
  p = applyEffect(p, B, choice('1.4', '1.4.C').effects);
  assert.equal(route(applyEffect(p, B, offer.effects), B, offer), 'dead-2.2', 'second betrayal: disposed of');
});

test('the marquis only saves her from Lamia if she never doubted him twice', () => {
  const yes = choice('7.5', '7.5.A');
  let p = newProfile();
  assert.equal(route(applyEffect(p, B, yes.effects), B, yes), '7.6', 'a neutral player is saved');
  p = applyEffect(p, B, choice('4.3', '4.3.C').effects); // "a bit dodgy": -2
  assert.equal(route(applyEffect(p, B, yes.effects), B, yes), 'dead-7.5', 'after doubting him, frost');
});

test('throwing the spear is gone once she shared the dream with Hunter, and the Ordeal is not offered as a loop', () => {
  let p = newProfile();
  assert.ok(meets(p, B, choice('8.2', '8.2.B').requires));
  p = applyEffect(p, B, choice('6.2', '6.2.C').effects);
  assert.ok(!meets(p, B, choice('8.2', '8.2.B').requires), 'BEAST_SHARED removes the dream trap');
  assert.equal(S['end-E'].retryFrom, '6.3');
  assert.equal(S['end-D'].retryFrom, '7.2');
});
