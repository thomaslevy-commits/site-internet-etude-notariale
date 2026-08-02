import type { ExpertiseSlug } from "@/lib/content";

/**
 * Titles SEO des pages d'expertise (dossier de conception, §IV) — ≤ 60
 * caractères, marque et localisation incluses. Le champ seoTitle du
 * frontmatter MDX, s'il est renseigné, prime sur ces valeurs.
 */
export const SEO_TITLES: Record<ExpertiseSlug, string> = {
  "immobilier-residentiel": "Notaire achat immobilier Paris — Étude Thomas Lévy",
  "immobilier-commercial": "Notaire immobilier commercial — Étude Thomas Lévy, Paris",
  vefa: "Notaire VEFA Paris — Étude Thomas Lévy, Paris 16",
  "promotion-immobiliere": "Notaire promotion immobilière — Étude Thomas Lévy, Paris",
  "marchands-de-biens": "Notaire marchand de biens — Étude Thomas Lévy, Paris 16",
  sci: "Notaire SCI Paris — Étude Thomas Lévy, Paris 16",
  "fiscalite-immobiliere": "Fiscalité immobilière — Étude notariale Thomas Lévy, Paris",
  successions: "Notaire succession Paris — Étude Thomas Lévy, Paris 16",
  "successions-internationales": "Succession internationale — Étude Thomas Lévy, Paris 16",
  donations: "Notaire donation Paris — Étude Thomas Lévy, Paris 16",
  partage: "Partage notarié — Étude Thomas Lévy, Paris 16",
  divorce: "Notaire et divorce — Étude Thomas Lévy, Paris 16",
  "structuration-patrimoniale": "Structuration patrimoniale — Étude Thomas Lévy, Paris 16",
  "transmission-entreprise": "Transmission d'entreprise — Étude Thomas Lévy, Paris 16",
  "baux-commerciaux": "Notaire bail commercial — Étude Thomas Lévy, Paris 16",
  expatries: "Notaire pour expatriés — Étude Thomas Lévy, Paris 16",
  "investisseurs-etrangers": "Notaire investisseurs étrangers — Étude T. Lévy, Paris",
  "family-office": "Notaire family office — Étude Thomas Lévy, Paris 16",
};
