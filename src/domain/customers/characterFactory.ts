export type Presentation = 'female' | 'male' | 'neutral';
export type BodySilhouette = 'soft' | 'straight' | 'broad';

export interface CharacterLook {
  body: BodySilhouette;
  presentation: Presentation;
  skin: 'porcelain' | 'warm' | 'olive' | 'brown' | 'deep';
  face: 'oval' | 'round' | 'angular';
  eyes: 'soft' | 'bright' | 'hooded';
  eyebrows: 'arched' | 'straight' | 'bold';
  nose: 'small' | 'straight' | 'broad';
  mouth: 'soft' | 'wide' | 'defined';
  hair: 'waves' | 'crop' | 'undercut' | 'bob' | 'silver';
  facialHair: 'none' | 'stubble' | 'beard';
  top: 'blouse' | 'knit' | 'shirt';
  jacket: 'none' | 'casual' | 'business';
  apron: 'none' | 'short' | 'full';
  jewelry: 'none' | 'hoops' | 'pendant';
  glasses: 'none' | 'round' | 'angular';
  hat: 'none' | 'beanie' | 'fedora';
  vip: 'none' | 'pin' | 'chain';
}

const options = {
  body: ['soft', 'straight', 'broad'], presentation: ['female', 'male', 'neutral'], skin: ['porcelain', 'warm', 'olive', 'brown', 'deep'],
  face: ['oval', 'round', 'angular'], eyes: ['soft', 'bright', 'hooded'], eyebrows: ['arched', 'straight', 'bold'], nose: ['small', 'straight', 'broad'], mouth: ['soft', 'wide', 'defined'],
  hair: ['waves', 'crop', 'undercut', 'bob', 'silver'], facialHair: ['none', 'stubble', 'beard'], top: ['blouse', 'knit', 'shirt'], jacket: ['none', 'casual', 'business'], apron: ['none', 'short', 'full'],
  jewelry: ['none', 'hoops', 'pendant'], glasses: ['none', 'round', 'angular'], hat: ['none', 'beanie', 'fedora'], vip: ['none', 'pin', 'chain']
} as const;

function hash(value: string) {
  let result = 2166136261;
  for (const char of value) result = Math.imul(result ^ char.charCodeAt(0), 16777619);
  return result >>> 0;
}

export function createCharacterLook(seed: string): CharacterLook {
  let cursor = hash(seed);
  const pick = <T extends readonly string[]>(items: T): T[number] => {
    cursor = Math.imul(cursor ^ (cursor >>> 13), 1274126177) >>> 0;
    return items[cursor % items.length]!;
  };
  return {
    body: pick(options.body), presentation: pick(options.presentation), skin: pick(options.skin), face: pick(options.face),
    eyes: pick(options.eyes), eyebrows: pick(options.eyebrows), nose: pick(options.nose), mouth: pick(options.mouth), hair: pick(options.hair),
    facialHair: pick(options.facialHair), top: pick(options.top), jacket: pick(options.jacket), apron: pick(options.apron), jewelry: pick(options.jewelry),
    glasses: pick(options.glasses), hat: pick(options.hat), vip: pick(options.vip)
  };
}
