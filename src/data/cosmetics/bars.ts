import type { RegionId } from '../../domain/types';

export const INTERIORS = [
  { id:'velvet',name:'Velvet lounge',asset:'/assets/bar/backgrounds/velvet-hour-bar.png',tint:'#2d0d1e55',position:'center',blend:'multiply',crystalCost:0 },
  { id:'garden',name:'Botanical room',asset:'/assets/bar/backgrounds/botanical-room.png',tint:'#123d2b44',position:'center',blend:'multiply',crystalCost:350 },
  { id:'skyline',name:'Skyline lounge',asset:'/assets/bar/backgrounds/skyline-lounge.png',tint:'#101d4655',position:'center',blend:'multiply',crystalCost:450 },
  { id:'inferno-penthouse',name:'Midnight Penthouse',asset:'/assets/bar/backgrounds/inferno-penthouse-club.png',tint:'#25071322',position:'center',blend:'multiply',special:true,crystalCost:3500 },
  { id:'speakeasy',name:'Secret speakeasy',asset:'/assets/bar/backgrounds/interior-speakeasy.webp',tint:'#21130b33',position:'center 62%',blend:'multiply',crystalCost:550 },
  { id:'jazz-cellar',name:'Midnight jazz cellar',asset:'/assets/bar/backgrounds/interior-jazz-cellar.webp',tint:'#25122633',position:'center 62%',blend:'multiply',crystalCost:650 },
  { id:'art-deco',name:'Golden Art Deco',asset:'/assets/bar/backgrounds/interior-art-deco.webp',tint:'#5e431511',position:'center 62%',blend:'soft-light',crystalCost:800 },
  { id:'library',name:'Private library',asset:'/assets/bar/backgrounds/interior-library.webp',tint:'#26160d22',position:'center 62%',blend:'multiply',crystalCost:950 },
  { id:'palace',name:'Champagne palace',asset:'/assets/bar/backgrounds/interior-palace.webp',tint:'#fff4dc11',position:'center 62%',blend:'screen',crystalCost:1250 },
  { id:'tropical',name:'Tropical greenhouse',asset:'/assets/bar/backgrounds/interior-tropical.webp',tint:'#0a3b1d11',position:'center 62%',blend:'multiply',crystalCost:1050 },
  { id:'desert',name:'Desert sunset bar',asset:'/assets/bar/backgrounds/interior-desert.webp',tint:'#8d3f1711',position:'center 62%',blend:'color',crystalCost:1150 },
  { id:'winter',name:'Winter conservatory',asset:'/assets/bar/backgrounds/interior-winter.webp',tint:'#dff7ff18',position:'center 62%',blend:'screen',crystalCost:1400 },
  { id:'beach',name:'Beach club',asset:'/assets/bar/backgrounds/interior-beach.webp',tint:'#8ddde511',position:'center 62%',blend:'soft-light',crystalCost:1500 },
  { id:'rooftop',name:'Metropolitan rooftop',asset:'/assets/bar/backgrounds/interior-rooftop.webp',tint:'#10182d22',position:'center 62%',blend:'multiply',crystalCost:1800 },
  { id:'cyberpunk',name:'Cyberpunk night',asset:'/assets/bar/backgrounds/interior-cyberpunk.webp',tint:'#9c087122',position:'center 62%',blend:'color-dodge',crystalCost:2200 },
  { id:'izakaya',name:'Lantern izakaya',asset:'/assets/bar/backgrounds/interior-izakaya.webp',tint:'#7c241411',position:'center 62%',blend:'color',crystalCost:1650 },
  { id:'marina',name:'Midnight marina',asset:'/assets/bar/backgrounds/interior-marina.webp',tint:'#082a4818',position:'center 62%',blend:'multiply',crystalCost:1950 },
  { id:'parisian',name:'Parisian salon',asset:'/assets/bar/backgrounds/interior-parisian.webp',tint:'#713f5e11',position:'center 62%',blend:'soft-light',crystalCost:2500 },
  { id:'loft',name:'Industrial loft',asset:'/assets/bar/backgrounds/interior-loft.webp',tint:'#343a3e18',position:'center 62%',blend:'saturation',crystalCost:1300 },
  { id:'riad',name:'Moroccan riad',asset:'/assets/bar/backgrounds/interior-riad.webp',tint:'#5a1f0c11',position:'center 62%',blend:'soft-light',crystalCost:2100 }
] as const;

