// Explains WHY a pairing works by linking it to a flavour principle.
// The pairing data gives a one-line reason; this adds the general rule behind it, an everyday example,
// and a sentence the player can say to a guest (English practice).

export interface PairingPrinciple {
  id: string;
  title: string;
  rule: string;
  explain: string;
  example: string;
  sayIt: string;
}

export const PAIRING_PRINCIPLES: Record<string, PairingPrinciple> = {
  match_intensity: {
    id: 'match_intensity', title: 'Match the intensity',
    rule: 'Light food with light drinks; rich, strong food with rich, strong drinks.',
    explain: 'If one side is much stronger, it hides the other. A delicate fish disappears next to a heavy red wine, and a light beer tastes like water next to a spicy steak. When both have similar “weight”, you can taste both.',
    example: 'Grilled steak + a full red wine · a green salad + a crisp white wine.',
    sayIt: 'This dish is quite rich, so I recommend a fuller drink.'
  },
  acid_cuts_richness: {
    id: 'acid_cuts_richness', title: 'Acidity cuts richness',
    rule: 'Sour, fresh drinks clean your mouth after fatty, creamy or fried food.',
    explain: 'Fat covers your tongue. Acidity (sourness) from citrus, crisp wine or cider makes your mouth water and washes the fat away, so every bite tastes fresh again.',
    example: 'Fish and chips + a crisp white wine or a lemony cocktail.',
    sayIt: 'The lime will refresh your mouth after the fried food.'
  },
  sweetness_rule: {
    id: 'sweetness_rule', title: 'The drink should be as sweet as the dessert',
    rule: 'With desserts, choose a drink at least as sweet as the food.',
    explain: 'Sweet food makes a dry drink taste sour and thin. If the drink is sweeter, both taste good together.',
    example: 'Chocolate cake + a sweet dessert wine or a coffee liqueur drink.',
    sayIt: 'With this dessert, a sweeter drink will taste much better.'
  },
  tannin_and_fat: {
    id: 'tannin_and_fat', title: 'Tannin loves fat and protein',
    rule: 'Tannic red wines (dry, “grippy”) are softened by fatty, protein-rich food.',
    explain: 'Tannin is the dry, rough feeling from red wine skins and strong tea. Protein and fat in steak or aged cheese bind to the tannin, so the wine feels smoother and the meat tastes juicier.',
    example: 'Ribeye steak + Cabernet Sauvignon · aged cheddar + a strong red.',
    sayIt: 'This red wine is perfect with steak — the meat makes it feel smoother.'
  },
  spice_and_alcohol: {
    id: 'spice_and_alcohol', title: 'Be careful with spicy food',
    rule: 'High alcohol and tannin make chilli feel hotter; lighter, aromatic or slightly sweet drinks calm it.',
    explain: 'Alcohol and chilli both “burn”, so together the heat grows. A lower-alcohol, fruity or slightly sweet drink, or a cold beer, cools the mouth instead.',
    example: 'Spicy curry + an off-dry Riesling or a lager, not a strong whiskey.',
    sayIt: 'The food is spicy, so I suggest something lighter and a little sweet.'
  },
  salt_and_bubbles: {
    id: 'salt_and_bubbles', title: 'Salt likes bubbles and acidity',
    rule: 'Sparkling wine, crisp beer and sour drinks are great with salty or fried snacks.',
    explain: 'Bubbles and acidity scrub the tongue clean, and salt makes fruity drinks taste brighter. That is why chips and champagne, or pretzels and beer, work so well.',
    example: 'Salty fries + sparkling wine · nachos + a Paloma.',
    sayIt: 'Something with bubbles goes really well with salty snacks.'
  },
  umami: {
    id: 'umami', title: 'Umami needs soft drinks',
    rule: 'Savoury umami food (mushrooms, soy, parmesan) can make tannic wine taste bitter.',
    explain: 'Umami is the fifth taste — savoury, like soy sauce or parmesan. It makes tannin and bitterness stronger, so softer drinks such as sake, sparkling wine or light reds are safer.',
    example: 'Sushi + sake · mushroom risotto + a light Pinot Noir.',
    sayIt: 'With mushrooms, I recommend a lighter, softer wine.'
  },
  sauce_over_protein: {
    id: 'sauce_over_protein', title: 'Pair with the sauce',
    rule: 'The strongest flavour on the plate — often the sauce — decides the drink, not only the meat or fish.',
    explain: 'Chicken with lemon sauce and chicken with barbecue sauce need different drinks. Look for the loudest flavour on the plate and match that.',
    example: 'Chicken in creamy sauce + a round white wine · chicken with BBQ sauce + a fruity red.',
    sayIt: 'The sauce is sweet and smoky, so a fruity drink will match it.'
  },
  regional_pairing: {
    id: 'regional_pairing', title: 'What grows together goes together',
    rule: 'Food and drinks from the same region often fit — a good starting point, not a law.',
    explain: 'Local drinks developed together with local food for centuries, so they usually match in style and intensity.',
    example: 'Tapas + Spanish cava · Mexican tacos + a Margarita or Paloma.',
    sayIt: 'Both come from the same region, so they are a classic match.'
  },
  complement: {
    id: 'complement', title: 'Similar flavours support each other',
    rule: 'Shared aromas (citrus with citrus, herbs with herbs) build a bridge between food or drinks.',
    explain: 'When two things share a flavour, that flavour becomes stronger and the pairing feels natural — like orange liqueur with an orange dessert, or a herbal gin with fresh herbs.',
    example: 'Herbal gin + a garnish of rosemary · coffee liqueur + chocolate.',
    sayIt: 'They share the same citrus notes, so they go together naturally.'
  },
  contrast: {
    id: 'contrast', title: 'Opposites can balance',
    rule: 'Sweet with salty, bitter with sweet, fresh with rich — a contrast can balance a flavour.',
    explain: 'Sometimes the best partner is the opposite: a bitter drink balances a sweet snack, and a sweet drink softens salty cheese.',
    example: 'Blue cheese + sweet dessert wine · salted nuts + a bitter Negroni.',
    sayIt: 'The bitterness balances the sweetness of the snack.'
  },
  context_fit: {
    id: 'context_fit', title: 'Fit the moment',
    rule: 'Time, place and mood matter: light drinks before dinner, richer drinks after dinner, refreshing drinks when it is hot.',
    explain: 'A great drink at the wrong moment feels wrong. Aperitifs are light and bitter to open the appetite; digestifs are richer and slower. Always offer a non-alcoholic choice too — a drink is never the solution to a bad mood.',
    example: 'Before dinner: Negroni or spritz · after dinner: Old Fashioned or Espresso Martini.',
    sayIt: 'Since it is before dinner, I suggest something light and a little bitter.'
  },
  cigar_intensity: {
    id: 'cigar_intensity', title: 'Match the cigar’s strength',
    rule: 'A mild cigar needs a delicate drink; a full cigar needs a rich, strong drink.',
    explain: 'Cigar smoke is powerful. A light drink disappears beside a full cigar, and a very strong drink hides a mild one. Match the body, then look for shared notes like coffee, wood or caramel.',
    example: 'Full cigar + aged rum or whiskey · mild cigar + light coffee or a soft spirit.',
    sayIt: 'Your cigar is full-bodied, so a rich, aged spirit will match it.'
  }
};

