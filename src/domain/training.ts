// The training academy: one short guide and (where it makes sense) one risk-free practice for every core mechanic.
// Practice guests are marked "practice": they pay nothing, give no crystals, and never bring random problems.
// A lesson is finished when the player has done everything it asks for (the "needs"); the first time brings a small reward.

export type TrainingEvent = 'asked' | 'confirmed' | 'served' | 'water' | 'ashtray' | 'offered' | 'situationSolved' | 'bought' | 'toppedUp';

export interface GuideStep { title: string; text: string }

export interface TrainingModule {
  id: string;
  icon: string;
  title: string;
  /** One line shown in the list. */
  summary: string;
  /** What the player learns, step by step. */
  guide: GuideStep[];
  /** Practice with a guest (or without one for "market"); lessons without practice are finished with "Got it". */
  practice?: { guest: 'talk' | 'mix' | 'care' | 'offer' | 'situation' | 'none'; needs: TrainingEvent[]; hint: string };
  /** The screen that shows the real thing. */
  goto?: { view: string; label: string };
}

export const NEED_LABEL: Record<TrainingEvent, string> = {
  asked: 'Ask the guest a question in English',
  confirmed: 'Name the right drink so the guest orders it',
  served: 'Make the drink and serve it',
  water: 'Give the guest a glass of water',
  ashtray: 'Give the guest an ashtray',
  offered: 'Offer the guest something and make the offer',
  situationSolved: 'Solve the problem with the right words',
  bought: 'Buy something in the market',
  toppedUp: 'Top up the low stock with one tap'
};

export const TRAINING_REWARD = { xp: 50, crystals: 2 };

