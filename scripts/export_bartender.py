"""Build the low-poly, game-ready bartender avatar. Sources stay untouched.
blender --background --factory-startup --disable-autoexec --python scripts/export_bartender.py -- --source C:/Users/kubai/Desktop/Models

Base: Female_Leather_Suit.Fbx (low-poly body, hair, leather outfit, strap boots).
Extra garments and brows come from Amber.Fbx and are refitted onto the base body and rig.
"""
import argparse, json, math, re, shutil, sys
from pathlib import Path
import bpy
from mathutils import Vector, Quaternion, Matrix, kdtree
from mathutils.bvhtree import BVHTree

ROOT=Path(__file__).resolve().parents[1]
args=argparse.ArgumentParser(); args.add_argument('--source',type=Path,required=True)
opts=args.parse_args(sys.argv[sys.argv.index('--')+1:])
OUT=ROOT/'public/assets/characters/3d'; OUT.mkdir(parents=True,exist_ok=True)
(OUT/'draco').mkdir(exist_ok=True)
for name in ['draco_decoder.js','draco_decoder.wasm','draco_wasm_wrapper.js']:
 shutil.copy2(ROOT/'node_modules/three/examples/jsm/libs/draco/gltf'/name, OUT/'draco'/name)
scene=bpy.context.scene
bpy.ops.object.select_all(action='SELECT'); bpy.ops.object.delete(use_global=False)

# ---- Import the base character, then the extra garments --------------------
bpy.ops.import_scene.fbx(filepath=str(opts.source/'Female_Leather_Suit.Fbx'))
base_objs=set(scene.objects)
rig=next(o for o in base_objs if o.type=='ARMATURE')
# The FBX animates the rig object; keep its imported transform and the stored static pose, drop the clip.
rig_matrix=rig.matrix_world.copy()
rig.animation_data_clear()
rig.matrix_world=rig_matrix
for pb in rig.pose.bones: pb.location=(0,0,0); pb.rotation_mode='QUATERNION'; pb.rotation_quaternion=(1,0,0,0); pb.scale=(1,1,1)
bpy.context.view_layer.update()
body=next(o for o in base_objs if o.name=='CC_Base_Body')

bpy.ops.import_scene.fbx(filepath=str(opts.source/'Amber.Fbx'))
amber_names={o.name for o in set(scene.objects)-base_objs}
KEEP_AMBER={'Jeans','Crop_T_Shirt','Punk_Leather_Jacket','Boots','Camila_Brow'}
for name in amber_names-KEEP_AMBER: bpy.data.objects.remove(bpy.data.objects[name],do_unlink=True)
amber_objs={bpy.data.objects[n] for n in amber_names&KEEP_AMBER}

# Amber is ~3% smaller than the base body; scale its garments to the base proportions.
FIT_SCALE=1.03
fit=Matrix.Translation((0,0,0.025-FIT_SCALE*0.015))@Matrix.Scale(FIT_SCALE,4)

# Brows follow the head, not the torso: a pure offset to the base eye position.
BROW_FIT=Matrix.Translation((0,-.005,.047))
# Every mesh is baked into world space with an identity transform, skinned to one rig.
def bake_to_world(obj,extra=Matrix.Identity(4)):
 m=extra@obj.matrix_world
 obj.data.transform(m,shape_keys=True)
 obj.parent=None; obj.matrix_world=Matrix.Identity(4)
 obj.data.update()
for obj in list(scene.objects):
 if obj.type=='MESH': bake_to_world(obj,(BROW_FIT if obj.name=='Camila_Brow' else fit) if obj in amber_objs else Matrix.Identity(4))
for obj in amber_objs:
 for mod in list(obj.modifiers): obj.modifiers.remove(mod)

# Refitted garments must not sink into the new body: push any vertex that lies
# inside the skin out to a small margin above the nearest body surface.
def push_out(obj,margin=.006,passes=3):
 bvh=BVHTree.FromPolygons([v.co.copy() for v in body.data.vertices],[tuple(p.vertices) for p in body.data.polygons])
 moved=0
 for _ in range(passes):
  for v in obj.data.vertices:
   hit=bvh.find_nearest(v.co)
   if hit[0] is None: continue
   loc,nrm=hit[0],hit[1]
   if (v.co-loc).dot(nrm)<margin: v.co=loc+nrm*margin; moved+=1
 obj.data.update(); print('PUSH_OUT',obj.name,moved)
for obj in amber_objs:
 if obj.name!='Camila_Brow': push_out(obj)

