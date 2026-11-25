import { SettingsForm } from "@/components/admin/SettingsForm";
import { requireAdmin } from "@/lib/auth/server";
import { getMenuFresh } from "@/lib/menu/data";

export default async function SettingsPage() {
  await requireAdmin();
  const menu = await getMenuFresh();
  return (
    <div>
      <h1 className="font-display text-3xl font-semibold text-brand-dark">Ajustes</h1>
      <p className="mb-5 text-sm text-muted">Identidad del restaurante, colores de marca, respaldo y carga masiva del menú.</p>
      <SettingsForm settings={menu.settings} />
    </div>
  );
}
