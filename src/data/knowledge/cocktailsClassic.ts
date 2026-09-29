import type { CocktailGuide } from './cocktailTypes';

// Rum and tequila classics.
export const CLASSIC_GUIDES: Record<string, CocktailGuide> = {
  mojito: {
    id: 'mojito',
    summary: 'A tall Cuban highball of white rum, lime, sugar, fresh mint and soda — one of the most refreshing drinks in the world.',
    timeline: [
      { when: '16th century', what: 'Sailors in the Caribbean drink “El Draque”: rough cane spirit with lime, sugar and mint. It is often linked to the English explorer Francis Drake.' },
      { when: 'Late 1800s', what: 'Lighter, cleaner Cuban rum replaces the rough spirit.' },
      { when: '1930s', what: 'The name “Mojito” appears in Havana bar guides. It becomes a favourite at La Bodeguita del Medio.' },
      { when: '2000s', what: 'A world-wide revival makes it one of the most ordered cocktails everywhere.' }
    ],
    history: 'The Mojito comes from Cuba. Its ancestor was a medicine-like drink of cane spirit, lime and mint, used by sailors to fight illness and to make strong alcohol easier to drink. When Cuba started producing light, clean rum in the late 19th century, the drink became softer and more elegant. The name may come from “mojo”, a Cuban lime sauce, or from “mojadito” (“a little wet”). Stories say the writer Ernest Hemingway loved it, but historians think this was mostly marketing.',
    preparation: {
      technique: 'built', why: 'It is built directly in the glass because soda is added at the end. Shaking soda would destroy the bubbles.',
      glass: 'Tall highball glass', ice: 'Lots of cubed or crushed ice — the drink is long and should stay very cold.', garnish: 'A fresh mint sprig and a lime wedge',
      steps: ['Press the mint gently with lime and sugar. Only press — do not tear the leaves, or the drink becomes bitter and grassy.', 'Add the rum and fill the glass with ice.', 'Top with soda water.', 'Lift the mint through the drink with a spoon so the flavour spreads.']
    },
    taste: 'Fresh, citrusy, lightly sweet and herbal, with soft bubbles.', strength: 'light',
    chooseWhen: ['The guest wants something fresh and cool', 'A hot evening or a first drink of the night', 'The guest is new to cocktails'],
    compare: [{ other: 'Daiquiri', difference: 'Same base (rum, lime, sugar), but the Daiquiri has no mint and no soda: it is shorter, stronger and sharper.' }, { other: 'Moscow Mule', difference: 'Also long and fizzy, but spicy from ginger instead of herbal from mint.' }],
    variations: [{ name: 'Virgin Mojito', change: 'No rum — a great non-alcoholic choice.' }, { name: 'Royal Mojito', change: 'Sparkling wine instead of soda.' }, { name: 'Strawberry Mojito', change: 'Fresh strawberries pressed with the mint.' }],
    funFact: 'Pressing mint too hard releases chlorophyll, which tastes bitter. Good bartenders “wake up” the mint instead of smashing it.'
  },
  daiquiri: {
    id: 'daiquiri',
    summary: 'The purest rum sour: white rum, fresh lime and sugar, shaken and served cold. Simple, sharp and elegant.',
    timeline: [
      { when: 'Around 1900', what: 'American mining engineers near the village of Daiquirí in eastern Cuba mix local rum with lime and sugar.' },
      { when: '1909', what: 'US Navy officer Lucius Johnson brings the recipe to the Army and Navy Club in Washington, D.C.' },
      { when: '1920s–1930s', what: 'Bartender Constantino Ribalaigua perfects it at El Floridita in Havana. Frozen versions appear.' },
      { when: 'Today', what: 'Bartenders use the classic Daiquiri to test a new bar: it is simple, so every mistake shows.' }
    ],
    history: 'The Daiquiri is named after a beach and iron mine in Cuba. The idea — spirit, citrus and sugar — is very old; sailors drank similar mixes for centuries. The engineer Jennings Cox is often named as its creator around 1900. The drink became famous in Havana’s El Floridita bar, where the frozen, blended version was also developed. Later, sweet frozen “daiquiris” from machines gave it a bad name, but the classic shaken version is a respected bartender favourite again.',
    preparation: {
      technique: 'shaken', why: 'Drinks with citrus juice are shaken: shaking mixes the juice fully, cools the drink fast and adds a little air for a lively texture.',
      glass: 'Chilled coupe', ice: 'Shaken with ice, served without ice (“straight up”).', garnish: 'A thin lime wheel, or nothing',
      steps: ['Add rum, lime juice and sugar syrup to a shaker.', 'Fill with ice and shake hard for about ten seconds.', 'Strain into a cold coupe.']
    },
    taste: 'Clean, sharp and refreshing. You taste the rum clearly, balanced by sour lime and a little sugar.', strength: 'medium',
    chooseWhen: ['The guest likes sour, clean flavours', 'The guest wants to taste the rum', 'A short, elegant drink before dinner'],
    compare: [{ other: 'Mojito', difference: 'The Mojito is longer, sweeter and softer with mint and soda.' }, { other: 'Margarita', difference: 'Same sour family, but with tequila and orange liqueur instead of rum and sugar.' }],
    variations: [{ name: 'Hemingway Daiquiri', change: 'Less sugar, plus grapefruit and maraschino liqueur.' }, { name: 'Frozen Daiquiri', change: 'Blended with crushed ice.' }, { name: 'Strawberry Daiquiri', change: 'Blended with fresh strawberries.' }],
    funFact: 'Bartenders call the Daiquiri “the handshake” of the bar world: it is often the first drink one bartender makes for another.'
  },
  margarita: {
    id: 'margarita',
    summary: 'Tequila, orange liqueur and lime, shaken and served with a salted rim. The most famous tequila cocktail.',
    timeline: [
      { when: '1930s', what: 'American bars serve the “Tequila Daisy”, a sour with orange liqueur. “Margarita” is Spanish for “daisy”.' },
      { when: '1938–1948', what: 'Several bartenders in Mexico and Texas claim to invent the Margarita. No claim is proven.' },
      { when: '1971', what: 'Mariano Martinez in Dallas builds the first frozen margarita machine.' },
      { when: 'Today', what: 'One of the most ordered cocktails in the United States.' }
    ],
    history: 'Nobody knows exactly who invented the Margarita. The most likely story is simple: it is a “Daisy” — an old type of drink with spirit, citrus and orange liqueur — made with tequila, and “margarita” is simply Spanish for daisy. Popular legends name Carlos “Danny” Herrera, who made it for a dancer called Marjorie King, and the socialite Margaret Sames in Acapulco. In 1971 the frozen margarita machine made it a party drink across America.',
    preparation: {
      technique: 'shaken', why: 'Shaken because it contains lime juice. The salt goes on only half the rim, so the guest can choose salty or not.',
      glass: 'Coupe or rocks glass', ice: 'Served straight up, or over fresh ice in a rocks glass.', garnish: 'Salt on half the rim, lime wheel',
      steps: ['Wet half the rim with lime and dip it in salt.', 'Shake tequila, orange liqueur and lime juice hard with ice.', 'Strain into the glass.']
    },
    taste: 'Tart, bright and citrusy, with earthy agave from the tequila. Salt makes the flavours stronger and less sour.', strength: 'strong',
    chooseWhen: ['The guest likes tequila or sour drinks', 'A party or a Mexican dinner', 'The guest likes a salty-sour contrast'],
    compare: [{ other: 'Paloma', difference: 'Also tequila, but long and fizzy with grapefruit — lighter and easier to drink.' }, { other: 'Daiquiri', difference: 'Same sour idea with rum; no salt and no orange liqueur.' }],
    variations: [{ name: 'Tommy’s Margarita', change: 'Agave syrup instead of orange liqueur.' }, { name: 'Frozen Margarita', change: 'Blended with ice.' }, { name: 'Spicy Margarita', change: 'Fresh chilli or jalapeño added.' }],
    funFact: 'Salt does not only taste salty — a little salt reduces bitterness and makes sweet and sour flavours feel brighter.'
  },
  'pina-colada': {
    id: 'pina-colada',
    summary: 'Rum, pineapple and coconut cream: sweet, creamy and tropical. The national drink of Puerto Rico.',
    timeline: [
      { when: 'Early 1950s', what: 'Ramón López Irizarry develops Coco López, a ready-made cream of coconut, in Puerto Rico.' },
      { when: '1954', what: 'The Caribe Hilton hotel in San Juan says its bartender Ramón “Monchito” Marrero created the drink.' },
      { when: '1978', what: 'Puerto Rico makes the Piña Colada its national drink.' },
      { when: '1979', what: 'The song “Escape (The Piña Colada Song)” makes it world-famous.' }
    ],
    history: '“Piña colada” means “strained pineapple” in Spanish. Pineapple drinks with rum existed in the Caribbean for a long time, but the modern Piña Colada needed one new product: sweet cream of coconut in a can, invented in Puerto Rico in the 1950s. Two San Juan bars — the Caribe Hilton and Barrachina — both claim to have made the first one. Whoever was first, the drink became a symbol of beach holidays.',
    preparation: {
      technique: 'shaken', why: 'Shaken hard (or blended) because coconut cream is thick. Strong shaking makes it smooth and a little foamy.',
      glass: 'Hurricane or tall glass', ice: 'Crushed ice, or blended with ice', garnish: 'Pineapple wedge (and a cherry)',
      steps: ['Add rum, pineapple juice and coconut cream to a shaker.', 'Shake very hard with ice.', 'Pour into a tall glass with crushed ice.', 'Garnish with a pineapple wedge.']
    },
    taste: 'Sweet, creamy and tropical. Very soft — you hardly notice the alcohol.', strength: 'light',
    chooseWhen: ['The guest wants something sweet or like a dessert', 'Holiday mood or a summer party', 'The guest does not like sour or bitter drinks'],
    compare: [{ other: 'Mai Tai', difference: 'Also tropical rum, but not creamy — sharper, stronger and more complex.' }, { other: 'Mojito', difference: 'Fresh and light instead of sweet and creamy.' }],
    variations: [{ name: 'Virgin Colada', change: 'No rum.' }, { name: 'Chi Chi', change: 'Vodka instead of rum.' }, { name: 'Painkiller', change: 'Dark rum, orange juice and nutmeg.' }],
    funFact: '“Cream of coconut” (sweet) and “coconut cream” (not sweet) are different products — using the wrong one changes the drink completely.'
  },
  'mai-tai': {
    id: 'mai-tai',
    summary: 'Rum, lime and orange liqueur with almond sweetness, served over crushed ice with mint. The star of tiki culture.',
    timeline: [
      { when: '1933', what: 'Donn Beach opens a Polynesian-style bar in Hollywood and starts the tiki trend.' },
      { when: '1944', what: 'Victor “Trader Vic” Bergeron creates the Mai Tai at his bar in Oakland, California.' },
      { when: '1950s–1960s', what: 'Tiki bars spread across America; the Mai Tai reaches Hawaii and becomes world-famous.' }
    ],
    history: 'The Mai Tai belongs to “tiki” culture: bars decorated like Pacific islands, with exotic rum drinks. Trader Vic said he made the first one in 1944 for friends from Tahiti, who cried “Maita’i roa ae!” — “Out of this world, the best!”. His rival Donn Beach claimed an earlier, similar drink. The original is not a fruity punch but a sharp, rum-focused sour with orange and almond syrup (orgeat).',
    preparation: {
      technique: 'shaken', why: 'Shaken because of the lime juice, then poured over crushed ice, which keeps it very cold.',
      glass: 'Rocks or tiki glass', ice: 'Crushed ice', garnish: 'A big mint sprig and a lime shell',
      steps: ['Shake rum, lime, orange liqueur and sweetener with ice.', 'Pour over crushed ice.', 'Garnish with a big mint sprig — you smell it every time you drink.']
    },
    taste: 'Tropical, rich and rum-forward, with lime, orange and nutty sweetness.', strength: 'strong',
    chooseWhen: ['The guest loves rum', 'A tiki night or summer party', 'An adventurous guest'],
    compare: [{ other: 'Piña Colada', difference: 'Also tropical, but the Piña Colada is creamy, sweeter and lighter.' }, { other: 'Daiquiri', difference: 'A simpler, lighter rum sour without orange or almond.' }],
    variations: [{ name: 'Royal Hawaiian Mai Tai', change: 'Pineapple and orange juice — fruitier and lighter.' }],
    funFact: 'Mint in tiki drinks is mostly for the nose: aroma is a big part of taste.'
  },
  paloma: {
    id: 'paloma',
    summary: 'Tequila, lime and grapefruit soda with a pinch of salt. Mexico’s favourite tequila drink — simpler and lighter than a Margarita.',
    timeline: [
      { when: '1950s', what: 'Grapefruit sodas like Squirt become popular in Mexico.' },
      { when: 'Mid-20th century', what: 'People in Jalisco mix tequila with grapefruit soda. The bar La Capilla in the town of Tequila is often linked to it, but the true origin is unknown.' },
      { when: 'Today', what: 'In Mexico it is ordered more often than the Margarita.' }
    ],
    history: '“Paloma” means “dove” in Spanish. There is no clear inventor: it is a people’s drink that grew naturally when grapefruit soda arrived in Mexico. Its popularity comes from simplicity — two ingredients, a squeeze of lime and a little salt — and from how well sour-bitter grapefruit fits the earthy taste of agave.',
    preparation: {
      technique: 'built', why: 'Built in the glass because grapefruit soda is fizzy. A pinch of salt makes the grapefruit taste brighter and less bitter.',
      glass: 'Highball glass (often with a salt rim)', ice: 'Filled with ice', garnish: 'Grapefruit or lime wedge',
      steps: ['Salt the rim (optional).', 'Fill the glass with ice.', 'Add tequila and lime juice.', 'Top with grapefruit soda and stir gently.']
    },
    taste: 'Tart, lightly bitter and refreshing, with fizzy grapefruit and earthy tequila.', strength: 'light',
    chooseWhen: ['The guest likes tequila but wants something lighter', 'A hot day or a long evening', 'The guest likes grapefruit or tart flavours'],
    compare: [{ other: 'Margarita', difference: 'Same tequila and lime, but the Margarita is short, strong and not fizzy.' }, { other: 'Moscow Mule', difference: 'Also long and fizzy, but spicy ginger and vodka.' }],
    variations: [{ name: 'Fresh Paloma', change: 'Fresh grapefruit juice and soda water instead of grapefruit soda.' }, { name: 'Mezcal Paloma', change: 'Smoky mezcal instead of tequila.' }],
    funFact: 'In Mexico it is often served in a “cantarito”, a clay cup that keeps the drink cold.'
  }
};
