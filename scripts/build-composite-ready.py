#!/usr/bin/env python3
import json
import shutil
from pathlib import Path
from PIL import Image

ROOT=Path(__file__).resolve().parents[1]
MOD=ROOT/'public/assets/bar/modular'
MANIFESTS=ROOT/'scripts/modular-scenes'
SUMMARY=ROOT/'docs/modular-review/summary.json'

def source_path(manifest_path,source):
    value=source
    if value.startswith('../../../public/'):
        value='../../public/'+value[len('../../../public/'):]
    return (manifest_path.parent/value).resolve()

def copy_required(src,dst,label):
    if not src.exists():
        raise RuntimeError(f'missing {label}: {src.relative_to(ROOT)}')
    dst.parent.mkdir(parents=True,exist_ok=True)
    shutil.copyfile(src,dst)

def exterior_cut(manifest_path,manifest,base,out):
    mask_path=base/'window-mask.png'
    if not mask_path.exists():
        return None
    src_path=source_path(manifest_path,manifest['source'])
    with Image.open(src_path) as source_file:
        source=source_file.convert('RGBA')
    with Image.open(mask_path) as mask_file:
        mask=mask_file.convert('L')
    if mask.size!=source.size:
        mask=mask.resize(source.size,Image.Resampling.LANCZOS)
    source.putalpha(mask)
    target=out/'exterior.webp'
    source.save(target,'WEBP',lossless=True,method=6)
    return str(target.relative_to(ROOT))

def build(item):
    scene=item['scene']
    base=MOD/scene
    out=base/'composite-ready'
    out.mkdir(parents=True,exist_ok=True)
    manifest_path=MANIFESTS/f'{scene}.json'
    manifest=json.loads(manifest_path.read_text())
    required=manifest.get('requiredRoles',['counter','shelf','seating'])

    final_arch=base/'architecture.webp'
    prep_arch=base/'architecture-prep.webp'
    arch_source=final_arch if final_arch.exists() else prep_arch
    copy_required(arch_source,out/'architecture.webp',f'{scene} architecture')

    copied=['architecture']
    if 'counter' in required:
        copy_required(base/'review-ready'/'counter.webp',out/'counter.webp',f'{scene} counter')
        copied.append('counter')
    if 'shelf' in required:
        copy_required(base/'review-ready'/'shelf.webp',out/'shelf.webp',f'{scene} shelf')
        copied.append('shelf')
    if 'seating' in required:
        copy_required(base/'manual'/'seat.webp',out/'seat.webp',f'{scene} seat')
        copied.append('seat')

    exterior=exterior_cut(manifest_path,manifest,base,out)
    if exterior:
        copied.append('exterior')

    return {
        'scene':scene,
        'directory':str(out.relative_to(ROOT)),
        'architectureKind':'final' if final_arch.exists() else 'prep',
        'requiredRoles':required,
        'assets':copied,
        'exterior':exterior,
        'complete':True
    }

def main():
    summary=json.loads(SUMMARY.read_text())
    rows=[build(item) for item in summary]
    report={
        'count':len(rows),
        'complete':sum(item['complete'] for item in rows),
        'finalArchitecture':sum(item['architectureKind']=='final' for item in rows),
        'prepArchitecture':sum(item['architectureKind']=='prep' for item in rows),
        'scenes':rows
    }
    out=ROOT/'docs/modular-review/composite-ready.json'
    out.write_text(json.dumps(report,indent=2)+'\n')
    print(f"composite-ready scenes: {report['complete']}/{report['count']}")
    print(f"architecture final={report['finalArchitecture']} prep={report['prepArchitecture']}")

if __name__=='__main__':
    main()
