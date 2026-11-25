import Link from "next/link";
import { Suspense } from "react";
import { logout } from "../actions";
import { AdminNav, AdminNavStatic } from "@/components/admin/AdminNav";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const driver = process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY ? "Supabase" : "Local (archivo)";
  return (
    <div className="min-h-dvh bg-[#f4f3ef]">
      <header className="sticky top-0 z-30 border-b border-line bg-white/95 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-6xl items-center gap-4 px-4">
          <Link href="/admin" className="font-display text-lg font-semibold text-brand-dark">Menú · Admin</Link>
          {/* usePathname lee la URL: debe ir dentro de Suspense para que la página se pueda regenerar. */}
          <Suspense fallback={<AdminNavStatic />}>
            <AdminNav />
          </Suspense>
          <div className="ml-auto flex items-center gap-3">
            <span className="hidden rounded-full bg-surface px-2.5 py-1 text-[0.7rem] text-muted sm:inline" title="Dónde se guarda el menú">
              {driver}
            </span>
            <Link href="/" target="_blank" className="hidden text-sm text-brand sm:inline">Ver sitio ↗</Link>
            <form action={logout}>
              <button className="text-sm text-muted hover:text-ink">Salir</button>
            </form>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-6">
        <Suspense fallback={<div className="skeleton h-64 rounded-2xl" />}>{children}</Suspense>
      </main>
    </div>
  );
}
