"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/admin", label: "Platillos" },
  { href: "/admin/categorias", label: "Categorías" },
  { href: "/admin/ajustes", label: "Ajustes" },
  { href: "/admin/qr", label: "Código QR" },
];

export function AdminNav() {
  const path = usePathname();
  return (
    <nav className="no-scrollbar flex gap-1 overflow-x-auto">
      {LINKS.map((l) => {
        const active = l.href === "/admin" ? path === "/admin" || path.startsWith("/admin/platillos") : path.startsWith(l.href);
        return (
          <Link
            key={l.href}
            href={l.href}
            className={`shrink-0 rounded-lg px-3 py-1.5 text-sm ${active ? "bg-brand text-white" : "text-ink/75 hover:bg-surface"}`}
          >
            {l.label}
          </Link>
        );
      })}
    </nav>
  );
}

export function AdminNavStatic() {
  return (
    <nav className="no-scrollbar flex gap-1 overflow-x-auto">
      {LINKS.map((l) => (
        <Link key={l.href} href={l.href} className="shrink-0 rounded-lg px-3 py-1.5 text-sm text-ink/75">
          {l.label}
        </Link>
      ))}
    </nav>
  );
}
