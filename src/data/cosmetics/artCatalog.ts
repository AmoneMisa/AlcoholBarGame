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
  specialSheets?: string[];
}

export const CHARACTER_ART: CharacterArtDefinition[] = [
  { id: 'marin', name: 'Marin', presentation: 'female', body: 'soft', skinTone: '#d99a78', castIndex: 0, sheet:'/assets/characters/customers/velvet-hour-seated-cast-v2.webp', columns:5, rows:1 },
  { id: 'kai', name: 'Kai', presentation: 'male', body: 'broad', skinTone: '#b97854', castIndex: 1, sheet:'/assets/characters/customers/velvet-hour-seated-cast-v2.webp', columns:5, rows:1 },
  { id: 'remy', name: 'Remy', presentation: 'neutral', body: 'straight', skinTone: '#d29372', castIndex: 2, sheet:'/assets/characters/customers/velvet-hour-seated-cast-v2.webp', columns:5, rows:1 },
  { id: 'ana', name: 'Ana', presentation: 'female', body: 'straight', skinTone: '#c98669', castIndex: 3, sheet:'/assets/characters/customers/velvet-hour-seated-cast-v2.webp', columns:5, rows:1 },
  { id: 'theo', name: 'Theo', presentation: 'male', body: 'broad', skinTone: '#a96c4c', castIndex: 4, sheet:'/assets/characters/customers/velvet-hour-seated-cast-v2.webp', columns:5, rows:1 },
  ...[
    ['imani','Imani','female','soft','#89553c'],['owen','Owen','male','broad','#db9973'],['vera','Vera','female','straight','#dcac89'],['eli','Eli','neutral','straight','#a36b49'],['leila','Leila','female','soft','#b47e58'],
    ['felix','Felix','male','straight','#d9ac88'],['hana','Hana','female','straight','#e1b994'],['andre','André','male','broad','#754932'],['rosa','Rosa','female','soft','#b18c6a'],['marco','Marco','male','broad','#c28a64']
  ].map(([id,name,presentation,body,skinTone],castIndex) => ({ id,name,presentation:presentation as CharacterArtDefinition['presentation'],body:body as CharacterArtDefinition['body'],skinTone,castIndex,sheet:'/assets/characters/customers/extended-seated-cast-v2.webp',columns:5,rows:2 })),
  ...[
    ['sora','Sora','male','straight','#d0a17f'],['priya','Priya','female','soft','#a86646'],['amara','Amara','female','straight','#8b553d'],['rowan','Rowan','neutral','straight','#e2a37f'],['mateo','Mateo','male','broad','#b87853'],
    ['zahra','Zahra','female','straight','#bd805b'],['kenji','Kenji','male','broad','#b78462'],['raven','Raven','female','straight','#dfb293'],['niko','Niko','neutral','broad','#75472f'],['edith','Edith','female','soft','#d6a07f']
  ].map(([id,name,presentation,body,skinTone],castIndex) => ({ id,name,presentation:presentation as CharacterArtDefinition['presentation'],body:body as CharacterArtDefinition['body'],skinTone,castIndex,sheet:'/assets/characters/customers/extended-seated-cast-2-v2.webp',columns:5,rows:2 })),
  { id: 'noa', name: 'Noa', presentation: 'female', body: 'straight', skinTone: '#a86643', sheet:'/assets/characters/bartender/noa-wardrobe-v3.webp',specialSheets:['/assets/characters/bartender/noa-special-a-v1.webp','/assets/characters/bartender/noa-special-b-v1.webp'],columns:3,rows:3,castIndex:0 },
  { id: 'leo', name: 'Leo', presentation: 'male', body: 'broad', skinTone: '#a96f4d', sheet:'/assets/characters/bartender/leo-wardrobe-v7.webp',specialSheets:['/assets/characters/bartender/leo-special-a-v1.webp','/assets/characters/bartender/leo-special-b-v1.webp'],columns:3,rows:3,castIndex:0 }
];

export const CUSTOMER_ART_BY_SLOT = CHARACTER_ART.filter((art) => !['noa','leo'].includes(art.id)).map((art) => art.id);

// Where each seated guest's figure ends inside its sprite frame (% of frame height, measured from the art's
// alpha). The sheets were drawn with different baselines, so guests are shifted down to one common seat line.
export const GUEST_FIGURE_BOTTOM: Record<string, number> = {
  marin: 88.7, kai: 87, remy: 87.2, ana: 87.2, theo: 83.8,
  imani: 96.4, owen: 95.8, vera: 94.4, eli: 95.4, leila: 94.6, felix: 86.9, hana: 84.3, andre: 83.9, rosa: 85.1, marco: 86.1,
  sora: 93, priya: 92.8, amara: 92.8, rowan: 93, mateo: 93, zahra: 85.7, kenji: 85.7, raven: 85.1, niko: 86.3, edith: 86.3
};
export const GUEST_SEAT_LINE = 96;
