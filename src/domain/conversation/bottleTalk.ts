import { ALCOHOL_PRODUCTS, ALCOHOL_TYPE_LABELS, bottleTotal } from '../bottleCatalog';
import type { AlcoholProduct, AlcoholType, BottleOccasion, BottleRequest, Customer } from '../types';
import type { CustomerReply } from './customerTalk';

const BOTTLE_TASTE_WORDS = new Set(ALCOHOL_PRODUCTS.flatMap((product) => product.tastes.flatMap((taste) => taste.toLowerCase().split(/\s+/))));

export interface BottleConversationFacts {
  quantity?: number;
  budget?: number;
  type?: AlcoholType;
  tastes?: string[];
  occasion?: BottleOccasion;
  preferredBrand?: string;
}

export interface BottleRecommendation {
  product: AlcoholProduct;
  score: number;
  reasons: string[];
  overBudget: boolean;
}

export interface BottleReply extends CustomerReply {
  bottleFacts?: Partial<BottleConversationFacts>;
  selectedBottleId?: string;
}

const normalize = (text: string) => text.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/&/g, ' and ').replace(/[^a-z0-9]+/g, ' ').trim();
const wordsOf = (text: string) => normalize(text).split(/\s+/).filter(Boolean);

// Words that do not identify a brand on their own (“Would you like Yellow?” is not a bottle).
const GENERIC_WORDS = new Set(['the', 'and', 'original', 'yellow', 'label', 'black', 'white', 'red', 'blue', 'green', 'gold', 'silver', 'dark', 'light', 'club', 'reserve', 'special',
  'old', 'number', 'seven', 'twenty', 'one', 'irish', 'whiskey', 'whisky', 'vodka', 'gin', 'rum', 'beer', 'wine', 'sparkling', 'extra', 'dry', 'premium', 'classic', 'blanca', 'carta',
  'london', 'cream', 'liqueur', 'tequila', 'bianco', 'rosso', 'brut', 'imperial', 'fresh', 'zero', 'free', 'alcohol', 'lager', 'cider', 'soda']);

export function findBottleMention(text: string, products: AlcoholProduct[] = ALCOHOL_PRODUCTS) {
  const haystack = ` ${normalize(text)} `;
  const byLength = [...products].sort((a, b) => b.name.length - a.name.length);
  // 1) Full product or brand names.
  const full = byLength.find((product) => {
    const names = [product.name, product.brand, product.name.replace(/old no\.? 7/i, 'old number seven')];
    return names.some((name) => haystack.includes(` ${normalize(name)} `));
  });
  if (full) return full;
  // 2) A distinctive word of the brand (“Clicquot”, “Daniels”, “Goose”) — only if it points to one brand.
  const words = new Set(wordsOf(text));
  const matches = byLength.filter((product) => wordsOf(product.brand).some((word) => word.length >= 4 && !GENERIC_WORDS.has(word) && words.has(word)));
  return new Set(matches.map((product) => product.brand)).size === 1 ? matches[0] : undefined;
}

export function scoreBottle(product: AlcoholProduct, facts: BottleConversationFacts, marketFactor = 1): BottleRecommendation {
  const reasons: string[] = [];
  let earned = product.popularity / 20;
  let possible = 5;
  const quantity = facts.quantity ?? 1;
  const total = bottleTotal(product, quantity, marketFactor);
  let overBudget = false;
  if (facts.budget !== undefined) {
    possible += 25;
    if (total <= facts.budget) { earned += 25; reasons.push(`within ${facts.budget} coin budget`); }
    else overBudget = true;
  }
  if (facts.type) {
    possible += 30;
    if (product.type === facts.type) { earned += 30; reasons.push(ALCOHOL_TYPE_LABELS[product.type]); }
  }
  if (facts.tastes?.length) {
    possible += 25;
    const matches = facts.tastes.filter((taste) => product.tastes.includes(taste));
    earned += 25 * (matches.length / facts.tastes.length);
    if (matches.length) reasons.push(matches.join(' + '));
  }
  if (facts.occasion) {
    possible += 10;
    if (product.occasions.includes(facts.occasion)) { earned += 10; reasons.push(`good for a ${facts.occasion}`); }
  }
  if (facts.preferredBrand) {
    possible += 30;
    if (normalize(product.brand) === normalize(facts.preferredBrand)) { earned += 30; reasons.push('preferred brand'); }
  }
  const score = Math.round((earned / possible) * 100);
  return { product, score: overBudget ? Math.min(score, 59) : score, reasons, overBudget };
}

export function rankBottles(facts: BottleConversationFacts, marketFactor = 1, products: AlcoholProduct[] = ALCOHOL_PRODUCTS) {
  // Once the customer has named the type they want, other types are not suggestions.
  return products.filter((product) => !facts.type || product.type === facts.type).map((product) => scoreBottle(product, facts, marketFactor)).sort((a, b) =>
    Number(a.overBudget) - Number(b.overBudget) || b.score - a.score || b.product.popularity - a.product.popularity || a.product.price - b.product.price
  );
}

export function bottleMatchesRequest(product: AlcoholProduct, request: BottleRequest, marketFactor = 1) {
  if (bottleTotal(product, request.quantity, marketFactor) > request.budget) return false;
  if (product.type !== request.type) return false;
  if (request.preferredBrand && normalize(product.brand) !== normalize(request.preferredBrand)) return false;
  const tasteMatches = request.tastes.filter((taste) => product.tastes.includes(taste)).length;
  return tasteMatches >= Math.max(1, Math.ceil(request.tastes.length / 2));
}

