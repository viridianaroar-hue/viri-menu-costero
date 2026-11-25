// Genera modelos TÉCNICOS de demostración (vajilla a escala real, sin comida).
// Sirven para probar visor 3D, AR y escala. NO representan platillos reales.
// Salida: models-src/demo/*.glb  →  luego se procesan con process-model.mjs
import { Document, NodeIO } from "@gltf-transform/core";
import { mkdirSync } from "node:fs";
import * as THREE from "three";
import { mergeVertices } from "three/examples/jsm/utils/BufferGeometryUtils.js";

const OUT = "models-src/demo";
mkdirSync(OUT, { recursive: true });

function addGeometry(doc, buffer, geo, material, name) {
  const prim = doc.createPrimitive().setMaterial(material);
  const attr = (n, a, type) =>
    doc.createAccessor(`${name}_${n}`).setArray(new Float32Array(a.array)).setType(type).setBuffer(buffer);
  prim.setAttribute("POSITION", attr("pos", geo.attributes.position, "VEC3"));
  prim.setAttribute("NORMAL", attr("nor", geo.attributes.normal, "VEC3"));
  if (geo.attributes.uv) prim.setAttribute("TEXCOORD_0", attr("uv", geo.attributes.uv, "VEC2"));
  if (geo.index) {
    prim.setIndices(doc.createAccessor(`${name}_idx`).setArray(new Uint32Array(geo.index.array)).setType("SCALAR").setBuffer(buffer));
  }
  return doc.createMesh(name).addPrimitive(prim);
}

function lathe(profile, segments = 96) {
  const pts = profile.map(([r, y]) => new THREE.Vector2(r, y));
  let g = new THREE.LatheGeometry(pts, segments);
  // Sin UV (la cerámica no lleva textura) para poder soldar la costura y suavizar normales.
  g.deleteAttribute("uv");
  g.deleteAttribute("normal");
  g = mergeVertices(g, 1e-6);
  g.computeVertexNormals();
  return g;
}

function ceramic(doc, name = "Ceramica esmaltada") {
  return doc.createMaterial(name).setBaseColorFactor([0.95, 0.93, 0.89, 1]).setRoughnessFactor(0.22).setMetallicFactor(0);
}
function gold(doc) {
  return doc.createMaterial("Filo dorado").setBaseColorFactor([0.79, 0.62, 0.2, 1]).setRoughnessFactor(0.3).setMetallicFactor(1);
}

async function write(doc, file) {
  await new NodeIO().write(`${OUT}/${file}`, doc);
  console.log("✓", `${OUT}/${file}`);
}

// ---------- Plato llano Ø27 cm ----------
{
  const doc = new Document();
  const buffer = doc.createBuffer();
  const scene = doc.createScene("Plato llano 27 cm (demo)");
  // Perfil (radio, altura) en metros, desde el centro inferior hacia el borde y de vuelta por la cara superior.
  const profile = [
    [0.0, 0.0075], [0.06, 0.0075], [0.085, 0.0078], [0.096, 0.0098], [0.108, 0.016],
    [0.122, 0.0215], [0.1335, 0.0252], [0.135, 0.0262], [0.1352, 0.0248], [0.134, 0.0232],
    [0.124, 0.0185], [0.1, 0.0085], [0.07, 0.0042], [0.068, 0.0], [0.063, 0.0], [0.061, 0.0035], [0.0, 0.0035],
  ];
  const plate = addGeometry(doc, buffer, lathe(profile), ceramic(doc), "Plato");
  const rimGeo = new THREE.TorusGeometry(0.1343, 0.0009, 8, 160);
  rimGeo.rotateX(Math.PI / 2);
  rimGeo.translate(0, 0.0258, 0);
  const rim = addGeometry(doc, buffer, rimGeo, gold(doc), "Filo");
  scene.addChild(doc.createNode("Plato").setMesh(plate));
  scene.addChild(doc.createNode("Filo").setMesh(rim));
  doc.getRoot().setDefaultScene(scene);
  await write(doc, "plato-llano-27cm.glb");
}

// ---------- Tazón Ø18 cm con superficie de caldo ----------
{
  const doc = new Document();
  const buffer = doc.createBuffer();
  const scene = doc.createScene("Tazón 18 cm (demo)");
  const profile = [
    [0.0, 0.009], [0.045, 0.009], [0.047, 0.0], [0.052, 0.0], [0.055, 0.006], [0.07, 0.02],
    [0.083, 0.042], [0.0895, 0.065], [0.09, 0.075], [0.0875, 0.075], [0.0865, 0.066],
    [0.081, 0.045], [0.068, 0.025], [0.05, 0.014], [0.0, 0.012],
  ];
  const bowl = addGeometry(doc, buffer, lathe(profile), ceramic(doc, "Barro esmaltado"), "Tazon");
  // Superficie de líquido a 5.6 cm: radio interior aproximado a esa altura.
  const liquidGeo = new THREE.CircleGeometry(0.0835, 96);
  liquidGeo.rotateX(-Math.PI / 2);
  liquidGeo.translate(0, 0.056, 0);
  const broth = doc.createMaterial("Caldo (genérico)").setBaseColorFactor([0.5, 0.16, 0.05, 1]).setRoughnessFactor(0.12).setMetallicFactor(0);
  const liquid = addGeometry(doc, buffer, liquidGeo, broth, "Caldo");
  scene.addChild(doc.createNode("Tazon").setMesh(bowl));
  scene.addChild(doc.createNode("Caldo").setMesh(liquid));
  doc.getRoot().setDefaultScene(scene);
  await write(doc, "tazon-caldo-18cm.glb");
}
