import type { ModelReport } from "@/lib/menu/schema";

/**
 * Presupuestos de calidad para modelos publicados en el menú.
 * Pensados para gama media y datos móviles: un GLB de 3 MB tarda ~3 s en 4G típico (8 Mbps).
 */
export const MODEL_BUDGET = {
  bytesTarget: 3 * 1024 * 1024,
  bytesMax: 8 * 1024 * 1024,
  trianglesTarget: 80_000,
  trianglesMax: 200_000,
  textureTarget: 2048,
  textureMax: 4096,
  /** Tolerancia entre el tamaño del modelo y la medida verificada del plato. */
  scaleTolerance: 0.1,
} as const;

/** Extensiones que los visores AR nativos podrían no soportar (Scene Viewer / Quick Look). */
const RISKY_EXTENSIONS = ["EXT_meshopt_compression", "KHR_texture_basisu", "KHR_materials_variants"];

export type Check = { level: "ok" | "warn" | "error"; message: string };

const mb = (b: number) => `${(b / 1024 / 1024).toFixed(2)} MB`;

export function evaluateModel(
  r: ModelReport,
  dims?: { diameterCm?: number; heightCm?: number; verified?: boolean },
): Check[] {
  const out: Check[] = [];
  const B = MODEL_BUDGET;

  if (r.bytes > B.bytesMax) out.push({ level: "error", message: `Peso ${mb(r.bytes)}: supera el máximo de ${mb(B.bytesMax)}.` });
  else if (r.bytes > B.bytesTarget) out.push({ level: "warn", message: `Peso ${mb(r.bytes)}: por encima del objetivo de ${mb(B.bytesTarget)}.` });
  else out.push({ level: "ok", message: `Peso ${mb(r.bytes)} dentro del objetivo.` });

  if (r.triangles > B.trianglesMax) out.push({ level: "error", message: `${r.triangles.toLocaleString("es-MX")} triángulos: simplifica a < ${B.trianglesMax.toLocaleString("es-MX")}.` });
  else if (r.triangles > B.trianglesTarget) out.push({ level: "warn", message: `${r.triangles.toLocaleString("es-MX")} triángulos: objetivo < ${B.trianglesTarget.toLocaleString("es-MX")}.` });
  else out.push({ level: "ok", message: `${r.triangles.toLocaleString("es-MX")} triángulos.` });

  if (r.maxTextureSize > B.textureMax) out.push({ level: "error", message: `Textura de ${r.maxTextureSize}px: máximo ${B.textureMax}px.` });
  else if (r.maxTextureSize > B.textureTarget) out.push({ level: "warn", message: `Textura de ${r.maxTextureSize}px: objetivo ${B.textureTarget}px.` });
  else if (r.textures > 0) out.push({ level: "ok", message: `${r.textures} textura(s), máx. ${r.maxTextureSize}px.` });

  const risky = r.extensions.filter((e) => RISKY_EXTENSIONS.includes(e));
  if (risky.length) out.push({ level: "warn", message: `Extensiones con soporte AR incierto: ${risky.join(", ")}. Usa Draco + JPEG/PNG.` });

  const footprint = Math.max(r.sizeCm.x, r.sizeCm.z);
  if (footprint <= 0) {
    out.push({ level: "error", message: "No se pudo medir el modelo (sin geometría)." });
  } else if (footprint > 100 || footprint < 3) {
    out.push({ level: "error", message: `Mide ${footprint} cm de ancho: la escala parece incorrecta (¿unidades en cm o mm en lugar de metros?).` });
  }
  if (dims?.diameterCm && footprint > 0) {
    const diff = Math.abs(footprint - dims.diameterCm) / dims.diameterCm;
    if (diff > B.scaleTolerance) {
      out.push({ level: "error", message: `El modelo mide ${footprint} cm y el plato ${dims.diameterCm} cm (${Math.round(diff * 100)}% de diferencia). Reescala con el pipeline.` });
    } else {
      out.push({ level: dims.verified ? "ok" : "warn", message: `Escala ${footprint} cm vs. ${dims.diameterCm} cm ${dims.verified ? "(medida verificada)" : "(medida NO verificada)"}.` });
    }
  } else {
    out.push({ level: "warn", message: "Falta el diámetro real del plato: no se puede validar la escala en AR." });
  }
  return out;
}
