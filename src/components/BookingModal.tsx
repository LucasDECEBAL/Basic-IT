"use client";

import { useEffect, useMemo, useRef, useState, type FormEvent, type Ref } from "react";
import { ArrowRight, Check, Lock, X } from "lucide-react";
import Link from "next/link";
import { createPortal } from "react-dom";
import type { Booking } from "@/lib/bookings";
import { PRICE, type Slot } from "@/lib/sessions";
import { gsap, useGSAP } from "@/lib/gsap";
import { prefersReducedMotion } from "@/lib/motion";

type BookingModalProps = {
  slot: Slot;
  onClose: () => void;
  onBooked: () => void | Promise<void>;
};

type Fields = {
  name: string;
  email: string;
  phone: string;
  card: string;
  expiry: string;
  cvc: string;
};

const EMPTY_FIELDS: Fields = {
  name: "",
  email: "",
  phone: "",
  card: "",
  expiry: "",
  cvc: "",
};

function formatCard(value: string) {
  return value
    .replace(/\D/g, "")
    .slice(0, 16)
    .replace(/(.{4})/g, "$1 ")
    .trim();
}

function formatExpiry(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 4);
  return digits.length > 2 ? `${digits.slice(0, 2)}/${digits.slice(2)}` : digits;
}

export function BookingModal({ slot, onClose, onBooked }: BookingModalProps) {
  const [fields, setFields] = useState<Fields>(EMPTY_FIELDS);
  const [errors, setErrors] = useState<Partial<Record<keyof Fields, string>>>({});
  const [confirmed, setConfirmed] = useState<Booking | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [mailStatus, setMailStatus] = useState<"sent" | "skipped" | "failed" | null>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const firstFieldRef = useRef<HTMLInputElement>(null);
  const successRef = useRef<HTMLDivElement>(null);
  const submittedRef = useRef(false);
  const onCloseRef = useRef(onClose);

  const price = useMemo(() => `${PRICE} €`, []);

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    firstFieldRef.current?.focus();

    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onCloseRef.current();
        return;
      }
      if (event.key !== "Tab" || !panelRef.current) return;

      const focusable = panelRef.current.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), input:not([disabled]), select, textarea, [tabindex]:not([tabindex="-1"])',
      );
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = overflow;
      previous?.focus();
    };
  }, []);

  const update = (key: keyof Fields, value: string) => {
    setFields((current) => ({ ...current, [key]: value }));
    setErrors((current) => ({ ...current, [key]: undefined }));
  };

  const validate = () => {
    const next: Partial<Record<keyof Fields, string>> = {};
    if (fields.name.trim().length < 2) next.name = "Indiquez votre nom complet.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(fields.email.trim())) {
      next.email = "Indiquez un email valide.";
    }
    if (fields.phone.replace(/\D/g, "").length < 10) {
      next.phone = "Indiquez un téléphone à 10 chiffres.";
    }
    if (fields.card.replace(/\s/g, "").length !== 16) {
      next.card = "Le numéro doit contenir 16 chiffres.";
    }
    if (!/^(0[1-9]|1[0-2])\/\d{2}$/.test(fields.expiry)) {
      next.expiry = "Format MM/AA.";
    }
    if (!/^\d{3,4}$/.test(fields.cvc)) {
      next.cvc = "3 ou 4 chiffres.";
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!validate()) {
      const firstError = panelRef.current?.querySelector<HTMLElement>('[aria-invalid="true"]');
      firstError?.focus();
      return;
    }
    if (submittedRef.current) return;
    submittedRef.current = true;
    setSubmitting(true);
    setApiError(null);

    try {
      const response = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          dateIso: slot.dateIso,
          time: slot.time,
          name: fields.name.trim(),
          email: fields.email.trim(),
          phone: fields.phone.trim(),
        }),
      });

      const data = (await response.json().catch(() => ({}))) as {
        booking?: Booking;
        error?: string;
        emailSent?: boolean;
        emailSkipped?: boolean;
      };

      if (!response.ok || !data.booking) {
        setApiError(data.error ?? "La réservation n'a pas pu être enregistrée.");
        submittedRef.current = false;
        setSubmitting(false);
        void onBooked();
        return;
      }

      setConfirmed(data.booking);
      setMailStatus(data.emailSent ? "sent" : data.emailSkipped ? "skipped" : "failed");
      setSubmitting(false);
      void onBooked();
      requestAnimationFrame(() => closeRef.current?.focus());
    } catch {
      setApiError("Connexion au serveur impossible. Vérifiez que le serveur tourne.");
      submittedRef.current = false;
      setSubmitting(false);
    }
  };

  const dateLabel = `${slot.dateLong} · ${slot.time}`;
  const confirmedDateLabel = confirmed ? `${confirmed.dateLong} · ${confirmed.time}` : dateLabel;

  useGSAP(
    () => {
      if (!confirmed || !successRef.current || prefersReducedMotion()) return;
      const items = successRef.current.querySelectorAll("[data-success]");
      gsap.from(items, {
        y: 12,
        autoAlpha: 0,
        duration: 0.45,
        stagger: 0.06,
        ease: "power3.out",
      });
      gsap.from("[data-success-badge]", {
        scale: 0.55,
        autoAlpha: 0,
        duration: 0.55,
        ease: "back.out(1.8)",
      });
    },
    { scope: successRef, dependencies: [confirmed] },
  );

  const content = (
    <div
      className="veil-in fixed inset-0 z-50 overflow-y-auto bg-forest-deep/70 p-4 sm:p-6"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="booking-modal-title"
        className="modal-in mx-auto my-4 w-full max-w-xl rounded-[1.75rem] bg-ecru p-6 sm:my-10 sm:p-8"
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2
              id="booking-modal-title"
              className="text-2xl font-medium tracking-[-0.02em] text-forest sm:text-3xl"
            >
              {confirmed ? "Séance confirmée" : slot.name}
            </h2>
          </div>
          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            aria-label="Fermer"
            className="inline-flex size-11 shrink-0 items-center justify-center rounded-full bg-bone text-forest transition-colors hover:bg-bone-deep"
          >
            <X size={18} />
          </button>
        </div>

        {confirmed ? (
          <div ref={successRef} className="mt-8">
            <div data-success className="flex items-center gap-4 rounded-2xl bg-white p-5">
              <span
                data-success-badge
                className="inline-flex size-12 shrink-0 items-center justify-center rounded-full bg-forest text-ecru"
              >
                <Check size={22} strokeWidth={2.5} />
              </span>
              <div>
                <p className="text-sm text-muted">Votre code de confirmation</p>
                <p className="mt-0.5 text-xl font-medium tracking-[0.04em] text-forest tabular-nums">
                  {confirmed.code}
                </p>
              </div>
            </div>

            <dl data-success className="mt-6 space-y-3 text-sm">
              <div className="flex justify-between gap-6">
                <dt className="text-muted">Séance</dt>
                <dd className="text-right font-medium text-forest">{confirmed.course}</dd>
              </div>
              <div className="flex justify-between gap-6">
                <dt className="text-muted">Créneau</dt>
                <dd className="text-right font-medium text-forest">{confirmedDateLabel}</dd>
              </div>
              <div className="flex justify-between gap-6">
                <dt className="text-muted">Coach</dt>
                <dd className="text-right font-medium text-forest">{confirmed.coach}</dd>
              </div>
              <div className="flex justify-between gap-6">
                <dt className="text-muted">Réglé</dt>
                <dd className="text-right font-medium text-forest">{confirmed.price} €</dd>
              </div>
            </dl>

            <p data-success className="mt-6 text-sm leading-relaxed text-muted">
              Présentez ce code à l&apos;accueil dix minutes avant la séance. La réservation est
              enregistrée sur le serveur du studio.
              {mailStatus === "sent"
                ? ` Un email de confirmation a été envoyé à ${confirmed.email}.`
                : null}
              {mailStatus === "skipped"
                ? " L'envoi d'email n'est pas configuré sur ce serveur. La confirmation reste affichée ici."
                : null}
              {mailStatus === "failed"
                ? " L'email de confirmation n'a pas pu être envoyé. La confirmation reste affichée ici."
                : null}{" "}
              Démonstration : aucun paiement réel n&apos;a été effectué.
            </p>

            <Link
              data-success
              href="/admin"
              className="mt-5 inline-flex items-center gap-1.5 text-sm font-medium text-forest underline-offset-4 hover:underline"
            >
              Voir dans l&apos;espace admin
              <ArrowRight size={15} aria-hidden="true" />
            </Link>

            <button
              type="button"
              onClick={onClose}
              className="mt-6 inline-flex w-full items-center justify-center rounded-full bg-forest px-6 py-3.5 text-sm font-medium text-ecru transition-colors hover:bg-forest-soft"
            >
              Fermer
            </button>
          </div>
        ) : (
          <>
            <p className="mt-4 text-sm leading-relaxed text-muted">
              {dateLabel} · {slot.duration} min · {slot.coach}
            </p>

            <form onSubmit={handleSubmit} className="mt-6 space-y-5" noValidate>
              <fieldset className="space-y-4" aria-label="Vos coordonnées">
                <p className="text-sm font-medium text-forest">Vos coordonnées</p>

                <Field
                  label="Nom complet"
                  id="booking-name"
                  error={errors.name}
                  autoComplete="name"
                  value={fields.name}
                  onChange={(value) => update("name", value)}
                  ref={firstFieldRef}
                />
                <Field
                  label="Email"
                  id="booking-email"
                  type="email"
                  inputMode="email"
                  autoComplete="email"
                  error={errors.email}
                  value={fields.email}
                  onChange={(value) => update("email", value)}
                />
                <Field
                  label="Téléphone"
                  id="booking-phone"
                  type="tel"
                  inputMode="tel"
                  autoComplete="tel"
                  error={errors.phone}
                  value={fields.phone}
                  onChange={(value) => update("phone", value)}
                />
              </fieldset>

              <fieldset
                className="space-y-4 rounded-2xl bg-white p-5"
                aria-label="Paiement sécurisé"
              >
                <p className="text-sm font-medium text-forest">Paiement sécurisé</p>

                <Field
                  label="Numéro de carte"
                  id="booking-card"
                  inputMode="numeric"
                  autoComplete="cc-number"
                  placeholder="4242 4242 4242 4242"
                  error={errors.card}
                  value={fields.card}
                  onChange={(value) => update("card", formatCard(value))}
                />
                <div className="grid grid-cols-2 gap-4">
                  <Field
                    label="Expiration"
                    id="booking-expiry"
                    inputMode="numeric"
                    autoComplete="cc-exp"
                    placeholder="MM/AA"
                    error={errors.expiry}
                    value={fields.expiry}
                    onChange={(value) => update("expiry", formatExpiry(value))}
                  />
                  <Field
                    label="CVC"
                    id="booking-cvc"
                    inputMode="numeric"
                    autoComplete="cc-csc"
                    placeholder="123"
                    error={errors.cvc}
                    value={fields.cvc}
                    onChange={(value) => update("cvc", value.replace(/\D/g, "").slice(0, 4))}
                  />
                </div>
                <p className="flex items-center gap-2 text-[13px] text-muted">
                  <Lock size={13} aria-hidden="true" />
                  Simulation de paiement. Aucune carte n&apos;est débitée.
                </p>
              </fieldset>

              {apiError ? (
                <p
                  role="alert"
                  className="rounded-xl bg-[#f6e9e6] px-4 py-3 text-sm leading-relaxed text-[#8f3a2a]"
                >
                  {apiError}
                </p>
              ) : null}

              <button
                type="submit"
                disabled={submitting}
                className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-forest px-6 py-4 text-sm font-medium text-ecru transition-colors hover:bg-forest-soft disabled:cursor-not-allowed disabled:opacity-70"
              >
                {submitting ? "Enregistrement…" : `Confirmer et régler (${price})`}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );

  return typeof document === "undefined" ? null : createPortal(content, document.body);
}

type FieldProps = {
  label: string;
  id: string;
  error?: string;
  type?: string;
  inputMode?: "text" | "email" | "tel" | "numeric";
  autoComplete?: string;
  placeholder?: string;
  value: string;
  onChange: (value: string) => void;
};

const Field = ({
  label,
  id,
  error,
  type = "text",
  inputMode,
  autoComplete,
  placeholder,
  value,
  onChange,
  ref,
}: FieldProps & { ref?: Ref<HTMLInputElement> }) => (
  <div>
    <label htmlFor={id} className="mb-1.5 block text-sm text-forest">
      {label}
    </label>
    <input
      ref={ref}
      id={id}
      name={id}
      type={type}
      inputMode={inputMode}
      autoComplete={autoComplete}
      placeholder={placeholder}
      value={value}
      onChange={(event) => onChange(event.target.value)}
      aria-invalid={error ? "true" : undefined}
      aria-describedby={error ? `${id}-error` : undefined}
      className={`w-full rounded-xl border bg-white px-4 py-3 text-base text-forest placeholder:text-muted/50 focus:outline-none focus-visible:outline-none focus:ring-2 focus:ring-sage ${
        error ? "border-[#a4442f]" : "border-field"
      }`}
    />
    {error ? (
      <p id={`${id}-error`} className="mt-1.5 text-[13px] text-[#a4442f]">
        {error}
      </p>
    ) : null}
  </div>
);
