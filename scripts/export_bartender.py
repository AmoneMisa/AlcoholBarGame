"""Build the low-poly, game-ready bartender avatars. Sources stay untouched.

  blender --background --factory-startup --disable-autoexec --python scripts/export_bartender.py -- --source C:/Users/kubai/Desktop/Models --character female
  blender --background --factory-startup --disable-autoexec --python scripts/export_bartender.py -- --source C:/Users/kubai/Desktop/Models --character male

female (amber.glb): Female_Leather_Suit.Fbx base (body, hair, leather outfit, strap boots), Amber.Fbx jeans/tee/jacket/boots/brows
                    refitted onto it, plus the long SKM_Hair style.
male   (leo.glb):   Hassan+V1.blend (body, shirt, jeans, boots, blowback hair, brows, real 3D beard meshes).
"""
import argparse, json, math, re, shutil, sys
from pathlib import Path
import bpy, bmesh
from mathutils import Vector, Quaternion, Matrix, kdtree
from mathutils.bvhtree import BVHTree

ROOT=Path(__file__).resolve().parents[1]
args=argparse.ArgumentParser(); args.add_argument('--source',type=Path,required=True); args.add_argument('--character',choices=['female','male'],default='female')
opts=args.parse_args(sys.argv[sys.argv.index('--')+1:])
MALE=opts.character=='male'
OUT=ROOT/'public/assets/characters/3d'; OUT.mkdir(parents=True,exist_ok=True)
(OUT/'draco').mkdir(exist_ok=True)
for name in ['draco_decoder.js','draco_decoder.wasm','draco_wasm_wrapper.js']:
 shutil.copy2(ROOT/'node_modules/three/examples/jsm/libs/draco/gltf'/name, OUT/'draco'/name)
GLB='leo.glb' if MALE else 'amber.glb'
scene=bpy.context.scene

# ---- Import ---------------------------------------------------------------
amber_objs=set(); skm_objs=set()
if MALE:
 bpy.ops.wm.open_mainfile(filepath=str(opts.source/'Hassan+V1.blend'))
 scene=bpy.context.scene
 # The metre-scale copies carry the packed textures; the centimetre duplicates lost theirs.
 KEEP={'CC_Base_Body.001','CC_Base_Eye.001','Plaid_Punk_Shirt.001','Jeans','Boots','Short_blowback','Male_Bushy',
       'Circle_Thick','Mustache_Horseshoe.001','Soul_Path_Thick.001','Chinstrap_Thick','Biker_Jeans'}
 CM_DATA={'Chinstrap_Thick'}  # modelled in centimetres, no unit scale on the object
 for o in list(bpy.data.objects):
  if o.type=='MESH' and o.name not in KEEP: bpy.data.objects.remove(o,do_unlink=True)  # rigs stay until baked: they carry the 0.01 unit scale
 bpy.ops.outliner.orphans_purge(do_local_ids=True,do_linked_ids=True,do_recursive=True)  # free the names of the removed duplicates
 for o in scene.objects:
  if o.name.endswith('.001'): o.name=o.name[:-4]
  o.data.name=o.name
 # Some parts are hidden or sit in excluded collections of the source file; the exporter skips those.
 for o in bpy.data.objects:
  if o.name not in scene.collection.objects: scene.collection.objects.link(o)
  o.hide_set(False); o.hide_viewport=False; o.hide_render=False
 body=bpy.data.objects['CC_Base_Body']
 male_rig=body.parent
 # Keep the rig's own transform (it carries the 0.01 unit scale) but start from the neutral pose.
 rig_matrix=male_rig.matrix_world.copy(); male_rig.animation_data_clear(); male_rig.matrix_world=rig_matrix
 for pb in male_rig.pose.bones: pb.location=(0,0,0); pb.rotation_mode='QUATERNION'; pb.rotation_quaternion=(1,0,0,0); pb.scale=(1,1,1)
 bpy.context.view_layer.update()
else:
 bpy.ops.object.select_all(action='SELECT'); bpy.ops.object.delete(use_global=False)
 bpy.ops.import_scene.fbx(filepath=str(opts.source/'Female_Leather_Suit.Fbx'))
 base_objs=set(scene.objects)
 rig=next(o for o in base_objs if o.type=='ARMATURE')
 # The FBX animates the rig object; keep its imported transform and the stored static pose, drop the clip.
 rig_matrix=rig.matrix_world.copy(); rig.animation_data_clear(); rig.matrix_world=rig_matrix
 for pb in rig.pose.bones: pb.location=(0,0,0); pb.rotation_mode='QUATERNION'; pb.rotation_quaternion=(1,0,0,0); pb.scale=(1,1,1)
 bpy.context.view_layer.update()
 body=next(o for o in base_objs if o.name=='CC_Base_Body')
 bpy.ops.import_scene.fbx(filepath=str(opts.source/'Amber.Fbx'))
 amber_names={o.name for o in set(scene.objects)-base_objs}
 KEEP_AMBER={'Jeans','Crop_T_Shirt','Punk_Leather_Jacket','Boots'}   # her brows are already painted on the skin texture: no second pair
 for name in amber_names-KEEP_AMBER:
  if bpy.data.objects[name].type=='MESH': bpy.data.objects.remove(bpy.data.objects[name],do_unlink=True)  # Amber's rig stays until baked: it carries the 0.01 unit scale
 amber_objs={bpy.data.objects[n] for n in amber_names&KEEP_AMBER}
 before=set(scene.objects)
 bpy.ops.import_scene.fbx(filepath=str(opts.source/'SKM_Hair.fbx'))
 skm_objs={o for o in set(scene.objects)-before if o.type=='MESH'}

