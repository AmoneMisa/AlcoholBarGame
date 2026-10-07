"""Compact visual review sheets for source rooms, edit references and generated assets."""
import argparse
import json
from pathlib import Path
from PIL import Image, ImageDraw

ROOT=Path(__file__).resolve().parents[1]
parser=argparse.ArgumentParser()
parser.add_argument('--scenes',nargs='+',required=True)
parser.add_argument('--mode',choices=['originals','references','generated'],default='originals')
parser.add_argument('--output',required=True)
args=parser.parse_args()
roles=['architecture'] if args.mode=='originals' else ['shelf','counter','seat'] if args.mode=='references' else ['architecture','shelf','counter','seat']
columns=2 if args.mode=='originals' else len(roles)
width=600 if args.mode=='originals' else 380
height=360 if args.mode=='originals' else 230
rows=(len(args.scenes)+1)//2 if args.mode=='originals' else len(args.scenes)
sheet=Image.new('RGB',(width*columns,height*rows),'#171b23')
draw=ImageDraw.Draw(sheet)
for index,scene in enumerate(args.scenes):
    for column,role in enumerate(roles):
        if args.mode=='originals':
            path=ROOT/'public/assets/bar/backgrounds'/f'interior-{scene}.webp'
            x=(index%2)*width
            y=(index//2)*height
        else:
            x=column*width
            y=index*height
            path=ROOT/'public/assets/bar/modular'/scene/f'{role}-generation-reference-all.webp'
            if args.mode=='generated':
                result=json.loads((ROOT/'.tmp/modular-all/results'/f'{scene}-{role}.json').read_text())
                path=Path(result['source'])
        draw.text((x+7,y+5),f'{scene}/{role}',fill='white')
        with Image.open(path) as raw:
            im=raw.convert('RGBA')
            im.thumbnail((width-12,height-30))
            sheet.paste(im,(x+6,y+24),im)
output=ROOT/args.output
output.parent.mkdir(parents=True,exist_ok=True)
sheet.save(output,'WEBP',quality=88)
print(output)
