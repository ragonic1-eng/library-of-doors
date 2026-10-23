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
