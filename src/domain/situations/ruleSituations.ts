import { hasRule } from './houseRules';
import { behaves, misbehaves, out, pick } from './helpers';
import type { SituationDef } from './types';

// Situations where a rule of the house or of the city meets a guest who would like something else. Saying "no" kindly
// and clearly, and explaining the reason, is the skill. Breaking a rule sometimes works — until the inspector comes.

const PAID = { paid: 1 as const, result: 'solved' as const };

export const RULE_SITUATIONS: SituationDef[] = [
  {
    id: 'rule-card-only', category: 'payment', title: 'Alcohol: card only', icon: '💳', severity: 1, weight: 6, triggers: ['payment'], holdsPayment: true, timeoutMin: 8,
    vocab: ['law', 'by card only', 'cash', 'alcohol', 'allowed', 'rule', 'illegal'],
    applies: (context) => hasRule(context.region, 'alcohol-card-only'),
    stages: [
      {
        guest: 'I would like to pay in cash, please. I do not have my card with me.',
        choices: [
          pick('law', 'I am sorry. In this city, alcohol can only be paid for by card. It is the law.', 'good', [
            out('Oh, I did not know that. Let me look… I have a card in my other pocket. Here you are.', { ...PAID, xp: 6, rapport: 2 }, { weight: .5 }),
            out('That is a strange rule. I only have cash. What can I do?', { rapport: -2 }, { weight: .5, next: 1 })
          ], { tip: 'Explain the rule and the reason: “It is the law.” Then offer a way to solve the problem.' }),
          pick('ok', 'It is OK. I will take cash this time. Please do not tell anybody.', 'bad', [
            out('Thank you! You are the best.', { ...PAID, rapport: 8, violation: 1, xp: 0, result: 'neutral', note: 'You broke the card-only rule. An inspector could fine the bar.' })
          ], { tip: 'Breaking a law to please a guest can cost the bar a lot of money.' }),
          pick('soft', 'We can not take cash for alcohol, but I can make you a non-alcoholic cocktail for cash.', 'good', [
            out('Hmm, why not? That sounds good.', { paid: .5, xp: 5, rapport: 4, result: 'neutral', note: 'The guest changed to a non-alcoholic drink.' })
          ])
        ]
      },
      {
        guest: 'I really do not have a card. What can I do?',
        choices: [
          pick('friend', 'Could a friend pay by card for you? Then you can give them the cash.', 'good', [
            out('Good idea! My friend is here. I will ask them.', { ...PAID, xp: 6, rapport: 6 }, { weight: .7 }),
            out('My friend is not here tonight.', {}, { weight: .3, next: 1 })
          ]),
          pick('qr', 'You can pay from your banking app, if you like.', 'ok', [
            out('Yes! My bank has an app. I will pay with my phone.', { ...PAID, xp: 5 }, { weight: .6 }),
            out('My phone has no battery…', {}, { weight: .4, next: 1 })
          ]),
          pick('water', 'I can give you a glass of water for free, then.', 'ok', [
            out('That is kind. Thank you. I will go and take some money out.', { paid: 0, xp: 3, rapport: 6, leave: true, result: 'neutral' })
          ])
        ]
      }
    ],
    ignored: out('The guest leaves the money on the counter and walks out.', { paid: 1, violation: 1, rapport: -4, leave: true, result: 'neutral', note: 'You accepted cash for alcohol. That breaks the rule.' })
  },
  {
    id: 'rule-boarding-pass', category: 'payment', title: 'Duty-free: the boarding pass', icon: '🛫', severity: 1, weight: 5, triggers: ['arrival'], timeoutMin: 8,
    vocab: ['boarding pass', 'passport', 'flight', 'duty-free', 'traveller', 'gate', 'departure'],
    applies: (context) => hasRule(context.region, 'boarding-pass') && context.orderKind === 'bottle',
    setup: ({ random }) => ({ _hasPass: random() < .75 }),
    stages: [
      {
        guest: 'Hello! I would like to buy some bottles. I am flying home tonight and I want presents for my family.',
        choices: [
          pick('ask', 'Of course. May I see your boarding pass and your passport, please?', 'good', [
            out('Here they are. My flight leaves in three hours.', { xp: 6, rapport: 4, result: 'solved', note: 'The guest showed a valid boarding pass.' }, { weight: (c) => (c.data._hasPass ? 1 : 0) }),
            out('Oh… my boarding pass is on my phone, and the battery is dead.', { xp: 3 }, { weight: (c) => (c.data._hasPass ? 0 : 1), next: 1 })
          ], { tip: 'In a duty-free shop you must check the boarding pass first.' }),
          pick('skip', 'Of course. What would you like?', 'bad', [
            out('Two bottles of the best whisky, please.', { violation: 1, rapport: 3, xp: 0, result: 'neutral', note: 'You did not check the boarding pass. That breaks the duty-free rule.' }, { weight: (c) => (c.data._hasPass ? .7 : 1) }),
            out('Two bottles, please. I am not flying today, but it is cheaper here.', { violation: 1, popularity: -1, rapport: 3, result: 'failed', note: 'The guest was not a traveller. That broke the duty-free rule.' }, { weight: (c) => (c.data._hasPass ? .3 : 0) })
          ], { tip: 'Always check a boarding pass in a duty-free shop. Not checking can cost you a fine.' }),
          pick('flight', 'Where are you flying today, and what time does your flight leave?', 'ok', [
            out('To Dubai, at nine. Here is my boarding pass.', { xp: 4 }, { weight: (c) => (c.data._hasPass ? 1 : 0) }),
            out('Hmm, to… Dubai? I am not sure about the time.', { xp: 2 }, { weight: (c) => (c.data._hasPass ? 0 : 1), next: 1 })
          ])
        ]
      },
      {
        guest: 'I am a real traveller, I promise! Can you make an exception, please? My flight is soon.',
        choices: [
          pick('no', 'I am sorry, but I can not sell duty-free bottles without a boarding pass. It is the rule.', 'good', [
            out('I understand. I will charge my phone and come back.', { xp: 7, rapport: 2, leave: true, result: 'solved' }, { weight: .7 }),
            out('That is silly! I am leaving!', { rapport: -10, leave: true, xp: 4, result: 'solved' }, { weight: .3 })
          ]),
          pick('charger', 'You can charge your phone here. Please show me the boarding pass when it turns on.', 'good', [
            out('Thank you so much! You are very helpful.', { xp: 8, rapport: 10, popularity: 1, result: 'solved', note: 'The guest charged the phone and showed a valid pass.' })
          ]),
          pick('exception', 'OK. Just this once. Please hurry.', 'bad', [
            out('Thank you! You saved me.', { violation: 1, rapport: 8, result: 'neutral', note: 'You broke the duty-free rule.' })
          ])
        ]
      }
    ],
    ignored: out('The guest gets tired of waiting and goes to another shop.', { rapport: -6, leave: true, result: 'failed' })
  },
  {
    id: 'rule-id-young', category: 'payment', title: 'Is this guest old enough?', icon: '🪪', severity: 2, weight: 4, triggers: ['arrival'], timeoutMin: 8,
    vocab: ['ID', 'age', 'underage', 'twenty-one', 'proof of age', 'refuse', 'soft drink'],
    setup: ({ random }) => ({ _age: random() < .45 ? 16 + Math.floor(random() * 2) : 21 + Math.floor(random() * 6) }),
    stages: [
      {
        guest: 'Hi! I would like a beer, please. I am twenty-one. I look younger because of my face, everybody says so.',
        choices: [
          pick('id', 'Of course. May I see your ID, please?', 'good', [
            out('Sure, here it is. Twenty-three years old, you see?', { xp: 6, rapport: 2, result: 'solved' }, { weight: (c) => (Number(c.data._age) >= 21 ? 1 : 0) }),
            out('Oh… I forgot it at home. But I am really twenty-one!', { xp: 3 }, { weight: (c) => (Number(c.data._age) >= 21 ? 0 : 1), next: 1 })
          ]),
          pick('believe', 'OK, I believe you. What kind of beer?', 'bad', [
            out('A cold one, please. Thanks!', { rapport: 4, result: 'neutral' }, { weight: (c) => (Number(c.data._age) >= 21 ? 1 : 0) }),
            out('A cold one, please. (The guest is only seventeen.)', { violation: 2, popularity: -2, result: 'failed', note: 'You served an underage guest. That is a serious violation.' }, { weight: (c) => (Number(c.data._age) >= 21 ? 0 : 1) })
          ], { tip: 'If the guest looks young, always check ID. Never serve alcohol to someone underage.' })
        ]
      },
      {
        guest: 'Come on, I am old enough. Just one beer. Nobody will know.',
        choices: [
          pick('refuse', 'I am sorry. I can not serve you without ID. Can I get you a soft drink?', 'good', [
            out('OK. A cola, then. Sorry.', { xp: 7, rapport: 2, paid: 0, leave: false, result: 'solved', money: 2 }, { weight: .7 }),
            out('That is so unfair! I am leaving.', { leave: true, xp: 6, result: 'solved' }, { weight: .3 })
          ]),
          pick('bring', 'You can come back with your ID and I will serve you.', 'good', [
            out('OK. I will bring it tomorrow.', { leave: true, xp: 6, rapport: 2, result: 'solved' })
          ]),
          pick('serve', 'OK. One beer. But please be quiet.', 'bad', [
            out('Thank you! Cheers!', { violation: 2, popularity: -2, result: 'failed', note: 'You served an underage guest. That is a serious violation.' })
          ])
        ]
      }
    ],
    ignored: out('The young-looking guest drinks a soft drink and leaves.', { result: 'neutral' })
  },
  {
    id: 'rule-smoking-inside', category: 'good', title: 'Smoking inside', icon: '🚭', severity: 1, weight: 3, triggers: ['enjoying'], timeoutMin: 6,
    vocab: ['smoke', 'cigarette', 'terrace', 'allowed', 'put out', 'ashtray'],
    applies: (context) => hasRule(context.region, 'smoking-terrace'),
    stages: [
      {
        guest: 'Do you mind if I smoke here? It is cold on the terrace, and I will be quick.',
        choices: [
          pick('terrace', 'I am sorry, smoking is only allowed on the terrace. I can bring you a blanket.', 'good', [
            out('A blanket? That is very kind. OK, I will go outside.', { xp: 6, rapport: 6, result: 'solved' }, { weight: behaves(.8) }),
            out('Oh, come on. Nobody will mind.', { rapport: -3 }, { weight: misbehaves(.2), next: 1 })
          ]),
          pick('ok', 'Sure, go ahead, but do not tell anybody.', 'bad', [
            out('Thanks! You are great.', { violation: 1, rapport: 8, result: 'neutral', note: 'You allowed smoking inside. An inspector could fine the bar.' })
          ], { tip: 'Allowing smoking indoors where it is not allowed can cost the bar a fine.' }),
          pick('out', 'Please put it out. Smoking is not allowed inside.', 'ok', [
            out('OK, OK. Sorry.', { xp: 3, rapport: -2, result: 'solved' })
          ])
        ]
      },
      {
        guest: 'It is only one cigarette!',
        choices: [
          pick('firm', 'I understand, but it is the rule for everybody. Please go to the terrace.', 'good', [
            out('Fine. I will go.', { xp: 5, rapport: 0, result: 'solved' })
          ])
        ]
      }
    ],
    ignored: out('The guest lights a cigarette anyway. Other guests complain.', { violation: 1, popularity: -1, rapport: -4, result: 'failed' })
  },
  {
    id: 'pet-dog', category: 'good', title: 'A dog at the door', icon: '🐕', severity: 1, weight: 4, triggers: ['arrival'], timeoutMin: 8,
    vocab: ['dog', 'pet', 'service dog', 'allowed', 'terrace', 'outside', 'rule'],
    setup: ({ random }) => ({ _service: random() < .3 }),
    stages: [
      {
        guest: 'Hello! Can my dog come in with me? He is very quiet. He will sit under the table.',
        choices: [
          pick('no', 'I am sorry, pets are not allowed in the bar. Could he wait outside?', 'good', [
            out('Oh, but he is a service dog! Here is his vest and his card.', { xp: 3 }, { weight: (c) => (c.data._service ? 1 : 0), next: 1 }),
            out('Hmm. I understand. I will tie him up outside, then.', { xp: 5, rapport: -2, result: 'solved' }, { weight: (c) => (c.data._service ? 0 : .6) }),
            out('He is only a small dog! This is not fair!', { rapport: -6 }, { weight: (c) => (c.data._service ? 0 : .4), next: 2 })
          ]),
          pick('service', 'Is he a service dog?', 'good', [
            out('Yes! He helps me every day. Here is his card.', { xp: 4, rapport: 2 }, { weight: (c) => (c.data._service ? 1 : 0), next: 1 }),
            out('No… he is my pet. But he is very clean and quiet.', { xp: 3 }, { weight: (c) => (c.data._service ? 0 : 1), next: 2 })
          ], { tip: 'Pets can be refused, but service dogs must always be welcome. Ask politely before you decide.' }),
          pick('yes', 'Of course, he can stay.', 'ok', [
            out('Thank you! You are so kind.', { rapport: 10, xp: 4, result: 'solved' }, { weight: (c) => (c.data._service ? 1 : 0) }),
            out('Thank you! (Another guest looks unhappy about the dog.)', { rapport: 6, violation: 1, popularity: -1, result: 'neutral', note: 'You allowed a pet inside. That breaks the house rule.' }, { weight: (c) => (c.data._service ? 0 : 1) })
          ])
        ]
      },
      {
        guest: 'He is a registered service dog. He is allowed everywhere by law. Please let us in.',
        choices: [
          pick('sorry', 'I am very sorry. Of course, service dogs are welcome here. Please sit wherever you like.', 'good', [
            out('Thank you for understanding. Not everybody does.', { xp: 8, rapport: 15, popularity: 1, result: 'solved', note: 'You welcomed a service dog.' })
          ]),
          pick('refuse', 'I am sorry, but still no dogs.', 'rude', [
            out('That is discrimination! I will tell everyone about this.', { rapport: -30, popularity: -4, violation: 1, leave: true, result: 'failed', note: 'Refusing a service dog is not allowed.' })
          ], { tip: 'Refusing a service dog is against the law in many countries.' })
        ]
      },
      {
        guest: 'He is very clean, and he will not make any noise. Please, it is raining outside.',
        choices: [
          pick('terrace', 'I am sorry, the rule is no pets inside. But he is welcome on the terrace, and I can bring you a drink there.', 'good', [
            out('That is fair. Thank you for offering a solution.', { xp: 7, rapport: 6, result: 'solved' }, { weight: (c) => (hasRule(c.region, 'pets-terrace') ? 1 : .2) }),
            out('The terrace? It is raining! I will go somewhere else.', { leave: true, xp: 4, rapport: -2, result: 'solved' }, { weight: (c) => (hasRule(c.region, 'pets-terrace') ? .1 : .8) })
          ]),
          pick('rule', 'I understand, but I can not make an exception. It is the rule for everyone.', 'good', [
            out('OK. I will go to another place. Thank you for being honest.', { leave: true, xp: 6, rapport: -2, result: 'solved' })
          ]),
          pick('exception', 'OK, just this once. But please keep him under the table.', 'bad', [
            out('Thank you! He will be a perfect gentleman.', { violation: 1, popularity: -1, rapport: 8, result: 'neutral', note: 'You allowed a pet inside. That breaks the house rule.' })
          ])
        ]
      }
    ],
    ignored: out('The guest waits at the door for a while, then leaves with the dog.', { rapport: -6, leave: true, result: 'failed' })
  },
  {
    id: 'rule-last-call', category: 'good', title: 'One more after last call', icon: '🕛', severity: 1, weight: 3, triggers: ['enjoying'], timeoutMin: 6,
    vocab: ['last call', 'closing', 'one more', 'coffee', 'water', 'closed'],
    stages: [
      {
        guest: 'It is only five minutes after last call. Come on, just one more drink, please! I will pay double!',
        choices: [
          pick('no', 'I am sorry, last call was five minutes ago, and the bar is closed for alcohol. Can I get you a coffee or some water?', 'good', [
            out('Fair enough. A coffee, then. Thanks for being straight with me.', { xp: 6, rapport: 4, money: 3, result: 'solved' }, { weight: behaves(.7) }),
            out('Come on! You are no fun!', { rapport: -6 }, { weight: misbehaves(.3), next: 1 })
          ]),
          pick('yes', 'OK, I will make you one more drink. But do not tell the manager.', 'bad', [
            out('You are the best!', { violation: 1, money: 8, rapport: 8, result: 'neutral', note: 'You served after last call. That breaks the house rule.' })
          ])
        ]
      },
      {
        guest: 'Please, please. Just a small one.',
        choices: [
          pick('firm', 'I am sorry, I can not. It is the rule for everybody. Please finish your water, and I will call you a taxi.', 'good', [
            out('All right. A taxi, please. Thank you.', { xp: 7, rapport: 4, leave: true, result: 'solved' })
          ])
        ]
      }
    ],
    ignored: out('The guest gives up and orders a water.', { xp: 1, result: 'neutral' })
  }
];
