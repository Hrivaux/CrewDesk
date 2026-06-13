import math
from pathlib import Path

import bpy
from mathutils import Vector

ROOT = Path(__file__).resolve().parents[1]
MODEL_DIR = ROOT / "public" / "assets" / "models"
AGENT_DIR = MODEL_DIR / "agents"
SOURCE_DIR = MODEL_DIR / "source"


def ensure_dirs():
    MODEL_DIR.mkdir(parents=True, exist_ok=True)
    AGENT_DIR.mkdir(parents=True, exist_ok=True)
    SOURCE_DIR.mkdir(parents=True, exist_ok=True)


def clear_scene():
    bpy.ops.object.select_all(action="SELECT")
    bpy.ops.object.delete()
    bpy.context.scene.render.engine = "CYCLES"
    bpy.context.scene.cycles.samples = 64
    bpy.context.scene.view_settings.view_transform = "Filmic"
    bpy.context.scene.view_settings.look = "Medium High Contrast"
    bpy.context.scene.world.color = (0.93, 0.96, 1.0)


def material(name, color, roughness=0.55, metallic=0.0, alpha=1.0, emission=None, strength=0.0):
    mat = bpy.data.materials.new(name)
    mat.use_nodes = True
    bsdf = mat.node_tree.nodes.get("Principled BSDF")
    if bsdf:
        bsdf.inputs["Base Color"].default_value = color
        bsdf.inputs["Roughness"].default_value = roughness
        bsdf.inputs["Metallic"].default_value = metallic
        bsdf.inputs["Alpha"].default_value = alpha
        if emission:
            bsdf.inputs["Emission Color"].default_value = emission
            bsdf.inputs["Emission Strength"].default_value = strength
    mat.blend_method = "BLEND" if alpha < 1 else "OPAQUE"
    mat.use_screen_refraction = alpha < 1
    return mat


MATS = {}


def build_materials():
    MATS.update(
        floor=material("warm white terrazzo floor", (0.94, 0.97, 0.99, 1), 0.66),
        floor_edge=material("soft grey beveled slab", (0.62, 0.68, 0.74, 1), 0.74),
        corridor=material("matte circulation path", (0.86, 0.92, 0.97, 1), 0.62),
        corridor_line=material("embedded path guide", (0.45, 0.62, 0.76, 1), 0.5),
        glass=material("blue tinted glass", (0.72, 0.92, 1.0, 0.28), 0.08, 0.0, 0.28),
        aluminium=material("brushed aluminium", (0.76, 0.81, 0.86, 1), 0.34, 0.25),
        dark=material("dark graphite UI", (0.012, 0.026, 0.052, 1), 0.42, 0.06),
        walnut=material("warm walnut desk", (0.63, 0.38, 0.18, 1), 0.52),
        walnut_dark=material("dark walnut underside", (0.34, 0.2, 0.1, 1), 0.58),
        white=material("soft white casing", (0.96, 0.98, 1.0, 1), 0.46),
        cyan=material("cyan emissive data", (0.1, 0.82, 0.94, 1), 0.38, 0.0, 1, (0.1, 0.82, 0.94, 1), 1.4),
        green=material("green status glow", (0.13, 0.77, 0.35, 1), 0.38, 0.0, 1, (0.13, 0.77, 0.35, 1), 1.2),
        orange=material("orange review glow", (0.98, 0.45, 0.1, 1), 0.4, 0.0, 1, (0.98, 0.45, 0.1, 1), 1.2),
        violet=material("violet planning glow", (0.54, 0.36, 0.96, 1), 0.4, 0.0, 1, (0.54, 0.36, 0.96, 1), 1.2),
        yellow=material("yellow deploy glow", (0.92, 0.7, 0.05, 1), 0.4, 0.0, 1, (0.92, 0.7, 0.05, 1), 1.2),
        red=material("human approval red", (0.96, 0.3, 0.42, 1), 0.4, 0.0, 1, (0.96, 0.3, 0.42, 1), 1.4),
    )


