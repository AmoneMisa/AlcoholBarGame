"""Pack and promote explicitly reviewed parts of the built-in generation run."""
import argparse
import json
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
STATE = ROOT / '.tmp/modular-all'
NODE = str(Path.home() / '.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node.exe')

def write_json(path, value):
    path.write_text(json.dumps(value, indent=2) + '\n', encoding='utf-8')

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--scenes', nargs='+', required=True)
    parser.add_argument('--part', required=True)
    parser.add_argument('--approve', action='store_true')
    parser.add_argument('--refresh', action='store_true')
    args = parser.parse_args()
    batch_id = f'2026-10-07-all-{args.part}'
    batch_path = ROOT/'scripts'/f'modular-generation-batch-{batch_id}.json'
    if not args.approve:
        items=[]
        for scene in args.scenes:
            for role in ['architecture','shelf','counter','seat']:
                result=json.loads((STATE/'results'/f'{scene}-{role}.json').read_text())
                items.append(result)
            subprocess.run([NODE,'scripts/modular-scene-plan.mjs',f'scripts/modular-scenes/{scene}.json'],cwd=ROOT,check=True,stdout=subprocess.DEVNULL)
        batch={'id':batch_id,'date':'2026-10-07','tool':'built-in image_gen','items':items}
        write_json(batch_path,batch)
        master_path=ROOT/'scripts/modular-generation-batch-2026-10-07-all.json'
        master=json.loads(master_path.read_text()) if master_path.exists() else {'date':'2026-10-07','tool':'built-in image_gen','parts':[]}
        master['parts']=[p for p in master['parts'] if p['id']!=batch_id]+[{'id':batch_id,'batch':batch_path.name,'scenes':args.scenes,'state':'packed-needs-review'}]
        write_json(master_path,master)
        subprocess.run([sys.executable,'scripts/install-generated-modular-assets.py',str(batch_path),*(['--refresh'] if args.refresh else [])],cwd=ROOT,check=True)
        return
    for scene in args.scenes:
        manifest_path=ROOT/'scripts/modular-scenes'/f'{scene}.json'
        manifest=json.loads(manifest_path.read_text())
        manifest['status']='production'
        manifest['review'].update(generationState='generated-and-composite-reviewed',architectureInpaint='generated-and-reviewed',alphaEdges='generated-alpha-and-composite-reviewed',seatAsset='single-reusable-generated-and-reviewed')
        manifest['generatedAssetBatch']=batch_path.name
        write_json(manifest_path,manifest)
        subprocess.run([NODE,'scripts/modular-scene-plan.mjs',str(manifest_path)],cwd=ROOT,check=True,stdout=subprocess.DEVNULL)
    subprocess.run([sys.executable,'scripts/build-composite-ready.py','--scenes',*args.scenes],cwd=ROOT,check=True)
    subprocess.run([NODE,'scripts/build-generated-modular-scenes.mjs'],cwd=ROOT,check=True)
    subprocess.run([NODE,'scripts/check-modular-readiness.mjs','--write'],cwd=ROOT,check=True,stdout=subprocess.DEVNULL)
    for script in ['build-architecture-queue.mjs','build-furniture-cleanup-queue.mjs']:
        subprocess.run([NODE,f'scripts/{script}'],cwd=ROOT,check=True,stdout=subprocess.DEVNULL)
    master_path=ROOT/'scripts/modular-generation-batch-2026-10-07-all.json'
    master=json.loads(master_path.read_text())
    for part in master['parts']:
        if part['id']==batch_id:part['state']='reviewed-production'
    write_json(master_path,master)
    print('Promoted '+', '.join(args.scenes))

if __name__=='__main__':
    main()
