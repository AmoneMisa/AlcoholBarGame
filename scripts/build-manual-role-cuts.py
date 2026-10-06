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
    shape_type=shape.get('type','rect')
    if shape_type=='polygon':
        draw.polygon(shape_points(shape,w,h),fill=fill)
    elif shape_type=='ellipse':
        (x0,y0),(x1,y1)=shape_points(shape,w,h)
        draw.ellipse((x0,y0,x1,y1),fill=fill)
    else:
        (x0,y0),(x1,y1)=shape_points(shape,w,h)
        draw.rectangle((x0,y0,x1,y1),fill=fill)

def module_crop(manifest,role,source_size):
    module=manifest.get('modules',{}).get(f'{role}-reference')
    if not module:
        if role=='seating':
            rect=manifest.get('slotsNormalized',{}).get('seating')
            if rect:
                return (
                    round(rect['x']*source_size[0]),round(rect['y']*source_size[1]),
                    round((rect['x']+rect['width'])*source_size[0]),round((rect['y']+rect['height'])*source_size[1])
                )
            rect=manifest.get('slots',{}).get('seating')
            if rect:
                aw=manifest.get('canvas',{}).get('width',source_size[0])
                ah=manifest.get('canvas',{}).get('height',source_size[1])
                sx=source_size[0]/aw; sy=source_size[1]/ah
                return (
                    round(rect['x']*sx),round(rect['y']*sy),
                    round((rect['x']+rect['width'])*sx),round((rect['y']+rect['height'])*sy)
                )
            raise RuntimeError(f"{manifest['id']}/{role}: missing source region")
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

def crop_normalized(source,rect):
    w,h=source.size
    return source.crop((
        round(rect['x']*w), round(rect['y']*h),
        round((rect['x']+rect['width'])*w),
        round((rect['y']+rect['height'])*h)
    ))

def build_masked_cut(image,spec):
    w,h=image.size
    cut,mask=build_masked_cut(image,spec)
    return cut,mask

def build(manifest,source,role,spec):
    scene_id=manifest['id']
    base=MOD/scene_id
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

def build_seat(manifest,source,index,item):
    scene_id=manifest['id']
    seat_id=item.get('id',f'seat-{index+1:02d}')
    image=crop_normalized(source,item['cropNormalized'])
    w,h=image.size
    cut,mask=build_masked_cut(image,item.get('mask',{}))
    out=MOD/scene_id/'manual'/'seats'
    out.mkdir(parents=True,exist_ok=True)
    cut.save(out/f'{seat_id}.webp','WEBP',lossless=True,method=6)
    mask.save(out/f'{seat_id}-mask.png','PNG',optimize=True)
    return {'scene':scene_id,'role':'seat','id':seat_id,'size':[w,h]}

def main():
    rows=[]
    for path in sorted(MANIFESTS.glob('*.json')):
        manifest=json.loads(path.read_text())
        specs=manifest.get('manualRoleMasksNormalized',{})
        if not specs:
            continue
        source_value=manifest['source']
        if source_value.startswith('../../../public/'):
            source_value='../../public/'+source_value[len('../../../public/'):]
        source_path=(path.parent/source_value).resolve()
        with Image.open(source_path) as source_file:
            source=source_file.convert('RGBA')
            for role,spec in specs.items():
                rows.append(build(manifest,source,role,spec))
            for index,item in enumerate(manifest.get('manualSeatCutsNormalized',[])):
                rows.append(build_seat(manifest,source,index,item))
    report=ROOT/'docs/modular-review/manual-role-cuts.json'
    report.write_text(json.dumps({'count':len(rows),'items':rows},indent=2)+'\n')
    print(f'manual role cuts: {len(rows)}')
    for row in rows:
        print(f"- {row['scene']}/{row['role']} {row['size'][0]}x{row['size'][1]}")

if __name__=='__main__':
    main()
