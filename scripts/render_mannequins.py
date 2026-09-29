"""Render modular bartender display mannequins for the character customizer.

Run with Blender in background mode.  The generated atlas is deliberately a
neutral, featureless polymer base: hair, clothes, makeup and skin details live
in separate game layers.
"""

from __future__ import annotations

import math
import os
import sys
from pathlib import Path

import bpy
from mathutils import Vector


ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "public" / "assets" / "characters" / "bartender"
TMP = ROOT / ".codex-mannequin-renders"
FRAME_W = 548
FRAME_H = 957


def clear_scene() -> None:
    bpy.ops.object.select_all(action="SELECT")
    bpy.ops.object.delete(use_global=False)


def material(name: str, color: tuple[float, float, float, float], roughness: float = 0.42):
    mat = bpy.data.materials.new(name)
    mat.diffuse_color = color
    mat.use_nodes = True
    bsdf = mat.node_tree.nodes.get("Principled BSDF")
    bsdf.inputs["Base Color"].default_value = color
    bsdf.inputs["Roughness"].default_value = roughness
    bsdf.inputs["Specular IOR Level"].default_value = 0.28
    return mat


def ellipsoid(name: str, location, scale, mat, segments=40, rings=24):
    bpy.ops.mesh.primitive_uv_sphere_add(segments=segments, ring_count=rings, location=location)
    obj = bpy.context.object
    obj.name = name
    obj.scale = scale
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    for polygon in obj.data.polygons:
        polygon.use_smooth = True
    obj.data.materials.append(mat)
    return obj


def capsule(name: str, start, end, radius: float, mat, depth_scale=1.0):
    a, b = Vector(start), Vector(end)
    delta = b - a
    length = max(delta.length * depth_scale, radius * 2)
    midpoint = (a + b) / 2
    bpy.ops.mesh.primitive_cylinder_add(vertices=32, radius=radius, depth=length, location=midpoint)
    obj = bpy.context.object
    obj.name = name
    obj.rotation_mode = "QUATERNION"
    obj.rotation_quaternion = Vector((0, 0, 1)).rotation_difference(delta.normalized())
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    bevel = obj.modifiers.new("Soft mannequin joint", "BEVEL")
    bevel.width = radius * 0.48
    bevel.segments = 4
    for polygon in obj.data.polygons:
        polygon.use_smooth = True
    obj.data.materials.append(mat)
    return obj


def torso_mesh(name: str, sections, mat):
    """Create one continuous rounded torso from elliptical horizontal rings."""
    segments = 48
    vertices = []
    for z, half_width, half_depth in sections:
        for index in range(segments):
            angle = 2 * math.pi * index / segments
            vertices.append((math.cos(angle) * half_width, math.sin(angle) * half_depth, z))
    faces = []
    for ring in range(len(sections) - 1):
        for index in range(segments):
            nxt = (index + 1) % segments
            a = ring * segments + index
            b = ring * segments + nxt
            c = (ring + 1) * segments + nxt
            d = (ring + 1) * segments + index
            faces.append((a, b, c, d))
    faces.append(tuple(reversed(range(segments))))
    last = (len(sections) - 1) * segments
    faces.append(tuple(last + index for index in range(segments)))
    mesh = bpy.data.meshes.new(f"{name}-mesh")
    mesh.from_pydata(vertices, [], faces)
    mesh.update()
    obj = bpy.data.objects.new(name, mesh)
    bpy.context.collection.objects.link(obj)
    for polygon in mesh.polygons:
        polygon.use_smooth = True
    bevel = obj.modifiers.new("Continuous soft shell", "BEVEL")
    bevel.width = 0.11
    bevel.segments = 4
    obj.data.materials.append(mat)
    return obj


def hand(name: str, at, angle: float, mat, masculine: bool):
    obj = ellipsoid(name, at, (0.25 if masculine else 0.21, 0.14, 0.38), mat, 32, 18)
    obj.rotation_euler[1] = math.radians(angle)
    return obj


def foot(name: str, at, angle: float, mat, masculine: bool):
    obj = ellipsoid(name, at, (0.39 if masculine else 0.33, 0.62, 0.20), mat, 32, 18)
    obj.rotation_euler[2] = math.radians(angle)
    return obj


POSES = {
    "neutral": {
        "left_arm": [(-1.22, 0, 5.72), (-1.50, 0.02, 4.55), (-1.42, -0.02, 3.45)],
        "right_arm": [(1.22, 0, 5.72), (1.50, 0.02, 4.55), (1.42, -0.02, 3.45)],
        "left_leg": [(-0.58, 0, 3.45), (-0.62, 0.02, 1.85), (-0.68, 0, 0.35)],
        "right_leg": [(0.58, 0, 3.45), (0.62, 0.02, 1.85), (0.68, 0, 0.35)],
    },
    "confident": {
        "left_arm": [(-1.22, 0, 5.72), (-1.82, 0.02, 4.78), (-0.92, -0.12, 4.16)],
        "right_arm": [(1.22, 0, 5.72), (1.48, 0.02, 4.55), (1.38, -0.02, 3.44)],
        "left_leg": [(-0.58, 0, 3.45), (-0.72, 0.04, 1.88), (-0.86, 0.05, 0.35)],
        "right_leg": [(0.58, 0, 3.45), (0.48, -0.03, 1.86), (0.42, -0.10, 0.35)],
    },
    "working": {
        "left_arm": [(-1.22, 0, 5.72), (-1.55, -0.02, 4.88), (-0.56, -0.20, 5.18)],
        "right_arm": [(1.22, 0, 5.72), (1.55, -0.02, 4.88), (0.56, -0.20, 5.18)],
        "left_leg": [(-0.58, 0, 3.45), (-0.66, 0.02, 1.84), (-0.72, 0, 0.35)],
        "right_leg": [(0.58, 0, 3.45), (0.66, 0.02, 1.84), (0.72, 0, 0.35)],
    },
}


