// Cocktail guides: history, preparation (and the reason behind each step), variations and when to choose each drink.
// Written in clear B1 English. Where a history is disputed, the guide says so instead of repeating one legend as fact.

export interface CocktailGuide {
  id: string;
  summary: string;
  timeline: { when: string; what: string }[];
  history: string;
  preparation: { technique: 'shaken' | 'stirred' | 'built' | 'blended'; why: string; glass: string; ice: string; garnish: string; steps: string[] };
  taste: string;
  strength: 'light' | 'medium' | 'strong';
  chooseWhen: string[];
  compare: { other: string; difference: string }[];
  variations: { name: string; change: string }[];
  funFact: string;
}
