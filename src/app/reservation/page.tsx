import { Suspense } from "react";
import type { Metadata } from "next";
import { ReservationStatus } from "@/components/ReservationStatus";
import { StudioShell } from "@/components/StudioShell";

export const metadata: Metadata = {
  title: "Votre réservation, Basic IT",
  robots: { index: false, follow: false },
};

function ReservationFallback() {
  return (
    <div className="w-full max-w-xl rounded-2xl bg-white p-7 sm:p-9" aria-live="polite">
      <h1 className="text-2xl font-medium tracking-[-0.02em] text-forest">
        Vérification de la réservation…
      </h1>
      <p className="mt-3 text-sm leading-relaxed text-muted">
        Nous interrogeons Stripe pour connaître l&apos;état du paiement.
      </p>
    </div>
  );
}

export default function ReservationPage() {
  return (
    <StudioShell
      statement="À très vite au studio."
      note="Votre réservation et son code, au même endroit."
    >
      <Suspense fallback={<ReservationFallback />}>
        <ReservationStatus />
      </Suspense>
    </StudioShell>
  );
}