def bevelled_cube(name, loc, scale, mat, bevel=0.04, shade=False):
    bpy.ops.mesh.primitive_cube_add(size=1, location=loc)
    obj = bpy.context.object
    obj.name = name
    obj.dimensions = scale
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    if mat:
        obj.data.materials.append(mat)
    if bevel:
        mod = obj.modifiers.new(f"{name}_soft_edges", "BEVEL")
        mod.width = bevel
        mod.segments = 5
        obj.modifiers.new(f"{name}_weighted_normals", "WEIGHTED_NORMAL")
    if shade:
        for poly in obj.data.polygons:
            poly.use_smooth = True
    return obj


def cylinder(name, loc, radius, depth, mat, vertices=48, rotation=(0, 0, 0)):
    bpy.ops.mesh.primitive_cylinder_add(vertices=vertices, radius=radius, depth=depth, location=loc, rotation=rotation)
    obj = bpy.context.object
    obj.name = name
    if mat:
        obj.data.materials.append(mat)
    for poly in obj.data.polygons:
        poly.use_smooth = True
    obj.modifiers.new(f"{name}_weighted_normals", "WEIGHTED_NORMAL")
    return obj


def sphere(name, loc, radius, mat, scale=(1, 1, 1)):
    bpy.ops.mesh.primitive_uv_sphere_add(segments=48, ring_count=24, radius=radius, location=loc)
    obj = bpy.context.object
    obj.name = name
    obj.scale = scale
    if mat:
        obj.data.materials.append(mat)
    for poly in obj.data.polygons:
        poly.use_smooth = True
    return obj


def curve_pipe(name, points, mat, bevel_depth=0.018):
    curve = bpy.data.curves.new(name, "CURVE")
    curve.dimensions = "3D"
    curve.resolution_u = 16
    curve.bevel_depth = bevel_depth
    curve.bevel_resolution = 4
    spline = curve.splines.new("POLY")
    spline.points.add(len(points) - 1)
    for point, co in zip(spline.points, points):
        point.co = (co[0], co[1], co[2], 1)
    obj = bpy.data.objects.new(name, curve)
    bpy.context.collection.objects.link(obj)
    obj.data.materials.append(mat)
    return obj


def add_text(name, text, loc, size, mat, rot=(math.radians(68), 0, 0)):
    bpy.ops.object.text_add(location=loc, rotation=rot)
    obj = bpy.context.object
    obj.name = name
    obj.data.body = text
    obj.data.align_x = "CENTER"
    obj.data.align_y = "CENTER"
    obj.data.size = size
    obj.data.extrude = 0.004
    obj.data.materials.append(mat)
    return obj


def monitor(name, loc, rot_z, accent, wide=1.0):
    frame = bevelled_cube(f"{name}_frame", loc, (0.95 * wide, 0.08, 0.56), MATS["white"], 0.035)
    frame.rotation_euler = (math.radians(68), 0, rot_z)
    screen = bevelled_cube(f"{name}_screen", (loc[0], loc[1] - 0.025, loc[2] + 0.012), (0.78 * wide, 0.035, 0.4), MATS["dark"], 0.018)
    screen.rotation_euler = frame.rotation_euler
    for i in range(5):
        bar = bevelled_cube(
            f"{name}_data_bar_{i}",
            (loc[0] - 0.18 * wide + 0.035 * i, loc[1] - 0.05, loc[2] + 0.13 - i * 0.065),
            (0.42 * wide - 0.045 * i, 0.018, 0.018),
            accent if i % 2 == 0 else MATS["orange"],
            0.004,
        )
        bar.rotation_euler = frame.rotation_euler
    stand = bevelled_cube(f"{name}_stand", (loc[0], loc[1], loc[2] - 0.42), (0.1, 0.12, 0.42), MATS["aluminium"], 0.025)
    stand.rotation_euler.z = rot_z
    base = bevelled_cube(f"{name}_base", (loc[0], loc[1], loc[2] - 0.66), (0.46, 0.26, 0.06), MATS["aluminium"], 0.03)
    base.rotation_euler.z = rot_z


