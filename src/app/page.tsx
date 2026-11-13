import Image from "next/image";
import Link from "next/link";
import { ArrowRight, ArrowUpRight } from "lucide-react";
import { BookingModule } from "@/components/BookingModule";
import { HeroMotion } from "@/components/HeroMotion";
import { Reveal } from "@/components/Reveal";
import { SiteHeader } from "@/components/SiteHeader";
import { FORMATS } from "@/lib/sessions";

const FORMAT_LIST = [FORMATS.force, FORMATS.cardio, FORMATS.mobilite];

const COACHES = [
  {
    name: "Camille Roux",
    role: "Force & Posture",
    credentials: "NSCA-CSCS",
    bio: "Ancienne athlète de force athlétique, neuf ans de coaching. Elle repère le détail qui change tout, puis vous laisse le répéter.",
    image: "/photos/coach-camille.jpg",
    alt: "Portrait de Camille Roux, coach force et posture chez Basic IT",
  },
  {
    name: "Malik Haddad",
    role: "HIIT Précision",
    credentials: "CQP APS",
    bio: "Préparateur physique, sept ans auprès de sportifs et de débutants. Il préfère un intervalle propre à dix répétitions approximatives.",
    image: "/photos/coach-malik.jpg",
    alt: "Portrait de Malik Haddad, coach HIIT chez Basic IT",
  },
  {
    name: "Inès Moreau",
    role: "Mobilité & Yoga Athlétique",
    credentials: "RYT-500",
    bio: "Professeure de yoga et de mobilité depuis six ans. Spécialiste des épaules de bureau et des hanches de coureurs.",
    image: "/photos/coach-ines.jpg",
    alt: "Portrait d'Inès Moreau, coach mobilité chez Basic IT",
  },
];

const FIGURES = [
  { value: "8", label: "participants maximum par séance" },
  { value: "50", label: "minutes d'entraînement encadré" },
  { value: "3", label: "formats, un seul niveau d'exigence" },
  { value: "180", label: "m² de studio, lumière naturelle" },
];

const PRACTICAL = [
  {
    title: "Adresse",
    lines: ["18 rue de la Folie-Méricourt", "75011 Paris"],
    link: {
      label: "Voir sur la carte",
      href: "https://www.google.com/maps/search/?api=1&query=18+rue+de+la+Folie-Mericourt+75011+Paris",
    },
  },
  {
    title: "Horaires",
    lines: ["Lundi au vendredi, 7h à 21h", "Samedi, 8h à 14h", "Dimanche, fermé"],
  },
  {
    title: "Accès",
    lines: ["Métro République (3, 5, 8, 9, 11)", "Métro Oberkampf (5, 9)", "Quatre minutes à pied"],
  },
  {
    title: "Contact",
    lines: ["bonjour@basic-it.fr", "01 99 00 12 34"],
    link: { label: "Écrire au studio", href: "mailto:bonjour@basic-it.fr" },
  },
];

