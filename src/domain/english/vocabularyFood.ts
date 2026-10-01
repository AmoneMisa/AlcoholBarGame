import type { VocabEntry } from './vocabulary';

// Food with drinks, allergies, pairing, advice, and the promotions and moods of a bar night.

const w = (
  word: string, ipa: string, pos: VocabEntry['pos'], topic: VocabEntry['topic'], level: VocabEntry['level'],
  meaning: string, example: string, extra: Partial<Pick<VocabEntry, 'opposite' | 'related' | 'note' | 'forms'>> = {}
): VocabEntry => ({ word, ipa, pos, topic, level, meaning, example, ...extra });

export const FOOD_VOCABULARY: VocabEntry[] = [
  // ---- Food & pairing ----
  w('snack', '/snæk/', 'noun', 'Food & pairing', 'A1', 'A small amount of food between meals, or with a drink.', 'Would you like a snack with your beer?', { forms: ['snacks'] }),
  w('fries', '/fraɪz/', 'noun', 'Food & pairing', 'A1', 'Thin pieces of potato fried in oil.', 'A portion of fries goes well with a cold beer.', { related: ['chips'] }),
  w('olives', '/ˈɒlɪvz/', 'noun', 'Food & pairing', 'A2', 'Small green or black fruits with a salty taste.', 'Olives are a classic snack with a Martini.', { forms: ['olive'] }),
  w('nuts', '/nʌts/', 'noun', 'Food & pairing', 'A1', 'Small hard seeds that you eat, often salted.', 'We have salted nuts on the bar.', { forms: ['nut'] }),
  w('cheese plate', '/ˈtʃiːz pleɪt/', 'noun', 'Food & pairing', 'A2', 'A plate with different kinds of cheese.', 'A cheese plate goes very well with wine.', { related: ['meat plate'] }),
  w('meat plate', '/ˈmiːt pleɪt/', 'noun', 'Food & pairing', 'A2', 'A plate with cold meat, such as ham and sausage.', 'Shall I bring a meat plate for the table?'),
  w('garlic bread', '/ˈɡɑːlɪk bred/', 'noun', 'Food & pairing', 'A2', 'Bread with butter and garlic, baked until warm.', 'The garlic bread is hot and fresh.'),
  w('portion', '/ˈpɔːʃn/', 'noun', 'Food & pairing', 'A2', 'The amount of food for one person.', 'One portion is enough for two people.', { forms: ['portions'] }),
  w('hungry', '/ˈhʌŋɡri/', 'adjective', 'Food & pairing', 'A1', 'Wanting to eat.', 'I am a little hungry. What do you have?', { opposite: 'full' }),
  w('full', '/fʊl/', 'adjective', 'Food & pairing', 'A1', 'Not able to eat more.', 'No, thank you. I am full.', { opposite: 'hungry' }),
  w('salty', '/ˈsɔːlti/', 'adjective', 'Food & pairing', 'A1', 'Tastes of salt.', 'Salty snacks make you want another drink.', { opposite: 'sweet' }),
  w('crispy', '/ˈkrɪspi/', 'adjective', 'Food & pairing', 'B1', 'Hard and fresh, with a nice sound when you bite it.', 'The wings are hot and crispy.'),
  w('mild', '/maɪld/', 'adjective', 'Food & pairing', 'B1', 'Not strong in taste.', 'The cheese is mild and creamy.', { opposite: 'spicy' }),
  w('pairing', '/ˈpeərɪŋ/', 'noun', 'Food & pairing', 'B1', 'A food and a drink that taste good together.', 'Cheese and red wine is a classic pairing.', { related: ['match', 'goes with'], forms: ['pairings'] }),
  w('balance', '/ˈbæləns/', 'verb', 'Food & pairing', 'B1', 'To make two things equal, so neither is too strong.', 'Salty cheese balances a sweet wine.', { forms: ['balances', 'balanced'] }),
  w('ingredient', '/ɪnˈɡriːdiənt/', 'noun', 'Food & pairing', 'A2', 'One of the things that a dish or a drink is made from.', 'Please tell me every ingredient. I have an allergy.', { forms: ['ingredients'] }),
  w('gluten', '/ˈɡluːtn/', 'noun', 'Food & pairing', 'B1', 'A substance in wheat bread and pasta that some people cannot eat.', 'Is there any gluten in this?', { related: ['wheat'] }),
  w('vegetarian', '/ˌvedʒəˈteəriən/', 'adjective', 'Food & pairing', 'A2', 'Without meat.', 'Do you have anything vegetarian?'),
  w('suggest', '/səˈdʒest/', 'verb', 'Food & pairing', 'B1', 'To offer an idea for someone to think about.', 'Can you suggest something light?', { related: ['recommend'], forms: ['suggests', 'suggested'] }),
  w('mocktail', '/ˈmɒkteɪl/', 'noun', 'Food & pairing', 'B1', 'A cocktail without alcohol.', 'I will make you a fresh mocktail.', { forms: ['mocktails'] }),
  w('sip', '/sɪp/', 'verb', 'Food & pairing', 'B1', 'To drink a very small amount.', 'Sip it slowly to taste it.', { forms: ['sips', 'sipped'] }),

  // ---- Bar events and promotions ----
  w('promotion', '/prəˈməʊʃn/', 'noun', 'Events & bookings', 'B1', 'A special offer that makes people buy more.', 'Tonight we have a promotion on wine.', { forms: ['promotions'], related: ['offer', 'deal'] }),
  w('ladies’ night', '/ˈleɪdiz naɪt/', 'noun', 'Events & bookings', 'B1', 'An evening with special offers for women.', 'On ladies’ night, every third cocktail is free for women.'),
  w('loyalty', '/ˈlɔɪəlti/', 'noun', 'Events & bookings', 'B1', 'Coming back to the same place again and again.', 'We thank our guests for their loyalty with a free drink.'),
  w('crowded', '/ˈkraʊdɪd/', 'adjective', 'Events & bookings', 'B1', 'Full of people.', 'The bar is crowded because of the match.', { opposite: 'quiet' }),
  w('quiet', '/ˈkwaɪət/', 'adjective', 'Events & bookings', 'A1', 'With little noise or few people.', 'It is a quiet night tonight.', { opposite: 'crowded' }),
  w('tourist', '/ˈtʊərɪst/', 'noun', 'Events & bookings', 'A2', 'A person who visits a place on holiday.', 'Many tourists come to the bar in summer.', { forms: ['tourists'] }),
  w('inspection', '/ɪnˈspekʃn/', 'noun', 'Rules & law', 'B1', 'An official visit to check that the rules are followed.', 'The inspection is next week.', { forms: ['inspections'] }),

  // ---- Guest talk about food and drink ----
  w('refill', '/ˈriːfɪl/', 'noun', 'At the bar', 'B1', 'Another glass of the same drink.', 'Would you like a refill?', { forms: ['refills'] }),
  w('another round', '/əˈnʌðə raʊnd/', 'phrase', 'At the bar', 'A2', 'The same drinks again for everyone at the table.', 'Another round for the table, please.', { related: ['refill'] }),
  w('the same again', '/ðə seɪm əˈɡeɪn/', 'phrase', 'At the bar', 'A2', 'A guest’s way to order the same drink once more.', 'The same again, please.')
];
