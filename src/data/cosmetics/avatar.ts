/** Every value any imported avatar can show; keep saved legacy cosmetics valid. Use avatarOptionsFor() for what one character offers. */
import { OUTFIT_COLORS } from './bars';
export const AVATAR_OPTIONS = [
  { key: 'bodyShape', label: 'Body shape', values: ['slim', 'athletic', 'curvy', 'muscular', 'broad'] },
  { key: 'hairStyle', label: 'Hair', values: ['updo', 'bun', 'bob', 'pixie', 'waves', 'slick', 'buzz'] },
  { key: 'hairColor', label: 'Hair color', values: ['espresso', 'black', 'chestnut', 'copper', 'blonde', 'platinum', 'red', 'blue', 'pink'] },
  { key: 'eyeShape', label: 'Eyes', values: ['almond', 'round', 'hooded', 'narrow'] },
  { key: 'eyeColor', label: 'Eye color', values: ['brown', 'hazel', 'green', 'blue', 'gray', 'amber', 'violet', 'black'] },
  { key: 'browShape', label: 'Eyebrows', values: ['soft-arch', 'high-arch', 'straight', 'bold'] },
  { key: 'noseShape', label: 'Nose', values: ['soft', 'straight', 'button', 'wide', 'narrow', 'turned-up'] },
  { key: 'cheekShape', label: 'Cheeks', values: ['soft', 'high', 'round', 'hollow', 'full'] },
  { key: 'lipShape', label: 'Mouth', values: ['balanced', 'full', 'thin', 'wide', 'small'] },
  { key: 'lipColor', label: 'Lipstick', values: ['bare', 'rose', 'nude', 'berry', 'red', 'plum', 'coral', 'brown', 'black', 'gloss'] },
  { key: 'eyeshadow', label: 'Eyeshadow', values: ['none', 'nude', 'bronze', 'rose', 'smoky', 'gold', 'plum', 'blue', 'emerald', 'neon'] },
  { key: 'eyeliner', label: 'Eyeliner', values: ['none', 'fine', 'winged'] },
  { key: 'blush', label: 'Blush', values: ['none', 'soft', 'peach', 'rose', 'bronze'] },
  { key: 'facialHair', label: 'Beard', values: ['clean', 'stubble', 'short-beard', 'full-beard', 'goatee', 'moustache', 'soul-patch'] },
  { key: 'outfitColor', label: 'Outfit color', values: OUTFIT_COLORS },
] as const;
export type AvatarOptionKey = typeof AVATAR_OPTIONS[number]['key'];
export interface AvatarOption { key: AvatarOptionKey; label: string; values: readonly string[] }
/** Painted appearances preserve the face; each hairstyle includes its painted hair color. */
export function avatarOptionsFor(character: string): AvatarOption[] {
  return [];
}
export const avatarLabel = (value: string) => value.replaceAll('-', ' ').replace(/^./, c => c.toUpperCase());
export const OUTFIT_PALETTE: Record<string, string> = { natural:'#ffffff', black:'#3a3a42', white:'#f3f0ea', red:'#c23b3b', blue:'#3b63c2', green:'#3a8a5a', plum:'#8a4a8f', sand:'#d9c39a' };
export const HAIR_PALETTE: Record<string, string> = { espresso:'#493329', black:'#211e21', chestnut:'#795342', copper:'#bd7147', blonde:'#e8c78a', platinum:'#eee2c9', red:'#a13c38', blue:'#426eab', pink:'#d887a1' };
export const EYE_PALETTE: Record<string, string> = { brown:'#806044', hazel:'#9c925d', green:'#699b72', blue:'#619ccd', gray:'#9aabb5', amber:'#c49942', violet:'#a080c1', black:'#343036' };
export const LIP_PALETTE: Record<string, string> = { bare:'#b27775', rose:'#b75468', nude:'#b88572', berry:'#803049', red:'#aa243c', plum:'#743354', coral:'#d26860', brown:'#74443e', black:'#282028', gloss:'#ca8b94' };
export const SHADOW_PALETTE: Record<string, string> = { none:'#b18c7d', nude:'#b18c7d', bronze:'#93633a', rose:'#b66c81', smoky:'#423641', gold:'#c29442', plum:'#713c75', blue:'#416daa', emerald:'#367d68', neon:'#b53bad' };
