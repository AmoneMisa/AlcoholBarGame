// What a supplier's sales rep answers when the buyer asks about deliveries, packages, standing orders or invoices —
// the "buyer" phrase lessons. These are not price tactics, so they change nothing in the deal; they simply let the
// conversation work like a real one, and the delivery time quoted is the supplier's real delivery time.

export interface SupplierFacts { company: string; deliveryDays: number }

const days = (count: number) => (count === 1 ? 'one day' : `${count} days`);

// Ordered from the most specific to the most general; the first match answers.
const TOPICS: { test: RegExp; answer: (facts: SupplierFacts) => string }[] = [
  { test: /\btracking\b/, answer: () => 'Of course. I will send you the tracking number today.' },
  { test: /\b(late|delay|delayed)\b|what happened/, answer: () => 'I am sorry about the delay. I will check where your order is right now.' },
  { test: /\b(damaged|broken|missing|leak\w*)\b/, answer: () => 'I am very sorry. Send me a photo and I will arrange a replacement.' },
  { test: /\breplacement\b|\bnew one\b/, answer: () => 'Of course. A replacement will arrive with the next delivery.' },
  { test: /\bsign\b|\bsignature\b/, answer: () => 'Just here, please. Thank you!' },
  { test: /\b(payment terms|pay within|thirty days|fourteen days|credit)\b/, answer: () => 'Our normal terms are payment on delivery. For regular clients, we can talk.' },
  { test: /\b(total|invoice)\b.*\bwrong\b|\bwrong\b.*\b(total|invoice)\b|\bmistake\b/, answer: () => 'Let me check the invoice and correct it.' },
  { test: /\binvoice\b|\breceipt\b|\baccountant\b/, answer: () => 'The invoice is in the package, and I can also email it to you.' },
  { test: /\b(standing order|set up|same order|pause|cancel|notice|schedule)\b/, answer: () => 'A standing order is possible. We need two days notice for any change.' },
  { test: /\b(back door|leave the|before noon|every (monday|tuesday|wednesday|thursday|friday|saturday|sunday)|in the (morning|afternoon))\b/, answer: () => 'No problem. I will tell the driver and add it to the delivery notes.' },
  { test: /\b(when|how long|arrive|delivery time)\b/, answer: ({ deliveryDays }) => `Delivery usually takes ${days(Math.max(1, Math.round(deliveryDays)))}.` }
];

export function supplierInfoReply(text: string, facts: SupplierFacts): string | undefined {
  const said = text.toLowerCase();
  return TOPICS.find((topic) => topic.test.test(said))?.answer(facts);
}
