import { behaves, misbehaves, out, pick } from './helpers';
import type { SituationDef } from './types';

// Things that get broken: a glass, a bottle, a stool, a jacket. The bartender decides who pays, stays kind, and keeps
// everybody safe from the broken pieces.

export const BREAKAGE_SITUATIONS: SituationDef[] = [
  {
    id: 'break-glass', category: 'breakage', title: 'A broken glass', icon: '🥃', severity: 1, weight: 5, triggers: ['enjoying'], timeoutMin: 8,
    vocab: ['glass', 'break', 'broke', 'broken', 'pieces', 'sweep', 'cost', 'accident'],
    stages: [
      {
        guest: 'Oh no! I dropped my glass and it broke into pieces. I am so sorry!',
        choices: [
          pick('calm', 'Do not worry. Please do not touch the glass. I will clean it up.', 'good', [
            out('Thank you. You are so kind.', { breakage: 4, rapport: 8, xp: 5, result: 'solved' })
          ], { tip: 'Safety first: ask the guest not to touch broken glass.' }),
          pick('pay', 'Accidents happen, but the glass costs five dollars. Could you pay for it, please?', 'ok', [
            out('Of course. Here you are. Sorry again.', { money: 5, rapport: -2, xp: 4, result: 'solved' }, { weight: behaves(.8) }),
            out('Five dollars for a glass?! That is too much!', { rapport: -8 }, { weight: misbehaves(.2), next: 1 })
          ]),
          pick('free', 'It is OK. It is just a glass. Are you hurt?', 'good', [
            out('No, I am fine. Thank you for being so nice.', { breakage: 4, rapport: 12, popularity: 1, xp: 4, result: 'solved' }, { weight: .85 }),
            out('Ouch… I think I cut my finger a little.', { breakage: 4, rapport: 6, spawn: 'med-cut' }, { weight: .15 })
          ]),
          pick('yourself', 'It is nothing. Just clean it up yourself.', 'bad', [
            out('Me? OK… ouch! I cut my hand!', { breakage: 4, rapport: -6, spawn: 'med-cut' }, { weight: .5 }),
            out('Clean it myself? What kind of bar is this?', { breakage: 4, rapport: -12 }, { weight: .5 })
          ], { tip: 'Never ask a guest to pick up broken glass.' }),
          pick('rude', 'You break it, you pay for it. Pay now!', 'rude', [
            out('Fine! Here is the money. What a rude bartender!', { money: 5, rapport: -14, emotion: 'angry' }, { weight: .5 }),
            out('No way! I am not paying for anything!', { breakage: 4, rapport: -18, emotion: 'angry', spawn: 'threat-verbal' }, { weight: .5 })
          ])
        ]
      },
      {
        guest: 'I do not want to pay. It was an accident!',
        choices: [
          pick('forget', 'I understand. Let us forget it this time.', 'good', [
            out('Thank you. I will be more careful.', { breakage: 4, rapport: 6, xp: 3, result: 'solved' })
          ]),
          pick('half', 'Could you pay half, please? Then we are done.', 'ok', [
            out('OK. Half is fair. Here you are.', { money: 2.5, breakage: 1.5, rapport: 2, xp: 3, result: 'solved' }, { weight: .65 }),
            out('No. Nothing. I said it was an accident.', { breakage: 4, rapport: -6 }, { weight: .35 })
          ]),
          pick('police', 'If you refuse to pay, I will call the police.', 'bad', [
            out('OK, OK. Here is the money. This is ridiculous.', { money: 5, rapport: -12, emotion: 'angry' }, { weight: .45 }),
            out('Call them! I will tell them you are being unfair!', { breakage: 4, rapport: -18, emotion: 'angry', spawn: 'threat-verbal' }, { weight: .55 })
          ])
        ]
      }
    ],
    ignored: out('The guest shrugs and the pieces stay on the floor until you clean them.', { breakage: 4, rapport: -5, result: 'failed' })
  },
  {
    id: 'break-bottle', category: 'breakage', title: 'A dropped bottle', icon: '🍾', severity: 2, weight: 3, triggers: ['arrival', 'enjoying'], timeoutMin: 8,
    vocab: ['bottle', 'shelf', 'drop', 'spill', 'clean up', 'pay for'],
    stages: [
      {
        guest: 'Oops… my bag knocked a bottle off the shelf! It broke and the floor is wet. I am very sorry.',
        choices: [
          pick('safe', 'Please step back. I will clean it up. Are you hurt?', 'good', [
            out('No, I am OK. Thank you for asking. I will pay for the bottle, of course.', { money: 15, rapport: 6, xp: 6, result: 'solved' }, { weight: behaves(.7) }),
            out('I am fine. But I do not think I should pay for the whole bottle.', { rapport: 0 }, { weight: misbehaves(.3), next: 1 })
          ], { tip: 'First check that nobody is hurt. Then talk about the money.' }),
          pick('pay', 'You broke it, so you must pay for it. It costs fifteen dollars.', 'ok', [
            out('Fair enough. Here you are.', { money: 15, rapport: -3, xp: 4, result: 'solved' }, { weight: behaves(.6) }),
            out('Fifteen dollars? The shelf was too close to the door!', { rapport: -6 }, { weight: misbehaves(.4), next: 1 })
          ]),
          pick('free', 'Do not worry. It was an accident. Nobody is hurt, and that is what matters.', 'good', [
            out('You are very generous. Thank you so much.', { breakage: 15, rapport: 14, popularity: 1, xp: 4, result: 'solved' })
          ])
        ]
      },
      {
        guest: 'I really think the shelf was in a bad place. Let us find a fair solution.',
        choices: [
          pick('half', 'Let us share the cost. You pay half.', 'good', [
            out('That is fair. Here is the money.', { money: 7.5, breakage: 7.5, rapport: 4, xp: 5, result: 'solved' })
          ]),
          pick('full', 'I am sorry, but you must pay the full price.', 'ok', [
            out('Fine. But I will not come back here.', { money: 15, rapport: -10, result: 'neutral' }, { weight: .6 }),
            out('No. I will not pay anything.', { rapport: -14, emotion: 'angry', spawn: 'threat-verbal' }, { weight: .4 })
          ])
        ]
      }
    ],
    ignored: out('The guest hurries away from the wet floor.', { breakage: 15, rapport: -6, leave: true, result: 'failed' })
  },
  {
    id: 'break-furniture', category: 'breakage', title: 'A broken stool', icon: '🪑', severity: 2, weight: 2, triggers: ['enjoying'], timeoutMin: 8,
    vocab: ['stool', 'chair', 'table', 'repair', 'damage', 'insurance'],
    applies: (context) => context.drunk >= 30,
    stages: [
      {
        guest: 'Hehe… the stool just… broke! It was not my fault. It was an old stool!',
        choices: [
          pick('safe', 'Are you OK? Please sit on this chair instead.', 'good', [
            out('I am OK. Thank you. Sorry about the stool.', { rapport: 6, xp: 4 }, { next: 1 })
          ]),
          pick('talk', 'Let us talk about the stool tomorrow, when you feel better.', 'good', [
            out('Yes, yes. Good idea. I will come back tomorrow.', { breakage: 25, rapport: 8, xp: 4, result: 'neutral', note: 'You postponed the discussion about the stool.' })
          ]),
          pick('pay', 'That stool was expensive. You must pay for it now.', 'bad', [
            out('Pay? Now? I am not paying anything!', { rapport: -14, emotion: 'angry' }, { weight: .6, next: 1 }),
            out('OK. Take it. Here is the money.', { money: 25, rapport: -8, result: 'solved' }, { weight: .4 })
          ], { tip: 'Do not argue about money with a drunk guest. Talk about it when they are sober.' })
        ]
      },
      {
        guest: 'I will pay… but not now. I do not have my wallet.',
        choices: [
          pick('number', 'Please leave your name and phone number. We will call you tomorrow.', 'good', [
            out('Of course. Here is my number.', { owes: 0, rapport: 4, xp: 4, result: 'solved', note: 'You wrote down the guest’s number.' }, { weight: behaves(.7) }),
            out('Hmm… maybe. Bye!', { breakage: 25, rapport: -3, leave: true, result: 'neutral' }, { weight: misbehaves(.3) })
          ]),
          pick('taxi', 'Shall I call you a taxi? You can come back tomorrow.', 'good', [
            out('Yes, please. Thank you for understanding.', { breakage: 25, rapport: 8, xp: 5, leave: true, result: 'solved' })
          ])
        ]
      }
    ],
    ignored: out('The guest sits on the floor, laughing.', { breakage: 25, rapport: -4, result: 'failed' })
  },
  {
    id: 'spill', category: 'breakage', title: 'A spilled drink', icon: '🍹', severity: 1, weight: 4, triggers: ['enjoying'], timeoutMin: 6,
    vocab: ['spill', 'towel', 'jacket', 'cleaning', 'sorry', 'on the house'],
    stages: [
      {
        guest: 'Oh no! I spilled my drink on the jacket of the lady next to me! She is very upset.',
        choices: [
          pick('towel', 'Here is a towel. I am so sorry. Please let me pay for the cleaning.', 'good', [
            out('Thank you. That is very kind. We are fine now.', { money: -6, rapport: 10, popularity: 1, xp: 6, result: 'solved' })
          ]),
          pick('drink', 'Please have a drink on the house. I am very sorry.', 'good', [
            out('Thank you! That is so generous.', { money: -4, rapport: 12, popularity: 1, xp: 5, result: 'solved' })
          ]),
          pick('guest', 'That is between the two of you. Please sort it out yourselves.', 'bad', [
            out('That is not very helpful…', { rapport: -8, popularity: -1, result: 'failed' })
          ], { tip: 'A good host helps both guests when something goes wrong.' })
        ]
      }
    ],
    ignored: out('The two guests argue for a while and then leave.', { rapport: -8, popularity: -1, leave: true, result: 'failed' })
  }
];
