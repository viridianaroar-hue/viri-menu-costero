import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { SESSION_COOKIE, verifySessionToken } from "./session";

export async function isAdmin(): Promise<boolean> {
  const jar = await cookies();
  return verifySessionToken(jar.get(SESSION_COOKIE)?.value);
}

/** Para páginas y Server Actions: redirige al login si no hay sesión válida. */
export async function requireAdmin(): Promise<void> {
  if (!(await isAdmin())) redirect("/admin/login");
}

/** Para Route Handlers: devuelve una respuesta 401 o null si está autorizado. */
export async function adminGuard(): Promise<Response | null> {
  if (await isAdmin()) return null;
  return Response.json({ error: "No autorizado" }, { status: 401 });
}
