import { MORE_PHRASE_GROUPS } from './phrasesMore';

// Phrase lessons for three jobs — bartender and shop seller — split into parts so learners see how English builds them.

export type PartRole = 'helper' | 'person' | 'verb' | 'thing' | 'question' | 'extra';
export interface PhraseLesson {
  text: string;
  parts: { text: string; role: PartRole }[];
  when: string;
  answers: string[];
  swap?: string;
}
export type WorkContext = 'bar' | 'shop' | 'buyer';
export interface PhraseGroup { id: string; context: WorkContext; title: string; goal: string; lessons: PhraseLesson[]; }

export const CONTEXT_LABEL: Record<WorkContext, string> = { bar: 'Bartender', shop: 'Seller / shop', buyer: 'Buyer / suppliers' };

const p = (text: string, role: PartRole) => ({ text, role });

export const ROLE_LABEL: Record<PartRole, string> = {
  helper: 'helper verb', person: 'person', verb: 'main verb', thing: 'thing / idea', question: 'question word', extra: 'extra'
};

export const PHRASE_GROUPS: PhraseGroup[] = [
  {
    id: 'greet', context: 'bar', title: 'Greeting the guest', goal: 'Start friendly and invite the guest to talk.',
    lessons: [
      { text: 'Good evening! What can I get you?', parts: [p('Good evening!', 'extra'), p('What', 'question'), p('can', 'helper'), p('I', 'person'), p('get', 'verb'), p('you?', 'thing')], when: 'The first thing you say when a guest sits down.', answers: ['A Mojito, please.', 'I’m not sure yet.'], swap: 'Good morning / Good afternoon / Hi there' },
      { text: 'How are you tonight?', parts: [p('How', 'question'), p('are', 'helper'), p('you', 'person'), p('tonight?', 'extra')], when: 'Small talk. It shows you care about the guest.', answers: ['I’m good, thanks.', 'I had a long day.'] }
    ]
  },
  {
    id: 'taste', context: 'bar', title: 'Asking about taste', goal: 'Find out which flavours the guest enjoys.',
    lessons: [
      { text: 'Do you like sweet drinks?', parts: [p('Do', 'helper'), p('you', 'person'), p('like', 'verb'), p('sweet drinks?', 'thing')], when: 'A yes/no question about one flavour.', answers: ['Yes, I like sweet drinks.', 'No, not sweet, please.'], swap: 'sweet → sour / bitter / fruity / creamy' },
      { text: 'What flavours do you like?', parts: [p('What flavours', 'question'), p('do', 'helper'), p('you', 'person'), p('like?', 'verb')], when: 'An open question. The guest can say anything — good when you have no idea yet.', answers: ['I like fresh, citrusy drinks.'] },
      { text: 'Do you like the taste of mint?', parts: [p('Do', 'helper'), p('you', 'person'), p('like', 'verb'), p('the taste of mint?', 'thing')], when: 'Ask about one ingredient.', answers: ['Yes, I love mint!', 'No mint, please.'], swap: 'mint → lime / ginger / coconut / coffee' }
    ]
  },
  {
    id: 'strength', context: 'bar', title: 'Strength and bubbles', goal: 'Learn how strong and how fizzy the drink should be.',
    lessons: [
      { text: 'Do you want something strong?', parts: [p('Do', 'helper'), p('you', 'person'), p('want', 'verb'), p('something strong?', 'thing')], when: 'Ask about the amount of alcohol.', answers: ['Yes, something strong, please.', 'No, something light.'], swap: 'strong → light' },
      { text: 'Would you like a drink with bubbles?', parts: [p('Would', 'helper'), p('you', 'person'), p('like', 'verb'), p('a drink with bubbles?', 'thing')], when: 'Ask about sparkling drinks (soda, tonic, sparkling wine).', answers: ['Yes, I love bubbles!', 'No bubbles, please.'] }
    ]
  },
  {
    id: 'choose', context: 'bar', title: 'Helping the guest choose', goal: 'Compare two options and narrow the choice.',
    lessons: [
      { text: 'Do you prefer rum or gin?', parts: [p('Do', 'helper'), p('you', 'person'), p('prefer', 'verb'), p('rum or gin?', 'thing')], when: 'Give two options. The guest picks one.', answers: ['I prefer rum.', 'Neither, thank you.'], swap: 'rum or gin → sweet or sour / light or strong' },
      { text: 'Is it for a special occasion?', parts: [p('Is', 'helper'), p('it', 'person'), p('for a special occasion?', 'thing')], when: 'Ask about the reason for the visit — birthdays love sparkling drinks!', answers: ['Yes, it’s my birthday!', 'No, just a normal evening.'] }
    ]
  },
  {
    id: 'recommend', context: 'bar', title: 'Recommending a drink', goal: 'Suggest a cocktail politely and explain why.',
    lessons: [
      { text: 'Would you like a Mojito?', parts: [p('Would', 'helper'), p('you', 'person'), p('like', 'verb'), p('a Mojito?', 'thing')], when: 'Offer one drink. “Would you like” is the most polite way.', answers: ['Yes! That sounds perfect.', 'Hmm, not that one.'], swap: 'a Mojito → an Old Fashioned (a/an!)' },
      { text: 'I recommend the Daiquiri. It is fresh and sour.', parts: [p('I', 'person'), p('recommend', 'verb'), p('the Daiquiri.', 'thing'), p('It is fresh and sour.', 'extra')], when: 'Give your advice and a reason. Reasons make guests trust you.', answers: ['Great, I’ll take it.'] }
    ]
  },
  {
    id: 'serve', context: 'bar', title: 'Serving and finishing', goal: 'Give the drink and close the conversation warmly.',
    lessons: [
      { text: 'Here you are. Enjoy your drink!', parts: [p('Here you are.', 'extra'), p('Enjoy', 'verb'), p('your drink!', 'thing')], when: 'When you put the drink on the counter.', answers: ['Thank you!', 'Cheers!'] },
      { text: 'Would you like anything else?', parts: [p('Would', 'helper'), p('you', 'person'), p('like', 'verb'), p('anything else?', 'thing')], when: 'Check if the guest needs more.', answers: ['No, thank you.', 'Some water, please.'] }
    ]
  },
  // ---- Seller / retail: a bottle shop, a market stall or the bar's own trade counter ----
  {
    id: 'shop-welcome', context: 'shop', title: 'Welcoming shop customers', goal: 'Greet people who come in and offer help without pushing.',
    lessons: [
      { text: 'Hello! Can I help you?', parts: [p('Hello!', 'extra'), p('Can', 'helper'), p('I', 'person'), p('help', 'verb'), p('you?', 'thing')], when: 'When a customer comes into the shop or looks around.', answers: ['Yes, please. I’m looking for a gift.', 'No, thanks. I’m just looking.'] },
      { text: 'Are you looking for anything special?', parts: [p('Are', 'helper'), p('you', 'person'), p('looking for', 'verb'), p('anything special?', 'thing')], when: 'A softer way to offer help. Good after the customer has looked around for a minute.', answers: ['Yes, a good bottle of red wine.', 'Just looking, thank you.'], swap: 'anything special → a present / something for tonight' },
      { text: 'Take your time. I am here if you need me.', parts: [p('Take', 'verb'), p('your time.', 'thing'), p('I am here if you need me.', 'extra')], when: 'When the customer says “just looking”. It is polite and gives them space.', answers: ['Thank you!'] }
    ]
  },
  {
    id: 'shop-find', context: 'shop', title: 'Helping find a product', goal: 'Understand what the customer needs and show where it is.',
    lessons: [
      { text: 'What are you looking for?', parts: [p('What', 'question'), p('are', 'helper'), p('you', 'person'), p('looking for?', 'verb')], when: 'An open question to learn what the customer wants.', answers: ['I need some tonic water.', 'Do you have Japanese whisky?'] },
      { text: 'It is on the top shelf, next to the gin.', parts: [p('It', 'person'), p('is', 'verb'), p('on the top shelf,', 'thing'), p('next to the gin.', 'extra')], when: 'Tell the customer where a product is. Use place words: on, next to, behind, in front of.', answers: ['Great, thanks!'], swap: 'on the top shelf → on the bottom shelf / in the fridge / at the back' },
      { text: 'Sorry, it is out of stock. It will be back on Friday.', parts: [p('Sorry,', 'extra'), p('it', 'person'), p('is', 'verb'), p('out of stock.', 'thing'), p('It will be back on Friday.', 'extra')], when: 'When you do not have the product now. Always say when it comes back, or offer something similar.', answers: ['OK, I will come back on Friday.', 'Do you have something similar?'] }
    ]
  },
  {
    id: 'shop-price', context: 'shop', title: 'Sizes, prices and deals', goal: 'Talk about how much, how many and how to save money.',
    lessons: [
      { text: 'How many bottles do you need?', parts: [p('How many bottles', 'question'), p('do', 'helper'), p('you', 'person'), p('need?', 'verb')], when: 'Ask about quantity. Use “how many” with things you can count (bottles, packs).', answers: ['Just one, please.', 'Six bottles for a party.'], swap: 'How many bottles → How much ice (uncountable: how much)' },
      { text: 'This bottle costs twenty dollars.', parts: [p('This bottle', 'person'), p('costs', 'verb'), p('twenty dollars.', 'thing')], when: 'Say the price. “This bottle” is one thing, so the verb needs -s: costs.', answers: ['That is a bit expensive.', 'OK, I will take it.'], swap: 'twenty dollars → fifteen euros / ten pounds' },
      { text: 'It is on sale this week. You get ten percent off.', parts: [p('It', 'person'), p('is', 'verb'), p('on sale this week.', 'thing'), p('You get ten percent off.', 'extra')], when: 'Tell the customer about a discount. “On sale” = cheaper than usual.', answers: ['Great, I will take two!'] },
      { text: 'We also have a bigger size. It is cheaper per litre.', parts: [p('We', 'person'), p('also have', 'verb'), p('a bigger size.', 'thing'), p('It is cheaper per litre.', 'extra')], when: 'Offer a better-value option. Comparing sizes helps the customer save money.', answers: ['Oh, good idea. The big one, please.'] }
    ]
  },
  {
    id: 'shop-recommend', context: 'shop', title: 'Recommending and comparing products', goal: 'Help the customer choose between two products and explain the difference.',
    lessons: [
      { text: 'Is it a gift or for you?', parts: [p('Is', 'helper'), p('it', 'person'), p('a gift or for you?', 'thing')], when: 'Gifts need nice bottles and gift wrapping. For themselves, people often want good value.', answers: ['It is a gift for my father.', 'It is for me.'] },
      { text: 'This one is cheaper, but that one is better for cocktails.', parts: [p('This one', 'person'), p('is', 'verb'), p('cheaper,', 'thing'), p('but that one is better for cocktails.', 'extra')], when: 'Compare two products honestly. Use -er words: cheaper, sweeter, stronger — and better / worse.', answers: ['I will take the better one.'], swap: 'cheaper / better → lighter / stronger / sweeter / drier' },
      { text: 'It is our most popular wine.', parts: [p('It', 'person'), p('is', 'verb'), p('our most popular wine.', 'thing')], when: 'Recommend a best-seller. Use “the most” with long adjectives (popular, expensive).', answers: ['Then I will try it.'], swap: 'most popular → best / cheapest / most expensive' }
    ]
  },
  {
    id: 'shop-id', context: 'shop', title: 'Checking age (selling alcohol)', goal: 'Ask for ID politely and say no kindly when you must.',
    lessons: [
      { text: 'Can I see your ID, please?', parts: [p('Can', 'helper'), p('I', 'person'), p('see', 'verb'), p('your ID, please?', 'thing')], when: 'Before you sell alcohol to someone who looks young. It is the law in most countries.', answers: ['Sure, here you are.', 'Sorry, I don’t have it with me.'], swap: 'your ID → your passport / your driving licence' },
      { text: 'Sorry, I can’t sell alcohol without ID.', parts: [p('Sorry,', 'extra'), p('I', 'person'), p('can’t sell', 'verb'), p('alcohol', 'thing'), p('without ID.', 'extra')], when: 'Say no politely. Stay friendly and offer a non-alcoholic choice.', answers: ['OK, I understand.'], swap: 'Add: “Would you like a soft drink instead?”' }
    ]
  },
  {
    id: 'shop-pay', context: 'shop', title: 'Taking payment', goal: 'Finish the sale: total, payment method, bag and receipt.',
    lessons: [
      { text: 'Your total is thirty dollars.', parts: [p('Your total', 'person'), p('is', 'verb'), p('thirty dollars.', 'thing')], when: 'Say how much the customer must pay for everything.', answers: ['Here you are.', 'Can I pay by card?'] },
      { text: 'Would you like to pay by card or in cash?', parts: [p('Would', 'helper'), p('you', 'person'), p('like to pay', 'verb'), p('by card or in cash?', 'thing')], when: 'Ask about the payment method. Note the little words: BY card, IN cash.', answers: ['By card, please.', 'In cash.'] },
      { text: 'Would you like a bag?', parts: [p('Would', 'helper'), p('you', 'person'), p('like', 'verb'), p('a bag?', 'thing')], when: 'Offer a bag at the end of the sale.', answers: ['Yes, please.', 'No, thanks. I have one.'] },
      { text: 'Here is your receipt and your change.', parts: [p('Here', 'extra'), p('is', 'verb'), p('your receipt and your change.', 'thing')], when: 'Give the paper (receipt) and the extra money (change) back to the customer.', answers: ['Thank you. Have a nice day!'] }
    ]
  },
  {
    id: 'shop-orders', context: 'shop', title: 'Orders and delivery', goal: 'Take bigger orders from bars and restaurants — like the game’s market.',
    lessons: [
      { text: 'When do you need the delivery?', parts: [p('When', 'question'), p('do', 'helper'), p('you', 'person'), p('need', 'verb'), p('the delivery?', 'thing')], when: 'Ask about the date for a big order.', answers: ['By Friday, please.', 'As soon as possible.'] },
      { text: 'Delivery is free for orders over one hundred dollars.', parts: [p('Delivery', 'person'), p('is', 'verb'), p('free', 'thing'), p('for orders over one hundred dollars.', 'extra')], when: 'Explain the free-delivery minimum. “Over” = more than.', answers: ['Then I will add two more packs.'] },
      { text: 'If you buy ten packs, you get ten percent off.', parts: [p('If you buy ten packs,', 'extra'), p('you', 'person'), p('get', 'verb'), p('ten percent off.', 'thing')], when: 'Explain a bulk discount. “If + present, present” describes a rule that is always true.', answers: ['Great, I will take ten.'], swap: 'ten packs → five packs · ten percent → five percent' }
    ]
  },
  {
    id: 'shop-problems', context: 'shop', title: 'Problems, returns and refunds', goal: 'Stay calm and polite when something goes wrong.',
    lessons: [
      { text: 'I am sorry about that. Do you have the receipt?', parts: [p('I am sorry about that.', 'extra'), p('Do', 'helper'), p('you', 'person'), p('have', 'verb'), p('the receipt?', 'thing')], when: 'The customer has a problem with a product. Say sorry first, then ask for the receipt.', answers: ['Yes, here it is.', 'No, I lost it.'] },
      { text: 'We can exchange it or give you a refund.', parts: [p('We', 'person'), p('can exchange', 'verb'), p('it', 'thing'), p('or give you a refund.', 'extra')], when: 'Offer two solutions. Exchange = a new product. Refund = the money back.', answers: ['A refund, please.', 'I will exchange it.'] }
    ]
  }
  ,...MORE_PHRASE_GROUPS
];
