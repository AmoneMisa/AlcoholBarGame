// A compact learner lexicon: everyday words, bar talk and every drink name in the game.
// Inflected forms (likes, liked, liking, sweeter, lightly…) are accepted by stemming in checker.ts.
const WORDS = `
a an the this that these those some any another other one each every no all both either neither
i me my mine you your yours he him his she her hers it its we us our ours they them their theirs myself yourself
something anything nothing everything someone anyone everyone nobody somebody anybody
be am is are was were been being do does did done doing have has had having will would can could shall should may might must
not no yes yeah yep ok okay hmm um oh wow oops please thanks thank sorry excuse welcome hello hi hey bye goodbye evening morning afternoon night tonight today tomorrow yesterday
what which who whom whose where when why how
and or but so because if then than as also too very really quite just only still even maybe perhaps
of in on at to for with without from by about into onto over under after before between up down out off around near
here there now later again soon always never often sometimes usually already ever
like love hate prefer want need wish enjoy choose try taste drink eat order make get give take bring serve pour mix shake stir add put
feel look sound smell seem think know understand mean see hear say tell ask answer help recommend suggest pick keep let go come stay sit stand wait pay cost find start stop finish work relax rest sleep celebrate forget remember hope agree worry
good bad nice great fine perfect lovely wonderful amazing awesome excellent favourite favorite best better worse worst
new old young big small large little long short high low hot cold cool warm fresh dry wet light dark heavy strong weak mild soft hard
sweet sour bitter salty spicy fruity creamy smooth rich sharp crisp tart tangy zesty juicy refreshing sparkling fizzy bubble bubbly still iced frozen herbal floral smoky nutty tropical citrus citrusy
happy sad tired sleepy lazy calm relaxed relaxing stressed busy bored angry nervous excited hungry thirsty awake energetic cheerful
easy simple classic popular special different same full empty ready sure
much many more most less least few lot lots bit enough extra half double single
drink drinks cocktail cocktails mocktail glass bottle can cup shot ice cube cubes straw slice wedge garnish flavour flavor taste recipe menu bar bartender barman customer friend day week
alcohol alcoholic non spirit spirits liquor liqueur wine beer water juice soda tonic cola syrup sugar salt cream milk coffee espresso tea lemonade
rum gin vodka tequila whiskey whisky brandy cognac port beer soju sake cider vermouth bitters aperitif champagne prosecco sambuca sangria infusion tincture nastoyka настойка настойки curacao curaçao umeshu
lime lemon orange grapefruit pineapple cranberry coconut mint ginger strawberry raspberry cherry berry apple banana mango peach grape watermelon passion fruit fruits herb herbs
molinari luxardo dei cesari ramazzotti don simón lolea peñasol nemiroff honey pepper żubrówka bison grass beluga hunting riga balsam
boone's farm hill mauiwine maui blanc choya heineken guinness corona cero budweiser zero becherovka fernet branca chartreuse bols de kuyper midori melon malibu disaronno originale
agave almond anise apple berry bittersweet bold botanical bright caramel cinnamon clean complex cucumber dried elegant grass juniper malty marzipan minty neutral nutty oak plum rice ripe roasted savory slightly smoky sugarcane vanilla
mojito daiquiri margarita pina piña colada cosmopolitan fashioned martini negroni mai tai french moscow mule paloma island long
cuba libre stormy tom collins fizz gimlet southside rickey bee knees lady pegu club corpse reviver number vesper kamikaze drop cape codder sea breeze bay madras woo sex beach russian mudslide boulevardier manhattan rob roy julep highball lynchburg rush sazerac paper plane runner hurricane planter punch zombie painkiller jungle bird cuban presidente hotel nacional aperitivo spritz americano sbagliato hugo
jack daniel's beam white label jameson irish johnnie walker black chivas regal maker's mark jägermeister baileys cointreau absolut smirnoff grey goose bombay sapphire beefeater london hendrick's bacardí carta blanca captain morgan havana años jose cuervo especial gold patrón aperol bianco moët chandon impérial veuve clicquot yellow mionetto prosecco
taylor's late bottled vintage graham's tawny hennessy vs rémy martin vsop courvoisier guinness draught heineken original corona stella artois budweiser jinro chamisul chum churum gekkeikan traditional dassai forty-five junmai daiginjo hakutsuru st-rémy torres gran reserva strongbow somersby magners
kind type sort style way thing things time moment idea question choice option size price money
dollar dollars euro pound percent one two three four five six seven eight nine ten
mood feeling party birthday date dinner food snack
shop store seller sell sold buy bought customer customers shelf shelves stock brand size sample gift present wrap popular delivery deliver supplier wholesale retail id passport licence license
price cost cheap expensive discount sale percent off total budget cash card change receipt refund exchange return afford bag pack packs order orders litre liter bill value sealed quantity occasion
twenty thirty forty fifty sixty seventy eighty ninety hundred thousand fourteen fifteen eleven twelve monday tuesday wednesday thursday friday saturday sunday soon possible instead similar look looking
im i'm i'd i'll i've you're you'd you'll you've he's she's it's we're they're that's what's there's let's
don't doesn't didn't isn't aren't wasn't weren't can't cannot couldn't won't wouldn't shouldn't haven't hasn't
`;

