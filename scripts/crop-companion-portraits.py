"""Make Circle card portraits from the original companion WebP figures."""

from pathlib import Path
from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / 'public/assets/characters/companions'
OUT = ROOT / 'public/assets/workshop/companions'
OUT.mkdir(parents=True, exist_ok=True)

IDS = 'mirelle kellan solen nadia bram yara tobin celeste neri aveline soren lumi gideon paloma cassian'.split()

for name in IDS:
    art = Image.open(SOURCE / f'{name}.webp').convert('RGBA')
    width = art.width
    side = round(width * .70)
    upper = art.crop(((width - side) // 2, 0, (width + side) // 2, side))
    upper = upper.resize((226, 226), Image.Resampling.LANCZOS)
    portrait = Image.new('RGBA', (256, 256), (0, 0, 0, 0))
    draw = ImageDraw.Draw(portrait)
    draw.ellipse((7, 7, 249, 249), fill=(43, 58, 78, 255), outline=(219, 179, 111, 255), width=4)
    draw.ellipse((19, 19, 237, 237), outline=(255, 236, 195, 90), width=2)
    portrait.alpha_composite(upper, (15, 15))
    mask = Image.new('L', (256, 256))
    ImageDraw.Draw(mask).ellipse((7, 7, 249, 249), fill=255)
    portrait.putalpha(mask)
    portrait.save(OUT / f'{name}.webp', 'WEBP', quality=91, method=6)

print(f'Built {len(IDS)} companion portraits')
