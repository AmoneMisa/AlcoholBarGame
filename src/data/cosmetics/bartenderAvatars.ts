export interface BartenderAvatar {
  hairStyle: string;
  hairColor: string;
  label: string;
  sheet: string;
  frameRatio: number;
  column: number;
}
const avatar = (character: string, hairStyle: string, column: number, label: string): BartenderAvatar => ({
  hairStyle, hairColor: character === 'noa' ? 'espresso' : 'chestnut', label, column,
  sheet: `/assets/characters/bartender/${character}-natural-atlas-v2.webp`,
  frameRatio: 948 / 1656,
});
export const BARTENDER_AVATARS: Record<string, BartenderAvatar[]> = {
  noa: [
    avatar('noa', 'updo', 0, 'Curly updo'),
  ],
  leo: [
    avatar('leo', 'slick', 0, 'Swept-back hair'),
  ],
};
/** Legacy styles keep loading through the character's default painted appearance. */
export const bartenderAvatarFor = (character: string, hairStyle?: string) => {
  const avatars = BARTENDER_AVATARS[character];
  return avatars?.find(avatar => avatar.hairStyle === hairStyle) ?? avatars?.[0];
};
