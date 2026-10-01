import test from 'node:test';
import assert from 'node:assert/strict';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, sep } from 'node:path';

const files = (dir) => readdirSync(dir).flatMap((name) => { const path = join(dir, name); return statSync(path).isDirectory() ? files(path) : path.endsWith('.vue') ? [path] : []; });
const vue = files('src').map((path) => [path.split(sep).join('/'), readFileSync(path, 'utf8')]);

test('Text inputs and selects come from the UI kit, not from raw elements', () => {
  const bad = [];
  for (const [path, source] of vue) {
    if (path.endsWith('/ui/UiInput.vue') || path.endsWith('/OptionSelect.vue')) continue;
    if (/<select\b/.test(source)) bad.push(`${path}: <select>`);
    for (const tag of source.match(/<input\b[^>]*>/g) ?? []) if (!/type="(range|radio|number)"/.test(tag) && !(path.endsWith('/ui/UiCheckbox.vue') && /type="checkbox"/.test(tag))) bad.push(`${path}: ${tag.slice(0, 60)}`);
  }
  assert.deepEqual(bad, [], 'use UiInput and OptionSelect (src/components/ui, src/components/game/OptionSelect.vue)');
});

test('The standard form buttons use UiButton', () => {
  const mustUse = ['workshop/WorkshopPage.vue', 'workshop/CompanionsPanel.vue', 'settings/SettingsPage.vue', 'settings/SoundControls.vue', 'profile/ProfilePage.vue', 'friends/FriendsPage.vue', 'game/AcademyPanel.vue', 'game/DeliveryProblems.vue'];
  for (const name of mustUse) {
    const source = vue.find(([path]) => path.endsWith(name))?.[1] ?? '';
    assert.match(source, /<UiButton\b/, `${name} uses UiButton`);
    // the only raw buttons left are navigation-style (tabs, accordion heads), never action buttons
    const raw = (source.match(/<button\b[^>]*>/g) ?? []).filter((tag) => !/workshop-tabs|academy-head|class="story|aria-expanded/.test(tag));
    assert.ok(raw.length <= 2, `${name} still has raw buttons: ${raw.map((tag) => tag.slice(0, 50)).join(' | ')}`);
  }
});

test('The device voice gets drink words respelled so they sound right', async () => {
  const { forDeviceVoice } = await import('../src/domain/english/pronounce.ts');
  assert.equal(forDeviceVoice('Orange liqueur'), 'Orange lih-kyur');
  assert.equal(forDeviceVoice('Do you like liqueurs, or Pinot Noir?'), 'Do you like lih-kyurz, or pee-noh nwahr?');
  assert.equal(forDeviceVoice('A bright Mojito'), 'A bright moh-hee-toh');
  assert.equal(forDeviceVoice('Nothing special here'), 'Nothing special here');
  assert.equal(forDeviceVoice('reliqueurish'), 'reliqueurish', 'only whole words');
});
