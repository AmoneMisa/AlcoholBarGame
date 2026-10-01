import { behaves, misbehaves, out, pick } from './helpers';
import type { SituationDef } from './types';

// Flirting. Most guests are only being friendly, and a good bartender stays warm and professional. The English to
// learn here is how to say “thank you, but no” kindly, how to set a clear boundary when a guest does not stop, and
// when to ask for help. Nobody should ever have to put up with unwanted attention.

export const FLIRT_SITUATIONS: SituationDef[] = [
  {
    id: 'flirt-mild', category: 'good', title: 'A friendly compliment', icon: '😉', severity: 1, weight: 4, triggers: ['enjoying'], timeoutMin: 8,
    vocab: ['compliment', 'smile', 'date', 'polite', 'professional', 'working'],
    applies: (context) => context.rapport >= 55,
    stages: [
      {
        guest: 'You have a great smile, you know. Are you free after work? I would love to take you for a drink somewhere nice.',
        choices: [
          pick('thanks', 'Thank you, that is very kind. But I am working, and I do not date guests.', 'good', [
            out('Ha, fair enough. I respect that. Can I have another one of these, then?', { rapport: 6, xp: 5, result: 'solved' }, { weight: behaves(.85) }),
            out('Oh, come on. Just one drink?', { rapport: -2 }, { weight: misbehaves(.15), next: 1 })
          ], { tip: 'A friendly, clear “no” protects you and the bar. Give a reason and change the subject.' }),
          pick('deflect', 'Thank you! Let me get you another drink first.', 'ok', [
            out('Ha! You are good at this. Yes, please.', { rapport: 4, xp: 3, money: 2, result: 'solved' }, { weight: behaves(.8) }),
            out('You did not answer my question…', { rapport: -2 }, { weight: misbehaves(.2), next: 1 })
          ]),
          pick('yes', 'Maybe. Give me your number and I will think about it.', 'bad', [
            out('Great! Here it is. I will wait for your message.', { rapport: 8, popularity: -1, xp: 0, result: 'neutral', note: 'Mixing work and dating can be risky for a bartender.' })
          ], { tip: 'Dating guests can cause trouble at work. Think carefully before you say yes.' }),
          pick('rude', 'No. Stop talking to me.', 'rude', [
            out('Wow. What a rude bartender!', { rapport: -20, emotion: 'angry', popularity: -1, result: 'failed' })
          ])
        ]
      },
      {
        guest: 'Come on. One drink. What is the harm?',
        choices: [
          pick('clear', 'I have given you my answer. Please respect it. Can I get you something else to drink?', 'good', [
            out('OK. Sorry. You are right.', { rapport: 2, xp: 6, result: 'solved' })
          ]),
          pick('maybe', 'Maybe another time.', 'bad', [
            out('Great! I will come back tomorrow.', { rapport: 4, result: 'neutral', note: '“Maybe” only makes it harder. Be clear and kind.' })
          ])
        ]
      }
    ],
    ignored: out('The guest smiles and goes back to their drink.', { result: 'neutral' })
  },
  {
    id: 'flirt-pushy', category: 'security', title: 'Unwanted attention', icon: '🚫', severity: 2, weight: 3, triggers: ['enjoying'], timeoutMin: 6,
    vocab: ['uncomfortable', 'stop', 'respect', 'boundary', 'security', 'touch'],
    applies: (context) => context.drunk >= 30,
    stages: [
      {
        guest: 'Hey, beautiful! Do not be shy. Give me your number. I will pay double for a smile. Come here, let me hold your hand.',
        choices: [
          pick('stop', 'Please stop. That makes me uncomfortable.', 'good', [
            out('Sorry, sorry. I was only joking. I will stop.', { rapport: -2, xp: 6, result: 'solved' }, { weight: behaves(.6) }),
            out('Do not be so serious!', { rapport: -6 }, { weight: misbehaves(.4), next: 1 })
          ], { tip: 'Say clearly: “Please stop. That makes me uncomfortable.” You do not have to be polite to someone who does not respect you.' }),
          pick('respect', 'I have asked you politely. Please respect my answer.', 'good', [
            out('OK, OK. I get it.', { rapport: -2, xp: 6, result: 'solved' }, { weight: behaves(.55) }),
            out('Hmm. I am just being friendly!', { rapport: -6 }, { weight: misbehaves(.45), next: 1 })
          ]),
          pick('security', 'If you do that again, I will call security.', 'ok', [
            out('All right! No need for that.', { rapport: -8, xp: 4, result: 'solved' }, { weight: .65 }),
            out('You will not do anything. You are just a bartender.', { rapport: -12, emotion: 'angry', spawn: 'threat-verbal' }, { weight: .35 })
          ]),
          pick('laugh', 'Come on, stop it. Do not be silly.', 'bad', [
            out('Come on, you like it!', { rapport: 4 }, { next: 1 })
          ], { tip: 'Laughing it off can make the guest think you are not serious.' })
        ]
      },
      {
        guest: 'You are no fun. Come on, one hug.',
        choices: [
          pick('leave', 'That is enough. I must ask you to leave the bar now.', 'good', [
            out('Fine! This bar is boring anyway!', { leave: true, xp: 8, popularity: 1, result: 'solved', note: 'You protected yourself and the bar.' }, { weight: .8 }),
            out('You can not throw me out!', { rapport: -10, spawn: 'threat-verbal' }, { weight: .2 })
          ]),
          pick('colleague', 'I am getting my colleague to talk to you. Please stay away from me.', 'good', [
            out('Whatever. I will leave you alone.', { xp: 7, rapport: -4, result: 'solved' })
          ]),
          pick('police', 'I am calling the police. Please step away now.', 'ok', [
            out('OK! OK! I am going!', { leave: true, xp: 7, popularity: 0, result: 'solved' })
          ])
        ]
      }
    ],
    ignored: out('The guest becomes more and more pushy before another guest steps in.', { rapport: -10, popularity: -2, result: 'failed', note: 'You did not set a boundary in time.' })
  },
  {
    id: 'flirt-drink-sent', category: 'good', title: 'A drink from a stranger', icon: '🍸', severity: 1, weight: 3, triggers: ['arrival', 'enjoying'], timeoutMin: 8,
    vocab: ['send', 'drink', 'stranger', 'from', 'decline', 'accept', 'consent'],
    stages: [
      {
        guest: 'Excuse me, could you send a drink to that person in the corner? Tell them it is from the guy at the end of the bar.',
        choices: [
          pick('ask', 'Of course. Let me ask them first if they would like a drink.', 'good', [
            out('Good idea. Thank you. That is polite.', { money: 8, rapport: 6, xp: 5, result: 'solved' })
          ], { tip: 'Always ask the person first. They have the right to say no.' }),
          pick('send', 'Of course. I will send it right now.', 'bad', [
            out('Thank you!', { money: 8, rapport: 4, result: 'neutral', note: 'The person in the corner did not look happy about it.' })
          ], { tip: 'Do not give a drink to someone who did not ask for it. Ask first.' }),
          pick('refuse', 'Sorry, I do not send drinks to strangers.', 'ok', [
            out('OK. That is fine. Another one for me, then.', { money: 5, rapport: 0, xp: 2, result: 'neutral' })
          ])
        ]
      }
    ],
    ignored: out('The guest sends the drink themselves.', { result: 'neutral' })
  }
];
