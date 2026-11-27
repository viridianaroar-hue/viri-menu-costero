/**
 * Inspector GLB sin dependencias (navegador y Node).
 * Lee solo el JSON del glTF + cabeceras de imágenes: no decodifica geometría,
 * por lo que funciona también con modelos comprimidos con Draco/meshopt.
 *
 * Devuelve: peso, triángulos, número de texturas y su tamaño máximo,
 * dimensiones reales (cm, asumiendo 1 unidad glTF = 1 metro) y extensiones.
 */
import type { ModelReport } from "@/lib/menu/schema";

type Json = Record<string, any>; // eslint-disable-line @typescript-eslint/no-explicit-any
type Mat4 = number[];

const GLB_MAGIC = 0x46546c67;
const CHUNK_JSON = 0x4e4f534a;
const CHUNK_BIN = 0x004e4942;

export class GlbError extends Error {}

function identity(): Mat4 {
  return [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1];
}

function multiply(a: Mat4, b: Mat4): Mat4 {
  const out = new Array(16).fill(0);
  for (let c = 0; c < 4; c++)
    for (let r = 0; r < 4; r++)
      for (let k = 0; k < 4; k++) out[c * 4 + r] += a[k * 4 + r] * b[c * 4 + k];
  return out;
}

function trs(node: Json): Mat4 {
  if (Array.isArray(node.matrix)) return node.matrix as Mat4;
  const [tx, ty, tz] = node.translation ?? [0, 0, 0];
  const [x, y, z, w] = node.rotation ?? [0, 0, 0, 1];
  const [sx, sy, sz] = node.scale ?? [1, 1, 1];
  const xx = x * x, yy = y * y, zz = z * z, xy = x * y, xz = x * z, yz = y * z, wx = w * x, wy = w * y, wz = w * z;
  return [
    (1 - 2 * (yy + zz)) * sx, 2 * (xy + wz) * sx, 2 * (xz - wy) * sx, 0,
    2 * (xy - wz) * sy, (1 - 2 * (xx + zz)) * sy, 2 * (yz + wx) * sy, 0,
    2 * (xz + wy) * sz, 2 * (yz - wx) * sz, (1 - 2 * (xx + yy)) * sz, 0,
    tx, ty, tz, 1,
  ];
}

function transform(m: Mat4, p: number[]): number[] {
  return [
    m[0] * p[0] + m[4] * p[1] + m[8] * p[2] + m[12],
    m[1] * p[0] + m[5] * p[1] + m[9] * p[2] + m[13],
    m[2] * p[0] + m[6] * p[1] + m[10] * p[2] + m[14],
  ];
}

function normalizeFactor(acc: Json): number {
  if (!acc.normalized) return 1;
  return ({ 5120: 127, 5121: 255, 5122: 32767, 5123: 65535 } as Record<number, number>)[acc.componentType] ?? 1;
}

function imageSize(bytes: Uint8Array): { w: number; h: number } | null {
  const dv = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  // PNG
  if (bytes[0] === 0x89 && bytes[1] === 0x50) return { w: dv.getUint32(16), h: dv.getUint32(20) };
  // JPEG: buscar marcador SOFn
  if (bytes[0] === 0xff && bytes[1] === 0xd8) {
    let i = 2;
    while (i < bytes.length - 9) {
      if (bytes[i] !== 0xff) { i++; continue; }
      const marker = bytes[i + 1];
      const len = dv.getUint16(i + 2);
      if (marker >= 0xc0 && marker <= 0xcf && ![0xc4, 0xc8, 0xcc].includes(marker)) {
        return { h: dv.getUint16(i + 5), w: dv.getUint16(i + 7) };
      }
      i += 2 + len;
    }
    return null;
  }
  // WebP
  if (bytes[0] === 0x52 && bytes[8] === 0x57) {
    const fourcc = String.fromCharCode(bytes[12], bytes[13], bytes[14], bytes[15]);
    if (fourcc === "VP8X") return { w: 1 + (bytes[24] | (bytes[25] << 8) | (bytes[26] << 16)), h: 1 + (bytes[27] | (bytes[28] << 8) | (bytes[29] << 16)) };
    if (fourcc === "VP8L") {
      const b = dv.getUint32(21, true);
      return { w: (b & 0x3fff) + 1, h: ((b >> 14) & 0x3fff) + 1 };
    }
    if (fourcc === "VP8 ") return { w: dv.getUint16(26, true) & 0x3fff, h: dv.getUint16(28, true) & 0x3fff };
  }
  // KTX2
  if (bytes[0] === 0xab && bytes[1] === 0x4b && bytes[2] === 0x54 && bytes[3] === 0x58) {
    return { w: dv.getUint32(20, true), h: dv.getUint32(24, true) };
  }
  return null;
}

