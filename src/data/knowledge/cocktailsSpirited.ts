import type { CocktailGuide } from './cocktailTypes';

// Gin, vodka and whiskey drinks.
export const SPIRITED_GUIDES: Record<string, CocktailGuide> = {
  cosmopolitan: {
    id: 'cosmopolitan',
    summary: 'Vodka, orange liqueur, cranberry and lime, shaken and served in a cocktail glass. Pink, crisp and famous from TV.',
    timeline: [
      { when: '1980s', what: 'Bartenders in Miami (Cheryl Cook) and New York (Toby Cecchini at the Odeon) develop versions with citrus vodka and cranberry.' },
      { when: '1990s', what: 'Dale DeGroff serves it at New York’s Rainbow Room; celebrities make it fashionable.' },
      { when: '1998–2004', what: 'The TV series “Sex and the City” makes it a worldwide symbol of city nightlife.' }
    ],
    history: 'The Cosmopolitan is a modern classic from the 1980s — a vodka version of older sours like the Kamikaze and the Margarita. Several bartenders developed it at the same time, when new flavoured vodkas were popular. Its bright pink colour and elegant glass made it perfect for television, and in the late 1990s it became one of the most ordered drinks in the world.',
    preparation: {
      technique: 'shaken', why: 'Shaken because of the lime and cranberry juice. It is served very cold with no ice, so the glass should be chilled first.',
      glass: 'Chilled martini glass or coupe', ice: 'Shaken with ice, served straight up', garnish: 'Orange or lime peel (a flamed orange peel is the classic show)',
      steps: ['Add vodka, orange liqueur, cranberry and lime juice to a shaker.', 'Shake with ice until very cold.', 'Strain into a chilled glass.', 'Squeeze an orange peel over the top.']
    },
    taste: 'Crisp, fruity and a little tart. The cranberry is dry, not very sweet.', strength: 'medium',
    chooseWhen: ['The guest likes fruity drinks that are not too sweet', 'A celebration or a stylish night out', 'The guest likes vodka'],
    compare: [{ other: 'Margarita', difference: 'Same structure (spirit + orange liqueur + lime), with tequila and salt instead of vodka and cranberry.' }, { other: 'Martini', difference: 'Served in the same glass, but the Martini is much drier and stronger.' }],
    variations: [{ name: 'White Cosmopolitan', change: 'White cranberry juice.' }, { name: 'Cosmo Royale', change: 'Topped with sparkling wine.' }],
    funFact: 'Only a small amount of cranberry is used — just enough for the pink colour. A deep red Cosmo usually has too much juice.'
  },
  'old-fashioned': {
    id: 'old-fashioned',
    summary: 'Whiskey, sugar and orange, stirred over one big ice cube. One of the oldest cocktails: the original idea of a “cocktail”.',
    timeline: [
      { when: '1806', what: 'A New York newspaper defines a “cocktail” as spirit, sugar, water and bitters — exactly this drink.' },
      { when: '1860s–1880s', what: 'New cocktails with liqueurs appear. Traditional drinkers start asking for an “old-fashioned” whiskey cocktail.' },
      { when: '1880s', what: 'The Pendennis Club in Louisville, Kentucky, claims the drink, but the drink is older than the club.' },
      { when: '2007–2015', what: 'The TV series “Mad Men” and the craft-cocktail movement make it popular again.' }
    ],
    history: 'The Old Fashioned is the cocktail in its first, simplest form. In 1806 the word “cocktail” meant spirit, sugar, water and bitters. During the 19th century bartenders added fancy liqueurs and fruit, and some guests did not like the change — they asked for a whiskey cocktail made the “old-fashioned” way. The name stayed. Today it is the classic way to enjoy a good whiskey with just a little sweetness and aroma.',
    preparation: {
      technique: 'stirred', why: 'It is stirred, not shaken, because it has no juice. Stirring cools and dilutes the drink gently and keeps it clear and silky. Shaking would make it cloudy and watery.',
      glass: 'Rocks (old fashioned) glass', ice: 'One large ice cube — it melts slowly, so the drink stays strong and cold.', garnish: 'Orange peel',
      steps: ['Dissolve the sugar with a little water (or use syrup) in the glass.', 'Add whiskey and a large ice cube.', 'Stir for about thirty seconds.', 'Squeeze an orange peel over the drink to release its oils.']
    },
    taste: 'Rich, warm and smooth. Whiskey first, then a little sweetness and orange aroma.', strength: 'strong',
    chooseWhen: ['The guest likes whiskey or strong drinks', 'A slow drink after dinner', 'The guest does not want anything fruity or fizzy'],
    compare: [{ other: 'Whiskey Sour', difference: 'Same whiskey, but with lemon: lighter, fresher and sour.' }, { other: 'Negroni', difference: 'Also stirred and strong, but bitter and made with gin.' }],
    variations: [{ name: 'Rum Old Fashioned', change: 'Aged rum instead of whiskey.' }, { name: 'Oaxaca Old Fashioned', change: 'Tequila and mezcal.' }, { name: 'Wisconsin Old Fashioned', change: 'Brandy and pressed fruit.' }],
    funFact: 'The glass is named after the drink: an “old fashioned glass” is the short, heavy rocks glass used around the world.'
  },
  martini: {
    id: 'martini',
    summary: 'Gin and dry vermouth, stirred until ice-cold. The most famous — and most discussed — cocktail in the world.',
    timeline: [
      { when: '1880s', what: 'The “Martinez” appears: sweet gin with sweet vermouth. It is the Martini’s ancestor.' },
      { when: '1900s', what: 'Drier gin and dry French vermouth create the “Dry Martini”.' },
      { when: '1950s', what: 'Martinis become drier and drier — sometimes almost pure gin.' },
      { when: '1950s–1960s', what: 'In books and films, James Bond orders his Martini “shaken, not stirred”.' }
    ],
    history: 'The Martini grew out of the Martinez, a sweeter 19th-century drink. As tastes changed, bartenders used drier gin and less, drier vermouth. By the mid-20th century the Martini was the symbol of adult, sophisticated drinking in America. People argue about everything: gin or vodka, how much vermouth, olive or lemon twist. The classic answer: gin, a little dry vermouth, stirred, and very cold.',
    preparation: {
      technique: 'stirred', why: 'Stirred because it contains only spirits. Stirring keeps it clear and silky. James Bond’s “shaken” Martini is colder, but cloudier and more watery.',
      glass: 'Chilled martini glass or coupe', ice: 'Stirred with lots of ice, served without ice', garnish: 'Lemon twist or olive',
      steps: ['Add gin and dry vermouth to a mixing glass with ice.', 'Stir for 20–30 seconds until very cold.', 'Strain into a chilled glass.', 'Add a lemon twist or an olive.']
    },
    taste: 'Dry, cold and aromatic, with juniper and herbs. Strong and not sweet at all.', strength: 'strong',
    chooseWhen: ['The guest likes dry, strong drinks', 'Before dinner (an aperitif)', 'An experienced guest who knows what they like'],
    compare: [{ other: 'Negroni', difference: 'Also gin and vermouth, but with bitter aperitif — bitter-sweet instead of dry.' }, { other: 'Espresso Martini', difference: 'Only the name is similar: it is a sweet coffee drink with vodka.' }],
    variations: [{ name: 'Dirty Martini', change: 'A little olive brine.' }, { name: 'Vesper', change: 'Gin, vodka and Lillet (James Bond’s own recipe).' }, { name: 'Wet Martini', change: 'More vermouth, softer taste.' }],
    funFact: 'A “dry” Martini means less vermouth, not less liquid — here “dry” means “not sweet”.'
  },
  'whiskey-sour': {
    id: 'whiskey-sour',
    summary: 'Whiskey, lemon and sugar, shaken — sometimes with egg white for a silky foam. The friendliest whiskey cocktail.',
    timeline: [
      { when: '1862', what: 'Jerry Thomas publishes the first bartender’s guide, with a whole family of “sours”.' },
      { when: '1870', what: 'The name “Whiskey Sour” is printed in a Wisconsin newspaper.' },
      { when: '20th century', what: 'Bars add egg white for foam (the “Boston Sour”).' }
    ],
    history: 'Sailors drank spirit with citrus to protect themselves from scurvy, a disease caused by too little vitamin C. On land, this became the “sour”: spirit, citrus and sugar. The Whiskey Sour is the most famous member of the family. In the 20th century many bars used a ready-made “sour mix”, but modern bars use fresh lemon again — and the difference is huge.',
    preparation: {
      technique: 'shaken', why: 'Shaken because of lemon juice. With egg white, bartenders first shake without ice (a “dry shake”) to build foam, then shake again with ice.',
      glass: 'Rocks glass or coupe', ice: 'Over fresh ice, or straight up', garnish: 'Orange slice and cherry',
      steps: ['Add whiskey, lemon juice and sugar syrup to a shaker.', 'Shake hard with ice.', 'Strain into a rocks glass over fresh ice.', 'Garnish with orange.']
    },
    taste: 'Balanced sweet and sour, warm from the whiskey, fresh from the lemon.', strength: 'medium',
    chooseWhen: ['The guest wants whiskey but not too strong', 'The guest likes sweet-and-sour', 'A first whiskey cocktail for a beginner'],
    compare: [{ other: 'Old Fashioned', difference: 'Same whiskey, but no citrus: stronger and richer.' }, { other: 'Daiquiri', difference: 'Same sour structure with rum and lime.' }],
    variations: [{ name: 'Boston Sour', change: 'Egg white for foam.' }, { name: 'New York Sour', change: 'A float of red wine on top.' }, { name: 'Amaretto Sour', change: 'Almond liqueur instead of whiskey.' }],
    funFact: '“Sour” is a whole cocktail family: the Pisco Sour, Amaretto Sour and even the Margarita are relatives.'
  },
  'long-island': {
    id: 'long-island',
    summary: 'Vodka, gin, rum, tequila and orange liqueur with lemon and cola. It looks like iced tea — but contains no tea and a lot of alcohol.',
    timeline: [
      { when: '1920s', what: 'During Prohibition in the USA, people hide alcohol in innocent-looking drinks. Some say the idea starts here.' },
      { when: '1972', what: 'Robert “Rosebud” Butt at the Oak Beach Inn on Long Island, New York, says he created the modern recipe.' },
      { when: '1980s', what: 'It becomes a party classic in bars and clubs.' }
    ],
    history: 'The Long Island Iced Tea is famous for a trick: five different spirits, lemon and a splash of cola make a drink that looks — and even tastes a little — like iced tea. The best-known story names Robert Butt, a bartender on Long Island in 1972, who made it for a cocktail competition. It is popular because it tastes easy, and that is also why it is risky: it is one of the strongest drinks on the menu.',
    preparation: {
      technique: 'shaken', why: 'The spirits and lemon are shaken together; cola is added at the end so it keeps its bubbles.',
      glass: 'Tall highball or Collins glass', ice: 'Filled with ice', garnish: 'Lemon wedge',
      steps: ['Add the five spirits, lemon juice and sugar to a shaker.', 'Shake briefly with ice.', 'Strain into a tall glass full of ice.', 'Top with a splash of cola.']
    },
    taste: 'Sweet-sour and citrusy with a light cola taste. It hides its strength well.', strength: 'strong',
    chooseWhen: ['A party or celebration', 'An experienced guest who wants a strong, easy drink'],
    compare: [{ other: 'Mojito', difference: 'Also long and fizzy, but much lighter and fresher.' }],
    variations: [{ name: 'Long Beach Iced Tea', change: 'Cranberry juice instead of cola.' }, { name: 'Tokyo Iced Tea', change: 'Melon liqueur and lemon-lime soda.' }],
    funFact: 'A responsible bartender tells guests how strong it is — it contains about as much alcohol as three or four normal drinks.'
  },
  'gin-tonic': {
    id: 'gin-tonic',
    summary: 'Gin and tonic water over ice with lime. Simple, bitter-fresh and one of the most popular drinks in the world.',
    timeline: [
      { when: 'Early 1800s', what: 'In British India, quinine (from the bark of the cinchona tree) is used to fight malaria. It is very bitter.' },
      { when: '1850s–1870s', what: 'Sweetened “tonic water” with quinine is sold. British officers add gin to make it taste better.' },
      { when: '2000s', what: 'Spain starts a “gin-tonic” revolution: big balloon glasses, premium gins and creative garnishes.' }
    ],
    history: 'The G&T began as medicine. Quinine protected soldiers and officials in India from malaria, but it was terribly bitter. Mixing it with water, sugar, lime and gin made it much nicer to drink — and a classic was born. Modern tonic has much less quinine, but its bitterness is still what makes the drink special. Today there are thousands of gins and dozens of tonics, and bartenders pair them like food and wine.',
    preparation: {
      technique: 'built', why: 'Built in the glass. Tonic is poured gently down a spoon or the side of the glass to keep the bubbles.',
      glass: 'Highball or big balloon (copa) glass', ice: 'Lots of large, cold ice cubes — more ice means slower melting and less water in the drink.', garnish: 'Lime wedge (or a garnish that matches the gin’s botanicals)',
      steps: ['Fill the glass with ice.', 'Add the gin.', 'Pour cold tonic gently down the side.', 'Garnish with lime and stir once, very gently.']
    },
    taste: 'Fresh, dry and slightly bitter, with herbal gin aromas and lively bubbles.', strength: 'light',
    chooseWhen: ['The guest wants something refreshing and not sweet', 'Before dinner', 'The guest likes herbal or bitter flavours'],
    compare: [{ other: 'Moscow Mule', difference: 'Also a spirit with a fizzy mixer, but sweeter and spicy from ginger.' }, { other: 'Negroni', difference: 'Also gin and bitterness, but much stronger and without bubbles.' }],
    variations: [{ name: 'Pink G&T', change: 'Pink gin or a little berry syrup.' }, { name: 'Gin & Grapefruit', change: 'Grapefruit tonic or a grapefruit slice.' }, { name: 'Virgin G&T', change: 'Non-alcoholic gin.' }],
    funFact: 'Tonic water glows blue under ultraviolet light because of the quinine.'
  },
  negroni: {
    id: 'negroni',
    summary: 'Equal parts gin, bitter aperitif and sweet vermouth, stirred and served over ice with orange. The king of Italian aperitivo.',
    timeline: [
      { when: '1860s', what: 'In Milan, bitter Campari and sweet vermouth are mixed with soda: the “Americano”.' },
      { when: 'Around 1919', what: 'In Florence, Count Camillo Negroni asks bartender Fosco Scarselli to make his Americano stronger: gin instead of soda.' },
      { when: '2013', what: 'The first “Negroni Week” raises money for charity in bars around the world.' }
    ],
    history: 'According to the most popular story, the Negroni was born at the Caffè Casoni in Florence. Count Negroni wanted his usual Americano “with more power”, so the bartender replaced the soda with gin and changed the lemon garnish to orange, to show it was a different drink. Some historians question parts of the story, but the recipe — three equal parts — became one of the most loved classics in the world.',
    preparation: {
      technique: 'stirred', why: 'Stirred because there is no juice: stirring keeps it smooth and clear. Equal parts make it easy to remember and to balance.',
      glass: 'Rocks glass', ice: 'One large ice cube', garnish: 'Orange peel or slice',
      steps: ['Add gin, bitter aperitif and sweet vermouth to a mixing glass with ice.', 'Stir until cold.', 'Strain over a large ice cube.', 'Garnish with orange.']
    },
    taste: 'Bitter-sweet, strong and herbal, with orange aromas. Bitterness first, sweetness after.', strength: 'strong',
    chooseWhen: ['Before dinner — bitterness wakes up the appetite', 'The guest likes bitter or herbal flavours', 'An experienced guest'],
    compare: [{ other: 'Old Fashioned', difference: 'Also strong and stirred, but sweet whiskey instead of bitter herbs.' }, { other: 'Gin & Tonic', difference: 'Bitter too, but long, light and fizzy.' }],
    variations: [{ name: 'Americano', change: 'Soda water instead of gin — much lighter.' }, { name: 'Boulevardier', change: 'Whiskey instead of gin.' }, { name: 'Negroni Sbagliato', change: 'Sparkling wine instead of gin (“sbagliato” = “mistaken”).' }],
    funFact: 'The Negroni Sbagliato was invented by accident in Milan in the 1970s, when a bartender took sparkling wine instead of gin.'
  },
  'french-75': {
    id: 'french-75',
    summary: 'Gin, lemon and sugar, shaken and topped with sparkling wine. Elegant, fresh and made for celebrations.',
    timeline: [
      { when: '1915', what: 'During the First World War, drinks named after the French 75 mm field gun appear — because they “kick” like it.' },
      { when: '1920s', what: 'Harry MacElhone serves a version at Harry’s New York Bar in Paris.' },
      { when: '1927–1930', what: 'The recipe with gin, lemon and champagne is printed in “Here’s How” and “The Savoy Cocktail Book”.' }
    ],
    history: 'The French 75 is named after a famous French artillery gun from the First World War. The joke was that the drink hits you just as hard. Early versions were very different, but by 1930 the recipe was clear: gin, lemon, sugar and champagne. It is still one of the best celebration drinks — lighter than a Martini and more interesting than plain champagne.',
    preparation: {
      technique: 'shaken', why: 'Gin, lemon and sugar are shaken first (because of the juice). The sparkling wine is added at the end, never shaken, so it keeps its bubbles.',
      glass: 'Champagne flute (or coupe)', ice: 'No ice in the glass', garnish: 'Lemon twist',
      steps: ['Shake gin, lemon juice and sugar with ice.', 'Strain into a flute.', 'Top slowly with cold sparkling wine.', 'Add a lemon twist.']
    },
    taste: 'Bright, dry and lemony with fine bubbles. Stronger than it tastes.', strength: 'strong',
    chooseWhen: ['A celebration, birthday or toast', 'The guest likes sparkling wine', 'A light but special drink'],
    compare: [{ other: 'Gin & Tonic', difference: 'Also gin with bubbles, but bitter tonic instead of lemon and wine.' }],
    variations: [{ name: 'French 76', change: 'Vodka instead of gin.' }, { name: 'French 95', change: 'Bourbon instead of gin.' }],
    funFact: 'Some early recipes used cognac, not gin — both versions are still served today.'
  },
  'moscow-mule': {
    id: 'moscow-mule',
    summary: 'Vodka, lime and ginger beer, served in a cold copper mug. Spicy, fresh and fizzy.',
    timeline: [
      { when: '1941', what: 'At the Cock ’n’ Bull bar in Los Angeles, a vodka seller and a ginger-beer maker look for a way to sell their products.' },
      { when: '1940s–1950s', what: 'Photos of bartenders with the drink and its copper mug help sell vodka to Americans.' },
      { when: '2010s', what: 'Copper mugs become fashionable again.' }
    ],
    history: 'The Moscow Mule is a clever piece of marketing. In the 1940s few Americans drank vodka. John G. Martin, who sold Smirnoff vodka, and Jack Morgan, who made a ginger beer that nobody bought, created a drink together. The popular story adds a woman selling copper mugs. The name joins “Moscow” (for vodka) and “mule” (because ginger beer “kicks”). It helped make vodka a best-selling spirit in the USA.',
    preparation: {
      technique: 'built', why: 'Built in the mug because ginger beer is fizzy. The copper mug gets very cold and keeps the drink cold.',
      glass: 'Copper mug (or highball glass)', ice: 'Filled with ice', garnish: 'Lime wedge (and mint)',
      steps: ['Fill the mug with ice.', 'Add vodka and fresh lime juice.', 'Top with ginger beer.', 'Garnish with lime.']
    },
    taste: 'Spicy ginger, fresh lime and a clean vodka base. Fizzy and refreshing.', strength: 'light',
    chooseWhen: ['The guest wants something fresh with a little spice', 'A hot day', 'The guest likes vodka but not sweet drinks'],
    compare: [{ other: 'Mojito', difference: 'Also long and fresh, but herbal mint instead of spicy ginger.' }, { other: 'Paloma', difference: 'Also long and fizzy, but tequila and grapefruit.' }],
    variations: [{ name: 'Dark ’n’ Stormy', change: 'Dark rum instead of vodka.' }, { name: 'Mexican Mule', change: 'Tequila.' }, { name: 'Kentucky Mule', change: 'Bourbon.' }],
    funFact: 'Ginger beer is usually non-alcoholic today, despite the word “beer”. It is spicier than ginger ale.'
  },
  'espresso-martini': {
    id: 'espresso-martini',
    summary: 'Vodka, coffee liqueur and fresh espresso, shaken until foamy. A modern classic from London.',
    timeline: [
      { when: 'Early 1980s', what: 'Bartender Dick Bradsell creates it in London. A guest asks for a drink that will “wake me up”.' },
      { when: '1990s', what: 'Called “Vodka Espresso” and later “Pharmaceutical Stimulant”, it finally gets its famous name.' },
      { when: '2020s', what: 'It becomes one of the most ordered cocktails in the world.' }
    ],
    history: 'The Espresso Martini is one of the few modern cocktails with a clear inventor: Dick Bradsell, one of London’s most important bartenders. The coffee machine was right next to his station, so he mixed fresh espresso with vodka, coffee liqueur and sugar. It is not a real Martini — in the 1980s and 1990s many drinks served in a martini glass were called “something-tini”.',
    preparation: {
      technique: 'shaken', why: 'Shaken very hard: the natural oils in fresh espresso make a thick, creamy foam on top. Old or cold coffee does not foam well.',
      glass: 'Chilled coupe or martini glass', ice: 'Shaken with ice, served without ice', garnish: 'Three coffee beans (for health, wealth and happiness)',
      steps: ['Make a fresh espresso.', 'Add vodka, coffee liqueur and espresso to a shaker.', 'Shake very hard with ice.', 'Strain into a coupe and place three coffee beans on the foam.']
    },
    taste: 'Rich coffee, a little sweet, with velvety foam.', strength: 'medium',
    chooseWhen: ['After dinner, instead of dessert and coffee', 'The guest loves coffee', 'The guest wants a rich, sweet drink'],
    compare: [{ other: 'Martini', difference: 'Only the glass is the same — the Martini is dry and strong, with no coffee.' }, { other: 'Piña Colada', difference: 'Both are dessert-like, but coffee and bitter-sweet instead of tropical.' }],
    variations: [{ name: 'Espresso Tonic (no alcohol)', change: 'Espresso over tonic and ice.' }, { name: 'Tequila Espresso Martini', change: 'Tequila instead of vodka.' }],
    funFact: 'Coffee does not make alcohol weaker. A guest can feel awake and still be drunk — good bartenders keep this in mind.'
  }
};
