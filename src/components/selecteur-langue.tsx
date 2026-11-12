"use client";

import "@/app/langues.css";
import "./selecteur-langue.css";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useId, useRef, useState } from "react";
import { enregistrerLanguePreferee, type LangueInterface } from "@/lib/langue-preferee";

/** Langues des informations pratiques de /international. Le code affiché est
 *  celui retenu par le notaire (EN, DEU, 中文) ; l'intitulé est le nom de la
 *  langue dans la langue elle-même, pour qu'un lecteur étranger s'y retrouve. */
const LANGUES: readonly { code: string; nom: string; lang: string; choix: LangueInterface; href: string }[] = [
  { code: "FR", nom: "Français", lang: "fr", choix: "fr", href: "/international" },
  { code: "EN", nom: "English", lang: "en", choix: "en", href: "/international#english" },
  { code: "DEU", nom: "Deutsch", lang: "de", choix: "de", href: "/international#deutsch" },
  { code: "中文", nom: "简体中文（配有口译）", lang: "zh-Hans", choix: "zh", href: "/international#zhongwen" },
];

/**
 * Menu déroulant des langues de l'en-tête (remplace le seul lien « EN »).
 * Motif « disclosure » et non « menu » ARIA : ce sont de simples liens, que
 * la tabulation parcourt naturellement. Échap, un clic extérieur ou un
 * changement de page referment la liste. Le choix est retenu
 * (langue-preferee.ts) pour traduire le bloc « Écrire à l'étude » du contact.
 */
export function SelecteurLangue() {
  const [ouvert, setOuvert] = useState(false);
  const conteneur = useRef<HTMLDivElement>(null);
  const bouton = useRef<HTMLButtonElement>(null);
  const idListe = useId();
  const pathname = usePathname();

  useEffect(() => {
    setOuvert(false);
  }, [pathname]);

  useEffect(() => {
    if (!ouvert) return;
    const clicExterieur = (event: MouseEvent) => {
      if (!conteneur.current?.contains(event.target as Node)) setOuvert(false);
    };
    const echap = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOuvert(false);
        bouton.current?.focus();
      }
    };
    document.addEventListener("mousedown", clicExterieur);
    document.addEventListener("keydown", echap);
    return () => {
      document.removeEventListener("mousedown", clicExterieur);
      document.removeEventListener("keydown", echap);
    };
  }, [ouvert]);

  return (
    <div
      ref={conteneur}
      className="header-language language-menu"
      onBlur={(event) => {
        if (!conteneur.current?.contains(event.relatedTarget as Node | null)) setOuvert(false);
      }}
    >
      <button
        ref={bouton}
        type="button"
        className="language-menu-trigger"
        aria-expanded={ouvert}
        aria-controls={idListe}
        aria-label="Languages / Sprachen / 语言"
        onClick={() => setOuvert((v) => !v)}
      >
        EN · DEU · <span lang="zh-Hans">中文</span>
        <span className="language-menu-chevron" aria-hidden="true">▾</span>
      </button>
      <ul id={idListe} className="language-menu-list" hidden={!ouvert}>
        {LANGUES.map((l) => (
          <li key={l.code}>
            <Link href={l.href} lang={l.lang} onClick={() => { enregistrerLanguePreferee(l.choix); setOuvert(false); }}>
              <span className="language-menu-code">{l.code}</span>
              <span className="language-menu-name">{l.nom}</span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
