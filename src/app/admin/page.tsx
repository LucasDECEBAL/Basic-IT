import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { AdminDashboard } from "@/components/AdminDashboard";

export const metadata: Metadata = {
  title: "Réservations, Basic IT",
  description: "Espace de démonstration des réservations Basic IT.",
  robots: { index: false, follow: false },
};

export default function AdminPage() {
  return (
    <div className="min-h-screen bg-ecru">
      <header className="mx-auto flex h-20 w-full max-w-[1240px] items-center justify-between gap-4 px-6 md:px-10">
        <Link
          href="/"
          className="text-base font-semibold tracking-[0.16em] text-forest"
          aria-label="Basic IT, retour à l'accueil"
        >
          BASIC <span className="text-sage-ink">IT</span>
        </Link>
        <div className="flex items-center gap-4">
          <span className="hidden text-[13px] text-muted sm:inline">Espace de démonstration</span>
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-full bg-bone px-4 py-2.5 text-sm text-forest transition-colors hover:bg-bone-deep"
          >
            <ArrowLeft size={15} aria-hidden="true" />
            Retour au site
          </Link>
        </div>
      </header>
      <main>
        <AdminDashboard />
      </main>
    </div>
  );
}