# Amber is ~3% smaller than the base body; scale its garments to the base proportions.
FIT_SCALE=1.03
fit=Matrix.Translation((0,0,0.025-FIT_SCALE*0.015))@Matrix.Scale(FIT_SCALE,4)
# Every mesh is baked into world space with an identity transform.
def bake_to_world(obj,extra=Matrix.Identity(4)):
 obj.data.transform(extra@obj.matrix_world,shape_keys=True)
 obj.parent=None; obj.matrix_world=Matrix.Identity(4)
 obj.data.update()
for obj in list(scene.objects):
 if obj.type!='MESH': continue
 if MALE: extra=Matrix.Scale(.01,4) if obj.name in CM_DATA else Matrix.Identity(4)
 else: extra=fit if obj in amber_objs else Matrix.Identity(4)
 bake_to_world(obj,extra)
# Raw (rest) geometry only, so morph maths is exact. The male clothes and body keep their skinning until the arms are posed.
SKINNED={'CC_Base_Body','Plaid_Punk_Shirt','Jeans','Boots'}
for obj in list(scene.objects):
 if obj.type=='MESH' and ((MALE and obj.name not in SKINNED) or obj in amber_objs or obj in skm_objs):
  for mod in list(obj.modifiers): obj.modifiers.remove(mod)
body_zmax=max(v.co.z for v in body.data.vertices)
SF=body_zmax/1.709   # body scale relative to the female base, used by the body presets and face placement

# Refitted garments must not sink into the new body: push any vertex that lies
# inside the skin out to a small margin above the nearest body surface.
def push_out(obj,margin=.006,passes=3):
 bvh=BVHTree.FromPolygons([v.co.copy() for v in body.data.vertices],[tuple(p.vertices) for p in body.data.polygons])
 for _ in range(passes):
  for v in obj.data.vertices:
   hit=bvh.find_nearest(v.co)
   if hit[0] is None: continue
   loc,nrm=hit[0],hit[1]
   if (v.co-loc).dot(nrm)<margin: v.co=loc+nrm*margin
 obj.data.update()
for obj in amber_objs:
 push_out(obj)
if MALE:
 push_out(bpy.data.objects['Biker_Jeans'],margin=.004)   # modelled for a slightly different body: keep them outside the skin

# ---- Garments made for a different body: warp them from their own reference body onto ours ----
# The garment set ships with the nude body it was sculpted on. Both bodies are in a T-pose, so the garments can follow a smooth
# displacement field that maps the reference surface onto ours (arms and torso are treated separately so sleeves stay on the arms).
def repair_images(root):
 # Textures referenced by absolute paths on the author's disk are found again next to the source file.
 for img in bpy.data.images:
  if img.size[0]>0 or not img.name: continue
  base=re.sub(r'.d{3}$','',img.name)
  hit=next(root.rglob(base),None)
  if hit: img.filepath=str(hit); img.reload()
def smooth3(a,b,x):
 t=max(0.,min(1.,(x-a)/(b-a))); return t*t*(3-2*t)
