import { FOODS } from '../../domain/foods';
import { SPIRIT_GUIDES, type IngredientGuide } from './spirits';

export type { IngredientGuide } from './spirits';

// Mixers, fresh ingredients and garnishes.
const OTHER_GUIDES: Record<string, IngredientGuide> = {
  'lime-juice': {
    id: 'lime-juice', kind: 'fresh', summary: 'Fresh juice of the lime — the most important sour ingredient in cocktails.', origin: 'Limes come from Southeast Asia and grow in hot countries like Mexico and Brazil.',
    history: 'Limes were carried on British ships in the 1800s to prevent scurvy — that is why British sailors got the nickname “limeys”. In the Caribbean and Mexico, lime became the partner of rum and tequila.',
    flavour: 'Very sour, fresh and aromatic, a little bitter.', howToUse: 'Balances sweetness in Daiquiris, Mojitos, Margaritas and Mules. Always squeeze it fresh — bottled juice tastes flat.',
    sellingTip: 'One lime gives about 25–30 ml of juice.', funFact: 'Lime juice tastes best a few hours after squeezing, but it loses its freshness after one day.'
  },
  'lemon-juice': {
    id: 'lemon-juice', kind: 'fresh', summary: 'Fresh lemon juice: sour and bright, softer than lime.', origin: 'Lemons came from Asia and spread through the Mediterranean.',
    history: 'Lemon punch was one of the first mixed drinks in the 1600s. Lemon is the classic sour for whiskey and gin drinks.',
    flavour: 'Sour and bright with a clean citrus aroma.', howToUse: 'Whiskey Sour, French 75, Long Island. Lemon goes well with whiskey and gin; lime goes well with rum and tequila.',
    sellingTip: 'A medium lemon gives about 30–40 ml of juice.', funFact: 'Rolling a lemon on the table before cutting it helps you get more juice.'
  },
  'pineapple-juice': {
    id: 'pineapple-juice', kind: 'mixer', summary: 'Sweet, tropical juice that makes drinks fruity and a little foamy.', origin: 'Pineapples come from South America; Hawaii made them famous.',
    history: 'Canned pineapple juice became popular in the 1930s, just in time for the tiki bar trend.',
    flavour: 'Sweet, tropical, slightly sour.', howToUse: 'Piña Colada, tiki drinks. When you shake it, it makes a nice foam.',
    sellingTip: 'Suggest it with white rum and coconut cream for a Piña Colada party.', funFact: 'Fresh pineapple contains an enzyme (bromelain) that breaks down protein — it can even make your tongue tingle.'
  },
  'cranberry-juice': {
    id: 'cranberry-juice', kind: 'mixer', summary: 'A tart red juice from North American cranberries.', origin: 'North America.',
    history: 'Native Americans used cranberries for food and colour. Cranberry juice drinks became popular in the 20th century and made the Cosmopolitan pink.',
    flavour: 'Tart, dry and fruity.', howToUse: 'Cosmopolitan, Sea Breeze. Use a little for colour and tartness.',
    sellingTip: 'Most bottles are “cranberry juice drink” with sugar — pure cranberry juice is very sour.', funFact: 'Ripe cranberries bounce — farmers used to test them by dropping them down steps.'
  },
  'sugar-syrup': {
    id: 'sugar-syrup', kind: 'mixer', summary: 'Sugar dissolved in water (simple syrup). It sweetens cold drinks easily.',
    history: 'Sugar does not dissolve well in cold drinks, so 19th-century bartenders started using syrup instead.',
    flavour: 'Sweet and neutral.', howToUse: 'Balances sour citrus. The classic “sour” balance is spirit, citrus and syrup.',
    sellingTip: 'Easy to make at home: one part sugar, one part hot water, stir until clear.', funFact: '“Rich” syrup uses two parts sugar to one part water — it is sweeter and lasts longer.'
  },
  'coconut-cream': {
    id: 'coconut-cream', kind: 'mixer', summary: 'Thick, sweet coconut cream that makes drinks creamy.', origin: 'The Caribbean — Coco López was created in Puerto Rico in the 1950s.',
    history: 'Ready-made cream of coconut made the Piña Colada possible — before it, making coconut cream by hand was a lot of work.',
    flavour: 'Sweet, rich coconut.', howToUse: 'Piña Colada and other tropical drinks. Shake very hard.',
    sellingTip: 'Warn customers: sweet “cream of coconut” and unsweetened “coconut cream” are different products.', funFact: 'It separates in the can — always shake or stir it before use.'
  },
  milk: {
    id:'milk',kind:'mixer',summary:'A light dairy mixer that softens strong coffee and spirit flavors.',origin:'Used in milk punches and creamy mixed drinks across Europe and North America.',history:'Milk punch recipes appeared centuries ago; modern bars use chilled milk or cream to make smooth dessert-style drinks.',flavour:'Mild, creamy and lightly sweet.',howToUse:'Float or stir it into a White Russian, or shake it in dessert cocktails such as a Mudslide.',sellingTip:'Ask about dairy allergies and never combine milk directly with strongly acidic citrus.',funFact:'Milk is lighter than cream, so it makes a less heavy White Russian.'
  },
  'coconut-milk': {
    id:'coconut-milk',kind:'mixer',summary:'Unsweetened liquid made from coconut flesh and water, lighter than coconut cream.',origin:'Common in tropical cuisines across Southeast Asia, the Caribbean and the Pacific.',history:'Fresh coconut milk has long been made by pressing grated coconut with water; packaged versions made it practical behind the bar.',flavour:'Soft, creamy coconut with less sugar and body than cream of coconut.',howToUse:'Use in lighter tropical drinks or dairy-free creamy cocktails; Piña Colada normally needs thicker sweet coconut cream.',sellingTip:'Explain that coconut milk, coconut cream and sweet cream of coconut are different products.',funFact:'Coconut milk is not the clear water found inside a coconut; it is pressed from the white flesh.'
  },
  'blue-curacao': {
    id:'blue-curacao',kind:'liqueur',summary:'Orange-flavored Curaçao liqueur colored vivid blue for highly visual cocktails.',origin:'The orange style comes from Curaçao; famous blue commercial versions are made by several European liqueur houses.',history:'Curaçao liqueur developed from the aromatic peel of bitter laraha oranges. Blue coloring became popular in twentieth-century resort cocktails.',flavour:'Sweet orange peel with a lightly bitter citrus finish.',howToUse:'Measure carefully in Blue Lagoon-style drinks and tropical cocktails; a small pour gives strong color.',sellingTip:'Recommend it when a customer values visual drama and sweet citrus flavor.',funFact:'Blue Curaçao is orange-flavored—the blue color does not come from blue fruit.'
  },
  'herbal-liqueur': {
    id:'herbal-liqueur',kind:'liqueur',summary:'Aromatic liqueur flavored with herbs, roots, flowers, bark and spices.',origin:'European monastery, pharmacy and digestif traditions.',history:'Many herbal liqueurs began as medicinal preparations before becoming after-dinner drinks; several recipes remain closely guarded secrets.',flavour:'Can be sweet, minty, spicy or intensely bitter depending on the botanical recipe.',howToUse:'Serve chilled, sip after dinner, or measure in small amounts to add complexity to cocktails.',sellingTip:'Ask whether the guest likes sweeter herbal flavor or challenging bitterness before choosing a brand.',funFact:'Green Chartreuse receives its color naturally from its plant ingredients.'
  },
  'specialty-liqueur': {
    id:'specialty-liqueur',kind:'liqueur',summary:'A broad family of strongly flavored liqueurs such as melon, coconut and almond styles.',origin:'Produced worldwide from neutral spirit, sugar and distinctive fruits, nuts or extracts.',history:'Modern specialty liqueurs expanded rapidly as colorful party and tropical cocktails became popular in the twentieth century.',flavour:'Usually sweet and focused on one recognizable flavor, from melon and coconut to almond.',howToUse:'Use as a measured accent rather than a neutral base; balance its sugar with citrus or a dry spirit.',sellingTip:'Start with the customer’s favorite flavor and desired color, then check the total sweetness.',funFact:'Many famous specialty liqueurs are better known by their brand name than by their formal category.'
  },
  'fruit-wine': {
    id:'fruit-wine',kind:'wine',summary:'Fermented drink made from fruit other than grapes, including strawberry, pineapple and plum styles.',origin:'Made in fruit-growing regions worldwide, especially where local produce is plentiful.',history:'People fermented seasonal fruit long before modern refrigeration; today fruit wines range from rustic local bottles to polished commercial products.',flavour:'Varies by fruit, from bright tropical acidity to sweet berry or fragrant plum.',howToUse:'Serve chilled by the glass, pair with desserts, or use as a lower-strength base for fruit cocktails.',sellingTip:'Ask which fruit the guest likes and whether they prefer dry or sweet—fruit wine is not always sugary.',funFact:'Pineapple wine can finish surprisingly dry because yeast consumes much of the fruit sugar.'
  },
  'alcohol-free-beer': {
    id:'alcohol-free-beer',kind:'mixer',summary:'Beer brewed for malt and hop flavor with little or no alcohol remaining.',origin:'Modern alcohol-free lager developed strongly in Europe and is now produced worldwide.',history:'Early low-alcohol beers existed for practical hydration; improved vacuum distillation and controlled fermentation later preserved more beer flavor.',flavour:'Malt, grain and hops, from crisp lager to roasted stout, without normal alcoholic strength.',howToUse:'Serve very cold in a clean beer glass and offer it with food or whenever a customer wants no alcohol.',sellingTip:'Keep several styles: a pale lager is broadly refreshing, while alcohol-free stout suits roasted or savory food.',funFact:'Some products labeled alcohol-free may contain trace alcohol depending on local law, while 0.0 products target effectively none.'
  },
  tonic: {
    id: 'tonic', kind: 'mixer', summary: 'Fizzy water with quinine, which gives a bitter taste. Partner of gin.', origin: 'Britain and British India, 1800s.',
    history: 'Quinine from cinchona bark was medicine against malaria. Schweppes sold Indian Tonic Water from 1870.',
    flavour: 'Bitter, lightly sweet and fizzy.', howToUse: 'Gin & Tonic. Keep it very cold and pour gently.',
    sellingTip: 'Premium tonics come in different styles: classic, light (less sugar), Mediterranean (herbal).', funFact: 'Quinine glows blue under UV light.'
  },
  soda: {
    id: 'soda', kind: 'mixer', summary: 'Water with bubbles (carbon dioxide) and no taste.', origin: 'Joseph Priestley made carbonated water in England in 1767.',
    history: 'Soda water siphons became popular in bars in the 1800s. It makes drinks longer and lighter.',
    flavour: 'Neutral and fizzy, sometimes slightly salty.', howToUse: 'Mojito, Americano, highballs. Add at the end.',
    sellingTip: 'Soda water, sparkling water and club soda are almost the same: all neutral bubbles.', funFact: 'Cold water holds more bubbles — always use cold soda.'
  },
  cola: {
    id: 'cola', kind: 'mixer', summary: 'A sweet fizzy drink flavoured with vanilla, citrus and spices.', origin: 'USA, 1880s.',
    history: 'Cola was created in 1886 in Atlanta as a “medicine” drink. Rum and cola became the famous Cuba Libre around 1900.',
    flavour: 'Sweet, caramel, vanilla and spice.', howToUse: 'A splash in a Long Island; Cuba Libre with rum and lime.',
    sellingTip: 'Offer diet cola to guests who want less sugar.', funFact: 'The name comes from the kola nut, which contains caffeine.'
  },
  'ginger-beer': {
    id: 'ginger-beer', kind: 'mixer', summary: 'A spicy, fizzy ginger drink — usually non-alcoholic today.', origin: 'England, 1700s.',
    history: 'It started as a real fermented, slightly alcoholic drink. Modern ginger beer is a spicy soft drink.',
    flavour: 'Spicy ginger, sweet and fizzy.', howToUse: 'Moscow Mule, Dark ’n’ Stormy.',
    sellingTip: 'Ginger beer is spicier than ginger ale — use beer for Mules.', funFact: 'The copper mug does not change the taste, but it keeps the Mule very cold.'
  },
  'grapefruit-soda': {
    id: 'grapefruit-soda', kind: 'mixer', summary: 'A fizzy drink with sweet-bitter grapefruit taste.', origin: 'Popular in Mexico since the 1950s.',
    history: 'Grapefruit sodas became popular in Mexico in the 1950s, and the Paloma followed.',
    flavour: 'Tart, lightly bitter, sweet and fizzy.', howToUse: 'Paloma with tequila, lime and salt.',
    sellingTip: 'Suggest it with tequila for customers who find Margaritas too strong.', funFact: 'Grapefruit got its name because it grows in bunches, like grapes.'
  },
  mint: {
    id: 'mint', kind: 'garnish', summary: 'A fresh green herb with a cool aroma.', origin: 'Europe and the Mediterranean.',
    history: 'Mint was used in drinks for centuries: the Mint Julep in the American South and the Mojito in Cuba.',
    flavour: 'Cool, fresh and sweet-herbal.', howToUse: 'Press gently (do not smash) in Mojitos; use a big sprig as garnish so guests smell it.',
    sellingTip: 'Keep mint in water like flowers — it stays fresh longer.', funFact: 'Clapping mint between your hands releases its aroma without making it bitter.'
  },
  ice: {
    id: 'ice', kind: 'garnish', summary: 'Frozen water — the most important ingredient in the bar.',
    history: 'In the 1800s Frederic Tudor, the “Ice King”, shipped ice from New England lakes around the world. Cheap ice made American cocktails possible.',
    flavour: 'None — but it controls temperature and dilution (the water in the drink).', howToUse: 'Big cubes melt slowly (for strong drinks); crushed ice cools fast (for tiki and long drinks). Always use fresh ice when you strain.',
    sellingTip: 'Party customers usually forget ice — about 1 kg per 5 guests is a good rule.', funFact: 'Bartenders call water from melting ice “dilution” — about a quarter of a shaken drink is water, and that is on purpose.'
  },
  'lime-wedge': {
    id: 'lime-wedge', kind: 'garnish', summary: 'A piece of fresh lime for garnish and a final squeeze.',
    history: 'Lime garnishes show the guest what is in the drink and add fresh aroma.',
    flavour: 'Sour and fresh.', howToUse: 'On the rim of G&Ts, Mules and Mojitos. The guest can squeeze it for more sourness.',
    sellingTip: 'Cut wedges just before service — they dry out quickly.', funFact: 'A garnish should always be edible or useful — decoration only is bad bar style.'
  },
  orange: {
    id: 'orange', kind: 'garnish', summary: 'Fresh orange for slices and peel, which gives aroma to strong drinks.',
    history: 'Orange peel has been used in cocktails since the 1800s. Its oils make stirred drinks smell fresh.',
    flavour: 'Sweet citrus aroma; the peel is oily and slightly bitter.', howToUse: 'Squeeze the peel over an Old Fashioned or Negroni so the oils fall on the drink.',
    sellingTip: 'Oranges keep longer in the fridge.', funFact: 'A “flamed” orange peel: bartenders squeeze the oils through a flame for a little fire show and a toasty aroma.'
  },
  'pineapple-wedge': {
    id: 'pineapple-wedge', kind: 'garnish', summary: 'A piece of fresh pineapple for tropical drinks.',
    history: 'In the 1700s–1800s the pineapple was a symbol of hospitality and welcome.',
    flavour: 'Sweet and tropical.', howToUse: 'On the rim of a Piña Colada or tiki drink.',
    sellingTip: 'A ripe pineapple smells sweet at the bottom.', funFact: 'A pineapple plant needs about two years to grow one fruit.'
  },
  salt: {
    id: 'salt', kind: 'garnish', summary: 'Bar salt for rims — it changes how we taste sweet and sour.',
    history: 'Tequila with salt and lime is a Mexican tradition; the salt rim moved into the Margarita.',
    flavour: 'Salty; reduces bitterness and makes flavours brighter.', howToUse: 'Salt half the rim on a Margarita or Paloma so the guest can choose.',
    sellingTip: 'Use flaky or coarse salt — fine table salt is too strong.', funFact: 'A tiny pinch of salt inside a cocktail can make citrus taste fresher without tasting salty.'
  }
};

