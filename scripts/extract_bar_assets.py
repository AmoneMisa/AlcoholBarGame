#!/usr/bin/env python3
"""Extract reusable layers from a flat bar image.

    from extract_bar_assets import extract_bar_assets
    extract_bar_assets('scripts/modular-scenes/velvet.json', 'out/velvet')

Outputs (RGBA WebP, lossless) in out_dir:
    chair.webp       one reusable seat (first seat anchor / manual seat crop)
    counter.webp     the bar line (counter) with transparent surroundings
    shelf.webp       the back-bar shelf unit with transparent surroundings
    exterior.webp    the view behind the windows (source pixels, window mask alpha)
    background.webp  room plate: furniture and window panes removed by OpenCV inpaint
    assets.json      what was written, regions used and how each cut was made

Regions come from a scene manifest (scripts/modular-scenes/*.json), so both the
normalized and legacy pixel formats are accepted. Roles with a manual mask in the
manifest use it; otherwise the cut falls back to rembg when installed, else to the
plain rectangular crop. The background is an automatic inpaint: review-only, it
does not replace a hand-reconstructed architecture plate.
"""
import json
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw, ImageFilter

ROOT = Path(__file__).resolve().parents[1]
ROLES = ('counter', 'shelf')


def _rect_px(r, w, h, canvas=None):
    """{x,y,width,height} normalized (<=1) or in canvas pixels -> (x0,y0,x1,y1) in w,h."""
    normalized = r['x'] + r['width'] <= 1.0001 and r['y'] + r['height'] <= 1.0001
    sx, sy = (w, h) if normalized else (w / canvas[0], h / canvas[1])
    return (round(r['x'] * sx), round(r['y'] * sy),
            round((r['x'] + r['width']) * sx), round((r['y'] + r['height']) * sy))


def _shape_draw(draw, shape, w, h, fill):
    kind = shape.get('type', 'rect')
    if kind == 'polygon':
        draw.polygon([(round(p['x'] * w), round(p['y'] * h)) for p in shape['points']], fill=fill)
        return
    x, y = round(shape['x'] * w), round(shape['y'] * h)
    box = (x, y, x + round(shape['width'] * w), y + round(shape['height'] * h))
    (draw.ellipse if kind == 'ellipse' else draw.rectangle)(box, fill=fill)


def _manual_mask(spec, size):
    w, h = size
    mask = Image.new('L', size, 0)
    draw = ImageDraw.Draw(mask)
    for s in spec.get('include', []):
        _shape_draw(draw, s, w, h, 255)
    for s in spec.get('exclude', []):
        _shape_draw(draw, s, w, h, 0)
    feather = float(spec.get('feather', 1.5))
    return mask.filter(ImageFilter.GaussianBlur(feather)) if feather > 0 else mask


def _auto_mask(crop):
    """Salient-object mask via rembg if available, else fully opaque."""
    try:
        from rembg import remove, new_session
    except ImportError:
        return Image.new('L', crop.size, 255), 'rect-crop'
    cut = remove(crop, session=new_session('u2net'), alpha_matting=False)
    return cut.convert('RGBA').getchannel('A'), 'rembg'


def _cut(source, box, manual_spec):
    crop = source.crop(box)
    if manual_spec:
        mask, how = _manual_mask(manual_spec, crop.size), 'manual-mask'
    else:
        mask, how = _auto_mask(crop)
    out = crop.copy()
    out.putalpha(mask)
    return out, mask, how


def _window_mask(manifest, size):
    w, h = size
    canvas = manifest.get('canvas', {})
    cw, ch = canvas.get('width', w), canvas.get('height', h)
    mask = Image.new('L', size, 0)
    draw = ImageDraw.Draw(mask)
    cutouts = manifest.get('windowCutoutsNormalized') or manifest.get('windowCutouts') or []
    for c in cutouts:
        if c.get('type') == 'polygon':
            pts = c['points']
            norm = pts[0]['x'] <= 1 and pts[0]['y'] <= 1
            draw.polygon([(round(p['x'] * (w if norm else w / cw)),
                           round(p['y'] * (h if norm else h / ch))) for p in pts], fill=255)
        else:
            draw.rectangle(_rect_px(c, w, h, (cw, ch)), fill=255)
    return mask, len(cutouts)


def _module_box(manifest, role, size):
    w, h = size
    mod = manifest.get('modules', {}).get(f'{role}-reference')
    canvas = manifest.get('canvas', {})
    cw, ch = canvas.get('width', w), canvas.get('height', h)
    if mod and 'cropNormalized' in mod:
        return _rect_px(mod['cropNormalized'], w, h)
    if mod and 'crop' in mod:
        return _rect_px(mod['crop'], w, h, (cw, ch))
    slot = manifest.get('slotsNormalized', {}).get(role) or manifest.get('slots', {}).get(role)
    if slot:
        return _rect_px(slot, w, h, (cw, ch))
    return None


