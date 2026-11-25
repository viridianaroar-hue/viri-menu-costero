import { adminGuard } from "@/lib/auth/server";
import { getMenuFresh } from "@/lib/menu/data";

/** Respaldo descargable del menú completo (JSON). */
export async function GET() {
  const denied = await adminGuard();
  if (denied) return denied;
  const menu = await getMenuFresh();
  const date = new Date().toISOString().slice(0, 10);
  return new Response(JSON.stringify(menu, null, 2), {
    headers: {
      "content-type": "application/json; charset=utf-8",
      "content-disposition": `attachment; filename="menu-respaldo-${date}.json"`,
      "cache-control": "no-store",
    },
  });
}
