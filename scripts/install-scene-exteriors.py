"""Pack visually approved ImageGen panoramas and update the shared catalog."""
import json
from pathlib import Path
from PIL import Image

root = Path(__file__).resolve().parents[1]
queue_path = root / 'scripts/modular-scene-exterior-generation.json'
queue = json.loads(queue_path.read_text(encoding='utf-8'))
catalog = []
for item in queue['items']:
    if item.get('reviewed') is not True:
        continue
    source = item.get('generatedSource')
    if not source:
        raise ValueError(f"{item['id']}: approval requires a generated source")
    source_path = Path(source)
    if not source_path.is_absolute(): source_path = root / source_path
    image = Image.open(source_path).convert('RGBA')
    if image.width < 1024 or not 1.5 <= image.width / image.height <= 2:
        raise ValueError(f"{item['id']}: expected a full landscape panorama")
    if image.getchannel('A').getextrema() != (255, 255):
        raise ValueError(f"{item['id']}: masked room exteriors cannot be shared panoramas")
    output = root / item['output']
    output.parent.mkdir(parents=True, exist_ok=True)
    image.convert('RGB').save(output, quality=94, method=6)
    item['status'] = 'ready'
    catalog.append({'id':item['id'], 'label':item['label'], 'asset':'/'+item['output'].removeprefix('public/'), 'sourceRect':{'x':0,'y':0,'width':1,'height':1}})
(root / 'src/data/cosmetics/generatedSceneExteriors.ts').write_text('// Generated from visually approved standalone scene panoramas.\nexport const GENERATED_SCENE_EXTERIORS = '+json.dumps(catalog,ensure_ascii=False,indent=2)+' as const;\n', encoding='utf-8')
queue_path.write_text(json.dumps(queue,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
print(f'{len(catalog)} faithful original panoramas installed; {len(queue["items"])-len(catalog)} pending.')
