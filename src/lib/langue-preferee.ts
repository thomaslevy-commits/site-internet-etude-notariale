import { useEffect, useState } from "react";

/**
 * Langue choisie par le visiteur dans le menu des langues de l'en-tête.
 * Conservée dans le stockage local du navigateur sous la clé « langue » :
 * traceur de personnalisation de l'interface demandée par l'utilisateur,
 * exempté de consentement (art. 82 loi n° 78-17 ; lignes directrices CNIL
 * du 17 septembre 2020) et déclaré dans content/legal/cookies.mdx.
 * Toute lecture ou écriture est protégée : navigation privée ou stockage
 * bloqué ramènent simplement au français.
 */
export const LANGUES_INTERFACE = ["fr", "en", "de", "zh"] as const;
export type LangueInterface = (typeof LANGUES_INTERFACE)[number];

const CLE = "langue";
const EVENEMENT = "langue-preferee";

function estLangue(valeur: unknown): valeur is LangueInterface {
  return typeof valeur === "string" && (LANGUES_INTERFACE as readonly string[]).includes(valeur);
}

export function lireLanguePreferee(): LangueInterface {
  try {
    const parametre = new URLSearchParams(window.location.search).get("lang");
    if (estLangue(parametre)) return parametre;
    const stockee = window.localStorage.getItem(CLE);
    if (estLangue(stockee)) return stockee;
  } catch {
    /* stockage indisponible : français */
  }
  return "fr";
}

export function enregistrerLanguePreferee(langue: LangueInterface) {
  try {
    if (langue === "fr") window.localStorage.removeItem(CLE);
    else window.localStorage.setItem(CLE, langue);
  } catch {
    /* stockage indisponible : le choix vaut pour la page seulement */
  }
  window.dispatchEvent(new CustomEvent(EVENEMENT));
}

export function suivreLanguePreferee(rappel: () => void): () => void {
  window.addEventListener(EVENEMENT, rappel);
  window.addEventListener("storage", rappel);
  return () => {
    window.removeEventListener(EVENEMENT, rappel);
    window.removeEventListener("storage", rappel);
  };
}

/** Langue choisie, pour un composant client. Rendu serveur en français ;
 *  la langue retenue s'applique dès l'hydratation et suit tout changement. */
export function useLanguePreferee(): LangueInterface {
  const [langue, setLangue] = useState<LangueInterface>("fr");
  useEffect(() => {
    const appliquer = () => setLangue(lireLanguePreferee());
    appliquer();
    return suivreLanguePreferee(appliquer);
  }, []);
  return langue;
}