export type InteriorId = typeof INTERIORS[number]['id'];
export const WALLS = ['neon','burgundy','emerald','navy','plum','charcoal','ivory','terracotta'] as const;
export const COUNTER_MATERIALS = ['classic','marble','brass','obsidian','walnut','terrazzo','steel','glass'] as const;
export const COUNTER_COLORS = ['espresso','ruby','ivory','gold','emerald','navy','plum','smoke'] as const;
export const COUNTER_SIZES = ['slim','standard','grand'] as const;
// Back-bar cabinet looks. 'auto' follows the background (see shelfStyleFor).
export const SHELF_STYLES = ['auto','walnut','brass','glass','neon','marble','bamboo','rustic'] as const;
export type ShelfStyle = Exclude<typeof SHELF_STYLES[number], 'auto'>;
const SHELF_FOR_INTERIOR: Partial<Record<string, ShelfStyle>> = {
  velvet:'walnut', garden:'bamboo', skyline:'glass', 'inferno-penthouse':'neon', speakeasy:'rustic', 'jazz-cellar':'walnut', 'art-deco':'brass', library:'walnut',
  palace:'marble', tropical:'bamboo', desert:'rustic', winter:'glass', beach:'bamboo', rooftop:'glass', cyberpunk:'neon', izakaya:'rustic', marina:'walnut', parisian:'marble', loft:'rustic', riad:'brass'
};
export function shelfStyleFor(profile: Pick<BarProfile, 'interior'> & { shelf?: typeof SHELF_STYLES[number] }): ShelfStyle {
  return profile.shelf && profile.shelf !== 'auto' ? profile.shelf : SHELF_FOR_INTERIOR[profile.interior] ?? 'walnut';
}
export const HIGHLIGHTS = ['amber','rose','blue','violet','emerald','ice'] as const;
export const HIGHLIGHT_STRENGTHS = ['soft','medium','bright'] as const;
export const BARTENDER_FACES = ['classic','soft','angular','heart','oval','mature'] as const;
export const HAIR_STYLES = ['updo','waves','bob','ponytail','braids','slick','short','undercut'] as const;
export const HAIR_COLORS = ['espresso','black','chestnut','copper','blonde','platinum','red','blue','pink'] as const;
export const BODY_SHAPES = ['slim','athletic','curvy','muscular','broad'] as const;
export const SKIN_DETAILS = ['clean','freckles','tattoo-light','tattoo-bold','scar-brow','scar-cheek'] as const;
export const BUST_OPTIONS = ['petite','balanced','full'] as const;
export const POSES = ['neutral','confident','relaxed','lean','hip','crossed'] as const;
export const MAKEUP_OPTIONS = ['none','natural','smoky','red-lip','gold','neon'] as const;
export const BAR_PROFILE_OPTIONS = {
  wall:WALLS,counter:COUNTER_MATERIALS,counterColor:COUNTER_COLORS,counterSize:COUNTER_SIZES,
  lighting:HIGHLIGHTS,highlightStrength:HIGHLIGHT_STRENGTHS,shelf:SHELF_STYLES,bartenderCharacter:['noa','leo'] as const,
  bartender:['vest','shirt','apron'] as const,interior:INTERIORS.map((item) => item.id),face:BARTENDER_FACES,
  hairStyle:HAIR_STYLES,hairColor:HAIR_COLORS,bodyShape:BODY_SHAPES,skinDetail:SKIN_DETAILS,
  bust:BUST_OPTIONS,pose:POSES,makeup:MAKEUP_OPTIONS
} as const;

