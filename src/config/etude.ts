/**
 * Source unique des coordonnées et informations de l'étude (CLAUDE.md §7).
 * Aucune coordonnée ne doit figurer en dur dans un composant : tout provient d'ici.
 * Le NAP reste en placeholder — à renseigner par le notaire (bloquant en production).
 */
export const PLACEHOLDER_ETUDE = "[CONTENU À VALIDER — NE PAS PUBLIER]";

export const etude = {
  nom: "Étude Thomas Lévy — Notaire à Paris",
  denominationComplete: "Maître Thomas Lévy, notaire à Paris",
  adresse: {
    ligne1: PLACEHOLDER_ETUDE,
    codePostal: PLACEHOLDER_ETUDE,
    ville: "Paris",
    pays: "France",
  },
  telephone: PLACEHOLDER_ETUDE,
  email: PLACEHOLDER_ETUDE,
  horaires: "Du lundi au vendredi, de 9 h à 19 h, sur rendez-vous.",
  langues: ["français", "anglais"],
  liens: {
    /** Fiche Google Maps de l'étude (lien statique — pas d'iframe, §8). */
    googleMaps: "https://maps.google.com/?cid=15064672117259351290",
    /** Fiche Google Business Profile (avis) — même fiche que Maps. */
    ficheGoogle: "https://maps.google.com/?cid=15064672117259351290",
  },
} as const;

export type Etude = typeof etude;
