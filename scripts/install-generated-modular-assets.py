#!/usr/bin/env python3
"""Pack image_gen output into existing modular scene canvas contracts."""
import argparse
import json
import shutil
import hashlib
from pathlib import Path
from PIL import Image, ImageChops, ImageDraw

ROOT = Path(__file__).resolve().parents[1]
MOD = ROOT / 'public/assets/bar/modular'

def normalized_mask(size, spec):
    mask = Image.new('L', size, 0)
    draw = ImageDraw.Draw(mask)
    for shapes, value in [(spec.get('include', []),255),(spec.get('exclude', []),0)]:
        for shape in shapes:
            kind=shape.get('type','rect')
            if kind in ('polygon','line'):
                points=[(round(p['x']*size[0]),round(p['y']*size[1])) for p in shape['points']]
                if kind=='line': draw.line(points,fill=value,width=max(1,round(shape['width']*size[0])),joint='curve')
                else: draw.polygon(points,fill=value)
            else:
                x,y=round(shape['x']*size[0]),round(shape['y']*size[1])
                w,h=round(shape['width']*size[0]),round(shape['height']*size[1])
                if kind=='ellipse':draw.ellipse((x,y,x+w-1,y+h-1),fill=value)
                else:draw.rectangle((x,y,x+w-1,y+h-1),fill=value)
    return mask


