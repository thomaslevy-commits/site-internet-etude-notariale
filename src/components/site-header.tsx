"use client";

import Link from "next/link";
import { useState } from "react";
import { etude } from "@/config/etude";

/** Navigation principale — routes du §6 de CLAUDE.md (Contact devient le CTA). */
const navigation = [
  { href: "/etude", label: "L'étude" },
  { href: "/expertises", label: "Expertises" },
  { href: "/tarif", label: "Tarif" },
  { href: "/blog", label: "Blog" },
  { href: "/faq", label: "FAQ" },
] as const;

const navigationMobile = [
  ...navigation,
  { href: "/contact", label: "Contact et rendez-vous" },
] as const;

/** Adresse sans la mention d'étage, pour l'affichage condensé. */
const adresseCourte = etude.adresse.ligne1.split(" — ")[0];

/**
 * Nom de l'étude avec l'arrondissement rendu insécable : replié sur un
 * téléphone, « Paris 16 » se coupait sinon en laissant « 16 » seul sur une
 * ligne. Transformation d'affichage seulement — la valeur de référence de
 * etude.ts, qui alimente les métadonnées et le JSON-LD, reste intacte (§7).
 */
const nomAffiche = etude.nom.replace(/\s(\d+)$/, "\u00A0$1");

/**
 * En-tête global : nom de l'étude à gauche, coordonnées condensées (≥ xl) et
 * navigation (≥ lg) à droite, menu repliable accessible au clavier en deçà.
 * Coordonnées exclusivement depuis etude.ts (§7).
 * Textes dorés sur ivoire en gold-ink — contraste WCAG AA.
 */
export function SiteHeader() {
  const [ouvert, setOuvert] = useState(false);

  return (
    <header className="border-b border-line bg-ivory">
      <div className="mx-auto flex w-full max-w-grid items-center justify-between gap-6 px-6 py-5">
        {/* Le nom se replie sous sm : maintenu insécable, sa largeur
            incompressible dépassait la largeur d'un téléphone une fois le
            bouton de menu placé, et la page défilait latéralement. */}
        <Link
          href="/"
          className="text-balance font-serif text-base font-medium tracking-tight text-night sm:whitespace-nowrap sm:text-xl"
        >
          {nomAffiche}
        </Link>

        <div className="ml-6 mr-5 hidden flex-col items-end whitespace-nowrap border-r border-gold/35 pr-5 leading-tight xl:flex">
          <span className="text-[0.8rem] text-anthracite">
            {adresseCourte} — {etude.adresse.codePostal} {etude.adresse.ville}
          </span>
          <a
            href={`tel:${etude.telephoneE164}`}
            className="text-[0.85rem] font-medium tracking-wide text-night no-underline"
          >
            {etude.telephone}
          </a>
        </div>

        <nav aria-label="Navigation principale" className="hidden lg:block">
          <div className="flex flex-col items-end gap-2">
            <ul className="flex items-center gap-5">
              {navigation.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className="text-sm text-anthracite decoration-gold underline-offset-4 transition-colors hover:text-night hover:underline"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
              <li>
                <Link
                  href="/contact"
                  className="inline-block whitespace-nowrap rounded-[2px] bg-night px-4 py-2.5 text-[0.8rem] tracking-wide text-ivory no-underline transition-colors hover:bg-gold"
                >
                  Prendre rendez-vous
                </Link>
              </li>
            </ul>
            <div className="flex items-center gap-3 text-[0.72rem] uppercase tracking-[0.05em] text-gold-ink">
              <Link
                href="/data-room"
                className="border-b border-transparent pb-px no-underline transition-colors hover:border-gold"
              >
                Accès Data Room
              </Link>
              <span className="opacity-60">·</span>
              <Link
                href="/paiement"
                className="border-b border-transparent pb-px no-underline transition-colors hover:border-gold"
              >
                Paiement en ligne
              </Link>
            </div>
          </div>
        </nav>

        <button
          type="button"
          className="text-sm text-night lg:hidden"
          aria-expanded={ouvert}
          aria-controls="menu-mobile"
          onClick={() => setOuvert(!ouvert)}
        >
          {ouvert ? "Fermer" : "Menu"}
        </button>
      </div>

      {ouvert ? (
        <nav
          id="menu-mobile"
          aria-label="Navigation principale"
          className="border-t border-line px-6 py-4 lg:hidden"
        >
          <ul className="flex flex-col gap-4">
            {navigationMobile.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className="text-anthracite decoration-gold underline-offset-4 hover:text-night hover:underline"
                  onClick={() => setOuvert(false)}
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      ) : null}
    </header>
  );
}
