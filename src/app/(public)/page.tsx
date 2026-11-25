import Link from "next/link";
import { IconAR, IconArrowRight, IconCube } from "@/components/icons";
import { DishMedia } from "@/components/public/DishMedia";
import { formatPrice } from "@/lib/format";
import { getMenu, hasPublishedModel, publicDishes, visibleCategories } from "@/lib/menu/data";

export default async function HomePage() {
  const menu = await getMenu();
  const { settings } = menu;
  const categories = visibleCategories(menu);
  const dishes = publicDishes(menu);
  const featured = dishes
    .filter((d) => d.featured || hasPublishedModel(d))
    .sort((a, b) => Number(hasPublishedModel(b)) - Number(hasPublishedModel(a)))
    .slice(0, 8);

  return (
    <>
      <section
        className="relative overflow-hidden px-6 pt-14 pb-12 text-white"
        style={{ background: "linear-gradient(160deg, var(--brand-dark) 0%, var(--brand) 100%)" }}
      >
        <svg className="pointer-events-none absolute inset-x-0 bottom-0 h-24 w-full opacity-[.12]" viewBox="0 0 400 60" preserveAspectRatio="none" aria-hidden>
          <path d="M0 30 Q 50 10 100 30 T 200 30 T 300 30 T 400 30 V60 H0Z" fill="white" />
          <path d="M0 42 Q 50 24 100 42 T 200 42 T 300 42 T 400 42 V60 H0Z" fill="white" />
        </svg>
        <div className="relative mx-auto max-w-3xl fade-up">
          <p className="text-[0.7rem] font-semibold tracking-[0.32em] text-accent uppercase">Menú digital</p>
          <h1 className="mt-3 font-display text-[2.6rem] leading-[1.05] font-semibold md:text-6xl">{settings.restaurantName}</h1>
          <p className="mt-3 text-white/80">
            {[settings.tagline, settings.location].filter(Boolean).join(" · ")}
          </p>
          {settings.welcomeText && <p className="mt-5 max-w-md text-[0.95rem] leading-relaxed text-white/85">{settings.welcomeText}</p>}
          <div className="mt-7 flex flex-wrap gap-3">
            <Link
              href="/menu"
              className="inline-flex h-12 items-center gap-2 rounded-full bg-accent px-6 font-semibold text-brand-dark shadow-[0_8px_24px_-10px_rgba(0,0,0,.5)] transition active:scale-[.98]"
              data-testid="cta-menu"
            >
              Ver el menú <IconArrowRight className="h-4 w-4" />
            </Link>
            {featured.some(hasPublishedModel) && (
              <a href="#en-3d" className="inline-flex h-12 items-center gap-2 rounded-full border border-white/30 px-5 font-medium text-white">
                <IconCube className="h-5 w-5" /> Platillos en 3D
              </a>
            )}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-3xl px-4 pt-8" aria-labelledby="h-cat">
        <h2 id="h-cat" className="mb-3 font-display text-xl font-semibold text-brand-dark">Categorías</h2>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {categories.map((c) => {
            const n = dishes.filter((d) => d.categoryId === c.id).length;
            return (
              <Link
                key={c.id}
                href={`/menu#cat-${c.slug}`}
                className="group relative flex min-h-24 flex-col justify-end overflow-hidden rounded-2xl border border-line bg-card p-4 transition hover:border-accent/60"
              >
                <span className="absolute top-3 right-3 grid h-8 w-8 place-items-center rounded-full bg-accent/15 text-brand-dark transition group-hover:bg-accent/30" aria-hidden>
                  <IconArrowRight className="h-4 w-4" />
                </span>
                <span className="font-display text-lg font-semibold text-brand-dark">{c.name}</span>
                <span className="text-xs text-muted">{n} platillo{n === 1 ? "" : "s"}</span>
              </Link>
            );
          })}
        </div>
      </section>

      {featured.length > 0 && (
        <section id="en-3d" className="pt-10" aria-labelledby="h-feat">
          <div className="mx-auto flex max-w-3xl items-end justify-between px-4">
            <h2 id="h-feat" className="font-display text-xl font-semibold text-brand-dark">Destacados</h2>
            <Link href="/menu" className="text-sm font-medium text-brand">Todo el menú →</Link>
          </div>
          <div className="no-scrollbar mx-auto mt-3 flex max-w-3xl snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-2">
            {featured.map((d) => (
              <Link key={d.id} href={`/platillo/${d.slug}`} className="w-60 shrink-0 snap-start overflow-hidden rounded-2xl border border-line bg-card">
                <div className="relative aspect-[4/3]">
                  <DishMedia photo={d.photos[0]} name={d.name} sizes="240px" />
                  {hasPublishedModel(d) && (
                    <span className="absolute top-2.5 left-2.5 inline-flex items-center gap-1 rounded-full bg-white/90 px-2.5 py-1 text-[0.7rem] font-semibold text-brand backdrop-blur">
                      <IconAR className="h-3.5 w-3.5" /> Ver en tu mesa
                    </span>
                  )}
                </div>
                <div className="p-3.5">
                  <p className="font-display font-semibold text-brand-dark">{d.name}</p>
                  <p className="mt-0.5 text-sm text-brand">{formatPrice(d.price, settings.currency)}</p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      <section className="mx-auto max-w-3xl px-4 pt-10" aria-labelledby="h-how">
        <div className="rounded-3xl border border-line bg-card p-5">
          <h2 id="h-how" className="font-display text-lg font-semibold text-brand-dark">¿Cómo ver un platillo en tu mesa?</h2>
          <ol className="mt-3 grid gap-3 text-sm text-ink/85 md:grid-cols-3">
            {[
              "Abre un platillo con la etiqueta 3D · AR.",
              "Toca «Ver en mi mesa» y permite el uso de la cámara.",
              "Apunta a la mesa, mueve el teléfono despacio y colócalo.",
            ].map((s, i) => (
              <li key={s} className="flex gap-3">
                <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-accent/20 text-xs font-bold text-brand-dark">{i + 1}</span>
                <span className="pt-1">{s}</span>
              </li>
            ))}
          </ol>
          <p className="mt-4 text-xs text-muted">
            Funciona en iPhone (iOS 12 o superior) y en teléfonos Android compatibles con ARCore. En otros equipos podrás explorar el platillo en 3D.
          </p>
        </div>
      </section>
    </>
  );
}
