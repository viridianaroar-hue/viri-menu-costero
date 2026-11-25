import Link from "next/link";
import type { Settings } from "@/lib/menu/schema";

export function DemoBanner({ settings }: { settings: Settings }) {
  if (!settings.demoMode) return null;
  return (
    <div className="bg-accent/95 px-4 py-1.5 text-center text-[0.72rem] font-medium text-brand-dark" role="note">
      Menú de demostración · platillos, precios y modelos 3D no confirmados
    </div>
  );
}

export function SiteFooter({ settings }: { settings: Settings }) {
  return (
    <footer className="mt-16 border-t border-line px-5 py-8 text-center text-xs leading-relaxed text-muted">
      <p className="font-display text-sm text-brand-dark">{settings.restaurantName}</p>
      {settings.location && <p>{settings.location}</p>}
      <p className="mt-2">Precios en {settings.currency}. Las imágenes y modelos 3D son ilustrativos.</p>
      {settings.footerNote && <p className="mx-auto mt-1 max-w-md">{settings.footerNote}</p>}
    </footer>
  );
}

export function TopBar({ settings, back }: { settings: Settings; back?: { href: string; label: string } }) {
  return (
    <header className="flex h-14 items-center justify-between px-4">
      {back ? (
        <Link href={back.href} className="text-sm font-medium text-brand">
          ← {back.label}
        </Link>
      ) : (
        <span />
      )}
      <Link href="/" className="font-display text-base font-semibold text-brand-dark">
        {settings.restaurantName}
      </Link>
      <span className="w-12" />
    </header>
  );
}
