"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { moveDish, setAvailability } from "@/app/admin/actions";
import { formatPrice } from "@/lib/format";
import { MODEL_STATUS_LABELS, type Category, type Dish } from "@/lib/menu/schema";

const statusColor: Record<string, string> = {
  sin_modelo: "bg-zinc-100 text-zinc-600",
  fotos_recibidas: "bg-sky-50 text-sky-700",
  en_produccion: "bg-amber-50 text-amber-700",
  en_revision: "bg-violet-50 text-violet-700",
  publicado: "bg-emerald-50 text-emerald-700",
};

export function DishTable({ categories, dishes, currency }: { categories: Category[]; dishes: Dish[]; currency: string }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [q, setQ] = useState("");

  const run = (fn: () => Promise<{ ok: boolean; error?: string }>) =>
    start(async () => {
      const r = await fn();
      setError(r.ok ? null : (r.error ?? "Error"));
      router.refresh();
    });

  const match = (d: Dish) => !q || d.name.toLowerCase().includes(q.toLowerCase());

  return (
    <div className={pending ? "opacity-70 transition" : "transition"}>
      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Filtrar por nombre…"
        className="mb-4 h-10 w-full max-w-xs rounded-xl border border-line bg-white px-3 text-base sm:text-sm outline-none focus:border-brand"
      />
      {error && <p className="mb-3 rounded-xl bg-red-50 p-3 text-sm text-red-700" role="alert">{error}</p>}
      <div className="space-y-6">
        {categories.map((c) => {
          const list = dishes.filter((d) => d.categoryId === c.id && match(d)).sort((a, b) => a.order - b.order);
          return (
            <section key={c.id}>
              <h2 className="mb-2 text-sm font-semibold tracking-wide text-muted uppercase">
                {c.name} {!c.visible && <span className="ml-1 rounded bg-zinc-200 px-1.5 text-[0.65rem]">oculta</span>}
              </h2>
              <div className="overflow-hidden rounded-2xl border border-line bg-white">
                {list.length === 0 && <p className="p-4 text-sm text-muted">Sin platillos.</p>}
                {list.map((d, i) => (
                  <div key={d.id} className="flex items-center gap-3 border-b border-line p-3 last:border-0" data-testid="admin-dish-row">
                    <div className="flex flex-col">
                      <button disabled={i === 0} onClick={() => run(() => moveDish(d.id, -1))} className="px-1 text-xs text-muted disabled:opacity-25" aria-label={`Subir ${d.name}`}>▲</button>
                      <button disabled={i === list.length - 1} onClick={() => run(() => moveDish(d.id, 1))} className="px-1 text-xs text-muted disabled:opacity-25" aria-label={`Bajar ${d.name}`}>▼</button>
                    </div>
                    <div className="h-11 w-11 shrink-0 overflow-hidden rounded-lg bg-brand-dark">
                      {d.photos[0] && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={d.photos[0].url} alt="" className="h-full w-full object-cover" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <Link href={`/admin/platillos/${d.id}`} className="font-medium text-brand-dark hover:underline">{d.name}</Link>
                      <div className="mt-0.5 flex flex-wrap gap-1.5 text-[0.68rem]">
                        <span className={`rounded-full px-2 py-0.5 ${statusColor[d.model.status]}`}>3D: {MODEL_STATUS_LABELS[d.model.status]}</span>
                        {d.isDemo && <span className="rounded-full bg-amber-100 px-2 py-0.5 text-amber-800">Demo</span>}
                        {!d.allergensVerified && <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-zinc-600">Alérgenos sin confirmar</span>}
                      </div>
                    </div>
                    <span className="hidden w-24 text-right text-sm text-ink sm:block">{formatPrice(d.price, currency)}</span>
                    <AvailabilityToggle dish={d} onChange={(v) => run(() => setAvailability(d.id, v))} />
                  </div>
                ))}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}

/** Cambio optimista: el interruptor responde al instante y se sincroniza con el servidor. */
function AvailabilityToggle({ dish, onChange }: { dish: Dish; onChange: (v: boolean) => void }) {
  const [on, setOn] = useState(dish.available);
  const [prev, setPrev] = useState(dish.available);
  if (prev !== dish.available) {
    setPrev(dish.available);
    setOn(dish.available);
  }
  return (
    <label className="flex cursor-pointer items-center gap-2 text-xs text-muted">
      <input
        type="checkbox"
        checked={on}
        onChange={(e) => {
          setOn(e.target.checked);
          onChange(e.target.checked);
        }}
        className="peer sr-only"
        aria-label={`Disponible: ${dish.name}`}
      />
      <span className="relative h-6 w-10 rounded-full bg-zinc-300 transition peer-checked:bg-emerald-600 after:absolute after:top-0.5 after:left-0.5 after:h-5 after:w-5 after:rounded-full after:bg-white after:transition peer-checked:after:translate-x-4" />
      <span className="hidden w-16 md:inline">{on ? "Disponible" : "Agotado"}</span>
    </label>
  );
}
