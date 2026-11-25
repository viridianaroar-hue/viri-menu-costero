import type { Metadata } from "next";
import Link from "next/link";
import { toSummary } from "@/components/public/DishCard";
import { MenuBrowser } from "@/components/public/MenuBrowser";
import { getMenu, publicDishes, visibleCategories } from "@/lib/menu/data";

export const metadata: Metadata = { title: "Menú" };

export default async function MenuPage() {
  const menu = await getMenu();
  const categories = visibleCategories(menu);
  const order = new Map(categories.map((c, i) => [c.id, i]));
  const dishes = publicDishes(menu)
    .sort((a, b) => (order.get(a.categoryId)! - order.get(b.categoryId)!) || a.order - b.order)
    .map(toSummary);

  return (
    <>
      <header className="mx-auto flex max-w-3xl items-end justify-between px-4 pt-6 pb-1">
        <div>
          <Link href="/" className="text-xs font-semibold tracking-[0.24em] text-accent-ink uppercase">
            {menu.settings.restaurantName}
          </Link>
          <h1 className="font-display text-3xl font-semibold text-brand-dark">Menú</h1>
        </div>
      </header>
      <MenuBrowser categories={categories} dishes={dishes} currency={menu.settings.currency} />
    </>
  );
}
