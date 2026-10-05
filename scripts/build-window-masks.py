#!/usr/bin/env python3
import json
from pathlib import Path
from PIL import Image, ImageDraw

ROOT=Path(__file__).resolve().parents[1]
MOD=ROOT/'public/assets/bar/modular'
QUEUE=ROOT/'docs/modular-review/architecture-queue.json'

def draw_cutout(draw, cutout, width, height):
    kind=cutout.get('type','rect')
    if kind=='polygon':
        points=[(round(p['x']*width),round(p['y']*height)) for p in cutout['points']]
        draw.polygon(points,fill=255)
        return
    x=round(cutout['x']*width)
    y=round(cutout['y']*height)
    w=round(cutout['width']*width)
    h=round(cutout['height']*height)
    draw.rectangle((x,y,x+w,y+h),fill=255)

def main():
    queue=json.loads(QUEUE.read_text())
    rows=[]
    for item in queue['scenes']:
        base=MOD/item['id']
        plan=json.loads((base/'scene-plan.json').read_text())
        manifest_path=ROOT/'scripts/modular-scenes'/f"{item['id']}.json"
        manifest=json.loads(manifest_path.read_text())
        cutouts=manifest.get('windowCutoutsNormalized') or plan.get('windowCutouts',[])
        if not cutouts:
            continue
        width=plan['canvas']['width']
        height=plan['canvas']['height']
        mask=Image.new('L',(width,height),0)
        draw=ImageDraw.Draw(mask)
        for cutout in cutouts:
            draw_cutout(draw,cutout,width,height)
        out=base/'window-mask.png'
        mask.save(out,'PNG',optimize=True)
        rows.append({
            'scene':item['id'],
            'mask':str(out.relative_to(ROOT)),
            'cutouts':len(cutouts),
            'canvas':plan['canvas']
        })
    report=ROOT/'docs/modular-review/window-masks.json'
    report.write_text(json.dumps({'count':len(rows),'scenes':rows},indent=2)+'\n')
    print(f'window masks: {len(rows)}')
    for row in rows:
        print(f"- {row['scene']}: {row['cutouts']} cutout(s)")

if __name__=='__main__':
    main()
