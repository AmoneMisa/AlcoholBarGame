import type { PartRole, PhraseGroup, PhraseLesson } from './phrases';

// More phrase lessons: checking age and documents, bookings and events, tabs and closing time, allergies and
// responsible service, documents and gift packing in the shop, and — as a buyer — delivery questions, receiving a
// package, standing (scheduled) orders, asking for discounts, and invoices.
//
// `lesson` builds the phrase from its parts, so the parts always spell the whole sentence exactly.

const p = (text: string, role: PartRole): [string, PartRole] => [text, role];
const lesson = (parts: [string, PartRole][], when: string, answers: string[], swap?: string): PhraseLesson => ({
  text: parts.map(([text]) => text).join(' '),
  parts: parts.map(([text, role]) => ({ text, role })),
  when, answers, ...(swap ? { swap } : {})
});

export const MORE_PHRASE_GROUPS: PhraseGroup[] = [
  // ---------------- Bartender ----------------
  {
    id: 'bar-age', context: 'bar', title: 'Checking age and ID', goal: 'Ask for proof of age politely and say no kindly when the document is not good enough.',
    lessons: [
      lesson([p('May', 'helper'), p('I', 'person'), p('see', 'verb'), p('your ID,', 'thing'), p('please?', 'extra')],
        'The polite way to ask for ID. “May I…?” sounds softer than “Show me…”.', ['Sure, here you are.', 'Of course.'], 'ID → passport / driving licence'),
      lesson([p('Could', 'helper'), p('you', 'person'), p('tell', 'verb'), p('me', 'person'), p('your date of birth,', 'thing'), p('please?', 'extra')],
        'Use this when you read the ID and want to be sure the guest knows their own date of birth.', ['It is the tenth of June, nineteen ninety-five.', 'Sure. I was born in two thousand.']),
      lesson([p('You', 'person'), p('must be', 'helper'), p('twenty-one or older', 'thing'), p('to drink alcohol here.', 'extra')],
        'Explain the rule. “Must” is for rules that come from the law, not from you.', ['I am older than that. Here is my ID.', 'Yes, I know.'], 'twenty-one → eighteen'),
      lesson([p('I am sorry,', 'extra'), p('your ID', 'person'), p('has expired.', 'verb')],
        'When the date on the document has passed. Start with “I am sorry” to stay friendly.', ['Oh, I have another one.', 'Sorry, I will bring a new one next time.']),
      lesson([p('Do', 'helper'), p('you', 'person'), p('have', 'verb'), p('another document,', 'thing'), p('like a passport?', 'extra')],
        'Offer a way to solve the problem before you say no.', ['Yes, here is my passport.', 'I have a driving licence.']),
      lesson([p('I am sorry,', 'extra'), p('I', 'person'), p('can’t serve', 'verb'), p('you without ID.', 'thing')],
        'A clear, kind “no”. Say the reason (“without ID”) so the guest understands.', ['OK, I understand. Maybe a soft drink instead.', 'No problem. I will go and get it.'])
    ]
  },
  {
    id: 'bar-events', context: 'bar', title: 'Bookings and private events', goal: 'Take a booking for a table or a party and explain the deposit.',
    lessons: [
      lesson([p('Would', 'helper'), p('you', 'person'), p('like', 'verb'), p('to book a table?', 'thing')],
        'Offer a booking when the bar is busy or the guest asks about a party.', ['Yes, please. A table for four.', 'Not today, thank you.'], 'a table → a private room'),
      lesson([p('How many people', 'question'), p('are', 'helper'), p('in', 'extra'), p('your group?', 'thing')],
        'You need the number of guests to choose the right table.', ['We are four.', 'There will be about ten of us.']),
      lesson([p('What time', 'question'), p('is', 'helper'), p('your reservation?', 'thing')],
        'Check a booking when guests arrive.', ['It is at eight o’clock.', 'It is for nine, under the name Ana.']),
      lesson([p('We', 'person'), p('need', 'verb'), p('a deposit', 'thing'), p('for a private party.', 'extra')],
        'Explain that a small payment first keeps the booking. “Deposit” is money paid in advance.', ['OK, how much is the deposit?', 'Can I pay by card?']),
      lesson([p('Happy hour', 'person'), p('starts', 'verb'), p('at six o’clock.', 'extra')],
        'Tell guests when drinks are cheaper. “Starts at” + a time.', ['Great, I will come back then!', 'Perfect, cocktails are half price.'], 'starts → ends'),
      lesson([p('We', 'person'), p('have', 'verb'), p('live music', 'thing'), p('every Friday.', 'extra')],
        'Invite guests to come back for an event. “Every Friday” shows a regular event.', ['That sounds like fun!', 'I will tell my friends.'], 'Friday → Saturday / weekend')
    ]
  },
  {
    id: 'bar-tab', context: 'bar', title: 'Tabs, bills and closing time', goal: 'Handle the bill, splitting and the end of the evening.',
    lessons: [
      lesson([p('Would', 'helper'), p('you', 'person'), p('like', 'verb'), p('to open a tab?', 'thing')],
        'A tab means the guest pays everything at the end of the evening.', ['Yes, please. Put it all on one tab.', 'No, I will pay now.']),
      lesson([p('Do', 'helper'), p('you', 'person'), p('want', 'verb'), p('to split the bill?', 'thing')],
        'When a group asks to pay. “Split the bill” means everyone pays an equal part.', ['Yes, please. Split it equally.', 'No, I will pay for everyone.']),
      lesson([p('Last call!', 'extra'), p('The bar', 'person'), p('closes', 'verb'), p('in fifteen minutes.', 'extra')],
        'Say it near closing time so guests can order one more drink.', ['One more drink, please!', 'Can I have the bill, please?'], 'fifteen → ten / thirty'),
      lesson([p('A service charge', 'person'), p('of ten percent', 'extra'), p('is included.', 'verb')],
        'Explain extra money on the bill. A service charge is a fee for the service.', ['OK, thank you for telling me.', 'Then I will not add a tip.'])
    ]
  },
  {
    id: 'bar-care', context: 'bar', title: 'Allergies and responsible service', goal: 'Look after the guest: ask about allergies, offer water and say no when someone has had enough.',
    lessons: [
      lesson([p('Do', 'helper'), p('you', 'person'), p('have', 'verb'), p('any food allergies?', 'thing')],
        'Ask before you make a drink with nuts, milk or egg.', ['No allergies, thank you.', 'I am allergic to nuts.']),
      lesson([p('Would', 'helper'), p('you', 'person'), p('like', 'verb'), p('a non-alcoholic cocktail instead?', 'thing')],
        'A friendly alternative for drivers, for guests who are not feeling well, or for anyone who wants a break.', ['Yes, why not? Something fresh, please.', 'No, thank you.']),
      lesson([p('Can', 'helper'), p('I', 'person'), p('get', 'verb'), p('you some water?', 'thing')],
        'Good service. Offer water between drinks, especially late in the evening.', ['Yes, please. That is a good idea.', 'No, I am fine.']),
      lesson([p('I think', 'extra'), p('you', 'person'), p('have had', 'verb'), p('enough tonight.', 'thing')],
        'Say it calmly and kindly when a guest is drunk. Do not argue — stay polite and firm.', ['You are right. Thank you.', 'OK, I will have some water.']),
      lesson([p('Shall', 'helper'), p('I', 'person'), p('call', 'verb'), p('you a taxi?', 'thing')],
        'Help guests get home safely. “Shall I…?” is a polite offer.', ['Yes, please. That is kind.', 'No, thank you. My friend is driving.'])
    ]
  },

  // ---------------- Seller / shop ----------------
  {
    id: 'shop-docs', context: 'shop', title: 'Documents and invoices', goal: 'Ask for the right papers and give business customers an invoice.',
    lessons: [
      lesson([p('Do', 'helper'), p('you', 'person'), p('have', 'verb'), p('a licence', 'thing'), p('to sell alcohol?', 'extra')],
        'A bar or a shop that buys in large amounts needs a licence. Ask politely before a big sale.', ['Yes, here is our licence.', 'Our manager has it. One moment.']),
      lesson([p('Would', 'helper'), p('you', 'person'), p('like', 'verb'), p('an invoice', 'thing'), p('for your company?', 'extra')],
        'An invoice is a paper for business customers. It shows what they bought and the price.', ['Yes, please. Our company is Blue Moon Bar.', 'No, a receipt is fine.']),
      lesson([p('Please', 'extra'), p('sign', 'verb'), p('here', 'thing'), p('to confirm your order.', 'extra')],
        'Ask the customer to write their name on the order paper.', ['Sure. Here you go.', 'Where exactly?']),
      lesson([p('We', 'person'), p('only accept', 'verb'), p('the original document,', 'thing'), p('not a copy.', 'extra')],
        'Say it when someone shows a photo or a copy of an ID. “Original” means the real document.', ['Oh, I understand. I will bring the original.', 'Sorry, I have only a copy.'])
    ]
  },
  {
    id: 'shop-package', context: 'shop', title: 'Gifts and packing', goal: 'Wrap gifts and pack fragile bottles safely.',
    lessons: [
      lesson([p('Shall', 'helper'), p('I', 'person'), p('wrap', 'verb'), p('it as a gift?', 'thing')],
        'Offer gift wrapping when the customer says the bottle is a present.', ['Yes, please. It is a present.', 'No, thank you. It is for me.']),
      lesson([p('I', 'person'), p('will put', 'verb'), p('it in a strong box', 'thing'), p('so it does not break.', 'extra')],
        'Explain how you pack a bottle for a trip. “So it does not break” gives the reason.', ['Thank you, that is very careful.', 'Great, I have a long trip.']),
      lesson([p('This bottle', 'person'), p('is', 'helper'), p('fragile,', 'thing'), p('so please carry it carefully.', 'extra')],
        '“Fragile” means easy to break. Use it for glass and for expensive bottles.', ['Of course, I will be careful.', 'Thank you for telling me.']),
      lesson([p('Would', 'helper'), p('you', 'person'), p('like', 'verb'), p('a gift card with a message?', 'thing')],
        'A small extra service that makes a gift special.', ['Yes, please. Write “Happy birthday”.', 'No, that is fine.'])
    ]
  },

  // ---------------- Buyer / suppliers ----------------
  {
    id: 'buyer-delivery', context: 'buyer', title: 'Delivery questions', goal: 'Ask when an order will come and what to do when it is late.',
    lessons: [
      lesson([p('When', 'question'), p('will', 'helper'), p('my order', 'person'), p('arrive?', 'verb')],
        'The first question about any delivery. “Will” talks about the future.', ['Delivery takes about three days.'], 'arrive → be here'),
      lesson([p('Could', 'helper'), p('you', 'person'), p('send', 'verb'), p('me', 'person'), p('the tracking number,', 'thing'), p('please?', 'extra')],
        'A tracking number shows where the package is right now.', ['I will send it to you today.']),
      lesson([p('The delivery', 'person'), p('is', 'helper'), p('two days late.', 'thing'), p('What happened?', 'question')],
        'Complain politely about a late order: say the facts first, then ask a question.', ['I am sorry about the delay. I will check.'], 'two days → one week'),
      lesson([p('Could', 'helper'), p('you', 'person'), p('deliver', 'verb'), p('it before noon,', 'thing'), p('please?', 'extra')],
        'Ask for a delivery time that works for the bar. “Before noon” means before twelve o’clock.', ['I will ask the driver.'], 'before noon → after lunch'),
      lesson([p('Please', 'extra'), p('leave', 'verb'), p('the boxes', 'thing'), p('at the back door.', 'extra')],
        'Give the driver clear directions for where to put the goods.', ['No problem. I will tell the driver.'])
    ]
  },
  {
    id: 'buyer-package', context: 'buyer', title: 'Receiving a package', goal: 'Check a delivery, sign for it and report problems.',
    lessons: [
      lesson([p('Where', 'question'), p('should', 'helper'), p('I', 'person'), p('sign?', 'verb')],
        'The driver brings a paper or a screen. Ask where to write your name.', ['Just here, please. Thank you!']),
      lesson([p('One box', 'person'), p('is', 'helper'), p('damaged.', 'thing'), p('Can I send you a photo?', 'question')],
        'Report a broken box. A photo helps the supplier to help you.', ['I am very sorry. Send me a photo and I will arrange a replacement.']),
      lesson([p('Two bottles', 'person'), p('are', 'helper'), p('missing', 'thing'), p('from the box.', 'extra')],
        'Say what is wrong in a simple sentence: who/what + are + problem.', ['I am very sorry. Send me a photo and I will arrange a replacement.'], 'missing → broken'),
      lesson([p('Could', 'helper'), p('you', 'person'), p('send', 'verb'), p('a replacement,', 'thing'), p('please?', 'extra')],
        'After a problem, say what you want: a new item (replacement) or money back (refund).', ['Of course. A replacement will arrive with the next delivery.']),
      lesson([p('Is', 'helper'), p('the invoice', 'person'), p('inside the package?', 'thing')],
        'Check the paper that shows what you ordered and what you must pay.', ['The invoice is in the package, and I can also email it to you.'])
    ]
  },
  {
    id: 'buyer-standing', context: 'buyer', title: 'Standing and scheduled orders', goal: 'Set up, change or stop an order that repeats on a schedule.',
    lessons: [
      lesson([p('Can', 'helper'), p('we', 'person'), p('set up', 'verb'), p('a standing order?', 'thing')],
        'A standing order repeats by itself — you do not need to order again each time.', ['A standing order is possible. We need two days notice for any change.']),
      lesson([p('We', 'person'), p('would like', 'verb'), p('the same order', 'thing'), p('every week.', 'extra')],
        'Say how often. This also shows the supplier that you are a regular customer.', ['Regular clients are important to us. I will remember that.'], 'every week → every month'),
      lesson([p('Please', 'extra'), p('deliver', 'verb'), p('every Monday', 'thing'), p('in the morning.', 'extra')],
        'Give the day and the time of day. “Every Monday” means each Monday.', ['That works. I will add it to the schedule.']),
      lesson([p('How much notice', 'question'), p('do', 'helper'), p('you', 'person'), p('need', 'verb'), p('to change the order?', 'extra')],
        '“Notice” is a warning you give before a change. Ask about it before you set up a schedule.', ['We need two days notice for any change.']),
      lesson([p('Can', 'helper'), p('we', 'person'), p('pause', 'verb'), p('the order for one month?', 'thing')],
        'Use “pause” for a break. The order starts again later, so you do not need to cancel it.', ['A standing order is possible. We need two days notice for any change.']),
      lesson([p('I', 'person'), p('would like', 'verb'), p('to cancel', 'verb'), p('my standing order.', 'thing')],
        'Stop the schedule completely. “Would like to” is polite.', ['A standing order is possible. We need two days notice for any change.'])
    ]
  },
  {
    id: 'buyer-discount', context: 'buyer', title: 'Asking for discounts', goal: 'Negotiate a better price politely and with a reason.',
    lessons: [
      lesson([p('Do', 'helper'), p('you', 'person'), p('offer', 'verb'), p('a discount', 'thing'), p('for regular customers?', 'extra')],
        'A polite question. A reason (“regular customers”) makes it stronger.', ['Regular clients are important to us. I will remember that.'], 'regular customers → big orders'),
      lesson([p('Could', 'helper'), p('you', 'person'), p('match', 'verb'), p('the price of another supplier?', 'thing')],
        'Mention a competitor honestly. “Match” means to make your price the same.', ['Really? Well, I don’t want to lose you.']),
      lesson([p('Is', 'helper'), p('there', 'person'), p('a discount', 'thing'), p('if I pay in advance?', 'extra')],
        'Paying early helps the supplier, so ask for a better price in return.', ['Payment today helps me. OK.']),
      lesson([p('Is', 'helper'), p('free delivery', 'person'), p('possible', 'thing'), p('for a large order?', 'extra')],
        'Delivery fees add up. Ask for free delivery when you buy a lot.', ['Fine, the delivery is on us.']),
      lesson([p('We', 'person'), p('are buying', 'verb'), p('in bulk.', 'thing'), p('Could you lower the price?', 'extra')],
        'Buying in bulk means buying a lot at once. Say it, then ask for a lower price.', ['A big order? That changes things.'])
    ]
  },
  {
    id: 'buyer-invoice', context: 'buyer', title: 'Invoices and payment terms', goal: 'Ask for the papers you need and agree when to pay.',
    lessons: [
      lesson([p('Could', 'helper'), p('you', 'person'), p('send', 'verb'), p('me', 'person'), p('an invoice', 'thing'), p('by email?', 'extra')],
        'Ask for the paper you need for your records.', ['The invoice is in the package, and I can also email it to you.']),
      lesson([p('What', 'question'), p('are', 'helper'), p('your', 'person'), p('payment terms?', 'thing')],
        '“Terms” are the rules of the deal: when and how you pay.', ['Our normal terms are payment on delivery. For regular clients, we can talk.']),
      lesson([p('Can', 'helper'), p('I', 'person'), p('pay', 'verb'), p('within thirty days?', 'thing')],
        'Ask for more time to pay. Say the number of days clearly.', ['Our normal terms are payment on delivery. For regular clients, we can talk.'], 'thirty → fourteen'),
      lesson([p('I', 'person'), p('need', 'verb'), p('a receipt', 'thing'), p('for my accountant.', 'extra')],
        'A receipt proves that you paid. Say who needs it and why.', ['The invoice is in the package, and I can also email it to you.']),
      lesson([p('The total', 'person'), p('on this invoice', 'extra'), p('is', 'helper'), p('wrong.', 'thing')],
        'Say clearly that there is a mistake. Then wait for the supplier to check.', ['Let me check the invoice and correct it.'])
    ]
  }
];
