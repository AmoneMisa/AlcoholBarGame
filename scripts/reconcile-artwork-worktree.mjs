import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
const files = ['package.json','src/data/cosmetics/bars.ts','src/domain/cosmetics.ts','src/domain/loot.ts','src/sim/loot.ts','src/sim/rules.ts','src/stores/game.ts','src/components/workshop/WorkshopPage.vue','src/components/game/ManagementDeck.vue','tests/avatar.test.mjs'];
const backup = '.tmp/artwork-merge-recovery'; mkdirSync(backup,{recursive:true});
for (const file of files) {
  let text = readFileSync(file,'utf8');
  writeFileSync(`${backup}/${file.replaceAll('/','__')}`,text);
  text = text.replace(/^<<<<<<< Updated upstream\r?\n([\s\S]*?)^=======\r?\n([\s\S]*?)^>>>>>>> Stashed changes\r?\n/gm, (_,up,stash) => {
    if (file === 'package.json') {
      const names = [...new Set((up+stash).match(/tests\/[a-z-]+\.test\.mjs/g))];
      return `    "test": "node --import ./tests/register.mjs --test ${names.join(' ')}",\n`;
    }
    if (file === 'src/sim/rules.ts' && up.includes("type: 'wipeAccount'")) return up+stash;
    if (file === 'src/stores/game.ts') {
      return '    '+[...new Set((up+stash).trim().split(/,\s*/))].join(', ')+'\n';
    }
    if (file === 'src/components/workshop/WorkshopPage.vue') return up.replace('        <UiButton variant="primary"', '        <small v-if="achievementStyles(row.goal.id)">Styles: {{ achievementStyles(row.goal.id) }}</small>\n        <UiButton variant="primary"');
    if (file === 'src/sim/loot.ts' && up.includes('Higher tiers')) {
      const styles = stash.split('\n').filter(line=>!line.trimStart().startsWith('note(')).join('\n');
      return styles+up.replace('${joined}`)', '${joined}${styles.length ? ` Styles: ${styles.join(\'; \')}.` : \'\'}`)');
    }
    return stash;
  });
  writeFileSync(file,text);
}
const root = process.cwd().replaceAll('\\','/');
const git = (...args) => execFileSync('git',['-c',`safe.directory=${root}`,...args],{maxBuffer:10*1024*1024});
for (const file of ['src/game.css','src/components/game/ManagementDeck.vue','tests/avatar.test.mjs']) {
  const tag = file.replaceAll('/','__');
  const current=`${backup}/${tag}.current`, base=`${backup}/${tag}.base`, painted=`${backup}/${tag}.painted`;
  writeFileSync(current,readFileSync(file)); writeFileSync(base,git('show',`013cd8e^:${file}`)); writeFileSync(painted,git('show',`013cd8e:${file}`));
  try { writeFileSync(file,git('merge-file','-p',current,base,painted)); }
  catch (error) { if (error.stdout?.length) writeFileSync(file,error.stdout); else throw error; }
}
console.log('Recovered artwork changes and preserved both sides of the shared project edits.');
