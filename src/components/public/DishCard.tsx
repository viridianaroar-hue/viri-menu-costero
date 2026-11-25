import Link from "next/link";
import { IconCube } from "@/components/icons";
import { formatPrice } from "@/lib/format";
import type { Dish } from "@/lib/menu/schema";
import { DishMedia } from "./DishMedia";

export type DishSummary = Pick<
  Dish,
  "id" | "slug" | "name" | "description" | "price" | "available" | "tags" | "categoryId" | "isDemo" | "featured"
> & { photo?: Dish["photos"][number]; has3d: boolean };

export function toSummary(d: Dish): DishSummary {
  return {
    id: d.id,
    slug: d.slug,
    name: d.name,
    description: d.description,
    price: d.price,
    available: d.available,
    tags: d.tags,
    categoryId: d.categoryId,
    isDemo: d.isDemo,
    featured: d.featured,
    photo: d.photos[0],
    has3d: d.model.status === "publicado" && !!d.model.glbUrl,
  };
}

export function DishCard({ dish, currency }: { dish: DishSummary; currency: string }) {
  return (
    <Link
      href={`/platillo/${dish.slug}`}
      className={`group flex gap-4 rounded-2xl border border-line bg-card p-3.5 shadow-[0_1px_2px_rgba(10,42,54,.04),0_8px_24px_-12px_rgba(10,42,54,.12)] transition active:scale-[.99] hover:border-accent/50 ${dish.available ? "" : "opacity-60"}`}
      data-testid="dish-card"
    >
      <div className="min-w-0 flex-1 py-0.5">
        <h3 className="font-display text-[1.06rem] leading-snug font-semibold text-brand-dark">{dish.name}</h3>
        {dish.description && (
          <p className="mt-1 line-clamp-2 text-[0.84rem] leading-relaxed text-muted">{dish.description}</p>
        )}
        <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
          <span className="mr-1 text-[0.95rem] font-semibold text-brand">{formatPrice(dish.price, currency)}</span>
          {!dish.available && (
            <span className="rounded-full bg-ink/80 px-2 py-0.5 text-[0.68rem] font-medium text-white">Agotado</span>
          )}
          {dish.has3d && (
            <span className="inline-flex items-center gap-1 rounded-full bg-brand/8 px-2 py-0.5 text-[0.68rem] font-semibold text-brand">
              <IconCube className="h-3 w-3" /> 3D · AR
            </span>
          )}
          {dish.tags.slice(0, 2).map((t) => (
            <span key={t} className="rounded-full border border-line px-2 py-0.5 text-[0.68rem] text-muted">
              {t}
            </span>
          ))}
        </div>
      </div>
      <div className="relative h-[6.5rem] w-[6.5rem] shrink-0 overflow-hidden rounded-xl bg-line">
        <DishMedia photo={dish.photo} name={dish.name} sizes="104px" compact />
        {dish.has3d && (
          <span className="absolute right-1.5 bottom-1.5 grid h-7 w-7 place-items-center rounded-full bg-white/90 text-brand shadow backdrop-blur">
            <IconCube className="h-4 w-4" />
          </span>
        )}
      </div>
    </Link>
  );
}