def _shelf_units_px(manifest, box, size, clear_bottom=True):
    """[(x0, x1, rows)] in shelf-crop pixels. `shelfUnits` (canvas px, one entry per
    cabinet) wins over the scene-wide `shelfRows`; rows are shelf baselines."""
    w, h = size
    cv = manifest.get('canvas', {})
    sx, sy = w / cv.get('width', w), h / cv.get('height', h)
    units = manifest.get('shelfUnits')
    if not units:
        rows = manifest.get('shelfRowsNormalized') or manifest.get('shelfRows') or []
        scale = h if rows and max(rows) <= 1 else sy
        units = [{'x0': box[0] / sx, 'x1': box[2] / sx, 'rows': [r * scale / sy for r in rows]}]
    # the stock standing on the counter-side board has no row of its own: close the
    # last band at the counter's top edge
    slot = manifest.get('slotsNormalized', {}).get('counter') or manifest.get('slots', {}).get('counter')
    counter_y = None
    bottom = manifest.get('shelfBottom')  # explicit closing line beats the counter's top edge
    if clear_bottom and bottom is not None:
        counter_y = round(bottom * (h if bottom <= 1 else sy))
    elif clear_bottom and slot:
        counter_y = round(slot['y'] * (h if slot['y'] <= 1 else sy))
    out = []
    for u in units:
        ys = [round(r * (h if r <= 1 else sy)) for r in u['rows']]
        if counter_y and ys and counter_y > box[1]:
            end = min(counter_y, box[3])  # a counter below the crop: clear to the crop edge
            if end - max(ys) > 8:
                ys.append(end)
        rows = sorted(y - box[1] for y in ys if box[1] < y <= box[3])
        if rows:
            x0 = round(u['x0'] * (w if u['x0'] <= 1 else sx))
            x1 = round(u['x1'] * (w if u['x1'] <= 1 else sx))
            out.append((max(0, x0 - box[0]), min(box[2] - box[0], x1 - box[0]), rows))
    return out


def _clear_shelf(cut, units, hollow, trim_units=False):
    """Remove bottles/glassware: inpaint each band above a shelf baseline, then
    (hollow) make the band transparent so only frame, posts and rails remain."""
    import cv2
    rgba = np.array(cut)
    h, w = rgba.shape[:2]
    pad = max(2, int(h * .025))
    band = np.zeros((h, w), np.uint8)
    for x0, x1, rows in units:
        left, right = x0 + int((x1 - x0) * .02), x1 - int((x1 - x0) * .02)
        prev = max(1, int(h * .04))
        for base in rows:
            y0, y1 = prev + pad, min(h - 1, base - 2)
            if y1 - y0 >= 5:
                cv2.rectangle(band, (left, y0), (right, y1), 255, -1)
            prev = base
    if not band.any():
        return cut, 0
    bgr = cv2.cvtColor(rgba[:, :, :3], cv2.COLOR_RGB2BGR)
    rgba[:, :, :3] = cv2.cvtColor(cv2.inpaint(bgr, band, 5, cv2.INPAINT_TELEA), cv2.COLOR_BGR2RGB)
    if hollow:
        rgba[:, :, 3] = np.where(band > 0, 0, rgba[:, :, 3])
    if trim_units:  # window views and wall between cabinets are not shelf art
        cols = np.zeros(w, bool)
        for x0, x1, _ in units:
            cols[x0:x1] = True
        rgba[:, ~cols, 3] = 0
    return Image.fromarray(rgba, 'RGBA'), int((band > 0).sum())


def _inpaint(source, hole):
    import cv2
    rgb = cv2.cvtColor(np.array(source.convert('RGB')), cv2.COLOR_RGB2BGR)
    m = np.array(hole.filter(ImageFilter.MaxFilter(9)))
    m = (m > 0).astype(np.uint8) * 255
    # Telea is fast but smears at scale; run at half size and upsample the fill only.
    small = cv2.resize(rgb, None, fx=.5, fy=.5, interpolation=cv2.INTER_AREA)
    sm = cv2.resize(m, (small.shape[1], small.shape[0]), interpolation=cv2.INTER_NEAREST)
    filled = cv2.inpaint(small, sm, 7, cv2.INPAINT_TELEA)
    filled = cv2.resize(filled, (rgb.shape[1], rgb.shape[0]), interpolation=cv2.INTER_CUBIC)
    out = np.where(m[..., None] > 0, filled, rgb)
    return Image.fromarray(cv2.cvtColor(out, cv2.COLOR_BGR2RGB))


def _save(img, path):
    img.save(path, 'WEBP', lossless=True, method=6)