def desk_cluster(name, loc, rot_z, accent, seats=2):
    top = bevelled_cube(f"{name}_desk_top", loc, (1.55, 0.82, 0.16), MATS["walnut"], 0.07)
    top.rotation_euler.z = rot_z
    body = bevelled_cube(f"{name}_desk_body", (loc[0], loc[1], loc[2] - 0.18), (1.34, 0.66, 0.26), MATS["walnut_dark"], 0.045)
    body.rotation_euler.z = rot_z
    for offset in [-0.36, 0.34][:seats]:
        monitor(f"{name}_monitor_{offset}", (loc[0] + offset * math.cos(rot_z), loc[1] + offset * math.sin(rot_z), loc[2] + 0.55), rot_z, accent, 0.78)
        keyboard = bevelled_cube(f"{name}_keyboard_{offset}", (loc[0] + offset * math.cos(rot_z), loc[1] + offset * math.sin(rot_z), loc[2] + 0.14), (0.44, 0.16, 0.025), MATS["white"], 0.018)
        keyboard.rotation_euler.z = rot_z
    for sx in [-0.58, 0.58]:
        for sy in [-0.28, 0.28]:
            leg = cylinder(f"{name}_leg_{sx}_{sy}", (loc[0] + sx, loc[1] + sy, loc[2] - 0.44), 0.035, 0.52, MATS["aluminium"], 18)
            leg.rotation_euler.z = rot_z


def plugin_kiosk(name, loc, accent, tall=False):
    bevelled_cube(f"{name}_base_plinth", (loc[0], loc[1], loc[2]), (0.58, 0.46, 0.12), MATS["white"], 0.06)
    tower = bevelled_cube(f"{name}_device_body", (loc[0], loc[1], loc[2] + (0.42 if tall else 0.34)), (0.36, 0.18, 0.72 if tall else 0.52), MATS["dark"], 0.035)
    face = bevelled_cube(f"{name}_lit_face", (loc[0], loc[1] - 0.095, loc[2] + (0.43 if tall else 0.34)), (0.24, 0.022, 0.44 if tall else 0.32), MATS["white"], 0.018)
    for i in range(3):
        bar = bevelled_cube(f"{name}_status_line_{i}", (loc[0], loc[1] - 0.112, loc[2] + (0.52 if tall else 0.41) - i * 0.1), (0.16 - i * 0.025, 0.016, 0.018), accent, 0.004)
    ring = cylinder(f"{name}_ground_ring", (loc[0], loc[1], loc[2] + 0.02), 0.34, 0.012, accent, 64)
    ring.scale.z = 0.05


