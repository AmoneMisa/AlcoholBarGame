import { BAR_PAIRINGS } from '../src/data/pairings/barPairings.ts';
import { PAIRING_PRINCIPLES } from '../src/domain/pairingExplain.ts';
import { writeFileSync } from 'node:fs';
import { topDrinkPairings } from '../src/domain/pairingEngine.ts';
import { pathToFileURL } from 'node:url';
import { resolve } from 'node:path';
const texts = new Set(['Cold Brew Coffee','Bourbon','Cognac','Lobster With Butter']);
for (const item of BAR_PAIRINGS.beverage_profiles) texts.add(item.name);
for (const list of [BAR_PAIRINGS.beverage_food_pairings,BAR_PAIRINGS.beverage_beverage_pairings,BAR_PAIRINGS.context_pairings,BAR_PAIRINGS.cigar_beverage_pairings]) {
  for (const item of list) { texts.add(item.why); if ('food' in item) texts.add(item.food); }
}
for (const item of Object.values(PAIRING_PRINCIPLES)) for (const key of ['title','rule','explain','example','sayIt']) texts.add(item[key]);
texts.add('Guests whose stated setting, activity and time match this card.');
for (const profile of BAR_PAIRINGS.beverage_profiles) {
  texts.add(`Guests who already enjoy ${profile.name} and want a related flavor direction.`);
  for (const item of topDrinkPairings(profile.id,6)) texts.add(item.why);
  for (const item of BAR_PAIRINGS.beverage_food_pairings.filter(item=>item.beverage===profile.id)) {
    texts.add(`Guests who enjoy ${profile.style.replaceAll('_',' ')} ${profile.family} and ${item.relationship} food pairings.`);
  }
}
for (const item of BAR_PAIRINGS.cigar_beverage_pairings) texts.add(`Guests smoking a ${item.cigar_body} cigar with ${item.cigar_note} notes.`);
for (const group of BAR_PAIRINGS.a0_dialogue_prompts) for (const prompt of group.a0) texts.add(prompt);
export const PAIRING_VOICE_TEXTS = [...texts].filter(Boolean);
if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  if (process.argv[2]) { writeFileSync(process.argv[2],JSON.stringify(PAIRING_VOICE_TEXTS,null,2)); console.log(PAIRING_VOICE_TEXTS.length+' recommendation voice texts'); }
  else process.stdout.write(JSON.stringify(PAIRING_VOICE_TEXTS,null,2));
}
