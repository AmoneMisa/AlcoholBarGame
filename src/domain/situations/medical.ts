import { out, pick } from './helpers';
import type { SituationDef } from './types';

// First aid at the bar. These scripts teach common situations and the English to ask, reassure and call for help
// (103 is the ambulance in this game). They are a game, not medical training: in real life, call the emergency
// number early and follow the operator's instructions.

export const MEDICAL_SITUATIONS: SituationDef[] = [
  {
    id: 'med-headache', category: 'medical', title: 'A bad headache', icon: '🤕', severity: 1, weight: 5, triggers: ['arrival', 'enjoying'], timeoutMin: 8,
    vocab: ['headache', 'painkiller', 'pill', 'allergic', 'rest', 'water', 'quiet'],
    setup: ({ random }) => ({ _allergic: random() < .2 }),
    stages: [
      {
        guest: 'Ugh… I have a terrible headache. My head is pounding. Do you have a painkiller?',
        choices: [
          pick('ask', 'I am sorry to hear that. Where does it hurt? How long have you had it?', 'good', [
            out('It hurts here, at the front. Since this morning. It is not the worst headache of my life, just a strong one.', { xp: 4 }, { next: 1 })
          ], { tip: 'Ask questions first: where, how strong, how long. A sudden, terrible headache needs a doctor.' }),
          pick('pill', 'Here is a pill for you.', 'bad', [
            out('Thanks! Oh wait… I am allergic to that medicine! My lips feel strange!', { rapport: -10, spawn: 'med-allergy' }, { weight: (c) => (c.data._allergic ? 1 : 0) }),
            out('Thank you. That helps, I hope.', { xp: 1, result: 'neutral' }, { weight: (c) => (c.data._allergic ? 0 : 1) })
          ], { tip: 'Never give medicine without asking about allergies first.' }),
          pick('drink', 'Have a drink. It will help you relax.', 'rude', [
            out('Alcohol makes it worse! That is a bad idea!', { rapport: -12, popularity: -1, result: 'failed' })
          ])
        ]
      },
      {
        guest: 'I do not have any serious illness, I think. I just need something for the pain.',
        choices: [
          pick('allergy', 'Are you allergic to any medicine? Do you take any other tablets?', 'good', [
            out('No allergies. I take nothing else. Thank you for asking.', { xp: 5 }, { weight: (c) => (c.data._allergic ? 0 : 1), next: 2 }),
            out('Yes! I am allergic to that kind of painkiller. Good that you asked!', { xp: 8, rapport: 6 }, { weight: (c) => (c.data._allergic ? 1 : 0), next: 2 })
          ]),
          pick('water', 'Please drink a glass of water and rest in a quiet place for a while.', 'good', [
            out('That is kind. Thank you. I will sit quietly.', { rapport: 8, xp: 6, drunk: -8, result: 'solved' })
          ])
        ]
      },
      {
        guest: 'So… what can you give me?',
        choices: [
          pick('safe-pill', 'We have a painkiller that is safe for you. Please take it with water.', 'good', [
            out('Thank you so much. I feel better already.', { rapport: 12, xp: 7, popularity: 1, drunk: -6, result: 'solved' })
          ], { requires: (c) => !c.data._allergic }),
          pick('no-pill', 'I can not give you that one, but I can give you cold water and a quiet corner.', 'good', [
            out('You are right. Thank you for being careful.', { rapport: 10, xp: 7, popularity: 1, drunk: -8, result: 'solved' })
          ]),
          pick('doctor', 'If it does not get better, please see a doctor.', 'good', [
            out('I will. Thank you for your help.', { rapport: 8, xp: 5, result: 'solved' })
          ])
        ]
      }
    ],
    ignored: out('The guest holds their head and leaves early.', { rapport: -10, leave: true, result: 'failed' })
  },
  {
    id: 'med-chest', category: 'medical', title: 'Chest pain', icon: '💔', severity: 3, weight: 1, triggers: ['arrival', 'enjoying'], timeoutMin: 5,
    vocab: ['chest', 'pain', 'heart', 'ambulance', 'breathe', 'sit down', 'dizzy', '103'],
    stages: [
      {
        guest: 'I have a strong pain in my chest. It feels like a heavy weight. And my left arm hurts too. I feel dizzy…',
        choices: [
          pick('call', 'Please sit down. I am calling an ambulance on 103 right now.', 'good', [
            out('Thank you… please hurry…', { xp: 8 }, { next: 1 })
          ], { tip: 'Chest pain with a heavy feeling is an emergency. Call 103 immediately.' }),
          pick('ask', 'Please sit down. Where is the pain? Do you have heart problems or medicine for your heart?', 'good', [
            out('I take a medicine for my heart. It is in my bag. The pain is getting worse.', { xp: 6 }, { next: 1 })
          ]),
          pick('water', 'Drink some water and walk a little. It will pass.', 'bad', [
            out('I can not walk… it is getting worse!', { rapport: -10, popularity: -2 }, { next: 1 })
          ], { tip: 'A guest with chest pain must sit or lie down, not walk.' }),
          pick('alcohol', 'A strong drink will help you relax.', 'rude', [
            out('Please… no… I think I need a doctor…', { rapport: -20, popularity: -3 }, { next: 1 })
          ])
        ]
      },
      {
        guest: 'The pain is very strong. I can hardly breathe. Please help me.',
        choices: [
          pick('ambulance', 'Stay calm and breathe slowly. The ambulance is on its way. I will stay with you.', 'good', [
            out('Thank you… I feel a little less afraid.', { xp: 8, popularity: 1, leave: true, result: 'solved', note: 'The ambulance took the guest to hospital. They recovered well.' })
          ]),
          pick('collar', 'I will loosen your collar. Please sit with your back against the wall.', 'good', [
            out('That is better. Please do not leave me.', { xp: 7 }, { next: 2 })
          ]),
          pick('medicine', 'Is that your medicine in the bag? Let me bring it to you.', 'good', [
            out('Yes, please. One tablet under my tongue.', { xp: 7 }, { next: 2 })
          ]),
          pick('leave', 'I have to go and serve other guests.', 'rude', [
            out('Please…', { rapport: -30, popularity: -5, leave: true, result: 'failed', note: 'You left a guest in an emergency.' })
          ])
        ]
      },
      {
        guest: 'I think the ambulance is not here yet. Please call again.',
        choices: [
          pick('call-again', 'I will call 103 again and tell them it is getting worse. Please stay with me.', 'good', [
            out('They say they are two minutes away. Thank you.', { xp: 9, popularity: 2, leave: true, result: 'solved', note: 'The ambulance took the guest to hospital. They recovered well.' })
          ])
        ]
      }
    ],
    ignored: out('Another guest calls the ambulance. The guest is taken to hospital.', { popularity: -3, leave: true, result: 'failed', note: 'You were too slow in an emergency.' })
  },
  {
    id: 'med-faint', category: 'medical', title: 'A guest faints', icon: '😵', severity: 2, weight: 2, triggers: ['enjoying'], timeoutMin: 5,
    vocab: ['faint', 'unconscious', 'breathe', 'lie down', 'legs', 'wake up', 'ambulance'],
    stages: [
      {
        guest: 'Oh no! Someone fell off a stool! They are not moving… their eyes are closed!',
        choices: [
          pick('check', 'Please step back. Can you hear me? Open your eyes. Are you breathing?', 'good', [
            out('They are breathing, but they are very pale. They do not answer.', { xp: 5 }, { next: 1 })
          ], { tip: 'Check if the person answers and breathes.' }),
          pick('ambulance', 'Someone call 103 now, please! I will check their breathing.', 'good', [
            out('I am calling now! They are breathing, but they do not wake up.', { xp: 6 }, { next: 1 })
          ]),
          pick('water', 'Throw some water on their face.', 'bad', [
            out('That does not help… they still do not wake up.', { rapport: -6 }, { next: 1 })
          ])
        ]
      },
      {
        guest: 'They are breathing. What do we do now?',
        choices: [
          pick('legs', 'Please lie them down and lift their legs a little. Loosen their collar.', 'good', [
            out('Their color is coming back… They are waking up!', { xp: 7, rapport: 8 }, { next: 2 })
          ]),
          pick('recovery', 'Turn them gently onto their side, so they can breathe safely. Keep their head back.', 'good', [
            out('OK. They are waking up slowly.', { xp: 7, rapport: 8 }, { next: 2 })
          ]),
          pick('sit', 'Sit them up in a chair.', 'bad', [
            out('They are falling again!', { rapport: -6 }, { next: 1 })
          ])
        ]
      },
      {
        guest: 'I… I am sorry. What happened? I feel very weak and my head is spinning.',
        choices: [
          pick('stay', 'You fainted. Stay lying down for a few minutes. Here is some water. I will call an ambulance to check you.', 'good', [
            out('Thank you. I did not eat all day. I feel embarrassed.', { xp: 8, rapport: 12, popularity: 1, drunk: -10, result: 'solved', note: 'The paramedics checked the guest. They were fine.' })
          ]),
          pick('home', 'You can go home now.', 'bad', [
            out('Alone? I can hardly stand!', { rapport: -8, popularity: -1, result: 'failed' })
          ])
        ]
      }
    ],
    ignored: out('Another guest helps. Everyone looks at you.', { rapport: -10, popularity: -2, result: 'failed' })
  },
  {
    id: 'med-cut', category: 'medical', title: 'A cut hand', icon: '🩹', severity: 2, weight: 3, triggers: ['enjoying'], timeoutMin: 6,
    vocab: ['cut', 'blood', 'bandage', 'plaster', 'tourniquet', 'pressure', 'first aid kit', 'wound'],
    setup: ({ random }) => ({ _severe: random() < .2 }),
    stages: [
      {
        guest: 'Ouch! I cut my hand on broken glass. There is blood! It hurts!',
        choices: [
          pick('pressure', 'Please sit down. Press this clean cloth on the cut firmly. Do not take it off.', 'good', [
            out('OK. It is bleeding a lot, but I am pressing hard.', { xp: 5 }, { weight: (c) => (c.data._severe ? 1 : 0), next: 1 }),
            out('OK. It is bleeding less now.', { xp: 5 }, { weight: (c) => (c.data._severe ? 0 : 1), next: 2 })
          ], { tip: 'Press firmly on a bleeding wound with a clean cloth.' }),
          pick('look', 'Let me look. Where is the first aid kit? I will wash my hands first.', 'good', [
            out('It is under the bar. Thank you for being careful.', { xp: 4 }, { next: 2 })
          ]),
          pick('tourniquet', 'I will put a tourniquet on your arm.', 'bad', [
            out('A tourniquet? For a small cut? That hurts!', { rapport: -8 }, { weight: (c) => (c.data._severe ? 0 : 1), next: 2 }),
            out('It is bleeding too much! Please call for help too!', { xp: 3 }, { weight: (c) => (c.data._severe ? 1 : 0), next: 1 })
          ], { tip: 'A tourniquet is only for very heavy bleeding that does not stop with pressure. Call 103.' }),
          pick('ignore', 'It is only a small cut. Wash it in the toilet.', 'bad', [
            out('Is that all you do? That is not good enough.', { rapport: -10, popularity: -1, result: 'failed' })
          ])
        ]
      },
      {
        guest: 'The blood is not stopping. It is soaking through the cloth! I feel weak!',
        choices: [
          pick('ambulance', 'Keep pressing. Someone call 103 now. Raise your arm above your heart.', 'good', [
            out('The ambulance is coming. Thank you for staying calm.', { xp: 9, popularity: 1, leave: true, result: 'solved', note: 'The paramedics stopped the bleeding.' })
          ]),
          pick('tourniquet', 'The bleeding does not stop. I will put a tourniquet above the wound and call 103.', 'good', [
            out('It is tight… but the bleeding is slowing. Please call quickly!', { xp: 9, popularity: 1, leave: true, result: 'solved', note: 'The paramedics took over. The tourniquet saved a lot of blood.' })
          ], { tip: 'Use a tourniquet only for severe bleeding on an arm or leg that does not stop with pressure.' }),
          pick('wait', 'Let us wait a few more minutes.', 'bad', [
            out('I feel faint… please…', { rapport: -15, popularity: -3, result: 'failed' })
          ])
        ]
      },
      {
        guest: 'It has almost stopped bleeding. What should I do next?',
        choices: [
          pick('clean', 'Let me clean the cut with clean water, put on an antiseptic and a plaster.', 'good', [
            out('Thank you so much. That feels much better.', { xp: 7, rapport: 10, popularity: 1, leave: false, result: 'solved' })
          ]),
          pick('bandage', 'I will wrap a bandage around your hand. Please see a doctor if it hurts tomorrow.', 'good', [
            out('You are a very good bartender. Thank you!', { xp: 7, rapport: 12, popularity: 1, result: 'solved' })
          ])
        ]
      }
    ],
    ignored: out('The guest wraps their hand in a napkin and leaves, angry.', { rapport: -15, popularity: -2, leave: true, result: 'failed' })
  },
  {
    id: 'med-burn', category: 'medical', title: 'A burn', icon: '🔥', severity: 2, weight: 2, triggers: ['enjoying'], timeoutMin: 6,
    vocab: ['burn', 'hot', 'cool water', 'blister', 'cover', 'ice'],
    stages: [
      {
        guest: 'Ow! A hot coffee spilled on my hand! It burns so much!',
        choices: [
          pick('water', 'Quick, put your hand under cool running water for ten minutes.', 'good', [
            out('That feels so much better. It stopped burning.', { xp: 7, rapport: 8 }, { next: 1 })
          ], { tip: 'Cool a burn with running water for about ten minutes. Not ice.' }),
          pick('ice', 'Put some ice on it!', 'bad', [
            out('Ow! That hurts even more!', { rapport: -5 }, { next: 1 })
          ], { tip: 'Do not use ice or butter on a burn. Use cool running water.' }),
          pick('butter', 'My grandmother says butter helps.', 'bad', [
            out('Butter? Really? That sounds wrong…', { rapport: -8, popularity: -1 }, { next: 1 })
          ])
        ]
      },
      {
        guest: 'It is red and I see a small blister. What should I do now?',
        choices: [
          pick('cover', 'Do not pop the blister. Cover it with a clean cloth. If it is big, please see a doctor.', 'good', [
            out('Thank you for your help. I feel better.', { xp: 7, rapport: 10, popularity: 1, result: 'solved' })
          ]),
          pick('ambulance', 'The burn is big. I will call 103 to be safe.', 'ok', [
            out('Maybe that is a good idea. Thank you.', { xp: 5, leave: true, result: 'solved' })
          ])
        ]
      }
    ],
    ignored: out('The guest runs to the bathroom and comes back angry.', { rapport: -10, result: 'failed' })
  },
  {
    id: 'med-nausea', category: 'medical', title: 'Feeling sick', icon: '🤢', severity: 1, weight: 4, triggers: ['enjoying'], timeoutMin: 6,
    vocab: ['sick', 'nausea', 'vomit', 'bucket', 'fresh air', 'toilet', 'sip'],
    applies: (context) => context.drunk >= 40,
    stages: [
      {
        guest: 'I do not feel well… I think I am going to be sick. Everything is spinning.',
        choices: [
          pick('air', 'Come with me. Let us get some fresh air, and the toilet is right there if you need it.', 'good', [
            out('Thank you. I made it just in time!', { rapport: 8, xp: 5, drunk: -10, result: 'solved' })
          ]),
          pick('bucket', 'Sit here. I will bring you a bucket and some water. Take small sips.', 'good', [
            out('You are very kind. I am so sorry for the trouble.', { rapport: 10, xp: 5, drunk: -8, result: 'solved' })
          ]),
          pick('quick', 'Not on my floor! Go outside, now!', 'bad', [
            out('Too late… I am so sorry! Oh no…', { breakage: 6, rapport: -10, drunk: -10, result: 'failed', note: 'You had to clean the floor.' })
          ])
        ]
      }
    ],
    ignored: out('The guest is sick on the floor. You must clean it up.', { breakage: 8, rapport: -8, drunk: -15, result: 'failed' })
  },
  {
    id: 'med-allergy', category: 'medical', title: 'An allergic reaction', icon: '🤧', severity: 3, weight: 1, triggers: ['enjoying'], timeoutMin: 5,
    vocab: ['allergy', 'allergic', 'swelling', 'rash', 'breathe', 'epinephrine', 'ambulance', 'nuts'],
    stages: [
      {
        guest: 'My lips and my face feel strange… they are swelling! It is hard to breathe. I think I ate nuts!',
        choices: [
          pick('call', 'Sit down. I am calling 103 now. Do you have an allergy pen with you?', 'good', [
            out('Yes, in my bag! Please give it to me! Hurry!', { xp: 8 }, { next: 1 })
          ], { tip: 'Swelling and trouble breathing is an emergency. Call 103 at once and ask about an allergy pen.' }),
          pick('water', 'Drink some water. It will help.', 'bad', [
            out('I can not swallow! I am getting worse!', { rapport: -10, popularity: -2 }, { next: 1 })
          ]),
          pick('pill', 'Take this painkiller. It might help.', 'bad', [
            out('That is not an allergy medicine!', { rapport: -10, popularity: -2 }, { next: 1 })
          ])
        ]
      },
      {
        guest: 'Please… the pen is in my bag… I can not breathe well.',
        choices: [
          pick('pen', 'Here is the pen. Please use it on your thigh, as your doctor showed you. The ambulance is coming.', 'good', [
            out('It is working… I can breathe a little better. Thank you!', { xp: 10, popularity: 2, leave: true, result: 'solved', note: 'The paramedics treated the guest. They recovered.' })
          ]),
          pick('help', 'I will help you use the pen. Stay calm. Stay with me. The ambulance is coming.', 'good', [
            out('Thank you. Thank you.', { xp: 10, popularity: 2, leave: true, result: 'solved', note: 'The paramedics treated the guest. They recovered.' })
          ])
        ]
      }
    ],
    ignored: out('Another guest finds the pen and calls the ambulance.', { popularity: -3, leave: true, result: 'failed' })
  },
  {
    id: 'med-choke', category: 'medical', title: 'Choking', icon: '😮', severity: 3, weight: 1, triggers: ['enjoying'], timeoutMin: 3,
    vocab: ['choke', 'cough', 'back blows', 'Heimlich', 'breathe', 'ambulance'],
    stages: [
      {
        guest: 'Help! Someone is choking on a peanut! They are holding their throat and can not speak!',
        choices: [
          pick('cough', 'Can you cough? Try to cough hard. I am here.', 'good', [
            out('They are coughing a little… but it is not coming out!', { xp: 4 }, { next: 1 })
          ]),
          pick('blows', 'I will give you five firm blows on the back, between the shoulders.', 'good', [
            out('It is a little better, but the peanut is still stuck!', { xp: 6 }, { next: 1 })
          ]),
          pick('water', 'Drink some water.', 'bad', [
            out('They can not swallow! It is not working!', { rapport: -8, popularity: -2 }, { next: 1 })
          ])
        ]
      },
      {
        guest: 'They are turning pale. They can not breathe. What now?',
        choices: [
          pick('thrusts', 'I will give you five quick pushes into your belly, above the navel. Someone call 103!', 'good', [
            out('It came out! They are breathing! Thank you!', { xp: 12, popularity: 2, rapport: 14, result: 'solved', note: 'The guest was breathing again. A doctor checked them.' })
          ], { tip: 'If back blows do not work: five abdominal thrusts, and call 103.' }),
          pick('wait', 'Let us wait. Maybe it will come out.', 'bad', [
            out('They are not breathing! Do something!', { rapport: -20, popularity: -5, result: 'failed' })
          ])
        ]
      }
    ],
    ignored: out('A guest who is a nurse rushes in and saves the person.', { popularity: -3, result: 'failed', note: 'You were too slow to help.' })
  },
  {
    id: 'med-panic', category: 'medical', title: 'A panic attack', icon: '😰', severity: 2, weight: 2, triggers: ['arrival', 'enjoying'], timeoutMin: 6,
    vocab: ['panic', 'anxious', 'breathe', 'slowly', 'quiet', 'safe', 'count'],
    applies: (context) => context.emotion === 'nervous' || context.emotion === 'upset',
    stages: [
      {
        guest: 'My heart is beating so fast… I can not breathe… I think I am going to die! Everything feels unreal!',
        choices: [
          pick('breathe', 'You are safe. I am here. Breathe in slowly with me… and out… in… and out.', 'good', [
            out('I am trying… it is a little better…', { xp: 5, rapport: 8 }, { next: 1 })
          ], { tip: 'Use a calm voice, slow words, and breathe together.' }),
          pick('quiet', 'Come with me to a quiet place. Sit down. I will bring you some water.', 'good', [
            out('Thank you. It is too loud here.', { xp: 5, rapport: 8 }, { next: 1 })
          ]),
          pick('calm', 'Just calm down. Nothing bad will happen.', 'bad', [
            out('Do not say that! It makes it worse!', { rapport: -8 }, { next: 1 })
          ], { tip: '“Calm down” does not help. Say “I am here” and breathe slowly with the person.' })
        ]
      },
      {
        guest: 'It is getting a little better. But I am still shaking.',
        choices: [
          pick('count', 'Let us count together. Tell me five things you can see in this room.', 'good', [
            out('A lamp… a bottle… your hands… the door… a glass. Thank you.', { xp: 7, rapport: 12, popularity: 1, result: 'solved' })
          ]),
          pick('friend', 'Is there somebody I can call for you? You do not have to be alone.', 'good', [
            out('Yes. My sister. Thank you for being so kind.', { xp: 6, rapport: 12, popularity: 1, result: 'solved' })
          ])
        ]
      }
    ],
    ignored: out('The guest hurries out, shaking.', { rapport: -10, leave: true, result: 'failed' })
  },
  {
    id: 'med-too-drunk', category: 'medical', title: 'Too drunk to wake up', icon: '🥴', severity: 3, weight: 1, triggers: ['enjoying'], timeoutMin: 5,
    vocab: ['unconscious', 'alcohol poisoning', 'recovery position', 'breathe', 'ambulance', 'sleep'],
    applies: (context) => context.drunk >= 80,
    stages: [
      {
        guest: 'This guest is sleeping at the bar and I can not wake them up. They are very pale and their breathing is slow!',
        choices: [
          pick('check', 'Can you hear me? Open your eyes! I am calling 103 now.', 'good', [
            out('They do not wake up. Please hurry.', { xp: 6 }, { next: 1 })
          ], { tip: 'A guest who cannot be woken after a lot of alcohol needs an ambulance. Do not let them “sleep it off”.' }),
          pick('sleep', 'Let them sleep it off. They will be fine.', 'bad', [
            out('But they do not look well…', { rapport: -10, popularity: -3 }, { next: 1 })
          ], { tip: 'Do not leave a guest who cannot be woken.' })
        ]
      },
      {
        guest: 'They are breathing slowly. What should we do while we wait?',
        choices: [
          pick('recovery', 'Please turn them onto their side and keep their head tilted back. I will stay with them until the ambulance comes.', 'good', [
            out('The paramedics are here. You did everything right.', { xp: 10, popularity: 2, leave: true, result: 'solved', note: 'The guest was taken to hospital and recovered.' })
          ]),
          pick('water', 'Pour some water into their mouth.', 'bad', [
            out('No! They can choke!', { rapport: -10, popularity: -2, result: 'failed' })
          ])
        ]
      }
    ],
    ignored: out('Another guest calls the ambulance. You should have acted faster.', { popularity: -4, leave: true, result: 'failed' })
  }
];