def create_scene():
    ensure_dirs()
    clear_scene()
    build_materials()

    bevelled_cube("single_piece_open_space_floor", (0, 0, -0.09), (9.8, 6.4, 0.18), MATS["floor"], 0.18)
    bevelled_cube("thick_shadowed_slab_edge", (0, 0, -0.27), (9.9, 6.5, 0.24), MATS["floor_edge"], 0.2)
    bevelled_cube("main_circulation_lane", (0, 0.45, 0.015), (8.65, 0.82, 0.035), MATS["corridor"], 0.08)
    bevelled_cube("cross_circulation_lane", (0.1, 0, 0.02), (0.84, 5.25, 0.04), MATS["corridor"], 0.08)
    curve_pipe("blue_floor_route_line", [(-4.0, 0.45, 0.08), (-1.2, 0.45, 0.08), (0.1, 0.45, 0.08), (3.75, 0.45, 0.08)], MATS["cyan"], 0.012)
    curve_pipe("yellow_floor_route_line", [(-3.7, 1.65, 0.09), (-3.0, 0.45, 0.09), (0.1, 0.45, 0.09), (2.8, 0.45, 0.09)], MATS["yellow"], 0.012)

    zone_specs = [
        ("planning_zone_plate", (-2.75, -1.15, 0.02), (2.25, 1.28, 0.035), MATS["violet"]),
        ("coding_zone_plate", (-0.35, -1.1, 0.025), (2.25, 1.24, 0.035), MATS["cyan"]),
        ("review_zone_plate", (2.35, -1.18, 0.025), (1.95, 1.24, 0.035), MATS["orange"]),
        ("qa_zone_plate", (1.75, 1.58, 0.025), (1.98, 1.28, 0.035), MATS["green"]),
        ("deploy_zone_plate", (-2.7, 1.58, 0.025), (2.14, 1.28, 0.035), MATS["yellow"]),
    ]
    for name, loc, scale, mat in zone_specs:
        obj = bevelled_cube(name, loc, scale, mat, 0.08)
        obj.active_material.diffuse_color = (*mat.diffuse_color[:3], 0.18)

    bevelled_cube("back_glass_wall", (0, -3.1, 0.9), (9.1, 0.06, 1.8), MATS["glass"], 0.02)
    bevelled_cube("left_glass_wall", (-4.6, -0.05, 0.9), (0.06, 5.95, 1.8), MATS["glass"], 0.02)
    bevelled_cube("right_glass_partition", (4.35, -0.8, 0.7), (0.06, 3.4, 1.35), MATS["glass"], 0.02)
    for x in [-3.6, -2.0, -0.4, 1.2, 2.8, 4.1]:
        bevelled_cube(f"back_wall_mullion_{x}", (x, -3.05, 0.9), (0.045, 0.08, 1.9), MATS["white"], 0.01)
    for y in [-2.3, -0.9, 0.5, 1.9]:
        bevelled_cube(f"left_wall_mullion_{y}", (-4.55, y, 0.9), (0.09, 0.045, 1.9), MATS["white"], 0.01)

    desk_cluster("planning_orchestration_island", (-2.75, -1.15, 0.42), 0.0, MATS["violet"])
    desk_cluster("coding_pair_island", (-0.35, -1.1, 0.42), 0.0, MATS["cyan"])
    desk_cluster("review_pr_island", (2.35, -1.18, 0.42), 0.0, MATS["orange"], seats=1)
    desk_cluster("qa_research_island", (1.75, 1.58, 0.42), math.pi, MATS["green"], seats=1)
    desk_cluster("deploy_ops_island", (-2.7, 1.58, 0.42), math.pi, MATS["yellow"], seats=1)

    monitor("planning_timeline_wall", (-2.75, -2.88, 1.28), 0, MATS["violet"], 1.35)
    monitor("github_code_wall", (-0.35, -2.88, 1.28), 0, MATS["cyan"], 1.2)
    monitor("review_pr_wall", (2.35, -2.88, 1.28), 0, MATS["orange"], 1.2)
    monitor("qa_validation_wall", (3.86, 1.28, 1.08), math.radians(90), MATS["green"], 1.0)

    plugin_kiosk("github_plugin_station", (-0.92, -2.22, 0.08), MATS["cyan"])
    plugin_kiosk("figma_plugin_station", (-3.65, -2.22, 0.08), MATS["violet"])
    plugin_kiosk("linear_plugin_station", (-2.06, -2.22, 0.08), MATS["yellow"])
    plugin_kiosk("slack_plugin_station", (3.58, -1.58, 0.08), MATS["green"])
    plugin_kiosk("browser_plugin_station", (3.72, 0.2, 0.08), MATS["cyan"], True)
    plugin_kiosk("calendar_plugin_station", (-4.0, -1.25, 0.08), MATS["orange"])
    plugin_kiosk("memory_plugin_station", (-4.0, 0.75, 0.08), MATS["cyan"], True)

    bevelled_cube("security_gate_left", (2.38, 0.9, 0.55), (0.18, 0.2, 1.1), MATS["white"], 0.05)
    bevelled_cube("security_gate_right", (3.06, 0.9, 0.55), (0.18, 0.2, 1.1), MATS["white"], 0.05)
    bevelled_cube("security_gate_emissive_bar", (2.72, 0.9, 1.02), (0.72, 0.05, 0.06), MATS["red"], 0.025)

    cylinder("memory_vault_core", (-3.85, -0.18, 0.52), 0.42, 0.86, MATS["dark"], 64)
    cylinder("memory_vault_glass_cap", (-3.85, -0.18, 1.0), 0.52, 0.055, MATS["cyan"], 64)
    for i, angle in enumerate([0, 1.9, 3.8]):
        sphere(f"memory_card_orb_{i}", (-3.85 + math.cos(angle) * 0.72, -0.18 + math.sin(angle) * 0.42, 0.8), 0.08, MATS["white"], (1, 0.45, 0.7))

    curve_pipe("planning_memory_cable", [(-2.75, -0.5, 0.1), (-3.2, 0.15, 0.12), (-3.85, -0.18, 0.12)], MATS["violet"], 0.015)
    curve_pipe("coding_github_cable", [(-0.35, -0.5, 0.1), (-0.55, -1.5, 0.12), (-0.92, -2.05, 0.12)], MATS["cyan"], 0.015)
    curve_pipe("qa_browser_cable", [(1.75, 0.95, 0.1), (2.8, 0.58, 0.12), (3.72, 0.2, 0.12)], MATS["green"], 0.015)
    curve_pipe("deploy_security_cable", [(-2.7, 0.95, 0.1), (0.1, 0.45, 0.12), (2.72, 0.9, 0.12)], MATS["yellow"], 0.015)

    add_text("floor_label_planning", "PLANNING", (-2.75, -0.5, 0.08), 0.18, MATS["violet"])
    add_text("floor_label_code", "CODE", (-0.35, -0.48, 0.08), 0.18, MATS["cyan"])
    add_text("floor_label_review", "REVIEW", (2.35, -0.52, 0.08), 0.16, MATS["orange"])
    add_text("floor_label_deploy", "DEPLOY", (-2.7, 0.98, 0.08), 0.16, MATS["yellow"])
    add_text("floor_label_qa", "QA", (1.75, 0.98, 0.08), 0.18, MATS["green"])

    bpy.ops.object.light_add(type="AREA", location=(0, -2, 5.5))
    light = bpy.context.object
    light.name = "large_softbox_reflection"
    light.data.energy = 450
    light.data.size = 5.0
    bpy.ops.object.camera_add(location=(6.6, -6.7, 5.2), rotation=(math.radians(60), 0, math.radians(43)))
    bpy.context.scene.camera = bpy.context.object


