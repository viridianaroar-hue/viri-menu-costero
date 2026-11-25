import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { IconArrowLeft, IconCheck, IconInfo } from "@/components/icons";
import { DishMedia } from "@/components/public/DishMedia";
import { DishViewer } from "@/components/viewer/DishViewer";
import { formatPrice } from "@/lib/format";
import { getMenu, hasPublishedModel, publicDishes } from "@/lib/menu/data";
import { ALLERGEN_LABELS, MODEL_SOURCE_LABELS, type Dish, type Menu } from "@/lib/menu/schema";

export async function generateStaticParams() {
  const menu = await getMenu();
  const slugs = publicDishes(menu).map((d) => ({ slug: d.slug }));
  return slugs.length ? slugs : [{ slug: "__vacio__" }];
}

function findDish(menu: Menu, slug: string): Dish | undefined {
  return publicDishes(menu).find((d) => d.slug === slug);
}

export async function generateMetadata({ params }: PageProps<"/platillo/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const dish = findDish(await getMenu(), slug);
  if (!dish) return { title: "Platillo no encontrado" };
  return {
    title: dish.name,
    description: dish.description || undefined,
    openGraph: dish.photos[0] ? { images: [{ url: dish.photos[0].url }] } : undefined,
  };
}

export default function DishPage({ params }: PageProps<"/platillo/[slug]">) {
  return (
    <Suspense fallback={<DishSkeleton />}>
      <DishContent params={params} />
    </Suspense>
  );
}

async function DishContent({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const menu = await getMenu();
  const dish = findDish(menu, slug);
  if (!dish) notFound();
  const { settings } = menu;
  const category = menu.categories.find((c) => c.id === dish.categoryId);
  const poster = <DishMedia photo={dish.photos[0]} name={dish.name} sizes="(min-width: 768px) 768px, 100vw" priority />;
  const model = hasPublishedModel(dish) ? dish.model : null;

  return (
    <article className="pb-4">
      <div className="relative mx-auto max-w-3xl md:px-4 md:pt-4">
        <Link
          href={category ? `/menu#cat-${category.slug}` : "/menu"}
          className="absolute top-3 left-3 z-10 inline-flex h-10 items-center gap-1 rounded-full bg-white/90 pr-4 pl-2.5 text-sm font-medium text-brand shadow backdrop-blur md:left-7 md:top-7"
          data-testid="back-to-menu"
        >
          <IconArrowLeft className="h-4.5 w-4.5" /> Menú
        </Link>
        {model ? (
          <DishViewer
            glbUrl={model.glbUrl!}
            usdzUrl={model.usdzUrl}
            name={dish.name}
            poster={poster}
            steam={dish.effects.steam}
            available={dish.available}
          />
        ) : (
          <div className="relative aspect-square max-h-[62vh] w-full overflow-hidden md:aspect-[4/3] md:rounded-3xl">{poster}</div>
        )}
      </div>

      <div className="mx-auto max-w-3xl px-4 pt-5">
        {category && <p className="text-xs font-semibold tracking-[0.22em] text-accent uppercase">{category.name}</p>}
        <div className="mt-1 flex items-start justify-between gap-4">
          <h1 className="font-display text-[1.9rem] leading-tight font-semibold text-brand-dark">{dish.name}</h1>
          <p className="shrink-0 pt-1.5 text-xl font-semibold text-brand" data-testid="dish-price">
            {formatPrice(dish.price, settings.currency)}
          </p>
        </div>
        {!dish.available && (
          <p className="mt-2 inline-block rounded-full bg-ink px-3 py-1 text-xs font-medium text-white">Agotado por hoy</p>
        )}
        {dish.description && <p className="mt-3 text-[0.98rem] leading-relaxed text-ink/85">{dish.description}</p>}
        {dish.tags.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2">
            {dish.tags.map((t) => (
              <span key={t} className="rounded-full border border-line bg-card px-3 py-1 text-xs text-muted">{t}</span>
            ))}
          </div>
        )}

        <div className="mt-6 divide-y divide-line rounded-2xl border border-line bg-card">
          {dish.ingredientsVerified && dish.ingredients.length > 0 && (
            <InfoRow title="Ingredientes">{dish.ingredients.join(", ")}.</InfoRow>
          )}
          <InfoRow title="Alérgenos">
            {dish.allergensVerified ? (
              dish.allergens.length ? (
                <span className="flex flex-wrap gap-1.5">
                  {dish.allergens.map((a) => (
                    <span key={a} className="rounded-full bg-brand/8 px-2.5 py-0.5 text-xs font-medium text-brand">{ALLERGEN_LABELS[a]}</span>
                  ))}
                </span>
              ) : (
                "Sin alérgenos principales declarados."
              )
            ) : (
              "Información pendiente de confirmar. Pregunta a tu mesero antes de ordenar."
            )}
          </InfoRow>
          {dish.nutrition?.verified && (
            <InfoRow title="Información nutricional">
              {[
                dish.nutrition.kcal !== undefined && `${dish.nutrition.kcal} kcal`,
                dish.nutrition.proteinG !== undefined && `${dish.nutrition.proteinG} g proteína`,
                dish.nutrition.carbsG !== undefined && `${dish.nutrition.carbsG} g carbohidratos`,
                dish.nutrition.fatG !== undefined && `${dish.nutrition.fatG} g grasa`,
              ].filter(Boolean).join(" · ")}
              {dish.nutrition.source && <span className="block text-xs text-muted">Fuente: {dish.nutrition.source}</span>}
            </InfoRow>
          )}
          {dish.dimensions.diameterCm && (
            <InfoRow title="Tamaño del plato">
              Ø {dish.dimensions.diameterCm} cm{dish.dimensions.heightCm ? ` · ${dish.dimensions.heightCm} cm de alto` : ""}
              {dish.dimensions.verified ? (
                <span className="ml-2 inline-flex items-center gap-0.5 text-xs text-brand"><IconCheck className="h-3.5 w-3.5" /> medido</span>
              ) : (
                <span className="ml-2 text-xs text-muted">(aproximado)</span>
              )}
            </InfoRow>
          )}
          {model?.source && (
            <InfoRow title="Sobre el modelo 3D">
              {MODEL_SOURCE_LABELS[model.source]}.{" "}
              {model.source === "ia_generativa" &&
                "Es una representación aproximada creada con IA a partir de fotografías; puede diferir del platillo servido. "}
              {model.notes}
            </InfoRow>
          )}
        </div>

        {dish.isDemo && (
          <p className="mt-4 flex gap-2 text-xs leading-relaxed text-muted">
            <IconInfo className="h-4 w-4 shrink-0" /> Contenido de demostración: este platillo y su precio no están confirmados por el restaurante.
          </p>
        )}
      </div>
    </article>
  );
}

function InfoRow({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="px-4 py-3.5">
      <h2 className="text-[0.72rem] font-semibold tracking-[0.14em] text-muted uppercase">{title}</h2>
      <div className="mt-1 text-sm leading-relaxed text-ink/90">{children}</div>
    </div>
  );
}

function DishSkeleton() {
  return (
    <div className="mx-auto max-w-3xl" aria-busy="true" aria-label="Cargando platillo">
      <div className="skeleton aspect-square max-h-[62vh] w-full md:aspect-[4/3] md:rounded-3xl" />
      <div className="space-y-3 px-4 pt-5">
        <div className="skeleton h-3 w-24 rounded" />
        <div className="skeleton h-8 w-2/3 rounded" />
        <div className="skeleton h-4 w-full rounded" />
        <div className="skeleton h-4 w-4/5 rounded" />
      </div>
    </div>
  );
}
