import test from 'node:test';
import assert from 'node:assert/strict';
import { INTERIORS } from '../src/data/cosmetics/bars.ts';
import { THEMED_INTERIORS } from '../src/data/cosmetics/themedBars.ts';
import { GAME_OF_INTERIOR, STYLES, STYLE_OF_INTERIOR, styleForInterior } from '../src/audio/styles.ts';

const DRUMS = ['kick', 'snare', 'hat', 'brush', 'shaker', 'hand', 'tom'];
const VOICES = ['epiano', 'pad', 'pluck', 'vibes', 'marimba', 'bell', 'synth', 'flute', 'strings', 'organ', 'horn', 'chip'];

test('Every background has its own music style, not the fallback', () => {
  for (const interior of INTERIORS) {
    assert.ok(interior.id in STYLE_OF_INTERIOR, `${interior.id} has a style`);
    assert.ok(STYLES[styleForInterior(interior.id)], `${interior.id} points to a real style`);
  }
  for (const id of Object.keys(STYLE_OF_INTERIOR)) assert.ok(INTERIORS.some((item) => item.id === id), `${id} is a real background`);
});

test('Every themed background has a style of its own, and every game is noted', () => {
  assert.ok(THEMED_INTERIORS.length >= 30);
  for (const item of THEMED_INTERIORS) assert.equal(STYLE_OF_INTERIOR[item.id], item.id, `${item.id} has its own style`);
  const generic = ['underwater', 'underground', 'fairy', 'fairytale'];
  for (const item of THEMED_INTERIORS.filter((entry) => !generic.includes(entry.id))) assert.ok(GAME_OF_INTERIOR[item.id], `${item.id}: the game it comes from is noted`);
  assert.equal(Object.keys(GAME_OF_INTERIOR).length, THEMED_INTERIORS.length - generic.length);
  for (const id of Object.keys(GAME_OF_INTERIOR)) assert.ok(THEMED_INTERIORS.some((entry) => entry.id === id), id);
});

test('Every style is playable: sane tempo, real instruments, 16-step drum patterns, a melody scale', () => {
  for (const [name, style] of Object.entries(STYLES)) {
    assert.ok(style.bpm >= 55 && style.bpm <= 140, `${name} tempo`);
    assert.ok(style.root >= 30 && style.root <= 72, `${name} key`);
    assert.ok(style.scale.length >= 5 && style.lead.length >= 5, `${name} scales`);
    assert.ok(style.chords.length >= 2 && style.chords.every((degree) => Number.isInteger(degree) && degree >= 0), `${name} chords`);
    assert.ok(VOICES.includes(style.keys) && VOICES.includes(style.melody.voice), `${name} instruments`);
    assert.ok(style.melody.density > 0 && style.melody.density <= 1 && style.melody.decay > 0, `${name} melody`);
    for (const [drum, pattern] of Object.entries(style.drums)) {
      assert.ok(DRUMS.includes(drum), `${name}: ${drum}`);
      assert.match(pattern, /^[x.o]{16}$/, `${name} ${drum} pattern`);
    }
  }
});

test('No two styles are the same piece of music: the games sound different from each other', () => {
  const seen = new Map();
  for (const [name, style] of Object.entries(STYLES)) {
    const fingerprint = JSON.stringify([style.bpm, style.root, style.scale, style.chords, style.keys, style.melody.voice, style.drums]);
    assert.ok(!seen.has(fingerprint), `${name} is the same as ${seen.get(fingerprint)}`);
    seen.set(fingerprint, name);
  }
  // The game worlds use the instruments that belong to them.
  assert.equal(STYLES['elden-ring'].keys, 'strings');
  assert.equal(STYLES['heroes-3'].keys, 'organ');
  assert.equal(STYLES['skyrim'].melody.voice, 'horn');
  assert.equal(STYLES['witcher-3'].melody.voice, 'flute');
  assert.equal(STYLES.minecraft.drums.kick, undefined, 'Minecraft stays calm and drumless');
  assert.ok(STYLES['nfs-most-wanted'].bpm > STYLES.detroit.bpm + 40, 'a street race is faster than a quiet lounge');
});
