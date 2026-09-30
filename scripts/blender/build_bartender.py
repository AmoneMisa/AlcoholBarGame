"""Builds the stylized, customizable bartender base model with Blender (bpy) and exports it as a GLB.

The GLB carries: one skinned skeleton, morph targets (body / face shape keys), swappable hair, facial-hair and
clothing meshes (named), materials named by role (skin, hair, ...) and a set of animation clips.

Setup:  pip install bpy==4.2.0        (Blender as a Python module; Python 3.11)
Run:    python scripts/blender/build_bartender.py [out.glb] [--render preview_prefix]
Output: public/assets/characters3d/bartender.glb
"""
import math, sys
from pathlib import Path
import bpy, bmesh
from mathutils import Vector, Matrix, Quaternion, Euler

ROOT = Path(__file__).resolve().parents[2]
args = [a for a in sys.argv[1:]]
render_prefix = None
if '--render' in args:
    i = args.index('--render'); render_prefix = args[i + 1]; del args[i:i + 2]
OUT = Path(args[0]) if args else ROOT / 'public/assets/characters3d/bartender.glb'

bpy.ops.wm.read_factory_settings(use_empty=True)
scene = bpy.context.scene
scene.render.fps = 24

# ---------------------------------------------------------------- materials (named by role; the game recolors them)
MATERIALS = {}
def material(name, color):
    mat = bpy.data.materials.new(name)
    mat.use_nodes = True
    bsdf = mat.node_tree.nodes['Principled BSDF']
    bsdf.inputs['Base Color'].default_value = (*color, 1)
    bsdf.inputs['Roughness'].default_value = .8
    mat.diffuse_color = (*color, 1)
    MATERIALS[name] = mat
    return mat
for name, color in dict(skin=(.72, .47, .35), hair=(.16, .09, .07), sclera=(.95, .95, .93), iris=(.3, .18, .12), pupil=(.02, .02, .03),
                        lip=(.6, .33, .3), mouth=(.12, .02, .03), shirt=(.93, .92, .88), vest=(.35, .06, .12), apron=(.06, .35, .27),
                        pants=(.08, .08, .1), shoes=(.05, .04, .04), trim=(.75, .58, .25)).items():
    material(name, color)

def new_object(name, bm_or_mesh, mat=None, collection=None):
    if isinstance(bm_or_mesh, bmesh.types.BMesh):
        mesh = bpy.data.meshes.new(name); bm_or_mesh.to_mesh(mesh); bm_or_mesh.free()
    else:
        mesh = bm_or_mesh
    obj = bpy.data.objects.new(name, mesh)
    scene.collection.objects.link(obj)
    if mat:
        obj.data.materials.append(MATERIALS[mat])
    for poly in obj.data.polygons:
        poly.use_smooth = True
    return obj

def sphere(name, center, radii, mat, segments=20, rings=12):
    bm = bmesh.new()
    bmesh.ops.create_uvsphere(bm, u_segments=segments, v_segments=rings, radius=1.0)
    for v in bm.verts:
        v.co = Vector((v.co.x * radii[0] + center[0], v.co.y * radii[1] + center[1], v.co.z * radii[2] + center[2]))
    return new_object(name, bm, mat)

# ---------------------------------------------------------------- body (skin modifier over a joint skeleton)
JOINTS = {
    'hips': ((0, 0, .98), (.17, .12)), 'spine': ((0, 0, 1.12), (.155, .115)), 'chest': ((0, 0, 1.29), (.19, .125)), 'neck': ((0, 0, 1.44), (.055, .055)),
    'shoulder': ((.17, 0, 1.38), (.07, .07)), 'elbow': ((.31, 0, 1.13), (.052, .052)), 'wrist': ((.37, 0, .93), (.04, .04)), 'hand': ((.395, 0, .84), (.055, .045)),
    'hip': ((.09, 0, .93), (.09, .09)), 'knee': ((.1, 0, .52), (.07, .07)), 'ankle': ((.1, 0, .09), (.055, .055)), 'toe': ((.1, -.11, .035), (.055, .045))
}
EDGES = [('hips', 'spine'), ('spine', 'chest'), ('chest', 'neck'), ('chest', 'shoulder'), ('shoulder', 'elbow'), ('elbow', 'wrist'), ('wrist', 'hand'),
         ('hips', 'hip'), ('hip', 'knee'), ('knee', 'ankle'), ('ankle', 'toe')]

def build_body():
    mesh = bpy.data.meshes.new('body_skin')
    verts, index, radii = [], {}, []
    def add(key, sign):
        pos, r = JOINTS[key]
        name = key if key in ('hips', 'spine', 'chest', 'neck') else f'{key}.{"L" if sign > 0 else "R"}'
        index[name] = len(verts); verts.append((pos[0] * sign, pos[1], pos[2])); radii.append(r)
        return name
    names = {}
    for key in JOINTS:
        if key in ('hips', 'spine', 'chest', 'neck'): names[key] = [add(key, 1)]
        else: names[key] = [add(key, 1), add(key, -1)]
    edges = []
    for a, b in EDGES:
        for i in range(max(len(names[a]), len(names[b]))):
            edges.append((index[names[a][min(i, len(names[a]) - 1)]], index[names[b][min(i, len(names[b]) - 1)]]))
    mesh.from_pydata(verts, edges, [])
    obj = bpy.data.objects.new('body', mesh)
    scene.collection.objects.link(obj)
    bpy.context.view_layer.objects.active = obj
    obj.modifiers.new('Skin', 'SKIN')
    bpy.ops.object.mode_set(mode='OBJECT')
    for i, r in enumerate(radii):
        mesh.skin_vertices[0].data[i].radius = r
    mesh.skin_vertices[0].data[index['hips']].use_root = True
    sub = obj.modifiers.new('Sub', 'SUBSURF'); sub.levels = 2; sub.render_levels = 2
    dg = bpy.context.evaluated_depsgraph_get()
    final = bpy.data.meshes.new_from_object(obj.evaluated_get(dg))
    bpy.data.objects.remove(obj)
    body = new_object('body', final, 'skin')
    return body

