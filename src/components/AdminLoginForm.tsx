"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Lock } from "lucide-react";

type AdminLoginFormProps = {
  configured: boolean;
};

export function AdminLoginForm({ configured }: AdminLoginFormProps) {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting) return;

    setSubmitting(true);
    setError(null);

    try {
      const response = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      const data = (await response.json().catch(() => ({}))) as {
        error?: string;
      };

      if (!response.ok) {
        setError(data.error ?? "Connexion impossible.");
        setSubmitting(false);
        return;
      }

      router.replace("/admin");
      router.refresh();
    } catch {
      setError("Connexion au serveur impossible.");
      setSubmitting(false);
    }
  }

  return (
    <div className="w-full max-w-md rounded-2xl bg-white p-7 sm:p-9">
      <span className="inline-flex size-11 items-center justify-center rounded-full bg-bone text-forest">
        <Lock size={18} aria-hidden="true" />
      </span>
      <h1 className="mt-5 text-[28px] font-medium tracking-[-0.025em] text-forest">
        Espace admin
      </h1>
      <p className="mt-2 text-sm leading-relaxed text-muted">
        Réservations et suivi du studio.
      </p>

      {!configured ? (
        <div className="mt-6 rounded-xl bg-bone px-4 py-4 text-sm leading-relaxed text-ink">
          <p className="font-medium text-forest">Mot de passe non configuré.</p>
          <p className="mt-2">
            Ajoutez <code className="text-forest">ADMIN_PASSWORD</code> dans{" "}
            <code className="text-forest">.env.local</code>, avec au moins 8
            caractères, puis redémarrez le serveur.
          </p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="mt-7 space-y-4">
          <div>
            <label
              htmlFor="admin-password"
              className="mb-1.5 block text-sm text-forest"
            >
              Mot de passe
            </label>
            <input
              id="admin-password"
              name="admin-password"
              type="password"
              autoComplete="current-password"
              autoFocus
              required
              value={password}
              onChange={(event) => {
                setPassword(event.target.value);
                setError(null);
              }}
              className="w-full rounded-xl border border-field bg-white px-4 py-3 text-base text-forest focus:outline-none focus-visible:outline-none focus:ring-2 focus:ring-sage"
            />
          </div>

          {error ? (
            <p
              role="alert"
              className="rounded-xl bg-[#f6e9e6] px-4 py-3 text-sm text-[#8f3a2a]"
            >
              {error}
            </p>
          ) : null}

          <button
            type="submit"
            disabled={submitting}
            className="inline-flex w-full items-center justify-center rounded-full bg-forest px-6 py-3.5 text-sm font-medium text-ecru transition-colors hover:bg-forest-soft disabled:cursor-not-allowed disabled:opacity-70"
          >
            {submitting ? "Connexion…" : "Entrer"}
          </button>
        </form>
      )}

      <Link
        href="/"
        className="mt-7 inline-flex items-center gap-2 text-sm text-muted transition-colors hover:text-forest"
      >
        <ArrowLeft size={15} aria-hidden="true" />
        Retour au site
      </Link>
    </div>
  );
}
