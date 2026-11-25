"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { IconCube, IconSearch, IconX } from "@/components/icons";
import { normalizeText } from "@/lib/format";
import type { Category } from "@/lib/menu/schema";
import { DishCard, type DishSummary } from "./DishCard";

type Props = { categories: Category[]; dishes: DishSummary[]; currency: string };

export function MenuBrowser({ categories, dishes, currency }: Props) {
  const [query, setQuery] = useState("");
  const [only3d, setOnly3d] = useState(false);
  const [onlyAvailable, setOnlyAvailable] = useState(false);
  const [active, setActive] = useState<string | undefined>(categories[0]?.id);
  const chipsRef = useRef<HTMLDivElement>(null);

  const q = normalizeText(query.trim());
  const filtered = useMemo(
    () =>
      dishes.filter(
        (d) =>
          (!only3d || d.has3d) &&
          (!onlyAvailable || d.available) &&
          (!q || normalizeText(`${d.name} ${d.description} ${d.tags.join(" ")}`).includes(q)),
      ),
    [dishes, only3d, onlyAvailable, q],
  );
  const searching = q.length > 0 || only3d || onlyAvailable;
  const count3d = dishes.filter((d) => d.has3d).length;

  // Resalta la categoría visible al hacer scroll.
  useEffect(() => {
    if (searching) return;
    const sections = categories
      .map((c) => document.getElementById(`cat-${c.slug}`))
      .filter((el): el is HTMLElement => !!el);
    const io = new IntersectionObserver(
      (entries) => {
        const top = entries.filter((e) => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];
        if (top) setActive(top.target.getAttribute("data-cat") ?? undefined);
      },
      { rootMargin: "-140px 0px -60% 0px" },
    );
    sections.forEach((s) => io.observe(s));
    return () => io.disconnect();
  }, [categories, searching]);

  const firstRun = useRef(true);
  useEffect(() => {
    if (firstRun.current) {
      firstRun.current = false;
      return;
    }
    const chip = chipsRef.current?.querySelector<HTMLElement>(`[data-chip="${active}"]`);
    chip?.scrollIntoView({ block: "nearest", inline: "center", behavior: "smooth" });
  }, [active]);

  return (
    <>
      <div className="sticky top-0 z-20 border-b border-line/70 bg-surface/92 backdrop-blur-md">
        <div className="mx-auto max-w-3xl px-4 pt-3 pb-2">
          <label className="relative block">
            <span className="sr-only">Buscar platillo</span>
            <IconSearch className="pointer-events-none absolute top-1/2 left-3.5 h-4.5 w-4.5 -translate-y-1/2 text-muted" />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar platillo o ingrediente"
              className="h-11 w-full rounded-full border border-line bg-white pr-10 pl-10 text-base outline-none placeholder:text-muted/70 focus:border-brand/40"
              enterKeyHint="search"
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery("")}
                className="absolute top-1/2 right-2 grid h-8 w-8 -translate-y-1/2 place-items-center rounded-full text-muted"
                aria-label="Borrar búsqueda"
              >
                <IconX className="h-4 w-4" />
              </button>
            )}
          </label>
          <div ref={chipsRef} className="no-scrollbar -mx-4 mt-2.5 flex gap-2 overflow-x-auto px-4 pb-1">
            {count3d > 0 && (
              <button
                type="button"
                aria-pressed={only3d}
                onClick={() => setOnly3d((v) => !v)}
                className={`inline-flex shrink-0 items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-sm font-medium transition ${only3d ? "border-brand bg-brand text-white" : "border-brand/25 bg-white text-brand"}`}
              >
                <IconCube className="h-4 w-4" /> En 3D
              </button>
            )}
            <button
              type="button"
              aria-pressed={onlyAvailable}
              onClick={() => setOnlyAvailable((v) => !v)}
              className={`shrink-0 rounded-full border px-3.5 py-1.5 text-sm font-medium transition ${onlyAvailable ? "border-brand bg-brand text-white" : "border-line bg-white text-ink"}`}
            >
              Disponibles
            </button>
            <span className="mx-0.5 my-1.5 w-px shrink-0 bg-line" aria-hidden />
            {categories.map((c) => (
              <a
                key={c.id}
                href={`#cat-${c.slug}`}
                data-chip={c.id}
                onClick={() => {
                  setQuery("");
                  setOnly3d(false);
                  setOnlyAvailable(false);
                }}
                className={`shrink-0 rounded-full px-3.5 py-1.5 text-sm transition ${!searching && active === c.id ? "bg-brand-dark font-semibold text-white" : "text-ink/80"}`}
              >
                {c.name}
              </a>
            ))}
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-3xl px-4">
        {searching ? (
          <section className="pt-5" aria-live="polite">
            <p className="mb-3 text-sm text-muted">
              {filtered.length === 0 ? "Sin resultados." : `${filtered.length} platillo${filtered.length === 1 ? "" : "s"}`}
            </p>
            <div className="grid gap-3 md:grid-cols-2">
              {filtered.map((d) => (
                <DishCard key={d.id} dish={d} currency={currency} />
              ))}
            </div>
          </section>
        ) : (
          categories.map((c) => {
            const items = dishes.filter((d) => d.categoryId === c.id);
            if (!items.length) return null;
            return (
              <section key={c.id} id={`cat-${c.slug}`} data-cat={c.id} className="pt-7">
                <div className="mb-3 flex items-baseline gap-3">
                  <h2 className="font-display text-2xl font-semibold text-brand-dark">{c.name}</h2>
                  <span className="h-px flex-1 bg-gradient-to-r from-accent/60 to-transparent" />
                </div>
                {c.description && <p className="-mt-1 mb-3 text-sm text-muted">{c.description}</p>}
                <div className="grid gap-3 md:grid-cols-2">
                  {items.map((d) => (
                    <DishCard key={d.id} dish={d} currency={currency} />
                  ))}
                </div>
              </section>
            );
          })
        )}
      </div>
    </>
  );
}
