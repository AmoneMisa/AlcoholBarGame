import type { PartRole, PhraseGroup, PhraseLesson } from './phrases';

// Phrase lessons for food and advice: offering a snack, asking about allergies, explaining a pairing, making a
// recommendation, announcing a promotion, and dealing with a guest who has had enough.

const p = (text: string, role: PartRole): [string, PartRole] => [text, role];
const lesson = (parts: [string, PartRole][], when: string, answers: string[], swap?: string): PhraseLesson => ({
  text: parts.map(([text]) => text).join(' '),
  parts: parts.map(([text, role]) => ({ text, role })),
  when, answers, ...(swap ? { swap } : {})
});

export const FOOD_PHRASE_GROUPS: PhraseGroup[] = [
  {
    id: 'sit-food', context: 'bar', title: 'Offering food with a drink', goal: 'Suggest a snack at the right moment and say why it goes with the drink.',
    lessons: [
      lesson([p('Would', 'helper'), p('you', 'person'), p('like', 'verb'), p('something to eat', 'thing'), p('with your drink?', 'extra')],
        'The gentle way to offer food. A guest who is hungry will say yes.', ['Yes, please. What do you have?', 'No, thank you. I am not hungry.'], 'something to eat → a snack'),
      lesson([p('We have', 'person'), p('fries, nuts', 'thing'), p('and a cheese plate.', 'extra')],
        'Say what is on the menu in a short list.', ['A cheese plate sounds good.', 'Just some nuts, please.']),
      lesson([p('A cheese plate', 'person'), p('goes', 'verb'), p('very well', 'extra'), p('with red wine.', 'thing')],
        'Explain a pairing. “Goes well with” is the phrase to learn.', ['Good idea. I will take one.', 'I do not like cheese, sorry.'], 'cheese plate → olives'),
      lesson([p('The salty cheese', 'person'), p('balances', 'verb'), p('the sweet wine.', 'thing')],
        'Give the reason for the pairing. Guests like to learn something new.', ['That is interesting!', 'I did not know that.']),
      lesson([p('Shall', 'helper'), p('I', 'person'), p('bring', 'verb'), p('a plate for the table?', 'thing')],
        'Offer food to a group of friends.', ['Yes, please. We are all hungry.', 'Maybe later.'])
    ]
  },
  {
    id: 'sit-allergy-food', context: 'bar', title: 'Allergies and ingredients', goal: 'Ask before you serve food, and answer when a guest asks what is inside.',
    lessons: [
      lesson([p('Do', 'helper'), p('you', 'person'), p('have', 'verb'), p('any allergies?', 'thing')],
        'Ask before you bring food or a cocktail with nuts, milk or egg.', ['Yes, I am allergic to nuts.', 'No, I can eat everything.']),
      lesson([p('Is', 'helper'), p('there', 'person'), p('anything', 'thing'), p('you cannot eat?', 'extra')],
        'A softer way to ask about food that a guest avoids.', ['I cannot have dairy.', 'No, nothing special.']),
      lesson([p('This', 'person'), p('contains', 'verb'), p('nuts and milk.', 'thing')],
        'Say clearly what is inside. It can protect someone’s health.', ['Then I will not take it.', 'That is fine for me.'], 'nuts and milk → gluten'),
      lesson([p('I will', 'helper'), p('check', 'verb'), p('the ingredients', 'thing'), p('for you.', 'extra')],
        'When you are not sure. Never guess about an allergy.', ['Thank you, that is very kind.', 'Please do.'])
    ]
  },
  {
    id: 'sit-advice', context: 'bar', title: 'Giving advice and recommending', goal: 'Ask about taste first, then recommend one drink and say why.',
    lessons: [
      lesson([p('Do', 'helper'), p('you', 'person'), p('prefer', 'verb'), p('something sweet or something dry?', 'thing')],
        'Ask about taste before you recommend anything.', ['Something sweet, please.', 'Dry, I think.']),
      lesson([p('I', 'person'), p('recommend', 'verb'), p('this rum.', 'thing'), p('It is smooth and sweet.', 'extra')],
        'Recommend one thing and give one reason.', ['That sounds good. I will take it.', 'Do you have something stronger?'], 'rum → whisky'),
      lesson([p('Would', 'helper'), p('you', 'person'), p('like', 'verb'), p('a mocktail?', 'thing'), p('It has no alcohol.', 'extra')],
        'Offer a drink without alcohol, for example to a guest who is driving.', ['Yes, that is perfect.', 'No, I will have water.']),
      lesson([p('Sip', 'verb'), p('it slowly', 'extra'), p('to taste it.', 'extra')],
        'Advice for a beginner with a strong drink.', ['Thank you for the tip.', 'OK, I will try.'])
    ]
  },
  {
    id: 'sit-promo', context: 'bar', title: 'Promotions and special nights', goal: 'Tell guests about an offer clearly and friendly.',
    lessons: [
      lesson([p('Tonight', 'extra'), p('every third cocktail', 'person'), p('is', 'helper'), p('free', 'thing'), p('for ladies.', 'extra')],
        'Announce ladies’ night.', ['That is great!', 'Lovely. Two more, please.']),
      lesson([p('If you buy six drinks,', 'extra'), p('the seventh', 'person'), p('is', 'helper'), p('a gift.', 'thing')],
        'Explain the loyalty offer.', ['That is a good deal.', 'I will have another one, then.']),
      lesson([p('Order three glasses of wine', 'extra'), p('and', 'extra'), p('you get', 'verb'), p('a cheese plate', 'thing'), p('on the house.', 'extra')],
        'Explain the wine and cheese offer.', ['Wonderful! Three glasses, please.', 'That is very generous.']),
      lesson([p('Happy hour', 'person'), p('starts', 'verb'), p('at six.', 'extra')],
        'Say when drinks cost less.', ['I will come back then.', 'Good to know.'])
    ]
  }
];
