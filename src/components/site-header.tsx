"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
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
const nomAffiche = etude.nom.replace(/\s(\d+)$/, " $1");

/**
 * En-tête global : nom de l'étude à gauche, coordonnées condensées (≥ xl) et
 * navigation (≥ lg) à droite, menu repliable accessible au clavier en deçà.
 * Coordonnées exclusivement depuis etude.ts (§7).
 * Textes dorés sur ivoire en gold-ink — contraste WCAG AA.
 */
export function SiteHeader() {
  const [ouvert, setOuvert] = useState(false);

  // Échap referme le menu : sans cela, un visiteur au clavier doit parcourir
  // tous les liens pour en sortir.
  useEffect(() => {
    if (!ouvert) return;
    function surTouche(evenement: KeyboardEvent) {
      if (evenement.key === "Escape") setOuvert(false);
    }
    document.addEventListener("keydown", surTouche);
    return () => document.removeEventListener("keydown", surTouche);
  }, [ouvert]);

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
                  // Survol en anthracite et non en or : ivoire sur or ne
                  // vaut que 3,06:1, en deçà du seuil AA pour ce corps de
                  // texte. Seul ce contraste s'oppose ici au doré ; le §5 qui
                  // proscrivait le bouton doré est abrogé le 3 septembre 2026.
                  className="inline-block whitespace-nowrap rounded-[2px] bg-night px-4 py-2.5 text-[0.8rem] tracking-wide text-ivory no-underline transition-colors hover:bg-anthracite"
                >
                  Prendre rendez-vous
                </Link>
              </li>
            </ul>
            <div className="flex items-center gap-3 text-[0.72rem] uppercase tracking-[0.05em] text-gold-ink">
              {/* Service externe : lien sortant, et non route interne — le
                  chemin /data-room ne correspondait à aucune page et servait
                  donc une erreur 404 sur toutes les pages du site. Ouverture
                  dans un nouvel onglet, mention restituée aux lecteurs
                  d'écran (§10).
                  L'entrée « Paiement en ligne » est retirée pour la même
                  raison : /paiement n'existe pas davantage, et aucune
                  destination n'est arrêtée. Elle relève de la phase 2 (§2) et
                  sera rétablie lorsqu'un prestataire aura été retenu. */}
              <a
                href={etude.liens.dataRoom}
                target="_blank"
                rel="noopener noreferrer"
                className="border-b border-transparent pb-px no-underline transition-colors hover:border-gold"
              >
                Accès Data Room
                <span className="sr-only"> (nouvelle fenêtre)</span>
              </a>
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

      {/* Le menu est toujours dans le document, replié par l'attribut hidden :
          l'aria-controls du bouton désigne ainsi un élément qui existe en
          permanence, ce qui n'était pas le cas lorsqu'il était démonté. */}
      <nav
        id="menu-mobile"
        hidden={!ouvert}
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
          <li>
            <a
              href={etude.liens.dataRoom}
              target="_blank"
              rel="noopener noreferrer"
              className="text-anthracite decoration-gold underline-offset-4 hover:text-night hover:underline"
              onClick={() => setOuvert(false)}
            >
              Accès Data Room
              <span className="sr-only"> (nouvelle fenêtre)</span>
            </a>
          </li>
        </ul>
      </nav>
    </header>
  );
}
