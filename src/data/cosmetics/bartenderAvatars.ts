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
    avatar('noa', 'waves', 1, 'Loose waves'),
    avatar('noa', 'bob', 2, 'Chin-length bob'),
    avatar('noa', 'braids', 3, 'Twin braids'),
    avatar('noa', 'pixie', 4, 'Short pixie'),
    avatar('noa', 'ponytail', 5, 'High ponytail'),
  ],
  leo: [
    avatar('leo', 'slick', 0, 'Swept-back hair'),
    avatar('leo', 'buzz', 1, 'Buzz cut'),
    avatar('leo', 'curls', 2, 'Textured curls'),
    avatar('leo', 'undercut', 3, 'Undercut'),
    avatar('leo', 'pompadour', 4, 'Pompadour'),
    avatar('leo', 'shoulder-waves', 5, 'Shoulder-length waves'),
  ],
};
/** Legacy styles keep loading through the character's default painted appearance. */
export const bartenderAvatarFor = (character: string, hairStyle?: string) => {
  const avatars = BARTENDER_AVATARS[character];
  return avatars?.find(avatar => avatar.hairStyle === hairStyle) ?? avatars?.[0];
};
