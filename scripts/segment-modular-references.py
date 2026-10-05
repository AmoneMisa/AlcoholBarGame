#!/usr/bin/env python3
import argparse, json
from pathlib import Path
from PIL import Image
from rembg import remove, new_session

ROOT=Path(__file__).resolve().parents[1]
DEFAULT_IDS=[
  'garden','inferno-penthouse','speakeasy','jazz-cellar','art-deco','library',
  'palace','izakaya','parisian','loft','riad',
  'velvet','skyline','rooftop','cyberpunk','winter','beach','marina','desert','tropical'
]
ROLES=['counter','shelf','seating']

def alpha_metrics(image):
    a=image.getchannel('A')
    hist=a.histogram()
    total=sum(hist)
    visible=total-hist[0]
    solid=sum(hist[224:])
    bbox=a.getbbox()
    return {
      'coverage': round(visible/total,4) if total else 0,
      'solidCoverage': round(solid/total,4) if total else 0,
      'bbox': list(bbox) if bbox else None,
      'width': image.width,'height':image.height
    }

def process(scene_id,session):
    base=ROOT/'public/assets/bar/modular'/scene_id
    out=base/'auto'
    out.mkdir(parents=True,exist_ok=True)
    report={'scene':scene_id,'model':'u2net','roles':{}}
    for role in ROLES:
        src=base/f'{role}-reference.webp'
        if not src.exists():
            report['roles'][role]={'status':'missing-reference'}
            continue
        source=Image.open(src).convert('RGBA')
        cut=remove(source,session=session,alpha_matting=False)
        if not isinstance(cut,Image.Image):
            cut=Image.open(cut).convert('RGBA')
        else:
            cut=cut.convert('RGBA')
        metrics=alpha_metrics(cut)
        status='ok'
        x0,y0,x1,y1=metrics['bbox'] or [0,0,0,0]
        touches_all=(x0<=1 and y0<=1 and x1>=cut.width-1 and y1>=cut.height-1)
        if metrics['coverage']<0.03: status='reject-empty'
        elif metrics['coverage']>0.96: status='reject-full'
        elif metrics['coverage']>0.85: status='review-too-much'
        elif touches_all: status='review-all-edges'
        elif metrics['coverage']>0.45 and metrics['solidCoverage']<0.01: status='review-soft-mask'
        metrics['status']=status
        report['roles'][role]=metrics
        cut.save(out/f'{role}-cut.webp','WEBP',lossless=True,method=6)
        cut.getchannel('A').save(out/f'{role}-mask.png','PNG',optimize=True)
    (out/'segmentation-report.json').write_text(json.dumps(report,indent=2)+'\n')
    return report

def main():
    ap=argparse.ArgumentParser()
    ap.add_argument('--id',action='append',default=[])
    args=ap.parse_args()
    ids=args.id or DEFAULT_IDS
    session=new_session('u2net')
    bad=[]
    for scene_id in ids:
        report=process(scene_id,session)
        print(json.dumps(report))
        for role,data in report['roles'].items():
            if data.get('status','').startswith('reject-'):
                bad.append(f'{scene_id}:{role}:{data["status"]}')
    if bad:
        print('Review required:',', '.join(bad))

if __name__=='__main__':
    main()
