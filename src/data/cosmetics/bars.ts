import type { RegionId } from '../../domain/types';

export const INTERIORS = [
  { id:'velvet',name:'Velvet lounge',asset:'/assets/bar/backgrounds/velvet-hour-bar.png',tint:'#2d0d1e55',position:'center',blend:'multiply' },
  { id:'garden',name:'Botanical room',asset:'/assets/bar/backgrounds/botanical-room.png',tint:'#123d2b44',position:'center',blend:'multiply' },
  { id:'skyline',name:'Skyline lounge',asset:'/assets/bar/backgrounds/skyline-lounge.png',tint:'#101d4655',position:'center',blend:'multiply' },
  { id:'speakeasy',name:'Secret speakeasy',asset:'/assets/bar/backgrounds/velvet-hour-bar.png',tint:'#17100b88',position:'38% center',blend:'multiply' },
  { id:'jazz-cellar',name:'Midnight jazz cellar',asset:'/assets/bar/backgrounds/velvet-hour-bar.png',tint:'#32143777',position:'62% center',blend:'color-burn' },
  { id:'art-deco',name:'Golden Art Deco',asset:'/assets/bar/backgrounds/velvet-hour-bar.png',tint:'#6b4a1255',position:'center top',blend:'soft-light' },
  { id:'library',name:'Private library',asset:'/assets/bar/backgrounds/velvet-hour-bar.png',tint:'#3b241777',position:'left center',blend:'multiply' },
  { id:'palace',name:'Champagne palace',asset:'/assets/bar/backgrounds/velvet-hour-bar.png',tint:'#8c704744',position:'right center',blend:'screen' },
  { id:'tropical',name:'Tropical greenhouse',asset:'/assets/bar/backgrounds/botanical-room.png',tint:'#0d5a3d44',position:'left center',blend:'soft-light' },
  { id:'desert',name:'Desert sunset bar',asset:'/assets/bar/backgrounds/botanical-room.png',tint:'#9c4d2655',position:'right center',blend:'color' },
  { id:'winter',name:'Winter conservatory',asset:'/assets/bar/backgrounds/botanical-room.png',tint:'#b7d9e855',position:'center top',blend:'screen' },
  { id:'beach',name:'Beach club',asset:'/assets/bar/backgrounds/botanical-room.png',tint:'#1d8b9a44',position:'center bottom',blend:'color' },
  { id:'rooftop',name:'Metropolitan rooftop',asset:'/assets/bar/backgrounds/skyline-lounge.png',tint:'#25345b44',position:'left center',blend:'multiply' },
  { id:'cyberpunk',name:'Cyberpunk night',asset:'/assets/bar/backgrounds/skyline-lounge.png',tint:'#a0008655',position:'right center',blend:'color-dodge' },
  { id:'izakaya',name:'Lantern izakaya',asset:'/assets/bar/backgrounds/skyline-lounge.png',tint:'#8b251d55',position:'center bottom',blend:'color' },
  { id:'marina',name:'Midnight marina',asset:'/assets/bar/backgrounds/skyline-lounge.png',tint:'#073e5f66',position:'left bottom',blend:'multiply' },
  { id:'parisian',name:'Parisian salon',asset:'/assets/bar/backgrounds/velvet-hour-bar.png',tint:'#713f5e44',position:'right top',blend:'soft-light' },
  { id:'loft',name:'Industrial loft',asset:'/assets/bar/backgrounds/skyline-lounge.png',tint:'#4a4f5266',position:'center top',blend:'saturation' }
] as const;

export type InteriorId = typeof INTERIORS[number]['id'];
export const WALLS = ['neon','burgundy','emerald','navy','plum','charcoal','ivory','terracotta'] as const;
export const COUNTER_MATERIALS = ['classic','marble','brass','obsidian','walnut','terrazzo','steel','glass'] as const;
export const COUNTER_COLORS = ['espresso','ruby','ivory','gold','emerald','navy','plum','smoke'] as const;
export const COUNTER_SIZES = ['slim','standard','grand'] as const;
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
  lighting:HIGHLIGHTS,highlightStrength:HIGHLIGHT_STRENGTHS,bartenderCharacter:['noa','leo'] as const,
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
}

const femaleStyle = { face:'soft',hairStyle:'updo',hairColor:'espresso',bodyShape:'curvy',skinDetail:'clean',bust:'balanced',pose:'confident',makeup:'natural' } as const;
const maleStyle = { face:'angular',hairStyle:'slick',hairColor:'chestnut',bodyShape:'muscular',skinDetail:'tattoo-bold',bust:'balanced',pose:'relaxed',makeup:'none' } as const;
export const DEFAULT_BARS: Record<RegionId, BarProfile> = {
  'new-york': { name:'The Velvet Hour',wall:'neon',counter:'classic',counterColor:'ruby',counterSize:'standard',lighting:'amber',highlightStrength:'medium',bartenderCharacter:'noa',bartenderNickname:'Noa',bartender:'vest',interior:'velvet',...femaleStyle },
  london: { name:'Juniper & Oak',wall:'emerald',counter:'walnut',counterColor:'espresso',counterSize:'grand',lighting:'amber',highlightStrength:'soft',bartenderCharacter:'leo',bartenderNickname:'Leo',bartender:'shirt',interior:'garden',...maleStyle },
  berlin: { name:'Midnight Studio',wall:'charcoal',counter:'steel',counterColor:'smoke',counterSize:'slim',lighting:'blue',highlightStrength:'bright',bartenderCharacter:'noa',bartenderNickname:'Noa',bartender:'apron',interior:'loft',...femaleStyle,hairColor:'black',pose:'hip' },
  tashkent: { name:'Silk Road Social',wall:'terracotta',counter:'brass',counterColor:'gold',counterSize:'standard',lighting:'amber',highlightStrength:'medium',bartenderCharacter:'leo',bartenderNickname:'Leo',bartender:'vest',interior:'desert',...maleStyle,hairColor:'black' },
  bucharest: { name:'The Amber Room',wall:'burgundy',counter:'brass',counterColor:'plum',counterSize:'grand',lighting:'rose',highlightStrength:'medium',bartenderCharacter:'noa',bartenderNickname:'Noa',bartender:'vest',interior:'speakeasy',...femaleStyle,hairColor:'copper',makeup:'smoky' },
  tokyo: { name:'Blue Lantern',wall:'navy',counter:'obsidian',counterColor:'navy',counterSize:'slim',lighting:'blue',highlightStrength:'bright',bartenderCharacter:'leo',bartenderNickname:'Leo',bartender:'apron',interior:'izakaya',...maleStyle,hairStyle:'undercut',skinDetail:'tattoo-light' }
};

export function interiorStyle(id: InteriorId) {
  const item = INTERIORS.find((entry) => entry.id === id) ?? INTERIORS[0];
  return {
    backgroundImage:`linear-gradient(${item.tint},${item.tint}),url('${item.asset}')`,
    backgroundPosition:item.position,
    backgroundBlendMode:`${item.blend},normal`
  };
}

export const CITY_COORDINATES: Record<RegionId,[number,number]> = {
  'new-york':[-74.01,40.71],london:[-.13,51.51],berlin:[13.4,52.52],tashkent:[69.24,41.3],bucharest:[26.1,44.43],tokyo:[139.69,35.69]
};