def build_head():
    bm = bmesh.new()
    bmesh.ops.create_uvsphere(bm, u_segments=36, v_segments=20, radius=1.0)
    for v in bm.verts:
        x, y, z = v.co
        # egg shape: wide skull, narrower jaw, a little chin
        t = (z + 1) / 2
        taper = .82 + .18 * math.sin(min(1, t * 1.25) * math.pi / 2)
        v.co = Vector((x * .108 * taper, y * .12 * (0.95 if z < -.4 else 1) , z * .135 + 1.605))
        if z < -.55: v.co.y -= (z + .55) * .02 * -1
    return new_object('head', bm, 'skin')

def ray_front(head, x, z, offset=0.0):
    origin = Vector((x, -1, z))
    hit, loc, normal, _ = head.ray_cast(origin, Vector((0, 1, 0)))
    return loc + normal * offset if hit else Vector((x, -.115, z))

def build_face(head):
    parts = []
    for side, sign in (('l', 1), ('r', -1)):
        c = ray_front(head, .043 * sign, 1.625, -.003)
        parts.append(sphere(f'eye_{side}', c, (.017, .011, .015), 'sclera', 16, 10))
        parts.append(sphere(f'iris_{side}', c + Vector((0, -.008, 0)), (.0105, .005, .0105), 'iris', 14, 8))
        parts.append(sphere(f'pupil_{side}', c + Vector((0, -.0115, 0)), (.005, .002, .005), 'pupil', 10, 6))
        b = ray_front(head, .046 * sign, 1.66, .002)
        brow = sphere(f'brow_{side}', b, (.03, .008, .008), 'hair', 12, 8)
        parts.append(brow)
        e = Vector((.107 * sign, .005, 1.6))
        parts.append(sphere(f'ear_{side}', e, (.011, .02, .03), 'skin', 12, 8))
    nose = ray_front(head, 0, 1.585, .006)
    parts.append(sphere('nose', nose, (.017, .019, .023), 'skin', 14, 10))
    lips = ray_front(head, 0, 1.543, .0)
    parts.append(sphere('mouth_inner', lips + Vector((0, .003, 0)), (.03, .006, .01), 'mouth', 14, 8))
    parts.append(sphere('lips', lips + Vector((0, -.003, 0)), (.031, .009, .011), 'lip', 16, 10))
    return parts

# ---------------------------------------------------------------- hair & facial hair
def hair_cap(name, top=.16, back=.0, front=-.005, height=1.6, spread=1.07, lift=.008, keep=.35, mat='hair', shift=(0, 0, 0)):
    """A shell hugging the skull above a hairline. keep = lowest z (relative to head centre, -1..1) that stays."""
    bm = bmesh.new()
    bmesh.ops.create_uvsphere(bm, u_segments=36, v_segments=20, radius=1.0)
    dead = [v for v in bm.verts if v.co.z < keep - 1 + .0 - 0 and False]
    for v in bm.verts:
        x, y, z = v.co
        t = (z + 1) / 2
        taper = .82 + .18 * math.sin(min(1, t * 1.25) * math.pi / 2)
        v.co = Vector((x * .108 * taper * spread, y * .12 * spread + back, z * .135 * (1 + lift * 10) + 1.605 + lift + shift[2]))
        v.co.x += shift[0]; v.co.y += shift[1]
    # curved hairline: high on the forehead, lower at the back of the neck
    dead = [v for v in bm.verts if (v.co.z - 1.605) / .135 < keep + .45 * max(0, -v.co.y / .12) - .25 * max(0, v.co.y / .12)]
    bmesh.ops.delete(bm, geom=dead, context='VERTS')
    return bm

def add_blob(bm, center, radii, segments=12, rings=8):
    geo = bmesh.ops.create_uvsphere(bm, u_segments=segments, v_segments=rings, radius=1.0)
    for v in geo['verts']:
        v.co = Vector((v.co.x * radii[0] + center[0], v.co.y * radii[1] + center[1], v.co.z * radii[2] + center[2]))

def add_tube(bm, a, b, radius, segments=8):
    a, b = Vector(a), Vector(b)
    direction = b - a
    geo = bmesh.ops.create_cone(bm, cap_ends=True, segments=segments, radius1=radius, radius2=radius * .8, depth=direction.length)
    rot = direction.to_track_quat('Z', 'Y').to_matrix().to_4x4()
    bmesh.ops.transform(bm, matrix=Matrix.Translation((a + b) / 2) @ rot, verts=geo['verts'])

