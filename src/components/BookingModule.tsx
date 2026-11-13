"use client";

import { useMemo, useState, useSyncExternalStore } from "react";
import { ArrowRight } from "lucide-react";
import { BookingModal } from "@/components/BookingModal";
import {
  CAPACITY,
  FILTERS,
  FORMATS,
  PRICE,
  SESSION_TEMPLATES,
  bookedCount,
  buildDays,
  type Day,
  type FormatKey,
  type Slot,
} from "@/lib/sessions";

const EMPTY_DAYS: Day[] = [];
let cachedDays: Day[] | null = null;

function getDaysSnapshot() {
  cachedDays ??= buildDays();
  return cachedDays;
}

function subscribeToNothing() {
  return () => {};
}

export function BookingModule() {
  // Dates are built on the client so a page opened days after the build still
  // shows the real next seven days. The server snapshot is empty, so the rail
  // renders a placeholder until hydration finishes.
  const days = useSyncExternalStore(subscribeToNothing, getDaysSnapshot, () => EMPTY_DAYS);
  const [dayIndex, setDayIndex] = useState(0);
  const [filter, setFilter] = useState<"tous" | FormatKey>("tous");
  const [extra, setExtra] = useState<Record<string, number>>({});
  const [selected, setSelected] = useState<Slot | null>(null);

  const day = days[dayIndex];

  const slots = useMemo(() => {
    if (!day || day.closed) return [];
    return SESSION_TEMPLATES.map((session, index) => {
      const format = FORMATS[session.format];
      const key = `${day.iso}-${index}`;
      const booked = Math.min(CAPACITY, bookedCount(dayIndex, index) + (extra[key] ?? 0));
      return {
        id: key,
        dateIso: day.iso,
        dateLong: `${day.weekdayLong} ${day.day} ${day.month}`,
        time: session.time,
        format: session.format,
        name: format.name,
        coach: format.coach,
        duration: format.duration,
        remaining: CAPACITY - booked,
      } satisfies Slot;
    });
  }, [day, dayIndex, extra]);

  const visible = filter === "tous" ? slots : slots.filter((slot) => slot.format === filter);
  const monthLabel = days[0]
    ? `${days[0].month.charAt(0).toUpperCase()}${days[0].month.slice(1)}`
    : "";

  return (
    <div className="rounded-[1.75rem] bg-white p-4 sm:p-6 lg:p-8">
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <p className="text-sm text-muted">
          {monthLabel ? `${monthLabel} · 7 prochains jours` : "7 prochains jours"}
        </p>
        <p className="text-sm text-muted">
          Séance à l&apos;unité · <span className="font-medium text-forest">{PRICE} €</span>
        </p>
      </div>

      {days.length === 0 ? (
        <div className="mt-5 h-[76px] rounded-2xl bg-bone" aria-hidden="true" />
      ) : (
        <div
          className="mt-5 grid grid-cols-7 gap-1.5 sm:gap-2"
          role="group"
          aria-label="Choisir un jour"
          suppressHydrationWarning
        >
          {days.map((item, index) => {
            const active = index === dayIndex;
            return (
              <button
                key={item.iso}
                type="button"
                aria-pressed={active}
                aria-label={`${item.weekdayLong} ${item.day} ${item.month}${item.closed ? ", studio fermé" : ""}`}
                onClick={() => setDayIndex(index)}
                className={`flex flex-col items-center gap-0.5 rounded-xl py-2.5 transition-colors sm:py-3 ${
                  active
                    ? "bg-forest text-ecru"
                    : "bg-bone text-forest hover:bg-bone-deep"
                }`}
              >
                <span
                  className={`text-[13px] ${
                    active ? "text-sage-soft" : "text-muted"
                  }`}
                >
                  {item.weekday}
                </span>
                <span className="text-base font-medium tabular-nums sm:text-lg">{item.day}</span>
              </button>
            );
          })}
        </div>
      )}

      <div className="mt-6 flex flex-wrap items-center gap-2" role="group" aria-label="Filtrer par format">
        {FILTERS.map((item) => {
          const active = item.key === filter;
          return (
            <button
              key={item.key}
              type="button"
              aria-pressed={active}
              onClick={() => setFilter(item.key)}
              className={`inline-flex min-h-11 items-center rounded-full px-4 text-sm transition-colors ${
                active
                  ? "bg-forest text-ecru"
                  : "bg-bone text-forest hover:bg-bone-deep"
              }`}
            >
              {item.label}
            </button>
          );
        })}
      </div>

      <div className="mt-5">
        <p className="sr-only" aria-live="polite">
          {visible.length} séance{visible.length > 1 ? "s" : ""} disponible
          {visible.length > 1 ? "s" : ""} pour ce filtre.
        </p>

        {days.length === 0 ? (
          <div className="space-y-2" aria-hidden="true">
            {Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="h-[76px] rounded-xl bg-bone/70" />
            ))}
          </div>
        ) : day?.closed ? (
          <div className="rounded-2xl bg-bone px-5 py-10 text-center">
            <p className="text-base font-medium text-forest">Le studio est fermé le dimanche.</p>
            <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-muted">
              Repos, mobilité à la maison, et on se retrouve lundi dès 7h15. Choisissez un autre
              jour pour réserver.
            </p>
          </div>
        ) : visible.length === 0 ? (
          <div className="rounded-2xl bg-bone px-5 py-10 text-center">
            <p className="text-base font-medium text-forest">Aucune séance pour ce filtre.</p>
            <p className="mt-2 text-sm text-muted">
              Essayez « Tous » ou choisissez une autre date.
            </p>
          </div>
        ) : (
          <ul className="space-y-2">
            {visible.map((slot) => {
              const full = slot.remaining === 0;
              const placesLabel = full
                ? "Complet"
                : slot.remaining <= 2
                  ? `Plus que ${slot.remaining} place${slot.remaining > 1 ? "s" : ""}`
                  : `${slot.remaining} places`;

              return (
                <li key={slot.id}>
                  <button
                    type="button"
                    disabled={full}
                    onClick={() => setSelected(slot)}
                    className={`group grid w-full grid-cols-[3.6rem_1fr] items-center gap-x-4 gap-y-3 rounded-xl px-4 py-4 text-left transition-colors sm:grid-cols-[4rem_1fr_auto] sm:px-5 ${
                      full
                        ? "cursor-not-allowed bg-bone/40 opacity-60"
                        : "bg-bone/60 hover:bg-bone"
                    }`}
                  >
                    <span className="text-lg font-medium tabular-nums text-forest sm:text-xl">
                      {slot.time}
                    </span>
                    <span className="min-w-0">
                      <span className="block truncate font-medium text-forest">{slot.name}</span>
                      <span className="mt-0.5 block text-sm text-muted">
                        {slot.coach} · {slot.duration} min
                      </span>
                    </span>
                    <span className="col-span-2 flex items-center justify-between gap-4 sm:col-span-1 sm:justify-end">
                      <span className="flex items-center gap-2.5">
                        <span className="hidden items-center gap-[3px] md:flex" aria-hidden="true">
                          {Array.from({ length: CAPACITY }).map((_, dot) => (
                            <span
                              key={dot}
                              className={`size-1.5 rounded-full ${
                                dot < slot.remaining ? "bg-sage-ink" : "bg-sage/30"
                              }`}
                            />
                          ))}
                        </span>
                        <span
                          className={`text-[13px] ${full ? "text-muted" : "text-sage-ink"}`}
                        >
                          {placesLabel}
                        </span>
                      </span>
                      <span
                        className={`inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-medium ${
                          full
                            ? "bg-bone-deep text-muted"
                            : "bg-forest text-ecru transition-colors group-hover:bg-forest-soft"
                        }`}
                      >
                        {full ? "Complet" : "Réserver"}
                        {full ? null : <ArrowRight size={14} aria-hidden="true" />}
                      </span>
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <p className="mt-6 text-[13px] leading-relaxed text-muted">
        Paiement simulé pour cette démonstration : aucune carte n&apos;est débitée, aucun email
        n&apos;est envoyé. Annulation gratuite jusqu&apos;à 12 h avant la séance.
      </p>

      {selected ? (
        <BookingModal
          slot={selected}
          onClose={() => setSelected(null)}
          onConfirmed={(slotId) => {
            setExtra((current) => ({ ...current, [slotId]: (current[slotId] ?? 0) + 1 }));
          }}
        />
      ) : null}
    </div>
  );
}
