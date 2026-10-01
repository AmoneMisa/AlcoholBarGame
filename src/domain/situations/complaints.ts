import { out, pick } from './helpers';
import type { SituationDef } from './types';

// A guest complains about a drink made from stock that was damaged or close to its date. It is started by the rules,
// never at random: it is the price of using bad goods. The right answer is honest, polite and generous.

export const COMPLAINT_SITUATIONS: SituationDef[] = [
  {
    id: 'complaint-quality', category: 'delivery', title: 'A complaint about the drink', icon: '😤', severity: 2, weight: 0, triggers: ['payment'], holdsPayment: true, timeoutMin: 8,
    vocab: ['complaint', 'refund', 'fresh', 'taste', 'replace', 'exchange', 'sorry'],
    setup: ({ data }) => ({ taste: data.reason === 'expiring' ? 'old, like it has gone off' : 'flat and strange' }),
    stages: [
      {
        guest: 'Excuse me. This drink tastes {taste}. Is it fresh? I do not want to pay for this. I want my money back!',
        choices: [
          pick('remake', 'I am very sorry. Let me make you a fresh drink, on the house.', 'good', [
            out('Thank you. That is very kind of you.', { paid: 0, rapport: 12, popularity: 1, xp: 6, remake: true, result: 'solved', note: 'You made a fresh drink for the guest.' })
          ], { tip: 'Apologise, do not argue, and fix the problem. A free new drink keeps a guest.' }),
          pick('refund', 'I am sorry. Would you like your money back?', 'good', [
            out('Yes, please. I do not want to pay for this one.', { paid: 0, rapport: 4, xp: 4, leave: true, result: 'solved' })
          ]),
          pick('what', 'Can you tell me what is wrong with it?', 'good', [
            out('It smells old, and the taste is not right. It is not cold enough either.', { xp: 3 }, { next: 1 })
          ]),
          pick('taste', 'May I taste it, please?', 'ok', [
            out('Of course. Please do.', { xp: 2 }, { next: 2 })
          ]),
          pick('discount', 'I can give you a discount on this drink.', 'ok', [
            out('Half price? Hmm… OK. But please be more careful.', { paid: .5, rapport: 2, xp: 3, leave: true, result: 'neutral' }, { weight: .6 }),
            out('A discount? I want all my money back!', { rapport: -4 }, { weight: .4, next: 3 })
          ]),
          pick('defend', 'Our drinks are always fresh. You must be mistaken.', 'bad', [
            out('How dare you! I want my money back, right now!', { rapport: -15, emotion: 'angry' }, { weight: .6, next: 3 }),
            out('Hmm. OK. Maybe I am wrong.', { paid: 1, rapport: -4, result: 'neutral' }, { weight: .4 })
          ], { tip: 'Never tell a guest they are wrong about taste. Listen first.' })
        ]
      },
      {
        guest: 'It is just not right. Can you fix it?',
        choices: [
          pick('remake', 'I am very sorry. I will make you a fresh one, on the house.', 'good', [
            out('Thank you. I appreciate that.', { paid: 0, rapport: 10, popularity: 1, xp: 6, remake: true, result: 'solved' })
          ]),
          pick('refund', 'I am sorry. I will take it off your bill.', 'good', [
            out('Thank you. That is fair.', { paid: 0, rapport: 4, xp: 4, leave: true, result: 'solved' })
          ])
        ]
      },
      {
        guest: 'Well? Do you taste it too?',
        choices: [
          pick('admit', 'You are right. I am sorry. Let me make you a new one.', 'good', [
            out('Thank you for being honest. That is rare.', { paid: 0, rapport: 14, popularity: 1, xp: 8, remake: true, result: 'solved', note: 'Honesty won the guest’s trust.' })
          ]),
          pick('deny', 'It tastes fine to me.', 'bad', [
            out('Fine?! Then you drink it! I am not paying for this!', { rapport: -18, emotion: 'angry' }, { weight: .7, next: 3 }),
            out('OK. Maybe it is just me.', { paid: 1, rapport: -6, result: 'neutral' }, { weight: .3 })
          ])
        ]
      },
      {
        guest: 'I want a refund, or I will tell everybody in this city about this bar!',
        choices: [
          pick('refund-now', 'You are right. I will refund the drink now, and I am sorry.', 'good', [
            out('Thank you. I will give you another chance.', { paid: 0, rapport: 8, xp: 5, leave: true, result: 'solved' })
          ]),
          pick('remake', 'Please let me make you a new drink, on the house. I want you to leave happy.', 'good', [
            out('Hmm… OK. That is a good offer.', { paid: 0, rapport: 8, xp: 6, remake: true, result: 'solved' }, { weight: .7 }),
            out('No. I want my money. Now.', { rapport: -4 }, { weight: .3, next: 3 })
          ]),
          pick('refuse', 'I am sorry, but we can not give refunds.', 'rude', [
            out('Then I will go to the police and to the newspaper!', { rapport: -20, popularity: -3, emotion: 'angry', leave: true, result: 'failed', note: 'The guest left angry and told others.' })
          ])
        ]
      }
    ],
    ignored: out('The guest puts the glass down and leaves without paying.', { paid: 0, rapport: -10, popularity: -1, leave: true, result: 'failed' })
  }
];
