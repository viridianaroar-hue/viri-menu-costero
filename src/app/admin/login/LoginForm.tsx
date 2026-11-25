"use client";

import { useActionState } from "react";
import { login } from "../actions";

export function LoginForm() {
  const [state, action, pending] = useActionState(login, undefined);
  return (
    <form action={action} className="mt-6 space-y-4">
      <label className="block">
        <span className="text-sm font-medium text-ink">Contraseña</span>
        <input
          name="password"
          type="password"
          required
          autoComplete="current-password"
          autoFocus
          className="mt-1.5 h-11 w-full rounded-xl border border-line px-3.5 text-base outline-none focus:border-brand"
        />
      </label>
      {state?.error && <p className="text-sm text-red-700" role="alert">{state.error}</p>}
      <button disabled={pending} className="h-11 w-full rounded-xl bg-brand font-semibold text-white disabled:opacity-60">
        {pending ? "Verificando…" : "Entrar"}
      </button>
    </form>
  );
}
