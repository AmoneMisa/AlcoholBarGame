const fold = (value: string) => value.toLowerCase().normalize('NFKD').replace(/\p{M}/gu, '').replace(/[’'`]/g, '').replace(/[^\p{L}\p{N}]+/gu, ' ').trim();
const aliases: Record<string, string> = {
  'вино': 'wine', 'вина': 'wine', 'виски': 'whiskey', 'джек': 'jack', 'дениелс': 'daniels', 'дэниелс': 'daniels', 'дэниэлс': 'daniels', 'даниэлс': 'daniels', 'данилс': 'daniels',
  'водка': 'vodka', 'джин': 'gin', 'ром': 'rum', 'текила': 'tequila', 'шампанское': 'champagne', 'пиво': 'beer', 'ликер': 'liqueur', 'ликёр': 'liqueur', 'коньяк': 'cognac', 'бренди': 'brandy', 'сок': 'juice', 'еда': 'food', 'закуска': 'food', 'сыр': 'cheese', 'оливки': 'olives', 'лед': 'ice', 'лёд': 'ice', 'лайм': 'lime', 'лимон': 'lemon', 'мята': 'mint'
};
export function preparationMatches(query: string, fields: string[]) {
  const text = fold(fields.join(' '));
  return fold(query).split(' ').filter(Boolean).every(word => text.includes(aliases[word] ?? word));
}
