"use client";

import { useEffect, useRef, useState, type FormEvent, type Ref } from "react";
import { Lock, X } from "lucide-react";
import { createPortal } from "react-dom";
import { PRICE, type Slot } from "@/lib/sessions";

type BookingModalProps = {
  slot: Slot;
  onClose: () => void;
  onBooked: () => void | Promise<void>;
};

type Fields = {
  name: string;
  email: string;
  phone: string;
};

const EMPTY_FIELDS: Fields = {
  name: "",
  email: "",
  phone: "",
};

export function BookingModal({ slot, onClose, onBooked }: BookingModalProps) {
  const [fields, setFields] = useState<Fields>(EMPTY_FIELDS);
  const [errors, setErrors] = useState<Partial<Record<keyof Fields, string>>>({});
  const [submitting, setSubmitting] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  const panelRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const firstFieldRef = useRef<HTMLInputElement>(null);
  const submittedRef = useRef(false);
  const onCloseRef = useRef(onClose);

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

    if (fields.name.trim().length < 2) {
      next.name = "Indiquez votre nom complet.";
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(fields.email.trim())) {
      next.email = "Indiquez un email valide.";
    }
    if (fields.phone.replace(/\D/g, "").length < 10) {
      next.phone = "Indiquez un téléphone à 10 chiffres.";
    }

    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!validate()) {
      const firstError =
        panelRef.current?.querySelector<HTMLElement>('[aria-invalid="true"]');
      firstError?.focus();
      return;
    }

    if (submittedRef.current) return;
    submittedRef.current = true;
    setSubmitting(true);
    setApiError(null);

    try {
      const response = await fetch("/api/checkout", {
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
        url?: string;
        error?: string;
      };

      if (!response.ok || !data.url) {
        setApiError(data.error ?? "Le paiement n'a pas pu être préparé.");
        submittedRef.current = false;
        setSubmitting(false);
        void onBooked();
        return;
      }

      await onBooked();
      window.location.assign(data.url);
    } catch {
      setApiError(
        "Connexion au paiement impossible. Vérifiez que le serveur tourne.",
      );
      submittedRef.current = false;
      setSubmitting(false);
    }
  };

  const dateLabel = `${slot.dateLong} · ${slot.time}`;

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
              {slot.name}
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-muted">
              {dateLabel} · {slot.duration} min · {slot.coach}
            </p>
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

          <div className="rounded-2xl bg-white p-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-medium text-forest">
                  Paiement sécurisé par Stripe
                </p>
                <p className="mt-1 text-[13px] leading-relaxed text-muted">
                  Mode test. Vous allez être redirigé vers la page de paiement
                  Stripe. Utilisez la carte{" "}
                  <span className="whitespace-nowrap text-forest">
                    4242 4242 4242 4242
                  </span>
                  .
                </p>
              </div>
              <p className="shrink-0 text-lg font-medium tabular-nums text-forest">
                {PRICE} €
              </p>
            </div>
            <p className="mt-4 flex items-center gap-2 text-[13px] text-muted">
              <Lock size={13} aria-hidden="true" />
              Aucun débit réel. La place est bloquée pendant le paiement.
            </p>
          </div>

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
            {submitting
              ? "Préparation du paiement…"
              : `Payer ${PRICE} € avec Stripe`}
          </button>
        </form>
      </div>
    </div>
  );

  return typeof document === "undefined"
    ? null
    : createPortal(content, document.body);
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
