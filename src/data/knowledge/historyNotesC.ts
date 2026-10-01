import type { HistoryNote } from './historyNotesA';

// Hand-written history for sixteen more real cocktails (whiskey, gin, tequila, rum, vodka and sparkling classics).
// Where a history is disputed, the note says so instead of repeating one legend as fact.
// `realRecipe` explains where the game simplifies the classic, as in the other history files.

export const HISTORY_NOTES_C: Record<string, HistoryNote> = {
  'blue-lagoon': {
    timeline: [
      { when: '1960', what: 'Andy MacElhone, son of the famous Harry, creates the drink at Harry’s New York Bar in Paris.' },
      { when: '1960s–1980s', what: 'Bright blue drinks become a symbol of beach holidays and colourful, playful bars.' }
    ],
    history: 'The Blue Lagoon was invented in Paris, at Harry’s New York Bar — the bar that also made the White Lady and other classics famous. It mixes vodka, blue curaçao and lemonade into a glowing blue long drink. The colour comes only from the liqueur, which is flavoured with orange peel and has no blue “taste” of its own.',
    realRecipe: 'The classic tops vodka and blue curaçao with lemonade; here lemon, sugar and soda water build the lemonade.',
    variations: [{ name: 'Blue Hawaii', change: 'Rum, pineapple juice and coconut instead of vodka and lemonade.' }, { name: 'Virgin Lagoon', change: 'Blue syrup with lemonade and no alcohol.' }],
    funFact: 'Curaçao liqueur is naturally colourless. It was dyed blue by producers to make drinks stand out on the bar.'
  },
  'champagne-cocktail': {
    timeline: [
      { when: 'Early 1800s', what: 'The word “cocktail” first means a short drink of spirit, sugar, water and bitters.' },
      { when: '1862', what: 'Jerry Thomas prints a Champagne Cocktail in his famous bartender’s guide.' },
      { when: 'Today', what: 'It is still the classic toast for celebrations and for guests who want something simple.' }
    ],
    history: 'The Champagne Cocktail applies the oldest cocktail formula — sugar, bitters and a spirit — to sparkling wine. A sugar cube soaked in bitters sits at the bottom of a flute, and the wine is poured over it. As the cube slowly dissolves, a thin stream of bubbles rises from it, so the drink changes with every sip.',
    realRecipe: 'The classic uses a sugar cube and Angostura bitters; here a little sugar and bitter aperitif play those parts.',
    variations: [{ name: 'Kir Royale', change: 'Blackcurrant liqueur instead of sugar and bitters.' }, { name: 'Old Cuban', change: 'Adds aged rum, lime and mint under the sparkling wine.' }],
    funFact: 'The rough surface of the sugar cube makes tiny bubbles form on it, like a bubble “fountain” in the glass.'
  },
  'tommys-margarita': {
    timeline: [
      { when: '1965', what: 'Tommy’s Mexican Restaurant opens in San Francisco.' },
      { when: '1990', what: 'Julio Bermejo, the owner’s son, serves a Margarita with agave syrup and no orange liqueur.' },
      { when: '2000s', what: 'Bartenders around the world copy the style, and it becomes a modern standard.' }
    ],
    history: 'Tommy’s Margarita is a modern version of the classic that removes the orange liqueur. Julio Bermejo wanted the taste of good agave tequila to be the star, so he used only tequila, fresh lime juice and agave syrup, which comes from the same plant as the tequila. The result is cleaner, sharper and less sweet than many Margaritas.',
    realRecipe: 'The original uses agave syrup; here sugar syrup gives the sweetness.',
    variations: [{ name: 'Classic Margarita', change: 'Adds orange liqueur and a salted rim.' }, { name: 'Tommy’s Mezcal', change: 'Mezcal instead of tequila for a smoky edge.' }],
    funFact: 'The restaurant became famous for its huge tequila list, and bars still ask for “the Tommy’s way”.'
  },
  batanga: {
    timeline: [
      { when: '1953', what: 'Don Javier Delgado Corona opens La Capilla, a small bar in the town of Tequila, Jalisco.' },
      { when: 'Mid-20th century', what: 'He serves tequila with lime, salt and cola, stirred with a knife — the Batanga.' },
      { when: 'Today', what: 'It is considered the everyday drink of Tequila town and a favourite of Mexican bars.' }
    ],
    history: 'The Batanga was born in the town that gave tequila its name. At La Capilla, Don Javier mixed tequila, lime juice and cola in a tall glass with a salted rim. The part everyone remembers is the stirring tool: he used the same long knife he used to cut the limes. It is a simple highball that proves tequila is not only for shots.',
    realRecipe: 'The classic is built in the glass with a salt rim; here salt is one of the ingredients.',
    variations: [{ name: 'Cuba Libre', change: 'The same style with rum instead of tequila.' }, { name: 'Mezcal Batanga', change: 'Mezcal gives smoke against the sweet cola.' }],
    funFact: 'The area around the town of Tequila is a UNESCO World Heritage site, because of its blue agave fields and old distilleries.'
  },
  'rusty-nail': {
    timeline: [
      { when: '1937', what: 'A Scotch and Drambuie drink is served at a British trade fair; it is later linked to the Rusty Nail.' },
      { when: '1960s', what: 'The Rusty Nail becomes fashionable in New York, where it is linked to the 21 Club and famous entertainers.' },
      { when: 'Today', what: 'It is a simple two-ingredient classic for slow after-dinner drinking.' }
    ],
    history: 'The Rusty Nail has only two ingredients: Scotch whisky and Drambuie, a sweet liqueur made from whisky, honey, herbs and spices. The name may refer to the amber colour of the drink, but its exact origin is unclear. It was popular in the 1960s, when many people drank it with ice after dinner, and it is still one of the easiest ways to introduce a guest to whisky.',
    realRecipe: 'The classic uses Scotch and Drambuie; here whiskey and herbal liqueur play those roles.',
    variations: [{ name: 'Rusty Nail Rocks', change: 'Served over a large ice cube so it stays cold and slowly softens.' }, { name: 'Smoky Nail', change: 'A peaty Islay Scotch gives a smoky edge.' }],
    funFact: 'The name Drambuie comes from Gaelic, “an dram buidheach”, which means “the drink that satisfies”.'
  },
  'whiskey-smash': {
    timeline: [
      { when: '1862', what: 'Jerry Thomas prints smashes in his guide: short drinks of spirit, sugar and mint — close cousins of the Julep.' },
      { when: '2000s', what: 'The craft cocktail revival brings the whiskey version back to menus.' }
    ],
    history: 'A “smash” is a short, fresh drink in the Julep family. Mint and fruit are pressed in the glass — “smashed” — then mixed with spirit and sugar. Early guides used brandy; today bartenders mostly use whiskey with lemon, which makes a drink that is bright, herbal and easy to drink. It is shaken, which gives it a cold, lively texture.',
    realRecipe: 'Bars may muddle real lemon pieces; here lemon juice and mint are used.',
    variations: [{ name: 'Bourbon Smash', change: 'Bourbon for a sweeter, rounder taste.' }, { name: 'Berry Smash', change: 'Fresh blackberries pressed with the mint.' }],
    funFact: 'It has the same mint and sugar as a Julep, but lemon makes it taste more like a whiskey sour.'
  },
  'mamie-taylor': {
    timeline: [
      { when: 'About 1899', what: 'The Mamie Taylor appears in New York; the story says it is named after a popular actress.' },
      { when: 'Early 1900s', what: 'It becomes one of the most ordered drinks in American bars.' },
      { when: '1941', what: 'The Moscow Mule brings ginger beer and lime back, with vodka instead of Scotch.' }
    ],
    history: 'The Mamie Taylor is a tall drink of Scotch whisky, lime juice and ginger beer (early recipes often used ginger ale). In the early 1900s it was one of the most famous highballs in America. Its spicy, cooling mix is an early cousin of the Moscow Mule, which later used vodka and a copper mug instead. The exact bartender who invented it is not known.',
    realRecipe: 'The classic uses Scotch; here whiskey is used, with lime juice and ginger beer.',
    variations: [{ name: 'Moscow Mule', change: 'Vodka instead of Scotch.' }, { name: 'Dark ’n’ Stormy', change: 'Dark rum instead of Scotch.' }],
    funFact: 'Before the Moscow Mule, this was “the” ginger beer cocktail — and many drinkers today have never heard of it.'
  },
  bronx: {
    timeline: [
      { when: 'About 1906', what: 'Johnnie Solon, a bartender at the Waldorf-Astoria hotel in New York, creates the Bronx.' },
      { when: '1910s', what: 'It becomes so popular that it is said to outsell the Martini and the Manhattan.' },
      { when: 'Today', what: 'Craft bars serve it as a fruity, forgotten classic.' }
    ],
    history: 'The Bronx is a gin cocktail with vermouth and fresh orange juice. Johnnie Solon is said to have named it after the Bronx Zoo, because a guest saw “strange animals” after a long night. In the 1910s it was one of the most ordered drinks in New York. It tastes like a Martini made friendlier with fruit.',
    realRecipe: 'The classic uses both dry and sweet vermouth and orange juice; here one vermouth and a fresh orange are used.',
    variations: [{ name: 'Income Tax', change: 'Adds a dash of bitters.' }, { name: 'Golden Bronx', change: 'Adds an egg yolk for a richer drink.' }],
    funFact: 'It is one of the earliest cocktails named after a district of New York, together with the Manhattan.'
  },
  martinez: {
    timeline: [
      { when: '1880s', what: 'A drink called the Martinez appears in American bar guides, including Jerry Thomas’s 1887 edition.' },
      { when: 'Early 1900s', what: 'Recipes use less vermouth and more gin, and the drink turns into the Martini.' },
      { when: '2000s', what: 'Craft bars revive the original, richer version.' }
    ],
    history: 'Many people call the Martinez the grandfather of the Martini. It mixes gin, sweet vermouth and a little maraschino liqueur and is stirred cold. Two stories explain the name: the town of Martinez in California says it was invented there, while another tells how Jerry Thomas made it in San Francisco for a traveller on his way to Martinez. We do not know which story is true, but the recipe is clearly an early form of the Martini.',
    realRecipe: 'The old recipe uses Old Tom gin, bitters and maraschino; here gin, vermouth and a little specialty liqueur are used.',
    variations: [{ name: 'Martini', change: 'Less vermouth, dry vermouth and no liqueur.' }, { name: 'Manhattan', change: 'Whiskey instead of gin — the same structure.' }],
    funFact: 'In the Martinez, vermouth is almost half of the drink — far more than in a modern Martini.'
  },
  bijou: {
    timeline: [
      { when: '1900', what: 'Harry Johnson prints the Bijou in his Bartenders’ Manual.' },
      { when: 'Today', what: 'It is a favourite of bartenders who like herbal, stirred drinks.' }
    ],
    history: 'Bijou means “jewel” in French, and the drink is named for its three colours. Gin stands for the diamond, green Chartreuse for the emerald and red vermouth for the ruby. The three ingredients are used in equal parts and stirred with ice, which gives a strong, herbal drink with a long, spicy finish.',
    realRecipe: 'The classic uses green Chartreuse and sweet vermouth; here herbal liqueur and vermouth play those roles.',
    variations: [{ name: 'Last Word', change: 'Gin, herbal liqueur, maraschino and lime, shaken.' }, { name: 'Negroni', change: 'Replaces the herbal liqueur with a bitter aperitif.' }],
    funFact: 'It is another equal-parts drink: just like the Negroni, it is very easy to remember.'
  },
  'last-word': {
    timeline: [
      { when: 'About 1916', what: 'The Detroit Athletic Club serves the drink; vaudeville performer Frank Fogarty takes it to New York.' },
      { when: '1951', what: 'Ted Saucier prints the recipe in his book Bottoms Up.' },
      { when: 'Early 2000s', what: 'Bartender Murray Stenson brings it back at the Zig Zag Café in Seattle, and it becomes famous again.' }
    ],
    history: 'The Last Word was almost forgotten for 80 years. It uses four ingredients in equal parts: gin, green Chartreuse, maraschino liqueur and lime juice. The flavour is sharp, sweet, herbal and nutty at the same time. Its modern revival started in Seattle, and bartenders loved it so much that it inspired new equal-parts drinks, such as the Paper Plane.',
    realRecipe: 'The classic uses green Chartreuse and maraschino; here herbal liqueur and specialty liqueur play those roles.',
    variations: [{ name: 'Paper Plane', change: 'Bourbon, a bitter aperitif, amaro and lemon in equal parts.' }, { name: 'Final Ward', change: 'Rye whiskey and lemon instead of gin and lime.' }],
    funFact: 'Nobody is sure where the name comes from, but it suits a drink that has the last word in every sip: sharp, sweet and herbal.'
  },
  'blue-hawaii': {
    timeline: [
      { when: '1957', what: 'Harry Yee, a bartender at the Hilton Hawaiian Village in Honolulu, creates the drink for the Dutch brand Bols.' },
      { when: '1961', what: 'Elvis Presley’s film “Blue Hawaii” makes the name known around the world.' }
    ],
    history: 'A sales representative of Bols asked Harry Yee to make a drink that used the company’s blue curaçao. Yee mixed rum, vodka, pineapple juice and coconut cream with the blue liqueur, and the Blue Hawaii looked just like the Pacific. He is also famous for putting orchids on tropical drinks. The cocktail is not named after the film — the drink came first.',
    realRecipe: 'The classic uses sweet-and-sour mix; here coconut cream and pineapple juice give a creamy tropical taste.',
    variations: [{ name: 'Blue Lagoon', change: 'Vodka and lemonade instead of rum and pineapple.' }, { name: 'Blue Hawaiian', change: 'Adds more coconut cream for a creamier, Piña Colada-like drink.' }],
    funFact: 'Yee wanted drinks to look like a holiday, so he put an orchid on almost everything.'
  },
  'ti-punch': {
    timeline: [
      { when: '1800s', what: 'Rum, lime and cane sugar become an everyday drink on the French Caribbean islands.' },
      { when: '1900s', what: 'Rhum agricole, made from fresh sugar cane juice, becomes the standard spirit.' },
      { when: 'Today', what: 'The Ti’ Punch is the classic aperitif of Martinique and Guadeloupe.' }
    ],
    history: 'Ti’ Punch means “little punch” — “Ti’” is short for “petit” in Creole. It is a simple, strong drink: rhum agricole, a piece of lime and a spoon of cane syrup. In the French Caribbean it is often served with the bottle, the lime and the syrup on a tray, and each guest mixes their own. It is less a recipe than a ritual.',
    realRecipe: 'The classic uses rhum agricole and cane syrup; here white rum and sugar syrup are used.',
    variations: [{ name: 'Daiquiri', change: 'Shaken with ice and more lime juice — a cold, short sour.' }, { name: 'Caipirinha', change: 'The Brazilian cousin, with cachaça and muddled lime.' }],
    funFact: 'It is traditionally served without ice, so each person decides how strong the drink is.'
  },
  greyhound: {
    timeline: [
      { when: '1930', what: 'Harry Craddock includes the Greyhound, made with gin and grapefruit juice, in The Savoy Cocktail Book.' },
      { when: '1950s–1970s', what: 'Vodka replaces gin in most bars, and the version with a salted rim is called a Salty Dog.' }
    ],
    history: 'The Greyhound is as simple as a cocktail can be: spirit and grapefruit juice over ice. The first printed recipe used gin, but vodka became the usual base when it became popular in America. It is bitter, fresh and not too sweet. Adding a salt rim turns it into a Salty Dog, and the salt makes the grapefruit taste less bitter.',
    realRecipe: 'The classic uses fresh grapefruit juice; here grapefruit soda gives the same fresh, bitter-sweet taste.',
    variations: [{ name: 'Salty Dog', change: 'A salt rim on the glass.' }, { name: 'Paloma', change: 'Tequila, lime and grapefruit soda.' }],
    funFact: 'The drink is probably named after the bus company, but nobody has proved it.'
  },
  'queens-park-swizzle': {
    timeline: [
      { when: '1920s', what: 'The Queen’s Park Hotel in Port of Spain, Trinidad, is famous for the drink.' },
      { when: '1940s', what: 'American visitors and tiki bartenders carry the recipe around the world.' },
      { when: 'Today', what: 'It is the classic example of the Swizzle family of Caribbean drinks.' }
    ],
    history: 'A “swizzle” is a drink mixed with a special stick, rolled quickly between the hands, which fills the glass with fine crushed ice. The traditional stick was cut from a Caribbean tree branch with small side branches. The Queen’s Park Swizzle is the most famous example: rum, lime, sugar, mint and bitters, with a frosty glass and a layered look. It is like a Mojito with more depth.',
    realRecipe: 'The classic uses Demerara rum and Angostura bitters; here dark rum and bitter aperitif play those roles.',
    variations: [{ name: 'Mojito', change: 'White rum, no bitters, and soda water.' }, { name: 'Bahama Swizzle', change: 'Adds fruit juice for a sweeter, fruitier drink.' }],
    funFact: 'The glass is traditionally filled with crushed ice until frost forms on the outside.'
  },
  'singapore-sling': {
    timeline: [
      { when: 'About 1915', what: 'Ngiam Tong Boon, a bartender at the Long Bar of Raffles Hotel in Singapore, is said to create the Singapore Sling.' },
      { when: '1930s', what: 'The recipe spreads worldwide as travellers carry the story home.' },
      { when: 'Today', what: 'The Long Bar still serves it, and guests famously throw peanut shells on the floor.' }
    ],
    history: 'The Singapore Sling is a famous drink from Raffles Hotel. The story says it was designed as a pink drink that looked like fruit juice, so ladies could drink it in public when cocktails were not thought proper for them. It mixes gin with cherry liqueur, herbal liqueur, orange liqueur, pineapple and lime. The first printed recipes differ a lot, so the “original” is partly legend.',
    realRecipe: 'The classic uses cherry brandy and Bénédictine; here specialty and herbal liqueur play those roles.',
    variations: [{ name: 'Gin Sling', change: 'The simple older drink: gin, sugar, water and lemon.' }, { name: 'Straits Sling', change: 'A drier version with more gin.' }],
    funFact: 'The famous original was supposed to look like a harmless fruit drink — but it contains a lot of gin.'
  }
};
