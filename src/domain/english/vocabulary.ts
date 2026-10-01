import { MORE_VOCABULARY } from './vocabularyMore';
import { SITUATION_VOCABULARY } from './vocabularySituations';

// Bar and shop vocabulary for learners: every entry has a simple meaning, a real bar example,
// pronunciation, and (where useful) an opposite or a related word to learn next.

export type VocabTopic = 'Taste' | 'Strength & texture' | 'Fruit & ingredients' | 'Feelings' | 'At the bar' | 'Polite phrases' | 'Shop & products' | 'Money & payment'
  | 'Age & documents' | 'Delivery & packages' | 'Orders & schedules' | 'Deals & discounts' | 'Events & bookings' | 'Responsible service'
  | 'First aid' | 'Emergencies & security' | 'Payments & currency' | 'Breakage & damage' | 'Rules & law' | 'Guests & feelings' | 'Celebrations';

export interface VocabEntry {
  word: string;
  ipa: string;
  pos: 'adjective' | 'noun' | 'verb' | 'phrase' | 'adverb';
  topic: VocabTopic;
  level: 'A1' | 'A2' | 'B1';
  meaning: string;
  example: string;
  opposite?: string;
  related?: string[];
  note?: string;
  forms?: string[];
}

export const VOCABULARY: VocabEntry[] = [
  // Taste
  { word: 'sweet', ipa: '/swiːt/', pos: 'adjective', topic: 'Taste', level: 'A1', meaning: 'Tastes of sugar or honey.', example: 'Do you like sweet drinks?', opposite: 'dry / bitter', related: ['sugar', 'syrup'], forms: ['sweeter', 'sweetest'] },
  { word: 'sour', ipa: '/ˈsaʊə/', pos: 'adjective', topic: 'Taste', level: 'A1', meaning: 'A sharp taste, like lemon or lime.', example: 'A Daiquiri is a little sour.', opposite: 'sweet', related: ['tart', 'citrus'], note: 'Both “more sour” and “sourer” are correct.' },
  { word: 'bitter', ipa: '/ˈbɪtə/', pos: 'adjective', topic: 'Taste', level: 'A2', meaning: 'A strong, not sweet taste, like dark coffee or tonic water.', example: 'A Negroni is quite bitter.', opposite: 'sweet' },
  { word: 'fruity', ipa: '/ˈfruːti/', pos: 'adjective', topic: 'Taste', level: 'A1', meaning: 'Tastes of fruit.', example: 'I want something fruity and fresh.', related: ['fruit', 'juicy'] },
  { word: 'fresh', ipa: '/freʃ/', pos: 'adjective', topic: 'Taste', level: 'A1', meaning: 'Clean, cool and light, like mint or citrus.', example: 'A Mojito is very fresh.', related: ['refreshing'], forms: ['fresher'] },
  { word: 'refreshing', ipa: '/rɪˈfreʃɪŋ/', pos: 'adjective', topic: 'Taste', level: 'A2', meaning: 'Makes you feel cool and full of energy again.', example: 'Gin and tonic is refreshing on a hot day.', related: ['fresh'] },
  { word: 'dry', ipa: '/draɪ/', pos: 'adjective', topic: 'Taste', level: 'A2', meaning: 'For drinks: not sweet.', example: 'A Martini is dry and strong.', opposite: 'sweet', note: 'A “dry” drink is still wet — it just has little sugar!' },
  { word: 'spicy', ipa: '/ˈspaɪsi/', pos: 'adjective', topic: 'Taste', level: 'A2', meaning: 'A hot taste that warms your mouth, like ginger or pepper.', example: 'Ginger beer is a little spicy.', related: ['ginger'] },
  { word: 'creamy', ipa: '/ˈkriːmi/', pos: 'adjective', topic: 'Taste', level: 'A2', meaning: 'Thick and smooth, like cream.', example: 'A Piña Colada is sweet and creamy.', related: ['smooth', 'coconut'] },
  { word: 'tropical', ipa: '/ˈtrɒpɪkəl/', pos: 'adjective', topic: 'Taste', level: 'B1', meaning: 'Tastes of fruit from hot countries, like pineapple and coconut.', example: 'A Mai Tai tastes tropical.' },
  { word: 'citrus', ipa: '/ˈsɪtrəs/', pos: 'noun', topic: 'Taste', level: 'B1', meaning: 'The fruit family of lemon, lime, orange and grapefruit.', example: 'This cocktail has a lot of citrus.', related: ['lime', 'lemon'], forms: ['citrusy'] },
  { word: 'flavour', ipa: '/ˈfleɪvə/', pos: 'noun', topic: 'Taste', level: 'A2', meaning: 'The special taste of a food or drink.', example: 'What flavours do you like?', related: ['taste'], note: 'American spelling: flavor.', forms: ['flavours', 'flavor', 'flavors'] },
  { word: 'taste', ipa: '/teɪst/', pos: 'noun', topic: 'Taste', level: 'A1', meaning: 'What you feel in your mouth when you eat or drink. Also a verb: “It tastes good.”', example: 'Do you like the taste of mint?', related: ['flavour'], forms: ['tastes', 'tasted'] },

  // Strength & texture
  { word: 'strong', ipa: '/strɒŋ/', pos: 'adjective', topic: 'Strength & texture', level: 'A1', meaning: 'For drinks: with a lot of alcohol.', example: 'Do you want something strong?', opposite: 'light', forms: ['stronger'] },
  { word: 'light', ipa: '/laɪt/', pos: 'adjective', topic: 'Strength & texture', level: 'A1', meaning: 'For drinks: with little alcohol, easy to drink.', example: 'I would like something light, please.', opposite: 'strong', forms: ['lighter'] },
  { word: 'bubbles', ipa: '/ˈbʌbəlz/', pos: 'noun', topic: 'Strength & texture', level: 'A1', meaning: 'Small balls of air inside a drink, like in soda.', example: 'Would you like a drink with bubbles?', related: ['sparkling', 'fizzy'], forms: ['bubble', 'bubbly'] },
  { word: 'sparkling', ipa: '/ˈspɑːklɪŋ/', pos: 'adjective', topic: 'Strength & texture', level: 'A2', meaning: 'With bubbles.', example: 'French 75 uses sparkling wine.', opposite: 'still', related: ['fizzy'] },
  { word: 'fizzy', ipa: '/ˈfɪzi/', pos: 'adjective', topic: 'Strength & texture', level: 'A2', meaning: 'With a lot of bubbles (informal).', example: 'Cola is very fizzy.', related: ['sparkling'] },
  { word: 'smooth', ipa: '/smuːð/', pos: 'adjective', topic: 'Strength & texture', level: 'B1', meaning: 'Soft and easy to drink, not sharp.', example: 'This whiskey is very smooth.', opposite: 'sharp' },
  { word: 'ice', ipa: '/aɪs/', pos: 'noun', topic: 'Strength & texture', level: 'A1', meaning: 'Frozen water. It makes drinks cold.', example: 'Would you like ice?', note: 'Uncountable: “some ice”, “an ice cube”.' },

  // Fruit & ingredients
  { word: 'lime', ipa: '/laɪm/', pos: 'noun', topic: 'Fruit & ingredients', level: 'A1', meaning: 'A small green citrus fruit. Very sour.', example: 'I love the taste of lime.', related: ['lemon', 'citrus'], forms: ['limes'] },
  { word: 'lemon', ipa: '/ˈlemən/', pos: 'noun', topic: 'Fruit & ingredients', level: 'A1', meaning: 'A yellow citrus fruit. Sour.', example: 'A Whiskey Sour has lemon juice.', related: ['lime'], forms: ['lemons'] },
  { word: 'pineapple', ipa: '/ˈpaɪnæpəl/', pos: 'noun', topic: 'Fruit & ingredients', level: 'A1', meaning: 'A big tropical fruit, yellow and sweet inside.', example: 'A Piña Colada has pineapple and coconut.', related: ['tropical'] },
  { word: 'mint', ipa: '/mɪnt/', pos: 'noun', topic: 'Fruit & ingredients', level: 'A1', meaning: 'A green plant with a fresh, cool taste.', example: 'The Mojito has fresh mint.', related: ['herb', 'fresh'] },
  { word: 'ginger', ipa: '/ˈdʒɪndʒə/', pos: 'noun', topic: 'Fruit & ingredients', level: 'A2', meaning: 'A root with a hot, spicy taste.', example: 'A Moscow Mule uses ginger beer.', related: ['spicy'] },
  { word: 'coconut', ipa: '/ˈkəʊkənʌt/', pos: 'noun', topic: 'Fruit & ingredients', level: 'A1', meaning: 'A big brown nut with white, sweet flesh and milk inside.', example: 'Coconut cream makes drinks creamy.' },
  { word: 'syrup', ipa: '/ˈsɪrəp/', pos: 'noun', topic: 'Fruit & ingredients', level: 'A2', meaning: 'Sugar dissolved in water. It makes drinks sweet.', example: 'Add ten millilitres of sugar syrup.', related: ['sweet'] },
  { word: 'garnish', ipa: '/ˈɡɑːnɪʃ/', pos: 'noun', topic: 'Fruit & ingredients', level: 'B1', meaning: 'A small decoration on a drink, like a lime wedge or a mint leaf.', example: 'The garnish is a slice of orange.' },
  { word: 'wedge', ipa: '/wedʒ/', pos: 'noun', topic: 'Fruit & ingredients', level: 'B1', meaning: 'A piece of fruit cut in a triangle shape.', example: 'Add a lime wedge, please.', related: ['slice'] },
  { word: 'spirit', ipa: '/ˈspɪrɪt/', pos: 'noun', topic: 'Fruit & ingredients', level: 'B1', meaning: 'A strong alcoholic drink like rum, gin, vodka or whiskey.', example: 'Which spirit do you prefer: rum or gin?', forms: ['spirits'] },

  // Feelings
  { word: 'relaxed', ipa: '/rɪˈlækst/', pos: 'adjective', topic: 'Feelings', level: 'A2', meaning: 'Calm and not worried.', example: 'I want something that makes me feel relaxed.', opposite: 'stressed', related: ['calm'] },
  { word: 'tired', ipa: '/ˈtaɪəd/', pos: 'adjective', topic: 'Feelings', level: 'A1', meaning: 'You need rest or sleep.', example: 'I am so tired tonight.', opposite: 'awake', related: ['sleepy'] },
  { word: 'awake', ipa: '/əˈweɪk/', pos: 'adjective', topic: 'Feelings', level: 'A2', meaning: 'Not sleeping; full of energy.', example: 'Coffee keeps me awake.', opposite: 'asleep / tired' },
  { word: 'happy', ipa: '/ˈhæpi/', pos: 'adjective', topic: 'Feelings', level: 'A1', meaning: 'Feeling good and pleased.', example: 'This drink makes me happy.', opposite: 'sad', forms: ['happier'] },
  { word: 'calm', ipa: '/kɑːm/', pos: 'adjective', topic: 'Feelings', level: 'A2', meaning: 'Quiet and peaceful, not excited or angry.', example: 'I want to feel calm after work.', related: ['relaxed'], note: 'The “l” is silent: /kɑːm/.' },
  { word: 'warm', ipa: '/wɔːm/', pos: 'adjective', topic: 'Feelings', level: 'A1', meaning: 'A little hot, in a pleasant way.', example: 'Whiskey makes me feel warm.', opposite: 'cool' },
  { word: 'rough', ipa: '/rʌf/', pos: 'adjective', topic: 'Feelings', level: 'B1', meaning: 'For a day: difficult and unpleasant.', example: 'I am having a rough day.', opposite: 'easy', note: '“-ough” here sounds like “uff”.' },
  { word: 'cheerful', ipa: '/ˈtʃɪəfəl/', pos: 'adjective', topic: 'Feelings', level: 'B1', meaning: 'Happy and positive.', example: 'She is always cheerful.', related: ['happy'] },

  // At the bar (verbs & nouns)
  { word: 'recommend', ipa: '/ˌrekəˈmend/', pos: 'verb', topic: 'At the bar', level: 'A2', meaning: 'To say that something is good for someone.', example: 'I recommend the Mojito. It is fresh and light.', related: ['suggest'], note: 'One “c”, double “m”.', forms: ['recommends', 'recommended', 'recommendation'] },
  { word: 'prefer', ipa: '/prɪˈfɜː/', pos: 'verb', topic: 'At the bar', level: 'A2', meaning: 'To like one thing more than another.', example: 'Do you prefer rum or gin?', note: 'Pattern: prefer A or B? / I prefer A to B.', forms: ['prefers', 'preferred'] },
  { word: 'order', ipa: '/ˈɔːdə/', pos: 'verb', topic: 'At the bar', level: 'A1', meaning: 'To ask for food or a drink in a bar or restaurant.', example: 'Are you ready to order?', forms: ['orders', 'ordered'] },
  { word: 'serve', ipa: '/sɜːv/', pos: 'verb', topic: 'At the bar', level: 'A2', meaning: 'To give food or drinks to a customer.', example: 'We serve it with ice and lime.', forms: ['serves', 'served'] },
  { word: 'shake', ipa: '/ʃeɪk/', pos: 'verb', topic: 'At the bar', level: 'A1', meaning: 'To move a shaker quickly up and down to mix and cool a drink.', example: 'I will shake it with ice.', related: ['stir'], forms: ['shakes', 'shaken'] },
  { word: 'stir', ipa: '/stɜː/', pos: 'verb', topic: 'At the bar', level: 'A2', meaning: 'To mix gently with a spoon.', example: 'A Negroni is stirred, not shaken.', related: ['shake'], forms: ['stirred'] },
  { word: 'menu', ipa: '/ˈmenjuː/', pos: 'noun', topic: 'At the bar', level: 'A1', meaning: 'The list of food and drinks you can order.', example: 'Here is our cocktail menu.' },
  { word: 'bill', ipa: '/bɪl/', pos: 'noun', topic: 'At the bar', level: 'A1', meaning: 'The paper that shows how much you must pay.', example: 'Can I have the bill, please?', note: 'American English: the check.' },
  { word: 'cheers', ipa: '/tʃɪəz/', pos: 'phrase', topic: 'At the bar', level: 'A1', meaning: 'What people say when they lift their glasses together. In the UK it also means “thanks”.', example: 'Cheers! Enjoy your drink.' },

  // Polite phrases
  { word: 'would you like', ipa: '/wʊd juː laɪk/', pos: 'phrase', topic: 'Polite phrases', level: 'A1', meaning: 'A polite way to offer something. Softer than “do you want”.', example: 'Would you like a Mojito?', related: ['do you want'] },
  { word: 'here you are', ipa: '/hɪə juː ɑː/', pos: 'phrase', topic: 'Polite phrases', level: 'A1', meaning: 'What you say when you give something to someone.', example: 'Here you are — one Daiquiri.' },
  { word: 'enjoy', ipa: '/ɪnˈdʒɔɪ/', pos: 'verb', topic: 'Polite phrases', level: 'A1', meaning: 'To get pleasure from something.', example: 'Enjoy your drink!', forms: ['enjoys', 'enjoyed'] },
  { word: 'excuse me', ipa: '/ɪkˈskjuːz miː/', pos: 'phrase', topic: 'Polite phrases', level: 'A1', meaning: 'A polite way to get attention or to say sorry for a small problem.', example: 'Excuse me, what is in this cocktail?' },
  { word: 'certainly', ipa: '/ˈsɜːtənli/', pos: 'adverb', topic: 'Polite phrases', level: 'A2', meaning: 'A polite “yes, of course”.', example: 'Certainly! One Martini coming up.' },
  { word: 'coming right up', ipa: '/ˈkʌmɪŋ raɪt ʌp/', pos: 'phrase', topic: 'Polite phrases', level: 'B1', meaning: 'Informal: “I will bring it very soon”.', example: 'Two Mojitos, coming right up!' },

  // Shop & products (seller / retail)
  { word: 'customer', ipa: '/ˈkʌstəmə/', pos: 'noun', topic: 'Shop & products', level: 'A1', meaning: 'A person who buys something in a shop or a bar.', example: 'Our customers love this wine.', related: ['client', 'guest'], forms: ['customers'] },
  { word: 'shelf', ipa: '/ʃelf/', pos: 'noun', topic: 'Shop & products', level: 'A2', meaning: 'A flat board on a wall where products stand.', example: 'The gin is on the top shelf.', note: 'Plural: shelves (f → ves).', forms: ['shelves'] },
  { word: 'in stock', ipa: '/ɪn stɒk/', pos: 'phrase', topic: 'Shop & products', level: 'A2', meaning: 'Available in the shop now.', example: 'Yes, we have it in stock.', opposite: 'out of stock', related: ['stock'] },
  { word: 'out of stock', ipa: '/aʊt əv stɒk/', pos: 'phrase', topic: 'Shop & products', level: 'A2', meaning: 'Not available now; the shop has sold all of it.', example: 'Sorry, it is out of stock until Friday.', opposite: 'in stock' },
  { word: 'brand', ipa: '/brænd/', pos: 'noun', topic: 'Shop & products', level: 'A2', meaning: 'The name of the company that makes a product.', example: 'Which brand of vodka do you prefer?', forms: ['brands'] },
  { word: 'size', ipa: '/saɪz/', pos: 'noun', topic: 'Shop & products', level: 'A1', meaning: 'How big something is.', example: 'We also have a bigger size.', related: ['small', 'large'], forms: ['sizes'] },
  { word: 'sample', ipa: '/ˈsɑːmpəl/', pos: 'noun', topic: 'Shop & products', level: 'B1', meaning: 'A small free amount to try before you buy.', example: 'Would you like to try a sample?', related: ['taste'], forms: ['samples'] },
  { word: 'gift', ipa: '/ɡɪft/', pos: 'noun', topic: 'Shop & products', level: 'A1', meaning: 'Something you give to another person; a present.', example: 'Is it a gift? I can wrap it for you.', related: ['present', 'wrap'], forms: ['gifts'] },
  { word: 'wrap', ipa: '/ræp/', pos: 'verb', topic: 'Shop & products', level: 'B1', meaning: 'To cover a gift with nice paper.', example: 'Would you like me to wrap it?', note: 'The “w” is silent: /ræp/.', forms: ['wrapped', 'wrapping'] },
  { word: 'popular', ipa: '/ˈpɒpjʊlə/', pos: 'adjective', topic: 'Shop & products', level: 'A2', meaning: 'Liked and bought by many people.', example: 'It is our most popular wine.', related: ['best-seller'], note: 'Long adjective: “more popular”, “the most popular” (not “popularer”).' },
  { word: 'delivery', ipa: '/dɪˈlɪvəri/', pos: 'noun', topic: 'Shop & products', level: 'A2', meaning: 'Bringing products to a customer’s address.', example: 'Delivery is free for orders over one hundred dollars.', related: ['deliver', 'order'], forms: ['deliveries', 'deliver'] },
  { word: 'supplier', ipa: '/səˈplaɪə/', pos: 'noun', topic: 'Shop & products', level: 'B1', meaning: 'A company that sells products to shops and bars.', example: 'Our supplier delivers on Mondays.', related: ['wholesale'], forms: ['suppliers', 'supply'] },
  { word: 'wholesale', ipa: '/ˈhəʊlseɪl/', pos: 'adjective', topic: 'Shop & products', level: 'B1', meaning: 'Selling big amounts to businesses, usually at a lower price.', example: 'Wholesale prices are cheaper per bottle.', opposite: 'retail' },
  { word: 'retail', ipa: '/ˈriːteɪl/', pos: 'noun', topic: 'Shop & products', level: 'B1', meaning: 'Selling products to ordinary customers in a shop.', example: 'She works in retail, in a wine shop.', opposite: 'wholesale' },
  { word: 'ID', ipa: '/ˌaɪ ˈdiː/', pos: 'noun', topic: 'Shop & products', level: 'A2', meaning: 'A card or document that shows who you are and how old you are.', example: 'Can I see your ID, please?', related: ['passport'], note: 'Short for “identification”. Say the letters: “I-D”.', forms: ['id'] },

  // Money & payment
  { word: 'price', ipa: '/praɪs/', pos: 'noun', topic: 'Money & payment', level: 'A1', meaning: 'How much money something costs.', example: 'The price is on the label.', related: ['cost'], forms: ['prices'] },
  { word: 'cost', ipa: '/kɒst/', pos: 'verb', topic: 'Money & payment', level: 'A1', meaning: 'To have a price.', example: 'This bottle costs twenty dollars.', note: 'Past form is the same: cost. “How much does it cost?”', forms: ['costs'] },
  { word: 'cheap', ipa: '/tʃiːp/', pos: 'adjective', topic: 'Money & payment', level: 'A1', meaning: 'Not expensive; low price.', example: 'This one is cheaper.', opposite: 'expensive', note: 'Sellers often say “good value” or “affordable” — it sounds nicer than “cheap”.', forms: ['cheaper', 'cheapest'] },
  { word: 'expensive', ipa: '/ɪkˈspensɪv/', pos: 'adjective', topic: 'Money & payment', level: 'A1', meaning: 'Costs a lot of money.', example: 'That champagne is very expensive.', opposite: 'cheap', note: 'Long adjective: “more expensive”, never “expensiver”.' },
  { word: 'discount', ipa: '/ˈdɪskaʊnt/', pos: 'noun', topic: 'Money & payment', level: 'A2', meaning: 'A lower price than usual.', example: 'You get a ten percent discount on ten packs.', related: ['sale', 'off'], forms: ['discounts'] },
  { word: 'on sale', ipa: '/ɒn seɪl/', pos: 'phrase', topic: 'Money & payment', level: 'A2', meaning: 'Cheaper than usual for a short time.', example: 'This rum is on sale this week.', note: '“For sale” is different: it just means you can buy it.' },
  { word: 'total', ipa: '/ˈtəʊtəl/', pos: 'noun', topic: 'Money & payment', level: 'A2', meaning: 'The full amount to pay for everything.', example: 'Your total is thirty dollars.' },
  { word: 'cash', ipa: '/kæʃ/', pos: 'noun', topic: 'Money & payment', level: 'A1', meaning: 'Paper money and coins.', example: 'Would you like to pay in cash?', related: ['card'], note: 'Say “IN cash” but “BY card”.' },
  { word: 'card', ipa: '/kɑːd/', pos: 'noun', topic: 'Money & payment', level: 'A1', meaning: 'A plastic bank card for paying.', example: 'Can I pay by card?', related: ['cash'], forms: ['cards'] },
  { word: 'change', ipa: '/tʃeɪndʒ/', pos: 'noun', topic: 'Money & payment', level: 'A2', meaning: 'The money you give back when the customer pays too much.', example: 'Here is your change.', note: 'Also a verb: “to change” = to make different.' },
  { word: 'receipt', ipa: '/rɪˈsiːt/', pos: 'noun', topic: 'Money & payment', level: 'A2', meaning: 'A small paper that shows what you bought and paid.', example: 'Please keep your receipt.', note: 'The “p” is silent: /rɪˈsiːt/.', forms: ['receipts'] },
  { word: 'refund', ipa: '/ˈriːfʌnd/', pos: 'noun', topic: 'Money & payment', level: 'B1', meaning: 'Money you get back when you return a product.', example: 'We can give you a refund.', related: ['exchange', 'return'] },
  { word: 'exchange', ipa: '/ɪksˈtʃeɪndʒ/', pos: 'verb', topic: 'Money & payment', level: 'B1', meaning: 'To give back a product and take a different one.', example: 'You can exchange it within fourteen days.', related: ['refund'], forms: ['exchanged'] },
  { word: 'afford', ipa: '/əˈfɔːd/', pos: 'verb', topic: 'Money & payment', level: 'B1', meaning: 'To have enough money to buy something.', example: 'I can’t afford the big bottle today.', note: 'Usually with can / can’t: “I can afford it.”' }
  ,...MORE_VOCABULARY,
  ...SITUATION_VOCABULARY
];

