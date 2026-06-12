import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import * as THREE from "three";
import { GLTFExporter } from "three/examples/jsm/exporters/GLTFExporter.js";

const ROOT = resolve(process.cwd(), "public/assets/models");

globalThis.FileReader ??= class FileReader {
  result = null;
  onloadend = null;
  onerror = null;

  async readAsArrayBuffer(blob) {
    try {
      this.result = await blob.arrayBuffer();
      this.onloadend?.({ target: this });
    } catch (error) {
      this.onerror?.(error);
    }
  }

  async readAsDataURL(blob) {
    try {
      const buffer = Buffer.from(await blob.arrayBuffer());
      this.result = `data:${blob.type || "application/octet-stream"};base64,${buffer.toString("base64")}`;
      this.onloadend?.({ target: this });
    } catch (error) {
      this.onerror?.(error);
    }
  }
};

function mat(color, options = {}) {
  return new THREE.MeshStandardMaterial({
    color,
    roughness: options.roughness ?? 0.58,
    metalness: options.metalness ?? 0.04,
    emissive: options.emissive ?? "#000000",
    emissiveIntensity: options.emissiveIntensity ?? 0,
    transparent: options.opacity !== undefined,
    opacity: options.opacity ?? 1,
  });
}

function physical(color, options = {}) {
  return new THREE.MeshPhysicalMaterial({
    color,
    roughness: options.roughness ?? 0.16,
    metalness: options.metalness ?? 0,
    transparent: true,
    opacity: options.opacity ?? 0.25,
    transmission: options.transmission ?? 0.35,
    thickness: options.thickness ?? 0.2,
  });
}

const materials = {
  floor: mat("#f8fafc", { roughness: 0.72 }),
  floorEdge: mat("#cad4df", { roughness: 0.78 }),
  zonePlanning: mat("#e9ddff", { roughness: 0.72 }),
  zoneCoding: mat("#d8f3ff", { roughness: 0.72 }),
  zoneReview: mat("#ffe5d2", { roughness: 0.72 }),
  zoneQa: mat("#dafbe8", { roughness: 0.72 }),
  zoneDeploy: mat("#fff1be", { roughness: 0.72 }),
  wood: mat("#b9824b", { roughness: 0.58 }),
  woodDark: mat("#8b5a33", { roughness: 0.7 }),
  dark: mat("#07111f", { roughness: 0.38, metalness: 0.08 }),
  metal: mat("#cbd5e1", { roughness: 0.42, metalness: 0.16 }),
  white: mat("#ffffff", { roughness: 0.48 }),
  glass: physical("#b4e6ff", { opacity: 0.22 }),
  cyan: mat("#22d3ee", { emissive: "#22d3ee", emissiveIntensity: 0.65 }),
  green: mat("#22c55e", { emissive: "#22c55e", emissiveIntensity: 0.48 }),
  orange: mat("#f97316", { emissive: "#f97316", emissiveIntensity: 0.52 }),
  violet: mat("#8b5cf6", { emissive: "#8b5cf6", emissiveIntensity: 0.42 }),
  yellow: mat("#eab308", { emissive: "#eab308", emissiveIntensity: 0.5 }),
  red: mat("#fb7185", { emissive: "#fb7185", emissiveIntensity: 0.5 }),
};

function mesh(name, geometry, material, position = [0, 0, 0], rotation = [0, 0, 0], scale = [1, 1, 1]) {
  const item = new THREE.Mesh(geometry, material);
  item.name = name;
  item.position.set(...position);
  item.rotation.set(...rotation);
  item.scale.set(...scale);
  item.castShadow = true;
  item.receiveShadow = true;
  return item;
}

function box(name, size, material, position, rotation = [0, 0, 0]) {
  return mesh(name, new THREE.BoxGeometry(size[0], size[1], size[2]), material, position, rotation);
}

function cylinder(name, radiusTop, radiusBottom, height, material, position, rotation = [0, 0, 0], segments = 32) {
  return mesh(name, new THREE.CylinderGeometry(radiusTop, radiusBottom, height, segments), material, position, rotation);
}

