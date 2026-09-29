import type { BrandNote } from './brandsA';

// More famous brands for spirits (rum, gin, vodka, agave, whisky).
export const BRANDS_C: Record<string, BrandNote[]> = {
  'white-rum': [
    { name: 'Wray & Nephew', from: 'Jamaica', since: '1825', description: 'White Overproof is 63% alcohol — the most popular rum in Jamaica. Very strong and fruity; use it carefully, in small amounts.' },
    { name: 'Ron Barceló', from: 'Dominican Republic', since: '1929', description: 'Founded by a Spanish immigrant; smooth, slightly sweet rums that are very popular in Spain and Latin America.' },
    { name: 'Cruzan', from: 'St. Croix, US Virgin Islands', since: '1760 (estate)', description: 'Light, clean Virgin Islands rum and a popular range of flavoured rums.' },
    { name: 'Clément', from: 'Martinique', since: '1887', description: 'Rhum agricole made from fresh sugar-cane juice — grassy and fresh. The classic base of the Ti’ Punch.' },
    { name: 'Rhum J.M', from: 'Martinique', since: '1845', description: 'Agricole rum from a distillery at the foot of a volcano; bright, grassy and elegant.' }
  ],
  'dark-rum': [
    { name: 'Mount Gay', from: 'Barbados', since: '1703', description: 'Often called the oldest rum brand in the world, with a deed from 1703. Eclipse is its classic golden rum.' },
    { name: 'El Dorado', from: 'Guyana', since: '1992 (brand)', description: 'Rich Demerara rums made on historic wooden stills; toffee, dried fruit and brown sugar.' },
    { name: 'Pusser’s', from: 'British Virgin Islands', since: '1979', description: 'Made to the style of the old British Royal Navy rum; the official rum of the Painkiller.' },
    { name: 'Ron Zacapa', from: 'Guatemala', since: '1976', description: 'Aged high in the mountains with a solera system (older and younger rums blended in layers). Sweet and dessert-like — a popular luxury gift.' },
    { name: 'Sailor Jerry', from: 'US Virgin Islands', since: '1999', description: 'A spiced rum named after a famous tattoo artist; vanilla, cinnamon and a vintage tattoo-style label.' },
    { name: 'Smith & Cross', from: 'Jamaica', since: '2009', description: 'Navy-strength (57%) traditional Jamaican rum; bold, funky and loved by tiki bartenders.' },
    { name: 'Chairman’s Reserve', from: 'Saint Lucia', since: '1999', description: 'A blend of pot- and column-still rums; balanced, spicy and good value.' },
    { name: 'Don Papa', from: 'Philippines', since: '2012', description: 'A sweet, vanilla-rich aged rum from the island of Negros with a colourful illustrated label.' }
  ],
  gin: [
    { name: 'Plymouth', from: 'Plymouth, England', since: '1793', description: 'The only gin made in the city of Plymouth, in one of England’s oldest working distilleries. Softer and earthier than London dry; famous Navy Strength version.' },
    { name: 'Sipsmith', from: 'London, England', since: '2009', description: 'Its copper still was the first new one licensed in London in almost 200 years, starting the craft-gin revival.' },
    { name: 'The Botanist', from: 'Islay, Scotland', since: '2010', description: 'Made at a whisky distillery with 22 plants picked on the island of Islay. Floral and complex.' },
    { name: 'Roku', from: 'Japan', since: '2017', description: 'Suntory’s Japanese gin with six local botanicals such as sakura flower, yuzu and green tea. Delicate — great with ginger in a G&T.' },
    { name: 'Gin Mare', from: 'Catalonia, Spain', since: '2010', description: 'A Mediterranean gin with olive, basil, rosemary and thyme — savoury and herbal.' },
    { name: 'Malfy', from: 'Italy', since: '2016', description: 'Italian gins with lemon or other citrus from the Amalfi coast; bright and fruity.' },
    { name: 'Aviation', from: 'Portland, Oregon, USA', since: '2006', description: 'An American “New Western” gin where juniper is softer and lavender and cardamom are stronger.' },
    { name: 'Four Pillars', from: 'Yarra Valley, Australia', since: '2013', description: 'One of Australia’s best-known craft gins, with native botanicals and whole oranges.' },
    { name: 'Hayman’s', from: 'London, England', since: '1863 (family)', description: 'Its Old Tom Gin brought back the slightly sweet 19th-century style — the right gin for a Tom Collins.' },
    { name: 'Seagram’s', from: 'USA', since: '1939 (gin)', description: 'A best-selling American gin, rested briefly in barrels, in a bumpy textured bottle.' }
  ],
  vodka: [
    { name: 'Stolichnaya', from: 'Soviet Union origin, today made in Latvia', since: '1938', description: 'A classic Soviet-era vodka brand, known as “Stoli”, from wheat and rye.' },
    { name: 'Finlandia', from: 'Finland', since: '1970', description: 'Made from Finnish six-row barley and glacial spring water; clean and crisp, in an icy-looking bottle.' },
    { name: 'Chopin', from: 'Poland', since: '1993', description: 'Premium potato vodka (also rye and wheat versions); creamy and full.' },
    { name: 'Żubrówka', from: 'Poland', since: '1928 (brand)', description: 'Bison grass vodka — each bottle has a blade of grass inside. Tastes of vanilla, hay and almond; in Poland it is mixed with apple juice.' },
    { name: 'Wyborowa', from: 'Poland', since: '1823', description: 'A traditional Polish rye vodka; smooth with a gentle spice.' },
    { name: 'Cîroc', from: 'France', since: '2003', description: 'A vodka distilled from grapes instead of grain; fruity and smooth.' },
    { name: 'Skyy', from: 'San Francisco, USA', since: '1992', description: 'Famous for its cobalt-blue bottle; a clean vodka for mixing.' },
    { name: 'Russian Standard', from: 'St. Petersburg, Russia', since: '1998', description: 'A premium wheat vodka that became one of Russia’s best-known brands abroad.' },
    { name: 'Beluga', from: 'Siberia, Russia', since: '2002', description: 'A luxury malt vodka rested after distilling; the metal sturgeon on the bottle stands for caviar.' },
    { name: 'Reyka', from: 'Iceland', since: '2005', description: 'Made with Icelandic spring water and filtered through lava rock, using geothermal energy.' }
  ],
  tequila: [
    { name: 'Sauza', from: 'Tequila, Jalisco', since: '1873', description: 'Don Cenobio Sauza was among the first to export tequila to the USA. Popular and affordable.' },
    { name: '1800', from: 'Jalisco, Mexico', since: '1975', description: 'A premium tequila from the Cuervo family, in a pyramid-shaped bottle; named after the year aged tequila was first made, according to the brand.' },
    { name: 'El Jimador', from: 'Jalisco, Mexico', since: '1994', description: 'A 100% agave tequila named after the jimadores who harvest agave; one of the best-selling tequilas in Mexico.' },
    { name: 'Casamigos', from: 'Jalisco, Mexico', since: '2013', description: 'Co-founded by the actor George Clooney; soft and sweet-vanilla reposado and añejo tequilas.' },
    { name: 'Clase Azul', from: 'Jalisco, Mexico', since: '1997', description: 'Luxury tequila in a hand-painted ceramic bottle — the bottle itself is often kept as decoration.' },
    { name: 'Tapatío', from: 'Arandas, Jalisco', since: '1937', description: 'A family-made tequila from the highlands; traditional, peppery and loved by bartenders.' },
    { name: 'Fortaleza', from: 'Tequila, Jalisco', since: '2005', description: 'Made in the old way — agave crushed with a stone wheel (tahona) — by a descendant of the Sauza family.' },
    { name: 'Del Maguey (mezcal)', from: 'Oaxaca, Mexico', since: '1995', description: 'Mezcal, tequila’s smoky cousin: each bottle comes from one village. The agave is roasted in earth pits, which gives smoke.' }
  ],
  whiskey: [
    { name: 'The Macallan', from: 'Speyside, Scotland', since: '1824', description: 'A famous single malt aged in sherry casks — rich, dried fruit and spice. Rare bottles sell for record prices.' },
    { name: 'The Glenlivet', from: 'Speyside, Scotland', since: '1824', description: 'One of the first legally licensed distilleries in the Highlands; fruity, floral, easy single malt.' },
    { name: 'Lagavulin', from: 'Islay, Scotland', since: '1816', description: 'Rich, very smoky Islay malt; the 16-year-old is a classic for peat lovers.' },
    { name: 'Talisker', from: 'Isle of Skye, Scotland', since: '1830', description: 'Smoky, peppery and a little salty from the sea.' },
    { name: 'Ardbeg', from: 'Islay, Scotland', since: '1815', description: 'One of the smokiest whiskies in the world, yet sweet and citrusy underneath.' },
    { name: 'Monkey Shoulder', from: 'Speyside, Scotland', since: '2005', description: 'A blended malt made for mixing; smooth and vanilla. Named after the sore shoulders malt workers got from turning barley.' },
    { name: 'Dewar’s', from: 'Perth, Scotland', since: '1846', description: 'A best-selling blended Scotch; its blends are “married” in casks for a smooth taste. Great in highballs.' },
    { name: 'Ballantine’s', from: 'Scotland', since: '1827', description: 'One of Europe’s best-selling Scotch blends; light and smooth.' },
    { name: 'The Famous Grouse', from: 'Scotland', since: '1896', description: 'A popular blended Scotch with a red grouse bird on the label.' },
    { name: 'Buffalo Trace', from: 'Frankfort, Kentucky', since: '1999 (brand)', description: 'From a distillery that kept working during Prohibition (making “medicinal” whiskey). Balanced vanilla and caramel bourbon.' },
    { name: 'Woodford Reserve', from: 'Versailles, Kentucky', since: '1996', description: 'Premium bourbon and the official bourbon of the Kentucky Derby. Rich, spicy and smooth.' },
    { name: 'Old Forester', from: 'Louisville, Kentucky', since: '1870', description: 'The first bourbon sold only in sealed bottles; the official Mint Julep bourbon of the Kentucky Derby.' },
    { name: 'Bulleit', from: 'Kentucky, USA', since: '1987', description: 'A high-rye bourbon (spicier) in a bottle inspired by old frontier medicine bottles.' },
    { name: 'Wild Turkey', from: 'Lawrenceburg, Kentucky', since: '1940', description: 'Bold, spicy bourbon; “101” refers to its 50.5% strength.' },
    { name: 'Four Roses', from: 'Kentucky, USA', since: '1888', description: 'Uses ten different recipes to blend fruity, floral bourbons.' },
    { name: 'Crown Royal', from: 'Canada', since: '1939', description: 'Created for the visit of King George VI to Canada; smooth Canadian whisky in a purple bag.' },
    { name: 'Canadian Club', from: 'Windsor, Canada', since: '1858', description: 'Light and smooth Canadian whisky; popular during American Prohibition.' },
    { name: 'Bushmills', from: 'Northern Ireland', since: '1608 (licence)', description: 'From a distillery with one of the oldest licences to distil; light, triple-distilled Irish whiskey.' },
    { name: 'Redbreast', from: 'Ireland', since: '1912', description: 'A single pot still Irish whiskey aged in sherry casks; rich, spicy and fruity.' },
    { name: 'Tullamore D.E.W.', from: 'Ireland', since: '1829', description: 'The second-largest Irish whiskey brand; smooth and gentle, good for beginners.' },
    { name: 'Nikka', from: 'Japan', since: '1934', description: 'Founded by Masataka Taketsuru, who studied whisky-making in Scotland. “From the Barrel” is a strong, rich favourite.' },
    { name: 'Hibiki', from: 'Japan', since: '1989', description: 'Suntory’s blended Japanese whisky in a 24-sided bottle (for the 24 hours of the day). Elegant and harmonious.' },
    { name: 'Sazerac Rye', from: 'Kentucky, USA', since: '2000s (brand)', description: 'A rye whiskey named after the famous New Orleans cocktail — the natural choice for a Sazerac.' }
  ]
};
