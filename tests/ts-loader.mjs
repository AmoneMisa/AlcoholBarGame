import ts from 'typescript';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

export async function resolve(specifier,context,nextResolve) {
  if ((specifier.startsWith('.') || specifier.startsWith('/')) && !/\.[a-z]+$/i.test(specifier)) {
    try { return await nextResolve(specifier + '.ts',context); } catch { /* Try normal JS resolution. */ }
  }
  return nextResolve(specifier,context);
}
export async function load(url,context,nextLoad) {
  if (url.endsWith('.ts')) {
    const source = await readFile(fileURLToPath(url),'utf8');
    return { format:'module',shortCircuit:true,source:ts.transpileModule(source,{ compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ESNext} }).outputText };
  }
  return nextLoad(url,context);
}
