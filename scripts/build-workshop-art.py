"""Build compact WebP art for workshop rewards and regular guests.

Run with Pillow: python scripts/build-workshop-art.py [group ...]  (no group: rebuild everything)
Companion portraits are built separately from original full-figure art.
"""

from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'public/assets/workshop'
OUT.mkdir(parents=True, exist_ok=True)
FONT = ImageFont.truetype('C:/Windows/Fonts/seguiemj.ttf', 132)

# ID, subject, accent. The ID is the same one used by the game data.
ICONS = {
    'equipment': [
        ('shaker', '🍸', '#79c5c4'), ('ice-machine', '🧊', '#81c5e7'),
        ('fridge', '❄️', '#8fcbd9'), ('speakers', '🎷', '#d8a86d'),
        ('register', '💰', '#e2bd68'), ('cellar', '🍾', '#b7a5d9'),
    ],
    'boxes': [
        ('bronze', '📦', '#bb855d'), ('silver', '🎁', '#aec4d5'),
        ('gold', '🏆', '#f1c86c'), ('choice', '🧭', '#bda8e3'),
    ],
    'items': [
        ('happy-hour', '🎉', '#edaa75'), ('xp-boost', '📈', '#8bc995'),
        ('coin-boost', '🪙', '#e8c16e'), ('tip-boost', '💵', '#9ed2a5'),
        ('vip-magnet', '💎', '#92cfe4'), ('golden-ice', '✨', '#f2d188'),
        ('voucher', '🏷️', '#e3ac98'), ('second-chance', '🛟', '#eaa98c'),
        ('courier', '🚚', '#a4c8c9'), ('scroll', '📜', '#dbbe91'),
        ('calm-charm', '🕊️', '#b8d7c2'), ('whisper', '💬', '#a7c6dc'),
        ('steady-hand', '🎯', '#ddb7a3'),
    ],
    'shards': [
        ('skin', '👗', '#c9a6e0'), ('style', '🧵', '#e0a6c9'),
        ('parts', '⚙️', '#aab8c8'), ('circle', '🤝', '#e0a9a9'),
    ],
    'resources': [
        ('crystals', '💎', '#7fd0e8'), ('coins', '🪙', '#e8c16e'), ('xp', '⭐', '#e8d18b'),
    ],
    'keepsakes': [
        ('book', '📖', '#cdbca0'), ('flowers', '💐', '#e1abba'),
        ('vinyl', '💿', '#acbdd9'), ('sweets', '🍬', '#e2aec5'),
        ('watch', '⌚', '#d7bd83'),
    ],
    'achievements': [
        ('serves', '🍸', '#b8c6d8'), ('vips', '💎', '#9ccee6'),
        ('bottles', '🍾', '#d5b88e'), ('boxes', '🎁', '#d6b7da'),
        ('draws', '🎨', '#c8a9dc'), ('upgrades', '🔧', '#aec4d6'),
        ('perfectTalks', '💬', '#a9cfbd'), ('lessons', '📚', '#b8c3e4'),
        ('signatures', '🍹', '#e5adba'), ('tasted', '🍷', '#dba4a9'),
        ('coinsSpent', '🪙', '#e5c68a'), ('crystalsSpent', '💎', '#a7d1e5'),
        ('backgrounds', '🖼️', '#a9bdcf'), ('bars', '🏛️', '#d1b697'),
        ('skins', '👗', '#d2aeca'), ('visitedBy', '🚪', '#aac7b4'),
        ('visitedFriends', '👋', '#e3bb9b'), ('prestiges', '🔥', '#e6aa83'),
        ('giftsSent', '🎁', '#e4b9ad'), ('giftsGot', '💝', '#ddaec0'),
        ('barUpgrades', '🛠️', '#acc5ca'), ('level', '⭐', '#e8d18b'),
        ('staffHired', '👥', '#a9c2d2'), ('staffLevels', '🎓', '#b8b6da'),
        ('loginDays', '📅', '#accee0'), ('companions', '🤝', '#d3b7aa'),
        ('bonds', '❤️', '#dfa7b3'),
    ],
}

def rgb(value):
    return tuple(bytes.fromhex(value[1:]))

def icon(group, key, emoji, accent):
    size = 256
    canvas = Image.new('RGBA', (size, size))
    px = canvas.load()
    ar, ag, ab = rgb(accent)
    for y in range(size):
        for x in range(size):
            glow = max(0, 1 - ((x - 126) ** 2 + (y - 88) ** 2) ** .5 / 235)
            px[x, y] = (int(16 + ar * glow * .12), int(27 + ag * glow * .12), int(44 + ab * glow * .12), 255)
    draw = ImageDraw.Draw(canvas, 'RGBA')
    draw.ellipse((21, 18, 235, 232), fill=(8, 15, 29, 65), outline=(*rgb(accent), 225), width=4)
    draw.ellipse((34, 31, 222, 219), outline=(*rgb(accent), 58), width=2)
    draw.arc((46, 43, 210, 207), 205, 322, fill=(255, 242, 210, 90), width=5)
    draw.ellipse((49, 47, 207, 205), fill=(10, 18, 31, 145))
    draw.text((128, 126), emoji, font=FONT, anchor='mm', embedded_color=True)
    draw.ellipse((123, 222, 133, 232), fill=(*rgb(accent), 230))
    dest = OUT / group / f'{key}.webp'
    dest.parent.mkdir(parents=True, exist_ok=True)
    canvas.convert('RGB').save(dest, 'WEBP', quality=88, method=6)

import sys
wanted = {group: entries for group, entries in ICONS.items() if not sys.argv[1:] or group in sys.argv[1:]}
for group, entries in wanted.items():
    for key, emoji, accent in entries:
        icon(group, key, emoji, accent)

print('Built', sum(map(len, wanted.values())), 'workshop icons')
