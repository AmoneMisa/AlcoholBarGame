import {createRequire} from 'node:module';
import {readFile} from 'node:fs/promises';
const sharp=createRequire(import.meta.url)(process.env.ART_SHARP_PATH || 'C:/Users/kubai/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/sharp');
const jobs=JSON.parse(await readFile('scripts/painted-keepsake-art.json','utf8'));
for(const job of jobs){
 const wheel=job.key==='wheel';
 const dest=wheel?'public/assets/ui/daily-wheel-painted-v1.webp':`public/assets/workshop/keepsakes/${job.key}-painted-v1.webp`;
 if(!(await sharp(job.source).metadata()).hasAlpha)throw new Error(job.key+' needs transparency');
 await sharp(job.source).trim().resize(wheel?800:384,wheel?800:384,{fit:'contain',background:'#00000000'}).webp({quality:92,alphaQuality:100}).toFile(dest);
 console.log(dest);
}
