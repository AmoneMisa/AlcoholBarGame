#!/usr/bin/env python3
import argparse, json
from pathlib import Path
from PIL import Image

ROOT=Path(__file__).resolve().parents[1]
MANIFESTS=ROOT/"scripts/modular-scenes"

def crop_pixels(spec,w,h):
    if "crop" in spec:
        c=spec["crop"]
        return tuple(int(c[k]) for k in ("x","y","width","height"))
    c=spec.get("cropNormalized")
    if c:
        return (round(c["x"]*w),round(c["y"]*h),round(c["width"]*w),round(c["height"]*h))
    return None

def process(path:Path,statuses:set[str]|None):
    data=json.loads(path.read_text())
    if statuses and data.get("status") not in statuses:
        return []
    source=(path.parent / data["source"]).resolve()
    out=(path.parent / data.get("outputDir",f"../../../public/assets/bar/modular/{data['id']}")).resolve()
    out.mkdir(parents=True,exist_ok=True)
    image=Image.open(source).convert("RGBA")
    w,h=image.size
    made=[]
    for module_id,spec in data.get("modules",{}).items():
        box=crop_pixels(spec,w,h)
        if not box: continue
        x,y,cw,ch=box
        x=max(0,min(w,x)); y=max(0,min(h,y))
        cw=max(1,min(w-x,cw)); ch=max(1,min(h-y,ch))
        crop=image.crop((x,y,x+cw,y+ch))
        target=out/f"{module_id}.webp"
        crop.save(target,"WEBP",quality=int(spec.get("quality",92)),method=6)
        made.append(target)
    return made

def main():
    ap=argparse.ArgumentParser()
    ap.add_argument("--status",action="append",default=[])
    ap.add_argument("--id",action="append",default=[])
    args=ap.parse_args()
    wanted=set(args.id)
    statuses=set(args.status) or None
    made=[]
    for path in sorted(MANIFESTS.glob("*.json")):
        if wanted and path.stem not in wanted: continue
        made.extend(process(path,statuses))
    for p in made: print(p.relative_to(ROOT))
    print(f"materialized {len(made)} reference assets")

if __name__=="__main__":
    main()
