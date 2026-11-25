"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { deleteDish, saveDish } from "@/app/admin/actions";
import { loadModelViewer } from "@/components/viewer/DishViewer";
import {
  ALLERGEN_LABELS,
  ALLERGENS,
  MODEL_SOURCE_LABELS,
  MODEL_SOURCES,
  MODEL_STATUS,
  MODEL_STATUS_LABELS,
  type Allergen,
  type Category,
  type Dish,
  type Media,
  type ModelReport,
} from "@/lib/menu/schema";
import { evaluateModel } from "@/lib/model/budgets";
import { inspectGlb } from "@/lib/model/inspect-glb";
import { prepareImage, uploadFile } from "./upload-client";

type Draft = Omit<Dish, "updatedAt" | "order"> & { order?: number };

function emptyDish(categoryId: string): Draft {
  return {
    id: "nuevo",
    slug: "",
    name: "",
    categoryId,
    description: "",
    price: null,
    photos: [],
    model: { status: "sin_modelo", notes: "" },
    dimensions: { verified: false, notes: "" },
    available: true,
    featured: false,
    tags: [],
    ingredients: [],
    ingredientsVerified: false,
    allergens: [],
    allergensVerified: false,
    effects: { steam: false },
    isDemo: false,
  };
}

const input = "mt-1 h-10 w-full rounded-xl border border-line bg-white px-3 text-base sm:text-sm outline-none focus:border-brand";
const card = "rounded-2xl border border-line bg-white p-5";
const h2 = "mb-4 font-display text-lg font-semibold text-brand-dark";

const splitList = (s: string) => s.split(",").map((x) => x.trim()).filter(Boolean);