function sphere(name, radius, material, position, scale = [1, 1, 1]) {
  return mesh(name, new THREE.SphereGeometry(radius, 32, 20), material, position, [0, 0, 0], scale);
}

function addLine(group, name, from, to, material, radius = 0.018) {
  const start = new THREE.Vector3(...from);
  const end = new THREE.Vector3(...to);
  const curve = new THREE.CatmullRomCurve3([
    start,
    start.clone().lerp(end, 0.45).add(new THREE.Vector3(0, 0.05, 0)),
    end,
  ]);
  group.add(mesh(name, new THREE.TubeGeometry(curve, 24, radius, 8, false), material));
}

function screen(name, position, rotationY, accent, scale = 1) {
  const group = new THREE.Group();
  group.name = name;
  group.position.set(...position);
  group.rotation.y = rotationY;
  group.scale.setScalar(scale);
  group.add(box(`${name}_shell`, [0.9, 0.58, 0.055], materials.white, [0, 0.68, 0]));
  group.add(box(`${name}_glass`, [0.76, 0.42, 0.018], materials.dark, [0, 0.68, 0.038]));
  for (let i = 0; i < 5; i += 1) {
    group.add(box(`${name}_log_${i}`, [0.48 - i * 0.045, 0.018, 0.012], i % 2 ? materials.orange : accent, [-0.07, 0.78 - i * 0.075, 0.052]));
  }
  group.add(box(`${name}_stem`, [0.08, 0.28, 0.08], materials.metal, [0, 0.32, 0]));
  group.add(box(`${name}_base`, [0.42, 0.045, 0.22], materials.metal, [0, 0.17, 0.04]));
  return group;
}

function desk(name, position, rotationY, accent) {
  const group = new THREE.Group();
  group.name = name;
  group.position.set(...position);
  group.rotation.y = rotationY;
  group.add(box(`${name}_top`, [1.25, 0.18, 0.72], materials.wood, [0, 0.42, 0]));
  group.add(box(`${name}_body`, [1.06, 0.28, 0.56], materials.woodDark, [0, 0.25, 0]));
  group.add(box(`${name}_keyboard`, [0.48, 0.035, 0.18], materials.white, [0.1, 0.54, 0.12]));
  group.add(sphere(`${name}_mouse`, 0.065, materials.white, [0.46, 0.56, 0.14], [1, 0.55, 1]));
  group.add(screen(`${name}_screen_a`, [-0.18, 0.1, -0.25], 0.08, accent, 0.78));
  group.add(screen(`${name}_screen_b`, [0.38, 0.07, -0.12], -0.2, accent, 0.58));
  return group;
}

function pluginStation(name, position, accent, tall = false) {
  const group = new THREE.Group();
  group.name = `plugin_${name.toLowerCase()}`;
  group.position.set(...position);
  group.add(box(`${name}_plinth`, [0.48, 0.12, 0.48], materials.white, [0, 0.08, 0]));
  group.add(box(`${name}_tower`, [0.32, tall ? 0.7 : 0.52, 0.2], materials.dark, [0, tall ? 0.47 : 0.38, 0]));
  group.add(box(`${name}_face`, [0.24, tall ? 0.52 : 0.36, 0.018], materials.white, [0, tall ? 0.49 : 0.39, 0.112]));
  group.add(box(`${name}_pulse`, [0.18, 0.035, 0.012], accent, [0, tall ? 0.61 : 0.48, 0.126]));
  group.add(box(`${name}_pulse_2`, [0.12, 0.035, 0.012], accent, [0, tall ? 0.48 : 0.36, 0.126]));
  return group;
}

