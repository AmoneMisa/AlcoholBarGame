import {
  BAR_PAIRINGS,
  findBeverageFoodPairings,
  findBeveragePairings,
  findCigarPairings,
  pairingBand,
  shouldOfferNonAlcoholic
} from '../data/pairings/barPairings';

export type PairingMode = 'food' | 'drink' | 'context' | 'cigar';

export interface ContextQuery {
  mood?: string;
  setting?: string;
  activity?: string;
  time_of_day?: string;
  weather?: string;
  company?: string;
}

export function beverageProfile(id: string) {
  return BAR_PAIRINGS.beverage_profiles.find((item) => item.id === id);
}

export function topFoodPairings(beverageId: string, limit = 8) {
  return findBeverageFoodPairings(beverageId).slice(0, limit).map((item) => ({
    ...item,
    band: pairingBand(item.score)
  }));
}

export function topDrinkPairings(beverageId: string, limit = 8) {
  const direct = findBeveragePairings(beverageId).slice(0, limit).map((item) => ({
    ...item,
    partnerId: item.a === beverageId ? item.b : item.a,
    band: pairingBand(item.score)
  }));
  const source = beverageProfile(beverageId);
  if (!source || direct.length >= limit) return direct;
  // Some wines have food matches but no cocktail-combination rows. Offer related drinks to explore,
  // using shared food matches or the same style, without presenting them as ingredients to mix together.
  const foods = new Set(findBeverageFoodPairings(beverageId).filter(item=>item.score>=80).map(item=>item.food));
  const used = new Set([beverageId,...direct.map(item=>item.partnerId)]);
  const related = BAR_PAIRINGS.beverage_profiles.filter(item=>!used.has(item.id)).map(item=>{
    const shared = findBeverageFoodPairings(item.id).filter(pair=>pair.score>=80 && foods.has(pair.food));
    const sameStyle = item.family===source.family && item.style===source.style;
    const score = Math.min(79,55 + (sameStyle ? 12 : 0) + Math.min(12,shared.length*3));
    return {a:beverageId,b:item.id,partnerId:item.id,score,band:pairingBand(score),relationship:'alternative to explore',
      why:shared.length ? `Both work well with ${shared.slice(0,2).map(pair=>pair.food.toLowerCase()).join(' and ')}. Try them separately to compare their flavours.` : `Both are ${source.style.replaceAll('_',' ')} ${source.family} options. Try them separately to compare their flavours.`,
      examples:[] as string[],tags:[] as string[],pairing_kind:'alternative',eligible:sameStyle||shared.length>0};
  }).filter(item=>item.eligible).sort((a,b)=>b.score-a.score);
  return [...direct,...related.slice(0,Math.max(0,limit-direct.length))];
}

export function topContextPairings(query: ContextQuery, limit = 8) {
  const negativeMood = query.mood ? shouldOfferNonAlcoholic(query.mood) : false;

  return BAR_PAIRINGS.context_pairings
    .map((item) => {
      const context = item.context as unknown as Record<string, string | undefined>;
      const wanted = Object.entries(query).filter(([key, value]) => key !== 'mood' && Boolean(value));
      const matches = wanted.filter(([key, value]) => context[key] === value).length;
      const conflicts = wanted.filter(([key, value]) => context[key] && context[key] !== value).length;
      const profile = beverageProfile(item.beverage);
      const isNonAlcoholic = profile?.abv_class === 'non_alcoholic';
      const moodBonus = negativeMood && isNonAlcoholic ? 8 : 0;
      return {
        ...item,
        score: Math.max(0, Math.min(100, item.score + matches * 3 - conflicts * 12 + moodBonus)),
        band: pairingBand(Math.max(0, Math.min(100, item.score + matches * 3 - conflicts * 12 + moodBonus))),
        isNonAlcoholic
      };
    })
    .filter((item) => item.score >= 45)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}

export function topCigarPairings(body: 'mild' | 'medium' | 'full', note: string, limit = 8) {
  return findCigarPairings(body, note).slice(0, limit).map((item) => ({
    ...item,
    band: pairingBand(item.score)
  }));
}

export function recommendationPrompts() {
  return BAR_PAIRINGS.a0_dialogue_prompts.flatMap((group) =>
    group.a0.map((prompt) => ({ slot: group.slot, prompt }))
  );
}

export function needsNonAlcoholicOption(mood: string) {
  return shouldOfferNonAlcoholic(mood);
}