def build_hair():
    styles = {}
    styles['buzz'] = hair_cap('buzz', keep=.05, lift=.001, spread=1.02)
    styles['short'] = hair_cap('short', keep=.0, lift=.006)
    styles['slick'] = hair_cap('slick', keep=-.05, lift=.01, back=.006, spread=1.05)
    bm = hair_cap('undercut', keep=.25, lift=.014, spread=1.03); add_blob(bm, (0, -.03, 1.72), (.075, .1, .04)); styles['undercut'] = bm
    bm = hair_cap('pompadour', keep=.05, lift=.01); add_blob(bm, (0, -.075, 1.73), (.08, .07, .055)); styles['pompadour'] = bm
    bm = hair_cap('side-quiff', keep=.05, lift=.01); add_blob(bm, (.03, -.07, 1.72), (.08, .07, .045)); styles['side-quiff'] = bm
    bm = hair_cap('mohawk', keep=.55, lift=.003, spread=1.01)
    for k in range(7): add_blob(bm, (0, .07 - k * .026, 1.75 - abs(k - 3) * .006 + .01), (.016, .02, .04 - abs(k - 3) * .004))
    styles['mohawk'] = bm
    bm = hair_cap('curls', keep=-.1, lift=.015, spread=1.06)
    for k in range(26):
        a = k * 2.4; r = .075 * math.sqrt((k + 1) / 26)
        add_blob(bm, (math.cos(a) * r * 1.15, math.sin(a) * r - .01, 1.735 - r * .5), (.026, .026, .026), 8, 6)
    for k in range(10):
        a = k * .63; add_blob(bm, (math.cos(a) * .105, math.sin(a) * .1 + .005, 1.63), (.026, .026, .03), 8, 6)
    styles['curls'] = bm
    bm = hair_cap('locs', keep=-.05, lift=.012, spread=1.05)
    for k in range(14):
        a = k * .45 + .2
        add_tube(bm, (math.cos(a) * .11, math.sin(a) * .11 + .01, 1.66), (math.cos(a) * .12, math.sin(a) * .12 + .02, 1.36), .011)
    styles['locs'] = bm
    bm = hair_cap('shoulder-waves', keep=-.2, lift=.012, spread=1.06)
    for s in (1, -1): add_blob(bm, (s * .105, .03, 1.52), (.04, .07, .13)); add_blob(bm, (s * .1, .04, 1.42), (.045, .06, .07))
    add_blob(bm, (0, .095, 1.5), (.09, .04, .16)); styles['shoulder-waves'] = bm
    bm = hair_cap('bob', keep=-.28, lift=.012, spread=1.07)
    for s in (1, -1): add_blob(bm, (s * .1, .015, 1.53), (.035, .085, .085))
    add_blob(bm, (0, .1, 1.55), (.1, .035, .09)); styles['bob'] = bm
    bm = hair_cap('bun', keep=-.05, lift=.01); add_blob(bm, (0, .055, 1.77), (.05, .05, .05)); styles['bun'] = bm
    bm = hair_cap('updo', keep=-.05, lift=.01); add_blob(bm, (0, .03, 1.79), (.06, .06, .05)); styles['updo'] = bm
    bm = hair_cap('ponytail', keep=-.1, lift=.01); add_blob(bm, (0, .12, 1.62), (.03, .03, .03)); add_tube(bm, (0, .12, 1.62), (0, .17, 1.36), .028); styles['ponytail'] = bm
    bm = hair_cap('braids', keep=-.15, lift=.01)
    for s in (1, -1):
        for k in range(6): add_blob(bm, (s * (.09 + k * .004), .05 + k * .004, 1.55 - k * .05), (.022, .022, .03), 8, 6)
    styles['braids'] = bm
    bm = hair_cap('pixie', keep=-.05, lift=.008, spread=1.045); add_blob(bm, (.03, -.085, 1.7), (.07, .04, .03)); styles['pixie'] = bm
    bm = hair_cap('shag', keep=-.25, lift=.014, spread=1.07)
    for k in range(12):
        a = k * .55; add_blob(bm, (math.cos(a) * .11, math.sin(a) * .11 + .01, 1.6 - (k % 3) * .03), (.024, .024, .05), 8, 6)
    styles['shag'] = bm
    bm = hair_cap('long-straight', keep=-.3, lift=.012, spread=1.07)
    for s in (1, -1): add_blob(bm, (s * .105, .03, 1.5), (.03, .07, .17))
    add_blob(bm, (0, .1, 1.45), (.1, .035, .22)); styles['long-straight'] = bm
    return [new_object(f'hair_{name}', bm, 'hair') for name, bm in styles.items()]

def build_beards(head):
    def shell(name, keep_fn, grow=.006, thick=1.0):
        bm = bmesh.new()
        bmesh.ops.create_uvsphere(bm, u_segments=36, v_segments=20, radius=1.0)
        for v in bm.verts:
            x, y, z = v.co
            t = (z + 1) / 2
            taper = .82 + .18 * math.sin(min(1, t * 1.25) * math.pi / 2)
            v.co = Vector((x * .108 * taper, y * .12 * (0.95 if z < -.4 else 1), z * .135 + 1.605))
            if z < -.55: v.co.y -= (z + .55) * .02 * -1
            n = Vector((v.co.x / .108, v.co.y / .12, (v.co.z - 1.605) / .135)).normalized()
            v.co += Vector((n.x * grow, n.y * grow, n.z * grow))
        bmesh.ops.delete(bm, geom=[v for v in bm.verts if not keep_fn(v.co)], context='VERTS')
        return new_object(name, bm, 'hair')
    lower = lambda co: co.z < 1.575 and co.y < .05 and co.z > 1.47
    beards = [
        shell('beard_stubble', lambda c: lower(c) and c.z < 1.56 and c.y < .03, .0015),
        shell('beard_short-beard', lambda c: lower(c) and c.y < .06, .007),
        shell('beard_full-beard', lambda c: c.z < 1.585 and c.z > 1.44 and c.y < .09, .014),
        shell('beard_goatee', lambda c: c.z < 1.52 and c.z > 1.46 and abs(c.x) < .035 and c.y < .0, .009),
        shell('beard_van-dyke', lambda c: (c.z < 1.52 and c.z > 1.45 and abs(c.x) < .03 and c.y < 0) or (c.z < 1.56 and c.z > 1.535 and abs(c.x) < .045 and c.y < 0), .009),
        shell('beard_soul-patch', lambda c: c.z < 1.535 and c.z > 1.49 and abs(c.x) < .03 and c.y < 0, .009),
        shell('beard_anchor', lambda c: (c.z < 1.52 and c.z > 1.45 and abs(c.x) < .022 and c.y < 0) or (c.z < 1.557 and c.z > 1.54 and abs(c.x) < .05 and c.y < 0), .009),
    ]
    mus = lambda name, w, h, curl: None
    bm = bmesh.new()
    add_blob(bm, (0, -.117, 1.563), (.032, .01, .008), 12, 6)
    beards.append(new_object('beard_moustache', bm, 'hair'))
    bm = bmesh.new()
    add_blob(bm, (0, -.117, 1.563), (.03, .01, .008), 12, 6)
    for s in (1, -1):
        add_blob(bm, (s * .038, -.112, 1.563), (.012, .008, .006), 8, 6)
        add_blob(bm, (s * .052, -.106, 1.572), (.008, .007, .009), 8, 6)
    beards.append(new_object('beard_handlebar', bm, 'hair'))
    return beards

