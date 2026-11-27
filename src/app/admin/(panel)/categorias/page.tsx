import { CategoryManager } from "@/components/admin/CategoryManager";
import { requireAdmin } from "@/lib/auth/server";
import { getMenuFresh } from "@/lib/menu/data";

export default async function CategoriesPage() {
  await requireAdmin();
  const menu = await getMenuFresh();
  const counts = Object.fromEntries(menu.categories.map((c) => [c.id, menu.dishes.filter((d) => d.categoryId === c.id).length]));
  return (
    <div>
      <h1 className="font-display text-3xl font-semibold text-brand-dark">Categorías</h1>
      <p className="mb-5 text-sm text-muted">El orden aquí es el orden del menú. Las categorías ocultas no aparecen al cliente.</p>
      <CategoryManager categories={[...menu.categories].sort((a, b) => a.order - b.order)} counts={counts} />
    </div>
  );
}