# ---- Conforming work apron: a grid wrapped onto the torso front -----------
verts=[]; faces=[]; ROWS,COLS=30,14
Z0,Z1=.92,1.31
def half_width(z):
 if z<.97: return .150
 if z<1.06: return .150-(.150-.112)*(z-.97)/.09
 return .112-(.112-.088)*(z-1.06)/(Z1-1.06)
for row in range(ROWS+1):
 z=Z0+(Z1-Z0)*row/ROWS
 for col in range(COLS+1):
  verts.append(((col/COLS*2-1)*half_width(z),-.45,z))
for row in range(ROWS):
 for col in range(COLS):
  a=row*(COLS+1)+col; faces.append((a,a+1,a+COLS+2,a+COLS+1))
mesh=bpy.data.meshes.new('Apron'); mesh.from_pydata(verts,[],faces); mesh.update()
apron=bpy.data.objects.new('Apron',mesh); scene.collection.objects.link(apron)
bpy.context.view_layer.objects.active=apron
sw=apron.modifiers.new('Wrap','SHRINKWRAP'); sw.target=body; sw.wrap_method='PROJECT'
sw.use_project_x=False; sw.use_project_y=True; sw.use_project_z=False
sw.use_negative_direction=False; sw.use_positive_direction=True; sw.offset=.02; sw.cull_face='OFF'
bpy.ops.object.modifier_apply(modifier=sw.name)
mat=bpy.data.materials.new('ApronCanvas'); mat.use_nodes=True; mat.use_backface_culling=False
apron.data.materials.append(mat)
# ---- Relax the T-pose arms into a standing pose ---------------------------
# A weighted rotation about each shoulder, driven by the skin weights, moves the
# arms down before any morph is computed. Morph targets are rotated identically.
ARM=re.compile(r'CC_Base_([LR])_(Upperarm(Twist\d+)?|Forearm(Twist\d+)?|Hand|(Thumb|Index|Mid|Ring|Pinky)\d|ElbowShareBone)$')
SHOULDER={'L':(.136,1.388),'R':(-.136,1.388)}; ARM_DROP=.98
def group_arm_weights(obj):
 names={g.index:g.name for g in obj.vertex_groups}
 weights=[]
 for v in obj.data.vertices:
  w={'L':0.,'R':0.}
  for g in v.groups:
   m=ARM.match(names.get(g.group,''))
   if m: w[m.group(1)]+=g.weight
  weights.append(w)
 return weights
body_weights=group_arm_weights(body)
body_tree=kdtree.KDTree(len(body.data.vertices))
for i,v in enumerate(body.data.vertices): body_tree.insert(v.co,i)
body_tree.balance()
def relax_arms(obj):
 if obj in amber_objs: weights=[body_weights[body_tree.find(v.co)[1]] for v in obj.data.vertices]
 else: weights=group_arm_weights(obj)
 if not any(w['L'] or w['R'] for w in weights): return
 def pose(co,w):
  co=co.copy()
  for side in 'LR':
   k=min(1.,w[side])
   if not k: continue
   px,pz=SHOULDER[side]; ang=ARM_DROP*k*(1 if side=='L' else -1)
   c,sn=math.cos(ang),math.sin(ang); dx,dz=co.x-px,co.z-pz
   co.x=px+dx*c+dz*sn; co.z=pz-dx*sn+dz*c
  return co
 blocks=[obj.data.shape_keys.key_blocks] if obj.data.shape_keys else []
 for i,v in enumerate(obj.data.vertices):
  v.co=pose(v.co,weights[i])
  for kb in blocks:
   for key in kb: key.data[i].co=pose(key.data[i].co,weights[i])
for obj in scene.objects:
 if obj.type=='MESH': relax_arms(obj)
obj_update=[o.data.update() for o in scene.objects if o.type=='MESH']

