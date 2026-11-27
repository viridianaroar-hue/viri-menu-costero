import { mkdir, readFile, rename, unlink, writeFile } from "node:fs/promises";
import { dirname, join, normalize } from "node:path";
import { menuSchema, type Menu } from "@/lib/menu/schema";
import { StorageError, type StorageDriver, type UploadTicket } from "./types";

/**
 * Driver local: guarda el menú en data/menu.json y los archivos en data/uploads.
 * Ideal para desarrollo y para servidores con disco persistente (VPS, Railway, Render con volumen).
 * En hosting serverless (Vercel/Netlify) el disco es de solo lectura: usar Supabase.
 */
// MENU_DATA_DIR permite apuntar a un volumen persistente (o a un directorio temporal en pruebas).
const DATA_DIR = process.env.MENU_DATA_DIR || join(process.cwd(), "data");
const MENU_FILE = join(DATA_DIR, "menu.json");
const SEED_FILE = join(process.cwd(), "data", "seed.json");
export const UPLOAD_DIR = join(DATA_DIR, "uploads");
export const LOCAL_FILES_PREFIX = "/api/files/";

export function resolveUploadPath(relPath: string): string {
  const clean = normalize(relPath).replace(/^([/\\])+/, "");
  if (clean.startsWith("..") || clean.includes("\0")) {
    throw new StorageError("Ruta de archivo inválida");
  }
  return join(UPLOAD_DIR, clean);
}

async function readJson(file: string): Promise<unknown | null> {
  try {
    return JSON.parse(await readFile(file, "utf8"));
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === "ENOENT") return null;
    throw err;
  }
}

function wrapWriteError(err: unknown): never {
  const code = (err as NodeJS.ErrnoException).code;
  if (code === "EROFS" || code === "EACCES" || code === "EPERM") {
    throw new StorageError(
      "Este servidor no permite guardar archivos en disco.",
      "Configura Supabase (SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY) para editar el menú en producción.",
    );
  }
  throw err;
}

export const fileDriver: StorageDriver = {
  name: "file",

  async readMenu() {
    const raw = (await readJson(MENU_FILE)) ?? (await readJson(SEED_FILE));
    if (!raw) throw new StorageError("No existe data/seed.json ni data/menu.json");
    return menuSchema.parse(raw);
  },

  async writeMenu(menu: Menu) {
    const data = JSON.stringify(menuSchema.parse(menu), null, 2);
    try {
      await mkdir(DATA_DIR, { recursive: true });
      const tmp = `${MENU_FILE}.${process.pid}.tmp`;
      await writeFile(tmp, data, "utf8");
      await rename(tmp, MENU_FILE); // escritura atómica
    } catch (err) {
      wrapWriteError(err);
    }
  },

  async prepareUpload(path: string, contentType: string): Promise<UploadTicket> {
    resolveUploadPath(path); // valida
    return {
      method: "PUT",
      uploadUrl: `/api/admin/upload/${path}`,
      headers: { "content-type": contentType },
      publicUrl: `${LOCAL_FILES_PREFIX}${path}`,
    };
  },

  async deleteFile(publicUrl: string) {
    if (!publicUrl.startsWith(LOCAL_FILES_PREFIX)) return;
    try {
      await unlink(resolveUploadPath(publicUrl.slice(LOCAL_FILES_PREFIX.length)));
    } catch {
      /* ya no existe */
    }
  },
};

export async function saveLocalUpload(relPath: string, body: ArrayBuffer) {
  const target = resolveUploadPath(relPath);
  try {
    await mkdir(dirname(target), { recursive: true });
    await writeFile(target, Buffer.from(body));
  } catch (err) {
    wrapWriteError(err);
  }
}
