import math
from pathlib import Path

import bpy

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
    bpy.context.scene.cycles.samples = 96
    bpy.context.scene.view_settings.view_transform = "Filmic"
    bpy.context.scene.view_settings.look = "Medium High Contrast"
    bpy.context.scene.world.color = (0.94, 0.97, 1.0)


def material(name, color, roughness=0.5, metallic=0.0, alpha=1.0, emission=None, strength=0.0):
    mat = bpy.data.materials.new(name)
    mat.diffuse_color = color
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
    MATS.clear()
    MATS.update(
        floor=material("porcelain white floor", (0.965, 0.982, 1.0, 1), 0.58),
        floor_edge=material("soft beveled porcelain edge", (0.78, 0.84, 0.9, 1), 0.62),
        floor_shadow=material("cool underside shadow", (0.55, 0.63, 0.72, 1), 0.7),
        lane=material("barely blue walk lane", (0.88, 0.95, 1.0, 1), 0.48),
        lane_line=material("thin electric route", (0.07, 0.76, 0.95, 1), 0.35, 0, 1, (0.07, 0.76, 0.95, 1), 1.15),
        glass=material("clear blue glass", (0.74, 0.92, 1.0, 0.24), 0.05, 0, 0.24),
        glass_edge=material("frosted glass edge", (0.82, 0.94, 1.0, 0.46), 0.08, 0, 0.46),
        white=material("warm white device shell", (0.965, 0.975, 0.985, 1), 0.42),
        white_matte=material("matte white partition", (0.9, 0.94, 0.97, 1), 0.62),
        dark=material("obsidian interface glass", (0.012, 0.022, 0.04, 1), 0.35, 0.04),
        graphite=material("deep graphite casing", (0.06, 0.075, 0.09, 1), 0.45, 0.08),
        metal=material("soft brushed aluminium", (0.75, 0.8, 0.86, 1), 0.3, 0.28),
        maple=material("light maple worktop", (0.72, 0.49, 0.26, 1), 0.48),
        maple_dark=material("maple rounded underside", (0.45, 0.29, 0.15, 1), 0.55),
        cyan=material("cyan data glow", (0.08, 0.79, 0.96, 1), 0.28, 0, 1, (0.08, 0.79, 0.96, 1), 1.6),
        blue=material("atlas blue glow", (0.28, 0.55, 1.0, 1), 0.32, 0, 1, (0.17, 0.48, 1.0, 1), 1.0),
        green=material("qa green glow", (0.16, 0.8, 0.38, 1), 0.32, 0, 1, (0.16, 0.8, 0.38, 1), 1.25),
        orange=material("review orange glow", (1.0, 0.48, 0.12, 1), 0.34, 0, 1, (1.0, 0.48, 0.12, 1), 1.25),
        violet=material("planner violet glow", (0.47, 0.31, 1.0, 1), 0.34, 0, 1, (0.47, 0.31, 1.0, 1), 1.25),
        yellow=material("deploy yellow glow", (0.95, 0.72, 0.08, 1), 0.34, 0, 1, (0.95, 0.72, 0.08, 1), 1.25),
        red=material("human approval red", (0.98, 0.24, 0.36, 1), 0.34, 0, 1, (0.98, 0.24, 0.36, 1), 1.4),
        pink=material("figma pink glow", (1.0, 0.45, 0.74, 1), 0.34, 0, 1, (1.0, 0.45, 0.74, 1), 1.15),
        pale_yellow=material("transparent warm zone", (1.0, 0.9, 0.28, 0.28), 0.42, 0, 0.28),
        pale_cyan=material("transparent cyan zone", (0.45, 0.88, 1.0, 0.22), 0.42, 0, 0.22),
        pale_green=material("transparent green zone", (0.3, 0.9, 0.55, 0.22), 0.42, 0, 0.22),
        pale_violet=material("transparent violet zone", (0.64, 0.48, 1.0, 0.2), 0.42, 0, 0.2),
    )


def bevelled_cube(name, loc, scale, mat, bevel=0.04, segments=5):
    bpy.ops.mesh.primitive_cube_add(size=1, location=loc)
    obj = bpy.context.object
    obj.name = name
    obj.dimensions = scale
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    if mat:
        obj.data.materials.append(mat)
    if bevel:
        mod = obj.modifiers.new(f"{name}_bevel", "BEVEL")
        mod.width = bevel
        mod.segments = segments
        obj.modifiers.new(f"{name}_weighted_normals", "WEIGHTED_NORMAL")
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