export function DishEditor({ dish, categories }: { dish: Dish | null; categories: Category[] }) {
  const router = useRouter();
  const [d, setD] = useState<Draft>(() => dish ?? emptyDish(categories[0].id));
  const [tagsText, setTagsText] = useState(d.tags.join(", "));
  const [ingText, setIngText] = useState(d.ingredients.join(", "));
  const [msg, setMsg] = useState<{ type: "ok" | "error"; text: string } | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [saving, start] = useTransition();

  const set = <K extends keyof Draft>(k: K, v: Draft[K]) => setD((x) => ({ ...x, [k]: v }));
  const setModel = (patch: Partial<Draft["model"]>) => setD((x) => ({ ...x, model: { ...x.model, ...patch } }));
  const setDims = (patch: Partial<Draft["dimensions"]>) => setD((x) => ({ ...x, dimensions: { ...x.dimensions, ...patch } }));
  const base = d.slug || d.name || "platillo";

  async function onPhotos(files: FileList | null) {
    if (!files?.length) return;
    setBusy("Subiendo fotos…");
    setMsg(null);
    try {
      const added: Media[] = [];
      for (const f of Array.from(files)) {
        const img = await prepareImage(f);
        const url = await uploadFile(img.file, "fotos", base, "image");
        added.push({ url, alt: d.name, width: img.width, height: img.height });
      }
      setD((x) => ({ ...x, photos: [...x.photos, ...added] }));
      setMsg({ type: "ok", text: `${added.length} foto(s) subida(s). Recuerda guardar.` });
    } catch (e) {
      setMsg({ type: "error", text: (e as Error).message });
    } finally {
      setBusy(null);
    }
  }

  async function onGlb(file: File | undefined) {
    if (!file) return;
    setBusy("Analizando y subiendo modelo…");
    setMsg(null);
    try {
      let report: ModelReport;
      try {
        report = inspectGlb(await file.arrayBuffer());
      } catch (e) {
        throw new Error(`Modelo inválido: ${(e as Error).message}`);
      }
      const url = await uploadFile(file, "modelos", base, "glb");
      setModel({ glbUrl: url, report, status: d.model.status === "sin_modelo" ? "en_revision" : d.model.status });
      setMsg({ type: "ok", text: "Modelo subido. Revisa el reporte y la vista previa; publícalo cuando esté aprobado." });
    } catch (e) {
      setMsg({ type: "error", text: (e as Error).message });
    } finally {
      setBusy(null);
    }
  }

  async function onUsdz(file: File | undefined) {
    if (!file) return;
    setBusy("Subiendo USDZ…");
    try {
      setModel({ usdzUrl: await uploadFile(file, "modelos", base, "usdz") });
    } catch (e) {
      setMsg({ type: "error", text: (e as Error).message });
    } finally {
      setBusy(null);
    }
  }

  function onSave() {
    const payload = { ...d, tags: splitList(tagsText), ingredients: splitList(ingText) };
    if (payload.model.status === "publicado" && !payload.model.glbUrl) {
      setMsg({ type: "error", text: "No puedes publicar el 3D sin subir un archivo GLB." });
      return;
    }
    start(async () => {
      const r = await saveDish(payload);
      if (!r.ok) {
        setMsg({ type: "error", text: r.error });
        return;
      }
      setMsg({ type: "ok", text: "Guardado y publicado." });
      if (d.id === "nuevo") router.replace(`/admin/platillos/${r.data!.id}`);
      else router.refresh();
      setD((x) => ({ ...x, id: r.data!.id, slug: r.data!.slug }));
    });
  }

  function onDelete() {
    if (!confirm(`¿Eliminar «${d.name}» del menú? Esta acción no se puede deshacer.`)) return;
    start(async () => {
      const r = await deleteDish(d.id);
      if (r.ok) router.push("/admin");
      else setMsg({ type: "error", text: r.error });
    });
  }

  const checks = d.model.report ? evaluateModel(d.model.report, d.dimensions) : [];

  return (
    <div className="pb-28">
      <div className="mb-5 flex items-center justify-between gap-3">
        <div>
          <Link href="/admin" className="text-sm text-brand">← Platillos</Link>
          <h1 className="font-display text-2xl font-semibold text-brand-dark">{d.id === "nuevo" ? "Nuevo platillo" : d.name}</h1>
        </div>
        {d.id !== "nuevo" && (
          <Link href={`/platillo/${d.slug}`} target="_blank" className="text-sm text-brand">Ver en el menú ↗</Link>
        )}
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]">
        <div className="min-w-0 space-y-5">
          <section className={card}>
            <h2 className={h2}>Información básica</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="sm:col-span-2 text-sm">Nombre *
                <input className={input} value={d.name} onChange={(e) => set("name", e.target.value)} required maxLength={120} data-testid="f-name" />
              </label>
              <label className="text-sm">Categoría
                <select className={input} value={d.categoryId} onChange={(e) => set("categoryId", e.target.value)}>
                  {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </label>
              <label className="text-sm">Precio (vacío = por confirmar)
                <input
                  className={input}
                  type="number"
                  min={0}
                  step="0.5"
                  inputMode="decimal"
                  value={d.price ?? ""}
                  onChange={(e) => set("price", e.target.value === "" ? null : Number(e.target.value))}
                  data-testid="f-price"
                />
              </label>
              <label className="sm:col-span-2 text-sm">Descripción <span className="text-muted">({d.description.length}/600)</span>
                <textarea className={`${input} h-24 py-2`} maxLength={600} value={d.description} onChange={(e) => set("description", e.target.value)} />
              </label>
              <label className="sm:col-span-2 text-sm">Etiquetas (separadas por coma)
                <input className={input} value={tagsText} onChange={(e) => setTagsText(e.target.value)} placeholder="Picante, Para compartir" />
              </label>
              <div className="sm:col-span-2 flex flex-wrap gap-5 text-sm">
                <Check label="Disponible hoy" checked={d.available} onChange={(v) => set("available", v)} />
                <Check label="Destacado en inicio" checked={d.featured} onChange={(v) => set("featured", v)} />
                <Check label="Contenido de demostración" checked={d.isDemo} onChange={(v) => set("isDemo", v)} />
              </div>
            </div>
          </section>

          <section className={card}>
            <h2 className={h2}>Fotografías</h2>
            <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
              {d.photos.map((p, i) => (
                <div key={p.url} className="group relative aspect-square overflow-hidden rounded-xl bg-surface">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={p.url} alt={p.alt} className="h-full w-full object-cover" />
                  {i === 0 && <span className="absolute top-1 left-1 rounded bg-brand px-1.5 text-[0.6rem] text-white">Principal</span>}
                  <div className="absolute inset-x-0 bottom-0 flex justify-between bg-black/50 p-1 text-[0.65rem] text-white">
                    <button disabled={i === 0} onClick={() => set("photos", [p, ...d.photos.filter((x) => x !== p)])} className="disabled:opacity-40">★ Principal</button>
                    <button onClick={() => set("photos", d.photos.filter((x) => x !== p))}>Quitar</button>
                  </div>
                </div>
              ))}
              <label className="grid aspect-square cursor-pointer place-items-center rounded-xl border-2 border-dashed border-line text-center text-xs text-muted hover:border-brand">
                <span>+ Agregar<br />fotos</span>
                <input type="file" accept="image/*" multiple className="sr-only" onChange={(e) => onPhotos(e.target.files)} />
              </label>
            </div>
            <p className="mt-3 text-xs text-muted">Se optimizan automáticamente (máx. 2000 px). Usa luz natural, fondo neutro y la vajilla real.</p>
          </section>

          <section className={card}>
            <h2 className={h2}>Información para el cliente</h2>
            <p className="-mt-2 mb-4 text-xs text-muted">Solo se muestra al cliente lo que marques como confirmado.</p>
            <label className="text-sm">Ingredientes (separados por coma)
              <input className={input} value={ingText} onChange={(e) => setIngText(e.target.value)} />
            </label>
            <div className="mt-2"><Check label="Ingredientes confirmados por cocina" checked={d.ingredientsVerified} onChange={(v) => set("ingredientsVerified", v)} /></div>
            <p className="mt-5 text-sm">Alérgenos</p>
            <div className="mt-2 grid grid-cols-2 gap-2 text-sm sm:grid-cols-3">
              {ALLERGENS.map((a) => (
                <Check
                  key={a}
                  label={ALLERGEN_LABELS[a]}
                  checked={d.allergens.includes(a)}
                  onChange={(v) => set("allergens", v ? [...d.allergens, a] : d.allergens.filter((x: Allergen) => x !== a))}
                />
              ))}
            </div>
            <div className="mt-3"><Check label="Alérgenos confirmados por cocina (si no, se pide consultar al mesero)" checked={d.allergensVerified} onChange={(v) => set("allergensVerified", v)} /></div>
            <details className="mt-5 text-sm">
              <summary className="cursor-pointer text-brand">Información nutricional (opcional)</summary>
              <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
                {(["kcal", "proteinG", "carbsG", "fatG"] as const).map((k) => (
                  <label key={k} className="text-xs">{{ kcal: "kcal", proteinG: "Proteína (g)", carbsG: "Carbohidratos (g)", fatG: "Grasa (g)" }[k]}
                    <input
                      className={input}
                      type="number"
                      min={0}
                      value={d.nutrition?.[k] ?? ""}
                      onChange={(e) => set("nutrition", { source: "", verified: false, ...d.nutrition, [k]: e.target.value === "" ? undefined : Number(e.target.value) })}
                    />
                  </label>
                ))}
              </div>
              <label className="mt-3 block text-xs">Fuente (laboratorio, nutriólogo…)
                <input className={input} value={d.nutrition?.source ?? ""} onChange={(e) => set("nutrition", { verified: false, ...d.nutrition, source: e.target.value })} />
              </label>
              <div className="mt-2"><Check label="Información nutricional verificada" checked={!!d.nutrition?.verified} onChange={(v) => set("nutrition", { source: "", ...d.nutrition, verified: v })} /></div>
            </details>
          </section>
        </div>

        <div className="min-w-0 space-y-5">
          <section className={card}>
            <h2 className={h2}>Medidas reales del plato</h2>
            <div className="grid grid-cols-2 gap-3">
              <label className="text-sm">Diámetro (cm)
                <input className={input} type="number" min={1} step="0.5" value={d.dimensions.diameterCm ?? ""} onChange={(e) => setDims({ diameterCm: e.target.value === "" ? undefined : Number(e.target.value) })} />
              </label>
              <label className="text-sm">Alto (cm)
                <input className={input} type="number" min={0.5} step="0.5" value={d.dimensions.heightCm ?? ""} onChange={(e) => setDims({ heightCm: e.target.value === "" ? undefined : Number(e.target.value) })} />
              </label>
            </div>
            <div className="mt-3"><Check label="Medido con cinta en la vajilla real" checked={d.dimensions.verified} onChange={(v) => setDims({ verified: v })} /></div>
            <p className="mt-2 text-xs text-muted">Define la escala en realidad aumentada. Mide el ancho máximo del plato servido.</p>
          </section>

          <section className={card}>
            <h2 className={h2}>Modelo 3D y realidad aumentada</h2>
            <div className="grid grid-cols-2 gap-3">
              <label className="text-sm">Estado
                <select className={input} value={d.model.status} onChange={(e) => setModel({ status: e.target.value as Draft["model"]["status"] })} data-testid="f-model-status">
                  {MODEL_STATUS.map((s) => <option key={s} value={s}>{MODEL_STATUS_LABELS[s]}</option>)}
                </select>
              </label>
              <label className="text-sm">Origen
                <select className={input} value={d.model.source ?? ""} onChange={(e) => setModel({ source: (e.target.value || undefined) as Draft["model"]["source"] })}>
                  <option value="">—</option>
                  {MODEL_SOURCES.map((s) => <option key={s} value={s}>{MODEL_SOURCE_LABELS[s]}</option>)}
                </select>
              </label>
            </div>

            <div className="mt-4 space-y-2 text-sm">
              <FileRow label="Archivo GLB (web, Android)" url={d.model.glbUrl} accept=".glb,model/gltf-binary" onFile={onGlb} testId="f-glb" />
              <FileRow label="Archivo USDZ (opcional, iPhone)" url={d.model.usdzUrl} accept=".usdz" onFile={onUsdz} onClear={() => setModel({ usdzUrl: undefined })} />
              <p className="text-xs text-muted">Sin USDZ, el iPhone genera uno automáticamente desde el GLB. Uno hecho a mano puede verse mejor.</p>
            </div>

            {d.model.glbUrl && <ModelPreview src={d.model.glbUrl} />}

            {checks.length > 0 && (
              <ul className="mt-4 space-y-1.5 text-xs" data-testid="model-checks">
                {checks.map((c, i) => (
                  <li key={i} className={c.level === "ok" ? "text-emerald-700" : c.level === "warn" ? "text-amber-700" : "text-red-700"}>
                    {c.level === "ok" ? "✓" : c.level === "warn" ? "⚠" : "✗"} {c.message}
                  </li>
                ))}
              </ul>
            )}

            <label className="mt-4 block text-sm">Diferencias conocidas con el platillo real
              <textarea className={`${input} h-20 py-2`} value={d.model.notes} onChange={(e) => setModel({ notes: e.target.value })} placeholder="Ej.: la guarnición varía según temporada." />
            </label>
            <div className="mt-3"><Check label="Efecto de vapor sutil (platillos calientes)" checked={d.effects.steam} onChange={(v) => set("effects", { steam: v })} /></div>
          </section>
        </div>
      </div>

      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
          {d.id !== "nuevo" && (
            <button onClick={onDelete} className="text-sm text-red-700">Eliminar</button>
          )}
          <div className="flex-1 text-sm" role="status" aria-live="polite">
            {busy ? <span className="text-muted">{busy}</span> : msg && <span className={msg.type === "ok" ? "text-emerald-700" : "text-red-700"}>{msg.text}</span>}
          </div>
          <button onClick={onSave} disabled={saving || !!busy || !d.name.trim()} className="h-11 rounded-xl bg-brand px-6 font-semibold text-white disabled:opacity-50" data-testid="f-save">
            {saving ? "Guardando…" : "Guardar"}
          </button>
        </div>
      </div>
    </div>
  );
}

