import { ALCOHOL_PRODUCTS } from '../../domain/bottleCatalog';
import type { AlcoholProduct } from '../../domain/types';
import { BRANDS_A, type BrandNote } from './brandsA';
import { BRANDS_B } from './brandsB';
import { BRANDS_C } from './brandsC';
import { BRANDS_D } from './brandsD';
import type { IngredientGuide } from './spirits';
import { foldText as norm } from '../../domain/text';

export type { BrandNote } from './brandsA';

const RETAIL_CATEGORY_BRANDS: Record<string, BrandNote[]> = {
  'port-wine': [
    { name:'Taylor’s',from:'Douro Valley, Portugal',since:'1692',description:'One of the oldest port houses, especially respected for vintage and late-bottled vintage ports with deep dark-fruit character.' },
    { name:'Graham’s',from:'Douro Valley, Portugal',since:'1820',description:'Historic port producer known for rich vintage ports and mellow aged tawny styles made for slow after-dinner drinking.' },
    { name:'Sandeman',from:'Portugal',since:'1790',description:'Recognizable by its black-caped Don logo; it makes approachable ruby, tawny and vintage ports sold around the world.' }
  ],
  cognac: [
    { name:'Hennessy',from:'Cognac, France',since:'1765',description:'The world’s largest cognac house; Hennessy VS is bold and versatile, while older expressions become smoother and more complex.' },
    { name:'Rémy Martin',from:'Cognac, France',since:'1724',description:'Specializes in Fine Champagne cognac from Grande and Petite Champagne grapes; VSOP is its famous smooth, fruit-led bottle.' },
    { name:'Courvoisier',from:'Jarnac, Cognac, France',since:'1828',description:'A major cognac house associated with floral, fruit-forward blends and a long-standing reputation as an elegant gift.' }
  ],
  beer: [
    { name:'Guinness',from:'Dublin, Ireland',since:'1759',description:'Iconic dry stout with roasted malt and a creamy head; its draught cans use a nitrogen widget to recreate the pub texture.' },
    { name:'Heineken',from:'Amsterdam, Netherlands',since:'1873',description:'One of the most internationally recognized pale lagers, known for a crisp profile and distinctive green bottle.' },
    { name:'Corona',from:'Mexico',since:'1925',description:'Light Mexican lager strongly associated with warm weather and a lime wedge, with an easy, crisp flavor profile.' },
    { name:'Stella Artois',from:'Leuven, Belgium',since:'1926',description:'Belgian pilsner with clean malt and a dry finish, marketed globally with its recognizable chalice service.' },
    { name:'Budweiser',from:'St. Louis, USA',since:'1876',description:'Classic American lager brewed with barley malt and rice for a light, clean profile suited to parties and casual meals.' }
  ],
  soju: [
    { name:'Jinro',from:'South Korea',since:'1924',description:'The best-selling soju brand in Korea and internationally; Chamisul Fresh is light, clean and commonly shared with food.' },
    { name:'Chum Churum',from:'South Korea',since:'2006',description:'A leading modern soju brand known for a soft texture and approachable lower-strength drinking style.' },
    { name:'Good Day',from:'South Korea',since:'2006',description:'Popular soju range with classic and fruit-flavored bottles, especially common in casual group occasions.' }
  ],
  sake: [
    { name:'Gekkeikan',from:'Kyoto, Japan',since:'1637',description:'One of Japan’s oldest and largest sake makers, producing dependable traditional sake that can be served warm or chilled.' },
    { name:'Dassai',from:'Yamaguchi, Japan',since:'1990',description:'Premium junmai daiginjo brand famous for highly polished rice, fragrant fruit notes and elegant modern presentation.' },
    { name:'Hakutsuru',from:'Kobe, Japan',since:'1743',description:'Historic Nada sake producer offering widely available junmai and ginjo styles designed to pair easily with food.' }
  ],
  brandy: [
    { name:'St-Rémy',from:'France',since:'1886',description:'Widely sold French brandy known for dependable VSOP and XO blends with fruit, vanilla and gentle oak.' },
    { name:'Torres',from:'Catalonia, Spain',since:'1928 (brandy production)',description:'Spanish wine family behind Torres 10, a rich, oak-aged grape brandy with vanilla and cinnamon notes.' },
    { name:'Metaxa',from:'Greece',since:'1888',description:'Distinctive Greek amber spirit combining aged wine distillates, Muscat wine and botanicals for a soft aromatic style.' }
  ],
  cider: [
    { name:'Strongbow',from:'England',since:'1962',description:'One of the best-known English ciders, recognized for crisp apple acidity and a comparatively dry finish.' },
    { name:'Somersby',from:'Denmark',since:'2008',description:'International modern cider brand focused on sweet, fruit-forward, sparkling apple and flavored variants.' },
    { name:'Magners',from:'Clonmel, Ireland',since:'1935',description:'Irish cider made from multiple apple varieties and often served over ice for a smooth, refreshing profile.' }
  ],
  sambuca: [
    { name:'Molinari',from:'Civitavecchia, Italy',since:'1945',description:'Italy’s best-known sambuca producer, recognized for a clear, sweet and intensely aromatic star-anise style.' },
    { name:'Luxardo',from:'Torreglia, Italy',since:'1821',description:'Historic Italian liqueur house whose Sambuca dei Cesari combines strong anise aroma with herbs and warm spice.' },
    { name:'Ramazzotti',from:'Milan, Italy',since:'1815',description:'Long-established Italian liqueur brand producing a smooth sambuca commonly served chilled or with coffee beans.' }
  ],
  sangria: [
    { name:'Don Simón',from:'Jumilla, Spain',since:'1980',description:'Popular Spanish producer known for affordable, ready-to-serve red-wine sangria with bright citrus and fruit.' },
    { name:'Lolea',from:'Zaragoza, Spain',since:'2013',description:'Premium bottled sangria brand with distinctive presentation and a Mediterranean mix of wine, citrus and spice.' },
    { name:'Peñasol',from:'Castilla-La Mancha, Spain',since:'1960s',description:'Accessible Spanish wine label offering an easy-drinking fruit-led sangria designed to be served well chilled.' }
  ],
  infusion: [
    { name:'Nemiroff',from:'Nemyriv, Ukraine',since:'1872',description:'Ukrainian distiller famous for honey-and-pepper infused spirit, balancing soft sweetness with warming chili spice.' },
    { name:'Żubrówka',from:'Poland',since:'1928',description:'Iconic Polish bison-grass flavored spirit with herbal, vanilla and fresh meadow aromas traditionally paired with apple.' },
    { name:'Beluga Hunting',from:'Eastern Europe',since:'2015',description:'Herbal bitter range built around aromatic plants, spices and a strong bittersweet digestif-style profile.' },
    { name:'Riga Black Balsam',from:'Riga, Latvia',since:'1752',description:'Historic dark herbal balsam combining roots, berries and spices in a powerful bittersweet infused spirit.' }
  ],
  'fruit-wine': [
    { name:"Boone’s Farm",from:'California, USA',since:'1961',description:'Accessible American flavored-wine line known for sweet fruit styles such as the popular Strawberry Hill bottle.' },
    { name:'MauiWine',from:'Maui, Hawaii, USA',since:'1974',description:'Hawaiian winery producing distinctive pineapple wines alongside traditional grape wines grown on the island.' },
    { name:'CHOYA',from:'Osaka, Japan',since:'1914',description:'Major Japanese producer specializing in umeshu, a fragrant sweet drink made by steeping ume fruit in alcohol.' }
  ],
  'non-alcoholic-beer': [
    { name:'Heineken 0.0',from:'Netherlands',since:'2017',description:'Widely distributed alcohol-free lager designed to retain familiar Heineken malt, fruit and gently bitter notes.' },
    { name:'Guinness 0.0',from:'Dublin, Ireland',since:'2020',description:'Alcohol-free stout developed to preserve Guinness-like roasted malt character, dark color and creamy head.' },
    { name:'Corona Cero',from:'Mexico',since:'2022',description:'Light alcohol-free lager extending Corona’s warm-weather identity and familiar lime-wedge serving ritual.' },
    { name:'Budweiser Zero',from:'United States',since:'2020',description:'Clean, accessible alcohol-free American lager positioned for social occasions without ordinary beer strength.' }
  ],
  'herbal-liqueur': [
    { name:'Jägermeister',from:'Wolfenbüttel, Germany',since:'1935',description:'Famous German herbal liqueur blending many botanicals into a sweet, spicy and bittersweet chilled digestif.' },
    { name:'Becherovka',from:'Karlovy Vary, Czech Republic',since:'1807',description:'Czech herbal liqueur recognized for warming cinnamon, clove and a distinctive bittersweet botanical profile.' },
    { name:'Fernet-Branca',from:'Milan, Italy',since:'1845',description:'Intensely bitter Italian fernet combining roots, herbs, spice and mint into a powerful after-dinner style.' },
    { name:'Chartreuse',from:'France',since:'1737',description:'Historic monastic liqueur whose secret botanical recipe creates an exceptionally complex herbal flavor.' }
  ],
  'specialty-liqueur': [
    { name:'Bols',from:'Amsterdam, Netherlands',since:'1575',description:'Historic Dutch distiller with a large flavored-liqueur range, including a widely used vivid Blue Curaçao.' },
    { name:'De Kuyper',from:'Schiedam, Netherlands',since:'1695',description:'Long-established Dutch liqueur producer known for accessible fruit flavors and cocktail-focused Blue Curaçao.' },
    { name:'Midori',from:'Japan',since:'1978',description:'Distinctive neon-green melon liqueur created for sweet, colorful modern party cocktails.' },
    { name:'Malibu',from:'Caribbean',since:'1982',description:'Globally recognized coconut-flavored rum liqueur strongly associated with simple tropical mixed drinks.' },
    { name:'Disaronno',from:'Saronno, Italy',since:'1525 tradition',description:'Famous Italian amaretto-style liqueur with sweet almond, marzipan and gentle stone-fruit character.' }
  ],
  'blue-curacao': [
    { name:'Bols',from:'Amsterdam, Netherlands',since:'1575',description:'Historic Dutch distiller producing a bright Blue Curaçao widely used in visual tropical cocktails.' },
    { name:'De Kuyper',from:'Schiedam, Netherlands',since:'1695',description:'Major Dutch liqueur house with an accessible sweet-orange Blue Curaçao made for mixed drinks.' },
    { name:'Marie Brizard',from:'Bordeaux, France',since:'1755',description:'Historic French liqueur maker offering a blue orange Curaçao for colorful classic and resort serves.' }
  ]
};

