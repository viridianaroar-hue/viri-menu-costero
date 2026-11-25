import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { menuSchema, type Menu } from "@/lib/menu/schema";
import { StorageError, type StorageDriver, type UploadTicket } from "./types";

/**
 * Driver Supabase (producción serverless).
 * - Menú: tabla `menu_store` (una fila JSONB por restaurante). Ver supabase/schema.sql.
 * - Archivos: bucket público (por defecto `menu-assets`) con CDN.
 * La service role key solo se usa en el servidor; nunca llega al navegador.
 */
const MENU_ID = process.env.MENU_ID || "default";
const BUCKET = process.env.SUPABASE_BUCKET || "menu-assets";

let client: SupabaseClient | null = null;
function db(): SupabaseClient {
  if (!client) {
    client = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  }
  return client;
}

export const supabaseDriver: StorageDriver = {
  name: "supabase",

  async readMenu() {
    const { data, error } = await db()
      .from("menu_store")
      .select("data")
      .eq("id", MENU_ID)
      .maybeSingle();
    if (error) throw new StorageError(`Supabase: ${error.message}`, "Verifica que ejecutaste supabase/schema.sql");
    if (data?.data) return menuSchema.parse(data.data);
    // Primera ejecución: sembrar con data/seed.json
    const seed = menuSchema.parse(JSON.parse(await readFile(join(process.cwd(), "data/seed.json"), "utf8")));
    await this.writeMenu(seed);
    return seed;
  },

  async writeMenu(menu: Menu) {
    const { error } = await db()
      .from("menu_store")
      .upsert({ id: MENU_ID, data: menuSchema.parse(menu), updated_at: new Date().toISOString() });
    if (error) throw new StorageError(`Supabase: ${error.message}`);
  },

  async prepareUpload(path: string, contentType: string): Promise<UploadTicket> {
    const storage = db().storage.from(BUCKET);
    const { data, error } = await storage.createSignedUploadUrl(path, { upsert: true });
    if (error || !data) throw new StorageError(`Supabase Storage: ${error?.message ?? "sin respuesta"}`);
    const headers: Record<string, string> = {
      "content-type": contentType,
      "x-upsert": "true",
      "cache-control": "max-age=31536000",
    };
    // La clave publicable/anon es pública por diseño; el gateway puede requerirla.
    const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (anon) headers.apikey = anon;
    return {
      method: "PUT",
      uploadUrl: data.signedUrl,
      headers,
      publicUrl: storage.getPublicUrl(path).data.publicUrl,
    };
  },

  async deleteFile(publicUrl: string) {
    const marker = `/storage/v1/object/public/${BUCKET}/`;
    const i = publicUrl.indexOf(marker);
    if (i === -1) return;
    await db().storage.from(BUCKET).remove([publicUrl.slice(i + marker.length)]);
  },
};
