"""Register reviewed native window/ balcony alpha and standalone landscapes."""
import argparse
import json
import re
import shutil
from pathlib import Path
from PIL import Image

ROOT=Path(__file__).resolve().parents[1]
STATE=ROOT/'.tmp/modular-all'

# Outer bounds limit native apertures to exterior regions; alpha retains all
# curved frames, fine mullions, lamps and balcony balusters inside these bounds.
BOUNDS={
 'assassins-creed':[(.70,0,1,.78)],
 'baldurs-gate-3':[(.73,0,1,.78)],
 'beach':[(0,0,.58,.78)],
 'darksiders-3':[(0,0,.26,.78)],
 'devil-may-cry':[(0,0,.20,.78)],
 'diablo-4':[(0,0,.29,.78)],
 'desert':[(.30,.15,.72,.66)],
 'fairy':[(0,0,.18,.53),(.39,0,.64,.53),(.86,0,1,.53)],
 'allods':[(0,0,.38,.65),(.61,0,1,.65)],
 'among-us':[(0,0,.15,.53),(.31,0,.69,.28),(.87,0,1,.53)],
 'gta-sa':[(0,0,1,.62)],
 'harry-potter':[(0,0,.10,.72),(.80,0,1,.72)],
 'max-payne':[(.76,0,1,.67)],
 'minecraft':[(0,0,.18,.65),(.86,0,1,.65)],
 'neighbours-from-hell':[(0,0,.19,.66)],
 'repo':[(0,0,.23,.76),(.84,0,1,.76)],
 'riad':[(0,0,.20,.76),(.80,0,1,.76)],
 'warcraft-3':[(.79,0,1,.77)],
 'witcher-3':[(.78,0,1,.76)],
 'velvet':[(.225,.08,.40,.61),(.635,.08,.83,.61)],
 'library':[(0,0,.13,.59)],
 'izakaya':[(0,.2,.17,.76)],
 'loft':[(0,0,.40,.70)],
 'garden':[(0,0,.29,.76)],
 'skyline':[(0,0,.72,.72)],
}

def write(path,value):
 path.write_text(json.dumps(value,indent=2)+'\n',encoding='utf-8')

def stage_openings():
 items=[]
 for path in sorted(STATE.glob('*-opening.json')):
  opening=json.loads(path.read_text(encoding='utf-8-sig'))
  scene=opening['scene']; source=Path(opening['source'])
  with Image.open(source) as image:
   if image.getchannel('A').getextrema()[0]!=0:
    raise RuntimeError(f'{scene}: outdoor aperture is not transparent')
  manifest_path=ROOT/f'scripts/modular-scenes/{scene}.json'
  manifest=json.loads(manifest_path.read_text())
  bounds=[{'x':a,'y':b,'width':c-a,'height':d-b} for a,b,c,d in BOUNDS.get(scene,[(0,0,1,.78)])]
  manifest.update(generatedArchitectureAlpha=True,generatedExteriorBoundsNormalized=bounds,windowCutoutsNormalized=[dict(rect,type='rect') for rect in bounds])
  manifest['review']['windowCutouts']='native-alpha-exterior-review-pending'
  write(manifest_path,manifest)
  result_path=STATE/'results'/f'{scene}-architecture.json'
  if result_path.exists():
   result=json.loads(result_path.read_text(encoding='utf-8-sig'))
   if not result.get('opaqueArchitectureSource'):
    result['opaqueArchitectureSource']=opening['reference']
    result['corrections']=[*result.get('corrections',[]),{'source':result['source'],'prompt':opening['prompt']}]
   result.update(source=opening['source'],transparent=True)
   write(result_path,result)
  else:
   items.append({'scene':scene,'role':'architecture','source':opening['source'],'opaqueArchitectureSource':opening['reference'],'transparent':True,'prompt':opening['prompt']})
 write(ROOT/'scripts/modular-generation-batch-2026-10-07-window-apertures.json',{'id':'2026-10-07-window-apertures','date':'2026-10-07','tool':'built-in image_gen','items':items})
 print('Registered native apertures:',len(list(STATE.glob('*-opening.json'))))

def install_landscapes():
 items=[]; destination=ROOT/'public/assets/bar/exteriors'; destination.mkdir(parents=True,exist_ok=True)
 for path in sorted(STATE.glob('exterior-*.json')):
  if path.name=='exterior-opening-targets.json':continue
  item=json.loads(path.read_text()); scene=item['id']; archive=ROOT/f'assets-src/bar-exteriors/{scene}-2026-10-07.png';archive.parent.mkdir(parents=True,exist_ok=True)
  if not archive.exists():shutil.copyfile(item['source'],archive)
  with Image.open(archive) as image:
   image.convert('RGB').save(destination/f'{scene}.webp','WEBP',quality=94,method=6)
  items.append(dict(item,archive=str(archive.relative_to(ROOT)),output=f'public/assets/bar/exteriors/{scene}.webp'))
 catalog=ROOT/'src/data/cosmetics/windowBackdrops.ts';text=catalog.read_text()
 for item in items:
  pattern=r"(\{id:'"+re.escape(item['id'])+r"',label:'[^']*',asset:)'[^']*'(,sourceRect:)\{[^}]*\}"
  text,count=re.subn(pattern,lambda match:match[1]+"'/assets/bar/exteriors/"+item['id']+".webp'"+match[2]+"{x:0,y:0,width:1,height:1}",text)
  if count!=1:raise RuntimeError('Catalog mapping missing: '+item['id'])
 catalog.write_text(text,encoding='utf-8')
 write(ROOT/'scripts/modular-exterior-generation-batch-2026-10-07.json',{'date':'2026-10-07','tool':'built-in image_gen','items':items})
 print('Installed standalone landscapes:',len(items))

if __name__=='__main__':
 parser=argparse.ArgumentParser();parser.add_argument('--landscapes',action='store_true');args=parser.parse_args()
 if args.landscapes:install_landscapes()
 else:stage_openings()
