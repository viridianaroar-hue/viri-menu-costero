import Link from "next/link";

export default function NotFound() {
  return (
    <main className="grid min-h-[70dvh] place-items-center px-6 text-center">
      <div>
        <p className="text-xs font-semibold tracking-[0.24em] text-accent uppercase">404</p>
        <h1 className="mt-2 font-display text-3xl font-semibold text-brand-dark">No encontramos esta página</h1>
        <p className="mt-2 text-sm text-muted">Puede que el platillo ya no esté en el menú.</p>
        <Link href="/menu" className="mt-6 inline-flex h-11 items-center rounded-full bg-brand px-5 text-sm font-semibold text-white">
          Volver al menú
        </Link>
      </div>
    </main>
  );
}