def build_mannequin(presentation: str, pose_name: str):
    masculine = presentation == "male"
    warm = (0.58, 0.31, 0.16, 1) if masculine else (0.64, 0.37, 0.21, 1)
    mat = material(f"{presentation}-polymer", warm)
    joint_mat = mat

    # Head and neck.  The shallow face plate reads as a store mannequin, not a portrait.
    ellipsoid("head", (0, -0.01, 6.84), (0.50 if masculine else 0.47, 0.41, 0.64), mat)
    capsule("neck", (0, 0, 6.02), (0, 0, 6.43), 0.28 if masculine else 0.24, mat)

    if masculine:
        torso_mesh("torso", [
            (6.04, .46, .31), (5.84, 1.08, .40), (5.56, 1.27, .49),
            (5.10, 1.16, .48), (4.67, .99, .43), (4.23, .88, .39),
            (3.91, .94, .43), (3.62, 1.03, .47), (3.42, .84, .42),
        ], mat)
        shoulder_radius, upper_arm, forearm = 0.35, 0.30, 0.255
        thigh, calf = 0.38, 0.29
    else:
        torso_mesh("torso", [
            (6.04, .39, .28), (5.82, .82, .34), (5.57, .97, .41),
            (5.12, .94, .44), (4.68, .77, .39), (4.24, .68, .35),
            (3.92, .82, .40), (3.62, 1.02, .47), (3.42, .82, .41),
        ], mat)
        shoulder_radius, upper_arm, forearm = 0.29, 0.255, 0.215
        thigh, calf = 0.35, 0.255

    pose = POSES[pose_name]
    for side in ("left", "right"):
        shoulder, elbow, wrist = pose[f"{side}_arm"]
        ellipsoid(f"{side}-shoulder", shoulder, (shoulder_radius, 0.34, shoulder_radius), joint_mat, 28, 16)
        capsule(f"{side}-upper-arm", shoulder, elbow, upper_arm, mat)
        ellipsoid(f"{side}-elbow", elbow, (forearm * 1.02, 0.25, forearm * 1.02), joint_mat, 28, 16)
        capsule(f"{side}-forearm", elbow, wrist, forearm, mat)
        hand(f"{side}-hand", wrist, -12 if side == "left" else 12, mat, masculine)

        hip, knee, ankle = pose[f"{side}_leg"]
        capsule(f"{side}-thigh", hip, knee, thigh, mat)
        ellipsoid(f"{side}-knee", knee, (calf * 1.05, 0.33, calf * 1.05), joint_mat, 28, 16)
        capsule(f"{side}-calf", knee, ankle, calf, mat)
        foot(f"{side}-foot", (ankle[0], -0.23, 0.14), -3 if side == "left" else 3, mat, masculine)


def look_at(obj, target=(0, 0, 3.75)):
    direction = Vector(target) - obj.location
    obj.rotation_euler = direction.to_track_quat("-Z", "Y").to_euler()


def setup_render(output: Path):
    scene = bpy.context.scene
    scene.render.engine = "BLENDER_EEVEE"
    scene.render.resolution_x = FRAME_W
    scene.render.resolution_y = FRAME_H
    scene.render.resolution_percentage = 100
    scene.render.image_settings.file_format = "PNG"
    scene.render.image_settings.color_mode = "RGBA"
    scene.render.film_transparent = True
    scene.render.filepath = str(output)
    scene.view_settings.look = "AgX - Medium High Contrast"

    world = bpy.data.worlds.new("Transparent World") if not bpy.data.worlds else bpy.data.worlds[0]
    scene.world = world
    world.use_nodes = True
    world.node_tree.nodes["Background"].inputs["Color"].default_value = (0.02, 0.015, 0.012, 1)
    world.node_tree.nodes["Background"].inputs["Strength"].default_value = 0.24

    bpy.ops.object.camera_add(location=(0, -16, 4.05))
    camera = bpy.context.object
    camera.data.type = "ORTHO"
    camera.data.ortho_scale = 8.05
    look_at(camera)
    scene.camera = camera

    def area(name, location, energy, size, color):
        bpy.ops.object.light_add(type="AREA", location=location)
        light = bpy.context.object
        light.name = name
        light.data.energy = energy
        light.data.shape = "DISK"
        light.data.size = size
        light.data.color = color
        look_at(light, (0, 0, 4.2))

    area("Key", (-4.2, -6, 8.0), 850, 4.0, (1.0, 0.72, 0.52))
    area("Fill", (4.5, -3.0, 5.5), 560, 3.0, (0.62, 0.76, 1.0))
    area("Rim", (0, 2.8, 7.0), 900, 3.0, (1.0, 0.50, 0.24))


def render_frame(presentation: str, pose_name: str, path: Path):
    clear_scene()
    build_mannequin(presentation, pose_name)
    setup_render(path)
    bpy.ops.render.render(write_still=True)


def combine_frames(presentation: str):
    # Pillow is available in the workspace runtime; importing it from Blender is
    # not guaranteed, so emit a tiny manifest for the companion combine step.
    manifest = TMP / f"{presentation}-frames.txt"
    manifest.write_text("\n".join(str(TMP / f"{presentation}-{pose}.png") for pose in POSES), encoding="utf-8")


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    TMP.mkdir(parents=True, exist_ok=True)
    for presentation in ("male", "female"):
        for pose_name in POSES:
            render_frame(presentation, pose_name, TMP / f"{presentation}-{pose_name}.png")
        combine_frames(presentation)


if __name__ == "__main__":
    main()