# ---- Facial morph palette ---------------------------------------------------
SHAPES={
 'eyesWide':['Eye_Wide_L','Eye_Wide_R'], 'eyesNarrow':['Eye_Squint_L','Eye_Squint_R'],
 'browArch':['Brow_Raise_Outer_L','Brow_Raise_Outer_R'], 'browInner':['Brow_Raise_Inner_L','Brow_Raise_Inner_R'],
 'lipsFull':['Mouth_Roll_Out_Upper_L','Mouth_Roll_Out_Upper_R','Mouth_Roll_Out_Lower_L','Mouth_Roll_Out_Lower_R'],
 'lipsThin':['Mouth_Roll_In_Upper_L','Mouth_Roll_In_Upper_R','Mouth_Roll_In_Lower_L','Mouth_Roll_In_Lower_R'],
 'lipsWide':['Mouth_Stretch_L','Mouth_Stretch_R'], 'lipsSmall':['Mouth_Pucker_Up_L','Mouth_Pucker_Up_R','Mouth_Pucker_Down_L','Mouth_Pucker_Down_R'],
 'noseWide':['Nose_Nostril_Dilate_L','Nose_Nostril_Dilate_R'], 'noseNarrow':['Nose_Nostril_In_L','Nose_Nostril_In_R'],
 'noseUp':['Nose_Tip_Up'], 'noseDown':['Nose_Tip_Down'],
 'cheekHigh':['Cheek_Raise_L','Cheek_Raise_R'], 'cheekFull':['Cheek_Puff_L','Cheek_Puff_R'], 'cheekHollow':['Cheek_Suck_L','Cheek_Suck_R'],
 'smile':['Mouth_Smile_L','Mouth_Smile_R'], 'jawOpen':['Jaw_Open'], 'blink':['Eye_Blink_L','Eye_Blink_R']}
remove={'CC_Base_TearLine','CC_Base_EyeOcclusion'}
for obj in list(scene.objects):
 if obj.type not in {'MESH','ARMATURE'} or obj.name in remove: bpy.data.objects.remove(obj,do_unlink=True)

HAIR={'Hair_Base','Bang','Bun','Real_Hair'}
FITTED={'CC_Base_Body','Jeans','Crop_T_Shirt','Punk_Leather_Jacket','Boots','Apron','F_Black_Outfit_L','Punk_Strap_Boots'}
BODY_BUDGET=11000; GARMENT_BUDGET=3000
for obj in list(scene.objects):
 if obj.type!='MESH': continue
 bpy.context.view_layer.objects.active=obj
 bpy.ops.object.select_all(action='DESELECT'); obj.select_set(True)
 base=[v.co.copy() for v in obj.data.vertices]
 tree=kdtree.KDTree(len(base))
 for i,co in enumerate(base): tree.insert(co,i)
 tree.balance()
 deltas={}
 if obj.data.shape_keys:
  keys=obj.data.shape_keys.key_blocks
  for name,sources in SHAPES.items():
   valid=[keys[s] for s in sources if s in keys]
   if valid: deltas[name]=[sum((s.data[i].co-base[i] for s in valid),Vector()) for i in range(len(base))]
  obj.shape_key_clear()
 if obj.name in HAIR:
  budget=len(base)  # hair cards keep their topology: decimation destroys strand alpha edges
 elif obj.name=='CC_Base_Body': budget=BODY_BUDGET
 elif obj.name=='Apron': budget=len(base)
 else: budget=max(GARMENT_BUDGET,0)
 if len(base)>budget:
  if obj.name=='CC_Base_Body':
   keep=obj.vertex_groups.new(name='HeadKeep')
   keep.add([v.index for v in obj.data.vertices if v.co.z>1.47],1.0,'REPLACE')
  modifier=obj.modifiers.new('Game resolution','DECIMATE')
  modifier.ratio=budget/len(base)
  if obj.name=='CC_Base_Body': modifier.vertex_group='HeadKeep'; modifier.vertex_group_factor=12
  bpy.ops.object.modifier_apply(modifier=modifier.name)
  if 'HeadKeep' in obj.vertex_groups: obj.vertex_groups.remove(obj.vertex_groups['HeadKeep'])
 nearest=[tree.find(v.co)[1] for v in obj.data.vertices]
 if deltas:
  obj.shape_key_add(name='Basis')
  for name,delta in deltas.items():
   key=obj.shape_key_add(name=name)
   for i,v in enumerate(obj.data.vertices): key.data[i].co=v.co+delta[nearest[i]]
 # Shared body morphs on every fitted garment prevent body/clothes separation.
 if not obj.data.shape_keys: obj.shape_key_add(name='Basis')
 body_presets=[('bodySlim',-.13,-.08),('bodyCurvy',.18,.12),('bodyBroad',.22,.16),('bodyMuscular',.15,.08)] if obj.name in FITTED else []
 for name,width,depth in body_presets:
  key=obj.shape_key_add(name=name)
  for i,v in enumerate(obj.data.vertices):
   p=v.co.copy(); z=p.z
   weight=max(0,min(1,(1.48-z)/.16))
   if name=='bodyCurvy': weight*=math.exp(-((z-.94)/.23)**2)
   if name=='bodyMuscular': weight*=math.exp(-((z-1.3)/.24)**2)
   p.x*=1+width*weight; p.y*=1+depth*weight
   key.data[i].co=p
 # Face projection for procedural cosmetics, independent of the source texture UV.
 uv=obj.data.uv_layers.new(name='FaceProjection')
 for loop in obj.data.loops:
  p=obj.data.vertices[loop.vertex_index].co
  uv.data[loop.index].uv=((p.x+.103)/.206,(p.z-1.487)/.206) if p.y<-.025 else (-10,-10)
 for poly in obj.data.polygons: poly.use_smooth=True
 for color in list(obj.data.color_attributes): obj.data.color_attributes.remove(color)
 obj['source']='Female_Leather_Suit.Fbx' if obj.name not in KEEP_AMBER else 'Amber.Fbx'