# ---------------------------------------------------------------- clothing (shells cut from the body)
def shell_from(body, name, cuts, mat, grow, thickness=.006, keep=None):
    """A clothing shell: a copy of the body cut with clean planes ((point, normal, 'above'|'below') keeps that side), inflated and thickened."""
    obj = body.copy(); obj.data = body.data.copy(); obj.name = name
    scene.collection.objects.link(obj)
    bm = bmesh.new(); bm.from_mesh(obj.data)
    for co, no, side in cuts:
        geom = bm.verts[:] + bm.edges[:] + bm.faces[:]
        bmesh.ops.bisect_plane(bm, geom=geom, plane_co=co, plane_no=no, clear_inner=(side == 'above'), clear_outer=(side == 'below'))
    if keep:
        bmesh.ops.delete(bm, geom=[v for v in bm.verts if not keep(v.co)], context='VERTS')
    bm.normal_update()
    for v in bm.verts: v.co += v.normal * grow
    for f in bm.faces: f.smooth = True
    bm.to_mesh(obj.data); bm.free()
    obj.data.materials.clear(); obj.data.materials.append(MATERIALS[mat])
    solid = obj.modifiers.new('solid', 'SOLIDIFY'); solid.thickness = thickness; solid.offset = 1
    dg = bpy.context.evaluated_depsgraph_get()
    mesh = bpy.data.meshes.new_from_object(obj.evaluated_get(dg))
    bpy.data.objects.remove(obj)
    return new_object(name, mesh, mat)

Z, X, Y = (0, 0, 1), (1, 0, 0), (0, 1, 0)
def build_clothes(body):
    sleeves = [((.34, 0, 0), X, 'below'), ((-.34, 0, 0), X, 'above')]
    return [
        shell_from(body, 'cloth_shirt', [((0, 0, 1.0), Z, 'above'), ((0, 0, 1.47), Z, 'below'), *sleeves], 'shirt', .008),
        shell_from(body, 'cloth_vest', [((0, 0, 1.04), Z, 'above'), ((0, 0, 1.4), Z, 'below'), ((.19, 0, 0), X, 'below'), ((-.19, 0, 0), X, 'above')], 'vest', .017, .008,
                   keep=lambda c: not (c.y < -.02 and abs(c.x) < .03 and c.z > 1.16)),
        shell_from(body, 'cloth_apron', [((0, 0, .74), Z, 'above'), ((0, 0, 1.3), Z, 'below'), ((0, .01, 0), Y, 'below'), ((.2, 0, 0), X, 'below'), ((-.2, 0, 0), X, 'above')], 'apron', .02, .008),
        shell_from(body, 'cloth_pants', [((0, 0, 1.03), Z, 'below'), ((0, 0, .1), Z, 'above'), ((.235, 0, 0), X, 'below'), ((-.235, 0, 0), X, 'above')], 'pants', .01),
        shell_from(body, 'cloth_shoes', [((0, 0, .115), Z, 'below'), ((.235, 0, 0), X, 'below'), ((-.235, 0, 0), X, 'above')], 'shoes', .012, .01),
    ]