def retarget_garments(blend,ref_name,parts,prefix,repair_root):
 import numpy as np
 with bpy.data.libraries.load(str(blend),link=False) as (src,dst):
  dst.objects=[n for n in [ref_name]+list(parts) if n in src.objects]
 objs={o.name:o for o in dst.objects if o}
 for o in objs.values():
  scene.collection.objects.link(o)
  for mod in list(o.modifiers): o.modifiers.remove(mod)
  o.parent=None
 repair_images(repair_root)
 ref=objs[ref_name]
 sp=[ref.matrix_world@v.co for v in ref.data.vertices]
 dp=[v.co.copy() for v in body.data.vertices]
 dbvh=BVHTree.FromPolygons(dp,[tuple(pl.vertices) for pl in body.data.polygons])
 def tip_angle(pts,side):
  tip=max(pts,key=lambda q:side*q.x); return math.atan2(1.42*SF-tip.z,side*(tip.x-side*.19)),tip
 delta=tip_angle(sp,1)[0]-tip_angle(dp,1)[0]   # how much lower the reference arms hang
 ref_min=min(q.z for q in sp); dst_min=min(q.z for q in dp)
 ratio=(max(q.z for q in dp)-dst_min)/(max(q.z for q in sp)-ref_min)
 def prep(pts):
  out=[]
  for q in pts:
   q=q.copy()
   for side in (1,-1):
    w=smooth3(.15,.27,side*q.x)
    if w<=0: continue
    c,sn=math.cos(delta*w*side),math.sin(delta*w*side); px,pz=side*.19,1.42*SF; dx,dz=q.x-px,q.z-pz
    q.x=px+dx*c+dz*sn; q.z=pz-dx*sn+dz*c
   out.append(Vector((q.x*ratio,q.y*ratio,(q.z-ref_min)*ratio+dst_min)))
  return out
 sp2=prep(sp); ARM_X=.21
 # Arms keep their tube shape: each point is carried along the arm's own axis (shoulder -> hand tip) onto ours, which also
 # stretches sleeves and cuffs to our longer arms. Everything else follows the smoothed surface-to-surface displacement below.
 def axis(pts,side):
  return Vector((side*.19,0,1.42*SF)),max(pts,key=lambda q:side*q.x)
 src_axes={sd:axis(sp2,sd) for sd in (1,-1)}; dst_axes={sd:axis(dp,sd) for sd in (1,-1)}
 def map_arm(q):
  sd=1 if q.x>0 else -1; ps,ts=src_axes[sd]; pd,td=dst_axes[sd]
  u=ts-ps; L=u.length; u.normalize(); t=(q-ps).dot(u)/L
  off=q-(ps+u*(t*L)); ud=td-pd; Ld=ud.length; ud.normalize()
  return pd+ud*(t*Ld)+u.rotation_difference(ud)@off
 # Legs get the same treatment (hip -> ankle axis), blended into the torso warp across the hips.
 def leg_axis(pts,side):
  def centre(z):
   sel=[q for q in pts if side*q.x>.02 and abs(q.z-z)<.02*SF and abs(q.x)<.3]
   return Vector((sum(q.x for q in sel)/len(sel),sum(q.y for q in sel)/len(sel),z))
  return centre(.82*SF),centre(.08*SF)
 src_legs={sd:leg_axis(sp2,sd) for sd in (1,-1)}; dst_legs={sd:leg_axis(dp,sd) for sd in (1,-1)}
 def map_leg(q):
  sd=1 if q.x>0 else -1; ps,ts=src_legs[sd]; pd,td=dst_legs[sd]
  u=ts-ps; L=u.length; u.normalize(); t=(q-ps).dot(u)/L
  off=q-(ps+u*(t*L)); ud=td-pd; Ld=ud.length; ud.normalize()
  return pd+ud*(t*Ld)+u.rotation_difference(ud)@off
 d0=[]
 for q in sp2:
  if abs(q.x)>ARM_X: d0.append(Vector())
  else:
   hit=dbvh.find_nearest(q); d0.append(hit[0]-q if hit[0] is not None else Vector())
 d=np.array([[v.x,v.y,v.z] for v in d0]); n=len(sp2); nbr=[[] for _ in range(n)]
 for e in ref.data.edges:
  a,b=e.vertices; nbr[a].append(b); nbr[b].append(a)
 for _ in range(25):
  nd=d.copy()
  for i in range(n):
   if nbr[i]: nd[i]=.5*d[i]+.5*d[nbr[i]].mean(axis=0)
  d=nd
 trees={}
 for cls in (True,False):
  ids=[i for i,q in enumerate(sp2) if (abs(q.x)>ARM_X)==cls]
  t=kdtree.KDTree(len(ids))
  for k,i in enumerate(ids): t.insert(sp2[i],k)
  t.balance(); trees[cls]=(t,ids)
 made=[]
 for name in parts:
  if name not in objs: continue
  g=objs[name]; gp=prep([g.matrix_world@v.co for v in g.data.vertices])
  for v,q in zip(g.data.vertices,gp):
   if abs(q.x)>ARM_X: v.co=map_arm(q); continue
   t,ids=trees[False]; near=t.find_n(q,6); ws=[1/(dist+1e-4) for _,_,dist in near]
   field=q+sum((Vector(d[ids[k]])*w for (_,k,_),w in zip(near,ws)),Vector())/sum(ws)
   if q.z<.86*SF and abs(q.x)>.005:
    v.co=map_leg(q).lerp(field,smooth3(.70*SF,.86*SF,q.z))
   else: v.co=field
  g.matrix_world=Matrix.Identity(4); g.vertex_groups.clear()
  g.name=prefix+name.split('_',1)[1] if '_' in name else prefix+name; g.data.name=g.name
  g.data.update(); made.append(g)
 bpy.data.objects.remove(ref,do_unlink=True)
 return made
if not MALE:
 BUNNY_BLEND=opts.source/'RyanReos_DeluxeBunnysuit/Blender/DeluxeBunnySuit.blend'
 bunny=retarget_garments(BUNNY_BLEND,'Primrose_Body_FullNude',['DeluxeBunnySuit_'+n for n in ('Leotard','Vest','Collar','Jacket','Gloves','Stockings','BunnyEars','Tail','Pads_Nipples','Pads_Vagina')],'Bunny_',opts.source/'RyanReos_DeluxeBunnysuit/Assets')
 # Skin-tight pieces are snapped onto our surface (plus a small offset); loose ones are only kept outside the skin.
 TIGHT={'Bunny_Stockings':.006,'Bunny_Leotard':.008,'Bunny_Vest':.010,'Bunny_Pads_Nipples':.012,'Bunny_Pads_Vagina':.010}
 for g in bunny:
  if g.name in TIGHT:
   bvh=BVHTree.FromPolygons([v.co.copy() for v in body.data.vertices],[tuple(pl.vertices) for pl in body.data.polygons])
   for v in g.data.vertices:
    hit=bvh.find_nearest(v.co)
    if hit[0] is not None: v.co=hit[0]+hit[1]*TIGHT[g.name]
   g.data.update()
  else: push_out(g,margin=.004)
 amber_objs |= set(bunny)

