"""Measure installed furniture. Pipe export-modular-registry.mjs JSON into this script."""
from pathlib import Path
import json
import sys
from PIL import Image

root = Path(__file__).resolve().parents[1]
gallery = json.loads(sys.stdin.read())
out = {}
# Reviewed seat cushions on chairs with backs; the upper rail is not a sitting surface.
chair_surfaces = {'art-deco': .35, 'beach': .28, 'desert': .32,
                  'inferno-penthouse': .40, 'izakaya': .21, 'palace': .34,
                  'parisian': .30, 'rooftop': .39, 'tropical': .30, 'winter': .38}
for scene in gallery['scenes'].values():
    for layer in scene['layers']:
        if layer['role'] not in ['counter', 'seating', 'shelves'] or not layer.get('asset') or layer['asset'] in out:
            continue
        image = Image.open(root / ('public' + layer['asset'])).convert('RGBA')
        alpha = image.getchannel('A').point(lambda value: 255 if value > 40 else 0)
        box = alpha.getbbox()
        if not box:
            continue
        x0, y0, x1, y1 = box
        crop = alpha.crop(box)
        # Stool surfaces are broad opaque bands; backs have only slender uprights below their top rail.
        rows = [] if layer['role'] == 'shelves' else [sum(crop.getpixel((x,y)) > 0 for x in range(crop.width)) / crop.width for y in range(crop.height)]
        first = next((y for y,value in enumerate(rows[:int(crop.height*.65)]) if value > .65), 0)
        if layer['role'] == 'seating':
            surface = chair_surfaces.get(scene['id'], first / crop.height)
        elif layer['role'] == 'counter':
            column = crop.width // 2
            surface = next((y for y in range(crop.height) if crop.getpixel((column,y)) > 0), first) / crop.height
        else:
            surface = 0
        out[layer['asset']] = {'crop': {'x':x0/image.width,'y':y0/image.height,'width':(x1-x0)/image.width,'height':(y1-y0)/image.height},
            'aspect':crop.width/crop.height,'surface':round(surface,5)}
(root/'src/data/cosmetics/mobileBarArt.ts').write_text('// Measured by scripts/measure-mobile-bar-art.py.\nexport const MOBILE_BAR_ART: Record<string, { crop: { x:number; y:number; width:number; height:number }; aspect:number; surface:number }> = '+json.dumps(out,indent=2)+';\n',encoding='utf-8')
print(f'Measured {len(out)} furniture assets')