function createCockpit() {
  const scene = new THREE.Group();
  scene.name = "CrewDeskAssetScene";

  scene.add(box("floor_base", [9.1, 0.18, 6.0], materials.floor, [0, -0.09, 0]));
  scene.add(box("floor_shadow_edge", [9.18, 0.22, 6.08], materials.floorEdge, [0, -0.27, 0]));
  scene.add(box("zone_planning_pad", [2.2, 0.035, 1.55], materials.zonePlanning, [-2.55, 0.018, -0.95]));
  scene.add(box("zone_coding_pad", [2.35, 0.035, 1.75], materials.zoneCoding, [-0.2, 0.02, -0.08]));
  scene.add(box("zone_review_pad", [1.75, 0.035, 1.38], materials.zoneReview, [2.25, 0.022, -1.05]));
  scene.add(box("zone_qa_pad", [1.8, 0.035, 1.35], materials.zoneQa, [1.72, 0.024, 1.3]));
  scene.add(box("zone_deploy_pad", [2.1, 0.035, 1.55], materials.zoneDeploy, [-2.52, 0.026, 1.3]));

  scene.add(box("glass_back_wall", [8.55, 1.78, 0.06], materials.glass, [0, 0.92, -2.92]));
  scene.add(box("glass_left_wall", [0.06, 1.78, 5.65], materials.glass, [-4.28, 0.92, -0.1]));
  for (const x of [-3.2, -1.6, 0, 1.6, 3.2]) {
    scene.add(box(`back_wall_frame_${x}`, [0.035, 1.86, 0.095], materials.white, [x, 0.94, -2.87]));
  }
  for (const z of [-2.0, -0.7, 0.7, 2.0]) {
    scene.add(box(`left_wall_frame_${z}`, [0.095, 1.86, 0.035], materials.white, [-4.23, 0.94, z]));
  }

  scene.add(desk("planning_command_desk", [-2.55, 0, -0.72], -0.12, materials.violet));
  scene.add(desk("coding_dual_terminal", [-0.32, 0, -0.05], 0.03, materials.cyan));
  scene.add(desk("qa_observability_desk", [1.55, 0, 1.22], -0.28, materials.green));

  scene.add(screen("planning_wall_timeline", [-1.62, 0.7, -2.68], 0, materials.violet, 1.38));
  scene.add(screen("review_pr_board", [2.22, 0.78, -2.68], 0, materials.orange, 1.12));
  scene.add(screen("qa_test_wall", [3.35, 0.54, 0.52], -Math.PI / 2, materials.green, 0.95));

  const deploy = new THREE.Group();
  deploy.name = "deploy_zone_station";
  deploy.position.set(-2.9, 0, 1.42);
  deploy.add(box("vercel_pipeline_plinth", [1.15, 0.14, 0.62], materials.white, [0, 0.07, 0]));
  deploy.add(box("vercel_server", [0.42, 0.78, 0.35], materials.dark, [-0.32, 0.5, 0]));
  deploy.add(box("vercel_pipeline", [0.82, 0.055, 0.065], materials.cyan, [0.22, 0.74, 0.21]));
  deploy.add(sphere("prod_green", 0.055, materials.green, [-0.48, 0.68, 0.19]));
  deploy.add(sphere("prod_orange", 0.055, materials.orange, [-0.32, 0.52, 0.19]));
  deploy.add(sphere("prod_yellow", 0.055, materials.yellow, [-0.16, 0.36, 0.19]));
  scene.add(deploy);

  const security = new THREE.Group();
  security.name = "security_gate";
  security.position.set(2.68, 0, 0.9);
  security.add(box("security_left_pillar", [0.18, 1.05, 0.2], materials.white, [-0.36, 0.53, 0]));
  security.add(box("security_right_pillar", [0.18, 1.05, 0.2], materials.white, [0.36, 0.53, 0]));
  security.add(box("security_approval_bar", [0.62, 0.055, 0.055], materials.red, [0, 0.86, 0]));
  security.add(box("security_badge", [0.34, 0.28, 0.035], materials.dark, [0, 0.42, -0.14]));
  scene.add(security);

  const vault = new THREE.Group();
  vault.name = "memory_vault";
  vault.position.set(-3.55, 0, 0.55);
  vault.add(cylinder("vault_core", 0.36, 0.46, 0.72, materials.dark, [0, 0.47, 0], [0, 0, 0], 48));
  vault.add(cylinder("vault_glass_ring", 0.5, 0.5, 0.04, materials.cyan, [0, 0.85, 0], [0, 0, 0], 48));
  vault.add(box("vault_memory_card_a", [0.34, 0.22, 0.025], materials.white, [-0.28, 0.42, 0.34], [0, 0.3, 0]));
  vault.add(box("vault_memory_card_b", [0.34, 0.22, 0.025], materials.white, [0.26, 0.62, 0.33], [0, -0.24, 0]));
  scene.add(vault);

  const plugins = [
    ["GitHub", [-0.95, 0, -2.25], materials.cyan, false],
    ["Figma", [-3.35, 0, -1.85], materials.violet, false],
    ["Linear", [-2.28, 0, -2.25], materials.yellow, false],
    ["Slack", [3.52, 0, -1.35], materials.green, false],
    ["Browser", [3.58, 0, 0.0], materials.cyan, true],
    ["Vercel", [-1.86, 0, 2.15], materials.dark, false],
    ["Calendar", [-3.62, 0, -0.45], materials.orange, false],
    ["Memory", [-3.48, 0, 1.34], materials.cyan, true],
  ];
  for (const plugin of plugins) {
    scene.add(pluginStation(plugin[0], plugin[1], plugin[2], plugin[3]));
  }

  addLine(scene, "cable_planning_to_memory", [-2.55, 0.05, -0.1], [-3.48, 0.05, 0.95], materials.violet);
  addLine(scene, "cable_coding_to_github", [-0.35, 0.05, -0.35], [-0.95, 0.05, -2.1], materials.cyan);
  addLine(scene, "cable_qa_to_browser", [1.5, 0.05, 1.0], [3.35, 0.05, 0.12], materials.green);
  addLine(scene, "cable_deploy_to_security", [-2.32, 0.05, 1.42], [2.28, 0.05, 0.86], materials.yellow);

  return scene;
}

