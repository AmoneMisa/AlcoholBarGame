import type { DailyLesson } from './dailyLessons';

// More daily English quests: age and documents, deliveries and packages, standing orders, discounts,
// invoices, bookings, tabs and responsible service. Each is a three-choice question with a short explanation.

const q = (
  id: string, kind: DailyLesson['kind'], prompt: string, choices: [string, string, string], answer: string,
  explanation: string, xp: number, crystals: number
): DailyLesson => ({ id, kind, prompt, choices: [...choices], answer, explanation, xp, crystals });

export const MORE_DAILY_LESSONS: DailyLesson[] = [
  // ---- Age and documents ----
  q('age-polite', 'Phrase', 'How do you politely ask for proof of age?', ['May I see your ID, please?', 'Show ID now.', 'You old enough?'], 'May I see your ID, please?',
    '“May I see…?” is the polite way to ask. Add “please” to sound friendly.', 15, 2),
  q('age-expired', 'Word', 'The date on a passport has passed. The passport is…', ['expired', 'valid', 'original'], 'expired',
    'An expired document is no longer valid because its date has passed.', 12, 2),
  q('age-legal', 'Phrase', 'Which sentence explains the age rule?', ['You must be twenty-one or older to drink alcohol here.', 'You must to be twenty-one drink here.', 'You are must twenty-one older.'], 'You must be twenty-one or older to drink alcohol here.',
    '“Must be” + age is the correct pattern for a rule.', 18, 3),
  q('age-original', 'Word', 'What does “original” mean for a document?', ['The real one, not a copy', 'A very old one', 'A photo on a phone'], 'The real one, not a copy',
    'Many places only accept the original document.', 12, 2),
  q('age-underage', 'Word', 'A guest is too young by law to buy alcohol. The guest is…', ['underage', 'overage', 'adult'], 'underage',
    '“Underage” means too young to do something that the law only allows adults to do.', 12, 2),
  q('age-refuse', 'Phrase', 'Which sentence is a kind “no” when there is no ID?', ['I am sorry, I can’t serve you without ID.', 'No ID, no drink.', 'You cannot, go away.'], 'I am sorry, I can’t serve you without ID.',
    'Start with “I am sorry” and give the reason: “without ID”.', 15, 2),
  q('doc-sign', 'Phrase', 'The driver gives you a paper for the delivery. What do you ask?', ['Where should I sign?', 'Where I sign?', 'Where do I signing?'], 'Where should I sign?',
    '“Where should I sign?” is a polite question with the helper “should”.', 15, 2),

  // ---- Delivery and packages ----
  q('delivery-when', 'Grammar', 'Choose the correct question about the future.', ['When will my order arrive?', 'When my order will arrive?', 'When arrive will my order?'], 'When will my order arrive?',
    'In a question, the helper “will” comes before the subject: When will my order arrive?', 18, 3),
  q('delivery-tracking', 'Word', 'What is a tracking number for?', ['To see where a package is', 'To pay for the order', 'To open the box'], 'To see where a package is',
    'A courier gives you a tracking number so you can follow the package.', 12, 2),
  q('delivery-late', 'Phrase', 'The order is two days late. What is a polite complaint?', ['The delivery is two days late. What happened?', 'You are bad. Where order?', 'Late delivery, give money.'], 'The delivery is two days late. What happened?',
    'State the fact first, then ask a calm question.', 15, 2),
  q('package-damaged', 'Word', 'You open a box and a bottle is broken. The box is…', ['damaged', 'original', 'weekly'], 'damaged',
    '“Damaged” means broken or spoiled.', 12, 2),
  q('package-missing', 'Grammar', 'Choose the correct sentence.', ['Two bottles are missing from the box.', 'Two bottle is missing from box.', 'Two bottles is missing in the box.'], 'Two bottles are missing from the box.',
    'Two bottles is plural, so use “are”. We say “from the box”.', 18, 3),
  q('package-fragile', 'Word', 'Which word means “easy to break”?', ['fragile', 'heavy', 'free'], 'fragile',
    'Glass bottles are fragile. Write “fragile” on a box to ask for careful handling.', 12, 2),
  q('package-replace', 'Phrase', 'After a broken bottle, what do you ask for?', ['Could you send a replacement, please?', 'Send new one now.', 'Replacement is you send.'], 'Could you send a replacement, please?',
    '“Could you…, please?” is a polite request.', 15, 2),
  q('delivery-door', 'Phrase', 'You want the driver to leave the boxes behind the bar. You say…', ['Please leave the boxes at the back door.', 'Leave boxes you at door.', 'The boxes please leaves back.'], 'Please leave the boxes at the back door.',
    'Use “Please” + base verb for a polite instruction.', 15, 2),

  // ---- Standing and scheduled orders ----
  q('standing-meaning', 'Word', 'What is a standing order?', ['An order that repeats on a schedule', 'An order for a standing table', 'An order that is cancelled'], 'An order that repeats on a schedule',
    'You set it up once and the supplier repeats it automatically.', 12, 2),
  q('standing-every', 'Phrase', 'How do you ask for a weekly delivery?', ['Please deliver every Monday morning.', 'Please deliver each Monday mornings.', 'Please delivers every Mondays.'], 'Please deliver every Monday morning.',
    '“Every” + a singular day: every Monday.', 15, 2),
  q('standing-cancel', 'Phrase', 'You want to stop your schedule completely. You say…', ['I would like to cancel my standing order.', 'I would like cancel my order standing.', 'I like to cancelling the order.'], 'I would like to cancel my standing order.',
    '“Would like to” + base verb is polite.', 15, 2),
  q('standing-pause', 'Word', 'What does “pause the order” mean?', ['Stop it for a time and start again later', 'Stop it forever', 'Order double'], 'Stop it for a time and start again later',
    'Pause is a break. Cancel is the end.', 12, 2),
  q('standing-notice', 'Phrase', 'You want to know about change rules. You ask…', ['How much notice do you need to change the order?', 'How many notice you need change the order?', 'How much notices need you change?'], 'How much notice do you need to change the order?',
    '“Notice” is uncountable, so we say “how much notice”.', 18, 3),
  q('order-minimum', 'Word', 'The minimum order is five packs. This means…', ['You must order at least five packs', 'You can order only five packs', 'Five packs are free'], 'You must order at least five packs',
    '“Minimum” is the smallest amount that is allowed.', 12, 2),
  q('order-advance', 'Grammar', 'Choose the correct sentence.', ['Please order three days in advance.', 'Please order three days in advances.', 'Please order three day on advance.'], 'Please order three days in advance.',
    '“In advance” is a fixed phrase and has no -s.', 18, 3),

  // ---- Discounts and invoices ----
  q('discount-ask', 'Phrase', 'Which question asks for a discount politely?', ['Do you offer a discount for regular customers?', 'Give me cheap now.', 'You discount for me?'], 'Do you offer a discount for regular customers?',
    'A polite question with a reason sounds stronger than a demand.', 15, 2),
  q('discount-bulk', 'Word', 'What does “in bulk” mean?', ['In a large amount at once', 'In a very small box', 'In cash only'], 'In a large amount at once',
    'Buying in bulk often gets you a better price.', 12, 2),
  q('discount-match', 'Phrase', 'Another supplier is cheaper. What can you say?', ['Could you match the price of another supplier?', 'Other supplier is cheaper, so you give.', 'You match price other please.'], 'Could you match the price of another supplier?',
    '“Match” means to make your price the same.', 15, 2),
  q('discount-advance', 'Phrase', 'You can pay early. Which sentence uses it to ask for a better price?', ['Is there a discount if I pay in advance?', 'Is there a discount if I will pay in advance?', 'There is discount I pay advance?'], 'Is there a discount if I pay in advance?',
    'After “if” we use the present simple, not “will”.', 18, 3),
  q('invoice-meaning', 'Word', 'What is an invoice?', ['A paper that asks for payment', 'A free sample', 'A kind of bottle'], 'A paper that asks for payment',
    'An invoice shows what you bought and how much you must pay.', 12, 2),
  q('invoice-terms', 'Phrase', 'You want to know when to pay. You ask…', ['What are your payment terms?', 'What is your terms of pay?', 'When terms you pay?'], 'What are your payment terms?',
    '“Terms” is plural, so use “are”.', 15, 2),
  q('invoice-wrong', 'Phrase', 'The total on the invoice is not correct. You say…', ['The total on this invoice is wrong.', 'The total on this invoice are wrong.', 'This invoice total wrong is.'], 'The total on this invoice is wrong.',
    '“The total” is singular, so use “is”.', 18, 3),

  // ---- Events, tabs and responsible service ----
  q('event-book', 'Phrase', 'How do you offer a booking?', ['Would you like to book a table?', 'You want booking table?', 'Do you like book a table?'], 'Would you like to book a table?',
    '“Would you like to” + base verb is a polite offer.', 15, 2),
  q('event-deposit', 'Word', 'A deposit is…', ['money you pay first to keep a booking', 'a free drink', 'a kind of ice'], 'money you pay first to keep a booking',
    'The deposit is often taken off the final bill.', 12, 2),
  q('event-happy', 'Phrase', 'Which sentence tells guests about cheaper drinks?', ['Happy hour starts at six o’clock.', 'Happy hour start in six hour.', 'Happy hour is starting on six.'], 'Happy hour starts at six o’clock.',
    '“Happy hour” is singular, so the verb is “starts”. Use “at” with a time.', 18, 3),
  q('tab-meaning', 'Word', 'What does “open a tab” mean?', ['Pay everything at the end of the evening', 'Open a bottle', 'Pay in advance'], 'Pay everything at the end of the evening',
    'The bar writes your drinks on a tab, and you pay once.', 12, 2),
  q('bill-split', 'Phrase', 'A group wants to share the cost. You ask…', ['Do you want to split the bill?', 'You want split of bill?', 'Do you want splitting bill?'], 'Do you want to split the bill?',
    '“Split the bill” means everyone pays an equal part.', 15, 2),
  q('care-allergy', 'Phrase', 'Before a drink with nuts, you ask…', ['Do you have any food allergies?', 'You have allergy of food?', 'Are you allergy to food?'], 'Do you have any food allergies?',
    'Use “have” with “allergies”: Do you have any allergies?', 15, 2),
  q('care-enough', 'Phrase', 'A guest is drunk. Which sentence is calm and kind?', ['I think you have had enough tonight.', 'You are drunk, stop now.', 'No more, go home.'], 'I think you have had enough tonight.',
    '“I think…” softens the message. Stay polite and firm.', 18, 3),
  q('care-taxi', 'Phrase', 'You want to help a guest get home safely. You say…', ['Shall I call you a taxi?', 'Shall I calling taxi?', 'I shall to call a taxi you?'], 'Shall I call you a taxi?',
    '“Shall I…?” is a polite offer. Use the base verb after it.', 15, 2),
  q('care-nonalc', 'Word', 'Which word means “without alcohol”?', ['non-alcoholic', 'alcoholic', 'underage'], 'non-alcoholic',
    'Offer a non-alcoholic cocktail to drivers.', 12, 2)
];
