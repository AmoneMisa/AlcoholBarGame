import type { Customer } from '../types';
import type { CustomerReply } from './customerTalk';
import { moreIntents } from './serviceTalkMore';

// Service small talk shared by cocktail guests and bottle-shop customers: offering help, occasions,
// serving, prices, deals, stock, ID checks, payment, bag, receipt, delivery and returns.
// It answers every phrase lesson on the English page, so what learners practise there works in real dialogs.

export interface ServiceContext {
  customer: Customer;
  kind: 'drink' | 'bottle';
  confirmed: boolean;
  wish?: string;
}

// “Something to feel fresh and cool…” → “something to feel fresh and cool.”
const wishSentence = (wish?: string) => wish ? `I would like ${wish.replace(/^Something/, 'something').replace(/[….]+$/, '')}.` : 'Can you help me choose a drink?';

// Stable per-customer choice, so a guest gives the same answer if asked twice.
function pickFor(customer: Customer, options: string[]) {
  let hash = 0;
  for (const char of customer.id) hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
  return options[hash % options.length]!;
}
const reply = (text: string, expression: CustomerReply['expression'] = 'smile'): CustomerReply => ({ text, expression, facts: [] });

// `statement`: only for sentences that are not questions (so “stronger, but not sweet?” stays a taste question).
export interface Intent { test: RegExp; answer: (context: ServiceContext) => CustomerReply; statement?: boolean; drinkOnly?: boolean; }

const INTENTS: Intent[] = [
  ...moreIntents(pickFor, reply),
  // Age check before anything about alcohol words, so “can’t sell alcohol without ID” is not read as an alcohol question.
  { test: /\b(can(no|'|’)t|cannot) sell\b.*\bwithout\b/i, answer: () => reply('OK, I understand. Maybe a soft drink instead, then.', 'neutral') },
  { test: /\b(id|passport|identification|driving licen[cs]e)\b|how old are you/i, answer: ({ customer }) => reply(pickFor(customer, ['Sure, here you are.', 'Of course — here is my ID.', 'Yes, here is my passport.'])) },
  { test: /\b(card or (in )?cash|cash or (by )?card|pay by|pay in|how would you like to pay)\b/i, answer: ({ customer }) => reply(customer.paymentMethod === 'cash' ? 'In cash, please.' : 'By card, please.') },
  { test: /\bwould you like a bag\b|\bneed a bag\b/i, answer: ({ customer }) => reply(pickFor(customer, ['Yes, please.', 'No, thanks. I have one.'])) },
  // Apologies and returns before “receipt”, so “Sorry about that. Do you have the receipt?” is understood as a return.
  { test: /\b(exchange it|give you a refund)\b/i, answer: () => reply('A refund, please. Thank you for your help.', 'smile') },
  { test: /\b(refund|sorry about that)\b/i, answer: () => reply('Yes, here is the receipt. The bottle was already open.', 'neutral') },
  { test: /\breceipt\b|\byour change\b/i, answer: ({ confirmed }) => reply(confirmed ? 'Thank you! Have a nice day.' : 'But we have not finished yet!', confirmed ? 'very-happy' : 'confused') },
  { test: /\bout of stock\b|\bback on\b/i, answer: () => reply('Oh, that is a pity. Do you have something similar?', 'disappointed') },
  { test: /\bon sale\b|\bpercent off\b|\bdiscount\b|\bif you buy\b/i, answer: () => reply('Oh, great! I like a good deal.', 'happy') },
  { test: /\bbigger size\b|\bper lit(re|er)\b/i, answer: () => reply('Good idea, thank you for telling me.', 'happy') },
  { test: /\bdelivery\b|\bdeliver\b/i, answer: ({ kind }) => reply(kind === 'bottle' ? 'I can take them with me today, thank you.' : 'I will drink it here, thank you!') },
  { test: /\b(shelf|next to|behind the|in the fridge)\b/i, answer: () => reply('Thank you, I can see it now.'), statement: true },
  { test: /\bmost popular\b|\bbest.?seller\b/i, answer: () => reply('Popular is good! Tell me more.', 'thinking'), statement: true },
  { test: /\b(cheaper|better|stronger|lighter|sweeter),? but\b/i, answer: () => reply('Thank you for explaining the difference.', 'thinking'), statement: true },
  { test: /\b(costs?|price is|total is)\b.*\b(\d+|one|two|three|four|five|six|seven|eight|nine|ten|twenty|thirty|forty|fifty|hundred)\b/i, answer: ({ confirmed }) => reply(confirmed ? 'OK, that is fine.' : 'OK. Let us find the right one first.') },
  { test: /\banything else\b/i, answer: ({ confirmed }) => reply(confirmed ? 'No, just that, thank you.' : 'First, let us find what I want!', confirmed ? 'smile' : 'thinking') },
  { test: /\bhere you are\b|\benjoy (your|the)\b|\bcheers\b/i, answer: ({ confirmed }) => reply(confirmed ? 'Thank you! It looks great.' : 'Oh — but I have not ordered yet!', confirmed ? 'very-happy' : 'confused') },
  { test: /\btake your time\b|\bhere if you need\b/i, answer: () => reply('Thank you, that is kind.') },
  { test: /\bjust looking\b/i, answer: () => reply('Actually, I do need some help.', 'thinking') },
  // Bottle customers answer occasion questions in bottleTalk, which knows their real occasion and records it as a clue.
  { test: /\b(special occasion|celebrat|birthday)\b|\bis it for a\b(?!.*\b(gift|party)\b)/i, drinkOnly: true, answer: ({ customer }) =>
    reply(pickFor(customer, ['Yes, it is my birthday today!', 'No, just a normal evening after work.', 'Yes! I am celebrating a new job.', 'It is a date night.']), 'happy') },
  { test: /\b(can i help you|what can i get you|how can i help)\b/i, answer: ({ kind, wish }) => reply(kind === 'bottle' ? 'Yes, please. I need some bottles. Can you help me choose?' : `Yes, please! ${wishSentence(wish)}`) },
  { test: /\bwhat are you looking for\b|\blooking for anything\b/i, answer: ({ kind, wish }) => reply(kind === 'bottle' ? 'I am looking for some good bottles. Ask me about the type, flavour and budget.' : wishSentence(wish), 'thinking') }
];

// Returns a reply for service phrases, or undefined when the sentence is about the order itself.
export function serviceReply(text: string, context: ServiceContext): CustomerReply | undefined {
  const question = /\?\s*$/.test(text.trim());
  return INTENTS.find((intent) => !(intent.statement && question) && !(intent.drinkOnly && context.kind === 'bottle') && intent.test.test(text))?.answer(context);
}

// Extra word-bank / idea phrases that fit the moment of the conversation.
export function serviceTemplates(kind: 'drink' | 'bottle', confirmed: boolean, turns: number) {
  if (confirmed) {
    return kind === 'bottle'
      ? ['Can I see your ID, please?', 'Would you like to pay by card or in cash?', 'Would you like a bag?', 'Here is your receipt and your change.']
      : ['Would you like anything else?', 'Here you are. Enjoy your drink!'];
  }
  // Every guest opens by asking for help (and a bottle guest names the occasion), so the first reply
  // accepts and starts helping instead of offering help again.
  if (turns === 0) return kind === 'bottle' ? ['Of course! How many bottles do you need?', 'Sure! What is your total budget?'] : ['Of course! Do you like sweet drinks?', 'Sure! Is it for a special occasion?'];
  return kind === 'bottle' ? [] : ['Is it for a special occasion?'];
}
