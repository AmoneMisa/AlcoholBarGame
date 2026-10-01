// Cocktails that are tied to a specific brand — by trademark, by their original recipe, or by strong tradition.
// `category` is the brand list the brand lives in (for its description and bottle model).

export type SignatureReason = 'trademark' | 'original' | 'official' | 'classic';
export interface SignatureBrand {
  brand: string;
  category: string;
  ingredientId?: string;
  reason: SignatureReason;
  note: string;
}

export const SIGNATURE_REASON_LABEL: Record<SignatureReason, string> = {
  trademark: 'Registered trademark', original: 'Original recipe', official: 'Official brand', classic: 'Classic choice'
};

export const SIGNATURE_BRANDS: Record<string, SignatureBrand[]> = {
  'dark-stormy': [{ brand: 'Gosling’s', category: 'dark-rum', ingredientId: 'dark-rum', reason: 'trademark', note: 'Gosling’s owns the “Dark ’n’ Stormy” trademark: officially the drink must be made with Gosling’s Black Seal rum.' }],
  painkiller: [{ brand: 'Pusser’s', category: 'dark-rum', ingredientId: 'dark-rum', reason: 'trademark', note: 'Pusser’s registered the Painkiller name, and its British Navy-style rum is the official base.' }],
  negroni: [{ brand: 'Campari', category: 'bitter-aperitif', ingredientId: 'bitter-aperitif', reason: 'original', note: 'The Negroni was born from the Americano, made with Campari in Florence; most bars still use it.' }],
  americano: [
    { brand: 'Campari', category: 'bitter-aperitif', ingredientId: 'bitter-aperitif', reason: 'original', note: 'The drink began in Gaspare Campari’s café as the “Milano–Torino”.' },
    { brand: 'Martini & Rossi', category: 'vermouth', ingredientId: 'vermouth', reason: 'classic', note: 'A sweet Turin vermouth — the “Torino” half of the original name.' }
  ],
  boulevardier: [{ brand: 'Campari', category: 'bitter-aperitif', ingredientId: 'bitter-aperitif', reason: 'original', note: 'The 1927 recipe uses Campari, like the Negroni.' }],
  'negroni-sbagliato': [{ brand: 'Campari', category: 'bitter-aperitif', ingredientId: 'bitter-aperitif', reason: 'original', note: 'Bar Basso in Milan makes it with Campari, sweet vermouth and sparkling wine.' }],
  'jungle-bird': [{ brand: 'Campari', category: 'bitter-aperitif', ingredientId: 'bitter-aperitif', reason: 'original', note: 'The 1978 Kuala Lumpur recipe uses Campari for its bitter edge.' }],
  'aperol-spritz': [
    { brand: 'Aperol', category: 'bitter-aperitif', ingredientId: 'bitter-aperitif', reason: 'original', note: 'The orange “Aperol Spritz” is named after the brand; the classic 3-2-1: three prosecco, two Aperol, one soda.' },
    { brand: 'Mionetto', category: 'sparkling-wine', ingredientId: 'sparkling-wine', reason: 'classic', note: 'A dry prosecco from the Veneto, the spritz’s home region.' }
  ],
  'paper-plane': [
    { brand: 'Aperol', category: 'bitter-aperitif', ingredientId: 'bitter-aperitif', reason: 'original', note: 'Sam Ross’s recipe uses Aperol as the lighter bitter.' },
    { brand: 'Amaro Nonino', category: 'bitter-aperitif', reason: 'original', note: 'The second bitter in the recipe; its caramel-orange taste is hard to replace.' }
  ],
  'espresso-martini': [{ brand: 'Kahlúa', category: 'coffee-liqueur', ingredientId: 'coffee-liqueur', reason: 'classic', note: 'The most common coffee liqueur in bars; modern bars also like less-sweet Mr Black.' }],
  'black-russian': [{ brand: 'Kahlúa', category: 'coffee-liqueur', ingredientId: 'coffee-liqueur', reason: 'classic', note: 'The Black Russian became famous with Kahlúa, the leading coffee liqueur of the time.' }],
  'white-russian': [{ brand: 'Kahlúa', category: 'coffee-liqueur', ingredientId: 'coffee-liqueur', reason: 'classic', note: 'Kahlúa and cream is the classic combination.' }],
  mudslide: [
    { brand: 'Baileys', category: 'cream-liqueur', reason: 'original', note: 'The first Mudslide used Irish cream liqueur instead of fresh cream.' },
    { brand: 'Kahlúa', category: 'coffee-liqueur', ingredientId: 'coffee-liqueur', reason: 'classic', note: 'The coffee part of the drink.' }
  ],
  'lynchburg-lemonade': [{ brand: 'Jack Daniel’s', category: 'whiskey', ingredientId: 'whiskey', reason: 'original', note: 'Named after Lynchburg, Tennessee — the home of Jack Daniel’s.' }],
  'mint-julep': [
    { brand: 'Old Forester', category: 'whiskey', ingredientId: 'whiskey', reason: 'official', note: 'The official Mint Julep of the Kentucky Derby is made with Old Forester.' },
    { brand: 'Woodford Reserve', category: 'whiskey', ingredientId: 'whiskey', reason: 'official', note: 'The official bourbon of the Kentucky Derby, used for its premium juleps.' }
  ],
  sazerac: [{ brand: 'Sazerac Rye', category: 'whiskey', ingredientId: 'whiskey', reason: 'classic', note: 'A rye named after the drink; the classic also needs Peychaud’s bitters.' }],
  'whiskey-highball': [{ brand: 'Hibiki', category: 'whiskey', ingredientId: 'whiskey', reason: 'classic', note: 'Japanese bars made the highball famous with Suntory whiskies such as Kakubin and Hibiki.' }],
  'moscow-mule': [{ brand: 'Smirnoff', category: 'vodka', ingredientId: 'vodka', reason: 'original', note: 'The drink was created in 1941 to sell Smirnoff vodka in America.' }],
  cosmopolitan: [
    { brand: 'Absolut', category: 'vodka', ingredientId: 'vodka', reason: 'original', note: 'The 1980s–90s recipes used Absolut Citron, a lemon-flavoured vodka.' },
    { brand: 'Cointreau', category: 'orange-liqueur', ingredientId: 'orange-liqueur', reason: 'classic', note: 'The classic orange liqueur for a Cosmo.' }
  ],
  margarita: [{ brand: 'Cointreau', category: 'orange-liqueur', ingredientId: 'orange-liqueur', reason: 'classic', note: 'Most classic Margarita recipes ask for Cointreau; Grand Marnier makes a richer “Cadillac Margarita”.' }],
  'white-lady': [{ brand: 'Cointreau', category: 'orange-liqueur', ingredientId: 'orange-liqueur', reason: 'classic', note: 'The 1929 Paris version used Cointreau.' }],
  kamikaze: [{ brand: 'Cointreau', category: 'orange-liqueur', ingredientId: 'orange-liqueur', reason: 'classic', note: 'A clean triple sec keeps it crisp.' }],
  mojito: [{ brand: 'Havana Club', category: 'white-rum', ingredientId: 'white-rum', reason: 'classic', note: 'In Havana the Mojito is made with Cuban rum like Havana Club 3 Años; Bacardí is the classic outside Cuba.' }],
  daiquiri: [{ brand: 'Bacardí', category: 'white-rum', ingredientId: 'white-rum', reason: 'classic', note: 'Bacardí’s light Cuban-style rum made the Daiquiri famous in the early 20th century.' }],
  'cuba-libre': [{ brand: 'Bacardí', category: 'white-rum', ingredientId: 'white-rum', reason: 'classic', note: 'The brand tells the story of the first Cuba Libre with Bacardí around 1900.' }],
  'mai-tai': [{ brand: 'Wray & Nephew', category: 'white-rum', reason: 'original', note: 'Trader Vic’s 1944 Mai Tai used a 17-year-old J. Wray & Nephew rum — so rare today that bartenders blend other Jamaican rums instead.' }],
  'planters-punch': [{ brand: 'Myers’s', category: 'dark-rum', ingredientId: 'dark-rum', reason: 'classic', note: 'Myers’s promoted its dark Jamaican rum with the planter’s punch recipe.' }],
  'gin-tonic': [{ brand: 'Tanqueray', category: 'gin', ingredientId: 'gin', reason: 'classic', note: 'A classic London dry gin for a G&T; with Hendrick’s, use cucumber instead of lime.' }],
  'tom-collins': [{ brand: 'Hayman’s', category: 'gin', ingredientId: 'gin', reason: 'original', note: 'The original Tom Collins used sweet “Old Tom” gin, the style Hayman’s brought back.' }],
  vesper: [
    { brand: 'Gordon’s', category: 'gin', ingredientId: 'gin', reason: 'original', note: 'In the 1953 novel, James Bond asks for Gordon’s gin.' },
    { brand: 'Lillet', category: 'vermouth', ingredientId: 'vermouth', reason: 'original', note: 'Bond’s recipe uses Kina Lillet; today Lillet Blanc is used.' }
  ],
  'corpse-reviver-2': [{ brand: 'Lillet', category: 'vermouth', ingredientId: 'vermouth', reason: 'original', note: 'The Savoy recipe uses Lillet (Kina Lillet at the time).' }],
  'french-75': [{ brand: 'Moët & Chandon', category: 'sparkling-wine', ingredientId: 'sparkling-wine', reason: 'classic', note: 'Any dry champagne works; the recipe was created in Paris with champagne.' }],
  'old-cuban': [{ brand: 'Moët & Chandon', category: 'sparkling-wine', ingredientId: 'sparkling-wine', reason: 'classic', note: 'Topped with dry champagne.' }],
  'french-martini': [{ brand: 'Chambord', category: 'specialty-liqueur', reason: 'original', note: 'The original uses Chambord black raspberry liqueur — that is why it is “French”.' }],
  'hugo-spritz': [{ brand: 'St-Germain', category: 'specialty-liqueur', reason: 'classic', note: 'Many bars use St-Germain elderflower liqueur instead of elderflower syrup.' }],
  gimlet: [{ brand: 'Plymouth', category: 'gin', ingredientId: 'gin', reason: 'classic', note: 'Navy history: Plymouth gin and lime cordial were the British Navy combination.' }],
  'rob-roy': [{ brand: 'Johnnie Walker', category: 'whiskey', ingredientId: 'whiskey', reason: 'classic', note: 'A blended Scotch like Johnnie Walker Black is the usual choice.' }],
  'rusty-nail': [{ brand: 'Drambuie', category: 'herbal-liqueur', ingredientId: 'herbal-liqueur', reason: 'original', note: 'The drink is built on Drambuie, the honeyed Scotch liqueur; without it there is no Rusty Nail.' }],
  'blue-lagoon': [{ brand: 'Bols', category: 'blue-curacao', ingredientId: 'blue-curacao', reason: 'classic', note: 'Bols made blue curaçao famous, and it is the usual choice for this drink.' }],
  'blue-hawaii': [{ brand: 'Bols', category: 'blue-curacao', ingredientId: 'blue-curacao', reason: 'original', note: 'The drink was created in 1957 to show off Bols blue curaçao.' }],
  'last-word': [
    { brand: 'Chartreuse', category: 'herbal-liqueur', ingredientId: 'herbal-liqueur', reason: 'original', note: 'The original equal-parts recipe uses green Chartreuse.' },
    { brand: 'Luxardo Maraschino', category: 'specialty-liqueur', ingredientId: 'specialty-liqueur', reason: 'original', note: 'A dry cherry-and-almond liqueur from Italy, the classic choice for maraschino.' }
  ],
  bijou: [{ brand: 'Chartreuse', category: 'herbal-liqueur', ingredientId: 'herbal-liqueur', reason: 'original', note: 'The “emerald” of the three jewels is green Chartreuse.' }],
  martinez: [{ brand: 'Luxardo Maraschino', category: 'specialty-liqueur', ingredientId: 'specialty-liqueur', reason: 'classic', note: 'A small spoon of maraschino gives the drink its old-fashioned depth.' }],
  'singapore-sling': [
    { brand: 'Bénédictine', category: 'herbal-liqueur', ingredientId: 'herbal-liqueur', reason: 'original', note: 'The classic Raffles-style recipes use Bénédictine for the herbal sweetness.' },
    { brand: 'Cherry Heering', category: 'specialty-liqueur', ingredientId: 'specialty-liqueur', reason: 'original', note: 'A Danish cherry liqueur that gives the sling its red-pink colour.' }
  ],
  'ti-punch': [{ brand: 'Clément', category: 'white-rum', ingredientId: 'white-rum', reason: 'classic', note: 'Rhum agricole from Martinique, made from fresh cane juice, is the traditional spirit.' }],
  'queens-park-swizzle': [{ brand: 'Angostura', category: 'bitter-aperitif', ingredientId: 'bitter-aperitif', reason: 'classic', note: 'Angostura bitters are made in Trinidad, the home of the drink.' }],
  'champagne-cocktail': [{ brand: 'Angostura', category: 'bitter-aperitif', ingredientId: 'bitter-aperitif', reason: 'original', note: 'The classic recipe soaks a sugar cube in Angostura bitters.' }],
  manhattan: [{ brand: 'Carpano Antica Formula', category: 'vermouth', ingredientId: 'vermouth', reason: 'classic', note: 'A rich Turin vermouth that many bartenders prefer in a Manhattan.' }]
};
