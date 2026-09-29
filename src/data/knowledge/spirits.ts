// Guides for every ingredient: what it is, how it is made, where it comes from and how bartenders use it.

export interface IngredientGuide {
  id: string;
  kind: 'spirit' | 'liqueur' | 'wine' | 'mixer' | 'fresh' | 'garnish';
  summary: string;
  madeFrom?: string;
  howMade?: string;
  origin?: string;
  history: string;
  styles?: { name: string; note: string }[];
  flavour: string;
  abv?: string;
  howToUse: string;
  sellingTip: string;
  funFact: string;
}

export const SPIRIT_GUIDES: Record<string, IngredientGuide> = {
  'white-rum': {
    id: 'white-rum', kind: 'spirit', summary: 'A light, clean rum made from sugar cane. The base of the Mojito and Daiquiri.',
    madeFrom: 'Molasses (the thick, dark syrup left after making sugar) or fresh sugar-cane juice.',
    howMade: 'The molasses is fermented with yeast into a low-alcohol “wash”, then distilled. White rum is aged only a short time (often in steel or old barrels) and usually filtered to remove colour.',
    origin: 'The Caribbean, especially Cuba, Puerto Rico and Barbados.',
    history: 'Rum was born on Caribbean sugar plantations in the 1600s, made from waste molasses. It was sailors’ drink, trade money and, sadly, part of the slave trade. In the 1800s Cuban producers created a lighter, filtered style that changed cocktail history: it made drinks like the Daiquiri and Mojito possible.',
    styles: [{ name: 'Spanish style', note: 'Light and dry (Cuba, Puerto Rico).' }, { name: 'Rhum agricole', note: 'From fresh cane juice — grassy and fresh (Martinique).' }],
    flavour: 'Light, clean and slightly sweet, with notes of sugar cane, vanilla and tropical fruit.', abv: 'Usually 37.5–40% alcohol',
    howToUse: 'Perfect with citrus, mint and fruit. Use it when you want freshness, not a heavy rum taste.',
    sellingTip: 'For a customer making Mojitos or Daiquiris at home, a white rum is the right choice — dark rum would change the taste and colour.',
    funFact: 'In the British Royal Navy, sailors received a daily rum ration until 1970. The last day is still called “Black Tot Day”.'
  },
  'dark-rum': {
    id: 'dark-rum', kind: 'spirit', summary: 'Rum aged in wooden barrels (sometimes with added caramel), with a rich, sweet, spicy taste.',
    madeFrom: 'Molasses from sugar cane.',
    howMade: 'Distilled like white rum, then aged for years in oak barrels (often old bourbon barrels). The wood gives colour and flavours of vanilla, caramel and spice. In the hot Caribbean climate rum ages much faster than whisky in Scotland.',
    origin: 'Jamaica, Barbados, Guyana and other Caribbean countries.',
    history: 'Aged rum grew from the long sea journeys of the 18th century: rum stored in barrels on ships became darker and smoother. Jamaica became famous for strong, fruity “funky” rums, Guyana for rich Demerara rum. Today premium aged rums are sipped like fine whisky.',
    styles: [{ name: 'Jamaican', note: 'Bold, fruity, “funky”.' }, { name: 'Demerara (Guyana)', note: 'Rich, dark and caramel-like.' }, { name: 'Spiced rum', note: 'Rum with added spices like vanilla and cinnamon.' }],
    flavour: 'Rich and warm: caramel, vanilla, dried fruit, banana and spice.', abv: '40% alcohol or more',
    howToUse: 'Great in tiki drinks (Mai Tai), in a Rum Old Fashioned, or simply with ice.',
    sellingTip: 'A good gift bottle: recommend an aged rum to customers who like whisky or sweet, warm flavours.',
    funFact: 'The age on a rum bottle can mean different things in different countries — always read the label.'
  },
  gin: {
    id: 'gin', kind: 'spirit', summary: 'A spirit flavoured with juniper berries and other botanicals (plants, herbs, citrus peel). The base of the Martini and G&T.',
    madeFrom: 'A neutral grain spirit, re-distilled with juniper and other botanicals such as coriander, citrus peel and angelica root.',
    howMade: 'The neutral spirit is distilled again with the botanicals, either soaking in the spirit or hanging in a basket in the steam, which picks up their aromas. By law, juniper must be the main flavour.',
    origin: 'The Netherlands (genever) and England (London dry gin).',
    history: 'Gin comes from Dutch “genever”, a juniper spirit sold as medicine in the 1600s. British soldiers brought it home, and in the 1700s London suffered the “Gin Craze”, when cheap gin caused huge social problems. Better distilling in the 1800s created clean “London dry gin”, perfect for the new cocktails. Since the 2010s thousands of small “craft” gins have appeared.',
    styles: [{ name: 'London dry', note: 'Dry, juniper-forward, nothing added after distilling.' }, { name: 'Old Tom', note: 'Slightly sweet, historic style.' }, { name: 'Contemporary', note: 'Less juniper, more citrus, flowers or local herbs.' }],
    flavour: 'Piney juniper, fresh citrus, herbs and spice.', abv: '37.5–47% alcohol',
    howToUse: 'Stirred in a Martini or Negroni, long with tonic, or shaken with lemon in a French 75.',
    sellingTip: 'Ask what the customer will mix it with: a classic London dry for G&T and Martinis, a floral or citrus gin for fruity drinks.',
    funFact: '“London dry” is a style, not a place — it can be made anywhere in the world.'
  },
  vodka: {
    id: 'vodka', kind: 'spirit', summary: 'A clear, neutral spirit with very little taste — the most mixable spirit in the bar.',
    madeFrom: 'Usually grain (wheat, rye) or potatoes; sometimes grapes, corn or sugar beet.',
    howMade: 'Distilled many times to a very high strength, then filtered (often through charcoal) and diluted with water. The goal is a clean, smooth spirit.',
    origin: 'Poland and Russia both claim it — the history goes back to at least the 1400s.',
    history: 'The name means “little water”. For centuries vodka was the everyday spirit of Eastern Europe. After the Second World War, clever marketing (like the Moscow Mule) made it hugely popular in the USA, where people liked a strong drink without a strong taste. Today it is one of the best-selling spirits in the world.',
    styles: [{ name: 'Grain vodka', note: 'Clean, sometimes slightly sweet or spicy (rye).' }, { name: 'Potato vodka', note: 'Creamier and rounder.' }, { name: 'Flavoured vodka', note: 'Citrus, vanilla, berries…' }],
    flavour: 'Neutral and clean; good vodkas feel smooth, with a light sweetness or grainy note.', abv: 'Usually 37.5–40% alcohol',
    howToUse: 'Carries other flavours without changing them: Cosmopolitan, Moscow Mule, Espresso Martini.',
    sellingTip: 'For cocktails a mid-price vodka is fine; recommend premium vodka to customers who drink it cold and neat.',
    funFact: 'Good vodka is often kept in the freezer: it does not freeze because of the alcohol, and it becomes thick and smooth.'
  },
  tequila: {
    id: 'tequila', kind: 'spirit', summary: 'A Mexican spirit made from the blue agave plant. The base of the Margarita and Paloma.',
    madeFrom: 'The heart (“piña”) of the blue Weber agave, a plant that grows for 6–8 years before harvest.',
    howMade: 'The agave hearts are cooked to turn their starch into sugar, crushed, fermented and distilled twice. It can only be made in Jalisco and a few other Mexican regions.',
    origin: 'Mexico — the town of Tequila in Jalisco.',
    history: 'Indigenous people in Mexico made a fermented agave drink, pulque, long before the Spanish arrived. In the 1500s the Spanish brought distillation, and agave spirits were born. The Cuervo and Sauza families built the first big distilleries in the 1700s–1800s. Tequila has a protected designation of origin, like champagne.',
    styles: [{ name: 'Blanco', note: 'Unaged — fresh, peppery agave.' }, { name: 'Reposado', note: 'Rested 2–12 months in oak — softer.' }, { name: 'Añejo', note: 'Aged 1–3 years — rich, for sipping.' }],
    flavour: 'Earthy, peppery, green and citrusy; aged versions add vanilla and caramel.', abv: '35–55% alcohol (usually 38–40%)',
    howToUse: 'Blanco with lime and salt in a Margarita or Paloma; reposado or añejo for sipping.',
    sellingTip: 'Recommend “100% agave” tequila — cheaper “mixto” tequila can contain up to 49% other sugars.',
    funFact: 'Real tequila never has a worm in the bottle — that is a marketing trick of some mezcals.'
  },
  whiskey: {
    id: 'whiskey', kind: 'spirit', summary: 'A spirit made from grain and aged in wooden barrels. The base of the Old Fashioned and Whiskey Sour.',
    madeFrom: 'Grains such as barley, corn, rye or wheat.',
    howMade: 'The grain is mashed and fermented into a kind of beer, distilled, then aged in oak barrels for years. The barrel gives most of the colour and flavour.',
    origin: 'Ireland and Scotland, later the USA, Canada and Japan.',
    history: 'Monks in Ireland and Scotland distilled “uisce beatha” — “water of life” — in the Middle Ages; the word “whisky” comes from it. Scottish whisky became famous around the world in the 1800s. In the USA, farmers made corn-based bourbon, which must be aged in new charred oak barrels. Japan began making whisky in the 1920s and now wins world prizes.',
    styles: [{ name: 'Scotch', note: 'From Scotland; sometimes smoky (peat).' }, { name: 'Bourbon', note: 'American, mostly corn — sweet vanilla and caramel.' }, { name: 'Rye', note: 'Spicier and drier.' }, { name: 'Irish', note: 'Often smooth and light.' }],
    flavour: 'Warm and rich: caramel, vanilla, oak and spice; smoky in some Scotch whiskies.', abv: '40% alcohol or more',
    howToUse: 'Stirred in an Old Fashioned, shaken with lemon in a Whiskey Sour, or neat with a little water.',
    sellingTip: 'Ask how the customer drinks it: bourbon for cocktails, a single malt as a gift for a whisky lover.',
    funFact: 'Scotland and Canada write “whisky”; Ireland and the USA usually write “whiskey”.'
  },
  'orange-liqueur': {
    id: 'orange-liqueur', kind: 'liqueur', summary: 'A sweet liqueur flavoured with orange peel (triple sec, Cointreau, Grand Marnier).',
    madeFrom: 'Neutral spirit (or brandy) with sweet and bitter orange peels and sugar.',
    howMade: 'Dried orange peels are soaked in spirit and distilled, then sugar is added. Some brands use cognac as the base.',
    origin: 'France and the Dutch Caribbean island of Curaçao.',
    history: 'Dutch traders on Curaçao used the bitter local oranges to make liqueur in the 1600s–1800s. In France, “triple sec” and Cointreau (1875) and Grand Marnier (1880) made orange liqueur a key cocktail ingredient.',
    styles: [{ name: 'Triple sec', note: 'Clear, bright orange.' }, { name: 'Curaçao', note: 'The original; sometimes coloured blue.' }, { name: 'Cognac-based', note: 'Richer and warmer.' }],
    flavour: 'Sweet, fresh orange peel.', abv: '15–40% alcohol',
    howToUse: 'Adds sweetness and orange aroma in Margaritas, Cosmopolitans, Mai Tais and Long Islands.',
    sellingTip: 'A customer making Margaritas needs orange liqueur — suggest it together with tequila.',
    funFact: 'Blue Curaçao tastes exactly like orange Curaçao — the blue is only food colouring.'
  },
  vermouth: {
    id: 'vermouth', kind: 'wine', summary: 'A wine flavoured with herbs and spices and made stronger with a little spirit. Used in the Martini and Negroni.',
    madeFrom: 'White wine, a little brandy or spirit, sugar, and botanicals such as wormwood, citrus peel and spices.',
    howMade: 'The wine is flavoured with herbs, fortified with spirit (to about 15–18%), and sweetened. Sweet vermouth gets colour from caramel.',
    origin: 'Turin, Italy (sweet) and Chambéry, France (dry).',
    history: 'Herbal wines are ancient, but modern vermouth was created in Turin in 1786 by Antonio Benedetto Carpano. Its name comes from the German “Wermut” — wormwood. Vermouth was the first “aperitif” culture, and in the 1800s it became essential in cocktails.',
    styles: [{ name: 'Dry (French)', note: 'Pale and dry — for Martinis.' }, { name: 'Sweet (Italian)', note: 'Red, sweet, spiced — for Negronis.' }, { name: 'Blanc', note: 'Pale but sweet.' }],
    flavour: 'Herbal, slightly bitter and spicy; dry or sweet depending on style.', abv: '15–18% alcohol',
    howToUse: 'In small amounts to add depth: Martini (dry), Negroni and Manhattan (sweet).',
    sellingTip: 'Tell customers to keep an open bottle in the fridge and use it within a month — it is wine and it goes old.',
    funFact: 'Many bars throw away old vermouth — a stale bottle is the most common reason for a bad Martini.'
  },
  'bitter-aperitif': {
    id: 'bitter-aperitif', kind: 'liqueur', summary: 'A bright red, bitter-sweet Italian liqueur (like Campari) drunk before dinner.',
    madeFrom: 'Spirit, water, sugar and a secret mix of bitter herbs, roots and orange peel.',
    howMade: 'Herbs and fruit are soaked in spirit, then sugar and water are added. Recipes are usually secret.',
    origin: 'Milan and northern Italy.',
    history: 'Gaspare Campari created his bitter in Novara in 1860 and served it in his café in Milan. Italians began drinking bitters before dinner to “open the appetite” — the tradition of the aperitivo. It is the key to the Americano and the Negroni.',
    styles: [{ name: 'Bold bitter', note: 'Strong, very bitter (like Campari).' }, { name: 'Light aperitivo', note: 'Sweeter and lower in alcohol (like Aperol).' }],
    flavour: 'Bitter orange, herbs and a sweet finish.', abv: '11–28% alcohol',
    howToUse: 'In a Negroni, an Americano, or simply with soda and orange.',
    sellingTip: 'For customers who find it too bitter, suggest the lighter, sweeter aperitivo style.',
    funFact: 'Bitterness makes your mouth produce more saliva, which is why bitter drinks make you hungry.'
  },
  'sparkling-wine': {
    id: 'sparkling-wine', kind: 'wine', summary: 'Wine with bubbles, like champagne, prosecco or cava. Used in the French 75.',
    madeFrom: 'Grapes — for champagne mostly Chardonnay, Pinot Noir and Pinot Meunier; for prosecco Glera.',
    howMade: 'A second fermentation traps carbon dioxide in the wine. In champagne it happens inside each bottle (the “traditional method”); in prosecco it happens in big steel tanks.',
    origin: 'Champagne (France), Prosecco (Italy), Cava (Spain).',
    history: 'Bubbles in wine were first seen as a mistake. In the 17th century the English and French learned to control them, and makers like Dom Pérignon improved champagne. By the 1800s champagne was the drink of royalty and celebrations.',
    styles: [{ name: 'Champagne', note: 'Dry, toasty, fine bubbles.' }, { name: 'Prosecco', note: 'Fruity, light, softer bubbles.' }, { name: 'Cava', note: 'Crisp and good value.' }],
    flavour: 'Crisp and fresh: apple, citrus, sometimes bread or toast.', abv: '11–12.5% alcohol',
    howToUse: 'For topping cocktails (French 75, Royal Mojito) or on its own for a toast.',
    sellingTip: '“Brut” means dry — the most popular choice. For a sweeter taste, recommend “demi-sec”.',
    funFact: 'Only sparkling wine from the Champagne region of France can legally be called “champagne”.'
  },
  'coffee-liqueur': {
    id: 'coffee-liqueur', kind: 'liqueur', summary: 'A sweet liqueur made with coffee (like Kahlúa). Key to the Espresso Martini.',
    madeFrom: 'Coffee, sugar, spirit (often rum) and vanilla.',
    howMade: 'Roasted coffee is soaked in spirit or brewed and mixed with spirit and sugar.',
    origin: 'Mexico is the most famous home of coffee liqueur.',
    history: 'Kahlúa was created in Veracruz, Mexico, in 1936, using Mexican coffee and rum. In the 1950s–1970s it became famous in drinks like the White Russian. The Espresso Martini gave it a second life in modern bars.',
    flavour: 'Sweet coffee, vanilla and caramel.', abv: '16–25% alcohol',
    howToUse: 'In an Espresso Martini, White Russian, or over ice cream.',
    sellingTip: 'Customers making Espresso Martinis at home need both vodka and coffee liqueur — sell them together.',
    funFact: 'Coffee liqueur contains caffeine, but much less than a cup of coffee.'
  }
};
