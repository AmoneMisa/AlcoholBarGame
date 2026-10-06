import type { RegionId } from '../../domain/types';
import { REFERENCE_COSTUME_IDS } from './bartenderCostumes';
import { THEMED_INTERIORS } from './themedBars';
import { GAME_THEME_SHELVES } from './gameThemeExpansion';
import { restrictedTheme } from './themeDistribution';
import { SHELF_DECOR_PRESET_IDS, type ShelfDecorPresetId } from './shelfDecor';
import { WINDOW_BACKDROP_IDS, type WindowBackdropId } from './windowBackdrops';

// Themed backgrounds are priced from a cheap first tier up to the big ones, instead of one flat price.
const THEMED_PRICES: Record<string, number> = {
  underground: 400, fairy: 500, 'nfs-underground': 600, underwater: 750, fairytale: 900, 'nfs-carbon': 1000, 'nfs-most-wanted': 1100,
  'lost-ark': 1200, 'mass-effect': 1450, allods: 1550, 'warcraft-3': 1700, 'perfect-world': 1850, 'lineage-2': 2000
};

export const INTERIORS = [
  { id:'velvet',name:'Velvet lounge',asset:'/assets/bar/backgrounds/velvet-hour-bar.webp',tint:'#2d0d1e55',position:'center',blend:'multiply',crystalCost:0 },
  { id:'garden',name:'Botanical room',asset:'/assets/bar/backgrounds/botanical-room.webp',tint:'#123d2b44',position:'center',blend:'multiply',crystalCost:350 },
  { id:'skyline',name:'Skyline lounge',asset:'/assets/bar/backgrounds/skyline-lounge.webp',tint:'#101d4655',position:'center',blend:'multiply',crystalCost:450 },
  { id:'inferno-penthouse',name:'Midnight Penthouse',asset:'/assets/bar/backgrounds/inferno-penthouse-club.webp',tint:'#25071322',position:'center',blend:'multiply',special:true,crystalCost:3500 },
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
  { id:'riad',name:'Moroccan riad',asset:'/assets/bar/backgrounds/interior-riad.webp',tint:'#5a1f0c11',position:'center 62%',blend:'soft-light',crystalCost:2100 },
  ...THEMED_INTERIORS.map((item) => ({ ...item, crystalCost: THEMED_PRICES[item.id] ?? item.crystalCost })),
] as const;

