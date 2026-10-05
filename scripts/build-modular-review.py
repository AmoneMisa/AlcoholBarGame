#!/usr/bin/env python3
import json
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

ROOT=Path(__file__).resolve().parents[1]
MOD=ROOT/'public/assets/bar/modular'
OUT=ROOT/'docs/modular-review'
OUT.mkdir(parents=True,exist_ok=True)
ROLES=('counter','shelf','seating')

def thumb(img,size=(420,250)):
    out=Image.new('RGB',size,(20,20,24))
    copy=img.convert('RGBA').copy()
    copy.thumbnail(size,Image.Resampling.LANCZOS)
    x=(size[0]-copy.width)//2; y=(size[1]-copy.height)//2
    bg=Image.new('RGBA',size,(20,20,24,255))
    checker=Image.new('RGBA',size,(34,34,40,255))
    d=ImageDraw.Draw(checker)
    q=16
    for yy in range(0,size[1],q):
        for xx in range(0,size[0],q):
            if ((xx//q)+(yy//q))%2: d.rectangle((xx,yy,xx+q-1,yy+q-1),fill=(48,48,56,255))
    checker.alpha_composite(copy,(x,y))
    return checker.convert('RGB')

def label(canvas,xy,text):
    ImageDraw.Draw(canvas).text(xy,text,fill=(235,235,240))

summary=[]
for base in sorted(p for p in MOD.iterdir() if p.is_dir()):
    measured=base/'auto/segmentation-report.json'
    candidate=base/'auto-candidate/segmentation-report.json'
    report_path=measured if measured.exists() else candidate if candidate.exists() else None
    if not report_path: continue
    data=json.loads(report_path.read_text())
    kind='measured' if measured.exists() else 'candidate'
    review=base/'review-ready'
    review.mkdir(exist_ok=True)
    promoted=[]
    if kind=='measured':
        for role,item in data.get('roles',{}).items():
            if item.get('status')!='ok': continue
            src=base/'auto'/f'{role}-cut.webp'
            mask=base/'auto'/f'{role}-mask.png'
            if src.exists():
                Image.open(src).save(review/f'{role}.webp','WEBP',lossless=True,method=6)
                promoted.append(role)
            if mask.exists(): Image.open(mask).save(review/f'{role}-mask.png','PNG',optimize=True)
    sheet=Image.new('RGB',(1280,930),(15,15,19))
    label(sheet,(20,16),f'{base.name} — {kind} — promoted: {", ".join(promoted) or "none"}')
    source_candidates=[base/'architecture-reference.webp',base/'counter-reference.webp']
    source=next((p for p in source_candidates if p.exists()),None)
    if source:
        sheet.paste(thumb(Image.open(source),(1240,300)),(20,45))
    y=365
    for idx,role in enumerate(ROLES):
        x=20+idx*420
        ref=base/f'{role}-reference.webp'
        cutdir=base/('auto' if kind=='measured' else 'auto-candidate')
        cut=cutdir/f'{role}-cut.webp'
        status=data.get('roles',{}).get(role,{}).get('status','missing')
        label(sheet,(x,y),f'{role}: {status}')
        if ref.exists(): sheet.paste(thumb(Image.open(ref),(400,230)),(x,y+22))
        if cut.exists(): sheet.paste(thumb(Image.open(cut),(400,230)),(x,y+270))
    sheet.save(OUT/f'{base.name}.jpg','JPEG',quality=84,optimize=True)
    summary.append({'scene':base.name,'kind':kind,'promoted':promoted,'roles':{k:v.get('status') for k,v in data.get('roles',{}).items()}})
(OUT/'summary.json').write_text(json.dumps(summary,indent=2)+'\n')
print('review sheets',len(summary),'promoted roles',sum(len(x['promoted']) for x in summary))
