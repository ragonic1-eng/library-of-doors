import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { applyEffect, meets, newProfile } from '../src/lib/state/profile.ts';

const book = JSON.parse(readFileSync(new URL('../src/content/books/sandman/book.json', import.meta.url), 'utf8'));
const choice = (sid, cid) => book.scenes[sid].choices.find((c) => c.id === cid);

test('friends made earlier unlock holding the gates at the siege, and only with four of them', () => {
  const defend = choice('7.3', '7.3.DEFEND');
  let p = newProfile();
  const allies = [['2.4', '2.4.A'], ['3.0', '3.0.GREEN'], ['4.2', '4.2.D'], ['5.2c', '5.2c.LET'], ['5.3c', '5.3c.FRIEND'], ['6.0', '6.0.ACCEPT'], ['6.2', '6.2.WAIT']];
  for (const [i, [sid, cid]] of allies.entries()) {
    assert.equal(meets(p, 'sandman', defend.requires), i >= 4, `after ${i} allies`);
    const c = choice(sid, cid);
    assert.ok(c.remembered, `${cid} tells the player it will be remembered`);
    p = applyEffect(p, 'sandman', c.effects);
  }
  assert.equal(p.vars.sandman.allies, 7);
  assert.ok(meets(p, 'sandman', defend.requires));
});

test('every ally who can come to the siege has a line there, and the defended Dreaming changes the endings', () => {
  const siege = JSON.stringify(book.scenes['7.3'].beats);
  for (const f of ['CONSTANTINE_ALLY', 'GREEN_FRIEND', 'FAERIE_FRIEND', 'ROSE_SPARED', 'HOB_FRIEND', 'DELIRIUM_LOVED', 'DELIRIUM_FORGAVE', 'THANKED_THREE', 'RUDE_TO_THREE']) assert.ok(siege.includes(`"${f}"`), f);
  for (const sid of ['7.5', 'end-A', 'end-B']) assert.ok(JSON.stringify(book.scenes[sid]).includes('DREAMING_DEFENDED'), sid);
});

test('the Alex branch opens only through kindness to the boy, and rejoins the main story', async () => {
  const { route } = await import('../src/lib/state/profile.ts');
  const S = book.scenes;
  assert.equal(choice('1.3', '1.3.W').next, '1.3a', 'everyone meets the boy on the stairs');
  assert.equal(choice('1.3a', '1.3a.KIND').next, '1.4x');
  assert.equal(choice('1.3a', '1.3a.LEAVE').next, '1.4');
  let p = newProfile();
  assert.equal(route(p, 'sandman', S['1.4']), '1.4m', 'main path skips the branch');
  assert.equal(route(p, 'sandman', choice('1.4m', '1.4.A')), '1.5', 'main path escapes as before');
  p = applyEffect(p, 'sandman', choice('1.3a', '1.3a.KIND').effects);
  assert.equal(route(p, 'sandman', S['1.4']), '1.4z', 'kindness leads to the inheritance');
  assert.equal(route(p, 'sandman', choice('1.4m', '1.4.A')), '1.5k', 'and to Alex freeing her');
  p = applyEffect(p, 'sandman', choice('1.4m', '1.4.C').effects);
  assert.equal(route(p, 'sandman', choice('1.4m', '1.4.C')), '1.5', 'showing him his death closes the gentle escape');
  for (const sid of ['1.4x', '1.4y', '1.4z', '1.4o', '1.5k']) assert.ok(S[sid], sid);
  assert.ok(Object.keys(S).indexOf('1.3a') === Object.keys(S).indexOf('1.3') + 1, 'branch scenes sit beside their chapter');
});