export type InteriorId = typeof INTERIORS[number]['id'];
// The most expensive backgrounds are special-event rewards: they cannot be bought or gifted, only found in boxes
// (Gold and Choice boxes, season and leaderboard rewards). Players who already bought one keep it.
// Game backgrounds that are not a season pass: they are kept for boxes only, like the event backgrounds.
// (A game that becomes a pass season has to come off this list: see tests/pass.test.mjs.)
export const BOX_ONLY_GAME_IDS = ['cs-2', 'watch-dogs', 'sleeping-dogs', 'neighbours-from-hell', 'repo', 'among-us'] as const;
export const EVENT_INTERIOR_IDS = ['inferno-penthouse', 'parisian', 'cyberpunk', 'marina', 'rooftop', ...BOX_ONLY_GAME_IDS] as const;
// Silver and Gold boxes draw their background reward from this pool: the event backgrounds (box-only) and the
// themed ones (which can also be bought). Each background comes with its one connected style.
export const BOX_INTERIOR_IDS: readonly string[] = [...new Set<string>([...EVENT_INTERIOR_IDS, ...THEMED_INTERIORS.map((item) => item.id)])].filter(id=>!restrictedTheme(id));
export const isEventInterior = (id: string) => (EVENT_INTERIOR_IDS as readonly string[]).includes(id);
export const DUPLICATE_INTERIOR_SHARDS = 30;
export const WALLS = ['neon','burgundy','emerald','navy','plum','charcoal','ivory','terracotta'] as const;
export const COUNTER_MATERIALS = ['classic','marble','brass','obsidian','walnut','terrazzo','steel','glass'] as const;
export const COUNTER_COLORS = ['espresso','ruby','ivory','gold','emerald','navy','plum','smoke'] as const;
export const COUNTER_SIZES = ['slim','standard','grand'] as const;
export const SEAT_COUNTS = ['0','1','2','3','4','5','6'] as const;
// Back-bar cabinet looks. 'auto' follows the background (see shelfStyleFor).
export const SHELF_STYLES = ['auto','walnut','brass','glass','neon','marble','bamboo','rustic'] as const;
export type ShelfStyle = Exclude<typeof SHELF_STYLES[number], 'auto'>;
const SHELF_FOR_INTERIOR: Partial<Record<string, ShelfStyle>> = {
  ...GAME_THEME_SHELVES,
  underwater:'glass', underground:'rustic', fairy:'bamboo', fairytale:'walnut',
  'lineage-2':'brass', 'perfect-world':'marble', 'warcraft-3':'rustic', allods:'brass',
  'lost-ark':'marble', 'mass-effect':'glass', 'nfs-most-wanted':'rustic', 'nfs-carbon':'neon', 'nfs-underground':'neon',
  velvet:'walnut', garden:'bamboo', skyline:'glass', 'inferno-penthouse':'neon', speakeasy:'rustic', 'jazz-cellar':'walnut', 'art-deco':'brass', library:'walnut',
  palace:'marble', tropical:'bamboo', desert:'rustic', winter:'glass', beach:'bamboo', rooftop:'glass', cyberpunk:'neon', izakaya:'rustic', marina:'walnut', parisian:'marble', loft:'rustic', riad:'brass'
};
export function shelfStyleFor(profile: Pick<BarProfile, 'interior'> & { shelf?: typeof SHELF_STYLES[number] }): ShelfStyle {
  return profile.shelf && profile.shelf !== 'auto' ? profile.shelf : SHELF_FOR_INTERIOR[profile.interior] ?? 'walnut';
}
export const HIGHLIGHTS = ['amber','rose','blue','violet','emerald','ice'] as const;
export const HIGHLIGHT_STRENGTHS = ['soft','medium','bright'] as const;
// The face is assembled from independent, skin-tone-neutral parts.  `face` is
// only the head/jaw silhouette; it no longer selects a pre-painted portrait.
export const FACE_SHAPES = ['oval','heart','square','round','diamond','long','soft','angular','mature','sculpted'] as const;
export const BARTENDER_FACES = FACE_SHAPES; // saved-game/API compatibility
export const EYE_SHAPES = ['almond','round','hooded','upturned','downturned','deep-set','monolid','wide','narrow','cat'] as const;
export const BROW_SHAPES = ['soft-arch','high-arch','straight','rounded','feathered','bold','slim','angled','short','long'] as const;
export const NOSE_SHAPES = ['straight','button','aquiline','wide','narrow','turned-up','roman','soft'] as const;
export const LIP_SHAPES = ['balanced','full','thin','cupid','wide','small','top-heavy','bottom-heavy','bowed','soft'] as const;
export const CHEEK_SHAPES = ['soft','defined','high','round','hollow','full'] as const;
export const EYE_COLORS = ['brown','hazel','green','blue','gray','amber','violet','black'] as const;
export const EYELINER_OPTIONS = ['none','fine','winged','smoky','graphic','double-wing'] as const;
export const EYESHADOW_OPTIONS = ['none','nude','bronze','rose','smoky','gold','plum','blue','emerald','neon'] as const;
export const LIP_COLORS = ['bare','rose','nude','berry','red','plum','coral','brown','black','gloss'] as const;
export const BLUSH_OPTIONS = ['none','soft','peach','rose','bronze','draped'] as const;
export const FACIAL_HAIR_OPTIONS = ['clean','stubble','short-beard','full-beard','goatee','moustache','handlebar','soul-patch','van-dyke','anchor'] as const;
export const NOA_HAIR_STYLES = ['updo','waves','bob','ponytail','braids','pixie','bun','curls','shag','long-straight'] as const;
export const LEO_HAIR_STYLES = ['slick','short','undercut','buzz','pompadour','curls','locs','mohawk','shoulder-waves','side-quiff'] as const;
export const HAIR_STYLES = [...NOA_HAIR_STYLES,...LEO_HAIR_STYLES] as const;
export const HAIR_COLORS = ['espresso','black','chestnut','copper','blonde','platinum','red','blue','pink'] as const;
export const BODY_SHAPES = ['slim','athletic','curvy','muscular','broad'] as const;
export const SKIN_DETAILS = ['clean','freckles','tattoo-light','tattoo-bold','scar-brow','scar-cheek'] as const;
export const SKIN_TONES = ['porcelain','fair','warm','olive','brown','deep'] as const;
export const TAN_LEVELS = ['none','sun-kissed','deep'] as const;
export const BUST_OPTIONS = ['petite','balanced','full'] as const;
export const POSES = ['neutral','confident','working'] as const;
// Recolours the main garment of the current outfit ('natural' keeps the original look).
export const OUTFIT_COLORS = ['natural','black','white','red','blue','green','plum','sand'] as const;
export const BARTENDER_OUTFITS = ['vest','shirt','apron','biker','tee-skirt','suit-jeans','bunny','kimono','baggy-tee','streetwear','special-gala','special-cyberpunk','special-steampunk','special-post-apocalypse','special-historical','special-fantasy','special-masquerade', ...REFERENCE_COSTUME_IDS] as const;
export const BAR_PROFILE_OPTIONS = {
  wall:WALLS,counter:COUNTER_MATERIALS,counterColor:COUNTER_COLORS,counterSize:COUNTER_SIZES,seatCount:SEAT_COUNTS,
  lighting:HIGHLIGHTS,highlightStrength:HIGHLIGHT_STRENGTHS,shelf:SHELF_STYLES,shelfPreset:SHELF_DECOR_PRESET_IDS,windowBackdrop:WINDOW_BACKDROP_IDS,bartenderCharacter:['noa','leo'] as const,
  bartender:BARTENDER_OUTFITS,interior:INTERIORS.map((item) => item.id),face:FACE_SHAPES,
  hairStyle:HAIR_STYLES,hairColor:HAIR_COLORS,bodyShape:BODY_SHAPES,skinDetail:SKIN_DETAILS,skinTone:SKIN_TONES,tanLevel:TAN_LEVELS,
  bust:BUST_OPTIONS,pose:POSES,eyeShape:EYE_SHAPES,browShape:BROW_SHAPES,noseShape:NOSE_SHAPES,lipShape:LIP_SHAPES,
  cheekShape:CHEEK_SHAPES,eyeColor:EYE_COLORS,eyeliner:EYELINER_OPTIONS,eyeshadow:EYESHADOW_OPTIONS,lipColor:LIP_COLORS,
  blush:BLUSH_OPTIONS,facialHair:FACIAL_HAIR_OPTIONS,outfitColor:OUTFIT_COLORS
} as const;

