#!/usr/bin/env python3
import json
from pathlib import Path
from PIL import Image, ImageChops

ROOT=Path(__file__).resolve().parents[1]
MOD=ROOT/'public/assets/bar/modular'
MANIFESTS=ROOT/'scripts/modular-scenes'
SUMMARY=ROOT/'docs/modular-review/summary.json'

def source_path(manifest_path,source):
    value=source
    if value.startswith('../../../public/'):
        value='../../public/'+value[len('../../../public/'):]
    return (manifest_path.parent/value).resolve()

def fit_mask(path,size):
    mask=Image.open(path).convert('L')
    if mask.size!=size:
        mask=mask.resize(size,Image.Resampling.LANCZOS)
    return mask

def build(scene):
    scene_id=scene['scene']
    base=MOD/scene_id
    manifest_path=MANIFESTS/f'{scene_id}.json'
    manifest=json.loads(manifest_path.read_text())
    src=source_path(manifest_path,manifest['source'])
    with Image.open(src) as image_file:
        image=image_file.convert('RGBA')

    alpha=Image.new('L',image.size,255)
    arch_mask=base/'architecture-mask.png'
    if arch_mask.exists():
        furniture=fit_mask(arch_mask,image.size)
        alpha=ImageChops.subtract(alpha,furniture)

    window_mask=base/'window-mask.png'
    if window_mask.exists():
        windows=fit_mask(window_mask,image.size)
        alpha=ImageChops.subtract(alpha,windows)

    image.putalpha(alpha)
    out=base/'architecture-prep.webp'
    image.save(out,'WEBP',lossless=True,method=6)
    return {
        'scene':scene_id,
        'output':str(out.relative_to(ROOT)),
        'source':str(src.relative_to(ROOT)),
        'hasFurnitureMask':arch_mask.exists(),
        'hasWindowMask':window_mask.exists(),
        'size':[image.width,image.height]
    }

def main():
    summary=json.loads(SUMMARY.read_text())
    rows=[]
    for scene in summary:
        if scene.get('productionReady'):
            continue
        rows.append(build(scene))
    report=ROOT/'docs/modular-review/architecture-prep.json'
    report.write_text(json.dumps({'count':len(rows),'scenes':rows},indent=2)+'\n')
    print(f'architecture prep layers: {len(rows)}')
    for row in rows:
        print(f"- {row['scene']}: {row['output']}")

if __name__=='__main__':
    main()