def sphere(name, loc, radius, mat, scale=(1, 1, 1), segments=48):
    bpy.ops.mesh.primitive_uv_sphere_add(segments=segments, ring_count=24, radius=radius, location=loc)
    obj = bpy.context.object
    obj.name = name
    obj.scale = scale
    if mat:
        obj.data.materials.append(mat)
    for poly in obj.data.polygons:
        poly.use_smooth = True
    return obj


def torus(name, loc, major, minor, mat, rotation=(0, 0, 0)):
    bpy.ops.mesh.primitive_torus_add(major_radius=major, minor_radius=minor, major_segments=80, minor_segments=10, location=loc, rotation=rotation)
    obj = bpy.context.object
    obj.name = name
    if mat:
        obj.data.materials.append(mat)
    return obj


def curve_pipe(name, points, mat, bevel_depth=0.014):
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


def add_text(name, text, loc, size, mat, rot=(math.radians(67), 0, 0)):
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


def rotated(obj, rot_z):
    obj.rotation_euler.z = rot_z
    return obj


def floor_card(name, loc, scale, mat, rot_z=0):
    card = bevelled_cube(name, (loc[0], loc[1], 0.018), (scale[0], scale[1], 0.035), mat, 0.06)
    card.rotation_euler.z = rot_z
    return card


def upright_panel(name, loc, width, height, accent, rot_z=0, title=""):
    frame = bevelled_cube(f"{name}_white_frame", loc, (width, 0.07, height), MATS["white"], 0.035)
    frame.rotation_euler.z = rot_z
    glass = bevelled_cube(f"{name}_glass_surface", (loc[0], loc[1] - 0.04, loc[2]), (width - 0.14, 0.025, height - 0.14), MATS["dark"], 0.018)
    glass.rotation_euler.z = rot_z
    for i in range(5):
        bar = bevelled_cube(
            f"{name}_data_line_{i}",
            (loc[0] - width * 0.2 + i * width * 0.045, loc[1] - 0.065, loc[2] + height * 0.25 - i * height * 0.11),
            (width * (0.34 - i * 0.025), 0.015, 0.018),
            accent if i % 2 == 0 else MATS["yellow"],
            0.004,
        )
        bar.rotation_euler.z = rot_z
    if title:
        label = add_text(f"{name}_label", title, (loc[0], loc[1] - 0.075, loc[2] + height * 0.43), 0.09, accent, rot=(math.radians(90), 0, rot_z))
        label.rotation_euler.z = rot_z
    return frame


def tabletop_monitor(name, loc, rot_z, accent, wide=1.0, height=0.54):
    frame = bevelled_cube(f"{name}_monitor_frame", loc, (0.82 * wide, 0.055, height), MATS["white"], 0.035)
    frame.rotation_euler.z = rot_z
    screen = bevelled_cube(f"{name}_monitor_screen", (loc[0], loc[1] - 0.035, loc[2] + 0.005), (0.68 * wide, 0.024, height - 0.16), MATS["dark"], 0.018)
    screen.rotation_euler.z = rot_z
    for i in range(4):
        line = bevelled_cube(
            f"{name}_screen_line_{i}",
            (loc[0] - 0.13 * wide, loc[1] - 0.052, loc[2] + 0.12 - i * 0.075),
            (0.36 * wide - i * 0.04, 0.012, 0.016),
            accent if i % 2 == 0 else MATS["green"],
            0.003,
        )
        line.rotation_euler.z = rot_z
    stand = bevelled_cube(f"{name}_monitor_stand", (loc[0], loc[1] + 0.02, loc[2] - 0.36), (0.08, 0.12, 0.34), MATS["metal"], 0.02)
    stand.rotation_euler.z = rot_z
    base = bevelled_cube(f"{name}_monitor_base", (loc[0], loc[1] + 0.02, loc[2] - 0.56), (0.42, 0.22, 0.055), MATS["metal"], 0.03)
    base.rotation_euler.z = rot_z


