import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import { getDriver } from "@/lib/storage";
import type { Category, Dish, Menu } from "./schema";

export const MENU_TAG = "menu";

/**
 * Lectura pública del menú, cacheada.
 * - Se invalida al instante cuando el administrador guarda (updateTag).
 * - Además se revalida cada ~minuto (revalidate: 60 s) por si hay varias instancias.
 */
export async function getMenu(): Promise<Menu> {
  "use cache";
  cacheLife({ stale: 60, revalidate: 60, expire: 3600 });
  cacheTag(MENU_TAG);
  return getDriver().readMenu();
}

/** Lectura sin caché para el panel administrativo. */
export async function getMenuFresh(): Promise<Menu> {
  return getDriver().readMenu();
}

export function visibleCategories(menu: Menu): Category[] {
  return menu.categories.filter((c) => c.visible).sort((a, b) => a.order - b.order);
}

export function dishesByCategory(menu: Menu, categoryId: string): Dish[] {
  return menu.dishes
    .filter((d) => d.categoryId === categoryId)
    .sort((a, b) => a.order - b.order || a.name.localeCompare(b.name, "es"));
}

/** Platillos públicos: los de categorías visibles. Los no disponibles se muestran como "Agotado". */
export function publicDishes(menu: Menu): Dish[] {
  const visible = new Set(visibleCategories(menu).map((c) => c.id));
  return menu.dishes.filter((d) => visible.has(d.categoryId));
}

export function hasPublishedModel(d: Dish): boolean {
  return d.model.status === "publicado" && !!d.model.glbUrl;
}
