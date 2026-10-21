import test from 'node:test';
import assert from 'node:assert/strict';
import { VoicePlayback } from '../src/lib/audio/voice.ts';

function setup() {
  const original = { fetch: globalThis.fetch, Audio: globalThis.Audio, create: URL.createObjectURL, revoke: URL.revokeObjectURL };
  const requests = [], played = [], paused = [], revoked = [];
  globalThis.fetch = (_url, options) => new Promise(resolve => requests.push({ resolve, signal: options.signal }));
  globalThis.Audio = class {
    constructor(url) { this.url = url; }
    async play() { played.push(this.url); }
    pause() { paused.push(this.url); }
  };
  let count = 0;
  URL.createObjectURL = () => `blob:${++count}`;
  URL.revokeObjectURL = url => revoked.push(url);
  return { requests, played, paused, revoked, restore() { globalThis.fetch = original.fetch; globalThis.Audio = original.Audio; URL.createObjectURL = original.create; URL.revokeObjectURL = original.revoke; } };
}
const response = { ok: true, blob: async () => new Blob(['audio']) };

test('leaving a scene aborts voice and ignores even a late successful response', async () => {
  const mock = setup();
  try {
    const voice = new VoicePlayback();
    const speaking = voice.speak('Old scene', 'sandman', 'alex');
    voice.stop();
    assert.equal(mock.requests[0].signal.aborted, true);
    mock.requests[0].resolve(response);
    assert.equal(await speaking, 'cancelled');
    assert.deepEqual(mock.played, []);
  } finally { mock.restore(); }
});

test('only the latest voice request plays when responses arrive in reverse order', async () => {
  const mock = setup();
  try {
    const voice = new VoicePlayback();
    const first = voice.speak('First', 'sandman', 'alex');
    const second = voice.speak('Second', 'sandman', 'lucienne');
    mock.requests[1].resolve(response);
    assert.equal(await second, 'playing');
    mock.requests[0].resolve(response);
    assert.equal(await first, 'cancelled');
    assert.equal(mock.played.length, 1);
    voice.stop();
    assert.deepEqual(mock.paused, mock.played);
    assert.deepEqual(mock.revoked, mock.played);
  } finally { mock.restore(); }
});

test('failed TTS reports unavailable, without creating a generic fallback voice', async () => {
  const mock = setup();
  try {
    const voice = new VoicePlayback();
    const speaking = voice.speak('Line', 'sandman', 'unity');
    mock.requests[0].resolve({ ok: false });
    assert.equal(await speaking, 'unavailable');
    assert.deepEqual(mock.played, []);
  } finally { mock.restore(); }
});

test('pre-rendered narration is stopped on exit and releases music ducking once', async () => {
  const mock = setup();
  try {
    const activity = [];
    const voice = new VoicePlayback(active => activity.push(active));
    assert.equal(await voice.playUrl('/narration.mp3'), 'playing');
    voice.stop();
    voice.stop();
    assert.deepEqual(mock.paused, ['/narration.mp3']);
    assert.deepEqual(activity, [true, false]);
    assert.deepEqual(mock.revoked, []);
  } finally { mock.restore(); }
});
