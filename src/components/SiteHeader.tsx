"use client";

import { useEffect, useState } from "react";
import { Menu, X } from "lucide-react";

const LINKS = [
  { href: "#concept", label: "Le Concept" },
  { href: "#seances", label: "Nos Séances" },
  { href: "#coachs", label: "Les Coachs" },
];

export function SiteHeader() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <header className="sticky top-0 z-40 bg-ecru">
      <div className="mx-auto flex h-20 w-full max-w-[1240px] items-center justify-between gap-6 px-6 md:px-10">
        <a
          href="#contenu"
          className="flex items-baseline gap-1.5 text-base font-semibold tracking-[0.16em] text-forest"
          aria-label="Basic IT, retour en haut"
        >
          BASIC <span className="text-sage-ink">IT</span>
        </a>

        <nav aria-label="Navigation principale" className="hidden items-center gap-9 md:flex">
          {LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="text-sm text-muted transition-colors hover:text-forest"
            >
              {link.label}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <a
            href="#reserver"
            className="inline-flex items-center rounded-full bg-forest px-4 py-2.5 text-sm font-medium text-ecru transition-colors hover:bg-forest-soft sm:px-5 sm:py-3"
          >
            <span className="sm:hidden">Réserver</span>
            <span className="hidden sm:inline">Réserver ma séance</span>
          </a>
          <button
            type="button"
            onClick={() => setOpen((value) => !value)}
            aria-expanded={open}
            aria-controls="menu-mobile"
            aria-label={open ? "Fermer le menu" : "Ouvrir le menu"}
            className="inline-flex size-11 items-center justify-center rounded-full bg-bone text-forest transition-colors hover:bg-bone-deep md:hidden"
          >
            {open ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>
      </div>

      {open ? (
        <div id="menu-mobile" className="bg-bone px-6 pb-6 pt-2 md:hidden">
          <nav aria-label="Navigation mobile" className="flex flex-col">
            {LINKS.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                className="py-3 text-base text-forest"
              >
                {link.label}
              </a>
            ))}
            <a
              href="#reserver"
              onClick={() => setOpen(false)}
              className="mt-3 inline-flex w-fit items-center rounded-full bg-forest px-5 py-3 text-sm font-medium text-ecru"
            >
              Réserver ma séance
            </a>
          </nav>
        </div>
      ) : null}
    </header>
  );
}
