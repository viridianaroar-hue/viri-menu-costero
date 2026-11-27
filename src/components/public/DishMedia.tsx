import Image from "next/image";
import { IconPlate } from "@/components/icons";
import type { Media } from "@/lib/menu/schema";

/** Foto del platillo o un marcador elegante "Foto próximamente". */
export function DishMedia({
  photo,
  name,
  sizes,
  priority = false,
  compact = false,
}: {
  photo?: Media;
  name: string;
  sizes: string;
  priority?: boolean;
  compact?: boolean;
}) {
  if (photo) {
    return (
      <Image
        src={photo.url}
        alt={photo.alt || name}
        fill
        sizes={sizes}
        priority={priority}
        className="object-cover"
      />
    );
  }
  return (
    <div
      className="absolute inset-0 flex flex-col items-center justify-center gap-1 text-white/70"
      style={{ background: "radial-gradient(120% 90% at 30% 20%, var(--brand) 0%, var(--brand-dark) 70%)" }}
      role="img"
      aria-label={`${name}: foto próximamente`}
    >
      <IconPlate className={compact ? "h-10 w-10" : "h-20 w-20"} style={{ color: "var(--accent)" }} />
      {!compact && <span className="text-xs tracking-[0.2em] uppercase">Foto próximamente</span>}
    </div>
  );
}