def install(batch_path, refresh=False):
    batch = json.loads(batch_path.read_text(encoding='utf-8'))
    batch_id = batch.get('id', batch['date'])
    installed = []
    for item in batch['items']:
        scene, role = item['scene'], item['role']
        base = MOD / scene
        plan = json.loads((base / 'scene-plan.json').read_text())
        source = Path(item['source'])
        archive = ROOT / 'assets-src/bar-modular' / scene / f'{role}-{batch_id}.png'
        archive.parent.mkdir(parents=True, exist_ok=True)
        if archive.exists() and source.exists():
            digest = hashlib.sha256(source.read_bytes()).hexdigest()
            if hashlib.sha256(archive.read_bytes()).hexdigest() != digest:
                archive = archive.with_name(f'{role}-{batch_id}-{digest[:12]}.png')
        if not archive.exists():
            shutil.copyfile(source, archive)
        with Image.open(archive) as original:
            image = original.convert('RGBA')
        packing = {'generatedSize': list(image.size)}
        if role == 'architecture':
            size = (plan['canvas']['width'], plan['canvas']['height'])
            image = image.resize(size, Image.Resampling.LANCZOS)
            window = base / 'window-mask.png'
            manifest = json.loads((ROOT / 'scripts/modular-scenes' / f'{scene}.json').read_text())
            cutouts = manifest.get('generatedWindowCutoutsNormalized')
            if manifest.get('generatedArchitectureAlpha'):
                # Native alpha preserves the actual frames, curtains and balcony
                # rails. Restrict apertures to reviewed exterior regions so an
                # interior niche can never become an accidental outdoor opening.
                allowed = Image.new('L', size, 0)
                draw = ImageDraw.Draw(allowed)
                for rect in manifest['generatedExteriorBoundsNormalized']:
                    x, y = round(rect['x'] * size[0]), round(rect['y'] * size[1])
                    w, h = round(rect['width'] * size[0]), round(rect['height'] * size[1])
                    draw.rectangle((x, y, x+w-1, y+h-1), fill=255)
                mask = ImageChops.multiply(ImageChops.invert(image.getchannel('A')), allowed)
                mask.save(window, 'PNG', optimize=True)
                exterior_source = item.get('opaqueArchitectureSource')
                if not exterior_source:
                    raise RuntimeError(f'{scene}: native apertures require their opaque reference')
                with Image.open(exterior_source) as original_exterior:
                    exterior = original_exterior.convert('RGBA').resize(size, Image.Resampling.LANCZOS)
                restore = exterior.copy()
                restore.putalpha(ImageChops.multiply(ImageChops.invert(image.getchannel('A')), ImageChops.invert(allowed)))
                image.alpha_composite(restore)
                image.putalpha(ImageChops.invert(mask))
                exterior.putalpha(mask)
                exterior.save(base / 'exterior.webp', 'WEBP', lossless=True, method=6)
            elif manifest.get('generatedWindowMaskNormalized'):
                mask=normalized_mask(size,manifest['generatedWindowMaskNormalized'])
                mask.save(window,'PNG',optimize=True)
            elif cutouts:
                mask = Image.new('L', size, 0)
                draw = ImageDraw.Draw(mask)
                for cutout in cutouts:
                    x, y = round(cutout['x'] * size[0]), round(cutout['y'] * size[1])
                    w, h = round(cutout['width'] * size[0]), round(cutout['height'] * size[1])
                    draw.rectangle((x, y, x + w - 1, y + h - 1), fill=255)
                if manifest.get('generatedWindowGlassColor') == 'blue':
                    red, green, blue, _ = image.split()
                    blue_glass = ImageChops.multiply(
                        ImageChops.subtract(blue, red).point(lambda value: 255 if value > 15 else 0),
                        ImageChops.subtract(blue, green).point(lambda value: 255 if value > 5 else 0))
                    blue_glass = ImageChops.multiply(blue_glass, blue.point(lambda value: 255 if value > 80 else 0))
                    mask = ImageChops.multiply(mask, blue_glass)
                mask.save(window, 'PNG', optimize=True)
            if window.exists() and not manifest.get('generatedArchitectureAlpha'):
                with Image.open(window) as raw_mask:
                    mask = raw_mask.convert('L').resize(size, Image.Resampling.LANCZOS)
                exterior = image.copy()
                exterior.putalpha(mask)
                exterior.save(base / 'exterior.webp', 'WEBP', lossless=True, method=6)
                image.putalpha(ImageChops.subtract(image.getchannel('A'), mask))
            destination = base / 'architecture.webp'
        else:
            if role == 'seat':
                manifest = json.loads((ROOT / 'scripts/modular-scenes' / f'{scene}.json').read_text())
                rect = manifest['manualSeatCutNormalized']['cropNormalized']
                size = (round(rect['width'] * plan['canvas']['width']), round(rect['height'] * plan['canvas']['height']))
            else:
                crop = plan['modules'][f'{role}-reference']['crop']
                size = (crop['width'], crop['height'])
            alpha = image.getchannel('A')
            if alpha.getextrema()[0] != 0:
                raise RuntimeError(f'{scene}/{role}: generated surroundings are not transparent')
            content_rect = item.get('contentRectNormalized')
            if content_rect:
                bounds = alpha.point(lambda value: 255 if value >= 200 else 0).getbbox()
                if not bounds:
                    raise RuntimeError(f'{scene}/{role}: empty generated furniture')
                content = image.crop(bounds)
                x = round(content_rect['x'] * size[0])
                y = round(content_rect['y'] * size[1])
                width = min(size[0] - x, round(content_rect['width'] * size[0]))
                height = min(size[1] - y, round(content_rect['height'] * size[1]))
                content = content.resize((width, height), Image.Resampling.LANCZOS)
                image = Image.new('RGBA', size)
                image.alpha_composite(content, (x, y))
                packing.update(contentBounds=list(bounds), contentRectPixels=[x, y, width, height])
            elif role == 'seat':
                bounds = alpha.point(lambda value: 255 if value >= 200 else 0).getbbox()
                if not bounds:
                    raise RuntimeError(f'{scene}/{role}: empty generated seat')
                content = image.crop(bounds)
                content.thumbnail((size[0] - 4, size[1] - 4), Image.Resampling.LANCZOS)
                image = Image.new('RGBA', size)
                image.alpha_composite(content, ((size[0] - content.width) // 2, (size[1] - content.height) // 2))
                packing.update(contentBounds=list(bounds), fit='contain-with-transparent-margins')
            elif role == 'counter':
                # image_gen pads ultrawide references. Register the opaque counter
                # back to its source crop without baking transparent letterboxing.
                bounds = alpha.point(lambda value: 255 if value >= 200 else 0).getbbox()
                if not bounds:
                    raise RuntimeError(f'{scene}/{role}: empty generated counter')
                top = int(item['visibleTopPixels'])
                content = image.crop((0, bounds[1], image.width, bounds[3]))
                content = content.resize((size[0], size[1] - top), Image.Resampling.LANCZOS)
                image = Image.new('RGBA', size)
                image.alpha_composite(content, (0, top))
                packing.update(contentBounds=list(bounds), visibleTopPixels=top)
            else:
                image = image.resize(size, Image.Resampling.LANCZOS)
            manifest = json.loads((ROOT / 'scripts/modular-scenes' / f'{scene}.json').read_text())
            exclusions=manifest.get('generatedLayerExclusionsNormalized',{}).get(role,[])
            if exclusions:
                crop=manifest['modules'][f'{role}-reference']['cropNormalized']
                local=[]
                for shape in exclusions:
                    local.append({'type':'rect','x':(shape['x']-crop['x'])/crop['width'],'y':(shape['y']-crop['y'])/crop['height'],'width':shape['width']/crop['width'],'height':shape['height']/crop['height']})
                excluded=normalized_mask(size,{'include':local})
                image.putalpha(ImageChops.subtract(image.getchannel('A'),excluded))
            destination = base / 'clean-ready' / f'{role}.webp'
        destination.parent.mkdir(parents=True, exist_ok=True)
        if destination.exists() and not refresh:
            raise RuntimeError(f'Refusing to overwrite final asset: {destination}')
        image.save(destination, 'WEBP', lossless=True, method=6)
        installed.append({
            'scene': scene, 'role': role, 'source': str(archive.relative_to(ROOT)),
            'output': str(destination.relative_to(ROOT)), 'size': list(image.size),
            'alphaRange': list(image.getchannel('A').getextrema()), 'packing': packing,
        })

    scenes = sorted({item['scene'] for item in installed})
    decor_count = max(sum(item['role'] not in ('architecture', 'shelf', 'counter', 'seat') for item in installed if item['scene'] == scene) for scene in scenes)
    row_height = 410 + decor_count * 140
    preview = Image.new('RGB', (1200, len(scenes) * row_height), '#16191f')
    for index, scene in enumerate(scenes):
        base = MOD / scene
        plan = json.loads((base / 'scene-plan.json').read_text())
        manifest = json.loads((ROOT / 'scripts/modular-scenes' / f'{scene}.json').read_text())
        with Image.open(base / 'architecture.webp') as raw:
            assembled = raw.convert('RGBA')
        if (base / 'exterior.webp').exists():
            with Image.open(base / 'exterior.webp') as raw:
                exterior = raw.convert('RGBA')
            # The clean generated exterior fills window holes without interior props.
            exterior.alpha_composite(assembled)
            assembled = exterior
        furniture = [module['id'] for module in sorted(manifest.get('decorModules', []), key=lambda module: module['z'])] + ['shelf', 'counter']
        for role in furniture:
            crop = plan['modules'][f'{role}-reference']['crop']
            with Image.open(base / 'clean-ready' / f'{role}.webp') as raw:
                assembled.alpha_composite(raw.convert('RGBA'), (crop['x'], crop['y']))
        seat_path = base / 'clean-ready/seat.webp'
        if seat_path.exists():
            manifest = json.loads((ROOT / 'scripts/modular-scenes' / f'{scene}.json').read_text())
            seat_rect = manifest['manualSeatCutNormalized']['cropNormalized']
            with Image.open(seat_path) as raw:
                seat = raw.convert('RGBA')
            for anchor in plan.get('seatAnchors', []):
                x = round((anchor['x'] - seat_rect['width'] / 2) * assembled.width)
                y = round(seat_rect['y'] * assembled.height)
                assembled.alpha_composite(seat, (x, y))
        assembled.thumbnail((710, 375), Image.Resampling.LANCZOS)
        y = index * row_height
        ImageDraw.Draw(preview).text((16, y + 10), f'{scene} - clean modular assembly / empty furniture', fill='white')
        preview.paste(assembled.convert('RGB'), (16, y + 30))
        samples = [('shelf', (750, y + 40), (215, 200)), ('counter', (750, y + 265), (435, 125))]
        if seat_path.exists():
            samples.append(('seat', (995, y + 40), (190, 200)))
        for n, module in enumerate(manifest.get('decorModules', [])):
            samples.append((module['id'], (750, y + 410 + n * 140), (435, 125)))
        for role, position, max_size in samples:
            with Image.open(base / 'clean-ready' / f'{role}.webp') as raw:
                asset = raw.convert('RGBA')
            asset.thumbnail(max_size, Image.Resampling.LANCZOS)
            preview.paste(asset, position, asset)
    review = ROOT / 'docs/modular-review' / f'generated-batch-{batch_id}.webp'
    preview.save(review, 'WEBP', quality=90, method=6)
    report = review.with_suffix('.json')
    report.write_text(json.dumps({'tool': batch['tool'], 'items': installed, 'preview': str(review.relative_to(ROOT))}, indent=2) + '\n')
    print(f'Installed {len(installed)} generated modules for {", ".join(scenes)}')
    print(f'Preview: {review}')


if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('batch', type=Path)
    parser.add_argument('--refresh', action='store_true', help='Repack this batch from archived originals')
    args = parser.parse_args()
    install(args.batch, args.refresh)
