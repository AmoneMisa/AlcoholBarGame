import { behaves, out, pick } from './helpers';
import type { SituationDef } from './types';

// Good things happen at a bar too: celebrations, kindness, famous visitors, a stranger who pays a debt. Handling them
// well is a skill (and a vocabulary): congratulating, asking, offering, promising, and thanking.

export const GOOD_SITUATIONS: SituationDef[] = [
  {
    id: 'good-birthday', category: 'good', title: 'A birthday', icon: '🎂', severity: 1, weight: 5, triggers: ['arrival', 'enjoying'], timeoutMin: 8,
    vocab: ['birthday', 'candle', 'cake', 'sing', 'celebrate', 'congratulations', 'wish'],
    stages: [
      {
        guest: 'It is my friend’s birthday today! Could you bring a candle and maybe sing for her? We would love that.',
        choices: [
          pick('cake', 'Happy birthday! I will bring a small cake with a candle, on the house.', 'good', [
            out('Oh, that is so sweet! Thank you! Everyone, let us sing!', { money: -6, rapport: 15, popularity: 2, xp: 8, result: 'solved', note: 'The whole bar sang happy birthday. The group ordered more drinks.' }, { next: 1 })
          ]),
          pick('candle', 'Happy birthday! I will bring a candle with the next drink.', 'ok', [
            out('Thank you! That is lovely.', { rapport: 8, popularity: 1, xp: 4, result: 'solved' })
          ]),
          pick('no', 'Sorry, we do not do that.', 'bad', [
            out('Oh. OK… That is a shame.', { rapport: -6, result: 'failed' })
          ])
        ]
      },
      {
        guest: 'This is the best birthday ever! We would like a round of cocktails for everybody at the table!',
        choices: [
          pick('round', 'Excellent! I will bring a round of cocktails right away. Congratulations again!', 'good', [
            out('Wonderful! Here, this is for you, for your kindness.', { money: 22, rapport: 8, xp: 5 })
          ])
        ]
      }
    ],
    ignored: out('The group sings by themselves and has a good time.', { rapport: -2, result: 'neutral' })
  },
  {
    id: 'good-proposal', category: 'good', title: 'A marriage proposal', icon: '💍', severity: 1, weight: 1, triggers: ['arrival'], timeoutMin: 8,
    vocab: ['ring', 'propose', 'marry', 'champagne', 'surprise', 'secret', 'romantic'],
    setup: ({ random }) => ({ _yes: random() < .85 }),
    stages: [
      {
        guest: 'I need your help! I am going to ask my girlfriend to marry me tonight. Can you hide the ring in a glass of champagne?',
        choices: [
          pick('plan', 'What a lovely idea! Congratulations! Let us plan it. When should I bring the glass?', 'good', [
            out('When she comes back from the bathroom. Thank you so much!', { xp: 6 }, { next: 1 })
          ], { tip: 'Do not put a ring in a drink: she could swallow it. Put it on the plate, or in the napkin.' }),
          pick('careful', 'That is a lovely idea. But a ring in a glass is dangerous. Can we put it on a small plate instead?', 'good', [
            out('You are right! Great idea. A plate it is.', { xp: 8, rapport: 6 }, { next: 1 })
          ]),
          pick('no', 'Sorry, I do not have time for that tonight.', 'bad', [
            out('Oh. OK. I will do it myself, then.', { rapport: -10, popularity: -1, result: 'failed' })
          ])
        ]
      },
      {
        guest: 'She is coming! Here goes… (He gets on one knee. The bar goes quiet.)',
        choices: [
          pick('bring', 'Here is your champagne, madam. And something small for you, on a plate.', 'good', [
            out('She said YES! Everyone is clapping! Thank you, thank you!', { money: 30, crystals: 5, popularity: 4, rapport: 20, xp: 12, result: 'solved', note: 'She said yes! The whole bar celebrated.' }, { weight: (c) => (c.data._yes ? 1 : 0) }),
            out('She… needs time to think. It is a bit awkward. Thank you for trying.', { money: 10, rapport: 6, xp: 8, result: 'neutral' }, { weight: (c) => (c.data._yes ? 0 : 1) })
          ])
        ]
      }
    ],
    ignored: out('He proposes without your help. It is still lovely.', { popularity: 1, result: 'neutral' })
  },
  {
    id: 'good-critic', category: 'good', title: 'A food and drink writer', icon: '📝', severity: 1, weight: 2, triggers: ['arrival'], timeoutMin: 8,
    vocab: ['review', 'critic', 'recommend', 'signature', 'quality', 'magazine', 'honest'],
    stages: [
      {
        guest: 'Good evening. I write about bars for a city magazine. Tonight I am here as a normal guest. What do you recommend?',
        choices: [
          pick('best', 'Welcome! I recommend our signature cocktail. May I tell you how we make it?', 'good', [
            out('It is excellent. Thank you for the explanation. I will mention your bar.', { popularity: 3, crystals: 3, xp: 10, rapport: 12, result: 'solved', note: 'A magazine wrote a good review about your bar.' }, { weight: behaves(.8) }),
            out('It is nice. A bit sweet for my taste, but your service is good.', { popularity: 1, xp: 6, rapport: 4, result: 'solved' }, { weight: (c) => 1 - behaves(.8)(c) })
          ]),
          pick('ask', 'What do you usually like? Sweet, sour, or strong?', 'good', [
            out('Dry and not too sweet. You ask the right questions!', { popularity: 2, xp: 8, rapport: 8, result: 'solved' })
          ]),
          pick('rush', 'We have many drinks. Just choose one from the menu.', 'bad', [
            out('Hmm. That is not very helpful.', { popularity: -1, rapport: -6, result: 'failed', note: 'The writer was not impressed.' })
          ])
        ]
      }
    ],
    ignored: out('The writer waits a while, then leaves without a word.', { popularity: -1, leave: true, result: 'failed' })
  },
  {
    id: 'good-round', category: 'good', title: 'A round on a lucky guest', icon: '🍀', severity: 1, weight: 2, triggers: ['enjoying'], timeoutMin: 8,
    vocab: ['win', 'lucky', 'congratulations', 'round', 'on me', 'celebrate'],
    stages: [
      {
        guest: 'You will not believe it! I just won some money in the lottery! This round is on me, for the whole bar!',
        choices: [
          pick('congrats', 'Wonderful news! Congratulations! I will pour a round for everyone.', 'good', [
            out('Cheers! And keep the change, you deserve it!', { money: 40, popularity: 2, rapport: 14, xp: 8, result: 'solved', note: 'A lucky guest paid for a round for the whole bar.' })
          ]),
          pick('sure', 'Are you sure? That is very generous.', 'ok', [
            out('Absolutely! Come on, it is a happy day.', { money: 30, popularity: 1, rapport: 8, xp: 5, result: 'solved' })
          ])
        ]
      }
    ],
    ignored: out('The guest tells everyone anyway, and buys a few drinks.', { money: 10, result: 'neutral' })
  },
  {
    id: 'good-wallet', category: 'good', title: 'An honest guest', icon: '👛', severity: 1, weight: 2, triggers: ['arrival'], timeoutMin: 8,
    vocab: ['wallet', 'found', 'lost', 'honest', 'owner', 'reward'],
    stages: [
      {
        guest: 'Excuse me. I found this wallet under my seat. It must belong to someone who sat here earlier. Here, please take it.',
        choices: [
          pick('thanks', 'Thank you for being so honest. I will keep it safe and look for the owner.', 'good', [
            out('It is the right thing to do. Have a nice evening.', { popularity: 1, xp: 8, rapport: 10, result: 'solved', note: 'You looked after a lost wallet. The owner came back later.' })
          ]),
          pick('reward', 'That is very kind. Please have a drink on the house as a thank you.', 'good', [
            out('That is generous! Thank you!', { money: -3, popularity: 2, xp: 8, rapport: 14, crystals: 2, result: 'solved', note: 'The owner came back and gave a big thank-you.' })
          ]),
          pick('keep', 'Great. Nobody will notice if we keep the money.', 'rude', [
            out('What? That is stealing! I will not come back!', { popularity: -3, rapport: -25, leave: true, result: 'failed' })
          ])
        ]
      }
    ],
    ignored: out('The guest leaves the wallet on the bar and goes.', { popularity: 0, leave: true, result: 'neutral' })
  },
  {
    id: 'good-music', category: 'good', title: 'A musician', icon: '🎸', severity: 1, weight: 2, triggers: ['arrival'], timeoutMin: 8,
    vocab: ['guitar', 'play', 'live music', 'tips', 'quietly', 'permission'],
    stages: [
      {
        guest: 'Hello! I play the guitar. May I play a few songs here? I would play for tips. I promise to keep it quiet.',
        choices: [
          pick('yes', 'Of course! Please play by the window. Thank you for asking.', 'good', [
            out('Thank you! This is going to be fun!', { money: 18, popularity: 2, rapport: 10, xp: 7, result: 'solved', note: 'The guests loved the live music.' }, { weight: .8 }),
            out('Thank you! (The music is a bit too loud for some guests.)', { money: 8, popularity: 0, rapport: 4, xp: 4, result: 'neutral' }, { weight: .2 })
          ]),
          pick('limit', 'Yes, but only for thirty minutes, and quietly, please.', 'good', [
            out('Perfect. Thank you for the chance.', { money: 12, popularity: 1, rapport: 6, xp: 6, result: 'solved' })
          ]),
          pick('no', 'I am sorry, we do not have live music today.', 'ok', [
            out('No problem. Maybe another day.', { rapport: -1, leave: true, result: 'neutral' })
          ])
        ]
      }
    ],
    ignored: out('The musician shrugs and walks to another bar.', { leave: true, result: 'neutral' })
  },
  {
    id: 'good-photo', category: 'good', title: 'A photo for social media', icon: '📸', severity: 1, weight: 3, triggers: ['enjoying'], timeoutMin: 8,
    vocab: ['photo', 'social media', 'post', 'tag', 'followers', 'permission', 'camera'],
    stages: [
      {
        guest: 'This cocktail looks amazing! May I take a photo and post it on social media? I have many followers.',
        choices: [
          pick('yes', 'Of course! Please tag our bar. Would you like me to put a fresh garnish on it first?', 'good', [
            out('Thank you! I will tag you. It looks great!', { popularity: 2, rapport: 10, xp: 6, result: 'solved' })
          ]),
          pick('privacy', 'Of course, but please do not take photos of other guests.', 'good', [
            out('Of course. Only the drink. Thank you!', { popularity: 1, rapport: 6, xp: 6, result: 'solved' })
          ]),
          pick('no', 'No photos, sorry.', 'bad', [
            out('OK. It is only a cocktail…', { rapport: -6, result: 'neutral' })
          ])
        ]
      }
    ],
    ignored: out('The guest takes a quick photo anyway.', { popularity: 1, result: 'neutral' })
  },
  {
    id: 'good-gift', category: 'good', title: 'A gift from a regular', icon: '🎁', severity: 1, weight: 2, triggers: ['arrival'], timeoutMin: 8,
    vocab: ['gift', 'present', 'trip', 'regular', 'thank', 'kind'],
    applies: (context) => context.rapport >= 60,
    stages: [
      {
        guest: 'Good evening! I brought you something from my trip. It is just a small gift for the best bartender in town.',
        choices: [
          pick('thanks', 'That is so kind of you! Thank you very much. Please have a drink on me.', 'good', [
            out('You are too kind! I am so happy to be here.', { crystals: 5, rapport: 15, popularity: 1, xp: 8, money: -4, result: 'solved', note: 'A regular gave you a gift.' })
          ]),
          pick('polite', 'Thank you, but I can not accept gifts at work.', 'ok', [
            out('I understand. Please keep it for later.', { rapport: 4, xp: 4, result: 'neutral' })
          ])
        ]
      }
    ],
    ignored: out('The guest leaves the gift on the bar with a note.', { crystals: 2, result: 'neutral' })
  },
  {
    id: 'good-payback', category: 'good', title: 'A guest pays their tab', icon: '🧾', severity: 1, weight: 6, triggers: ['arrival'], timeoutMin: 8,
    vocab: ['tab', 'owe', 'pay back', 'promise', 'honest', 'interest'],
    applies: (context) => Number(context.data._tabs ?? 0) > 0,
    stages: [
      {
        guest: 'Good evening! I came to pay my tab from the other night. I am sorry it took so long.',
        choices: [
          pick('thanks', 'Thank you for coming back. That is very honest of you.', 'good', [
            out('Here is everything I owed you, and a bit extra for your trouble.', { settleTab: true, rapport: 10, popularity: 1, xp: 8, result: 'solved', note: 'A guest paid their tab with a tip.' })
          ]),
          pick('forget', 'Do not worry about it. It is forgotten.', 'ok', [
            out('No, I insist. Please take it.', { settleTab: true, rapport: 8, xp: 4, result: 'solved' })
          ])
        ]
      }
    ],
    ignored: out('The guest leaves the money on the counter.', { settleTab: true, result: 'neutral' })
  },
  {
    id: 'good-inspector', category: 'good', title: 'A city inspector', icon: '🕵️', severity: 2, weight: 1, triggers: ['arrival'], timeoutMin: 8,
    vocab: ['inspector', 'licence', 'inspection', 'rules', 'fine', 'warning', 'records'],
    applies: (context) => Number(context.data._violations ?? 0) >= 0,
    stages: [
      {
        guest: 'Good evening. I am from the city inspection. May I check your licence and see how you follow the rules?',
        choices: [
          pick('welcome', 'Of course. Welcome. Here are our licence and our records.', 'good', [
            out('Everything is in order. You run a very good bar. Well done!', { popularity: 3, crystals: 5, xp: 12, result: 'solved', note: 'The inspector praised your bar.' }, { weight: (c) => (Number(c.data._violations) === 0 ? 1 : 0) }),
            out('There were a few small problems. This is a warning, not a fine. Please follow all the rules.', { popularity: 0, xp: 6, resetViolations: true, result: 'neutral', note: 'You received a warning. Your record is clear again.' }, { weight: (c) => (Number(c.data._violations) >= 1 && Number(c.data._violations) <= 2 ? 1 : 0) }),
            out('I have found several violations. I must give you a fine.', { money: -45, popularity: -2, xp: 3, resetViolations: true, result: 'failed', note: 'The inspector gave you a fine.' }, { weight: (c) => (Number(c.data._violations) >= 3 ? 1 : 0) })
          ], { tip: 'Be polite and show your papers. Honesty helps.' }),
          pick('nervous', 'Oh! Um… please wait a moment. I need to find the papers.', 'ok', [
            out('Take your time. But please be ready next time.', { xp: 2, result: 'neutral' })
          ]),
          pick('bribe', 'Maybe we can solve this with a little gift?', 'rude', [
            out('Are you trying to bribe me? That is a crime! I am writing a report.', { money: -80, popularity: -4, rapport: -30, resetViolations: true, result: 'failed', note: 'Never try to bribe an inspector.' })
          ])
        ]
      }
    ],
    ignored: out('The inspector writes something on a paper and leaves.', { popularity: -1, result: 'failed' })
  },
  {
    id: 'good-power-cut', category: 'good', title: 'The lights go out', icon: '🕯️', severity: 1, weight: 2, triggers: ['enjoying'], timeoutMin: 6,
    vocab: ['power cut', 'candles', 'dark', 'calm', 'electricity', 'romantic'],
    stages: [
      {
        guest: 'Oh! The lights just went out! Is it a power cut? It is very dark in here!',
        choices: [
          pick('candles', 'Please stay calm and stay seated. I will bring candles. We will be fine.', 'good', [
            out('How romantic! This is actually lovely. Another round, please!', { money: 18, popularity: 2, rapport: 10, xp: 7, result: 'solved', note: 'Candlelight made the evening special.' })
          ]),
          pick('phones', 'Everyone, please use your phone lights. I will check the fuse box.', 'ok', [
            out('OK. Hurry up, please. It is a bit scary.', { rapport: 3, xp: 4, result: 'solved' })
          ]),
          pick('close', 'Everyone, please leave. The bar is closed.', 'bad', [
            out('Already? We just arrived!', { rapport: -10, popularity: -1, leave: true, result: 'failed' })
          ])
        ]
      }
    ],
    ignored: out('The lights come back after a minute. People laugh about it.', { result: 'neutral' })
  },
  {
    id: 'good-celebrity', category: 'good', title: 'A famous guest', icon: '🌟', severity: 1, weight: 1, triggers: ['arrival'], timeoutMin: 8,
    vocab: ['famous', 'private', 'table', 'honour', 'discreet', 'autograph'],
    stages: [
      {
        guest: 'Good evening. I would like a quiet place to sit, please. I do not want too much attention tonight.',
        choices: [
          pick('discreet', 'Of course. Welcome. Please sit at the quiet table in the corner. I will be discreet.', 'good', [
            out('Thank you. You are very kind. That is exactly what I needed.', { popularity: 4, crystals: 4, money: 20, rapport: 16, xp: 10, result: 'solved', note: 'A famous guest enjoyed your discreet service and told friends.' })
          ]),
          pick('loud', 'Oh my goodness! You are famous! Look who is here!', 'bad', [
            out('Oh no… please. I wanted some quiet.', { popularity: -1, rapport: -15, leave: true, result: 'failed', note: 'The famous guest left because of the attention.' })
          ], { tip: 'Famous guests want peace. Be warm, and be discreet.' })
        ]
      }
    ],
    ignored: out('The guest waits and then leaves quietly.', { leave: true, result: 'neutral' })
  }
];
