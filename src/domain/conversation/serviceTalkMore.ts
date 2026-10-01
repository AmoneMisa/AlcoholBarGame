import type { Customer } from '../types';
import type { CustomerReply } from './customerTalk';
import type { Intent } from './serviceTalk';

// What guests and shop customers answer to the newer phrase lessons: checking age and documents, bookings and events,
// tabs and closing time, allergies and responsible service, invoices and licences, and gift packing.
// These rules run BEFORE the older ones, so “your ID has expired” is not read as a plain ID request.

type Reply = (text: string, expression?: CustomerReply['expression']) => CustomerReply;
type PickFor = (customer: Customer, options: string[]) => string;

// Built from serviceTalk's own helpers (passed in), so the two files never import each other.
export const moreIntents = (pickFor: PickFor, reply: Reply): Intent[] => [
  // ---- Age and documents ----
  { test: /\bexpired\b|\bnot valid\b/i, answer: () => reply('Oh, sorry! I have my passport too. Here you are.', 'confused') },
  { test: /\bdate of birth\b/i, answer: ({ customer }) => reply(pickFor(customer, ['It is the tenth of June, nineteen ninety-five.', 'Sure. I was born in two thousand.', 'It is the third of March, nineteen ninety.'])) },
  { test: /\b(must be|have to be)\b.*\b(older|over|eighteen|twenty-one|twenty one)\b|\blegal age\b/i, statement: true, answer: () => reply('I am older than that. Here is my ID.') },
  { test: /\boriginal\b|\bnot a copy\b/i, statement: true, answer: () => reply('Oh, I understand. I will bring the original.', 'thinking') },
  { test: /\b(can(no|'|’)t|cannot) (sell|serve)\b.*\bwithout\b/i, answer: () => reply('OK, I understand. Maybe a soft drink instead, then.', 'neutral') },

  // ---- Bookings and events ----
  { test: /\bwhat time\b.*\b(reservation|booking)\b/i, answer: ({ customer }) => reply(pickFor(customer, ['It is at eight o’clock.', 'It is for nine, under the name Ana.'])) },
  { test: /\bhow many people\b|\byour group\b/i, answer: ({ customer }) => reply(pickFor(customer, ['We are four.', 'There will be about ten of us.'])) },
  { test: /\bbook a table\b|\bmake a (booking|reservation)\b/i, answer: ({ customer }) => reply(pickFor(customer, ['Yes, please. A table for four.', 'Not today, thank you. Maybe next week.'])) },
  { test: /\bdeposit\b/i, statement: true, answer: () => reply('OK, how much is the deposit?', 'thinking') },
  { test: /\bhappy hour\b/i, statement: true, answer: () => reply('Great, I will come back then!', 'happy') },
  { test: /\blive music\b/i, statement: true, answer: () => reply('That sounds like fun! I will tell my friends.', 'happy') },

  // ---- Tabs, bills and closing time ----
  { test: /\bopen a tab\b/i, answer: () => reply('Yes, please. Put it all on one tab.') },
  { test: /\bsplit the bill\b/i, answer: () => reply('Yes, please. Split it equally.') },
  { test: /\blast call\b|\bcloses? in\b/i, answer: () => reply('One more drink, please!', 'happy') },
  { test: /\bservice charge\b/i, statement: true, answer: () => reply('OK, thank you for telling me.') },

  // ---- Allergies and responsible service ----
  { test: /\ballerg/i, answer: ({ customer }) => reply(pickFor(customer, ['No allergies, thank you.', 'I am allergic to nuts, please.'])) },
  { test: /\bnon-alcoholic\b|\bwithout alcohol\b/i, answer: () => reply('Yes, why not? Something fresh, please.', 'thinking') },
  { test: /\bsome water\b/i, answer: () => reply('Yes, please. That is a good idea.') },
  { test: /\bhad enough\b/i, statement: true, answer: () => reply('You are right. Thank you for being honest.', 'disappointed') },
  { test: /\bcall you a taxi\b/i, answer: () => reply('Yes, please. That is very kind.', 'happy') },

  // ---- Documents and gifts in the shop ----
  { test: /\blicen[cs]e\b/i, answer: () => reply('Yes, here is our licence.') },
  { test: /\binvoice\b/i, answer: () => reply('Yes, please. Our company is Blue Moon Bar.') },
  { test: /\bsign here\b|\bconfirm your order\b/i, statement: true, answer: () => reply('Sure. Here you go.') },
  { test: /\bwrap it\b|\bgift card\b/i, answer: ({ customer }) => reply(pickFor(customer, ['Yes, please. It is a present.', 'Yes, please. Write “Happy birthday”.'])) },
  { test: /\bstrong box\b|\bdoes not break\b/i, statement: true, answer: () => reply('Thank you, that is very careful.', 'happy') },
  { test: /\bfragile\b|\bcarry it carefully\b/i, statement: true, answer: () => reply('Of course, I will be careful.') }
];