export function inspectGlb(buffer: ArrayBuffer): ModelReport {
  const dv = new DataView(buffer);
  if (buffer.byteLength < 20 || dv.getUint32(0, true) !== GLB_MAGIC) {
    throw new GlbError("El archivo no es un GLB válido (glTF binario).");
  }
  if (dv.getUint32(4, true) !== 2) throw new GlbError("Solo se admite glTF 2.0.");

  let json: Json | null = null;
  let bin: Uint8Array | null = null;
  let offset = 12;
  while (offset < buffer.byteLength) {
    const len = dv.getUint32(offset, true);
    const type = dv.getUint32(offset + 4, true);
    const data = new Uint8Array(buffer, offset + 8, len);
    if (type === CHUNK_JSON) json = JSON.parse(new TextDecoder().decode(data));
    else if (type === CHUNK_BIN) bin = data;
    offset += 8 + len;
  }
  if (!json) throw new GlbError("GLB sin bloque JSON.");

  const accessors: Json[] = json.accessors ?? [];
  const meshes: Json[] = json.meshes ?? [];
  const nodes: Json[] = json.nodes ?? [];
  const scene = (json.scenes ?? [])[json.scene ?? 0] ?? { nodes: nodes.map((_, i) => i) };

  let triangles = 0;
  let meshInstances = 0;
  const min = [Infinity, Infinity, Infinity];
  const max = [-Infinity, -Infinity, -Infinity];

  const visit = (index: number, parent: Mat4, depth: number) => {
    if (depth > 64) return;
    const node = nodes[index];
    if (!node) return;
    const world = multiply(parent, trs(node));
    if (node.mesh !== undefined && meshes[node.mesh]) {
      meshInstances++;
      for (const prim of meshes[node.mesh].primitives ?? []) {
        const mode = prim.mode ?? 4;
        const pos = accessors[prim.attributes?.POSITION];
        if (mode === 4) {
          const count = prim.indices !== undefined ? accessors[prim.indices]?.count : pos?.count;
          triangles += Math.floor((count ?? 0) / 3);
        }
        if (pos?.min && pos?.max) {
          const f = normalizeFactor(pos);
          const a = pos.min.map((v: number) => v / f);
          const b = pos.max.map((v: number) => v / f);
          for (const x of [a[0], b[0]])
            for (const y of [a[1], b[1]])
              for (const z of [a[2], b[2]]) {
                const p = transform(world, [x, y, z]);
                for (let k = 0; k < 3; k++) {
                  min[k] = Math.min(min[k], p[k]);
                  max[k] = Math.max(max[k], p[k]);
                }
              }
        }
      }
    }
    for (const child of node.children ?? []) visit(child, world, depth + 1);
  };
  for (const root of scene.nodes ?? []) visit(root, identity(), 0);

  let maxTextureSize = 0;
  for (const img of json.images ?? []) {
    let bytes: Uint8Array | null = null;
    if (img.bufferView !== undefined && bin) {
      const bv = json.bufferViews[img.bufferView];
      bytes = bin.subarray(bv.byteOffset ?? 0, (bv.byteOffset ?? 0) + bv.byteLength);
    }
    const size = bytes ? imageSize(bytes) : null;
    if (size) maxTextureSize = Math.max(maxTextureSize, size.w, size.h);
  }

  const cm = (k: number) => (Number.isFinite(min[k]) ? Math.round((max[k] - min[k]) * 1000) / 10 : 0);
  const extensions = Array.from(new Set([...(json.extensionsUsed ?? []), ...(json.extensionsRequired ?? [])]));

  return {
    bytes: buffer.byteLength,
    triangles,
    meshes: meshInstances,
    textures: (json.images ?? []).length,
    maxTextureSize,
    sizeCm: { x: cm(0), y: cm(1), z: cm(2) },
    extensions,
    checkedAt: new Date().toISOString(),
  };
}
