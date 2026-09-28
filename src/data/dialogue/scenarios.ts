import type { DialogueScenario } from '../../domain/dialogue/types';

export const DIALOGUE_SCENARIOS: DialogueScenario[] = [
  {
    id: 'gentle-recommendation',
    title: 'A difficult day',
    category: 'recommendation',
    startNodeId: 'start',
    initialState: { mood: 'sad', alcoholPreference: 'either' },
    nodes: [
      {
        id: 'start', speaker: 'customer', expression: 'worried',
        text: 'I had a difficult day. I want something refreshing.',
        thought: 'Ask a simple question. Do not treat alcohol as a solution.',
        vocabulary: [{ word: 'refreshing', meaning: 'cool and pleasant', pronunciation: '/rɪˈfreʃ.ɪŋ/' }],
        choices: [
          { id: 'na', text: 'No alcohol?', nextNodeId: 'no-alcohol', tone: 'warm', vocabulary: ['alcohol'], effects: [{ field: 'alcoholPreference', value: 'non-alcoholic' }, { field: 'trust', delta: 8 }] },
          { id: 'cocktail', text: 'A light cocktail?', nextNodeId: 'taste', tone: 'neutral', effects: [{ field: 'strength', value: 'light' }] },
          { id: 'tea', text: 'Tea or coffee?', nextNodeId: 'tea', tone: 'warm', effects: [{ field: 'alcoholPreference', value: 'non-alcoholic' }, { field: 'trust', delta: 6 }] }
        ]
      },
      { id: 'no-alcohol', speaker: 'customer', expression: 'smile', text: 'Yes, please. Something fruity.', recommendationQuery: true, effects: [{ field: 'taste', value: 'fruity' }], choices: [{ id: 'restart', text: 'I have an idea.', nextNodeId: 'done', effects: [{ field: 'satisfaction', delta: 12 }] }] },
      { id: 'taste', speaker: 'bartender', expression: 'thinking', text: 'What taste do you like?', choices: [
        { id: 'sweet', text: 'Sweet', nextNodeId: 'ready', effects: [{ field: 'taste', value: 'sweet' }] },
        { id: 'sour', text: 'Sour', nextNodeId: 'ready', effects: [{ field: 'taste', value: 'sour' }] },
        { id: 'fruity', text: 'Fruity', nextNodeId: 'ready', effects: [{ field: 'taste', value: 'fruity' }] }
      ] },
      { id: 'tea', speaker: 'customer', expression: 'happy', text: 'Iced tea sounds good.', recommendationQuery: true, choices: [{ id: 'great', text: 'Coming right up.', nextNodeId: 'done', effects: [{ field: 'satisfaction', delta: 10 }] }] },
      { id: 'ready', speaker: 'customer', expression: 'smile', text: 'That sounds perfect.', recommendationQuery: true, choices: [{ id: 'make', text: 'I will make it.', nextNodeId: 'done', effects: [{ field: 'satisfaction', delta: 12 }] }] },
      { id: 'done', speaker: 'customer', expression: 'very-happy', text: 'Thank you for listening.' }
    ]
  },
  {
    id: 'cigar-evening', title: 'Balcony evening', category: 'cigar', startNodeId: 'start',
    nodes: [
      { id: 'start', speaker: 'customer', expression: 'thinking', text: 'I like a cigar on my balcony in the evening.', choices: [
        { id: 'body', text: 'Is it mild, medium, or full?', nextNodeId: 'body' },
        { id: 'na', text: 'Would you like a non-alcoholic option?', nextNodeId: 'na', effects: [{ field: 'alcoholPreference', value: 'non-alcoholic' }] }
      ] },
      { id: 'body', speaker: 'customer', text: 'Medium. I notice coffee and wood.', recommendationQuery: true, effects: [{ field: 'cigarBody', value: 'medium' }, { field: 'cigarNotes', value: 'coffee' }], choices: [{ id: 'recommend', text: 'Show a pairing.', nextNodeId: 'done' }] },
      { id: 'na', speaker: 'customer', expression: 'impressed', text: 'Yes. Sparkling water or coffee could work.', recommendationQuery: true, choices: [{ id: 'recommend-na', text: 'Show both.', nextNodeId: 'done' }] },
      { id: 'done', speaker: 'customer', expression: 'happy', text: 'That is a thoughtful recommendation.' }
    ]
  },
  {
    id: 'too-strong', title: 'Too strong', category: 'service', startNodeId: 'start',
    initialState: { mood: 'impatient', patience: 42 },
    nodes: [
      { id: 'start', speaker: 'customer', expression: 'annoyed', text: 'This drink is too strong.', vocabulary: [{ word: 'strong', meaning: 'with a lot of alcohol' }], choices: [
        { id: 'replace', text: 'I’m sorry. I can make a new one.', nextNodeId: 'replace', tone: 'warm', effects: [{ field: 'trust', delta: 12 }, { field: 'satisfaction', delta: 10 }] },
        { id: 'soda', text: 'I can add more soda.', nextNodeId: 'soda', effects: [{ field: 'satisfaction', delta: 5 }] },
        { id: 'explain', text: 'Let me explain the recipe.', nextNodeId: 'explain', tone: 'direct', effects: [{ field: 'patience', delta: -8 }] }
      ] },
      { id: 'replace', speaker: 'customer', expression: 'smile', text: 'Thank you. A lighter one, please.' },
      { id: 'soda', speaker: 'customer', expression: 'neutral', text: 'Okay. Please make it lighter.' },
      { id: 'explain', speaker: 'customer', expression: 'disappointed', text: 'I understand, but I still need help.' }
    ]
  }
];
