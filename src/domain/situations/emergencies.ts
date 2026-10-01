import { out, pick } from './helpers';
import type { SituationDef } from './types';

// Building emergencies: gas (104), fire (101). The safe answer is always the same: protect people, do not make
// sparks or flames, get everybody outside, and call the emergency number from a safe place.

export const EMERGENCY_SITUATIONS: SituationDef[] = [
  {
    id: 'emergency-gas', category: 'security', title: 'A smell of gas', icon: '💨', severity: 3, weight: 1, triggers: ['arrival', 'enjoying'], timeoutMin: 5,
    vocab: ['gas', 'smell', 'leak', 'flame', 'switch', 'open the windows', 'evacuate', 'outside'],
    stages: [
      {
        guest: 'Excuse me! I smell gas in here! It is coming from the kitchen. I feel a bit dizzy.',
        choices: [
          pick('evacuate', 'Everyone, please leave the building now. Do not use any lights, flames or phones inside.', 'good', [
            out('Quickly! Everybody outside!', { xp: 6 }, { next: 1 })
          ], { tip: 'With a gas smell: no flames, no switches. Get everybody outside first.' }),
          pick('windows', 'Please open the windows. I will turn off the gas and call 104.', 'ok', [
            out('OK. Hurry, please. The smell is strong.', { xp: 4 }, { next: 1 })
          ]),
          pick('check', 'Let me light a match and check where the smell is.', 'bad', [
            out('No! Do not do that! Stop!', { breakage: 80, popularity: -4, rapport: -30, leave: true, result: 'failed', note: 'There was a small explosion. The bar closes for the night.' })
          ], { tip: 'Never use a flame or a switch near a gas leak.' }),
          pick('ignore', 'It is probably the cooker. It is nothing.', 'bad', [
            out('I really think it is gas!', { rapport: -10 }, { next: 1 })
          ])
        ]
      },
      {
        guest: 'We are all outside now. It still smells like gas. What should we do?',
        choices: [
          pick('call', 'I will call 104, the gas emergency number, from here. Please stay away from the door.', 'good', [
            out('The gas workers are coming. Thank you for acting so fast.', { xp: 10, popularity: 2, result: 'solved', note: 'The gas workers fixed the leak. Nobody was hurt.' })
          ]),
          pick('112', 'I will call 112 and tell them we have a gas leak.', 'good', [
            out('Good. They will send the right people.', { xp: 9, popularity: 2, result: 'solved', note: 'The emergency service sent the gas workers.' })
          ]),
          pick('inside', 'I will go back inside and turn off the gas myself.', 'bad', [
            out('That is too dangerous! Do not go in!', { rapport: -10, popularity: -1, result: 'failed' })
          ])
        ]
      }
    ],
    ignored: out('The smell gets stronger, and the guests leave in a panic.', { breakage: 30, popularity: -3, result: 'failed', note: 'You waited too long. Guests left in panic.' })
  },
  {
    id: 'emergency-fire', category: 'security', title: 'A fire in the kitchen', icon: '🔥', severity: 3, weight: 1, triggers: ['arrival', 'enjoying'], timeoutMin: 4,
    vocab: ['fire', 'smoke', 'alarm', 'extinguisher', 'exit', 'evacuate', 'firefighters'],
    stages: [
      {
        guest: 'Fire! There is smoke coming from the kitchen! I can see flames behind the cooker!',
        choices: [
          pick('exit', 'Everybody, please leave through the front door. Walk, do not run. I will call 101.', 'good', [
            out('Everyone out! This way!', { xp: 6 }, { next: 1 })
          ], { tip: 'Get people out first. Call the fire brigade (101) from outside.' }),
          pick('extinguisher', 'Stay back. I will use the fire extinguisher. Pull the pin and aim at the base of the fire.', 'ok', [
            out('The fire is going out! Well done!', { xp: 8, popularity: 1, result: 'solved', note: 'The small fire was put out. Check the cooker and call 101 if it comes back.' }, { weight: .6 }),
            out('It is too big! Get out!', { xp: 3 }, { weight: .4, next: 1 })
          ], { tip: 'Only fight a very small fire, and only when you have an exit behind you.' }),
          pick('water', 'Throw water on it!', 'bad', [
            out('No, not water! The oil will explode!', { breakage: 40, popularity: -2, rapport: -10 }, { next: 1 })
          ], { tip: 'Never throw water on an oil or electrical fire.' })
        ]
      },
      {
        guest: 'We are all outside. The kitchen is full of smoke. What now?',
        choices: [
          pick('call', 'I will call 101 right now. Please stay away from the building.', 'good', [
            out('The firefighters are on their way. Everybody is safe. Thank you.', { xp: 10, popularity: 2, result: 'solved', note: 'The fire brigade put out the fire. Nobody was hurt.' })
          ]),
          pick('112', 'I will call 112 and ask for the fire brigade.', 'good', [
            out('Good. They are coming.', { xp: 9, popularity: 2, result: 'solved', note: 'The fire brigade put out the fire.' })
          ]),
          pick('inside', 'I will go back in for the cash register.', 'bad', [
            out('Please do not! Money is not worth your life!', { rapport: -10, popularity: -1, result: 'failed' })
          ])
        ]
      }
    ],
    ignored: out('The fire spreads. Guests run outside in a panic.', { breakage: 60, popularity: -4, result: 'failed', note: 'You waited too long. The fire damaged the kitchen.' })
  }
];
