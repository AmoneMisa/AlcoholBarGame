"""Report horizontal board edge candidates for manually selected furniture bays."""
import argparse
import json
from pathlib import Path
from PIL import Image, ImageStat

ROOT=Path(__file__).resolve().parents[1]
parser=argparse.ArgumentParser()
parser.add_argument('--scenes',nargs='+',required=True)
args=parser.parse_args()
for scene in args.scenes:
    manifest=json.loads((ROOT/'scripts/modular-scenes'/f'{scene}.json').read_text())
    crop=manifest['modules']['shelf-reference']['cropNormalized']
    image=Image.open(ROOT/'public/assets/bar/modular'/scene/'clean-ready/shelf.webp').convert('RGBA')
    units=manifest.get('generatedShelfUnits',manifest.get('shelfUnits',[]))
    print(scene)
    for unit in units:
        left=round((unit['x0']-crop['x'])/crop['width']*image.width)
        right=round((unit['x1']-crop['x'])/crop['width']*image.width)
        profile=[]
        for y in range(image.height):
            average=ImageStat.Stat(image.crop((max(0,left),y,min(image.width,right),y+1))).mean
            profile.append((average[1]+average[0]*.2)*average[3]/255)
        candidates=sorted(((profile[y]-profile[max(0,y-4)],y) for y in range(5,len(profile)-4)),reverse=True)
        selected=[]
        for score,y in candidates:
            if score<8:break
            if all(abs(y-old)>18 for old in selected):selected.append(y)
            if len(selected)==12:break
        print(unit['x0'],unit['x1'],sorted(round(crop['y']+y/image.height*crop['height'],3) for y in selected))
