import { mkdir, writeFile } from 'node:fs/promises';
import { RECIPES } from '../src/domain/catalog.ts';

await mkdir('database/seed', { recursive: true });
await writeFile('database/seed/cocktails.json', `${JSON.stringify(RECIPES, null, 2)}\n`, 'utf8');
console.log(`Exported ${RECIPES.length} cocktails to database/seed/cocktails.json`);

