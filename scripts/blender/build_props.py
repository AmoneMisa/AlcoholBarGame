"""Builds the 3D bar props (glasses, liquid, ice, garnishes, shaker, orange, salt shaker) and exports public/assets/props3d/bar-props.glb.

Every glass type from src/data/props/glasses.json becomes two meshes: glass_<type> (the shell) and liquid_<type> (the inner volume the game
clips to the fill level). Materials are named by role so the game can tint them (liquid colour, glass transparency).

Setup:  pip install bpy==4.2.0
Run:    python scripts/blender/build_props.py [--render prefix]
"""
import json, math, os, shutil, subprocess, sys
from pathlib import Path
import bpy, bmesh
from mathutils import Vector, Matrix

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / 'public/assets/props3d/bar-props.glb'
GLASSES = json.loads((ROOT / 'src/data/props/glasses.json').read_text())
render_prefix = sys.argv[sys.argv.index('--render') + 1] if '--render' in sys.argv else None

bpy.ops.wm.read_factory_settings(use_empty=True)
scene = bpy.context.scene
MATS = {}
def material(name, color, rough=.6, metal=0.0, alpha=1.0):
    m = bpy.data.materials.new(name); m.use_nodes = True
    b = m.node_tree.nodes['Principled BSDF']
    b.inputs['Base Color'].default_value = (*color, 1); b.inputs['Roughness'].default_value = rough; b.inputs['Metallic'].default_value = metal
    m.diffuse_color = (*color, 1)
    MATS[name] = m
for n, c, r, mt in [('glass', (.85, .95, 1), .05, 0), ('liquid', (.9, .7, .3), .1, 0), ('ice', (.85, .95, 1), .15, 0), ('metal', (.75, .77, .8), .25, 1),
                    ('rind', (.2, .55, .15), .5, 0), ('flesh', (.85, .93, .5), .4, 0), ('orange_rind', (.8, .27, .03), .5, 0), ('orange_flesh', (.9, .5, .1), .4, 0),
                    ('pineapple', (.98, .82, .25), .5, 0), ('leaf', (.13, .5, .18), .6, 0), ('cherry', (.6, .02, .06), .25, 0), ('stem', (.3, .2, .1), .7, 0),
                    ('salt', (.96, .96, .94), .5, 0), ('cap', (.7, .72, .76), .3, 1)]:
    material(n, c, r, mt)

def obj_from_bm(name, bm, mats, smooth=True):
    mesh = bpy.data.meshes.new(name); bm.to_mesh(mesh); bm.free()
    o = bpy.data.objects.new(name, mesh); scene.collection.objects.link(o)
    for m in mats: o.data.materials.append(MATS[m])
    for p in o.data.polygons: p.use_smooth = smooth
    return o

def revolve(name, points, mats, closed_axis=False, segments=48):
    """Spin a [(r, y)] profile around the vertical (Z in Blender) axis."""
    bm = bmesh.new()
    verts = [bm.verts.new((r, 0, y)) for r, y in points]
    for a, b in zip(verts, verts[1:]): bm.edges.new((a, b))
    bmesh.ops.spin(bm, geom=bm.verts[:] + bm.edges[:], angle=math.tau, steps=segments, axis=(0, 0, 1), cent=(0, 0, 0))
    bmesh.ops.remove_doubles(bm, verts=bm.verts, dist=1e-5)
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    return obj_from_bm(name, bm, mats)

def add_ellipsoid(bm, c, r, seg=14, ring=8, power=None):
    geo = bmesh.ops.create_uvsphere(bm, u_segments=seg, v_segments=ring, radius=1.0)
    for v in geo['verts']:
        p = Vector(v.co)
        if power: p = Vector((math.copysign(abs(p.x) ** power, p.x), math.copysign(abs(p.y) ** power, p.y), math.copysign(abs(p.z) ** power, p.z)))
        v.co = Vector((p.x * r[0] + c[0], p.y * r[1] + c[1], p.z * r[2] + c[2]))
    return geo['verts']

def add_cyl(bm, c, radius, height, seg=24, taper=1.0, matrix=None):
    geo = bmesh.ops.create_cone(bm, cap_ends=True, segments=seg, radius1=radius, radius2=radius * taper, depth=height)
    m = Matrix.Translation(c) @ (matrix or Matrix.Identity(4))
    bmesh.ops.transform(bm, matrix=m, verts=geo['verts'])
    return geo['verts']

def tube(bm, a, b, radius, seg=8):
    a, b = Vector(a), Vector(b)
    geo = bmesh.ops.create_cone(bm, cap_ends=True, segments=seg, radius1=radius, radius2=radius * .85, depth=(b - a).length)
    bmesh.ops.transform(bm, matrix=Matrix.Translation((a + b) / 2) @ (b - a).to_track_quat('Z', 'Y').to_matrix().to_4x4(), verts=geo['verts'])

