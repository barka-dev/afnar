"use client";

import { useActionState, useState } from "react";
import { login } from "../actions";
import { inputCls } from "../_ui/ui";

export default function LoginForm({ next, configured }: { next: string; configured: boolean }) {
  const [state, action, pending] = useActionState(login, { error: "" });
  const [show, setShow] = useState(false);

  if (!configured) {
    return (
      <p className="text-sm leading-relaxed text-muted">
        Le mot de passe administrateur n&apos;est pas encore défini. Ajoutez <code className="rounded bg-sand px-1">ADMIN_PASSWORD</code> dans{" "}
        <code className="rounded bg-sand px-1">.env.local</code> (et dans Vercel → Settings → Environment Variables), puis redémarrez le site.
      </p>
    );
  }

  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="next" value={next} />
      <div>
        <label htmlFor="password" className="mb-1.5 block text-xs text-muted">
          Mot de passe
        </label>
        <div className="relative">
          <input
            id="password"
            name="password"
            type={show ? "text" : "password"}
            autoComplete="current-password"
            required
            autoFocus
            aria-invalid={!!state.error}
            className={`${inputCls} pe-16`}
          />
          <button type="button" onClick={() => setShow((s) => !s)} className="absolute inset-y-0 end-0 px-3 text-xs text-muted hover:text-ink">
            {show ? "Masquer" : "Afficher"}
          </button>
        </div>
      </div>
      {state.error && (
        <p role="alert" className="text-sm text-sold">
          {state.error}
        </p>
      )}
      <button type="submit" disabled={pending} className="min-h-11 w-full rounded-md bg-ink text-sm text-ivory transition-colors hover:bg-gold-dark disabled:opacity-60">
        {pending ? "Connexion…" : "Se connecter"}
      </button>
    </form>
  );
}
