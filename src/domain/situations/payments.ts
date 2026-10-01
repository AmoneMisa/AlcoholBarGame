import { behaves, misbehaves, out, pick, whenAccepted } from './helpers';
import type { Choice, SituationDef } from './types';

// Payment trouble. The bill is held until the situation ends: whatever is paid reaches the cash register, what is
// owed goes on the tab, and what is refused is lost. Which payment methods work depends on the city's bars.

const PAID = { paid: 1 as const, result: 'solved' as const };
const FOREIGN_RATE = { USD: 1, EUR: 1.08 } as const;

// What to say when the first idea did not work: another way to pay, a promise, or giving up.
const fallback = (guest: string, extra: Choice[] = []) => ({
  guest,
  choices: [
    pick('fallback-card', 'Would you like to pay by card?', 'good', [
      out('Yes, I have a card. Here you are. Thank you!', { ...PAID, xp: 3, rapport: 4 }, { weight: .7 }),
      out('I am sorry, my card is at home.', { rapport: -2 }, { weight: .3, next: 1 })
    ]),
    pick('fallback-cash', 'Do you have some cash with you?', 'ok', [
      out('Yes, I have just enough. Here you are.', { ...PAID, xp: 3 }, { weight: .55 }),
      out('No, I have no cash at all today.', {}, { weight: .45, next: 1 })
    ]),
    pick('fallback-tomorrow', 'Please come back tomorrow and pay. Can you leave your phone number?', 'ok', [
      out('Yes, of course. Here is my number. I will be back tomorrow, I promise.', { owes: 1, rapport: 6, xp: 4, leave: true, result: 'neutral', note: 'The bill went on the tab.' }, { weight: behaves(.8) }),
      out('Sure… (the guest hurries out and does not leave a number).', { owes: 1, rapport: -4, leave: true, result: 'failed', note: 'The guest left without paying.' }, { weight: misbehaves(.2) })
    ]),
    pick('fallback-free', 'Do not worry. This one is on the house.', 'ok', [
      out('Really? Thank you so much! I will remember this.', { paid: 0, popularity: 1, rapport: 15, xp: 3, leave: true, result: 'neutral', note: 'You gave the drink away.' })
    ]),
    pick('fallback-police', 'If you do not pay, I will call the police.', 'bad', [
      out('OK, OK! Calm down. I will find the money.', { paid: .7, rapport: -12, emotion: 'angry', leave: true, result: 'neutral' }, { weight: .45 }),
      out('Call them! I do not care!', { rapport: -20, emotion: 'angry', spawn: 'threat-verbal' }, { weight: .55 })
    ], { tip: 'Threatening a guest makes things worse. Stay calm and offer a solution first.' }),
    ...extra
  ]
});