# ---- glasses and their liquid
for kind, g in GLASSES.items():
    if kind.startswith('_'): continue
    outer = [tuple(p) for p in g['outer']]
    inner = [tuple(p) for p in g['inner']]
    shell = outer + [(inner[-1][0], inner[-1][1])] + inner[::-1] + [(0, g['innerBottom'])]
    revolve(f'glass_{kind}', shell, ['glass'])
    liquid = [(0, g['innerBottom'] + .002)] + [(r * .985, y) for r, y in inner]
    revolve(f'liquid_{kind}', liquid, ['liquid'])

# ---- ice cube (soft rounded cube)
bm = bmesh.new(); add_ellipsoid(bm, (0, 0, 0), (.09, .09, .09), 16, 10, power=.55); obj_from_bm('ice', bm, ['ice'])

# ---- garnishes (origin at the point that touches the glass rim)
def wheel(name, rind, flesh, radius=.19, half=False):
    bm = bmesh.new()
    add_cyl(bm, (0, 0, 0), radius, .025, 28)
    ids = len(bm.faces)
    for f in bm.faces: f.material_index = 0
    inner = add_cyl(bm, (0, 0, .002), radius * .86, .026, 28)
    for f in bm.faces:
        if all(v in inner for v in f.verts): f.material_index = 1
    for k in range(8):
        a = k * math.tau / 8
        tube_bm = (radius * .8 * math.cos(a), 0, radius * .8 * math.sin(a))
    o = obj_from_bm(name, bm, [rind, flesh])
    o.rotation_euler = (math.radians(90), 0, 0)
    return o
lime = wheel('garnish_lime', 'rind', 'flesh')
orange = wheel('garnish_orange', 'orange_rind', 'orange_flesh')
bm = bmesh.new()
tube(bm, (0, 0, 0), (.06, 0, .22), .022, 8)
for k in range(7):
    a = k * math.tau / 7; add_ellipsoid(bm, (math.cos(a) * .05 + .03, math.sin(a) * .05, .2 + k * .012), (.075, .012, .045), 10, 6)
obj_from_bm('garnish_mint', bm, ['leaf'])
bm = bmesh.new(); geo = add_cyl(bm, (0, 0, .09), .2, .18, 3)
for f in bm.faces: f.material_index = 0
bmesh.ops.rotate(bm, cent=(0, 0, 0), matrix=Matrix.Rotation(math.radians(90), 3, 'X'), verts=bm.verts)
for k in range(5): add_ellipsoid(bm, ((k - 2) * .05, 0, .28 + abs(k - 2) * -.02), (.014, .008, .11), 6, 4)
obj_from_bm('garnish_pineapple', bm, ['pineapple'])
bm = bmesh.new(); add_ellipsoid(bm, (0, 0, .06), (.06, .06, .06), 14, 10); obj_from_bm('garnish_cherry', bm, ['cherry'])

# ---- whole orange and salt shaker (inventory thumbnails)
bm = bmesh.new(); add_ellipsoid(bm, (0, 0, .5), (.5, .5, .48), 24, 16); obj_from_bm('item_orange', bm, ['orange_rind'])
bm = bmesh.new(); tube(bm, (0, 0, .95), (.02, 0, 1.2), .03, 6); add_ellipsoid(bm, (.05, 0, 1.15), (.12, .05, .03), 10, 6); obj_from_bm('item_orange_leaf', bm, ['leaf'])
revolve('item_salt', [(0, 0), (.32, 0), (.34, .05), (.3, .75), (0, .75)], ['glass'])
revolve('item_salt_fill', [(0, .02), (.29, .02), (.28, .6), (0, .6)], ['salt'])
revolve('item_salt_cap', [(.3, .75), (.32, .8), (.3, .95), (.2, 1.05), (0, 1.07)], ['cap'])

# ---- cobbler shaker: body, strainer cap and lid (separate meshes so the game can animate the lid)
revolve('shaker_body', [(0, 0), (.24, 0), (.27, .05), (.36, 1.0), (.33, 1.05), (.3, 1.06)], ['metal'])
revolve('shaker_cap', [(.3, 1.0), (.36, 1.0), (.3, 1.12), (.22, 1.32), (.19, 1.42)], ['metal'])
revolve('shaker_lid', [(.19, 1.42), (.2, 1.48), (.15, 1.52), (0, 1.53)], ['cap'])

# ---- export (Blender is Z-up; glTF Y-up conversion happens in the exporter)
OUT.parent.mkdir(parents=True, exist_ok=True)
bpy.ops.object.select_all(action='SELECT')
bpy.ops.export_scene.gltf(filepath=str(OUT), export_format='GLB', export_apply=False, export_yup=True, export_image_format='NONE', export_cameras=False, export_lights=False)
print('exported', OUT, OUT.stat().st_size // 1024, 'KB')
tool = shutil.which('gltf-transform')
if tool:
    packed = OUT.with_suffix('.packed.glb')
    subprocess.run([tool, 'meshopt', str(OUT), str(packed), '--level', 'high'], check=True, capture_output=True)
    packed.replace(OUT); print('compressed', OUT.stat().st_size // 1024, 'KB')
sys.stdout.flush(); os._exit(0)