export interface BarProfile {
  name: string;
  wall: typeof WALLS[number];
  counter: typeof COUNTER_MATERIALS[number];
  counterColor: typeof COUNTER_COLORS[number];
  counterSize: typeof COUNTER_SIZES[number];
  lighting: typeof HIGHLIGHTS[number];
  highlightStrength: typeof HIGHLIGHT_STRENGTHS[number];
  bartenderCharacter: 'noa' | 'leo';
  bartenderNickname: string;
  bartender: 'vest' | 'shirt' | 'apron';
  interior: InteriorId;
  face: typeof BARTENDER_FACES[number];
  hairStyle: typeof HAIR_STYLES[number];
  hairColor: typeof HAIR_COLORS[number];
  bodyShape: typeof BODY_SHAPES[number];
  skinDetail: typeof SKIN_DETAILS[number];
  bust: typeof BUST_OPTIONS[number];
  pose: typeof POSES[number];
  makeup: typeof MAKEUP_OPTIONS[number];
  // Back-bar cabinet; missing or 'auto' follows the background.
  shelf?: typeof SHELF_STYLES[number];
}

const femaleStyle = { face:'soft',hairStyle:'updo',hairColor:'espresso',bodyShape:'curvy',skinDetail:'clean',bust:'balanced',pose:'confident',makeup:'natural' } as const;
const maleStyle = { face:'angular',hairStyle:'slick',hairColor:'chestnut',bodyShape:'muscular',skinDetail:'tattoo-bold',bust:'balanced',pose:'relaxed',makeup:'none' } as const;
export const DEFAULT_BARS: Record<RegionId, BarProfile> = {
  'new-york': { name:'The Velvet Hour',wall:'neon',counter:'classic',counterColor:'ruby',counterSize:'standard',lighting:'amber',highlightStrength:'medium',bartenderCharacter:'noa',bartenderNickname:'Noa',bartender:'vest',interior:'velvet',...femaleStyle },
  london: { name:'Juniper & Oak',wall:'emerald',counter:'walnut',counterColor:'espresso',counterSize:'grand',lighting:'amber',highlightStrength:'soft',bartenderCharacter:'leo',bartenderNickname:'Leo',bartender:'shirt',interior:'velvet',...maleStyle },
  berlin: { name:'Midnight Studio',wall:'charcoal',counter:'steel',counterColor:'smoke',counterSize:'slim',lighting:'blue',highlightStrength:'bright',bartenderCharacter:'noa',bartenderNickname:'Noa',bartender:'apron',interior:'velvet',...femaleStyle,hairColor:'black',pose:'hip' },
  tashkent: { name:'Silk Road Social',wall:'terracotta',counter:'brass',counterColor:'gold',counterSize:'standard',lighting:'amber',highlightStrength:'medium',bartenderCharacter:'leo',bartenderNickname:'Leo',bartender:'vest',interior:'velvet',...maleStyle,hairColor:'black' },
  bucharest: { name:'The Amber Room',wall:'burgundy',counter:'brass',counterColor:'plum',counterSize:'grand',lighting:'rose',highlightStrength:'medium',bartenderCharacter:'noa',bartenderNickname:'Noa',bartender:'vest',interior:'velvet',...femaleStyle,hairColor:'copper',makeup:'smoky' },
  tokyo: { name:'Blue Lantern',wall:'navy',counter:'obsidian',counterColor:'navy',counterSize:'slim',lighting:'blue',highlightStrength:'bright',bartenderCharacter:'leo',bartenderNickname:'Leo',bartender:'apron',interior:'velvet',...maleStyle,hairStyle:'undercut',skinDetail:'tattoo-light' }
};

export function interiorStyle(id: InteriorId) {
  const item = INTERIORS.find((entry) => entry.id === id) ?? INTERIORS[0];
  const atlas = 'atlas' in item && item.atlas;
  return {
    backgroundImage:`linear-gradient(${item.tint},${item.tint}),url('${item.asset}')`,
    backgroundPosition:`center, ${item.position}`,
    backgroundSize:atlas ? '100% 100%, 200% 200%' : '100% 100%, cover',
    '--interior-background-size':atlas ? '100% 100%, 200% 200%' : '100% 100%, cover',
    '--interior-background-position':`center, ${item.position}`,
    backgroundRepeat:'no-repeat',
    backgroundBlendMode:`${item.blend},normal`
  };
}

export const CITY_COORDINATES: Record<RegionId,[number,number]> = {
  'new-york':[-74.01,40.71],london:[-.13,51.51],berlin:[13.4,52.52],tashkent:[69.24,41.3],bucharest:[26.1,44.43],tokyo:[139.69,35.69]
};