# ---- Loose garments sold as stand-alone meshes (kimono, baggy tee, streetwear set) ----
# They are heavy sculpts, so they are slimmed first, given one flat material each (recolourable in game) and kept outside the body.
LOOSE_STATIC=set()   # garments already modelled with the arms down: they skip the T-pose arm relaxation
def import_loose(path,name,unit,budget,color,cut=None,arms_down=False,grow=1.0):
 before=set(scene.objects)
 if str(path).lower().endswith('.obj'): bpy.ops.wm.obj_import(filepath=str(path))
 else: bpy.ops.import_scene.fbx(filepath=str(path))
 new=[o for o in set(scene.objects)-before if o.type=='MESH']
 bpy.ops.object.select_all(action='DESELECT')
 for o in new: o.select_set(True)
 bpy.context.view_layer.objects.active=new[0]
 if len(new)>1: bpy.ops.object.join()
 g=bpy.context.view_layer.objects.active
 for mod in list(g.modifiers): g.modifiers.remove(mod)
 g.data.transform(Matrix.Scale(unit,4)@g.matrix_world); g.matrix_world=Matrix.Identity(4)
 if cut:
  bm=bmesh.new(); bm.from_mesh(g.data)
  bmesh.ops.delete(bm,geom=[f for f in bm.faces if cut(f.calc_center_median())],context='FACES'); bm.to_mesh(g.data); bm.free()
 if len(g.data.vertices)>budget:
  dm=g.modifiers.new('slim','DECIMATE'); dm.ratio=budget/len(g.data.vertices); dm.use_collapse_triangulate=True; bpy.ops.object.modifier_apply(modifier=dm.name)
  sm=g.modifiers.new('smooth','CORRECTIVE_SMOOTH'); sm.iterations=6; sm.smooth_type='SIMPLE'; bpy.ops.object.modifier_apply(modifier=sm.name)
 g.data.materials.clear(); m=bpy.data.materials.new(name); m.use_nodes=True; m.diffuse_color=color; g.data.materials.append(m)
 if grow!=1.0:
  for v in g.data.vertices: v.co.x*=grow; v.co.y*=grow
 g.name=name; g.data.name=name; g.vertex_groups.clear()
 for v in g.data.uv_layers: pass
 push_out(g,margin=.006,passes=3)
 if arms_down: LOOSE_STATIC.add(g.name)
 return g
if not MALE:
 M=opts.source
 loose=[
  import_loose(M/'FBX/thin-unweld.fbx','Loose_Kimono',1,6500,(.11,.12,.24,1)),
  import_loose(M/'Baggy T.obj','Loose_BaggyTee',.01,8000,(.62,.64,.68,1),grow=1.07),
  import_loose(M/'卫衣内搭夹克外套工装裤套装_obj.obj','Loose_Streetwear',.001,16000,(.2,.22,.26,1),cut=lambda c:c.z>1.655 and abs(c.x)<.14,arms_down=True)]
 amber_objs |= set(loose)

# ---- Split the leather suit into a jacket and a skirt so they can be mixed with the tee and the jeans ----
if not MALE:
 SPLIT_Z=1.04
 src=bpy.data.objects['F_Black_Outfit_L']
 for part,upper in (('Suit_Jacket',True),('Suit_Skirt',False)):
  ob=src.copy(); ob.data=src.data.copy(); ob.name=part; ob.data.name=part; scene.collection.objects.link(ob)
  bm=bmesh.new(); bm.from_mesh(ob.data)
  bmesh.ops.delete(bm,geom=[f for f in bm.faces if (f.calc_center_median().z>=SPLIT_Z)!=upper],context='FACES')
  bm.to_mesh(ob.data); bm.free()
 bpy.data.objects.remove(src,do_unlink=True)

# ---- Extra long hair for the female character (textures live next to the FBX) ----
if not MALE:
 tex=opts.source/'Textures'
 hair_mat=bpy.data.materials.new('Hair_SKM_Transparency'); hair_mat.use_nodes=True
 for file,name in (('T_Hair_BaseColor.tga','Hair_SKM_Diffuse'),('T_Hair_Alpha.tga','Hair_SKM_Opacity')):
  img=bpy.data.images.load(str(tex/file)); img.name=name
  node=hair_mat.node_tree.nodes.new('ShaderNodeTexImage'); node.image=img
 for obj in skm_objs:
  obj.data.materials.clear(); obj.data.materials.append(hair_mat)

