"""Prepare resumable built-in image_gen jobs; no external image API is used."""
import argparse
import json
from pathlib import Path
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
STATE = ROOT / '.tmp/modular-all'
PY_BATCH = '2026-10-07-all'
CONFIG = {
    'alan-wake': {'shelf': [.17,.13,.68,.56], 'shelfContent': [.025,.025,.95,.975], 'counterTop': .69, 'seatY': .845,
                  'description': 'rustic forest lodge, timber arches, stone fireplace, antler chandelier, pine forest/lake windows, amber wood and brass'},
    'allods': {'shelf': [.20,.20,.62,.50], 'shelfContent': [.01,.10,.98,.90], 'counterTop': .69, 'seatY': .815,
               'description': 'ornate fantasy airship tavern, copper/brass curved architecture, red embroidered banners, purple astral sky/floating castles, central fixed astrolabe window'},
    'among-us': {'shelf': [.18,.20,.64,.46], 'shelfContent': [.016,.088,.98,.91], 'counterTop': .66, 'seatY': .82,
                 'description': 'blue-gray spaceship architecture, cyan lighting, rounded space windows, Earth and stars, metal panels and fixed control panels'},
    'assassins-creed': {'shelf': [.20,.13,.55,.55], 'shelfContent': [.08,.14,.91,.86], 'counterTop': .65, 'seatY': .795,
                        'description': 'Venetian Renaissance loggia, marble arches and columns, red gold curtains and banners, fixed wall map, canal city sunset view, dark carved wood with gold crest'},
}

def write_json(path, value):
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(value, indent=2) + '\n', encoding='utf-8')