# ---------------------------------------------------------------- morph targets: pure functions of position, shared by every mesh
def gauss(p, c, r): return math.exp(-((p - Vector(c)).length / r) ** 2)
HEAD_Z = 1.6
MORPHS = {
    # body
    'broad':      lambda p: Vector((p.x * .16 * min(1, max(0, (p.z - 1.0) / .3)) * (1 if p.z > 1.0 else 0), 0, 0)) if p.z < 1.5 else Vector(),
    'slim':       lambda p: Vector((-p.x * .16, -p.y * .16, 0)) * (1 if p.z < 1.5 else 0),
    'curvy':      lambda p: Vector((p.x * .22 * gauss(p, (0, 0, .96), .2), p.y * .12 * gauss(p, (0, 0, .96), .2) , 0)) + Vector((-p.x * .1 * gauss(p, (0, 0, 1.18), .12), 0, 0)),
    'muscular':   lambda p: Vector((0, p.y * .3, (p.z - 1.2) * .0)) * (gauss(p, (.3, 0, 1.15), .25) + gauss(p, (-.3, 0, 1.15), .25)) + Vector((p.x * .06 * gauss(p, (0, 0, 1.33), .2), p.y * .1 * gauss(p, (0, 0, 1.33), .2), 0)),
    'bust':       lambda p: Vector((0, -.03, .0)) * (gauss(p, (.075, -.08, 1.31), .07) + gauss(p, (-.075, -.08, 1.31), .07)) if p.y < 0 else Vector(),
    # head shape
    'faceWidth':  lambda p: Vector((p.x * .2, 0, 0)) * gauss(p, (0, 0, HEAD_Z), .16),
    'faceLength': lambda p: Vector((0, 0, (p.z - HEAD_Z) * .16)) * gauss(p, (0, 0, HEAD_Z), .18),
    'jaw':        lambda p: Vector((p.x * .25, 0, 0)) * gauss(p, (0, -.02, 1.53), .07),
    'chin':       lambda p: Vector((0, -.018, -.006)) * gauss(p, (0, -.09, 1.49), .05),
    'cheeks':     lambda p: Vector((p.x * .13, p.y * .1, 0)) * (gauss(p, (.07, -.08, 1.57), .05) + gauss(p, (-.07, -.08, 1.57), .05)),
    'forehead':   lambda p: Vector((0, -.012, .006)) * gauss(p, (0, -.09, 1.68), .06),
    # features
    'eyeSize':    lambda p: (p - Vector((math.copysign(.043, p.x), p.y, 1.625))) * .35 * gauss(p, (math.copysign(.043, p.x), -.1, 1.625), .028),
    'eyeSpacing': lambda p: Vector((math.copysign(.006, p.x), 0, 0)) * gauss(p, (math.copysign(.043, p.x), -.1, 1.625), .03),
    'eyeTilt':    lambda p: Vector((0, 0, math.copysign(1, p.x) * (p.x - math.copysign(.043, p.x)) * .55)) * gauss(p, (math.copysign(.043, p.x), -.1, 1.625), .03),
    'eyeNarrow':  lambda p: Vector((0, 0, -(p.z - 1.625) * .55)) * gauss(p, (math.copysign(.043, p.x), -.1, 1.625), .03),
    'blink':      lambda p: Vector((0, 0, -(p.z - 1.625) * .9)) * gauss(p, (math.copysign(.043, p.x), -.1, 1.625), .03),
    'browRaise':  lambda p: Vector((0, 0, .012)) * gauss(p, (math.copysign(.046, p.x), -.108, 1.66), .04),
    'browAngry':  lambda p: Vector((0, 0, -math.copysign(1, p.x) * (abs(p.x) - .046) * .0 - (.012 if abs(p.x) < .046 else -.012) * .6)) * gauss(p, (math.copysign(.046, p.x), -.108, 1.66), .04),
    'browThick':  lambda p: Vector((0, 0, (p.z - 1.66) * .7)) * gauss(p, (math.copysign(.046, p.x), -.108, 1.66), .04),
    'noseSize':   lambda p: (p - Vector((0, -.118, 1.585))) * .4 * gauss(p, (0, -.118, 1.585), .03),
    'noseWidth':  lambda p: Vector((p.x * .5, 0, 0)) * gauss(p, (0, -.118, 1.585), .03),
    'noseUp':     lambda p: Vector((0, 0, .008)) * gauss(p, (0, -.118, 1.585), .03),
    'lipFull':    lambda p: Vector((0, (p.y + .11) * .5, (p.z - 1.543) * .8)) * gauss(p, (0, -.11, 1.543), .03),
    'lipWide':    lambda p: Vector((p.x * .3, 0, 0)) * gauss(p, (0, -.11, 1.543), .04),
    'smile':      lambda p: Vector((p.x * .05, 0, .011 * min(1, (abs(p.x) / .03) ** 2))) * gauss(p, (0, -.11, 1.543), .05),
    'mouthOpen':  lambda p: Vector((0, 0, -.014 if p.z < 1.543 else 0)) * gauss(p, (0, -.11, 1.535), .03) + Vector((0, 0, .0)),
    'earSize':    lambda p: (p - Vector((math.copysign(.107, p.x), .005, 1.6))) * .5 * gauss(p, (math.copysign(.107, p.x), .005, 1.6), .04),
}
# morphs that only make sense on the head: skip them on other meshes cheaply via influence radius, the function returns ~0 elsewhere.
BODY_MORPHS = {'broad', 'slim', 'curvy', 'muscular', 'bust'}
HEAD_SHAPE_MORPHS = {'faceWidth', 'faceLength', 'jaw', 'chin', 'cheeks', 'forehead'}
def add_shape_keys(obj):
    mesh = obj.data
    is_body = obj.name == 'body' or obj.name.startswith('cloth_')
    is_face_part = obj.name.split('_')[0] in ('eye', 'iris', 'pupil', 'brow', 'ear', 'nose', 'lips', 'mouth', 'head')
    coords = [v.co.copy() for v in mesh.vertices]
    obj.shape_key_add(name='Basis', from_mix=False)
    for name, fn in MORPHS.items():
        if is_body != (name in BODY_MORPHS) and not (name in HEAD_SHAPE_MORPHS and not is_body):
            continue
        if not is_body and not is_face_part and name not in HEAD_SHAPE_MORPHS:
            continue   # hair and beards follow the skull only
        deltas = [fn(co) for co in coords]
        if max((d.length for d in deltas), default=0) < 2e-4:
            continue
        key = obj.shape_key_add(name=name, from_mix=False)
        for v, d in zip(key.data, deltas):
            v.co = v.co + d
        key.value = 0
    # 'kaOnly' safety: blend shapes keep range 0..1 (three.js clamps)

