/** Reglas compartidas (cliente y servidor) para archivos subidos desde el panel. */
export type UploadKind = "image" | "glb" | "usdz";

export const UPLOAD_LIMITS: Record<UploadKind, number> = {
  image: 8 * 1024 * 1024,
  glb: 15 * 1024 * 1024,
  usdz: 25 * 1024 * 1024,
};

const EXT: Record<string, UploadKind> = {
  jpg: "image", jpeg: "image", png: "image", webp: "image", avif: "image", glb: "glb", usdz: "usdz",
};

export function allowedUploadType(path: string, contentType: string): UploadKind | null {
  const ext = path.split(".").pop()?.toLowerCase() ?? "";
  const kind = EXT[ext];
  if (!kind) return null;
  if (kind === "image" && !contentType.startsWith("image/")) return null;
  return kind;
}

export function contentTypeFor(fileName: string): string {
  const ext = fileName.split(".").pop()?.toLowerCase();
  return (
    { jpg: "image/jpeg", jpeg: "image/jpeg", png: "image/png", webp: "image/webp", avif: "image/avif", glb: "model/gltf-binary", usdz: "model/vnd.usdz+zip" } as Record<string, string>
  )[ext ?? ""] ?? "application/octet-stream";
}

/** Ruta única y segura: <carpeta>/<slug>-<timestamp>.<ext> */
export function uploadPath(folder: "fotos" | "modelos", base: string, fileName: string): string {
  const ext = fileName.split(".").pop()?.toLowerCase() ?? "bin";
  const safe = base.toLowerCase().replace(/[^a-z0-9-]+/g, "-").replace(/^-|-$/g, "").slice(0, 50) || "archivo";
  return `${folder}/${safe}-${Date.now().toString(36)}.${ext}`;
}