export const TRAINING_MODULES: TrainingModule[] = [
  {
    id: 'talk', icon: '💬', title: 'Talk and find the order', summary: 'Ask questions, read the clues, name the drink.',
    guide: [
      { title: 'Open the conversation', text: 'Tap a guest. The guest says hello. You answer in English, by choosing a suggested sentence or typing your own.' },
      { title: 'Ask about taste', text: 'Ask "Do you like sweet drinks?" or "Do you want something strong?" Each answer is a clue. The clue board remembers what the guest likes and does not like.' },
      { title: 'Name the drink', text: 'When the clues fit, say "Would you like a Mojito?" If you are right, the guest orders it. If you are wrong, the guest says why, and that is a new clue.' },
      { title: 'Your English counts', text: 'The checker shows mistakes in colour. Correct English earns bonus XP and crystals. The speaker button reads a sentence, the microphone checks your pronunciation.' }
    ],
    practice: { guest: 'talk', needs: ['asked', 'confirmed'], hint: 'A practice guest sits at the bar. Tap the guest, ask a question, then name the drink.' }
  },
  {
    id: 'mix', icon: '🍸', title: 'Mix and serve', summary: 'Pour, shake and serve the drink.',
    guide: [
      { title: 'Know the recipe', text: 'Open the recipe book to see the ingredients and amounts. Known recipes show a full list.' },
      { title: 'Build the drink', text: 'Drag a bottle to the glass, or tap an ingredient, to pour. Use the fresh picker for fruit, mint and ice. Pour the right amount: too little or too much costs points.' },
      { title: 'Shake and serve', text: 'Shake when the recipe asks for it, then press Serve. A good drink brings coins, a tip (sometimes) and experience.' },
      { title: 'Upgrade your recipes', text: 'Every recipe you make well can be upgraded in the recipe book. Higher levels earn more per drink.' }
    ],
    practice: { guest: 'mix', needs: ['served'], hint: 'This guest has already ordered. Make the drink and serve it. Practice drinks pay nothing.' }
  },
  {
    id: 'care', icon: '🚬', title: 'Look after a guest', summary: 'Water, ashtray, taxi: guests are people.',
    guide: [
      { title: 'Read the guest', text: 'Each guest has a feeling (happy, tired, angry…) and a level of alcohol. The chips in the conversation show both.' },
      { title: 'Small services', text: 'Bring water to a guest who is drunk, an ashtray to a smoker, and call a taxi when a guest cannot get home safely. Clean the ashtrays after the guest leaves.' },
      { title: 'Ask to leave', text: 'A guest who has had enough must leave. You can ask kindly, firmly or rudely. Kind works best, but not always. Never serve a very drunk guest: it breaks the house rule.' }
    ],
    practice: { guest: 'care', needs: ['water', 'ashtray'], hint: 'This guest is a little drunk and smokes. Open the conversation and use the buttons: Water and Ashtray.' }
  },
  {
    id: 'offer', icon: '🍽️', title: 'Offer food and another drink', summary: 'See the chance of a yes and raise it with words.',
    guide: [
      { title: 'When to offer', text: 'While a guest enjoys a drink, you can offer another drink or some food. Hungry guests like food. Food also pairs with drinks.' },
      { title: 'The chance meter', text: 'The panel shows the chance of a yes and the reasons: how much the guest likes you, the feeling, the price, and what you say.' },
      { title: 'Use your words', text: 'Tell the story of the drink, say what it goes with, offer a discount or a free taste: the chance goes up. Pushing makes it go down.' },
      { title: 'Allergies', text: 'Ask "Do you have any allergies?" before you give food. Never give a guest something they cannot eat.' }
    ],
    practice: { guest: 'offer', needs: ['offered'], hint: 'The guest is enjoying a drink and is hungry. Open the conversation, press Offer, choose something, and make the offer.' }
  },
  {
    id: 'situation', icon: '🧯', title: 'Solve a problem', summary: 'A guest cannot pay: choose the right words.',
    guide: [
      { title: 'Problems happen', text: 'Now and then something happens: a card is declined, a glass breaks, someone feels ill, someone threatens you. A panel opens with the guest’s words.' },
      { title: 'Choose your answer', text: 'Pick one of the English answers, or press "Type it yourself". Every answer is a real sentence. Kind, clear answers solve problems; rude ones make them worse.' },
      { title: 'Emergencies', text: 'In danger, call for help: 103 ambulance, 102 police, 101 fire, 104 gas. Say clearly what happened and where.' }
    ],
    practice: { guest: 'situation', needs: ['situationSolved'], hint: 'This guest says they do not have enough money. Choose a polite way to solve it.' }
  },
  {
    id: 'market', icon: '🛒', title: 'Supplies and top-up', summary: 'Buy stock, top up what is low, set auto-supply.',
    guide: [
      { title: 'Stock', text: 'Every drink uses ingredients. When a bottle or fruit runs out, you cannot make that drink. Open Inventory to see what is low.' },
      { title: 'Buy', text: 'In Market, choose a supplier, add packs to the cart and buy. Prices change with the city, your level and events. Delivery takes time.' },
      { title: 'Top up in one tap', text: 'The "Top up low stock" button orders what is running low from the cheapest supplier. From level 5, auto-supply does it for you.' },
      { title: 'Check deliveries', text: 'Goods can arrive late, damaged or wrong. Report a problem politely in English and the supplier will refund or replace it.' }
    ],
    practice: { guest: 'none', needs: ['bought', 'toppedUp'], hint: 'Open Market and buy anything. Then press "Top up low stock".' },
    goto: { view: 'market', label: 'Open the market' }
  },
  {
    id: 'rules', icon: '📜', title: 'House rules and events', summary: 'Follow the rules; use special nights.',
    guide: [
      { title: 'City rules', text: 'Each city has rules, for example check ID, no alcohol for drunk guests, alcohol by card only. Press Rules in the bar to read them. Inspectors count every rule you break.' },
      { title: 'Special nights', text: 'Some evenings have an event: ladies’ night, happy hour, a big match. The banner at the top tells you what changes. Promotions give drinks away: the third cocktail free, the seventh a gift.' },
      { title: 'City events', text: 'The market shows city events too: festivals, strikes, bad weather. They change prices and how many guests come.' }
    ],
    goto: { view: 'service', label: 'Show the bar' }
  },
  {
    id: 'staff', icon: '🧑‍🍳', title: 'Servers and upgrades', summary: 'Hire servers who work while you are away.',
    guide: [
      { title: 'Hire servers', text: 'At bar levels 8, 12, 15 and 23 you can hire a server (up to four). They appear as icons in the header, not in the bar.' },
      { title: 'They work while you are away', text: 'When you are not playing, servers serve guests for you and earn coins. They never bring crystals or tips, and four fully trained servers earn up to 85% of what you would.' },
      { title: 'Train them', text: 'Each server has their own training level. A higher level earns more.' }
    ]
  },
  {
    id: 'english', icon: '📚', title: 'Learn English faster', summary: 'Words, phrases, quests and speaking practice.',
    guide: [
      { title: 'The English tab', text: 'Words and phrases for the bar, the shop and buying. Tap an underlined word in a conversation to save it.' },
      { title: 'Daily quests', text: 'Finish the daily quests for XP, crystals and sometimes a new recipe.' },
      { title: 'Speak', text: 'Tap the speaker to listen. Tap the microphone and say the sentence: green words were clear, red ones need practice.' }
    ],
    goto: { view: 'english', label: 'Open English' }
  }
];

export const trainingById = (id: string) => TRAINING_MODULES.find((module) => module.id === id);

// Short help for the conversation window.
export const CHAT_GUIDE: GuideStep[] = [
  { title: 'The clue board', text: 'Every answer the guest gives is written on the board. Green means the guest likes it, red means no. Use the clues to find the drink.' },
  { title: 'Suggested sentences', text: 'Tap a sentence to say it. Tap the word tiles to build a sentence yourself, or type in the box. The checker corrects your English before the guest answers.' },
  { title: 'Name the drink', text: 'When you think you know it, say "Would you like a Mojito?" A wrong guess costs a little patience, but it is also a clue.' },
  { title: 'Look after the guest', text: 'The buttons under the name give water, an ashtray, a taxi, or an offer of food. Feelings and alcohol level show as chips.' },
  { title: 'Listen and speak', text: 'The speaker reads a word or sentence. The microphone checks how you say it. Unknown words are underlined: tap one to learn it.' },
  { title: 'Problems', text: 'When a situation opens, choose an answer or type your own. Kind and clear is best.' }
];
