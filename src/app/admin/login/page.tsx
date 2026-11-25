import type { Metadata } from "next";
import { LoginForm } from "./LoginForm";

export const metadata: Metadata = { title: "Acceso administrativo", robots: { index: false } };

export default function LoginPage() {
  return (
    <main className="grid min-h-dvh place-items-center bg-brand-dark px-5">
      <div className="w-full max-w-sm rounded-3xl bg-white p-7 shadow-2xl">
        <p className="text-xs font-semibold tracking-[0.24em] text-accent uppercase">Panel privado</p>
        <h1 className="mt-1 font-display text-2xl font-semibold text-brand-dark">Administración del menú</h1>
        <LoginForm />
      </div>
    </main>
  );
}
