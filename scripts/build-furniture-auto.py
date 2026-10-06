#!/usr/bin/env python3
import json
from pathlib import Path

import cv2
import numpy as np
from PIL import Image, ImageDraw

ROOT=Path(__file__).resolve().parents[1]
MOD=ROOT/'public/assets/bar/modular'
SUMMARY=ROOT/'docs/modular-review/summary.json'
OUT=ROOT/'docs/modular-review'

def save_rgba(array,path):
    Image.fromarray(array.astype(np.uint8),'RGBA').save(path,'WEBP',lossless=True,method=6)

def clean_counter(src_path,out_path):
    rgba=np.asarray(Image.open(src_path).convert('RGBA')).copy()
    alpha=rgba[:,:,3]
    h,w=alpha.shape
    occupancy=(alpha>28).mean(axis=1)
    dense=np.flatnonzero(occupancy>.55)
    top=int(dense[0]) if len(dense) else 0
    # Loose objects live above the first continuous counter band. Keep a tiny
    # antialiased lip but clear the rest so architecture shows through.
    clear_to=max(0,top-2)
    rgba[:clear_to,:,3]=0
    if clear_to<top+2:
        fade=np.linspace(0,1,max(1,top+2-clear_to),endpoint=True)
        for row,factor in enumerate(fade,start=clear_to):
            if row<h: rgba[row,:,3]=(rgba[row,:,3].astype(np.float32)*factor).astype(np.uint8)
    save_rgba(rgba,out_path)
    return {'top':top,'occupancy':round(float(occupancy[top]) if top<h else 0,4)}

def polygon_points(shape,rect,w,h):
    points=shape.get('points',[])
    return [(
        int(round(((float(p['x'])-rect['x'])/rect['width'])*w)),
        int(round(((float(p['y'])-rect['y'])/rect['height'])*h))
    ) for p in points]

def clean_shelf(scene,src_path,out_path):
    rgba=np.asarray(Image.open(src_path).convert('RGBA')).copy()
    h,w=rgba.shape[:2]
    plan=json.loads((MOD/scene/'scene-plan.json').read_text())
    module=plan.get('modules',{}).get('shelf-reference',{})
    rect=module.get('rect') or plan.get('slots',{}).get('shelves')
    rows=[float(value) for value in plan.get('shelfRows',[])]
    if not rect or not rows:
        save_rgba(rgba,out_path)
        return {'bands':0,'windowHoles':0}

    local_rows=sorted(max(0,min(h-1,int(round(((value-rect['y'])/rect['height'])*h)))) for value in rows)
    rgb=rgba[:,:,:3].copy()
    mask=np.zeros((h,w),np.uint8)
    left=max(1,int(w*.055));right=min(w-1,int(w*.945))
    previous=max(1,int(h*.04))
    bands=0
    for baseline in local_rows:
        y0=previous+max(2,int(h*.025))
        y1=baseline-max(2,int(h*.025))
        if y1-y0>=5:
            cv2.rectangle(mask,(left,y0),(right,y1),255,-1)
            bands+=1
        previous=baseline

    # Never inpaint an actual window/exterior opening inside the shelf bounds.
    window_holes=0
    window_local=np.zeros((h,w),np.uint8)
    for shape in plan.get('windowCutouts',[]):
        if shape.get('type','polygon')=='polygon' and shape.get('points'):
            pts=np.array(polygon_points(shape,rect,w,h),np.int32)
            if len(pts)>=3:
                cv2.fillPoly(window_local,[pts],255)
                window_holes+=1
        elif shape.get('type')=='rect':
            x0=int(round(((shape['x']-rect['x'])/rect['width'])*w))
            y0=int(round(((shape['y']-rect['y'])/rect['height'])*h))
            x1=int(round(((shape['x']+shape['width']-rect['x'])/rect['width'])*w))
            y1=int(round(((shape['y']+shape['height']-rect['y'])/rect['height'])*h))
            cv2.rectangle(window_local,(x0,y0),(x1,y1),255,-1)
            window_holes+=1
    mask[window_local>0]=0

    if np.any(mask):
        bgr=cv2.cvtColor(rgb,cv2.COLOR_RGB2BGR)
        filled=cv2.inpaint(bgr,mask,5,cv2.INPAINT_TELEA)
        rgba[:,:,:3]=cv2.cvtColor(filled,cv2.COLOR_BGR2RGB)
    # Exterior belongs to the architecture/exterior layer, never the shelf art.
    rgba[window_local>0,3]=0
    save_rgba(rgba,out_path)
    return {'bands':bands,'windowHoles':window_holes,'maskFraction':round(float(np.count_nonzero(mask))/(w*h),4)}

def thumb(path,size=(190,135)):
    image=Image.open(path).convert('RGBA')
    image.thumbnail(size,Image.Resampling.LANCZOS)
    canvas=Image.new('RGBA',size,(34,34,40,255))
    draw=ImageDraw.Draw(canvas)
    q=12
    for y in range(0,size[1],q):
        for x in range(0,size[0],q):
            if ((x//q)+(y//q))%2:
                draw.rectangle((x,y,x+q-1,y+q-1),fill=(49,49,57,255))
    canvas.alpha_composite(image,((size[0]-image.width)//2,(size[1]-image.height)//2))
    return canvas.convert('RGB')

def main():
    summary=json.loads(SUMMARY.read_text())
    records=[]
    for item in summary:
        scene=item['scene']
        if scene=='velvet':
            continue
        base=MOD/scene
        out=base/'clean-auto'
        out.mkdir(parents=True,exist_ok=True)
        record={'scene':scene,'assets':[]}
        if 'counter' in item.get('requiredRoles',[]):
            src=base/'review-ready'/'counter.webp'
            dst=out/'counter.webp'
            record['counter']=clean_counter(src,dst)
            record['assets'].append('counter')
        if 'shelf' in item.get('requiredRoles',[]):
            src=base/'review-ready'/'shelf.webp'
            dst=out/'shelf.webp'
            record['shelf']=clean_shelf(scene,src,dst)
            record['assets'].append('shelf')
        if 'seating' in item.get('requiredRoles',[]):
            src=base/'manual'/'seat.webp'
            dst=out/'seat.webp'
            Image.open(src).convert('RGBA').save(dst,'WEBP',lossless=True,method=6)
            record['assets'].append('seat')
        records.append(record)

    report={'count':len(records),'scenes':records}
    (OUT/'furniture-auto.json').write_text(json.dumps(report,indent=2)+'\n')

    cols=4;cell_w=410;cell_h=180
    rows=max(1,(len(records)+cols-1)//cols)
    sheet=Image.new('RGB',(cols*cell_w,rows*cell_h),(15,15,19))
    draw=ImageDraw.Draw(sheet)
    for index,item in enumerate(records):
        x=(index%cols)*cell_w;y=(index//cols)*cell_h
        draw.text((x+8,y+5),item['scene'],fill=(235,235,240))
        base=MOD/item['scene']/'clean-auto'
        if (base/'counter.webp').exists(): sheet.paste(thumb(base/'counter.webp'),(x+8,y+27))
        if (base/'shelf.webp').exists(): sheet.paste(thumb(base/'shelf.webp'),(x+207,y+27))
    sheet.save(OUT/'furniture-auto.jpg','JPEG',quality=86,optimize=True)
    print(f'furniture auto-clean: {len(records)} scene(s)')

if __name__=='__main__':
    main()
