export interface GuideStep { title: string; text: string }

// Short help for the conversation window.
export interface ChatGuideStep extends GuideStep { /** What the "Show me" button circles: a data-guide name, and the label for it. */ show?: { name: string; gesture: 'tap' | 'drag' | 'swipe' | 'type'; label: string } }
export const CHAT_GUIDE: ChatGuideStep[] = [
  { title: 'The clue board', text: 'Every answer the guest gives is written on the board. Green means the guest likes it, red means no. Use the clues to find the drink.', show: { name: 'clue-board', gesture: 'tap', label: 'The clue board: green = likes, red = does not like' } },
  { title: 'Suggested sentences', text: 'Tap a sentence to say it. Tap the word tiles to build a sentence yourself, or type in the box. The checker corrects your English before the guest answers.', show: { name: 'tile-bank', gesture: 'tap', label: '{Tap} the words to build a sentence, then Check & send' } },
  { title: 'Name the drink', text: 'When you think you know it, say "Would you like a Mojito?" A wrong guess costs a little patience, but it is also a clue.', show: { name: 'new-question', gesture: 'tap', label: '{Tap} New question to see a different sentence, such as a drink to name' } },
  { title: 'Prepare a confirmed drink', text: 'After the order is confirmed, press Start mixing. It opens a separate counter screen: search for a bottle, select a measure and drag it from the shelf to the glass. Add mixers, ice and garnish from below. Follow the ingredient quest on the right; use Clear or Mix as needed. Serve order appears there when the drink is ready.', show: { name: 'prepare', gesture: 'tap', label: '{Tap} Start mixing after confirming the order' } },
  { title: 'Sealed bottles', text: 'For a sealed bottle order, use Sell full bottle in this conversation. You do not pour it into a glass.', show: { name: 'bottle-sale', gesture: 'tap', label: '{Tap} Sell full bottle after confirming the bottle order' } },
  { title: 'Look after the guest', text: 'When a guest asks for water, an ashtray or a taxi, that button appears under the name. You can always offer food or another drink. Feelings and alcohol level show as chips.', show: { name: 'talk-actions', gesture: 'tap', label: 'Water, ashtray, taxi, offer: {tap} a button to help the guest' } },
  { title: 'Listen and speak', text: 'The speaker reads a word or sentence. The microphone checks how you say it. Unknown words are underlined: tap one to learn it.' },
  { title: 'Problems', text: 'When a situation opens, choose an answer or type your own. Kind and clear is best.', show: { name: 'situation-choice', gesture: 'tap', label: 'When a problem opens, {tap} an answer' } }
];
