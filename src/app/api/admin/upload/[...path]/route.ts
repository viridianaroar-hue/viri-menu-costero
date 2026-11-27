import { adminGuard } from "@/lib/auth/server";
import { StorageError } from "@/lib/storage";
import { saveLocalUpload } from "@/lib/storage/file-driver";
import { UPLOAD_LIMITS, allowedUploadType } from "@/lib/uploads";

/** Recepción de archivos en modo local (el modo Supabase sube directo al bucket con URL firmada). */
export async function PUT(req: Request, ctx: RouteContext<"/api/admin/upload/[...path]">) {
  const denied = await adminGuard();
  if (denied) return denied;
  const { path } = await ctx.params;
  const rel = path.join("/");
  const kind = allowedUploadType(rel, req.headers.get("content-type") ?? "");
  if (!kind) return Response.json({ error: "Tipo de archivo no permitido" }, { status: 415 });
  const body = await req.arrayBuffer();
  if (body.byteLength > UPLOAD_LIMITS[kind]) {
    return Response.json({ error: "Archivo demasiado grande" }, { status: 413 });
  }
  try {
    await saveLocalUpload(rel, body);
    return Response.json({ ok: true });
  } catch (err) {
    const msg = err instanceof StorageError ? `${err.message} ${err.hint ?? ""}` : "No se pudo guardar el archivo";
    return Response.json({ error: msg }, { status: 500 });
  }
}
