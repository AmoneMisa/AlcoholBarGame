import type { HistoryNote } from './historyNotesA';

// Hand-written history for the extended recipe list (whiskey, rum and aperitivo drinks).
export const HISTORY_NOTES_B: Record<string, HistoryNote> = {
  boulevardier: {
    timeline: [{ when: '1927', what: 'The drink appears in Harry MacElhone’s book “Barflies and Cocktails”.' }, { when: '1920s', what: 'It is linked to Erskine Gwynne, an American writer in Paris who ran a magazine called “Boulevardier”.' }],
    history: 'The Boulevardier is a Negroni with whiskey instead of gin. It was made in Paris for American writers who lived there during Prohibition. Whiskey makes it warmer, rounder and a little sweeter than a Negroni — perfect for cold evenings.',
    variations: [{ name: 'Old Pal', change: 'Rye whiskey with dry vermouth — drier.' }], funFact: 'A “boulevardier” is a fashionable man about town — someone who strolls the Paris boulevards.'
  },
  manhattan: {
    timeline: [{ when: '1870s–1880s', what: 'The Manhattan appears in New York; one legend places it at the Manhattan Club.' }, { when: '1884', what: 'The recipe is printed in American bartender guides.' }],
    history: 'A popular story says it was made for a party given by Jennie Churchill (Winston Churchill’s mother), but she was in England at that time, so historians doubt it. What is certain: the Manhattan — whiskey, sweet vermouth and bitters — is one of the first cocktails to use vermouth, and the model for the Martini.',
    variations: [{ name: 'Rob Roy', change: 'Scotch whisky.' }, { name: 'Perfect Manhattan', change: 'Half sweet and half dry vermouth.' }], funFact: 'It is stirred, never shaken — and garnished with a cherry or an orange peel.'
  },
  'rob-roy': {
    timeline: [{ when: '1894', what: 'Created at the Waldorf Hotel in New York for the premiere of the operetta “Rob Roy”.' }],
    history: 'Rob Roy was a Scottish folk hero, so the drink uses Scotch whisky. It is a Manhattan made with Scotch — a little drier and sometimes smoky.',
    variations: [{ name: 'Bobby Burns', change: 'Add a little herbal liqueur.' }], funFact: 'Many Scottish bars serve it on Burns Night, the celebration of Scotland’s national poet.'
  },
  'mint-julep': {
    timeline: [{ when: '1700s', what: '“Julep” (from Persian “golab”, rose water) means a sweet medicine drink.' }, { when: 'Early 1800s', what: 'In the American South it becomes a whiskey drink with mint and crushed ice.' }, { when: '1938', what: 'It becomes the official drink of the Kentucky Derby horse race.' }],
    history: 'The Mint Julep is the drink of the American South and of the Kentucky Derby, where more than 100,000 are served every year. It is almost all bourbon, sweetened, with lots of fresh mint and crushed ice, traditionally in a silver cup that becomes covered in frost.',
    variations: [{ name: 'Rum Julep', change: 'Aged rum.' }], funFact: 'You should hold the silver cup at the bottom or by the rim, so your warm hand does not melt the frost.'
  },
  'whiskey-highball': {
    timeline: [{ when: '1890s', what: 'Scotch and soda becomes a fashionable drink in Britain and America.' }, { when: '1950s', what: 'Japanese bars make the highball an art: very cold glass, clear ice, perfect soda.' }, { when: '2008', what: 'Suntory’s “Highball” campaign makes it a hit again in Japan.' }],
    history: 'The highball is the simplest mixed drink: whiskey and soda over ice. In Japan, bartenders prepare it with great care — the glass, ice, whiskey and soda are all very cold, and the soda is poured slowly so it keeps every bubble. It is a light, food-friendly way to drink whisky.',
    funFact: 'Japanese bartenders stir it only once or twice — “thirteen and a half turns” is a famous joke about their precision.'
  },
  'whiskey-ginger': {
    timeline: [{ when: '20th century', what: 'Whiskey with ginger ale becomes an easy bar favourite, especially in Ireland and North America.' }],
    history: 'Ginger and whiskey have always been friends: the spice of ginger matches the warm vanilla of whiskey. With a squeeze of lime it is an easy, refreshing highball for guests who find neat whiskey too strong.',
    variations: [{ name: 'Presbyterian', change: 'Half ginger ale, half soda water.' }], funFact: 'Ginger ale is milder and sweeter; ginger beer is spicier. Use ginger ale for a soft drink, ginger beer for more kick.'
  },
  'lynchburg-lemonade': {
    timeline: [{ when: '1980', what: 'Created by Tony Mason, a restaurant owner in Huntsville, Alabama.' }, { when: 'Later', what: 'A whiskey company uses it in advertising; Mason goes to court and wins.' }],
    history: 'Named after Lynchburg, Tennessee, home of a famous whiskey distillery. It is whiskey, orange liqueur and lemon made long with lemon-lime soda — like a grown-up lemonade.',
    realRecipe: 'The classic uses lemon-lime soda; here soda water plus lemon and syrup gives the same balance.', funFact: 'The creator sued a big whiskey company for using his recipe in ads — and won.'
  },
  'gold-rush': {
    timeline: [{ when: 'Early 2000s', what: 'T.J. Siegal creates it at the famous Milk & Honey bar in New York.' }],
    history: 'The Gold Rush is a modern classic: a whiskey sour with honey instead of sugar. It shows how the new cocktail culture of the 2000s created simple drinks that became famous around the world.',
    realRecipe: 'The classic uses honey syrup; here sugar syrup gives the sweetness.', variations: [{ name: 'Penicillin', change: 'Add ginger and a smoky Scotch float.' }], funFact: 'It is basically a Bee’s Knees with bourbon instead of gin.'
  },
  sazerac: {
    timeline: [{ when: '1830s–1850s', what: 'In New Orleans, Antoine Peychaud makes aromatic bitters; the Sazerac Coffee House serves a cognac cocktail with them.' }, { when: '1870s', what: 'Rye whiskey replaces cognac after a plant disease destroys French vineyards.' }, { when: '2008', what: 'It becomes the official cocktail of New Orleans.' }],
    history: 'The Sazerac is one of America’s oldest cocktails. It is made with rye whiskey, sugar and Peychaud’s bitters, in a glass rinsed with absinthe, and finished with lemon peel — which is squeezed over the drink but not dropped in.',
    realRecipe: 'The classic uses Peychaud’s bitters and an absinthe rinse; here a little bitter aperitif gives the aromatic bitterness.', funFact: 'It is served without ice in a cold glass — one of the few whiskey classics with no ice at all.'
  },
  'paper-plane': {
    timeline: [{ when: '2008', what: 'Sam Ross creates it for The Violet Hour bar in Chicago; it is named after a popular song, “Paper Planes”.' }],
    history: 'The Paper Plane is a modern equal-parts classic: bourbon, a bitter-sweet Italian aperitif, amaro and lemon. It shows the modern love for bitter flavours in cocktails.',
    realRecipe: 'The classic uses Aperol and Amaro Nonino; here bitter aperitif and vermouth play those roles.', funFact: 'Equal parts — four ingredients, same amount each — make it easy to remember.'
  },
  'rum-runner': {
    timeline: [{ when: '1920s', what: '“Rum runners” are smugglers who bring rum from the Caribbean to the USA during Prohibition.' }, { when: '1950s–1970s', what: 'The Holiday Isle Tiki Bar in the Florida Keys creates the drink to use extra stock.' }],
    history: 'The Rum Runner was invented to use bottles the bar had too many of — a common reason for new drinks! It mixes light and dark rum with fruit, and its name remembers the smugglers of Prohibition.',
    funFact: 'Many great cocktails were invented simply because a bar needed to sell extra stock.'
  },
  hurricane: {
    timeline: [{ when: '1940s', what: 'Pat O’Brien’s bar in New Orleans creates it; distributors force bars to buy lots of rum to get whiskey.' }, { when: 'Today', what: 'It is the classic drink of Mardi Gras.' }],
    history: 'After the Second World War, whiskey was hard to get, and bars had to buy many cases of rum. Pat O’Brien’s bar created a big fruity rum drink, served in a glass shaped like a hurricane lamp — the name came from the glass.',
    realRecipe: 'The classic uses passion-fruit syrup; here pineapple and cranberry give the fruity colour.', funFact: 'The curvy glass is named after old storm lamps, not the storm itself.'
  },
  'planters-punch': {
    timeline: [{ when: '1600s', what: '“Punch” (possibly from Hindi “panch”, five) arrives from India with British sailors.' }, { when: '1878', what: 'The name “Planter’s Punch” is printed in a London magazine.' }, { when: '1908', what: 'The famous rhyme is printed: “One of sour, two of sweet, three of strong, and four of weak.”' }],
    history: 'Punch is the grandfather of cocktails — a big bowl of spirit, citrus, sugar, water and spice shared by a group. Planter’s Punch is the Jamaican rum version. The old rhyme gives the recipe: 1 part sour, 2 sweet, 3 strong (rum), 4 weak (water or ice).',
    funFact: 'The word “punch” may come from the Hindi word for “five” — for its five ingredients.'
  },
  zombie: {
    timeline: [{ when: '1934', what: 'Donn Beach creates the Zombie in Hollywood, supposedly for a tired guest before a flight.' }, { when: '1939', what: 'At the New York World’s Fair, it is so popular that bars limit guests to two.' }],
    history: 'The Zombie is one of the strongest tiki drinks: several rums, citrus, fruit syrups and spices. Donn Beach kept the recipe secret with codes, so for decades nobody knew the original. Historian Jeff “Beachbum” Berry finally discovered it in 2007.',
    funFact: 'Many bars still limit it to two per guest — a good example of responsible service.'
  },
  painkiller: {
    timeline: [{ when: '1970s', what: 'Daphne Henderson creates it at the Soggy Dollar Bar on Jost Van Dyke, British Virgin Islands.' }, { when: '1980s', what: 'Pusser’s Rum starts selling it around the world.' }],
    history: 'The Soggy Dollar Bar has no dock, so guests swim to the bar and pay with wet (soggy) dollars. There, the Painkiller was born: dark rum, pineapple, orange, coconut cream and fresh nutmeg on top — a tropical holiday in a glass.',
    realRecipe: 'The classic also has orange juice and grated nutmeg on top.', funFact: 'Bar menus often offer “strengths” No. 2, 3 or 4 — the number of parts of rum.'
  },
  'jungle-bird': {
    timeline: [{ when: '1978', what: 'Jeffrey Ong creates it at the Aviary Bar of the Kuala Lumpur Hilton, Malaysia.' }, { when: '2010s', what: 'Bartenders rediscover it and make it a modern tiki favourite.' }],
    history: 'The Jungle Bird is unusual: a tiki drink with an Italian bitter aperitif. The bitterness balances the sweet pineapple and rich dark rum. It was a welcome drink for hotel guests in Malaysia.',
    funFact: 'It was first served in a glass shaped like a bird.'
  },
  'old-cuban': {
    timeline: [{ when: '2001', what: 'Audrey Saunders creates it at the Beacon restaurant in New York.' }],
    history: 'The Old Cuban is a modern classic that joins a Mojito and a French 75: aged rum, lime, mint and sugar, shaken and topped with champagne. It was created by Audrey Saunders, one of the most influential bartenders of the 2000s.',
    funFact: 'It is served “up” in a coupe, not tall like a Mojito — elegant rather than casual.'
  },
  'el-presidente': {
    timeline: [{ when: '1910s–1920s', what: 'Created in Havana, possibly for Cuban president Mario García Menocal.' }, { when: 'Prohibition', what: 'Americans who travel to Cuba to drink make it famous.' }],
    history: 'El Presidente was Cuba’s most elegant cocktail: light rum stirred with blanc vermouth, orange liqueur and a little grenadine. It was the drink of Havana’s best hotels during Prohibition, when Americans came to Cuba for legal drinks.',
    realRecipe: 'The classic adds a little grenadine for colour.', funFact: 'It is a rare stirred rum drink — most rum cocktails are shaken with juice.'
  },
  'hotel-nacional': {
    timeline: [{ when: '1930', what: 'The Hotel Nacional opens in Havana.' }, { when: '1930s', what: 'Bartender Wil P. Taylor creates the hotel’s special cocktail.' }],
    history: 'Named after the grand Hotel Nacional de Cuba, where film stars and politicians stayed. It is a rum sour with pineapple, lime and apricot liqueur — fresh and tropical but elegant.',
    realRecipe: 'The classic uses apricot liqueur; here orange liqueur gives the fruit liqueur note.', funFact: 'The hotel still serves it today in the same bar.'
  },
  'aperol-spritz': {
    timeline: [{ when: 'Early 1800s', what: 'Austrian soldiers in the Veneto add “a spritz” (a splash) of water to strong local wine.' }, { when: '1919', what: 'The Barbieri brothers create Aperol in Padua.' }, { when: '2000s', what: 'The orange spritz becomes a worldwide symbol of the Italian aperitivo.' }],
    history: 'The spritz started with Austrian soldiers who found Italian wine too strong and asked for a “spritzen” — a splash of water. Later, bitter aperitifs and prosecco were added. The classic recipe is 3-2-1: three parts prosecco, two parts aperitif, one part soda.',
    funFact: 'It is one of the lowest-alcohol cocktails — good for long afternoons and guests who want something light.'
  },
  americano: {
    timeline: [{ when: '1860s', what: 'Gaspare Campari serves the “Milano–Torino” (bitter from Milan, vermouth from Turin) in his café.' }, { when: 'Early 1900s', what: 'Soda is added; American tourists love it, so it is called the “Americano”.' }, { when: '1953', what: 'It is the first drink James Bond orders in the book “Casino Royale”.' }],
    history: 'The Americano is the parent of the Negroni: bitter aperitif, sweet vermouth and soda water. It is light, bitter-sweet and refreshing — a perfect pre-dinner drink for guests who want low alcohol.',
    variations: [{ name: 'Negroni', change: 'Gin instead of soda.' }], funFact: 'The name may also come from “amaricano” — Italian for “made bitter”.'
  },
  'negroni-sbagliato': {
    timeline: [{ when: '1972', what: 'At Bar Basso in Milan, bartender Mirko Stocchetto takes sparkling wine instead of gin by mistake.' }, { when: '2022', what: 'A viral video makes it one of the most talked-about drinks of the year.' }],
    history: '“Sbagliato” means “mistaken” in Italian. The guest liked the mistake, and a new classic was born: bitter aperitif, sweet vermouth and sparkling wine. It is lighter and more festive than a Negroni.',
    funFact: 'Bar Basso serves it in a giant glass with a huge ice cube.'
  },
  'hugo-spritz': {
    timeline: [{ when: '2005', what: 'Roland Gruber creates the Hugo in South Tyrol, northern Italy.' }, { when: '2010s', what: 'It spreads through Austria, Germany and Switzerland as a summer spritz.' }],
    history: 'The Hugo is an alpine spritz: prosecco, elderflower syrup, soda, fresh mint and lime. It was created as an alternative to the orange spritz and quickly became a summer favourite in central Europe.',
    realRecipe: 'The classic uses elderflower syrup; here sugar syrup with mint and lime keeps it fresh.', funFact: 'The creator first used lemon balm syrup, but elderflower was easier to find — and it became the standard.'
  }
};
