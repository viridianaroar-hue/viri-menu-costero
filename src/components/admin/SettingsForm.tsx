"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { importMenu, saveSettings } from "@/app/admin/actions";
import type { Settings } from "@/lib/menu/schema";

const input = "mt-1 h-10 w-full rounded-xl border border-line bg-white px-3 text-base sm:text-sm outline-none focus:border-brand";
const card = "rounded-2xl border border-line bg-white p-5";

export function SettingsForm({ settings }: { settings: Settings }) {
  const router = useRouter();
  const [s, setS] = useState(settings);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [pending, start] = useTransition();
  const set = <K extends keyof Settings>(k: K, v: Settings[K]) => setS((x) => ({ ...x, [k]: v }));
  const setTheme = (k: keyof Settings["theme"], v: string) => setS((x) => ({ ...x, theme: { ...x.theme, [k]: v } }));

  const save = () =>
    start(async () => {
      const r = await saveSettings(s);
      setMsg(r.ok ? { ok: true, text: "Ajustes guardados." } : { ok: false, text: r.error });
      router.refresh();
    });

  const onImport = async (file?: File) => {
    if (!file) return;
    if (!confirm("Esto REEMPLAZA todo el menú actual (categorías, platillos y ajustes). ¿Continuar? Te recomendamos descargar un respaldo antes.")) return;
    const text = await file.text();
    start(async () => {
      const r = await importMenu(text);
      setMsg(r.ok ? { ok: true, text: `Menú importado: ${r.data!.categories} categorías, ${r.data!.dishes} platillos.` } : { ok: false, text: r.error });
      router.refresh();
    });
  };

  return (
    <div className="grid max-w-5xl gap-5 lg:grid-cols-2">
      <section className={card}>
        <h2 className="mb-4 font-display text-lg font-semibold text-brand-dark">Restaurante</h2>
        <div className="space-y-3">
          <label className="block text-sm">Nombre<input className={input} value={s.restaurantName} onChange={(e) => set("restaurantName", e.target.value)} /></label>
          <label className="block text-sm">Lema<input className={input} value={s.tagline} onChange={(e) => set("tagline", e.target.value)} /></label>
          <label className="block text-sm">Ubicación<input className={input} value={s.location} onChange={(e) => set("location", e.target.value)} /></label>
          <label className="block text-sm">Texto de bienvenida<textarea className={`${input} h-20 py-2`} value={s.welcomeText} onChange={(e) => set("welcomeText", e.target.value)} /></label>
          <label className="block text-sm">Nota al pie<input className={input} value={s.footerNote} onChange={(e) => set("footerNote", e.target.value)} /></label>
          <div className="grid grid-cols-2 gap-3">
            <label className="block text-sm">Moneda (ISO)<input className={input} value={s.currency} maxLength={3} onChange={(e) => set("currency", e.target.value.toUpperCase())} /></label>
            <label className="block text-sm">URL pública<input className={input} value={s.publicUrl ?? ""} placeholder="https://menu.turestaurante.com" onChange={(e) => set("publicUrl", e.target.value)} /></label>
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={s.demoMode} onChange={(e) => set("demoMode", e.target.checked)} /> Mostrar aviso «Menú de demostración»
          </label>
        </div>
      </section>

      <div className="space-y-5">
        <section className={card}>
          <h2 className="mb-4 font-display text-lg font-semibold text-brand-dark">Colores de marca</h2>
          <div className="grid grid-cols-2 gap-3">
            {([
              ["primary", "Principal"],
              ["primaryDark", "Principal oscuro"],
              ["accent", "Acento"],
              ["surface", "Fondo"],
            ] as const).map(([k, label]) => (
              <label key={k} className="flex items-center gap-3 text-sm">
                <input type="color" value={s.theme[k]} onChange={(e) => setTheme(k, e.target.value)} className="h-10 w-12 cursor-pointer rounded-lg border border-line" />
                <span>{label}<span className="block text-xs text-muted">{s.theme[k]}</span></span>
              </label>
            ))}
          </div>
          <div className="mt-4 flex h-14 overflow-hidden rounded-xl">
            <div className="flex-1" style={{ background: s.theme.primaryDark }} />
            <div className="flex-1" style={{ background: s.theme.primary }} />
            <div className="flex-1" style={{ background: s.theme.accent }} />
            <div className="flex-1" style={{ background: s.theme.surface }} />
          </div>
        </section>

        <section className={card}>
          <h2 className="mb-2 font-display text-lg font-semibold text-brand-dark">Respaldo y carga masiva</h2>
          <p className="mb-4 text-xs text-muted">Descarga el menú como JSON, edítalo o pídeme generarlo desde tu menú real, y vuelve a importarlo.</p>
          <div className="flex flex-wrap gap-2">
            <a href="/api/admin/export" className="rounded-xl border border-line px-4 py-2 text-sm text-brand">Descargar respaldo</a>
            <label className="cursor-pointer rounded-xl border border-line px-4 py-2 text-sm text-brand">
              Importar JSON…
              <input type="file" accept="application/json,.json" className="sr-only" onChange={(e) => onImport(e.target.files?.[0])} />
            </label>
          </div>
        </section>
      </div>

      <div className="flex items-center gap-4 lg:col-span-2">
        <button onClick={save} disabled={pending} className="h-11 rounded-xl bg-brand px-6 font-semibold text-white disabled:opacity-50">
          {pending ? "Guardando…" : "Guardar ajustes"}
        </button>
        {msg && <p className={`text-sm ${msg.ok ? "text-emerald-700" : "text-red-700"}`} role="status">{msg.text}</p>}
      </div>
    </div>
  );
}