export interface BarProfile {
  name: string;
  wall: typeof WALLS[number];
  counter: typeof COUNTER_MATERIALS[number];
  counterColor: typeof COUNTER_COLORS[number];
  counterSize: typeof COUNTER_SIZES[number];
  // One reusable seat art asset is instanced this many times; missing means use every scene anchor.
  seatCount?: typeof SEAT_COUNTS[number];
  lighting: typeof HIGHLIGHTS[number];
  highlightStrength: typeof HIGHLIGHT_STRENGTHS[number];
  bartenderCharacter: 'noa' | 'leo';
  bartenderNickname: string;
  bartender: typeof BARTENDER_OUTFITS[number];
  interior: InteriorId;
  face: typeof BARTENDER_FACES[number];
  hairStyle: typeof HAIR_STYLES[number];
  hairColor: typeof HAIR_COLORS[number];
  bodyShape: typeof BODY_SHAPES[number];
  skinDetail: typeof SKIN_DETAILS[number];
  skinTone: typeof SKIN_TONES[number];
  tanLevel: typeof TAN_LEVELS[number];
  bust: typeof BUST_OPTIONS[number];
  pose: typeof POSES[number];
  eyeShape: typeof EYE_SHAPES[number];
  browShape: typeof BROW_SHAPES[number];
  noseShape: typeof NOSE_SHAPES[number];
  lipShape: typeof LIP_SHAPES[number];
  cheekShape: typeof CHEEK_SHAPES[number];
  eyeColor: typeof EYE_COLORS[number];
  eyeliner: typeof EYELINER_OPTIONS[number];
  eyeshadow: typeof EYESHADOW_OPTIONS[number];
  lipColor: typeof LIP_COLORS[number];
  blush: typeof BLUSH_OPTIONS[number];
  facialHair: typeof FACIAL_HAIR_OPTIONS[number];
  outfitColor: typeof OUTFIT_COLORS[number];
  // Back-bar cabinet; missing or 'auto' follows the background.
  shelf?: typeof SHELF_STYLES[number];
  // Decorative bottle population rendered behind gameplay bottles.
  shelfPreset?: ShelfDecorPresetId;
  // Explicit collection-owned view rendered behind transparent window panes.
  windowBackdrop?: WindowBackdropId;
}

