import type { Metadata } from "next";
import { connection } from "next/server";
import { ReservationStatus } from "@/components/ReservationStatus";
import { StudioShell } from "@/components/StudioShell";

export const instant = false;

export const metadata: Metadata = {
  title: "Votre réservation, Basic IT",
  robots: { index: false, follow: false },
};

export default async function ReservationPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ session_id?: string | string[] }>;
}) {
  await connection();
  const { id } = await params;
  const query = await searchParams;
  const sessionId = typeof query.session_id === "string" ? query.session_id : null;

  return (
    <StudioShell
      statement="À très vite au studio."
      note="Votre réservation et son code, au même endroit."
    >
      <ReservationStatus id={id} sessionId={sessionId} />
    </StudioShell>
  );
}