function Check({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="inline-flex cursor-pointer items-center gap-2">
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="h-4 w-4 accent-[var(--brand)]" />
      <span>{label}</span>
    </label>
  );
}

function FileRow({ label, url, accept, onFile, onClear, testId }: { label: string; url?: string; accept: string; onFile: (f: File | undefined) => void; onClear?: () => void; testId?: string }) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-line p-3">
      <div className="min-w-0 flex-1">
        <p className="font-medium">{label}</p>
        <p className="truncate text-xs text-muted">{url ?? "Sin archivo"}</p>
      </div>
      {url && onClear && <button onClick={onClear} className="text-xs text-muted">Quitar</button>}
      <label className="cursor-pointer rounded-lg bg-surface px-3 py-1.5 text-xs font-medium text-brand">
        {url ? "Reemplazar" : "Subir"}
        <input type="file" accept={accept} className="sr-only" onChange={(e) => onFile(e.target.files?.[0])} data-testid={testId} />
      </label>
    </div>
  );
}

function ModelPreview({ src }: { src: string }) {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    loadModelViewer().then(() => setReady(true)).catch(() => {});
  }, []);
  return (
    <div className="mt-4 aspect-[4/3] overflow-hidden rounded-xl bg-[radial-gradient(circle,#fff,#ece8df)]">
      {ready && (
        <model-viewer src={src} camera-controls="" shadow-intensity="1" environment-image="neutral" tone-mapping="neutral" camera-orbit="25deg 62deg auto" />
      )}
    </div>
  );
}
