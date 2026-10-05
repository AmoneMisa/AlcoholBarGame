#!/usr/bin/env python3
import json
from pathlib import Path
from PIL import Image, ImageDraw

ROOT=Path(__file__).resolve().parents[1]
MOD=ROOT/'public/assets/bar/modular'
OUT=ROOT/'docs/modular-review'
OUT.mkdir(parents=True,exist_ok=True)
ROLES=('counter','shelf','seating')

def thumb(img,size=(420,250)):
    copy=img.convert('RGBA').copy()
    copy.thumbnail(size,Image.Resampling.LANCZOS)
    x=(size[0]-copy.width)//2; y=(size[1]-copy.height)//2
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

def clean_furniture_ready(base,required_roles):
    if base.name=='velvet':
        legacy={'counter':'counter.webp','shelf':'shelf.webp','seating':'stool.webp'}
        return all((base/legacy[role]).exists() for role in required_roles)
    return all((base/'clean-ready'/f'{role}.webp').exists() for role in required_roles)

summary=[]
for base in sorted(p for p in MOD.iterdir() if p.is_dir()):
    measured=base/'auto/segmentation-report.json'
    candidate=base/'auto-candidate/segmentation-report.json'
    report_path=measured if measured.exists() else candidate if candidate.exists() else None
    if not report_path: continue

    data=json.loads(report_path.read_text())
    kind='measured' if measured.exists() else 'candidate'
    manifest_path=ROOT/'scripts/modular-scenes'/f'{base.name}.json'
    manifest=json.loads(manifest_path.read_text()) if manifest_path.exists() else {}
    required_roles=tuple(manifest.get('requiredRoles',ROLES))
    manual_approved=set(manifest.get('manualApprovedRoles',[]))
    review=base/'review-ready'
    review.mkdir(exist_ok=True)
    promoted=[]

    # review-ready is a strict promotion area, not a cache. Remove stale outputs
    # whenever a role stops being measured+ok or a scene falls back to candidate.
    for role in ROLES:
        item=data.get('roles',{}).get(role,{})
        approved=kind=='measured' and (item.get('status')=='ok' or role in manual_approved)
        webp=review/f'{role}.webp'
        mask_out=review/f'{role}-mask.png'
        if not approved:
            webp.unlink(missing_ok=True)
            mask_out.unlink(missing_ok=True)
            continue

        src=base/'auto'/f'{role}-cut.webp'
        mask=base/'auto'/f'{role}-mask.png'
        if src.exists():
            Image.open(src).save(webp,'WEBP',lossless=True,method=6)
            promoted.append(role)
        else:
            webp.unlink(missing_ok=True)
        if mask.exists():
            Image.open(mask).save(mask_out,'PNG',optimize=True)
        else:
            mask_out.unlink(missing_ok=True)

    statuses={k:v.get('status') for k,v in data.get('roles',{}).items()}
    architecture_ready=(base/'architecture.webp').exists()
    isolated_furniture_ready=kind=='measured' and all(statuses.get(role)=='ok' or role in manual_approved for role in required_roles)
    clean_furniture=clean_furniture_ready(base,required_roles)

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
        status=statuses.get(role,'missing')
        label(sheet,(x,y),f'{role}: {status}')
        if ref.exists(): sheet.paste(thumb(Image.open(ref),(400,230)),(x,y+22))
        if cut.exists(): sheet.paste(thumb(Image.open(cut),(400,230)),(x,y+270))
    sheet.save(OUT/f'{base.name}.jpg','JPEG',quality=84,optimize=True)

    summary.append({
        'scene':base.name,
        'kind':kind,
        'promoted':promoted,
        'roles':statuses,
        'requiredRoles':list(required_roles),
        'manualApprovedRoles':sorted(manual_approved),
        'architectureReady':architecture_ready,
        'furnitureReady':isolated_furniture_ready,
        'isolatedFurnitureReady':isolated_furniture_ready,
        'cleanFurnitureReady':clean_furniture,
        'productionReady':architecture_ready and clean_furniture
    })

(OUT/'summary.json').write_text(json.dumps(summary,indent=2)+'\n')
readiness={
    'total':len(summary),
    'measured':sum(item['kind']=='measured' for item in summary),
    'candidates':sum(item['kind']=='candidate' for item in summary),
    'furnitureReady':[item['scene'] for item in summary if item['isolatedFurnitureReady']],
    'isolatedFurnitureReady':[item['scene'] for item in summary if item['isolatedFurnitureReady']],
    'cleanFurnitureReady':[item['scene'] for item in summary if item['cleanFurnitureReady']],
    'architectureReady':[item['scene'] for item in summary if item['architectureReady']],
    'productionReady':[item['scene'] for item in summary if item['productionReady']],
    'blockedArchitecture':[item['scene'] for item in summary if item['isolatedFurnitureReady'] and not item['architectureReady']],
    'blockedFurnitureCleanup':[item['scene'] for item in summary if item['isolatedFurnitureReady'] and not item['cleanFurnitureReady']]
}
(OUT/'readiness.json').write_text(json.dumps(readiness,indent=2)+'\n')
print('review sheets',len(summary),'promoted roles',sum(len(x['promoted']) for x in summary))
print('isolated furniture',len(readiness['isolatedFurnitureReady']),'clean furniture',len(readiness['cleanFurnitureReady']),'production ready',len(readiness['productionReady']))
