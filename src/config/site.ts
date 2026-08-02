/**
 * URL canonique du site (§7). Source unique — aucun module ne doit recalculer
 * cette valeur. Surchargée par NEXT_PUBLIC_SITE_URL (préproduction, local).
 */
export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://levy-notaires.fr";