export const LEXICON = new Set(WORDS.split(/\s+/).filter(Boolean));

// Irregular forms that stemming cannot recover.
export const IRREGULAR: Record<string, string> = {
  made: 'make', makes: 'make', took: 'take', taken: 'take', drank: 'drink', drunk: 'drink', ate: 'eat', eaten: 'eat', got: 'get', gotten: 'get',
  gave: 'give', given: 'give', brought: 'bring', felt: 'feel', thought: 'think', knew: 'know', known: 'know', saw: 'see', seen: 'see',
  heard: 'hear', said: 'say', told: 'tell', went: 'go', gone: 'go', came: 'come', sat: 'sit', stood: 'stand', paid: 'pay', found: 'find',
  chose: 'choose', chosen: 'choose', kept: 'keep', meant: 'mean', understood: 'understand', forgot: 'forget', forgotten: 'forget',
  better: 'good', best: 'good', worse: 'bad', worst: 'bad', children: 'child', people: 'person'
};

// Adjectives that form comparatives with -er (so "more sweet" -> "sweeter").
export const SHORT_COMPARATIVES: Record<string, string> = {
  sweet: 'sweeter', strong: 'stronger', light: 'lighter', weak: 'weaker', mild: 'milder', cold: 'colder', cool: 'cooler',
  warm: 'warmer', fresh: 'fresher', dry: 'drier', rich: 'richer', sharp: 'sharper', soft: 'softer', big: 'bigger', small: 'smaller',
  cheap: 'cheaper', long: 'longer', short: 'shorter', happy: 'happier', lazy: 'lazier', easy: 'easier',
  busy: 'busier', sleepy: 'sleepier', nice: 'nicer', calm: 'calmer'
};

// Base verb -> third person singular.
export const THIRD_PERSON: Record<string, string> = {
  like: 'likes', want: 'wants', need: 'needs', prefer: 'prefers', love: 'loves', hate: 'hates', enjoy: 'enjoys', make: 'makes', taste: 'tastes',
  have: 'has', do: 'does', go: 'goes', feel: 'feels', look: 'looks', sound: 'sounds', smell: 'smells', seem: 'seems', cost: 'costs',
  drink: 'drinks', mix: 'mixes', help: 'helps', know: 'knows', think: 'thinks', work: 'works', get: 'gets', come: 'comes', say: 'says',
  wish: 'wishes', try: 'tries', mean: 'means', keep: 'keeps', relax: 'relaxes', contain: 'contains'
};
export const BASE_FORM: Record<string, string> = Object.fromEntries(Object.entries(THIRD_PERSON).map(([base, third]) => [third, base]));

// Short learner-friendly definitions, shown as tap hints inside customer lines.
export const GLOSSARY: Record<string, string> = {
  refreshing: 'makes you feel cool and fresh', relaxed: 'calm, not worried', sour: 'sharp taste, like lemon', bitter: 'strong, not sweet taste, like dark coffee',
  sparkling: 'with small bubbles', bubbles: 'small balls of air in a drink', fruity: 'tastes of fruit', creamy: 'thick and smooth, like cream',
  strong: 'with a lot of alcohol', light: 'with little alcohol', tropical: 'from hot countries, like pineapple and coconut', herbal: 'tastes of plants like mint',
  awake: 'not sleeping, full of energy', taste: 'the flavour in your mouth', flavour: 'how food or a drink tastes', sweet: 'tastes of sugar',
  spicy: 'hot taste, like ginger or pepper', dry: 'not sweet', prefer: 'like one thing more than another', recommend: 'say that something is good for someone',
  garnish: 'a small decoration on a drink', citrus: 'fruit like lemon, lime and orange', cheerful: 'happy and positive', rough: 'difficult and unpleasant'
};
