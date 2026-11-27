import { readFile, stat } from "node:fs/promises";
import { extname } from "node:path";
import { resolveUploadPath } from "@/lib/storage/file-driver";

/** Sirve archivos subidos en modo local (data/uploads). En modo Supabase se usan URLs del CDN. */
const TYPES: Record<string, string> = {
  ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".png": "image/png", ".webp": "image/webp", ".avif": "image/avif",
  ".glb": "model/gltf-binary", ".usdz": "model/vnd.usdz+zip",
};

export async function GET(_req: Request, ctx: RouteContext<"/api/files/[...path]">) {
  const { path } = await ctx.params;
  const rel = path.join("/");
  const type = TYPES[extname(rel).toLowerCase()];
  if (!type) return new Response("No encontrado", { status: 404 });
  try {
    const file = resolveUploadPath(rel);
    const info = await stat(file);
    const body = await readFile(file);
    return new Response(body, {
      headers: {
        "content-type": type,
        "content-length": String(info.size),
        // Los nombres incluyen marca de tiempo: el contenido nunca cambia bajo la misma URL.
        "cache-control": "public, max-age=31536000, immutable",
      },
    });
  } catch {
    return new Response("No encontrado", { status: 404 });
  }
}