# ---- Relax the T-pose arms into a standing pose ---------------------------
# A weighted rotation about each shoulder, driven by the skin weights, moves the
# arms down before any morph is computed. Morph targets are rotated identically.
ARM=re.compile(r'CC_Base_([LR])_(Upperarm(Twist\d+)?|Forearm(Twist\d+)?|Hand|(Thumb|Index|Mid|Ring|Pinky)\d|ElbowShareBone)$')
ARM_DROP=.82 if MALE else .98
def smooth(a,b,x):
 t=max(0.,min(1.,(x-a)/(b-a))); return t*t*(3-2*t)
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
def shoulder(side):
 # Inner end of the upper arm: the arm vertices closest to the torso centre line.
 gid=body.vertex_groups['CC_Base_'+side+'_UpperarmTwist01'].index
 pts=[v.co for v in body.data.vertices if any(g.group==gid and g.weight>.6 for g in v.groups)]
 pts.sort(key=lambda p:abs(p.x)); inner=pts[:max(3,len(pts)//20)]
 return (sum(p.x for p in inner)/len(inner),sum(p.z for p in inner)/len(inner))
SHOULDER={'L':shoulder('L'),'R':shoulder('R')}
print('SHOULDER',SHOULDER)
def relax_arms(obj):
 # Loose garments follow the skin under them so sleeves and trouser legs never tear away from the arm.
 if obj.name in LOOSE_STATIC: return
 if obj.name.startswith('Loose_'):
  # Wide sleeves hang far from the arm, so swing them by how far out they are from the torso rather than by the nearest body vertex.
  weights=[{'L':1.0*smooth3(.15,.27,v.co.x)*smooth3(1.22,1.4,v.co.z) if v.co.x>0 else 0.,'R':1.0*smooth3(.15,.27,-v.co.x)*smooth3(1.22,1.4,v.co.z) if v.co.x<0 else 0.} for v in obj.data.vertices]
 else:
  weights=None
 if weights is not None: pass
 elif obj in amber_objs or obj.name in {'Plaid_Punk_Shirt','Jeans','Boots'}: weights=[body_weights[body_tree.find(v.co)[1]] for v in obj.data.vertices]
 else: weights=group_arm_weights(obj)
 if not any(w['L'] or w['R'] for w in weights): return
 def pose(co,w):
  co=co.copy()
  for side in 'LR':
   k=min(1.,w[side])
   if not k: continue
   px,pz=SHOULDER[side]
   if MALE:
    # Fade the rotation out toward the collar and chest so the shoulder line does not balloon.
    out=(co.x-px)*(1 if side=='L' else -1)
    k*=smooth(-.02,.06,out)*(1-smooth(.03,.11,co.z-pz))
    if not k: continue
   ang=ARM_DROP*k*(1 if side=='L' else -1)
   c,sn=math.cos(ang),math.sin(ang); dx,dz=co.x-px,co.z-pz
   co.x=px+dx*c+dz*sn; co.z=pz-dx*sn+dz*c
  return co
 blocks=[obj.data.shape_keys.key_blocks] if obj.data.shape_keys else []
 for i,v in enumerate(obj.data.vertices):
  v.co=pose(v.co,weights[i])
  for kb in blocks:
   for key in kb: key.data[i].co=pose(key.data[i].co,weights[i])
def evaluated_points(obj):
 ev=obj.evaluated_get(bpy.context.evaluated_depsgraph_get()); mesh=ev.to_mesh()
 pts=[v.co.copy() for v in mesh.vertices]; ev.to_mesh_clear(); return pts
def pose_with_rig():
 # The male shirt and jeans are weighted to his rig, so pose the real arm bones and let the artist weights deform the cloth.
 gid={side:body.vertex_groups['CC_Base_'+side+'_Hand'].index for side in 'LR'}
 for side,sign in (('L',1),('R',-1)):
  hand_ids=[v.index for v in body.data.vertices if any(g.group==gid[side] and g.weight>.5 for g in v.groups)]
  bone=male_rig.pose.bones['CC_Base_'+side+'_Upperarm']; bone.rotation_mode='QUATERNION'
  sx,sz=SHOULDER[side]
  def hand():
   bpy.context.view_layer.update(); pts=evaluated_points(body)
   return sum((pts[i] for i in hand_ids),Vector())/len(hand_ids)
  rest_hand=hand(); length=math.hypot(rest_hand.x-sx,rest_hand.z-sz)
  best=None
  for axis in ((1,0,0),(0,1,0),(0,0,1)):
   for k in range(-15,16):
    if k==0: continue
    bone.rotation_quaternion=Quaternion(axis,k*.1); h=hand()
    vx=(h.x-sx)*sign; vz=h.z-sz
    if vz>-.5*length: continue
    # Hanging down with a slight outward tilt, without swinging forward or back.
    score=abs(math.atan2(vx,-vz)-.22)+2*abs(h.y-rest_hand.y)/length
    if best is None or score<best[0]: best=(score,axis,k*.1)
  bone.rotation_quaternion=Quaternion(best[1],best[2]); print('ARM_POSE',side,best)
 bpy.context.view_layer.update()
 for name in SKINNED:
  obj=bpy.data.objects[name]; posed=evaluated_points(obj)
  blocks=list(obj.data.shape_keys.key_blocks) if obj.data.shape_keys else []
  for i,v in enumerate(obj.data.vertices):
   d=posed[i]-v.co
   v.co=posed[i]
   for key in blocks: key.data[i].co=key.data[i].co+d   # the same displacement carries every morph target
  for mod in list(obj.modifiers): obj.modifiers.remove(mod)
if MALE: pose_with_rig()
else:
 for obj in scene.objects:
  if obj.type=='MESH': relax_arms(obj)
for o in scene.objects:
 if o.type=='MESH': o.data.update()

# ---- Facial morph palette (names from both Character Creator profiles) ----------
SHAPES={
 'eyesWide':['Eye_Wide_L','Eye_Wide_R'], 'eyesNarrow':['Eye_Squint_L','Eye_Squint_R'],
 'browArch':['Brow_Raise_Outer_L','Brow_Raise_Outer_R'], 'browInner':['Brow_Raise_Inner_L','Brow_Raise_Inner_R'],
 'lipsFull':['Mouth_Roll_Out_Upper_L','Mouth_Roll_Out_Upper_R','Mouth_Roll_Out_Lower_L','Mouth_Roll_Out_Lower_R','Mouth_Top_Lip_Up','Mouth_Bottom_Lip_Down'],
 'lipsThin':['Mouth_Roll_In_Upper_L','Mouth_Roll_In_Upper_R','Mouth_Roll_In_Lower_L','Mouth_Roll_In_Lower_R','Mouth_Top_Lip_Under','Mouth_Bottom_Lip_Under'],
 'lipsWide':['Mouth_Stretch_L','Mouth_Stretch_R','Mouth_Widen'], 'lipsSmall':['Mouth_Pucker_Up_L','Mouth_Pucker_Up_R','Mouth_Pucker_Down_L','Mouth_Pucker_Down_R','Mouth_Pucker'],
 'noseWide':['Nose_Nostril_Dilate_L','Nose_Nostril_Dilate_R','Nose_Nostrils_Flare'], 'noseNarrow':['Nose_Nostril_In_L','Nose_Nostril_In_R','Nose_Scrunch'],
 'noseUp':['Nose_Tip_Up','Nose_Flanks_Raise'], 'noseDown':['Nose_Tip_Down'],
 'cheekHigh':['Cheek_Raise_L','Cheek_Raise_R'], 'cheekFull':['Cheek_Puff_L','Cheek_Puff_R','Cheek_Blow_L','Cheek_Blow_R'], 'cheekHollow':['Cheek_Suck_L','Cheek_Suck_R','Cheek_Suck'],
 'smile':['Mouth_Smile_L','Mouth_Smile_R'], 'mouthClose':['A37_Mouth_Close','Mouth_Lips_Tight'], 'blink':['Eye_Blink_L','Eye_Blink_R']}
remove={'CC_Base_TearLine','CC_Base_EyeOcclusion','CC_Base_Teeth','CC_Base_Tongue'}  # the mouth never opens in the editor
for obj in list(scene.objects):
 if obj.type not in {'MESH','ARMATURE'} or obj.name in remove: bpy.data.objects.remove(obj,do_unlink=True)

HAIR={'Hair_Base','Bang','Bun','Real_Hair','SKM_Hair_Bangs','SKM_Hair_Base_01','SKM_Hair_Base_02','Short_blowback','Circle_Thick','Mustache_Horseshoe','Soul_Path_Thick','Chinstrap_Thick'}  # alpha cards keep their topology
FITTED={'CC_Base_Body','Jeans','Crop_T_Shirt','Punk_Leather_Jacket','Boots','Suit_Jacket','Suit_Skirt','Punk_Strap_Boots','Bunny_Leotard','Bunny_Vest','Bunny_Collar','Bunny_Jacket','Bunny_Gloves','Bunny_Stockings','Bunny_Pads_Nipples','Bunny_Pads_Vagina','Bunny_Tail','Loose_Kimono','Loose_BaggyTee','Loose_Streetwear','Plaid_Punk_Shirt'}
BUDGET={'CC_Base_Body':11000,'Bunny_Jacket':3800,'Bunny_Vest':3300}
DEFAULT_BUDGET=3000
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
 budget=len(base) if (obj.name in HAIR) else BUDGET.get(obj.name,DEFAULT_BUDGET)
 if len(base)>budget:
  if obj.name=='CC_Base_Body':
   keep=obj.vertex_groups.new(name='HeadKeep')
   keep.add([v.index for v in obj.data.vertices if v.co.z>1.47*SF],1.0,'REPLACE')
  modifier=obj.modifiers.new('Game resolution','DECIMATE')
  modifier.ratio=budget/len(base)
  if obj.name=='CC_Base_Body': modifier.vertex_group='HeadKeep'; modifier.vertex_group_factor=12
  bpy.ops.object.modifier_apply(modifier=modifier.name)
  if 'HeadKeep' in obj.vertex_groups: obj.vertex_groups.remove(obj.vertex_groups['HeadKeep'])
 # One fixed body shape per character, baked into the body and every garment (no runtime morphs).
 # Noa: slim and cute. The source hips and glutes are very full, so pull them in (mostly front-to-back, which is where the
 # bulk sits) and ease the bust. Leo: lean and muscular (a light chest/shoulder build-up).
 if obj.name in FITTED or obj.name=='Biker_Jeans':
  # (centre height, spread, width change, depth change) per region; heights are relative to the body scale.
  regions=[(.92,.17,-.08,-.22),(1.16,.075,-.14,-.12),(1.30,.10,0,-.07)] if not MALE else [(1.30,.24,.075,.04)]
  for v in obj.data.vertices:
   z=v.co.z/SF; fade=max(0,min(1,(1.48-z)/.16))
   for centre,spread,width,depth in regions:
    weight=fade*math.exp(-((z-centre)/spread)**2)
    v.co.x*=1+width*weight; v.co.y*=1+depth*weight
 nearest=[tree.find(v.co)[1] for v in obj.data.vertices]
 if deltas:
  obj.shape_key_add(name='Basis')
  for name,delta in deltas.items():
   key=obj.shape_key_add(name=name)
   for i,v in enumerate(obj.data.vertices): key.data[i].co=v.co+delta[nearest[i]]
 obj['source']='Hassan+V1.blend' if MALE else ('Amber.Fbx' if obj in amber_objs else 'Female_Leather_Suit.Fbx')

# The body was simplified after the garments were fitted to it; keep every refitted garment outside the final surface.
for g in amber_objs:
 push_out(g,margin=.003,passes=2)
# Stockings hug the whole leg, so cut their triangles in half and snap them to the final surface: no skin can poke between vertices.
if not MALE and 'Bunny_Stockings' in bpy.data.objects:
 st=bpy.data.objects['Bunny_Stockings']
 bpy.context.view_layer.objects.active=st; bpy.ops.object.select_all(action='DESELECT'); st.select_set(True)
 bpy.ops.object.mode_set(mode='EDIT'); bpy.ops.mesh.select_all(action='SELECT'); bpy.ops.mesh.subdivide(number_cuts=1); bpy.ops.object.mode_set(mode='OBJECT')
 fbvh=BVHTree.FromPolygons([v.co.copy() for v in body.data.vertices],[tuple(pl.vertices) for pl in body.data.polygons])
 for v in st.data.vertices:
  hit=fbvh.find_nearest(v.co)
  if hit[0] is not None and (v.co-hit[0]).dot(hit[1])<.005: v.co=hit[0]+hit[1]*.005
 st.data.update()

# Face projection for procedural makeup, placed from this body's own eye position.
eye=bpy.data.objects['CC_Base_Eye']
eye_pts=[v.co for v in eye.data.vertices]
EYE_Z=sum(p.z for p in eye_pts)/len(eye_pts); EYE_Y=sum(p.y for p in eye_pts)/len(eye_pts)
FACE_W=.206*(1.06 if MALE else 1.0)
for obj in scene.objects:
 if obj.type!='MESH': continue
 uv=obj.data.uv_layers.new(name='FaceProjection')
 for loop in obj.data.loops:
  p=obj.data.vertices[loop.vertex_index].co
  uv.data[loop.index].uv=((p.x+FACE_W/2)/FACE_W,(p.z-(EYE_Z-.1095*(FACE_W/.206)))/FACE_W) if p.y<EYE_Y+.0195 else (-10,-10)
 for poly in obj.data.polygons: poly.use_smooth=True
 for color in list(obj.data.color_attributes): obj.data.color_attributes.remove(color)

# The source eyeballs sit deep behind the lids, which reads as sunken eyes; bring them forward about two millimetres.
for v in eye.data.vertices: v.co.y-=.0022
eye.data.update()
# ---- Materials: simplify and size textures for mobile delivery -------------
bpy.ops.outliner.orphans_purge(do_local_ids=True,do_linked_ids=True,do_recursive=True)
if MALE:
 # Canonical names the viewer matches on; beards get one tintable material each.
 for o in scene.objects:
  if o.type!='MESH': continue
  for slot in o.material_slots:
   m=slot.material
   if not m: continue
   if o.name in {'Circle_Thick','Mustache_Horseshoe','Soul_Path_Thick','Chinstrap_Thick'}: m.name='Beard_'+o.name
   elif m.name=='Male_Bushy': m.name='Brow_Male'
   elif m.name=='Male_Bushy_Base': m.name='Skin_BrowBase'
   else: m.name=re.sub(r'\.\d{3}$','',m.name)
def to_jpeg(img):
 import tempfile
 path=str(Path(tempfile.gettempdir())/('bt_'+re.sub(r'[^A-Za-z0-9]','_',img.name)+'.jpg'))
 img.file_format='JPEG'; img.filepath_raw=path; img.save()
 img.source='FILE'; img.reload(); img.pack()
for mat in bpy.data.materials:
 if not mat.use_nodes or mat.users==0: continue
 nodes=mat.node_tree.nodes
 images=[n.image for n in nodes if n.type=='TEX_IMAGE' and n.image and n.image.size[0]>0]
 diffuse=next((i for i in images if 'Diffuse' in i.name or 'BaseColor' in i.name or 'basecolor' in i.name.lower()),None)
 opacity=next((i for i in images if 'Opacity' in i.name or 'opacity' in i.name.lower()),None)
 CUTOUT=any(s in mat.name for s in ['Transparency','Eyelash','Scalp','Beard','Brow','Hair'])
 if not CUTOUT: opacity=None   # clothes are opaque: the opacity map would only force a heavy RGBA texture
 mat.use_backface_culling=False   # refitted garments can have faces that end up facing inward; never cull them
 nodes.clear(); out=nodes.new('ShaderNodeOutputMaterial'); bs=nodes.new('ShaderNodeBsdfPrincipled')
 mat.node_tree.links.new(bs.outputs['BSDF'],out.inputs['Surface']); bs.inputs['Roughness'].default_value=.7
 if mat.name.startswith('Loose_'): bs.inputs['Base Color'].default_value=tuple(mat.diffuse_color); bs.inputs['Roughness'].default_value=.75
 if mat.name=='Biker_Jeans': bs.inputs['Base Color'].default_value=(.02,.03,.06,1); bs.inputs['Roughness'].default_value=.8
 if diffuse:
  tex=nodes.new('ShaderNodeTexImage'); tex.image=diffuse
  mat.node_tree.links.new(tex.outputs['Color'],bs.inputs['Base Color'])
 if any(s in mat.name for s in ['Transparency','Eyelash','Scalp','Beard','Brow','Hair']):
  mat.surface_render_method='DITHERED'; mat.use_backface_culling=False
  if opacity:
   tex=nodes.new('ShaderNodeTexImage'); tex.image=opacity
   mat.node_tree.links.new(tex.outputs['Color'],bs.inputs['Alpha'])
 for img in images:
  limit=(1536 if MALE else 2048) if mat.name=='Std_Skin_Head' else 512 if re.search('Eye|Cornea|Beard|Scalp|Skin_BrowBase',mat.name) else 1024
  if img.size[0]>limit or img.size[1]>limit:
   factor=limit/max(img.size); img.scale(max(1,int(img.size[0]*factor)),max(1,int(img.size[1]*factor))); img.pack()
  if not opacity and img is diffuse and img.file_format!='JPEG':
   to_jpeg(img)  # opaque colour maps do not need an alpha channel
  if img.packed_file is None: img.pack()
# Transparent texels of hair cards are black in the source; bilinear filtering pulls that black into every strand edge.
# Fill them with the card's own average colour so a low alpha cutoff gives soft, colour-true edges.
 if CUTOUT and diffuse and opacity and tuple(diffuse.size)==tuple(opacity.size):
  import numpy as np
  n=diffuse.size[0]*diffuse.size[1]
  d=np.empty(n*4,dtype=np.float32); diffuse.pixels.foreach_get(d); d=d.reshape(-1,4)
  o=np.empty(n*4,dtype=np.float32); opacity.pixels.foreach_get(o); o=o.reshape(-1,4)[:,0]
  solid=o>.6
  if solid.any():
   d[o<.25,:3]=d[solid,:3].mean(axis=0)
   # Recolourable hair: keep only the light/dark pattern (neutral grey, mean 0.7) and let the game tint it with the chosen colour.
   luma=d[:,0]*.3+d[:,1]*.59+d[:,2]*.11
   luma=np.clip(luma*(0.7/max(luma[solid].mean(),1e-3)),0,1)
   d[:,0]=d[:,1]=d[:,2]=luma
   diffuse.pixels.foreach_set(d.ravel()); diffuse.update(); diffuse.pack()
# Purge everything the trimmed scene no longer uses.
bpy.ops.outliner.orphans_purge(do_local_ids=True,do_linked_ids=True,do_recursive=True)

for o in scene.objects:
 if o.type=='MESH': o.data.name=o.name   # glTF mesh names follow the object names
# Skinning was only needed to pose the arms; ship plain (un-skinned) morph meshes.
for obj in list(scene.objects):
 if obj.type=='MESH':
  for mod in list(obj.modifiers): obj.modifiers.remove(mod)
  obj.vertex_groups.clear()
 else: bpy.data.objects.remove(obj,do_unlink=True)
# Save an editable, self-contained project as well as the runtime asset.
(ROOT/'assets-src/characters/imported').mkdir(parents=True,exist_ok=True)
bpy.ops.file.pack_all()
bpy.ops.wm.save_as_mainfile(filepath=str(ROOT/('assets-src/characters/imported/bartender_male.blend' if MALE else 'assets-src/characters/imported/bartender.blend')))
bpy.ops.export_scene.gltf(filepath=str(OUT/GLB),export_format='GLB',export_animations=False,export_morph_normal=False,export_morph_tangent=False,export_try_sparse_sk=True,export_extras=True,export_image_format='AUTO',export_draco_mesh_compression_enable=True,export_draco_mesh_compression_level=6,export_draco_texcoord_quantization=16)
report={'source':'Hassan+V1.blend' if MALE else 'Female_Leather_Suit.Fbx + Amber.Fbx + SKM_Hair.fbx','asset':GLB,'bytes':(OUT/GLB).stat().st_size,'meshes':[{ 'name':o.name,'vertices':len(o.data.vertices),'morphs':[k.name for k in o.data.shape_keys.key_blocks][1:] if o.data.shape_keys else []} for o in scene.objects if o.type=='MESH']}
(ROOT/'assets-src/characters/imported'/('manifest-leo.json' if MALE else 'manifest.json')).write_text(json.dumps(report,indent=2))  # build report, not shipped
print('EXPORT_REPORT',json.dumps({'bytes':report['bytes'],'verts':{m['name']:m['vertices'] for m in report['meshes']}}))
