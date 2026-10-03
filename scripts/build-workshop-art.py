"""Install painted artwork into compatibility filenames; never regenerate emoji placeholders."""
from pathlib import Path
from shutil import copyfile
ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'public/assets/workshop'
count = 0
for painted in OUT.rglob('*-painted-v1.webp'):
    copyfile(painted, painted.with_name(painted.name.replace('-painted-v1', '')))
    count += 1
for stage in (OUT / 'achievements').glob('*-tier-1.webp'):
    copyfile(stage, stage.with_name(stage.name.replace('-tier-1', '')))
    count += 1
copyfile(OUT / 'resources/prestige.webp', OUT / 'achievements/prestiges.webp')
puzzle = ROOT / 'public/assets/ui/fragment-puzzle-painted-v1.webp'
for name in ('skin', 'style', 'circle'):
    copyfile(puzzle, OUT / 'shards' / (name + '.webp'))
copyfile(puzzle, ROOT / 'public/assets/ui/fragment-puzzle.webp')
wheel = ROOT / 'public/assets/ui/daily-wheel-painted-v1.webp'
if wheel.exists():
    copyfile(wheel, wheel.with_name('daily-wheel.webp'))
print('Installed', count, 'painted compatibility assets')