def work_desk(name, loc, rot_z, accent, wide=1.45, depth=0.82, double=False):
    top = bevelled_cube(f"{name}_rounded_maple_top", (loc[0], loc[1], 0.44), (wide, depth, 0.16), MATS["maple"], 0.09, 8)
    top.rotation_euler.z = rot_z
    body = bevelled_cube(f"{name}_soft_shadow_under_top", (loc[0], loc[1], 0.27), (wide - 0.16, depth - 0.16, 0.2), MATS["maple_dark"], 0.06)
    body.rotation_euler.z = rot_z
    offsets = [-0.32, 0.32] if double else [0]
    for idx, offset in enumerate(offsets):
        dx = offset * math.cos(rot_z)
        dy = offset * math.sin(rot_z)
        tabletop_monitor(f"{name}_screen_{idx}", (loc[0] + dx, loc[1] + dy - 0.13, 1.04), rot_z, accent, 0.82)
        keyboard = bevelled_cube(f"{name}_keyboard_{idx}", (loc[0] + dx, loc[1] + dy + 0.12, 0.56), (0.42, 0.16, 0.025), MATS["white"], 0.018)
        keyboard.rotation_euler.z = rot_z
    for sx in [-wide * 0.38, wide * 0.38]:
        for sy in [-depth * 0.32, depth * 0.32]:
            leg = cylinder(f"{name}_leg_{sx}_{sy}", (loc[0] + sx, loc[1] + sy, 0.14), 0.032, 0.54, MATS["metal"], 18)
            leg.rotation_euler.z = rot_z
    return top


def chair(name, loc, rot_z, accent):
    base = cylinder(f"{name}_chair_base", (loc[0], loc[1], 0.17), 0.18, 0.035, MATS["metal"], 32)
    base.rotation_euler.z = rot_z
    cylinder(f"{name}_chair_column", (loc[0], loc[1], 0.33), 0.035, 0.32, MATS["metal"], 18)
    seat = bevelled_cube(f"{name}_chair_seat", (loc[0], loc[1], 0.52), (0.48, 0.42, 0.12), accent, 0.08, 8)
    seat.rotation_euler.z = rot_z
    back = bevelled_cube(f"{name}_chair_back", (loc[0], loc[1] + 0.2, 0.82), (0.5, 0.1, 0.54), accent, 0.08, 8)
    back.rotation_euler.z = rot_z
    for angle in [0, 1.25, 2.5, 3.75, 5.0]:
        cylinder(f"{name}_wheel_{angle}", (loc[0] + math.cos(angle) * 0.27, loc[1] + math.sin(angle) * 0.2, 0.09), 0.035, 0.025, MATS["dark"], 12, rotation=(math.radians(90), 0, 0))


def server_vault():
    bevelled_cube("memory_vault_outer_shell", (-3.35, -1.36, 0.72), (0.94, 0.88, 1.28), MATS["white"], 0.08)
    bevelled_cube("memory_vault_dark_inside", (-3.34, -1.83, 0.73), (0.62, 0.08, 0.96), MATS["dark"], 0.035)
    for i in range(4):
        shelf = bevelled_cube(f"memory_vault_shelf_{i}", (-3.34, -1.885, 0.35 + i * 0.22), (0.5, 0.035, 0.05), MATS["cyan"] if i % 2 else MATS["white"], 0.01)
        shelf.rotation_euler.z = 0
    cylinder("memory_vault_glow_column", (-3.85, -0.76, 0.58), 0.27, 0.86, MATS["dark"], 64)
    torus("memory_vault_cyan_ring", (-3.85, -0.76, 1.02), 0.34, 0.015, MATS["cyan"])
    sphere("memory_vault_core_orb", (-3.85, -0.76, 0.62), 0.18, MATS["cyan"], (1, 1, 1.2))


def security_gate():
    floor_card("security_gate_pale_card", (1.15, 0.92), (1.05, 0.98), MATS["pale_cyan"], 0)
    for x in [0.74, 1.56]:
        bevelled_cube(f"security_gate_column_{x}", (x, 0.86, 0.58), (0.14, 0.18, 1.08), MATS["white"], 0.05)
        bevelled_cube(f"security_gate_inner_light_{x}", (x, 0.75, 0.58), (0.04, 0.03, 0.78), MATS["cyan"], 0.01)
    bevelled_cube("security_gate_top_bridge", (1.15, 0.86, 1.1), (0.92, 0.08, 0.08), MATS["glass_edge"], 0.03)
    bevelled_cube("security_gate_approval_panel", (1.15, 0.57, 0.84), (0.62, 0.045, 0.22), MATS["dark"], 0.025)
    bevelled_cube("security_gate_red_hold_line", (1.15, 0.535, 0.87), (0.44, 0.018, 0.025), MATS["red"], 0.004)


