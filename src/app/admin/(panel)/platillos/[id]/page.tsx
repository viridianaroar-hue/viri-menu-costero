import { notFound } from "next/navigation";
import { DishEditor } from "@/components/admin/DishEditor";
import { requireAdmin } from "@/lib/auth/server";
import { getMenuFresh } from "@/lib/menu/data";

export async function generateStaticParams() {
  return [{ id: "nuevo" }];
}

export default async function EditDishPage({ params, searchParams }: PageProps<"/admin/platillos/[id]">) {
  await requireAdmin();
  const { id } = await params;
  const { guardado } = await searchParams;
  const menu = await getMenuFresh();
  const dish = id === "nuevo" ? null : menu.dishes.find((d) => d.id === id);
  if (id !== "nuevo" && !dish) notFound();
  const categories = [...menu.categories].sort((a, b) => a.order - b.order);
  if (!categories.length) {
    return <p className="rounded-2xl bg-white p-6 text-sm">Primero crea una categoría en la pestaña «Categorías».</p>;
  }
  return <DishEditor key={dish?.id ?? "nuevo"} dish={dish ?? null} categories={categories} justSaved={guardado === "1"} />;
}