export const INGREDIENT_GUIDES: Record<string, IngredientGuide> = { ...SPIRIT_GUIDES, ...OTHER_GUIDES };

export const KIND_LABEL: Record<IngredientGuide['kind'], string> = {
  spirit: 'Spirit', liqueur: 'Liqueur', wine: 'Wine', mixer: 'Mixer', fresh: 'Fresh juice', garnish: 'Garnish & ice', food: 'Food'
};

// Guides for the menu food: the story, how to serve it and what to pair it with, written from the food data.
const PAIR_WORDS: Record<string, string> = { strong: 'strong spirits', dry: 'dry drinks', sweet: 'sweet cocktails', sour: 'sour drinks', bitter: 'bitter drinks', sparkling: 'sparkling drinks', fresh: 'fresh, citrusy drinks', creamy: 'creamy drinks' };
for (const food of FOODS) {
  const goes = food.pairs.slice(0, 3).map((trait) => PAIR_WORDS[trait] ?? trait).join(', ');
  (INGREDIENT_GUIDES as Record<string, IngredientGuide>)[food.id] = {
    id: food.id, kind: 'food', summary: food.description, history: food.story,
    flavour: food.menu + '.', howToUse: `Serve it hot or fresh, next to the drink. It goes well with ${goes}. Classic partners: ${food.classic.join(', ')}.`,
    sellingTip: `Suggest it when a guest is hungry or has been drinking for a while: “Would you like ${food.name.toLowerCase()} with that?”`,
    funFact: 'Food slows down the alcohol in the body, so a guest who eats stays happier for longer.'
  };
}