def plugin_station(name, label, loc, accent, rot_z=0, tall=False):
    base = bevelled_cube(f"{name}_round_base", (loc[0], loc[1], 0.13), (0.46, 0.34, 0.12), MATS["white"], 0.06)
    base.rotation_euler.z = rot_z
    tower_h = 0.58 if tall else 0.46
    tower = bevelled_cube(f"{name}_black_device", (loc[0], loc[1], 0.48), (0.26, 0.12, tower_h), MATS["dark"], 0.035)
    tower.rotation_euler.z = rot_z
    face = bevelled_cube(f"{name}_lit_face", (loc[0], loc[1] - 0.07, 0.48), (0.17, 0.015, tower_h - 0.16), MATS["white"], 0.014)
    face.rotation_euler.z = rot_z
    for i in range(3):
        line = bevelled_cube(f"{name}_mini_line_{i}", (loc[0], loc[1] - 0.084, 0.57 - i * 0.09), (0.11 - i * 0.015, 0.01, 0.014), accent, 0.002)
        line.rotation_euler.z = rot_z
    torus(f"{name}_ground_halo", (loc[0], loc[1], 0.055), 0.25, 0.01, accent, rotation=(0, 0, 0))
    add_text(f"{name}_floor_label", label, (loc[0], loc[1] + 0.34, 0.07), 0.065, accent)


def glass_kanban_wall():
    bevelled_cube("center_glass_wall_panel", (0.35, -1.95, 0.96), (2.45, 0.045, 1.6), MATS["glass"], 0.025)
    for x in [-0.62, 0.35, 1.32]:
        bevelled_cube(f"center_wall_vertical_edge_{x}", (x, -1.925, 0.96), (0.035, 0.075, 1.68), MATS["glass_edge"], 0.012)
    add_text("kanban_wall_title", "KANBAN", (0.35, -1.99, 1.58), 0.105, MATS["cyan"], rot=(math.radians(90), 0, 0))
    columns = [(-0.35, MATS["yellow"]), (0.35, MATS["orange"]), (1.05, MATS["green"])]
    for column_index, (x, accent) in enumerate(columns):
        for row in range(4 - column_index):
            card = bevelled_cube(f"kanban_card_{column_index}_{row}", (x, -2.02, 1.26 - row * 0.2), (0.42, 0.022, 0.12), accent, 0.012)
            card.rotation_euler.z = 0


def planning_timeline():
    upright_panel("planning_timeline_screen", (-2.0, -2.22, 1.05), 1.18, 0.78, MATS["violet"], title="PLAN")
    for i in range(5):
        x = -2.4 + i * 0.2
        bevelled_cube(f"timeline_tick_{i}", (x, -2.285, 0.82 + i * 0.045), (0.12, 0.012, 0.018), MATS["violet"], 0.003)
    plugin_station("calendar_station", "CAL", (-2.86, -0.65), MATS["orange"], tall=True)
    plugin_station("linear_station", "LINEAR", (-2.32, -0.55), MATS["yellow"])


def deploy_station():
    floor_card("deploy_zone_pale_card", (2.25, 0.75), (1.45, 1.05), MATS["pale_green"], 0)
    bevelled_cube("vercel_station_server", (2.3, 1.05, 0.55), (0.38, 0.32, 0.88), MATS["dark"], 0.045)
    for i, mat in enumerate([MATS["cyan"], MATS["green"], MATS["yellow"]]):
        bevelled_cube(f"vercel_station_led_{i}", (2.31, 0.865, 0.76 - i * 0.13), (0.18, 0.018, 0.026), mat, 0.004)
    bevelled_cube("deploy_pipeline_track", (1.95, 0.38, 0.64), (1.1, 0.05, 0.05), MATS["cyan"], 0.012)
    for i in range(4):
        sphere(f"deploy_pipeline_node_{i}", (1.45 + i * 0.32, 0.38, 0.64), 0.055, MATS["white"])
    plugin_station("vercel_plugin_station", "VERCEL", (2.76, 0.22), MATS["dark"], tall=True)


