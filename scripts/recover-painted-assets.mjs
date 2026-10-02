import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, writeFileSync, readFileSync, unlinkSync } from 'node:fs';
import { resolve, dirname, relative } from 'node:path';
const root = process.cwd();
const git = (...args) => execFileSync('git', ['-c', `safe.directory=${root.replaceAll('\\','/')}`, ...args], { maxBuffer: 100 * 1024 * 1024 });
const changed = git('diff-tree','--no-commit-id','--name-status','-r','013cd8e').toString().trim().split('\n');
let restored = 0, removed = 0;
for (const row of changed) {
  const [status, name] = row.split('\t');
  const file = resolve(root, name);
  if (relative(root, file).startsWith('..')) throw Error('Outside workspace');
  if (status === 'D') { if (existsSync(file)) { unlinkSync(file); removed++; } continue; }
  let shouldRestore = !existsSync(file) || name.startsWith('public/');
  if (!shouldRestore && status === 'M') {
    try { shouldRestore = readFileSync(file).equals(git('show',`HEAD:${name}`)); } catch {}
  }
  if (!shouldRestore) continue;
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, git('show',`013cd8e:${name}`)); restored++;
}
console.log({ restored, removed });
