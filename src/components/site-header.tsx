"use client";

import Link from "next/link";
import { useEffect, useState, useCallback } from "react";
import { etude } from "@/config/etude";

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

const adresseCourte = etude.adresse.ligne1.split(" — ")[0];

const nomAffiche = etude.nom.replace(/\s(\d+)$/, " $1");

export function SiteHeader() {
  const [ouvert, setOuvert] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    function onScroll() {
      setScrolled(window.scrollY > 20);
    }
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (!ouvert) return;
    function surTouche(e: KeyboardEvent) {
      if (e.key === "Escape") setOuvert(false);
    }
    document.addEventListener("keydown", surTouche);
    return () => document.removeEventListener("keydown", surTouche);
  }, [ouvert]);

  useEffect(() => {
    if (ouvert) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [ouvert]);

  const fermer = useCallback(() => setOuvert(false), []);

  return (
    <header
      className={`fixed left-0 right-0 top-0 z-50 transition-all duration-500 ${
        scrolled
          ? "bg-ivory/95 shadow-[0_1px_12px_rgba(16,28,44,0.06)] backdrop-blur-md"
          : "bg-ivory"
      }`}
    >
      {/* ── Bandeau supérieur : coordonnées ── */}
      <div
        className={`border-b border-line overflow-hidden transition-all duration-500 ${
          scrolled ? "max-h-0 border-transparent" : "max-h-12"
        }`}
      >
        <div className="mx-auto flex max-w-grid items-center justify-between px-6 py-2">
          <div className="hidden items-center gap-6 text-[0.7rem] uppercase tracking-[0.14em] text-gold-ink md:flex">
            <span>
              {adresseCourte} — {etude.adresse.codePostal} {etude.adresse.ville}
            </span>
            <span className="h-3 w-px bg-line" aria-hidden="true" />
            <a
              href={`tel:${etude.telephoneE164}`}
              className="no-underline transition-colors hover:text-night"
            >
              {etude.telephone}
            </a>
            <span className="h-3 w-px bg-line" aria-hidden="true" />
            <a
              href={`mailto:${etude.email}`}
              className="no-underline transition-colors hover:text-night"
            >
              {etude.email}
            </a>
          </div>
          <div className="flex items-center gap-5 text-[0.7rem] uppercase tracking-[0.08em] text-gold-ink md:gap-6">
            <a
              href={etude.liens.dataRoom}
              target="_blank"
              rel="noopener noreferrer"
              className="no-underline transition-colors hover:text-night"
            >
              Data Room
              <span className="sr-only"> (nouvelle fenêtre)</span>
            </a>
          </div>
        </div>
      </div>

      {/* ── Barre principale ── */}
      <div className="mx-auto flex max-w-grid items-center justify-between px-6 py-4">
        <Link
          href="/"
          className="group flex items-center gap-3 no-underline"
        >
          {/* Monogramme TL stylisé */}
          <span
            className="flex h-10 w-10 items-center justify-center rounded-full border border-gold/40 text-sm font-semibold tracking-wide text-gold transition-colors group-hover:border-gold group-hover:bg-gold/5"
            aria-hidden="true"
          >
            TL
          </span>
          <span className="text-balance font-serif text-lg font-medium tracking-tight text-night sm:text-xl">
            {nomAffiche}
          </span>
        </Link>

        {/* Navigation desktop */}
        <nav aria-label="Navigation principale" className="hidden lg:block">
          <ul className="flex items-center gap-7">
            {navigation.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className="relative text-[0.72rem] uppercase tracking-[0.16em] text-anthracite no-underline transition-colors after:absolute after:-bottom-1 after:left-0 after:h-px after:w-0 after:bg-gold after:transition-all after:duration-300 hover:text-night hover:after:w-full"
                >
                  {item.label}
                </Link>
              </li>
            ))}
            <li>
              <Link
                href="/contact"
                className="inline-block whitespace-nowrap border border-night bg-night px-5 py-2.5 text-[0.72rem] uppercase tracking-[0.12em] text-ivory no-underline transition-all duration-300 hover:bg-transparent hover:text-night"
              >
                Prendre rendez-vous
              </Link>
            </li>
          </ul>
        </nav>

        {/* Bouton hamburger mobile */}
        <button
          type="button"
          className="relative z-50 flex h-10 w-10 flex-col items-center justify-center gap-[5px] lg:hidden"
          aria-expanded={ouvert}
          aria-controls="menu-mobile"
          aria-label={ouvert ? "Fermer le menu" : "Ouvrir le menu"}
          onClick={() => setOuvert(!ouvert)}
        >
          <span
            className={`block h-px w-5 bg-night transition-all duration-300 ${
              ouvert ? "translate-y-[6px] rotate-45" : ""
            }`}
          />
          <span
            className={`block h-px w-5 bg-night transition-all duration-300 ${
              ouvert ? "opacity-0" : ""
            }`}
          />
          <span
            className={`block h-px w-5 bg-night transition-all duration-300 ${
              ouvert ? "-translate-y-[6px] -rotate-45" : ""
            }`}
          />
        </button>
      </div>

      {/* ── Menu mobile plein écran ── */}
      <nav
        id="menu-mobile"
        aria-label="Navigation principale"
        className={`fixed inset-0 z-40 flex flex-col bg-ivory transition-all duration-500 lg:hidden ${
          ouvert
            ? "visible opacity-100"
            : "invisible opacity-0"
        }`}
        style={{ paddingTop: "6rem" }}
      >
        <div className="flex flex-1 flex-col items-center justify-center gap-1 px-6">
          <ul className="flex flex-col items-center gap-6">
            {navigationMobile.map((item, i) => (
              <li
                key={item.href}
                className={`transition-all duration-500 ${
                  ouvert
                    ? "translate-y-0 opacity-100"
                    : "translate-y-4 opacity-0"
                }`}
                style={{
                  transitionDelay: ouvert ? `${100 + i * 60}ms` : "0ms",
                }}
              >
                <Link
                  href={item.href}
                  className="font-serif text-2xl text-night no-underline transition-colors hover:text-gold-ink sm:text-3xl"
                  onClick={fermer}
                >
                  {item.label}
                </Link>
              </li>
            ))}
            <li
              className={`mt-4 transition-all duration-500 ${
                ouvert
                  ? "translate-y-0 opacity-100"
                  : "translate-y-4 opacity-0"
              }`}
              style={{
                transitionDelay: ouvert
                  ? `${100 + navigationMobile.length * 60}ms`
                  : "0ms",
              }}
            >
              <a
                href={etude.liens.dataRoom}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm uppercase tracking-[0.12em] text-gold-ink no-underline transition-colors hover:text-night"
                onClick={fermer}
              >
                Accès Data Room
                <span className="sr-only"> (nouvelle fenêtre)</span>
              </a>
            </li>
          </ul>
        </div>
        <div className="border-t border-line px-6 py-6 text-center text-[0.75rem] text-slate-soft">
          <a
            href={`tel:${etude.telephoneE164}`}
            className="no-underline hover:text-night"
          >
            {etude.telephone}
          </a>
          <span className="mx-3">·</span>
          <span>
            {adresseCourte}, {etude.adresse.codePostal} {etude.adresse.ville}
          </span>
        </div>
      </nav>

      {/* Filet doré subtil en bas du header */}
      <div className="h-px bg-gradient-to-r from-transparent via-gold/30 to-transparent" />
    </header>
  );
}
