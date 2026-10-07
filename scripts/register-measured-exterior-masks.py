"""Store explicit pane geometry for windows that need no new painted pixels."""
import json
import math
import importlib.util
from pathlib import Path
from PIL import Image, ImageChops

ROOT=Path(__file__).resolve().parents[1]
module_spec=importlib.util.spec_from_file_location('modular_packing',ROOT/'scripts/install-generated-modular-assets.py')
packing=importlib.util.module_from_spec(module_spec)
module_spec.loader.exec_module(packing)
normalized_mask=packing.normalized_mask

def rect(x0,y0,x1,y1):return {'type':'rect','x':x0,'y':y0,'width':x1-x0,'height':y1-y0}
def polygon(points):return {'type':'polygon','points':[{'x':x,'y':y} for x,y in points]}
def line(points,width):return dict(polygon(points),type='line',width=width)
def arch(x0,y0,x1,y1,rise):
 center=(x0+x1)/2; shoulder=y0+rise
 curve=[(center+(x1-x0)/2*math.cos(t),shoulder-rise*math.sin(t)) for t in [math.pi-i*math.pi/48 for i in range(49)]]
 return polygon(curve+[(x1,y1),(x0,y1)])

MASKS={
 'walking-dead-s3':{
  'include':[rect(.412,.247,.596,.488),rect(0,.095,.079,.483),rect(.916,.09,1,.48),rect(.312,.054,.333,.115),rect(.415,.050,.485,.083),rect(.514,.070,.574,.080),rect(.511,.108,.59,.120),rect(.516,.143,.56,.151),rect(.564,.138,.59,.149),rect(.421,.186,.59,.194)],
  'exclude':[rect(.412,a,.450,b) for a,b in [(.266,.30),(.313,.337),(.353,.371),(.398,.417),(.442,.463),(.478,.491)]]+[rect(0,a,.075,b) for a,b in [(.151,.169),(.187,.213),(.237,.30),(.333,.35),(.379,.44)]]+[rect(.916,a,1,b) for a,b in [(.124,.155),(.18,.208),(.239,.337),(.353,.363),(.377,.395),(.428,.438),(.457,.477)]],
 },
 'warcraft-3':{
  'include':[polygon([(.879,.53),(.879,.205),(.894,.124),(.925,.066),(.973,.021),(1,.005),(1,.531)])],
  'exclude':[rect(.925,.105,.940,.535),line([(.9,.098),(1,.095)],.008),line([(.893,.144),(1,.142)],.006),polygon([(.879,.14),(.918,.145),(.924,.221),(.922,.391),(.886,.394)]),line([(.882,.235),(.921,.351),(.899,.410),(.914,.458),(.893,.512)],.010)],
 },
 'watch-dogs':{
  'include':[rect(.347,0,.653,.448)],
  'exclude':[rect(.392,0,.401,.449),rect(.594,0,.605,.449),rect(.348,.291,.653,.303),rect(.348,.191,.653,.198)],
 },
 'winter':{
  'include':[arch(.348,.121,.651,.536,.167),arch(.124,.135,.257,.535,.073),arch(.744,.135,.879,.535,.073),rect(0,.134,.035,.538),rect(.964,.134,1,.538)],
  'exclude':[line([(x,.22),(x,.54)],.004) for x in [.183,.816]]+[line([(.12,y),(.26,y)],.004) for y in [.243,.351,.453]]+[line([(.742,y),(.88,y)],.004) for y in [.243,.351,.453]]+[rect(.469,.129,.473,.171),rect(.48,.13,.483,.158),rect(.5,.13,.503,.149),rect(.58,.17,.584,.196)],
 },
 'witcher-3':{
  'include':[polygon([(.817,.469),(.817,.351),(.849,.30),(.857,.137),(.873,.125),(.907,.119),(.91,.065),(.951,0),(1,0),(1,.565),(.952,.555),(.952,.517),(.886,.513),(.886,.54),(.876,.539),(.876,.510),(.817,.5)])],
  'exclude':[polygon([(.847,.16),(.858,.162),(.884,.208),(.877,.459),(.856,.511),(.842,.489)]),polygon([(.869,.012),(.894,.016),(.913,.08),(.910,.154),(.888,.177),(.862,.168),(.852,.062)]),line([(.82,.495),(1,.519)],.007),rect(.821,.495,.832,.537),rect(.873,.502,.886,.546),rect(.923,.511,.936,.552),rect(.982,.513,1,.564)],
 },
 'wolf-among-us':{
  'include':[polygon([(0,0),(.07,0),(.095,.023),(.123,.070),(.137,.128),(.143,.493),(0,.493)]),polygon([(.913,.454),(.913,.233),(.931,.197),(.955,.172),(.981,.157),(1,.15),(1,.453)])],
  'exclude':[rect(.042,0,.051,.496),rect(.090,.068,.098,.496),rect(.134,.136,.145,.496),line([(0,.046),(.138,.12)],.008),rect(0,.242,.139,.25),rect(0,.394,.145,.402),rect(.942,.207,.95,.456),rect(.909,.249,1,.259),rect(.913,.34,1,.348)],
 },
 'worms':{
  'include':[{'type':'ellipse','x':-.007,'y':.164,'width':.116,'height':.298},{'type':'ellipse','x':.895,'y':.163,'width':.118,'height':.299}],
  'exclude':[],
 },
 'garden':{
  'include':[arch(-.025,.02,.031,.481,.082),arch(.100,.049,.139,.475,.053),arch(.170,.071,.239,.475,.042)],
  'exclude':[line([(0,.135),(.033,.151)],.008),line([(0,.267),(.033,.270)],.006),line([(.1,.147),(.14,.167)],.007),line([(.17,.174),(.24,.191)],.007),rect(.166,.271,.245,.280),rect(.167,.401,.245,.408)],
 },
 'velvet':{
  'include':[arch(.274,.064,.394,.471,.082),arch(.665,.063,.783,.471,.082),arch(.064,.065,.111,.205,.036)],
  'exclude':[rect(.313,.164,.319,.471),rect(.348,.09,.354,.471),rect(.702,.09,.707,.471),rect(.742,.11,.747,.471),rect(.274,.164,.394,.173),rect(.665,.164,.783,.173),rect(.075,.119,.081,.208)],
 },
}

for scene,spec in MASKS.items():
 path=ROOT/f'scripts/modular-scenes/{scene}.json';manifest=json.loads(path.read_text())
 manifest['generatedWindowMaskNormalized']=spec
 manifest['windowCutoutsNormalized']=spec['include']
 if 'review' not in manifest:manifest['review']={}
 manifest['review']['windowCutouts']='measured-pane-review-pending'
 path.write_text(json.dumps(manifest,indent=2)+'\n')

# Velvet uses its original hand-built runtime contract rather than generated
# furniture modules. Split its complete existing architecture by the same matte.
base=ROOT/'public/assets/bar/modular/velvet'
source=ROOT/'assets-src/bar-modular/velvet/architecture-before-window-separation.webp'
source.parent.mkdir(parents=True,exist_ok=True)
if not source.exists():source.write_bytes((base/'architecture.webp').read_bytes())
image=Image.open(source).convert('RGBA');mask=normalized_mask(image.size,MASKS['velvet'])
exterior=image.copy();exterior.putalpha(mask);exterior.save(base/'exterior.webp','WEBP',lossless=True,method=6)
image.putalpha(ImageChops.invert(mask));image.save(base/'architecture.webp','WEBP',lossless=True,method=6)
mask.save(base/'window-mask.png')
print('Registered measured aperture geometry:',len(MASKS))
