import type { Metadata, Viewport } from "next";
import { Archivo } from "next/font/google";
import "./globals.css";

const archivo = Archivo({
  subsets: ["latin"],
  variable: "--font-archivo",
  display: "swap",
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: "Basic IT, studio de coaching à Paris",
  description:
    "Un studio de coaching au cœur du 11e. Huit personnes maximum, un coach, cinquante minutes pour progresser vraiment. Force, HIIT et mobilité.",
  openGraph: {
    title: "Basic IT, studio de coaching à Paris",
    description:
      "Moins de bruit, plus d'impact. Séances en groupe de huit, encadrées par un coach, dans un studio du 11e arrondissement.",
    locale: "fr_FR",
    type: "website",
    images: [{ url: "/og.jpg", width: 1600, height: 1067, alt: "Le studio Basic IT" }],
  },
};

export const viewport: Viewport = {
  themeColor: "#0b2b20",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" className={archivo.variable} data-scroll-behavior="smooth">
      <body className="font-sans">
        <a
          href="#contenu"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[60] focus:rounded-full focus:bg-forest focus:px-5 focus:py-3 focus:text-sm focus:text-ecru"
        >
          Aller au contenu
        </a>
        {children}
      </body>
    </html>
  );
}