# ---------------------------------------------------------------- armature + weights
BONES = [
    ('hips', None, (0, 0, .95), (0, 0, 1.08)), ('spine', 'hips', (0, 0, 1.08), (0, 0, 1.25)), ('chest', 'spine', (0, 0, 1.25), (0, 0, 1.42)),
    ('neck', 'chest', (0, 0, 1.42), (0, 0, 1.5)), ('head', 'neck', (0, 0, 1.5), (0, 0, 1.75)),
]
for side, s in (('L', 1), ('R', -1)):
    BONES += [
        (f'shoulder.{side}', 'chest', (.03 * s, 0, 1.4), (.17 * s, 0, 1.38)),
        (f'upper_arm.{side}', f'shoulder.{side}', (.17 * s, 0, 1.38), (.31 * s, 0, 1.13)),
        (f'forearm.{side}', f'upper_arm.{side}', (.31 * s, 0, 1.13), (.37 * s, 0, .93)),
        (f'hand.{side}', f'forearm.{side}', (.37 * s, 0, .93), (.395 * s, 0, .8)),
        (f'thigh.{side}', 'hips', (.09 * s, 0, .95), (.1 * s, 0, .52)),
        (f'shin.{side}', f'thigh.{side}', (.1 * s, 0, .52), (.1 * s, 0, .09)),
        (f'foot.{side}', f'shin.{side}', (.1 * s, 0, .09), (.1 * s, -.11, .035)),
    ]
def build_armature():
    arm_data = bpy.data.armatures.new('rig')
    arm = bpy.data.objects.new('rig', arm_data)
    scene.collection.objects.link(arm)
    bpy.context.view_layer.objects.active = arm
    bpy.ops.object.mode_set(mode='EDIT')
    for name, parent, head, tail in BONES:
        b = arm_data.edit_bones.new(name)
        b.head, b.tail = Vector(head), Vector(tail)
        if parent:
            b.parent = arm_data.edit_bones[parent]
            b.use_connect = (Vector(head) - arm_data.edit_bones[parent].tail).length < 1e-4
    bpy.ops.object.mode_set(mode='OBJECT')
    return arm

def seg_dist(p, a, b):
    ab = b - a; t = max(0, min(1, (p - a).dot(ab) / ab.length_squared))
    return (p - (a + ab * t)).length
def skin_to(obj, arm, rigid_bone=None):
    for name, *_ in BONES: obj.vertex_groups.new(name=name)
    segs = [(n, Vector(h), Vector(t)) for n, _, h, t in BONES]
    for v in obj.data.vertices:
        if rigid_bone:
            obj.vertex_groups[rigid_bone].add([v.index], 1.0, 'REPLACE'); continue
        ws = []
        for n, h, t in segs:
            d = seg_dist(v.co, h, t)
            ws.append((n, math.exp(-(d / .045) ** 2) + 1e-6))
        ws.sort(key=lambda w: -w[1]); ws = ws[:4]
        total = sum(w for _, w in ws)
        for n, w in ws: obj.vertex_groups[n].add([v.index], w / total, 'REPLACE')
    mod = obj.modifiers.new('rig', 'ARMATURE'); mod.object = arm
    obj.parent = arm

# ---------------------------------------------------------------- animations
FPS = 24
def R(x=0, y=0, z=0): return Euler((math.radians(x), math.radians(y), math.radians(z)), 'XYZ').to_quaternion()
def make_action(arm, name, frames, keys):
    """keys: {bone: [(frame, (rx, ry, rz) global degrees, optional (dx,dy,dz) location)]}"""
    action = bpy.data.actions.new(name)
    action.use_fake_user = True
    arm.animation_data_create(); arm.animation_data.action = action
    for pb in arm.pose.bones:
        pb.rotation_mode = 'QUATERNION'; pb.rotation_quaternion = (1, 0, 0, 0); pb.location = (0, 0, 0)
    for bone, track in keys.items():
        pb = arm.pose.bones[bone]
        M = pb.bone.matrix_local.to_3x3()
        for entry in track:
            frame, rot = entry[0], entry[1]
            g = R(*rot).to_matrix()
            pb.rotation_quaternion = (M.inverted() @ g @ M).to_quaternion()
            pb.keyframe_insert('rotation_quaternion', frame=frame)
            if len(entry) > 2:
                pb.location = M.inverted() @ Vector(entry[2])
                pb.keyframe_insert('location', frame=frame)
    # loop cleanly
    for fc in action.fcurves:
        for kp in fc.keyframe_points: kp.interpolation = 'BEZIER'
    action.frame_range = (0, frames)
    return action

def cycle(frames, values, phase=0):
    """values(t) -> tuple; sampled every 4 frames over one loop."""
    return [(f, values(((f + phase) % frames) / frames)) for f in range(0, frames + 1, 4)]
sw = lambda t, a=1: math.sin(t * 2 * math.pi) * a
def side(name, s): return f'{name}.{"L" if s > 0 else "R"}'

