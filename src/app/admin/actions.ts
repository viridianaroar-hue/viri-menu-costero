"use server";

import { updateTag } from "next/cache";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth/server";
import { checkPassword, createSessionToken, SESSION_COOKIE, SESSION_TTL_SECONDS } from "@/lib/auth/session";
import { getMenuFresh, MENU_TAG } from "@/lib/menu/data";
import { categorySchema, dishSchema, menuSchema, settingsSchema, slugify, type Menu } from "@/lib/menu/schema";
import { getDriver, StorageError, type UploadTicket } from "@/lib/storage";
import { allowedUploadType, uploadPath } from "@/lib/uploads";

export type ActionResult<T = undefined> = { ok: true; data?: T } | { ok: false; error: string };

function fail(err: unknown): { ok: false; error: string } {
  if (err instanceof z.ZodError) {
    const first = err.issues[0];
    return { ok: false, error: `Dato inválido en «${first.path.join(".")}»: ${first.message}` };
  }
  if (err instanceof StorageError) return { ok: false, error: [err.message, err.hint].filter(Boolean).join(" ") };
  if (err instanceof Error) return { ok: false, error: err.message };
  return { ok: false, error: "Error inesperado" };
}

async function mutate(fn: (menu: Menu) => Menu | void): Promise<Menu> {
  await requireAdmin();
  const menu = structuredClone(await getMenuFresh());
  const next = fn(menu) ?? menu;
  next.updatedAt = new Date().toISOString();
  await getDriver().writeMenu(menuSchema.parse(next));
  updateTag(MENU_TAG);
  return next;
}

// ───────────── Sesión ─────────────

const failures = new Map<string, { count: number; until: number }>();

export async function login(_prev: { error?: string } | undefined, form: FormData): Promise<{ error?: string }> {
  const ip = (await headers()).get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
  const f = failures.get(ip);
  if (f && f.until > Date.now()) {
    return { error: "Demasiados intentos. Espera un minuto." };
  }
  if (!process.env.ADMIN_PASSWORD) {
    return { error: "Falta configurar ADMIN_PASSWORD en el servidor." };
  }
  const ok = await checkPassword(String(form.get("password") ?? ""));
  if (!ok) {
    const count = (f?.count ?? 0) + 1;
    failures.set(ip, { count, until: count >= 5 ? Date.now() + 60_000 : 0 });
    await new Promise((r) => setTimeout(r, 600));
    return { error: "Contraseña incorrecta." };
  }
  failures.delete(ip);
  (await cookies()).set(SESSION_COOKIE, await createSessionToken(), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_TTL_SECONDS,
  });
  redirect("/admin");
}

export async function logout() {
  (await cookies()).delete(SESSION_COOKIE);
  redirect("/admin/login");
}

// ───────────── Platillos ─────────────

export async function saveDish(input: unknown): Promise<ActionResult<{ id: string; slug: string }>> {
  try {
    const raw = input as Record<string, unknown>;
    const isNew = !raw.id || raw.id === "nuevo";
    let saved = { id: "", slug: "" };
    await mutate((menu) => {
      const id = isNew ? `p-${Date.now().toString(36)}` : String(raw.id);
      const baseSlug = slugify(String(raw.slug || raw.name || "platillo")) || "platillo";
      let slug = baseSlug;
      for (let i = 2; menu.dishes.some((d) => d.slug === slug && d.id !== id); i++) slug = `${baseSlug}-${i}`;
      const existing = menu.dishes.find((d) => d.id === id);
      const dish = dishSchema.parse({
        ...existing,
        ...raw,
        id,
        slug,
        order: existing?.order ?? menu.dishes.filter((d) => d.categoryId === raw.categoryId).length,
        updatedAt: new Date().toISOString(),
      });
      if (!menu.categories.some((c) => c.id === dish.categoryId)) throw new Error("La categoría no existe.");
      if (existing) menu.dishes[menu.dishes.indexOf(existing)] = dish;
      else menu.dishes.push(dish);
      saved = { id, slug };
    });
    return { ok: true, data: saved };
  } catch (err) {
    return fail(err);
  }
}

export async function deleteDish(id: string): Promise<ActionResult> {
  try {
    await mutate((menu) => {
      menu.dishes = menu.dishes.filter((d) => d.id !== id);
    });
    return { ok: true };
  } catch (err) {
    return fail(err);
  }
}

