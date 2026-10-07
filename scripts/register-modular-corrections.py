"""Keep furniture coordinates stable when a native edit removes bounding-box pixels."""
import argparse
import hashlib
import json
from pathlib import Path
from PIL import Image

ROOT=Path(__file__).resolve().parents[1]
parser=argparse.ArgumentParser()
parser.add_argument('--part',required=True)
args=parser.parse_args()
report=json.loads((ROOT/'docs/modular-review'/f'generated-batch-2026-10-07-all-{args.part}.json').read_text())
for packed in report['items']:
    if packed['role']=='architecture':continue
    path=ROOT/'.tmp/modular-all/results'/f"{packed['scene']}-{packed['role']}.json"
    item=json.loads(path.read_text())
    if not item.get('corrections'):continue
    prior=ROOT/packed['source']
    current=Path(item['source'])
    if hashlib.sha256(prior.read_bytes()).digest()==hashlib.sha256(current.read_bytes()).digest():continue
    packing=packed['packing']
    if 'contentRectPixels' not in packing:continue
    with Image.open(current) as raw:
        width,height=raw.size
        bounds=raw.convert('RGBA').getchannel('A').point(lambda a:255 if a>=200 else 0).getbbox()
    old_width,old_height=packing['generatedSize']
    left,top,right,bottom=packing['contentBounds']
    x,y,target_width,target_height=packing['contentRectPixels']
    scale_x=target_width/((right-left)/old_width)
    scale_y=target_height/((bottom-top)/old_height)
    rect={
        'x':(x+(bounds[0]/width-left/old_width)*scale_x)/packed['size'][0],
        'y':(y+(bounds[1]/height-top/old_height)*scale_y)/packed['size'][1],
        'width':((bounds[2]-bounds[0])/width*scale_x)/packed['size'][0],
        'height':((bounds[3]-bounds[1])/height*scale_y)/packed['size'][1],
    }
    if any(value<0 for value in rect.values()) or rect['x']+rect['width']>1.01 or rect['y']+rect['height']>1.01:
        raise ValueError(f"Review edited bounding box before registration: {item['scene']}")
    item['correctionRegistration']={'priorArchive':packed['source'],'priorContentRect':item.get('contentRectNormalized'),'updatedContentRect':rect}
    item['contentRectNormalized']=rect
    path.write_text(json.dumps(item)+'\n')
    print(item['scene']+'/'+item['role']+': preserved full-canvas placement')
