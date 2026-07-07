"use client";

import Link from "next/link";
import { useState } from "react";
import { etude } from "@/config/etude";

/** Navigation principale — routes du §6 de CLAUDE.md. */
const navigation = [
  { href: "/etude", label: "L'étude" },
  { href: "/expertises", label: "Expertises" },
  { href: "/honoraires", label: "Honoraires" },
  { href: "/blog", label: "Blog" },
  { href: "/faq", label: "FAQ" },
  { href: "/contact", label: "Contact" },
] as const;

/**
 * En-tête global : identité à gauche, navigation à droite,
 * menu repliable accessible au clavier sur mobile.
 */
export function SiteHeader() {
  const [ouvert, setOuvert] = useState(false);

  return (
    <header className="border-b border-line bg-ivory">
      <div className="mx-auto flex w-full max-w-grid items-center justify-between px-6 py-5">
        <Link
          href="/"
          className="font-serif text-xl font-medium tracking-tight text-night"
        >
          {etude.nom}
        </Link>

        <nav aria-label="Navigation principale" className="hidden md:block">
          <ul className="flex items-center gap-8">
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
          </ul>
        </nav>

        <button
          type="button"
          className="text-sm text-night md:hidden"
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
          className="border-t border-line px-6 py-4 md:hidden"
        >
          <ul className="flex flex-col gap-4">
            {navigation.map((item) => (
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
