import {createRequire} from 'node:module';
import {readFile,writeFile} from 'node:fs/promises';
const sharp=createRequire(import.meta.url)(process.env.ART_SHARP_PATH || 'C:/Users/kubai/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/sharp');
const frames=JSON.parse(await readFile('scripts/achievement-stage-art.json','utf8'));
const subjects={backgrounds:'items/background-choice',bars:'equipment/fridge',barUpgrades:'items/equipment-choice',bonds:'items/calm-charm',bottles:'equipment/cellar',boxes:'boxes/gold',coinsSpent:'resources/coins',companions:'items/friend-choice',crystalsSpent:'resources/crystals',draws:'items/style-choice',giftsGot:'boxes/silver',giftsSent:'boxes/choice',lessons:'items/xp-boost',level:'resources/xp',loginDays:'items/happy-hour',perfectTalks:'items/whisper',serves:'equipment/shaker',signatures:'items/scroll',skins:'items/style-choice',staffHired:'items/friend-choice',staffLevels:'items/xp-boost',tasted:'resources/supplies',upgrades:'equipment/register',vips:'items/vip-magnet',visitedBy:'items/friend-choice',visitedFriends:'items/courier'};
for(const frame of frames) await sharp(frame.source).trim().resize(384,384,{fit:'contain',background:'#00000000'}).webp({quality:90,alphaQuality:100}).toFile(`public/assets/ui/achievement-${frame.key}.webp`);
for(const [series,subject] of Object.entries(subjects)){
  const painted=!['resources/supplies'].includes(subject);
  const emblem=await sharp(`public/assets/workshop/${subject}${painted?'-painted-v1':''}.webp`).resize(120,120,{fit:'contain',background:'#00000000'}).png().toBuffer();
  for(let tier=1;tier<=4;tier++) await sharp(`public/assets/ui/achievement-${frames[tier-1].key}.webp`).composite([{input:emblem,left:132,top:108}]).webp({quality:90,alphaQuality:100}).toFile(`public/assets/workshop/achievements/${series}-tier-${tier}.webp`);
}
console.log(`Built ${Object.keys(subjects).length*4} painted achievement stage pictures`);