def create_scene():
    ensure_dirs()
    clear_scene()
    build_materials()

    bevelled_cube("single_piece_white_showroom_slab", (0, 0, -0.09), (7.75, 4.95, 0.18), MATS["floor"], 0.2, 10)
    bevelled_cube("thick_beveled_drop_shadow_edge", (0, 0, -0.28), (7.86, 5.06, 0.25), MATS["floor_edge"], 0.22, 10)
    bevelled_cube("soft_under_slab_shadow", (0.08, 0.1, -0.45), (7.65, 4.82, 0.16), MATS["floor_shadow"], 0.2, 8)

    floor_card("main_circulation_lane", (-0.2, 0.28), (5.9, 0.58), MATS["lane"], 0)
    floor_card("front_security_lane", (0.95, 0.96), (2.15, 0.46), MATS["lane"], 0)
    curve_pipe("blue_agent_route", [(-3.08, 0.78, 0.08), (-1.8, 0.28, 0.08), (0.2, 0.28, 0.08), (1.85, 0.86, 0.08)], MATS["lane_line"], 0.011)
    curve_pipe("yellow_agent_route", [(-3.1, -1.3, 0.085), (-1.65, -0.64, 0.085), (0.9, 0.28, 0.085), (2.45, 1.02, 0.085)], MATS["yellow"], 0.011)
    curve_pipe("green_agent_route", [(-0.82, 0.34, 0.09), (-0.1, -0.2, 0.09), (1.5, -1.1, 0.09)], MATS["green"], 0.01)

    floor_card("coding_zone_blue_card", (-2.18, 0.82), (1.85, 1.18), MATS["pale_cyan"], -0.02)
    floor_card("planning_zone_yellow_card", (-1.92, -1.08), (1.72, 1.02), MATS["pale_yellow"], 0.02)
    floor_card("review_zone_violet_card", (0.54, -1.1), (1.78, 1.02), MATS["pale_violet"], -0.02)
    floor_card("qa_zone_green_card", (-0.42, 0.0), (1.35, 0.9), MATS["pale_green"], 0.03)

    bevelled_cube("back_showroom_glass", (0.0, -2.46, 0.9), (7.25, 0.055, 1.78), MATS["glass"], 0.025)
    bevelled_cube("left_showroom_glass", (-3.73, -0.1, 0.78), (0.055, 4.25, 1.55), MATS["glass"], 0.025)
    bevelled_cube("right_short_glass", (3.58, 0.28, 0.72), (0.055, 2.1, 1.42), MATS["glass"], 0.025)
    for x in [-3.0, -1.72, -0.44, 0.84, 2.12, 3.34]:
        bevelled_cube(f"back_glass_mullion_{x}", (x, -2.43, 0.92), (0.035, 0.08, 1.84), MATS["glass_edge"], 0.01)
    for y in [-1.55, -0.42, 0.72, 1.75]:
        bevelled_cube(f"left_glass_mullion_{y}", (-3.7, y, 0.82), (0.08, 0.035, 1.62), MATS["glass_edge"], 0.01)

    server_vault()
    planning_timeline()
    glass_kanban_wall()

    work_desk("front_coder_command_desk", (-2.25, 1.02), 0.0, MATS["cyan"], 1.55, 0.84, True)
    chair("blue_operator_chair", (-2.95, 1.32), math.radians(20), MATS["blue"])
    work_desk("middle_builder_desk", (-0.82, 0.35), 0.03, MATS["green"], 1.38, 0.76, True)
    work_desk("right_review_desk", (1.96, -0.72), 0.0, MATS["orange"], 1.32, 0.76, False)

    upright_panel("github_pr_wall", (-0.42, -2.2, 1.0), 1.05, 0.72, MATS["cyan"], title="GIT")
    upright_panel("qa_browser_wall", (2.92, -0.92, 0.96), 0.88, 0.66, MATS["green"], rot_z=math.radians(90), title="QA")

    security_gate()
    deploy_station()

    plugin_station("github_station", "GITHUB", (-1.24, -1.78), MATS["cyan"])
    plugin_station("figma_station", "FIGMA", (-2.95, 0.22), MATS["pink"])
    plugin_station("slack_station", "SLACK", (2.85, -1.62), MATS["green"])
    plugin_station("browser_station", "BROWSER", (3.0, 0.76), MATS["cyan"], tall=True)
    plugin_station("memory_station", "MEM", (-3.15, -0.18), MATS["cyan"], tall=True)

    curve_pipe("vault_to_planning_cable", [(-3.6, -0.78, 0.11), (-2.65, -0.62, 0.12), (-2.0, -1.18, 0.12)], MATS["violet"], 0.013)
    curve_pipe("coding_to_github_cable", [(-1.72, 0.54, 0.11), (-1.32, -0.5, 0.12), (-1.24, -1.66, 0.12)], MATS["cyan"], 0.013)
    curve_pipe("qa_to_browser_cable", [(-0.2, 0.1, 0.11), (1.55, 0.2, 0.12), (3.0, 0.76, 0.12)], MATS["green"], 0.013)
    curve_pipe("deploy_to_security_cable", [(2.25, 0.72, 0.12), (1.6, 0.94, 0.13), (1.14, 0.94, 0.13)], MATS["yellow"], 0.013)

    add_text("floor_label_vault", "Vault", (-3.36, -0.54, 0.08), 0.12, MATS["dark"])
    add_text("floor_label_code", "Desk 01", (-2.25, 0.26, 0.08), 0.105, MATS["blue"])
    add_text("floor_label_gate", "Security Gate", (1.12, 1.52, 0.08), 0.105, MATS["red"])
    add_text("floor_label_blue_agent", "blue-agent", (-0.18, 1.72, 0.08), 0.1, MATS["blue"])

    bpy.ops.object.light_add(type="AREA", location=(0, -1.2, 5.8))
    light = bpy.context.object
    light.name = "large_softbox_reflection"
    light.data.energy = 600
    light.data.size = 6.5
    bpy.ops.object.light_add(type="POINT", location=(-3.2, -1.7, 1.7))
    point = bpy.context.object
    point.name = "vault_cyan_bounce"
    point.data.energy = 80
    point.data.color = (0.68, 0.95, 1)
    bpy.ops.object.camera_add(location=(5.8, -6.2, 5.1), rotation=(math.radians(60), 0, math.radians(42)))
    bpy.context.scene.camera = bpy.context.object


