import { createRequire } from 'node:module';
import { readFile, mkdir } from 'node:fs/promises';
const sharp = createRequire(import.meta.url)(process.env.ART_SHARP_PATH || 'C:/Users/kubai/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/sharp');
const jobs = JSON.parse(await readFile('scripts/painted-reward-art.json','utf8'));
for (const job of jobs) {
  const output = job.key==='fragment-puzzle' ? 'public/assets/ui/fragment-puzzle-painted-v1.webp' : `public/assets/workshop/${job.key}-painted-v1.webp`;
  await mkdir(output.slice(0,output.lastIndexOf('/')),{recursive:true});
  if (!(await sharp(job.source).metadata()).hasAlpha) throw new Error(`${job.key} requires transparency`);
  await sharp(job.source).resize(384,384,{fit:'contain',background:{r:0,g:0,b:0,alpha:0}}).webp({quality:90,alphaQuality:100}).toFile(output);
}
