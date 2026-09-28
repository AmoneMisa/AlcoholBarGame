import type { Mood } from '../types';

export type DialogueSpeaker = 'customer' | 'bartender' | 'system';
export type CharacterExpression =
  | 'neutral' | 'happy' | 'smile' | 'very-happy' | 'sad' | 'worried'
  | 'angry' | 'annoyed' | 'impatient' | 'confused' | 'thinking'
  | 'surprised' | 'embarrassed' | 'disappointed' | 'impressed';

export interface DialogueState {
  recipient?: string;
  occasion?: string;
  taste?: string;
  strength?: string;
  budget?: string;
  food?: string;
  favoriteDrink?: string;
  alcoholPreference?: 'alcoholic' | 'non-alcoholic' | 'either';
  cigarBody?: 'mild' | 'medium' | 'full';
  cigarNotes?: string;
  mood?: Mood;
  patience: number;
  trust: number;
  satisfaction: number;
}

export interface DialogueEffect {
  field: keyof DialogueState;
  value?: DialogueState[keyof DialogueState];
  delta?: number;
}

export interface DialogueChoice {
  id: string;
  text: string;
  nextNodeId?: string;
  vocabulary?: string[];
  effects?: DialogueEffect[];
  tone?: 'warm' | 'neutral' | 'direct';
}

export interface DialogueNode {
  id: string;
  speaker: DialogueSpeaker;
  text: string;
  thought?: string;
  expression?: CharacterExpression;
  choices?: DialogueChoice[];
  effects?: DialogueEffect[];
  vocabulary?: VocabularyEntry[];
  recommendationQuery?: boolean;
}

export interface VocabularyEntry {
  word: string;
  meaning: string;
  pronunciation?: string;
  learned?: boolean;
}

export interface DialogueScenario {
  id: string;
  title: string;
  category: 'recommendation' | 'service' | 'cigar' | 'gift';
  startNodeId: string;
  nodes: DialogueNode[];
  initialState?: Partial<DialogueState>;
}