const RULES: { principle: string; words: RegExp }[] = [
  { principle: 'tannin_and_fat', words: /tannin|steak|beef|lamb|protein/i },
  { principle: 'acid_cuts_richness', words: /acid|cuts?|fatty|fried|creamy|richness|fresh(ens)? the palate|cleans?/i },
  { principle: 'sweetness_rule', words: /dessert|as sweet|sweeter than|chocolate|cake/i },
  { principle: 'spice_and_alcohol', words: /spicy|(?<![-\w])spice(?![-\w])|chil+i|\bheat\b|curry/i },
  { principle: 'salt_and_bubbles', words: /salt|bubbl|sparkl|brin|fries|chips/i },
  { principle: 'umami', words: /umami|mushroom|soy|sushi|miso/i },
  { principle: 'sauce_over_protein', words: /sauce|glaze/i },
  { principle: 'regional_pairing', words: /regional|region|tradition|local|same country/i },
  { principle: 'cigar_intensity', words: /cigar|smoke\b|smoking/i },
  { principle: 'contrast', words: /contrast|balance|offset|against|bitter.*sweet|sweet.*bitter/i },
  { principle: 'complement', words: /echo|mirror|shared|same|amplif|complement|bridge|match(es)? .*notes?|botanical|citrus|herbal|aromatic/i },
  { principle: 'match_intensity', words: /intensity|stand up|weight|power|bold|delicate|overwhelm|\bbody\b|elegant/i },
  { principle: 'context_fit', words: /aperitiv|aperitif|digestif|before dinner|after dinner|evening|occasion|setting|context|mood/i }
];

// Best one or two principles behind a pairing's short reason.
// `kind` comes from the advisor tab: cigar and situation pairings always include their own principle.
export function explainPairing(item: { why?: string; relationship?: string }, kind: 'food' | 'drink' | 'context' | 'cigar' = 'food') {
  const text = `${item.why ?? ''} ${item.relationship ?? ''}`;
  const forced = kind === 'cigar' ? [PAIRING_PRINCIPLES.cigar_intensity!] : kind === 'context' ? [PAIRING_PRINCIPLES.context_fit!] : [];
  const found = [...forced, ...RULES.filter((rule) => rule.words.test(text)).map((rule) => PAIRING_PRINCIPLES[rule.principle]!)];
  const unique = [...new Map(found.map((principle) => [principle.id, principle])).values()];
  return unique.length ? unique.slice(0, 2) : [PAIRING_PRINCIPLES.complement!];
}
