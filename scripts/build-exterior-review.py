"""Render existing runtime layers against different exteriors for visual review."""
import json
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont, ImageOps

ROOT = Path(__file__).resolve().parents[1]
data = json.loads((ROOT / '.tmp/modular-all/runtime-gallery.json').read_text(encoding='utf-8'))
scenes = data['scenes']
font = ImageFont.truetype('C:/Windows/Fonts/arial.ttf', 18)
sheet = Image.new('RGB', (1536, 4 * 290 + 40), '#101722')
draw = ImageDraw.Draw(sheet)
choices = [('original', 'Original'), ('beach', 'Beach'), ('cyberpunk', 'Cyberpunk')]
for column, (_, label) in enumerate(choices):
    draw.text((column * 512 + 12, 10), label, font=font, fill='white')
for row, scene_id in enumerate(['inferno-penthouse', 'garden', 'skyline', 'marina']):
    scene = scenes[scene_id]
    size = (scene['canvas']['width'], scene['canvas']['height'])
    for column, (backdrop, _) in enumerate(choices):
        src = scene['exterior']['asset'] if backdrop == 'original' else f'/assets/bar/exteriors/{backdrop}.webp'
        view = Image.open(ROOT / ('public' + src)).convert('RGBA')
        view = view.resize(size) if backdrop == 'original' else ImageOps.fit(view, size)
        for layer in sorted(scene['layers'], key=lambda item: item['z']):
            image = Image.open(ROOT / ('public' + layer['asset'])).convert('RGBA')
            rect = layer.get('rect')
            if rect:
                image = image.resize((round(rect['width'] * size[0]), round(rect['height'] * size[1])))
                if layer.get('flipX'): image = ImageOps.mirror(image)
                view.alpha_composite(image, (round(rect['x'] * size[0]), round(rect['y'] * size[1])))
            else:
                view.alpha_composite(image.resize(size))
        thumb = ImageOps.fit(view.convert('RGB'), (504, 252))
        x, y = column * 512 + 4, row * 290 + 40
        sheet.paste(thumb, (x, y))
        draw.text((x + 8, y + 256), scene_id, font=font, fill='white')
output = ROOT / 'docs/modular-review/exterior-comparison.webp'
sheet.save(output, quality=92)
print(output)
