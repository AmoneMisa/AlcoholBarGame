export interface CharacterArtDefinition {
  id: string;
  name: string;
  presentation: 'female' | 'male' | 'neutral';
  body: 'soft' | 'straight' | 'broad';
  skinTone: string;
  castIndex?: number;
  asset?: string;
  sheet?: string;
  columns?: number;
  rows?: number;
}

export const CHARACTER_ART: CharacterArtDefinition[] = [
  { id: 'marin', name: 'Marin', presentation: 'female', body: 'soft', skinTone: '#d99a78', castIndex: 0 },
  { id: 'kai', name: 'Kai', presentation: 'male', body: 'broad', skinTone: '#b97854', castIndex: 1 },
  { id: 'remy', name: 'Remy', presentation: 'neutral', body: 'straight', skinTone: '#d29372', castIndex: 2 },
  { id: 'ana', name: 'Ana', presentation: 'female', body: 'straight', skinTone: '#c98669', castIndex: 3 },
  { id: 'theo', name: 'Theo', presentation: 'male', body: 'broad', skinTone: '#a96c4c', castIndex: 4 },
  ...[
    ['imani','Imani','female','soft','#89553c'],['owen','Owen','male','broad','#db9973'],['vera','Vera','female','straight','#dcac89'],['eli','Eli','neutral','straight','#a36b49'],['leila','Leila','female','soft','#b47e58'],
    ['felix','Felix','male','straight','#d9ac88'],['hana','Hana','female','straight','#e1b994'],['andre','André','male','broad','#754932'],['rosa','Rosa','female','soft','#b18c6a'],['marco','Marco','male','broad','#c28a64']
  ].map(([id,name,presentation,body,skinTone],castIndex) => ({ id,name,presentation:presentation as CharacterArtDefinition['presentation'],body:body as CharacterArtDefinition['body'],skinTone,castIndex,sheet:'/assets/characters/customers/extended-cast.png',columns:5,rows:2 })),
  { id: 'noa', name: 'Noa', presentation: 'female', body: 'straight', skinTone: '#a86643', sheet:'/assets/characters/bartender/noa-wardrobe.png',columns:3,rows:1,castIndex:0 }
];

export const CUSTOMER_ART_BY_SLOT = CHARACTER_ART.filter((art) => art.id !== 'noa').map((art) => art.id);
