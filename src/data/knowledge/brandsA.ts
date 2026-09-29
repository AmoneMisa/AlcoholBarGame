// Famous brands for each type of alcohol: where they come from, when they started and what they are known for.
// Short, factual descriptions for learners and sellers.

export interface BrandNote {
  name: string;
  from: string;
  since: string;
  description: string;
}

export const BRANDS_A: Record<string, BrandNote[]> = {
  'white-rum': [
    { name: 'Bacardí', from: 'Founded in Cuba, today made in Puerto Rico', since: '1862', description: 'The world’s best-known rum brand. Facundo Bacardí Massó created a lighter, filtered rum; the bat on the label came from bats living in his first distillery. Carta Blanca is the classic white rum for Mojitos and Daiquiris.' },
    { name: 'Havana Club', from: 'Cuba', since: '1934', description: 'The famous Cuban rum. Its fresh “3 Años” is the standard rum for Mojitos in Havana bars; aged versions are sipped neat.' },
    { name: 'Brugal', from: 'Dominican Republic', since: '1888', description: 'Known for very dry rums. Its white rum is double-filtered for a clean, crisp taste with little sweetness.' },
    { name: 'Don Q', from: 'Puerto Rico', since: '1865', description: 'Made by the Serrallés family distillery; a clean, light rum and a favourite in Puerto Rico itself.' },
    { name: 'Flor de Caña', from: 'Nicaragua', since: '1890', description: 'Made near a volcano and slowly aged; its light rums are smooth and balanced, and the brand focuses on sustainability.' }
  ],
  'dark-rum': [
    { name: 'Captain Morgan', from: 'Caribbean', since: '1944', description: 'Named after the pirate Henry Morgan. Most famous for its spiced rum with vanilla and caramel — sweet, easy and a party favourite.' },
    { name: 'Gosling’s', from: 'Bermuda', since: '1806', description: 'Black Seal is a rich, dark rum. Gosling’s owns the trademark for the Dark ’n’ Stormy cocktail.' },
    { name: 'Appleton Estate', from: 'Jamaica', since: '1749 (estate)', description: 'One of the oldest rum estates. Joy Spence became the first female master blender in the spirits industry in 1997. Fruity, balanced Jamaican rums.' },
    { name: 'Myers’s', from: 'Jamaica', since: '1879', description: 'A dark, molasses-rich rum made for planter’s punch and tiki drinks.' },
    { name: 'Diplomático', from: 'Venezuela', since: '1959', description: 'Reserva Exclusiva is a sweet, rich sipping rum with toffee and dried fruit — a popular gift bottle.' },
    { name: 'Kraken', from: 'Caribbean', since: '2009', description: 'A black spiced rum named after a sea monster, with a dramatic bottle. Strong vanilla and spice.' }
  ],
  gin: [
    { name: 'Gordon’s', from: 'London, England', since: '1769', description: 'Created by Alexander Gordon; one of the best-selling London dry gins in the world. Juniper-forward and simple.' },
    { name: 'Tanqueray', from: 'London, England (now made in Scotland)', since: '1830', description: 'Charles Tanqueray’s gin with only four botanicals. Its green bottle is shaped like a cocktail shaker. Perfect for a classic G&T or Martini.' },
    { name: 'Beefeater', from: 'London, England', since: '1863', description: 'Still distilled in London. A bold, citrusy London dry gin loved by bartenders — named after the guards of the Tower of London.' },
    { name: 'Bombay Sapphire', from: 'England', since: '1987', description: 'Famous blue bottle. Ten botanicals are placed in a basket so the steam picks up their aroma, which makes a lighter, more floral gin.' },
    { name: 'Hendrick’s', from: 'Scotland', since: '1999', description: 'Flavoured with cucumber and rose. It helped start the modern gin boom; serve it with a cucumber slice instead of lime.' },
    { name: 'Monkey 47', from: 'Black Forest, Germany', since: '2010', description: 'A premium gin with 47 botanicals, many from the Black Forest. Complex and aromatic — a gift for gin lovers.' }
  ],
  vodka: [
    { name: 'Smirnoff', from: 'Founded in Moscow, today a global brand', since: '1860s', description: 'Pyotr Smirnov’s vodka left Russia after the 1917 revolution and became the best-selling vodka in the world. Clean and affordable — made for mixing.' },
    { name: 'Absolut', from: 'Åhus, Sweden', since: '1879', description: 'Made from Swedish winter wheat. Its simple bottle became famous through a long series of creative “Absolut …” adverts from 1980.' },
    { name: 'Grey Goose', from: 'Cognac region, France', since: '1997', description: 'A premium vodka made from French wheat and spring water. Soft and smooth — for Martinis and for drinking very cold.' },
    { name: 'Belvedere', from: 'Poland', since: '1993', description: 'A premium rye vodka; the bottle shows a Polish presidential palace. Rye gives a slightly spicy, creamy taste.' },
    { name: 'Ketel One', from: 'Schiedam, Netherlands', since: '1983 (family distillery since 1691)', description: 'Made by the Nolet family, distillers for more than 300 years. Crisp and fresh.' },
    { name: 'Tito’s', from: 'Texas, USA', since: '1997', description: 'Made from corn in small pot stills; naturally gluten-free and very popular in American bars.' }
  ],
  tequila: [
    { name: 'Jose Cuervo', from: 'Tequila, Jalisco, Mexico', since: '1795', description: 'The oldest big tequila maker — it received the first official licence to make tequila. Especial Gold is a “mixto” (not 100% agave) for parties; the Tradicional range is 100% agave.' },
    { name: 'Patrón', from: 'Jalisco, Mexico', since: '1989', description: 'A premium 100% agave tequila in hand-finished bottles. Patrón Silver is clean and citrusy — great for a top-shelf Margarita.' },
    { name: 'Don Julio', from: 'Jalisco, Mexico', since: '1942', description: 'Don Julio González started making tequila as a teenager. Known for smooth reposado and añejo tequilas; “1942” is its famous luxury bottle.' },
    { name: 'Herradura', from: 'Amatitán, Jalisco', since: '1870', description: 'A historic hacienda distillery; it says it created the first reposado (rested) tequila.' },
    { name: 'Espolòn', from: 'Jalisco, Mexico', since: '1998', description: 'Good-value 100% agave tequila with colourful Day of the Dead style labels. Popular with bartenders for Palomas.' },
    { name: 'Olmeca Altos', from: 'Jalisco highlands', since: '2009', description: 'Created together with bartenders for cocktails. 100% agave, fruity and affordable.' }
  ]
};