export default function Home() {
  return (
    <>
      <SiteHeader />

      <main id="contenu">
        {/* Hero */}
        <section className="mx-auto w-full max-w-[1240px] px-6 pb-20 pt-10 md:px-10 lg:pb-28 lg:pt-16">
          <HeroMotion className="grid items-start gap-12 lg:grid-cols-12 lg:gap-8">
            <div className="lg:col-span-7 lg:pr-10">
              <h1
                data-hero-title
                className="text-[clamp(2.6rem,9vw,5.25rem)] font-medium leading-[0.92] tracking-[-0.045em] text-forest"
              >
                Moins de bruit,
                <br />
                plus d&apos;impact.
              </h1>

              <p data-hero-copy className="mt-7 max-w-[34rem] text-lg leading-relaxed text-ink sm:text-xl">
                Basic IT est un studio de coaching au cœur du 11e. Des séances de cinquante
                minutes, en groupe de huit, avec un coach qui vous regarde vraiment.
              </p>

              <div data-hero-actions className="mt-9 flex flex-wrap items-center gap-x-7 gap-y-4">
                <a
                  href="#reserver"
                  className="inline-flex items-center gap-2 rounded-full bg-forest px-6 py-3.5 text-sm font-medium text-ecru transition-colors hover:bg-forest-soft"
                >
                  Réserver ma séance
                  <ArrowRight size={16} aria-hidden="true" />
                </a>
                <a
                  href="#seances"
                  className="group inline-flex items-center gap-2 text-sm font-medium text-forest"
                >
                  Découvrir les trois formats
                  <ArrowUpRight
                    size={16}
                    aria-hidden="true"
                    className="transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
                  />
                </a>
              </div>

              <p data-hero-note className="mt-7 flex items-start gap-2.5 text-sm leading-relaxed text-sage-ink">
                <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-sage" aria-hidden="true" />
                Sessions limitées à 8 participants pour un suivi sur-mesure.
              </p>
            </div>

            <div data-hero-media className="relative lg:col-span-5">
              <div className="relative aspect-[4/5] overflow-hidden rounded-2xl bg-bone md:aspect-[16/10] lg:aspect-[4/5]">
                <Image
                  data-hero-image
                  src="/photos/studio.jpg"
                  alt="Deux membres du studio Basic IT assises dans la salle d'entraînement"
                  fill
                  priority
                  sizes="(min-width: 1024px) 40vw, 100vw"
                  className="object-cover"
                />
              </div>
              <div
                data-hero-caption
                className="absolute bottom-4 left-4 right-4 rounded-xl bg-ecru p-4 sm:left-5 sm:bottom-5 sm:right-auto sm:max-w-[15rem]"
              >
                <p className="text-[13px] text-sage-ink">Le studio</p>
                <p className="mt-1 text-sm font-medium leading-snug text-forest">
                  18 rue de la Folie-Méricourt, Paris 11e
                </p>
              </div>
            </div>
          </HeroMotion>
        </section>

        {/* Concept */}
        <section id="concept" className="bg-forest text-ecru">
          <div className="mx-auto w-full max-w-[1240px] px-6 py-24 md:px-10 lg:py-32">
            <div className="grid gap-10 lg:grid-cols-12">
              <Reveal className="lg:col-span-7">
                <h2 className="max-w-[18ch] text-[clamp(2.2rem,4vw,3.6rem)] font-medium leading-[0.98] tracking-[-0.035em]">
                  Un studio, pas une salle.
                </h2>
              </Reveal>
              <Reveal className="lg:col-span-5 lg:pt-2" delay={120}>
                <p className="text-base leading-relaxed text-sage-soft sm:text-lg">
                  On a ouvert Basic IT avec une conviction simple : ce n&apos;est pas le matériel
                  qui fait progresser, c&apos;est l&apos;attention. Alors on limite chaque séance à
                  huit personnes, on garde un coach par groupe et on prend le temps de corriger.
                </p>
                <p className="mt-5 text-base leading-relaxed text-sage-soft">
                  Pas de miroirs partout, pas de musique à fond, pas d&apos;abonnement qu&apos;on
                  oublie. Trois formats, des créneaux clairs, et la possibilité de réserver à
                  l&apos;unité.
                </p>
              </Reveal>
            </div>

            <dl className="mt-16 grid grid-cols-2 gap-x-8 gap-y-10 md:mt-20 md:grid-cols-4">
              {FIGURES.map((figure, index) => (
                <Reveal key={figure.label} delay={index * 80}>
                  <dt className="sr-only">{figure.label}</dt>
                  <dd>
                    <span className="block text-[clamp(2.2rem,4vw,3.6rem)] font-medium leading-none tracking-[-0.04em] tabular-nums">
                      {figure.value}
                    </span>
                    <span className="mt-3 block max-w-[15rem] text-sm leading-relaxed text-sage">
                      {figure.label}
                    </span>
                  </dd>
                </Reveal>
              ))}
            </dl>
          </div>
        </section>

        {/* Formats */}
        <section id="seances" className="mx-auto w-full max-w-[1240px] px-6 py-24 md:px-10 lg:py-32">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <Reveal>
              <h2 className="max-w-[18ch] text-[clamp(2.2rem,4vw,3.6rem)] font-medium leading-[0.98] tracking-[-0.035em] text-forest">
                Trois formats, une exigence.
              </h2>
            </Reveal>
            <Reveal delay={100}>
              <p className="max-w-2xl text-base leading-relaxed text-ink lg:max-w-md">
                Chaque format a un objectif précis et une intensité assumée. Vous ne choisissez pas
                un cours, vous choisissez ce que vous venez travailler.
              </p>
            </Reveal>
          </div>

          <div className="mt-12 grid gap-6 lg:mt-16 lg:grid-cols-3">
            {FORMAT_LIST.map((format, index) => (
              <Reveal
                key={format.key}
                delay={index * 90}
                className={index === 1 ? "lg:mt-12" : undefined}
              >
                <article className="flex h-full flex-col overflow-hidden rounded-2xl bg-white sm:flex-row lg:flex-col">
                  <div className="relative aspect-[4/5] w-full shrink-0 overflow-hidden bg-bone sm:aspect-auto sm:w-2/5 lg:aspect-[4/5] lg:w-full">
                    <Image
                      src={format.image}
                      alt={
                        format.key === "force"
                          ? "Barre chargée posée sur un rack dans le studio"
                          : format.key === "cardio"
                            ? "Membre du studio pendant une séance de cardio intense"
                            : "Trois personnes en étirement de yoga dans une salle lumineuse"
                      }
                      fill
                      sizes="(min-width: 768px) 33vw, 100vw"
                      className="object-cover transition-transform duration-700 ease-out hover:scale-[1.03]"
                    />
                  </div>
                  <div className="flex grow flex-col p-6">
                    <p className="text-sm text-sage-ink">{format.days}</p>
                    <h3 className="mt-2 text-2xl font-medium leading-tight tracking-[-0.02em] text-forest">
                      {format.name}
                    </h3>
                    <p className="mt-3 text-base leading-relaxed text-ink">{format.description}</p>

                    <dl className="mt-6 grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
                      <div>
                        <dt className="text-muted">Durée</dt>
                        <dd className="mt-0.5 text-forest">50 minutes</dd>
                      </div>
                      <div>
                        <dt className="text-muted">Places</dt>
                        <dd className="mt-0.5 text-forest">8 maximum</dd>
                      </div>
                      <div>
                        <dt className="text-muted">Intensité</dt>
                        <dd className="mt-0.5 text-forest">{format.intensity}</dd>
                      </div>
                      <div>
                        <dt className="text-muted">Coach</dt>
                        <dd className="mt-0.5 text-forest">{format.coach}</dd>
                      </div>
                    </dl>

                    <a
                      href="#reserver"
                      className="group mt-auto inline-flex items-center gap-1.5 pt-6 text-sm font-medium text-forest"
                    >
                      Réserver ce format
                      <ArrowRight
                        size={15}
                        aria-hidden="true"
                        className="transition-transform group-hover:translate-x-0.5"
                      />
                    </a>
                  </div>
                </article>
              </Reveal>
            ))}
          </div>
        </section>

        {/* Coaches */}
        <section id="coachs" className="bg-bone">
          <div className="mx-auto w-full max-w-[1240px] px-6 py-24 md:px-10 lg:py-32">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
              <Reveal>
                <h2 className="max-w-[18ch] text-[clamp(2.2rem,4vw,3.6rem)] font-medium leading-[0.98] tracking-[-0.035em] text-forest">
                  Des coachs qui vous regardent.
                </h2>
              </Reveal>
              <Reveal delay={100}>
                <p className="max-w-2xl text-base leading-relaxed text-ink lg:max-w-md">
                  Trois spécialités, trois façons de vous regarder bouger. Tous suivent le même
                  principe : huit personnes maximum, et le temps de vous voir.
                </p>
              </Reveal>
            </div>

            <div className="mt-12 grid gap-8 sm:grid-cols-2 lg:mt-16 lg:grid-cols-3 lg:gap-6">
              {COACHES.map((coach, index) => (
                <Reveal key={coach.name} as="figure" delay={index * 90}>
                  <div className="relative aspect-[4/5] overflow-hidden rounded-2xl bg-bone-deep">
                    <Image
                      src={coach.image}
                      alt={coach.alt}
                      fill
                      sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                      className="object-cover"
                    />
                  </div>
                  <figcaption className="mt-5">
                    <div className="flex items-baseline justify-between gap-4">
                      <h3 className="text-xl font-medium tracking-[-0.02em] text-forest">
                        {coach.name}
                      </h3>
                      <span className="shrink-0 text-[13px] text-sage-ink">{coach.credentials}</span>
                    </div>
                    <p className="mt-1 text-sm text-sage-ink">{coach.role}</p>
                    <p className="mt-3 text-base leading-relaxed text-ink">{coach.bio}</p>
                  </figcaption>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* Studio */}
        <section className="mx-auto w-full max-w-[1240px] px-6 py-24 md:px-10 lg:py-32">
          <div className="grid items-end gap-8 lg:grid-cols-12">
            <Reveal className="lg:col-span-7">
              <h2 className="max-w-[18ch] text-[clamp(2.2rem,4vw,3.6rem)] font-medium leading-[0.98] tracking-[-0.035em] text-forest">
                Un lieu calme, au cœur du 11e.
              </h2>
            </Reveal>
            <Reveal className="lg:col-span-5" delay={100}>
              <p className="max-w-2xl text-base leading-relaxed text-ink">
                Un ancien atelier de 180 m², remis à nu. Béton, acier, lumière du matin. Assez
                d&apos;espace pour bouger sans se croiser, assez de silence pour entendre son coach.
              </p>
            </Reveal>
          </div>

          <Reveal className="mt-10" delay={80}>
            <div className="relative aspect-[4/3] overflow-hidden rounded-2xl bg-bone sm:aspect-[16/9]">
              <Image
                src="/photos/studio-space.jpg"
                alt="Vue du studio Basic IT : espace d'entraînement, racks et lumière du jour"
                fill
                sizes="(min-width: 1240px) 1160px, 100vw"
                className="object-cover"
              />
            </div>
          </Reveal>

          <div className="mt-10 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {PRACTICAL.map((block, index) => (
              <Reveal key={block.title} delay={index * 70}>
                <h3 className="text-sm font-medium text-sage-ink">{block.title}</h3>
                <div className="mt-3 space-y-1.5 text-sm leading-relaxed text-forest">
                  {block.lines.map((line) => (
                    <p key={line}>{line}</p>
                  ))}
                </div>
                {block.link ? (
                  <a
                    href={block.link.href}
                    className="mt-3 inline-flex items-center gap-1.5 text-sm font-medium text-forest underline-offset-4 hover:underline"
                    {...(block.link.href.startsWith("http")
                      ? { target: "_blank", rel: "noreferrer noopener" }
                      : {})}
                  >
                    {block.link.label}
                    <ArrowUpRight size={14} aria-hidden="true" />
                  </a>
                ) : null}
              </Reveal>
            ))}
          </div>
        </section>

        {/* Booking */}
        <section id="reserver" className="bg-bone">
          <div className="mx-auto w-full max-w-[1240px] px-6 py-24 md:px-10 lg:py-32">
            <div className="grid items-end gap-8 lg:grid-cols-12">
              <Reveal className="lg:col-span-7">
                <h2 className="max-w-[18ch] text-[clamp(2.2rem,4vw,3.6rem)] font-medium leading-[0.98] tracking-[-0.035em] text-forest">
                  Réserver, en trente secondes.
                </h2>
                <p className="mt-5 max-w-2xl text-base leading-relaxed text-ink lg:max-w-xl">
                  Choisissez un jour et un créneau. Huit places par séance, pas une de plus. Le
                  module ci-dessous est une démonstration complète, du choix du cours à la
                  confirmation.
                </p>
              </Reveal>
              <Reveal className="lg:col-span-5 lg:justify-self-end" delay={100}>
                <ul className="space-y-3 text-sm text-ink">
                  {[
                    "Confirmation immédiate, code unique",
                    "8 places maximum par séance",
                    "Annulation gratuite jusqu'à 12 h avant",
                  ].map((line) => (
                    <li key={line} className="flex items-start gap-3">
                      <span
                        className="mt-1.5 size-1.5 shrink-0 rounded-full bg-sage"
                        aria-hidden="true"
                      />
                      {line}
                    </li>
                  ))}
                </ul>
              </Reveal>
            </div>

            <Reveal className="mt-10 lg:mt-14" delay={80}>
              <BookingModule />
            </Reveal>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-forest text-ecru">
        <div className="mx-auto w-full max-w-[1240px] px-6 pt-20 md:px-10 lg:pt-28">
          <div className="grid gap-12 md:grid-cols-12">
            <div className="md:col-span-5">
              <p className="text-base font-semibold tracking-[0.16em] text-ecru">
                BASIC <span className="text-sage">IT</span>
              </p>
              <p className="mt-4 max-w-xs text-sm leading-relaxed text-sage">
                Studio de coaching à Paris 11e. Force, HIIT et mobilité, en groupes de huit,
                encadrés par un coach.
              </p>
              <p className="mt-6 text-sm leading-relaxed text-sage-soft">
                18 rue de la Folie-Méricourt
                <br />
                75011 Paris
              </p>
            </div>

            <nav aria-label="Navigation de pied de page" className="md:col-span-4">
              <h2 className="text-sm font-medium text-sage">Le studio</h2>
              <ul className="mt-4 space-y-3 text-sm">
                <li>
                  <a href="#concept" className="text-ecru/80 transition-colors hover:text-ecru">
                    Le Concept
                  </a>
                </li>
                <li>
                  <a href="#seances" className="text-ecru/80 transition-colors hover:text-ecru">
                    Nos Séances
                  </a>
                </li>
                <li>
                  <a href="#coachs" className="text-ecru/80 transition-colors hover:text-ecru">
                    Les Coachs
                  </a>
                </li>
                <li>
                  <a href="#reserver" className="text-ecru/80 transition-colors hover:text-ecru">
                    Réserver
                  </a>
                </li>
              </ul>
            </nav>

            <div className="md:col-span-3">
              <h2 className="text-sm font-medium text-sage">Contact</h2>
              <ul className="mt-4 space-y-3 text-sm">
                <li>
                  <a
                    href="mailto:bonjour@basic-it.fr"
                    className="text-ecru/80 transition-colors hover:text-ecru"
                  >
                    bonjour@basic-it.fr
                  </a>
                </li>
                <li>
                  <a
                    href="tel:+33199001234"
                    className="text-ecru/80 transition-colors hover:text-ecru"
                  >
                    01 99 00 12 34
                  </a>
                </li>
                <li className="text-sage">Lun–Ven 7h–21h · Sam 8h–14h</li>
              </ul>
            </div>
          </div>

          <p
            aria-hidden="true"
            className="mt-20 select-none whitespace-nowrap text-[clamp(3rem,15.5vw,13.5rem)] font-medium leading-[0.78] tracking-[-0.055em] text-forest-soft md:mt-24"
          >
            BASIC IT
          </p>

          <div className="flex flex-col gap-3 pb-8 pt-6 text-[13px] leading-relaxed text-sage-soft md:flex-row md:items-center md:justify-between">
            <p className="flex flex-wrap items-center gap-x-4 gap-y-1">
              <span>© 2026 Basic IT. Tous droits réservés.</span>
              <Link
                href="/admin"
                className="underline underline-offset-4 hover:text-ecru"
              >
                Espace admin (démo)
              </Link>
            </p>
            <p>
              Démonstration : paiement simulé, aucune transaction réelle. Photographies :{" "}
              <a
                href="https://www.pexels.com"
                target="_blank"
                rel="noreferrer noopener"
                className="underline underline-offset-4 hover:text-ecru"
              >
                Pexels
              </a>{" "}
              (Assomyron, Engin Akyurt, Ron Lach, Andres Ayrton, Dave Garcia, Tima Miroshnichenko, KoolShooters).
            </p>
          </div>
        </div>
      </footer>
    </>
  );
}