def prepare(scene):
    manifest_path = ROOT / 'scripts/modular-scenes' / f'{scene}.json'
    manifest = json.loads(manifest_path.read_text(encoding='utf-8'))
    if (ROOT / 'public/assets/bar/modular' / scene / 'architecture.webp').exists():
        return
    cfg = CONFIG.get(scene, {})
    source = ROOT / 'public/assets/bar/backgrounds' / f'interior-{scene}.webp'
    with Image.open(source) as raw:
        original = raw.convert('RGBA')
    w, h = original.size
    author = manifest.get('canvas', {'width': w, 'height': h})
    def norm(spec):
        if 'cropNormalized' in spec:
            return dict(spec['cropNormalized'])
        c = spec['crop']
        return {k: c[k] / author['width' if k in ('x','width') else 'height'] for k in ('x','y','width','height')}
    shelf = norm(manifest['modules']['shelf-reference'])
    if 'shelf' in cfg:
        shelf = dict(zip(('x','y','width','height'), cfg['shelf']))
    elif w / h > 1.6:
        shelf['height'] = max(shelf['height'], .67 - shelf['y'])
    counter = norm(manifest['modules']['counter-reference'])
    counter['height'] = 1 - counter['y']
    # Geometry changes are explicit, but original interaction slots stay available.
    for role, rect in [('shelf', shelf), ('counter', counter)]:
        module = manifest['modules'][f'{role}-reference']
        module.pop('crop', None)
        module['cropNormalized'] = rect
    seat = dict(manifest['manualSeatCutNormalized']['cropNormalized'])
    if w / h > 1.6:
        seat.update(x=.41, y=cfg.get('seatY', .80), width=.18, height=.34)
    else:
        seat['height'] = max(seat['height'], .23)
    manifest['manualSeatCutNormalized']['cropNormalized'] = seat
    manifest['generatedAssetBatch'] = 'modular-generation-batch-2026-10-07-all.json'
    manifest['review']['generationState'] = 'prepared-not-reviewed'
    write_json(manifest_path, manifest)
    out = ROOT / 'public/assets/bar/modular' / scene
    references = {}
    for role, rect in [('shelf', shelf), ('counter', counter), ('seat', seat)]:
        x,y,cw,ch = (rect[k] for k in ('x','y','width','height'))
        box = (round(x*w),round(y*h),min(w,round((x+cw)*w)),min(h,round((y+ch)*h)))
        target = out / f'{role}-generation-reference-all.webp'
        original.crop(box).save(target, 'WEBP', lossless=True)
        references[role] = str(target)
    description = cfg.get('description', f'the exact original {scene} themed room and its unique original materials, ornaments and lighting')
    common = f'Use case: precise-object-edit. Modular game asset for {scene}. Match the original detailed semi-realistic hand-painted finish. Original setting: {description}. Preserve camera/perspective, original furniture designs and unique colors/materials. No people or invented text/logos. '
    prompts = {
        'architecture': common + f'EDIT TARGET exact full room, aspect {w}:{h}. Produce ONE complete empty architecture plate. Preserve structural ceiling/walls/posts/arches, fixed lights and chandeliers, window frames and curtains, original exterior view, fixed architectural ornaments and murals. Remove ALL bar counters including rear storage/worktops, every liquor shelf frame/board/backing and rack, all stools/chairs/sofas/tables, all bottles/glasses/cups/ceramics/tools/machines resting on furniture, tabletop lights, vases/plants/vines/flowers/fruit/books/globes/barrels and other loose furniture/decor. Keep permanently built-in book walls when present, embedded crystals and architectural control panels. Reconstruct continuous matching wall panels/stone/brick in removed shelving regions and uninterrupted complete floor behind all counters/seats to bottom edge. Same framing, horizon and light. No new furniture or reframing, no transparent holes.',
        'shelf': common + 'EDIT TARGET first exact rear furniture crop, second full original room is strict coordinate/material context. Isolate the complete original EMPTY backbar furniture: all rear liquor shelf racks/cabinets within this crop, original boards, vertical posts, cabinet backing if present, brass/metal trim, fixed shelf lights and connected lower storage cabinets/worktop. Restore full frames and bases. Keep original number of levels, separate cabinet positions and DIFFERENT board heights per cabinet. Preserve original gaps between units: stone pillars/wall in those gaps are NOT furniture and must be transparent. Remove ALL bottles/glasses/ceramics/tools/machines/tabletop lamps/plants/vines/flowers/books/fruit and every object resting on boards. Remove ceiling/wall lights, structural pillars/walls/window/curtains and main foreground counter. If racks have open backs, keep ALL spaces between boards transparent; do not invent backing. Preserve crop aspect and furniture positions, do not center/reframe/rearrange columns. True transparent surroundings, clean empty compartments, complete furniture only.',
        'counter': common + 'EDIT TARGET first expanded foreground counter crop, second exact original room for shape/material. Isolate ONLY the complete original MAIN FOREGROUND counter: uninterrupted empty full worktop, whole front facade with original trim/crest/panel pattern, complete left/right edges and bottom plinth. Preserve original horizontal footprint and perspective. Remove all stools/chairs and every seat/leg/ring pixel, ALL tabletop objects, bottles/tools/plants/fruit/glasses/lamps, rear counter/cabinets, room/walls/windows/floor. Reconstruct continuous original front material behind former seats, NO floor/stone patches or leg silhouettes baked into facade. Restore COMPLETE bottom base naturally INSIDE canvas even when original base was occluded/clipped. True transparency above/around outer counter silhouette and original empty left/right area if counter does not fill width. Whole counter only, no background/floor shadow/new objects.',
        'seat': common + 'First image is a source seat crop, possibly clipped/occluded; second full room determines the correct original seat design. Create exactly ONE complete reusable original bar stool/chair, matching the central source seat: same upholstery or wood/rattan seat, original backrest if present, frame/pedestal/legs, footrest/braces and base/feet. Reconstruct all occluded or clipped lower parts to a naturally complete whole seat. EVERY foot/base/ring/backrest fully INSIDE portrait canvas with narrow transparent margins. Restore genuine transparent holes between supports and through footrest; remove ALL counter/floor/room pixels including gaps, no floor shadow or background rectangle. Exactly one upright centered complete object, never multiple seats or a cropped seat. Same source perspective and lighting.'
    }
    for role in prompts:
        refs = [str(source)] if role == 'architecture' else [references[role], str(source)]
        job = {'scene':scene,'role':role,'prompt':prompts[role],'references':refs,'transparent':role!='architecture'}
        if role == 'shelf':
            content = cfg.get('shelfContent', [.035,.06,.93,.93])
            job['contentRectNormalized'] = dict(zip(('x','y','width','height'), content))
        elif role == 'counter':
            absolute_top = cfg.get('counterTop', max(counter['y']+.035, .66) if w/h>1.6 else counter['y']+.06)
            top = min(.40,max(.035,(absolute_top-counter['y'])/counter['height']))
            bottom = cfg.get('counterBottom', 1 if w/h>1.6 else .88)
            job['contentRectNormalized'] = {'x':0,'y':top,'width':1,'height':max(.1,(bottom-counter['y'])/counter['height']-top)}
        write_json(STATE / 'jobs' / f'{scene}-{role}.json', job)

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--scenes', nargs='+')
    parser.add_argument('--dump', action='store_true')
    parser.add_argument('--roles', nargs='+', default=['architecture','shelf','counter','seat'])
    args = parser.parse_args()
    if args.dump:
        print(json.dumps([json.loads((STATE/'jobs'/f'{scene}-{role}.json').read_text()) for scene in args.scenes for role in args.roles]))
        return
    queue = json.loads((ROOT/'docs/modular-review/architecture-queue.json').read_text())
    scenes = args.scenes or [item['id'] for item in queue['scenes']]
    for scene in scenes:
        prepare(scene)
    write_json(STATE/'queue.json', {'batch':PY_BATCH,'scenes':scenes})
    print(f'Prepared {len(scenes)} scenes for built-in image_gen')

if __name__ == '__main__':
    main()