export function bottleOpeningLine(customer: Customer) {
  const occasion = customer.bottleRequest?.occasion ?? 'party';
  return `${customer.greeting} I need some sealed bottles for a ${occasion}. Can you help me choose?`;
}

export function bottleQuestionTemplates(facts: BottleConversationFacts, recommendations: BottleRecommendation[]) {
  const questions = [
    !facts.quantity && 'How many bottles do you need?',
    facts.budget === undefined && 'What is your total budget?',
    !facts.type && 'Which type of alcohol do you prefer?',
    !facts.tastes?.length && 'Which flavours do you prefer?',
    !facts.occasion && 'Is it for a gift or a party?',
    facts.preferredBrand === undefined && 'Do you have a favourite brand?'
  ].filter((text): text is string => !!text).map((text) => ({ text }));
  const guesses = recommendations.slice(0, 3).map(({ product }) => ({ text: `Would you like ${product.name}?` }));
  return Object.keys(facts).length >= 3 ? [...guesses, ...questions] : [...questions, ...guesses];
}

export function bottleFactChips(facts: BottleConversationFacts) {
  return [
    facts.quantity && `${facts.quantity} bottle${facts.quantity === 1 ? '' : 's'}`,
    facts.budget !== undefined && `up to ${facts.budget} coins`,
    facts.type && ALCOHOL_TYPE_LABELS[facts.type],
    ...(facts.tastes ?? []),
    facts.occasion && `for a ${facts.occasion}`,
    facts.preferredBrand && facts.preferredBrand
  ].filter((value): value is string => !!value);
}

export function replyToBottle(text: string, customer: Customer, facts: BottleConversationFacts, marketFactor = 1): BottleReply {
  const request = customer.bottleRequest;
  if (!request) return { text:'I am looking for a cocktail, not a bottle.',expression:'confused',facts:[] };
  const words = wordsOf(text);
  const offered = findBottleMention(text);
  if (offered) {
    if (bottleMatchesRequest(offered, request, marketFactor)) {
      const total = bottleTotal(offered, request.quantity, marketFactor);
      return { text:`Yes, ${request.quantity} bottle${request.quantity === 1 ? '' : 's'} of ${offered.name} fit perfectly. ${total} coins is within my budget.`,expression:'very-happy',facts:[],confirmed:true,selectedBottleId:offered.id };
    }
    const total = bottleTotal(offered, request.quantity, marketFactor);
    const reason = total > request.budget ? `That would cost ${total} coins, which is over my budget.`
      : offered.type !== request.type ? `I would prefer ${ALCOHOL_TYPE_LABELS[request.type].toLowerCase()}.`
        : request.preferredBrand && normalize(offered.brand) !== normalize(request.preferredBrand) ? `I am looking for ${request.preferredBrand}.`
          : `I want something ${request.tastes.join(' and ')}.`;
    return { text:`Not this one, please. ${reason}`,expression:'disappointed',facts:[],wrongGuess:true };
  }
  if ((words.includes('how') && words.includes('many')) || words.includes('quantity')) {
    return { text:`I need ${request.quantity} sealed bottle${request.quantity === 1 ? '' : 's'}.`,expression:'smile',facts:[],bottleFacts:{quantity:request.quantity} };
  }
  if (words.includes('budget') || words.includes('spend') || (words.includes('how') && words.includes('much'))) {
    return { text:`My total budget is ${request.budget} coins.`,expression:'smile',facts:[],bottleFacts:{budget:request.budget} };
  }
  if (words.includes('brand')) {
    const answer = request.preferredBrand ? `I prefer ${request.preferredBrand}.` : 'I do not have a favourite brand.';
    return { text:answer,expression:'thinking',facts:[],bottleFacts:{preferredBrand:request.preferredBrand ?? ''} };
  }
  if (words.includes('type') || words.includes('alcohol') || words.some((word) => ['whiskey','bourbon','liqueur','champagne','vodka','gin','rum','tequila','aperitif','vermouth','port','cognac','brandy','beer','soju','sake','cider','sambuca','sangria','infusion','tincture','nastoyka','настойка','настойки','fruit','herbal','specialty','curacao','curaçao','alcohol-free'].includes(word))) {
    return { text:`I would prefer ${ALCOHOL_TYPE_LABELS[request.type].toLowerCase()}.`,expression:'smile',facts:[],bottleFacts:{type:request.type} };
  }
  if (words.includes('gift') || words.includes('party') || words.includes('occasion') || (words.includes('what') && words.includes('for'))) {
    return { text:`It is for a ${request.occasion}.`,expression:'smile',facts:[],bottleFacts:{occasion:request.occasion} };
  }
  if (words.some((word) => ['flavour','flavours','flavor','taste','tastes'].includes(word) || BOTTLE_TASTE_WORDS.has(word))) {
    return { text:`I prefer something ${request.tastes.join(' and ')}.`,expression:'happy',facts:[],bottleFacts:{tastes:[...request.tastes]} };
  }
  if (words.includes('recommend') || words.includes('suggest') || words.includes('which') || words.includes('what')) {
    if (facts.quantity === undefined) return { text:'Please ask how many bottles I need.',expression:'thinking',facts:[] };
    if (facts.budget === undefined) return { text:'Please ask about my total budget.',expression:'thinking',facts:[] };
    return { text:'Please show me the bottles that match what you know.',expression:'smile',facts:[] };
  }
  return { text:'Please ask about quantity, budget, alcohol type, flavour, occasion or brand.',expression:'confused',facts:[] };
}
