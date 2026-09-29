import type { BrandNote } from './brandsA';

export const BRANDS_B: Record<string, BrandNote[]> = {
  whiskey: [
    { name: 'Jack Daniel’s', from: 'Lynchburg, Tennessee, USA', since: '1866', description: 'The world’s best-selling American whiskey. It is “Tennessee whiskey”: filtered through maple charcoal before ageing, which makes it smooth and sweet. Old No. 7 is the famous black label.' },
    { name: 'Jim Beam', from: 'Kentucky, USA', since: '1795 (family)', description: 'One of the best-selling bourbons in the world, made by the same family for seven generations. Sweet vanilla and oak; great for cocktails and highballs.' },
    { name: 'Maker’s Mark', from: 'Kentucky, USA', since: '1953', description: 'A bourbon with wheat instead of rye, so it is soft and sweet. Every bottle is dipped by hand in red wax.' },
    { name: 'Jameson', from: 'Dublin / County Cork, Ireland', since: '1780', description: 'The best-selling Irish whiskey. Triple-distilled, so it is light and smooth — a good first whiskey.' },
    { name: 'Johnnie Walker', from: 'Kilmarnock, Scotland', since: '1820', description: 'The best-selling Scotch whisky in the world, famous for its “Striding Man” and coloured labels: Red (mixing), Black (12 years, a little smoky), Blue (luxury).' },
    { name: 'Chivas Regal', from: 'Aberdeen, Scotland', since: '1909 (12-year blend)', description: 'A rich, smooth blended Scotch with honey and fruit — a classic gift bottle.' },
    { name: 'Glenfiddich', from: 'Speyside, Scotland', since: '1887', description: 'One of the first single malts sold around the world; fruity and fresh, in a triangular bottle.' },
    { name: 'Laphroaig', from: 'Islay, Scotland', since: '1815', description: 'Very smoky and “medicinal” from peat. People either love it or hate it — ask before you recommend it!' },
    { name: 'Suntory Yamazaki', from: 'Osaka, Japan', since: '1923', description: 'Japan’s first malt whisky distillery. Japanese whisky is elegant and balanced and wins many world prizes.' }
  ],
  'orange-liqueur': [
    { name: 'Cointreau', from: 'Angers, France', since: '1875', description: 'A clear triple sec from sweet and bitter orange peels, in a square amber bottle. The classic choice for Margaritas and Cosmopolitans.' },
    { name: 'Grand Marnier', from: 'France', since: '1880', description: 'Orange liqueur made with cognac, so it is richer and warmer. Also used in desserts like crêpes Suzette.' },
    { name: 'De Kuyper Triple Sec', from: 'Netherlands', since: '1695 (company)', description: 'An affordable, sweet triple sec used in many bars for party cocktails.' },
    { name: 'Senior Curaçao of Curaçao', from: 'Curaçao', since: '1896', description: 'The original Curaçao, made on the island from dried laraha orange peels. Comes clear, orange or famous bright blue.' },
    { name: 'Pierre Ferrand Dry Curaçao', from: 'Cognac, France', since: '2012', description: 'A revival of a 19th-century recipe, made with bartenders. Less sweet — loved for Mai Tais.' }
  ],
  vermouth: [
    { name: 'Martini & Rossi', from: 'Turin, Italy', since: '1863', description: 'The world’s best-known vermouth brand — the name “Martini” is on bottles everywhere. Rosso (sweet) and Extra Dry are the classics.' },
    { name: 'Cinzano', from: 'Turin, Italy', since: '1757', description: 'One of the oldest vermouth houses; light and easy, popular for spritzes and aperitifs.' },
    { name: 'Carpano Antica Formula', from: 'Turin, Italy', since: '1786 (Carpano)', description: 'From the family of Antonio Benedetto Carpano, who created modern vermouth. Rich, vanilla-spiced — the favourite for Negronis and Manhattans.' },
    { name: 'Noilly Prat', from: 'Marseillan, France', since: '1813', description: 'The classic dry French vermouth; its wine rests outside in barrels in the sun and sea air. Perfect for Martinis.' },
    { name: 'Dolin', from: 'Chambéry, France', since: '1821', description: 'Light, elegant, alpine-herb vermouths; Dolin Dry is a bartender favourite.' }
  ],
  'bitter-aperitif': [
    { name: 'Campari', from: 'Milan, Italy', since: '1860', description: 'The famous bright red bitter created by Gaspare Campari. Strong and bitter — the heart of the Negroni and Americano.' },
    { name: 'Aperol', from: 'Padua, Italy', since: '1919', description: 'Lighter (11% alcohol), sweeter and more orange than Campari. The star of the Aperol Spritz.' },
    { name: 'Select', from: 'Venice, Italy', since: '1920', description: 'The Venetian aperitif for the local spritz; between Aperol and Campari in bitterness.' },
    { name: 'Cynar', from: 'Italy', since: '1952', description: 'A dark bitter made with artichoke leaves among 13 herbs — less sweet, earthy and herbal.' }
  ],
  'sparkling-wine': [
    { name: 'Moët & Chandon', from: 'Épernay, Champagne, France', since: '1743', description: 'One of the largest champagne houses; Moët Impérial is the classic celebration bottle.' },
    { name: 'Veuve Clicquot', from: 'Reims, Champagne, France', since: '1772', description: 'Famous yellow label. Barbe-Nicole Clicquot, a young widow (“veuve”), invented the riddling table that makes champagne clear.' },
    { name: 'Dom Pérignon', from: 'Champagne, France', since: '1921 (first vintage)', description: 'Moët’s luxury champagne, named after the 17th-century monk. Only made in good years.' },
    { name: 'Mionetto', from: 'Valdobbiadene, Italy', since: '1887', description: 'A well-known prosecco house; fruity, light and great for spritzes.' },
    { name: 'Freixenet', from: 'Catalonia, Spain', since: '1914', description: 'Spanish cava in the famous black bottle (Cordon Negro). Crisp and good value.' }
  ],
  'coffee-liqueur': [
    { name: 'Kahlúa', from: 'Veracruz, Mexico', since: '1936', description: 'The best-known coffee liqueur, made with Mexican coffee and rum. Sweet — the classic for White Russians.' },
    { name: 'Tia Maria', from: 'Jamaica (now Italy)', since: '1940s', description: 'A coffee liqueur with Jamaican coffee and vanilla; a little less sweet than Kahlúa.' },
    { name: 'Mr Black', from: 'Australia', since: '2013', description: 'A modern cold-brew coffee liqueur, less sugar and more real coffee taste. Loved for Espresso Martinis.' }
  ],
  'herbal-liqueur': [
    { name: 'Jägermeister', from: 'Wolfenbüttel, Germany', since: '1935', description: '56 herbs, roots and fruits; dark, bittersweet and served ice-cold as a shot. The stag on the label comes from the name: “master hunter”.' },
    { name: 'Chartreuse', from: 'French Alps', since: '1737 (monks’ recipe from 1605)', description: 'Made by Carthusian monks with 130 plants; only two monks know the full recipe. Green (strong, 55%) and yellow (softer, sweeter).' },
    { name: 'Bénédictine', from: 'Fécamp, France', since: '1863', description: 'A honeyed herbal liqueur; used in classics like the Vieux Carré and B&B.' },
    { name: 'Fernet-Branca', from: 'Milan, Italy', since: '1845', description: 'Very bitter, minty and herbal — a digestif. Bartenders love it; beginners are often surprised.' }
  ],
  'cream-liqueur': [
    { name: 'Baileys', from: 'Dublin, Ireland', since: '1974', description: 'The first Irish cream: Irish whiskey, cream and cocoa. Sweet and smooth; served on ice or in coffee.' },
    { name: 'Amarula', from: 'South Africa', since: '1989', description: 'Cream liqueur made from the fruit of the marula tree, which elephants love — hence the elephant on the label.' },
    { name: 'Carolans', from: 'Ireland', since: '1978', description: 'An Irish cream with a little honey — slightly lighter and more affordable.' }
  ]
};
