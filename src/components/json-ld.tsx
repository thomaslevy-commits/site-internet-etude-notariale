import { etude } from "@/config/etude";
import { SITE_URL } from "@/config/site";
import type { ArticleFrontmatter } from "@/lib/content";

/**
 * Sérialisation JSON-LD unique (§7) — échappement de « < » pour
 * prévenir toute injection dans le script inline.
 */
export function JsonLd({ data }: { data: Record<string, unknown> }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(data).replace(/</g, "\\u003c"),
      }}
    />
  );
}

/** Schéma Notary (LegalService/LocalBusiness) — accueil et contact (§7). */
export function schemaNotary(): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "Notary",
    name: etude.nom,
    url: SITE_URL,
    telephone: etude.telephoneE164,
    email: etude.email,
    address: {
      "@type": "PostalAddress",
      streetAddress: etude.adresse.ligne1,
      postalCode: etude.adresse.codePostal,
      addressLocality: etude.adresse.ville,
      addressCountry: "FR",
    },
    openingHoursSpecification: {
      "@type": "OpeningHoursSpecification",
      dayOfWeek: [...etude.horairesSchema.jours],
      opens: etude.horairesSchema.ouverture,
      closes: etude.horairesSchema.fermeture,
    },
    founder: {
      "@type": "Person",
      name: etude.nomNotaire,
      jobTitle: "Notaire",
    },
    areaServed: {
      "@type": "AdministrativeArea",
      name: "Paris et Île-de-France",
    },
    knowsLanguage: [...etude.languesIso],
    ...(etude.liens.googleMaps ? { hasMap: etude.liens.googleMaps } : {}),
  };
}

export interface MaillonSchema {
  label: string;
  href?: string;
}

/** Schéma BreadcrumbList — toute page de profondeur ≥ 2 (§7). */
export function schemaFilAriane(
  maillons: MaillonSchema[],
): Record<string, unknown> {
  const complets: MaillonSchema[] = [{ label: "Accueil", href: "/" }, ...maillons];
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: complets.map((maillon, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: maillon.label,
      ...(maillon.href ? { item: `${SITE_URL}${maillon.href}` } : {}),
    })),
  };
}

/** Schéma FAQPage — /faq et blocs FAQ des pages d'expertise (§7). */
export function schemaFaq(
  entrees: { question: string; reponse: string }[],
): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: entrees.map((entree) => ({
      "@type": "Question",
      name: entree.question,
      acceptedAnswer: { "@type": "Answer", text: entree.reponse },
    })),
  };
}

/** Schéma Article + Person — articles de blog (§7). */
export function schemaArticle(
  frontmatter: ArticleFrontmatter,
): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: frontmatter.title,
    datePublished: frontmatter.date,
    author: { "@type": "Person", name: frontmatter.author },
    inLanguage: "fr",
    mainEntityOfPage: `${SITE_URL}/blog/${frontmatter.categorie}/${frontmatter.slug}`,
  };
}
