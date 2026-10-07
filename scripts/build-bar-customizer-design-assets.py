"""Embed existing scene modules into a small, interactive design prototype."""
import base64
import json
from io import BytesIO
from pathlib import Path
from PIL import Image, ImageOps

root=Path(__file__).resolve().parents[1]
data=json.loads((root/'.tmp/modular-all/runtime-gallery.json').read_text(encoding='utf-8'))
def embed(image,width=600):
    image=image.copy()
    image.thumbnail((width,width))
    output=BytesIO()
    image.save(output,format='WEBP',quality=59,method=3)
    return 'data:image/webp;base64,'+base64.b64encode(output.getvalue()).decode()
def load(asset): return Image.open(root/('public'+asset)).convert('RGBA')
rooms=[]
seat_surfaces={
    'marina':{'x':.5,'y':.145,'frontBand':[.145,.265]},
    'loft':{'x':.5,'y':.11,'frontBand':[.11,.205]},
    'izakaya':{'x':.5,'y':.29,'frontBand':[0,.35]}
}
counter_surfaces={
    'marina':{'backY':.245,'jarX':.83,'jarY':.275},
    'loft':{'backY':.14,'jarX':.83,'jarY':.16},
    'izakaya':{'backY':.145,'jarX':.83,'jarY':.18}
}
for scene_id in ['marina','loft','izakaya']:
    scene=data['scenes'][scene_id]
    interior=next(item for item in data['interiors'] if item['id']==scene_id)
    layers=[]
    for layer in scene['layers']:
        layers.append({**layer,'image':embed(load(layer['asset']),540 if layer['role']=='architecture' else 320)})
    rooms.append({'id':scene_id,'label':interior['name'],'canvas':scene['canvas'],'layers':layers,
        'original':embed(load(scene['exterior']['asset']),540),'thumb':embed(load(interior['asset']),160),
        'shelfDecor':scene['shelfDecor'],'seatSurface':seat_surfaces[scene_id],
        'counterSurface':counter_surfaces[scene_id]})
backdrops=[{**item,'image':embed(load(item['asset']),400),'thumb':embed(load(item['asset']),140)} for item in data['backdrops']]
cast=load('/assets/characters/customers/velvet-hour-seated-cast-v2.webp')
guests=[embed(cast.crop((round(i*cast.width/5),0,round((i+1)*cast.width/5),cast.height)),180) for i in [0,1,3]]
bartender=load('/assets/characters/bartender/noa-natural-atlas-v2.webp')
bartender=bartender.crop((0,0,round(bartender.width/6),round(bartender.height/3)))
presets=json.loads((root/'.tmp/modular-all/design-bottle-presets.json').read_text(encoding='utf-8'))
for preset in presets:
    if preset.get('atlas'): preset['atlas']['image']=embed(load(preset['atlas']['asset']),480)
    config=preset.get('atlas',{})
    atlas=load(config.get('asset',data['atlas']))
    columns,rows=config.get('columns',data['atlasColumns']),config.get('rows',data['atlasRows'])
    preset['cellBounds']=[]
    for cell in range(columns*rows):
        x,y=cell%columns,cell//columns
        tile=atlas.crop((round(x*atlas.width/columns),round(y*atlas.height/rows),round((x+1)*atlas.width/columns),round((y+1)*atlas.height/rows)))
        alpha=tile.getchannel('A').point(lambda value:255 if value>24 else 0)
        box=alpha.getbbox() or (0,0,tile.width,tile.height)
        preset['cellBounds'].append({'x':box[0]/tile.width,'y':box[1]/tile.height,'width':(box[2]-box[0])/tile.width,'height':(box[3]-box[1])/tile.height})
    thumb=Image.new('RGBA',(192,108))
    for position,item in enumerate(preset['items'][:3]):
        cell=item['cell']; x=cell%columns; y=cell//columns
        bottle=atlas.crop((round(x*atlas.width/columns),round(y*atlas.height/rows),round((x+1)*atlas.width/columns),round((y+1)*atlas.height/rows)))
        bottle.thumbnail((60,104))
        thumb.alpha_composite(bottle,(position*64+(64-bottle.width)//2,108-bottle.height))
    preset['thumb']=embed(thumb,192)
out={'rooms':rooms,'backdrops':backdrops,'atlas':embed(load(data['atlas']),480),
    'bottlePresets':presets,'guests':guests,
    'guestAnchors':[{'x':.29,'y':.885,'height':.36},{'x':.30,'y':.785,'height':.40},{'x':.34,'y':.875,'height':.36}],
    'bartender':embed(bartender,240),'tipJar':embed(load('/assets/ui/tip-jar/stage-2.webp').crop(load('/assets/ui/tip-jar/stage-2.webp').getchannel('A').getbbox()),80),
    'atlasColumns':data['atlasColumns'],'atlasRows':data['atlasRows'],'preset':data['preset']}
(root/'.tmp/modular-all/bar-customizer-design-assets.json').write_text(json.dumps(out),encoding='utf-8')
print(f'{len(rooms)} rooms and furniture sets, {len(backdrops)} panoramas, {len(json.dumps(out))} bytes')
