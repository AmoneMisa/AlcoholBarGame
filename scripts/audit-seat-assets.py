#!/usr/bin/env python3
import json
from pathlib import Path
from PIL import Image

ROOT=Path(__file__).resolve().parents[1]
MOD=ROOT/'public/assets/bar/modular'
SUMMARY=ROOT/'docs/modular-review/summary.json'

def ratio(values):
    values=list(values)
    return sum(1 for value in values if value>24)/max(1,len(values))

def audit(scene):
    mask_path=MOD/scene/'manual'/'seat-mask.png'
    if not mask_path.exists():
        return {'scene':scene,'missing':True,'flags':['missing-seat-mask']}
    with Image.open(mask_path) as image:
        mask=image.convert('L')
    w,h=mask.size
    pixels=mask.load()
    left=ratio(pixels[x,y] for x in range(max(1,w//40)) for y in range(h))
    right=ratio(pixels[x,y] for x in range(max(0,w-w//40),w) for y in range(h))
    top=ratio(pixels[x,y] for x in range(w) for y in range(max(1,h//40)))
    bottom=ratio(pixels[x,y] for x in range(w) for y in range(max(0,h-h//40),h))
    occupied=sum(1 for value in mask.getdata() if value>24)/(w*h)
    flags=[]
    if left>.16: flags.append('left-edge-contact')
    if right>.16: flags.append('right-edge-contact')
    if top>.30: flags.append('top-edge-contact')
    if occupied>.68: flags.append('mask-too-full')
    if occupied<.055: flags.append('mask-too-small')
    return {
        'scene':scene,'missing':False,'size':[w,h],
        'edge':{'left':round(left,4),'right':round(right,4),'top':round(top,4),'bottom':round(bottom,4)},
        'occupied':round(occupied,4),'flags':flags
    }

def main():
    summary=json.loads(SUMMARY.read_text())
    seating=[item['scene'] for item in summary if 'seating' in item.get('requiredRoles',[])]
    rows=[audit(scene) for scene in seating]
    flagged=[item for item in rows if item['flags']]
    report={'count':len(rows),'flaggedCount':len(flagged),'flagged':[item['scene'] for item in flagged],'items':rows}
    out=ROOT/'docs/modular-review/seat-audit.json'
    out.write_text(json.dumps(report,indent=2)+'\n')
    print(f"seat audit: {len(rows)} assets, {len(flagged)} flagged")
    for item in flagged:
        print(f"- {item['scene']}: {', '.join(item['flags'])}")

if __name__=='__main__':
    main()
