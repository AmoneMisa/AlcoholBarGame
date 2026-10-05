#!/usr/bin/env python3
import json
from pathlib import Path
from PIL import Image, ImageDraw, ImageFilter

ROOT=Path(__file__).resolve().parents[1]
MOD=ROOT/'public/assets/bar/modular'
MANIFESTS=ROOT/'scripts/modular-scenes'

def shape_points(shape,w,h):
    if shape.get('type','rect')=='polygon':
        return [(round(p['x']*w),round(p['y']*h)) for p in shape['points']]
    x=round(shape['x']*w); y=round(shape['y']*h)
    rw=round(shape['width']*w); rh=round(shape['height']*h)
    return [(x,y),(x+rw,y+rh)]

def draw_shape(draw,shape,w,h,fill):
    if shape.get('type','rect')=='polygon':
        draw.polygon(shape_points(shape,w,h),fill=fill)
    else:
        (x0,y0),(x1,y1)=shape_points(shape,w,h)
        draw.rectangle((x0,y0,x1,y1),fill=fill)

def module_crop(manifest,role,source_size):
    module=manifest.get('modules',{}).get(f'{role}-reference')
    if not module:
        if role=='seating':
            rect=manifest.get('slotsNormalized',{}).get('seating')
            if not rect:
                raise RuntimeError(f"{manifest['id']}/{role}: missing source region")
            return (
                round(rect['x']*source_size[0]),round(rect['y']*source_size[1]),
                round((rect['x']+rect['width'])*source_size[0]),round((rect['y']+rect['height'])*source_size[1])
            )
        raise RuntimeError(f"{manifest['id']}/{role}: missing module reference")
    if 'cropNormalized' in module:
        r=module['cropNormalized']
        return (
            round(r['x']*source_size[0]),round(r['y']*source_size[1]),
            round((r['x']+r['width'])*source_size[0]),round((r['y']+r['height'])*source_size[1])
        )
    r=module['crop']
    aw=manifest.get('canvas',{}).get('width',source_size[0])
    ah=manifest.get('canvas',{}).get('height',source_size[1])
    sx=source_size[0]/aw; sy=source_size[1]/ah
    return (round(r['x']*sx),round(r['y']*sy),round((r['x']+r['width'])*sx),round((r['y']+r['height'])*sy))

def build(manifest_path,manifest,role,spec):
    scene_id=manifest['id']
    base=MOD/scene_id
    source_value=manifest['source']
    if source_value.startswith('../../../public/'):
        source_value='../../public/'+source_value[len('../../../public/'):]
    source_path=(manifest_path.parent/source_value).resolve()
    source=Image.open(source_path).convert('RGBA')
    image=source.crop(module_crop(manifest,role,source.size))
    w,h=image.size
    mask=Image.new('L',(w,h),0)
    draw=ImageDraw.Draw(mask)
    for shape in spec.get('include',[]):
        draw_shape(draw,shape,w,h,255)
    for shape in spec.get('exclude',[]):
        draw_shape(draw,shape,w,h,0)
    feather=float(spec.get('feather',1.5))
    if feather>0:
        mask=mask.filter(ImageFilter.GaussianBlur(feather))
    cut=image.copy()
    cut.putalpha(mask)
    out=base/'manual'
    out.mkdir(exist_ok=True)
    cut.save(out/f'{role}-cut.webp','WEBP',lossless=True,method=6)
    mask.save(out/f'{role}-mask.png','PNG',optimize=True)
    return {'scene':scene_id,'role':role,'size':[w,h]}

def main():
    rows=[]
    for path in sorted(MANIFESTS.glob('*.json')):
        manifest=json.loads(path.read_text())
        for role,spec in manifest.get('manualRoleMasksNormalized',{}).items():
            rows.append(build(path,manifest,role,spec))
    report=ROOT/'docs/modular-review/manual-role-cuts.json'
    report.write_text(json.dumps({'count':len(rows),'items':rows},indent=2)+'\n')
    print(f'manual role cuts: {len(rows)}')
    for row in rows:
        print(f"- {row['scene']}/{row['role']} {row['size'][0]}x{row['size'][1]}")

if __name__=='__main__':
    main()
