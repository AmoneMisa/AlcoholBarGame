"""Fit the supplied CLO men's jacket to Leo's relaxed pose in metres."""
import bpy
import bmesh
from mathutils import Matrix, Vector
from mathutils.bvhtree import BVHTree


def add_mens_jacket(source, body):
    bpy.ops.wm.obj_import(filepath=str(source/'Men Jacket/Jacket.obj'), forward_axis='NEGATIVE_Z', up_axis='Y')
    jacket=bpy.context.object
    jacket.name='Mens_Jacket'
    jacket.data.transform(Matrix.Scale(.01,4)@jacket.matrix_world)
    jacket.matrix_world=Matrix.Identity(4)
    # Reduce the original 160k-vertex garment before fitting. UV seams and the
    # material boundaries remain intact; details come from the original maps.
    decimate=jacket.modifiers.new('Mobile jacket','DECIMATE')
    decimate.ratio=12000/len(jacket.data.vertices)
    bpy.ops.object.modifier_apply(modifier=decimate.name)
    for v in jacket.data.vertices:
        q=v.co.copy(); side=1 if q.x>=0 else -1
        shoulder=Vector((side*.20,0,1.48))
        src_axis=Vector((side*.35,0,-.38))
        dst_axis=Vector((side*.13,-.015,-.50))
        rotation=src_axis.rotation_difference(dst_axis)
        arm=Vector((side*.22,0,1.48))+rotation@(q-shoulder)
        torso=Vector((q.x*1.10,q.y*1.12,q.z))
        t=max(0,min(1,(abs(q.x)-.16)/.13)); t=t*t*(3-2*t)
        v.co=torso.lerp(arm,t)
    for layer in (body,bpy.data.objects['Plaid_Punk_Shirt']):
        surface=BVHTree.FromPolygons([v.co.copy() for v in layer.data.vertices], [tuple(f.vertices) for f in layer.data.polygons])
        for v in jacket.data.vertices:
            point,normal,_,distance=surface.find_nearest(v.co)
            if point is not None and distance<.08 and (v.co-point).dot(normal)<.012:
                v.co=point+normal*.012
    textures=source/'Men Jacket/Texture'
    materials={}
    def material(kind):
        if kind in materials: return materials[kind]
        mat=bpy.data.materials.new('Cloth_Jacket_'+kind); mat.use_nodes=True
        bs=mat.node_tree.nodes.get('Principled BSDF')
        bs.inputs['Roughness'].default_value=.48 if kind=='Leather' else .8
        bs.inputs['Base Color'].default_value=(.035,.028,.024,1)
        if kind=='Metal':
            bs.inputs['Base Color'].default_value=(.3,.24,.12,1); bs.inputs['Metallic'].default_value=.75
        else:
            stem='Lambskin_Leather_FCL2PSL001_2_test2' if kind=='Leather' else 'Wool100_03'
            for suffix,label in [('COL','BaseColor'),('NRM','Normal')]:
                img=bpy.data.images.load(str(textures/(stem+'_'+suffix+'.jpg')),check_existing=True)
                img.name='Jacket_'+kind+'_'+label
                limit=512 if suffix=='COL' else 256
                img.scale(limit,limit)
                if suffix=='COL' and kind=='Leather':
                    import numpy as np
                    pixels=np.empty(limit*limit*4,dtype=np.float32); img.pixels.foreach_get(pixels)
                    pixels=pixels.reshape(-1,4); pixels[:,:3]*=.055
                    img.pixels.foreach_set(pixels.ravel()); img.update()
                img.pack()
                tex=mat.node_tree.nodes.new('ShaderNodeTexImage'); tex.image=img
                if suffix=='COL': mat.node_tree.links.new(tex.outputs['Color'],bs.inputs['Base Color'])
                else:
                    img.colorspace_settings.name='Non-Color'
                    normal=mat.node_tree.nodes.new('ShaderNodeNormalMap'); normal.inputs['Strength'].default_value=.6
                    mat.node_tree.links.new(tex.outputs['Color'],normal.inputs['Color'])
                    mat.node_tree.links.new(normal.outputs['Normal'],bs.inputs['Normal'])
        materials[kind]=mat
        return mat
    for slot in jacket.material_slots:
        name=slot.material.name if slot.material else ''
        kind='Leather' if ('Jacket' in name or 'Collar_FRONT' in name) and 'Under' not in name else 'Lining' if ('Wool' in name or 'Under' in name) else 'Metal'
        slot.material=material(kind)
    for face in jacket.data.polygons: face.use_smooth=True
    jacket.data.update()
    # Keep the original shirt collar and chest under the open jacket, without
    # drawing rolled sleeves that protrude through the jacket's long sleeves.
    shirt=bpy.data.objects['Plaid_Punk_Shirt']
    insert=shirt.copy(); insert.data=shirt.data.copy(); insert.name='Jacket_Shirt'
    bpy.context.scene.collection.objects.link(insert)
    bm=bmesh.new(); bm.from_mesh(insert.data)
    bmesh.ops.delete(bm,geom=[f for f in bm.faces if abs(f.calc_center_median().x)>.18 or f.calc_center_median().z<1.18],context='FACES')
    bm.to_mesh(insert.data); bm.free(); insert.data.update()
    return jacket
