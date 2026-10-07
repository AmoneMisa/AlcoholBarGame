"""Create small previews from already installed runtime artwork for a UI design."""
import base64
import json
from pathlib import Path
from io import BytesIO
from PIL import Image, ImageOps

root = Path(__file__).resolve().parents[1]
data = json.loads((root / '.tmp/modular-all/runtime-gallery.json').read_text(encoding='utf-8'))
scene = data['scenes']['marina']
size = (scene['canvas']['width'], scene['canvas']['height'])
def image_url(image, dimensions):
    buffer = BytesIO()
    ImageOps.fit(image.convert('RGB'), dimensions).save(buffer, format='WEBP', quality=72)
    return 'data:image/webp;base64,' + base64.b64encode(buffer.getvalue()).decode()
items = [{'id':'original','label':'Original view','asset':scene['exterior']['asset']}, *data['backdrops']]
for item in items:
    outdoors = Image.open(root / ('public' + item['asset'])).convert('RGBA')
    canvas = outdoors.resize(size) if item['id']=='original' else ImageOps.fit(outdoors, size)
    for layer in sorted(scene['layers'], key=lambda item:item['z']):
        image = Image.open(root / ('public' + layer['asset'])).convert('RGBA')
        rect = layer.get('rect')
        if rect:
            image = image.resize((round(rect['width']*size[0]), round(rect['height']*size[1])))
            if layer.get('flipX'): image = ImageOps.mirror(image)
            canvas.alpha_composite(image, (round(rect['x']*size[0]), round(rect['y']*size[1])))
        else: canvas.alpha_composite(image.resize(size))
    item['thumb'] = image_url(canvas if item['id']=='original' else outdoors,(192,108))
    item['preview'] = image_url(canvas,(720,400))
    del item['asset']
output=root / '.tmp/modular-all/exterior-design-assets.json'
output.write_text(json.dumps(items),encoding='utf-8')
print(f'{len(items)} existing previews, {output.stat().st_size} bytes')
