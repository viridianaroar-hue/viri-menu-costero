"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { deleteCategory, moveCategory, saveCategory } from "@/app/admin/actions";
import type { Category } from "@/lib/menu/schema";

const input = "h-10 rounded-xl border border-line bg-white px-3 text-base sm:text-sm outline-none focus:border-brand";

export function CategoryManager({ categories, counts }: { categories: Category[]; counts: Record<string, number> }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [newName, setNewName] = useState("");

  const run = (fn: () => Promise<{ ok: boolean; error?: string }>) =>
    start(async () => {
      const r = await fn();
      setError(r.ok ? null : (r.error ?? "Error"));
      router.refresh();
    });

  return (
    <div className={`max-w-2xl space-y-3 ${pending ? "opacity-70" : ""}`}>
      {error && <p className="rounded-xl bg-red-50 p-3 text-sm text-red-700" role="alert">{error}</p>}
      {categories.map((c, i) => (
        <Row key={c.id} c={c} count={counts[c.id] ?? 0} first={i === 0} last={i === categories.length - 1} run={run} />
      ))}
      <form
        className="flex gap-2 rounded-2xl border border-dashed border-line bg-white p-3"
        onSubmit={(e) => {
          e.preventDefault();
          if (!newName.trim()) return;
          run(() => saveCategory({ name: newName.trim() }));
          setNewName("");
        }}
      >
        <input className={`${input} flex-1`} placeholder="Nueva categoría (ej. Mariscos)" value={newName} onChange={(e) => setNewName(e.target.value)} data-testid="new-category" />
        <button className="rounded-xl bg-brand px-4 text-sm font-semibold text-white">Agregar</button>
      </form>
    </div>
  );
}

function Row({ c, count, first, last, run }: { c: Category; count: number; first: boolean; last: boolean; run: (fn: () => Promise<{ ok: boolean; error?: string }>) => void }) {
  const [name, setName] = useState(c.name);
  const [desc, setDesc] = useState(c.description);
  const dirty = name !== c.name || desc !== c.description;
  return (
    <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-line bg-white p-3">
      <div className="flex flex-col">
        <button disabled={first} onClick={() => run(() => moveCategory(c.id, -1))} className="px-1 text-xs text-muted disabled:opacity-25" aria-label="Subir">▲</button>
        <button disabled={last} onClick={() => run(() => moveCategory(c.id, 1))} className="px-1 text-xs text-muted disabled:opacity-25" aria-label="Bajar">▼</button>
      </div>
      <input className={`${input} w-40 flex-1`} value={name} onChange={(e) => setName(e.target.value)} aria-label="Nombre" />
      <input className={`${input} w-48 flex-[2]`} value={desc} onChange={(e) => setDesc(e.target.value)} placeholder="Descripción (opcional)" aria-label="Descripción" />
      <span className="w-20 text-xs text-muted">{count} platillo{count === 1 ? "" : "s"}</span>
      <label className="flex items-center gap-1 text-xs">
        <input type="checkbox" checked={c.visible} onChange={(e) => run(() => saveCategory({ ...c, visible: e.target.checked }))} /> Visible
      </label>
      {dirty && <button onClick={() => run(() => saveCategory({ ...c, name, description: desc }))} className="rounded-lg bg-brand px-3 py-1.5 text-xs text-white">Guardar</button>}
      <button
        onClick={() => confirm(`¿Eliminar la categoría «${c.name}»?`) && run(() => deleteCategory(c.id))}
        className="text-xs text-red-700"
      >
        Eliminar
      </button>
    </div>
  );
}
