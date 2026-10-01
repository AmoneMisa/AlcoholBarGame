import { out, pick } from './helpers';
import type { SituationDef } from './types';

// Guests ask for advice: which spirit, which cocktail, what goes with food. A good answer asks about their taste,
// recommends something that fits, and says why. Each is a small lesson in recommending and explaining.

export const ADVICE_SITUATIONS: SituationDef[] = [
  {
    id: 'advice-spirit', category: 'advice', title: 'Which spirit?', icon: '🥃', severity: 1, weight: 5, triggers: ['arrival', 'enjoying'], timeoutMin: 8,
    vocab: ['recommend', 'smooth', 'taste', 'prefer', 'strong', 'sweet', 'dry'],
    stages: [{
      guest: 'I would like to buy a bottle, but I do not know much about spirits. What do you recommend?',
      choices: [
        pick('ask', 'Of course. Do you prefer something smooth and sweet, or strong and dry?', 'good', [
          out('Hmm, smooth and sweet, I think. I do not like it harsh.', { rapport: 6, xp: 4 }, { next: 1 })
        ], { tip: 'Ask about taste before you recommend.' }),
        pick('guess', 'I recommend our most expensive bottle. It is the best.', 'bad', [
          out('Hmm. I did not ask for the most expensive one…', { rapport: -6, result: 'failed' })
        ]),
        pick('dont', 'Sorry, I do not know. Just choose one yourself.', 'rude', [
          out('Well. That is not very helpful.', { rapport: -10, popularity: -1, result: 'failed' })
        ])
      ]
    }, {
      guest: 'What would you suggest for me, then?',
      choices: [
        pick('rum', 'I suggest an aged rum. It is smooth and sweet, with notes of vanilla and caramel.', 'good', [
          out('That sounds lovely. I will take it, thank you for explaining!', { rapport: 10, xp: 8, popularity: 1, money: 6, result: 'solved' })
        ]),
        pick('whisky', 'Try a smooth whisky. It is easy to drink and it tastes of honey.', 'good', [
          out('Oh, nice. Honey, you say? I will try it.', { rapport: 8, xp: 7, money: 6, result: 'solved' })
        ]),
        pick('vodka', 'Vodka is good. It has no taste at all.', 'ok', [
          out('Hmm, no taste? Then I do not need it.', { rapport: -2, result: 'neutral' })
        ])
      ]
    }],
    ignored: out('The guest chooses a bottle alone and leaves a little confused.', { rapport: -3, result: 'neutral' })
  },
  {
    id: 'advice-cocktail', category: 'advice', title: 'Which cocktail?', icon: '🍹', severity: 1, weight: 6, triggers: ['arrival', 'enjoying'], timeoutMin: 8,
    vocab: ['refreshing', 'light', 'sour', 'fruity', 'suggest', 'menu'],
    stages: [{
      guest: 'I never know what to order from the menu. Can you suggest a cocktail?',
      choices: [
        pick('ask', 'Sure! Do you like something fruity and refreshing, or something stronger?', 'good', [
          out('Fruity and refreshing, please. It is a hot evening.', { rapport: 6, xp: 4 }, { next: 1 })
        ]),
        pick('first', 'Take the first one on the menu.', 'bad', [
          out('Oh, OK. I will do that.', { rapport: -3, result: 'neutral' })
        ]),
        pick('strong', 'Our strongest one. You will feel it.', 'rude', [
          out('I did not ask for that. Never mind.', { rapport: -8, result: 'failed' })
        ])
      ]
    }, {
      guest: 'That is perfect. What is in it, and why do you like it?',
      choices: [
        pick('explain', 'It has fresh lime, mint and a little sugar. It is light and very refreshing, and many guests love it.', 'good', [
          out('Mmm, that sounds great. I will have one! Thank you.', { rapport: 10, xp: 8, popularity: 1, money: 5, result: 'solved' })
        ]),
        pick('short', 'It is just a cocktail. It is nice.', 'ok', [
          out('Hmm, OK. I will try it, I suppose.', { rapport: 1, xp: 2, result: 'neutral' })
        ])
      ]
    }],
    ignored: out('The guest orders the cheapest drink on the menu.', { rapport: -2, result: 'neutral' })
  },
  {
    id: 'advice-pairing', category: 'advice', title: 'What goes with it?', icon: '🧀', severity: 1, weight: 5, triggers: ['enjoying'], timeoutMin: 8,
    vocab: ['pairing', 'salty', 'rich', 'balance', 'plate'],
    stages: [{
      guest: 'This drink is nice, but I am a little hungry. What goes well with it?',
      choices: [
        pick('cheese', 'A cheese plate goes very well with it. The salty cheese balances the drink.', 'good', [
          out('A cheese plate, yes! Please bring one.', { rapport: 9, xp: 7, money: 7, result: 'solved', note: 'The guest orders a cheese plate.' })
        ], { tip: 'Say why it goes well: salty and rich food balances a strong or sweet drink.' }),
        pick('nuts', 'Some salted nuts are a good choice. They are light and simple.', 'ok', [
          out('Nuts are fine. I will take a small bowl.', { rapport: 4, xp: 4, money: 3, result: 'solved' })
        ]),
        pick('ice', 'Nothing goes with it. Just drink it.', 'rude', [
          out('Well, that is a strange answer.', { rapport: -8, result: 'failed' })
        ])
      ]
    }],
    ignored: out('The guest stays hungry and leaves early.', { rapport: -3, result: 'neutral' })
  },
  {
    id: 'advice-gift', category: 'advice', title: 'A gift bottle', icon: '🎁', severity: 1, weight: 3, triggers: ['arrival'], timeoutMin: 8,
    vocab: ['gift', 'present', 'budget', 'wrap', 'occasion', 'special'],
    stages: [{
      guest: 'I need a present for my boss. He likes whisky. What can you recommend?',
      choices: [
        pick('budget', 'Nice idea! What is your budget, and is it for a special occasion?', 'good', [
          out('About fifty, and yes, it is his retirement.', { rapport: 7, xp: 5 }, { next: 1 })
        ]),
        pick('any', 'Take any bottle. They are all good.', 'bad', [
          out('Hmm. I would like some help, please.', { rapport: -5, result: 'failed' })
        ])
      ]
    }, {
      guest: 'Something special, then. Which one would you give?',
      choices: [
        pick('aged', 'I would give this aged single malt. It is smooth, and I can wrap it as a gift for you.', 'good', [
          out('That is perfect! Yes, please wrap it. Thank you so much!', { rapport: 12, xp: 10, money: 14, popularity: 2, result: 'solved' })
        ]),
        pick('cheap', 'Take the cheapest one. Nobody checks.', 'rude', [
          out('I do not think so. It is for a special person.', { rapport: -8, result: 'failed' })
        ])
      ]
    }],
    ignored: out('The guest leaves to look in another shop.', { rapport: -2, result: 'neutral' })
  },
  {
    id: 'advice-light', category: 'advice', title: 'Not too strong', icon: '🍃', severity: 1, weight: 4, triggers: ['arrival', 'enjoying'], timeoutMin: 8,
    vocab: ['light', 'mocktail', 'driving', 'careful'],
    stages: [{
      guest: 'I am driving later, so I want something with very little alcohol. Do you have anything?',
      choices: [
        pick('mock', 'Of course. I can make you a mocktail with no alcohol at all. It is fresh and fruity.', 'good', [
          out('A mocktail sounds perfect! You are very kind.', { rapport: 10, xp: 8, popularity: 1, money: 5, result: 'solved' })
        ], { tip: 'A mocktail has no alcohol. Always offer it to a guest who is driving.' }),
        pick('one', 'One cocktail is fine. You will not feel it.', 'bad', [
          out('No, thank you. I do not want to risk it.', { rapport: -6, popularity: -1, violation: 1, result: 'failed' })
        ]),
        pick('water', 'We only have water. Sorry.', 'ok', [
          out('Water is fine, I suppose.', { rapport: 1, result: 'neutral' })
        ])
      ]
    }],
    ignored: out('The guest orders a glass of water and leaves.', { rapport: -2, result: 'neutral' })
  },
  {
    id: 'advice-first-time', category: 'advice', title: 'My first whisky', icon: '🆕', severity: 1, weight: 3, triggers: ['arrival', 'enjoying'], timeoutMin: 8,
    vocab: ['beginner', 'sip', 'ice', 'slowly'],
    stages: [{
      guest: 'I have never tried whisky. How should I drink it?',
      choices: [
        pick('sip', 'Take a small sip first and drink it slowly. You can add a little water or an ice cube.', 'good', [
          out('Oh, that is a good tip. Let me try it your way!', { rapport: 9, xp: 8, money: 5, result: 'solved' })
        ]),
        pick('shot', 'Just drink it in one go, like a shot.', 'bad', [
          out('Ugh, that was terrible. I will not do that again.', { rapport: -6, drunk: 10, result: 'failed' })
        ])
      ]
    }],
    ignored: out('The guest drinks it too fast and coughs.', { rapport: -2, result: 'neutral' })
  }
];
