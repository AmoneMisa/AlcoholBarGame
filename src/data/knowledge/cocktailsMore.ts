import type { CocktailGuide } from './cocktailTypes';
import { HISTORY_NOTES_C } from './historyNotesC';

// Full guides for sixteen more real cocktails. The history, timeline, variations and fun fact come from
// historyNotesC.ts; this file adds what only a bartender can say: the glass, the ice, the garnish and the
// reason behind each step, plus how to choose and compare the drink.

type Hand = Omit<CocktailGuide, 'timeline' | 'history' | 'variations' | 'funFact'>;

const HAND: Hand[] = [
  {
    id: 'blue-lagoon',
    summary: 'A glowing blue vodka highball: blue curaçao, lemon and soda water over lots of ice.',
    preparation: {
      technique: 'built', why: 'Soda water goes in last, so the drink is built in the glass to keep the bubbles alive.',
      glass: 'Tall highball glass', ice: 'Fill the glass with ice cubes.', garnish: 'A lemon wheel',
      steps: ['Fill a tall glass with ice.', 'Add the vodka, blue curaçao, lemon juice and sugar syrup.', 'Stir briefly, so the colour spreads evenly.', 'Top with soda water.', 'Garnish with a lemon wheel.']
    },
    taste: 'Sweet and sour citrus with orange notes and soft bubbles.', strength: 'light',
    chooseWhen: ['The guest wants a colourful, fun drink', 'A holiday or beach mood', 'The guest likes sweet citrus drinks'],
    compare: [{ other: 'Blue Hawaii', difference: 'Also blue, but creamy and tropical with rum, pineapple and coconut. The Blue Lagoon is a lighter, lemony vodka drink.' }, { other: 'Cosmopolitan', difference: 'Also vodka and an orange liqueur, but served short and tart with cranberry.' }]
  },
  {
    id: 'champagne-cocktail',
    summary: 'Sparkling wine over sugar and bitters: the oldest cocktail formula, turned into an elegant toast.',
    preparation: {
      technique: 'built', why: 'Sparkling wine must never be shaken, so everything is built in the glass and the bubbles are poured in last.',
      glass: 'Chilled champagne flute', ice: 'No ice. Chill the glass and the wine instead.', garnish: 'An orange peel',
      steps: ['Add the sugar and the bitter aperitif to a chilled flute.', 'Pour the sparkling wine slowly down the side of the glass.', 'Do not stir — the bubbles will mix the drink.', 'Twist an orange peel over the glass and drop it in.']
    },
    taste: 'Dry, bubbly and elegant, with a little sweetness and a bitter-orange edge.', strength: 'medium',
    chooseWhen: ['The guest is celebrating', 'A toast or an anniversary', 'The guest wants something light but special'],
    compare: [{ other: 'French 75', difference: 'Both end with sparkling wine, but the French 75 starts with gin and lemon. This one is simpler and drier.' }, { other: 'Old Cuban', difference: 'The Old Cuban adds aged rum, lime and mint under the wine, so it is stronger and more complex.' }]
  },
  {
    id: 'tommys-margarita',
    summary: 'A clean modern Margarita: tequila, lime and agave-style sweetness, with no orange liqueur.',
    preparation: {
      technique: 'shaken', why: 'Fresh lime juice must be shaken with ice to chill it quickly and to soften the sharp acid.',
      glass: 'Rocks glass', ice: 'Shake with ice, then strain over fresh ice cubes.', garnish: 'A lime wheel',
      steps: ['Add the tequila, lime juice and sugar syrup to a shaker with ice.', 'Shake hard for about 10 seconds.', 'Strain into a rocks glass filled with fresh ice.', 'Garnish with a lime wheel.']
    },
    taste: 'Sharp, clean and fresh, with the earthy taste of agave in front.', strength: 'medium',
    chooseWhen: ['The guest loves tequila', 'The guest finds sweet drinks too sweet', 'A hot evening or a taco night'],
    compare: [{ other: 'Margarita', difference: 'The classic adds orange liqueur and often salt, so it is sweeter and rounder. Tommy’s is drier and more direct.' }, { other: 'Daiquiri', difference: 'The same structure — spirit, lime, sugar — but with rum instead of tequila.' }]
  },
  {
    id: 'batanga',
    summary: 'Tequila, lime and cola in a salt-rimmed glass: the everyday highball of Tequila, Mexico.',
    preparation: {
      technique: 'built', why: 'The cola is added at the end, so the drink is built in the glass and stirred gently to keep the fizz.',
      glass: 'Tall highball glass with a salted rim', ice: 'Fill the glass with ice cubes.', garnish: 'A lime wedge and the salted rim',
      steps: ['Rub a lime wedge around the rim and dip it in salt.', 'Fill the glass with ice and add the tequila and lime juice.', 'Top with cola.', 'Stir once or twice from the bottom — traditionally with a knife.', 'Serve with the lime wedge.']
    },
    taste: 'Sweet cola, tart lime and a pinch of salt, with agave in the background.', strength: 'light',
    chooseWhen: ['The guest wants an easy, casual drink', 'The guest likes cola', 'A party or a long evening'],
    compare: [{ other: 'Cuba Libre', difference: 'The same idea with rum. The Batanga adds a salty rim, which makes the tequila taste rounder.' }, { other: 'Paloma', difference: 'Another tequila highball, but with grapefruit soda instead of cola.' }]
  },
  {
    id: 'rusty-nail',
    summary: 'Scotch whisky and a honeyed herbal liqueur over ice: two ingredients, slow and warm.',
    preparation: {
      technique: 'stirred', why: 'The drink has only spirits and liqueur, so it is stirred. Stirring chills it without making it cloudy.',
      glass: 'Rocks glass', ice: 'One large ice cube, which melts slowly.', garnish: 'An orange or lemon peel',
      steps: ['Add the whiskey and the herbal liqueur to a mixing glass with ice.', 'Stir for about 20 seconds until cold.', 'Strain over a large ice cube in a rocks glass.', 'Express a peel over the glass and drop it in.']
    },
    taste: 'Warm, honeyed and herbal, with the smooth backbone of whisky.', strength: 'strong',
    chooseWhen: ['The guest wants something warm after dinner', 'The guest is curious about whisky but finds it too dry', 'A cold evening'],
    compare: [{ other: 'Old Fashioned', difference: 'Both are stirred whisky drinks, but the Old Fashioned uses sugar and bitters. The Rusty Nail is sweeter and more herbal.' }, { other: 'Godfather', difference: 'A similar two-ingredient idea, with almond liqueur instead of honey-herb liqueur.' }]
  },
  {
    id: 'whiskey-smash',
    summary: 'A bright, minty whiskey sour: whiskey, lemon and sugar shaken over pressed mint.',
    preparation: {
      technique: 'shaken', why: 'The lemon juice is shaken hard with ice to chill it and to mix the pressed mint into the drink.',
      glass: 'Rocks glass', ice: 'Shake with ice, then strain over crushed or fresh ice.', garnish: 'A big mint sprig',
      steps: ['Gently press the mint with the sugar syrup in a shaker.', 'Add the whiskey, lemon juice and ice.', 'Shake hard and strain over fresh ice in a rocks glass.', 'Slap a mint sprig between your hands and add it as garnish.']
    },
    taste: 'Fresh and lemony, with cool mint and the warmth of whiskey.', strength: 'medium',
    chooseWhen: ['The guest likes whiskey but wants something fresh', 'A warm afternoon', 'The guest enjoyed a Mojito or a Julep'],
    compare: [{ other: 'Mint Julep', difference: 'The Julep has no lemon and is stirred over crushed ice. The Smash is shaken and more tart.' }, { other: 'Whiskey Sour', difference: 'The same base of whiskey, lemon and sugar, but the Smash adds fresh mint.' }]
  },
  {
    id: 'mamie-taylor',
    summary: 'Scotch, lime and ginger beer: a spicy, cooling highball older than the Moscow Mule.',
    preparation: {
      technique: 'built', why: 'Ginger beer is fizzy, so the drink is built in the glass and not shaken.',
      glass: 'Tall highball glass', ice: 'Fill the glass with ice cubes.', garnish: 'A lime wedge',
      steps: ['Fill a tall glass with ice.', 'Add the whiskey and the lime juice.', 'Top with cold ginger beer.', 'Stir once from the bottom and add a lime wedge.']
    },
    taste: 'Spicy ginger, sharp lime and a smooth whisky base.', strength: 'medium',
    chooseWhen: ['The guest likes ginger beer or spicy flavours', 'A warm evening or a long session', 'The guest wants a whisky drink that is not heavy'],
    compare: [{ other: 'Moscow Mule', difference: 'The same style, but with vodka. The Mamie Taylor has the deeper taste of Scotch.' }, { other: 'Whiskey Ginger', difference: 'Very close, but the Mamie Taylor adds fresh lime juice, so it is sharper.' }]
  },
  {
    id: 'bronx',
    summary: 'Gin, vermouth and fresh orange: a friendly Martini cousin that once ruled New York.',
    preparation: {
      technique: 'shaken', why: 'Fresh orange juice must be shaken so that it mixes with the gin and the vermouth and becomes cold and lightly frothy.',
      glass: 'Chilled coupe', ice: 'Shake with ice, then strain. No ice in the glass.', garnish: 'An orange twist',
      steps: ['Squeeze a fresh orange and measure the juice.', 'Add the gin, vermouth, juice and ice to a shaker.', 'Shake hard until very cold.', 'Strain into a chilled coupe and add an orange twist.']
    },
    taste: 'Fruity orange over dry gin, with the soft herbal sweetness of vermouth.', strength: 'medium',
    chooseWhen: ['The guest likes gin but wants something softer', 'Brunch or an early aperitif', 'The guest enjoyed a Martini and wants more fruit'],
    compare: [{ other: 'Martini', difference: 'The Martini is dry, strong and clear. The Bronx is shaken, fruity and cloudy.' }, { other: 'Corpse Reviver No. 2', difference: 'Also a shaken gin and vermouth sour, but with lemon and orange liqueur.' }]
  },
  {
    id: 'martinez',
    summary: 'Gin, sweet vermouth and a touch of maraschino: the rich ancestor of the Martini.',
    preparation: {
      technique: 'stirred', why: 'All ingredients are spirits and wines, so the drink is stirred to stay clear and silky.',
      glass: 'Chilled coupe or martini glass', ice: 'Stir with ice, then serve without ice.', garnish: 'An orange peel',
      steps: ['Add the gin, vermouth and maraschino to a mixing glass with ice.', 'Stir for about 25 seconds until very cold.', 'Strain into a chilled coupe.', 'Express an orange peel over the drink and add it.']
    },
    taste: 'Rich and smooth, with botanical gin, sweet vermouth and a hint of cherry and almond.', strength: 'strong',
    chooseWhen: ['The guest likes Manhattans and Martinis', 'The guest wants a classic with history', 'A slow evening or date night'],
    compare: [{ other: 'Martini', difference: 'The Martini is drier and uses much less vermouth. The Martinez is sweeter and richer.' }, { other: 'Manhattan', difference: 'The same structure, but with gin instead of whiskey.' }]
  },
  {
    id: 'bijou',
    summary: 'Gin, green herbal liqueur and sweet vermouth in equal parts, named after three jewels.',
    preparation: {
      technique: 'stirred', why: 'The drink has only spirits and liqueur, so it is stirred. This keeps it clear and gives a heavy, silky body.',
      glass: 'Chilled coupe or martini glass', ice: 'Stir with ice, then serve without ice.', garnish: 'An orange peel',
      steps: ['Add equal parts gin, herbal liqueur and vermouth to a mixing glass with ice.', 'Stir for about 25 seconds.', 'Strain into a chilled coupe.', 'Express an orange peel over the glass and add it.']
    },
    taste: 'Herbal, deep and slightly sweet, with a long spicy finish.', strength: 'strong',
    chooseWhen: ['The guest wants a bold, herbal drink', 'The guest likes a Negroni', 'A cold evening'],
    compare: [{ other: 'Negroni', difference: 'Also equal parts and stirred, but the Negroni uses a bitter aperitif. The Bijou is herbal rather than bitter.' }, { other: 'Last Word', difference: 'Uses the same herbal liqueur, but shaken with lime and cherry liqueur, so it is sharper.' }]
  },
  {
    id: 'last-word',
    summary: 'Equal parts gin, green herbal liqueur, cherry-almond liqueur and lime: sharp, sweet and unforgettable.',
    preparation: {
      technique: 'shaken', why: 'The lime juice needs shaking with ice to chill it and to blend the strong, sticky liqueurs with the gin.',
      glass: 'Chilled coupe', ice: 'Shake with ice, then strain. No ice in the glass.', garnish: 'A lime twist or a cherry',
      steps: ['Add equal measures of gin, herbal liqueur, specialty liqueur and lime juice to a shaker with ice.', 'Shake hard for about 12 seconds.', 'Strain into a chilled coupe.', 'Add a lime twist.']
    },
    taste: 'Sharp lime, sweet herbs and cherry-almond, over dry gin.', strength: 'strong',
    chooseWhen: ['The guest likes bold, complex cocktails', 'The guest wants something different from a Martini', 'A special occasion with adventurous drinkers'],
    compare: [{ other: 'Paper Plane', difference: 'Also an equal-parts sour, made as a modern tribute to the Last Word, but with bourbon and a bitter, orange note.' }, { other: 'Gimlet', difference: 'Both are gin and lime, but the Gimlet is simple and clean. The Last Word is herbal and strongly flavoured.' }]
  },
  {
    id: 'blue-hawaii',
    summary: 'Rum, vodka, blue curaçao, pineapple and coconut shaken into a drink the colour of the Pacific.',
    preparation: {
      technique: 'shaken', why: 'Pineapple juice and coconut cream need hard shaking to mix and to create a soft, light foam.',
      glass: 'Tall tiki or hurricane glass', ice: 'Shake with ice, then pour over fresh ice.', garnish: 'A pineapple wedge (and an orchid, if you have one)',
      steps: ['Add the rum, vodka, blue curaçao, pineapple juice and coconut cream to a shaker with ice.', 'Shake hard for about 12 seconds.', 'Strain over fresh ice in a tall glass.', 'Garnish with a pineapple wedge.']
    },
    taste: 'Sweet, creamy and tropical, with pineapple and coconut over orange.', strength: 'light',
    chooseWhen: ['The guest wants a holiday drink', 'The guest likes Piña Coladas', 'A photo moment or a celebration'],
    compare: [{ other: 'Piña Colada', difference: 'Also pineapple and coconut, but the Colada is creamier and rum only. The Blue Hawaii is lighter and bright blue.' }, { other: 'Blue Lagoon', difference: 'Also blue, but a simple lemon and vodka highball.' }]
  },
  {
    id: 'ti-punch',
    summary: 'The little punch of the French Caribbean: strong rum, a piece of lime and a spoon of cane syrup.',
    preparation: {
      technique: 'stirred', why: 'It is a very small drink of rum, lime and syrup. A gentle stir mixes it without too much water.',
      glass: 'Small rocks glass', ice: 'Little or no ice — traditionally the drink is served almost at room temperature.', garnish: 'The squeezed lime piece',
      steps: ['Squeeze a thick piece of lime into the glass and drop it in.', 'Add the sugar syrup.', 'Add the rum and stir gently.', 'Add one small piece of ice if the guest wants it colder.']
    },
    taste: 'Strong, grassy rum with sharp lime and a little sweetness.', strength: 'strong',
    chooseWhen: ['The guest loves rum', 'A short drink before dinner', 'The guest wants to try a drink from the French Caribbean'],
    compare: [{ other: 'Daiquiri', difference: 'The same ingredients, but the Daiquiri is shaken, cold and diluted. The Ti’ Punch is small and strong.' }, { other: 'Mojito', difference: 'The Mojito is long, minty and fizzy. The Ti’ Punch is short and direct.' }]
  },
  {
    id: 'greyhound',
    summary: 'Vodka and grapefruit over ice: bitter, fresh and so simple that it became a bar standard.',
    preparation: {
      technique: 'built', why: 'It is only two ingredients and the grapefruit soda is fizzy, so it is built in the glass and not shaken.',
      glass: 'Tall highball glass', ice: 'Fill the glass with ice cubes.', garnish: 'A grapefruit wedge or slice',
      steps: ['Fill a tall glass with ice.', 'Add the vodka.', 'Top with grapefruit soda.', 'Stir gently once and add a grapefruit slice.']
    },
    taste: 'Fresh and bitter-sweet grapefruit, with a clean spirit behind it.', strength: 'light',
    chooseWhen: ['The guest wants an easy, fresh drink', 'Brunch or a hot afternoon', 'The guest does not like very sweet drinks'],
    compare: [{ other: 'Paloma', difference: 'The same grapefruit idea with tequila and lime instead of vodka.' }, { other: 'Sea Breeze', difference: 'Adds cranberry, so it is sweeter and redder.' }]
  },
  {
    id: 'queens-park-swizzle',
    summary: 'Dark rum, lime, mint and bitters swizzled over crushed ice until the glass turns frosty.',
    preparation: {
      technique: 'built', why: 'It is built in the glass and “swizzled” with a stick or a bar spoon, which chills it quickly and keeps the mint fresh.',
      glass: 'Tall highball glass', ice: 'Crushed ice, packed high, so frost forms on the glass.', garnish: 'A big mint sprig',
      steps: ['Gently press the mint with the sugar syrup and lime juice in the glass.', 'Add the dark rum and fill the glass with crushed ice.', 'Swizzle by rolling a bar spoon quickly between your hands until the glass frosts.', 'Add a splash of soda water and the bitters on top.', 'Garnish with a mint sprig.']
    },
    taste: 'Minty, tangy and spiced, with the deeper flavour of dark rum.', strength: 'medium',
    chooseWhen: ['The guest likes Mojitos but wants more depth', 'A hot evening', 'The guest likes dark rum'],
    compare: [{ other: 'Mojito', difference: 'The Mojito uses white rum and more soda. The Swizzle uses dark rum and bitters, so it is spicier and deeper.' }, { other: 'Dark ’n’ Stormy', difference: 'Also dark rum and lime, but with ginger beer instead of mint and crushed ice.' }]
  },
  {
    id: 'singapore-sling',
    summary: 'The pink gin sling of Raffles Hotel: cherry, herbs, orange liqueur and pineapple under a fruity cloak.',
    preparation: {
      technique: 'shaken', why: 'The pineapple and lime juices need to be shaken with ice to chill the drink and to create a light, frothy top.',
      glass: 'Tall glass', ice: 'Shake with ice, then pour over fresh ice.', garnish: 'A lime wheel or a pineapple wedge',
      steps: ['Add the gin, specialty liqueur, herbal liqueur, orange liqueur, pineapple juice and lime juice to a shaker with ice.', 'Shake hard for about 12 seconds.', 'Pour into a tall glass over fresh ice.', 'Garnish with a lime wheel.']
    },
    taste: 'Fruity and rosy, with cherry, herbs and pineapple over botanical gin.', strength: 'medium',
    chooseWhen: ['The guest wants a fruity drink with some gin', 'A holiday mood or a celebration', 'The guest likes drinks with a story'],
    compare: [{ other: 'Tom Collins', difference: 'Both are tall gin drinks, but the Collins is simple lemon and soda. The Sling is fruity, herbal and much more complex.' }, { other: 'Blue Hawaii', difference: 'Another tall, pineapple-based drink, but with rum and coconut and no herbal notes.' }]
  }
];

export const MORE_GUIDES: Record<string, CocktailGuide> = Object.fromEntries(HAND.map((hand) => {
  const note = HISTORY_NOTES_C[hand.id]!;
  return [hand.id, {
    ...hand,
    timeline: note.timeline,
    history: `${note.history}${note.realRecipe ? ` (${note.realRecipe})` : ''}`,
    variations: note.variations ?? [],
    funFact: note.funFact
  } satisfies CocktailGuide];
}));
