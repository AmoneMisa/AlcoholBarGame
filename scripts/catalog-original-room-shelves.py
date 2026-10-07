"""Catalog existing source furniture fragments; do not create or modify images."""
import json
from pathlib import Path
from PIL import Image

root=Path(__file__).resolve().parents[1]
catalog={}
for folder in sorted((root/'public/assets/bar/modular').iterdir()):
    if not folder.is_dir() or folder.name=='velvet':
        continue
    for relative in ['manual/shelf-cut.webp','shelf-reference.webp']:
        asset=folder/relative
        if not asset.exists():
            continue
        image=Image.open(asset).convert('RGBA')
        alpha=image.getchannel('A').point(lambda value:255 if value>40 else 0)
        box=alpha.getbbox()
        if not box:
            continue
        x0,y0,x1,y1=box
        plan=json.loads((folder/'scene-plan.json').read_text(encoding='utf-8'))
        catalog[folder.name]={'asset':'/assets/bar/modular/'+folder.name+'/'+relative,
            'sourceRect':plan['modules']['shelf-reference']['rect'],
            'bounds':{'crop':{'x':x0/image.width,'y':y0/image.height,'width':(x1-x0)/image.width,'height':(y1-y0)/image.height},
                      'aspect':(x1-x0)/(y1-y0),'surface':0}}
        break
target=root/'src/data/cosmetics/originalRoomShelves.ts'
glass=Image.open(root/'public/assets/drinks/glass/live-highball-v1.webp').convert('RGBA')
box=glass.getchannel('A').point(lambda value:255 if value>40 else 0).getbbox()
x0,y0,x1,y1=box
glass_art={'asset':'/assets/drinks/glass/live-highball-v1.webp','crop':{'x':x0/glass.width,'y':y0/glass.height,'width':(x1-x0)/glass.width,'height':(y1-y0)/glass.height},'aspect':(x1-x0)/(y1-y0)}
target.write_text('// Existing source fragments, cataloged by scripts/catalog-original-room-shelves.py.\nexport const ORIGINAL_ROOM_SHELVES: Record<string, {asset:string;sourceRect:{x:number;y:number;width:number;height:number}; bounds:{crop:{x:number;y:number;width:number;height:number};aspect:number;surface:number}}> = '+json.dumps(catalog,indent=2)+';\nexport const COUNTER_GLASSWARE = '+json.dumps(glass_art)+';\n',encoding='utf-8',newline='\n')
print(f'Cataloged {len(catalog)} original shelf arrangements')
