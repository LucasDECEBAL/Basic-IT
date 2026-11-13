"use client";

import Link from "next/link";
import { useMemo, useRef, useState } from "react";
import { Search, Trash2 } from "lucide-react";
import type { Booking } from "@/lib/bookings";
import { gsap, useGSAP } from "@/lib/gsap";
import { prefersReducedMotion } from "@/lib/motion";
import { FILTERS, FORMATS, type FormatKey } from "@/lib/sessions";
import { useBookings } from "@/lib/useBookings";

const money = new Intl.NumberFormat("fr-FR", {
  style: "currency",
  currency: "EUR",
  maximumFractionDigits: 0,
});

function shortDate(iso: string) {
  const date = new Date(`${iso}T12:00:00`);
  if (Number.isNaN(date.getTime())) return iso;
  return date
    .toLocaleDateString("fr-FR", { weekday: "short", day: "numeric", month: "short" })
    .replace(".", "");
}

function compactDate(iso: string) {
  const date = new Date(`${iso}T12:00:00`);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
}

function formatOf(booking: Booking) {
  return FORMATS[booking.format]?.short ?? booking.format;
}

export function AdminDashboard() {
  const { bookings, status, error, refresh } = useBookings();
  const [query, setQuery] = useState("");
  const [format, setFormat] = useState<"tous" | FormatKey>("tous");
  const [confirmClear, setConfirmClear] = useState(false);
  const [clearing, setClearing] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const pageRef = useRef<HTMLDivElement>(null);
  const rowsRef = useRef<HTMLDivElement>(null);

  const sorted = useMemo(
    () => [...bookings].sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    [bookings],
  );

  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return sorted.filter((booking) => {
      if (format !== "tous" && booking.format !== format) return false;
      if (!needle) return true;
      return [booking.name, booking.email, booking.code, booking.course, booking.coach, booking.dateLong]
        .join(" ")
        .toLowerCase()
        .includes(needle);
    });
  }, [sorted, query, format]);

  const revenue = bookings.reduce((total, booking) => total + booking.price, 0);
  const sessionCount = new Set(bookings.map((booking) => booking.slotId)).size;

  const firstSession = useMemo(() => {
    return [...bookings].sort((a, b) =>
      `${a.dateIso}T${a.time}`.localeCompare(`${b.dateIso}T${b.time}`),
    )[0];
  }, [bookings]);

  const initialLoading = status === "loading" && bookings.length === 0;

  const handleDelete = async (id: string) => {
    setActionError(null);
    setDeletingId(id);
    try {
      const response = await fetch(`/api/bookings/${encodeURIComponent(id)}`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      await refresh();
    } catch {
      setActionError("Suppression impossible. Le serveur n'a pas répondu.");
    } finally {
      setDeletingId(null);
    }
  };

  const handleClear = async () => {
    setActionError(null);
    setClearing(true);
    try {
      const response = await fetch("/api/bookings", { method: "DELETE" });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      setConfirmClear(false);
      await refresh();
    } catch {
      setActionError("Effacement impossible. Le serveur n'a pas répondu.");
    } finally {
      setClearing(false);
    }
  };

  useGSAP(
    () => {
      if (prefersReducedMotion()) return;
      gsap
        .timeline({ defaults: { ease: "power3.out" } })
        .from("[data-admin-head]", { y: 16, autoAlpha: 0, duration: 0.6 })
        .from("[data-admin-kpi]", { y: 16, autoAlpha: 0, duration: 0.5, stagger: 0.06 }, "-=0.3")
        .from("[data-admin-toolbar]", { y: 10, autoAlpha: 0, duration: 0.45 }, "-=0.25");
    },
    { scope: pageRef },
  );

  useGSAP(
    () => {
      if (!rowsRef.current || prefersReducedMotion()) return;
      const rows = rowsRef.current.querySelectorAll("[data-booking-row]");
      if (rows.length === 0) return;
      gsap.from(rows, {
        y: 10,
        autoAlpha: 0,
        duration: 0.4,
        stagger: 0.035,
        ease: "power2.out",
      });
    },
    { scope: rowsRef, dependencies: [format, bookings.length] },
  );

  return (
    <div ref={pageRef} className="mx-auto w-full max-w-[1240px] px-6 pb-20 pt-4 md:px-10 lg:pt-8">
      <div data-admin-head className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-[28px] font-medium tracking-[-0.025em] text-forest sm:text-[32px]">
            Réservations
          </h1>
          <p className="mt-2 max-w-xl text-sm leading-relaxed text-muted">
            Les réservations enregistrées sur le serveur, sur les sept prochains jours.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          {bookings.length > 0 ? (
            confirmClear ? (
              <span className="flex items-center gap-3 text-sm">
                <span className="text-muted">Tout effacer ?</span>
                <button
                  type="button"
                  onClick={() => void handleClear()}
                  disabled={clearing}
                  className="rounded-full bg-bone-deep px-4 py-2.5 font-medium text-forest transition-colors hover:bg-bone disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {clearing ? "Effacement…" : "Confirmer"}
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmClear(false)}
                  className="text-muted underline-offset-4 hover:text-forest hover:underline"
                >
                  Annuler
                </button>
              </span>
            ) : (
              <button
                type="button"
                onClick={() => setConfirmClear(true)}
                className="rounded-full px-4 py-2.5 text-sm text-muted transition-colors hover:bg-bone hover:text-forest"
              >
                Tout effacer
              </button>
            )
          ) : null}
          <Link
            href="/#reserver"
            className="inline-flex items-center rounded-full bg-forest px-5 py-3 text-sm font-medium text-ecru transition-colors hover:bg-forest-soft"
          >
            Nouvelle réservation
          </Link>
        </div>
      </div>

      <section
        aria-label="Chiffres de la démonstration"
        className="mt-8 grid grid-cols-2 gap-x-6 gap-y-8 rounded-2xl bg-white p-6 md:grid-cols-4 md:p-8"
      >
        {[
          {
            label: "Réservations",
            value: initialLoading ? "—" : String(bookings.length),
          },
          {
            label: "Séances concernées",
            value: initialLoading ? "—" : String(sessionCount),
          },
          { label: "Revenu", value: initialLoading ? "—" : money.format(revenue) },
          {
            label: "Première séance",
            value: initialLoading
              ? "—"
              : firstSession
                ? `${compactDate(firstSession.dateIso)} · ${firstSession.time}`
                : "Aucune",
          },
        ].map((stat) => (
          <div key={stat.label} data-admin-kpi>
            <p className="text-[13px] text-muted">{stat.label}</p>
            <p
              className={`mt-2 font-medium tracking-[-0.02em] text-forest ${
                stat.label === "Première séance" ? "text-lg" : "text-[32px] tabular-nums"
              }`}
            >
              {stat.value}
            </p>
          </div>
        ))}
      </section>

      <div
        data-admin-toolbar
        className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"
      >
        <label className="relative w-full sm:max-w-sm">
          <span className="sr-only">Rechercher une réservation</span>
          <Search
            size={16}
            aria-hidden="true"
            className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-muted"
          />
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Nom, email ou code"
            className="h-11 w-full rounded-full border border-field bg-white pl-11 pr-4 text-sm text-forest placeholder:text-muted/60 focus:outline-none focus-visible:outline-none focus:ring-2 focus:ring-sage"
          />
        </label>

        <label className="flex items-center gap-3 text-sm text-muted">
          <span>Format</span>
          <select
            value={format}
            onChange={(event) => setFormat(event.target.value as "tous" | FormatKey)}
            className="h-11 rounded-full border border-field bg-white px-4 pr-8 text-sm text-forest focus:outline-none focus-visible:outline-none focus:ring-2 focus:ring-sage"
          >
            {FILTERS.map((item) => (
              <option key={item.key} value={item.key}>
                {item.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      {error || actionError ? (
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-xl bg-[#f6e9e6] px-4 py-3 text-sm text-[#8f3a2a]">
          <span>{actionError ?? error}</span>
          <button
            type="button"
            onClick={() => void refresh()}
            className="rounded-full bg-white px-3 py-1.5 text-[13px] font-medium text-[#8f3a2a]"
          >
            Réessayer
          </button>
        </div>
      ) : null}

      <div ref={rowsRef} className="mt-4 rounded-2xl bg-white">
        {initialLoading ? (
          <div className="px-6 py-10 text-center">
            <p className="text-base font-medium text-forest">Chargement des réservations…</p>
            <p className="mt-2 text-sm text-muted">Lecture du fichier du studio.</p>
          </div>
        ) : status === "error" && bookings.length === 0 ? (
          <div className="px-6 py-10 text-center">
            <p className="text-base font-medium text-forest">Serveur injoignable.</p>
            <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-muted">
              Vérifiez que le serveur Next tourne, puis réessayez. Les réservations sont stockées
              dans le fichier JSON du projet.
            </p>
            <button
              type="button"
              onClick={() => void refresh()}
              className="mt-5 rounded-full bg-forest px-5 py-2.5 text-sm font-medium text-ecru transition-colors hover:bg-forest-soft"
            >
              Réessayer
            </button>
          </div>
        ) : bookings.length === 0 ? (
          <div className="px-6 py-10 text-center">
            <p className="text-base font-medium text-forest">Aucune réservation pour l&apos;instant.</p>
            <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-muted">
              Les réservations faites depuis la page d&apos;accueil apparaissent ici, pour tous les
              appareils connectés au même serveur.
            </p>
            <Link
              href="/#reserver"
              className="mt-6 inline-flex items-center rounded-full bg-forest px-5 py-3 text-sm font-medium text-ecru transition-colors hover:bg-forest-soft"
            >
              Réserver une séance
            </Link>
          </div>
        ) : visible.length === 0 ? (
          <div className="px-6 py-10 text-center">
            <p className="text-base font-medium text-forest">Aucune réservation ne correspond.</p>
            <p className="mt-2 text-sm text-muted">Essayez un autre nom, un autre code ou « Tous ».</p>
            <button
              type="button"
              onClick={() => {
                setQuery("");
                setFormat("tous");
              }}
              className="mt-5 rounded-full bg-bone px-4 py-2.5 text-sm font-medium text-forest transition-colors hover:bg-bone-deep"
            >
              Réinitialiser les filtres
            </button>
          </div>
        ) : (
          <>
            <table className="hidden w-full border-collapse md:table">
              <caption className="sr-only">Réservations enregistrées sur le serveur du studio</caption>
              <thead>
                <tr className="text-left text-[13px] text-muted">
                  <th scope="col" className="px-6 py-4 font-normal">
                    Code
                  </th>
                  <th scope="col" className="px-4 py-4 font-normal">
                    Client
                  </th>
                  <th scope="col" className="px-4 py-4 font-normal">
                    Séance
                  </th>
                  <th scope="col" className="px-4 py-4 text-right font-normal">
                    Date
                  </th>
                  <th scope="col" className="px-4 py-4 text-right font-normal">
                    Montant
                  </th>
                  <th scope="col" className="w-14 px-4 py-4">
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {visible.map((booking) => (
                  <tr
                    key={booking.id}
                    data-booking-row
                    className="border-t border-bone align-middle"
                  >
                    <td className="px-6 py-4 text-[13px] font-medium tabular-nums text-sage-ink">
                      {booking.code}
                    </td>
                    <td className="px-4 py-4">
                      <p className="text-sm font-medium text-forest">{booking.name}</p>
                      <p className="mt-0.5 text-[13px] text-muted">{booking.email}</p>
                    </td>
                    <td className="px-4 py-4">
                      <p className="text-sm text-forest">{booking.course}</p>
                      <p className="mt-0.5 text-[13px] text-muted">
                        {booking.coach} · {formatOf(booking)}
                      </p>
                    </td>
                    <td className="px-4 py-4 text-right text-sm tabular-nums text-forest">
                      <p>{shortDate(booking.dateIso)}</p>
                      <p className="mt-0.5 text-[13px] text-muted">{booking.time}</p>
                    </td>
                    <td className="px-4 py-4 text-right text-sm font-medium tabular-nums text-forest">
                      {money.format(booking.price)}
                    </td>
                    <td className="px-4 py-4 text-right">
                      <button
                        type="button"
                        onClick={() => void handleDelete(booking.id)}
                        disabled={deletingId === booking.id}
                        aria-label={`Supprimer la réservation ${booking.code}`}
                        className="inline-flex size-9 items-center justify-center rounded-full text-muted transition-colors hover:bg-bone hover:text-[#a4442f] disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <Trash2 size={15} aria-hidden="true" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <ul className="md:hidden">
              {visible.map((booking) => (
                <li
                  key={booking.id}
                  data-booking-row
                  className="border-b border-bone px-5 py-5 last:border-b-0"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-[13px] font-medium tabular-nums text-sage-ink">
                        {booking.code}
                      </p>
                      <p className="mt-1 text-base font-medium text-forest">{booking.name}</p>
                      <p className="text-[13px] text-muted">{booking.email}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => void handleDelete(booking.id)}
                      disabled={deletingId === booking.id}
                      aria-label={`Supprimer la réservation ${booking.code}`}
                      className="inline-flex size-9 shrink-0 items-center justify-center rounded-full text-muted transition-colors hover:bg-bone hover:text-[#a4442f] disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <Trash2 size={15} aria-hidden="true" />
                    </button>
                  </div>

                  <div className="mt-3 flex items-end justify-between gap-4">
                    <div>
                      <p className="text-sm text-forest">{booking.course}</p>
                      <p className="mt-0.5 text-[13px] text-muted">
                        {booking.coach} · {formatOf(booking)}
                      </p>
                    </div>
                    <p className="shrink-0 text-sm font-medium tabular-nums text-forest">
                      {money.format(booking.price)}
                    </p>
                  </div>

                  <p className="mt-3 text-[13px] tabular-nums text-muted">
                    {shortDate(booking.dateIso)} · {booking.time}
                  </p>
                </li>
              ))}
            </ul>
          </>
        )}
      </div>

      <p className="mt-6 text-[13px] leading-relaxed text-muted">
        Réservations stockées dans le fichier JSON du serveur, partagées entre les appareils.
        Espace de démonstration sans authentification, à ne pas exposer tel quel en production.
      </p>
    </div>
  );
}
