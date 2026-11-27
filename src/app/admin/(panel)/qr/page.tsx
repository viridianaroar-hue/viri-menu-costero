import { QrGenerator } from "@/components/admin/QrGenerator";
import { requireAdmin } from "@/lib/auth/server";
import { getMenuFresh } from "@/lib/menu/data";

export default async function QrPage() {
  await requireAdmin();
  const menu = await getMenuFresh();
  return (
    <div>
      <h1 className="font-display text-3xl font-semibold text-brand-dark">Código QR</h1>
      <p className="mb-5 text-sm text-muted">Genera el QR para las mesas. Úsalo solo con la URL pública definitiva (HTTPS).</p>
      <QrGenerator
        publicUrl={menu.settings.publicUrl || process.env.NEXT_PUBLIC_SITE_URL || ""}
        restaurantName={menu.settings.restaurantName}
        dishes={menu.dishes.map((d) => ({ slug: d.slug, name: d.name }))}
        brand={menu.settings.theme.primaryDark}
      />
    </div>
  );
}
