import type { BrandNote } from './brandsA';

// More famous brands for liqueurs, aperitifs, wines, beer, cider, sake, soju and brandy.
export const BRANDS_D: Record<string, BrandNote[]> = {
  'orange-liqueur': [
    { name: 'Combier', from: 'Saumur, France', since: '1834', description: 'Says it made the first triple sec; a clean, natural orange liqueur.' },
    { name: 'Mandarine Napoléon', from: 'Belgium', since: '1892', description: 'Mandarin peel and cognac — richer and more aromatic than triple sec.' }
  ],
  vermouth: [
    { name: 'Lillet', from: 'Podensac, Bordeaux, France', since: '1872', description: 'A French aromatized wine (blanc, rosé, rouge) with orange notes. James Bond’s Vesper uses it; Lillet Tonic is a light summer drink.' },
    { name: 'Cocchi', from: 'Asti, Italy', since: '1891', description: 'Vermouth di Torino and Americano — rich, balanced aperitif wines loved by bartenders.' },
    { name: 'Punt e Mes', from: 'Turin, Italy', since: '1870', description: 'A sweet vermouth with extra bitterness; the name means “point and a half” — one point sweet, half a point bitter.' },
    { name: 'Belsazar', from: 'Black Forest, Germany', since: '2013', description: 'German vermouth made with Black Forest fruit brandy; fresh and modern.' }
  ],
  'bitter-aperitif': [
    { name: 'Suze', from: 'France', since: '1889', description: 'A yellow gentian-root bitter; earthy and floral. Famous with tonic.' },
    { name: 'Amaro Montenegro', from: 'Bologna, Italy', since: '1885', description: 'A soft, orange-peel and vanilla amaro; a good first amaro for beginners.' },
    { name: 'Amaro Nonino', from: 'Friuli, Italy', since: '1933 (amaro)', description: 'A grappa-based amaro with caramel and orange — the key to the Paper Plane.' },
    { name: 'Averna', from: 'Sicily, Italy', since: '1868', description: 'A dark, sweet-bitter Sicilian amaro with citrus and herbs; after dinner on ice.' },
    { name: 'Luxardo Bitter', from: 'Padua, Italy', since: '1821 (company)', description: 'A red bitter from the famous Luxardo family; an alternative to Campari in a Negroni.' },
    { name: 'Angostura', from: 'Trinidad and Tobago', since: '1824', description: 'The world’s most famous cocktail bitters, in a bottle with an oversized paper label. A few drops season Old Fashioneds and Manhattans.' }
  ],
  'sparkling-wine': [
    { name: 'Ruinart', from: 'Reims, France', since: '1729', description: 'The oldest established champagne house; famous for elegant Blanc de Blancs.' },
    { name: 'Bollinger', from: 'Aÿ, France', since: '1829', description: 'A rich, full champagne — and James Bond’s champagne in many films.' },
    { name: 'Taittinger', from: 'Reims, France', since: '1932 (name)', description: 'Light, elegant champagnes with a lot of Chardonnay.' },
    { name: 'Laurent-Perrier', from: 'Tours-sur-Marne, France', since: '1812', description: 'Especially famous for its pale rosé champagne.' },
    { name: 'Pol Roger', from: 'Épernay, France', since: '1849', description: 'Winston Churchill’s favourite champagne; a prestige cuvée is named after him.' },
    { name: 'Krug', from: 'Reims, France', since: '1843', description: 'A luxury champagne house; its Grande Cuvée blends many years for a rich, complex taste.' },
    { name: 'Perrier-Jouët', from: 'Épernay, France', since: '1811', description: 'Known for its Belle Époque bottle painted with white Art Nouveau flowers.' },
    { name: 'Codorníu', from: 'Catalonia, Spain', since: '1872 (first cava)', description: 'Made the first cava using the champagne method; one of the oldest family wine businesses in the world.' },
    { name: 'La Marca', from: 'Veneto, Italy', since: '2005', description: 'A popular prosecco in a light-blue label; fresh apple and citrus.' },
    { name: 'Chandon', from: 'California and other regions', since: '1973', description: 'Moët & Chandon’s sparkling wines made outside Champagne.' }
  ],
  'coffee-liqueur': [
    { name: 'Borghetti', from: 'Italy', since: '1860', description: 'An Italian espresso liqueur made with real espresso; less sweet and stronger in coffee than most.' }
  ],
  'cream-liqueur': [
    { name: 'Sheridan’s', from: 'Ireland', since: '1994', description: 'A two-part bottle: coffee-chocolate liqueur and vanilla cream pour together in layers.' },
    { name: 'RumChata', from: 'Wisconsin, USA', since: '2009', description: 'Rum with cream, cinnamon and vanilla, inspired by horchata. Popular in dessert drinks.' },
    { name: 'Mozart', from: 'Salzburg, Austria', since: '1954', description: 'Chocolate cream liqueurs, named after the composer; in a round “Mozart ball” bottle.' },
    { name: 'Warninks', from: 'Netherlands', since: '1616 (company)', description: 'Advocaat — a thick, yellow egg liqueur, eaten with a spoon or used in the Snowball cocktail.' }
  ],
  'herbal-liqueur': [
    { name: 'Galliano', from: 'Italy', since: '1896', description: 'A golden vanilla-anise liqueur in a very tall bottle; key to the Harvey Wallbanger.' },
    { name: 'Strega', from: 'Benevento, Italy', since: '1860', description: '“Strega” means witch; a bright yellow (saffron) liqueur with mint and fennel.' },
    { name: 'Drambuie', from: 'Scotland', since: '1893 (brand)', description: 'Scotch whisky with heather honey and herbs; used in the Rusty Nail.' },
    { name: 'Unicum', from: 'Budapest, Hungary', since: '1790', description: 'A dark Hungarian herbal bitter from more than 40 herbs, in a round bottle with a red cross.' },
    { name: 'Bénédictine', from: 'Fécamp, France', since: '1863', description: 'A honeyed herbal liqueur made in a palace-like distillery; used in the B&B and Vieux Carré.' }
  ],
  'specialty-liqueur': [
    { name: 'Frangelico', from: 'Piedmont, Italy', since: '1978', description: 'A hazelnut liqueur in a bottle shaped like a monk, with a rope belt.' },
    { name: 'Chambord', from: 'Loire Valley, France', since: '1982', description: 'A black raspberry liqueur in a round, crown-topped bottle; used in the French Martini.' },
    { name: 'St-Germain', from: 'France', since: '2007', description: 'An elderflower liqueur in an Art Deco bottle; floral and light — bartenders call it “bartender’s ketchup” because it goes with almost everything.' },
    { name: 'Luxardo Maraschino', from: 'Torreglia, Italy (founded in Zadar)', since: '1821', description: 'A clear cherry liqueur in a straw-wrapped bottle; used in the Aviation and Hemingway Daiquiri.' },
    { name: 'Cherry Heering', from: 'Copenhagen, Denmark', since: '1818', description: 'A dark cherry liqueur and a key part of the Singapore Sling.' },
    { name: 'Licor 43', from: 'Cartagena, Spain', since: '1946', description: 'A golden vanilla-citrus liqueur made from 43 ingredients.' },
    { name: 'Southern Comfort', from: 'New Orleans, USA', since: '1874', description: 'A fruity, spiced liqueur created by bartender M. W. Heron.' },
    { name: 'Limoncello Villa Massa', from: 'Sorrento, Italy', since: '1991', description: 'Limoncello from Sorrento lemons; served ice-cold after dinner.' },
    { name: 'Passoã', from: 'France', since: '1986', description: 'A bright red passion-fruit liqueur for tropical drinks like the Porn Star Martini.' },
    { name: 'Pimm’s', from: 'London, England', since: '1840', description: 'A gin-based fruit cup, the taste of English summer — mixed with lemonade, strawberries and cucumber at Wimbledon.' }
  ],
  'blue-curacao': [
    { name: 'Senior Curaçao of Curaçao', from: 'Curaçao', since: '1896', description: 'The original, made on the island from laraha orange peel.' }
  ],
  sambuca: [
    { name: 'Romana', from: 'Italy', since: '1945', description: 'A popular sweet anise liqueur, often served “con la mosca” — with three coffee beans.' }
  ],
  cognac: [
    { name: 'Martell', from: 'Cognac, France', since: '1715', description: 'The oldest of the big cognac houses; its Cordon Bleu is a famous classic.' },
    { name: 'Camus', from: 'Cognac, France', since: '1863', description: 'The largest family-owned cognac house; floral, fruity style.' },
    { name: 'Hine', from: 'Jarnac, France', since: '1763', description: 'An elegant cognac house and official supplier to the British royal court.' },
    { name: 'Pierre Ferrand', from: 'Cognac, France', since: '1989 (brand)', description: 'Loved by bartenders; its 1840 cognac was made for cocktails.' }
  ],
  brandy: [
    { name: 'Asbach Uralt', from: 'Rüdesheim, Germany', since: '1892', description: 'Germany’s best-known brandy; mild and round, also used in chocolates.' },
    { name: 'Ararat', from: 'Yerevan, Armenia', since: '1887', description: 'Famous Armenian brandy; Winston Churchill was said to enjoy it.' },
    { name: 'Christian Drouin', from: 'Normandy, France', since: '1960', description: 'Calvados — apple brandy from Normandy; fruity and warm.' },
    { name: 'Barsol', from: 'Ica, Peru', since: '2002', description: 'Peruvian pisco (grape brandy) — the base of the Pisco Sour.' }
  ],
  'port-wine': [
    { name: 'Croft', from: 'Porto, Portugal', since: '1588', description: 'One of the oldest port houses; it created the first pink (rosé) port in 2008.' },
    { name: 'Warre’s', from: 'Porto, Portugal', since: '1670', description: 'The first British port company in Portugal; elegant, floral ports.' },
    { name: 'Dow’s', from: 'Porto, Portugal', since: '1798', description: 'Known for drier, structured vintage ports.' },
    { name: 'Fonseca', from: 'Porto, Portugal', since: '1815', description: 'Rich, fruity ports; Bin 27 is a popular everyday ruby.' }
  ],
  beer: [
    { name: 'Pilsner Urquell', from: 'Plzeň, Czech Republic', since: '1842', description: 'The first pale lager in the world — every “pilsner” is named after its city.' },
    { name: 'Carlsberg', from: 'Copenhagen, Denmark', since: '1847', description: 'A major Danish lager; its lab was the first to grow pure brewing yeast.' },
    { name: 'Asahi Super Dry', from: 'Japan', since: '1987', description: 'A very crisp, dry Japanese lager that changed beer in Japan.' },
    { name: 'Sapporo', from: 'Japan', since: '1876', description: 'Japan’s oldest beer brand, with a star on the label.' },
    { name: 'Kirin', from: 'Japan', since: '1888 (brand)', description: 'Japanese lager named after a mythical creature on the label; Ichiban uses only the first pressing of the malt.' },
    { name: 'Tsingtao', from: 'Qingdao, China', since: '1903', description: 'Founded by German settlers; China’s most famous beer abroad.' },
    { name: 'Peroni', from: 'Rome, Italy', since: '1846', description: 'Nastro Azzurro is a crisp Italian lager, stylish and popular in restaurants.' },
    { name: 'Hoegaarden', from: 'Hoegaarden, Belgium', since: '1966 (revived)', description: 'A cloudy Belgian wheat beer (witbier) with coriander and orange peel.' },
    { name: 'Leffe', from: 'Belgium', since: '1240 (abbey tradition)', description: 'An abbey-style Belgian beer; Blonde is fruity and spicy.' },
    { name: 'Chimay', from: 'Belgium', since: '1862', description: 'A Trappist beer brewed at a monastery; rich, strong and complex.' },
    { name: 'Duvel', from: 'Belgium', since: '1871 (brewery)', description: 'A strong golden ale (8.5%); the name means “devil”.' },
    { name: 'Paulaner', from: 'Munich, Germany', since: '1634', description: 'A famous Munich brewery; its wheat beer (Hefe-Weißbier) is cloudy and fruity.' },
    { name: 'Erdinger', from: 'Erding, Germany', since: '1886', description: 'The world’s largest wheat beer brewery; its Weißbier is cloudy, fruity and slightly spicy, served in a tall glass.' },
    { name: 'Beck’s', from: 'Bremen, Germany', since: '1873', description: 'A crisp German pilsner in a green bottle.' },
    { name: 'Modelo', from: 'Mexico', since: '1925', description: 'Modelo Especial is a rich-flavoured Mexican lager, very popular in the USA.' },
    { name: 'Sierra Nevada', from: 'California, USA', since: '1980', description: 'Its Pale Ale helped start the American craft-beer movement; hoppy and piney.' },
    { name: 'BrewDog', from: 'Scotland', since: '2007', description: 'Punk IPA is a bold, tropical-fruit IPA from a rebellious modern brewery.' }
  ],
  'non-alcoholic-beer': [
    { name: 'Erdinger Alkoholfrei', from: 'Germany', since: '2001', description: 'An alcohol-free wheat beer marketed as a sports and recovery drink.' },
    { name: 'Clausthaler', from: 'Frankfurt, Germany', since: '1979', description: 'One of the first alcohol-free beers made to taste like real beer.' },
    { name: 'Athletic Brewing', from: 'Connecticut, USA', since: '2017', description: 'A craft brewery that makes only non-alcoholic beers, such as its Run Wild IPA.' }
  ],
  cider: [
    { name: 'Thatchers', from: 'Somerset, England', since: '1904', description: 'A family cider maker; Gold is crisp and medium-dry.' },
    { name: 'Aspall', from: 'Suffolk, England', since: '1728', description: 'One of England’s oldest cider makers; dry and elegant.' },
    { name: 'Kopparberg', from: 'Sweden', since: '1882 (brewery)', description: 'Famous for sweet fruit ciders like strawberry-lime.' },
    { name: 'Angry Orchard', from: 'New York, USA', since: '2011', description: 'A best-selling American hard cider; crisp apple and a little sweet.' },
    { name: 'El Gaitero', from: 'Asturias, Spain', since: '1890', description: 'Spanish sparkling cider; Asturian cider is traditionally poured from high above the glass.' }
  ],
  sake: [
    { name: 'Kubota', from: 'Niigata, Japan', since: '1985 (brand)', description: 'Light, dry and clean sake from snowy Niigata.' },
    { name: 'Hakkaisan', from: 'Niigata, Japan', since: '1922', description: 'Crisp, clean sake made with pure mountain snow-melt water.' },
    { name: 'Ozeki', from: 'Hyōgo, Japan', since: '1711', description: 'One of Japan’s oldest sake brewers; also brews in California.' },
    { name: 'Sho Chiku Bai', from: 'Kyoto / California', since: '1851 (Takara)', description: 'A popular everyday sake; the name means “pine, bamboo, plum” — symbols of good luck.' }
  ],
  soju: [
    { name: 'Hwayo', from: 'South Korea', since: '2005', description: 'A premium distilled soju from rice, aged in clay jars; smoother and stronger than green-bottle soju.' },
    { name: 'Andong Soju', from: 'Andong, South Korea', since: 'Traditional (centuries old)', description: 'A traditional distilled rice soju from the city of Andong; strong (often 45%) and fragrant.' }
  ],
  'fruit-wine': [
    { name: 'Manischewitz', from: 'USA', since: '1888 (company)', description: 'A sweet Concord grape wine, well known for Jewish holiday tables.' }
  ]
};