export async function setAvailability(id: string, available: boolean): Promise<ActionResult> {
  try {
    await mutate((menu) => {
      const d = menu.dishes.find((x) => x.id === id);
      if (!d) throw new Error("Platillo no encontrado");
      d.available = available;
      d.updatedAt = new Date().toISOString();
    });
    return { ok: true };
  } catch (err) {
    return fail(err);
  }
}

export async function moveDish(id: string, dir: -1 | 1): Promise<ActionResult> {
  try {
    await mutate((menu) => {
      const d = menu.dishes.find((x) => x.id === id);
      if (!d) return;
      const list = menu.dishes.filter((x) => x.categoryId === d.categoryId).sort((a, b) => a.order - b.order);
      list.forEach((x, i) => (x.order = i));
      const j = list.indexOf(d) + dir;
      if (j < 0 || j >= list.length) return;
      [list[j].order, d.order] = [d.order, list[j].order];
    });
    return { ok: true };
  } catch (err) {
    return fail(err);
  }
}

// ───────────── Categorías ─────────────

export async function saveCategory(input: unknown): Promise<ActionResult> {
  try {
    await mutate((menu) => {
      const raw = input as Record<string, unknown>;
      const id = raw.id ? String(raw.id) : `cat-${Date.now().toString(36)}`;
      const existing = menu.categories.find((c) => c.id === id);
      const cat = categorySchema.parse({
        ...existing,
        ...raw,
        id,
        slug: slugify(String(raw.slug || raw.name || "categoria")),
        order: existing?.order ?? menu.categories.length,
      });
      if (menu.categories.some((c) => c.slug === cat.slug && c.id !== id)) throw new Error("Ya existe una categoría con ese nombre.");
      if (existing) menu.categories[menu.categories.indexOf(existing)] = cat;
      else menu.categories.push(cat);
    });
    return { ok: true };
  } catch (err) {
    return fail(err);
  }
}

export async function deleteCategory(id: string): Promise<ActionResult> {
  try {
    await mutate((menu) => {
      if (menu.dishes.some((d) => d.categoryId === id)) {
        throw new Error("La categoría tiene platillos. Muévelos o elimínalos primero.");
      }
      menu.categories = menu.categories.filter((c) => c.id !== id);
    });
    return { ok: true };
  } catch (err) {
    return fail(err);
  }
}

export async function moveCategory(id: string, dir: -1 | 1): Promise<ActionResult> {
  try {
    await mutate((menu) => {
      const list = [...menu.categories].sort((a, b) => a.order - b.order);
      const i = list.findIndex((c) => c.id === id);
      const j = i + dir;
      if (i < 0 || j < 0 || j >= list.length) return;
      [list[i], list[j]] = [list[j], list[i]];
      list.forEach((c, k) => (c.order = k));
      menu.categories = list;
    });
    return { ok: true };
  } catch (err) {
    return fail(err);
  }
}

// ───────────── Ajustes e importación ─────────────

export async function saveSettings(input: unknown): Promise<ActionResult> {
  try {
    await mutate((menu) => {
      menu.settings = settingsSchema.parse(input);
    });
    return { ok: true };
  } catch (err) {
    return fail(err);
  }
}

/** Reemplaza el menú completo con un JSON validado (carga masiva del menú real). */
export async function importMenu(json: string): Promise<ActionResult<{ dishes: number; categories: number }>> {
  try {
    const parsed = menuSchema.parse(JSON.parse(json));
    const ids = new Set(parsed.categories.map((c) => c.id));
    const orphan = parsed.dishes.find((d) => !ids.has(d.categoryId));
    if (orphan) throw new Error(`El platillo «${orphan.name}» apunta a una categoría inexistente (${orphan.categoryId}).`);
    await mutate(() => parsed);
    return { ok: true, data: { dishes: parsed.dishes.length, categories: parsed.categories.length } };
  } catch (err) {
    if (err instanceof SyntaxError) return { ok: false, error: "El archivo no es un JSON válido." };
    return fail(err);
  }
}

// ───────────── Archivos ─────────────

export async function createUploadTicket(
  folder: "fotos" | "modelos",
  base: string,
  fileName: string,
  contentType: string,
): Promise<ActionResult<UploadTicket>> {
  try {
    await requireAdmin();
    const path = uploadPath(folder, base, fileName);
    if (!allowedUploadType(path, contentType)) throw new Error("Tipo de archivo no permitido (JPG, PNG, WebP, AVIF, GLB o USDZ).");
    return { ok: true, data: await getDriver().prepareUpload(path, contentType) };
  } catch (err) {
    return fail(err);
  }
}
