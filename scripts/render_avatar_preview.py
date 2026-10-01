"""Render a source-material close-up for inspecting exported avatar art in Blender.

This is an art check, not a substitute for testing the runtime makeup shaders.
Run after export_bartender.py: blender -b --python scripts/render_avatar_preview.py -- female
"""
import sys
from pathlib import Path
import bpy
from mathutils import Vector

root=Path(__file__).resolve().parents[1]
male='male' in sys.argv[sys.argv.index('--')+1:] if '--' in sys.argv else False
bpy.ops.wm.open_mainfile(filepath=str(root/'assets-src/characters/imported'/('bartender_male.blend' if male else 'bartender.blend')))
keep={'CC_Base_Body','CC_Base_Eye','Jeans','Boots'}
keep |= {'Short_blowback','Male_Bushy','Chinstrap_Thick','Plaid_Punk_Shirt'} if male else {'Bun','Bang','Hair_Base','Real_Hair','Crop_T_Shirt','Punk_Leather_Jacket'}
if '--jacket' in sys.argv:
 keep.discard('Plaid_Punk_Shirt'); keep.update({'Mens_Jacket','Jacket_Shirt'})
for obj in bpy.context.scene.objects:
 obj.hide_render=obj.type=='MESH' and obj.name not in keep
 if obj.type=='MESH' and obj.data.shape_keys:
  for key in obj.data.shape_keys.key_blocks:
   key.value=1 if '--blink' in sys.argv and key.name=='blink' else .65 if '--round' in sys.argv and key.name=='eyesWide' else 0
for mat in bpy.data.materials:
 if not mat.use_nodes: continue
 bs=next((n for n in mat.node_tree.nodes if n.type=='BSDF_PRINCIPLED'),None)
 if not bs: continue
 if '--flat-materials' in sys.argv:
  for link in list(bs.inputs['Normal'].links): mat.node_tree.links.remove(link)
 if 'Brow_Base' in mat.name or mat.name=='Skin_BrowBase':
  bs.inputs['Alpha'].default_value=0
  for link in list(bs.inputs['Alpha'].links): mat.node_tree.links.remove(link)
 if any(part in mat.name for part in ['Hair','Scalp','Brow','Beard']):
  socket=bs.inputs['Base Color']
  if socket.links:
   source=socket.links[0].from_socket
   mix=mat.node_tree.nodes.new('ShaderNodeMixRGB'); mix.blend_type='MULTIPLY'; mix.inputs[0].default_value=1
   mix.inputs[2].default_value=(.11,.065,.04,1)
   mat.node_tree.links.new(source,mix.inputs[1]); mat.node_tree.links.new(mix.outputs[0],socket)
scene=bpy.context.scene
scene.render.engine='CYCLES'; scene.cycles.samples=24; scene.cycles.use_denoising=True
scene.render.resolution_x=600; scene.render.resolution_y=700; scene.render.resolution_percentage=100
scene.world=bpy.data.worlds.new('Preview world'); scene.world.use_nodes=True
scene.world.node_tree.nodes['Background'].inputs[0].default_value=(.16,.18,.23,1)
scene.world.node_tree.nodes['Background'].inputs[1].default_value=.35
z=1.655 if male else 1.58
def aim(obj,target): obj.rotation_euler=(Vector(target)-obj.location).to_track_quat('-Z','Y').to_euler()
bpy.ops.object.camera_add(location=(.12,-2.2,z+.04)); camera=bpy.context.object
camera.data.type='ORTHO'; camera.data.ortho_scale=.48; aim(camera,(0,0,z)); scene.camera=camera
if '--full' in sys.argv:
 camera.location=(.3,-3,1.15); camera.data.ortho_scale=2.05; aim(camera,(0,0,.93))
for location,power,size in [((-1,-2,3),160,2),((1,-1,2),80,2),((1,1,2.5),120,1.5)]:
 bpy.ops.object.light_add(type='AREA',location=location); light=bpy.context.object
 light.data.energy=power; light.data.shape='DISK'; light.data.size=size; aim(light,(0,0,z))
scene.view_settings.view_transform='AgX'
out=root/'docs/screenshots'/('avatar-leo-source.png' if male else 'avatar-noa-source.png')
if '--blink' in sys.argv: out=out.with_stem(out.stem+'-blink')
elif '--round' in sys.argv: out=out.with_stem(out.stem+'-round')
if '--jacket' in sys.argv: out=out.with_stem(out.stem+'-jacket')
scene.render.filepath=str(out); bpy.ops.render.render(write_still=True)
