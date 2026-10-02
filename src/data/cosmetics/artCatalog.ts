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

// The Circle has its own cast. These IDs are excluded from ordinary customer rolls.
export const COMPANION_ART: CharacterArtDefinition[] = [
  ['mirelle', 'Mirelle', 'female', 'straight', '#b98c70'],
  ['kellan', 'Kellan', 'male', 'broad', '#c99b7b'],
  ['solen', 'Solen', 'neutral', 'straight', '#d0a184'],
  ['nadia', 'Nadia', 'female', 'straight', '#c9a184'],
  ['bram', 'Bram', 'male', 'broad', '#d0a084'],
  ['yara', 'Ingrid', 'female', 'soft', '#d4aa8c'],
  ['tobin', 'Tobin', 'male', 'straight', '#d1a487'],
  ['celeste', 'Celeste', 'female', 'straight', '#d1a58f'],
  ['neri', 'Neri', 'neutral', 'straight', '#d7ab8c'],
  ['aveline', 'Aveline', 'female', 'soft', '#c99a7a'],
  ['soren', 'Soren', 'male', 'straight', '#c89a7e'],
  ['lumi', 'Lumi', 'female', 'soft', '#d8a887'],
  ['gideon', 'Gideon', 'male', 'broad', '#caa486'],
  ['paloma', 'Petra', 'female', 'straight', '#c99a80'],
  ['cassian', 'Cassian', 'male', 'straight', '#bb9278']
].map(([id, name, presentation, body, skinTone]) => ({
  id, name, presentation: presentation as CharacterArtDefinition['presentation'],
  body: body as CharacterArtDefinition['body'], skinTone,
  asset: `/assets/characters/companions/${id}.webp`
}));

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
  ...COMPANION_ART,
  { id: 'noa', name: 'Noa', presentation: 'female', body: 'straight', skinTone: '#ead4c3', sheet:'/assets/characters/bartender/noa-natural-atlas-v2.webp',specialSheets:['/assets/characters/bartender/noa-special-a-v1.webp','/assets/characters/bartender/noa-special-b-v1.webp'],columns:6,rows:3,castIndex:0 },
  { id: 'leo', name: 'Leo', presentation: 'male', body: 'broad', skinTone: '#e5cbb7', sheet:'/assets/characters/bartender/leo-natural-atlas-v2.webp',specialSheets:['/assets/characters/bartender/leo-special-a-v1.webp','/assets/characters/bartender/leo-special-b-v1.webp'],columns:6,rows:3,castIndex:0 }
];

const COMPANION_IDS = new Set(COMPANION_ART.map((art) => art.id));
export const CUSTOMER_ART_BY_SLOT = CHARACTER_ART.filter((art) => !['noa','leo'].includes(art.id) && !COMPANION_IDS.has(art.id)).map((art) => art.id);

// Where each seated guest's figure ends inside its sprite frame (% of frame height, measured from the art's
// alpha). The sheets were drawn with different baselines, so guests are shifted down to one common seat line.
export const GUEST_FIGURE_BOTTOM: Record<string, number> = {
  marin: 88.7, kai: 87, remy: 87.2, ana: 87.2, theo: 83.8,
  imani: 96.4, owen: 95.8, vera: 94.4, eli: 95.4, leila: 94.6, felix: 86.9, hana: 84.3, andre: 83.9, rosa: 85.1, marco: 86.1,
  sora: 93, priya: 92.8, amara: 92.8, rowan: 93, mateo: 93, zahra: 85.7, kenji: 85.7, raven: 85.1, niko: 86.3, edith: 86.3
};
export const GUEST_SEAT_LINE = 96;
