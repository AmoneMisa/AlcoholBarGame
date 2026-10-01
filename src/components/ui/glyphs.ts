// Game data (events, rules, guest moods, lessons) names things with an emoji. Outside dialogues the UI draws
// them as sprite icons instead, so every device shows the same picture. Anything unlisted falls back to a star.

const GROUPS: Record<string, string> = {
  glass: '🍻🥃🍷🍸🍹🍾', fork: '🧀🍽️🧑🍳', book: '🎓📚📜', music: '💃🎷🎸', gift: '🎁🎂', star: '🎉🎊🌟🆕📸🍀', heart: '💘💍💔',
  moon: '🌙', bag: '🧳🎒', stock: '📦', basket: '🛒🏪', tag: '🏷️', cloud: '🌧️⛈️', flame: '🔥🥵🧯💨', crystal: '💎', leaf: '🌾🌿🍃',
  truck: '⛽', ban: '🚫🚭', eye: '🕵️🕶️👁️', paw: '🐾🐕', card: '💳🪪🧾👛🏦💵💶📱', plane: '🛫', clock: '🕛', ball: '⚽',
  smoke: '🚬', drop: '💧', taxi: '🚕', chat: '💬', alert: '❗⚠️🆘🔪', cap: '🎓', bulb: '💡', mic: '🎤', pointer: '👆👉', keyboard: '⌨️',
  'face-happy': '😊😉🙂', 'face-sad': '😢😔', 'face-angry': '😠😡😤', 'face-sleepy': '😴', 'face-star': '🤩', 'face-pleading': '🥺',
  'face-grimace': '😬😰😮', 'face-calm': '😌', 'face-dizzy': '🥴😵🤕🤢🤧', pin: '🌍🇺🇿🧮', check: '✅', trash: '🩹'
};
const ICON_OF = new Map<string, string>();
for (const [icon, glyphs] of Object.entries(GROUPS)) for (const glyph of glyphs.match(/\p{Extended_Pictographic}️?|\p{Regional_Indicator}{2}/gu) ?? []) ICON_OF.set(glyph.replace(/️/g, ''), icon);

export const glyphIcon = (glyph: string | undefined) => ICON_OF.get((glyph ?? '').replace(/️/g, '').trim()) ?? 'star';
