export function startsWithVowelSound(text: string) {
  const word = text.toLowerCase().trim();
  if (/^(uni|use|usu|uti|eu|one|once|ur)/.test(word)) return false;
  if (/^(hour|honest|honou?r|heir)/.test(word)) return true;
  return /^[aeiou]/.test(word);
}
export const withArticle = (name: string) => `${startsWithVowelSound(name) ? 'an' : 'a'} ${name}`;
