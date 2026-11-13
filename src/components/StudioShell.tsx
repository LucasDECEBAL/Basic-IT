import Link from "next/link";
import type { ReactNode } from "react";

type StudioShellProps = {
  statement: string;
  note: string;
  children: ReactNode;
};

/**
 * Split shell for the admin and reservation screens: a quiet forest panel on
 * wide screens, a centred card on the écru canvas.
 */
export function StudioShell({ statement, note, children }: StudioShellProps) {
  return (
    <div className="min-h-screen bg-ecru lg:grid lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
      <aside className="hidden bg-forest p-10 text-ecru lg:flex lg:flex-col lg:justify-between xl:p-14">
        <Link
          href="/"
          className="text-base font-semibold tracking-[0.16em] text-ecru"
        >
          BASIC <span className="text-sage">IT</span>
        </Link>

        <div>
          <p className="max-w-[14ch] text-[clamp(1.75rem,2.2vw,2.25rem)] font-medium leading-[1.04] tracking-[-0.03em]">
            {statement}
          </p>
          <p className="mt-5 max-w-xs text-sm leading-relaxed text-sage">
            {note}
          </p>
        </div>

        <div className="text-sm leading-relaxed text-sage-soft">
          <p>18 rue de la Folie-Méricourt</p>
          <p>75011 Paris</p>
        </div>
      </aside>

      <div className="flex min-h-screen flex-col">
        <header className="flex h-20 items-center px-6 lg:px-10">
          <Link
            href="/"
            className="text-base font-semibold tracking-[0.16em] text-forest lg:hidden"
          >
            BASIC <span className="text-sage-ink">IT</span>
          </Link>
        </header>
        <main className="flex flex-1 items-center justify-center px-6 pb-12 pt-2 lg:px-10">
          {children}
        </main>
      </div>
    </div>
  );
}
