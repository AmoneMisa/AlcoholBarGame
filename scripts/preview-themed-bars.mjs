import { createRequire } from 'node:module';
import { writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { THEMED_INTERIORS, THEMED_INTERIOR_COSTUMES, THEMED_COSTUMES } from '../src/data/cosmetics/themedBars.ts';
import { bartenderCostumeFor } from '../src/data/cosmetics/bartenderCostumes.ts';
const sharp = createRequire(import.meta.url)('C:/Users/kubai/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/sharp');
const escape = text => text.replaceAll('&','&amp;').replaceAll('<','&lt;');
const backgroundsOnly = process.argv.includes('--backgrounds');
const partial = process.argv.includes('--partial');
const cards=[];
const interiors = THEMED_INTERIORS.filter(interior => !partial || (existsSync(`public${interior.asset}`) && (backgroundsOnly || ['noa','leo'].every(character => existsSync(`public${bartenderCostumeFor(character, THEMED_INTERIOR_COSTUMES[interior.id][character][0]).sheet}`)))));
for(const [index,interior] of interiors.entries()) {
  const backdrop=await sharp(`public${interior.asset}`).resize(640,360,{fit:'cover'}).png().toBuffer();
  const layers=[{input:backdrop,left:0,top:0}];
  for(const [column,character] of (backgroundsOnly ? [] : ['noa','leo']).entries()) {
    const costume=bartenderCostumeFor(character,THEMED_INTERIOR_COSTUMES[interior.id][character][0]);
    const width=Math.round(costume.frameRatio*552);
    const cutout=await sharp(`public${costume.sheet}`).extract({left:costume.index%3*width,top:Math.floor(costume.index/3)*552,width,height:552}).resize({height:315}).png().toBuffer();
    layers.push({input:cutout,left:90+column*300,top:40});
  }
  const caption=Buffer.from(`<svg width="640" height="40"><rect width="640" height="40" fill="#141a27"/><text x="16" y="27" fill="#f5d99c" font-family="Arial" font-size="19">${escape(interior.name)}</text></svg>`);
  layers.push({input:caption,left:0,top:360});
  const card=await sharp({create:{width:640,height:400,channels:4,background:'#141a27'}}).composite(layers).webp({quality:88}).toBuffer();
  cards.push({input:card,left:index%2*640,top:Math.floor(index/2)*400});
}
await sharp({create:{width:1280,height:Math.ceil(cards.length/2)*400,channels:4,background:'#141a27'}}).composite(cards).webp({quality:88}).toFile(backgroundsOnly ? 'docs/themed-backgrounds-preview.webp' : partial ? 'docs/themed-bars-progress-preview.webp' : 'docs/themed-bars-preview.webp');
if (backgroundsOnly) process.exit(0);
if (!partial) {
  const highlights = await Promise.all([0,6,9,11].map(async (index,position) => ({
    input: await sharp(cards[index].input).resize(400,250).webp({quality:90}).toBuffer(),
    left: position%2*400, top: Math.floor(position/2)*250,
  })));
  await sharp({create:{width:800,height:500,channels:4,background:'#141a27'}}).composite(highlights).webp({quality:90}).toFile('docs/themed-overview.webp');
}
for(const character of ['noa','leo']) {
  const outfits=THEMED_COSTUMES[character].filter(outfit => !partial || existsSync(`public${bartenderCostumeFor(character,outfit.value).sheet}`)), rows=Math.ceil(outfits.length/5), layers=[];
  for(const [index,outfit] of outfits.entries()) {
    const c=bartenderCostumeFor(character,outfit.value);
    const width=Math.round(c.frameRatio*552);
    const art=await sharp(`public${c.sheet}`).extract({left:c.index%3*width,top:Math.floor(c.index/3)*552,width,height:552}).resize(200,350,{fit:'contain',background:{r:0,g:0,b:0,alpha:0}}).png().toBuffer();
    layers.push({input:art,left:index%5*220+10,top:Math.floor(index/5)*385});
    const caption=Buffer.from(`<svg width="220" height="35"><text x="8" y="24" fill="#f5d99c" font-family="Arial" font-size="12">${escape(outfit.label)}</text></svg>`);
    layers.push({input:caption,left:index%5*220,top:Math.floor(index/5)*385+350});
  }
  await sharp({create:{width:1100,height:rows*385,channels:4,background:'#293144'}}).composite(layers).webp({quality:89}).toFile(`docs/${character}-themed-costumes${partial ? '-progress' : ''}-preview.webp`);
}
console.log('Saved themed scene and complete costume previews.');