# ---- Materials: simplify and size textures for mobile delivery -------------
for mat in bpy.data.materials:
 if not mat.use_nodes or mat.users==0: continue
 nodes=mat.node_tree.nodes
 images=[n.image for n in nodes if n.type=='TEX_IMAGE' and n.image]
 diffuse=next((i for i in images if 'Diffuse' in i.name or 'BaseColor' in i.name or 'basecolor' in i.name.lower()),None)
 opacity=next((i for i in images if 'Opacity' in i.name or 'opacity' in i.name.lower()),None)
 nodes.clear(); out=nodes.new('ShaderNodeOutputMaterial'); bs=nodes.new('ShaderNodeBsdfPrincipled')
 mat.node_tree.links.new(bs.outputs['BSDF'],out.inputs['Surface']); bs.inputs['Roughness'].default_value=.7
 if mat.name=='ApronCanvas': bs.inputs['Base Color'].default_value=(.035,.075,.09,1); mat.diffuse_color=(.035,.075,.09,1)
 if diffuse:
  tex=nodes.new('ShaderNodeTexImage'); tex.image=diffuse
  mat.node_tree.links.new(tex.outputs['Color'],bs.inputs['Base Color'])
 if any(s in mat.name for s in ['Transparency','Eyelash','Scalp']):
  mat.surface_render_method='DITHERED'; mat.use_backface_culling=False
  if opacity:
   tex=nodes.new('ShaderNodeTexImage'); tex.image=opacity
   mat.node_tree.links.new(tex.outputs['Color'],bs.inputs['Alpha'])
 for img in images:
  limit=2048 if mat.name=='Std_Skin_Head' else 512 if re.search('Eye|Cornea|Teeth|Tongue',mat.name) else 1024
  if img.size[0]>limit or img.size[1]>limit:
   factor=limit/max(img.size); img.scale(max(1,int(img.size[0]*factor)),max(1,int(img.size[1]*factor))); img.pack()
  if not opacity and img is diffuse and img.file_format!='JPEG':
   img.file_format='JPEG'; img.pack()  # opaque colour maps do not need an alpha channel
# Purge everything the trimmed scene no longer uses (Amber body textures etc.).
bpy.ops.outliner.orphans_purge(do_local_ids=True,do_linked_ids=True,do_recursive=True)

# Skinning was only needed to pose the arms; ship plain (un-skinned) morph meshes.
for obj in list(scene.objects):
 if obj.type=='MESH':
  for mod in list(obj.modifiers): obj.modifiers.remove(mod)
  obj.vertex_groups.clear()
bpy.data.objects.remove(rig,do_unlink=True)
# Save an editable, self-contained project as well as the runtime asset.
(ROOT/'assets-src/characters/imported').mkdir(parents=True,exist_ok=True)
bpy.ops.file.pack_all()
bpy.ops.wm.save_as_mainfile(filepath=str(ROOT/'assets-src/characters/imported/bartender.blend'))
bpy.ops.export_scene.gltf(filepath=str(OUT/'amber.glb'),export_format='GLB',export_animations=False,export_morph_normal=False,export_morph_tangent=False,export_try_sparse_sk=True,export_extras=True,export_image_format='AUTO',export_draco_mesh_compression_enable=True,export_draco_mesh_compression_level=6,export_draco_texcoord_quantization=16)
report={'source':'Female_Leather_Suit.Fbx + Amber.Fbx','asset':'amber.glb','bytes':(OUT/'amber.glb').stat().st_size,'meshes':[{ 'name':o.name,'vertices':len(o.data.vertices),'morphs':[k.name for k in o.data.shape_keys.key_blocks][1:] if o.data.shape_keys else []} for o in scene.objects if o.type=='MESH']}
(OUT/'manifest.json').write_text(json.dumps(report,indent=2))
print('EXPORT_REPORT',json.dumps({'bytes':report['bytes'],'verts':{m['name']:m['vertices'] for m in report['meshes']}}))