export const VOCAB_TOPICS: VocabTopic[] = ['Taste', 'Strength & texture', 'Fruit & ingredients', 'Feelings', 'At the bar', 'Polite phrases', 'Shop & products', 'Money & payment',
  'Age & documents', 'Events & bookings', 'Responsible service', 'Delivery & packages', 'Orders & schedules', 'Deals & discounts',
  'Guests & feelings', 'First aid', 'Emergencies & security', 'Payments & currency', 'Breakage & damage', 'Rules & law', 'Celebrations'];

// Which job a topic belongs to. Polite phrases and feelings help in both.
export const TOPIC_CONTEXT: Record<VocabTopic, 'bar' | 'shop' | 'buyer' | 'both'> = {
  Taste: 'both', 'Strength & texture': 'bar', 'Fruit & ingredients': 'both', Feelings: 'both', 'At the bar': 'bar', 'Polite phrases': 'both',
  'Shop & products': 'shop', 'Money & payment': 'shop',
  'Age & documents': 'both', 'Events & bookings': 'bar', 'Responsible service': 'bar',
  'Delivery & packages': 'buyer', 'Orders & schedules': 'buyer', 'Deals & discounts': 'buyer',
  'Guests & feelings': 'bar', 'First aid': 'both', 'Emergencies & security': 'both', 'Payments & currency': 'both', 'Breakage & damage': 'both', 'Rules & law': 'both', Celebrations: 'bar'
};

// Look up a word as it appears in a sentence (any listed form, any case).
const INDEX = new Map<string, VocabEntry>();
for (const entry of VOCABULARY) for (const form of [entry.word, ...(entry.forms ?? [])]) INDEX.set(form.toLowerCase(), entry);
export function lookupWord(word: string) {
  return INDEX.get(word.toLowerCase().replace(/’/g, "'"));
}
