import { etude } from "@/config/etude";

/**
 * URL canonique du site (§7) — dérivée du NAP validé (etude.siteUrl),
 * source unique. Surchargée par NEXT_PUBLIC_SITE_URL (préproduction, local).
 */
export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? etude.siteUrl;