def build_actions(arm):
    N = 96
    arm_rest = lambda s: {side('upper_arm', s): [(0, (0, 0, 0))]}
    def relaxed(t, s=1):  # arms hang slightly out
        return (0, -s * 6, 0)
    make_action(arm, 'idle', N, {
        'chest': cycle(N, lambda t: (sw(t, 1.2), 0, 0)),
        'spine': cycle(N, lambda t: (0, 0, sw(t, 1.2))),
        'head': cycle(N, lambda t: (sw(t + .2, 1.5), 0, sw(t, 2.5))),
        'upper_arm.L': cycle(N, lambda t: (sw(t, 1.5), 8, 0)), 'upper_arm.R': cycle(N, lambda t: (sw(t + .1, 1.5), -8, 0)),
        'forearm.L': cycle(N, lambda t: (-6 - sw(t, 2), 0, 0)), 'forearm.R': cycle(N, lambda t: (-6 - sw(t + .1, 2), 0, 0)),
        'hips': [(0, (0, 0, 0)) for _ in range(1)] + [(N, (0, 0, 0))]})
    M = 48
    make_action(arm, 'talk', M, {
        'head': cycle(M, lambda t: (abs(sw(t * 2, 4)) - 1, 0, sw(t, 4))),
        'chest': cycle(M, lambda t: (sw(t * 2, 1), 0, sw(t, 2))),
        'upper_arm.R': cycle(M, lambda t: (-22 - sw(t * 2, 12), -14, 0)), 'forearm.R': cycle(M, lambda t: (-55 - sw(t * 2 + .25, 25), 0, sw(t, 10))),
        'hand.R': cycle(M, lambda t: (0, 0, sw(t * 2, 20))),
        'upper_arm.L': cycle(M, lambda t: (-8, 8, 0)), 'forearm.L': cycle(M, lambda t: (-20, 0, 0))})
    make_action(arm, 'listen', 96, {
        'head': cycle(96, lambda t: (2 + sw(t * 2, 2), 0, 8 + sw(t, 1.5))), 'chest': cycle(96, lambda t: (sw(t, 1), 0, 0)),
        'upper_arm.R': cycle(96, lambda t: (-30, -12, 0)), 'forearm.R': cycle(96, lambda t: (-95, 0, 0)), 'hand.R': cycle(96, lambda t: (-20, 0, 0)),
        'upper_arm.L': cycle(96, lambda t: (0, 8, 0))})
    make_action(arm, 'think', 96, {
        'head': cycle(96, lambda t: (-4, 0, -10 + sw(t, 2))), 'upper_arm.R': cycle(96, lambda t: (-45, -25, 0)), 'forearm.R': cycle(96, lambda t: (-125, 0, 0)),
        'chest': cycle(96, lambda t: (sw(t, 1), 0, 0)), 'upper_arm.L': cycle(96, lambda t: (-20, 15, 0)), 'forearm.L': cycle(96, lambda t: (-70, 0, 0))})
    P = 72
    ramp = lambda t, a=.25, b=.75: min(1, t / a, (1 - t) / (1 - b)) if a > 0 else 1
    make_action(arm, 'pour', P, {
        'chest': cycle(P, lambda t: (-4 * ramp(t), 0, -6 * ramp(t))), 'head': cycle(P, lambda t: (8 * ramp(t), 0, 0)),
        'upper_arm.R': cycle(P, lambda t: (-70 * ramp(t), -20 * ramp(t), 0)), 'forearm.R': cycle(P, lambda t: (-55 * ramp(t), 0, 0)),
        'hand.R': cycle(P, lambda t: (-70 * max(0, min(1, (t - .25) / .2, (.8 - t) / .2)), 0, 0)),
        'upper_arm.L': cycle(P, lambda t: (-55 * ramp(t), 25 * ramp(t), 0)), 'forearm.L': cycle(P, lambda t: (-60 * ramp(t), 0, 0))})
    S = 48
    shake_arm = lambda s, ph: {
        side('upper_arm', s): cycle(S, lambda t: (-58, -s * 30, 0)),
        side('forearm', s): cycle(S, lambda t: (-95 + sw(t * 4 + ph, 14), 0, sw(t * 4 + ph, 10) * s)),
        side('hand', s): cycle(S, lambda t: (sw(t * 4 + ph, 12), 0, 0))}
    keys = {'chest': cycle(S, lambda t: (-3, 0, sw(t * 4, 5))), 'head': cycle(S, lambda t: (4, 0, sw(t * 4, 3)))}
    keys.update(shake_arm(1, 0)); keys.update(shake_arm(-1, .05))
    make_action(arm, 'shake', S, keys)
    make_action(arm, 'stir', S, {
        'chest': cycle(S, lambda t: (-3, 0, sw(t, 3))), 'head': cycle(S, lambda t: (10, 0, 0)),
        'upper_arm.R': cycle(S, lambda t: (-62 + sw(t + .25, 6), -18 + sw(t, 8), 0)), 'forearm.R': cycle(S, lambda t: (-58, 0, sw(t, 12))),
        'upper_arm.L': cycle(S, lambda t: (-35, 20, 0)), 'forearm.L': cycle(S, lambda t: (-70, 0, 0))})
    V = 60
    make_action(arm, 'serve', V, {
        'chest': cycle(V, lambda t: (-8 * ramp(t, .3, .7), 0, 0)), 'head': cycle(V, lambda t: (-2, 0, 0)),
        'upper_arm.R': cycle(V, lambda t: (-80 * ramp(t, .3, .7), -12 * ramp(t, .3, .7), 0)), 'forearm.R': cycle(V, lambda t: (-20 * ramp(t, .3, .7), 0, 0)),
        'upper_arm.L': cycle(V, lambda t: (0, 8, 0))})
    make_action(arm, 'garnish', 60, {
        'chest': cycle(60, lambda t: (-4, 0, 3)), 'head': cycle(60, lambda t: (10, 0, 0)),
        'upper_arm.R': cycle(60, lambda t: (-60 + sw(t * 2, 4), -15, 0)), 'forearm.R': cycle(60, lambda t: (-65, 0, 0)), 'hand.R': cycle(60, lambda t: (sw(t * 2, 15), 0, 0)),
        'upper_arm.L': cycle(60, lambda t: (-40, 22, 0)), 'forearm.L': cycle(60, lambda t: (-75, 0, 0))})
    make_action(arm, 'react_happy', 48, {
        'hips': [(f, (0, 0, 0), (0, 0, .02 * abs(sw(f / 48 * 2)))) for f in range(0, 49, 4)],
        'head': cycle(48, lambda t: (-4, 0, sw(t, 6))), 'chest': cycle(48, lambda t: (-3, 0, sw(t, 3))),
        'upper_arm.L': cycle(48, lambda t: (-35 + sw(t * 2, 6), 30, 0)), 'upper_arm.R': cycle(48, lambda t: (-35 + sw(t * 2, 6), -30, 0)),
        'forearm.L': cycle(48, lambda t: (-50, 0, 0)), 'forearm.R': cycle(48, lambda t: (-50, 0, 0))})
    make_action(arm, 'react_angry', 48, {
        'head': cycle(48, lambda t: (10, 0, sw(t * 3, 6))), 'chest': cycle(48, lambda t: (4 + sw(t * 3, 1), 0, 0)),
        'upper_arm.L': cycle(48, lambda t: (-20, 14, 0)), 'upper_arm.R': cycle(48, lambda t: (-20, -14, 0)),
        'forearm.L': cycle(48, lambda t: (-105, 0, 0)), 'forearm.R': cycle(48, lambda t: (-105, 0, 0))})
    make_action(arm, 'wave', 48, {
        'chest': cycle(48, lambda t: (0, 0, -3)), 'head': cycle(48, lambda t: (0, 0, sw(t, 4))),
        'upper_arm.R': cycle(48, lambda t: (-20, -105, 0)), 'forearm.R': cycle(48, lambda t: (0, 0, sw(t * 3, 30))),
        'upper_arm.L': cycle(48, lambda t: (0, 8, 0))})
    make_action(arm, 'receive', 48, {
        'chest': cycle(48, lambda t: (-3 * ramp(t), 0, 0)), 'upper_arm.R': cycle(48, lambda t: (-60 * ramp(t), -14 * ramp(t), 0)),
        'forearm.R': cycle(48, lambda t: (-20 * ramp(t), 0, 0)), 'hand.R': cycle(48, lambda t: (-30 * ramp(t), 0, 0))})
    arm.animation_data.action = None