def extract_bar_assets(manifest_path, out_dir, source_path=None, inpaint_background=True,
                       empty_shelf=True, hollow_shelf=True, clear_bottom=True):
    """Extract chair, counter, shelf, window view and background from a flat bar image.

    manifest_path: scene manifest JSON (see scripts/modular-scenes).
    source_path:   override the flat image; defaults to the manifest's `source`.
    Returns the report dict also written to <out_dir>/assets.json.
    """
    manifest_path = Path(manifest_path)
    manifest = json.loads(manifest_path.read_text())
    if source_path is None:
        value = manifest['source']
        if value.startswith('../../../public/'):
            value = '../../public/' + value[len('../../../public/'):]
        source_path = (manifest_path.parent / value).resolve()
    out_dir = Path(out_dir)
    out_dir.mkdir(parents=True, exist_ok=True)

    source = Image.open(source_path).convert('RGBA')
    size = source.size
    report = {'scene': manifest['id'], 'source': str(source_path), 'size': list(size), 'assets': {}}
    hole = Image.new('L', size, 0)  # everything to remove from the background plate
    manual = manifest.get('manualRoleMasksNormalized', {})

    # counter ("bar line") and back-bar shelf
    for role in ROLES:
        box = _module_box(manifest, role, size)
        if not box:
            report['assets'][role] = {'status': 'no-region'}
            continue
        cut, mask, how = _cut(source, box, manual.get(role))
        info = {'status': 'ok', 'method': how, 'box': list(box)}
        if role == 'shelf' and empty_shelf:
            units = _shelf_units_px(manifest, box, size, clear_bottom)
            if units:
                cut, px = _clear_shelf(cut, units, hollow_shelf, 'shelfUnits' in manifest)
                info['cleared'] = {'units': len(units), 'pixels': px, 'hollow': hollow_shelf}
            else:
                info['cleared'] = 'no-shelf-rows'
        _save(cut, out_dir / f'{role}.webp')
        if role != 'shelf' and how != 'rect-crop':  # a plain rectangle is not a silhouette; inpainting it smears the plate
            hole.paste(mask, box[:2], mask)
        report['assets'][role] = info

    # one reusable chair
    seat = manifest.get('manualSeatCutNormalized')
    if seat:
        box = _rect_px(seat['cropNormalized'], *size)
        cut, mask, how = _cut(source, box, seat.get('mask'))
        _save(cut, out_dir / 'chair.webp')
        report['assets']['chair'] = {'status': 'ok', 'method': how, 'box': list(box)}
        slot = manifest.get('slotsNormalized', {}).get('seating') or manifest.get('slots', {}).get('seating')
        if slot:  # all seats in the row are removed from the background
            cv = manifest.get('canvas', {})
            ImageDraw.Draw(hole).rectangle(_rect_px(slot, *size, (cv.get('width', size[0]), cv.get('height', size[1]))), fill=255)
    else:
        report['assets']['chair'] = {'status': 'no-region'}

    # view behind the windows
    wmask, n = _window_mask(manifest, size)
    if n:
        view = source.copy()
        view.putalpha(wmask)
        _save(view, out_dir / 'exterior.webp')
        report['assets']['exterior'] = {'status': 'ok', 'windows': n}
    else:
        report['assets']['exterior'] = {'status': 'no-windows'}

    # room plate with furniture and panes filled in
    if inpaint_background:
        hole.paste(255, mask=wmask)
        try:
            _save(_inpaint(source, hole).convert('RGBA'), out_dir / 'background.webp')
            report['assets']['background'] = {'status': 'ok', 'method': 'opencv-telea', 'review': 'required'}
        except ImportError:
            report['assets']['background'] = {'status': 'needs-opencv'}

    (out_dir / 'assets.json').write_text(json.dumps(report, indent=2) + '\n')
    return report


if __name__ == '__main__':
    import argparse
    ap = argparse.ArgumentParser(description=__doc__.split('\n')[0])
    ap.add_argument('manifest')
    ap.add_argument('out_dir')
    ap.add_argument('--source')
    ap.add_argument('--no-background', action='store_true')
    ap.add_argument('--keep-shelf-contents', action='store_true', help='leave bottles on the shelf')
    ap.add_argument('--keep-bottom-row', action='store_true', help='leave stock above the counter')
    ap.add_argument('--solid-shelf', action='store_true', help='fill shelf openings instead of making them transparent')
    a = ap.parse_args()
    r = extract_bar_assets(a.manifest, a.out_dir, a.source, not a.no_background,
                           not a.keep_shelf_contents, not a.solid_shelf, not a.keep_bottom_row)
    for name, info in r['assets'].items():
        print(f"{name}: {info['status']}" + (f" ({info['method']})" if 'method' in info else ''))
