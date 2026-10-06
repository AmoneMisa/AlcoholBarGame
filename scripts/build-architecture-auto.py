#!/usr/bin/env python3
import json
from pathlib import Path

import cv2
import numpy as np
from PIL import Image, ImageDraw

ROOT=Path(__file__).resolve().parents[1]
MOD=ROOT/'public/assets/bar/modular'
MANIFESTS=ROOT/'scripts/modular-scenes'
SUMMARY=ROOT/'docs/modular-review/summary.json'
OUT=ROOT/'docs/modular-review'

def source_path(manifest_path,source):
    value=source
    if value.startswith('../../../public/'):
        value='../../public/'+value[len('../../../public/'):]
    return (manifest_path.parent/value).resolve()

def fit_mask(path,size):
    with Image.open(path) as image:
        mask=image.convert('L')
    if mask.size!=size:
        mask=mask.resize(size,Image.Resampling.LANCZOS)
    return np.asarray(mask,dtype=np.uint8)

def checker_thumb(image,size=(220,150)):
    rgba=image.convert('RGBA').copy()
    rgba.thumbnail(size,Image.Resampling.LANCZOS)
    canvas=Image.new('RGBA',size,(34,34,40,255))
    draw=ImageDraw.Draw(canvas)
    q=12
    for y in range(0,size[1],q):
        for x in range(0,size[0],q):
            if ((x//q)+(y//q))%2:
                draw.rectangle((x,y,x+q-1,y+q-1),fill=(50,50,58,255))
    x=(size[0]-rgba.width)//2
    y=(size[1]-rgba.height)//2
    canvas.alpha_composite(rgba,(x,y))
    return canvas.convert('RGB')

def inpaint_architecture(scene):
    scene_id=scene['scene']
    base=MOD/scene_id
    mask_path=base/'architecture-mask.png'
    if not mask_path.exists():
        return None
    manifest_path=MANIFESTS/f'{scene_id}.json'
    manifest=json.loads(manifest_path.read_text())
    src=source_path(manifest_path,manifest['source'])
    with Image.open(src) as image_file:
        source=image_file.convert('RGB')
    rgb=np.asarray(source,dtype=np.uint8)
    height,width=rgb.shape[:2]
    soft=fit_mask(mask_path,(width,height))
    binary=np.where(soft>36,255,0).astype(np.uint8)

    max_dim=max(width,height)
    scale=min(1.0,1100/max_dim)
    if scale<1:
        sw=max(8,round(width*scale))
        sh=max(8,round(height*scale))
        small=cv2.resize(rgb,(sw,sh),interpolation=cv2.INTER_AREA)
        small_mask=cv2.resize(binary,(sw,sh),interpolation=cv2.INTER_NEAREST)
    else:
        small=rgb
        small_mask=binary

    bgr=cv2.cvtColor(small,cv2.COLOR_RGB2BGR)
    filled=cv2.inpaint(bgr,small_mask,5,cv2.INPAINT_TELEA)
    filled=cv2.cvtColor(filled,cv2.COLOR_BGR2RGB)
    if scale<1:
        filled=cv2.resize(filled,(width,height),interpolation=cv2.INTER_CUBIC)

    blend=(soft.astype(np.float32)/255.0)[...,None]
    out_rgb=np.clip(rgb.astype(np.float32)*(1-blend)+filled.astype(np.float32)*blend,0,255).astype(np.uint8)
    alpha=np.full((height,width),255,dtype=np.uint8)
    window=base/'window-mask.png'
    if window.exists():
        window_mask=fit_mask(window,(width,height))
        alpha=np.minimum(alpha,255-window_mask)

    rgba=np.dstack([out_rgb,alpha])
    output=base/'architecture-auto.webp'
    Image.fromarray(rgba,'RGBA').save(output,'WEBP',lossless=True,method=6)
    return {
        'scene':scene_id,
        'output':str(output.relative_to(ROOT)),
        'maskFraction':round(float(np.count_nonzero(binary))/(width*height),4),
        'size':[width,height],
        'windowTransparent':window.exists()
    }

def main():
    summary=json.loads(SUMMARY.read_text())
    rows=[]
    for scene in summary:
        if scene.get('architectureReady'):
            continue
        item=inpaint_architecture(scene)
        if item:
            rows.append(item)

    report={'count':len(rows),'scenes':rows}
    (OUT/'architecture-auto.json').write_text(json.dumps(report,indent=2)+'\n')

    cols=5
    cell_w,cell_h=240,185
    grid_rows=max(1,(len(rows)+cols-1)//cols)
    sheet=Image.new('RGB',(cols*cell_w,grid_rows*cell_h),(15,15,19))
    draw=ImageDraw.Draw(sheet)
    for index,item in enumerate(rows):
        x=(index%cols)*cell_w
        y=(index//cols)*cell_h
        draw.text((x+8,y+6),f"{item['scene']}  mask {item['maskFraction']:.1%}",fill=(235,235,240))
        with Image.open(ROOT/item['output']) as image:
            sheet.paste(checker_thumb(image,(cell_w-16,cell_h-30)),(x+8,y+26))
    sheet.save(OUT/'architecture-auto.jpg','JPEG',quality=86,optimize=True)

    print(f'architecture auto-inpaint: {len(rows)} scene(s)')
    for item in rows:
        print(f"- {item['scene']}: mask={item['maskFraction']:.1%}")

if __name__=='__main__':
    main()
