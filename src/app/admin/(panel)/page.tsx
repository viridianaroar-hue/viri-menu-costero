import Link from "next/link";
import { DishTable } from "@/components/admin/DishTable";
import { requireAdmin } from "@/lib/auth/server";
import { getMenuFresh } from "@/lib/menu/data";

export default async function AdminHome() {
  await requireAdmin();
  const menu = await getMenuFresh();
  const d = menu.dishes;
  const stats = [
    { label: "Platillos", value: d.length },
    { label: "Con foto", value: d.filter((x) => x.photos.length).length },
    { label: "Modelo 3D publicado", value: d.filter((x) => x.model.status === "publicado" && x.model.glbUrl).length },
    { label: "Alérgenos confirmados", value: d.filter((x) => x.allergensVerified).length },
    { label: "Sin precio", value: d.filter((x) => x.price === null).length, warn: true },
    { label: "Contenido demo", value: d.filter((x) => x.isDemo).length, warn: true },
  ];
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-semibold text-brand-dark">Platillos</h1>
          <p className="text-sm text-muted">Edita, ordena y marca como agotado. Los cambios se publican al guardar.</p>
        </div>
        <Link href="/admin/platillos/nuevo" className="inline-flex h-10 items-center rounded-xl bg-brand px-4 text-sm font-semibold text-white">
          + Nuevo platillo
        </Link>
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {stats.map((s) => (
          <div key={s.label} className="rounded-2xl border border-line bg-white p-4">
            <p className={`text-2xl font-semibold ${s.warn && s.value > 0 ? "text-amber-700" : "text-brand-dark"}`}>{s.value}</p>
            <p className="text-xs text-muted">{s.label}</p>
          </div>
        ))}
      </div>
      <DishTable
        categories={[...menu.categories].sort((a, b) => a.order - b.order)}
        dishes={menu.dishes}
        currency={menu.settings.currency}
      />
    </div>
  );
}