# ---------------------------------------------------------------- assemble
body = build_body()
head = build_head()
face = build_face(head)
hair = build_hair()
beards = build_beards(head)
clothes = build_clothes(body)
arm = build_armature()
for obj in [body, head, *face, *hair, *beards, *clothes]:
    add_shape_keys(obj)
HEAD_SCALE = 1.22
head_matrix = Matrix.Translation((0, 0, 1.5)) @ Matrix.Scale(HEAD_SCALE, 4) @ Matrix.Translation((0, 0, -1.5))
for obj in [head, *face, *hair, *beards]:
    obj.data.transform(head_matrix, shape_keys=True)
skin_to(body, arm)
for obj in clothes: skin_to(obj, arm)
for obj in [head, *face, *hair, *beards]: skin_to(obj, arm, rigid_bone='head')
build_actions(arm)

# ---------------------------------------------------------------- optional preview render
def render(path, frame_action=None, frame=0, view='front'):
    cam_data = bpy.data.cameras.new('cam'); cam = bpy.data.objects.new('cam', cam_data); scene.collection.objects.link(cam)
    cam_data.type = 'ORTHO'; cam_data.ortho_scale = 1.9 if view != 'head' else .45
    if view == 'front': cam.location = (0, -6, .95); cam.rotation_euler = (math.radians(90), 0, 0)
    elif view == 'side': cam.location = (6, 0, .95); cam.rotation_euler = (math.radians(90), 0, math.radians(90))
    else: cam.location = (0, -6, 1.6); cam.rotation_euler = (math.radians(90), 0, 0)
    scene.camera = cam
    scene.render.engine = 'BLENDER_WORKBENCH'
    scene.display.shading.light = 'STUDIO'; scene.display.shading.color_type = 'MATERIAL'
    scene.render.resolution_x, scene.render.resolution_y = 500, 700 if view != 'head' else 500
    scene.render.filepath = str(path)
    if frame_action:
        arm.animation_data.action = bpy.data.actions[frame_action]; scene.frame_set(frame)
    bpy.ops.render.render(write_still=True)

if render_prefix:
    keep = {'hair_short', 'hair_pompadour', 'beard_short-beard', 'cloth_shirt', 'cloth_vest', 'cloth_pants', 'cloth_shoes', 'beard_moustache'}
    for o in list(hair) + list(beards) + list(clothes):
        o.hide_render = o.name not in keep
    render(f'{render_prefix}_front.png'); render(f'{render_prefix}_side.png', view='side'); render(f'{render_prefix}_head.png', view='head')
    render(f'{render_prefix}_pour.png', 'pour', 30); render(f'{render_prefix}_shake.png', 'shake', 6)
    for o in list(hair) + list(beards) + list(clothes): o.hide_render = False
    arm.animation_data.action = None

# ---------------------------------------------------------------- export
OUT.parent.mkdir(parents=True, exist_ok=True)
bpy.ops.object.select_all(action='DESELECT')
for o in scene.objects: o.select_set(True)
bpy.ops.export_scene.gltf(filepath=str(OUT), export_format='GLB', export_animations=True, export_animation_mode='ACTIONS', export_morph=True,
                          export_skins=True, export_apply=False, export_yup=True, export_image_format='NONE', export_cameras=False, export_lights=False)
print('exported', OUT, OUT.stat().st_size // 1024, 'KB')
