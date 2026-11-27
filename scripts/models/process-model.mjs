#!/usr/bin/env node
// Pipeline de publicación de modelos 3D para el menú.
//
// Uso:
//   npm run model:process -- <entrada.glb> --out public/models/<slug>.glb --diameter 27 [opciones]
//
// Opciones:
//   --diameter <cm>     Diámetro real VERIFICADO del plato (ancho máximo en planta). Reescala el modelo.
//   --up z              El modelo viene con Z hacia arriba (Blender/escáneres): lo rota a Y-up.
//   --max-tris <n>      Simplifica si supera n triángulos (por defecto 80000).
//   --texture <px>      Lado máximo de texturas (por defecto 2048).
//   --jpeg              Convierte texturas de color sin transparencia a JPEG (más ligero).
//   --no-draco          No comprimir geometría.
//
// Pasos: limpiar → orientar → escalar a medida real → apoyar en la mesa (y=0) →
//        simplificar → redimensionar texturas → comprimir (Draco) → reporte vs. presupuesto.
import { NodeIO } from "@gltf-transform/core";
import { ALL_EXTENSIONS } from "@gltf-transform/extensions";
import {
  center, dedup, draco, getBounds, prune, simplify, textureCompress, weld,
} from "@gltf-transform/functions";
import draco3d from "draco3dgltf";
import { MeshoptSimplifier } from "meshoptimizer";
import sharp from "sharp";
import { mkdirSync, readFileSync } from "node:fs";
import { dirname } from "node:path";
import { parseArgs } from "node:util";
import { inspectGlb } from "../../src/lib/model/inspect-glb.ts";
import { evaluateModel } from "../../src/lib/model/budgets.ts";

const { values, positionals } = parseArgs({
  allowPositionals: true,
  options: {
    out: { type: "string" },
    diameter: { type: "string" },
    up: { type: "string", default: "y" },
    "max-tris": { type: "string", default: "80000" },
    texture: { type: "string", default: "2048" },
    jpeg: { type: "boolean", default: false },
    "no-draco": { type: "boolean", default: false },
  },
});

const input = positionals[0];
if (!input || !values.out) {
  console.error("Uso: npm run model:process -- entrada.glb --out public/models/x.glb --diameter 27");
  process.exit(1);
}

const io = new NodeIO()
  .registerExtensions(ALL_EXTENSIONS)
  .registerDependencies({
    "draco3d.decoder": await draco3d.createDecoderModule(),
    "draco3d.encoder": await draco3d.createEncoderModule(),
  });

const doc = await io.read(input);
const scene = doc.getRoot().getDefaultScene() ?? doc.getRoot().listScenes()[0];
const log = (m) => console.log(`  • ${m}`);
console.log(`\nProcesando ${input}`);

// 1. Orientación: agrupar bajo un nodo raíz para poder rotar/escalar todo junto.
const root = doc.createNode("menu_root");
for (const child of scene.listChildren()) {
  scene.removeChild(child);
  root.addChild(child);
}
scene.addChild(root);
if (values.up === "z") {
  root.setRotation([-Math.SQRT1_2, 0, 0, Math.SQRT1_2]); // -90° en X
  log("Rotado de Z-up a Y-up");
}

// 2. Escala a medida real (1 unidad glTF = 1 m).
let b = getBounds(scene);
const footprint = Math.max(b.max[0] - b.min[0], b.max[2] - b.min[2]);
if (values.diameter) {
  const target = Number(values.diameter) / 100;
  const factor = target / footprint;
  root.setScale([factor, factor, factor]);
  log(`Escalado ×${factor.toFixed(4)} → Ø ${values.diameter} cm (antes ${(footprint * 100).toFixed(1)} cm)`);
} else {
  log(`⚠ Sin --diameter: se conserva la escala original (${(footprint * 100).toFixed(1)} cm). La escala AR no estará validada.`);
}

// 3. Limpieza, apoyo en la mesa y simplificación.
const maxTris = Number(values["max-tris"]);
await doc.transform(dedup(), prune(), weld(), center({ pivot: "below" }));
const tris = inspectTriangles(doc);
if (tris > maxTris) {
  await MeshoptSimplifier.ready;
  const ratio = Math.max(0.05, maxTris / tris);
  await doc.transform(simplify({ simplifier: MeshoptSimplifier, ratio, error: 0.001 }));
  log(`Simplificado ${tris.toLocaleString()} → ~${Math.round(tris * ratio).toLocaleString()} triángulos`);
}

// 4. Texturas.
const size = Number(values.texture);
await doc.transform(
  textureCompress({ encoder: sharp, resize: [size, size], slots: /^(?!normalTexture).*$/ }),
  textureCompress({ encoder: sharp, resize: [size, size], slots: /^normalTexture$/ }),
);
if (values.jpeg) {
  await doc.transform(textureCompress({ encoder: sharp, targetFormat: "jpeg", quality: 85, slots: /^(baseColorTexture|emissiveTexture|occlusionTexture|metallicRoughnessTexture)$/ }));
  log("Texturas de color → JPEG q85");
}
log(`Texturas limitadas a ${size}px`);

// 5. Compresión de geometría (Draco: soportado por model-viewer, Scene Viewer y la exportación USDZ de iOS).
if (!values["no-draco"]) {
  await doc.transform(draco({ method: "edgebreaker" }));
  log("Geometría comprimida con Draco");
}

mkdirSync(dirname(values.out), { recursive: true });
await io.write(values.out, doc);

// 6. Reporte contra presupuesto.
const report = inspectGlb(readFileSync(values.out).buffer);
b = report.sizeCm;
console.log(`\n✓ ${values.out}`);
console.log(`  Tamaño: ${b.x} × ${b.y} × ${b.z} cm | ${(report.bytes / 1024).toFixed(0)} KB | ${report.triangles.toLocaleString()} triángulos | ${report.textures} texturas`);
let errors = 0;
for (const c of evaluateModel(report, values.diameter ? { diameterCm: Number(values.diameter), verified: true } : undefined)) {
  const icon = c.level === "ok" ? "✓" : c.level === "warn" ? "⚠" : "✗";
  if (c.level === "error") errors++;
  console.log(`  ${icon} ${c.message}`);
}
process.exit(errors ? 2 : 0);

function inspectTriangles(document) {
  let t = 0;
  for (const mesh of document.getRoot().listMeshes())
    for (const p of mesh.listPrimitives()) {
      if (p.getMode() !== 4) continue;
      const idx = p.getIndices();
      t += Math.floor((idx ? idx.getCount() : p.getAttribute("POSITION").getCount()) / 3);
    }
  return t;
}