// Famous brands per guide id (ingredient guides plus retail-only alcohol types below).
// Merge all brand lists per category (a later list adds brands, it never replaces a category); duplicates by name are skipped.
function mergeBrands(...lists: Record<string, BrandNote[]>[]) {
  const merged: Record<string, BrandNote[]> = {};
  for (const list of lists) {
    for (const [category, brands] of Object.entries(list)) {
      const target = merged[category] ??= [];
      for (const brand of brands) if (!target.some((item) => item.name === brand.name)) target.push(brand);
    }
  }
  return merged;
}
export const BRANDS: Record<string, BrandNote[]> = mergeBrands(BRANDS_A, BRANDS_B, RETAIL_CATEGORY_BRANDS, BRANDS_C, BRANDS_D);

// Alcohol types sold in the shop that are not cocktail ingredients in the bar.
export const EXTRA_ALCOHOL_GUIDES: Record<string, IngredientGuide & { name: string }> = {
  'port-wine': {
    id:'port-wine',name:'Port wine',kind:'wine',summary:'Fortified wine from Portugal’s Douro Valley, usually rich, sweet and served in smaller glasses.',madeFrom:'Wine grapes fortified with grape spirit.',howMade:'Fermentation is stopped with grape spirit, preserving natural sweetness; many styles then age in barrel or bottle.',origin:'Douro Valley, Portugal.',history:'Port grew through the historic wine trade between Portugal and Britain. Fortification helped the wine survive long sea journeys.',styles:[{name:'Ruby / LBV',note:'Dark fruit, bold and youthful.'},{name:'Tawny',note:'Barrel-aged, nutty and mellow.'}],flavour:'Dark fruit, dried fruit, nuts, spice and sweetness.',abv:'Usually 19–22%',howToUse:'Serve 60–90 ml after dinner, with cheese or dessert.',sellingTip:'Ask whether the customer wants dark-fruit richness or a nuttier aged tawny.',funFact:'Authentic port comes from the demarcated Douro region, one of the world’s oldest protected wine regions.'
  },
  cognac: {
    id:'cognac',name:'Cognac',kind:'spirit',summary:'Protected French grape brandy distilled twice and matured in oak around the town of Cognac.',madeFrom:'Mostly Ugni Blanc grapes.',howMade:'Dry wine is double-distilled in copper pot stills, then aged in French oak and blended.',origin:'Cognac, France.',history:'Dutch and English merchants encouraged distillation of local wine; strict regional rules later defined cognac.',styles:[{name:'VS',note:'Youngest blend component aged at least two years.'},{name:'VSOP',note:'Youngest component aged at least four years.'},{name:'XO',note:'Long-aged, rich and complex.'}],flavour:'Fruit, flowers, vanilla, oak and warm spice.',abv:'Usually 40%',howToUse:'Sip neat, over ice or use in premium classic cocktails.',sellingTip:'VS suits mixing and lively occasions; VSOP or XO makes a more prestigious gift.',funFact:'Every cognac is brandy, but only brandy from the protected Cognac region can use the name.'
  },
  beer: {
    id:'beer',name:'Beer',kind:'wine',summary:'Fermented grain drink ranging from pale crisp lager to dark roasted stout.',madeFrom:'Malted grain, water, hops and yeast.',howMade:'Malt is mashed, the sweet wort is boiled with hops, then yeast ferments it before conditioning and packaging.',origin:'Ancient grain-growing cultures; modern lager brewing developed strongly in Central Europe.',history:'Beer is among humanity’s oldest fermented drinks. Industrial refrigeration made clear, cold lager the dominant global style.',styles:[{name:'Lager',note:'Clean, crisp and refreshing.'},{name:'Ale',note:'Fruitier fermentation character.'},{name:'Stout',note:'Dark, roasted and often creamy.'}],flavour:'Ranges from light malt and crisp hops to roasted coffee and fruit.',abv:'Usually 4–8%',howToUse:'Serve cold in the correct glass and pair with salty, grilled or spicy food.',sellingTip:'Ask light or dark, bitter or smooth, and whether it is for food or a party.',funFact:'Hops add bitterness and aroma and also helped beer keep longer before modern refrigeration.'
  },
  soju: {
    id:'soju',name:'Soju',kind:'spirit',summary:'Korean clear spirit, usually light, clean and shared with food.',madeFrom:'Traditionally rice; modern versions may use rice, barley, sweet potato or neutral spirit.',howMade:'It may be distilled traditionally or diluted from neutral spirit, then filtered and bottled at approachable strength.',origin:'Korea.',history:'Distillation arrived in Korea during the Mongol era. Modern lower-strength green-bottle soju became a central part of Korean dining culture.',styles:[{name:'Classic',note:'Clean and lightly sweet.'},{name:'Fruit soju',note:'Lower strength with fruit flavor.'}],flavour:'Clean, soft, lightly sweet and neutral.',abv:'Usually 12–25%',howToUse:'Serve chilled in small glasses and share alongside Korean food.',sellingTip:'Recommend classic soju with dinner and fruit soju for guests who want something sweeter and lighter.',funFact:'Korean etiquette traditionally encourages pouring soju for other people rather than filling your own glass.'
  },
  sake: {
    id:'sake',name:'Sake',kind:'wine',summary:'Japanese fermented rice drink with styles from savory and rich to floral and delicate.',madeFrom:'Polished rice, water, koji mold and yeast.',howMade:'Koji converts rice starch into sugar while yeast ferments it, allowing both processes to happen together.',origin:'Japan.',history:'Sake developed over many centuries around temples, shrines and court culture; modern polishing and temperature control created refined premium styles.',styles:[{name:'Junmai',note:'Pure rice sake with body and savory depth.'},{name:'Ginjo / Daiginjo',note:'More highly polished, fragrant and elegant.'}],flavour:'Rice, fruit, flowers, herbs and gentle savoriness.',abv:'Usually 14–17%',howToUse:'Serve chilled, room temperature or warm depending on style; pair closely with food.',sellingTip:'Choose junmai for a meal and fragrant daiginjo for a premium gift.',funFact:'Sake is brewed more like beer than wine because rice starch must first be converted into sugar.'
  },
  brandy: {
    id:'brandy',name:'Brandy',kind:'spirit',summary:'Spirit distilled from wine or fermented fruit and often matured in oak.',madeFrom:'Wine grapes or other fermented fruit.',howMade:'Wine is distilled, then the spirit may age in oak before blending and bottling.',origin:'Produced across Europe and many wine regions worldwide.',history:'Merchants distilled wine to reduce shipping volume and improve stability; aged distillate became prized in its own right.',styles:[{name:'Grape brandy',note:'Wine-derived, often warm and fruity.'},{name:'Fruit brandy',note:'Made from apples, pears, cherries or other fruit.'}],flavour:'Fruit, caramel, vanilla, oak and warm spice.',abv:'Usually 35–45%',howToUse:'Sip after dinner, serve over ice or use in classic cocktails and cooking.',sellingTip:'For gifts, ask whether the customer wants soft and fruity or richer oak-aged character.',funFact:'The word brandy comes from Dutch brandewijn, meaning “burned wine,” referring to distillation.'
  },
  cider: {
    id:'cider',name:'Cider',kind:'wine',summary:'Fermented apple drink that can be dry, sweet, still or sparkling.',madeFrom:'Pressed apple juice and yeast.',howMade:'Apple juice ferments, then may be blended, sweetened, filtered and carbonated before packaging.',origin:'Traditional in Britain, Ireland, France, Spain and other apple-growing regions.',history:'Cider developed wherever grapes were difficult to grow but apples were plentiful; regional styles remain very different.',styles:[{name:'Dry cider',note:'Crisp, tart and food-friendly.'},{name:'Sweet cider',note:'Fruit-forward and approachable.'}],flavour:'Fresh or baked apple, acidity, gentle tannin and bubbles.',abv:'Usually 4–8%',howToUse:'Serve cold; pair with pork, cheese, salty snacks or autumn dishes.',sellingTip:'Ask dry or sweet first—the difference is larger than many customers expect.',funFact:'Some traditional cider apples are too bitter to eat but make complex, structured drinks.'
  },
  sambuca: {
    id:'sambuca',name:'Sambuca',kind:'liqueur',summary:'A clear Italian anise liqueur with intense liquorice aroma and a rich, sweet finish.',madeFrom:'Neutral spirit, sugar, star anise or green anise, elderflower and other botanicals.',howMade:'Botanicals are infused or distilled with spirit, then the liquid is sweetened, rested and filtered until clear.',origin:'Italy.',history:'Modern sambuca developed in central Italy during the nineteenth century and became a familiar after-dinner drink and coffee accompaniment.',styles:[{name:'White sambuca',note:'Clear, sweet and strongly anise-led.'},{name:'Black sambuca',note:'Darker, spicier and often more liquorice-forward.'}],flavour:'Star anise, liquorice, herbs and concentrated sweetness.',abv:'Usually 38–42%',howToUse:'Serve neat, chilled, with coffee, or con la mosca with three coffee beans.',sellingTip:'Recommend it to guests who enjoy sweet liquorice flavors or want a classic Italian digestif.',funFact:'The three coffee beans in a traditional con la mosca serve symbolize health, happiness and prosperity.'
  },
  sangria: {
    id:'sangria',name:'Sangria',kind:'wine',summary:'A Spanish wine punch flavored with fruit and citrus, served cold for relaxed social occasions.',madeFrom:'Red or white wine, fresh fruit, citrus and sometimes juice, sugar, soda or a small amount of spirit.',howMade:'Wine is combined with cut fruit and flavorings, chilled to let the flavors mingle, then served over ice.',origin:'Spain and Portugal.',history:'Wine punches have long existed across Europe, while sangria became internationally famous through Spanish tourism and the 1964 New York World’s Fair.',styles:[{name:'Red sangria',note:'Berry-rich and traditionally based on red wine.'},{name:'Sangria blanca',note:'Lighter version based on white or sparkling wine.'}],flavour:'Wine, orange, lemon, berries, gentle spice and refreshing sweetness.',abv:'Usually 5–12%',howToUse:'Serve very cold over ice with fruit; ideal for groups, summer meals and casual parties.',sellingTip:'Choose sangria for customers seeking a low-strength, fruity bottle that is easy to share.',funFact:'Its name is commonly linked to sangre, the Spanish word for blood, referring to the traditional deep red color.'
  },
  infusion: {
    id:'infusion',name:'Infused spirits',kind:'liqueur',summary:'Spirits flavored by steeping herbs, berries, fruit, roots, honey or spices for a distinctive regional taste.',madeFrom:'A vodka or neutral-spirit base combined with botanicals, berries, fruit, honey, peppers or roots.',howMade:'Flavoring ingredients steep in alcohol so their aromas and color dissolve into the spirit; the infusion is then filtered and may be sweetened.',origin:'Traditional across Eastern and Northern Europe, with related styles made worldwide.',history:'Households and monasteries preserved seasonal plants in alcohol for centuries, creating both bitter medicinal infusions and sweeter celebratory drinks.',styles:[{name:'Herbal or bitter',note:'Roots and botanicals create dry, complex bitterness.'},{name:'Fruit, berry or honey',note:'Softer, aromatic and often lightly sweet.'},{name:'Pepper infusion',note:'Warming spice balanced by honey or herbs.'}],flavour:'Ranges from grassy and bitter to berry-rich, honeyed, spicy or balsamic.',abv:'Usually 20–45%',howToUse:'Serve chilled in small glasses, pair with hearty food, or use a measured amount in cocktails.',sellingTip:'Ask whether the customer wants herbal bitterness, fruit sweetness or warming spice before selecting a bottle.',funFact:'The Russian and Ukrainian word nastoyka comes from the idea of letting ingredients stand and infuse in spirit.'
  },
  'fruit-wine': {
    id:'fruit-wine',name:'Fruit wine',kind:'wine',summary:'Fermented fruit drink made from strawberry, pineapple, plum or other fruit instead of ordinary wine grapes.',madeFrom:'Fruit juice or pulp, water when needed, yeast and sometimes sugar.',howMade:'Yeast ferments fruit sugars, after which the wine is clarified, balanced and bottled in dry or sweet styles.',origin:'Fruit-growing regions worldwide.',history:'Communities fermented seasonal fruit wherever grapes were scarce. Modern fruit wine now ranges from sweet casual bottles to dry regional specialties.',styles:[{name:'Berry wine',note:'Fragrant and often sweet or semi-sweet.'},{name:'Tropical fruit wine',note:'Bright acidity and pineapple or mango character.'},{name:'Ume drink',note:'Japanese plum style with rich fragrance and sweetness.'}],flavour:'Fruit-led, with sweetness and acidity varying greatly by producer.',abv:'Usually 7–14%',howToUse:'Serve chilled, pair with desserts or use as a lower-strength cocktail base.',sellingTip:'Ask for the preferred fruit first, then whether the customer wants dry or sweet.',funFact:'Pineapple wine can taste quite dry after fermentation even though fresh pineapple is sweet.'
  },
  'non-alcoholic-beer': {
    id:'non-alcoholic-beer',name:'Alcohol-free beer',kind:'wine',summary:'Beer with little or no alcohol, brewed to preserve malt, hop and style-specific flavor.',madeFrom:'Water, malted grain, hops and yeast, like ordinary beer.',howMade:'Brewers may restrict fermentation or remove alcohol gently after brewing while retaining aroma and body.',origin:'Produced worldwide, with particularly strong modern growth in Europe.',history:'Low-strength beer has existed for centuries, while modern technology created more convincing alcohol-free lagers and stouts.',styles:[{name:'0.0 lager',note:'Crisp, pale and broadly refreshing.'},{name:'Alcohol-free stout',note:'Dark, roasted and creamy.'}],flavour:'Malt and hops, ranging from light and crisp to dark and roasted.',abv:'Usually 0.0–0.5%',howToUse:'Serve very cold in the appropriate beer glass and pair with normal beer foods.',sellingTip:'Offer it whenever the customer wants beer flavor without alcohol; still ask whether they prefer lager or stout.',funFact:'Labeling rules differ by country, so “alcohol-free” and “0.0” do not always mean exactly the same threshold.'
  },
  'specialty-liqueur': {
    id:'specialty-liqueur',name:'Specialty liqueurs',kind:'liqueur',summary:'Colorful, flavor-led liqueurs built around orange, melon, coconut, almond and other recognizable tastes.',madeFrom:'Neutral spirit or rum, sugar and fruit, nut, coconut or botanical flavoring.',howMade:'Flavor is infused, distilled or blended into spirit, then sweetened, colored when appropriate and bottled.',origin:'Produced worldwide, with famous houses in the Netherlands, Italy, Japan and the Caribbean.',history:'As modern cocktail culture expanded, strongly flavored and brightly colored liqueurs became shortcuts to both taste and visual identity.',styles:[{name:'Blue Curaçao',note:'Sweet orange liqueur with vivid blue color.'},{name:'Melon',note:'Bright green, sweet and fruit-forward.'},{name:'Coconut or almond',note:'Rich dessert and tropical flavors.'}],flavour:'Usually sweet and focused on one dominant flavor.',abv:'Usually 15–30%',howToUse:'Measure as an accent and balance with citrus, soda or a drier base spirit.',sellingTip:'Ask which flavor and color the customer wants, then check that the final drink will not be too sweet.',funFact:'Blue Curaçao tastes of orange; the electric-blue appearance comes from added coloring.'
  },
  'herbal-liqueur': {
    id: 'herbal-liqueur', name: 'Herbal liqueurs', kind: 'liqueur',
    summary: 'Sweet or bitter liqueurs made with many herbs, roots and spices — often with secret recipes (Jägermeister, Chartreuse).',
    madeFrom: 'Neutral spirit or brandy, sugar, and dozens of herbs, roots, flowers and spices.',
    howMade: 'The plants are soaked in alcohol (maceration) or distilled with it, then sweetened and often aged in wood.',
    origin: 'European monasteries and pharmacies.',
    history: 'Monks and pharmacists made herbal liqueurs as medicines from the Middle Ages onwards; many recipes are still secret. Later they became “digestifs”, drunk after a big meal. In the 1990s–2000s Jägermeister became a world-famous party shot.',
    styles: [{ name: 'Sweet herbal', note: 'Jägermeister, Bénédictine, yellow Chartreuse.' }, { name: 'Bitter (amaro / fernet)', note: 'Fernet-Branca and Italian amari — bitter, for after dinner.' }],
    flavour: 'Herbal, spicy and bittersweet; some are minty or honeyed.', abv: '30–55% alcohol',
    howToUse: 'Ice-cold as a shot, on ice after dinner, or in small amounts in cocktails.',
    sellingTip: 'Ask if the customer likes bitter tastes: sweet herbal (Jägermeister) for parties, bitter amaro for after-dinner lovers.',
    funFact: 'Green Chartreuse is one of the few liqueurs that is naturally green — the colour comes from the plants.'
  },
  'cream-liqueur': {
    id: 'cream-liqueur', name: 'Cream liqueurs', kind: 'liqueur',
    summary: 'Sweet, creamy liqueurs made with real cream and spirit (Baileys, Amarula).',
    madeFrom: 'Dairy cream, spirit (often Irish whiskey), sugar and flavours such as cocoa or vanilla.',
    howMade: 'The cream and alcohol are mixed with emulsifiers so they do not separate — this was the big technical problem to solve.',
    origin: 'Ireland, 1970s.',
    history: 'Baileys, launched in 1974, was the first cream liqueur. Its makers found a way to keep cream and whiskey together for years without a fridge. It was a huge success, and many other cream liqueurs followed.',
    styles: [{ name: 'Irish cream', note: 'Whiskey and cream with cocoa — Baileys, Carolans.' }, { name: 'Fruit cream', note: 'Like Amarula (marula fruit) or strawberry creams.' }],
    flavour: 'Sweet, creamy, chocolate, vanilla and caramel.', abv: '15–17% alcohol',
    howToUse: 'On ice, in coffee, in dessert cocktails like the Mudslide, or poured over ice cream.',
    sellingTip: 'A popular gift, especially at Christmas. Tell customers to keep an open bottle in the fridge and finish it within a few months.',
    funFact: 'Do not mix cream liqueur with sour juice or tonic — the acid makes the cream curdle.'
  }
};