def pill_body(prefix, color_mat, accent_mat, proportions=(1.0, 1.0, 1.0)):
    sx, sy, sz = proportions
    sphere(f"{prefix}_lower_round", (0, 0, 0.46 * sz), 0.24, color_mat, (sx, sy, 0.72 * sz))
    cylinder(f"{prefix}_soft_body", (0, 0, 0.66 * sz), 0.24 * sx, 0.42 * sz, color_mat, 64)
    sphere(f"{prefix}_upper_round", (0, 0, 0.88 * sz), 0.24, color_mat, (sx, sy, 0.76 * sz))
    sphere(f"{prefix}_head", (0, -0.015, 1.08 * sz), 0.22, color_mat, (sx * 1.02, sy * 0.96, 0.92))
    visor = bevelled_cube(f"{prefix}_visor", (0, -0.21, 1.08 * sz), (0.31 * sx, 0.045, 0.105), MATS["dark"], 0.032, 8)
    bevelled_cube(f"{prefix}_visor_glow", (0, -0.237, 1.08 * sz), (0.17 * sx, 0.012, 0.028), accent_mat, 0.006)
    sphere(f"{prefix}_left_hand", (-0.32 * sx, -0.02, 0.66 * sz), 0.075, color_mat)
    sphere(f"{prefix}_right_hand", (0.32 * sx, -0.02, 0.66 * sz), 0.075, color_mat)
    cylinder(f"{prefix}_left_arm", (-0.28 * sx, 0.0, 0.66 * sz), 0.038, 0.28, color_mat, 20, rotation=(0.45, 0, -0.52))
    cylinder(f"{prefix}_right_arm", (0.28 * sx, 0.0, 0.66 * sz), 0.038, 0.28, color_mat, 20, rotation=(0.45, 0, 0.52))
    sphere(f"{prefix}_left_foot", (-0.13 * sx, -0.04, 0.17), 0.075, MATS["dark"], (1.25, 0.85, 0.45))
    sphere(f"{prefix}_right_foot", (0.13 * sx, -0.04, 0.17), 0.075, MATS["dark"], (1.25, 0.85, 0.45))
    sphere(f"{prefix}_status_beacon", (0.21 * sx, -0.12, 1.31 * sz), 0.045, accent_mat)
    torus(f"{prefix}_ground_shadow_ring", (0, 0, 0.055), 0.31 * sx, 0.011, accent_mat)
    return visor


