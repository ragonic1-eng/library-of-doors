import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { newProfile, arrive, commitChoice, applyConsequence, loadProfile, saveProfile } from '../src/lib/state/profile.ts';
import { priorTurns, shouldConclude } from '../src/lib/dialogue/turns.ts';
const book = JSON.parse(fs.readFileSync(new URL('../src/content/books/sandman/book.json', import.meta.url)));

test('a committed choice saves destination and effects atomically and cannot be applied twice', () => {
  const before = arrive(newProfile(), book, '1.5');
  before.flags.sandman = { ALEX_PROMISE: true };
  const choice = book.scenes['1.5'].choices[0];
  const after = commitChoice(before, book, '1.5', choice);
  assert.equal(after.position.scene, '2.1');
  assert.equal(after.traits.mercy, -5);
  assert.equal(after.flags.sandman.BROKE_PROMISE, true);
  assert.equal(after.journal.length, 2);
  assert.equal(before.traits.mercy, 0);
  assert.equal(commitChoice(after, book, '1.5', choice), after);
  assert.equal(commitChoice(after, book, '1.5', book.scenes['1.5'].choices[2]), after);
});

test('gates are enforced again when choices and consequences are applied', () => {
  const p = newProfile();
  const gated = structuredClone(book);
  gated.scenes['1.5'].choices[0].requires = { flags: ['EARNED'] };
  assert.equal(commitChoice(p, gated, '1.5', gated.scenes['1.5'].choices[0]), p);
  assert.equal(applyConsequence(p, 'sandman', 'alex', 'TEST', { when: 'test', requires: { flags: ['EARNED'] }, trust: 2 }), p);
});

test('consequences and journal entries fire once', () => {
  const p = newProfile();
  const consequence = { when: 'test', trust: 2, effects: { traits: { mercy: 1 } }, ripple: 'A candle warms.', echo: { text: 'An earned event.', knownBy: ['lucienne'] } };
  const next = applyConsequence(p, 'sandman', 'alex', 'WARMTH', consequence);
  assert.equal(next.traits.mercy, 1);
  assert.equal(next.relations.alex.trust, 2);
  assert.equal(next.echoes.length, 1);
  assert.equal(next.journal.length, 1);
  assert.equal(applyConsequence(next, 'sandman', 'alex', 'WARMTH', consequence), next);
});

test('first night completion is idempotent and does not award a whole-book relic', () => {
  const p = arrive(newProfile(), book, 'end-ep1');
  assert.deepEqual(p.completed, ['sandman.ep1']);
  assert.deepEqual(arrive(p, book, 'end-ep1').completed, ['sandman.ep1']);
  assert.deepEqual(p.relics, []);
});

test('valid legacy saves acquire the new journal and decision fields', () => {
  const legacy = newProfile();
  delete legacy.journal; delete legacy.decisions;
  legacy.position = { book: 'sandman', scene: '1.4' };
  globalThis.window = { localStorage: { getItem: () => JSON.stringify(legacy), setItem: () => { throw new Error('quota'); } } };
  assert.deepEqual(loadProfile().journal, []);
  assert.deepEqual(loadProfile().decisions, {});
  assert.equal(loadProfile().position.scene, '1.4');
  assert.equal(saveProfile(newProfile()), false);
  delete globalThis.window;
});

test('latest input is represented once and turn limits conclude on the actual final exchange', () => {
  const history = [{ role: 'character', text: 'Hello' }, { role: 'player', text: 'One' }, { role: 'character', text: 'Reply' }];
  assert.deepEqual(priorTurns([...history, { role: 'player', text: 'Two' }], 'Two'), history);
  assert.deepEqual(priorTurns(history, 'Two'), history);
  assert.equal(shouldConclude(history, 3), false);
  assert.equal(shouldConclude([...history, { role: 'player', text: 'Two' }], 3), true);
  assert.equal(shouldConclude(history, 0), false);
});

test('every authored branch reaches the ending without a missing node or dead end', () => {
  const cast = JSON.parse(fs.readFileSync(new URL('../src/content/characters/sandman.json', import.meta.url)));
  const visited = new Set();
  function visit(id, stack = []) {
    assert.ok(!stack.includes(id), `Unexpected cycle at ${id}`);
    const scene = book.scenes[id];
    assert.ok(scene, `Missing ${id}`);
    visited.add(id);
    if (scene.type === 'end') return;
    if (scene.conversation) {
      assert.ok(cast[scene.conversation.character]);
      for (const exit of Object.keys(scene.conversation.exits)) assert.ok(scene.choices.some(c => c.id === exit));
    }
    const next = [scene.next, ...(scene.choices ?? []).map(c => c.next)].filter(Boolean);
    assert.ok(next.length, `Dead end at ${id}`);
    for (const target of next) visit(target, [...stack, id]);
  }
  visit(book.start);
  assert.equal(visited.size, Object.keys(book.scenes).length);
});
