export interface CharacterArtDefinition {
  id: string;
  name: string;
  presentation: 'female' | 'male' | 'neutral';
  body: 'soft' | 'straight' | 'broad';
  skinTone: string;
  castIndex?: number;
  asset?: string;
}

export const CHARACTER_ART: CharacterArtDefinition[] = [
  { id: 'marin', name: 'Marin', presentation: 'female', body: 'soft', skinTone: '#d99a78', castIndex: 0 },
  { id: 'kai', name: 'Kai', presentation: 'male', body: 'broad', skinTone: '#b97854', castIndex: 1 },
  { id: 'remy', name: 'Remy', presentation: 'neutral', body: 'straight', skinTone: '#d29372', castIndex: 2 },
  { id: 'ana', name: 'Ana', presentation: 'female', body: 'straight', skinTone: '#c98669', castIndex: 3 },
  { id: 'theo', name: 'Theo', presentation: 'male', body: 'broad', skinTone: '#a96c4c', castIndex: 4 },
  { id: 'noa', name: 'Noa', presentation: 'neutral', body: 'straight', skinTone: '#a86643', asset: '/assets/characters/bartender/noa.png' }
];

export const CUSTOMER_ART_BY_SLOT = ['marin', 'kai', 'remy', 'ana', 'theo'];