def create_agent(agent_id, color, accent, shape):
    clear_scene()
    build_materials()
    body_mat = material(f"{agent_id}_ceramic_body", color, 0.22, 0.08)
    accent_mat = material(f"{agent_id}_active_accent", accent, 0.26, 0.0, 1.0, accent, 1.65)

    if shape == "orchestrator":
        pill_body(agent_id, body_mat, accent_mat, (1.05, 0.98, 1.05))
        torus("atlas_orchestrator_halo", (0, 0, 1.42), 0.34, 0.014, accent_mat, rotation=(math.radians(90), 0, 0))
        bevelled_cube("atlas_route_tablet", (-0.34, -0.12, 0.84), (0.14, 0.035, 0.22), MATS["dark"], 0.02)
    elif shape == "builder":
        pill_body(agent_id, body_mat, accent_mat, (0.98, 0.98, 1.0))
        bevelled_cube("pixel_figma_pack", (-0.27, 0.15, 0.76), (0.14, 0.13, 0.34), accent_mat, 0.05)
        cylinder("pixel_stylus", (0.37, -0.08, 0.78), 0.025, 0.42, MATS["white"], 16, rotation=(0.65, 0.2, -0.2))
    elif shape == "developer":
        pill_body(agent_id, body_mat, accent_mat, (1.0, 0.98, 0.98))
        bevelled_cube("forge_backpack_terminal", (0, 0.2, 0.72), (0.32, 0.13, 0.42), MATS["dark"], 0.055)
        bevelled_cube("forge_terminal_light", (0, 0.272, 0.78), (0.18, 0.018, 0.04), accent_mat, 0.004)
    elif shape == "qa":
        pill_body(agent_id, body_mat, accent_mat, (0.88, 0.94, 1.14))
        cylinder("sonar_scan_antenna", (0, 0, 1.48), 0.018, 0.32, accent_mat, 14)
        sphere("sonar_scan_dot", (0, 0, 1.68), 0.06, accent_mat)
        torus("sonar_scan_orbit", (0, 0, 1.36), 0.28, 0.008, accent_mat, rotation=(math.radians(90), 0, 0))
    else:
        pill_body(agent_id, body_mat, accent_mat, (0.96, 0.98, 1.0))
        bevelled_cube("vega_release_pack", (0, 0.2, 0.72), (0.34, 0.14, 0.38), accent_mat, 0.06)
        torus("vega_blocked_alert_ring", (0, 0, 1.26), 0.27, 0.012, MATS["red"], rotation=(math.radians(90), 0, 0))
        sphere("vega_approval_dot", (0.0, -0.16, 1.38), 0.05, MATS["red"])

    cylinder(f"{agent_id}_soft_contact_shadow", (0, 0, 0.015), 0.34, 0.008, material(f"{agent_id}_soft_contact_shadow_mat", (0.02, 0.04, 0.07, 0.18), 0.8, 0, 0.18), 64)

    bpy.ops.wm.save_as_mainfile(filepath=str(SOURCE_DIR / f"{agent_id}.blend"))
    bpy.ops.export_scene.gltf(filepath=str(AGENT_DIR / f"{agent_id}.glb"), export_format="GLB", export_apply=True)


ensure_dirs()
create_scene()
bpy.ops.wm.save_as_mainfile(filepath=str(SOURCE_DIR / "crewdesk-scene.blend"))
bpy.ops.export_scene.gltf(filepath=str(MODEL_DIR / "crewdesk-scene.glb"), export_format="GLB", export_apply=True)

agents = [
    ("atlas", (0.18, 0.54, 1.0, 1), (0.08, 0.79, 0.96, 1), "orchestrator"),
    ("pixel", (1.0, 0.48, 0.12, 1), (1.0, 0.45, 0.74, 1), "builder"),
    ("forge", (0.42, 0.62, 1.0, 1), (0.08, 0.79, 0.96, 1), "developer"),
    ("sonar", (0.16, 0.8, 0.38, 1), (0.08, 0.79, 0.96, 1), "qa"),
    ("vega", (0.95, 0.72, 0.08, 1), (0.98, 0.24, 0.36, 1), "deploy"),
]
for agent in agents:
    create_agent(*agent)

print("Built CrewDesk showroom scene and agent GLB exports.")
