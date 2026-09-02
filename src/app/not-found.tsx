import type { Metadata } from "next";
import Link from "next/link";
import { etude } from "@/config/etude";

export const metadata: Metadata = {
  title: { absolute: "Page introuvable — Étude Thomas Lévy, notaire à Paris" },
  robots: { index: false, follow: true },
};

const PISTES = [
  { href: "/expertises", label: "Nos expertises" },
  { href: "/etude", label: "L'étude" },
  { href: "/tarif", label: "Comprendre le tarif" },
  { href: "/faq", label: "Questions fréquentes" },
  { href: "/contact", label: "Contact et rendez-vous" },
] as const;

/**
 * Page 404 aux couleurs de l'étude : le rendu par défaut de Next était servi
 * en l'état, sans repère ni sortie. Elle rattache le visiteur au site plutôt
 * que de le laisser sur une impasse — et, jusqu'à présent, deux liens de
 * l'en-tête y menaient sur toutes les pages.
 */
export default function PageIntrouvable() {
  return (
    <main className="mx-auto w-full max-w-grid px-6 py-24">
      <div aria-hidden="true" className="mb-5 h-px w-10 bg-gold" />
      <h1 className="font-serif text-4xl font-medium tracking-tight text-night">
        Cette page n&apos;existe pas
      </h1>
      <p className="mt-6 max-w-2xl text-slate-soft">
        L&apos;adresse demandée ne correspond à aucune page du site. Elle a pu
        être modifiée, ou le lien qui vous a conduit ici comporte une erreur.
      </p>

      <nav aria-label="Pages principales" className="mt-10">
        <ul className="flex flex-wrap gap-3">
          {PISTES.map((piste) => (
            <li key={piste.href}>
              <Link
                href={piste.href}
                className="inline-block rounded-sm border border-line bg-paper px-4 py-2 text-sm text-night transition-colors hover:bg-ivory"
              >
                {piste.label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      <p className="mt-10 text-sm text-slate-soft">
        L&apos;étude peut également être jointe au{" "}
        <a
          href={`tel:${etude.telephoneE164}`}
          className="text-night decoration-gold underline underline-offset-4 hover:text-anthracite"
        >
          {etude.telephone}
        </a>
        .
      </p>
    </main>
  );
}
