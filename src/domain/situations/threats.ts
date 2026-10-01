import { behaves, misbehaves, out, pick } from './helpers';
import type { SituationDef } from './types';

// Threats and danger. The lesson of every script is the same: stay calm, keep distance, protect people before things,
// and call the police (102) when anyone is in danger. Emergency numbers in this game: 101 fire, 102 police,
// 103 ambulance, 104 gas emergency, 112 the general emergency number.

export const THREAT_SITUATIONS: SituationDef[] = [
  {
    id: 'threat-verbal', category: 'threat', title: 'An angry threat', icon: '😡', severity: 2, weight: 3, triggers: ['enjoying'], timeoutMin: 6,
    vocab: ['threaten', 'calm down', 'police', 'security', 'step back', 'trouble'],
    applies: (context) => context.drunk >= 35 || context.emotion === 'angry',
    stages: [
      {
        guest: 'You think you can talk to me like that? You will regret this! I know people!',
        choices: [
          pick('calm', 'Sir, please calm down. I want to help you.', 'good', [
            out('Hmm… OK. I am sorry. I had a very bad day.', { rapport: 12, emotion: 'relaxed', xp: 6, result: 'solved' }, { weight: behaves(.6) }),
            out('Do not tell me to calm down!', { rapport: -6 }, { weight: misbehaves(.4), next: 1 })
          ], { tip: 'A quiet, kind voice calms most people. Do not shout back.' }),
          pick('lower', 'Please lower your voice, or I will have to ask you to leave.', 'ok', [
            out('Fine. Fine. I will be quiet.', { rapport: -2, xp: 3, result: 'solved' }, { weight: behaves(.55) }),
            out('Try to make me leave!', { rapport: -10 }, { weight: misbehaves(.45), next: 1 })
          ]),
          pick('police', 'I am calling the police now.', 'ok', [
            out('Wait, wait! There is no need for that. I am leaving.', { leave: true, popularity: 0, xp: 4, result: 'solved', note: 'The guest left before the police arrived.' }, { weight: .65 }),
            out('Go ahead! I do not care!', { rapport: -15 }, { weight: .35, next: 1 })
          ]),
          pick('challenge', 'Then come outside and say that again.', 'rude', [
            out('With pleasure! Let us go!', { popularity: -2, rapport: -25, breakage: 20, leave: true, result: 'failed', note: 'A fight outside hurt the bar’s reputation.' })
          ], { tip: 'Never accept a challenge to fight. It is dangerous and it ruins your bar’s reputation.' }),
          pick('ignore', 'I do not have time for this.', 'bad', [
            out('Do not turn your back on me!', { rapport: -12 }, { next: 1 })
          ])
        ]
      },
      {
        guest: 'I said do not tell me what to do! I will break this whole place!',
        choices: [
          pick('step', 'Please step back. I do not want any trouble. I am calling the police.', 'good', [
            out('You… you are serious. OK, OK. I am going.', { leave: true, xp: 7, popularity: 1, result: 'solved', note: 'The guest left when you called the police.' }, { weight: .75 }),
            out('Fine! Call them. They will not find me!', { leave: true, breakage: 12, popularity: 0, xp: 4, result: 'neutral' }, { weight: .25 })
          ]),
          pick('security', 'Sir, you have to leave now. Security will walk you out.', 'good', [
            out('All right. All right. I am going.', { leave: true, xp: 6, result: 'solved' }, { weight: .7 }),
            out('You can not make me!', { leave: true, breakage: 15, popularity: -1, result: 'neutral' }, { weight: .3 })
          ]),
          pick('sorry', 'I am sorry if I upset you. Let us start again, please.', 'ok', [
            out('Hmm. OK. Maybe I was too loud.', { rapport: 10, emotion: 'relaxed', xp: 5, result: 'solved' }, { weight: behaves(.5) }),
            out('Too late for sorry!', { breakage: 20, leave: true, popularity: -1, result: 'failed' }, { weight: misbehaves(.5) })
          ])
        ]
      }
    ],
    ignored: out('The guest throws a chair, shouts and storms out.', { breakage: 25, popularity: -2, leave: true, result: 'failed' })
  },
  {
    id: 'threat-follow', category: 'threat', title: 'A threat after work', icon: '🕶️', severity: 3, weight: 1, triggers: ['arrival'], timeoutMin: 8,
    vocab: ['threat', 'follow', 'report', 'dangerous', 'evidence', 'record'],
    stages: [
      {
        guest: 'I know where you live. I will wait for you after work. We will talk then.',
        choices: [
          pick('report', 'That is a threat. Please leave now, or I will call the police.', 'good', [
            out('Calm down. I was only joking!', { leave: true, xp: 8, popularity: 1, result: 'solved', note: 'You took the threat seriously.' }, { weight: .6 }),
            out('You will see. I will be waiting.', { leave: true, xp: 6, result: 'neutral', note: 'The guest left with a warning. Report it to the police.' }, { weight: .4 })
          ], { tip: 'Take every threat seriously. Say clearly that it is a threat.' }),
          pick('police', 'I am going to report this to the police. Please leave the bar.', 'good', [
            out('You do that. I am not afraid.', { leave: true, xp: 8, popularity: 1, result: 'solved' })
          ]),
          pick('afraid', 'Please do not say that. I am afraid.', 'ok', [
            out('Good. You should be.', { rapport: -20, emotion: 'angry' }, { weight: .5, next: 0 }),
            out('I am sorry. I did not want to scare you.', { rapport: 6, leave: true, result: 'neutral' }, { weight: .5 })
          ]),
          pick('talk', 'Maybe we can talk after work.', 'bad', [
            out('Now you are talking. See you later.', { leave: true, popularity: -2, result: 'failed', note: 'Never meet a person who threatened you.' })
          ], { tip: 'Never meet a person who has threatened you. Ask for help instead.' })
        ]
      }
    ],
    ignored: out('The guest stares at you for a long time and leaves slowly.', { popularity: -1, leave: true, result: 'neutral' })
  },
  {
    id: 'threat-robbery', category: 'threat', title: 'A robbery', icon: '🔪', severity: 3, weight: 1, triggers: ['arrival'], timeoutMin: 4,
    vocab: ['robbery', 'money', 'cash register', 'alarm', 'police', 'stay calm', 'hurt'],
    stages: [
      {
        guest: 'Give me all the money from the register. Now! Do not do anything stupid!',
        choices: [
          pick('comply', 'OK. Please stay calm. I will give you the money. Nobody wants to get hurt.', 'good', [
            out('Quick! Put it in the bag. Do not call anyone.', { money: -40, xp: 8, popularity: 0, leave: true, result: 'neutral', note: 'Money can be replaced. People can not.' })
          ], { tip: 'In a robbery, give the money. Your safety and your guests’ safety come first. Call the police after the robber has left.' }),
          pick('alarm', 'One moment. I need to open the register.', 'good', [
            out('Hurry up! Why are you so slow?', { xp: 4 }, { next: 1 })
          ]),
          pick('refuse', 'No! I will not give you anything. Get out!', 'bad', [
            out('Then I will hurt you! Give me the money!', { rapport: -20, xp: 0 }, { weight: .7, next: 1 }),
            out('Fine, I am leaving! Nobody is worth this!', { leave: true, popularity: 1, xp: 5, result: 'solved' }, { weight: .3 })
          ], { tip: 'Do not resist a robber. It is not worth the risk.' })
        ]
      },
      {
        guest: 'Open it! Now! Give me the money, or somebody gets hurt!',
        choices: [
          pick('give', 'Here is the money. Please take it and go. Nobody will stop you.', 'good', [
            out('Smart. Do not call the police for ten minutes.', { money: -40, xp: 8, leave: true, result: 'neutral', note: 'The robber left. Now call 102.' })
          ]),
          pick('silent', 'Here is the money. Please do not hurt anyone.', 'good', [
            out('Quiet! Keep your hands where I can see them. OK, I am going.', { money: -40, xp: 9, popularity: 0, leave: true, result: 'neutral', note: 'Press the alarm and call 102 when it is safe.' })
          ])
        ]
      }
    ],
    ignored: out('The robber grabs some cash from the register and runs out.', { money: -60, popularity: -1, leave: true, result: 'failed' })
  },
  {
    id: 'security-stranger', category: 'security', title: 'A strange person', icon: '👁️', severity: 2, weight: 3, triggers: ['arrival', 'enjoying'], timeoutMin: 8,
    vocab: ['strange', 'suspicious', 'stare', 'security', 'polite', 'leave'],
    stages: [
      {
        guest: 'Excuse me. That man by the door keeps staring at us. He looks strange to me. I feel a bit afraid.',
        choices: [
          pick('talk', 'Thank you for telling me. I will talk to him politely.', 'good', [
            out('Thank you. I feel safer now.', { rapport: 8, xp: 5 }, { weight: .5, next: 1 }),
            out('Good. He looks like a tourist who is lost, maybe.', { rapport: 4, xp: 4, result: 'solved' }, { weight: .5 })
          ]),
          pick('security', 'I will ask security to watch him.', 'good', [
            out('Great idea. Thank you.', { rapport: 6, xp: 5, result: 'solved', note: 'The security guard kept an eye on the stranger.' })
          ]),
          pick('police', 'If he does anything strange, I will call the police.', 'ok', [
            out('Thank you. Please do.', { rapport: 4, xp: 3, result: 'solved' })
          ]),
          pick('nothing', 'Do not worry. It is nothing.', 'bad', [
            out('Hmm. OK. If you say so…', { rapport: -8, popularity: -1, result: 'failed' })
          ], { tip: 'Take a guest’s fear seriously, even when you think it is nothing.' })
        ]
      },
      {
        guest: 'I just walked up to him. He said he is waiting for a friend, but he did not order anything.',
        choices: [
          pick('order', 'Would you like to order something, sir? Or can I help you with something else?', 'good', [
            out('Um, yes. A coffee, please. I am sorry, I was early for a meeting.', { money: 3, xp: 6, rapport: 6, result: 'solved' })
          ]),
          pick('ask-leave', 'If you are not ordering, I must ask you to wait outside, please.', 'ok', [
            out('OK. Sorry. I did not mean to cause trouble.', { leave: true, xp: 4, result: 'solved' })
          ])
        ]
      }
    ],
    ignored: out('The guest gets nervous and leaves.', { rapport: -10, popularity: -1, leave: true, result: 'failed' })
  },
  {
    id: 'danger-follow', category: 'security', title: 'A guest in danger', icon: '🆘', severity: 3, weight: 2, triggers: ['arrival', 'enjoying'], timeoutMin: 6,
    vocab: ['follow', 'safe', 'help', 'danger', 'taxi', 'police', 'behind the bar'],
    applies: (context) => context.emotion === 'nervous' || context.emotion === 'lonely' || context.random() < .4,
    stages: [
      {
        guest: 'Please help me. A man has been following me since the bus stop. He is outside now. I am scared.',
        choices: [
          pick('stay', 'Of course. Please stay here, behind the bar, with me.', 'good', [
            out('Thank you. Thank you so much. I feel safer here.', { rapport: 14, xp: 6 }, { next: 1 })
          ], { tip: 'First make the person feel safe. Then decide what to do.' }),
          pick('police', 'I will call the police right now. You are safe here.', 'good', [
            out('Yes, please. Thank you.', { rapport: 12, xp: 7, popularity: 1, result: 'solved', note: 'The police took the man away.' })
          ]),
          pick('taxi', 'Would you like me to call you a taxi? I will walk you to the door.', 'ok', [
            out('Yes, please. But please stay with me until it comes.', { rapport: 8, xp: 5 }, { next: 1 })
          ]),
          pick('talk', 'I will go outside and talk to him.', 'ok', [
            out('Please be careful. He looks angry.', { rapport: 4, xp: 3 }, { weight: .7, next: 1 }),
            out('Please do not. He might be dangerous!', { rapport: 2 }, { weight: .3, next: 1 })
          ]),
          pick('joke', 'Maybe he just likes you.', 'rude', [
            out('That is not funny! I thought you would help me!', { rapport: -25, leave: true, popularity: -3, result: 'failed' })
          ], { tip: 'Never joke when someone says they are in danger.' })
        ]
      },
      {
        guest: 'He is standing outside the window and looking at me. What should we do?',
        choices: [
          pick('call', 'Let us call the police. They will come quickly. You can wait here until they come.', 'good', [
            out('Thank you. I was too scared to call myself.', { rapport: 12, xp: 8, popularity: 1, leave: true, result: 'solved', note: 'The police arrived and the guest got home safely.' })
          ]),
          pick('friend', 'Is there a friend who can come and pick you up?', 'good', [
            out('Yes, my brother. He lives nearby. I will call him now.', { rapport: 8, xp: 6, leave: true, result: 'solved' })
          ]),
          pick('go', 'I think you should go out and run home.', 'bad', [
            out('Alone? No! That is dangerous!', { rapport: -15, popularity: -1, result: 'failed' })
          ])
        ]
      }
    ],
    ignored: out('The guest runs out of the bar, scared.', { rapport: -25, popularity: -3, leave: true, result: 'failed', note: 'A guest who asked for help was left alone.' })
  },
  {
    id: 'security-bag', category: 'security', title: 'A bag left alone', icon: '🎒', severity: 2, weight: 2, triggers: ['arrival', 'enjoying'], timeoutMin: 8,
    vocab: ['bag', 'left', 'suspicious', 'lost property', 'owner', 'police'],
    setup: ({ random }) => ({ _harmless: random() < .85 }),
    stages: [
      {
        guest: 'Excuse me, someone left a bag under that table. It has been there for an hour, and nobody came for it.',
        choices: [
          pick('ask', 'Thank you. Please do not touch it. Whose bag is this? Is the owner here?', 'good', [
            out('Nobody answered. I think the owner is gone.', { xp: 4 }, { next: 1 })
          ]),
          pick('open', 'I will open it and look inside.', 'bad', [
            out('Careful! You should not touch it!', { rapport: -3 }, { weight: .3, next: 1 }),
            out('Oh, it is just a jacket and a phone. Lucky!', { xp: 2, popularity: 0, result: 'neutral', note: 'You were lucky. Never open a bag nobody claims.' }, { weight: (c) => (c.data._harmless ? .7 : 0) })
          ], { tip: 'Do not open a suspicious bag. Keep people away and call the police.' }),
          pick('police', 'Everyone, please move away from that table. I am calling the police.', 'good', [
            out('Good thinking. Better safe than sorry.', { xp: 8, popularity: 1, result: 'solved', note: 'The police checked the bag. It was only lost property.' })
          ])
        ]
      },
      {
        guest: 'Nobody has asked about it. What should we do now?',
        choices: [
          pick('call', 'I will call the police. They know what to do. Please keep everybody away from it.', 'good', [
            out('Good idea. Thank you for being careful.', { xp: 8, popularity: 1, result: 'solved', note: 'The police checked the bag. It was only lost property.' })
          ]),
          pick('lost', 'We will keep it as lost property until the owner comes.', 'ok', [
            out('OK. I hope the owner comes soon.', { xp: 3, result: 'neutral' }, { weight: (c) => (c.data._harmless ? 1 : .1) }),
            out('Are you sure it is safe to keep it here?', { rapport: -4, popularity: -1, result: 'failed' }, { weight: (c) => (c.data._harmless ? 0 : .9) })
          ])
        ]
      }
    ],
    ignored: out('The guests start to feel uneasy, and some leave.', { popularity: -1, rapport: -6, result: 'failed' })
  }
];
