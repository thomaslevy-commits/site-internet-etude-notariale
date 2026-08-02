/**
 * Source unique des coordonnées et informations de l'étude (CLAUDE.md §7).
 * Aucune coordonnée ne doit figurer en dur dans un composant : tout provient d'ici.
 * NAP complet renseigné le 2 août 2026 (adresse, téléphone et e-mail fournis par le notaire).
 */
export const PLACEHOLDER_ETUDE = "[CONTENU À VALIDER — NE PAS PUBLIER]";

export const etude = {
  nom: "Étude Notariale Thomas Lévy — Paris 16",
  denominationComplete: "Maître Thomas Lévy, notaire à Paris",
  adresse: {
    ligne1: "11, boulevard Flandrin — 2ᵉ étage",
    codePostal: "75116",
    ville: "Paris",
    pays: "France",
  },
  telephone: "01 40 75 05 55",
  /** Format E.164 pour les liens tel: et les données structurées Schema.org. */
  telephoneE164: "+33140750555",
  email: "contact@levy-notaires.fr",
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
