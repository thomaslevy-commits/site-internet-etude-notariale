import { etude } from "@/config/etude";

/** Adresse complète sur une ligne, dérivée du NAP unique (§7). */
export const ADRESSE_COMPLETE = `${etude.adresse.ligne1}, ${etude.adresse.codePostal} ${etude.adresse.ville}`;

/**
 * Accès à l'étude — source unique. Ces informations étaient jusqu'ici
 * enfermées dans le plan d'accès du pied de page, tandis que la rubrique
 * « Accès » de /contact affichait un placeholder : deux endroits, une seule
 * vérité. Elles servent aussi d'alternative textuelle à la carte, laquelle
 * n'est chargée qu'après accord du visiteur.
 */
export const ACCES: readonly { readonly cle: string; readonly valeur: string }[] = [
  { cle: "Métro", valeur: "Ligne 2 — Porte Dauphine · Ligne 9 — Rue de la Pompe" },
  { cle: "RER", valeur: "RER C — Avenue Foch" },
  { cle: "Bus", valeur: "Lignes 52 et PC1 — arrêt Flandrin" },
  { cle: "Voiture", valeur: "Stationnement Foch · accès périphérique Porte Dauphine" },
  { cle: "Adresse", valeur: ADRESSE_COMPLETE },
];

/** Requête utilisée pour la carte — voie seule, sans mention d'étage. */
export const REQUETE_CARTE = encodeURIComponent(
  `${etude.adresse.ligne1.split(" — ")[0]}, ${etude.adresse.codePostal} ${etude.adresse.ville}, France`,
);