function createAgent() {
  const group = new THREE.Group();
  group.name = "CrewDeskAgentBot";
  const bot = mat("#38bdf8", { roughness: 0.42, metalness: 0.18 });
  group.add(cylinder("agent_body", 0.22, 0.28, 0.56, bot, [0, 0.45, 0], [0, 0, 0], 32));
  group.add(sphere("agent_head", 0.29, bot, [0, 0.88, 0], [1, 0.88, 1]));
  group.add(box("agent_visor", [0.35, 0.095, 0.035], materials.dark, [0, 0.9, 0.255]));
  group.add(box("agent_visor_glow", [0.25, 0.028, 0.012], materials.cyan, [0, 0.9, 0.278]));
  group.add(cylinder("agent_left_arm", 0.055, 0.055, 0.38, bot, [-0.31, 0.48, 0], [0, 0, 0.2], 18));
  group.add(cylinder("agent_right_arm", 0.055, 0.055, 0.38, bot, [0.31, 0.48, 0], [0, 0, -0.2], 18));
  group.add(sphere("agent_status_beacon", 0.06, materials.cyan, [0.25, 1.15, 0.08]));
  group.add(cylinder("agent_base_shadow", 0.34, 0.34, 0.012, mat("#0f172a", { opacity: 0.18 }), [0, 0.02, 0], [0, 0, 0], 48));
  return group;
}

async function exportGlb(object, path) {
  mkdirSync(dirname(path), { recursive: true });
  const exporter = new GLTFExporter();
  const data = await new Promise((resolveExport, rejectExport) => {
    exporter.parse(
      object,
      resolveExport,
      rejectExport,
      { binary: true, trs: false, onlyVisible: true },
    );
  });
  writeFileSync(path, Buffer.from(data));
}

await exportGlb(createCockpit(), resolve(ROOT, "crewdesk-cockpit.glb"));
await exportGlb(createAgent(), resolve(ROOT, "agents/agent-bot.glb"));

console.log("Generated CrewDesk GLB assets in public/assets/models");