export const PAYMENT_SITUATIONS: SituationDef[] = [
  {
    id: 'pay-short', category: 'payment', title: 'Not enough money', icon: '👛', severity: 1, weight: 5, triggers: ['payment'], holdsPayment: true, timeoutMin: 8,
    vocab: ['bill', 'afford', 'owe', 'tab', 'pay later', 'on the house'],
    setup: ({ amount, random }) => ({ have: Math.max(1, Math.round(amount * (.3 + random() * .45) * 100) / 100) }),
    stages: [
      {
        guest: 'Oh no… the bill is {amount}, but I only have {have} with me. I am so sorry.',
        choices: [
          pick('card', 'No problem. Would you like to pay by card?', 'good', [
            out('Yes! I have my card. Thank you!', { ...PAID, xp: 4, rapport: 6 }, { weight: .6 }),
            out('My card is at home, I am afraid.', { rapport: -2 }, { weight: .4, next: 1 })
          ]),
          pick('partial', 'I can take {have} now. You can pay the rest next time.', 'ok', [
            out('You are very kind. I promise I will come back and pay the rest.', { paid: 'have', owes: 'rest', rapport: 8, xp: 5, leave: true, result: 'solved', note: 'Part of the bill went on the tab.' }, { weight: behaves(.8) }),
            out('OK. Thanks. (The guest leaves quickly.)', { paid: 'have', owes: 'rest', rapport: -2, leave: true, result: 'neutral', note: 'Part of the bill went on the tab.' }, { weight: misbehaves(.2) })
          ], { match: /\b(pay|rest|remaining)\b.*\b(next time|tomorrow|later)\b/i }),
          pick('friend', 'Could a friend bring the money? I can wait.', 'ok', [
            out('Good idea! I will text my friend. They live around the corner.', { ...PAID, xp: 4, rapport: 3 }, { weight: .5 }),
            out('My friend is not answering…', {}, { weight: .5, next: 1 })
          ]),
          pick('dishes', 'You can wash some glasses to pay for the rest.', 'ok', [
            out('Ha! Deal. I used to work in a kitchen.', { paid: 'have', rapport: 10, popularity: 1, xp: 6, result: 'solved', leave: true, note: 'The guest worked off the bill.' }, { weight: .5 }),
            out('Wash glasses? No way!', { rapport: -4 }, { weight: .5, next: 1 })
          ]),
          pick('pledge', 'Please leave your phone here until you pay.', 'bad', [
            out('Fine… but I do not like this.', { paid: 'have', owes: 'rest', rapport: -10, popularity: -1, leave: true, result: 'neutral', note: 'Keeping a guest’s phone can cause trouble.' }, { weight: .5 }),
            out('That is not legal! You can not keep my phone!', { rapport: -15, emotion: 'angry' }, { weight: .5, next: 1 })
          ], { tip: 'You are not allowed to keep a guest’s things. Ask for a name and a phone number instead.' }),
          pick('free', 'Do not worry. This one is on the house.', 'ok', [
            out('Really? Thank you so much! I will remember this.', { paid: 0, popularity: 1, rapport: 15, xp: 3, leave: true, result: 'neutral', note: 'You gave the drink away.' })
          ]),
          pick('police', 'Pay now, or I will call the police.', 'bad', [
            out('Please, no police! I will pay by card.', { ...PAID, rapport: -10, emotion: 'angry', leave: true }, { weight: .4 }),
            out('Call them! I did nothing wrong!', { rapport: -20, emotion: 'angry', spawn: 'threat-verbal' }, { weight: .6 })
          ], { tip: 'Do not threaten a guest first. Offer a way to pay.' })
        ]
      },
      fallback('I really do not have more money. What can I do?')
    ],
    ignored: out('The guest slips out without paying.', { rapport: -10, leave: true, result: 'failed', note: 'A guest left without paying.' })
  },
  {
    id: 'pay-declined', category: 'payment', title: 'Card declined', icon: '💳', severity: 1, weight: 4, triggers: ['payment'], holdsPayment: true, timeoutMin: 8,
    vocab: ['card', 'declined', 'terminal', 'contactless', 'PIN', 'limit'],
    stages: [
      {
        guest: 'Oh dear. The machine says my card was declined. That is strange. I have money in the account!',
        choices: [
          pick('retry', 'Let us try again, please.', 'good', [
            out('It worked this time! Thank you for your patience.', { ...PAID, xp: 4, rapport: 5 }, { weight: .45 }),
            out('Declined again… Maybe it is the limit.', {}, { weight: .55, next: 1 })
          ]),
          pick('other', 'Do you have another card?', 'good', [
            out('Yes, I have a second card. Try this one.', { ...PAID, xp: 4, rapport: 4 }, { weight: .5 }),
            out('No, that is my only card.', {}, { weight: .5, next: 1 })
          ]),
          pick('cash', 'Would you like to pay in cash?', 'ok', [
            out('Yes, I have some cash. Here you are.', { ...PAID, xp: 3 }, { weight: behaves(.55) }),
            out('I do not have enough cash.', {}, { weight: misbehaves(.45), next: 1 })
          ]),
          pick('qr', 'You can pay by QR code with your banking app.', 'ok', [
            out('Great idea! The code works. Thank you!', { ...PAID, xp: 4, rapport: 5 }, { weight: whenAccepted('qr', .8) }),
            out('A QR code? You do not take that here? Hmm.', { rapport: -3 }, { weight: whenAccepted('qr', 0, 1), next: 1 }),
            out('My banking app does not work either…', {}, { weight: whenAccepted('qr', .2), next: 1 })
          ], { tip: 'Only offer a payment method that your bar really accepts.' }),
          pick('rude', 'Then you can not pay. Give me your phone.', 'rude', [
            out('What? You can not take my phone!', { rapport: -20, emotion: 'angry', spawn: 'threat-verbal' })
          ])
        ]
      },
      fallback('I can not pay right now. What can I do?')
    ],
    ignored: out('The guest leaves in a hurry.', { rapport: -10, leave: true, result: 'failed', note: 'A guest left without paying.' })
  },
  {
    id: 'pay-qr', category: 'payment', title: 'Paying by QR code', icon: '📱', severity: 1, weight: 4, triggers: ['payment'], holdsPayment: true, timeoutMin: 8,
    vocab: ['QR code', 'scan', 'banking app', 'phone', 'transfer'],
    stages: [
      {
        guest: 'Can I pay by QR code? I do not have any cash today.',
        choices: [
          pick('yes', 'Of course. Please scan the code on the counter.', 'good', [
            out('Done! The payment went through. Thank you!', { ...PAID, xp: 4, rapport: 6 }, { weight: whenAccepted('qr', 1, 0) }),
            out('It does not work… are you sure you accept QR codes?', { rapport: -5 }, { weight: whenAccepted('qr', 0, 1), next: 1 })
          ]),
          pick('no', 'I am sorry, we do not accept QR codes. Would you like to pay by card?', 'good', [
            out('OK, I understand. I have a card. Here you are.', { ...PAID, xp: 3, rapport: 2 }, { weight: whenAccepted('qr', 0, 1) }),
            out('What? Other bars take QR codes! That is old-fashioned.', { rapport: -8 }, { weight: whenAccepted('qr', 1, 0), next: 1 })
          ]),
          pick('app', 'Which banking app do you use?', 'ok', [
            out('I use the one on my phone. It is very common here.', { rapport: 1 }, { next: 0 })
          ])
        ]
      },
      fallback('OK… then what can I do?')
    ],
    ignored: out('The guest gets tired of waiting and leaves.', { rapport: -10, leave: true, result: 'failed', note: 'A guest left without paying.' })
  },
  {
    id: 'pay-iban', category: 'payment', title: 'Bank transfer (IBAN)', icon: '🏦', severity: 1, weight: 2, triggers: ['payment'], holdsPayment: true, timeoutMin: 10,
    vocab: ['bank transfer', 'IBAN', 'account', 'reference', 'pending'],
    applies: (context) => context.accepts('iban') || context.random() < .35,
    stages: [
      {
        guest: 'Can I pay by bank transfer? I can send it right now from my phone.',
        choices: [
          pick('yes', 'Yes. Our IBAN is on the receipt. Please write your name in the payment note.', 'good', [
            out('Sent! Look, it says completed. Thank you.', { ...PAID, xp: 5, rapport: 5 }, { weight: whenAccepted('iban', .85, 0) }),
            out('It says pending. It can take until tomorrow.', { paid: 1, xp: 2, result: 'neutral' }, { weight: whenAccepted('iban', .15, 0) }),
            out('A transfer? You do not have an account number? I can not do this.', { rapport: -5 }, { weight: whenAccepted('iban', 0, 1), next: 1 })
          ]),
          pick('check', 'Please show me the transfer first.', 'good', [
            out('Of course. Here, it says completed.', { ...PAID, xp: 6, rapport: 3 }, { weight: .8 }),
            out('It is still pending… that is a problem.', {}, { weight: .2, next: 1 })
          ], { tip: 'Always check that a transfer is complete before the guest leaves.' }),
          pick('no', 'I am sorry, we only take cash and cards.', 'ok', [
            out('OK. I will pay by card, then.', { ...PAID, xp: 3 }, { weight: .75 }),
            out('That is not very modern. I have only a bit of cash.', { rapport: -5 }, { weight: .25, next: 1 })
          ])
        ]
      },
      fallback('OK, I will find another way. What do you suggest?')
    ],
    ignored: out('The guest says they will pay later and goes.', { owes: 1, rapport: -6, leave: true, result: 'neutral' })
  },
  {
    id: 'pay-uzcard', category: 'payment', title: 'UzCard and Humo', icon: '🇺🇿', severity: 1, weight: 2, triggers: ['payment'], holdsPayment: true, timeoutMin: 8,
    vocab: ['UzCard', 'Humo', 'local card', 'terminal'],
    applies: (context) => context.region === 'tashkent' || context.random() < .25,
    stages: [
      {
        guest: 'Do you take UzCard? Or Humo? I do not have any other card.',
        choices: [
          pick('yes', 'Yes, we take UzCard and Humo. Please tap your card here.', 'good', [
            out('Perfect! The payment is done. Thank you!', { ...PAID, xp: 5, rapport: 6 }, { weight: whenAccepted('uzcard', 1, 0) }),
            out('It does not work. Are you sure you take UzCard?', { rapport: -6 }, { weight: whenAccepted('uzcard', 0, 1), next: 1 })
          ]),
          pick('no', 'I am sorry, we do not take local cards. Do you have Visa or Mastercard?', 'good', [
            out('I understand. I have a Visa card too. Here you are.', { ...PAID, xp: 4, rapport: 2 }, { weight: whenAccepted('uzcard', 0, .8) }),
            out('What? Every shop takes UzCard at home!', { rapport: -8 }, { weight: whenAccepted('uzcard', 1, .2), next: 1 })
          ]),
          pick('which', 'Which card do you have?', 'ok', [
            out('I have a Humo card. It is a local bank card.', { rapport: 1 }, { next: 0 })
          ])
        ]
      },
      fallback('Hmm. What else can I do to pay?')
    ],
    ignored: out('The guest leaves, saying they will come back with cash.', { owes: 1, rapport: -6, leave: true, result: 'neutral' })
  },
  {
    id: 'pay-intl', category: 'payment', title: 'A foreign card', icon: '🌍', severity: 1, weight: 3, triggers: ['payment'], holdsPayment: true, timeoutMin: 8,
    vocab: ['Visa', 'Mastercard', 'contactless', 'tap', 'insert', 'chip and PIN', 'foreign card'],
    setup: ({ random }) => ({ _cardKind: random() < .6 ? 'visa' : random() < .5 ? 'amex' : 'union' }),
    stages: [
      {
        guest: 'I am a tourist. I only have a foreign card. Is that OK? It is contactless.',
        choices: [
          pick('yes', 'Yes, we take it. Please tap your card here.', 'good', [
            out('It worked! Thank you so much.', { ...PAID, xp: 5, rapport: 6 }, { weight: (c) => (c.accepts(c.data._cardKind as 'visa') ? 1 : 0) }),
            out('The terminal says "card not supported". Oh no.', { rapport: -5 }, { weight: (c) => (c.accepts(c.data._cardKind as 'visa') ? 0 : 1), next: 1 })
          ]),
          pick('no', 'Sorry, we do not take that card. Do you have another one, or cash?', 'good', [
            out('I have a Visa card as well. Here you are.', { ...PAID, xp: 4, rapport: 2 }, { weight: (c) => (c.accepts(c.data._cardKind as 'visa') ? 0 : .7) }),
            out('What? It is a normal card! Every bar takes it!', { rapport: -8 }, { weight: (c) => (c.accepts(c.data._cardKind as 'visa') ? 1 : .3), next: 1 })
          ]),
          pick('pin', 'Please insert your card and enter your PIN.', 'ok', [
            out('OK. The chip works. Payment accepted!', { ...PAID, xp: 3 }, { weight: (c) => (c.accepts(c.data._cardKind as 'visa') ? .9 : 0) }),
            out('It says the card is not supported.', { rapport: -4 }, { weight: (c) => (c.accepts(c.data._cardKind as 'visa') ? .1 : 1), next: 1 })
          ])
        ]
      },
      fallback('Oh. What else can I do? I am new in this city.')
    ],
    ignored: out('The guest gives up and leaves with an apology.', { rapport: -8, leave: true, result: 'failed', note: 'A guest left without paying.' })
  },
  {
    id: 'pay-foreign', category: 'payment', title: 'Paying in dollars or euros', icon: '💵', severity: 1, weight: 3, triggers: ['payment'], holdsPayment: true, timeoutMin: 10,
    vocab: ['dollar', 'euro', 'exchange rate', 'currency', 'local money', 'change'],
    setup: ({ amount, random }) => {
      const cur = random() < .55 ? 'USD' : 'EUR';
      return { cur, rate: FOREIGN_RATE[cur], foreign: Math.ceil(amount / FOREIGN_RATE[cur]) };
    },
    stages: [
      {
        guest: 'I only have {foreign} {cur} in cash. Is that OK? I just arrived and had no time to change money.',
        choices: [
          pick('yes', 'Yes, we can take foreign cash. I will use today’s exchange rate.', 'good', [
            out('Great, thank you! I will take my change in local money.', { ...PAID, xp: 5, rapport: 5 }, { weight: (c) => (c.accepts((c.data.cur as string).toLowerCase() as 'usd') ? .75 : 0) }),
            out('Hmm, I hoped for a better rate. But fine.', { paid: .94, xp: 3, rapport: -3, result: 'solved' }, { weight: (c) => (c.accepts((c.data.cur as string).toLowerCase() as 'usd') ? .25 : 0) }),
            out('You take it? But the sign says local money only…', { rapport: -4 }, { weight: (c) => (c.accepts((c.data.cur as string).toLowerCase() as 'usd') ? 0 : 1), next: 1 })
          ]),
          pick('no', 'Sorry, we only take local money. Would you like to pay by card?', 'good', [
            out('OK. I have a card. Here you are.', { ...PAID, xp: 4, rapport: 2 }, { weight: (c) => (c.accepts((c.data.cur as string).toLowerCase() as 'usd') ? .4 : .8) }),
            out('A card? I only have cash. Is there a cash machine near here?', {}, { weight: (c) => (c.accepts((c.data.cur as string).toLowerCase() as 'usd') ? .6 : .2), next: 1 })
          ]),
          pick('rate', 'The exchange rate today is one to one for dollars. Is that OK?', 'ok', [
            out('Fair enough. Here you are.', { ...PAID, xp: 3 }, { weight: .7 }),
            out('That is a bad rate! The bank gives me more.', { rapport: -6 }, { weight: .3, next: 1 })
          ])
        ]
      },
      fallback('Hmm. I do not know this city. What do you suggest?', [
        pick('atm', 'There is a cash machine around the corner. I can keep your seat.', 'good', [
          out('Thank you! I will be back in five minutes.', { ...PAID, xp: 5, rapport: 8 }, { weight: behaves(.85) }),
          out('OK… (the guest goes out and does not come back).', { owes: 1, leave: true, rapport: -6, result: 'failed', note: 'A guest left without paying.' }, { weight: misbehaves(.15) })
        ])
      ])
    ],
    ignored: out('The guest leaves their foreign money on the counter and goes.', { paid: .8, rapport: -4, leave: true, result: 'neutral' })
  },
  {
    id: 'pay-fake-note', category: 'payment', title: 'A suspicious banknote', icon: '💶', severity: 2, weight: 2, triggers: ['payment'], holdsPayment: true, timeoutMin: 8,
    vocab: ['banknote', 'fake', 'counterfeit', 'real', 'check', 'police'],
    setup: ({ random }) => ({ _fake: random() < .5 }),
    stages: [
      {
        guest: 'Here you are. Keep the change!',
        choices: [
          pick('check', 'One moment, please. I need to check this note.', 'good', [
            out('Of course. Take your time.', { ...PAID, xp: 5, rapport: 2 }, { weight: (c) => (c.data._fake ? 0 : 1) }),
            out('Is there a problem with the note?', { xp: 3 }, { weight: (c) => (c.data._fake ? 1 : 0), next: 1 })
          ], { tip: 'Check large banknotes: feel the paper, look at the watermark and hold it to the light.' }),
          pick('accept', 'Thank you very much!', 'bad', [
            out('You are welcome. Have a nice evening!', { ...PAID, rapport: 3, leave: true }, { weight: (c) => (c.data._fake ? 0 : 1) }),
            out('Bye! (The note was fake. You lost the money.)', { paid: 0, money: -6, popularity: 0, xp: 0, leave: true, result: 'failed', note: 'The banknote was fake. You lost the money.' }, { weight: (c) => (c.data._fake ? 1 : 0) })
          ], { tip: 'A quick check can save you a lot of money.' }),
          pick('police', 'This note is fake. I am calling the police.', 'bad', [
            out('What? It is real! I got it from the bank!', { rapport: -15, emotion: 'angry' }, { weight: (c) => (c.data._fake ? .3 : 1), next: 1 }),
            out('Please do not call the police! I did not know it was fake!', { rapport: -8 }, { weight: (c) => (c.data._fake ? .7 : 0), next: 1 })
          ], { tip: 'Do not accuse before you check. The guest may not know the note is fake.' })
        ]
      },
      {
        guest: 'I got this note from a cash machine, I swear! I did not know.',
        choices: [
          pick('another', 'Please pay with another note or with a card.', 'good', [
            out('Of course. I have a card. Sorry about that.', { ...PAID, xp: 5, rapport: 3 }, { weight: .8 }),
            out('I have nothing else… what can I do?', {}, { weight: .2, next: 1 })
          ]),
          pick('keep', 'I am sorry, I must keep the note and call the police.', 'ok', [
            out('I understand. Please explain to them that I did not know.', { paid: 0, popularity: 1, xp: 6, rapport: -4, leave: true, result: 'solved', note: 'You reported the fake note.' })
          ]),
          pick('forget', 'It is OK. Just take it and go.', 'bad', [
            out('Thank you! I will go now.', { paid: 0, money: -4, leave: true, result: 'failed', note: 'You gave the fake note back and lost the bill.' })
          ])
        ]
      }
    ],
    ignored: out('The guest leaves quickly.', { paid: 0, rapport: -6, leave: true, result: 'failed' })
  },
  {
    id: 'pay-change', category: 'payment', title: 'The wrong change', icon: '🧾', severity: 1, weight: 3, triggers: ['payment'], holdsPayment: true, timeoutMin: 8,
    vocab: ['change', 'cash register', 'count', 'mistake', 'receipt'],
    setup: ({ random }) => ({ _guestRight: random() < .5 }),
    stages: [
      {
        guest: 'Excuse me, I gave you a fifty, but you gave me change for a twenty!',
        choices: [
          pick('count', 'Let me count the cash register, please.', 'good', [
            out('Thank you. I think you will find a fifty there.', { paid: 1, xp: 6, rapport: 4, result: 'solved' }, { weight: (c) => (c.data._guestRight ? 0 : 1) }),
            out('You are right, I am sorry. Here is the rest of your change.', { paid: 1, money: -3, xp: 5, rapport: 6, result: 'solved', note: 'You corrected the change.' }, { weight: (c) => (c.data._guestRight ? 1 : 0) })
          ], { tip: 'When there is a dispute about money, count the register in front of the guest.' }),
          pick('deny', 'No, you gave me a twenty.', 'bad', [
            out('I am sure it was a fifty! This is not fair!', { rapport: -14, emotion: 'angry' }, { weight: (c) => (c.data._guestRight ? 1 : .6), next: 1 }),
            out('Hmm… maybe I made a mistake. Sorry.', { paid: 1, xp: 2 }, { weight: (c) => (c.data._guestRight ? 0 : .4) })
          ]),
          pick('sorry', 'I am sorry for the confusion. Let me check, please.', 'good', [
            out('Thank you for being so polite.', { paid: 1, xp: 5, rapport: 6, result: 'solved' })
          ])
        ]
      },
      fallback('Then I do not know what to do. Please check again.')
    ],
    ignored: out('The guest shakes their head and leaves, angry.', { paid: .8, rapport: -12, emotion: 'angry', leave: true, result: 'failed' })
  },
  {
    id: 'pay-split', category: 'payment', title: 'Splitting the bill', icon: '🧮', severity: 1, weight: 4, triggers: ['payment'], holdsPayment: true, timeoutMin: 8,
    vocab: ['split', 'separate bills', 'share', 'each', 'equally'],
    stages: [
      {
        guest: 'We will split the bill, please. Some of us pay by card and some in cash.',
        choices: [
          pick('yes', 'Of course. How would you like to split it?', 'good', [
            out('Equally, please. Four people. Thank you for being so helpful!', { ...PAID, xp: 4, rapport: 6, popularity: 1 })
          ]),
          pick('equal', 'We can split it equally between all of you.', 'ok', [
            out('That is easy. Thank you!', { ...PAID, xp: 3, rapport: 3 })
          ]),
          pick('no', 'Sorry, I can only make one bill.', 'bad', [
            out('Seriously? Other bars do it. That is annoying.', { paid: .95, rapport: -8, xp: 1, result: 'neutral' })
          ], { tip: 'Splitting a bill is easy and guests love it.' })
        ]
      }
    ],
    ignored: out('The group pays quickly in one lump sum, a bit annoyed.', { paid: .95, rapport: -5, result: 'neutral' })
  }
];
