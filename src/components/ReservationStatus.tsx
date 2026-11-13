"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Check } from "lucide-react";

type PublicBooking = {
  id: string;
  code: string;
  status: "confirmed" | "pending" | "expired" | "cancelled";
  course: string;
  coach: string;
  dateLong: string;
  time: string;
  price: number;
  name: string;
  email: string;
};

type LoadState =
  | { kind: "loading" }
  | { kind: "ready"; booking: PublicBooking }
  | { kind: "not_found" }
  | { kind: "error" };

type ReservationStatusProps = {
  id: string;
  sessionId: string | null;
};

export function ReservationStatus({ id, sessionId }: ReservationStatusProps) {
  const [state, setState] = useState<LoadState>({ kind: "loading" });

  useEffect(() => {
    let cancelled = false;
    let timer: number | undefined;

    const load = async () => {
      try {
        const query = sessionId
          ? `?session_id=${encodeURIComponent(sessionId)}`
          : "";
        const response = await fetch(
          `/api/reservations/${encodeURIComponent(id)}${query}`,
          { cache: "no-store" },
        );

        if (response.status === 404) {
          if (!cancelled) setState({ kind: "not_found" });
          return;
        }

        if (!response.ok) throw new Error(`HTTP ${response.status}`);

        const data = (await response.json()) as { booking?: PublicBooking };
        if (!data.booking) throw new Error("Réponse vide.");
        if (cancelled) return;

        setState({ kind: "ready", booking: data.booking });

        if (data.booking.status === "pending") {
          timer = window.setTimeout(load, 2000);
        }
      } catch {
        if (cancelled) return;
        setState({ kind: "error" });
        timer = window.setTimeout(load, 4000);
      }
    };

    const initial = window.setTimeout(load, 0);

    return () => {
      cancelled = true;
      window.clearTimeout(initial);
      if (timer) window.clearTimeout(timer);
    };
  }, [id, sessionId]);

  return (
    <div className="w-full max-w-xl rounded-2xl bg-white p-7 sm:p-9">
          {state.kind === "loading" ? (
            <div aria-live="polite">
              <h1 className="text-2xl font-medium tracking-[-0.02em] text-forest">
                Vérification de la réservation…
              </h1>
              <p className="mt-3 text-sm leading-relaxed text-muted">
                Nous interrogeons Stripe pour connaître l&apos;état du paiement.
              </p>
            </div>
          ) : null}

          {state.kind === "not_found" ? (
            <div>
              <h1 className="text-2xl font-medium tracking-[-0.02em] text-forest">
                Réservation introuvable.
              </h1>
              <p className="mt-3 text-sm leading-relaxed text-muted">
                Ce lien ne correspond à aucune réservation du studio.
              </p>
              <Link
                href="/#reserver"
                className="mt-6 inline-flex items-center gap-2 rounded-full bg-forest px-5 py-3 text-sm font-medium text-ecru"
              >
                Retour à la réservation
              </Link>
            </div>
          ) : null}

          {state.kind === "error" ? (
            <div>
              <h1 className="text-2xl font-medium tracking-[-0.02em] text-forest">
                Vérification impossible.
              </h1>
              <p className="mt-3 text-sm leading-relaxed text-muted">
                Le serveur ne répond pas pour le moment. La page réessaie
                automatiquement.
              </p>
              <button
                type="button"
                onClick={() => window.location.reload()}
                className="mt-6 rounded-full bg-forest px-5 py-3 text-sm font-medium text-ecru"
              >
                Réessayer
              </button>
            </div>
          ) : null}

          {state.kind === "ready" ? (
            <BookingView booking={state.booking} />
          ) : null}

          <Link
            href="/"
            className="mt-8 inline-flex items-center gap-2 text-sm text-muted transition-colors hover:text-forest"
          >
            <ArrowLeft size={15} aria-hidden="true" />
            Retour au site
          </Link>
    </div>
  );
}

function BookingView({ booking }: { booking: PublicBooking }) {
  const confirmed = booking.status === "confirmed";
  const pending = booking.status === "pending";

  return (
    <div aria-live="polite">
      {confirmed ? (
        <span className="inline-flex size-12 items-center justify-center rounded-full bg-forest text-ecru">
          <Check size={22} strokeWidth={2.5} />
        </span>
      ) : null}

      <h1 className="mt-4 text-[28px] font-medium tracking-[-0.025em] text-forest sm:text-[32px]">
        {confirmed
          ? "Séance confirmée"
          : pending
            ? "Paiement en cours de confirmation"
            : "Paiement non confirmé"}
      </h1>

      <p className="mt-3 text-sm leading-relaxed text-muted">
        {confirmed
          ? `Merci ${booking.name}. Votre place est réservée, présentez le code à l'accueil dix minutes avant la séance.`
          : pending
            ? "Stripe traite encore le paiement. Cette page se met à jour automatiquement dès que la confirmation arrive."
            : "La place a été libérée. Vous pouvez choisir un autre créneau et réessayer."}
      </p>

      {confirmed ? (
        <div className="mt-6 rounded-xl bg-ecru px-4 py-4">
          <p className="text-[13px] text-muted">Votre code de confirmation</p>
          <p className="mt-1 text-xl font-medium tracking-[0.04em] text-forest tabular-nums">
            {booking.code}
          </p>
        </div>
      ) : null}

      <dl className="mt-6 space-y-3 text-sm">
        <div className="flex justify-between gap-6">
          <dt className="text-muted">Séance</dt>
          <dd className="text-right font-medium text-forest">{booking.course}</dd>
        </div>
        <div className="flex justify-between gap-6">
          <dt className="text-muted">Créneau</dt>
          <dd className="text-right font-medium text-forest">
            {booking.dateLong} · {booking.time}
          </dd>
        </div>
        <div className="flex justify-between gap-6">
          <dt className="text-muted">Coach</dt>
          <dd className="text-right font-medium text-forest">{booking.coach}</dd>
        </div>
        <div className="flex justify-between gap-6">
          <dt className="text-muted">Montant</dt>
          <dd className="text-right font-medium text-forest">
            {booking.price} €
          </dd>
        </div>
      </dl>

      {confirmed ? (
        <p className="mt-6 text-sm leading-relaxed text-muted">
          Le récapitulatif part vers {booking.email} si le service email est
          configuré. Annulation gratuite jusqu&apos;à 12 h avant la séance.
        </p>
      ) : null}

      {!confirmed ? (
        <Link
          href="/#reserver"
          className="mt-6 inline-flex items-center rounded-full bg-forest px-5 py-3 text-sm font-medium text-ecru"
        >
          {pending ? "Voir les autres créneaux" : "Réserver un autre créneau"}
        </Link>
      ) : null}

      <p className="mt-5 text-[13px] text-muted">
        Paiement Stripe en mode test. Aucun débit réel.
      </p>
    </div>
  );
}