def create_agent(agent_id, color, accent, shape):
    clear_scene()
    build_materials()
    body_mat = material(f"{agent_id}_body_material", color, 0.34, 0.16)
    accent_mat = material(f"{agent_id}_accent_material", accent, 0.32, 0.0, 1.0, accent, 1.5)
    dark = MATS["dark"]

    if shape == "orchestrator":
        sphere("atlas_core_body", (0, 0, 0.58), 0.34, body_mat, (0.86, 0.86, 1.22))
        cylinder("atlas_head_band", (0, 0, 1.04), 0.28, 0.16, body_mat, 48)
        cylinder("atlas_halo_ring", (0, 0, 1.24), 0.46, 0.025, accent_mat, 72, rotation=(math.radians(90), 0, 0))
    elif shape == "builder":
        sphere("pixel_rounded_body", (0, 0, 0.55), 0.33, body_mat, (0.9, 0.78, 1.12))
        bevelled_cube("pixel_tool_pack", (-0.28, 0.04, 0.62), (0.16, 0.16, 0.48), accent_mat, 0.05)
        cylinder("pixel_stylus_arm", (0.38, 0, 0.6), 0.04, 0.55, body_mat, 18, rotation=(0.2, 0.1, 0.35))
    elif shape == "developer":
        bevelled_cube("forge_armored_body", (0, 0, 0.55), (0.58, 0.44, 0.72), body_mat, 0.16)
        sphere("forge_head", (0, 0, 1.03), 0.28, body_mat, (1, 0.82, 0.9))
        bevelled_cube("forge_backpack", (0, 0.26, 0.64), (0.38, 0.14, 0.54), accent_mat, 0.06)
    elif shape == "qa":
        sphere("sonar_tall_body", (0, 0, 0.62), 0.3, body_mat, (0.78, 0.78, 1.38))
        sphere("sonar_head", (0, 0, 1.14), 0.22, body_mat, (1, 0.82, 0.9))
        cylinder("sonar_antenna", (0.0, 0, 1.48), 0.025, 0.42, accent_mat, 16)
        sphere("sonar_probe_light", (0, 0, 1.74), 0.07, accent_mat)
    else:
        sphere("vega_body", (0, 0, 0.56), 0.34, body_mat, (1.0, 0.82, 1.08))
        bevelled_cube("vega_release_pack", (0, 0.28, 0.64), (0.44, 0.16, 0.48), accent_mat, 0.08)
        cylinder("vega_status_crown", (0, 0, 1.06), 0.31, 0.08, accent_mat, 48)

    bevelled_cube(f"{agent_id}_visor", (0, -0.25, 0.94), (0.36, 0.05, 0.1), dark, 0.025)
    bevelled_cube(f"{agent_id}_visor_glow", (0, -0.282, 0.94), (0.22, 0.018, 0.03), accent_mat, 0.006)
    cylinder(f"{agent_id}_left_arm", (-0.36, 0, 0.55), 0.055, 0.42, body_mat, 20, rotation=(0.25, 0, -0.25))
    cylinder(f"{agent_id}_right_arm", (0.36, 0, 0.55), 0.055, 0.42, body_mat, 20, rotation=(0.25, 0, 0.25))
    sphere(f"{agent_id}_status_beacon", (0.28, -0.1, 1.25), 0.055, accent_mat)
    cylinder(f"{agent_id}_soft_shadow_disc", (0, 0, 0.02), 0.4, 0.01, material(f"{agent_id}_shadow", (0.02, 0.04, 0.08, 0.22), 0.8, 0, 0.22), 64)

    bpy.ops.wm.save_as_mainfile(filepath=str(SOURCE_DIR / f"{agent_id}.blend"))
    bpy.ops.export_scene.gltf(filepath=str(AGENT_DIR / f"{agent_id}.glb"), export_format="GLB", export_apply=True)


ensure_dirs()
create_scene()
bpy.ops.wm.save_as_mainfile(filepath=str(SOURCE_DIR / "crewdesk-scene.blend"))
bpy.ops.export_scene.gltf(filepath=str(MODEL_DIR / "crewdesk-scene.glb"), export_format="GLB", export_apply=True)

agents = [
    ("atlas", (0.1, 0.82, 0.94, 1), (0.1, 0.82, 0.94, 1), "orchestrator"),
    ("pixel", (0.98, 0.45, 0.1, 1), (0.54, 0.36, 0.96, 1), "builder"),
    ("forge", (0.36, 0.58, 0.92, 1), (0.1, 0.82, 0.94, 1), "developer"),
    ("sonar", (0.13, 0.77, 0.35, 1), (0.1, 0.82, 0.94, 1), "qa"),
    ("vega", (0.92, 0.7, 0.05, 1), (0.96, 0.3, 0.42, 1), "deploy"),
]
for agent in agents:
    create_agent(*agent)

print("Built Blender source files and GLB exports.")