// Bottles from the shop catalog that belong to a brand note (e.g. “Martini” ↔ “Martini & Rossi”).
export function shopProductsFor(brand: BrandNote): AlcoholProduct[] {
  const name = norm(brand.name);
  return ALCOHOL_PRODUCTS.filter((product) => {
    const catalogBrand = norm(product.brand);
    return name === catalogBrand || name.startsWith(`${catalogBrand} `) || catalogBrand.startsWith(`${name} `);
  });
}

// Which guide explains a shop bottle.
const PRODUCT_GUIDE: Record<string, string> = { jagermeister: 'herbal-liqueur', 'baileys-original': 'cream-liqueur', cointreau: 'orange-liqueur' };
export function guideIdForProduct(product: AlcoholProduct) {
  if (PRODUCT_GUIDE[product.id]) return PRODUCT_GUIDE[product.id]!;
  const byBrand = Object.entries(BRANDS).find(([, brands]) => brands.some((brand) => shopProductsFor(brand).some((item) => item.id === product.id)));
  if (byBrand) return byBrand[0];
  return ({ whiskey: 'whiskey', bourbon: 'whiskey', champagne: 'sparkling-wine', 'sparkling-wine': 'sparkling-wine', 'port-wine':'port-wine', cognac:'cognac', brandy:'brandy', beer:'beer', 'non-alcoholic-beer':'non-alcoholic-beer', soju:'soju', sake:'sake', cider:'cider', sambuca:'sambuca', sangria:'sangria', infusion:'infusion', 'fruit-wine':'fruit-wine', 'herbal-liqueur':'herbal-liqueur', 'specialty-liqueur':'specialty-liqueur', vodka: 'vodka', gin: 'gin', rum: 'white-rum', tequila: 'tequila', aperitif: 'bitter-aperitif', vermouth: 'vermouth', liqueur: 'herbal-liqueur' } as const)[product.type];
}

