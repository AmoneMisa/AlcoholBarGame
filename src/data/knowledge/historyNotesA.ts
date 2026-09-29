// Hand-written history for the extended recipe list (gin, vodka and coffee drinks).
// Disputed origins are described as disputed. `realRecipe` explains where the game simplifies the classic.

export interface HistoryNote {
  timeline: { when: string; what: string }[];
  history: string;
  variations?: { name: string; change: string }[];
  realRecipe?: string;
  funFact: string;
}

export const HISTORY_NOTES_A: Record<string, HistoryNote> = {
  'cuba-libre': {
    timeline: [{ when: 'Around 1900', what: 'After the Spanish–American War, American soldiers and cola arrive in Cuba.' }, { when: 'Early 1900s', what: 'Rum, cola and lime are mixed and toasted with “¡Por Cuba libre!” — “For a free Cuba!”.' }, { when: '1945', what: 'The song “Rum and Coca-Cola” makes the drink famous in the USA.' }],
    history: 'The Cuba Libre was born when American cola met Cuban rum after the war of 1898. Its name was a popular toast of the Cuban independence movement. The lime is what makes it a cocktail and not just “rum and cola”: it cuts the sweetness and adds freshness.',
    variations: [{ name: 'Cuba Pintada', change: 'Mostly soda water with a splash of cola — lighter.' }], funFact: 'Without the lime, bartenders simply call it a “rum and Coke”.'
  },
  'dark-stormy': {
    timeline: [{ when: 'Early 1800s', what: 'British sailors bring ginger beer and rum to Bermuda.' }, { when: 'After the First World War', what: 'Sailors in Bermuda mix dark rum with local ginger beer.' }, { when: '1991', what: 'Gosling’s rum registers “Dark ’n’ Stormy” as a trademark.' }],
    history: 'The story says a sailor looked at the drink and said it was “the colour of a cloud only a fool or a dead man would sail under”. It is Bermuda’s national drink. The dark rum is poured last so it floats on top like a storm cloud.',
    variations: [{ name: 'Moscow Mule', change: 'Vodka instead of dark rum.' }], funFact: 'It is one of the few cocktails with a legal trademark — officially it must use Gosling’s rum.'
  },
  'tom-collins': {
    timeline: [{ when: '1874', what: 'The “Tom Collins hoax”: New Yorkers tell friends that a man called Tom Collins is saying bad things about them.' }, { when: '1876', what: 'Jerry Thomas prints the Tom Collins recipe.' }, { when: '20th century', what: 'The tall “Collins glass” is named after the drink.' }],
    history: 'The Collins may come from John Collins, a waiter at Limmer’s Hotel in London who served a gin punch. In 1874 a famous joke in New York — “Have you seen Tom Collins?” — made the name popular. Originally it used sweet “Old Tom” gin. It is a gin sour made long with soda.',
    variations: [{ name: 'John Collins', change: 'Whiskey instead of gin.' }, { name: 'Vodka Collins', change: 'Vodka instead of gin.' }], funFact: 'The difference between a Collins and a Fizz: a Collins is served over ice in a tall glass, a Fizz usually without ice and with less soda.'
  },
  'gin-fizz': {
    timeline: [{ when: '1876', what: 'Fizzes appear in Jerry Thomas’ bartender guide.' }, { when: '1888', what: 'Henry Ramos creates the Ramos Gin Fizz in New Orleans.' }, { when: 'Early 1900s', what: 'Fizzes are hugely popular brunch drinks in America.' }],
    history: 'The fizz is a sour shaken hard and topped with a little soda water. In New Orleans, Henry Ramos made a famous version with cream, egg white and orange-flower water; his bar hired many “shaker boys” to shake it for minutes.',
    variations: [{ name: 'Silver Fizz', change: 'With egg white.' }, { name: 'Ramos Gin Fizz', change: 'With cream, egg white and orange-flower water.' }], funFact: 'The soda is poured last, and the drink is served without ice so the fizz rises to the top.'
  },
  gimlet: {
    timeline: [{ when: '1867', what: 'British law requires ships to carry lime juice against scurvy; Lauchlin Rose patents preserved lime cordial.' }, { when: 'Late 1800s', what: 'Navy officers mix their gin with lime cordial.' }, { when: '1953', what: 'Raymond Chandler’s novel “The Long Goodbye” makes the Gimlet famous.' }],
    history: 'The Gimlet came from the British Navy: sailors needed lime against scurvy, and officers added gin. Its name may come from Surgeon Thomas Gimlette or from the “gimlet” tool used to open barrels. Modern bars usually use fresh lime and syrup instead of cordial.',
    realRecipe: 'The original uses lime cordial; here fresh lime and sugar syrup make the modern version.', variations: [{ name: 'Vodka Gimlet', change: 'Vodka instead of gin.' }], funFact: 'Chandler wrote that a real Gimlet is “half gin and half Rose’s Lime Juice and nothing else”.'
  },
  southside: {
    timeline: [{ when: 'Early 1900s', what: 'The Southside appears at clubs like the Southside Sportsmen’s Club on Long Island.' }, { when: '1920s', what: 'Legends link it to gangsters of Chicago’s South Side during Prohibition.' }],
    history: 'The Southside is a gin sour with fresh mint — like a Mojito made with gin, without soda. Chicago gangster stories are popular but not proven; the drink was served at Long Island and New York clubs, including the famous 21 Club.',
    variations: [{ name: 'Southside Fizz', change: 'Topped with soda.' }], funFact: 'Mint is shaken with the drink, then the drink is double-strained so no little leaves reach the glass.'
  },
  'gin-rickey': {
    timeline: [{ when: '1880s', what: 'At Shoomaker’s bar in Washington, D.C., bartender George Williamson creates the Rickey for lobbyist Colonel Joe Rickey.' }, { when: '1890s', what: 'The gin version becomes more popular than the original whiskey Rickey.' }, { when: '2011', what: 'The Rickey is named the official cocktail of Washington, D.C.' }],
    history: 'Colonel Joe Rickey wanted a drink without sugar, so the first Rickey was simply spirit, lime and soda. It was a perfect drink for hot Washington summers. It is still one of the driest, least sweet highballs on the menu.',
    variations: [{ name: 'Whiskey Rickey', change: 'The original version.' }], funFact: 'A true Rickey has no sugar — ideal for guests who ask for a low-sugar drink.'
  },
  'bees-knees': {
    timeline: [{ when: '1920s', what: '“The bee’s knees” is slang for “the best”.' }, { when: '1929', what: 'A recipe credited to Frank Meier of the Ritz in Paris appears in print.' }],
    history: 'The Bee’s Knees is gin, lemon and honey. A popular story says honey and lemon hid the taste of bad Prohibition gin, but good bartenders in Paris also made it. The name comes from 1920s slang meaning “excellent”.',
    realRecipe: 'The classic uses honey syrup; here sugar syrup keeps the balance.', variations: [{ name: 'Gold Rush', change: 'Whiskey instead of gin.' }], funFact: 'Honey is too thick for cold drinks, so bartenders mix it with warm water first.'
  },
  'white-lady': {
    timeline: [{ when: '1919', what: 'Harry MacElhone creates a White Lady in London — first with crème de menthe.' }, { when: '1929', what: 'At Harry’s New York Bar in Paris he changes it to gin, orange liqueur and lemon.' }, { when: '1930', what: 'The Savoy Hotel publishes the gin version.' }],
    history: 'The White Lady is the gin member of the “Sidecar” family: spirit, orange liqueur and lemon. Harry MacElhone made the famous version in Paris. It is elegant, dry and citrusy — a good choice before dinner.',
    variations: [{ name: 'Sidecar', change: 'Cognac instead of gin.' }, { name: 'Margarita', change: 'Tequila and lime.' }], funFact: 'Many bartenders add egg white for a silky, white foam — that is how it got its name in some stories.'
  },
  'pegu-club': {
    timeline: [{ when: '1920s', what: 'The Pegu Club in Rangoon (now Yangon, Myanmar), a club for British officers, makes it its house drink.' }, { when: '1927', what: 'The recipe appears in “Barflies and Cocktails”.' }, { when: '2005', what: 'Audrey Saunders names her famous New York bar “Pegu Club”.' }],
    history: 'The Pegu Club was a gentlemen’s club in colonial Burma. Its gin, orange liqueur and lime cocktail travelled around the world with British officers. It almost disappeared, until the craft-cocktail movement brought it back.',
    funFact: 'A few dashes of bitters are part of the original — they give depth to the citrus.'
  },
  'corpse-reviver-2': {
    timeline: [{ when: '1800s', what: '“Corpse revivers” are strong morning drinks, supposedly to cure a hangover.' }, { when: '1930', what: 'Harry Craddock prints the No. 2 in “The Savoy Cocktail Book”.' }],
    history: 'The funny name means “something to wake up the dead” — these drinks were taken in the morning after a long night. The No. 2 uses equal parts gin, orange liqueur, aromatized wine (Lillet) and lemon, with a drop of absinthe. Its famous warning: four of them will un-revive the corpse again!',
    realRecipe: 'The classic uses Lillet Blanc and a rinse of absinthe; here vermouth plays the aromatized-wine role.', funFact: 'Bartenders enjoy it because equal parts are easy to remember: one, one, one, one.'
  },
  vesper: {
    timeline: [{ when: '1953', what: 'Ian Fleming’s first James Bond novel, “Casino Royale”, describes the Vesper.' }, { when: '2006', what: 'The film “Casino Royale” makes it famous again.' }],
    history: 'James Bond invents the Vesper in the novel and names it after the character Vesper Lynd. He asks for gin, vodka and Kina Lillet, shaken until ice-cold, with lemon peel. The original Kina Lillet no longer exists, so bartenders use modern Lillet or similar aperitif wines.',
    realRecipe: 'The book asks for Kina Lillet, shaken; here vermouth is used and the drink is stirred for a clearer texture.', funFact: 'Bond orders three measures of gin — the Vesper is a very strong drink.'
  },
  'vodka-martini': {
    timeline: [{ when: '1950s', what: 'Vodka becomes popular in America and replaces gin in many Martinis.' }, { when: '1960s', what: 'James Bond films make “shaken, not stirred” vodka Martinis famous.' }],
    history: 'The Vodka Martini (also “Kangaroo” in old books) is the clean, neutral cousin of the gin Martini. Without juniper and herbs, you taste mostly cold, smooth spirit and a light aromatic touch from vermouth.',
    variations: [{ name: 'Dirty Vodka Martini', change: 'With olive brine.' }], funFact: 'Temperature is everything here — it should be served as cold as possible.'
  },
  kamikaze: {
    timeline: [{ when: '1970s', what: 'The Kamikaze appears in American bars, often as a shot.' }, { when: '1980s', what: 'It becomes a popular party shooter; bartenders later develop the Cosmopolitan from it.' }],
    history: 'The Kamikaze is a simple vodka sour with orange liqueur and lime — basically a vodka Margarita without salt. It is usually served as a short drink or a shot. The Cosmopolitan is its pink, more elegant descendant.',
    variations: [{ name: 'Cosmopolitan', change: 'Add cranberry.' }], funFact: 'Its equal-parts recipe made it one of the easiest “party shots” to make in large amounts.'
  },
  'lemon-drop': {
    timeline: [{ when: '1970s', what: 'Norman Jay Hobday serves it at Henry Africa’s bar in San Francisco, one of America’s first “fern bars”.' }, { when: '1990s', what: 'It becomes a popular Martini-glass drink.' }],
    history: 'The Lemon Drop was named after a lemon candy. It comes from San Francisco’s “fern bars” — friendly bars with plants and lamps, created for a wider public, including women, at a time when many bars were only for men.',
    variations: [{ name: 'Lemon Drop Shot', change: 'Served as a shot with a sugared lemon slice.' }], funFact: 'The glass rim is often covered with sugar instead of salt.'
  },
  'cape-codder': {
    timeline: [{ when: '1945', what: 'Ocean Spray, a cranberry growers’ group, promotes a vodka and cranberry drink called the “Red Devil”.' }, { when: '1960s', what: 'It gets the name Cape Codder, after Cape Cod in Massachusetts, where cranberries grow.' }],
    history: 'The Cape Codder was created to sell cranberry juice. It is one of the simplest highballs: vodka, cranberry and a squeeze of lime. It started a whole family of “Breeze” drinks.',
    variations: [{ name: 'Sea Breeze', change: 'Add grapefruit.' }, { name: 'Bay Breeze', change: 'Add pineapple.' }], funFact: 'Most bartenders simply call it a “vodka cranberry”.'
  },
  'sea-breeze': {
    timeline: [{ when: '1920s', what: 'An early Sea Breeze uses gin and grenadine.' }, { when: '1970s–1980s', what: 'The modern vodka, cranberry and grapefruit version becomes popular.' }],
    history: 'The name is old but the modern recipe comes from the cranberry-juice marketing of the 1960s–80s. Grapefruit gives it a dry, slightly bitter edge that makes it more refreshing than a Cape Codder.',
    realRecipe: 'The classic uses grapefruit juice; here grapefruit soda gives the same flavour with bubbles.', funFact: 'It was one of the most popular drinks of the 1980s summer beach bars.'
  },
  'bay-breeze': {
    timeline: [{ when: '1980s', what: 'The Bay Breeze (also “Hawaiian Sea Breeze”) appears as a sweeter, tropical version of the Sea Breeze.' }],
    history: 'The Bay Breeze swaps grapefruit for pineapple, so it is sweeter and softer. It belongs to the family of easy vodka-cranberry highballs from the 1980s.',
    funFact: 'Pineapple juice makes a little foam when you stir or shake it — the drink looks lighter on top.'
  },
  madras: {
    timeline: [{ when: '1980s', what: 'The Madras appears on American menus with the Breeze family.' }],
    history: 'The Madras is vodka with cranberry and orange juice. Its name probably comes from the colourful madras cloth from India — red and orange, like the drink.',
    realRecipe: 'The classic uses orange juice; here orange liqueur and soda give the orange note.', funFact: 'It is one of the easiest “first cocktails” for guests who do not like strong alcohol taste.'
  },
  'woo-woo': {
    timeline: [{ when: '1980s', what: 'The Woo Woo becomes a party drink in American and British clubs.' }],
    history: 'A cheerful 1980s drink of vodka, peach schnapps and cranberry. Its funny name is from party slang of the time.',
    realRecipe: 'The classic uses peach schnapps; here orange liqueur gives the fruity accent.', funFact: 'It is the simpler ancestor of Sex on the Beach.'
  },
  'sex-on-the-beach': {
    timeline: [{ when: '1987', what: 'A popular story says a Florida bartender created it for a peach schnapps sales competition during spring break.' }, { when: '1990s', what: 'It becomes one of the best-known holiday cocktails.' }],
    history: 'Sex on the Beach is a fruity holiday drink: vodka, peach schnapps, orange and cranberry. The name was designed to be memorable and a little cheeky — which helped it sell in beach resorts.',
    realRecipe: 'The classic uses peach schnapps and orange juice; here orange liqueur and pineapple juice give the fruit flavour.', funFact: 'Some guests feel shy ordering it by name — a friendly bartender helps without making jokes.'
  },
  'french-martini': {
    timeline: [{ when: 'Late 1980s', what: 'The French Martini appears at Keith McNally’s restaurants in New York.' }, { when: '1990s', what: 'It becomes a star of the “-tini” era of colourful Martini-glass drinks.' }],
    history: 'The French Martini is vodka with pineapple juice and Chambord, a French raspberry liqueur — that is why it is called “French”. Shaking pineapple juice hard makes a beautiful, soft foam on top.',
    realRecipe: 'The classic uses raspberry liqueur (Chambord); here cranberry gives the berry note.', funFact: 'It has nothing in common with a real Martini except the glass.'
  },
  'black-russian': {
    timeline: [{ when: '1949', what: 'Bartender Gustave Tops creates it at the Hotel Metropole in Brussels for the American ambassador Perle Mesta.' }, { when: '1960s', what: 'Adding cream creates the White Russian.' }],
    history: 'The Black Russian was made during the Cold War: “Russian” for the vodka, “black” for the dark coffee liqueur. It is strong, sweet and simple — a classic after-dinner drink.',
    variations: [{ name: 'White Russian', change: 'Topped with cream.' }, { name: 'Espresso Martini', change: 'Add fresh espresso and shake.' }], funFact: 'It has only two ingredients, poured over ice — one of the easiest classics.'
  },
  'white-russian': {
    timeline: [{ when: '1960s', what: 'Cream is added to the Black Russian — the White Russian appears in print in 1965.' }, { when: '1998', what: 'The film “The Big Lebowski” makes it a cult drink.' }],
    history: 'The White Russian is a Black Russian with cream on top — sweet, rich and like a coffee dessert. It became famous again because the main character of “The Big Lebowski” drinks it all the time.',
    realRecipe: 'The classic uses fresh cream; here coconut cream gives the creamy layer.', funFact: 'The cream is floated on top, and the guest stirs it in — it looks beautiful as it mixes.'
  },
  mudslide: {
    timeline: [{ when: '1970s', what: 'The Mudslide is created at the Wreck Bar of the Rum Point Club on Grand Cayman, when a guest asks for a White Russian without cream.' }],
    history: 'The bartender used Irish cream liqueur instead of fresh cream — and the Mudslide was born. Later versions are blended with ice cream and chocolate, like a milkshake for adults.',
    realRecipe: 'The classic uses Irish cream liqueur; here coconut cream gives the creamy texture.', funFact: 'Frozen Mudslides are often decorated with chocolate syrup inside the glass.'
  }
};
