#!/usr/bin/env python3
import json
from pathlib import Path
from PIL import Image, ImageChops, ImageFilter

ROOT=Path(__file__).resolve().parents[1]
MOD=ROOT/'public/assets/bar/modular'
SUMMARY=ROOT/'docs/modular-review/summary.json'
ROLES=('counter','shelf','seating')

def rect_pixels(plan, role):
    width=plan['canvas']['width']
    height=plan['canvas']['height']
    if role in ('counter','shelf'):
        module=plan.get('modules',{}).get(f'{role}-reference')
        if not module:
            raise RuntimeError(f"{plan['id']}: missing {role}-reference module")
        crop=module['crop']
        return crop['x'],crop['y'],crop['width'],crop['height']
    slot=plan.get('slots',{}).get('seating')
    if not slot:
        raise RuntimeError(f"{plan['id']}: missing seating slot")
    return (
        round(slot['x']*width),
        round(slot['y']*height),
        round(slot['width']*width),
        round(slot['height']*height),
    )

def paste_role_mask(canvas, mask_path, rect):
    x,y,w,h=rect
    role=Image.open(mask_path).convert('L')
    if role.size!=(w,h):
        role=role.resize((w,h),Image.Resampling.LANCZOS)
    canvas.paste(ImageChops.lighter(canvas.crop((x,y,x+w,y+h)),role),(x,y))

def build(scene_id):
    base=MOD/scene_id
    plan=json.loads((base/'scene-plan.json').read_text())
    canvas=Image.new('L',(plan['canvas']['width'],plan['canvas']['height']),0)

    used=[]
    for role in ROLES:
        mask=base/'review-ready'/f'{role}-mask.png'
        if not mask.exists():
            raise RuntimeError(f'{scene_id}: missing approved {role} mask')
        paste_role_mask(canvas,mask,rect_pixels(plan,role))
        used.append(role)

    # Give inpainting a little context beyond the exact alpha edge while keeping
    # the mask tied to approved object silhouettes, not broad rectangular slots.
    canvas=canvas.filter(ImageFilter.MaxFilter(13))
    canvas=canvas.filter(ImageFilter.GaussianBlur(3.0))
    out=base/'architecture-mask.png'
    canvas.save(out,'PNG',optimize=True)
    return {
        'scene':scene_id,
        'mask':str(out.relative_to(ROOT)),
        'roles':used,
        'canvas':plan['canvas'],
        'windowCutouts':plan.get('windowCutouts',[])
    }

def main():
    summary=json.loads(SUMMARY.read_text())
    blocked=[item['scene'] for item in summary if item.get('furnitureReady') and not item.get('architectureReady')]
    built=[build(scene_id) for scene_id in blocked]
    out=ROOT/'docs/modular-review/architecture-masks.json'
    out.write_text(json.dumps({'count':len(built),'scenes':built},indent=2)+'\n')
    print(f'architecture masks: {len(built)}')
    for item in built:
        print(f"- {item['scene']}: {item['mask']}")

if __name__=='__main__':
    main()
