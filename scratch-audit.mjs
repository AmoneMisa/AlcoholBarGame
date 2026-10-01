import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, resolve, dirname, normalize, relative } from 'node:path';

const walk = (d) => readdirSync(d).flatMap((n) => { const p = join(d, n); return statSync(p).isDirectory() ? (n === 'node_modules' ? [] : walk(p)) : [p]; });
const files = [...walk('src'), ...walk('tests'), ...walk('server'), ...walk('scripts'), 'index.html', 'vite.config.ts'].filter((p) => /\.(ts|vue|mjs|js|html|css)$/.test(p));
const text = Object.fromEntries(files.map((p) => [normalize(p), readFileSync(p, 'utf8')]));
const all = Object.values(text).join('\n');

// 1. Files nothing imports
const imported = new Set();
const exts = ['', '.ts', '.vue', '.mjs', '.js', '/index.ts'];
for (const [p, t] of Object.entries(text)) {
  for (const m of t.matchAll(/(?:from\s+|import\s*\(\s*|import\s+|glob\(\s*)['"]([^'"]+)['"]/g)) {
    if (!m[1].startsWith('.')) continue;
    for (const e of exts) { const rel = normalize(relative(process.cwd(), resolve(dirname(p), m[1] + e))); if (text[rel] !== undefined) { imported.add(rel); break; } }
  }
}
console.log('FILES NEVER IMPORTED:');
for (const p of Object.keys(text)) if (/^src/.test(p) && /\.(ts|vue)$/.test(p) && !imported.has(p) && !/main\.ts|env\.d\.ts/.test(p)) console.log('  ' + p);

// 2. Exports that no other file uses
const out = [];
for (const [p, t] of Object.entries(text)) {
  if (!/^src/.test(p) || !/\.(ts|vue)$/.test(p)) continue;
  for (const m of t.matchAll(/^export (?:const|function|class|interface|type|enum) (\w+)/gm)) {
    const re = new RegExp('\\b' + m[1] + '\\b', 'g');
    const total = (all.match(re) ?? []).length, own = (t.match(re) ?? []).length;
    if (total - own === 0) out.push(`${p}: ${m[1]}${own > 1 ? ' (used only inside its own file)' : ' (not used at all)'}`);
  }
}
console.log('\nEXPORTS NOT USED BY ANY OTHER FILE (' + out.length + '):');
console.log(out.join('\n'));
