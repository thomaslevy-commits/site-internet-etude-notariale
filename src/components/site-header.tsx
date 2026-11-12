"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Marque } from "@/components/marque";
import { etude } from "@/config/etude";
import { NAVIGATION } from "@/config/navigation";
import { RechercheGlobale } from "@/components/recherche-globale";
import type { EntreeRecherche } from "@/lib/recherche";

/** Le dialogue natif isole le menu, retient le focus et gère Échap.
 *  L'en-tête reste dans le flux : aucune hauteur à deviner dans les pages. */
export interface SiteHeaderProps {
  /** Index de la recherche globale, construit par le layout côté serveur :
   *  l'en-tête est un composant client et ne lit pas le disque. */
  indexRecherche: EntreeRecherche[];
}

export function SiteHeader({ indexRecherche }: SiteHeaderProps) {
  const pathname = usePathname();
  const dialogue = useRef<HTMLDialogElement>(null);
  const bouton = useRef<HTMLButtonElement>(null);
  const [ouvert, setOuvert] = useState(false);
  const reservation = process.env.NEXT_PUBLIC_BOOKING_URL;
  const rdvHref = reservation || "/contact";
  const rdvLabel = reservation
    ? "Prendre rendez-vous"
    : "Demander un rendez-vous";

  function fermer() {
    dialogue.current?.close();
  }
  useEffect(() => {
    dialogue.current?.close();
  }, [pathname]);
  useEffect(() => {
    if (!ouvert) return;
    const avant = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const grandEcran = window.matchMedia("(min-width: 1200px)");
    const replier = () => {
      if (grandEcran.matches) dialogue.current?.close();
    };
    grandEcran.addEventListener("change", replier);
    return () => {
      document.body.style.overflow = avant;
      grandEcran.removeEventListener("change", replier);
    };
  }, [ouvert]);

  const actif = (href: string) =>
    pathname === href || pathname.startsWith(`${href}/`);
  return (
    <header className="site-header">
      <div className="site-container header-main">
        <Link href="/" aria-label="Thomas Lévy, notaire — accueil">
          <Marque />
        </Link>
        <nav aria-label="Navigation principale" className="desktop-navigation">
          <ul>
            {NAVIGATION.map((lien) => (
              <li key={lien.href}>
                <Link
                  href={lien.href}
                  aria-current={actif(lien.href) ? "page" : undefined}
                >
                  {lien.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <RechercheGlobale index={indexRecherche} />
        <Link href="/international#english" className="header-language" lang="en" aria-label="Read practical information in English">EN <span aria-hidden="true">↗</span></Link>
        <Link href={rdvHref} className="button button-primary header-rdv">
          {rdvLabel}
          <span aria-hidden="true">↗</span>
        </Link>
        <button
          ref={bouton}
          type="button"
          className="menu-toggle"
          aria-haspopup="dialog"
          aria-controls="menu-mobile"
          aria-expanded={ouvert}
          onClick={() => {
            dialogue.current?.showModal();
            setOuvert(true);
          }}
        >
          Menu <span className="menu-lines" aria-hidden="true"><span /><span /></span>
        </button>
      </div>
      <dialog
        id="menu-mobile"
        ref={dialogue}
        className="mobile-dialog"
        aria-labelledby="menu-title"
        onClose={() => {
          setOuvert(false);
          bouton.current?.focus();
        }}
        onClick={(event) => {
          if (event.target === dialogue.current) fermer();
        }}
      >
        <div className="mobile-panel">
          <div className="flex items-center justify-between gap-4">
            <h2 id="menu-title" className="eyebrow">
              Explorer le site
            </h2>
            <button
              type="button"
              onClick={fermer}
              className="menu-close"
              autoFocus
            >
              Fermer <span aria-hidden="true">×</span>
            </button>
          </div>
          <nav aria-label="Navigation mobile">
            <ul className="mobile-links">
              {[
                { href: "/", label: "Accueil" },
                ...NAVIGATION,
                { href: "/faq", label: "Questions fréquentes" },
                { href: "/contact", label: "Contact & accès" },
              ].map((lien) => (
                <li key={lien.href}>
                  <Link
                    href={lien.href}
                    aria-current={actif(lien.href) ? "page" : undefined}
                    onClick={fermer}
                  >
                    {lien.label}
                    <span aria-hidden="true">↗</span>
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
          <Link
            href={rdvHref}
            onClick={fermer}
            className="button button-primary mt-7"
          >
            {rdvLabel}
          </Link>
          <p className="mobile-location">{etude.adresse.ligne1}<br />{etude.adresse.codePostal} {etude.adresse.ville} · Français, English, Deutsch, <span lang="zh-Hans">中文</span></p>
          <a className="mt-6 block" href={`tel:${etude.telephoneE164}`}>
            {etude.telephone}
          </a>
        </div>
      </dialog>
    </header>
  );
}
