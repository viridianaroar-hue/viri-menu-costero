import type { MetadataRoute } from "next";
import { getMenu, publicDishes } from "@/lib/menu/data";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const menu = await getMenu();
  const base = (menu.settings.publicUrl || process.env.NEXT_PUBLIC_SITE_URL || "").replace(/\/$/, "");
  if (!base) return [];
  return [
    { url: `${base}/` },
    { url: `${base}/menu` },
    ...publicDishes(menu).map((d) => ({ url: `${base}/platillo/${d.slug}`, lastModified: d.updatedAt })),
  ];
}
