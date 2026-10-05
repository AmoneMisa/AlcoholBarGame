#!/usr/bin/env python3
import json
from pathlib import Path
from PIL import Image
from rembg import remove, new_session

ROOT=Path(__file__).resolve().parents[1]
MOD=ROOT/'public/assets/bar/modular'
ROLES=['counter','shelf','seating']

def metrics(image):
    a=image.getchannel('A'); hist=a.histogram(); total=sum(hist); visible=total-hist[0]; solid=sum(hist[224:]); bbox=a.getbbox()
    out={'coverage':round(visible/total,4) if total else 0,'solidCoverage':round(solid/total,4) if total else 0,'bbox':list(bbox) if bbox else None,'width':image.width,'height':image.height}
    x0,y0,x1,y1=out['bbox'] or [0,0,0,0]
    touches_all=(x0<=1 and y0<=1 and x1>=image.width-1 and y1>=image.height-1)
    status='candidate'
    if out['coverage']<0.03: status='reject-empty'
    elif out['coverage']>0.96: status='reject-full'
    elif out['coverage']>0.85: status='review-too-much'
    elif touches_all: status='review-all-edges'
    elif out['coverage']>0.45 and out['solidCoverage']<0.01: status='review-soft-mask'
    out['status']=status
    return out

session=new_session('u2netp')
processed=0
for base in sorted(MOD.iterdir()):
    if not base.is_dir(): continue
    if (base/'auto/segmentation-report.json').exists(): continue
    out=base/'auto-candidate'; out.mkdir(parents=True,exist_ok=True)
    report={'scene':base.name,'model':'u2netp','quality':'candidate-only','roles':{}}
    for role in ROLES:
        src=base/f'{role}-reference.webp'
        if not src.exists():
            report['roles'][role]={'status':'missing-reference'}
            continue
        source=Image.open(src).convert('RGBA')
        cut=remove(source,session=session,alpha_matting=False).convert('RGBA')
        info=metrics(cut); report['roles'][role]=info
        cut.save(out/f'{role}-cut.webp','WEBP',lossless=True,method=6)
        cut.getchannel('A').save(out/f'{role}-mask.png','PNG',optimize=True)
    (out/'segmentation-report.json').write_text(json.dumps(report,indent=2)+'\n')
    processed+=1
    print(base.name, json.dumps(report['roles']))
print('processed',processed)
