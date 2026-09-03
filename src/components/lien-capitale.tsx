import Link from "next/link";
import type { ReactNode } from "react";

/**
 * Lien de renvoi en petites capitales espacées, souligné d'un filet doré
 * qui s'éloigne au survol. C'est l'écriture des liens « En savoir plus »
 * observée sur les sites des maisons de gestion privée, retenue le
 * 3 septembre 2026 comme signature typographique de la refonte : elle
 * remplace les liens soulignés en corps de texte partout où un bloc
 * renvoie vers une page de fond.
 */
export function LienCapitale({
  href,
  children,
  surFondSombre = false,
  externe = false,
}: {
  href: string;
  children: ReactNode;
  /** Sur night : texte ivoire au lieu de night. */
  surFondSombre?: boolean;
  /** Lien sortant : nouvel onglet, mention restituée aux lecteurs d'écran. */
  externe?: boolean;
}) {
  const classes = [
    "inline-block border-b border-gold pb-1 text-[0.72rem] uppercase tracking-[0.2em] no-underline transition-[padding-bottom,border-color] hover:pb-2",
    surFondSombre
      ? "text-ivory hover:border-ivory"
      : "text-night hover:border-night",
  ].join(" ");

  if (externe) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" className={classes}>
        {children}
        <span className="sr-only"> (nouvelle fenêtre)</span>
      </a>
    );
  }
  return (
    <Link href={href} className={classes}>
      {children}
    </Link>
  );
}