const femaleStyle = { outfitColor:'natural',face:'soft',hairStyle:'updo',hairColor:'espresso',bodyShape:'curvy',skinDetail:'clean',skinTone:'fair',tanLevel:'none',bust:'balanced',pose:'confident',eyeShape:'almond',browShape:'soft-arch',noseShape:'soft',lipShape:'full',cheekShape:'high',eyeColor:'hazel',eyeliner:'winged',eyeshadow:'bronze',lipColor:'rose',blush:'soft',facialHair:'clean' } as const;
const maleStyle = { outfitColor:'natural',face:'angular',hairStyle:'slick',hairColor:'chestnut',bodyShape:'muscular',skinDetail:'clean',skinTone:'fair',tanLevel:'none',bust:'balanced',pose:'neutral',eyeShape:'hooded',browShape:'bold',noseShape:'straight',lipShape:'balanced',cheekShape:'defined',eyeColor:'brown',eyeliner:'none',eyeshadow:'none',lipColor:'bare',blush:'none',facialHair:'short-beard' } as const;
export const DEFAULT_BARS: Record<RegionId, BarProfile> = {
  'new-york': { name:'The Velvet Hour',wall:'neon',counter:'classic',counterColor:'ruby',counterSize:'standard',lighting:'amber',highlightStrength:'medium',shelfPreset:'luxury-whiskey',windowBackdrop:'skyline',bartenderCharacter:'noa',bartenderNickname:'Noa',bartender:'vest',interior:'velvet',...femaleStyle },
  london: { name:'Juniper & Oak',wall:'emerald',counter:'walnut',counterColor:'espresso',counterSize:'grand',lighting:'amber',highlightStrength:'soft',bartenderCharacter:'leo',bartenderNickname:'Leo',bartender:'shirt',interior:'speakeasy',...maleStyle },
  berlin: { name:'Midnight Studio',wall:'charcoal',counter:'steel',counterColor:'smoke',counterSize:'slim',lighting:'blue',highlightStrength:'bright',bartenderCharacter:'noa',bartenderNickname:'Noa',bartender:'apron',interior:'loft',...femaleStyle,hairColor:'black',pose:'confident' },
  tashkent: { name:'Silk Road Social',wall:'terracotta',counter:'brass',counterColor:'gold',counterSize:'standard',lighting:'amber',highlightStrength:'medium',bartenderCharacter:'leo',bartenderNickname:'Leo',bartender:'vest',interior:'riad',...maleStyle,hairColor:'black' },
  bucharest: { name:'The Amber Room',wall:'burgundy',counter:'brass',counterColor:'plum',counterSize:'grand',lighting:'rose',highlightStrength:'medium',bartenderCharacter:'noa',bartenderNickname:'Noa',bartender:'vest',interior:'art-deco',...femaleStyle,hairColor:'copper',eyeshadow:'smoky',lipColor:'berry' },
  tokyo: { name:'Blue Lantern',wall:'navy',counter:'obsidian',counterColor:'navy',counterSize:'slim',lighting:'blue',highlightStrength:'bright',bartenderCharacter:'leo',bartenderNickname:'Leo',bartender:'apron',interior:'izakaya',...maleStyle,hairStyle:'undercut',skinDetail:'tattoo-light' }
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
