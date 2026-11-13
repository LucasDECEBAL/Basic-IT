import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { AdminLoginForm } from "@/components/AdminLoginForm";
import { StudioShell } from "@/components/StudioShell";
import { isAdminConfigured, isAdminRequest } from "@/lib/server/admin-auth";

export const instant = false;

export const metadata: Metadata = {
  title: "Connexion admin, Basic IT",
  robots: { index: false, follow: false },
};

export default async function AdminLoginPage() {
  await connection();

  if (await isAdminRequest()) {
    redirect("/admin");
  }

  return (
    <StudioShell
      statement="Le studio, côté coulisses."
      note="Réservations, paiements et suivi des places, au même endroit."
    >
      <AdminLoginForm configured={isAdminConfigured()} />
    </StudioShell>
  );
}
