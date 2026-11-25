// Copia los decodificadores Draco a /public/vendor para no depender de CDNs de terceros
// (model-viewer los descarga por defecto de gstatic.com).
import { cpSync, existsSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const src = join(root, "node_modules/three/examples/jsm/libs/draco/gltf");
const dest = join(root, "public/vendor/draco");

if (!existsSync(src)) {
  console.warn("[copy-decoders] three no está instalado; se omite.");
  process.exit(0);
}
mkdirSync(dest, { recursive: true });
for (const f of ["draco_decoder.wasm", "draco_wasm_wrapper.js", "draco_decoder.js"]) {
  cpSync(join(src, f), join(dest, f));
}
console.log("[copy-decoders] Draco → public/vendor/draco");
